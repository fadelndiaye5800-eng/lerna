/* LERNA — construction de l'annuaire mondial des établissements (lancé chaque mois par GitHub Actions).
   Uniquement des registres publics dont la réutilisation est autorisée :
   - DEQAR (EQAR) : établissements évalués par une agence qualité enregistrée — métadonnées sous ODC PDDL (domaine public)
   - College Scorecard (Département de l'Éducation des États-Unis) : établissements, accréditeur reconnu, frais officiels — domaine public
   - Office for Students (Angleterre) : registre légal des établissements — Open Government Licence v3
   - CRICOS (Australie) : établissements autorisés à accueillir des étudiants étrangers, coûts déclarés des formations — CC BY 2.5 AU
   - Wikidata : annuaire public pour les autres pays (CC0) — signalé comme « non vérifié », jamais présenté comme une accréditation
   La France n'est pas ici : Explorer lit Parcoursup en direct.
   Sortie : assets/annuaire/index.json + assets/annuaire/<PAYS>.json (tableaux compacts). */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';

const OUT = path.resolve('assets/annuaire');
const TMP = path.resolve('.annuaire-tmp');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const UA = { 'User-Agent': 'LERNA-annuaire/1.0 (+https://lerna-lilac.vercel.app; student orientation directory)' };   // ASCII seulement (en-tête HTTP)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const clean = (s, n = 160) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const url = (w) => { w = clean(w, 300); if (!w || /^(null|na|n\/a|none|not applicable)$/i.test(w)) return ''; if (!/^https?:\/\//i.test(w)) w = 'https://' + w; try { const u = new URL(w); return /\./.test(u.hostname) ? u.href : ''; } catch { return ''; } };
const domain = (w) => { try { return new URL(w).hostname.replace(/^www\d?\./, '').toLowerCase(); } catch { return ''; } };
async function getJSON(u, opt = {}) {
  for (let t = 0; t < 4; t++) {
    try { const r = await fetch(u, { headers: { ...UA, Accept: 'application/json', ...(opt.headers || {}) } }); if (r.status === 429 || r.status >= 500) { await wait(5000 * (t + 1)); continue; } return await r.json(); }
    catch { await wait(4000 * (t + 1)); }
  }
  return null;
}
async function download(u, file, headers) {
  const r = await fetch(u, { headers: headers || UA });
  if (!r.ok) throw new Error('download ' + r.status + ' ' + u);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}
const all = [];
const stats = {};
const errors = {};
const add = (src, rows) => { all.push(...rows); stats[src] = rows.length; log(src, rows.length); };

/* ---------- 1. DEQAR (Europe et partenaires) ---------- */
async function deqar() {
  const rows = [];
  const B = 'https://backend.deqar.eu/connectapi/v1/institutions/';
  for (let off = 0; off < 20000; off += 500) {
    const j = await getJSON(B + '?limit=500&offset=' + off);
    if (!j || !Array.isArray(j.results) || !j.results.length) break;
    for (const x of j.results) {
      if (x.closure_date) continue;
      const loc = (x.locations || []).find((l) => !l.country_valid_to) || (x.locations || [])[0] || {};
      let cc = loc.country && loc.country.iso_3166_alpha2; if (!cc) continue;
      let region = '';
      const m = /^([A-Z]{2})-(.+)$/.exec(cc);
      if (m) { region = { ENG: 'Angleterre', WLS: 'Pays de Galles', SCT: 'Écosse', NIR: 'Irlande du Nord', fr: 'Fédération Wallonie-Bruxelles', fl: 'Communauté flamande', de: 'Communauté germanophone' }[m[2]] || ''; cc = m[1]; }
      if (!/^[A-Z]{2}$/.test(cc)) continue;
      const n0 = (x.names || [])[0] || {};
      rows.push({ i: 'deqar:' + x.id, s: 'deqar', p: cc, n: clean(x.name_primary), a: clean(n0.name_english && n0.name_english !== x.name_primary ? n0.name_english : n0.acronym || ''), v: clean(loc.city, 60), r: region, w: url(x.website_link), x: { d: x.deqar_id, o: x.is_other_provider ? 1 : 0 } });
    }
    if (off + 500 >= j.count) break;
    await wait(800);
  }
  add('deqar', rows);
}

/* ---------- 2. États-Unis : College Scorecard ---------- */
async function scorecard() {
  /* Le lien change à chaque publication : on le lit sur la page des données, sinon on essaie le dernier connu */
  let zip = '';
  try {
    const page = await (await fetch('https://collegescorecard.ed.gov/data/', { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LERNA-annuaire/1.0)' } })).text();
    zip = (page.match(/https:\/\/[^"'\s]*Most-Recent-Cohorts-Institution[^"'\s]*\.zip/) || [])[0] || '';
  } catch { /* page indisponible */ }
  const tries = [zip, 'https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_10152026.zip'].filter(Boolean);
  let f = null, lastErr = '';
  for (const u of tries) for (const h of [{ 'User-Agent': 'curl/8.5.0', Accept: '*/*' }, { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', Accept: '*/*' }, UA]) {
    if (f) break;
    try { f = await download(u, path.join(TMP, 'sc.zip'), h); } catch (e) { lastErr = e.message; }
  }
  if (!f) return scorecardApi(lastErr);   // téléchargement refusé : on passe par l'API officielle (api.data.gov)
  execSync('unzip -o -q ' + f + ' -d ' + path.join(TMP, 'sc'));
  const csv = fs.readdirSync(path.join(TMP, 'sc')).find((x) => /Institution.*\.csv$/.test(x));
  const data = parse(fs.readFileSync(path.join(TMP, 'sc', csv)), { columns: true, skip_empty_lines: true });
  const num = (v) => { const n = Number(v); return v === '' || v === 'NULL' || v === 'PrivacySuppressed' || !isFinite(n) ? null : n; };
  const CTRL = { 1: 'public', 2: 'prive_nl', 3: 'prive_lucratif' };
  const rows = [];
  for (const r of data) {
    if (r.CURROPER !== '1' || num(r.HIGHDEG) < 3 || r.MAIN !== '1') continue;
    const acc = r.ACCREDAGENCY && r.ACCREDAGENCY !== 'NULL' ? clean(r.ACCREDAGENCY, 120) : '';
    if (!acc) continue;   // seulement les établissements avec un accréditeur reconnu
    rows.push({ i: 'scorecard:' + r.UNITID, s: 'scorecard', p: 'US', n: clean(r.INSTNM), a: r.ALIAS && !['NULL', 'NA'].includes(r.ALIAS) ? clean(r.ALIAS, 80) : '', v: clean(r.CITY, 60), r: r.STABBR, w: url(r.INSTURL), t: CTRL[r.CONTROL] || '',
      x: { acc, u: r.UNITID, fi: num(r.TUITIONFEE_IN), fo: num(r.TUITIONFEE_OUT), ca: num(r.COSTT4_A), ad: num(r.ADM_RATE), ug: num(r.UGDS) } });
  }
  add('scorecard', rows);
}


/* API officielle College Scorecard (api.data.gov). Clé gratuite dans le secret GitHub API_DATA_GOV_KEY, sinon DEMO_KEY
   (30 requêtes par heure : il en faut ~25, à 100 établissements par page). */
async function scorecardApi(why) {
  const key = process.env.API_DATA_GOV_KEY || 'DEMO_KEY';
  const F = ['id', 'school.name', 'school.alias', 'school.city', 'school.state', 'school.school_url', 'school.ownership', 'school.accreditor', 'latest.cost.tuition.in_state', 'latest.cost.tuition.out_of_state', 'latest.cost.attendance.academic_year', 'latest.admissions.admission_rate.overall', 'latest.student.size'];
  const CTRL = { 1: 'public', 2: 'prive_nl', 3: 'prive_lucratif' };
  const rows = [];
  for (let page = 0; page < 60; page++) {
    const u = 'https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=' + key + '&school.operating=1&school.main_campus=1&school.degrees_awarded.highest__range=3..&per_page=100&page=' + page + '&fields=' + F.join(',');
    const j = await getJSON(u);
    if (!j || !Array.isArray(j.results)) { if (!rows.length) throw new Error('Scorecard API indisponible (' + why + ')'); break; }
    for (const r of j.results) {
      const acc = clean(r['school.accreditor'], 120);
      if (!acc || !r['school.name']) continue;
      const alias = clean(r['school.alias'], 80);
      rows.push({ i: 'scorecard:' + r.id, s: 'scorecard', p: 'US', n: clean(r['school.name']), a: alias && !/^(null|na)$/i.test(alias) ? alias : '', v: clean(r['school.city'], 60), r: r['school.state'], w: url(r['school.school_url']), t: CTRL[r['school.ownership']] || '',
        x: { acc, u: String(r.id), fi: r['latest.cost.tuition.in_state'] ?? null, fo: r['latest.cost.tuition.out_of_state'] ?? null, ca: r['latest.cost.attendance.academic_year'] ?? null, ad: r['latest.admissions.admission_rate.overall'] ?? null, ug: r['latest.student.size'] ?? null } });
    }
    const m = j.metadata || {};
    if ((page + 1) * 100 >= (m.total || 0)) break;
    await wait(1500);
  }
  add('scorecard', rows);
}

/* ---------- 3. Angleterre : registre de l'Office for Students ---------- */
async function ofs() {
  const f = await download('https://register-api.officeforstudents.org.uk/api/Download', path.join(TMP, 'ofs.xlsx'));
  const wb = XLSX.readFile(f);
  const data = XLSX.utils.sheet_to_json(wb.Sheets.Register || wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const hi = data.findIndex((r) => (r || []).some((c) => /legal name/i.test(String(c || ''))));
  const H = data[hi].map((h) => String(h || '').toLowerCase());
  const col = (k) => H.findIndex((h) => h.includes(k));
  const I = { n: col('legal name'), t: col('trading name'), u: col('ukprn'), a: col('contact address'), w: col('website'), c: col('category'), dap: col('highest level of degree') };
  const rows = [];
  for (const r of data.slice(hi + 1)) {
    if (!r || !r[I.n]) continue;
    const legal = clean(r[I.n]);
    const addr = String(r[I.a] || '').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !/united kingdom/i.test(s));
    const pc = addr.findIndex((s) => /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(s));
    const tn = String(r[I.t] || '');
    const trade = tn && !/not applicable/i.test(tn) ? clean(tn.split(/\r?\n/)[0]) : '';
    rows.push({ i: 'ofs:' + r[I.u], s: 'ofs', p: 'GB', n: trade || legal, a: trade && trade !== legal ? legal : '', v: clean(pc > 0 ? addr[pc - 1] : '', 60), r: 'Angleterre', w: url(r[I.w]),
      x: { u: String(r[I.u]), cat: clean(r[I.c], 40), dap: clean(r[I.dap], 40) } });
  }
  add('ofs', rows);
}

/* ---------- 4. Australie : CRICOS ---------- */
async function cricos() {
  const meta = await getJSON('https://data.gov.au/data/api/3/action/package_show?id=cricos');
  const res = (meta && meta.result && meta.result.resources) || [];
  const pick = (re) => (res.find((r) => re.test(r.name || '') && /csv/i.test(r.format || '')) || {}).url;
  const fi = await download(pick(/Institutions/i), path.join(TMP, 'cr_i.csv'));
  const fc = await download(pick(/^CRICOS Courses/i), path.join(TMP, 'cr_c.csv'));
  const rd = (f) => parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''), { columns: true, skip_empty_lines: true, relax_column_count: true });
  const inst = rd(fi), courses = rd(fc);
  const num = (v) => { const n = Number(String(v || '').replace(/[$,\s]/g, '')); return isFinite(n) && n > 0 ? n : null; };
  const by = {};
  for (const c of courses) { if (/^yes$/i.test(c.Expired || '')) continue; (by[c['CRICOS Provider Code']] = by[c['CRICOS Provider Code']] || []).push(c); }
  const HE = /Bachelor|Master|Doctoral|Graduate Diploma|Graduate Certificate|Associate Degree/i;
  const rng = (a) => (a.length ? [Math.min(...a), Math.max(...a)] : null);
  const cost = (c) => num(c['Estimated Total Course Cost']) || num(c['Tuition Fee']);
  const rows = [];
  for (const i of inst) {
    const cs = (by[i['CRICOS Provider Code']] || []).filter((c) => HE.test(c['Course Level'] || ''));
    if (!cs.length) continue;
    const city = clean(i['Postal Address City'], 60).toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
    rows.push({ i: 'cricos:' + i['CRICOS Provider Code'], s: 'cricos', p: 'AU', n: clean(i['Trading Name'] || i['Institution Name']), a: i['Trading Name'] && i['Trading Name'] !== i['Institution Name'] ? clean(i['Institution Name']) : '', v: city, r: i['Postal Address State'], w: url(i.Website),
      t: /government/i.test(i['Institution Type']) ? 'public' : 'prive',
      x: { code: i['CRICOS Provider Code'], nb: cs.length, fb: rng(cs.filter((c) => /^Bachelor/i.test(c['Course Level'])).map(cost).filter(Boolean)), fm: rng(cs.filter((c) => /^Master/i.test(c['Course Level'])).map(cost).filter(Boolean)) } });
  }
  add('cricos', rows);
}

/* ---------- 5. Wikidata (autres pays) ---------- */
async function sparql(q) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q), { headers: { ...UA, Accept: 'application/sparql-results+json' } });
      if (r.status === 429 || r.status >= 500) { await wait(10000 * (t + 1)); continue; }
      return (await r.json()).results.bindings;
    } catch { await wait(6000 * (t + 1)); }
  }
  return null;
}
async function wikidata() {
  const cs = await sparql('SELECT ?c ?cc WHERE { ?c wdt:P31 wd:Q6256; wdt:P297 ?cc. FILTER NOT EXISTS { ?c wdt:P576 ?e } }');
  const SKIP = new Set(['FR', 'US', 'GB', 'AU']);
  const list = [...new Map(cs.map((b) => [b.cc.value, b.c.value.split('/').pop()])).entries()].filter(([cc]) => !SKIP.has(cc));
  const rows = [], miss = [];
  /* 3 requêtes à la fois au maximum (règle d'usage du service Wikidata) ; libellés français, sinon anglais */
  const one = async ([cc, q]) => {
    const b = await sparql(`SELECT ?u ?uLabel ?site ?cityLabel WHERE { VALUES ?type { wd:Q3918 wd:Q875538 wd:Q902104 wd:Q38723 wd:Q1371037 wd:Q15936437 wd:Q23002054 wd:Q189004 } ?u wdt:P31 ?type; wdt:P17 wd:${q}; wdt:P856 ?site. FILTER NOT EXISTS { ?u wdt:P576 ?end } OPTIONAL { ?u wdt:P131 ?city } SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en,mul". } }`);
    if (!b) { miss.push(cc); return; }
    const seen = new Map();
    for (const x of b) {
      const id = x.u.value.split('/').pop();
      if (seen.has(id)) continue;
      const n = (x.uLabel || {}).value;
      if (!n || /^Q\d+$/.test(n)) continue;
      const city = (x.cityLabel || {}).value || '';
      seen.set(id, { i: 'wikidata:' + id, s: 'wikidata', p: cc, n: clean(n), v: /^Q\d+$/.test(city) ? '' : clean(city, 60), w: url(x.site.value), x: { q: id } });
    }
    rows.push(...seen.values());
  };
  const queue = list.slice();
  await Promise.all([1, 2, 3].map(async () => { while (queue.length) { await one(queue.shift()); await wait(500); } }));
  if (miss.length) log('wikidata : pays non lus', miss.join(','));
  add('wikidata', rows);
}

/* ---------- Lancement : une source qui échoue n'empêche pas les autres ---------- */
const prev = fs.existsSync(path.join(OUT, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')) : null;
for (const [name, fn] of [['deqar', deqar], ['scorecard', scorecard], ['ofs', ofs], ['cricos', cricos], ['wikidata', wikidata]]) {
  try { await fn(); } catch (e) { log('ÉCHEC', name, e.message); stats[name] = 0; errors[name] = String(e && e.message || e).slice(0, 300); }
}
/* Sécurité : si une source renvoie beaucoup moins que la dernière fois, on garde l'ancienne version de ses fiches */
if (prev && prev.sources) {
  for (const [src, n] of Object.entries(prev.sources)) {
    if ((stats[src] || 0) < n * 0.7) {
      log('source', src, 'en baisse (', stats[src] || 0, 'contre', n, ') : anciennes fiches conservées');
      for (const f of fs.readdirSync(OUT).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
        const old = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')).filter((r) => r.s === src);
        const keep = new Set(all.map((r) => r.i));
        for (const r of old) if (!keep.has(r.i)) all.push(r);
      }
      stats[src] = n;
    }
  }
}

/* Contrôles de cohérence :
   - un site dont l'extension désigne un autre pays (ex. .bj pour une fiche classée au Sénégal) est écarté : localisation douteuse
   - doublons (même pays, même site) : on garde la source la plus précise (frais officiels d'abord), Wikidata en dernier */
const GENERIC_CC = new Set(['io', 'co', 'ai', 'me', 'tv', 'cc', 'ly', 'fm', 'ws', 'la', 'to', 'nu', 'sh', 'gg', 'im', 'ac', 'eu', 'is', 'in', 'so', 'st', 'vc', 'ms', 'gl', 'ma', 'am', 'ag', 'bz', 'la']);
const ccMismatch = (r) => {
  const h = domain(r.w); if (!h) return false;
  const tld = h.split('.').pop();
  if (tld.length !== 2 || GENERIC_CC.has(tld)) return false;
  const c = tld === 'uk' ? 'GB' : tld.toUpperCase();
  return c !== r.p;
};
const PRIO = { scorecard: 0, ofs: 1, cricos: 2, deqar: 3, wikidata: 9 };
all.sort((a, b) => (PRIO[a.s] ?? 5) - (PRIO[b.s] ?? 5));
const final = [];
const ids = new Set(), seenDom = new Set();
let dropped = 0;
for (const r of all) {
  if (!r.n || ids.has(r.i)) continue;
  if (r.w && ccMismatch(r)) { dropped++; continue; }
  const key = r.w ? r.p + '|' + domain(r.w) + '|' + (new URL(r.w).pathname.split('/')[1] || '') : '';
  if (key && seenDom.has(key)) continue;
  if (key) seenDom.add(key);
  ids.add(r.i);
  for (const k of Object.keys(r)) if (r[k] === '' || r[k] == null) delete r[k];
  final.push(r);
}
if (final.length < 100) { log('Construction trop pauvre (', final.length, ') : rien n’est remplacé'); fs.writeFileSync(path.join(OUT, 'rapport.json'), JSON.stringify({ maj: new Date().toISOString(), sources: stats, erreurs: errors })); process.exit(0); }
const byCountry = {};
for (const r of final) (byCountry[r.p] = byCountry[r.p] || []).push(r);
for (const f of fs.readdirSync(OUT).filter((x) => /^[A-Z]{2}\.json$/.test(x))) fs.unlinkSync(path.join(OUT, f));
const countries = {};
for (const [cc, rows] of Object.entries(byCountry)) {
  rows.sort((a, b) => (a.s === 'wikidata') - (b.s === 'wikidata') || a.n.localeCompare(b.n, 'fr'));
  rows.forEach((r) => delete r.p);
  fs.writeFileSync(path.join(OUT, cc + '.json'), JSON.stringify(rows));
  countries[cc] = { n: rows.length, o: rows.filter((r) => r.s !== 'wikidata').length };
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ maj: new Date().toISOString().slice(0, 10), sources: stats, erreurs: errors, total: final.length, countries }));
log('écartés (pays du site incohérent)', dropped); log('TOTAL', final.length, 'établissements dans', Object.keys(countries).length, 'pays');
