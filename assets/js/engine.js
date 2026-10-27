/* ==========================================================================
   LERNA — Moteur de correspondance local
   Sert de secours quand l'IA (Claude via /api/analyze) n'est pas joignable,
   et de mode aperçu tant que l'API n'est pas déployée.
   Règles du document maître : budget = variable n°1, mobilité respectée,
   pourquoi toujours expliqué, point faible toujours mentionné.
   ========================================================================== */
(function () {
  'use strict';
  var L = function (o, lang) { return o ? (o[lang] || o.fr) : ''; };

  var BUDGET_MAX = { gratuit: 300, faible: 1500, moyen: 5000, confortable: 15000, premium: Infinity };
  /* Écoles où une aide majeure peut couvrir l'essentiel des frais */
  var AID = {
    mit: { fr: "l'aide financière du MIT (100 % du besoin démontré)", en: "MIT's financial aid (100% of demonstrated need)" },
    utoronto: { fr: 'la bourse Lester B. Pearson', en: 'the Lester B. Pearson scholarship' },
    kaist: { fr: 'les bourses KAIST pour étudiants internationaux', en: 'KAIST scholarships for international students' },
    khalifa: { fr: 'les bourses complètes de Khalifa University', en: "Khalifa University's full scholarships" },
    tsinghua: { fr: 'les bourses du gouvernement chinois (CSC)', en: 'Chinese government (CSC) scholarships' },
    utokyo: { fr: 'la bourse du gouvernement japonais (MEXT)', en: 'the Japanese government (MEXT) scholarship' },
    um6p: { fr: 'les bourses sociales et de mérite de l\'UM6P', en: "UM6P's need- and merit-based scholarships" },
    '2ie': { fr: 'les bourses de partenaires de 2iE', en: "2iE's partner scholarships" },
    ulaval: { fr: "les bourses d'exemption de l'Université Laval", en: "Université Laval's fee-exemption scholarships" },
    sciencespo: { fr: 'les bourses Émile-Boutmy de Sciences Po', en: "Sciences Po's Émile-Boutmy scholarships" }
  };
  var DEST = { europe: 'europe', afrique: 'afrique', canada: 'CA', usa: 'US', asie: 'asie' };
  var LANG_NAME = {
    fr: { fr: 'français', en: 'French' }, en: { fr: 'anglais', en: 'English' }, de: { fr: 'allemand', en: 'German' },
    ar: { fr: 'arabe', en: 'Arabic' }, es: { fr: 'espagnol', en: 'Spanish' }, pt: { fr: 'portugais', en: 'Portuguese' },
    it: { fr: 'italien', en: 'Italian' }, zh: { fr: 'chinois', en: 'Chinese' }, ru: { fr: 'russe', en: 'Russian' },
    tr: { fr: 'turc', en: 'Turkish' }, ja: { fr: 'japonais', en: 'Japanese' }, ko: { fr: 'coréen', en: 'Korean' }
  };
  var LANG_TEST = { en: 'IELTS / TOEFL', fr: 'TCF / DELF', de: 'TestDaF', es: 'DELE', it: 'CILS', pt: 'CELPE-Bras', zh: 'HSK', ja: 'JLPT', ko: 'TOPIK', ru: 'TORFL', tr: 'TÖMER', ar: '' };
  /* Les réponses à choix multiples peuvent arriver en tableau (nouveau format) ou en texte (ancien) */
  function arr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
  function has(v, id) { return arr(v).indexOf(id) !== -1; }
  var PHRASE = {
    q8: { creatif: ['plutôt créatif', 'mostly creative'], analytique: ['plutôt analytique', 'mostly analytical'], mixte: ['à la fois créatif et rigoureux', 'both creative and rigorous'], pratique: ['avant tout pratique', 'practical above all'], humain: ['tourné vers les autres', 'people-oriented'] },
    q9: { seul: ['seul, au calme', 'alone, in quiet'], groupe: ['en groupe', 'in a group'], mix: ['en alternant seul et en groupe', 'switching between solo and group work'] },
    q12: { entreprise: ['créer ta propre entreprise', 'start your own company'], 'grande-entreprise': ['évoluer dans une grande entreprise', 'grow within a large company'], public: ['servir dans la fonction publique', 'serve in the public sector'], recherche: ['faire de la recherche et enseigner', 'do research and teach'], ong: ['avoir un impact social', 'have a social impact'], freelance: ['travailler en freelance', 'work freelance'] },
    q17: { gratuit: ['un budget quasi nul', 'an almost-zero budget'], faible: ['un budget serré ({300} à {1500} par an)', 'a tight budget ({300} to {1500} a year)'], moyen: ['un budget moyen ({1500} à {5000} par an)', 'a medium budget ({1500} to {5000} a year)'], confortable: ['un budget confortable ({5000} à {15000} par an)', 'a comfortable budget ({5000} to {15000} a year)'], premium: ['un budget premium', 'a premium budget'] },
    q17s: { gratuit: ['quasi nul', 'near-zero'], faible: ['serré', 'tight'], moyen: ['moyen', 'medium'], confortable: ['confortable', 'comfortable'], premium: ['premium', 'premium'] },
    q18: { facile: ['la possibilité de partir', 'the freedom to move abroad'], raison: ['une ouverture au départ si ça vaut vraiment le coup', 'openness to moving if it is clearly worth it'], difficile: ['peu de marge pour partir', 'little room to move abroad'], non: ["l'envie de rester dans ton pays", 'the wish to stay in your country'] }
  };
  function ph(q, id, lang) {
    var p = PHRASE[q] && PHRASE[q][id]; if (!p) return '';
    return p[lang === 'en' ? 1 : 0].replace(/\{(\d+)\}/g, function (m, n) { return money(+n, lang); });
  }
  function optLabel(qid, oid, lang) {
    var q = (window.LERNA_QUESTIONS || []).filter(function (x) { return x.id === qid; })[0];
    if (!q || !q.options) return oid;
    var o = q.options.filter(function (x) { return x.id === oid; })[0];
    return o ? L(o.label, lang) : oid;
  }
  function domName(d, lang) {
    var x = (window.LERNA_DOMAINS || []).filter(function (o) { return o.id === d; })[0];
    return x ? L(x.label, lang).toLowerCase() : d;
  }
  var FR_AU = 'CA MA SN CM JP KE NG GH BF BJ ML TG NE GA CG CD RW BI PT BR MX'.split(' '), FR_AUX = 'US AE NL'.split(' '), EN_THE = 'US GB AE NL CD CF'.split(' ');
  function inCountry(code, lang) {
    var n = window.LERNA_COUNTRY_NAME(code, lang);
    if (lang === 'en') return 'in ' + (EN_THE.indexOf(code) !== -1 ? 'the ' : '') + n;
    if (code === 'SG') return 'à ' + n;
    if (FR_AUX.indexOf(code) !== -1) return 'aux ' + n;
    if (FR_AU.indexOf(code) !== -1) return 'au ' + n;
    return 'en ' + n;
  }
  /* Montants en dollars → devise de la personne (FCFA, euro ou dollar) quand core.js est chargé */
  function money(n, lang) {
    if (window.Lerna && Lerna.money) return Lerna.money(n, null, lang);
    if (n === 0) return lang === 'en' ? '$0' : '0 $';
    return lang === 'en' ? '$' + Math.round(n).toLocaleString('en-US') : Math.round(n).toLocaleString('fr-FR') + ' $';
  }
  function listJoin(arr, lang) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + (lang === 'en' ? ' and ' : ' et ') + arr[arr.length - 1];
  }

  function scoreSchool(s, a, lang, relax) {
    var country = a.q4, local = country && s.pays === country;
    var online = s.type === 'online' || s.mode === 'online' || s.mode === 'hybrid';
    var fee = local ? s.frais_local : s.frais_etranger;
    var max = BUDGET_MAX[a.q17] !== undefined ? BUDGET_MAX[a.q17] : Infinity;
    var langs = arr(a.q5).filter(function (x) { return x !== 'autre'; });
    var lvl = a.q5_lvl || {};
    var sectors = Array.isArray(a.q15) ? a.q15 : [];
    var R = [], raw = 0, viaAid = false, over = false, t = lang === 'en' ? 1 : 0;
    var add = function (w, fr, en) { raw += w; if (fr) R.push({ w: w, text: t ? en : fr }); };

    // Langue — exclusion stricte ; « intermédiaire » accepté mais signalé ;
    // « débutant » : aucune école dans cette langue, sauf si elle propose une année de langue avant
    var langNote = '';
    if (langs.length) {
      var common = s.langues.filter(function (l) { return langs.indexOf(l) !== -1; });
      var usable = common.filter(function (l) { return lvl[l] !== 'deb'; });
      var prep = common.filter(function (l) { return lvl[l] === 'deb' && (s.annee_langue || []).indexOf(l) !== -1; });
      if (!usable.length && !prep.length) return null;
      var fluent = usable.filter(function (l) { return lvl[l] !== 'inter'; });
      if (!usable.length) {
        var lp = LANG_NAME[prep[0]] || { fr: prep[0], en: prep[0] };
        raw -= 10;
        langNote = t
          ? 'Classes are in ' + lp.en + ', a language you are just starting: you would first do the language year it offers, then enter the programme.'
          : 'Les cours sont en ' + lp.fr + ', une langue où tu débutes : tu ferais d\'abord l\'année de langue qu\'elle propose, puis la formation.';
      } else if (fluent.length) {
        var ln = LANG_NAME[fluent[0]] || { fr: fluent[0], en: fluent[0] };
        add(8, 'Les cours sont en ' + ln.fr + ', une langue dans laquelle tu es à l\'aise.', 'Classes are in ' + ln.en + ', a language you are fluent in.');
      } else {
        var li = usable[0], lnI = LANG_NAME[li] || { fr: li, en: li }, test = LANG_TEST[li];
        raw -= 6;
        langNote = t
          ? 'Classes are in ' + lnI.en + ', where your level is intermediate: plan a language upgrade' + (test ? ' (' + test + ')' : '') + ' before the start of the year, or look for a bilingual track.'
          : 'Les cours sont en ' + lnI.fr + ', une langue où tu es intermédiaire : prévois une remise à niveau' + (test ? ' (' + test + ')' : '') + ' avant la rentrée, ou cherche un parcours bilingue.';
      }
    }
    // Mobilité — exclusion stricte
    var sameCont = country && window.LERNA_CONTINENT(country) === window.LERNA_CONTINENT(s.pays);
    if (a.q18 === 'non' && !local && !online && !(relax === 2 && sameCont)) return null;
    if (a.q18 === 'difficile' && !local && !online) raw -= 14;
    if (local && (a.q18 === 'non' || a.q18 === 'difficile')) add(16, "Elle est dans ton pays : pas de visa, pas de déménagement à l'étranger.", 'It is in your country: no visa, no moving abroad.');
    if (online && (a.q18 === 'non' || a.q18 === 'difficile')) add(12, "Elle se suit à distance, donc sans quitter ton pays.", 'You can follow it remotely, without leaving your country.');

    // Budget — variable n°1
    var bs = ph('q17s', a.q17, lang);
    /* Frais non publiés sur le site officiel : on n'exclut pas l'école, on le dit franchement */
    if (fee === null || fee === undefined) {
      add(4, 'Ses frais ne sont pas publiés dans une source que LERNA peut lire : regarde-les sur son site officiel avant de décider.', 'Its fees are not published in a source LERNA can read: check them on its official website before deciding.');
    } else if (fee <= max) {
      add(30, fee === 0 ? 'Pas de frais de scolarité : ça colle avec ton budget ' + bs + '.' : 'Ses frais (à partir de ≈ ' + money(fee, 'fr') + ' par an pour toi, selon la filière) entrent dans ton budget ' + bs + '.',
        fee === 0 ? 'No tuition fees: it fits your ' + bs + ' budget.' : 'Its fees (from ≈ ' + money(fee, 'en') + ' a year for you, depending on the programme) fit your ' + bs + ' budget.');
      if (fee <= max * 0.5 && max !== Infinity) raw += 4;
    } else if (AID[s.id] && (has(a.q16, 'bourse') || has(a.q16, 'cherche') || has(a.q16, 'pret'))) {
      viaAid = true;
      add(12, 'Les frais affichés dépassent ton budget, mais ' + AID[s.id].fr + ' peut les couvrir — cohérent avec ta recherche de financement.', 'The listed fees exceed your budget, but ' + AID[s.id].en + ' can cover them — consistent with your search for funding.');
    } else if (fee <= max * 1.4 || relax) {   // niveau 1 : budget dépassé mais proche → pénalisé
      raw -= 18; over = true;
    } else {
      return null;
    }
    if ((has(a.q16, 'bourse') || has(a.q16, 'cherche')) && AID[s.id] && !viaAid) raw += 5;

    // Destination (jusqu'à 2 choix)
    var dests = arr(a.q13), cont = window.LERNA_CONTINENT(s.pays);
    var destHit = s.type !== 'online' && dests.some(function (d) { var x = DEST[d]; return x && (x === s.pays || x === cont); });
    if (has(a.q13, 'pays') && local) add(10, 'Elle te prépare à construire ta vie dans ton pays, comme tu le souhaites.', 'It prepares you to build your life in your country, as you want.');
    else if (destHit) {
      add(12, 'Elle se trouve ' + inCountry(s.pays, 'fr') + ', là où tu veux vivre et travailler plus tard.', 'It is ' + inCountry(s.pays, 'en') + ', where you want to live and work later.');
    } else if (has(a.q13, 'monde') && s.intl >= 3) add(8, "C'est un établissement très international, idéal pour la vie sans frontières que tu veux.", 'It is a highly international institution, ideal for the borderless life you want.');

    // Secteurs
    var matched = s.domaines.filter(function (d) { return sectors.indexOf(d) !== -1; });
    if (matched.length) {
      var names = matched.slice(0, 2).map(function (d) { return domName(d, lang); });
      var one = names.length === 1;
      add(Math.min(18, 7 * matched.length), 'Elle est solide en ' + listJoin(names, 'fr') + (one ? ', un secteur qui t\'attire.' : ', des secteurs qui t\'attirent.'), 'It is strong in ' + listJoin(names, 'en') + (one ? ', a sector that attracts you.' : ', sectors that attract you.'));
    } else if (sectors.length) raw -= 6;
    // Matières aimées → domaines voisins
    var subj = Array.isArray(a.q6) ? a.q6 : [];
    var SUBJ = { maths: ['sciences', 'ingenierie', 'tech', 'business'], physique: ['ingenierie', 'sciences'], svt: ['sante', 'sciences', 'agri'], eco: ['business'], info: ['tech', 'ingenierie'], arts: ['art'], litterature: ['comm', 'droit', 'education'], histoire: ['droit', 'education'], langues: ['comm', 'education'] };
    var sb = 0; subj.forEach(function (x) { (SUBJ[x] || []).forEach(function (d) { if (s.domaines.indexOf(d) !== -1) sb++; }); });
    raw += Math.min(6, sb * 2);

    // Mode d'apprentissage
    if (a.q21 === 'en-ligne') { if (s.mode === 'online') add(18, "La formation se suit en ligne, à ton rythme, comme tu le préfères.", 'The programme is online, at your own pace, as you prefer.'); else if (s.mode === 'hybrid') add(10, 'Elle combine distance et lieux de travail physiques.', 'It combines remote learning with physical study spaces.'); else raw -= 8; }
    if (a.q21 === 'hybride' && online) add(8, 'Elle permet un format en partie à distance, proche du mode hybride que tu veux.', 'It allows a partly remote format, close to the hybrid mode you want.');
    if (a.q21 === 'presentiel' && s.mode === 'online') raw -= 14;

    // Travail pendant les études
    if (a.q19 === 'alternance' && s.alternance) add(10, "L'alternance y est possible : tu peux étudier et être payé par une entreprise.", 'Work-study is possible: you can study and be paid by a company.');
    if (a.q19 === 'oblig' && (s.mode === 'online' || s.alternance)) add(8, 'Son format laisse de la place pour le travail que tu dois mener en parallèle.', 'Its format leaves room for the job you need alongside.');

    // Durée
    var dmin = s.duree[0], dmax = s.duree[1];
    if (a.q20 === 'courte' && dmin <= 2) add(8, 'Elle propose des formations courtes (1 à 2 ans) pour entrer vite sur le marché du travail.', 'It offers short programmes (1 to 2 years) to start working quickly.');
    else if (a.q20 === 'courte') raw -= 5;
    if (a.q20 === 'moyenne' && dmin <= 3 && dmax >= 3) raw += 4;
    if (a.q20 === 'longue' && dmax >= 5) raw += 4;
    if (a.q20 === 'tres-longue' && dmax >= 6) add(6, 'Elle mène jusqu\'aux cursus longs (médecine, doctorat) que tu es prêt à suivre.', 'It leads to the long programmes (medicine, PhD) you are ready for.');

    // Reconnaissance
    if (a.q23 === 'monde' && s.intl >= 3) add(8, 'Son diplôme est reconnu à l\'international, comme tu le veux.', 'Its degree is recognised internationally, as you want.');
    if (a.q23 === 'region' && country && window.LERNA_CONTINENT(country) === window.LERNA_CONTINENT(s.pays)) add(6, 'Ses diplômes sont reconnus dans ta région.', 'Its degrees are recognised in your region.');
    if (a.q23 === 'pays' && local) raw += 6;

    // Vie de campus
    if (a.q25 === 'tres' && s.campus >= 3) add(6, 'La vie de campus y est riche, un point qui compte beaucoup pour toi.', 'Campus life is rich there, which matters a lot to you.');
    if (a.q25 === 'tres' && s.mode === 'online') raw -= 10;
    if (a.q25 === 'pas' && s.mode === 'online') raw += 4;
    if (a.q22 === 'pratique' && (s.alternance || s.mode === 'online')) raw += 3;
    if (a.q12 === 'recherche' && s.intl >= 3) raw += 4;

    return { s: s, raw: raw, reasons: R.sort(function (x, y) { return y.w - x.w; }), fee: fee, local: local, viaAid: viaAid, over: over, langNote: langNote };
  }

  function buildResume(a, lang) {
    var en = lang === 'en';
    var sectors = (Array.isArray(a.q15) ? a.q15 : []).slice(0, 3).map(function (d) { return domName(d, lang); });
    var p1 = en
      ? 'You are ' + (ph('q8', a.q8, lang) || 'curious') + ' and you work best ' + (ph('q9', a.q9, lang) || 'your own way') + '.'
      : 'Tu es ' + (ph('q8', a.q8, lang) || 'curieux') + ' et tu travailles mieux ' + (ph('q9', a.q9, lang) || 'à ta façon') + '.';
    var goal = a.q12 && a.q12 !== 'ne-sais-pas' ? ph('q12', a.q12, lang) : '';
    var p2 = en
      ? (sectors.length ? 'You are drawn to ' + listJoin(sectors, 'en') : 'You are still exploring sectors') + (goal ? ', and you want to ' + goal + '.' : ', and you are still looking for your path — which is exactly why you are here.')
      : (sectors.length ? 'Tu es attiré par ' + listJoin(sectors, 'fr') : 'Tu explores encore les secteurs') + (goal ? ' et tu veux ' + goal + '.' : ', et tu cherches encore ta voie — c\'est exactement pour ça que tu es là.');
    var p3 = en
      ? 'With ' + (ph('q17', a.q17, lang) || 'your budget') + ' and ' + (ph('q18', a.q18, lang) || 'your situation') + ', here is what LERNA found for you.'
      : 'Avec ' + (ph('q17', a.q17, lang) || 'ton budget') + ' et ' + (ph('q18', a.q18, lang) || 'ta situation') + ', voici ce que LERNA a trouvé pour toi.';
    return p1 + ' ' + p2 + ' ' + p3;
  }

  function buildConseil(a, lang) {
    var en = lang === 'en';
    if (has(a.q16, 'cherche') || has(a.q16, 'bourse')) return en ? 'Start spotting scholarships with approaching deadlines now: an application prepared early beats a perfect one sent too late.' : "Commence dès maintenant à repérer les bourses dont la date limite approche : un dossier préparé tôt vaut mieux qu'un dossier parfait envoyé trop tard.";
    if (a.q12 === 'entreprise') return en ? 'Launch one small, concrete project in your first year of study: that is what will speak to investors and recruiters alike.' : "Lance un petit projet concret dès ta première année d'études : c'est ce qui parlera autant aux investisseurs qu'aux recruteurs.";
    if (a.q19 === 'oblig') return en ? 'Check the weekly timetable of each programme before enrolling: with a job you cannot skip, a compact or online schedule changes everything.' : "Regarde le volume horaire de chaque formation avant de t'inscrire : avec un job obligatoire, un emploi du temps compact ou en ligne change tout.";
    if (a.q24 === 'cherche') return en ? 'Find your rhythm before the start of term: try one week of steady daily work, one week of project mode, and keep what works.' : 'Trouve ton rythme avant la rentrée : teste une semaine de travail régulier, une semaine par projets, et garde ce qui marche pour toi.';
    if (a.q11 && String(a.q11).trim().length > 10) return en ? 'What you wrote about your next 10 years is a real compass: keep it and reread it before every important choice.' : 'Ce que tu as écrit sur tes 10 prochaines années est une vraie boussole : garde-le et relis-le avant chaque choix important.';
    return en ? 'Compare the programmes, not just the school names: the right course in a less famous school beats the wrong one in a famous school.' : "Compare les filières, pas seulement les noms d'écoles : la bonne formation dans une école moins connue vaut mieux que la mauvaise dans une école célèbre.";
  }

  function toReco(m, lang) {
    var s = m.s, en = lang === 'en';
    var reasons = m.reasons.map(function (r) { return r.text; });
    if (reasons.length < 3) {
      var f = s.filieres[0];
      reasons.push(en ? 'It offers programmes such as "' + f.nom + '", leading to ' + L(f.debouches, 'en').toLowerCase() + '.' : 'Elle propose par exemple « ' + f.nom + ' », qui mène vers : ' + L(f.debouches, 'fr').toLowerCase() + '.');
    }
    if (reasons.length < 3) reasons.push(L(s.forts[0], lang) + '.');
    var fee = m.fee;
    var feeTxt = fee === null || fee === undefined ? (en ? 'Fees to be confirmed on the official website' : 'Frais à confirmer sur le site officiel')
      : (fee === 0 ? (en ? 'No tuition' : 'Pas de frais de scolarité') : (en ? 'From ≈ ' : 'À partir de ≈ ') + money(fee, lang) + (en ? '/year' : '/an')) + (m.local ? '' : (en ? ' (international)' : ' (étranger)'));
    var pickF = s.faibles.filter(function (f) { return !m.local || !/étranger|international|visa|non-EU|hors UE/i.test(f.fr + ' ' + f.en); })[0] || s.faibles[0];
    var attention = L(pickF, lang);
    if (m.viaAid) attention = (en ? 'Funding depends on a competitive scholarship or aid. ' : "Le financement dépend d'une bourse ou d'une aide compétitive. ") + attention;
    if (m.langNote) attention = m.langNote + ' ' + attention;
    if (m.over) attention = (en ? 'Its fees are above the budget you gave — only consider it with a scholarship. ' : 'Ses frais dépassent le budget que tu as indiqué — à envisager seulement avec une bourse. ') + attention;
    return {
      id: s.id,
      nom: s.nom, pays: window.LERNA_COUNTRY_NAME(s.pays, lang), ville: s.ville,
      type: s.type === 'public' ? (en ? 'Public' : 'Publique') : s.type === 'private' ? (en ? 'Private' : 'Privée') : (en ? 'Online' : 'En ligne'),
      frais: feeTxt,
      score: 0,
      pourquoi: reasons.slice(0, 3),
      points_forts: s.forts.slice(0, 2).map(function (x) { return L(x, lang); }),
      point_attention: attention
    };
  }

  window.LernaEngine = {
    /* Score de compatibilité 0-100 d'une école précise pour ce profil (comparateur) */
    compat: function (schoolId, answers, lang) {
      var s = window.LERNA_SCHOOL(schoolId); if (!s || !answers) return null;
      var m = scoreSchool(s, answers, lang || 'fr', 2);
      if (!m) return 35;
      return Math.max(20, Math.min(96, Math.round(40 + 56 * Math.max(0, m.raw) / 100)));
    },
    match: function (answers, lang, count) {
      lang = lang || 'fr'; count = count || 5;
      var a = answers || {};
      var pool = window.LERNA_SCHOOLS || [];
      var run = function (relax) { return pool.map(function (s) { return scoreSchool(s, a, lang, relax); }).filter(Boolean); };
      var res = run(0);
      [1, 2].forEach(function (level) {
        if (res.length >= count) return;
        var extra = run(level).filter(function (m) { return !res.some(function (r) { return r.s.id === m.s.id; }); });
        res = res.concat(extra.sort(function (x, y) { return y.raw - x.raw; }).slice(0, count - res.length));
      });
      res.sort(function (x, y) { return y.raw - x.raw; });
      // Diversité : éviter 3 écoles du même pays
      var picked = [];
      while (picked.length < count && res.length) {
        res.sort(function (x, y) {
          var px = picked.filter(function (p) { return p.s.pays === x.s.pays; }).length * 9;
          var py = picked.filter(function (p) { return p.s.pays === y.s.pays; }).length * 9;
          return (y.raw - py) - (x.raw - px);
        });
        picked.push(res.shift());
      }
      var top = picked[0] ? picked[0].raw : 1, maxRaw = Math.max(top, 60);
      var recos = picked.map(function (m, i) {
        var r = toReco(m, lang);
        r.score = Math.max(58, Math.min(96, Math.round(62 + 34 * (m.raw / maxRaw)) - i * 2));
        return r;
      });
      return { resume: buildResume(a, lang), recos: recos, conseil: buildConseil(a, lang) };
    }
  };
})();
