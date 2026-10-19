/* LERNA — plan du site pour les moteurs de recherche (sitemap.xml) + robots.txt.
   Utilisation : node scripts/sitemap.mjs https://mon-domaine.com   (sans argument : l'adresse Vercel actuelle)
   À relancer quand le nom de domaine change. */
import fs from 'node:fs';
import vm from 'node:vm';
const BASE = (process.argv[2] || 'https://lerna-lilac.vercel.app').replace(/\/+$/, '');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('assets/js/data-schools.js', 'utf8'), ctx);
const today = new Date().toISOString().slice(0, 10);
const pages = ['', 'questionnaire.html', 'explorer.html', 'opportunites.html', 'premium.html', 'contact.html', 'legal.html'];
const urls = pages.map((p) => ({ loc: BASE + '/' + p, pr: p === '' ? '1.0' : '0.8' }))
  .concat((ctx.window.LERNA_SCHOOLS || []).filter((s) => /^[a-z0-9-]+$/.test(s.id)).map((s) => ({ loc: BASE + '/ecole.html?id=' + s.id, pr: '0.6' })));
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => '  <url><loc>' + u.loc.replace(/&/g, '&amp;') + '</loc><lastmod>' + today + '</lastmod><priority>' + u.pr + '</priority></url>').join('\n') + '\n</urlset>\n';
fs.writeFileSync('sitemap.xml', xml);
fs.writeFileSync('robots.txt', 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nDisallow: /api/\n\nSitemap: ' + BASE + '/sitemap.xml\n');
console.log('sitemap.xml :', urls.length, 'adresses ; robots.txt écrit pour', BASE);
