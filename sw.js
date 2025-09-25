// PWA básico de cache estático (versão simples)
const CACHE_NAME = 'terminal-tetris-v1';
const ASSETS = [
  './',
  './index.html',
  './favicon.png',
  './style.css',
  './manifest.webmanifest'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // cache somente arquivos do mesmo host
        try {
          const url = new URL(req.url);
          if (url.origin === location.origin && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
        } catch(_) {}
        return res;
      });
    })
  );
});
