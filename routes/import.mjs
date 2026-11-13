// Broker statement import (see V4_CONTRACT.md, worker "import").
// POST /api/import/parse   body: JSON { name, mime, data: <base64> } (what the page sends), or a raw application/pdf / text/csv
//                          body when the server leaves the stream unread. ≤ 15 MB. → parsed result + duplicate + per-trade matches.
// POST /api/import/log     body: { docNo, broker, date, file, sigs: [...], fundId?, fundName?, action } → remembers what was imported
// GET  /api/import/log     → the import log (data/imports_log.json)
// GET  /api/import/pending → files read from the watched imports/ folder, waiting for confirmation
// POST /api/import/pending/clear  body: { id } (or { all: true })
// Watched folder: config "importsWatch": true (default false) → every 30 s new PDFs/CSVs in imports/ are parsed, an inbox
// message is written and the files move to imports/done/.
import fs from 'node:fs';
import path from 'node:path';
import { parseStatement, signature } from '../pdfimport.mjs';

const MAX = 15 * 1024 * 1024;
function readJSON(p, d) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } }
function writeJSON(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); const tmp = p + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(v, null, 1)); try { fs.renameSync(tmp, p); } catch (e) { fs.writeFileSync(p, JSON.stringify(v, null, 1)); } }
function rawBody(req) { return new Promise((ok, bad) => { if (req.readableEnded || req.complete && !req.readable) return ok(null); const parts = []; let n = 0; req.on('data', c => { n += c.length; if (n > MAX + 1024) { bad(new Error('file is larger than 15 MB')); req.destroy(); } else parts.push(c); }); req.on('end', () => ok(Buffer.concat(parts))); req.on('error', bad); }); }
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

export function routes(ctx) {
  const { db, send, log, inbox, DIR } = ctx, LOGF = path.join(DIR, 'data', 'imports_log.json'), PEND = path.join(DIR, 'data', 'imports_pending.json'), UID = 'local';
  const inst = s => db.docs['instruments/' + s] || null;
  const known = s => !!inst(s);
  const suggest = sym => { const out = []; for (const k of Object.keys(db.docs)) { if (!k.startsWith('instruments/')) continue; const s = k.slice(12); if (s === sym) continue; if (s.startsWith(sym) || sym.startsWith(s) && s.length >= 4 || lev(s, sym) <= 1) out.push(s); if (out.length >= 6) break; } return out; };
  const pkgs = () => ((db.docs[`data/users/${UID}/packages`] || {}).items || []), holds = () => ((db.docs[`data/users/${UID}/holdings`] || {}).items || []);
  function matches(t) {
    const x = inst(t.symbol), m = { universe: !!x, name: x ? (x.name || '') : null, cls: x ? x.cls : null, ccy: x ? x.ccy : null, suggest: x ? [] : suggest(t.symbol), openOrders: [], positions: [] };
    for (const p of pkgs()) { if (p.status === 'closed') continue;
      if (t.side === 'BUY') for (const tr of p.tranches || []) if (tr.status === 'pending') for (const tl of tr.lines || []) if (tl.symbol === t.symbol && !tl.done && !tl.skipped) m.openOrders.push({ id: `${p.id}|t${tr.n}|${t.symbol}`, pkg: p.id, fund: p.name, fundId: p.fundId || null, tranche: tr.n, due: tr.date, amount: Math.round(tl.amount * 100) / 100 });
      for (const l of p.lines || []) if (l.symbol === t.symbol && !l.closed && (+l.qty || 0) > 0) m.positions.push({ pkg: p.id, fund: p.name, qty: +l.qty, priceAt: l.priceAt || null }); }
    for (const h of holds()) if (h.symbol === t.symbol && (+h.qty || 0) > 0) m.positions.push({ holding: true, qty: +h.qty, cost: h.cost || null });
    return m;
  }
  function duplicate(res) {
    const L = readJSON(LOGF, { items: [] }).items || [], sigs = new Set(res.trades.map(t => t.sig || signature(t))), hits = [];
    for (const e of L) { const same = res.docNo && e.docNo && String(e.docNo) === String(res.docNo) && (!e.broker || !res.broker || e.broker === res.broker); const overlap = (e.sigs || []).filter(s => sigs.has(s));
      if (same || overlap.length) hits.push({ at: e.at, docNo: e.docNo || null, file: e.file || null, fundId: e.fundId || null, fundName: e.fundName || null, byDocNo: !!same, trades: overlap.length }); }
    const dupSigs = new Set(L.flatMap(e => e.sigs || [])); for (const t of res.trades) t.duplicate = dupSigs.has(t.sig);
    return hits.length ? { docNo: hits.some(h => h.byDocNo), trades: res.trades.filter(t => t.duplicate).length, previous: hits.slice(-5) } : null;
  }
  function parseBuf(buf, name, mime) { const res = parseStatement(buf, { name, mime, known }); res.duplicate = duplicate(res); for (const t of res.trades) t.match = matches(t); return res; }

  /* ---- watched folder ---- */
  const watchOn = () => ctx.config.importsWatch === true || process.env.GNC_IMPORTS_WATCH === '1';
  const IMP = path.join(DIR, 'imports'), DONE = path.join(IMP, 'done');
  function scan() { if (!watchOn()) return 0; let n = 0; try { fs.mkdirSync(DONE, { recursive: true });
    for (const f of fs.readdirSync(IMP)) { if (!/\.(pdf|csv|txt)$/i.test(f)) continue; const fp = path.join(IMP, f); let st; try { st = fs.statSync(fp); } catch (e) { continue; } if (!st.isFile() || Date.now() - st.mtimeMs < 1500) continue;
      let res; try { if (st.size > MAX) throw new Error('larger than 15 MB'); res = parseBuf(fs.readFileSync(fp), f, ''); } catch (e) { res = { trades: [], warnings: ['could not read: ' + e.message], file: f }; }
      let dest = path.join(DONE, f); if (fs.existsSync(dest)) dest = path.join(DONE, f.replace(/(\.\w+)$/, `-${Date.now().toString(36)}$1`)); try { fs.renameSync(fp, dest); } catch (e) { try { fs.copyFileSync(fp, dest); fs.unlinkSync(fp); } catch (_) { continue; } }
      const P = readJSON(PEND, { items: [] }), id = 'w' + Date.now().toString(36) + n; P.items = [...(P.items || []).slice(-19), { id, at: new Date().toISOString(), file: res.file || f, result: res }]; writeJSON(PEND, P);
      const k = res.trades.length; inbox(k ? 'info' : 'warn', k ? `${k} trade${k > 1 ? 's' : ''} read from ${res.file || f}` : `No trades read from ${res.file || f}`, k ? `${k} trade${k > 1 ? 's' : ''} read from ${res.file || f}, open Packages › Add fund from external investment report to confirm.${res.broker ? ' Source: ' + res.broker + (res.docNo ? ', document ' + res.docNo : '') + '.' : ''}${res.duplicate ? ' Note: this looks already imported.' : ''}` : (res.warnings || []).join('; ') || 'The file did not contain recognisable trades.', 'import');
      log(`import: ${f} → ${k} trades${res.duplicate ? ' (duplicate)' : ''}`); n++; } } catch (e) { if (e.code !== 'ENOENT') log('import watch: ' + e.message); } return n; }
  if (watchOn()) { try { fs.mkdirSync(DONE, { recursive: true }); } catch (e) { } }
  const timer = setInterval(() => { try { scan(); } catch (e) { } }, 30000); timer.unref && timer.unref();

  return [
    { method: 'POST', path: '/api/import/parse', handler: async (req, res, u, body) => {
      try { let buf = null, name = '', mime = req.headers['content-type'] || '';
        if (body && typeof body === 'object' && typeof body.data === 'string') { buf = Buffer.from(body.data, 'base64'); name = String(body.name || ''); mime = String(body.mime || ''); }
        else if (body && typeof body === 'object' && typeof body.text === 'string') { buf = Buffer.from(body.text, 'utf8'); name = String(body.name || 'pasted.csv'); mime = 'text/csv'; }
        else { buf = await rawBody(req).catch(e => { throw e; }); name = String(u.searchParams.get('name') || req.headers['x-file-name'] || ''); }
        if (!buf || !buf.length) return send(res, 400, { error: 'empty upload — send JSON {name, mime, data: base64} or a raw PDF/CSV body' }, undefined, req);
        if (buf.length > MAX) return send(res, 413, { error: 'file is larger than 15 MB' }, undefined, req);
        return send(res, 200, parseBuf(buf, name, mime), undefined, req);
      } catch (e) { log('import parse: ' + e.message); return send(res, 400, { error: e.message }, undefined, req); } } },
    { method: 'POST', path: '/api/import/log', handler: async (req, res, u, body) => {
      try { const b = body || {}; if (!Array.isArray(b.sigs) && !b.docNo) return send(res, 400, { error: 'docNo or sigs required' }, undefined, req);
        const L = readJSON(LOGF, { items: [] }); L.items = L.items || [];
        const e = { at: new Date().toISOString(), docNo: b.docNo ? String(b.docNo).slice(0, 40) : null, broker: b.broker ? String(b.broker).slice(0, 60) : null, date: b.date || null, file: b.file ? String(b.file).replace(/\d{11}/g, m => m === String(b.docNo) ? m : '[id]').slice(0, 120) : null, sigs: (b.sigs || []).map(String).slice(0, 500), fundId: b.fundId || null, fundName: b.fundName || null, action: b.action || null, undo: !!b.undo };
        if (b.undo) { L.items = L.items.filter(x => !(x.docNo === e.docNo && JSON.stringify(x.sigs) === JSON.stringify(e.sigs))); } else L.items.push(e);
        L.items = L.items.slice(-1000); writeJSON(LOGF, L); return send(res, 200, { ok: true, n: L.items.length }, undefined, req); } catch (e) { return send(res, 500, { error: e.message }, undefined, req); } } },
    { method: 'GET', path: '/api/import/log', handler: async (req, res) => send(res, 200, readJSON(LOGF, { items: [] }), undefined, req) },
    { method: 'GET', path: '/api/import/pending', handler: async (req, res) => { const P = readJSON(PEND, { items: [] }); for (const it of P.items || []) if (it.result) { it.result.duplicate = duplicate(it.result); for (const t of it.result.trades) t.match = matches(t); } return send(res, 200, { watch: watchOn(), items: P.items || [] }, undefined, req); } },
    { method: 'POST', path: '/api/import/pending/clear', handler: async (req, res, u, body) => { const P = readJSON(PEND, { items: [] }), b = body || {}; P.items = b.all ? [] : (P.items || []).filter(i => i.id !== b.id); writeJSON(PEND, P); return send(res, 200, { ok: true, n: P.items.length }, undefined, req); } },
    { method: 'POST', path: '/api/import/scan', handler: async (req, res) => send(res, 200, { watch: watchOn(), read: scan() }, undefined, req) },
  ];
}
