/* LERNA — boot.js : chargé en tout premier dans <head>, avant l'affichage.
   Applique sans clignotement : le thème (clair par défaut, sombre seulement si la personne le choisit),
   la version du test A/B (A = blanc chaud, B = crème plus présent), la taille du texte et « moins d'animations ».
   Même logique que Lerna.prefs dans core.js. */
(function () {
  var root = document.documentElement;
  function get(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  var p = get('lerna_prefs') || {};
  var ab = get('lerna_ab') || {};
  var ovr = get('lerna_ab_ovr') || {};
  /* Version décidée depuis /admin, sinon version déjà attribuée, sinon tirage au sort (gardé ensuite) */
  var v = ovr.couleurs === 'a' || ovr.couleurs === 'b' ? ovr.couleurs : ab.couleurs;
  if (v !== 'a' && v !== 'b') {
    v = Math.random() < 0.5 ? 'a' : 'b';
    ab.couleurs = v; if (!ab.since) ab.since = new Date().toISOString();
    try { localStorage.setItem('lerna_ab', JSON.stringify(ab)); } catch (e) {}
  }
  var theme = p.theme;
  if (theme === 'auto') {
    try { theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { theme = 'light'; }
  } else if (theme !== 'dark') theme = 'light';
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-variant', v);
  root.setAttribute('data-text', p.textSize === 'large' ? 'large' : 'normal');
  if (p.reduceMotion) root.setAttribute('data-calm', '');
  /* Écran d'ouverture animé (logo) : une fois par session, pas sur la page d'analyse ni sur l'admin */
  try {
    var path = location.pathname, q = location.search;
    var force = /[?&]splash=1/.test(q);
    var skip = /loading|admin|404/.test(path) || (navigator.webdriver && !force) || (sessionStorage.getItem('lerna_splash') && !force);
    if (!skip) root.setAttribute('data-splash', '');
  } catch (e) {}
  var m = document.querySelector('meta[name="theme-color"]');
  if (m && !m.hasAttribute('data-fixed')) m.setAttribute('content', theme === 'dark' ? '#22170F' : (v === 'b' ? '#FFF9F1' : '#FFFFFF'));
})();
