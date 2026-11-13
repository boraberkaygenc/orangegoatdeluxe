// GNC Terminal — backfill job: fills the layered store in phases — prices10y (10 years of daily bars per instrument into
// data/series, 4 concurrent, 250 ms apart), edgar (all US companies), isy (all BIST companies), membership (index history).
// Resumes from the checkpoint doc status/backfill = { phases: { <name>: { done, total, state, lastSymbol } }, startedAt, updatedAt, note, running },
// waits while a refresh is running, runs nightly at config.backfillAt until every phase is done and can be started/stopped
// from POST /api/backfill. Companies that are done are remembered in data/backfill_prices.json so young listings are not re-fetched.
import { yahooChart, yahooSymbol, errMsg } from './data.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const PHASES = ['prices10y', 'edgar', 'isy', 'membership'];

export function createBackfill({ db, put, log, inbox, coll, config, store2, data, edgar, isy, membership, health }) {
  const doc = () => db.docs['status/backfill'] || { phases: Object.fromEntries(PHASES.map(p => [p, { done: 0, total: 0, state: 'pending', lastSymbol: null }])), startedAt: null, updatedAt: null, note: '', running: false };
  let stopFlag = false, running = null, saveT = 0;
  function save(d, force) { d.updatedAt = new Date().toISOString(); if (force || Date.now() - saveT > 3000) { saveT = Date.now(); put('status/backfill', d); } else db.docs['status/backfill'] = d; }
  async function waitForIdle() { let waited = 0; while (data.isRunning() && !stopFlag) { if (!waited) log('backfill: waiting for the running refresh'); await sleep(5000); waited++; } }
  const targets = () => coll('instruments').filter(([, x]) => yahooSymbol(x)).sort((a, b) => a[1].symbol < b[1].symbol ? -1 : 1);

  async function prices10y(d) {
    const ph = d.phases.prices10y, done = store2.readSide('backfill_prices', { done: {}, failed: {} }), all = targets(); done.failed = done.failed || {};
    const queue = all.filter(([, x]) => !done.done[x.symbol] && (done.failed[x.symbol] || 0) < 3); // 3 failed attempts = given up (delisted or unknown to Yahoo)
    ph.total = all.length; ph.done = all.length - queue.length; ph.state = 'running'; save(d, true);
    let idx = 0, fails = 0, firstErr = null, n = 0;
    async function work() {
      while (idx < queue.length && !stopFlag) {
        await waitForIdle(); if (stopFlag) break; const [, x] = queue[idx++];
        try { const got = await yahooChart(yahooSymbol(x), '10y'); if (!got.bars.length) throw new Error('no bars'); store2.writeSeries(x.symbol, { bars: got.bars, splits: got.splits, source: 'Yahoo Finance (10y backfill)' }); done.done[x.symbol] = got.bars[0][0]; delete done.failed[x.symbol]; ph.lastSymbol = x.symbol; }
        catch (e) { fails++; done.failed[x.symbol] = (done.failed[x.symbol] || 0) + 1; const why = errMsg(e); if (!firstErr) firstErr = `${x.symbol}: ${why}`; if (/HTTP 429/.test(why)) { log('backfill: rate limited, pausing 60 s'); await sleep(60000); } }
        ph.done++; n++; if (n % 10 === 0) { store2.writeSide('backfill_prices', done); save(d); } await sleep(250);
      }
    }
    await Promise.all(Array.from({ length: config.concurrency || 4 }, work));
    store2.writeSide('backfill_prices', done);
    const left = all.filter(([, x]) => !done.done[x.symbol] && (done.failed[x.symbol] || 0) < 3).length; ph.done = all.length - left;
    ph.state = stopFlag ? 'stopped' : left === 0 ? 'done' : (fails && fails >= queue.length && queue.length > 10 ? 'failed' : 'pending');
    ph.note = `${queue.length - fails} series written, ${fails} failed${firstErr ? ' (first error ' + firstErr + ')' : ''}${Object.keys(done.failed).filter(s => done.failed[s] >= 3).length ? '; given up: ' + Object.keys(done.failed).filter(s => done.failed[s] >= 3).slice(0, 10).join(', ') : ''}`; save(d, true); return fails;
  }
  async function fundPhase(d, name, mod) {
    const ph = d.phases[name], all = coll('instruments').filter(([, x]) => x.cls === (name === 'edgar' ? 'US_EQ' : 'TR_EQ')); ph.total = all.length; ph.done = all.length - mod.pending(); ph.state = 'running'; save(d, true);
    let loops = 0; while (mod.pending() > 0 && !stopFlag && loops < 12) { await waitForIdle(); if (stopFlag) break; const r = await mod.runSlice({ reason: 'backfill', n: config[name + 'PerRun'] || (name === 'edgar' ? 120 : 150), onItem: s => { ph.done = Math.min(ph.total, ph.done + 1); ph.lastSymbol = s; save(d); } }); loops++; if (r && r.fails && r.ok === 0) { ph.note = r.note; break; } }
    ph.done = all.length - mod.pending(); ph.state = stopFlag ? 'stopped' : mod.pending() === 0 ? 'done' : 'pending'; save(d, true);
  }
  async function membershipPhase(d) { const ph = d.phases.membership; ph.total = 1; ph.state = 'running'; save(d, true); try { await membership.refresh('backfill'); ph.done = 1; ph.state = 'done'; } catch (e) { ph.state = 'pending'; ph.note = errMsg(e); } save(d, true); }

  function complete() { const d = doc(); return PHASES.every(p => d.phases[p] && d.phases[p].state === 'done'); }
  async function run(reason = 'schedule', only = null) {
    if (running) return running; stopFlag = false;
    running = (async () => {
      const d = { ...doc(), phases: { ...doc().phases } }; for (const p of PHASES) d.phases[p] = { ...(d.phases[p] || { done: 0, total: 0, state: 'pending' }) };
      d.running = true; d.startedAt = d.startedAt || new Date().toISOString(); d.note = `started (${reason})`; save(d, true); const t0 = Date.now();
      log(`backfill (${reason}): start${only ? ', phase ' + only : ''}`);
      try {
        for (const p of PHASES) { if (only && p !== only) continue; if (!only && d.phases[p].state === 'done') continue; if (stopFlag) break;
          if (p === 'prices10y') await prices10y(d); else if (p === 'edgar') await fundPhase(d, 'edgar', edgar); else if (p === 'isy') await fundPhase(d, 'isy', isy); else if (p === 'membership') await membershipPhase(d); }
      } catch (e) { d.note = 'error: ' + errMsg(e); log('backfill error:', e.stack || e.message); }
      d.running = false; const secs = Math.round((Date.now() - t0) / 1000); d.note = (stopFlag ? 'stopped' : complete() ? 'complete' : 'paused until the next scheduled run') + ` after ${secs}s; ` + PHASES.map(p => `${p} ${d.phases[p].done}/${d.phases[p].total} ${d.phases[p].state}`).join(', ');
      save(d, true); log(`backfill (${reason}): ${d.note}`); if (health) { try { health.update(); } catch (e) { log('health:', e.message); } }
      if (!stopFlag && complete() && !d.announced) { d.announced = true; save(d, true); inbox('good', 'Backfill complete', 'Ten years of daily history, EDGAR and İş Yatırım fundamentals and index membership are now stored locally. The Lab and security pages can use the longer history.', 'health'); }
    })().finally(() => { running = null; });
    return running;
  }
  function stop() { stopFlag = true; const d = doc(); d.note = 'stop requested'; save(d, true); return !!running; }
  return { run, stop, complete, isRunning: () => !!running, status: doc };
}
