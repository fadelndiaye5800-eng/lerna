/* Inspection ponctuelle des jeux Onisep (structure des fichiers) — supprimé après la construction du vrai script */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { return 'ERR ' + (e.stderr || e.message).toString().slice(0, 500); } };
fs.mkdirSync('/tmp/fm', { recursive: true });
const meta = await (await fetch('https://www.data.gouv.fr/api/1/datasets/ideo-fiches-metiers/')).json();
for (const r of meta.resources) console.log('RES', r.id, r.url, r.latest);
console.log('IP', sh('curl -s https://api.ipify.org'));
const rome = await (await fetch('https://www.data.gouv.fr/api/1/datasets/?q=ROME%20fiches%20metiers&page_size=8')).json();
for (const d of rome.data || []) { console.log('\nROME?', d.slug, d.license, d.organization && d.organization.name); for (const r of (d.resources || []).slice(0, 6)) console.log('   ', r.format, r.title, r.url); }
const urls = [meta.resources[0].url, 'https://www.data.gouv.fr/api/1/datasets/r/' + meta.resources[0].id, meta.resources[0].latest].filter(Boolean);
let ok = false;
for (const u of urls) {
  console.log('\nTRY', u);
  console.log(sh('curl -sSL -A "' + UA + '" -H "Accept: */*" -H "Accept-Language: fr-FR,fr;q=0.9" -H "Referer: https://www.data.gouv.fr/" -D /tmp/fm/h.txt -o /tmp/fm/f.bin "' + u + '"; cat /tmp/fm/h.txt | head -20; ls -la /tmp/fm/f.bin; file /tmp/fm/f.bin; head -c 600 /tmp/fm/f.bin | cat -v | head -20'));
  if (/Zip archive/.test(sh('file /tmp/fm/f.bin'))) { ok = true; break; }
}
if (ok) {
  console.log(sh('cd /tmp/fm && unzip -o -q f.bin && ls -la /tmp/fm | head -20'));
  const xml = sh('ls /tmp/fm/*.xml | head -1').trim();
  const txt = fs.readFileSync(xml, 'utf8');
  console.log('\nXML', xml, 'size', txt.length, 'balises metier', (txt.match(/<metier[ >]/g) || []).length);
  console.log(txt.slice(0, 6000));
  const i = txt.indexOf('<metier', Math.floor(txt.length / 2)); console.log('\n---- autre fiche ----\n' + txt.slice(i, i + 6000));
}
const j = await (await fetch('https://api.opendata.onisep.fr/downloads/5fa5949243f97/5fa5949243f97.json', { headers: { 'User-Agent': UA } })).text();
console.log('\n######## Idéo-Métiers JSON', j.length);
console.log(j.slice(0, 2500));
