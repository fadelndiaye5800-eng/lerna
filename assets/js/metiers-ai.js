/* LERNA — « Les métiers faits pour toi »
   1. Le moteur lit ce que la personne a écrit (vision à 10 ans, autre chose à savoir) : il reconnaît les métiers
      qu'elle nomme (« marketing digital », « développer des applications », « médecin »…) par expressions entières,
      jamais par bouts de mots (« entreprise » ne trouve plus « entrepôt »).
   2. Un seul calcul de compatibilité, le même partout (liste, fiche du métier, résultats) : ce que tu as écrit,
      secteurs, matières aimées et difficiles, profil, durée d'études, objectif et priorités, budget et pratique.
   3. ~50 métiers variés partent à l'IA, avec le % du moteur. L'IA vérifie, classe et explique ; elle peut corriger
      le % de 5 points au plus. Elle n'invente plus de chiffre.
   4. Pour chaque métier : les écoles pour y arriver (d'abord celles des résultats du test).
   Le résultat est gardé dans l'appli : il ne se refait que si le test (ou ce calcul) change. */
(function () {
  var KEY = 'lerna_mt_ai', LIM = 'lerna_mt_lim', CALC = 'v2';
  var DOMS = ['business', 'sante', 'tech', 'droit', 'art', 'sciences', 'education', 'ingenierie', 'comm', 'agri'];
  var SUBJ = { maths: ['sciences', 'ingenierie', 'tech', 'business'], physique: ['ingenierie', 'sciences'], svt: ['sante', 'sciences', 'agri'], eco: ['business'], info: ['tech', 'ingenierie'], arts: ['art'], litterature: ['comm', 'droit', 'education'], histoire: ['droit', 'education'], langues: ['comm', 'education'], sport: ['education', 'sante'] };
  var DIFF = { maths: ['sciences', 'ingenierie', 'tech'], physique: ['ingenierie', 'sciences'], svt: ['sante', 'sciences'], eco: ['business'], info: ['tech'], litterature: ['droit', 'comm'], histoire: ['droit'], langues: ['comm'] };
  var STYLE = { creatif: ['art', 'comm'], analytique: ['sciences', 'tech', 'business', 'droit', 'ingenierie', 'sante'], pratique: ['ingenierie', 'agri', 'sante'], humain: ['sante', 'education', 'droit', 'comm'] };
  var TEN = { chiffres: ['sciences', 'tech', 'business', 'ingenierie'], mots: ['comm', 'droit', 'education'], concret: ['ingenierie', 'agri', 'sante', 'art'] };
  var OBJ = { entreprise: ['business', 'art', 'tech', 'comm'], 'grande-entreprise': ['business', 'tech', 'ingenierie', 'comm'], public: ['droit', 'education', 'sante'], recherche: ['sciences', 'education', 'sante'], ong: ['sante', 'education', 'agri', 'droit'], freelance: ['art', 'tech', 'comm', 'business'] };
  var PRIO = { argent: ['business', 'tech', 'ingenierie', 'sante', 'droit'], impact: ['sante', 'education', 'agri', 'droit'], reconnaissance: ['sante', 'droit', 'art'], liberte: ['art', 'tech', 'comm'], famille: ['education', 'sante'], connaissance: ['sciences', 'education', 'sante'] };
  var WANT = { courte: [0, 2], moyenne: [3, 3], longue: [4, 5], 'tres-longue': [5, 8] };
  var STUDENT = ['college', 'lycee', 'terminale', 'superieur'];
  /* Métiers qui n'existent que dans un seul pays (institutions françaises…) : jamais proposés comme « faits pour toi » */
  var ONE_COUNTRY = /banque de france|education nationale|éducation nationale|assurance maladie|tr[ée]sor public|de l['’][ée]tat\b|pr[ée]fecture|urssaf|\bcaf\b|sncf|ratp|la poste|france travail|p[ôo]le emploi|conseil d['’][ée]tat|cour des comptes|garde r[ée]publicain|\bcrs\b|gendarm|police municipale|des arm[ée]es|territoria|\baesh\b/i;

  /* Ce que la personne écrit → métiers. [expression reconnue, intitulés à chercher, nom affiché, force (2 = métier précis, 1 = domaine large)] */
  var CONCEPTS = [
    [/(propre|mon|ma|creer|creation|lancer|monter|ouvrir|avoir|diriger) (une |un |ma |mon |sa |son |de |d )?(entreprise|boite|business|societe|start ?up|affaire)|entrepreneu|start ?up|chef d entreprise|patron|business ?man|homme d affaires|femme d affaires|own (a |my )?(company|business)|founder/, ['dirigeant d entreprise', 'gerant de societe', 'createur d entreprise'], { fr: 'créer ton entreprise', en: 'starting your own business' }, 2],
    [/marketing (digital|numerique|en ligne|web)|digital marketing|webmarketing|e ?marketing|community manag|reseaux sociaux|social media|traffic manag|growth hack|referencement|e ?commerce|dropshipping|vente en ligne|online (sales|marketing)/, ['marketing digital', 'commercialisation en ligne', 'e commerce', 'community manager', 'charge de communication digitale', 'webmarketeur'], { fr: 'marketing digital', en: 'digital marketing' }, 2],
    [/marketing/, ['marketing'], { fr: 'marketing', en: 'marketing' }, 1],
    [/developp\w* (d |des |de )?(applications?|applis?|logiciels?|sites?|web|mobile)|\bapplications?\b|\bapplis?\b|app mobile|logiciel|\bcoder\b|codeur|programm|developpeu|informatique|sites? web|software|developer|coding|computer science/, ['developpeur d applications', 'developpeur logiciel', 'developpeur web', 'developpeur informatique', 'concepteur de logiciels', 'developpeur', 'software developer'], { fr: 'développement d’applications', en: 'app development' }, 2],
    [/jeux? video|video games?|gaming/, ['developpeur jeux video', 'game designer', 'testeur de jeux'], { fr: 'jeux vidéo', en: 'video games' }, 2],
    [/intelligence artificielle|\bia\b|machine learning|artificial intelligence|deep learning/, ['ingenieur en intelligence artificielle', 'data scientist', 'concepteur de systemes intelligents', 'ingenieur de la connaissance'], { fr: 'intelligence artificielle', en: 'artificial intelligence' }, 2],
    [/\bdata\b|donnees|big data|statisti/, ['data analyst', 'data scientist', 'data engineer', 'statisticien', 'big data'], { fr: 'data', en: 'data' }, 2],
    [/cyber|securite informatique|hack/, ['cybersecurite', 'securite informatique', 'securite des systemes'], { fr: 'cybersécurité', en: 'cybersecurity' }, 2],
    [/medecin|medecine|chirurg|surgeon|physician|\bdoctor\b/, ['medecin generaliste', 'medecin ', 'chirurgien '], { fr: 'médecine', en: 'medicine' }, 2],
    [/pharmac/, ['pharmacien'], { fr: 'pharmacie', en: 'pharmacy' }, 2],
    [/infirmi|\bnurse/, ['infirmier'], { fr: 'soins infirmiers', en: 'nursing' }, 2],
    [/sage ?femme|midwife/, ['sage femme'], { fr: 'sage-femme', en: 'midwifery' }, 2],
    [/dentist|dentaire/, ['chirurgien dentiste'], { fr: 'dentiste', en: 'dentistry' }, 2],
    [/kine/, ['masseur kinesitherapeute'], { fr: 'kinésithérapie', en: 'physiotherapy' }, 2],
    [/psycholog/, ['psychologue'], { fr: 'psychologie', en: 'psychology' }, 2],
    [/veterinai/, ['veterinaire'], { fr: 'vétérinaire', en: 'veterinary' }, 2],
    [/avocat|lawyer|attorney|barreau/, ['avocat'], { fr: 'avocat', en: 'lawyer' }, 2],
    [/juriste|juridique|faire du droit|etudes? de droit|en droit|droit des affaires|\blaw\b|legal/, ['juriste', 'avocat', 'magistrat', 'notaire'], { fr: 'droit', en: 'law' }, 1],
    [/magistrat|\bjuge\b|\bjudge/, ['juge', 'magistrat', 'procureur'], { fr: 'magistrature', en: 'judiciary' }, 2],
    [/notaire/, ['notaire'], { fr: 'notariat', en: 'notary' }, 2],
    [/expert ?comptable|comptab|accountant|accounting|\baudit/, ['expert comptable', 'comptable', 'auditeur', 'controleur de gestion'], { fr: 'comptabilité et audit', en: 'accounting and audit' }, 2],
    [/\bfinance\b|\bfinances\b|analyste financier|banque|banquier|\bbank|trader|trading|bourse|investisseur|investment/, ['analyste financier', 'trader', 'charge d affaires', 'conseiller financier', 'banquier'], { fr: 'finance', en: 'finance' }, 2],
    [/architect/, ['architecte du batiment', 'architecte d interieur', 'architecte'], { fr: 'architecture', en: 'architecture' }, 2],
    [/ingenieu|engineer/, ['ingenieur'], { fr: 'ingénierie', en: 'engineering' }, 1, /software engineer|ingenieur (logiciel|informatique|en informatique|en intelligence)|ai engineer/],
    [/genie civil|\bbtp\b|batiment|construction/, ['ingenieur genie civil', 'conducteur de travaux', 'ingenieur btp'], { fr: 'BTP', en: 'construction' }, 2],
    [/\bpilote\b|pilote de ligne|aviation|aeronaut|\bpilot\b|\bavion/, ['pilote de ligne', 'pilote d avion', 'ingenieur aeronautique'], { fr: 'aviation', en: 'aviation' }, 2],
    [/hotesse de l air|steward|personnel navigant|cabin crew/, ['hotesse de l air', 'steward', 'personnel navigant'], { fr: 'personnel navigant', en: 'cabin crew' }, 2],
    [/diplomat|relations internationales|ambassad|nations unies|\bonu\b|international relations/, ['diplomate', 'relations internationales', 'charge de mission'], { fr: 'relations internationales', en: 'international relations' }, 2],
    [/\bong\b|humanitaire|\bngo/, ['humanitaire', 'chef de projet humanitaire', 'charge de mission'], { fr: 'humanitaire', en: 'humanitarian work' }, 2],
    [/journalis|presentat\w* (tele|tv|radio|journal)|television|\btele\b|\btv\b|radio|reporter/, ['journaliste', 'presentateur', 'animateur radio', 'reporter'], { fr: 'journalisme', en: 'journalism' }, 2],
    [/styliste|\bmode\b|fashion|couture/, ['styliste', 'modeliste', 'createur de mode'], { fr: 'mode', en: 'fashion' }, 2],
    [/graphis|\bdesign|designer/, ['graphiste', 'designer', 'web designer', 'designer graphique'], { fr: 'design', en: 'design' }, 2],
    [/musique|musicien|chanteu|rappeu|\bmusic|singer|beatmak/, ['musicien', 'chanteur', 'compositeur', 'ingenieur du son'], { fr: 'musique', en: 'music' }, 2],
    [/cinema|\bfilms?\b|realisat|acteur|actrice|comedien|\bactor/, ['realisateur', 'comedien', 'monteur', 'cadreur'], { fr: 'cinéma', en: 'film' }, 2],
    [/photograph/, ['photographe'], { fr: 'photographie', en: 'photography' }, 2],
    [/createur de contenu|creer du contenu|content creator|youtub|tiktok|influenc|montage video|videaste|faire des videos/, ['monteur', 'relations avec les influenceurs', 'charge de communication', 'realisateur'], { fr: 'création de contenu', en: 'content creation' }, 2],
    [/enseign|professeur|\bprof\b|teacher|formateur|educat/, ['professeur', 'enseignant', 'formateur'], { fr: 'enseignement', en: 'teaching' }, 2],
    [/agricult|agronom|elevage|agro|\bfarm/, ['agronome', 'ingenieur agronome', 'agriculteur', 'eleveur'], { fr: 'agriculture', en: 'agriculture' }, 2],
    [/protection de l environnement|ecolog|climat|energies? renouvelables?|solaire|environmental/, ['environnement', 'energies renouvelables', 'ingenieur environnement'], { fr: 'environnement', en: 'environment' }, 2],
    [/petrole|\bgaz\b|\bmines?\b|\boil\b/, ['ingenieur petrolier', 'ingenieur des mines', 'energie'], { fr: 'énergie et mines', en: 'energy and mining' }, 2],
    [/\bsport|football|basket|\bcoach|entraineu|athlet/, ['entraineur', 'educateur sportif', 'preparateur physique', 'coach sportif'], { fr: 'sport', en: 'sport' }, 2],
    [/cuisin|restaura|patiss|\bcook/, ['cuisinier', 'chef cuisinier', 'patissier', 'restaurateur'], { fr: 'cuisine', en: 'cooking' }, 2],
    [/hotel|tourism|agence de voyage|travel agent/, ['hotel', 'tourisme', 'agent de voyages', 'guide'], { fr: 'tourisme et hôtellerie', en: 'tourism and hospitality' }, 2],
    [/immobili|real estate/, ['agent immobilier', 'promoteur immobilier', 'negociateur immobilier'], { fr: 'immobilier', en: 'real estate' }, 2],
    [/import ?export|importat|exportat|commerce international|international trade/, ['commerce international', 'import export'], { fr: 'commerce international', en: 'international trade' }, 2],
    [/commerc|\bvente\b|vendre|vendeu|\bsales\b/, ['commercial', 'business developer', 'charge d affaires'], { fr: 'commerce', en: 'sales' }, 1],
    [/logisti|transport|supply chain/, ['logisticien', 'supply chain', 'responsable logistique'], { fr: 'logistique', en: 'logistics' }, 2],
    [/ressources humaines|\brh\b|recrut|human resources/, ['ressources humaines', 'charge de recrutement'], { fr: 'ressources humaines', en: 'human resources' }, 2],
    [/militaire|armee|soldat|officier|\barmy|military/, ['officier', 'militaire'], { fr: 'armée', en: 'the army' }, 2],
    [/police|policier|douan|customs/, ['policier', 'douanier', 'officier de police'], { fr: 'sécurité', en: 'security' }, 2],
    [/mecanicien auto|mecanique auto|garage|automobile|voitures?\b.*repar|repar\w* (de |des )?voitures?/, ['mecanicien automobile', 'electricien automobile', 'technicien automobile', 'carrossier'], { fr: 'mécanique automobile', en: 'car mechanics' }, 2],
    [/mecanic|mecaniq/, ['mecanicien', 'technicien de maintenance'], { fr: 'mécanique', en: 'mechanics' }, 1],
    [/electricien|electroniq|electrotech/, ['electricien', 'electronicien', 'ingenieur electricien'], { fr: 'électricité', en: 'electrical work' }, 2],
    [/chercheu|recherche scientifique|scientifique|\bresearch|physicien|chimiste|biologi/, ['chercheur', 'ingenieur de recherche', 'biologiste', 'chimiste', 'physicien'], { fr: 'recherche', en: 'research' }, 2],
    [/assistant social|travail social|aider les (gens|autres|personnes|enfants)|help people|social worker/, ['assistant de service social', 'educateur specialise', 'conseiller en insertion'], { fr: 'aider les autres', en: 'helping people' }, 1],
    [/traduct|interprete|translator/, ['traducteur', 'interprete'], { fr: 'traduction', en: 'translation' }, 2],
    [/communicat|publicit|relations publiques|evenementiel|advertising/, ['charge de communication', 'publicitaire', 'chef de projet evenementiel', 'relations presse'], { fr: 'communication', en: 'communication' }, 1],
    [/management|gestion de projet|chef de projet|project manag/, ['chef de projet', 'manager'], { fr: 'gestion de projet', en: 'project management' }, 1],
    [/product (owner|manager)|chef de produit/, ['product owner', 'product manager', 'chef de produit'], { fr: 'gestion de produit', en: 'product management' }, 2]
  ];
  /* Mots trop vagues pour désigner un métier à eux seuls */
  var GENERIC = ' entreprise entreprises propre propres afrique africain africaine monde mondial pays aider travailler travail devenir vouloir reussir reussite argent riche famille parents international internationale developpement developper projet projets avenir carriere metier metiers emploi etude etudes ecole universite diplome france senegal europe canada dakar paris grand grande bonne heureux libre liberte important importante plusieurs beaucoup avoir posseder creer lancer ouvrir domaine secteur numerique digital digitale independant independante financierement financiere personnes personne gens chose choses vraiment toujours encore aussi faire etre bien dans avec pour comme leurs notre votre entre apres avant pouvoir aimer annee annees maison voiture voyager voyage voyages stable stabilite millionnaire succes reconnu reconnue respecte which would their there about where should could being after before people things really little years world years company business ';
  var DOM_L = { business: ['business et gestion', 'business and management'], sante: ['santé', 'health'], tech: ['tech et numérique', 'tech and digital'], droit: ['droit', 'law'], art: ['arts et design', 'arts and design'], sciences: ['sciences', 'sciences'], education: ['éducation', 'education'], ingenierie: ['ingénierie', 'engineering'], comm: ['communication', 'communication'], agri: ['agriculture et environnement', 'agriculture and environment'] };

  function store() { return window.Lerna && Lerna.store; }
  function en() { return !!(window.Lerna && Lerna.lang === 'en'); }
  function cap(x) { x = String(x || ''); return x.charAt(0).toUpperCase() + x.slice(1); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function stem(w) { return w.length > 5 ? w.replace(/(es|s|x|e)$/, '') : w; }
  function clean(t) { return norm(String(t || '').replace(/\s*\/\s*[^\s\/]+/g, '')); }
  /* Nom du métier dans un intitulé : le 1er mot, ou le mot qui suit « chef », « responsable », « ingénieur »… */
  var PREFIX = ' chef cheffe responsable assistant assistante technicien technicienne ingenieur agent charge chargee conseiller adjoint aide operateur employe attache delegue inspecteur gestionnaire specialiste consultant expert animateur coordinateur superviseur cadre directeur ';
  var LINK = ' de d du des la le l en et a au aux ';
  /* « Chargé de marketing digital » → « marketing digital » (sans le mot de fonction du début) */
  function coreOf(t) {
    var w = String(t || '').trim().split(' ').filter(Boolean), i = 0;
    if (w.length > 1 && PREFIX.indexOf(' ' + w[0] + ' ') !== -1) { i = 1; while (i < w.length - 1 && LINK.indexOf(' ' + w[i] + ' ') !== -1) i++; }
    return w.slice(i).join(' ');
  }
  function heads(t) {
    var w = String(t || '').trim().split(' ').filter(Boolean); if (!w.length) return [];
    var out = [w[0]];
    if (PREFIX.indexOf(' ' + w[0] + ' ') !== -1) for (var i = 1; i < w.length && i < 4; i++) { if (LINK.indexOf(' ' + w[i] + ' ') === -1) { out.push(w[i]); break; } }
    return out;
  }
  function hashStr(s) { var h = 5381; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function testDone() { return !!(store() && store().raw('lerna_results')); }
  function answers() { var p = store() ? store().get('lerna_profile', null) : null; return (p && p.answers) || null; }
  function arr(v) { v = Array.isArray(v) ? v : v ? [v] : []; return v.map(function (x) { return typeof x === 'string' ? x : x && (x.id || x.v); }).filter(Boolean); }
  function touches(list, doms) { return (list || []).some(function (d) { return doms.indexOf(d) !== -1; }); }

  /* Profil : seulement si le test est terminé */
  function profile() {
    if (!testDone()) return null;
    var a = answers(); if (!a) return null;
    var P = {
      doms: arr(a.q15).filter(function (d) { return DOMS.indexOf(d) !== -1; }), subs: arr(a.q6), diff: arr(a.q7).filter(function (x) { return x !== 'aucune'; }),
      style: arr(a.q8)[0] || '', ten: arr(a.q10)[0] || '', obj: arr(a.q12)[0] || '', prio: arr(a.q14), dur: arr(a.q20)[0] || '', budget: arr(a.q17)[0] || '',
      prat: arr(a.q22)[0] || '', level: arr(a.q2)[0] || '', where: arr(a.q13), leave: arr(a.q18)[0] || '', cc: typeof a.q4 === 'string' ? a.q4 : '',
      text: ' ' + norm(String(a.q11 || '') + ' ' + String(a.note || '')) + ' ', vis: null
    };
    return P.doms.length || P.subs.length || P.style || P.dur ? P : null;
  }
  /* Ce que la personne a écrit : quels métiers elle nomme (une seule fois par liste de métiers) */
  function prepare(P, IX) {
    if (!P || !IX || (P.vis && P.vis.ix === IX)) return P;
    var V = { ix: IX, any: false, hit: {}, doms: [], terms: [] }, txt = P.text || '';
    if (txt.trim().length < 3) { P.vis = V; return P; }
    /* « Mécanicien / Mécanicienne automobile » → « mecanicien automobile » : la forme féminine ne coupe plus l'expression */
    var titles = IX.m.map(function (m) { return [m, ' ' + clean(m[1]) + ' ', m[5] ? ' ' + norm(m[5]) + ' ' : '']; });
    function mark(m, pts, term) { var h = V.hit[m[0]]; if (!h || h.s < pts) V.hit[m[0]] = { s: pts, t: term }; V.any = true; (m[4] || []).forEach(function (d) { if (V.doms.indexOf(d) === -1) V.doms.push(d); }); }
    CONCEPTS.forEach(function (c) {
      if (!c[0].test(txt) || (c[4] && c[4].test(txt))) return;
      var term = c[2][en() ? 'en' : 'fr']; V.terms.push(term);
      c[1].forEach(function (q, qi) {
        var qq = ' ' + q, found = [];
        titles.forEach(function (x) {
          if (ONE_COUNTRY.test(x[0][1])) return;
          var at = x[1].indexOf(qq), ate = x[2] ? x[2].indexOf(qq) : -1;
          if (at === -1 && ate === -1) return;
          var core = ' ' + coreOf(x[1]) + ' ', head = at === 0 || ate === 0 || core.indexOf(qq) === 0, exact = x[1].trim() === q.trim() || core.trim() === q.trim();
          found.push([exact ? 0 : head ? 1 : 2, x[1].length, x[0]]);
        });
        /* Par expression : le métier le plus central d'abord (intitulé exact, puis le plus court) */
        found.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
        found.slice(0, 6).forEach(function (f) {
          var pts = qi === 0 ? [30, 28, 26][f[0]] : [26, 26, 22][f[0]];
          mark(f[2], pts - (c[3] === 1 ? 4 : 0), term);
        });
      });
    });
    /* Un métier écrit tel quel (« vétérinaire », « sommelier »…) : mot entier, et seulement le nom du métier
       (« Avocat d'affaires » oui ; « Responsable d'affaires » non pour le mot « affaires ») */
    /* Le mot doit être un vrai nom de métier : au moins un intitulé commence par lui (« cabinet », « familiale » : non) */
    var idx = {}, first = {};
    titles.forEach(function (x) { var hd = heads(x[1]); if (hd[0]) first[stem(hd[0])] = 1; hd.forEach(function (w) { if (w.length >= 5) { var k = stem(w); (idx[k] = idx[k] || []).push(x[0]); } }); });
    var seen = {};
    txt.split(' ').forEach(function (w) {
      if (w.length < 5 || GENERIC.indexOf(' ' + w + ' ') !== -1) return;
      var k = stem(w); if (seen[k] || !first[k]) return; seen[k] = 1;
      var list = idx[k]; if (!list || list.length > 12) return;
      list.forEach(function (m) { if (!ONE_COUNTRY.test(m[1])) mark(m, 22, w); });
    });
    P.vis = V; return P;
  }
  function years(m) {
    if (m[3] >= 0) { var y = m[3] <= 1 ? 0 : m[3]; return [y, y]; }
    return { '1': [0, 0], '2': [0, 0], '3': [1, 3], '4': [3, 6], '34': [3, 6] }[m[6]] || null;
  }
  /* Le niveau donné par la fiche est souvent un minimum : bac + 2 ouvre aussi la voie jusqu'à bac + 4 */
  function span(m) { var y = years(m); if (!y) return null; return m[3] >= 2 && m[3] < 5 ? [y[0], y[0] + 2] : y; }

  /* Compatibilité (un seul calcul pour toute l'appli). Chaque critère compte en partie ; 100 % n'existe pas. */
  function fit(m, P) {
    var doms = m[4] || [], parts = [], pts = 0, max = 0;
    function add(k, w, got, st, x) { max += w; pts += got; parts.push({ k: k, st: st, x: x || '' }); }
    var V = P.vis;
    if (V && V.any) {
      var h = V.hit[m[0]];
      if (h) add('vision', 30, h.s, 'ok', h.t);
      else if (touches(V.doms, doms)) add('vision', 30, 8, 'mid', V.terms[0] || '');
      else add('vision', 30, 0, 'ko', V.terms[0] || '');
    } else add('vision0', 30, 12, 'mid');   // pas de métier nommé : on est moins sûr, pour tous les métiers
    if (P.doms.length) {
      var hits = P.doms.filter(function (d) { return doms.indexOf(d) !== -1; });
      if (hits.length) add('dom', 20, [20, 18, 16][Math.min(2, P.doms.indexOf(hits[0]))] - (doms.length > hits.length ? 2 : 0), 'ok', hits.join(','));
      else add('dom', 20, 0, 'ko');
    }
    if (P.subs.length || P.diff.length) {
      var sh = P.subs.filter(function (x) { return touches(SUBJ[x], doms); });
      var part = P.subs.length ? Math.min(1, sh.length / Math.min(P.subs.length, 2)) : 0.6;
      var hard = P.diff.filter(function (x) { return touches(DIFF[x], doms); });
      var hardMain = hard.filter(function (x) { return (DIFF[x] || []).indexOf(doms[0]) !== -1; });   // matière difficile au cœur du métier : ça coince ; à côté : à surveiller
      add('subj', 15, Math.max(0, 15 * part - 5 * hardMain.length - 3 * (hard.length - hardMain.length)), hardMain.length ? 'ko' : hard.length || part < 0.5 ? 'mid' : 'ok', hard.length ? 'hard:' + hard.join(',') : sh.join(','));
    }
    if (STYLE[P.style] || TEN[P.ten]) {
      var g = 0, mx = 0;
      if (STYLE[P.style]) { mx += 6; if (touches(STYLE[P.style], doms)) g += 6; else g += 1; }
      if (TEN[P.ten]) { mx += 4; if (touches(TEN[P.ten], doms)) g += 4; else g += 1; }
      add('style', 10, g * 10 / mx, g >= mx * 0.75 ? 'ok' : 'mid', P.style);
    }
    var y = span(m), w = WANT[P.dur];
    if (y && w) {
      if (y[0] <= w[1] && y[1] >= w[0]) add('dur', 10, 10, 'ok');
      else if (y[0] > w[1]) add('dur', 10, y[0] - w[1] <= 1 ? 5 : 0, y[0] - w[1] <= 1 ? 'mid' : 'ko', 'long');
      else add('dur', 10, w[0] - y[1] <= 1 ? 7 : 3, 'mid', 'short');
    }
    if (OBJ[P.obj] || P.prio.length) {
      var o = 0, om = 0;
      if (OBJ[P.obj]) { om += 6; o += touches(OBJ[P.obj], doms) ? 6 : 1.5; }
      if (P.prio.length) { om += 4; o += 4 * P.prio.filter(function (p) { return touches(PRIO[p], doms); }).length / P.prio.length; }
      add('obj', 10, o * 10 / om, o >= om * 0.7 ? 'ok' : 'mid');
    }
    var pr = 0;
    if (P.prat === 'pratique' && (touches(['ingenierie', 'agri', 'sante', 'art'], doms) || (y && y[1] <= 2))) pr += 3;
    else if (P.prat === 'theorique' && touches(['sciences', 'droit', 'education'], doms)) pr += 3;
    else if (P.prat) pr += 1.5;
    if (!(y && (P.budget === 'gratuit' || P.budget === 'faible') && y[0] >= 5)) pr += 2;
    add('prat', 5, pr, pr >= 4 ? 'ok' : 'mid');
    var pct = max ? Math.round(pts * 100 / max) : 0;
    /* 90 % et plus seulement si rien ne coince ; jamais 100 % */
    var ko = parts.filter(function (p) { return p.st === 'ko'; }).length, mid = parts.filter(function (p) { return p.st === 'mid'; }).length;
    pct = Math.max(20, Math.min(pct, ko ? 85 : mid >= 2 ? 92 : 96));
    return { pct: pct, parts: parts };
  }
  /* Ordre « pour ton profil » : la compatibilité, puis ce qui convient à un premier métier */
  function score(m, P) {
    if (!P) return 0;
    var s = fit(m, P).pct, h = P.vis && P.vis.hit[m[0]];
    var student = STUDENT.indexOf(P.level) !== -1;
    if (m[6] === '34' && student) s -= 12;                                             // poste de direction : pas un premier métier
    var y = years(m);
    if (student && P.dur && P.dur !== 'courte' && y && y[1] === 0 && !h) s -= 8;       // sans diplôme alors qu'il veut faire des études
    if (m[5]) s += 0.5;
    if (!y) s -= 2;
    return s;
  }

  /* Libellés envoyés à l'IA (en français) */
  var LV = { 0: 'CAP, BEP ou sans diplôme', 1: 'niveau bac', 2: 'bac + 2', 3: 'bac + 3', 4: 'bac + 4', 5: 'bac + 5', 6: 'bac + 6 et plus', 7: 'bac + 6 et plus', 8: 'doctorat' };
  var SL = { '1': 'sans diplôme particulier', '2': 'fin du secondaire', '3': 'études supérieures courtes (1 à 3 ans)', '4': 'études supérieures longues (3 à 6 ans)', '34': 'études supérieures et expérience (poste de direction)' };
  function lvLabel(m) { return m[3] >= 0 ? (LV[m[3]] || '') : (SL[m[6]] || 'non précisé'); }
  function groupLabel(IX, m) {
    var g = m[7] && IX.isco && IX.isco[m[7]]; if (g) return g[0];
    var d = (IX.domaines || []).filter(function (x) { return x.c === m[2]; })[0]; return d ? d.l : '';
  }
  var PK = { vision: 'ce qu’il a écrit', dom: 'secteurs', subj: 'matières', style: 'profil', dur: 'durée d’études', obj: 'objectif et priorités', prat: 'pratique et budget' };
  function partsLine(parts) { return parts.map(function (p) { return PK[p.k] + ' ' + (p.st === 'ok' ? '✓' : p.st === 'ko' ? '✗' : '~'); }).join(', '); }

  /* ~50 métiers variés : d'abord ceux qu'il a nommés, puis une part pour chaque secteur choisi, puis les meilleurs */
  function candidates(IX, P, n) {
    n = n || 50; prepare(P, IX);
    var V = P && P.vis, student = P && STUDENT.indexOf(P.level) !== -1;
    var list = IX.m.filter(function (m) {
      var h = V && V.hit[m[0]];
      if (ONE_COUNTRY.test(m[1])) return false;
      if (!(m[4] || []).length && !h) return false;
      if (student && m[6] === '34') return false;   // postes de direction : plus tard, avec de l'expérience
      return true;
    }).map(function (m) { return [score(m, P), m, hashStr(m[0])]; });
    list.sort(function (a, b) { return b[0] - a[0] || (a[2] < b[2] ? -1 : 1); });
    var out = [], used = {}, byGroup = {}, byWord = {};
    function take(x, lim) {
      var m = x[1]; if (used[m[0]]) return false;
      var g = m[7] ? 'i' + String(m[7]).slice(0, 3) : 'r' + String(m[0]).slice(0, 3);
      var w = norm(m[1]).split(' ')[0];
      if ((byGroup[g] || 0) >= (lim || 3) || (byWord[w] || 0) >= (lim || 3)) return false;
      used[m[0]] = 1; byGroup[g] = (byGroup[g] || 0) + 1; byWord[w] = (byWord[w] || 0) + 1; out.push(m); return true;
    }
    if (V && V.any) { var k0 = 0; for (var v = 0; v < list.length && k0 < 14; v++) if (V.hit[list[v][1][0]] && take(list[v], 5)) k0++; }   // métiers qu'il a nommés : jusqu'à 5 d'une même famille
    var quota = P && P.doms.length ? Math.floor((n - out.length) * 0.6 / P.doms.length) : 0;
    if (quota) P.doms.forEach(function (d) {
      var k = 0;
      for (var i = 0; i < list.length && k < quota; i++) if ((list[i][1][4] || []).indexOf(d) !== -1 && take(list[i])) k++;
    });
    for (var j = 0; j < list.length && out.length < n; j++) take(list[j]);
    return out.map(function (m) {
      var f = fit(m, P), h = V && V.hit[m[0]];
      return { c: m[0], t: cap(m[1]), en: m[5] ? cap(m[5]) : '', l: lvLabel(m), g: groupLabel(IX, m), d: m[4] || [], p: f.pct, v: h ? String(h.t).slice(0, 60) : '', w: partsLine(f.parts) };
    });
  }

  /* Phrases de secours (quand l'IA n'a pas écrit l'explication d'un métier) : tirées du calcul */
  function autoWhy(m, P) {
    var f = fit(m, P), E = en(), out = { why: '', watch: '' };
    var get = function (k) { return f.parts.filter(function (p) { return p.k === k; })[0]; };
    var v = get('vision'), d = get('dom'), s = get('subj'), du = get('dur');
    if (v && v.st === 'ok') out.why = E ? 'You wrote that you want to go towards ' + v.x + ': this job is right on that path.' : 'Tu as écrit vouloir aller vers : ' + v.x + '. Ce métier est sur ce chemin.';
    else if (d && d.st === 'ok') out.why = (E ? 'It is in a sector you chose (' : 'Il est dans un secteur que tu as choisi (') + d.x.split(',').map(function (k) { return DOM_L[k] ? DOM_L[k][E ? 1 : 0] : k; }).join(', ') + (s && s.st === 'ok' ? (E ? ') and uses subjects you like.' : ') et utilise des matières que tu aimes.') : ').');
    else out.why = E ? 'It matches several of your answers in the test.' : 'Il correspond à plusieurs de tes réponses au test.';
    if (du && du.st !== 'ok' && du.x === 'long') out.watch = E ? 'It usually takes more years of study than you want.' : 'Il demande souvent plus d’années d’études que ce que tu veux.';
    else if (s && s.st === 'ko') out.watch = E ? 'It uses a subject you find difficult.' : 'Il demande une matière que tu trouves difficile.';
    else if (d && d.st === 'ko') out.watch = E ? 'It is not in the sectors you chose.' : 'Il n’est pas dans les secteurs que tu as choisis.';
    else out.watch = E ? 'Read its page to check that the day-to-day work suits you.' : 'Lis sa fiche pour vérifier que le quotidien te plaît.';
    return out;
  }
  function answersHash() { var a = answers(), r = store() ? store().get('lerna_results', null) : null; return hashStr(CALC + JSON.stringify(a || {}) + '|' + ((r && r.date) || '')); }
  function cached() {
    var c = store() ? store().get(KEY, null) : null;
    return c && c.h === answersHash() && Array.isArray(c.metiers) && c.metiers.length ? c : null;
  }
  function labelled() {
    var a = answers() || {}, out = {};
    if (!window.LERNA_QUESTIONS || !window.LERNA_ANSWER_TEXT) return out;
    window.LERNA_QUESTIONS.forEach(function (q) { var txt = window.LERNA_ANSWER_TEXT(q, a, 'fr', q.type === 'single'); if (txt) out[q.id] = String(txt).slice(0, 1500); });
    if (a.note && String(a.note).trim()) out.note = String(a.note).slice(0, 1000);
    return out;
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  var inflight = null;
  /* force : bouton « Réessayer » (sinon, après une limite du jour, on n'insiste pas) */
  function run(IX, force) {
    if (inflight) return inflight;
    var P = profile();
    if (!P) return Promise.reject(Object.assign(new Error('no_test'), { status: 0 }));
    if (!force && store().sget && store().sget(LIM) === answersHash() + today()) return Promise.reject(Object.assign(new Error('daily_limit'), { status: 429 }));
    var body = { kind: 'metiers', answers: labelled(), candidates: candidates(IX, P, 50), lang: Lerna.lang === 'en' ? 'en' : 'fr', did: Lerna.deviceId ? Lerna.deviceId() : '' };
    inflight = Lerna.api('/api/analyze', body, { timeout: 60000 }).then(function (resp) {
      inflight = null;
      var r = resp && resp.ok ? resp.data : null;
      if (!r || !Array.isArray(r.metiers) || !r.metiers.length) {
        var st = resp ? resp.status : 0;
        if (st === 429) { try { store().sset(LIM, answersHash() + today()); } catch (e) {} }
        Lerna.track('metiers_ia', 'err' + st);
        throw Object.assign(new Error((resp && resp.data && resp.data.error) || 'empty'), { status: st });
      }
      var byCode = IX.byCode || {};
      /* Le % reste celui du moteur, à 5 points près (même si une ancienne version du serveur répond) */
      var known = r.metiers.filter(function (x) { return x && byCode[x.c]; }).map(function (x) {
        var m = byCode[x.c], base = fit(m, P).pct, auto = autoWhy(m, P);
        var pct = Math.max(base - 5, Math.min(base + 5, Math.min(97, +x.pct || base)));
        return { c: x.c, pct: pct, why: String(x.why || '') || auto.why, watch: String(x.watch || '') || auto.watch, t: cap(m[1]), en: m[5] ? cap(m[5]) : '', d: m[4] || [], l: m[3] };
      });
      known.sort(function (a, b) { return b.pct - a.pct; });
      if (!known.length) throw Object.assign(new Error('empty'), { status: 0 });
      var res = { h: answersHash(), at: r.at || new Date().toISOString(), lang: r.lang || body.lang, resume: String(r.resume || ''), metiers: known };
      store().set(KEY, res);
      Lerna.track('metiers_ia', 'ok');
      Lerna.emit('lerna:metiers', res);
      return res;
    }, function (e) { inflight = null; throw e; });
    return inflight;
  }
  function pick(code) {
    var c = cached(); if (!c) return null;
    for (var i = 0; i < c.metiers.length; i++) if (c.metiers[i].c === code) return { rank: i + 1, x: c.metiers[i], min: c.metiers[c.metiers.length - 1].pct };
    return null;
  }
  /* % d'un métier pour cette personne : celui de l'analyse s'il est dans ses 10 ; sinon le calcul du moteur, sous le 10e */
  function pctFor(m, P, IX) {
    var a = pick(m[0]); if (a) return { pct: a.x.pct, rank: a.rank, ai: true };
    prepare(P, IX);
    var f = fit(m, P), c = cached(), last = c ? c.metiers[c.metiers.length - 1].pct : 101;
    return { pct: Math.max(20, Math.min(f.pct, last - 1)), parts: f.parts, ai: false };
  }

  /* Écoles pour arriver à un métier : écoles LERNA du bon domaine, d'abord celles des résultats du test (visibles),
     puis les plus compatibles avec le profil (pays, budget, langue) ; la filière est donnée quand elle mène à ce métier */
  var KWS = { business: 'gestion management marketing commerce finance banque comptab audit entrepreneur entreprise economie vente logistique ressources', tech: 'informatique numerique logiciel developpement data reseaux cyber intelligence computer software', sante: 'medecine sante pharmacie soins infirm', droit: 'droit juridique juriste avocat', art: 'art design mode musique cinema architecture graphisme', sciences: 'sciences biologie chimie physique mathematiques recherche', education: 'education enseignement', ingenierie: 'ingenieur ingenierie genie industrie energie construction', comm: 'communication journalisme medias publicite marketing', agri: 'agronomie agriculture environnement' };
  function schoolsFor(job, n) {
    if (!job || !window.LERNA_SCHOOLS) return [];
    var doms = job.d || []; if (!doms.length) return [];
    var a = answers() || {}, res = store() ? store().get('lerna_results', null) : null, mine = {};
    ((res && res.recos) || []).forEach(function (r, i) {
      if (window.Lerna && Lerna.recoAccess && Lerna.recoAccess(i) !== 'open') return;
      var s = window.LERNA_RECO_SCHOOL ? window.LERNA_RECO_SCHOOL(r) : null; if (s) mine[s.id] = 1;
    });
    var words = norm(job.t + ' ' + (job.en || '')).split(' ').filter(function (w) { return w.length >= 5 && GENERIC.indexOf(' ' + w + ' ') === -1; }).map(stem);
    var kw = doms.map(function (d) { return KWS[d] || ''; }).join(' ').split(' ').filter(Boolean);
    var out = window.LERNA_SCHOOLS.filter(function (s) { return touches(s.domaines || [], doms); }).map(function (s) {
      var best = null, bw = 0;
      (s.filieres || []).forEach(function (f) {
        var t = ' ' + norm(f.nom + ' ' + ((f.debouches && f.debouches.fr) || '')) + ' ', w = 0;
        words.forEach(function (x) { if (t.indexOf(' ' + x) !== -1) w += 3; });
        kw.forEach(function (x) { if (t.indexOf(' ' + x) !== -1) w += 1; });
        if (w > bw) { bw = w; best = f; }
      });
      var c = window.LernaEngine && LernaEngine.compat ? (LernaEngine.compat(s.id, a, en() ? 'en' : 'fr') || 0) : 50;
      return { s: s, f: bw ? best : null, k: c + (mine[s.id] ? 30 : 0) + Math.min(12, bw * 2), mine: !!mine[s.id] };
    });
    out.sort(function (x, y) { return y.k - x.k; });
    return out.slice(0, n || 3);
  }
  /* Métiers (parmi ses 10) auxquels mène une école LERNA */
  function jobsForSchool(school, n) {
    var c = cached(); if (!c || !school) return [];
    return c.metiers.filter(function (x) { return touches(school.domaines || [], x.d || []); }).slice(0, n || 3);
  }
  /* Les écoles (data-schools.js + moteur) ne sont chargées que si on en a besoin */
  var schP = null;
  function loadSchools() {
    if (window.LERNA_SCHOOLS && window.LernaEngine) return Promise.resolve();
    if (!schP) schP = (window.LERNA_SCHOOLS ? Promise.resolve() : Lerna.loadScript('assets/js/data-schools.js')).then(function () { return window.LernaEngine ? null : Lerna.loadScript('assets/js/engine.js'); })
      .catch(function (e) { schP = null; throw e; });
    return schP;
  }

  /* Pour les pages sans la liste des métiers (résultats du test) */
  var IXp = null;
  function loadIndex() {
    if (!IXp) IXp = fetch('assets/metiers/index.json').then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (j) {
      j.byCode = {}; j.m.forEach(function (m) { j.byCode[m[0]] = m; }); return j;
    }).catch(function (e) { IXp = null; throw e; });
    return IXp;
  }

  window.LernaMetiers = { profile: profile, prepare: prepare, fit: fit, score: score, candidates: candidates, cached: cached, run: run, pick: pick, pctFor: pctFor, autoWhy: autoWhy,
    schoolsFor: schoolsFor, jobsForSchool: jobsForSchool, loadSchools: loadSchools, years: years, loadIndex: loadIndex, testDone: testDone, busy: function () { return !!inflight; } };
})();
