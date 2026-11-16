// GNC Terminal — Ziraat Bankası daily exchange rates (branch "Gişe" table: Döviz Alış / Döviz Satış, Efektif Alış / Efektif Satış).
// The app values USD held in a fund at Ziraat's USD buying rate (what the bank pays when the dollars are sold back),
// and suggests Ziraat's selling rate when TRY is converted to USD. Document: macro/ziraat { asOf, ok, rows: { 'YYYY-MM-DD': { USD: [alış, satış, efAlış, efSatış], EUR: [...] } } }
const URL_ = 'https://www.ziraatbank.com.tr/tr/_layouts/15/Ziraat/FaizOranlari/Ajax.aspx/GetDovizKurlari';
const CCYS = ['USD', 'EUR'];
const num = s => { const v = parseFloat(String(s).trim().replace(/\./g, '').replace(',', '.')); return isFinite(v) && v > 0 ? v : null; };

// html of the rates block → { USD: [buy, sell, effBuy, effSell] } from the branch table (data-id="rdBranchDoviz")
export function parseZiraat(html) {
  const i = html.indexOf('data-id="rdBranchDoviz"'); if (i < 0) return null;
  const j = html.indexOf('data-id="rdIntBranchDoviz"', i), blk = html.slice(i, j > i ? j : undefined), out = {};
  for (const c of CCYS) {
    const m = blk.match(new RegExp(`>\\s*${c}\\s*</td>\\s*<td[^>]*>[^<]*</td>((?:\\s*<td[^>]*>[^<]*</td>){2,4})`));
    if (!m) continue; const v = [...m[1].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(x => num(x[1]));
    if (v[0] && v[1] && v[1] >= v[0]) out[c] = v.map(x => x || null);
  }
  return Object.keys(out).length ? out : null;
}
export async function fetchZiraatDay(date) {
  const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'Mozilla/5.0 (GNC Terminal)' }, body: JSON.stringify({ date }), signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json(), d = j && j.d; if (!d || d.StatusCode !== 200) throw new Error('status ' + (d && d.StatusCode));
  return parseZiraat(String(d.Data || '')); // null on weekends and holidays (no table)
}

const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const isWeekend = d => { const w = new Date(d + 'T12:00:00Z').getUTCDay(); return w === 0 || w === 6; };

export function createZiraat({ db, put, log, ist, mark, days = 740, perRun = 120 }) {
  let running = null;
  // fetches today (always) and fills missing past weekdays, newest first, up to perRun requests a run
  async function update(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const cur = db.docs['macro/ziraat'] || {}, rows = { ...(cur.rows || {}) }, none = new Set(cur.none || []), today = ist().date, start = addDays(today, -days);
      const want = [today]; for (let d = addDays(today, -1); d >= start && want.length < perRun; d = addDays(d, -1)) if (!isWeekend(d) && !rows[d] && !none.has(d)) want.push(d);
      let got = 0, fail = 0, lastErr = null;
      for (const d of want) {
        try { const v = await fetchZiraatDay(d); if (v) { rows[d] = v; got++; } else if (d !== today) none.add(d); }
        catch (e) { fail++; lastErr = e.message; if (fail >= 5 && !got) break; }
        await new Promise(r => setTimeout(r, 150));
      }
      for (const k of Object.keys(rows)) if (k < start) delete rows[k];
      const ks = Object.keys(rows).sort(), last = ks[ks.length - 1];
      put('macro/ziraat', { asOf: new Date().toISOString(), ok: got > 0 || ks.length > 0, last: last || null, n: ks.length, rows, none: [...none].filter(d => d >= start).sort(), note: `Ziraat Bankası gişe kurları: ${got} gün alındı${fail ? `, ${fail} hata (${lastErr})` : ''}` });
      if (mark) try { mark('Ziraat', got > 0, fail ? lastErr : null, { rows: got }); } catch (e) { }
      log(`ziraat (${reason}): ${got} days fetched, ${ks.length} stored${fail ? `, ${fail} failed: ${lastErr}` : ''}`);
    })().finally(() => { running = null; });
    return running;
  }
  return { update, stale: h => { const s = db.docs['macro/ziraat']; return !s || !s.asOf || (Date.now() - new Date(s.asOf)) / 36e5 > h; } };
}
