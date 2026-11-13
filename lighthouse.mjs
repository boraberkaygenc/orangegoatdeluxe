// GNC Terminal — Lighthouse: regulatory watch. SPK (Capital Markets Board of Turkiye) bulletins, press releases and
// announcements (~85% of the feed) plus SEC press releases (~15%), refreshed every 6 hours. Outtakes are extractive
// (key sentences and lines containing decision words), no AI involved. Writes lighthouse/main = { items, updatedAt, note }.
import zlib from 'node:zlib';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' };
const errMsg = e => { const c = e && e.cause; return [e && e.message, c && (c.code || c.message)].filter(Boolean).join(' / ') || String(e); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MONTHS = { ocak: 1, oca: 1, şubat: 2, subat: 2, şub: 2, sub: 2, mart: 3, mar: 3, nisan: 4, nis: 4, mayıs: 5, mayis: 5, may: 5, haziran: 6, haz: 6, temmuz: 7, tem: 7, ağustos: 8, agustos: 8, ağu: 8, agu: 8, eylül: 9, eylul: 9, eyl: 9, ekim: 10, eki: 10, kasım: 11, kasim: 11, kas: 11, aralık: 12, aralik: 12, ara: 12 };
function decode(s) { return String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, '’').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/gi, ' '); }
function textOf(h) { return decode(String(h || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<header[\s\S]*?<\/header>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|td)>/gi, '\n').replace(/<[^>]+>/g, ' ')).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean); }
function trDate(s) { const m = String(s).toLowerCase().match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik|oca|şub|sub|mar|nis|may|haz|tem|ağu|agu|eyl|eki|kas|ara)\s+(\d{4})/); if (m) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`; const n = String(s).match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/); if (n) return `${n[3]}-${n[2].padStart(2, '0')}-${n[1].padStart(2, '0')}`; const u = String(s).match(/_(\d{2})(\d{2})(\d{4})\b/); return u ? `${u[3]}-${u[2]}-${u[1]}` : null; }
async function get(url, bin) { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return bin ? Buffer.from(await r.arrayBuffer()) : r.text(); }

/* ---- minimal PDF text extraction (FlateDecode streams, simple fonts); returns '' when the text is not readable ---- */
export function pdfText(buf) {
  const out = []; let i = 0; const s = buf.toString('latin1');
  while ((i = s.indexOf('stream', i)) >= 0) { const start = s.indexOf('\n', i) + 1; const end = s.indexOf('endstream', start); if (end < 0) break; const dict = s.slice(Math.max(0, i - 300), i); i = end + 9;
    if (!/FlateDecode/.test(dict)) continue; let raw; try { raw = zlib.inflateSync(buf.subarray(start, end)); } catch (e) { try { raw = zlib.inflateSync(buf.subarray(start, end - 1)); } catch (_) { continue; } }
    const t = raw.toString('latin1'); if (!/T[jJ]/.test(t)) continue;
    let line = '';
    for (const m of t.matchAll(/\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^)\\]|\\.)*)\)\s*Tj|(T\*|Td|TD|'|")/g)) {
      if (m[3]) { if (line.trim()) out.push(line.trim()); line = ''; continue; }
      const seg = m[1] !== undefined ? [...m[1].matchAll(/\(((?:[^)\\]|\\.)*)\)|(-?\d+\.?\d*)/g)].map(x => x[1] !== undefined ? x[1] : (+x[2] < -200 ? ' ' : '')).join('') : m[2];
      line += seg.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\').replace(/\\(\d{3})/g, (q, o) => String.fromCharCode(parseInt(o, 8)));
    }
    if (line.trim()) out.push(line.trim());
  }
  const text = out.join('\n'); const letters = (text.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || []).length;
  return text.length > 200 && letters / text.length > 0.5 ? text.replace(/þÿ/g, '') : '';
}

const KEY = /halka arz|ihraç|ihrac|idari para cezas|işlem yasağ|islem yasag|tedbir|suç duyurusu|suc duyurusu|kurul karar|tebliğ|teblig|ilke karar|pay geri al|borçlanma arac|kitle fonlama|yatırım fonu|portföy|lisans|faaliyet izni|birleşme|bölünme|çağrı|cagri|temettü|sermaye artırım|onay|red|ret/i;
function outtakes(lines, max = 6) { const seen = new Set(), out = []; for (const l of lines) { if (l.length < 25 || l.length > 400) continue; if (!KEY.test(l)) continue; const k = l.slice(0, 60); if (seen.has(k)) continue; seen.add(k); out.push(l); if (out.length >= max) break; } if (!out.length) for (const l of lines) { if (l.length >= 40 && l.length <= 400) { out.push(l); if (out.length >= 3) break; } } return out; }
function summary(lines, n = 3) { const txt = lines.filter(l => l.length > 40).join(' '); const sents = txt.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/).map(s => s.trim()).filter(s => s.length > 30); return sents.slice(0, n).join(' ').slice(0, 600); }
function classify(title, text) { const t = (title + ' ' + text.slice(0, 2000)).toLowerCase(); if (/idari para cezas|işlem yasağ|islem yasag|suç duyurusu|tedbir|enforcement|charges|fraud|penalt/.test(t)) return 'enforcement'; if (/halka arz|ipo|ihraç onay|ihrac onay|initial public offering/.test(t)) return 'ipo'; if (/tebliğ|teblig|ilke karar|yönetmelik|mevzuat|rule|amendment|proposal|adopt/.test(t)) return 'rule'; if (/bülten|bulten/.test(t)) return 'bulletin'; return 'news'; }

export function createLighthouse({ db, put, log, inbox, ist, config }) {
  const doc = () => db.docs['lighthouse/main'] || { items: [], updatedAt: null };
  const GENERIC = new Set(['enerji', 'elektrik', 'yatirim', 'yatırım', 'gayrimenkul', 'gida', 'gıda', 'tekstil', 'insaat', 'inşaat', 'turizm', 'menkul', 'degerler', 'değerler', 'sigorta', 'bankasi', 'bankası', 'finans', 'finansal', 'portfoy', 'portföy', 'holding', 'sanayi', 'sanayii', 'ticaret', 'teknoloji', 'madencilik', 'petrol', 'cimento', 'çimento', 'demir', 'celik', 'çelik', 'kimya', 'otomotiv', 'lojistik', 'hava', 'yollari', 'yolları', 'turk', 'türk', 'turkiye', 'türkiye', 'anonim', 'sirketi', 'şirketi', 'uretim', 'üretim', 'dagitim', 'dağıtım', 'grubu', 'group', 'inc', 'corp', 'corporation', 'company', 'plc', 'ltd', 'the', 'and', 'international', 'global', 'systems', 'technologies', 'energy', 'financial', 'bank', 'capital', 'class', 'ortakligi', 'ortaklığı', 'fabrikalari', 'fabrikaları', 'yenilenebilir', 'katilim', 'katılım', 'hayat', 'emeklilik', 'faktoring', 'kiralama', 'varlik', 'yonetim', 'pazarlama', 'ihracat', 'ithalat', 'isletmeleri', 'işletmeleri', 'hizmetleri', 'urunleri', 'ürünleri', 'maddeleri', 'malzemeleri', 'sistemleri', 'tesisleri', 'mamulleri']);
  function universeNames() { const m = []; for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && (x.cls === 'TR_EQ' || x.cls === 'US_EQ') && x.name) { const toks = String(x.name).toLowerCase().replace(/[^a-zçğıöşü0-9 ]/g, ' ').split(/\s+/).filter(Boolean); const w = toks.find(t => t.length >= 4 && !GENERIC.has(t)) || (toks.length >= 2 ? toks.slice(0, 2).join(' ') : null); if (w && w.length >= 4) m.push([x.symbol, w]); } return m; }
  function held() { const s = new Set(); for (const [k, v] of Object.entries(db.docs)) { if (!k.startsWith('data/users/')) continue; if (k.endsWith('/holdings')) for (const h of (v.items || [])) s.add(h.symbol); if (k.endsWith('/packages')) for (const p of (v.items || [])) if (p.status !== 'closed') for (const l of (p.lines || [])) s.add(l.symbol); if (k.endsWith('/basket')) for (const b of (v.items || [])) s.add(b.symbol); } return s; }
  function matchSymbols(text, names) { const t = ' ' + text + ' ', low = t.toLowerCase(), out = new Set(); for (const m of t.matchAll(/[\s(]([A-Z]{4,6})[\s),.]/g)) if (db.docs['instruments/' + m[1]]) out.add(m[1]); for (const [sym, w] of names) if (low.includes(' ' + w + ' ')) out.add(sym); return [...out].slice(0, 8); }
  let running = null;
  async function update(reason = 'schedule') {
    if (running) return running;
    running = (async () => {
      const cur = doc(), items = new Map((cur.items || []).map(i => [i.link, i])), fails = [], today = ist().date, year = today.slice(0, 4), names = universeNames(); let fetched = 0;
      const add = (it) => { if (!it.link) return; const prev = items.get(it.link); items.set(it.link, { ...(prev || { firstSeen: today }), ...it }); };
      // 1. SPK bulletins (PDF): list, then read the newest unread ones
      try { const h = await get(`https://spk.gov.tr/spk-bultenleri/${year}-yili-spk-bultenleri`); let n = 0;
        for (const m of h.matchAll(/<a[^>]+href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi)) { const link = m[1].startsWith('http') ? m[1] : 'https://spk.gov.tr' + m[1], title = textOf(m[2]).join(' '); if (!/b[üu]lten/i.test(title)) continue; const no = (title.match(/(\d{4}\/\d+)/) || [])[1]; add({ source: 'SPK', kind: 'bulletin', title: no ? `SPK Bülteni ${no}` : title, date: trDate(title) || today, link, lang: 'tr' }); n++; if (n >= 12) break; }
        const unread = [...items.values()].filter(i => i.source === 'SPK' && i.kind === 'bulletin' && !i.read).sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 3);
        for (const it of unread) { try { const buf = await get(it.link, true); const txt = pdfText(buf), lines = txt.split('\n').map(l => l.trim()).filter(Boolean); it.read = true; it.textOk = !!txt;
            if (txt) { it.outtakes = outtakes(lines, 8); it.summary = summary(lines, 2) || it.outtakes[0] || ''; it.symbols = matchSymbols(txt.slice(0, 60000), names); it.category = classify(it.title, txt); }
            else { it.summary = 'The bulletin PDF could not be read as text; open it to see the decisions.'; it.outtakes = []; } fetched++; } catch (e) { it.read = true; it.summary = 'Could not download the bulletin: ' + errMsg(e); } await sleep(600); }
      } catch (e) { fails.push('SPK bulletins: ' + errMsg(e)); }
      // 2. SPK press releases and announcements (HTML)
      for (const [url, kind] of [[`https://spk.gov.tr/duyurular/basin-duyurulari/${year}`, 'press'], ['https://spk.gov.tr/duyurular', 'announcement']]) {
        try { const h = await get(url); let n = 0;
          for (const m of h.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) { const href = m[1], t = textOf(m[2]).join(' '); if (!/duyurular\/|\/data\/.*\.pdf/i.test(href) || t.length < 12) continue; if (/basin-duyurulari\/?$|\/duyurular\/?$|\/\d{4}\/?$/.test(href)) continue; const link = href.startsWith('http') ? href : 'https://spk.gov.tr' + href; const date = trDate(t) || trDate(href) || null; if (!date) continue; add({ source: 'SPK', kind, title: t.replace(/^\d{1,2}\s+\S+\s+\d{4}\s*/, '').replace(/^Yeni Basın Duyurusu\s*/i, '').trim() || t, date, link, lang: 'tr' }); n++; if (n >= 15) break; }
          const unread = [...items.values()].filter(i => i.source === 'SPK' && i.kind === kind && !i.read && !/\.pdf$/i.test(i.link)).sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 4);
          for (const it of unread) { try { const page = await get(it.link); const lines = textOf(page).filter(l => l.length > 30); it.read = true; it.summary = summary(lines, 3); it.outtakes = outtakes(lines, 5); it.symbols = matchSymbols(lines.join(' ').slice(0, 20000), names); it.category = classify(it.title, lines.join(' ')); if (!it.title || it.title.length < 12) it.title = lines[0] ? lines[0].slice(0, 120) : it.title; fetched++; } catch (e) { it.read = true; it.summary = 'Could not open the page: ' + errMsg(e); } await sleep(500); }
        } catch (e) { fails.push(`SPK ${kind}: ` + errMsg(e)); }
      }
      // 3. SEC press releases (RSS)
      try { const xml = await get('https://www.sec.gov/news/pressreleases.rss'); let n = 0;
        for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) { const it = m[1], tag = t => { const x = it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i')); return x ? x[1].trim() : ''; }; const title = decode(tag('title')), link = decode(tag('link')), pub = tag('pubDate'), desc = textOf(tag('description')).join(' '); const d = pub ? new Date(pub) : null;
          add({ source: 'SEC', kind: 'press', title, date: d && !isNaN(d) ? d.toISOString().slice(0, 10) : today, link, lang: 'en', read: true, summary: desc.slice(0, 500), outtakes: outtakes(desc.split(/(?<=\.)\s+/), 3), category: classify(title, desc), symbols: matchSymbols(title + ' ' + desc, names.filter(([s]) => (db.docs['instruments/' + s] || {}).cls === 'US_EQ')) }); n++; if (n >= 25) break; }
      } catch (e) { fails.push('SEC: ' + errMsg(e)); }
      // keep 120 days, SPK first by date; SEC capped to roughly 15% of what is shown
      const cut = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
      let all = [...items.values()].filter(i => i.date >= cut).sort((a, b) => b.date < a.date ? -1 : 1);
      const spk = all.filter(i => i.source === 'SPK').slice(0, 120), sec = all.filter(i => i.source === 'SEC').slice(0, Math.max(6, Math.round(spk.length * 0.18)));
      all = [...spk, ...sec].sort((a, b) => b.date < a.date ? -1 : 1);
      const H = held(), newHeld = all.filter(i => i.firstSeen === today && (cur.items || []).length && (i.symbols || []).some(s => H.has(s)));
      if (newHeld.length) inbox('warn', 'Regulator mentions a position of yours', newHeld.map(i => `${i.source}: ${i.title} — ${(i.symbols || []).filter(s => H.has(s)).join(', ')}`).join('; ') + '. See Markets › Lighthouse.', 'lighthouse');
      put('lighthouse/main', { items: all, updatedAt: new Date().toISOString(), note: fails.length ? 'partly updated; failed: ' + fails.join('; ') : `updated, ${fetched} documents read`, ok: fails.length < 3, mix: { spk: spk.length, sec: sec.length } });
      log(`lighthouse (${reason}): ${spk.length} SPK, ${sec.length} SEC items; ${fetched} read${fails.length ? '; failed: ' + fails.join('; ') : ''}`);
    })().finally(() => { running = null; });
    return running;
  }
  return { update, stale: h => { const u = doc().updatedAt; return !u || (Date.now() - new Date(u)) / 36e5 > h; } };
}
