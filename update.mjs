// GNC Terminal — update from the shipped ZIP (GNC-Terminal-App.zip, top folder "GNC Terminal/"), rollback copy, restart,
// and an optional daily check of config.updateUrl ({ version, url } JSON) that only raises an inbox message.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openZip, safeRel, appVersion } from './backup.mjs';

const VER_RE = /id="app-ver"[^>]*>([^<]*)</;
export const versionDir = v => String(v || 'unknown').trim().replace(/\s*·\s*/g, '-').replace(/[^\w.\-]+/g, '_').slice(0, 60) || 'unknown';
export function versionNum(v) { const m = String(v || '').match(/v?(\d+)\.(\d+)(?:\.(\d+))?/); return m ? [+m[1], +m[2], +(m[3] || 0)] : null; }
export function newer(a, b) { const x = versionNum(a), y = versionNum(b); if (!x || !y) return String(a || '') !== String(b || '') && !!a; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; }
// add keys that exist in `fresh` but not in `cur` (recursively for plain objects); user values always win
export function mergeConfig(cur, fresh) { const out = { ...cur }; for (const [k, v] of Object.entries(fresh || {})) { if (!(k in out)) out[k] = v; else if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = mergeConfig(out[k], v); } return out; }
const SKIP = rel => rel === 'config.json' || rel.startsWith('data/') || rel === 'data' || rel.startsWith('update_staging/') || /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(rel) || rel.startsWith('__MACOSX/');
function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { } }
function writeAtomic(fp, buf) { fs.mkdirSync(path.dirname(fp), { recursive: true }); const tmp = fp + '.upd-tmp'; fs.writeFileSync(tmp, buf); try { fs.renameSync(tmp, fp); } catch (e) { fs.copyFileSync(tmp, fp); try { fs.unlinkSync(tmp); } catch (_) { } } }

export function createUpdater({ DIR, config, log = () => { }, inbox = () => { }, save = () => { } }) {
  const STATUS = path.join(DIR, 'data', 'update_status.json'), STAGE = path.join(DIR, 'update_staging');
  const readStatus = () => { try { return JSON.parse(fs.readFileSync(STATUS, 'utf8')); } catch (e) { return {}; } };
  const writeStatus = o => { try { fs.mkdirSync(path.dirname(STATUS), { recursive: true }); fs.writeFileSync(STATUS, JSON.stringify({ ...readStatus(), ...o }, null, 1)); } catch (e) { log('update status save failed:', e.message); } };
  let busy = false;

  // inspect: find the app root inside the zip (the folder that holds server.mjs AND public/index.html), read the new version
  function inspect(zipFile) {
    const z = openZip(zipFile);
    try { const names = new Set(z.entries.filter(e => !e.dir).map(e => e.name)); const roots = [...names].filter(n => n === 'server.mjs' || n.endsWith('/server.mjs')).map(n => n.slice(0, -'server.mjs'.length)).filter(r => names.has(r + 'public/index.html')).sort((a, b) => a.length - b.length);
      if (!roots.length) throw new Error('this ZIP is not a GNC Terminal app: it must contain server.mjs and public/index.html (in the "GNC Terminal" folder)');
      const root = roots[0], html = z.read(z.entries.find(e => e.name === root + 'public/index.html')).toString('utf8'), to = (html.match(VER_RE) || [])[1];
      if (!to) throw new Error('public/index.html in the ZIP has no version badge (id="app-ver")');
      return { z, root, to: to.trim() }; } catch (e) { z.close(); throw e; }
  }

  function apply(zipFile) {
    if (busy) throw new Error('an update is already being installed'); busy = true;
    try {
      const { z, root, to } = inspect(zipFile), from = appVersion(DIR) || 'unknown', files = [];
      try {
        rmrf(STAGE); fs.mkdirSync(STAGE, { recursive: true });
        for (const e of z.entries) { if (e.dir || !e.name.startsWith(root)) continue; const rel = safeRel(e.name.slice(root.length)); if (!rel) continue; const fp = path.join(STAGE, ...rel.split('/')); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, z.read(e)); files.push(rel); }
      } finally { z.close(); }
      if (!files.includes('server.mjs') || !files.includes('public/index.html')) throw new Error('staging failed: server.mjs or public/index.html missing after extraction');
      // rollback copy of everything that is about to be overwritten, plus config.json
      let rb = path.join(DIR, 'data', 'rollback', versionDir(from)); if (fs.existsSync(rb)) rb += '-' + new Date().toISOString().replace(/[:.]/g, '-');
      const changed = [], added = [];
      for (const rel of files) { if (SKIP(rel)) continue; const dst = path.join(DIR, ...rel.split('/')), src = path.join(STAGE, ...rel.split('/'));
        if (fs.existsSync(dst)) { const a = fs.readFileSync(dst), b = fs.readFileSync(src); if (a.equals(b)) continue; const keep = path.join(rb, ...rel.split('/')); fs.mkdirSync(path.dirname(keep), { recursive: true }); fs.writeFileSync(keep, a); changed.push(rel); } else added.push(rel); }
      if (fs.existsSync(path.join(DIR, 'config.json'))) { fs.mkdirSync(rb, { recursive: true }); fs.copyFileSync(path.join(DIR, 'config.json'), path.join(rb, 'config.json')); }
      fs.mkdirSync(rb, { recursive: true }); fs.writeFileSync(path.join(rb, 'ROLLBACK.txt'), `GNC Terminal rollback copy\r\nVersion before the update: ${from}\r\nUpdated to: ${to}\r\nDate: ${new Date().toISOString()}\r\n\r\nTo go back: close GNC Terminal, copy every file in this folder over the app folder (keep the folder structure), then start it again.\r\nFiles replaced: ${changed.length}; files added by the update (delete them to go back fully): ${added.join(', ') || 'none'}\r\n`);
      // copy (server.mjs last, so a half-finished copy never starts a new server with old modules)
      const order = [...changed, ...added].sort((a, b) => (a === 'server.mjs') - (b === 'server.mjs'));
      for (const rel of order) writeAtomic(path.join(DIR, ...rel.split('/')), fs.readFileSync(path.join(STAGE, ...rel.split('/'))));
      // config.json: keep the user's values, add new keys from the new file
      let cfgAdded = [];
      if (files.includes('config.json')) { let cur = {}; try { cur = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8')); } catch (e) { cur = null; }
        try { const fresh = JSON.parse(fs.readFileSync(path.join(STAGE, 'config.json'), 'utf8')); if (cur) { const merged = mergeConfig(cur, fresh); cfgAdded = Object.keys(merged).filter(k => !(k in cur)); if (JSON.stringify(merged) !== JSON.stringify(cur)) writeAtomic(path.join(DIR, 'config.json'), JSON.stringify(merged, null, 2)); } else writeAtomic(path.join(DIR, 'config.json'), JSON.stringify(fresh, null, 2)); } catch (e) { log('update: new config.json unreadable, kept the current one:', e.message); } }
      rmrf(STAGE);
      const rec = { from, to, at: new Date().toISOString(), replaced: changed.length, added: added.length, configKeysAdded: cfgAdded, rollback: path.relative(DIR, rb) };
      writeStatus({ last: rec, history: [...(readStatus().history || []), rec].slice(-20) });
      log(`update: ${from} -> ${to}; ${changed.length} files replaced, ${added.length} added; rollback copy in ${rec.rollback}`);
      return { ok: true, ...rec };
    } finally { busy = false; }
  }

  // restart: flush the store, then start a detached copy that waits until the port is free, and exit.
  // GNC_SUPERVISED=1 (set by a launcher that restarts the server in a loop) makes it just exit with code 75 instead.
  function restart(delay = 1500) {
    try { save(); } catch (e) { }
    setTimeout(() => {
      if (process.env.GNC_SUPERVISED === '1') { log('restart: exiting with code 75 for the launcher to start the new version'); process.exit(75); }
      const code = `const net=require('net'),{pathToFileURL}=require('url');const port=+process.env.GNC_RESTART_PORT,host=process.env.GNC_RESTART_HOST,file=process.env.GNC_RESTART_FILE;let n=0;
(function t(){const s=net.createServer();s.once('error',()=>{if(++n>240)process.exit(3);setTimeout(t,250)});s.listen(port,host,()=>s.close(()=>import(pathToFileURL(file).href).catch(e=>{console.error(e);process.exit(1)})))})();`;
      try { const child = spawn(process.execPath, [...process.execArgv, '-e', code], { cwd: process.cwd(), detached: true, stdio: 'ignore', windowsHide: false, env: { ...process.env, GNC_RESTART_PORT: String(config.port), GNC_RESTART_HOST: config.__bound || '127.0.0.1', GNC_RESTART_FILE: path.join(DIR, 'server.mjs') } }); child.unref(); log(`restart: new server process ${child.pid} waits for port ${config.port}`); }
      catch (e) { log('restart: could not start the new process:', e.message, '— start GNC Terminal again by hand'); }
      setTimeout(() => process.exit(0), 150);
    }, delay);
  }

  function status() {
    const st = readStatus(); let rollbacks = []; try { rollbacks = fs.readdirSync(path.join(DIR, 'data', 'rollback')).filter(d => fs.statSync(path.join(DIR, 'data', 'rollback', d)).isDirectory()).sort(); } catch (e) { }
    return { version: appVersion(DIR), dir: DIR, node: process.versions.node, pid: process.pid, uptimeSec: Math.round(process.uptime()), busy, last: st.last || null, rollbacks, updateUrl: config.updateUrl || '', available: st.available && newer(st.available.version, appVersion(DIR)) ? st.available : null, lastCheck: st.lastCheck || null, supervised: process.env.GNC_SUPERVISED === '1' };
  }

  async function check(reason = 'daily') {
    const url = String(config.updateUrl || '').trim(); if (!url) return { skipped: 'no updateUrl' };
    try { const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'GNC Terminal update check' } }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); if (!j || !j.version) throw new Error('no version in the answer');
      const cur = appVersion(DIR), avail = newer(j.version, cur), st = readStatus(); writeStatus({ lastCheck: { at: new Date().toISOString(), version: j.version, ok: true, reason }, available: avail ? { version: j.version, url: j.url || null, notes: j.notes || null } : null });
      if (avail && (!st.notified || st.notified !== j.version)) { inbox('info', `${String(j.version).split('·')[0].trim()} is available`, `A newer GNC Terminal (${j.version}) is available${j.url ? ' at ' + j.url : ''}. You run ${cur}. Download the ZIP, then use Settings › System › Update to install it. Nothing is installed automatically.`, 'update'); writeStatus({ notified: j.version }); }
      return { ok: true, version: j.version, available: avail };
    } catch (e) { writeStatus({ lastCheck: { at: new Date().toISOString(), ok: false, error: e.message, reason } }); log('update check failed:', e.message); return { ok: false, error: e.message }; }
  }
  function startDailyCheck() {
    const tick = () => { if (!String(config.updateUrl || '').trim()) return; const lc = readStatus().lastCheck; if (lc && Date.now() - new Date(lc.at) < 23.5 * 36e5) return; check('daily').catch(() => { }); };
    setTimeout(tick, 90000).unref(); setInterval(tick, 3 * 36e5).unref();
  }
  rmrf(STAGE); // leftovers of an interrupted update
  return { inspect, apply, restart, status, check, startDailyCheck };
}
