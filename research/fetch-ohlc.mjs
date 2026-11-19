import fs from 'fs';
const syms = JSON.parse(fs.readFileSync('syms.json')); const F = 'ohlc.json'; const out = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F)) : {};
const UA = { 'User-Agent': 'Mozilla/5.0' }; let n = 0, fail = 0;
const r4 = v => +v.toFixed(4);
async function one(o) { for (let t = 0; t < 3; t++) { try { const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(o.y)}?range=10y&interval=1d&events=split`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (r.status === 404) return null; if (!r.ok) throw new Error(r.status);
  const j = await r.json(), res = j.chart.result[0], q = res.indicators.quote[0], adj = res.indicators.adjclose ? res.indicators.adjclose[0].adjclose : null, ts = res.timestamp || [], rows = [];
  for (let i = 0; i < ts.length; i++) { const c = adj ? adj[i] : q.close[i], cl = q.close[i]; if (!(c > 0) || !(cl > 0)) continue; const k = c / cl; rows.push([new Date((ts[i] + 10800) * 1000).toISOString().slice(0, 10), r4(c), q.volume[i] || 0, r4((q.high[i] || cl) * k), r4((q.low[i] || cl) * k), r4((q.open[i] || cl) * k)]); }
  return rows; } catch (e) { if (t === 2) { fail++; return null; } await new Promise(r => setTimeout(r, 1500)); } } }
const todo = syms.filter(o => !out[o.s]); const W = 6; let i = 0;
await Promise.all(Array.from({ length: W }, async () => { while (i < todo.length) { const o = todo[i++]; const r = await one(o); if (r) out[o.s] = { ...o, rows: r }; if (++n % 100 === 0) { console.log(n, '/', todo.length, 'fail', fail); fs.writeFileSync(F, JSON.stringify(out)); } } }));
fs.writeFileSync(F, JSON.stringify(out)); console.log('done', Object.keys(out).length, 'fail', fail);
