// GNC Terminal — index membership history (point-in-time universes for the Lab).
// US: historical changes parsed from Wikipedia (S&P 500 "Selected changes" table, Nasdaq-100 "Changes in 20xx" sections, best
// effort) plus current constituent tables. BIST: Borsa İstanbul announces quarterly changes on KAP; the app records the current
// BIST 30/50/100 membership (instrument idx fields) as a snapshot on every universe refresh and start-up and writes added/removed
// events by diffing against the previous snapshot. Events live in data/membership.ndjson; membersAt(index, date) replays them.
import { today } from './fundamentals.mjs';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,*/*' };
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;|&#160;/g, ' ').replace(/\[\d+\]/g, '').trim();
export function parseDate(t) { const m = String(t).match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i); if (m) return `${m[3]}-${String(MONTHS[m[1].toLowerCase()]).padStart(2, '0')}-${m[2].padStart(2, '0')}`; const n = String(t).match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i); return n ? `${n[3]}-${String(MONTHS[n[2].toLowerCase()]).padStart(2, '0')}-${n[1].padStart(2, '0')}` : null; }
const TICK = /^[A-Z][A-Z0-9.\-]{0,6}$/;
function rowsOf(tableHtml) { return [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => strip(c[1]))); }
function tableAfter(html, idRe) { // the table whose own tag carries the id, or the first table after the anchor
  const i = html.search(idRe); if (i < 0) return null; const lt = html.lastIndexOf('<table', i), gt = lt >= 0 ? html.indexOf('>', lt) : -1; const s = lt >= 0 && gt > i ? lt : html.indexOf('<table', i); if (s < 0) return null; const e = html.indexOf('</table>', s); return e < 0 ? null : html.slice(s, e + 8); }

// S&P 500 page: current constituents (first table) and the "Selected changes" table (Date | Added ticker | Added security | Removed ticker | Removed security | Reason)
export function parseSP500(html) {
  const cur = []; const t1 = tableAfter(html, /id="constituents"/) || tableAfter(html, /<table/); if (t1) for (const r of rowsOf(t1)) if (r.length >= 2 && TICK.test(r[0])) cur.push(r[0]);
  const events = []; const t2 = tableAfter(html, /id="changes"|Selected_changes/); let lastDate = null;
  if (t2) for (const r of rowsOf(t2)) { if (r.length < 3) continue; const d = parseDate(r[0]); let cells = r; if (d) lastDate = d; else if (lastDate && (TICK.test(r[0]) || r[0] === '')) cells = [lastDate, ...r]; else continue; if (!lastDate) continue;
    const date = lastDate, add = cells[1], rem = cells.length >= 5 ? cells[3] : (cells.length === 4 ? cells[3] : cells[2]);
    if (add && TICK.test(add)) events.push({ index: 'SPX', symbol: add, added: date, src: 'Wikipedia' }); if (rem && TICK.test(rem) && rem !== add) events.push({ index: 'SPX', symbol: rem, removed: date, src: 'Wikipedia' }); }
  return { current: [...new Set(cur)], events };
}
// Nasdaq-100 page: components table and sentences in the "Changes in 20xx" sections ("... X (TICK) replaced Y (TICK) ...", best effort)
export function parseNDX(html) {
  const cur = new Set(); const t = tableAfter(html, /id="Components"|id="constituents"|id="Current_components"/); if (t) for (const r of rowsOf(t)) for (const c of r.slice(0, 2)) if (TICK.test(c) && c.length <= 5 && c !== 'GICS') { cur.add(c); break; }
  if (cur.size < 80) { // the page layout changed: take the table whose header has a Ticker/Symbol column and the most tickers in it
    let best = null; for (const m of html.matchAll(/<table[\s\S]*?<\/table>/g)) { const rows = rowsOf(m[0]); const hi = rows.findIndex(r => r.some(c => /^(ticker|symbol|ticker symbol)$/i.test(c))); if (hi < 0) continue;
      const col = rows[hi].findIndex(c => /^(ticker|symbol|ticker symbol)$/i.test(c)), got = rows.slice(hi + 1).map(r => r[col]).filter(c => c && TICK.test(c) && c.length <= 5); if (!best || got.length > best.length) best = got; }
    if (best && best.length > cur.size) { cur.clear(); for (const c of best) cur.add(c); } }
  const events = []; const secs = [...html.matchAll(/id="Changes_in_(\d{4})"/g)];
  for (let i = 0; i < secs.length; i++) { const year = secs[i][1], from = secs[i].index, to = i + 1 < secs.length ? secs[i + 1].index : Math.min(html.length, from + 60000), body = html.slice(from, to);
    for (const p of body.matchAll(/<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/g)) { const txt = strip(p[1]); const d = parseDate(txt); const date = d && d.startsWith(year) ? d : null; if (!date) continue;
      const ticks = part => [...part.matchAll(/\(([A-Z]{1,5})\)/g)].map(m => m[1]);
      // "A (X) and B (Y) joined/replaced ..., replacing C (Z)": tickers before the replace-word are added, after it removed; "replaced by" swaps
      const cut = txt.search(/\b(?:replac(?:ed|ing)|in place of)\b/i);
      if (cut >= 0) { let add = ticks(txt.slice(0, cut)), rem = ticks(txt.slice(cut)); if (/replaced by/i.test(txt)) [add, rem] = [rem, add]; for (const t of add) events.push({ index: 'NDX', symbol: t, added: date, src: 'Wikipedia' }); for (const t of rem) if (!add.includes(t)) events.push({ index: 'NDX', symbol: t, removed: date, src: 'Wikipedia' }); }
      else if (/\b(joined|added|entered)\b/i.test(txt)) for (const t of ticks(txt)) events.push({ index: 'NDX', symbol: t, added: date, src: 'Wikipedia' });
      else if (/\b(removed|dropped|left|deleted)\b/i.test(txt)) for (const t of ticks(txt)) events.push({ index: 'NDX', symbol: t, removed: date, src: 'Wikipedia' }); } }
  return { current: [...cur], events };
}

export function createMembership({ db, put, log, inbox, coll, store2, mark }) {
  const INDICES = ['XU030', 'XU050', 'XU100', 'SPX', 'NDX'];
  function bistLists() { const out = { XU030: [], XU050: [], XU100: [] }; for (const [, x] of coll('instruments')) if (x.cls === 'TR_EQ') for (const i of x.idx || []) if (out[i]) out[i].push(x.symbol); for (const k in out) out[k].sort(); return out; }
  const snapshot = () => store2.readSide('membership_snapshot', { lists: {}, date: null });
  // replay events on the current list: members at `date`
  function membersAt(index, date) {
    const snap = snapshot(), cur = new Set(snap.lists[index] || []), ev = store2.membershipRows().filter(r => r.index === index);
    if (!date || date >= today()) return [...cur].sort();
    for (const r of ev.sort((a, b) => ((b.added || b.removed) < (a.added || a.removed) ? -1 : 1))) { const d = r.added || r.removed; if (d <= date) continue; if (r.added) cur.delete(r.symbol); if (r.removed) cur.add(r.symbol); }
    return [...cur].sort();
  }
  function summary(note) {
    const snap = snapshot(), rows = store2.membershipRows(), ind = {};
    for (const i of INDICES) { const ev = rows.filter(r => r.index === i), dates = ev.map(r => r.added || r.removed).sort(); ind[i] = { count: (snap.lists[i] || []).length, from: dates[0] || snap.date || null, events: ev.length }; }
    put('membership/summary', { indices: ind, updatedAt: new Date().toISOString(), snapshotAt: snap.date, note: note || 'BIST membership is recorded as forward snapshots (diffed on every universe refresh); S&P 500 and Nasdaq-100 history from Wikipedia where it could be parsed.' });
  }
  // record current lists and diff against the previous snapshot -> events
  function recordSnapshot(lists, src = 'snapshot') {
    const prev = snapshot(), day = today(), events = [], merged = { ...prev.lists };
    for (const [idx, list] of Object.entries(lists)) { if (!Array.isArray(list) || !list.length) continue; const before = new Set(prev.lists[idx] || []), now = new Set(list);
      if (before.size) { for (const s of now) if (!before.has(s)) events.push({ index: idx, symbol: s, added: day, src }); for (const s of before) if (!now.has(s)) events.push({ index: idx, symbol: s, removed: day, src }); }
      merged[idx] = [...now].sort(); }
    const n = store2.appendMembership(events); store2.writeSide('membership_snapshot', { lists: merged, date: day, prevDate: prev.date || null });
    return { events: n, indices: Object.keys(lists).filter(k => (lists[k] || []).length) };
  }
  let running = null;
  function stale(days) { const s = db.docs['membership/summary']; return !s || !s.updatedAt || (Date.now() - new Date(s.updatedAt)) / 864e5 > days; }
  async function refresh(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const lists = bistLists(), fails = []; let hist = 0;
      for (const [name, url, parse, idx] of [['S&P 500', 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', parseSP500, 'SPX'], ['Nasdaq-100', 'https://en.wikipedia.org/wiki/Nasdaq-100', parseNDX, 'NDX']]) {
        try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error('HTTP ' + r.status); const html = await r.text(); const p = parse(html);
          if (p.current.length >= (idx === 'SPX' ? 400 : 80)) lists[idx] = p.current; else fails.push(`${name}: only ${p.current.length} constituents parsed`);
          if (p.events.length) hist += store2.appendMembership(p.events); else log(`membership: no historical changes parsed from ${name}`); store2.saveRaw('wikipedia-' + idx, { current: p.current.length, events: p.events.length }); }
        catch (e) { fails.push(`${name}: ${errMsg(e)}`); }
      }
      const snap = recordSnapshot(lists);
      const note = `snapshot ${snap.indices.join(', ') || 'none'}; ${snap.events} membership changes, ${hist} historical events${fails.length ? '; failed: ' + fails.join('; ') : ''}`;
      summary(); mark('Index membership', snap.indices.length > 0, fails.join('; ') || null, { rows: snap.events + hist, partial: fails.length > 0 && snap.indices.length > 0 });
      log(`membership (${reason}): ${note}`); return { ...snap, hist, fails, note };
    })().finally(() => { running = null; });
    return running;
  }
  return { refresh, stale, membersAt, recordSnapshot, summary, bistLists };
}
