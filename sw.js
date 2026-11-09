/* =====================================================================
   sw.js — offline helper for the website and the Android app.
   - Pages, scripts, styles and the catalogue: network first, so customers
     always see the latest products and prices; the saved copy is used
     only when there is no connection.
   - Photos and icons: saved copy first, for speed.
   The admin page and GitHub are never cached.
   ===================================================================== */
const VERSION = 'v1';
const CACHE = `samruddhi-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/shop-config.js',
  'js/products.js',
  'js/art.js',
  'js/app.js',
  'images/logo.png',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('samruddhi-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                        // GitHub API, fonts, WhatsApp: browser handles
  if (/admin(\.html)?$|\/js\/admin\.js$|\/css\/admin\.css$/.test(url.pathname)) return;   // admin is always live

  const isAsset = /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
  event.respondWith(isAsset ? cacheFirst(req) : networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const home = await cache.match('index.html');
      if (home) return home;
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
