#!/usr/bin/env node
// GNC Terminal — local app server. Node 18 or newer, no npm packages needed.
// Start:  node server.mjs        then open http://localhost:8765
// Keeps all data in ./data/store.json; refreshes prices every 15 minutes in market hours (Yahoo batch quotes),
// rebuilds 1-year OHLCV history nightly, collects broker research, TCMB macro data, IPOs and regulator news.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (typeof fetch !== 'function' || +process.versions.node.split('.')[0] < 18) { console.error('GNC Terminal needs Node.js 18 or newer (you have ' + process.versions.node + '). Install the LTS version from https://nodejs.org'); process.exit(1); }
const DIR = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const E = require(path.join(DIR, 'engine.js'));
import { createResearch } from './research.mjs';
import { createEvds } from './evds.mjs';
import { createZiraat } from './ziraat.mjs';
import { createData, yahooQuotes, tefasList, tefasHistory } from './data.mjs';
import { createUniverse } from './universe.mjs';
import { createIpo } from './ipo.mjs';
import { createLighthouse } from './lighthouse.mjs';
import { createStore2 } from './store2.mjs';
import { createView } from './view.mjs';
import { createHealth } from './health.mjs';
import { createEdgar } from './edgar.mjs';
import { createIsy } from './isyatirim.mjs';
import { createMembership } from './membership.mjs';
import { createValidate } from './validate.mjs';
import { createBackfill, PHASES } from './backfill.mjs';
import { safe, loadStore, markModule, report as safeReport } from './safemode.mjs'; import { guard, bindAddress } from './remote.mjs'; import { notifyInbox } from './notify.mjs'; // platform: safe mode, LAN guard, notifications
const CONFIG = { evdsKey: '', evdsAt: ['10:15', '16:45'], researchAt: ['09:30', '13:30', '19:30'], ipoAt: ['08:30', '20:30'], lighthouseEveryHours: 6, universeDay: 1, universeAt: '03:10', port: 8765, usMinMcap: 5e9, intervalMinutes: 15, windowStart: '09:55', windowEnd: '23:15', fullAt: ['00:30'], weekdaysOnly: true, concurrency: 4, profilesPerRun: 150, edgarPerRun: 120, isyPerRun: 150, backfillAt: '01:30', edgarUserAgent: 'GNC Terminal personal research contact@example.com', sla: {}, ...readJSON(path.join(DIR, 'config.json'), {}) };
if (process.env.GNC_PORT && +process.env.GNC_PORT > 0) CONFIG.port = +process.env.GNC_PORT;
Object.defineProperty(CONFIG, '__bound', { value: (CONFIG.bind = bindAddress(CONFIG)), writable: true, enumerable: false }); // remote.enabled -> 0.0.0.0
const STORE = path.join(DIR, 'data', 'store.json');
const LOG = path.join(DIR, 'data', 'refresh.log');
const UID = 'local';

function readJSON(p, d) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } }
function log(...a) { const line = new Date().toISOString() + ' ' + a.join(' '); console.log(line); try { fs.appendFileSync(LOG, line + '\n'); } catch (e) { } }

/* ---------------- store ---------------- */
let db = loadStore(STORE, log), saveTimer = null;
if (!db) { db = { rev: 1, docs: readJSON(path.join(DIR, 'data', 'seed.json'), {}) }; save(); log('store created from seed,', Object.keys(db.docs).length, 'documents'); }
{ const ud = readJSON(path.join(DIR, 'data', 'userdocs.json'), null); if (ud && ud.docs) { let n = 0; for (const [k, v] of Object.entries(ud.docs)) { if (JSON.stringify(db.docs[k]) !== JSON.stringify(v)) { db.docs[k] = v; n++; } } if (n) log(`userdocs: ${n} newer user document(s) restored from data/userdocs.json`); } }
function writeStore() { fs.mkdirSync(path.dirname(STORE), { recursive: true }); const tmp = STORE + '.tmp', body = JSON.stringify(db); fs.writeFileSync(tmp, body); try { fs.renameSync(tmp, STORE); } catch (e) { fs.writeFileSync(STORE, body); try { fs.unlinkSync(tmp); } catch (_) { } } backup(); }
let lastBackup = null;
function backup() { const day = new Date().toISOString().slice(0, 10); if (lastBackup === day) return; const dir = path.join(DIR, 'data', 'backups'), f = path.join(dir, `store-${day}.json`); try { fs.mkdirSync(dir, { recursive: true }); if (!fs.existsSync(f)) fs.copyFileSync(STORE, f); const all = fs.readdirSync(dir).filter(x => /^store-\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort(); for (const x of all.slice(0, Math.max(0, all.length - 14))) fs.unlinkSync(path.join(dir, x)); lastBackup = day; } catch (e) { log('backup failed:', e.message); } }
// v4: user documents (portfolio, funds, journal, settings) go to data/userdocs.json within 0.3 s — small and durable;
// the full store (prices, history, research) is written at most every 20 s, so a click never waits for a 30 MB write.
const USERDOCS = path.join(DIR, 'data', 'userdocs.json'); const isUserKey = k => k.startsWith('data/users/') || k === 'settings/main';
var userTimer = null, lastFull = 0;
function writeUserDocs() { try { const o = {}; for (const [k, v] of Object.entries(db.docs)) if (isUserKey(k)) o[k] = v; const tmp = USERDOCS + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ at: new Date().toISOString(), rev: db.rev, docs: o })); fs.renameSync(tmp, USERDOCS); } catch (e) { log('userdocs save failed:', e.message); } }
function save(userOnly) { if (userOnly) { clearTimeout(userTimer); userTimer = setTimeout(writeUserDocs, 300); }
  if (saveTimer) return; const wait = Math.max(400, 20000 - (Date.now() - (lastFull || 0))); saveTimer = setTimeout(() => { saveTimer = null; lastFull = Date.now(); try { writeStore(); } catch (e) { log('save failed:', e.message); } }, userOnly ? Math.max(wait, 5000) : wait); }
function put(p, v) { if (v === null) delete db.docs[p]; else db.docs[p] = v; db.rev++; save(isUserKey(p)); }
// one-off clean-ups for older data files
for (const k of ['instruments/GLD', 'instruments/IAU', 'instruments/XAU_USD']) if (db.docs[k]) delete db.docs[k];
if (!db.docs['macro/series']) { const ms = readJSON(path.join(DIR, 'data', 'seed.json'), {})['macro/series']; if (ms) db.docs['macro/series'] = ms; }
db.docs['settings/main'] = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}), triggers: { quick: 'local', full: 'local' } }; delete db.docs['settings/main'].expGold;
const coll = c => Object.entries(db.docs).filter(([k]) => k.startsWith(c + '/') && k.split('/').length === c.split('/').length + 1);

/* ---------------- time helpers (Europe/Istanbul) ---------------- */
const IST_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
function ist(d = new Date()) {
  const p = Object.fromEntries(IST_FMT.formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`, wd: p.weekday };
}
function inbox(level, title, body, kind) { const at = new Date().toISOString(); put('inbox/' + at.replace(/[:.]/g, '-'), { at, kind, level, title, body }); notifyInbox({ at, kind, level, title, body }); }

/* ---------------- picks (weekly / 21-day / 30-day) ---------------- */
function issuePicks() {
  const today = ist().date, inst = {}; for (const [, x] of coll('instruments')) inst[x.symbol] = x;
  const S = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}) }, macro = db.docs['macro/main'] || {};
  const M = { ...macro, today, usdtry: (inst['USD/TRY'] || {}).price || 49.5, xu100: (inst.XU100 || {}).price };
  const items = n => ((db.docs[`data/users/${UID}/${n}`] || {}).items || []);
  const held = [...items('holdings').map(h => h.symbol), ...items('packages').filter(p => p.status !== 'closed').flatMap(p => (p.lines || []).map(l => l.symbol))];
  const scored = E.scoreAll(inst, S, M), P = E.picks(scored, S, M, held, today), LEN = { weekly: 7, d21: 21, d30: 30 }, issued = [];
  for (const k of Object.keys(LEN)) {
    const cur = db.docs['picks/' + k]; if (cur && cur.next && cur.next > today && !(cur.items || []).some(i => !inst[i.symbol])) continue; if (!P[k] || !P[k].length) continue;
    const nx = new Date(today + 'T12:00:00Z'); nx.setUTCDate(nx.getUTCDate() + LEN[k]);
    const doc = { date: today, next: nx.toISOString().slice(0, 10), xu100At: M.xu100 || null, items: P[k] };
    put('picks/' + k, doc); put(`pickslog/${today}-${k}`, { list: k === 'weekly' ? 'Weekly' : k === 'd21' ? '21-day' : '30-day', ...doc }); issued.push(k);
  }
  if (issued.length) { const map = Object.fromEntries(scored.map(x => [x.symbol, x])); Object.assign(map, E.enrich(Object.fromEntries(Object.entries(inst).filter(([, x]) => x.cls === 'MACRO')), S, M));
    const b = E.brief({ S, M, inst, scoredMap: map, holdings: [], packages: [], regimeInfo: E.regime(map, M, S) });
    inbox('good', b.head, `${b.lead}\n${b.flip}\n\nNew picks issued: ${issued.map(k => ({ weekly: 'weekly', d21: '21-day', d30: '30-day' }[k])).join(', ')}.`, 'picks'); }
  // monthly universe snapshot for point-in-time backtests
  const mk = 'universe_snapshots/' + today.slice(0, 7); if (!db.docs[mk]) put(mk, { date: today, symbols: Object.values(inst).filter(x => x.cls !== 'MACRO').map(x => x.symbol) });
  return issued.length ? 'picks issued: ' + issued.join(', ') : 'picks unchanged';
}
// watchlist price alarms: one inbox message per trigger
function checkAlarms() {
  const key = `data/users/${UID}/watch`, w = db.docs[key]; if (!w || !Array.isArray(w.alarms)) return; let changed = false;
  const alarms = w.alarms.map(a => { if (!a.active || a.triggeredAt) return a; const x = db.docs['instruments/' + String(a.symbol).replace('/', '_')], p = x && x.price; if (!p) return a;
    const hit = a.op === '<' ? p <= a.price : p >= a.price; if (!hit) return a; changed = true;
    inbox('warn', `Alarm: ${a.symbol} ${a.op === '<' ? 'fell below' : 'rose above'} ${a.price}`, `${a.symbol} is at ${p}${a.note ? ' — ' + a.note : ''}. The alarm is now switched off; set it again in Watchlist if needed.`, 'alarm');
    return { ...a, triggeredAt: new Date().toISOString(), triggeredPrice: p, active: false }; });
  if (changed) put(key, { ...w, alarms });
}

/* ---------------- modules ---------------- */
function inWindow(t) { if (CONFIG.weekdaysOnly && (t.wd === 'Sat' || t.wd === 'Sun')) return false; return t.hm >= CONFIG.windowStart && t.hm <= CONFIG.windowEnd; }
const store2 = safe('store2', () => createStore2({ dir: DIR, log }), log);
const health = safe('health', () => createHealth({ db, put, log, inbox, coll, ist, config: CONFIG, store2, inWindow }), log);
const data = safe('data', () => createData({ db, put, log, inbox, coll, ist, config: CONFIG, issuePicks, checkAlarms, health }), log);
const view = safe('view', () => createView({ db, log, E, ist, data }), log);
const edgar = safe('edgar', () => createEdgar({ db, put, log, inbox, coll, config: CONFIG, store2, mark: health.mark }), log);
const isy = safe('isy', () => createIsy({ db, put, log, inbox, coll, config: CONFIG, store2, mark: health.mark }), log);
const membership = safe('membership', () => createMembership({ db, put, log, inbox, coll, store2, mark: health.mark }), log);
const validate = safe('validate', () => createValidate({ db, put, log, coll, store2, mark: health.mark }), log);
Object.assign(data.hooks, { store2, edgar, isy, validate });
const universe = safe('universe', () => createUniverse({ dir: DIR, db, put, log, inbox, tefasList, tefasHistory, config: CONFIG }), log);
const evds = safe('evds', () => createEvds({ key: CONFIG.evdsKey, db, put, log, inbox, mark: health.mark }), log);
const ziraat = safe('ziraat', () => createZiraat({ db, put, log, ist, mark: health.mark }), log);
const research = safe('research', () => createResearch({ dir: DIR, db, put, log, ist, inbox, E }), log);
const ipo = safe('ipo', () => createIpo({ db, put, log, inbox, ist, yahooQuotes }), log);
const lighthouse = safe('lighthouse', () => createLighthouse({ db, put, log, inbox, ist, config: CONFIG }), log);
const backfill = safe('backfill', () => createBackfill({ db, put, log, inbox, coll, config: CONFIG, store2, data, edgar, isy, membership, health }), log);
if (db.docs['status/backfill'] && db.docs['status/backfill'].running) put('status/backfill', { ...db.docs['status/backfill'], running: false, note: 'interrupted by a restart; resumes at ' + CONFIG.backfillAt });
try { const r = universe.ensure(); log(`universe: ${r.total} instruments wanted (${r.added} added, ${r.removed} removed)`); } catch (e) { log('universe ensure failed:', e.message); }
// model calibration (walk-forward test of the forecast on stored history; see engine.calibrate): weekly, and on demand from POST /api/calib
function runCalib(reason) { const t0 = Date.now(); try {
    const pick = cls => coll('instruments').map(([, x]) => x).filter(x => x.cls === cls).sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).slice(0, CONFIG.calibStocks || 300);
    const list = []; for (const x of [...pick('TR_EQ'), ...pick('US_EQ')]) { let closes = null; try { const f = store2.readSeries(x.symbol); if (f && Array.isArray(f.bars)) closes = f.bars.map(r => [r[0], +r[1], +r[4] || 0]); } catch (e) { }
      if (!closes || closes.length < (x.closes || []).length) closes = (x.closes || []).map(r => [r[0], +r[1]]); if (closes.length >= 300) list.push({ symbol: x.symbol, ccy: x.ccy, closes }); }
    const index = {}; for (const [ccy, ix] of [['TRY', 'XU100'], ['USD', 'SPX']]) { let b = null; try { const f = store2.readSeries(ix); if (f && Array.isArray(f.bars)) b = f.bars; } catch (e) { } const x = db.docs['instruments/' + ix] || {}; if (!b || b.length < (x.closes || []).length) b = x.closes || []; if (b.length > 300) index[ccy] = new Map(b.map(r => [r[0], +r[1]])); }
    const c = E.calibrate(list, { years: CONFIG.calibYears || 5, index }); c.reason = reason; c.ms = Date.now() - t0; c.series = list.length;
    if (c.ok) { put('model/calib', c); log(`calibration (${reason}): ${list.length} series, ${Object.entries(c.stats).map(([k, s]) => `${k} ${s.dates} dates/${s.obs} obs`).join(', ')} in ${c.ms} ms`); }
    else log(`calibration (${reason}): not enough history yet (${list.length} series with 300+ days)`); return c;
  } catch (e) { log('calibration failed:', e.message); return { ok: false, error: e.message }; } }
setTimeout(() => { const c = db.docs['model/calib']; if (!c || !c.w || Date.now() - new Date(c.at) > 7 * 864e5) runCalib('start-up'); }, CONFIG.calibDelayMs ?? 120000);
setInterval(() => { const c = db.docs['model/calib']; if (!data.isRunning() && (!c || Date.now() - new Date(c.at) > 7 * 864e5)) runCalib('weekly'); }, 6 * 36e5);
setInterval(() => { try { research.importDigests(); } catch (e) { log('digest watch:', e.message); } }, 60000);

/* ---------------- scheduler ---------------- */
let lastFullKey = null, lastQuickSlot = null, lastResearchKey = null, lastEvdsKey = null, lastIpoKey = null, lastUniKey = null, lastLhAt = 0, lastBackfillKey = null, lastHealthAt = Date.now();
const afterUniverse = reason => universe.refresh(reason).then(() => membership.refresh(reason).catch(e => log('membership:', e.message))).then(() => data.refresh('full', 'after universe update')).catch(e => log('universe:', e.message));
setInterval(() => {
  const t = ist();
  if (t.hm === CONFIG.backfillAt && lastBackfillKey !== t.date && !backfill.complete()) { lastBackfillKey = t.date; backfill.run('scheduled ' + CONFIG.backfillAt); }
  if (Date.now() - lastHealthAt > 30 * 60000) { lastHealthAt = Date.now(); try { health.update(); } catch (e) { log('health:', e.message); } }
  for (const f of CONFIG.fullAt) if (t.hm === f && lastFullKey !== t.date + f) { lastFullKey = t.date + f; data.refresh('full', 'scheduled ' + f); return; }
  for (const f of CONFIG.evdsAt) if (t.hm === f && lastEvdsKey !== t.date + f) { lastEvdsKey = t.date + f; evds.update('scheduled ' + f); ziraat.update('scheduled ' + f); }
  for (const f of CONFIG.researchAt) if (t.hm === f && !(t.wd === 'Sat' || t.wd === 'Sun') && lastResearchKey !== t.date + f) { lastResearchKey = t.date + f; research.collect('scheduled ' + f); }
  for (const f of CONFIG.ipoAt) if (t.hm === f && lastIpoKey !== t.date + f) { lastIpoKey = t.date + f; ipo.update('scheduled ' + f); }
  if (Date.now() - lastLhAt > CONFIG.lighthouseEveryHours * 36e5) { lastLhAt = Date.now(); lighthouse.update('every ' + CONFIG.lighthouseEveryHours + ' h'); }
  if (+t.date.slice(8) === CONFIG.universeDay && t.hm === CONFIG.universeAt && lastUniKey !== t.date) { lastUniKey = t.date; afterUniverse('monthly'); }
  const mins = +t.hm.slice(0, 2) * 60 + +t.hm.slice(3), slot = t.date + ':' + Math.floor(mins / CONFIG.intervalMinutes);
  if (inWindow(t) && mins % CONFIG.intervalMinutes === 0 && slot !== lastQuickSlot) { lastQuickSlot = slot; data.refresh('quick', `every ${CONFIG.intervalMinutes} min`); }
}, 20000);

/* ---------------- http ---------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function send(res, code, body, type = 'application/json', req) {
  let buf = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); const h = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  if (req && buf.length > 2048 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { buf = zlib.gzipSync(buf); h['Content-Encoding'] = 'gzip'; }
  res.writeHead(code, h); res.end(buf);
}
function readBody(req) { return new Promise((ok, bad) => { let s = ''; req.on('data', c => { s += c; if (s.length > 40e6) req.destroy(); }); req.on('end', () => { try { ok(s ? JSON.parse(s) : null); } catch (e) { bad(e); } }); }); }
/* ---------------- route modules (app/routes/*.mjs; see V4_CONTRACT.md) ---------------- */
const ROUTES = [];
async function mountRoutes() { const dir = path.join(DIR, 'routes'); if (!fs.existsSync(dir)) return; for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mjs')).sort()) { try { const mod = await import(pathToFileURL(path.join(dir, f)).href); const list = typeof mod.routes === 'function' ? mod.routes(routeCtx()) : []; for (const r of list) ROUTES.push({ method: (r.method || 'GET').toUpperCase(), path: r.path, handler: r.handler }); markModule('routes/' + f, true); log(`routes: ${f} mounted ${list.length} route(s)`); } catch (e) { markModule('routes/' + f, false, e); log(`routes: ${f} failed to load: ${e.message}`); } } }
function routeCtx() { return { db, put, log, inbox, coll, ist, config: CONFIG, E, data, universe, evds, research, ipo, lighthouse, store2, health, membership, backfill: typeof backfill !== 'undefined' ? backfill : null, DIR, send, readBody, save: () => save() }; }
const server = http.createServer(async (req, res) => {
  try {
    if (await guard(req, res)) return; // platform: LAN PIN guard + raw upload routes
    const u = new URL(req.url, 'http://localhost'), p = decodeURIComponent(u.pathname);
    if (p === '/api/view') return view.handle(req, res, u, send);
    if (p === '/api/view/inst') return view.handleInst(req, res);
    if (p === '/api/perf') return send(res, 200, { view: view.stats(), mem: process.memoryUsage(), uptimeSec: Math.round(process.uptime()), rev: db.rev });
    if (p === '/api/all') { const since = +u.searchParams.get('rev') || 0; return send(res, 200, since === db.rev ? { rev: db.rev, same: true } : { rev: db.rev, docs: db.docs }, 'application/json', req); }
    if (p === '/api/progress') return send(res, 200, { ...data.getProgress(), rev: db.rev });
    if (p === '/api/version') { let v = null; try { v = (fs.readFileSync(path.join(DIR, 'public', 'index.html'), 'utf8').match(/id="app-ver"[^>]*>([^<]*)</) || [])[1] || null; } catch (e) { } return send(res, 200, { page: v, dir: DIR, node: process.versions.node, port: CONFIG.port, uptimeSec: Math.round(process.uptime()) }); }
    if (p === '/api/series') { // batch: last n bars for several symbols, from the instrument docs (closes+hlv) — used by the page's ensureSeries()
      const syms = String(u.searchParams.get('symbols') || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean).slice(0, 60), n = Math.min(2600, Math.max(20, +u.searchParams.get('n') || 262)), out = {};
      for (const sym of syms) { const x = db.docs['instruments/' + sym.replace('/', '_')]; if (!x) continue; let closes = Array.isArray(x.closes) ? x.closes : [], hlv = Array.isArray(x.hlv) && x.hlv.length === closes.length ? x.hlv : null;
        if (n > closes.length) { const raw = store2.readSeriesRaw(sym); if (raw) { try { const f = JSON.parse(raw); if (f && Array.isArray(f.bars) && f.bars.length > closes.length) { closes = f.bars.map(r => [r[0], r[1]]); hlv = f.bars.map(r => [r[2], r[3], r[4]]); } } catch (e) { } } }
        out[sym] = { closes: closes.slice(-n), hlv: hlv ? hlv.slice(-n) : null, splits: x.splits || [] }; }
      return send(res, 200, { rev: db.rev, series: out }, 'application/json', req); }
    for (const r of ROUTES) { if (r.method !== req.method) continue; const m = typeof r.path === 'string' ? (r.path === p ? [p] : null) : p.match(r.path); if (!m) continue; const body = (req.method === 'POST' || req.method === 'PUT') && /json/i.test(req.headers['content-type'] || 'application/json') ? await readBody(req).catch(() => null) : null; return await r.handler(req, res, u, body, m); }
    if (p.startsWith('/api/series/')) { const sym = decodeURIComponent(p.slice(12)).toUpperCase(); if (!/^[A-Z0-9][\w.\-\/=^]{0,15}$/.test(sym)) return send(res, 400, { error: 'bad symbol' }); const raw = store2.readSeriesRaw(sym) || store2.readSeriesRaw(sym.replace('_', '/')); return raw ? send(res, 200, raw, 'application/json', req) : send(res, 404, { error: 'no series file for ' + sym + ' yet (the backfill writes it)' }); }
    if (p.startsWith('/api/facts/')) { const sym = decodeURIComponent(p.slice(11)).toUpperCase(); return send(res, 200, { symbol: sym, facts: store2.factsOf(sym) }, 'application/json', req); }
    if (p === '/api/membership' && req.method !== 'POST') { const index = (u.searchParams.get('index') || 'XU100').toUpperCase(), date = u.searchParams.get('date') || ist().date; if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'date must be YYYY-MM-DD' }); return send(res, 200, { index, date, symbols: membership.membersAt(index, date) }, 'application/json', req); }
    if (p.startsWith('/api/doc/')) {
      const key = p.slice(9); if (!/^[\w\-.~:@+]+(\/[\w\-.~:@+]+)+$/.test(key)) return send(res, 400, { error: 'bad path' });
      if (req.method === 'PUT') { put(key, await readBody(req)); if (key === 'settings/main') setTimeout(() => { try { universe.ensure(); } catch (e) { log('universe:', e.message); } }, 500); return send(res, 200, { ok: true, rev: db.rev }); }
      if (req.method === 'DELETE') { put(key, null); return send(res, 200, { ok: true, rev: db.rev }); }
      return send(res, 200, db.docs[key] ?? null, 'application/json', req);
    }
    if (p === '/api/fundhist' && req.method === 'GET') { const out = {}; for (const [, x] of coll('instruments')) if (x && x.fh) out[x.symbol] = x.fh; return send(res, 200, { generatedAt: new Date().toISOString(), fh: out }); } // per-company statement history for Pointer
    if (req.method === 'POST') {
      if (p === '/api/evds') { evds.update('button'); ziraat.update('button'); return send(res, 202, { started: true }); }
      if (p === '/api/ziraat') { await ziraat.update('button'); return send(res, 200, { ok: true, n: (db.docs['macro/ziraat'] || {}).n || 0 }); }
      if (p === '/api/research') { research.collect('button'); return send(res, 202, { started: true }); }
      if (p === '/api/ipo') { ipo.update('button'); return send(res, 202, { started: true }); }
      if (p === '/api/lighthouse') { lighthouse.update('button'); return send(res, 202, { started: true }); }
      if (p === '/api/universe') { afterUniverse('button'); return send(res, 202, { started: true }); }
      if (p === '/api/edgar') { edgar.runSlice({ reason: 'button' }).then(() => health.update()).catch(e => log('edgar:', e.message)); return send(res, 202, { started: true }); }
      if (p === '/api/isy') { isy.runSlice({ reason: 'button' }).then(() => health.update()).catch(e => log('isyatirim:', e.message)); return send(res, 202, { started: true }); }
      if (p === '/api/membership') { membership.refresh('button').catch(e => log('membership:', e.message)); return send(res, 202, { started: true }); }
      if (p === '/api/calib' && req.method === 'POST') { const c = runCalib('request'); return send(res, 200, { ok: !!c.ok, series: c.series, stats: c.stats, error: c.error }); }
      if (p === '/api/backfill') { const b = (await readBody(req)) || {}; if (b.action === 'stop') { const was = backfill.stop(); return send(res, 200, { stopped: was, status: backfill.status() }); } if (b.action === 'start') { if (b.phase && !PHASES.includes(b.phase)) return send(res, 400, { error: 'phase must be one of ' + PHASES.join(', ') }); if (backfill.isRunning()) return send(res, 200, { started: false, running: true, status: backfill.status() }); backfill.run('button', b.phase || null).then(() => health.update()).catch(e => log('backfill:', e.message)); return send(res, 202, { started: true }); } return send(res, 400, { error: "action must be 'start' or 'stop'" }); }
      if (p === '/api/digest') { try { const d = research.buildDigest('button'); return send(res, 200, { ok: !!d }); } catch (e) { return send(res, 500, { error: e.message }); } }
      if (p === '/api/refresh') { const b = (await readBody(req)) || {}; data.refresh(b.mode === 'full' ? 'full' : 'quick', 'button', Array.isArray(b.symbols) && b.symbols.length ? b.symbols : null); return send(res, 202, { started: true }); }
    }
    const file = p === '/' ? 'index.html' : p.slice(1); const fp = path.join(DIR, 'public', path.normalize(file));
    if (!fp.startsWith(path.join(DIR, 'public')) || !fs.existsSync(fp)) return send(res, 404, file === 'index.html' ? `Not found: ${fp}\nThis GNC Terminal server runs from ${DIR} but its page file is missing — an older copy is probably still running from a folder you replaced. Close every GNC Terminal window, then double-click "GNC Terminal" (the goat) in the new folder: it stops old copies first.` : 'Not found', 'text/plain');
    send(res, 200, fs.readFileSync(fp), TYPES[path.extname(fp)] || 'application/octet-stream', req);
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
});
server.on('error', e => { if (e.code === 'EADDRINUSE') { console.log(`Port ${CONFIG.port} is already in use: an older GNC Terminal is still running (possibly from another folder, or started automatically with Windows). Double-click "GNC Terminal" (the goat) instead: it stops the old copy first. If you only see "Not found" in the browser, that old copy is the reason.`); process.exit(2); } console.error(e); process.exit(1); });
if (!fs.existsSync(path.join(DIR, 'public', 'index.html'))) console.error(`!! public/index.html is missing in ${DIR} — the browser will show "Not found". Start the app from the folder that contains server.mjs AND the public folder (the inner "GNC Terminal" folder of the zip).`);
await mountRoutes();
safeReport({ put, db, inbox });
server.listen(CONFIG.port, CONFIG.bind || '127.0.0.1', () => {
  log(`GNC Terminal running at http://localhost:${CONFIG.port} — refresh every ${CONFIG.intervalMinutes} min, ${CONFIG.windowStart}–${CONFIG.windowEnd} Istanbul time${CONFIG.weekdaysOnly ? ', weekdays' : ''}; full history at ${CONFIG.fullAt.join(', ')}`);
  const st = db.docs['status/refresh'] || {}, age = st.finishedAt ? (Date.now() - new Date(st.finishedAt)) / 36e5 : 99;
  const n = coll('instruments').length, withHist = coll('instruments').filter(([, x]) => x.liveHistory && x.closes && x.closes.length >= 200).length;
  setTimeout(async () => {
    if (universe.stale(35)) { try { await universe.refresh('start-up'); } catch (e) { log('universe:', e.message); } }
    else if (universe.tefasStale(1)) { try { await universe.refreshTefas('start-up'); } catch (e) { log('TEFAS list:', e.message); } }
    if (membership.stale(20)) membership.refresh('start-up').catch(e => log('membership:', e.message));
    research.importDigests(); if (ipo.stale(10)) ipo.update('start-up'); if (lighthouse.stale(CONFIG.lighthouseEveryHours)) { lastLhAt = Date.now(); lighthouse.update('start-up'); } if (evds.stale(12)) evds.update('start-up'); if (ziraat.stale(1)) ziraat.update('start-up');
    await data.refresh(withHist < n * 0.6 || age > 20 ? 'full' : 'quick', 'start-up');
    if (research.stale(8)) research.collect('start-up');
    if (!backfill.complete() && CONFIG.backfillOnStart !== false) setTimeout(() => backfill.run('start-up (resume)'), 3 * 60000);
  }, 1500);
});
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) process.on(sig, () => { clearTimeout(saveTimer); try { writeUserDocs(); writeStore(); } catch (e) { } process.exit(0); });
