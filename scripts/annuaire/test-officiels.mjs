/* Test des listes officielles : écrit un résumé lisible dans scripts/annuaire/rapport-test.txt */
import fs from 'node:fs';
import { readOfficiels } from './officiels.mjs';
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const lines = [];
const { rows, report } = await readOfficiels((...a) => lines.push(a.join(' ')));
lines.push('RAPPORT ' + JSON.stringify(report));
const by = {};
rows.forEach((r) => (by[r.x.l] = by[r.x.l] || []).push(r));
for (const [k, v] of Object.entries(by)) {
  if (only.length && !only.includes(k)) continue;
  lines.push('== ' + k + ' : ' + v.length);
  const pick = v.length > 14 ? v.slice(0, 8).concat(v.slice(Math.floor(v.length / 2), Math.floor(v.length / 2) + 3), v.slice(-3)) : v;
  pick.forEach((r) => lines.push('  ' + [r.n, r.a, r.v, r.r, r.w, r.x.f, r.x.y].filter(Boolean).join(' | ')));
}
fs.writeFileSync('scripts/annuaire/rapport-test.txt', new Date().toISOString() + '\n' + lines.join('\n') + '\n');
