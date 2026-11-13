// GNC Terminal — corporate actions: dividends and splits from Yahoo chart events (held symbols only, range=2y, once a day
// after the full refresh) plus manual entries (bedelli / rights issues, bedelsiz / bonus issues, splits, dividends) posted by the
// page. Writes corporate/main = { items: [{ id, symbol, type, date, ratio?, amount?, price?, ccy?, source, note?, addedAt }],
// updatedAt, note, held }. Types: 'dividend' (amount = gross per share, in the instrument's currency), 'split' (ratio = new shares
// per old share, e.g. 2 for a 2-for-1), 'bonus' (ratio = free new shares per old share, e.g. 1.5 for a 150% bedelsiz),
// 'rights' (ratio = new shares per old share offered, price = subscription price per share; assumed exercised).
import { yahooSymbol, errMsg } from './data.mjs';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'application/json,text/plain,*/*' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const TYPES = ['dividend', 'split', 'bonus', 'rights'];
const DTF = new Map();
const dateIn = (ts, tz) => { const z = tz || 'Europe/Istanbul'; let f = DTF.get(z); if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }); DTF.set(z, f); } return f.format(new Date(ts * 1000)); };

// "2:1" -> 2, "1:10" -> 0.1, "150%" -> 1.5, 2 -> 2; null when unreadable
export function parseRatio(r) {
  if (typeof r === 'number') return isFinite(r) && r > 0 ? r : null; const s = String(r ?? '').trim().replace(',', '.'); if (!s) return null;
  let m = s.match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/); if (m) return +m[2] > 0 && +m[1] > 0 ? +m[1] / +m[2] : null;
  m = s.match(/^(\d+(?:\.\d+)?)\s*%$/); if (m) return +m[1] > 0 ? +m[1] / 100 : null;
  return isFinite(+s) && +s > 0 ? +s : null;
}
// Yahoo chart events -> [{symbol, type, date, amount|ratio, ccy}]
export function eventsFromChart(json, symbol, ccy) {
  const res = json && json.chart && json.chart.result && json.chart.result[0]; if (!res) return [];
  const tz = res.meta && res.meta.exchangeTimezoneName, ev = res.events || {}, out = [];
  for (const d of Object.values(ev.dividends || {})) if (d && d.amount > 0 && d.date) out.push({ symbol, type: 'dividend', date: dateIn(d.date, tz), amount: +(+d.amount).toFixed(6), ccy: ccy || (res.meta && res.meta.currency) || null });
  for (const s of Object.values(ev.splits || {})) { if (!s || !s.date) continue; const ratio = s.numerator > 0 && s.denominator > 0 ? s.numerator / s.denominator : parseRatio(s.splitRatio); if (ratio && Math.abs(ratio - 1) > 1e-9) out.push({ symbol, type: 'split', date: dateIn(s.date, tz), ratio: +ratio.toFixed(8), note: s.splitRatio || null }); }
  return out;
}
export const actionId = a => `${a.source || 'manual'}:${a.symbol}:${a.type}:${a.date}`;
const near = (a, b, days) => Math.abs(new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) <= days * 864e5;
// merge fresh Yahoo events into the stored list: manual entries win; a Yahoo split within 5 days of a manual split/bonus of the same
// symbol is dropped (Yahoo often reports a BIST bedelsiz as a split), and so is a Yahoo dividend within 3 days of a manual one
export function mergeActions(stored, fresh) {
  const manual = (stored || []).filter(a => a.source === 'manual'), byId = new Map((stored || []).map(a => [a.id, a]));
  for (const f of fresh || []) { const a = { ...f, source: 'yahoo' }; a.id = actionId(a); if (byId.has(a.id)) { byId.set(a.id, { ...byId.get(a.id), ...a }); continue; } byId.set(a.id, { ...a, addedAt: new Date().toISOString() }); }
  const out = [...byId.values()].filter(a => a.source === 'manual' || !manual.some(m => m.symbol === a.symbol && ((a.type === 'split' && (m.type === 'split' || m.type === 'bonus') && near(m.date, a.date, 5)) || (a.type === 'dividend' && m.type === 'dividend' && near(m.date, a.date, 3)))));
  return out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.symbol < b.symbol ? -1 : 1));
}
// validate a manual entry from POST /api/corporate; returns { item } or { error }
export function validateManual(b, known) {
  if (!b || typeof b !== 'object') return { error: 'body must be JSON' };
  const symbol = String(b.symbol || '').trim().toUpperCase(), type = String(b.type || '').toLowerCase(), date = String(b.date || '');
  if (!/^[A-Z0-9][\w.\-\/]{0,15}$/.test(symbol)) return { error: 'symbol missing or malformed' };
  if (known && !known(symbol)) return { error: symbol + ' is not in the universe' };
  if (!TYPES.includes(type)) return { error: "type must be one of 'dividend', 'bonus', 'rights', 'split'" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'date must be YYYY-MM-DD (the ex-date)' };
  const it = { symbol, type, date, source: 'manual', addedAt: new Date().toISOString() };
  if (type === 'dividend') { const amt = +String(b.amount ?? '').replace(',', '.'); if (!(amt > 0)) return { error: 'amount (gross per share) must be positive' }; it.amount = amt; if (b.ccy) it.ccy = String(b.ccy).toUpperCase().slice(0, 3); }
  else { const r = parseRatio(b.ratio); if (!r) return { error: 'ratio must be positive (e.g. 2 or "2:1" for a split, 1.5 or "150%" for a 150% bonus issue)' }; if (type === 'split' && Math.abs(r - 1) < 1e-9) return { error: 'a split ratio of 1 changes nothing' }; it.ratio = r;
    if (type === 'rights') { const p = +String(b.price ?? 1).replace(',', '.'); if (!(p > 0)) return { error: 'price (subscription price per share) must be positive' }; it.price = p; } }
  if (b.note) it.note = String(b.note).slice(0, 200);
  it.id = actionId(it); return { item: it };
}

export function createCorporate({ db, put, log, mark }) {
  const doc = () => db.docs['corporate/main'] || { items: [], updatedAt: null };
  const instOf = s => db.docs['instruments/' + String(s).replace('/', '_')];
  function heldSymbols() { const s = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings')) for (const h of (v.items || [])) s.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) if (p.status !== 'closed') for (const l of (p.lines || [])) if (!l.closed) s.add(l.symbol); } return [...s].filter(Boolean); }
  async function chartEvents(ysym) { let lastErr; for (const host of ['query1', 'query2']) { try { const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ysym)}?range=2y&interval=1mo&events=div,splits`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } catch (e) { lastErr = e; } } throw lastErr; }
  let running = null;
  async function update(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const syms = heldSymbols(), fresh = [], fails = []; let n = 0;
      for (const s of syms) { const x = instOf(s); if (!x || x.cls === 'TEFAS' || x.cls === 'MACRO') continue; const ys = yahooSymbol(x); if (!ys) continue;
        try { const j = await chartEvents(ys); fresh.push(...eventsFromChart(j, s, x.ccy)); n++; } catch (e) { fails.push(s + ': ' + errMsg(e)); } await sleep(250); }
      const items = mergeActions(doc().items, fresh), note = `${n} held symbols checked, ${fresh.length} events${fails.length ? '; failed: ' + fails.slice(0, 5).join('; ') : ''}`;
      put('corporate/main', { items, updatedAt: new Date().toISOString(), note, held: syms });
      if (mark) try { mark('Corporate actions', fails.length < Math.max(1, n), fails.length ? fails[0] : null, { rows: items.length, partial: !!fails.length && n > 0 }); } catch (e) { }
      log(`corporate (${reason}): ${note}`); return { checked: n, events: fresh.length, items: items.length, fails: fails.length };
    })().finally(() => { running = null; });
    return running;
  }
  function addManual(body) { const known = s => !!instOf(s); const v = validateManual(body, known); if (v.error) return v; const cur = doc(), items = (cur.items || []).filter(a => a.id !== v.item.id); items.push(v.item);
    put('corporate/main', { ...cur, items: mergeActions(items, []), updatedAt: cur.updatedAt || null, manualAt: new Date().toISOString() }); return { item: v.item }; }
  function remove(id) { const cur = doc(), items = (cur.items || []).filter(a => a.id !== id); if (items.length === (cur.items || []).length) return false; put('corporate/main', { ...cur, items, manualAt: new Date().toISOString() }); return true; }
  return { update, addManual, remove, doc, heldSymbols, isRunning: () => !!running, stale: h => { const u = doc().updatedAt; return !u || (Date.now() - new Date(u)) / 36e5 > h; } };
}
