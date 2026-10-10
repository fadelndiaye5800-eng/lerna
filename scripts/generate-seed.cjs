/* Génère supabase/seed.sql à partir des données de l'application (assets/js/data-*.js).
   Usage : node scripts/generate-seed.cjs */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {}, Intl };
vm.createContext(ctx);
['assets/js/questions.js', 'assets/js/data-schools.js', 'assets/js/data-opps.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
const W = ctx.window;
// Les offres Premium complètes ne sont pas dans le code du site : on les reprend du fichier serveur
const PREMIUM = require(path.join(root, 'supabase/opps-premium.cjs'));
const OPPS = W.LERNA_OPPS.map((o) => (o.masked ? PREMIUM.find((p) => p.id === o.id) || o : o));
const q = (v) => (v === null || v === undefined || v === '' ? 'null' : "'" + String(v).replace(/'/g, "''") + "'");
const arr = (a) => (a && a.length ? 'array[' + a.map(q).join(',') + ']' : 'null');
const fr = (v) => (v && typeof v === 'object' ? v.fr : v);
const TYPE = { public: 'Publique', private: 'Privée', online: 'En ligne' };
let sql = '-- Généré par scripts/generate-seed.cjs — ne pas modifier à la main\n-- Écoles\n';
W.LERNA_SCHOOLS.forEach((s) => {
  const adm = W.LERNA_ADMISSION[s.adm];
  sql += `insert into public.ecoles (slug, nom, pays, ville, type, domaines, frais_locaux_usd, frais_etrangers_usd, langue_enseignement, duree_min, duree_max, conditions_admission, description, points_forts, points_faibles, nombre_avis, site_officiel) values (${q(s.id)}, ${q(s.nom)}, ${q(s.pays)}, ${q(s.ville)}, ${q(TYPE[s.type])}, ${arr(s.domaines)}, ${s.frais_local}, ${s.frais_etranger}, ${arr(s.langues)}, ${s.duree[0]}, ${s.duree[1]}, ${q(fr(adm.conditions))}, ${q(fr(s.desc))}, ${arr(s.forts.map(fr))}, ${arr(s.faibles.map(fr))}, 0, ${q(s.site)}) on conflict (slug) do update set nom = excluded.nom, frais_locaux_usd = excluded.frais_locaux_usd, frais_etrangers_usd = excluded.frais_etrangers_usd, description = excluded.description, points_forts = excluded.points_forts, points_faibles = excluded.points_faibles;\n`;
});
sql += '\n-- Opportunités (relevé du ' + W.LERNA_OPPS_VERIFIED + ')\n';
OPPS.forEach((o) => {
  sql += `insert into public.opportunites (slug, type, titre, organisation, pays, ville, domaine, montant_texte, duree, niveau_requis, date_limite, description, lien, is_premium, data, date_publication, verifie, ouverture, active) values (${q(o.id)}, ${q(o.type)}, ${q(o.titre)}, ${q(o.organisation)}, ${q(o.pays)}, ${q(fr(o.ville))}, ${q(o.domaine)}, ${q(fr(o.montant))}, ${q(fr(o.duree))}, ${q(o.niveau)}, ${o.deadline ? q(o.deadline) : 'null'}, ${q(fr(o.eligibles) || fr(o.statut) || fr(o.next))}, ${q(o.lien)}, ${o.premium ? 'true' : 'false'}, ${q(JSON.stringify(o))}::jsonb, ${q(W.LERNA_OPPS_VERIFIED)}, ${o.verifie ? q(o.verifie) : 'null'}, ${o.ouverture ? q(o.ouverture) : 'null'}, true) on conflict (slug) do update set data = excluded.data, titre = excluded.titre, organisation = excluded.organisation, is_premium = excluded.is_premium, date_limite = excluded.date_limite, lien = excluded.lien, verifie = excluded.verifie, ouverture = excluded.ouverture, active = true;\n`;
});
// Les offres retirées (clôturées ou non confirmées lors de la vérification) sont désactivées : plus jamais affichées
sql += `update public.opportunites set active = false where slug not in (${OPPS.map((o) => q(o.id)).join(', ')});\n`;
fs.writeFileSync(path.join(root, 'supabase/seed.sql'), sql);
console.log('seed.sql :', W.LERNA_SCHOOLS.length, 'écoles,', OPPS.length, 'opportunités (dont', PREMIUM.length, 'Premium)');
