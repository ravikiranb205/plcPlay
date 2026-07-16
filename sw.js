const CACHE = 'fitwin-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/workout.js',
  './js/timer.js',
  './js/store.js',
  './js/generator.js',
  './js/profile.js',
  './js/nutrition.js',
  './data/workouts.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Cache-first for local assets, network-first for everything else
  const url = new URL(e.request.url);
  const isLocal = url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (isLocal) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        });
      })
    );
  } else {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
