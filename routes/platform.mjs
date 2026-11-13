// GNC Terminal — platform routes: backup / restore, data pack, update, safe-mode status, LAN access info, notifications,
// and the platform part of config.json (GET/PUT /api/config/platform; secrets are never returned in full).
// Upload routes (raw ZIP / large JSON bodies) are registered with remote.registerRaw, because server.mjs parses every POST
// body as JSON before calling a route handler; remote.guard (first line of the request handler) serves them.
import fs from 'node:fs';
import path from 'node:path';
import { makeBackup, applyRestore, validateBackup, writeDatapack, importDatapack, bodyToFile, appVersion } from '../backup.mjs';
import { createUpdater } from '../update.mjs';
import { initRemote, registerRaw, remoteInfo, clearSessions, bindAddress } from '../remote.mjs';
import { initNotify, test as notifyTest, notifyLog, telegramReady, smtpReady, weeklyFacts, weeklyText } from '../notify.mjs';
import { modulesStatus, storeStatus } from '../safemode.mjs';

export const PLATFORM_DEFAULTS = { remote: { enabled: false, pin: '' }, telegram: { token: '', chatId: '' }, smtp: { host: '', port: 465, secure: true, user: '', pass: '', from: '', to: '' }, notify: { forward: true, weeklyTelegram: true, weeklyEmail: true, weeklyPdf: true }, updateUrl: '' };
const SECRETS = { telegram: ['token'], smtp: ['pass'], remote: ['pin'] }, MASK = '••••';
export const mask = (v, full) => !v ? '' : full ? MASK : MASK + String(v).slice(-4);
export function publicConfig(config) {
  const out = {}; for (const [k, d] of Object.entries(PLATFORM_DEFAULTS)) { const v = config[k]; out[k] = d && typeof d === 'object' ? { ...d, ...(v && typeof v === 'object' ? v : {}) } : (v ?? d); }
  for (const [k, fields] of Object.entries(SECRETS)) for (const f of fields) out[k][f] = mask(out[k][f], k === 'remote');
  return out;
}
const isMasked = v => typeof v === 'string' && v.startsWith(MASK);
function readFileJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function readRawJSON(req, max) { return new Promise((ok, bad) => { const parts = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { bad(Object.assign(new Error('body too large'), { code: 413 })); req.destroy(); } else parts.push(c); }); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(parts).toString('utf8') || 'null')); } catch (e) { bad(new Error('the file is not valid JSON')); } }); req.on('error', bad); }); }
const isZip = req => /application\/(zip|x-zip-compressed|octet-stream)/.test(String(req.headers['content-type'] || ''));
const isJSON = req => /application\/json/.test(String(req.headers['content-type'] || ''));

export function routes(ctx) {
  const { db, put, log, inbox, config, DIR, send, readBody, store2 } = ctx;
  const updater = createUpdater({ DIR, config, log, inbox, save: ctx.save });
  initRemote({ config, DIR, log }); initNotify(ctx); updater.startDailyCheck();
  const tmp = name => path.join(DIR, 'data', 'tmp', name + '-' + Date.now().toString(36) + '.zip');
  const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };

  /* ---- raw-body routes (served by remote.guard) ---- */
  registerRaw('POST', '/api/restore', async (req, res, u) => {
    if (!isJSON(req)) return json(res, 415, { error: 'send the backup as application/json' });
    const b = await readRawJSON(req, 400 * 1048576), backup = b && b.backup ? b.backup : b, mode = (b && b.mode) || u.searchParams.get('mode') || 'merge';
    try { validateBackup(backup); } catch (e) { return json(res, 400, { error: e.message }); }
    try { const s = applyRestore({ db, put, DIR, log }, backup, mode); inbox('info', `Restored a backup (${mode})`, `Backup of ${backup.meta.createdAt || 'unknown date'} (version ${backup.meta.version || '?'}) restored: ${s.added} added, ${s.replaced} replaced, ${s.merged} merged, ${s.removed} removed. The state before the restore is kept in ${s.safetyCopy}.`, 'app'); return json(res, 200, { ok: true, ...s, from: backup.meta }); }
    catch (e) { return json(res, 400, { error: e.message }); }
  });
  registerRaw('POST', '/api/datapack', async (req, res) => {
    if (!isZip(req)) return json(res, 415, { error: 'send the data pack as application/zip' });
    const f = tmp('datapack'); try { const bytes = await bodyToFile(req, f, 500 * 1048576); const s = importDatapack(f, store2, log); return json(res, 200, { ok: true, bytes, ...s }); }
    finally { try { fs.unlinkSync(f); } catch (e) { } }
  });
  registerRaw('POST', '/api/update', async (req, res, u) => {
    if (!isZip(req)) return json(res, 415, { error: 'send the app ZIP as application/zip' });
    const f = tmp('update'); let r;
    try { await bodyToFile(req, f, 400 * 1048576); r = updater.apply(f); }
    catch (e) { log('update failed:', e.message); return json(res, e.code === 413 ? 413 : 400, { ok: false, error: e.message }); }
    finally { try { fs.unlinkSync(f); } catch (e) { } }
    const restart = u.searchParams.get('restart') !== '0'; json(res, 200, { ...r, restarting: restart });
    try { inbox('good', `Updated to ${r.to}`, `GNC Terminal was updated from ${r.from} to ${r.to} (${r.replaced} files replaced, ${r.added} added). A copy of the old files is in ${r.rollback}.`, 'app'); } catch (e) { }
    if (restart) updater.restart(1500);
  });

  return [
    { method: 'GET', path: '/api/backup', handler: async (req, res, u) => { const full = u.searchParams.get('full') === '1', b = makeBackup(db, { full, DIR }), day = ctx.ist().date;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="GNC-${full ? 'full-' : ''}backup-${day}.json"`, 'Cache-Control': 'no-store' }); res.end(JSON.stringify(b)); } },
    { method: 'GET', path: '/api/datapack', handler: async (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="GNC-datapack-${ctx.ist().date}.zip"`, 'Cache-Control': 'no-store' });
      let closed = false; res.on('close', () => { closed = true; });
      const write = b => new Promise((ok, bad) => { if (closed) return bad(new Error('client went away')); if (res.write(b)) return ok(); const t = () => { res.off('close', c); ok(); }, c = () => { res.off('drain', t); bad(new Error('client went away')); }; res.once('drain', t); res.once('close', c); });
      try { const r = await writeDatapack(DIR, write, appVersion(DIR)); res.end(); log(`data pack exported: ${r.files} files, ${(r.bytes / 1048576).toFixed(1)} MB`); } catch (e) { log('data pack export stopped:', e.message); try { res.destroy(); } catch (_) { } } } },
    { method: 'GET', path: '/api/update/status', handler: async (req, res) => send(res, 200, updater.status()) },
    { method: 'POST', path: '/api/update/check', handler: async (req, res) => send(res, 200, await updater.check('button')) },
    { method: 'POST', path: '/api/restart', handler: async (req, res) => { send(res, 200, { ok: true, restarting: true }); updater.restart(800); } },
    { method: 'GET', path: '/api/health/modules', handler: async (req, res) => { const m = modulesStatus(); send(res, 200, { modules: m, failed: Object.keys(m).filter(k => !m[k].ok), store: storeStatus() }); } },
    { method: 'GET', path: '/api/remote/info', handler: async (req, res) => send(res, 200, remoteInfo(config)) },
    { method: 'POST', path: '/api/remote/sessions/clear', handler: async (req, res) => { clearSessions(); send(res, 200, { ok: true }); } },
    { method: 'GET', path: '/api/config/platform', handler: async (req, res) => send(res, 200, { config: publicConfig(config), telegramReady: telegramReady(), smtpReady: smtpReady(), remote: remoteInfo(config), log: notifyLog().slice(0, 12) }) },
    { method: 'PUT', path: '/api/config/platform', handler: async (req, res, u, body) => {
      if (!body || typeof body !== 'object') return send(res, 400, { error: 'send a JSON object' });
      const file = path.join(DIR, 'config.json'), raw = readFileJSON(file) || {}, changed = [];
      for (const k of Object.keys(PLATFORM_DEFAULTS)) {
        if (!(k in body)) continue; const d = PLATFORM_DEFAULTS[k];
        if (k === 'updateUrl') { const v = String(body.updateUrl || '').trim(); if (v && !/^https?:\/\/\S+$/.test(v)) return send(res, 400, { error: 'updateUrl must start with http:// or https://' }); raw.updateUrl = config.updateUrl = v; changed.push(k); continue; }
        const inp = body[k]; if (!inp || typeof inp !== 'object') continue; const cur = { ...d, ...(config[k] || {}) }, next = { ...cur };
        for (const f of Object.keys(d)) { if (!(f in inp)) continue; let v = inp[f]; if ((SECRETS[k] || []).includes(f) && isMasked(v)) continue;
          if (typeof d[f] === 'boolean') v = !!v; else if (typeof d[f] === 'number') { v = +v; if (!isFinite(v) || v <= 0 || v > 65535) return send(res, 400, { error: `${k}.${f} must be a port number` }); } else v = String(v ?? '').trim(); next[f] = v; }
        if (k === 'remote') { if (next.pin && !/^\S{4,32}$/.test(next.pin)) return send(res, 400, { error: 'the PIN needs 4 to 32 characters without spaces' }); if (next.enabled && !next.pin) return send(res, 400, { error: 'set a PIN before switching remote access on' }); if (next.pin !== cur.pin) clearSessions(); }
        if (k === 'telegram' && next.token && !/^\d+:[\w-]{20,}$/.test(next.token)) return send(res, 400, { error: 'the Telegram token looks like 123456789:AA… (from @BotFather)' });
        raw[k] = { ...(raw[k] || {}), ...next }; config[k] = { ...next }; changed.push(k);
      }
      try { const tmpf = file + '.tmp'; fs.writeFileSync(tmpf, JSON.stringify(raw, null, 2)); try { fs.renameSync(tmpf, file); } catch (e) { fs.copyFileSync(tmpf, file); fs.unlinkSync(tmpf); } } catch (e) { return send(res, 500, { error: 'could not write config.json: ' + e.message }); }
      log('config: platform settings changed (' + changed.join(', ') + ')');
      return send(res, 200, { ok: true, changed, config: publicConfig(config), restartNeeded: bindAddress(config) !== (config.__bound || '127.0.0.1') });
    } },
    { method: 'POST', path: '/api/notify/test', handler: async (req, res, u, body) => send(res, 200, await notifyTest(body && body.channel)) },
    { method: 'GET', path: '/api/notify/preview', handler: async (req, res) => { try { const f = weeklyFacts(); send(res, 200, { facts: f, text: weeklyText(f) }); } catch (e) { send(res, 500, { error: e.message }); } } },
  ];
}
