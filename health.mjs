// GNC Terminal — Health 2.0: status/health = { schemaVersion: 2, sources: { <name>: { lastOk, lastFail, fails, lastError, rows, slaHours, breached } },
// days: { 'YYYY-MM-DD': { <source>: 'ok'|'fail'|'partial' } } (30 days), coverage: { fundUS, fundTR, history10y, membership } (percent),
// backfill: { state, done, total, phases }, dq: { gap, dupes, volZero, fundStale, unitSuspect, unverified } (counts), instruments, durations, updatedAt }.
// SLA hours come from config.sla (defaults below); a breached source raises one Inbox warning per source per day (kind 'health').
export const SLA_DEFAULTS = { 'Yahoo quotes': 24, 'Yahoo quotes (market hours)': 1, 'Yahoo history': 30, 'Yahoo profiles': 240, 'TEFAS': 30, 'EVDS': 48, 'SEC EDGAR': 72, 'Is Yatirim financials': 72, 'Is Yatirim prices': 72, 'Index membership': 45 * 24, 'Lighthouse': 8, 'IPO': 14, 'broker research': 10 };
const YEARS = y => Math.round(365.25 * y);
export function createHealth({ db, put, log, inbox, coll, ist, config, store2, inWindow }) {
  const SLA = { ...SLA_DEFAULTS, ...((config && config.sla) || {}) };
  const health = () => { const h = db.docs['status/health'] || {}; h.sources = h.sources || {}; h.days = h.days || {}; h.durations = h.durations || {}; h.schemaVersion = 2; return h; };
  const day = () => (ist ? ist().date : new Date().toISOString().slice(0, 10));
  function dayMark(h, src, state) { const d = day(), row = h.days[d] || (h.days[d] = {}), cur = row[src]; row[src] = state === 'partial' || (cur && cur !== state) ? 'partial' : state; const keys = Object.keys(h.days).sort(); for (const k of keys.slice(0, Math.max(0, keys.length - 30))) delete h.days[k]; }
  function mark(src, ok, msg, { rows, partial } = {}) {
    const h = health(), s = h.sources[src] || { fails: 0 }, now = new Date().toISOString();
    if (ok) { s.lastOk = now; s.fails = 0; delete s.lastError; if (typeof rows === 'number') s.rows = rows; dayMark(h, src, partial ? 'partial' : 'ok'); }
    else { s.lastFail = now; s.fails = (s.fails || 0) + 1; s.lastError = String(msg || '').slice(0, 160); dayMark(h, src, 'fail'); if (s.fails === 2) inbox('warn', `${src} failed twice`, `${src} could not be reached twice in a row: ${s.lastError}. The app keeps the last data and retries on the next run.`, 'health'); }
    if (ok && msg && partial) s.lastError = String(msg).slice(0, 160);
    h.sources[src] = s; put('status/health', h);
  }
  // sources that do not call mark(): derive their last success from their own documents
  function external(h) {
    const set = (src, at, failNote) => { if (!at) return; const s = h.sources[src] || { fails: 0 }; if (!s.lastOk || s.lastOk < at) { s.lastOk = at; if (!failNote) s.fails = 0; } if (failNote) s.lastError = String(failNote).slice(0, 160); h.sources[src] = s; };
    const ms = db.docs['macro/series']; if (ms && ms.asOf && ms.ok) set('EVDS', new Date(ms.asOf + 'T12:00:00Z').toISOString());
    const lh = db.docs['lighthouse/main']; if (lh && lh.updatedAt) set('Lighthouse', lh.updatedAt, /failed/.test(lh.note || '') ? lh.note : null);
    const ip = db.docs['ipo/main']; if (ip && ip.updatedAt) set('IPO', ip.updatedAt);
    const rs = db.docs['research/main']; if (rs && rs.updatedAt) set('broker research', rs.updatedAt);
  }
  function slaOf(src) { if (src === 'Yahoo quotes') return inWindow && ist && inWindow(ist()) ? SLA['Yahoo quotes (market hours)'] : SLA['Yahoo quotes']; return SLA[src] ?? null; }
  function update() {
    const h = health(), now = Date.now(), today = day(), list = coll('instruments').map(([, x]) => x).filter(x => x.cls !== 'MACRO');
    const age = x => x.fetchedAt ? (now - new Date(x.fetchedAt)) / 36e5 : 999;
    h.instruments = { total: list.length, byClass: list.reduce((a, x) => { a[x.cls] = (a[x.cls] || 0) + 1; return a; }, {}), fresh: list.filter(x => age(x) < 24).length, stale: list.filter(x => age(x) >= 24).length, noHistory: list.filter(x => !(x.closes && x.closes.length >= 120)).length, errors: list.filter(x => x.fetchError).length, outliers: list.filter(x => x.outlier).length, noProfile: list.filter(x => (x.cls === 'US_EQ' || x.cls === 'TR_EQ') && !x.profileAt).length, noFundamentals: list.filter(x => (x.cls === 'US_EQ' || x.cls === 'TR_EQ') && !(x.pe > 0) && !(x.pb > 0) && !x.fund).length, withFund: list.filter(x => x.fund).length };
    external(h);
    h.slaWarned = h.slaWarned || {};
    for (const [src, s] of Object.entries(h.sources)) { const sla = slaOf(src); s.slaHours = sla; const hrs = s.lastOk ? (now - new Date(s.lastOk)) / 36e5 : null; s.breached = sla !== null && ((hrs !== null && hrs > sla) || (hrs === null && !!s.lastFail));
      if (s.breached && h.slaWarned[src] !== today) { h.slaWarned[src] = today; inbox('warn', `${src}: no successful update for ${hrs === null ? 'a while' : Math.round(hrs) + ' h'}`, `The ${src} source is past its ${sla} h service level${s.lastError ? ' (last error: ' + s.lastError + ')' : ''}. The app keeps the last data and keeps retrying; check data/refresh.log if this persists.`, 'health'); } }
    for (const k of Object.keys(h.slaWarned)) if (h.slaWarned[k] !== today) delete h.slaWarned[k];
    const us = list.filter(x => x.cls === 'US_EQ'), tr = list.filter(x => x.cls === 'TR_EQ'), hist = list.filter(x => x.cls === 'US_EQ' || x.cls === 'TR_EQ' || x.cls === 'TR_ETF'), pct = (a, b) => b ? +(a / b * 100).toFixed(1) : 0;
    const cutoff = new Date(now - YEARS(9.5) * 864e5).toISOString().slice(0, 10), idx = store2 ? store2.seriesAll() : {};
    const snap = store2 ? store2.readSide('membership_snapshot', { lists: {} }) : { lists: {} };
    h.coverage = { fundUS: pct(us.filter(x => x.fund && x.fund.src === 'EDGAR').length, us.length), fundTR: pct(tr.filter(x => x.fund && x.fund.src === 'IsYatirim').length, tr.length), history10y: pct(hist.filter(x => { const m = idx[x.symbol]; return m && (m.n >= 2000 || (m.from && m.from <= cutoff)); }).length, hist.length), membership: pct(['XU030', 'XU050', 'XU100', 'SPX', 'NDX'].filter(i => (snap.lists[i] || []).length).length, 5) };
    if (store2) { const fs = store2.factStats(); h.facts = { rows: fs.rows, symbols: fs.symbols, series: Object.keys(idx).length, membershipEvents: store2.membershipRows().length }; }
    const bf = db.docs['status/backfill']; if (bf && bf.phases) { const ph = Object.entries(bf.phases); h.backfill = { state: bf.running ? 'running' : ph.every(([, p]) => p.state === 'done') ? 'complete' : 'pending', done: ph.reduce((a, [, p]) => a + (p.done || 0), 0), total: ph.reduce((a, [, p]) => a + (p.total || 0), 0), phases: Object.fromEntries(ph.map(([k, p]) => [k, `${p.done || 0}/${p.total || 0} ${p.state || 'pending'}`])), updatedAt: bf.updatedAt }; }
    const dq = { gap: 0, dupes: 0, volZero: 0, fundStale: 0, unitSuspect: 0, unverified: 0 }; for (const x of list) if (x.dq) for (const k of Object.keys(dq)) if (x.dq[k]) dq[k]++; h.dq = dq;
    const v = db.docs['status/validate']; if (v && v.reconciliation) h.reconciliation = v.reconciliation;
    h.updatedAt = new Date().toISOString(); put('status/health', h); return h;
  }
  return { mark, update, health, slaOf };
}
