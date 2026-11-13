// GNC Terminal — server-side Lab: runs E.backtest over the full stored daily closes (data/series/*.json, up to ~10 years) in a
// worker thread so the HTTP loop never blocks. POST /api/lab {entry, hold|holds, trail, universe} starts a job and returns its id;
// GET /api/lab/<id> returns { state, done, total, rows: [{ hold, r }], meta }. One job at a time; finished jobs are kept 30 minutes.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SELF = fileURLToPath(import.meta.url), DIR = path.dirname(SELF);
export const HOLDS = [7, 14, 21, 30, 61, 91, 182];
export const ENTRIES = ['any', 'rsi30', 'mom'];
export const UNIVERSES = ['XU030', 'XU100', 'all', 'held'];

// validate the request body; returns { rule } or { error }
export function parseLabBody(b) {
  b = b || {}; const entry = ENTRIES.includes(b.entry) ? b.entry : 'any', trail = Math.max(0, Math.min(50, +b.trail || 0)), universe = UNIVERSES.includes(b.universe) ? b.universe : 'all';
  let holds = Array.isArray(b.holds) ? b.holds : b.hold === 'grid' || b.grid ? HOLDS : [b.hold]; holds = holds.map(Number).filter(h => h >= 1 && h <= 730).slice(0, 12);
  if (!holds.length) return { error: 'hold must be a number of days (1–730), or holds an array, or grid: true' };
  return { rule: { entry, trail, universe, holds } };
}

/* ---------------- worker side ---------------- */
if (!isMainThread && workerData && workerData.gncLab) {
  const { dir, symbols, rule, S, M } = workerData, require = createRequire(path.join(dir, 'engine.js')), E = require(path.join(dir, 'engine.js'));
  const SAFE = s => String(s).replace(/\//g, '_'), read = sym => { try { const d = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'series', SAFE(sym) + '.json'), 'utf8')); return d && Array.isArray(d.bars) ? d.bars.map(r => [r[0], r[1]]) : null; } catch (e) { return null; } };
  const inst = {}; let n = 0, bars = []; const fallback = workerData.fallback || {};
  for (const s of symbols) { const c = read(s) || fallback[s] || null; if (c && c.length >= 60) { inst[s] = { symbol: s, cls: 'TR_EQ', closes: c }; n++; bars.push(c.length); } }
  const xu = read('XU100') || fallback.XU100; if (xu) inst.XU100 = { symbol: 'XU100', cls: 'MACRO', closes: xu };
  bars.sort((a, b) => a - b); parentPort.postMessage({ type: 'meta', meta: { shares: n, medianBars: bars.length ? bars[bars.length >> 1] : 0, maxBars: bars.length ? bars[bars.length - 1] : 0, from: Object.values(inst).filter(x => x.cls === 'TR_EQ').map(x => x.closes[0][0]).sort()[0] || null } });
  for (const hold of rule.holds) { const t0 = Date.now(); let r; try { r = E.backtest(inst, { hold, entry: rule.entry, trail: rule.trail }, S, M); } catch (e) { r = { n: 0, error: e.message }; } parentPort.postMessage({ type: 'row', hold, r, ms: Date.now() - t0 }); }
  parentPort.postMessage({ type: 'done' });
}

/* ---------------- main side ---------------- */
export function createLab({ db, log, dir, E }) {
  const jobs = new Map(); let seq = 0, active = null;
  function universeSymbols(u) {
    const out = []; const held = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings') || k.endsWith('/basket')) for (const h of (v.items || [])) held.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) for (const l of (p.lines || [])) held.add(l.symbol); }
    for (const [k, x] of Object.entries(db.docs)) { if (!k.startsWith('instruments/') || !x || x.cls !== 'TR_EQ') continue; const idx = x.idx || [];
      if (u === 'all' || (u === 'held' && held.has(x.symbol)) || (u === 'XU100' && (idx.includes('XU100') || idx.includes('XU030'))) || (u === 'XU030' && idx.includes('XU030'))) out.push(x.symbol); }
    return out;
  }
  function start(rule) {
    if (active && jobs.get(active) && jobs.get(active).state === 'running') return { error: 'a Lab run is already in progress', id: active, busy: true };
    for (const [id, j] of jobs) if (j.finishedAt && Date.now() - j.finishedAt > 30 * 60000) jobs.delete(id);
    const id = 'lab' + Date.now().toString(36) + (++seq), symbols = universeSymbols(rule.universe), S = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}) };
    const job = { id, state: 'running', rule, done: 0, total: rule.holds.length, rows: [], meta: null, startedAt: new Date().toISOString(), symbols: symbols.length };
    jobs.set(id, job); active = id;
    // instrument docs carry ~1 year of closes: used only when a symbol has no series file yet
    const fallback = {}; for (const s of [...symbols, 'XU100']) { const x = db.docs['instruments/' + s]; if (x && Array.isArray(x.closes)) fallback[s] = x.closes; }
    let w; try { w = new Worker(SELF, { workerData: { gncLab: true, dir, symbols, rule, S, M: { today: new Date().toISOString().slice(0, 10) }, fallback } }); }
    catch (e) { job.state = 'failed'; job.error = e.message; job.finishedAt = Date.now(); return { id }; }
    w.on('message', m => { if (m.type === 'meta') job.meta = m.meta; else if (m.type === 'row') { job.rows.push({ hold: m.hold, r: m.r, ms: m.ms }); job.done++; } else if (m.type === 'done') { job.state = 'done'; job.finishedAt = Date.now(); log(`lab: ${rule.entry}/${rule.trail}%/${rule.universe} — ${job.rows.length} spans over ${job.meta ? job.meta.shares : 0} shares in ${((job.finishedAt - Date.parse(job.startedAt)) / 1000).toFixed(1)} s`); } });
    w.on('error', e => { job.state = 'failed'; job.error = e.message; job.finishedAt = Date.now(); log('lab worker failed: ' + e.message); });
    w.on('exit', c => { if (job.state === 'running') { job.state = c ? 'failed' : 'done'; job.finishedAt = Date.now(); } });
    return { id };
  }
  const get = id => jobs.get(id) || null;
  return { start, get, universeSymbols };
}
export { DIR as LAB_DIR };
