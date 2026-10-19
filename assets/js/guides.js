/* ==========================================================================
   LERNA — Guides « Comment candidater ici » et liens officiels directs
   Un guide par système d'admission (mêmes clés que LERNA_ADMISSION : fr-public, ca-qc…).
   Chaque étape a un identifiant stable : « Mon dossier » s'en sert pour suivre l'avancement.
   Une date exacte (champ date) n'est écrite que lorsqu'elle est publiée au jour près par la source officielle ;
   sinon le mois est dans le texte, et la personne note elle-même la date de son école dans « Mon dossier ».
   Liens vérifiés le 10 octobre 2026.
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en || fr }; }
  var V = '2026-10-10';
  /* Étape : id, titre, explication, lien officiel facultatif, date officielle facultative */
  function S(id, fr, en, dfr, den, link, date) {
    var x = { id: id, title: T(fr, en), desc: T(dfr, den) };
    if (link) x.link = link;
    if (date) x.date = date;
    return x;
  }

  /* Plateformes officielles (liens vérifiés) */
  var P = {
    eef: { name: 'Études en France', url: 'https://pastel.diplomatie.gouv.fr/etudesenfrance/' },
    campusfrance: { name: 'Campus France', url: 'https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france' },
    parcoursup: { name: 'Parcoursup', url: 'https://www.parcoursup.gouv.fr/' },
    francevisas: { name: 'France-Visas', url: 'https://france-visas.gouv.fr/' },
    studyinbelgium: { name: 'Study in Belgium', url: 'https://www.studyinbelgium.be/fr' },
    uniassist: { name: 'uni-assist', url: 'https://www.uni-assist.de/en/' },
    caq: { name: 'CAQ — Québec', url: 'https://www.quebec.ca/education/etudier-quebec/demande-selection-temporaire' },
    permisCa: { name: 'Permis d’études — Canada', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes.html' },
    commonapp: { name: 'Common App', url: 'https://www.commonapp.org/' },
    studyStates: { name: 'Study in the States', url: 'https://studyinthestates.dhs.gov/' },
    campusen: { name: 'Campusen (Sénégal)', url: 'https://campusen.sn' },
    ucas: { name: 'UCAS', url: 'https://www.ucas.com/ucas/undergraduate/getting-started/when-apply' },
    ukvisa: { name: 'Student visa — GOV.UK', url: 'https://www.gov.uk/student-visa' },
    studielink: { name: 'Studielink', url: 'https://www.studielink.nl/' },
    studiekeuze: { name: 'Studiekeuze123', url: 'https://www.studiekeuze123.nl/enrolling-in-a-course-programme-in-the-netherlands' },
    universitaly: { name: 'Universitaly', url: 'https://www.universitaly.it/' }
  };
  window.LERNA_PLATFORMS = P;

  /* Pays où Campus France gère la candidature (procédure « Études en France ») — Afrique et principaux pays.
     La liste complète est sur campusfrance.org : en cas de doute, la page officielle fait foi. */
  var EEF = 'DZ BJ BF BI CM CV KM CG CD CI DJ EG GA GH GN MG ML MA MU MR NE NG CF RW SN TD TG TN ZA KE ET AR BR CL CO MX PE US CA CN IN ID JP KR LB RU SA SG TW TH TR VN IR KW JO HT'.split(' ');
  window.LERNA_EEF_COUNTRIES = EEF;

  window.LERNA_GUIDES = {
    /* France — bac français ou européen : Parcoursup (calendrier 2027 publié par Campus France) */
    parcoursup: {
      label: T('France — Parcoursup', 'France — Parcoursup'),
      who: T('Tu as (ou passes) un bac français, y compris dans un lycée français à l’étranger, ou un bac européen.', 'You have (or are taking) a French bac, including at a French school abroad, or a European bac.'),
      platform: P.parcoursup, verifie: V, source: 'campusfrance.org',
      steps: [
        S('ps-discover', 'Découvrir les formations', 'Explore programmes', 'Le site ouvre en décembre 2026 : regarde les formations, leurs attendus et leurs taux d’accès.', 'The site opens in December 2026: look at programmes, their expectations and admission rates.', P.parcoursup.url),
        S('ps-wishes', 'S’inscrire et formuler tes vœux', 'Register and make your choices', 'Inscription et vœux de janvier à mars 2027. Prépare ton « projet de formation motivé » pour chaque vœu.', 'Registration and choices from January to March 2027. Prepare your “motivated training project” for each choice.', P.parcoursup.url),
        S('ps-confirm', 'Compléter et confirmer tes vœux', 'Complete and confirm your choices', 'En avril 2027 : dossier complet et vœux confirmés, sinon ils ne sont pas examinés.', 'In April 2027: complete file and confirmed choices, otherwise they are not reviewed.', P.parcoursup.url),
        S('ps-answers', 'Répondre aux propositions', 'Answer the offers', 'Phase d’admission de juin à juillet 2027 : réponds dans les délais affichés à chaque proposition.', 'Admission phase from June to July 2027: answer within the deadline shown for each offer.', P.parcoursup.url),
        S('ps-enrol', 'T’inscrire dans l’établissement', 'Enrol at the institution', 'Après avoir accepté, suis la procédure d’inscription administrative de l’école.', 'After accepting, follow the institution’s administrative enrolment.', '')
      ]
    },
    /* France — diplôme étranger, pays « Études en France » : candidature + entretien + visa sur la même plateforme */
    eef: {
      label: T('France — Études en France (Campus France)', 'France — Études en France (Campus France)'),
      who: T('Tu as un diplôme étranger et tu vis dans un pays où Campus France gère la candidature.', 'You have a foreign diploma and live in a country where Campus France handles applications.'),
      platform: P.eef, verifie: V, source: 'campusfrance.org',
      steps: [
        S('eef-account', 'Créer ton compte Études en France', 'Create your Études en France account', 'Sur la plateforme officielle. Garde bien ton identifiant : tout ton dossier passe par là, jusqu’au visa.', 'On the official platform. Keep your login safe: your whole file goes through it, up to the visa.', P.eef.url),
        S('eef-file', 'Remplir ton dossier', 'Fill in your file', 'Parcours scolaire, notes, diplômes, test de français si demandé, et une motivation par formation.', 'Education history, grades, diplomas, French test if required, and a motivation for each programme.', P.eef.url),
        S('eef-dap', 'Choisir tes formations (DAP pour une 1re année)', 'Choose programmes (DAP for a 1st year)', 'Pour une 1re année de licence, campagne DAP 2027 : du 1er octobre au 15 décembre 2026.', 'For a 1st year bachelor’s, DAP 2027 campaign: 1 October to 15 December 2026.', P.campusfrance.url, '2026-12-15'),
        S('eef-pay', 'Payer les frais Campus France', 'Pay the Campus France fee', 'Le montant dépend de ton pays : il est indiqué par l’Espace Campus France de ton pays.', 'The amount depends on your country: your country’s Campus France office states it.', P.campusfrance.url),
        S('eef-interview', 'Passer l’entretien Campus France', 'Take the Campus France interview', 'Un échange sur ton projet : pourquoi la France, pourquoi ces formations, comment tu finances tes études. Entraîne-toi dans « Mon dossier ».', 'A conversation about your plan: why France, why these programmes, how you fund your studies. Practise in “My application”.', ''),
        S('eef-answers', 'Recevoir les réponses', 'Receive the answers', 'Pour la DAP : réponses des universités avant le 30 avril 2027, et ta réponse avant le 31 mai 2027.', 'For the DAP: university answers before 30 April 2027, your reply before 31 May 2027.', P.eef.url, '2027-05-31'),
        S('eef-visa', 'Demander ton visa étudiant', 'Apply for your student visa', 'Une fois accepté : demande de visa sur France-Visas, avec ta preuve de ressources et ton logement.', 'Once accepted: visa application on France-Visas, with proof of funds and housing.', P.francevisas.url)
      ]
    },
    /* France — diplôme étranger, pays hors « Études en France » : DAP auprès de l'ambassade */
    dap: {
      label: T('France — Demande d’admission préalable (DAP)', 'France — Prior admission request (DAP)'),
      who: T('Tu as un diplôme étranger et ton pays n’utilise pas la plateforme Études en France.', 'You have a foreign diploma and your country does not use the Études en France platform.'),
      platform: P.campusfrance, verifie: V, source: 'campusfrance.org',
      steps: [
        S('dap-form', 'Retirer le dossier DAP', 'Get the DAP form', 'Auprès du service culturel de l’ambassade de France de ton pays. Campagne 2027 : du 1er octobre au 15 décembre 2026.', 'From the cultural service of the French embassy in your country. 2027 campaign: 1 October to 15 December 2026.', P.campusfrance.url, '2026-12-15'),
        S('dap-test', 'Passer le test de français si demandé', 'Take the French test if required', 'TCF DAP ou équivalent, selon ton niveau et ton pays.', 'TCF DAP or equivalent, depending on your level and country.', ''),
        S('dap-answers', 'Recevoir la réponse', 'Receive the answer', 'Réponses des universités avant le 30 avril 2027 ; ta réponse avant le 31 mai 2027.', 'University answers before 30 April 2027; your reply before 31 May 2027.', '', '2027-05-31'),
        S('dap-visa', 'Demander ton visa', 'Apply for your visa', 'Sur France-Visas, avec l’attestation d’admission et la preuve de ressources.', 'On France-Visas, with the admission letter and proof of funds.', P.francevisas.url)
      ]
    },
    'fr-ge': {
      label: T('France — Grandes écoles (candidature directe)', 'France — Grandes écoles (direct application)'),
      who: T('Sciences Po, écoles de commerce et d’ingénieurs : tu postules directement sur le site de l’école.', 'Sciences Po, business and engineering schools: you apply directly on the school’s website.'),
      platform: null,
      steps: [
        S('ge-round', 'Choisir ton « round » de candidature', 'Pick your application round', 'Les écoles admettent en plusieurs sessions : note la date de celle que tu vises.', 'Schools admit in several rounds: note the date of the one you target.', ''),
        S('ge-tests', 'Passer les tests demandés', 'Take the required tests', 'Anglais (TOEFL, IELTS), parfois GMAT, GRE ou TAGE MAGE selon le programme.', 'English (TOEFL, IELTS), sometimes GMAT, GRE or TAGE MAGE depending on the programme.', ''),
        S('ge-apply', 'Déposer ta candidature en ligne', 'Submit your online application', 'Essais, CV, lettres de recommandation : prépare-les dans « Mon dossier ».', 'Essays, CV, recommendation letters: prepare them in “My application”.', ''),
        S('ge-interview', 'Passer l’entretien', 'Do the interview', 'Souvent en visio. Entraîne-toi à présenter ton projet en 2 minutes.', 'Often by video. Practise presenting your plan in 2 minutes.', ''),
        S('ge-visa', 'Visa : procédure « accepté » de Campus France', 'Visa: Campus France “accepted” procedure', 'Une fois admis, la demande de visa passe par Études en France (si ton pays en dépend), puis France-Visas.', 'Once admitted, the visa request goes through Études en France (if your country uses it), then France-Visas.', P.francevisas.url)
      ]
    },
    be: {
      label: T('Belgique (Fédération Wallonie-Bruxelles)', 'Belgium (French-speaking)'),
      who: T('Universités et hautes écoles francophones de Belgique.', 'French-speaking universities and colleges in Belgium.'),
      platform: P.studyinbelgium,
      steps: [
        S('be-equiv', 'Demander l’équivalence de ton diplôme', 'Request diploma equivalence', 'Obligatoire pour un diplôme étranger. Démarre tôt : le délai peut être long.', 'Required for a foreign diploma. Start early: it can take time.', P.studyinbelgium.url),
        S('be-apply', 'Faire ta demande d’admission', 'Submit your admission request', 'Sur le site de l’université. Hors Union européenne, la date limite tombe souvent au printemps : vérifie-la.', 'On the university website. For non-EU applicants the deadline is often in spring: check it.', ''),
        S('be-exam', 'Examen d’entrée si ta filière en a un', 'Entrance exam if your programme has one', 'Médecine, dentisterie, ingénieur civil…', 'Medicine, dentistry, civil engineering…', ''),
        S('be-visa', 'Demander ton visa étudiant (type D)', 'Apply for your student visa (type D)', 'À l’ambassade de Belgique, avec l’attestation d’admission et une preuve de moyens.', 'At the Belgian embassy, with the admission letter and proof of means.', P.studyinbelgium.url)
      ]
    },
    de: {
      label: T('Allemagne', 'Germany'),
      who: T('Universités publiques allemandes (souvent sans frais de scolarité, sauf exceptions).', 'German public universities (often no tuition fees, with exceptions).'),
      platform: P.uniassist,
      steps: [
        S('de-equiv', 'Vérifier l’équivalence de ton diplôme', 'Check your diploma equivalence', 'Si ton diplôme n’est pas reconnu comme l’Abitur, il faut une année de Studienkolleg.', 'If your diploma is not recognised as equal to the Abitur, you need a Studienkolleg year.', ''),
        S('de-lang', 'Prouver ton niveau de langue', 'Prove your language level', 'Allemand (TestDaF, DSH) ou anglais (IELTS, TOEFL) selon la langue du programme.', 'German (TestDaF, DSH) or English (IELTS, TOEFL) depending on the programme language.', ''),
        S('de-apply', 'Candidater via uni-assist ou l’université', 'Apply via uni-assist or the university', 'Souvent avant le 15 juillet pour le semestre d’hiver — chaque université fixe ses dates.', 'Often before 15 July for the winter semester — each university sets its dates.', P.uniassist.url),
        S('de-funds', 'Ouvrir un compte bloqué', 'Open a blocked account', 'Preuve de ressources pour le visa : le montant est fixé chaque année par l’Allemagne.', 'Proof of funds for the visa: the amount is set each year by Germany.', ''),
        S('de-visa', 'Demander ton visa étudiant', 'Apply for your student visa', 'À l’ambassade d’Allemagne : prends rendez-vous tôt, l’attente peut être longue.', 'At the German embassy: book early, waiting times can be long.', '')
      ]
    },
    ch: {
      label: T('Suisse', 'Switzerland'),
      who: T('Universités suisses (pré-inscription directe).', 'Swiss universities (direct pre-registration).'),
      platform: null,
      steps: [
        S('ch-pre', 'Pré-inscription en ligne', 'Online pre-registration', 'Si tu as besoin d’un visa, la date limite est généralement fin février pour septembre.', 'If you need a visa, the deadline is usually the end of February for September.', ''),
        S('ch-check', 'Vérification de ton diplôme', 'Diploma check', 'L’université vérifie que ton diplôme est équivalent à la maturité suisse.', 'The university checks your diploma is equivalent to the Swiss maturité.', ''),
        S('ch-exam', 'Examen complémentaire si demandé', 'Additional exam if required', 'Certains diplômes doivent passer un examen d’admission.', 'Some diplomas must pass an admission exam.', ''),
        S('ch-visa', 'Visa et permis de séjour', 'Visa and residence permit', 'Avec l’attestation d’admission et la preuve de moyens financiers.', 'With the admission letter and proof of financial means.', '')
      ]
    },
    'ca-qc': {
      label: T('Canada — Québec', 'Canada — Quebec'),
      who: T('Universités du Québec : admission, puis CAQ, puis permis d’études.', 'Quebec universities: admission, then CAQ, then study permit.'),
      platform: P.caq,
      steps: [
        S('qc-apply', 'Demande d’admission en ligne', 'Online application', 'En général avant le 1er février pour l’automne — certains programmes ferment plus tôt.', 'Usually before 1 February for the fall — some programmes close earlier.', ''),
        S('qc-offer', 'Recevoir l’offre d’admission', 'Receive the offer of admission', 'Accepte-la dans le délai indiqué.', 'Accept it within the stated deadline.', ''),
        S('qc-caq', 'Demander ton CAQ', 'Apply for your CAQ', 'Certificat d’acceptation du Québec, demandé au gouvernement du Québec.', 'Quebec acceptance certificate, from the Government of Quebec.', P.caq.url),
        S('qc-permit', 'Demander ton permis d’études fédéral', 'Apply for your federal study permit', 'Auprès d’Immigration Canada, avec le CAQ et la preuve de fonds.', 'With Immigration Canada, using the CAQ and proof of funds.', P.permisCa.url)
      ]
    },
    'ca-on': {
      label: T('Canada — Ontario et autres provinces', 'Canada — Ontario and other provinces'),
      who: T('Universités anglophones : candidature, offre, puis permis d’études.', 'English-speaking universities: application, offer, then study permit.'),
      platform: P.permisCa,
      steps: [
        S('on-apply', 'Candidature (OUAC pour l’Ontario)', 'Application (OUAC for Ontario)', 'Mi-janvier en général pour septembre ; plus tôt pour certaines bourses.', 'Usually mid-January for September; earlier for some scholarships.', ''),
        S('on-docs', 'Envoyer les documents complémentaires', 'Send supporting documents', 'Relevés, test d’anglais, profil personnel selon le programme.', 'Transcripts, English test, personal profile depending on the programme.', ''),
        S('on-offer', 'Recevoir l’offre', 'Receive the offer', 'Accepte-la et demande les documents pour le permis.', 'Accept it and request the documents for the permit.', ''),
        S('on-permit', 'Demander ton permis d’études', 'Apply for your study permit', 'Auprès d’Immigration Canada, avec la preuve de fonds.', 'With Immigration Canada, with proof of funds.', P.permisCa.url)
      ]
    },
    us: {
      label: T('États-Unis', 'United States'),
      who: T('Universités américaines : Common App ou portail de l’université, puis I-20 et visa F-1.', 'US universities: Common App or the university portal, then I-20 and F-1 visa.'),
      platform: P.commonapp,
      steps: [
        S('us-list', 'Choisir Early ou Regular', 'Choose Early or Regular', 'Early vers le 1er novembre, Regular vers début janvier (selon l’université).', 'Early around 1 November, Regular around early January (depending on the university).', ''),
        S('us-tests', 'Passer les tests', 'Take the tests', 'Anglais (TOEFL, IELTS, Duolingo) et SAT/ACT si l’université les demande.', 'English (TOEFL, IELTS, Duolingo) and SAT/ACT if the university requires them.', ''),
        S('us-apply', 'Envoyer ta candidature', 'Submit your application', 'Essais, recommandations, relevés traduits. Demande l’aide financière en même temps.', 'Essays, recommendations, translated transcripts. Request financial aid at the same time.', P.commonapp.url),
        S('us-i20', 'Recevoir l’I-20', 'Receive the I-20', 'Après l’admission et la preuve de financement.', 'After admission and proof of funding.', P.studyStates.url),
        S('us-visa', 'Payer le SEVIS et passer l’entretien de visa F-1', 'Pay SEVIS and do the F-1 visa interview', 'Prends rendez-vous à l’ambassade des États-Unis dès que tu as l’I-20.', 'Book at the US embassy as soon as you have the I-20.', P.studyStates.url)
      ]
    },
    gh: {
      label: T('Ghana', 'Ghana'),
      who: T('Universités ghanéennes (candidature internationale en ligne).', 'Ghanaian universities (online international application).'),
      platform: null,
      steps: [
        S('gh-apply', 'Candidature internationale en ligne', 'Online international application', 'Les candidatures ferment souvent au printemps pour août/septembre : vérifie la date.', 'Applications often close in spring for August/September: check the date.', ''),
        S('gh-letter', 'Recevoir la lettre d’admission', 'Receive the admission letter', '', '', ''),
        S('gh-permit', 'Permis de séjour étudiant', 'Student residence permit', 'Avec la lettre d’admission.', 'With the admission letter.', '')
      ]
    },
    za: {
      label: T('Afrique du Sud', 'South Africa'),
      who: T('Universités sud-africaines.', 'South African universities.'),
      platform: null,
      steps: [
        S('za-apply', 'Candidature en ligne', 'Online application', 'Ouverture vers avril, clôture vers fin juillet pour l’année suivante.', 'Opens around April, closes around the end of July for the following year.', ''),
        S('za-exempt', 'Exemption USAf', 'USAf exemption', 'Équivalence de ton diplôme pour entrer en licence.', 'Diploma equivalence to enter a bachelor’s.', ''),
        S('za-visa', 'Visa étudiant', 'Student visa', 'Avec l’offre d’admission et la preuve de moyens.', 'With the offer and proof of means.', '')
      ]
    },
    asia: {
      label: T('Asie et Moyen-Orient', 'Asia and the Middle East'),
      who: T('Programmes en anglais, souvent avec des bourses d’État (MEXT, CSC, GKS…).', 'English-taught programmes, often with government scholarships (MEXT, CSC, GKS…).'),
      platform: null,
      steps: [
        S('as-apply', 'Candidature en ligne', 'Online application', 'Souvent entre octobre et février pour septembre.', 'Often between October and February for September.', ''),
        S('as-scholar', 'Postuler à la bourse d’État en parallèle', 'Apply for the government scholarship in parallel', 'MEXT (Japon), CSC (Chine), GKS (Corée) : ils ouvrent en général au printemps.', 'MEXT (Japan), CSC (China), GKS (Korea): they usually open in spring.', ''),
        S('as-test', 'Test ou entretien', 'Test or interview', '', '', ''),
        S('as-visa', 'Visa étudiant', 'Student visa', 'Avec la lettre d’admission.', 'With the admission letter.', '')
      ]
    },
    'africa-public': {
      label: T('Université publique en Afrique', 'Public university in Africa'),
      who: T('Bacheliers du pays : plateforme nationale. Étudiants étrangers : candidature directe auprès de l’université.', 'National high-school graduates: national platform. International students: apply directly to the university.'),
      platform: null,
      steps: [
        S('af-platform', 'T’inscrire sur la plateforme nationale', 'Register on the national platform', 'Au Sénégal : Campusen. Ailleurs : la plateforme du ministère de l’Enseignement supérieur. Étranger : service des étudiants internationaux de l’université.', 'In Senegal: Campusen. Elsewhere: the higher-education ministry platform. International: the university’s international office.', ''),
        S('af-choices', 'Classer tes choix de filières', 'Rank your programme choices', 'Mets en premier ce que tu veux vraiment, pas seulement ce qui est sûr.', 'Put first what you really want, not only what is safe.', ''),
        S('af-results', 'Consulter ton affectation', 'Check your placement', 'Après les résultats du bac, entre juillet et octobre en général.', 'After exam results, usually between July and October.', ''),
        S('af-enrol', 'Inscription administrative', 'Administrative enrolment', 'Paie les droits d’inscription et récupère ta carte d’étudiant.', 'Pay the enrolment fees and get your student card.', '')
      ]
    },
    'africa-private': {
      label: T('École privée en Afrique', 'Private school in Africa'),
      who: T('Sélection sur dossier, souvent avec test et entretien.', 'Selection on application, often with a test and interview.'),
      platform: null,
      steps: [
        S('ap-file', 'Déposer ton dossier', 'Submit your application', 'En ligne ou sur place. Plusieurs sessions par an, le plus souvent d’avril à septembre.', 'Online or on site. Several sessions a year, usually from April to September.', ''),
        S('ap-test', 'Passer le test écrit', 'Take the written test', 'Selon la filière.', 'Depending on the programme.', ''),
        S('ap-interview', 'Entretien de motivation', 'Motivation interview', 'Prépare ton projet en 2 minutes : pourquoi cette école, pour quel métier.', 'Prepare your plan in 2 minutes: why this school, for which job.', ''),
        S('ap-enrol', 'Inscription et premier paiement', 'Enrolment and first payment', 'Demande s’il existe des bourses internes ou un paiement en plusieurs fois.', 'Ask about internal scholarships or paying in instalments.', '')
      ]
    },
    online: {
      label: T('Études en ligne', 'Online studies'),
      who: T('Candidature 100 % en ligne, sans déménager.', '100% online application, no relocation.'),
      platform: null,
      steps: [
        S('on-apply2', 'Candidature en ligne', 'Online application', 'Plusieurs rentrées par an.', 'Several intakes a year.', ''),
        S('on-docs2', 'Envoyer tes justificatifs', 'Upload your documents', 'Diplôme, pièce d’identité, preuve de langue si demandée.', 'Diploma, ID, language proof if required.', ''),
        S('on-start', 'Préparer ton matériel et ton rythme', 'Prepare your equipment and routine', 'Connexion stable, ordinateur, et des créneaux fixes chaque semaine.', 'Stable connection, computer, and fixed weekly slots.', '')
      ]
    },
    /* Royaume-Uni — licence (undergraduate) : une seule candidature UCAS (dates officielles UCAS pour une entrée en 2027) */
    uk: {
      label: T('Royaume-Uni — UCAS', 'United Kingdom — UCAS'),
      who: T('Licence (undergraduate) au Royaume-Uni : une seule candidature sur UCAS, avec 5 choix au maximum.', 'Undergraduate degree in the UK: one application on UCAS, with up to 5 choices.'),
      platform: P.ucas, verifie: '2026-10-19', source: 'ucas.com',
      steps: [
        S('uk-account', 'Créer ton compte UCAS', 'Create your UCAS account', 'Les candidatures pour une entrée en 2027 sont ouvertes depuis le 12 mai 2026 ; une candidature complète peut être envoyée depuis le 1er septembre 2026.', 'Applications for 2027 entry opened on 12 May 2026; a complete application can be sent from 1 September 2026.', P.ucas.url),
        S('uk-reference', 'Obtenir ta référence', 'Get your reference', 'Un enseignant écrit ta référence : UCAS l’exige avant l’envoi de ta candidature.', 'A teacher writes your reference: UCAS requires it before you can send your application.', ''),
        S('uk-choices', 'Choisir tes formations et écrire ta présentation', 'Choose your courses and write your statement', '5 choix au maximum en tout. Ta présentation personnelle (personal statement) sert pour toutes tes formations.', 'Up to 5 choices in total. Your personal statement is used for all your courses.', P.ucas.url),
        S('uk-send', 'Envoyer ta candidature', 'Send your application', 'Date d’égalité de traitement pour la plupart des formations : 13 janvier 2027, 18 h (heure du Royaume-Uni). Oxford, Cambridge et la plupart des formations de médecine, dentaire et vétérinaire : c’était le 15 octobre 2026. Beaucoup d’universités acceptent les étudiants internationaux plus tard : vérifie la date de chaque formation.', 'Equal consideration date for most courses: 13 January 2027, 18:00 UK time. Oxford, Cambridge and most medicine, dentistry and veterinary courses: it was 15 October 2026. Many universities accept international students later: check each course’s date.', P.ucas.url, '2027-01-13'),
        S('uk-offers', 'Répondre aux offres', 'Reply to your offers', 'Les universités répondent dans ton espace UCAS. Réponds dans le délai affiché pour chaque offre.', 'Universities reply in your UCAS Hub. Reply within the time shown for each offer.', P.ucas.url),
        S('uk-cas', 'Recevoir ton CAS', 'Get your CAS', 'Quand ta place est confirmée, l’université te donne ton CAS (confirmation d’acceptation) : il faut ce numéro pour le visa.', 'When your place is confirmed, the university gives you your CAS (confirmation of acceptance for studies): you need it for the visa.', ''),
        S('uk-visa', 'Demander ton Student visa', 'Apply for your Student visa', 'Sur GOV.UK, avec ton CAS, ton passeport et la preuve de tes ressources.', 'On GOV.UK, with your CAS, your passport and proof of your funds.', P.ukvisa.url)
      ]
    },
    /* Pays-Bas — bachelor : inscription sur Studielink (dates nationales de Studiekeuze123) */
    'eu-nl': {
      label: T('Pays-Bas — Studielink', 'Netherlands — Studielink'),
      who: T('Licence (bachelor) aux Pays-Bas : tu t’inscris sur Studielink, puis l’établissement te dit quels documents envoyer.', 'Bachelor’s degree in the Netherlands: you enrol on Studielink, then the institution tells you which documents to send.'),
      platform: P.studielink, verifie: '2026-10-19', source: 'studiekeuze123.nl',
      steps: [
        S('nl-choose', 'Choisir ta formation et lire ses conditions', 'Choose your programme and read its requirements', 'Sur la page admission de l’établissement : diplôme demandé, niveau d’anglais et sa propre date limite, qui peut être plus tôt que les dates nationales. Les écoles privées fixent leurs propres dates.', 'On the institution’s admission page: required diploma, English level and its own deadline, which can be earlier than the national dates. Private schools set their own dates.', ''),
        S('nl-studielink', 'T’inscrire sur Studielink', 'Enrol on Studielink', 'Si tu ne vis pas encore aux Pays-Bas, inscris-toi comme étudiant international (sans DigiD).', 'If you do not live in the Netherlands yet, sign up as an international student (without DigiD).', P.studielink.url),
        S('nl-fixus', 'Formation à places limitées (numerus fixus)', 'Limited-place programme (numerus fixus)', 'Date limite : 15 janvier 2027. La sélection commence ensuite ; résultats le 15 avril.', 'Deadline: 15 January 2027. Selection starts afterwards; results on 15 April.', P.studiekeuze.url, '2027-01-15'),
        S('nl-may', 'Autres bachelors : avant le 1er mai', 'Other bachelor’s: before 1 May', 'Date limite nationale : 1er mai 2027. Après cette date, l’établissement peut refuser ou ajouter des conditions.', 'National deadline: 1 May 2027. After that date the institution may refuse or add conditions.', P.studiekeuze.url, '2027-05-01'),
        S('nl-docs', 'Envoyer tes documents à l’établissement', 'Send your documents to the institution', 'Diplômes, relevés de notes, test d’anglais : suis la liste et le portail de l’établissement.', 'Diplomas, transcripts, English test: follow the institution’s list and portal.', ''),
        S('nl-permit', 'Permis de séjour (hors Union européenne)', 'Residence permit (non-EU)', 'Demande à l’établissement comment se fait la demande auprès de l’IND (service de l’immigration) et jusqu’à quelle date.', 'Ask the institution how the application to the IND (immigration service) works and by which date.', '')
      ]
    },
    /* Italie — étudiants hors UE : université, puis pré-inscription Universitaly, puis visa (procédure décrite par les universités) */
    'eu-it': {
      label: T('Italie — Universitaly', 'Italy — Universitaly'),
      who: T('Études en Italie avec un diplôme hors UE : candidature à l’université, pré-inscription sur Universitaly, puis visa.', 'Studying in Italy with a non-EU diploma: application to the university, pre-enrolment on Universitaly, then visa.'),
      platform: P.universitaly, verifie: '2026-10-19', source: 'unipi.it, universitaly.it',
      steps: [
        S('it-apply', 'Postuler à l’université', 'Apply to the university', 'Chaque université a sa procédure, ses dates et parfois un test d’entrée : commence par sa page pour les étudiants internationaux.', 'Each university has its own procedure, dates and sometimes an entrance test: start with its page for international students.', ''),
        S('it-lang', 'Préparer ta certification de langue', 'Get your language certificate', 'Souvent un niveau B2 en italien pour un cursus en italien, ou un certificat d’anglais pour un cursus en anglais : vérifie le niveau demandé.', 'Often B2 Italian for a course taught in Italian, or an English certificate for a course taught in English: check the level required.', ''),
        S('it-preenrol', 'Te pré-inscrire sur Universitaly', 'Pre-enrol on Universitaly', 'Pour une seule formation : après l’envoi, tu ne peux plus changer d’université ni de formation. Les dates sont fixées chaque année.', 'For one programme only: once sent, you cannot change university or programme. Dates are set every year.', P.universitaly.url),
        S('it-visa', 'Demander ton visa d’études (type D)', 'Apply for your study visa (type D)', 'Quand ta pré-inscription est validée, l’ambassade ou le consulat d’Italie de ton pays te contacte. L’admission ne garantit pas le visa.', 'Once your pre-enrolment is validated, the Italian embassy or consulate in your country contacts you. Admission does not guarantee the visa.', ''),
        S('it-enrol', 'Finaliser ton inscription en Italie', 'Complete your enrolment in Italy', 'À ton arrivée, suis les étapes de l’université (inscription définitive, permis de séjour).', 'When you arrive, follow the university’s steps (final enrolment, residence permit).', '')
      ]
    },
    /* Démarches générales : pour une école dont LERNA n'a pas encore vérifié la procédure propre (aucune date ni règle de pays inventée) */
    generic: {
      label: T('Démarches générales (à confirmer avec l’école)', 'General steps (to confirm with the school)'),
      who: T('LERNA n’a pas encore vérifié la procédure propre à cette école : voici les étapes communes, à confirmer avec elle.', 'LERNA has not checked this school’s own procedure yet: here are the common steps, to confirm with the school.'),
      platform: null,
      steps: [
        S('gen-check', 'Vérifier la reconnaissance de l’école et du diplôme', 'Check the school and degree are recognised', 'Regarde sa fiche et la liste officielle du pays. Demande l’autorisation ou l’accréditation exacte de TA formation.', 'Look at its profile and the country’s official list. Ask for the exact authorisation or accreditation of YOUR programme.', ''),
        S('gen-rules', 'Demander les conditions et la date limite', 'Ask for the requirements and the deadline', 'Écris au service des admissions : conditions, documents, frais de dossier et date limite. Note la date ici.', 'Write to the admissions office: requirements, documents, application fee and deadline. Note the date here.', ''),
        S('gen-docs', 'Rassembler tes documents', 'Gather your documents', 'Diplôme, relevés de notes, pièce d’identité, traductions si demandées : coche-les dans l’onglet Documents.', 'Diploma, transcripts, ID, translations if required: tick them in the Documents tab.', ''),
        S('gen-apply', 'Déposer ta candidature', 'Submit your application', 'Sur le portail de l’école ou comme elle l’indique. Garde une preuve de dépôt.', 'On the school’s portal or as it says. Keep a proof of submission.', ''),
        S('gen-answer', 'Recevoir la réponse', 'Receive the answer', 'Réponds dans le délai écrit sur la lettre d’admission.', 'Reply within the time limit written on the admission letter.', ''),
        S('gen-visa', 'Préparer ton visa si tu pars à l’étranger', 'Prepare your visa if you move abroad', 'Renseigne-toi auprès de l’ambassade du pays : onglet Visa.', 'Check with the country’s embassy: Visa tab.', '')
      ]
    }
  };

  /* Liens officiels directs vérifiés (page admission de l'école). Sinon : site officiel + recherche ciblée sur ce site. */
  window.LERNA_SCHOOL_LINKS = {
    mit: { admission: 'https://mitadmissions.org/apply/' },
    utoronto: { admission: 'https://future.utoronto.ca/apply/' },
    udem: { admission: 'https://admission.umontreal.ca/' },
    ulaval: { admission: 'https://www.ulaval.ca/admission' },
    unige: { admission: 'https://www.unige.ch/admissions/' },
    tum: { admission: 'https://www.tum.de/en/studies/application' },
    nus: { admission: 'https://www.nus.edu.sg/oam/' },
    khalifa: { admission: 'https://www.ku.ac.ae/admissions' },
    kaist: { admission: 'https://admission.kaist.ac.kr/intl-undergraduate/' }
  };
  /* Liens « admission internationale, frais, bourses, contact » d'une école */
  window.LERNA_SCHOOL_LINKSET = function (s, lang) {
    var en = lang === 'en';
    var host = String(s.site || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var q = function (words) { return 'https://www.google.com/search?q=' + encodeURIComponent('site:' + host + ' ' + words); };
    var d = window.LERNA_SCHOOL_LINKS[s.id] || {};
    return [
      { key: 'admission', label: T('Admission internationale', 'International admission'), url: d.admission || q(en ? 'international admission apply' : 'admission étudiants internationaux'), direct: !!d.admission },
      { key: 'frais', label: T('Frais de scolarité', 'Tuition fees'), url: d.frais || q(en ? 'tuition fees international' : 'frais de scolarité'), direct: !!d.frais },
      { key: 'bourses', label: T('Bourses de l’école', 'School scholarships'), url: d.bourses || q(en ? 'scholarships international students' : 'bourses étudiants'), direct: !!d.bourses },
      { key: 'contact', label: T('Contacter l’école', 'Contact the school'), url: d.contact || q('contact'), direct: !!d.contact },
      { key: 'site', label: T('Site officiel', 'Official website'), url: s.site, direct: true }
    ];
  };

  /* Quel guide pour cette école et cette personne ? (France : selon le diplôme et le pays) */
  window.LERNA_GUIDE_FOR = function (s, country, answers) {
    if (!s) return null;
    var key = s.adm;
    if (key === 'fr-public') {
      var euBac = /^(FR|GP|MQ|GF|RE|YT|NC|PF)$/.test(country || '') || (answers && answers.q3_autre && /bac fran[cç]ais|french bac|bac europ/i.test(answers.q3_autre));
      key = euBac ? 'parcoursup' : (EEF.indexOf(country) !== -1 || !country ? 'eef' : 'dap');
    }
    if (key === 'eu' && s.pays && window.LERNA_GUIDES['eu-' + String(s.pays).toLowerCase()]) key = 'eu-' + String(s.pays).toLowerCase();   // Europe : guide du pays quand il existe
    var g = window.LERNA_GUIDES[key];
    if (!g) { key = 'generic'; g = window.LERNA_GUIDES.generic; }   // procédure propre pas encore vérifiée par LERNA
    /* Oxford et Cambridge : date UCAS plus tôt (15 octobre 2026, 18 h heure du Royaume-Uni) */
    if (key === 'uk' && (s.id === 'oxford' || s.id === 'cambridge')) {
      g = Object.assign({}, g, { steps: g.steps.map(function (x) { return x.id === 'uk-send' ? Object.assign({}, x, { date: '2026-10-15' }) : x; }) });
    }
    return Object.assign({ key: key }, g);
  };
  /* Système d'admission habituel d'un pays, d'après les fiches LERNA vérifiées de ce pays (même statut d'abord) */
  window.LERNA_ADM_FOR = function (cc, type) {
    var S = (window.LERNA_SCHOOLS || []).filter(function (s) { return s.pays === cc && s.adm !== 'online'; });
    if (type) { var same = S.filter(function (s) { return s.type === type; })[0]; return same ? same.adm : (S[0] ? S[0].adm : null); }
    /* Statut inconnu : seulement si toutes les fiches du pays suivent la même démarche (sinon on ne devine pas public ou privé) */
    var adms = S.map(function (s) { return s.adm; }).filter(function (a, i, l) { return l.indexOf(a) === i; });
    return adms.length === 1 ? adms[0] : null;
  };
  /* Dossier pour un établissement de l'annuaire officiel : identifiant court et stable + fiche gardée dans le dossier */
  window.LERNA_DOSSIER_ANN = function (o) {
    var h = 0, k = (o.cc || '') + '|' + String(o.nom || '').toLowerCase();
    for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
    var type = o.type === 'public' ? 'public' : o.type === 'private' ? 'private' : '';
    return { id: 'x-' + String(o.cc || 'zz').toLowerCase() + '-' + h.toString(36), init: { meta: {
      kind: 'ann', nom: o.nom, pays: o.cc, ville: o.ville || '', type: type, adm: window.LERNA_ADM_FOR(o.cc, type), site: o.site || '', link: o.link || '' } } };
  };
  /* France : un seul dossier pour toutes les formations (plateforme nationale), chaque formation est un vœu */
  window.LERNA_DOSSIER_FR = function (o, title) {
    return { id: 'p-france', init: { meta: { kind: 'platform', nom: title || 'France', pays: 'FR', adm: 'fr-public' } },
      voeu: { k: String(o.gta), gta: String(o.gta), nm: o.nm || '', etab: o.etab || '', ville: o.ville || '' } };
  };
  /* École d'un dossier : fiche LERNA, ou fiche gardée dans le dossier (annuaire officiel, plateforme France avec ses vœux) */
  window.LERNA_DOSSIER_SCHOOL = function (id) {
    var s = window.LERNA_SCHOOL && window.LERNA_SCHOOL(id);
    if (s) return s;
    var d = window.Lerna && Lerna.dossiers && Lerna.dossiers.get(id), m = d && d.meta;
    if (!m || !m.nom) return null;
    return { id: id, pseudo: true, platform: m.kind === 'platform', nom: m.nom, pays: m.pays || '', ville: m.ville || '', type: m.type || '', adm: m.adm || null,
      site: m.site || '', link: m.link || '', domaines: [], langues: [], filieres: [], forts: [], faibles: [], duree: [0, 0], frais_local: null, frais_etranger: null };
  };

  /* Questions fréquentes de l'entretien Campus France (entraînement dans « Mon dossier ») */
  window.LERNA_INTERVIEW_QS = [
    T('Présente-toi et ton parcours en deux minutes.', 'Introduce yourself and your background in two minutes.'),
    T('Pourquoi veux-tu étudier en France plutôt que dans ton pays ?', 'Why do you want to study in France rather than in your country?'),
    T('Pourquoi as-tu choisi ces formations, et dans cet ordre ?', 'Why did you choose these programmes, and in this order?'),
    T('Que feras-tu après tes études ? Quel métier vises-tu ?', 'What will you do after your studies? Which job are you aiming for?'),
    T('Comment vas-tu financer tes études et ta vie sur place ?', 'How will you fund your studies and living costs?'),
    T('Que sais-tu de la ville et de l’établissement ?', 'What do you know about the city and the institution?'),
    T('Quelles difficultés imagines-tu, et comment les surmonteras-tu ?', 'What difficulties do you expect, and how will you overcome them?')
  ];

  /* Atelier lettre de motivation : la structure (LERNA aide, la personne écrit) */
  window.LERNA_LETTER_PARTS = [
    { id: 'hook', title: T('1. L’accroche', '1. The opening'), tip: T('Un fait précis qui montre d’où vient ton intérêt — pas « depuis toujours ».', 'A precise fact showing where your interest comes from — not “for as long as I can remember”.') },
    { id: 'why', title: T('2. Pourquoi cette formation', '2. Why this programme'), tip: T('Cite 2 éléments concrets de la formation (cours, projet, partenaire) et relie-les à ton but.', 'Name 2 concrete things about the programme (courses, project, partner) and link them to your goal.') },
    { id: 'me', title: T('3. Pourquoi toi', '3. Why you'), tip: T('Une ou deux preuves : un projet, une note, un engagement, une responsabilité.', 'One or two pieces of evidence: a project, a grade, a commitment, a responsibility.') },
    { id: 'next', title: T('4. Ton projet', '4. Your plan'), tip: T('Ce que tu feras après, et comment cette formation t’y mène. Termine simplement.', 'What you will do afterwards, and how this programme gets you there. End simply.') }
  ];

  /* Documents à rassembler pour une école (liste du système d'admission, avec un identifiant stable) */
  window.LERNA_DOSSIER_DOCS = function (s) {
    var a = window.LERNA_ADMISSION && window.LERNA_ADMISSION[s.adm];
    var base = a && a.documents ? a.documents.slice() : [];
    var extra = [T('Passeport valide (plus de 6 mois après la rentrée)', 'Valid passport (more than 6 months after the start date)'), T('Photos d’identité récentes', 'Recent ID photos'), T('CV à jour', 'Up-to-date CV')];
    var norm = function (x) { return (x.fr || '').toLowerCase(); };
    extra.forEach(function (e) { if (!base.some(function (b) { return norm(b).indexOf(norm(e).split(' ')[0]) !== -1; })) base.push(e); });
    return base.map(function (d, i) { return { id: 'd' + i, label: d }; });
  };
  /* Prochaine étape de « Mon dossier » (sert la mission du jour et l'accueil) */
  window.LERNA_DOSSIER_NEXT = function (country, answers) {
    if (!window.Lerna || !Lerna.dossiers) return null;
    var ids = Lerna.dossiers.ids();
    for (var i = 0; i < ids.length; i++) {
      var d = Lerna.dossiers.get(ids[i]), s = window.LERNA_DOSSIER_SCHOOL(ids[i]);
      if (!d || !s || d.status === 'accepted' || d.status === 'refused' || d.status === 'archived') continue;
      var g = d.guide && window.LERNA_GUIDES[d.guide] ? Object.assign({ key: d.guide }, window.LERNA_GUIDES[d.guide]) : window.LERNA_GUIDE_FOR(s, country, answers);
      if (!g) continue;
      var steps = d.steps || {};
      var total = g.steps.length, done = g.steps.filter(function (x) { return steps[x.id] && steps[x.id].done; }).length;
      var next = g.steps.filter(function (x) { return !(steps[x.id] && steps[x.id].done); })[0];
      if (next) return { school: s, guide: g, step: next, done: done, total: total, dossier: d };
    }
    return null;
  };
  /* Échéances de tous les dossiers (dates officielles et dates notées par la personne, étapes pas encore faites) */
  window.LERNA_DOSSIER_DATES = function (country, answers) {
    if (!window.Lerna || !Lerna.dossiers) return [];
    var out = [], lang = Lerna.lang;
    Lerna.dossiers.ids().forEach(function (id) {
      var d = Lerna.dossiers.get(id), s = window.LERNA_DOSSIER_SCHOOL(id);
      if (!d || !s || d.status === 'accepted' || d.status === 'refused') return;
      var g = d.guide && window.LERNA_GUIDES[d.guide] ? window.LERNA_GUIDES[d.guide] : window.LERNA_GUIDE_FOR(s, country, answers);
      var name = s.nom.split(/[—(]/)[0].trim();
      (g ? g.steps : []).forEach(function (x) {
        var me = (d.steps || {})[x.id] || {};
        if (me.done) return;
        var date = me.date || x.date;
        if (date) out.push({ title: name + ' — ' + (x.title[lang] || x.title.fr), date: date, school: id });
      });
      if (d.answerBy) out.push({ title: name + ' — ' + (lang === 'en' ? 'answer expected' : 'réponse attendue'), date: d.answerBy, school: id });
    });
    return out;
  };
})();
