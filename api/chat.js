/* POST /api/chat — assistant IA personnel (document maître §11, bloc 5)
   Gratuit : 5 messages par jour. Premium : illimité (garde-fou anti-abus).
   mode = 'lettre' | 'entretien' : coach de « Mon dossier » (3 par jour en gratuit, tout ouvert avant le lancement du Premium).
   mode = 'offre'  : « Est-ce pour moi ? » — l'IA compare le profil de l'étudiant à une offre (3 par jour en gratuit).
   mode = 'projet' : « Mon projet est-il prêt ? » — l'IA lit les réponses du mini-questionnaire investisseurs (2 par jour en gratuit).
   mode = 'admin_offre' : réservé aux admins — l'IA lit une page officielle et prépare la fiche de l'offre (à relire avant publication).
   Tout passe par ce seul point d'entrée (limite de 12 fonctions sur l'offre gratuite de Vercel).
   Sans clé ANTHROPIC_API_KEY, la réponse est 503 « ai_unavailable » et l'application affiche « disponible bientôt ». */
import { json, fail, sameOrigin, readJson, clientIp, hashKey, getUser, usage, hit, claude, str, premiumOpen, sbFetch, supabaseReady, extractJson } from './_lib.js';

const FREE_LIMIT = 5;
const COACH_FREE = 3; // atelier lettre et entraînement à l'entretien : 3 par jour en gratuit, illimité en Premium
const FREE_BY_MODE = { chat: FREE_LIMIT, lettre: COACH_FREE, entretien: COACH_FREE, offre: 3, projet: 2 };
const MODES = ['chat', 'lettre', 'entretien', 'offre', 'projet', 'admin_offre'];

/* « Est-ce pour moi ? » : profil + fiche de l'offre → avis honnête et court */
function offerSystem(lang) {
  return `Tu es LERNA. On te donne le profil d'un étudiant et la fiche d'une offre (bourse, stage, emploi ou financement).
Tu dis honnêtement si l'offre lui correspond :
- Première ligne : « Oui, fonce », « Possible, à vérifier » ou « Probablement pas », suivi d'une phrase d'explication.
- Puis 2 à 4 tirets : les conditions qu'il remplit, celles qui manquent ou qui sont à vérifier (âge, nationalité, niveau, langue, dates).
- Puis une dernière ligne « À faire maintenant : » avec l'action la plus utile.
- Tu ne promets jamais un résultat. Si une information manque dans le profil, tu le dis. Tu n'inventes aucune condition qui n'est pas dans la fiche.
- 150 mots maximum, texte brut. ${lang === 'en' ? 'Answer in ENGLISH.' : 'Tu réponds en français et tu tutoies.'}`;
}
/* « Mon projet est-il prêt ? » : réponses du mini-questionnaire → niveau et prochaines étapes */
function projectSystem(lang) {
  return `Tu es LERNA, conseiller pour jeunes entrepreneurs africains. On te donne les réponses d'un étudiant sur son projet.
Tu réponds :
- Une ligne « Stade : idée », « Stade : premier produit » ou « Stade : premiers clients ».
- Le type de financement le plus adapté maintenant (subvention ou prix, incubateur, accélérateur, business angel, fonds) et pourquoi, en 2 phrases. Rappelle simplement ce que « donner des parts » veut dire si tu conseilles un investisseur.
- 3 tirets : ce qu'il doit préparer avant de postuler (ex. : pitch d'une minute, preuve que des clients paient, chiffres, équipe).
- Une mise en garde si utile : ne jamais payer pour être financé.
- 170 mots maximum, texte brut, ton encourageant mais honnête. ${lang === 'en' ? 'Answer in ENGLISH.' : 'Tu réponds en français et tu tutoies.'}`;
}
/* Admin : page officielle → brouillon de fiche (JSON) au format de data-opps.js */
function adminOfferSystem() {
  return `Tu prépares une fiche d'offre pour l'application LERNA à partir du texte d'une page officielle.
Réponds UNIQUEMENT avec un objet JSON, sans texte autour, avec ces clés :
{"type":"bourse|stage|emploi|investisseur","titre":"","organisation":"","pays":"code ISO à 2 lettres, ou INT, AFR, REMOTE, EU","domaines":["droit|business|ingenierie|sciences|tech|sante|education|agri|comm|art"],"niveaux":["bac|bac2|licence|master|doctorat"],
"montant_fr":"","montant_en":"","eligibles_fr":"","eligibles_en":"","duree_fr":"","duree_en":"","ouverture":"AAAA-MM-JJ ou null","deadline":"AAAA-MM-JJ ou null","rolling":false,"note_fr":"","note_en":"",
"equity":null,"genre":"prix|accelerateur|incubateur|angel|fonds|null","stade":"idee|produit|clients|null","preuve":"phrase exacte de la page qui donne la date limite ou dit qu'on peut postuler à tout moment","doutes":["ce qui n'est pas clair sur la page"]}
RÈGLES : tu n'inventes rien. Une date absente de la page reste null. rolling vaut true seulement si la page dit qu'on peut postuler à tout moment ou en continu. Textes en français simple (tutoiement) et en anglais.`;
}
function profileOf(body) { return str(body.profile, 4000) || 'Profil non renseigné.'; }

/* Récupère le texte d'une page officielle (admin seulement) — https uniquement, pas d'adresse interne */
async function pageText(url) {
  let u;
  try { u = new URL(url); } catch { throw Object.assign(new Error('bad_url'), { status: 400 }); }
  if (u.protocol !== 'https:' || /^(localhost|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname) || u.hostname.endsWith('.local') || u.hostname.endsWith('.internal')) throw Object.assign(new Error('bad_url'), { status: 400 });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(u.toString(), { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'LERNA-admin/1.0', accept: 'text/html,text/plain' } });
    if (!res.ok) throw Object.assign(new Error('page_' + res.status), { status: 502 });
    const html = (await res.text()).slice(0, 400000);
    return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 14000);
  } finally { clearTimeout(timer); }
}
async function isAdmin(user) {
  if (!user || !supabaseReady()) return false;
  const r = await sbFetch('/rest/v1/users?id=eq.' + encodeURIComponent(user.id) + '&select=role');
  return !!(Array.isArray(r.data) && r.data[0] && r.data[0].role === 'admin');
}

/* « Mon dossier » : LERNA aide, mais n'écrit jamais à la place de l'étudiant */
function coachSystem(mode, lang, ctx) {
  const L = lang === 'en' ? 'Tu réponds en ANGLAIS.' : 'Tu réponds en français et tu tutoies.';
  if (mode === 'lettre') {
    return `Tu es LERNA, coach de lettres de motivation. L'étudiant te montre SON brouillon pour : ${ctx || 'une formation'}.
RÈGLES ABSOLUES :
- Tu n'écris JAMAIS la lettre à sa place et tu ne réécris pas ses paragraphes. Tu peux citer au maximum 8 mots de son texte pour situer une remarque.
- Tu donnes : 2 points forts précis ; 3 améliorations concrètes, chacune avec une question qui l'aide à trouver lui-même quoi écrire ; une vérification de la structure (accroche, pourquoi cette formation, pourquoi lui, son projet) ; une remarque sur la longueur (idéal : 250 à 400 mots).
- Tu signales les phrases creuses (« depuis toujours », « passionné ») et les fautes répétées, sans corriger tout le texte.
- 220 mots maximum, texte brut, tirets autorisés, pas de titres. ${L}`;
  }
  return `Tu es LERNA et tu joues le rôle d'un conseiller Campus France bienveillant mais exigeant, pour entraîner l'étudiant à l'entretien (${ctx || 'études en France'}).
- Tu reçois la question posée et la réponse de l'étudiant. Tu donnes : ce qui est convaincant ; ce qui manque (projet, cohérence, financement, connaissance de l'établissement) ; une question de relance qu'un vrai conseiller poserait.
- Tu n'écris pas la réponse à sa place. Tu peux proposer une structure en 3 points.
- 180 mots maximum, texte brut. ${L}`;
}

/* Ce que l'assistant sait de l'application elle-même : il répond directement aux questions sur LERNA
   (fonctions, Premium, compte…) au lieu de renvoyer vers une aide extérieure. */
const APP_FACTS = `CE QUE TU SAIS SUR L'APPLICATION LERNA. Réponds directement et précisément à toute question sur LERNA, ses fonctions et comment s'en servir, en disant où appuyer. Ne renvoie vers la page Contact que si la réponse n'est pas ici, ou pour un problème de compte ou de paiement.
- LERNA aide chaque élève à trouver la filière, l'école, le pays et l'avenir qui lui correspondent, puis à préparer sa candidature. LERNA ne décide jamais à sa place et peut se tromper : il faut toujours confirmer auprès de l'école.
- Navigation : la barre du bas contient Orientation, Explorer, le logo LERNA au centre (l'accueil, ou « Aujourd'hui » une fois le test fait), Opportunités et Moi. Le menu ☰ en haut à droite contient le compte, les Paramètres, Premium, Contact et les Informations légales.
- Test d'orientation (Orientation) : 25 questions, environ 5 minutes, gratuit. L'IA propose 5 écoles classées de la plus adaptée à la moins adaptée, avec pourquoi, le coût et le point à surveiller. Les 3 premières sont visibles tout de suite. La n°4 et la n°5 se débloquent quand 3 amis créent un compte avec ton lien d'invitation et terminent leur questionnaire, ou avec Premium. Le lien d'invitation est sur la page des résultats et dans Paramètres (Abonnement et parrainage). Une analyse complète gratuite par jour.
- Explorer : les écoles et universités reconnues officiellement dans le monde, avec des filtres (pays, type, domaine, budget, durée, langue), et un onglet « Formations en France ». Chaque fiche a les onglets Présentation, Filières, Admission, Coûts, Vie étudiante et Avis. Le bouton étoile orange ajoute l'école aux favoris. Le bouton « Préparer ma candidature » crée le dossier de cette école.
- Métiers et débouchés (page Métiers, depuis l'Explorer, les résultats du test, les filières des fiches et le menu ☰) : 1 923 métiers du répertoire officiel français (ROME de France Travail), gratuits. Pour chaque métier : ce qu'on fait au quotidien, les qualités demandées, ce qu'on sait faire, le niveau d'études dit pour tous les pays (système LMD : licence = 3 ans après le bac, master = 5 ans, au Sénégal, en Côte d'Ivoire et en France), les règles du Sénégal et de la Côte d'Ivoire pour les métiers réglementés (ordres professionnels), les diplômes et conditions propres à la France (indiqués à part), les conditions de travail, les métiers proches et où étudier (Sénégal, Côte d'Ivoire, France, tous les pays). Recherche par mot, par domaine, par envie (« J'ai envie de… ») ou par niveau d'études.
- Mon dossier : une école = un dossier, avec les étapes dans l'ordre, les documents, la lettre de motivation, l'entretien, le visa, le budget, le suivi et des rappels avant les dates limites, plus un copilote pas à pas pour Études en France et Campusen.
- Opportunités : bourses, stages, emplois et investisseurs, avec leur date limite. On peut sauvegarder une offre (il faut un compte) pour être prévenu. « Est-ce pour moi ? » compare l'offre au profil. « Mon projet est-il prêt ? » aide les porteurs de projet à savoir quel financement viser.
- Aujourd'hui : la mission du jour, la série de jours, les points et la bourse du jour.
- Moi : Vue d'ensemble, Assistant IA (toi), Mes écoles, Candidatures et Compte.
- Compte : inscription par email ou avec Google. Dans le navigateur de TikTok ou d'Instagram, Google refuse la connexion : il faut ouvrir LERNA dans Chrome ou Safari, ou s'inscrire par email. Avec un compte, les résultats, les favoris et les dossiers suivent sur tous les appareils. L'application s'installe sur l'écran d'accueil du téléphone depuis le navigateur.
- Paramètres : compte, apparence (clair ou sombre), langue (français ou anglais), notifications, sons et vibrations, « Ce que LERNA sait de toi », confidentialité et suppression du compte.
- Pour les conditions d'utilisation, de paiement ou de confidentialité : menu ☰, puis Informations légales.`;

async function premiumFacts() {
  if (await premiumOpen()) return "- Premium : pendant le lancement, tout LERNA est gratuit et l'assistant n'a pas de limite. Il n'y a rien à payer pour le moment.";
  let m = null;
  try {
    if (supabaseReady()) {
      const r = await sbFetch('/rest/v1/app_config?select=value&key=eq.momo');
      if (r.ok && Array.isArray(r.data) && r.data[0]) m = r.data[0].value;
    }
  } catch { /* prix non lus : on renvoie vers la page Premium */ }
  const f = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  const ok = (n) => Number.isInteger(n) && n > 0;
  const prices = m && m.actif === true && ok(m.prix_mois) && ok(m.prix_an)
    ? ' Prix : ' + f(m.prix_mois) + ' par mois, ' + f(m.prix_an) + ' par an' + (ok(m.prix_pack) ? ', ou le Pack Candidature à ' + f(m.prix_pack) + ' en un seul paiement pour 6 mois' : '') + ', payables par Wave, Orange Money, Yas ou carte. Les parents peuvent payer avec leur propre numéro.'
    : ' Les prix sont affichés sur la page Premium.';
  return "- Gratuit : toutes les informations. Le test d'orientation (une analyse), les 3 meilleures écoles avec le pourquoi, l'Explorer, les fiches complètes des écoles (Présentation, Filières, Admission, Coûts, Vie étudiante, Avis), la page Métiers, toutes les offres avec leur lien officiel, Aujourd'hui, et 5 messages par jour à l'assistant. Les écoles n°4 et n°5 se débloquent aussi avec le parrainage (voir le test d'orientation plus haut)." +
    "\n- Premium (payant), l'aide pour être pris : tout Mon dossier (étapes, copilote, documents, lettre, entretien, CV, visa, budget, suivi et rappels), « Est-ce pour moi ? » sur les offres, les alertes sur les nouvelles offres, les écoles n°4 et n°5 tout de suite, une nouvelle analyse, et l'assistant sans limite. Pour l'avoir : menu ☰ en haut à droite, puis Premium, choisir la formule, puis payer. Avec Wave, le bénéficiaire affiché est le prestataire de paiement de LERNA (son nom commence par « Alpha »), pas « LERNA » : c'est normal." + prices;
}

function system(lang, profile, currency, facts) {
  return `Tu es LERNA, l'assistant d'orientation personnel de cet étudiant. Tu es chaleureux, direct, honnête et précis.
- Tu réponds aux questions d'études, d'orientation, de filières, d'admissions, de bourses, de stages, de logement étudiant, de carrière, d'organisation du travail, ET à toutes les questions sur l'application LERNA elle-même (voir plus bas).
- Hors de ce périmètre (politique, religion, conseils médicaux, sujets généraux), tu réponds poliment en une phrase que LERNA se concentre sur son parcours éducatif, et tu proposes une ressource adaptée si besoin.
- Si l'étudiant exprime une détresse importante, tu l'encourages avec douceur à parler à une personne de confiance ou à une ligne d'écoute (findahelpline.com).
- Tu donnes les montants en dollars américains (USD)${currency ? ', suivis de l\'équivalent indicatif dans la devise de l\'étudiant (' + currency + ')' : ''}. Si tu n'es pas sûr d'un chiffre ou d'une date, dis-le et conseille de vérifier sur le site officiel. Tu n'inventes jamais.
- Réponses courtes : 180 mots maximum, en texte brut (pas de markdown, pas de titres). Tu peux utiliser des listes simples avec des tirets.
- Tu tutoies l'étudiant${lang === 'en' ? ' and you answer in ENGLISH' : ' et tu réponds en français'}.

${APP_FACTS}
${facts || ''}
${profile ? '\nProfil de l\'étudiant (réponses au questionnaire LERNA) :\n' + profile : ''}`;
}

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 30000); } catch (e) { return fail(e.status || 400, e.message); }

  const lang = body.lang === 'en' ? 'en' : 'fr';
  const mode = MODES.includes(body.mode) ? body.mode : 'chat';
  const user = await getUser(request);

  /* ---- Admin : brouillon de fiche à partir d'un lien officiel ---- */
  if (mode === 'admin_offre') {
    if (!(await isAdmin(user))) return fail(403, 'admin_only');
    const key = 'admin_offre:' + user.id;
    if ((await usage(key)) >= 100) return fail(429, 'daily_limit', { limit: 100 });
    try {
      const url = str(body.url, 500);
      const text = await pageText(url);
      if (text.length < 200) return fail(422, 'page_empty');
      const out = await claude({ mode: 'admin_offre', system: adminOfferSystem(), messages: [{ role: 'user', content: 'Lien officiel : ' + url + '\nDate du jour : ' + new Date().toISOString().slice(0, 10) + '\n\nTexte de la page :\n' + text }], maxTokens: 1500 });
      await hit(key);
      return json({ draft: { ...extractJson(out), lien: url, source: new URL(url).hostname.replace(/^www\./, '') } });
    } catch (e) {
      return fail(e.status || 502, e.message === 'bad_url' ? 'bad_url' : 'ai_unavailable');
    }
  }

  let merged = [];
  if (mode === 'offre') {
    const offer = str(body.offer, 3000);
    if (!offer) return fail(400, 'no_offer');
    merged = [{ role: 'user', content: 'Profil :\n' + profileOf(body) + '\n\nOffre :\n' + offer }];
  } else if (mode === 'projet') {
    const answers = str(body.answers, 3000);
    if (!answers) return fail(400, 'no_answers');
    merged = [{ role: 'user', content: 'Réponses sur le projet :\n' + answers + (body.profile ? '\n\nProfil :\n' + profileOf(body) : '') }];
  } else {
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));
    // L'API exige d'alterner les rôles et de commencer par l'utilisateur
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    for (const m of msgs) {
      if (merged.length && merged[merged.length - 1].role === m.role) merged[merged.length - 1].content += '\n' + m.content;
      else merged.push({ ...m });
    }
    if (!merged.length || merged[merged.length - 1].role !== 'user' || !merged[merged.length - 1].content.trim()) return fail(400, 'no_question');
  }

  const who = user ? 'user:' + user.id : 'ip:' + hashKey(clientIp(request));
  const key = (mode === 'chat' ? 'chat:' : 'coach:' + mode + ':') + who;
  /* Avant le lancement du Premium, tout est ouvert (garde-fou anti-abus seulement) */
  const limit = (user && user.premium) || (await premiumOpen()) ? 300 : FREE_BY_MODE[mode];
  if ((await usage(key)) >= limit) return fail(429, 'daily_limit', { limit });

  try {
    const sys = mode === 'chat' ? system(lang, str(body.profile, 4000), str(body.currency, 40), await premiumFacts())
      : mode === 'offre' ? offerSystem(lang)
      : mode === 'projet' ? projectSystem(lang)
      : coachSystem(mode, lang, str(body.context, 300));
    const reply = await claude({ mode: String(mode || 'chat'), system: sys, messages: merged, maxTokens: mode === 'chat' ? 700 : mode === 'offre' || mode === 'projet' ? 600 : 800 });
    await hit(key);
    return json({ reply: reply.slice(0, 2500) });
  } catch (e) {
    return fail(e.status || 502, 'ai_unavailable');
  }
}

export function GET() { return fail(405, 'method_not_allowed'); }
