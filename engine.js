/*<ENGINE>*/
/* GNC Terminal engine — pure functions shared by the page and the scheduled runs.
   No DOM access. All amounts in TRY unless noted; returns in percent unless noted. */
const ENGINE = (() => {
'use strict';
const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const sd = a => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }

const CLASSES = { US_EQ: 'US equity', US_ETF: 'US ETF', TR_EQ: 'BIST equity', TR_ETF: 'BIST BYF', TEFAS: 'TEFAS fund', CMDTY: 'Commodity', CRYPTO: 'Crypto', MACRO: 'Macro' };
const GOLD = [], BOND = []; // US ETFs and gold are no longer in the universe (kept for data-file compatibility)
const ETF_BETA = { SPY: 1, VTI: 1, QQQ: 1.15, IWM: 1.2, SCHD: 0.8, VXUS: 0.85, GLD: 0.1, IAU: 0.1, TLT: -0.1, BND: 0.05 };
const ETF_SECTOR = { SPY: 'US equity index', VTI: 'US equity index', QQQ: 'US equity index', IWM: 'US equity index', SCHD: 'US equity index', VXUS: 'International equity index', GLD: 'Gold', IAU: 'Gold', TLT: 'Bonds', BND: 'Bonds' };
const AK_TIERS = [[500000, 2], [1000000, 1.9], [2500000, 1.85], [5000000, 1.8], [7500000, 1.75], [12500000, 1.6], [20000000, 1.4], [Infinity, 1.2]];
const HORIZONS = [['1w', '1 week', 7 / 365], ['2w', '2 weeks', 14 / 365], ['3w', '3 weeks', 21 / 365], ['1m', '1 month', 1 / 12], ['2m', '2 months', 2 / 12], ['3m', '3 months', 0.25], ['6m', '6 months', 0.5], ['9m', '9 months', 0.75], ['12m', '12 months', 1]];
const SCEN_HORIZONS = [['1 week', 7 / 365], ['2 weeks', 14 / 365], ['3 weeks', 21 / 365], ['1 month', 1 / 12], ['2 months', 2 / 12], ['3 months', 0.25], ['6 months', 0.5], ['9 months', 0.75], ['1 year', 1]];
const GROUPS = [['trend', 'Trend and 52-week high'], ['mom', 'Momentum'], ['rev', 'Short-term'], ['risk', 'Low volatility and calm'], ['value', 'Value'], ['quality', 'Quality'], ['liq', 'Liquidity'], ['cost', 'Cost and tax'], ['fx', 'Currency'], ['edge', 'Expected edge']];
const PRESETS = {
  balanced: { label: 'Balanced (evidence weights)', w: { trend: 12, mom: 25, rev: 3, risk: 15, value: 15, quality: 10, liq: 5, cost: 5, fx: 0, edge: 10 } },
  taxcore: { label: 'Tax-efficient TRY core', w: { trend: 8, mom: 12, rev: 0, risk: 20, value: 12, quality: 8, liq: 8, cost: 22, fx: 0, edge: 10 } },
  momentum: { label: 'Momentum', w: { trend: 20, mom: 35, rev: 3, risk: 8, value: 4, quality: 5, liq: 8, cost: 5, fx: 0, edge: 12 } },
  value: { label: 'Value and quality', w: { trend: 5, mom: 8, rev: 3, risk: 12, value: 30, quality: 20, liq: 7, cost: 5, fx: 0, edge: 10 } },
  trader: { label: 'Short-term trader', w: { trend: 15, mom: 15, rev: 30, risk: 8, value: 0, quality: 0, liq: 15, cost: 5, fx: 0, edge: 12 } },
  lowrisk: { label: 'Low risk', w: { trend: 5, mom: 8, rev: 0, risk: 35, value: 10, quality: 12, liq: 10, cost: 12, fx: 0, edge: 8 } }
};
const DEFAULT_SETTINGS = {
  preset: 'balanced', tlRate: 34, mmTax: 17.5, taxTrEq: 0, taxTefas: 17.5, divTaxTr: 15, usMarginal: 27, ufe: 24, usdView: 18,
  rfUsd: 4, expGold: 3, expCmdty: 2.5, expCrypto: 0, // crypto: no fundamental expectation in USD — the trend signal and the volatility carry the forecast
   cmdtyExp: {}, // commodities: long-run USD expectation a year (≈ US inflation; front-month futures, roll yield not modelled)
  erpTr: 9, erpAsOf: 'Damodaran Jan 2026: mature-market premium 4.6 + half of the Turkiye country risk premium', erpUs: 4.6, expBond: 4, expVol: 35, fxVol: 8,
  volTarget: 20, volTargetUsd: 15, stopAtr: 2.5, trailAtr: 3, capStock: 10, capFund: 40, capSector: 25, capBig: 40,
  gateTurnoverTRY: 0, liqWarnTRY: 50e6, gateTurnoverUSD: 20e6, gateStaleDays: 2, gateMinHist: 120, lang: 'en',
  uniUS: true, uniBist100: true, uniBistAll: true, uniByf: true, uniTefas: true,
  benchmark: 'deposit', principal: 'TRY', depRate: 42.74, depRateAsOf: '2026-10-16', depRoll: 32, depTax6m: 17.5, depTax1y: 15, depTaxLong: 10, usdDepRate: 2.73, usdDepTax: 25, depManual: false,
  stageTranches: 1, stageWeeks: 2,
  dynDeposit: true, surveyFx: true, ewmaVol: true, horizonWeights: true, // v4 forecast switches: deposit path toward the survey policy rate, survey USD/TRY, EWMA volatility blend, horizon-dependent factor weights
  bsmv: 5, bistFee: 2.5, usComm: 1.5, fxSpread: 0.5, fundComm: 0,
  monthly: 2500, years: 10, corePct: 70, usdPct: 0, cashTRY: 0, cashUSD: 0, cashAsOf: null, setupDone: false,
  triggers: { quick: null, full: null }
};

/* ---------- series statistics ---------- */
function closesOf(x) {
  if (Array.isArray(x.closes) && x.closes.length) return x.closes.map(r => +r[1]).filter(v => v > 0);
  if (Array.isArray(x.bars) && x.bars.length) return x.bars.map(r => +r[1]).filter(v => v > 0);
  if (Array.isArray(x.series)) return x.series.filter(v => v > 0);
  return [];
}
function barsOf(x) { // aligned arrays from x.bars = [[date, close, high, low, volume], ...]; falls back to closes
  const hl = Array.isArray(x.hlv) && Array.isArray(x.closes) && x.hlv.length === x.closes.length ? x.hlv : null;
  const b = Array.isArray(x.bars) && x.bars.length ? x.bars : (Array.isArray(x.closes) ? x.closes.map((r, i) => hl ? [r[0], r[1], hl[i][0], hl[i][1], hl[i][2]] : [r[0], r[1], null, null, null]) : []);
  const d = [], c = [], h = [], l = [], v = []; for (const r of b) { if (!(+r[1] > 0)) continue; d.push(r[0]); c.push(+r[1]); h.push(+r[2] > 0 ? +r[2] : null); l.push(+r[3] > 0 ? +r[3] : null); v.push(r[4] != null && +r[4] > 0 ? +r[4] : null); }
  return { d, c, h, l, v };
}
function seriesStats(c, bars) {
  const n = c.length, o = { n };
  if (n < 2) return o;
  // 12-1 and 6-1 momentum (Jegadeesh-Titman convention: skip the latest month), 200-day average, ATR(22), turnover, Amihud
  const at = k => n > k ? c[n - 1 - k] : null;
  o.mom121 = n >= 230 ? (at(21) / c[Math.max(0, n - 253)] - 1) * 100 : null; o.mom61 = n >= 130 ? (at(21) / at(126) - 1) * 100 : null;
  if (n >= 200) o.ma200 = mean(c.slice(-200));
  if (bars && bars.h && bars.h.length === n) { const tr = []; for (let i = Math.max(1, n - 22); i < n; i++) { const h = bars.h[i] ?? c[i], l = bars.l[i] ?? c[i]; tr.push(Math.max(h - l, Math.abs(h - c[i - 1]), Math.abs(l - c[i - 1]))); } if (tr.length >= 10) o.atr = mean(tr);
    const vv = bars.v.slice(-30), cc = c.slice(-30); const to = []; for (let i = 0; i < vv.length; i++) if (vv[i] !== null && vv[i] !== undefined) to.push(vv[i] * cc[i]); if (to.length >= 10) o.turnover = mean(to);
    const am = []; for (let i = Math.max(1, n - 21); i < n; i++) { const t = (bars.v[i] || 0) * c[i]; if (t > 0) am.push(Math.abs(c[i] / c[i - 1] - 1) / t); } if (am.length >= 10) o.amihud = mean(am) * 1e9; }
  if (o.atr === undefined) { const tr = []; for (let i = Math.max(1, n - 22); i < n; i++) tr.push(Math.abs(c[i] - c[i - 1])); if (tr.length >= 10) o.atr = mean(tr) * 1.4; o.atrApprox = true; }
  const last = c[n - 1], ret = k => n > k ? (last / c[n - 1 - k] - 1) * 100 : null;
  o.r1d = ret(1); o.r1w = ret(5); o.r2w = ret(10); o.r1m = ret(21); o.r3m = ret(63); o.r6m = ret(126); o.r1y = ret(250);
  const lr = []; let jump = false;
  for (let i = 1; i < n; i++) { const r = Math.log(c[i] / c[i - 1]); if (Math.abs(r) > 0.3) jump = true; lr.push(r); }
  o.jump = jump;
  if (lr.length >= 15) {
    o.vol = sd(lr) * Math.sqrt(252) * 100;
    const neg = lr.filter(r => r < 0); o.dvol = neg.length > 3 ? Math.sqrt(neg.reduce((s, r) => s + r * r, 0) / neg.length) * Math.sqrt(252) * 100 : null;
  }
  let peak = c[0], mdd = 0; for (const v of c) { peak = Math.max(peak, v); mdd = Math.max(mdd, 1 - v / peak); } o.mdd = mdd * 100;
  if (n >= 20) o.ma20 = mean(c.slice(-20));
  if (n >= 50) o.ma50 = mean(c.slice(-50));
  if (n >= 15) { let g = 0, l = 0; for (let i = n - 14; i < n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; } o.rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
  o.hiS = Math.max(...c); o.loS = Math.min(...c);
  // scoring v3 signals (see scoreAll): nearness to the 52-week high (George-Hwang), largest one-day jump in the last week (lottery / MAX effect, Bali-Cakici-Whitelaw), abnormal volume
  if (n >= 120) { let mx = 0; for (let i = Math.max(0, n - 252); i < n; i++) mx = Math.max(mx, c[i]); o.hi252p = c[n - 1] / mx; }
  if (n >= 6) { let m = -1; for (let i = n - 5; i < n; i++) m = Math.max(m, Math.log(c[i] / c[i - 1])); o.maxDay5 = m * 100; }
  if (bars && bars.v && bars.v.length === n && n >= 70) { const v5 = bars.v.slice(-5).filter(v => v > 0), v60 = bars.v.slice(-65, -5).filter(v => v > 0).sort((p, q) => p - q); if (v5.length >= 3 && v60.length >= 30) o.abvol = Math.log(mean(v5) / v60[Math.floor(v60.length / 2)]); }
  return o;
}
function liqTier(x) {
  if (x.ccy === 'USD') return x.cls === 'US_ETF' ? 0.01 : 0.02;
  if (x.cls === 'TEFAS') return 0;
  const m = num(x.mcap); if (m === null) return x.cls === 'TR_ETF' ? 0.15 : 0.25;
  return m > 200e9 ? 0.03 : m > 50e9 ? 0.06 : m > 10e9 ? 0.12 : m > 2e9 ? 0.25 : 0.5;
}

function bizDays(a, b) { // weekdays strictly after a, up to and including b
  let d = new Date(a + 'T12:00:00Z'); const end = new Date(b + 'T12:00:00Z'); let n = 0; while (d < end) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n++; if (n > 60) break; } return n; }
/* ---------- gatekeeping: is the instrument fit for picks, baskets and the wizard? ---------- */
function gate(x, e, S, M) {
  const why = [], detail = [], warn = [], big = v => v >= 1e9 ? (v / 1e9).toFixed(2) + ' bn' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' m' : v >= 1e3 ? (v / 1e3).toFixed(0) + ' k' : String(Math.round(v));
  if (x.cls === 'MACRO') return { ok: false, why: ['index'], detail: ['Indices and FX are references, not investable lines.'] };
  if (e.price === null) { why.push('no price'); detail.push('No price has been fetched yet.'); }
  const asOf = x.priceAt || x.asOf; if (asOf && M && M.today) { const d = bizDays(String(asOf).slice(0, 10), M.today); if (d > (S.gateStaleDays ?? 2)) { why.push('stale price'); detail.push(`Last price is ${d} trading days old — the gate allows ${S.gateStaleDays ?? 2}.`); } }
  if (x.cls === 'TR_EQ' || x.cls === 'US_EQ' || x.cls === 'TR_ETF') {
    if (e.n < (S.gateMinHist ?? 120) && !e.isProxy) { why.push('short history'); detail.push(`${e.n} daily closes stored — at least ${S.gateMinHist ?? 120} are needed.`); }
    const thr0 = x.ccy === 'USD' ? (S.gateTurnoverUSD ?? 20e6) : (S.gateTurnoverTRY ?? 50e6), thr = x.cls === 'TR_ETF' ? thr0 / 10 : thr0;
    if (e.turnover > 0 && e.turnover < thr) { why.push('illiquid'); detail.push(`30-day turnover ${big(e.turnover)} ${x.ccy} — below the ${big(thr)} ${x.ccy} gate.`); }
    // Deluxe: BIST shares below the warning level stay eligible and carry a "low liquidity" mark instead of being excluded
    const wl = x.ccy === 'TRY' ? (S.liqWarnTRY ?? 50e6) / (x.cls === 'TR_ETF' ? 10 : 1) : 0;
    if (wl && e.turnover > 0 && e.turnover < wl && !why.includes('illiquid')) { warn.push('low liquidity'); detail.push(`Low liquidity: 30-day turnover ${big(e.turnover)} TRY, below ${big(wl)} TRY — orders may fill at worse prices.`); }
    if (e.amihudWorst) { if (x.ccy === 'TRY' && !(S.gateTurnoverTRY > 0)) { if (!warn.includes('low liquidity')) warn.push('low liquidity'); detail.push('Amihud price impact is in the worst fifth of its exchange.'); } else { why.push('price impact'); detail.push('Amihud price impact is in the worst fifth of its exchange.'); } }
    if (x.watchMarket || x.pdp) { why.push('watch market'); detail.push('Trades in the watch market (PDP / Yakın İzleme).'); }
  }
  if (x.outlier) { why.push('outlier'); detail.push(`A daily move above 40% without a split on ${x.outlier}.`); }
  if ((e.jump && !(x.cls === 'CMDTY' || x.derived)) || x.splitSuspect) { why.push('split?'); detail.push('A jump in the series looks like an unadjusted split; checked at the next full refresh.'); }
  if (x.dq && x.dq.unverified) { why.push('unverified'); detail.push(`Yahoo and İş Yatırım closes differed by more than 1% on ${x.dq.unverified}.`); }
  return { ok: !why.length, why, detail, warn, lowLiq: warn.includes('low liquidity') };
}

/* ---------- technical indicators (v2.12): fixed standard settings, the same rules as research/indicator-backtest.mjs ----------
   bars: { d, c, h, l, v } aligned. Returns current values and the signals that fired in the last 21 trading days (latest first). */
function indicators(bars, look = 21) { // look > 21: every signal of the last `look` days (for a chart), not only the latest of each kind
  const d = bars.d, c = bars.c, n = c.length; if (n < 60) return null;
  const hasHL = bars.h.filter(x => x).length > n * 0.8, H = c.map((x, i) => hasHL && bars.h[i] ? bars.h[i] : x), L = c.map((x, i) => hasHL && bars.l[i] ? bars.l[i] : x), V = bars.v.map(x => x || 0), hasV = V.filter(x => x > 0).length > n * 0.8;
  const ema = (a, k) => { const m = 2 / (k + 1), o = []; let e = null; for (const x of a) { e = e === null ? x : x * m + e * (1 - m); o.push(e); } return o; };
  const wil = (a, k) => { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { if (i < k) { s += a[i]; if (i === k - 1) o[i] = s / k; continue; } o[i] = (o[i - 1] * (k - 1) + a[i]) / k; } return o; };
  const sma = (a, k) => { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= k) s -= a[i - k]; if (i >= k - 1) o[i] = s / k; } return o; };
  const rsiK = k => { const g = [0], l = [0]; for (let i = 1; i < n; i++) { const x = c[i] - c[i - 1]; g.push(Math.max(x, 0)); l.push(Math.max(-x, 0)); } const G = wil(g, k), Ls = wil(l, k); return G.map((x, i) => x === null ? null : Ls[i] === 0 ? 100 : 100 - 100 / (1 + x / Ls[i])); };
  const from = Math.max(0, n - look - 3), roll = (a, k, f) => a.map((_, i) => i < k - 1 || i < from ? null : f(a.slice(i - k + 1, i + 1))); // only the last days are needed
  const r14 = rsiK(14), r2 = rsiK(2), e12 = ema(c, 12), e26 = ema(c, 26), mac = e12.map((x, i) => x - e26[i]), sig = ema(mac, 9);
  const m20 = sma(c, 20), m50 = sma(c, 50), m200 = sma(c, 200), sdv = c.map((_, i) => { if (i < 19) return null; const w = c.slice(i - 19, i + 1), m = w.reduce((a, b) => a + b, 0) / 20; return Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / 19); });
  const ub = m20.map((m, i) => m === null ? null : m + 2 * sdv[i]), lb = m20.map((m, i) => m === null ? null : m - 2 * sdv[i]), bw = m20.map((m, i) => m === null ? null : 4 * sdv[i] / m), bwLo = roll(bw.map(x => x ?? 9), 126, w => Math.min(...w));
  const hh = H.map((_, i) => i < 13 ? null : Math.max(...H.slice(i - 13, i + 1))), ll = L.map((_, i) => i < 13 ? null : Math.min(...L.slice(i - 13, i + 1))), K = c.map((x, i) => hh[i] === null || hh[i] === ll[i] ? 50 : 100 * (x - ll[i]) / (hh[i] - ll[i])), Ks = sma(K, 3).map(x => x ?? 50), Ds = sma(Ks, 3).map(x => x ?? 50);
  const tr = [0], pdm = [0], mdm = [0]; for (let i = 1; i < n; i++) { tr.push(Math.max(H[i] - L[i], Math.abs(H[i] - c[i - 1]), Math.abs(L[i] - c[i - 1]))); const up = H[i] - H[i - 1], dn = L[i - 1] - L[i]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); }
  const ATR = wil(tr, 14), PD = wil(pdm, 14), MD = wil(mdm, 14), pdi = PD.map((x, i) => x === null || !ATR[i] ? null : 100 * x / ATR[i]), mdi = MD.map((x, i) => x === null || !ATR[i] ? null : 100 * x / ATR[i]);
  const dx = pdi.map((p, i) => p === null || p + mdi[i] === 0 ? 0 : 100 * Math.abs(p - mdi[i]) / (p + mdi[i])), ADX = wil(dx.map((x, i) => i < 14 ? 0 : x), 14);
  const obv = [0]; for (let i = 1; i < n; i++) obv.push(obv[i - 1] + (c[i] > c[i - 1] ? V[i] : c[i] < c[i - 1] ? -V[i] : 0));
  const k252 = Math.min(252, n), hi252 = roll(c, k252, w => Math.max(...w)), lo252 = roll(c, k252, w => Math.min(...w)), hi60 = roll(c, 60, w => Math.max(...w)), lo20 = roll(c, 20, w => Math.min(...w)), ohi60 = roll(obv, 60, w => Math.max(...w)), v60 = sma(V, 60);
  const out = []; const seen = new Set(), fire = (k, i) => { if (look > 21 || !seen.has(k)) { seen.add(k); out.push([k, d[i]]); } };
  for (let i = n - 1; i >= Math.max(look > 21 ? 61 : 201, n - look); i--) { const up = m200[i] !== null && c[i] > m200[i], r1 = Math.log(c[i] / c[i - 1]);
    if (r14[i] < 30 && r14[i - 1] >= 30) { fire('rsi_lt30', i); if (m200[i] !== null) fire(up ? 'rsi_lt30_up' : 'rsi_lt30_dn', i); }
    if (r14[i] > 70 && r14[i - 1] <= 70) { fire('rsi_gt70', i); if (m200[i] !== null) fire(up ? 'rsi_gt70_up' : 'rsi_gt70_dn', i); }
    if (r2[i] < 10 && up) fire('rsi2_lt10_up', i); if (r2[i] > 90 && m200[i] !== null && !up) fire('rsi2_gt90_dn', i);
    if (mac[i] > sig[i] && mac[i - 1] <= sig[i - 1]) { fire('macd_up', i); fire(mac[i] < 0 ? 'macd_up_neg' : 'macd_up_pos', i); } if (mac[i] < sig[i] && mac[i - 1] >= sig[i - 1]) fire('macd_dn', i);
    if (lb[i] !== null && c[i] < lb[i] && c[i - 1] >= lb[i - 1]) { fire('bb_lo', i); if (up) fire('bb_lo_up', i); } if (ub[i] !== null && c[i] > ub[i] && c[i - 1] <= ub[i - 1]) fire('bb_hi', i);
    if (bw[i] !== null && bwLo[i] !== null && bw[i] <= bwLo[i] * 1.05) { if (c[i] > ub[i]) fire('sq_up', i); if (c[i] < lb[i]) fire('sq_dn', i); }
    if (hasHL) { if (Ks[i] > Ds[i] && Ks[i - 1] <= Ds[i - 1] && Ks[i] < 20) fire('st_buy', i); if (Ks[i] < Ds[i] && Ks[i - 1] >= Ds[i - 1] && Ks[i] > 80) fire('st_sell', i); if (ADX[i] > 25 && ADX[i - 1] <= 25) fire(pdi[i] > mdi[i] ? 'adx_up' : 'adx_dn', i); }
    if (hi60[i] !== null && c[i] >= hi60[i] && c[i - 1] < hi60[i - 1]) fire(hasV && obv[i] >= ohi60[i] ? 'brk_obv' : 'brk_noobv', i);
    if (hasV && ohi60[i] !== null && obv[i] >= ohi60[i] && obv[i - 1] < ohi60[i - 1] && c[i] < hi60[i] * 0.95) fire('obv_div', i);
    if (m200[i - 1] !== null) { if (m50[i] > m200[i] && m50[i - 1] <= m200[i - 1]) fire('golden', i); if (m50[i] < m200[i] && m50[i - 1] >= m200[i - 1]) fire('death', i);
    if (c[i] > m200[i] && c[i - 1] <= m200[i - 1]) fire('ma200_up', i); if (c[i] < m200[i] && c[i - 1] >= m200[i - 1]) fire('ma200_dn', i); }
    if (n >= 252 && c[i] >= hi252[i] && c[i - 1] < hi252[i - 1]) fire('hi52', i); if (n >= 252 && c[i] <= lo252[i] && c[i - 1] > lo252[i - 1]) fire('lo52', i);
    if (lo20[i - 1] !== null && m200[i] !== null && c[i] < lo20[i - 1] && !up && c[i] < lo252[i] * 1.05) fire('knife', i);
    const vr = hasV && v60[i - 5] ? V[i] / v60[i - 5] : null; if (vr > 3 && r1 > 0.03) fire('vol_up', i); if (vr > 3 && r1 < -0.03) fire('vol_dn', i);
    if (r1 > 0.09) fire('lim_up', i); if (r1 < -0.09) fire('lim_dn', i); if (r1 < -0.07 && up && c[i] > hi252[i] * 0.85) fire('trend_drop', i);
    const o = bars.o ? bars.o[i] : null; if (o && o > c[i - 1] * 1.03) fire('gap_up', i);
    if (i >= 22) { const a = Math.log(c[i] / c[i - 21]), b = Math.log(c[i - 1] / c[i - 22]); if (a < -0.25 && b >= -0.25) fire('m_dn25', i); if (a > 0.35 && b <= 0.35) fire('m_up35', i); } }
  // support and resistance: swing lows / highs of the last year (5 days either side), nearest below and above the price
  const px = c[n - 1], piv = [], k0 = Math.max(5, n - 252); for (let i = k0; i < n - 5; i++) { const w = c.slice(i - 5, i + 6); if (c[i] === Math.min(...w)) piv.push(['s', L[i]]); if (c[i] === Math.max(...w)) piv.push(['r', H[i]]); }
  const sup = piv.filter(p => p[1] < px * 0.995).map(p => p[1]).sort((a, b) => b - a)[0] ?? null, res = piv.filter(p => p[1] > px * 1.005).map(p => p[1]).sort((a, b) => a - b)[0] ?? null;
  const R = (x, k = 2) => x === null || x === undefined || !isFinite(x) ? null : +x.toFixed(k), z = n - 1, obv20 = hasV ? obv[z] - obv[Math.max(0, z - 20)] : null;
  return { d: d[z], hl: hasHL, vol: hasV, rsi: R(r14[z], 1), rsi2: R(r2[z], 1), macd: [R(mac[z], 4), R(sig[z], 4), R(mac[z] - sig[z], 4)], bb: [R(m20[z], 4), R(ub[z], 4), R(lb[z], 4), R(ub[z] > lb[z] ? (px - lb[z]) / (ub[z] - lb[z]) : null, 2), R(bw[z], 4), R(bwLo[z] ? bw[z] / bwLo[z] : null, 2)],
    st: hasHL ? [R(Ks[z], 1), R(Ds[z], 1)] : null, adx: hasHL ? [R(ADX[z], 1), R(pdi[z], 1), R(mdi[z], 1)] : null, obv: hasV ? Math.sign(obv20) : null, ma: [R(m20[z], 4), R(m50[z], 4), R(m200[z], 4)], sr: [R(sup, 4), R(res, 4)], sig: out };
}
const IND_CACHE = new Map(); // symbol → indicators for the same last bar (a rescore does not recompute them)
function indCached(sym, bars) { const n = bars.c.length, k = bars.d[n - 1] + '|' + n + '|' + bars.c[n - 1] + '|' + (bars.h[n - 1] || '') + '|' + (bars.v[n - 1] || ''), o = IND_CACHE.get(sym); if (o && o.k === k) return o.v; let v = null; try { v = indicators(bars); } catch (e) { v = null; } IND_CACHE.set(sym, { k, v }); return v; }
/* ---------- enrich: one effective view of every instrument ---------- */
function enrich(inst, S, M) {
  const out = {};
  for (const x of Object.values(inst)) {
    const bars = barsOf(x), c = bars.c.length ? bars.c : closesOf(x), st0 = seriesStats(c, bars), p = x.perf || {}, flags = [];
    const st = x.historyStale ? { n: st0.n, vol: st0.vol, dvol: st0.dvol, mdd: st0.mdd, jump: st0.jump, atr: st0.atr, turnover: st0.turnover, amihud: st0.amihud } : st0;
    if (x.historyStale && x.cls !== 'MACRO') flags.push('stale history');
    const e = { price: num(x.price) ?? (c.length ? c[c.length - 1] : null) };
    e.r1w = st.r1w ?? num(p.w1); e.r2w = st.r2w; e.r1m = st.r1m ?? num(p.m1) ?? num(x.r1m);
    e.r3m = num(p.m3) ?? st.r3m ?? num(x.r3m); e.r6m = num(p.m6) ?? st.r6m ?? num(x.r6m); e.r1y = num(p.y1) ?? num(x.change52w) ?? st.r1y ?? num(x.r1y); e.ytd = num(p.ytd) ?? num(x.ytd);
    e.r3mEst = false;
    if ((e.r3m === null || e.r3m === undefined) && e.r1m !== null && e.r1m !== undefined && e.r6m !== null && e.r6m !== undefined) { const a1 = 1 + e.r1m / 100, a6 = 1 + e.r6m / 100; if (a1 > 0 && a6 > 0) { e.r3m = (a1 * Math.pow(a6 / a1, 2 / 5) - 1) * 100; e.r3mEst = true; } }
    e.vol = st.vol ?? num(x.vol); e.dvol = st.dvol; e.mdd = st.mdd; e.rsi = st.rsi ?? num(x.rsi); e.ma20 = st.ma20; e.ma50 = num(x.ma50) ?? st.ma50; e.ma200 = st.ma200 ?? num(x.ma200);
    e.mom121 = st.mom121 ?? null; e.mom61 = st.mom61 ?? null; e.atr = st.atr ?? null; e.atrApprox = !!st.atrApprox; e.turnover = st.turnover ?? (num(x.avgVolume) && num(x.price) ? x.avgVolume * x.price : null); e.amihud = st.amihud ?? null; e.hi252p = st.hi252p ?? null; e.r1d = st.r1d ?? null; e.maxDay5 = st.maxDay5 ?? null; e.abvol = st.abvol ?? null;
    e.pb = num(x.pb) > 0 && num(x.pb) < 100 ? x.pb : null; e.roe = num(x.roe); e.margin = num(x.margin);
    const F = x.fund || null; if (F) { if (e.roe === null && num(F.roe) !== null) e.roe = F.roe; if (e.margin === null && num(F.margin) !== null) e.margin = F.margin; if (!(num(x.pb) > 0) && num(F.bvps) > 0 && num(x.price) > 0) e.pb = x.price / F.bvps; e.fundSrc = F.src; e.revGrowth = num(F.revGrowth); } e.above200 = e.ma200 && e.price ? e.price > e.ma200 : null; e.ind = bars.c.length >= 60 && x.cls !== 'TEFAS' ? indCached(x.symbol, bars) : ((x.e && x.e.ind) || null);
    e.hi52 = num(x.hi52) ?? st.hiS ?? null; e.lo52 = num(x.lo52) ?? null; e.n = st.n || 0;
    let beta = num(x.beta); if (beta === null || beta < -0.5 || beta > 3) beta = null;
    if (beta === null) beta = ETF_BETA[x.symbol] ?? (x.cls === 'TEFAS' ? (x.hy ? 1 : 0) : 1);
    e.beta = beta;
    e.pe = num(x.pe) > 0 && num(x.pe) < 200 ? x.pe : null; if (e.pe === null && F && num(F.epsTTM) > 0 && num(x.price) > 0 && x.price / F.epsTTM < 200) e.pe = x.price / F.epsTTM; e.ey = e.pe ? 100 / e.pe : null; e.div = num(x.divYield); e.mcap = num(x.mcap);
    e.sector = x.sector || ETF_SECTOR[x.symbol] || (x.cls === 'TEFAS' || x.cls === 'TR_ETF' ? 'BIST equity index' : 'Unclassified');
    // proxy for index funds without own data
    e.isProxy = false;
    if ((e.r1m === null && e.r3m === null) && x.proxy && inst[x.proxy]) {
      const px = inst[x.proxy], pc = closesOf(px), ps = seriesStats(pc), f = +x.fee || 0, adj = (r, m) => r === null || r === undefined ? null : r - f * m / 12;
      e.r1w = adj(ps.r1w, 0.25); e.r2w = adj(ps.r2w, 0.5); e.r1m = adj(ps.r1m ?? num(px.r1m), 1); e.r3m = adj(num(px.perf?.m3) ?? ps.r3m ?? num(px.r3m), 3);
      e.r6m = adj(num(px.perf?.m6) ?? ps.r6m ?? num(px.r6m), 6); e.r1y = adj(num(px.perf?.y1) ?? ps.r1y ?? num(px.r1y), 12);
      e.vol = ps.vol ?? num(px.vol); e.rsi = ps.rsi; e.ma20 = ps.ma20; e.ma50 = ps.ma50; e.mdd = ps.mdd;
      if (num(px.hi52) && num(px.price)) e.ddProxy = (1 - px.price / px.hi52) * 100;
      e.isProxy = true; flags.push('proxy');
    }
    if (x.cls !== 'MACRO') {
      if (e.n > 0 && e.n < 40 && !e.isProxy) flags.push('short history');
      const noSplit = x.cls === 'CMDTY' || x.cls === 'CRYPTO' || x.derived; // commodities have no splits: big days are real moves or contract rolls
      if ((st.jump && !noSplit) || x.splitSuspect) flags.push('split?');
      if (x.asOf && M && M.today) { const d = (new Date(M.today) - new Date(x.asOf)) / 864e5; if (d > 7) flags.push('stale'); }
      if (e.price === null) flags.push('no price');
      if (!e.isProxy && [e.r1m, e.r3m, e.r6m, e.r1y].filter(v => v !== null && v !== undefined && !(v === e.r3m && e.r3mEst)).length < 2) flags.push('thin data');
    }
    e.flags = flags; e.spread = liqTier(x);
    e.gate = gate(x, e, S, M);
    e.dd = e.ddProxy ?? ((e.hi52 && e.price) ? (1 - e.price / e.hi52) * 100 : null);
    const floor = BOND.includes(x.symbol) ? 6 : GOLD.includes(x.symbol) ? 12 : (x.cls === 'TEFAS' && !x.hy) ? 2 : (x.cls === 'TR_EQ' ? 20 : x.cls === 'US_EQ' ? 15 : x.cls === 'CMDTY' ? 15 : x.cls === 'CRYPTO' ? 40 : 12);
    e.volLR = e.vol ?? null; e.volEwma = null;
    if (S.ewmaVol !== false && !e.isProxy && c.length >= 60 && e.vol) { e.volEwma = ewmaVol(c.slice(-260)); }
    e.volUsed = Math.max(floor, e.volEwma ? 0.5 * e.volEwma + 0.5 * e.vol : (e.vol ?? S.expVol));
    if (x.ccy === 'USD') e.volUsed = Math.sqrt(e.volUsed ** 2 + S.fxVol ** 2);
    out[x.symbol] = { ...x, e };
  }
  for (const ccy of ['TRY', 'USD']) { const g = Object.values(out).filter(y => y.ccy === ccy && (y.cls === 'TR_EQ' || y.cls === 'US_EQ') && y.e.amihud !== null && y.e.amihud !== undefined); if (g.length >= 20) { const v = g.map(y => y.e.amihud).sort((a, b) => a - b), cut = v[Math.floor(v.length * 0.8)]; for (const y of g) if (y.e.amihud > cut) { y.e.amihudWorst = true; y.e.gate = gate(y, y.e, S, M); } } }
  // residual (index-adjusted) statistics for equities: beta, idiosyncratic volatility and residual 12-1 momentum (Blitz-Huij-Martens) over the last year, plus the 1-month return over the index
  for (const [ccy, ix] of [['TRY', 'XU100'], ['USD', 'SPX']]) { const I = inst[ix]; if (!I) continue; const ib = barsOf(I), im = new Map(ib.d.map((d, i) => [d, ib.c[i]]));
    for (const y of Object.values(out)) { if (y.ccy !== ccy || (y.cls !== 'TR_EQ' && y.cls !== 'US_EQ')) continue; const b = barsOf(y), n = b.c.length; if (n < 200) continue;
      const lr = [], xr = []; for (let i = Math.max(1, n - 252); i < n; i++) { const a = im.get(b.d[i - 1]), z = im.get(b.d[i]); if (!(a > 0 && z > 0)) continue; const r = Math.log(b.c[i] / b.c[i - 1]); if (Math.abs(r) > 0.45) continue; lr.push(r); xr.push(Math.log(z / a)); }
      if (lr.length < 150) continue; const mx = mean(xr), my = mean(lr); let cv = 0, vx = 0; for (let t = 0; t < lr.length; t++) { cv += (xr[t] - mx) * (lr[t] - my); vx += (xr[t] - mx) ** 2; } const bt = vx ? cv / vx : 1;
      const res = lr.map((r, t) => r - bt * xr[t]), rs = res.slice(0, Math.max(10, res.length - 21)), sdr = sd(res);
      y.e.idio = sdr ? sdr * Math.sqrt(252) * 100 : null; y.e.resmom = rs.length > 20 && sd(rs) ? rs.reduce((a, v) => a + v, 0) / (sd(rs) * Math.sqrt(rs.length)) : null; y.e.betaH = bt;
      const i0 = im.get(b.d[n - 1]), i21 = n > 21 ? im.get(b.d[n - 22]) : null; y.e.r21x = i0 && i21 && b.c[n - 22] > 0 ? (Math.log(b.c[n - 1] / b.c[n - 22]) - Math.log(i0 / i21)) * 100 : null; } }
  return out;
}
/* ---------- Faber trend filter: index against its 10-month (200-day) average ---------- */
function faber(inst) {
  const f = sym => { const x = inst && inst[sym]; if (!x) return null; const c = closesOf(x); if (c.length < 200) return null; const ma = mean(c.slice(-200)), price = num(x.price) ?? c[c.length - 1]; return { price, ma, above: price > ma, gap: (price / ma - 1) * 100 }; };
  return { bist: f('XU100'), us: f('SPX') };
}

/* ---------- macro ---------- */
function macroView(M, S) {
  const real = (num(M.policyRate) !== null && num(M.infl12m) !== null) ? ((1 + M.policyRate / 100) / (1 + M.infl12m / 100) - 1) * 100 : 10;
  return { real, hurdle: benchNet(S, 365, undefined, M), hurdleUsd: benchNet(S, 365, 'USD'), benchLabel: benchLabel(S), fx: fxRate(S, M) };
}
function regime(E, M, S) {
  const x = E.XU100 || {}, e = x.e || {};
  const dd = (num(x.price) && num(x.hi52)) ? (1 - x.price / x.hi52) * 100 : null;
  const mv = macroView(M, S);
  const name = dd === null ? 'unknown' : dd > 25 ? 'contrarian' : dd > 10 ? 'correction' : 'trend';
  return { dd, real: mv.real, hurdle: mv.hurdle, hurdleUsd: mv.hurdleUsd, benchLabel: mv.benchLabel, name, xu: x, faber: faber(E) };
}

/* ---------- expected return (annual, TRY, before fund fee) ---------- */
function expected(x, S, M) {
  const e = x.e, real = macroView(M, S).real, b = 0.5 + 0.5 * clamp(e.beta, 0.3, 1.8), rf = S.benchmark === 'mm' ? S.tlRate : rfTry(S, M); // beta shrunk 50% toward 1 (estimation error)
  const fxv = fxRate(S, M), toTRY = usd => ((1 + usd / 100) * (1 + fxv / 100) - 1) * 100;
  if (x.cls === 'TR_EQ') {
    const tilt = e.ey !== null ? clamp(0.1 * (e.ey - real), -2, 2) : 0; // value tilt, shrunk 50%
    const divDrag = (e.div || 0) * S.divTaxTr / 100;
    return { E: rf + b * S.erpTr + tilt - divDrag, parts: { rf: rf, beta: b, erp: S.erpTr, tilt, divDrag } };
  }
  if (x.cls === 'CRYPTO') { const usd = (S.cmdtyExp || {})[x.symbol] ?? (S.expCrypto ?? 0); return { E: toTRY(usd), usd, parts: { usd, fx: fxv } }; }
  // commodities and commodity funds (gold, silver, metals, energy): a USD expectation converted to TRY
  if (x.cls === 'CMDTY' || x.cmdtyFund || ['gold', 'silver', 'cmdty'].includes(x.sub)) {
    const ce = S.cmdtyExp || {}, usd = ce[x.symbol] ?? ((x.sub === 'gold' || x.symbol === 'XAUUSD') ? (S.expGold ?? 3) : (S.expCmdty ?? 2.5));
    return x.ccy === 'USD' ? { E: toTRY(usd), usd, parts: { usd, fx: fxv } } : { E: toTRY(usd), usd, parts: { usd, fx: fxv, viaTRY: true } }; }
  if (x.cls === 'TR_ETF' || (x.cls === 'TEFAS' && x.hy)) return { E: rf + S.erpTr, parts: { rf: rf, beta: 1, erp: S.erpTr, tilt: 0 } };
  if (x.cls === 'TEFAS') return { E: rf, parts: { rf: rf } };
  if (x.cls === 'US_EQ') {
    const tilt = e.ey !== null ? clamp(0.075 * (e.ey - 5), -1, 1) : 0;
    const usd = S.rfUsd + b * S.erpUs + tilt - (e.div || 0) * 0.2;
    return { E: toTRY(usd), usd, parts: { rf: S.rfUsd, beta: b, erp: S.erpUs, tilt, fx: fxv } };
  }
  if (x.cls === 'US_ETF') {
    const usd = GOLD.includes(x.symbol) ? S.expGold : BOND.includes(x.symbol) ? S.expBond : S.rfUsd + clamp(e.beta, 0.3, 1.5) * S.erpUs;
    return { E: toTRY(usd), usd, parts: { fx: fxv } };
  }
  return { E: rf, parts: {} };
}

/* ---------- costs ---------- */
function akRate(monthVol) { for (const [cap, r] of AK_TIERS) if (monthVol < cap) return r; return 1.2; }
function costs(x, amount, S, M, monthVol = 0) {
  const A = Math.max(0, +amount || 0), e = x.e || {}, usdtry = M.usdtry || 49.5;
  let comm = 0, bsmv = 0, fees = 0, spread = 0, fixed = 0;
  if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') { comm = A * akRate(monthVol) / 1000; bsmv = comm * S.bsmv / 100; fees = A * S.bistFee / 100000; spread = A * (e.spread || 0.25) / 100; }
  else if (x.cls === 'TEFAS') { comm = A * S.fundComm / 100; bsmv = comm * S.bsmv / 100; }
  else { comm = S.usComm * usdtry; bsmv = comm * S.bsmv / 100; fixed = comm + bsmv; fees = A * S.fxSpread / 100; spread = A * (e.spread || 0.02) / 100; }
  const side = comm + bsmv + fees + spread;
  return { comm, bsmv, fees, spread, side, roundTrip: 2 * side, roundTripPct: A > 0 ? 2 * side / A * 100 : null, fixedSide: fixed };
}
function minOrder(x, S, M) {
  if (x.ccy !== 'USD') return null;
  const fixed = S.usComm * (1 + S.bsmv / 100) * (M.usdtry || 49.5);
  return Math.ceil(fixed / 0.0025 / 1000) * 1000;
}
function variableCostPct(x, S) {
  const e = x.e || {};
  if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') return 2 * (2 * (1 + S.bsmv / 100) / 10 + S.bistFee / 1000 + (e.spread || 0.25));
  if (x.cls === 'TEFAS') return 2 * S.fundComm * (1 + S.bsmv / 100);
  return 2 * (S.fxSpread + (e.spread || 0.02)) + 0.5;
}

/* ---------- tax on a gain (all as % of the amount invested) ---------- */
function taxPct(x, gainPct, t, S) {
  if (gainPct <= 0) return 0;
  if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') return 0;
  if (x.cls === 'TEFAS') { if (x.hy) return 0; if (x.b51) return t >= 1 ? 0 : gainPct * S.taxTefas / 100; return gainPct * S.taxTefas / 100; }
  const cum = (Math.pow(1 + S.ufe / 100, t) - 1) * 100, idx = cum >= 10 ? cum : 0;
  return Math.max(0, gainPct - idx) * S.usMarginal / 100;
}
function taxLabel(x, S) {
  if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') return '0% stopaj';
  if (x.cls === 'TEFAS') return x.hy ? '0% stopaj' : x.b51 ? '17.5% under 1 year, then 0%' : S.taxTefas + '% stopaj';
  return S.usMarginal + '% over ÜFE, declared';
}

/* ---------- horizon-specific alpha (annualised %) ---------- */
function alphas(x, z) {
  const e = x.e, shrink = e.flags.includes('short history') || e.isProxy ? 0.5 : 1;
  let sRev = 0; if (z.rsiD !== undefined && z.rsiD !== null) sRev += clamp(-z.rsiD / 12, -1, 1.5);
  if (z.ma20D !== undefined && z.ma20D !== null) sRev += 0.5 * clamp(-z.ma20D / 0.06, -1, 1);
  const cc = x.ccy === 'USD' ? 'USD' : 'TRY', aRev = 25 * sRev * shrink * calScale(cc, 'rev'), aMom = 10 * clamp(z.mom || 0, -2, 2) * shrink * calScale(cc, 'mom'), aVal = 3 * clamp(z.value || 0, -2, 2) * calScale(cc, 'val');
  const trend = (e.ma200 && e.price) ? (e.price > e.ma200 ? 2 : -2) * calScale(cc, 'trend') : 0;
  const w = { '1w': [1, 0, 0, 0], '2w': [0.8, 0.2, 0, 0], '3w': [0.6, 0.4, 0, 0.3], '1m': [0.3, 1, 0, 1], '2m': [0.1, 1, 0, 1], '3m': [0, 1, 0, 1], '6m': [0, 0.6, 0.7, 1], '9m': [0, 0.45, 0.85, 1], '12m': [0, 0.3, 1, 1] };
  const out = {}; for (const [k] of HORIZONS) { const [a, b, c, d] = w[k]; out[k] = a * aRev + b * aMom + c * aVal + d * trend; }
  return { by: out, aRev, aMom, aVal, trend };
}

/* ---------- stops: ATR-based (Chandelier) ---------- */
function stopDist(x, S) { // initial stop distance in price: max(stopAtr × ATR(22), 1.5 × one-month volatility)
  const e = x.e || {}; if (!e.price) return 0; const monthly = e.price * (e.volUsed || 30) / 100 / Math.sqrt(12) * 1.5, atr = e.atr ? (S.stopAtr || 2.5) * e.atr : 0;
  return Math.max(atr, monthly, e.price * 0.03);
}
function trailLevel(x, S, peak) { const e = x.e || {}; const mult = S.trailAtr || 3; if (e.atr && peak) return { level: peak - mult * e.atr, pct: mult * e.atr / peak * 100, mult }; const pct = Math.max(5, (e.volUsed || 30) * 0.6); return { level: peak ? peak * (1 - pct / 100) : null, pct, mult: null }; }

/* ---------- horizons, spans, targets ---------- */
function horizons(x, S, M, amount, z) {
  const e = x.e, ex = expected(x, S, M), fee = +x.fee || 0, vol = e.volUsed, al = alphas(x, z || {});
  const A = amount && amount > 0 ? amount : (minOrder(x, S, M) || 20000);
  const c = costs(x, A, S, M), costPct = c.roundTripPct;
  const rows = HORIZONS.map(([k, label, t]) => {
    const emp = z && z.q !== undefined && z.q !== null && (x.cls === 'TR_EQ' || x.cls === 'US_EQ'), edge = emp ? v3Edge(x.ccy === 'USD' ? 'USD' : 'TRY', z.q, Math.round(t * 252)) : null;
    const ann = emp ? (Math.pow(Math.pow(1 + (ex.E - fee) / 100, t) * Math.exp(edge / 100), 1 / t) - 1) * 100 : ex.E + al.by[k] - fee;
    const mu = (Math.pow(1 + ann / 100, t) - 1) * 100, sig = vol * Math.sqrt(t) * calSig(x.ccy === 'USD' ? 'USD' : 'TRY', t);
    const gross = mu - costPct, tax = taxPct(x, gross, t, S), net = gross - tax;
    const fxT = (Math.pow(1 + fxRate(S, M) / 100, t) - 1) * 100, usdP = S.principal === 'USD';
    const mm = usdP ? benchNet(S, t * 365, 'USD') : benchNet(S, t * 365, undefined, M), netCmp = usdP ? ((1 + net / 100) / (1 + fxT / 100) - 1) * 100 : net;
    const excess = netCmp - mm, sharpe = excess / (t * vol);
    let conf = t < 0.05 ? 'low' : t < 0.1 ? 'medium' : 'high';
    if (e.flags.length && conf === 'high') conf = 'medium';
    const locked = x.cls === 'TEFAS' && (t < 0.08 || (x.b51 && t < 1)); // TEFAS: T+1/T+2 settlement, no sub-month spans
    return { k, label, t, ann, mu, sig, costPct, tax, net, netCmp, netUsd: ((1 + net / 100) / (1 + fxT / 100) - 1) * 100, mm, excess, sharpe, conf, locked,
      target: e.price ? e.price * (1 + (mu + 0.5 * sig) / 100) : null, stop: e.price ? e.price - stopDist(x, S) : null };
  });
  const ok = rows.filter(r => !r.locked);
  const best = ok.reduce((a, r) => r.sharpe > a.sharpe ? r : a, ok[0]);
  const signal = spanSignal(best.k);
  return { rows, best: best.excess > 0 ? best : null, bestAny: best, E: ex.E, parts: ex.parts, alphas: al, signal, amount: A };
}

/* ---------- scoring ---------- */
function pctRanks(items, key) {
  const vals = items.map(o => o.raw[key]).filter(v => v !== null && v !== undefined && isFinite(v)).sort((a, b) => a - b);
  for (const o of items) { const v = o.raw[key]; if (v === null || v === undefined || !isFinite(v) || vals.length < 2) { o.pct[key] = null; continue; } let lo = 0, eq = 0; for (const w of vals) { if (w < v) lo++; else if (w === v) eq++; } o.pct[key] = Math.round((lo + 0.5 * eq) / vals.length * 100); }
}
function zScores(items, key, out) {
  const vals = items.map(o => o.raw[key]).filter(v => v !== null && v !== undefined && isFinite(v)); const m = mean(vals), s = sd(vals) || 1;
  for (const o of items) { const v = o.raw[key]; out(o, v === null || v === undefined || !isFinite(v) ? 0 : (v - m) / s); }
}
/* ---------- scoring v3: evidence-weighted composite ----------
   Each signal is rank-gaussianised inside its peer group (BIST shares, US shares, funds); fundamentals are compared within their
   industry (shrunk toward the whole group when the industry is small); the weighted sum is neutralised for company size and turned
   into a 0-100 percentile. Price-signal weights come from the walk-forward calibration (rank IC, shrunk toward research priors,
   negative weights dropped); value and quality, which cannot be tested without point-in-time fundamentals, keep a fixed share.
   Backtest 2017-2026, BIST: rank IC 0.112 (t 8.7) against 0.064 for the earlier score. */
const V3_SIGNALS = ['lowvol', 'idio', 'hi52', 'maxDay', 'above200', 'mom121ra', 'resmom', 'rsiRev', 'abvol', 'r21x', 'lowbeta'];
const V3_DEFAULT_W = { TRY: { lowvol: 0.187, idio: 0.142, hi52: 0.181, maxDay: 0.205, above200: 0.11, mom121ra: 0.079, resmom: 0.032, r21x: 0.064 },
  USD: { lowvol: 0.024, hi52: 0.063, maxDay: 0.14, above200: 0.106, mom121ra: 0.204, resmom: 0.218, abvol: 0.194, r21x: 0.051 } };
const V3_SHARE = { TRY: { price: 0.70, value: 0.15, quality: 0.10, cost: 0.05 }, USD: { price: 0.45, value: 0.25, quality: 0.25, cost: 0.05 } };
const V3_GROUP = { trend: ['hi52', 'above200'], mom: ['mom121ra', 'resmom', 'r21x'], rev: ['rsiRev', 'abvol'], risk: ['lowvol', 'idio', 'maxDay', 'lowbeta'] };
function invNorm(p) { p = Math.min(0.999, Math.max(0.001, p)); const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771011, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  if (p < 0.02425 || p > 0.97575) { const q = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p))), x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); return p < 0.5 ? x : -x; }
  const r = p - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); }
function gaussRank(vals) { // rank → normal score; null stays null (bounded, so one extreme ratio cannot dominate)
  const idx = []; vals.forEach((v, i) => { if (v !== null && v !== undefined && isFinite(v)) idx.push(i); }); const out = vals.map(() => null); if (idx.length < 3) return out;
  idx.sort((i, j) => vals[i] - vals[j]); let k = 0; while (k < idx.length) { let j = k; while (j + 1 < idx.length && vals[idx[j + 1]] === vals[idx[k]]) j++; const z = invNorm(((k + j) / 2 + 0.5) / idx.length); for (let t = k; t <= j; t++) out[idx[t]] = z; k = j + 1; } return out; }
// Score-quintile × holding-period table from the 2017-2026 backtest: mean forward return over the index (log %, after 5/10/21/63/126
// trading days) for each fifth of the score, centred on the average stock. It turns a score into an expected edge per horizon.
const V3_DEC_H = [5, 10, 21, 63, 126];
const V3_DEC_RAW = { TRY: [[-0.65, -0.61, -1.56, -2.22, -2.46], [-0.17, 0.01, -0.47, -0.49, 0.22], [-0.2, 0.01, -0.13, 0.45, 1.23], [0.04, 0.29, 0.39, 0.82, 2.41], [0.2, 0.42, 0.78, 2.41, 4.38]],
  USD: [[-0.05, -0.17, -0.48, -1.32, -2.16], [-0.06, -0.11, -0.21, -0.79, -1.56], [-0.06, -0.01, -0.03, -0.37, -0.97], [-0.04, -0.02, -0.11, -0.4, -0.85], [-0.17, -0.15, -0.2, -0.49, -1.14]] };
const V3_DEC = Object.fromEntries(Object.entries(V3_DEC_RAW).map(([c, t]) => [c, t.map(row => row.map((v, j) => +(v - mean(t.map(r => r[j]))).toFixed(3)))]));
function v3Edge(ccy, q, days) { // expected log % over the index for a holding of `days` trading days; beyond 6 months the edge keeps growing at 3/4 of its last pace
  const t = (CAL && CAL.dec && CAL.dec[ccy]) || V3_DEC[ccy] || V3_DEC.TRY, row = t[Math.max(0, Math.min(4, q))]; if (!row) return 0; if (days <= 0) return 0;
  let prevH = 0, prevV = 0; for (let j = 0; j < V3_DEC_H.length; j++) { const h = V3_DEC_H[j], v = row[j]; if (days <= h) return prevV + (v - prevV) * (days - prevH) / (h - prevH); prevH = h; prevV = v; }
  const slope = (row[4] - row[3]) / (126 - 63); return row[4] + 0.75 * slope * (days - 126); }
function v3Weights(ccy) { const c = CAL && CAL.w && CAL.w[ccy], d = V3_DEFAULT_W[ccy] || V3_DEFAULT_W.TRY; // a signal the calibration could not estimate (no index or volume history) keeps the backtested default
  const w = c && Object.keys(c).length ? (() => { const m = {}, sc = Object.keys(c).reduce((a, k) => a + (d[k] || 0), 0); for (const k of V3_SIGNALS) m[k] = k in c ? c[k] * sc : (d[k] || 0); return m; })() : d; const t = Object.values(w).reduce((a, v) => a + Math.max(0, v), 0) || 1; return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.max(0, v) / t])); }
function v3Score(items, S) {
  const peerOf = o => (o.x.cls === 'TR_EQ' || o.x.cls === 'US_EQ') ? 'eq|' + o.x.ccy : 'fund';
  const groups = {}; for (const o of items) (groups[peerOf(o)] = groups[peerOf(o)] || []).push(o);
  for (const [key, g] of Object.entries(groups)) {
    const eq = key.startsWith('eq'), ccy = key === 'eq|USD' ? 'USD' : 'TRY', W = v3Weights(ccy), SH = eq ? V3_SHARE[ccy] : { price: 0.95, value: 0, quality: 0, cost: 0.05 };
    for (const o of g) { const e = o.x.e, v = e.vol ?? e.volUsed; o.sig = { lowvol: v ? -v : null, idio: e.idio != null ? -e.idio : null, hi52: e.hi252p ?? (e.hi52 && e.price ? e.price / e.hi52 : null), maxDay: e.maxDay5 != null ? -e.maxDay5 : null,
      above200: e.above200 === null || e.above200 === undefined ? null : e.above200 ? 1 : 0, mom121ra: e.mom121 != null && v ? e.mom121 / v : null, resmom: e.resmom ?? null, rsiRev: e.rsi != null ? 50 - e.rsi : null, abvol: e.abvol ?? null, r21x: e.r21x ?? null, lowbeta: -(e.betaH ?? e.beta ?? 1) }; }
    const Z = {}; for (const k of V3_SIGNALS) { const z = gaussRank(g.map(o => o.sig[k])); g.forEach((o, i) => { (o.zs = o.zs || {})[k] = z[i]; }); }
    // fundamentals: within industry (or sector), shrunk toward the whole group: z = n/(n+10)·z_ind + 10/(n+10)·z_all
    const neutral = getter => { const all = gaussRank(g.map(getter)), by = {}; g.forEach((o, i) => { const k = o.x.industry || o.x.e.sector || '?'; (by[k] = by[k] || []).push(i); }); const out = all.slice();
      for (const ids of Object.values(by)) { const zi = gaussRank(ids.map(i => getter(g[i]))), n = ids.filter((i, j) => zi[j] !== null).length; if (n < 3) continue; ids.forEach((i, j) => { if (zi[j] !== null && all[i] !== null) out[i] = n / (n + 10) * zi[j] + 10 / (n + 10) * all[i]; }); } return out; };
    const avg = parts => { let a = 0, t = 0; for (const [z, w] of parts) if (z !== null && z !== undefined) { a += z * w; t += w; } return t ? a / t : null; };
    let val = g.map(() => null), qual = g.map(() => null);
    if (eq) { const ep = neutral(o => o.x.e.ey), bp = neutral(o => o.x.e.pb ? 100 / o.x.e.pb : null), dy = neutral(o => o.x.e.div), roe = neutral(o => o.x.e.roe), mg = neutral(o => o.x.e.margin);
      // book values are restated under IAS 29 in Turkey since 2023, so book/price counts half there
      val = g.map((o, i) => avg([[ep[i], 1], [bp[i], ccy === 'TRY' ? 0.5 : 1], [dy[i], 0.5]])); qual = g.map((o, i) => avg([[roe[i], 1], [mg[i], 0.5]])); }
    const cost = gaussRank(g.map(o => o.raw.cost)), liq = gaussRank(g.map(o => o.raw.liq));
    let comp = g.map((o, i) => { let p = 0; for (const k of V3_SIGNALS) if (W[k] && o.zs[k] !== null) p += W[k] * o.zs[k]; return SH.price * p + SH.value * (val[i] ?? 0) + SH.quality * (qual[i] ?? 0) + SH.cost * (cost[i] ?? 0); });
    // size neutral: remove the part of the score explained by company size (log market value or turnover), so large caps do not win by default
    if (eq) { const sz = gaussRank(g.map(o => o.x.e.mcap ? Math.log(o.x.e.mcap) : o.x.e.turnover ? Math.log(o.x.e.turnover) : null)), ok = g.map((o, i) => sz[i] !== null);
      const xs = sz.filter((v, i) => ok[i]), ys = comp.filter((v, i) => ok[i]); if (xs.length > 20) { const mx = mean(xs), my = mean(ys); let c = 0, vv = 0; for (let i = 0; i < xs.length; i++) { c += (xs[i] - mx) * (ys[i] - my); vv += (xs[i] - mx) ** 2; } const b = vv ? c / vv : 0; comp = comp.map((v, i) => ok[i] ? v - b * (sz[i] - mx) : v); } }
    const pr = gaussRank(comp), n = comp.length; const ord = comp.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const pct = new Array(n); ord.forEach(([, i], k) => { pct[i] = n > 1 ? k / (n - 1) * 100 : 50; });
    const gp = zs => { const r = gaussRank(zs); return r.map(z => z === null ? null : Math.round(phi(z) * 100)); };
    const grp = {}; for (const [k, ks] of Object.entries(V3_GROUP)) grp[k] = gp(g.map(o => avg(ks.map(s => [o.zs[s], W[s] || 0.05])))); grp.value = gp(val); grp.quality = gp(qual); grp.liq = gp(liq); grp.cost = gp(cost);
    g.forEach((o, i) => { for (const k of Object.keys(grp)) o.pct[k] = grp[k][i]; if (val[i] !== null) o.z.value = val[i]; const pen = o.x.e.flags.reduce((a, f) => a + (f === 'proxy' ? 3 : f === 'stale history' ? 2 : 6), 0); o.v3 = Math.max(0, Math.round(pct[i] - pen)); o.v3w = { W, SH }; });
  }
}
function scoreAll(inst, S, M, weightsOverride) {
  const E = enrich(inst, S, M), real = macroView(M, S).real;
  const list = Object.values(E).filter(x => x.cls !== 'MACRO');
  const sectorPE = {}; for (const x of list) if (x.cls === 'TR_EQ' || x.cls === 'US_EQ') { if (x.e.pe) (sectorPE[x.ccy + '|' + x.e.sector] = sectorPE[x.ccy + '|' + x.e.sector] || []).push(x.e.pe); }
  const items = list.map(x => {
    const e = x.e, v = e.vol ?? e.volUsed, raw = {};
    const tr = []; if (e.price) { if (e.ma20) tr.push(e.price / e.ma20 - 1); if (e.ma50) tr.push(e.price / e.ma50 - 1); if (e.ma200) tr.push(e.price / e.ma200 - 1); if (e.ma50 && e.ma200) tr.push(e.ma50 / e.ma200 - 1); }
    raw.trend = tr.length ? mean(tr) * 100 : null;
    // momentum: risk-adjusted 12-1 (60%) and 6-1 (40%); falls back to the older 3/6/12-month blend when history is short
    if (e.mom121 !== null || e.mom61 !== null) raw.mom = ((e.mom121 !== null ? 0.6 * e.mom121 : 0) + (e.mom61 !== null ? 0.4 * e.mom61 : 0)) / ((e.mom121 !== null ? 0.6 : 0) + (e.mom61 !== null ? 0.4 : 0)) / v;
    else { const mo = []; if (e.r3m !== null && e.r3m !== undefined) mo.push(0.4 * e.r3m / v); if (e.r6m !== null && e.r6m !== undefined) mo.push(0.3 * e.r6m / v); if (e.r1y !== null && e.r1y !== undefined && e.r1m !== null && e.r1m !== undefined) mo.push(0.3 * (e.r1y - e.r1m) / v);
      raw.mom = mo.length ? mo.reduce((a, b) => a + b, 0) / (mo.length ? [0.4, 0.3, 0.3].slice(0, mo.length).reduce((a, b) => a + b, 0) : 1) : (e.r1m !== null && e.r1m !== undefined ? e.r1m / v : null); }
    raw.rev = (e.rsi !== null && e.rsi !== undefined) ? (50 - e.rsi) / 10 + (e.r1w !== null && e.r1w !== undefined ? -e.r1w / Math.max(v, 10) * 5 : 0) : null;
    raw.risk = -(e.volUsed + 0.2 * (e.mdd || 0)); // low-volatility factor (Baker-Bradley-Wurgler): calmer stocks rank higher
    if (x.cls === 'TR_EQ' || x.cls === 'US_EQ') {
      const med = (a => a && a.length ? a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)] : null)(sectorPE[x.ccy + '|' + e.sector]);
      const rel = e.pe && med ? -(e.pe / med - 1) * 5 : 0;
      const bm = e.pb ? 100 / e.pb : null; // book-to-market in percent
      raw.value = e.ey !== null || bm !== null ? (e.ey !== null ? (e.ey - (x.ccy === 'TRY' ? real : 5)) * 0.5 : 0) + (bm !== null ? bm * 0.08 : 0) + (e.div || 0) * 0.5 + rel + (e.dd ? e.dd * 0.05 : 0) : (e.dd ? e.dd * 0.05 : null);
      raw.quality = e.roe !== null || e.margin !== null ? (e.roe !== null ? e.roe : 0) + (e.margin !== null ? 0.5 * e.margin : 0) : null;
    } else { raw.value = e.dd !== null && e.dd !== undefined ? e.dd * 0.05 : null; raw.quality = null; }
    raw.liq = e.turnover ? Math.log10(e.turnover) - (e.amihud ? 0.2 * Math.log10(1 + e.amihud) : 0) : (e.mcap ? Math.log10(e.mcap) - 3 : null);
    raw.cost = -((+x.fee || 0) + variableCostPct(x, S) + (x.cls === 'US_EQ' || x.cls === 'US_ETF' ? S.usMarginal * 0.15 : x.cls === 'TEFAS' && !x.hy ? S.taxTefas * 0.3 : 0));
    raw.fx = x.ccy === 'USD' ? fxRate(S, M) : 0;
    return { x, raw, pct: {}, z: {} };
  });
  const peer = o => (o.x.cls === 'TR_EQ' || o.x.cls === 'US_EQ') ? 'eq|' + o.x.ccy : 'fund';
  const groups = {}; for (const o of items) (groups[peer(o)] = groups[peer(o)] || []).push(o);
  for (const g of Object.values(groups)) {
    for (const [k] of GROUPS) if (k !== 'fx' && k !== 'edge') pctRanks(g, k);
    zScores(g, 'mom', (o, z) => o.z.mom = z); zScores(g, 'value', (o, z) => o.z.value = z);
    const med = a => { const v = a.filter(q => q !== null && q !== undefined && isFinite(q)).sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : null; };
    const mr = med(g.map(o => o.x.e.rsi)), mm20 = med(g.map(o => o.x.e.ma20 && o.x.e.price ? o.x.e.price / o.x.e.ma20 - 1 : null));
    for (const o of g) { const e = o.x.e; o.z.rsiD = (e.rsi !== null && e.rsi !== undefined && mr !== null) ? e.rsi - mr : null; o.z.ma20D = (e.ma20 && e.price && mm20 !== null) ? (e.price / e.ma20 - 1) - mm20 : null; }
  }
  pctRanks(items, 'fx');
  for (const o of items) { o.hz = horizons(o.x, S, M, null, o.z); o.raw.edge = o.hz.bestAny.sharpe; }
  for (const g of Object.values(groups)) pctRanks(g, 'edge');
  v3Score(items, S);
  const w = weightsOverride || (PRESETS[S.preset] || PRESETS.balanced).w, evidence = !weightsOverride && (!S.preset || S.preset === 'balanced') && S.scoringV3 !== false;
  const scoreWith = (o, wts) => { let tw = 0, acc = 0; for (const [k] of GROUPS) { const p = o.pct[k], wk = wts[k] || 0; if (p === null || p === undefined || !wk) continue; tw += wk; acc += wk * p; }
    let sc = tw ? acc / tw : null; const pen = o.x.e.flags.reduce((a, f) => a + (f === 'proxy' ? 3 : f === 'stale history' ? 2 : 6), 0); return sc === null ? null : Math.max(0, Math.round(sc - pen)); };
  const HW = { '1m': horizonWeights('1m', w), '3m': horizonWeights('3m', w), '6m': horizonWeights('6m', w), '12m': horizonWeights('12m', w) };
  if (evidence) for (const o of items) if (o.v3 !== undefined && (o.x.cls === 'TR_EQ' || o.x.cls === 'US_EQ')) { o.z.q = Math.min(4, Math.floor(o.v3 / 20)); o.hz = horizons(o.x, S, M, null, o.z); o.raw.edge = o.hz.bestAny.sharpe; }
  return items.map(o => {
    const score = evidence && o.v3 !== undefined ? o.v3 : scoreWith(o, w), scoreH = {}; for (const k of Object.keys(HW)) scoreH[k] = scoreWith(o, HW[k]);
    if (S.horizonWeights !== false) { // best span: Sharpe of the span, tilted by the factor score that fits that horizon (momentum/reversal short, value/quality/low-vol long)
      const ok = o.hz.rows.filter(r => !r.locked && r.excess > 0); if (ok.length) { const adj = r => r.sharpe * (0.85 + 0.3 * (scoreH[hBucket(r.k)] ?? 50) / 100); const b = ok.reduce((a, r) => adj(r) > adj(a) ? r : a, ok[0]); o.hz.best = b; o.hz.signal = spanSignal(b.k); } }
    const best = o.hz.best;
    return { ...o.x, f: o.pct, z: o.z, raw: o.raw, score, scoreH, hz: o.hz, best, span: best ? best.label : 'avoid', E: o.hz.E, gate: o.x.e.gate,
      net12: o.hz.rows[5].net, taxRate: taxLabel(o.x, S), minOrder: minOrder(o.x, S, M), complete: (o.x.e.r1m ?? null) !== null };
  });
}
function explain(x, S) {
  if (!x || !x.f) return '';
  const lab = Object.fromEntries(GROUPS), strong = GROUPS.filter(([k]) => x.f[k] >= 70).map(([k]) => lab[k].toLowerCase()), weak = GROUPS.filter(([k]) => x.f[k] !== null && x.f[k] !== undefined && x.f[k] <= 30).map(([k]) => lab[k].toLowerCase());
  const p = [x.score === null ? 'No score yet.' : `Score ${x.score}/100.`];
  if (strong.length) p.push('Strong on ' + strong.join(', ') + '.'); if (weak.length) p.push('Weak on ' + weak.join(', ') + '.');
  p.push(`Expected ${x.E.toFixed(1)}% a year in TRY before costs.`);
  p.push(x.best ? `Best span ${x.best.label} (${x.hz.signal}), ${x.best.conf} confidence.` : `No span beats a ${benchLabel(S)} after costs and tax.`);
  if (x.e.flags.length) p.push('Data flags: ' + x.e.flags.join(', ') + '.');
  if (x.gate && !x.gate.ok) p.push('Not eligible for picks: ' + x.gate.why.join(', ') + '.');
  return p.join(' ');
}

/* ---------- scenarios for an amount ---------- */
function scenario(x, A, t, S, M, z, monthVol) {
  const hz = horizons(x, S, M, A, z), c = costs(x, A, S, M, monthVol);
  const ann = hz.E + interpAlpha(hz.alphas.by, t) - (+x.fee || 0), mu = Math.pow(1 + ann / 100, t) - 1, sig = x.e.volUsed / 100 * Math.sqrt(t) * calSig(x.ccy === 'USD' ? 'USD' : 'TRY', t);
  const res = {};
  for (const [k, m] of [['exp', 0], ['best', 1], ['worst', -2]]) {
    const gross = (A - c.side) * (1 + mu) * Math.exp(m * sig), exitC = costs(x, gross, S, M, monthVol).side, after = gross - exitC;
    const gainPct = A > 0 ? (after / A - 1) * 100 : 0, tx = A * taxPct(x, gainPct, t, S) / 100;
    res[k] = { gross, tax: tx, net: after - tx, roi: A > 0 ? (after - tx) / A - 1 : 0 };
  }
  return { ...res, entry: c, E: hz.E, sig: sig * 100, bench: A * (1 + benchNet(S, t * 365, undefined, M) / 100) };
}
function interpAlpha(by, t) { const pts = HORIZONS.map(([k, , tt]) => [tt, by[k]]); if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a0] = pts[i - 1], [t1, a1] = pts[i]; return a0 + (a1 - a0) * (t - t0) / (t1 - t0); } return pts[pts.length - 1][1]; }

/* ---------- portfolio maths ---------- */
function dailyReturns(x) { const r = {}; const cl = Array.isArray(x.closes) ? x.closes : []; for (let i = 1; i < cl.length; i++) r[cl[i][0]] = Math.log(cl[i][1] / cl[i - 1][1]); return r; }
function corr(a, b) { const ks = Object.keys(a).filter(k => k in b); if (ks.length < 20) return null; const xa = ks.map(k => a[k]), xb = ks.map(k => b[k]); const ma = mean(xa), mb = mean(xb); let s = 0, sa = 0, sb = 0; for (let i = 0; i < ks.length; i++) { s += (xa[i] - ma) * (xb[i] - mb); sa += (xa[i] - ma) ** 2; sb += (xb[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); }
function defaultCorr(a, b) { if (a.ccy !== b.ccy) return 0.15; if (GOLD.includes(a.symbol) || GOLD.includes(b.symbol) || BOND.includes(a.symbol) || BOND.includes(b.symbol)) return 0.1; return a.e.sector === b.e.sector ? 0.65 : 0.5; }
function portfolioRisk(lines) { // lines: [{x, w}]
  const rets = lines.map(l => dailyReturns(l.x)); let v = 0, sumRho = 0, nRho = 0;
  for (let i = 0; i < lines.length; i++) for (let j = 0; j < lines.length; j++) {
    const a = lines[i], b = lines[j]; let rho = i === j ? 1 : (corr(rets[i], rets[j]) ?? defaultCorr(a.x, b.x));
    if (i < j) { sumRho += rho; nRho++; }
    v += a.w * b.w * rho * a.x.e.volUsed * b.x.e.volUsed;
  }
  return { vol: Math.sqrt(Math.max(0, v)), avgCorr: nRho ? sumRho / nRho : null };
}
function stressTRYShock(lines) { // Aug-2018-style: lira -30%, BIST -20% in TRY scaled by beta
  let pl = 0; for (const l of lines) { const x = l.x, b = clamp(x.e.beta, 0, 2); let r;
    if (GOLD.includes(x.symbol)) r = 0.40; else if (BOND.includes(x.symbol)) r = 0.35; else if (x.ccy === 'USD') r = 1.35 * (1 - 0.05 * b) - 1; else if (x.cls === 'TEFAS' && !x.hy) r = 0.01; else r = -0.2 * b;
    pl += l.amount * r; }
  return pl;
}
function weightsBy(lines, keyFn) { const tot = lines.reduce((a, l) => a + l.amount, 0) || 1, m = {}; for (const l of lines) { const k = keyFn(l); m[k] = (m[k] || 0) + l.amount; } return Object.entries(m).map(([k, v]) => [k, v / tot * 100]).sort((a, b) => b[1] - a[1]); }
function riskBucket(v) { return v < 20 ? 'Low' : v < 35 ? 'Medium' : 'High'; }
function packageAnalytics(lines, S, M, scoredMap) { // lines: [{symbol, amount}]
  const L = lines.map(l => ({ ...l, x: scoredMap[l.symbol] })).filter(l => l.x && l.amount > 0); const tot = L.reduce((a, l) => a + l.amount, 0);
  if (!tot) return null;
  L.forEach(l => l.w = l.amount / tot);
  const pr = portfolioRisk(L), mv = macroView(M, S);
  const net12 = L.reduce((a, l) => a + l.w * scenario(l.x, l.amount, 1, S, M, l.x.z).exp.roi * 100, 0);
  const beta = L.reduce((a, l) => a + l.w * l.x.e.beta, 0);
  const target = mv.hurdle + 0.3 * pr.vol + 2 * Math.max(0, beta - 1);
  const mu = Math.log(1 + net12 / 100), s = pr.vol / 100, T = Math.log(1 + target / 100);
  let months = null; for (let m = 1; m <= 60; m++) { const t = m / 12, p = phi((mu * t - T) / (s * Math.sqrt(t))); if (p >= 0.6) { months = m; break; } }
  const stopPct = -1.5 * pr.vol * Math.sqrt(0.25);
  const hz = SCEN_HORIZONS.map(([label, t]) => { const r = { label, t, worst: 0, exp: 0, best: 0, tax: 0, bench: 0 }; for (const l of L) { const sc = scenario(l.x, l.amount, t, S, M, l.x.z); r.worst += sc.worst.net; r.exp += sc.exp.net; r.best += sc.best.net; r.tax += sc.exp.tax; r.bench += sc.bench; } return r; });
  const entry = L.reduce((a, l) => a + costs(l.x, l.amount, S, M).side, 0);
  const rv = realisedVol(L, 126), rv1y = realisedVol(L, 252), volTarget = S.principal === 'USD' ? (S.volTargetUsd || 15) : (S.volTarget || 20);
  const investShare = rv ? clamp(volTarget / rv, 0.25, 1) : 1, crash = rv && rv1y ? rv > 1.5 * rv1y : false;
  return { total: tot, lines: L, vol: pr.vol, avgCorr: pr.avgCorr, beta, net12, target, targetMonths: months, stopPct, hz, entry,
    realVol6m: rv, realVol1y: rv1y, volTarget, investShare, park: tot * (1 - investShare), crashGuard: crash, caps: capsCheck(L, S), diversification: diversificationLabel(L),
    stress: stressTRYShock(L), risk: Math.round(clamp(pr.vol * 1.5, 0, 100)),
    bySector: weightsBy(L, l => l.x.e.sector), byClass: weightsBy(L, l => CLASSES[l.x.cls]), byCcy: weightsBy(L, l => l.x.ccy === 'USD' ? 'USD' : 'TRY'), byRisk: weightsBy(L, l => riskBucket(l.x.e.volUsed)) };
}
function realisedVol(L, days) { // annualised volatility of the weighted basket from stored daily returns
  const rets = L.map(l => dailyReturns(l.x)), dates = new Set(); rets.forEach(r => Object.keys(r).forEach(d => dates.add(d)));
  const ds = [...dates].sort().slice(-days); if (ds.length < 40) return null;
  const port = ds.map(d => L.reduce((a, l, i) => a + l.w * (rets[i][d] ?? 0), 0)); const s = sd(port); return s ? s * Math.sqrt(252) * 100 : null;
}
function capsCheck(L, S) { // UCITS-style 5/10/40 adapted: single stock ≤ capStock %, positions above 5% together ≤ capBig %, sector ≤ capSector %, single fund ≤ capFund %
  const out = []; const tot = L.reduce((a, l) => a + l.amount, 0) || 1;
  for (const l of L) { const w = l.amount / tot * 100, isFund = l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF'; if (!isFund && w > (S.capStock || 10) + 0.01) out.push({ kind: 'stock', symbol: l.x.symbol, w, cap: S.capStock || 10 }); if (isFund && w > (S.capFund || 40) + 0.01) out.push({ kind: 'fund', symbol: l.x.symbol, w, cap: S.capFund || 40 }); }
  const big = L.filter(l => !(l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF') && l.amount / tot * 100 > 5).reduce((a, l) => a + l.amount / tot * 100, 0); if (big > (S.capBig || 40) + 0.01) out.push({ kind: 'big', w: big, cap: S.capBig || 40 });
  const bySec = {}; for (const l of L) if (!(l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF')) bySec[l.x.e.sector] = (bySec[l.x.e.sector] || 0) + l.amount / tot * 100; for (const [sec, w] of Object.entries(bySec)) if (w > (S.capSector || 25) + 0.01) out.push({ kind: 'sector', sector: sec, w, cap: S.capSector || 25 });
  return out;
}
function diversificationLabel(L) { const n = L.length, core = L.filter(l => (l.x.cls === 'TR_ETF' || (l.x.cls === 'TEFAS' && l.x.hy)) ).reduce((a, l) => a + (l.w || 0), 0);
  if (n >= 20 || (n >= 8 && core >= 0.3)) return { label: 'diversified', note: 'at least 20 lines, or 8 with an index-fund core of 30% or more (Statman 1987: 30–40 random stocks remove most single-stock risk; an index fund does the same job)' };
  if (n >= 8) return { label: 'partly diversified', note: '8–19 lines: single-stock risk is reduced but not removed' };
  return { label: 'concentrated', note: 'fewer than 8 lines: single-stock risk dominates; add lines or an index-fund core' }; }
function suggestWeights(L, total, S) { // inverse-volatility weights (robust with short histories: DeMiguel et al. 2009, Jain) with caps, returns TRY amounts
  const n = L.length; if (!n || !total) return [];
  const inv = L.map(l => 1 / Math.max(10, l.x.e.volUsed)); let w = inv.map(v => v / inv.reduce((a, c) => a + c, 0));
  const cap = L.map(l => (l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF' ? (S.capFund || 40) : (S.capStock || 10)) / 100);
  for (let it = 0; it < 20; it++) { let excess = 0, free = 0; w = w.map((v, i) => { if (v > cap[i]) { excess += v - cap[i]; return cap[i]; } free += v; return v; }); if (excess < 1e-6) break; if (free < 1e-9) break; w = w.map((v, i) => v < cap[i] ? v + excess * v / free : v); }
  // sector cap: scale down sectors above the cap, redistribute to the rest
  for (let it = 0; it < 10; it++) { const bySec = {}; L.forEach((l, i) => { if (!(l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF')) bySec[l.x.e.sector] = (bySec[l.x.e.sector] || 0) + w[i]; }); const over = Object.entries(bySec).filter(([, v]) => v > (S.capSector || 25) / 100 + 1e-6); if (!over.length) break; let ex = 0; for (const [sec, v] of over) { const f = (S.capSector || 25) / 100 / v; L.forEach((l, i) => { if (l.x.e.sector === sec && !(l.x.cls === 'TEFAS' || l.x.cls === 'TR_ETF')) { ex += w[i] * (1 - f); w[i] *= f; } }); } const rest = L.map((l, i) => over.some(([sec]) => sec === l.x.e.sector) ? 0 : w[i]), rs = rest.reduce((a, b) => a + b, 0); if (rs < 1e-9) break; w = w.map((v, i) => v + ex * rest[i] / rs); }
  const sum = w.reduce((a, b) => a + b, 0), capped = sum < 0.999; if (capped) w = w.map(v => v / sum); // too few lines for the caps: deploy everything anyway and say so
  const out = L.map((l, i) => ({ symbol: l.x.symbol, w: w[i], amount: Math.round(total * w[i] / 100) * 100 })); const diff = total - out.reduce((a, o) => a + o.amount, 0); if (out.length) out.reduce((a, o) => o.amount > a.amount ? o : a).amount += diff;
  out.capped = capped; out.minLines = Math.ceil(100 / (S.capStock || 10)); return out;
}
function roman(n) { const m = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; }
function longDate(iso) { const d = new Date(iso + (iso.length === 10 ? 'T12:00:00Z' : '')); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
function addMonths(iso, m) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString().slice(0, 10); }

/* ---------- picks (blended risk) ---------- */
function picks(scored, S, M, exclude, today) {
  const ex = new Set(exclude || []);
  const C = scored.filter(x => !ex.has(x.symbol) && x.score !== null && x.best && x.e.price && !x.e.flags.some(f => f !== 'proxy' && f !== 'stale history') && (!x.gate || x.gate.ok) && (x.cls !== 'TR_EQ' || !(['1m', '2m', '3m', '6m', '9m', '12m'].includes(x.best.k) && x.e.above200 === false)));
  const bucket = x => riskBucket(x.e.volUsed), klass = x => x.cls === 'US_ETF' ? (GOLD.includes(x.symbol) ? 'gold' : BOND.includes(x.symbol) ? 'bond' : 'us_etf') : x.cls;
  const sharpe = (x, ks) => Math.max(...x.hz.rows.filter(r => ks.includes(r.k) && !r.locked).map(r => r.sharpe));
  const used = new Set();
  function build(rank, slots, n, lead, spanOk) {
    const pool = C.filter(x => !used.has(x.symbol) && spanOk(x.best.k)), ranked = pool.slice().sort((a, b) => rank(b) - rank(a)), chosen = [];
    for (const want of slots) { const c = ranked.find(x => !chosen.includes(x) && want(x)); if (c) chosen.push(c); }
    while (chosen.length < n) { const have = new Set(chosen.map(klass)), have2 = new Set(chosen.map(x => x.e.sector)); const c = ranked.find(x => !chosen.includes(x) && !have.has(klass(x))) || ranked.find(x => !chosen.includes(x) && !have2.has(x.e.sector)) || ranked.find(x => !chosen.includes(x)); if (!c) break; chosen.push(c); }
    const inv = chosen.map(x => 1 / Math.max(x.e.volUsed, 10)), tot = inv.reduce((a, b) => a + b, 0);
    let sh = inv.map(i => Math.round((0.5 / chosen.length + 0.5 * i / tot) * 20) * 5); const d = 100 - sh.reduce((a, b) => a + b, 0); if (sh.length) sh[sh.indexOf(Math.max(...sh))] += d;
    chosen.forEach(x => used.add(x.symbol));
    return chosen.map((x, i) => { const r = x.best; return { symbol: x.symbol, share: sh[i], risk: Math.round(clamp(x.e.volUsed * 1.5, 0, 100)), bucket: bucket(x), klass: klass(x), sector: x.e.sector,
      hold: r.label, target: r.target, stop: r.stop, priceAt: x.e.price, proxyAt: x.e.isProxy ? (M.xu100 || null) : null,
      reason: `${lead}: ${x.hz.signal} signal, expected ${r.netCmp.toFixed(1)}% net over ${r.label} vs ${r.mm.toFixed(1)}% ${benchLabel(S)}; vol ${x.e.volUsed.toFixed(0)}%, ${x.taxRate}.` }; });
  }
  const isCore = x => x.cls === 'TR_ETF' || (x.cls === 'TEFAS' && x.sub === 'index');
  const d30 = build(x => 0.3 * sharpe(x, ['6m', '9m', '12m']) * 20 + 0.7 * x.score, [isCore, x => x.cls === 'TR_EQ' && (x.idx || []).includes('XU030'), x => x.cls === 'US_EQ', x => x.cls === 'TEFAS' && !x.hy], 5, 'Core', k => ['6m', '9m', '12m'].includes(k));
  const d21 = build(x => 0.4 * sharpe(x, ['1m', '2m', '3m', '6m']) * 20 + 0.6 * x.score, [x => x.cls === 'TR_EQ', x => x.cls === 'US_EQ', x => x.cls === 'US_EQ', x => x.cls === 'TEFAS' || x.cls === 'TR_ETF'], 5, 'Balanced', k => ['1m', '2m', '3m', '6m'].includes(k));
  const weekly = build(x => 0.5 * sharpe(x, ['1w', '2w', '3w', '1m']) * 20 + 0.5 * x.score, [x => bucket(x) === 'Low', x => bucket(x) === 'Medium', x => bucket(x) === 'High'], 5, 'Tactical', k => ['1w', '2w', '3w', '1m'].includes(k));
  return { weekly, d21, d30 };
}

/* ---------- alerts and brief ---------- */
function holdingsView(holdings, packages, scoredMap, M, S) {
  S = S || DEFAULT_SETTINGS; const rows = [];
  for (const h of holdings || []) rows.push({ src: 'Holding', symbol: h.symbol, qty: +h.qty || 0, cost: +h.cost || 0, buyDate: h.buyDate, paid: h.paidTRY || h.paidTL || null, pending: 0, span: h.span || null, spanDays: h.spanDays || null, target: h.target, stop: h.stop, rule: h.rule,
    exitDate: h.exitDate || (h.spanDays && h.buyDate ? addDays(h.buyDate, h.spanDays) : null), exitWhy: h.exitWhy || null, trail: h.trail || null, fxAt: h.fx || null });
  for (const p of packages || []) for (const l of p.lines || []) { const filled = l.filled ?? l.amount;
    rows.push({ src: p.name, pkg: p.id, symbol: l.symbol, qty: +l.qty || 0, cost: +l.priceAt || 0, buyDate: p.date, paid: filled, planned: l.amount, pending: Math.max(0, (+l.amount || 0) - (+filled || 0)), xuAt: p.xu100At || null, span: l.span, spanDays: l.spanDays, target: l.target, stop: l.stop,
      exitDate: l.exitDate || (l.spanDays ? addDays(p.date, l.spanDays) : null), exitWhy: l.exitWhy || null, trail: l.trail || null, fxAt: p.usdtryAt || null }); }
  for (const r of rows) {
    const x = scoredMap[r.symbol]; r.x = x; const px = x && x.e.price; const fx = x && x.ccy === 'USD' ? (M.usdtry || 49.5) : 1;
    r.heldDays = r.buyDate ? Math.max(0, Math.floor((new Date(M.today) - new Date(r.buyDate)) / 864e5)) : null;
    r.posValue = px && r.qty ? px * r.qty * fx : (r.paid || r.cost * r.qty * fx);
    if (!(px && r.qty)) { r.estimated = true; if (x && x.e.isProxy && r.xuAt && M.xu100 && r.paid) r.posValue = r.paid * M.xu100 / r.xuAt; }
    r.pendingValue = r.pending ? r.pending * (1 + benchNet(S, r.heldDays || 0) / 100) : 0;
    r.value = r.posValue + r.pendingValue;
    r.pl = px && r.cost ? (px / r.cost - 1) * 100 : null;
    if (x && r.paid && r.posValue) { const gross = (r.posValue / r.paid - 1) * 100, exitC = costs(x, r.posValue, S, M).side / r.posValue * 100, g = gross - exitC; r.plNet = g - taxPct(x, g, (r.heldDays || 0) / 365, S); } else r.plNet = null;
    if (x && px && r.buyDate) { const cl = Array.isArray(x.closes) && x.closes.length ? x.closes : (Array.isArray(x.bars) ? x.bars : []); let pk = r.cost || px; for (const [d, c] of cl) if (d >= r.buyDate) pk = Math.max(pk, c); pk = Math.max(pk, px); r.peak = pk;
      const tl = trailLevel(x, S, pk); r.trailLevel = r.trail || tl.level ? (tl.mult ? tl.level : (r.trail ? pk * (1 - r.trail / 100) : tl.level)) : null; r.trailPct = tl.mult ? tl.pct : r.trail; r.trailMult = tl.mult; }
    r.bench = r.heldDays !== null ? benchNet(S, r.heldDays) : null; r.vsBench = r.plNet !== null && r.bench !== null ? r.plNet - r.bench : null;
  }
  return rows;
}
function alerts(ctx) {
  const { S, M, scoredMap, holdings, packages, regimeInfo } = ctx, out = [], rows = holdingsView(holdings, packages, scoredMap, M, S), tot = rows.reduce((a, r) => a + r.value, 0);
  if (tot > 0) {
    const core = rows.filter(r => r.x && (r.x.cls === 'TR_ETF' || (r.x.cls === 'TEFAS' && r.x.hy && r.x.sub === 'index'))).reduce((a, r) => a + r.value, 0) / tot * 100;
    const usd = rows.filter(r => r.x && r.x.ccy === 'USD').reduce((a, r) => a + r.value, 0) / tot * 100, tc = (100 - S.usdPct) * S.corePct / 100;
    // v2.2: the old core / USD sleeve targets are retired; each fund's own target mix (improvement engine) raises drift alerts instead
    void core; void usd; void tc;
  }
  const cash = (+S.cashTRY || 0) + (+S.cashUSD || 0) * (M.usdtry || 49.5), days = S.cashAsOf ? Math.max(0, Math.floor((new Date(M.today) - new Date(S.cashAsOf)) / 864e5)) : 0;
  if (cash > 0 && days >= 3) out.push({ level: 'warn', kind: 'cash', text: `Idle cash: ${fmtTRY(cash)} for ${days} days, about ${fmtTRY(cash * benchNet(S, days) / 100)} forgone against a ${benchLabel(S).replace('USD', 'TRY')}. Park it in a deposit until it is invested.` });
  for (const r of rows) { if (!r.x || !r.x.e.price) continue; const px = r.x.e.price, s = r.symbol + (r.pkg ? ' (' + r.src + ')' : '');
    if (r.target && px >= r.target) out.push({ level: 'good', kind: 'target', symbol: r.symbol, text: `${s} reached its target ${r.target.toFixed(2)}: take profit or roll to a new span.` });
    else if (r.stop && px <= r.stop) out.push({ level: 'bad', kind: 'stop', symbol: r.symbol, text: `${s} hit its stop ${r.stop.toFixed(2)}: exit or re-assess.` });
    if (r.exitDate && M.today >= addDays(r.exitDate, -3)) { const e2 = r.x.e, keep = (r.x.f && r.x.f.mom >= 50) && e2.above200 !== false; out.push({ level: M.today >= r.exitDate ? 'warn' : 'info', kind: 'span', symbol: r.symbol, text: `${s}: planned exit ${M.today >= r.exitDate ? 'was due' : 'is due'} on ${longDate(r.exitDate)} (${r.span || ''} span${r.exitWhy ? '; ' + r.exitWhy : ''}). Time-stop check: ${keep ? 'momentum still in the top half and price above the 200-day average — re-planning is allowed' : 'momentum or trend has faded — sell rather than extend'}.` }); }
    if (r.trailLevel && px <= r.trailLevel && r.peak > (r.cost || 0) * 1.02) out.push({ level: 'bad', kind: 'trail', symbol: r.symbol, text: `${s} closed below its trailing stop ${r.trailLevel.toFixed(2)} (${r.trailMult ? r.trailMult + ' × ATR' : (r.trailPct || 0).toFixed(0) + '%'} under the high of ${r.peak.toFixed(2)}): lock in the gain.` });
    if (r.pkg && r.planned && tot > 0) { const pk = (packages || []).find(p => p.id === r.pkg); const ptot = pk ? pk.lines.reduce((a, l) => a + (+l.amount || 0), 0) : 0, pval = pk ? rows.filter(q => q.pkg === r.pkg).reduce((a, q) => a + q.value, 0) : 0; if (ptot && pval) { const wPlan = r.planned / ptot, wNow = r.value / pval, drift = wNow / wPlan - 1; if (Math.abs(drift) > 0.2 && Math.abs(wNow - wPlan) > 0.02) out.push({ level: 'info', kind: 'drift', symbol: r.symbol, text: `${s} is ${(wNow * 100).toFixed(0)}% of its fund against a planned ${(wPlan * 100).toFixed(0)}% (${drift > 0 ? '+' : ''}${(drift * 100).toFixed(0)}% relative drift, band 20%): rebalance with new money first.` }); } }
    if (r.x.cls === 'TEFAS' && r.x.b51 && r.heldDays !== null && r.heldDays >= 300 && r.heldDays < 365) out.push({ level: 'info', kind: 'taxwait', symbol: r.symbol, text: `${s}: ${365 - r.heldDays} days until stopaj falls to 0% (${longDate(addDays(r.buyDate, 365))}). If you plan to sell, waiting saves ${S.taxTefas}% of the gain.` });
    if (r.x.score !== null && r.x.score < 30) out.push({ level: 'warn', kind: 'score', symbol: r.symbol, text: `${s}: score fell to ${r.x.score}; consider trimming.` });
    const e = r.x.e; if (e.r1m !== null && e.r1m < -(2 * e.volUsed / Math.sqrt(12))) out.push({ level: 'bad', kind: '2sigma', symbol: r.symbol, text: `${s} fell ${e.r1m.toFixed(1)}% in a month, beyond its 2σ band.` });
  }
  for (const p of packages || []) for (const t of p.tranches || []) if (t.status === 'pending' && t.date <= addDays(M.today, 2) && !(t.condition && !t.condition.metAt)) out.push({ level: 'info', kind: 'tranche', text: `${p.name}: buying tranche ${t.n} (${fmtTRY(t.lines.reduce((a, l) => a + l.amount, 0))}) is due on ${longDate(t.date)}. See Orders.` });
  const ages = Object.values(scoredMap).map(x => x.asOf).filter(Boolean).sort(); const latest = ages[ages.length - 1];
  if (latest) { const d = Math.floor((new Date(M.today) - new Date(latest)) / 864e5); if (d > 5) out.push({ level: 'warn', kind: 'stale', text: `Prices are ${d} days old; run a refresh.` }); }
  return out;
}
function sellList(ctx) { return alerts(ctx).filter(a => ['target', 'stop', 'span', 'score', '2sigma', 'trail', 'taxwait'].includes(a.kind)); }
function brief(ctx) {
  const { S, M, regimeInfo: r } = ctx, x = r.xu || {};
  const head = r.name === 'contrarian' ? `BIST 100 is ${r.dd.toFixed(0)}% below its 52-week high: contrarian regime.` : r.name === 'correction' ? `BIST 100 is ${r.dd.toFixed(0)}% off its high: correction, stay on plan.` : r.name === 'trend' ? 'BIST 100 is near its high: trend regime.' : 'Market regime unknown: no index data.';
  const lead = `Policy rate ${M.policyRate ?? '—'}% against ${M.infl12m ?? '—'}% expected inflation gives a ${r.real.toFixed(1)}% real rate; ${benchLabel(S) === 'TRY deposit' ? 'a TRY time deposit pays' : benchLabel(S) === 'USD deposit' ? 'a USD deposit pays' : 'a TRY money-market fund clears'} about ${(S.principal === 'USD' ? r.hurdleUsd : r.hurdle).toFixed(1)}% a year after stopaj.` + (x.price ? ` BIST 100 ${Math.round(x.price).toLocaleString('en-US')}.` : '') + (M.usdtry ? ` USD/TRY ${M.usdtry.toFixed(2)}.` : '');
  const flip = r.name === 'contrarian' ? 'This changes if BIST 100 recovers to within 10% of its high or the real rate turns negative.' : 'This changes if BIST 100 falls more than 25% from its high or the real rate turns negative.';
  return { head, lead, flip };
}

/* ---------- report models ---------- */
function fmtTRY(v) { if (v === null || v === undefined || !isFinite(v)) return '—'; return DISPLAY.both ? money(v) : Math.round(v).toLocaleString('en-US') + ' TRY'; }
function fmtPct(v, d = 1) { return v === null || v === undefined || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + v.toFixed(d) + '%'; }
function fmtN(v, d = 2) { return v === null || v === undefined || !isFinite(v) ? '—' : (+v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
const DISCLAIMER = 'Generated automatically for the account holder\'s personal use from public market data (prices via Yahoo Finance and TEFAS, broker targets via hedeffiyat.com.tr, macro data via TCMB EVDS). Scores, spans, targets and picks come from fixed rules, not from a licensed investment adviser, and are not investment advice within the meaning of Capital Markets Law No. 6362. Expected returns are assumptions, not forecasts. Past performance does not indicate future results.';
function statementModel(ctx, from, to) {
  const { S, M, scoredMap, holdings, packages, picksDocs, regimeInfo } = ctx, b = brief(ctx), rows = holdingsView(holdings, packages, scoredMap, M, S);
  const tot = rows.reduce((a, r) => a + r.value, 0), paid = rows.reduce((a, r) => a + (r.paid || 0), 0);
  const xu = scoredMap.XU100 || ctx.inst.XU100 || {};
  const per = (x) => { const cl = Array.isArray(x.closes) ? x.closes : []; const a = cl.filter(c => c[0] <= from).pop(), z = cl.filter(c => c[0] <= to).pop(); return a && z ? (z[1] / a[1] - 1) * 100 : null; };
  const blocks = [
    { type: 'lead', text: b.head + ' ' + b.lead },
    { type: 'boxes', items: [['Portfolio value', fmtTRY(tot)], ['Invested', fmtTRY(paid)], ['BIST 100, period', fmtPct(per(xu))], [benchLabel(S) + ', a year net', regimeInfo.hurdle.toFixed(1) + '%']] },
    { type: 'h', text: 'Positions' },
    { type: 'table', cols: [['Symbol', 'l', 1], ['Source', 'l', 2], ['Qty', 'r', 1], ['Cost', 'r', 1], ['Price', 'r', 1], ['Value TRY', 'r', 1.3], ['P/L', 'r', 1], ['Span', 'l', 1]],
      rows: rows.length ? rows.map(r => [r.symbol, r.src, fmtN(r.qty, r.qty % 1 ? 3 : 0), fmtN(r.cost), r.x ? fmtN(r.x.e.price) : '—', fmtN(r.value, 0), fmtPct(r.pl), r.span || '—']) : [['No positions held.', '', '', '', '', '', '', '']] },
    { type: 'h', text: 'Packages' },
    { type: 'table', cols: [['Package', 'l', 3], ['Created', 'l', 1.3], ['Invested', 'r', 1.2], ['Value', 'r', 1.2], ['ROI', 'r', 0.8], ['Target', 'r', 0.8], ['Target date', 'l', 1.3]],
      rows: (packages || []).length ? packages.map(p => { const v = rows.filter(r => r.pkg === p.id).reduce((a, r) => a + r.value, 0); return [p.name, longDate(p.date), fmtN(p.total, 0), fmtN(v, 0), fmtPct((v / p.total - 1) * 100), fmtPct(p.target), p.targetDate ? longDate(p.targetDate) : 'not within 5 years']; }) : [['No packages yet.', '', '', '', '', '', '']] },
    { type: 'h', text: 'Markets' },
    { type: 'table', cols: [['Instrument', 'l', 2], ['Last', 'r', 1], ['Period', 'r', 1], ['1 month', 'r', 1], ['1 year', 'r', 1], ['As of', 'l', 1.2]],
      rows: [['XU100', 'BIST 100'], ['USD/TRY', 'USD / TRY'], ['EUR/USD', 'EUR / USD'], ['SPX', 'S&P 500']].filter(([s]) => (scoredMap[s] || ctx.inst[s])).map(([s, n]) => { const x = scoredMap[s] || ctx.inst[s]; const e = x.e || {}; return [n, fmtN(x.price, s.includes('/') ? 4 : 2), fmtPct(per(x)), fmtPct(e.r1m ?? x.r1m), fmtPct(e.r1y ?? x.r1y), x.asOf || '—']; }) },
    { type: 'h', text: 'Editors’ picks' }
  ];
  for (const [k, lab] of [['weekly', 'Weekly · tactical'], ['d21', '21-day · balanced'], ['d30', '30-day · core']]) {
    const p = (picksDocs || {})[k]; if (!p || !p.items) continue;
    blocks.push({ type: 'h3', text: `${lab} — issued ${longDate(p.date)}` });
    blocks.push({ type: 'table', cols: [['Symbol', 'l', 1], ['Sector', 'l', 2], ['Weight', 'r', 0.8], ['Risk', 'r', 0.7], ['Span', 'l', 1], ['Target', 'r', 1], ['Stop', 'r', 1], ['Since', 'r', 0.9]],
      rows: p.items.map(i => { const x = scoredMap[i.symbol]; const s = x && x.e.price && i.priceAt ? (x.e.price / i.priceAt - 1) * 100 : null; return [i.symbol, i.sector || '', i.share + '%', String(i.risk), i.hold || '', fmtN(i.target), fmtN(i.stop), fmtPct(s)]; }) });
  }
  const al = alerts(ctx); blocks.push({ type: 'h', text: 'Alerts' }); blocks.push({ type: 'list', items: al.length ? al.map(a => a.text) : ['Nothing needs attention.'] });
  blocks.push({ type: 'h', text: 'Cost schedule applied' });
  blocks.push({ type: 'table', cols: [['Venue', 'l', 1.6], ['Basis', 'l', 1.6], ['Commission', 'l', 2], ['BSMV', 'l', 1.2], ['Other', 'l', 2]], rows: [
    ['Akbank / Ak Yatirim', 'BIST shares, BYFs', '2.0‰ to 1.2‰ by monthly volume', S.bsmv + '% of commission', 'BIST fee ' + S.bistFee + ' per 100,000; spread by liquidity'],
    ['Midas', 'US shares, ETFs', S.usComm + ' USD per trade', S.bsmv + '% of commission', 'TRY↔USD spread ' + S.fxSpread + '% each way'],
    ['TEFAS via Akbank', 'Mutual funds', S.fundComm ? S.fundComm + '%' : 'none', '—', 'fund expense ratio']] });
  blocks.push({ type: 'disclaimer', text: DISCLAIMER });
  return { kicker: 'Private account · TRY investor', title: 'GNC Terminal', subtitle: 'Statement', meta: [`Period ${longDate(from)} – ${longDate(to)}`, `Issued ${longDate(M.today)}`, `Prices as of ${xu.asOf || '—'}`], blocks };
}
function fundId(pkg) { // GNC-F{yy}-{nnn}-{cls}-{check}: yy inception year, nnn fund number, cls T (all TRY) / U (all USD) / M (mixed), check = sum of UTF-16 codes of the string before it, mod 10
  if (pkg && pkg.fundId) return String(pkg.fundId);
  const yy = String((pkg && pkg.date) || '').slice(2, 4) || '00', nnn = String(Math.max(0, Math.round(+(pkg && pkg.n) || 0))).padStart(3, '0');
  const cc = ((pkg && pkg.lines) || []).map(l => l.ccy === 'USD' ? 'U' : 'T'), cls = cc.length && cc.every(c => c === 'T') ? 'T' : cc.length && cc.every(c => c === 'U') ? 'U' : 'M';
  const base = `GNC-F${yy}-${nnn}-${cls}`; let sum = 0; for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i);
  return `${base}-${sum % 10}`;
}
function spanWords(days) { const d = Math.round(+days || 0); if (d >= 360) return Math.round(d / 365) === 1 ? '12 months' : Math.round(d / 365) + ' years'; if (d >= 28) { const m = Math.round(d / 30.4); return m + (m === 1 ? ' month' : ' months'); } const w = Math.max(1, Math.round(d / 7)); return w + (w === 1 ? ' week' : ' weeks'); }
function fundTitle(name) { return String(name || 'GNC Investment Fund').replace(/\s*\([^)]*\)\s*$/, '').replace(/\bInv\.\s+/, 'Investment '); }
function packageModel(ctx, pkg) {
  const { S, M, scoredMap } = ctx, lines = pkg.lines || [], total = +pkg.total || lines.reduce((a, l) => a + (+l.amount || 0), 0) || 1;
  const an = packageAnalytics(lines.map(l => ({ symbol: l.symbol, amount: l.amount })), S, M, scoredMap);
  const rows = holdingsView([], [pkg], scoredMap, M, S), val = rows.reduce((a, r) => a + r.value, 0), xu = scoredMap.XU100 || (ctx.inst && ctx.inst.XU100) || {};
  const xOf = l => scoredMap[l.symbol], sectorOf = l => l.sector || (xOf(l) && xOf(l).e.sector) || 'Unclassified', ccyOf = l => l.ccy || (xOf(l) && xOf(l).ccy) || 'TRY', clsOf = l => l.cls || (xOf(l) && xOf(l).cls) || 'TR_EQ';
  const isUS = l => ccyOf(l) === 'USD' || clsOf(l) === 'US_EQ' || clsOf(l) === 'US_ETF', isFund = l => clsOf(l) === 'TEFAS' || clsOf(l) === 'TR_ETF';
  const bl = benchLabel(S), id = fundId(pkg), title = fundTitle(pkg.name), n = lines.length, pct0 = v => (v === null || v === undefined || !isFinite(v)) ? '—' : Math.round(v) + '%';
  const holdDays = +pkg.holdDays || Math.max(0, ...lines.map(l => +l.spanDays || 0)) || 182, holdLabel = pkg.holdLabel || spanWords(holdDays), start = pkg.date || M.today;
  const exit = lines.map(l => l.exitDate).filter(Boolean).sort().pop() || addDays(pkg.orderedAt || start, holdDays), t = holdDays / 365;
  const hz = an ? (an.hz.find(h => h.label === holdLabel) || an.hz.reduce((a, h) => Math.abs(h.t - t) < Math.abs(a.t - t) ? h : a, an.hz[0])) : null;
  const expAtExit = pkg.expAtExit ?? (hz ? hz.exp : null), benchAtExit = pkg.benchAtExit ?? (hz ? hz.bench : total * (1 + benchNet(S, holdDays, undefined, M) / 100)), edge = expAtExit === null ? null : expAtExit - benchAtExit;
  const amtOf = f => lines.filter(f).reduce((a, l) => a + (+l.amount || 0), 0), usAmt = amtOf(isUS), bistAmt = total - usAmt, usdAmt = amtOf(l => ccyOf(l) === 'USD'), tryAmt = total - usdAmt, usPct = usAmt / total * 100, bistPct = 100 - usPct;
  const vol = pkg.vol ?? (an ? an.vol : null), risk = pkg.risk ?? (an ? an.risk : null), riskClass = vol === null ? '—' : riskBucket(vol);
  const bySector = (() => { const m = {}; for (const l of lines) m[sectorOf(l)] = (m[sectorOf(l)] || 0) + (+l.amount || 0); return Object.entries(m).sort((a, b) => b[1] - a[1]); })();
  const sorted = lines.slice().sort((a, b) => (+b.amount || 0) - (+a.amount || 0)), largest = sorted[0], wOf = l => (+l.amount || 0) / total * 100;
  const reg = ctx.regimeInfo || regime(scoredMap.XU100 ? scoredMap : { XU100: xu }, M, S);
  const expPct = l => { const x = xOf(l); if (!x || !x.e || !x.e.price) return null; try { return scenario(x, +l.amount || 0, t, S, M, x.z).exp.roi * 100; } catch (_) { return null; } };
  const trailWords = l => { const x = xOf(l), e = x && x.e; if (e && e.atr && !e.atrApprox) return `${S.trailAtr || 3}×ATR below the peak (≈${Math.round(l.trail || trailLevel(x, S, e.price).pct)}%)`; const p = l.trail || (e ? Math.round(trailLevel(x, S, e.price || 1).pct) : null); return p ? `${p}% below the highest close` : 'none'; };
  const estimated = rows.filter(r => r.estimated).map(r => r.symbol), proxies = lines.filter(l => xOf(l) && xOf(l).e.isProxy).map(l => l.symbol), flagged = lines.map(l => [l.symbol, xOf(l) ? xOf(l).e.flags.filter(f => f !== 'proxy') : ['no data']]).filter(([, f]) => f.length);
  const monthMarks = []; for (let d = addMonths(start, 1); d < exit; d = addMonths(d, 1)) monthMarks.push({ date: d, label: longDate(d).replace(/,.*$/, '').replace(/^(\w{3})\w*/, '$1'), kind: 'review' });
  const tranches = (pkg.tranches || []).map(tr => ({ date: tr.date, label: `T${tr.n}`, kind: 'tranche' }));
  const blocks = [
    { type: 'h', text: 'The fund at a glance' },
    { type: 'tombstone', lines: [title, `Fund ID ${id}`, `Inception ${longDate(start)} · hold ${holdLabel} · planned exit ${longDate(exit)}`, `${fmtTRY(total)} invested across ${n} line${n === 1 ? '' : 's'} · ${pct0(bistPct)} BIST / ${pct0(usPct)} US`,
      `Expected ${fmtTRY(expAtExit)} at exit against ${fmtTRY(benchAtExit)} in a ${bl}`, `Risk class ${riskClass}${risk !== null ? ' (' + risk + '/100' + (vol !== null ? ', volatility ' + Math.round(vol) + '% a year' : '') + ')' : ''}`] },
    { type: 'boxes', items: [['Invested', fmtTRY(total)], ['Expected at exit', fmtTRY(expAtExit)], [`${bl}, same ${holdLabel}`, fmtTRY(benchAtExit)], ['Edge', edge === null ? '—' : (edge >= 0 ? '+' : '−') + fmtTRY(Math.abs(edge))]] },
    { type: 'h', text: 'Where the money is' },
    { type: 'exhibit', kind: 'pie', title: 'Industry distribution', series: bySector.map(([name, v]) => ({ name, value: v, label: fmtTRY(v) })), note: `Amount invested by the industry of each line; ${bySector.length} industr${bySector.length === 1 ? 'y' : 'ies'} across ${n} line${n === 1 ? '' : 's'}.` },
    { type: 'exhibit', kind: 'hbar', title: 'Market distribution', series: [{ name: 'By exchange', header: true }, { name: 'BIST (Borsa Istanbul)', value: bistAmt, label: `${fmtTRY(bistAmt)} · ${pct0(bistPct)}` }, { name: 'US exchanges', value: usAmt, label: `${fmtTRY(usAmt)} · ${pct0(usPct)}` },
      { name: 'By currency', header: true }, { name: 'TRY-denominated', value: tryAmt, label: `${fmtTRY(tryAmt)} · ${pct0(tryAmt / total * 100)}` }, { name: 'USD-denominated', value: usdAmt, label: `${fmtTRY(usdAmt)} · ${pct0(usdAmt / total * 100)}` }], note: usdAmt ? `USD lines are valued at USD/TRY ${fmtN(M.usdtry || 49.5)}.` : 'Every line is bought and valued in Turkish lira.' },
    { type: 'exhibit', kind: 'timeline', title: 'Horizon', start, end: exit, today: M.today, marks: [{ date: start, label: 'Inception', kind: 'start' }, ...tranches, ...monthMarks, { date: exit, label: 'Exit', kind: 'exit' }],
      note: `Hold ${holdLabel} from inception; ${tranches.length > 1 ? tranches.length + ' buying tranches ' + (pkg.trWeeks || 2) + ' weeks apart (T1–T' + tranches.length + '); ' : ''}monthly review points; every line shares the exit date of ${longDate(exit)}.` },
    { type: 'h', text: 'Why this fund' }
  ];
  if (pkg.reason) blocks.push({ type: 'quote', text: pkg.reason, by: 'the account holder, at creation' });
  blocks.push({ type: 'p', text: `Market regime. ${reg.name === 'contrarian' ? `BIST 100 is ${Math.round(reg.dd)}% below its 52-week high, a contrarian regime in which staged buying and a long hold are favoured.` : reg.name === 'correction' ? `BIST 100 is ${Math.round(reg.dd)}% off its 52-week high, a correction: the plan stays as drawn and the tranches spread the entry.` : reg.name === 'trend' ? 'BIST 100 is near its 52-week high, a trend regime in which momentum lines are held to their span.' : 'The market regime is unknown because no index data is stored.'} The policy rate of ${M.policyRate ?? '—'}% against ${M.infl12m ?? '—'}% expected inflation gives a real rate of about ${reg.real.toFixed(1)}%.` });
  blocks.push({ type: 'p', text: `Expected edge. Over ${holdLabel} the rules expect the fund to be worth ${fmtTRY(expAtExit)}${hz ? ` (range ${fmtTRY(hz.worst)} to ${fmtTRY(hz.best)})` : ''}, against ${fmtTRY(benchAtExit)} in a ${bl} after stopaj, ${edge === null ? 'an edge that cannot be computed' : edge >= 0 ? `an edge of ${fmtTRY(edge)}` : `a shortfall of ${fmtTRY(-edge)}`} on ${fmtTRY(total)}. The figures are net of entry and exit costs and tax; they are rule-based assumptions, not forecasts.` });
  if (an) blocks.push({ type: 'p', text: `Diversification. The fund is ${an.diversification.label}: ${an.diversification.note}. Average pairwise correlation between the lines is ${an.avgCorr === null ? 'not measurable' : an.avgCorr.toFixed(2)}, fund volatility ${an.vol.toFixed(0)}% a year against ${Math.round(Math.max(...lines.map(l => xOf(l) ? xOf(l).e.volUsed : 0)))}% for the most volatile line.` });
  if (an) blocks.push({ type: 'p', text: `Volatility target. ${an.realVol6m ? `Realised six-month volatility of the basket is ${an.realVol6m.toFixed(0)}% against a ${an.volTarget}% target, so ${an.investShare < 0.999 ? `${Math.round(an.investShare * 100)}% of the money is invested now and ${fmtTRY(an.park)} waits in a ${bl} until volatility falls` : 'the whole amount can be invested'}` : `Too little history to measure realised volatility; the ${an.volTarget}% target is applied to the expected ${an.vol.toFixed(0)}%`}${an.crashGuard ? '. Crash guard: six-month volatility is more than 1.5 times the one-year figure, so new money waits' : ''}.` });
  blocks.push({ type: 'h', text: 'Exit plan — when and why' });
  blocks.push({ type: 'schedule', size: 9, cols: [['Line', 'l', 0.8], ['Planned exit', 'l', 1.3], ['Target', 'r', 0.9], ['Stop', 'r', 0.9], ['Trailing stop', 'l', 2.1], ['Trigger', 'l', 3.1]],
    rows: lines.map(l => [l.symbol, l.exitDate ? longDate(l.exitDate) : longDate(exit), fmtN(l.target), fmtN(l.stop), trailWords(l), 'whichever comes first: target, stop, trail, or the exit date']),
    footnotes: ['Targets and stops are in the line’s own currency and were set at creation: the target is the expected price plus half a standard deviation of the span, the stop 2.5×ATR or 1.5× monthly volatility below the entry; the trailing stop only applies after a gain.'] });
  const b51 = lines.filter(l => xOf(l) && xOf(l).cls === 'TEFAS' && xOf(l).b51).map(l => l.symbol), usL = lines.filter(isUS).map(l => l.symbol), trEq = lines.filter(l => !isUS(l) && !isFund(l)).map(l => l.symbol);
  blocks.push({ type: 'list', items: [
    `Rebalance with new money first: a line more than 20% away from its planned weight (and at least 2 points of the fund) is brought back when the next money arrives, not by selling.`,
    `Fund stop: if the fund is ${fmtPct(pkg.stopPct ?? (an ? an.stopPct : null))} or worse within three months of inception, close every line and park the money in a ${bl}.`,
    `At the exit date (${longDate(exit)}) every open line is sold, unless its momentum is still in the top half of its peers and the price is above the 200-day average, in which case one new span may be planned.`,
    trEq.length ? `No tax lock on BIST shares (${trEq.join(', ')}): gains carry 0% stopaj, so a stop or target can be acted on any day.` : null,
    b51.length ? `Tax lock on ${b51.join(', ')}: stopaj on fund gains falls from ${S.taxTefas}% to 0% after one year; an exit before the anniversary pays the full rate.` : null,
    usL.length ? `US lines (${usL.join(', ')}): gains above ÜFE indexation are declared at ${S.usMarginal}%; the drag is lowest over a full year, and USD proceeds are converted at the ${S.fxSpread}% spread.` : null].filter(Boolean) });
  const since = addDays(M.today, -183);
  for (const l of sorted.slice(0, 2)) { const x = xOf(l); const cl = x && Array.isArray(x.closes) ? x.closes.filter(c => c[0] >= since && +c[1] > 0) : []; if (cl.length < 5) continue;
    blocks.push({ type: 'exhibit', kind: 'line', h: 140, title: `${l.symbol} — price path, six months, with target and stop`, series: [{ name: `${l.symbol} close (${ccyOf(l)})`, points: cl.map(c => [c[0], +(+c[1]).toFixed(2)]) }], refs: [l.target ? { label: 'Target ' + fmtN(l.target), value: l.target } : null, l.stop ? { label: 'Stop ' + fmtN(l.stop), value: l.stop } : null].filter(Boolean), note: `${wOf(l).toFixed(0)}% of the fund; planned exit ${longDate(l.exitDate || exit)}.` }); }
  blocks.push({ type: 'h', text: 'Holdings' });
  const wsum = lines.reduce((a, l) => { const e = expPct(l); return e === null ? a : a + e * wOf(l) / 100; }, 0);
  blocks.push({ type: 'schedule', size: 9.2, totals: true, cols: [['Line', 'l', 0.9], ['Industry', 'l', 2], ['Amount', 'r', 1.2], ['Weight', 'r', 0.8], ['Expected', 'r', 0.9], ['Target', 'r', 0.9], ['Stop', 'r', 0.9]],
    rows: [...lines.map(l => [l.symbol + (estimated.includes(l.symbol) || proxies.includes(l.symbol) ? ' *' : ''), sectorOf(l), fmtN(l.amount, 0), pct0(wOf(l)), fmtPct(expPct(l)), fmtN(l.target), fmtN(l.stop)]), ['Total', '', fmtN(total, 0), '100%', fmtPct(wsum), '', '']],
    footnotes: [`Expected is the rule-based net return of each line over the ${holdLabel} hold, after costs and tax; amounts in TRY at creation.`, ...(estimated.length || proxies.length ? [`* ${[...new Set([...estimated, ...proxies])].join(', ')}: value estimated${proxies.length ? ' through the proxy index (' + proxies.join(', ') + ')' : ''}${estimated.length ? '; not yet filled or no current price' : ''}.`] : [])] });
  blocks.push({ type: 'h', text: 'Risk factors' });
  const gateFail = lines.filter(l => xOf(l) && xOf(l).gate && !xOf(l).gate.ok).map(l => `${l.symbol} (${xOf(l).gate.why.join(', ')})`), caps = an ? an.caps : [];
  blocks.push({ type: 'risks', items: [
    usdAmt ? `Currency. ${pct0(usdAmt / total * 100)} of the fund is in USD assets whose TRY value assumes USD/TRY rises ${fmtN(fxRate(S, M), 1)}% a year${S.surveyFx !== false && num(M.usdtry12m) ? ' (TCMB market participants survey)' : ''} with ${S.fxVol}% volatility; a stronger lira lowers that leg, and conversion costs ${S.fxSpread}% each way.` : `Currency concentration. The whole fund is in lira assets with no dollar hedge; a lira shock like August 2018 (TRY −30%, BIST −20% × beta) is modelled to change the value by ${an ? fmtTRY(an.stress) : '—'}.`,
    `Concentration. ${largest ? `${largest.symbol} is the largest line at ${pct0(wOf(largest))} of the fund` : 'The fund has no lines'}${caps.length ? `; the caps are breached: ${caps.map(c => c.kind === 'sector' ? `${c.sector} ${c.w.toFixed(0)}% against ${c.cap}%` : c.kind === 'big' ? `positions above 5% total ${c.w.toFixed(0)}% against ${c.cap}%` : `${c.symbol} ${c.w.toFixed(0)}% against ${c.cap}%`).join('; ')}` : '; no single-stock, fund or sector cap is breached'}. ${an ? `The fund is ${an.diversification.label}; a single-stock event moves the whole fund by its weight.` : ''}`,
    gateFail.length ? `Liquidity gate. ${gateFail.join('; ')} do not pass the gate today; stops and the exit may fill at worse prices than the close.` : `Liquidity gate. Every line passes the gate today (30-day turnover above ${(S.gateTurnoverTRY / 1e6).toFixed(0)} m TRY or ${(S.gateTurnoverUSD / 1e6).toFixed(0)} m USD, price not stale); a line that fails later may have to be sold in pieces.`,
    bistPct > 99 || usPct > 99 ? `Single exchange. The fund trades on ${bistPct > 99 ? 'Borsa Istanbul' : 'US exchanges'} only, so it carries one country’s rate, currency and political risk; a sleeve on the other exchange would lower volatility.` : `Two exchanges. ${pct0(bistPct)} BIST and ${pct0(usPct)} US; the two legs settle on different days and in different currencies, so the exit is executed in two steps.`,
    `Regime. ${reg.name === 'contrarian' ? `BIST 100 is ${Math.round(reg.dd)}% below its high; recoveries from here are uneven and the time stop may expire before the rebound.` : reg.name === 'correction' ? `BIST 100 is ${Math.round(reg.dd)}% off its high; a deeper fall to 25% would turn the regime contrarian and the plan would favour waiting.` : reg.name === 'trend' ? 'BIST 100 is near its high; a fall of more than 10% would end the trend regime and the momentum lines lose their premise.' : 'The regime is unknown.'} ${reg.real < 0 ? 'The real rate is negative.' : `The plan changes if the real rate (${reg.real.toFixed(1)}%) turns negative.`}`,
    `Data. ${flagged.length ? `Flags: ${flagged.map(([s, f]) => s + ' — ' + f.join(', ')).join('; ')}. ` : ''}${proxies.length ? `${proxies.join(', ')} ${proxies.length === 1 ? 'is' : 'are'} priced through a proxy index. ` : ''}Prices are delayed Yahoo Finance and TEFAS closes${xu.asOf ? ' as of ' + xu.asOf : ''}; expected returns, targets and stops come from fixed rules and will be wrong in detail.`] });
  blocks.push({ type: 'h', text: 'Appendix A — Span analysis', num: false });
  blocks.push({ type: 'table', size: 8, cols: [['Line', 'l', 0.9], ['Entry', 'r', 0.9], ['Now', 'r', 0.9], ['P/L', 'r', 0.8], ['Own span', 'l', 1.1], ['Fund span', 'l', 1.1], ['Break-even', 'r', 1], ['Expected', 'r', 0.9], ['Worst', 'r', 0.9], ['Best', 'r', 0.9]],
    rows: lines.map(l => { const x = xOf(l), px = x && x.e.price, sc = x && px ? scenario(x, +l.amount || 0, t, S, M, x.z) : null; return [l.symbol, fmtN(l.priceAt), fmtN(px), fmtPct(px && l.priceAt ? (px / l.priceAt - 1) * 100 : null), l.ownSpan || l.span || '—', holdLabel, fmtN(l.breakeven), sc ? fmtN(sc.exp.net, 0) : '—', sc ? fmtN(sc.worst.net, 0) : '—', sc ? fmtN(sc.best.net, 0) : '—']; }) },
    { type: 'source', text: `GNC Terminal rule set; entry prices from fills, current prices as of ${xu.asOf || M.today}. Own span is the line’s best span on its own; fund span is the shared hold. Expected, worst and best are TRY values of the line at the fund span: worst two standard deviations below, best one above.` });
  if (an) {
    blocks.push({ type: 'h3', text: 'Expected outcome by horizon (net of costs and tax)' });
    blocks.push({ type: 'table', size: 8, cols: [['Horizon', 'l', 1.1], ['Worst', 'r', 1.1], ['Expected', 'r', 1.1], ['Best', 'r', 1.1], ['Tax', 'r', 0.9], [bl, 'r', 1.2], ['ROI expected', 'r', 1]], rows: an.hz.map(h => [h.label + (h.label === holdLabel ? ' ★' : ''), fmtN(h.worst, 0), fmtN(h.exp, 0), fmtN(h.best, 0), fmtN(h.tax, 0), fmtN(h.bench, 0), fmtPct((h.exp / an.total - 1) * 100)]) }, { type: 'source', text: `GNC Terminal rule set; worst is two standard deviations below the expected value, best one above; ★ marks the fund’s span.` });
    blocks.push({ type: 'h3', text: 'Weights' });
    blocks.push({ type: 'table', size: 8, cols: [['By sector', 'l', 2.4], ['%', 'r', 0.7], ['By class', 'l', 1.6], ['%', 'r', 0.7], ['By currency / risk', 'l', 1.6], ['%', 'r', 0.7]],
      rows: Array.from({ length: Math.max(an.bySector.length, an.byClass.length, an.byCcy.length + an.byRisk.length) }, (_, i) => { const cr = [...an.byCcy, ...an.byRisk.map(([k, v]) => [k + ' risk', v])]; return [an.bySector[i]?.[0] || '', an.bySector[i] ? an.bySector[i][1].toFixed(0) : '', an.byClass[i]?.[0] || '', an.byClass[i] ? an.byClass[i][1].toFixed(0) : '', cr[i]?.[0] || '', cr[i] ? cr[i][1].toFixed(0) : '']; }) });
    blocks.push({ type: 'p', text: `Risk: volatility ${an.vol.toFixed(1)}% a year, beta ${an.beta.toFixed(2)}, average pairwise correlation ${an.avgCorr === null ? 'n/a' : an.avgCorr.toFixed(2)}, risk score ${an.risk}/100. Stress test (Aug-2018-style lira shock: TRY −30%, BIST −20%×beta): ${fmtTRY(an.stress)}. Value now ${fmtTRY(val)} (${fmtPct((val / total - 1) * 100)} since inception${pkg.xu100At && xu.price ? `; BIST 100 ${fmtPct((xu.price / pkg.xu100At - 1) * 100)}` : ''}).` });
  }
  if (ctx.fx) { const flows = lines.flatMap(l => { const f = l.fills && l.fills.length ? l.fills.map(q => ({ date: q.date, amount: +q.amount || 0 })) : [{ date: start, amount: +(l.filled ?? l.amount) || 0 }], rest = (+l.amount || 0) - f.reduce((a, q) => a + q.amount, 0); return rest > 1 ? [...f, { date: start, amount: rest }] : f; }), alt = alternatives(flows, M.today, ctx);
    blocks.push({ type: 'h3', text: 'The same money elsewhere since ' + longDate(start) }, { type: 'table', size: 8, cols: [['Alternative', 'l', 2.4], ['Value', 'r', 1.4], ['Gain', 'r', 1.2], ['Return', 'r', 0.9], ['In USD', 'r', 1]], rows: [['This fund', fmtN(val, 0), fmtN(val - alt.invested, 0), fmtPct((val / alt.invested - 1) * 100), '$' + fmtN(val / ctx.fx(M.today), 0)], ...alt.rows.map(r => [r.name, fmtN(r.value, 0), fmtN(r.gain, 0), fmtPct(r.pct), '$' + fmtN(r.usd, 0)])] }); }
  blocks.push({ type: 'h', text: 'Appendix B — Costs and taxes', num: false });
  blocks.push({ type: 'table', size: 8, cols: [['Venue', 'l', 1.6], ['Basis', 'l', 1.6], ['Commission', 'l', 2], ['BSMV', 'l', 1.2], ['Other', 'l', 2]], rows: [
    ['Akbank / Ak Yatirim', 'BIST shares, BYFs', '2.0‰ to 1.2‰ by monthly volume', S.bsmv + '% of commission', 'BIST fee ' + S.bistFee + ' per 100,000; spread by liquidity'],
    ['Midas', 'US shares, ETFs', S.usComm + ' USD per trade', S.bsmv + '% of commission', 'TRY↔USD spread ' + S.fxSpread + '% each way'],
    ['TEFAS via Akbank', 'Mutual funds', S.fundComm ? S.fundComm + '%' : 'none', '—', 'fund expense ratio']] });
  blocks.push({ type: 'table', size: 8, cols: [['Line', 'l', 0.9], ['Class', 'l', 1.3], ['Tax treatment', 'l', 2.4], ['Round trip', 'r', 0.9], ['Entry cost', 'r', 1.1]], rows: lines.map(l => { const x = xOf(l); const c = x ? costs(x, +l.amount || 0, S, M) : null; return [l.symbol, CLASSES[clsOf(l)] || clsOf(l), x ? taxLabel(x, S) : '—', c && c.roundTripPct !== null ? fmtN(c.roundTripPct, 2) + '%' : '—', c ? fmtN(c.side, 0) : '—']; }) },
    { type: 'source', text: `Broker schedules as stored in Settings; entry cost in TRY at the planned amount${an ? `, ${fmtTRY(an.entry)} for the fund` : ''}. ${bl} benchmark at ${S.depRate}% gross${S.depRateAsOf ? ' (' + S.depRateAsOf + ')' : ''}, rolled every ${S.depRoll} days, stopaj ${S.depTax6m}%.` });
  blocks.push({ type: 'h', text: 'Appendix C — Methodology and sources', num: false });
  blocks.push({ type: 'p', text: `Expected returns build from the ${bl} rate plus an equity premium (${S.erpTr}% for BIST, ${S.erpUs}% for US stocks on a beta shrunk half-way to 1), a value tilt from the earnings yield, and horizon-specific alphas from short-term reversal, 12-1 momentum and the 200-day trend; USD assets add the ${fmtN(fxRate(S, M), 1)}% a year USD/TRY view${S.surveyFx !== false && num(M.usdtry12m) ? ' from the TCMB market participants survey' : ''}.${S.dynDeposit !== false && num(M.policy12m) !== null ? ` The deposit benchmark follows a path from today’s ${S.depRate}% toward the surveyed 12-month policy rate of ${M.policy12m}% plus the current deposit–policy spread.` : ''} Costs and tax are deducted per line as in Appendix B.` });
  blocks.push({ type: 'p', text: `Risk uses each line’s annualised volatility (floored by class) and the correlation of stored daily returns, defaulting to 0.5 within a sector-mix and 0.15 across currencies; the worst case is two standard deviations below the expected value over the span and the best case one above. Targets are the expected price plus half a standard deviation; stops are ${S.stopAtr}×ATR(22) or 1.5× monthly volatility below entry; trailing stops are ${S.trailAtr}×ATR below the highest close (Chandelier exit).` });
  blocks.push({ type: 'p', text: `Sources: prices via Yahoo Finance (BIST and US, delayed) and TEFAS (daily NAV); fundamentals via İş Yatırım and Yahoo; policy rate, inflation expectations and CPI via TCMB EVDS${M.policyAsOf || M.cpiAsOf ? ' as of ' + (M.policyAsOf || M.cpiAsOf) : ''}; broker targets via hedeffiyat.com.tr. Fund ID ${id} is derived from the inception year, fund number and currency class with a check digit.` });
  blocks.push({ type: 'disclaimer', text: DISCLAIMER });
  return { kicker: 'Investment package', cover: 'fund', title, titleLine2: `(${longDate(start)})`, subtitle: 'Package Report', preparedFor: S.holderName || 'the account holder', preparedBy: 'GNC Capital Investment Co.', fundId: id, bodySize: 11, coverLegend: false,
    meta: [`Issued ${longDate(M.today)}`, `Prices as of ${xu.asOf || '—'}`], blocks };
}
function tearsheetModel(ctx, x) {
  const { S, M } = ctx, e = x.e, hz = x.hz;
  const blocks = [
    { type: 'lead', text: explain(x, S) },
    { type: 'boxes', items: [['Price', fmtN(e.price) + ' ' + x.ccy], ['Score', x.score === null ? '—' : x.score + '/100'], ['Best span', x.best ? x.best.label : 'avoid'], ['Expected, 12 months net', fmtPct(hz.rows[5].net)]] },
    { type: 'h', text: 'Profile' },
    { type: 'table', cols: [['Field', 'l', 1.5], ['Value', 'l', 2], ['Field', 'l', 1.5], ['Value', 'l', 2]], rows: [
      ['Class', CLASSES[x.cls], 'Sector', e.sector], ['1 week / 1 month', fmtPct(e.r1w) + ' / ' + fmtPct(e.r1m), '3 / 6 months', fmtPct(e.r3m) + ' / ' + fmtPct(e.r6m)],
      ['1 year', fmtPct(e.r1y), 'Volatility', e.volUsed.toFixed(1) + '%'], ['Beta', e.beta.toFixed(2), 'RSI 14', e.rsi === null || e.rsi === undefined ? '—' : e.rsi.toFixed(0)],
      ['P/E', e.pe ? e.pe.toFixed(1) : '—', 'Dividend yield', e.div === null || e.div === undefined ? '—' : e.div.toFixed(2) + '%'], ['52-week high / low', fmtN(e.hi52) + ' / ' + fmtN(e.lo52), 'Tax', x.taxRate]] },
    { type: 'h', text: 'Factor groups (percentile within peers)' },
    { type: 'table', cols: [['Group', 'l', 2], ['Percentile', 'r', 1], ['Group', 'l', 2], ['Percentile', 'r', 1]], rows: (() => { const g = GROUPS.map(([k, l]) => [l, x.f[k] === null || x.f[k] === undefined ? '—' : String(x.f[k])]); const r = []; for (let i = 0; i < g.length; i += 2) r.push([...g[i], ...(g[i + 1] || ['', ''])]); return r; })() },
    { type: 'h', text: 'Spans' },
    { type: 'table', cols: [['Span', 'l', 1], ['Gross', 'r', 1], ['Costs', 'r', 1], ['Tax', 'r', 0.8], ['Net', 'r', 1], ['Benchmark', 'r', 1], ['Risk (1σ)', 'r', 1], ['Target', 'r', 1], ['Stop', 'r', 1], ['Conf.', 'l', 0.9]],
      rows: hz.rows.map(r => [r.label + (x.best && r.k === x.best.k ? ' ★' : ''), fmtPct(r.mu), fmtPct(-r.costPct, 2), fmtPct(-r.tax), fmtPct(r.net), fmtPct(r.mm), r.sig.toFixed(1) + '%', fmtN(r.target), fmtN(r.stop), r.locked ? 'tax lock' : r.conf]) },
    ...(() => { const ep = exitPlan(x, S, M, { cons: ctx.cons && ctx.cons[x.symbol] }); return ep ? [{ type: 'h', text: 'Exit plan' }, { type: 'lead', text: ep.text }, { type: 'list', items: ep.rules }] : []; })(),
    { type: 'p', text: `Expected return build-up: ${Object.entries(hz.parts).map(([k, v]) => k + ' ' + (typeof v === 'number' ? v.toFixed(2) : v)).join(', ')}; alpha by horizon from reversal ${hz.alphas.aRev.toFixed(1)}, momentum ${hz.alphas.aMom.toFixed(1)}, value ${hz.alphas.aVal.toFixed(1)}, trend ${hz.alphas.trend}. Costs at an order of ${fmtTRY(hz.amount)}.` },
    { type: 'disclaimer', text: DISCLAIMER }
  ];
  return { kicker: 'Instrument tear sheet', title: `${x.symbol} · ${x.name || ''}`, subtitle: 'Tear sheet', meta: [CLASSES[x.cls] + ' · ' + x.ccy, `Issued ${longDate(M.today)}`, `Prices as of ${x.asOf || '—'}`], blocks };
}

/* ---------- renderers ---------- */
const PDF_MAP = { 'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', '−': '-', '≈': '~', 'σ': 's', 'Σ': 'S', '→': '->', '↔': '<->', '✓': 'v', '★': '*', '≥': '>=', '≤': '<=', ' ': ' ', 'Ü': 'U', 'ü': 'u' };
async function renderPDF(model, PDFLib) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib, doc = await PDFDocument.create();
  doc.setTitle(model.title + ' — ' + model.subtitle); doc.setAuthor('GNC Terminal'); doc.setCreator('GNC Terminal');
  const F = { serif: await doc.embedFont(StandardFonts.TimesRoman), serifB: await doc.embedFont(StandardFonts.TimesRomanBold), sans: await doc.embedFont(StandardFonts.Helvetica), sansB: await doc.embedFont(StandardFonts.HelveticaBold), serifI: await doc.embedFont(StandardFonts.TimesRomanItalic) };
  const clean = s => { let t = String(s ?? ''); for (const [a, b] of Object.entries(PDF_MAP)) t = t.split(a).join(b); return Array.from(t).map(ch => { try { F.sans.encodeText(ch); return ch; } catch (_) { return '?'; } }).join(''); };
  const W = 595.28, H = 841.89, mL = 42, mR = 42, mT = 46, mB = 50, cw = W - mL - mR, ink = rgb(0.07, 0.07, 0.07), grey = rgb(0.38, 0.38, 0.38), rule = rgb(0.8, 0.8, 0.8), pos = rgb(0.04, 0.36, 0.17), neg = rgb(0.63, 0.07, 0.07);
  let page, y, pageNo = 0;
  const newPage = () => { page = doc.addPage([W, H]); pageNo++; y = H - mT; if (pageNo > 1) { page.drawText(clean(model.title + ' · ' + model.subtitle), { x: mL, y: H - 28, size: 7.5, font: F.sans, color: grey }); page.drawLine({ start: { x: mL, y: H - 32 }, end: { x: W - mR, y: H - 32 }, thickness: 0.5, color: rule }); y = H - mT - 4; } page.drawText(clean('Page ' + pageNo), { x: W - mR - 30, y: 26, size: 7.5, font: F.sans, color: grey }); };
  const need = h => { if (y - h < mB) newPage(); };
  const wrap = (text, font, size, width) => { const words = clean(text).split(/\s+/), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (font.widthOfTextAtSize(t, size) > width && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };
  const para = (text, font, size, color = ink, lead = 1.35) => { for (const ln of wrap(text, font, size, cw)) { need(size * lead); page.drawText(ln, { x: mL, y: y - size, size, font, color }); y -= size * lead; } };
  newPage();
  page.drawText(clean(model.kicker.toUpperCase()), { x: mL, y: y - 8, size: 7.5, font: F.sans, color: grey });
  { const tt = clean(model.title), maxW = W - mL - mR - 180; let ts = 26; while (ts > 14 && F.serifB.widthOfTextAtSize(tt, ts) > maxW) ts -= 1; page.drawText(tt, { x: mL, y: y - 36, size: ts, font: F.serifB, color: ink }); }
  page.drawText(clean(model.subtitle.toUpperCase()), { x: mL, y: y - 50, size: 8, font: F.sans, color: grey });
  model.meta.forEach((m, i) => { const t = clean(m), w = F.sans.widthOfTextAtSize(t, 8); page.drawText(t, { x: W - mR - w, y: y - 16 - i * 11, size: 8, font: i === 0 ? F.sansB : F.sans, color: ink }); });
  y -= 58; page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 1.2, color: ink }); y -= 2.5; page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 0.6, color: ink }); y -= 10;
  for (const b of model.blocks) {
    if (b.type === 'lead') { para(b.text, F.serif, 11, ink, 1.4); y -= 4; }
    else if (b.type === 'p') { para(b.text, F.serif, 9.5, ink); y -= 4; }
    else if (b.type === 'h') { need(40); y -= 10; page.drawText(clean(b.text.toUpperCase()), { x: mL, y: y - 9, size: 8.5, font: F.sansB, color: ink }); y -= 13; page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 0.8, color: ink }); y -= 6; }
    else if (b.type === 'h3') { need(30); y -= 4; page.drawText(clean(b.text), { x: mL, y: y - 10, size: 10.5, font: F.serifB, color: ink }); y -= 16; }
    else if (b.type === 'boxes') { need(48); const n = b.items.length, bw = cw / n; page.drawRectangle({ x: mL, y: y - 42, width: cw, height: 42, borderColor: ink, borderWidth: 0.8 }); b.items.forEach(([k, v], i) => { const x0 = mL + i * bw; if (i) page.drawLine({ start: { x: x0, y }, end: { x: x0, y: y - 42 }, thickness: 0.6, color: ink }); page.drawText(clean(k.toUpperCase()), { x: x0 + 6, y: y - 12, size: 6.5, font: F.sans, color: grey }); page.drawText(clean(v), { x: x0 + 6, y: y - 32, size: 14, font: F.serifB, color: /^\+/.test(v) ? pos : /^-/.test(v) ? neg : ink }); }); y -= 52; }
    else if (b.type === 'list') { for (const t of b.items) { const lines = wrap(t, F.sans, 8.5, cw - 12); lines.forEach((ln, i) => { need(12); if (!i) page.drawText('-', { x: mL, y: y - 8.5, size: 8.5, font: F.sans, color: ink }); page.drawText(ln, { x: mL + 10, y: y - 8.5, size: 8.5, font: F.sans, color: ink }); y -= 11.5; }); } y -= 4; }
    else if (b.type === 'disclaimer') { y -= 8; need(20); page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 0.8, color: ink }); y -= 6; para(b.text, F.serifI, 7.5, grey, 1.3); }
    else if (b.type === 'table') {
      const totW = b.cols.reduce((a, c) => a + c[2], 0), ws = b.cols.map(c => c[2] / totW * cw), size = 7.6, pad = 3;
      const head = () => { need(16); let x0 = mL; b.cols.forEach((c, i) => { const t = clean(String(c[0]).toUpperCase()), w = F.sansB.widthOfTextAtSize(t, 6.5); page.drawText(t, { x: c[1] === 'r' ? x0 + ws[i] - pad - w : x0 + pad, y: y - 9, size: 6.5, font: F.sansB, color: ink }); x0 += ws[i]; }); y -= 12; page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 0.7, color: ink }); y -= 2; };
      head();
      for (const r of b.rows) {
        const cells = r.map((v, i) => wrap(String(v ?? ''), F.sans, size, ws[i] - 2 * pad)), h = Math.max(1, ...cells.map(c => c.length)) * (size + 2.4) + 3.5;
        if (y - h < mB) { newPage(); head(); }
        let x0 = mL; cells.forEach((lines, i) => { const c = b.cols[i]; lines.forEach((ln, j) => { const w = F.sans.widthOfTextAtSize(ln, size), col = /^\+\d/.test(ln) ? pos : /^-\d/.test(ln) ? neg : ink; page.drawText(ln, { x: c[1] === 'r' ? x0 + ws[i] - pad - w : x0 + pad, y: y - size - 1 - j * (size + 2.4), size, font: F.sans, color: col }); }); x0 += ws[i]; });
        y -= h; page.drawLine({ start: { x: mL, y }, end: { x: W - mR, y }, thickness: 0.3, color: rule });
      }
      y -= 6;
    }
  }
  return await doc.save();
}
async function renderDOCX(model, docx) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageNumber, Footer, Header } = docx;
  const FONT = 'Times New Roman', SANS = 'Arial', P0 = { before: 0, after: 0, line: 240 };
  const blank = () => new Paragraph({ spacing: P0, children: [new TextRun({ text: '', font: FONT, size: 20 })] });
  const run = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: o.font || FONT, size: o.size || 20, bold: !!o.bold, italics: !!o.italics, color: o.color || '111111', allCaps: !!o.caps });
  const p = (text, o = {}) => new Paragraph({ spacing: P0, alignment: o.align || AlignmentType.LEFT, children: [run(text, o)] });
  const thin = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' }, thick = { style: BorderStyle.SINGLE, size: 8, color: '111111' }, none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const children = [];
  children.push(p(model.kicker, { font: SANS, size: 15, caps: true, color: '555555' }));
  children.push(p(model.title, { bold: true, size: 48 }));
  children.push(p(model.subtitle, { font: SANS, size: 16, caps: true, color: '555555' }));
  for (const m of model.meta) children.push(p(m, { font: SANS, size: 16 }));
  children.push(new Paragraph({ spacing: P0, border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '111111', space: 1 } }, children: [run('')] }));
  children.push(blank());
  for (const b of model.blocks) {
    if (b.type === 'lead') { children.push(p(b.text, { size: 23 })); children.push(blank()); }
    else if (b.type === 'p') { children.push(p(b.text, { size: 19 })); children.push(blank()); }
    else if (b.type === 'h') { children.push(new Paragraph({ spacing: P0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111111', space: 1 } }, children: [run(b.text, { font: SANS, size: 17, bold: true, caps: true })] })); children.push(blank()); }
    else if (b.type === 'h3') { children.push(p(b.text, { bold: true, size: 21 })); }
    else if (b.type === 'list') { for (const t of b.items) children.push(p('– ' + t, { font: SANS, size: 17 })); children.push(blank()); }
    else if (b.type === 'disclaimer') { children.push(new Paragraph({ spacing: P0, border: { top: { style: BorderStyle.SINGLE, size: 6, color: '111111', space: 1 } }, children: [run(b.text, { italics: true, size: 15, color: '444444' })] })); }
    else if (b.type === 'boxes') {
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: b.items.map(([k, v]) => new TableCell({ borders: { top: thick, bottom: thick, left: thick, right: thick }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p(k, { font: SANS, size: 13, caps: true, color: '555555' }), p(v, { bold: true, size: 28, color: /^\+/.test(v) ? '0A5C2B' : /^-/.test(v) ? 'A11111' : '111111' })] })) })] }));
      children.push(blank());
    }
    else if (b.type === 'table') {
      const totW = b.cols.reduce((a, c) => a + c[2], 0);
      const cell = (v, c, head) => new TableCell({ width: { size: Math.round(c[2] / totW * 100), type: WidthType.PERCENTAGE }, borders: { top: none, left: none, right: none, bottom: head ? thick : thin }, margins: { top: 30, bottom: 30, left: 60, right: 60 },
        children: [new Paragraph({ spacing: P0, alignment: c[1] === 'r' ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [run(head ? String(v).toUpperCase() : v, { font: SANS, size: head ? 13 : 15, bold: head, color: !head && /^\+\d/.test(v) ? '0A5C2B' : !head && /^-\d/.test(v) ? 'A11111' : '111111' })] })] });
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: b.cols.map(c => cell(c[0], c, true)) }), ...b.rows.map(r => new TableRow({ children: r.map((v, i) => cell(String(v ?? ''), b.cols[i], false)) }))] }));
      children.push(blank());
    }
  }
  const doc = new Document({ creator: 'GNC Terminal', title: model.title + ' — ' + model.subtitle, styles: { default: { document: { run: { font: FONT, size: 20 }, paragraph: { spacing: P0 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [p(model.title + ' · ' + model.subtitle, { font: SANS, size: 14, color: '777777' })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ spacing: P0, alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT], font: SANS, size: 14, color: '777777' })] })] }) },
      children }] });
  return await Packer.toBlob ? (typeof window !== 'undefined' ? Packer.toBlob(doc) : Packer.toBuffer(doc)) : Packer.toBuffer(doc);
}

/* ---------- benchmark: TRY time deposit (default), money-market fund, or USD deposit ---------- */
function depTax(S, rollDays) { return rollDays <= 183 ? S.depTax6m : rollDays <= 366 ? S.depTax1y : S.depTaxLong; }
function benchNet(S, days, ccy, M) { // net % over `days`, after stopaj, rolled over; with M (macro) carrying policy12m the TRY deposit follows depositPath()
  const d = Math.max(0, +days || 0); if (!d) return 0;
  if (ccy !== 'USD' && S.benchmark !== 'mm' && S.dynDeposit !== false && M && num(M.policy12m) !== null) return depNetCached(S, M, d);
  if (ccy === 'USD') { const roll = Math.min(d, 91), per = (+S.usdDepRate || 0) * roll / 365 * (1 - (+S.usdDepTax || 0) / 100) / 100; return (Math.pow(1 + per, d / roll) - 1) * 100; }
  if (S.benchmark === 'mm') return (Math.pow(1 + S.tlRate / 100, d / 365) - 1) * (1 - S.mmTax / 100) * 100;
  const roll = Math.max(1, Math.min(d, +S.depRoll || 32)), per = (+S.depRate || 0) * roll / 365 * (1 - depTax(S, roll) / 100) / 100;
  return (Math.pow(1 + per, d / roll) - 1) * 100;
}
function benchLabel(S, ccy) { if (ccy === 'USD' || S.principal === 'USD') return 'USD deposit'; return S.benchmark === 'mm' ? 'money-market fund' : 'TRY deposit'; }
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Math.round(n)); return d.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }

/* ---------- FX and display ---------- */
function makeFx(inst, macroSeries, fallback) { // returns fx(date) = USD/TRY on or before date
  const pts = []; const u = inst && inst['USD/TRY']; if (u && Array.isArray(u.closes)) for (const [d, c] of u.closes) if (c > 0) pts.push([d, +c]);
  const w = macroSeries && macroSeries.usdtry && macroSeries.usdtry.data; if (w) for (const [d, c] of w) if (c > 0 && !pts.some(p => p[0] === d)) pts.push([d, +c]);
  pts.sort((a, b) => a[0] < b[0] ? -1 : 1); const last = pts.length ? pts[pts.length - 1][1] : (fallback || 49.5);
  return d => { if (!d || !pts.length) return last; let lo = 0, hi = pts.length - 1, ans = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (pts[m][0] <= d) { ans = pts[m][1]; lo = m + 1; } else hi = m - 1; } return ans || pts[0][1]; };
}
const DISPLAY = { principal: 'TRY', usdtry: 49.5, both: false };
function setDisplay(o) { Object.assign(DISPLAY, o || {}); }
function money(v, fx, principal) { // "12,500 TRY ($251)" or "$251 (12,500 TRY)"
  if (v === null || v === undefined || !isFinite(v)) return '—'; const r = fx || DISPLAY.usdtry || 49.5, usd = v / r;
  const t = Math.round(v).toLocaleString('en-US') + ' TRY', u = '$' + Math.round(usd).toLocaleString('en-US');
  return (principal || DISPLAY.principal) === 'USD' ? `${u} (${t})` : `${t} (${u})`;
}
function realPct(nomPct, days, cpiAnnual) { if (nomPct === null || nomPct === undefined || !isFinite(nomPct) || !cpiAnnual) return null; return ((1 + nomPct / 100) / Math.pow(1 + cpiAnnual / 100, days / 365) - 1) * 100; }

/* ---------- exit plan: when to sell and why ---------- */
function breakeven(x, S, row, amount, M) {
  const usdP = S.principal === 'USD', fxT = (Math.pow(1 + fxRate(S, M) / 100, row.t) - 1) * 100;
  const need = usdP ? ((1 + row.mm / 100) * (1 + fxT / 100) - 1) * 100 : row.mm; // required TRY net %
  const f = mu => { const g = mu - row.costPct; return g - taxPct(x, g, row.t, S) - need; };
  let lo = -60, hi = 400; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  const mu = (lo + hi) / 2; return { pct: mu, price: x.e && x.e.price ? x.e.price * (1 + mu / 100) : null };
}
function exitPlan(x, S, M, opt = {}) {
  const hz = x.hz; if (!hz || !x.e) return null;
  const r = (opt.k && hz.rows.find(q => q.k === opt.k)) || hz.best || hz.bestAny, e = x.e, start = opt.entryDate || M.today, days = Math.round(r.t * 365), date = addDays(start, days);
  const bl = benchLabel(S), cmp = `expected ${fmtPct(r.netCmp)} net in ${r.label} against ${fmtPct(r.mm)} in a ${bl}`;
  const tl = trailLevel(x, S, e.price), trail = Math.round(tl.pct);
  let kind, why; const extra = [];
  if (['1w', '2w', '3w'].includes(r.k)) { kind = 'rebound'; why = `short-term rebound${e.rsi !== null && e.rsi !== undefined ? ': RSI ' + e.rsi.toFixed(0) : ''}${e.ma20 && e.price ? ', price ' + fmtPct((e.price / e.ma20 - 1) * 100) + ' against its 20-day average' : ''}; ${cmp}`; extra.push('Sell earlier if the rebound reaches the target; do not extend the span if it fails.'); }
  else if (['1m', '2m', '3m'].includes(r.k)) { kind = 'momentum'; why = `momentum${e.r3m !== null && e.r3m !== undefined ? ': ' + fmtPct(e.r3m) + ' in 3 months' : ''}${e.ma50 && e.price ? ', price ' + (e.price >= e.ma50 ? 'above' : 'below') + ' the 50-day average' : ''}; ${cmp}`; if (e.ma50) extra.push(`Sell earlier if it closes below the 50-day average (${fmtN(e.ma50)}).`); }
  else if (['6m', '9m'].includes(r.k)) { kind = 'trend and value'; why = `trend and value${e.pe ? ': P/E ' + e.pe.toFixed(1) : ''}${e.dd ? ', ' + e.dd.toFixed(0) + '% below its 52-week high' : ''}; ${cmp}`; }
  else if (x.cls === 'TEFAS' && x.b51) { kind = 'tax'; why = `stopaj falls to 0% after one year; ${cmp}`; }
  else { kind = 'core'; why = `core holding${x.ccy === 'USD' ? ', declared-tax drag is lowest over a full year' : ''}; ${cmp}`; }
  const c = opt.cons; if (c && c.avg && c.rated >= 3) extra.push(`Sell earlier at the average broker target ${fmtN(c.avg)} (${fmtPct(c.upside)} upside, ${c.rated} ratings).`);
  if ((e.div || 0) >= 4 && days >= 60) extra.push(`Hold through the dividend (yield ${e.div.toFixed(1)}%).`);
  const be = breakeven(x, S, r, opt.amount, M);
  const rules = [`Sell on ${longDate(date)} (${r.label}).`, r.target ? `Take profit at ${fmtN(r.target)}.` : null, r.stop ? `Stop at ${fmtN(r.stop)} (${e.atr ? (S.stopAtr || 2.5) + ' × ATR' : '1.5 × monthly volatility'}); after a gain, trail ${tl.mult ? tl.mult + ' × ATR(22) ≈ ' + trail + '%' : trail + '%'} below the highest close (Chandelier exit).` : null, be.price ? `Break-even against a ${bl}: ${fmtN(be.price)} (${fmtPct(be.pct)}).` : null, ...extra].filter(Boolean);
  const avoid = !hz.best;
  return { k: r.k, label: r.label, days, date, kind, title: avoid ? `Avoid — a ${bl} pays more after costs and tax` : `Sell in ${r.label} — ${kind}`, why: avoid ? `No span beats a ${bl} after costs and tax (best: ${r.label}, ${fmtPct(r.netCmp)} against ${fmtPct(r.mm)}).` : why,
    text: avoid ? `Avoid: no span beats a ${bl} after costs and tax.` : `Sell in ${r.label}, on ${longDate(date)}, because ${why}.`, target: r.target, stop: r.stop, trail, breakeven: be, expNet: r.net, expCmp: r.netCmp, bench: r.mm, benchLabel: bl, rules, avoid };
}
// cost of leaving before the planned date: what the position has made so far against the benchmark over the same days
function earlyExit(row, S) {
  if (!row || row.heldDays === null || row.heldDays === undefined || !row.spanDays || !row.x) return null;
  const bench = benchNet(S, row.heldDays), plNet = row.plNet;
  return { early: row.heldDays < row.spanDays, daysLeft: Math.max(0, row.spanDays - row.heldDays), bench, plNet, gap: plNet === null || plNet === undefined ? null : plNet - bench };
}

/* ---------- alternatives: the same money elsewhere over the same dates ---------- */
function alternatives(flows, to, ctx) { // flows: [{date, amount TRY}] (purchases positive)
  const { S, M } = ctx, fx = ctx.fx || (() => M.usdtry || 49.5), xu = ctx.inst && ctx.inst.XU100, cpi = (M.cpi || 30);
  const xuOn = d => { const c = xu && Array.isArray(xu.closes) ? xu.closes : []; let v = null; for (const [dd, p] of c) { if (dd <= d) v = p; else break; } return v || (c[0] && c[0][1]) || null; };
  const out = { invested: 0, deposit: 0, mm: 0, bist: 0, usdDep: 0, cpi: 0 }; const fee = 1.0;
  for (const f of flows) { const A = +f.amount || 0, dd = Math.max(0, daysBetween(f.date, to)); out.invested += A;
    out.deposit += A * (1 + benchNet({ ...S, benchmark: 'deposit' }, dd) / 100);
    out.mm += A * (1 + benchNet({ ...S, benchmark: 'mm' }, dd) / 100);
    const a = xuOn(f.date), b = xuOn(to); out.bist += a && b ? A * (b / a) * Math.pow(1 - fee / 100, dd / 365) : A;
    out.usdDep += A / fx(f.date) * (1 + benchNet(S, dd, 'USD') / 100) * fx(to);
    out.cpi += A * Math.pow(1 + cpi / 100, dd / 365); }
  const fxTo = fx(to), rows = [['TRY time deposit', out.deposit], ['Money-market fund', out.mm], ['BIST 100 index fund', out.bist], ['USD deposit', out.usdDep], ['Inflation (CPI) — value kept', out.cpi]];
  return { invested: out.invested, rows: rows.map(([k, v]) => ({ name: k, value: v, gain: v - out.invested, pct: out.invested ? (v / out.invested - 1) * 100 : null, usd: v / fxTo })) };
}

/* ---------- performance: daily value of everything held, flows, TWR, MWR ---------- */
function perfSeries(ctx) {
  const { M, S, inst } = ctx, fx = ctx.fx || (() => M.usdtry || 49.5);
  const lots = [];
  for (const h of ctx.holdings || []) if (h.buyDate && h.qty) lots.push({ symbol: h.symbol, qty: +h.qty, date: h.buyDate, paid: +h.paidTRY || +h.paidTL || null, price: +h.cost || null });
  for (const p of ctx.packages || []) for (const l of p.lines || []) { const fills = l.fills && l.fills.length ? l.fills : [{ date: p.date, qty: l.qty, amount: l.filled ?? l.amount, price: l.priceAt }]; for (const f of fills) if (f.qty) lots.push({ symbol: l.symbol, qty: +f.qty, date: f.date, paid: +f.amount || null, price: +f.price || null }); }
  if (!lots.length) return null;
  const start = lots.map(l => l.date).sort()[0], days = []; for (let d = start; d <= M.today; d = addDays(d, 1)) days.push(d);
  const px = {}; for (const l of lots) if (!px[l.symbol]) { const x = inst[l.symbol]; px[l.symbol] = x && Array.isArray(x.closes) ? x.closes : []; }
  const at = (sym, d) => { const c = px[sym]; let v = null; for (const [dd, p] of c) { if (dd <= d) v = p; else break; } return v; };
  const series = [], flows = [];
  for (const l of lots) { const x = inst[l.symbol], f = x && x.ccy === 'USD' ? fx(l.date) : 1; flows.push({ date: l.date, amount: l.paid || (l.price ? l.price * l.qty * f : 0) }); }
  let twr = 1, prev = null;
  for (const d of days) { let v = 0, inflow = 0; for (const l of lots) { if (l.date > d) continue; const x = inst[l.symbol], p = at(l.symbol, d) ?? l.price, f = x && x.ccy === 'USD' ? fx(d) : 1; v += (p || 0) * l.qty * f; if (l.date === d) inflow += flows[lots.indexOf(l)].amount; }
    if (prev !== null && prev > 0) twr *= (v - inflow) / prev; prev = v; series.push([d, v, v / fx(d)]); }
  const invested = flows.reduce((a, f) => a + f.amount, 0), value = series.length ? series[series.length - 1][1] : 0;
  // money-weighted return (XIRR, annualised)
  const npv = r => flows.reduce((a, f) => a - f.amount * Math.pow(1 + r, daysBetween(f.date, M.today) / 365), value);
  let lo = -0.99, hi = 10; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (npv(m) > 0) lo = m; else hi = m; }
  let peak = 0, mdd = 0; for (const [, v] of series) { peak = Math.max(peak, v); if (peak) mdd = Math.max(mdd, 1 - v / peak); }
  return { series, flows, invested, value, twr: (twr - 1) * 100, mwr: daysBetween(start, M.today) >= 30 ? (lo + hi) / 2 * 100 : null, mdd: mdd * 100, start, days: daysBetween(start, M.today) };
}

/* ---------- lab: test simple exit rules on the stored price history ---------- */
function backtest(inst, rule, S, M) { // rule: {hold: days, trail: % or 0, entry: 'any'|'rsi30'|'mom'}
  const res = []; const xu = inst.XU100 && Array.isArray(inst.XU100.closes) ? inst.XU100.closes : [];
  const xuMap = new Map(xu.map(r => [r[0], r[1]]));
  for (const x of Object.values(inst)) {
    if (x.cls !== 'TR_EQ' || !Array.isArray(x.closes) || x.closes.length < 60) continue;
    const c = x.closes, n = c.length, hold = Math.max(1, Math.round(rule.hold * 252 / 365));
    for (let i = 20; i + 1 < n; i += 5) {
      if (rule.entry === 'rsi30') { let g = 0, l = 0; for (let k = i - 13; k <= i; k++) { const d = c[k][1] - c[k - 1][1]; if (d > 0) g += d; else l -= d; } const rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l); if (rsi >= 35) continue; }
      if (rule.entry === 'mom') { const back = Math.max(0, i - 63); if (!(c[i][1] / c[back][1] > 1.1 && c[i][1] > c.slice(Math.max(0, i - 50), i + 1).reduce((a, r) => a + r[1], 0) / Math.min(51, i + 1))) continue; }
      const e = c[i][1]; let peak = e, j = i, exitP = null;
      for (j = i + 1; j < n && j <= i + hold; j++) { const p = c[j][1]; peak = Math.max(peak, p); if (rule.trail && p <= peak * (1 - rule.trail / 100)) { exitP = p; break; } }
      if (j > i + hold || j >= n) { j = Math.min(i + hold, n - 1); if (j - i < hold * 0.8) continue; exitP = c[j][1]; }
      const days = daysBetween(c[i][0], c[j][0]), ret = (exitP / e - 1) * 100 - 0.45, xa = xuMap.get(c[i][0]), xb = xuMap.get(c[j][0]);
      res.push({ ret, days, dep: benchNet(S, days), xu: xa && xb ? (xb / xa - 1) * 100 : null });
    }
  }
  if (!res.length) return { n: 0 };
  const avg = a => a.reduce((s, v) => s + v, 0) / a.length, rets = res.map(r => r.ret), xr = res.filter(r => r.xu !== null);
  return { n: res.length, avgRet: avg(rets), avgDays: avg(res.map(r => r.days)), avgDep: avg(res.map(r => r.dep)), beatDep: res.filter(r => r.ret > r.dep).length / res.length * 100,
    beatXu: xr.length ? xr.filter(r => r.ret > r.xu).length / xr.length * 100 : null, avgXu: xr.length ? avg(xr.map(r => r.xu)) : null, worst: Math.min(...rets), best: Math.max(...rets), win: res.filter(r => r.ret > 0).length / res.length * 100 };
}

/* ---------- broker research: ratings, targets, consensus, signals, digest ---------- */
// Observation tuple stored in research/targets.obs: [symbol, broker, date YYYY-MM-DD, target, ratingText, prevTarget|null, firstSeen ISO]
const RATING_RULES = [
  [/^(güçlü al|al\b|alım|endeks(in)? üst|end\. üst|endeks üstü|ağırlığı artır|agirligi artir|outperform|buy|overweight|pozitif|kademeli al)/i, 'buy'],
  [/^(tut|endekse paralel|endeks paralel|end\. paralel|nötr|notr|market ?perform|hold|neutral|equal ?weight)/i, 'hold'],
  [/^(sat\b|endeks(in)? alt|end\. alt|endeks altı|ağırlığı azalt|azalt|underperform|sell|underweight|negatif)/i, 'sell']
];
function normRating(r) { const s = String(r || '').trim().toLowerCase(); for (const [re, k] of RATING_RULES) if (re.test(s)) return k; return 'none'; }
const RATING_RANK = { sell: 0, hold: 1, buy: 2 };
function daysAgo(d, today) { return (new Date(today) - new Date(d)) / 864e5; }
function brokerLatest(obs, today, maxDays = 365) {
  // latest observation per symbol+broker, plus the one before it (for revisions)
  const by = new Map();
  for (const o of obs || []) { if (!o || !o[0] || !o[2]) continue; if (daysAgo(o[2], today) > maxDays) continue; const k = o[0] + '|' + o[1]; const a = by.get(k) || []; a.push(o); by.set(k, a); }
  const out = [];
  for (const a of by.values()) { a.sort((x, y) => x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : (x[6] || '') < (y[6] || '') ? -1 : 1); const last = a[a.length - 1]; let prev = null; for (let i = a.length - 2; i >= 0; i--) if (a[i][3] !== last[3] || a[i][4] !== last[4]) { prev = a[i]; break; }
    out.push({ sym: last[0], broker: last[1], date: last[2], target: +last[3] || null, ratingText: last[4] || '', rating: normRating(last[4]), prevTarget: last[5] != null ? +last[5] : (prev ? +prev[3] || null : null), prevRating: prev ? normRating(prev[4]) : null, prevDate: prev ? prev[2] : null }); }
  return out;
}
function consensus(research, scoredMap, today, maxDays = 180) {
  const latest = brokerLatest((research && research.obs) || [], today, maxDays), bySym = {};
  for (const l of latest) (bySym[l.sym] = bySym[l.sym] || []).push(l);
  const out = {};
  for (const [sym, arr] of Object.entries(bySym)) {
    const x = scoredMap && scoredMap[sym], price = x && x.e ? x.e.price : null, t = arr.map(a => a.target).filter(v => v > 0).sort((a, b) => a - b);
    const cnt = { buy: 0, hold: 0, sell: 0, none: 0 }; arr.forEach(a => cnt[a.rating]++);
    const rated = cnt.buy + cnt.hold + cnt.sell, avg = t.length ? t.reduce((a, b) => a + b, 0) / t.length : null, med = t.length ? (t.length % 2 ? t[(t.length - 1) / 2] : (t[t.length / 2 - 1] + t[t.length / 2]) / 2) : null;
    const recent = arr.filter(a => daysAgo(a.date, today) <= 30), up = recent.filter(a => a.prevTarget && a.target > a.prevTarget * 1.005).length, down = recent.filter(a => a.prevTarget && a.target < a.prevTarget * 0.995).length;
    const upg = recent.filter(a => a.prevRating && a.prevRating !== 'none' && a.rating !== 'none' && RATING_RANK[a.rating] > RATING_RANK[a.prevRating]).length, dng = recent.filter(a => a.prevRating && a.prevRating !== 'none' && a.rating !== 'none' && RATING_RANK[a.rating] < RATING_RANK[a.prevRating]).length;
    out[sym] = { sym, n: arr.length, ...cnt, rated, buyPct: rated ? cnt.buy / rated * 100 : null, avg, med, hi: t.length ? t[t.length - 1] : null, lo: t.length ? t[0] : null, price,
      upside: avg && price ? (avg / price - 1) * 100 : null, medUpside: med && price ? (med / price - 1) * 100 : null, up30: up, down30: down, upg30: upg, dng30: dng, last: arr.map(a => a.date).sort().pop(), brokers: arr.sort((a, b) => a.date < b.date ? 1 : -1) };
  }
  return out;
}
function brokerSignals(ctx) {
  const { research, scoredMap, M } = ctx, today = M.today, cons = consensus(research, scoredMap, today), latest = brokerLatest((research && research.obs) || [], today, 400);
  const held = new Set([...(ctx.holdings || []).map(h => h.symbol), ...(ctx.packages || []).flatMap(p => (p.lines || []).map(l => l.symbol))]), basket = new Set((ctx.basket || []).map(b => b.symbol));
  const changes = latest.filter(l => daysAgo(l.date, today) <= 7).map(l => {
    const kind = l.prevRating && l.prevRating !== 'none' && l.rating !== 'none' && l.rating !== l.prevRating ? (RATING_RANK[l.rating] > RATING_RANK[l.prevRating] ? 'upgrade' : 'downgrade') : l.prevTarget && l.target ? (l.target > l.prevTarget * 1.005 ? 'target raised' : l.target < l.prevTarget * 0.995 ? 'target cut' : 'reiterated') : 'new / reiterated';
    const x = scoredMap[l.sym]; return { ...l, kind, chg: l.prevTarget && l.target ? (l.target / l.prevTarget - 1) * 100 : null, upside: l.target && x && x.e && x.e.price ? (l.target / x.e.price - 1) * 100 : null, held: held.has(l.sym) };
  }).sort((a, b) => (b.held - a.held) || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const actions = [];
  for (const c of Object.values(cons)) {
    const x = scoredMap[c.sym]; if (!x || x.score === null || x.score === undefined) continue;
    const fresh = c.brokers.filter(b => daysAgo(b.date, today) <= 120).length;
    if (held.has(c.sym)) {
      if (c.dng30 > 0 || c.down30 >= 2) actions.push({ level: 'warn', kind: 'review', sym: c.sym, text: `${c.sym} (held): ${c.dng30 ? c.dng30 + ' downgrade' + (c.dng30 > 1 ? 's' : '') : ''}${c.dng30 && c.down30 ? ', ' : ''}${c.down30 ? c.down30 + ' target cut' + (c.down30 > 1 ? 's' : '') : ''} in 30 days; consensus upside ${fmtPct(c.upside)}. Review the position.` });
      else if (c.upside !== null && c.upside < 5 && c.rated >= 3) actions.push({ level: 'warn', kind: 'trim', sym: c.sym, text: `${c.sym} (held): price is within 5% of the average broker target (${fmtN(c.avg)}); upside left ${fmtPct(c.upside)}. Consider taking profit or tightening the stop.` });
    } else if (c.rated >= 3 && fresh >= 2 && c.buyPct >= 60 && c.upside >= 25 && x.score >= 60) {
      actions.push({ level: 'good', kind: 'candidate', sym: c.sym, add: true, text: `${c.sym}: ${c.buy} of ${c.rated} brokers Buy, average target ${fmtN(c.avg)} (${fmtPct(c.upside)}); our score ${x.score}${x.best ? ', best span ' + x.best.label : ''}. Candidate${basket.has(c.sym) ? ' (already in basket)' : ''}.` });
    }
    if (!held.has(c.sym) && c.rated >= 4 && ((x.score >= 70 && c.buyPct < 30) || (x.score <= 30 && c.buyPct >= 70 && c.upside >= 30)))
      actions.push({ level: 'info', kind: 'disagree', sym: c.sym, text: `${c.sym}: brokers and the model disagree — score ${x.score}, ${Math.round(c.buyPct)}% Buy, upside ${fmtPct(c.upside)}. Look before acting.` });
  }
  const order = { review: 0, trim: 1, candidate: 2, disagree: 3 };
  actions.sort((a, b) => order[a.kind] - order[b.kind] || ((cons[b.sym] || {}).upside || 0) - ((cons[a.sym] || {}).upside || 0));
  const digest = research && research.digest, take = digest ? [...(digest.takeaways || [])] : [], symTake = digest ? (digest.symbols || []).filter(s => held.has(s.symbol) || basket.has(s.symbol)) : [];
  return { cons, changes, actions, digest, takeaways: take, symTake, feed: ((research && research.feed) || []).slice(0, 8), updatedAt: research && research.updatedAt };
}
function brokerDigestModel(ctx, from, to) {
  const sig = brokerSignals(ctx), { M, scoredMap } = ctx, latest = brokerLatest((ctx.research && ctx.research.obs) || [], M.today, 400).filter(l => l.date >= from && l.date <= to);
  const cons = Object.values(sig.cons).filter(c => c.rated >= 3 && c.upside !== null).sort((a, b) => b.n - a.n).slice(0, 40);
  const revs = latest.filter(l => l.prevTarget && l.target).map(l => ({ ...l, chg: (l.target / l.prevTarget - 1) * 100 })).sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg)).slice(0, 20);
  const rch = latest.filter(l => l.prevRating && l.prevRating !== 'none' && l.rating !== 'none' && l.rating !== l.prevRating);
  const d = sig.digest, blocks = [
    { type: 'lead', text: d && d.headline ? d.headline : `${latest.length} broker target or rating notes between ${longDate(from)} and ${longDate(to)}; ${rch.length} rating change${rch.length === 1 ? '' : 's'}; ${revs.filter(r => r.chg > 0).length} targets raised and ${revs.filter(r => r.chg < 0).length} cut among the largest revisions.` },
    { type: 'boxes', items: [['Notes in period', String(latest.length)], ['Rating changes', String(rch.length)], ['Stocks with 3+ ratings', String(Object.values(sig.cons).filter(c => c.rated >= 3).length)], ['Weekly takeaways', d ? longDate(d.date) : 'not imported']] },
    { type: 'h', text: 'Proposed actions' },
    sig.actions.length ? { type: 'list', items: sig.actions.slice(0, 15).map(a => a.text) } : { type: 'p', text: 'No action signals: no downgrades on held positions and no candidate meets all filters (3+ ratings, 60% Buy, 25% upside, score 60+).' }
  ];
  if (d) { blocks.push({ type: 'h', text: 'Consolidated takeaways' }, { type: 'list', items: (d.takeaways || []).map(t => typeof t === 'string' ? t : `${t.text}${t.sources ? ' [' + t.sources + ']' : ''}`) });
    if ((d.macro || []).length) blocks.push({ type: 'h', text: 'Broker macro views' }, { type: 'table', cols: [['Broker', 'l', 1.6], ['View', 'l', 4], ['Source', 'l', 1.6]], rows: d.macro.map(m => [m.broker, m.view, m.source || '']) });
    if ((d.symbols || []).length) blocks.push({ type: 'h', text: 'Company notes' }, { type: 'table', cols: [['Symbol', 'l', 0.8], ['Takeaway', 'l', 5], ['Source', 'l', 1.6]], rows: d.symbols.slice(0, 30).map(s => [s.symbol, s.text, s.source || '']) }); }
  blocks.push({ type: 'h', text: 'Consensus (latest rating per broker, 180 days)' },
    { type: 'table', cols: [['Symbol', 'l', 0.9], ['Brokers', 'r', 0.7], ['Buy / Hold / Sell', 'l', 1.3], ['Avg target', 'r', 1], ['Price', 'r', 0.9], ['Upside', 'r', 0.8], ['Revisions 30d', 'l', 1.2], ['Score', 'r', 0.6]],
      rows: cons.map(c => [c.sym, String(c.n), `${c.buy} / ${c.hold} / ${c.sell}`, fmtN(c.avg), fmtN(c.price), fmtPct(c.upside), `${c.up30} up, ${c.down30} down`, scoredMap[c.sym] && scoredMap[c.sym].score !== null ? String(scoredMap[c.sym].score) : '—']) },
    { type: 'h', text: 'Largest target revisions in the period' },
    revs.length ? { type: 'table', cols: [['Date', 'l', 1], ['Broker', 'l', 1.8], ['Symbol', 'l', 0.8], ['Rating', 'l', 1.4], ['Old', 'r', 0.8], ['New', 'r', 0.8], ['Change', 'r', 0.8]], rows: revs.map(r => [r.date, r.broker, r.sym, r.ratingText, fmtN(r.prevTarget), fmtN(r.target), fmtPct(r.chg)]) } : { type: 'p', text: 'No target revisions recorded in the period.' },
    { type: 'h', text: 'Rating changes' },
    rch.length ? { type: 'table', cols: [['Date', 'l', 1], ['Broker', 'l', 1.8], ['Symbol', 'l', 0.8], ['From', 'l', 1], ['To', 'l', 1.6], ['Target', 'r', 0.8]], rows: rch.map(r => [r.date, r.broker, r.sym, r.prevRating, r.ratingText, fmtN(r.target)]) } : { type: 'p', text: 'No rating changes recorded in the period.' });
  if (sig.feed.length) blocks.push({ type: 'h', text: 'Research published (İş Yatırım feed)' }, { type: 'list', items: sig.feed.filter(f => (f.date || '') >= from).slice(0, 20).map(f => `${f.date} · ${f.title}`) });
  blocks.push({ type: 'p', text: 'Sources: broker target prices and ratings as collected from hedeffiyat.com.tr and the brokers’ own public research pages; weekly takeaways summarised from the brokers’ published reports. Figures are as published by each broker and are not verified.' }, { type: 'disclaimer', text: DISCLAIMER });
  return { kicker: 'Broker research digest', title: 'GNC Terminal', subtitle: 'Broker digest', meta: [`Period ${longDate(from)} – ${longDate(to)}`, `Issued ${longDate(M.today)}`, `Data as of ${sig.updatedAt ? String(sig.updatedAt).slice(0, 10) : '—'}`], blocks };
}

/* ===================== v4 "orange goat": forecast and fund-construction functions (pure, Node-safe) ===================== */
function spanSignal(k) { return ['1w', '2w', '3w'].includes(k) ? 'short-term rebound' : ['1m', '2m', '3m'].includes(k) ? 'momentum' : ['6m', '9m'].includes(k) ? 'trend and value' : 'core / value'; }
function hBucket(k) { return ['1w', '2w', '3w', '1m'].includes(k) ? '1m' : ['2m', '3m'].includes(k) ? '3m' : ['6m', '9m'].includes(k) ? '6m' : '12m'; }
function hKeyForDays(days) { const t = (+days || 0) / 365; let best = HORIZONS[0]; for (const h of HORIZONS) if (Math.abs(h[2] - t) < Math.abs(best[2] - t)) best = h; return best[0]; }
// factor weights by horizon: ≤ 3 months momentum, reversal and trend count more; ≥ 6 months value, quality and low volatility
function horizonWeights(k, base) {
  const w = base || PRESETS.balanced.w, short = ['1w', '2w', '3w', '1m', '2m', '3m'].includes(k), vshort = ['1w', '2w', '3w'].includes(k);
  const m = short ? { trend: 1.5, mom: 1.6, rev: vshort ? 3 : 1.6, risk: 0.6, value: 0.4, quality: 0.5, liq: 1.2, cost: 1, fx: 1, edge: 1 }
    : { trend: 0.8, mom: 0.8, rev: 0.2, risk: 1.5, value: 1.7, quality: 1.6, liq: 1, cost: 1, fx: 1, edge: 1 };
  const out = {}; for (const [g] of GROUPS) out[g] = (w[g] || 0) * (m[g] ?? 1);
  if (short && !out.rev) out.rev = vshort ? 6 : 3; // presets without reversal still get a little at short horizons
  return out;
}
// expected USD/TRY change a year (%): TCMB market participants survey (12-month-ahead level against today's spot), else the Settings view
function fxRate(S, M) {
  if (S && S.surveyFx !== false && M) {
    const lvl = num(M.usdtry12m), spot = num(M.usdtry);
    if (lvl > 0 && spot > 0 && (!(num(M.spotForExp) > 0) || Math.abs(spot / M.spotForExp - 1) < 0.5)) return clamp((lvl / spot - 1) * 100, -30, 150);
    if (num(M.expDepr12m) !== null) return clamp(M.expDepr12m, -30, 150);
  }
  return +(S && S.usdView) || 0;
}
// TRY deposit benchmark whose rate moves month by month from today's deposit rate toward the survey's 12-month policy rate plus today's deposit–policy spread;
// each roll (S.depRoll days) locks the rate of its first day and pays stopaj at the term's rate. Flat path = the old constant benchmark exactly.
function depositPath(S, M, days) {
  const d = Math.max(0, +days || 0), dep0 = +S.depRate || 0, pol0 = num(M && M.policyRate), pol12 = num(M && M.policy12m);
  const spread = pol0 !== null ? dep0 - pol0 : 0, target = pol12 !== null ? Math.max(0, pol12 + spread) : dep0;
  const rateAt = day => dep0 + (target - dep0) * Math.min(1, day / 365);
  const roll = Math.max(1, Math.min(d || 1, +S.depRoll || 32)), tax = depTax(S, roll);
  let g = 1, n = 1, t = 0;
  while (t < d - 1e-9) { const len = Math.min(roll, d - t), r = rateAt(t), f = len / roll; g *= Math.pow(1 + r * roll / 365 / 100, f); n *= Math.pow(1 + r * roll / 365 * (1 - tax / 100) / 100, f); t += len; }
  const path = []; for (let m = 0; m < 400; m++) { const dd = Math.min(d, Math.round(m * 365 / 12)); path.push({ d: dd, rate: +rateAt(dd).toFixed(3) }); if (dd >= d) break; }
  return { gross: (g - 1) * 100, net: (n - 1) * 100, path, start: dep0, target, spread, roll, tax };
}
// TRY risk-free building block of expected(): today's deposit rate, or with the dynamic deposit its 12-month average along depositPath()
function rfTry(S, M) { const d0 = +S.depRate || S.tlRate; if (S.dynDeposit === false || !M || num(M.policy12m) === null) return d0; const p = depositPath(S, M, 0); return d0 + (p.target - d0) / 2; }
const _depCache = new Map();
function depNetCached(S, M, d) {
  const k = [S.depRate, S.depRoll, S.depTax6m, S.depTax1y, S.depTaxLong, M.policyRate, M.policy12m, Math.round(d * 100)].join('|'); let v = _depCache.get(k);
  if (v === undefined) { if (_depCache.size > 4000) _depCache.clear(); v = depositPath(S, M, d).net; _depCache.set(k, v); } return v;
}
// exponentially weighted volatility (RiskMetrics λ = 0.94), annualised %, from closes (numbers or [date, close])
/* ---------- model calibration: walk-forward test of the forecast on stored history ----------
   At every 21st trading day of the last `years` years, each stock's signals are computed exactly as the live model does
   (short-term reversal, 12-1/6-1 momentum, 200-day trend; EWMA+1y volatility), using only data up to that day.
   They are compared with what happened next (21, 63, 126 trading days):
   - per signal, a Fama-MacBeth slope of realised (cross-sectionally demeaned) return on the model's predicted contribution:
     1 = the model's size was right, 0 = no power, <0 = wrong way. Shrunk by its t-statistic, it scales the live alpha;
   - rank IC and the top-minus-bottom quintile spread of the combined prediction (hit rate);
   - volatility bands: how often outcomes fell inside the model's 90% band, and the factor that makes it 90%;
   - fat tails: degrees of freedom of a Student-t fitted to the standardised outcomes. */
let CAL = null;
function setCalib(c) { CAL = c && c.ok ? c : null; }
function getCalib() { return CAL; }
function calScale(ccy, k) { const s = CAL && CAL.scale && CAL.scale[ccy]; return s && isFinite(s[k]) ? s[k] : 1; }
function calSig(ccy, t) { const g = CAL && CAL.sig && CAL.sig[ccy]; if (!g || !g.length) return 1; const d = t * 252; if (d <= g[0][0]) return g[0][1]; for (let i = 1; i < g.length; i++) if (d <= g[i][0]) { const [d0, m0] = g[i - 1], [d1, m1] = g[i]; return m0 + (m1 - m0) * (d - d0) / (d1 - d0); } return g[g.length - 1][1]; }
function calibrate(list, opts = {}) {
  const H = [21, 63, 126], HK = { 21: '1m', 63: '3m', 126: '6m' }, W = { '1m': { rev: 0.3, mom: 1, trend: 1 }, '3m': { rev: 0, mom: 1, trend: 1 }, '6m': { rev: 0, mom: 0.6, trend: 1 } };
  const years = opts.years || 5, step = 21, comps = ['rev', 'mom', 'trend'], out = { ok: false, at: new Date().toISOString(), years, method: 'walk-forward, Fama-MacBeth', scale: {}, sig: {}, stats: {} };
  const median = a => { const v = a.slice().sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : 0; };
  const rank = a => { const o = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), r = new Array(a.length); o.forEach(([, i], k) => { r[i] = k; }); return r; };
  const pear = (a, b) => { const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? n / Math.sqrt(da * db) : 0; };
  for (const ccy of ['TRY', 'USD']) {
    const L = list.filter(s => s.ccy === ccy && Array.isArray(s.closes) && s.closes.length >= 300); if (L.length < 30) continue;
    const dates = [...new Set(L.flatMap(s => s.closes.map(r => r[0])))].sort(), first = dates.length - Math.round(years * 252);
    const pos = L.map(s => { const m = new Map(); s.closes.forEach((r, i) => m.set(r[0], i)); return m; });
    const slopes = {}, ics = {}, spreads = {}, zs = { 21: [], 63: [], 126: [] }, hits = {}; for (const h of H) { slopes[h] = { rev: [], mom: [], trend: [] }; ics[h] = []; spreads[h] = []; hits[h] = [0, 0]; }
    let nObs = 0, nDates = 0, from = null, to = null; const v3ic = [];
    for (let di = Math.max(260, first); di < dates.length - 21; di += step) {
      const d = dates[di], snap = [];
      L.forEach((s, k) => { const i = pos[k].get(d); if (i === undefined || i < 252) return; const c = s.closes, at = j => +c[j][1], px = at(i); if (!(px > 0)) return;
        const lr = []; for (let j = i - 251; j <= i; j++) { const a = at(j - 1), b = at(j); if (a > 0 && b > 0) lr.push(Math.log(b / a)); } if (lr.length < 200 || lr.some(r => Math.abs(r) > 0.4)) return; // skip unadjusted splits
        const vol = sd(lr) * Math.sqrt(252) * 100; let ev = mean(lr.slice(0, 20).map(r => r * r)); for (let j = 20; j < lr.length; j++) ev = 0.94 * ev + 0.06 * lr[j] * lr[j];
        const volUsed = Math.max(ccy === 'TRY' ? 20 : 15, 0.5 * Math.sqrt(ev * 252) * 100 + 0.5 * vol);
        const mom = (0.6 * (at(i - 21) / at(i - 252) - 1) * 100 + 0.4 * (at(i - 21) / at(i - 126) - 1) * 100) / vol;
        let g = 0, l = 0; for (let j = i - 13; j <= i; j++) { const dd = at(j) - at(j - 1); if (dd > 0) g += dd; else l -= dd; } const rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l);
        let s20 = 0; for (let j = i - 19; j <= i; j++) s20 += at(j); let s200 = 0; for (let j = i - 199; j <= i; j++) s200 += at(j);
        const fwd = {}; for (const h of H) if (i + h < c.length && at(i + h) > 0) fwd[h] = Math.log(at(i + h) / px);
        const sg = { lowvol: -vol, hi52: px / Math.max(...c.slice(i - 251, i + 1).map(r => +r[1])), maxDay: -Math.max(...lr.slice(-5)), above200: px > s200 / 200 ? 1 : 0, mom121ra: (at(i - 21) / at(i - 252) - 1) * 100 / vol, rsiRev: 50 - rsi, lowbeta: null, idio: null, resmom: null, r21x: null, abvol: null };
        const ixm = opts.index && opts.index[ccy]; if (ixm) { const xr = [], yr = []; for (let j = i - 251; j <= i; j++) { const a = ixm.get(c[j - 1][0]), b = ixm.get(c[j][0]); if (a > 0 && b > 0) { xr.push(Math.log(b / a)); yr.push(Math.log(at(j) / at(j - 1))); } }
          if (xr.length > 150) { const mx = mean(xr), my = mean(yr); let cv = 0, vx = 0; for (let t = 0; t < xr.length; t++) { cv += (xr[t] - mx) * (yr[t] - my); vx += (xr[t] - mx) ** 2; } const bt = vx ? cv / vx : 1, res = yr.map((r, t) => r - bt * xr[t]), rs = res.slice(0, -21);
            sg.lowbeta = -bt; sg.idio = -sd(res); sg.resmom = rs.reduce((a, v) => a + v, 0) / ((sd(rs) || 1) * Math.sqrt(rs.length)); const i0 = ixm.get(c[i][0]), i21 = ixm.get(c[i - 21][0]); if (i0 && i21) sg.r21x = Math.log(px / at(i - 21)) - Math.log(i0 / i21); } }
        if (c[i].length > 2) { const v5 = c.slice(i - 4, i + 1).map(r => +r[2] || 0), v60 = c.slice(i - 64, i - 4).map(r => +r[2] || 0).filter(v => v > 0).sort((p, q) => p - q); if (v60.length > 30 && mean(v5) > 0) sg.abvol = Math.log(mean(v5) / v60[Math.floor(v60.length / 2)]); }
        snap.push({ mom, rsi, ma20D: px / (s20 / 20) - 1, trend: px > s200 / 200 ? 2 : -2, volUsed, fwd, sg }); });
      if (snap.length < 20) continue; nDates++; from = from || d; to = d;
      { const g = snap.filter(o => o.fwd[21] !== undefined); if (g.length >= 30) { const fr = rank(g.map(o => o.fwd[21])), row = {}; for (const k of V3_SIGNALS) { const ok = g.map((o, j) => [o.sg[k], fr[j]]).filter(r => r[0] !== null && isFinite(r[0])); if (ok.length >= 30) row[k] = pear(rank(ok.map(r => r[0])), ok.map(r => r[1])); } v3ic.push(row); } }
      const mm = mean(snap.map(o => o.mom)), sm = sd(snap.map(o => o.mom)) || 1, mr = median(snap.map(o => o.rsi)), m20 = median(snap.map(o => o.ma20D));
      for (const o of snap) { const z = clamp((o.mom - mm) / sm, -3, 3); o.a = { rev: 25 * (clamp(-(o.rsi - mr) / 12, -1, 1.5) + 0.5 * clamp(-(o.ma20D - m20) / 0.06, -1, 1)), mom: 10 * clamp(z, -2, 2), trend: o.trend }; }
      for (const h of H) { const g = snap.filter(o => o.fwd[h] !== undefined); if (g.length < 20) continue; const t = h / 252, w = W[HK[h]], rm = mean(g.map(o => o.fwd[h])), real = g.map(o => o.fwd[h] - rm);
        for (const k of comps) { if (!w[k]) continue; const p = g.map(o => w[k] * o.a[k] / 100 * t), pm = mean(p), pd = p.map(v => v - pm); let num = 0, den = 0; for (let i = 0; i < g.length; i++) { num += pd[i] * real[i]; den += pd[i] * pd[i]; } if (den > 0) slopes[h][k].push(num / den); }
        const tot = g.map(o => comps.reduce((a, k) => a + (w[k] || 0) * o.a[k], 0)); ics[h].push(pear(rank(tot), rank(real)));
        const ord = tot.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]), q = Math.max(1, Math.floor(g.length / 5)); spreads[h].push(mean(ord.slice(0, q).map(([, i]) => real[i])) - mean(ord.slice(-q).map(([, i]) => real[i])));
        for (let i = 0; i < g.length; i++) { const pt = tot[i] - mean(tot); if (Math.abs(pt) > 1e-9 && real[i] !== 0) { hits[h][1]++; if (Math.sign(pt) === Math.sign(real[i])) hits[h][0]++; } }
        for (const o of g) zs[h].push(o.fwd[h] / (o.volUsed / 100 * Math.sqrt(t))); nObs += g.length; }
    }
    if (nDates < 12) continue;
    // Fama-MacBeth: mean slope, t-statistic corrected for overlapping windows (effective dates = n · step / h)
    const fm = (a, h) => { if (a.length < 6) return { b: null, t: 0 }; const b = mean(a), s = sd(a) || 1e-9, nEff = Math.max(2, a.length * Math.min(1, step / h)); return { b, t: b / s * Math.sqrt(nEff) }; };
    const sc = {}, st = { dates: nDates, obs: nObs, stocks: L.length, from, to, signals: {}, horizons: {} };
    for (const k of comps) { const parts = H.filter(h => W[HK[h]][k]).map(h => ({ h, ...fm(slopes[h][k], h) })).filter(r => r.b !== null);
      const b = parts.length ? mean(parts.map(r => r.b)) : null, t = parts.length ? mean(parts.map(r => r.t)) : 0, shrink = t > 0 ? t * t / (t * t + 4) : 0;
      sc[k] = b === null ? 1 : +clamp(b * shrink, 0, 1.25).toFixed(3); st.signals[k] = { slope: b === null ? null : +b.toFixed(3), t: +t.toFixed(2), scale: sc[k], byH: parts.map(r => ({ h: r.h, slope: +r.b.toFixed(3), t: +r.t.toFixed(2) })) }; }
    sc.val = 1; // value needs point-in-time fundamentals, which are not stored: left as set
    const sig = [];
    for (const h of H) { const z = zs[h].map(v => v - mean(zs[h])), az = z.map(Math.abs).sort((a, b) => a - b); if (az.length < 200) continue; const q90 = az[Math.floor(az.length * 0.9)], inside = az.filter(v => v <= 1.645).length / az.length;
      const m = mean(z), v2 = mean(z.map(x => (x - m) ** 2)), k4 = mean(z.map(x => (x - m) ** 4)) / (v2 * v2) - 3;
      sig.push([h, +clamp(q90 / 1.645, 0.7, 1.8).toFixed(3)]);
      const icm = fm(ics[h], h), spr = mean(spreads[h]);
      st.horizons[h] = { coverage90: +(inside * 100).toFixed(1), sigMult: +(q90 / 1.645).toFixed(3), kurt: +k4.toFixed(2), ic: +(mean(ics[h]) || 0).toFixed(3), icT: +icm.t.toFixed(2), spreadAnn: +((Math.exp(spr * 252 / h) - 1) * 100).toFixed(1), hit: hits[h][1] ? +(hits[h][0] / hits[h][1] * 100).toFixed(1) : null }; }
    const k21 = st.horizons[21] ? st.horizons[21].kurt : 3; st.df = +clamp(k21 > 0.2 ? 4 + 6 / k21 : 30, 3, 30).toFixed(1);
    // scoring v3 weights: mean rank IC per signal, shrunk toward the research prior (tau 0.02), divided by its spread; negatives dropped
    const PRI = ccy === 'TRY' ? { lowvol: 0.02, idio: 0.01, hi52: 0.01, maxDay: 0.01, above200: 0.02 } : { lowvol: 0.01, hi52: 0.01, maxDay: 0.01, above200: 0.02, mom121ra: 0.02, resmom: 0.02 };
    const wv = {}, icS = {}; for (const k of V3_SIGNALS) { const a = v3ic.map(r => r[k]).filter(v => v !== undefined && isFinite(v)); if (a.length < 12) continue; const m = mean(a), s0 = sd(a) || 0.05, T = a.length, tau = 0.02, post = (T * m / (s0 * s0) + (PRI[k] || 0) / (tau * tau)) / (T / (s0 * s0) + 1 / (tau * tau));
      icS[k] = { ic: +m.toFixed(4), t: +(m / s0 * Math.sqrt(T)).toFixed(2), post: +post.toFixed(4) }; wv[k] = Math.max(0, post / s0); }
    const wt = Object.values(wv).reduce((a, v) => a + v, 0); if (wt > 0) { out.w = out.w || {}; out.w[ccy] = Object.fromEntries(Object.entries(wv).map(([k, v]) => [k, +(v / wt).toFixed(3)])); st.v3 = icS; }
    out.scale[ccy] = sc; out.sig[ccy] = sig; out.stats[ccy] = st; out.ok = true;
  }
  return out;
}

function ewmaVol(closes, lambda = 0.94) {
  const c = (closes || []).map(v => Array.isArray(v) ? +v[1] : +v).filter(v => v > 0); if (c.length < 21) return null;
  const r = []; for (let i = 1; i < c.length; i++) r.push(Math.log(c[i] / c[i - 1]));
  const k = Math.min(20, r.length); let v = 0; for (let i = 0; i < k; i++) v += r[i] * r[i]; v /= k;
  for (let i = k; i < r.length; i++) v = lambda * v + (1 - lambda) * r[i] * r[i];
  return Math.sqrt(v * 252) * 100;
}
function rng(seed) { let a = (Math.round(+seed || 1) >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// block bootstrap of the fund's historical daily returns. lineSeries: [{symbol, ccy, closes:[[date, close]]}], weights: same order;
// opts: {blocks: block length in trading days, n, seed, fx: USD/TRY closes (USD lines are converted to TRY), amount, bench: deposit net % at exit,
//        targetMult: re-centre so the mean terminal value equals this multiple (model expectation; the bootstrap supplies the shape), costPct, steps, lookback, minObs}
function bootstrapFan(lineSeries, weights, days, opts = {}) {
  const L = Math.max(1, Math.round(opts.blocks || 20)), n = Math.max(100, Math.round(opts.n || 2000)), H = Math.max(1, Math.round((+days || 0) * 252 / 365)), A = +opts.amount || 1, steps = Math.max(2, opts.steps || 20), look = opts.lookback || 756;
  const fxP = (opts.fx || []).filter(r => r && +r[1] > 0).map(r => [String(r[0]).slice(0, 10), +r[1]]).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const fxAt = d => { let lo = 0, hi = fxP.length - 1, ans = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (fxP[m][0] <= d) { ans = fxP[m][1]; lo = m + 1; } else hi = m - 1; } return ans; };
  const ls = (lineSeries || []).map((l, i) => ({ l, w: +weights[i] || 0 })).filter(o => o.w > 0 && o.l && Array.isArray(o.l.closes) && o.l.closes.length > 2);
  const wsum = ls.reduce((a, o) => a + o.w, 0); if (!ls.length || !(wsum > 0)) return null;
  const maps = ls.map(o => { const m = new Map(); for (const r of o.l.closes) { const d = String(r[0]).slice(0, 10), c = +r[1]; if (!(c > 0)) continue; if (o.l.ccy === 'USD') { if (!fxP.length) continue; const f = fxAt(d); if (!f) continue; m.set(d, c * f); } else m.set(d, c); } return m; });
  let dates = [...maps[0].keys()].filter(d => maps.every(m => m.has(d))).sort(); dates = dates.slice(-(look + 1));
  if (dates.length < (opts.minObs || 60) + 1) return null;
  const lr = new Float64Array(dates.length - 1);
  for (let i = 1; i < dates.length; i++) { let R = 0; for (let k = 0; k < ls.length; k++) R += ls[k].w / wsum * (maps[k].get(dates[i]) / maps[k].get(dates[i - 1]) - 1); lr[i - 1] = Math.log(Math.max(1e-6, 1 + R)); }
  const T = lr.length; let m0 = 0; for (const v of lr) m0 += v; m0 /= T; let v0 = 0; for (const v of lr) v0 += (v - m0) ** 2; v0 /= Math.max(1, T - 1);
  let shift = 0; if (opts.targetMult > 0) { shift = Math.log(opts.targetMult) / H - v0 / 2 - m0; for (let i = 0; i < T; i++) lr[i] += shift; }
  const rnd = rng(opts.seed ?? 1), stepIdx = Array.from({ length: steps + 1 }, (_, s) => Math.round(H * s / steps)), cps = Array.from({ length: steps + 1 }, () => new Float64Array(n));
  for (let k = 0; k < n; k++) {
    let acc = 0, h = 0, s = 0; while (s <= steps && stepIdx[s] === 0) { cps[s][k] = 1; s++; }
    while (h < H) { const st = Math.floor(rnd() * T); for (let j = 0; j < L && h < H; j++) { acc += lr[(st + j) % T]; h++; while (s <= steps && stepIdx[s] === h) { cps[s][k] = Math.exp(acc); s++; } } }
  }
  const cost = 1 - (+opts.costPct || 0) / 100; for (let s = 1; s <= steps; s++) for (let k = 0; k < n; k++) cps[s][k] *= cost;
  const qs = { p05: 0.05, p25: 0.25, p50: 0.5, p75: 0.75, p95: 0.95 }, paths = {}; for (const q of Object.keys(qs)) paths[q] = [];
  for (let s = 0; s <= steps; s++) { const a = Float64Array.from(cps[s]).sort(); for (const [q, p] of Object.entries(qs)) { const x = p * (n - 1), lo = Math.floor(x), hi = Math.min(n - 1, lo + 1); paths[q].push(A * (a[lo] + (a[hi] - a[lo]) * (x - lo))); } }
  const term = cps[steps]; let mean = 0; for (const v of term) mean += v; mean = mean / n * A;
  const benchV = opts.bench !== undefined && opts.bench !== null ? A * (1 + opts.bench / 100) : null; let beat = null; if (benchV !== null) { let c = 0; for (const v of term) if (v * A > benchV) c++; beat = c / n; }
  const out = { method: 'bootstrap', block: L, n, seed: opts.seed ?? 1, nObs: T, H, amount: A, mean, pBeat: beat, bench: benchV, paths, stepDays: stepIdx.map(i => Math.round(i * 365 / 252)), histAnn: (Math.exp(m0 * 252) - 1) * 100, histVol: Math.sqrt(v0 * 252) * 100, recentred: shift !== 0 };
  for (const q of Object.keys(qs)) out[q] = paths[q][steps];
  return out;
}
// forecast ledger: what was predicted at fund creation, scored later against what happened
function ledgerEntry(pkg, an, h, fan) {
  const inv = +(an && an.total) || +(pkg && pkg.total) || 0, days = Math.round(h && h.t ? h.t * 365 : (+(pkg && pkg.holdDays) || 182)), t = Math.max(1 / 365, days / 365);
  const Z = { p05: -1.6449, p25: -0.6745, p50: 0, p75: 0.6745, p95: 1.6449 }, q = {}; let pBeat, method;
  if (fan && fan.p50 > 0) { for (const k of Object.keys(Z)) q[k] = fan[k]; pBeat = fan.pBeat; method = fan.method || 'bootstrap'; }
  else { const s = Math.max(0.01, ((an && an.vol) || 20) / 100), m = Math.log(Math.max(1e-6, (h.exp || inv) / inv)) / t, base = (m - s * s / 2) * t; for (const k of Object.keys(Z)) q[k] = inv * Math.exp(base + Z[k] * s * Math.sqrt(t)); pBeat = 1 - phi((Math.log(Math.max(1e-9, (h.bench || inv) / inv)) - base) / (s * Math.sqrt(t))); method = 'lognormal'; }
  const r0 = v => v === null || v === undefined || !isFinite(v) ? null : Math.round(v * 100) / 100;
  return { fundId: fundId(pkg), pkgId: pkg && pkg.id, name: pkg && pkg.name, date: (pkg && pkg.date) || null, horizonDays: days, horizonLabel: h && h.label, invested: r0(inv), p05: r0(q.p05), p25: r0(q.p25), p50: r0(q.p50), p75: r0(q.p75), p95: r0(q.p95), exp: r0(h && h.exp), benchExp: r0(h && h.bench), pBeat: pBeat === null || pBeat === undefined ? null : Math.round(pBeat * 1000) / 1000, method, vol: an && an.vol !== undefined ? r0(an.vol) : null };
}
// valueAt(entry) → number | {value, date?, matured?}; today: ISO date. Live funds are compared with the band scaled to the elapsed share of the horizon.
function scoreLedger(entries, valueAt, today) {
  const rows = [];
  for (const en of entries || []) {
    if (!en || !(en.invested > 0) || !(en.p05 > 0) || !(en.p95 > 0) || !en.date) continue;
    const v0 = valueAt ? valueAt(en) : null, val = v0 && typeof v0 === 'object' ? +v0.value : +v0, end = addDays(en.date, en.horizonDays || 0);
    if (!(val > 0)) { rows.push({ fundId: en.fundId, pkgId: en.pkgId, name: en.name, date: en.date, end, status: 'no value' }); continue; }
    const td = today || (v0 && v0.date) || end, matured = v0 && typeof v0 === 'object' && v0.matured !== undefined ? !!v0.matured : td >= end;
    const f = matured ? 1 : clamp(daysBetween(en.date, td) / Math.max(1, en.horizonDays), 1e-3, 1), inv = en.invested, lq = k => Math.log(en[k] / inv), mid = lq('p50');
    const at = k => inv * Math.exp(mid * f + (lq(k) - mid) * Math.sqrt(f)), band = { p05: at('p05'), p25: at('p25'), p50: at('p50'), p75: at('p75'), p95: at('p95') };
    const sLog = Math.max(1e-6, (lq('p95') - lq('p05')) / (2 * 1.6449) * Math.sqrt(f)), pct = phi((Math.log(val / inv) - mid * f) / sLog) * 100;
    const expAt = inv * Math.pow((en.exp || inv) / inv, f), benchAt = inv * Math.pow((en.benchExp || inv) / inv, f);
    rows.push({ fundId: en.fundId, pkgId: en.pkgId, name: en.name, date: en.date, end, status: matured ? 'matured' : 'live', elapsed: f, value: val, band, pct, inside50: val >= band.p25 && val <= band.p75, inside90: val >= band.p05 && val <= band.p95,
      err: (val - expAt) / inv * 100, beat: val > benchAt, pBeat: en.pBeat, method: en.method });
  }
  const mat = rows.filter(r => r.status === 'matured'), avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const buckets = [0, 20, 40, 60, 80].map(lo => { const k = mat.filter(r => r.pct >= lo && (r.pct < lo + 20 || (lo === 80 && r.pct <= 100))).length; return { lo, hi: lo + 20, n: k, share: mat.length ? k / mat.length : null }; });
  const wb = mat.filter(r => r.pBeat !== null && r.pBeat !== undefined);
  return { n: rows.length, matured: mat.length, live: rows.filter(r => r.status === 'live').length, coverage50: mat.length ? mat.filter(r => r.inside50).length / mat.length : null, coverage90: mat.length ? mat.filter(r => r.inside90).length / mat.length : null,
    meanError: avg(mat.map(r => r.err)), brier: wb.length ? avg(wb.map(r => (r.pBeat - (r.beat ? 1 : 0)) ** 2)) : null, liveInside90: rows.filter(r => r.status === 'live').length ? rows.filter(r => r.status === 'live' && r.inside90).length / rows.filter(r => r.status === 'live').length : null, buckets, rows };
}

/* ---------- fund model: per-line expectations and a covariance matrix, shared by beatDeposit / riskBudget / swaps / hedge ---------- */
const isFundCls = x => x && (x.cls === 'TEFAS' || x.cls === 'TR_ETF');
function fundModel(syms, S, M, map, days, total) {
  const X = syms.map(s => map[s]), n = X.length, t = Math.max(1 / 365, (+days || 182) / 365), A = Math.max(1000, (+total || 100000) * 0.1);
  const safe = (f, d) => { try { const v = f(); return isFinite(v) ? v : d; } catch (e) { return d; } };
  const ex = X.map(x => safe(() => scenario(x, A, t, S, M, x.z || {}).exp.roi * 100, 0)), ex6 = X.map(x => safe(() => scenario(x, A, 0.5, S, M, x.z || {}).exp.roi * 100, 0));
  const vol = X.map(x => (x.e && x.e.volUsed) || 30);
  // aligned daily log returns over the union of the last ~262 dates
  const R = X.map(x => { const c = Array.isArray(x.closes) ? x.closes : []; const o = new Map(); for (let i = Math.max(1, c.length - 262); i < c.length; i++) if (+c[i][1] > 0 && +c[i - 1][1] > 0) o.set(c[i][0], Math.log(c[i][1] / c[i - 1][1])); return o; });
  const ds = new Set(); R.forEach(r => r.forEach((_, d) => ds.add(d))); const dl = [...ds].sort(), D = dl.length, di = new Map(dl.map((d, i) => [d, i]));
  const arr = R.map(r => { const a = new Float64Array(D).fill(NaN); r.forEach((v, d) => { a[di.get(d)] = v; }); return a; });
  const C = new Float64Array(n * n), rho = new Float64Array(n * n);
  for (let i = 0; i < n; i++) { rho[i * n + i] = 1; for (let j = i + 1; j < n; j++) {
    let c = null; if (R[i].size >= 20 && R[j].size >= 20) { let k = 0, sa = 0, sb = 0; for (let q = 0; q < D; q++) { const a = arr[i][q], b = arr[j][q]; if (a === a && b === b) { k++; sa += a; sb += b; } }
      if (k >= 20) { const ma = sa / k, mb = sb / k; let s = 0, va = 0, vb = 0; for (let q = 0; q < D; q++) { const a = arr[i][q], b = arr[j][q]; if (a === a && b === b) { s += (a - ma) * (b - mb); va += (a - ma) ** 2; vb += (b - mb) ** 2; } } if (va > 0 && vb > 0) c = s / Math.sqrt(va * vb); } }
    if (c === null) c = X[i].e && X[j].e ? defaultCorr(X[i], X[j]) : 0.3; rho[i * n + j] = rho[j * n + i] = c; } }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i * n + j] = rho[i * n + j] * vol[i] * vol[j];
  const meta = X.map(x => ({ symbol: x.symbol, fund: isFundCls(x), sector: (x.e && x.e.sector) || 'Unclassified', usd: x.ccy === 'USD', cls: x.cls, name: x.name || '', minOrder: minOrder(x, S, M) || 0 }));
  return { syms, X, n, t, days: Math.round(t * 365), ex, ex6, vol, C, rho, meta, dep: benchNet(S, t * 365, undefined, M), dep6: benchNet(S, 182, undefined, M) };
}
function capExcess(fm, w, S) { // percentage points above the caps (single stock, single fund, sector, positions above 5%)
  let ex = 0, big = 0; const sec = {}; const cs = (S.capStock || 10) / 100, cf = (S.capFund || 40) / 100;
  for (let i = 0; i < fm.n; i++) { const v = w[i]; if (v <= 1e-9) continue; const m = fm.meta[i]; if (m.fund) { if (v > cf) ex += v - cf; continue; } if (v > cs) ex += v - cs; if (v > 0.05) big += v; sec[m.sector] = (sec[m.sector] || 0) + v; }
  for (const v of Object.values(sec)) if (v > (S.capSector || 25) / 100) ex += v - (S.capSector || 25) / 100; if (big > (S.capBig || 40) / 100) ex += big - (S.capBig || 40) / 100;
  return ex * 100;
}
function fundMetrics(fm, w, S, cash = 0) { // w: weights of the lines (sum 1 − cash); cash earns the deposit
  let e = cash * fm.dep, e6 = cash * fm.dep6, v = 0, usd = 0; for (let i = 0; i < fm.n; i++) { if (!w[i]) continue; e += w[i] * fm.ex[i]; e6 += w[i] * fm.ex6[i]; if (fm.meta[i].usd) usd += w[i]; for (let j = 0; j < fm.n; j++) if (w[j]) v += w[i] * w[j] * fm.C[i * fm.n + j]; }
  const vol = Math.sqrt(Math.max(0, v)), worst6 = ((1 + e6 / 100) * Math.exp(-2 * vol / 100 * Math.sqrt(0.5)) - 1) * 100;
  return { exp: e, exp6: e6, vol, worst6, dep: fm.dep, edge: e - fm.dep, usd: usd * 100, caps: capExcess(fm, w, S) };
}
const r2 = v => v === null || v === undefined || !isFinite(v) ? null : Math.round(v * 100) / 100;
const pubMetrics = (m, need) => ({ exp: r2(m.exp), dep: r2(m.dep), need: r2(need), edge: r2(m.edge), vol: r2(m.vol), worst6: r2(m.worst6), usd: r2(m.usd), caps: r2(m.caps) });

/* ---------- Beat the deposit: the smallest change that lifts expected net return above the deposit (+ margin) within the risk limits ---------- */
// lines: [{symbol, amount, minAmount?}]; map: scored instruments (with closes where available); opts: {days, margin (points a year over the deposit), volMax, worstMin (6-month worst case %),
//   usdTarget (%), usdTol, candidates (symbols), nCand, step (weight step), maxNew, maxIt, variants: ['all','existing','bist','us']}
function beatDeposit(lines, S, M, map, opts = {}) {
  const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(), nowMs = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
  const L = (lines || []).filter(l => l && map[l.symbol] && map[l.symbol].e && +l.amount > 0), total = L.reduce((a, l) => a + +l.amount, 0); if (!L.length || !total) return { proposals: [], before: null, reason: 'no priced lines' };
  const days = Math.round(opts.days || 182), hk = hBucket(hKeyForDays(days)), have = new Set(L.map(l => l.symbol));
  const hs = x => (x.scoreH && x.scoreH[hk] !== undefined && x.scoreH[hk] !== null) ? x.scoreH[hk] : (x.score ?? -1);
  let cand = opts.candidates ? opts.candidates.filter(s => map[s] && !have.has(s)) : null;
  if (!cand) { const all = Object.values(map).filter(x => x && x.e && x.e.price && !have.has(x.symbol) && (x.cls === 'TR_EQ' || x.cls === 'US_EQ') && (!x.gate || x.gate.ok) && x.score !== null && x.score !== undefined && !(x.e.flags || []).some(f => f !== 'proxy' && f !== 'stale history'));
    const per = Math.round((opts.nCand || 80) / 2); cand = [...all.filter(x => x.ccy !== 'USD').sort((a, b) => hs(b) - hs(a)).slice(0, per), ...all.filter(x => x.ccy === 'USD').sort((a, b) => hs(b) - hs(a)).slice(0, per)].map(x => x.symbol); }
  const syms = [...L.map(l => l.symbol), ...cand], fm = fundModel(syms, S, M, map, days, total), n = fm.n, nL = L.length;
  const w0 = new Float64Array(n); L.forEach((l, i) => w0[i] = +l.amount / total); const minW = new Float64Array(n); L.forEach((l, i) => minW[i] = Math.min(w0[i], Math.max(0, +l.minAmount || 0) / total));
  const before = fundMetrics(fm, w0, S), need = fm.dep + (+opts.margin || 0) * fm.t, volTgt = opts.volMax ?? (S.principal === 'USD' ? (S.volTargetUsd || 15) : (S.volTarget || 20)), volMax = Math.max(volTgt, opts.volMax !== undefined ? 0 : before.vol + 0.01);
  const worstMin = opts.worstMin ?? null, usdT = opts.usdTarget ?? null, usdTol = opts.usdTol ?? 10, cap0 = before.caps, step = opts.step || 0.05, maxNew = opts.maxNew ?? (usdT !== null ? 6 : 3), maxIt = opts.maxIt || 60;
  const pen = m => Math.max(0, need - m.exp) + 0.5 * Math.max(0, m.vol - volMax) + (worstMin !== null ? 0.5 * Math.max(0, worstMin - m.worst6) : 0) + 2 * Math.max(0, m.caps - cap0 - 0.01) + (usdT !== null ? 0.2 * Math.max(0, Math.abs(m.usd - usdT) - usdTol) : 0);
  const unmetOf = m => [m.exp < need - 1e-6 ? 'return' : null, m.vol > volMax + 1e-6 ? 'volatility' : null, worstMin !== null && m.worst6 < worstMin - 1e-6 ? 'worst case' : null, m.caps > cap0 + 0.01 ? 'caps' : null, usdT !== null && Math.abs(m.usd - usdT) > usdTol + 1e-6 ? 'USD share' : null].filter(Boolean);
  const minOrderW = fm.meta.map(m => m.minOrder / total);
  function search(pool) {
    const w = Float64Array.from(w0); let m = fundMetrics(fm, w, S), P = pen(m);
    const isNew = i => i >= nL, newCount = () => { let c = 0; for (let i = nL; i < n; i++) if (w[i] > 1e-9) c++; return c; };
    for (let it = 0; it < maxIt && P > 1e-9; it++) {
      const Cw = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) if (w[j]) s += fm.C[i * n + j] * w[j]; Cw[i] = s; }
      const var0 = m.vol * m.vol, nc = newCount(); let best = null;
      for (let j = 0; j < n; j++) { if (w[j] <= minW[j] + 1e-9) continue; const room = w[j] - minW[j];
        for (const i of pool) { if (i === j) continue; if (isNew(i) && w[i] <= 1e-9 && nc >= maxNew) continue; let d = Math.min(step, room); if (w[i] <= 1e-9 && minOrderW[i] > d) { if (room >= minOrderW[i]) d = minOrderW[i]; else continue; }
          const e = m.exp + d * (fm.ex[i] - fm.ex[j]), e6 = m.exp6 + d * (fm.ex6[i] - fm.ex6[j]), vv = var0 + 2 * d * (Cw[i] - Cw[j]) + d * d * (fm.C[i * n + i] + fm.C[j * n + j] - 2 * fm.C[i * n + j]), vol = Math.sqrt(Math.max(0, vv));
          w[i] += d; w[j] -= d; const caps = capExcess(fm, w, S); w[i] -= d; w[j] += d;
          const usd = m.usd + d * 100 * ((fm.meta[i].usd ? 1 : 0) - (fm.meta[j].usd ? 1 : 0)), mm = { exp: e, exp6: e6, vol, worst6: ((1 + e6 / 100) * Math.exp(-2 * vol / 100 * Math.sqrt(0.5)) - 1) * 100, caps, usd };
          const P2 = pen(mm), gain = (P - P2) / d + 1e-6 * (fm.ex[i] - fm.ex[j]);
          if (P2 < P - 1e-9 && (!best || gain > best.gain)) best = { i, j, d, gain }; } }
      if (!best) break; w[best.i] += best.d; w[best.j] -= best.d; if (w[best.j] < 1e-9) w[best.j] = 0; m = fundMetrics(fm, w, S); P = pen(m);
    }
    if (P <= 1e-9) { // local search: undo as much of the change as possible while staying inside the limits
      for (let round = 0; round < 40; round++) { let improved = false;
        for (let k = 0; k < n && !improved; k++) { const dk = w[k] - w0[k]; if (Math.abs(dk) < 1e-9) continue;
          for (let l = 0; l < n && !improved; l++) { const dl = w[l] - w0[l]; if (l === k || !(dk > 0 && dl < 0)) continue; const d = Math.min(dk, -dl, step / 2); if (d < 1e-6) continue;
            w[k] -= d; w[l] += d; const keep = w[k] < 1e-9 || !(w0[k] <= 1e-9 && w[k] * total < fm.meta[k].minOrder); if (keep && pen(fundMetrics(fm, w, S)) <= 1e-9) { if (w[k] < 1e-9) w[k] = 0; improved = true; } else { w[k] += d; w[l] -= d; } } }
        if (!improved) break; }
      m = fundMetrics(fm, w, S); P = pen(m);
    }
    for (let i = nL; i < n; i++) if (w[i] > 1e-9 && w[i] < 0.01) { const big = w.indexOf(Math.max(...w)); w[big] += w[i]; w[i] = 0; } // no crumbs
    return { w, m: fundMetrics(fm, w, S) };
  }
  const idxL = [...Array(nL).keys()], idxT = idxL.concat([...Array(n - nL).keys()].map(k => k + nL).filter(i => !fm.meta[i].usd)), idxU = idxL.concat([...Array(n - nL).keys()].map(k => k + nL).filter(i => fm.meta[i].usd));
  const VAR = { all: ['Mixed BIST + US candidates', [...Array(n).keys()]], existing: ['Re-weight the existing lines only', idxL], bist: ['BIST candidates only', idxT], us: ['US candidates only', idxU] };
  const out = [], seen = new Set();
  for (const v of (opts.variants || ['all', 'existing', 'bist', 'us'])) { if (!VAR[v]) continue; const [label, pool] = VAR[v]; const r = search(pool);
    const amts = Array.from(r.w, x => Math.round(total * x / 100) * 100); const diff = Math.round(total) - amts.reduce((a, b) => a + b, 0); if (amts.length) amts[amts.indexOf(Math.max(...amts))] += diff;
    const key = amts.join(','); if (seen.has(key)) continue; seen.add(key);
    const moves = []; for (let i = 0; i < n; i++) { const a0 = i < nL ? Math.round(+L[i].amount) : 0, a1 = amts[i]; if (Math.abs(a1 - a0) < 100) continue; const type = a0 === 0 ? 'add' : a1 === 0 ? 'cut' : a1 > a0 ? 'raise' : 'trim'; moves.push({ type, symbol: fm.syms[i], sector: fm.meta[i].sector, from: a0, to: a1, delta: a1 - a0, fromW: r2(a0 / total * 100), toW: r2(a1 / total * 100), exp: r2(fm.ex[i]), vol: r2(fm.vol[i]) }); }
    const adds = moves.filter(q => q.type === 'add'), cuts = moves.filter(q => q.type === 'cut'); if (adds.length === 1 && cuts.length === 1 && Math.abs(adds[0].to - cuts[0].from) < total * 0.02) { adds[0].type = 'swap'; adds[0].replaces = cuts[0].symbol; }
    const unmet = unmetOf(r.m), turnover = moves.reduce((a, q) => a + Math.abs(q.delta), 0) / 2 / total * 100;
    out.push({ key: v, label, feasible: !unmet.length, unmet, turnover: r2(turnover), moves, lines: amts.map((a, i) => ({ symbol: fm.syms[i], amount: a })).filter(q => q.amount > 0), before: pubMetrics(before, need), after: pubMetrics(r.m, need), penalty: r2(pen(r.m)) });
  }
  const ranked = rankProposals(out.filter(p => p.moves.length));
  return { proposals: ranked, before: pubMetrics(before, need), need: r2(need), dep: r2(fm.dep), margin: +opts.margin || 0, days, horizonKey: hk, volMax: r2(volMax), volTarget: volTgt, worstMin, usdTarget: usdT, alreadyBeats: !unmetOf(before).length,
    candidates: cand.length, volRelaxed: opts.volMax === undefined && before.vol > volTgt, ms: Math.round(nowMs()) };
}
function rankProposals(list) { return (list || []).slice().sort((a, b) => (b.feasible - a.feasible) || (a.feasible ? (a.turnover - b.turnover) || (b.after.edge - a.after.edge) : (a.penalty - b.penalty) || (a.turnover - b.turnover))); }

/* ---------- risk budget: each line's share of fund volatility, and what a 5-point cut buys ---------- */
function riskBudget(lines, S, M, map, opts = {}) {
  const L = (lines || []).filter(l => l && map[l.symbol] && map[l.symbol].e && +l.amount > 0), total = L.reduce((a, l) => a + +l.amount, 0); if (!L.length) return null;
  const days = opts.days || 182, fm = fundModel(L.map(l => l.symbol), S, M, map, days, total), n = fm.n, w = Float64Array.from(L.map(l => +l.amount / total)), base = fundMetrics(fm, w, S), cutPt = opts.cut || 5;
  const Cw = new Float64Array(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Cw[i] += fm.C[i * n + j] * w[j];
  const v2 = Math.max(1e-9, base.vol * base.vol);
  const items = L.map((l, i) => ({ symbol: l.symbol, sector: fm.meta[i].sector, w: r2(w[i] * 100), vol: r2(fm.vol[i]), rc: r2(w[i] * Cw[i] / base.vol), rcPct: r2(w[i] * Cw[i] / v2 * 100), mcr: r2(Cw[i] / base.vol), ratio: r2((w[i] * Cw[i] / v2) / Math.max(1e-9, w[i])) })).sort((a, b) => b.rcPct - a.rcPct);
  const cuts = items.slice(0, opts.top || 3).map(it => { const i = L.findIndex(l => l.symbol === it.symbol), d = Math.min(w[i], cutPt / 100), w2 = Float64Array.from(w); w2[i] -= d; const m = fundMetrics(fm, w2, S, d);
    return { symbol: it.symbol, cut: r2(d * 100), amount: Math.round(total * d / 100) * 100, dVol: r2(m.vol - base.vol), dWorst: r2(m.worst6 - base.worst6), dExp: r2(m.exp - base.exp), after: pubMetrics(m, fm.dep) }; });
  return { vol: r2(base.vol), worst6: r2(base.worst6), exp: r2(base.exp), dep: r2(fm.dep), items, cuts, days };
}

/* ---------- swaps: same sector, better score for the horizon, calmer ---------- */
function swapSuggestions(lines, S, M, map, opts = {}) {
  const L = (lines || []).filter(l => l && map[l.symbol] && map[l.symbol].e && +l.amount > 0), total = L.reduce((a, l) => a + +l.amount, 0); if (!L.length) return [];
  const days = opts.days || 182, hk = hBucket(hKeyForDays(days)), have = new Set(L.map(l => l.symbol)), minGain = opts.minGain ?? 5;
  const hs = x => (x.scoreH && x.scoreH[hk] !== undefined && x.scoreH[hk] !== null) ? x.scoreH[hk] : (x.score ?? null);
  const pool = (opts.candidates ? opts.candidates.map(s => map[s]) : Object.values(map)).filter(x => x && x.e && x.e.price && !have.has(x.symbol) && (x.cls === 'TR_EQ' || x.cls === 'US_EQ') && (!x.gate || x.gate.ok) && hs(x) !== null);
  const pairs = [];
  for (const l of L) { const x = map[l.symbol]; if (isFundCls(x)) continue; const s0 = hs(x) ?? 0;
    const c = pool.filter(y => y.e.sector === x.e.sector && (opts.sameCcy === false || y.ccy === x.ccy) && hs(y) >= s0 + minGain && y.e.volUsed < x.e.volUsed && !(y.ccy === 'USD' && (minOrder(y, S, M) || 0) > +l.amount)).sort((a, b) => hs(b) - hs(a)).slice(0, opts.perLine || 4);
    for (const y of c) pairs.push([l.symbol, y.symbol]); }
  if (!pairs.length) return [];
  const syms = [...L.map(l => l.symbol), ...new Set(pairs.map(p => p[1]))], fm = fundModel(syms, S, M, map, days, total), w = new Float64Array(fm.n); L.forEach((l, i) => w[i] = +l.amount / total);
  const base = fundMetrics(fm, w, S), out = [];
  for (const [a, b] of pairs) { const i = syms.indexOf(a), j = syms.indexOf(b), w2 = Float64Array.from(w); w2[j] = w2[i]; w2[i] = 0; const m = fundMetrics(fm, w2, S), xa = map[a], xb = map[b];
    out.push({ from: a, to: b, toName: xb.name || '', sector: xb.e.sector, amount: Math.round(w[i] * total), scoreFrom: hs(xa), scoreTo: hs(xb), volFrom: r2(xa.e.volUsed), volTo: r2(xb.e.volUsed), dExp: r2(m.exp - base.exp), dVol: r2(m.vol - base.vol), dWorst: r2(m.worst6 - base.worst6), rank: (m.exp - base.exp) + 0.5 * (m.worst6 - base.worst6) - 0.3 * (m.vol - base.vol) }); }
  out.sort((p, q) => q.rank - p.rank); const per = {}, res = []; for (const r of out) { if (r.dExp < -(opts.maxExpCost ?? 1)) continue; /* a swap that costs more than 1 pt of expected return is not offered */ per[r.from] = (per[r.from] || 0) + 1; if (per[r.from] > 2) continue; res.push(r); if (res.length >= (opts.max || 6)) break; }
  return res;
}

/* ---------- earnings rule: lines reporting within n trading days of the first tranche ---------- */
function earningsFlags(lines, reports, firstDate, n = 5) {
  const items = Array.isArray(reports) ? reports : (reports && reports.items) || [], out = [];
  for (const l of lines || []) { const r = items.filter(q => q && q.symbol === l.symbol && q.date && q.date >= firstDate && bizDays(firstDate, q.date) <= n).sort((a, b) => a.date < b.date ? -1 : 1)[0]; if (r) out.push({ symbol: l.symbol, date: r.date, est: !!r.est, tradingDays: bizDays(firstDate, r.date) }); }
  return out;
}

/* ---------- hedge sleeve: USD / gold share that neutralises a lira shock on the fund's TRY value ---------- */
function hedgeSleeve(lines, S, M, map, opts = {}) {
  const L = (lines || []).filter(l => l && map[l.symbol] && map[l.symbol].e && +l.amount > 0), total = L.reduce((a, l) => a + +l.amount, 0); if (!L.length) return null;
  const s = (opts.shock ?? 20) / 100, up = 1 / (1 - s) - 1, k = s / 0.3; // 30% lira shock ↔ BIST −20% × beta in TRY (stressTRYShock), scaled to this shock
  const gold = x => (x.cls === 'TR_ETF' || x.cls === 'TEFAS') && /GLD|ALTIN|GOLD|XAU/i.test(x.symbol + ' ' + (x.name || '')), usdFund = x => (x.cls === 'TEFAS' || x.cls === 'TR_ETF') && /D[ÖO]V[İI]Z|EUROBOND|USD|DOLAR|DOLLAR/i.test(x.symbol + ' ' + (x.name || ''));
  const react = x => { const b = clamp((x.e && x.e.beta) ?? 1, 0, 2); if (gold(x)) return up * 0.95; if (usdFund(x)) return up * 0.98; if (x.ccy === 'USD') return (1 + up) * (1 - 0.05 * b * k) - 1; if (x.cls === 'TEFAS' && !x.hy) return 0.01 * k; return -0.2 * b * k; };
  let loss = 0, usdShare = 0; for (const l of L) { const x = map[l.symbol], w = +l.amount / total; loss += w * react(x); if (x.ccy === 'USD' || gold(x) || usdFund(x)) usdShare += w; }
  const cands = Object.values(map).filter(x => x && x.e && x.e.price && (gold(x) || usdFund(x)) && x.cls !== 'MACRO' && x.ccy !== 'USD').sort((a, b) => (gold(b) - gold(a)) || ((b.e.turnover || 0) - (a.e.turnover || 0)) || ((b.score || 0) - (a.score || 0))).slice(0, opts.max || 4)
    .map(x => ({ symbol: x.symbol, name: x.name || '', kind: gold(x) ? 'gold' : 'usd', cls: x.cls, gain: r2(react(x) * 100), vol: r2(x.e.volUsed) }));
  const g = cands.length ? cands[0].gain / 100 : up, h = loss >= 0 ? 0 : clamp(-loss / (g - loss), 0, 0.6), fxVol = +S.fxVol || 8;
  return { shock: s * 100, fxUp: r2(up * 100), loss: r2(loss * 100), lossTRY: Math.round(loss * total), usdShare: r2(usdShare * 100), share: r2(h * 100), amount: Math.round(h * total / 100) * 100, after: r2(((1 - h) * loss + h * g) * 100), sigmaMove: r2(Math.log(1 + up) / (fxVol / 100)), candidates: cands, hedged: loss >= 0 };
}

/* ---------- Faber condition on month-end closes: has the index closed a month above its 10-month average? ---------- */
function faberMonthly(closes, today) {
  const c = (closes || []).filter(r => r && +r[1] > 0), me = []; for (const r of c) { const m = String(r[0]).slice(0, 7); if (me.length && me[me.length - 1][0] === m) me[me.length - 1] = [m, +r[1], r[0]]; else me.push([m, +r[1], r[0]]); }
  if (today && me.length && me[me.length - 1][0] === String(today).slice(0, 7)) me.pop(); // the current month is not complete yet
  if (me.length < 10) return { met: null, months: me.length };
  const last = me[me.length - 1], sma = me.slice(-10).reduce((a, r) => a + r[1], 0) / 10;
  return { met: last[1] > sma, month: last[0], close: last[1], date: last[2], sma, gap: (last[1] / sma - 1) * 100, months: me.length };
}

return { indicators, setCalib, getCalib, calibrate, calScale, calSig, num, clamp, CLASSES, GOLD, BOND, HORIZONS, SCEN_HORIZONS, GROUPS, PRESETS, DEFAULT_SETTINGS, AK_TIERS, enrich, macroView, regime, expected, costs, akRate, minOrder, taxPct, taxLabel,
  horizons, scoreAll, explain, scenario, packageAnalytics, portfolioRisk, roman, longDate, addMonths, picks, holdingsView, alerts, sellList, brief, statementModel, packageModel, tearsheetModel, fundId,
  renderPDF, renderDOCX, fmtTRY, fmtPct, fmtN, DISCLAIMER, riskBucket, closesOf, seriesStats, normRating, brokerLatest, consensus, brokerSignals, brokerDigestModel,
  benchNet, benchLabel, depTax, addDays, daysBetween, makeFx, setDisplay, money, realPct, breakeven, exitPlan, earlyExit, alternatives, perfSeries, backtest, DISPLAY,
  V3_DEFAULT_W, V3_SIGNALS, v3Weights, v3Edge, V3_DEC, barsOf, gate, faber, stopDist, trailLevel, realisedVol, capsCheck, diversificationLabel, suggestWeights,
  fxRate, depositPath, rfTry, ewmaVol, horizonWeights, hKeyForDays, bootstrapFan, ledgerEntry, scoreLedger, fundModel, fundMetrics, beatDeposit, rankProposals, riskBudget, swapSuggestions, earningsFlags, hedgeSleeve, faberMonthly, bizDays, dailyReturns };
})();
if (typeof module !== 'undefined') module.exports = ENGINE;
/*</ENGINE>*/
