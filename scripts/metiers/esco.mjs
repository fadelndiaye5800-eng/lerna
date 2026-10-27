/* Métiers : correspondance internationale avec ESCO (Commission européenne), fondée sur la classification
   internationale des professions de l'OIT (CITP-08 / ISCO-08).
   Pour chaque fiche ROME : recherche du métier ESCO le plus proche, gardé seulement si les intitulés se ressemblent
   vraiment ; on ajoute alors la description internationale (FR et EN), le groupe CITP-08 et les compétences essentielles.
   Un cache évite de tout redemander chaque mois. Source : https://esco.ec.europa.eu (réutilisation autorisée avec mention). */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'assets/metiers';
const CACHE = 'scripts/metiers/esco-cache.json';
const API = 'https://ec.europa.eu/esco/api';
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { match: {}, occ: {} };
cache.match = cache.match || {}; cache.occ = cache.occ || {}; cache.alt = cache.alt || {};

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctl.signal });
      clearTimeout(tm);
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch (e) { /* on réessaie */ }
    await sleep(800 * (i + 1));
  }
  return null;
}

const STOP = new Set('de du des la le les l d un une et en a au aux pour par sur dans avec chez ou'.split(' '));
const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const first = (t) => String(t || '').split('/')[0].replace(/\([^)]*\)/g, ' ').trim();
/* Intitulé ROME au masculin complet : « Directeur / Directrice des ventes » → « Directeur des ventes »
   (avant, seul « Directeur » était gardé : correspondances fausses) */
function masc(t) {
  t = String(t || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const i = t.indexOf(' / ');
  if (i === -1) return t.split('/')[0].trim();
  const L = t.slice(0, i).trim(), R = t.slice(i + 3).trim();
  const lw = L.split(' '), rw = R.split(' ');
  return rw.length > lw.length ? L + ' ' + rw.slice(lw.length).join(' ') : L;
}
const toks = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)));
function score(rome, esco) {
  const A = toks(masc(rome)), B = toks(first(esco));
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; });
  const jac = inter / (A.size + B.size - inter);
  /* Tous les mots du ROME présents et au plus un mot en plus côté ESCO : bonne correspondance */
  return inter === A.size && B.size <= A.size + 1 ? Math.max(jac, 0.6 + 0.4 * jac) : jac;
}
const MIN = 0.6, MIN_ALT = 0.8, MV = 3;   // MV : version de la règle de correspondance (change = tout est recalculé)
const lit = (d, lg) => (d && d[lg] && d[lg].literal) ? String(d[lg].literal).replace(/\s+/g, ' ').trim() : '';

/* Autres noms ESCO d'un métier (en français), pour reconnaître « data scientist » = « scientifique des données » */
let shown = false;
async function altLabels(uri) {
  if (cache.alt[uri]) return cache.alt[uri];
  const o = await get(API + '/resource/occupation?uri=' + encodeURIComponent(uri) + '&language=fr');
  if (!o) return null;
  if (!shown) { shown = true; log('  (structure ESCO :', Object.keys(o).join(','), '| alternativeLabel :', JSON.stringify(o.alternativeLabel || null).slice(0, 160), ')'); }
  const a = o.alternativeLabel || o.alternativeTerms || {};
  let list = Array.isArray(a) ? a : Array.isArray(a.fr) ? a.fr : [];
  list = list.map((x) => (typeof x === 'string' ? x : x && (x.label || x.literal) || '')).filter(Boolean);
  const pl = o.preferredLabel && typeof o.preferredLabel.fr === 'string' ? [o.preferredLabel.fr] : [];
  cache.alt[uri] = pl.concat(list).slice(0, 40);
  return cache.alt[uri];
}
async function matchOne(code, titre) {
  const c = cache.match[code];
  if (c && c.t === titre && (c.v === MV || (c.v === 2 && c.uri))) return c;   // les bonnes correspondances déjà trouvées sont gardées
  const q = masc(titre);
  const j = await get(API + '/search?text=' + encodeURIComponent(q) + '&type=occupation&language=fr&limit=8');
  if (!j) return null;   // erreur réseau : on réessaiera au prochain passage (rien en cache)
  const raw = (j._embedded && j._embedded.results) || [];
  const hits = raw.map((h, r) => ({ uri: h.uri, title: h.title, s: score(titre, h.title), r }));
  /* Pas de nom principal assez proche : on regarde les autres noms des 3 premiers résultats ESCO (exigence plus forte) */
  if (!hits.some((h) => h.s >= MIN)) {
    for (const h of hits.slice(0, 3)) {
      const al = await altLabels(h.uri);
      if (!al) continue;
      const sa = Math.max(0, ...al.map((x) => score(titre, x)));
      if (sa >= MIN_ALT) { h.s = Math.max(h.s, sa - 0.05); h.alt = 1; }
    }
  }
  hits.sort((a, b) => b.s - a.s || a.r - b.r);
  const best = hits[0] && hits[0].s >= MIN ? hits[0] : null;
  const m = { t: titre, v: MV, uri: best ? best.uri : '', et: best ? best.title : '', s: best ? Math.round(best.s * 100) / 100 : 0, alt: best && best.alt ? 1 : 0,
    h: best ? undefined : hits.slice(0, 3).map((x) => first(x.title) + ' ' + Math.round(x.s * 100) / 100).join(' ; '), at: new Date().toISOString().slice(0, 10) };
  cache.match[code] = m;
  return m;
}
/* Groupe CITP-08 : directement, ou en remontant les métiers ESCO plus larges (métier ESCO « spécialisé ») */
async function iscoOf(o, lg, depth = 0) {
  const L = (o && o._links) || {};
  const g = (L.broaderIscoGroup || [])[0];
  if (g && g.code) return { i: String(g.code), il: g.title || '' };
  const b = (L.broaderOccupation || [])[0];
  if (b && b.uri && depth < 4) {
    const p = await get(API + '/resource/occupation?uri=' + encodeURIComponent(b.uri) + '&language=' + lg);
    if (p) return iscoOf(p, lg, depth + 1);
  }
  return { i: '', il: '' };
}
async function occOne(uri) {
  const c = cache.occ[uri];
  if (c && c.fr && c.fr.i) return c;
  const out = {};
  for (const lg of ['fr', 'en']) {
    const o = await get(API + '/resource/occupation?uri=' + encodeURIComponent(uri) + '&language=' + lg);
    if (!o) return null;
    const L = o._links || {};
    const isco = await iscoOf(o, lg);
    out[lg] = {
      t: first(o.title || ''),
      d: lit(o.description, lg),
      i: isco.i, il: isco.il,
      s: (L.hasEssentialSkill || []).map((x) => x.title).filter(Boolean).slice(0, 10)
    };
  }
  cache.occ[uri] = out;
  return out;
}

const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
const letters = {};
for (const f of fs.readdirSync(OUT)) if (/^[A-N]\.json$/.test(f)) letters[f[0]] = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
const todo = index.m.map((m) => ({ code: m[0], titre: m[1], L: m[2], m }));
log('ESCO : fiches à relier', todo.length, '| déjà en cache', Object.keys(cache.match).length);

let done = 0, ok = 0, k = 0;
/* Limite de temps : on garde ce qui est fait (cache) et on continue au prochain passage */
const DEADLINE = Date.now() + (+process.env.ESCO_MINUTES || 45) * 60000;
let stopped = false;
async function worker() {
  while (k < todo.length) {
    if (Date.now() > DEADLINE) { stopped = true; break; }
    const x = todo[k++];
    const mt = await matchOne(x.code, x.titre);
    if (mt && mt.uri) {
      const o = await occOne(mt.uri);
      const fiche = letters[x.L] && letters[x.L][x.code];
      if (o && fiche) {
        fiche.esco = { u: mt.uri, q: mt.s, fr: o.fr, en: o.en };
        x.m[5] = o.en && o.en.t ? o.en.t : '';
        ok++;
      }
    }
    if (++done % 100 === 0) { log('  ', done, '/', todo.length, '| reliées :', ok); fs.writeFileSync(CACHE, JSON.stringify(cache)); }
    await sleep(60);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
if (!stopped) {   // on ne garde dans le cache que les métiers ESCO encore utilisés
  const used = new Set(Object.values(cache.match).map((x) => x.uri).filter(Boolean));
  for (const u of Object.keys(cache.occ)) if (!used.has(u)) delete cache.occ[u];
  cache.alt = {};   // utile seulement pendant la recherche
}
fs.writeFileSync(CACHE, JSON.stringify(cache));
for (const [L, obj] of Object.entries(letters)) fs.writeFileSync(path.join(OUT, L + '.json'), JSON.stringify(obj));
index.esco = { maj: new Date().toISOString().slice(0, 10), n: ok, source: 'ESCO — Commission européenne (classification CITP-08 de l’OIT)' };
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
log('ESCO : fiches reliées', ok, '/', todo.length, stopped ? '(arrêt : limite de temps, la suite au prochain passage)' : '');
/* Contrôle humain : quelques correspondances, puis un échantillon régulier */
const sample = index.m.filter((x, i) => i % 48 === 0).map((x) => x[0]);
log('Sans correspondance (gardé sans ESCO) :', todo.length - ok, '| exactes (score 1) :', Object.values(cache.match).filter((x) => x.s === 1).length, '| par un autre nom ESCO :', Object.values(cache.match).filter((x) => x.alt).length);
for (const c of ['M1805', 'J1102', 'K1915', 'M1211', 'D1406', 'E1103', 'K2107', 'A1301', 'J1506', 'K2111', 'G1602', 'L1202'].concat(sample)) {
  const m = index.m.find((x) => x[0] === c); const f = m && letters[m[2]][c];
  const mm = cache.match[c] || {};
  log(c, m ? m[1] : '?', '→', f && f.esco ? f.esco.fr.t + ' | ' + f.esco.en.t + ' | CITP ' + f.esco.fr.i + ' ' + f.esco.fr.il + ' | score ' + f.esco.q + (mm.alt ? ' (autre nom)' : '') : 'aucune [' + (mm.h || '') + ']');
}
