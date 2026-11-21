// GNC Terminal — the instrument universe: S&P 500 + Nasdaq-100, the extended US list (S&P MidCap 400 + every US-listed
// common stock / ADR with a market cap >= config.usMinMcap, default 5 bn USD), BIST all shares, BIST BYFs, TEFAS funds.
// Static seed lists live in ./universe/*.txt; the app refreshes constituents monthly from public sources and keeps
// the merged result in the store document universe/main. Settings (uniUS, uniUSExt, uniBistAll, ...) switch sub-universes on/off.
import fs from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,application/json,text/plain,*/*' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SECTOR_MAP = { 'Information Technology': 'Technology', 'Communication Services': 'Communications', 'Consumer Discretionary': 'Consumer discretionary', 'Consumer Staples': 'Consumer staples', 'Health Care': 'Health care', 'Financials': 'Finance', 'Industrials': 'Industrials', 'Energy': 'Energy', 'Materials': 'Materials', 'Utilities': 'Utilities', 'Real Estate': 'Real estate' };
// Nasdaq screener sector vocabulary -> the app's vocabulary (the GICS names above also pass through SECTOR_MAP)
const SCREENER_SECTOR = { 'Technology': 'Technology', 'Telecommunications': 'Communications', 'Consumer Discretionary': 'Consumer discretionary', 'Consumer Staples': 'Consumer staples', 'Health Care': 'Health care', 'Finance': 'Finance', 'Industrials': 'Industrials', 'Energy': 'Energy', 'Basic Materials': 'Materials', 'Basic Industries': 'Materials', 'Utilities': 'Utilities', 'Real Estate': 'Real estate', 'Public Utilities': 'Utilities', 'Consumer Services': 'Consumer discretionary', 'Consumer Non-Durables': 'Consumer staples', 'Consumer Durables': 'Consumer discretionary', 'Capital Goods': 'Industrials', 'Transportation': 'Industrials', 'Miscellaneous': 'Unclassified' };
export const DEFAULT_US_MIN_MCAP = 5e9, DEAD_AFTER_DAYS = 7;
const SYM_RE = /^[A-Z]{1,5}(\.[A-Z])?$/;
// Nasdaq screener rows that are not common stock: warrants, units, rights, preferreds, notes, funds / ETFs / trusts.
// Always junk by name: preferreds, notes/debentures, funds / ETFs / ETNs, warrants. "Units" and "rights" only together with a
// W/U/R symbol suffix or a SPAC-style description, so that LP "Common Units" (ET, EPD, MPLX ...) stay in.
const JUNK_NAME = /\b(warrants?|preferred|preference|notes?|debentures?|ETFs?|ETNs?|funds?|depositary (?:shares?|receipts?)[^.]*preferred)\b/i;
const UNIT_RIGHT = /\b(units?|rights?)\b/i, SPAC_UNIT = /\b(units?|rights?)\b[^.]*\b(each|consisting|one share|one[- ]half|one[- ]third|warrant|redeemable)\b/i;
const FUND_TRUST = /\btrust\b/i, TRUST_OK = /\b(propert(?:y|ies)|realty|REIT|bank|bancorp|financial|hospitality|healthcare|industrial|office|residential|storage|corporation|corp|inc|company|holdings|group)\b/i;
export function isJunkRow(symbol, name) {
  const s = String(symbol || '').trim().toUpperCase(), n = String(name || '');
  if (!s || /\^/.test(s)) return true;                                   // preferred series, e.g. BAC^A
  if (/\//.test(s) && !/^[A-Z]{1,5}\/[A-Z]$/.test(s)) return true;         // ABC/WS warrants, ABC/U units, ABC/R rights
  if (JUNK_NAME.test(n)) return true;
  if (FUND_TRUST.test(n) && !TRUST_OK.test(n)) return true;                // closed-end funds, gold/bitcoin trusts, royalty trusts
  if (UNIT_RIGHT.test(n) && ((/[WUR]$/.test(s.replace('/', '')) && s.length >= 4) || SPAC_UNIT.test(n))) return true;
  return false;
}
export function parseMcap(v) { if (typeof v === 'number') return v; const s = String(v ?? '').replace(/[$,\s]/g, ''); if (!s || s === 'NA') return 0; const m = s.match(/^([\d.]+)([KMBT])?$/i); if (!m) return +s || 0; return +m[1] * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(m[2] || '').toUpperCase()] || 1); }

const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;| /g, ' ').trim();
// Wikipedia "List of S&P 400 companies": constituents table rows -> [{ symbol, sector }]
export function parseSP400(html) {
  const i = html.indexOf('id="constituents"'); const start = i > 0 ? html.lastIndexOf('<table', i) : html.search(/<table[^>]*wikitable/i); if (start < 0) return [];
  const end = html.indexOf('</table>', start); const tbl = html.slice(start, end > 0 ? end : undefined), out = new Map();
  let secCol = 2; const head = tbl.match(/<tr[^>]*>([\s\S]*?)<\/tr>/); if (head) { const ths = [...head[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => strip(m[1])); const j = ths.findIndex(h => /GICS\s*Sector/i.test(h)); if (j >= 0) secCol = j; }
  for (const m of tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => strip(x[1])); if (tds.length < 2) continue;
    const sym = tds[0].toUpperCase().replace(/\s+/g, ''); if (!SYM_RE.test(sym) || out.has(sym)) continue;
    const sec = tds[secCol] || ''; out.set(sym, { symbol: sym, sector: SECTOR_MAP[sec] || (Object.values(SECTOR_MAP).includes(sec) ? sec : 'Unclassified') });
  }
  return [...out.values()];
}
// Nasdaq screener rows -> [{ symbol, sector, name, mcap }] with market cap >= minMcap and no warrants / units / rights / preferreds / notes / funds
export function screenerRows(rows, minMcap = DEFAULT_US_MIN_MCAP) {
  const out = [];
  for (const r of rows || []) {
    if (!r || !r.symbol) continue; const mcap = parseMcap(r.marketCap); if (!(mcap >= minMcap)) continue;
    const raw = String(r.symbol).trim().toUpperCase(), name = String(r.name || ''); if (isJunkRow(raw, name)) continue;
    const sym = raw.replace(/^([A-Z]{1,5})\/([A-Z])$/, '$1.$2'); if (!SYM_RE.test(sym)) continue;
    const sec = String(r.sector || '').trim(); out.push({ symbol: sym, sector: SCREENER_SECTOR[sec] || SECTOR_MAP[sec] || (sec && Object.values(SECTOR_MAP).includes(sec) ? sec : 'Unclassified'), name: name.slice(0, 80), mcap, country: r.country || undefined });
  }
  return out;
}

// commodities: symbol, Yahoo futures code, name; VİOP metal underlyings (XAG/USD, XPT/USD …) map onto these symbols
export const CMDTY = [
  { symbol: 'XAUUSD', yahoo: 'GC=F', name: 'Gold (USD per troy ounce)', sub: 'gold', unit: 'oz' },
  { symbol: 'XAGUSD', yahoo: 'SI=F', name: 'Silver (USD per troy ounce)', sub: 'silver', unit: 'oz' },
  { symbol: 'XPTUSD', yahoo: 'PL=F', name: 'Platinum (USD per troy ounce)', sub: 'metal', unit: 'oz' },
  { symbol: 'XPDUSD', yahoo: 'PA=F', name: 'Palladium (USD per troy ounce)', sub: 'metal', unit: 'oz' },
  { symbol: 'XCUUSD', yahoo: 'HG=F', name: 'Copper (USD per pound)', sub: 'metal', unit: 'lb' },
  { symbol: 'BRENT', yahoo: 'BZ=F', name: 'Brent crude oil (USD per barrel)', sub: 'energy', unit: 'bbl' },
  { symbol: 'WTI', yahoo: 'CL=F', name: 'WTI crude oil (USD per barrel)', sub: 'energy', unit: 'bbl' },
  { symbol: 'NATGAS', yahoo: 'NG=F', name: 'Natural gas (USD per MMBtu)', sub: 'energy', unit: 'MMBtu' },
];
// BIST-listed commodity funds (BYF); their own history is thin on Yahoo, so returns and risk come from the gram gold / silver series
export const CMDTY_BYF = [
  { symbol: 'GLDTR', name: 'QNB Portföy Altın BYF', sub: 'gold', proxy: 'GAUTRY' },
  { symbol: 'ZGOLD', name: 'Ziraat Portföy Altın BYF', sub: 'gold', proxy: 'GAUTRY' },
  { symbol: 'ISGLK', name: 'İş Portföy Altın Katılım BYF', sub: 'gold', proxy: 'GAUTRY' },
  { symbol: 'GMSTR', name: 'QNB Portföy Gümüş BYF', sub: 'silver', proxy: 'GAGTRY' },
];
export function readStatic(dir) {
  const out = { us: [], usExt: [], bist: [], byf: [], tefas: [] };
  const lines = f => { try { return fs.readFileSync(path.join(dir, 'universe', f), 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')); } catch (e) { return []; } };
  for (const l of lines('us.txt')) { const [sym, sec] = l.split('|'); if (sym) out.us.push({ symbol: sym, sector: SECTOR_MAP[sec] || sec || 'Unclassified' }); }
  const inUS = new Set(out.us.map(r => r.symbol));
  for (const l of lines('us_ext.txt')) { const [sym, sec] = l.split('|'); if (sym && !inUS.has(sym) && !out.usExt.some(r => r.symbol === sym)) out.usExt.push({ symbol: sym, sector: SECTOR_MAP[sec] || sec || 'Unclassified' }); }
  for (const l of lines('bist.txt')) {
    if (l.startsWith('BYF:')) { const [sym, type, name] = l.slice(4).split('|'); out.byf.push({ symbol: sym, type, name }); }
    else if (l.startsWith('TEFAS:')) { const [code, hy, b51, name] = l.slice(6).split('|'); out.tefas.push({ code, hy: hy === '1', b51: b51 === '1', name }); }
    else { const [sym, sec] = l.split('|'); if (sym) out.bist.push({ symbol: sym, sector: sec || 'Unclassified' }); }
  }
  return out;
}

export function createUniverse({ dir, db, put, log, inbox, tefasList, tefasHistory, config = {} }) {
  const key = 'universe/main', minMcap = +config.usMinMcap > 0 ? +config.usMinMcap : DEFAULT_US_MIN_MCAP;
  function current() { return db.docs[key] || null; }
  function held() { const s = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings')) for (const h of (v.items || [])) s.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) for (const l of (p.lines || [])) s.add(l.symbol); if (k.endsWith('/basket')) for (const b of (v.items || [])) s.add(b.symbol); } return s; }
  function settings() { return db.docs['settings/main'] || {}; }

  // Build the universe doc from the static lists plus whatever the store already knows (BIST 100 membership, names).
  function build(extra) {
    const st = readStatic(dir), cur = current() || {}, S = settings();
    const bist100 = new Set(), bist50 = new Set(), bist30 = new Set();
    for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && x.cls === 'TR_EQ') for (const i of (x.idx || [])) { if (i === 'XU100') bist100.add(x.symbol); if (i === 'XU050') bist50.add(x.symbol); if (i === 'XU030') bist30.add(x.symbol); }
    for (const i of (extra && extra.xu100) || cur.xu100 || []) bist100.add(i); for (const i of (extra && extra.xu050) || cur.xu050 || []) bist50.add(i); for (const i of (extra && extra.xu030) || cur.xu030 || []) bist30.add(i);
    const us = new Map(); for (const r of st.us) us.set(r.symbol, r); for (const r of (extra && extra.us) || cur.us || []) if (!us.has(r.symbol)) us.set(r.symbol, r);
    // extended US list: static seed + the latest refresh result (S&P 400 + screener), never a name that is already in the main US list
    const usExt = new Map(); for (const r of st.usExt) if (!us.has(r.symbol)) usExt.set(r.symbol, r);
    for (const r of (extra && extra.usExt) || cur.usExt || []) if (!us.has(r.symbol) && !usExt.has(r.symbol)) usExt.set(r.symbol, { symbol: r.symbol, sector: r.sector || 'Unclassified' });
    const bist = new Map(); for (const r of st.bist) bist.set(r.symbol, r); for (const r of (extra && extra.bist) || cur.bist || []) if (!bist.has(r.symbol)) bist.set(r.symbol, r);
    for (const s of bist100) if (!bist.has(s)) { const x = db.docs['instruments/' + s]; bist.set(s, { symbol: s, sector: (x && x.sector) || 'Unclassified' }); }
    const tefas = new Map(); for (const r of st.tefas) tefas.set(r.code, r); for (const r of (extra && extra.tefas) || cur.tefas || []) tefas.set(r.code, { ...(tefas.get(r.code) || {}), ...r });
    for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && x.cls === 'TEFAS' && !tefas.has(x.symbol)) tefas.set(x.symbol, { code: x.symbol, name: x.name, hy: !!x.hy, b51: !!x.b51, sub: x.sub });
    // one instrument document per symbol: an extended US name that spells like a BIST share, BYF or TEFAS code (e.g. MAC) is left out
    const taken = new Set([...bist.keys(), ...st.byf.map(b => b.symbol), ...tefas.keys()]); for (const s of [...usExt.keys()]) if (taken.has(s)) usExt.delete(s);
    return { asOf: (extra && extra.asOf) || cur.asOf || new Date().toISOString().slice(0, 10), refreshedAt: cur.refreshedAt, sources: { ...(cur.sources || {}), ...((extra && extra.sources) || {}) },
      us: [...us.values()], usExt: [...usExt.values()], bist: [...bist.values()], byf: st.byf, tefas: [...tefas.values()], xu100: [...bist100], xu050: [...bist50], xu030: [...bist30],
      dead: { ...((extra && extra.dead) || cur.dead || {}) }, usMinMcap: minMcap, note: (extra && extra.note) || cur.note || 'static lists' };
  }
  // Dead-symbol hygiene: an ext/extra instrument that still has no price and a fetch error more than DEAD_AFTER_DAYS after it was
  // added is treated as delisted or mistyped — removed and remembered in U.dead so ensure() does not re-create it. The monthly
  // refresh clears U.dead, so a symbol gets one more try per month. Held symbols are never removed.
  function isDead(x, now = Date.now()) { return !!(x && (x.ext || x.extra) && x.fetchError && !(x.price > 0) && x.addedAt && now - new Date(x.addedAt) > DEAD_AFTER_DAYS * 864e5); }

  // Make sure every universe member has an instrument document, remove what is switched off, keep what is held.
  function ensure() {
    const U = build(), S = settings(), keep = held(), want = new Map(), stamp = new Date().toISOString();
    const on = k => S[k] !== false;
    if (on('uniUS')) for (const r of U.us) want.set(r.symbol, { symbol: r.symbol, cls: 'US_EQ', ccy: 'USD', sector: r.sector, yahoo: r.symbol.replace('.', '-') });
    if (on('uniUSExt')) for (const r of U.usExt) if (!want.has(r.symbol)) want.set(r.symbol, { symbol: r.symbol, cls: 'US_EQ', ccy: 'USD', sector: r.sector, yahoo: r.symbol.replace('.', '-'), ext: true });
    for (const r of U.bist) { const in100 = U.xu100.includes(r.symbol); if (in100 ? on('uniBist100') : on('uniBistAll')) want.set(r.symbol, { symbol: r.symbol, cls: 'TR_EQ', ccy: 'TRY', sector: r.sector, idx: [in100 && 'XU100', U.xu050.includes(r.symbol) && 'XU050', U.xu030.includes(r.symbol) && 'XU030'].filter(Boolean) }); }
    if (on('uniByf')) for (const r of U.byf) want.set(r.symbol, { symbol: r.symbol, cls: 'TR_ETF', ccy: 'TRY', sector: 'BIST equity index', sub: 'index', name: r.name, byfType: r.type });
    for (const raw of String(S.uniExtra || '').split(/[\s,;]+/)) { const sym = raw.trim().toUpperCase(); if (!sym || want.has(sym) || sym.length > 12) continue; const tr = sym.endsWith('.IS'); const base = tr ? sym.slice(0, -3) : sym; if (want.has(base)) continue; want.set(base, tr ? { symbol: base, cls: 'TR_EQ', ccy: 'TRY', sector: null, idx: [], extra: true } : { symbol: base, cls: 'US_EQ', ccy: 'USD', sector: null, yahoo: base.replace('.', '-'), extra: true }); }
    // Deluxe: gram gold in TRY, derived from COMEX gold (XAUUSD, a reference series) and USD/TRY — see data.mjs deriveGold
    if (on('uniGold')) want.set('GAUTRY', { symbol: 'GAUTRY', cls: 'TR_ETF', ccy: 'TRY', sector: 'Gold', sub: 'gold', name: 'Gold – gram (TRY, from XAU and USD/TRY)', derived: 'gold' });
    // VİOP underlyings used by the net-position engine (trend and carry need their spot history)
    for (const [sym, y, name, ccy] of [['XU030', 'XU030.IS', 'BIST 30 index', 'TRY'], ['XBANK', 'XBANK.IS', 'BIST Banks index', 'TRY'], ['EUR/TRY', 'EURTRY=X', 'Euro / Turkish lira', 'TRY']]) if (!db.docs['instruments/' + sym]) db.docs['instruments/' + sym] = { symbol: sym, cls: 'MACRO', ccy, name, yahoo: y, price: null, closes: [], addedAt: stamp };
    if (!db.docs['instruments/XAUUSD']) db.docs['instruments/XAUUSD'] = { symbol: 'XAUUSD', cls: 'MACRO', ccy: 'USD', name: 'Gold (COMEX futures, USD per troy ounce)', yahoo: 'GC=F', price: null, closes: [], addedAt: stamp };
    // Deluxe: commodities (front-month futures on Yahoo, USD), gram silver in TRY, and BIST-listed gold / silver funds (BYF)
    if (on('uniCmdty')) {
      for (const c of CMDTY) { const k = 'instruments/' + c.symbol, x = db.docs[k]; if (x && x.cls === 'MACRO') db.docs[k] = { ...x, ...c, cls: 'CMDTY' }; want.set(c.symbol, { ...c, cls: 'CMDTY', ccy: 'USD', sector: 'Commodities' }); }
      want.set('GAGTRY', { symbol: 'GAGTRY', cls: 'TR_ETF', ccy: 'TRY', sector: 'Commodities', sub: 'silver', name: 'Silver – gram (TRY, from XAG and USD/TRY)', derived: 'silver' });
      for (const f of CMDTY_BYF) want.set(f.symbol, { ...f, cls: 'TR_ETF', ccy: 'TRY', sector: 'Commodities', cmdtyFund: true });
    }
    if (on('uniTefas')) for (const r of U.tefas) want.set(r.code, { symbol: r.code, cls: 'TEFAS', ccy: 'TRY', sector: r.hy ? 'BIST equity index' : r.cmdtyFund ? 'Commodities' : (r.sub === 'mm' ? 'Money market' : 'Mixed / other'), cmdtyFund: !!r.cmdtyFund, name: r.name, hy: !!r.hy, b51: !!r.b51, sub: r.sub || (r.hy ? 'equity' : 'other'), fee: r.fee ?? (r.hy ? 1.5 : 1.0), ...(r.type ? { tefasType: r.type } : {}), ...(r.risk ? { tefasRisk: r.risk } : {}) });
    let added = 0, removed = 0; const dead = [], now = Date.now(), today = stamp.slice(0, 10);
    for (const [k, x] of Object.entries(db.docs)) {
      if (!k.startsWith('instruments/') || x.cls === 'MACRO') continue;
      if (x.cls === 'US_ETF' || ['GLD', 'IAU', 'XAU/USD'].includes(x.symbol)) { if (!keep.has(x.symbol)) { delete db.docs[k]; removed++; } continue; }
      if (!want.has(x.symbol) && !keep.has(x.symbol)) { delete db.docs[k]; removed++; continue; }
      if (want.has(x.symbol) && (want.get(x.symbol).ext || want.get(x.symbol).extra) && !keep.has(x.symbol) && isDead(x, now)) { delete db.docs[k]; removed++; dead.push(x.symbol); U.dead[x.symbol] = today; }
    }
    for (const sym of Object.keys(U.dead)) if (!want.has(sym) || !(want.get(sym).ext || want.get(sym).extra)) delete U.dead[sym]; // back in a main list or dropped: forget it
    for (const [sym, w] of want) {
      if ((w.ext || w.extra) && U.dead[sym] && !keep.has(sym)) continue; // removed as dead; retried after the next monthly refresh
      const k = 'instruments/' + sym.replace('/', '_'), x = db.docs[k];
      if (!x) { db.docs[k] = { ...w, name: w.name || sym, price: null, closes: [], addedAt: stamp, needsProfile: w.cls === 'US_EQ' || w.cls === 'TR_EQ', universe: true }; added++; }
      else { const y = { ...x, ...('idx' in w ? { idx: w.idx } : {}), universe: true }; if (!y.sector || y.sector === 'Unclassified') y.sector = w.sector; if (w.cls === 'TEFAS') { y.hy = w.hy; y.b51 = w.b51; if (!y.name || y.name === sym) y.name = w.name; if (w.tefasType) y.tefasType = w.tefasType; if (w.tefasRisk) y.tefasRisk = w.tefasRisk; if (w.sub && (!y.sub || y.sub === 'other')) y.sub = w.sub; if (w.cmdtyFund) y.cmdtyFund = true; }
        if (w.ext) y.ext = true; else delete y.ext; if (w.extra) y.extra = true; else delete y.extra; if (!y.addedAt) y.addedAt = stamp; db.docs[k] = y; }
    }
    db.rev++; put(key, U);
    if (dead.length) log(`universe: ${dead.length} dead symbol${dead.length === 1 ? '' : 's'} removed (no price and a fetch error for more than ${DEAD_AFTER_DAYS} days): ${dead.slice(0, 20).join(', ')}${dead.length > 20 ? ' …' : ''}`);
    if (added || removed) log(`universe: ${added} instruments added, ${removed} removed; ${[...Object.keys(db.docs)].filter(k => k.startsWith('instruments/')).length} in total`);
    return { added, removed, dead, total: want.size - Object.keys(U.dead).filter(s => want.has(s) && !keep.has(s)).length };
  }

  /* ---- monthly constituent refresh from public sources (best effort; failures keep the current lists) ---- */
  async function fetchText(url, opt = {}) { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000), ...opt }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }
  async function sp500() { const t = await fetchText('https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv'); const out = []; for (const line of t.split(/\r?\n/).slice(1)) { const m = line.match(/^([A-Z.\-]+),(?:"([^"]*)"|([^,]*)),(?:"([^"]*)"|([^,]*))/); if (m) out.push({ symbol: m[1], sector: SECTOR_MAP[m[4] || m[5]] || (m[4] || m[5]) || 'Unclassified' }); } if (out.length < 400) throw new Error('only ' + out.length + ' rows'); return out; }
  async function ndx() { const t = await fetchText('https://en.wikipedia.org/wiki/Nasdaq-100'); const i = t.indexOf('id="Components"'); const sec = i > 0 ? t.slice(i, i + 400000) : t; const out = new Set(); for (const m of sec.matchAll(/<td[^>]*>\s*(?:<a[^>]*>)?([A-Z]{1,5})(?:<\/a>)?\s*<\/td>/g)) out.add(m[1]); if (out.size < 80) throw new Error('only ' + out.size + ' tickers'); return [...out].map(s => ({ symbol: s, sector: 'Unclassified' })); }
  // S&P MidCap 400 from Wikipedia: the constituents table (ticker + GICS sector)
  async function sp400() {
    const t = await fetchText('https://en.wikipedia.org/wiki/List_of_S%26P_400_companies'); const out = parseSP400(t);
    if (out.length < 300) throw new Error('only ' + out.length + ' rows'); return out;
  }
  // Nasdaq screener (NASDAQ + NYSE + AMEX): every common stock / ADR with market cap >= minMcap, minus warrants, units, rights, preferreds, notes, funds
  async function screener() {
    const H = { ...UA, 'Accept': 'application/json, text/plain, */*', 'Origin': 'https://www.nasdaq.com', 'Referer': 'https://www.nasdaq.com/market-activity/stocks/screener' };
    const out = new Map(), fails = []; let seen = 0;
    for (const ex of ['NASDAQ', 'NYSE', 'AMEX']) {
      try {
        const r = await fetch(`https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=6000&exchange=${ex}`, { headers: H, signal: AbortSignal.timeout(25000) }); if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json(), rows = (j && j.data && ((j.data.table && j.data.table.rows) || j.data.rows)) || []; seen += rows.length;
        for (const row of screenerRows(rows, minMcap)) if (!out.has(row.symbol)) out.set(row.symbol, row);
      } catch (e) { fails.push(`${ex}: ${e.message}`); }
      await sleep(300);
    }
    if (fails.length === 3) throw new Error(fails.join('; ')); if (out.size < 60) throw new Error(`only ${out.size} rows >= ${minMcap / 1e9} bn from ${seen} (${fails.join('; ') || 'all exchanges answered'})`);
    const list = [...out.values()]; if (fails.length) list.partial = fails.join('; '); return list;
  }
  async function bistAll() { const t = await fetchText('https://huggingface.co/datasets/kjhq/Turkey-Stock-Symbols-and-Metadata/resolve/main/turkey.csv'); const out = []; for (const line of t.split(/\r?\n/).slice(1)) { const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g); if (!cols || cols.length < 3) continue; const c = cols.map(v => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')); const sym = c[1], sector = c[3] || 'Unclassified'; if (/^[A-Z0-9]{3,6}$/.test(sym) && sym !== 'ALTIN') out.push({ symbol: sym, sector }); } if (out.length < 300) throw new Error('only ' + out.length + ' rows'); return out; }
  async function bistIndex(code) { // İş Yatırım index page lists member codes as links
    const t = await fetchText(`https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/default.aspx?endeks=${code}`); const out = new Set(); for (const m of t.matchAll(/hisse=([A-Z0-9]{3,6})/g)) out.add(m[1]); const n = { XU100: 90, XU050: 45, XU030: 28 }[code] || 10; if (out.size < n) throw new Error(`${code}: only ${out.size}`); return [...out]; }
  // TEFAS: every investment fund that trades on TEFAS (the 2026 JSON API gives the whole list, umbrella type and returns in one request)
  function tefasRow(f) { const t = String(f.type || ''), nm = String(f.name || ''), tn = (t + ' ' + nm).toLocaleUpperCase('tr-TR');
    const cmd = /ALTIN|GÜMÜŞ|KIYMETLİ MADEN|EMTİA|MADEN/.test(tn), hy = /YOĞUN/.test(tn), mm = /PARA PİYASAS/.test(tn), eq = /HİSSE SENEDİ/.test(t.toLocaleUpperCase('tr-TR')) || hy;
    const sub = cmd ? (/GÜMÜŞ/.test(tn) ? 'silver' : /ALTIN/.test(tn) ? 'gold' : 'cmdty') : mm ? 'mm' : eq ? 'equity' : 'other';
    return { code: f.code, name: nm, type: t, hy, b51: eq && !hy && !/YABANCI/.test(tn), sub, ...(cmd ? { cmdtyFund: true } : {}), risk: f.risk || null, r1y: f.r1y ?? null }; }
  async function tefasExpand() {
    const list = await tefasList('YAT'); if (!list || list.length < 100) throw new Error(`TEFAS list: only ${list ? list.length : 0} funds`);
    const max = +config.tefasMax > 0 ? +config.tefasMax : 3000;
    return list.filter(f => f.tefas).slice(0, max).map(tefasRow);
  }
  // the fund directory for the page (every YAT and EMK fund, traded on TEFAS or not): compact rows, refreshed daily
  async function tefasDirectory() {
    const yat = await tefasList('YAT'); let emk = []; try { emk = await tefasList('EMK'); } catch (e) { log('TEFAS EMK list:', e.message); }
    const cols = ['code', 'name', 'type', 'kind', 'tefas', 'risk', 'r1m', 'r3m', 'r6m', 'ytd', 'r1y', 'r3y', 'r5y'];
    put('tefas/dir', { at: new Date().toISOString(), source: 'TEFAS fonGetiriBazliBilgiGetir (YAT + EMK)', cols, rows: [...yat, ...emk].map(f => cols.map(c => c === 'tefas' ? (f.tefas ? 1 : 0) : c === 'kind' ? (f.kind === 'EMK' ? 'E' : 'Y') : f[c] ?? null)) });
    return yat;
  }
  function tefasStale(days = 1) { const d = db.docs['tefas/dir']; return !d || !d.at || (Date.now() - new Date(d.at)) / 864e5 > days || ((current() || {}).tefas || []).length < 100; }
  async function refreshTefas(reason = 'daily') {
    const yat = await tefasDirectory(), max = +config.tefasMax > 0 ? +config.tefasMax : 3000, rows = yat.filter(f => f.tefas).slice(0, max).map(tefasRow);
    if (rows.length < 100) throw new Error(`TEFAS list: only ${rows.length} traded funds`);
    const cur = current() || {}, before = new Set((cur.tefas || []).map(r => r.code));
    const U = build({ tefas: rows, sources: { tefas: `TEFAS fund list (${rows.length} funds traded on TEFAS), ${new Date().toISOString().slice(0, 10)}` } }); U.refreshedAt = cur.refreshedAt; put(key, U); const res = ensure();
    const added = rows.filter(r => !before.has(r.code)).length; log(`TEFAS list (${reason}): ${yat.length} investment funds, ${rows.length} traded on TEFAS, +${added} new`);
    return { ...res, funds: rows.length, added };
  }
  let running = null;
  function stale(days) { const u = current(); return !u || !u.refreshedAt || (Date.now() - new Date(u.refreshedAt)) / 864e5 > days; }
  async function refresh(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const got = {}, fails = [], cur = current() || {};
      for (const [k, fn] of [['us', sp500], ['ndx', ndx], ['sp400', sp400], ['screener', screener], ['bist', bistAll], ['xu100', () => bistIndex('XU100')], ['xu050', () => bistIndex('XU050')], ['xu030', () => bistIndex('XU030')], ['tefas', tefasExpand]]) {
        try { got[k] = await fn(); } catch (e) { fails.push(`${k}: ${e.message}`); }
      }
      const extra = { asOf: new Date().toISOString().slice(0, 10), sources: {}, dead: {} }; // a refresh clears the dead list: every symbol gets one more try per month
      if (got.us) { extra.us = got.us.concat((got.ndx || []).filter(r => !got.us.some(u => u.symbol === r.symbol))); extra.sources.us = 'S&P 500 list (datasets/s-and-p-500-companies) + Nasdaq-100 (Wikipedia), ' + extra.asOf; }
      if (got.sp400 || got.screener) { // usExt = S&P 400 ∪ screener (>= minMcap) minus the S&P 500 / Nasdaq-100 names (fresh if fetched, else the current main list)
        const main = new Set((extra.us || cur.us || readStatic(dir).us).map(r => r.symbol)); for (const r of got.ndx || []) main.add(r.symbol);
        const m = new Map(); for (const r of [...(got.sp400 || []), ...(got.screener || [])]) if (!main.has(r.symbol) && !m.has(r.symbol)) m.set(r.symbol, { symbol: r.symbol, sector: r.sector || 'Unclassified' });
        extra.usExt = [...m.values()];
        extra.sources.usExt = [got.sp400 && `S&P MidCap 400 (Wikipedia, ${got.sp400.length})`, got.screener && `Nasdaq screener NASDAQ/NYSE/AMEX market cap >= ${minMcap / 1e9} bn USD (${got.screener.length}${got.screener.partial ? '; partial: ' + got.screener.partial : ''})`].filter(Boolean).join(' + ') + ', ' + extra.asOf;
      }
      if (got.bist) { extra.bist = got.bist; extra.sources.bist = 'BIST all shares (kjhq/Turkey-Stock-Symbols-and-Metadata), ' + extra.asOf; }
      for (const k of ['xu100', 'xu050', 'xu030']) if (got[k]) { extra[k] = got[k]; extra.sources[k] = 'İş Yatırım index page, ' + extra.asOf; }
      if (got.tefas) { extra.tefas = got.tefas; extra.sources.tefas = 'TEFAS fund list and sizes, ' + extra.asOf; }
      const before = new Set([...(cur.us || []).map(r => r.symbol), ...(cur.usExt || []).map(r => r.symbol), ...(cur.bist || []).map(r => r.symbol), ...(cur.tefas || []).map(r => r.code)]);
      const U = build(extra); U.refreshedAt = new Date().toISOString(); U.note = fails.length ? 'partly refreshed; failed: ' + fails.join('; ') : 'refreshed from public sources';
      put(key, U); const res = ensure();
      const after = new Set([...U.us.map(r => r.symbol), ...U.usExt.map(r => r.symbol), ...U.bist.map(r => r.symbol), ...U.tefas.map(r => r.code)]);
      const added = [...after].filter(s => !before.has(s)), gone = [...before].filter(s => !after.has(s));
      log(`universe refresh (${reason}): ${U.note}; +${added.length} −${gone.length}; US ${U.us.length} + extended ${U.usExt.length}`);
      if (before.size && (added.length || gone.length)) inbox('info', 'Universe updated', `${added.length} instrument${added.length === 1 ? '' : 's'} added${added.length ? ' (' + added.slice(0, 15).join(', ') + (added.length > 15 ? ' …' : '') + ')' : ''}, ${gone.length} removed${gone.length ? ' (' + gone.slice(0, 15).join(', ') + ')' : ''}. US list ${U.us.length} + extended US list ${U.usExt.length} (S&P 400 and >= ${minMcap / 1e9} bn USD). ${fails.length ? 'Some sources failed: ' + fails.join('; ') + '.' : ''}`, 'universe');
      return res;
    })().finally(() => { running = null; });
    return running;
  }
  return { ensure, refresh, stale, current, build, refreshTefas, tefasStale };
}
