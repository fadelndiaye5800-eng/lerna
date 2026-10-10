/* ==========================================================================
   LERNA — Base d'établissements (amorce locale, à migrer dans la table Supabase "ecoles")
   Tous les montants sont en USD, indicatifs (2025-2026). Les fiches disent honnêtement
   les points faibles. Quand une info n'est pas vérifiée : null → "Vérification en cours".
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en || fr }; }
  function F(nom, duree, debFr, debEn, nivFr, nivEn, langue) {
    return { nom: nom, duree: duree, debouches: T(debFr, debEn), niveau: T(nivFr, nivEn), langue: langue };
  }

  /* ---------- Modèles d'admission par système ---------- */
  window.LERNA_ADMISSION = {
    'africa-public': {
      conditions: T("Baccalauréat (ou équivalent) avec une série cohérente avec la filière. Les bacheliers nationaux passent par la plateforme nationale d'orientation ; les étudiants étrangers déposent un dossier auprès du service des étudiants étrangers ou via une bourse d'État.", "High-school diploma (or equivalent) in a track consistent with the programme. National students apply through the national orientation platform; international students apply through the international office or a government scholarship."),
      documents: [T('Diplôme du bac ou attestation de réussite', 'High-school diploma or pass certificate'), T('Relevés de notes des deux dernières années', 'Transcripts for the last two years'), T("Pièce d'identité ou passeport", 'ID card or passport'), T('Acte de naissance', 'Birth certificate'), T("Photos d'identité", 'Passport photos')],
      dates: T("Généralement entre juillet et octobre, après les résultats du bac — dates exactes publiées chaque année par le ministère.", 'Usually between July and October, after exam results — exact dates are published every year by the ministry.'),
      etapes: [T("Inscription sur la plateforme nationale d'orientation", 'Register on the national orientation platform'), T('Choix des filières par ordre de préférence', 'Rank your programme choices'), T("Publication des résultats d'orientation", 'Orientation results are published'), T("Inscription administrative et paiement des droits", 'Administrative enrolment and fee payment')]
    },
    'africa-private': {
      conditions: T("Baccalauréat ou équivalent. Sélection sur dossier, souvent complétée par un test écrit et un entretien de motivation.", 'High-school diploma or equivalent. Selection on application, often with a written test and a motivation interview.'),
      documents: [T('Formulaire de candidature', 'Application form'), T('Copie du bac et relevés de notes', 'Copy of diploma and transcripts'), T('Lettre de motivation', 'Motivation letter'), T("Pièce d'identité", 'ID document'), T('Frais de dossier (variables)', 'Application fee (varies)')],
      dates: T("Plusieurs sessions par an, le plus souvent entre avril et septembre pour une rentrée en octobre.", 'Several intakes a year, usually between April and September for an October start.'),
      etapes: [T('Dépôt du dossier en ligne ou sur place', 'Submit the application online or on site'), T('Test écrit (selon la filière)', 'Written test (depending on programme)'), T('Entretien de motivation', 'Motivation interview'), T('Résultats et inscription', 'Results and enrolment')]
    },
    'fr-public': {
      conditions: T("Bac français : Parcoursup. Bac étranger (hors UE) : procédure « Études en France » de Campus France dans plus de 60 pays, ou demande d'admission préalable (DAP) pour une 1ère année de licence. Niveau B2 en français demandé aux non-francophones (TCF ou DELF/DALF).", "French baccalauréat: Parcoursup. Non-EU diploma: Campus France 'Études en France' procedure in 60+ countries, or a prior admission request (DAP) for first-year bachelor. Non-French speakers need B2 French (TCF or DELF/DALF)."),
      documents: [T('Diplôme et relevés de notes traduits en français', 'Diploma and transcripts translated into French'), T('Test de français (TCF/DELF) si non francophone', 'French test (TCF/DELF) if not a French speaker'), T('Lettre de motivation / projet d\'études', 'Motivation letter / study plan'), T('Passeport', 'Passport'), T('CV', 'CV')],
      dates: T("Études en France : ouverture vers octobre, clôture vers mi-décembre pour une L1 (plus tard pour les masters). Parcoursup : vœux de janvier à mars. À vérifier chaque année.", "Études en France: opens around October, closes around mid-December for first-year bachelor (later for master's). Parcoursup: choices January to March. Check every year."),
      etapes: [T('Créer son dossier Études en France ou Parcoursup', 'Create your Études en France or Parcoursup file'), T('Passer le test de français si demandé', 'Take the French test if required'), T('Entretien Campus France', 'Campus France interview'), T("Réponse de l'université puis demande de visa étudiant", 'University decision, then student visa application')]
    },
    'fr-ge': {
      conditions: T("Candidature directe auprès de l'école, très sélective. Dossier académique solide, tests standardisés selon le programme (GMAT/GRE, TAGE MAGE), anglais certifié, essais et entretiens.", 'Direct application to the school, highly selective. Strong academic record, standardised tests depending on the programme (GMAT/GRE, TAGE MAGE), certified English, essays and interviews.'),
      documents: [T('Relevés de notes officiels', 'Official transcripts'), T('Score GMAT/GRE ou équivalent (selon programme)', 'GMAT/GRE score or equivalent (depending on programme)'), T("Test d'anglais (TOEFL, IELTS)", 'English test (TOEFL, IELTS)'), T('Essais et CV', 'Essays and CV'), T('Lettres de recommandation', 'Recommendation letters')],
      dates: T("Admissions en plusieurs « rounds », en général d'octobre à mars pour une rentrée en septembre.", 'Admissions in several rounds, usually from October to March for a September start.'),
      etapes: [T('Candidature en ligne', 'Online application'), T('Tests et essais', 'Tests and essays'), T('Entretien(s)', 'Interview(s)'), T('Décision par round', 'Decision for each round')]
    },
    'be': {
      conditions: T("Diplôme de fin de secondaire reconnu équivalent par la Fédération Wallonie-Bruxelles (demande d'équivalence obligatoire pour un diplôme étranger). Certaines filières (médecine, ingénieur civil) imposent un examen d'entrée.", 'Secondary diploma recognised as equivalent by the Wallonia-Brussels Federation (equivalence request required for foreign diplomas). Some programmes (medicine, engineering) have an entrance exam.'),
      documents: [T("Demande d'équivalence du diplôme", 'Diploma equivalence request'), T('Relevés de notes', 'Transcripts'), T('Passeport', 'Passport'), T('Preuve de niveau de français (selon profil)', 'Proof of French level (depending on profile)')],
      dates: T("Pour les candidats hors Union européenne, la date limite tombe généralement au printemps (autour de fin avril) — à vérifier sur le site officiel.", 'For non-EU applicants the deadline is usually in spring (around the end of April) — check the official website.'),
      etapes: [T("Demande d'équivalence", 'Equivalence request'), T('Demande d\'admission en ligne', 'Online admission request'), T("Examen d'entrée si filière concernée", 'Entrance exam if required'), T('Visa étudiant', 'Student visa')]
    },
    'de': {
      conditions: T("Le diplôme étranger doit être reconnu comme équivalent à l'Abitur. Sinon, une année de Studienkolleg (préparation) et l'examen « Feststellungsprüfung » sont nécessaires. Niveau de langue : allemand C1 (TestDaF/DSH) ou anglais pour les programmes anglophones.", 'Your foreign diploma must be recognised as equivalent to the German Abitur. Otherwise a preparatory year (Studienkolleg) and the Feststellungsprüfung exam are required. Language: German C1 (TestDaF/DSH) or English for English-taught programmes.'),
      documents: [T('Diplôme et relevés certifiés', 'Certified diploma and transcripts'), T('Preuve de langue (TestDaF, DSH, IELTS…)', 'Language proof (TestDaF, DSH, IELTS…)'), T('CV et lettre de motivation', 'CV and motivation letter'), T('Passeport', 'Passport'), T('Preuve de financement (compte bloqué) pour le visa', 'Proof of funds (blocked account) for the visa')],
      dates: T("Souvent 15 juillet pour le semestre d'hiver et 15 janvier pour le semestre d'été — chaque université fixe ses propres dates.", 'Often 15 July for the winter semester and 15 January for summer — each university sets its own dates.'),
      etapes: [T("Vérifier l'équivalence du diplôme (base anabin / DAAD)", 'Check diploma equivalence (anabin / DAAD database)'), T('Candidature via uni-assist ou le portail de l\'université', 'Apply through uni-assist or the university portal'), T('Ouvrir un compte bloqué', 'Open a blocked account'), T('Visa étudiant', 'Student visa')]
    },
    'ch': {
      conditions: T("Diplôme de fin d'études secondaires jugé équivalent à la maturité suisse, avec des exigences de notes et de matières. Certains diplômes imposent un examen complémentaire. Niveau de français B2 à C1 selon la faculté.", 'Secondary diploma deemed equivalent to the Swiss maturité, with grade and subject requirements. Some diplomas require an additional exam. French level B2 to C1 depending on the faculty.'),
      documents: [T('Diplôme et relevés de notes', 'Diploma and transcripts'), T('Attestation de langue', 'Language certificate'), T('Passeport', 'Passport'), T('Preuve de moyens financiers (visa)', 'Proof of financial means (visa)')],
      dates: T("Pour les étudiants qui ont besoin d'un visa, la date limite est généralement fin février pour une rentrée en septembre.", 'For students who need a visa, the deadline is usually the end of February for a September start.'),
      etapes: [T('Pré-inscription en ligne', 'Online pre-registration'), T('Vérification du diplôme', 'Diploma check'), T('Examen complémentaire si demandé', 'Additional exam if required'), T('Visa et permis de séjour', 'Visa and residence permit')]
    },
    'ca-qc': {
      conditions: T("Diplôme d'études secondaires plus une année d'études supérieures pour certains systèmes (le DEC québécois sert de référence). Dossier académique, puis Certificat d'acceptation du Québec (CAQ) et permis d'études.", 'Secondary diploma, plus a year of post-secondary study for some systems (the Quebec DEC is the reference). Academic record, then a Quebec Acceptance Certificate (CAQ) and study permit.'),
      documents: [T('Relevés de notes et diplômes', 'Transcripts and diplomas'), T('Preuve de maîtrise du français', 'Proof of French proficiency'), T('Passeport', 'Passport'), T('Preuve de capacité financière (CAQ / permis)', 'Proof of financial capacity (CAQ / permit)')],
      dates: T("En général 1er février pour une rentrée d'automne (septembre) — certains programmes ferment plus tôt.", 'Usually 1 February for a fall (September) start — some programmes close earlier.'),
      etapes: [T('Demande d\'admission en ligne', 'Online application'), T("Offre d'admission", 'Offer of admission'), T('Demande de CAQ', 'CAQ application'), T("Permis d'études fédéral", 'Federal study permit')]
    },
    'ca-on': {
      conditions: T("Excellent dossier secondaire, cours prérequis selon le programme, anglais certifié (IELTS/TOEFL) pour les non-anglophones. Candidature via OUAC (formulaire 105 pour l'international).", 'Excellent secondary record, programme prerequisites, certified English (IELTS/TOEFL) for non-native speakers. Apply through OUAC (form 105 for international students).'),
      documents: [T('Relevés de notes', 'Transcripts'), T("Test d'anglais", 'English test'), T('Profil personnel / essais selon le programme', 'Personal profile / essays depending on programme'), T('Passeport', 'Passport')],
      dates: T("Mi-janvier en général pour une rentrée en septembre ; plus tôt (début novembre) si tu vises la bourse Lester B. Pearson.", 'Usually mid-January for a September start; earlier (early November) if you are aiming for the Lester B. Pearson scholarship.'),
      etapes: [T('Candidature OUAC', 'OUAC application'), T('Documents complémentaires', 'Supporting documents'), T("Offre d'admission", 'Offer of admission'), T("Permis d'études", 'Study permit')]
    },
    'us': {
      conditions: T("Admission très sélective et « holistique » : notes, tests (SAT/ACT exigés au MIT), activités, essais, recommandations. Anglais certifié (TOEFL, IELTS, Duolingo English Test).", 'Highly selective, holistic admission: grades, tests (SAT/ACT required at MIT), activities, essays, recommendations. Certified English (TOEFL, IELTS, Duolingo English Test).'),
      documents: [T('Relevés de notes traduits', 'Translated transcripts'), T('Score SAT ou ACT', 'SAT or ACT score'), T("Test d'anglais", 'English test'), T('Essais', 'Essays'), T('Lettres de recommandation', 'Recommendation letters'), T("Dossier d'aide financière (CSS Profile)", 'Financial aid file (CSS Profile)')],
      dates: T("Early Action vers le 1er novembre, Regular Action vers début janvier.", 'Early Action around 1 November, Regular Action around early January.'),
      etapes: [T('Candidature en ligne', 'Online application'), T('Tests et essais', 'Tests and essays'), T('Entretien avec un ancien (si proposé)', 'Alumni interview (if offered)'), T('Décision en mars, visa F-1', 'Decision in March, F-1 visa')]
    },
    'gh': {
      conditions: T("WASSCE ou diplôme équivalent avec des crédits dans les matières clés. Les candidats internationaux postulent en ligne au guichet international.", 'WASSCE or equivalent with credits in core subjects. International applicants apply online through the international office.'),
      documents: [T('Résultats WASSCE ou équivalent', 'WASSCE results or equivalent'), T('Passeport', 'Passport'), T("Preuve d'anglais si nécessaire", 'Proof of English if needed'), T('Frais de candidature', 'Application fee')],
      dates: T("Les candidatures internationales ferment généralement au printemps pour une rentrée en août/septembre — à vérifier.", 'International applications usually close in spring for an August/September start — check.'),
      etapes: [T('Achat du formulaire / candidature en ligne', 'Buy the form / apply online'), T('Évaluation du dossier', 'Application review'), T("Lettre d'admission", 'Admission letter'), T('Permis de séjour étudiant', 'Student residence permit')]
    },
    'za': {
      conditions: T("Équivalence du diplôme via Universities South Africa (exemption), résultats suffisants dans les matières requises, anglais certifié pour les non-anglophones.", 'Diploma equivalence through Universities South Africa (exemption), sufficient results in required subjects, certified English for non-native speakers.'),
      documents: [T('Relevés de notes', 'Transcripts'), T('Certificat d\'exemption USAf', 'USAf exemption certificate'), T("Test d'anglais", 'English test'), T('Passeport', 'Passport')],
      dates: T("Candidatures de premier cycle ouvertes à partir d'avril, clôture fin juillet pour l'année suivante.", 'Undergraduate applications open from April and close at the end of July for the following year.'),
      etapes: [T('Candidature en ligne', 'Online application'), T('Exemption USAf', 'USAf exemption'), T('Offre', 'Offer'), T('Visa étudiant', 'Student visa')]
    },
    'asia': {
      conditions: T("Programmes en anglais accessibles avec un excellent dossier, anglais certifié et parfois un test d'entrée ou un entretien. Bourses d'État (MEXT au Japon, CSC en Chine, GKS en Corée) via l'ambassade de ton pays.", 'English-taught programmes open to strong applicants with certified English and sometimes an entrance test or interview. Government scholarships (MEXT Japan, CSC China, GKS Korea) through the embassy in your country.'),
      documents: [T('Relevés de notes', 'Transcripts'), T("Test d'anglais", 'English test'), T('Lettre de motivation', 'Motivation letter'), T('Lettres de recommandation', 'Recommendation letters'), T('Passeport', 'Passport')],
      dates: T("Souvent entre octobre et février pour une rentrée en septembre ; les bourses d'État ouvrent en général au printemps.", 'Often between October and February for a September start; government scholarships usually open in spring.'),
      etapes: [T('Candidature en ligne', 'Online application'), T('Test ou entretien', 'Test or interview'), T('Décision', 'Decision'), T('Visa étudiant', 'Student visa')]
    },
    'online': {
      conditions: T("Admission ouverte : diplôme de fin de secondaire (ou équivalent) et niveau de langue suffisant pour suivre les cours. Aucun déménagement nécessaire.", 'Open admission: secondary diploma (or equivalent) and enough language skill to follow classes. No relocation needed.'),
      documents: [T('Preuve de diplôme secondaire', 'Proof of secondary diploma'), T("Pièce d'identité", 'ID document'), T('Preuve de langue (selon le programme)', 'Language proof (depending on programme)')],
      dates: T('Plusieurs rentrées par an, candidatures en continu.', 'Several intakes a year, rolling applications.'),
      etapes: [T('Candidature en ligne', 'Online application'), T('Envoi des justificatifs', 'Upload documents'), T('Confirmation', 'Confirmation'), T('Démarrage des cours à distance', 'Start classes remotely')]
    }
  };

  /* ---------- Établissements ---------- */
  window.LERNA_SCHOOLS = [
    {
      id: 'ucad', nom: 'Université Cheikh Anta Diop (UCAD)', ville: 'Dakar', pays: 'SN', flag: '🇸🇳', type: 'public', fondee: 1957,
      site: 'https://www.ucad.sn', domaines: ['droit', 'sante', 'sciences', 'business', 'education', 'tech'], langues: ['fr'], duree: [3, 8],
      frais_local: 50, frais_etranger: 400, inscription: 0, logement: [60, 250], vie: [150, 250], adm: 'africa-public',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T("Plus grande université publique d'Afrique de l'Ouest francophone, diplômes reconnus par le CAMES.", "Largest public university in French-speaking West Africa; degrees recognised by CAMES."),
      desc: T("Université publique historique de Dakar, avec des facultés de médecine, droit, sciences, lettres et économie. Le coût est très bas pour les bacheliers sénégalais, mais les amphithéâtres sont souvent surchargés : il faut de l'autonomie pour réussir.", "Historic public university in Dakar with faculties of medicine, law, sciences, humanities and economics. Very low cost for Senegalese students, but lecture halls are often overcrowded: you need independence to succeed."),
      forts: [T('Frais quasi nuls pour les nationaux', 'Near-zero fees for nationals'), T('Large choix de filières, de la licence au doctorat', 'Wide choice from bachelor to PhD'), T('Diplômes reconnus dans toute la zone CAMES', 'Degrees recognised across the CAMES zone')],
      faibles: [T('Effectifs très élevés et grèves possibles qui décalent le calendrier', 'Very large classes and possible strikes that shift the calendar'), T("Logement universitaire très demandé, places limitées", 'University housing in high demand, limited places')],
      filieres: [F('Licence Sciences Économiques et de Gestion', 3, 'Banque, administration, analyse économique', 'Banking, administration, economic analysis', 'Bac (toutes séries, maths conseillées)', 'High-school diploma (maths recommended)', 'Français'), F('Licence Droit', 3, 'Juriste, concours administratifs, avocat (après master et CAPA)', 'Legal officer, civil service exams, lawyer (after master + bar)', 'Bac toutes séries', 'Any track', 'Français'), F('Doctorat en Médecine', 7, 'Médecin généraliste, spécialisation', 'General practitioner, specialisation', 'Bac scientifique, sélection', 'Science track, selective', 'Français'), F('Licence Mathématiques-Informatique', 3, 'Développement, data, enseignement', 'Software, data, teaching', 'Bac S', 'Science track', 'Français')],
      etu: { assos: T('Nombreuses amicales et associations par faculté et par région d\'origine.', 'Many student associations by faculty and region of origin.'), logement: T('Cités universitaires gérées par le COUD, places attribuées sur critères sociaux.', 'University residences run by COUD, places allocated on social criteria.'), resto: T('Restaurants universitaires du COUD à tarif social.', 'COUD university restaurants at subsidised prices.'), transport: T('Bus Dakar Dem Dikk et cars rapides ; le BRT dessert la zone.', 'Dakar Dem Dikk buses and minibuses; the BRT serves the area.'), sport: T('Stade universitaire et compétitions inter-facultés.', 'University stadium and inter-faculty competitions.') }
    },
    {
      id: 'cesag', nom: 'CESAG — Centre Africain d\'Études Supérieures en Gestion', ville: 'Dakar', pays: 'SN', flag: '🇸🇳', type: 'private', fondee: 1985,
      site: 'https://www.cesag.sn', domaines: ['business', 'sante'], langues: ['fr'], duree: [3, 5],
      frais_local: 4500, frais_etranger: 4500, inscription: 100, logement: [120, 300], vie: [150, 250], adm: 'africa-private',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T("Institution spécialisée de l'UEMOA, réputée en audit, finance et santé publique.", 'Specialised UEMOA institution known for audit, finance and public health.'),
      desc: T("Institution inter-États de l'UEMOA basée à Dakar, spécialisée en gestion, audit, comptabilité, finance et management de la santé. Promotions à taille humaine et forte présence des cabinets d'audit dans les débouchés. Les frais sont nettement plus élevés qu'à l'université publique.", 'Inter-state UEMOA institution in Dakar specialising in management, audit, accounting, finance and health management. Human-sized classes and strong links with audit firms. Fees are much higher than at a public university.'),
      forts: [T('Spécialisation pointue en audit, comptabilité et finance', 'Sharp specialisation in audit, accounting and finance'), T('Réseau d\'anciens dans les cabinets et banques de la sous-région', 'Alumni network in firms and banks across the region'), T('Programmes en santé publique et management de la santé', 'Public health and health management programmes')],
      faibles: [T('Coût élevé pour un budget faible', 'High cost for a low budget'), T("Offre de filières concentrée sur la gestion : peu d'options hors business et santé", 'Programmes concentrated on management: few options outside business and health')],
      filieres: [F('Licence Comptabilité-Contrôle-Audit (CCA)', 3, 'Audit, expertise comptable, contrôle de gestion', 'Audit, chartered accounting, management control', 'Bac (S ou ES conseillé)', 'High-school diploma (science or economics)', 'Français'), F('Licence Gestion (LPSG)', 3, 'Gestion d\'entreprise, banque, PME', 'Business management, banking, SMEs', 'Bac', 'High-school diploma', 'Français'), F('Master Banque-Finance', 2, 'Banque, finance d\'entreprise, marchés', 'Banking, corporate finance, markets', 'Licence', "Bachelor's", 'Français'), F('Master Santé publique / Management de la santé', 2, 'Gestion hospitalière, ONG santé, programmes publics', 'Hospital management, health NGOs, public programmes', 'Licence', "Bachelor's", 'Français')],
      etu: { assos: T('Bureau des étudiants et clubs (finance, débat, entrepreneuriat).', 'Student office and clubs (finance, debate, entrepreneurship).'), logement: null, resto: null, transport: T('Accessible en bus et taxis depuis le centre de Dakar.', 'Reachable by bus and taxi from central Dakar.'), sport: null }
    },
    {
      id: 'ism-dakar', nom: 'ISM — Groupe Institut Supérieur de Management', ville: 'Dakar', pays: 'SN', flag: '🇸🇳', type: 'private', fondee: 1992,
      site: 'https://www.groupeism.sn', domaines: ['business', 'droit', 'tech', 'comm', 'ingenierie'], langues: ['fr', 'en'], duree: [2, 5],
      frais_local: 3500, frais_etranger: 3800, inscription: 150, logement: [120, 300], vie: [150, 250], adm: 'africa-private',
      campus: 3, intl: 2, alternance: true, mode: 'campus',
      classement: T('Grand groupe privé d\'enseignement supérieur au Sénégal, membre d\'un réseau international.', 'Major private higher-education group in Senegal, part of an international network.'),
      desc: T("Groupe privé avec plusieurs écoles (management, droit, ingénierie, digital). Ambiance très active, beaucoup d'étudiants de la sous-région et des formations courtes professionnalisantes. La qualité varie selon les programmes : regarde bien la reconnaissance du diplôme visé.", 'Private group with several schools (management, law, engineering, digital). Very active atmosphere, many students from across the region and short professional programmes. Quality varies by programme: check the recognition of the specific degree.'),
      forts: [T('Formations courtes (BTS) à master', 'From short programmes to master\'s'), T('Vie étudiante animée et nombreux clubs', 'Lively student life and many clubs'), T('Partenariats internationaux pour des doubles diplômes', 'International partnerships for double degrees')],
      faibles: [T('Frais élevés comparés au public', 'High fees compared with public options'), T('Qualité et reconnaissance inégales selon les programmes', 'Uneven quality and recognition across programmes')],
      filieres: [F('BTS Commerce International', 2, 'Import-export, logistique, vente', 'Import-export, logistics, sales', 'Bac', 'High-school diploma', 'Français'), F('Bachelor Management', 3, 'Gestion, marketing, entrepreneuriat', 'Management, marketing, entrepreneurship', 'Bac', 'High-school diploma', 'Français'), F('Licence Droit des affaires', 3, 'Juriste d\'entreprise, conformité', 'Corporate legal, compliance', 'Bac', 'High-school diploma', 'Français'), F('Master Digital & Data', 2, 'Marketing digital, data analyst', 'Digital marketing, data analyst', 'Licence', "Bachelor's", 'Français / Anglais')],
      etu: { assos: T('Nombreux clubs, événements et compétitions inter-écoles.', 'Many clubs, events and inter-school competitions.'), logement: null, resto: null, transport: T('Campus en ville, bien desservis par bus et taxis.', 'City campuses, well served by buses and taxis.'), sport: T('Tournois inter-écoles.', 'Inter-school tournaments.') }
    },
    {
      id: 'ufhb', nom: 'Université Félix Houphouët-Boigny', ville: 'Abidjan', pays: 'CI', flag: '🇨🇮', type: 'public', fondee: 1964,
      site: 'https://www.univ-fhb.edu.ci', domaines: ['droit', 'sante', 'sciences', 'business', 'education'], langues: ['fr'], duree: [3, 8],
      frais_local: 60, frais_etranger: 500, inscription: 0, logement: [100, 300], vie: [150, 250], adm: 'africa-public',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T('Première université publique de Côte d\'Ivoire, diplômes CAMES.', "Côte d'Ivoire's leading public university, CAMES degrees."),
      desc: T("Grande université publique du campus de Cocody. Très accessible financièrement pour les Ivoiriens, avec un large éventail de filières. Comme beaucoup d'universités publiques de la région, les effectifs sont importants et le calendrier peut glisser.", "Large public university on the Cocody campus. Very affordable for Ivorians with a wide range of programmes. Like many public universities in the region, classes are large and the calendar can slip."),
      forts: [T('Coût très faible pour les nationaux', 'Very low cost for nationals'), T('Grande variété de filières', 'Wide variety of programmes'), T('Situation centrale à Abidjan, pôle économique', 'Central location in Abidjan, an economic hub')],
      faibles: [T('Amphithéâtres surchargés', 'Overcrowded lecture halls'), T('Peu de places en résidence universitaire', 'Few university residence places')],
      filieres: [F('Licence Sciences Économiques', 3, 'Banque, statistiques, administration', 'Banking, statistics, administration', 'Bac', 'High-school diploma', 'Français'), F('Licence Droit', 3, 'Juriste, concours', 'Legal officer, civil service', 'Bac', 'High-school diploma', 'Français'), F('Doctorat en Médecine', 7, 'Médecin', 'Doctor', 'Bac scientifique, concours', 'Science track, entrance exam', 'Français'), F('Licence Biosciences', 3, 'Laboratoire, agroalimentaire, enseignement', 'Labs, food industry, teaching', 'Bac S', 'Science track', 'Français')],
      etu: { assos: T('Associations par filière et par région.', 'Associations by programme and region.'), logement: T('Cités universitaires (CROU) avec places limitées.', 'University residences (CROU) with limited places.'), resto: T('Restaurants universitaires à tarif social.', 'University restaurants at subsidised prices.'), transport: T('Bus SOTRA, gbakas et woro-woros.', 'SOTRA buses, gbakas and shared taxis.'), sport: null }
    },
    {
      id: 'inphb', nom: 'Institut National Polytechnique Félix Houphouët-Boigny (INP-HB)', ville: 'Yamoussoukro', pays: 'CI', flag: '🇨🇮', type: 'public', fondee: 1996,
      site: 'https://www.inphb.ci', domaines: ['ingenierie', 'agri', 'business', 'sciences', 'tech'], langues: ['fr'], duree: [2, 5],
      frais_local: 300, frais_etranger: 1500, inscription: 0, logement: [40, 120], vie: [100, 180], adm: 'africa-private',
      campus: 3, intl: 2, alternance: false, mode: 'campus',
      classement: T("Grande école d'ingénieurs de référence en Afrique de l'Ouest.", 'Leading engineering school in West Africa.'),
      desc: T("Grande école publique d'ingénieurs et de techniciens, recrutée sur concours très sélectif. Campus résidentiel à Yamoussoukro, encadrement plus serré qu'à l'université. Les places sont rares et la préparation au concours demande un vrai travail en maths et sciences.", 'Public engineering and technical school recruiting through a very selective entrance exam. Residential campus in Yamoussoukro with closer supervision than at university. Places are scarce and preparing for the exam takes serious work in maths and science.'),
      forts: [T("Diplômes d'ingénieur très recherchés par les employeurs", 'Engineering degrees highly valued by employers'), T('Campus résidentiel avec vie étudiante intense', 'Residential campus with intense student life'), T('Écoles en agronomie, mines, génie civil, commerce', 'Schools in agronomy, mining, civil engineering, business')],
      faibles: [T('Concours très sélectif', 'Very selective entrance exam'), T('Ville plus calme, moins d\'opportunités de stages qu\'à Abidjan', 'Quieter city, fewer internships than in Abidjan')],
      filieres: [F('Classes préparatoires (CPGE)', 2, 'Accès aux écoles d\'ingénieurs', 'Access to engineering schools', 'Bac C ou D, concours', 'Science track, entrance exam', 'Français'), F('Ingénieur Génie Civil', 3, 'BTP, bureaux d\'études, travaux publics', 'Construction, design offices, public works', 'Prépa ou concours', 'Prep class or exam', 'Français'), F('Ingénieur Agronome', 3, 'Agro-industrie, développement rural', 'Agribusiness, rural development', 'Prépa ou concours', 'Prep class or exam', 'Français'), F('DTS (Technicien Supérieur)', 2, 'Technicien en industrie, informatique, commerce', 'Technician in industry, IT, trade', 'Bac + concours', 'Diploma + exam', 'Français')],
      etu: { assos: T('Clubs techniques et culturels très actifs, tradition des promotions.', 'Very active technical and cultural clubs, strong class traditions.'), logement: T('Résidences sur le campus.', 'On-campus residences.'), resto: T('Restauration sur le campus.', 'On-campus dining.'), transport: T('Campus en périphérie de Yamoussoukro.', 'Campus on the outskirts of Yamoussoukro.'), sport: T('Installations sportives sur le campus.', 'Sports facilities on campus.') }
    },
    {
      id: 'ug-legon', nom: 'University of Ghana', ville: 'Accra (Legon)', pays: 'GH', flag: '🇬🇭', type: 'public', fondee: 1948,
      site: 'https://www.ug.edu.gh', domaines: ['business', 'sciences', 'sante', 'droit', 'agri', 'comm', 'education'], langues: ['en'], duree: [4, 7],
      frais_local: 700, frais_etranger: 4500, inscription: 100, logement: [100, 350], vie: [150, 250], adm: 'gh',
      campus: 3, intl: 2, alternance: false, mode: 'campus',
      classement: T("Parmi les universités les mieux classées d'Afrique de l'Ouest.", 'Among the highest-ranked universities in West Africa.'),
      desc: T("Plus ancienne et plus grande université du Ghana, sur un grand campus à Legon. Enseignement en anglais, licences en 4 ans. Une bonne option anglophone dans la région, avec une vie de campus riche. Les frais internationaux sont bien plus élevés que pour les Ghanéens.", "Ghana's oldest and largest university on a big campus in Legon. Teaching in English, 4-year bachelor's degrees. A good English-speaking option in the region with a rich campus life. International fees are much higher than for Ghanaians."),
      forts: [T('Enseignement en anglais en Afrique de l\'Ouest', 'English-taught in West Africa'), T('Grand campus avec halls de résidence', 'Large campus with halls of residence'), T('Large éventail de disciplines', 'Broad range of subjects')],
      faibles: [T('Frais internationaux élevés par rapport aux nationaux', 'International fees much higher than for nationals'), T('Logement sur le campus parfois insuffisant', 'On-campus housing sometimes insufficient')],
      filieres: [F('BSc Administration', 4, 'Comptabilité, finance, marketing', 'Accounting, finance, marketing', 'WASSCE ou équivalent', 'WASSCE or equivalent', 'Anglais'), F('BSc Computer Science', 4, 'Développement, systèmes', 'Software, systems', 'WASSCE avec maths', 'WASSCE with maths', 'Anglais'), F('BA Political Science', 4, 'Administration, ONG, diplomatie', 'Administration, NGOs, diplomacy', 'WASSCE', 'WASSCE', 'Anglais'), F('BSc Agriculture', 4, 'Agro-industrie, recherche', 'Agribusiness, research', 'WASSCE sciences', 'WASSCE sciences', 'Anglais')],
      etu: { assos: T('Système de « halls » avec une forte identité, nombreux clubs.', 'Strong hall culture and many clubs.'), logement: T('Halls de résidence et hostels privés autour du campus.', 'Halls of residence and private hostels around campus.'), resto: T('Cafétérias et restauration autour des halls.', 'Cafeterias and food around the halls.'), transport: T('Navettes internes ; trotros vers Accra.', 'Internal shuttles; trotros into Accra.'), sport: T('Stade et terrains sur le campus.', 'Stadium and fields on campus.') }
    },
    {
      id: 'unilag', nom: 'University of Lagos (UNILAG)', ville: 'Lagos', pays: 'NG', flag: '🇳🇬', type: 'public', fondee: 1962,
      site: 'https://unilag.edu.ng', domaines: ['business', 'ingenierie', 'droit', 'sante', 'sciences', 'comm'], langues: ['en'], duree: [4, 6],
      frais_local: 200, frais_etranger: 2000, inscription: 50, logement: [100, 400], vie: [150, 250], adm: 'africa-public',
      campus: 3, intl: 2, alternance: false, mode: 'campus',
      classement: T('Une des universités fédérales les plus demandées du Nigeria.', "One of Nigeria's most sought-after federal universities."),
      desc: T("Université fédérale au bord de la lagune, très demandée par les étudiants nigérians. Accès par l'examen UTME (JAMB) pour les nationaux. Lagos offre un marché du travail énorme, mais la ville est chère et embouteillée.", 'Federal university on the lagoon, highly demanded by Nigerian students. Nationals enter through the UTME (JAMB) exam. Lagos offers a huge job market, but the city is expensive and congested.'),
      forts: [T('Situation au cœur du principal pôle économique d\'Afrique de l\'Ouest', 'At the heart of West Africa\'s main economic hub'), T('Facultés reconnues en ingénierie, droit et business', 'Recognised engineering, law and business faculties')],
      faibles: [T('Concurrence forte à l\'entrée', 'Strong competition for entry'), T('Coût de la vie élevé à Lagos', 'High cost of living in Lagos')],
      filieres: [F('BSc Accounting', 4, 'Audit, finance', 'Audit, finance', 'UTME + O-levels', 'UTME + O-levels', 'Anglais'), F('BEng Electrical Engineering', 5, 'Énergie, télécoms', 'Energy, telecoms', 'UTME sciences', 'UTME sciences', 'Anglais'), F('LLB Law', 5, 'Avocat (après Law School)', 'Lawyer (after Law School)', 'UTME', 'UTME', 'Anglais'), F('BSc Mass Communication', 4, 'Médias, journalisme, publicité', 'Media, journalism, advertising', 'UTME', 'UTME', 'Anglais')],
      etu: { assos: T('Associations et clubs nombreux.', 'Numerous associations and clubs.'), logement: T('Halls de résidence très demandés.', 'Halls of residence in high demand.'), resto: null, transport: T('Bus internes ; danfos et BRT en ville.', 'Internal buses; danfos and BRT in the city.'), sport: null }
    },
    {
      id: '2ie', nom: '2iE — Institut International d\'Ingénierie de l\'Eau et de l\'Environnement', ville: 'Ouagadougou', pays: 'BF', flag: '🇧🇫', type: 'private', fondee: 1970,
      site: 'https://www.2ie-edu.org', domaines: ['ingenierie', 'agri', 'sciences'], langues: ['fr', 'en'], duree: [3, 5],
      frais_local: 5500, frais_etranger: 5500, inscription: 0, logement: [80, 200], vie: [120, 200], adm: 'africa-private',
      campus: 2, intl: 3, alternance: false, mode: 'campus',
      classement: T("Diplôme d'ingénieur accrédité par la CTI (France) — reconnu à l'international.", 'Engineering degree accredited by CTI (France) — internationally recognised.'),
      desc: T("École d'ingénieurs internationale spécialisée dans l'eau, l'énergie, le génie civil et l'environnement. Étudiants de toute l'Afrique, accréditation internationale. Frais élevés pour la région, mais nombreuses bourses de partenaires.", 'International engineering school specialising in water, energy, civil engineering and the environment. Students from across Africa, international accreditation. High fees for the region, but many partner scholarships.'),
      forts: [T('Accréditation CTI et EUR-ACE', 'CTI and EUR-ACE accreditation'), T('Spécialités très demandées : eau, énergie, BTP', 'In-demand specialisms: water, energy, construction'), T('Brassage panafricain', 'Pan-African student body')],
      faibles: [T('Coût élevé sans bourse', 'High cost without a scholarship'), T('Contexte sécuritaire régional à surveiller', 'Regional security context to keep an eye on')],
      filieres: [F('Bachelor Génie Civil & Hydraulique', 3, 'Technicien supérieur BTP et eau', 'Senior technician in construction and water', 'Bac scientifique', 'Science track', 'Français'), F('Ingénieur Eau & Assainissement', 5, 'ONG, bureaux d\'études, sociétés d\'eau', 'NGOs, consultancies, water utilities', 'Bac S ou Bachelor', 'Science track or bachelor', 'Français / Anglais'), F('Ingénieur Énergie & Génie électrique', 5, 'Énergies renouvelables, électrification', 'Renewables, electrification', 'Bac S ou Bachelor', 'Science track or bachelor', 'Français / Anglais'), F('Master Environnement', 2, 'Études d\'impact, développement durable', 'Impact studies, sustainability', 'Licence', "Bachelor's", 'Français / Anglais')],
      etu: { assos: T('Associations par nationalité et clubs techniques.', 'Associations by nationality and technical clubs.'), logement: T('Résidences sur le campus de Kamboinsé.', 'Residences on the Kamboinsé campus.'), resto: T('Restauration sur le campus.', 'On-campus dining.'), transport: null, sport: null }
    },
    {
      id: 'um5', nom: 'Université Mohammed V de Rabat', ville: 'Rabat', pays: 'MA', flag: '🇲🇦', type: 'public', fondee: 1957,
      site: 'https://www.um5.ac.ma', domaines: ['droit', 'sante', 'sciences', 'ingenierie', 'business', 'education'], langues: ['fr', 'ar'], duree: [3, 8],
      frais_local: 0, frais_etranger: 0, inscription: 50, logement: [150, 400], vie: [200, 300], adm: 'africa-public',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T("Une des principales universités publiques du Maroc.", "One of Morocco's leading public universities."),
      desc: T("Grande université publique de la capitale, avec médecine, ingénierie (EMI), droit et sciences. Pas de frais de scolarité dans le public ; les étudiants étrangers passent souvent par les bourses de l'AMCI. Enseignement en français et en arabe selon les filières.", 'Large public university in the capital with medicine, engineering (EMI), law and sciences. No tuition in the public system; international students often come through AMCI scholarships. Teaching in French and Arabic depending on the programme.'),
      forts: [T('Pas de frais de scolarité', 'No tuition fees'), T('Bourses AMCI pour de nombreux pays africains', 'AMCI scholarships for many African countries'), T("Écoles d'ingénieurs et faculté de médecine réputées", 'Well-known engineering schools and medical faculty')],
      faibles: [T('Accès des étrangers surtout via quotas et bourses', 'International access mainly through quotas and scholarships'), T("Certaines filières en arabe : vérifie la langue d'enseignement", 'Some programmes taught in Arabic: check the language')],
      filieres: [F('Licence Économie et Gestion', 3, 'Banque, administration, entreprise', 'Banking, administration, business', 'Bac', 'High-school diploma', 'Français'), F('Doctorat en Médecine', 7, 'Médecin', 'Doctor', 'Bac sciences, concours', 'Science track, entrance exam', 'Français'), F('Ingénieur (EMI)', 3, 'Génie civil, informatique, industriel', 'Civil, IT, industrial engineering', 'Classes préparatoires + concours', 'Prep classes + exam', 'Français'), F('Licence Droit (FR ou AR)', 3, 'Juriste, concours', 'Legal officer, civil service', 'Bac', 'High-school diploma', 'Français / Arabe')],
      etu: { assos: null, logement: T('Cité universitaire internationale et logements privés à Agdal.', 'International university residence and private housing in Agdal.'), resto: null, transport: T('Tramway Rabat-Salé et bus.', 'Rabat-Salé tramway and buses.'), sport: null }
    },
    {
      id: 'um6p', nom: 'Université Mohammed VI Polytechnique (UM6P)', ville: 'Ben Guerir', pays: 'MA', flag: '🇲🇦', type: 'private', fondee: 2017,
      site: 'https://www.um6p.ma', domaines: ['ingenierie', 'tech', 'agri', 'business', 'sciences'], langues: ['en', 'fr'], duree: [3, 5],
      frais_local: 8000, frais_etranger: 8000, inscription: 0, logement: [150, 300], vie: [150, 250], adm: 'africa-private',
      campus: 3, intl: 2, alternance: false, mode: 'campus',
      classement: T('Université de recherche récente, en forte progression, très orientée innovation.', 'Young research university, rising fast, strongly innovation-oriented.'),
      desc: T("Université à but non lucratif soutenue par le groupe OCP, avec un campus moderne à Ben Guerir. Forte orientation recherche, entrepreneuriat et data. Les frais affichés sont élevés mais l'université annonce de nombreuses bourses sur critères sociaux et de mérite.", 'Non-profit university backed by the OCP group with a modern campus in Ben Guerir. Strong focus on research, entrepreneurship and data. Listed fees are high but the university advertises many need- and merit-based scholarships.'),
      forts: [T('Campus moderne et équipements de recherche', 'Modern campus and research facilities'), T('Programmes en anglais et en français', 'Programmes in English and French'), T('Bourses nombreuses', 'Many scholarships')],
      faibles: [T('Ville de Ben Guerir petite et isolée', 'Ben Guerir is a small, isolated town'), T('Établissement jeune : réseau d\'anciens encore limité', 'Young institution: alumni network still small')],
      filieres: [F('Bachelor Computer Science', 3, 'Développement, IA, data', 'Software, AI, data', 'Bac scientifique', 'Science track', 'Anglais'), F('Ingénieur (cycle intégré)', 5, 'Génie industriel, énergie, matériaux', 'Industrial, energy, materials engineering', 'Bac S, sélection', 'Science track, selective', 'Français / Anglais'), F('Bachelor Agriculture & Environnement', 3, 'Agritech, durabilité', 'Agritech, sustainability', 'Bac sciences', 'Science track', 'Anglais'), F('Master Management', 2, 'Conseil, gestion de projets', 'Consulting, project management', 'Licence', "Bachelor's", 'Anglais')],
      etu: { assos: T('Clubs étudiants et incubateur sur le campus.', 'Student clubs and an on-campus incubator.'), logement: T('Résidences sur le campus.', 'On-campus residences.'), resto: T('Restauration sur le campus.', 'On-campus dining.'), transport: T('Gare de Ben Guerir sur la ligne Casablanca–Marrakech.', 'Ben Guerir station on the Casablanca–Marrakesh line.'), sport: T('Installations sportives modernes.', 'Modern sports facilities.') }
    },
    {
      id: 'uct', nom: 'University of Cape Town (UCT)', ville: 'Le Cap', pays: 'ZA', flag: '🇿🇦', type: 'public', fondee: 1829,
      site: 'https://www.uct.ac.za', domaines: ['sante', 'business', 'sciences', 'ingenierie', 'droit', 'art'], langues: ['en'], duree: [3, 6],
      frais_local: 4000, frais_etranger: 7500, inscription: 0, logement: [300, 600], vie: [250, 400], adm: 'za',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T("Souvent classée meilleure université d'Afrique (QS, THE).", 'Often ranked the best university in Africa (QS, THE).'),
      desc: T("Université de recherche de premier plan au pied de Table Mountain. Niveau académique élevé et reconnaissance internationale. Pour les étudiants étrangers, il faut compter des frais internationaux et un coût de vie plus élevé qu'ailleurs sur le continent.", 'Leading research university at the foot of Table Mountain. High academic standard and international recognition. International students pay international fees and a higher cost of living than elsewhere on the continent.'),
      forts: [T('Reconnaissance internationale forte', 'Strong international recognition'), T('Recherche de haut niveau en santé et sciences', 'High-level research in health and sciences'), T('Cadre de vie exceptionnel', 'Exceptional setting')],
      faibles: [T('Coût total élevé pour un étudiant étranger', 'High total cost for an international student'), T('Questions de sécurité à prendre au sérieux en ville', 'Safety in the city needs to be taken seriously')],
      filieres: [F('BCom', 3, 'Finance, comptabilité, économie', 'Finance, accounting, economics', 'Matric ou équivalent avec maths', 'Matric or equivalent with maths', 'Anglais'), F('MBChB (Médecine)', 6, 'Médecin', 'Doctor', 'Très sélectif', 'Very selective', 'Anglais'), F('BSc Engineering', 4, 'Ingénieur civil, électrique, chimique', 'Civil, electrical, chemical engineer', 'Maths et physique', 'Maths and physics', 'Anglais'), F('BA Fine Art', 4, 'Arts visuels, design', 'Visual arts, design', 'Portfolio', 'Portfolio', 'Anglais')],
      etu: { assos: T('Plus de 100 sociétés étudiantes.', 'More than 100 student societies.'), logement: T('Résidences universitaires attribuées sur dossier.', 'University residences allocated on application.'), resto: T('Restauration en résidence et sur le campus.', 'Dining in residences and on campus.'), transport: T('Jammie Shuttle gratuit entre les campus.', 'Free Jammie Shuttle between campuses.'), sport: T('Nombreux clubs sportifs, nature et montagne.', 'Many sports clubs, outdoors and mountain.') }
    },
    {
      id: 'strathmore', nom: 'Strathmore University', ville: 'Nairobi', pays: 'KE', flag: '🇰🇪', type: 'private', fondee: 1961,
      site: 'https://strathmore.edu', domaines: ['business', 'tech', 'droit', 'sciences'], langues: ['en'], duree: [4, 5],
      frais_local: 3500, frais_etranger: 4200, inscription: 100, logement: [150, 400], vie: [150, 300], adm: 'africa-private',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T('Réputée au Kenya en business, finance et technologie.', 'Well known in Kenya for business, finance and technology.'),
      desc: T("Université privée de Nairobi connue pour ses programmes en commerce, finance, informatique et droit, et pour ses liens avec l'écosystème tech kényan. Encadrement exigeant et discipline académique stricte.", "Private university in Nairobi known for commerce, finance, IT and law programmes and its ties to Kenya's tech ecosystem. Demanding supervision and strict academic discipline."),
      forts: [T('Proximité avec l\'écosystème tech de Nairobi', 'Close to Nairobi\'s tech ecosystem'), T('Programmes en finance et informatique reconnus', 'Recognised finance and IT programmes')],
      faibles: [T('Logement sur campus limité', 'Limited on-campus housing'), T('Cadre très strict qui ne plaît pas à tout le monde', 'Very strict environment that does not suit everyone')],
      filieres: [F('Bachelor of Commerce', 4, 'Finance, comptabilité', 'Finance, accounting', 'KCSE C+ ou équivalent', 'KCSE C+ or equivalent', 'Anglais'), F('BSc Informatics & Computer Science', 4, 'Développement, data', 'Software, data', 'KCSE avec maths', 'KCSE with maths', 'Anglais'), F('Bachelor of Laws', 4, 'Droit des affaires', 'Business law', 'KCSE B+', 'KCSE B+', 'Anglais')],
      etu: { assos: T('Clubs actifs, notamment tech et débat.', 'Active clubs, especially tech and debate.'), logement: null, resto: null, transport: T('Matatus et bus vers Madaraka.', 'Matatus and buses to Madaraka.'), sport: null }
    },
    {
      id: 'ubordeaux', nom: 'Université de Bordeaux', ville: 'Bordeaux', pays: 'FR', flag: '🇫🇷', type: 'public', fondee: 1441,
      site: 'https://www.u-bordeaux.fr', domaines: ['sante', 'sciences', 'droit', 'business', 'education', 'tech'], langues: ['fr'], duree: [3, 8],
      frais_local: 200, frais_etranger: 3150, inscription: 115, logement: [450, 700], vie: [350, 500], adm: 'fr-public',
      campus: 3, intl: 3, alternance: true, mode: 'campus',
      classement: T('Grande université de recherche française, présente dans le classement de Shanghai.', 'Major French research university, listed in the Shanghai ranking.'),
      desc: T("Université publique pluridisciplinaire, forte en santé, sciences et droit. Les étudiants hors UE peuvent payer des frais « différenciés » (environ 3 150 $ en licence), mais de nombreuses exonérations existent. Bordeaux est une ville étudiante agréable, avec un logement plus abordable qu'à Paris.", 'Multidisciplinary public university, strong in health, sciences and law. Non-EU students may pay differentiated fees (about $3,150 for a bachelor), but many exemptions exist. Bordeaux is a pleasant student city with more affordable housing than Paris.'),
      forts: [T('Diplômes nationaux reconnus en Europe', 'National degrees recognised in Europe'), T('Frais très bas pour les Européens, exonérations fréquentes', 'Very low fees for Europeans, frequent exemptions'), T('Ville étudiante à taille humaine', 'Human-sized student city')],
      faibles: [T("Démarches de visa et de logement longues à anticiper", 'Visa and housing procedures take time to plan'), T('Grandes promotions en première année', 'Large first-year classes')],
      filieres: [F('Licence Économie-Gestion', 3, 'Banque, gestion, analyse', 'Banking, management, analysis', 'Bac ou équivalent', 'Diploma or equivalent', 'Français'), F('Licence Droit', 3, 'Master puis métiers du droit', 'Master then legal careers', 'Bac', 'Diploma', 'Français'), F('PASS / LAS (Santé)', 6, 'Médecine, pharmacie, maïeutique', 'Medicine, pharmacy, midwifery', 'Bac scientifique conseillé', 'Science track recommended', 'Français'), F('Licence Informatique', 3, 'Développement, systèmes, data', 'Software, systems, data', 'Bac avec maths', 'Diploma with maths', 'Français')],
      etu: { assos: T('Centaines d\'associations, vie étudiante animée.', 'Hundreds of associations, lively student life.'), logement: T('Résidences CROUS (places limitées) et logement privé.', 'CROUS residences (limited) and private housing.'), resto: T('Restaurants universitaires CROUS à prix social.', 'Subsidised CROUS university restaurants.'), transport: T('Tramway et bus TBM, tarif étudiant.', 'TBM tram and buses, student rate.'), sport: T('Service des sports avec de nombreuses activités.', 'Sports service with many activities.') }
    },
    {
      id: 'sorbonne', nom: 'Sorbonne Université', ville: 'Paris', pays: 'FR', flag: '🇫🇷', type: 'public', fondee: 2018,
      site: 'https://www.sorbonne-universite.fr', domaines: ['sciences', 'sante', 'art', 'education'], langues: ['fr'], annee_langue: ['fr'], duree: [3, 8],
      frais_local: 200, frais_etranger: 3150, inscription: 115, logement: [700, 1200], vie: [450, 650], adm: 'fr-public',
      campus: 2, intl: 3, alternance: false, mode: 'campus',
      classement: T('Parmi les meilleures universités françaises (QS, Shanghai).', 'Among the top French universities (QS, Shanghai).'),
      desc: T("Université de recherche issue de la fusion de Paris-Sorbonne et Pierre-et-Marie-Curie : lettres, sciences et médecine. Prestige et exigence académique au cœur de Paris. Le logement à Paris est cher et difficile à trouver.", 'Research university formed from Paris-Sorbonne and Pierre-et-Marie-Curie: humanities, sciences and medicine. Prestige and academic rigour in the heart of Paris. Housing in Paris is expensive and hard to find.'),
      forts: [T('Reconnaissance mondiale en sciences et lettres', 'Worldwide recognition in sciences and humanities'), T('Frais publics français', 'French public fees'), T('Vie culturelle parisienne', 'Parisian cultural life')],
      faibles: [T('Coût de la vie très élevé à Paris', 'Very high cost of living in Paris'), T('Peu d\'accompagnement individuel en licence', 'Little individual support at bachelor level')],
      filieres: [F('Licence Mathématiques', 3, 'Recherche, finance quantitative, enseignement', 'Research, quant finance, teaching', 'Bac scientifique', 'Science track', 'Français'), F('Licence Lettres modernes', 3, 'Édition, enseignement, communication', 'Publishing, teaching, communication', 'Bac', 'Diploma', 'Français'), F('PASS (Santé)', 6, 'Médecine, pharmacie', 'Medicine, pharmacy', 'Bac scientifique', 'Science track', 'Français'), F('Licence Sciences de la Vie', 3, 'Biologie, recherche', 'Biology, research', 'Bac scientifique', 'Science track', 'Français')],
      etu: { assos: T('Nombreuses associations étudiantes.', 'Many student associations.'), logement: T('Résidences CROUS et Cité internationale universitaire (places limitées).', 'CROUS residences and Cité internationale universitaire (limited).'), resto: T('Restaurants CROUS.', 'CROUS restaurants.'), transport: T('Métro, RER, bus — Pass Navigo tarif jeune.', 'Metro, RER, buses — youth Navigo pass.'), sport: null }
    },
    {
      id: 'sciencespo', nom: 'Sciences Po Paris', ville: 'Paris', pays: 'FR', flag: '🇫🇷', type: 'public', fondee: 1872,
      site: 'https://www.sciencespo.fr', domaines: ['droit', 'business', 'comm', 'education'], langues: ['fr', 'en'], duree: [3, 5],
      frais_local: 6000, frais_etranger: 16000, inscription: 0, logement: [700, 1200], vie: [450, 650], adm: 'fr-ge',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T('Dans le top 5 mondial en sciences politiques et relations internationales (QS par discipline).', 'Top 5 worldwide in politics and international relations (QS by subject).'),
      desc: T("Établissement sélectif en sciences sociales, politiques publiques, droit et journalisme, avec des campus en région (Reims, Menton, Poitiers…) pour le Collège universitaire. Les frais dépendent des revenus pour les familles européennes ; hors UE, ils sont élevés, avec des bourses.", 'Selective institution in social sciences, public policy, law and journalism, with regional campuses (Reims, Menton, Poitiers…) for the undergraduate college. Fees depend on income for European families; for non-EU students they are high, with scholarships.'),
      forts: [T('Réseau international exceptionnel', 'Exceptional international network'), T('Année obligatoire à l\'étranger en licence', 'Compulsory year abroad in the bachelor'), T('Enseignement bilingue', 'Bilingual teaching')],
      faibles: [T('Très sélectif', 'Very selective'), T('Frais élevés hors UE', 'High non-EU fees')],
      filieres: [F('Bachelor (Collège universitaire)', 3, 'Masters, fonction publique, international', "Master's, public service, international", 'Bac + dossier + entretien', 'Diploma + file + interview', 'Français / Anglais'), F('Master Affaires internationales', 2, 'Diplomatie, ONG, organisations internationales', 'Diplomacy, NGOs, international organisations', 'Licence', "Bachelor's", 'Anglais'), F('Master Journalisme', 2, 'Journaliste, médias', 'Journalist, media', 'Licence', "Bachelor's", 'Français / Anglais'), F('Master Droit économique', 2, 'Avocat d\'affaires, conformité', 'Business lawyer, compliance', 'Licence', "Bachelor's", 'Français')],
      etu: { assos: T('Associations très actives (débat, humanitaire, arts).', 'Very active associations (debate, humanitarian, arts).'), logement: T('Pas de logement garanti ; aide à la recherche.', 'No guaranteed housing; help with searching.'), resto: T('Accès aux restaurants CROUS.', 'Access to CROUS restaurants.'), transport: T('Transports parisiens.', 'Paris public transport.'), sport: T('Association sportive et compétitions inter-campus.', 'Sports association and inter-campus competitions.') }
    },
    {
      id: 'hec', nom: 'HEC Paris', ville: 'Jouy-en-Josas', pays: 'FR', flag: '🇫🇷', type: 'private', fondee: 1881,
      site: 'https://www.hec.edu', domaines: ['business'], langues: ['en', 'fr'], duree: [1, 3],
      frais_local: 29000, frais_etranger: 29000, inscription: 0, logement: [800, 1200], vie: [450, 650], adm: 'fr-ge',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T("Régulièrement en tête des business schools européennes (Financial Times).", 'Regularly at the top of European business schools (Financial Times).'),
      desc: T("Grande école de commerce de premier plan, sur un campus boisé près de Versailles. Programmes post-bac (Bachelor avec l'École polytechnique) et surtout masters et MBA. Les débouchés en conseil et finance sont excellents, mais l'investissement financier est lourd.", 'Top business school on a wooded campus near Versailles. Undergraduate programme (Bachelor with École polytechnique) and above all master\'s and MBA. Excellent outcomes in consulting and finance, but a heavy financial investment.'),
      forts: [T('Réseau d\'anciens très puissant', 'Very powerful alumni network'), T('Débouchés en conseil, finance, entrepreneuriat', 'Outcomes in consulting, finance, entrepreneurship'), T('Campus résidentiel', 'Residential campus')],
      faibles: [T('Coût total très élevé', 'Very high total cost'), T('Admission extrêmement sélective', 'Extremely selective admission')],
      filieres: [F('Master in Management (Grande École)', 2, 'Conseil, finance, direction', 'Consulting, finance, leadership', 'Bac+3, GMAT/GRE ou concours', 'Bachelor + GMAT/GRE or exam', 'Anglais / Français'), F('MSc International Finance', 1, 'Banque d\'investissement, marchés', 'Investment banking, markets', 'Bac+4', 'Bachelor + 1 year', 'Anglais'), F('MBA', 1, 'Direction, changement de carrière', 'Leadership, career change', 'Expérience professionnelle', 'Work experience', 'Anglais')],
      etu: { assos: T('Plus d\'une centaine d\'associations.', 'Over a hundred associations.'), logement: T('Résidences sur le campus.', 'On-campus residences.'), resto: T('Restauration sur le campus.', 'On-campus dining.'), transport: T('Navettes vers les gares RER.', 'Shuttles to RER stations.'), sport: T('Installations sportives complètes.', 'Full sports facilities.') }
    },
    {
      id: 'uclouvain', nom: 'UCLouvain', ville: 'Louvain-la-Neuve', pays: 'BE', flag: '🇧🇪', type: 'public', fondee: 1425,
      site: 'https://uclouvain.be', domaines: ['sciences', 'sante', 'ingenierie', 'business', 'droit', 'education'], langues: ['fr', 'en'], duree: [3, 7],
      frais_local: 950, frais_etranger: 4800, inscription: 0, logement: [450, 650], vie: [350, 500], adm: 'be',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T('Une des principales universités francophones d\'Europe.', "One of Europe's leading French-speaking universities."),
      desc: T("Grande université francophone de Belgique, dans une ville piétonne entièrement pensée pour les étudiants. Les frais hors UE sont d'environ 4 800 $, avec des tarifs réduits pour les ressortissants de certains pays en développement. Très bon rapport qualité-prix en Europe.", "Belgium's major French-speaking university in a pedestrian town built for students. Non-EU fees are about $4,800, with reduced rates for nationals of certain developing countries. Excellent value for money in Europe."),
      forts: [T('Excellent rapport qualité-prix', 'Excellent value for money'), T('Ville étudiante unique', 'Unique student town'), T('Tarifs réduits pour certains pays', 'Reduced fees for some countries')],
      faibles: [T('Équivalence de diplôme obligatoire, démarche longue', 'Mandatory diploma equivalence, a long process'), T('Examens d\'entrée pour médecine et ingénieur', 'Entrance exams for medicine and engineering')],
      filieres: [F('Bachelier Sciences économiques et de gestion', 3, 'Gestion, finance, économie', 'Management, finance, economics', 'Diplôme secondaire + équivalence', 'Secondary diploma + equivalence', 'Français'), F('Bachelier Ingénieur civil', 3, 'Ingénieur (master ensuite)', "Engineer (master's next)", 'Examen d\'admission', 'Admission exam', 'Français'), F('Bachelier Médecine', 3, 'Médecin (après master)', "Doctor (after master's)", 'Examen d\'entrée', 'Entrance exam', 'Français'), F('Master Data Science', 2, 'Data scientist, recherche', 'Data scientist, research', 'Bachelier', "Bachelor's", 'Anglais')],
      etu: { assos: T('Kots-à-projet : logements communautaires autour d\'un projet associatif.', 'Kots-à-projet: shared housing built around a community project.'), logement: T('Kots universitaires et privés.', 'University and private student rooms (kots).'), resto: T('Restaurants universitaires.', 'University restaurants.'), transport: T('Gare sur place, Bruxelles à 40 min.', 'Train station on site, Brussels in 40 min.'), sport: T('Grand complexe sportif.', 'Large sports complex.') }
    },
    {
      id: 'tum', nom: 'Technische Universität München (TUM)', ville: 'Munich', pays: 'DE', flag: '🇩🇪', type: 'public', fondee: 1868,
      site: 'https://www.tum.de', domaines: ['ingenierie', 'tech', 'sciences', 'sante', 'business'], langues: ['de', 'en'], duree: [3, 5],
      frais_local: 350, frais_etranger: 5500, inscription: 0, logement: [700, 1100], vie: [450, 600], adm: 'de',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T("Meilleure université technique d'Allemagne, top 30 mondial (QS).", "Germany's best technical university, top 30 worldwide (QS)."),
      desc: T("Université technique d'excellence. Depuis 2024, les étudiants hors UE paient des frais de scolarité (environ 4 300 à 6 500 $ par an selon le programme) ; les Européens ne paient qu'une contribution semestrielle. Munich est l'une des villes les plus chères d'Allemagne.", 'Top technical university. Since 2024, non-EU students pay tuition (about $4,300 to $6,500 a year depending on the programme); Europeans only pay a semester contribution. Munich is one of the most expensive cities in Germany.'),
      forts: [T('Niveau mondial en ingénierie et informatique', 'World-class engineering and computer science'), T('Liens forts avec l\'industrie (BMW, Siemens…)', 'Strong industry links (BMW, Siemens…)'), T('Nombreux masters en anglais', "Many master's in English")],
      faibles: [T('Frais pour les non-Européens depuis 2024', 'Fees for non-EU students since 2024'), T('Logement rare et cher à Munich', 'Scarce, expensive housing in Munich'), T('Licences surtout en allemand', "Bachelor's mostly in German")],
      filieres: [F('BSc Informatik', 3, 'Développement, IA, systèmes', 'Software, AI, systems', 'Abitur ou équivalent, allemand C1', 'Abitur or equivalent, German C1', 'Allemand'), F('BSc Management & Technology', 3, 'Gestion technique, industrie', 'Tech management, industry', 'Équivalent Abitur', 'Abitur equivalent', 'Anglais / Allemand'), F('MSc Mechanical Engineering', 2, 'Ingénieur automobile, aéronautique', 'Automotive, aerospace engineer', 'Bachelor', "Bachelor's", 'Anglais / Allemand'), F('MSc Data Engineering & Analytics', 2, 'Data engineer', 'Data engineer', 'Bachelor', "Bachelor's", 'Anglais')],
      etu: { assos: T('Associations et équipes techniques (course solaire, robotique…).', 'Associations and technical teams (solar car, robotics…).'), logement: T("Résidences du Studierendenwerk très demandées.", 'Studierendenwerk residences in high demand.'), resto: T('Mensas à prix étudiant.', 'Student-priced Mensa canteens.'), transport: T('Semesterticket et réseau MVV.', 'Semester ticket and MVV network.'), sport: T('Centre sportif universitaire (ZHS).', 'University sports centre (ZHS).') }
    },
    {
      id: 'rwth', nom: 'RWTH Aachen University', ville: 'Aix-la-Chapelle', pays: 'DE', flag: '🇩🇪', type: 'public', fondee: 1870,
      site: 'https://www.rwth-aachen.de', domaines: ['ingenierie', 'tech', 'sciences'], langues: ['de', 'en'], duree: [3, 5],
      frais_local: 700, frais_etranger: 700, inscription: 0, logement: [400, 600], vie: [350, 500], adm: 'de',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T("Parmi les meilleures universités techniques d'Allemagne.", "Among Germany's best technical universities."),
      desc: T("Très grande université technique, sans frais de scolarité : seule une contribution semestrielle (environ 700 $ par an, avec titre de transport) est demandée, y compris aux étrangers. Exigeante, avec un fort taux d'échec en première année. La plupart des licences sont en allemand.", 'Very large technical university with no tuition: only a semester contribution (about $700 a year, including a transport pass) is charged, including to international students. Demanding, with a high first-year failure rate. Most bachelor\'s are in German.'),
      forts: [T('Pas de frais de scolarité', 'No tuition fees'), T('Réputation mondiale en ingénierie', 'Worldwide reputation in engineering'), T('Coût de la vie raisonnable', 'Reasonable cost of living')],
      faibles: [T('Allemand indispensable en licence', 'German essential for bachelor\'s'), T('Taux d\'échec élevé les premières années', 'High failure rate in early years'), T('Compte bloqué d\'environ 12 000 $ exigé pour le visa', 'Blocked account of about $12,000 required for the visa')],
      filieres: [F('BSc Maschinenbau', 3, 'Ingénieur mécanique', 'Mechanical engineer', 'Équivalent Abitur, allemand C1', 'Abitur equivalent, German C1', 'Allemand'), F('BSc Informatik', 3, 'Développement, systèmes', 'Software, systems', 'Équivalent Abitur, allemand C1', 'Abitur equivalent, German C1', 'Allemand'), F('MSc Electrical Power Engineering', 2, 'Énergie, réseaux', 'Energy, grids', 'Bachelor', "Bachelor's", 'Anglais')],
      etu: { assos: T('Nombreuses associations et équipes techniques.', 'Many associations and technical teams.'), logement: T('Résidences étudiantes et colocations (WG).', 'Student residences and flatshares (WG).'), resto: T('Mensas.', 'Mensa canteens.'), transport: T('Ticket semestriel inclus (Deutschlandticket étudiant).', 'Semester ticket included (student Deutschlandticket).'), sport: T('Sport universitaire très varié.', 'Wide range of university sport.') }
    },
    {
      id: 'unige', nom: 'Université de Genève', ville: 'Genève', pays: 'CH', flag: '🇨🇭', type: 'public', fondee: 1559,
      site: 'https://www.unige.ch', domaines: ['droit', 'sciences', 'sante', 'business', 'education'], langues: ['fr', 'en'], duree: [3, 6],
      frais_local: 1150, frais_etranger: 1150, inscription: 75, logement: [900, 1500], vie: [700, 1000], adm: 'ch',
      campus: 2, intl: 3, alternance: false, mode: 'campus',
      classement: T('Université reconnue mondialement, au cœur de la Genève internationale.', 'Globally recognised university in the heart of international Geneva.'),
      desc: T("Frais de scolarité bas (environ 1 150 $ par an) même pour les étrangers, et proximité unique avec l'ONU et les organisations internationales. Mais Genève est l'une des villes les plus chères au monde : le budget de vie est le vrai défi.", 'Low tuition (about $1,150 a year) even for international students, and unique proximity to the UN and international organisations. But Geneva is one of the most expensive cities in the world: living costs are the real challenge.'),
      forts: [T('Frais de scolarité bas', 'Low tuition'), T('Écosystème des organisations internationales', 'International organisations ecosystem'), T('Excellent niveau en droit, relations internationales, sciences', 'Excellent law, international relations and sciences')],
      faibles: [T('Coût de la vie parmi les plus élevés au monde', 'One of the highest costs of living in the world'), T('Logement très difficile à trouver', 'Housing very hard to find'), T('Travail limité pour les étudiants hors UE', 'Limited work rights for non-EU students')],
      filieres: [F('Bachelor Relations internationales', 3, 'Diplomatie, ONG, organisations internationales', 'Diplomacy, NGOs, international organisations', 'Diplôme équivalent maturité', 'Maturité-equivalent diploma', 'Français / Anglais'), F('Bachelor Droit', 3, 'Juriste, avocat', 'Legal officer, lawyer', 'Équivalent maturité', 'Maturité equivalent', 'Français'), F('Bachelor Médecine', 3, 'Médecin (après master)', "Doctor (after master's)", 'Examen d\'aptitude', 'Aptitude test', 'Français')],
      etu: { assos: T('Associations étudiantes nombreuses.', 'Many student associations.'), logement: T('Bureau du logement universitaire, places très limitées.', 'University housing office, very limited places.'), resto: T('Cafétérias universitaires.', 'University cafeterias.'), transport: T('Réseau TPG, abonnement jeune.', 'TPG network, youth pass.'), sport: T('Sports universitaires, lac et montagne.', 'University sports, lake and mountains.') }
    },
    {
      id: 'udem', nom: 'Université de Montréal', ville: 'Montréal', pays: 'CA', flag: '🇨🇦', type: 'public', fondee: 1878,
      site: 'https://www.umontreal.ca', domaines: ['sante', 'sciences', 'droit', 'education', 'art', 'tech'], langues: ['fr'], annee_langue: ['fr'], duree: [3, 7],
      frais_local: 3000, frais_etranger: 22000, inscription: 0, logement: [600, 1000], vie: [400, 600], adm: 'ca-qc',
      campus: 3, intl: 3, alternance: true, mode: 'campus',
      classement: T('Plus grande université francophone d\'Amérique, top 200 mondial (QS).', 'Largest French-speaking university in the Americas, top 200 worldwide (QS).'),
      desc: T("Grande université de recherche francophone, avec HEC Montréal et Polytechnique Montréal affiliées. Les frais internationaux sont élevés (environ 22 000 $), mais des exemptions existent pour certains pays et les Français/Belges francophones paient beaucoup moins. Permis de travail après les études intéressant pour immigrer.", 'Large French-speaking research university with affiliated HEC Montréal and Polytechnique Montréal. International fees are high (about $22,000), but exemptions exist for some countries and French/Belgian students pay much less. Post-graduation work permit is attractive for immigration.'),
      forts: [T('Études en français en Amérique du Nord', 'Study in French in North America'), T('Voie vers le permis de travail post-diplôme', 'Path to the post-graduation work permit'), T('Stages coopératifs dans certains programmes', 'Co-op internships in some programmes')],
      faibles: [T('Frais internationaux élevés sans exemption', 'High international fees without an exemption'), T('Hivers rigoureux', 'Harsh winters'), T('Démarches CAQ + permis longues', 'Long CAQ + permit procedures')],
      filieres: [F('Baccalauréat en informatique', 3, 'Développeur, IA (Mila)', 'Developer, AI (Mila)', 'DEC ou équivalent', 'DEC or equivalent', 'Français'), F('Doctorat en médecine', 5, 'Médecin', 'Doctor', 'Très sélectif', 'Very selective', 'Français'), F('Baccalauréat en droit', 3, 'Avocat, notaire (Barreau du Québec)', 'Lawyer, notary (Quebec Bar)', 'DEC ou équivalent', 'DEC or equivalent', 'Français'), F('Baccalauréat en sciences infirmières', 3, 'Infirmier·ère', 'Nurse', 'DEC sciences', 'Science DEC', 'Français')],
      etu: { assos: T('Associations étudiantes par programme.', 'Student associations by programme.'), logement: T('Résidences sur le campus (places limitées).', 'On-campus residences (limited).'), resto: T('Cafétérias sur le campus.', 'On-campus cafeterias.'), transport: T('Métro (stations Université-de-Montréal, Côte-des-Neiges), tarif réduit étudiant.', 'Metro (Université-de-Montréal, Côte-des-Neiges stations), student discount.'), sport: T('CEPSUM, grand centre sportif.', 'CEPSUM, a large sports centre.') }
    },
    {
      id: 'ulaval', nom: 'Université Laval', ville: 'Québec', pays: 'CA', flag: '🇨🇦', type: 'public', fondee: 1663,
      site: 'https://www.ulaval.ca', domaines: ['sante', 'sciences', 'agri', 'business', 'droit', 'education'], langues: ['fr'], annee_langue: ['fr'], duree: [3, 6],
      frais_local: 3000, frais_etranger: 22000, inscription: 0, logement: [500, 850], vie: [400, 550], adm: 'ca-qc',
      campus: 3, intl: 2, alternance: true, mode: 'campus',
      classement: T('Plus ancienne université francophone d\'Amérique.', 'Oldest French-speaking university in the Americas.'),
      desc: T("Grand campus à Québec, ville sûre et moins chère que Montréal. Programme de bourses d'excellence et d'exemption des frais majorés pour les étudiants internationaux (jusqu'à environ 25 000 $). Bonne option francophone si tu vises une bourse.", 'Large campus in Quebec City, a safe city cheaper than Montreal. Excellence and fee-exemption scholarships for international students (up to about $25,000). A good French-speaking option if you are aiming for a scholarship.'),
      forts: [T('Bourses d\'exemption pour étudiants internationaux', 'Fee-exemption scholarships for international students'), T('Ville sûre, coût de la vie modéré', 'Safe city, moderate cost of living'), T('Campus relié par tunnels l\'hiver', 'Campus connected by tunnels in winter')],
      faibles: [T('Frais élevés sans bourse', 'High fees without a scholarship'), T('Marché du travail plus petit qu\'à Montréal', 'Smaller job market than Montreal')],
      filieres: [F('Baccalauréat en administration des affaires', 3, 'Gestion, finance, marketing', 'Management, finance, marketing', 'DEC ou équivalent', 'DEC or equivalent', 'Français'), F('Baccalauréat en agronomie', 4, 'Agronome', 'Agronomist', 'DEC sciences', 'Science DEC', 'Français'), F('Baccalauréat en génie logiciel', 4, 'Ingénieur logiciel', 'Software engineer', 'DEC sciences', 'Science DEC', 'Français')],
      etu: { assos: T('Associations et clubs nombreux.', 'Many associations and clubs.'), logement: T('Résidences sur le campus.', 'On-campus residences.'), resto: T('Cafétérias sur le campus.', 'On-campus cafeterias.'), transport: T('Laissez-passer universitaire pour le réseau RTC.', 'University pass for the RTC network.'), sport: T('PEPS, grand complexe sportif.', 'PEPS, a large sports complex.') }
    },
    {
      id: 'utoronto', nom: 'University of Toronto', ville: 'Toronto', pays: 'CA', flag: '🇨🇦', type: 'public', fondee: 1827,
      site: 'https://www.utoronto.ca', domaines: ['sciences', 'tech', 'ingenierie', 'business', 'sante', 'droit', 'art'], langues: ['en'], duree: [4, 6],
      frais_local: 5000, frais_etranger: 45000, inscription: 0, logement: [900, 1500], vie: [450, 650], adm: 'ca-on',
      campus: 3, intl: 3, alternance: true, mode: 'campus',
      classement: T('Meilleure université du Canada, top 30 mondial (QS).', "Canada's top university, top 30 worldwide (QS)."),
      desc: T("Université de recherche de rang mondial. Les frais internationaux sont parmi les plus élevés du Canada, mais la bourse Lester B. Pearson couvre entièrement scolarité, livres et logement pendant 4 ans pour une poignée d'élèves exceptionnels.", 'World-class research university. International fees are among the highest in Canada, but the Lester B. Pearson scholarship fully covers tuition, books and housing for 4 years for a handful of exceptional students.'),
      forts: [T('Reconnaissance mondiale', 'Worldwide recognition'), T('Bourse Lester B. Pearson (complète)', 'Lester B. Pearson scholarship (full)'), T('Toronto, grand marché du travail', 'Toronto, a big job market')],
      faibles: [T('Frais internationaux très élevés', 'Very high international fees'), T('Logement cher à Toronto', 'Expensive housing in Toronto'), T('Grandes classes en première année', 'Large first-year classes')],
      filieres: [F('BSc Computer Science', 4, 'Développement, IA, recherche', 'Software, AI, research', 'Excellent dossier, maths avancées', 'Excellent record, advanced maths', 'Anglais'), F('BASc Engineering', 4, 'Ingénieur', 'Engineer', 'Maths, physique, chimie', 'Maths, physics, chemistry', 'Anglais'), F('BCom Rotman Commerce', 4, 'Finance, conseil', 'Finance, consulting', 'Maths avancées', 'Advanced maths', 'Anglais'), F('BA Life Sciences', 4, 'Recherche, voie vers la médecine', 'Research, pre-med pathway', 'Biologie, chimie', 'Biology, chemistry', 'Anglais')],
      etu: { assos: T('Plus de 1 000 clubs étudiants.', 'Over 1,000 student clubs.'), logement: T('Résidence garantie en 1ère année sous conditions.', 'First-year residence guarantee under conditions.'), resto: T('Restauration dans les collèges.', 'Dining in the colleges.'), transport: T('Métro TTC, campus au centre-ville.', 'TTC subway, downtown campus.'), sport: T('Grand complexe sportif (Goldring, Hart House).', 'Large sports facilities (Goldring, Hart House).') }
    },
    {
      id: 'mit', nom: 'Massachusetts Institute of Technology (MIT)', ville: 'Cambridge (Boston)', pays: 'US', flag: '🇺🇸', type: 'private', fondee: 1861,
      site: 'https://www.mit.edu', domaines: ['ingenierie', 'tech', 'sciences', 'business'], langues: ['en'], duree: [4, 6],
      frais_local: 62000, frais_etranger: 62000, inscription: 0, logement: [1000, 1500], vie: [600, 800], adm: 'us',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T('N°1 mondial au classement QS.', 'No. 1 worldwide in the QS ranking.'),
      desc: T("Référence mondiale en sciences et ingénierie. Le prix affiché est très élevé, mais l'admission est « need-blind » pour tous, y compris les étudiants internationaux, et l'aide financière couvre l'intégralité du besoin démontré. Un dossier exceptionnel est indispensable : le taux d'admission est d'environ 4 %.", 'Global reference in science and engineering. The sticker price is very high, but admission is need-blind for everyone, including international students, and financial aid covers 100% of demonstrated need. You need an exceptional application: the admission rate is around 4%.'),
      forts: [T('N°1 mondial', 'No. 1 worldwide'), T('Aide financière couvrant 100 % du besoin', 'Financial aid covering 100% of need'), T('Recherche et innovation sans équivalent', 'Unmatched research and innovation')],
      faibles: [T('Taux d\'admission d\'environ 4 %', 'Admission rate of about 4%'), T('Rythme de travail très intense', 'Very intense workload')],
      filieres: [F('SB Computer Science and Engineering (6-3)', 4, 'Ingénierie logicielle, IA, recherche', 'Software engineering, AI, research', 'Excellent dossier + SAT/ACT', 'Excellent record + SAT/ACT', 'Anglais'), F('SB Mechanical Engineering', 4, 'Robotique, énergie, conception', 'Robotics, energy, design', 'Excellent dossier', 'Excellent record', 'Anglais'), F('SB Physics', 4, 'Recherche, ingénierie, finance', 'Research, engineering, finance', 'Excellent dossier', 'Excellent record', 'Anglais')],
      etu: { assos: T('Plus de 500 associations, hackathons, culture maker.', 'Over 500 groups, hackathons, maker culture.'), logement: T('Logement garanti en licence.', 'Guaranteed undergraduate housing.'), resto: T('Restaurants universitaires et plans repas.', 'Dining halls and meal plans.'), transport: T('Métro de Boston (MBTA).', 'Boston subway (MBTA).'), sport: T('33 sports universitaires.', '33 varsity sports.') }
    },
    {
      id: 'utokyo', nom: 'Université de Tokyo', ville: 'Tokyo', pays: 'JP', flag: '🇯🇵', type: 'public', fondee: 1877,
      site: 'https://www.u-tokyo.ac.jp', domaines: ['sciences', 'ingenierie', 'tech', 'sante', 'droit'], langues: ['en'], duree: [4, 6],
      frais_local: 3600, frais_etranger: 3600, inscription: 1900, logement: [400, 800], vie: [400, 600], adm: 'asia',
      campus: 2, intl: 3, alternance: false, mode: 'campus',
      classement: T("Première université du Japon, top 40 mondial (QS).", "Japan's top university, top 40 worldwide (QS)."),
      desc: T("Université la plus prestigieuse du Japon. Les frais publics japonais sont modérés (environ 3 600 $ par an), et la bourse du gouvernement japonais (MEXT) peut tout couvrir. Les programmes en anglais (PEAK, masters) sont limités : une grande partie de l'enseignement reste en japonais.", "Japan's most prestigious university. Japanese public fees are moderate (about $3,600 a year) and the Japanese government (MEXT) scholarship can cover everything. English-taught programmes (PEAK, master's) are limited: much teaching remains in Japanese."),
      forts: [T('Frais modérés pour un top mondial', 'Moderate fees for a world-top school'), T('Bourse MEXT complète', 'Full MEXT scholarship'), T('Recherche de pointe', 'Cutting-edge research')],
      faibles: [T('Peu de licences en anglais', "Few English-taught bachelor's"), T('Barrière de la langue au quotidien', 'Everyday language barrier')],
      filieres: [F('PEAK — Environmental Sciences', 4, 'Environnement, recherche', 'Environment, research', 'Excellent dossier, anglais', 'Excellent record, English', 'Anglais'), F('PEAK — Japan in East Asia', 4, 'Relations internationales, affaires', 'International relations, business', 'Excellent dossier', 'Excellent record', 'Anglais'), F('Master Engineering (programmes anglais)', 2, 'Ingénieur, recherche', 'Engineer, research', 'Bachelor', "Bachelor's", 'Anglais')],
      etu: { assos: T('Clubs « circles » nombreux.', 'Many "circle" clubs.'), logement: T('Résidences internationales (places limitées).', 'International residences (limited).'), resto: T('Cafétérias universitaires bon marché.', 'Cheap university cafeterias.'), transport: T('Métro de Tokyo, très efficace.', 'Tokyo metro, very efficient.'), sport: null }
    },
    {
      id: 'kaist', nom: 'KAIST', ville: 'Daejeon', pays: 'KR', flag: '🇰🇷', type: 'public', fondee: 1971,
      site: 'https://www.kaist.ac.kr', domaines: ['ingenierie', 'tech', 'sciences', 'business'], langues: ['en'], duree: [4, 6],
      frais_local: 6000, frais_etranger: 6000, inscription: 0, logement: [150, 300], vie: [300, 450], adm: 'asia',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T('Parmi les meilleures universités scientifiques d\'Asie.', "Among Asia's top science universities."),
      desc: T("Institut scientifique et technologique de premier plan en Corée du Sud, avec un enseignement largement en anglais. Les étudiants internationaux admis reçoivent très souvent une bourse couvrant la scolarité, voire une allocation. Ambiance très studieuse, campus résidentiel.", "South Korea's leading science and technology institute with much of the teaching in English. Admitted international students very often receive a tuition scholarship, sometimes a stipend. Very studious atmosphere on a residential campus."),
      forts: [T('Bourses fréquentes pour les internationaux', 'Frequent scholarships for international students'), T('Cours largement en anglais', 'Courses largely in English'), T('Dortoirs bon marché', 'Cheap dorms')],
      faibles: [T('Pression académique forte', 'High academic pressure'), T('Daejeon moins animée que Séoul', 'Daejeon is quieter than Seoul')],
      filieres: [F('BS Computer Science', 4, 'Développement, IA', 'Software, AI', 'Excellent dossier maths/sciences', 'Excellent maths/science record', 'Anglais'), F('BS Electrical Engineering', 4, 'Semi-conducteurs, électronique', 'Semiconductors, electronics', 'Excellent dossier', 'Excellent record', 'Anglais'), F('BS Business & Technology Management', 4, 'Gestion de l\'innovation', 'Innovation management', 'Excellent dossier', 'Excellent record', 'Anglais')],
      etu: { assos: T('Clubs nombreux, communauté internationale.', 'Many clubs, international community.'), logement: T('Dortoirs sur le campus.', 'On-campus dorms.'), resto: T('Cafétérias à petits prix.', 'Low-cost cafeterias.'), transport: T('KTX vers Séoul en 1 h.', 'KTX to Seoul in 1 hour.'), sport: null }
    },
    {
      id: 'tsinghua', nom: 'Université Tsinghua', ville: 'Pékin', pays: 'CN', flag: '🇨🇳', type: 'public', fondee: 1911,
      site: 'https://www.tsinghua.edu.cn', domaines: ['ingenierie', 'tech', 'sciences', 'business'], langues: ['en'], duree: [4, 6],
      frais_local: 1000, frais_etranger: 4500, inscription: 0, logement: [300, 700], vie: [300, 450], adm: 'asia',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T('Top 20 mondial (QS), référence en ingénierie.', 'Top 20 worldwide (QS), a reference in engineering.'),
      desc: T("Université d'élite en ingénierie et sciences. Les frais internationaux restent modérés, et les bourses du gouvernement chinois (CSC) couvrent souvent tout. Les licences sont majoritairement en chinois : prévoir une année de langue, ou viser un master en anglais.", "Elite engineering and science university. International fees are moderate and Chinese government (CSC) scholarships often cover everything. Bachelor's are mostly taught in Chinese: plan for a language year or aim for an English-taught master's."),
      forts: [T('Excellence en ingénierie', 'Engineering excellence'), T('Bourses CSC complètes', 'Full CSC scholarships'), T('Frais modérés', 'Moderate fees')],
      faibles: [T('Chinois souvent nécessaire en licence', "Chinese often required for bachelor's"), T('Accès restreint à certains services en ligne', 'Restricted access to some online services')],
      filieres: [F('Master Global Business Journalism', 2, 'Journalisme économique', 'Business journalism', 'Bachelor', "Bachelor's", 'Anglais'), F('Master Civil Engineering (anglais)', 2, 'Ingénierie civile', 'Civil engineering', 'Bachelor', "Bachelor's", 'Anglais'), F('Licence Ingénierie (chinois)', 4, 'Ingénieur', 'Engineer', 'HSK + examen', 'HSK + exam', 'Chinois')],
      etu: { assos: T('Associations nombreuses.', 'Many associations.'), logement: T('Résidences pour étudiants internationaux.', 'Residences for international students.'), resto: T('Cantines nombreuses et bon marché.', 'Many cheap canteens.'), transport: T('Métro de Pékin.', 'Beijing subway.'), sport: null }
    },
    {
      id: 'nus', nom: 'National University of Singapore (NUS)', ville: 'Singapour', pays: 'SG', flag: '🇸🇬', type: 'public', fondee: 1905,
      site: 'https://www.nus.edu.sg', domaines: ['tech', 'business', 'ingenierie', 'sciences', 'sante', 'droit'], langues: ['en'], duree: [4, 5],
      frais_local: 6500, frais_etranger: 28000, inscription: 0, logement: [500, 1100], vie: [450, 650], adm: 'asia',
      campus: 3, intl: 3, alternance: false, mode: 'campus',
      classement: T("N°1 en Asie et top 10 mondial (QS).", 'No. 1 in Asia and top 10 worldwide (QS).'),
      desc: T("Meilleure université d'Asie, entièrement en anglais. Avec la « Tuition Grant » du gouvernement, les frais internationaux baissent fortement, mais en échange tu t'engages à travailler 3 ans à Singapour après le diplôme. Coût de la vie élevé.", "Asia's top university, fully taught in English. With the government Tuition Grant, international fees drop sharply, but in return you commit to working in Singapore for 3 years after graduating. High cost of living."),
      forts: [T('Top 10 mondial, tout en anglais', 'Top 10 worldwide, fully in English'), T('Hub économique asiatique', 'Asian economic hub'), T('Grande sécurité', 'Very safe')],
      faibles: [T('Tuition Grant = engagement de 3 ans à Singapour', 'Tuition Grant = 3-year work bond in Singapore'), T('Admission très sélective', 'Very selective admission'), T('Vie chère', 'Expensive living')],
      filieres: [F('BComp Computer Science', 4, 'Développement, IA', 'Software, AI', 'Excellent dossier maths', 'Excellent maths record', 'Anglais'), F('BBA Business Administration', 4, 'Finance, conseil', 'Finance, consulting', 'Excellent dossier', 'Excellent record', 'Anglais'), F('BEng Engineering', 4, 'Ingénieur', 'Engineer', 'Maths et physique', 'Maths and physics', 'Anglais')],
      etu: { assos: T('Résidences avec vie communautaire forte.', 'Residential colleges with a strong community.'), logement: T('Halls et résidences sur le campus.', 'Halls and residential colleges on campus.'), resto: T('Food courts sur le campus.', 'On-campus food courts.'), transport: T('Navettes internes, MRT.', 'Internal shuttles, MRT.'), sport: T('Installations sportives complètes.', 'Full sports facilities.') }
    },
    {
      id: 'khalifa', nom: 'Khalifa University', ville: 'Abu Dhabi', pays: 'AE', flag: '🇦🇪', type: 'public', fondee: 2007,
      site: 'https://www.ku.ac.ae', domaines: ['ingenierie', 'sciences', 'tech', 'sante'], langues: ['en'], duree: [2, 5],
      frais_local: 0, frais_etranger: 0, inscription: 0, logement: [0, 600], vie: [400, 600], adm: 'asia',
      campus: 2, intl: 2, alternance: false, mode: 'campus',
      classement: T('Une des meilleures universités des Émirats arabes unis.', 'One of the top universities in the UAE.'),
      desc: T("Université de recherche en sciences et ingénierie. Pour les masters et doctorats, des bourses complètes (frais, et souvent logement et allocation) sont proposées aux étudiants internationaux admis. Les places en licence pour les étrangers sont plus limitées.", "Research university in science and engineering. For master's and PhDs, full scholarships (tuition, often housing and a stipend) are offered to admitted international students. Bachelor places for international students are more limited."),
      forts: [T('Bourses complètes en master/doctorat', "Full master's/PhD scholarships"), T('Laboratoires modernes', 'Modern labs'), T('Environnement très international', 'Very international environment')],
      faibles: [T('Surtout adaptée aux masters et doctorats', "Mainly suited to master's and PhDs"), T('Climat très chaud', 'Very hot climate')],
      filieres: [F('MSc Engineering', 2, 'Ingénieur, recherche', 'Engineer, research', 'Bachelor + anglais', "Bachelor's + English", 'Anglais'), F('MSc Computer Science', 2, 'IA, data, cybersécurité', 'AI, data, cybersecurity', 'Bachelor', "Bachelor's", 'Anglais'), F('PhD Engineering', 4, 'Recherche', 'Research', 'Master', "Master's", 'Anglais')],
      etu: { assos: null, logement: T('Logement sur le campus pour les boursiers.', 'On-campus housing for scholarship holders.'), resto: null, transport: null, sport: null }
    },
    {
      id: 'uopeople', nom: 'University of the People', ville: 'En ligne', pays: 'US', flag: '🌍', type: 'online', fondee: 2009,
      site: 'https://www.uopeople.edu', domaines: ['business', 'tech', 'sante', 'education'], langues: ['en'], duree: [2, 4],
      frais_local: 1400, frais_etranger: 1400, inscription: 60, logement: [0, 0], vie: [0, 0], adm: 'online',
      campus: 1, intl: 2, alternance: false, mode: 'online',
      classement: T('Université en ligne accréditée aux États-Unis (DEAC, WSCUC).', 'US-accredited online university (DEAC, WSCUC).'),
      desc: T("Université américaine 100 % en ligne et sans frais de scolarité : tu paies seulement des frais d'évaluation par cours (environ 1 200 à 1 600 $ par an selon le rythme). Idéale si tu dois travailler en parallèle ou si tu ne peux pas partir. Il faut beaucoup d'autonomie, et la reconnaissance du diplôme varie selon les employeurs et les pays.", 'Fully online US university with no tuition: you only pay assessment fees per course (about $1,200 to $1,600 a year depending on your pace). Ideal if you need to work alongside or cannot move abroad. It takes a lot of self-discipline, and recognition varies by employer and country.'),
      forts: [T('Très faible coût, bourses possibles', 'Very low cost, scholarships available'), T('Compatible avec un emploi', 'Compatible with a job'), T('Accessible depuis n\'importe quel pays', 'Accessible from any country')],
      faibles: [T('Pas de vie de campus', 'No campus life'), T('Reconnaissance inégale selon les pays', 'Uneven recognition across countries'), T('Demande une forte autodiscipline', 'Requires strong self-discipline')],
      filieres: [F('Associate Business Administration', 2, 'Assistant de gestion, entrepreneuriat', 'Business assistant, entrepreneurship', 'Diplôme secondaire + anglais', 'Secondary diploma + English', 'Anglais'), F('Bachelor Computer Science', 4, 'Développeur, support IT', 'Developer, IT support', 'Diplôme secondaire + anglais', 'Secondary diploma + English', 'Anglais'), F('Bachelor Health Science', 4, 'Santé publique, administration', 'Public health, administration', 'Diplôme secondaire + anglais', 'Secondary diploma + English', 'Anglais')],
      etu: { assos: T('Communauté en ligne mondiale.', 'Global online community.'), logement: T('Tu étudies depuis chez toi.', 'You study from home.'), resto: T('Sans objet (formation en ligne).', 'Not applicable (online).'), transport: T('Sans objet (formation en ligne).', 'Not applicable (online).'), sport: null }
    },
    {
      id: 'uvs', nom: 'Université Numérique Cheikh Hamidou Kane (ex-UVS)', ville: 'En ligne (Sénégal)', pays: 'SN', flag: '🇸🇳', type: 'online', fondee: 2013,
      site: 'https://www.unchk.sn', domaines: ['tech', 'business', 'education', 'comm', 'sciences'], langues: ['fr'], duree: [3, 5],
      frais_local: 60, frais_etranger: 300, inscription: 0, logement: [0, 0], vie: [0, 0], adm: 'online',
      campus: 1, intl: 1, alternance: false, mode: 'hybrid',
      classement: T('Université publique numérique du Sénégal, diplômes d\'État.', "Senegal's public digital university, state degrees."),
      desc: T("Université publique sénégalaise qui enseigne à distance, avec des Espaces Numériques Ouverts (ENO) dans les régions pour se connecter et travailler. Très bon marché pour les bacheliers sénégalais. Il faut une bonne connexion et beaucoup d'autonomie.", 'Senegalese public university teaching remotely, with Open Digital Spaces (ENO) in the regions to connect and work. Very affordable for Senegalese students. You need a good connection and lots of independence.'),
      forts: [T('Coût très faible', 'Very low cost'), T('Étudier sans quitter sa région', 'Study without leaving your region'), T('Diplômes d\'État', 'State degrees')],
      faibles: [T('Connexion internet indispensable', 'Internet connection essential'), T('Peu d\'interactions en présentiel', 'Little face-to-face interaction')],
      filieres: [F('Licence Informatique / Développement', 3, 'Développeur web et mobile', 'Web and mobile developer', 'Bac', 'Diploma', 'Français'), F('Licence Sciences économiques et de gestion', 3, 'Gestion, administration', 'Management, administration', 'Bac', 'Diploma', 'Français'), F('Licence Communication digitale', 3, 'Community manager, médias', 'Community manager, media', 'Bac', 'Diploma', 'Français')],
      etu: { assos: null, logement: T('Tu étudies depuis chez toi ou dans un ENO.', 'You study from home or at an ENO.'), resto: T('Sans objet.', 'Not applicable.'), transport: T('ENO dans plusieurs régions du Sénégal.', 'ENOs in several regions of Senegal.'), sport: null }
    },
    {
      id: 'openclassrooms', nom: 'OpenClassrooms', ville: 'En ligne', pays: 'FR', flag: '🌍', type: 'online', fondee: 2013,
      site: 'https://openclassrooms.com', domaines: ['tech', 'business', 'comm', 'education'], langues: ['fr', 'en'], duree: [1, 2],
      frais_local: 3600, frais_etranger: 3600, inscription: 0, logement: [0, 0], vie: [0, 0], adm: 'online',
      campus: 1, intl: 2, alternance: true, mode: 'online',
      classement: T('Diplômes inscrits au RNCP (reconnus par l\'État français).', 'Degrees registered with RNCP (recognised by the French state).'),
      desc: T("École en ligne de formations professionnalisantes courtes (développement web, data, gestion de projet…) avec mentor individuel. En alternance, la formation peut être prise en charge par l'entreprise (en France). Sinon, compter environ 300 $ par mois.", 'Online school offering short professional programmes (web development, data, project management…) with an individual mentor. In a work-study contract the programme can be paid by the employer (in France). Otherwise, count on about $300 a month.'),
      forts: [T('Formations courtes, orientées emploi', 'Short, job-focused programmes'), T('Mentor individuel', 'Individual mentor'), T('Alternance possible', 'Work-study possible')],
      faibles: [T('Pas de vie de campus', 'No campus life'), T('Coût non négligeable sans alternance', 'Significant cost without work-study')],
      filieres: [F('Développeur Web', 1, 'Développeur front-end / back-end', 'Front-end / back-end developer', 'Aucun diplôme requis', 'No diploma required', 'Français'), F('Data Analyst', 1, 'Analyste de données', 'Data analyst', 'Bac conseillé', 'Diploma recommended', 'Français'), F('Chef de projet digital', 1, 'Gestion de projet web', 'Web project manager', 'Bac+2 conseillé', '2 years of higher ed recommended', 'Français')],
      etu: { assos: T('Communauté en ligne et sessions de mentorat.', 'Online community and mentoring sessions.'), logement: T('Tu étudies depuis chez toi.', 'You study from home.'), resto: T('Sans objet.', 'Not applicable.'), transport: T('Sans objet.', 'Not applicable.'), sport: null }
    }
  ];

  /* Domaines (filtre Explorer — document maître §8.2) */
  window.LERNA_DOMAINS = [
    { id: 'business', label: { fr: 'Business', en: 'Business' } },
    { id: 'sante', label: { fr: 'Santé', en: 'Health' } },
    { id: 'tech', label: { fr: 'Tech', en: 'Tech' } },
    { id: 'droit', label: { fr: 'Droit', en: 'Law' } },
    { id: 'art', label: { fr: 'Art', en: 'Art' } },
    { id: 'sciences', label: { fr: 'Sciences', en: 'Sciences' } },
    { id: 'education', label: { fr: 'Éducation', en: 'Education' } },
    { id: 'ingenierie', label: { fr: 'Ingénierie', en: 'Engineering' } },
    { id: 'comm', label: { fr: 'Communication', en: 'Communication' } },
    { id: 'agri', label: { fr: 'Agriculture', en: 'Agriculture' } }
  ];

  /* Sigle affiché dans les visuels des cartes */
  var SIGLES = { um5: 'UM5', uvs: 'UN-CHK', khalifa: 'KU', tum: 'TUM', hec: 'HEC', 'ug-legon': 'UG', utoronto: 'UofT', mit: 'MIT', sorbonne: 'SU', ubordeaux: 'UBx', sciencespo: 'SPo', udem: 'UdeM', ulaval: 'UL', unige: 'UNIGE', uclouvain: 'UCL', rwth: 'RWTH', utokyo: 'UTokyo', kaist: 'KAIST', tsinghua: 'THU', nus: 'NUS', uopeople: 'UoPeople', openclassrooms: 'OC', strathmore: 'SU', uct: 'UCT', unilag: 'UNILAG', '2ie': '2iE', um6p: 'UM6P', ufhb: 'UFHB', inphb: 'INP-HB', 'ism-dakar': 'ISM', cesag: 'CESAG', ucad: 'UCAD' };
  window.LERNA_SIGLE = function (s) {
    if (SIGLES[s.id]) return SIGLES[s.id];
    var w = s.nom.replace(/[—–(].*$/, '').split(/\s+/).filter(function (x) { return x.length > 2 && /^[A-ZÉ]/.test(x); });
    return w.slice(0, 3).map(function (x) { return x[0]; }).join('') || s.nom.slice(0, 3);
  };

  window.LERNA_SCHOOL = function (id) {
    for (var i = 0; i < window.LERNA_SCHOOLS.length; i++) if (window.LERNA_SCHOOLS[i].id === id) return window.LERNA_SCHOOLS[i];
    return null;
  };
  /* Retrouver une école de la base à partir d'un nom renvoyé par l'IA */
  window.LERNA_FIND_SCHOOL = function (name) {
    if (!name) return null;
    var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); };
    var n = norm(name);
    var best = null;
    window.LERNA_SCHOOLS.forEach(function (s) {
      var sn = norm(s.nom);
      var short = norm(s.nom.split(/[—(]/)[0]);
      if (n === sn || n.indexOf(short) !== -1 || sn.indexOf(n) !== -1) best = best || s;
      var acr = (s.nom.match(/\(([^)]+)\)/) || [])[1];
      if (acr && new RegExp('\\b' + norm(acr) + '\\b').test(n)) best = best || s;
    });
    return best;
  };
  /* Frais pertinents pour l'utilisateur (local si même pays) */
  window.LERNA_FEE_FOR = function (s, userCountry) {
    return userCountry && userCountry === s.pays ? s.frais_local : s.frais_etranger;
  };
})();
