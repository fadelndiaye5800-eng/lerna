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
  })),
  {
    cc: 'UG', id: 'ug-nche',
    autorite: { fr: 'National Council for Higher Education (NCHE) de l’Ouganda', en: 'Uganda National Council for Higher Education (NCHE)' },
    titre: { fr: 'Établissements d’enseignement supérieur enregistrés et leur statut d’accréditation', en: 'Registered higher-education institutions and their accreditation status' },
    url: 'https://unche.or.ug/institutions/', type: 'table',
    cols: { n: 0, v: 3, acc: 2, cat: 1 }, skip: { col: 3, re: /^\d{4}-\d{2}-\d{2}$/ }
  },
  {
    cc: 'RW', id: 'rw-hec',
    autorite: { fr: 'Higher Education Council (HEC) du Rwanda', en: 'Rwanda Higher Education Council (HEC)' },
    titre: { fr: 'Établissements d’enseignement supérieur en activité au Rwanda (publics et privés)', en: 'Higher learning institutions operating in Rwanda (public and private)' },
    url: 'https://www.hec.gov.rw/fileadmin/user_upload/HEC/Accreditation/Heads_of_HLIs_operating_in_Rwanda_2025.pdf', type: 'pdf-acr',
    sections: [[/Public Higher Learning/i, 'public'], [/Private Higher Learning/i, 'prive']]
  },
  {
    cc: 'BW', id: 'bw-bqa',
    autorite: { fr: 'Botswana Qualifications Authority (BQA)', en: 'Botswana Qualifications Authority (BQA)' },
    titre: { fr: 'Établissements d’enseignement supérieur enregistrés et accrédités', en: 'Registered and accredited higher-education providers' },
    url: 'https://www.bqa.org.bw/registered-and-accredited-higher-education', type: 'table', pageParam: 'page', maxPages: 12,
    cols: { n: 0, cat: 2, acc: 4 }, accPrefix: { fr: 'Accréditation valable jusqu’au ', en: 'Accreditation valid until ' }, statutCol: 2
  },
  {
    cc: 'ZW', id: 'zw-zimche',
    autorite: { fr: 'Zimbabwe Council for Higher Education (ZIMCHE)', en: 'Zimbabwe Council for Higher Education (ZIMCHE)' },
    titre: { fr: 'Universités enregistrées et programmes accrédités', en: 'Registered universities and accredited programmes' },
    url: 'https://zimche.ac.zw/wp-content/uploads/2026/03/Accredited-Universities-and-their-Programmes-Document.pdf', type: 'pdf-toc'
  },
  {
    cc: 'TZ', id: 'tz-tcu',
    autorite: { fr: 'Tanzania Commission for Universities (TCU)', en: 'Tanzania Commission for Universities (TCU)' },
    titre: { fr: 'Établissements universitaires autorisés en Tanzanie (tout établissement absent de la liste n’est pas autorisé)', en: 'University institutions approved to operate in Tanzania (any institution not on the list is not authorised)' },
    url: 'https://tcu.go.tz/sites/default/files/public_notices/2026-07/LIST%20OF%20UNIVERSITY%20INSTITUTIONS%20IN%20TANZANIA%20AS%20OF%2011%20AUGUST_2026.pdf', type: 'pdf-tz',
    sections: [[/Public (Universities|University Colleges|.*Centres|.*Institutions)/i, 'public'], [/Private (Universities|University Colleges|.*Centres|.*Institutions)/i, 'prive']]
  },
  {
    cc: 'CO', id: 'co-men-snies',
    autorite: { fr: 'Ministère de l’Éducation nationale de Colombie (SNIES, données ouvertes datos.gov.co)', en: 'Colombian Ministry of National Education (SNIES, datos.gov.co open data)' },
    titre: { fr: 'Institutions d’enseignement supérieur enregistrées au SNIES', en: 'Higher-education institutions registered in SNIES' },
    url: 'https://www.datos.gov.co/resource/n5yy-8nav.json?$limit=5000', type: 'json', debugKeys: true,
    filter: (o) => /activ/i.test(o.estado || '') && /principal/i.test(o.principal_seccional || ''),
    map: (o) => ({ n: o.nombre_instituci_n, v: o.municipio_domicilio || o.municipio || '', r: o.departamento_domicilio || o.departamento || '', w: /\./.test(o.p_gina_web || '') ? o.p_gina_web : '', t: /oficial/i.test(o.sector || '') ? 'public' : /privad/i.test(o.sector || '') ? 'prive' : '', acc: [o.car_cter_acad_mico, /^s/i.test(o.acreditada_alta_calidad || '') ? 'Acreditación de alta calidad' + (o.vigencia_de_la_acreditaci ? ' (' + o.vigencia_de_la_acreditaci + ')' : '') : ''].filter(Boolean).join(' · ') })
  },
  {
    cc: 'IN', id: 'in-ugc',
    autorite: { fr: 'University Grants Commission (UGC), Inde', en: 'University Grants Commission (UGC), India' },
    titre: { fr: 'Universités reconnues par l’UGC (centrales, d’État, « deemed », privées d’État)', en: 'UGC-recognised universities (central, state, deemed, state private)' },
    url: 'https://www.ugc.gov.in/universitydetails/Getuniversity_details?unitypeID=0', page: 'https://www.ugc.gov.in/universitydetails/university?type=MuOh4z0uqRaY2k8Ag10I0g==', type: 'json', debugKeys: true,
    map: (o) => ({ n: o.uni_name, v: '', r: o.state || '', w: /\./.test(o.url || '') ? o.url.trim() : '', t: /private/i.test(o.uni_type || '') ? 'prive' : /central|state/i.test(o.uni_type || '') ? 'public' : '', acc: [o.uni_type, o.status ? 'UGC ' + o.status : ''].filter(Boolean).join(' · ') })
  }
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
  if (src.pageParam) {
    const all = [], seen = new Set();
    for (let p = 0; p < (src.maxPages || 10); p++) {
      const u = src.url + (src.url.includes('?') ? '&' : '?') + src.pageParam + '=' + p;
      const part = await readTable({ ...src, pageParam: null, url: u });
      const fresh = part.filter((r) => !seen.has(r.n));
      if (!fresh.length) break;
      fresh.forEach((r) => { seen.add(r.n); all.push(r); });
    }
    return all;
  }
  const $ = cheerio.load((await fetchBuf(src.url)).toString('utf8'));
  const rows = [];
  const C = src.cols;
  $(src.selector || 'table tr').each((i, tr) => {
    const tds = $(tr).find('td');
    const c = tds.map((j, td) => clean($(td).text())).get();
    if (c.length <= C.n) return;
    if (src.keep && !src.keep.re.test(c[src.keep.col] || '')) return;
    if (src.skip && src.skip.re.test(c[src.skip.col] || '')) return;
    let n = c[C.n]; if (!n || n.length < 3 || /^(s\/n|name|nom)$/i.test(n)) return;
    let v = C.v != null ? title(c[C.v]) : '';
    /* « Université X, Ville » : la ville est après la dernière virgule */
    if (src.cityFromName && !v) { const m = /^(.*\S),\s*([A-Za-zÀ-ÿ' .-]{3,30})$/.exec(n); if (m) { v = m[2]; } }
    let w = '';
    if (C.w != null) { const cell = tds.eq(C.w); w = cell.find('a[href]').attr('href') || c[C.w] || ''; w = /^https?:\/\//i.test(w) ? w : /^www\./i.test(w) ? 'https://' + w : ''; }
    const y = C.y != null && /^\d{4}$/.test(c[C.y] || '') ? c[C.y] : '';
    const st = src.statutCol != null ? (/public|state|government/i.test(c[src.statutCol] || '') ? 'public' : /private|priv/i.test(c[src.statutCol] || '') ? 'prive' : '') : '';
    const acc = C.acc != null && c[C.acc] ? (src.accPrefix ? src.accPrefix.fr : '') + clean(c[C.acc], 100) : '';
    rows.push({ n: title(n), a: C.a != null ? clean(c[C.a]) : '', v, r: C.r != null ? title(c[C.r]) : '', f: C.f != null ? clean(c[C.f], 80) : '', w, y, acc, t: st });
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

/* PDF où chaque établissement s'écrit « 12. Nom de l'établissement - SIGLE » (on ne garde que le nom et le sigle,
   jamais les noms ou coordonnées de personnes qui suivent) */
async function readPdfAcr(src) {
  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const lines = (await pdf(await fetchBuf(src.url))).text.split(/\r?\n/).map((l) => clean(l, 300)).filter(Boolean);
  const rows = []; let statut = '';
  for (let i = 0; i < lines.length; i++) {
    for (const [re, st] of src.sections || []) if (re.test(lines[i])) statut = st;
    let m = /^(\d{1,3})\.\s+(.+)$/.exec(lines[i]); if (!m) continue;
    let txt = m[2];
    if (!/\s-\s*[A-Z]/.test(txt) && lines[i + 1] && /^-\s*[A-Z]/.test(lines[i + 1])) txt += ' ' + lines[i + 1];
    else if (!/\s-\s*[A-Z]/.test(txt) && lines[i + 1] && lines[i + 2] && /^-\s*[A-Z]/.test(lines[i + 2]) && /^[A-Za-z’' ]+$/.test(lines[i + 1])) txt += ' ' + lines[i + 1] + ' ' + lines[i + 2];
    const k = /^(.+?)\s*-\s*([A-Z][A-Za-z&]{1,12})\b/.exec(txt);
    if (!k) continue;
    rows.push({ n: clean(k[1]) + ' (' + k[2] + ')', t: statut });
  }
  return rows;
}

/* Liste TCU : « 1. Nom (SIGLE) Ville Statut » */
async function readPdfTz(src) {
  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const lines = (await pdf(await fetchBuf(src.url))).text.split(/\r?\n/).map((l) => clean(l, 300)).filter(Boolean);
  const rows = []; let statut = '';
  const ST = /\s((?:Accredited|Provisionally|Provisional|Registered|Certificate|Chartered|Under)\b.*)$/;
  for (let i = 0; i < lines.length; i++) {
    for (const [re, st] of src.sections || []) if (re.test(lines[i])) statut = st;
    const m = /^(\d{1,3})\.\s+(.+)$/.exec(lines[i]); if (!m) continue;
    let txt = m[2];
    if (!ST.test(txt) && lines[i + 1] && !/^\d{1,3}\./.test(lines[i + 1])) txt += ' ' + lines[i + 1];
    const st = ST.exec(txt); const acc = st ? st[1] : '';
    const rest = st ? txt.slice(0, st.index) : txt;
    const k = /^(.+\))\s*(.*)$/.exec(rest);
    const v = clean(k ? k[2] : '');
    rows.push({ n: clean(k ? k[1] : rest), v: /^(University|College|Campus|Centre|Center|Institute)\b/i.test(v) ? '' : v, t: statut, acc });
  }
  return rows;
}

async function readJson(src) {
  const j = JSON.parse((await fetchBuf(src.url)).toString('utf8'));
  const arr = Array.isArray(j) ? j : j.results || j.data || j.List || [];
  if (src.debugKeys && arr[0]) console.log('clés', src.id, Object.keys(arr[0]).join(','));
  return arr.filter(src.filter || (() => true)).map(src.map).filter((r) => r && r.n).map((r) => ({ ...r, n: title(r.n), v: title(r.v || ''), r: title(r.r || '') }));
}

/* PDF dont la table des matières liste les établissements : « NOM DE L'UNIVERSITÉ ........ 12 » */
async function readPdfToc(src) {
  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const lines = (await pdf(await fetchBuf(src.url))).text.split(/\r?\n/).map((l) => clean(l, 300));
  const rows = [];
  for (const l of lines) {
    const m = /^([A-Z][A-Z’'&().,\- ]{5,}?)\s*\.{4,}\s*\d+$/.exec(l);
    if (m && !/^(INTRODUCTION|TABLE OF CONTENTS|CONTENTS|ANNEX|APPENDIX)/.test(m[1])) rows.push({ n: title(m[1]) });
  }
  return rows;
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
      const rows = src.type === 'table' ? await readTable(src) : src.type === 'pdf-num' ? await readPdfNum(src) : src.type === 'pdf-acr' ? await readPdfAcr(src) : src.type === 'pdf-tz' ? await readPdfTz(src) : src.type === 'pdf-toc' ? await readPdfToc(src) : src.type === 'json' ? await readJson(src) : await readList(src);
      const seen = new Set();
      for (const r of rows) {
        const key = r.n.toLowerCase();
        if (seen.has(key)) continue; seen.add(key);
        out.push({ i: 'officiel:' + src.id + ':' + seen.size, s: 'officiel', p: src.cc, n: r.n, a: r.a || '', v: r.v || '', r: r.r || '', w: r.w ? (/^https?:\/\//i.test(r.w) ? r.w : 'https://' + r.w.replace(/^\/+/, '')) : '', t: r.t || src.statut || '',
          x: { l: src.id, f: r.f && !/^0$/.test(r.f) ? r.f : undefined, y: r.y || undefined, acc: r.acc || undefined } });
      }
      report[src.id] = seen.size; log('officiel', src.id, seen.size);
    } catch (e) { report[src.id] = 'erreur : ' + String(e.message || e).slice(0, 120); log('officiel ÉCHEC', src.id, e.message); }
  }
  return { rows: out, report };
}

/* Métadonnées publiées pour l'appli (nom de l'organisme, titre de la liste, lien) */
export const LISTES = Object.fromEntries(OFFICIELS.map((s) => [s.id, { cc: s.cc, autorite: s.autorite, titre: s.titre, url: s.page || s.url, fraisLabel: s.fraisLabel }]));
