// GNC Terminal — İş Yatırım financial statements (MaliTablo) for BIST stocks: the last 12 quarters in 3 calls, financial group
// XI_29 (industrials, IFRS/TFRS) first and UFRS (banks, insurers) when the first returns nothing. Statements are cumulative
// year-to-date and are differenced into single quarters within the fiscal year. The API does not say when a statement was filed:
// filedAt is estimated as period end + 45 days (Q1–Q3) or + 70 days (Q4), the KAP deadlines, and rows carry est: true.
// Unit assumption: values arrive in full TRY (not thousands); when total assets are implausibly small against the market
// cap (assets < mcap / 2000) the statement is treated as thousands and multiplied by 1000 (fund.scaled = true).
import { summarize, addDays, today, upsertCalendar } from './fundamentals.mjs';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'application/json,text/plain,*/*', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8', 'Referer': 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/sirket-karti.aspx' };
const BASE = 'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/';
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const LAG = { 3: 45, 6: 45, 9: 45, 12: 70 };
const qEnd = (y, m) => `${y}-${String(m).padStart(2, '0')}-${m === 6 || m === 9 ? '30' : m === 3 ? '31' : '31'}`;
export const filedEstimate = (y, m) => addDays(qEnd(y, m), LAG[m]);
// the last n quarter (year, month) pairs whose statements should already be public
export function periods(n = 12, asOf = today()) {
  const out = []; let y = +asOf.slice(0, 4), m = 12;
  while (out.length < n) { if (filedEstimate(y, m) <= asOf) out.push([y, m]); m -= 3; if (m === 0) { m = 12; y--; } }
  return out;
}
// label matching, in priority order; the first item that matches wins (TR label first, then EN)
const MAP = {
  rev: [/^(Hasılat|Satış Gelirleri|Net Satışlar)$/i, /^(Revenue|Sales Revenue|Net Sales|Sales)$/i, /^Hasılat/i, /^Toplam Faaliyet Gelir/i, /^Total Operating Income/i, /^Net Faiz Gelir/i, /^Net Interest Income/i],
  ni: [/Net Profit.*Parent|Attributable to (Equity Holders of|Owners of) (the )?Parent/i, /^Ana Ortaklık Payları$/i, /^(Dönem Net Karı|Dönem Net Kar[ıi]?\s*[\/(]\s*Zarar[ıi]\)?|Net Dönem Karı|Net Dönem Kar[ıi]?\s*[\/(]\s*Zarar[ıi]\)?)$/i, /^(Net Profit|Net Profit for the Period|Profit for the Period|Net Income|Net Profit\/Loss)$/i, /^Dönem (Net )?Kar/i, /^Net (Profit|Income)/i],
  eq: [/^Ana Ortaklığa Ait Özkaynaklar$/i, /Equity Attributable to (Equity Holders of|Owners of) (the )?Parent/i, /^(Toplam )?Özkaynaklar$/i, /^(Total )?(Shareholders'? )?Equity$/i],
  assets: [/^Toplam Varlıklar$/i, /^Toplam Aktifler$/i, /^Total Assets$/i, /^Aktif Toplamı$/i],
  opinc: [/^Esas Faaliyet Kar/i, /^Operating Profit/i, /^Operating Income/i],
  cfo: [/^İşletme Faaliyetlerinden (Kaynaklanan )?(Net )?Nakit Ak/i, /^Faaliyetlerden Elde Edilen Nakit Ak/i, /Cash Flows? From Operating Activities/i, /Net Cash (Provided|Generated|Flows?) (by|from) Operating/i, /Operating Activities/i]
};
const FLOWS = new Set(['rev', 'ni', 'opinc', 'cfo']);
const num = v => { if (v === null || v === undefined || v === '') return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : null; };
// pick the matching item per metric from the statement items
export function mapItems(items) {
  const out = {};
  for (const [metric, res] of Object.entries(MAP)) { let best = null, bestPri = 99; for (const it of items) { const tr = String(it.itemDescTr || '').trim(), en = String(it.itemDescEng || '').trim(); for (let i = 0; i < res.length && i < bestPri; i++) if (res[i].test(tr) || res[i].test(en)) { best = it; bestPri = i; break; } } if (best) out[metric] = best; }
  return out;
}
export async function maliTablo(code, group, pairs) {
  const q = pairs.map(([y, m], i) => `year${i + 1}=${y}&period${i + 1}=${m}`).join('&');
  const r = await fetch(`${BASE}MaliTablo?companyCode=${encodeURIComponent(code)}&exchange=TRY&financialGroup=${group}&${q}`, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); return Array.isArray(j && j.value) ? j.value : [];
}
// daily closes from the HisseTekil endpoint (used by validate.mjs for reconciliation) -> [[date, close]]
export async function hisseTekil(code, startDate, endDate) {
  const dmy = d => `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}`;
  const r = await fetch(`${BASE}HisseTekil?hisse=${encodeURIComponent(code)}&startdate=${dmy(startDate)}&enddate=${dmy(endDate)}`, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); const out = [];
  for (const v of (j && j.value) || []) { const t = String(v.HGDG_TARIH || ''); let d = null, m; if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) d = m[0]; else if ((m = t.match(/^(\d{2})[-.\/](\d{2})[-.\/](\d{4})/))) d = `${m[3]}-${m[2]}-${m[1]}`; const c = num(v.HGDG_KAPANIS); if (d && c > 0) out.push([d, c]); }
  return out.sort((a, b) => a[0] < b[0] ? -1 : 1);
}
// cumulative statements (one value per (year, month)) -> facts rows with single quarters, FY rows and instants
export function toRows(sym, group, byPeriod, scale = 1) {
  const rows = [], keys = Object.keys(byPeriod).sort(); // 'YYYY-MM'
  for (const key of keys) { const [y, m] = key.split('-').map(Number), v = byPeriod[key], end = qEnd(y, m), filedAt = filedEstimate(y, m), fp = 'Q' + m / 3, base = { sym, periodEnd: end, filedAt, unit: 'TRY', form: 'KAP ' + group, src: 'IsYatirim', est: true };
    for (const metric of Object.keys(v)) { const val = v[metric]; if (val === null || val === undefined) continue;
      if (FLOWS.has(metric)) { let q = val; if (m > 3) { const prev = byPeriod[`${y}-${String(m - 3).padStart(2, '0')}`]; if (!prev || prev[metric] === null || prev[metric] === undefined) continue; q = val - prev[metric]; }
        rows.push({ ...base, metric, value: Math.round(q * scale), fp }); if (m === 12) rows.push({ ...base, metric, value: Math.round(val * scale), fp: 'FY' }); }
      else rows.push({ ...base, metric, value: Math.round(val * scale) }); } }
  return rows;
}

export function createIsy({ db, put, log, inbox, coll, config, store2, mark }) {
  function plan(n) { const list = coll('instruments').filter(([, x]) => x.cls === 'TR_EQ'); list.sort((a, b) => (a[1].fundAt || '') < (b[1].fundAt || '') ? -1 : (a[1].fundAt || '') > (b[1].fundAt || '') ? 1 : a[1].symbol < b[1].symbol ? -1 : 1); return list.slice(0, n || config.isyPerRun || 150); }
  async function fetchCompany(code, pairs) {
    for (const group of ['XI_29', 'UFRS']) {
      const byPeriod = {}; let any = false;
      for (let i = 0; i < pairs.length; i += 4) { const chunk = pairs.slice(i, i + 4), items = await maliTablo(code, group, chunk); if (!items.length) break; const picked = mapItems(items); if (!Object.keys(picked).length) break;
        chunk.forEach(([y, m], j) => { const key = `${y}-${String(m).padStart(2, '0')}`, o = {}; let has = false; for (const [metric, it] of Object.entries(picked)) { const v = num(it['value' + (j + 1)]); o[metric] = v; if (v !== null) has = true; } if (has) { byPeriod[key] = o; any = true; } }); await sleep(250); }
      if (any) return { group, byPeriod };
      await sleep(250);
    }
    return null;
  }
  async function processCompany(k, x, pairs) {
    const sym = x.symbol, y = { ...(db.docs[k] || x) }; y.fundAt = new Date().toISOString(); delete y.fundErr;
    const got = await fetchCompany(sym, pairs); if (!got) { y.fundErr = 'no statement rows'; db.docs[k] = y; return { added: 0, empty: true }; }
    const latest = Object.keys(got.byPeriod).sort().pop(), assets = got.byPeriod[latest].assets, scale = assets > 0 && y.mcap > 0 && assets < y.mcap / 2000 ? 1000 : 1;
    const rows = toRows(sym, got.group, got.byPeriod, scale), added = store2.appendFacts(rows);
    const f = summarize(store2.factsOf(sym), { src: 'IsYatirim', shares: y.mcap > 0 && y.price > 0 ? y.mcap / y.price : null });
    if (f) { f.group = got.group; if (scale !== 1) f.scaled = true; y.fund = f; } else { y.fundErr = 'statement could not be mapped'; delete y.fund; }
    db.docs[k] = y;
    const [ly, lm] = latest.split('-').map(Number); let ny = ly, nm = lm + 3; if (nm > 12) { nm = 3; ny++; } let date = filedEstimate(ny, nm); if (date < today()) date = addDays(today(), 7);
    return { added, cal: { symbol: sym, date, kind: 'report', est: true, src: 'KAP deadline', period: qEnd(ny, nm) } };
  }
  let running = null;
  async function runSlice({ reason = 'schedule', n, list, onItem } = {}) {
    if (running) return running;
    running = (async () => {
      const t0 = Date.now(), todo = list || plan(n), pairs = periods(12); let ok = 0, fails = 0, empty = 0, rows = 0, firstErr = null; const cal = [];
      for (const [k, x] of todo) {
        try { const r = await processCompany(k, x, pairs); if (r.empty) empty++; else { ok++; rows += r.added; cal.push(r.cal); } }
        catch (e) { fails++; const why = errMsg(e); if (!firstErr) firstErr = `${x.symbol}: ${why}`; db.docs[k] = { ...(db.docs[k] || x), fundAt: new Date().toISOString(), fundErr: why.slice(0, 80) }; if (/HTTP 429|HTTP 403/.test(why)) { log('isyatirim: rate limited, pausing 30 s'); await sleep(30000); } }
        if (onItem) onItem(x.symbol); await sleep(150);
      }
      if (cal.length) upsertCalendar(db, put, cal, 'KAP deadline');
      db.rev++;
      const note = `${ok} companies, ${rows} new fact rows, ${empty} without statements, ${fails} failed in ${Math.round((Date.now() - t0) / 1000)}s${firstErr ? '; first error ' + firstErr : ''}`;
      if (todo.length) mark('Is Yatirim financials', ok > 0 || fails === 0, firstErr, { rows, partial: ok > 0 && fails > 0 });
      log(`isyatirim (${reason}): ${note}`); return { ok, fails, empty, rows, note };
    })().finally(() => { running = null; });
    return running;
  }
  function pending() { return coll('instruments').filter(([, x]) => x.cls === 'TR_EQ' && !x.fundAt).length; }
  return { runSlice, plan, pending };
}
