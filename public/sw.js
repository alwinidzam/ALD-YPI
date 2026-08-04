// ALD Service Worker
// Strategy:
//  - App shell (HTML/CSS/JS/icons) -> stale-while-revalidate, so repeat launches are instant
//    but silently pick up new deploys in the background.
//  - Firestore/Firebase/Google API calls -> always network (never cached), the app already
//    has its own persistentLocalCache for offline data, we must not shadow it here.
//  - Navigation requests when fully offline -> fall back to the cached shell / offline page.
const CACHE_VERSION = 'ald-shell-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/?source=pwa',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isNeverCache(url) {
  return (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') // pdf.js worker: let the browser's own HTTP cache handle it
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (isNeverCache(url)) return; // let it hit the network untouched

  // Navigations: network-first so users always get the latest shell when online,
  // fall back to cache, then to the offline page if nothing cached either.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
