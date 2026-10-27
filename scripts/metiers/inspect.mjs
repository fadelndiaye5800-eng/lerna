/* Inspection ponctuelle des jeux de données métiers (structure des fichiers) — supprimé après la construction du vrai script */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString(); } catch (e) { return 'ERR ' + String(e.stderr || e.message).slice(0, 400); } };
fs.mkdirSync('/tmp/r', { recursive: true });
const meta = await (await fetch('https://www.data.gouv.fr/api/1/datasets/58da857388ee384902e505f5/')).json();
console.log('ROME', meta.title, '| licence', meta.license, '| maj', meta.last_modified, '| org', meta.organization && meta.organization.name);
for (const r of meta.resources || []) console.log('RES', r.format, r.filesize, '|', r.title, '|', r.url);
const zips = (meta.resources || []).filter((r) => /zip|csv|json|xlsx/i.test(r.format || r.url)).slice(0, 6);
let n = 0;
for (const r of zips) {
  n++;
  const f = '/tmp/r/f' + n;
  console.log('\n==== ' + r.title + ' ' + r.url);
  console.log(sh('curl -sSL -o ' + f + ' "' + r.url + '"; ls -la ' + f + '; file ' + f));
  if (/Zip archive/.test(sh('file ' + f))) {
    console.log(sh('mkdir -p ' + f + 'd && cd ' + f + 'd && unzip -o -q ' + f + ' && find . -type f | head -40 && find . -type f | wc -l'));
    const files = sh('cd ' + f + 'd && find . -type f \\( -name "*.csv" -o -name "*.json" -o -name "*.xml" \\) | head -40').trim().split('\n').filter(Boolean);
    for (const x of files.slice(0, 14)) { const p = f + 'd/' + x; const t = fs.readFileSync(p, 'utf8'); console.log('\n-- ' + x + ' (' + t.length + ' car.)\n' + t.slice(0, 900)); }
  } else console.log(sh('head -c 1500 ' + f));
}
