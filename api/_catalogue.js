/* LERNA — moteur côté serveur pour l'analyse d'orientation (/api/analyze).
   Avant l'IA, il prépare une liste d'environ 40 établissements possibles pour CET élève :
   1. les fiches complètes de LERNA (data-schools.js), triées par le moteur LERNA (engine.js) ;
   2. l'annuaire des établissements reconnus officiellement (assets/annuaire), selon le pays, la langue, le budget et le domaine ;
   3. les formations françaises publiées par le ministère de l'Enseignement supérieur (données ouvertes), si la France est possible.
   Seulement des établissements reconnus officiellement : jamais Wikidata, jamais d'établissement visé par un avis officiel défavorable.
   L'IA choisit ensuite ses recommandations UNIQUEMENT dans cette liste (code C1, C2…), puis on vérifie son choix. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ODS = 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-cartographie_formations_parcoursup/records';
const BUDGET_MAX = { gratuit: 300, faible: 1500, moyen: 5000, confortable: 15000, premium: Infinity };
const CAP = { lerna: 10, annTotal: 22, annCountry: 3, annHome: 6, annMax: 12, fr: 8, countries: 12 };

/* Langue(s) d'enseignement principale(s) du pays — indicatif, pour ne proposer que des pays où l'élève peut suivre les cours */
const LANG_OF = {
  FR: 'fr', BE: 'fr nl', CH: 'fr de it', LU: 'fr de', MC: 'fr', SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr', NE: 'fr', TG: 'fr', BJ: 'fr', GN: 'fr',
  CM: 'fr en', GA: 'fr', CG: 'fr', CD: 'fr', CF: 'fr', TD: 'fr ar', MG: 'fr', DJ: 'fr ar', KM: 'fr ar', BI: 'fr', RW: 'en fr', MR: 'ar fr',
  MA: 'fr ar', DZ: 'fr ar', TN: 'fr ar', HT: 'fr', LB: 'fr en ar', MU: 'en fr', SC: 'en fr', CA: 'en fr', GP: 'fr', MQ: 'fr', GF: 'fr', RE: 'fr', YT: 'fr', NC: 'fr', PF: 'fr',
  US: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en', NG: 'en', GH: 'en', KE: 'en', UG: 'en', TZ: 'en', ZA: 'en', ZM: 'en', ZW: 'en', BW: 'en', NA: 'en',
  SL: 'en', LR: 'en', GM: 'en', ET: 'en', MW: 'en', SS: 'en', LS: 'en', SZ: 'en', IN: 'en', PK: 'en', BD: 'en', LK: 'en', NP: 'en', MY: 'en', SG: 'en',
  PH: 'en', HK: 'en zh', MT: 'en', CY: 'en', JM: 'en', TT: 'en',
  EG: 'ar en', SA: 'ar en', AE: 'en ar', QA: 'en ar', KW: 'ar en', BH: 'en ar', OM: 'ar en', JO: 'ar en', SD: 'ar', LY: 'ar', IQ: 'ar', SY: 'ar', PS: 'ar', YE: 'ar',
  DE: 'de', AT: 'de', ES: 'es', IT: 'it', PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', NL: 'nl en', TR: 'tr en', RU: 'ru', BY: 'ru', KZ: 'ru',
  CN: 'zh', TW: 'zh', JP: 'ja', KR: 'ko', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', BO: 'es', UY: 'es', PY: 'es', CU: 'es', DO: 'es',
  CR: 'es', PA: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', MD: 'ro'
};
const LANG_FR = { fr: 'français', en: 'anglais', ar: 'arabe', de: 'allemand', es: 'espagnol', pt: 'portugais', it: 'italien', nl: 'néerlandais', ru: 'russe', tr: 'turc', zh: 'chinois', ja: 'japonais', ko: 'coréen', ro: 'roumain', cs: 'tchèque', pl: 'polonais', ms: 'malais', sv: 'suédois', da: 'danois', fi: 'finnois', no: 'norvégien', hu: 'hongrois', el: 'grec' };

/* Domaines LERNA → mots du nom d'un établissement (plusieurs langues) */
const DOM_KW = {
  business: /(business|management|gestion|commerce|econom|financ|comptab|account|marketing|administration|negoce)/,
  sante: /(sante|health|medic|medec|pharma|nurs|infirm|dentai|dental|paramed|sage femme|midwi)/,
  tech: /(informati|comput|numerique|digital|technolog|data|software|telecom|reseau|cyber)/,
  droit: /(droit|\blaw\b|juridi|legal|politi)/,
  art: /(\barts?\b|design|music|musique|cinema|film|beaux|architect|fashion|mode\b|audiovis)/,
  sciences: /(scien|math|physi|chimi|chemi|biolog)/,
  education: /(educat|enseign|pedagog|teacher|normale sup|formation des maitres)/,
  ingenierie: /(ingenie|engineer|polytech|genie|mines|travaux publics|industri)/,
  comm: /(communic|journal|media|langues|lettres|languages|traduct)/,
  agri: /(agri|agro|veterin|forest|environ|halieut|rural)/
};
const UNIV = /(universit|institut national|national institute)/;
const SKIP_NAME = /(bible|biblical|theolog|seminar|rabbinical|yeshiva|divinity|alliance|consortium)/;   // formation religieuse, ou réseau d'universités (pas une école)
/* Départage stable des égalités (sinon l'ordre alphabétique favorise les noms en « A ») */
const tie = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 1000) / 1000; };
/* Domaines LERNA → mots des intitulés de formations françaises (recherche plein texte des données ouvertes) */
const FR_KW = {
  business: ['gestion', 'économie', 'commerce', 'management'], sante: ['santé', 'infirmier', 'médecine', 'pharmacie'], tech: ['informatique', 'numérique', 'réseaux'],
  droit: ['droit', 'science politique'], art: ['arts', 'design', 'musique', 'architecture'], sciences: ['mathématiques', 'physique', 'chimie', 'biologie'],
  education: ['éducation', 'enseignement'], ingenierie: ['ingénieur', 'génie', 'mécanique', 'électronique'], comm: ['communication', 'journalisme', 'langues', 'lettres'],
  agri: ['agronomie', 'agriculture', 'environnement']
};

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const join = (v) => (Array.isArray(v) ? v.filter(Boolean).join(' · ') : v || '');

function fetchT(url, ms) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal, headers: { Accept: 'application/json' } }).finally(() => clearTimeout(timer));
}
/* Fichiers du site : lus dans le paquet de la fonction quand ils y sont, sinon téléchargés depuis le site lui-même */
async function asset(rel, origin, local) {
  try { return fs.readFileSync(local || path.join(process.cwd(), rel), 'utf8'); } catch (e) { /* pas dans le paquet */ }
  if (!origin) throw new Error('asset_missing');
  const r = await fetchT(origin + '/' + rel, 8000);
  if (!r.ok) throw new Error('asset_' + r.status);
  return r.text();
}

/* Les scripts LERNA du navigateur (questions, fiches, moteur), exécutés une fois puis gardés en mémoire */
let WIN = null;
async function lernaWindow(origin) {
  if (WIN) return WIN;
  const ctx = { window: {}, console };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  const files = [
    ['assets/js/questions.js', path.join(process.cwd(), 'assets/js/questions.js')],
    ['assets/js/data-schools.js', path.join(process.cwd(), 'assets/js/data-schools.js')],
    ['assets/js/engine.js', path.join(process.cwd(), 'assets/js/engine.js')]
  ];
  for (const [rel, local] of files) vm.runInContext(await asset(rel, origin, local), ctx, { filename: rel });
  if (!ctx.window.LernaEngine || !ctx.window.LERNA_SCHOOLS) throw new Error('lerna_scripts');
  WIN = ctx.window;
  return WIN;
}
let IDX = null;
const ROWS = new Map();
async function annIndex(origin) {
  if (!IDX) IDX = JSON.parse(await asset('assets/annuaire/index.json', origin));
  return IDX;
}
async function annRows(cc, origin) {
  if (!ROWS.has(cc)) ROWS.set(cc, JSON.parse(await asset('assets/annuaire/' + cc + '.json', origin)));
  return ROWS.get(cc);
}

/* Pays possibles pour cet élève : mobilité, destinations souhaitées, langues */
function countriesFor(raw, W, idx) {
  const home = /^[A-Z]{2}$/.test(raw.q4 || '') ? raw.q4 : '';
  const dests = arr(raw.q13), mob = raw.q18;
  const all = Object.keys(idx.countries || {});
  if (!all.includes('FR')) all.push('FR');
  const cont = (c) => W.LERNA_CONTINENT(c);
  const set = new Set();
  const add = (pred) => all.forEach((c) => { if (pred(c)) set.add(c); });
  if (mob === 'non') { if (home) set.add(home); }
  else {
    if (home && (!dests.length || dests.includes('pays') || mob === 'difficile')) set.add(home);
    for (const d of dests) {
      if (d === 'europe') add((c) => cont(c) === 'europe');
      else if (d === 'afrique') add((c) => cont(c) === 'afrique');
      else if (d === 'asie') add((c) => cont(c) === 'asie');
      else if (d === 'canada') set.add('CA');
      else if (d === 'usa') set.add('US');
      else if (d === 'monde') add((c) => ['europe', 'afrique', 'asie', 'amerique-nord'].includes(cont(c)));
    }
    if (home && (!dests.length || mob === 'difficile')) add((c) => cont(c) === cont(home));
  }
  return { home, list: [...set] };
}
function langInfo(raw) {
  const lvl = raw.q5_lvl && typeof raw.q5_lvl === 'object' ? raw.q5_lvl : {};
  const langs = arr(raw.q5).filter((l) => l !== 'autre');
  return { any: !langs.length, usable: langs.filter((l) => lvl[l] !== 'deb'), fluent: langs.filter((l) => lvl[l] !== 'deb' && lvl[l] !== 'inter') };
}
function langFit(cc, L) {
  if (L.any) return 1;
  const ls = (LANG_OF[cc] || '').split(' ').filter(Boolean);
  if (ls.some((l) => L.fluent.includes(l))) return 2;
  if (ls.some((l) => L.usable.includes(l))) return 1;
  return 0;
}

/* Note d'un établissement de l'annuaire pour ce profil (null = écarté) */
function rowScore(r, ctx) {
  const x = r.x || {};
  if (!r.n || r.s === 'wikidata' || x.lerna) return null;                       // pas une liste officielle, ou déjà dans les fiches complètes
  if (x.warn || (x.also || []).some((o) => o.warn)) return null;               // avis officiel défavorable
  const hay = norm(r.n + ' ' + (r.a || ''));
  if (SKIP_NAME.test(hay) && !ctx.sectors.includes('education')) return null;
  let s = tie(r.n), dm = 0;
  for (const d of ctx.sectors) if (DOM_KW[d] && DOM_KW[d].test(hay)) dm++;
  const general = UNIV.test(hay);
  s += Math.min(dm, 2) * 6 + (general ? 6 : /college/.test(hay) ? 2 : 0);
  if (general && ctx.tight) s += 3;                                            // budget serré : les universités (souvent publiques) d'abord
  if (ctx.sectors.length && !dm && !general) s -= 8;                            // école spécialisée dans un autre domaine
  if (ctx.tight && r.t === 'public') s += 4;
  if (ctx.tight && /^prive/.test(r.t || '')) s -= 2;
  if (r.s === 'scorecard') {                                                   // frais publiés par le gouvernement américain
    if (x.fo !== null && x.fo !== undefined) { if (x.fo > ctx.max * 1.4) return null; s += x.fo <= ctx.max ? 6 : -4; }
    else if (ctx.tight) return null;
    if (x.ug > 0) s += Math.min(2, Math.log10(x.ug) / 2);                          // établissements plus grands d'abord (nombre d'étudiants publié)
  }
  if (r.s === 'cricos' && ctx.tight) return null;
  if (r.w) s += 1;
  if (r.v) s += 1;
  return s;
}
function recLabel(r, idx) {
  const x = r.x || {};
  if (r.s === 'officiel') {
    const l = idx.listes && idx.listes[x.l];
    return 'reconnu officiellement' + (l ? ' (' + (l.autorite && (l.autorite.fr || l.autorite)) + ')' : '') + (x.acc ? ' — ' + String(x.acc).slice(0, 110) : '');
  }
  return {
    deqar: 'évalué par une agence qualité européenne enregistrée (DEQAR)',
    scorecard: 'accrédité aux États-Unis' + (x.acc ? ' (' + x.acc + ')' : '') + ' — College Scorecard',
    ofs: 'inscrit au registre officiel de l’Office for Students (Angleterre)',
    cricos: 'autorisé à accueillir des étudiants étrangers (registre CRICOS, Australie)'
  }[r.s] || 'reconnu officiellement';
}
const TYPE_FR = { public: 'public', prive: 'privé', prive_nl: 'privé à but non lucratif', prive_lucratif: 'privé à but lucratif' };

/* Formations françaises (données ouvertes du ministère) : une par établissement, dans les domaines de l'élève */
async function frFormations(ctx) {
  /* Dernière année complète (comme l'Explorer : plus de 10 000 formations publiées) */
  const fa = await fetchT(ODS.replace(/\/records$/, '/facets') + '?facet=annee', 5000).then((r) => (r.ok ? r.json() : null));
  const years = ((fa && fa.facets && fa.facets[0] && fa.facets[0].facets) || []).filter((x) => x.count > 10000).map((x) => String(x.value)).sort();
  const year = years[years.length - 1];
  if (!year) return [];
  const words = [];
  ctx.sectors.forEach((d) => (FR_KW[d] || []).slice(0, ctx.sectors.length > 2 ? 2 : 4).forEach((w) => words.push(w)));
  let where = 'annee="' + String(year).replace(/"/g, '') + '"';
  if (words.length) where += ' and (' + words.slice(0, 8).map((w) => '"' + w + '"').join(' or ') + ')';
  const j = await fetchT(ODS + '?limit=100&select=gta,nm,fl,tf,etab_nom,etab_uai,commune,tc,app&where=' + encodeURIComponent(where), 6000).then((r) => (r.ok ? r.json() : null));
  const out = [], seen = new Set();
  for (const f of (j && j.results) || []) {
    if (!f.gta || !f.etab_nom || seen.has(f.etab_uai || f.etab_nom)) continue;
    const pub = /^Public/.test(f.tc || '');
    if (ctx.tight && !pub) continue;
    seen.add(f.etab_uai || f.etab_nom);
    out.push(f);
    if (out.length >= CAP.fr) break;
  }
  return out;
}

/* Liste finale. raw = réponses brutes (identifiants), lvl = niveaux de langue, lang = langue de l'élève */
export async function buildCandidates(raw, lang, origin) {
  const W = await lernaWindow(origin);
  const home0 = /^[A-Z]{2}$/.test(raw.q4 || '') ? raw.q4 : '';
  const idx = await annIndex(origin);
  const en = lang === 'en';
  const cname = (cc) => W.LERNA_COUNTRY_NAME(cc, 'fr');
  const ctx = { sectors: arr(raw.q15).filter((d) => DOM_KW[d]), max: BUDGET_MAX[raw.q17] !== undefined ? BUDGET_MAX[raw.q17] : Infinity };
  ctx.tight = ctx.max <= 1500;
  const L = langInfo(raw);
  const list = [];
  const push = (c) => { c.code = 'C' + (list.length + 1); list.push(c); };

  /* 1. Fiches LERNA vérifiées, triées par le moteur LERNA */
  const engine = W.LernaEngine.match(raw, lang, CAP.lerna);
  for (const r of engine.recos) {
    const s = W.LERNA_SCHOOL(r.id);
    if (!s) continue;
    if (raw.q18 === 'non' && s.pays !== home0 && s.type !== 'online') continue;   // ne peut pas partir : seulement son pays ou en ligne
    const verified = /≈|Pas de frais|No tuition/.test(r.frais || '');
    push({
      kind: 'lerna', name: s.nom, cc: s.pays, city: s.ville, type: s.type,
      line: s.nom + ' — ' + s.ville + ', ' + cname(s.pays) + ' · ' + (s.type === 'public' ? 'public' : s.type === 'private' ? 'privé' : 'en ligne') +
        ' · FICHE COMPLÈTE · domaines : ' + s.domaines.join(', ') + ' · langues : ' + s.langues.map((l) => LANG_FR[l] || l).join(', ') + (verified ? ' · frais publiés sur le site officiel : ' + r.frais : ' · frais : à demander à l’école'),
      fix: { id: s.id, ref: { k: 'lerna', id: s.id }, niveau: 'lerna' }
    });
  }

  /* 2. Annuaire officiel : pays possibles, classés (pays de l'élève, langue) */
  const { home, list: countries } = countriesFor(raw, W, idx);
  const ranked = countries
    .map((cc) => ({ cc, fit: langFit(cc, L), o: (idx.countries[cc] || {}).o || 0 }))
    .filter((c) => c.cc === home || c.fit > 0)
    .sort((a, b) => (b.cc === home) - (a.cc === home) || b.fit - a.fit || b.o - a.o);
  const withFR = ranked.some((c) => c.cc === 'FR');
  let fr = [];
  if (withFR) { try { fr = await frFormations(ctx); } catch (e) { fr = []; } }
  const annCountries = ranked.filter((c) => c.o > 0 && !(c.cc === 'FR' && fr.length)).slice(0, CAP.countries);
  const picks = [];
  /* Peu de pays possibles → plus d'établissements par pays (un seul pays : jusqu'à 12) */
  const per = Math.min(CAP.annMax, Math.max(CAP.annCountry, Math.ceil(CAP.annTotal / Math.max(1, annCountries.length))));
  await Promise.all(annCountries.map(async (c) => {
    let rows;
    try { rows = await annRows(c.cc, origin); } catch (e) { return; }
    const scored = rows.map((r) => ({ r, s: rowScore(r, ctx) })).filter((x) => x.s !== null).sort((a, b) => b.s - a.s);
    const seen = new Set(), keep = [];
    for (const x of scored) {                                                  // un seul campus d'un même établissement
      const k = norm(x.r.n).split(' ').slice(0, 5).join(' ');
      if (seen.has(k)) continue;
      seen.add(k); keep.push(x);
      if (keep.length >= Math.max(per, c.cc === home ? CAP.annHome : 0)) break;
    }
    keep.forEach((x) => picks.push({ cc: c.cc, r: x.r, s: x.s + (c.cc === home ? 3 : 0) + c.fit * 2 }));
  }));
  picks.sort((a, b) => b.s - a.s).slice(0, CAP.annTotal).forEach(({ cc, r }) => {
    const x = r.x || {};
    const fees = r.s === 'scorecard' && x.fo !== null && x.fo !== undefined ? ' · frais publiés (étudiant hors État) : ≈ ' + Math.round(x.fo) + ' $/an' : ' · frais : à demander à l’école';
    push({
      kind: 'ann', name: r.n, cc, city: r.v || '', type: r.t === 'public' ? 'public' : /^prive/.test(r.t || '') ? 'private' : '',
      line: r.n + ' — ' + [r.v, cname(cc)].filter(Boolean).join(', ') + (TYPE_FR[r.t] ? ' · ' + TYPE_FR[r.t] : '') + ' · ' + recLabel(r, idx) +
        ' · langue principale du pays : ' + ((LANG_OF[cc] || '').split(' ').filter(Boolean).map((l) => LANG_FR[l] || l).join(' / ') || 'à vérifier') + fees + ' · filières : à demander à l’école',
      fix: { ref: { k: 'ann', cc, id: r.i, n: r.n }, niveau: 'officiel' }
    });
  });

  /* 3. Formations françaises publiées par l'État */
  for (const f of fr) {
    const nm = join(f.nm) || join(f.fl);
    push({
      kind: 'fr', name: nm + ' — ' + f.etab_nom, cc: 'FR', city: f.commune || '', type: /^Public/.test(f.tc || '') ? 'public' : 'private',
      line: 'Formation « ' + nm + ' » — ' + f.etab_nom + ' — ' + (f.commune ? f.commune + ', ' : '') + 'France · ' + (/^Public/.test(f.tc || '') ? 'public' : 'privé') +
        ' · formation publiée par l’État français (type : ' + join(f.tf) + ')' + (f.app ? ' · apprentissage possible' : '') + ' · frais : à demander à l’école',
      fix: { ref: { k: 'fr', gta: String(f.gta), uai: f.etab_uai || '' }, niveau: 'etat' }
    });
  }
  return { list, engine, cname: (cc) => W.LERNA_COUNTRY_NAME(cc, en ? 'en' : 'fr') };
}

/* Texte de la liste pour l'IA */
export function candidatesPrompt(cat) {
  return cat.list.map((c) => c.code + ' · ' + c.line).join('\n');
}

/* Vérifie le choix de l'IA : chaque recommandation doit venir de la liste ; on reprend le vrai nom, le pays et la ville */
export function bindRecos(result, cat, lang, count) {
  const en = lang === 'en';
  const byCode = new Map(cat.list.map((c) => [c.code, c]));
  const used = new Set(), out = [];
  for (const r of result.recos || []) {
    let c = byCode.get(String(r.code || '').toUpperCase().replace(/[^C0-9]/g, ''));
    if (!c) { const k = norm(r.nom); c = cat.list.find((x) => !used.has(x.code) && k && (norm(x.name) === k || norm(x.name).startsWith(k) || k.startsWith(norm(x.name)))); }
    if (!c || used.has(c.code)) continue;
    used.add(c.code);
    const typeTxt = c.type === 'public' ? (en ? 'Public' : 'Publique') : c.type === 'private' ? (en ? 'Private' : 'Privée') : c.type === 'online' ? (en ? 'Online' : 'En ligne') : '';   // statut inconnu : on ne devine pas
    const o = { ...r, nom: c.name, pays: cat.cname(c.cc), ville: c.city || r.ville, type: typeTxt, ...c.fix };
    if (c.kind !== 'lerna') { o.frais = en ? 'Ask the school for the fees' : 'Frais à demander à l’école'; o.frais_usd = null; }
    delete o.code;
    out.push(o);
  }
  /* Pas assez de choix valides : on complète avec le moteur LERNA (fiches vérifiées) */
  for (const e of cat.engine.recos) {
    if (out.length >= count) break;
    if (out.some((o) => o.id === e.id)) continue;
    const last = out.length ? out[out.length - 1].score : 80;
    out.push({ ...e, score: Math.max(50, Math.min(e.score || 70, last - 2)), ref: { k: 'lerna', id: e.id }, niveau: 'lerna' });
  }
  return { ...result, recos: out.slice(0, count) };
}
