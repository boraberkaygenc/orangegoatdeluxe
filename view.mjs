// GNC Terminal v4 — server-side scoring and the slim "view" the page polls instead of /api/all.
// Instruments are scored once on the server (E.scoreAll) after data changes; the page receives scores and statistics
// without daily closes (except reference series and the symbols you hold, have in the basket, in funds or on the watchlist).
// Non-instrument documents are sent incrementally: every write to db.docs is tracked by a Proxy (key -> change counter).
import zlib from 'node:zlib';

const HEAVY = ['closes', 'hlv', 'bars', 'series', 'fh'];
const SERVER_ONLY = ['snapshots/', 'universe_snapshots/', 'research_raw/'];
const SLIM_HZ = h => h ? { best: h.best || null, bestAny: h.bestAny || null, signal: h.signal || null, E: h.E } : null;

export function createView({ db, log, E, ist, data, uid = 'local' }) {
  let chg = 0; const keyChg = new Map(), deleted = new Map();
  let instDirty = true, scoreDirty = true, lastScored = null, otherDirtyAt = 0, lastInstChangeAt = Date.now(), seq = 0, cache = null, computing = false, lastComputeAt = 0, lastMs = 0, settingsKey = '';

  function track(k, del) { chg++; keyChg.set(k, chg); if (del) deleted.set(k, chg); else deleted.delete(k); if (k.startsWith('instruments/')) { instDirty = true; scoreDirty = true; lastInstChangeAt = Date.now(); } else if (k === 'settings/main' || k === 'macro/main' || k === 'model/calib') { instDirty = true; scoreDirty = true; otherDirtyAt = Date.now(); } else if (/^data\/users\/[^/]+\/(holdings|basket|packages|watch)$/.test(k)) { instDirty = true; otherDirtyAt = Date.now(); } }
  function wrap() {
    if (db.docs && db.docs.__gncProxy) return;
    const target = db.docs || {};
    db.docs = new Proxy(target, {
      set(t, k, v) { t[k] = v; if (typeof k === 'string') track(k, false); return true; },
      deleteProperty(t, k) { const had = k in t; delete t[k]; if (had && typeof k === 'string') track(k, true); return true; },
      get(t, k) { if (k === '__gncProxy') return true; return t[k]; }
    });
    // everything counts as changed for clients that connect after a re-wrap
    for (const k of Object.keys(target)) { chg++; keyChg.set(k, chg); }
    instDirty = true;
  }
  wrap();

  const userItems = n => ((db.docs[`data/users/${uid}/${n}`] || {}).items || []);
  function keepSeriesFor() {
    const s = new Set();
    for (const h of userItems('holdings')) s.add(h.symbol);
    for (const b of userItems('basket')) s.add(b.symbol);
    for (const p of userItems('packages')) if (p.status !== 'closed') for (const l of p.lines || []) s.add(l.symbol);
    const w = db.docs[`data/users/${uid}/watch`] || {}; for (const i of w.items || []) s.add(i.symbol); for (const a of w.alarms || []) s.add(a.symbol);
    return s;
  }
  let slimJson = new Map();
  function compute() {
    if (computing) return; computing = true; const t0 = Date.now();
    try {
      wrap();
      const inst = {}; for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && x && x.symbol) inst[x.symbol] = x;
      const rescore = scoreDirty || !lastScored;
      if (rescore) { scoreDirty = false; E.setCalib(db.docs['model/calib']); const S = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}) }, macro = db.docs['macro/main'] || {};
        const M = { ...macro, today: ist().date, usdtry: (inst['USD/TRY'] || {}).price || 49.5, xu100: (inst.XU100 || {}).price };
        lastScored = E.scoreAll(inst, S, M); slimJson = new Map();
        for (const y of lastScored) { const o = {}; for (const [k, v] of Object.entries(y)) { if (HEAVY.includes(k)) continue; if (k === 'hz') { o.hz_ = SLIM_HZ(v); continue; } o[k] = v; } o._scored = 1; slimJson.set(y.symbol, JSON.stringify(o)); } }
      const keep = keepSeriesFor(), parts = [];
      for (const [sym, js] of slimJson) { const live = inst[sym]; let j = js; if (keep.has(sym) && live && Array.isArray(live.closes) && live.closes.length) j = js.slice(0, -1) + ',"closes":' + JSON.stringify(live.closes) + (Array.isArray(live.hlv) ? ',"hlv":' + JSON.stringify(live.hlv) : '') + '}'; parts.push(JSON.stringify(sym) + ':' + j); }
      for (const [sym, x] of Object.entries(inst)) if (!slimJson.has(sym)) parts.push(JSON.stringify(sym) + ':' + JSON.stringify(x));
      seq++; const instBody = '{' + parts.join(',') + '}'; cache = { seq, instBody, gz: null, n: parts.length, at: new Date().toISOString() };
      instDirty = false; lastComputeAt = Date.now(); lastMs = Date.now() - t0;
      if (seq < 3 || lastMs > 3000 || rescore && seq % 20 === 0) log(`view: ${rescore ? 'scored' : 'repacked'} ${parts.length} instruments in ${lastMs} ms, payload ${(instBody.length / 1e6).toFixed(1)} MB`);
    } catch (e) { log('view: compute failed: ' + (e && e.stack || e)); }
    finally { computing = false; }
  }
  // recompute policy: 1.5 s after the last instrument change when idle; every 60 s while a refresh is running; 0.8 s after settings/macro/user changes
  setInterval(() => {
    if (!instDirty || computing) return; const now = Date.now(), running = data && data.getProgress && data.getProgress().running;
    if (!cache) return compute();
    if (otherDirtyAt && now - otherDirtyAt > 800) { otherDirtyAt = 0; return compute(); }
    if (running ? now - lastComputeAt > 60000 : now - lastInstChangeAt > 1500) compute();
  }, 500);

  function docsSince(c) {
    const docs = {}, del = []; let n = 0;
    for (const [k, v] of keyChg) { if (v <= c || k.startsWith('instruments/') || SERVER_ONLY.some(p => k.startsWith(p))) continue; if (deleted.has(k)) { del.push(k); continue; } if (k in db.docs) { docs[k] = db.docs[k]; n++; } }
    return { docs, del, n };
  }
  // GET /api/view?s=<seq>&c=<chg>  →  { seq, chg, rev, docs (changed since c), del, instSeq } ; instruments come from GET /api/view/inst?s=<seq> (cached, gzipped once)
  function handle(req, res, u, send) {
    if (!cache) compute();
    const s = +u.searchParams.get('s') || 0, c = +u.searchParams.get('c') || 0, d = docsSince(c);
    if (s === seq && !d.n && !d.del.length) return send(res, 200, { same: true, seq, chg, rev: db.rev, computing, dirty: instDirty });
    return send(res, 200, { seq, chg, rev: db.rev, docs: d.docs, del: d.del, instChanged: s !== seq, computedAt: cache && cache.at, ms: lastMs, dirty: instDirty }, 'application/json', req);
  }
  function handleInst(req, res) {
    if (!cache) compute(); const c = cache; const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (gzip) { if (!c.gz) c.gz = zlib.gzipSync('{"seq":' + c.seq + ',"inst":' + c.instBody + '}', { level: 1 }); res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Cache-Control': 'no-store' }); return res.end(c.gz); }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"seq":' + c.seq + ',"inst":' + c.instBody + '}');
  }
  return { handle, handleInst, compute, wrap, stats: () => ({ seq, chg, computing, dirty: instDirty, lastMs, computedAt: cache && cache.at, bytes: cache ? cache.instBody.length : 0, gz: cache && cache.gz ? cache.gz.length : 0, instruments: cache ? cache.n : 0 }) };
}
