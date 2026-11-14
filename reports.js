/*<REPORTS>*/
/* GNC Terminal — report renderers, "1980s Wall Street research / SEC filing" edition.
   Self-contained; expects `ENGINE` in scope (inlined right after engine.js). Replaces ENGINE.renderPDF / ENGINE.renderDOCX.
   Model: { kicker, title, titleLine2?, subtitle, meta: [strings], blocks, docNo?, legend?, cover?: 'fund', preparedFor?, preparedBy?, fundId?, sealPng?: Uint8Array, bodySize?, coverLegend?: false }
   Blocks: lead, p, quote {text, by}, h {text, num?: false}, h3, boxes, list, table/schedule {cols, rows, size?, totals?, footnotes?}, disclaimer,
           exhibit {kind?: 'line'|'pie'|'hbar'|'timeline', title, series, refs?, h?, note}, risks {items}, tombstone {lines}, source {text}. */
const REPORTS = (() => {
const PDF_MAP = { 'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', '−': '-', '≈': '~', 'σ': 's', 'Σ': 'S', '→': '->', '↔': '<->', '✓': 'v', '★': '*', '≥': '>=', '≤': '<=', ' ': ' ', 'Ü': 'U', 'ü': 'u', '₺': 'TL', '…': '...', 'β': 'beta', 'Δ': 'D', 'μ': 'mu' };
const DEFAULT_SOURCE = 'Yahoo Finance, TEFAS, TCMB EVDS';
const ROMAN = (n) => { const m = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };
const LETTER = (i) => String.fromCharCode(97 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : '');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function spellDate(d) { d = d instanceof Date ? d : new Date(d); if (isNaN(d)) d = new Date(); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; }
function shortDate(d) { d = d instanceof Date ? d : new Date(String(d)); if (isNaN(d)) return ''; return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; }
function issueDate(model) { // the "Issued …" meta line if present, else today
  for (const m of model.meta || []) { const mm = /Issued\s+(.+)$/i.exec(String(m)); if (mm) { const d = new Date(mm[1].trim() + ' UTC'); if (!isNaN(d)) return d; } }
  return new Date();
}
function asOfText(model) { for (const m of model.meta || []) { const mm = /as of\s+(.+)$/i.exec(String(m)); if (mm) return mm[1].trim(); } return spellDate(issueDate(model)); }
function docNumber(model) {
  if (model.docNo) return String(model.docNo);
  const d = issueDate(model); let h = 0; const s = String(model.title || '') + '|' + String(model.subtitle || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `GNC-R-${d.getUTCFullYear()}-${String(h % 1000).padStart(3, '0')}`;
}
function legendText(model) { if (model.legend) return String(model.legend); const d = (model.blocks || []).find(b => b.type === 'disclaimer'); return d ? String(d.text) : ''; }
function sourceText(block, model) { return block && block.text ? String(block.text) : `${DEFAULT_SOURCE}; as of ${asOfText(model)}`; }
function figure(v, align) { // SEC house style for numeric cells: parentheses for negatives, em dash for nil
  let t = String(v ?? '').trim();
  if (align !== 'r') return t;
  if (t === '' || t === '-' || t === 'n/a') return '—';
  const m = /^[-−]\s?(\d[\d.,]*\s?%?.*)$/.exec(t); if (m) return '(' + m[1] + ')';
  return t;
}
function splitLead(text) { // first sentence (SEC risk-factor caption) and the remainder
  const s = String(text || ''), m = /^(.*?[.!?])(\s+)(\S[\s\S]*)$/.exec(s); return m ? [m[1], m[3]] : [s, ''];
}
const PREPARED_BY = (model) => String(model.preparedBy || 'Personal research');
// orangegoat Deluxe: plain-language intros, no app name, glossary of the terms used (deluxe.js; page global or required next to this file)
const DLX_PREP = model => { let d = null; try { d = typeof DELUXE !== 'undefined' ? DELUXE : (typeof require === 'function' ? require('./deluxe.js') : null); } catch (e) { d = null; } const lang = model && model.lang ? model.lang : (typeof window !== 'undefined' && window.__gnc && window.__gnc.S && window.__gnc.S.lang) || 'en'; try { return d && d.prepareModel ? d.prepareModel(model, lang) : model; } catch (e) { return model; } };
const PREPARED_FOR = (model) => String(model.preparedFor || 'the account holder');
/* ---------- shared chart geometry (y grows downward, like a canvas; the PDF drawer flips it) ---------- */
function niceTicks(lo, hi, n = 5) {
  if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; } if (hi === lo) { hi = lo + 1; lo = lo - 1; }
  const span = hi - lo, raw = span / n, pow = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / pow, step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { lo: a, hi: b, ticks, step };
}
function fmtTick(v, step) { const d = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step))); return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function chartLayout(block, w, h) {
  const series = (block.series || []).filter(s => s && Array.isArray(s.points) && s.points.length).map(s => ({ name: String(s.name || ''), points: s.points.filter(p => Array.isArray(p) && isFinite(+p[1])) })).filter(s => s.points.length);
  const refsIn = (block.refs || []).filter(r => r && isFinite(+r.value)).map(r => ({ label: String(r.label || ''), value: +r.value }));
  const padL = 46, padR = 10, padT = 8, padB = 18, px = padL, py = padT, pw = Math.max(10, w - padL - padR), ph = Math.max(10, h - padT - padB);
  const isDate = series.every(s => s.points.every(p => !isNaN(new Date(String(p[0])))));
  let xs = [];
  if (isDate) { const all = series.flatMap(s => s.points.map(p => +new Date(String(p[0])))); const lo = Math.min(...all), hi = Math.max(...all) || lo + 1; xs = series.map(s => s.points.map(p => px + (hi === lo ? 0.5 : (+new Date(String(p[0])) - lo) / (hi - lo)) * pw)); }
  else { const n = Math.max(...series.map(s => s.points.length)); xs = series.map(s => s.points.map((_, i) => px + (n <= 1 ? 0.5 : i / (n - 1)) * pw)); }
  const vals = series.flatMap(s => s.points.map(p => +p[1])).concat(series.length ? refsIn.map(r => r.value) : []), nt = niceTicks(Math.min(...vals), Math.max(...vals), 4);
  const yOf = v => py + (1 - (v - nt.lo) / (nt.hi - nt.lo)) * ph;
  const yTicks = nt.ticks.map(v => ({ label: fmtTick(v, nt.step), y: yOf(v) }));
  const ref = series.reduce((a, s) => s.points.length > a.points.length ? s : a, series[0] || { points: [] }), n = ref.points.length, want = Math.min(5, n), xTicks = [];
  for (let i = 0; i < want; i++) { const k = want === 1 ? 0 : Math.round(i * (n - 1) / (want - 1)); const p = ref.points[k], d = new Date(String(p[0])); xTicks.push({ label: isDate && !isNaN(d) ? `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}` : String(p[0]), x: xs[series.indexOf(ref)][k] }); }
  const DASH = [[], [4, 2], [1, 2], [6, 2, 1, 2]];
  return { plot: { x: px, y: py, w: pw, h: ph }, yTicks, xTicks, refs: series.length ? refsIn.map(r => ({ label: r.label, y: yOf(r.value) })) : [], series: series.map((s, i) => ({ name: s.name, dash: DASH[i % DASH.length], pts: s.points.map((p, j) => [xs[i][j], yOf(+p[1])]) })) };
}
/* line-art fill patterns: each segment of a pie or bar gets one; drawn as clipped lines/dots so they survive photocopying */
const PATTERNS = ['hatch', 'dots', 'solid', 'cross', 'blank', 'hlines', 'hatch2', 'vlines'];
function patternMarks(kind, box, step = 4) { // box {x,y,w,h} in layout units; returns primitives to draw inside a clip to the shape
  const out = { lines: [], dots: [], fill: null }, { x, y, w, h } = box;
  if (kind === 'solid') out.fill = 0.32;
  else if (kind === 'hatch' || kind === 'hatch2' || kind === 'cross') { for (let d = -h; d < w + h; d += step) { if (kind !== 'hatch2') out.lines.push([x + d, y, x + d + h, y + h]); if (kind !== 'hatch') out.lines.push([x + d, y + h, x + d + h, y]); } }
  else if (kind === 'dots') { let row = 0; for (let yy = y + step / 2; yy < y + h; yy += step, row++) for (let xx = x + (row % 2 ? step : step / 2); xx < x + w; xx += step * 1.5) out.dots.push([xx, yy, 0.55]); }
  else if (kind === 'hlines') { for (let yy = y + step / 2; yy < y + h; yy += step) out.lines.push([x, yy, x + w, yy]); }
  else if (kind === 'vlines') { for (let xx = x + step / 2; xx < x + w; xx += step) out.lines.push([xx, y, xx, y + h]); }
  return out;
}
function wedgePoly(cx, cy, R, r, a0, a1) { // donut segment as a polygon (outer arc, then inner arc back)
  const n = Math.max(2, Math.ceil((a1 - a0) / (Math.PI / 60))), pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
function bboxOf(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; }
function pieLayout(block, w, h, measure) { // measure(text, size) → width in layout units
  let items = (block.series || []).map(s => ({ name: String(s.name || ''), value: +s.value, vlabel: s.label ? String(s.label) : null })).filter(s => isFinite(s.value) && s.value > 0).sort((a, b) => b.value - a.value);
  if (items.length > 7) { const rest = items.slice(6), v = rest.reduce((a, s) => a + s.value, 0); items = [...items.slice(0, 6), { name: 'Other (' + rest.length + ')', value: v, vlabel: null }]; }
  const tot = items.reduce((a, s) => a + s.value, 0); if (!tot) return { segments: [], legend: [] };
  const cx = w * 0.26, cy = h / 2, R = Math.max(20, Math.min(h / 2 - 22, w * 0.17)), r = R * 0.48;
  let a = -Math.PI / 2; const segments = items.map((s, i) => { const f = s.value / tot, a0 = a, a1 = a + f * 2 * Math.PI; a = a1; const mid = (a0 + a1) / 2, poly = wedgePoly(cx, cy, R, r, a0, a1);
    const right = Math.cos(mid) >= 0, lx = cx + (R + 13) * Math.cos(mid), ly = cy + (R + 13) * Math.sin(mid);
    return { ...s, pct: f * 100, a0, a1, mid, poly, bbox: bboxOf(poly), pattern: PATTERNS[i % PATTERNS.length], leader: [[cx + (R + 2) * Math.cos(mid), cy + (R + 2) * Math.sin(mid)], [cx + (R + 10) * Math.cos(mid), cy + (R + 10) * Math.sin(mid)]], label: { text: f * 100 >= 1 ? Math.round(f * 100) + '%' : '<1%', x: lx, y: ly, align: right ? 'l' : 'r' } }; });
  for (const side of ['l', 'r']) { const ss = segments.filter(s => s.label.align === side).sort((p, q) => p.label.y - q.label.y); for (let i = 1; i < ss.length; i++) if (ss[i].label.y - ss[i - 1].label.y < 9) ss[i].label.y = ss[i - 1].label.y + 9; }
  const lx = w * 0.55, lw = w - lx, rowH = 13, size = 7.5, top = Math.max(4, cy - segments.length * rowH / 2);
  const legend = segments.map((s, i) => { const val = s.vlabel || (Math.round(s.pct) + '%'), vw = measure(val, size); let name = s.name; while (name.length > 3 && measure(name, size) > lw - 24 - vw - 6) name = name.slice(0, -2).trimEnd() + '…'; return { name, val, y: top + i * rowH, x: lx, swatch: { x: lx, y: top + i * rowH + 2, w: 15, h: 8 }, pattern: s.pattern, textX: lx + 20, valX: w }; });
  return { segments, legend, size, cx, cy, R, r };
}
function hbarLayout(block, w, h, measure) {
  const items = (block.series || []).map(s => ({ name: String(s.name || ''), value: s.header ? null : +s.value, header: !!s.header, label: s.label ? String(s.label) : null })).filter(s => s.header || isFinite(s.value));
  const size = 7.5, max = Math.max(1e-9, ...items.filter(s => !s.header).map(s => s.value)), rowH = Math.min(20, Math.max(12, (h - 8) / Math.max(1, items.length)));
  const nameW = Math.min(w * 0.36, Math.max(40, ...items.map(s => measure(s.name, size))) + 10), valW = Math.max(40, ...items.filter(s => !s.header).map(s => measure(s.label || String(s.value), size))) + 8, barMax = Math.max(20, w - nameW - valW - 6);
  let k = 0; const rows = items.map((s, i) => { const y = 4 + i * rowH; if (s.header) return { ...s, y: y + rowH / 2, x: 0 }; const bh = rowH * 0.58, bw = Math.max(0.5, s.value / max * barMax), row = { ...s, y: y + rowH / 2, x: 0, bar: { x: nameW, y: y + (rowH - bh) / 2, w: bw, h: bh }, pattern: PATTERNS[k % PATTERNS.length], valX: nameW + bw + 4, text: s.label || String(Math.round(s.value)) }; k++; return row; });
  return { rows, size, nameW, height: 8 + items.length * rowH };
}
function timelineLayout(block, w, h, measure) {
  const t0 = +new Date(String(block.start)), t1 = +new Date(String(block.end)); if (!isFinite(t0) || !isFinite(t1) || t1 <= t0) return null;
  const padL = 34, padR = 34, bx = padL, bw = w - padL - padR, by = h * 0.5 - 4, bh = 9, size = 7;
  const xOf = d => { const t = +new Date(String(d)); return bx + Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) * bw; };
  const today = block.today && isFinite(+new Date(String(block.today))) ? +new Date(String(block.today)) : null, tx = today === null ? null : xOf(block.today), elapsed = today === null ? 0 : Math.max(0, Math.min(bw, tx - bx));
  const marks = (block.marks || []).filter(m => m && m.date && isFinite(+new Date(String(m.date)))).map(m => ({ date: String(m.date), kind: m.kind || 'review', label: String(m.label || ''), x: xOf(m.date) }));
  for (const m of marks) if (m.kind === 'start' || m.kind === 'exit') m.label = (m.label || (m.kind === 'start' ? 'Inception' : 'Exit')) + ' ' + shortDate(m.date);
  const above = marks.filter(m => m.kind !== 'review'), below = marks.filter(m => m.kind === 'review');
  const place = (arr, baseY, dir) => { // labels centred on their tick; a label that would overlap the previous one moves to the next row
    arr.sort((p, q) => p.x - q.x); const ends = [-1e9, -1e9, -1e9];
    for (const m of arr) { const tw = measure(m.label, size), x0 = Math.max(2, Math.min(w - tw - 2, m.x - tw / 2)); let row = 0; while (row < 2 && x0 < ends[row] + 5) row++; m.labelY = baseY + dir * row * 9; m.labelX = x0; m.labelW = tw; ends[row] = x0 + tw; } };
  place(above, by - 8, -1); place(below, by + bh + 10, 1);
  return { bar: { x: bx, y: by, w: bw, h: bh }, elapsed, today: tx === null ? null : { x: tx, label: 'Today, ' + shortDate(block.today) }, marks: [...above, ...below], size };
}
function exhibitHeight(b) { const k = b.kind || 'line'; if (b.h) return +b.h; if (k === 'pie') return 150; if (k === 'hbar') return 8 + Math.max(1, (b.series || []).length) * 18; if (k === 'timeline') return 78; return 190; }
/* =====================================================================================================
   PDF
   ===================================================================================================== */
async function renderPDF2(model, PDFLib) {
  model = DLX_PREP(model);
  const { PDFDocument, StandardFonts, rgb } = PDFLib, doc = await PDFDocument.create();
  doc.setTitle(`${model.title} — ${model.subtitle || ''}`); doc.setAuthor(PREPARED_BY(model)); doc.setCreator('Personal research'); doc.setSubject(String(model.kicker || ''));
  const F = { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold), i: await doc.embedFont(StandardFonts.HelveticaOblique), bi: await doc.embedFont(StandardFonts.HelveticaBoldOblique), c: await doc.embedFont(StandardFonts.Courier) };
  const clean = s => { let t = String(s ?? ''); for (const [a, b] of Object.entries(PDF_MAP)) t = t.split(a).join(b); return Array.from(t).map(ch => { try { F.r.encodeText(ch); return ch; } catch (_) { return '?'; } }).join(''); };
  const W = 595.28, H = 841.89, mL = 62, mR = 62, mT = 70, mB = 64, cw = W - mL - mR;
  const ink = rgb(0.105, 0.102, 0.09), accent = rgb(0.76, 0.35, 0.0), bodySize = +model.bodySize || 10;
  // width without kerning: drawText emits unkerned strings, while widthOfTextAtSize applies kern pairs (Y-A, A-O …) and would under-measure
  const glyphCache = new Map();
  const tw = (t, f, s) => { let m = glyphCache.get(f); if (!m) glyphCache.set(f, m = new Map()); let w = 0; for (const ch of Array.from(t)) { let g = m.get(ch); if (g === undefined) { try { g = f.widthOfTextAtSize(ch, 1000); } catch (_) { g = 500; } m.set(ch, g); } w += g; } return w * s / 1000; };
  const text = (t, x, yy, s, f = F.r, color = ink) => page.drawText(t, { x, y: yy, size: s, font: f, color });
  const textR = (t, xr, yy, s, f = F.r, color = ink) => text(t, xr - tw(t, f, s), yy, s, f, color);
  const textC = (t, xc, yy, s, f = F.r, color = ink) => text(t, xc - tw(t, f, s) / 2, yy, s, f, color);
  const hline = (x1, x2, yy, th = 0.5, dash) => page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: th, color: ink, ...(dash ? { dashArray: dash } : {}) });
  const rule = (yy, th = 0.6) => hline(mL, W - mR, yy, th);
  const dblRule = (yy) => { rule(yy, 1.1); rule(yy - 2.4, 0.4); };
  // small caps: capitals at full size, lower-case letters as capitals at 78 %
  const scW = (t, s, f = F.r) => Array.from(t).reduce((a, ch) => a + (ch >= 'a' && ch <= 'z' ? tw(ch.toUpperCase(), f, s * 0.78) : tw(ch, f, s)), 0);
  const sc = (t, x, yy, s, f = F.r, color = ink) => { let cx = x; for (const ch of Array.from(t)) { const lo = ch >= 'a' && ch <= 'z'; const sz = lo ? s * 0.78 : s, c = lo ? ch.toUpperCase() : ch; text(c, cx, yy, sz, f, color); cx += tw(c, f, sz); } return cx - x; };
  const scC = (t, xc, yy, s, f = F.r, color = ink) => sc(t, xc - scW(t, s, f) / 2, yy, s, f, color);
  const leaders = (x1, x2, yy, s = 7) => { const pitch = tw('. ', F.r, s), n = Math.floor((x2 - x1) / pitch); if (n >= 2) text('. '.repeat(n).trimEnd(), x2 - n * pitch + tw(' ', F.r, s), yy, s, F.r); };
  // low-level paths (for clipped pattern fills)
  const OPS = PDFLib, polyOps = pts => pts.map((p, i) => i ? OPS.lineTo(p[0], p[1]) : OPS.moveTo(p[0], p[1]));
  const fillPoly = (pts, gray) => page.pushOperators(OPS.pushGraphicsState(), OPS.setFillingGrayscaleColor(gray), ...polyOps(pts), OPS.closePath(), OPS.fill(), OPS.popGraphicsState());
  const strokePoly = (pts, lw = 0.7, close = true) => page.pushOperators(OPS.pushGraphicsState(), OPS.setStrokingGrayscaleColor(0), OPS.setLineWidth(lw), ...polyOps(pts), ...(close ? [OPS.closePath()] : []), OPS.stroke(), OPS.popGraphicsState());
  const clipPoly = (pts, fn) => { page.pushOperators(OPS.pushGraphicsState(), ...polyOps(pts), OPS.closePath(), OPS.clip(), OPS.endPath()); fn(); page.pushOperators(OPS.popGraphicsState()); };
  /* page machinery */
  let page, y, pageNo = 0; const pages = [], reserve = [], footnotesByPage = [];
  const bottom = () => mB + (reserve[pageNo - 1] || 0);
  const docNo = clean(docNumber(model)), issued = issueDate(model), legend = clean(legendText(model)), runTitle = clean(`${PREPARED_BY(model)} · ${model.title}`), footLeft = clean(model.fundId ? String(model.fundId) : String(model.subtitle || ''));
  const newPage = () => {
    page = doc.addPage([W, H]); pages.push(page); pageNo++; y = H - mT;
    if (pageNo > 1) { let ht = runTitle; const maxW = cw - tw(docNo, F.c, 7) - 16; while (ht.length > 24 && scW(ht, 8) > maxW) ht = ht.slice(0, -4).trimEnd() + '…'; sc(ht, mL, H - 44, 8); textR(docNo, W - mR, H - 44, 7, F.c); hline(mL, W - mR, H - 50, 0.4); y = H - mT - 6; }
  };
  const need = h => { if (y - h < bottom()) newPage(); };
  /* rich text: segments [{ text, font }] wrapped into justified lines */
  const tokens = segs => segs.flatMap(sg => clean(sg.text).split(/\s+/).filter(Boolean).map(t => ({ t, f: sg.font || F.r })));
  const wrapRich = (segs, size, width) => { const lines = []; let cur = [], curW = 0; const sp = tw(' ', F.r, size); for (const tk of tokens(segs)) { const w = tw(tk.t, tk.f, size); if (cur.length && curW + sp + w > width) { lines.push(cur); cur = []; curW = 0; } curW += (cur.length ? sp : 0) + w; cur.push(tk); } if (cur.length) lines.push(cur); return lines; };
  const drawLine = (line, x, width, size, justify) => { const sp = tw(' ', F.r, size), ws = line.map(tk => tw(tk.t, tk.f, size)), total = ws.reduce((a, b) => a + b, 0) + sp * (line.length - 1); const gap = justify && line.length > 1 && total < width ? sp + (width - total) / (line.length - 1) : sp; let cx = x; line.forEach((tk, i) => { text(tk.t, cx, y - size, size, tk.f); cx += ws[i] + gap; }); };
  const richPara = (segs, { size = 10, lead = 1.32, indent = 0, width = cw, x = mL, justify = true, number = null, numFont = F.r } = {}) => {
    const lines = wrapRich(segs, size, width - indent); if (!lines.length) return;
    lines.forEach((ln, i) => { need(size * lead); if (i === 0 && number !== null) text(clean(number), x, y - size, size, numFont); drawLine(ln, x + indent, width - indent, size, justify && i < lines.length - 1); y -= size * lead; });
  };
  const wrap = (t, f, s, width) => wrapRich([{ text: t, font: f }], s, width).map(ln => ln.map(tk => tk.t).join(' '));
  /* ---------- cover ---------- */
  const fundCover = model.cover === 'fund';
  newPage();
  textR(`Document No. ${docNo}`, W - mR, H - mT, 8, F.c);
  text(clean(spellDate(issued)), mL, H - mT, 8, F.c);
  dblRule(H - mT - 8);
  scC('Private and Confidential — For the Addressee Only', W / 2, H - mT - 26, 8.5);
  if (fundCover) { // a 4 cm square above the title is reserved for the seal; empty unless model.sealPng is given
    const sealS = 113.4, sealTop = H - 122; y = sealTop - sealS - 30;
    if (model.sealPng) { try { const img = await doc.embedPng(model.sealPng); page.drawImage(img, { x: W / 2 - sealS / 2, y: sealTop - sealS, width: sealS, height: sealS }); } catch (_) { /* a bad PNG leaves the space empty */ } }
  } else y = H - 215;
  { const k = clean(String(model.kicker || 'Research report')).toUpperCase(); const letter = k.split('').join(' '); textC(letter, W / 2, y, 8.5); y -= 36; }
  { const tt = clean(model.title); let ts = 28; while (ts > 20 && tw(tt, F.b, ts) > cw - 40) ts -= 1; const tl = wrap(tt, F.b, ts, cw - 40); tl.forEach(ln => { textC(ln, W / 2, y, ts, F.b, accent); y -= ts * 1.15; }); y -= 12 - ts * 0.15;
    if (model.titleLine2) { y += 6; textC(clean(model.titleLine2), W / 2, y, 16, F.b, accent); y -= 24; } }
  if (model.subtitle) { textC(clean(model.subtitle), W / 2, y, 14, F.i); y -= 26; }
  hline(W / 2 - 40, W / 2 + 40, y + 4, 0.6); y -= 20;
  if (fundCover) { for (const m of model.meta || []) { text(clean(m), mL, y, 9); y -= 12; } }
  else { textC(clean(spellDate(issued)), W / 2, y, 11); y -= 18; for (const m of model.meta || []) { textC(clean(m), W / 2, y, 9.5); y -= 13; } }
  y -= 30;
  { const yy = y; const colX = mL + 10, colX2 = W / 2 + 10;
    sc('Prepared for', colX, yy, 7.5); text(clean(PREPARED_FOR(model)), colX, yy - 15, 10.5);
    sc('Prepared by', colX2, yy, 7.5); text(clean(PREPARED_BY(model)), colX2, yy - 15, 10.5, F.b, accent);
    sc('Document type', colX, yy - 40, 7.5); text(clean(String(model.kicker || 'Research report')), colX, yy - 55, 10.5);
    sc('Reference', colX2, yy - 40, 7.5); text(docNo, colX2, yy - 55, 10, F.c);
    dblRule(yy - 72); y = yy - 90; }
  if (model.coverLegend !== false && legend.trim()) { const lines = wrap(legend, F.i, 7.5, cw), lh = 7.5 * 1.3, blockH = lines.length * lh; const top = mB + blockH + 10; hline(mL, W - mR, top + 6, 0.4); let yy = top; sc('Important notice', mL, yy - 2, 6.5); yy -= 10; const ll = wrapRich([{ text: legend, font: F.i }], 7.5, cw); ll.forEach((ln, i) => { const sv = y; y = yy; drawLine(ln, mL, cw, 7.5, i < ll.length - 1); y = sv; yy -= lh; }); }
  /* ---------- body ---------- */
  newPage();
  let hN = 0, pN = 0, exN = 0, fnN = 0; const blocks = model.blocks || [];
  const sourceLine = (txt) => { need(14); y -= 1; richPara([{ text: 'Source: ', font: F.i }, { text: txt, font: F.i }], { size: 7.5, lead: 1.25, justify: false }); y -= 8; };
  const heading = (t, numbered = true) => { need(96); y -= 12; let x0 = mL; if (numbered) { hN++; const label = `${ROMAN(hN)}.`; text(label, mL, y - 10, 10.5, F.b); x0 = mL + Math.max(26, tw(label, F.b, 10.5) + 8); } text(clean(t).toUpperCase(), x0, y - 10, 10.5, F.b); y -= 15; rule(y, 0.6); y -= 9; };
  const subheading = (t) => { need(80); y -= 5; sc(clean(t), mL, y - 9, 10, F.b); y -= 16; };
  const numbered = (segs, size) => { pN++; richPara(segs, { size, indent: 24, number: `${pN}.` }); y -= 5; };
  const quote = (b) => { const size = bodySize; richPara([{ text: '“' + String(b.text).trim() + '”', font: F.i }], { size, indent: 0, x: mL + 24, width: cw - 48, justify: false }); if (b.by) { need(14); textR(clean('— ' + b.by), W - mR - 24, y - 8, size - 1.5, F.r); y -= 14; } y -= 6; };
  const ruledTable = (cols, rows, opts = {}) => {
    const totW = cols.reduce((a, c) => a + (+c[2] || 1), 0), ws = cols.map(c => (+c[2] || 1) / totW * cw), size = +opts.size || 8.4, hs = Math.min(size - 1, 7.6), pad = 4, lh = size + 2.8;
    const header = (cont) => {
      if (cont) { textR('(continued)', W - mR, y - 7, 7.5, F.i); y -= 11; }
      rule(y, 0.9); y -= 4;
      const hl = cols.map((c, i) => wrap(String(c[0]).toUpperCase(), F.b, hs, ws[i] - 2 * pad)), n = Math.max(1, ...hl.map(l => l.length));
      let x0 = mL; hl.forEach((lines, i) => { lines.forEach((ln, j) => { const yy = y - hs - (n - lines.length + j) * (hs + 1.8); if (cols[i][1] === 'r') textR(ln, x0 + ws[i] - pad, yy, hs, F.b); else text(ln, x0 + pad, yy, hs, F.b); }); x0 += ws[i]; });
      y -= n * (hs + 1.8) + 3; rule(y, 0.5); y -= 2;
    };
    need(60); header(false);
    rows.forEach((r, ri) => {
      const isTot = opts.totals && ri === rows.length - 1, f = isTot ? F.b : F.r;
      const cells = cols.map((c, i) => wrap(isTot && String(r[i] ?? '').trim() === '' ? '' : figure(r[i], c[1]), f, size, ws[i] - 2 * pad)), h = Math.max(1, ...cells.map(c => c.length)) * lh + 3.6;
      if (y - h < bottom() + 10) { textR('— continued on next page —', W - mR, y - 8, 7, F.i); newPage(); header(true); }
      if (isTot) rule(y, 0.5);
      let x0 = mL; cells.forEach((lines, i) => { lines.forEach((ln, j) => { const yy = y - size - 1.6 - j * lh; if (cols[i][1] === 'r') textR(ln, x0 + ws[i] - pad, yy, size, f); else text(ln, x0 + pad, yy, size, f); }); x0 += ws[i]; });
      y -= h; if (ri < rows.length - 1 && !(opts.totals && ri === rows.length - 2)) rule(y, 0.2);
    });
    rule(y, 0.9); y -= 3;
  };
  const leaderTable = (cols, rows) => {
    const size = 9, lh = size + 4.5;
    need(50); rule(y, 0.9); y -= 3;
    text(clean(String(cols[0][0])).toUpperCase(), mL + 2, y - 7.2, 7.2, F.b); textR(clean(String(cols[1][0])).toUpperCase(), W - mR - 2, y - 7.2, 7.2, F.b); y -= 11; rule(y, 0.5); y -= 2;
    for (const r of rows) {
      if (y - lh < bottom() + 10) { textR('— continued on next page —', W - mR, y - 8, 7, F.i); newPage(); rule(y, 0.5); y -= 2; }
      const a = clean(String(r[0] ?? '')), b = figure(r[1], cols[1][1] || 'r'), bw = tw(b, F.r, size), aMax = cw - bw - 24, aLines = wrap(a, F.r, size, aMax);
      text(aLines[0] || '', mL + 2, y - size - 1, size); textR(b, W - mR - 2, y - size - 1, size);
      leaders(mL + 2 + tw(aLines[0] || '', F.r, size) + 4, W - mR - 2 - bw - 4, y - size - 1, size);
      y -= lh; for (const ln of aLines.slice(1)) { text(ln, mL + 10, y - size - 1, size); y -= lh; }
    }
    rule(y, 0.9); y -= 3;
  };
  const tableBlock = (b, nextSource, footnotes) => {
    const cols = b.cols || [], rows = (b.rows || []).length ? b.rows : [cols.map((c, i) => i ? '' : 'None.')];
    if (!cols.length) return;
    let fnLines = [];
    if (footnotes && footnotes.length) { // reserve room at the bottom of the current page, then draw in the final pass
      fnLines = footnotes.flatMap(fn => { const t = clean(String(fn)); let pre = ''; if (!/^\s*[(\[]?\d+[)\]]?\s/.test(t) && !/^\s*\*/.test(t)) { fnN++; pre = `(${fnN}) `; } return wrapRich([{ text: pre + t, font: F.r }], 7, cw).map((ln, i) => ({ ln, first: i === 0 })); });
      const h = fnLines.length * 9 + 10; if (y - h - 60 < bottom()) newPage();
      reserve[pageNo - 1] = (reserve[pageNo - 1] || 0) + h; (footnotesByPage[pageNo - 1] = footnotesByPage[pageNo - 1] || []).push(...fnLines);
    }
    if (cols.length === 2) leaderTable(cols, rows); else ruledTable(cols, rows, { size: b.size, totals: !!b.totals });
    sourceLine(clean(sourceText(nextSource, model)));
  };
  const boxes = (items) => { if (!items.length) return; const n = items.length, bw = cw / n, h = 34; need(h + 12); page.drawRectangle({ x: mL, y: y - h, width: cw, height: h, borderColor: ink, borderWidth: 0.9 });
    items.forEach(([k, v], i) => { const x0 = mL + i * bw; if (i) page.drawLine({ start: { x: x0, y }, end: { x: x0, y: y - h }, thickness: 0.5, color: ink }); const lab = clean(String(k)), val = clean(String(v)); let ls = 6.8; while (ls > 5 && scW(lab, ls) > bw - 12) ls -= 0.4; sc(lab, x0 + 6, y - 11, ls); let vs = 10; while (vs > 7 && tw(val, F.b, vs) > bw - 12) vs -= 0.5; textR(val, x0 + bw - 6, y - 27, vs, F.b); leaders(x0 + 6, x0 + bw - 6 - tw(val, F.b, vs) - 4, y - 27, 6.5); });
    y -= h + 12; };
  const listBlock = (items) => { const size = Math.min(bodySize, 10.5); items.forEach((t, i) => richPara([{ text: String(t) }], { size, indent: 26, number: `(${LETTER(i)})`, x: mL + 10, width: cw - 10 })); y -= 5; };
  const risks = (items) => { const size = Math.min(bodySize, 10.5); items.forEach((t, i) => { const [cap, rest] = splitLead(t); const segs = [{ text: cap, font: F.bi }]; if (rest) segs.push({ text: rest, font: F.r }); richPara(segs, { size, indent: 24, number: `${i + 1}.`, numFont: F.b }); y -= 4; }); y -= 3; };
  const tombstone = (lines) => { const bw = cw * 0.84, x0 = mL + (cw - bw) / 2, ls = lines.map((l, i) => ({ f: i === 0 ? F.b : F.r, s: i === 0 ? 11 : 9.5, lines: wrap(i === 0 ? String(l).toUpperCase() : String(l), i === 0 ? F.b : F.r, i === 0 ? 11 : 9.5, bw - 36) }));
    const h = ls.reduce((a, l) => a + l.lines.length * l.s * 1.35 + (l.f === F.b ? 6 : 0), 0) + 30; need(h + 14); y -= 4;
    page.drawRectangle({ x: x0, y: y - h, width: bw, height: h, borderColor: ink, borderWidth: 1.2 }); page.drawRectangle({ x: x0 + 3, y: y - h + 3, width: bw - 6, height: h - 6, borderColor: ink, borderWidth: 0.4 });
    let yy = y - 20; ls.forEach((l, i) => { for (const ln of l.lines) { textC(ln, W / 2, yy - l.s * 0.3, l.s, l.f); yy -= l.s * 1.35; } if (i === 0) { hline(W / 2 - 30, W / 2 + 30, yy + 2, 0.5); yy -= 6; } });
    y -= h + 14; };
  /* exhibits: the chart is laid out in canvas coordinates (y down) and mapped with X/Y onto the page */
  const drawPattern = (kind, box, X, Y, clipPts) => { const pm = patternMarks(kind, box); clipPoly(clipPts.map(p => [X(p[0]), Y(p[1])]), () => {
    if (pm.fill !== null) page.drawRectangle({ x: X(box.x) - 1, y: Y(box.y + box.h) - 1, width: box.w + 2, height: box.h + 2, color: rgb(pm.fill, pm.fill, pm.fill) });
    for (const [x1, y1, x2, y2] of pm.lines) page.drawLine({ start: { x: X(x1), y: Y(y1) }, end: { x: X(x2), y: Y(y2) }, thickness: 0.45, color: ink });
    for (const [x, yy, r] of pm.dots) page.drawCircle({ x: X(x), y: Y(yy), size: r, color: ink }); }); };
  const rectPts = (b) => [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
  const measure = (t, s) => tw(clean(t), F.r, s);
  const drawLineChart = (b, X, Y, chartW, chartH) => {
    const L = chartLayout(b, chartW, chartH);
    page.drawRectangle({ x: X(L.plot.x), y: Y(L.plot.y + L.plot.h), width: L.plot.w, height: L.plot.h, borderColor: ink, borderWidth: 0.6 });
    if (L.series.length) for (const t of L.yTicks) { if (t.y > L.plot.y + 0.5 && t.y < L.plot.y + L.plot.h - 0.5) hline(X(L.plot.x), X(L.plot.x + L.plot.w), Y(t.y), 0.25, [1, 2]); textR(t.label, X(L.plot.x) - 4, Y(t.y) - 2.3, 6.5); }
    L.xTicks.forEach((t, i) => { page.drawLine({ start: { x: X(t.x), y: Y(L.plot.y + L.plot.h) }, end: { x: X(t.x), y: Y(L.plot.y + L.plot.h) - 3 }, thickness: 0.5, color: ink }); const lab = clean(t.label), ly = Y(L.plot.y + L.plot.h) - 11; if (i === 0) text(lab, X(t.x), ly, 6.5); else if (i === L.xTicks.length - 1) textR(lab, X(t.x), ly, 6.5); else textC(lab, X(t.x), ly, 6.5); });
    L.series.forEach(s => { for (let i = 1; i < s.pts.length; i++) page.drawLine({ start: { x: X(s.pts[i - 1][0]), y: Y(s.pts[i - 1][1]) }, end: { x: X(s.pts[i][0]), y: Y(s.pts[i][1]) }, thickness: 0.9, color: ink, ...(s.dash.length ? { dashArray: s.dash } : {}) }); });
    for (const r of L.refs) { hline(X(L.plot.x), X(L.plot.x + L.plot.w), Y(r.y), 0.6, [5, 2]); const lab = clean(r.label); page.drawRectangle({ x: X(L.plot.x + L.plot.w) - tw(lab, F.r, 6.5) - 6, y: Y(r.y) + 1.5, width: tw(lab, F.r, 6.5) + 4, height: 8, color: rgb(1, 1, 1) }); textR(lab, X(L.plot.x + L.plot.w) - 4, Y(r.y) + 2.5, 6.5); }
    if (!L.series.length) textC('No data', W / 2, Y(L.plot.y + L.plot.h / 2), 8, F.i);
    return L;
  };
  const drawPie = (b, X, Y, chartW, chartH) => {
    const L = pieLayout(b, chartW, chartH, measure); if (!L.segments.length) { textC('No data', W / 2, Y(chartH / 2), 8, F.i); return; }
    for (const s of L.segments) { drawPattern(s.pattern, s.bbox, X, Y, s.poly); strokePoly(s.poly.map(p => [X(p[0]), Y(p[1])]), 0.7); }
    page.drawCircle({ x: X(L.cx), y: Y(L.cy), size: L.R, borderColor: ink, borderWidth: 0.9 }); page.drawCircle({ x: X(L.cx), y: Y(L.cy), size: L.r, borderColor: ink, borderWidth: 0.9, color: rgb(1, 1, 1) });
    for (const s of L.segments) { page.drawLine({ start: { x: X(s.leader[0][0]), y: Y(s.leader[0][1]) }, end: { x: X(s.leader[1][0]), y: Y(s.leader[1][1]) }, thickness: 0.4, color: ink }); if (s.label.align === 'l') text(s.label.text, X(s.label.x), Y(s.label.y) - 2.5, 7); else textR(s.label.text, X(s.label.x), Y(s.label.y) - 2.5, 7); }
    for (const g of L.legend) { drawPattern(g.pattern, g.swatch, X, Y, rectPts(g.swatch)); page.drawRectangle({ x: X(g.swatch.x), y: Y(g.swatch.y + g.swatch.h), width: g.swatch.w, height: g.swatch.h, borderColor: ink, borderWidth: 0.5 }); text(clean(g.name), X(g.textX), Y(g.y + 9), L.size); textR(clean(g.val), X(g.valX), Y(g.y + 9), L.size); }
  };
  const drawHbar = (b, X, Y, chartW, chartH) => {
    const L = hbarLayout(b, chartW, chartH, measure); if (!L.rows.length) { textC('No data', W / 2, Y(chartH / 2), 8, F.i); return; }
    for (const r of L.rows) { if (r.header) { sc(clean(r.name), X(2), Y(r.y) - 2.5, 7, F.b); hline(X(0), X(chartW), Y(r.y + 6), 0.3); continue; }
      text(clean(r.name), X(4), Y(r.y) - 2.5, L.size); if (r.bar.w > 0.6) { drawPattern(r.pattern, r.bar, X, Y, rectPts(r.bar)); page.drawRectangle({ x: X(r.bar.x), y: Y(r.bar.y + r.bar.h), width: r.bar.w, height: r.bar.h, borderColor: ink, borderWidth: 0.6 }); }
      text(clean(r.text), X(r.valX), Y(r.y) - 2.5, L.size); }
    page.drawLine({ start: { x: X(L.nameW), y: Y(0) }, end: { x: X(L.nameW), y: Y(L.height) }, thickness: 0.5, color: ink });
  };
  const drawTimeline = (b, X, Y, chartW, chartH) => {
    const L = timelineLayout(b, chartW, chartH, measure); if (!L) { textC('No dates', W / 2, Y(chartH / 2), 8, F.i); return; }
    const bar = L.bar; if (L.elapsed > 0) { const eb = { x: bar.x, y: bar.y, w: L.elapsed, h: bar.h }; drawPattern('hatch', eb, X, Y, rectPts(eb)); }
    page.drawRectangle({ x: X(bar.x), y: Y(bar.y + bar.h), width: bar.w, height: bar.h, borderColor: ink, borderWidth: 0.8 });
    for (const m of L.marks) { const up = m.kind !== 'review'; page.drawLine({ start: { x: X(m.x), y: Y(up ? bar.y - 5 : bar.y + bar.h) }, end: { x: X(m.x), y: Y(up ? bar.y : bar.y + bar.h + 5) }, thickness: m.kind === 'start' || m.kind === 'exit' ? 1.2 : 0.6, color: ink });
      const lab = clean(m.label); text(lab, X(m.labelX), Y(m.labelY) - 2.5, L.size, m.kind === 'start' || m.kind === 'exit' ? F.b : F.r); }
    if (L.today) { const tx = L.today.x, ty = bar.y + bar.h + 1; fillPoly([[X(tx), Y(ty)], [X(tx - 3.5), Y(ty + 6)], [X(tx + 3.5), Y(ty + 6)]], 0); page.drawLine({ start: { x: X(tx), y: Y(bar.y - 2) }, end: { x: X(tx), y: Y(bar.y + bar.h + 2) }, thickness: 1, color: ink, dashArray: [2, 1.5] }); const lab = clean(L.today.label), lw = tw(lab, F.bi, L.size), rows = L.marks.filter(m => m.kind === 'review').length; const ly = bar.y + bar.h + (rows ? 24 : 12); text(lab, X(Math.max(0, Math.min(chartW - lw, tx - lw / 2))), Y(ly) - 2.5, L.size, F.bi); }
  };
  const exhibit = (b, nextSource) => {
    exN++; const kind = b.kind || 'line', chartW = cw, chartH = exhibitHeight(b), capH = 18, noteLines = b.note ? wrap(String(b.note), F.i, 7.5, cw) : [], legendRows = kind === 'line' ? Math.ceil(((b.series || []).length) / 3) : 0, total = capH + 6 + chartH + legendRows * 11 + noteLines.length * 10 + 24;
    need(total); y -= 4;
    page.drawRectangle({ x: mL, y: y - capH, width: cw, height: capH, borderColor: ink, borderWidth: 0.8 });
    scC(`Exhibit ${exN} — ${clean(String(b.title || ''))}`, W / 2, y - 12.5, 8.5, F.b); y -= capH + 6;
    const top = y, X = v => mL + v, Y = v => top - v;
    let L = null;
    if (kind === 'pie') drawPie(b, X, Y, chartW, chartH); else if (kind === 'hbar') drawHbar(b, X, Y, chartW, chartH); else if (kind === 'timeline') drawTimeline(b, X, Y, chartW, chartH); else L = drawLineChart(b, X, Y, chartW, chartH);
    y = top - chartH - 8;
    if (L && L.series.length) { const colW = cw / 3; L.series.forEach((s, i) => { const cx = mL + (i % 3) * colW, cy = y - Math.floor(i / 3) * 11; page.drawLine({ start: { x: cx + 4, y: cy - 3 }, end: { x: cx + 26, y: cy - 3 }, thickness: 0.9, color: ink, ...(s.dash.length ? { dashArray: s.dash } : {}) }); text(clean(s.name), cx + 31, cy - 5.5, 7); }); y -= legendRows * 11 + 2; }
    for (const ln of noteLines) { text(ln, mL, y - 7.5, 7.5, F.i); y -= 10; }
    sourceLine(clean(sourceText(nextSource, model)));
  };
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]; if (!b || !b.type) continue;
    const next = blocks[i + 1] && blocks[i + 1].type === 'source' ? blocks[++i] : null; // a source line binds to the block before it
    switch (b.type) {
      case 'lead': numbered([{ text: String(b.text) }], bodySize + 0.5); break;
      case 'p': numbered([{ text: String(b.text) }], bodySize); break;
      case 'quote': quote(b); break;
      case 'h': heading(String(b.text), b.num !== false); break;
      case 'h3': subheading(String(b.text)); break;
      case 'boxes': boxes(b.items || []); break;
      case 'list': listBlock(b.items || []); break;
      case 'table': tableBlock(b, next); break;
      case 'schedule': tableBlock(b, next, b.footnotes || []); break;
      case 'exhibit': exhibit(b, next); break;
      case 'risks': risks(b.items || []); break;
      case 'tombstone': tombstone(b.lines || []); break;
      case 'source': sourceLine(clean(sourceText(b, model))); break;
      case 'disclaimer': { need(40); y -= 10; rule(y, 0.9); y -= 8; richPara([{ text: String(b.text), font: F.i }], { size: 7.5, lead: 1.3 }); y -= 4; break; }
      default: if (b.text) numbered([{ text: String(b.text) }], bodySize);
    }
    if (next && !['table', 'schedule', 'exhibit'].includes(b.type)) sourceLine(clean(sourceText(next, model)));
  }
  /* ---------- final pass: footers and footnotes ---------- */
  const N = pages.length;
  pages.forEach((pg, idx) => {
    page = pg;
    if (idx > 0) { hline(mL, W - mR, 40, 0.4); textC(`Page ${idx + 1} of ${N}`, W / 2, 29, 8); if (model.fundId) text(footLeft, mL, 29, 7, F.c); else text(footLeft, mL, 29, 7, F.i); textR(docNo, W - mR, 29, 7, F.c); }
    const fns = footnotesByPage[idx]; if (fns && fns.length) { const h = fns.length * 9 + 10; let yy = mB + h - 2; hline(mL, mL + 120, yy + 4, 0.5); fns.forEach(({ ln }) => { const sv = y; y = yy; drawLine(ln, mL, cw, 7, false); y = sv; yy -= 9; }); }
  });
  return await doc.save();
}
/* =====================================================================================================
   DOCX
   ===================================================================================================== */
function chartPNG(block, wPx, hPx) { // browser only: draw the exhibit on a canvas, return PNG bytes (or null)
  if (typeof document === 'undefined' || !document.createElement) return null;
  try {
    const scale = 2, cv = document.createElement('canvas'); cv.width = wPx * scale; cv.height = hPx * scale; const g = cv.getContext('2d'); if (!g) return null;
    g.scale(scale, scale); g.fillStyle = '#fff'; g.fillRect(0, 0, wPx, hPx); g.strokeStyle = '#000'; g.fillStyle = '#000'; g.lineWidth = 0.8; g.font = '9px Arial, Helvetica, sans-serif';
    const font = (s, style = '') => { g.font = `${style} ${s * 1.2}px Arial, Helvetica, sans-serif`.trim(); }, measure = (t, s) => { const f = g.font; font(s); const w = g.measureText(t).width; g.font = f; return w; };
    const kind = block.kind || 'line';
    const pattern = (kind, box, clipPath) => { const pm = patternMarks(kind, box); g.save(); g.beginPath(); clipPath.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
      if (pm.fill !== null) { g.fillStyle = `rgb(${Math.round(pm.fill * 255)},${Math.round(pm.fill * 255)},${Math.round(pm.fill * 255)})`; g.fillRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2); g.fillStyle = '#000'; }
      g.lineWidth = 0.5; g.beginPath(); for (const [x1, y1, x2, y2] of pm.lines) { g.moveTo(x1, y1); g.lineTo(x2, y2); } g.stroke();
      for (const [x, y, r] of pm.dots) { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); } g.restore(); };
    const rectPts = (b) => [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
    const poly = (pts, close) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); g.stroke(); };
    g.textBaseline = 'middle';
    if (kind === 'pie') {
      const L = pieLayout(block, wPx, hPx, measure); if (!L.segments.length) { g.textAlign = 'center'; g.fillText('No data', wPx / 2, hPx / 2); }
      for (const s of L.segments) { pattern(s.pattern, s.bbox, s.poly); g.lineWidth = 0.8; poly(s.poly, true); }
      if (L.segments.length) { g.lineWidth = 1; g.beginPath(); g.arc(L.cx, L.cy, L.R, 0, 2 * Math.PI); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(L.cx, L.cy, L.r, 0, 2 * Math.PI); g.fill(); g.stroke(); g.fillStyle = '#000'; }
      font(7); for (const s of L.segments) { g.lineWidth = 0.5; g.beginPath(); g.moveTo(s.leader[0][0], s.leader[0][1]); g.lineTo(s.leader[1][0], s.leader[1][1]); g.stroke(); g.textAlign = s.label.align === 'l' ? 'left' : 'right'; g.fillText(s.label.text, s.label.x, s.label.y); }
      font(L.size); for (const q of L.legend) { pattern(q.pattern, q.swatch, rectPts(q.swatch)); g.lineWidth = 0.6; g.strokeRect(q.swatch.x, q.swatch.y, q.swatch.w, q.swatch.h); g.textAlign = 'left'; g.fillText(q.name, q.textX, q.y + 6); g.textAlign = 'right'; g.fillText(q.val, q.valX, q.y + 6); }
    } else if (kind === 'hbar') {
      const L = hbarLayout(block, wPx, hPx, measure); font(L.size);
      for (const r of L.rows) { if (r.header) { font(7, 'bold'); g.textAlign = 'left'; g.fillText(r.name.toUpperCase(), 2, r.y); g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, r.y + 6); g.lineTo(wPx, r.y + 6); g.stroke(); font(L.size); continue; }
        g.textAlign = 'left'; g.fillText(r.name, 4, r.y); if (r.bar.w > 0.6) { pattern(r.pattern, r.bar, rectPts(r.bar)); g.lineWidth = 0.7; g.strokeRect(r.bar.x, r.bar.y, r.bar.w, r.bar.h); } g.fillText(r.text, r.valX, r.y); }
      g.lineWidth = 0.6; g.beginPath(); g.moveTo(L.nameW, 0); g.lineTo(L.nameW, L.height); g.stroke();
    } else if (kind === 'timeline') {
      const L = timelineLayout(block, wPx, hPx, measure); if (!L) { g.textAlign = 'center'; g.fillText('No dates', wPx / 2, hPx / 2); }
      else { const bar = L.bar; if (L.elapsed > 0) { const eb = { x: bar.x, y: bar.y, w: L.elapsed, h: bar.h }; pattern('hatch', eb, rectPts(eb)); } g.lineWidth = 1; g.strokeRect(bar.x, bar.y, bar.w, bar.h);
        for (const m of L.marks) { const up = m.kind !== 'review', big = m.kind === 'start' || m.kind === 'exit'; g.lineWidth = big ? 1.3 : 0.7; g.beginPath(); g.moveTo(m.x, up ? bar.y - 5 : bar.y + bar.h); g.lineTo(m.x, up ? bar.y : bar.y + bar.h + 5); g.stroke(); font(L.size, big ? 'bold' : ''); g.textAlign = 'left'; g.fillText(m.label, m.labelX, m.labelY); }
        if (L.today) { const tx = L.today.x, ty = bar.y + bar.h + 1; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - 3.5, ty + 6); g.lineTo(tx + 3.5, ty + 6); g.closePath(); g.fill(); g.setLineDash([2, 1.5]); g.lineWidth = 1; g.beginPath(); g.moveTo(tx, bar.y - 2); g.lineTo(tx, bar.y + bar.h + 2); g.stroke(); g.setLineDash([]); font(L.size, 'bold italic'); const lw = g.measureText(L.today.label).width, rows = L.marks.filter(m => m.kind === 'review').length; g.fillText(L.today.label, Math.max(0, Math.min(wPx - lw, tx - lw / 2)), bar.y + bar.h + (rows ? 24 : 12)); } }
    } else {
      const L = chartLayout(block, wPx, hPx - 16);
      g.strokeRect(L.plot.x + 0.5, L.plot.y + 0.5, L.plot.w, L.plot.h);
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (const t of L.yTicks) { if (t.y > L.plot.y + 0.5 && t.y < L.plot.y + L.plot.h - 0.5) { g.setLineDash([1, 2]); g.lineWidth = 0.4; g.beginPath(); g.moveTo(L.plot.x, t.y); g.lineTo(L.plot.x + L.plot.w, t.y); g.stroke(); } g.fillText(t.label, L.plot.x - 4, t.y); }
      g.setLineDash([]); g.lineWidth = 0.8; g.textAlign = 'center'; g.textBaseline = 'top';
      L.xTicks.forEach((t, i) => { g.beginPath(); g.moveTo(t.x, L.plot.y + L.plot.h); g.lineTo(t.x, L.plot.y + L.plot.h + 3); g.stroke(); g.textAlign = i === 0 ? 'left' : i === L.xTicks.length - 1 ? 'right' : 'center'; g.fillText(t.label, t.x, L.plot.y + L.plot.h + 4); });
      g.lineWidth = 1.2; L.series.forEach(s => { g.setLineDash(s.dash); g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); });
      g.textBaseline = 'middle'; g.textAlign = 'right'; for (const r of L.refs) { g.setLineDash([5, 2]); g.lineWidth = 0.8; g.beginPath(); g.moveTo(L.plot.x, r.y); g.lineTo(L.plot.x + L.plot.w, r.y); g.stroke(); g.setLineDash([]); const lw = g.measureText(r.label).width; g.fillStyle = '#fff'; g.fillRect(L.plot.x + L.plot.w - lw - 7, r.y - 11, lw + 5, 10); g.fillStyle = '#000'; g.fillText(r.label, L.plot.x + L.plot.w - 4, r.y - 6); }
      g.setLineDash([]); g.textAlign = 'left'; g.textBaseline = 'middle'; const colW = wPx / 3;
      L.series.forEach((s, i) => { const cx = (i % 3) * colW + 4, cy = hPx - 8 - Math.floor(i / 3) * 12; g.setLineDash(s.dash); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 22, cy); g.stroke(); g.setLineDash([]); g.fillText(s.name, cx + 27, cy); });
    }
    const b64 = cv.toDataURL('image/png').split(',')[1], bin = atob(b64), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
  } catch (_) { return null; }
}
async function renderDOCX2(model, docx) {
  model = DLX_PREP(model);
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageNumber, Footer, Header, PageBreak, TabStopType, LeaderType, ImageRun, TableLayoutType } = docx;
  const FONT = 'Arial', SZ = 22, P0 = { before: 0, after: 0, line: 240 }, TW = 9638; // text width in twips (A4, 2 cm margins)
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, thin = { style: BorderStyle.SINGLE, size: 4, color: '000000' }, thick = { style: BorderStyle.SINGLE, size: 8, color: '000000' }, dbl = { style: BorderStyle.DOUBLE, size: 6, color: '000000' };
  const bodyHalf = Math.round((+model.bodySize || 10) * 2);
  const run = (t, o = {}) => new TextRun({ text: String(t ?? ''), font: o.font || FONT, size: o.size || SZ, bold: !!o.bold, italics: !!o.italics, smallCaps: !!o.sc, allCaps: !!o.caps, color: o.color || '000000', characterSpacing: o.spacing || undefined });
  const par = (children, o = {}) => new Paragraph({ spacing: P0, alignment: o.align || AlignmentType.LEFT, indent: o.indent, tabStops: o.tabs, border: o.border, keepNext: !!o.keepNext, keepLines: !!o.keepLines, pageBreakBefore: !!o.pageBreakBefore, children: Array.isArray(children) ? children : [children] });
  const p = (t, o = {}) => par(run(t, o), o);
  const blank = () => par(run(''));
  const docNo = docNumber(model), issued = issueDate(model), legend = legendText(model), children = [], fundCover = model.cover === 'fund';
  /* cover */
  children.push(par([run(spellDate(issued), { font: 'Courier New', size: 16 }), new TextRun({ text: `\tDocument No. ${docNo}`, font: 'Courier New', size: 16 })], { tabs: [{ type: TabStopType.RIGHT, position: TW }], border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000', space: 4 } } }));
  children.push(blank());
  children.push(p('Private and Confidential — For the Addressee Only', { sc: true, size: 18, align: AlignmentType.CENTER }));
  if (fundCover) { // seal square (4 cm) above the title: the image when given, otherwise the same height of empty paragraphs
    for (let i = 0; i < 2; i++) children.push(blank());
    let seal = null; if (model.sealPng) { try { seal = new Paragraph({ spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' }, alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: model.sealPng, transformation: { width: 151, height: 151 } })] }); } catch (_) { seal = null; } }
    if (seal) children.push(seal); else for (let i = 0; i < 9; i++) children.push(blank());
    children.push(blank()); children.push(blank());
  } else for (let i = 0; i < 9; i++) children.push(blank());
  children.push(p(String(model.kicker || 'Research report').toUpperCase().split('').join(' '), { size: 17, align: AlignmentType.CENTER }));
  children.push(blank()); children.push(blank());
  children.push(p(model.title, { bold: true, size: 52, align: AlignmentType.CENTER, color: '1A2957' }));
  if (model.titleLine2) { children.push(blank()); children.push(p(model.titleLine2, { bold: true, size: 32, align: AlignmentType.CENTER, color: '1A2957' })); }
  if (model.subtitle) { children.push(blank()); children.push(p(model.subtitle, { italics: true, size: 28, align: AlignmentType.CENTER })); }
  children.push(blank());
  if (fundCover) { for (const m of model.meta || []) children.push(p(m, { size: 18 })); }
  else { children.push(p(spellDate(issued), { size: 22, align: AlignmentType.CENTER })); for (const m of model.meta || []) children.push(p(m, { size: 19, align: AlignmentType.CENTER })); }
  for (let i = 0; i < 4; i++) children.push(blank());
  const coverCell = (lab, val, o = {}) => new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: none, bottom: none, left: none, right: none }, margins: { top: 40, bottom: 40, left: 120, right: 120 }, children: [p(lab, { sc: true, size: 15 }), p(val, { size: 21, ...o })] });
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [coverCell('Prepared for', PREPARED_FOR(model)), coverCell('Prepared by', PREPARED_BY(model), { bold: true, color: '1A2957' })] }),
    new TableRow({ children: [coverCell('Document type', String(model.kicker || 'Research report')), coverCell('Reference', docNo, { font: 'Courier New', size: 19 })] })] }));
  children.push(par(run(''), { border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000', space: 4 } } }));
  if (model.coverLegend !== false && legend.trim()) {
    for (let i = 0; i < 6; i++) children.push(blank());
    children.push(par(run('Important notice', { sc: true, size: 13 }), { border: { top: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 4 } } }));
    children.push(p(legend, { italics: true, size: 15, align: AlignmentType.JUSTIFIED }));
  }
  children.push(new Paragraph({ spacing: P0, children: [new PageBreak()] }));
  /* body */
  let hN = 0, pN = 0, exN = 0, fnN = 0; const blocks = model.blocks || [];
  const hang = { left: 567, hanging: 567 };
  const numbered = (runs, o = {}) => { pN++; children.push(par([run(`${pN}.\t`, { size: o.size || bodyHalf }), ...runs], { align: AlignmentType.JUSTIFIED, indent: hang })); children.push(blank()); };
  const sourcePar = (txt) => { children.push(par([run('Source: ', { italics: true, size: 15 }), run(txt, { italics: true, size: 15 })])); children.push(blank()); };
  const colTwips = (cols) => { const tot = cols.reduce((a, c) => a + (+c[2] || 1), 0); return cols.map(c => Math.round((+c[2] || 1) / tot * TW)); };
  const ruledTable = (cols, rows, opts = {}) => {
    const ws = colTwips(cols), last = rows.length - 1, bs = opts.size ? Math.round(opts.size * 2) : 18;
    const cell = (v, c, i, kind) => new TableCell({ width: { size: ws[i], type: WidthType.DXA }, borders: { left: none, right: none, top: kind === 'head' ? thick : kind === 'total' ? thin : none, bottom: kind === 'head' ? thin : kind === 'last' || kind === 'total' ? thick : none }, margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [par(run(kind === 'head' ? String(v).toUpperCase() : kind === 'total' && String(v ?? '').trim() === '' ? '' : figure(v, c[1]), { size: kind === 'head' ? Math.min(15, bs - 2) : bs, bold: kind === 'head' || kind === 'total' }), { align: c[1] === 'r' ? AlignmentType.RIGHT : AlignmentType.LEFT })] });
    children.push(new Table({ width: { size: TW, type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: ws, rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: cols.map((c, i) => cell(c[0], c, i, 'head')) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: cols.map((c, i) => cell(r[i] ?? '', c, i, ri === last ? (opts.totals ? 'total' : 'last') : 'body')) }))] }));
  };
  const leaderTable = (cols, rows) => { // two columns: label … figure, with dot leaders
    const tabs = [{ type: TabStopType.RIGHT, position: TW, leader: LeaderType.DOT }], last = rows.length - 1;
    children.push(par([run(String(cols[0][0]).toUpperCase(), { bold: true, size: 15 }), new TextRun({ text: `\t${String(cols[1][0]).toUpperCase()}`, font: FONT, size: 15, bold: true })], { tabs: [{ type: TabStopType.RIGHT, position: TW }], border: { top: { ...thick, space: 2 }, bottom: { ...thin, space: 2 } }, keepNext: true }));
    rows.forEach((r, i) => children.push(par([run(r[0] ?? '', { size: 19 }), new TextRun({ text: `\t${figure(r[1], cols[1][1] || 'r')}`, font: FONT, size: 19 })], { tabs, border: i === last ? { bottom: { ...thick, space: 2 } } : undefined })));
  };
  const tableBlock = (b, next, footnotes) => {
    const cols = b.cols || [], rows = (b.rows || []).length ? b.rows : [cols.map((c, i) => i ? '' : 'None.')]; if (!cols.length) return;
    if (cols.length === 2) leaderTable(cols, rows); else ruledTable(cols, rows, { size: b.size, totals: !!b.totals });
    for (const fn of footnotes || []) { const t = String(fn); let pre = ''; if (!/^\s*[(\[]?\d+[)\]]?\s/.test(t) && !/^\s*\*/.test(t)) { fnN++; pre = `(${fnN}) `; } children.push(p(pre + t, { size: 15 })); }
    sourcePar(sourceText(next, model));
  };
  const boxes = (items) => { if (!items.length) return; const n = items.length, cwT = Math.floor(TW / n);
    children.push(new Table({ width: { size: TW, type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: items.map(() => cwT), rows: [new TableRow({ cantSplit: true, children: items.map(([k, v]) => new TableCell({ width: { size: cwT, type: WidthType.DXA }, borders: { top: thick, bottom: thick, left: thin, right: thin }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [p(k, { sc: true, size: 14 }), par([run('', { size: 20 }), new TextRun({ text: `\t${v}`, font: FONT, size: 20, bold: true })], { tabs: [{ type: TabStopType.RIGHT, position: cwT - 200, leader: LeaderType.DOT }] })] })) })] }));
    children.push(blank()); };
  const tombstone = (lines) => { children.push(new Table({ width: { size: 84, type: WidthType.PERCENTAGE }, alignment: AlignmentType.CENTER, rows: [new TableRow({ cantSplit: true, children: [new TableCell({ borders: { top: dbl, bottom: dbl, left: dbl, right: dbl }, margins: { top: 200, bottom: 200, left: 300, right: 300 },
    children: lines.flatMap((l, i) => i === 0 ? [p(String(l).toUpperCase(), { bold: true, size: 22, align: AlignmentType.CENTER }), par(run(''), { align: AlignmentType.CENTER, border: { bottom: { ...thin, space: 1 } }, indent: { left: 2800, right: 2800 } })] : [p(l, { size: 19, align: AlignmentType.CENTER })]) })] })] })); children.push(blank()); };
  const exhibit = (b, next) => {
    exN++; children.push(par(run(`Exhibit ${exN} — ${String(b.title || '')}`, { sc: true, bold: true, size: 17 }), { align: AlignmentType.CENTER, keepNext: true, border: { top: { ...thin, space: 3 }, bottom: { ...thin, space: 3 }, left: { ...thin, space: 3 }, right: { ...thin, space: 3 } } }));
    const kind = b.kind || 'line', hPx = kind === 'line' ? Math.round(exhibitHeight(b) * 620 / 471) + 16 : Math.round(exhibitHeight(b) * 620 / 471), png = chartPNG(b, 620, hPx);
    if (png) children.push(new Paragraph({ spacing: { before: 60, after: 60, line: 240, lineRule: 'auto' }, alignment: AlignmentType.CENTER, keepNext: true, children: [new ImageRun({ type: 'png', data: png, transformation: { width: 620, height: hPx } })] }));
    else if (kind === 'pie' || kind === 'hbar') { const items = (b.series || []).filter(s => s && !s.header && isFinite(+s.value)), tot = items.reduce((a, s) => a + +s.value, 0) || 1; ruledTable([['Item', 'l', 3], ['Value', 'r', 1], ['Share', 'r', 1]], items.map(s => [s.name, s.label || String(Math.round(+s.value)), (+s.value / tot * 100).toFixed(0) + '%'])); }
    else if (kind === 'timeline') ruledTable([['Date', 'l', 1], ['Mark', 'l', 2]], [[String(b.start || ''), 'Start'], ...(b.marks || []).map(m => [String(m.date || ''), String(m.label || m.kind || '')]), [String(b.end || ''), 'End']]);
    else { // no canvas (e.g. Node): a compact table stands in for the drawing
      const series = (b.series || []).filter(s => s && Array.isArray(s.points) && s.points.length);
      ruledTable([['Series', 'l', 2], ['First', 'r', 1], ['Last', 'r', 1], ['Low', 'r', 1], ['High', 'r', 1]], series.map(s => { const v = s.points.map(q => +q[1]).filter(isFinite); return [s.name, String(s.points[0][1]), String(s.points[s.points.length - 1][1]), String(Math.min(...v)), String(Math.max(...v))]; })); }
    if (b.note) children.push(p(b.note, { italics: true, size: 15 }));
    sourcePar(sourceText(next, model));
  };
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]; if (!b || !b.type) continue;
    const next = blocks[i + 1] && blocks[i + 1].type === 'source' ? blocks[++i] : null;
    switch (b.type) {
      case 'lead': numbered([run(b.text, { size: bodyHalf + 1 })], { size: bodyHalf + 1 }); break;
      case 'p': numbered([run(b.text, { size: bodyHalf })]); break;
      case 'quote': children.push(par([run('“' + String(b.text).trim() + '”', { italics: true, size: bodyHalf })], { indent: { left: 567, right: 567 } })); if (b.by) children.push(p('— ' + b.by, { size: bodyHalf - 3, align: AlignmentType.RIGHT, indent: { right: 567 } })); children.push(blank()); break;
      case 'h': { if (children.length && (hN > 0 || b.num === false)) children.push(blank()); const numberedH = b.num !== false; if (numberedH) hN++; children.push(par([...(numberedH ? [run(`${ROMAN(hN)}.`, { bold: true, size: 22 }), new TextRun({ text: `\t${String(b.text).toUpperCase()}`, font: FONT, size: 22, bold: true })] : [run(String(b.text).toUpperCase(), { bold: true, size: 22 })])], { tabs: [{ type: TabStopType.LEFT, position: 567 }], keepNext: true, border: { bottom: { ...thin, space: 2 } } })); children.push(blank()); break; }
      case 'h3': children.push(p(b.text, { bold: true, sc: true, size: 21, keepNext: true })); break;
      case 'boxes': boxes(b.items || []); break;
      case 'list': (b.items || []).forEach((t, k) => children.push(par([run(`(${LETTER(k)})\t`, { size: Math.min(bodyHalf, 21) }), run(t, { size: Math.min(bodyHalf, 21) })], { align: AlignmentType.JUSTIFIED, indent: { left: 1134, hanging: 567 } }))); children.push(blank()); break;
      case 'table': tableBlock(b, next); break;
      case 'schedule': tableBlock(b, next, b.footnotes || []); break;
      case 'exhibit': exhibit(b, next); break;
      case 'risks': (b.items || []).forEach((t, k) => { const [cap, rest] = splitLead(t), s = Math.min(bodyHalf, 21); children.push(par([run(`${k + 1}.\t`, { bold: true, size: s }), run(cap, { bold: true, italics: true, size: s }), ...(rest ? [run(' ' + rest, { size: s })] : [])], { align: AlignmentType.JUSTIFIED, indent: hang })); children.push(blank()); }); break;
      case 'tombstone': tombstone(b.lines || []); break;
      case 'source': sourcePar(sourceText(b, model)); break;
      case 'disclaimer': children.push(blank()); children.push(par(run(b.text, { italics: true, size: 15 }), { align: AlignmentType.JUSTIFIED, border: { top: { ...thick, space: 4 } } })); break;
      default: if (b.text) numbered([run(b.text, { size: bodyHalf })]);
    }
    if (next && !['table', 'schedule', 'exhibit'].includes(b.type)) sourcePar(sourceText(next, model));
  }
  const footLeft = model.fundId ? run(String(model.fundId), { font: 'Courier New', size: 14 }) : run(String(model.subtitle || ''), { italics: true, size: 14 });
  const doc = new Document({ creator: PREPARED_BY(model), title: `${model.title} — ${model.subtitle || ''}`, description: String(model.kicker || ''), styles: { default: { document: { run: { font: FONT, size: SZ }, paragraph: { spacing: P0 } } } },
    sections: [{ properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 567, footer: 567 } } },
      headers: { first: new Header({ children: [blank()] }), default: new Header({ children: [par([run(`${PREPARED_BY(model)} · ${model.title}`, { sc: true, size: 16 }), new TextRun({ text: `\t${docNo}`, font: 'Courier New', size: 14 })], { tabs: [{ type: TabStopType.RIGHT, position: TW }], border: { bottom: { ...thin, space: 2 } } })] }) },
      footers: { first: new Footer({ children: [blank()] }), default: new Footer({ children: [par([footLeft, new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: FONT, size: 16 }), new TextRun({ text: `\t${docNo}`, font: 'Courier New', size: 14 })], { tabs: [{ type: TabStopType.CENTER, position: Math.round(TW / 2) }, { type: TabStopType.RIGHT, position: TW }], border: { top: { ...thin, space: 2 } } })] }) },
      children }] });
  return Packer.toBlob && typeof window !== 'undefined' ? Packer.toBlob(doc) : Packer.toBuffer(doc);
}
return { renderPDF: renderPDF2, renderDOCX: renderDOCX2, docNumber, chartLayout, pieLayout, hbarLayout, timelineLayout, patternMarks, figure, PDF_MAP };
})();
if (typeof ENGINE !== 'undefined') { ENGINE.renderPDF = REPORTS.renderPDF; ENGINE.renderDOCX = REPORTS.renderDOCX; }
if (typeof module !== 'undefined') module.exports = { renderPDF: REPORTS.renderPDF, renderDOCX: REPORTS.renderDOCX };
/*</REPORTS>*/
