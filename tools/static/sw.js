/* orangegoat Deluxe service worker (GitHub Pages): the app opens offline with the last market data it saw.
   Market data (data/view.json) and the page: network first, cache as fallback. Libraries and icons: cache first. */
const CACHE = 'orangegoat-v1';
const SHELL = ['./', './index.html', './static-mode.js', './manifest.webmanifest', './icon.png', './icon-192.png', './favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => { })).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const key = /\/data\/(view|series)\.json$/.test(u.pathname) ? new Request(u.origin + u.pathname) : e.request;
  const networkFirst = /\/(index\.html)?$/.test(u.pathname) || /\/data\/(view|series)\.json$/.test(u.pathname) || u.pathname.endsWith('static-mode.js');
  if (networkFirst) e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(key, c)); } return r; }).catch(() => caches.match(key, { ignoreSearch: true })));
  else e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok && /\/(lib|icon|favicon)/.test(u.pathname)) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; })));
});
