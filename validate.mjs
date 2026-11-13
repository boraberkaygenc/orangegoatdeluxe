// GNC Terminal — data-quality validation after every refresh and BIST price reconciliation on full runs.
// Flags live on the instrument doc as x.dq = { gap, dupes, volZero, fundStale, unitSuspect, unverified } (false keys omitted, the
// object deleted when clean). Gaps are measured against the market calendar inferred from the universe itself (a weekday counts as a
// trading day when at least half of the same-market instruments have a bar), so holidays do not raise false alarms.
// Reconciliation: last 5 closes of a rotating sample of 40 BIST names against İş Yatırım's daily price endpoint; > 1% divergence
// on any day sets x.unverified = date (cleared when the next check agrees).
import { barsOf } from './data.mjs';
import { hisseTekil } from './isyatirim.mjs';
import { addDays, daysBetween, today } from './fundamentals.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const MARKET = { TR_EQ: 'TR', TR_ETF: 'TR', US_EQ: 'US' };

export function dqOf(x, bars, calendar, asOf) {
  const dq = {}, dates = bars.map(b => b[0]);
  const dupes = dates.length - new Set(dates).size; if (dupes > 0) dq.dupes = dupes;
  if (calendar && dates.length >= 20) { const last = dates[dates.length - 1], days = calendar.filter(d => d <= last).slice(-60), have = new Set(dates); const missing = days.filter(d => !have.has(d)).length; if (missing > 3) dq.gap = missing; }
  if ((x.cls === 'US_EQ' || x.cls === 'TR_EQ') && bars.length >= 10) { let streak = 0; for (let i = bars.length - 1; i >= 0; i--) { const v = bars[i][4]; if (v !== null && v !== undefined && v <= 0) streak++; else break; } if (streak >= 5) dq.volZero = streak; }
  if (x.fund && x.fund.periodEnd && daysBetween(x.fund.periodEnd, asOf) > 190) dq.fundStale = true;
  if (x.cls === 'TR_EQ' && (x.idx || []).includes('XU100') && x.fund && ((typeof x.fund.revTTM === 'number' && x.fund.revTTM < 1e5) || (typeof x.fund.assets === 'number' && x.fund.assets < 1e6))) dq.unitSuspect = true;
  if (x.unverified) dq.unverified = x.unverified;
  return Object.keys(dq).length ? dq : null;
}
// trading-day calendar per market from the universe: a date is a trading day when >= 50% of instruments with history have a bar
export function calendars(list) {
  const counts = { TR: new Map(), US: new Map() }, n = { TR: 0, US: 0 }, since = addDays(today(), -120);
  for (const x of list) { const m = MARKET[x.cls]; if (!m) continue; const b = barsOf(x); if (b.length < 20) continue; n[m]++; for (const r of b) if (r[0] >= since) counts[m].set(r[0], (counts[m].get(r[0]) || 0) + 1); }
  const out = {}; for (const m of ['TR', 'US']) out[m] = [...counts[m].entries()].filter(([, c]) => c >= n[m] * 0.5).map(([d]) => d).sort();
  return out;
}

export function createValidate({ db, put, log, coll, store2, mark }) {
  const state = () => db.docs['status/validate'] || { cursor: 0 };
  async function reconcile(sample) {
    const t1 = today(), t0 = addDays(t1, -14); let checked = 0, diverged = 0, fails = 0, firstErr = null; const flagged = [];
    for (const [k, x] of sample) {
      try { const isy = await hisseTekil(x.symbol, t0, t1); const ref = new Map(isy); const mine = barsOf(db.docs[k] || x).filter(b => ref.has(b[0])).slice(-5);
        if (!isy.length || !mine.length) { fails++; if (!firstErr) firstErr = `${x.symbol}: no overlapping days`; continue; } checked++;
        const dev = Math.max(...mine.map(b => Math.abs(b[1] / ref.get(b[0]) - 1))); const y = { ...(db.docs[k] || x) };
        if (dev > 0.01) { diverged++; y.unverified = t1; flagged.push(`${x.symbol} ${(dev * 100).toFixed(1)}%`); } else delete y.unverified; db.docs[k] = y; }
      catch (e) { fails++; const why = errMsg(e); if (!firstErr) firstErr = `${x.symbol}: ${why}`; }
      await sleep(200);
    }
    if (sample.length) mark('Is Yatirim prices', checked > 0, firstErr, { rows: checked, partial: checked > 0 && fails > 0 });
    return { at: new Date().toISOString(), checked, diverged, fails, flagged: flagged.slice(0, 20), firstErr };
  }
  async function run({ full = false, reason = 'refresh' } = {}) {
    const t0 = Date.now(), list = coll('instruments'), items = list.map(([, x]) => x).filter(x => x.cls !== 'MACRO'), cal = calendars(items), asOf = today(), counts = { gap: 0, dupes: 0, volZero: 0, fundStale: 0, unitSuspect: 0, unverified: 0 };
    const st = { ...state() };
    if (full) { const tr = list.filter(([, x]) => x.cls === 'TR_EQ').sort((a, b) => a[1].symbol < b[1].symbol ? -1 : 1); if (tr.length) { const start = (st.cursor || 0) % tr.length, sample = []; for (let i = 0; i < Math.min(40, tr.length); i++) sample.push(tr[(start + i) % tr.length]); st.cursor = (start + sample.length) % tr.length; st.reconciliation = await reconcile(sample); } }
    for (const [k, x] of list) { if (x.cls === 'MACRO') continue; const cur = db.docs[k] || x, dq = dqOf(cur, barsOf(cur), cal[MARKET[cur.cls]] || null, asOf); const y = { ...cur }; if (dq) { y.dq = dq; for (const f of Object.keys(counts)) if (dq[f]) counts[f]++; } else delete y.dq; if (JSON.stringify(y.dq || null) !== JSON.stringify(cur.dq || null)) db.docs[k] = y; }
    db.rev++;
    put('status/validate', { ...st, updatedAt: new Date().toISOString(), counts, secs: Math.round((Date.now() - t0) / 1000), note: reason });
    log(`validate (${reason}): gaps ${counts.gap}, duplicates ${counts.dupes}, zero-volume ${counts.volZero}, stale fundamentals ${counts.fundStale}, unit suspects ${counts.unitSuspect}, unverified ${counts.unverified}${st.reconciliation && full ? `; reconciliation ${st.reconciliation.checked} checked, ${st.reconciliation.diverged} diverged` : ''}`);
    return counts;
  }
  return { run, dqOf, calendars };
}
