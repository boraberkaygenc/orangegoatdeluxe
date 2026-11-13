// GNC Terminal — notifications: Telegram (sendMessage / sendDocument) and e-mail (a minimal SMTP client over node:tls),
// inbox forwarding (warn/bad, or kinds alarm/health/order/picks; 20 per hour, one per title per day) and a weekly summary
// every Sunday 20:00 Istanbul with the statement / fund reports as PDF, rendered here in Node through engine.js report
// models and reports.js (if present next to server.mjs, else engine's own renderer) with public/lib/pdf-lib.min.js.
// config.json: telegram { token, chatId }, smtp { host, port: 465, secure: true, user, pass, from, to },
//              notify { forward: true, weeklyTelegram: true, weeklyEmail: true, weeklyPdf: true }
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let C = null; const early = []; // messages raised before initNotify
const S = { sent: [], dedupe: { day: '', titles: [] }, weeklyKey: null, log: [] };
const FORWARD_KINDS = ['alarm', 'health', 'order', 'picks'], HOURLY = 20;
const sfile = () => path.join(C.DIR, 'data', 'notify_state.json');
function loadState() { try { Object.assign(S, JSON.parse(fs.readFileSync(sfile(), 'utf8'))); } catch (e) { } }
function saveState() { try { fs.writeFileSync(sfile(), JSON.stringify(S)); } catch (e) { } }
function note(channel, ok, what, error) { S.log = [...S.log, { at: new Date().toISOString(), channel, ok, what: String(what).slice(0, 120), error: error ? String(error).slice(0, 200) : undefined }].slice(-40); saveState(); }
export const notifyLog = () => S.log.slice().reverse();
const cfg = () => (C && C.config) || {};
export const telegramReady = () => { const t = cfg().telegram || {}; return !!(t.token && t.chatId); };
export const smtpReady = () => { const s = cfg().smtp || {}; return !!(s.host && s.from && s.to); };
const opt = k => { const n = cfg().notify || {}; return n[k] !== false; };

/* ============================== Telegram ============================== */
async function tg(method, body, form) {
  const t = cfg().telegram || {}; if (!t.token || !t.chatId) throw new Error('Telegram is not set up (token and chat id)');
  const r = await fetch(`https://api.telegram.org/bot${t.token}/${method}`, form ? { method: 'POST', body } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: t.chatId, ...body }) });
  let j = null; try { j = await r.json(); } catch (e) { } if (!r.ok || !j || !j.ok) throw new Error('Telegram: ' + ((j && j.description) || 'HTTP ' + r.status)); return j.result;
}
const escHTML = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function sendTelegram(text, { html = false } = {}) { const t = String(text); return tg('sendMessage', { text: t.length > 4000 ? t.slice(0, 3990) + '…' : t, parse_mode: html ? 'HTML' : undefined, disable_web_page_preview: true }); }
export async function sendTelegramDocument(buf, filename, caption = '') {
  const t = cfg().telegram || {}, fd = new FormData(); fd.append('chat_id', String(t.chatId)); if (caption) fd.append('caption', String(caption).slice(0, 1000)); fd.append('document', new Blob([buf], { type: filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream' }), filename);
  return tg('sendDocument', fd, true);
}

/* ============================== SMTP ============================== */
// smtp: { host, port (465 = implicit TLS), secure (default port === 465), starttls (default true when not secure and offered),
//         user, pass, from, to (comma separated), rejectUnauthorized (default true), timeoutMs }
export function smtpSend(smtp, { subject, text, attachments = [] }) {
  return new Promise((resolve, reject) => {
    const port = +smtp.port || 465, secure = smtp.secure !== undefined ? !!smtp.secure : port === 465, host = smtp.host, timeout = +smtp.timeoutMs || 30000, tlsOpts = { host, servername: host, rejectUnauthorized: smtp.rejectUnauthorized !== false };
    const to = String(smtp.to || '').split(/[,;]\s*/).map(x => x.trim()).filter(Boolean), from = String(smtp.from || '').trim(), addr = s => (s.match(/<([^>]+)>/) || [, s])[1].trim();
    if (!host || !from || !to.length) return reject(new Error('SMTP is not set up (host, from and to are needed)'));
    let sock, buf = '', waiter = null, done = false; const transcript = [];
    const fail = e => { if (done) return; done = true; try { sock && sock.destroy(); } catch (_) { } reject(e instanceof Error ? e : new Error(String(e))); };
    const pump = () => { if (!waiter) return; let rest = buf, code = null, fin = false; const lines = [];
      while (true) { const mm = rest.match(/^(\d{3})([ -])(.*?)\r?\n/); if (!mm) break; lines.push(mm[3]); code = +mm[1]; rest = rest.slice(mm[0].length); if (mm[2] === ' ') { fin = true; break; } }
      if (!fin) return; buf = rest; const w = waiter; waiter = null; transcript.push('< ' + code + ' ' + lines[0]); w({ code, lines }); };
    const onData = d => { buf += d.toString('utf8'); pump(); };
    const read = () => new Promise(ok => { waiter = ok; pump(); });
    const cmd = async (line, expect, shown) => { transcript.push('> ' + (shown || line)); sock.write(line + '\r\n'); const r = await read(); if (!expect.includes(r.code)) throw new Error(`SMTP ${shown || line.split(' ')[0]} refused: ${r.code} ${r.lines.join(' ')}`); return r; };
    const attach = s => { sock = s; s.setTimeout(timeout, () => fail(new Error('SMTP timed out'))); s.on('data', onData); s.on('error', fail); s.on('close', () => fail(new Error('SMTP server closed the connection'))); };
    const run = async () => {
      try {
        let r = await read(); if (r.code !== 220) throw new Error('SMTP greeting: ' + r.code + ' ' + r.lines.join(' '));
        const me = (os.hostname() || 'localhost').replace(/[^\w.\-]/g, '') || 'localhost';
        r = await cmd('EHLO ' + me, [250]);
        if (!secure && smtp.starttls !== false && r.lines.some(l => /^STARTTLS\b/i.test(l))) {
          await cmd('STARTTLS', [220]); sock.removeListener('data', onData); const up = tls.connect({ ...tlsOpts, socket: sock }); await new Promise((ok, bad) => { up.once('secureConnect', ok); up.once('error', bad); }); attach(up); buf = '';
          r = await cmd('EHLO ' + me, [250]);
        }
        if (smtp.user) { await cmd('AUTH LOGIN', [334]); await cmd(Buffer.from(String(smtp.user)).toString('base64'), [334], '(user)'); await cmd(Buffer.from(String(smtp.pass || '')).toString('base64'), [235], '(password)'); }
        await cmd(`MAIL FROM:<${addr(from)}>`, [250]);
        for (const t of to) await cmd(`RCPT TO:<${addr(t)}>`, [250, 251]);
        await cmd('DATA', [354]);
        const msg = buildMime({ from, to, subject, text, attachments }).replace(/\r\n\./g, '\r\n..');
        transcript.push('> (message, ' + msg.length + ' bytes)'); sock.write(msg + '\r\n.\r\n'); r = await read(); if (r.code !== 250) throw new Error('SMTP message refused: ' + r.code + ' ' + r.lines.join(' '));
        try { sock.write('QUIT\r\n'); } catch (_) { } done = true; setTimeout(() => { try { sock.end(); } catch (_) { } }, 100); resolve({ ok: true, to, response: r.lines.join(' '), transcript });
      } catch (e) { fail(e); }
    };
    try { const s = secure ? tls.connect({ ...tlsOpts, port }) : net.connect({ host, port }); attach(s); s.once(secure ? 'secureConnect' : 'connect', run); } catch (e) { fail(e); }
  });
}
const b64lines = b => b.toString('base64').replace(/.{76}/g, '$&\r\n');
const encWord = s => /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + Buffer.from(s).toString('base64') + '?=';
export function buildMime({ from, to, subject, text, attachments = [] }) {
  const bd = '=_gnc_' + crypto.randomBytes(12).toString('hex'), dom = (String(from).match(/@([\w.\-]+)/) || [, 'localhost'])[1];
  const head = [`From: ${from}`, `To: ${to.join(', ')}`, `Subject: ${encWord(String(subject || 'GNC Terminal'))}`, `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`, `Message-ID: <${crypto.randomBytes(10).toString('hex')}@${dom}>`, 'MIME-Version: 1.0', 'X-Mailer: GNC Terminal'];
  const textPart = ['Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', b64lines(Buffer.from(String(text || ''), 'utf8'))].join('\r\n');
  if (!attachments.length) return [...head, textPart].join('\r\n');
  const parts = [`--${bd}\r\n${textPart}`]; for (const a of attachments) { const fn = String(a.filename).replace(/["\r\n]/g, ''); parts.push(`--${bd}\r\nContent-Type: ${a.contentType || 'application/octet-stream'}; name="${encWord(fn)}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${encWord(fn)}"\r\n\r\n${b64lines(a.content)}`); }
  return [...head, `Content-Type: multipart/mixed; boundary="${bd}"`, '', 'This is a multi-part message in MIME format.', ...parts, `--${bd}--`].join('\r\n');
}
export async function sendMail(m) { return smtpSend(cfg().smtp || {}, m); }

/* ============================== inbox forwarding ============================== */
export function shouldForward(m) { return !!m && (m.level === 'warn' || m.level === 'bad' || FORWARD_KINDS.includes(m.kind)); }
export function notifyInbox(m) { if (!C) { if (early.length < 50) early.push(m); return; } forward(m).catch(e => { try { C.log('notify:', e.message); } catch (_) { } }); }
async function forward(m) {
  if (!shouldForward(m) || !opt('forward') || !telegramReady()) return { skipped: true };
  const day = C.ist().date, now = Date.now(); if (S.dedupe.day !== day) S.dedupe = { day, titles: [] };
  if (S.dedupe.titles.includes(m.title)) return { skipped: 'duplicate today' };
  S.sent = S.sent.filter(t => now - t < 36e5); if (S.sent.length >= HOURLY) return { skipped: 'rate limit (20 an hour)' };
  S.sent.push(now); S.dedupe.titles.push(m.title); saveState();
  const tag = m.level === 'bad' ? 'ALERT' : m.level === 'warn' ? 'Warning' : m.kind === 'picks' ? 'Picks' : m.kind === 'order' ? 'Order' : 'Note';
  try { await sendTelegram(`<b>GNC Terminal · ${escHTML(tag)}</b>\n<b>${escHTML(m.title)}</b>\n${escHTML(String(m.body || '').slice(0, 3000))}`, { html: true }); note('telegram', true, m.title); return { ok: true }; }
  catch (e) { note('telegram', false, m.title, e.message); throw e; }
}

/* ============================== weekly summary ============================== */
function items(n) { return ((C.db.docs['data/users/local/' + n] || {}).items || []); }
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
// the same context the page builds in ctx(): scored map from E.scoreAll + macro instruments through E.enrich
export function buildCtx() {
  const { db, E } = C, inst = {}; for (const [k, x] of Object.entries(db.docs)) if (k.startsWith('instruments/') && x && x.symbol) inst[x.symbol] = x;
  const Sx = { ...E.DEFAULT_SETTINGS, ...(db.docs['settings/main'] || {}) }, today = C.ist().date;
  const M = { ...(db.docs['macro/main'] || {}), today, usdtry: (inst['USD/TRY'] || {}).price || 49.5, xu100: (inst.XU100 || {}).price };
  const scored = E.scoreAll(inst, Sx, M), map = Object.fromEntries(scored.map(x => [x.symbol, x]));
  Object.assign(map, E.enrich(Object.fromEntries(Object.entries(inst).filter(([, x]) => x.cls === 'MACRO')), Sx, M));
  const macroSeries = (db.docs['macro/series'] || {}).series; let fx = null; try { fx = E.makeFx(inst, macroSeries, M.usdtry); } catch (e) { }
  const picksDocs = { weekly: db.docs['picks/weekly'], d21: db.docs['picks/d21'], d30: db.docs['picks/d30'] };
  return { S: Sx, M, inst, scoredMap: map, holdings: items('holdings'), packages: items('packages').filter(p => p.status !== 'closed'), picksDocs, basket: items('basket'), fx, watch: C.db.docs['data/users/local/watch'] || {}, regimeInfo: E.regime(map.XU100 ? map : { XU100: inst.XU100 }, M, Sx) };
}
export function weeklyFacts(c = buildCtx()) {
  const { E } = C, { S: Sx, M } = c, today = M.today, wk = addDays(today, -7), soon = addDays(today, 7);
  const rows = E.holdingsView(c.holdings, c.packages, c.scoredMap, M, Sx), value = rows.reduce((a, r) => a + (r.value || 0), 0), paid = rows.reduce((a, r) => a + (r.paid || 0), 0);
  let weekPL = 0, priced = 0; for (const r of rows) { const x = r.x || c.inst[r.symbol], cl = x && Array.isArray(x.closes) ? x.closes : (c.inst[r.symbol] && c.inst[r.symbol].closes) || []; const a = cl.filter(q => q[0] <= wk).pop(), z = cl[cl.length - 1]; if (a && z && +a[1] > 0 && r.value) { weekPL += r.value * (1 - a[1] / z[1]); priced++; } }
  const pending = []; for (const p of c.packages) for (const t of p.tranches || []) if (t.status === 'pending' || t.status === 'planned') for (const l of t.lines || []) if (!l.done && !l.skipped) pending.push({ fund: p.name, symbol: l.symbol, amount: +l.amount || 0, date: t.date });
  const exits = []; for (const p of c.packages) { if (!p.orderedAt && p.status === 'planned') continue; for (const l of p.lines || []) { const d = l.exitDate || (p.holdDays ? addDays(p.orderedAt || p.date, +p.holdDays) : null); if (d && d >= today && d <= soon) exits.push({ fund: p.name, symbol: l.symbol, date: d }); } }
  for (const h of c.holdings) if (h.exitDate && h.exitDate >= today && h.exitDate <= soon) exits.push({ fund: 'Positions', symbol: h.symbol, date: h.exitDate });
  const sells = (() => { try { return E.sellList(c).map(a => a.text); } catch (e) { return []; } })();
  const src = ((C.db.docs['status/health'] || {}).sources) || {}, trouble = Object.entries(src).filter(([, v]) => v && (v.fails >= 2 || v.breached)).map(([k, v]) => `${k}${v.lastError ? ' (' + String(v.lastError).slice(0, 60) + ')' : ''}`);
  return { today, value, paid, weekPL, weekPct: value - weekPL > 0 ? weekPL / (value - weekPL) * 100 : null, priced, positions: rows.length, pending, exits: exits.sort((a, b) => a.date < b.date ? -1 : 1), sells, trouble, sources: Object.keys(src).length, funds: c.packages.length };
}
const fmt = v => Math.round(v || 0).toLocaleString('en-US') + ' TRY', pct = v => v === null || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%';
export function weeklyText(f) {
  const L = [`GNC Terminal — weekly summary, ${f.today}`, '', `Portfolio value: ${fmt(f.value)} (${f.positions} position${f.positions === 1 ? '' : 's'}, ${f.funds} fund${f.funds === 1 ? '' : 's'}; invested ${fmt(f.paid)})`, `Week P/L: ${f.weekPL >= 0 ? '+' : '−'}${fmt(Math.abs(f.weekPL))} (${pct(f.weekPct)}), from closes 7 days apart`,
    '', `Open orders: ${f.pending.length ? f.pending.length + ' tranche line' + (f.pending.length === 1 ? '' : 's') + ', ' + fmt(f.pending.reduce((a, o) => a + o.amount, 0)) : 'none'}`, ...f.pending.slice(0, 8).map(o => `  · ${o.symbol} (${o.fund}) ${fmt(o.amount)}${o.date ? ' due ' + o.date : ''}`),
    ...(f.sells.length ? ['', 'Sell / trim list:', ...f.sells.slice(0, 8).map(s => '  · ' + s)] : []),
    '', `Exits due in the next 7 days: ${f.exits.length ? '' : 'none'}`, ...f.exits.slice(0, 10).map(e => `  · ${e.date} ${e.symbol} (${e.fund})`),
    '', `Data sources: ${f.trouble.length ? f.trouble.length + ' with trouble — ' + f.trouble.join('; ') : f.sources ? 'all ' + f.sources + ' working' : 'no status yet'}`];
  return L.join('\n');
}
// PDFs: statement for the last 7 days and one report per open fund (at most 4)
export async function weeklyPDFs(c = buildCtx(), { funds = 4 } = {}) {
  const { E, DIR } = C; let render = null, renderer = 'engine';
  try { const rp = path.join(DIR, 'reports.js'); if (fs.existsSync(rp)) { render = require(rp).renderPDF; renderer = 'reports.js'; } } catch (e) { C.log('notify: reports.js not usable:', e.message); }
  if (!render) render = E.renderPDF; const PDFLib = require(path.join(DIR, 'public', 'lib', 'pdf-lib.min.js'));
  const out = []; E.setDisplay({ both: true, usdtry: c.M.usdtry, principal: c.S.principal });
  try {
    const from = addDays(c.M.today, -7), to = c.M.today; out.push({ filename: `GNC Terminal Statement ${from} to ${to}.pdf`, content: Buffer.from(await render(E.statementModel(c, from, to), PDFLib)), contentType: 'application/pdf' });
    for (const p of c.packages.slice(0, funds)) { try { out.push({ filename: String(p.name || 'Fund').replace(/[^\w\s().,-]/g, '-') + '.pdf', content: Buffer.from(await render(E.packageModel(c, p), PDFLib)), contentType: 'application/pdf' }); } catch (e) { C.log('notify: fund report failed for', p.name, e.message); } }
  } finally { E.setDisplay({ both: false }); }
  return { files: out, renderer };
}
export async function weekly(reason = 'Sunday 20:00') {
  const c = buildCtx(), f = weeklyFacts(c), text = weeklyText(f), res = { telegram: null, email: null, pdfs: 0 };
  let pdf = { files: [] }; if (opt('weeklyPdf') && ((opt('weeklyEmail') && smtpReady()) || (opt('weeklyTelegram') && telegramReady()))) { try { pdf = await weeklyPDFs(c); res.pdfs = pdf.files.length; res.renderer = pdf.renderer; } catch (e) { C.log('notify: weekly PDF failed:', e.message); res.pdfError = e.message; } }
  if (opt('weeklyTelegram') && telegramReady()) { try { await sendTelegram(text); for (const a of pdf.files.slice(0, 1)) await sendTelegramDocument(a.content, a.filename, 'Weekly statement'); res.telegram = 'sent'; note('telegram', true, 'weekly summary'); } catch (e) { res.telegram = e.message; note('telegram', false, 'weekly summary', e.message); } }
  if (opt('weeklyEmail') && smtpReady()) { try { await sendMail({ subject: `GNC Terminal weekly summary ${f.today}`, text, attachments: pdf.files }); res.email = 'sent'; note('email', true, 'weekly summary'); } catch (e) { res.email = e.message; note('email', false, 'weekly summary', e.message); } }
  C.log(`weekly summary (${reason}): telegram ${res.telegram || 'off'}, e-mail ${res.email || 'off'}, ${res.pdfs} PDF(s)`); return { ...res, text };
}
export async function test(channel) {
  const at = C.ist(); const text = `GNC Terminal test message, ${at.date} ${at.hm} Istanbul. Notifications from this computer reach you here.`;
  if (channel === 'telegram') { try { await sendTelegram(text); note('telegram', true, 'test'); return { ok: true }; } catch (e) { note('telegram', false, 'test', e.message); return { ok: false, error: e.message }; } }
  if (channel === 'email') { try { const r = await sendMail({ subject: 'GNC Terminal test', text }); note('email', true, 'test'); return { ok: true, to: r.to }; } catch (e) { note('email', false, 'test', e.message); return { ok: false, error: e.message }; } }
  if (channel === 'weekly') { const r = await weekly('test button'); return { ok: !!(r.telegram === 'sent' || r.email === 'sent'), ...r }; }
  return { ok: false, error: "channel must be 'telegram', 'email' or 'weekly'" };
}

/* ============================== start ============================== */
// ctx: the route-module ctx ({ db, put, log, ist, config, E, DIR, ... })
export function initNotify(ctx) {
  C = ctx; loadState(); for (const m of early.splice(0)) notifyInbox(m);
  const tick = () => { try { const t = C.ist(); if (t.wd === 'Sun' && t.hm >= '20:00' && S.weeklyKey !== t.date) { S.weeklyKey = t.date; saveState(); if (telegramReady() || smtpReady()) weekly().catch(e => C.log('weekly summary failed:', e.message)); } } catch (e) { } };
  setInterval(tick, 30000).unref(); setTimeout(tick, 20000).unref();
}
