const CACHE_NAME = 'portefeuille-v1';
const ASSETS = [
  './',
  './index.html',
  './wallet-detail.html',
  './assistant.html',
  './history.html',
  './notifications.html',
  './telechargement.html',
  './chargement.html',
  './tutorial.js',
  './manifest.json',
  './js/tailwind.js',
  './fontawesome/css/all.min.css',
  './fontawesome/webfonts/fa-solid-900.woff2',
  './fontawesome/webfonts/fa-solid-900.ttf',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET (ex: API POST, Groq, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retourner le cache s'il existe
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon, faire la requête réseau
      return fetch(event.request).then((networkResponse) => {
        // Mettre en cache la nouvelle ressource (très utile pour les polices FontAwesome WOFF2)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'cors') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.error('Fetch failed; returning offline page instead.', error);
        // Si la requête échoue (hors-ligne), on ne fait rien de plus ici, 
        // l'application utilise l'UI IndexedDB.
      });
    })
  );
});

// Native Notification Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
