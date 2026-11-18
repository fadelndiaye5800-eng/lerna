/* LERNA — « Les métiers faits pour toi »
   1. Le moteur classe les métiers avec TOUTES les réponses du test (secteurs, matières aimées et difficiles,
      profil, ce qui met à l'aise, objectif, priorités, durée d'études, budget, théorique ou pratique).
   2. Il garde ~40 métiers variés (pas 40 fois le même métier, aucun métier propre à un seul pays).
   3. L'IA lit le profil complet (y compris ce que la personne a écrit) et choisit les 10 qui lui vont vraiment,
      avec un pourcentage honnête (90 % et plus seulement si presque tout colle, 100 % rarissime).
   Le résultat est gardé dans l'appli : il ne se refait que si le test change. */
(function () {
  var KEY = 'lerna_mt_ai', LIM = 'lerna_mt_lim';
  var DOMS = ['business', 'sante', 'tech', 'droit', 'art', 'sciences', 'education', 'ingenierie', 'comm', 'agri'];
  var SUBJ = { maths: ['sciences', 'ingenierie', 'tech', 'business'], physique: ['ingenierie', 'sciences'], svt: ['sante', 'sciences', 'agri'], eco: ['business'], info: ['tech', 'ingenierie'], arts: ['art'], litterature: ['comm', 'droit', 'education'], histoire: ['droit', 'education'], langues: ['comm', 'education'], sport: ['education', 'sante'] };
  var DIFF = { maths: ['sciences', 'ingenierie', 'tech'], physique: ['ingenierie', 'sciences'], svt: ['sante', 'sciences'], eco: ['business'], info: ['tech'], litterature: ['droit', 'comm'], histoire: ['droit'], langues: ['comm'] };
  var STYLE = { creatif: ['art', 'comm'], analytique: ['sciences', 'tech', 'business', 'droit', 'ingenierie', 'sante'], pratique: ['ingenierie', 'agri', 'sante'], humain: ['sante', 'education', 'droit', 'comm'] };
  var TEN = { chiffres: ['sciences', 'tech', 'business', 'ingenierie'], mots: ['comm', 'droit', 'education'], concret: ['ingenierie', 'agri', 'sante', 'art'] };
  var OBJ = { entreprise: ['business', 'art', 'tech', 'comm'], 'grande-entreprise': ['business', 'tech', 'ingenierie', 'comm'], public: ['droit', 'education', 'sante'], recherche: ['sciences', 'education', 'sante'], ong: ['sante', 'education', 'agri', 'droit'], freelance: ['art', 'tech', 'comm', 'business'] };
  var PRIO = { argent: ['business', 'tech', 'ingenierie', 'sante', 'droit'], impact: ['sante', 'education', 'agri', 'droit'], reconnaissance: ['sante', 'droit', 'art'], liberte: ['art', 'tech', 'comm'], famille: ['education', 'sante'], connaissance: ['sciences', 'education', 'sante'] };
  var WANT = { courte: [0, 2], moyenne: [3, 3], longue: [4, 5], 'tres-longue': [5, 8] };
  /* Métiers qui n'existent que dans un seul pays (institutions françaises…) : jamais proposés comme « faits pour toi » */
  var ONE_COUNTRY = /banque de france|education nationale|éducation nationale|assurance maladie|tr[ée]sor public|de l['’][ée]tat\b|pr[ée]fecture|urssaf|\bcaf\b|sncf|ratp|la poste|france travail|p[ôo]le emploi|conseil d['’][ée]tat|cour des comptes|garde r[ée]publicain|\bcrs\b|gendarm|police municipale|des arm[ée]es|territoria|\baesh\b/i;

  function store() { return window.Lerna && Lerna.store; }
  function cap(x) { x = String(x || ''); return x.charAt(0).toUpperCase() + x.slice(1); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function hashStr(s) { var h = 5381; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  /* Ce que la personne a écrit (vision à 10 ans, autre chose à savoir) : les mots longs servent à repérer les métiers qu'elle nomme */
  var STOPW = ' avoir etre faire plus mais pour dans avec sans comme cette celle leurs notre votre entre apres avant toujours pouvoir vouloir aider aimer grand grande travail metier metiers pays monde annee annees personne personnes chose choses vraiment beaucoup aussi encore which would their there about where should could being after before people things really little years world '.split(' ');
  function textWords(txt) {
    var seen = {};
    return norm(txt).split(' ').filter(function (w) { return w.length >= 5 && STOPW.indexOf(w) === -1; })
      .map(function (w) { return w.slice(0, 6); }).filter(function (w) { if (seen[w]) return false; seen[w] = 1; return true; }).slice(0, 30);
  }
  function testDone() { return !!(store() && store().raw('lerna_results')); }
  function answers() { var p = store() ? store().get('lerna_profile', null) : null; return (p && p.answers) || null; }
  function arr(v) { v = Array.isArray(v) ? v : v ? [v] : []; return v.map(function (x) { return typeof x === 'string' ? x : x && (x.id || x.v); }).filter(Boolean); }

  /* Profil : seulement si le test est terminé */
  function profile() {
    if (!testDone()) return null;
    var a = answers(); if (!a) return null;
    var P = {
      doms: arr(a.q15).filter(function (d) { return DOMS.indexOf(d) !== -1; }), subs: arr(a.q6), diff: arr(a.q7).filter(function (x) { return x !== 'aucune'; }),
      style: arr(a.q8)[0] || '', ten: arr(a.q10)[0] || '', obj: arr(a.q12)[0] || '', prio: arr(a.q14), dur: arr(a.q20)[0] || '', budget: arr(a.q17)[0] || '',
      prat: arr(a.q22)[0] || '', level: arr(a.q2)[0] || '', where: arr(a.q13), leave: arr(a.q18)[0] || '', cc: typeof a.q4 === 'string' ? a.q4 : '',
      words: textWords(String(a.q11 || '') + ' ' + String(a.note || ''))
    };
    return P.doms.length || P.subs.length || P.style || P.dur ? P : null;
  }
  function years(m) {
    if (m[3] >= 0) { var y = m[3] <= 1 ? 0 : m[3]; return [y, y]; }
    return { '1': [0, 0], '2': [0, 0], '3': [1, 3], '4': [3, 6], '34': [3, 6] }[m[6]] || null;
  }
  function touches(list, doms) { return (list || []).some(function (d) { return doms.indexOf(d) !== -1; }); }

  /* Score du moteur : chaque réponse du test compte un peu, aucune ne décide seule */
  function score(m, P) {
    if (!P) return 0;
    var doms = m[4] || [], s = 0;
    if (P.doms.length) {
      var hits = P.doms.filter(function (d) { return doms.indexOf(d) !== -1; });
      if (hits.length) s += [3, 2.6, 2.2][Math.min(2, P.doms.indexOf(hits[0]))] + (hits.length > 1 ? 0.4 : 0) - 0.3 * (doms.length - hits.length);   // à cheval sur un secteur non choisi : un peu moins
      else s -= 1;
    }
    var sb = 0; P.subs.forEach(function (x) { if (touches(SUBJ[x], doms)) sb++; });
    s += Math.min(2, sb * 0.7);
    var df = 0; P.diff.forEach(function (x) { if (touches(DIFF[x], doms)) df++; });
    s -= Math.min(2, df) * 0.6;
    if (STYLE[P.style] && touches(STYLE[P.style], doms)) s += 0.8;
    if (TEN[P.ten] && touches(TEN[P.ten], doms)) s += 0.5;
    if (OBJ[P.obj] && touches(OBJ[P.obj], doms)) s += 0.6;
    P.prio.forEach(function (p) { if (touches(PRIO[p], doms)) s += 0.3; });
    var y = years(m), w = WANT[P.dur];
    if (y && w) {
      if (y[0] <= w[1] && y[1] >= w[0]) s += 1;
      else if (y[0] > w[1]) s -= y[0] - w[1] <= 1 ? 0.6 : 1.2;
    }
    if (y && (P.budget === 'gratuit' || P.budget === 'faible') && y[0] >= 5) s -= 0.4;
    if (P.prat === 'pratique' && (touches(['ingenierie', 'agri', 'sante', 'art'], doms) || (y && y[1] <= 2))) s += 0.3;
    if (P.prat === 'theorique' && touches(['sciences', 'droit', 'education'], doms)) s += 0.3;
    if (P.words.length) {   // un métier qu'elle a nommé elle-même
      var tw = ' ' + norm(m[1]) + ' ' + norm(m[5] || ''), wh = 0;
      P.words.forEach(function (w) { if (tw.indexOf(' ' + w) !== -1) wh++; });
      s += Math.min(2, wh);
    }
    if (m[6] === '34' && ['college', 'lycee', 'terminale', 'superieur'].indexOf(P.level) !== -1) s -= 0.3;   // poste de direction : pas un premier métier
    if (m[5]) s += 0.2;          // métier aussi décrit dans la classification internationale
    if (!y) s -= 0.3;            // niveau d'études inconnu : moins sûr
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

  /* ~40 métiers variés : une part pour chaque secteur choisi, puis les meilleurs scores */
  function candidates(IX, P, n) {
    n = n || 40;
    var list = IX.m.filter(function (m) { return (m[4] || []).length && !ONE_COUNTRY.test(m[1]); })
      .map(function (m) { return [score(m, P), m, hashStr(m[0])]; });
    list.sort(function (a, b) { return b[0] - a[0] || (a[2] < b[2] ? -1 : 1); });
    var out = [], used = {}, byGroup = {}, byWord = {};
    function take(x) {
      var m = x[1]; if (used[m[0]]) return false;
      var g = m[7] ? 'i' + String(m[7]).slice(0, 3) : 'r' + String(m[0]).slice(0, 3);
      var w = norm(m[1]).split(' ')[0];
      if ((byGroup[g] || 0) >= 3 || (byWord[w] || 0) >= 3) return false;
      used[m[0]] = 1; byGroup[g] = (byGroup[g] || 0) + 1; byWord[w] = (byWord[w] || 0) + 1; out.push(m); return true;
    }
    var quota = P && P.doms.length ? Math.floor(n * 0.6 / P.doms.length) : 0;
    if (quota) P.doms.forEach(function (d) {
      var k = 0;
      for (var i = 0; i < list.length && k < quota; i++) if ((list[i][1][4] || []).indexOf(d) !== -1 && take(list[i])) k++;
    });
    for (var j = 0; j < list.length && out.length < n; j++) take(list[j]);
    return out.map(function (m) { return { c: m[0], t: cap(m[1]), en: m[5] ? cap(m[5]) : '', l: lvLabel(m), g: groupLabel(IX, m), d: m[4] || [] }; });
  }

  function answersHash() { var a = answers(), r = store() ? store().get('lerna_results', null) : null; return hashStr(JSON.stringify(a || {}) + '|' + ((r && r.date) || '')); }
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
    var body = { answers: labelled(), candidates: candidates(IX, P, 40), lang: Lerna.lang === 'en' ? 'en' : 'fr', did: Lerna.deviceId ? Lerna.deviceId() : '' };
    inflight = Lerna.api('/api/metiers', body, { timeout: 60000 }).then(function (resp) {
      inflight = null;
      var r = resp && resp.ok ? resp.data : null;
      if (!r || !Array.isArray(r.metiers) || !r.metiers.length) {
        var st = resp ? resp.status : 0;
        if (st === 429) { try { store().sset(LIM, answersHash() + today()); } catch (e) {} }
        Lerna.track('metiers_ia', 'err' + st);
        throw Object.assign(new Error((resp && resp.data && resp.data.error) || 'empty'), { status: st });
      }
      var byCode = IX.byCode || {};
      var known = r.metiers.filter(function (x) { return x && byCode[x.c]; }).map(function (x) {
        var m = byCode[x.c];
        return { c: x.c, pct: Math.max(30, Math.min(100, +x.pct || 0)), why: String(x.why || ''), watch: String(x.watch || ''), t: cap(m[1]), en: m[5] ? cap(m[5]) : '' };
      });
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
  /* Pour les pages sans la liste des métiers (résultats du test) */
  var IXp = null;
  function loadIndex() {
    if (!IXp) IXp = fetch('assets/metiers/index.json').then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (j) {
      j.byCode = {}; j.m.forEach(function (m) { j.byCode[m[0]] = m; }); return j;
    }).catch(function (e) { IXp = null; throw e; });
    return IXp;
  }

  window.LernaMetiers = { profile: profile, score: score, candidates: candidates, cached: cached, run: run, pick: pick, years: years, loadIndex: loadIndex, testDone: testDone, busy: function () { return !!inflight; } };
})();
