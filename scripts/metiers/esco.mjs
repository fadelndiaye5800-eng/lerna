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
cache.match = cache.match || {}; cache.occ = cache.occ || {};

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
const toks = (t) => new Set(norm(first(t)).split(' ').filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)));
function score(a, b) {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; });
  const jac = inter / (A.size + B.size - inter);
  return inter === A.size ? Math.max(jac, 0.5 + 0.5 * jac) : jac;   // tous les mots du ROME présents : bonne correspondance
}
const lit = (d, lg) => (d && d[lg] && d[lg].literal) ? String(d[lg].literal).replace(/\s+/g, ' ').trim() : '';

async function matchOne(code, titre) {
  const c = cache.match[code];
  if (c && c.t === titre) return c;
  const q = first(titre);
  const j = await get(API + '/search?text=' + encodeURIComponent(q) + '&type=occupation&language=fr&limit=8');
  const hits = ((j && j._embedded && j._embedded.results) || []).map((h) => ({ uri: h.uri, title: h.title, s: score(titre, h.title) }));
  hits.sort((a, b) => b.s - a.s);
  const best = hits[0] && hits[0].s >= 0.5 ? hits[0] : null;
  const m = { t: titre, uri: best ? best.uri : '', s: best ? Math.round(best.s * 100) / 100 : 0, at: new Date().toISOString().slice(0, 10) };
  cache.match[code] = m;
  return m;
}
async function occOne(uri) {
  if (cache.occ[uri]) return cache.occ[uri];
  const out = {};
  for (const lg of ['fr', 'en']) {
    const o = await get(API + '/resource/occupation?uri=' + encodeURIComponent(uri) + '&language=' + lg);
    if (!o) return null;
    const L = o._links || {};
    const isco = (L.broaderIscoGroup || [])[0] || {};
    out[lg] = {
      t: first(o.title || ''),
      d: lit(o.description, lg),
      i: isco.code || '', il: isco.title || '',
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
async function worker() {
  while (k < todo.length) {
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
fs.writeFileSync(CACHE, JSON.stringify(cache));
for (const [L, obj] of Object.entries(letters)) fs.writeFileSync(path.join(OUT, L + '.json'), JSON.stringify(obj));
index.esco = { maj: new Date().toISOString().slice(0, 10), n: ok, source: 'ESCO — Commission européenne (classification CITP-08 de l’OIT)' };
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
log('ESCO : fiches reliées', ok, '/', todo.length);
/* Contrôle humain : quelques correspondances */
for (const c of ['M1805', 'J1102', 'K1915', 'M1211', 'D1406', 'E1103', 'K2107', 'A1301']) {
  const m = index.m.find((x) => x[0] === c); const f = m && letters[m[2]][c];
  log(c, m ? m[1] : '?', '→', f && f.esco ? f.esco.fr.t + ' | ' + f.esco.en.t + ' | CITP ' + f.esco.fr.i + ' ' + f.esco.fr.il + ' | score ' + f.esco.q : 'aucune');
}
