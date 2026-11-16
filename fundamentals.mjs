// GNC Terminal — shared fundamentals helpers: the compact x.fund summary (TTM sums from quarterly facts rows) used by
// edgar.mjs (US) and isyatirim.mjs (BIST), plus small date helpers.
export const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
export const today = () => new Date().toISOString().slice(0, 10);
const r2 = v => (typeof v === 'number' && isFinite(v)) ? +v.toFixed(2) : null;
const QF = new Set(['Q1', 'Q2', 'Q3', 'Q4']);
// flow metrics (summed over a period) across both sources; everything else is a point-in-time balance
export const FLOW_METRICS = new Set(['rev', 'ni', 'eps', 'opinc', 'cfo', 'dps', 'capex', 'sbc', 'wc', 'buyback', 'divPaid', 'da', 'interest', 'tax', 'pretax', 'gp', 'fcf', 'capInc', 'nii', 'fee', 'salesDom', 'salesExp', 'provisions']);

// latest value per periodEnd for a metric (the newest filing wins), quarterly only when `quarterly`
function byPeriod(rows, metric, quarterly) {
  const m = new Map(); for (const r of rows) { if (r.metric !== metric) continue; if (quarterly ? !QF.has(r.fp) : (r.fp && QF.has(r.fp))) continue; const o = m.get(r.periodEnd); if (!o || r.filedAt > o.filedAt) m.set(r.periodEnd, r); }
  return [...m.values()].sort((a, b) => a.periodEnd < b.periodEnd ? -1 : 1);
}
// sum of the last 4 quarters (must span <= 400 days) and of the 4 before; falls back to the latest FY value when quarters are missing
function ttm(rows, metric) {
  const q = byPeriod(rows, metric, true);
  if (q.length >= 4) { const last4 = q.slice(-4); if (daysBetween(last4[0].periodEnd, last4[3].periodEnd) <= 400) { const out = { value: last4.reduce((a, r) => a + r.value, 0), periodEnd: last4[3].periodEnd, filedAt: last4.map(r => r.filedAt).sort().pop(), basis: 'TTM' };
    if (q.length >= 8) { const prev = q.slice(-8, -4); if (daysBetween(prev[0].periodEnd, prev[3].periodEnd) <= 400 && daysBetween(prev[3].periodEnd, last4[3].periodEnd) <= 400) out.prior = prev.reduce((a, r) => a + r.value, 0); } return out; } }
  const fy = rows.filter(r => r.metric === metric && r.fp === 'FY').sort((a, b) => a.periodEnd < b.periodEnd ? -1 : 1);
  if (fy.length) { const l = fy[fy.length - 1]; return { value: l.value, periodEnd: l.periodEnd, filedAt: l.filedAt, basis: 'FY', prior: fy.length >= 2 ? fy[fy.length - 2].value : undefined }; }
  return null;
}
function latestInstant(rows, metric) { const a = byPeriod(rows, metric, false); return a.length ? a[a.length - 1] : null; }

// rows: all facts rows of one symbol. shares: fallback share count (e.g. mcap / price) when the source has none.
export function summarize(rows, { src, shares: sharesFallback } = {}) {
  if (!rows || !rows.length) return null;
  const rev = ttm(rows, 'rev'), ni = ttm(rows, 'ni'), eps = ttm(rows, 'eps'), cfo = ttm(rows, 'cfo'), eq = latestInstant(rows, 'eq'), assets = latestInstant(rows, 'assets'), sh = latestInstant(rows, 'shares');
  const anchor = [rev, ni, eq, assets].filter(Boolean); if (!anchor.length) return null;
  const periodEnd = anchor.map(a => a.periodEnd).sort().pop(), filedAt = anchor.map(a => a.filedAt).sort().pop();
  const shares = sh ? sh.value : (sharesFallback > 0 ? sharesFallback : null), eqv = eq ? eq.value : null, niv = ni ? ni.value : null, revv = rev ? rev.value : null;
  const f = { src, periodEnd, filedAt, revTTM: revv, niTTM: niv, epsTTM: eps ? r2(eps.value) : null, eq: eqv, assets: assets ? assets.value : null, cfoTTM: cfo ? cfo.value : null,
    roe: niv !== null && eqv > 0 ? r2(niv / eqv * 100) : null, margin: niv !== null && revv > 0 ? r2(niv / revv * 100) : null,
    revGrowth: rev && rev.prior > 0 ? r2((rev.value / rev.prior - 1) * 100) : null, bvps: eqv !== null && shares > 0 ? r2(eqv / shares) : null, basis: (rev || ni || {}).basis || 'TTM', updatedAt: new Date().toISOString() };
  if (rows.some(r => r.est)) f.est = true;
  for (const k of Object.keys(f)) if (f[k] === null || f[k] === undefined) delete f[k];
  return f;
}
// calendar/reports = { items: [{ symbol, date, kind: 'report', est, src }], updatedAt }; items of `src` are replaced per symbol
export function upsertCalendar(db, put, items, src) {
  const cur = db.docs['calendar/reports'] || { items: [] }, bySym = new Set(items.map(i => i.symbol));
  const keep = (cur.items || []).filter(i => !(i.src === src && bySym.has(i.symbol)));
  const all = keep.concat(items).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.symbol < b.symbol ? -1 : 1);
  put('calendar/reports', { items: all, updatedAt: new Date().toISOString(), note: 'Expected report dates are estimates: EDGAR = last 10-Q/10-K filing + 91 days (+365 without 10-Qs); BIST = period end + 45 days (Q1–Q3) or + 70 days (Q4), the KAP deadlines.' });
  return all.length;
}
// turn a fiscal-year row plus 3 quarterly rows of the same year into a derived Q4 row (flow metrics only)
export function deriveQ4(rows, srcLabel) {
  const out = [], flows = FLOW_METRICS;
  const byMetric = new Map(); for (const r of rows) { if (!flows.has(r.metric)) continue; let a = byMetric.get(r.metric); if (!a) { a = []; byMetric.set(r.metric, a); } a.push(r); }
  for (const [metric, a] of byMetric) {
    const fys = a.filter(r => r.fp === 'FY'), qs = byPeriod(a, metric, true);
    for (const fy of fys) { const start = fy.start || addDays(fy.periodEnd, -365); const inYear = qs.filter(q => q.periodEnd > start && q.periodEnd < fy.periodEnd && daysBetween(q.periodEnd, fy.periodEnd) < 300);
      if (inYear.length !== 3) continue; if (qs.some(q => q.periodEnd === fy.periodEnd)) continue;
      out.push({ sym: fy.sym, metric, periodEnd: fy.periodEnd, filedAt: fy.filedAt, value: +(fy.value - inYear.reduce((s, q) => s + q.value, 0)).toFixed(metric === 'eps' || metric === 'dps' ? 4 : 0), unit: fy.unit, form: fy.form, src: srcLabel, fp: 'Q4', ...(fy.est ? { est: true } : {}) }); }
  }
  return out;
}

// compact history for the Pointer analyses: last 4 fiscal years and last 8 quarters of every flow metric, last 8 balance values
export function history(rows) {
  if (!rows || !rows.length) return null; const metrics = [...new Set(rows.map(r => r.metric))], fy = {}, q = {}, bal = {};
  for (const m of metrics) { if (FLOW_METRICS.has(m)) { const f = byPeriod(rows.filter(r => r.fp === 'FY'), m, false).slice(-4); if (f.length) fy[m] = f.map(r => [r.periodEnd, r.value]); const qq = byPeriod(rows, m, true).slice(-8); if (qq.length) q[m] = qq.map(r => [r.periodEnd, r.value]); }
    else { const b = byPeriod(rows, m, false).slice(-8); if (b.length) bal[m] = b.map(r => [r.periodEnd, r.value]); } }
  return { fy, q, bal, at: new Date().toISOString().slice(0, 10) };
}
