/* ==========================================================================
   LERNA — Copilote de candidature : le « comment faire » de chaque étape, écran par écran.
   Pour chaque étape d'un guide (même identifiant que dans guides.js) :
   - todo     : ce que l'élève fait concrètement sur la plateforme officielle, dans l'ordre
   - mistakes : les erreurs qui font échouer un dossier
   - sn: true : la ligne ne vaut que pour un candidat qui vit au Sénégal (sinon, une ligne générale la remplace)
   LERNA ne demande jamais les mots de passe et ne dépose rien à la place de l'élève.

   Sources officielles vérifiées le 22 octobre 2026 :
   - senegal.campusfrance.org : « Je constitue mon dossier sur Études en France », « Critères d'éligibilité »,
     « Calendrier de la procédure — rentrée 2027-2028 », « Questions fréquemment posées »
   - orientation.campusen.sn (procédure d'orientation des bacheliers, campagne 2026 : 17 août → 13 septembre 2026)
   - anaqsup.sn (habilitations et accréditations)
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en || fr }; }
  function I(fr, en, sn) { var x = T(fr, en); if (sn) x.sn = true; return x; }
  var NOT_SN = T('Les frais, le lieu de paiement et les dates propres à ton pays sont publiés par l’Espace Campus France de ton pays : vérifie-les sur son site avant de payer.',
    'The fees, place of payment and dates for your country are published by your country’s Campus France office: check them on its website before paying.');

  var HOW = {
    /* ---------------- France — Études en France (Campus France) ---------------- */
    'eef-account': {
      todo: [
        I('Ouvre la plateforme Études en France et clique sur « Je m’inscris ».', 'Open the Études en France platform and click “Je m’inscris”.'),
        I('Saisis une adresse email à toi, que tu lis tous les jours : tous les messages (paiement, entretien, réponses) arriveront là.', 'Enter an email address of your own that you read every day: every message (payment, interview, answers) will arrive there.'),
        I('Valide ton compte avec le lien reçu par email (expéditeur « ne-pas-répondre » d’Études en France). Regarde aussi dans les spams.', 'Confirm your account with the link sent by email (sender “ne-pas-répondre” from Études en France). Check your spam folder too.'),
        I('Choisis un mot de passe d’au moins 11 caractères avec une majuscule, des minuscules, un chiffre et un caractère spécial (@ * #). Note-le dans un endroit sûr.', 'Choose a password of at least 11 characters with a capital letter, lower-case letters, a number and a special character (@ * #). Keep it somewhere safe.'),
        I('Ton identifiant de connexion est ton adresse email. LERNA ne te demandera jamais ton mot de passe.', 'Your login is your email address. LERNA will never ask for your password.')
      ],
      mistakes: [
        T('Créer un deuxième compte : un seul compte par candidat. Si tu en as déjà un, connecte-toi ou clique sur « mot de passe oublié ».', 'Creating a second account: one account per applicant. If you already have one, log in or click “forgotten password”.'),
        T('Utiliser l’email d’un proche, d’une agence ou d’un cybercafé : tu rateras les messages importants et tu perds le contrôle de ton dossier.', 'Using the email of a relative, an agency or an internet café: you will miss important messages and lose control of your file.')
      ]
    },
    'eef-file': {
      todo: [
        I('Informations personnelles : photo d’identité scannée de moins de 50 Ko, pièce d’identité, adresse et deux numéros de téléphone.', 'Personal information: ID photo scanned under 50 KB, identity document, address and two phone numbers.'),
        I('Adresse : ne mets pas ton lieu de naissance, mets une adresse proche de l’Espace Campus France où tu veux passer l’entretien (domicile ou lieu d’études).', 'Address: do not enter your place of birth; enter an address near the Campus France office where you want to take the interview (home or place of study).', true),
        I('CV : un fichier de moins de 500 Ko. Prépare-le dans l’onglet « CV » de LERNA, puis enregistre-le en PDF.', 'CV: one file under 500 KB. Prepare it in LERNA’s “CV” tab, then save it as a PDF.'),
        I('Parcours : chaque fichier fait moins de 500 Ko. Tous les documents sont en français, ou traduits par un traducteur assermenté avec l’original joint.', 'Education: each file is under 500 KB. All documents are in French, or translated by a sworn translator with the original attached.'),
        I('Futur bachelier : 4 lignes — bulletins de Seconde, bulletins de Première, certificat de scolarité de l’année en cours, et une ligne « Bac ou équivalent » avec ton certificat d’inscription. Les notes de Terminale et le bac s’ajoutent plus tard.', 'Future bac holder: 4 lines — Year 11 reports, Year 12 reports, this year’s enrolment certificate, and a “Bac ou équivalent” line with your registration certificate. Final-year grades and the bac are added later.', true),
        I('Déjà dans le supérieur : au moins 4 lignes sur les 3 dernières années — pour le bac : diplôme, relevé et attestation de réussite ; pour chaque année du supérieur : certificat de scolarité (si elle est en cours) ou relevés de notes.', 'Already in higher education: at least 4 lines covering the last 3 years — for the bac: diploma, transcript and pass certificate; for each higher-education year: enrolment certificate (if ongoing) or transcripts.', true),
        I('Ton diplôme du supérieur doit être accrédité par l’ANAQ-Sup pour être accepté.', 'Your higher-education diploma must be accredited by ANAQ-Sup to be accepted.', true),
        I('Langue : le français est ta langue d’enseignement. Un test (TCF de moins de 2 ans, DELF B2 ou DALF) est obligatoire avec un bac arabe L-AR ; sinon, seulement si la formation le demande.', 'Language: French is your language of instruction. A test (TCF under 2 years old, DELF B2 or DALF) is compulsory with an Arabic L-AR bac; otherwise only if the programme asks for it.', true),
        I('Rassemble d’abord tout dans ton coffre LERNA (onglet « Mon coffre ») : tu n’auras plus qu’à copier chaque champ.', 'First gather everything in your LERNA vault (“My vault”): you will only have to copy each field.')
      ],
      mistakes: [
        T('Valider un dossier incomplet : c’est ta responsabilité, et une modification après validation n’est pas garantie.', 'Submitting an incomplete file: it is your responsibility, and changes after submission are not guaranteed.'),
        T('Des fichiers trop lourds ou illisibles (photo floue, page coupée) : scanne à plat, en bonne lumière, puis compresse.', 'Files that are too heavy or unreadable (blurred photo, cut page): scan flat, in good light, then compress.'),
        T('Un document qui n’est pas en français sans traduction assermentée.', 'A document that is not in French without a sworn translation.')
      ]
    },
    'eef-dap': {
      todo: [
        I('Tu peux choisir jusqu’à 7 formations « connectées » à la plateforme. Limites par niveau : 1re année de licence (DAP) : 3 ; écoles d’architecture (DAP jaune) : 2 ; BUT : 7 ; L2, L3 et master : 7.', 'You can choose up to 7 programmes “connected” to the platform. Limits by level: 1st-year bachelor’s (DAP): 3; architecture schools (yellow DAP): 2; BUT: 7; L2, L3 and master’s: 7.', true),
        I('Vérifie que la formation est bien connectée à la plateforme. Sinon, candidate directement auprès de l’école — ou sur Parcoursup pour les BTS, DCG, classes prépa et IFSI — puis complète « Je suis accepté » après ton admission.', 'Check that the programme is connected to the platform. If not, apply directly to the school — or on Parcoursup for BTS, DCG, prep classes and IFSI — then fill in “Je suis accepté” after admission.'),
        I('Une lettre de motivation différente par formation : ton parcours, pourquoi cette formation, ton projet à court et à long terme, ton objectif professionnel et ce que tu apportes. Écris-les dans l’onglet « Lettre ».', 'A different motivation letter for each programme: your background, why this programme, your short- and long-term plans, your career goal and what you bring. Write them in the “Letter” tab.'),
        I('Stratégie : mélange formations ambitieuses et formations accessibles. Regarde le taux d’accès et le profil des admis sur la fiche de chaque formation dans LERNA.', 'Strategy: mix ambitious and accessible programmes. Check the access rate and admitted-student profile on each programme’s profile in LERNA.'),
        I('Valide ton dossier avant le 15 décembre 2026. N’attends pas le dernier jour : la plateforme est saturée et aucune exception n’est faite.', 'Submit your file before 15 December 2026. Do not wait for the last day: the platform is overloaded and no exception is made.')
      ],
      mistakes: [
        T('Obtenir une admission par email, hors plateforme, pour une formation connectée : ton dossier devient inéligible.', 'Getting an admission by email, outside the platform, for a connected programme: your file becomes ineligible.'),
        T('La même lettre copiée-collée pour toutes les formations.', 'The same letter copied and pasted for every programme.'),
        T('Ne choisir que des formations très sélectives.', 'Choosing only very selective programmes.')
      ]
    },
    'eef-pay': {
      todo: [
        I('Attends l’email de demande de paiement. Ne paie rien avant de l’avoir reçu.', 'Wait for the payment request email. Do not pay anything before you receive it.'),
        I('Montant au Sénégal : 85 000 FCFA, non remboursables.', 'Amount in Senegal: 85,000 FCFA, non-refundable.', true),
        I('Paie dans une agence SUNU Bank (ex-BICIS) avec l’autorisation de paiement, ta pièce d’identité et ton numéro de dossier (il commence par « SN » et figure dans tes informations personnelles).', 'Pay at a SUNU Bank branch (formerly BICIS) with the payment authorisation, your ID and your file number (it starts with “SN” and appears in your personal information).', true),
        I('Date limite au Sénégal : 19 décembre 2026.', 'Deadline in Senegal: 19 December 2026.', true),
        I('Paiement pas validé 7 jours après ? Va à l’Espace Campus France le plus proche avec ton reçu, ou écris depuis ton compte.', 'Payment not validated after 7 days? Go to the nearest Campus France office with your receipt, or write from your account.', true),
        I('Garde le reçu : photo dans ton coffre LERNA.', 'Keep the receipt: a photo in your LERNA vault.')
      ],
      mistakes: [
        T('Payer avant d’avoir reçu la demande de paiement.', 'Paying before receiving the payment request.'),
        T('Donner l’argent des frais à un intermédiaire : tu paies toi-même, à la banque indiquée par Campus France.', 'Handing the fee money to an intermediary: you pay yourself, at the bank stated by Campus France.')
      ]
    },
    'eef-interview': {
      todo: [
        I('Si tu reçois l’autorisation de prendre rendez-vous, réserve ton créneau dans les 7 jours.', 'If you are invited to book an interview, book your slot within 7 days.'),
        I('Pas de créneau libre ? De nouveaux créneaux s’ouvrent régulièrement : reviens voir le planning plusieurs fois par jour.', 'No free slot? New slots open regularly: check the planning several times a day.'),
        I('L’entretien a lieu à l’Espace Campus France que tu as choisi. Il porte sur ton parcours, ton projet, le choix de la France et de tes formations, et ton financement.', 'The interview takes place at the Campus France office you chose. It covers your background, your plan, why France and your programmes, and how you will fund your studies.'),
        I('Entraîne-toi à l’oral dans l’onglet « Entretien » : réponds à voix haute, puis demande l’avis de LERNA.', 'Practise out loud in the “Interview” tab: answer aloud, then ask LERNA for feedback.'),
        I('Prends tes documents originaux avec toi au cas où on te les demande.', 'Take your original documents with you in case they are requested.')
      ],
      mistakes: [
        T('Laisser passer les 7 jours sans réserver.', 'Letting the 7 days pass without booking.'),
        T('Réciter un texte appris par cœur : explique ton projet avec tes mots.', 'Reciting a memorised text: explain your plan in your own words.')
      ]
    },
    'eef-answers': {
      todo: [
        I('Les établissements répondent selon leur propre calendrier : surveille ta plateforme et tes emails.', 'Institutions answer on their own calendar: watch your platform and your emails.'),
        I('Confirme la formation que tu choisis sur la plateforme avant le 31 mai 2027.', 'Confirm the programme you choose on the platform before 31 May 2027.'),
        I('Si on te demande des pièces complémentaires ou la vérification de tes originaux : avant le 30 juillet 2027.', 'If you are asked for extra documents or an original-document check: before 30 July 2027.', true),
        I('Coche ton avancement dans l’onglet « Suivi » de LERNA.', 'Tick your progress in LERNA’s “Tracking” tab.')
      ],
      mistakes: [
        T('Oublier de confirmer ton choix : la place peut être perdue.', 'Forgetting to confirm your choice: the place can be lost.')
      ]
    },
    'eef-visa': {
      todo: [
        I('Après l’email de fin de procédure, prends rendez-vous pour le visa. Au Sénégal, la campagne visa va du 15 mai au 27 août 2027.', 'After the end-of-procedure email, book your visa appointment. In Senegal, the visa campaign runs from 15 May to 27 August 2027.', true),
        I('Le visa est délivré uniquement par le consulat : ni Campus France, ni une agence, ni LERNA ne peuvent le garantir.', 'The visa is issued only by the consulate: neither Campus France, an agency nor LERNA can guarantee it.'),
        I('Prépare ta preuve de ressources et ton logement dans l’onglet « Visa ».', 'Prepare your proof of funds and housing in the “Visa” tab.'),
        I('Remplis la demande sur France-Visas avec ton attestation d’admission.', 'Fill in the application on France-Visas with your admission certificate.')
      ],
      mistakes: [
        T('Rater la fenêtre de rendez-vous visa.', 'Missing the visa appointment window.'),
        T('Une preuve de ressources incomplète ou incohérente avec ton budget.', 'Proof of funds that is incomplete or does not match your budget.')
      ]
    },

    /* ---------------- Université publique en Afrique (Sénégal : Campusen) ---------------- */
    'af-platform': {
      todo: [
        I('Au Sénégal, l’orientation dans le public se fait sur orientation.campusen.sn. Campagne 2026 : du 17 août au 13 septembre 2026 ; la suivante a lieu après le bac 2027.', 'In Senegal, public-university placement is done on orientation.campusen.sn. 2026 campaign: 17 August to 13 September 2026; the next one follows the 2027 bac.', true),
        I('Il te faut une adresse email active à ton nom, ton numéro de table du bac, ton année de bac et ta date de naissance.', 'You need an active email address in your name, your bac candidate number, your bac year and your date of birth.', true),
        I('Après ton inscription, tu reçois par email ton INE (identifiant national étudiant) et ton mot de passe ; la connexion se fait avec un code reçu par SMS.', 'After registering, you receive your INE (national student ID) and password by email; login uses a code sent by SMS.', true),
        I('Vérifie ton numéro de téléphone et ton email : ils servent aussi pour les bourses.', 'Check your phone number and email: they are also used for scholarships.', true),
        I('Hors Sénégal : la plateforme du ministère de l’Enseignement supérieur de ton pays ; étudiant étranger : le service des étudiants internationaux de l’université.', 'Outside Senegal: your country’s higher-education ministry platform; international student: the university’s international office.')
      ],
      mistakes: [
        T('Utiliser l’email ou le téléphone de quelqu’un d’autre.', 'Using someone else’s email or phone.'),
        T('S’inscrire le dernier jour.', 'Registering on the last day.')
      ]
    },
    'af-choices': {
      todo: [
        I('Classe tes choix par préférence : le premier est celui que tu veux vraiment, pas seulement le plus sûr.', 'Rank your choices by preference: the first is the one you really want, not only the safest.'),
        I('Répartis tes choix entre plusieurs universités et ISEP pour ne pas rester sans place.', 'Spread your choices across several universities and ISEPs so you are not left without a place.', true),
        I('Valide, puis confirme ton classement. Garde le récépissé PDF reçu par email.', 'Submit, then confirm your ranking. Keep the PDF receipt sent by email.', true)
      ],
      mistakes: [
        T('Ne pas confirmer : un dossier non validé n’est pas traité.', 'Not confirming: an unsubmitted file is not processed.'),
        T('Mettre un seul établissement.', 'Listing only one institution.')
      ]
    },

    /* ---------------- École privée en Afrique : vérifier avant de payer ---------------- */
    'ap-file': {
      todo: [
        I('Avant de déposer ton dossier, demande par écrit le numéro d’agrément de l’école (provisoire « AP » ou définitif « AD »).', 'Before applying, ask the school in writing for its licence number (provisional “AP” or final “AD”).', true),
        I('Cherche l’école dans les décisions d’habilitation de l’ANAQ-Sup (LERNA les affiche sur la fiche de l’école, avec les avis défavorables en rouge).', 'Look the school up in ANAQ-Sup’s approval decisions (LERNA shows them on the school profile, with unfavourable decisions in red).', true),
        I('Vérifie que TA filière est accréditée (ANAQ-Sup ou CAMES) : l’habilitation protège l’école, l’accréditation protège ton diplôme.', 'Check that YOUR programme is accredited (ANAQ-Sup or CAMES): approval covers the school, accreditation covers your degree.', true),
        I('Hors Sénégal : vérifie l’autorisation auprès du ministère de l’Enseignement supérieur de ton pays et la reconnaissance du diplôme (CAMES dans les pays membres).', 'Outside Senegal: check the authorisation with your country’s higher-education ministry and degree recognition (CAMES in member countries).')
      ],
      mistakes: [
        T('Croire un logo ou un « partenariat international » sans preuve écrite.', 'Trusting a logo or an “international partnership” without written proof.')
      ]
    },
    'ap-enrol': {
      todo: [
        I('Demande le montant exact par filière et par année, et le règlement financier (paiement en plusieurs fois, remboursement) avant de payer.', 'Ask for the exact amount per programme and per year, and the financial rules (instalments, refunds) before paying.'),
        I('Paie uniquement au nom de l’école, jamais à un particulier par mobile money, et exige un reçu à chaque paiement.', 'Pay only in the school’s name, never to an individual via mobile money, and get a receipt for every payment.'),
        I('Garde une copie de ton contrat d’inscription et de tes reçus dans ton coffre LERNA.', 'Keep a copy of your enrolment contract and receipts in your LERNA vault.')
      ],
      mistakes: [
        T('Payer toute l’année d’un coup avant d’avoir vérifié l’habilitation.', 'Paying the whole year at once before checking the approval.')
      ]
    }
  };

  /* Lignes à afficher pour le pays de l'élève */
  window.LERNA_HOW = function (stepId, country) {
    var h = HOW[stepId]; if (!h) return null;
    var sn = country === 'SN', todo = h.todo.filter(function (x) { return sn || !x.sn; });
    if (!sn && h.todo.some(function (x) { return x.sn; }) && /^eef-/.test(stepId)) todo.push(NOT_SN);
    return { todo: todo, mistakes: h.mistakes || [] };
  };
  window.LERNA_HOW_SOURCES = 'senegal.campusfrance.org · orientation.campusen.sn · anaqsup.sn';
  window.LERNA_HOW_VERIFIED = '2026-10-22';
})();
