/* ---------- VIZ: SVG chart primitives (no dependencies) ----------
   priceChart · donut · hbars · radar · heatGrid · timeline · compare · fan
   Colours come from CSS variables so every look/theme works; everything redraws on resize. */
const VIZ = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--up)', 'var(--warn)', 'var(--fg2)', 'var(--down)', 'var(--muted)'];
  const fmtN = (v, d = 2) => v === null || v === undefined || !isFinite(v) ? '—' : (+v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtBig = v => !isFinite(v) ? '—' : Math.abs(v) >= 1e9 ? (v / 1e9).toFixed(1) + ' bn' : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + ' m' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(0) + ' k' : String(Math.round(v));
  const widthOf = el => Math.max(300, Math.round(el.getBoundingClientRect().width) || (el.parentElement && el.parentElement.clientWidth) || 640);
  const sma = (c, n) => c.map((_, i) => i + 1 >= n ? c.slice(i + 1 - n, i + 1).reduce((a, b) => a + b, 0) / n : null);
  const niceTicks = (mn, mx, k = 5) => { if (!(mx > mn)) return [mn]; const span = mx - mn, raw = span / k, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, step = (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * p, out = []; for (let v = Math.ceil(mn / step) * step; v <= mx + 1e-9; v += step) out.push(+v.toFixed(10)); return out; };
  const resizeHook = (el, fn) => { if (el.__ro) el.__ro.disconnect(); if (typeof ResizeObserver !== 'undefined') { let w = widthOf(el); el.__ro = new ResizeObserver(() => { const nw = widthOf(el); if (Math.abs(nw - w) > 8) { w = nw; fn(); } }); el.__ro.observe(el); } };
  const tipEl = el => { let t = el.querySelector('.tip'); if (!t) { t = document.createElement('div'); t.className = 'tip'; t.hidden = true; el.appendChild(t); } return t; };
  const placeTip = (tip, el, cx, cy) => { tip.hidden = false; const w = el.clientWidth; tip.style.left = Math.max(0, Math.min(cx + 14, w - tip.offsetWidth - 4)) + 'px'; tip.style.top = Math.max(0, cy - 10) + 'px'; };

  /* ---- price chart: candles or line, SMA 50/200, levels, regime shading, volume, events, crosshair, drag-zoom, range buttons ---- */
  function priceChart(el, o) {
    const bars = (o.bars || []).filter(r => r && +r[1] > 0); if (bars.length < 5) { el.innerHTML = '<div class="empty">Not enough price history to draw a chart.</div>'; return; }
    const st = el.__pc || (el.__pc = { range: o.range || '1Y', mode: o.mode || (bars.some(r => r[2] != null) ? 'candle' : 'line'), log: false, zoom: null });
    const RANGES = [['3M', 63], ['6M', 126], ['1Y', 252], ['3Y', 756], ['5Y', 1260], ['MAX', 1e9]];
    el.classList.add('chart-wrap', 'pc');
    const closesAll = bars.map(r => +r[1]), s200 = sma(closesAll, 200), s50 = sma(closesAll, 50);
    const draw = () => {
      const n0 = RANGES.find(r => r[0] === st.range)?.[1] || 252; let i0 = Math.max(0, bars.length - n0), i1 = bars.length; if (st.zoom) { i0 = st.zoom[0]; i1 = st.zoom[1]; }
      const B = bars.slice(i0, i1), N = B.length, W = widthOf(el), H = o.height || 300, L = 8, R = 62, T = 10, VH = o.volume === false || !B.some(r => +r[4] > 0) ? 0 : 46, XB = 20, PH = H - T - VH - XB - (VH ? 6 : 0);
      const c = B.map(r => +r[1]), hi = B.map(r => r[2] != null && +r[2] > 0 ? +r[2] : +r[1]), lo = B.map(r => r[3] != null && +r[3] > 0 ? +r[3] : +r[1]), vol = B.map(r => +r[4] > 0 ? +r[4] : 0), dates = B.map(r => r[0]);
      const S200 = s200.slice(i0, i1), S50 = s50.slice(i0, i1), lv = (o.levels || []).filter(l => isFinite(l.value));
      let mn = Math.min(...lo, ...lv.map(l => l.value), ...S200.filter(v => v !== null)), mx = Math.max(...hi, ...lv.map(l => l.value), ...S200.filter(v => v !== null)); if (!(mx > mn)) { mn *= .95; mx *= 1.05; } const pad = (mx - mn) * 0.04; mn -= pad; mx += pad;
      const tr = v => st.log ? Math.log(Math.max(v, 1e-9)) : v, mnT = tr(mn), mxT = tr(mx);
      const xw = (W - L - R) / N, sx = i => L + i * xw + xw / 2, sy = v => T + PH - ((tr(v) - mnT) / (mxT - mnT || 1)) * PH, vmax = Math.max(1, ...vol), vy = v => T + PH + 6 + VH - (v / vmax) * VH;
      let g = '';
      // regime shading: below the 200-day line (Faber proxy)
      if (o.regime !== false && S200.some(v => v !== null)) { let run = null; for (let i = 0; i <= N; i++) { const below = i < N && S200[i] !== null && c[i] < S200[i]; if (below && run === null) run = i; if ((!below || i === N) && run !== null) { g += `<rect x="${(L + run * xw).toFixed(1)}" y="${T}" width="${((i - run) * xw).toFixed(1)}" height="${PH}" fill="var(--down)" opacity=".07"/>`; run = null; } } }
      // y grid
      for (const v of niceTicks(mn, mx, 5)) { const y = sy(v); if (y < T || y > T + PH) continue; g += `<line class="ax" x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke-dasharray="2 3"/><text x="${W - R + 6}" y="${(y + 3.5).toFixed(1)}">${esc((o.fmt || fmtN)(v))}</text>`; }
      // x labels: month boundaries
      let lastM = ''; for (let i = 0; i < N; i++) { const m = dates[i].slice(0, 7); if (m !== lastM) { lastM = m; if (N > 400 ? dates[i].slice(5, 7) === '01' : N > 160 ? ['01', '04', '07', '10'].includes(dates[i].slice(5, 7)) : true) { const x = sx(i); g += `<line class="ax" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - XB + 4}" opacity=".5"/><text x="${(x + 3).toFixed(1)}" y="${H - 6}">${N > 160 ? dates[i].slice(0, 4) + (N > 400 ? '' : '-' + dates[i].slice(5, 7)) : dates[i].slice(5, 7)}</text>`; } } }
      // volume
      if (VH) for (let i = 0; i < N; i++) if (vol[i]) g += `<rect x="${(L + i * xw + xw * 0.15).toFixed(1)}" y="${vy(vol[i]).toFixed(1)}" width="${Math.max(0.6, xw * 0.7).toFixed(1)}" height="${(T + PH + 6 + VH - vy(vol[i])).toFixed(1)}" fill="${c[i] >= (c[i - 1] ?? c[i]) ? 'var(--up)' : 'var(--down)'}" opacity=".45"/>`;
      // SMA lines
      const path = (arr, stroke, w, dash) => { let d = ''; for (let i = 0; i < N; i++) if (arr[i] !== null && isFinite(arr[i])) d += (d ? 'L' : 'M') + sx(i).toFixed(1) + ',' + sy(arr[i]).toFixed(1); return d ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>` : ''; };
      if (o.sma50 !== false) g += path(S50, 'var(--c2)', 1, '3 3'); if (o.sma200 !== false) g += path(S200, 'var(--c3)', 1.3);
      // price
      if (st.mode === 'candle' && xw >= 2.2) { for (let i = 0; i < N; i++) { const op = i ? c[i - 1] : c[i], up = c[i] >= op, col = up ? 'var(--up)' : 'var(--down)', x = sx(i), y1 = sy(Math.max(op, c[i])), y2 = sy(Math.min(op, c[i])); g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${sy(hi[i]).toFixed(1)}" y2="${sy(lo[i]).toFixed(1)}" stroke="${col}" stroke-width="1"/><rect x="${(x - xw * 0.33).toFixed(1)}" y="${y1.toFixed(1)}" width="${(xw * 0.66).toFixed(1)}" height="${Math.max(1, y2 - y1).toFixed(1)}" fill="${up ? 'var(--panel)' : col}" stroke="${col}" stroke-width="1"/>`; } }
      else { g += path(c, 'var(--c1)', 1.8); if (N > 1) { const d0 = 'M' + sx(0).toFixed(1) + ',' + sy(c[0]).toFixed(1) + c.map((v, i) => 'L' + sx(i).toFixed(1) + ',' + sy(v).toFixed(1)).join('') + `L${sx(N - 1).toFixed(1)},${T + PH}L${sx(0).toFixed(1)},${T + PH}Z`; g = `<path d="${d0}" fill="var(--c1)" opacity=".06"/>` + g; } }
      // levels (stop, trail, target, entry)
      for (const l of lv) { const y = sy(l.value); if (y < T || y > T + PH) continue; const col = l.kind === 'stop' || l.kind === 'trail' ? 'var(--down)' : l.kind === 'target' ? 'var(--up)' : 'var(--fg2)'; g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="1" stroke-dasharray="${l.kind === 'trail' ? '6 3' : '2 2'}"/><text x="${L + 4}" y="${(y - 3).toFixed(1)}" fill="${col}" style="fill:${col}">${esc(l.label)} ${esc((o.fmt || fmtN)(l.value))}</text>`; }
      // events
      const ev = (o.events || []).filter(e => e.date >= dates[0] && e.date <= dates[N - 1]); for (const e of ev) { let i = dates.findIndex(d => d >= e.date); if (i < 0) continue; const x = sx(i); g += `<g class="ev" data-i="${i}"><line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${T + PH}" stroke="var(--warn)" stroke-dasharray="1 3" opacity=".8"/><rect x="${(x - 7).toFixed(1)}" y="${T + PH - 14}" width="14" height="14" rx="2" fill="var(--panel)" stroke="var(--warn)"/><text x="${x.toFixed(1)}" y="${T + PH - 3.5}" text-anchor="middle" style="fill:var(--warn);font-size:9px">${esc((e.kind || e.label || '?')[0].toUpperCase())}</text></g>`; }
      const last = c[N - 1], ly = sy(last); g += `<rect x="${W - R + 2}" y="${(ly - 8).toFixed(1)}" width="${R - 4}" height="15" rx="2" fill="var(--fg)"/><text x="${W - R + 6}" y="${(ly + 3.5).toFixed(1)}" style="fill:var(--bg);font-weight:600">${esc((o.fmt || fmtN)(last))}</text>`;
      g += `<line id="pc-xh" class="ax" y1="${T}" y2="${H - XB}" x1="0" x2="0" visibility="hidden" stroke="var(--fg2)"/><rect id="pc-sel" x="0" y="${T}" width="0" height="${PH}" fill="var(--accent)" opacity=".15" visibility="hidden"/>`;
      const tools = `<div class="pc-tools row-inline"><span class="seg">${RANGES.map(r => `<button data-r="${r[0]}" class="${st.range === r[0] && !st.zoom ? 'active' : ''}">${r[0]}</button>`).join('')}</span><span class="seg"><button data-m="line" class="${st.mode === 'line' ? 'active' : ''}">Line</button><button data-m="candle" class="${st.mode === 'candle' ? 'active' : ''}">Candles</button></span><button class="quiet" data-log>${st.log ? 'log' : 'lin'}</button>${st.zoom ? '<button class="quiet" data-reset>Reset zoom</button>' : ''}<span class="hint pc-legend"><i style="background:var(--c2)"></i>50d <i style="background:var(--c3)"></i>200d${lv.length ? ' · dashed: ' + lv.map(l => l.label).join(', ') : ''}${o.regime !== false ? ' · shaded: below 200d (Faber)' : ''}${ev.length ? ' · markers: ' + [...new Set(ev.map(e => e.kind || e.label))].join(', ') : ''}</span></div>`;
      el.innerHTML = tools + `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px"></svg>`; const svg = el.querySelector('svg'); svg.innerHTML = g; const tip = tipEl(el);
      el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { st.range = b.dataset.r; st.zoom = null; draw(); }); el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { st.mode = b.dataset.m; draw(); });
      el.querySelector('[data-log]').onclick = () => { st.log = !st.log; draw(); }; const rs = el.querySelector('[data-reset]'); if (rs) rs.onclick = () => { st.zoom = null; draw(); };
      const xh = svg.querySelector('#pc-xh'), sel = svg.querySelector('#pc-sel'); let drag = null;
      const idxAt = ev => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(N - 1, Math.floor(((ev.clientX - r.left) / r.width * W - L) / xw))); };
      svg.onmousemove = ev => { const i = idxAt(ev), x = sx(i); xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('visibility', 'visible'); const op = i ? c[i - 1] : c[i], chg = (c[i] / op - 1) * 100, evs = ev.shiftKey ? [] : (o.events || []).filter(e => e.date === dates[i]);
        tip.innerHTML = `<b>${esc(dates[i])}</b> · ${esc((o.fmt || fmtN)(c[i]))} <span class="${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>${B[i][2] != null ? `<br>H ${esc((o.fmt || fmtN)(hi[i]))} · L ${esc((o.fmt || fmtN)(lo[i]))}` : ''}${vol[i] ? ` · vol ${fmtBig(vol[i])}` : ''}${S200[i] !== null ? `<br>50d ${esc((o.fmt || fmtN)(S50[i]))} · 200d ${esc((o.fmt || fmtN)(S200[i]))} (${((c[i] / S200[i] - 1) * 100).toFixed(1)}%)` : ''}${evs.map(e => `<br><span class="warn">${esc(e.label || e.kind)}</span>`).join('')}`;
        const r = el.getBoundingClientRect(); placeTip(tip, el, ev.clientX - r.left, ev.clientY - r.top); if (drag !== null) { const a = Math.min(drag, i), b = Math.max(drag, i); sel.setAttribute('x', L + a * xw); sel.setAttribute('width', (b - a + 1) * xw); sel.setAttribute('visibility', 'visible'); } };
      svg.onmouseleave = () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); }; svg.onmousedown = ev => { drag = idxAt(ev); ev.preventDefault(); };
      svg.onmouseup = ev => { if (drag === null) return; const i = idxAt(ev), a = Math.min(drag, i), b = Math.max(drag, i); drag = null; sel.setAttribute('visibility', 'hidden'); if (b - a >= 5) { st.zoom = [i0 + a, i0 + b + 1]; draw(); } }; svg.ondblclick = () => { st.zoom = null; draw(); };
    };
    draw(); resizeHook(el, draw); return { redraw: draw };
  }

  /* ---- donut with legend ---- */
  function donut(el, items, o = {}) {
    const its = (items || []).filter(i => i.value > 0).sort((a, b) => b.value - a.value), tot = its.reduce((a, i) => a + i.value, 0); if (!tot) { el.innerHTML = '<div class="empty">Nothing to show.</div>'; return; }
    const size = o.size || 150, r = size / 2 - 6, ri = r * 0.62, cx = size / 2, cy = size / 2; let a0 = -Math.PI / 2, paths = '';
    its.forEach((it, k) => { const a1 = a0 + (it.value / tot) * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = (a, rr) => `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`; const a1e = it.value === tot ? a1 - 1e-4 : a1;
      paths += `<path d="M${p(a0, r)}A${r},${r},0,${big},1,${p(a1e, r)}L${p(a1e, ri)}A${ri},${ri},0,${big},0,${p(a0, ri)}Z" fill="${it.color || PAL[k % PAL.length]}" stroke="var(--panel)" stroke-width="1.5"><title>${esc(it.label)} · ${(it.value / tot * 100).toFixed(1)}%</title></path>`; a0 = a1; });
    el.innerHTML = `<div class="donut"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${paths}<text x="${cx}" y="${cy - 4}" text-anchor="middle" style="font-size:12px;fill:var(--muted)">${esc(o.centerLabel || '')}</text><text x="${cx}" y="${cy + 12}" text-anchor="middle" style="font-size:14px;font-weight:600;fill:var(--fg)">${esc(o.center || '')}</text></svg><div class="legend">${its.slice(0, o.max || 10).map((it, k) => `<div><i style="background:${it.color || PAL[k % PAL.length]}"></i><span class="txt">${esc(it.label)}</span><span class="mono">${(it.value / tot * 100).toFixed(it.value / tot < 0.1 ? 1 : 0)}%</span></div>`).join('')}${its.length > (o.max || 10) ? `<div class="dim">+${its.length - (o.max || 10)} more</div>` : ''}</div></div>`;
  }

  /* ---- horizontal comparison bars (e.g. deposit vs USD vs fund) ---- */
  function hbars(el, items, o = {}) {
    const its = items || [], mx = Math.max(...its.map(i => Math.abs(i.value) || 0), o.base || 0, 1e-9) * 1.25, base = o.base || 0, clip = v => Math.max(0, Math.min(mx, v));
    el.innerHTML = `<div class="hbars">${its.map((it, k) => { const w = Math.max(0, Math.abs(it.value) / mx * 100); return `<div class="hb"><span class="txt lbl">${esc(it.label)}</span><span class="track">${it.lo != null && it.hi != null ? `<i class="range" style="left:${(clip(it.lo) / mx * 100).toFixed(1)}%;width:${((clip(it.hi) - clip(it.lo)) / mx * 100).toFixed(1)}%" title="worst ${esc(fmtN(it.lo, 0))} · best ${esc(fmtN(it.hi, 0))}${it.hi > mx ? ' (bar clipped)' : ''}"></i>` : ''}<i style="width:${w.toFixed(1)}%;background:${it.color || PAL[k % PAL.length]}"></i>${base ? `<b style="left:${(base / mx * 100).toFixed(1)}%"></b>` : ''}</span><span class="mono val">${esc(it.text || fmtN(it.value, 0))}${it.sub ? `<small class="dim"> ${esc(it.sub)}</small>` : ''}</span></div>`; }).join('')}${o.note ? `<div class="hint">${esc(o.note)}</div>` : ''}</div>`;
  }

  /* ---- radar (factor pentagon); values 0–100; optional reference polygon ---- */
  function radar(el, axes, o = {}) {
    const n = axes.length, size = o.size || 200, PADX = 78, Wd = size + 2 * PADX, cx = Wd / 2, cy = size / 2, R = size / 2 - 26; if (n < 3) { el.innerHTML = ''; return; }
    const pt = (k, v) => { const a = -Math.PI / 2 + k * 2 * Math.PI / n, rr = R * Math.max(0, Math.min(100, v ?? 0)) / 100; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; };
    let g = ''; for (const lv of [25, 50, 75, 100]) g += `<polygon points="${axes.map((_, k) => pt(k, lv)).join(' ')}" fill="none" stroke="var(--rule)" stroke-width="${lv === 100 ? 1 : 0.6}"/>`;
    axes.forEach((a, k) => { const ang = -Math.PI / 2 + k * 2 * Math.PI / n, lx = cx + (R + 16) * Math.cos(ang), ly = cy + (R + 16) * Math.sin(ang); g += `<line x1="${cx}" y1="${cy}" x2="${pt(k, 100).split(',')[0]}" y2="${pt(k, 100).split(',')[1]}" stroke="var(--rule)" stroke-width=".6"/><text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${Math.abs(Math.cos(ang)) < 0.2 ? 'middle' : Math.cos(ang) > 0 ? 'start' : 'end'}" style="font-size:10.5px;fill:var(--fg2)">${esc(a.label)}${a.value != null ? ` <tspan style="fill:var(--muted)">${Math.round(a.value)}</tspan>` : ''}</text>`; });
    if (o.ref) g += `<polygon points="${o.ref.map((v, k) => pt(k, v)).join(' ')}" fill="var(--fg2)" opacity=".12" stroke="var(--fg2)" stroke-dasharray="3 3" stroke-width="1"/>`;
    (o.series || [{ values: axes.map(a => a.value), color: 'var(--accent)' }]).forEach((s, j) => { g += `<polygon points="${s.values.map((v, k) => pt(k, v)).join(' ')}" fill="${s.color || PAL[j]}" opacity=".22" stroke="${s.color || PAL[j]}" stroke-width="1.6"/>` + s.values.map((v, k) => `<circle cx="${pt(k, v).split(',')[0]}" cy="${pt(k, v).split(',')[1]}" r="2.5" fill="${s.color || PAL[j]}"/>`).join(''); });
    el.innerHTML = `<svg class="radar" viewBox="0 0 ${Wd} ${size}" style="width:${Wd}px;max-width:100%;height:auto">${g}</svg>${o.legend ? `<div class="legend">${o.legend.map((l, j) => `<div><i style="background:${l.color || PAL[j]}"></i>${esc(l.label)}</div>`).join('')}${o.ref ? '<div><i style="background:var(--fg2);opacity:.4"></i>universe median</div>' : ''}</div>` : ''}`;
  }

  /* ---- heat grid: rows × dates, each cell ok/partial/fail/none ---- */
  function heatGrid(el, rows, dates, o = {}) {
    const CL = { ok: 'var(--up)', partial: 'var(--warn)', fail: 'var(--down)' };
    el.innerHTML = `<div class="heat" style="grid-template-columns:minmax(120px,auto) repeat(${dates.length},minmax(9px,1fr))"><span></span>${dates.map((d, i) => `<span class="hd">${i % 5 === 0 || i === dates.length - 1 ? d.slice(8) : ''}</span>`).join('')}${rows.map(r => `<span class="txt lbl" title="${esc(r.title || r.label)}">${esc(r.label)}</span>${dates.map(d => { const s = r.cells[d]; return `<i style="background:${CL[s] || 'var(--panel2)'}" title="${esc(d)} · ${esc(r.label)} · ${esc(s || 'no run')}"></i>`; }).join('')}`).join('')}</div>${o.note ? `<div class="hint" style="margin-top:4px">${esc(o.note)}</div>` : ''}`;
  }

  /* ---- timeline: items on a horizontal date axis, lanes by category ---- */
  function timeline(el, items, o = {}) {
    const its = (items || []).filter(i => i.date).sort((a, b) => a.date < b.date ? -1 : 1); if (!its.length) { el.innerHTML = '<div class="empty">Nothing in this period.</div>'; return; }
    const W = widthOf(el), lanes = [...new Set(its.map(i => i.lane || 'other'))], LH = 34, L = 92, R = 14, T = 22, H = T + lanes.length * LH + 18;
    const d0 = new Date(o.from || its[0].date), d1 = new Date(o.to || its[its.length - 1].date); const span = Math.max(1, (d1 - d0) / 864e5);
    const sx = d => L + ((new Date(d) - d0) / 864e5) / span * (W - L - R);
    let g = ''; const step = span > 120 ? 30 : span > 40 ? 7 : 1; for (let d = new Date(d0); d <= d1; d = new Date(d.getTime() + step * 864e5)) { const x = sx(d); g += `<line class="ax" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T - 4}" y2="${H - 16}" opacity=".6"/><text x="${(x + 2).toFixed(1)}" y="${H - 4}">${d.toISOString().slice(5, 10)}</text>`; }
    lanes.forEach((ln, k) => { const y = T + k * LH + LH / 2; g += `<text x="4" y="${(y + 3.5).toFixed(1)}" style="fill:var(--fg2);font-size:11px">${esc(o.laneLabels && o.laneLabels[ln] || ln)}</text><line class="ax" x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
    const byDay = {}; its.forEach((it, idx) => { const k = (it.lane || 'other') + '|' + it.date; byDay[k] = (byDay[k] || 0) + 1; it.__k = byDay[k] - 1; it.__idx = idx; });
    for (const it of its) { const y = T + lanes.indexOf(it.lane || 'other') * LH + LH / 2 - Math.min(it.__k, 2) * 7, x = sx(it.date), col = it.color || (it.level === 'warn' ? 'var(--warn)' : it.level === 'good' ? 'var(--up)' : it.level === 'bad' ? 'var(--down)' : 'var(--c1)'); g += `<g class="tl-it" data-i="${it.__idx}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${it.size || 6}" fill="${col}" opacity=".85" stroke="var(--panel)" stroke-width="1.5"/>${it.mark ? `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" style="fill:var(--bg);font-size:8px;font-weight:700">${esc(it.mark)}</text>` : ''}</g>`; }
    el.classList.add('chart-wrap'); el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px">${g}</svg>`; const svg = el.querySelector('svg'), tip = tipEl(el);
    svg.querySelectorAll('.tl-it').forEach(n => { const it = its[+n.dataset.i]; n.onmouseenter = ev => { tip.innerHTML = `<b>${esc(it.date)}</b> · ${esc(it.tag || it.lane || '')}<br><span class="txt" style="white-space:normal;display:block;max-width:320px">${esc(it.title)}</span>${it.sub ? `<span class="dim txt" style="white-space:normal;display:block;max-width:320px">${esc(it.sub)}</span>` : ''}`; const r = el.getBoundingClientRect(); placeTip(tip, el, ev.clientX - r.left, ev.clientY - r.top); }; n.onmouseleave = () => tip.hidden = true; n.onclick = () => { if (o.onClick) o.onClick(it); else if (it.link) window.open(it.link, '_blank', 'noopener'); }; });
    resizeHook(el, () => timeline(el, items, o));
  }

  /* ---- compare: several series rebased to 100 ---- */
  function compare(el, series, o = {}) {
    const S = (series || []).filter(s => s.dates && s.dates.length > 2); if (!S.length) { el.innerHTML = '<div class="empty">Pin two or more instruments to compare.</div>'; return; }
    const from = o.from || S.map(s => s.dates[Math.max(0, s.dates.length - (o.n || 252))]).sort().pop(); const dates = [...new Set(S.flatMap(s => s.dates.filter(d => d >= from)))].sort(); const N = dates.length; if (N < 3) { el.innerHTML = '<div class="empty">Not enough overlapping history.</div>'; return; }
    const reb = S.map(s => { const m = new Map(s.dates.map((d, i) => [d, s.values[i]])); let base = null, last = null; return dates.map(d => { const v = m.has(d) ? m.get(d) : last; if (v == null) return null; last = v; if (base === null) base = v; return v / base * 100; }); });
    const W = widthOf(el), H = o.height || 260, L = 8, R = 52, T = 10, XB = 20, PH = H - T - XB, all = reb.flat().filter(v => v !== null); let mn = Math.min(...all), mx = Math.max(...all); const pad = (mx - mn) * .05; mn -= pad; mx += pad;
    const sx = i => L + i * ((W - L - R) / (N - 1)), sy = v => T + PH - ((v - mn) / (mx - mn || 1)) * PH; let g = '';
    for (const v of niceTicks(mn, mx, 5)) { const y = sy(v); g += `<line class="ax" x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke-dasharray="2 3"/><text x="${W - R + 6}" y="${(y + 3.5).toFixed(1)}">${v.toFixed(0)}</text>`; }
    g += `<line x1="${L}" x2="${W - R}" y1="${sy(100).toFixed(1)}" y2="${sy(100).toFixed(1)}" stroke="var(--fg2)" stroke-width=".8"/>`;
    let lastM = ''; for (let i = 0; i < N; i++) { const m = dates[i].slice(0, 7); if (m !== lastM) { lastM = m; if (N > 160 ? ['01', '04', '07', '10'].includes(dates[i].slice(5, 7)) : true) g += `<text x="${(sx(i) + 3).toFixed(1)}" y="${H - 6}">${N > 160 ? dates[i].slice(0, 7) : dates[i].slice(5, 7)}</text>`; } }
    reb.forEach((arr, j) => { let d = ''; arr.forEach((v, i) => { if (v !== null) d += (d ? 'L' : 'M') + sx(i).toFixed(1) + ',' + sy(v).toFixed(1); }); g += `<path d="${d}" fill="none" stroke="${S[j].color || PAL[j % PAL.length]}" stroke-width="1.8"/>`; const lv = [...arr].reverse().find(v => v !== null); if (lv != null) g += `<text x="${W - R + 6}" y="${(sy(lv) + 3.5).toFixed(1)}" style="fill:${S[j].color || PAL[j % PAL.length]};font-weight:600">${lv.toFixed(0)}</text>`; });
    g += `<line id="cp-xh" class="ax" y1="${T}" y2="${H - XB}" x1="0" x2="0" visibility="hidden" stroke="var(--fg2)"/>`;
    el.classList.add('chart-wrap'); el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px">${g}</svg><div class="legend">${S.map((s, j) => `<div><i style="background:${s.color || PAL[j % PAL.length]}"></i>${esc(s.label)} <span class="mono ${(reb[j].filter(v => v !== null).pop() || 100) >= 100 ? 'up' : 'down'}">${(((reb[j].filter(v => v !== null).pop() || 100)) - 100).toFixed(1)}%</span></div>`).join('')}</div>`;
    const svg = el.querySelector('svg'), tip = tipEl(el), xh = svg.querySelector('#cp-xh');
    svg.onmousemove = ev => { const r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(N - 1, Math.round(((ev.clientX - r.left) / r.width * W - L) / ((W - L - R) / (N - 1))))); xh.setAttribute('x1', sx(i)); xh.setAttribute('x2', sx(i)); xh.setAttribute('visibility', 'visible'); tip.innerHTML = `<b>${esc(dates[i])}</b>` + S.map((s, j) => `<br><span style="color:${s.color || PAL[j % PAL.length]}">●</span> ${esc(s.label)} ${reb[j][i] === null ? '—' : (reb[j][i] - 100 >= 0 ? '+' : '') + (reb[j][i] - 100).toFixed(1) + '%'}`).join(''); const er = el.getBoundingClientRect(); placeTip(tip, el, ev.clientX - er.left, ev.clientY - er.top); };
    svg.onmouseleave = () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); }; resizeHook(el, () => compare(el, series, o));
  }

  /* ---- fan chart: expected path with bands (lognormal from mu, sigma per year) ---- */
  function fan(el, o) {
    const W = widthOf(el), H = o.height || 200, L = 8, R = 84, T = 10, XB = 20, PH = H - T - XB, days = Math.max(5, o.days || 365), A = o.amount || 100, mu = (o.mu || 0) / 100, sig = Math.max(0.001, (o.sigma || 20) / 100), steps = 40;
    const q = { p05: -1.6449, p25: -0.6745, p50: 0, p75: 0.6745, p95: 1.6449 }, path = {}; for (const k of Object.keys(q)) path[k] = []; const bench = [];
    for (let s = 0; s <= steps; s++) { const t = days / 365 * s / steps; for (const k of Object.keys(q)) path[k].push(A * Math.exp((mu - sig * sig / 2) * t + q[k] * sig * Math.sqrt(t))); bench.push(A * Math.pow(1 + (o.bench || 0) / 100, t)); }
    const all = [...path.p05, ...path.p95, ...bench]; let mn = Math.min(...all), mx = Math.max(...all); const pad = (mx - mn) * .05; mn -= pad; mx += pad;
    const sx = s => L + s * ((W - L - R) / steps), sy = v => T + PH - ((v - mn) / (mx - mn || 1)) * PH, line = arr => arr.map((v, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ',' + sy(v).toFixed(1)).join(''), band = (a, b) => line(a) + b.map((v, i) => 'L' + sx(b.length - 1 - i).toFixed(1) + ',' + sy(b[b.length - 1 - i]).toFixed(1)).join('') + 'Z';
    let g = ''; for (const v of niceTicks(mn, mx, 4)) { const y = sy(v); g += `<line class="ax" x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke-dasharray="2 3"/><text x="${W - R + 6}" y="${(y + 3.5).toFixed(1)}">${esc((o.fmt || fmtBig)(v))}</text>`; }
    g += `<path d="${band(path.p05, path.p95)}" fill="var(--c1)" opacity=".12"/><path d="${band(path.p25, path.p75)}" fill="var(--c1)" opacity=".22"/><path d="${line(path.p50)}" fill="none" stroke="var(--c1)" stroke-width="2"/><path d="${line(bench)}" fill="none" stroke="var(--fg2)" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    for (const f of [0, 0.5, 1]) { const s = Math.round(steps * f); g += `<text x="${sx(s).toFixed(1)}" y="${H - 6}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${f === 0 ? 'today' : f === 1 ? esc(o.endLabel || 'exit') : '+' + Math.round(days / 2) + 'd'}</text>`; }
    const lab = (k, txt) => `<text x="${(W - R + 4).toFixed(1)}" y="${(sy(path[k][steps]) + 3.5).toFixed(1)}" style="font-size:9.5px;fill:var(--fg2)">${txt}</text>`;
    el.classList.add('chart-wrap'); el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px">${g}</svg><div class="legend"><div><i style="background:var(--c1)"></i>median path</div><div><i style="background:var(--c1);opacity:.4"></i>25–75%</div><div><i style="background:var(--c1);opacity:.2"></i>5–95%</div><div><i style="background:var(--fg2)"></i>${esc(o.benchLabel || 'deposit')}</div></div>`;
    return { p05: path.p05[steps], p25: path.p25[steps], p50: path.p50[steps], p75: path.p75[steps], p95: path.p95[steps], bench: bench[steps], probBeat: 1 - Phi((Math.log(bench[steps] / A) - (mu - sig * sig / 2) * days / 365) / (sig * Math.sqrt(days / 365))) };
  }
  const Phi = x => { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };

  return { priceChart, donut, hbars, radar, heatGrid, timeline, compare, fan, sma, PAL, fmtBig };
})();
if (typeof module !== 'undefined') module.exports = VIZ;
