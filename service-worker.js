/* ════════════════════════════════════════════
   SUPER COLA — Service Worker
   Offline-First PWA Strategy
   ════════════════════════════════════════════ */

const CACHE_NAME = 'supercola-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap',
];

/* ── INSTALL ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { cache: 'reload' });
      })).catch(err => {
        // Graceful: cache what we can
        console.warn('[SW] Some assets failed to cache:', err);
        return Promise.all(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(e => console.warn('[SW] Failed:', url, e))
          )
        );
      });
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH — Cache First for static, Network First for dynamic ── */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension or non-http
  if (!url.protocol.startsWith('http')) return;

  // Skip WhatsApp / Telegram share links
  if (url.hostname.includes('wa.me') || url.hostname.includes('t.me')) return;

  // Cache-First for app shell
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

/* ── BACKGROUND SYNC (future use) ── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[SW] Background sync: orders');
  }
});

/* ── PUSH NOTIFICATIONS (future use) ── */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'سوپر کولا', {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    dir: 'rtl',
    lang: 'fa',
  });
});
