// NetStudio Production Progressive Web App Service Worker
// Version: 2.4.0

const CACHE_NAME = 'netstudio-static-v3';
const RUNTIME_CACHE = 'netstudio-runtime-v3';
const IMAGES_CACHE = 'netstudio-images-v3';

// Core Application Shell Assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Sensitive routes that must NEVER be cached by the service worker
const SENSITIVE_URL_PATTERNS = [
  /\/api\/treasury/,
  /\/api\/auth\//,
  /\/api\/admin\//,
  /\/api\/owner\//,
  /\/weba1-admin2/,
  /\/weba-token-wallet/
];

// Installation: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[NetStudio SW] Non-critical precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up obsolete caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[NetStudio SW] Purging legacy cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Interception
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin video/proxy media streams
  if (request.method !== 'GET') return;

  // STRICT SECURITY CHECK: Never cache sensitive authentication or treasury data
  const isSensitive = SENSITIVE_URL_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isSensitive) {
    return; // Pass through to network directly without touching service worker cache
  }

  // Skip live HLS/m3u8 streaming requests and proxy streaming chunks
  if (
    url.pathname.includes('.m3u8') ||
    url.pathname.includes('.ts') ||
    url.pathname.includes('/api/proxy-stream')
  ) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/');
          return fallback || new Response('Offline - NetStudio is ready when reconnected.', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 2. Images & Media Artwork (Posters, Backdrops, Logos): Cache-first with network fallback
  if (
    request.destination === 'image' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Fallback icon
          return caches.match('/icon.svg');
        }
      })
    );
    return;
  }

  // 3. API Catalog Content (Public movies & channels catalog): Network-first with stale fallback
  if (url.pathname === '/api/media' || url.pathname === '/api/channels' || url.pathname === '/api/subscription/plans') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4. Static assets (JS, CSS, Fonts): NETWORK-FIRST with cache fallback.
  //    Users must ALWAYS run the latest player/streaming code; the cache is
  //    only a safety net for offline usage — never a source of stale bundles.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return new Response('', { status: 504, statusText: 'Offline' });
        })
    );
  }
});

// Instant activation when the app tells a waiting worker to take over
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push Notifications Listener
self.addEventListener('push', (event) => {
  let payload = {
    title: 'NetStudio',
    body: 'New movies, series, and live channels are available now!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const json = event.data.json();
      payload = { ...payload, ...json };
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Watch Now' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
