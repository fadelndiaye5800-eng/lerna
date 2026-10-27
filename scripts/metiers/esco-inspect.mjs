/* Inspection ponctuelle : correspondance ROME ↔ ESCO et API ESCO (supprimé ensuite) */
const out = [];
const log = (...a) => { out.push(a.join(' ')); console.log(...a); };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const get = async (u, txt) => { const r = await fetch(u, { headers: { Accept: txt ? 'text/csv,text/plain,*/*' : 'application/json', 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8', Referer: 'https://esco.ec.europa.eu/fr/use-esco/download' } }); log('GET', r.status, u.slice(0, 140)); return txt ? r.text() : r.json(); };
try {
  let csv = await get('https://esco.ec.europa.eu/system/files/2023-03/FR_20230104_mapping_esco_rome.csv', true);
  if (/<HTML|<html/.test(csv.slice(0, 200))) { const { execSync } = await import('node:child_process'); csv = execSync('curl -sSL -A "' + UA + '" -H "Accept: text/csv,*/*" "https://esco.ec.europa.eu/system/files/2023-03/FR_20230104_mapping_esco_rome.csv"').toString(); log('curl taille', csv.length); }
  const lines = csv.split(/\r?\n/);
  log('CSV lignes', lines.length); log(lines.slice(0, 8).join('\n'));
  const m1805 = lines.filter((l) => l.includes('M1805')).slice(0, 5); log('M1805 :\n' + m1805.join('\n'));
  const j1102 = lines.filter((l) => l.includes('J1102')).slice(0, 3); log('J1102 :\n' + j1102.join('\n'));
  let uri = (m1805[0] || '').match(/http:\/\/data\.europa\.eu\/esco\/occupation\/[0-9a-f-]+/);
  /* recherche ESCO en secours */
  const sr = await get('https://ec.europa.eu/esco/api/search?text=' + encodeURIComponent('développeur informatique') + '&type=occupation&language=fr&limit=5');
  const hits = ((sr._embedded || {}).results || []).map((h) => h.title + ' | ' + h.uri); log('SEARCH', hits.join('\n'));
  if (!uri && hits[0]) uri = [hits[0].split(' | ')[1]];
  if (uri) {
    for (const lg of ['fr', 'en']) {
      const o = await get('https://ec.europa.eu/esco/api/resource/occupation?uri=' + encodeURIComponent(uri[0]) + '&language=' + lg);
      log('\nOCC ' + lg + ' keys', Object.keys(o).join(','));
      log('title', JSON.stringify(o.title || o.preferredLabel).slice(0, 300));
      log('description', JSON.stringify(o.description).slice(0, 800));
      log('code', o.code, '| links', Object.keys(o._links || {}).join(','));
      log('broaderIscoGroup', JSON.stringify((o._links || {}).broaderIscoGroup).slice(0, 600));
      log('essential skills n', ((o._links || {}).hasEssentialSkill || []).length, JSON.stringify(((o._links || {}).hasEssentialSkill || []).slice(0, 3)).slice(0, 500));
    }
  }
  const isco = await get('https://ec.europa.eu/esco/api/resource/concept?uri=' + encodeURIComponent('http://data.europa.eu/esco/isco/C2512') + '&language=fr');
  log('\nISCO 2512', JSON.stringify(isco.title || isco.preferredLabel).slice(0, 300), '|', JSON.stringify(isco.description).slice(0, 400));
  const isco2 = await get('https://ec.europa.eu/esco/api/resource/concept?uri=' + encodeURIComponent('http://data.europa.eu/esco/isco/C2') + '&language=fr');
  log('ISCO 2', JSON.stringify(isco2.title || isco2.preferredLabel).slice(0, 300), '|', JSON.stringify(isco2.description).slice(0, 900));
} catch (e) { log('ERREUR', e.message); }
import fs from 'node:fs';
/* Les fichiers du ROME contiennent-ils des codes ESCO ou ISCO ? */
try {
  const { execSync } = await import('node:child_process');
  execSync('mkdir -p /tmp/r && cd /tmp/r && curl -sSL -o r.zip "https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/json" && unzip -o -q r.zip');
  const L9 = new TextDecoder('iso-8859-15');
  for (const f of fs.readdirSync('/tmp/r').filter((x) => /referentiel_(appellation|code_rome)/.test(x))) {
    const t = L9.decode(fs.readFileSync('/tmp/r/' + f));
    log('\n' + f + ' ' + t.length + ' | esco:', (t.match(/esco/gi) || []).length, '| isco:', (t.match(/isco/gi) || []).length, '| ogr:', (t.match(/ogr/gi) || []).length);
    log(t.slice(0, 900));
  }
  const fm = L9.decode(fs.readFileSync('/tmp/r/' + fs.readdirSync('/tmp/r').find((x) => /fiche_emploi_metier/.test(x))));
  log('fiche : esco', (fm.match(/esco/gi) || []).length, '| isco', (fm.match(/isco/gi) || []).length);
} catch (e) { log('ROME ERR', e.message); }
/* Champ « codes » et note « profession réglementée » d'ESCO */
try {
  const o = await get('https://ec.europa.eu/esco/api/resource/occupation?uri=' + encodeURIComponent('http://data.europa.eu/esco/occupation/a7c1d23d-aeca-4bee-9a08-5993ed98b135') + '&language=fr');
  log('codes', JSON.stringify(o.codes).slice(0, 400)); log('regulated', JSON.stringify((o._links || {}).regulatedProfessionNote).slice(0, 400));
  log('desc fr', JSON.stringify((o.description || {}).fr).slice(0, 400));
  const med = await get('https://ec.europa.eu/esco/api/search?text=' + encodeURIComponent('médecin généraliste') + '&type=occupation&language=fr&limit=3');
  log('med', JSON.stringify(((med._embedded || {}).results || []).map((h) => h.title + ' ' + h.uri)));
  const tot = await get('https://ec.europa.eu/esco/api/search?type=occupation&language=fr&limit=1&text=');
  log('total occupations', tot.total);
} catch (e) { log('ESCO ERR', e.message); }
fs.writeFileSync('scripts/metiers/esco-inspect-log.txt', out.join('\n'));
