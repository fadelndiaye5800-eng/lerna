/* ==========================================================================
   LERNA — Coffre-fort de candidature (« Mon dossier »)

   L'étudiant remplit UNE fois ses informations et dépose UNE fois ses documents.
   LERNA les range dans l'ordre exact des vraies plateformes (Études en France, Parcoursup,
   candidature directe, emploi, investisseur) avec un bouton « Copier » sur chaque champ.

   LERNA n'est pas un agent : il ne dépose rien à la place de l'étudiant et ne demande jamais
   ses mots de passe. C'est un mentor qui prépare tout pour que la candidature officielle
   prenne quelques minutes.

   Stockage :
   - la fiche → Lerna.dossiers (ligne « coffre », synchronisée avec Supabase comme les autres dossiers)
   - les fichiers → Supabase Storage, compartiment privé « coffre » (dossier = id du compte, voir schema.sql)
     et, en mode aperçu, dans le navigateur (IndexedDB).
   Sources des règles (taille des fichiers, calendrier) : campusfrance.org, senegal.campusfrance.org,
   parcoursup.gouv.fr — vérifiées le 10 octobre 2026.
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en || fr }; }
  var KEY = 'coffre';

  /* ---------- La fiche, dans l'ordre de la plateforme Études en France ---------- */
  var SECTIONS = [
    { id: 'identite', title: T('Informations personnelles', 'Personal information'), fields: [
      { id: 'nom', l: T('Nom de famille (comme sur le passeport)', 'Last name (as on your passport)') },
      { id: 'prenoms', l: T('Prénom(s)', 'First name(s)') },
      { id: 'naissance', l: T('Date de naissance', 'Date of birth'), type: 'date' },
      { id: 'lieu', l: T('Lieu de naissance (ville, pays)', 'Place of birth (city, country)') },
      { id: 'nationalite', l: T('Nationalité', 'Nationality') },
      { id: 'piece', l: T('Pièce d’identité (type et date d’expiration)', 'ID document (type and expiry date)'), ph: T('Ex. : passeport, expire le 12/2031', 'E.g. passport, expires 12/2031') },
      { id: 'adresse', l: T('Adresse complète', 'Full address'), type: 'area' },
      { id: 'tel1', l: T('Téléphone 1', 'Phone 1'), type: 'tel' },
      { id: 'tel2', l: T('Téléphone 2 (un proche)', 'Phone 2 (a relative)'), type: 'tel' },
      { id: 'email', l: T('Email', 'Email'), type: 'email' }
    ] },
    { id: 'parcours', title: T('Parcours et diplômes', 'Education and diplomas'), hint: T('Une ligne par année, de la plus récente à la plus ancienne : année, établissement, classe ou diplôme, moyenne.', 'One line per year, most recent first: year, school, class or diploma, average.'), fields: [
      { id: 'annees', l: T('Mes 3 dernières années d’études', 'My last 3 years of study'), type: 'area', ph: T('2025-2026 — CESAG, Dakar — Licence 1 Gestion — 13,5/20', '2025-2026 — CESAG, Dakar — Year 1 Management — 13.5/20') },
      { id: 'bac', l: T('Baccalauréat (série, année, mention, moyenne)', 'High-school diploma (track, year, honours, average)') },
      { id: 'autres', l: T('Autres diplômes ou certifications', 'Other diplomas or certificates'), type: 'area' }
    ] },
    { id: 'langues', title: T('Compétences linguistiques', 'Language skills'), fields: [
      { id: 'testfr', l: T('Test de français (TCF, DELF, DALF : niveau et date)', 'French test (TCF, DELF, DALF: level and date)'), ph: T('Ex. : TCF B2, passé le 03/2026', 'E.g. TCF B2, taken 03/2026') },
      { id: 'testen', l: T('Test d’anglais (IELTS, TOEFL… : score et date)', 'English test (IELTS, TOEFL…: score and date)') },
      { id: 'autresl', l: T('Autres langues et niveau', 'Other languages and level') },
      { id: 'sejours', l: T('Séjours en France ou à l’étranger', 'Stays in France or abroad') }
    ] },
    { id: 'activites', title: T('Activités et expériences', 'Activities and experience'), hint: T('Facultatif sur Parcoursup, « mais c’est un vrai plus pour ton dossier ».', 'Optional on Parcoursup, “but a real plus for your file”.'), fields: [
      { id: 'experiences', l: T('Stages, jobs, projets (une ligne chacun)', 'Internships, jobs, projects (one line each)'), type: 'area' },
      { id: 'engagements', l: T('Engagements, associations, sport, centres d’intérêt', 'Volunteering, clubs, sport, interests'), type: 'area' }
    ] },
    { id: 'projet', title: T('Mon projet', 'My plan'), hint: T('La base de tes lettres et de ton entretien. Sur Parcoursup, le projet de formation motivé fait au maximum 1 500 caractères et ne doit pas contenir ton nom.', 'The base of your letters and interview. On Parcoursup, the motivated statement is at most 1,500 characters and must not include your name.'), fields: [
      { id: 'pourquoi', l: T('Pourquoi ces études ? (tes vraies raisons)', 'Why these studies? (your real reasons)'), type: 'area', max: 1500 },
      { id: 'apres', l: T('Ce que tu feras après', 'What you will do afterwards'), type: 'area', max: 1500 },
      { id: 'financement', l: T('Comment tu finances tes études (qui paie, combien)', 'How you fund your studies (who pays, how much)'), type: 'area' }
    ] }
  ];

  /* ---------- Les documents (taille maxi = règle de Campus France Sénégal quand elle existe) ---------- */
  var DOCS = [
    { id: 'photo', l: T('Photo d’identité', 'ID photo'), max: 50, img: true, hint: T('Moins de 50 Ko : LERNA réduit l’image pour toi.', 'Under 50 KB: LERNA shrinks the image for you.') },
    { id: 'identite', l: T('Passeport ou carte d’identité', 'Passport or ID card'), max: 500 },
    { id: 'cv', l: T('CV', 'CV'), max: 500, hint: T('Tu peux le créer dans l’onglet CV de n’importe quel dossier.', 'You can create it in the CV tab of any application.') },
    { id: 'bulletins', l: T('Relevés de notes des 3 dernières années', 'Transcripts for the last 3 years'), max: 500, multi: true },
    { id: 'bac', l: T('Diplôme et relevé du bac (ou attestation de réussite)', 'High-school diploma and transcript (or pass certificate)'), max: 500 },
    { id: 'diplomes', l: T('Autres diplômes', 'Other diplomas'), max: 500, multi: true },
    { id: 'langue', l: T('Attestation de test de langue (TCF, DELF, IELTS…)', 'Language test certificate (TCF, DELF, IELTS…)'), max: 500 },
    { id: 'scolarite', l: T('Certificat de scolarité de cette année', 'Enrolment certificate for this year'), max: 500 },
    { id: 'anaq', l: T('Attestation d’habilitation ANAQ-Sup (si ton école est privée au Sénégal)', 'ANAQ-Sup accreditation (if your school is private in Senegal)'), max: 500 },
    { id: 'lettre', l: T('Lettre de motivation', 'Motivation letter'), max: 500 },
    { id: 'reco', l: T('Lettres de recommandation', 'Reference letters'), max: 500, multi: true },
    { id: 'experience', l: T('Attestations de stage ou d’expérience', 'Internship or work certificates'), max: 500, multi: true },
    { id: 'ressources', l: T('Preuve de ressources (garant, bourse, relevé bancaire)', 'Proof of funds (sponsor, scholarship, bank statement)'), max: 500 },
    { id: 'pitch', l: T('Présentation du projet (pitch deck)', 'Project presentation (pitch deck)'), max: 5000 },
    { id: 'onepager', l: T('Résumé du projet en une page', 'One-page project summary'), max: 2000 },
    { id: 'chiffres', l: T('Chiffres du projet (ventes, utilisateurs, coûts)', 'Project numbers (sales, users, costs)'), max: 2000 },
    { id: 'statuts', l: T('Statuts ou registre de l’entreprise (si créée)', 'Company registration (if created)'), max: 5000 }
  ];

  /* ---------- Les parcours : quels documents, quelle plateforme, quelles dates ---------- */
  var PARCOURS = [
    { id: 'eef', title: T('Études en France (Campus France)', 'Études en France (Campus France)'), url: 'https://pastel.diplomatie.gouv.fr/etudesenfrance/',
      sub: T('Diplôme étranger, études en France : candidature, entretien et visa sur la même plateforme.', 'Foreign diploma, studies in France: application, interview and visa on the same platform.'),
      docs: ['photo', 'identite', 'cv', 'bulletins', 'bac', 'langue', 'scolarite', 'anaq', 'experience'],
      sections: ['identite', 'parcours', 'langues', 'activites', 'projet'],
      steps: [T('Crée ton compte, puis remplis les rubriques dans cet ordre : informations personnelles, parcours et diplômes, formations, compétences linguistiques.', 'Create your account, then fill the sections in this order: personal information, education, programmes, language skills.'),
        T('Au maximum 7 choix de formations, dont 3 en 1re année de licence (DAP).', 'At most 7 programme choices, including 3 for a first-year bachelor’s (DAP).'),
        T('Chaque fichier : moins de 500 Ko, en français ou traduit officiellement (avec l’original). Photo : moins de 50 Ko.', 'Each file: under 500 KB, in French or officially translated (with the original). Photo: under 50 KB.'),
        T('Paie les frais seulement quand la plateforme te le demande, puis réserve ton entretien dans les 7 jours qui suivent l’invitation.', 'Pay the fee only when the platform asks, then book your interview within 7 days of the invitation.')],
      dates: { SN: [['2026-12-15', T('Dépôt du dossier (formations connectées), ouvert depuis le 1er octobre 2026', 'File submission (connected programmes), open since 1 October 2026')], ['2026-12-19', T('Paiement des frais de dossier (85 000 FCFA en 2025, à confirmer)', 'Application fee payment (85,000 FCFA in 2025, to be confirmed)')], ['2027-05-31', T('Confirmation de ton choix définitif', 'Confirmation of your final choice')], ['2027-08-27', T('Dernier rendez-vous visa (dès le 15 mai 2027)', 'Last visa appointment (from 15 May 2027)')]],
        _: [['2026-12-15', T('DAP (1re année de licence) : dépôt du 1er octobre au 15 décembre 2026', 'DAP (first-year bachelor’s): submit from 1 October to 15 December 2026')], ['2027-05-31', T('Ta réponse aux universités (DAP)', 'Your reply to universities (DAP)')]] },
      source: 'senegal.campusfrance.org · campusfrance.org' },
    { id: 'parcoursup', title: T('Parcoursup', 'Parcoursup'), url: 'https://www.parcoursup.gouv.fr/',
      sub: T('Bac français (y compris lycée français à l’étranger) ou bac européen.', 'French bac (including French schools abroad) or European bac.'),
      docs: ['bulletins', 'bac', 'cv', 'langue'],
      sections: ['identite', 'parcours', 'activites', 'projet'],
      steps: [T('Rubriques : profil et scolarité, bulletins et notes (à saisir toi-même si ton lycée ne les envoie pas), activités et centres d’intérêt, projet de formation motivé pour chaque vœu.', 'Sections: profile and schooling, report cards and grades (enter them yourself if your school doesn’t send them), activities and interests, motivated statement for each choice.'),
        T('Projet de formation motivé : 1 500 caractères maximum, sans ton nom ni ton prénom.', 'Motivated statement: 1,500 characters maximum, without your name.'),
        T('Calendrier 2027 : ouverture en décembre 2026, vœux de janvier à mars 2027, dossier complet en avril 2027, admission de juin à juillet 2027. Les jours exacts seront publiés par Parcoursup.', '2027 calendar: opens December 2026, choices January–March 2027, complete file in April 2027, admission June–July 2027. Exact days will be published by Parcoursup.')],
      dates: {}, source: 'parcoursup.gouv.fr · campusfrance.org' },
    { id: 'univ', title: T('Candidature directe à une université', 'Direct university application'), url: '',
      sub: T('Universités à l’étranger qui ont leur propre plateforme (Canada, Allemagne, Royaume-Uni, États-Unis…).', 'Universities abroad with their own platform (Canada, Germany, UK, US…).'),
      docs: ['identite', 'bulletins', 'bac', 'langue', 'cv', 'lettre', 'reco', 'ressources'],
      sections: ['identite', 'parcours', 'langues', 'activites', 'projet'],
      steps: [T('Lis la page « international admissions » de l’université : chaque école fixe ses pièces et ses dates.', 'Read the university’s international admissions page: each school sets its own documents and dates.'),
        T('Les documents qui ne sont pas en anglais (ou dans la langue de l’école) doivent souvent être traduits.', 'Documents not in English (or the school’s language) often need translating.')],
      dates: {}, source: 'uni-assist.de · mcgill.ca' },
    { id: 'emploi', title: T('Stage ou emploi', 'Internship or job'), url: 'opportunites.html?tab=stages',
      sub: T('Le dossier type demandé par la plupart des recruteurs.', 'The standard file most recruiters ask for.'),
      docs: ['cv', 'lettre', 'bulletins', 'scolarite', 'experience', 'reco', 'identite'],
      sections: ['identite', 'parcours', 'activites'],
      steps: [T('Adapte ta lettre à chaque offre : cite l’organisme et la mission.', 'Tailor your letter to each offer: name the organisation and the role.'),
        T('Les organisations internationales (ONU, UA…) demandent souvent leur propre modèle de CV : vérifie l’annonce.', 'International organisations (UN, AU…) often require their own CV template: check the posting.')],
      dates: {}, source: '' },
    { id: 'invest', title: T('Investisseur ou concours', 'Investor or competition'), url: 'opportunites.html?tab=investisseurs',
      sub: T('Ce que les prix, accélérateurs et investisseurs demandent presque toujours.', 'What prizes, accelerators and investors almost always ask for.'),
      docs: ['pitch', 'onepager', 'chiffres', 'statuts', 'cv', 'identite'],
      sections: ['identite', 'projet'],
      steps: [T('Ton projet en une phrase, le problème, ta solution, tes premiers résultats, ton équipe, ton besoin d’argent.', 'Your project in one sentence, the problem, your solution, first results, team, funding need.'),
        T('Ne paie jamais pour recevoir un financement.', 'Never pay to receive funding.')],
      dates: {}, source: '' }
  ];

  var t = function (k, p) { return Lerna.t(k, p); };
  var L = function (x) { return Lerna.L(x); };
  var esc = function (x) { return Lerna.esc(x); };
  Lerna.addStrings({
    fr: {
      'cf.title': 'Mon coffre-fort de candidature', 'cf.sub': 'Remplis tes informations et dépose tes documents une seule fois. LERNA les range dans l’ordre exact des plateformes officielles, avec un bouton « Copier » sur chaque champ.',
      'cf.mentor': 'LERNA n’est pas un agent : c’est ton mentor. LERNA ne dépose rien à ta place et ne te demandera jamais tes mots de passe. Tu restes maître de ta candidature.',
      'cf.cardTitle': 'Mon coffre-fort de candidature', 'cf.cardSub': '{f} % de la fiche remplie · {d} documents déposés', 'cf.open': 'Ouvrir →',
      'cf.tFiche': 'Ma fiche', 'cf.tDocs': 'Mes documents', 'cf.tParcours': 'Préparer une candidature',
      'cf.copy': 'Copier', 'cf.copied': 'Copié ✓', 'cf.copyAll': 'Copier toute la rubrique', 'cf.saved': 'Enregistré',
      'cf.upload': 'Déposer', 'cf.replace': 'Remplacer', 'cf.add': 'Ajouter', 'cf.view': 'Voir', 'cf.remove': 'Retirer',
      'cf.max': 'Maximum {k}', 'cf.tooBig': 'Ce fichier fait {s} : la limite est {k}. Pour un PDF, réduis-le (par exemple avec « Exporter en PDF » en qualité réduite) puis dépose-le à nouveau.',
      'cf.shrunk': 'Image réduite à {s} pour respecter la limite.', 'cf.badType': 'Formats acceptés : PDF, JPG, PNG.',
      'cf.upErr': 'Le dépôt n’a pas marché. Vérifie ta connexion et réessaie.', 'cf.uploaded': 'Document rangé dans ton coffre-fort',
      'cf.local': 'Mode aperçu : tes documents restent dans ce navigateur. En ligne, ils sont rangés dans ton espace privé et protégé.',
      'cf.pReady': '{n}/{t} documents prêts', 'cf.pOpen': 'Ouvrir la plateforme officielle ↗', 'cf.pFields': 'Les champs à reporter, dans l’ordre',
      'cf.pDocs': 'Les documents à joindre', 'cf.pSteps': 'À savoir', 'cf.pDates': 'Les dates à ne pas manquer', 'cf.pSource': 'Source : {s}, vérifié le 10/10/2026.',
      'cf.missing': 'Il manque : {l}', 'cf.allReady': 'Tous les documents sont prêts.', 'cf.empty': '—',
      'cf.ai': 'Préparer mes textes avec l’IA', 'cf.aiSoon': 'Bientôt : l’IA relira ta fiche et adaptera ton projet à chaque formation, sans jamais écrire à ta place.',
      'cf.guest': 'Crée ton compte gratuit pour remplir ta fiche et déposer tes documents.', 'cf.back': '← Mes dossiers'
    },
    en: {
      'cf.title': 'My application vault', 'cf.sub': 'Fill in your details and upload your documents once. LERNA arranges them in the exact order of the official platforms, with a “Copy” button on each field.',
      'cf.mentor': 'LERNA is not an agent: it is your mentor. LERNA never submits anything for you and will never ask for your passwords. You stay in charge of your application.',
      'cf.cardTitle': 'My application vault', 'cf.cardSub': '{f}% of your profile filled · {d} documents uploaded', 'cf.open': 'Open →',
      'cf.tFiche': 'My details', 'cf.tDocs': 'My documents', 'cf.tParcours': 'Prepare an application',
      'cf.copy': 'Copy', 'cf.copied': 'Copied ✓', 'cf.copyAll': 'Copy the whole section', 'cf.saved': 'Saved',
      'cf.upload': 'Upload', 'cf.replace': 'Replace', 'cf.add': 'Add', 'cf.view': 'View', 'cf.remove': 'Remove',
      'cf.max': 'Max {k}', 'cf.tooBig': 'This file is {s}: the limit is {k}. For a PDF, shrink it (e.g. “Export as PDF” at reduced quality) and upload it again.',
      'cf.shrunk': 'Image reduced to {s} to meet the limit.', 'cf.badType': 'Accepted formats: PDF, JPG, PNG.',
      'cf.upErr': 'The upload failed. Check your connection and try again.', 'cf.uploaded': 'Document stored in your vault',
      'cf.local': 'Preview mode: your documents stay in this browser. Online, they are stored in your private, protected space.',
      'cf.pReady': '{n}/{t} documents ready', 'cf.pOpen': 'Open the official platform ↗', 'cf.pFields': 'Fields to copy, in order',
      'cf.pDocs': 'Documents to attach', 'cf.pSteps': 'Good to know', 'cf.pDates': 'Dates not to miss', 'cf.pSource': 'Source: {s}, checked on 10/10/2026.',
      'cf.missing': 'Missing: {l}', 'cf.allReady': 'All documents are ready.', 'cf.empty': '—',
      'cf.ai': 'Prepare my texts with AI', 'cf.aiSoon': 'Coming soon: AI will review your details and adapt your plan to each programme, without ever writing for you.',
      'cf.guest': 'Create your free account to fill in your details and upload your documents.', 'cf.back': '← My applications'
    }
  });

  /* ---------- Données ---------- */
  function data() {
    var d = Lerna.dossiers.get(KEY) || {}; d.fiche = d.fiche || {}; d.files = d.files || {};
    /* Pré-remplissage avec ce que LERNA sait déjà (inscription), sans écraser ce que la personne a écrit */
    var me = Lerna.me.get(), U = Lerna.auth.user || {}, f = d.fiche;
    if (f.prenoms === undefined && me.prenom) f.prenoms = me.prenom;
    if (f.nom === undefined && me.nom) f.nom = me.nom;
    if (f.naissance === undefined && me.naissance) f.naissance = String(me.naissance).slice(0, 10);
    if (f.email === undefined && U.email) f.email = U.email;
    return d;
  }
  function persist(d) { if (!Lerna.isLogged()) return false; Lerna.dossiers.save(KEY, d); return true; }
  function fieldsAll() { var a = []; SECTIONS.forEach(function (s) { s.fields.forEach(function (f) { a.push(f); }); }); return a; }
  function stats() {
    var d = data(), all = fieldsAll();
    var filled = all.filter(function (f) { return String(d.fiche[f.id] || '').trim(); }).length;
    var docs = Object.keys(d.files).filter(function (k) { return d.files[k] && d.files[k].length; }).length;
    return { pct: Math.round(filled * 100 / all.length), docs: docs };
  }
  function kb(n) { return n >= 1024 * 1024 ? (n / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko'; }
  function limitTxt(k) { return k >= 1024 ? (k / 1024) + ' Mo' : k + ' Ko'; }

  /* ---------- Fichiers : Supabase Storage (privé) ou IndexedDB en aperçu ---------- */
  var IDB = null;
  function idb() {
    if (IDB) return IDB;
    IDB = new Promise(function (res, rej) {
      var r = indexedDB.open('lerna-coffre', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('f'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return IDB;
  }
  function idbDo(mode, fn) { return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction('f', mode), st = tx.objectStore('f'), q = fn(st); tx.oncomplete = function () { res(q && q.result); }; tx.onerror = function () { rej(tx.error); }; }); }); }
  function live() { var A = Lerna.auth; return A.mode === 'supabase' && A.user && A.sb && A.sb.storage; }
  function putBlob(path, blob) {
    if (live()) return Lerna.auth.sb.storage.from('coffre').upload(Lerna.auth.user.id + '/' + path, blob, { upsert: true, contentType: blob.type }).then(function (r) { if (r.error) throw r.error; return 'sb'; });
    return idbDo('readwrite', function (st) { return st.put(blob, path); }).then(function () { return 'local'; });
  }
  function getUrl(f) {
    if (f.where === 'sb' && live()) return Lerna.auth.sb.storage.from('coffre').createSignedUrl(Lerna.auth.user.id + '/' + f.path, 120).then(function (r) { if (r.error) throw r.error; return r.data.signedUrl; });
    return idbDo('readonly', function (st) { return st.get(f.path); }).then(function (b) { if (!b) throw new Error('missing'); return URL.createObjectURL(b); });
  }
  function delBlob(f) {
    if (f.where === 'sb' && live()) return Lerna.auth.sb.storage.from('coffre').remove([Lerna.auth.user.id + '/' + f.path]);
    return idbDo('readwrite', function (st) { return st.delete(f.path); });
  }
  /* Réduit une image (JPEG) jusqu'à passer sous la limite */
  function shrink(file, maxKB) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, 1600 / Math.max(img.width, img.height)), q = 0.86, tries = 0;
        (function step() {
          var c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            if (!b) return rej(new Error('canvas'));
            if (b.size <= maxKB * 1024 || tries > 14) return res(b);
            tries++; if (q > 0.5) q -= 0.1; else scale *= 0.8; step();
          }, 'image/jpeg', q);
        })();
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }
  /* Nom de fichier propre, comme le demandent les plateformes : NOM_Prenom_Document.ext */
  function cleanName(doc, ext, n) {
    var f = data().fiche, base = [(f.nom || 'NOM').toUpperCase(), f.prenoms ? f.prenoms.split(' ')[0] : 'Prenom', L(doc.l).split(' (')[0]].join('_');
    base = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]+/g, '-').replace(/-+/g, '-').slice(0, 70);
    return base + (n ? '_' + n : '') + '.' + ext;
  }
  function addFile(docId, file) {
    var doc = DOCS.filter(function (x) { return x.id === docId; })[0]; if (!doc || !file) return Promise.resolve(null);
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) { Lerna.toast(t('cf.badType'), 3000); return Promise.resolve(null); }
    var isImg = /^image\//.test(file.type), note = '';
    var prep = isImg && file.size > doc.max * 1024 ? shrink(file, doc.max).then(function (b) { note = t('cf.shrunk', { s: kb(b.size) }); return b; }) : Promise.resolve(file);
    return prep.then(function (blob) {
      if (blob.size > doc.max * 1024) { Lerna.toast(t('cf.tooBig', { s: kb(blob.size), k: limitTxt(doc.max) }), 5200); return null; }
      var d = data(), list = d.files[docId] || [];
      var ext = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
      var name = cleanName(doc, ext, doc.multi ? list.length + 1 : 0);
      var path = docId + '/' + Date.now().toString(36) + '.' + ext;
      return putBlob(path, blob).then(function (where) {
        var entry = { name: name, size: blob.size, type: blob.type, path: path, where: where, at: new Date().toISOString() };
        if (!doc.multi && list[0]) delBlob(list[0]).catch(function () {});
        d.files[docId] = doc.multi ? list.concat([entry]) : [entry];
        persist(d);
        Lerna.sound.play('success'); Lerna.track('vault_upload', docId);
        Lerna.toast(note || t('cf.uploaded'), 2600);
        return entry;
      });
    }).catch(function () { Lerna.toast(t('cf.upErr'), 3200); return null; });
  }
  function removeFile(docId, i) {
    var d = data(), list = d.files[docId] || [], f = list[i]; if (!f) return;
    delBlob(f).catch(function () {});
    list.splice(i, 1); d.files[docId] = list; persist(d);
  }
  function copy(text, btn) {
    var done = function () { if (btn) { var o = btn.innerHTML; btn.innerHTML = t('cf.copied'); Lerna.pop(btn); setTimeout(function () { btn.innerHTML = o; }, 1300); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  }

  /* ---------- Affichage ---------- */
  var view = 'fiche', par = 'eef';
  function country() { return Lerna.country(); }
  function fieldHTML(f, v, withCopy) {
    var input = f.type === 'area'
      ? '<textarea class="textarea" data-cf="' + f.id + '" rows="3"' + (f.max ? ' maxlength="' + f.max + '"' : '') + ' placeholder="' + esc(f.ph ? L(f.ph) : '') + '">' + esc(v || '') + '</textarea>'
      : '<input class="input" data-cf="' + f.id + '" type="' + (f.type || 'text') + '" value="' + esc(v || '') + '" placeholder="' + esc(f.ph ? L(f.ph) : '') + '"' + (f.type === 'tel' ? ' inputmode="tel"' : '') + '>';
    return '<div class="cf-field"><div class="cf-lab"><label>' + esc(L(f.l)) + '</label>' + (withCopy ? '<button type="button" class="cf-copy" data-copy="' + f.id + '">' + Lerna.icon('copy', 'ic-sm') + t('cf.copy') + '</button>' : '') + '</div>' + input +
      (f.max ? '<div class="cf-count" data-count="' + f.id + '">' + String(v || '').length + ' / ' + f.max + '</div>' : '') + '</div>';
  }
  function ficheHTML() {
    var d = data();
    return SECTIONS.map(function (s) {
      return '<section class="card cf-sec"><div class="cf-sec-h"><h3>' + esc(L(s.title)) + '</h3><button type="button" class="cf-copy" data-copysec="' + s.id + '">' + Lerna.icon('copy', 'ic-sm') + t('cf.copyAll') + '</button></div>' +
        (s.hint ? '<p class="small muted" style="margin:-4px 0 10px">' + esc(L(s.hint)) + '</p>' : '') +
        s.fields.map(function (f) { return fieldHTML(f, d.fiche[f.id], true); }).join('') + '</section>';
    }).join('') + '<p class="small muted" id="cfSaved" aria-live="polite"></p>';
  }
  function docRow(doc) {
    var d = data(), list = d.files[doc.id] || [];
    var files = list.map(function (f, i) {
      return '<div class="cf-file">' + Lerna.icon(f.type === 'application/pdf' ? 'file' : 'image', 'ic-sm') + '<span class="nm">' + esc(f.name) + ' <small>' + kb(f.size) + '</small></span>' +
        '<button type="button" class="btn-link" data-view="' + doc.id + ':' + i + '">' + t('cf.view') + '</button><button type="button" class="btn-link muted" data-del="' + doc.id + ':' + i + '">' + t('cf.remove') + '</button></div>';
    }).join('');
    return '<div class="cf-doc' + (list.length ? ' ok' : '') + '"><div class="cf-doc-h"><span class="ck">' + (list.length ? Lerna.icon('check', 'ic-sm') : '') + '</span><div class="grow"><strong>' + esc(L(doc.l)) + '</strong><div class="small muted">' + t('cf.max', { k: limitTxt(doc.max) }) + (doc.hint ? ' · ' + esc(L(doc.hint)) : '') + '</div></div>' +
      '<label class="btn btn-ghost btn-sm cf-up">' + Lerna.icon('upload', 'ic-sm') + t(list.length ? (doc.multi ? 'cf.add' : 'cf.replace') : 'cf.upload') + '<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-up="' + doc.id + '" hidden></label></div>' + files + '</div>';
  }
  function docsHTML(ids) {
    var list = ids ? DOCS.filter(function (x) { return ids.indexOf(x.id) !== -1; }) : DOCS;
    return (live() ? '' : '<div class="notice" style="margin-bottom:12px">' + Lerna.icon('info') + '<div>' + t('cf.local') + '</div></div>') +
      '<div class="cf-docs">' + list.map(docRow).join('') + '</div>';
  }
  function parcoursHTML() {
    var p = PARCOURS.filter(function (x) { return x.id === par; })[0] || PARCOURS[0], d = data();
    var ready = p.docs.filter(function (k) { return (d.files[k] || []).length; });
    var missing = p.docs.filter(function (k) { return !(d.files[k] || []).length; }).map(function (k) { return L(DOCS.filter(function (x) { return x.id === k; })[0].l); });
    var dates = (p.dates[country()] || p.dates._ || []).filter(function (x) { return Lerna.daysUntil(x[0]) >= 0; });
    var h = '<div class="cf-pick">' + PARCOURS.map(function (x) { return '<button type="button" class="chip' + (x.id === p.id ? ' active' : '') + '" data-par="' + x.id + '">' + esc(L(x.title)) + '</button>'; }).join('') + '</div>' +
      '<section class="card cf-par"><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3>' + esc(L(p.title)) + '</h3><p class="small muted">' + esc(L(p.sub)) + '</p></div>' +
      (p.url ? '<a class="btn btn-primary btn-sm" href="' + esc(p.url) + '"' + (/^https?:/.test(p.url) ? ' target="_blank" rel="noopener"' : '') + '>' + (/^https?:/.test(p.url) ? t('cf.pOpen') : esc(L(p.title)) + ' →') + '</a>' : '') + '</div>' +
      '<div class="ds-prog" style="margin-top:14px"><div class="ds-prog-top"><span>' + t('cf.pReady', { n: ready.length, t: p.docs.length }) + '</span><strong>' + Math.round(ready.length * 100 / p.docs.length) + '%</strong></div><div class="bar"><span style="width:' + Math.round(ready.length * 100 / p.docs.length) + '%"></span></div>' +
      '<p class="small" style="margin-top:8px">' + (missing.length ? esc(t('cf.missing', { l: missing.join(', ') })) : t('cf.allReady')) + '</p></div>' +
      (dates.length ? '<h4 class="cf-h4">' + t('cf.pDates') + '</h4><ul class="cf-dates">' + dates.map(function (x) { var n = Lerna.daysUntil(x[0]); return '<li><span class="dt' + (n <= 14 ? ' soon' : '') + '">' + Lerna.fmtDate(x[0]) + '</span>' + esc(L(x[1])) + '</li>'; }).join('') + '</ul>' : '') +
      '<h4 class="cf-h4">' + t('cf.pSteps') + '</h4><ul class="cf-steps">' + p.steps.map(function (s) { return '<li>' + esc(L(s)) + '</li>'; }).join('') + '</ul>' +
      (p.source ? '<p class="small muted">' + t('cf.pSource', { s: esc(p.source) }) + '</p>' : '') + '</section>' +
      '<h4 class="cf-h4">' + t('cf.pFields') + '</h4>' +
      SECTIONS.filter(function (s) { return p.sections.indexOf(s.id) !== -1; }).map(function (s) {
        return '<section class="card cf-sec compact"><div class="cf-sec-h"><h3>' + esc(L(s.title)) + '</h3><button type="button" class="cf-copy" data-copysec="' + s.id + '">' + Lerna.icon('copy', 'ic-sm') + t('cf.copyAll') + '</button></div>' +
          s.fields.map(function (f) { var v = d.fiche[f.id]; return '<div class="cf-ro"><span class="k">' + esc(L(f.l)) + '</span><span class="v">' + (v ? esc(v) : '<span class="muted">' + t('cf.empty') + '</span>') + '</span>' + (v ? '<button type="button" class="cf-copy" data-copy="' + f.id + '">' + Lerna.icon('copy', 'ic-sm') + '</button>' : '') + '</div>'; }).join('') + '</section>';
      }).join('') +
      '<h4 class="cf-h4">' + t('cf.pDocs') + '</h4>' + docsHTML(p.docs);
    return h;
  }

  function render(root) {
    var h = '<a class="back" href="dossier.html">' + t('cf.back') + '</a>' +
      '<div class="ds-head">' + Lerna.seal() + '<div style="flex:1;min-width:200px"><h1>' + t('cf.title') + '</h1><p class="muted" style="margin-top:6px">' + t('cf.sub') + '</p></div></div>' +
      '<div class="notice cf-mentor">' + Lerna.icon('shield') + '<div>' + t('cf.mentor') + '</div></div>' +
      (Lerna.isLogged() ? '' : '<div class="notice" style="margin-top:12px">' + Lerna.icon('lock') + '<div>' + t('cf.guest') + ' <a class="orange bold" href="#" id="cfGuest">' + t('ds.guestBtn') + ' →</a></div></div>') +
      '<div class="tabs-wrap"><div class="tabs" role="tablist">' + [['fiche', 'cf.tFiche', 'user'], ['docs', 'cf.tDocs', 'file'], ['parcours', 'cf.tParcours', 'check']].map(function (x) {
        return '<button type="button" class="tab' + (x[0] === view ? ' active' : '') + '" data-cfv="' + x[0] + '">' + Lerna.icon(x[2], 'ic-sm') + t(x[1]) + '</button>';
      }).join('') + '</div></div><div class="panel" id="cfPanel">' + (view === 'fiche' ? ficheHTML() : view === 'docs' ? docsHTML() : parcoursHTML()) + '</div>';
    root.innerHTML = h;
  }

  function guard() { if (Lerna.isLogged()) return true; Lerna.requireAccount({ type: 'coffre' }); return false; }
  var saveLater = Lerna.debounce(function () {
    var d = data();
    Array.prototype.forEach.call(document.querySelectorAll('[data-cf]'), function (el) { d.fiche[el.getAttribute('data-cf')] = el.value; });
    if (persist(d)) { var s = document.getElementById('cfSaved'); if (s) { s.textContent = t('cf.saved') + ' ✓'; setTimeout(function () { s.textContent = ''; }, 1400); } }
  }, 500);

  function bind(root) {
    if (root.__cf) return; root.__cf = true;
    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-cfv]'))) { view = b.getAttribute('data-cfv'); history.replaceState(null, '', 'dossier.html?coffre=1#' + view); render(root); Lerna.sound.play('click'); return; }
      if ((b = e.target.closest('[data-par]'))) { par = b.getAttribute('data-par'); render(root); return; }
      if (e.target.closest('#cfGuest')) { e.preventDefault(); guard(); return; }
      if ((b = e.target.closest('[data-copy]'))) { var v = data().fiche[b.getAttribute('data-copy')]; var inp = root.querySelector('[data-cf="' + b.getAttribute('data-copy') + '"]'); copy(inp ? inp.value : (v || ''), b); return; }
      if ((b = e.target.closest('[data-copysec]'))) {
        var sec = SECTIONS.filter(function (x) { return x.id === b.getAttribute('data-copysec'); })[0], f = data().fiche;
        copy(sec.fields.map(function (x) { return L(x.l) + ' : ' + (f[x.id] || ''); }).join('\n'), b); return;
      }
      if ((b = e.target.closest('[data-view]'))) {
        var p = b.getAttribute('data-view').split(':'), file = (data().files[p[0]] || [])[+p[1]]; if (!file) return;
        var w = window.open('', '_blank');
        getUrl(file).then(function (u) { if (w) w.location = u; else location.href = u; }, function () { if (w) w.close(); Lerna.toast(t('cf.upErr')); });
        return;
      }
      if ((b = e.target.closest('[data-del]'))) { if (!guard()) return; var q = b.getAttribute('data-del').split(':'); removeFile(q[0], +q[1]); render(root); return; }
      if (e.target.closest('.cf-up') && !guard()) { e.preventDefault(); }
    });
    root.addEventListener('change', function (e) {
      var up = e.target.closest('[data-up]'); if (!up || !up.files || !up.files[0]) return;
      if (!guard()) return;
      var lab = up.closest('.cf-up'); if (lab) lab.innerHTML = Lerna.thinking('inline');
      addFile(up.getAttribute('data-up'), up.files[0]).then(function () { render(root); });
    });
    root.addEventListener('input', function (e) {
      var el = e.target.closest('[data-cf]'); if (!el) return;
      if (!Lerna.isLogged()) return;
      var c = root.querySelector('[data-count="' + el.getAttribute('data-cf') + '"]'); if (c) c.textContent = el.value.length + ' / ' + el.getAttribute('maxlength');
      saveLater();
    });
    root.addEventListener('focusin', function (e) { if (e.target.closest('[data-cf]') && !Lerna.isLogged()) { e.target.blur(); guard(); } });
  }

  window.LERNA_COFFRE = {
    stats: stats,
    card: function () {
      var s = stats();
      return '<a class="card card-hover cf-card" href="dossier.html?coffre=1">' + Lerna.seal() + '<div class="grow"><h3>' + t('cf.cardTitle') + '</h3><p class="small muted">' + t('cf.cardSub', { f: s.pct, d: s.docs }) + '</p>' +
        '<div class="bar" style="margin-top:8px"><span style="width:' + s.pct + '%"></span></div></div><span class="btn-link">' + t('cf.open') + '</span></a>';
    },
    open: function (root) {
      var h = (location.hash || '').slice(1); if (['fiche', 'docs', 'parcours'].indexOf(h) !== -1) view = h;
      document.title = t('cf.title') + ' — LERNA';
      render(root); bind(root);
    },
    docs: DOCS, parcours: PARCOURS
  };
})();
