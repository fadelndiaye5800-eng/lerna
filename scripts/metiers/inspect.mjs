/* Inspection ponctuelle des jeux Onisep (structure des fichiers) — supprimé après la construction du vrai script */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (LERNA open data; contact via lerna-lilac.vercel.app)';
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { return 'ERR ' + (e.stderr || e.message).toString().slice(0, 500); } };
fs.mkdirSync('/tmp/fm', { recursive: true });
const meta = await (await fetch('https://www.data.gouv.fr/api/1/datasets/ideo-fiches-metiers/')).json();
for (const r of meta.resources) console.log('RES', r.id, r.url, r.latest);
const urls = [meta.resources[0].url, 'https://www.data.gouv.fr/api/1/datasets/r/' + meta.resources[0].id, meta.resources[0].latest].filter(Boolean);
let ok = false;
for (const u of urls) {
  console.log('\nTRY', u);
  console.log(sh('curl -sSL -A "' + UA + '" -D /tmp/fm/h.txt -o /tmp/fm/f.bin "' + u + '"; cat /tmp/fm/h.txt | head -20; ls -la /tmp/fm/f.bin; file /tmp/fm/f.bin; head -c 600 /tmp/fm/f.bin | cat -v | head -20'));
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
