/* Inspection ponctuelle des jeux Onisep (structure des fichiers) — supprimé après la construction du vrai script */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const sets = ['ideo-fiches-metiers', 'ideo-metiers-onisep', 'ideo-fiches-formations'];
for (const s of sets) {
  const meta = await (await fetch('https://www.data.gouv.fr/api/1/datasets/' + s + '/')).json();
  console.log('\n######## ' + s + ' | licence=' + meta.license + ' | maj=' + meta.last_modified);
  for (const r of meta.resources || []) console.log('  RES', r.format, r.filesize, r.title, r.url);
}
const meta = await (await fetch('https://www.data.gouv.fr/api/1/datasets/ideo-fiches-metiers/')).json();
const zipRes = (meta.resources || []).find((r) => /zip/i.test(r.format || r.url));
fs.mkdirSync('/tmp/fm', { recursive: true });
execSync('curl -sSL -o /tmp/fm/f.zip "' + zipRes.url + '" && cd /tmp/fm && unzip -o -q f.zip && ls -la /tmp/fm | head -20', { stdio: 'inherit' });
const xml = execSync('ls /tmp/fm/*.xml | head -1').toString().trim();
const txt = fs.readFileSync(xml, 'utf8');
console.log('\nXML size', txt.length, 'fiches ~', (txt.match(/<metier>/g) || []).length);
console.log(txt.slice(0, 7000));
const i = txt.indexOf('<metier>', 200000); console.log('\n---- autre fiche ----\n' + txt.slice(i, i + 5000));
const m2 = await (await fetch('https://www.data.gouv.fr/api/1/datasets/ideo-metiers-onisep/')).json();
for (const r of m2.resources || []) {
  if (!/csv|json/i.test(r.format || '')) continue;
  const t = await (await fetch(r.url)).text();
  console.log('\n######## ' + r.title + ' (' + r.format + ') lignes=' + t.split('\n').length);
  console.log(t.split('\n').slice(0, 6).join('\n').slice(0, 3000));
}
