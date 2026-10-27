/* Inspection ponctuelle des jeux de données métiers (structure des fichiers) — supprimé après la construction du vrai script */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString(); } catch (e) { return 'ERR ' + String(e.stderr || e.message).slice(0, 400); } };
fs.mkdirSync('/tmp/r', { recursive: true });
console.log(sh('curl -sSL -D /tmp/r/h.txt -o /tmp/r/all "https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/json"; head -15 /tmp/r/h.txt; ls -la /tmp/r/all; file /tmp/r/all'));
if (/Zip/.test(sh('file /tmp/r/all'))) {
  console.log(sh('mkdir -p /tmp/r/d && cd /tmp/r/d && unzip -o -q /tmp/r/all && find . -type f | head -50 && find . -type f | wc -l && du -sh .'));
  const files = sh('cd /tmp/r/d && find . -type f -name "*.json" | sort').trim().split('\n').filter(Boolean);
  for (const x of files) {
    const t = fs.readFileSync('/tmp/r/d/' + x, 'utf8');
    console.log('\n-- ' + x + ' (' + t.length + ' car.)\n' + t.slice(0, 1200));
  }
  /* une fiche métier complète */
  const fm = files.find((x) => /fiche/i.test(x));
  if (fm) {
    const j = JSON.parse(fs.readFileSync('/tmp/r/d/' + fm, 'utf8'));
    const arr = Array.isArray(j) ? j : (j.fiches || j.data || Object.values(j)[0]);
    console.log('\nNB FICHES', Array.isArray(arr) ? arr.length : typeof arr);
    const one = Array.isArray(arr) ? (arr.find((f) => JSON.stringify(f).includes('M1203')) || arr[0]) : arr;
    console.log('\nFICHE COMPLETE\n' + JSON.stringify(one, null, 1).slice(0, 9000));
  }
} else console.log(sh('head -c 3000 /tmp/r/all'));
