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
  pick.forEach((r) => lines.push('  ' + [r.n, r.a, r.v, r.r, r.t, r.w, r.x.f, r.x.y, r.x.acc].filter(Boolean).join(' | ')));
}
/* Sondes */
import * as cheerio from 'cheerio';
const { SONDES } = await import('./sondes.mjs');
for (const u of SONDES) {
  lines.push('##### ' + u);
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 45000);
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'Accept-Language': 'fr,en;q=0.8' }, signal: ctrl.signal });
    const ct = r.headers.get('content-type') || ''; const buf = Buffer.from(await r.arrayBuffer());
    lines.push('ST ' + r.status + ' ' + ct.slice(0, 40) + ' ' + buf.length + ' ' + r.url.slice(0, 150));
    const cut = (x) => String(x).replace(/\s+/g, ' ').trim().slice(0, 200);
    if (/pdf/.test(ct) || buf.slice(0, 4).toString() === '%PDF') {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default; const d = await pdf(buf);
      lines.push('PDF pages ' + d.numpages); d.text.split('\n').filter((l) => l.trim()).slice(0, 30).forEach((l) => lines.push('  ' + cut(l)));
    } else if (/json/.test(ct)) { lines.push('  JSON ' + cut(buf.toString('utf8')).slice(0, 1500)); } else {
      const $ = cheerio.load(buf.toString('utf8'));
      lines.push('TITLE ' + cut($('title').text()) + ' | TABLES ' + $('table').length + ' TR ' + $('tr').length + ' LI ' + $('li').length);
      $('tr').slice(0, 10).each((i, e) => lines.push('  TR ' + cut($(e).find('td,th').map((j, c) => $(c).text().trim()).get().join(' | '))));
      const files = $('a[href]').map((i, a) => $(a).attr('href')).get().filter((h) => /\.(pdf|xlsx?|csv)(\?|$)/i.test(h));
      lines.push('  FILES ' + files.length); files.slice(0, 15).forEach((f) => lines.push('   ' + cut(f)));
      if (!$('tr').length) $('h2,h3,h4,li a,p').slice(0, 90).each((i, e) => { const t = cut($(e).text()); if (t.length > 4) lines.push('  T ' + t); });
    }
  } catch (e) { lines.push('ERR ' + e.message); }
}
fs.writeFileSync('scripts/annuaire/rapport-test.txt', new Date().toISOString() + '\n' + lines.join('\n') + '\n');
