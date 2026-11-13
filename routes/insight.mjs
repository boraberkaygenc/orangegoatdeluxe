// GNC Terminal — "insight" routes: corporate actions, KAP disclosures, server-side Lab, close-of-day snapshots for the change digest.
//   GET  /api/corporate                 corporate/main
//   POST /api/corporate                 {symbol, type:'dividend'|'bonus'|'rights'|'split', date, ratio|amount, price?, ccy?, note?}
//                                       or {action:'delete', id} or {action:'refresh'}
//   POST /api/kap                       start a KAP fetch now
//   POST /api/lab                       {entry, hold|holds|grid, trail, universe} -> 202 {id}
//   GET  /api/lab/<id>                  job progress and rows
//   GET  /api/digest/yesterday          { date, snap: { SYM: {price, score, gateOk, best, sig} } } — the last close snapshot before today
//   POST /api/digest/snapshot           take today's snapshot now (also runs by itself at config.snapshotAt, default 23:20 Istanbul)
// Schedules (all in this module): corporate events after every finished full refresh (and on start-up when older than 26 h);
// KAP every config.kapEveryHours (default 2) between 08:00 and 23:30; snapshot once a weekday at config.snapshotAt.
import { createCorporate } from '../corporate.mjs';
import { createKap } from '../kap.mjs';
import { createLab, parseLabBody } from '../lab.mjs';

export function snapshotOf(scored) { const out = {}; for (const x of scored || []) { if (!x || !x.symbol) continue; const p = x.e ? x.e.price : x.price; out[x.symbol] = { price: p == null ? null : +(+p).toPrecision(7), score: x.score ?? null, gateOk: !!(x.gate && x.gate.ok), best: x.best ? x.best.k : null, sig: x.hz ? x.hz.signal : null }; } return out; }

export function routes(ctx) {
  const { db, put, log, inbox, ist, config, E, send, DIR } = ctx, mark = ctx.health && ctx.health.mark ? ctx.health.mark : null;
  const corporate = createCorporate({ db, put, log, mark });
  const kap = createKap({ db, put, log, inbox, ist, mark });
  const lab = createLab({ db, log, dir: DIR, E });
  const today = () => (ist ? ist().date : new Date().toISOString().slice(0, 10));

  function takeSnapshot(reason) {
    try { const inst = {}; for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && x && x.symbol) inst[x.symbol] = x;
      const S = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}) }, macro = db.docs['macro/main'] || {}, d = today();
      const M = { ...macro, today: d, usdtry: (inst['USD/TRY'] || {}).price || 49.5, xu100: (inst.XU100 || {}).price };
      const scored = E.scoreAll(inst, S, M), snap = snapshotOf(scored); for (const m of Object.values(inst)) if (m.cls === 'MACRO') snap[m.symbol] = { price: m.price ?? null, score: null, gateOk: false, best: null, sig: null };
      put('snapshots/' + d, { date: d, at: new Date().toISOString(), reason, n: Object.keys(snap).length, items: snap });
      const keep = Object.keys(db.docs).filter(k => /^snapshots\/\d{4}-\d{2}-\d{2}$/.test(k)).sort(); for (const k of keep.slice(0, Math.max(0, keep.length - 5))) put(k, null);
      log(`snapshot ${d} (${reason}): ${Object.keys(snap).length} instruments`); return d;
    } catch (e) { log('snapshot failed: ' + e.message); return null; }
  }
  function yesterday(symbols) {
    const d = today(), keys = Object.keys(db.docs).filter(k => /^snapshots\/\d{4}-\d{2}-\d{2}$/.test(k) && k.slice(10) < d).sort(), k = keys.pop(); if (!k) return { date: null, snap: {} };
    const doc = db.docs[k], items = doc.items || {}; const snap = symbols && symbols.length ? Object.fromEntries(symbols.filter(s => items[s]).map(s => [s, items[s]])) : items;
    return { date: doc.date, at: doc.at, snap };
  }

  /* ---------------- schedules ---------------- */
  let lastFull = (db.docs['status/refresh'] || {}).finishedAt || null, lastKap = 0, lastSnapKey = null;
  const timer = setInterval(() => {
    try {
      const st = db.docs['status/refresh'] || {}; if (st.state === 'done' && st.kind === 'full' && st.finishedAt && st.finishedAt !== lastFull) { lastFull = st.finishedAt; corporate.update('after full refresh').catch(e => log('corporate: ' + e.message)); }
      const t = ist ? ist() : { date: today(), hm: new Date().toISOString().slice(11, 16), wd: 'Mon' }, every = (+config.kapEveryHours || 2) * 36e5;
      if (t.hm >= '08:00' && t.hm <= '23:30' && Date.now() - lastKap > every) { lastKap = Date.now(); kap.update('every ' + (config.kapEveryHours || 2) + ' h').catch(e => log('kap: ' + e.message)); }
      kap.merge();
      const at = config.snapshotAt || '23:20', weekday = !(t.wd === 'Sat' || t.wd === 'Sun');
      if (weekday && t.hm >= at && lastSnapKey !== t.date && !db.docs['snapshots/' + t.date]) { lastSnapKey = t.date; takeSnapshot('close ' + at); } else if (db.docs['snapshots/' + t.date]) lastSnapKey = t.date;
    } catch (e) { log('insight scheduler: ' + e.message); }
  }, 60000); if (timer.unref) timer.unref();
  setTimeout(() => { if (corporate.stale(26)) corporate.update('start-up').catch(e => log('corporate: ' + e.message)); if (kap.stale(+config.kapEveryHours || 2)) { lastKap = Date.now(); kap.update('start-up').catch(e => log('kap: ' + e.message)); } }, +config.insightStartDelayMs || 120000).unref?.();

  const ok = (res, req, body, code = 200) => send(res, code, body, 'application/json', req);
  return [
    { method: 'GET', path: '/api/corporate', handler: async (req, res) => ok(res, req, corporate.doc()) },
    { method: 'POST', path: '/api/corporate', handler: async (req, res, u, body) => {
      try { if (!body) return ok(res, req, { error: 'body must be JSON' }, 400);
        if (body.action === 'refresh') { corporate.update('button').catch(e => log('corporate: ' + e.message)); return ok(res, req, { started: true }, 202); }
        if (body.action === 'delete') return corporate.remove(String(body.id || '')) ? ok(res, req, { ok: true }) : ok(res, req, { error: 'no such action' }, 404);
        const r = corporate.addManual(body); return r.error ? ok(res, req, r, 400) : ok(res, req, { ok: true, item: r.item });
      } catch (e) { return ok(res, req, { error: e.message }, 500); } } },
    { method: 'POST', path: '/api/kap', handler: async (req, res) => { kap.update('button').catch(e => log('kap: ' + e.message)); return ok(res, req, { started: true }, 202); } },
    { method: 'POST', path: '/api/lab', handler: async (req, res, u, body) => { const p = parseLabBody(body); if (p.error) return ok(res, req, p, 400); const r = lab.start(p.rule); return r.busy ? ok(res, req, r, 409) : ok(res, req, { id: r.id, rule: p.rule }, 202); } },
    { method: 'GET', path: /^\/api\/lab\/([\w-]+)$/, handler: async (req, res, u, body, m) => { const j = lab.get(m[1]); return j ? ok(res, req, j) : ok(res, req, { error: 'no such Lab run (finished runs are kept 30 minutes)' }, 404); } },
    { method: 'GET', path: '/api/digest/yesterday', handler: async (req, res, u) => { const syms = String(u.searchParams.get('symbols') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean); return ok(res, req, yesterday(syms)); } },
    { method: 'POST', path: '/api/digest/snapshot', handler: async (req, res) => { const d = takeSnapshot('button'); return d ? ok(res, req, { ok: true, date: d }) : ok(res, req, { error: 'snapshot failed; see refresh.log' }, 500); } }
  ];
}
