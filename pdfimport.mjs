// GNC Terminal — broker statement import: a small pure-Node PDF text extractor (no npm packages) and broker parsers.
// PDF: classic xref tables and compressed xref streams (/Prev chains, hybrid /XRefStm), object streams (/ObjStm),
// FlateDecode (with PNG/TIFF predictors), ASCIIHex, ASCII85; page trees with inherited resources; content streams with
// q/Q/cm, BT/ET, Tm/Td/TD/T*/'/", Tj/TJ with kerning, Tc/Tw/Tz/TL/Ts, form XObjects; fonts: Type0/Identity-H (2-byte
// codes), simple fonts with WinAnsi/MacRoman/Standard + /Differences, ToUnicode CMaps (bfchar/bfrange, codespace).
// Output: per page, positioned text items (x, y in points, origin bottom-left) and lines rebuilt by y, so table
// columns can be recovered by x position.
// Parsers: parseAkYatirim (Ak Yatırım "İŞLEM SONUÇ FORMU"), parseMidasCSV, parseMidasPDF (best effort), parseGeneric.
// Privacy: national ID / tax numbers are never returned; account numbers are masked.
import zlib from 'node:zlib';

/* ============================== low-level parsing ============================== */
const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);
class Ref { constructor(n, g) { this.n = n; this.g = g; } }
class Name { constructor(s) { this.s = s; } toString() { return this.s; } }
class Op { constructor(s) { this.s = s; } }
const isName = (v, s) => v instanceof Name && (s === undefined || v.s === s);

class Lexer {
  constructor(buf, pos = 0) { this.b = buf; this.p = pos; }
  skipWS() { const b = this.b; for (;;) { while (this.p < b.length && WS.has(b[this.p])) this.p++; if (b[this.p] === 37) { while (this.p < b.length && b[this.p] !== 10 && b[this.p] !== 13) this.p++; continue; } break; } }
  // returns a token: number, Name, string (Buffer, flagged), '[', ']', '<<', '>>', '{', '}', Op (keyword), or null at end
  next() {
    this.skipWS(); const b = this.b; if (this.p >= b.length) return null; const c = b[this.p];
    if (c === 91) { this.p++; return '['; } if (c === 93) { this.p++; return ']'; }
    if (c === 123) { this.p++; return '{'; } if (c === 125) { this.p++; return '}'; }
    if (c === 60) { if (b[this.p + 1] === 60) { this.p += 2; return '<<'; } return this.hexString(); }
    if (c === 62) { if (b[this.p + 1] === 62) { this.p += 2; return '>>'; } this.p++; return this.next(); }
    if (c === 40) return this.litString();
    if (c === 47) { this.p++; let s = ''; while (this.p < b.length && !WS.has(b[this.p]) && !DELIM.has(b[this.p])) { if (b[this.p] === 35 && /[0-9a-f]{2}/i.test(String.fromCharCode(b[this.p + 1], b[this.p + 2]))) { s += String.fromCharCode(parseInt(String.fromCharCode(b[this.p + 1], b[this.p + 2]), 16)); this.p += 3; } else s += String.fromCharCode(b[this.p++]); } return new Name(s); }
    let s = ''; while (this.p < b.length && !WS.has(b[this.p]) && !DELIM.has(b[this.p])) s += String.fromCharCode(b[this.p++]);
    if (!s) { this.p++; return this.next(); }
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return +s;
    if (/^[+-]?\d*\.\d*\.?[\d.]*$/.test(s) && /\d/.test(s)) return parseFloat(s) || 0; // malformed numbers like 1.2.3 or --5
    return new Op(s);
  }
  hexString() { const b = this.b; this.p++; let h = ''; while (this.p < b.length && b[this.p] !== 62) { const ch = b[this.p++]; if (!WS.has(ch)) h += String.fromCharCode(ch); } this.p++; if (h.length % 2) h += '0'; const out = Buffer.from(h.replace(/[^0-9a-f]/gi, ''), 'hex'); out.hex = true; return out; }
  litString() {
    const b = this.b; this.p++; const out = []; let depth = 1;
    while (this.p < b.length) { let c = b[this.p++];
      if (c === 92) { c = b[this.p++];
        if (c === 110) out.push(10); else if (c === 114) out.push(13); else if (c === 116) out.push(9); else if (c === 98) out.push(8); else if (c === 102) out.push(12);
        else if (c === 13) { if (b[this.p] === 10) this.p++; } else if (c === 10) { }
        else if (c >= 48 && c <= 55) { let o = c - 48; for (let k = 0; k < 2 && b[this.p] >= 48 && b[this.p] <= 55; k++) o = o * 8 + (b[this.p++] - 48); out.push(o & 255); }
        else out.push(c); continue; }
      if (c === 40) depth++; else if (c === 41) { if (--depth === 0) break; }
      out.push(c); }
    const r = Buffer.from(out); r.lit = true; return r;
  }
}
// parse one object (after the first token has been read)
function parseObj(lx, tok, ops) {
  if (tok === '[') { const a = []; for (;;) { const t = lx.next(); if (t === null || t === ']') return a; a.push(parseObj(lx, t, ops)); } }
  if (tok === '<<') { const d = {}; for (;;) { const k = lx.next(); if (k === null || k === '>>') return d; if (!(k instanceof Name)) continue; const t = lx.next(); if (t === '>>') { d[k.s] = null; return d; } d[k.s] = parseObj(lx, t, ops); } }
  if (typeof tok === 'number' && !ops) { // possible "n g R"
    const save = lx.p, t2 = lx.next();
    if (typeof t2 === 'number' && Number.isInteger(tok) && Number.isInteger(t2)) { const save2 = lx.p, t3 = lx.next(); if (t3 instanceof Op && t3.s === 'R') return new Ref(tok, t2); lx.p = save2; }
    lx.p = save; return tok;
  }
  if (tok instanceof Op) { if (tok.s === 'true') return true; if (tok.s === 'false') return false; if (tok.s === 'null') return null; }
  return tok;
}

/* ============================== filters ============================== */
function inflate(buf) {
  try { return zlib.inflateSync(buf); } catch (e) { }
  try { return zlib.inflateSync(buf, { finishFlush: zlib.constants.Z_SYNC_FLUSH }); } catch (e) { }
  try { return zlib.inflateRawSync(buf.subarray(2), { finishFlush: zlib.constants.Z_SYNC_FLUSH }); } catch (e) { }
  return Buffer.alloc(0);
}
function unpredict(data, parms) {
  const pr = (parms && parms.Predictor) || 1; if (pr < 2) return data;
  const colors = parms.Colors || 1, bpc = parms.BitsPerComponent || 8, cols = parms.Columns || 1, bpp = Math.max(1, Math.ceil(colors * bpc / 8)), row = Math.ceil(colors * bpc * cols / 8);
  if (pr === 2) { const out = Buffer.from(data); for (let r = 0; r * row < out.length; r++) for (let i = bpp; i < row; i++) out[r * row + i] = (out[r * row + i] + out[r * row + i - bpp]) & 255; return out; }
  const out = Buffer.alloc(Math.floor(data.length / (row + 1)) * row); let prev = Buffer.alloc(row);
  for (let r = 0, ip = 0; ip + row < data.length + 1 && r * row < out.length; r++) { const ft = data[ip++], cur = Buffer.from(data.subarray(ip, ip + row)); ip += row;
    for (let i = 0; i < row; i++) { const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      if (ft === 1) cur[i] = (cur[i] + a) & 255; else if (ft === 2) cur[i] = (cur[i] + b) & 255; else if (ft === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255;
      else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; } }
    cur.copy(out, r * row); prev = cur; }
  return out;
}
function asciiHex(buf) { const s = buf.toString('latin1').replace(/>.*$/s, '').replace(/[^0-9a-f]/gi, ''); return Buffer.from(s.length % 2 ? s + '0' : s, 'hex'); }
function ascii85(buf) { const s = buf.toString('latin1').replace(/^<~/, '').replace(/~>.*$/s, '').replace(/\s/g, ''); const out = []; let grp = [];
  for (const ch of s) { if (ch === 'z' && !grp.length) { out.push(0, 0, 0, 0); continue; } grp.push(ch.charCodeAt(0) - 33); if (grp.length === 5) { let v = 0; for (const g of grp) v = v * 85 + g; out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); grp = []; } }
  if (grp.length) { const n = grp.length; while (grp.length < 5) grp.push(84); let v = 0; for (const g of grp) v = v * 85 + g; const bytes = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; out.push(...bytes.slice(0, n - 1)); }
  return Buffer.from(out); }

/* ============================== document ============================== */
export class PDFDoc {
  constructor(buf) {
    this.buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf); this.xref = new Map(); this.cache = new Map(); this.trailer = {}; this.warnings = [];
    if (this.buf.subarray(0, 1024).toString('latin1').indexOf('%PDF') < 0) throw new Error('not a PDF file');
    try { this.readXref(); } catch (e) { this.warnings.push('xref: ' + e.message); }
    if (!this.trailer.Root || !this.get(this.trailer.Root)) this.scanObjects();
  }
  readXref() {
    const tail = this.buf.subarray(Math.max(0, this.buf.length - 2048)).toString('latin1'), m = tail.match(/startxref\s+(\d+)\s+%%EOF\s*$/) || [...tail.matchAll(/startxref\s+(\d+)/g)].pop();
    if (!m) throw new Error('no startxref'); let off = +m[1]; const seen = new Set();
    while (off != null && off >= 0 && off < this.buf.length && !seen.has(off)) { seen.add(off); const tr = this.readXrefAt(off); if (!tr) break; for (const k of Object.keys(tr)) if (!(k in this.trailer)) this.trailer[k] = tr[k];
      if (tr.XRefStm) this.readXrefAt(tr.XRefStm); off = typeof tr.Prev === 'number' ? tr.Prev : null; }
  }
  readXrefAt(off) {
    const lx = new Lexer(this.buf, off); lx.skipWS();
    if (this.buf.subarray(lx.p, lx.p + 4).toString('latin1') === 'xref') { lx.p += 4;
      for (;;) { const save = lx.p, a = lx.next(); if (a instanceof Op && a.s === 'trailer') { const t = lx.next(); return parseObj(lx, t); } if (typeof a !== 'number') { lx.p = save; return null; } const cnt = lx.next(); lx.skipWS();
        for (let i = 0; i < cnt; i++) { const line = this.buf.subarray(lx.p, lx.p + 20).toString('latin1'), mm = line.match(/^(\d{10}) (\d{5}) ([nf])/); if (!mm) { const t1 = lx.next(), t2 = lx.next(), t3 = lx.next(); if (t3 instanceof Op && t3.s === 'n' && !this.xref.has(a + i)) this.xref.set(a + i, { off: t1, gen: t2 }); continue; }
          if (mm[3] === 'n' && !this.xref.has(a + i)) this.xref.set(a + i, { off: +mm[1], gen: +mm[2] }); else if (!this.xref.has(a + i)) this.xref.set(a + i, { free: true }); lx.p += 20; lx.skipWS(); } } }
    // xref stream: "n g obj << ... >> stream"
    const o = this.parseIndirectAt(off); if (!o || !o.dict || !isName(o.dict.Type, 'XRef')) return null;
    const d = o.dict, data = this.streamData(o), W = d.W || [1, 2, 1], idx = d.Index || [0, d.Size || 0], w = W[0] + W[1] + W[2]; let p = 0;
    const rd = (n) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + data[p++]; return v; };
    for (let k = 0; k < idx.length; k += 2) for (let i = 0; i < idx[k + 1] && p + w <= data.length; i++) { const n = idx[k] + i, t = W[0] ? rd(W[0]) : 1, f2 = rd(W[1]), f3 = rd(W[2]); if (this.xref.has(n)) continue;
      if (t === 1) this.xref.set(n, { off: f2, gen: f3 }); else if (t === 2) this.xref.set(n, { stm: f2, idx: f3 }); else this.xref.set(n, { free: true }); }
    return d;
  }
  scanObjects() { // damaged file: find "n g obj" everywhere
    this.warnings.push('rebuilt the cross-reference table by scanning'); const s = this.buf.toString('latin1');
    for (const m of s.matchAll(/(?:^|[\r\n\s])(\d+)\s+(\d+)\s+obj\b/g)) this.xref.set(+m[1], { off: m.index + m[0].indexOf(m[1]), gen: +m[2] });
    if (!this.trailer.Root) { for (const m of s.matchAll(/trailer\s*<</g)) { const lx = new Lexer(this.buf, m.index + 7); const t = parseObj(lx, lx.next()); if (t && t.Root) Object.assign(this.trailer, t); }
      if (!this.trailer.Root) for (const [n] of this.xref) { const o = this.get(new Ref(n, 0)); if (o && isName(o.Type, 'Catalog')) { this.trailer.Root = new Ref(n, 0); break; } }
      if (!this.trailer.Root) for (const [n] of this.xref) { const o = this.get(new Ref(n, 0)); if (o && isName(o.Type, 'XRef') && o.Root) { this.trailer.Root = o.Root; break; } } }
  }
  parseIndirectAt(off) {
    const lx = new Lexer(this.buf, off); const n = lx.next(), g = lx.next(), kw = lx.next(); if (typeof n !== 'number' || !(kw instanceof Op && kw.s === 'obj')) return null;
    const t = lx.next(), v = parseObj(lx, t); const save = lx.p, nx = lx.next();
    if (nx instanceof Op && nx.s === 'stream') { let p = lx.p; if (this.buf[p] === 13) p++; if (this.buf[p] === 10) p++;
      let len = v.Length; if (len instanceof Ref) len = this.get(len); let end = typeof len === 'number' ? p + len : -1;
      if (end < 0 || end > this.buf.length || !/^\s*endstream/.test(this.buf.subarray(end, end + 20).toString('latin1'))) { const e = this.buf.indexOf('endstream', p, 'latin1'); end = e < 0 ? this.buf.length : e; while (end > p && (this.buf[end - 1] === 10 || this.buf[end - 1] === 13)) end--; }
      return { num: n, dict: v, raw: this.buf.subarray(p, end) }; }
    lx.p = save; return { num: n, value: v };
  }
  get(ref, depth = 0) {
    if (!(ref instanceof Ref)) return ref; const key = ref.n; if (this.cache.has(key)) return this.cache.get(key); if (depth > 30) return null;
    const e = this.xref.get(ref.n); let out = null;
    if (e && e.off != null) { const o = this.parseIndirectAt(e.off); if (o) out = o.dict ? Object.assign(Object.create(STREAM), { dict: o.dict, raw: o.raw }) : o.value; }
    else if (e && e.stm != null) { const st = this.get(new Ref(e.stm, 0), depth + 1); if (st && st.raw) { const objs = this.objStm(e.stm, st); out = objs.has(ref.n) ? objs.get(ref.n) : null; } }
    this.cache.set(key, out); return out;
  }
  objStm(num, st) {
    this.osc = this.osc || new Map(); if (this.osc.has(num)) return this.osc.get(num); const m = new Map(); this.osc.set(num, m);
    const data = this.streamData(st), N = st.dict.N || 0, first = st.dict.First || 0, lx = new Lexer(data, 0), pairs = [];
    for (let i = 0; i < N; i++) { const a = lx.next(), b = lx.next(); if (typeof a !== 'number') break; pairs.push([a, b]); }
    for (const [n, o] of pairs) { const l2 = new Lexer(data, first + o); const t = l2.next(); m.set(n, parseObj(l2, t)); }
    return m;
  }
  streamData(st) {
    if (st._data) return st._data; let data = st.raw; const d = st.dict; let f = this.get(d.Filter), parms = this.get(d.DecodeParms);
    const fl = Array.isArray(f) ? f : f ? [f] : [], pl = Array.isArray(parms) ? parms : [parms];
    fl.forEach((x, i) => { const nm = x && x.s, pm = this.get(pl[i]);
      if (nm === 'FlateDecode' || nm === 'Fl') data = unpredict(inflate(data), pm);
      else if (nm === 'ASCIIHexDecode' || nm === 'AHx') data = asciiHex(data);
      else if (nm === 'ASCII85Decode' || nm === 'A85') data = ascii85(data);
      else if (nm) { this.warnings.push('unsupported filter ' + nm); data = Buffer.alloc(0); } });
    Object.defineProperty(st, '_data', { value: data, enumerable: false }); return data;
  }
  pages() {
    const out = [], root = this.get(this.trailer.Root), seen = new Set();
    const walk = (node, inh) => { node = this.get(node); if (!node || seen.has(node)) return; seen.add(node);
      const res = node.Resources !== undefined ? node.Resources : inh.res, mb = node.MediaBox !== undefined ? node.MediaBox : inh.mb;
      if (isName(node.Type, 'Pages') || Array.isArray(node.Kids)) { for (const k of this.get(node.Kids) || []) walk(k, { res, mb }); }
      else out.push({ dict: node, res: this.get(res) || {}, mb: (this.get(mb) || [0, 0, 612, 792]).map(v => this.get(v)) }); };
    if (root) walk(root.Pages, { res: null, mb: null }); return out;
  }
}
const STREAM = { isStream: true };

/* ============================== fonts ============================== */
const WIN = (() => { const t = []; for (let i = 0; i < 256; i++) t[i] = i >= 32 ? String.fromCharCode(i) : ''; const hi = { 128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡', 136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 142: 'Ž', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 158: 'ž', 159: 'Ÿ' }; for (const k in hi) t[k] = hi[k]; t[127] = ''; return t; })();
const WIN_TR = (() => { const t = WIN.slice(); Object.assign(t, { 208: 'Ğ', 221: 'İ', 222: 'Ş', 240: 'ğ', 253: 'ı', 254: 'ş' }); return t; })(); // cp1254 (some Turkish producers mislabel it)
const MAC = (() => { const t = WIN.slice(0, 128); const hi = 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ'; for (let i = 0; i < 128; i++) t[128 + i] = hi[i] || ''; return t; })();
const GLYPH = { space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%', ampersand: '&', quotesingle: "'", quoteright: '’', parenleft: '(', parenright: ')', asterisk: '*', plus: '+', comma: ',', hyphen: '-', period: '.', slash: '/', zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', colon: ':', semicolon: ';', less: '<', equal: '=', greater: '>', question: '?', at: '@', bracketleft: '[', backslash: '\\', bracketright: ']', asciicircum: '^', underscore: '_', grave: '`', quoteleft: '‘', braceleft: '{', bar: '|', braceright: '}', asciitilde: '~',
  Gbreve: 'Ğ', gbreve: 'ğ', Idotaccent: 'İ', Idot: 'İ', dotlessi: 'ı', Scedilla: 'Ş', scedilla: 'ş', Ccedilla: 'Ç', ccedilla: 'ç', Odieresis: 'Ö', odieresis: 'ö', Udieresis: 'Ü', udieresis: 'ü', Euro: '€', endash: '–', emdash: '—', bullet: '•', ellipsis: '…', quotedblleft: '“', quotedblright: '”', quotesinglbase: '‚', quotedblbase: '„', degree: '°', section: '§', registered: '®', copyright: '©', trademark: '™', fi: 'fi', fl: 'fl', nbspace: ' ', uni00A0: ' ', Acircumflex: 'Â', acircumflex: 'â', Icircumflex: 'Î', icircumflex: 'î', Ucircumflex: 'Û', ucircumflex: 'û', Adieresis: 'Ä', adieresis: 'ä', Eacute: 'É', eacute: 'é', minus: '−', multiply: '×', divide: '÷', periodcentered: '·', guillemotleft: '«', guillemotright: '»' };
const glyphChar = n => { if (GLYPH[n] !== undefined) return GLYPH[n]; if (/^[A-Za-z]$/.test(n)) return n; let m = n.match(/^uni([0-9A-F]{4})/i); if (m) return String.fromCharCode(parseInt(m[1], 16)); m = n.match(/^u([0-9A-F]{4,6})$/i); if (m) return String.fromCodePoint(parseInt(m[1], 16)); m = n.match(/^(?:g|cid|c)(\d+)$/); if (m) return null; return null; };
const HELV = (() => { const w = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]; const t = {}; w.forEach((v, i) => t[32 + i] = v); return t; })();

function parseCMap(data) {
  const s = data.toString('latin1'), map = new Map(), space = []; let bytes = 0;
  const hex = h => h.replace(/[<>\s]/g, ''), uni = h => { h = hex(h); let out = ''; for (let i = 0; i + 4 <= h.length; i += 4) out += String.fromCharCode(parseInt(h.slice(i, i + 4), 16)); if (h.length % 4 === 2) out += String.fromCharCode(parseInt(h.slice(-2), 16)); return out; };
  for (const m of s.matchAll(/begincodespacerange([\s\S]*?)endcodespacerange/g)) for (const r of m[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) { space.push({ n: r[1].length / 2, lo: parseInt(r[1], 16), hi: parseInt(r[2], 16) }); bytes = Math.max(bytes, r[1].length / 2); }
  for (const m of s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const r of m[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) { map.set(parseInt(r[1], 16), uni(r[2])); if (!bytes) bytes = r[1].length / 2; }
  for (const m of s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) for (const r of m[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g)) { const lo = parseInt(r[1], 16), hi = parseInt(r[2], 16); if (!bytes) bytes = r[1].length / 2; if (hi - lo > 65535) continue;
    if (r[3][0] === '[') { const arr = [...r[3].matchAll(/<([0-9a-fA-F]*)>/g)].map(x => uni(x[1])); for (let c = lo; c <= hi; c++) if (arr[c - lo] !== undefined) map.set(c, arr[c - lo]); }
    else { const base = hex(r[3]), last = parseInt(base.slice(-4) || '0', 16), pre = uni(base.slice(0, -4)); for (let c = lo; c <= hi; c++) map.set(c, pre + String.fromCharCode(last + c - lo)); } }
  return { map, space, bytes: bytes || 1 };
}
class Font {
  constructor(doc, dict) {
    dict = doc.get(dict) || {}; this.sub = dict.Subtype && dict.Subtype.s; this.base = (dict.BaseFont && dict.BaseFont.s) || ''; this.type0 = this.sub === 'Type0'; this.widths = new Map(); this.dw = 1000; this.fm = [0.001, 0, 0, 0.001, 0, 0]; this.vertical = false;
    const tu = doc.get(dict.ToUnicode); if (tu && tu.isStream) { try { this.cmap = parseCMap(doc.streamData(tu)); } catch (e) { } }
    if (this.type0) { const enc = doc.get(dict.Encoding); this.encName = enc instanceof Name ? enc.s : 'embedded'; this.vertical = /-V$/.test(this.encName);
      if (enc && enc.isStream) { const c = parseCMap(doc.streamData(enc)); this.codespace = c.space; }
      const desc = doc.get((doc.get(dict.DescendantFonts) || [])[0]) || {}; this.dw = typeof desc.DW === 'number' ? desc.DW : 1000; const W = doc.get(desc.W) || [];
      for (let i = 0; i < W.length;) { const a = doc.get(W[i]), b = doc.get(W[i + 1]); if (Array.isArray(b)) { b.forEach((w, k) => this.widths.set(a + k, doc.get(w))); i += 2; } else { const w = doc.get(W[i + 2]); for (let c = a; c <= b; c++) this.widths.set(c, w); i += 3; } } }
    else { const enc = doc.get(dict.Encoding); let table = WIN; const base = enc instanceof Name ? enc.s : enc && enc.BaseEncoding ? enc.BaseEncoding.s : null;
      if (base === 'MacRomanEncoding') table = MAC; else if (base === 'WinAnsiEncoding') table = WIN; else if (!base && /Symbol|Dingbat/i.test(this.base)) table = WIN;
      this.enc = table.slice(); if (enc && enc.Differences) { let code = 0; for (const x of doc.get(enc.Differences)) { const v = doc.get(x); if (typeof v === 'number') code = v; else if (v instanceof Name) { const ch = glyphChar(v.s); if (ch !== null) this.enc[code] = ch; code++; } } }
      const fc = doc.get(dict.FirstChar) || 0, ws = doc.get(dict.Widths); if (Array.isArray(ws)) ws.forEach((w, i) => this.widths.set(fc + i, doc.get(w)));
      if (this.sub === 'Type3') { const fm = doc.get(dict.FontMatrix); if (Array.isArray(fm)) this.fm = fm; }
      this.std = !ws ? (/Courier/i.test(this.base) ? 'mono' : /Helvetica|Arial/i.test(this.base) ? 'helv' : 'serif') : null; }
  }
  // split a string operand into [code, unicode, width-in-text-space-units(1/1000 em), isSpace]
  decode(bytes) {
    const out = [];
    if (this.type0) { const cs = this.codespace;
      for (let i = 0; i < bytes.length;) { let n = 2; if (cs && cs.length) { n = 0; for (let k = 1; k <= 4 && !n; k++) { let v = 0; for (let j = 0; j < k && i + j < bytes.length; j++) v = v * 256 + bytes[i + j]; if (cs.some(r => r.n === k && v >= r.lo && v <= r.hi)) n = k; } n = n || 2; } else if (this.cmap && this.cmap.bytes === 1 && !/Identity/.test(this.encName || '')) n = 1;
        let code = 0; for (let j = 0; j < n; j++) code = code * 256 + (bytes[i + j] || 0); i += n;
        const u = this.cmap && this.cmap.map.has(code) ? this.cmap.map.get(code) : (code >= 32 && code < 0xd800 && !this.cmap ? String.fromCharCode(code) : '');
        out.push([code, u, this.widths.has(code) ? this.widths.get(code) : this.dw, n === 1 && code === 32]); }
      return out; }
    const cb = this.cmap && this.cmap.bytes === 2 ? 2 : 1;
    for (let i = 0; i < bytes.length; i += cb) { const code = cb === 2 ? bytes[i] * 256 + (bytes[i + 1] || 0) : bytes[i];
      let u = this.cmap && this.cmap.map.has(code) ? this.cmap.map.get(code) : (this.enc ? this.enc[code] : String.fromCharCode(code)); if (u === undefined) u = '';
      let w = this.widths.get(code); if (w === undefined) w = this.std === 'mono' ? 600 : this.std === 'helv' ? (HELV[code] || 556) : this.std === 'serif' ? (code === 32 ? 250 : 500) : (code === 32 ? 278 : 500);
      if (this.sub === 'Type3') w = w * this.fm[0] * 1000;
      out.push([code, u, w, cb === 1 && code === 32]); }
    return out;
  }
}

/* ============================== content interpretation ============================== */
const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
function runContent(doc, data, res, ctm0, items, depth = 0, fontCache = new Map()) {
  if (depth > 8) return; res = doc.get(res) || {}; const fonts = doc.get(res.Font) || {}, xobj = doc.get(res.XObject) || {};
  const getFont = n => { const ref = fonts[n]; const key = ref instanceof Ref ? 'r' + ref.n : n + '@' + depth; if (!fontCache.has(key)) { try { fontCache.set(key, new Font(doc, ref)); } catch (e) { fontCache.set(key, null); } } return fontCache.get(key); };
  const lx = new Lexer(data, 0); let st = { ctm: ctm0, font: null, size: 0, tc: 0, tw: 0, tz: 1, tl: 0, rise: 0 }; const stack = []; let tm = [1, 0, 0, 1, 0, 0], tlm = tm, args = [];
  const show = (bytes) => { const f = st.font; if (!f || !bytes) return; const glyphs = f.decode(bytes);
    for (const [code, u, w, sp] of glyphs) { const trm = mul([st.size * st.tz, 0, 0, st.size, 0, st.rise], mul(tm, st.ctm)); const fsz = Math.hypot(trm[2], trm[3]) || st.size;
      const tx = (w / 1000 * st.size + st.tc + (sp ? st.tw : 0)) * st.tz; items.push({ x: trm[4], y: trm[5], s: u, w: tx * Math.hypot(st.ctm[0], st.ctm[1]) * Math.hypot(tm[0], tm[1]), size: fsz, f: f.base });
      tm = mul([1, 0, 0, 1, tx, 0], tm); } };
  for (;;) { const t = lx.next(); if (t === null) break;
    if (!(t instanceof Op)) { args.push(parseObj(lx, t, true)); continue; }
    const op = t.s, a = args; args = [];
    switch (op) {
      case 'q': stack.push({ ...st }); break; case 'Q': if (stack.length) st = stack.pop(); break;
      case 'cm': if (a.length >= 6) st.ctm = mul(a.slice(-6), st.ctm); break;
      case 'BT': tm = tlm = [1, 0, 0, 1, 0, 0]; break;
      case 'Tf': st.font = getFont(a[0] && a[0].s); st.size = +a[1] || 0; break;
      case 'Tc': st.tc = +a[0] || 0; break; case 'Tw': st.tw = +a[0] || 0; break; case 'Tz': st.tz = (+a[0] || 100) / 100; break; case 'TL': st.tl = +a[0] || 0; break; case 'Ts': st.rise = +a[0] || 0; break;
      case 'Td': tlm = mul([1, 0, 0, 1, +a[0] || 0, +a[1] || 0], tlm); tm = tlm; break;
      case 'TD': st.tl = -(+a[1] || 0); tlm = mul([1, 0, 0, 1, +a[0] || 0, +a[1] || 0], tlm); tm = tlm; break;
      case 'Tm': if (a.length >= 6) tm = tlm = a.slice(-6).map(Number); break;
      case 'T*': tlm = mul([1, 0, 0, 1, 0, -st.tl], tlm); tm = tlm; break;
      case 'Tj': show(a[0]); break;
      case "'": tlm = mul([1, 0, 0, 1, 0, -st.tl], tlm); tm = tlm; show(a[0]); break;
      case '"': st.tw = +a[0] || 0; st.tc = +a[1] || 0; tlm = mul([1, 0, 0, 1, 0, -st.tl], tlm); tm = tlm; show(a[2]); break;
      case 'TJ': for (const e of a[0] || []) { if (typeof e === 'number') { const tx = -e / 1000 * st.size * st.tz; if (e < -180 && items.length) items.push({ x: mul(tm, st.ctm)[4], y: mul(tm, st.ctm)[5], s: '', w: 0, gap: true, size: st.size }); tm = mul([1, 0, 0, 1, tx, 0], tm); } else show(e); } break;
      case 'Do': { const xo = doc.get(xobj[a[0] && a[0].s]); if (xo && xo.isStream && isName(xo.dict.Subtype, 'Form')) { const mtx = Array.isArray(xo.dict.Matrix) ? xo.dict.Matrix.map(Number) : [1, 0, 0, 1, 0, 0]; runContent(doc, doc.streamData(xo), xo.dict.Resources || res, mul(mtx, st.ctm), items, depth + 1, fontCache); } break; }
      case 'BI': { const i = data.indexOf('EI', lx.p, 'latin1'); let j = i; while (j >= 0 && !(WS.has(data[j - 1]) && (j + 2 >= data.length || WS.has(data[j + 2])))) j = data.indexOf('EI', j + 2, 'latin1'); lx.p = j < 0 ? data.length : j + 2; break; }
      default: break; }
  }
}

// group glyphs into words/runs, then lines by baseline
function buildLines(items) {
  const runs = []; let cur = null;
  for (const g of items) {
    if (g.gap) { if (cur) cur.brk = true; continue; }
    if (!g.s) continue;
    const join = cur && !cur.brk && Math.abs(g.y - cur.y) < Math.max(1, cur.size * 0.3) && g.x >= cur.x1 - cur.size * 0.5 && g.x - cur.x1 < cur.size * 0.35;
    if (join) { cur.s += g.s; cur.x1 = g.x + g.w; }
    else { cur = { x: g.x, y: g.y, x1: g.x + g.w, s: g.s, size: g.size, f: g.f }; runs.push(cur); }
  }
  // split runs on whitespace into words while keeping x estimates (proportional) — keeps multi-word cells together if close
  const lines = [];
  for (const r of runs.sort((a, b) => b.y - a.y || a.x - b.x)) { const s = r.s.replace(/\s+$/, ''); if (!s.trim()) continue; const lead = s.length - s.trimStart().length; const rr = { x: r.x + (r.x1 - r.x) * (lead / Math.max(1, r.s.length)), x1: r.x1, y: r.y, s: s.trim(), size: r.size };
    let L = lines.find(l => Math.abs(l.y - rr.y) <= Math.max(1.5, Math.min(l.size, rr.size) * 0.35)); if (!L) { L = { y: rr.y, size: rr.size, items: [] }; lines.push(L); } L.items.push(rr); }
  for (const L of lines) { L.items.sort((a, b) => a.x - b.x); let t = ''; let px = null; for (const it of L.items) { if (px !== null) t += it.x - px > L.size * 1.5 ? '   ' : ' '; t += it.s; px = it.x1; } L.text = t; L.x = L.items[0].x; }
  return lines.sort((a, b) => b.y - a.y);
}

export function pdfExtract(buf) {
  const doc = new PDFDoc(buf), pages = [];
  for (const pg of doc.pages()) { const items = []; let contents = doc.get(pg.dict.Contents); if (!Array.isArray(contents)) contents = contents ? [contents] : [];
    const data = Buffer.concat(contents.map(c => { const s = doc.get(c); return s && s.isStream ? Buffer.concat([doc.streamData(s), Buffer.from('\n')]) : Buffer.alloc(0); }));
    const mb = pg.mb; try { runContent(doc, data, pg.res, [1, 0, 0, 1, -(mb[0] || 0), -(mb[1] || 0)], items); } catch (e) { doc.warnings.push('page content: ' + e.message); }
    pages.push({ width: (mb[2] || 0) - (mb[0] || 0), height: (mb[3] || 0) - (mb[1] || 0), lines: buildLines(items) }); }
  const text = pages.map(p => p.lines.map(l => l.text).join('\n')).join('\n\f\n');
  return { pages, text, warnings: doc.warnings, encrypted: !!doc.trailer.Encrypt };
}
export function pdfText(buf) { try { return pdfExtract(buf).text; } catch (e) { return ''; } }

/* ============================== numbers, dates, privacy ============================== */
// Turkish number: "1.232,10" → 1232.1; "8,68" → 8.68; "80,000" → 80; "1,234.50" (English) → 1234.5; "1.000" with hint 'tr' → 1000
export function trNum(s, hint = 'tr') {
  if (typeof s === 'number') return s; if (s == null) return null; let t = String(s).trim().replace(/[\s ₺$€]|TL|TRY|USD/gi, ''); if (!t) return null;
  let neg = false; if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); } if (/^-/.test(t)) { neg = true; t = t.slice(1); } if (/-$/.test(t)) { neg = true; t = t.slice(0, -1); }
  if (!/^[\d.,]+$/.test(t)) return null;
  const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.'); let v;
  if (lc >= 0 && ld >= 0) v = lc > ld ? +t.replace(/\./g, '').replace(',', '.') : +t.replace(/,/g, '');
  else if (lc >= 0) v = (t.match(/,/g).length > 1) ? +t.replace(/,/g, '') : hint === 'en' && /^\d{1,3}(,\d{3})+$/.test(t) ? +t.replace(/,/g, '') : +t.replace(',', '.');
  else if (ld >= 0) v = (t.match(/\./g).length > 1) ? +t.replace(/\./g, '') : hint === 'tr' && /^\d{1,3}\.\d{3}$/.test(t) ? +t.replace('.', '') : +t;
  else v = +t;
  return Number.isFinite(v) ? (neg ? -v : v) : null;
}
export const trDate = s => { const iso = String(s || '').match(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/); if (iso) return iso[0]; const m = String(s || '').match(/(?<!\d)(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?!\d)/); if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; } const m2 = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m2 ? m2[0] : null; };
export const maskAccount = a => { const s = String(a || '').replace(/\D/g, ''); if (!s) return null; return s.length <= 4 ? '*'.repeat(s.length) : '*'.repeat(Math.max(3, s.length - 4)) + s.slice(-4); };
// remove 11-digit TC kimlik / 10-digit VKN and masked versions from any text we pass on
export const scrubIds = (s, keep = []) => String(s || '').replace(/\b\d{2}\*{3,}\d{2}\b/g, '[id]').replace(/\b[1-9]\d{10}\b/g, m => !keep.includes(m) && tcValid(m) ? '[id]' : m);
export function tcValid(s) { if (!/^[1-9]\d{10}$/.test(s)) return false; const d = s.split('').map(Number); const o = d[0] + d[2] + d[4] + d[6] + d[8], e = d[1] + d[3] + d[5] + d[7]; if (((o * 7 - e) % 10 + 10) % 10 !== d[9]) return false; return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]; }
const SIDE = s => { const t = String(s || '').toLocaleUpperCase('tr').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/I/g, 'I'); if (/\b(ALIS|ALIM|BUY|BOUGHT|B)\b/.test(t)) return 'BUY'; if (/\b(SATIS|SATIM|SELL|SOLD|S)\b/.test(t)) return 'SELL'; return null; };
const fold = s => String(s || '').toLocaleUpperCase('tr').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O');
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// quantity cross-check: the document's quantity may use Turkish 3-decimal formatting ("80,000" = 80 shares)
// find quantity × price = amount among a row's numbers (in column order), whatever columns sit around them: the latest such
// triple wins (realised quantity / average price / trade amount come after the order columns); a small number between price and
// amount is the fee. Returns null when no triple matches.
export function pickTriple(v) { let best = null; for (let k = v.length - 1; k >= 2 && !best; k--) for (let j = k - 1; j >= 1 && !best; j--) for (let i = j - 1; i >= 0; i--) { const q = v[i], p = v[j], a = v[k]; if (q > 0 && p > 0 && a > 0 && Math.abs(q * p - a) <= Math.max(0.02, a * 0.003)) { best = { qty: q, price: p, amount: a, i, j, k }; break; } }
  if (!best) return null; const mid = v.slice(best.j + 1, best.k).filter(x => x > 0 && x < best.amount * 0.05); const after = v[best.k + 1]; best.commission = mid.length ? mid[mid.length - 1] : after > 0 && after < best.amount * 0.05 ? after : 0; return best; }
function reconcile(t, warnings) {
  const { price, amount } = t; let q = t.qty;
  if (price > 0 && amount > 0) { const implied = amount / price;
    if (!(q > 0) || Math.abs(q * price - amount) > Math.max(0.02, amount * 0.002)) { const frac = t.ccy === 'USD' || t.venue === 'US' || (q > 0 && q < 1); const alt = [q * 1000, q / 1000, ...(frac ? [] : [Math.round(implied)])].find(v => v > 0 && Math.abs(v * price - amount) <= Math.max(0.02, amount * 0.002));
      if (alt) { if (q > 0 && alt !== q) warnings.push(`${t.symbol}: quantity read as ${q}, corrected to ${alt} from amount ÷ price`); q = alt; }
      else if (!(q > 0)) q = round(implied, 4); else warnings.push(`${t.symbol}: quantity ${q} × price ${price} ≠ amount ${amount}`); } }
  t.qty = q; return t;
}

/* ============================== Ak Yatırım "İŞLEM SONUÇ FORMU" ============================== */
const linesOf = input => typeof input === 'string' ? input.split(/\n/).map(text => ({ text, items: null })) : Array.isArray(input) ? input : (input.pages || []).flatMap(p => p.lines);
export function isAkYatirim(text) { const t = fold(text); return /AK\s*YATIRIM/.test(t) || (/ISLEM\s*SONUC\s*FORMU/.test(t) && /AKYATIRIM|TRADEALL/i.test(t)); }
export function parseAkYatirim(input) {
  const lines = linesOf(input), text = lines.map(l => l.text).join('\n'), warnings = [], trades = [];
  const ftext = fold(text);
  const docNo = (ftext.match(/BELGE\s*SIRA\s*NO\s*:?\s*(\d{6,})/) || text.match(/\b(\d{11})\b(?=[\s\S]{0,40}$)/m) || [])[1] || (lines.map(l => l.text).find(t => /^\s*\d{11}\s*$/.test(t)) || '').trim() || null;
  const acct = (ftext.match(/MUSTERI\s*HESAP\s*NO\s*:?\s*(\d{4,})/) || [])[1] || null;
  let date = (ftext.match(/ISLEM\s*TARIHI\s*:?\s*(\d{2}\.\d{2}\.\d{4})/) || [])[1] || null;
  // table rows: date, value date, instrument type, "CODE-NAME", venue, side, qty, price, amount, commission
  const tail = String.raw`\s+(ALI[SŞ]|SATI[SŞ]|ALIM|SATIM)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)`, head = String.raw`(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([A-Z0-9]{3,6})-`;
  const rowRe = new RegExp(head + String.raw`(.*)\s+(BORSA\s+[İI]STANBUL|BIST|TEFAS|V[İI]OP|YURT\s?DI[ŞS]I|PP|GYP|ANA PAZAR|YILDIZ PAZAR)` + tail), rowRe2 = new RegExp(head + String.raw`([^\n]*?)\s+([A-ZÇĞİÖŞÜ ]+?)` + tail);
  for (const l of lines) {
    const flat = l.text.replace(/\s+/g, ' '); let m = flat.match(rowRe) || flat.match(rowRe2), row = null;
    if (m) row = { date: trDate(m[1]), valueDate: trDate(m[2]), type: m[3].trim(), symbol: m[4], name: m[5].trim(), venue: m[6].trim(), side: SIDE(m[7]), q: m[8], p: m[9], a: m[10], c: m[11] };
    else if (l.items && l.items.length >= 8) { // column fallback by x position
      const its = l.items.map(i => i.s), dates = its.filter(s => /^\d{2}\.\d{2}\.\d{4}$/.test(s)), code = its.find(s => /^[A-Z0-9]{3,6}-/.test(s)), sideS = its.find(s => SIDE(s)), nums = its.filter(s => /^[\d.,]+$/.test(s) && !/^\d{2}\.\d{2}\.\d{4}$/.test(s));
      if (dates.length >= 1 && code && sideS && nums.length >= 4) { const n = nums.slice(-4); row = { date: trDate(dates[0]), valueDate: trDate(dates[1] || dates[0]), symbol: code.split('-')[0], name: code.split('-').slice(1).join('-'), venue: its.find(s => /BORSA|BIST/i.test(s)) || '', side: SIDE(sideS), q: n[0], p: n[1], a: n[2], c: n[3] }; } }
    if (!row || !row.side) continue;
    const t = { date: row.date, valueDate: row.valueDate, symbol: row.symbol, name: row.name, venue: /BORSA\s+[İI]STANBUL/i.test(row.venue) ? 'BORSA İSTANBUL' : row.venue, side: row.side, qty: trNum(row.q, 'tr'), price: trNum(row.p, 'tr'), amount: trNum(row.a, 'tr'), commission: trNum(row.c, 'tr') };
    trades.push(reconcile(t, warnings));
  }
  if (!date && trades.length) date = trades[0].date; else date = trDate(date);
  if (!trades.length) warnings.push('no trade rows were recognised in the Ak Yatırım form');
  const tot = trades.reduce((a, t) => a + t.amount, 0), totLine = ftext.match(/TOPLAM[^\d\n]*([\d.,]+)/);
  if (totLine) { const v = trNum(totLine[1]); if (v && Math.abs(v - tot) > 0.05 && Math.abs(v - tot - trades.reduce((a, t) => a + (t.commission || 0), 0)) > 0.05) warnings.push(`total on the form (${v}) differs from the sum of rows (${round(tot)})`); }
  return { broker: 'Ak Yatırım', kind: 'confirmation', docNo, date, account: maskAccount(acct), trades, warnings };
}

/* ============================== Midas ============================== */
function splitCSV(text) {
  const first = text.split(/\r?\n/).find(l => l.trim()) || '', sep = [';', '\t', ','].map(c => [c, (first.match(new RegExp(c === '\t' ? '\t' : '\\' + c, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim())) rows.push(row); row = []; } else cell += c; }
  row.push(cell); if (row.some(x => x.trim())) rows.push(row); return { rows, sep };
}
const HEAD = { date: /^(TARIH|ISLEM TARIHI|DATE|TRADE DATE|EXECUTION DATE|TIME|ZAMAN)$/, symbol: /^(SEMBOL|HISSE|KOD|ENSTRUMAN|SYMBOL|TICKER|INSTRUMENT)$/, side: /^(ISLEM|ISLEM TIPI|YON|TIP|TYPE|SIDE|ACTION|TRANSACTION|DIRECTION)$/, qty: /^(ADET|MIKTAR|LOT|QUANTITY|QTY|SHARES|UNITS)$/, price: /^(FIYAT|ORTALAMA FIYAT|GERCEKLESEN FIYAT|PRICE|AVG PRICE|AVERAGE PRICE|FILL PRICE)$/, amount: /^(TUTAR|ISLEM TUTARI|TOPLAM|AMOUNT|TOTAL|VALUE|NET AMOUNT)$/, commission: /^(KOMISYON|KOMISYON TUTARI|UCRET|COMMISSION|FEE|FEES)$/, ccy: /^(PARA BIRIMI|DOVIZ|CURRENCY|CCY)$/ };
export function parseMidasCSV(text) {
  const warnings = [], trades = []; const { rows } = splitCSV(String(text).replace(/^﻿/, '')); if (!rows.length) return { broker: 'Midas', kind: 'csv', docNo: null, date: null, account: null, trades, warnings: ['empty file'] };
  let hi = rows.findIndex(r => r.filter(c => Object.values(HEAD).some(re => re.test(fold(c).trim()))).length >= 3); if (hi < 0) { warnings.push('no header row with Tarih/Sembol/İşlem/Adet/Fiyat (or Date/Symbol/Side/Quantity/Price)'); return { broker: 'Midas', kind: 'csv', docNo: null, date: null, account: null, trades, warnings }; }
  const head = rows[hi].map(c => fold(c).trim()), col = {}; for (const [k, re] of Object.entries(HEAD)) col[k] = head.findIndex(h => re.test(h));
  const enHeaders = head.some(h => /^(DATE|SYMBOL|QUANTITY|PRICE)$/.test(h)), sample = rows.slice(hi + 1, hi + 20).map(r => r[col.price] || '').join(' '), hint = /\d,\d{2}\b/.test(sample) && !/\d\.\d{2}\b(?!\d)/.test(sample.replace(/\d{1,3}(\.\d{3})+,/g, '')) ? 'tr' : enHeaders ? 'en' : 'tr';
  for (const r of rows.slice(hi + 1)) { const g = k => col[k] >= 0 ? (r[col[k]] || '').trim() : ''; const sym = g('symbol').toUpperCase().replace(/\.IS$|\s.*$/, ''), side = SIDE(g('side'));
    if (!sym || !side) continue; const qty = trNum(g('qty'), hint), price = trNum(g('price'), hint); let amount = trNum(g('amount'), hint); if (!(amount > 0) && qty > 0 && price > 0) amount = round(qty * price, 4);
    const t = { date: trDate(g('date')) || (g('date').match(/\d{4}-\d{2}-\d{2}/) || [null])[0], valueDate: null, symbol: sym, name: '', venue: (g('ccy') || '').toUpperCase() === 'USD' ? 'US' : '', side, qty, price, amount: amount != null ? Math.abs(amount) : null, commission: Math.abs(trNum(g('commission'), hint) || 0), ccy: g('ccy') ? g('ccy').toUpperCase().replace('TL', 'TRY') : null };
    if (!(t.price > 0)) { warnings.push(`${sym}: no price`); continue; }
    trades.push(reconcile(t, warnings)); }
  const dates = trades.map(t => t.date).filter(Boolean).sort();
  return { broker: 'Midas', kind: 'csv', docNo: null, date: dates[dates.length - 1] || null, account: null, trades, warnings };
}
export function isMidas(text) { return /midas/i.test(text) || (/YATIRIM\s+[İI]ŞLEMLER[İI]/i.test(text) && /Gerçekleşen\s+Adet|Ortalama\s+[İI]şlem\s+Fiyat/i.test(text)); }
const SIDE_RE = '(Alış|Alis|ALIŞ|ALIS|Alım|Satış|Satis|SATIŞ|SATIS|Satım|Buy|BUY|Sell|SELL)';
function midasRow(s, warnings) { // one statement row → trade, or null (cancelled / pending / not a trade)
  const m = s.match(new RegExp('(\\d{2}[./]\\d{2}[./](?:\\d{4}|\\d{2}))(?!\\d)(?:\\s+\\d{2}:\\d{2}(?::\\d{2})?)?\\s+(?:.*?\\s)?([A-Z][A-Z0-9.]{0,9})\\s+' + SIDE_RE + '(?=\\s|$)(.*)$'));
  if (!m || /D[oö]viz/i.test(s.slice(0, m.index + m[0].length - m[4].length))) return null;
  const rest = m[4].split(/\b(?:HESAP|YATIRIM|PORTF[ÖO]Y|TEMETT[ÜU]|Talep\s+Tarihi|Tarih\s+[İI]şlem)\b/i)[0].replace(/\d{2}[./]\d{2}[./]\d{2,4}|\d{2}:\d{2}(:\d{2})?/g, ' '), status = (rest.match(/^\s*(Gerçekleşti|Gerceklesti|Kısmi[^\d]*|Kismi[^\d]*|İptal[^\d]*|Iptal[^\d]*|Beklemede|Bekliyor|Reddedildi|Filled|Cancelled|Canceled|Pending|Rejected)/i) || [])[1] || '';
  if (/[iİI]ptal|[bB]ekle|[rR]edd|cancel|pending|reject/i.test(status)) return null;
  const usd = /\$|USD/.test(s), turkish = /Gerçekleş|Gerceklest|Alış|Satış|Emri/i.test(s), hint = turkish ? 'tr' : usd ? 'en' : 'tr';
  const nums = [...rest.matchAll(/(?<![\w.,])(\d[\d.,]*)(?![\w])/g)].map(x => trNum(x[1], hint)).filter(v => v !== null);
  const tr = pickTriple(nums); if (!tr) { if (nums.some(v => v > 0)) warnings.push(`${m[2]} ${m[1]}: quantity × price does not match any amount on the row — skipped, enter it by hand`); return null; }
  if (!(tr.qty > 0)) return null;
  return reconcile({ date: trDate(m[1]), valueDate: null, symbol: m[2].replace(/\.IS$/, ''), name: '', venue: usd ? 'US' : '', side: SIDE(m[3]), qty: tr.qty, price: tr.price, amount: tr.amount, commission: tr.commission, ccy: usd ? 'USD' : null }, warnings); }
export function parseMidasPDF(input) { // Midas statements: "03/11/26 09:47:08  Limit Emri  NVDA  Alış  Gerçekleşti  USD  0,2369  -  0,2369  202,88  1,50  48,07"; older exports "date symbol side qty price amount [fee]"
  const lines = linesOf(input), warnings = [], trades = [], fx = [], positions = [];
  for (const l of lines) { const t = midasRow(l.text.replace(/\s+/g, ' '), warnings); if (t) trades.push(t); }
  const all = lines.map(l => l.text).join(' ').replace(/\s+/g, ' ');
  // the PDF can split a table row over several text lines: cut the whole text at every "date time" and read each piece
  if (!trades.length) { const cuts = [...all.matchAll(/\d{2}[./]\d{2}[./](?:\d{4}|\d{2})\s+\d{2}:\d{2}(?::\d{2})?/g)].map(x => x.index); for (let i = 0; i < cuts.length; i++) { const t = midasRow(all.slice(cuts[i], cuts[i + 1] ?? all.length), warnings); if (t) trades.push(t); } }
  // account rows: "Döviz Alış · 50,43 USD/TRY kurundan 49,57 dolar alış" → the rate the dollars for the purchases were bought at
  for (const m of all.matchAll(/D[oö]viz\s+(Alış|Satış|Alis|Satis)\s+([\d.,]+)\s*USD\/TRY\s+kurundan\s+([\d.,]+)\s*dolar/gi)) { const before = all.slice(Math.max(0, m.index - 60), m.index), ds = [...before.matchAll(/(\d{2}[./]\d{2}[./](?:\d{4}|\d{2}))(?!\d)/g)], rate = trNum(m[2], 'tr'), usd = trNum(m[3], 'tr'); // the date written just before the row (its own transaction date)
    if (ds.length && rate > 0 && usd > 0) fx.push({ date: trDate(ds[ds.length - 1][1]), side: /Sat/i.test(m[1]) ? 'SELL' : 'BUY', rate, usd, try: Math.round(rate * usd * 100) / 100 }); }
  // portfolio summary: "NVDA - NVIDIA 0,236938091 202,88 USD …" → holdings at the statement date, used as a cross-check
  const ps = all.match(/PORTF[ÖO]Y\s+[ÖO]ZET[İI]([^]*?)(YATIRIM\s+[İI]ŞLEMLER[İI]|HESAP\s+[İI]ŞLEMLER[İI]|TEMETT[ÜU]|$)/i);
  if (ps) for (const m of ps[1].matchAll(/\b([A-Z][A-Z0-9.]{0,9})\s+-\s+[^\d]{1,60}?\s(\d[\d.,]*)\s+(\d[\d.,]*)\s*(USD|TL|TRY)/g)) positions.push({ symbol: m[1], qty: trNum(m[2], 'tr'), avgCost: trNum(m[3], 'tr'), ccy: m[4] === 'USD' ? 'USD' : 'TRY' });
  for (const p of positions) { const net = trades.filter(t => t.symbol === p.symbol).reduce((a, t) => a + (t.side === 'SELL' ? -t.qty : t.qty), 0); if (net && Math.abs(net - p.qty) > Math.max(1e-6, p.qty * 1e-4)) warnings.push(`${p.symbol}: trades in this statement add up to ${round(net, 6)}, the portfolio summary shows ${p.qty} — earlier trades are outside the statement period`); if (!net) warnings.push(`${p.symbol}: held (${p.qty} @ ${p.avgCost} ${p.ccy}) but bought before this statement — add it by hand with its own date`); }
  if (fx.length) warnings.push(`currency bought: ${fx.map(f => `${f.usd} USD at ${f.rate} on ${f.date}`).join(', ')} — US purchases of those days are costed at that rate`);
  if (!trades.length) warnings.push('no trade rows recognised in the Midas statement — use the CSV export instead');
  const dates = trades.map(t => t.date).filter(Boolean).sort();
  return { broker: 'Midas', kind: 'statement', docNo: null, date: dates[dates.length - 1] || null, account: null, trades, warnings, fx, positions };
}

/* ============================== generic fallback ============================== */
export function parseGeneric(input, known) {
  const lines = linesOf(input), warnings = [], trades = []; let lastDate = null;
  for (const l of lines) { const s = l.text.replace(/\s+/g, ' '); const d = trDate(s); if (d) lastDate = d;
    const fs_ = fold(s), sm = fs_.length === s.length ? fs_.match(/(?<![A-Z0-9])(ALIS|ALIM|SATIS|SATIM|BUY|SELL)(?![A-Z0-9])/) : null; if (!sm) continue;
    const syms = [...s.matchAll(/\b([A-Z][A-Z0-9]{2,5})(?=[\s-]|$)/g)].map(x => x[1]).filter(x => !/^(ALIS|ALIM|SATIS|SATIM|BUY|SELL|BORSA|BIST|TRY|USD|EUR|HISSE|SENEDI|TL|ISTANBUL)$/.test(fold(x)));
    const sym = (known ? syms.find(x => known(x)) : null) || syms[0]; if (!sym) continue;
    const after = s.slice(sm.index + sm[0].length), nums = [...after.matchAll(/(?<![\d.])(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)(?![\d.]*\.\d{4})/g)].map(x => x[1]).filter(x => !/^\d{2}\.\d{2}$/.test(x));
    if (nums.length < 2) continue; const v = nums.map(x => trNum(x, 'tr')), tr = pickTriple(v);
    const t = tr ? { date: d || lastDate, valueDate: null, symbol: sym, name: '', venue: /BORSA|BIST/i.test(s) ? 'BORSA İSTANBUL' : /USD|\$/.test(s) ? 'US' : '', side: SIDE(sm[1]), qty: tr.qty, price: tr.price, amount: tr.amount, commission: tr.commission, ccy: /USD|\$/.test(s) ? 'USD' : undefined } : { date: d || lastDate, valueDate: null, symbol: sym, name: '', venue: /BORSA|BIST/i.test(s) ? 'BORSA İSTANBUL' : '', side: SIDE(sm[1]), qty: v[0], price: v[1], amount: v[2] != null ? v[2] : round(v[0] * v[1], 2), commission: v[3] || 0 };
    trades.push(reconcile(t, warnings)); }
  if (!trades.length) warnings.push('no rows with a ticker, a side (ALIŞ/SATIŞ/BUY/SELL) and numbers were found');
  return { broker: 'Unknown broker', kind: 'generic', docNo: null, date: trades.map(t => t.date).filter(Boolean).sort().pop() || null, account: null, trades, warnings };
}

/* ============================== entry point ============================== */
export function sniff(buf, name = '', mime = '') { const head = buf.subarray(0, 1024).toString('latin1'); if (head.includes('%PDF')) return 'pdf'; if (/csv|text\/plain/i.test(mime) || /\.(csv|txt|tsv)$/i.test(name)) return 'csv'; if (/^[\x09\x0a\x0d\x20-\x7e -￿]*$/.test(buf.subarray(0, 512).toString('utf8'))) return 'csv'; return 'unknown'; }
export function signature(t) { return [t.date, t.symbol, t.side, round(+t.qty || 0, 4), round(+t.price || 0, 4), round(+t.amount || 0, 2)].join('|'); }
export function parseStatement(buf, { name = '', mime = '', known } = {}) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf); const kind = sniff(buf, name, mime); let res;
  if (kind === 'pdf') { let ex; try { ex = pdfExtract(buf); } catch (e) { return { broker: null, kind: 'pdf', trades: [], warnings: ['could not read the PDF: ' + e.message], docNo: null, date: null, account: null }; }
    if (ex.encrypted) return { broker: null, kind: 'pdf', trades: [], warnings: ['the PDF is encrypted (password-protected); export it again without a password'], docNo: null, date: null, account: null };
    if (!ex.text.trim()) return { broker: null, kind: 'pdf', trades: [], warnings: ['no text in the PDF (scanned image?)', ...ex.warnings], docNo: null, date: null, account: null };
    res = isAkYatirim(ex.text) ? parseAkYatirim(ex) : isMidas(ex.text) ? parseMidasPDF(ex) : null;
    if (!res || !res.trades.length) { const g = parseGeneric(ex, known); if (!res || g.trades.length) { if (res) g.warnings.unshift(...res.warnings); g.broker = res ? res.broker : g.broker; g.docNo = res ? res.docNo : null; res = g; } }
    res.warnings.push(...ex.warnings); res.pages = ex.pages.length; }
  else if (kind === 'csv') { let text = buf.toString('utf8'); if (/�/.test(text)) text = buf.toString('latin1'); res = parseMidasCSV(text); if (!res.trades.length && isMidas(text)) { const st = parseMidasPDF(text); if (st.trades.length) res = st; } if (!res.trades.length) { const g = parseGeneric(text, known); if (g.trades.length) res = g; } }
  else return { broker: null, kind, trades: [], warnings: ['unsupported file type — use a PDF confirmation or a CSV export'], docNo: null, date: null, account: null };
  const keep = res.docNo ? [String(res.docNo)] : [];
  res.file = name ? scrubIds(String(name).replace(/\d{5,}/g, m => keep.includes(m) ? m : maskAccount(m)), keep).slice(0, 120) : null;
  res.warnings = res.warnings.map(w => scrubIds(w, keep));
  for (const t of res.trades) { t.name = scrubIds(t.name || '', keep); t.sig = signature(t); }
  res.totals = { buy: round(res.trades.filter(t => t.side === 'BUY').reduce((a, t) => a + t.amount + (t.commission || 0), 0)), sell: round(res.trades.filter(t => t.side === 'SELL').reduce((a, t) => a + t.amount - (t.commission || 0), 0)), commission: round(res.trades.reduce((a, t) => a + (t.commission || 0), 0)) };
  return res;
}
