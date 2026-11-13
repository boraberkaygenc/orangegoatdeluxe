// GNC Terminal — TCMB EVDS macro data (needs a free EVDS API key in config.json: "evdsKey").
// Updates: macro/series (history for the Macro tab), macro/main (CPI, 12-month expectation, policy rate)
// and settings/main deposit rates (unless the user has set them by hand).
const SERIES = {
  deposit: { code: 'TP.TRY.MT01', label: 'TL deposit rate, up to 1 month (weekly, %)' },
  usddep: { code: 'TP.USD.MT02', label: 'USD deposit rate, up to 3 months (weekly, %)' },
  cpi: { code: 'TP.TUKFIY2025.GENEL', formula: 3, label: 'CPI, annual change (%)' },
  expect: { code: 'TP.PKAUO.S01.E.U', label: '12-month CPI expectation (%)' },
  policy: { code: 'TP.BISPOLFAIZ.TUR', label: 'TCMB policy rate (%)' },
  usdtry: { code: 'TP.DK.USD.A.YTL', frequency: 3, label: 'USD/TRY (weekly average)' },
  usdtry12m: { code: 'TP.PKAUO.S05.C.U', label: 'USD/TRY expectation, 12 months ahead (market participants survey, TL)' },
  usdtryYE: { code: 'TP.PKAUO.S05.B.U', label: 'USD/TRY expectation, current year-end (TL)' },
  policy12m: { code: 'TP.PKAUO.S04.D.U', label: 'Policy rate expectation, 12 months ahead (%)' },
  deposit3m: { code: 'TP.TRY.MT02', label: 'TL deposit rate, up to 3 months (weekly, %)' }
};
const dmy = d => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
function parseDate(t) { let m = String(t).match(/^(\d{2})-(\d{2})-(\d{4})$/); if (m) return `${m[3]}-${m[2]}-${m[1]}`; m = String(t).match(/^(\d{4})-(\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-01`; m = String(t).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : null; }
async function fetchSeries(key, s, start, end) {
  const q = `series=${s.code}&startDate=${dmy(start)}&endDate=${dmy(end)}&type=json${s.formula ? '&formulas=' + s.formula : ''}${s.frequency ? '&frequency=' + s.frequency : ''}`;
  let last;
  for (const base of ['https://evds3.tcmb.gov.tr/igmevdsms-dis/', 'https://evds2.tcmb.gov.tr/service/evds/']) {
    try {
      const r = await fetch(base + q, { headers: { key, 'User-Agent': 'GNC-Terminal' }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(), field = s.code.replace(/\./g, '_') + (s.formula ? '-' + s.formula : '');
      const rows = (j.items || []).map(it => { const keys = Object.keys(it), k = keys.find(k => k === field) || keys.find(k => k.startsWith(s.code.replace(/\./g, '_'))); const v = parseFloat(it[k]); const d = parseDate(it.Tarih); return d && isFinite(v) ? [d, +v.toFixed(4)] : null; }).filter(Boolean);
      if (!rows.length) throw new Error('no rows');
      return rows;
    } catch (e) { last = e; }
  }
  throw last;
}
export function createEvds({ key, db, put, log, inbox, mark }) {
  let running = null;
  async function update(reason = 'schedule') {
    if (!key) return { skipped: true };
    if (running) return running;
    running = (async () => {
      const end = new Date(), start = new Date(Date.now() - 2.2 * 365 * 864e5), cur = db.docs['macro/series'] || { series: {} }, out = { ...cur, series: { ...(cur.series || {}) } }, ok = [], fail = [];
      for (const [k, s] of Object.entries(SERIES)) {
        try { const rows = await fetchSeries(key, s, start, end); out.series[k] = { label: s.label, code: s.code, data: rows }; ok.push(k); }
        catch (e) { fail.push(`${k}: ${e.message}${e.cause && e.cause.code ? ' / ' + e.cause.code : ''}`); }
      }
      out.asOf = new Date().toISOString().slice(0, 10); out.note = ok.length ? `EVDS: ${ok.join(', ')} updated${fail.length ? '; failed ' + fail.join('; ') : ''}` : `EVDS failed: ${fail.join('; ')}`;
      out.ok = ok.length > 0; put('macro/series', out);
      const last = k => { const d = out.series[k] && out.series[k].data; return d && d.length ? d[d.length - 1] : null; };
      if (ok.length) {
        const m = { ...(db.docs['macro/main'] || {}) }, cpi = last('cpi'), ex = last('expect'), pol = last('policy');
        if (cpi) { m.cpi = +cpi[1].toFixed(2); m.cpiAsOf = cpi[0]; }
        if (ex) { m.infl12m = ex[1]; m.expAsOf = ex[0]; }
        if (pol && (!m.policyAsOf || pol[0] > m.policyAsOf)) { m.policyRate = pol[1]; m.policyAsOf = pol[0]; }
        // market participants survey: USD/TRY 12 months ahead and year-end, policy rate 12 months ahead; expected depreciation vs the spot
        const u12 = last('usdtry12m'), uye = last('usdtryYE'), p12 = last('policy12m'), spotDoc = db.docs['instruments/USD_TRY'], spot = spotDoc && spotDoc.price > 0 ? spotDoc.price : null;
        if (u12) { m.usdtry12m = u12[1]; m.pkaAsOf = u12[0]; } if (uye) m.usdtryYE = uye[1]; if (p12) m.policy12m = p12[1];
        const S0 = db.docs['settings/main'] || {};
        if (m.usdtry12m > 0 && spot) { m.expDepr12m = +((m.usdtry12m / spot - 1) * 100).toFixed(2); m.spotForExp = spot; if (S0.depRate > 0) m.carry12m = +(S0.depRate - m.expDepr12m).toFixed(2); } else { delete m.expDepr12m; delete m.carry12m; }
        m.asOf = `TCMB EVDS, ${out.asOf}: CPI ${m.cpiAsOf ? m.cpiAsOf.slice(0, 7) : '—'}, expectation ${m.expAsOf ? m.expAsOf.slice(0, 7) : '—'}, policy rate ${m.policyAsOf ? m.policyAsOf.slice(0, 7) : 'manual'}${m.pkaAsOf ? ', survey ' + m.pkaAsOf.slice(0, 7) : ''}.`;
        put('macro/main', m);
        const S = { ...(db.docs['settings/main'] || {}) }, dep = last('deposit'), ud = last('usddep'), d3 = last('deposit3m');
        if (!S.depManual && dep) { S.depRate = dep[1]; S.depRateAsOf = dep[0]; if (ud) S.usdDepRate = ud[1]; if (d3) S.depRate3m = d3[1]; put('settings/main', S); }
      } else inbox('bad', 'Macro update failed', `TCMB EVDS could not be reached (${reason}). ${fail.slice(0, 2).join('; ')}. Check the evdsKey in config.json; the app keeps the last values.`, 'macro');
      if (mark) try { mark('EVDS', ok.length > 0, fail.join('; ') || null, { rows: ok.length, partial: ok.length > 0 && fail.length > 0 }); } catch (e) { }
      log(`evds (${reason}): ${out.note}`);
    })().finally(() => { running = null; });
    return running;
  }
  return { update, stale: h => { const s = db.docs['macro/series']; return !s || !s.asOf || !s.ok || (Date.now() - new Date(s.asOf)) / 36e5 > h; } };
}
