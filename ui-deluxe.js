/*<DELUXE-UI>*/
/* ---------- orangegoat v2.0 Deluxe (page part; runs inside the page scope, assembled before start-up) ----------
   Phase 1: multi-asset funds (cash sleeve: TRY / USD cash, time and demand deposits, conversions), dated transaction
   ledger with commission and BSMV, back-dated funds and manual entries, value walk from the start date, deposit
   maturities, low-liquidity marks. Later phases add simulation, benchmarks, stress tests, VİOP and the glossary. */
const DX = DELUXE;
const DL = (en, tr) => (state.S && state.S.lang === 'tr' ? tr : en);
const dlFx = d => (state.fx ? state.fx(d) : fxNow());
const dlN = (v, d = 2) => fmtN(v, d);
const dlMoney = (v, c) => `${fmtN(v, 2)} ${c}`;
const dlDate = d => { if (!d) return '—'; if (state.S && state.S.lang === 'tr') { try { return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { } } return E.longDate(d); };
const dlBench = () => { const b = E.benchLabel(state.S); if (!(state.S && state.S.lang === 'tr')) return b; return TR[b] || { 'TRY deposit': 'TL mevduat', 'TRY time deposit': 'TL vadeli mevduat', 'money-market fund': 'para piyasası fonu', 'USD deposit': 'USD mevduat' }[b] || b; };

/* ---- settings: low-turnover BIST shares are eligible now (marked, not excluded) ---- */
const DL_S0 = state.S; // defaults before the stored settings arrive; migrate only the stored settings object
state.hooks.push(() => { const S = state.S; if (!S || S === DL_S0 || S.dlxLiq || !state.dbOk) return; if (S.gateTurnoverTRY === 50e6 || S.gateTurnoverTRY === undefined) S.gateTurnoverTRY = 0; if (S.liqWarnTRY === undefined) S.liqWarnTRY = 50e6; S.dlxLiq = 1; try { saveSettings(); } catch (e) { } });
{ const rs = renderScrn; renderScrn = function () { rs.apply(this, arguments); try { for (const tr of document.querySelectorAll('#view-SCRN tr.row[data-sym]')) { const x = state.map[tr.dataset.sym]; if (!x || !x.gate || !x.gate.lowLiq || tr.querySelector('.dlx-liq')) continue; const td = tr.querySelector('td.acc') || tr.querySelector('td'); if (td) td.insertAdjacentHTML('beforeend', ` <span class="pill warn dlx-liq" title="${esc(DL('30-day turnover below 50 m TRY: orders may fill at worse prices.', '30 günlük işlem hacmi 50 milyon TL altında: emirler daha kötü fiyattan gerçekleşebilir.'))}">${DL('low liq.', 'düşük lik.')}</span>`); } } catch (e) { console.error(e); } }; }

/* ---- fund value = equity lines + cash sleeve; invested = line amounts + net money added to the sleeve ---- */
const dlHasSleeve = p => Array.isArray(p.tx) && p.tx.length > 0;
const dlSettleAt = (code, d) => { const s = state.dlxSettles && state.dlxSettles[code]; const v = s ? DX.priceOn(s, d) : null; if (v) return v; const c = state.dlxViop && (state.dlxViop.items || []).find(i => i.code === code); return c && c.settle && (!c.settleDate || c.settleDate <= d) ? c.settle : null; };
const dlSleeve = (p, asOf) => DX.replay(p.tx || [], asOf || today(), dlFx, dlSettleAt);
const dlLinesTotal = p => (p.lines || []).reduce((a, l) => a + (+l.amount || 0), 0);
function dlNormalize(p) { if (!dlHasSleeve(p)) return; const sl = dlSleeve(p); p.sleeveIn = sl.netIn; p.total = DX.r2(dlLinesTotal(p) + sl.netIn); }
{ const pv = pkgValue; pkgValue = function (p) { let v = 0; try { v = (p.lines || []).length ? pv(p) : 0; } catch (e) { v = 0; } return dlHasSleeve(p) ? DX.r2(v + dlSleeve(p).value) : v; }; }
{ const pf = pkgFlows; pkgFlows = function (p) { const f = (p.lines || []).length ? pf(p) : []; return dlHasSleeve(p) && !p.__eqOnly ? f.concat(dlSleeve(p).flows) : f; }; }
// the sheet's own tiles describe the share part; the Deluxe panel above them shows the whole fund
{ const ps = packageSheetHTML; packageSheetHTML = function (p) {
    if (!(p.lines || []).length) return `<div class="grid"><div class="panel wide"><h2>${DL('Shares and funds', 'Hisseler ve fonlar')}</h2><div class="body"><p class="hint" style="margin:0">${DL('No share, fund or gold line yet. Use “Add trades (manual, any date)” above.', 'Henüz hisse, fon veya altın satırı yok. Yukarıdaki “İşlem ekle (elle, istenen tarihle)” düğmesini kullanın.')}</p></div></div></div>`;
    if (!dlHasSleeve(p)) return ps(p);
    const t0 = p.total; p.total = dlLinesTotal(p); p.__eqOnly = true; try { return ps(p); } finally { p.total = t0; delete p.__eqOnly; } }; }

/* ---- deposit maturities: credit interest automatically, warn a few days ahead ---- */
function dlMaturities() {
  let changed = false;
  for (const p of state.packages || []) { if (p.status === 'closed' || !dlHasSleeve(p)) continue;
    const vx = DX.viopExpiries(p.tx, today(), dlSettleAt); if (vx.length) { p.tx.push(...vx); changed = true; for (const t of vx) journal(`${p.name}: ${DL('futures expired and closed at the settlement price', 'vadeli sözleşmenin vadesi doldu, uzlaşma fiyatından kapandı')} ${t.code} @ ${t.price} (${t.date}).`, { kind: 'order', pkg: p.id }); }
    const add = DX.maturities(p.tx, today()); if (!add.length) continue; p.tx.push(...add); changed = true;
    for (const t of add) { const o = p.tx.find(z => z.type === 'dep-open' && z.depId === t.depId), it = DX.depositInterest({ principal: o.amount, rate: o.rate, start: o.date, maturity: o.maturity, stopaj: o.stopaj }, o.maturity);
      journal(`${p.name}: ${DL('time deposit matured', 'vadeli mevduatın vadesi doldu')} ${dlMoney(o.amount, o.ccy)} → ${DL('interest', 'faiz')} ${dlMoney(it.net, o.ccy)} ${DL('net, credited to cash', 'net, nakde eklendi')} (${t.date}).`, { kind: 'order', pkg: p.id });
      toast(`${p.name.replace(/ \(.*\)$/, '')}: ${DL('deposit matured, interest credited', 'mevduat vadesi doldu, faiz eklendi')} (${dlMoney(it.net, o.ccy)})`); } }
  if (changed) saveUser('packages');
}
state.hooks.unshift(() => { try { let moved = false; for (const p of state.packages || []) { dlNormalize(p); if (p.status !== 'closed' && typeof dlFixStart === 'function' && dlFixStart(p, true)) moved = true; } if (moved) saveUser('packages'); dlMaturities(); } catch (e) { console.error(e); } });
{ const la = liveAlerts; liveAlerts = function () { const out = la(); try { for (const p of state.packages || []) { if (p.status === 'closed' || !dlHasSleeve(p)) continue;
      for (const t of DX.dueSoon(p.tx, today(), 5)) out.push({ level: 'warn', kind: 'deposit', text: `${p.name.replace(/ \(.*\)$/, '')}: ${DL('time deposit', 'vadeli mevduat')} ${dlMoney(t.amount, t.ccy)} ${DL('matures on', 'vadesi')} ${dlDate(t.maturity)} (${DX.daysBetween(today(), t.maturity)} ${DL('days', 'gün')})${DL('.', ' doluyor.')}` });
      const w = dlSleeve(p).warn; if (w.length) out.push({ level: 'bad', kind: 'cash', text: `${p.name.replace(/ \(.*\)$/, '')}: ${w[0]}` }); } } catch (e) { } return out; }; }

/* ---- the Deluxe panels in the fund sheet ---- */
function dlTotalsHTML(p) {
  const v = pkgValue(p), inv = +p.total || 0, roi = inv > 0 ? (v / inv - 1) * 100 : null, sl = dlHasSleeve(p) ? dlSleeve(p) : null, eq = sl ? v - sl.value : v;
  const days = Math.max(0, DX.daysBetween(DX.fundStart(p) || p.date, today()));
  return `<div class="tiles">${[[DL('Invested (all money in)', 'Yatırılan (toplam giren para)'), T(inv)], [DL('Value now', 'Bugünkü değer'), T(v)], [DL('Gain / loss', 'Kazanç / zarar'), T(v - inv)], [DL('Return', 'Getiri'), P(roi)], [DL('Shares, funds, gold', 'Hisse, fon, altın'), T(eq)], [DL('Cash and deposits', 'Nakit ve mevduat'), T(sl ? sl.value : 0)], [DL('Days since start', 'Başlangıçtan beri gün'), String(days)]].map(([l, x]) => `<div class="tile"><div class="lbl">${l}</div><div class="val" style="font-size:16px">${x}</div></div>`).join('')}</div>`;
}
function dlSleeveHTML(p) {
  const sl = dlSleeve(p), fx = dlFx(today()), closed = p.status === 'closed';
  const deps = sl.open.map(d => { const left = d.maturity ? DX.daysBetween(today(), d.maturity) : null;
    return `<tr><td class="l txt">${d.maturity ? DL('Time deposit', 'Vadeli mevduat') : DL('Demand deposit', 'Vadesiz mevduat')}</td><td>${dlMoney(d.principal, d.ccy)}</td><td>${dlN(d.rate)}%</td><td class="l mono">${esc(d.start)}</td><td class="l mono">${d.maturity ? esc(d.maturity) : '—'}</td><td>${left === null ? '—' : left}</td><td>${dlMoney(d.accrued.net, d.ccy)}</td><td>${T(d.ccy === 'USD' ? (d.principal + d.accrued.net) * fx : d.principal + d.accrued.net)}</td><td>${closed ? '' : `<button class="quiet" data-dlx-break="${esc(d.id)}">${DL('Close', 'Kapat')}</button>`}</td></tr>`; }).join('');
  return `<div class="panel wide" id="dlx-sleeve"><h2>${DL('Cash, currency and deposits', 'Nakit, döviz ve mevduat')} <span class="sub">${DL('every entry is dated; past dates are allowed', 'her kayıt tarihlidir; geçmiş tarih girilebilir')}</span></h2><div class="body">
    <dl class="kv"><dt>${DL('TRY cash', 'TL nakit')}</dt><dd>${dlMoney(sl.cash.TRY, 'TRY')}</dd><dt>${DL('USD cash (demand)', 'USD nakit (vadesiz)')}</dt><dd>${dlMoney(sl.cash.USD, 'USD')} <span class="dim">≈ ${T(sl.cash.USD * fx)}</span></dd><dt>${DL('Net money added', 'Eklenen net para')}</dt><dd>${T(sl.netIn)}</dd><dt>${DL('Sleeve value', 'Bölüm değeri')}</dt><dd><b>${T(sl.value)}</b></dd></dl>
    ${sl.open.length ? `<div style="overflow-x:auto"><table style="margin-top:8px"><tr><th class="l">${DL('Deposit', 'Mevduat')}</th><th>${DL('Principal', 'Anapara')}</th><th>${DL('Rate', 'Faiz')}</th><th class="l">${DL('Start', 'Başlangıç')}</th><th class="l">${DL('Maturity', 'Vade')}</th><th>${DL('Days left', 'Kalan gün')}</th><th>${DL('Interest so far, net', 'Birikmiş faiz, net')}</th><th>${DL('Value', 'Değer')}</th><th></th></tr>${deps}</table></div>` : ''}
    ${sl.warn.length ? `<p class="down" style="margin:8px 0 0">${sl.warn.map(esc).join('<br>')}</p>` : ''}
    ${closed ? '' : `<div class="row-inline" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="primary" data-dlx-act="in">${DL('Add money', 'Para ekle')}</button><button data-dlx-act="fx">${DL('Convert TRY ↔ USD', 'TL ↔ USD çevir')}</button><button data-dlx-act="dep-open">${DL('Open deposit', 'Mevduat aç')}</button><button data-dlx-act="out">${DL('Take money out', 'Para çek')}</button><button data-dlx-manual="${esc(p.id)}">${DL('Add trades (manual, any date)', 'İşlem ekle (elle, istenen tarihle)')}</button></div>`}
    <p class="note">${DL('Deposit interest: simple interest, actual/365, withholding tax (stopaj) deducted. A time deposit stops earning at maturity; then principal and interest move to cash automatically. USD amounts are shown in TRY at today’s rate.', 'Mevduat faizi: basit faiz, gerçek gün/365, stopaj düşülerek. Vadeli mevduat vade sonunda faiz işletmeyi bırakır; anapara ve faiz otomatik olarak nakde geçer. USD tutarlar bugünkü kurla TL gösterilir.')}</p></div></div>`;
}
function dlLedgerHTML(p) {
  const L = k => ({ Buy: DL('Buy', 'Alış'), Sell: DL('Sell', 'Satış'), 'Money in': DL('Money in', 'Para girişi'), 'Money out': DL('Money out', 'Para çıkışı'), Convert: DL('Convert', 'Çevir'), 'Time deposit': DL('Time deposit', 'Vadeli mevduat'), 'Demand deposit': DL('Demand deposit', 'Vadesiz mevduat'), withholding: DL('withholding', 'stopaj'), 'Deposit matured': DL('Deposit matured', 'Mevduat vadesi doldu'), 'Deposit closed': DL('Deposit closed', 'Mevduat kapatıldı'), interest: DL('interest', 'faiz'), gross: DL('gross', 'brüt') }[k] || k);
  const rows = DX.txList(p, L), closed = p.status === 'closed';
  return `<div class="panel wide" id="dlx-ledger"><h2>${DL('Transaction ledger', 'İşlem defteri')} <span class="sub">${rows.length} ${DL('entries, newest first', 'kayıt, en yeni üstte')}</span></h2><div class="body">${rows.length ? `<table><tr><th class="l">${DL('Date', 'Tarih')}</th><th class="l">${DL('Transaction', 'İşlem')}</th><th>${DL('Quantity', 'Adet')}</th><th>${DL('Price', 'Fiyat')}</th><th>${DL('Amount, TRY', 'Tutar, TL')}</th><th>${DL('Commission', 'Komisyon')}</th><th>BSMV</th><th></th></tr>${rows.map(r => `<tr><td class="l mono">${esc(r.date)}</td><td class="l txt">${esc(r.text)}${r.auto ? ` <span class="pill src">${DL('automatic', 'otomatik')}</span>` : ''}${r.note && !r.auto ? `<div class="dim" style="font-size:11px">${esc(r.note)}</div>` : ''}</td><td>${r.qty ? dlN(r.qty, r.qty % 1 ? 4 : 0) : '—'}</td><td>${r.price ? dlN(r.price, 4) : '—'}</td><td>${r.amountTRY !== undefined ? N(r.amountTRY) : r.ccy === 'USD' ? N(r.amount * dlFx(r.date)) : N(r.amount)}</td><td>${r.fee ? N(r.fee) : '—'}</td><td>${r.bsmv ? N(r.bsmv) : '—'}</td><td style="white-space:nowrap">${closed ? '' : dlRowButtons(r)}</td></tr>`).join('')}</table>` : `<div class="empty">${DL('No transactions yet.', 'Henüz işlem yok.')}</div>`}
    <p class="note">${DL('✎ changes the date of an entry, ✕ removes it as if it had never been entered; the fund is recalculated and its start date follows the earliest entry. Automatic entries (matured deposits, expired futures) follow their deposit or contract.', '✎ kaydın tarihini değiştirir, ✕ kaydı hiç girilmemiş gibi kaldırır; fon yeniden hesaplanır ve başlangıç tarihi en eski kayda göre ayarlanır. Otomatik kayıtlar (vadesi dolan mevduat, vadesi biten vadeli işlem) bağlı oldukları mevduatı veya sözleşmeyi izler.')}</p></div></div>`;
}
function dlCompareHTML(p) {
  const flows = pkgFlows(p); if (!flows.length) return ''; let alt; try { alt = E.alternatives(flows, today(), { ...ctx(), fx: dlFx, inst: state.inst }); } catch (e) { return ''; }
  const v = pkgValue(p);
  return `<div class="panel wide" id="dlx-compare"><h2>${DL('The whole fund against the same money elsewhere', 'Fonun tamamı ve aynı paranın başka yerde getirisi')} <span class="sub">${DL('same dates and amounts, after withholding tax', 'aynı tarih ve tutarlar, stopaj sonrası')}</span></h2><div class="body"><table><tr><th class="l">${DL('Alternative', 'Alternatif')}</th><th>${DL('Value', 'Değer')}</th><th>${DL('Gain', 'Kazanç')}</th><th>${DL('Return', 'Getiri')}</th></tr><tr><td class="l txt"><b>${DL('This fund', 'Bu fon')}</b></td><td>${T(v)}</td><td>${T(v - alt.invested)}</td><td>${P(alt.invested ? (v / alt.invested - 1) * 100 : null)}</td></tr>${alt.rows.map(r => `<tr><td class="l txt">${esc(r.name)}</td><td>${T(r.value)}</td><td>${T(r.gain)}</td><td>${P(r.pct)}</td></tr>`).join('')}</table><p class="note">${DL('Every amount the fund received (share purchases and money added) is put into each alternative on the same day.', 'Fona giren her tutar (hisse alımları ve eklenen para) aynı gün her alternatife yatırılmış gibi hesaplanır.')}</p></div></div>`;
}
function dlHistoryHTML() { return `<div class="panel wide" id="dlx-hist"><h2>${DL('Fund value since the start', 'Başlangıçtan bugüne fon değeri')} <span class="sub" id="dlx-hist-sub"></span></h2><div class="body"><div id="dlx-hist-chart" style="min-height:60px"><p class="hint">${DL('Loading prices…', 'Fiyatlar yükleniyor…')}</p></div><p class="note" id="dlx-hist-note"></p></div></div>`; }
function dlDrawHistory(p) {
  const el = $('dlx-hist-chart'); if (!el) return;
  const syms = [...new Set((p.lines || []).map(l => l.symbol))], closesOf = s => f4LongCloses(s) || (state.map[s] && state.map[s].closes) || (state.inst[s] && state.inst[s].closes) || [];
  const missing = syms.filter(s => !closesOf(s).length); if (missing.length && !p.__dlxSeries) { p.__dlxSeries = true; f4Series(missing).then(() => { if (state.sheet && state.sheet.id === p.id) dlDrawHistory(p); }); }
  const sr = DX.valueSeries(p, { today: today(), closesOf, ccyOf: s => (state.map[s] || state.inst[s] || {}).ccy, fxAt: dlFx, settleAt: dlSettleAt });
  if (sr.length < 2) { el.innerHTML = `<p class="hint">${DL('The fund started today; the chart begins tomorrow.', 'Fon bugün başladı; grafik yarından itibaren çizilir.')}</p>`; return; }
  const st = DX.seriesStats(sr), W = Math.max(320, Math.round(el.getBoundingClientRect().width) || 640), H = 200, Lm = 8, R = 84, Tp = 10, B = 20;
  const vals = sr.flatMap(r => [r.value, r.invested]); let mn = Math.min(...vals), mx = Math.max(...vals); const pad = (mx - mn) * 0.06 || mx * 0.02 || 1; mn -= pad; mx += pad;
  const sx = i => Lm + i * ((W - Lm - R) / (sr.length - 1)), sy = v => Tp + (H - Tp - B) - (v - mn) / (mx - mn) * (H - Tp - B), path = k => sr.map((r, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ',' + sy(r[k]).toFixed(1)).join('');
  let g = ''; for (const f of [0, 0.5, 1]) { const v = mn + (mx - mn) * f, y = sy(v); g += `<line class="ax" x1="${Lm}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke-dasharray="2 3"/><text x="${W - R + 6}" y="${(y + 3.5).toFixed(1)}">${esc(VIZ.fmtBig(v))}</text>`; }
  g += `<path d="${path('invested')}" fill="none" stroke="var(--fg2)" stroke-width="1.2" stroke-dasharray="4 3"/><path d="${path('value')}" fill="none" stroke="var(--c1)" stroke-width="2"/>`;
  g += `<text x="${Lm}" y="${H - 5}">${esc(sr[0].date)}</text><text x="${W - R}" y="${H - 5}" text-anchor="end">${esc(sr[sr.length - 1].date)}</text>`;
  el.classList.add('chart-wrap'); el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px">${g}</svg><div class="legend"><div><i style="background:var(--c1)"></i>${DL('fund value', 'fon değeri')}</div><div><i style="background:var(--fg2)"></i>${DL('money put in', 'yatırılan para')}</div></div>`;
  $('dlx-hist-sub').textContent = `${dlDate(st.start)} → ${dlDate(st.end)} · ${DL('return', 'getiri')} ${fmtPct(st.pct)} · ${DL('largest fall from a peak', 'zirveden en büyük düşüş')} ${fmtPct(st.maxDrawdown)}`;
  const miss = sr[sr.length - 1].missing; $('dlx-hist-note').textContent = DL(`Daily closes of each line from its purchase date (USD lines at that day’s USD/TRY), sales at their proceeds, cash and deposits with interest.${miss ? ' Lines without price history are held at cost.' : ''}`, `Her satır alış tarihinden itibaren günlük kapanışlarla (USD satırlar o günün USD/TRY kuruyla), satışlar satış tutarıyla, nakit ve mevduat faiziyle birlikte değerlenir.${miss ? ' Fiyat geçmişi olmayan satırlar maliyetle tutulur.' : ''}`);
}
{ const _rs = renderSheet; renderSheet = function () { _rs(); const w = state.sheet; if (!w || w.type !== 'pkg') return; const p = state.packages.find(q => q.id === w.id); if (!p) return; const grid = $('sheet').querySelector('.grid'); if (!grid || grid.querySelector('#dlx-totals')) return;
    grid.insertAdjacentHTML('afterbegin', `<div class="panel wide" id="dlx-totals"><h2>${DL('The whole fund', 'Fonun tamamı')} <span class="sub">${DL('shares, funds, gold, cash and deposits', 'hisse, fon, altın, nakit ve mevduat')}</span></h2><div class="body">${dlTotalsHTML(p)}</div></div>${dlHistoryHTML()}${dlSleeveHTML(p)}${dlHasSleeve(p) ? dlCompareHTML(p) : ''}`);
    grid.insertAdjacentHTML('beforeend', dlLedgerHTML(p)); try { dlDrawHistory(p); } catch (e) { console.error(e); } }; }

/* ---- sleeve actions ---- */
function dlActionDialog(p, kind, depId) {
  const d0 = today(), title = { in: DL('Add money to the fund', 'Fona para ekle'), out: DL('Take money out of the fund', 'Fondan para çek'), fx: DL('Convert currency', 'Döviz çevir'), 'dep-open': DL('Open a deposit', 'Mevduat aç'), 'dep-close': DL('Close a deposit', 'Mevduatı boz / kapat') }[kind];
  const dep = depId ? dlSleeve(p).open.find(x => x.id === depId) : null;
  const f = (id, label, input) => `<label for="${id}">${label}</label>${input}`;
  const ccySel = (id, v) => `<select id="${id}"><option value="TRY" ${v === 'TRY' ? 'selected' : ''}>TRY</option><option value="USD" ${v === 'USD' ? 'selected' : ''}>USD</option></select>`;
  const body = [f('dx-date', DL('Date', 'Tarih'), `<input id="dx-date" type="date" value="${esc(dep ? d0 : d0)}" max="${d0}">`)];
  if (kind === 'in' || kind === 'out') body.push(f('dx-ccy', DL('Currency', 'Para birimi'), ccySel('dx-ccy', 'TRY')), f('dx-amt', DL('Amount', 'Tutar'), '<input id="dx-amt" type="number" step="any" min="0">'));
  if (kind === 'fx') body.push(f('dx-ccy', DL('From', 'Kaynak'), ccySel('dx-ccy', 'TRY')), f('dx-amt', DL('Amount to convert', 'Çevrilecek tutar'), '<input id="dx-amt" type="number" step="any" min="0">'), f('dx-fx', DL('Rate (TRY per USD)', 'Kur (1 USD kaç TL)'), `<input id="dx-fx" type="number" step="any" value="${dlFx(d0).toFixed(4)}">`), f('dx-to', DL('You receive', 'Alınan tutar'), '<input id="dx-to" type="number" step="any" min="0">'));
  if (kind === 'dep-open') body.push(f('dx-ccy', DL('Currency', 'Para birimi'), ccySel('dx-ccy', 'TRY')), f('dx-amt', DL('Principal', 'Anapara'), '<input id="dx-amt" type="number" step="any" min="0">'), f('dx-kind', DL('Type', 'Tür'), `<select id="dx-kind"><option value="time">${DL('Time deposit (vadeli)', 'Vadeli mevduat')}</option><option value="demand">${DL('Demand deposit (vadesiz)', 'Vadesiz mevduat')}</option></select>`), f('dx-rate', DL('Interest rate, % a year', 'Yıllık faiz oranı, %'), `<input id="dx-rate" type="number" step="any" value="${esc(state.S.depRate ?? '')}">`), f('dx-mat', DL('Maturity date', 'Vade tarihi'), `<input id="dx-mat" type="date" value="${DX.addDays(d0, 32)}">`), f('dx-stop', DL('Withholding tax (stopaj), %', 'Stopaj oranı, %'), `<input id="dx-stop" type="number" step="any" value="${esc(state.S.dlxStopaj ?? 17.5)}">`));
  if (kind === 'dep-close') body.push(`<p class="hint" style="grid-column:1/-1;margin:0">${dep ? `${dlMoney(dep.principal, dep.ccy)} @ ${dlN(dep.rate)}% ${DL('since', 'başlangıç')} ${esc(dep.start)}${dep.maturity ? ', ' + DL('maturity', 'vade') + ' ' + esc(dep.maturity) : ''}.` : ''} ${DL('Leave interest empty to use the calculated interest; a time deposit broken early often pays little or none — enter what the bank paid.', 'Faizi boş bırakırsanız hesaplanan faiz kullanılır; vadesinden önce bozulan mevduat çoğu zaman az faiz öder veya hiç ödemez — bankanın ödediği brüt faizi girin.')}</p>`, f('dx-int', DL('Interest paid, gross', 'Ödenen faiz, brüt'), '<input id="dx-int" type="number" step="any" min="0" placeholder="auto">'));
  if (kind === 'dep-open' || kind === 'fx') body.push(f('dx-auto', DL('If cash is short', 'Nakit yetmezse'), `<label class="hint" style="display:flex;gap:6px;align-items:center"><input id="dx-auto" type="checkbox" checked> ${DL('add the missing amount to the fund as money in, same date', 'eksik tutarı aynı tarihle fona para girişi olarak ekle')}</label>`));
  body.push(f('dx-fee', DL('Commission', 'Komisyon'), '<input id="dx-fee" type="number" step="any" min="0" value="0">'), f('dx-bsmv', 'BSMV', '<input id="dx-bsmv" type="number" step="any" min="0" value="0">'), f('dx-note', DL('Note', 'Not'), '<input id="dx-note" type="text" style="max-width:420px">'));
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="${esc(title)}" style="width:min(620px,100%)"><h3>${esc(title)}</h3><p class="hint">${esc(p.name)}</p><div class="form" style="margin-top:10px">${body.join('')}</div><p class="down" id="dx-err" style="margin:8px 0 0"></p><div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:14px"><button id="dx-cancel">${DL('Cancel', 'Vazgeç')}</button><button id="dx-ok" class="primary">${DL('Save', 'Kaydet')}</button></div></div>`;
  $('dx-cancel').onclick = closeModal;
  const num = id => { const el = $(id); if (!el || el.value === '') return null; const v = +String(el.value).replace(',', '.'); return isFinite(v) ? v : null; };
  if (kind === 'fx') { const upd = src => { const a = num('dx-amt'), r = num('dx-fx'), c = $('dx-ccy').value; if (src !== 'to' && a && r) $('dx-to').value = (c === 'TRY' ? a / r : a * r).toFixed(2); };
    $('dx-amt').oninput = () => upd(); $('dx-fx').oninput = () => upd(); $('dx-ccy').onchange = () => upd(); $('dx-date').onchange = () => { $('dx-fx').value = dlFx($('dx-date').value).toFixed(4); upd(); }; }
  if (kind === 'dep-open') $('dx-kind').onchange = () => { $('dx-mat').disabled = $('dx-kind').value === 'demand'; };
  $('dx-ok').onclick = () => {
    const date = $('dx-date').value, err = m => { $('dx-err').textContent = m; };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) return err(DL('Choose a date up to today.', 'Bugün veya öncesine ait bir tarih seçin.'));
    if (date < (DX.fundStart(p) || date) && !p.lines.length && p.tx && p.tx.length) { /* earlier than the first entry is fine: the fund simply starts earlier */ }
    const t = { id: DX.newId('tx'), date, type: kind, fee: num('dx-fee') || 0, bsmv: num('dx-bsmv') || 0, note: ($('dx-note').value || '').trim() };
    if (kind === 'dep-close') { if (!dep) return err('?'); if (date < dep.start) return err(DL('The closing date is before the deposit started.', 'Kapanış tarihi mevduat başlangıcından önce.')); Object.assign(t, { ccy: dep.ccy, amount: dep.principal, depId: dep.id }); const it = num('dx-int'); if (it !== null) t.interest = it; }
    else { const amt = num('dx-amt'); if (!(amt > 0)) return err(DL('Enter an amount above zero.', 'Sıfırdan büyük bir tutar girin.')); Object.assign(t, { ccy: $('dx-ccy').value, amount: amt }); }
    if (kind === 'fx') { const r = num('dx-fx'), to = num('dx-to'); if (!(r > 0) || !(to > 0)) return err(DL('Enter the rate and the amount received.', 'Kuru ve alınan tutarı girin.')); Object.assign(t, { fx: r, toCcy: t.ccy === 'TRY' ? 'USD' : 'TRY', toAmount: to }); }
    if (kind === 'in' || kind === 'out') { if (t.ccy === 'USD') t.fx = dlFx(date); }
    if (kind === 'dep-open') { const demand = $('dx-kind').value === 'demand', rate = num('dx-rate'); if (rate === null || rate < 0) return err(DL('Enter the interest rate.', 'Faiz oranını girin.')); const mat = demand ? null : $('dx-mat').value; if (!demand && !(mat > date)) return err(DL('The maturity must be after the start date.', 'Vade tarihi başlangıçtan sonra olmalı.')); Object.assign(t, { depId: DX.newId('dep'), rate, maturity: mat, stopaj: num('dx-stop') || 0 }); state.S.dlxStopaj = t.stopaj; }
    p.tx = p.tx || []; const before = JSON.stringify(p.tx);
    let added = null; if ((kind === 'dep-open' || kind === 'fx') && $('dx-auto') && $('dx-auto').checked) { const have = DX.replay(p.tx, date, dlFx, dlSettleAt).cash[t.ccy] || 0, need = (+t.amount || 0) + (+t.fee || 0) + (+t.bsmv || 0);
      if (have < need - 0.005) { added = { id: DX.newId('tx'), date, type: 'in', ccy: t.ccy, amount: DX.r2(need - Math.max(0, have)), fx: t.ccy === 'USD' ? dlFx(date) : undefined, note: DL('added for ', 'eklendi: ') + (kind === 'fx' ? DL('conversion', 'döviz çevirme') : DL('deposit', 'mevduat')) }; p.tx.push(added); } }
    p.tx.push(t);
    const chk = DX.replay(p.tx, today(), dlFx, dlSettleAt); if (chk.warn.length && kind !== 'in') { p.tx = JSON.parse(before); return err(DL('Not enough cash for this on that date: ', 'O tarihte bunun için yeterli nakit yok: ') + chk.warn[0] + DL('. Add money first (it can be back-dated).', '. Önce para ekleyin (geçmiş tarihli olabilir).')); }
    if (kind === 'dep-close') { const add = DX.maturities(p.tx, today()); /* nothing: the deposit is closed now */ }
    if (added) journal(`${p.name}: ${DX.txText(added, k => k)} (${date}).`, { kind: 'order', pkg: p.id });
    dlNormalize(p); journal(`${p.name}: ${DX.txText(t, k => k)}${t.fee ? ` · ${DL('commission', 'komisyon')} ${dlN(t.fee)}` : ''}${t.bsmv ? ` · BSMV ${dlN(t.bsmv)}` : ''} (${date}).`, { kind: 'order', pkg: p.id });
    saveUser('packages'); closeModal(); renderAll(); reopenSheet(); toast(DL('Saved', 'Kaydedildi'), () => { p.tx = JSON.parse(before); dlNormalize(p); saveUser('packages'); renderAll(); reopenSheet(); toast(DL('Undone', 'Geri alındı')); });
  };
}
document.addEventListener('click', e => {
  const a = e.target.closest('button[data-dlx-act]'), b = e.target.closest('button[data-dlx-break]'), c = e.target.closest('button[data-dlx-deltx]'), m = e.target.closest('button[data-dlx-manual]'), nf = e.target.closest('#dlx-newfund');
  if (!a && !b && !c && !m && !nf) return; e.stopPropagation();
  if (nf) return dlNewFundDialog();
  if (m) return dlManualEntry(m.dataset.dlxManual);
  const p = state.sheet && state.packages.find(q => q.id === state.sheet.id); if (!p) return;
  if (a) dlActionDialog(p, a.dataset.dlxAct);
  else if (b) dlActionDialog(p, 'dep-close', b.dataset.dlxBreak);
  else if (c) { /* replaced by the ledger editor below */ }
}, true);

/* ---- new fund on any date (empty, or with money / trades added afterwards) ---- */
function dlNewFundDialog() {
  const d0 = today(), n = (typeof impNextN === 'function' ? impNextN() : state.packages.length + 1);
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="New fund" style="width:min(620px,100%)"><h3>${DL('New fund (any start date)', 'Yeni fon (istenen başlangıç tarihiyle)')}</h3><p class="hint">${DL('For money you already invested: choose the start date, then add money, deposits, currency and trades with their real dates and prices.', 'Daha önce yaptığınız yatırımlar için: başlangıç tarihini seçin, sonra para, mevduat, döviz ve alım-satımları gerçek tarih ve fiyatlarıyla ekleyin.')}</p>
    <div class="form" style="margin-top:10px"><label for="nf-name">${DL('Name', 'Ad')}</label><input id="nf-name" type="text" style="max-width:420px" placeholder="${esc(DL('optional', 'isteğe bağlı'))}"><label for="nf-date">${DL('Start date', 'Başlangıç tarihi')}</label><input id="nf-date" type="date" value="${d0}" max="${d0}"><label for="nf-hold">${DL('Hold period', 'Tutma süresi')}</label><select id="nf-hold">${holdOptions().map(o => `<option value="${o[2]}" ${o[2] === 182 ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>
    <label for="nf-ccy">${DL('Money in at the start (optional)', 'Başlangıçta yatırılan para (isteğe bağlı)')}</label><span class="row-inline" style="gap:6px"><input id="nf-amt" type="number" step="any" min="0" style="width:150px"><select id="nf-ccy"><option>TRY</option><option>USD</option></select></span>
    <label for="nf-why">${DL('Reason', 'Gerekçe')}</label><input id="nf-why" type="text" style="max-width:420px"></div><p class="down" id="nf-err"></p>
    <div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:14px"><button id="nf-cancel">${DL('Cancel', 'Vazgeç')}</button><button id="nf-ok" class="primary">${DL('Create fund', 'Fonu oluştur')}</button></div></div>`;
  $('nf-cancel').onclick = closeModal;
  $('nf-ok').onclick = () => {
    const date = $('nf-date').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) { $('nf-err').textContent = DL('Choose a start date up to today.', 'Bugün veya öncesine ait bir başlangıç tarihi seçin.'); return; }
    const hold = +$('nf-hold').value || 182, hk = holdOptions().find(o => o[2] === hold) || holdOptions()[6], amt = +$('nf-amt').value || 0, ccy = $('nf-ccy').value, m = ctx().M;
    const base = typeof impFundName === 'function' ? impFundName(n, date) : `GNC Inv. Fund – ${E.roman(n)} (${dlDate(date)})`, nm = ($('nf-name').value || '').trim();
    const p = { id: 'p' + Date.now().toString(36), n, name: nm ? `${nm} (${dlDate(date)})` : base, date, total: 0, lines: [], tranches: [], trWeeks: 2, holdDays: hold, holdLabel: hk[1], ordered: true, orderedAt: date, reason: ($('nf-why').value || '').trim() || DL('Created by hand', 'Elle oluşturuldu'),
      xu100At: (typeof impCloseAt === 'function' && impCloseAt('XU100', date)) || m.xu100 || null, usdtryAt: dlFx(date), benchmark: dlBench(), depRate: state.S.depRate, mmRate: state.S.tlRate, status: 'open', tx: [], dlx: 2 };
    if (amt > 0) p.tx.push({ id: DX.newId('tx'), date, type: 'in', ccy, amount: amt, fx: ccy === 'USD' ? dlFx(date) : undefined, note: DL('starting money', 'başlangıç parası') });
    dlNormalize(p); if (typeof fundIdOf === 'function') try { p.fundId = fundIdOf(p); } catch (e) { }
    state.packages.push(p); journal(`${p.name} ${DL('created by hand, starting', 'elle oluşturuldu, başlangıç')} ${date}${amt ? ` ${DL('with', 'ile')} ${dlMoney(amt, ccy)}` : ''}.`, { kind: 'decision', pkg: p.id });
    saveUser('packages'); closeModal(); showView('PKGS'); renderAll(); openSheet({ type: 'pkg', id: p.id }); toast(DL('Fund created — add money, deposits or trades', 'Fon oluşturuldu — para, mevduat veya alım-satım ekleyin'));
  };
}

/* ---- manual trades on any date: the broker-report preview with empty, editable rows ---- */
function dlManualEntry(pkgId) {
  const p = pkgId ? state.packages.find(q => q.id === pkgId) : null, d0 = p ? (p.date > today() ? today() : today()) : today();
  impOpen(); IMP.manual = true;
  const res = { broker: DL('Manual entry', 'Elle giriş'), kind: 'manual', file: '', trades: [{ date: d0, side: 'BUY', symbol: '', qty: 0, price: 0, amount: 0, commission: 0, bsmv: 0, sig: null }] };
  impUse([res]); if (p) { IMP.mode = 'add'; IMP.target = p.id; } impRender();
}
// re-rendering the dialog inside a 'change' fired by a blur removes the focused node mid-event (Chromium error): defer it
{ const ir0 = impRender; let q = false; impRender = function () { const ev = window.event; if (ev && ev.type === 'change') { if (q) return; q = true; setTimeout(() => { q = false; impRender(); }, 0); return; } ir0(); }; }
{ const ir = impRender; impRender = function () { const ev = window.event; if (ev && ev.type === 'change') return ir(); ir(); if (!IMP.manual || !IMP.rows.length) { const dz = $('imp-drop'); if (dz && !$('dlx-man-open')) dz.insertAdjacentHTML('afterend', `<p class="hint" style="margin:10px 0 0">${DL('No report? ', 'Rapor yok mu? ')}<button class="quiet" id="dlx-man-open">${DL('Enter trades by hand (any date)', 'İşlemleri elle girin (istenen tarihle)')}</button></p>`); const mo = $('dlx-man-open'); if (mo) mo.onclick = ev => { ev.preventDefault(); dlManualEntry(null); }; return; }
    // manual mode: date, side and BSMV become editable; rows can be added and removed
    const h3 = document.querySelector('#modal h3'); if (h3) h3.textContent = DL('Add trades by hand', 'İşlemleri elle ekle');
    const hint = document.querySelector('#modal .modal > p.hint'); if (hint) hint.textContent = DL('Enter each trade with its real date and price (also past dates). The amount is quantity × price (× USD/TRY of that day for US shares) plus commission and BSMV. Gold: symbol GAUTRY, quantity in grams.', 'Her işlemi gerçek tarihi ve fiyatıyla girin (geçmiş tarihler dahil). Tutar = adet × fiyat (ABD hisselerinde o günün USD/TRY kuruyla) + komisyon + BSMV. Altın: sembol GAUTRY, adet gram cinsinden.');
    IMP.rows.forEach((r, i) => { const tr = document.querySelector(`#modal tr[data-imp-row="${i}"]`); if (!tr) return; const td = tr.children;
      if (td[1]) td[1].innerHTML = `<input type="date" data-dlx-rf="date" data-dlx-ri="${i}" value="${esc(r.date || '')}" max="${today()}">`;
      if (td[2]) td[2].innerHTML = `<select data-dlx-rf="side" data-dlx-ri="${i}"><option value="BUY" ${r.side === 'BUY' ? 'selected' : ''}>${DL('Buy', 'Alış')}</option><option value="SELL" ${r.side === 'SELL' ? 'selected' : ''}>${DL('Sell', 'Satış')}</option></select>`;
      const last = td[td.length - 1]; if (last) last.insertAdjacentHTML('beforeend', ` <label class="hint" style="white-space:nowrap">BSMV <input type="number" step="any" min="0" style="width:70px" data-dlx-rf="bsmv" data-dlx-ri="${i}" value="${+r.bsmv || 0}"></label> <button class="quiet" data-dlx-rdel="${i}" title="${DL('Remove row', 'Satırı sil')}">✕</button>`); });
    const tbl = document.querySelector('#modal table'); if (tbl && !$('dlx-addrow')) tbl.insertAdjacentHTML('afterend', `<div class="row-inline" style="margin-top:6px"><button class="quiet" id="dlx-addrow">+ ${DL('Add row', 'Satır ekle')}</button></div>`);
    const ar = $('dlx-addrow'); if (ar) ar.onclick = () => { const prev = IMP.rows[IMP.rows.length - 1] || {}; IMP.rows.push({ date: prev.date || today(), side: 'BUY', symbol: '', qty: 0, price: 0, amount: 0, commission: 0, bsmv: 0, inc: true, known: false, ri: 0 }); IMP.results[0].trades = IMP.rows; impRender(); };
    document.querySelectorAll('#modal [data-dlx-rf]').forEach(inp => inp.onchange = () => { const r = IMP.rows[+inp.dataset.dlxRi], f = inp.dataset.dlxRf; if (f === 'bsmv') { const v = +String(inp.value).replace(',', '.'); r.bsmv = isFinite(v) && v >= 0 ? v : 0; } else r[f] = inp.value; impRender(); });
    document.querySelectorAll('#modal [data-dlx-rdel]').forEach(b => b.onclick = () => { IMP.rows.splice(+b.dataset.dlxRdel, 1); if (!IMP.rows.length) IMP.rows.push({ date: today(), side: 'BUY', symbol: '', qty: 0, price: 0, amount: 0, commission: 0, bsmv: 0, inc: true, known: false, ri: 0 }); impRender(); });
    const back = $('imp-back'); if (back) back.style.display = 'none';
  }; }
// BSMV is paid with the commission: fold it in for the fund line, keep it on the fill for the ledger
{ const ig = impGroups; impGroups = function (side) { const saved = IMP.rows.map(r => r.commission); if (IMP.manual) IMP.rows.forEach(r => { r.__c = +r.commission || 0; r.commission = (+r.commission || 0) + (+r.bsmv || 0); });
    try { return ig(side); } finally { if (IMP.manual) IMP.rows.forEach((r, i) => { r.commission = saved[i]; delete r.__c; }); } }; }
{ const ic = impCommit; impCommit = async function () {
    if (!IMP.manual) return ic();
    const bad = IMP.rows.filter(r => r.inc && (!r.date || r.date > today())); if (bad.length) { toast(DL('Every row needs a date up to today', 'Her satıra bugün veya öncesine ait bir tarih girin')); return; }
    const ids = new Set(state.packages.map(p => p.id)), nJ = state.journal.length, rows = IMP.rows.filter(r => r.inc).map(r => ({ ...r }));
    await ic();
    const created = state.packages.find(p => !ids.has(p.id)), src = DL('manual entry', 'elle giriş');
    for (const p of state.packages) { if (created && p !== created) continue; if (!created && !(state.sheet && p.id === state.sheet.id) && p.id !== IMP.target) continue;
      if (p.reason && /Manual entry|Elle giriş/.test(p.reason)) p.reason = DL('Entered by hand', 'Elle girildi'); if (p.imported) p.imported.broker = src;
      for (const l of p.lines) for (const f of l.fills || []) if (f.src === 'import' && !f.manual) { const r = rows.find(z => z.symbol === l.symbol && z.date === f.date && +z.qty === +f.qty); if (r) { f.src = 'manual'; f.manual = true; f.bsmv = +r.bsmv || 0; f.commission = +r.commission || 0; } } }
    for (const j of state.journal.slice(nJ)) j.text = j.text.replace(/Imported (Manual entry|Elle giriş) confirmation/g, DL('Entered by hand', 'Elle girildi')).replace(/(Manual entry|Elle giriş) confirmation/g, src);
    IMP.manual = false; saveUser('packages'); saveUser('journal'); renderAll(); reopenSheet();
    try { const tt = $('toast'); const n = rows.length; if (tt && tt.firstChild) { const s = tt.querySelector('span') || tt.firstChild; s.textContent = created ? `${created.name} ${DL('created', 'oluşturuldu')} — ${n} ${DL(n > 1 ? 'trades' : 'trade', 'işlem')}` : `${n} ${DL(n > 1 ? 'trades added' : 'trade added', 'işlem eklendi')}`; } } catch (e) { }
  }; }

/* ---- Packages tab: "New fund" next to the report import ---- */
state.hooks.push(() => { const b = $('imp-open'); if (!b || $('dlx-newfund')) return; b.insertAdjacentHTML('afterend', `<button id="dlx-newfund">${DL('New fund (any date)', 'Yeni fon (istenen tarihle)')}</button>`); });

/* ================= Phase 2: positions, simulation to the end of the span, suggestions, stress tests, benchmarks ================= */
const dlKindOf = x => { if (!x) return 'other'; if (x.sub === 'gold' || /XAU|GOLD|ALTIN/i.test(x.symbol + ' ' + (x.name || ''))) return 'gold'; if (x.cls === 'US_EQ' || x.cls === 'US_ETF') return 'us_eq';
  if (x.cls === 'TEFAS') return x.sub === 'mm' ? 'try_mm' : 'tr_eq'; if (x.cls === 'TR_EQ' || x.cls === 'TR_ETF') return 'tr_eq'; if (x.cls === 'VIOP') return 'viop'; return 'other'; };
// everything the fund holds today, valued in TRY: open share / fund / gold lines and the cash sleeve
function dlPositions(p) {
  const out = [], m = ctx().M;
  if ((p.lines || []).some(l => !l.closed)) { let rows = []; try { rows = E.holdingsView([], [{ ...p, lines: p.lines.filter(l => !l.closed) }], state.map, m, state.S); } catch (e) { }
    for (const r of rows) if (r.value > 0) { const x = r.x || state.map[r.symbol]; out.push({ name: r.symbol, symbol: r.symbol, x, kind: dlKindOf(x), valueTRY: r.value, beta: x && x.e ? x.e.beta : 1, ccy: x ? x.ccy : 'TRY', qty: r.qty }); } }
  if (dlHasSleeve(p)) { const sl = dlSleeve(p), fx = dlFx(today());
    if (sl.cash.TRY > 0.5) out.push({ name: DL('TRY cash', 'TL nakit'), kind: 'try_cash', valueTRY: sl.cash.TRY, ccy: 'TRY' });
    if (sl.cash.USD > 0.005) out.push({ name: DL('USD cash', 'USD nakit'), kind: 'usd_cash', valueTRY: sl.cash.USD * fx, usd: sl.cash.USD, ccy: 'USD' });
    for (const v of sl.viop) { const u = dlViopUnder(v.under, v.code); out.push({ name: `${v.code} ${v.side === 'short' ? DL('short', 'kısa') : DL('long', 'uzun')} ×${v.qty}`, kind: 'viop', code: v.code, side: v.side, qty: v.qty, under: v.under, last: v.last, valueTRY: v.equity, notional: v.notional, notionalNow: v.notional, underKind: u.kind, uMultAnn: u.multAnn, uSig: u.vol / 100, beta: u.beta, ccy: 'TRY' }); }
    for (const d of sl.open) out.push({ name: `${d.maturity ? DL('Time deposit', 'Vadeli mevduat') : DL('Demand deposit', 'Vadesiz mevduat')} ${d.ccy}${d.maturity ? ' → ' + d.maturity : ''}`, kind: d.ccy === 'USD' ? 'usd_dep' : 'try_dep', demand: !d.maturity, dep: d, valueTRY: (d.principal + d.accrued.net) * (d.ccy === 'USD' ? fx : 1), ccy: d.ccy }); }
  return out;
}
// expected value multiple of one share / fund / gold line over t years (model expectation, before exit costs), and its 1-σ
function dlLineExpect(x, valueTRY, t) { try { const sc = E.scenario(x, Math.max(1000, valueTRY), t, state.S, ctx().M, x.z); const A = Math.max(1000, valueTRY), base = A - (sc.entry ? sc.entry.side : 0); return { mult: sc.exp.gross / (base || A), sig: sc.sig / 100, roiNet: sc.exp.roi * 100 }; } catch (e) { return null; } }
const dlFxMult = t => Math.pow(1 + (f4Fx() || 0) / 100, t);
function dlHorizonDays(p, pick) { if (pick && pick !== 'span') return +pick; const end = DX.addDays(p.orderedAt || p.date, p.holdDays || 182), d = DX.daysBetween(today(), end); return d >= 30 ? d : 182; }

// one-factor Monte Carlo (shares and gold share a market factor; USD/TRY its own): handles futures (long and short) and lines without history
function dlMonteCarlo(items, detAt, days, opts = {}) {
  const n = opts.n || 2000, steps = 24, stepDays = Array.from({ length: steps + 1 }, (_, s) => Math.round(days * s / steps)), rnd = (() => { let s = 20261113 >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const vals = Array.from({ length: steps + 1 }, () => new Float64Array(n)), dt = days / 365 / steps;
  for (let k = 0; k < n; k++) { const lr = items.map(() => 0); vals[0][k] = items.reduce((a, it) => a + it.expo, 0) + detAt(0);
    for (let s = 1; s <= steps; s++) { const zm = gauss(), zf = gauss(); let v = detAt(stepDays[s]);
      items.forEach((it, i) => { const rho = it.factor === 'fx' ? 0 : 0.4, z = it.factor === 'fx' ? zf : Math.sqrt(rho) * zm + Math.sqrt(1 - rho) * gauss(); lr[i] += (it.mu - it.sig * it.sig / 2) * dt + it.sig * Math.sqrt(dt) * z; v += it.expo * Math.exp(lr[i]); });
      vals[s][k] = v; } }
  const qs = { p05: 0.05, p25: 0.25, p50: 0.5, p75: 0.75, p95: 0.95 }, paths = {}; for (const q of Object.keys(qs)) paths[q] = [];
  for (let s = 0; s <= steps; s++) { const a = Float64Array.from(vals[s]).sort(); for (const [q, pq] of Object.entries(qs)) paths[q].push(a[Math.round(pq * (n - 1))]); }
  const term = vals[steps]; let mean = 0, beat = 0; for (const v of term) { mean += v; if (opts.bench !== undefined && v > opts.bench) beat++; }
  return { method: 'montecarlo', paths, stepDays, mean: mean / n, pBeat: opts.bench !== undefined ? beat / n : null, ...Object.fromEntries(Object.keys(qs).map(q => [q, paths[q][steps]])) };
}
async function dlSimulate(p, days) {
  const pos = dlPositions(p), t = days / 365, S = state.S, m = ctx().M, sk = [];
  const risky = [], det = []; // det: value at a given day (deterministic)
  for (const q of pos) {
    if (q.kind === 'try_cash') det.push(() => q.valueTRY);
    else if (q.kind === 'try_dep') { const d = q.dep; det.push(dd => { const end = DX.addDays(today(), dd); const it = DX.depositInterest(d, end); return d.principal + it.net; }); }
    else if (q.kind === 'usd_cash' || q.kind === 'usd_dep') { const g = q.kind === 'usd_dep' ? (q.dep.principal + DX.depositInterest(q.dep, DX.addDays(today(), days)).net) / (q.dep.principal + q.dep.accrued.net) : 1; risky.push({ q, symbol: 'USD/TRY', ccy: 'TRY', mult: dlFxMult(t) * g, sig: (+S.fxVol || 8) / 100 * Math.sqrt(t), factor: 'fx' }); }
    else if (q.kind === 'viop') risky.push({ q, symbol: q.under || q.code, ccy: 'TRY', viop: true, mult: Math.pow(q.uMultAnn, t), sig: q.uSig * Math.sqrt(t), factor: q.underKind === 'usd' ? 'fx' : 'mkt' });
    else if (q.x) { const ex = dlLineExpect(q.x, q.valueTRY, t); risky.push({ q, symbol: q.symbol, ccy: q.ccy, mult: ex ? ex.mult : 1, sig: ex ? ex.sig : 0.3 * Math.sqrt(t), roiNet: ex ? ex.roiNet : null, factor: 'mkt' }); }
    else det.push(() => q.valueTRY);
  }
  const syms = [...new Set(risky.filter(r => !r.viop).map(r => r.symbol).concat(risky.some(r => r.ccy === 'USD') ? ['USD/TRY'] : []))];
  try { await f4Series(syms); } catch (e) { }
  const closesOf = s => f4LongCloses(s) || (state.map[s] && state.map[s].closes) || (state.inst[s] && state.inst[s].closes) || null;
  const hasViop = risky.some(r => r.viop), usable = risky.filter(r => { if (r.viop) return false; const c = closesOf(r.symbol); return c && c.length > 60; }), fixed = risky.filter(r => !r.viop && !usable.includes(r));
  const fixedV = fixed.reduce((a, r) => a + r.q.valueTRY, 0), riskyV = risky.filter(r => !r.viop).reduce((a, r) => a + r.q.valueTRY, 0), useMC = hasViop || (riskyV > 0 && fixedV / riskyV > 0.1);
  const total0 = pos.reduce((a, q) => a + q.valueTRY, 0), benchPct = E.benchNet(S, days, undefined, m), benchTotal = total0 * (1 + benchPct / 100);
  let res;
  if (!useMC) {
    for (const r of fixed) { sk.push(r.symbol); det.push(() => r.q.valueTRY * r.mult); }
    const R0 = usable.reduce((a, r) => a + r.q.valueTRY, 0), detAt = dd => det.reduce((a, f) => a + f(dd), 0); let fan = null;
    if (R0 > 0) { const tm = usable.reduce((a, r) => a + r.q.valueTRY * r.mult, 0) / R0, benchR = ((benchTotal - detAt(days)) / R0 - 1) * 100;
      fan = E.bootstrapFan(usable.map(r => ({ symbol: r.symbol, ccy: r.ccy, closes: closesOf(r.symbol) })), usable.map(r => r.q.valueTRY / R0), days, { blocks: 20, n: 2000, seed: 20261113, fx: closesOf('USD/TRY') || [], amount: R0, bench: benchR, targetMult: tm, steps: 24 }); }
    if (fan) { const paths = {}; for (const k of Object.keys(fan.paths)) paths[k] = fan.paths[k].map((v, s) => v + detAt(fan.stepDays[s])); res = { method: 'bootstrap', paths, stepDays: fan.stepDays, p05: paths.p05[24], p25: paths.p25[24], p50: paths.p50[24], p75: paths.p75[24], p95: paths.p95[24], mean: fan.mean + detAt(days), pBeat: fan.pBeat, nObs: fan.nObs }; }
    else if (!(R0 > 0)) { const v = detAt(days), paths = {}, stepDays = Array.from({ length: 25 }, (_, s) => Math.round(days * s / 24)); for (const k of ['p05', 'p25', 'p50', 'p75', 'p95']) paths[k] = stepDays.map(d => detAt(d)); res = { method: 'deterministic', paths, stepDays, p05: v, p25: v, p50: v, p75: v, p95: v, mean: v, pBeat: v > benchTotal ? 1 : 0 }; }
  }
  if (!res) { // Monte Carlo: every risky holding with its expected drift and volatility; futures as signed exposure to their underlying
    const items = [], detMC = det.slice();
    for (const r of risky) { const ann = (sig, mult) => ({ mu: Math.log(Math.max(1e-6, mult)) / Math.max(t, 1e-6), sig: sig / Math.sqrt(Math.max(t, 1e-6)) });
      if (r.viop) { const q = r.q, sign = q.side === 'short' ? -1 : 1, expo = sign * q.notionalNow; items.push({ expo, ...ann(r.sig, r.mult), factor: r.factor }); detMC.push(() => q.valueTRY - expo); }
      else items.push({ expo: r.q.valueTRY, ...ann(r.sig, r.mult), factor: r.factor }); }
    const detAt = dd => detMC.reduce((a, f) => a + f(dd), 0);
    res = { ...dlMonteCarlo(items, detAt, days, { bench: benchTotal }), viop: hasViop };
  }
  Object.assign(res, { days, total0, bench: benchTotal, benchPct, skipped: sk, end: DX.addDays(today(), days),
    lines: risky.filter(r => !r.viop).map(r => { const x = r.q.x, px = x && x.e ? x.e.price : null, fxm = r.ccy === 'USD' ? dlFxMult(t) : 1, k = r.mult / fxm, usd = r.q.kind === 'usd_cash' || r.q.kind === 'usd_dep';
      return { name: r.q.name, symbol: r.symbol, kind: r.q.kind, value0: r.q.valueTRY, valueExp: r.q.valueTRY * r.mult, price: usd ? dlFx(today()) : px, priceExp: usd ? dlFx(today()) * dlFxMult(t) : px ? px * k : null, lo: px ? px * k * Math.exp(-1.645 * r.sig) : null, hi: px ? px * k * Math.exp(1.645 * r.sig) : null, ccy: usd ? 'TRY' : r.ccy, sig: r.sig }; })
      .concat(risky.filter(r => r.viop).map(r => { const q = r.q, sign = q.side === 'short' ? -1 : 1, fE = q.last * r.mult; return { name: `${q.code} (${q.side === 'short' ? DL('short', 'kısa') : DL('long', 'uzun')} ${q.qty})`, kind: 'viop', value0: q.valueTRY, valueExp: q.valueTRY + sign * q.notionalNow * (r.mult - 1), price: q.last, priceExp: fE, lo: fE * Math.exp(-1.645 * r.sig), hi: fE * Math.exp(1.645 * r.sig), ccy: 'TRY' }; })) });
  return res;
}
// more profitable alternatives for each open line, with the risk shown next to the return
function dlSuggestions(p, days) {
  const t = days / 365, out = [], inFund = new Set((p.lines || []).map(l => l.symbol)), group = x => x.cls === 'US_EQ' ? 'US' : x.cls === 'TEFAS' ? 'TEFAS' : dlKindOf(x) === 'gold' ? 'GOLD' : 'TR';
  const pool = (state.scored || []).filter(x => x && x.e && x.e.price && x.score != null && (!x.gate || x.gate.ok) && !inFund.has(x.symbol) && x.cls !== 'MACRO');
  for (const q of dlPositions(p).filter(q => q.x && q.kind !== 'gold')) {
    const own = dlLineExpect(q.x, q.valueTRY, t); if (!own) continue; const g = group(q.x);
    const cands = pool.filter(x => group(x) === g).sort((a, b) => b.score - a.score).slice(0, 60).map(x => { const ex = dlLineExpect(x, q.valueTRY, t); return ex ? { x, roi: ex.roiNet, vol: x.e.volUsed } : null; }).filter(c => c && c.roi > own.roiNet + 2).sort((a, b) => b.roi - a.roi).slice(0, 3);
    out.push({ q, own: own.roiNet, ownVol: q.x.e.volUsed, cands });
  }
  return out;
}
function dlSimHTML(p) {
  const opts = [['span', DL('until the end of the hold period', 'tutma süresinin sonuna kadar')], ['91', DL('3 months', '3 ay')], ['182', DL('6 months', '6 ay')], ['365', DL('1 year', '1 yıl')], ['730', DL('2 years', '2 yıl')]];
  return `<div class="panel wide" id="dlx-sim"><h2>${DL('Simulation: where the fund may end', 'Simülasyon: fon nerede bitebilir')} <span class="sub">${DL('2,000 possible futures from the holdings’ own history', 'varlıkların kendi geçmişinden 2.000 olası gelecek')}</span></h2><div class="body">
    <div class="row-inline" style="gap:8px;flex-wrap:wrap"><label for="dlx-hz" class="hint">${DL('Horizon', 'Ufuk')}</label><select id="dlx-hz">${opts.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select><button class="primary" id="dlx-run">${DL('Run simulation', 'Simülasyonu çalıştır')}</button><span class="hint" id="dlx-sim-msg"></span></div>
    <div id="dlx-sim-out"></div></div></div>`;
}
function dlSimOutHTML(p, r, sug) {
  const bl = dlBench(), rows = [[DL('Bad case (1 in 20 ends lower)', 'Kötü durum (20’de 1 daha kötü biter)'), r.p05, 'down'], [DL('Below middle (1 in 4 lower)', 'Ortanın altı (4’te 1 daha kötü)'), r.p25, ''], [DL('Middle case (median)', 'Orta durum (ortanca)'), r.p50, ''], [DL('Above middle (1 in 4 higher)', 'Ortanın üstü (4’te 1 daha iyi)'), r.p75, ''], [DL('Good case (1 in 20 ends higher)', 'İyi durum (20’de 1 daha iyi biter)'), r.p95, 'up']];
  const pct = v => r.total0 ? (v / r.total0 - 1) * 100 : null;
  const lines = r.lines.length ? `<h4 class="hint" style="margin:14px 0 4px">${DL('Expected prices on', 'Tahmini fiyatlar,')} ${esc(dlDate(r.end))}</h4><table><tr><th class="l">${DL('Holding', 'Varlık')}</th><th>${DL('Price now', 'Bugünkü fiyat')}</th><th>${DL('Expected price', 'Beklenen fiyat')}</th><th>${DL('Likely range (90%)', 'Olası aralık (%90)')}</th><th>${DL('Value now', 'Bugünkü değer')}</th><th>${DL('Expected value', 'Beklenen değer')}</th></tr>${r.lines.map(l => `<tr><td class="l acc">${esc(l.name)}</td><td>${l.price ? dlN(l.price) + ' ' + esc(l.ccy) : '—'}</td><td>${l.priceExp ? dlN(l.priceExp) : '—'}</td><td>${l.lo ? dlN(l.lo) + ' – ' + dlN(l.hi) : '—'}</td><td>${T(l.value0)}</td><td>${T(l.valueExp)}</td></tr>`).join('')}</table>` : '';
  const sg = sug.length ? `<h4 class="hint" style="margin:14px 0 4px">${DL('More profitable alternatives (model estimate, same market)', 'Daha kârlı alternatifler (model tahmini, aynı piyasa)')}</h4><table><tr><th class="l">${DL('Holding', 'Varlık')}</th><th>${DL('Its expected net return', 'Beklenen net getirisi')}</th><th>${DL('Its volatility', 'Oynaklığı')}</th><th class="l">${DL('Alternatives: expected net return · volatility', 'Alternatifler: beklenen net getiri · oynaklık')}</th></tr>${sug.map(s => `<tr><td class="l acc">${esc(s.q.symbol)}</td><td>${P(s.own)}</td><td>${dlN(s.ownVol, 0)}%</td><td class="l txt">${s.cands.length ? s.cands.map(c => `<span class="acc" data-sym="${esc(c.x.symbol)}" style="cursor:pointer">${esc(c.x.symbol)}</span> ${P(c.roi)} · ${dlN(c.vol, 0)}%${c.vol > s.ownVol + 5 ? ` <span class="pill warn">${DL('riskier', 'daha riskli')}</span>` : c.vol < s.ownVol - 5 ? ` <span class="pill ok">${DL('less risky', 'daha az riskli')}</span>` : ''}${c.x.gate && c.x.gate.lowLiq ? ` <span class="pill warn">${DL('low liq.', 'düşük lik.')}</span>` : ''}`).join('<br>') : `<span class="dim">${DL('nothing clearly better in the eligible universe', 'uygun evrende açıkça daha iyisi yok')}</span>`}</td></tr>`).join('')}</table><p class="note">${DL('Expected net return over the same horizon after costs and tax. A higher return almost always comes with more volatility (bigger swings) — compare both. To swap a line, use “Edit” or the “Beat the deposit” panel.', 'Aynı ufukta maliyet ve vergi sonrası beklenen net getiri. Daha yüksek getiri neredeyse her zaman daha yüksek oynaklıkla (daha büyük dalgalanma) gelir — ikisini birlikte karşılaştırın. Bir satırı değiştirmek için “Düzenle”yi veya “Mevduatı geç” panelini kullanın.')}</p>` : '';
  return `<div id="dlx-fan" style="margin-top:10px"></div>
    <p style="margin:8px 0"><b>${DL(`In the middle case the fund is worth ${T(r.p50)} on ${esc(dlDate(r.end))}`, `Orta durumda fonun ${esc(dlDate(r.end))} tarihindeki değeri ${T(r.p50)}`)}</b> (${fmtPct(pct(r.p50))}). ${DL(`Chance of ending above the ${esc(bl)} over the same time (${T(r.bench)})`, `Aynı sürede ${esc(bl)} (${T(r.bench)}) üzerinde bitme olasılığı`)}: <b>${r.pBeat === null || r.pBeat === undefined ? '—' : Math.round(r.pBeat * 100) + '%'}</b>.</p>
    <table><tr><th class="l">${DL('Outcome', 'Sonuç')}</th><th>${DL('Fund value', 'Fon değeri')}</th><th>${DL('Change from today', 'Bugüne göre değişim')}</th></tr>${rows.map(([l, v, c]) => `<tr><td class="l txt ${c}">${l}</td><td>${T(v)}</td><td>${P(pct(v))}</td></tr>`).join('')}<tr><td class="l txt dim">${esc(bl)}, ${DL('same time', 'aynı süre')}</td><td>${T(r.bench)}</td><td>${P(r.benchPct)}</td></tr></table>
    ${lines}${sg}
    <p class="note">${r.method === 'bootstrap' ? DL(`Method: block bootstrap of ${r.nObs} trading days of the holdings’ own daily returns, re-centred on the model’s expected return (so history gives the shape of the swings, the model gives the direction). `, `Yöntem: varlıkların kendi ${r.nObs} işlem gününe ait günlük getirilerinin blok bootstrap’i, modelin beklenen getirisine göre ortalanmış (salınımların şeklini geçmiş, yönünü model belirler). `) : r.method === 'deterministic' ? DL('Method: only cash and deposits — their interest is known. ', 'Yöntem: yalnızca nakit ve mevduat — faizleri bellidir. ') : DL(`Method: Monte Carlo with 2,000 paths — each holding with its expected return and volatility, shares and gold moving partly together (correlation 0.4), USD/TRY on its own${r.viop ? '; futures as leveraged exposure to their underlying (long or short)' : ''}. Used ${r.viop ? 'because the fund holds futures' : 'because some holdings have less than three months of price history'}. `, `Yöntem: 2.000 senaryolu Monte Carlo — her varlık kendi beklenen getirisi ve oynaklığıyla; hisseler ve altın kısmen birlikte hareket eder (korelasyon 0,4), USD/TRY bağımsız${r.viop ? '; vadeli sözleşmeler dayanak varlığa kaldıraçlı (uzun veya kısa) pozisyon olarak' : ''}. ${r.viop ? 'Fonda vadeli sözleşme olduğu için' : 'Bazı varlıkların üç aydan kısa fiyat geçmişi olduğu için'} kullanıldı. `)}${DL('Deposits grow with their own interest until maturity, then stay as cash; USD follows the expected USD/TRY path. ', 'Mevduatlar vadeye kadar kendi faiziyle büyür, sonra nakit olarak kalır; USD beklenen USD/TRY yolunu izler. ')}${r.skipped.length ? DL(`Held at their expected value without swings (no price history): ${r.skipped.join(', ')}. `, `Fiyat geçmişi olmadığı için dalgalanmasız beklenen değerle alınanlar: ${r.skipped.join(', ')}. `) : ''}${DL('These are model estimates, not guarantees.', 'Bunlar model tahminidir, garanti değildir.')}</p>`;
}
document.addEventListener('click', async e => { const b = e.target.closest('#dlx-run'); if (!b) return; e.stopPropagation();
  const p = state.sheet && state.packages.find(q => q.id === state.sheet.id); if (!p) return; const days = dlHorizonDays(p, $('dlx-hz').value);
  b.disabled = true; $('dlx-sim-msg').textContent = DL('Loading prices and simulating…', 'Fiyatlar yükleniyor, simülasyon çalışıyor…');
  try { const r = await dlSimulate(p, days), sug = dlSuggestions(p, days); state.dlxSim = { id: p.id, r, sug, at: Date.now() }; $('dlx-sim-out').innerHTML = dlSimOutHTML(p, r, sug);
    f4FanSVG($('dlx-fan'), r, { days, bench: r.stepDays.map(d => r.total0 * (1 + E.benchNet(state.S, d, undefined, ctx().M) / 100)), benchLabel: dlBench(), endLabel: dlDate(r.end), height: 200 }); $('dlx-sim-msg').textContent = ''; }
  catch (err) { console.error(err); $('dlx-sim-msg').textContent = DL('Simulation failed: ', 'Simülasyon başarısız: ') + err.message; }
  b.disabled = false; }, true);
document.addEventListener('click', e => { const s = e.target.closest('#dlx-sim [data-sym]'); if (!s) return; e.stopPropagation(); openSheet({ type: 'sym', symbol: s.dataset.sym }); }, true);

function dlStressHTML(p) {
  const pos = dlPositions(p); if (!pos.length) return '';
  const res = DX.SCENARIOS.map(s => DX.stress(pos, s)), lab = { try20: DL('TRY loses 20% against USD', 'TL, USD karşısında %20 değer kaybederse'), bist15: DL('BIST falls 15%', 'BIST %15 düşerse'), rate5: DL('TRY interest rates rise 5 points', 'TL faizleri 5 puan artarsa') };
  return `<div class="panel wide" id="dlx-stress"><h2>${DL('Stress test', 'Stres testi')} <span class="sub">${DL('the fund today under three sharp shocks', 'bugünkü fon, üç sert şok altında')}</span></h2><div class="body"><table><tr><th class="l">${DL('Scenario', 'Senaryo')}</th><th>${DL('Value now', 'Bugünkü değer')}</th><th>${DL('Value after the shock', 'Şok sonrası değer')}</th><th>${DL('Change', 'Değişim')}</th><th class="l">${DL('Biggest effects', 'En büyük etkiler')}</th></tr>${res.map(r => `<tr><td class="l txt">${esc(lab[r.key] || r.label)}</td><td>${T(r.before)}</td><td>${T(r.after)}</td><td>${P(r.pct)}<div class="dim" style="font-size:11px">${T(r.delta)}</div></td><td class="l txt" style="font-size:12px">${r.rows.filter(q => Math.abs(q.change) >= 1).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3).map(q => `${esc(q.name)} ${q.change > 0 ? '+' : ''}${Math.round(q.change).toLocaleString('en-US')}`).join(' · ') || '—'}</td></tr>`).join('')}</table>
    <p class="note">${DL('Assumptions: a 20% TRY loss means USD/TRY +25%: USD cash, USD deposits and US shares +25% in TRY, gold +24%, BIST shares +12.5% (they partly follow the dollar). BIST −15% moves each BIST share by −15% × its beta. A 5-point rate rise lowers BIST shares by 5% × beta; fixed-rate deposits are unchanged until maturity, demand deposits and money-market funds earn a little more. Instant shocks, no rebalancing.', 'Varsayımlar: TL’nin %20 değer kaybı USD/TRY +%25 demektir: USD nakit, USD mevduat ve ABD hisseleri TL bazında +%25, altın +%24, BIST hisseleri +%12,5 (kısmen dolarla hareket eder). BIST −%15: her BIST hissesi −%15 × betası kadar değişir. Faizlerde 5 puan artış BIST hisselerini %5 × beta düşürür; sabit faizli mevduat vadeye kadar değişmez, vadesiz mevduat ve para piyasası fonları biraz daha fazla kazanır. Anlık şoklar; yeniden dengeleme yok.')}</p></div></div>`;
}
{ const _rs = renderSheet; renderSheet = function () { _rs(); const w = state.sheet; if (!w || w.type !== 'pkg') return; const p = state.packages.find(q => q.id === w.id); if (!p || p.status === 'closed') return; const anchor = $('dlx-hist'); if (!anchor || $('dlx-sim')) return;
    anchor.insertAdjacentHTML('afterend', dlSimHTML(p) + dlStressHTML(p));
    const c = state.dlxSim; if (c && c.id === p.id && Date.now() - c.at < 10 * 60000) { $('dlx-sim-out').innerHTML = dlSimOutHTML(p, c.r, c.sug); try { f4FanSVG($('dlx-fan'), c.r, { days: c.r.days, bench: c.r.stepDays.map(d => c.r.total0 * (1 + E.benchNet(state.S, d, undefined, ctx().M) / 100)), benchLabel: dlBench(), endLabel: dlDate(c.r.end), height: 200 }); } catch (e) { } } }; }

/* benchmarks: the existing "same money elsewhere" table gains gram gold and plain USD cash */
{ const alt = E.alternatives; E.alternatives = function (flows, to, c) { const r = alt(flows, to, c); try {
      const fx = (c && c.fx) || dlFx, g = state.inst.GAUTRY || state.map.GAUTRY, gc = g && Array.isArray(g.closes) && g.closes.length ? g.closes : null, inv = r.invested;
      let usd = 0; for (const f of flows) usd += (+f.amount || 0) / fx(f.date) * fx(to); r.rows.push({ name: DL('USD cash (no interest)', 'USD nakit (faizsiz)'), value: usd, gain: usd - inv, pct: inv ? (usd / inv - 1) * 100 : null, usd: usd / fx(to) });
      if (gc) { let v = 0, ok = true; const g1 = DX.priceOn(gc, to) || g.price; for (const f of flows) { const g0 = DX.priceOn(gc, f.date); if (!(g0 > 0)) { ok = false; break; } v += (+f.amount || 0) * g1 / g0; } if (ok && g1 > 0) r.rows.push({ name: DL('Gram gold', 'Gram altın'), value: v, gain: v - inv, pct: inv ? (v / inv - 1) * 100 : null, usd: v / fx(to) }); }
    } catch (e) { console.error(e); } return r; }; }


/* ================= Phase 3: VİOP ================= */
state.hooks.unshift(() => { if (!state.dbOk || state.__dlxSub) return; state.__dlxSub = true;
  state.db.doc('viop/contracts').onSnapshot(s => { state.dlxViop = s.exists ? s.data() : null; if (state.view === 'VIOP') renderAll(); }, () => { });
  state.db.doc('viop/settles').onSnapshot(s => { state.dlxSettles = s.exists ? s.data() : null; }, () => { }); });
const dlVolFromCloses = c => { if (!c || c.length < 15) return null; const a = c.slice(-121), r = []; for (let i = 1; i < a.length; i++) if (a[i - 1][1] > 0 && a[i][1] > 0) r.push(Math.log(a[i][1] / a[i - 1][1])); if (r.length < 10) return null; const m = r.reduce((x, y) => x + y, 0) / r.length; return Math.sqrt(r.reduce((x, y) => x + (y - m) ** 2, 0) / (r.length - 1) * 252) * 100; };
// the underlying of a contract: kind, expected growth a year (model), volatility a year %, beta, spot price
function dlViopUnder(under, code) {
  const S = state.S, x = state.map[under] || state.inst[under], hist = dlVolFromCloses(state.dlxSettles && state.dlxSettles[code]);
  if (under === 'USD/TRY' || /\/TRY$/.test(under || '')) return { kind: 'usd', multAnn: 1 + (f4Fx() || 0) / 100, vol: hist || +S.fxVol || 8, beta: 0, spot: under === 'USD/TRY' ? dlFx(today()) : null };
  if (under === 'GAUTRY' || under === 'XAUUSD') { const g = state.map.GAUTRY, ex = g && g.e ? dlLineExpect(g, 1e5, 1) : null; return { kind: 'gold', multAnn: ex ? ex.mult : 1 + (f4Fx() || 0) / 100, vol: (g && g.e && g.e.volUsed) || hist || 18, beta: 0, spot: under === 'GAUTRY' && g && g.e ? g.e.price : null }; }
  if (x && x.e && x.cls !== 'MACRO') { const ex = dlLineExpect(x, 1e5, 1); return { kind: 'stock', multAnn: ex ? ex.mult : 1 + (+S.depRate || 0) / 100, vol: x.e.volUsed || hist || 35, beta: x.e.beta ?? 1, spot: x.e.price }; }
  const xu = state.inst.XU100; return { kind: 'index', multAnn: 1 + (+S.depRate || 0) / 100, vol: hist || dlVolFromCloses(xu && xu.closes) || 28, beta: 1, spot: null };
}
// margin: Borsa İstanbul sets the initial margin as one price scan range (PSR) a contract; Takasbank's file is not reachable
// automatically, so it is estimated (≈ 3.5 daily standard deviations over two days, 6–30% of the contract value) unless entered by hand
function dlMargin(c, vol) { const o = (state.S.viopMargin || {})[c.code]; if (o > 0) return { im: +o, manual: true }; const sd = (vol || 30) / 100 / Math.sqrt(252), psr = Math.min(0.30, Math.max(0.06, 3.5 * sd * Math.SQRT2)); return { im: Math.round((c.settle || 0) * (c.mult || 1) * psr * 100) / 100, manual: false, psr }; }
const dlMaint = () => (+state.S.viopMaint || 75) / 100;
function dlContractRisk(c) { const u = dlViopUnder(c.under, c.code), mg = dlMargin(c, u.vol), rk = DX.viopRisk({ underPrice: u.spot || c.settle, futPrice: c.settle, multiplier: c.mult, initialMargin: mg.im, maintMargin: mg.im * dlMaint(), expiry: c.expiry, rateTRY: +state.S.depRate || 0 }, u.vol, today());
  const t = rk.years, drift = Math.pow(u.multAnn, t), q = k => c.settle * drift * Math.exp(-0.5 * (u.vol / 100) ** 2 * t + k * (u.vol / 100) * Math.sqrt(t));
  return { u, mg, rk, exp: { p05: q(-1.645), p50: q(0), p95: q(1.645) } }; }
const VIOP_KIND = { stock: ['Single-stock', 'Pay'], index: ['Index', 'Endeks'], fx: ['Currency', 'Döviz'], metal: ['Precious metals', 'Kıymetli maden'], energy: ['Energy', 'Enerji'], rate: ['Interest rate', 'Faiz'], other: ['Other', 'Diğer'] };
{ const mk = GROUPS_NAV.MARKETS; if (!mk.some(([k]) => k === 'VIOP')) mk.splice(1, 0, ['VIOP', 'VİOP']); try { VIEW_CMD.VIOP = 'VIOP'; } catch (e) { }
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="view" id="view-VIOP" hidden><div class="grid"><div class="panel wide"><h2>VİOP <span class="sub" id="vp-sub"></span></h2><div class="body">
    <div class="row-inline" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="vp-kind"></select><input id="vp-q" type="search" placeholder="" style="width:160px"><button id="vp-refresh"></button><span class="hint" id="vp-msg"></span></div>
    <div style="overflow-x:auto"><table id="vp-table"></table></div><p class="note" id="vp-note"></p></div></div></div></section>`); }
function renderViop() {
  if (state.view !== 'VIOP') return; const c = state.dlxViop, items = (c && c.items) || [], kindSel = $('vp-kind');
  if (!kindSel.options.length || kindSel.dataset.lang !== (state.S.lang || 'en')) { const cur = kindSel.value || 'stock'; kindSel.innerHTML = Object.entries(VIOP_KIND).map(([k, l]) => `<option value="${k}">${DL(l[0], l[1])}</option>`).join('') + `<option value="all">${DL('All', 'Tümü')}</option>`; kindSel.value = cur; kindSel.dataset.lang = state.S.lang || 'en';
    kindSel.onchange = () => renderViop(); $('vp-q').oninput = () => renderViop(); $('vp-q').placeholder = DL('Search (e.g. THYAO)', 'Ara (örn. THYAO)'); $('vp-refresh').textContent = DL('Update now', 'Şimdi güncelle');
    $('vp-refresh').onclick = async () => { $('vp-msg').textContent = DL('Downloading from Borsa İstanbul…', 'Borsa İstanbul’dan indiriliyor…'); try { const r = await fetch('/api/viop/refresh', { method: 'POST' }); const j = await r.json(); $('vp-msg').textContent = j.ok ? `${j.n} ${DL('contracts', 'sözleşme')} · ${DL('bulletin', 'bülten')} ${j.bulletin}` : DL('Failed: ', 'Başarısız: ') + j.error; } catch (e) { $('vp-msg').textContent = e.message; } }; }
  $('vp-q').placeholder = DL('Search (e.g. THYAO)', 'Ara (örn. THYAO)'); $('vp-refresh').textContent = DL('Update now', 'Şimdi güncelle');
  $('vp-sub').textContent = c ? `${DL('futures', 'vadeli sözleşmeler')} · ${DL('settlement prices of', 'uzlaşma fiyatları:')} ${dlDate(c.asOf)} · ${DL('contract list', 'sözleşme listesi')} ${dlDate(c.masterDate)}` : DL('no data yet — press “Update now”', 'henüz veri yok — “Şimdi güncelle”ye basın');
  const kind = kindSel.value || 'stock', q = ($('vp-q').value || '').trim().toUpperCase();
  const rows = items.filter(i => (kind === 'all' || i.kind === kind) && (!q || i.code.includes(q) || (i.under || '').toUpperCase().includes(q))).slice(0, 400);
  const sel = new Set(); for (const p of state.packages || []) if (dlHasSleeve(p)) for (const v of dlSleeve(p).viop) sel.add(v.code);
  $('vp-table').innerHTML = `<tr><th class="l">${DL('Contract', 'Sözleşme')}</th><th class="l">${DL('Underlying', 'Dayanak')}</th><th>${DL('Days to expiry', 'Vadeye gün')}</th><th>${DL('Settlement', 'Uzlaşma')}</th><th>${DL('Change', 'Değişim')}</th><th>${DL('Open interest', 'Açık pozisyon')}</th><th>${DL('Contract value', 'Sözleşme değeri')}</th><th title="${esc(DL('Initial margin per contract; estimated unless entered by hand', 'Sözleşme başına başlangıç teminatı; elle girilmedikçe tahminidir'))}">${DL('Initial margin', 'Başlangıç teminatı')}</th><th>${DL('Leverage', 'Kaldıraç')}</th><th title="${esc(DL('Loss a contract can make in one bad day (1 in 100)', 'Bir sözleşmenin kötü bir günde (100’de 1) edebileceği zarar'))}">${DL('1-day loss (99%)', '1 günlük kayıp (%99)')}</th><th title="${esc(DL('Chance that losses reach the maintenance level before expiry, long / short', 'Vadeye kadar zararın sürdürme seviyesine ulaşma olasılığı, uzun / kısa'))}">${DL('Margin call risk L / S', 'Teminat çağrısı riski U / K')}</th><th>${DL('Expected at expiry (5–95%)', 'Vade sonu beklenen (%5–95)')}</th><th></th></tr>` +
    (rows.length ? rows.map(i => { const r = dlContractRisk(i), d = DX.daysBetween(today(), i.expiry), up = r.u.spot;
      return `<tr class="row" data-vp="${esc(i.code)}"><td class="l acc">${esc(i.code)}${sel.has(i.code) ? ` <span class="pill ok">${DL('held', 'elde')}</span>` : ''}</td><td class="l">${esc(i.under)}${up ? `<div class="dim" style="font-size:11px">${dlN(up)}</div>` : ''}</td><td>${d}</td><td>${dlN(i.settle, i.settle < 100 ? 4 : 2)}</td><td>${P(i.chg)}</td><td>${i.oi ? Math.round(i.oi).toLocaleString('en-US') : '—'}</td><td>${N(r.rk.notional, 0)}</td><td>${N(r.mg.im, 0)}${r.mg.manual ? '' : ` <span class="dim" title="${esc(DL('estimate', 'tahmin'))}">~</span>`}</td><td>${r.rk.leverage ? dlN(r.rk.leverage, 1) + '×' : '—'}</td><td class="down">${N(r.rk.oneDay99, 0)}</td><td>${Math.round(r.rk.pCallLong * 100)}% / ${Math.round(r.rk.pCallShort * 100)}%</td><td>${dlN(r.exp.p50, i.settle < 100 ? 3 : 1)}<div class="dim" style="font-size:11px">${dlN(r.exp.p05, i.settle < 100 ? 3 : 0)} – ${dlN(r.exp.p95, i.settle < 100 ? 3 : 0)}</div></td><td><button class="quiet" data-vp-add="${esc(i.code)}">+ ${DL('Fund', 'Fon')}</button></td></tr>`; }).join('') : `<tr><td class="l" colspan="13"><div class="empty">${c ? DL('No contract matches.', 'Eşleşen sözleşme yok.') : DL('Press “Update now” to download the contracts.', 'Sözleşmeleri indirmek için “Şimdi güncelle”ye basın.')}</div></td></tr>`);
  $('vp-note').textContent = DL(`Source: Borsa İstanbul end-of-day files (settlement prices, open interest, contract sizes). Margins marked ~ are estimates (about 3.5 daily standard deviations over two days); Takasbank’s official figures cannot be downloaded automatically — open a contract and enter your broker’s margin. Maintenance level ${Math.round(dlMaint() * 100)}% of the initial margin (broker practice; Borsa İstanbul calls for more money when the account falls below the initial margin). Risk figures use each underlying’s volatility; expected prices are model estimates, not guarantees.`, `Kaynak: Borsa İstanbul gün sonu dosyaları (uzlaşma fiyatları, açık pozisyon, sözleşme büyüklükleri). ~ işaretli teminatlar tahminidir (iki günde yaklaşık 3,5 günlük standart sapma); Takasbank’ın resmî tutarları otomatik indirilemiyor — bir sözleşmeyi açıp aracı kurumunuzun teminatını girin. Sürdürme seviyesi başlangıç teminatının %${Math.round(dlMaint() * 100)}’i (aracı kurum uygulaması; Borsa İstanbul hesap başlangıç teminatının altına düşünce ek teminat ister). Risk rakamları her dayanağın oynaklığıyla hesaplanır; beklenen fiyatlar model tahminidir, garanti değildir.`);
}
state.hooks.push(() => { try { renderViop(); } catch (e) { console.error(e); } });
function dlViopDetail(code) {
  const c = ((state.dlxViop && state.dlxViop.items) || []).find(i => i.code === code); if (!c) return; const r = dlContractRisk(c), rk = r.rk, d = DX.daysBetween(today(), c.expiry), pl = v => (v - c.settle) * c.mult;
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="${esc(code)}" style="width:min(760px,100%)"><h3>${esc(code)} <span class="dim" style="font-weight:400;font-size:13px">${esc(c.name || '')} · ${DL(VIOP_KIND[c.kind][0], VIOP_KIND[c.kind][1])}</span></h3>
    <dl class="kv"><dt>${DL('Underlying', 'Dayanak')}</dt><dd>${esc(c.under)}${r.u.spot ? ' · ' + dlN(r.u.spot) : ''}</dd><dt>${DL('Expiry', 'Vade sonu')}</dt><dd>${dlDate(c.expiry)} (${d} ${DL('days', 'gün')})</dd><dt>${DL('Settlement price', 'Uzlaşma fiyatı')}</dt><dd>${dlN(c.settle, 4)} (${dlDate(c.settleDate || c.asOf)})</dd><dt>${DL('Contract size', 'Sözleşme büyüklüğü')}</dt><dd>${c.mult}</dd>
    <dt>${DL('Contract value (notional)', 'Sözleşme değeri')}</dt><dd>${N(rk.notional, 0)} TRY</dd><dt>${DL('Fair value from the spot price', 'Spot fiyattan teorik değer')}</dt><dd>${r.u.spot ? dlN(rk.fair) + ` (${DL('basis', 'baz farkı')} ${fmtPct(rk.basisPct, 2)})` : '—'}</dd><dt>${DL('Volatility of the underlying', 'Dayanağın oynaklığı')}</dt><dd>${dlN(r.u.vol, 0)}% ${DL('a year', 'yıllık')}</dd>
    <dt>${DL('Daily price limits', 'Günlük fiyat limitleri')}</dt><dd>${c.lower ? dlN(c.lower) + ' – ' + dlN(c.upper) : '—'}</dd></dl>
    <h4 class="hint" style="margin:12px 0 4px">${DL('Margin', 'Teminat')}</h4><div class="form"><label for="vd-im">${DL('Initial margin a contract (TRY)', 'Sözleşme başına başlangıç teminatı (TL)')}</label><span class="row-inline" style="gap:6px"><input id="vd-im" type="number" step="any" value="${r.mg.im}" style="width:130px"><span class="hint">${r.mg.manual ? DL('entered by hand', 'elle girildi') : DL('estimate — enter your broker’s figure', 'tahmin — aracı kurumunuzun tutarını girin')}</span></span><label for="vd-mm">${DL('Maintenance level, % of initial', 'Sürdürme seviyesi, başlangıcın %’si')}</label><input id="vd-mm" type="number" step="1" value="${Math.round(dlMaint() * 100)}" style="width:90px"></div>
    <table style="margin-top:10px"><tr><th class="l">${DL('Risk for one contract', 'Bir sözleşmenin riski')}</th><th>${DL('Long (buy)', 'Uzun (alış)')}</th><th>${DL('Short (sell)', 'Kısa (satış)')}</th></tr>
      <tr><td class="l txt">${DL('Leverage', 'Kaldıraç')}</td><td colspan="2">${rk.leverage ? dlN(rk.leverage, 1) + '×' : '—'}</td></tr><tr><td class="l txt">${DL('Loss on a bad day (1 in 100)', 'Kötü bir günde zarar (100’de 1)')}</td><td colspan="2" class="down">${N(rk.oneDay99, 0)} TRY (${dlN(rk.oneDayPctOfMargin, 0)}% ${DL('of the margin', 'teminatın')})</td></tr>
      <tr><td class="l txt">${DL('Chance of a margin call before expiry', 'Vadeden önce teminat çağrısı olasılığı')}</td><td>${Math.round(rk.pCallLong * 100)}%</td><td>${Math.round(rk.pCallShort * 100)}%</td></tr>
      <tr><td class="l txt">${DL('Profit / loss at expiry, bad case (5%)', 'Vade sonunda kâr / zarar, kötü durum (%5)')}</td><td>${N(pl(r.exp.p05), 0)}</td><td>${N(-pl(r.exp.p95), 0)}</td></tr><tr><td class="l txt">${DL('Profit / loss at expiry, middle', 'Vade sonunda kâr / zarar, orta')}</td><td>${N(pl(r.exp.p50), 0)}</td><td>${N(-pl(r.exp.p50), 0)}</td></tr><tr><td class="l txt">${DL('Profit / loss at expiry, good case (95%)', 'Vade sonunda kâr / zarar, iyi durum (%95)')}</td><td>${N(pl(r.exp.p95), 0)}</td><td>${N(-pl(r.exp.p05), 0)}</td></tr></table>
    <p class="note">${DL('A futures contract is settled every day: the day’s profit or loss is added to or taken from the margin account. If the account falls below the maintenance level the broker asks for more money (margin call) or closes the position. Losses can exceed the margin.', 'Vadeli sözleşme her gün uzlaştırılır: günün kârı veya zararı teminat hesabına eklenir veya hesaptan düşülür. Hesap sürdürme seviyesinin altına düşerse aracı kurum ek teminat ister (teminat çağrısı) veya pozisyonu kapatır. Zarar teminatı aşabilir.')}</p>
    <div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:12px"><button id="vd-close">${DL('Close', 'Kapat')}</button><button id="vd-save">${DL('Save margin', 'Teminatı kaydet')}</button><button class="primary" data-vp-add="${esc(code)}">${DL('Add to a fund', 'Fona ekle')}</button></div></div>`;
  $('vd-close').onclick = closeModal;
  $('vd-save').onclick = () => { const im = +$('vd-im').value, mm = +$('vd-mm').value; state.S.viopMargin = { ...(state.S.viopMargin || {}) }; if (im > 0 && Math.abs(im - r.mg.im) > 0.001) state.S.viopMargin[code] = im; if (mm > 0 && mm <= 100) state.S.viopMaint = mm; saveSettings(); closeModal(); renderAll(); toast(DL('Margin saved', 'Teminat kaydedildi')); };
}
function dlViopAddDialog(code, pkgId) {
  const c = ((state.dlxViop && state.dlxViop.items) || []).find(i => i.code === code); if (!c) return; const open = (state.packages || []).filter(p => p.status !== 'closed'); const r = dlContractRisk(c), d0 = today();
  if (!open.length) { toast(DL('Create a fund first (Packages › New fund).', 'Önce bir fon oluşturun (Fonlar › Yeni fon).')); return; }
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="Add futures" style="width:min(640px,100%)"><h3>${DL('Add futures to a fund', 'Fona vadeli sözleşme ekle')} · ${esc(code)}</h3><div class="form" style="margin-top:10px">
    <label for="va-fund">${DL('Fund', 'Fon')}</label><select id="va-fund">${open.map(p => `<option value="${esc(p.id)}" ${p.id === pkgId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
    <label for="va-side">${DL('Direction', 'Yön')}</label><select id="va-side"><option value="long">${DL('Long (buy) — gains when the price rises', 'Uzun (alış) — fiyat yükselince kazanır')}</option><option value="short">${DL('Short (sell) — gains when the price falls', 'Kısa (satış) — fiyat düşünce kazanır')}</option></select>
    <label for="va-qty">${DL('Contracts', 'Sözleşme adedi')}</label><input id="va-qty" type="number" step="1" min="1" value="1" style="width:100px"><label for="va-date">${DL('Date', 'Tarih')}</label><input id="va-date" type="date" value="${d0}" max="${d0}">
    <label for="va-px">${DL('Price', 'Fiyat')}</label><input id="va-px" type="number" step="any" value="${c.settle}" style="width:130px"><label for="va-im">${DL('Initial margin a contract (TRY)', 'Sözleşme başına başlangıç teminatı (TL)')}</label><input id="va-im" type="number" step="any" value="${r.mg.im}" style="width:130px">
    <label for="va-fee">${DL('Commission', 'Komisyon')}</label><input id="va-fee" type="number" step="any" value="0" style="width:100px"><label for="va-bsmv">BSMV</label><input id="va-bsmv" type="number" step="any" value="0" style="width:100px">
    <label for="va-fund-in">${DL('Margin money', 'Teminat parası')}</label><label class="hint" style="display:flex;gap:6px;align-items:center"><input id="va-fund-in" type="checkbox" checked> ${DL('add the missing amount to the fund as money in, same date', 'eksik tutarı aynı tarihle fona para girişi olarak ekle')}</label></div>
    <p class="hint" id="va-sum" style="margin:8px 0 0"></p><p class="down" id="va-err"></p><div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:12px"><button id="va-cancel">${DL('Cancel', 'Vazgeç')}</button><button class="primary" id="va-ok">${DL('Add position', 'Pozisyonu ekle')}</button></div></div>`;
  const sum = () => { const q = +$('va-qty').value || 0, im = +$('va-im').value || 0, px = +$('va-px').value || 0; $('va-sum').textContent = `${DL('Margin blocked', 'Bloke teminat')}: ${dlN(q * im)} TRY · ${DL('contract value', 'sözleşme değeri')}: ${dlN(q * px * c.mult)} TRY · ${DL('leverage', 'kaldıraç')} ${im ? dlN(px * c.mult / im, 1) : '—'}×`; };
  ['va-qty', 'va-im', 'va-px'].forEach(id => $(id).oninput = sum); sum(); $('va-cancel').onclick = closeModal;
  $('va-ok').onclick = () => { const p = state.packages.find(z => z.id === $('va-fund').value), date = $('va-date').value, qty = Math.round(+$('va-qty').value || 0), px = +$('va-px').value, im = +$('va-im').value, fee = +$('va-fee').value || 0, bsmv = +$('va-bsmv').value || 0, err = m => { $('va-err').textContent = m; };
    if (!p) return err('?'); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) return err(DL('Choose a date up to today.', 'Bugün veya öncesine ait bir tarih seçin.')); if (date > c.expiry) return err(DL('The date is after the expiry.', 'Tarih vade sonundan sonra.'));
    if (!(qty > 0) || !(px > 0) || !(im > 0)) return err(DL('Enter contracts, price and margin.', 'Adet, fiyat ve teminatı girin.'));
    const before = JSON.stringify(p.tx || []); p.tx = p.tx || [];
    const need = qty * im + fee + bsmv, have = DX.replay(p.tx, date, dlFx, dlSettleAt).cash.TRY;
    if (have < need - 0.005) { if (!$('va-fund-in').checked) return err(DL(`Not enough TRY cash in the fund on that date (${dlN(have)} TRY, ${dlN(need)} TRY needed).`, `O tarihte fonda yeterli TL nakit yok (${dlN(have)} TL var, ${dlN(need)} TL gerekli).`)); p.tx.push({ id: DX.newId('tx'), date, type: 'in', ccy: 'TRY', amount: DX.r2(need - Math.max(0, have)), note: DL('margin for ', 'teminat: ') + code }); }
    p.tx.push({ id: DX.newId('tx'), date, type: 'viop-open', posId: DX.newId('vp'), code, under: c.under, expiry: c.expiry, side: $('va-side').value, qty, price: px, mult: c.mult, margin: im, ccy: 'TRY', fee, bsmv });
    const chk = DX.replay(p.tx, today(), dlFx, dlSettleAt); if (chk.warn.length) { p.tx = JSON.parse(before); return err(chk.warn[0]); }
    dlNormalize(p); journal(`${p.name}: ${DX.txText(p.tx[p.tx.length - 1], k => k)} (${date}).`, { kind: 'order', pkg: p.id }); saveUser('packages'); closeModal(); renderAll();
    toast(DL('Futures position added', 'Vadeli pozisyon eklendi'), () => { p.tx = JSON.parse(before); dlNormalize(p); saveUser('packages'); renderAll(); }); };
}
function dlViopCloseDialog(p, posId) {
  const v = dlSleeve(p).viop.find(z => z.id === posId); if (!v) return; const d0 = today();
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="Close futures" style="width:min(560px,100%)"><h3>${DL('Close futures position', 'Vadeli pozisyonu kapat')} · ${esc(v.code)}</h3><p class="hint">${v.side === 'short' ? DL('Short', 'Kısa') : DL('Long', 'Uzun')} ${v.qty} @ ${dlN(v.price, 4)} · ${DL('margin', 'teminat')} ${dlN(v.margin * v.qty)} TRY</p>
    <div class="form"><label for="vc-date">${DL('Date', 'Tarih')}</label><input id="vc-date" type="date" value="${d0}" max="${d0}"><label for="vc-px">${DL('Price', 'Fiyat')}</label><input id="vc-px" type="number" step="any" value="${v.last}"><label for="vc-fee">${DL('Commission', 'Komisyon')}</label><input id="vc-fee" type="number" step="any" value="0"><label for="vc-bsmv">BSMV</label><input id="vc-bsmv" type="number" step="any" value="0"></div>
    <p class="hint" id="vc-sum"></p><p class="down" id="vc-err"></p><div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:12px"><button id="vc-cancel">${DL('Cancel', 'Vazgeç')}</button><button class="primary" id="vc-ok">${DL('Close position', 'Pozisyonu kapat')}</button></div></div>`;
  const sum = () => { const px = +$('vc-px').value || 0, pnl = (v.side === 'short' ? -1 : 1) * (px - v.price) * v.mult * v.qty; $('vc-sum').innerHTML = `${DL('Profit / loss', 'Kâr / zarar')}: ${P(pnl / (v.margin * v.qty) * 100)} · ${N(pnl)} TRY`; }; $('vc-px').oninput = sum; sum(); $('vc-cancel').onclick = closeModal;
  $('vc-ok').onclick = () => { const date = $('vc-date').value, px = +$('vc-px').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today() || date < v.date) { $('vc-err').textContent = DL('Choose a date between the opening and today.', 'Açılış ile bugün arasında bir tarih seçin.'); return; } if (!(px > 0)) { $('vc-err').textContent = DL('Enter the price.', 'Fiyatı girin.'); return; }
    const before = JSON.stringify(p.tx); p.tx.push({ id: DX.newId('tx'), date, type: 'viop-close', posId, code: v.code, price: px, fee: +$('vc-fee').value || 0, bsmv: +$('vc-bsmv').value || 0 });
    dlNormalize(p); journal(`${p.name}: ${DX.txText(p.tx[p.tx.length - 1], k => k)} (${date}).`, { kind: 'order', pkg: p.id }); saveUser('packages'); closeModal(); renderAll(); reopenSheet(); toast(DL('Position closed', 'Pozisyon kapatıldı'), () => { p.tx = JSON.parse(before); dlNormalize(p); saveUser('packages'); renderAll(); reopenSheet(); }); };
}
function dlViopPanelHTML(p) {
  const sl = dlSleeve(p); if (!sl.viop.length && !sl.viopClosed.length) return ''; const mm = dlMaint();
  return `<div class="panel wide" id="dlx-viop"><h2>${DL('Futures (VİOP)', 'Vadeli işlemler (VİOP)')} <span class="sub">${DL('valued at the latest settlement price', 'son uzlaşma fiyatıyla değerlenir')}</span></h2><div class="body"><div style="overflow-x:auto"><table><tr><th class="l">${DL('Contract', 'Sözleşme')}</th><th class="l">${DL('Direction', 'Yön')}</th><th>${DL('Contracts', 'Adet')}</th><th>${DL('Entry', 'Giriş')}</th><th>${DL('Settlement', 'Uzlaşma')}</th><th>${DL('Profit / loss', 'Kâr / zarar')}</th><th>${DL('Margin', 'Teminat')}</th><th>${DL('Account value', 'Hesap değeri')}</th><th class="l">${DL('Status', 'Durum')}</th><th>${DL('Days to expiry', 'Vadeye gün')}</th><th></th></tr>
    ${sl.viop.map(v => { const lvl = v.margin * v.qty * mm, bad = v.equity < lvl, warnE = v.expiry && DX.daysBetween(today(), v.expiry) <= 5; return `<tr><td class="l acc">${esc(v.code)}</td><td class="l">${v.side === 'short' ? DL('short', 'kısa') : DL('long', 'uzun')}</td><td>${v.qty}</td><td>${dlN(v.price, 4)}</td><td>${dlN(v.last, 4)}</td><td>${N(v.pnl)}</td><td>${N(v.margin * v.qty)}</td><td>${N(v.equity)}</td><td class="l txt">${bad ? `<span class="down">${DL('below maintenance — margin call', 'sürdürme altında — teminat çağrısı')}</span>` : `<span class="up">${DL('OK', 'yeterli')}</span>`}${warnE ? ` <span class="pill warn">${DL('expiry soon', 'vade yakın')}</span>` : ''}</td><td>${v.expiry ? DX.daysBetween(today(), v.expiry) : '—'}</td><td>${p.status === 'closed' ? '' : `<button class="quiet" data-dlx-vclose="${esc(v.id)}">${DL('Close', 'Kapat')}</button>`}</td></tr>`; }).join('')}
    ${sl.viopClosed.map(v => `<tr class="dim"><td class="l">${esc(v.code)}</td><td class="l">${v.side === 'short' ? DL('short', 'kısa') : DL('long', 'uzun')}</td><td>${v.qty}</td><td>${dlN(v.price, 4)}</td><td>${dlN(v.closePrice, 4)}</td><td>${N(v.pnl)}</td><td colspan="3" class="l">${DL('closed', 'kapandı')} ${esc(v.closed)}</td><td></td><td></td></tr>`).join('')}</table></div>
    <p class="note">${DL(`Maintenance level ${Math.round(mm * 100)}% of the initial margin. Positions still open after expiry are closed automatically at the last settlement price.`, `Sürdürme seviyesi başlangıç teminatının %${Math.round(mm * 100)}’i. Vadesi geçen açık pozisyonlar son uzlaşma fiyatından otomatik kapatılır.`)}</p></div></div>`;
}
{ const _rs = renderSheet; renderSheet = function () { _rs(); const w = state.sheet; if (!w || w.type !== 'pkg') return; const p = state.packages.find(q => q.id === w.id); if (!p || !dlHasSleeve(p)) return; const anchor = $('dlx-sleeve'); if (!anchor || $('dlx-viop')) return; anchor.insertAdjacentHTML('afterend', dlViopPanelHTML(p)); }; }
document.addEventListener('click', e => { const a = e.target.closest('[data-vp-add]'), r = e.target.closest('#vp-table tr[data-vp]'), cl = e.target.closest('button[data-dlx-vclose]');
  if (a) { e.stopPropagation(); return dlViopAddDialog(a.dataset.vpAdd, state.sheet && state.sheet.type === 'pkg' ? state.sheet.id : null); }
  if (cl) { e.stopPropagation(); const p = state.sheet && state.packages.find(q => q.id === state.sheet.id); if (p) dlViopCloseDialog(p, cl.dataset.dlxVclose); return; }
  if (r) { e.stopPropagation(); dlViopDetail(r.dataset.vp); } }, true);
{ const la = liveAlerts; liveAlerts = function () { const out = la(); try { const mm = dlMaint(); for (const p of state.packages || []) { if (p.status === 'closed' || !dlHasSleeve(p)) continue; for (const v of dlSleeve(p).viop) {
      if (v.equity < v.margin * v.qty * mm) out.push({ level: 'bad', kind: 'margin', text: `${p.name.replace(/ \(.*\)$/, '')}: ${v.code} ${DL('account value', 'hesap değeri')} ${dlN(v.equity)} TRY ${DL('is below the maintenance level — expect a margin call', 'sürdürme seviyesinin altında — teminat çağrısı beklenir')}.` });
      if (v.expiry && DX.daysBetween(today(), v.expiry) <= 5) out.push({ level: 'warn', kind: 'expiry', text: `${p.name.replace(/ \(.*\)$/, '')}: ${v.code} ${DL('expires on', 'vadesi')} ${dlDate(v.expiry)}${DL('.', ' doluyor.')}` }); } } } catch (e) { } return out; }; }


/* ================= Phase 4: reports (whole fund, cash, futures, ledger, comparison, stress, simulation) and the glossary ================= */
function dlFundBlocks(p) {
  const tr = state.S.lang === 'tr', L = (en, t2) => tr ? t2 : en, n0 = v => fmtN(v, 0), n2 = v => fmtN(v, 2), out = [];
  const v = pkgValue(p), inv = +p.total || 0, sl = dlSleeve(p);
  out.push({ type: 'h', text: L('The whole fund', 'Fonun tamamı') }, { type: 'p', text: L('In plain words: everything the fund holds — shares, funds, gold, cash, deposits and futures — and the result on all the money put in.', 'Kısaca: fonun elindeki her şey — hisse, fon, altın, nakit, mevduat ve vadeli işlemler — ve yatırılan paranın tamamı üzerindeki sonuç.') },
    { type: 'boxes', items: [[L('Invested', 'Yatırılan'), n0(inv) + ' TRY'], [L('Value now', 'Bugünkü değer'), n0(v) + ' TRY'], [L('Gain / loss', 'Kazanç / zarar'), n0(v - inv) + ' TRY'], [L('Return', 'Getiri'), fmtPct(inv > 0 ? (v / inv - 1) * 100 : null)], [L('Cash and deposits', 'Nakit ve mevduat'), n0(sl.value) + ' TRY']] });
  const fx = dlFx(today()), cashRows = [];
  if (Math.abs(sl.cash.TRY) > 0.5) cashRows.push([L('TRY cash', 'TL nakit'), 'TRY', n2(sl.cash.TRY), '—', '—', n0(sl.cash.TRY)]);
  if (Math.abs(sl.cash.USD) > 0.005) cashRows.push([L('USD cash', 'USD nakit'), 'USD', n2(sl.cash.USD), '—', '—', n0(sl.cash.USD * fx)]);
  for (const d of sl.open) cashRows.push([d.maturity ? L('Time deposit', 'Vadeli mevduat') : L('Demand deposit', 'Vadesiz mevduat'), d.ccy, n2(d.principal + d.accrued.net), n2(d.rate) + '%', d.maturity || '—', n0((d.principal + d.accrued.net) * (d.ccy === 'USD' ? fx : 1))]);
  if (cashRows.length) out.push({ type: 'h', text: L('Cash, currency and deposits', 'Nakit, döviz ve mevduat') }, { type: 'p', text: L('In plain words: money held as cash or at the bank, with the interest earned so far after withholding tax.', 'Kısaca: nakit veya bankada tutulan para ve stopaj sonrası bugüne kadar işleyen faiz.') },
    { type: 'table', cols: [[L('Item', 'Kalem'), 'l', 1.6], [L('Currency', 'Para birimi'), 'l', 0.7], [L('Amount', 'Tutar'), 'r', 1.1], [L('Rate', 'Faiz'), 'r', 0.7], [L('Maturity', 'Vade'), 'l', 1], [L('Value TRY', 'Değer TL'), 'r', 1.1]], rows: cashRows });
  if (sl.viop.length) out.push({ type: 'h', text: L('Futures (VİOP)', 'Vadeli işlemler (VİOP)') }, { type: 'p', text: L('In plain words: futures contracts, valued at the latest settlement price. Profit or loss is settled every day against the margin.', 'Kısaca: son uzlaşma fiyatıyla değerlenen vadeli sözleşmeler. Kâr veya zarar her gün teminat üzerinden uzlaştırılır.') },
    { type: 'table', cols: [[L('Contract', 'Sözleşme'), 'l', 1.3], [L('Direction', 'Yön'), 'l', 0.7], [L('Contracts', 'Adet'), 'r', 0.6], [L('Entry', 'Giriş'), 'r', 0.9], [L('Settlement', 'Uzlaşma'), 'r', 0.9], [L('Profit / loss', 'Kâr / zarar'), 'r', 1], [L('Margin', 'Teminat'), 'r', 1], [L('Account value', 'Hesap değeri'), 'r', 1]], rows: sl.viop.map(x => [x.code, x.side === 'short' ? L('short', 'kısa') : L('long', 'uzun'), String(x.qty), n2(x.price), n2(x.last), n0(x.pnl), n0(x.margin * x.qty), n0(x.equity)]) });
  try { const flows = pkgFlows(p), alt = E.alternatives(flows, today(), { ...ctx(), fx: dlFx, inst: state.inst });
    out.push({ type: 'h', text: L('The same money elsewhere', 'Aynı para başka yerde') }, { type: 'p', text: L('In plain words: what every amount put into the fund would be worth today if it had gone into each alternative on the same day.', 'Kısaca: fona giren her tutar aynı gün her bir alternatife yatırılsaydı bugün ne ederdi.') },
      { type: 'table', cols: [[L('Alternative', 'Alternatif'), 'l', 2], [L('Value TRY', 'Değer TL'), 'r', 1], [L('Gain TRY', 'Kazanç TL'), 'r', 1], [L('Return', 'Getiri'), 'r', 0.8]], rows: [[L('This fund', 'Bu fon'), n0(v), n0(v - alt.invested), fmtPct(alt.invested ? (v / alt.invested - 1) * 100 : null)], ...alt.rows.map(r => [tr && TR[r.name] ? TR[r.name] : r.name, n0(r.value), n0(r.gain), fmtPct(r.pct)])] }); } catch (e) { }
  const pos = dlPositions(p); if (pos.length) { const lab = { try20: L('TRY loses 20% against USD', 'TL, USD karşısında %20 değer kaybederse'), bist15: L('BIST falls 15%', 'BIST %15 düşerse'), rate5: L('TRY interest rates rise 5 points', 'TL faizleri 5 puan artarsa') };
    out.push({ type: 'h', text: L('Stress test', 'Stres testi') }, { type: 'p', text: L('In plain words: what the fund would be worth today right after three sharp shocks. Assumptions: USD/TRY +25% in the first, BIST shares −15% × beta in the second, BIST −5% × beta and higher deposit rates in the third.', 'Kısaca: üç sert şokun hemen ardından fonun bugün ne edeceği. Varsayımlar: ilkinde USD/TRY +%25, ikincisinde BIST hisseleri −%15 × beta, üçüncüsünde BIST −%5 × beta ve daha yüksek mevduat faizi.') },
      { type: 'table', cols: [[L('Scenario', 'Senaryo'), 'l', 2.2], [L('Value now', 'Bugünkü değer'), 'r', 1], [L('After the shock', 'Şok sonrası'), 'r', 1], [L('Change', 'Değişim'), 'r', 0.8]], rows: DX.SCENARIOS.map(s => DX.stress(pos, s)).map(r => [lab[r.key], n0(r.before), n0(r.after), fmtPct(r.pct)]) }); }
  const sim = state.dlxSim; if (sim && sim.id === p.id) { const r = sim.r, pc = x => fmtPct(r.total0 ? (x / r.total0 - 1) * 100 : null);
    out.push({ type: 'h', text: L('Simulation', 'Simülasyon') }, { type: 'p', text: L(`In plain words: 2,000 possible futures up to ${dlDate(r.end)}. The middle case is ${n0(r.p50)} TRY; one time in twenty the fund ends below ${n0(r.p05)} TRY. Chance of beating the ${dlBench()}: ${r.pBeat == null ? '—' : Math.round(r.pBeat * 100) + '%'}. These are model estimates, not guarantees.`, `Kısaca: ${dlDate(r.end)} tarihine kadar 2.000 olası gelecek. Orta durum ${n0(r.p50)} TL; yirmide bir ihtimalle fon ${n0(r.p05)} TL’nin altında biter. ${dlBench()}’ı geçme olasılığı: ${r.pBeat == null ? '—' : '%' + Math.round(r.pBeat * 100)}. Bunlar model tahminidir, garanti değildir.`) },
      { type: 'table', cols: [[L('Outcome', 'Sonuç'), 'l', 2], [L('Fund value TRY', 'Fon değeri TL'), 'r', 1], [L('Change', 'Değişim'), 'r', 0.8]], rows: [[L('Bad case (5%)', 'Kötü durum (%5)'), n0(r.p05), pc(r.p05)], [L('Middle case', 'Orta durum'), n0(r.p50), pc(r.p50)], [L('Good case (95%)', 'İyi durum (%95)'), n0(r.p95), pc(r.p95)], [dlBench(), n0(r.bench), fmtPct(r.benchPct)]] }); }
  const lg = DX.txList(p, k => k).slice(0, 40); if (lg.length) out.push({ type: 'h', text: L('Transaction ledger', 'İşlem defteri') }, { type: 'p', text: L('In plain words: every dated entry of the fund, newest first (up to 40).', 'Kısaca: fonun tarihli tüm kayıtları, en yeni üstte (en çok 40).') },
    { type: 'table', size: 8, cols: [[L('Date', 'Tarih'), 'l', 0.9], [L('Transaction', 'İşlem'), 'l', 3], [L('Amount TRY', 'Tutar TL'), 'r', 1], [L('Commission', 'Komisyon'), 'r', 0.8], ['BSMV', 'r', 0.6]], rows: lg.map(r => [r.date, r.text, n0(r.amountTRY !== undefined ? r.amountTRY : r.ccy === 'USD' ? r.amount * dlFx(r.date) : r.amount), r.fee ? n2(r.fee) : '—', r.bsmv ? n2(r.bsmv) : '—']) });
  return out;
}
{ const pm = E.packageModel; E.packageModel = function (c, p) { const m = pm(c, p); try { if (!p || !(dlHasSleeve(p) || state.dlxSim && state.dlxSim.id === p.id)) return m; const add = dlFundBlocks(p), i = (m.blocks || []).findIndex(b => b && ((b.type === 'h' && b.num === false) || b.type === 'disclaimer')); if (i < 0) m.blocks.push(...add); else m.blocks.splice(i, 0, ...add); } catch (e) { console.error(e); } m.lang = state.S.lang || 'en'; return m; }; }
for (const k of ['statementModel', 'tearsheetModel', 'brokerDigestModel']) { const f = E[k]; if (typeof f === 'function') E[k] = function () { const m = f.apply(this, arguments); if (m) m.lang = state.S.lang || 'en'; return m; }; }

/* in-app glossary (Today › Glossary) */
{ const g = GROUPS_NAV.TODAY; if (!g.some(([k]) => k === 'GLOSS')) g.push(['GLOSS', 'Glossary']);
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="view" id="view-GLOSS" hidden><div class="grid"><div class="panel wide"><h2 id="gl-h"></h2><div class="body"><input id="gl-q" type="search" style="width:220px;margin-bottom:10px"><dl class="kv" id="gl-list"></dl></div></div></div></section>`); }
function renderGlossary() { if (state.view !== 'GLOSS') return; const q = ($('gl-q').value || '').trim().toLowerCase(), all = DX.glossaryAll(state.S.lang); $('gl-h').innerHTML = `${DL('Glossary', 'Sözlük')} <span class="sub">${DL('terms and abbreviations used in the app and in reports', 'uygulamada ve raporlarda kullanılan terimler ve kısaltmalar')}</span>`; $('gl-q').placeholder = DL('Search', 'Ara'); $('gl-q').oninput = renderGlossary;
  $('gl-list').innerHTML = all.filter(x => !q || x.term.toLowerCase().includes(q) || x.text.toLowerCase().includes(q)).map(x => `<dt><b>${esc(x.term)}</b></dt><dd class="txt" style="text-align:left">${esc(x.text)}</dd>`).join(''); }
state.hooks.push(() => { try { renderGlossary(); } catch (e) { } });


/* ================= GitHub Pages mode: your data in this browser, backup / restore / import, install ================= */
const DLS = window.__GNC_STATIC || null;
let dlInstallEvt = null; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); dlInstallEvt = e; try { renderAll(); } catch (er) { } });
function dlStaticPanel() {
  if (!DLS || state.view !== 'SET') return; const grid = document.querySelector('#view-SET .grid'); if (!grid) return; let el = $('dlx-static'); if (!el) { grid.insertAdjacentHTML('afterbegin', '<div class="panel wide" id="dlx-static"></div>'); el = $('dlx-static'); }
  const i = DLS.store.info(), when = iso => iso ? new Date(iso).toLocaleString(state.S.lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—';
  el.innerHTML = `<h2>${DL('Your data in this browser', 'Bu tarayıcıdaki verileriniz')} <span class="sub">${DL('GitHub version', 'GitHub sürümü')}</span></h2><div class="body">
    <dl class="kv"><dt>${DL('Market data updated', 'Piyasa verisi güncellendi')}</dt><dd>${esc(when(i.generatedAt))}${i.mode === 'full' ? ` (${DL('full', 'tam')})` : ''}</dd><dt>${DL('Next update', 'Sonraki güncelleme')}</dt><dd>${DL('about', 'yaklaşık')} ${esc(when(i.nextRun))}</dd><dt>${DL('Your saved documents', 'Kayıtlı belgeleriniz')}</dt><dd>${i.own}</dd><dt>${DL('Storage used', 'Kullanılan alan')}</dt><dd id="dlx-usage">…</dd></dl>
    ${(i.notes || []).length ? `<p class="hint">${esc(i.notes.join(' · '))}</p>` : ''}
    <div class="row-inline" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="primary" id="dlx-bk">${DL('Download backup', 'Yedek indir')}</button><label class="btn-like"><input type="file" id="dlx-imp" accept=".json,application/json" hidden><span class="quiet" style="border:1px solid var(--line,#ccc);padding:5px 10px;border-radius:4px;cursor:pointer">${DL('Restore / import from the computer version…', 'Geri yükle / bilgisayar sürümünden aktar…')}</span></label>${dlInstallEvt ? `<button id="dlx-install">${DL('Install as an app', 'Uygulama olarak yükle')}</button>` : ''}<button class="quiet" id="dlx-wipe">${DL('Delete my data in this browser…', 'Bu tarayıcıdaki verilerimi sil…')}</button></div>
    <p class="note">${DL('Funds, ledger, journal and settings are kept only in this browser on this device — nothing is sent anywhere. Download a backup regularly; to use another device, restore the backup there. To move from the computer version, choose its data\\store.json (or userdocs.json) above. Market data is fetched by GitHub about every 30–60 minutes on weekdays and every night; the Refresh button cannot start it.', 'Fonlar, işlem defteri, günlük ve ayarlar yalnızca bu cihazdaki bu tarayıcıda tutulur — hiçbir yere gönderilmez. Düzenli olarak yedek indirin; başka bir cihazda kullanmak için yedeği orada geri yükleyin. Bilgisayar sürümünden geçmek için yukarıdan onun data\\store.json (veya userdocs.json) dosyasını seçin. Piyasa verisini GitHub iş günleri yaklaşık 30–60 dakikada bir ve her gece çeker; Yenile düğmesi bunu başlatamaz.')}</p></div>`;
  DLS.store.usage().then(u => { const x = $('dlx-usage'); if (x) x.textContent = u && u.usage ? `${(u.usage / 1e6).toFixed(1)} MB / ${(u.quota / 1e9).toFixed(0)} GB` : '—'; });
  $('dlx-bk').onclick = async () => { const b = await DLS.store.exportAll(); const blob = new Blob([JSON.stringify(b)], { type: 'application/json' }); await state.downloads.save({ filename: `orangegoat-backup-${today()}.json`, data: blob }); toast(DL('Backup downloaded', 'Yedek indirildi')); };
  $('dlx-imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const obj = JSON.parse(await f.text()); const has = Object.keys((obj && obj.docs) || obj || {}).some(k => k.startsWith('data/users/') || k === 'settings/main'); if (!has) throw new Error(DL('No funds, journal or settings in this file.', 'Bu dosyada fon, günlük veya ayar yok.'));
      if (!confirm(DL('Replace the data in this browser with the file? (Download a backup first if unsure.)', 'Bu tarayıcıdaki veriler dosyadakilerle değiştirilsin mi? (Emin değilseniz önce yedek indirin.)'))) return;
      const n = await DLS.store.importDocs(obj, { replace: true }); toast(`${n} ${DL('documents imported — reloading', 'belge aktarıldı — yeniden yükleniyor')}`); setTimeout(() => location.reload(), 1200); } catch (er) { toast(DL('Import failed: ', 'Aktarma başarısız: ') + er.message); } };
  const ins = $('dlx-install'); if (ins) ins.onclick = async () => { dlInstallEvt.prompt(); try { await dlInstallEvt.userChoice; } catch (er) { } dlInstallEvt = null; renderAll(); };
  $('dlx-wipe').onclick = () => { if (confirm(DL('Delete all funds, journal and settings in this browser? This cannot be undone.', 'Bu tarayıcıdaki tüm fonlar, günlük ve ayarlar silinsin mi? Geri alınamaz.'))) DLS.store.wipe(); };
}
if (DLS) {
  state.hooks.push(() => { try { dlStaticPanel(); } catch (e) { console.error(e); } });
  // first visit: point to the import, once
  state.hooks.push(() => { if (state.__dlxHello || !state.dbOk) return; state.__dlxHello = true; setTimeout(() => { if (!(state.packages || []).length && DLS.store.info().own === 0) toast(DL('Welcome! To bring your funds from the computer version: Settings › Your data in this browser › Import.', 'Hoş geldiniz! Bilgisayar sürümündeki fonlarınızı getirmek için: Ayarlar › Bu tarayıcıdaki verileriniz › Aktar.')); }, 2500); });
  // Refresh: explain the automatic GitHub schedule instead of starting a run
  { const fr = fireRefresh; fireRefresh = async function () { const m = $('rf-msg'), i = DLS.store.info(), w = iso => iso ? new Date(iso).toLocaleString(state.S.lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
      if (m) m.textContent = DL(`Prices are updated automatically on GitHub: last ${w(i.generatedAt)}, next about ${w(i.nextRun)}. The page picks up new data by itself.`, `Fiyatlar GitHub'da otomatik güncellenir: son ${w(i.generatedAt)}, sonraki yaklaşık ${w(i.nextRun)}. Sayfa yeni veriyi kendiliğinden alır.`); }; }
  // the VİOP download button runs on GitHub, not here
  state.hooks.push(() => { const b = $('vp-refresh'); if (b && !b.dataset.static) { b.dataset.static = '1'; b.style.display = 'none'; } });
}


/* ================= ledger editor: delete any entry as if never entered, change entry dates; the fund start follows ================= */
const dlRefKey = r => r.id ? 'tx:' + r.id : r.ref ? [r.ref.t, r.ref.li, r.ref.i].filter(v => v !== undefined).join(':') : null;
function dlRowButtons(r) { const k = dlRefKey(r); if (!k || r.auto) return ''; return `<button class="quiet" data-dlx-edit="${esc(k)}" title="${esc(DL('Change the date', 'Tarihi değiştir'))}">✎</button><button class="quiet" data-dlx-del="${esc(k)}" title="${esc(DL('Delete this entry', 'Bu kaydı sil'))}">✕</button>`; }
function dlEntry(p, key) { const [t, a, b] = key.split(':');
  if (t === 'tx') { const x = (p.tx || []).find(z => z.id === key.slice(3)); return x ? { t, x, date: x.date } : null; }
  const l = (p.lines || [])[+a]; if (!l) return null;
  if (t === 'fill') { const f = (l.fills || [])[+b]; return f ? { t, l, f, i: +b, date: f.date } : null; }
  if (t === 'sale') { const s = (l.sales || [])[+b]; return s ? { t, l, s, i: +b, date: s.date } : null; }
  if (t === 'close') return l.closed ? { t, l, date: l.closed.date } : null; return null; }
// the fund starts with its earliest entry; the date in its name and the reference levels follow
function dlFixStart(p, earlierOnly) {
  const ds = [...(p.lines || []).flatMap(l => (l.fills || []).map(f => f.date)), ...(p.tx || []).map(t => t.date)].filter(Boolean).sort(); const start = ds[0]; if (!start || start === p.date || (earlierOnly && start > p.date)) return false;
  const old = p.date; p.date = start; if (p.ordered !== false) p.orderedAt = start;
  try { if (/\(([^()]*)\)$/.test(p.name)) p.name = p.name.replace(/\(([^()]*)\)$/, `(${E.longDate(start)})`); } catch (e) { }
  p.usdtryAt = dlFx(start); try { const xu = typeof impCloseAt === 'function' ? impCloseAt('XU100', start) : null; if (xu) p.xu100At = xu; } catch (e) { }
  for (const tr of p.tranches || []) if (tr.n === 1 && tr.date === old) { tr.date = start; if (tr.doneDate === old) tr.doneDate = start; }
  try { p.fundId = typeof fundIdOf === 'function' ? fundIdOf(p) : p.fundId; } catch (e) { }
  return true;
}
function dlAfterLines(p) { p.lines = (p.lines || []).filter(l => !(l.__drop)); if (p.lines.length && p.lines.every(l => l.closed)) { if (p.status !== 'closed') { p.status = 'closed'; p.closedAt = p.lines.map(l => l.closed.date).sort().pop(); p.closedValue = p.lines.reduce((a, l) => a + (+l.closed.value || 0), 0); } } else if (p.status === 'closed' && !p.__keepClosed) { p.status = 'open'; delete p.closedAt; delete p.closedValue; }
  p.total = D_r2(p.lines.reduce((a, l) => a + (+l.amount || 0), 0)); dlNormalize(p); dlFixStart(p); }
const D_r2 = v => Math.round(v * 100) / 100;
function dlDeleteEntry(p, key) {
  const e = dlEntry(p, key); if (!e) return DL('Entry not found.', 'Kayıt bulunamadı.');
  if (e.t === 'tx') { const x = e.x; p.tx = p.tx.filter(z => z !== x && !(x.type === 'dep-open' && z.type === 'dep-close' && z.depId === x.depId) && !(x.type === 'viop-open' && z.type === 'viop-close' && z.posId === x.posId)); }
  else if (e.t === 'fill') { const l = e.l; l.fills.splice(e.i, 1); l.amount = Math.max(0, (+l.amount || 0) - (+e.f.amount || 0)); lineRecompute(l); if (!l.fills.length && !(l.sales || []).length && !l.closed) l.__drop = true; else l.amount = Math.max(l.amount, l.filled || 0); }
  else if (e.t === 'sale') { const l = e.l, s = e.s, q = +l.qty || 0, k = q > 0 ? (q + (+s.qty || 0)) / q : 1; l.fills = (l.fills || []).map(f => ({ ...f, qty: f.qty * k, amount: f.amount * k })); l.amount = (+l.amount || 0) * k; l.sales.splice(e.i, 1); lineRecompute(l); }
  else if (e.t === 'close') { delete e.l.closed; }
  dlAfterLines(p); return null;
}
function dlRedateEntry(p, key, date) {
  const e = dlEntry(p, key); if (!e) return DL('Entry not found.', 'Kayıt bulunamadı.'); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) return DL('Choose a date up to today.', 'Bugün veya öncesine ait bir tarih seçin.');
  if (e.t === 'tx') { const x = e.x; if (x.type === 'dep-open' && x.maturity && x.maturity <= date) return DL('The deposit would start on or after its maturity.', 'Mevduat vade tarihinde veya sonrasında başlamış olur.'); if (x.type === 'viop-open' && x.expiry && date > x.expiry) return DL('The date is after the contract expiry.', 'Tarih sözleşmenin vade sonundan sonra.');
    if (x.type === 'dep-close' || x.type === 'viop-close') { const o = p.tx.find(z => (z.depId && z.depId === x.depId && z.type === 'dep-open') || (z.posId && z.posId === x.posId && z.type === 'viop-open')); if (o && date < o.date) return DL('The closing date is before the opening.', 'Kapanış tarihi açılıştan önce.'); }
    if (x.type === 'dep-open' || x.type === 'viop-open') { const c = p.tx.find(z => (z.type === 'dep-close' && z.depId === x.depId) || (z.type === 'viop-close' && z.posId === x.posId)); if (c && c.date < date) return DL('The position was closed before that date.', 'Pozisyon o tarihten önce kapanmış.'); }
    x.date = date; if (x.type === 'in' || x.type === 'out') { if (x.ccy === 'USD') x.fx = dlFx(date); } }
  else if (e.t === 'fill') { const l = e.l, f = e.f; if (l.ccy === 'USD' && f.price && f.qty) { const fx = dlFx(date); f.amount = D_r2(f.qty * f.price * fx + (+f.commission || 0) + (+f.bsmv || 0)); } f.date = date; l.fills.sort((a, b) => a.date < b.date ? -1 : 1); lineRecompute(l); l.amount = Math.max(+l.filled || 0, l.fills.reduce((a, z) => a + (+z.amount || 0), 0)); }
  else if (e.t === 'sale') e.s.date = date; else if (e.t === 'close') e.l.closed.date = date;
  dlAfterLines(p); return null;
}
function dlEntryChange(p, fn, label) {
  const before = JSON.stringify(p); const err = fn(); const chk = !err && DX.replay(p.tx || [], today(), dlFx, dlSettleAt);
  if (err || (chk && chk.warn.length)) { const keep = JSON.parse(before); for (const k of Object.keys(p)) delete p[k]; Object.assign(p, keep); toast(err || DL('Not changed: later entries need this money on that date — ', 'Değiştirilmedi: sonraki kayıtlar o tarihte bu paraya ihtiyaç duyuyor — ') + chk.warn[0]); return false; }
  journal(`${p.name}: ${label}.`, { kind: 'order', pkg: p.id }); saveUser('packages'); renderAll(); reopenSheet();
  toast(DL('Saved', 'Kaydedildi'), () => { const keep = JSON.parse(before); for (const k of Object.keys(p)) delete p[k]; Object.assign(p, keep); saveUser('packages'); renderAll(); reopenSheet(); toast(DL('Undone', 'Geri alındı')); }); return true;
}
document.addEventListener('click', ev => {
  const d = ev.target.closest('button[data-dlx-del]'), ed = ev.target.closest('button[data-dlx-edit]'); if (!d && !ed) return; ev.stopPropagation();
  const p = state.sheet && state.packages.find(q => q.id === state.sheet.id); if (!p) return;
  if (d) { if (!d.dataset.sure) { d.dataset.sure = '1'; d.textContent = DL('Delete?', 'Silinsin mi?'); setTimeout(() => { if (d.isConnected) { delete d.dataset.sure; d.textContent = '✕'; } }, 4000); return; }
    const key = d.dataset.dlxDel, e = dlEntry(p, key), what = e ? `${e.t === 'tx' ? DX.txText(e.x, k => k) : (e.l && e.l.symbol) + ' ' + e.t} (${e.date})` : key; dlEntryChange(p, () => dlDeleteEntry(p, key), `${DL('entry deleted', 'kayıt silindi')} — ${what}`); return; }
  const key = ed.dataset.dlxEdit, e = dlEntry(p, key); if (!e) return;
  $('modal').hidden = false; $('modal').innerHTML = `<div class="modal" role="dialog" aria-label="Change date" style="width:min(460px,100%)"><h3>${DL('Change the date', 'Tarihi değiştir')}</h3><p class="hint">${esc(e.t === 'tx' ? DX.txText(e.x, k => k) : `${e.l.symbol} · ${e.t === 'fill' ? DL('buy', 'alış') : DL('sell', 'satış')}`)}</p>
    <div class="form"><label for="de-date">${DL('Date', 'Tarih')}</label><input id="de-date" type="date" value="${esc(e.date)}" max="${today()}"></div><p class="hint" style="margin-top:8px">${DL('The fund start date follows the earliest entry. US shares are revalued at that day’s USD/TRY.', 'Fonun başlangıç tarihi en eski kayda göre ayarlanır. ABD hisseleri o günün USD/TRY kuruyla yeniden değerlenir.')}</p>
    <div class="row-inline" style="justify-content:flex-end;gap:8px;margin-top:12px"><button id="de-cancel">${DL('Cancel', 'Vazgeç')}</button><button class="primary" id="de-ok">${DL('Save', 'Kaydet')}</button></div></div>`;
  $('de-cancel').onclick = closeModal; $('de-ok').onclick = () => { const nd = $('de-date').value; closeModal(); dlEntryChange(p, () => dlRedateEntry(p, key, nd), `${DL('date changed', 'tarih değiştirildi')} ${e.date} → ${nd}`); };
}, true);

/* ================= fund cards: everything the fund holds ================= */
{ const rp = renderPackages; renderPackages = function () { rp.apply(this, arguments); try { for (const card of document.querySelectorAll('#pkg-cards .card[data-pkg]')) { const p = state.packages.find(q => q.id === card.dataset.pkg); if (!p || card.querySelector('.dlx-card')) continue; const h = dlCardHTML(p); if (!h) continue; const kv = card.querySelector('dl.kv'); (kv || card.querySelector('h3')).insertAdjacentHTML('afterend', h); } } catch (e) { console.error(e); } }; }
function dlCardHTML(p) {
  if (p.status === 'closed') return ''; const m = ctx().M, rows = []; let hv = []; try { hv = (p.lines || []).some(l => !l.closed) ? E.holdingsView([], [{ ...p, lines: p.lines.filter(l => !l.closed) }], state.map, m, state.S) : []; } catch (e) { }
  for (const r of hv) rows.push([r.symbol, `${fmtN(r.qty, r.qty % 1 ? 3 : 0)} ${DL('units', 'adet')}`, r.value, r.plNet ?? r.pl ?? null, 'eq']);
  if (dlHasSleeve(p)) { const sl = dlSleeve(p), fx = dlFx(today());
    if (Math.abs(sl.cash.TRY) > 0.5) rows.push([DL('TRY cash', 'TL nakit'), '', sl.cash.TRY, null, 'cash']);
    if (Math.abs(sl.cash.USD) > 0.005) rows.push([DL('USD cash', 'USD nakit'), `${fmtN(sl.cash.USD, 2)} USD`, sl.cash.USD * fx, null, 'cash']);
    for (const d of sl.open) rows.push([d.maturity ? DL('Time deposit', 'Vadeli mevduat') : DL('Demand deposit', 'Vadesiz mevduat'), `${fmtN(d.principal, 0)} ${d.ccy} · %${fmtN(d.rate, 1)}${d.maturity ? ' · ' + DL('maturity', 'vade') + ' ' + d.maturity + ` (${DX.daysBetween(today(), d.maturity)} ${DL('d', 'g')})` : ''}`, (d.principal + d.accrued.net) * (d.ccy === 'USD' ? fx : 1), null, 'dep']);
    for (const v of sl.viop) rows.push([v.code, `${v.side === 'short' ? DL('short', 'kısa') : DL('long', 'uzun')} ${v.qty} · ${DL('P/L', 'K/Z')} ${fmtN(v.pnl, 0)} TRY`, v.equity, v.margin * v.qty ? v.pnl / (v.margin * v.qty) * 100 : null, 'viop']); }
  if (!rows.length) return '';
  const tot = rows.reduce((a, r) => a + (+r[2] || 0), 0) || 1, lab = { eq: DL('Shares / funds / gold', 'Hisse / fon / altın'), cash: DL('Cash', 'Nakit'), dep: DL('Deposits', 'Mevduat'), viop: 'VİOP' };
  const mix = Object.entries(rows.reduce((a, r) => { a[r[4]] = (a[r[4]] || 0) + (+r[2] || 0); return a; }, {})).map(([k, v]) => `${lab[k]} ${Math.round(v / tot * 100)}%`).join(' · ');
  return `<div class="dlx-card" style="margin:6px 0 8px;border-top:1px solid var(--line, #ddd);padding-top:6px"><div class="hint" style="margin-bottom:4px">${esc(mix)}</div><table style="font-size:12px;width:100%">${rows.map(r => `<tr><td class="l acc" style="padding:2px 4px">${esc(r[0])}</td><td class="l dim" style="padding:2px 4px">${esc(r[1])}</td><td style="padding:2px 4px">${fmtN(r[2], 0)}</td><td style="padding:2px 4px">${r[3] == null ? '' : P(r[3])}</td></tr>`).join('')}</table></div>`;
}

Object.assign(TR, { 'GitHub version · prices update about every 30–60 minutes on weekdays · your data stays in this browser': 'GitHub sürümü · fiyatlar iş günleri yaklaşık 30–60 dakikada bir güncellenir · verileriniz bu tarayıcıda kalır',
  'Glossary': 'Sözlük', 'Add fund from external investment report': 'Dış yatırım raporundan fon ekle', 'TRY time deposit': 'TL vadeli mevduat', 'Money-market fund': 'Para piyasası fonu', 'BIST 100 index fund': 'BIST 100 endeks fonu', 'USD deposit': 'USD mevduat', 'Inflation (CPI) — value kept': 'Enflasyon (TÜFE) — korunan değer' });
/*</DELUXE-UI>*/
