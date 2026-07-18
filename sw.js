const CACHE = 'fitwin-v8';

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
  './images/tile-gym.jpg',
  './images/tile-home.jpg',
  './images/tile-outdoor.jpg',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // cache: 'reload' bypasses the HTTP cache so a new SW never
      // re-caches stale copies of the app shell
      Promise.all(ASSETS.map(u =>
        fetch(new Request(u, { cache: 'reload' }))
          .then(resp => { if (resp.ok) return cache.put(u, resp); })
          .catch(() => {})
      ))
    ).then(() => self.skipWaiting())
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
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont  = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isImage = sameOrigin && url.pathname.includes('/images/');

  if (sameOrigin && !isImage) {
    // Network-first for the app shell (HTML/JS/CSS/JSON) so updates
    // show up on the next open; cache is the offline fallback.
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
  } else if (isImage || isFont) {
    // Cache-first for images and fonts — they change rarely and are heavy
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
