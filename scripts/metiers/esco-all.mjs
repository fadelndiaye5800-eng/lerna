/* Métiers du monde : tous les métiers de la classification internationale ESCO (Commission européenne,
   fondée sur la classification CITP-08 / ISCO-08 de l'OIT) qui ne sont pas déjà reliés à une fiche ROME.
   Chaque métier ajouté a : nom (FR/EN), description (FR/EN), autres noms, compétences essentielles et
   optionnelles, groupe de métiers de l'OIT, niveau de compétence de l'OIT (1 à 4) et métiers proches.
   Rien n'est inventé : tout vient d'ESCO ; seuls le classement vers les 10 domaines LERNA (par groupe CITP)
   et le niveau de compétence (tableau officiel de l'OIT par grand groupe) sont faits ici.
   Source : https://esco.ec.europa.eu (réutilisation autorisée avec mention de la source). */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'assets/metiers';
const CACHE = 'scripts/metiers/esco-cache.json';
const API = 'https://ec.europa.eu/esco/api';
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
cache.match = cache.match || {}; cache.occ = cache.occ || {}; cache.all = cache.all || {}; cache.groups = cache.groups || {};
const DEADLINE = Date.now() + (+process.env.ESCO_ALL_MINUTES || 50) * 60000;

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 25000);
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctl.signal });
      clearTimeout(tm);
      if (r.ok) return await r.json();
      if (r.status === 404 || r.status === 400) return null;
    } catch (e) { /* on réessaie */ }
    await sleep(800 * (i + 1));
  }
  return null;
}
const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+]+/g, ' ').trim();
function masc(t) {
  t = String(t || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const i = t.indexOf('/');
  if (i === -1) return t;
  const L = t.slice(0, i).trim(), R = t.slice(i + 1).split('/')[0].trim();
  const lw = L.split(' '), rw = R.split(' ');
  return rw.length > lw.length ? L + ' ' + rw.slice(lw.length).join(' ') : L;
}
const lit = (d, lg) => (d && d[lg] && d[lg].literal) ? String(d[lg].literal).replace(/\s+/g, ' ').trim() : '';
const labels = (o, key, lg) => {
  const a = (o && o[key]) || {};
  const v = Array.isArray(a) ? a : Array.isArray(a[lg]) ? a[lg] : typeof a[lg] === 'string' ? [a[lg]] : [];
  return v.map((x) => (typeof x === 'string' ? x : (x && (x.label || x.literal)) || '')).filter(Boolean);
};
/* « animatrice danse » n'est pas un autre nom de « animateur danse » : c'est le même au féminin */
function genderVariant(a, b) {
  const A = norm(a).split(' '), B = norm(b).split(' ');
  return A.length === B.length && A.slice(1).join(' ') === B.slice(1).join(' ') && A[0].slice(0, 4) === B[0].slice(0, 4);
}
const linksOf = (o, name) => ((o && o._links && o._links[name]) || []).filter((x) => x && x.uri);

/* ---------- 1. Liste de tous les métiers ESCO ---------- */
async function listAll() {
  const uris = new Set();
  /* a) la recherche sans mot, page par page */
  const first = await get(API + '/search?language=fr&type=occupation&limit=100&offset=0&full=false');
  const total = first && +first.total;
  log('ESCO (monde) : recherche sans mot →', total || 'refusée');
  if (total > 2000) {
    const res = (j) => ((j && j._embedded && j._embedded.results) || []).map((h) => h.uri).filter(Boolean);
    const p0 = res(first); p0.forEach((u) => uris.add(u));
    /* « offset » d'ESCO : numéro de page (0, 1, 2…) ou rang du premier résultat, selon la version : on teste */
    const p1 = res(await get(API + '/search?language=fr&type=occupation&limit=100&offset=1&full=false'));
    const pageMode = p1.length > 50 && p1[0] !== p0[1];
    log('  pagination ESCO :', pageMode ? 'par numéro de page' : 'par rang');
    const pages = Math.ceil(total / 100);
    for (let i = 1; i < pages && Date.now() < DEADLINE; i++) {
      const off = pageMode ? i : i * 100;
      res(await get(API + '/search?language=fr&type=occupation&limit=100&offset=' + off + '&full=false')).forEach((u) => uris.add(u));
      await sleep(50);
    }
    log('  métiers listés par la recherche :', uris.size);
  }
  /* b) en secours (ou en plus) : l'arbre de la classification de l'OIT, du grand groupe au métier */
  if (uris.size < (total > 2000 ? total * 0.95 : 2000)) {
    const seen = new Set(), queue = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => 'http://data.europa.eu/esco/isco/C' + c);
    let shown = false;
    while (queue.length && Date.now() < DEADLINE) {
      const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
      const o = await get(API + '/resource/concept?uri=' + encodeURIComponent(u) + '&language=fr');
      if (!o) continue;
      if (!shown) { shown = true; log('  (arbre OIT, liens :', Object.keys(o._links || {}).join(','), ')'); }
      for (const arr of Object.values(o._links || {})) {
        if (!Array.isArray(arr)) continue;
        for (const x of arr) {
          if (!x || !x.uri) continue;
          if (x.uri.includes('/esco/isco/C') && x.uri.length > u.length && x.uri.startsWith(u)) queue.push(x.uri);
          else if (x.uri.includes('/esco/occupation/')) uris.add(x.uri);
        }
      }
      await sleep(40);
    }
    log('  métiers listés par l’arbre OIT :', uris.size);
  }
  return uris;
}

/* ---------- 2. Détail d'un métier (FR et EN) ---------- */
async function iscoOf(o, lg, depth = 0) {
  const g = linksOf(o, 'broaderIscoGroup')[0];
  if (g && g.code) return { i: String(g.code), il: g.title || '' };
  const b = linksOf(o, 'broaderOccupation')[0];
  if (b && depth < 4) {
    const p = await get(API + '/resource/occupation?uri=' + encodeURIComponent(b.uri) + '&language=' + lg);
    if (p) return iscoOf(p, lg, depth + 1);
  }
  return { i: '', il: '' };
}
async function detail(uri) {
  if (cache.all[uri] && cache.all[uri].v === 1) return cache.all[uri];
  const out = { v: 1 };
  for (const lg of ['fr', 'en']) {
    const o = await get(API + '/resource/occupation?uri=' + encodeURIComponent(uri) + '&language=' + lg);
    if (!o) return null;
    const isco = await iscoOf(o, lg);
    out.code = out.code || String(o.code || '');
    out[lg] = {
      t: masc(o.title || labels(o, 'preferredLabel', lg)[0] || ''),
      d: lit(o.description, lg) || lit(o.definition, lg),
      a: [...new Set(labels(o, 'alternativeLabel', lg).map(masc))].slice(0, 12),
      i: isco.i, il: isco.il,
      s: linksOf(o, 'hasEssentialSkill').map((x) => x.title).filter(Boolean).slice(0, 12),
      o: linksOf(o, 'hasOptionalSkill').map((x) => x.title).filter(Boolean).slice(0, 10)
    };
    if (lg === 'fr') out.nar = linksOf(o, 'narrowerOccupation').map((x) => x.uri);
  }
  cache.all[uri] = out;
  return out;
}
async function groupLabel(code) {
  const key = 'C' + code;
  if (cache.groups[key]) return cache.groups[key];
  const r = {};
  for (const lg of ['fr', 'en']) {
    const o = await get(API + '/resource/concept?uri=' + encodeURIComponent('http://data.europa.eu/esco/isco/' + key) + '&language=' + lg);
    r[lg] = o ? masc(o.title || labels(o, 'preferredLabel', lg)[0] || '') : '';
  }
  if (r.fr) cache.groups[key] = r;
  return r;
}

/* ---------- 3. Niveau de compétence de l'OIT et domaines LERNA ---------- */
/* Tableau officiel de l'OIT (CITP-08) : grand groupe → niveau(x) de compétence */
function skillLevel(isco) {
  const s = String(isco || '');
  if (!s) return '';
  if (s.startsWith('01')) return '4';
  if (s.startsWith('02')) return '2';
  if (s.startsWith('03')) return '1';
  return { 1: '34', 2: '4', 3: '3', 4: '2', 5: '2', 6: '2', 7: '2', 8: '2', 9: '1' }[s[0]] || '';
}
/* Classement LERNA par groupe CITP (du plus précis au plus large) */
const DOM_RULES = [
  ['1342', 'sante'], ['1343', 'sante'], ['1345', 'education'], ['1330', 'tech'], ['132', 'ingenierie'], ['131', 'agri'], ['1', 'business'],
  ['211', 'sciences'], ['212', 'sciences'], ['2132', 'agri'], ['2133', 'agri'], ['213', 'sciences'], ['214', 'ingenierie'], ['215', 'ingenierie'],
  ['2161', 'art'], ['2162', 'art'], ['2163', 'art'], ['2166', 'art'], ['2164', 'ingenierie'], ['2165', 'sciences'],
  ['2250', 'agri'], ['22', 'sante'], ['23', 'education'], ['2432', 'comm'], ['24', 'business'], ['25', 'tech'],
  ['261', 'droit'], ['262', 'art'], ['2631', 'business'], ['2632', 'sciences'], ['2633', 'sciences'], ['2634', 'sante'], ['2635', 'education'],
  ['264', 'comm'], ['265', 'art'],
  ['314', 'sciences'], ['31', 'ingenierie'], ['324', 'agri'], ['32', 'sante'], ['3355', 'droit'], ['335', 'droit'], ['33', 'business'],
  ['3411', 'droit'], ['3412', 'education'], ['3434', 'business'], ['343', 'art'], ['352', 'comm'], ['35', 'tech'],
  ['4', 'business'], ['511', 'business'], ['512', 'business'], ['513', 'business'], ['514', 'business'], ['52', 'business'],
  ['531', 'education'], ['532', 'sante'], ['5412', 'droit'],
  ['6', 'agri'], ['731', 'art'], ['732', 'comm'], ['751', 'agri'], ['753', 'art'], ['7', 'ingenierie'], ['81', 'ingenierie'], ['82', 'ingenierie'], ['92', 'agri']
];
const EXTRA = { '2250': ['sante'], '324': ['sante'], '2631': ['sciences'], '262': ['comm'], '352': ['tech'], '732': ['ingenierie'], '2161': ['ingenierie'], '1330': ['business'], '1342': ['business'], '1343': ['business'], '1345': ['business'], '132': ['business'], '131': ['business'] };
function domsOf(isco) {
  const s = String(isco || ''); const out = [];
  for (const [p, d] of DOM_RULES) if (s.startsWith(p)) { out.push(d); for (const [q, more] of Object.entries(EXTRA)) if (p === q) out.push(...more); break; }
  return [...new Set(out)];
}

/* ---------- 4. Construction ---------- */
const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
const letters = {};
for (const f of fs.readdirSync(OUT)) if (/^[A-N]\.json$/.test(f)) letters[f[0]] = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
const search = fs.existsSync(path.join(OUT, 'search.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'search.json'), 'utf8')) : {};
/* Niveau OIT aussi pour les fiches ROME reliées à ESCO */
let romeSl = 0;
for (const m of index.m) {
  m[5] = m[5] || '';
  const f = letters[m[2]] && letters[m[2]][m[0]];
  const isco = f && f.esco && f.esco.fr && f.esco.fr.i;
  m[6] = isco ? skillLevel(isco) : '';
  if (m[6]) romeSl++;
}
const linked = new Set(Object.values(cache.match).map((x) => x.uri).filter(Boolean));
const all = await listAll();
const todo = [...all].filter((u) => !linked.has(u));
log('ESCO (monde) : métiers ESCO', all.size, '| déjà reliés au ROME', linked.size, '| à ajouter', todo.length);

let k = 0, done = 0, stopped = false;
const got = {};
async function worker() {
  while (k < todo.length) {
    if (Date.now() > DEADLINE) { stopped = true; break; }
    const u = todo[k++];
    const d = await detail(u);
    if (d && d.fr && d.fr.t) got[u] = d;
    if (++done % 200 === 0) { log('  ', done, '/', todo.length); fs.writeFileSync(CACHE, JSON.stringify(cache)); }
    await sleep(50);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

/* Codes et fichiers : un fichier par sous-grand groupe de l'OIT (2 chiffres), lettre « Z » + groupe */
const used = new Set(index.m.map((m) => m[0]));
const files = {}, byUnit = {}, added = [], unitNames = {};
for (const [u, d] of Object.entries(got)) {
  const isco = d.fr.i || (d.code || '').split('.')[0];
  if (!/^\d{4}$/.test(isco)) continue;
  let code = 'E' + (d.code || isco + '.' + u.slice(-6));
  if (used.has(code)) code += '-' + u.slice(-4);
  used.add(code);
  const L = 'Z' + isco.slice(0, 2);
  const fiche = {
    t: d.fr.t, src: 'esco',
    d: d.fr.d ? [d.fr.d] : [],
    ap: d.fr.a.filter((x) => norm(x) !== norm(d.fr.t) && !genderVariant(x, d.fr.t)).slice(0, 8),
    sf: d.fr.s, sv: d.fr.o,
    esco: { u, q: 1, fr: { t: d.fr.t, d: d.fr.d, i: isco, il: d.fr.il, s: d.fr.s }, en: { t: d.en.t, d: d.en.d, i: isco, il: d.en.il, s: d.en.s, o: d.en.o } },
    mob: []
  };
  (files[L] = files[L] || {})[code] = fiche;
  (byUnit[isco] = byUnit[isco] || []).push(code);
  added.push([code, d.fr.t, L, -1, domsOf(isco), d.en.t || '', skillLevel(isco), isco]);
  if (!unitNames[isco] && d.fr.il) unitNames[isco] = [masc(d.fr.il), masc(d.en.il || '')];
  search[code] = norm([d.fr.t].concat(d.fr.a, [d.en.t], d.en.a, [d.fr.il, d.en.il]).join(' | '));
}
/* Métiers proches : les autres métiers du même groupe de l'OIT (4 chiffres), fiches ROME reliées comprises */
for (const m of index.m) {
  const f = letters[m[2]] && letters[m[2]][m[0]];
  const isco = f && f.esco && f.esco.fr && f.esco.fr.i;
  if (isco && byUnit[isco]) byUnit[isco].push(m[0]);
}
for (const [L, obj] of Object.entries(files)) {
  for (const [code, f] of Object.entries(obj)) f.mob = (byUnit[f.esco.fr.i] || []).filter((c) => c !== code).slice(0, 8);
}
/* Noms des sous-grands groupes (pour l'étiquette de domaine) */
const doms = index.domaines.filter((g) => !/^Z/.test(g.c));
for (const L of Object.keys(files).sort()) {
  const g = await groupLabel(L.slice(1));
  doms.push({ c: L, l: g.fr || ('CITP ' + L.slice(1)), le: g.en || '' });
}
index.domaines = doms;
index.isco = unitNames;   // nom du groupe de métiers de l'OIT (4 chiffres), affiché sur les métiers du monde
index.m = index.m.filter((m) => !/^E/.test(m[0])).concat(added);
index.monde = { maj: new Date().toISOString().slice(0, 10), n: added.length, total: index.m.length, source: 'ESCO — Commission européenne (classification CITP-08 de l’OIT)' };
for (const f of fs.readdirSync(OUT)) if (/^Z\d\d\.json$/.test(f)) fs.rmSync(path.join(OUT, f));
for (const [L, obj] of Object.entries(files)) fs.writeFileSync(path.join(OUT, L + '.json'), JSON.stringify(obj));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search));
fs.writeFileSync(CACHE, JSON.stringify(cache));
const per = {}; added.forEach((a) => a[4].forEach((d) => { per[d] = (per[d] || 0) + 1; }));
log('ESCO (monde) : métiers ajoutés', added.length, stopped ? '(arrêt : limite de temps, la suite au prochain passage)' : '', '| total', index.m.length, '| niveau OIT sur fiches ROME', romeSl);
log('  par domaine LERNA :', JSON.stringify(per), '| sans domaine :', added.filter((a) => !a[4].length).length, '| fichiers :', Object.keys(files).length);
for (const a of added.filter((x, i) => i % 150 === 0)) log('  ', a[0], a[1], '|', a[5], '| niveau', a[6], '|', a[4].join(','));
