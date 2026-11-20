/*<DELUXE>*/
/* orangegoat v2.0 Deluxe — pure functions (no DOM) shared by the page and the server.
   Fund cash sleeve (TRY / USD cash, time and demand deposits), dated transaction ledger, back-dated valuation,
   benchmarks, stress tests, VİOP risk, report glossary. Amounts in the transaction currency unless noted; values in TRY. */
const DELUXE = (() => {
  const r2 = v => Math.round((+v || 0) * 100) / 100;
  const dayN = d => Math.floor(Date.parse(String(d).slice(0, 10) + 'T00:00:00Z') / 864e5);
  const daysBetween = (a, b) => Math.max(0, dayN(b) - dayN(a));
  const addDays = (d, n) => new Date((dayN(d) + n) * 864e5).toISOString().slice(0, 10);
  const CCYS = ['TRY', 'USD'];
  let seq = 0; const newId = p => (p || 'tx') + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------- deposits ---------------- */
  // simple interest, actual/365, withholding (stopaj) deducted from the interest; a time deposit stops accruing at maturity
  function depositInterest(dep, asOf) {
    const end = dep.maturity && dep.maturity < asOf ? dep.maturity : asOf;
    const days = daysBetween(dep.start, end), gross = (+dep.principal || 0) * (+dep.rate || 0) / 100 * days / 365;
    const tax = gross * (+dep.stopaj || 0) / 100; return { days, gross: r2(gross), tax: r2(tax), net: r2(gross - tax) };
  }

  /* ---------------- ledger replay ---------------- */
  // tx: [{id, date, type, ccy, amount, toCcy, toAmount, fx, fee, bsmv, rate, maturity, stopaj, depId, interest, note, auto}]
  //  in       money added to the fund (external)            out      money taken out (external)
  //  fx       ccy amount → toCcy toAmount (fx = TRY per USD)  dep-open cash → deposit depId (rate %, maturity or none, stopaj %)
  //  dep-close deposit → cash, with its interest (net of stopaj) fee / bsmv: always paid from the tx currency's cash
  // fxAt(date) → TRY per USD on that date. Returns balances on asOf (inclusive) and the external flows in TRY.
  //  viop-open futures position posId: code, side long|short, qty contracts, price, mult, margin per contract (TRY, blocked from cash)
  //  viop-close closes posId at price: margin back plus the profit or loss.  settleAt(code, date) → settlement price on or before date
  // valFxAt(date) (optional): TRY per USD used to value the USD still held on asOf (the bank's buying rate); defaults to fxAt
  function replay(tx, asOf, fxAt, settleAt, valFxAt) {
    const cash = { TRY: 0, USD: 0 }, deps = new Map(), flows = [], warn = [], vp = new Map();
    const L = (tx || []).filter(t => t && t.date && t.date <= asOf).map((t, i) => [t, i]).sort((a, b) => a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]).map(a => a[0]);
    const fxOf = t => +t.fx > 0 ? +t.fx : (fxAt ? fxAt(t.date) : 0);
    for (const t of L) {
      const c = CCYS.includes(t.ccy) ? t.ccy : 'TRY', amt = +t.amount || 0, cost = (+t.fee || 0) + (+t.bsmv || 0) + (+t.kmv || 0); // kmv: kambiyo muamele vergisi (TL), on TL → FX conversions
      if (t.type === 'in') { cash[c] += amt - cost; flows.push({ date: t.date, amount: r2(c === 'USD' ? amt * fxOf(t) : amt) }); }
      else if (t.type === 'div') { cash[c] += amt; }
      else if (t.type === 'sale-cash') { cash[c] += amt; } // proceeds of a fund line sold through the trade ticket: stay in the fund as cash (not money out)
      else if (t.type === 'buy-cash') { cash[c] -= amt; }  // fund cash spent on a share bought through the trade ticket (not new money) // dividend received: net amount into the fund's cash, income (not new money)
      else if (t.type === 'out') { cash[c] -= amt + cost; flows.push({ date: t.date, amount: -r2(c === 'USD' ? amt * fxOf(t) : amt) }); }
      else if (t.type === 'fx') { const to = CCYS.includes(t.toCcy) ? t.toCcy : (c === 'TRY' ? 'USD' : 'TRY'); cash[c] -= amt + cost; cash[to] += +t.toAmount || 0; }
      else if (t.type === 'dep-open') { cash[c] -= amt + cost; deps.set(t.depId, { id: t.depId, ccy: c, principal: amt, rate: +t.rate || 0, start: t.date, maturity: t.maturity || null, stopaj: +t.stopaj || 0, open: true, note: t.note || '' }); }
      else if (t.type === 'dep-close') { const d = deps.get(t.depId); if (!d || !d.open) { warn.push(`${t.date}: deposit ${t.depId} is not open`); continue; }
        const it = t.interest !== undefined && t.interest !== null && t.interest !== '' ? { net: r2(+t.interest * (1 - d.stopaj / 100)), gross: +t.interest } : depositInterest(d, t.date);
        d.open = false; d.closed = t.date; d.interestNet = it.net; cash[d.ccy] += d.principal + it.net - cost; }
      else if (t.type === 'viop-open') { cash.TRY -= (+t.margin || 0) * (+t.qty || 0) + cost; vp.set(t.posId, { id: t.posId, code: t.code, side: t.side === 'short' ? 'short' : 'long', qty: +t.qty || 0, price: +t.price, mult: +t.mult || 1, margin: +t.margin || 0, date: t.date, expiry: t.expiry || null, under: t.under || null, ccy: t.ccy === 'USD' ? 'USD' : 'TRY', open: true }); }
      else if (t.type === 'viop-close') { const v = vp.get(t.posId); if (!v || !v.open) { warn.push(`${t.date}: futures position ${t.posId} is not open`); continue; }
        const pnl = (v.side === 'short' ? -1 : 1) * ((+t.price) - v.price) * v.mult * v.qty * (v.ccy === 'USD' && fxAt ? (fxAt(t.date) || 1) : 1); v.open = false; v.closed = t.date; v.closePrice = +t.price; v.pnl = r2(pnl); cash.TRY += v.margin * v.qty + pnl - cost; }
      // v2.1: a trade or deposit recorded in the fund means the money existed: a shortfall is booked as money in on that date (implicit funding)
      if (t.type !== 'out' && t.type !== 'in') for (const k of CCYS) if (cash[k] < -0.005) { const add = -cash[k]; cash[k] = 0; flows.push({ date: t.date, amount: r2(k === 'USD' ? add * (fxAt ? fxAt(t.date) : 0) : add), implicit: true, ccy: k, native: r2(add) }); }
      for (const k of CCYS) if (cash[k] < -0.005) { warn.push(`${t.date}: ${k} cash below zero (${r2(cash[k])}) after ${t.type}`); }
    }
    const open = [...deps.values()].filter(d => d.open).map(d => ({ ...d, accrued: depositInterest(d, asOf) }));
    const closed = [...deps.values()].filter(d => !d.open);
    const fx = fxAt ? fxAt(asOf) : 0, vfx = valFxAt ? (valFxAt(asOf) || fx) : fx, toTRY = (v, c) => c === 'USD' ? v * vfx : v;
    const viop = [...vp.values()].filter(v => v.open).map(v => { const s = settleAt ? settleAt(v.code, asOf) : null, px = s > 0 && (!v.date || asOf >= v.date) ? s : v.price, k = v.ccy === 'USD' ? (fx || 1) : 1, pnl = (v.side === 'short' ? -1 : 1) * (px - v.price) * v.mult * v.qty * k;
      return { ...v, last: px, pnl: r2(pnl), equity: r2(v.margin * v.qty + pnl), notional: r2(px * v.mult * v.qty * k) }; });
    const viopClosed = [...vp.values()].filter(v => !v.open);
    const value = r2(toTRY(cash.TRY, 'TRY') + toTRY(cash.USD, 'USD') + open.reduce((a, d) => a + toTRY(d.principal + d.accrued.net, d.ccy), 0) + viop.reduce((a, v) => a + v.equity, 0));
    return { cash: { TRY: r2(cash.TRY), USD: r2(cash.USD) }, open, closed, viop, viopClosed, flows, netIn: r2(flows.reduce((a, f) => a + f.amount, 0)), value, warn };
  }

  // time deposits that reached maturity without a closing entry → automatic dep-close (interest credited to cash)
  function maturities(tx, today) {
    const opened = new Map(), closedIds = new Set();
    for (const t of tx || []) { if (t.type === 'dep-open') opened.set(t.depId, t); if (t.type === 'dep-close') closedIds.add(t.depId); }
    const out = [];
    for (const [id, t] of opened) if (!closedIds.has(id) && t.maturity && t.maturity <= today) {
      const it = depositInterest({ principal: t.amount, rate: t.rate, start: t.date, maturity: t.maturity, stopaj: t.stopaj }, t.maturity);
      out.push({ id: newId('tx'), date: t.maturity, type: 'dep-close', ccy: t.ccy, amount: +t.amount, depId: id, interest: it.gross, auto: true, note: `matured: interest ${it.net} ${t.ccy} net of ${+t.stopaj || 0}% withholding` });
    }
    return out;
  }
  // futures still open after their expiry: closed automatically at the last settlement price on or before expiry
  function viopExpiries(tx, today, settleAt) {
    const closedIds = new Set((tx || []).filter(t => t.type === 'viop-close').map(t => t.posId)), out = [];
    for (const t of tx || []) if (t.type === 'viop-open' && !closedIds.has(t.posId) && t.expiry && t.expiry < today) { const px = (settleAt && settleAt(t.code, t.expiry)) || +t.price;
      out.push({ id: newId('tx'), date: t.expiry, type: 'viop-close', posId: t.posId, code: t.code, price: px, auto: true, note: `expired: closed at the settlement price ${px}` }); }
    return out;
  }
  function dueSoon(tx, today, days = 5) {
    const closedIds = new Set((tx || []).filter(t => t.type === 'dep-close').map(t => t.depId));
    return (tx || []).filter(t => t.type === 'dep-open' && t.maturity && !closedIds.has(t.depId) && t.maturity > today && daysBetween(today, t.maturity) <= days);
  }

  /* ---------------- equity lines through time ---------------- */
  // quantity of a fund line held on date d (fills up to d, partial sales and the closing sale applied)
  function lineQtyAt(l, d) {
    if (l.closed && l.closed.date && l.closed.date <= d) return 0;
    const fills = (l.fills && l.fills.length ? l.fills : []).filter(f => (f.date || '') <= d);
    let q = fills.reduce((a, f) => a + (+f.qty || 0), 0);
    // sales reduce stored fills proportionally; add back the sold part before the sale date
    for (const s of l.sales || []) if (s.date > d) q += +s.qty || 0;
    return q;
  }
  function realizedAt(l, d) { // cash already received from this line by date d (sales and the closing sale), TRY
    let v = 0; for (const s of l.sales || []) if (s.date <= d && !s.toCash) v += +s.value || 0; if (l.closed && l.closed.date <= d && !l.closed.toCash) v += +l.closed.value || 0; return v; // toCash: the money went to the fund's cash
  }
  // closes: [[date, close]] ascending → price on or before d
  function priceOn(closes, d) {
    if (!closes || !closes.length) return null; let lo = 0, hi = closes.length - 1, best = null;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (closes[m][0] <= d) { best = closes[m][1]; lo = m + 1; } else hi = m - 1; }
    return best;
  }

  /* fund value day by day from its start date: equity lines at the closes of each day (USD lines × USD/TRY of the day),
     sales proceeds, the cash sleeve with deposit interest. opts: { closesOf(sym) → [[d,c]], ccyOf(sym), fxAt(d), dates? } */
  function valueSeries(p, opts) {
    const start = fundStart(p), end = opts.today; if (!start || start > end) return [];
    let dates = opts.dates; if (!dates) { dates = []; for (let d = start; d <= end; d = addDays(d, 1)) { const wd = new Date(d + 'T00:00:00Z').getUTCDay(); if (wd !== 0 && wd !== 6) dates.push(d); } if (dates[dates.length - 1] !== end) dates.push(end); }
    const out = [];
    for (const d of dates) {
      let eq = 0, missing = 0;
      for (const l of p.lines || []) {
        const q = lineQtyAt(l, d), rz = realizedAt(l, d); eq += rz; if (!(q > 0)) continue;
        let px = priceOn(opts.closesOf(l.symbol), d); const fx = (opts.ccyOf(l.symbol) || l.ccy) === 'USD' ? opts.fxAt(d) : 1;
        if (!(px > 0)) { // no close yet (bought today, or history missing): use the fill price
          const f = (l.fills || []).filter(z => z.date <= d).slice(-1)[0]; px = f && f.price ? +f.price : null; if (!px) { missing++; eq += (l.fills || []).filter(z => z.date <= d).reduce((a, z) => a + (+z.amount || 0), 0); continue; } }
        eq += q * px * fx;
      }
      const sl = replay(p.tx, d, opts.fxAt, opts.settleAt, opts.valFxAt);
      const invested = investedAt(p, d) + sl.netIn;
      out.push({ date: d, equity: r2(eq), sleeve: sl.value, value: r2(eq + sl.value), invested: r2(invested), missing });
    }
    return out;
  }
  function fundStart(p) {
    const ds = [p.date, ...(p.lines || []).flatMap(l => (l.fills || []).map(f => f.date)), ...(p.tx || []).map(t => t.date)].filter(Boolean).sort();
    return ds[0] || null;
  }
  function investedAt(p, d) { // money put into equity lines by date d (fills incl. commission)
    let v = 0; for (const l of p.lines || []) for (const f of l.fills || []) if ((f.date || '') <= d) v += (+f.amount || 0) - (+f.fromCash || 0); // fromCash: paid with money already in the fund
    for (const l of p.lines || []) for (const s of l.sales || []) if (s.toCash && s.date <= d) v += +s.cost || 0; // sold cost moved to the fund's cash, still invested
    // proportional reductions after partial sales shrink stored fill amounts; add the sold cost back before the sale
    for (const l of p.lines || []) { const q = (l.fills || []).reduce((a, f) => a + (+f.qty || 0), 0), am = (l.fills || []).reduce((a, f) => a + (+f.amount || 0), 0), avg = q > 0 ? am / q : 0;
      for (const s of l.sales || []) if (s.date > d) v += (+s.qty || 0) * avg; }
    return v;
  }
  function seriesStats(sr) {
    if (!sr || sr.length < 2) return null; const a = sr[0], z = sr[sr.length - 1];
    let peak = -Infinity, mdd = 0; for (const r of sr) { const k = r.invested > 0 ? r.value / r.invested : 1; peak = Math.max(peak, k); mdd = Math.min(mdd, k / peak - 1); }
    return { start: a.date, end: z.date, value: z.value, invested: z.invested, gain: r2(z.value - z.invested), pct: z.invested > 0 ? (z.value / z.invested - 1) * 100 : null, maxDrawdown: mdd * 100 };
  }

  /* ---------------- transaction list for display (fills + sales + sleeve) ---------------- */
  function txList(p, label) {
    const L = label || (k => k), rows = [];
    (p.lines || []).forEach((l, li) => {
      (l.fills || []).forEach((f, i) => rows.push({ date: f.date, kind: 'buy', ref: { t: 'fill', li, i }, text: `${L('Buy')} ${l.symbol}`, qty: +f.qty, price: +f.price, ccy: l.ccy || 'TRY', amountTRY: +f.amount, fee: +f.commission || 0, bsmv: +f.bsmv || 0, src: f.src || '' }));
      (l.sales || []).forEach((s, i) => rows.push({ date: s.date, kind: 'sell', ref: { t: 'sale', li, i }, text: `${L('Sell')} ${l.symbol}`, qty: +s.qty, price: +s.price, ccy: l.ccy || 'TRY', amountTRY: +s.value, fee: 0, src: '' }));
      if (l.closed) rows.push({ date: l.closed.date, kind: 'sell', ref: { t: 'close', li }, text: `${L('Sell')} ${l.symbol}`, qty: +l.closed.qty || null, price: +l.closed.price || null, ccy: l.ccy || 'TRY', amountTRY: +l.closed.value, fee: 0, src: '' });
    });
    for (const t of p.tx || []) if (t.type !== 'sale-cash' && t.type !== 'buy-cash') rows.push({ date: t.date, kind: t.type, id: t.id, text: txText(t, L), ccy: t.ccy, amount: +t.amount, fee: +t.fee || 0, bsmv: +t.bsmv || 0, auto: !!t.auto, note: t.note || '' });
    return rows.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  }
  function txText(t, L) {
    const n = (v, d = 2) => (+v || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    if (t.type === 'div') return `${L('Dividend')} ${t.symbol || ''} · ${n(t.qty, 0)} × ${n(t.perShare, 4)} = ${L('gross')} ${n(t.gross)} · ${L('withholding')} ${n(t.tax)} · ${L('net')} ${n(t.amount)} ${t.ccy}`;
    if (t.type === 'sale-cash') return `${L('Sale proceeds to fund cash')} ${t.symbol || ''} ${n(t.amount)} ${t.ccy}`;
    if (t.type === 'buy-cash') return `${L('Fund cash used for a purchase')} ${t.symbol || ''} ${n(t.amount)} ${t.ccy}`;
    if (t.type === 'in') return `${L('Money in')} ${n(t.amount)} ${t.ccy}`;
    if (t.type === 'out') return `${L('Money out')} ${n(t.amount)} ${t.ccy}`;
    if (t.type === 'fx') return `${L('Convert')} ${n(t.amount)} ${t.ccy} → ${n(t.toAmount)} ${t.toCcy} @ ${n(t.fx, 4)}`;
    if (t.type === 'dep-open') return `${t.maturity ? L('Time deposit') : L('Demand deposit')} ${n(t.amount)} ${t.ccy} @ ${n(t.rate)}%${t.maturity ? ' → ' + t.maturity : ''}${+t.stopaj ? ` (${L('withholding')} ${n(t.stopaj, 1)}%)` : ''}`;
    if (t.type === 'viop-open') return `${L('Futures')} ${t.side === 'short' ? L('short') : L('long')} ${n(t.qty, 0)} × ${t.code} @ ${n(t.price, 4)} · ${L('margin')} ${n((+t.margin || 0) * (+t.qty || 0))} TRY`;
    if (t.type === 'viop-close') return `${t.auto ? L('Futures expired') : L('Futures closed')} ${t.code || ''} @ ${n(t.price, 4)}`;
    if (t.type === 'dep-close') return `${t.auto ? L('Deposit matured') : L('Deposit closed')} ${n(t.amount)} ${t.ccy}${t.interest !== undefined && t.interest !== null ? ` · ${L('interest')} ${n(t.interest)} ${L('gross')}` : ''}`;
    return t.type;
  }

  /* ---------------- benchmarks: the same flows into TRY deposit, USD cash, gram gold, BIST 100 ---------------- */
  // flows: [{date, amount TRY}] (positive in). seriesAt(name, d) → level of the benchmark on d (TRY per unit); deposit uses depRateAt(d) % a year net.
  function benchmarks(flows, today, o) {
    const out = [];
    const unitBench = (name, label, levelAt) => { let units = 0, ok = true; for (const f of flows) { const lv = levelAt(f.date); if (!(lv > 0)) { ok = false; break; } units += f.amount / lv; } const lv = levelAt(today); if (!ok || !(lv > 0)) return null; return { key: name, name: label, value: r2(units * lv) }; };
    if (o.depositNet) { let v = 0; for (const f of flows) v += f.amount * (1 + o.depositNet(f.date, today) / 100); out.push({ key: 'dep', name: o.labels.dep, value: r2(v) }); }
    for (const [k, fn] of [['usd', o.usdAt], ['gold', o.goldAt], ['xu100', o.xu100At]]) if (fn) { const b = unitBench(k, o.labels[k], fn); if (b) out.push(b); }
    const invested = flows.reduce((a, f) => a + f.amount, 0);
    for (const b of out) { b.gain = r2(b.value - invested); b.pct = invested > 0 ? (b.value / invested - 1) * 100 : null; }
    return { invested: r2(invested), rows: out };
  }

  /* ---------------- stress tests ---------------- */
  // positions: [{name, kind:'tr_eq'|'us_eq'|'gold'|'usd_cash'|'try_cash'|'try_dep'|'usd_dep'|'viop'|'other', valueTRY, beta, ccy, years (deposit remaining), notional? side?}]
  const SCENARIOS = [
    { key: 'try20', label: 'TRY loses 20% against USD', fxUp: 0.25, bist: 0, rate: 0 },
    { key: 'bist15', label: 'BIST falls 15%', fxUp: 0, bist: -0.15, rate: 0 },
    { key: 'rate5', label: 'TRY interest rates up 5 points', fxUp: 0, bist: -0.05, rate: 5 },
  ];
  // assumptions (stated in the report): TRY loss → USD assets and gold +25% in TRY, BIST shares +0.5×25% (partly priced in USD terms);
  // BIST −15% → TR shares −15%×beta, US shares 0; rates +5 pt → TR shares −5%×beta (discount-rate effect), fixed-rate TRY deposits unchanged
  // until maturity, demand deposits earn more (+5 pt for the stress horizon of 3 months), TRY money-market funds +5 pt × 0.25 year.
  function stress(positions, scen) {
    const rows = positions.map(q => {
      const b = isFinite(q.beta) ? Math.max(0, Math.min(2, q.beta)) : 1; let ch = 0;
      if (q.kind === 'tr_eq') ch = scen.bist * b + scen.fxUp * 0.5 + (scen.key === 'rate5' ? 0 : 0);
      else if (q.kind === 'us_eq' || q.kind === 'usd_cash' || q.kind === 'usd_dep') ch = scen.fxUp;
      else if (q.kind === 'gold' || q.kind === 'cmdty') ch = scen.fxUp * 0.95;
      else if (q.kind === 'try_cash') ch = 0;
      else if (q.kind === 'try_dep') ch = q.demand ? scen.rate / 100 * 0.25 : 0;
      else if (q.kind === 'try_mm') ch = scen.rate / 100 * 0.25;
      else if (q.kind === 'viop') { const und = q.underKind === 'usd' ? scen.fxUp : q.underKind === 'gold' ? scen.fxUp * 0.95 : scen.bist * b + scen.fxUp * 0.5; return { ...q, change: r2((q.side === 'short' ? -1 : 1) * und * (q.notional || 0)), pct: null }; }
      else ch = scen.bist * 0.5;
      return { ...q, change: r2(q.valueTRY * ch), pct: ch * 100 };
    });
    const before = positions.reduce((a, q) => a + (q.kind === 'viop' ? (q.valueTRY || 0) : q.valueTRY), 0), delta = rows.reduce((a, r) => a + r.change, 0);
    return { key: scen.key, label: scen.label, before: r2(before), after: r2(before + delta), delta: r2(delta), pct: before ? delta / before * 100 : null, rows };
  }

  /* ---------------- VİOP risk ---------------- */
  // c: {underPrice, futPrice, multiplier, initialMargin, maintMargin, expiry, rateTRY %, divYield %} ; vol: annual % of the underlying
  function viopRisk(c, vol, today, opts = {}) {
    const S = +c.underPrice || +c.futPrice, F = +c.futPrice || S, mult = +c.multiplier || 1, IM = +c.initialMargin || 0, MM = +c.maintMargin || IM * 0.75;
    const T = Math.max(1, daysBetween(today, c.expiry)) / 365, sig = Math.max(1, +vol || 30) / 100, notional = F * mult;
    const fair = S * Math.exp(((+c.rateTRY || 0) - (+c.divYield || 0)) / 100 * T);
    const basisPct = S ? (F / S - 1) * 100 : null, lev = IM > 0 ? notional / IM : null;
    const z99 = 2.326, oneDay = notional * sig / Math.sqrt(252) * z99;
    // margin call: equity (initial margin) falls below maintenance → loss > IM − MM per contract; probability the running loss touches it
    // before expiry (reflection principle on a driftless lognormal path): P = 2·N(−b/(σ√T)) with b = ln(1 + buffer/notional) for longs
    const buffer = Math.max(0, IM - MM), N = x => 0.5 * (1 + erf(x / Math.SQRT2));
    const bLong = Math.log(1 + buffer / notional), bShort = Math.log(1 + buffer / notional);
    const pCallLong = buffer > 0 ? Math.min(1, 2 * N(-bLong / (sig * Math.sqrt(T)))) : 1, pCallShort = buffer > 0 ? Math.min(1, 2 * N(-bShort / (sig * Math.sqrt(T)))) : 1;
    const q = k => F * Math.exp(-0.5 * sig * sig * T + k * sig * Math.sqrt(T));
    const fan = { p05: q(-1.645), p25: q(-0.674), p50: q(0), p75: q(0.674), p95: q(1.645) };
    const pnl = k => (fan[k] - F) * mult;
    return { notional, fair, basisPct, leverage: lev, initialMargin: IM, maintMargin: MM, oneDay99: oneDay, oneDayPctOfMargin: IM ? oneDay / IM * 100 : null,
      pCallLong, pCallShort, years: T, vol: sig * 100, fan, pnlLong: { p05: pnl('p05'), p50: pnl('p50'), p95: pnl('p95') } };
  }
  function erf(x) { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a); return s * y; }

  /* ---------------- glossary ---------------- */
  const GLOSSARY = {
    'ROI': ['Return on investment: gain or loss as a percentage of the money put in.', 'Yatırım getirisi: kazanç veya zararın yatırılan paraya oranı (yüzde).'],
    'TRY': ['Turkish lira.', 'Türk lirası.'], 'USD': ['US dollar.', 'ABD doları.'],
    'BIST 100': ['Borsa İstanbul\'s index of its 100 largest listed companies.', 'Borsa İstanbul\'daki en büyük 100 şirketin endeksi.'],
    'BIST': ['Borsa İstanbul, the Istanbul stock exchange.', 'Borsa İstanbul, İstanbul menkul kıymetler borsası.'],
    'BYF': ['Exchange-traded fund on Borsa İstanbul (Borsa Yatırım Fonu).', 'Borsa İstanbul\'da işlem gören yatırım fonu (Borsa Yatırım Fonu).'],
    'TEFAS': ['Turkey\'s electronic platform for buying and selling investment funds.', 'Türkiye\'de yatırım fonlarının alınıp satıldığı elektronik platform.'],
    'VİOP': ['Borsa İstanbul\'s futures and options market.', 'Borsa İstanbul\'un vadeli işlem ve opsiyon piyasası.'],
    'Futures': ['A contract to buy or sell an asset at a set price on a future date; only a margin is paid up front.', 'Bir varlığı ileri bir tarihte bugünden belirlenen fiyattan alma veya satma sözleşmesi; başta yalnızca teminat yatırılır.'],
    'Initial margin': ['Money that must be deposited to open one futures contract.', 'Bir vadeli sözleşme açmak için yatırılması gereken teminat.'],
    'Maintenance margin': ['The lowest level the margin account may fall to; below it the broker asks for more money (margin call).', 'Teminat hesabının düşebileceği en alt seviye; altına inilirse aracı kurum ek teminat ister.'],
    'Margin call': ['A demand to add money because losses pushed the margin below the maintenance level.', 'Zararlar teminatı sürdürme seviyesinin altına indirdiğinde ek para yatırma çağrısı.'],
    'Leverage': ['How many liras of exposure each lira of margin controls (contract value ÷ margin).', 'Yatırılan her bir liralık teminatın kaç liralık pozisyonu kontrol ettiği (sözleşme değeri ÷ teminat).'],
    'Notional': ['The full value of the asset a futures contract controls (price × contract size).', 'Vadeli sözleşmenin karşılığı olan varlığın toplam değeri (fiyat × sözleşme büyüklüğü).'],
    'Settlement price': ['The official end-of-day futures price used to calculate daily profit and loss.', 'Günlük kâr ve zararın hesaplandığı resmî gün sonu vadeli fiyatı (uzlaşma fiyatı).'],
    'Basis': ['Difference between the futures price and the price of the underlying asset.', 'Vadeli fiyat ile dayanak varlığın fiyatı arasındaki fark.'],
    'Underlying': ['The share, index, currency or commodity a futures contract is based on.', 'Vadeli sözleşmenin dayandığı hisse, endeks, döviz veya emtia.'],
    'Expiry': ['The last day of a futures contract.', 'Vadeli sözleşmenin son günü (vade sonu).'],
    'Volatility': ['How much a price usually swings in a year, in percent; higher means riskier.', 'Bir fiyatın bir yılda tipik olarak ne kadar dalgalandığı (yüzde); yüksek olması daha riskli demektir.'],
    'Drawdown': ['The fall from the highest value reached to a later low.', 'Ulaşılan en yüksek değerden sonraki en düşük değere düşüş.'],
    'Max drawdown': ['The largest drop from a peak to a later low in the period.', 'Dönem içindeki en büyük zirveden dibe düşüş.'],
    'Withholding tax': ['Tax deducted at source from deposit interest (stopaj).', 'Mevduat faizinden kaynakta kesilen vergi (stopaj).'],
    'Stopaj': ['Withholding tax deducted from deposit interest or fund gains at source.', 'Mevduat faizinden veya fon kazancından kaynakta kesilen vergi.'],
    'BSMV': ['Banking and insurance transactions tax charged on some fees and FX trades.', 'Bazı işlem ücretleri ve döviz alım-satımlarında alınan Banka ve Sigorta Muameleleri Vergisi.'],
    'Commission': ['Fee paid to the broker or bank for a transaction.', 'Bir işlem için aracı kuruma veya bankaya ödenen ücret.'],
    'Time deposit': ['Money placed at a bank for a fixed period at a fixed rate (vadeli mevduat).', 'Bankada belirli bir süre ve sabit faizle tutulan para (vadeli mevduat).'],
    'Demand deposit': ['Money at a bank that can be withdrawn any time (vadesiz mevduat).', 'Bankada her an çekilebilen para (vadesiz mevduat).'],
    'Gram gold': ['One gram of gold, priced in TRY from the world gold price and USD/TRY.', 'Bir gram altın; dünya altın fiyatı ve USD/TRY kurundan TL olarak hesaplanır.'],
    'Benchmark': ['Something the fund is compared with, for example a deposit or the BIST 100.', 'Fonun karşılaştırıldığı ölçüt; örneğin mevduat veya BIST 100.'],
    'Percentile': ['Position in a range of outcomes: the 5th percentile is worse than 95% of simulated results.', 'Sonuçlar içindeki sıra: 5. yüzdelik dilim, simüle edilen sonuçların %95\'inden kötüdür.'],
    'Median': ['The middle outcome: half the results are better, half worse.', 'Ortanca sonuç: sonuçların yarısı daha iyi, yarısı daha kötüdür.'],
    'Simulation': ['Thousands of possible future paths built from the instruments\' own past daily moves.', 'Enstrümanların geçmiş günlük hareketlerinden üretilen binlerce olası gelecek senaryosu.'],
    'Bootstrap': ['A simulation method that reshuffles blocks of real past returns to create possible futures.', 'Gerçek geçmiş getiri bloklarını karıştırarak olası gelecekler üreten simülasyon yöntemi.'],
    'Stress test': ['The fund\'s value under a sharp, assumed market shock.', 'Varsayılan sert bir piyasa şokunda fonun değeri.'],
    'Beta': ['How strongly a share has moved with the market: 1 = like the market, 2 = twice as much.', 'Bir hissenin piyasayla ne kadar güçlü hareket ettiği: 1 = piyasa kadar, 2 = iki katı.'],
    'Liquidity': ['How easily a share can be bought or sold without moving its price; measured by daily trading value.', 'Bir hissenin fiyatı etkilemeden ne kadar kolay alınıp satılabildiği; günlük işlem hacmiyle ölçülür.'],
    'Low liquidity': ['Daily trading value below 50 million TRY: orders may fill at worse prices.', 'Günlük işlem hacmi 50 milyon TL\'nin altında: emirler daha kötü fiyatlardan gerçekleşebilir.'],
    'CPI': ['Consumer price index: the official measure of inflation.', 'Tüketici fiyat endeksi: enflasyonun resmî ölçüsü.'],
    'Real return': ['Return after inflation.', 'Enflasyondan arındırılmış getiri.'],
    'P/L': ['Profit or loss.', 'Kâr veya zarar.'], 'P/E': ['Price divided by earnings per share.', 'Fiyat / hisse başına kâr oranı.'], 'P/B': ['Price divided by book value per share.', 'Fiyat / hisse başına defter değeri.'],
    'Stop': ['A price at which a position is sold to limit the loss.', 'Zararı sınırlamak için pozisyonun satılacağı fiyat seviyesi.'],
    'Trailing stop': ['A stop that moves up as the price rises, locking in part of the gain.', 'Fiyat yükseldikçe yukarı taşınan ve kazancın bir kısmını koruyan zarar-kes seviyesi.'],
    'Target': ['The price or return a position is planned to reach.', 'Pozisyonun ulaşması planlanan fiyat veya getiri.'],
    'Tranche': ['One part of a purchase split into several dates.', 'Birkaç tarihe bölünmüş bir alımın her bir parçası.'],
    'EWMA': ['A volatility estimate that gives recent days more weight.', 'Yakın günlere daha fazla ağırlık veren oynaklık tahmini.'],
    'EVDS': ['The Central Bank of Türkiye\'s electronic data service.', 'Türkiye Cumhuriyet Merkez Bankası\'nın elektronik veri dağıtım sistemi.'],
    'KAP': ['Public Disclosure Platform where listed Turkish companies publish announcements.', 'Borsa şirketlerinin açıklamalarını yayımladığı Kamuyu Aydınlatma Platformu.'],
    'SPK': ['Capital Markets Board of Türkiye, the market regulator.', 'Sermaye Piyasası Kurulu, piyasa düzenleyicisi.'],
    'SEC': ['US Securities and Exchange Commission.', 'ABD Menkul Kıymetler ve Borsa Komisyonu.'],
    'ETF': ['Exchange-traded fund: a fund traded like a share.', 'Borsa yatırım fonu: hisse gibi alınıp satılan fon.'],
    'NAV': ['Net asset value per fund unit.', 'Fon payı başına net varlık değeri.'],
    'Hedge': ['A position meant to reduce a specific risk, for example USD against a lira fall.', 'Belirli bir riski azaltmaya yönelik pozisyon; örneğin TL düşüşüne karşı USD.'],
    'Alpha': ['Return above a benchmark: here, what the fund earned beyond the same money in a deposit on the same days, in percentage points.', 'Bir karşılaştırma ölçütünün üstündeki getiri: burada fonun, aynı paranın aynı günlerde mevduatta kazanacağından fazla kazandığı, puan olarak.'],
    'Sharpe ratio': ['Return above the deposit divided by volatility: how much extra return each unit of risk brought. Above 1 is very good, below 0 worse than the deposit.', 'Mevduatın üstündeki getirinin oynaklığa bölümü: her birim riskin ne kadar ek getiri getirdiği. 1’in üstü çok iyi, 0’ın altı mevduattan kötü.'],
    'VaR': ['Value at Risk: a loss that is exceeded only rarely — here in 1 month out of 20.', 'Riske Maruz Değer: yalnızca nadiren aşılan kayıp — burada 20 ayın 1’inde.'],
    'Expected shortfall': ['The average loss in the worst cases beyond the VaR: how bad the bad months are.', 'VaR’ın ötesindeki en kötü durumlardaki ortalama kayıp: kötü ayların ne kadar kötü olduğu.'],
    'Risk class': ['A 1–7 scale from volatility, as on European fund information sheets: 1 almost no swings, 7 very large swings.', 'Avrupa fon bilgi formlarındaki gibi oynaklığa göre 1–7 ölçeği: 1 neredeyse dalgalanma yok, 7 çok büyük dalgalanma.'],
    'Carry': ['The yearly rate built into a futures price over the spot price; above the deposit, a long position starts behind.', 'Vadeli fiyatın spot fiyata göre içerdiği yıllık faiz; mevduatın üstündeyse uzun pozisyon geriden başlar.'],
    'Roll': ['Closing a futures position before expiry and opening the next month’s contract; costs (or earns) the price difference.', 'Vadeli pozisyonu vade sonundan önce kapatıp bir sonraki ayın sözleşmesini açmak; fiyat farkı kadar maliyet (veya kazanç) doğurur.'],
    'Break-even': ['The price at which a position neither gains nor loses after costs.', 'Bir pozisyonun masraflar sonrası ne kazandırıp ne kaybettirdiği fiyat.'],
    'Risk contribution': ['The share of the fund’s total risk that comes from one item; can be much larger than its weight.', 'Fonun toplam riskinin bir kalemden gelen payı; ağırlığından çok daha büyük olabilir.'],
    'Rebalancing': ['Bringing the fund back to its target mix after prices have moved it away.', 'Fiyatlar fonu hedef dağılımdan uzaklaştırdıktan sonra hedefe geri getirmek.'],
    'Correlation': ['How much two prices move together, from −1 (opposite) to +1 (together).', 'İki fiyatın birlikte ne kadar hareket ettiği; −1 (zıt) ile +1 (birlikte) arası.'],
    'Commodity': ['A raw material traded worldwide — gold, silver, oil, copper, natural gas — priced in USD.', 'Dünyada işlem gören ham madde — altın, gümüş, petrol, bakır, doğalgaz — USD ile fiyatlanır.'],
    'Hit rate': ['How often the model pointed in the right direction; 50% is a coin toss.', 'Modelin ne sıklıkla doğru yönü gösterdiği; %50 yazı turadır.'],
    'Expected return': ['The model\'s average estimate; actual results can be much higher or lower.', 'Modelin ortalama tahmini; gerçek sonuçlar çok daha yüksek veya düşük olabilir.'],
  };
  const ALIASES = { 'ROI': [/\bROI\b/], 'BIST 100': [/BIST ?100|XU100/], 'BIST': [/\bBIST\b(?! ?100)/], 'VİOP': [/V[İI]OP/], 'P/L': [/\bP\/L\b/], 'P/E': [/\bP\/E\b/], 'P/B': [/\bP\/B\b/], 'CPI': [/\bCPI\b|TÜFE/], 'EWMA': [/\bEWMA\b/], 'NAV': [/\bNAV\b/], 'ETF': [/\bETFs?\b/], 'BYF': [/\bBYF\b/], 'TEFAS': [/TEFAS/], 'BSMV': [/BSMV/], 'Stopaj': [/stopaj/i], 'Withholding tax': [/withholding/i], 'TRY': [/\bTRY\b/], 'USD': [/\bUSD\b/], 'EVDS': [/EVDS/], 'KAP': [/\bKAP\b/], 'SPK': [/\bSPK\b/], 'SEC': [/\bSEC\b/],
    'Initial margin': [/initial margin|başlangıç teminat/i], 'Maintenance margin': [/maintenance margin|sürdürme teminat/i], 'Margin call': [/margin call|teminat tamamlama/i], 'Leverage': [/leverage|kaldıraç/i], 'Notional': [/notional|sözleşme değeri/i], 'Settlement price': [/settlement|uzlaşma/i], 'Basis': [/\bbasis\b|baz farkı/i], 'Underlying': [/underlying|dayanak/i], 'Expiry': [/expiry|vade sonu/i], 'Futures': [/futures|vadeli sözleşme|vadeli işlem/i],
    'Volatility': [/volatility|oynaklık/i], 'Max drawdown': [/max(imum)? drawdown|en büyük düşüş/i], 'Drawdown': [/(?<!max(imum)? )drawdown/i], 'Commission': [/commission|komisyon/i], 'Time deposit': [/time deposit|vadeli mevduat/i], 'Demand deposit': [/demand deposit|vadesiz/i], 'Gram gold': [/gram gold|gram altın/i], 'Benchmark': [/benchmark|karşılaştırma ölçüt/i],
    'Percentile': [/percentile|yüzdelik/i], 'Median': [/median|ortanca/i], 'Simulation': [/simulat|simülasyon/i], 'Bootstrap': [/bootstrap/i], 'Stress test': [/stress|stres/i], 'Beta': [/\bbeta\b/i], 'Low liquidity': [/low liquidity|düşük likidite/i], 'Liquidity': [/liquidity|likidite/i], 'Real return': [/real return|reel getiri|ROI, real/i],
    'Stop': [/\bstop\b/i], 'Trailing stop': [/trailing|iz süren/i], 'Target': [/\btarget\b|hedef/i], 'Tranche': [/tranche|dilim/i], 'Hedge': [/hedge|koruma/i], 'Expected return': [/expected|beklenen/i] };
  const TERM_TR = { 'Alpha': 'Alfa', 'Sharpe ratio': 'Sharpe oranı', 'VaR': 'Riske maruz değer (VaR)', 'Expected shortfall': 'Beklenen açık', 'Risk class': 'Risk sınıfı', 'Carry': 'Taşıma', 'Roll': 'Vade devri', 'Break-even': 'Başabaş', 'Risk contribution': 'Risk katkısı', 'Rebalancing': 'Yeniden dengeleme', 'Correlation': 'Korelasyon', 'Commodity': 'Emtia', 'Hit rate': 'İsabet oranı', 'Futures': 'Vadeli sözleşme', 'Initial margin': 'Başlangıç teminatı', 'Maintenance margin': 'Sürdürme teminatı', 'Margin call': 'Teminat tamamlama çağrısı', 'Leverage': 'Kaldıraç', 'Notional': 'Sözleşme değeri', 'Settlement price': 'Uzlaşma fiyatı', 'Basis': 'Baz farkı', 'Underlying': 'Dayanak varlık', 'Expiry': 'Vade sonu',
    'Volatility': 'Oynaklık (volatilite)', 'Drawdown': 'Düşüş', 'Max drawdown': 'En büyük düşüş', 'Withholding tax': 'Stopaj (kaynakta kesinti)', 'Commission': 'Komisyon', 'Time deposit': 'Vadeli mevduat', 'Demand deposit': 'Vadesiz mevduat', 'Gram gold': 'Gram altın', 'Benchmark': 'Karşılaştırma ölçütü', 'Percentile': 'Yüzdelik dilim', 'Median': 'Ortanca', 'Simulation': 'Simülasyon',
    'Stress test': 'Stres testi', 'Liquidity': 'Likidite', 'Low liquidity': 'Düşük likidite', 'Real return': 'Reel getiri', 'Stop': 'Zarar kes (stop)', 'Trailing stop': 'İz süren stop', 'Target': 'Hedef', 'Tranche': 'Dilim', 'Hedge': 'Koruma (hedge)', 'Expected return': 'Beklenen getiri', 'CPI': 'TÜFE (CPI)', 'P/L': 'Kâr / zarar (P/L)', 'P/E': 'F/K (P/E)', 'P/B': 'PD/DD (P/B)', 'ROI': 'Getiri (ROI)', 'USD': 'USD (ABD doları)', 'TRY': 'TL (TRY)' };
  // terms (and abbreviations) that occur in a text → [{term, text}] in the chosen language, alphabetical
  function glossaryFor(text, lang) {
    const t = String(text || ''), k = lang === 'tr' ? 1 : 0, out = [];
    for (const [term, def] of Object.entries(GLOSSARY)) { const pats = ALIASES[term] || [new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\b', 'i')]; if (pats.some(p => p.test(t))) out.push({ term: k && TERM_TR[term] ? TERM_TR[term] : term, text: def[k] }); }
    return out.sort((a, b) => a.term.localeCompare(b.term, lang === 'tr' ? 'tr' : 'en'));
  }
  function glossaryAll(lang) { const k = lang === 'tr' ? 1 : 0; return Object.entries(GLOSSARY).map(([term, d]) => ({ term: k && TERM_TR[term] ? TERM_TR[term] : term, text: d[k] })).sort((a, b) => a.term.localeCompare(b.term, lang === 'tr' ? 'tr' : 'en')); }


  /* ---------------- reports: plain words, no app name, glossary at the back ---------------- */
  const INTRO = {
    'The fund at a glance': ['In plain words: what went into the fund, what it is worth now and how it compares with a deposit.', 'Kısaca: fona ne kadar para girdiği, bugün ne kadar ettiği ve mevduatla nasıl karşılaştırıldığı.'],
    'Where the money is': ['In plain words: how the money is split across holdings, sectors and markets.', 'Kısaca: paranın varlıklar, sektörler ve piyasalar arasında nasıl dağıldığı.'],
    'Why this fund': ['In plain words: the reasons the fund was built this way.', 'Kısaca: fonun neden bu şekilde kurulduğu.'],
    'Exit plan — when and why': ['In plain words: when each holding is planned to be sold, and what would make it sell earlier (a target reached or a loss limit hit).', 'Kısaca: her varlığın ne zaman satılmasının planlandığı ve neyin daha erken satışa yol açacağı (hedefe ulaşmak veya zarar sınırına değmek).'],
    'Exit plan': ['In plain words: when the position is planned to be sold and what would make it sell earlier.', 'Kısaca: pozisyonun ne zaman satılmasının planlandığı ve neyin daha erken satışa yol açacağı.'],
    'Risk factors': ['In plain words: the main things that could make this lose money.', 'Kısaca: bunun para kaybettirmesine yol açabilecek başlıca etkenler.'],
    'Holdings': ['In plain words: what you own today and how much each holding has gained or lost.', 'Kısaca: bugün sahip olduklarınız ve her birinin ne kadar kazandırdığı veya kaybettirdiği.'],
    'Positions': ['In plain words: what you own today and how much each position has gained or lost.', 'Kısaca: bugün sahip olduklarınız ve her pozisyonun ne kadar kazandırdığı veya kaybettirdiği.'],
    'Packages': ['In plain words: each fund with the money put in, its value today and its target.', 'Kısaca: her fon için yatırılan para, bugünkü değer ve hedef.'],
    'Alerts': ['In plain words: things that need your attention now.', 'Kısaca: şu anda ilgilenmeniz gereken konular.'],
    'Proposed actions': ['In plain words: buys and sells the rules suggest. They are model output, not investment advice.', 'Kısaca: kuralların önerdiği alım ve satımlar. Bunlar model çıktısıdır, yatırım tavsiyesi değildir.'],
    'Spans': ['In plain words: the expected result after costs and tax for different holding periods, next to a deposit.', 'Kısaca: farklı tutma süreleri için maliyet ve vergi sonrası beklenen sonuç ve mevduatla karşılaştırması.'],
    'Factor groups (percentile within peers)': ['In plain words: how the share ranks against similar shares on each trait; 100 is the best, 50 is average.', 'Kısaca: hissenin benzer hisseler arasında her özellikte nerede durduğu; 100 en iyi, 50 ortalama.'],
    'Profile': ['In plain words: what the company does and its key figures.', 'Kısaca: şirketin ne iş yaptığı ve temel rakamları.'],
    'Markets': ['In plain words: how the main markets and currencies moved in the period.', 'Kısaca: dönem içinde başlıca piyasaların ve kurların nasıl hareket ettiği.'],
    'Appendix A — Span analysis': ['In plain words: the detail behind the expected results for each holding period.', 'Kısaca: her tutma süresi için beklenen sonuçların ayrıntısı.'],
    'Appendix B — Costs and taxes': ['In plain words: what buying, selling and taxes cost.', 'Kısaca: alım, satım ve vergilerin maliyeti.'],
    'Appendix C — Methodology and sources': ['In plain words: how the numbers are calculated and where the data comes from.', 'Kısaca: rakamların nasıl hesaplandığı ve verilerin nereden geldiği.'],
    'Cost schedule applied': ['In plain words: the fees and taxes used in the calculations.', 'Kısaca: hesaplarda kullanılan ücretler ve vergiler.'],
    'Tax summary': ['In plain words: the tax on your gains, by type of holding.', 'Kısaca: kazançlarınızın varlık türüne göre vergisi.'],
    'Consensus (latest rating per broker, 180 days)': ['In plain words: what brokers currently recommend and their average price target.', 'Kısaca: aracı kurumların güncel önerileri ve ortalama hedef fiyatları.'],
    'Rating changes': ['In plain words: brokers that changed their recommendation in the period.', 'Kısaca: dönem içinde önerisini değiştiren aracı kurumlar.'],
    'Largest target revisions in the period': ['In plain words: the biggest changes in broker price targets.', 'Kısaca: aracı kurum hedef fiyatlarındaki en büyük değişiklikler.'],
    'Consolidated takeaways': ['In plain words: the main points from the period’s broker research.', 'Kısaca: dönemin aracı kurum raporlarından çıkan ana noktalar.'],
    'Editors’ picks': ['In plain words: research items chosen as most relevant.', 'Kısaca: en ilgili bulunan araştırma notları.'],
    'Company notes': ['In plain words: short notes on individual companies.', 'Kısaca: tek tek şirketlere ilişkin kısa notlar.'],
    'Broker macro views': ['In plain words: what brokers expect for the economy, rates and currency.', 'Kısaca: aracı kurumların ekonomi, faiz ve kur beklentileri.'],
    'Research published (İş Yatırım feed)': ['In plain words: the research reports published in the period.', 'Kısaca: dönem içinde yayımlanan araştırma raporları.'],
  };
  const deName = s => String(s)
    .replace(/GNC Terminal(?:’s|'s)? rule set/g, 'Rule set').replace(/GNC Terminal Research/g, 'Personal research').replace(/GNC Terminal from /g, 'Data from ')
    .replace(/\bin GNC Terminal\b/g, 'in the app').replace(/\bGNC Terminal\b/g, 'the app');
  function walk(v, fn) { if (typeof v === 'string') return fn(v); if (Array.isArray(v)) return v.map(x => walk(x, fn)); if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = walk(x, fn); return o; } return v; }
  function textOf(v, out = []) { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(x => textOf(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach(x => textOf(x, out)); return out; }
  function prepareModel(model, lang) {
    if (!model || model.__dlx) return model; const tr = lang === 'tr';
    const m = walk(model, s => /GNC Terminal/.test(s) ? deName(s) : s);
    if (/^\s*(the app)?\s*$/i.test(m.title || '')) { m.title = m.subtitle || 'Report'; m.subtitle = m.kicker || ''; }
    if (!m.preparedBy) m.preparedBy = tr ? 'Kişisel araştırma' : 'Personal research';
    const blocks = [];
    for (const b of m.blocks || []) { blocks.push(b); if (b && b.type === 'h' && INTRO[b.text]) blocks.push({ type: 'p', text: INTRO[b.text][tr ? 1 : 0], dlxIntro: true }); }
    const terms = glossaryFor(textOf({ t: m.title, s: m.subtitle, k: m.kicker, b: blocks }).join('\n'), lang);
    if (terms.length) blocks.push({ type: 'h', text: tr ? 'Terimler ve kısaltmalar' : 'Terms and abbreviations', num: false }, { type: 'p', text: tr ? 'Bu raporda geçen terimlerin kısa açıklamaları.' : 'Short explanations of the terms used in this report.' }, { type: 'list', items: terms.map(g => `${g.term}: ${g.text}`) });
    m.blocks = blocks; m.__dlx = true; return m;
  }
  return { r2, dayN, daysBetween, addDays, newId, depositInterest, replay, maturities, viopExpiries, dueSoon, lineQtyAt, realizedAt, priceOn, valueSeries, fundStart, investedAt, seriesStats, txList, txText, benchmarks, SCENARIOS, stress, viopRisk, erf, GLOSSARY, TERM_TR, glossaryFor, glossaryAll, prepareModel, INTRO };
})();
if (typeof module !== 'undefined') module.exports = DELUXE;
/*</DELUXE>*/
