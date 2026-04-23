const CACHE_NAME = 'facilita-v6';

const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './tema-claro.html',
  './tema-escuro.html',
  './tema-verde.html',
  './tema-dourado.html',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS).catch((err) => {
        console.error('Erro ao cachear assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Ignorar requests não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estratégia cache-first para assets do app
  if (request.url.includes('/icons/') || 
      request.url.endsWith('.html') ||
      request.url.endsWith('manifest.json')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }).catch(() => {
        // Offline: tentar fallback para index.html se for navegação
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
    );
    return;
  }

  // Para outros recursos (fonts, CDN): network-first com cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && request.method === 'GET') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
