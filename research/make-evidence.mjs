// research/indicator-backtest.json (rows by Turkish name) → research/indicator-evidence.json (rows by signal code, as the app uses them)
import fs from 'fs';
const R = JSON.parse(fs.readFileSync(new URL('./indicator-backtest.json', import.meta.url)));
const MAP = { rsi_lt30: 'RSI14 30 altına indi', rsi_lt30_up: 'RSI14 30 altı + 200G üstü', rsi_lt30_dn: 'RSI14 30 altı + 200G altı', rsi_gt70: 'RSI14 70 üstüne çıktı', rsi_gt70_up: 'RSI14 70 üstü + 200G üstü', rsi_gt70_dn: 'RSI14 70 üstü + 200G altı',
  rsi2_lt10_up: 'RSI2 < 10 + 200G üstü (kısa dönüş)', rsi2_gt90_dn: 'RSI2 > 90 + 200G altı', macd_up: 'MACD al kesişimi', macd_up_pos: 'MACD al kesişimi, sıfır üstü', macd_up_neg: 'MACD al kesişimi, sıfır altı', macd_dn: 'MACD sat kesişimi',
  bb_lo: 'Bollinger alt bant kırıldı', bb_lo_up: 'Bollinger alt bant + 200G üstü', bb_hi: 'Bollinger üst bant aşıldı', sq_up: 'Bant daralması sonrası yukarı kırılım', sq_dn: 'Bant daralması sonrası aşağı kırılım',
  st_buy: 'Stokastik 20 altında al kesişimi', st_sell: 'Stokastik 80 üstünde sat kesişimi', adx_up: 'ADX 25 üstü, yükseliş trendi', adx_dn: 'ADX 25 üstü, düşüş trendi', brk_obv: '60G zirve kırılımı, OBV teyitli', brk_noobv: '60G zirve kırılımı, OBV teyitsiz',
  obv_div: 'OBV yeni zirve, fiyat değil (pozitif uyumsuzluk)', golden: 'Altın kesişim (50G > 200G)', death: 'Ölüm kesişimi (50G < 200G)', ma200_up: 'Fiyat 200G ortalamanın üstüne çıktı', ma200_dn: 'Fiyat 200G ortalamanın altına indi',
  hi52: 'Yeni 52 hafta zirvesi', lo52: 'Yeni 52 hafta dibi', knife: 'Düşen bıçak (20G dip + 200G altı + yıllık dibe yakın)', vol_up: 'Hacim patlaması (3×) + yükseliş günü', vol_dn: 'Hacim patlaması (3×) + düşüş günü',
  lim_up: 'Tek günde +%9 üstü (tavan benzeri)', lim_dn: 'Tek günde −%9 üstü düşüş (taban benzeri)', trend_drop: 'Güçlü trendde tek gün sert düşüş', gap_up: '%3 üstü boşluklu açılış (gap up)', m_dn25: '1 ayda −%25 (kısa vadeli dönüş adayı)', m_up35: '1 ayda +%35 (aşırı yükseliş)' };
const out = { asOf: '2026-11-19', period: '2017-11 – 2026-11', note: 'excess return vs the index, against a random stock-day of the same month; t from monthly clusters', rows: {} };
for (const [k, name] of Object.entries(MAP)) { const r = R[name]; if (!r) { console.error('missing', name); continue; } const o = {};
  for (const ccy of ['TRY', 'USD']) { const x = r[ccy]; if (!x) continue; o[ccy] = { n: x.n }; for (const h of [5, 10, 21, 63]) if (x[h]) o[ccy][h] = [x[h].ex, x[h].hitD, x[h].t]; if (x[21]) o[ccy].p = [x[21].e1, x[21].e2]; }
  out.rows[k] = o; }
fs.writeFileSync(new URL('./indicator-evidence.json', import.meta.url), JSON.stringify(out));
console.log(Object.keys(out.rows).length, 'signals,', JSON.stringify(out).length, 'bytes');
