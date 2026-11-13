// GNC Terminal — SEC EDGAR XBRL fundamentals for US stocks (point-in-time, 10 years).
// Ticker -> CIK from https://www.sec.gov/files/company_tickers.json, facts from the per-company companyfacts API, filing dates
// and the expected next report from the submissions API. Sequential requests, at most 8 per second, descriptive User-Agent
// (config.edgarUserAgent). Writes facts rows (metrics rev, ni, eq, assets, eps, opinc, cfo, dps, shares, curAssets, curLiab) into
// data/facts.ndjson, a compact x.fund summary on each instrument doc, and EDGAR items into calendar/reports.
import { summarize, deriveQ4, addDays, daysBetween, today, upsertCalendar } from './fundamentals.mjs';
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CONCEPTS = { rev: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax'], ni: ['NetIncomeLoss'], eq: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'], assets: ['Assets'], eps: ['EarningsPerShareDiluted', 'EarningsPerShareBasic'], opinc: ['OperatingIncomeLoss'], cfo: ['NetCashProvidedByUsedInOperatingActivities'], dps: ['CommonStockDividendsPerShareDeclared'], curAssets: ['AssetsCurrent'], curLiab: ['LiabilitiesCurrent'] };
const DEI = { shares: ['EntityCommonStockSharesOutstanding'] };
const FLOWS = new Set(['rev', 'ni', 'eps', 'opinc', 'cfo', 'dps']);
const pad = c => String(c).replace(/\D/g, '').padStart(10, '0');

// extract facts rows from a companyfacts document; restatements are kept only when the value changed by > 0.5%
export function extractFacts(sym, doc, cutoff) {
  const rows = [], fyeMonths = {};
  const pick = (ns, names) => { // entries per period (end|start) from the highest-priority concept that reports that period
    const got = new Map();
    names.forEach((n, pri) => { const c = doc.facts && doc.facts[ns] && doc.facts[ns][n]; if (!c || !c.units) return; const unit = Object.keys(c.units)[0];
      for (const e of c.units[unit] || []) { if (!e || !/^10-[KQ]/.test(e.form || '') || !e.end || !e.filed || typeof e.val !== 'number' || e.end < cutoff) continue; const k = e.end + '|' + (e.start || ''), cur = got.get(k); if (!cur) got.set(k, { pri, list: [{ ...e, unit }] }); else if (cur.pri === pri) cur.list.push({ ...e, unit }); } });
    return [...got.values()].flatMap(g => g.list); };
  // fiscal-year-end month from annual facts (for quarter labels); default December
  const yearEnds = {}; for (const names of Object.values(CONCEPTS)) for (const n of names) { const c = doc.facts && doc.facts['us-gaap'] && doc.facts['us-gaap'][n]; if (!c || !c.units) continue; for (const e of Object.values(c.units)[0] || []) if (e && e.start && e.end && /^10-K/.test(e.form || '')) { const d = daysBetween(e.start, e.end); if (d >= 350 && d <= 380) yearEnds[+e.end.slice(5, 7)] = (yearEnds[+e.end.slice(5, 7)] || 0) + 1; } }
  const fye = +Object.entries(yearEnds).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || 12;
  const qLabel = end => { const m = +end.slice(5, 7), q = Math.round(((m - fye + 12) % 12) / 3); return 'Q' + (q === 0 ? 4 : q); };
  const groups = new Map(); // metric|periodEnd|fp -> entries
  const add = (metric, e) => { const flow = FLOWS.has(metric); let fp; if (flow) { if (!e.start) return; const d = daysBetween(e.start, e.end); if (d >= 80 && d <= 100) fp = qLabel(e.end); else if (d >= 350 && d <= 380) fp = 'FY'; else return; } else if (e.start) return;
    const k = `${metric}|${e.end}|${fp || ''}`; let a = groups.get(k); if (!a) { a = []; groups.set(k, a); } a.push({ metric, e, fp }); };
  for (const [metric, names] of Object.entries(CONCEPTS)) for (const v of pick('us-gaap', names)) add(metric, v);
  for (const [metric, names] of Object.entries(DEI)) for (const v of pick('dei', names)) add(metric, v);
  for (const a of groups.values()) {
    a.sort((x, y) => x.e.filed < y.e.filed ? -1 : 1); let last = null;
    for (const { metric, e, fp } of a) { if (last !== null && Math.abs(e.val - last) <= Math.abs(last) * 0.005) continue; last = e.val;
      const r = { sym, metric, periodEnd: e.end, filedAt: e.filed, value: metric === 'eps' || metric === 'dps' ? +e.val.toFixed(4) : Math.round(e.val), unit: e.unit, form: e.form, src: 'EDGAR' }; if (fp) r.fp = fp; if (fp === 'FY') r.start = e.start; rows.push(r); }
  }
  const q4 = deriveQ4(rows, 'EDGAR (derived Q4)'); for (const r of rows) delete r.start;
  return rows.concat(q4);
}
// expected next report date from the recent filings list: last 10-Q/10-K + 91 days (or + 365 when the company files no 10-Qs)
export function nextReport(filings, asOf = today()) {
  const f = filings.filter(x => /^10-[KQ]/.test(x.form || '') && x.date).sort((a, b) => a.date < b.date ? -1 : 1); if (!f.length) return null;
  const last = f[f.length - 1], hasQ = f.some(x => /^10-Q/.test(x.form) && daysBetween(x.date, asOf) < 400);
  let next = addDays(last.date, hasQ ? 91 : 365); if (next < asOf) next = addDays(asOf, 14);
  return { date: next, last: last.date, lastForm: last.form.slice(0, 4) };
}

export function createEdgar({ db, put, log, inbox, coll, config, store2, mark }) {
  const UA = { 'User-Agent': config.edgarUserAgent || 'GNC Terminal personal research contact@example.com', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' };
  let lastReq = 0; async function get(url) { const wait = 130 - (Date.now() - lastReq); if (wait > 0) await sleep(wait); lastReq = Date.now(); const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
  let tickers = null;
  async function tickerMap(force) {
    if (tickers && !force) return tickers;
    const cached = store2.readSide('edgar_tickers', null); if (!force && cached && cached.map && Date.now() - new Date(cached.at) < 7 * 864e5) { tickers = new Map(Object.entries(cached.map)); return tickers; }
    const j = await get('https://www.sec.gov/files/company_tickers.json'); const m = {}; for (const v of Object.values(j || {})) if (v && v.ticker && v.cik_str) m[String(v.ticker).toUpperCase()] = pad(v.cik_str);
    if (Object.keys(m).length < 300) throw new Error('company_tickers: only ' + Object.keys(m).length + ' rows');
    store2.writeSide('edgar_tickers', { at: new Date().toISOString(), map: m }); store2.saveRaw('edgar-tickers', { count: Object.keys(m).length });
    tickers = new Map(Object.entries(m)); return tickers;
  }
  const cikOf = (sym, map) => map.get(sym.toUpperCase()) || map.get(sym.toUpperCase().replace('.', '-')) || map.get(sym.toUpperCase().replace('-', '.')) || map.get(sym.toUpperCase().replace(/[.-]/g, '')) || null;
  // companies to process in one slice: never fetched first, then the oldest attempt
  function plan(n) { const list = coll('instruments').filter(([, x]) => x.cls === 'US_EQ'); list.sort((a, b) => (a[1].fundAt || '') < (b[1].fundAt || '') ? -1 : (a[1].fundAt || '') > (b[1].fundAt || '') ? 1 : a[1].symbol < b[1].symbol ? -1 : 1); return list.slice(0, n || config.edgarPerRun || 120); }

  async function processCompany(k, x, cik) {
    const sym = x.symbol, now = new Date().toISOString(), y = { ...(db.docs[k] || x) }; y.cik = cik; y.fundAt = now; delete y.fundErr;
    const sub = await get(`https://data.sec.gov/submissions/CIK${cik}.json`); const rc = (sub.filings && sub.filings.recent) || {};
    const filings = (rc.form || []).map((f, i) => ({ form: f, date: rc.filingDate[i], report: rc.reportDate && rc.reportDate[i] })).filter(f => /^10-[KQ]/.test(f.form));
    const nr = nextReport(filings), lastFiled = nr ? nr.last : null;
    const fresh = !(y.fund && y.fund.src === 'EDGAR' && y.fund.lastFiled === lastFiled && store2.factsOf(sym).length);
    let added = 0;
    if (fresh) {
      const cf = await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
      const rows = extractFacts(sym, cf, addDays(today(), -Math.round(365.25 * 10.5))); added = store2.appendFacts(rows);
      const f = summarize(store2.factsOf(sym), { src: 'EDGAR', shares: y.mcap > 0 && y.price > 0 ? y.mcap / y.price : null });
      if (f) { f.lastFiled = lastFiled; y.fund = f; } else { y.fundErr = 'no usable us-gaap facts'; delete y.fund; }
    } else if (y.fund) y.fund.updatedAt = now;
    db.docs[k] = y;
    return { cal: nr ? { symbol: sym, date: nr.date, kind: 'report', est: true, src: 'EDGAR', last: nr.last } : null, added, fresh };
  }

  let running = null;
  async function runSlice({ reason = 'schedule', n, list, onItem } = {}) {
    if (running) return running;
    running = (async () => {
      const t0 = Date.now(), todo = list || plan(n); let ok = 0, fails = 0, rows = 0, firstErr = null, noCik = 0, skipped = 0; const cal = [];
      let map = null; try { map = await tickerMap(); } catch (e) { firstErr = 'company_tickers.json: ' + errMsg(e); log('edgar: ticker map failed:', errMsg(e)); }
      if (map) for (const [k, x] of todo) {
        const cik = (db.docs[k] && db.docs[k].cik) || cikOf(x.symbol, map);
        if (!cik) { noCik++; db.docs[k] = { ...(db.docs[k] || x), fundAt: new Date().toISOString(), fundErr: 'no CIK for ticker' }; if (onItem) onItem(x.symbol); continue; }
        try { const r = await processCompany(k, x, cik); ok++; rows += r.added; if (!r.fresh) skipped++; if (r.cal) cal.push(r.cal); }
        catch (e) { fails++; const why = errMsg(e); if (!firstErr) firstErr = `${x.symbol}: ${why}`; db.docs[k] = { ...(db.docs[k] || x), fundAt: new Date().toISOString(), fundErr: why.slice(0, 80) }; if (/HTTP 429|HTTP 403/.test(why)) { log('edgar: rate limited, pausing 30 s'); await sleep(30000); } }
        if (onItem) onItem(x.symbol);
      }
      if (cal.length) upsertCalendar(db, put, cal, 'EDGAR');
      db.rev++;
      const note = `${ok} companies (${skipped} unchanged), ${rows} new fact rows, ${fails} failed, ${noCik} without CIK in ${Math.round((Date.now() - t0) / 1000)}s${firstErr ? '; first error ' + firstErr : ''}`;
      if (todo.length) mark('SEC EDGAR', ok > 0 || (fails === 0 && noCik < todo.length), firstErr, { rows, partial: ok > 0 && fails > 0 });
      log(`edgar (${reason}): ${note}`); return { ok, fails, rows, noCik, note };
    })().finally(() => { running = null; });
    return running;
  }
  function pending() { return coll('instruments').filter(([, x]) => x.cls === 'US_EQ' && !x.fundAt).length; }
  return { runSlice, plan, pending, tickerMap, extractFacts, nextReport };
}
