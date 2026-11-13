// GNC Terminal — layered storage beside store.json (schema version 2):
//   data/series/<SAFE>.json      full daily history per instrument  { symbol, bars: [[date, close, high, low, volume]], splits, from, to, updatedAt, source }
//   data/series/_index.json      { SYM: { n, from, to, updatedAt } } so coverage can be computed without opening every file
//   data/facts.ndjson            append-only fundamentals rows { sym, metric, periodEnd, filedAt, value, unit, form, src, fp?, est? } (point-in-time)
//   data/membership.ndjson       index membership events { index, symbol, added, removed, src }
//   data/raw/<source>/<date>.json the last raw response per source and day (5 files per source)
// Everything is written atomically (tmp + rename) and tolerates a missing or damaged file (starts empty, logs).
import fs from 'node:fs';
import path from 'node:path';

const SAFE = s => String(s).replace(/\//g, '_');
export const SCHEMA_VERSION = 2;

function writeAtomic(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = file + '.tmp';
  fs.writeFileSync(tmp, body); try { fs.renameSync(tmp, file); } catch (e) { fs.writeFileSync(file, body); try { fs.unlinkSync(tmp); } catch (_) { } }
}
function readJSON(p, d) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } }

// merge bar arrays by date: newer wins for close, null fields are filled from the older row
export function mergeSeriesBars(oldBars, newBars) {
  const m = new Map(); for (const r of oldBars || []) if (r && r[0] && r[1] > 0) m.set(r[0], r);
  for (const r of newBars || []) { if (!r || !r[0] || !(r[1] > 0)) continue; const o = m.get(r[0]); m.set(r[0], o ? [r[0], r[1], r[2] ?? o[2] ?? null, r[3] ?? o[3] ?? null, r[4] ?? o[4] ?? null] : [r[0], r[1], r[2] ?? null, r[3] ?? null, r[4] ?? null]); }
  return [...m.values()].sort((a, b) => a[0] < b[0] ? -1 : 1);
}

export function createStore2({ dir, log = () => { } }) {
  const DATA = path.join(dir, 'data'), SERIES = path.join(DATA, 'series'), FACTS = path.join(DATA, 'facts.ndjson'), MEMB = path.join(DATA, 'membership.ndjson'), RAW = path.join(DATA, 'raw'), IDX = path.join(SERIES, '_index.json');
  fs.mkdirSync(SERIES, { recursive: true }); fs.mkdirSync(RAW, { recursive: true });

  /* ---------------- series ---------------- */
  let seriesIndex = readJSON(IDX, null); let idxDirty = false, idxTimer = null;
  if (!seriesIndex) { seriesIndex = {}; try { for (const f of fs.readdirSync(SERIES)) { if (!f.endsWith('.json') || f.startsWith('_')) continue; const d = readJSON(path.join(SERIES, f), null); if (d && Array.isArray(d.bars) && d.symbol) seriesIndex[d.symbol] = { n: d.bars.length, from: d.from, to: d.to, updatedAt: d.updatedAt }; } } catch (e) { } idxDirty = true; }
  function saveIndex() { clearTimeout(idxTimer); idxTimer = setTimeout(() => { if (!idxDirty) return; try { writeAtomic(IDX, JSON.stringify(seriesIndex)); idxDirty = false; } catch (e) { log('series index save failed:', e.message); } }, 800); }
  const seriesPath = sym => path.join(SERIES, SAFE(sym) + '.json');
  function readSeries(sym) { return readJSON(seriesPath(sym), null); }
  function readSeriesRaw(sym) { try { return fs.readFileSync(seriesPath(sym)); } catch (e) { return null; } }
  // merge new bars into the file; returns the stored doc
  function writeSeries(sym, { bars, splits, source }) {
    const cur = readSeries(sym) || { symbol: sym, bars: [], splits: [] };
    const merged = mergeSeriesBars(cur.bars, bars);
    const sp = new Map((cur.splits || []).map(s => [s.date, s])); for (const s of splits || []) if (s && s.date) sp.set(s.date, s);
    const doc = { symbol: sym, bars: merged, splits: [...sp.values()].sort((a, b) => a.date < b.date ? -1 : 1), from: merged.length ? merged[0][0] : null, to: merged.length ? merged[merged.length - 1][0] : null, updatedAt: new Date().toISOString(), source: source || cur.source || null };
    writeAtomic(seriesPath(sym), JSON.stringify(doc));
    seriesIndex[sym] = { n: merged.length, from: doc.from, to: doc.to, updatedAt: doc.updatedAt }; idxDirty = true; saveIndex();
    return doc;
  }
  function seriesMeta(sym) { return seriesIndex[sym] || null; }
  function seriesAll() { return seriesIndex; }

  /* ---------------- facts (append-only, in-memory index) ---------------- */
  const factsBySym = new Map(), factKeys = new Set(); let factRows = 0;
  const fkey = r => `${r.sym}|${r.metric}|${r.periodEnd}|${r.filedAt}|${r.fp || ''}`;
  function indexFact(r) { const k = fkey(r); if (factKeys.has(k)) return false; factKeys.add(k); let a = factsBySym.get(r.sym); if (!a) { a = []; factsBySym.set(r.sym, a); } a.push(r); factRows++; return true; }
  function loadFacts() {
    let lines = 0, dupes = 0; try { const txt = fs.readFileSync(FACTS, 'utf8'); for (const line of txt.split('\n')) { if (!line) continue; lines++; try { const r = JSON.parse(line); if (!r || !r.sym || !r.metric) { dupes++; continue; } if (!indexFact(r)) dupes++; } catch (e) { dupes++; } } } catch (e) { }
    for (const a of factsBySym.values()) a.sort((x, y) => x.periodEnd < y.periodEnd ? -1 : x.periodEnd > y.periodEnd ? 1 : (x.filedAt < y.filedAt ? -1 : 1));
    if (lines && dupes / lines > 0.2) { compactFacts(); log(`facts.ndjson compacted: ${lines} lines, ${dupes} duplicates removed`); }
    return { lines, dupes, rows: factRows };
  }
  function compactFacts() { const out = []; for (const a of factsBySym.values()) for (const r of a) out.push(JSON.stringify(r)); writeAtomic(FACTS, out.length ? out.join('\n') + '\n' : ''); }
  // append rows (deduplicated by sym+metric+periodEnd+filedAt+fp); returns the number of new rows
  function appendFacts(rows) {
    const fresh = []; for (const r of rows || []) { if (!r || !r.sym || !r.metric || !r.periodEnd || !r.filedAt || !(typeof r.value === 'number' && isFinite(r.value))) continue; if (indexFact(r)) fresh.push(r); }
    if (fresh.length) { fs.mkdirSync(DATA, { recursive: true }); fs.appendFileSync(FACTS, fresh.map(r => JSON.stringify(r)).join('\n') + '\n'); for (const r of fresh) { const a = factsBySym.get(r.sym); a.sort((x, y) => x.periodEnd < y.periodEnd ? -1 : x.periodEnd > y.periodEnd ? 1 : (x.filedAt < y.filedAt ? -1 : 1)); } }
    return fresh.length;
  }
  function factsOf(sym, metric) { const a = factsBySym.get(sym) || []; return metric ? a.filter(r => r.metric === metric) : a.slice(); }
  // point-in-time: the latest periodEnd known at `date` (filedAt <= date); within the same period the latest filing wins
  function factAt(sym, metric, date, fp) {
    let best = null; for (const r of factsBySym.get(sym) || []) { if (r.metric !== metric || r.filedAt > date) continue; if (fp && (r.fp || '') !== fp) continue; if (!best || r.periodEnd > best.periodEnd || (r.periodEnd === best.periodEnd && r.filedAt > best.filedAt)) best = r; }
    return best;
  }
  function factStats() { return { rows: factRows, symbols: factsBySym.size }; }

  /* ---------------- membership events ---------------- */
  let membRows = null;
  function membershipRows() { if (membRows) return membRows; membRows = []; try { for (const line of fs.readFileSync(MEMB, 'utf8').split('\n')) { if (!line) continue; try { const r = JSON.parse(line); if (r && r.index && r.symbol) membRows.push(r); } catch (e) { } } } catch (e) { } return membRows; }
  function appendMembership(rows) {
    const cur = membershipRows(), seen = new Set(cur.map(r => `${r.index}|${r.symbol}|${r.added || ''}|${r.removed || ''}`)), fresh = [];
    for (const r of rows || []) { if (!r || !r.index || !r.symbol || (!r.added && !r.removed)) continue; const k = `${r.index}|${r.symbol}|${r.added || ''}|${r.removed || ''}`; if (seen.has(k)) continue; seen.add(k); fresh.push(r); cur.push(r); }
    if (fresh.length) fs.appendFileSync(MEMB, fresh.map(r => JSON.stringify(r)).join('\n') + '\n');
    return fresh.length;
  }

  /* ---------------- raw responses ---------------- */
  function saveRaw(source, body, date) {
    try { const d = path.join(RAW, SAFE(source).replace(/[^\w.\-]/g, '_')); fs.mkdirSync(d, { recursive: true }); const day = date || new Date().toISOString().slice(0, 10);
      writeAtomic(path.join(d, day + '.json'), typeof body === 'string' ? body : JSON.stringify(body));
      const all = fs.readdirSync(d).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort(); for (const f of all.slice(0, Math.max(0, all.length - 5))) fs.unlinkSync(path.join(d, f)); } catch (e) { log('raw save failed:', source, e.message); }
  }
  /* ---------------- small json side files (caches, snapshots) ---------------- */
  const sidePath = name => path.join(DATA, name.replace(/[^\w.\-]/g, '_') + '.json');
  function readSide(name, d) { return readJSON(sidePath(name), d); }
  function writeSide(name, obj) { writeAtomic(sidePath(name), JSON.stringify(obj)); }

  const loaded = loadFacts(); log(`store2: ${loaded.rows} fact rows (${factsBySym.size} symbols), ${Object.keys(seriesIndex).length} series files, ${membershipRows().length} membership events`);
  return { schemaVersion: SCHEMA_VERSION, seriesPath, readSeries, readSeriesRaw, writeSeries, seriesMeta, seriesAll, appendFacts, factsOf, factAt, factStats, compactFacts, membershipRows, appendMembership, saveRaw, readSide, writeSide, SAFE };
}
