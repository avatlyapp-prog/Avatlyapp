/* Basic SW cache for Avatly — v9 (bump the version to refresh) */
const CACHE_NAME = 'avatly-v9';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=3',
  './app.js?v=3',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(res => res ||
        fetch(e.request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return resp;
        })
      )
    );
  }
});
