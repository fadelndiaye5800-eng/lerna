/* ==========================================================================
   LERNA — contenu du jour (accueil personnel « Aujourd'hui »)
   - Missions du jour : 3 petites actions qui font vraiment avancer l'orientation
   - Mot du jour, quiz du jour, bourse du jour (jamais deux fois la même d'affilée)
   Le choix du jour est le même pour tout le monde (on peut en parler entre amis),
   sauf la bourse et les missions, adaptées au profil.
   ========================================================================== */
(function () {
  'use strict';
  function T(fr, en) { return { fr: fr, en: en }; }

  var WORDS = [
    [T('Système LMD', 'LMD system'), T('Licence (3 ans), Master (2 ans), Doctorat (3 ans environ). C’est l’organisation des études en Europe et dans la plupart des pays francophones d’Afrique.', 'Bachelor’s (3 years), Master’s (2 years), Doctorate (about 3 years). This is how studies are organised in Europe and most French-speaking African countries.')],
    [T('Crédits ECTS', 'ECTS credits'), T('Des points qui mesurent ton travail. Une année réussie = 60 crédits, une licence = 180, un master = 120 de plus.', 'Points that measure your workload. One successful year = 60 credits, a bachelor’s = 180, a master’s = 120 more.')],
    [T('Licence / Bachelor', 'Bachelor’s degree'), T('Le premier diplôme universitaire. 3 ans en général, parfois 4 dans les pays anglophones.', 'The first university degree. Usually 3 years, sometimes 4 in English-speaking countries.')],
    [T('Master', 'Master’s degree'), T('2 ans après la licence (bac+5). Il te spécialise et ouvre vers l’expertise ou le doctorat.', '2 years after the bachelor’s. It specialises you and opens the way to expert jobs or a PhD.')],
    [T('Doctorat (PhD)', 'Doctorate (PhD)'), T('Le diplôme de la recherche : environ 3 ans après le master, avec une thèse à écrire et à défendre.', 'The research degree: about 3 years after the master’s, with a thesis to write and defend.')],
    [T('BTS', 'BTS (2-year diploma)'), T('Brevet de technicien supérieur : 2 ans après le bac, très concret, pour entrer vite dans un métier.', 'A French-style 2-year technical diploma after high school: very hands-on, to start a job quickly.')],
    [T('Classe prépa', 'Preparatory class'), T('2 années intensives après le bac pour préparer les concours des grandes écoles.', '2 intensive years after high school to prepare for the entrance exams of top schools.')],
    [T('Grande école', 'Grande école'), T('Établissement très sélectif (ingénieurs, commerce, sciences politiques) qui recrute sur concours ou sur dossier.', 'A highly selective institution (engineering, business, political science) that admits through exams or applications.')],
    [T('Alternance', 'Work-study'), T('Tu alternes cours et travail en entreprise, souvent avec un salaire. Idéal si tu dois gagner ta vie en étudiant.', 'You alternate classes and work in a company, often with a salary. Ideal if you need to earn a living while studying.')],
    [T('Parcoursup', 'Parcoursup'), T('La plateforme française d’admission en première année d’études supérieures pour les bacheliers.', 'The French platform for first-year higher-education admissions after the baccalauréat.')],
    [T('Études en France', 'Études en France'), T('La procédure en ligne de Campus France pour les étudiants de nombreux pays qui veulent étudier en France.', 'Campus France’s online procedure for students from many countries who want to study in France.')],
    [T('TCF / TEF', 'TCF / TEF'), T('Des tests de français reconnus pour les admissions à l’université et certaines démarches d’immigration.', 'French tests recognised for university admissions and some immigration procedures.')],
    [T('DELF / DALF', 'DELF / DALF'), T('Les diplômes officiels de français, du niveau A1 au C2. Ils sont valables à vie.', 'Official French language diplomas, from A1 to C2. They are valid for life.')],
    [T('IELTS / TOEFL', 'IELTS / TOEFL'), T('Les tests d’anglais les plus demandés par les universités anglophones. Prépare-les plusieurs mois avant.', 'The English tests most requested by English-speaking universities. Prepare for them months ahead.')],
    [T('Niveaux A1 à C2', 'Levels A1 to C2'), T('L’échelle européenne des langues. B2 permet en général de suivre des cours, C1 c’est l’aisance.', 'The European language scale. B2 usually lets you follow classes; C1 means fluency.')],
    [T('Bourse d’excellence', 'Merit scholarship'), T('Un financement accordé au mérite : tes notes, ton dossier, ton projet.', 'Funding awarded on merit: your grades, your application, your project.')],
    [T('Bourse sur critères sociaux', 'Need-based scholarship'), T('Un financement accordé selon les revenus de ta famille.', 'Funding awarded according to your family’s income.')],
    [T('Lettre de motivation', 'Motivation letter'), T('Une page qui explique pourquoi toi, pourquoi cette formation, et ce que tu vas y apporter.', 'One page explaining why you, why this programme, and what you will bring to it.')],
    [T('Relevé de notes', 'Transcript'), T('Le document officiel qui liste tes notes. Souvent demandé traduit et certifié pour l’étranger.', 'The official document listing your grades. Often required translated and certified for studying abroad.')],
    [T('Équivalence de diplôme', 'Degree recognition'), T('La reconnaissance officielle de ton diplôme dans un autre pays. La démarche peut être longue : anticipe.', 'Official recognition of your degree in another country. The process can be long: plan ahead.')],
    [T('Visa étudiant', 'Student visa'), T('L’autorisation de séjourner pour étudier. On te demande souvent une admission et une preuve de ressources.', 'Permission to stay to study. You are usually asked for an admission letter and proof of funds.')],
    [T('Preuve de ressources', 'Proof of funds'), T('Le justificatif que tu peux payer ta vie sur place : compte bloqué, garant ou bourse.', 'Evidence that you can pay your living costs: blocked account, sponsor or scholarship.')],
    [T('CAMES', 'CAMES'), T('Le Conseil africain et malgache pour l’enseignement supérieur : il reconnaît les diplômes dans ses pays membres d’Afrique francophone et à Madagascar.', 'The African and Malagasy Council for Higher Education: it recognises degrees across its French-speaking African member countries and Madagascar.')],
    [T('Frais de dossier', 'Application fee'), T('La somme payée pour que ta candidature soit étudiée. En général, elle n’est pas remboursée si tu es refusé.', 'The amount paid to have your application reviewed. It is usually not refunded if you are rejected.')],
    [T('UE (unité d’enseignement)', 'Course unit'), T('Un bloc de cours avec ses crédits. Chaque semestre, tu valides plusieurs UE.', 'A block of courses with its own credits. Each semester you complete several units.')],
    [T('Mention', 'Honours'), T('Assez bien, bien, très bien : la mention récompense tes notes et peut compter pour certaines bourses.', 'Honours reward your grades and can count for some scholarships.')],
    [T('MOOC', 'MOOC'), T('Un cours en ligne ouvert, souvent gratuit. Pratique pour tester une filière avant de t’y engager.', 'An open online course, often free. Handy to try a field before committing to it.')],
    [T('Stage', 'Internship'), T('Une période de travail en entreprise pendant tes études. C’est souvent là que naît ton premier emploi.', 'A period of work in a company during your studies. It is often where your first job comes from.')],
    [T('Erasmus+', 'Erasmus+'), T('Le programme européen d’échanges et de bourses. Certaines universités hors d’Europe y participent via des partenariats.', 'The European exchange and scholarship programme. Some universities outside Europe take part through partnerships.')],
    [T('GPA', 'GPA'), T('La moyenne pondérée sur 4 utilisée aux États-Unis et dans d’autres pays.', 'The weighted grade average out of 4 used in the United States and other countries.')],
    [T('Lettre de recommandation', 'Recommendation letter'), T('Un avis écrit sur toi par un enseignant ou un employeur. Demande-la au moins un mois à l’avance.', 'A written opinion about you from a teacher or employer. Ask for it at least a month ahead.')],
    [T('Année de césure', 'Gap year'), T('Une pause d’un an pour un projet (stage, travail, bénévolat), parfois avec ta place gardée à l’université.', 'A year off for a project (internship, work, volunteering), sometimes with your university place kept.')],
    [T('Passerelle', 'Direct entry'), T('Une admission directe en 2e ou 3e année grâce à un diplôme que tu as déjà.', 'Direct admission into the 2nd or 3rd year thanks to a diploma you already hold.')],
    [T('Bourse complète', 'Full scholarship'), T('Elle couvre les frais de scolarité ET la vie sur place. Une bourse partielle n’en couvre qu’une partie.', 'It covers tuition AND living costs. A partial scholarship covers only part of them.')],
    [T('Prêt étudiant', 'Student loan'), T('De l’argent emprunté pour étudier, à rembourser après. Compare toujours le taux et la date du premier remboursement.', 'Money borrowed to study, repaid later. Always compare the rate and the date of the first repayment.')],
    [T('Formation continue', 'Continuing education'), T('Reprendre des études quand on travaille déjà, souvent le soir, le week-end ou à distance.', 'Going back to study while already working, often evenings, weekends or online.')]
  ];

  /* Quiz : 3 réponses, une seule bonne, et une explication courte */
  function Q(q, a, ok, why) { return { q: q, a: a, ok: ok, why: why }; }
  var QUIZ = [
    Q(T('Combien de crédits ECTS vaut une année d’études réussie ?', 'How many ECTS credits is one successful year worth?'), [T('30', '30'), T('60', '60'), T('120', '120')], 1, T('Une année = 60 crédits, donc une licence de 3 ans = 180.', 'One year = 60 credits, so a 3-year bachelor’s = 180.')),
    Q(T('Dans le système LMD, une licence dure…', 'In the LMD system, a bachelor’s lasts…'), [T('2 ans', '2 years'), T('3 ans', '3 years'), T('5 ans', '5 years')], 1, T('Licence = 3 ans, master = 2 ans de plus.', 'Bachelor’s = 3 years, master’s = 2 more.')),
    Q(T('Le master s’obtient combien d’années après la licence ?', 'How many years after the bachelor’s does a master’s take?'), [T('1 an', '1 year'), T('2 ans', '2 years'), T('4 ans', '4 years')], 1, T('2 ans : c’est le fameux « bac+5 ».', '2 years: the well-known “5 years after high school”.')),
    Q(T('L’IELTS mesure ton niveau en…', 'IELTS measures your level in…'), [T('anglais', 'English'), T('français', 'French'), T('allemand', 'German')], 0, T('L’IELTS et le TOEFL sont des tests d’anglais.', 'IELTS and TOEFL are English tests.')),
    Q(T('Le DELF et le DALF sont des diplômes de…', 'DELF and DALF are diplomas in…'), [T('anglais', 'English'), T('français', 'French'), T('espagnol', 'Spanish')], 1, T('Ce sont les diplômes officiels de français, valables à vie.', 'They are the official French diplomas, valid for life.')),
    Q(T('Sur l’échelle des langues, quel niveau est le plus avancé ?', 'On the language scale, which level is the most advanced?'), [T('B2', 'B2'), T('C2', 'C2'), T('A2', 'A2')], 1, T('L’échelle va de A1 (débutant) à C2 (maîtrise).', 'The scale goes from A1 (beginner) to C2 (mastery).')),
    Q(T('En alternance, tu…', 'In a work-study programme, you…'), [T('étudies seulement à distance', 'only study online'), T('alternes cours et entreprise', 'alternate classes and company work'), T('prends une année de pause', 'take a year off')], 1, T('Et tu es souvent payé par l’entreprise.', 'And the company often pays you.')),
    Q(T('Une bourse « complète » couvre en général…', 'A “full” scholarship usually covers…'), [T('seulement le billet d’avion', 'only the plane ticket'), T('les frais et la vie sur place', 'tuition and living costs'), T('uniquement le logement', 'only housing')], 1, T('Une bourse partielle, elle, n’en couvre qu’une partie.', 'A partial scholarship covers only part of it.')),
    Q(T('Le GPA américain est calculé sur…', 'The American GPA is calculated out of…'), [T('4', '4'), T('10', '10'), T('20', '20')], 0, T('4.0 est la note maximale dans la plupart des universités américaines.', '4.0 is the top score in most American universities.')),
    Q(T('Une « passerelle » te permet de…', 'A “direct entry” route lets you…'), [T('entrer directement en 2e ou 3e année', 'join directly in 2nd or 3rd year'), T('repasser le bac', 'retake the baccalauréat'), T('voyager sans visa', 'travel without a visa')], 0, T('Grâce à un diplôme que tu as déjà.', 'Thanks to a diploma you already hold.')),
    Q(T('Le BTS se prépare en combien d’années après le bac ?', 'How many years after high school does a BTS take?'), [T('2 ans', '2 years'), T('4 ans', '4 years'), T('5 ans', '5 years')], 0, T('2 ans, très concrets, pour entrer vite dans un métier.', '2 very hands-on years to start a job quickly.')),
    Q(T('Une bonne lettre de motivation fait…', 'A good motivation letter is…'), [T('une page', 'one page'), T('cinq pages', 'five pages'), T('dix mots-clés', 'ten keywords')], 0, T('Une page claire et adaptée à chaque formation.', 'One clear page tailored to each programme.')),
    Q(T('Pour étudier à l’étranger, ton relevé de notes doit souvent être…', 'To study abroad, your transcript often needs to be…'), [T('traduit et certifié', 'translated and certified'), T('plastifié', 'laminated'), T('écrit à la main', 'handwritten')], 0, T('Renseigne-toi sur le traducteur agréé demandé par l’école.', 'Check which certified translator the school requires.')),
    Q(T('Les frais de dossier sont en général…', 'Application fees are usually…'), [T('remboursés si tu es refusé', 'refunded if you are rejected'), T('non remboursés même si tu es refusé', 'not refunded even if you are rejected'), T('toujours gratuits', 'always free')], 1, T('Choisis donc tes candidatures avec soin.', 'So choose your applications carefully.')),
    Q(T('Un doctorat dure environ… après le master', 'A PhD takes about… after the master’s'), [T('1 an', '1 year'), T('3 ans', '3 years'), T('8 ans', '8 years')], 1, T('Environ 3 ans, parfois plus selon le pays et le sujet.', 'About 3 years, sometimes more depending on the country and topic.')),
    Q(T('Un MOOC, c’est…', 'A MOOC is…'), [T('un cours en ligne ouvert', 'an open online course'), T('un test d’anglais', 'an English test'), T('un type de visa', 'a type of visa')], 0, T('Souvent gratuit : idéal pour tester une filière.', 'Often free: ideal to try out a field.')),
    Q(T('Pour un visa étudiant, on te demande souvent…', 'For a student visa, you are often asked for…'), [T('une preuve de ressources', 'proof of funds'), T('un permis de conduire', 'a driving licence'), T('un CV vidéo', 'a video CV')], 0, T('Compte bloqué, garant ou bourse.', 'Blocked account, sponsor or scholarship.')),
    Q(T('Le CAMES concerne surtout…', 'CAMES mainly covers…'), [T('l’Afrique francophone et Madagascar', 'French-speaking Africa and Madagascar'), T('l’Asie', 'Asia'), T('l’Amérique du Sud', 'South America')], 0, T('Il reconnaît les diplômes entre ses pays membres.', 'It recognises degrees across its member countries.')),
    Q(T('Une équivalence de diplôme sert à…', 'Degree recognition is used to…'), [T('faire reconnaître ton diplôme dans un autre pays', 'get your degree recognised in another country'), T('obtenir une bourse automatiquement', 'get a scholarship automatically'), T('éviter les examens', 'skip exams')], 0, T('La démarche peut être longue : anticipe.', 'The process can be long: plan ahead.')),
    Q(T('Le TOEFL est un test de…', 'TOEFL is a test of…'), [T('mathématiques', 'mathematics'), T('anglais', 'English'), T('français', 'French')], 1, T('Comme l’IELTS, il est demandé par les universités anglophones.', 'Like IELTS, English-speaking universities ask for it.')),
    Q(T('Une année de césure, c’est…', 'A gap year is…'), [T('une pause d’un an pour un projet', 'a year off for a project'), T('une année redoublée', 'a repeated year'), T('un examen obligatoire', 'a compulsory exam')], 0, T('Stage, travail, bénévolat… pour mûrir ton projet.', 'Internship, work, volunteering… to shape your plans.')),
    Q(T('Dans « LMD », le D veut dire…', 'In “LMD”, the D stands for…'), [T('Diplôme', 'Diploma'), T('Doctorat', 'Doctorate'), T('Durée', 'Duration')], 1, T('Licence, Master, Doctorat.', 'Bachelor’s, Master’s, Doctorate.')),
    Q(T('Avec un niveau B2 dans une langue, tu peux en général…', 'With a B2 level in a language, you can usually…'), [T('suivre des cours dans cette langue', 'follow classes in that language'), T('seulement te présenter', 'only introduce yourself'), T('traduire des contrats', 'translate contracts')], 0, T('Beaucoup d’universités demandent au moins B2.', 'Many universities require at least B2.')),
    Q(T('Erasmus+ est un programme…', 'Erasmus+ is a programme from…'), [T('européen', 'Europe'), T('américain', 'the United States'), T('chinois', 'China')], 0, T('Échanges et bourses entre universités partenaires.', 'Exchanges and grants between partner universities.')),
    Q(T('Le meilleur moment pour chercher une bourse, c’est…', 'The best time to look for a scholarship is…'), [T('plusieurs mois avant la rentrée', 'several months before the start of term'), T('la veille de la rentrée', 'the day before term starts'), T('après l’inscription', 'after enrolling')], 0, T('Beaucoup de bourses ferment 6 à 9 mois avant.', 'Many scholarships close 6 to 9 months before.')),
    Q(T('Une lettre de recommandation est écrite par…', 'A recommendation letter is written by…'), [T('un enseignant ou un employeur', 'a teacher or employer'), T('toi-même', 'yourself'), T('ta famille', 'your family')], 0, T('Demande-la au moins un mois à l’avance.', 'Ask for it at least a month ahead.')),
    Q(T('Pour comparer deux écoles, le plus important est…', 'To compare two schools, the most important thing is…'), [T('la filière et ses débouchés', 'the programme and its career outcomes'), T('la couleur du logo', 'the logo colour'), T('le nombre d’abonnés', 'the number of followers')], 0, T('La bonne filière compte plus que le nom de l’école.', 'The right programme matters more than the school’s name.')),
    Q(T('Une bourse sur critères sociaux dépend surtout…', 'A need-based scholarship mostly depends on…'), [T('des revenus de ta famille', 'your family’s income'), T('de ta taille', 'your height'), T('de ton sport', 'your sport')], 0, T('Les bourses d’excellence, elles, dépendent de tes résultats.', 'Merit scholarships depend on your results.')),
    Q(T('Un stage pendant les études sert surtout à…', 'An internship during your studies mainly helps you…'), [T('gagner de l’expérience', 'gain experience'), T('remplacer les examens', 'replace exams'), T('obtenir un visa', 'get a visa')], 0, T('C’est souvent la porte d’entrée vers le premier emploi.', 'It is often the way into your first job.')),
    Q(T('Un prêt étudiant, c’est de l’argent…', 'A student loan is money…'), [T('à rembourser plus tard', 'to repay later'), T('offert sans condition', 'given with no strings attached'), T('versé par l’école', 'paid by the school')], 0, T('Compare le taux et la date du premier remboursement.', 'Compare the rate and the first repayment date.'))
  ];

  /* Missions : 3 par jour (1, 3 ou 5 selon les Paramètres), choisies selon le profil ; elles se cochent toutes seules quand l'action est faite.
     La prochaine étape de « Mon dossier » devient la première mission. */
  var MISSIONS = [
    { id: 'school1', img: 'school', ev: 'school_view', title: T('Ouvre la fiche de {school}', 'Open the profile of {school}'), ok: function (c) { return !!c.top; } },
    { id: 'explore', img: 'magnifier', ev: 'school_view', title: T('Découvre une école que tu ne connais pas', 'Discover a school you don’t know yet'), href: 'explorer.html', ok: function () { return true; } },
    { id: 'fav', img: 'heart', ev: 'fav_add', title: T('Ajoute une école à tes favoris', 'Add a school to your favourites'), href: 'explorer.html', ok: function () { return true; } },
    { id: 'bourse', img: 'medal', ev: 'opp_save', title: T('Sauvegarde une bourse qui te correspond', 'Save a scholarship that suits you'), href: 'opportunites.html?tab=bourses', ok: function () { return true; } },
    { id: 'stages', img: 'briefcase', ev: 'opps_visit', title: T('Regarde les stages et emplois du moment', 'Look at the latest internships and jobs'), href: 'opportunites.html?tab=stages', ok: function () { return true; } },
    { id: 'chat', img: 'speech', ev: 'chat_msg', title: T('Pose une question à l’assistant LERNA', 'Ask the LERNA assistant a question'), href: 'espace.html#ia', ok: function (c) { return c.logged; } },
    { id: 'track', img: 'clipboard', ev: 'tracker_add', title: T('Ajoute une candidature à ton suivi', 'Add an application to your tracker'), href: 'espace.html#suivi', ok: function (c) { return c.logged && c.premium; } },
    { id: 'compare', img: 'scales', ev: 'compare', title: T('Compare deux de tes écoles', 'Compare two of your schools'), href: 'espace.html#ecoles', ok: function (c) { return c.logged && c.premium && c.favs >= 2; } },
    { id: 'invite', img: 'envelope', ev: 'invite_share', title: T('Invite un ami sur LERNA', 'Invite a friend to LERNA'), href: '#invite', ok: function (c) { return c.logged && !c.unlocked; } },
    { id: 'results', img: 'target', ev: 'results_view', title: T('Relis le point d’attention de ta 1re école', 'Reread the watch-out point of your 1st school'), href: 'resultats.html', ok: function (c) { return !!c.results; } },
    { id: 'account', img: 'unlock', ev: 'signup', title: T('Crée ton compte gratuit pour garder ton parcours', 'Create your free account to keep your journey'), href: 'auth.html?mode=signup&redirect=aujourdhui.html', ok: function (c) { return !c.logged; } }
  ];

  function dayNum(d) { d = d || new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); }
  function rot(arr, n) { return arr[((n % arr.length) + arr.length) % arr.length]; }
  function shuffle(arr, seed) {
    var a = arr.slice(), s = seed || 1;
    for (var i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor((s / 233280) * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  window.LERNA_DAILY = {
    day: dayNum,
    word: function () { var w = rot(WORDS, dayNum()); return { term: w[0], def: w[1] }; },
    quiz: function () { return rot(QUIZ, dayNum() * 7 + 3); },
    /* Missions du jour (stables toute la journée) */
    missions: function (c) {
      var n = dayNum();
      var content = n % 2 ? { id: 'quiz', img: 'puzzle', ev: 'quiz_answer', title: T('Réponds au quiz du jour', 'Answer the quiz of the day'), href: '#quiz' }
                          : { id: 'word', img: 'bulb', ev: 'word_read', title: T('Lis le mot du jour', 'Read the word of the day'), href: '#mot' };
      var pool = shuffle(MISSIONS.filter(function (m) { return m.ok(c); }), n);
      // Un compte à créer passe en premier tant qu'il n'existe pas (c'est ce qui garde le parcours)
      pool.sort(function (a, b) { return (b.id === 'account') - (a.id === 'account'); });
      /* La prochaine étape de « Mon dossier » passe en premier (elle reste la même toute la journée) */
      var first = [];
      if (c.dossier) {
        var dm = c.dossier;
        first.push({ id: 'dossier', img: 'folder', ev: 'dossier_step', needId: dm.school.id + ':' + dm.step.id, href: 'dossier.html?ecole=' + encodeURIComponent(dm.school.id) + '#etapes',
          title: T(dm.school.nom.split(/[—(]/)[0].trim() + ' : ' + dm.step.title.fr, dm.school.nom.split(/[—(]/)[0].trim() + ': ' + dm.step.title.en) });
      }
      var goal = c.goal === 1 || c.goal === 5 ? c.goal : 3;
      var picked = first.concat([content], pool).slice(0, goal);
      return picked.map(function (m) {
        var href = m.href;
        if (m.id === 'school1') href = 'ecole.html?id=' + encodeURIComponent(c.top.id);
        return { id: m.id, img: m.img, ev: m.ev, href: href, title: m.title, needId: m.id === 'school1' ? c.top.id : (m.needId || null), school: m.id === 'school1' ? c.top.nom : '' };
      });
    },
    /* Bourse du jour : ouverte, adaptée au niveau et aux secteurs, jamais la même deux jours de suite */
    bourse: function (answers) {
      var O = window.LERNA_OPPS || [], S = window.LERNA_OPP_STATUS;
      var store = window.Lerna.store, today = window.Lerna.today();
      var seen = store.get('lerna_daily_seen', null) || { d: '', id: null, list: [] };
      var open = O.filter(function (o) { return o.type === 'bourse' && window.LERNA_OPP_VISIBLE(o, false); });
      if (seen.d === today) { var same = open.filter(function (o) { return o.id === seen.id; })[0]; if (same) return same; }
      var a = answers || {}, lv = { college: ['bac', 'tous'], lycee: ['bac', 'tous', 'licence'], terminale: ['bac', 'licence', 'tous'], superieur: ['licence', 'master', 'tous'] }[a.q2];
      var sectors = Array.isArray(a.q15) ? a.q15 : [];
      var score = function (o) {
        var lvs = window.LERNA_OPP_LEVELS(o), doms = window.LERNA_OPP_DOMS(o);
        return (o.masked ? 0 : 4) + (lv && lvs.some(function (k) { return lv.indexOf(k) !== -1; }) ? 3 : 0) + (doms.some(function (d) { return sectors.indexOf(d) !== -1; }) ? 2 : 0) + (window.LERNA_OPP_DEADLINE(o) ? 1 : 0);
      };
      var fresh = open.filter(function (o) { return seen.list.indexOf(o.id) === -1; });
      if (!fresh.length) { seen.list = []; fresh = open; }
      fresh.sort(function (x, y) { return score(y) - score(x); });
      var pick = fresh[0] || null;
      if (pick) { seen.d = today; seen.id = pick.id; seen.list.push(pick.id); seen.list = seen.list.slice(-60); store.set('lerna_daily_seen', seen); }
      return pick;
    }
  };
})();
