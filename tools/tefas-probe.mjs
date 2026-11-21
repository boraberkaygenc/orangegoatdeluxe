// One-off check: can this machine reach the 2026 TEFAS API (/api/funds/*)? Prints status, row counts and field names only.
const B = 'https://www.tefas.gov.tr/api/funds/';
const UAS = { honest: 'GNC-Terminal/2.13 (personal portfolio app; github.com/boraberkaygenc/orangegoatdeluxe)', none: null };
async function post(path, body, ua) { const h = { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'tr-TR,tr;q=0.9' }; if (ua) h['User-Agent'] = ua;
  const t0 = Date.now(); try { const r = await fetch(B + path, { method: 'POST', headers: h, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { }
    return { status: r.status, ms: Date.now() - t0, len: t.length, err: j && j.errorMessage, n: j && Array.isArray(j.resultList) ? j.resultList.length : null, keys: j && j.resultList && j.resultList[0] ? Object.keys(j.resultList[0]) : null, first: j && j.resultList ? j.resultList.slice(0, 2) : t.slice(0, 200) }; }
  catch (e) { return { error: String(e.message), cause: e.cause && e.cause.message }; } }
const list = t => ({ fonTipi: t, dil: 'TR', calismaTipi: 2, donemGetiri1a: '1', donemGetiri3a: '1', donemGetiri6a: '1', donemGetiriyb: '1', donemGetiri1y: '1', donemGetiri3y: '1', donemGetiri5y: '1' });
for (const [k, ua] of Object.entries(UAS)) { console.log('== list YAT, UA', k); console.log(JSON.stringify(await post('fonGetiriBazliBilgiGetir', list('YAT'), ua))); await new Promise(r => setTimeout(r, 3000)); }
console.log('== list EMK'); const e = await post('fonGetiriBazliBilgiGetir', list('EMK'), UAS.honest); console.log(JSON.stringify({ ...e, first: undefined }));
for (const p of [1, 12, 60]) { await new Promise(r => setTimeout(r, 2000)); console.log('== price TTE periyod', p); const r = await post('fonFiyatBilgiGetir', { fonKodu: 'TTE', dil: 'TR', periyod: p }, UAS.honest); console.log(JSON.stringify({ ...r, first: r.first, last: undefined })); }
for (const path of ['fonBilgiGetir', 'fonDetayBilgiGetir']) { await new Promise(r => setTimeout(r, 2000)); console.log('== guess', path); console.log(JSON.stringify(await post(path, { fonKodu: 'TTE', dil: 'TR' }, UAS.honest)).slice(0, 600)); }
