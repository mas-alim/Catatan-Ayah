/*
 * Catatan Utang Piutang PWA service worker.
 * Only same-origin static app assets are cached. Firebase/Auth/API responses,
 * transaction data, and cross-origin requests are deliberately never cached.
 */
const CACHE_PREFIX = 'catatan-ayah-static-';
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const SCOPE_URL = new URL(self.registration.scope);
const OFFLINE_URL = new URL('offline.html', SCOPE_URL).href;
const STATIC_URLS = [
  new URL('app.css', SCOPE_URL).href,
  new URL('manifest.webmanifest', SCOPE_URL).href,
  new URL('icons/icon-192.png', SCOPE_URL).href,
  new URL('icons/icon-512.png', SCOPE_URL).href,
  OFFLINE_URL
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept requests to Firebase, CDNs, or any other third-party origin.
  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(SCOPE_URL.href)) return;

  if (request.mode === 'navigate') {
    // Online-first navigation. If offline, show a neutral page rather than
    // trying to open the app with unavailable Firebase SDK/network access.
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: 'no-store' });
      } catch {
        const cachedOffline = await caches.match(OFFLINE_URL);
        return cachedOffline || new Response('Koneksi internet diperlukan untuk membuka Catatan Utang Piutang.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Cache-first only for known public static PWA assets. Never cache arbitrary
  // same-origin requests or data responses.
  if (STATIC_URLS.includes(url.href)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
