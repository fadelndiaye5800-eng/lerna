/* LERNA — service worker : l'application s'ouvre même hors connexion */
/* Notifications : le script OneSignal n'est chargé que si OneSignal est configuré (sw.js?os=1) */
if (new URL(self.location.href).searchParams.get('os') === '1') {
  try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}
}
const VERSION = 'lerna-v8.9.0';
const CORE = [
  '/', '/index.html', '/aujourdhui.html', '/questionnaire.html', '/loading.html', '/resultats.html', '/explorer.html', '/ecole.html',
  '/opportunites.html', '/espace.html', '/premium.html', '/auth.html', '/dossier.html', '/parametres.html', '/contact.html', '/legal.html', '/manifest.json',
  '/assets/css/lerna.css', '/assets/js/boot.js', '/assets/js/core.js', '/assets/js/guides.js', '/assets/js/accred.js', '/assets/js/coffre.js', '/assets/js/questions.js', '/assets/js/data-schools.js',
  '/assets/js/data-opps.js', '/assets/js/engine.js', '/assets/js/daily.js', '/assets/icons/icon.svg', '/assets/icons/icon-192.png',
  '/assets/stickers/autre.webp', '/assets/stickers/fire.webp', '/assets/stickers/target.webp', '/assets/stickers/wave.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;                       // jamais de cache pour l'API
  if (url.pathname.startsWith('/admin')) return;                     // ni pour l'administration
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;

  // Pages : réseau d'abord, cache en secours
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('/index.html'))));
    return;
  }
  // Code de l'app (JS, CSS, JSON) : réseau d'abord, cache seulement hors connexion.
  // Sinon un téléphone gardait l'ancien code après une mise à jour (pages nouvelles + code ancien = bugs).
  if (url.origin === location.origin && /\.(js|css|json)$/.test(url.pathname)) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {   // no-cache : le navigateur revérifie auprès du serveur (rapide si rien n'a changé)
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // Images, autocollants et polices : cache d'abord, mise à jour en arrière-plan
  e.respondWith(caches.match(req).then((cached) => {
    const net = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
