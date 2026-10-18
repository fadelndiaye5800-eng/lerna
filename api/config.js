/* GET /api/config — configuration PUBLIQUE pour le navigateur.
   Seules des valeurs publiques sortent d'ici : l'URL Supabase et la clé "anon" (conçue pour être publique,
   la sécurité repose sur les règles RLS), les liens de paiement Lemon Squeezy, l'identifiant public OneSignal,
   la clé publique PostHog (mesures), le lien des avis Google, l'interrupteur Premium,
   les réglages A/B, les taux de change et le paiement en FCFA (prix) décidés depuis /admin (table app_config),
   et le pays deviné par l'adresse internet (en-tête Vercel x-vercel-ip-country).
   (Une seule fonction pour tout cela : le plan Vercel gratuit limite le nombre de fonctions à 12.)
   Aucune clé secrète (Anthropic, service_role, webhook, OneSignal REST, Resend) n'est jamais renvoyée. */
import { json, env, sbFetch, supabaseReady, payProvider, MODEL } from './_lib.js';

/* Réglages modifiables depuis /admin (table app_config, lue avec la clé serveur) */
async function appConfig() {
  if (!supabaseReady()) return {};
  try {
    const r = await sbFetch('/rest/v1/app_config?select=key,value&key=in.(ab,fx,momo)');
    const out = {};
    if (r.ok && Array.isArray(r.data)) for (const row of r.data) out[row.key] = row.value;
    return out;
  } catch { return {}; }
}
const cleanAb = (ab) => {
  const o = {};
  if (ab && typeof ab === 'object') for (const [k, v] of Object.entries(ab)) if (/^[a-z_]{1,30}$/.test(k) && ['test', 'a', 'b'].includes(v)) o[k] = v;
  return o;
};
const cleanFx = (fx) => {
  if (!fx || typeof fx !== 'object') return null;
  const n = (x) => (typeof x === 'number' && x > 0 && x < 100000 ? x : undefined);
  const o = { EUR: n(fx.EUR), XOF: n(fx.XOF), date: typeof fx.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fx.date) ? fx.date : undefined };
  return o.EUR && o.XOF ? o : null;
};

/* Paiement en FCFA (Wave, Orange Money, Free Money, carte) : prix réglés depuis /admin (table app_config).
   Aucun numéro de téléphone n'est envoyé au navigateur : l'élève paie le marchand « LERNA ». */
const cleanPay = (m) => {
  if (!payProvider() || !m || typeof m !== 'object' || m.actif !== true) return null;
  const p = (x) => (Number.isInteger(x) && x > 0 && x < 10000000 ? x : null);
  const prixMois = p(m.prix_mois), prixAn = p(m.prix_an);
  return prixMois && prixAn ? { prixMois, prixAn, prixPack: p(m.prix_pack), methods: ['wave', 'orange_money', 'free_money', 'card'], provider: payProvider(), test: payProvider() === 'saspay' ? /^sk_test_/.test(env('SASPAY_SECRET_KEY')) : env('PAYDUNYA_MODE', 'live') === 'test' } : null;
};

export async function GET(request) {
  const cfg = await appConfig();
  /* Pays deviné par l'adresse internet (en-tête ajouté par Vercel), sans autorisation ni GPS. Aucune adresse IP n'est gardée. */
  const ipc = ((request && request.headers.get('x-vercel-ip-country')) || '').toUpperCase();
  const socials = {};
  for (const k of ['instagram', 'tiktok', 'linkedin', 'x', 'youtube']) {
    const v = env('SOCIAL_' + k.toUpperCase());
    if (/^https:\/\//.test(v)) socials[k] = v;
  }
  return json({
    supabaseUrl: env('SUPABASE_URL'),
    supabaseAnonKey: env('SUPABASE_ANON_KEY'),
    checkoutMonthly: env('LEMON_SQUEEZY_CHECKOUT_MONTHLY'),
    checkoutYearly: env('LEMON_SQUEEZY_CHECKOUT_YEARLY'),
    onesignalAppId: env('ONESIGNAL_APP_ID'),
    posthogKey: env('POSTHOG_KEY'),
    posthogHost: env('POSTHOG_HOST', 'https://eu.i.posthog.com'),
    googleReviewUrl: env('GOOGLE_REVIEW_URL'),
    appUrl: env('APP_URL'),
    contactEmail: env('CONTACT_PUBLIC_EMAIL'),            // affiché sur la page Contact une fois le domaine acheté
    socials,                                              // réseaux sociaux (codés, affichés seulement si SHOW_SOCIALS=true)
    showSocials: env('SHOW_SOCIALS', 'false') === 'true',
    premiumEnabled: env('PREMIUM_ENABLED', 'true') !== 'false',
    appleLogin: env('APPLE_LOGIN_ENABLED', 'false') === 'true',   // bouton « Continuer avec Apple » (après la configuration chez Apple)
    ab: cleanAb(cfg.ab),
    fx: cleanFx(cfg.fx),
    pay: cleanPay(cfg.momo),
    aiProviders: { claude: !!env('ANTHROPIC_API_KEY'), groq: !!env('GROQ_API_KEY'), model: MODEL() },   // oui/non seulement, jamais les clés
    country: /^[A-Z]{2}$/.test(ipc) && ipc !== 'XX' ? ipc : null
  }, 200, { 'Cache-Control': 'private, max-age=120' });
}
