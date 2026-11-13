// GNC Terminal — LAN access with a PIN.
// config.json: "remote": { "enabled": false, "pin": "" }. When enabled the server listens on 0.0.0.0 (bindAddress) and every request
// that does not come from this computer (socket address, never X-Forwarded-For) needs a session cookie from /remote-login.
// guard(req, res) is called first by server.mjs for every request; it returns true when it has answered the request itself
// (login page, refusal, or one of the raw-body upload routes registered with registerRaw, which must see the unread stream).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const COOKIE = 'gnc_session', MAX_AGE = 30 * 864e5, LOCK_AFTER = 5, LOCK_MS = 10 * 60000;
let CFG = null, DIR = null, log = () => { }, sessions = null, fails = 0, lockedUntil = 0; const RAW = [];
export function initRemote({ config, DIR: dir, log: l }) { CFG = config; DIR = dir; if (l) log = l; }
export function bindAddress(config) { return config && config.remote && config.remote.enabled ? '0.0.0.0' : (config && config.bind) || '127.0.0.1'; }
export function registerRaw(method, p, handler) { RAW.push({ method: method.toUpperCase(), path: p, handler }); }
export function isLoopback(req) { const a = String((req.socket && req.socket.remoteAddress) || ''); return a === '::1' || a.startsWith('127.') || a.startsWith('::ffff:127.'); }
// requests that only this computer may make (never over the LAN, even with a session)
export function localOnly(method, p) {
  return (method === 'POST' && (p === '/api/update' || p === '/api/restore' || p === '/api/datapack' || p === '/api/restart' || p === '/api/update/check')) || (method === 'PUT' && p === '/api/config/platform') || p.startsWith('/api/remote/sessions');
}
// local-only writes must also come from a page served by this computer: blocks DNS-rebinding and cross-site posts
function sameOriginLocal(req) {
  const host = String(req.headers.host || '').replace(/:\d+$/, '').toLowerCase(); if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) return false;
  const o = req.headers.origin; if (!o || o === 'null') return true; try { const h = new URL(o).hostname.toLowerCase(); return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(h); } catch (e) { return false; }
}

/* ---------------- sessions (hashed tokens in data/remote_sessions.json) ---------------- */
const sfile = () => path.join(DIR || '.', 'data', 'remote_sessions.json'), hash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
function load() { if (sessions) return sessions; try { sessions = JSON.parse(fs.readFileSync(sfile(), 'utf8')) || {}; } catch (e) { sessions = {}; } return sessions; }
function persist() { try { fs.mkdirSync(path.dirname(sfile()), { recursive: true }); const now = Date.now(); for (const [k, v] of Object.entries(sessions)) if (!v || v.expires < now) delete sessions[k]; fs.writeFileSync(sfile(), JSON.stringify(sessions)); } catch (e) { log('remote sessions save failed:', e.message); } }
export function clearSessions() { sessions = {}; persist(); }
export function sessionCount() { const now = Date.now(); return Object.values(load()).filter(v => v && v.expires > now).length; }
function cookieOf(req) { const m = String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_\\-]{20,})')); return m ? m[1] : null; }
function validSession(req) { const t = cookieOf(req); if (!t) return false; const s = load()[hash(t)]; if (!s || s.expires < Date.now()) return false; s.seen = new Date().toISOString(); return true; }
export function pinMatches(given, pin) { const a = crypto.createHash('sha256').update(String(given || '')).digest(), b = crypto.createHash('sha256').update(String(pin || '')).digest(); return crypto.timingSafeEqual(a, b) && String(pin || '').length > 0; }

/* ---------------- LAN addresses ---------------- */
export function lanUrls(port) { const out = []; for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) out.push({ iface: name, address: a.address, url: `http://${a.address}:${port}/` }); return out; }
export function remoteInfo(config) { const r = (config && config.remote) || {}; return { enabled: !!r.enabled, pinSet: !!(r.pin && String(r.pin).length >= 4), bound: bindAddress(config), port: config.port, urls: lanUrls(config.port), sessions: sessionCount(), lockedUntil: lockedUntil > Date.now() ? new Date(lockedUntil).toISOString() : null, restartNeeded: !!(config.__bound && config.__bound !== bindAddress(config)) }; }

/* ---------------- login page ---------------- */
const page = (msg, next, status = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GNC Terminal · sign in</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0f12;color:#e8e6e1;font:16px/1.4 system-ui,Segoe UI,sans-serif}form{background:#171a1f;border:1px solid #2a2f37;padding:28px 26px;border-radius:10px;width:min(320px,86vw)}
h1{font-size:18px;margin:0 0 4px;color:#f28c28}p{margin:0 0 16px;color:#a5a29b;font-size:14px}input{width:100%;box-sizing:border-box;font-size:22px;letter-spacing:6px;text-align:center;padding:10px;border-radius:6px;border:1px solid #3a404a;background:#0d0f12;color:#fff}
button{margin-top:14px;width:100%;padding:10px;font-size:16px;border:0;border-radius:6px;background:#f28c28;color:#111;font-weight:600}.m{color:#ff7b6b;margin-top:12px;font-size:14px;min-height:1em}</style></head>
<body><form method="post" action="/remote-login"><h1>GNC Terminal</h1><p>Enter the PIN set on the main computer (Settings › System › Remote access).</p>
<input type="hidden" name="next" value="${String(next || '/').replace(/[^\w\/\-.?=&%]/g, '')}"><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus required ${status}>
<button type="submit" ${status}>Sign in</button><div class="m">${msg || ''}</div></form></body></html>`;
function sendHTML(res, code, html, extra = {}) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', ...extra }); res.end(html); }
function sendJSON(res, code, o) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); }
function readForm(req) { return new Promise(ok => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) req.destroy(); }); req.on('end', () => ok(Object.fromEntries(new URLSearchParams(s)))); req.on('error', () => ok({})); }); }
async function login(req, res, u) {
  const r = (CFG && CFG.remote) || {}, pinOk = r.pin && String(r.pin).length >= 4, locked = lockedUntil > Date.now();
  const lockMsg = () => `Too many wrong PINs. Try again in ${Math.ceil((lockedUntil - Date.now()) / 60000)} minute(s).`;
  if (req.method !== 'POST') return sendHTML(res, 200, page(!pinOk ? 'No PIN is set on the main computer yet.' : locked ? lockMsg() : '', u.searchParams.get('next') || '/', !pinOk || locked ? 'disabled' : ''));
  const f = await readForm(req);
  if (!pinOk) return sendHTML(res, 403, page('No PIN is set on the main computer yet.', '/', 'disabled'));
  if (locked) return sendHTML(res, 429, page(lockMsg(), f.next, 'disabled'));
  if (!pinMatches(f.pin, r.pin)) { fails++; if (fails >= LOCK_AFTER) { lockedUntil = Date.now() + LOCK_MS; fails = 0; log(`remote: ${LOCK_AFTER} wrong PINs (last from ${req.socket.remoteAddress}); sign-in locked for 10 minutes`); return sendHTML(res, 429, page(lockMsg(), f.next, 'disabled')); } return sendHTML(res, 401, page(`Wrong PIN (${LOCK_AFTER - fails} tries left before a 10-minute lock).`, f.next)); }
  fails = 0; const tok = crypto.randomBytes(32).toString('base64url'); load()[hash(tok)] = { created: new Date().toISOString(), expires: Date.now() + MAX_AGE, ip: req.socket.remoteAddress, ua: String(req.headers['user-agent'] || '').slice(0, 120) }; persist();
  log(`remote: new session for ${req.socket.remoteAddress}`);
  const next = /^\/(?!\/)[\w\/\-.?=&%]*$/.test(f.next || '') ? f.next : '/';
  res.writeHead(303, { Location: next, 'Set-Cookie': `${COOKIE}=${tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE / 1000}`, 'Cache-Control': 'no-store' }); res.end();
}

/* ---------------- the guard ---------------- */
export async function guard(req, res) {
  let u; try { u = new URL(req.url, 'http://localhost'); } catch (e) { sendJSON(res, 400, { error: 'bad url' }); return true; }
  const p = u.pathname, loop = isLoopback(req);
  if (!loop) {
    if (!CFG || !CFG.remote || !CFG.remote.enabled) { sendJSON(res, 403, { error: 'remote access is switched off on the main computer' }); return true; }
    if (p === '/remote-login') { await login(req, res, u); return true; }
    if (p === '/remote-logout') { const t = cookieOf(req); if (t) { delete load()[hash(t)]; persist(); } res.writeHead(303, { Location: '/remote-login', 'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` }); res.end(); return true; }
    if (!validSession(req)) { if (p.startsWith('/api/')) sendJSON(res, 401, { error: 'sign in first', login: '/remote-login' }); else { res.writeHead(302, { Location: '/remote-login?next=' + encodeURIComponent(p + u.search) }); res.end(); } return true; }
    if (localOnly(req.method, p)) { sendJSON(res, 403, { error: 'this action is only available on the main computer' }); return true; }
  } else if (localOnly(req.method, p) && !sameOriginLocal(req)) { sendJSON(res, 403, { error: 'open the app at http://localhost to do this' }); return true; }
  for (const r of RAW) { if (r.method !== req.method) continue; const m = typeof r.path === 'string' ? (r.path === p ? [p] : null) : p.match(r.path); if (!m) continue;
    try { await r.handler(req, res, u, m); } catch (e) { try { sendJSON(res, e.code === 413 ? 413 : 500, { error: String(e.message || e) }); } catch (_) { } } return true; }
  return false;
}
