/* ==========================================================================
   LERNA — Opportunités VÉRIFIÉES (bourses, stages, emplois, investisseurs)

   Règle absolue : une offre n'apparaît que si elle est sûre.
   - Chaque offre a été vérifiée sur la page OFFICIELLE de l'organisme (champ « source »),
     à la date indiquée dans « verifie ».
   - Une offre est « ouverte » seulement si :
       • sa date limite est dans le futur (deadline, ou deadlines[pays] quand elle dépend du pays), ou
       • l'organisme dit lui-même qu'on peut postuler à tout moment (rolling: true).
   - Date limite passée → « Clôturée ». Pas de date et pas « à tout moment » → jamais affichée.
   - Vérification de plus de 30 jours → masquée jusqu'à ce que l'équipe la revérifie (page admin).

   Offres Premium : seul un aperçu SANS nom ni titre est ici (masked: true), pour qu'on ne puisse
   pas les retrouver sur Google. Les fiches complètes sont dans Supabase et arrivent via /api/opps.
   Quand l'application est en ligne, la liste vient de Supabase (gérée depuis /admin) et remplace celle-ci.
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en || fr }; }
  var V = '2026-10-16'; // dernière vérification complète

  window.LERNA_OPPS = [
    /* ------------------------------ BOURSES ------------------------------ */
    {
      id: 'b-eiffel-2027', type: 'bourse', titre: "Bourse d'excellence Eiffel 2027", organisation: "Campus France — ministère de l'Europe et des Affaires étrangères",
      pays: 'FR', domaine: 'droit', domaines: ['droit', 'business', 'ingenierie', 'sciences', 'tech'], niveau: 'master', niveaux: ['master', 'doctorat'],
      montant: T('Allocation mensuelle + frais annexes (voyage, assurance, activités culturelles) — montants sur la page officielle', 'Monthly allowance + extra costs (travel, insurance, cultural activities) — amounts on the official page'),
      eligibles: T("Étudiants étrangers en master ou en doctorat. C'est l'établissement français qui dépose ton dossier.", 'International master’s or PhD students. The French institution submits your application.'),
      ouverture: '2026-10-02', deadline: '2027-01-06',
      deadlineNote: T("Date limite pour l'établissement français qui dépose ton dossier. Ton établissement fixe une date plus tôt : demande-la-lui dès maintenant.", 'Deadline for the French institution that submits your file. Your institution sets an earlier date: ask for it now.'),
      lien: 'https://www.campusfrance.org/fr/le-programme-de-bourses-d-excellence-eiffel', source: 'campusfrance.org', verifie: V, premium: false
    },
    {
      id: 'b-suisse-2027', type: 'bourse', titre: 'Bourses d’excellence de la Confédération suisse 2027-2028', organisation: 'Commission fédérale des bourses (CFBE / ESKAS) — Suisse',
      pays: 'CH', domaine: 'sciences', domaines: ['sciences', 'sante', 'ingenierie', 'business', 'droit', 'education', 'agri', 'tech'], niveau: 'doctorat', niveaux: ['doctorat'],
      montant: T('Bourse de recherche ou de doctorat (jusqu’à 36 mois pour un doctorat)', 'Research or PhD scholarship (up to 36 months for a PhD)'),
      eligibles: T('Titulaires d’un master, avec un professeur en Suisse qui soutient ton projet de recherche. Dossier déposé via l’ambassade de Suisse de ton pays.', 'Master’s graduates with a professor in Switzerland backing your research project. Apply through the Swiss embassy in your country.'),
      ouverture: '2026-08-20', deadline: '2026-11-30',
      deadlines: { SN: '2026-11-30', ML: '2026-11-30', GA: '2026-11-30', CG: '2026-11-30', CD: '2026-11-30', KE: '2026-11-30', CI: '2026-11-27', CM: '2026-11-27', BJ: '2026-11-27', TG: '2026-11-27', BF: '2026-11-27', GN: '2026-11-27', NE: '2026-11-27', MG: '2026-11-27', NG: '2026-11-27', GH: '2026-11-27', DZ: '2026-11-13', MA: '2026-11-10', TN: '2026-10-13' },
      deadlineNote: T('La date limite dépend de ton pays : elle est affichée pour ton pays quand il est dans la liste officielle.', 'The deadline depends on your country: it is shown for your country when it is on the official list.'),
      lien: 'https://www.sbfi.admin.ch/en/swiss-government-excellence-scholarships-at-a-glance', source: 'sbfi.admin.ch (liste officielle Afrique, 4 août 2026)', verifie: V, premium: false
    },
    {
      id: 'b-commonwealth-master-2027', type: 'bourse', titre: 'Bourses de master du Commonwealth 2027-2028', organisation: 'Commonwealth Scholarship Commission (Royaume-Uni)',
      pays: 'GB', domaine: 'sciences', domaines: ['sciences', 'sante', 'ingenierie', 'agri', 'education', 'business', 'tech'], niveau: 'master', niveaux: ['master'],
      montant: T('Billet d’avion, frais de scolarité complets et allocation de 1 712 £ par mois (2 000 £ à Londres)', 'Airfare, full tuition and a £1,712 monthly stipend (£2,000 in London)'),
      eligibles: T('Citoyens de pays du Commonwealth à revenu faible ou intermédiaire (Ghana, Kenya, Nigeria, Cameroun, Afrique du Sud…). Candidature via un organisme national qui te présente.', 'Citizens of low- and middle-income Commonwealth countries (Ghana, Kenya, Nigeria, Cameroon, South Africa…). You apply through a national nominating body.'),
      deadline: '2026-10-20',
      deadlineNote: T('Clôture le 20 octobre 2026 à 16 h (heure de Londres). L’organisme de ton pays peut fixer une date plus tôt.', 'Closes 20 October 2026 at 16:00 UK time. Your national nominating body may set an earlier date.'),
      lien: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/', source: 'cscuk.fcdo.gov.uk', verifie: V, premium: false
    },
    {
      id: 'b-yenching-2027', type: 'bourse', titre: 'Yenching Academy — master en études chinoises 2027', organisation: 'Université de Pékin (Peking University)',
      pays: 'CN', domaine: 'droit', domaines: ['droit', 'business', 'comm', 'education', 'art'], niveau: 'master', niveaux: ['master'],
      montant: T('Frais de scolarité, logement, allocation mensuelle, un aller-retour en avion et voyages d’étude', 'Tuition, accommodation, monthly stipend, one round-trip flight and field-study trips'),
      eligibles: T('Titulaires d’une licence (ou en dernière année), toutes nationalités, bon niveau d’anglais.', 'Bachelor’s graduates (or final-year students), any nationality, strong English.'),
      deadline: '2026-11-30',
      deadlineNote: T('Clôture le 30 novembre 2026 à 9 h, heure de Pékin (1 h du matin à Dakar).', 'Closes 30 November 2026 at 9:00 Beijing time.'),
      lien: 'https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm', source: 'yenchingacademy.pku.edu.cn', verifie: V, premium: false
    },
    {
      id: 'b-ens-intl-2027', type: 'bourse', ageMax: 25, titre: 'Sélection internationale de l’ENS 2027', organisation: 'École normale supérieure – PSL (Paris)',
      pays: 'FR', domaine: 'sciences', domaines: ['sciences', 'art', 'education', 'droit'], niveau: 'licence', niveaux: ['licence', 'master'],
      montant: T('1 000 € par mois pendant 3 ans + une chambre sur un campus de l’ENS', '€1,000 a month for 3 years + a room on an ENS campus'),
      eligibles: T('Toutes nationalités, moins de 26 ans au 16 octobre 2026, au moins 1 an (sciences) ou 3 ans (lettres) d’études supérieures hors de France.', 'Any nationality, under 26 on 16 October 2026, at least 1 year (sciences) or 3 years (humanities) of higher education outside France.'),
      ouverture: '2026-10-16', deadline: '2026-12-15',
      deadlineNote: T('Candidature du 16 octobre au 15 décembre 2026, 14 h (heure de Paris), sur la plateforme OnePSL.', 'Apply from 16 October to 15 December 2026, 14:00 Paris time, on the OnePSL platform.'),
      lien: 'https://www.ens.psl.eu/en/une-formation-d-exception/admissions/international/international-selection', source: 'ens.psl.eu', verifie: V, premium: false
    },
    {
      id: 'b-eth-esop-2027', type: 'bourse', titre: 'Excellence Scholarship (ESOP) — master à l’ETH Zurich', organisation: 'ETH Zurich (Suisse)',
      pays: 'CH', domaine: 'ingenierie', domaines: ['ingenierie', 'sciences', 'tech', 'agri'], niveau: 'master', niveaux: ['master'],
      montant: T('13 500 CHF par semestre + frais de scolarité offerts', 'CHF 13,500 per semester + tuition waiver'),
      eligibles: T('Étudiants parmi les 10 % meilleurs de leur promotion de licence, qui postulent à un master de l’ETH.', 'Students in the top 10% of their bachelor’s class applying to an ETH master’s.'),
      ouverture: '2026-11-01', deadline: '2026-11-30',
      deadlineNote: T('Candidature du 1er au 30 novembre 2026, en même temps que la candidature au master.', 'Apply from 1 to 30 November 2026, together with your master’s application.'),
      lien: 'https://ethz.ch/en/studies/financial/scholarships/excellencescholarship.html', source: 'ethz.ch', verifie: V, premium: false
    },
    {
      id: 'b-epfl-excellence-2027', type: 'bourse', titre: 'Bourses d’excellence pour le master — EPFL', organisation: 'École polytechnique fédérale de Lausanne (EPFL)',
      pays: 'CH', domaine: 'ingenierie', domaines: ['ingenierie', 'sciences', 'tech'], niveau: 'master', niveaux: ['master'],
      montant: T('10 000 CHF par semestre, jusqu’à 4 semestres', 'CHF 10,000 per semester, up to 4 semesters'),
      eligibles: T('Excellents étudiants venant d’une autre université, qui postulent à un master de l’EPFL.', 'Outstanding students from another university applying to an EPFL master’s.'),
      deadline: '2026-12-15',
      deadlineNote: T('Pour les candidats externes : dépôt avec la candidature au master, au plus tard le 15 décembre.', 'For external applicants: submit with your master’s application by 15 December.'),
      lien: 'https://www.epfl.ch/education/master/master-excellence-fellowships/how-to-apply/', source: 'epfl.ch', verifie: V, premium: false
    },
    {
      id: 'b-oxford-clarendon-2027', type: 'bourse', titre: 'Bourses Clarendon — Université d’Oxford 2027-2028', organisation: 'Université d’Oxford',
      pays: 'GB', domaine: 'sciences', domaines: ['sciences', 'sante', 'ingenierie', 'droit', 'business', 'art', 'education', 'tech'], niveau: 'master', niveaux: ['master', 'doctorat'],
      montant: T('Frais de scolarité complets + allocation de vie (au moins le minimum doctoral britannique)', 'Full course fees + living grant (at least the UK minimum doctoral stipend)'),
      eligibles: T('Toutes nationalités. Tu es examiné automatiquement si tu postules à ton master ou doctorat avant la date limite du cours.', 'Any nationality. You are considered automatically if you apply to your course by its deadline.'),
      deadline: '2027-01-26',
      deadlineNote: T('La date dépend du cours : certains ferment début décembre, d’autres en janvier (ex. : 26 janvier 2027). Vérifie la page de ton cours.', 'The date depends on the course: some close in early December, others in January (e.g. 26 January 2027). Check your course page.'),
      lien: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants', source: 'ox.ac.uk', verifie: V, premium: false
    },
    {
      id: 'b-oxford-weidenfeld-2027', type: 'bourse', titre: 'Bourses Weidenfeld-Hoffmann — Oxford 2027-2028', organisation: 'Université d’Oxford et Weidenfeld-Hoffmann Trust',
      pays: 'GB', domaine: 'droit', domaines: ['droit', 'business', 'sciences', 'tech', 'ingenierie'], niveau: 'master', niveaux: ['master'],
      montant: T('100 % des frais de scolarité + allocation de vie (au moins 21 805 £)', '100% of course fees + living grant (at least £21,805)'),
      eligibles: T('Citoyens des pays listés (presque toute l’Afrique, dont le Sénégal), pour une quarantaine de masters (politiques publiques, MBA, économie du développement, informatique…).', 'Citizens of listed countries (almost all of Africa, including Senegal), for about 40 master’s courses (public policy, MBA, development economics, computer science…).'),
      deadline: '2027-01-26',
      deadlineNote: T('Coche la bourse dans ta candidature au master et ajoute la déclaration demandée, avant la date limite de ton cours (décembre ou janvier).', 'Select the scholarship in your master’s application and add the required statement before your course deadline (December or January).'),
      lien: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search/weidenfeld-hoffmann-scholarships-and-leadership-programme', source: 'ox.ac.uk', verifie: V, premium: false
    },
    {
      id: 'b-erasmus-mundus-2027', type: 'bourse', titre: 'Bourses Erasmus Mundus — masters conjoints en Europe', organisation: 'Commission européenne (EACEA)',
      pays: 'EU', domaine: 'sciences', domaines: ['sciences', 'ingenierie', 'tech', 'sante', 'agri', 'business', 'education', 'droit', 'art'], niveau: 'master', niveaux: ['master'],
      montant: T('Frais de participation, voyage, visa et allocation de vie pendant tout le master (2 ans dans 2 pays ou plus)', 'Participation costs, travel, visa and living allowance for the whole master’s (2 years in 2 or more countries)'),
      eligibles: T('Titulaires d’une licence, toutes nationalités. Tu postules directement au master choisi dans le catalogue.', 'Bachelor’s graduates, any nationality. You apply directly to the master’s of your choice in the catalogue.'),
      deadline: '2027-01-31',
      deadlineNote: T('Chaque master fixe sa propre date, en général entre octobre et janvier. Ouvre le catalogue et note la date de chaque master qui t’intéresse.', 'Each master’s sets its own date, usually between October and January. Open the catalogue and note the date of each master’s you like.'),
      lien: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en', source: 'eacea.ec.europa.eu', verifie: V, premium: false
    },

    {
      id: 'b-ubc-scholars-2027', type: 'bourse', titre: 'Programme des boursiers internationaux UBC 2027', organisation: 'University of British Columbia (Canada)',
      pays: 'CA', domaine: 'sciences', domaines: ['sciences', 'ingenierie', 'business', 'art', 'sante', 'tech', 'education', 'droit'], niveau: 'licence', niveaux: ['licence'],
      montant: T('Bourses selon le besoin et le mérite ; la bourse Vantage One peut couvrir tout le programme et la vie sur place', 'Need- and merit-based awards; the Vantage One award can cover the full programme and living costs'),
      eligibles: T('Élèves qui entrent à l’université directement après le lycée (première licence), avec un fort besoin financier, de bonnes notes et un engagement. Une recommandation de ton lycée est demandée.', 'Students entering university straight from secondary school (first bachelor’s), with strong financial need, good grades and leadership. A school nomination is required.'),
      ouverture: '2026-10-05', deadline: '2026-11-15',
      deadlineNote: T('Dossier de bourse avant le 15 novembre 2026 ; les formulaires de ton lycée sont dus quelques jours avant.', 'Scholarship application by 15 November 2026; your school’s forms are due a few days earlier.'),
      lien: 'https://you.ubc.ca/financial-planning/scholarships-awards-international-students/international-scholars/', source: 'you.ubc.ca', verifie: V, premium: false
    },
    {
      id: 'b-constructor-2027', type: 'bourse', titre: 'Bourses Talent — Constructor University (rentrée 2027)', organisation: 'Constructor University, Brême (Allemagne)',
      pays: 'DE', domaine: 'tech', domaines: ['tech', 'ingenierie', 'sciences', 'business'], niveau: 'licence', niveaux: ['licence', 'master'],
      montant: T('Jusqu’à 100 % des frais de scolarité (la bourse JetBrains couvre aussi la vie sur place pour certaines licences en informatique)', 'Up to 100% of tuition (the JetBrains scholarship also covers living costs for some computer science bachelor’s)'),
      eligibles: T('Avoir une offre d’admission et réussir l’examen de bourse.', 'Hold an admission offer and pass the scholarship exam.'),
      deadline: '2026-10-29',
      deadlineNote: T('Examen de bourse au plus tard le 29 octobre 2026 à 14 h (UTC).', 'Scholarship exam by 29 October 2026, 14:00 UTC.'),
      lien: 'https://constructor.university/scholarships', source: 'constructor.university', verifie: V, premium: false
    },
    {
      id: 'b-leiden-lexs-2027', type: 'bourse', titre: 'Bourse d’excellence de l’Université de Leyde (LExS)', organisation: 'Universiteit Leiden (Pays-Bas)',
      pays: 'NL', domaine: 'droit', domaines: ['droit', 'sciences', 'art', 'business', 'sante', 'education'], niveau: 'master', niveaux: ['master'],
      montant: T('Réduction des frais de scolarité de 10 000 € à 19 000 € (pas un financement complet)', 'Tuition reduction of €10,000 to €19,000 (not full funding)'),
      eligibles: T('Passeport hors Espace économique européen, parmi les 10 % meilleurs de ta promotion, master à temps plein en septembre 2027.', 'Non-EEA passport, top 10% of your class, full-time master’s starting September 2027.'),
      deadline: '2026-12-01',
      lien: 'https://www.universiteitleiden.nl/en/scholarships/sea/leiden-university-excellence-scholarship-lexs', source: 'universiteitleiden.nl', verifie: V, premium: false
    },
    {
      id: 'b-tudelft-vaneffen-2027', type: 'bourse', titre: 'Bourse d’excellence Justus & Louise van Effen — TU Delft', organisation: 'Delft University of Technology (Pays-Bas)',
      pays: 'NL', domaine: 'ingenierie', domaines: ['ingenierie', 'sciences', 'tech'], niveau: 'master', niveaux: ['master'],
      montant: T('Frais de scolarité complets + participation aux frais de vie (2e année si tu valides 48 crédits sur 60)', 'Full tuition + living-cost contribution (2nd year if you pass 48 of 60 credits)'),
      eligibles: T('Admis sous condition dans un master de 2 ans de TU Delft, parmi les 10 % meilleurs de ta promotion.', 'Conditionally admitted to a 2-year TU Delft master’s, top 10% of your class.'),
      deadline: '2026-12-01',
      deadlineNote: T('Ta candidature au master doit être complète avant le 1er décembre 2026, 23 h 59 (heure de Paris).', 'Your master’s application must be complete before 1 December 2026, 23:59 CET.'),
      lien: 'https://www.tudelft.nl/en/education/study-programme-orientation/practical-matters/scholarships', source: 'tudelft.nl', verifie: V, premium: false
    },
    {
      id: 'b-twente-uts-2027', type: 'bourse', titre: 'Bourse de l’Université de Twente (UTS) 2027-2028', organisation: 'University of Twente (Pays-Bas)',
      pays: 'NL', domaine: 'ingenierie', domaines: ['ingenierie', 'tech', 'sciences', 'business'], niveau: 'master', niveaux: ['master'],
      montant: T('De 3 000 € à 22 000 € pour un an (2e année possible)', '€3,000 to €22,000 for one year (2nd year possible)'),
      eligibles: T('Hors Union européenne, admis dans un master éligible, parmi les 5 à 10 % meilleurs, IELTS 6,5.', 'Non-EU/EEA, admitted to an eligible master’s, top 5–10% of your class, IELTS 6.5.'),
      ouverture: '2026-10-15', deadline: '2027-04-01',
      lien: 'https://www.utwente.nl/en/education/scholarship-finder/university-of-twente-scholarship/', source: 'utwente.nl', verifie: V, premium: false
    },
    {
      id: 'b-kaust-2027', type: 'bourse', titre: 'Bourse KAUST — master et doctorat (rentrée 2027)', organisation: 'King Abdullah University of Science and Technology (Arabie saoudite)',
      pays: 'SA', domaine: 'sciences', domaines: ['sciences', 'ingenierie', 'tech'], niveau: 'master', niveaux: ['master', 'doctorat'],
      montant: T('Frais de scolarité complets, allocation de 20 000 $ par an en master, logement, assurance santé et voyage', 'Full tuition, $20,000 a year stipend for master’s students, housing, health insurance and travel'),
      eligibles: T('Toute personne admise à KAUST en sciences ou ingénierie.', 'Anyone admitted to KAUST in science or engineering.'),
      deadline: '2027-01-03',
      deadlineNote: T('2e tour de candidature jusqu’au 3 janvier 2027 (dates annoncées comme provisoires par KAUST).', 'Round 2 closes 3 January 2027 (KAUST says dates are tentative).'),
      lien: 'https://admissions.kaust.edu.sa/how-to-apply/admission-timelines', source: 'admissions.kaust.edu.sa', verifie: V, premium: false
    },
    {
      id: 'b-jjwbgsp-2027', type: 'bourse', titre: 'Bourses Japon / Banque mondiale (JJ/WBGSP) 2027', organisation: 'Banque mondiale et gouvernement du Japon',
      pays: 'INT', domaine: 'business', domaines: ['business', 'agri', 'sante', 'education', 'droit', 'ingenierie'], niveau: 'master', niveaux: ['master'],
      montant: T('Frais de scolarité, allocation mensuelle, billet d’avion aller-retour, assurance santé, jusqu’à 2 ans', 'Tuition, monthly allowance, round-trip airfare, health insurance, up to 2 years'),
      eligibles: T('Citoyens d’un pays en développement éligible, avec au moins 3 ans d’expérience payée dans le développement après la licence, et une admission sans condition dans un master partenaire.', 'Citizens of an eligible developing country with 3+ years of paid development work after the bachelor’s, and unconditional admission to a partner master’s.'),
      ouverture: '2027-01-18', deadline: '2027-02-26',
      deadlineNote: T('1re fenêtre : 18 janvier – 26 février 2027 ; 2e fenêtre : 29 mars – 21 mai 2027.', 'Window 1: 18 January – 26 February 2027; window 2: 29 March – 21 May 2027.'),
      lien: 'https://www.worldbank.org/en/programs/scholarships/jj-wbgsp', source: 'worldbank.org', verifie: V, premium: false
    },
    /* Premium : aperçu seulement (fiche complète dans Supabase) */
    { id: 'b-gates-2027', type: 'bourse', pays: 'GB', domaine: 'sciences', niveau: 'master', deadline: '2026-12-08', verifie: V, premium: true, masked: true },
    { id: 'b-mbzuai-2027', type: 'bourse', pays: 'AE', domaine: 'tech', niveau: 'master', ouverture: '2026-09-07', deadline: '2026-12-15', verifie: V, premium: true, masked: true },

    /* Ajouts du 15 octobre 2026 (vérifiés sur les pages officielles) */
    {"id": "b-mcf-uct-2027", "type": "bourse", "titre": "Bourses Mastercard Foundation — Université du Cap (2027)", "organisation": "University of Cape Town (UCT) — Fondation Mastercard", "pays": "ZA", "domaine": "sciences", "domaines": ["business", "sciences", "sante", "ingenierie", "tech", "droit", "art", "education"], "niveau": "master", "niveaux": ["master"], "montant": {"fr": "Bourse avec accompagnement complet pendant les études (le détail des frais couverts est donné par UCT)", "en": "Scholarship with comprehensive support during your studies (UCT details which costs are covered)"}, "eligibles": {"fr": "Citoyens d’un pays africain. Master par cursus (coursework), honours ou diplôme postgrad en santé, à temps plein. Il faut d’abord déposer sa candidature d’admission à UCT.", "en": "Citizens of an African country. Coursework master’s, honours or postgraduate diploma in health, full time. You must first apply for admission to UCT."}, "deadline": "2026-10-31", "deadlineNote": {"fr": "Date limite pour les masters, honours et diplômes postgrad. Les candidatures de licence sont fermées pour 2027.", "en": "Deadline for master’s, honours and postgraduate diplomas. Bachelor’s applications are closed for 2027."}, "lien": "https://uct.ac.za/mastercardfdn/apply-mastercard-foundation-scholars-program", "source": "uct.ac.za", "verifie": "2026-10-15", "premium": false},
    {"id": "b-mcf-cambridge-2027", "type": "bourse", "titre": "Bourses Mastercard Foundation — Université de Cambridge (master 2027-2028)", "organisation": "University of Cambridge — Fondation Mastercard", "pays": "GB", "domaine": "sciences", "domaines": ["business", "sciences", "sante", "ingenierie", "tech", "droit", "art", "education"], "niveau": "master", "niveaux": ["master"], "montant": {"fr": "Frais de scolarité complets + allocation mensuelle pour vivre", "en": "Full tuition + a monthly maintenance allowance"}, "eligibles": {"fr": "Citoyens d’un pays africain résidant en Afrique (les réfugiés et déplacés sont dispensés de cette condition). Masters d’un an à temps plein, sauf MBA, MCL, MFin et MAcc. Il faut remplir les conditions d’admission du master choisi.", "en": "Citizens of an African country living in Africa (refugees and displaced people are exempt from this condition). One-year full-time master’s courses, except the MBA, MCL, MFin and MAcc. You must meet your course’s entry requirements."}, "ouverture": "2026-09-11", "deadline": "2026-12-01", "deadlineNote": {"fr": "Chaque master a sa propre date limite de financement, en général début décembre ou en janvier : vérifie celle de ton cours (on affiche la plus prudente). Formulaire d’exonération des frais de candidature avant le 20 novembre 2026 si ton pays n’est pas exonéré d’office.", "en": "Each master’s course has its own funding deadline, usually early December or January: check yours (we show the most cautious date). Application-fee waiver form by 20 November 2026 if your country is not waived automatically."}, "lien": "https://www.mastercardfoundation.fund.cam.ac.uk/news/2027-applications-now-open", "source": "mastercardfoundation.fund.cam.ac.uk", "verifie": "2026-10-15", "premium": false},
    {"id": "b-harvard-aid-2027", "type": "bourse", "titre": "Harvard College — aide financière selon les besoins (entrée 2027)", "organisation": "Harvard College (États-Unis)", "pays": "US", "domaine": "sciences", "domaines": ["business", "sciences", "sante", "ingenierie", "tech", "droit", "art", "education"], "niveau": "licence", "niveaux": ["licence"], "montant": {"fr": "Aide calculée selon les revenus de ta famille. Les étudiants internationaux ont droit au même montant d’aide que les Américains, et Harvard couvre le besoin démontré pendant les 4 ans.", "en": "Aid based on your family’s income. International students are eligible for the same amount of aid as US students, and Harvard meets demonstrated need for all four years."}, "eligibles": {"fr": "Élèves en dernière année de lycée qui candidatent en première année, quelle que soit leur nationalité. Admission très sélective ; l’aide se demande avec le CSS Profile.", "en": "Final-year high-school students applying as first-years, whatever their nationality. Highly selective admission; aid is requested with the CSS Profile."}, "deadline": "2027-01-01", "deadlineNote": {"fr": "Candidature : 1er novembre 2026 (Restrictive Early Action) ou 1er janvier 2027 (Regular Decision). Dossier d’aide (CSS Profile) : 1er novembre ou 1er février.", "en": "Application: 1 November 2026 (Restrictive Early Action) or 1 January 2027 (Regular Decision). Aid file (CSS Profile): 1 November or 1 February."}, "lien": "https://college.harvard.edu/admissions/apply/first-year-applicants", "source": "college.harvard.edu", "verifie": "2026-10-15", "premium": false},
    {"id": "b-mit-aid-2027", "type": "bourse", "titre": "MIT — bourses selon les besoins (entrée 2027)", "organisation": "Massachusetts Institute of Technology (États-Unis)", "pays": "US", "domaine": "tech", "domaines": ["tech", "ingenierie", "sciences", "business"], "niveau": "licence", "niveaux": ["licence"], "montant": {"fr": "Bourse MIT calculée selon les besoins de ta famille", "en": "Need-based MIT Scholarship calculated from your family’s needs"}, "eligibles": {"fr": "Élèves en dernière année de lycée qui candidatent en première année. Les candidats internationaux remplissent le CSS Profile et envoient les justificatifs de revenus des parents (traduits en anglais).", "en": "Final-year high-school students applying as first-years. International applicants complete the CSS Profile and send their parents’ income documents (translated into English)."}, "deadline": "2027-01-04", "deadlineNote": {"fr": "Candidature : 1er novembre 2026 (Early Action) ou 4 janvier 2027 (Regular Action). Documents d’aide : 30 novembre (Early Action) ou 15 février (Regular Action).", "en": "Application: 1 November 2026 (Early Action) or 4 January 2027 (Regular Action). Aid documents: 30 November (Early Action) or 15 February (Regular Action)."}, "lien": "https://mitadmissions.org/apply/firstyear/deadlines-requirements/", "source": "mitadmissions.org", "verifie": "2026-10-15", "premium": false},
    {"id": "b-nyuad-aid-2027", "type": "bourse", "titre": "NYU Abu Dhabi — aide financière selon les besoins (entrée 2027)", "organisation": "New York University Abu Dhabi (Émirats arabes unis)", "pays": "AE", "domaine": "sciences", "domaines": ["business", "sciences", "sante", "ingenierie", "tech", "droit", "art", "education"], "niveau": "licence", "niveaux": ["licence"], "montant": {"fr": "Aide selon les besoins, ouverte à toutes les nationalités ; le montant dépend du besoin calculé par NYU", "en": "Need-based aid open to all nationalities; the amount depends on the need calculated by NYU"}, "eligibles": {"fr": "Élèves en dernière année de lycée, toutes nationalités. L’aide se demande avec le CSS Profile.", "en": "Final-year high-school students of any nationality. Aid is requested with the CSS Profile."}, "deadline": "2027-01-05", "deadlineNote": {"fr": "Candidature : 1er novembre 2026 (Early Decision I), 1er janvier 2027 (Early Decision II) ou 5 janvier 2027 (Regular Decision). CSS Profile : 10 novembre, 10 janvier ou 1er février.", "en": "Application: 1 November 2026 (Early Decision I), 1 January 2027 (Early Decision II) or 5 January 2027 (Regular Decision). CSS Profile: 10 November, 10 January or 1 February."}, "lien": "https://nyuad.nyu.edu/en/apply/undergraduate/apply/key-dates-and-deadlines.html", "source": "nyuad.nyu.edu", "verifie": "2026-10-15", "premium": false},
    /* ------------------------------ STAGES ------------------------------ */
    {
      id: 's-unesco', type: 'stage', ageMin: 20, titre: 'Programme de stages de l’UNESCO', organisation: 'UNESCO',
      pays: 'INT', ville: T('Paris et bureaux dans le monde', 'Paris and offices worldwide'), domaine: 'education', domaines: ['education', 'sciences', 'comm', 'art', 'droit'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('1 à 6 mois', '1 to 6 months'),
      montant: T('Non rémunéré (voyage, visa et assurance à ta charge)', 'Unpaid (travel, visa and insurance at your cost)'),
      eligibles: T('20 ans minimum, en 3e année de licence ou plus, ou diplômé depuis moins de 12 mois. Anglais ou français.', '20 or older, in the 3rd year of a bachelor’s or above, or graduated in the last 12 months. English or French.'),
      rolling: true, rollingNote: T('Candidature dans un vivier : ton dossier reste visible 6 mois par les services qui recrutent.', 'You apply to a talent pool: your file stays visible for 6 months to hiring teams.'),
      lien: 'https://careers.unesco.org/go/Internships/783902/', source: 'careers.unesco.org', verifie: V, premium: false
    },

    {
      id: 's-unicef', type: 'stage', ageMin: 18, titre: 'Programme de stages de l’UNICEF', organisation: 'UNICEF',
      pays: 'INT', ville: T('Siège et bureaux pays dans le monde', 'Headquarters and country offices worldwide'), domaine: 'sante', domaines: ['sante', 'education', 'comm', 'business', 'tech', 'droit'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('6 à 26 semaines, temps plein ou partiel', '6 to 26 weeks, full- or part-time'),
      montant: T('Allocation mensuelle', 'Monthly stipend'),
      eligibles: T('18 ans minimum, inscrit en licence, master ou doctorat, ou diplômé depuis moins de 2 ans.', '18 or older, enrolled in a bachelor’s, master’s or PhD, or graduated in the last 2 years.'),
      rolling: true, rollingNote: T('Des stages sont publiés toute l’année : chaque annonce a sa propre date limite.', 'Internships are posted throughout the year: each posting has its own deadline.'),
      lien: 'https://jobs.unicef.org/en-us/filter/?search-keyword=&work-type=internship', source: 'unicef.org', verifie: V, premium: false
    },
    {
      id: 's-oms', type: 'stage', ageMin: 20, titre: 'Programme de stages de l’OMS', organisation: 'Organisation mondiale de la santé (OMS)',
      pays: 'INT', ville: T('Bureaux de l’OMS dans le monde', 'WHO offices worldwide'), domaine: 'sante', domaines: ['sante', 'sciences', 'comm', 'business', 'tech'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('6 à 24 semaines, temps plein', '6 to 24 weeks, full-time'),
      montant: T('Allocation de vie pour les stagiaires qui en ont besoin (montant dans chaque annonce)', 'Living allowance for interns who need it (amount in each posting)'),
      eligibles: T('20 ans minimum, inscrit à l’université ou diplômé depuis moins de 18 mois.', '20 or older, enrolled at university or graduated in the last 18 months.'),
      rolling: true, rollingNote: T('Annonces publiées en continu ; candidature uniquement sur la plateforme de recrutement de l’OMS.', 'Postings published continuously; apply only on WHO’s recruitment platform.'),
      lien: 'https://careers.who.int/careersection/intern/jobsearch.ftl?lang=en', source: 'who.int', verifie: V, premium: false
    },
    {
      id: 's-onudi', type: 'stage', titre: 'Programme de stages de l’ONUDI', organisation: 'Organisation des Nations unies pour le développement industriel (ONUDI)',
      pays: 'AT', ville: T('Vienne ou bureaux sur le terrain', 'Vienna or field offices'), domaine: 'ingenierie', domaines: ['ingenierie', 'business', 'agri', 'tech', 'sciences'], niveau: 'licence', niveaux: ['licence', 'master'],
      duree: T('3 à 6 mois en général', 'Usually 3 to 6 months'),
      montant: T('Conditions précisées par l’ONUDI', 'Conditions set by UNIDO'),
      eligibles: T('Étudiants et jeunes diplômés. Postule au plus tôt 6 mois avant la date de début souhaitée.', 'Students and recent graduates. Apply no earlier than 6 months before your preferred start date.'),
      rolling: true, rollingNote: T('L’ONUDI indique qu’on peut postuler à tout moment.', 'UNIDO says you can apply at any time.'),
      lien: 'https://www.unido.org/resources-employment/internship', source: 'unido.org', verifie: V, premium: false
    },
    {
      id: 's-ua-2026', type: 'stage', titre: 'Programme de stages de la Commission de l’Union africaine', organisation: 'Commission de l’Union africaine',
      pays: 'ET', ville: T('Addis-Abeba', 'Addis Ababa'), domaine: 'droit', domaines: ['droit', 'business', 'comm', 'education', 'agri', 'tech'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('2 semaines à 3 mois (6 mois maximum)', '2 weeks to 3 months (6 months maximum)'),
      montant: T('Non rémunéré (voyage et logement à ta charge)', 'Unpaid (travel and housing at your cost)'),
      eligibles: T('Ressortissants d’un État membre de l’UA ou de la diaspora, en dernière année de licence, master ou doctorat, ou diplômés. Modèle de CV de l’UA obligatoire.', 'Nationals of an AU member state or the diaspora, in the final year of a bachelor’s, master’s or PhD, or graduates. AU CV template required.'),
      deadline: '2026-12-31',
      lien: 'https://jobs.au.int/job/Internship-Program/1506-en_US/', source: 'jobs.au.int', verifie: V, premium: false
    },
    {
      id: 's-afreximbank', type: 'stage', ageMin: 20, ageMax: 32, titre: 'Programme de stages d’Afreximbank', organisation: 'Banque africaine d’import-export (Afreximbank)',
      pays: 'EG', ville: T('Le Caire (siège), sur place', 'Cairo (headquarters), on site'), domaine: 'business', domaines: ['business', 'droit', 'tech', 'comm'], niveau: 'licence', niveaux: ['licence', 'master'],
      duree: T('3 à 6 mois, 2 sessions par an', '3 to 6 months, 2 intakes a year'),
      montant: T('800 $ par mois + 400 $ de logement si tu déménages', '$800 a month + $400 housing if you relocate'),
      eligibles: T('20 à 32 ans, étudiant à temps plein en licence ou master, ressortissant d’un pays membre (la diaspora est acceptée).', '20 to 32, full-time bachelor’s or master’s student, national of a member state (diaspora accepted).'),
      rolling: true, rollingNote: T('Candidatures reçues toute l’année.', 'Applications received throughout the year.'),
      lien: 'https://www.afreximbank.com/careers/vacancies/internship/internship-opportunities/', source: 'afreximbank.com', verifie: '2026-10-15', premium: false
    },
    {
      id: 's-unfpa-2026', type: 'stage', titre: 'Vivier mondial de stagiaires de l’UNFPA', organisation: 'Fonds des Nations unies pour la population (UNFPA)',
      pays: 'INT', ville: T('Bureaux dans le monde (parfois à distance)', 'Offices worldwide (sometimes remote)'), domaine: 'sante', domaines: ['sante', 'education', 'comm', 'droit', 'business'], niveau: 'licence', niveaux: ['licence', 'master'],
      duree: T('Selon le poste', 'Depends on the post'),
      montant: T('Allocation pour les frais de vie si tu n’as pas d’autre financement', 'Living-cost stipend if you have no other funding'),
      eligibles: T('Après au moins 1 an de licence, en master, ou diplômé depuis moins d’un an. Anglais ou français.', 'After at least 1 year of a bachelor’s, in a master’s, or graduated within the last year. English or French.'),
      deadline: '2026-12-31',
      lien: 'https://www.unfpa.org/jobs/global-internship-roster-2026', source: 'unfpa.org', verifie: V, premium: false
    },
    {
      id: 's-ompi', type: 'stage', titre: 'Programme de stages de l’OMPI', organisation: 'Organisation mondiale de la propriété intellectuelle (OMPI)',
      pays: 'CH', ville: T('Genève, sur place', 'Geneva, on site'), domaine: 'droit', domaines: ['droit', 'tech', 'business', 'comm'], niveau: 'licence', niveaux: ['licence', 'master'],
      duree: T('2 à 6 mois (jusqu’à 12 mois pour les diplômés de master)', '2 to 6 months (up to 12 months for master’s graduates)'),
      montant: T('1 645 CHF par mois (2 170 CHF pour la catégorie II)', 'CHF 1,645 a month (CHF 2,170 for category II)'),
      eligibles: T('En 3e ou 4e année de licence, jeune diplômé de licence (moins de 2 ans) ou en master. Toutes nationalités.', '3rd or 4th-year bachelor’s student, recent bachelor’s graduate (under 2 years) or master’s student. Any nationality.'),
      rolling: true, rollingNote: T('Candidatures étudiées au fil de l’eau.', 'Applications reviewed on a rolling basis.'),
      lien: 'https://www.wipo.int/en/web/working-at-wipo/internship-program', source: 'wipo.int', verifie: V, premium: false
    },
    {
      id: 's-google-student-researcher-2027', type: 'stage', titre: 'Chercheur étudiant chez Google 2027', organisation: 'Google',
      pays: 'GH', ville: T('Accra (et bureaux en Europe)', 'Accra (and offices in Europe)'), domaine: 'tech', domaines: ['tech', 'sciences', 'ingenierie'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('Selon le projet', 'Depends on the project'),
      montant: T('Rémunéré (montant selon le pays)', 'Paid (amount depends on the country)'),
      eligibles: T('Étudiant en licence, master ou doctorat en informatique ou domaine proche, présent dans un pays éligible pendant tout le stage.', 'Bachelor’s, master’s or PhD student in computer science or a related field, located in an eligible country for the whole engagement.'),
      deadline: '2026-12-13',
      deadlineNote: T('Candidatures étudiées au fil de l’eau : postule tôt.', 'Applications are reviewed on a rolling basis: apply early.'),
      lien: 'https://www.google.com/about/careers/applications/jobs/results/86733690079453894-student-researcher-2027', source: 'google.com', verifie: V, premium: false
    },
    {
      id: 's-onufemmes', type: 'stage', titre: 'Programme de stages d’ONU Femmes', organisation: 'ONU Femmes',
      pays: 'INT', ville: T('Siège et bureaux dans le monde', 'Headquarters and offices worldwide'), domaine: 'droit', domaines: ['droit', 'comm', 'education', 'sante', 'business'], niveau: 'licence', niveaux: ['licence', 'master', 'doctorat'],
      duree: T('2 à 6 mois, à temps plein', '2 to 6 months, full-time'),
      montant: T('Non rémunéré ; une allocation peut être versée si personne d’autre ne te finance', 'Unpaid; a stipend may be paid if nobody else funds you'),
      eligibles: T('En dernière année de licence, en master ou doctorat, ou diplômé depuis moins de 2 ans. Toutes nationalités.', 'Final-year bachelor’s, master’s or PhD student, or graduated within the last 2 years. Any nationality.'),
      rolling: true, rollingNote: T('Des stages sont proposés toute l’année : postule aux annonces publiées.', 'Internships are available throughout the year: apply to published postings.'),
      lien: 'https://www.unwomen.org/en/about-us/employment/internship-programme', source: 'unwomen.org', verifie: V, premium: false
    },

    /* ------------------------------ EMPLOIS ------------------------------ */
    {
      id: 'e-vnu', type: 'emploi', titre: 'Volontaires des Nations unies (VNU)', organisation: 'Programme des Volontaires des Nations unies',
      pays: 'INT', ville: T('Dans ton pays, à l’étranger ou en ligne', 'In your country, abroad or online'), domaine: 'education', domaines: ['education', 'sante', 'comm', 'business', 'tech', 'agri', 'droit'], niveau: 'licence', niveaux: ['bac', 'licence', 'master'],
      duree: T('Missions de quelques semaines à plusieurs mois', 'Assignments from a few weeks to several months'),
      montant: T('Conditions (indemnités) précisées dans chaque mission', 'Conditions (allowances) set out in each assignment'),
      eligibles: T('Crée ton profil dans le vivier de talents VNU, puis postule aux missions publiées.', 'Create your profile in the UNV talent pool, then apply to published assignments.'),
      rolling: true, rollingNote: T('Profil à créer à tout moment ; des missions sont publiées en continu, et certaines sont pourvues directement depuis le vivier.', 'Profile can be created at any time; assignments are published continuously, and some are filled straight from the pool.'),
      lien: 'https://app.unv.org', source: 'unv.org', verifie: V, premium: false
    },
    {
      id: 'e-vnu-enligne', type: 'emploi', titre: 'Volontariat en ligne des Nations unies', organisation: 'Programme des Volontaires des Nations unies',
      pays: 'REMOTE', ville: T('En ligne, depuis chez toi', 'Online, from home'), domaine: 'comm', domaines: ['comm', 'tech', 'education', 'art', 'business'], niveau: 'tous', niveaux: ['bac', 'licence', 'master'],
      duree: T('Jusqu’à 20 h par semaine, 12 semaines maximum', 'Up to 20 hours a week, 12 weeks maximum'),
      montant: T('Bénévole (non rémunéré) — une vraie expérience pour ton CV', 'Volunteer (unpaid) — real experience for your CV'),
      eligibles: T('18 ans minimum, où que tu sois.', '18 or older, wherever you are.'),
      rolling: true, rollingNote: T('Des missions en ligne sont publiées en continu.', 'Online assignments are published continuously.'),
      lien: 'https://app.unv.org/?type=online', source: 'unv.org', verifie: V, premium: false
    },
    {
      id: 'e-jpo', type: 'emploi', ageMax: 32, titre: 'Jeunes experts associés (JPO) des Nations unies', organisation: 'PNUD — Centre de services JPO',
      pays: 'INT', ville: T('Selon le poste', 'Depends on the post'), domaine: 'business', domaines: ['business', 'droit', 'sante', 'agri', 'education', 'tech'], niveau: 'master', niveaux: ['master'],
      duree: T('Poste de début de carrière, durée selon l’annonce', 'Early-career post, length depends on the posting'),
      exp: T('Master + 2 ans d’expérience payée', 'Master’s + 2 years’ paid experience'),
      montant: T('Poste salarié des Nations unies', 'Salaried UN post'),
      eligibles: T('Moins de 32 ans en général. Pour les candidats africains : seulement les postes que certains pays (Belgique, Italie, Pays-Bas, Suède) financent pour les ressortissants de pays en développement.', 'Usually under 32. For African applicants: only posts that some countries (Belgium, Italy, Netherlands, Sweden) fund for nationals of developing countries.'),
      rolling: true, rollingNote: T('Postes publiés tout au long de l’année.', 'Posts advertised throughout the year.'),
      lien: 'https://www.undp.org/jposc/current-vacancies', source: 'undp.org', verifie: V, premium: false
    },

    /* ------------------------------ INVESTISSEURS ------------------------------
       genre : prix | accelerateur | incubateur | angel | fonds ; equity : true = prend des parts, false = sans prise de parts, absent = non précisé ;
       stade : idee | produit | clients ; ageMin / ageMax : limites d'âge (l'offre est masquée si l'âge connu est hors limite) ;
       pourQui: 'f' : offre réservée aux femmes */
    {
      id: 'i-mitsolve-2027', type: 'investisseur', genre: 'prix', equity: false, titre: 'MIT Solve — Défis mondiaux 2027', organisation: 'MIT Solve (Massachusetts Institute of Technology)',
      pays: 'INT', domaine: 'tech', domaines: ['tech', 'sante', 'education', 'agri', 'business'], stade: 'produit',
      montant: T('Subvention de 10 000 $ par équipe retenue, plus de 1 M$ de prix au total, et un accompagnement d’un an', '$10,000 grant per selected team, over $1M in total prizes, and a year of support'),
      eligibles: T('Toutes nationalités. Il faut au moins un prototype ou un pilote qui fonctionne.', 'Any nationality. You need at least a working prototype or pilot.'),
      deadline: '2026-11-02',
      deadlineNote: T('Clôture le 2 novembre 2026 à midi (heure de New York).', 'Closes 2 November 2026 at noon New York time.'),
      lien: 'https://solve.mit.edu/challenges/2027-global-economic-prosperity-challenge', source: 'solve.mit.edu', verifie: V, premium: false
    },
    {
      id: 'i-fi-abuja-2027', type: 'investisseur', genre: 'accelerateur', equity: true, titre: 'Founder Institute — programme pré-amorçage (en ligne)', organisation: 'Founder Institute (chapitre d’Abuja)',
      pays: 'NG', domaine: 'tech', domaines: ['tech', 'business'], stade: 'idee',
      montant: T('Pas d’argent versé : formation de 3 mois, mentors et réseau d’investisseurs. Tu promets 2,5 % de ta future entreprise au fonds commun des fondateurs.', 'No cash: 3-month training, mentors and investor network. You pledge 2.5% of your future company to the founders’ shared pool.'),
      eligibles: T('Porteurs d’une idée ou d’un tout premier produit. Programme 100 % en ligne.', 'Founders with an idea or a very first product. 100% online.'),
      deadline: '2027-02-02',
      deadlineNote: T('Tarif réduit jusqu’au 3 novembre 2026, dernière date le 2 février 2027 ; démarrage le 4 février 2027.', 'Early deadline 3 November 2026, final deadline 2 February 2027; starts 4 February 2027.'),
      lien: 'https://fi.co/program/abuja', source: 'fi.co', verifie: V, premium: false
    },
    {
      id: 'i-villgro-africa', type: 'investisseur', genre: 'incubateur', titre: 'Incubation Villgro Africa', organisation: 'Villgro Africa',
      pays: 'AFR', domaine: 'sante', domaines: ['sante', 'agri', 'tech'], stade: 'clients',
      montant: T('Accompagnement et financement d’amorçage pour les entreprises sociales (montants sur le site)', 'Support and seed funding for social enterprises (amounts on the website)'),
      eligibles: T('Entreprises en Afrique avec un premier produit, une demande prouvée, un modèle de revenus, un fondateur à plein temps et un cofondateur technique.', 'Businesses in Africa with a first product, proven demand, a revenue model, a full-time founder and a technical co-founder.'),
      rolling: true, rollingNote: T('Candidatures acceptées en continu ; réponse en environ un mois.', 'Applications accepted on a rolling basis; reply in about a month.'),
      lien: 'https://villgroafrica.org/innovators/apply-now/', source: 'villgroafrica.org', verifie: V, premium: false
    },
    {
      id: 'i-antler-afrique', type: 'investisseur', genre: 'accelerateur', equity: true, titre: 'Antler — résidence pour fondateurs (Lagos, Nairobi)', organisation: 'Antler',
      pays: 'AFR', ville: T('Lagos ou Nairobi', 'Lagos or Nairobi'), domaine: 'tech', domaines: ['tech', 'business'], stade: 'idee',
      montant: T('Jusqu’à 250 000 $ : 100 000 $ contre 10 % de l’entreprise, puis 150 000 $ réservés pour ta levée suivante', 'Up to $250,000: $100,000 for 10% of the company, then $150,000 set aside for your next round'),
      eligibles: T('Fondateurs seuls ou en équipe, même sans idée finale : Antler t’aide à trouver un cofondateur. Prochaine cohorte de Lagos : 15 mars 2027.', 'Solo founders or teams, even without a final idea: Antler helps you find a co-founder. Next Lagos cohort: 15 March 2027.'),
      rolling: true, rollingNote: T('On peut postuler à tout moment ; postule tôt pour réserver ta place dans une cohorte.', 'You can apply at any time; apply early to secure a seat in a cohort.'),
      lien: 'https://www.antler.co/apply', source: 'antler.co', verifie: V, premium: false
    },

    {
      id: 'i-thiel', type: 'investisseur', ageMax: 22, genre: 'prix', equity: false, titre: 'Thiel Fellowship', organisation: 'Thiel Foundation',
      pays: 'INT', domaine: 'tech', domaines: ['tech', 'sciences', 'business', 'sante'], stade: 'idee',
      montant: T('250 000 $ versés sur 2 ans, sans prise de parts', '$250,000 over 2 years, no equity'),
      eligibles: T('22 ans maximum, sans diplôme universitaire, partout dans le monde. Accepter la bourse veut dire quitter ou mettre en pause l’université pour bâtir ton projet.', '22 or younger, without a university degree, anywhere in the world. Taking it means leaving or pausing university to build your project.'),
      rolling: true, rollingNote: T('Candidatures acceptées toute l’année.', 'Applications accepted year round.'),
      lien: 'https://thielfellowship.org/faq', source: 'thielfellowship.org', verifie: V, premium: false
    },
    {
      id: 'i-zfellows', type: 'investisseur', genre: 'accelerateur', titre: 'Z Fellows', organisation: 'Z Fellows',
      pays: 'INT', domaine: 'tech', domaines: ['tech', 'business'], stade: 'idee',
      montant: T('Programme d’une semaine ; si tu le veux, 10 000 $ investis (convertis en parts lors de ta future levée)', 'One-week programme; if you want, $10,000 invested (converted into shares at your next round)'),
      eligibles: T('Aucune limite d’âge, où que tu sois. Programme surtout en ligne.', 'No age limit, wherever you are. Mostly online.'),
      rolling: true, rollingNote: T('Pas de date limite : candidatures étudiées au fil de l’eau.', 'No deadline: applications reviewed on a rolling basis.'),
      lien: 'https://www.zfellows.com/', source: 'zfellows.com', verifie: V, premium: false
    },
    {
      id: 'i-magnificent', type: 'investisseur', ageMax: 25, genre: 'prix', equity: false, titre: 'Magnificent Grants', organisation: 'Magnificent Grants',
      pays: 'INT', domaine: 'tech', domaines: ['tech', 'sciences', 'business', 'art'], stade: 'idee',
      montant: T('Bourse versée sur 2 ans, sans prise de parts (montant précisé par l’organisme)', 'Grant paid over 2 years, no equity (amount set by the organisation)'),
      eligibles: T('25 ans maximum, sans restriction de pays.', '25 or younger, no country restriction.'),
      rolling: true, rollingNote: T('Entretiens au fil de l’eau.', 'Interviews on a rolling basis.'),
      lien: 'https://www.magnificentgrants.com/', source: 'magnificentgrants.com', verifie: V, premium: false
    },
    {
      id: 'i-halcyon-ag-2027', type: 'investisseur', ageMin: 21, genre: 'accelerateur', titre: 'Accélérateur Halcyon — innovation agricole en Afrique 2027', organisation: 'Halcyon',
      pays: 'AFR', ville: T('Résidences à Accra et Nairobi', 'Residencies in Accra and Nairobi'), domaine: 'agri', domaines: ['agri', 'tech', 'business'], stade: 'clients',
      montant: T('10 000 $ par entreprise, sans prise de parts sur cette somme, plus l’accompagnement', '$10,000 per venture, equity-free on that amount, plus support'),
      eligibles: T('Entreprises d’agriculture ou de sécurité alimentaire en Afrique subsaharienne, avec un premier produit et des clients payants. Le dirigeant doit avoir 21 ans ou plus et parler anglais.', 'Agriculture or food-security ventures in Sub-Saharan Africa with a first product and paying customers. The CEO must be 21+ and fluent in English.'),
      deadline: '2026-10-23',
      lien: 'https://halcyonaccelerator.org/africa-innovation-in-ag-2027/', source: 'halcyonaccelerator.org', verifie: V, premium: false
    },
    { id: 'i-yc-w27', type: 'investisseur', equity: true, stade: 'produit', pays: 'US', domaine: 'tech', deadline: '2026-11-02', verifie: V, premium: true, masked: true },
    { id: 'i-anzisha-2027', type: 'investisseur', equity: false, stade: 'clients', pays: 'AFR', domaine: 'business', ouverture: '2026-09-29', deadline: '2026-11-10', verifie: V, premium: true, masked: true }
  ];

  window.LERNA_OPPS_VERIFIED = V;
  var STALE_DAYS = 30;

  /* Pays de la personne (réponse au questionnaire, compte, ou pays détecté) */
  function userCountry() {
    try { return (window.Lerna && Lerna.country && Lerna.country()) || ''; } catch (e) { return ''; }
  }
  /* Date limite à afficher (celle du pays de la personne si l'offre en dépend) */
  window.LERNA_OPP_DEADLINE = function (o, country) {
    country = country === undefined ? userCountry() : country;
    if (o.deadlines && country && o.deadlines[country]) return o.deadlines[country];
    return o.deadline || null;
  };
  window.LERNA_OPP_DOMS = function (o) { return o.domaines && o.domaines.length ? o.domaines : (o.domaine ? [o.domaine] : []); };
  window.LERNA_OPP_LEVELS = function (o) { return o.niveaux && o.niveaux.length ? o.niveaux : (o.niveau ? [o.niveau] : []); };
  function daysSince(iso) { var d = window.Lerna ? Lerna.daysUntil(iso) : 0; return d === null ? 9999 : -d; }

  /* Statut calculé :
     open | urgent (≤ 7 jours) | rolling (à tout moment) → visibles
     closed (date passée) → visible seulement avec « Afficher les offres clôturées »
     stale (vérification > 30 jours) | unverified (ni date ni « à tout moment ») | upcoming → jamais montrées */
  window.LERNA_OPP_STATUS = function (o) {
    if (o.closed) return 'closed';
    var dl = window.LERNA_OPP_DEADLINE(o);
    if (dl) {
      var d = window.Lerna ? Lerna.daysUntil(dl) : 99;
      if (d !== null && d < 0) return 'closed';
    }
    if (!o.verifie || daysSince(o.verifie) > STALE_DAYS) return 'stale';
    if (o.ouverture && window.Lerna && Lerna.daysUntil(o.ouverture) > 0) return 'upcoming';
    if (dl) { var dd = Lerna.daysUntil(dl); return dd <= 7 ? 'urgent' : 'open'; }
    if (o.rolling) return 'rolling';
    return 'unverified';
  };
  window.LERNA_OPP_VISIBLE = function (o, withClosed) {
    var s = window.LERNA_OPP_STATUS(o);
    return s === 'open' || s === 'urgent' || s === 'rolling' || (withClosed && s === 'closed');
  };

  /* Aperçu d'une offre Premium : on montre le genre d'offre, jamais son titre ni l'organisme */
  var TYPE_NAME = { stage: { fr: 'Stage', en: 'Internship' }, bourse: { fr: 'Bourse', en: 'Scholarship' }, emploi: { fr: 'Emploi', en: 'Job' }, investisseur: { fr: 'Financement de projet', en: 'Project funding' } };
  window.LERNA_OPP_TEASER = function (o) {
    var lang = (window.Lerna && Lerna.lang) || 'fr';
    var dom = (window.LERNA_DOMAINS || []).filter(function (d) { return d.id === o.domaine; })[0];
    var place = o.pays === 'AFR' ? (lang === 'en' ? 'Africa' : 'Afrique') : o.pays === 'INT' ? 'International' : o.pays === 'REMOTE' ? (lang === 'en' ? 'Remote' : 'À distance') : (window.LERNA_COUNTRY_NAME ? window.LERNA_COUNTRY_NAME(o.pays, lang) : o.pays);
    return [TYPE_NAME[o.type] ? TYPE_NAME[o.type][lang] : o.type, dom ? dom.label[lang] : '', place].filter(Boolean).join(' · ');
  };
  /* Titre affichable partout (les offres masquées n'ont pas de titre dans le code) */
  window.LERNA_OPP_TITLE = function (o) {
    if (o.masked) return ((window.Lerna && Lerna.lang === 'en') ? 'Premium offer — ' : 'Offre Premium — ') + window.LERNA_OPP_TEASER(o);
    return o.titre;
  };

  function mergeInto(list) {
    list.forEach(function (full) {
      if (!full || !full.id) return;
      var i = window.LERNA_OPPS.findIndex(function (o) { return o.id === full.id; });
      if (i !== -1) window.LERNA_OPPS[i] = full; else window.LERNA_OPPS.push(full);
    });
  }
  /* En ligne : la liste publique vient de Supabase (gérée depuis /admin), elle remplace la liste du code */
  var syncing = null;
  window.LERNA_OPPS_SYNC = function () {
    var L = window.Lerna;
    if (!L || !L.config.live || L.auth.mode !== 'supabase' || !L.auth.sb) return Promise.resolve(false);
    if (syncing) return syncing;
    syncing = L.auth.sb.from('opportunites').select('slug,data,is_premium').eq('active', true).then(function (r) {
      if (r.error || !Array.isArray(r.data) || !r.data.length) return false;
      var pub = [], teasers = [];
      r.data.forEach(function (row) {
        var d = row.data || {};
        if (!row.is_premium) pub.push(Object.assign({}, d, { id: row.slug, premium: false }));
      });
      /* Les aperçus Premium (sans nom) restent ceux du code ; les fiches publiques sont remplacées */
      window.LERNA_OPPS.forEach(function (o) { if (o.masked) teasers.push(o); });
      window.LERNA_OPPS = pub.concat(teasers);
      return true;
    }, function () { return false; });
    return syncing;
  };
  /* Récupère les fiches complètes des offres Premium (Premium payé, ou tout le monde avant le lancement) */
  var unlocking = null;
  window.LERNA_OPPS_UNLOCK = function () {
    var L = window.Lerna;
    if (!L || !L.config.live || !L.isPremium()) return window.LERNA_OPPS_SYNC();
    if (unlocking) return unlocking;
    unlocking = window.LERNA_OPPS_SYNC().then(function () {
      return L.api('/api/opps', {}).then(function (r) {
        if (!r.ok || !r.data || !Array.isArray(r.data.items)) return false;
        mergeInto(r.data.items);
        return true;
      }, function () { return false; });
    });
    return unlocking;
  };
  window.LERNA_LEVELS = {
    tous: { fr: 'Tous niveaux', en: 'All levels' },
    bac: { fr: 'Bac / lycée', en: 'High school' },
    bac2: { fr: 'Bac+2', en: '2 years of higher ed' },
    licence: { fr: 'Licence / Bachelor', en: "Bachelor's" },
    master: { fr: 'Master', en: "Master's" },
    doctorat: { fr: 'Doctorat / postdoc', en: 'PhD / postdoc' }
  };
})();
