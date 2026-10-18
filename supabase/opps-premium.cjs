/* LERNA — fiches COMPLÈTES des offres Premium (vérifiées le 2026-10-10 sur les sites officiels).
   Ce fichier n'est PAS publié sur le site (voir .vercelignore) : il sert seulement à générer supabase/seed.sql.
   Les détails arrivent au navigateur via /api/opps, uniquement pour un compte Premium
   (ou pour tous tant que PREMIUM_ENABLED=false). Le site public n'affiche qu'un aperçu sans nom.
   Ensuite, les offres se gèrent depuis la page /admin (plus besoin de modifier ce fichier). */
const T = (fr, en) => ({ fr, en: en || fr });
const V = '2026-10-10';

module.exports = [
  {
    id: 'b-gates-2027', type: 'bourse', titre: 'Bourse Gates Cambridge 2027-2028', organisation: 'Gates Cambridge Trust — Université de Cambridge',
    pays: 'GB', domaine: 'sciences', domaines: ['sciences', 'sante', 'business', 'droit', 'ingenierie', 'tech', 'education', 'agri', 'art', 'comm'], niveau: 'master', niveaux: ['master', 'doctorat'],
    montant: T('Financement complet des études de troisième cycle à Cambridge', 'Full funding for postgraduate study at Cambridge'),
    eligibles: T('Étudiants hors États-Unis qui candidatent à un master ou un doctorat à temps plein à Cambridge et cochent la case Gates dans le formulaire de l’université.', 'Non-US students applying for a full-time master’s or PhD at Cambridge who tick the Gates box in the university application.'),
    deadline: '2026-12-08',
    deadlineNote: T('8 décembre 2026 ou 6 janvier 2027 selon le master : la date exacte est indiquée pour chaque formation dans le catalogue de Cambridge.', '8 December 2026 or 6 January 2027 depending on the course: the exact date is shown for each course in the Cambridge course directory.'),
    lien: 'https://www.gatescambridge.org/apply/timeline/', source: 'gatescambridge.org', verifie: V, premium: false
  },
  {
    id: 'b-mbzuai-2027', type: 'bourse', titre: 'Master en intelligence artificielle — MBZUAI (rentrée 2027)', organisation: 'Mohamed bin Zayed University of Artificial Intelligence (Abou Dhabi)',
    pays: 'AE', domaine: 'tech', domaines: ['tech', 'ingenierie', 'sciences'], niveau: 'master', niveaux: ['master'],
    montant: T('Financement au mérite possible (non garanti) : scolarité, allocation mensuelle (15 500 AED pour les étudiants internationaux), un aller-retour par an, assurance santé, visa', 'Merit-based funding possible (not guaranteed): tuition, monthly stipend (AED 15,500 for international students), one return flight a year, health insurance, visa'),
    eligibles: T('Candidature au master (test de sélection en ligne). Le financement est étudié pendant l’examen du dossier.', 'Apply to the master’s (online screening test). Funding is considered during the review.'),
    ouverture: '2026-09-07', deadline: '2026-12-15',
    deadlineNote: T('15 décembre 2026 pour la plupart des masters (biologie computationnelle : 22 janvier 2027).', '15 December 2026 for most master’s programmes (computational biology: 22 January 2027).'),
    lien: 'https://mbzuai.ac.ae/admissions/graduate-masters-admissions', source: 'mbzuai.ac.ae', verifie: V, premium: false
  },
  {
    id: 'i-yc-w27', type: 'investisseur', genre: 'accelerateur', equity: true, stade: 'produit', titre: 'Y Combinator — promotion Winter 2027', organisation: 'Y Combinator (San Francisco)',
    pays: 'US', domaine: 'tech', domaines: ['tech', 'business', 'sante', 'agri', 'education'],
    montant: T('500 000 $ (accord standard : 125 000 $ pour 7 % + 375 000 $ en SAFE)', '$500,000 (standard deal: $125,000 for 7% + $375,000 on a SAFE)'),
    eligibles: T('Fondateurs de startups, quel que soit le pays. Programme de janvier à mars 2027 à San Francisco.', 'Startup founders from any country. Programme from January to March 2027 in San Francisco.'),
    deadline: '2026-11-02',
    deadlineNote: T('2 novembre 2026, 20 h heure du Pacifique. Les candidatures envoyées après sont encore étudiées, sans garantie.', '2 November 2026, 8pm Pacific Time. Later applications are still reviewed, with no guarantee.'),
    lien: 'https://www.ycombinator.com/apply', source: 'ycombinator.com', verifie: V, premium: false
  },
  {
    id: 'i-anzisha-2027', type: 'investisseur', genre: 'prix', equity: false, stade: 'clients', titre: 'Anzisha Fellowship 2027 (jeunes entrepreneurs de 15 à 22 ans)', organisation: 'Anzisha Prize',
    pays: 'AFR', domaine: 'business', domaines: ['business', 'tech', 'agri', 'education', 'sante', 'art'],
    montant: T('40 000 $ de prix + allocations versées par étapes pendant 2 ans', '$40,000 in prizes + milestone stipends over 2 years'),
    eligibles: T('15 à 22 ans, citoyen d’un pays africain, avoir déjà lancé son entreprise ou son projet et y consacrer au moins 20 h par semaine.', '15 to 22, citizen of an African country, already running your business or project and spending at least 20 hours a week on it.'),
    ouverture: '2026-09-29', deadline: '2026-11-10',
    lien: 'https://anzisha.org/apply/', source: 'anzisha.org', verifie: V, premium: false
  }
];
