// GNC Terminal — market data engine: Yahoo Finance (batch quotes with crumb, daily OHLCV history, company profiles),
// TEFAS (daily NAV, fund list), refresh orchestration with progress/ETA, retries, data-quality checks and the health doc.
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'application/json,text/plain,*/*', 'Accept-Language': 'en-US,en;q=0.8' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
export function errMsg(e) { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); }
const DTF = new Map(); // one Intl.DateTimeFormat per time zone (each one holds native ICU memory; creating one per bar leaks RSS until a major GC)
const dateIn = (ts, tz) => { const z = tz || 'Europe/Istanbul'; let f = DTF.get(z); if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }); DTF.set(z, f); } return f.format(new Date(ts * 1000)); };
const MACRO_YAHOO = { 'XU100': 'XU100.IS', 'USD/TRY': 'TRY=X', 'EUR/USD': 'EURUSD=X', 'SPX': '^GSPC' };
export function yahooSymbol(x) { if (x.derived) return null; if (x.yahoo) return x.yahoo; if (MACRO_YAHOO[x.symbol]) return MACRO_YAHOO[x.symbol]; if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') return x.symbol + '.IS'; if (x.cls === 'US_EQ' || x.cls === 'US_ETF') return x.symbol.replace('.', '-'); return null; }

/* ---------------- Yahoo session (cookie + crumb, needed for v7 quotes and quoteSummary) ---------------- */
let session = { cookie: '', crumb: '', at: 0 };
async function yahooSession(force) {
  if (!force && session.crumb && Date.now() - session.at < 6 * 36e5) return session;
  const r1 = await fetch('https://fc.yahoo.com/', { headers: UA, redirect: 'manual', signal: AbortSignal.timeout(15000) }).catch(() => null);
  let cookie = '';
  try { const sc = r1 && r1.headers && (r1.headers.getSetCookie ? r1.headers.getSetCookie() : [r1.headers.get('set-cookie')]); cookie = (sc || []).filter(Boolean).map(c => c.split(';')[0]).join('; '); } catch (e) { }
  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { ...UA, Cookie: cookie }, signal: AbortSignal.timeout(15000) });
  if (!r2.ok) throw new Error('crumb HTTP ' + r2.status);
  const crumb = (await r2.text()).trim(); if (!crumb || crumb.length > 40 || crumb.includes('<')) throw new Error('no crumb');
  session = { cookie, crumb, at: Date.now() }; return session;
}
const num = v => (typeof v === 'number' && isFinite(v)) ? v : (v && typeof v === 'object' && typeof v.raw === 'number' ? v.raw : null);

/* ---------------- Yahoo: batch quotes (price + fundamentals) ---------------- */
export async function yahooQuotes(symbols) { // -> Map yahooSymbol -> fields
  const s = await yahooSession(), out = new Map();
  for (let i = 0; i < symbols.length; i += 60) {
    const chunk = symbols.slice(i, i + 60), url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(','))}&crumb=${encodeURIComponent(s.crumb)}&fields=regularMarketPrice,regularMarketTime,regularMarketVolume,averageDailyVolume3Month,trailingPE,forwardPE,priceToBook,trailingAnnualDividendYield,dividendYield,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName,longName,currency,exchangeTimezoneName,quoteType,epsTrailingTwelveMonths,bookValue,fiftyDayAverage,twoHundredDayAverage,regularMarketPreviousClose`;
    let r = await fetch(url, { headers: { ...UA, Cookie: s.cookie }, signal: AbortSignal.timeout(20000) });
    if (r.status === 401 || r.status === 403) { await yahooSession(true); r = await fetch(url.replace(/crumb=[^&]*/, 'crumb=' + encodeURIComponent(session.crumb)), { headers: { ...UA, Cookie: session.cookie }, signal: AbortSignal.timeout(20000) }); }
    if (!r.ok) throw new Error('quote HTTP ' + r.status);
    const j = await r.json(), res = j && j.quoteResponse && j.quoteResponse.result; if (!Array.isArray(res)) throw new Error('quote: no result');
    for (const q of res) { if (!q || !q.symbol) continue; out.set(q.symbol, {
      price: num(q.regularMarketPrice), at: num(q.regularMarketTime) ? new Date(q.regularMarketTime * 1000).toISOString() : null, tz: q.exchangeTimezoneName, prevClose: num(q.regularMarketPreviousClose),
      volume: num(q.regularMarketVolume), avgVolume: num(q.averageDailyVolume3Month), pe: num(q.trailingPE), fpe: num(q.forwardPE), pb: num(q.priceToBook), divYield: num(q.dividendYield) ?? (num(q.trailingAnnualDividendYield) !== null ? q.trailingAnnualDividendYield * 100 : null),
      mcap: num(q.marketCap), hi52: num(q.fiftyTwoWeekHigh), lo52: num(q.fiftyTwoWeekLow), name: q.longName || q.shortName || null, shortName: q.shortName || null, currency: q.currency, ma50: num(q.fiftyDayAverage), ma200: num(q.twoHundredDayAverage), eps: num(q.epsTrailingTwelveMonths) }); }
    if (i + 60 < symbols.length) await sleep(300);
  }
  return out;
}
/* ---------------- Yahoo: spark (prices only, no crumb) as a fallback ---------------- */
export async function yahooSpark(symbols) {
  const out = new Map();
  for (let i = 0; i < symbols.length; i += 50) {
    const chunk = symbols.slice(i, i + 50);
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(chunk.join(','))}&range=5d&interval=1d`, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('spark HTTP ' + r.status);
    const j = await r.json(); const res = (j && j.spark && j.spark.result) || (Array.isArray(j) ? j : Object.values(j || {}));
    for (const it of res) { const resp = it && (it.response ? it.response[0] : it); if (!resp) continue; const sym = it.symbol || resp.symbol; const m = resp.meta || {}, cl = (resp.indicators && resp.indicators.quote && resp.indicators.quote[0] && resp.indicators.quote[0].close) || resp.close || [];
      const last = [...cl].reverse().find(v => v > 0); const price = num(m.regularMarketPrice) ?? last ?? null; if (sym && price) out.set(sym, { price, at: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null, tz: m.exchangeTimezoneName }); }
    if (i + 50 < symbols.length) await sleep(300);
  }
  return out;
}
/* ---------------- Yahoo: daily OHLCV history ---------------- */
export async function yahooChart(sym, range) {
  let lastErr;
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d&includePrePost=false&events=div,splits`, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(), res = j && j.chart && j.chart.result && j.chart.result[0];
      if (!res) throw new Error((j && j.chart && j.chart.error && j.chart.error.description) || 'no result');
      const tz = res.meta.exchangeTimezoneName, ts = res.timestamp || [], q = (res.indicators.quote[0] || {}), cl = q.close || [], hi = q.high || [], lo = q.low || [], vo = q.volume || [];
      const bars = []; for (let i = 0; i < ts.length; i++) if (cl[i] > 0) bars.push([dateIn(ts[i], tz), +(+cl[i]).toFixed(6), hi[i] > 0 ? +(+hi[i]).toFixed(6) : null, lo[i] > 0 ? +(+lo[i]).toFixed(6) : null, vo[i] >= 0 ? Math.round(vo[i]) : null]);
      const m = res.meta; if (m.regularMarketPrice > 0 && m.regularMarketTime) { const d = dateIn(m.regularMarketTime, tz); const last = bars[bars.length - 1]; if (last && last[0] === d) last[1] = +m.regularMarketPrice; else bars.push([d, +m.regularMarketPrice, null, null, num(m.regularMarketVolume)]); }
      const splits = res.events && res.events.splits ? Object.values(res.events.splits).map(s => ({ date: dateIn(s.date, tz), ratio: s.splitRatio })) : [];
      return { bars, price: m.regularMarketPrice > 0 ? +m.regularMarketPrice : (bars.length ? bars[bars.length - 1][1] : null), at: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null, splits, name: m.longName || m.shortName || null };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}
/* ---------------- Yahoo: company profile (sector, industry, ROE, margins, beta) ---------------- */
export async function yahooProfile(sym) {
  const s = await yahooSession();
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=assetProfile,financialData,defaultKeyStatistics&crumb=${encodeURIComponent(s.crumb)}`;
  let r = await fetch(url, { headers: { ...UA, Cookie: s.cookie }, signal: AbortSignal.timeout(20000) });
  if (r.status === 401 || r.status === 403) { await yahooSession(true); r = await fetch(url.replace(/crumb=[^&]*/, 'crumb=' + encodeURIComponent(session.crumb)), { headers: { ...UA, Cookie: session.cookie }, signal: AbortSignal.timeout(20000) }); }
  if (!r.ok) throw new Error('profile HTTP ' + r.status);
  const j = await r.json(), res = j && j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0]; if (!res) throw new Error('profile: no result');
  const ap = res.assetProfile || {}, fd = res.financialData || {}, ks = res.defaultKeyStatistics || {};
  return { sector: ap.sector || null, industry: ap.industry || null, roe: num(fd.returnOnEquity) !== null ? +(fd.returnOnEquity.raw ?? fd.returnOnEquity) * 100 : null, margin: num(fd.profitMargins) !== null ? +(fd.profitMargins.raw ?? fd.profitMargins) * 100 : null, grossMargin: num(fd.grossMargins) !== null ? +(fd.grossMargins.raw ?? fd.grossMargins) * 100 : null, beta: num(ks.beta), pb: num(ks.priceToBook), summary: ap.longBusinessSummary ? String(ap.longBusinessSummary).slice(0, 400) : null };
}

/* ---------------- TEFAS ---------------- */
const TEFAS_HEADERS = { ...UA, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest', 'Origin': 'https://www.tefas.gov.tr', 'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx' };
const fmtTr = d => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
export async function tefasHistory(code, days) {
  const end = new Date(), start = new Date(Date.now() - days * 864e5), rows = []; let size = null;
  for (let s = new Date(start); s < end; s = new Date(s.getTime() + 90 * 864e5)) {
    const e = new Date(Math.min(end.getTime(), s.getTime() + 89 * 864e5));
    const body = new URLSearchParams({ fontip: 'YAT', sfontur: '', fonkod: code, fongrup: '', bastarih: fmtTr(s), bittarih: fmtTr(e), fonturkod: '', fonunvantip: '', kurucukod: '' });
    const r = await fetch('https://www.tefas.gov.tr/api/DB/BindHistoryInfo', { method: 'POST', body, headers: TEFAS_HEADERS, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json(); for (const d of (j.data || [])) if (+d.FIYAT > 0) { rows.push([dateIn(Math.floor(+d.TARIH / 1000)), +d.FIYAT]); if (+d.PORTFOYBUYUKLUK > 0) size = +d.PORTFOYBUYUKLUK; }
    if (days > 90) await sleep(400);
  }
  if (!rows.length) throw new Error('no rows');
  rows.sort((a, b) => a[0] < b[0] ? -1 : 1);
  return { rows, price: rows[rows.length - 1][1], size, name: null };
}
export async function tefasList() { // all funds with type and 1-year return, from the comparison screen
  const end = new Date(), start = new Date(Date.now() - 365 * 864e5);
  const body = new URLSearchParams({ calismatipi: '2', fontip: 'YAT', sfontur: '', kurucukod: '', fongrup: '', bastarih: fmtTr(start), bittarih: fmtTr(end), fonturkod: '', fonunvantip: '', strperiod: '1,1,1,1,1,1,1', islemdurum: '1' });
  const r = await fetch('https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns', { method: 'POST', body, headers: { ...TEFAS_HEADERS, Referer: 'https://www.tefas.gov.tr/FonKarsilastirma.aspx' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json(); return (j.data || []).map(d => ({ code: d.FONKODU, name: d.FONUNVAN, type: d.FONTURACIKLAMA || '', r1y: +d.GETIRI1Y || +d.GETIRIYIL || null })).filter(f => f.code);
}

/* ---------------- refresh orchestration ---------------- */
function mergeBars(oldB, newB, keep = 262) { const m = new Map(); for (const r of oldB || []) if (r && r[1] > 0) m.set(r[0], r); for (const r of newB || []) if (r && r[1] > 0) { const o = m.get(r[0]); m.set(r[0], o ? [r[0], r[1], r[2] ?? o[2], r[3] ?? o[3], r[4] ?? o[4]] : r); } return [...m.values()].sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-keep); }
export function barsOf(x) { const hl = Array.isArray(x.hlv) && Array.isArray(x.closes) && x.hlv.length === x.closes.length ? x.hlv : null; return Array.isArray(x.bars) && x.bars.length ? x.bars : (Array.isArray(x.closes) ? x.closes.map((r, i) => hl ? [r[0], r[1], hl[i][0], hl[i][1], hl[i][2]] : [r[0], r[1], null, null, null]) : []); }
function derive(y) { // stored as closes [[date, close]] + hlv [[high, low, volume]] aligned; 52-week range and 200-day average from own history
  const bars = y.bars; y.closes = bars.map(r => [r[0], +(+r[1]).toFixed(4)]); y.hlv = bars.map(r => [r[2] !== null && r[2] !== undefined ? +(+r[2]).toFixed(4) : null, r[3] !== null && r[3] !== undefined ? +(+r[3]).toFixed(4) : null, r[4] ?? null]); const last = bars[bars.length - 1]; if (last) { if (!(y.price > 0)) y.price = last[1]; y.asOf = last[0]; }
  if (bars.length >= 200) { const c = bars.map(r => r[1]), w = c.slice(-252); y.hi52 = Math.max(...w); y.lo52 = Math.min(...w); y.ma200 = c.slice(-200).reduce((a, b) => a + b, 0) / 200; y.liveHistory = true; for (const k of ['perf', 'change52w', 'historyStale', 'datesApprox', 'r1m', 'r3m', 'r6m', 'r1y', 'vol', 'ytd', 'series']) delete y[k]; }
  delete y.bars; return y;
}
function integrity(y) { // outliers (>40% in a day without a split) and gaps
  delete y.outlier; delete y.gapDays; const b = barsOf(y); const splits = new Set((y.splits || []).map(s => s.date));
  for (let i = 1; i < b.length; i++) { const r = b[i][1] / b[i - 1][1] - 1; if (Math.abs(r) > 0.4 && !splits.has(b[i][0])) { y.outlier = b[i][0]; } }
  if (b.length >= 40) { const d0 = new Date(b[Math.max(0, b.length - 60)][0]), d1 = new Date(b[b.length - 1][0]); const cal = Math.round((d1 - d0) / 864e5) * 5 / 7, have = Math.min(60, b.length) - 1; if (cal > 0 && have < cal * 0.7) y.gapDays = Math.round(cal - have); }
  return y;
}

// hooks (set by server.mjs after construction): { store2, edgar, isy, validate } — series files, the two fundamentals slices that run
// inside the nightly full refresh (progress phases 'SEC EDGAR' and 'Is Yatirim financials') and the data-quality pass after every refresh.
export function createData({ db, put, log, inbox, coll, ist, config, issuePicks, checkAlarms, health: health2 }) {
  const progress = { running: false, mode: null, phase: '', done: 0, total: 0, startedAt: null, etaSec: null, note: '' }, hooks = {};
  const health = () => db.docs['status/health'] || { sources: {}, durations: {} };
  function mark(src, ok, msg, extra) { if (health2) return health2.mark(src, ok, msg, extra); const h = health(); h.sources = h.sources || {}; const s = h.sources[src] || { fails: 0 }; const now = new Date().toISOString(); if (ok) { s.lastOk = now; s.fails = 0; delete s.lastError; } else { s.lastFail = now; s.fails = (s.fails || 0) + 1; s.lastError = String(msg || '').slice(0, 160); if (s.fails === 2) inbox('warn', `${src} failed twice`, `${src} could not be reached twice in a row: ${s.lastError}. The app keeps the last data and retries on the next run.`, 'health'); } h.sources[src] = s; put('status/health', h); }
  const srcLabel = x => x.cls === 'TR_EQ' || x.cls === 'TR_ETF' || x.symbol === 'XU100' ? 'Yahoo Finance (BIST, ~15 min delayed)' : 'Yahoo Finance';
  function keepSeries(x, bars, splits, source) { if (!hooks.store2 || !bars || !bars.length) return; try { hooks.store2.writeSeries(x.symbol, { bars, splits, source }); } catch (e) { log('series file:', x.symbol, e.message); } }
  function durations(mode, secs) { const h = health(); h.durations = h.durations || {}; const a = h.durations[mode] || []; a.push(secs); h.durations[mode] = a.slice(-6); put('status/health', h); }
  function eta() { if (!progress.running || !progress.total) return null; const el = (Date.now() - new Date(progress.startedAt)) / 1000; if (progress.done < 3) { const h = health(); const d = (h.durations || {})[progress.mode] || []; return d.length ? Math.max(0, Math.round(d.reduce((a, b) => a + b, 0) / d.length - el)) : null; } return Math.round((progress.total - progress.done) * el / progress.done); }
  function setP(o) { Object.assign(progress, o); progress.etaSec = eta(); }
  function getProgress() { progress.etaSec = eta(); return { ...progress }; }
  const stamp = (y, source, kind, at) => { y.fetchedAt = new Date().toISOString(); y.source = source; y.priceSrc = kind; if (at) y.priceAt = at; delete y.fetchError; return y; };

  let running = null, failedLast = [];
  async function refresh(mode = 'quick', reason = 'schedule', only = null) {
    if (running) { if (only) { const cur = running; return cur.then(() => refresh(mode, reason, only)); } return running; } // a targeted fetch (new symbols) waits for the current run
    running = (async () => {
      const t0 = Date.now(), full = mode === 'full', startedAt = new Date().toISOString(), today = ist().date;
      put('status/refresh', { ...(db.docs['status/refresh'] || {}), state: 'running', kind: mode, mode, startedAt, requestedAt: startedAt, note: reason });
      let list = coll('instruments').map(([k, x]) => [k, x]); if (only) { const s = new Set(only); list = list.filter(([, x]) => s.has(x.symbol)); }
      const ya = list.filter(([, x]) => yahooSymbol(x)), tf = list.filter(([, x]) => x.cls === 'TEFAS' && (full || only || !x.navDate || x.navDate < today));
      const fails = [], okSet = new Set(); let firstErr = null;
      const needProfiles = full && !only ? coll('instruments').filter(([, x]) => (x.cls === 'US_EQ' || x.cls === 'TR_EQ') && (x.needsProfile || !x.profileAt || (Date.now() - new Date(x.profileAt)) / 864e5 > 35)).slice(0, config.profilesPerRun || 150) : [];
      const edgarPlan = full && !only && hooks.edgar ? hooks.edgar.plan(config.edgarPerRun || 120) : [], isyPlan = full && !only && hooks.isy ? hooks.isy.plan(config.isyPerRun || 150) : [];
      setP({ running: true, mode, phase: 'quotes', done: 0, total: ya.length + tf.length + (full ? ya.length : 0) + needProfiles.length + edgarPlan.length + isyPlan.length, startedAt, note: reason });
      // 1) batch quotes (price + fundamentals); fallbacks: spark, then per-symbol chart
      const bySym = new Map(ya.map(([k, x]) => [yahooSymbol(x), [k, x]])), symbols = [...bySym.keys()];
      let got = null;
      try { got = await yahooQuotes(symbols); mark('Yahoo quotes', true, null, { rows: got.size, partial: got.size < symbols.length * 0.9 }); } catch (e) { mark('Yahoo quotes', false, errMsg(e)); log('quotes failed, falling back to spark:', errMsg(e)); try { got = await yahooSpark(symbols); mark('Yahoo spark', true); } catch (e2) { mark('Yahoo spark', false, errMsg(e2)); got = new Map(); } }
      const missing = [];
      for (const [ys, [k, x]] of bySym) {
        const q = got.get(ys); if (!q || !(q.price > 0)) { missing.push([k, x]); continue; }
        const y = { ...(db.docs[k] || x) }; y.price = q.price; if (q.at) y.asOf = String(q.at).slice(0, 10);
        for (const f of ['pe', 'fpe', 'pb', 'divYield', 'mcap', 'hi52', 'lo52', 'avgVolume', 'volume', 'eps']) if (q[f] !== null && q[f] !== undefined) y[f] = q[f];
        if (q.name && (!y.name || y.name === y.symbol)) y.name = q.name;
        if (Array.isArray(y.closes) && y.closes.length && y.asOf) { const last = y.closes[y.closes.length - 1], hl = Array.isArray(y.hlv) && y.hlv.length === y.closes.length ? y.hlv : null; if (last[0] === y.asOf) { last[1] = q.price; if (hl && q.volume) hl[hl.length - 1][2] = q.volume; } else if (last[0] < y.asOf) { y.closes.push([y.asOf, q.price]); if (hl) hl.push([null, null, q.volume ?? null]); } }
        db.docs[k] = stamp(y, x.cls === 'TR_EQ' || x.cls === 'TR_ETF' || x.symbol === 'XU100' ? 'Yahoo Finance (BIST, ~15 min delayed)' : 'Yahoo Finance', q.pe !== undefined ? 'quote' : 'spark', q.at); okSet.add(x.symbol); setP({ done: progress.done + 1 });
      }
      // 2) per-symbol history (full) or chart fallback for what the batch missed
      // quick runs also give new or thin instruments a year of history (at most 150 a run, once a day each), so they need not wait for the nightly run
      const day0 = new Date().toISOString().slice(0, 10), mk = new Set(missing.map(m => m[0])), thin = full ? [] : ya.filter(([k, x]) => !mk.has(k) && barsOf(db.docs[k] || x).length < 60 && (db.docs[k] || x).histTriedAt !== day0).slice(0, 150);
      const queue = full ? ya.slice() : missing.concat(thin); let idx = 0;
      if (queue.length) setP({ phase: full ? 'history' : 'quotes (fallback)' });
      async function work() {
        while (idx < queue.length) {
          const [k, x] = queue[idx++];
          const want1y = full || barsOf(db.docs[k] || x).length < 60;
          try { const got = await yahooChart(yahooSymbol(x), want1y ? '1y' : '5d'); const y = { ...(db.docs[k] || x) }; if (!full && want1y) y.histTriedAt = day0;
            y.bars = full ? mergeBars([], got.bars) : mergeBars(barsOf(y), got.bars); if (got.splits && got.splits.length) y.splits = got.splits.slice(-5);
            if (got.price) y.price = got.price; if (got.name && (!y.name || y.name === y.symbol)) y.name = got.name; if (full || want1y) keepSeries(x, got.bars, got.splits, srcLabel(x)); derive(y); if (full) integrity(y);
            db.docs[k] = stamp(y, srcLabel(x), okSet.has(x.symbol) ? (db.docs[k].priceSrc || 'chart') : 'chart', got.at); okSet.add(x.symbol); }
          catch (e) { const why = errMsg(e); if (!okSet.has(x.symbol)) { fails.push(x.symbol); if (!firstErr) firstErr = `${x.symbol}: ${why}`; } db.docs[k] = { ...(db.docs[k] || x), fetchError: why.slice(0, 80), fetchErrorAt: new Date().toISOString() }; }
          setP({ done: progress.done + 1 }); await sleep(full ? 200 : 150);
        }
      }
      await Promise.all(Array.from({ length: config.concurrency || 4 }, work));
      if (queue.length) mark('Yahoo history', fails.length < Math.max(3, queue.length * 0.5), firstErr, { rows: queue.length - fails.length, partial: fails.length > 0 });
      // 2b) Deluxe: gram gold (TRY) = COMEX gold (USD/oz) × USD/TRY ÷ 31.1035, day by day
      try { const g = deriveGold(); if (g) { okSet.add('GAUTRY'); mark('Gold (derived)', true); } } catch (e) { log('gold:', errMsg(e)); }
      try { if (deriveSilver()) okSet.add('GAGTRY'); } catch (e) { log('silver:', errMsg(e)); }
      // 3) TEFAS
      if (tf.length) setP({ phase: 'TEFAS funds' });
      for (const [k, x] of tf) {
        try { const g = await tefasHistory(x.symbol, (full || !(db.docs[k] || x).liveHistory) ? 370 : 10); const y = { ...(db.docs[k] || x) };
          y.bars = mergeBars((full || !y.liveHistory) ? [] : barsOf(y), g.rows.map(r => [r[0], r[1], null, null, null])); y.price = g.price; if (g.size) y.fundSize = g.size; if (full) keepSeries(x, y.bars, [], 'TEFAS (daily NAV)'); derive(y); y.navDate = today;
          db.docs[k] = stamp(y, 'TEFAS (daily NAV)', 'tefas', null); okSet.add(x.symbol); mark('TEFAS', true); }
        catch (e) { const why = errMsg(e); fails.push(x.symbol); if (!firstErr) firstErr = `${x.symbol}: ${why}`; db.docs[k] = { ...(db.docs[k] || x), fetchError: why.slice(0, 80) }; mark('TEFAS', false, why); }
        setP({ done: progress.done + 1 }); await sleep(350);
      }
      db.rev++; put('status/refresh', db.docs['status/refresh']);
      // 4) profiles for new or old instruments (sector, ROE, margins) — a slice per full run
      if (full && !only) { const need = needProfiles;
        if (need.length) { setP({ phase: 'company profiles' }); let pf = 0;
          for (const [k, x] of need) { try { const p = await yahooProfile(yahooSymbol(x)); const y = { ...(db.docs[k] || x) }; if (p.sector) { y.sector = p.sector; y.industry = p.industry; } for (const f of ['roe', 'margin', 'grossMargin', 'beta', 'summary']) if (p[f] !== null && p[f] !== undefined) y[f] = p[f]; if (p.pb && !y.pb) y.pb = p.pb; y.profileAt = new Date().toISOString(); delete y.needsProfile; db.docs[k] = y; }
            catch (e) { pf++; db.docs[k] = { ...(db.docs[k] || x), profileAt: new Date().toISOString(), profileError: errMsg(e).slice(0, 80) }; } setP({ done: progress.done + 1 }); await sleep(400); }
          mark('Yahoo profiles', pf < need.length / 2, null, { rows: need.length - pf, partial: pf > 0 }); db.rev++; } }
      // 5) fundamentals slices: SEC EDGAR (US) and İş Yatırım (BIST) — the modules write facts rows, x.fund and calendar/reports
      let fundNote = '';
      if (edgarPlan.length) { setP({ phase: 'SEC EDGAR' }); try { const r = await hooks.edgar.runSlice({ reason, list: edgarPlan, onItem: () => setP({ done: progress.done + 1 }) }); fundNote += `; EDGAR ${r.ok} companies`; } catch (e) { log('edgar slice:', e.message); } }
      if (isyPlan.length) { setP({ phase: 'Is Yatirim financials' }); try { const r = await hooks.isy.runSlice({ reason, list: isyPlan, onItem: () => setP({ done: progress.done + 1 }) }); fundNote += `; Is Yatirim ${r.ok} companies`; } catch (e) { log('isyatirim slice:', e.message); } }
      let picksNote = '';
      if (full && !only) { try { picksNote = issuePicks(); } catch (e) { picksNote = 'picks failed: ' + e.message; log(e.stack); } }
      const secs = Math.round((Date.now() - t0) / 1000), finishedAt = new Date().toISOString(), ok = okSet.size;
      const note = `${ok} of ${ok + fails.length} instruments updated in ${secs}s${fails.length ? '; failed: ' + fails.slice(0, 12).join(', ') + (fails.length > 12 ? ' …' : '') : ''}${firstErr ? ' (first error ' + firstErr + ')' : ''}${fundNote}${picksNote ? '; ' + picksNote : ''}`;
      put('status/refresh', { state: ok ? 'done' : 'failed', kind: mode, mode, startedAt, finishedAt, note, secs, okCount: ok, failCount: fails.length });
      if (!only) durations(mode, secs);
      setP({ running: false, phase: 'done', note }); failedLast = fails.slice();
      if (!ok && !only) inbox('bad', 'Refresh failed', `No instrument could be updated (${reason}). ${firstErr ? 'First error: ' + firstErr + '. ' : ''}Check the internet connection, or whether a firewall or antivirus blocks Node.js; the app keeps the last prices. Details are in data/refresh.log.`, 'refresh');
      log(`${mode} refresh (${reason}): ${note}`);
      if (fails.length && !only) setTimeout(() => refresh(mode === 'full' ? 'full' : 'quick', 'retry of failed symbols', fails).catch(() => { }), 10 * 60000);
      try { checkAlarms(); } catch (e) { log('alarms:', e.message); }
      if (hooks.validate && !only) { try { await hooks.validate.run({ full, reason }); } catch (e) { log('validate:', e.message); } }
      updateHealth();
    })().finally(() => { running = null; });
    return running;
  }
  function deriveGold() { return deriveGram('instruments/GAUTRY', 'instruments/XAUUSD', 'Derived: COMEX gold (Yahoo GC=F) × USD/TRY ÷ 31.1035'); }
  function deriveSilver() { return deriveGram('instruments/GAGTRY', 'instruments/XAGUSD', 'Derived: COMEX silver (Yahoo SI=F) × USD/TRY ÷ 31.1035'); }
  function deriveGram(gk, xk, src) {
    const fk = 'instruments/USD_TRY', g0 = db.docs[gk], xa = db.docs[xk], fx = db.docs[fk];
    if (!g0 || !xa || !fx || !(xa.price > 0) || !(fx.price > 0)) return false;
    const OZ = 31.1035, fxC = Array.isArray(fx.closes) ? fx.closes : [], xaRows = barsOf(xa), fxBy = new Map(fxC.map(r => [r[0], r[1]]));
    // walk both series in date order so a day without a USD/TRY close uses the previous one
    const xaBy = new Map(xaRows.map(r => [r[0], r])), all = [...new Set([...xaRows.map(r => r[0]), ...fxC.map(r => r[0])])].sort(); let lastFx = null; const bars = [];
    for (const d of all) { const f0 = fxBy.get(d); if (f0 > 0) lastFx = f0; const r = xaBy.get(d); if (!r || !(lastFx > 0) || !(r[1] > 0)) continue;
      const k = lastFx / OZ; bars.push([d, r[1] * k, r[2] ? r[2] * k : null, r[3] ? r[3] * k : null, null]); }
    const y = { ...g0, price: xa.price * fx.price / OZ, asOf: [xa.asOf, fx.asOf].filter(Boolean).sort()[0] || null, bars: bars.slice(-262) };
    derive(y); db.docs[gk] = stamp(y, src, 'derived', null); return true;
  }
  function updateHealth() {
    if (health2) { try { return health2.update(); } catch (e) { log('health:', e.message); } }
    const h = health(), now = Date.now(), list = coll('instruments').map(([, x]) => x).filter(x => x.cls !== 'MACRO');
    const age = x => x.fetchedAt ? (now - new Date(x.fetchedAt)) / 36e5 : 999;
    h.instruments = { total: list.length, byClass: list.reduce((a, x) => { a[x.cls] = (a[x.cls] || 0) + 1; return a; }, {}), fresh: list.filter(x => age(x) < 24).length, stale: list.filter(x => age(x) >= 24).length, noHistory: list.filter(x => !(x.closes && x.closes.length >= 120)).length, errors: list.filter(x => x.fetchError).length, outliers: list.filter(x => x.outlier).length, noProfile: list.filter(x => (x.cls === 'US_EQ' || x.cls === 'TR_EQ') && !x.profileAt).length, noFundamentals: list.filter(x => (x.cls === 'US_EQ' || x.cls === 'TR_EQ') && !(x.pe > 0) && !(x.pb > 0)).length };
    h.updatedAt = new Date().toISOString(); put('status/health', h);
  }
  return { refresh, getProgress, mark, updateHealth, yahooSymbol, hooks, deriveGold, isRunning: () => !!running };
}
