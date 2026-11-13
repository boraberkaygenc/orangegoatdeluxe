// GNC Terminal — safe mode: one failing module must not stop the server.
//  - safe(name, factory, log): runs a module factory; on error logs it, records { ok:false, error } and returns an inert stand-in
//    (every method returns a resolved promise), so the rest of the server keeps working.
//  - loadStore(file, log): reads data/store.json; if it exists but cannot be parsed, keeps the damaged file and starts from the
//    newest readable data/backups/store-*.json.
//  - report({ put, db, inbox }): writes status/modules, adds `modules` to status/health and an inbox warning per failed module.
import fs from 'node:fs';
import path from 'node:path';

const MODULES = {}; let storeNote = null;
export function markModule(name, ok, error) { MODULES[name] = ok ? { ok: true } : { ok: false, error: String((error && error.message) || error || 'failed'), at: new Date().toISOString() }; }
export function modulesStatus() { return JSON.parse(JSON.stringify(MODULES)); }
export function storeStatus() { return storeNote; }

// an inert object: any property is a function returning a resolved promise; awaiting it does not hang (no `then`)
export function stub(name) {
  const fn = function () { return Promise.resolve(undefined); };
  return new Proxy(fn, {
    get(t, prop) { if (prop === 'then') return undefined; if (prop === Symbol.toPrimitive) return () => `[${name} unavailable]`; if (prop === '__unavailable') return name; if (prop in t && prop !== 'name' && prop !== 'length') return t[prop]; return stub(name + '.' + String(prop)); },
    apply() { return Promise.resolve(undefined); }
  });
}
export function safe(name, factory, log = console.log) {
  try { const m = factory(); markModule(name, true); return m; }
  catch (e) { markModule(name, false, e); try { log(`SAFE MODE: module ${name} failed to start: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`); } catch (_) { } return stub(name); }
}

export function loadStore(file, log = console.log) {
  if (!fs.existsSync(file)) return null;
  let err; try { const db = JSON.parse(fs.readFileSync(file, 'utf8')); if (db && typeof db === 'object' && db.docs && typeof db.docs === 'object') return db; err = new Error('no docs in the file'); } catch (e) { err = e; }
  const ts = new Date().toISOString().replace(/[:.]/g, '-'), kept = file.replace(/\.json$/, '') + `.damaged-${ts}.json`;
  try { fs.renameSync(file, kept); } catch (e) { try { fs.copyFileSync(file, kept); } catch (_) { } }
  const dir = path.join(path.dirname(file), 'backups'); let list = [];
  try { list = fs.readdirSync(dir).filter(x => /^store-\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort().reverse(); } catch (e) { }
  for (const f of list) {
    try { const db = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (db && db.docs) {
      storeNote = { level: 'bad', title: 'Started from a backup: data/store.json was damaged', body: `data/store.json could not be read (${err.message}). The app started from the backup ${f} instead, so changes made after that day are missing. The damaged file was kept as ${path.basename(kept)} in the data folder.` };
      log(`SAFE MODE: store.json unreadable (${err.message}); loaded backups/${f}; damaged file kept as ${path.basename(kept)}`); return db; } } catch (e) { }
  }
  storeNote = { level: 'bad', title: 'Started empty: data/store.json was damaged and no backup could be read', body: `data/store.json could not be read (${err.message}) and no readable backup was found in data/backups. The app started from the seed data. The damaged file was kept as ${path.basename(kept)}.` };
  log('SAFE MODE: store.json unreadable and no usable backup; starting from seed'); return null;
}

export function report({ put, db, inbox }) {
  const mods = modulesStatus(), failed = Object.entries(mods).filter(([, v]) => !v.ok), at = new Date().toISOString();
  try { put('status/modules', { at, modules: mods, failed: failed.map(([k]) => k), store: storeNote ? storeNote.title : 'ok' }); } catch (e) { }
  try { const h = db.docs['status/health'] || {}; put('status/health', { schemaVersion: 2, ...h, modules: mods }); } catch (e) { }
  for (const [name, v] of failed) try { inbox('warn', `Safe mode: ${name} did not start`, `The ${name} module failed at start-up (${v.error}). The rest of the app runs; features that need ${name} are unavailable until the problem is fixed and the app restarted. Details are in data/refresh.log.`, 'health'); } catch (e) { }
  if (storeNote) try { inbox(storeNote.level, storeNote.title, storeNote.body, 'health'); } catch (e) { }
  return { failed: failed.length };
}
