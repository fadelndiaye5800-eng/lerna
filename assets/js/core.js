/* ==========================================================================
   LERNA — noyau commun à toutes les pages
   i18n FR/EN · navigation · authentification (Supabase ou mode aperçu local)
   stockage · favoris · sons · toasts · modales
   Aucune clé secrète ici : la config publique vient de /api/config (variables Vercel).
   ========================================================================== */
(function () {
  'use strict';

  var Lerna = window.Lerna = window.Lerna || {};
  var doc = document;
  var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  /* ------------------------------------------------------------------ */
  /* Stockage sûr (navigation privée, quotas…)                           */
  /* ------------------------------------------------------------------ */
  var store = Lerna.store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
    raw: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    sget: function (k, fallback) {
      try { var v = sessionStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    sset: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  Lerna.esc = function (s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  Lerna.qs = function (sel, root) { return (root || doc).querySelector(sel); };
  Lerna.qsa = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };
  /* Paramètres d'URL. Secours : certains hébergements (aperçus intégrés) retirent la query string
     lors d'une navigation interne ; on mémorise donc la query de chaque lien interne cliqué. */
  function pageName(href) { return String(href || '').split('#')[0].split('?')[0].split('/').pop() || 'index.html'; }
  Lerna.param = function (name) {
    try {
      var q = location.search;
      if (!q) q = store.sget('lerna_q_' + pageName(location.pathname), '') || '';
      return new URLSearchParams(q).get(name);
    } catch (e) { return null; }
  };
  Lerna.rememberQuery = function (href) {
    if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
    var page = pageName(href), qi = href.indexOf('?');
    var q = qi === -1 ? '' : href.slice(qi).split('#')[0];
    store.sset('lerna_q_' + page, q);
  };
  Lerna.go = function (href, replace) { Lerna.rememberQuery(href); if (replace) location.replace(href); else location.href = href; };
  Lerna.today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  Lerna.daysUntil = function (iso) {
    if (!iso) return null;
    var t = new Date(iso + (iso.length === 10 ? 'T23:59:59' : ''));
    if (isNaN(t)) return null;
    return Math.ceil((t - new Date()) / 86400000);
  };
  /* ------------------------------------------------------------------ */
  /* Préférences de la personne (Paramètres) — appliquées dès boot.js    */
  /* ------------------------------------------------------------------ */
  var PREF_DEFAULTS = {
    theme: 'default',          // default (= version A crème, version B marron) | auto (comme le téléphone) | light | dark
    textSize: 'normal',        // normal | large
    reduceMotion: false,
    sounds: true, vibrations: true,
    currency: 'auto',          // auto (selon le pays) | XOF | EUR | USD
    location: 'auto',          // auto (pays deviné) | never
    missionsGoal: 3,           // 1, 3 ou 5 missions par jour
    homeHidden: [],            // blocs masqués sur « Aujourd'hui »
    notif: { bourses: true, deadlines: true, mission: true, parcours: true, news: false },
    notifHour: 18, quietStart: 22, quietEnd: 7,
    notifMax: 'day',           // au maximum : 'day' (1 par jour) | '2w' (2 par semaine) | 'week' (1 par semaine)
    profilePublic: false,
    analytics: true            // statistiques d'utilisation anonymes (PostHog)
  };
  var Prefs = Lerna.prefs = {
    all: function () {
      var p = store.get('lerna_prefs', null) || {};
      var out = JSON.parse(JSON.stringify(PREF_DEFAULTS));
      Object.keys(p).forEach(function (k) { out[k] = p[k]; });
      out.notif = Object.assign({}, PREF_DEFAULTS.notif, p.notif || {});
      return out;
    },
    get: function (k) { return Prefs.all()[k]; },
    set: function (k, v) {
      var p = store.get('lerna_prefs', null) || {};
      p[k] = v; store.set('lerna_prefs', p);
      Prefs.apply();
      Lerna.emit('lerna:prefs', { key: k, value: v });
      if (/^notif/.test(k) && Lerna.notify) Lerna.notify.tags();
      if (Lerna.auth && Lerna.auth.mode === 'supabase' && Lerna.auth.user) {
        Lerna.auth.sb.from('users').update({ prefs: p }).eq('id', Lerna.auth.user.id).then(function () {}, function () {});
      }
    },
    /* Thème réellement affiché : clair par défaut ; sombre seulement si la personne le choisit (ou « automatique ») */
    theme: function () {
      var t = Prefs.get('theme');
      if (t === 'dark') return 'dark';
      if (t === 'auto') { try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; } }
      if (t === 'light') return 'light';
      /* Par défaut : version A = crème uni, version B = marron uni (test A/B) */
      return Lerna.ab && Lerna.ab.variant('couleurs') === 'b' ? 'dark' : 'light';
    },
    apply: function () {
      var root = doc.documentElement, th = Prefs.theme(), v = Lerna.ab ? Lerna.ab.variant('couleurs') : 'a';
      root.setAttribute('data-theme', th);
      root.setAttribute('data-variant', v);
      root.setAttribute('data-text', Prefs.get('textSize') === 'large' ? 'large' : 'normal');
      root.toggleAttribute('data-calm', !!Prefs.get('reduceMotion'));
      var m = doc.querySelector('meta[name="theme-color"]');
      if (m && !m.hasAttribute('data-fixed')) m.setAttribute('content', th === 'dark' ? '#2A1607' : '#FBF6EC');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Pays et devise                                                       */
  /* ------------------------------------------------------------------ */
  var UEMOA_CEMAC = 'SN CI ML BF BJ TG NE GW CM GA CG TD CF GQ'.split(' ');
  var EURO = 'FR BE DE ES IT PT NL LU AT IE FI GR SK SI EE LV LT MT CY HR MC AD SM VA ME XK RE GP MQ GF YT PM BL MF'.split(' ');
  /* Taux indicatifs (EUR/USD = 1,1219 le 9 octobre 2026 ; 1 € = 655,957 FCFA, parité fixe). Modifiables depuis /admin. */
  var FX = { USD: 1, EUR: 0.8913, XOF: 584.7, date: '2026-10-09' };
  Lerna.fx = function () { return Object.assign({}, FX, (Lerna.config && Lerna.config.fx) || {}); };
  /* Pays de la personne : réponse au questionnaire > compte > pays deviné (adresse internet ou fuseau horaire) */
  Lerna.country = function () {
    var prof = store.get('lerna_profile', null);
    if (prof && prof.answers && prof.answers.q4) return prof.answers.q4;
    var u = Lerna.auth && Lerna.auth.user;
    if (u && u.pays) return u.pays;
    return Lerna.geoCountry();
  };
  Lerna.geoCountry = function () {
    if (Prefs.get('location') === 'never') return '';
    var g = store.get('lerna_geo', null);
    if (g && g.country) return g.country;
    return window.LERNA_GUESS_COUNTRY ? window.LERNA_GUESS_COUNTRY() : '';
  };
  /* Devine le pays par l'adresse internet (Vercel), sans demander d'autorisation — comme Netflix ou Spotify */
  Lerna.detectCountry = function () {
    if (Prefs.get('location') === 'never') return Promise.resolve('');
    var g = store.get('lerna_geo', null);
    if (g && g.country && Date.now() - g.t < 7 * 864e5) return Promise.resolve(g.country);
    /* /api/config renvoie le pays vu par Vercel (en-tête x-vercel-ip-country) */
    var c = Lerna.config.country;
    if (Lerna.config.live && /^[A-Z]{2}$/.test(c || '')) { store.set('lerna_geo', { country: c, t: Date.now() }); Lerna.emit('lerna:country', c); return Promise.resolve(c); }
    return Promise.resolve(Lerna.geoCountry());
  };
  Lerna.currency = function (country) {
    var c = Prefs.get('currency');
    if (c === 'XOF' || c === 'EUR' || c === 'USD') return c;
    return Lerna.currencyAuto(country);
  };
  /* Devise selon le pays seulement (choix « Automatique » des Paramètres) */
  Lerna.currencyAuto = function (country) {
    var k = country || Lerna.country();
    if (UEMOA_CEMAC.indexOf(k) !== -1) return 'XOF';
    if (EURO.indexOf(k) !== -1) return 'EUR';
    return 'USD';
  };
  /* Montant en dollars → affiché dans la devise de la personne (FCFA, euro ou dollar) */
  Lerna.money = function (n, cur, lng) {
    if (n === null || n === undefined || n === '') return '';
    if (typeof n === 'string') return n;
    var lang = lng || Lerna.lang || 'fr', c = cur || Lerna.currency(), fx = Lerna.fx();
    var loc = lang === 'en' ? 'en-US' : 'fr-FR';
    if (c === 'XOF') {
      var x = n * fx.XOF; x = x >= 10000 ? Math.round(x / 1000) * 1000 : Math.round(x / 100) * 100;
      return Math.round(x).toLocaleString(loc) + ' FCFA';
    }
    if (c === 'EUR') {
      var e = n * fx.EUR; e = e >= 1000 ? Math.round(e / 10) * 10 : Math.round(e);
      return lang === 'en' ? '€' + Math.round(e).toLocaleString(loc) : Math.round(e).toLocaleString(loc) + ' €';
    }
    if (n === 0) return lang === 'fr' ? '0 $' : '$0';
    return lang === 'fr' ? Math.round(n).toLocaleString('fr-FR') + ' $' : '$' + Math.round(n).toLocaleString('en-US');
  };
  Lerna.moneyNote = function () {
    var c = Lerna.currency();
    if (c === 'USD') return Lerna.t('common.indicative');
    return Lerna.t('common.indicativeFx', { cur: c === 'XOF' ? 'FCFA' : (Lerna.lang === 'en' ? 'euros' : 'euros'), date: Lerna.fmtDate(Lerna.fx().date) });
  };

  /* ------------------------------------------------------------------ */
  /* Salutation selon l'heure (et le pseudo une fois inscrit)            */
  /* ------------------------------------------------------------------ */
  /* {_n} = espace + pseudo ; {,n} = virgule + pseudo (rien quand la personne n'est pas inscrite) */
  var GREET = {
    fr: {
      early: ['Déjà debout{,n} ?', 'Bon début de journée{,n}', 'Tôt ce matin{,n} !'],
      morning: ['Bonjour{_n}', 'Belle matinée{,n}', 'Bonjour{_n} !'],
      noon: ['Bonne pause{,n}', 'Bon appétit{,n}', 'Petite pause{,n} ?'],
      afternoon: ['Bon après-midi{,n}', 'Bonjour{_n}', 'Content de te voir{,n}'],
      evening: ['Bonsoir{_n}', 'Bonne soirée{,n}', 'Bonsoir{_n} !'],
      late: ['Petite session du soir{,n} ?', 'Bonsoir{_n}', 'Encore là ce soir{,n} ?'],
      night: ['Tu ne dors pas encore{,n} ?', 'Nuit calme{,n} ?', 'Toujours là{,n} ?']
    },
    en: {
      early: ['Up already{,n}?', 'Early start{,n}', 'Good early morning{,n}'],
      morning: ['Good morning{,n}', 'Morning{,n}', 'Hello{_n}!'],
      noon: ['Enjoy your break{,n}', 'Lunch time{,n}', 'Quick break{,n}?'],
      afternoon: ['Good afternoon{,n}', 'Hello{_n}', 'Good to see you{,n}'],
      evening: ['Good evening{,n}', 'Evening{,n}', 'Good evening{,n}!'],
      late: ['A late session{,n}?', 'Good evening{,n}', 'Still here tonight{,n}?'],
      night: ['Not asleep yet{,n}?', 'Quiet night{,n}?', 'Still awake{,n}?']
    }
  };
  Lerna.slot = function (d) {
    var h = (d || new Date()).getHours();
    if (h < 5) return 'night';
    if (h < 8) return 'early';
    if (h < 12) return 'morning';
    if (h < 14) return 'noon';
    if (h < 18) return 'afternoon';
    if (h < 22) return 'evening';
    return 'late';
  };
  Lerna.displayName = function (u) {
    u = u || (Lerna.auth && Lerna.auth.user);
    if (!u) return '';
    return (u.pseudo || u.prenom || '').trim();
  };
  Lerna.greeting = function (name) {
    var slot = Lerna.slot(), list = GREET[Lerna.lang][slot];
    var n = name === undefined ? Lerna.displayName() : name;
    var day = Math.floor(Date.now() / 864e5);
    var s = list[day % list.length];
    return s.replace('{_n}', n ? ' ' + n : '').replace('{,n}', n ? ', ' + n : '');
  };
  Lerna.greetingSub = function () {
    var slot = Lerna.slot();
    if (slot === 'night') return Lerna.t('greet.nightSub');
    if (slot === 'early') return Lerna.t('greet.earlySub');
    return '';
  };
  Lerna.fmtDate = function (iso, opts) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(Lerna.lang === 'en' ? 'en-GB' : 'fr-FR', opts || { day: 'numeric', month: 'long', year: 'numeric' });
  };
  Lerna.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };
  Lerna.loadScript = function (src) {
    return new Promise(function (res, rej) {
      var s = doc.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = rej; doc.head.appendChild(s);
    });
  };
  Lerna.emit = function (name, detail) { doc.dispatchEvent(new CustomEvent(name, { detail: detail })); };
  Lerna.on = function (name, fn) { doc.addEventListener(name, function (e) { fn(e.detail); }); };

  /* ------------------------------------------------------------------ */
  /* i18n                                                                */
  /* ------------------------------------------------------------------ */
  var DICT = { fr: {}, en: {} };
  Lerna.addStrings = function (d) {
    if (d.fr) Object.assign(DICT.fr, d.fr);
    if (d.en) Object.assign(DICT.en, d.en);
  };
  function detectLang() {
    var saved = store.raw('lerna_lang');
    if (saved === 'fr' || saved === 'en') return saved;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
    return /^en/i.test(nav) ? 'en' : 'fr';  // Français = langue de lancement par défaut
  }
  Lerna.lang = detectLang();
  doc.documentElement.lang = Lerna.lang;

  Lerna.t = function (key, vars) {
    var s = DICT[Lerna.lang][key];
    if (s === undefined) s = DICT.fr[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
  };
  /* Texte bilingue dans les données : "texte" ou {fr:"…", en:"…"} */
  Lerna.L = function (v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v[Lerna.lang] || v.fr || v.en || '';
    return v === undefined || v === null ? '' : v;
  };
  Lerna.applyI18n = function (root) {
    root = root || doc;
    Lerna.qsa('[data-i18n]', root).forEach(function (el) { el.textContent = Lerna.t(el.getAttribute('data-i18n')); });
    Lerna.qsa('[data-i18n-html]', root).forEach(function (el) { el.innerHTML = Lerna.t(el.getAttribute('data-i18n-html')); });
    Lerna.qsa('[data-i18n-ph]', root).forEach(function (el) { el.setAttribute('placeholder', Lerna.t(el.getAttribute('data-i18n-ph'))); });
    Lerna.qsa('[data-i18n-aria]', root).forEach(function (el) { el.setAttribute('aria-label', Lerna.t(el.getAttribute('data-i18n-aria'))); });
    var tt = doc.querySelector('meta[name="lerna-title"]');
    if (tt) doc.title = Lerna.t(tt.getAttribute('content'));
  };
  Lerna.setLang = function (lang) {
    if (lang !== 'fr' && lang !== 'en') return;
    if (lang === Lerna.lang) return;
    Lerna.lang = lang;
    try { localStorage.setItem('lerna_lang', lang); } catch (e) {}
    doc.documentElement.lang = lang;
    renderChrome();
    Lerna.applyI18n();
    Lerna.emit('lerna:lang', lang);
  };
  Lerna.onLang = function (fn) { Lerna.on('lerna:lang', fn); };

  /* Chaînes communes */
  Lerna.addStrings({
    fr: {
      'nav.home': 'Accueil', 'nav.explore': 'Explorer', 'nav.opps': 'Opportunités', 'nav.space': 'Mon Espace',
      'nav.start': 'Commencer →', 'nav.premium': 'Premium', 'nav.login': 'Connexion', 'nav.signup': "S'inscrire",
      'nav.logout': 'Se déconnecter', 'nav.questionnaire': 'Commencer mon orientation', 'nav.results': 'Mes résultats',
      'nav.orientation': 'Orientation', 'nav.me': 'Moi', 'nav.menu': 'Ouvrir le menu', 'nav.close': 'Fermer',
      'nav.sound': 'Sons', 'nav.language': 'Langue', 'nav.contact': 'Contact', 'nav.account': 'Mon compte',
      'nav.premiumBadge': 'Premium', 'nav.free': 'Compte gratuit', 'nav.today': "Aujourd'hui", 'nav.discover': 'Découvrir LERNA',
      'footer.tagline': 'Ton orientation, enfin claire.',
      'footer.copy': '© {year} LERNA — Ton orientation, enfin claire.',
      'footer.questionnaire': 'Questionnaire',
      'common.on': 'Activés', 'common.off': 'Coupés',
      'common.seeSchool': 'Voir la fiche →', 'common.loading': 'Chargement…', 'common.close': 'Fermer',
      'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.saved': 'Enregistré ✓',
      'common.perYear': '/ an', 'common.perMonth': '/ mois', 'common.free': 'Gratuit',
      'common.noReviews': "Pas encore d'avis", 'common.reviews': '{n} avis',
      'common.public': 'Publique', 'common.private': 'Privée', 'common.online': 'En ligne',
      'common.favAdded': 'Ajoutée à tes favoris ★', 'common.favRemoved': 'Retirée de tes favoris',
      'common.loginNeeded': 'Connecte-toi pour utiliser cette fonction.',
      'common.premiumOnly': 'Fonction Premium',
      'common.unlock': 'Déverrouiller — 4.99$/mois',
      'common.demoNotice': "Mode aperçu : les comptes et données restent sur cet appareil. La connexion réelle s'active une fois Supabase branché sur Vercel.",
      'common.years': '{n} ans', 'common.year': '1 an',
      'common.error': 'Une erreur est survenue. Réessaie.',
      'common.offline': 'Tu es hors ligne. Certaines fonctions sont indisponibles.',
      'common.indicative': 'Frais indicatifs en USD — vérifie toujours sur le site officiel de l’établissement.',
      'common.indicativeFx': 'Frais indicatifs convertis en {cur} (taux du {date}) — vérifie toujours sur le site officiel de l’établissement.',
      'greet.nightSub': 'Ton parcours peut attendre demain matin. Repose-toi bien.',
      'greet.earlySub': 'Les premières heures sont les meilleures pour avancer.',
      'nav.settings': 'Paramètres', 'nav.dossiers': 'Mes dossiers', 'nav.help': 'Aide et contact',
      'nav.back': 'Retour', 'nav.school': 'École', 'nav.legal': 'Règles et confidentialité', 'nav.admin': 'Administration',
      'nav.streak': '{n} jour(s) d’affilée', 'nav.mainNav': 'Navigation principale'
    },
    en: {
      'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.opps': 'Opportunities', 'nav.space': 'My Space',
      'nav.start': 'Get started →', 'nav.premium': 'Premium', 'nav.login': 'Log in', 'nav.signup': 'Sign up',
      'nav.logout': 'Log out', 'nav.questionnaire': 'Start my orientation', 'nav.results': 'My results',
      'nav.orientation': 'Orientation', 'nav.me': 'Me', 'nav.menu': 'Open menu', 'nav.close': 'Close',
      'nav.sound': 'Sounds', 'nav.language': 'Language', 'nav.contact': 'Contact', 'nav.account': 'My account',
      'nav.premiumBadge': 'Premium', 'nav.free': 'Free account', 'nav.today': 'Today', 'nav.discover': 'Discover LERNA',
      'footer.tagline': 'Your path, finally clear.',
      'footer.copy': '© {year} LERNA — Your path, finally clear.',
      'footer.questionnaire': 'Questionnaire',
      'common.on': 'On', 'common.off': 'Off',
      'common.seeSchool': 'View profile →', 'common.loading': 'Loading…', 'common.close': 'Close',
      'common.cancel': 'Cancel', 'common.save': 'Save', 'common.saved': 'Saved ✓',
      'common.perYear': '/ year', 'common.perMonth': '/ month', 'common.free': 'Free',
      'common.noReviews': 'No reviews yet', 'common.reviews': '{n} reviews',
      'common.public': 'Public', 'common.private': 'Private', 'common.online': 'Online',
      'common.favAdded': 'Added to your favourites ★', 'common.favRemoved': 'Removed from your favourites',
      'common.loginNeeded': 'Log in to use this feature.',
      'common.premiumOnly': 'Premium feature',
      'common.unlock': 'Unlock — $4.99/month',
      'common.demoNotice': 'Preview mode: accounts and data stay on this device. Real sign-in turns on once Supabase is connected on Vercel.',
      'common.years': '{n} years', 'common.year': '1 year',
      'common.error': 'Something went wrong. Please try again.',
      'common.offline': 'You are offline. Some features are unavailable.',
      'common.indicative': 'Indicative fees in USD — always check the institution’s official website.',
      'common.indicativeFx': 'Indicative fees converted to {cur} (rate of {date}) — always check the institution’s official website.',
      'greet.nightSub': 'Your journey can wait until tomorrow morning. Get some rest.',
      'greet.earlySub': 'The first hours are the best to move forward.',
      'nav.settings': 'Settings', 'nav.dossiers': 'My applications', 'nav.help': 'Help and contact',
      'nav.back': 'Back', 'nav.school': 'School', 'nav.legal': 'Rules and privacy', 'nav.admin': 'Admin',
      'nav.streak': '{n}-day streak', 'nav.mainNav': 'Main navigation'
    }
  });

  /* ------------------------------------------------------------------ */
  /* Icônes SVG originales (aucun emoji dans l'interface)                */
  /* ------------------------------------------------------------------ */
  var P = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    school: '<path d="M3 21h18M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9M2.5 10 12 3l9.5 7z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    lock: '<rect x="4" y="11" width="16" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    volumeX: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.7"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
    dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    utensils: '<path d="M3 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2M5 11v11M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3M8 14.5h.01M16 14.5h.01"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
    bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 16h20M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    flame: '<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.5-2.4-5.6-4-8.4-.6 2-1.6 3-3 3.4.4-3.1-.8-5.9-3.4-8.4-.3 3.6-1.6 5.5-3.2 7.6C4.3 11.2 5 13 5 15.4 5 19.1 7.6 22 12 22z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    bookmark: '<path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    flagReport: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    play: '<path d="m6 3 14 9-14 9z"/>'
  };
  Lerna.icon = function (name, cls) {
    var p = P[name] || P.info;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>';
  };
  Lerna.googleIcon = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  Lerna.logoHTML = function (onDark) {
    return '<span class="logo-in">' + Lerna.mark('logo-mark') + '<span class="logo-txt">LER<span class="n">N</span>A</span></span>';
  };

  /* Logo officiel LERNA (10 oct. 2026) : le ruban orange, sans fond.
     Tracé vectoriel unique, utilisé partout : barre du haut, bouton central, IA, chargement, icônes.
     Lerna.mark(cls, label, opts) → le ruban ; Lerna.seal() garde le même nom pour tous les endroits déjà codés. */
  var RIBBON_D = 'M31 40 C31 40 24 38 31 40 C38 43 63 50 74 54 C84 58 87 59 94 63 C101 67 109 72 114 76 C119 80 121 81 124 85 C127 88 131 92 134 96 C138 100 142 106 144 110 C147 115 148 117 150 121 C153 125 155 131 157 136 C159 141 161 147 163 152 C165 158 166 163 167 168 C168 173 168 178 169 182 C169 187 169 191 169 196 C169 200 169 204 169 209 C168 214 167 220 166 225 C165 230 165 232 163 238 C161 245 157 256 154 262 C151 269 149 272 146 276 C144 281 140 286 137 291 C134 295 131 299 128 303 C124 307 121 311 117 315 C113 319 109 324 105 328 C100 332 96 336 91 339 C87 342 84 345 79 348 C75 352 69 355 63 359 C58 362 51 366 46 369 C41 372 39 373 32 376 C25 379 8 385 3 387 C-2 390 0 389 0 389 C0 389 10 390 17 390 C23 391 30 392 38 394 C45 395 55 397 63 400 C71 402 79 406 85 408 C92 411 95 413 100 416 C105 418 109 420 116 425 C123 430 136 439 144 445 C152 451 155 454 163 462 C171 469 183 481 194 492 C205 504 221 521 230 530 C239 539 241 541 247 546 C253 551 260 556 266 560 C272 564 278 567 283 569 C288 572 292 573 296 574 C301 575 305 576 310 577 C315 578 319 578 324 578 C329 578 333 578 337 578 C342 577 348 576 353 575 C358 574 362 572 366 570 C370 569 373 567 377 565 C381 563 385 561 389 558 C393 555 399 551 403 547 C408 543 411 539 414 535 C417 531 420 527 423 523 C425 518 428 512 430 507 C433 501 435 494 437 488 C438 483 439 480 439 474 C440 468 442 458 442 450 C443 442 443 437 443 425 C443 414 443 405 442 383 C440 362 438 324 436 296 C433 268 431 240 428 218 C426 196 424 178 422 163 C419 149 418 140 415 130 C413 120 411 113 409 105 C406 96 402 87 399 80 C396 73 393 68 391 64 C389 60 387 58 385 54 C382 50 378 45 375 42 C372 38 369 35 365 31 C361 28 357 24 353 22 C349 19 345 17 342 15 C338 13 335 11 331 10 C327 8 321 5 316 4 C311 3 306 2 301 1 C296 1 292 0 286 0 C281 0 275 0 269 1 C263 1 290 -3 251 3 C211 10 31 40 31 40Z M178 77 C186 76 215 70 227 68 C239 66 242 66 250 65 C258 64 265 64 273 64 C281 64 291 66 299 67 C307 69 315 71 322 73 C330 76 338 79 342 81 C346 83 345 84 347 86 C349 89 351 90 353 94 C356 98 360 106 362 112 C365 118 366 125 368 132 C369 139 370 139 372 155 C374 171 377 198 379 229 C381 259 384 314 385 340 C386 366 386 370 386 385 C386 400 386 419 386 430 C386 440 385 442 385 448 C384 453 383 458 382 462 C382 466 381 468 380 472 C378 476 376 482 374 486 C372 489 370 491 368 494 C365 497 362 501 359 503 C356 506 354 508 351 509 C348 511 345 512 342 513 C338 514 333 516 329 516 C325 517 321 517 317 516 C313 516 308 515 304 514 C300 512 297 511 294 509 C290 507 286 504 282 502 C279 499 286 507 274 495 C261 483 222 444 208 431 C194 418 195 420 190 416 C185 412 182 410 177 406 C172 403 165 398 158 395 C151 391 142 387 136 384 C130 382 129 381 122 379 C115 378 95 374 95 374 C95 374 112 367 120 363 C127 360 132 357 139 353 C146 349 156 342 162 337 C169 332 174 328 180 322 C185 317 190 311 195 306 C200 300 203 295 207 288 C212 281 217 272 220 264 C224 257 226 250 228 243 C230 236 232 229 233 222 C234 215 234 206 234 200 C235 195 235 194 234 190 C234 185 234 180 233 174 C232 168 230 161 228 154 C226 147 223 138 220 132 C218 126 215 123 213 119 C211 115 210 113 207 109 C204 105 200 100 195 94 C190 89 178 78 178 78 C178 78 170 79 178 77Z';
  var markN = 0;
  Lerna.RIBBON_D = RIBBON_D;
  Lerna.mark = function (cls, label, opts) {
    opts = opts || {};
        /* viewBox carré : le ruban (443 × 579) est centré, pour tenir dans les emplacements carrés */
    var vb = opts.tight ? '0 0 444 579' : '-68 0 579 579';
    /* Logo plat et sobre : une seule couleur (variable CSS --mark), sans dégradé ni ombre */
    return '<svg class="mark ' + (cls || '') + '" viewBox="' + vb + '" ' + (label ? 'role="img" aria-label="' + Lerna.esc(label) + '"' : 'aria-hidden="true"') + ' focusable="false">' +
      (opts.draw ? '<path class="mark-line" d="' + RIBBON_D + '" pathLength="1" fill="none" stroke="var(--mark, #E8640C)" stroke-width="9" stroke-linejoin="round"/>' : '') +
      '<g class="mark-fill"><path d="' + RIBBON_D + '" fill="var(--mark, #E8640C)" fill-rule="evenodd"/></g></svg>';
  };
  Lerna.seal = function (cls, label) { return Lerna.mark('seal ' + (cls || ''), label); };
  /* « LERNA réfléchit » : le ruban respire doucement (remplace les roues qui tournent) */
  Lerna.thinking = function (cls) { return '<span class="thinking ' + (cls || '') + '" role="status" aria-label="' + Lerna.esc(Lerna.lang === 'en' ? 'LERNA is thinking' : 'LERNA réfléchit') + '">' + Lerna.mark('mark-think') + '</span>'; };

  /* Stickers (images WebP générées par scripts/build-stickers.py) */
  Lerna.sticker = function (name, cls, alt) {
    if (!name) return '';
    return '<img class="stk ' + (cls || '') + '" src="assets/stickers/' + name + '.webp" alt="' + Lerna.esc(alt || '') + '"' + (alt ? '' : ' aria-hidden="true"') + ' width="160" height="160" decoding="async" draggable="false">';
  };
  Lerna.flag = function (code, cls) {
    var src = window.LERNA_FLAG ? window.LERNA_FLAG(code) : (/^[A-Z]{2}$/.test(code || '') ? 'assets/flags/' + code + '.webp' : '');
    return src ? '<img class="flg ' + (cls || '') + '" src="' + src + '" alt="" aria-hidden="true" width="96" height="96" loading="lazy" decoding="async">' : '';
  };

  /* ------------------------------------------------------------------ */
  /* Sons LERNA (Web Audio, compatibles iOS : déverrouillés au 1er geste) */
  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* Sensation au doigt : petite vibration à chaque appui (Android) ;     */
  /* sur iPhone (iOS 18 et plus), le petit retour haptique du système,    */
  /* obtenu en basculant un interrupteur caché. Réglable dans Paramètres. */
  /* ------------------------------------------------------------------ */
  var hapticLabel = null;
  function iosHaptic() {
    try {
      if (!hapticLabel) {
        hapticLabel = doc.createElement('label');
        hapticLabel.setAttribute('aria-hidden', 'true');
        hapticLabel.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        var inp = doc.createElement('input'); inp.type = 'checkbox'; inp.setAttribute('switch', ''); inp.tabIndex = -1;
        hapticLabel.appendChild(inp); doc.body.appendChild(hapticLabel);
      }
      hapticLabel.click();
    } catch (e) {}
  }
  Lerna.haptic = function (pattern) {
    if (Prefs.get('vibrations') === false) return;
    var p = pattern === undefined ? [12] : pattern;
    try {
      if (navigator.vibrate) { if (!navigator.userActivation || navigator.userActivation.hasBeenActive) navigator.vibrate(p); return; }
      if (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) iosHaptic();
    } catch (e) {}
  };
  /* Effet « pop » (sauvegarder, cocher, aimer) : l'élément gonfle puis revient en rebondissant */
  Lerna.pop = function (el) {
    if (!el || !el.classList) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    setTimeout(function () { el.classList.remove('pop'); }, 450);
  };
  /* Appui : l'élément s'enfonce légèrement (et vibre) dès que le doigt touche */
  var PRESSABLE = 'button, .btn, a.btn, [role="button"], .opt, .chip, .tab, .mission, .row-item, .card-hover, .subj, .qbtn, .bottom-nav a, .side-links a, .pill, .sch, .doc .seg3 button, label.switch';
  var pressed = null;
  function release() { if (pressed) { pressed.classList.remove('is-pressing'); pressed = null; } }
  doc.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    var el = e.target.closest && e.target.closest(PRESSABLE);
    if (!el || el.disabled || el.classList.contains('is-disabled')) return;
    release(); pressed = el; el.classList.add('is-pressing');
    if (e.pointerType !== 'mouse') Lerna.haptic([10]);
  }, { passive: true });
  ['pointerup', 'pointercancel', 'pointerleave', 'dragstart'].forEach(function (ev) { doc.addEventListener(ev, function () { setTimeout(release, 70); }, { passive: true, capture: true }); });

  var Sound = Lerna.sound = {
    ctx: null,
    enabled: store.raw('lerna_sound') !== 'off' && Prefs.get('sounds') !== false,
    unlock: function () {
      if (!Sound.enabled) return;
      try {
        if (!Sound.ctx) Sound.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (Sound.ctx.state === 'suspended') Sound.ctx.resume();
        var b = Sound.ctx.createBuffer(1, 1, 22050), s = Sound.ctx.createBufferSource();
        s.buffer = b; s.connect(Sound.ctx.destination); s.start(0);
      } catch (e) {}
    },
    wood: function (freq, t, dur, vol) {
      var c = Sound.ctx, o1 = c.createOscillator(), g1 = c.createGain(), o2 = c.createOscillator(), g2 = c.createGain();
      o1.type = 'triangle'; o1.frequency.setValueAtTime(freq, t);
      g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(vol, t + 0.005); g1.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o1.connect(g1); g1.connect(c.destination); o1.start(t); o1.stop(t + dur + 0.1);
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2, t);
      g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(vol * 0.3, t + 0.005); g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
      o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + dur);
    },
    patterns: {
      click: [[440, 0, .08, .16]],
      select: [[392, 0, .1, .14], [494, .07, .12, .14]],
      success: [[392, 0, .15, .22], [494, .12, .15, .25], [587, .24, .25, .3]],
      results: [[262, 0, .1, .13], [330, .1, .1, .16], [392, .2, .1, .19], [494, .3, .1, .22], [659, .42, .6, .32], [165, .42, .7, .15]],
      error: [[294, 0, .2, .2], [262, .18, .2, .16]],
      opportunity: [[220, 0, .2, .26], [659, .22, .4, .3]],
      welcome: [[330, 0, .3, .22], [415, .28, .3, .25], [494, .56, .3, .27], [415, .84, .2, .22], [440, 1.04, .5, .3]],
      levelup: [[392, 0, .12, .2], [494, .1, .12, .22], [587, .2, .12, .24], [784, .32, .5, .3]],
      streak: [[523, 0, .1, .18], [659, .09, .1, .2], [784, .18, .35, .26]]
    },
    vib: { click: [], select: [], success: [22, 45, 34], results: [80, 30, 120, 30, 180], error: [100, 50, 100], opportunity: [80, 40, 80], levelup: [60, 30, 60, 30, 140], streak: [50, 30, 90] },
    play: function (name) {
      try {
        if (Sound.vib[name] && Sound.vib[name].length) Lerna.haptic(Sound.vib[name]);
      } catch (e) {}
      if (!Sound.enabled) return;
      try {
        if (!Sound.ctx) Sound.unlock();
        var c = Sound.ctx; if (!c) return;
        var t = c.currentTime + 0.01;
        (Sound.patterns[name] || []).forEach(function (n) { Sound.wood(n[0], t + n[1], n[2], n[3]); });
      } catch (e) {}
    },
    set: function (on) {
      Sound.enabled = !!on;
      try { localStorage.setItem('lerna_sound', on ? 'on' : 'off'); } catch (e) {}
      if (Prefs.get('sounds') !== !!on) Prefs.set('sounds', !!on);
      if (on) { Sound.unlock(); Sound.play('click'); }
      return Sound.enabled;
    },
    toggle: function () { return Sound.set(!Sound.enabled); }
  };
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) {
    doc.addEventListener(ev, function once() { Sound.unlock(); doc.removeEventListener(ev, once, true); }, true);
  });

  /* ------------------------------------------------------------------ */
  /* Configuration publique (via /api/config — variables Vercel)          */
  /* ------------------------------------------------------------------ */
  Lerna.config = { premiumEnabled: true, live: false };
  (function () { var c = store.sget('lerna_cfg', null); if (c && c.c) Object.assign(Lerna.config, c.c); })();
  function loadConfig() {
    var cached = store.sget('lerna_cfg', null);
    if (cached && cached.t && Date.now() - cached.t < 10 * 60 * 1000) {
      Object.assign(Lerna.config, cached.c);
      return Promise.resolve(Lerna.config);
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);   // le serveur Vercel peut mettre quelques secondes à se réveiller
    return fetch('/api/config', { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('no config'); return r.json(); })
      .then(function (c) { c.live = true; Object.assign(Lerna.config, c); store.set('lerna_ab_ovr', c.ab || {}); })
      .catch(function () {
        Lerna.config.live = false;
        /* Serveur lent ou hors ligne : on reprend la dernière config connue (URL Supabase + clé publique),
           pour rester connecté au lieu de basculer en « mode aperçu » */
        var last = store.get('lerna_cfg_last', null);
        if (last && last.supabaseUrl && last.supabaseAnonKey) Object.assign(Lerna.config, last, { live: false });
      })
      .then(function () {
        clearTimeout(timer);
        if (Lerna.config.live) {
          store.sset('lerna_cfg', { t: Date.now(), c: Lerna.config });
          if (Lerna.config.supabaseUrl) store.set('lerna_cfg_last', Lerna.config);
        }
        return Lerna.config;
      });   // un échec n'est jamais gardé pour la session : la page suivante réessaie
  }

  /* ------------------------------------------------------------------ */
  /* A/B testing : une seule app, deux versions                          */
  /* Chaque nouveau visiteur reçoit au hasard la version A ou B et la    */
  /* garde (sur son téléphone, puis sur son compte). Depuis /admin, on   */
  /* peut arrêter un test ou donner la version gagnante à tout le monde. */
  /* ------------------------------------------------------------------ */
  var AB_TESTS = {
    couleurs: { variants: ['a', 'b'], label: { fr: 'Couleurs : A = blanc chaud avec touches crème, B = crème plus présent (blocs pêche marqués)', en: 'Colours: A = warm white with cream touches, B = more cream (stronger peach blocks)' } }
  };
  Lerna.ab = {
    tests: AB_TESTS,
    all: function () { return store.get('lerna_ab', null) || {}; },
    /* Réglage décidé depuis /admin : 'test' (en cours), 'a' ou 'b' (gagnante pour tout le monde) */
    override: function (test) {
      var src = Lerna.config.ab || store.get('lerna_ab_ovr', null) || {}, o = src[test];  // dernier réglage connu, même hors ligne
      return o === 'a' || o === 'b' ? o : null;
    },
    assigned: function (test) {
      var a = Lerna.ab.all(), def = AB_TESTS[test];
      if (!def) return null;
      if (a[test] && def.variants.indexOf(a[test]) !== -1) return a[test];
      var v = def.variants[Math.floor(Math.random() * def.variants.length)];
      a[test] = v; if (!a.since) a.since = new Date().toISOString();
      store.set('lerna_ab', a);
      return v;
    },
    variant: function (test) { return Lerna.ab.override(test) || Lerna.ab.assigned(test); },
    /* Les versions suivent le compte : un nouvel appareil reprend la version déjà attribuée */
    adopt: function (fromAccount) {
      if (!fromAccount || typeof fromAccount !== 'object') return false;
      var a = Lerna.ab.all(), changed = false;
      Object.keys(AB_TESTS).forEach(function (k) { if (fromAccount[k] && a[k] !== fromAccount[k]) { a[k] = fromAccount[k]; changed = true; } });
      if (changed) { store.set('lerna_ab', a); Prefs.apply(); }
      return changed;
    },
    props: function () { var o = {}; Object.keys(AB_TESTS).forEach(function (k) { o['ab_' + k] = Lerna.ab.variant(k); }); return o; }
  };

  /* ------------------------------------------------------------------ */
  /* Mesures (PostHog) — seulement si la clé est configurée et que la    */
  /* personne ne l'a pas refusé dans les Paramètres                      */
  /* ------------------------------------------------------------------ */
  var A = Lerna.analytics = {
    on: false, queue: [],
    allowed: function () { return Prefs.get('analytics') !== false; },
    init: function () {
      var key = Lerna.config.posthogKey;
      if (!key || !Lerna.config.live || !A.allowed() || A.on) return;
      var host = Lerna.config.posthogHost || 'https://eu.i.posthog.com';
      /* Chargeur officiel PostHog (réduit) */
      !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split('.'); 2 == o.length && (t = t[o[0]], e = o[1]); t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; } (p = t.createElement('script')).type = 'text/javascript'; p.crossOrigin = 'anonymous'; p.async = !0; p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js'; (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = 'posthog', u.people = u.people || [], o = 'init capture register register_once identify reset alias set_config opt_out_capturing opt_in_capturing get_distinct_id getFeatureFlag onFeatureFlags'.split(' '), n = 0; n < o.length; n++) g(u, o[n]); e._i.push([i, s, a]); }, e.__SV = 1); }(doc, window.posthog || []);
      window.posthog.init(key, { api_host: host, autocapture: false, capture_pageview: true, persistence: 'localStorage', person_profiles: 'identified_only', disable_session_recording: true });
      A.on = true;
      window.posthog.register(Object.assign({ lang: Lerna.lang, theme: Prefs.theme(), country: Lerna.country() || null, currency: Lerna.currency() }, Lerna.ab.props()));
      A.queue.forEach(function (x) { window.posthog.capture(x[0], x[1]); });
      A.queue = [];
      if (Auth.user) A.identify(Auth.user);
    },
    capture: function (ev, props) {
      if (!A.allowed()) return;
      Stats.log(ev, props && props.id ? { id: String(props.id).slice(0, 40) } : null);
      var p = Object.assign({}, Lerna.ab.props(), props || {});
      if (A.on && window.posthog) window.posthog.capture(ev, p);
      else if (A.queue.length < 50) A.queue.push([ev, p]);
    },
    identify: function (u) { if (A.on && window.posthog && u && u.id) window.posthog.identify(u.id, { lang: Lerna.lang, pays: u.pays || null }); },
    reset: function () { if (A.on && window.posthog) window.posthog.reset(); }
  };

  /* ------------------------------------------------------------------ */
  /* Statistiques du propriétaire (table events, via lerna_log) :          */
  /* pages ouvertes, temps passé, page de sortie, fonctions utilisées.    */
  /* Identifiant anonyme tiré au hasard ; respecte « Statistiques » dans  */
  /* Paramètres ; les visites du propriétaire ne sont pas comptées.        */
  /* ------------------------------------------------------------------ */
  var Stats = Lerna.stats = {
    q: [], ready: false, t0: Date.now(), left: false,
    sid: function () {
      var x = store.get('lerna_sid', null);
      if (!x) { x = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set('lerna_sid', x); }
      return x;
    },
    page: function () { return ((doc.body && doc.body.getAttribute('data-page')) || location.pathname.split('/').pop().replace(/\.html$/, '') || 'home').slice(0, 40); },
    log: function (ev, meta, keep) {
      if (!A.allowed()) return;
      ev = String(ev || '').toLowerCase().replace(/[^a-z0-9_:.-]/g, '_').slice(0, 40);
      if (!ev || ev.indexOf('ai:') === 0) return;
      var item = { p_sid: Stats.sid(), p_ev: ev, p_page: Stats.page(), p_meta: meta || null };
      if (!Stats.ready) { if (Stats.q.length < 40) Stats.q.push(item); return; }
      Stats.send(item, keep);
    },
    send: function (item, keep) {
      var c = Lerna.config;
      if (Auth.mode !== 'supabase' || !c.supabaseUrl || !c.supabaseAnonKey) return;
      if (Auth.user && Auth.user.role === 'admin') return;
      var go = function (tok) {
        try {
          fetch(c.supabaseUrl + '/rest/v1/rpc/lerna_log', { method: 'POST', keepalive: !!keep,
            headers: { apikey: c.supabaseAnonKey, Authorization: 'Bearer ' + (tok || c.supabaseAnonKey), 'Content-Type': 'application/json' },
            body: JSON.stringify(item) }).catch(function () {});
        } catch (e) {}
      };
      if (keep) go(Stats.tok); else Auth.token().then(function (tok) { Stats.tok = tok; go(tok); }, function () { go(null); });
    },
    start: function () {
      Stats.ready = true;
      if (Auth.mode === 'supabase') Auth.token().then(function (tok) { Stats.tok = tok; });
      var q = Stats.q; Stats.q = [];
      q.forEach(function (x) { Stats.send(x); });
    }
  };
  Stats.log('page');
  doc.addEventListener('visibilitychange', function () {
    if (doc.visibilityState === 'hidden' && !Stats.left) { Stats.left = true; Stats.log('leave', { s: Math.round((Date.now() - Stats.t0) / 1000) }, true); }
    else if (doc.visibilityState === 'visible' && Stats.left) { Stats.left = false; Stats.t0 = Date.now(); }
  });

  /* ------------------------------------------------------------------ */
  /* Appels API (jeton Supabase joint automatiquement)                    */
  /* ------------------------------------------------------------------ */
  Lerna.api = function (path, body, opts) {
    opts = opts || {};
    return Auth.token().then(function (tok) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, opts.timeout || 45000);
      var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (tok) headers.Authorization = 'Bearer ' + tok;
      return fetch(path, { method: 'POST', headers: headers, body: JSON.stringify(body || {}), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          clearTimeout(timer);
          return r.text().then(function (txt) {
            var data = null; try { data = JSON.parse(txt); } catch (e) {}
            return { ok: r.ok && data !== null, status: r.status, data: data };
          });
        })
        .catch(function () { clearTimeout(timer); return { ok: false, status: 0, data: null }; });
    });
  };

  /* ------------------------------------------------------------------ */
  /* Ce que LERNA sait de la personne — sans lui poser de questions en plus */
  /* Sources : inscription (avatar = genre, date de naissance), pays deviné, langue et type     */
  /* d'appareil, questionnaire, et ce qu'elle regarde dans l'app. Tout est visible et modifiable */
  /* dans Paramètres → « Ce que LERNA sait de toi ». Jamais : religion, ethnie, santé, revenus.   */
  /* ------------------------------------------------------------------ */
  var NAMES_H = 'mamadou moussa ibrahima abdoulaye cheikh ousmane modou amadou babacar serigne mouhamed mohamed mohammed muhammad aliou alioune assane lamine malick pape papa souleymane boubacar oumar omar seydou idrissa ismaila khadim fallou saliou birame demba samba tidiane youssou fadel elhadji djibril abdou abdourahmane bamba mor matar ndiaga ngagne thierno saidou sidy lassana mamadi sekou kofi kwame yaw kojo kwabena emeka chinedu tunde segun femi olumide jean pierre paul louis lucas hugo thomas nicolas antoine kevin david daniel michel yves eric franck christian patrick olivier ahmed youssef karim mehdi rachid hamza ayoub bilal samuel joseph emmanuel jacques alexandre arnaud cedric serge herve landry brice steve armel mathieu julien maxime romain quentin adrien vincent baptiste'.split(' ');
  var NAMES_F = 'fatou aminata awa aissatou aissata mariama khady ndeye fatoumata astou coumba binta dieynaba adja rokhaya sokhna maimouna oumou kadiatou hawa ramatoulaye seynabou nafissatou marieme mariam aida khadija fatima aicha amina salimata rama penda dior anta yaye nogaye codou bineta mbene marie anne sophie julie camille chloe emma lea sarah laura claire nathalie christine isabelle grace esther ruth rachel ama akosua abena adwoa ngozi chioma funmi folake blessing joy mercy precious nadia sara yasmine imane salma meryem kenza rose josiane flora ines linda manon pauline lucie juliette alice clara jade louise oceane'.split(' ');
  function normName(x) { return String(x || '').trim().split(/[\s-]+/)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  Lerna.me = {
    /* Devine l'avatar à pré-sélectionner d'après le prénom (la personne valide ou change d'un appui) */
    guessGenre: function (prenom) {
      var n = normName(prenom); if (!n) return null;
      if (NAMES_H.indexOf(n) !== -1) return 'h';
      if (NAMES_F.indexOf(n) !== -1) return 'f';
      return null;
    },
    raw: function () { return store.get('lerna_me', null) || {}; },
    set: function (patch) {
      var m = Object.assign(Lerna.me.raw(), patch || {}); store.set('lerna_me', m);
      if (Auth.user) {
        var upd = {};
        if ('genre' in patch) { Auth.user.genre = patch.genre; upd.genre = patch.genre || null; }
        if ('naissance' in patch) { Auth.user.naissance = patch.naissance; upd.date_naissance = patch.naissance || null; }
        if (Auth.mode === 'supabase' && Object.keys(upd).length) Auth.sb.from('users').update(upd).eq('id', Auth.user.id).then(function () {}, function () {});
        if (Auth.mode !== 'supabase') store.set('lerna_user', Auth.user);
      }
      Lerna.emit('lerna:me', m);
      return m;
    },
    /* Ce que l'app regarde : quels types d'offres et quels domaines la personne ouvre le plus */
    signal: function (kind, key) {
      if (!kind || !key) return;
      var sg = store.get('lerna_signals', null) || {}; sg[kind] = sg[kind] || {}; sg[kind][key] = (sg[kind][key] || 0) + 1; store.set('lerna_signals', sg);
    },
    top: function (kind, n) {
      var sg = (store.get('lerna_signals', null) || {})[kind] || {};
      return Object.keys(sg).sort(function (a, b) { return sg[b] - sg[a]; }).slice(0, n || 3);
    },
    get: function () {
      var m = Lerna.me.raw(), u = Auth.user || {}, prof = store.get('lerna_profile', null), a = (prof && prof.answers) || {};
      var out = {
        prenom: u.prenom || m.prenom || '', nom: u.nom || m.nom || '',
        genre: u.genre || m.genre || '', naissance: u.naissance || m.naissance || '',
        pays: Lerna.country ? Lerna.country() : '', langue: (navigator.language || '').slice(0, 2),
        appareil: /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'Ordinateur',
        niveau: u.niveau || a.q2 || '', domaines: a.q15 || [],
        vus: Lerna.me.top('dom', 3), typesVus: Lerna.me.top('type', 2)
      };
      if (!out.genre) { var g = Lerna.me.guessGenre(out.prenom); if (g) { out.genre = g; out.genreDevine = true; } }
      if (out.naissance) { var b = new Date(out.naissance), now = new Date(); out.age = now.getFullYear() - b.getFullYear() - ((now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) ? 1 : 0); }
      return out;
    },
    /* Accord des phrases : Lerna.me.accord('prêt', 'prête') */
    accord: function (m, f, x) { var g = Lerna.me.get().genre; return g === 'f' ? f : g === 'x' ? (x || m + ' · ' + f) : m; }
  };

  /* Résumé du profil pour l'IA (réponses du questionnaire + infos d'inscription), en texte court */
  Lerna.profileText = function () {
    var prof = store.get('lerna_profile', null), out = [];
    var me = Lerna.me.get();
    if (me.prenom) out.push('Prénom : ' + me.prenom);
    if (me.genre && !me.genreDevine) out.push('Genre : ' + ({ h: 'homme', f: 'femme', x: 'non précisé' })[me.genre]);
    if (me.age) out.push('Âge : ' + me.age + ' ans');
    var c = me.pays; if (c) out.push('Pays : ' + (window.LERNA_COUNTRY_NAME ? window.LERNA_COUNTRY_NAME(c, 'fr') : c));
    if (me.vus.length) out.push('Domaines les plus consultés dans LERNA : ' + me.vus.join(', '));
    if (prof && prof.answers && window.LERNA_QUESTIONS && window.LERNA_ANSWER_TEXT) {
      window.LERNA_QUESTIONS.forEach(function (q) {
        var val = window.LERNA_ANSWER_TEXT(q, prof.answers, 'fr');
        if (val) out.push((window.LERNA_PROMPT_LABELS && window.LERNA_PROMPT_LABELS[q.id] || q.id) + ' : ' + String(val).slice(0, 240));
      });
    }
    return out.join('\n').slice(0, 3900);
  };
  /* Appel IA unique : renvoie { state: 'ok' | 'offline' | 'limit' | 'error', reply }.
     « offline » tant que l'app n'est pas en ligne ou que la clé IA n'est pas encore ajoutée : rien d'autre à changer le jour J. */
  Lerna.ai = function (mode, payload) {
    if (!Lerna.config.live) return Promise.resolve({ state: 'offline' });
    var body = Object.assign({ mode: mode, lang: Lerna.lang }, payload || {});
    return Lerna.api('/api/chat', body, { timeout: 45000 }).then(function (r) {
      if (r.ok && r.data && (r.data.reply || r.data.draft)) return { state: 'ok', reply: r.data.reply, draft: r.data.draft };
      if (r.status === 429) return { state: 'limit' };
      if (r.status === 503 || (r.data && r.data.error === 'ai_unavailable')) return { state: 'offline' };
      return { state: 'error', error: r.data && r.data.error };
    });
  };

  /* ------------------------------------------------------------------ */
  /* Authentification : Supabase si configuré, sinon mode aperçu local    */
  /* ------------------------------------------------------------------ */
  function sha256(str) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(btoa(unescape(encodeURIComponent(str))));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }
  var Auth = Lerna.auth = {
    mode: 'demo',
    user: null,
    sb: null,
    _session: null,
    token: function () {
      if (Auth.mode !== 'supabase' || !Auth.sb) return Promise.resolve(null);
      return Auth.sb.auth.getSession().then(function (r) { return r.data && r.data.session ? r.data.session.access_token : null; }).catch(function () { return null; });
    },
    _fromDb: function (u, row) {
      var meta = u.user_metadata || {};
      return {
        id: u.id, email: u.email,
        prenom: (row && row.prenom) || meta.prenom || meta.given_name || (meta.full_name || meta.name || '').split(' ')[0] || '',
        nom: (row && row.nom) || meta.nom || meta.family_name || '',
        pays: (row && row.pays) || meta.pays || '',
        niveau: (row && row.niveau_etudes) || meta.niveau || '',
        bio: (row && row.bio) || '',
        is_premium: !!(row && row.is_premium),
        premium_expiry: row && row.premium_expiry,
        portal_url: row && row.ls_portal_url,
        created: (row && row.date_inscription) || u.created_at,
        ref_code: row && row.ref_code,
        pseudo: (row && row.pseudo) || meta.pseudo || '',
        genre: (row && row.genre) || meta.genre || '',
        naissance: (row && row.date_naissance) || meta.naissance || '',
        role: (row && row.role) || 'user',
        ab: row && row.ab,
        prefs: row && row.prefs,
        progress: row && row.progress,
        verified: !!u.email_confirmed_at
      };
    },
    _load: function (u) {
      return Auth.sb.from('users').select('*').eq('id', u.id).maybeSingle()
        .then(function (r) { Auth.user = Auth._fromDb(u, r.data); })
        .catch(function () { Auth.user = Auth._fromDb(u, null); })
        .then(function () { store.set('lerna_user_cache', Auth.user); });
    },
    init: function () {
      return loadConfig().then(function (cfg) {
        if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
          return Lerna.loadScript(SUPABASE_CDN).then(function () {
            Auth.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
              auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
            });
            Auth.mode = 'supabase';
            /* Fournisseurs réellement activés dans Supabase (Google, Apple…) : on n'affiche que ceux qui marchent */
            fetch(cfg.supabaseUrl + '/auth/v1/settings', { headers: { apikey: cfg.supabaseAnonKey } })
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (j) { if (j && j.external) { Lerna.config.providers = j.external; Lerna.emit('lerna:providers', j.external); } })
              .catch(function () {});
            Auth.sb.auth.onAuthStateChange(function (event, session) {
              if (event === 'PASSWORD_RECOVERY') Lerna.emit('lerna:recovery');
              if (event === 'SIGNED_OUT') { Auth.user = null; store.del('lerna_user_cache'); renderChrome(); Lerna.emit('lerna:auth', null); }
            });
            return Auth.sb.auth.getSession().then(function (r) {
              var s = r.data && r.data.session;
              if (s && s.user) return Auth._load(s.user);
              Auth.user = null;
            });
          }).catch(function () {
            Auth.mode = 'demo';
            Auth.user = store.get('lerna_user_cache', null) || store.get('lerna_user', null);
          });
        }
        Auth.mode = 'demo';
        Auth.user = store.get('lerna_user', null);
      }).then(function () {
        renderChrome();
        Lerna.emit('lerna:auth', Auth.user);
        return Auth.user;
      });
    },
    signUp: function (f) {
      if (Auth.mode === 'supabase') {
        return Auth.sb.auth.signUp({
          email: f.email, password: f.password,
          options: {
            data: { prenom: f.prenom, nom: f.nom, pseudo: f.pseudo || '', pays: f.pays, niveau: f.niveau, genre: f.genre || '', naissance: f.naissance || '', ab: Lerna.ab.all() },
            emailRedirectTo: location.origin + '/auth.html?verified=1'
          }
        }).then(function (r) {
          if (r.error) throw r.error;
          if (!r.data.session) return { needsVerification: true };
          /* Confirmation d'email désactivée dans Supabase : la personne est connectée tout de suite */
          return Auth._load(r.data.user).then(function () { renderChrome(); Lerna.emit('lerna:auth', Auth.user); return { needsVerification: false }; });
        });
      }
      var accounts = store.get('lerna_demo_accounts', {});
      var email = f.email.trim().toLowerCase();
      if (accounts[email]) return Promise.reject({ code: 'exists' });
      return sha256(email + '|' + f.password).then(function (h) {
        var u = { id: 'local-' + Date.now().toString(36), email: email, prenom: f.prenom, nom: f.nom, pseudo: f.pseudo || '', pays: f.pays, niveau: f.niveau, genre: f.genre || '', naissance: f.naissance || '', is_premium: false, created: new Date().toISOString(), verified: true };
        accounts[email] = { hash: h, user: u };
        store.set('lerna_demo_accounts', accounts);
        store.set('lerna_user', u);
        Auth.user = u; renderChrome(); Lerna.emit('lerna:auth', u);
        return { needsVerification: false };
      });
    },
    signIn: function (email, password) {
      if (Auth.mode === 'supabase') {
        return Auth.sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
          if (r.error) {
            /* Compte créé en « mode aperçu » (seulement sur cet appareil) : on le dit clairement au lieu de « mot de passe incorrect » */
            var demo = store.get('lerna_demo_accounts', {});
            if (/invalid login/i.test(r.error.message || '') && demo[String(email).trim().toLowerCase()]) throw { code: 'demo_account' };
            throw r.error;
          }
          return Auth._load(r.data.user).then(function () { renderChrome(); Lerna.emit('lerna:auth', Auth.user); return Auth.user; });
        });
      }
      var accounts = store.get('lerna_demo_accounts', {});
      var key = email.trim().toLowerCase();
      var acc = accounts[key];
      if (!acc) return Promise.reject({ code: 'invalid' });
      return sha256(key + '|' + password).then(function (h) {
        if (h !== acc.hash) throw { code: 'invalid' };
        store.set('lerna_user', acc.user); Auth.user = acc.user; renderChrome(); Lerna.emit('lerna:auth', acc.user);
        return acc.user;
      });
    },
    oauth: function (provider, redirect) {
      if (Auth.mode !== 'supabase') return Promise.reject({ code: 'demo' });
      return Auth.sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: location.origin + '/' + (redirect || 'espace.html') } })
        .then(function (r) { if (r.error) throw r.error; });
    },
    google: function (redirect) { return Auth.oauth('google', redirect); },
    /* Connexion avec Apple : active seulement quand APPLE_LOGIN_ENABLED=true (voir README, section Apple) */
    apple: function (redirect) { return Auth.oauth('apple', redirect); },
    resetPassword: function (email) {
      if (Auth.mode !== 'supabase') return Promise.reject({ code: 'demo' });
      return Auth.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/auth.html?mode=recovery' })
        .then(function (r) { if (r.error) throw r.error; });
    },
    updatePassword: function (pw) {
      if (Auth.mode !== 'supabase') return Promise.reject({ code: 'demo' });
      return Auth.sb.auth.updateUser({ password: pw }).then(function (r) { if (r.error) throw r.error; });
    },
    updateProfile: function (fields) {
      if (!Auth.user) return Promise.reject({ code: 'nouser' });
      Object.assign(Auth.user, fields);
      if (Auth.mode === 'supabase') {
        var up = {};
        ['prenom', 'nom', 'pseudo', 'pays', 'bio'].forEach(function (k) { if (fields[k] !== undefined) up[k] = fields[k]; });
        if (fields.niveau !== undefined) up.niveau_etudes = fields.niveau;
        return Auth.sb.from('users').update(up).eq('id', Auth.user.id).then(function (r) { if (r.error) throw r.error; store.set('lerna_user_cache', Auth.user); renderChrome(); });
      }
      store.set('lerna_user', Auth.user);
      var accounts = store.get('lerna_demo_accounts', {});
      if (accounts[Auth.user.email]) { accounts[Auth.user.email].user = Auth.user; store.set('lerna_demo_accounts', accounts); }
      renderChrome();
      return Promise.resolve();
    },
    signOut: function () {
      var p = Auth.mode === 'supabase' ? Auth.sb.auth.signOut() : Promise.resolve();
      return p.then(function () {
        store.del('lerna_user'); store.del('lerna_user_cache');
        Auth.user = null; renderChrome(); Lerna.emit('lerna:auth', null);
      });
    }
  };
  Auth.ready = new Promise(function (resolve) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { Auth.init().then(resolve, resolve); });
    else Auth.init().then(resolve, resolve);
  });
  /* Utilisateur connu avant la fin de l'init (évite le flash du bouton "Connexion") */
  Auth.user = store.get('lerna_user_cache', null) || store.get('lerna_user', null);

  Lerna.isLogged = function () { return !!Auth.user; };
  Lerna.isPremium = function () {
    if (!Lerna.config.premiumEnabled) return true;     // Premium pas encore lancé : tout est ouvert
    var u = Auth.user;
    if (u && u.role === 'admin') return true;          // le propriétaire a tout Premium
    if (!u || !u.is_premium) return false;
    if (u.premium_expiry && new Date(u.premium_expiry) < new Date()) return false;
    return true;
  };
  Lerna.initials = function (u) {
    u = u || Auth.user; if (!u) return '';
    var a = (u.prenom || '').trim()[0] || (u.email || '?')[0];
    var b = (u.nom || '').trim()[0] || '';
    return (a + b).toUpperCase();
  };
  Lerna.requireAuth = function (redirectTo) {
    return Auth.ready.then(function () {
      if (!Auth.user) { Lerna.go('auth.html?mode=login&redirect=' + encodeURIComponent(redirectTo || location.pathname.split('/').pop() || 'espace.html'), true); return false; }
      return true;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Favoris (local + synchro Supabase si connecté)                       */
  /* ------------------------------------------------------------------ */
  /* Sauvegarder, mettre en favori, commencer un dossier : il faut un compte.
     Sans compte, on garde l'action en attente, on envoie vers l'inscription, et l'action se fait
     toute seule dès que la personne est connectée (sans recliquer). */
  Lerna.requireAccount = function (action) {
    if (Auth.user) return true;
    action.t = Date.now();
    action.back = (location.pathname.split('/').pop() || 'index.html') + location.search + location.hash;
    store.set('lerna_pending', action);
    Sound.play('click');
    Lerna.toast(Lerna.t('acc.needed'), 2200);
    var back = action.back;
    if (!/^[a-z0-9_\-]+\.html([?#][^\s]*)?$/i.test(back)) back = 'aujourdhui.html';
    setTimeout(function () { Lerna.go('auth.html?mode=signup&redirect=' + encodeURIComponent(back)); }, 650);
    return false;
  };
  function runPending() {
    var a = store.get('lerna_pending', null);
    if (!a || !Auth.user) return;
    store.del('lerna_pending');
    if (Date.now() - (a.t || 0) > 3 * 864e5) return;
    if (a.type === 'oppSave' && !Lerna.oppFavs.has(a.id)) { Lerna.oppFavs.toggle(a.id); Lerna.toast(Lerna.t('acc.doneSave'), 2600); }
    if (a.type === 'fav' && !Lerna.favs.has(a.id)) { Lerna.favs.toggle(a.id); }
    if (a.type === 'dossier' && Lerna.dossiers && !Lerna.dossiers.get(a.id)) { Lerna.dossiers.save(a.id, { steps: {}, docs: {}, status: 'prep' }); Lerna.toast(Lerna.t('acc.doneDossier'), 2600); }
    Lerna.emit('lerna:pending', a);
  }
  Lerna.addStrings({
    fr: { 'acc.needed': 'Crée ton compte gratuit (ou connecte-toi) pour garder ça.', 'acc.doneSave': 'C’est fait : l’offre est sauvegardée dans ton compte.', 'acc.doneDossier': 'Ton dossier est créé.' },
    en: { 'acc.needed': 'Create your free account (or log in) to keep this.', 'acc.doneSave': 'Done: the offer is saved to your account.', 'acc.doneDossier': 'Your application is created.' }
  });

  Lerna.favs = {
    list: function () { return store.get('lerna_favoris', []); },
    has: function (id) { return Lerna.favs.list().indexOf(id) !== -1; },
    toggle: function (id) {
      var l = Lerna.favs.list(), i = l.indexOf(id), added = i === -1;
      if (added && !Lerna.requireAccount({ type: 'fav', id: id })) return null;
      if (added) l.push(id); else l.splice(i, 1);
      store.set('lerna_favoris', l);
      if (added && Lerna.track) Lerna.track('fav_add', id);
      if (Auth.mode === 'supabase' && Auth.user) {
        if (added) Auth.sb.from('favoris').upsert({ user_id: Auth.user.id, ecole_id: id }, { onConflict: 'user_id,ecole_id' }).then(function () {}, function () {});
        else Auth.sb.from('favoris').delete().eq('user_id', Auth.user.id).eq('ecole_id', id).then(function () {}, function () {});
      }
      Lerna.toast(Lerna.t(added ? 'common.favAdded' : 'common.favRemoved'));
      Sound.play(added ? 'select' : 'click');
      return added;
    },
    pull: function () {
      if (Auth.mode !== 'supabase' || !Auth.user) return Promise.resolve(Lerna.favs.list());
      return Auth.sb.from('favoris').select('ecole_id').eq('user_id', Auth.user.id).then(function (r) {
        if (r.error || !r.data) return Lerna.favs.list();
        var merged = Lerna.favs.list();
        r.data.forEach(function (row) { if (merged.indexOf(row.ecole_id) === -1) merged.push(row.ecole_id); });
        store.set('lerna_favoris', merged);
        return merged;
      }, function () { return Lerna.favs.list(); });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Toast & modale                                                      */
  /* ------------------------------------------------------------------ */
  var toastEl, toastTimer;
  Lerna.toast = function (msg, ms) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2800);
  };
  Lerna.modal = function (html, onOpen) {
    var wrap = doc.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    doc.body.appendChild(wrap);
    var prevOverflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
    function close() {
      wrap.classList.remove('open');
      doc.body.style.overflow = prevOverflow;
      setTimeout(function () { wrap.remove(); }, 300);
      doc.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    doc.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { wrap.classList.add('open'); });
    if (onOpen) onOpen(wrap.querySelector('.modal'), close);
    return close;
  };

  /* ------------------------------------------------------------------ */
  /* Navigation : barre du haut, panneau latéral, barre du bas, footer    */
  /* ------------------------------------------------------------------ */
  var page = function () { return doc.body ? doc.body.getAttribute('data-page') || '' : ''; };
  function hasResults() { return !!store.raw('lerna_results'); }
  function hasProfile() { return !!store.raw('lerna_profile'); }
  /* Deux accueils : découverte pour un nouveau, « Aujourd'hui » une fois le questionnaire fait */
  Lerna.homeHref = function () { return hasProfile() ? 'aujourdhui.html' : 'index.html'; };

  function langSwitch(extraCls) {
    return '<div class="lang-switch ' + (extraCls || '') + '" role="group" aria-label="' + Lerna.t('nav.language') + '">' +
      '<button type="button" data-lang="fr" class="' + (Lerna.lang === 'fr' ? 'active' : '') + '" aria-pressed="' + (Lerna.lang === 'fr') + '">FR</button>' +
      '<button type="button" data-lang="en" class="' + (Lerna.lang === 'en' ? 'active' : '') + '" aria-pressed="' + (Lerna.lang === 'en') + '">EN</button>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Habillage « appli » : barre du haut avec le titre de l'écran (comme   */
  /* Instagram, Wave, Duolingo), barre d'onglets en bas sur téléphone,     */
  /* barre latérale fixe sur ordinateur. Pas de menu burger, pas de        */
  /* sélecteur de langue ni de nom en gros : c'est une appli, pas un site. */
  /* ------------------------------------------------------------------ */
  var SCREENS = {
    home: { tab: true }, today: { tab: true },
    explorer: { tab: true, title: 'nav.explore' }, opportunites: { tab: true, title: 'nav.opps' },
    espace: { tab: true, title: 'nav.me', gear: true }, resultats: { tab: true, title: 'nav.results' },
    questionnaire: { back: 'index.html', title: 'nav.orientation' }, ecole: { back: 'explorer.html', title: 'nav.school' },
    dossier: { back: 'espace.html', title: 'nav.dossiers' }, premium: { back: 'espace.html', title: 'nav.premium' },
    parametres: { back: 'espace.html', title: 'nav.settings' }, contact: { back: 'parametres.html', title: 'nav.help' },
    legal: { back: 'parametres.html', title: 'nav.legal' }, auth: { back: 'index.html', title: '' }, admin: { back: 'parametres.html', title: 'nav.admin' }
  };
  function screen() {
    var p = page(), sc = SCREENS[p] || { back: Lerna.homeHref(), title: '' };
    if (p === 'parametres' && !Auth.user) sc = { tab: true, title: 'nav.settings' };   // sans compte, « Moi » mène aux Paramètres
    return sc;
  }
  function avatarBtn() {
    var u = Auth.user, t = Lerna.t;
    return u
      ? '<a class="ab-avatar" href="espace.html" aria-label="' + t('nav.account') + '">' + Lerna.esc(Lerna.initials(u)) + '</a>'
      : '<a class="ab-avatar guest" href="auth.html?mode=login" aria-label="' + t('nav.login') + '">' + Lerna.icon('user', 'ic-sm') + '</a>';
  }
  function renderNav() {
    var host = doc.getElementById('lerna-nav');
    if (!host) return;
    var p = page(), sc = screen(), t = Lerna.t, u = Auth.user;
    var left = '', title = sc.title ? t(sc.title) : '', right = '';
    if (sc.back) {
      left = '<button type="button" class="ab-btn ab-back" data-back="' + sc.back + '" aria-label="' + t('nav.back') + '">' + Lerna.icon('arrowL') + '</button>';
    } else if (p === 'home' || p === 'today') {
      left = '<a class="ab-mark" href="' + Lerna.homeHref() + '" aria-label="LERNA">' + Lerna.mark('', 'LERNA') + '</a>';
    }
    if (p === 'today' || (p === 'home' && hasProfile())) {
      var st = Lerna.daily && Lerna.daily.streak ? Lerna.daily.streak() : { days: 0 };
      right += '<a class="ab-streak" href="aujourdhui.html" aria-label="' + Lerna.esc(t('nav.streak', { n: st.days })) + '">' + Lerna.icon('flame', 'ic-sm') + '<span>' + st.days + '</span></a>';
    }
    if (sc.gear) right += '<a class="ab-btn" href="parametres.html" aria-label="' + t('nav.settings') + '">' + Lerna.icon('settings') + '</a>';
    if (p === 'home' && !u) right += '<a class="ab-login" href="auth.html?mode=login">' + t('nav.login') + '</a>';
    else if (p !== 'espace' && p !== 'auth' && sc.tab) right += avatarBtn();
    host.innerHTML =
      '<header class="appbar' + (sc.back ? ' is-detail' : '') + '"><div class="appbar-in">' + left +
        '<div class="appbar-title" role="heading" aria-level="1">' + Lerna.esc(title) + '</div>' +
        '<div class="appbar-actions">' + right + '</div>' +
      '</div></header>';
  }
  /* Retour : la page d'avant si on vient de LERNA, sinon l'écran parent */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-back]'); if (!b) return;
    e.preventDefault();
    var fromHere = doc.referrer && doc.referrer.indexOf(location.origin) === 0 && history.length > 1;
    if (fromHere) history.back(); else location.href = b.getAttribute('data-back');
  });
  /* La barre du haut prend un fond et un trait dès qu'on fait défiler */
  var abTick = false;
  window.addEventListener('scroll', function () {
    if (abTick) return; abTick = true;
    requestAnimationFrame(function () { abTick = false; var bar = doc.querySelector('.appbar'); if (bar) bar.classList.toggle('scrolled', window.scrollY > 4); });
  }, { passive: true });

  /* Barre latérale fixe (ordinateur et tablette en largeur) */
  function renderSide() {
    var host = doc.getElementById('lerna-side-host');
    if (!host) { host = doc.createElement('div'); host.id = 'lerna-side-host'; doc.body.appendChild(host); }
    if (doc.body.classList.contains('no-nav') || !doc.getElementById('lerna-nav')) { host.innerHTML = ''; doc.body.classList.remove('has-rail'); return; }
    doc.body.classList.add('has-rail');
    var p = page(), u = Auth.user, t = Lerna.t;
    var a = function (href, icon, key, pages) {
      var on = pages && pages.indexOf(p) !== -1;
      return '<a href="' + href + '" class="' + (on ? 'active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + Lerna.icon(icon) + '<span>' + t(key) + '</span></a>';
    };
    var userBlock = u
      ? '<a class="rail-user" href="espace.html"><span class="avatar">' + Lerna.esc(Lerna.initials(u)) + '</span><span class="rail-user-txt"><strong>' + Lerna.esc(Lerna.displayName(u) || u.email) + '</strong><span>' + (Lerna.isPaidPremium() || u.role === 'admin' ? t('nav.premiumBadge') : t('nav.free')) + '</span></span></a>'
      : '<div class="rail-auth"><a class="btn btn-primary btn-sm" href="auth.html?mode=signup">' + t('nav.signup') + '</a><a class="btn btn-ghost btn-sm" href="auth.html?mode=login">' + t('nav.login') + '</a></div>';
    host.innerHTML =
      '<aside class="rail" aria-label="' + t('nav.mainNav') + '">' +
        '<a class="logo rail-logo" href="' + Lerna.homeHref() + '">' + Lerna.logoHTML() + '</a>' +
        '<nav class="rail-links">' +
          (hasProfile() ? a('aujourdhui.html', 'flame', 'nav.today', ['today']) : a('index.html', 'home', 'nav.home', ['home'])) +
          a(hasResults() ? 'resultats.html' : 'questionnaire.html', 'compass', 'nav.orientation', ['questionnaire', 'resultats', 'loading']) +
          a('explorer.html', 'school', 'nav.explore', ['explorer', 'ecole']) +
          a('opportunites.html', 'star', 'nav.opps', ['opportunites']) +
          a('dossier.html', 'folder', 'nav.dossiers', ['dossier']) +
          (u ? a('espace.html', 'user', 'nav.me', ['espace']) : '') +
          a('premium.html', 'gem', 'nav.premium', ['premium']) +
        '</nav>' +
        '<div class="rail-bottom"><nav class="rail-links">' +
          a('parametres.html', 'settings', 'nav.settings', ['parametres', 'legal', 'admin']) +
          a('contact.html', 'help', 'nav.help', ['contact']) +
        '</nav>' + userBlock + '</div>' +
      '</aside>';
  }

  function renderBottom() {
    var host = doc.getElementById('lerna-bottom-host');
    if (doc.body.getAttribute('data-bottomnav') === 'off') { doc.body.classList.remove('has-bottom-nav'); if (host) host.innerHTML = ''; return; }
    if (!host) { host = doc.createElement('div'); host.id = 'lerna-bottom-host'; doc.body.appendChild(host); }
    doc.body.classList.add('has-bottom-nav');
    var p = page(), t = Lerna.t;
    var item = function (href, icon, key, pages) {
      var act = pages.indexOf(p) !== -1;
      return '<li><a href="' + href + '" class="' + (act ? 'active' : '') + '"' + (act ? ' aria-current="page"' : '') + '>' + Lerna.icon(icon) + '<span class="lbl">' + t(key) + '</span></a></li>';
    };
    host.innerHTML =
      '<nav class="bottom-nav" aria-label="Navigation mobile"><ul>' +
        item(hasResults() ? 'resultats.html' : 'questionnaire.html', 'compass', 'nav.orientation', ['questionnaire', 'resultats', 'loading']) +
        item('explorer.html', 'school', 'nav.explore', ['explorer', 'ecole']) +
        '<li><a href="' + Lerna.homeHref() + '" class="center' + (p === 'home' || p === 'today' ? ' active' : '') + '" aria-label="LERNA — ' + t(hasProfile() ? 'nav.today' : 'nav.home') + '"><span class="center-btn">' + Lerna.seal() + '</span></a></li>' +
        item('opportunites.html', 'star', 'nav.opps', ['opportunites']) +
        item(Auth.user ? 'espace.html' : 'parametres.html', 'user', 'nav.me', ['espace', 'auth', 'premium', 'parametres', 'contact', 'dossier', 'legal']) +
      '</ul></nav>';
    /* Bouton de la page où l'on est déjà : remonter en haut (comme Instagram ou TikTok) au lieu de rien faire */
    if (!host.__bound) {
      host.__bound = true;
      host.addEventListener('click', function (e) {
        var a = e.target.closest('a'); if (!a) return;
        if (a.classList.contains('active')) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: Prefs.get('reduceMotion') ? 'auto' : 'smooth' });
          Lerna.pop(a.querySelector('.center-btn') || a);
        }
      });
    }
  }

  /* Plus de pied de page « site web » : c'est une appli. Le © et la langue sont dans Paramètres. */
  function renderFooter() {
    var host = doc.getElementById('lerna-footer');
    if (host) { host.innerHTML = ''; host.hidden = true; }
  }

  /* Écran d'ouverture (comme Duolingo) : fond uni, petit ruban centré qui se dessine puis rebondit, « LERNA » en bas (≈ 1,5 s, sans son) */
  function splash() {
    var root = doc.documentElement;
    if (!root.hasAttribute('data-splash') || doc.getElementById('lerna-splash')) return;
    try { sessionStorage.setItem('lerna_splash', '1'); } catch (e) {}
    var calm = root.hasAttribute('data-calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var el = doc.createElement('div');
    el.id = 'lerna-splash'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="sp-mark">' + Lerna.mark('', '', { draw: true }) + '</div><div class="sp-word">LERNA</div>';
    doc.body.appendChild(el);
    if (calm) root.setAttribute('data-calm', '');
    setTimeout(function () {
      el.classList.add('out');
      root.removeAttribute('data-splash');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 420);
    }, calm ? 650 : 1550);
  }

  function renderChrome() {
    if (!doc.body) return;
    renderNav(); renderSide(); renderBottom(); renderFooter();
    splash();
    Array.prototype.forEach.call(doc.querySelectorAll('[data-mark]'), function (el) { el.innerHTML = Lerna.mark('mark-think'); });
  }
  Lerna.renderChrome = renderChrome;

  function openSide(open) {
    var panel = doc.getElementById('lerna-side'), ov = doc.querySelector('.side-overlay'), burger = doc.querySelector('.nav-burger');
    if (!panel) return;
    panel.classList.toggle('open', open); ov.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (burger) burger.setAttribute('aria-expanded', String(open));
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  /* Délégation d'événements globale */
  doc.addEventListener('click', function (e) {
    var el;
    var a = e.target.closest('a[href]');
    if (a && !a.target) Lerna.rememberQuery(a.getAttribute('href'));
    if ((el = e.target.closest('[data-lang]'))) { e.preventDefault(); Lerna.setLang(el.getAttribute('data-lang')); Sound.play('click'); return; }
    if (e.target.closest('.nav-burger')) { openSide(true); return; }
    if (e.target.closest('[data-side-close]')) { openSide(false); return; }
    if ((el = e.target.closest('[data-sound-toggle]'))) { Sound.toggle(); renderSide(); openSide(true); return; }
    if (e.target.closest('[data-logout]')) { Auth.signOut().then(function () { Lerna.go('index.html'); }); return; }
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') openSide(false); });
  window.addEventListener('resize', Lerna.debounce(function () {
    if (window.innerWidth > 768) openSide(false);
  }, 150));

  /* Apparition au scroll */
  function initReveal() {
    var els = Lerna.qsa('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  Lerna.initReveal = initReveal;

  /* ================================================================== */
  /* RÉTENTION — visites, parcours de X jours, points, niveaux            */
  /* ================================================================== */
  Lerna.addStrings({
    fr: {
      'rt.great': 'Génial !', 'rt.levelUp': 'Nouveau niveau : {level}', 'rt.levelUpText': 'Tu avances vraiment dans ton orientation. Continue comme ça.',
      'rt.streakStart': 'Ton parcours commence', 'rt.streakStartText': 'Trois visites : ton parcours LERNA est lancé. Reviens chaque jour pour le faire grandir.',
      'rt.streakBadge': 'Parcours de {n} jours', 'rt.streakBadgeText': '{n} jours à avancer sur ton avenir. Le léopard LERNA est fier de toi.',
      'ref.message': "J'ai trouvé mon orientation avec LERNA : 25 questions et l'IA te propose les écoles faites pour toi, avec les vrais coûts et les bourses. Essaie gratuitement : {link}",
      'ref.copied': 'Lien copié ✓', 'ref.whatsapp': 'WhatsApp', 'ref.share': 'Partager', 'ref.copy': 'Copier le lien',
      'rate.title': 'Tu aimes LERNA ?', 'rate.sub': 'Ton avis aide d’autres élèves à trouver leur voie.',
      'rate.comment': 'Ton avis (facultatif)', 'rate.ph': 'Ce qui t’a aidé, ce qu’on peut améliorer…',
      'rate.publish': 'J’accepte que mon avis soit publié avec mon prénom', 'rate.send': 'Envoyer mon avis', 'rate.later': 'Plus tard',
      'rate.thanks': 'Merci pour ton avis !', 'rate.thanksSub': 'Il sera lu par l’équipe LERNA. S’il est public, il apparaîtra après vérification.',
      'rate.google': 'Le laisser aussi sur Google', 'rate.pick': 'Choisis une note de 1 à 5 étoiles.', 'rate.star': '{n} étoile(s) sur 5',
      'nt.on': 'Notifications activées ✓', 'nt.denied': 'Les notifications sont bloquées dans les réglages de ton navigateur.',
      'inst.title': 'Installer LERNA', 'inst.iosTitle': 'Ajoute LERNA à ton écran d’accueil',
      'inst.ios1': 'Touche le bouton Partager en bas de Safari (le carré avec une flèche).',
      'inst.ios2': 'Choisis « Sur l’écran d’accueil », puis « Ajouter ».',
      'inst.ios3': 'Ouvre LERNA depuis sa nouvelle icône : tu pourras recevoir les alertes.',
      'inst.and1': 'Ouvre le menu du navigateur (les trois points en haut à droite).',
      'inst.and2': 'Choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
      'inst.done': 'Compris'
    },
    en: {
      'rt.great': 'Great!', 'rt.levelUp': 'New level: {level}', 'rt.levelUpText': 'You are really moving forward with your orientation. Keep it up.',
      'rt.streakStart': 'Your journey has started', 'rt.streakStartText': 'Three visits: your LERNA journey is on. Come back every day to make it grow.',
      'rt.streakBadge': '{n}-day journey', 'rt.streakBadgeText': '{n} days working on your future. The LERNA leopard is proud of you.',
      'ref.message': 'I found my path with LERNA: 25 questions and the AI suggests the schools that fit you, with real costs and scholarships. Try it for free: {link}',
      'ref.copied': 'Link copied ✓', 'ref.whatsapp': 'WhatsApp', 'ref.share': 'Share', 'ref.copy': 'Copy link',
      'rate.title': 'Do you like LERNA?', 'rate.sub': 'Your review helps other students find their way.',
      'rate.comment': 'Your review (optional)', 'rate.ph': 'What helped you, what we could improve…',
      'rate.publish': 'I agree that my review may be published with my first name', 'rate.send': 'Send my review', 'rate.later': 'Later',
      'rate.thanks': 'Thank you for your review!', 'rate.thanksSub': 'The LERNA team will read it. If it is public, it will appear after checking.',
      'rate.google': 'Leave it on Google too', 'rate.pick': 'Choose a rating from 1 to 5 stars.', 'rate.star': '{n} star(s) out of 5',
      'nt.on': 'Notifications on ✓', 'nt.denied': 'Notifications are blocked in your browser settings.',
      'inst.title': 'Install LERNA', 'inst.iosTitle': 'Add LERNA to your home screen',
      'inst.ios1': 'Tap the Share button at the bottom of Safari (the square with an arrow).',
      'inst.ios2': 'Choose "Add to Home Screen", then "Add".',
      'inst.ios3': 'Open LERNA from its new icon: you will be able to receive alerts.',
      'inst.and1': 'Open the browser menu (the three dots at the top right).',
      'inst.and2': 'Choose "Install app" or "Add to Home screen".',
      'inst.done': 'Got it'
    }
  });

  function addDays(key, n) {
    var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  Lerna.addDays = addDays;
  /* [points gagnés, nombre max de fois par jour] — les points ne descendent jamais */
  var XP_RULES = {
    visit: [5, 1], questionnaire_done: [50, 1], profile_update: [30, 1], results_view: [2, 1], signup: [30, 1],
    school_view: [3, 4], fav_add: [5, 3], opp_save: [5, 3], opp_open: [2, 3], opps_visit: [2, 1],
    quiz_answer: [3, 1], quiz_correct: [10, 1], word_read: [3, 1], chat_msg: [3, 3], tracker_add: [10, 2],
    compare: [5, 1], invite_share: [5, 1], mission_bonus: [25, 1], rating: [5, 1], referral_confirmed: [40, 3],
    dossier_start: [15, 1], dossier_step: [15, 3], letter_review: [10, 1], interview_review: [10, 1], cv_print: [10, 1]
  };
  var LEVELS = Lerna.LEVELS = [
    { id: 'explorateur', min: 0, img: 'compass', label: { fr: 'Explorateur', en: 'Explorer' } },
    { id: 'chercheur', min: 150, img: 'magnifier', label: { fr: 'Chercheur', en: 'Seeker' } },
    { id: 'stratege', min: 400, img: 'chess', label: { fr: 'Stratège', en: 'Strategist' } },
    { id: 'expert', min: 900, img: 'trophy', label: { fr: 'Expert', en: 'Expert' } }
  ];
  var Daily = Lerna.daily = {
    log: function () {
      var l = store.get('lerna_daylog', null);
      if (!l || l.d !== Lerna.today()) l = { d: Lerna.today(), ev: {}, xp: {} };
      return l;
    },
    visits: function () { return store.get('lerna_visits', null) || { first: null, days: [] }; },
    did: function (ev, id) {
      var e = Daily.log().ev[ev];
      if (!e || !e.length) return false;
      return id ? e.indexOf(id) !== -1 : true;
    },
    xp: function () { return Math.max(0, parseInt(store.get('lerna_xp', 0), 10) || 0); },
    level: function (xp) {
      xp = xp === undefined ? Daily.xp() : xp;
      var cur = LEVELS[0], next = LEVELS[1];
      LEVELS.forEach(function (l, i) { if (xp >= l.min) { cur = l; next = LEVELS[i + 1] || null; } });
      return { cur: cur, next: next, xp: xp, pct: next ? Math.round(100 * (xp - cur.min) / (next.min - cur.min)) : 100 };
    },
    /* Parcours : jours consécutifs, avec un « joker » d'un jour manqué par semaine */
    streak: function () {
      var v = Daily.visits(), set = {};
      v.days.forEach(function (d) { set[d] = 1; });
      var cur = Lerna.today(); if (!set[cur]) cur = addDays(cur, -1);
      var n = 0, i = 0, lastJoker = -99;
      while (i < 1000) {
        if (set[cur]) n++;
        else if (n > 0 && i - lastJoker >= 7 && set[addDays(cur, -1)]) lastJoker = i;
        else break;
        cur = addDays(cur, -1); i++;
      }
      return { days: n, total: v.days.length, started: v.days.length >= 3 };
    },
    recordVisit: function () {
      var v = Daily.visits(), today = Lerna.today();
      if (!v.first) v.first = new Date().toISOString();
      if (v.days.indexOf(today) !== -1) { store.set('lerna_visits', v); return false; }
      v.days.push(today); v.days = v.days.slice(-400);
      store.set('lerna_visits', v);
      Lerna.track('visit');
      Lerna.notify.tags();
      return true;
    },
    /* Célébrations : début du parcours (3e jour de visite), puis 7, 30, 100 et 365 jours */
    milestones: function () {
      if (['loading', 'questionnaire', 'auth'].indexOf(page()) !== -1) return;
      var v = Daily.visits(), s = Daily.streak(), seen = store.get('lerna_badges', []);
      var mark = function (k) { seen.push(k); store.set('lerna_badges', seen); };
      if (v.days.length >= 3 && seen.indexOf('start') === -1) {
        mark('start');
        setTimeout(function () { Lerna.celebrate({ img: 'fire', title: Lerna.t('rt.streakStart'), text: Lerna.t('rt.streakStartText'), sound: 'streak' }); }, 1200);
        return;
      }
      [365, 100, 30, 7].some(function (m) {
        if (s.days >= m && seen.indexOf('s' + m) === -1) {
          mark('s' + m);
          setTimeout(function () { Lerna.celebrate({ img: 'leopard', title: Lerna.t('rt.streakBadge', { n: m }), text: Lerna.t('rt.streakBadgeText', { n: m }), sound: 'streak' }); }, 1200);
          return true;
        }
        return false;
      });
    }
  };
  Lerna.track = function (ev, id) {
    var l = Daily.log();
    var list = l.ev[ev] || (l.ev[ev] = []);
    list.push(id || 1);
    if (list.length > 60) l.ev[ev] = list.slice(-60);
    var rule = XP_RULES[ev], gained = 0;
    if (rule) { var n = l.xp[ev] || 0; if (n < rule[1]) { l.xp[ev] = n + 1; gained = rule[0]; } }
    store.set('lerna_daylog', l);
    if (gained) {
      var before = Daily.xp(), after = before + gained;
      store.set('lerna_xp', after);
      var lb = Daily.level(before).cur, la = Daily.level(after).cur;
      if (la.id !== lb.id) setTimeout(function () { Lerna.celebrate({ img: la.img, title: Lerna.t('rt.levelUp', { level: Lerna.L(la.label) }), text: Lerna.t('rt.levelUpText'), sound: 'levelup' }); }, 700);
    }
    Lerna.emit('lerna:track', { ev: ev, id: id, xp: gained });
    return gained;
  };

  /* Confettis aux couleurs LERNA (désactivés si l'utilisateur limite les animations) */
  Lerna.confetti = function () {
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var c = doc.createElement('canvas'), ctx = c.getContext('2d'); if (!ctx) return;
    var W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    c.style.cssText = 'position:fixed;inset:0;z-index:400;pointer-events:none';
    doc.body.appendChild(c);
    var cols = ['#E8640C', '#3D1F00', '#FAF3E0', '#B84A06', '#E8D9B8'], P = [];
    for (var i = 0; i < 110; i++) P.push({ x: W / 2 + (Math.random() - .5) * 60, y: H * .38, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function tick(now) {
      var k = (now - t0) / 1700; ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
      if (k < 1) requestAnimationFrame(tick); else c.remove();
    })(t0);
  };
  Lerna.celebrate = function (o) {
    Lerna.confetti();
    Sound.play(o.sound || 'success');
    Lerna.modal('<div class="celebrate">' + Lerna.sticker(o.img || 'party', 'celebrate-stk') + '<h2>' + Lerna.esc(o.title) + '</h2>' +
      (o.text ? '<p>' + Lerna.esc(o.text) + '</p>' : '') +
      '<button type="button" class="btn btn-primary btn-block" data-close>' + Lerna.t('rt.great') + '</button></div>');
  };

  /* ================================================================== */
  /* PARRAINAGE — 3 amis inscrits débloquent les écoles n°3 et n°4         */
  /* ================================================================== */
  function localCode(seed) {
    var h = 0, s = String(seed || 'lerna'); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', out = '';
    for (var j = 0; j < 6; j++) { out += a[h % a.length]; h = Math.floor(h / a.length) || (h * 7 + j + 11); }
    return out;
  }
  var REF_NEEDED = 3;
  Lerna.referral = {
    needed: REF_NEEDED,
    cached: function () { return store.get('lerna_ref_status', null); },
    confirmed: function () { var s = Lerna.referral.cached(); return Math.max(0, (s && s.confirmed) || 0); },
    unlocked: function () { return Lerna.referral.confirmed() >= REF_NEEDED; },
    code: function () {
      var u = Auth.user; if (!u) return '';
      var s = Lerna.referral.cached();
      return u.ref_code || (s && s.code) || localCode(u.id);
    },
    link: function () {
      var base = (Lerna.config.appUrl || location.origin || '').replace(/\/$/, '');
      if (!/^https?:/.test(base)) base = 'https://lerna.world';
      return base + '/?ref=' + encodeURIComponent(Lerna.referral.code());
    },
    refresh: function () {
      if (!Auth.user || Auth.mode !== 'supabase') return Promise.resolve(Lerna.referral.cached());
      return Lerna.api('/api/referral', { action: 'status' }).then(function (r) {
        if (r.ok && r.data) {
          var prev = Lerna.referral.confirmed();
          store.set('lerna_ref_status', { code: r.data.code, confirmed: r.data.confirmed || 0, pending: r.data.pending || 0, t: Date.now() });
          for (var i = prev; i < Math.min(r.data.confirmed || 0, REF_NEEDED); i++) Lerna.track('referral_confirmed');
          Lerna.emit('lerna:referral', r.data);
        }
        return Lerna.referral.cached();
      });
    },
    claim: function () {
      var code = store.get('lerna_ref', null);
      if (!code || !Auth.user || Auth.mode !== 'supabase') return Promise.resolve();
      return Lerna.api('/api/referral', { action: 'claim', code: code }).then(function (r) {
        if (r.ok || (r.status >= 400 && r.status < 500)) store.del('lerna_ref');
      });
    },
    /* Lien WhatsApp prêt à l'emploi (un vrai lien marche partout, même là où les fenêtres surgissantes sont bloquées) */
    waHref: function () { return 'https://wa.me/?text=' + encodeURIComponent(Lerna.t('ref.message', { link: Lerna.referral.link() })); },
    share: function (via, fromLink) {
      Lerna.track('invite_share');
      if (via === 'whatsapp') { if (!fromLink) window.open(Lerna.referral.waHref(), '_blank', 'noopener'); return; }
      if (via === 'native' && navigator.share) {
        navigator.share({ title: 'LERNA', text: Lerna.t('ref.message', { link: Lerna.referral.link() }) }).catch(function () { Lerna.referral.share('copy'); });
        return;
      }
      var link = Lerna.referral.link();
      var done = function () { Lerna.toast(Lerna.t('ref.copied')); Sound.play('select'); };
      var manual = function () {
        Lerna.modal('<div class="modal-head"><h3>' + Lerna.t('ref.copy') + '</h3><button class="modal-close" data-close aria-label="' + Lerna.t('common.close') + '">' + Lerna.icon('x') + '</button></div>' +
          '<input class="input" id="refLinkTxt" readonly value="' + Lerna.esc(link) + '">', function (m) { var i = m.querySelector('#refLinkTxt'); i.focus(); i.select(); });
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, manual);
        else manual();
      } catch (e) { manual(); }
    }
  };
  /* Accès aux recommandations : 2 gratuites, n°3-4 par parrainage (ou Premium), n°5 Premium.
     Tant que le Premium n'est pas lancé, les n°3 à 5 se débloquent toutes par parrainage. */
  Lerna.isPaidPremium = function () { return !!Lerna.config.premiumEnabled && Lerna.isPremium(); };
  Lerna.recoAccess = function (i) {
    if (i < 2 || Lerna.isPaidPremium()) return 'open';
    var ref = Lerna.referral.unlocked();
    if (!Lerna.config.premiumEnabled || i <= 3) return ref ? 'open' : 'ref';
    return 'premium';
  };

  /* ------------------------------------------------------------------ */
  /* Nouvel appareil (ou appli sur l'écran d'accueil) : tout revient du compte */
  /* Questionnaire, résultats, flammes, points et badges sont relus depuis    */
  /* Supabase quand ils manquent sur l'appareil.                              */
  /* ------------------------------------------------------------------ */
  var Q_COLS = { q1: 'age_range', q2: 'niveau', q3: 'bac', q4: 'pays_actuel', q5: 'langues', q6: 'matieres_fortes', q7: 'matieres_faibles', q8: 'profil_type',
    q9: 'style_travail', q10: 'a_laise_avec', q11: 'vision_10ans', q12: 'objectif_pro', q13: 'destination', q14: 'priorites', q15: 'secteurs', q16: 'financement',
    q17: 'budget', q18: 'mobilite', q19: 'travail_pendant', q20: 'duree_formation', q21: 'mode_apprentissage', q22: 'theorique_pratique', q23: 'reconnaissance',
    q24: 'organisation', q25: 'vie_campus' };
  Lerna.restoreFromAccount = function () {
    if (Auth.mode !== 'supabase' || !Auth.user) return Promise.resolve(false);
    var uid = Auth.user.id, jobs = [], changed = false;
    if (!store.raw('lerna_profile')) {
      jobs.push(Auth.sb.from('profils').select('*').eq('user_id', uid).order('date_creation', { ascending: false }).limit(1).then(function (r) {
        var row = r.data && r.data[0];
        if (!row) return;
        var a = {};
        Object.keys(Q_COLS).forEach(function (k) { var v = row[Q_COLS[k]]; if (v !== null && v !== undefined && v !== '') a[k] = v; });
        if (row.langues_niveaux) a.q5_lvl = row.langues_niveaux;
        if (row.autres && typeof row.autres === 'object') Object.keys(row.autres).forEach(function (k) { a[k + '_autre'] = row.autres[k]; });
        if (row.note_libre) a.note = row.note_libre;
        if (!Object.keys(a).length || store.raw('lerna_profile')) return;
        var when = row.date_creation || new Date().toISOString();
        store.set('lerna_profile', { answers: a, completed: when, lang: Lerna.lang, restored: true });
        store.set('lerna_synced', uid + '|' + when);   // déjà sur le compte : pas de nouvel envoi
        changed = true;
      }, function () {}));
    }
    if (!store.raw('lerna_results')) {
      jobs.push(Auth.sb.from('recommandations').select('*').eq('user_id', uid).order('date_generation', { ascending: false }).limit(1).then(function (r) {
        var row = r.data && r.data[0];
        if (!row || store.raw('lerna_results')) return;
        var recos = [row.reco_1_json, row.reco_2_json, row.reco_3_json, row.reco_4_json, row.reco_5_json].filter(Boolean);
        if (!recos.length) return;
        store.set('lerna_results', { resume: row.resume || '', recos: recos, conseil: row.conseil || '', source: row.source || 'ai', date: row.date_generation, lang: 'fr', id: row.id });
        changed = true;
      }, function () {}));
    }
    /* Flammes, points, badges : on garde le meilleur des deux (appareil + compte) */
    var pr = Auth.user.progress;
    if (pr && typeof pr === 'object') {
      var v = Daily.visits(), set = {};
      v.days.concat(Array.isArray(pr.days) ? pr.days : []).forEach(function (d) { if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set[d] = 1; });
      var days = Object.keys(set).sort();
      var first = [v.first, pr.first].filter(Boolean).sort()[0] || null;
      if (days.length !== v.days.length || first !== v.first) { store.set('lerna_visits', { first: first, days: days.slice(-400) }); changed = true; }
      var xp = Math.max(Daily.xp(), parseInt(pr.xp, 10) || 0);
      if (xp !== Daily.xp()) { store.set('lerna_xp', xp); changed = true; }
      var b = store.get('lerna_badges', []);
      (Array.isArray(pr.badges) ? pr.badges : []).forEach(function (k) { if (b.indexOf(k) === -1) { b.push(k); changed = true; } });
      store.set('lerna_badges', b);
    }
    return Promise.all(jobs).then(function () {
      Lerna.pushProgress();
      if (changed) Lerna.emit('lerna:restored', {});
      return changed;
    });
  };
  /* Envoie les flammes / points / badges au compte (au plus une fois par minute) */
  var lastProgress = '';
  Lerna.pushProgress = function () {
    if (Auth.mode !== 'supabase' || !Auth.user || !Auth.sb) return;
    var v = Daily.visits();
    var snap = { first: v.first, days: v.days.slice(-400), xp: Daily.xp(), badges: store.get('lerna_badges', []).slice(-100) };
    var k = JSON.stringify(snap);
    if (k === lastProgress) return;
    lastProgress = k;
    Auth.user.progress = snap;
    Auth.sb.from('users').update({ progress: snap }).eq('id', Auth.user.id).then(function () {}, function () {});
  };
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'hidden') Lerna.pushProgress(); });

  /* Envoie au serveur le questionnaire fait AVANT la création du compte (sauvegarde + parrainage) */
  Lerna.syncProfile = function () {
    if (Auth.mode !== 'supabase' || !Auth.user) return Promise.resolve();
    var prof = store.get('lerna_profile', null), res = store.get('lerna_results', null);
    if (!prof || !prof.answers) return Promise.resolve();
    var key = Auth.user.id + '|' + (prof.updated || prof.completed);
    if (store.get('lerna_synced', null) === key) return Promise.resolve();
    return Lerna.api('/api/profile', { raw: prof.answers, results: res }).then(function (r) { if (r.ok) store.set('lerna_synced', key); });
  };

  /* ================================================================== */
  /* AVIS — demandés après un bon moment, jamais à la première visite      */
  /* ================================================================== */
  Lerna.askRating = function (trigger) {
    var st = store.get('lerna_rating', null);
    if (st && (st.done || (st.later && Date.now() - st.later < 30 * 864e5))) return false;
    if (Daily.visits().days.length < 2 || Lerna._ratingOpen) return false;
    Lerna._ratingOpen = true;
    setTimeout(function () { openRating(trigger); }, 900);
    return true;
  };
  function openRating(trigger) {
    var t = Lerna.t, note = 0;
    var stars = [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="rate-star" data-n="' + n + '" aria-label="' + t('rate.star', { n: n }) + '">' + Lerna.icon('star', 'ic-fill') + '</button>'; }).join('');
    Lerna.modal(
      '<div class="rate">' + Lerna.sticker('heart', 'rate-stk') + '<h2>' + t('rate.title') + '</h2><p class="muted">' + t('rate.sub') + '</p>' +
      '<div class="rate-stars" role="group">' + stars + '</div>' +
      '<div class="rate-more hidden"><label class="label" for="rateTxt">' + t('rate.comment') + '</label><textarea class="textarea" id="rateTxt" maxlength="600" placeholder="' + Lerna.esc(t('rate.ph')) + '"></textarea>' +
      '<label class="toggle-line"><input type="checkbox" id="ratePub"' + (Prefs.get('profilePublic') === false ? '' : ' checked') + '> <span>' + t('rate.publish') + '</span></label></div>' +
      '<p class="field-error" id="rateErr" role="alert"></p>' +
      '<div class="rate-actions"><button type="button" class="btn btn-primary btn-block" id="rateSend">' + t('rate.send') + '</button><button type="button" class="btn-link" id="rateLater" data-close>' + t('rate.later') + '</button></div></div>',
      function (m, close) {
        var paint = function () { Lerna.qsa('.rate-star', m).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-n') <= note); }); };
        m.addEventListener('click', function (e) {
          var s = e.target.closest('.rate-star');
          if (s) { note = +s.getAttribute('data-n'); paint(); m.querySelector('.rate-more').classList.remove('hidden'); Sound.play('select'); return; }
          if (e.target.closest('#rateLater')) { store.set('lerna_rating', { later: Date.now() }); Lerna._ratingOpen = false; return; }
          if (e.target.closest('#rateSend')) {
            if (!note) { m.querySelector('#rateErr').textContent = t('rate.pick'); return; }
            var body = { note: note, commentaire: m.querySelector('#rateTxt').value.slice(0, 600), publier: m.querySelector('#ratePub').checked, lang: Lerna.lang, trigger: trigger || '' };
            store.set('lerna_rating', { done: Date.now(), note: note });
            Lerna.track('rating');
            if (Lerna.config.live) Lerna.api('/api/review', body);
            var g = Lerna.config.googleReviewUrl;
            m.innerHTML = '<div class="rate">' + Lerna.sticker('party', 'rate-stk') + '<h2>' + t('rate.thanks') + '</h2><p class="muted">' + t('rate.thanksSub') + '</p>' +
              (g ? '<a class="btn btn-white btn-block" href="' + Lerna.esc(g) + '" target="_blank" rel="noopener" style="margin-top:16px">' + Lerna.icon('star') + t('rate.google') + '</a>' : '') +
              '<button type="button" class="btn btn-primary btn-block" data-close style="margin-top:12px">' + t('rt.great') + '</button></div>';
            Lerna._ratingOpen = false;
            Sound.play('success');
          }
        });
      });
  }

  /* ================================================================== */
  /* INSTALLATION (PWA) ET NOTIFICATIONS                                   */
  /* ================================================================== */
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; Lerna.emit('lerna:installable'); });
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function standalone() { try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { return false; } }
  Lerna.install = {
    installed: standalone,
    available: function () { return !standalone() && (!!deferredInstall || isIOS()); },
    prompt: function () {
      if (deferredInstall) {
        var p = deferredInstall; deferredInstall = null; p.prompt();
        return p.userChoice.then(function (c) { return c.outcome; }, function () { return 'dismissed'; });
      }
      Lerna.install.guide(); return Promise.resolve('guide');
    },
    guide: function () {
      var t = Lerna.t, ios = isIOS();
      var steps = ios ? ['inst.ios1', 'inst.ios2', 'inst.ios3'] : ['inst.and1', 'inst.and2'];
      Lerna.modal('<div class="rate">' + Lerna.sticker('mobile', 'rate-stk') + '<h2>' + t(ios ? 'inst.iosTitle' : 'inst.title') + '</h2>' +
        '<ol class="inst-steps">' + steps.map(function (k) { return '<li>' + t(k) + '</li>'; }).join('') + '</ol>' +
        '<button type="button" class="btn btn-primary btn-block" data-close>' + t('inst.done') + '</button></div>');
    }
  };

  var osPromise = null;
  function oneSignal() {
    var id = Lerna.config.onesignalAppId;
    if (!id || !Lerna.config.live || location.protocol !== 'https:') return Promise.resolve(null);
    if (osPromise) return osPromise;
    osPromise = new Promise(function (resolve) {
      var to = setTimeout(function () { resolve(null); }, 12000);
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(function (OneSignal) {
        OneSignal.init({ appId: id, serviceWorkerPath: 'sw.js?os=1', serviceWorkerParam: { scope: '/' }, notifyButton: { enable: false } })
          .then(function () {
            try { if (Auth.user) OneSignal.login(Auth.user.id); } catch (e) {}
            clearTimeout(to); resolve(OneSignal);
          }, function () { clearTimeout(to); resolve(null); });
      });
      Lerna.loadScript('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js').catch(function () { clearTimeout(to); resolve(null); });
    });
    return osPromise;
  }
  Lerna.notify = {
    supported: function () { return 'Notification' in window && 'serviceWorker' in navigator; },
    needsInstall: function () { return isIOS() && !standalone(); },
    granted: function () { return 'Notification' in window && Notification.permission === 'granted'; },
    /* Demande seulement après 48 h d'utilisation et au moins 2 jours de visite, jamais au premier contact */
    canAsk: function () {
      var st = store.get('lerna_notify', null);
      if (st && (st.perm || (st.later && Date.now() - st.later < 7 * 864e5))) return false;
      if (!Lerna.notify.needsInstall() && (!Lerna.notify.supported() || Notification.permission !== 'default')) return false;
      var v = Daily.visits();
      if (!v.first || v.days.length < 2) return false;
      return Date.now() - new Date(v.first).getTime() >= 48 * 3600e3;
    },
    later: function () { store.set('lerna_notify', { later: Date.now() }); },
    ask: function () {
      if (Lerna.notify.needsInstall()) { Lerna.install.guide(); return Promise.resolve('install'); }
      if (!Lerna.notify.supported()) return Promise.resolve('unsupported');
      return oneSignal().then(function (os) {
        if (os) return Promise.resolve(os.Notifications.requestPermission()).then(function () { return Notification.permission; });
        return Notification.requestPermission();
      }).then(function (perm) {
        store.set('lerna_notify', { asked: Date.now(), perm: perm });
        if (perm === 'granted') { Lerna.toast(Lerna.t('nt.on')); Sound.play('success'); Lerna.notify.tags(); }
        else if (perm === 'denied') Lerna.toast(Lerna.t('nt.denied'), 4000);
        return perm;
      }, function () { return 'error'; });
    },
    /* Étiquettes OneSignal : servent à envoyer le bon message, à l'heure locale, sans spam */
    tags: function () {
      if (!Lerna.notify.granted() || !Lerna.config.onesignalAppId) return;
      oneSignal().then(function (os) {
        if (!os) return;
        var u = Auth.user || {}, s = Daily.streak(), prof = store.get('lerna_profile', null);
        try {
          /* Réglages des notifications (Paramètres) : types, heure, fréquence — lus par /api/cron-daily */
          var P = Prefs.all(), n = P.notif;
          os.User.addTags({
            last_visit: String(Math.floor(Date.now() / 1000)), streak: String(s.days), lang: Lerna.lang,
            prenom: (Lerna.displayName(u) || '').slice(0, 40), pays: (u.pays || (prof && prof.answers && prof.answers.q4) || '').slice(0, 2),
            n_mission: n.mission ? '1' : '0', n_bourses: n.bourses ? '1' : '0', n_deadlines: n.deadlines ? '1' : '0',
            n_parcours: n.parcours ? '1' : '0', n_news: n.news ? '1' : '0',
            n_hour: String(P.notifHour), n_freq: String(P.notifMax)
          });
        } catch (e) {}
      });
    }
  };

  /* Bourses et offres sauvegardées */
  Lerna.oppFavs = {
    list: function () { return store.get('lerna_opp_favs', []); },
    has: function (id) { return Lerna.oppFavs.list().indexOf(id) !== -1; },
    toggle: function (id) {
      var l = Lerna.oppFavs.list(), i = l.indexOf(id), added = i === -1;
      if (added && !Lerna.requireAccount({ type: 'oppSave', id: id })) return null;
      if (added) l.push(id); else l.splice(i, 1);
      store.set('lerna_opp_favs', l);
      if (Auth.mode === 'supabase' && Auth.user) {
        if (added) Auth.sb.from('opp_favoris').upsert({ user_id: Auth.user.id, opp_id: id }, { onConflict: 'user_id,opp_id' }).then(function () {}, function () {});
        else Auth.sb.from('opp_favoris').delete().eq('user_id', Auth.user.id).eq('opp_id', id).then(function () {}, function () {});
      }
      if (added) { Lerna.track('opp_save', id); Lerna.askRating('opp_save'); }
      Sound.play(added ? 'select' : 'click');
      return added;
    }
  };

  /* Compte : export des données, effacement local, suppression (Paramètres et Mon espace) */
  var LOCAL_KEYS = ['lerna_profile', 'lerna_results', 'lerna_history', 'lerna_favoris', 'lerna_opp_favs', 'lerna_chat', 'lerna_tracker', 'lerna_reminders', 'lerna_reviews',
    'lerna_visits', 'lerna_xp', 'lerna_badges', 'lerna_dossiers', 'lerna_cv', 'lerna_prefs'];
  Lerna.account = {
    exportData: function () {
      var u = Auth.user || {};
      var data = { exported: new Date().toISOString(), user: u.email ? { email: u.email, prenom: u.prenom, nom: u.nom, pseudo: u.pseudo || null, pays: u.pays, niveau: u.niveau, bio: u.bio } : null };
      LOCAL_KEYS.forEach(function (k) { data[k.replace('lerna_', '')] = store.get(k, null); });
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lerna-mes-donnees.json'; doc.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      A.capture('data_export');
    },
    /* « Effacer l'historique » : conversations, analyses passées et traces de navigation (pas le profil ni les dossiers) */
    clearHistory: function () {
      ['lerna_chat', 'lerna_chat_count', 'lerna_history', 'lerna_daily_seen', 'lerna_daylog', 'lerna_reports', 'lerna_quiz_day', 'lerna_coach'].forEach(store.del);
      try { sessionStorage.clear(); } catch (e) {}
    },
    wipeLocal: function () {
      LOCAL_KEYS.concat(['lerna_user', 'lerna_user_cache', 'lerna_chat_count', 'lerna_progress', 'lerna_daylog', 'lerna_ref_status', 'lerna_synced', 'lerna_rating', 'lerna_notify',
        'lerna_daily_seen', 'lerna_dossier_day', 'lerna_coach', 'lerna_reports', 'lerna_geo']).forEach(store.del);
    }
  };

  /* « Mon dossier » : une candidature par école choisie (étapes, documents, brouillons, suivi).
     Gardé sur l'appareil et synchronisé avec le compte (table dossiers) quand la personne est connectée. */
  var dossierTimers = {};
  Lerna.dossiers = {
    all: function () { return store.get('lerna_dossiers', {}) || {}; },
    get: function (id) { return Lerna.dossiers.all()[id] || null; },
    ids: function () {
      var a = Lerna.dossiers.all();
      return Object.keys(a).sort(function (x, y) { return String(a[y].updated || '').localeCompare(String(a[x].updated || '')); });
    },
    save: function (id, d) {
      if (!/^[a-z0-9-]{1,40}$/.test(id)) return;
      var a = Lerna.dossiers.all(); d.updated = new Date().toISOString(); if (!d.created) d.created = d.updated;
      a[id] = d; store.set('lerna_dossiers', a);
      Lerna.emit('lerna:dossier', { id: id });
      if (Auth.mode === 'supabase' && Auth.user) {
        clearTimeout(dossierTimers[id]);
        dossierTimers[id] = setTimeout(function () {
          Auth.sb.from('dossiers').upsert({ user_id: Auth.user.id, school_id: id, data: d, updated_at: d.updated }, { onConflict: 'user_id,school_id' }).then(function () {}, function () {});
        }, 800);
      }
    },
    remove: function (id) {
      var a = Lerna.dossiers.all(); delete a[id]; store.set('lerna_dossiers', a);
      if (Auth.mode === 'supabase' && Auth.user) Auth.sb.from('dossiers').delete().eq('user_id', Auth.user.id).eq('school_id', id).then(function () {}, function () {});
      Lerna.emit('lerna:dossier', { id: id, removed: true });
    },
    /* Après connexion : récupère les dossiers du compte (le plus récent gagne) */
    pull: function () {
      if (Auth.mode !== 'supabase' || !Auth.user) return Promise.resolve(false);
      return Auth.sb.from('dossiers').select('school_id,data,updated_at').then(function (r) {
        if (r.error || !Array.isArray(r.data)) return false;
        var a = Lerna.dossiers.all(), changed = false;
        r.data.forEach(function (row) {
          var mine = a[row.school_id];
          if (!mine || String(row.data && row.data.updated || '') > String(mine.updated || '')) { a[row.school_id] = row.data; changed = true; }
        });
        if (changed) { store.set('lerna_dossiers', a); Lerna.emit('lerna:dossier', {}); }
        return changed;
      }, function () { return false; });
    }
  };

  /* « Signaler une offre expirée » : envoyé à l'équipe (table signalements, visible dans /admin) */
  Lerna.addStrings({
    fr: {
      'rep.title': 'Signaler cette offre', 'rep.sub': 'Merci ! L’équipe revérifie l’offre sur le site officiel et la retire si elle n’est plus valable.',
      'rep.expiree': 'L’offre est clôturée ou expirée', 'rep.lien': 'Le lien ne marche pas', 'rep.info': 'Une information est fausse', 'rep.autre': 'Autre chose',
      'rep.msg': 'Précise si tu veux (facultatif)', 'rep.send': 'Envoyer le signalement', 'rep.thanks': 'Merci, ton signalement est envoyé à l’équipe.'
    },
    en: {
      'rep.title': 'Report this offer', 'rep.sub': 'Thank you! The team re-checks the offer on the official website and removes it if it is no longer valid.',
      'rep.expiree': 'The offer is closed or expired', 'rep.lien': 'The link does not work', 'rep.info': 'Some information is wrong', 'rep.autre': 'Something else',
      'rep.msg': 'Add details if you like (optional)', 'rep.send': 'Send the report', 'rep.thanks': 'Thank you, your report has been sent to the team.'
    }
  });
  Lerna.reportOpp = function (id) {
    var t = Lerna.t, R = [['expiree', 'rep.expiree'], ['lien_casse', 'rep.lien'], ['info_fausse', 'rep.info'], ['autre', 'rep.autre']];
    Lerna.modal('<div class="modal-head"><h3>' + t('rep.title') + '</h3><button class="modal-close" data-close aria-label="' + t('common.close') + '">' + Lerna.icon('x') + '</button></div>' +
      '<form id="repForm" class="stack"><p class="muted small">' + t('rep.sub') + '</p><div class="rep-reasons" role="radiogroup">' +
      R.map(function (r, i) { return '<label><input type="radio" name="raison" value="' + r[0] + '"' + (i === 0 ? ' checked' : '') + '>' + t(r[1]) + '</label>'; }).join('') +
      '</div><div class="field"><label for="repMsg">' + t('rep.msg') + '</label><textarea class="textarea" id="repMsg" maxlength="600" style="min-height:80px"></textarea></div>' +
      '<button type="submit" class="btn btn-primary btn-block">' + t('rep.send') + '</button></form>', function (m, close) {
      m.querySelector('#repForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var raison = (m.querySelector('input[name=raison]:checked') || {}).value || 'expiree';
        var body = { kind: 'report', opp: id, raison: raison, message: m.querySelector('#repMsg').value.trim() };
        var log = store.get('lerna_reports', []); log.push({ opp: id, raison: raison, t: Date.now() }); store.set('lerna_reports', log.slice(-30));
        var done = function () { close(); Lerna.toast(t('rep.thanks')); Sound.play('success'); A.capture('opp_report', { id: id, raison: raison }); };
        if (!Lerna.config.live) return done();
        Lerna.api('/api/message', body, { timeout: 15000 }).then(done, done);
      });
    });
  };

  /* Démarrage */
  var readyFns = [];
  Lerna.ready = function (fn) { if (Lerna._isReady) fn(); else readyFns.push(fn); };
  function boot() {
    Prefs.apply();
    renderChrome();
    Lerna.applyI18n();
    initReveal();
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (Prefs.get('theme') === 'auto') Prefs.apply(); }); } catch (e) {}
    Lerna._isReady = true;
    try { Daily.recordVisit(); Daily.milestones(); } catch (err) {}
    var ref = Lerna.param('ref');
    if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref) && !Auth.user) store.set('lerna_ref', ref.toUpperCase());
    readyFns.forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
    window.addEventListener('offline', function () { Lerna.toast(Lerna.t('common.offline'), 4000); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);

  /* Après connexion : sauvegarde du questionnaire fait avant le compte, parrainage, compteur d'amis */
  var syncedFor = null;
  Auth.ready.then(function () { Stats.start(); });
  Lerna.on('lerna:auth', function (u) {
    if (!u) { A.reset(); return; }
    A.identify(u);
    setTimeout(runPending, 300);   // sauvegarde demandée avant la connexion
    if (Auth.mode !== 'supabase' || syncedFor === u.id) return;
    syncedFor = u.id;
    /* La version A/B et les préférences suivent le compte d'un appareil à l'autre */
    if (u.ab && Object.keys(u.ab).length) Lerna.ab.adopt(u.ab);
    else Auth.sb.from('users').update({ ab: Lerna.ab.all() }).eq('id', u.id).then(function () {}, function () {});
    if (u.prefs && typeof u.prefs === 'object' && !store.raw('lerna_prefs')) { store.set('lerna_prefs', u.prefs); Prefs.apply(); }
    Lerna.dossiers.pull();
    Lerna.favs.pull();
    Lerna.restoreFromAccount().then(function (changed) {
      /* Profil retrouvé alors qu'on est sur l'accueil : direction « Aujourd'hui » (comme sur l'appareil d'origine) */
      if (changed && store.raw('lerna_profile') && doc.body && doc.body.getAttribute('data-page') === 'home' && !/[?&](decouvrir|ref)=/.test(location.search)) location.replace('aujourdhui.html');
      else if (changed) renderChrome();
      return Lerna.syncProfile();
    }).then(Lerna.referral.claim).then(Lerna.referral.refresh).catch(function () {});
  });
  /* Toutes les actions suivies (missions, points) partent aussi dans les mesures */
  Lerna.on('lerna:track', function (d) { if (d && d.ev && d.ev !== 'visit') A.capture(d.ev, d.id ? { id: String(d.id) } : null); });
  var progressTimer = null;
  Lerna.on('lerna:track', function () { clearTimeout(progressTimer); progressTimer = setTimeout(function () { Lerna.pushProgress(); }, 3000); });

  /* PWA : service worker uniquement en production (config serveur reçue) */
  /* Compte créé avec Google ou Apple (sans formulaire) : 2 infos en 2 appuis, une seule fois */
  function askMe() {
    var u = Auth.user, pg = page();
    if (!u || (pg !== 'today' && pg !== 'espace')) return;
    var me = Lerna.me.get(), done = store.get('lerna_me_asked', null);
    if ((u.genre || Lerna.me.raw().genre) && me.naissance) return;
    if (done && done[u.id]) return;
    var mark = function () { var d = store.get('lerna_me_asked', null) || {}; d[u.id] = Date.now(); store.set('lerna_me_asked', d); };
    var g = me.genre && !me.genreDevine ? me.genre : (me.genreDevine ? me.genre : '');
    var t = Lerna.t;
    Lerna.modal('<div class="modal-head"><h3>' + t('me.title') + '</h3><button class="modal-close" data-close aria-label="' + t('common.close') + '">' + Lerna.icon('x') + '</button></div>' +
      '<p class="muted small" style="margin-bottom:14px">' + t('me.sub') + '</p>' +
      '<p style="font-weight:700;margin-bottom:8px">' + t('me.q') + '</p><div class="me-avs" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' + [['h', 'me.h'], ['f', 'me.f'], ['x', 'me.x']].map(function (a) {
        return '<button type="button" class="opt' + (g === a[0] ? ' selected' : '') + '" data-meav="' + a[0] + '" style="justify-content:center;padding:12px 4px;font-size:.88rem;text-align:center">' + t(a[1]) + '</button>';
      }).join('') + '</div>' +
      '<div class="field" style="margin-top:14px"><label for="meBirth">' + t('me.birth') + '</label><input class="input" type="date" id="meBirth" value="' + Lerna.esc(me.naissance || '') + '" max="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="meSave" style="margin-top:6px">' + t('me.save') + '</button>', function (m, close) {
      var sel = g;
      m.addEventListener('click', function (e) {
        var b = e.target.closest('[data-meav]');
        if (b) { sel = b.getAttribute('data-meav'); Array.prototype.forEach.call(m.querySelectorAll('[data-meav]'), function (x) { x.classList.toggle('selected', x === b); }); Lerna.pop(b); }
        if (e.target.closest('[data-close]')) mark();
      });
      m.querySelector('#meSave').addEventListener('click', function () {
        var patch = {}; if (sel) patch.genre = sel; var bd = m.querySelector('#meBirth').value; if (bd) patch.naissance = bd;
        Lerna.me.set(patch); mark(); close(); Lerna.toast(t('me.thanks')); Sound.play('success');
      });
    });
  }
  Lerna.addStrings({
    fr: { 'me.q': 'Tu es', 'me.title': 'Deux infos pour mieux t’orienter', 'me.sub': 'Ta réponse accorde les messages et te montre les bourses réservées aux femmes quand elles te concernent. Ta date de naissance sert aux offres avec une limite d’âge. Modifiable dans Paramètres.', 'me.h': 'Étudiant', 'me.f': 'Étudiante', 'me.x': 'Autre', 'me.birth': 'Date de naissance', 'me.save': 'Enregistrer', 'me.thanks': 'Merci ! LERNA s’adapte à toi.' },
    en: { 'me.q': 'You are', 'me.title': 'Two details to guide you better', 'me.sub': 'Your answer adapts messages and shows you scholarships reserved for women when they apply. Your date of birth is for offers with an age limit. Editable in Settings.', 'me.h': 'Male student', 'me.f': 'Female student', 'me.x': 'Other', 'me.birth': 'Date of birth', 'me.save': 'Save', 'me.thanks': 'Thanks! LERNA adapts to you.' }
  });

  Auth.ready.then(function () {
    setTimeout(runPending, 300);
    setTimeout(askMe, 2500);
    Prefs.apply();          // la version gagnante décidée depuis /admin peut changer le thème par défaut
    A.init();
    /* Vercel Web Analytics (visites et pages vues, sans cookie) : seulement en ligne, et si la personne n'a pas coupé les statistiques */
    if (Lerna.config.live && Prefs.get('analytics') !== false && !doc.getElementById('vercel-insights')) {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      var vs = doc.createElement('script'); vs.id = 'vercel-insights'; vs.defer = true; vs.src = '/_vercel/insights/script.js';
      doc.head.appendChild(vs);
    }
    var v = Daily.visits();
    A.capture('app_open', { page: page(), days_since_first: v.first ? Math.floor((Date.now() - new Date(v.first).getTime()) / 864e5) : 0, visit_days: v.days.length });
    Lerna.detectCountry();
    if ('serviceWorker' in navigator && Lerna.config.live && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js' + (Lerna.config.onesignalAppId ? '?os=1' : '')).catch(function () {});
    }
    if (Lerna.notify.granted()) Lerna.notify.tags();
  });
})();
