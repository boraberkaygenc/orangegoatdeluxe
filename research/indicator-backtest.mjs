// Event study of technical-indicator signals, BIST (TRY) and US (USD), 2017–2026.
// Excess = log return of stock minus log return of index (XU100 / SPX) over h trading days after the signal close.
import fs from 'fs';
const P = JSON.parse(fs.readFileSync(process.argv[2] || 'ohlc.json'));
const HS = [5, 10, 21, 63], MINTV = { TRY: 30e6, USD: 20e6 }, COOL = 10;
const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1), sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };
function ema(a, n) { const k = 2 / (n + 1), o = new Array(a.length); let e = null; for (let i = 0; i < a.length; i++) { const v = a[i]; if (v == null) { o[i] = e; continue; } e = e == null ? v : v * k + e * (1 - k); o[i] = e; } return o; }
function wilder(a, n) { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { if (i < n) { s += a[i]; if (i === n - 1) o[i] = s / n; continue; } o[i] = (o[i - 1] * (n - 1) + a[i]) / n; } return o; }
function rsi(c, n) { const g = [0], l = [0]; for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g.push(Math.max(d, 0)); l.push(Math.max(-d, 0)); } const G = wilder(g, n), L = wilder(l, n); return G.map((x, i) => x == null ? null : L[i] === 0 ? 100 : 100 - 100 / (1 + x / L[i])); }
const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) o[i] = s / n; } return o; };
const rollMax = (a, n) => a.map((_, i) => i < n - 1 ? null : Math.max(...a.slice(i - n + 1, i + 1)));
const rollMin = (a, n) => a.map((_, i) => i < n - 1 ? null : Math.min(...a.slice(i - n + 1, i + 1)));
const SIG = {}; // name -> {TRY: [], USD: []} of {d, x:{h:excess}, a:{h:abs}}
const add = (name, ccy, ev) => { (SIG[name] = SIG[name] || { TRY: [], USD: [] })[ccy].push(ev); };
for (const ccy of ['TRY', 'USD']) {
  const ixs = ccy === 'TRY' ? 'XU100' : 'SPX', IX = P[ixs]; if (!IX) { console.error('no index', ixs); continue; } const ix = new Map(IX.rows.map(r => [r[0], r[1]]));
  for (const S of Object.values(P)) { if (S.ccy !== ccy || S.idx || S.s === ixs || S.rows.length < 300) continue;
    const R = S.rows, n = R.length, d = R.map(r => r[0]), c = R.map(r => r[1]), v = R.map(r => r[2]), H = R.map(r => r[3] || r[1]), L = R.map(r => r[4] || r[1]), O = R.map(r => r[5] || r[1]);
    let bad = false; for (let i = 1; i < n; i++) if (Math.abs(Math.log(c[i] / c[i - 1])) > 0.45) { bad = true; break; } if (bad) continue;
    const tv = c.map((x, i) => x * v[i]), r14 = rsi(c, 14), r2 = rsi(c, 2), e12 = ema(c, 12), e26 = ema(c, 26), macd = e12.map((x, i) => x - e26[i]), sig = ema(macd, 9);
    const m20 = sma(c, 20), m50 = sma(c, 50), m200 = sma(c, 200), sq = c.map((_, i) => i < 19 ? null : sd(c.slice(i - 19, i + 1))), ub = m20.map((m, i) => m == null ? null : m + 2 * sq[i]), lb = m20.map((m, i) => m == null ? null : m - 2 * sq[i]), bw = m20.map((m, i) => m == null ? null : 4 * sq[i] / m);
    const hh14 = rollMax(H, 14), ll14 = rollMin(L, 14), K = c.map((x, i) => hh14[i] == null || hh14[i] === ll14[i] ? null : 100 * (x - ll14[i]) / (hh14[i] - ll14[i])), Ks = sma(K.map(x => x ?? 50), 3), Ds = sma(Ks.map(x => x ?? 50), 3);
    const tr = [0], pdm = [0], mdm = [0]; for (let i = 1; i < n; i++) { tr.push(Math.max(H[i] - L[i], Math.abs(H[i] - c[i - 1]), Math.abs(L[i] - c[i - 1]))); const up = H[i] - H[i - 1], dn = L[i - 1] - L[i]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); }
    const ATR = wilder(tr, 14), PD = wilder(pdm, 14), MD = wilder(mdm, 14), pdi = PD.map((x, i) => x == null || !ATR[i] ? null : 100 * x / ATR[i]), mdi = MD.map((x, i) => x == null || !ATR[i] ? null : 100 * x / ATR[i]);
    const dx = pdi.map((p, i) => p == null || p + mdi[i] === 0 ? 0 : 100 * Math.abs(p - mdi[i]) / (p + mdi[i])), ADX = wilder(dx.map((x, i) => i < 14 ? 0 : x), 14);
    const obv = [0]; for (let i = 1; i < n; i++) obv.push(obv[i - 1] + (c[i] > c[i - 1] ? v[i] : c[i] < c[i - 1] ? -v[i] : 0));
    const hi252 = rollMax(c, 252), lo252 = rollMin(c, 252), hi60 = rollMax(c, 60), lo20 = rollMin(c, 20), obvHi60 = rollMax(obv, 60), bwLo = rollMin(bw.map(x => x ?? 9), 126), v60 = sma(v, 60);
    const last = {};
    for (let i = 260; i < n - 5; i++) { const ia = ix.get(d[i]); if (!ia) continue;
      const tvs = tv.slice(i - 59, i + 1).sort((a, b) => a - b)[30]; if (!(tvs >= MINTV[ccy])) continue;
      const x = {}, a = {}; for (const h of HS) if (i + h < n) { const ib = ix.get(d[i + h]); if (!ib) continue; a[h] = Math.log(c[i + h] / c[i]); x[h] = a[h] - Math.log(ib / ia); }
      const ev = { d: d[i], x, a }, fire = name => { if (last[name] != null && i - last[name] < COOL) return; last[name] = i; add(name, ccy, ev); };
      fire('ALL (baz: rastgele gün)');
      const up200 = c[i] > m200[i], r1 = Math.log(c[i] / c[i - 1]);
      if (r14[i] < 30 && r14[i - 1] >= 30) { fire('RSI14 30 altına indi'); fire(up200 ? 'RSI14 30 altı + 200G üstü' : 'RSI14 30 altı + 200G altı'); }
      if (r14[i] > 70 && r14[i - 1] <= 70) { fire('RSI14 70 üstüne çıktı'); fire(up200 ? 'RSI14 70 üstü + 200G üstü' : 'RSI14 70 üstü + 200G altı'); }
      if (r2[i] < 10 && up200) fire('RSI2 < 10 + 200G üstü (kısa dönüş)');
      if (r2[i] > 90 && !up200) fire('RSI2 > 90 + 200G altı');
      if (macd[i] > sig[i] && macd[i - 1] <= sig[i - 1]) { fire('MACD al kesişimi'); fire(macd[i] < 0 ? 'MACD al kesişimi, sıfır altı' : 'MACD al kesişimi, sıfır üstü'); }
      if (macd[i] < sig[i] && macd[i - 1] >= sig[i - 1]) fire('MACD sat kesişimi');
      if (lb[i] != null && c[i] < lb[i] && c[i - 1] >= lb[i - 1]) { fire('Bollinger alt bant kırıldı'); if (up200) fire('Bollinger alt bant + 200G üstü'); }
      if (ub[i] != null && c[i] > ub[i] && c[i - 1] <= ub[i - 1]) fire('Bollinger üst bant aşıldı');
      if (bw[i] != null && bw[i] <= bwLo[i] * 1.05 && c[i] > ub[i]) fire('Bant daralması sonrası yukarı kırılım');
      if (bw[i] != null && bw[i] <= bwLo[i] * 1.05 && c[i] < lb[i]) fire('Bant daralması sonrası aşağı kırılım');
      if (Ks[i] > Ds[i] && Ks[i - 1] <= Ds[i - 1] && Ks[i] < 20) fire('Stokastik 20 altında al kesişimi');
      if (Ks[i] < Ds[i] && Ks[i - 1] >= Ds[i - 1] && Ks[i] > 80) fire('Stokastik 80 üstünde sat kesişimi');
      if (ADX[i] > 25 && ADX[i - 1] <= 25) fire(pdi[i] > mdi[i] ? 'ADX 25 üstü, yükseliş trendi' : 'ADX 25 üstü, düşüş trendi');
      if (c[i] >= hi60[i] && c[i - 1] < hi60[i - 1]) fire(obv[i] >= obvHi60[i] ? '60G zirve kırılımı, OBV teyitli' : '60G zirve kırılımı, OBV teyitsiz');
      if (obv[i] >= obvHi60[i] && obv[i - 1] < obvHi60[i - 1] && c[i] < hi60[i] * 0.95) fire('OBV yeni zirve, fiyat değil (pozitif uyumsuzluk)');
      if (m50[i] > m200[i] && m50[i - 1] <= m200[i - 1]) fire('Altın kesişim (50G > 200G)');
      if (m50[i] < m200[i] && m50[i - 1] >= m200[i - 1]) fire('Ölüm kesişimi (50G < 200G)');
      if (c[i] > m200[i] && c[i - 1] <= m200[i - 1]) fire('Fiyat 200G ortalamanın üstüne çıktı');
      if (c[i] < m200[i] && c[i - 1] >= m200[i - 1]) fire('Fiyat 200G ortalamanın altına indi');
      if (c[i] >= hi252[i] && c[i - 1] < hi252[i - 1]) fire('Yeni 52 hafta zirvesi');
      if (c[i] <= lo252[i] && c[i - 1] > lo252[i - 1]) fire('Yeni 52 hafta dibi');
      if (c[i] < lo20[i - 1] && !up200 && c[i] < lo252[i] * 1.05) fire('Düşen bıçak (20G dip + 200G altı + yıllık dibe yakın)');
      const vr = v60[i - 5] ? v[i] / v60[i - 5] : null;
      if (vr > 3 && r1 > 0.03) fire('Hacim patlaması (3×) + yükseliş günü');
      if (vr > 3 && r1 < -0.03) fire('Hacim patlaması (3×) + düşüş günü');
      if (r1 > 0.09) fire('Tek günde +%9 üstü (tavan benzeri)');
      if (r1 < -0.09) fire('Tek günde −%9 üstü düşüş (taban benzeri)');
      if (r1 < -0.07 && up200 && c[i] > hi252[i] * 0.85) fire('Güçlü trendde tek gün sert düşüş');
      if (O[i] > c[i - 1] * 1.03) fire('%3 üstü boşluklu açılış (gap up)');
      const r21 = Math.log(c[i] / c[i - 21]); if (r21 < -0.25 && Math.log(c[i - 1] / c[i - 22]) >= -0.25) fire('1 ayda −%25 (kısa vadeli dönüş adayı)');
      if (r21 > 0.35 && Math.log(c[i - 1] / c[i - 22]) <= 0.35) fire('1 ayda +%35 (aşırı yükseliş)');
    } } }
const out = {}; const BASE = 'ALL (baz: rastgele gün)', bm = {};
for (const ccy of ['TRY', 'USD']) { bm[ccy] = {}; for (const h of HS) { const m = new Map(); for (const e of SIG[BASE][ccy]) if (e.x[h] != null) { const k = e.d.slice(0, 7); (m.get(k) || m.set(k, []).get(k)).push(e.x[h]); } bm[ccy][h] = new Map([...m].map(([k, v]) => [k, [mean(v), v.filter(x => x > 0).length / v.length]])); } }
for (const [name, g] of Object.entries(SIG)) { out[name] = {};
  for (const ccy of ['TRY', 'USD']) { const E = g[ccy]; if (E.length < 40) continue; const o = { n: E.length };
    for (const h of HS) { const es = E.filter(e => e.x[h] != null); if (es.length < 30) continue; const m = new Map(); for (const e of es) { const k = e.d.slice(0, 7); (m.get(k) || m.set(k, []).get(k)).push(e.x[h]); }
      const dif = [...m].filter(([k]) => bm[ccy][h].has(k)).map(([k, v]) => mean(v) - bm[ccy][h].get(k)[0]), hd = [...m].filter(([k]) => bm[ccy][h].has(k)).map(([k, v]) => [v.filter(x => x > 0).length - bm[ccy][h].get(k)[1] * v.length, v.length]);
      const early = es.filter(e => e.d < '2022-01-01'), late = es.filter(e => e.d >= '2022-01-01'), dm = s => { const mm = new Map(); for (const e of s) { const k = e.d.slice(0, 7); if (!bm[ccy][h].has(k)) continue; (mm.get(k) || mm.set(k, []).get(k)).push(e.x[h] - bm[ccy][h].get(k)[0]); } return mean([].concat(...mm.values())) * 100; };
      const evd = es.filter(e => bm[ccy][h].has(e.d.slice(0, 7))).map(e => e.x[h] - bm[ccy][h].get(e.d.slice(0, 7))[0]);
      o[h] = { ex: +(mean(evd) * 100).toFixed(2), hitD: +(hd.reduce((s, [a]) => s + a, 0) / hd.reduce((s, [, b]) => s + b, 0) * 100).toFixed(1), hit: +(es.filter(e => e.x[h] > 0).length / es.length * 100).toFixed(1), t: +(mean(dif) / (sd(dif) || 1) * Math.sqrt(dif.length) * Math.sqrt(Math.min(1, 21 / h))).toFixed(2), months: dif.length, e1: +dm(early).toFixed(2), e2: +dm(late).toFixed(2) }; }
    out[name][ccy] = o; } }
fs.writeFileSync(process.argv[3] || 'ind.json', JSON.stringify(out, null, 1));
for (const ccy of ['TRY', 'USD']) { console.log(`\n=== ${ccy}  sütunlar: N | her ufukta: rastgele güne göre fark % · isabet farkı puan · t   [21g: 2017-21 / 2022-26]`);
  const rows = Object.entries(out).filter(([n, o]) => o[ccy] && n !== BASE).sort((a, b) => (b[1][ccy][21] || {}).ex - (a[1][ccy][21] || {}).ex);
  for (const [name, o] of rows) { const r = o[ccy]; const f = h => r[h] ? `${r[h].ex.toFixed(2).padStart(6)} ${r[h].hitD.toFixed(1).padStart(5)} ${r[h].t.toFixed(1).padStart(5)}` : '        —         '; console.log(name.padEnd(52).slice(0, 52), String(r.n).padStart(6), '|', f(5), '|', f(10), '|', f(21), `[${r[21] ? r[21].e1.toFixed(1) + ' / ' + r[21].e2.toFixed(1) : ''}]`.padEnd(14), '|', f(63)); } }
