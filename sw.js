const CACHE = 'facilita-v2';
const FILES = [
  './', './index.html', './manifest.json',
  './tema-escuro.html', './tema-verde.html',
  './tema-dourado.html', './tema-claro.html'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(r=>{
        if(!r||r.status!==200)return r;
        const cl=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,cl));
        return r;
      }).catch(()=>caches.match('./index.html'));
    })
  );
});
