/* LERNA — service worker : l'application est gardée sur le téléphone.
   - Toute l'app (pages, code, polices, bibliothèque Supabase) est enregistrée d'un bloc : elle s'ouvre tout de suite,
     même en connexion faible ou sans connexion. Avant, chaque ouverture attendait le réseau pour chaque fichier.
   - Les mises à jour arrivent d'un bloc aussi : quand une nouvelle version est en ligne (« build » de /api/config),
     le service worker télécharge toute l'app dans un cache neuf, en arrière-plan, puis bascule.
     Jamais une page neuve avec un code ancien.
   - Les données (annuaire, autocollants, drapeaux…) : affichées depuis le cache, rafraîchies en arrière-plan.
   - L'API, l'administration et les mesures ne passent jamais par le cache. */
/* Notifications : le script OneSignal n'est chargé que si OneSignal est configuré (sw.js?os=1) */
if (new URL(self.location.href).searchParams.get('os') === '1') {
  try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}
}
const VERSION = 'lerna-v9.0.0';
const SHELL = [
  '/', '/index.html', '/aujourdhui.html', '/questionnaire.html', '/loading.html', '/resultats.html', '/explorer.html', '/ecole.html',
  '/fiche.html', '/opportunites.html', '/espace.html', '/premium.html', '/auth.html', '/dossier.html', '/parametres.html', '/contact.html',
  '/manifest.json', '/assets/css/lerna.css',
  '/assets/js/boot.js', '/assets/js/core.js', '/assets/js/questions.js', '/assets/js/data-schools.js', '/assets/js/data-opps.js',
  '/assets/js/engine.js', '/assets/js/guides.js', '/assets/js/accred.js', '/assets/js/coffre.js', '/assets/js/copilote.js', '/assets/js/daily.js',
  '/assets/vendor/supabase-2.45.4.js',
  '/assets/fonts/inter-latin.woff2', '/assets/fonts/inter-latin-ext.woff2', '/assets/fonts/playfair-latin.woff2', '/assets/fonts/playfair-latin-ext.woff2',
  '/assets/icons/icon.svg', '/assets/icons/icon-192.png', '/assets/icons/apple-touch-icon.png', '/assets/annuaire/index.json',
  '/assets/stickers/autre.webp', '/assets/stickers/fire.webp', '/assets/stickers/target.webp', '/assets/stickers/wave.webp'
];
const PREFIX = 'lerna-shell-' + VERSION + '-';
const DATA = 'lerna-data';
const MARK = '/__lerna_shell_ok__';
const CHECK_EVERY = 30 * 60 * 1000;     // au plus une vérification de mise à jour toutes les 30 minutes
let active = null, activeName = '', building = null, lastCheck = 0;

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}
/* Une réponse redirigée ne peut pas servir une navigation : on en refait une réponse simple */
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

/* Télécharge toute l'app dans un cache neuf ; on ne bascule que si (presque) tout est arrivé */
function buildShell(build) {
  if (building) return building;
  building = (async () => {
    const name = PREFIX + Date.now();
    const cache = await caches.open(name);
    const res = await Promise.allSettled(SHELL.map(async (u) => {
      const r = await withTimeout(fetch(new Request(u, { cache: 'reload' })), 60000);
      if (!r.ok) throw new Error(u);
      await cache.put(u, await clean(r));
    }));
    const ok = res.filter((x) => x.status === 'fulfilled').length;
    if (ok < Math.ceil(SHELL.length * 0.9)) { await caches.delete(name); throw new Error('shell incomplete'); }
    await cache.put(MARK, new Response(JSON.stringify({ t: Date.now(), build: build || '' }), { headers: { 'Content-Type': 'application/json' } }));
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== name && k !== DATA).map((k) => caches.delete(k)));
    active = cache; activeName = name;
    return cache;
  })().finally(() => { building = null; });
  return building;
}
/* Le cache complet le plus récent */
async function activeShell() {
  if (active) return active;
  const keys = (await caches.keys()).filter((k) => k.startsWith('lerna-shell-')).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    const c = await caches.open(keys[i]);
    if (await c.match(MARK)) { active = c; activeName = keys[i]; return c; }
  }
  return null;
}
/* Nouvelle version en ligne ? (comparaison du « build » de /api/config) */
async function maybeUpdate() {
  if (Date.now() - lastCheck < CHECK_EVERY) return;
  lastCheck = Date.now();
  try {
    const shell = await activeShell();
    const r = await withTimeout(fetch('/api/config', { cache: 'no-store', headers: { Accept: 'application/json' } }), 15000);
    if (!r.ok) return;
    const build = (await r.json()).build || '';
    if (!shell) { await buildShell(build); return; }
    const markRes = await shell.match(MARK);
    const info = markRes ? await markRes.json() : {};
    if (!build) return;
    if (!info.build) {                     // cache tout juste installé : on note la version, sans tout retélécharger
      await shell.put(MARK, new Response(JSON.stringify({ t: info.t || Date.now(), build }), { headers: { 'Content-Type': 'application/json' } }));
      return;
    }
    if (info.build !== build || !activeName.startsWith(PREFIX)) await buildShell(build);   // nouvelle version en ligne, ou cache d'une ancienne version du service worker
  } catch (e) { /* hors connexion : on réessaiera plus tard */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil(buildShell('').catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    /* Anciens caches (avant la v9) : supprimés ; on garde le dernier cache complet et les données */
    const keep = await activeShell();
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== DATA && !k.startsWith('lerna-shell-')).map((k) => caches.delete(k)));
    if (!keep) lastCheck = 0;
    await self.clients.claim();
    /* L'index de recherche de l'Explorer (toutes les écoles) : gardé aussi, sauf en mode « économie de données » */
    try {
      const data = await caches.open(DATA);
      const saveData = self.navigator && self.navigator.connection && self.navigator.connection.saveData;
      if (!saveData && !(await data.match('/assets/annuaire/noms.json'))) {
        const r = await withTimeout(fetch('/assets/annuaire/noms.json'), 120000);
        if (r.ok) await data.put('/assets/annuaire/noms.json', r);
      }
    } catch (err) { /* plus tard, à la première recherche */ }
  })());
});
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'refresh') { lastCheck = 0; e.waitUntil(maybeUpdate()); }
});

/* Données (annuaire, autocollants, drapeaux, pages rares) : le cache tout de suite, la mise à jour en arrière-plan */
async function fromData(req, e) {
  const cache = await caches.open(DATA);
  const cached = await cache.match(req);
  const net = fetch(req).then(async (res) => {
    if (res && (res.ok || res.type === 'opaque')) await cache.put(req, (await clean(res.clone())));
    return res;
  }).catch(() => null);
  if (cached) { e.waitUntil(net); return cached; }
  const res = await net;
  return res || Response.error();
}

async function fromShell(shell, key) {
  if (!shell) return null;
  try { return (await shell.match(key, { ignoreSearch: true })) || null; }
  catch (err) { active = null; return null; }      // cache remplacé entre-temps
}
async function handle(req, url, e) {
  const shell = await activeShell();
  if (req.mode === 'navigate') {
    e.waitUntil(maybeUpdate());
    const hit = await fromShell(shell, url.pathname);
    if (hit) return hit;
    /* Page rare (informations légales…) : le réseau, gardée ensuite pour la connexion faible */
    const data = await caches.open(DATA);
    try {
      const res = await withTimeout(fetch(req), 12000);
      if (res && res.ok) e.waitUntil(clean(res.clone()).then((c) => data.put(url.pathname, c)));
      return res;
    } catch (err) {
      return (await data.match(url.pathname)) || (await fromShell(shell, '/index.html')) || Response.error();
    }
  }
  const hit = await fromShell(shell, url.pathname);
  if (hit) return hit;
  return fromData(req, e);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (/^\/(api|admin|_vercel)(\/|\.|$)/.test(url.pathname) || url.pathname === '/sw.js') return;
    e.respondWith(handle(req, url, e));
    return;
  }
  /* Polices Google (anciennes pages encore ouvertes) : cache d'abord */
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(fromData(req, e));
});
