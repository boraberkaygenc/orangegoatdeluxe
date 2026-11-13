// orangegoat v2.0 Deluxe — VİOP (Borsa İstanbul futures): open contracts, end-of-day settlement prices, open interest,
// contract sizes and daily price limits from Borsa İstanbul's public data files (no login):
//   contract master  https://www.borsaistanbul.com/data/vadeli/viopms_YYYYMMDD.csv   (published ~08:00 for the same day)
//   daily bulletin   https://www.borsaistanbul.com/data/vadeli/viop_YYYYMMDD.csv     (published ~20:30 for that day)
// Margins are not public as files (Takasbank blocks automated access): the page estimates them and lets the user enter
// the broker's figure. Store documents: viop/contracts (current futures), viop/settles (last 60 settlement prices per code).
const BASE = 'https://www.borsaistanbul.com/data/vadeli/';
const UA = { 'User-Agent': 'Mozilla/5.0 (personal research app; Node.js)', Accept: 'text/csv,*/*' };
const SEG = { SSF: 'stock', INF: 'index', CRF: 'fx', CRFU: 'fx', PMF: 'metal', PMFU: 'metal', MTF: 'metal', ENF: 'energy', TRF: 'rate', FIF: 'rate', PCF: 'other', BOP: 'other' };

export function underlyingSymbol(raw) {
  const u = String(raw || '').trim();
  if (/\.E$/.test(u)) return u.slice(0, -2);                       // THYAO.E → THYAO
  const m = u.match(/^D_([A-Z0-9]+)$/); if (!m) return u;
  const s = m[1];
  if (/^XU0?30D?$/.test(s)) return 'XU030'; if (/^XU100D?$/.test(s)) return 'XU100'; if (/^XLBNKD?$/.test(s)) return 'XBANK';
  if (s === 'XAUTRY') return 'GAUTRY'; if (s === 'XAUUSD') return 'XAUUSD';
  if (/^[A-Z]{6}$/.test(s)) return s.slice(0, 3) + '/' + s.slice(3);   // USDTRY → USD/TRY
  return s;
}
const ymd = d => d.replace(/-/g, '');
const prevDays = (date, n) => { const out = []; const t = new Date(date + 'T12:00:00Z'); for (let i = 0; out.length < n && i < n * 2 + 4; i++) { const d = new Date(t - i * 864e5); const w = d.getUTCDay(); if (w !== 0 && w !== 6) out.push(d.toISOString().slice(0, 10)); } return out; };
function rows(text, mustStart) {
  const t = String(text || '').replace(/^﻿/, ''); if (!t.startsWith(mustStart)) return null;      // an HTML error page also answers 200
  const lines = t.split(/\r?\n/).filter(Boolean); const head = lines[0].split(';').map(s => s.trim());
  return { head, rows: lines.slice(2).map(l => l.split(';')) };
}
const col = (head, name) => head.indexOf(name);
const num = v => { const x = parseFloat(String(v ?? '').trim()); return isFinite(x) ? x : null; };

export function parseMaster(text) {
  const r = rows(text, 'SOZLESME KODU;'); if (!r) return null; const h = r.head, c = n => col(h, n);
  const out = new Map();
  for (const a of r.rows) {
    if ((a[c('SOZLESME TURU')] || '').trim() !== 'Future') continue; const code = (a[c('SOZLESME KODU')] || '').trim(); if (!code.startsWith('F_')) continue;
    const seg = (a[c('PAZAR SEGMENTI')] || '').trim();
    out.set(code, { code, seg, kind: SEG[seg] || 'other', underRaw: (a[c('DAYANAK VARLIK')] || '').trim(), under: underlyingSymbol(a[c('DAYANAK VARLIK')]), expiry: (a[c('VADE TARIHI')] || '').trim(), lastTrade: (a[c('SON ISLEM TARIHI')] || '').trim(),
      mult: num(a[c('SOZLESME BUYUKLUGU')]) || 1, status: (a[c('DURUM')] || '').trim(), settleType: (a[c('UZLASMA TIPI')] || '').trim(), ccy: (a[c('PARA BIRIMI')] || 'TRY').trim() || 'TRY',
      base: num(a[c('SON UZLASMA FIYATI')]), lower: num(a[c('ALT LIMIT')]), upper: num(a[c('UST LIMIT')]), tick: (a[c('FIYAT ADIMI')] || '').trim() });
  }
  return out;
}
export function parseBulletin(text) {
  const r = rows(text, 'TARIH;'); if (!r) return null; const h = r.head, c = n => col(h, n);
  const out = new Map(); let date = null;
  for (const a of r.rows) {
    const code = (a[c('SOZLESME KODU')] || '').trim(); if (!code.startsWith('F_')) continue; date = date || (a[c('TARIH')] || '').trim();
    out.set(code, { date: (a[c('TARIH')] || '').trim(), name: (a[c('SOZLESME ADI')] || '').trim(), seg: (a[c('PAZAR SEGMENTI')] || '').trim(), underRaw: (a[c('DAYANAK VARLIK')] || '').trim(), expiry: (a[c('VADE TARIHI')] || '').trim(),
      settle: num(a[c('UZLASMA FIYATI')]), prevSettle: num(a[c('ONCEKI UZLASMA FIYATI')]), chg: num(a[c('UZLASMA FIYATI DEGISIMI (%)')]), close: num(a[c('KAPANIS FIYATI')]),
      volTL: num(a[c('ISLEM HACMI')]), qty: num(a[c('ISLEM MIKTARI')]), oi: num(a[c('ACIK POZISYON')]), oiChg: num(a[c('ACIK POZISYON DEGISIMI')]) });
  }
  return { date, map: out };
}

export function routes(ctx) {
  const { db, put, log, ist } = ctx; let busy = null, lastSlot = null;
  const mark = (ok, msg) => { try { if (ctx.health && ctx.health.mark) ctx.health.mark('VİOP (Borsa İstanbul)', ok, msg || null); } catch (e) { } };
  async function get(name) { const r = await fetch(BASE + name, { headers: UA, signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r.text(); }
  async function firstOk(prefix, dates, parse) { let last = null; for (const d of dates) { try { const p = parse(await get(`${prefix}_${ymd(d)}.csv`)); if (p && (p.size || (p.map && p.map.size))) return { date: d, p }; last = `${prefix}_${ymd(d)}: not a data file`; } catch (e) { last = e.message; } } throw new Error(last || 'no file'); }
  async function refresh(reason) {
    if (busy) return busy;
    busy = (async () => {
      const today = ist().date, t0 = Date.now();
      const ms = await firstOk('viopms', prevDays(today, 6), parseMaster);
      const bl = await firstOk('viop', prevDays(today, 6), parseBulletin);
      const settles = { ...(db.docs['viop/settles'] || {}) }; delete settles.asOf;
      // first run: fill up to 10 earlier bulletins so held contracts have a short settlement history
      if (!db.docs['viop/settles'] || !db.docs['viop/settles'].backfilled) {
        for (const d of prevDays(bl.date, 11).slice(1)) { try { const p = parseBulletin(await get(`viop_${ymd(d)}.csv`)); if (p) for (const [code, b] of p.map) if (b.settle > 0) (settles[code] = settles[code] || []).push([d, b.settle]); } catch (e) { } await new Promise(r => setTimeout(r, 300)); }
      }
      for (const [code, b] of bl.p.map) if (b.settle > 0) (settles[code] = settles[code] || []).push([bl.date, b.settle]);
      for (const k of Object.keys(settles)) { if (k === 'backfilled') continue; const m = new Map(settles[k].map(r => [r[0], r[1]])); settles[k] = [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-60); }
      const items = [];
      for (const [code, m] of ms.p) { if (m.status && m.status !== 'A') continue; if (m.expiry && m.expiry < today) continue; const b = bl.p.map.get(code) || {};
        items.push({ code, name: b.name || code, seg: m.seg, kind: m.kind, under: m.under, underRaw: m.underRaw, expiry: m.expiry, lastTrade: m.lastTrade, mult: m.mult, ccy: m.ccy, settleType: m.settleType,
          settle: b.settle ?? m.base ?? null, base: m.base, prevSettle: b.prevSettle ?? null, chg: b.chg ?? null, close: b.close ?? null, volTL: b.volTL ?? null, qty: b.qty ?? null, oi: b.oi ?? null, oiChg: b.oiChg ?? null, lower: m.lower, upper: m.upper, tick: m.tick, settleDate: b.settle ? bl.date : null }); }
      items.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'stock' ? -1 : b.kind === 'stock' ? 1 : a.kind < b.kind ? -1 : 1) || (a.under < b.under ? -1 : a.under > b.under ? 1 : a.expiry < b.expiry ? -1 : 1));
      put('viop/settles', { ...settles, backfilled: true, asOf: bl.date });
      put('viop/contracts', { asOf: bl.date, masterDate: ms.date, fetchedAt: new Date().toISOString(), source: 'Borsa İstanbul VİOP data files (viopms, daily bulletin)', items });
      const n = items.length, nStock = items.filter(i => i.kind === 'stock').length;
      log(`viop (${reason}): ${n} futures (${nStock} single-stock), bulletin ${bl.date}, contract list ${ms.date}, ${Math.round((Date.now() - t0) / 1000)}s`); mark(true);
      return { ok: true, n, bulletin: bl.date, master: ms.date };
    })().catch(e => { log(`viop (${reason}) failed: ${e.message}`); mark(false, e.message); return { ok: false, error: e.message }; }).finally(() => { busy = null; });
    return busy;
  }
  // schedule: at start-up when stale, 08:20 (new contract list) and 21:00 (that day's bulletin), Istanbul time, weekdays
  if (!globalThis.__gncViopTimer) {
    globalThis.__gncViopTimer = true;
    setTimeout(() => { const c = db.docs['viop/contracts'], t = ist(); if (!c || !c.fetchedAt || (Date.now() - new Date(c.fetchedAt)) / 36e5 > 12 || c.masterDate !== t.date) refresh('start-up'); }, 25000).unref?.();
    setInterval(() => { const t = ist(); if (t.wd === 'Sat' || t.wd === 'Sun') return; for (const hm of ['08:20', '21:00']) if (t.hm === hm && lastSlot !== t.date + hm) { lastSlot = t.date + hm; refresh('scheduled ' + hm); } }, 30000).unref?.();
  }
  return [
    { method: 'POST', path: '/api/viop/refresh', handler: async (req, res) => { const r = await refresh('button'); ctx.send(res, r.ok ? 200 : 502, r); } },
    { method: 'GET', path: '/api/viop/status', handler: async (req, res) => { const c = db.docs['viop/contracts'] || {}; ctx.send(res, 200, { asOf: c.asOf || null, masterDate: c.masterDate || null, fetchedAt: c.fetchedAt || null, count: (c.items || []).length, busy: !!busy }); } },
  ];
}
