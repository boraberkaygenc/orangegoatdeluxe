// GNC Terminal — broker research collector (runs inside server.mjs).
// Sources: hedeffiyat.com.tr (every broker's published target price and rating, per stock),
// İş Yatırım research feed (arastirma.isyatirim.com.tr, RSS). Weekly takeaways arrive as a JSON file
// dropped into the app's "digests" folder (made by the weekly Claude task) or imported from the Reports window.
import fs from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' };
const HF = 'https://hedeffiyat.com.tr';
const MONTHS = { ocak: 1, şubat: 2, subat: 2, mart: 3, nisan: 4, mayıs: 5, mayis: 5, haziran: 6, temmuz: 7, ağustos: 8, agustos: 8, eylül: 9, eylul: 9, ekim: 10, kasım: 11, kasim: 11, aralık: 12, aralik: 12 };
const RATING_LINE = /^(güçlü al|al|tut|sat|endeks üstü get(\.|iri)?|endeksin üzerinde getiri|endekse paralel get(\.|iri)?|end\. paralel get\.?|endeks paralel get(\.|iri)?|endeks altı get(\.|iri)?|end\. altı get\.?|endeksin altında getiri|end\. üstü get\.?|tavsiye yok|nötr|notr|ağırlığı artır|ağırlığı azalt|endeksin üzerinde|endeksin altında|outperform|underperform|market perform|buy|hold|sell|overweight|underweight|neutral|değerlendirme dışı|gözden geçiriliyor|kademeli al)$/i;
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function decode(s) { return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, '’').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/gi, ' '); }
function htmlLines(h) {
  return decode(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li|tr|td|th|span|a|h\d|small|strong|b|label)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}
export function parseNum(s) { if (s == null) return null; let t = String(s).replace(/[^\d.,-]/g, ''); if (!t) return null;
  const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.');
  if (lc > -1 && ld > -1) t = lc > ld ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (lc > -1) t = /,\d{3}$/.test(t) && t.split(',').length > 2 ? t.replace(/,/g, '') : t.replace(',', '.');
  else if (ld > -1 && t.split('.').length > 2) t = t.replace(/\./g, '');
  const v = parseFloat(t); return isFinite(v) ? v : null; }
function trDate(s) { const m = String(s).toLowerCase().match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(\d{4})/); if (m) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const n = String(s).match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/); return n ? `${n[3]}-${n[2].padStart(2, '0')}-${n[1].padStart(2, '0')}` : null; }
export function canonBroker(n) { return String(n || '').replace(/\s+/g, ' ').trim().replace(/\s+Yatırım Menkul Değerler(\s+A\.?Ş\.?)?$/i, ' Yatırım').replace(/\s+A\.?Ş\.?$/i, '').trim(); }
function slugName(slug) { return slug.replace(/-\d+$/, '').split('-').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' '); }

// Split a hedeffiyat page into broker entries (each entry starts at a /kurum/ link) and read the fields from each.
export function parseHedefFiyat(html, fixedSym) {
  const re = /<a[^>]+href="(?:https?:\/\/(?:www\.)?hedeffiyat\.com\.tr)?\/kurum\/([^"?#]+)"[^>]*>/gi, marks = [];
  let m; while ((m = re.exec(html))) marks.push({ i: m.index, slug: m[1] });
  const merged = []; for (const k of marks) { const last = merged[merged.length - 1]; if (last && last.slug === k.slug && k.i - last.i < 1500) continue; merged.push(k); }
  const out = [];
  for (let j = 0; j < merged.length; j++) {
    const chunk = html.slice(merged[j].i, j + 1 < merged.length ? merged[j + 1].i : Math.min(html.length, merged[j].i + 6000));
    const alt = (chunk.slice(0, 800).match(/(?:alt|title)="([^"]{3,60})"/i) || [])[1];
    const lines = htmlLines(chunk);
    const first = lines[0] && !/[\d₺]| - /.test(lines[0]) && lines[0].length < 60 ? lines[0] : null;
    const broker = canonBroker((alt && !/hedef|logo/i.test(alt) ? decode(alt).trim() : null) || first || slugName(merged[j].slug));
    let sym = fixedSym || null; if (!sym) { const t = lines.join(' ').match(/\b([A-ZÇĞİÖŞÜ0-9]{3,6})\s+-\s+\S/); if (t) sym = t[1].replace(/İ/g, 'I'); }
    let target = null; for (let i = 0; i < lines.length; i++) if (/hedef fiyat/i.test(lines[i])) { for (let k = i; k < Math.min(lines.length, i + 4); k++) { const v = parseNum((lines[k].match(/([\d.,]+)\s*(₺|TL)?/) || [])[1]); if (v && v > 0) { target = v; break; } } if (target) break; }
    if (!target) { const t = lines.find(l => /[\d.,]+\s*(₺|TL)\b/.test(l)); if (t) target = parseNum(t.match(/([\d.,]+)\s*(₺|TL)/)[1]); }
    const rating = (lines.find(l => RATING_LINE.test(l)) || '').trim();
    const date = trDate(lines.find(l => trDate(l)) || '');
    let prev = null; const tip = decode(chunk).match(/([\d.,]+)\s*(?:₺|TL)?\s*['’]?\s*(?:den|dan|ten|tan)\b[^\d]{0,60}?([\d.,]+)/i);
    if (tip) { const a = parseNum(tip[1]), b = parseNum(tip[2]); if (a && b && target && Math.abs(b / target - 1) < 0.01 && Math.abs(a / target - 1) > 0.001) prev = a; }
    if (sym && target && date) out.push({ sym, broker, date, target, rating, prev });
  }
  return out;
}
function parseSenetLinks(html) { const map = {}; const re = /href="(?:https?:\/\/(?:www\.)?hedeffiyat\.com\.tr)?(\/senet\/([a-z0-9]{3,6})-[^"?#]+)"/gi; let m; while ((m = re.exec(html))) map[m[2].toUpperCase()] = HF + m[1]; return map; }
function parseRSS(xml) {
  const items = []; const re = /<item>([\s\S]*?)<\/item>/gi; let m;
  const tag = (s, t) => { const x = s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i')); return x ? x[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : ''; };
  while ((m = re.exec(xml))) {
    const it = m[1], title = decode(tag(it, 'title')), link = tag(it, 'link'), pub = tag(it, 'pubDate'), body = tag(it, 'content:encoded') || tag(it, 'description');
    const text = htmlLines(body).join(' ').slice(0, 4000), tick = [...new Set([...(title + ' ' + text).matchAll(/\b([A-Z]{4,6})\.IS\b/g)].map(x => x[1]))];
    const d = pub ? new Date(pub) : null;
    items.push({ title, link, date: d && !isNaN(d) ? d.toISOString().slice(0, 10) : null, tickers: tick, summary: text.slice(0, 400), cats: [...it.matchAll(/<category>(?:<!\[CDATA\[)?([^<\]]+)/gi)].map(x => x[1].trim()) });
    // İş Yatırım company notes often state the rating and target in the text
    if (tick.length === 1) { const tp = text.match(/hedef (?:pay )?fiyat(?:ımız|ımızı|ı)?[^0-9]{0,40}([\d.,]+)\s*(TL|₺)/i), rt = text.match(/\b(AL|TUT|SAT|ENDEKS(?:İN)? ÜZERİNDE GETİRİ|ENDEKSE PARALEL GETİRİ|ENDEKS(?:İN)? ALTINDA GETİRİ)\b/);
      if (tp && items[items.length - 1].date) items[items.length - 1].obs = { sym: tick[0], broker: 'İş Yatırım', date: items[items.length - 1].date, target: parseNum(tp[1]), rating: rt ? rt[1][0] + rt[1].slice(1).toLowerCase() : '', prev: null }; }
  }
  return items;
}
async function get(url, ms = 20000) { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }

export function createResearch({ dir, db, put, log, ist, inbox, E }) {
  const DIG = path.join(dir, 'digests'); fs.mkdirSync(DIG, { recursive: true });
  const doc = () => db.docs['research/main'] || { obs: [], feed: [], senet: {}, updatedAt: null };
  function addObs(r, o) {
    if (!o || !o.sym || !o.target || !o.date) return false;
    o = { ...o, broker: canonBroker(o.broker) };
    const key = [o.sym, o.broker, o.date, +o.target, o.rating || ''].join('|');
    if (!r._keys) r._keys = new Set(r.obs.map(x => [x[0], x[1], x[2], +x[3], x[4] || ''].join('|')));
    if (r._keys.has(key)) return false;
    r._keys.add(key); r.obs.push([o.sym, o.broker, o.date, +o.target, o.rating || '', o.prev || null, new Date().toISOString()]); return true;
  }
  let running = null;
  async function collect(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const t0 = Date.now(), r = { ...doc() }; r.obs = [...(r.obs || [])]; r.senet = { ...(r.senet || {}) };
      let added = 0, pages = 0; const fails = [];
      // 1. hedeffiyat: home (latest notes for every stock) + sitemap (stock page addresses)
      try { const h = await get(HF + '/'); Object.assign(r.senet, parseSenetLinks(h)); for (const o of parseHedefFiyat(h)) if (addObs(r, o)) added++; pages++; } catch (e) { fails.push('hedeffiyat home: ' + errMsg(e)); }
      try { const s = await get(HF + '/sitemap.xml'); for (const m of s.matchAll(/<loc>(https?:\/\/[^<]*\/senet\/([a-z0-9]{3,6})-[^<]+)<\/loc>/gi)) r.senet[m[2].toUpperCase()] = m[1]; } catch (e) { fails.push('sitemap: ' + errMsg(e)); }
      // 2. one page per BIST stock in the universe (all brokers' latest target and rating)
      const universe = Object.entries(db.docs).filter(([k, x]) => k.startsWith('instruments/') && x.cls === 'TR_EQ').map(([, x]) => x.symbol);
      for (const sym of universe) {
        const url = r.senet[sym]; if (!url) continue;
        try { const h = await get(url); Object.assign(r.senet, parseSenetLinks(h)); for (const o of parseHedefFiyat(h, sym)) if (addObs(r, o)) added++; pages++; } catch (e) { fails.push(sym + ': ' + errMsg(e)); }
        await sleep(1200);
      }
      // 3. İş Yatırım research feed
      try { const x = await get('https://arastirma.isyatirim.com.tr/feed/'); const items = parseRSS(x); const seen = new Set((r.feed || []).map(f => f.link));
        r.feed = [...items.filter(i => !seen.has(i.link)).map(({ obs, ...i }) => i), ...(r.feed || [])].slice(0, 300); for (const i of items) if (i.obs && addObs(r, i.obs)) added++; } catch (e) { fails.push('isyatirim feed: ' + errMsg(e)); }
      // keep 400 days of observations
      const cut = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10); r.obs = r.obs.filter(o => o[2] >= cut); delete r._keys;
      const covered = universe.filter(s => r.senet[s]).length;
      r.updatedAt = new Date().toISOString(); r.note = `${added} new broker notes; ${pages} pages read; ${covered} of ${universe.length} BIST stocks have a hedeffiyat page${fails.length ? '; failed: ' + fails.slice(0, 6).join('; ') : ''}`;
      if (!pages && fails.length) r.error = fails.slice(0, 3).join('; '); else delete r.error;
      put('research/main', r);
      if (!pages && fails.length) inbox('bad', 'Broker research update failed', `No research page could be read (${reason}). ${fails.slice(0, 3).join('; ')}. The app keeps the previous ratings and targets.`, 'research');
      log(`research (${reason}): ${r.note} in ${Math.round((Date.now() - t0) / 1000)}s`);
      try { buildDigest(reason); } catch (e) { log('digest build failed:', e.message); }
    })().finally(() => { running = null; });
    return running;
  }
  // weekly digest files dropped into ./digests
  function importDigests() {
    const r = db.docs['research/digest-meta'] || { imported: [] };
    for (const f of fs.readdirSync(DIG).filter(f => f.toLowerCase().endsWith('.json'))) {
      if (r.imported.includes(f)) continue;
      try { const d = JSON.parse(fs.readFileSync(path.join(DIG, f), 'utf8')); if (!d || !d.date || !Array.isArray(d.takeaways)) throw new Error('not a GNC digest');
        const cur = db.docs['research/digest']; if (!cur || (cur.date || '') <= d.date) put('research/digest', d); put('research_digests/' + d.date, d);
        if (Array.isArray(d.targets)) { const rr = { ...doc() }; rr.obs = [...(rr.obs || [])]; let n = 0; for (const t of d.targets) if (addObs(rr, { sym: t[0], broker: t[1], date: t[2], target: t[3], rating: t[4], prev: t[5] })) n++; delete rr._keys; if (n) put('research/main', rr); }
        inbox('good', 'Weekly broker takeaways imported', d.headline || `Digest of ${d.date}`, 'research'); log('digest imported:', f);
      } catch (e) { log('digest import failed:', f, e.message); }
      r.imported.push(f); put('research/digest-meta', r);
    }
  }
  // automatic digest: highlights built from the collected targets and ratings (no Claude needed); the weekly Claude file, when present, adds its own takeaways
  function buildDigest(reason = 'schedule') {
    if (!E) return null; const r = doc(), today = ist().date, inst = {}; for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/')) inst[x.symbol] = { ...x, e: { price: x.price } };
    const held = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings')) for (const h of (v.items || [])) held.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) if (p.status !== 'closed') for (const l of (p.lines || [])) held.add(l.symbol); if (k.endsWith('/basket')) for (const b of (v.items || [])) held.add(b.symbol); }
    const latest = E.brokerLatest(r.obs || [], today, 400), week = latest.filter(l => (new Date(today) - new Date(l.date)) / 864e5 <= 7), cons = E.consensus(r, inst, today);
    if (!latest.length) return null;
    const chg = l => l.prevTarget && l.target ? (l.target / l.prevTarget - 1) * 100 : null;
    const raised = week.filter(l => chg(l) > 0.5).sort((a, b) => chg(b) - chg(a)), cut = week.filter(l => chg(l) < -0.5).sort((a, b) => chg(a) - chg(b));
    const upg = week.filter(l => l.prevRating && l.prevRating !== 'none' && l.rating !== 'none' && E.normRating(l.ratingText) !== l.prevRating && ({ sell: 0, hold: 1, buy: 2 })[l.rating] > ({ sell: 0, hold: 1, buy: 2 })[l.prevRating]);
    const dng = week.filter(l => l.prevRating && l.prevRating !== 'none' && l.rating !== 'none' && l.rating !== l.prevRating && ({ sell: 0, hold: 1, buy: 2 })[l.rating] < ({ sell: 0, hold: 1, buy: 2 })[l.prevRating]);
    const byBroker = {}; for (const l of week) byBroker[l.broker] = (byBroker[l.broker] || 0) + 1; const active = Object.entries(byBroker).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const strong = Object.values(cons).filter(c => c.rated >= 3 && c.upside !== null && c.buyPct >= 60).sort((a, b) => b.upside - a.upside).slice(0, 6);
    const weak = Object.values(cons).filter(c => c.rated >= 3 && c.upside !== null && (c.upside < 5 || c.sell >= 2)).sort((a, b) => a.upside - b.upside).slice(0, 4);
    const pct = v => (v > 0 ? '+' : '') + v.toFixed(1) + '%', f2 = v => v === null || v === undefined ? '—' : (+v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const takeaways = [];
    takeaways.push(`${week.length} broker note${week.length === 1 ? '' : 's'} on ${new Set(week.map(l => l.sym)).size} BIST stocks in the last 7 days: ${raised.length} target${raised.length === 1 ? '' : 's'} raised, ${cut.length} cut, ${upg.length} upgrade${upg.length === 1 ? '' : 's'}, ${dng.length} downgrade${dng.length === 1 ? '' : 's'}.`);
    if (raised.length) takeaways.push('Largest target raises: ' + raised.slice(0, 5).map(l => `${l.sym} ${f2(l.prevTarget)} → ${f2(l.target)} (${pct(chg(l))}, ${l.broker})`).join('; ') + '.');
    if (cut.length) takeaways.push('Largest target cuts: ' + cut.slice(0, 5).map(l => `${l.sym} ${f2(l.prevTarget)} → ${f2(l.target)} (${pct(chg(l))}, ${l.broker})`).join('; ') + '.');
    if (upg.length) takeaways.push('Upgrades: ' + upg.map(l => `${l.sym} to ${l.ratingText || l.rating} (${l.broker})`).join('; ') + '.');
    if (dng.length) takeaways.push('Downgrades: ' + dng.map(l => `${l.sym} to ${l.ratingText || l.rating} (${l.broker})`).join('; ') + '.');
    if (strong.length) takeaways.push('Strongest consensus (3+ ratings, 60%+ Buy): ' + strong.map(c => `${c.sym} ${Math.round(c.buyPct)}% Buy, average target ${f2(c.avg)} (${pct(c.upside)} upside)`).join('; ') + '.');
    if (weak.length) takeaways.push('Little upside or Sell ratings: ' + weak.map(c => `${c.sym} (${pct(c.upside)}, ${c.sell} Sell)`).join('; ') + '.');
    if (active.length) takeaways.push('Most active brokers this week: ' + active.map(([b, n]) => `${b} (${n})`).join(', ') + '.');
    const symbols = [...held].filter(s => cons[s]).map(s => { const c = cons[s], last = c.brokers[0]; return { symbol: s, text: `${c.rated} rating${c.rated === 1 ? '' : 's'}: ${c.buy} Buy / ${c.hold} Hold / ${c.sell} Sell; average target ${f2(c.avg)} (${pct(c.upside)} from ${f2(c.price)})${last ? '; latest ${last.broker} ${last.date}: ${last.ratingText || last.rating} ${f2(last.target)}' : ''}${c.down30 || c.dng30 ? '; ' + (c.down30 ? c.down30 + ' target cut(s)' : '') + (c.dng30 ? (c.down30 ? ', ' : '') + c.dng30 + ' downgrade(s)' : '') + ' in 30 days' : ''}.`, source: 'auto' }; });
    const headline = `${week.length} broker notes this week: ${raised.length} targets raised, ${cut.length} cut; ${strong.length ? 'strongest consensus ' + strong.slice(0, 3).map(c => c.sym).join(', ') : 'no strong consensus'}.`;
    const d = { date: today, headline, takeaways, symbols, macro: [], source: 'auto', generatedAt: new Date().toISOString(), weekNotes: week.length };
    const cur = db.docs['research/digest'];
    if (!cur || cur.source === 'auto' || (cur.date || '') < today) put('research/digest', cur && cur.source !== 'auto' && (cur.date || '') >= today ? cur : d);
    put('research_digests/' + today + (cur && cur.source !== 'auto' && cur.date === today ? '-auto' : ''), d);
    log(`digest built (${reason}): ${headline}`); return d;
  }
  return { collect, importDigests, buildDigest, stale: h => { const u = doc().updatedAt; return !u || (Date.now() - new Date(u)) / 36e5 > h; } };
}
