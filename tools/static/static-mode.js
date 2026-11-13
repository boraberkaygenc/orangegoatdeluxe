/* orangegoat Deluxe — GitHub Pages mode (written into the published site as static-mode.js; the local app ships a no-op file).
   Market data: data/view.json, produced by the GitHub Actions job (same content the local server's /api/view gives).
   Your own data (funds, ledger, journal, settings…): this browser only (IndexedDB), with backup and restore. */
(() => {
  const BASE = new URL('./', location.href).href, VIEW = BASE + 'data/view.json';
  const S = {}, mine = new Set(); let gen = null, info = {}; const subs = new Set();
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v)), isInst = k => k.startsWith('instruments/');
  const fire = keys => setTimeout(() => subs.forEach(f => { if (keys && f.key && !keys.some(key => f.key === key || (f.coll && key.startsWith(f.key + '/') && key.split('/').length === f.key.split('/').length + 1))) return; try { f(); } catch (e) { console.error(e); } }), 0);

  /* ---- IndexedDB key/value store for the documents you write ---- */
  const IDB = 'orangegoat-deluxe', STORE = 'docs'; let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open(IDB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(STORE, mode), s = t.objectStore(STORE); let out; Promise.resolve(fn(s)).then(v => { out = v; }); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); }); };
  const idbAll = () => tx('readonly', s => new Promise(r => { const out = {}; const c = s.openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur) return r(out); out[cur.key] = cur.value; cur.continue(); }; }));
  const idbPut = (k, v) => tx('readwrite', s => { s.put(v, k); });
  const idbDel = k => tx('readwrite', s => { s.delete(k); });
  const idbClear = () => tx('readwrite', s => { s.clear(); });
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }

  /* ---- market data from the published file ---- */
  async function pull(first) {
    try {
      const r = await fetch(VIEW + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); window.__GNC_OFFLINE = false; if (!first && j.generatedAt === gen) return; gen = j.generatedAt; info = { generatedAt: j.generatedAt, nextRun: j.nextRun || null, mode: j.mode || null, notes: j.notes || [] };
      const changed = [];
      for (const k of Object.keys(S)) if (!mine.has(k) && !(k in (j.docs || {})) && !isInst(k)) { delete S[k]; changed.push(k); }
      for (const [k, v] of Object.entries(j.docs || {})) { if (mine.has(k)) continue; S[k] = v; changed.push(k); }
      for (const k of Object.keys(S)) if (isInst(k)) delete S[k];
      for (const [sym, x] of Object.entries(j.inst || {})) S['instruments/' + sym.replace('/', '_')] = x; changed.push('instruments/x');
      if (!first) fire(changed);
    } catch (e) { window.__GNC_OFFLINE = true; console.warn('market data:', e.message); }
  }
  const ready = (async () => { try { const own = await idbAll(); for (const [k, v] of Object.entries(own)) { S[k] = v; mine.add(k); } } catch (e) { console.error('local data:', e); } await pull(true); })();
  setInterval(() => { if (document.visibilityState === 'visible') pull(false); }, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(false); });

  /* ---- the page's calls to the computer server: price series come from data/series.json, everything else answers 404 at once ---- */
  let seriesP = null; const seriesAll = () => seriesP || (seriesP = fetch(BASE + 'data/series.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : { series: {} }).catch(() => ({ series: {} })));
  const json = o => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => { const url = typeof input === 'string' ? input : input && input.url; let u = null; try { u = new URL(url, location.href); } catch (e) { }
    if (u && u.origin === location.origin && u.pathname.startsWith('/api/')) {
      if (u.pathname === '/api/series') { const all = (await seriesAll()).series || {}, out = {}; for (const s of String(u.searchParams.get('symbols') || '').split(',').filter(Boolean)) out[s] = { closes: (all[s] && all[s].closes) || [] }; return json({ series: out }); }
      return new Response('not available in the GitHub version', { status: 404, headers: { 'Content-Type': 'text/plain' } }); }
    return nativeFetch(input, init); };
  window.addEventListener('focus', () => { seriesP = null; });
  const write = (p, v) => { mine.add(p); S[p] = v; fire([p]); return idbPut(p, clone(v)).catch(e => { throw Object.assign(new Error('Could not save in this browser: ' + e.message), { code: 'storage' }); }); };
  const db = {
    doc(p) { return {
      onSnapshot(cb) { const f = () => cb({ exists: p in S, data: () => clone(S[p]) }); f.key = p; subs.add(f); ready.then(f); return () => subs.delete(f); },
      async get() { await ready; return { exists: p in S, data: () => clone(S[p]) }; },
      async set(d) { await write(p, clone(d)); },
      async update(d) { await write(p, Object.assign({}, S[p] || {}, clone(d))); },
      async delete() { mine.delete(p); delete S[p]; fire([p]); await idbDel(p); } }; },
    collection(c) { return { doc: id => db.doc(c + '/' + id),
      onSnapshot(cb) { const n = c.split('/').length + 1; const f = () => cb({ docs: Object.keys(S).filter(k => k.startsWith(c + '/') && k.split('/').length === n).map(k => ({ id: k.slice(c.length + 1), data: () => isInst(k) ? S[k] : clone(S[k]) })) }); f.key = c; f.coll = true; subs.add(f); ready.then(f); return () => subs.delete(f); } }; }
  };
  const downloads = { async save({ filename, data }) { const blob = data instanceof Blob ? data : new Blob([data]); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); return { status: 'saved' }; } };
  const when = iso => { try { return new Date(iso).toLocaleString(document.documentElement.lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso || '—'; } };
  const mcp = { async callTool() { throw Object.assign(new Error(`Prices are updated automatically on GitHub (last ${when(info.generatedAt)}${info.nextRun ? ', next about ' + when(info.nextRun) : ''}).`), { code: 'static' }); } };
  // backup / restore (also imports data/store.json and data/userdocs.json of the computer version)
  const isUserKey = k => k.startsWith('data/users/') || k === 'settings/main';
  const store = {
    info: () => ({ ...info, own: mine.size }),
    async exportAll() { const own = await idbAll(); return { app: 'orangegoat-deluxe', kind: 'backup', at: new Date().toISOString(), docs: own }; },
    async importDocs(obj, { replace } = {}) { const docs = (obj && obj.docs) || obj || {}; const keys = Object.keys(docs).filter(isUserKey); if (!keys.length) throw new Error('No funds, journal or settings found in this file.');
      if (replace) { await idbClear(); for (const k of [...mine]) { delete S[k]; } mine.clear(); }
      for (const k of keys) await write(k, docs[k]); return keys.length; },
    async wipe() { await idbClear(); location.reload(); },
    async usage() { try { const e = await navigator.storage.estimate(); return e; } catch (e) { return null; } },
  };
  window.__GNC_STATIC = { base: BASE, store };
  window.__GNC_APP = true;
  window.claude = { use: async n => ({ db, downloads, mcp, user: { id: async () => 'local', isOwner: () => true } })[n] || null };
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(BASE + 'sw.js').catch(() => { }));
})();
