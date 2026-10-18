/* Test des listes officielles : écrit un résumé lisible dans scripts/annuaire/rapport-test.txt */
import fs from 'node:fs';
import { readOfficiels } from './officiels.mjs';
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const lines = [];
const _log = console.log; console.log = (...a) => { lines.push(a.join(' ')); _log(...a); };
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
for (let u of SONDES) {
  let grep = null; const m = /^GREP:(.+?)\|(https?:.+)$/.exec(u); if (m) { grep = new RegExp(m[1], 'gi'); u = m[2]; }
  lines.push('##### ' + u);
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 45000);
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'Accept-Language': 'fr,en;q=0.8' }, signal: ctrl.signal });
    const ct = r.headers.get('content-type') || ''; const buf = Buffer.from(await r.arrayBuffer());
    lines.push('ST ' + r.status + ' ' + ct.slice(0, 40) + ' ' + buf.length + ' ' + r.url.slice(0, 150));
    if (grep) { const t = buf.toString('utf8'); let k; let n = 0; while ((k = grep.exec(t)) && n++ < 40) lines.push('  G ' + t.slice(Math.max(0, k.index - 150), k.index + 350).replace(/\s+/g, ' ')); continue; }
    const cut = (x) => String(x).replace(/\s+/g, ' ').trim().slice(0, 200);
    if (/pdf/.test(ct) || buf.slice(0, 4).toString() === '%PDF') {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default; const d = await pdf(buf);
      lines.push('PDF pages ' + d.numpages); d.text.split('\n').filter((l) => l.trim()).slice(0, 30).forEach((l) => lines.push('  ' + cut(l)));
    } else if (/sheet|excel|octet/.test(ct) || buf.slice(0, 2).toString() === 'PK') {
      const XLSX = (await import('xlsx')).default; const wb = XLSX.read(buf);
      for (const sn of wb.SheetNames.slice(0, 4)) { const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' }); lines.push('SHEET ' + sn + ' rows ' + rows.length); rows.slice(0, 12).forEach((r) => lines.push('  R ' + cut(r.join(' | ')))); }
    } else if (/json/.test(ct)) { lines.push('  JSON ' + cut(buf.toString('utf8')).slice(0, 1500)); } else {
      const $ = cheerio.load(buf.toString('utf8'));
      lines.push('TITLE ' + cut($('title').text()) + ' | TABLES ' + $('table').length + ' TR ' + $('tr').length + ' LI ' + $('li').length);
      $('tr').slice(0, 10).each((i, e) => lines.push('  TR ' + cut($(e).find('td,th').map((j, c) => $(c).text().trim()).get().join(' | '))));
      const files = $('a[href]').map((i, a) => $(a).attr('href')).get().filter((h) => /\.(pdf|xlsx?|csv)(\?|$)/i.test(h));
      lines.push('  FILES ' + files.length); files.slice(0, 15).forEach((f) => lines.push('   ' + cut(f)));
      const seen = new Set(); $('a[href]').each((i, a) => { const h = $(a).attr('href'); const t = cut($(a).text()).slice(0, 60); if (seen.has(h) || seen.size > 120 || /^#|javascript:|facebook|twitter|instagram|youtube|linkedin|whatsapp/i.test(h)) return; seen.add(h); lines.push('  A ' + t + ' -> ' + cut(h)); });
      const js = buf.toString('utf8').match(/(https?:)?\/\/?[\w\-./]*(api|ajax|json|wp-json|datatable|admin-ajax)[\w\-./?=&]*/gi) || []; [...new Set(js)].slice(0, 25).forEach((x) => lines.push('  JS ' + x.slice(0, 180)));
      if (!$('tr').length && seen.size < 15) $('h2,h3,h4,li a,p').slice(0, 90).each((i, e) => { const t = cut($(e).text()); if (t.length > 4) lines.push('  T ' + t); });
    }
  } catch (e) { lines.push('ERR ' + e.message); }
}
fs.writeFileSync('scripts/annuaire/rapport-test.txt', new Date().toISOString() + '\n' + lines.join('\n') + '\n');
