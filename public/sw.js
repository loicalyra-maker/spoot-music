const CACHE_NAME = 'spoot-music-v2';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const STATIC_ASSETS = [
    scope,
    `${scope}index.html`,
    `${scope}manifest.json`,
    `${scope}brand/icon-192.png`,
    `${scope}brand/icon-512.png`,
    `${scope}brand/spoot_badge.png`,
    `${scope}brand/spoot_badge_official.png`,
    `${scope}brand/spoot_logo_full.png`,
    `${scope}liquid-glass-bg.svg`
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets relative to scope:', scope);
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Éviter de cacher les requêtes d'API de flux externes ou streaming temps réel
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Pour tous les fichiers statiques de l'app (JS, CSS, HTML, icônes) : Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En tâche de fond, rafraîchir discrètement si réseau dispo
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // En cas de coupure réseau complète ou PC éteint, servir l'application indexée
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match(`${self.registration.scope}index.html`) || caches.match(self.registration.scope);
        }
      });
    })
  );
});
