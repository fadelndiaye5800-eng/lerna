/* Métiers et débouchés : fiches métiers officielles de France Travail (ROME 4.0, Licence Ouverte 2.0).
   Source : https://www.data.gouv.fr/datasets/58da857388ee384902e505f5/ — « Toutes les données du ROME » (JSON).
   Sortie :
   - assets/metiers/index.json : liste légère (code, intitulé, grand domaine, niveau d'études) + domaines + centres d'intérêt
   - assets/metiers/<lettre>.json : fiches complètes d'un grand domaine (définition, accès, compétences, conditions, métiers proches)
   Rien n'est inventé : tout vient du ROME ; seul le classement vers les 10 domaines LERNA est fait ici (liste plus bas). */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'assets/metiers';
const URL_JSON = 'https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/json';
const TMP = '/tmp/rome';
const log = (...a) => console.log(...a);

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
execSync('curl -sSL --retry 3 -o ' + TMP + '/rome.zip "' + URL_JSON + '" && cd ' + TMP + ' && unzip -o -q rome.zip', { stdio: 'inherit' });
const files = fs.readdirSync(TMP);
const pick = (re) => { const f = files.find((x) => re.test(x)); if (!f) throw new Error('fichier absent : ' + re); return path.join(TMP, f); };
/* Les fichiers JSON du ROME sont en ISO-8859-15 (« œ » = 0xBD) ; on lit en UTF-8 seulement si c'est vraiment de l'UTF-8 */
const L9 = new TextDecoder('iso-8859-15');
const text = (f) => { const b = fs.readFileSync(f); const u = b.toString('utf8'); return u.includes('\uFFFD') ? L9.decode(b) : u; };
const readJson = (f) => JSON.parse(text(f));
const vtxt = fs.existsSync(path.join(TMP, 'version.txt')) ? text(path.join(TMP, 'version.txt')) : '';
const version = ((vtxt.match(/Titre\/commentaire\s*:\s*([^\n]+)/) || [])[1] || '').trim();
const published = ((vtxt.match(/Date de publication\s*:\s*([0-9/]+)/) || [])[1] || '').trim();
const fiches = readJson(pick(/fiche_emploi_metier/));
const arbo = readJson(pick(/arborescence_principale/)).arbo_principale;
const ci = readJson(pick(/arborescence_centre_interet/)).arbo_centre_interet;
/* Métier réglementé en France (« emploi_reglemente » du référentiel des codes ROME) */
const REG = {}, TRANS = {};
for (const r of readJson(pick(/referentiel_code_rome/))) {
  if (!r.code_rome) continue;
  if (r.emploi_reglemente === 'O') REG[r.code_rome] = 1;
  /* Transitions (ROME) : emploi vert ou stratégique pour l'écologie, métier lié au numérique */
  const eco = /vert|stratégique/i.test(r.transition_eco || '') ? 1 : 0, num = r.transition_num === 'O' ? 1 : 0;
  if (eco || num) TRANS[r.code_rome] = { e: eco, n: num };
}
/* Toutes les appellations (noms du métier, ~11 000) pour la recherche */
const APPS = {};
for (const a of readJson(pick(/referentiel_appellation/))) {
  const c = a.code_rome_parent; if (!c) continue;
  (APPS[c] = APPS[c] || []).push(a.libelle_court || a.libelle);
}
log('Appellations :', Object.values(APPS).reduce((n, x) => n + x.length, 0), '| transitions :', Object.keys(TRANS).length);
log('Métiers réglementés (France) :', Object.keys(REG).length);
const list = Array.isArray(fiches) ? fiches : (fiches.fiches_emploi_metier || fiches.fiche_emploi_metier || Object.values(fiches)[0]);
log('ROME', version, '| fiches :', list.length, '| grands domaines :', arbo.length, '| centres d’intérêt :', ci.length);

/* Clés présentes dans les fiches (pour voir ce que le ROME publie) */
const keys = {};
list.forEach((f) => Object.keys(f).forEach((k) => { keys[k] = (keys[k] || 0) + 1; }));
log('Champs des fiches :', JSON.stringify(keys));
const ex = list.find((f) => f.rome && f.rome.code_rome === 'M1805') || list[0];
log('mobilites (brut) :', JSON.stringify(ex.mobilites).slice(0, 900));
log('secteurs_activite (brut) :', JSON.stringify(ex.secteurs_activite).slice(0, 600));

/* Grand domaine et domaine professionnel de chaque code */
const where = {};
const doms = [];
for (const g of arbo) {
  const subs = [];
  for (const d of g.liste_domaine_prof || []) {
    subs.push({ c: d.code_metier, l: d.libelle });
    for (const m of d.liste_metier || []) where[m.code_rome] = { g: g.code_metier, d: d.code_metier, dl: d.libelle };
  }
  doms.push({ c: g.code_metier, l: g.libelle, s: subs });
}
log('\nDomaines professionnels :');
doms.forEach((g) => log(g.c, g.l, '\n   ' + g.s.map((s) => s.c + ' ' + s.l).join(' | ')));

/* Classement vers les 10 domaines LERNA (questionnaire et Explorer) : par domaine professionnel du ROME, puis par mots de l'intitulé */
const BY_DOM = {
  business: ['C', 'D', 'G', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'N1', 'K15', 'K18'],
  sante: ['J'],
  tech: ['M18'],
  droit: ['K19', 'K14', 'K15'],   // droit, administration publique, impôts, douanes, diplomatie
  art: ['B', 'L', 'E11', 'F11', 'K16'],   // K16 : culture et patrimoine
  sciences: ['K24'],
  education: ['K21', 'K12'],   // K12 : travail social et éducatif
  ingenierie: ['F', 'H', 'I'],
  comm: ['E', 'K16'],   // K16 : documentation, bibliothèques, archives
  agri: ['A']
};
const BY_WORD = {
  tech: /informati|développeur|developpeur|logiciel|données|data|cyber|réseau|numérique|web|intelligence artificielle|système d'information/i,
  droit: /jurid|avocat|notaire|magistrat|juriste|greffier|commissaire de justice|huissier|police|gendarm|pénitentiaire|douane|diplomat|ambassad|contentieux|conformité/i,
  sciences: /recherche|chercheur|chercheuse|biolog|chimi|physic|mathémati|statistic|laboratoire|scientifique|géolog|géophysic|météorolog|océanograph|hydrolog|économiste|sociolog|archéolog|historien|géographe|démograph|astronom|actuaire/i,
  education: /enseignant|professeur|formateur|formatrice|éducat|conseiller \/ conseillère d'orientation/i,
  comm: /communication|journalis|publicit|marketing|média|rédacteur|rédactrice/i,
  sante: /médecin|infirmi|pharmac|sage-femme|kinésithérap|dentiste|soignant|psycholog|addictolog|thérapeut|psychanalyst|génétique/i,
  agri: /agricol|agronom|environnement|forest|élevage|aquacult|urbanis|aménagement du territoire|durable|eaux pluviales/i,
  ingenierie: /ingénieur|ingénieure/i,
  art: /architecte|design|graphiste|styliste|artiste|musicien|photograph/i
};
function lernaDoms(code, titre) {
  const w = where[code] || {}, out = new Set();
  for (const [k, pre] of Object.entries(BY_DOM)) if (pre.some((p) => (w.d || '').startsWith(p) || w.g === p)) out.add(k);
  for (const [k, re] of Object.entries(BY_WORD)) if (re.test(titre)) out.add(k);
  return [...out];
}

/* Niveau d'études lu dans « accès au métier » : 0 = sans diplôme / CAP / BEP, 1 = Bac, 2 à 8 = Bac + n ; -1 = non précisé */
function niveau(acc) {
  const s = String(acc || '');
  const n = [...s.matchAll(/bac\s*\+\s*(\d)/gi)].map((m) => +m[1]);
  if (n.length) return Math.min(...n);
  if (/doctorat|docteur en|diplôme d'état de docteur/i.test(s)) return 8;
  if (/master|diplôme d'ingénieur/i.test(s)) return 5;
  if (/licence|bachelor/i.test(s)) return 3;
  if (/\bBTS\b|\bBUT\b|\bDUT\b|\bBTSA\b|DEUST/i.test(s)) return 2;
  if (/\bbac\b|baccalauréat|brevet professionnel|\bBP\b/i.test(s)) return 1;
  if (/\bCAP\b|\bBEP\b|sans diplôme|aucun diplôme|sans formation/i.test(s)) return 0;
  return -1;
}

/* Définition : une phrase d'introduction, puis les activités (le ROME les colle les unes aux autres) */
function activites(def) {
  const s = String(def || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  const cut = s.search(/\.\s/);
  const intro = cut > 0 ? s.slice(0, cut + 1) : s;
  const rest = cut > 0 ? s.slice(cut + 2) : '';
  /* Chaque activité commence par un verbe en majuscule après un mot en minuscule (« … clients Négocie les contrats … ») */
  const parts = rest ? rest.split(/(?<=[a-zà-ÿ0-9)’'»])\s+(?=[A-ZÀ-Ý][a-zà-ÿ]+(?:e|t|s|it|nt)\b)/) : [];
  return [intro].concat(parts.map((x) => x.trim()).filter((x) => x.length > 3));
}

const lib = (x) => (x && (x.libelle || x.intitule)) || '';
/* Métiers proches (« mobilités ») : tout code ROME cité dans l'objet */
function mobs(m) {
  const out = [], seen = new Set();
  /* Le ROME écrit « M1802 - Expert / Experte systèmes et réseaux », dans l'ordre de proximité */
  const add = (c) => { if (c && /^[A-N]\d{4}$/.test(c) && !seen.has(c)) { seen.add(c); out.push(c); } };
  const arr = Array.isArray(m) ? m.slice().sort((a, b) => (a.ordre_mobilite || 0) - (b.ordre_mobilite || 0)) : [];
  for (const x of arr) {
    const v = x && (x.rome_cible || x.code_rome_cible || x.code_rome);
    if (typeof v === 'string') add(v.split(' ')[0].trim());
    else if (v && typeof v === 'object') add(v.code_rome);
  }
  return out;
}
function secs(sx) {
  const out = [];
  const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o.libelle === 'string' && !out.includes(o.libelle)) out.push(o.libelle); for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v); };
  walk(sx); return out;
}
const items = (block, onlyCore, cat) => {
  const out = [];
  for (const e of (block && (block.enjeux || block.categories)) || []) {
    if (cat === 'dip' && !/certification|habilitation|diplôme/i.test(e.libelle || '')) continue;
    if (cat === 'sv' && /certification|habilitation|diplôme/i.test(e.libelle || '')) continue;
    for (const it of e.items || []) if (!onlyCore || it.coeur_metier) out.push(it.libelle);
  }
  return out;
};

const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+]+/g, ' ').trim();
const search = {};
const index = [], byLetter = {}, stats = { niveaux: {}, doms: {}, sansDom: 0, activites: 0 };
for (const f of list) {
  const code = f.rome && f.rome.code_rome, titre = f.rome && f.rome.intitule;
  if (!code || !titre) continue;
  const w = where[code] || {};
  const acc = f.acces_metier || '';
  const nv = niveau(acc);
  const d = lernaDoms(code, titre);
  stats.niveaux[nv] = (stats.niveaux[nv] || 0) + 1;
  d.forEach((k) => { stats.doms[k] = (stats.doms[k] || 0) + 1; });
  if (!d.length) stats.sansDom++;
  const act = activites(f.definition);
  stats.activites += act.length;
  const comp = f.competences || {};
  const sfCore = items(comp.savoir_faire, true), sfAll = items(comp.savoir_faire, false);
  const fiche = {
    t: titre,
    ap: (f.appellations || []).map((a) => a.libelle_court || a.libelle).filter((x) => x && x !== titre).slice(0, 6),
    d: act,
    acc: acc,
    sf: (sfCore.length >= 4 ? sfCore : sfAll).slice(0, 10),
    se: items(comp.savoir_etre_professionnel, false).slice(0, 8),
    sv: (items(comp.savoirs, true, 'sv').length ? items(comp.savoirs, true, 'sv') : items(comp.savoirs, false, 'sv')).slice(0, 8),
    dip: items(comp.savoirs, false, 'dip').slice(0, 8),
    ctx: (f.contextes_travail || []).map((c) => ({ l: c.libelle, i: (c.items || []).map(lib).slice(0, 6) })).filter((c) => c.i.length).slice(0, 6),
    mob: mobs(f.mobilites).filter((c) => c !== code).slice(0, 8),
    sec: secs(f.secteurs_activite).slice(0, 5),
    dp: w.dl || '',
    rg: REG[code] ? 1 : 0,
    tr: TRANS[code] || null
  };
  const L = (w.g || code[0]);
  (byLetter[L] = byLetter[L] || {})[code] = fiche;
  index.push([code, titre, L, nv, d]);
  /* Texte de recherche : appellations, domaine professionnel, secteurs (sans accents, en minuscules) */
  search[code] = norm([titre].concat(APPS[code] || [], [w.dl || ''], fiche.sec || []).join(' | '));
}
index.sort((a, b) => a[1].localeCompare(b[1], 'fr'));
log('\nNiveaux :', JSON.stringify(stats.niveaux), '| domaines LERNA :', JSON.stringify(stats.doms), '| sans domaine LERNA :', stats.sansDom, '| activités :', stats.activites);

/* Centres d'intérêt (« J'ai envie de… ») : libellé, définition, codes des métiers */
const interets = ci.map((c, i) => ({ id: i + 1, l: c.libelle_centre_interet, d: c.definition_centre_interet || '', m: (c.liste_metier || []).map((m) => m.code_rome).filter(Boolean) }));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const now = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
  maj: now, version, publie: published, source: 'France Travail — Répertoire opérationnel des métiers et des emplois (ROME 4.0), Licence Ouverte 2.0',
  sourceUrl: 'https://www.data.gouv.fr/datasets/58da857388ee384902e505f5/',
  domaines: doms.map((g) => ({ c: g.c, l: g.l })), interets, m: index
}));
for (const [L, obj] of Object.entries(byLetter)) fs.writeFileSync(path.join(OUT, L + '.json'), JSON.stringify(obj));
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search));
log('\nPublié :', index.length, 'métiers,', Object.keys(byLetter).length, 'fichiers de domaine,', interets.length, 'centres d’intérêt');
for (const f of fs.readdirSync(OUT)) log('  ', f, fs.statSync(path.join(OUT, f)).size, 'octets');

/* Exemples pour contrôle humain */
for (const code of ['M1805', 'J1102', 'K2107', 'C1129', 'M1203']) {
  const L = where[code] ? where[code].g : code[0];
  const x = byLetter[L] && byLetter[L][code];
  if (x) log('\n== ' + code + ' ' + x.t + ' | niveau ' + niveau(x.acc) + '\n' + JSON.stringify(x, null, 1).slice(0, 2500));
}
