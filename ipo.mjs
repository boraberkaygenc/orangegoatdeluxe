// GNC Terminal — IPO tracker. BIST: halkarz.com (RSS feed and front page); US: Nasdaq IPO calendar API.
// Writes ipo/main = { bist: [...], us: [...], updatedAt, note }. New BIST listings get an inbox note.
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' };
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MONTHS = { ocak: 1, şubat: 2, subat: 2, mart: 3, nisan: 4, mayıs: 5, mayis: 5, haziran: 6, temmuz: 7, ağustos: 8, agustos: 8, eylül: 9, eylul: 9, ekim: 10, kasım: 11, kasim: 11, aralık: 12, aralik: 12 };
function decode(s) { return String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, '’').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/gi, ' '); }
function text(h) { return decode(String(h || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ')).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n'); }
const tag = (s, t) => { const x = s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i')); return x ? x[1].trim() : ''; };
function num(s) { if (s == null) return null; let t = String(s).replace(/[^\d.,-]/g, ''); if (!t) return null; const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.'); if (lc > -1 && ld > -1) t = lc > ld ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, ''); else if (lc > -1) t = t.replace(',', '.'); const v = parseFloat(t); return isFinite(v) ? v : null; }
function trDates(s) { // "12-13 Kasım 2026", "12 Kasım 2026", "12.11.2026"
  const out = []; const t = String(s).toLowerCase();
  for (const m of t.matchAll(/(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(\d{4})/g)) { const mo = String(MONTHS[m[3]]).padStart(2, '0'); out.push(`${m[4]}-${mo}-${m[1].padStart(2, '0')}`); if (m[2]) out.push(`${m[4]}-${mo}-${m[2].padStart(2, '0')}`); }
  for (const m of t.matchAll(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g)) out.push(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
  return [...new Set(out)].sort();
}
function parseBistItem(title, body, link, pub) {
  const t = text(body), all = title + '\n' + t;
  const code = (all.match(/\b(?:Kod|BIST Kodu|Borsa Kodu|Hisse Kodu)\s*[:：]?\s*([A-Z0-9]{4,6})\b/) || all.match(/\(([A-Z]{4,6})\)/) || [])[1] || null;
  const price = num((all.match(/(?:halka arz|arz) fiyat[ıi]?[^0-9]{0,30}([\d.,]+)\s*(?:TL|₺)/i) || all.match(/([\d.,]+)\s*(?:TL|₺)\s*(?:'den|'dan|den|dan)?\s*(?:fiyat|halka arz)/i) || [])[1]);
  const range = all.match(/([\d.,]+)\s*(?:TL|₺)?\s*[-–]\s*([\d.,]+)\s*(?:TL|₺)/i);
  const broker = (all.match(/(?:Aracı Kurum|Konsorsiyum Lideri|Lider Aracı Kurum)\s*[:：]?\s*([^\n]{3,60})/i) || [])[1];
  const dates = trDates((all.match(/(?:Talep Toplama|Halka Arz Tarih[ıi]|Tarih)[^\n]{0,80}/gi) || []).join(' ') || all);
  const listDate = (all.match(/(?:İşlem Görme|Borsada İşlem|işlem görmeye)[^\n]{0,60}/i) || [''])[0];
  const size = (all.match(/(?:Halka Arz Büyüklüğü|Arz Büyüklüğü|Büyüklük)\s*[:：]?\s*([\d.,]+\s*(?:milyon|milyar)?\s*(?:TL|₺)?)/i) || [])[1];
  const lot = (all.match(/(?:Lot|Pay Adedi|Halka Arz Edilecek Pay)\s*[:：]?\s*([\d.,]+(?:\s*(?:milyon|adet|lot))?)/i) || [])[1];
  const method = (all.match(/(sabit fiyat|fiyat aralığı|borsada satış|talep toplama)/i) || [])[1];
  return { market: 'BIST', code, name: decode(title).replace(/\s*halka arz.*$/i, '').trim() || decode(title), title: decode(title), link, published: pub, price: price || (range ? num(range[1]) : null), priceHigh: range ? num(range[2]) : null, broker: broker ? broker.trim() : null, dates, bookStart: dates[0] || null, bookEnd: dates[1] || dates[0] || null, listDate: trDates(listDate)[0] || null, size: size ? size.trim() : null, lot: lot ? lot.trim() : null, method: method || null, summary: t.split('\n').slice(0, 6).join(' ').slice(0, 400) };
}
async function get(url, opt = {}) { const r = await fetch(url, { headers: { ...UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(25000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return opt.json ? r.json() : r.text(); }

export function createIpo({ db, put, log, inbox, ist, yahooQuotes }) {
  const doc = () => db.docs['ipo/main'] || { bist: [], us: [], updatedAt: null };
  let running = null;
  async function update(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const cur = doc(), fails = [], today = ist().date; let bist = [...(cur.bist || [])], us = [...(cur.us || [])];
      // --- BIST: halkarz.com RSS, then the front page ---
      try { const xml = await get('https://halkarz.com/feed/'); let n = 0;
        for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) { const it = m[1], title = decode(tag(it, 'title')), link = decode(tag(it, 'link')), pub = tag(it, 'pubDate'), body = tag(it, 'content:encoded') || tag(it, 'description');
          if (!/halka arz|arz/i.test(title + body)) continue; const d = pub ? new Date(pub) : null; const item = parseBistItem(title, body, link, d && !isNaN(d) ? d.toISOString().slice(0, 10) : null);
          const i = bist.findIndex(b => b.link === link || (item.code && b.code === item.code)); if (i >= 0) bist[i] = { ...bist[i], ...Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length))) }; else { bist.unshift({ ...item, firstSeen: today }); n++; } }
        log(`ipo: halkarz feed ${n} new`); } catch (e) { fails.push('halkarz feed: ' + errMsg(e)); }
      try { const h = await get('https://halkarz.com/'); let n = 0;
        for (const m of h.matchAll(/<(?:article|li|div)[^>]*class="[^"]*(?:halkarz|ipo|post|entry)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|li|div)>/gi)) { const block = m[1]; const a = block.match(/<a[^>]+href="(https?:\/\/(?:www\.)?halkarz\.com\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/i); if (!a) continue; const title = text(a[2]).split('\n')[0]; if (!title || title.length < 4) continue;
          const item = parseBistItem(title, block, a[1], null); if (!item.code && !item.price && !item.dates.length) continue; const i = bist.findIndex(b => b.link === a[1] || (item.code && b.code === item.code)); if (i >= 0) bist[i] = { ...bist[i], ...Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length))) }; else { bist.unshift({ ...item, firstSeen: today }); n++; } }
        if (n) log(`ipo: halkarz page ${n} new`); } catch (e) { fails.push('halkarz page: ' + errMsg(e)); }
      // --- US: Nasdaq calendar for this month and next ---
      try { const now = new Date(), months = [0, 1].map(k => { const d = new Date(now.getFullYear(), now.getMonth() + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }); const seen = new Map(us.map(u => [u.key, u]));
        for (const mo of months) { const j = await get(`https://api.nasdaq.com/api/ipo/calendar?date=${mo}`, { json: true, headers: { Accept: 'application/json, text/plain, */*', Origin: 'https://www.nasdaq.com', Referer: 'https://www.nasdaq.com/' } }); const d = j && j.data; if (!d) throw new Error('no data');
          const rows = (k, status) => (((d[k] || {})[k === 'upcoming' ? 'upcomingTable' : k] || d[k] || {}).rows || []).map(r => ({ market: 'US', status, key: (r.proposedTickerSymbol || r.companyName) + '|' + (r.expectedPriceDate || r.pricedDate || mo), code: r.proposedTickerSymbol || null, name: r.companyName, exchange: r.proposedExchange || null, price: num(r.proposedSharePrice), shares: r.sharesOffered || null, size: r.dollarValueOfSharesOffered || null, date: r.expectedPriceDate || r.pricedDate || r.filedDate || null, dealId: r.dealID || null }));
          for (const r of [...rows('upcoming', 'upcoming'), ...rows('priced', 'priced'), ...rows('filed', 'filed'), ...rows('withdrawn', 'withdrawn')]) { const prev = seen.get(r.key); seen.set(r.key, { ...(prev || { firstSeen: today }), ...r }); } await sleep(500); }
        us = [...seen.values()].sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1).slice(0, 150); log(`ipo: nasdaq ${us.length} rows`); } catch (e) { fails.push('nasdaq: ' + errMsg(e)); }
      // --- performance after listing (BIST codes that trade on Yahoo; priced US deals) ---
      try { const syms = []; for (const b of bist.slice(0, 40)) if (b.code && b.price && (!b.listDate || b.listDate <= today)) syms.push(b.code + '.IS'); for (const u of us.filter(u => u.status === 'priced' && u.code && u.price).slice(0, 40)) syms.push(u.code);
        if (syms.length && yahooQuotes) { const q = await yahooQuotes(syms); for (const b of bist) if (b.code && q.get(b.code + '.IS')) { const g = q.get(b.code + '.IS'); b.last = g.price; b.lastAt = g.at; b.perf = b.price ? (g.price / b.price - 1) * 100 : null; b.listed = true; } for (const u of us) if (u.code && q.get(u.code)) { const g = q.get(u.code); u.last = g.price; u.lastAt = g.at; u.perf = u.price ? (g.price / u.price - 1) * 100 : null; } } } catch (e) { fails.push('performance: ' + errMsg(e)); }
      bist = bist.slice(0, 120); const out = { bist, us, updatedAt: new Date().toISOString(), note: fails.length ? 'partly updated; failed: ' + fails.join('; ') : 'updated', ok: fails.length < 2 };
      put('ipo/main', out);
      const fresh = bist.filter(b => b.firstSeen === today && (cur.bist || []).length); if (fresh.length) inbox('info', `${fresh.length} new BIST IPO${fresh.length > 1 ? 's' : ''}`, fresh.map(b => `${b.name}${b.code ? ' (' + b.code + ')' : ''}${b.price ? ' at ' + b.price + ' TL' : ''}${b.bookStart ? ', book-building ' + b.bookStart + (b.bookEnd && b.bookEnd !== b.bookStart ? '–' + b.bookEnd : '') : ''}`).join('; ') + '. See Markets › IPO.', 'ipo');
      log(`ipo (${reason}): ${bist.length} BIST, ${us.length} US; ${out.note}`);
    })().finally(() => { running = null; });
    return running;
  }
  return { update, stale: h => { const u = doc().updatedAt; return !u || (Date.now() - new Date(u)) / 36e5 > h; } };
}
