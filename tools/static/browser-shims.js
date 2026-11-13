/* Browser stand-ins for the two Node built-ins the broker-report reader (pdfimport.mjs) uses: Buffer and zlib inflate.
   No third-party code. Inflate follows RFC 1950/1951 (stored, fixed and dynamic Huffman blocks). Used only in the
   GitHub Pages version, where tools/static-build.mjs wraps pdfimport.mjs with these into import-browser.js. */
var GNC_SHIMS = (() => {
  const TE = new TextEncoder(), TD = new TextDecoder('utf-8');
  class Buffer extends Uint8Array {
    static from(x, enc) {
      if (typeof x === 'string') {
        if (enc === 'latin1' || enc === 'binary' || enc === 'ascii') { const b = new Buffer(x.length); for (let i = 0; i < x.length; i++) b[i] = x.charCodeAt(i) & 255; return b; }
        if (enc === 'hex') { const s = x.length % 2 ? x + '0' : x, b = new Buffer(s.length >> 1); for (let i = 0; i < b.length; i++) b[i] = parseInt(s.substr(i * 2, 2), 16) || 0; return b; }
        if (enc === 'base64') { const bin = atob(x.replace(/[^A-Za-z0-9+/=]/g, '')); return Buffer.from(bin, 'latin1'); }
        const u = TE.encode(x), b = new Buffer(u.length); b.set(u); return b;
      }
      if (x instanceof ArrayBuffer) { const b = new Buffer(x.byteLength); b.set(new Uint8Array(x)); return b; }
      const b = new Buffer(x.length || 0); b.set(x); return b;
    }
    static alloc(n) { return new Buffer(n); }
    static isBuffer(x) { return x instanceof Buffer; }
    static concat(list) { let n = 0; for (const l of list) n += l.length; const b = new Buffer(n); let o = 0; for (const l of list) { b.set(l, o); o += l.length; } return b; }
    toString(enc, start, end) {
      const v = (start !== undefined || end !== undefined) ? this.subarray(start || 0, end === undefined ? this.length : end) : this;
      if (enc === 'latin1' || enc === 'binary' || enc === 'ascii') { let s = ''; for (let i = 0; i < v.length; i += 8192) s += String.fromCharCode.apply(null, v.subarray(i, i + 8192)); return s; }
      if (enc === 'hex') { let s = ''; for (const c of v) s += (c < 16 ? '0' : '') + c.toString(16); return s; }
      if (enc === 'base64') return btoa(v.toString('latin1'));
      return TD.decode(v);
    }
    static _needle(v) { return typeof v === 'string' ? Buffer.from(v, 'latin1') : v; }
    indexOf(v, from = 0) { if (typeof v === 'number') return super.indexOf(v, from); const n = Buffer._needle(v); if (!n.length) return Math.min(from, this.length); if (from < 0) from = Math.max(0, this.length + from);
      const f = n[0]; for (let i = super.indexOf(f, from); i !== -1 && i <= this.length - n.length; i = super.indexOf(f, i + 1)) { let k = 1; while (k < n.length && this[i + k] === n[k]) k++; if (k === n.length) return i; } return -1; }
    lastIndexOf(v, from) { if (typeof v === 'number') return from === undefined ? super.lastIndexOf(v) : super.lastIndexOf(v, from); const n = Buffer._needle(v); let i = Math.min(from === undefined ? this.length - n.length : from, this.length - n.length);
      for (; i >= 0; i--) { let k = 0; while (k < n.length && this[i + k] === n[k]) k++; if (k === n.length) return i; } return -1; }
    includes(v, from) { return this.indexOf(v, from) !== -1; }
    slice(s, e) { return this.subarray(s, e); }   // Node: a view, like subarray
    copy(t, ts = 0, ss = 0, se = this.length) { const part = this.subarray(ss, se); t.set(part.subarray(0, Math.max(0, t.length - ts)), ts); return Math.min(part.length, t.length - ts); }
    equals(o) { if (!o || o.length !== this.length) return false; for (let i = 0; i < o.length; i++) if (o[i] !== this[i]) return false; return true; }
  }

  /* ---- inflate (RFC 1951) ---- */
  const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258], LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577], DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const CLORD = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  function huff(lens) { const count = new Uint16Array(16), offs = new Uint16Array(16), sym = new Uint16Array(lens.length); for (const l of lens) count[l]++; count[0] = 0; for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1]; for (let i = 0; i < lens.length; i++) if (lens[i]) sym[offs[lens[i]]++] = i; return { count, sym }; }
  let FIXED = null; const fixed = () => FIXED || (FIXED = (() => { const l = new Uint8Array(288); l.fill(8, 0, 144); l.fill(9, 144, 256); l.fill(7, 256, 280); l.fill(8, 280, 288); const d = new Uint8Array(30).fill(5); return [huff(l), huff(d)]; })());
  function rawInflate(src, partialOk) {
    let pos = 0, bit = 0, bits = 0; const out = []; let o = new Uint8Array(Math.max(1024, src.length * 4)), op = 0;
    const need = n => { while (bits < n) { if (pos >= src.length) throw new Error('unexpected end of data'); bit |= src[pos++] << bits; bits += 8; } };
    const get = n => { need(n); const v = bit & ((1 << n) - 1); bit >>>= n; bits -= n; return v; };
    const put = b => { if (op === o.length) { const n = new Uint8Array(o.length * 2); n.set(o); o = n; } o[op++] = b; };
    const decode = h => { let code = 0, first = 0, idx = 0; for (let len = 1; len < 16; len++) { code |= get(1); const c = h.count[len]; if (code - c < first) return h.sym[idx + (code - first)]; idx += c; first += c; first <<= 1; code <<= 1; } throw new Error('bad Huffman code'); };
    try {
      let last = 0;
      while (!last) {
        last = get(1); const type = get(2);
        if (type === 0) { bit = 0; bits = 0; if (pos + 4 > src.length) throw new Error('unexpected end of data'); const len = src[pos] | (src[pos + 1] << 8); pos += 4; if (pos + len > src.length) throw new Error('unexpected end of data'); for (let i = 0; i < len; i++) put(src[pos++]); }
        else if (type === 1 || type === 2) {
          let lt, dt;
          if (type === 1) [lt, dt] = fixed();
          else { const hl = get(5) + 257, hd = get(5) + 1, hc = get(4) + 4, cl = new Uint8Array(19); for (let i = 0; i < hc; i++) cl[CLORD[i]] = get(3); const ct = huff(cl), lens = new Uint8Array(hl + hd);
            for (let i = 0; i < hl + hd;) { const s = decode(ct); if (s < 16) lens[i++] = s; else if (s === 16) { if (!i) throw new Error('bad repeat'); const p = lens[i - 1]; for (let r = 3 + get(2); r--;) lens[i++] = p; } else if (s === 17) i += 3 + get(3); else i += 11 + get(7); }
            lt = huff(lens.subarray(0, hl)); dt = huff(lens.subarray(hl)); }
          for (;;) { const s = decode(lt); if (s < 256) put(s); else if (s === 256) break; else { const li = s - 257; if (li >= 29) throw new Error('bad length'); const len = LBASE[li] + get(LEXT[li]), di = decode(dt); if (di >= 30) throw new Error('bad distance'); const dist = DBASE[di] + get(DEXT[di]); if (dist > op) throw new Error('distance too far'); for (let i = 0; i < len; i++) put(o[op - dist]); } }
        } else throw new Error('bad block type');
      }
    } catch (e) { if (!partialOk) throw e; }
    return Buffer.from(o.subarray(0, op));
  }
  const zlib = {
    constants: { Z_SYNC_FLUSH: 2 },
    inflateSync(buf, opt) { const partial = !!(opt && opt.finishFlush); if (buf.length < 2 || (buf[0] & 15) !== 8 || ((buf[0] << 8) | buf[1]) % 31) throw new Error('incorrect header check'); return rawInflate(buf.subarray(2), partial); },
    inflateRawSync(buf, opt) { return rawInflate(buf, !!(opt && opt.finishFlush)); },
  };
  return { Buffer, zlib };
})();
if (typeof module !== 'undefined') module.exports = GNC_SHIMS;
