/* Rentab'Pass : fonctionnement hors connexion.
   La page est d'abord demandée au réseau (pour recevoir les mises à jour), puis à la copie locale si besoin. */
const CACHE = 'rentabpass-v3';
const FILES = ['./', './index.html', './app.js', './web.css', './desktop.css', './desktop.js', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './fonts/Inter-Regular.woff', './fonts/Inter-Medium.woff', './fonts/Inter-SemiBold.woff', './fonts/Inter-Bold.woff', './fonts/Anton-Regular.woff'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // TMDB, affiches, polices : réseau direct
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
