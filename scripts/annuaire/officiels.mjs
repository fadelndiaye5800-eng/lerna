/* LERNA — listes OFFICIELLES d'établissements reconnus, publiées par les ministères et agences de chaque pays.
   Chaque entrée = une liste publique d'un organisme d'État. LERNA n'en reprend que des faits (nom, ville, statut, frais
   affichés par l'État) et cite toujours la source. Une liste qui ne répond pas est ignorée ce mois-ci (les anciennes
   fiches sont gardées par build.mjs).
   Types de lecture :
   - table : tableau HTML ; cols = { n: colonne du nom, v: ville, f: frais… } (index à partir de 0)
   - pdf-num : PDF dont chaque établissement est une ligne numérotée « 12 Nom de l'école » (suite sur la ligne suivante
     si besoin) ; les lignes « Région … » donnent la région
   - list : éléments HTML choisis par un sélecteur CSS */
import * as cheerio from 'cheerio';

export const OFFICIELS = [
  {
    cc: 'CI', id: 'ci-mesrs-prives',
    autorite: { fr: 'Ministère de l’Enseignement supérieur et de la Recherche scientifique (MESRS) de Côte d’Ivoire', en: 'Côte d’Ivoire Ministry of Higher Education and Scientific Research (MESRS)' },
    titre: { fr: 'Liste des établissements privés d’enseignement autorisés (orientation des bacheliers)', en: 'List of authorised private higher-education institutions (school-leaver orientation)' },
    url: 'https://bac.mesrs-ci.net/offres/grdes-ecoles', type: 'table', statut: 'prive',
    cols: { n: 1, v: 2, r: 3, f: 5 }, fraisLabel: { fr: 'Frais d’inscription (liste du ministère)', en: 'Registration fees (ministry list)' }
  },
  {
    cc: 'CM', id: 'cm-minesup-ipes',
    autorite: { fr: 'Ministère de l’Enseignement supérieur (MINESUP) du Cameroun', en: 'Cameroon Ministry of Higher Education (MINESUP)' },
    titre: { fr: 'Liste des institutions privées d’enseignement supérieur autorisées', en: 'List of authorised private higher-education institutions' },
    url: 'https://www.minesup.gov.cm/DDES/Liste%20IPES%20par%20ordre%20alphab%C3%A9tique.pdf', type: 'pdf-num', statut: 'prive',
    region: /^R[ée]gion d[eu](?:\s+l[’'])?\s*(.+)$/i
  },
  {
    cc: 'AE', id: 'ae-caa',
    autorite: { fr: 'Commission for Academic Accreditation (CAA), ministère de l’Enseignement supérieur des Émirats arabes unis', en: 'Commission for Academic Accreditation (CAA), UAE Ministry of Higher Education' },
    titre: { fr: 'Établissements d’enseignement supérieur licenciés (statut actif)', en: 'Licensed higher-education institutions (active status)' },
    url: 'https://caa.ae/Pages/Institutes/All.aspx', type: 'table',
    cols: { n: 0, a: 1, r: 2, w: 3 }, keep: { col: 4, re: /^A$/ }
  },
  ...[['federal-univeristies', 'public', 'fédérales', 'Federal'], ['state-univerisity', 'public', 'des États fédérés', 'State'], ['private-univeristies', 'prive', 'privées', 'Private']].map(([slug, statut, fr, en]) => ({
    cc: 'NG', id: 'ng-nuc-' + statut + '-' + slug.split('-')[0],
    autorite: { fr: 'National Universities Commission (NUC) du Nigeria', en: 'National Universities Commission (NUC), Nigeria' },
    titre: { fr: 'Liste des universités ' + fr + ' approuvées', en: 'List of approved ' + en + ' universities' },
    url: 'https://www.nuc.edu.ng/nigerian-univerisities/' + slug + '/', type: 'table', statut,
    cols: { n: 1, w: 3, y: 4 }, cityFromName: true
  }))
];

const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 LERNA-annuaire', 'Accept-Language': 'fr,en;q=0.8' };
const clean = (s, n = 160) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const title = (s) => { const t = clean(s); return t === t.toUpperCase() && /[A-Z]{4}/.test(t) ? t.toLowerCase().replace(/(^|[\s(\-'’/])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Du|Des|La|Le|Les|Et|En|D’|L’|Pour|Au|Aux)\b/g, (m) => m.toLowerCase()).replace(/\(([^)]+)\)/g, (m, a) => '(' + a.toUpperCase() + ')') : t; };

async function fetchBuf(url) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 60000);
  try { const r = await fetch(url, { headers: UA, signal: ctrl.signal, redirect: 'follow' }); if (!r.ok) throw new Error('HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  finally { clearTimeout(timer); }
}

async function readTable(src) {
  const $ = cheerio.load((await fetchBuf(src.url)).toString('utf8'));
  const rows = [];
  const C = src.cols;
  $(src.selector || 'table tr').each((i, tr) => {
    const tds = $(tr).find('td');
    const c = tds.map((j, td) => clean($(td).text())).get();
    if (c.length <= C.n) return;
    if (src.keep && !src.keep.re.test(c[src.keep.col] || '')) return;
    let n = c[C.n]; if (!n || n.length < 3 || /^(s\/n|name|nom)$/i.test(n)) return;
    let v = C.v != null ? title(c[C.v]) : '';
    /* « Université X, Ville » : la ville est après la dernière virgule */
    if (src.cityFromName && !v) { const m = /^(.*\S),\s*([A-Za-zÀ-ÿ' .-]{3,30})$/.exec(n); if (m) { v = m[2]; } }
    let w = '';
    if (C.w != null) { const cell = tds.eq(C.w); w = cell.find('a[href]').attr('href') || c[C.w] || ''; w = /^https?:\/\//i.test(w) ? w : /^www\./i.test(w) ? 'https://' + w : ''; }
    const y = C.y != null && /^\d{4}$/.test(c[C.y] || '') ? c[C.y] : '';
    rows.push({ n: title(n), a: C.a != null ? clean(c[C.a]) : '', v, r: C.r != null ? title(c[C.r]) : '', f: C.f != null ? clean(c[C.f], 80) : '', w, y });
  });
  return rows;
}

async function readPdfNum(src) {
  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const text = (await pdf(await fetchBuf(src.url))).text;
  const lines = text.split(/\r?\n/).map((l) => clean(l, 300)).filter(Boolean);
  const rows = []; let region = '', cur = null;
  for (const l of lines) {
    const rm = src.region && src.region.exec(l);
    if (rm) { if (cur) rows.push(cur); cur = null; region = title(rm[1]); continue; }
    const m = /^(\d{1,3})[\s.)\-–]+(.{3,})$/.exec(l);
    if (m) { if (cur) rows.push(cur); cur = { n: m[2], r: region }; continue; }
    if (cur && !/^\d+$/.test(l) && l.length < 120 && !/^(liste|page)\b/i.test(l) && (/^[a-zà-ÿ(]/.test(l) || !/[.:]$/.test(cur.n))) cur.n += ' ' + l;
  }
  if (cur) rows.push(cur);
  return rows.map((r) => ({ n: title(r.n), r: r.r }));
}

async function readList(src) {
  const $ = cheerio.load((await fetchBuf(src.url)).toString('utf8'));
  return $(src.selector).map((i, e) => ({ n: title($(e).text()) })).get().filter((r) => r.n.length > 3);
}

/* Lit toutes les listes ; renvoie des fiches au format de l'annuaire (source « officiel ») */
export async function readOfficiels(log = console.log) {
  const out = [], report = {};
  for (const src of OFFICIELS) {
    try {
      const rows = src.type === 'table' ? await readTable(src) : src.type === 'pdf-num' ? await readPdfNum(src) : await readList(src);
      const seen = new Set();
      for (const r of rows) {
        const key = r.n.toLowerCase();
        if (seen.has(key)) continue; seen.add(key);
        out.push({ i: 'officiel:' + src.id + ':' + seen.size, s: 'officiel', p: src.cc, n: r.n, a: r.a || '', v: r.v || '', r: r.r || '', w: r.w || '', t: src.statut || '',
          x: { l: src.id, f: r.f && !/^0$/.test(r.f) ? r.f : undefined, y: r.y || undefined } });
      }
      report[src.id] = seen.size; log('officiel', src.id, seen.size);
    } catch (e) { report[src.id] = 'erreur : ' + String(e.message || e).slice(0, 120); log('officiel ÉCHEC', src.id, e.message); }
  }
  return { rows: out, report };
}

/* Métadonnées publiées pour l'appli (nom de l'organisme, titre de la liste, lien) */
export const LISTES = Object.fromEntries(OFFICIELS.map((s) => [s.id, { cc: s.cc, autorite: s.autorite, titre: s.titre, url: s.url, fraisLabel: s.fraisLabel }]));
