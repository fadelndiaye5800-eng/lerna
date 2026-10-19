/* LERNA — nettoyage de l'annuaire (appelé par build.mjs avant l'écriture, et utilisable seul : node scripts/annuaire/nettoyage.mjs)
   1. Noms propres (ponctuation parasite en tête retirée).
   2. Doublons d'un même pays fusionnés en une seule fiche :
      - même nom (après normalisation) ;
      - ou même sigle entre parenthèses, venant de listes différentes, avec des noms proches et sans conflit de ville.
      La fiche gardée reçoit les autres reconnaissances dans x.also (ex. ANAQ-Sup + CAMES) ; une fiche Wikidata en double est retirée.
   3. Lien vers la fiche complète vérifiée par LERNA (x.lerna = identifiant de l'école dans data-schools.js) :
      même site web, même nom, ou sigle unique dans le pays — jamais en cas de doute. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'of', 'the', 'and', 'et', 'en', 'a', 'in', 'for', 'y', 'e', 'school', 'ecole', 'group', 'groupe']);
export const nkey = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w && !STOP.has(w)).join(' ');
const plain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const domain = (w) => { try { return new URL(/^https?:\/\//i.test(w) ? w : 'https://' + w).hostname.replace(/^www\d?\./, '').toLowerCase(); } catch { return ''; } };
/* Site + 1er dossier de l'adresse (uwaterloo.ca/renison ≠ uwaterloo.ca) ; un dossier de langue (/en, /fr…) ne compte pas */
const siteKey = (w) => { try { const u = new URL(/^https?:\/\//i.test(w) ? w : 'https://' + w); let p = (u.pathname.split('/')[1] || '').toLowerCase(); if (/^(en|fr|es|de|it|pt|ar|nl|home|index\.\w+|accueil|welcome)$/.test(p)) p = ''; return u.hostname.replace(/^www\d?\./, '').toLowerCase() + '|' + p; } catch { return ''; } };
/* Sigles écrits entre parenthèses : « (UCAD) », « (ESP 221) » → UCAD, ESP221 */
export const acronyms = (s) => [...String(s || '').matchAll(/\(([^)]{2,14})\)/g)].map((m) => m[1].replace(/[\s.\-]/g, '').toUpperCase()).filter((a) => /^[A-Z0-9]{2,10}$/.test(a) && /[A-Z]/.test(a));
const PRIO = { scorecard: 0, ofs: 1, cricos: 2, officiel: 3, deqar: 4, wikidata: 9 };
const listOf = (r) => r.s + ':' + ((r.x && r.x.l) || '');
const tokens = (s) => new Set(nkey(s).split(' ').filter((w) => w.length > 2));
const jaccard = (a, b) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let i = 0; A.forEach((w) => { if (B.has(w)) i++; }); return i / (A.size + B.size - i); };
const mentions = (r, city) => !city || plain(r.n + ' ' + (r.v || '') + ' ' + (r.a || '')).includes(plain(city));
const cityConflict = (a, b) => (a.v && !mentions(b, a.v)) || (b.v && !mentions(a, b.v));

function absorb(keep, other) {
  keep.x = keep.x || {};
  if (other.s !== 'wikidata') {
    const also = keep.x.also || (keep.x.also = []);
    if (!also.some((o) => o.i === other.i)) also.push({ i: other.i, s: other.s, l: other.x && other.x.l, acc: other.x && other.x.acc, warn: other.x && other.x.warn ? 1 : undefined, n: other.n !== keep.n ? other.n : undefined });
    for (const o of (other.x && other.x.also) || []) if (!also.some((z) => z.i === o.i)) also.push(o);
  } else {
    const ids = keep.x.ids || (keep.x.ids = []);
    ids.push(other.i);
  }
  if (!keep.w && other.w) keep.w = other.w;
  if (!keep.v && other.v) keep.v = other.v;
  if (!keep.r && other.r) keep.r = other.r;
  if (!keep.t && other.t) keep.t = other.t;
}

/* rows : fiches d'un pays (même format que assets/annuaire/XX.json) ; schools : écoles LERNA du même pays */
export function nettoyerPays(rows, schools) {
  const st = { noms: 0, doublons: 0, sigles: 0, lerna: 0 };
  for (const r of rows) {
    const n = String(r.n || '').replace(/^[\s:;,.\-–—_*·]+/, '').replace(/\s+/g, ' ').trim();
    if (n !== r.n) { r.n = n; st.noms++; }
    if (r.x && r.x.lerna) delete r.x.lerna;
  }
  let list = rows.filter((r) => r.n).sort((a, b) => (PRIO[a.s] ?? 5) - (PRIO[b.s] ?? 5));

  /* 2a. Même nom normalisé */
  const byName = new Map(), out = [];
  for (const r of list) {
    const k = nkey(r.n);
    const keep = k.length >= 4 ? byName.get(k) : null;
    if (keep && listOf(keep) !== listOf(r) || keep && keep.s === 'wikidata' || keep && r.s === 'wikidata') { absorb(keep, r); st.doublons++; continue; }
    if (k.length >= 4 && !keep) byName.set(k, r);
    out.push(r);
  }
  list = out;

  /* 2b. Même site web : une fiche Wikidata qui double une fiche officielle est retirée */
  const byDom = new Map();
  for (const r of list) if (r.s !== 'wikidata' && r.w) { const d = siteKey(r.w); if (d && !byDom.has(d)) byDom.set(d, r); }
  list = list.filter((r) => {
    if (r.s !== 'wikidata' || !r.w) return true;
    const d = siteKey(r.w);
    const keep = d && byDom.get(d); if (!keep) return true;
    absorb(keep, r); st.doublons++; return false;
  });

  /* 2c. Même sigle entre parenthèses, listes différentes (une fiche par liste), noms proches, pas de conflit de ville */
  const byAcr = new Map();
  for (const r of list) for (const a of acronyms(r.n)) (byAcr.get(a) || byAcr.set(a, []).get(a)).push(r);
  const gone = new Set();
  for (const [, g] of byAcr) {
    if (g.length < 2) continue;
    const lists = g.map(listOf);
    if (new Set(lists).size !== g.length) continue;          // deux fiches d'une même liste avec ce sigle : ambigu
    const keep = g[0];
    for (const o of g.slice(1)) {
      if (gone.has(o.i) || gone.has(keep.i)) continue;
      if (jaccard(keep.n, o.n) < 0.5 || cityConflict(keep, o)) continue;
      absorb(keep, o); gone.add(o.i); st.sigles++;
    }
  }
  list = list.filter((r) => !gone.has(r.i));

  /* 3. Lien vers la fiche LERNA vérifiée */
  for (const s of schools || []) {
    const sd = siteKey(s.site), parts = String(s.nom).split(/\s+[—–-]\s+/).map(nkey).filter((k) => k.length >= 4);
    const sAcr = new Set(acronyms(s.nom));
    const pre = String(s.nom).split(/\s+[—–]\s+/)[0];
    if (pre && pre !== s.nom && /^[A-Za-zÀ-ÿ0-9]{2,10}$/.test(pre)) sAcr.add(pre.toUpperCase());
    String(s.nom).split(/\s+/).forEach((w) => { if (/^[A-Za-z]{4,10}$/.test(w)) sAcr.add(w.toUpperCase()); });
    const hit = new Set();
    for (const r of list) {
      if (sd && r.w && siteKey(r.w) === sd) hit.add(r);
      else if (parts.includes(nkey(r.n)) || (r.a && parts.includes(nkey(r.a)))) hit.add(r);
    }
    /* Sigle : seulement s'il désigne une seule fiche du pays, sans conflit de ville */
    for (const a of sAcr) {
      const g = list.filter((r) => acronyms(r.n).includes(a) && !(r.v && s.ville && !mentions({ n: s.nom, v: s.ville }, r.v) && !mentions(r, s.ville)));
      if (g.length && new Set(g.map(listOf)).size === g.length) g.forEach((r) => hit.add(r));   // une fiche par liste au plus
    }
    for (const r of hit) { r.x = r.x || {}; r.x.lerna = s.id; st.lerna++; }
  }
  return { rows: list, st };
}

/* Écoles LERNA (assets/js/data-schools.js), groupées par pays */
export function lernaSchools(root) {
  const ctx = { window: {}, console }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/data-schools.js'), 'utf8'), ctx);
  const by = {};
  for (const s of ctx.window.LERNA_SCHOOLS || []) if (s.type !== 'online' && /^[A-Z]{2}$/.test(s.pays)) (by[s.pays] = by[s.pays] || []).push({ id: s.id, nom: s.nom, site: s.site, ville: s.ville });
  return by;
}

/* Utilisation seule : nettoie les fichiers déjà publiés (assets/annuaire) et met l'index à jour */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const OUT = path.join(root, 'assets/annuaire');
  const schools = lernaSchools(root);
  const idx = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
  const tot = { noms: 0, doublons: 0, sigles: 0, lerna: 0 };
  let total = 0;
  for (const f of fs.readdirSync(OUT).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
    const cc = f.slice(0, 2);
    const { rows, st } = nettoyerPays(JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')), schools[cc]);
    rows.sort((a, b) => (a.s === 'wikidata') - (b.s === 'wikidata') || a.n.localeCompare(b.n, 'fr'));
    fs.writeFileSync(path.join(OUT, f), JSON.stringify(rows));
    idx.countries[cc] = { n: rows.length, o: rows.filter((r) => r.s !== 'wikidata').length };
    total += rows.length;
    for (const k of Object.keys(tot)) tot[k] += st[k];
  }
  idx.total = total;
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(idx));
  console.log('nettoyage', JSON.stringify(tot), 'total', total);
}
