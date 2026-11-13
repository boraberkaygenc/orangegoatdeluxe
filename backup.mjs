// GNC Terminal — backup / restore of user data, and the "data pack" (10-year series + fundamentals) as a ZIP.
// Also holds a minimal ZIP writer (deflate via zlib.deflateRawSync, CRC-32) and reader (central directory, stored/deflate),
// used by update.mjs as well. No npm packages. Paths are built with path.join so Windows works the same.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/* ============================== CRC-32 ============================== */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(buf, crc = 0) { crc = ~crc >>> 0; for (let i = 0; i < buf.length; i++) crc = CRC_T[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8); return ~crc >>> 0; }

/* ============================== ZIP writer ============================== */
function dosTime(d) { const t = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dt = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(); return [t & 0xffff, dt & 0xffff]; }
// write: async (Buffer) => void. Entries are compressed one at a time (memory = one file), so large packs can be streamed.
export class ZipWriter {
  constructor(write) { this.write = write; this.offset = 0; this.central = []; }
  async _out(b) { this.offset += b.length; await this.write(b); }
  async add(name, data, { mtime = new Date(), store = false } = {}) {
    name = String(name).replace(/\\/g, '/'); const nb = Buffer.from(name, 'utf8'); data = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const crc = crc32(data); let method = 0, body = data;
    if (!store && data.length > 64) { const z = zlib.deflateRawSync(data, { level: 6 }); if (z.length < data.length) { method = 8; body = z; } }
    if (this.offset + body.length > 0xfffffff0 || this.central.length >= 0xfffe) throw new Error('data pack too large for a plain ZIP (4 GB / 65,535 files)');
    const [tm, dt] = dosTime(mtime), h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(method, 8); h.writeUInt16LE(tm, 10); h.writeUInt16LE(dt, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26); h.writeUInt16LE(0, 28);
    this.central.push({ nb, method, tm, dt, crc, csize: body.length, usize: data.length, offset: this.offset });
    await this._out(Buffer.concat([h, nb])); await this._out(body);
  }
  async finish() {
    const start = this.offset, parts = [];
    for (const e of this.central) { const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(e.method, 10); c.writeUInt16LE(e.tm, 12); c.writeUInt16LE(e.dt, 14);
      c.writeUInt32LE(e.crc, 16); c.writeUInt32LE(e.csize, 20); c.writeUInt32LE(e.usize, 24); c.writeUInt16LE(e.nb.length, 28); c.writeUInt16LE(0, 30); c.writeUInt16LE(0, 32); c.writeUInt16LE(0, 34); c.writeUInt16LE(0, 36); c.writeUInt32LE(0, 38); c.writeUInt32LE(e.offset, 42);
      parts.push(c, e.nb); }
    const cd = Buffer.concat(parts), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(this.central.length, 8); end.writeUInt16LE(this.central.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(start, 16);
    await this._out(cd); await this._out(end); return { files: this.central.length, bytes: this.offset };
  }
}
// convenience: whole zip in memory
export async function zipBuffer(files) { const out = []; const z = new ZipWriter(async b => { out.push(b); }); for (const [name, data] of files) await z.add(name, data); await z.finish(); return Buffer.concat(out); }

/* ============================== ZIP reader ============================== */
// source: Buffer or a file path. Returns { entries:[{name, dir, method, csize, usize, crc, offset}], read(entry) -> Buffer, close() }.
export function openZip(source) {
  const isBuf = Buffer.isBuffer(source); const fd = isBuf ? null : fs.openSync(source, 'r'); const size = isBuf ? source.length : fs.fstatSync(fd).size;
  const readAt = (pos, len) => { if (isBuf) return source.subarray(pos, pos + len); const b = Buffer.alloc(len); let got = 0; while (got < len) { const n = fs.readSync(fd, b, got, len - got, pos + got); if (!n) break; got += n; } return got === len ? b : b.subarray(0, got); };
  try {
    if (size < 22) throw new Error('not a ZIP file (too short)');
    const tailLen = Math.min(size, 65557), tail = readAt(size - tailLen, tailLen); let eo = -1;
    for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eo = i; break; }
    if (eo < 0) throw new Error('not a ZIP file (no end-of-directory record)');
    const count = tail.readUInt16LE(eo + 10), cdSize = tail.readUInt32LE(eo + 12), cdOff = tail.readUInt32LE(eo + 16);
    if (count === 0xffff || cdOff === 0xffffffff) throw new Error('ZIP64 archives are not supported; zip fewer or smaller files');
    if (cdOff + cdSize > size) throw new Error('ZIP central directory is outside the file (truncated upload?)');
    const cd = readAt(cdOff, cdSize), entries = []; let p = 0;
    for (let i = 0; i < count; i++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP central directory is damaged');
      const flags = cd.readUInt16LE(p + 8), method = cd.readUInt16LE(p + 10), crc = cd.readUInt32LE(p + 16), csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24), nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), offset = cd.readUInt32LE(p + 42);
      const name = cd.subarray(p + 46, p + 46 + nl).toString(flags & 0x800 ? 'utf8' : 'latin1').replace(/\\/g, '/');
      if (flags & 1) throw new Error('encrypted ZIP entries are not supported (' + name + ')');
      entries.push({ name, dir: name.endsWith('/'), method, crc, csize, usize, offset }); p += 46 + nl + xl + cl;
    }
    const read = e => {
      const h = readAt(e.offset, 30); if (h.readUInt32LE(0) !== 0x04034b50) throw new Error('ZIP entry header damaged: ' + e.name);
      const data = readAt(e.offset + 30 + h.readUInt16LE(26) + h.readUInt16LE(28), e.csize);
      let out; if (e.method === 0) out = Buffer.from(data); else if (e.method === 8) out = zlib.inflateRawSync(data); else throw new Error(`ZIP method ${e.method} not supported (${e.name}); use normal (deflate) compression`);
      if (out.length !== e.usize || crc32(out) !== e.crc) throw new Error('ZIP entry is corrupt (CRC mismatch): ' + e.name);
      return out;
    };
    return { entries, read, close: () => { if (fd !== null) try { fs.closeSync(fd); } catch (e) { } } };
  } catch (e) { if (fd !== null) try { fs.closeSync(fd); } catch (_) { } throw e; }
}
// a ZIP entry name is safe to extract when it is relative and never climbs out of the target folder
export function safeRel(name) { const n = String(name).replace(/\\/g, '/'); if (!n || n.startsWith('/') || /^[a-zA-Z]:/.test(n) || n.split('/').some(s => s === '..')) return null; return n; }

/* ============================== streaming request body to disk ============================== */
export function bodyToFile(req, file, maxBytes) {
  return new Promise((ok, bad) => {
    fs.mkdirSync(path.dirname(file), { recursive: true }); const out = fs.createWriteStream(file); let n = 0, failed = false;
    const fail = e => { if (failed) return; failed = true; try { req.unpipe(out); } catch (_) { } out.destroy(); try { fs.unlinkSync(file); } catch (_) { } bad(e); };
    req.on('data', c => { n += c.length; if (n > maxBytes) { fail(Object.assign(new Error(`upload larger than ${Math.round(maxBytes / 1048576)} MB`), { code: 413 })); req.resume(); } });
    req.on('error', fail); req.on('aborted', () => fail(new Error('upload aborted'))); out.on('error', fail);
    out.on('finish', () => { if (!failed) ok(n); }); req.pipe(out);
  });
}

/* ============================== backup / restore ============================== */
export const USER_KEYS = ['settings/main', 'macro/main'];
export const USER_PREFIXES = ['data/users/local/', 'pickslog/', 'picks/'];
export const FULL_PREFIXES = ['instruments/', 'status/'];
const KEY_RE = /^[\w\-.~:@+]+(\/[\w\-.~:@+]+)+$/;
const inScope = (k, full) => USER_KEYS.includes(k) || USER_PREFIXES.some(p => k.startsWith(p)) || (full && FULL_PREFIXES.some(p => k.startsWith(p)));
export function appVersion(DIR) { try { return (fs.readFileSync(path.join(DIR, 'public', 'index.html'), 'utf8').match(/id="app-ver"[^>]*>([^<]*)</) || [])[1] || null; } catch (e) { return null; } }
export function makeBackup(db, { full = false, DIR }) {
  const docs = {}; for (const [k, v] of Object.entries(db.docs)) if (inScope(k, full)) docs[k] = v;
  return { meta: { kind: 'gnc-backup', format: 1, version: appVersion(DIR), createdAt: new Date().toISOString(), dir: DIR, full: !!full, docs: Object.keys(docs).length }, docs };
}
export function validateBackup(b) {
  if (!b || typeof b !== 'object') throw new Error('not a GNC Terminal backup (no JSON object)');
  if (!b.meta || b.meta.kind !== 'gnc-backup') throw new Error('not a GNC Terminal backup (meta.kind is missing)');
  if (!b.docs || typeof b.docs !== 'object' || Array.isArray(b.docs)) throw new Error('backup has no docs');
  const bad = Object.keys(b.docs).filter(k => !KEY_RE.test(k)); if (bad.length) throw new Error('backup contains invalid document keys: ' + bad.slice(0, 3).join(', '));
  if (b.docs['settings/main'] !== undefined && (typeof b.docs['settings/main'] !== 'object' || b.docs['settings/main'] === null)) throw new Error('settings/main in the backup is not an object');
  return true;
}
// mode 'merge': add what is missing, keep what is here (item lists are united by id / content). mode 'replace': the backup wins and
// user documents that are not in it are removed. A full copy of the store is written to data/backups/pre-restore-<ts>.json first.
export function applyRestore({ db, put, DIR, log = () => { } }, b, mode = 'merge') {
  validateBackup(b); if (!['merge', 'replace'].includes(mode)) throw new Error("mode must be 'merge' or 'replace'");
  const full = !!(b.meta && b.meta.full), ts = new Date().toISOString().replace(/[:.]/g, '-'), dir = path.join(DIR, 'data', 'backups'), safety = path.join(dir, `pre-restore-${ts}.json`);
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(safety, JSON.stringify({ meta: { kind: 'gnc-store-copy', createdAt: new Date().toISOString(), reason: 'before restore (' + mode + ')' }, rev: db.rev, docs: db.docs }));
  const s = { mode, added: 0, replaced: 0, merged: 0, kept: 0, removed: 0, skipped: 0, safetyCopy: path.relative(DIR, safety) };
  const itemKey = it => it && typeof it === 'object' ? (it.id != null ? 'id:' + it.id : JSON.stringify(it)) : JSON.stringify(it);
  for (const [k, v] of Object.entries(b.docs)) {
    if (!inScope(k, full)) { s.skipped++; continue; }
    const cur = db.docs[k];
    if (cur === undefined) { put(k, v); s.added++; continue; }
    if (mode === 'replace') { if (JSON.stringify(cur) !== JSON.stringify(v)) { put(k, v); s.replaced++; } else s.kept++; continue; }
    if (cur && v && Array.isArray(cur.items) && Array.isArray(v.items)) { const have = new Set(cur.items.map(itemKey)), extra = v.items.filter(it => !have.has(itemKey(it))); if (extra.length) { put(k, { ...v, ...cur, items: [...cur.items, ...extra] }); s.merged++; } else s.kept++; continue; }
    if (cur && v && Array.isArray(cur.read) && Array.isArray(v.read)) { const u = [...new Set([...v.read, ...cur.read])]; if (u.length !== cur.read.length) { put(k, { ...cur, read: u.slice(-400) }); s.merged++; } else s.kept++; continue; }
    if (k === 'settings/main' && cur && v && typeof cur === 'object') { const add = Object.keys(v).filter(x => !(x in cur)); if (add.length) { put(k, { ...v, ...cur }); s.merged++; } else s.kept++; continue; }
    s.kept++;
  }
  if (mode === 'replace') for (const k of Object.keys(db.docs)) if (inScope(k, full) && !(k in b.docs) && !(k === 'settings/main')) { put(k, null); s.removed++; }
  log(`restore (${mode}) from backup of ${b.meta.createdAt || '?'}: +${s.added} added, ${s.replaced} replaced, ${s.merged} merged, ${s.removed} removed, ${s.skipped} skipped; safety copy ${s.safetyCopy}`);
  return s;
}

/* ============================== data pack ============================== */
// GET: series/<file>.json for every data/series file, facts.ndjson, membership.ndjson and datapack.json (manifest).
export async function writeDatapack(DIR, write, version) {
  const data = path.join(DIR, 'data'), sdir = path.join(data, 'series'), z = new ZipWriter(write); let series = 0;
  const files = fs.existsSync(sdir) ? fs.readdirSync(sdir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort() : [];
  for (const f of files) { let buf; try { buf = fs.readFileSync(path.join(sdir, f)); } catch (e) { continue; } const st = fs.statSync(path.join(sdir, f)); await z.add('series/' + f, buf, { mtime: st.mtime }); series++; }
  const sizes = {};
  for (const f of ['facts.ndjson', 'membership.ndjson']) { const fp = path.join(data, f); if (!fs.existsSync(fp)) continue; const buf = fs.readFileSync(fp); sizes[f] = buf.length; await z.add(f, buf, { mtime: fs.statSync(fp).mtime }); }
  await z.add('datapack.json', JSON.stringify({ kind: 'gnc-datapack', format: 1, version, createdAt: new Date().toISOString(), series, files: sizes }, null, 1));
  return z.finish();
}
// POST: merge a data pack into this computer's data layer through store2 (series bars are merged, fact and membership rows deduplicated)
export function importDatapack(zipFile, store2, log = () => { }) {
  const z = openZip(zipFile), s = { series: 0, seriesBars: 0, facts: 0, factRowsRead: 0, membership: 0, skipped: [], errors: [] };
  try {
    const names = new Set(z.entries.map(e => e.name)); if (![...names].some(n => /^series\/.+\.json$/.test(n) || n === 'facts.ndjson' || n === 'membership.ndjson' || n === 'datapack.json')) throw new Error('this ZIP is not a GNC data pack (no series/, facts.ndjson or membership.ndjson)');
    for (const e of z.entries) {
      if (e.dir) continue; const n = safeRel(e.name); if (!n) { s.skipped.push(e.name); continue; }
      try {
        if (/^series\/[^/]+\.json$/.test(n) && !n.startsWith('series/_')) {
          const doc = JSON.parse(z.read(e).toString('utf8')); if (!doc || typeof doc.symbol !== 'string' || !Array.isArray(doc.bars) || !/^[\w.\-\/=^]{1,20}$/.test(doc.symbol)) { s.skipped.push(n); continue; }
          const before = (store2.seriesMeta(doc.symbol) || {}).n || 0, out = store2.writeSeries(doc.symbol, { bars: doc.bars, splits: doc.splits || [], source: doc.source || 'data pack' }); s.series++; s.seriesBars += Math.max(0, out.bars.length - before);
        } else if (n === 'facts.ndjson' || n === 'membership.ndjson') {
          const txt = z.read(e).toString('utf8'), rows = []; let read = 0; const flush = () => { if (!rows.length) return; if (n === 'facts.ndjson') s.facts += store2.appendFacts(rows); else s.membership += store2.appendMembership(rows); rows.length = 0; };
          for (const line of txt.split('\n')) { if (!line.trim()) continue; try { rows.push(JSON.parse(line)); read++; } catch (_) { } if (rows.length >= 5000) flush(); } flush(); if (n === 'facts.ndjson') s.factRowsRead = read;
        } else if (n !== 'datapack.json') s.skipped.push(n);
      } catch (err) { s.errors.push(n + ': ' + err.message); if (s.errors.length > 50) break; }
    }
  } finally { z.close(); }
  log(`data pack imported: ${s.series} series (${s.seriesBars} new bars), ${s.facts} new fact rows, ${s.membership} new membership events${s.errors.length ? ', ' + s.errors.length + ' errors' : ''}`);
  if (s.skipped.length > 20) s.skipped = [...s.skipped.slice(0, 20), `… ${s.skipped.length - 20} more`];
  return s;
}
