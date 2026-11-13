// GNC Terminal — KAP (Kamuyu Aydınlatma Platformu) disclosures for the BIST symbols you hold, have in funds or in the basket.
// Best effort, two strategies: (A) the JSON disclosure query (POST /tr/api/disclosure/members/byCriteria, then the older
// /tr/api/memberDisclosureQuery), (B) the public RSS feed (/tr/rss). Failure is not fatal: health source 'KAP' is marked and the
// previous items are kept. Writes kap/main = { items, updatedAt, note, ok, strategy } and merges the items into lighthouse/main
// (source 'KAP', category 'kap') — additional to the SPK ≈85% / SEC ≈15% regulator mix, which is not changed.
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8', 'Origin': 'https://www.kap.org.tr', 'Referer': 'https://www.kap.org.tr/tr/' };
const BASE = 'https://www.kap.org.tr';
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
function decode(s) { return String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '’').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
// "02.11.2026 18:45:12" | "2026-11-02T18:45:12" | RFC 822 -> YYYY-MM-DD
export function kapDate(s) { const t = String(s || ''); let m = t.match(/(\d{2})[./](\d{2})[./](\d{4})/); if (m) return `${m[3]}-${m[2]}-${m[1]}`; m = t.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; const d = new Date(t); return isNaN(d) ? null : d.toISOString().slice(0, 10); }
const CLASS = { ODA: 'Special situation', FR: 'Financial report', DG: 'Other', DUY: 'Announcement' };
function kindOf(cls, subject) { const s = String(subject || '').toLowerCase(); if (/finansal rapor|financial report/.test(s)) return 'Financial report'; if (/kar pay|kâr pay|temettü|dividend/.test(s)) return 'Dividend'; if (/sermaye art|bedelsiz|bedelli|capital increase/.test(s)) return 'Capital increase'; if (/pay alım|pay satım|geri alım|buyback/.test(s)) return 'Share transactions'; if (/genel kurul|general assembly/.test(s)) return 'General assembly'; return CLASS[String(cls || '').toUpperCase()] || 'Disclosure'; }
// one tolerant normaliser for both API shapes ({basic:{...}} and flat rows)
export function normaliseApiRow(r) {
  const b = (r && (r.basic || r.disclosureBasic)) || r || {}, idx = b.disclosureIndex ?? b.index ?? r.disclosureIndex ?? r.id;
  const codes = String(b.stockCodes ?? b.stockCode ?? b.relatedStocks ?? r.stockCodes ?? '').split(/[,;\s]+/).map(x => x.trim().toUpperCase()).filter(x => /^[A-Z0-9]{3,6}$/.test(x));
  const title = decode(b.title || b.kapTitle || b.companyTitle || r.kapTitle || ''), subject = decode(b.subject || b.disclosureType || r.subject || ''), summary = decode(b.summary || r.summary || '');
  const date = kapDate(b.publishDate || b.publishedDate || r.publishDate || b.time);
  if (!idx || !date) return null;
  return { id: String(idx), date, symbols: [...new Set(codes)], company: title, subject, summary, cls: b.disclosureClass || r.disclosureClass || null, link: `${BASE}/tr/Bildirim/${idx}` };
}
// RSS item: title "THYAO, THYAOY - TÜRK HAVA YOLLARI A.O. - Özel Durum Açıklaması (Genel)" or similar
export function parseRss(xml) {
  const out = []; for (const m of String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/gi)) { const it = m[1], tag = t => { const x = it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i')); return x ? x[1].trim() : ''; };
    const title = decode(tag('title')), link = decode(tag('link')) || decode(tag('guid')), date = kapDate(tag('pubDate')), desc = decode(tag('description'));
    const parts = title.split(/\s+-\s+/), codes = (parts.length >= 2 ? parts[0] : '').split(/[,\s]+/).map(x => x.trim().toUpperCase()).filter(x => /^[A-Z0-9]{3,6}$/.test(x));
    const idx = (link.match(/Bildirim\/(\d+)/i) || [])[1] || link;
    if (!date || !link) continue;
    out.push({ id: String(idx), date, symbols: [...new Set(codes)], company: parts.length >= 3 ? parts[1] : (parts[0] || ''), subject: parts.length >= 2 ? parts[parts.length - 1] : title, summary: desc.slice(0, 500), cls: null, link: link.startsWith('http') ? link : BASE + link }); }
  return out;
}
// turn normalised disclosures into Lighthouse items, only for the given symbols
export function toLighthouse(rows, symbols, today) {
  const want = new Set(symbols || []), out = [];
  for (const r of rows || []) { if (!r) continue; const syms = r.symbols.filter(s => want.has(s)); if (!syms.length) continue;
    out.push({ source: 'KAP', kind: kindOf(r.cls, r.subject), category: 'kap', title: `${syms.join(', ')} · ${r.subject || 'Disclosure'}${r.company ? ' — ' + r.company : ''}`.slice(0, 220), date: r.date, link: r.link, lang: 'tr', read: true, summary: r.summary || '', outtakes: [], symbols: syms, kapId: r.id, firstSeen: today }); }
  return out;
}
export function mergeIntoLighthouse(lh, kapItems) {
  const cur = lh || { items: [] }, base = (cur.items || []).filter(i => i.source !== 'KAP'), all = [...base, ...(kapItems || [])].sort((a, b) => (b.date || '') < (a.date || '') ? -1 : (b.date || '') > (a.date || '') ? 1 : 0);
  return { ...cur, items: all, mix: { ...(cur.mix || {}), kap: (kapItems || []).length } };
}

export function createKap({ db, put, log, inbox, ist, mark }) {
  const doc = () => db.docs['kap/main'] || { items: [], updatedAt: null };
  function symbols() { const s = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings') || k.endsWith('/basket')) for (const h of (v.items || [])) s.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) if (p.status !== 'closed') for (const l of (p.lines || [])) s.add(l.symbol); }
    return [...s].filter(x => { const i = db.docs['instruments/' + x]; return i && (i.cls === 'TR_EQ' || i.cls === 'TR_ETF'); }); }
  async function strategyApi(from, to) {
    const body = { fromDate: from, toDate: to, memberType: 'IGS', mkkMemberOidList: [], inactiveMkkMemberOidList: [], disclosureClass: '', subjectList: [], isLate: '', mainSector: '', sector: '', subSector: '', marketOidList: [], index: '', bdkReview: '', bdkMemberOidList: [], year: '', term: '', ruleType: '', period: '', fromSrc: false, srcCategory: '', discIndex: [] };
    let lastErr;
    for (const path of ['/tr/api/disclosure/members/byCriteria', '/tr/api/memberDisclosureQuery']) {
      try { const r = await fetch(BASE + path, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) }); if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json(), arr = Array.isArray(j) ? j : (j && (j.disclosures || j.data || j.items || j.content)) || null; if (!Array.isArray(arr)) throw new Error('unexpected JSON shape');
        return { rows: arr.map(normaliseApiRow).filter(Boolean), via: 'api ' + path }; } catch (e) { lastErr = new Error(path + ': ' + errMsg(e)); }
    }
    throw lastErr;
  }
  async function strategyRss() { const r = await fetch(BASE + '/tr/rss', { headers: { ...UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' }, signal: AbortSignal.timeout(25000) }); if (!r.ok) throw new Error('rss HTTP ' + r.status); const rows = parseRss(await r.text()); if (!rows.length) throw new Error('rss: no items'); return { rows, via: 'rss' }; }
  let running = null;
  async function update(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const syms = symbols(), today = ist ? ist().date : new Date().toISOString().slice(0, 10), from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), cur = doc(), fails = [];
      if (!syms.length) { put('kap/main', { ...cur, items: [], updatedAt: new Date().toISOString(), note: 'no BIST symbols held, in funds or in the basket', ok: true }); merge(); return { items: 0 }; }
      let got = null; for (const s of [() => strategyApi(from, today), strategyRss]) { try { got = await s(); break; } catch (e) { fails.push(errMsg(e)); } }
      if (!got) { put('kap/main', { ...cur, ok: false, note: 'KAP unreachable: ' + fails.join('; '), triedAt: new Date().toISOString() }); if (mark) try { mark('KAP', false, fails.join('; ')); } catch (e) { } log(`kap (${reason}): failed — ${fails.join('; ')}`); merge(); return { items: (cur.items || []).length, failed: true }; }
      const prev = new Map((cur.items || []).map(i => [i.link, i])), fresh = toLighthouse(got.rows, syms, today);
      for (const f of fresh) prev.set(f.link, { ...(prev.get(f.link) || {}), ...f, firstSeen: (prev.get(f.link) || f).firstSeen });
      const cut = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10), items = [...prev.values()].filter(i => i.date >= cut && (i.symbols || []).some(s => syms.includes(s))).sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 150);
      const isNew = fresh.filter(f => !(cur.items || []).some(i => i.link === f.link));
      put('kap/main', { items, updatedAt: new Date().toISOString(), note: `${items.length} disclosures for ${syms.length} symbols via ${got.via}${fails.length ? ' (after: ' + fails.join('; ') + ')' : ''}`, ok: true, strategy: got.via, symbols: syms });
      if (mark) try { mark('KAP', true, fails.length ? fails.join('; ') : null, { rows: items.length, partial: !!fails.length }); } catch (e) { }
      if (isNew.length && (cur.items || []).length && inbox) inbox('good', `KAP: ${isNew.length} new disclosure${isNew.length > 1 ? 's' : ''} for your symbols`, isNew.slice(0, 6).map(i => i.title).join('; ') + '. See Markets › Lighthouse (KAP).', 'kap');
      merge(); log(`kap (${reason}): ${items.length} items via ${got.via}`); return { items: items.length, via: got.via };
    })().finally(() => { running = null; });
    return running;
  }
  // re-merge after every Lighthouse run (lighthouse.mjs rebuilds its list from SPK and SEC only)
  function merge() { const k = doc().items || [], lh = db.docs['lighthouse/main']; if (!lh && !k.length) return false; const has = ((lh || {}).items || []).filter(i => i.source === 'KAP').length; if (lh && has === k.length && ((lh.mix || {}).kap === k.length)) return false; put('lighthouse/main', mergeIntoLighthouse(lh || { items: [], updatedAt: null, note: 'KAP only so far' }, k)); return true; }
  return { update, merge, doc, symbols, stale: h => { const u = doc().updatedAt || doc().triedAt; return !u || (Date.now() - new Date(u)) / 36e5 > h; } };
}
