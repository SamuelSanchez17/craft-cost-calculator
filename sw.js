// ────────────────────────────────────────────
// Service Worker — Alelyvers Cotizador
// Estrategia: StaleWhileRevalidate
// Cache-first para shell, network para actualizaciones.
// Funciona offline tras la primera carga.
// ────────────────────────────────────────────

const CACHE_NAME = 'alelyvers-pwa-v1';
const CACHE_VERSION = 1;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/main.css',
  '/css/components/header.css',
  '/css/components/calculator.css',
  '/css/components/catalog.css',
  '/css/components/combo-builder.css',
  '/css/components/candles.css',
  '/css/components/quote.css',
  '/css/components/settings.css',
  '/css/components/history.css',
  '/css/components/footer.css',
  '/js/app.js',
  '/js/state.js',
  '/js/storage.js',
  '/js/calculator.js',
  '/js/catalog.js',
  '/js/utils/format.js',
  '/js/utils/export.js',
  '/js/utils/debounce.js',
  '/js/ui/renderer.js',
  '/js/ui/icons.js',
  '/js/ui/calculator-ui.js',
  '/js/ui/catalog-ui.js',
  '/js/ui/combo-ui.js',
  '/js/ui/candles-ui.js',
  '/js/ui/quote-ui.js',
  '/js/ui/settings-ui.js',
  '/js/ui/history-ui.js',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/favicon.svg',
];

// ─── Install: precache del shell de la app ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[sw] precache falló para algunos recursos:', err);
        return Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((e) =>
              console.warn(`[sw] no se pudo cachear: ${url}`, e)
            )
          )
        );
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: limpia caches viejos ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[sw] eliminando cache viejo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch: stale-while-revalidate ───
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

// ─── Mensaje desde la app para forzar update ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
