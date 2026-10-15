/* /api/pay — paiement Premium en FCFA par Wave, Orange Money, Free Money (Yas) ou carte, via SasPay ou PayDunya.
   L'élève ne voit jamais le numéro du propriétaire : il paie le marchand « LERNA » dans son appli,
   et le Premium s'active tout seul (IPN PayDunya + vérification serveur à serveur).

   POST { action: "start", plan: "mois"|"an", method: "wave"|"orange_money"|"free_money"|"card", phone? }
        → { token, redirect?, alt?, qr?, ussd? }
   POST { action: "verify", token } → { statut: "valide"|"en_attente"|"refuse" }
   POST /api/pay?ipn=1  (appel de PayDunya, formulaire) → active le Premium si la facture est payée

   Deux services possibles, un seul réglage pour changer (PAY_PROVIDER = "saspay" ou "paydunya") :
   - SasPay : SASPAY_SECRET_KEY (sk_test_… pour les essais, sk_live_… en vrai). Webhook à créer dans le tableau de bord SasPay :
     https://TON-DOMAINE/api/pay?ipn=saspay
   - PayDunya : PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN, PAYDUNYA_MODE = "live" (défaut) ou "test".
   Sans PAY_PROVIDER : SasPay si sa clé est là, sinon PayDunya.
   Dans les deux cas, LERNA ne croit jamais un message reçu : il redemande le statut au service avant d'activer Premium.
   (Le plan Vercel gratuit limite à 12 fonctions : démarrage, vérification et IPN sont réunis ici.) */
import { createHash, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { json, fail, env, sameOrigin, readJson, getUser, sbFetch, supabaseReady, usage, hit, paydunyaReady, saspayReady, payProvider } from './_lib.js';

/* Clés collées : on enlève guillemets, espaces et caractères invisibles copiés avec (une page traduite peut en ajouter) */
const tidy = (v) => String(v || '').replace(/[\s​-‍⁠﻿"'«»“”‘’`]/g, '');
const KEYS = () => ({ master: tidy(env('PAYDUNYA_MASTER_KEY')), priv: tidy(env('PAYDUNYA_PRIVATE_KEY')), token: tidy(env('PAYDUNYA_TOKEN')) });
/* À quoi ressemble une valeur (jamais la valeur elle-même) : sert à repérer une clé collée au mauvais endroit */
function shape(v) {
  if (!v) return 'absente';
  const m = /^(live|test)_(public|private)_/.exec(v);
  if (m) return (m[2] === 'public' ? 'clé publique' : 'clé privée') + (m[1] === 'live' ? ' de production' : ' de test');
  if (/^[A-Za-z0-9]{8}(-[A-Za-z0-9]{4}){3}-[A-Za-z0-9]{12}$/.test(v)) return 'format clé principale (' + v.length + ' caractères)';
  if (/^[A-Za-z0-9]{16,40}$/.test(v)) return 'format token (' + v.length + ' caractères)';
  return 'format inconnu (' + v.length + ' caractères)';
}
const shapes = () => { const k = KEYS(); return { master: shape(k.master), private: shape(k.priv), token: shape(k.token) }; };
const BASE = () => (env('PAYDUNYA_MODE', 'live') === 'test' ? 'https://app.paydunya.com/sandbox-api/v1' : 'https://app.paydunya.com/api/v1');
const METHODS = ['wave', 'orange_money', 'free_money', 'card'];
const TOKEN_RE = /^[A-Za-z0-9_-]{6,100}$/;

async function pd(path, body) {
  const k = KEYS();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(BASE() + path, {
      method: body === undefined ? 'GET' : 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'PAYDUNYA-MASTER-KEY': k.master, 'PAYDUNYA-PRIVATE-KEY': k.priv, 'PAYDUNYA-TOKEN': k.token },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const txt = await res.text();
    let data = null; try { data = JSON.parse(txt); } catch { data = { raw: txt.slice(0, 300) }; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) { return { ok: false, status: 0, data: { raw: e && e.name === 'AbortError' ? 'délai dépassé (25 s)' : 'réseau injoignable' } }; } finally { clearTimeout(timer); }
}

/* Journal des échecs de paiement (table events, lisible depuis /admin et par l'équipe) : jamais de clé ni de numéro complet */
const clean = (x) => String(x == null ? '' : typeof x === 'string' ? x : JSON.stringify(x)).replace(/(live|test)_(private|public)_[A-Za-z0-9]+/gi, '[clé]').replace(/\b7\d{8}\b/g, '7XXXXXXXX').slice(0, 240);
function pdMsg(r) { const d = (r && r.data) || {}; return clean(d.response_text || d.message || d.description || d.error || d.raw || ''); }
function logPay(step, meta) {
  return sbFetch('/rest/v1/events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { sid: 'server', ev: 'pay:' + step, meta } }).catch(() => null);
}

/* Traduction des réponses en une action claire pour le propriétaire */
function hint(o) {
  const t = o.test || {}, m = String(t.message || '').toLowerCase();
  if (o.provider === 'aucun') return 'Aucun service branché : les 3 clés PayDunya (MASTER, PRIVATE, TOKEN) manquent dans Vercel, ou le site n’a pas été redéployé après les avoir ajoutées.';
  if (o.provider === 'paydunya') {
    if (t.ok) return 'PayDunya accepte tes clés. Si un paiement échoue encore, regarde la liste des échecs ci-dessous.';
    const k = o.paydunya || {}, isKey = (s) => /^clé (publique|privée)/.test(s || '');
    const fin = ', remplace la valeur dans Vercel (Settings → Environment Variables → ⋯ → Edit), puis Deployments → ⋯ → Redeploy.';
    if (isKey(k.master)) return 'Erreur de place : dans PAYDUNYA_MASTER_KEY tu as collé la ' + k.master + '. Il faut la clé principale (« Master Key ») : elle ne commence ni par live_ ni par test_. Dans PayDunya : Intégration API → Applications → Détails → copie la Master Key' + fin;
    if (/^clé publique/.test(k.private)) return 'Erreur de place : dans PAYDUNYA_PRIVATE_KEY tu as collé la ' + k.private + '. Il faut la clé PRIVÉE de production (elle commence par live_private_)' + fin;
    if (/^format clé principale/.test(k.private)) return 'Erreur de place : dans PAYDUNYA_PRIVATE_KEY tu as collé la clé principale. Il faut la clé PRIVÉE de production (elle commence par live_private_)' + fin;
    if (isKey(k.token) || /^format clé principale/.test(k.token)) return 'Erreur de place : dans PAYDUNYA_TOKEN tu as collé une clé. Il faut le Token de production (lettres et chiffres, sans live_ ni test_)' + fin;
    if (/de test$/.test(k.private) && o.mode !== 'test') return 'Tu as mis la clé privée de TEST alors que le mode est réel : dans PayDunya, copie la clé privée et le token de PRODUCTION' + fin + ' Si PayDunya ne te montre que des clés de test, ton application n’est pas encore en production : Détails → Mettre à jour la configuration → Activer le mode production → « Oui, l’application est prête ».';
    if (/de production$/.test(k.private) && o.mode === 'test') return 'Tes clés sont réelles mais PAYDUNYA_MODE vaut test : supprime cette variable dans Vercel (ou mets live), puis Redeploy.';
    if (t.http === 0) return 'PayDunya ne répond pas (réseau ou délai) : réessaie dans quelques minutes.';
    if (/master/.test(m)) return 'PayDunya refuse ta clé principale (Master Key) : recopie-la depuis la MÊME application que la clé privée et le token' + fin;
    if (/private/.test(m)) return 'PayDunya refuse ta clé privée : recopie la clé privée de PRODUCTION (live_private_…) de la même application' + fin;
    if (/token/.test(m)) return 'PayDunya refuse ton token : recopie le token de PRODUCTION de la même application' + fin;
    if (t.http === 401 || t.http === 403 || /key|cl[ée]|token|invalid|incorrect|authent|master|private/.test(m)) return 'PayDunya refuse tes clés : recopie les 3 clés de PRODUCTION de la même application (MASTER, PRIVATE, TOKEN — sans espace avant ou après), colle-les dans Vercel, puis Redeploy.';
    if (/activ|production|kyc|compte|account|live/.test(m)) return 'PayDunya refuse car ton compte ou ton application n’est pas encore activé pour les vrais paiements : termine l’activation (pièces, validation) dans ton espace PayDunya ou écris à leur support.';
    return 'PayDunya a répondu par une erreur : lis le message ci-dessus et envoie-le à Claude.';
  }
  if (o.provider === 'saspay') {
    if (!o.pay_provider_var || o.pay_provider_var === '(vide)') return 'C’est SasPay qui est utilisé, pas PayDunya, parce qu’une clé SasPay est présente dans Vercel. Pour utiliser PayDunya : ajoute PAY_PROVIDER = paydunya dans Vercel (ou supprime SASPAY_SECRET_KEY), puis Redeploy.';
    return t.ok ? 'SasPay répond.' : 'SasPay ne répond pas correctement : mets PAY_PROVIDER = paydunya dans Vercel, puis Redeploy.';
  }
  return '';
}

/* Numéro sénégalais → 9 chiffres (77 123 45 67) */
function senPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('00221')) d = d.slice(5); else if (d.startsWith('221') && d.length === 12) d = d.slice(3);
  return /^7\d{8}$/.test(d) ? d : null;
}

/* ---------- SasPay ---------- */
const SP_BASE = 'https://api.saspay.me/api/v1';
async function sp(method, path, body, idem) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const headers = { Authorization: 'Bearer ' + env('SASPAY_SECRET_KEY'), 'Content-Type': 'application/json', Accept: 'application/json' };
    if (idem) headers['Idempotency-Key'] = idem;
    const res = await fetch(SP_BASE + path, { method, signal: ctrl.signal, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const txt = await res.text();
    let data = null; try { data = JSON.parse(txt); } catch { data = { raw: txt.slice(0, 300) }; }
    return { ok: res.ok, status: res.status, data };
  } catch { return { ok: false, status: 0, data: null }; } finally { clearTimeout(timer); }
}
/* Réseaux du Sénégal lus dans la liste publique de SasPay (codes du type « wave_sn ») ; gardés 1 h */
let netCache = { t: 0, list: [] };
async function snNetworks() {
  if (netCache.list.length && Date.now() - netCache.t < 3600e3) return netCache.list;
  const r = await sp('GET', '/countries/');
  const out = [];
  const walk = (node, country, depth) => {
    if (depth > 6 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((n) => walk(n, country, depth + 1)); return; }
    const iso = String(node.iso || node.iso2 || node.country_code || node.country || '').toUpperCase();
    if (Array.isArray(node.networks)) { const c = /^[A-Z]{2}$/.test(iso) ? iso : (/^[A-Z]{2}$/.test(String(node.code || '').toUpperCase()) ? String(node.code).toUpperCase() : country); walk(node.networks, c, depth + 1); return; }
    if (typeof node.code === 'string' && (node.name || node.label || node.display_name)) out.push({ code: node.code, name: String(node.name || node.label || node.display_name), country: /^[A-Z]{2}$/.test(iso) ? iso : country });
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v, country, depth + 1);
  };
  walk(r.data, '', 0);
  const list = out.filter((n) => n.country === 'SN' || /_sn$/i.test(n.code));
  if (list.length) netCache = { t: Date.now(), list };
  return list;
}
const NET_RE = { wave: /wave/i, orange_money: /orange|(^|_)om(_|$)|maxit/i, free_money: /free|yas|mixx/i, card: /card|carte|visa|master/i };
async function spNetwork(method) {
  const list = await snNetworks();
  const n = list.find((x) => NET_RE[method].test(x.code) || NET_RE[method].test(x.name));
  return n ? n.code : null;
}
const SP_OK = /^(success|succeeded|successful|completed|paid|approved)$/i, SP_KO = /^(failed|failure|cancel+ed|expired|rejected|declined)$/i;
/* Statut réel chez SasPay : « p-<id> » = paiement direct, « c-<id> » = page de paiement */
async function spStatus(token) {
  const id = encodeURIComponent(token.slice(2));
  const r = token.startsWith('p-') ? await sp('GET', '/payments/' + id + '/verify/') : await sp('GET', '/checkout-sessions/' + id + '/');
  const d = (r.data && (r.data.data || r.data)) || {};
  const st = String(d.status || (d.payment && d.payment.status) || '');
  return SP_OK.test(st) ? 'ok' : SP_KO.test(st) ? 'ko' : 'wait';
}

async function prices() {
  const r = await sbFetch('/rest/v1/app_config?select=value&key=eq.momo');
  const v = Array.isArray(r.data) && r.data[0] ? r.data[0].value : null;
  if (!v || v.actif !== true) return null;
  const ok = (x) => Number.isInteger(x) && x >= 200 && x < 10000000;
  return ok(v.prix_mois) && ok(v.prix_an) ? { mois: v.prix_mois, an: v.prix_an } : null;
}

const rowByToken = async (token) => {
  const r = await sbFetch('/rest/v1/paiements_momo?token=eq.' + encodeURIComponent(token) + '&select=id,user_id,montant,formule,statut,provider&limit=1');
  return Array.isArray(r.data) ? r.data[0] || null : null;
};

/* Vérifie la facture directement chez PayDunya (jamais sur la seule parole du navigateur), puis active ou clôt */
async function settle(token) {
  const row = await rowByToken(token);
  if (!row) return 'inconnu';
  if (row.statut !== 'en_attente') return row.statut;
  if (row.provider === 'saspay') {
    const st = await spStatus(token);
    if (st === 'ok') { const v = await sbFetch('/rest/v1/rpc/lerna_pay_valider', { method: 'POST', body: { p_token: token } }); return v.ok ? 'valide' : 'en_attente'; }
    if (st === 'ko') {
      await sbFetch('/rest/v1/paiements_momo?token=eq.' + encodeURIComponent(token) + '&statut=eq.en_attente', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { statut: 'refuse', traite_at: new Date().toISOString() } });
      return 'refuse';
    }
    return 'en_attente';
  }
  const c = await pd('/checkout-invoice/confirm/' + encodeURIComponent(token));
  const d = c.data || {};
  const status = String(d.status || '').toLowerCase();
  const paid = Number(d.invoice && d.invoice.total_amount);
  const forUser = !d.custom_data || !d.custom_data.user_id || d.custom_data.user_id === row.user_id;
  if (status === 'completed' && paid >= row.montant && forUser) {
    const v = await sbFetch('/rest/v1/rpc/lerna_pay_valider', { method: 'POST', body: { p_token: token } });
    return v.ok ? 'valide' : 'en_attente';
  }
  if (status === 'cancelled' || status === 'failed') {
    await sbFetch('/rest/v1/paiements_momo?token=eq.' + encodeURIComponent(token) + '&statut=eq.en_attente', {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { statut: 'refuse', traite_at: new Date().toISOString() }
    });
    return 'refuse';
  }
  return 'en_attente';
}

/* Jeton de facture dans l'appel IPN (formulaire data[invoice][token]=…, ou JSON) */
function ipnToken(raw, type) {
  let token = '', hash = '';
  try {
    if (/json/.test(type)) {
      const j = JSON.parse(raw); const d = j.data || j;
      token = (d.invoice && d.invoice.token) || d.token || ''; hash = d.hash || '';
    } else {
      const p = new URLSearchParams(raw);
      for (const [k, v] of p) {
        if (/invoice\]\[token\]$/.test(k) || k === 'token') token = token || v;
        if (/(^|\[)hash\]?$/.test(k)) hash = hash || v;
        if (k === 'data' && v.trim().startsWith('{')) { const d = JSON.parse(v); token = token || (d.invoice && d.invoice.token) || ''; hash = hash || d.hash || ''; }
      }
    }
  } catch { /* rien */ }
  return { token, hash };
}
function hashOk(hash) {
  if (!hash) return true; // la confirmation serveur à serveur fait foi de toute façon
  const mine = createHash('sha512').update(KEYS().master).digest('hex');
  const a = Buffer.from(mine), b = Buffer.from(String(hash).toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  if (!payProvider()) return fail(503, 'payment_not_configured');
  const url = new URL(request.url);

  /* ---------- Message de SasPay (webhook) : on relit le statut chez SasPay avant d'activer ---------- */
  if (url.searchParams.get('ipn') === 'saspay') {
    if (!saspayReady()) return new Response('ignored', { status: 200 });
    let j = null; try { j = JSON.parse((await request.text()).slice(0, 20000)); } catch { j = null; }
    const d = (j && (j.data || j.object || j)) || {};
    const ids = [d.id, d.payment_id, d.checkout_session_id, d.session_id, d.slug, d.payment && d.payment.id, d.checkout_session && d.checkout_session.id].filter((x) => typeof x === 'string' || typeof x === 'number').map(String);
    for (const id of ids) for (const t of ['p-' + id, 'c-' + id]) if (TOKEN_RE.test(t) && (await rowByToken(t))) { await settle(t); return new Response('OK', { status: 200 }); }
    return new Response('ignored', { status: 200 });
  }

  /* ---------- Appel de PayDunya (IPN) ---------- */
  if (url.searchParams.get('ipn') === '1') {
    const raw = await request.text();
    const { token, hash } = ipnToken(raw.slice(0, 20000), request.headers.get('content-type') || '');
    if (!TOKEN_RE.test(token) || !hashOk(hash)) return new Response('ignored', { status: 200 });
    await settle(token);
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 4000); } catch (e) { return fail(e.status || 400, e.message); }
  const user = await getUser(request);
  if (!user) return fail(401, 'not_authenticated');

  /* ---------- Vérifier une facture (retour de l'appli, ou attente du #150#) ---------- */
  if (body.action === 'verify') {
    const token = String(body.token || '');
    if (!TOKEN_RE.test(token)) return fail(400, 'bad_token');
    const row = await rowByToken(token);
    if (!row || row.user_id !== user.id) return fail(404, 'not_found');
    return json({ statut: await settle(token) });
  }

  /* ---------- Diagnostic (propriétaire seulement) : quel service, quelles clés présentes, et un vrai test de connexion ---------- */
  if (body.action === 'diag') {
    if (!user.admin) return fail(403, 'forbidden');
    const out = {
      provider: payProvider() || 'aucun', pay_provider_var: env('PAY_PROVIDER') || '(vide)', mode: env('PAYDUNYA_MODE', 'live'),
      paydunya: shapes(),
      saspay: /^sk_live_/.test(env('SASPAY_SECRET_KEY')) ? 'live' : /^sk_test_/.test(env('SASPAY_SECRET_KEY')) ? 'test' : env('SASPAY_SECRET_KEY') ? 'format inconnu' : 'absente',
      prix: await prices()
    };
    if (out.provider === 'paydunya') {
      const t = await pd('/checkout-invoice/create', { invoice: { total_amount: 200, description: 'Test de connexion LERNA (aucun débit)' }, store: { name: 'LERNA', website_url: url.origin } });
      out.test = { http: t.status, code: (t.data && t.data.response_code) || null, message: pdMsg(t), ok: !!(t.data && t.data.response_code === '00') };
    } else if (out.provider === 'saspay') {
      const r = await sp('GET', '/countries/');
      out.test = { http: r.status, ok: r.ok, reseaux_senegal: (await snNetworks()).map((n) => n.code), message: r.ok ? '' : clean(r.data) };
      if (paydunyaReady()) {   // PayDunya sert de secours : on le teste aussi
        const t = await pd('/checkout-invoice/create', { invoice: { total_amount: 200, description: 'Test de connexion LERNA (aucun débit)' }, store: { name: 'LERNA', website_url: url.origin } });
        out.test_paydunya = { http: t.status, code: (t.data && t.data.response_code) || null, message: pdMsg(t), ok: !!(t.data && t.data.response_code === '00') };
      }
    }
    out.conseil = hint(out);
    const ev = await sbFetch('/rest/v1/events?ev=eq.pay:fail&select=at,meta&order=at.desc&limit=8');
    out.echecs = Array.isArray(ev.data) ? ev.data : [];
    await logPay('diag', { provider: out.provider, mode: out.mode, paydunya: out.paydunya, saspay: out.saspay, test: out.test || null, conseil: out.conseil });
    return json(out);
  }

  /* ---------- Démarrer un paiement ---------- */
  if (body.action !== 'start') return fail(400, 'unknown_action');
  const plan = body.plan === 'an' ? 'an' : body.plan === 'mois' ? 'mois' : null;
  const method = METHODS.includes(body.method) ? body.method : null;
  if (!plan || !method) return fail(400, 'bad_request');
  const phone = method === 'card' ? null : senPhone(body.phone);
  if (method !== 'card' && !phone) return fail(400, 'bad_phone');
  const key = 'pay:' + user.id;
  if ((await usage(key)) >= 12) return fail(429, 'too_many');
  await hit(key);
  const P = await prices();
  if (!P) return fail(503, 'payment_closed');
  const amount = P[plan];

  const origin = url.origin;
  const me = await sbFetch('/rest/v1/users?id=eq.' + encodeURIComponent(user.id) + '&select=prenom,nom');
  const u = Array.isArray(me.data) && me.data[0] ? me.data[0] : {};
  const fullName = ((u.prenom || '') + ' ' + (u.nom || '')).trim().slice(0, 80) || 'Client LERNA';

  /* ---------- SasPay ---------- */
  if (payProvider() === 'saspay') {
    const desc = 'LERNA Premium — ' + (plan === 'an' ? '1 an' : '1 mois');
    const back = origin + '/premium.html?pay=retour';
    const first = (u.prenom || fullName.split(' ')[0] || 'Client').slice(0, 40), last = (u.nom || 'LERNA').slice(0, 40);
    let token = '', redirect = '', message = '', spErr = '';
    const network = await spNetwork(method);
    if (network && method !== 'card') {
      /* Paiement direct sur le téléphone de l'élève (Wave et Orange Money ouvrent leur appli via un lien) */
      const r = await sp('POST', '/payments/softpay/', { amount: amount.toFixed(2), currency: 'XOF', country: 'SN', network, description: desc,
        customer: { email: user.email, first_name: first, last_name: last, phone: '+221' + phone }, return_url: back, metadata: { user_id: user.id, plan } }, randomUUID());
      const d = (r.data && r.data.data) || {};
      if (r.ok && d.id) { token = 'p-' + d.id; redirect = /^https:\/\//.test(d.checkout_url || '') ? d.checkout_url : ''; message = String(d.instructions || d.message || '').slice(0, 300); }
      else spErr = 'paiement direct HTTP ' + r.status + ' ' + clean(r.data);
    }
    if (!token) {
      /* Carte, ou réseau introuvable : page de paiement sécurisée SasPay (l'élève y choisit son moyen) */
      const r = await sp('POST', '/checkout-sessions/', { amount: amount.toFixed(2), currency: 'XOF', description: desc, customer_email: user.email, customer_name: fullName, return_url: back, metadata: { user_id: user.id, plan } }, randomUUID());
      const d = (r.data && r.data.data) || {};
      if (r.ok && (d.id || d.slug) && /^https:\/\//.test(d.checkout_url || '')) { token = 'c-' + (d.id || d.slug); redirect = d.checkout_url; }
      else spErr = (spErr ? spErr + ' / ' : '') + 'page de paiement HTTP ' + r.status + ' ' + clean(r.data);
    }
    if (!TOKEN_RE.test(token)) {
      const detail = 'SasPay : ' + (spErr || 'pas de réponse');
      await logPay('fail', { p: 'saspay', step: 'start', method, network: network || null, msg: detail, fallback: paydunyaReady() });
      if (!paydunyaReady()) return fail(502, 'provider_error', user.admin ? { detail } : undefined);
      /* sinon : on continue avec PayDunya ci-dessous */
    } else {
      const saved = await sbFetch('/rest/v1/paiements_momo', { method: 'POST', headers: { Prefer: 'return=minimal' },
        body: { user_id: user.id, email: user.email, formule: plan, montant: amount, moyen: method === 'card' ? 'carte' : method, numero_payeur: phone, provider: 'saspay', token } });
      if (!saved.ok) { await logPay('fail', { p: 'saspay', step: 'save', msg: clean(saved.data) }); return fail(500, 'save_failed', user.admin ? { detail: 'Enregistrement : ' + clean(saved.data) } : undefined); }
      return json(redirect ? { token, redirect } : { token, push: true, message });
    }
  }
  if (!paydunyaReady()) return fail(503, 'payment_not_configured');

  const inv = await pd('/checkout-invoice/create', {
    invoice: { total_amount: amount, description: 'LERNA Premium — ' + (plan === 'an' ? '1 an' : '1 mois') },
    store: { name: 'LERNA', website_url: origin },
    actions: { callback_url: origin + '/api/pay?ipn=1', return_url: origin + '/premium.html?pay=retour', cancel_url: origin + '/premium.html?pay=annule' },
    custom_data: { user_id: user.id, plan }
  });
  const token = inv.data && inv.data.response_code === '00' ? String(inv.data.token || '') : '';
  const checkout = inv.data && typeof inv.data.response_text === 'string' && /^https:\/\//.test(inv.data.response_text) ? inv.data.response_text : '';
  if (!TOKEN_RE.test(token)) {
    const mode = env('PAYDUNYA_MODE', 'live'), keys = shapes();
    const detail = 'PayDunya (' + mode + ') : HTTP ' + inv.status + (inv.data && inv.data.response_code ? ', code ' + inv.data.response_code : '') + ' — ' + (pdMsg(inv) || 'pas de réponse');
    const conseil = hint({ provider: 'paydunya', mode, paydunya: keys, test: { ok: false, http: inv.status, message: pdMsg(inv) } });
    await logPay('fail', { p: 'paydunya', step: 'invoice', method, http: inv.status, code: (inv.data && inv.data.response_code) || null, msg: detail, keys, conseil });
    return fail(502, 'provider_error', user.admin ? { detail: detail + (conseil ? ' — Que faire : ' + conseil : '') } : undefined);
  }

  const saved = await sbFetch('/rest/v1/paiements_momo', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: { user_id: user.id, email: user.email, formule: plan, montant: amount, moyen: method === 'card' ? 'carte' : method, numero_payeur: phone, provider: 'paydunya', token }
  });
  if (!saved.ok) { await logPay('fail', { p: 'paydunya', step: 'save', msg: clean(saved.data) }); return fail(500, 'save_failed', user.admin ? { detail: 'Enregistrement : ' + clean(saved.data) } : undefined); }

  const out = { token, checkout };
  if (method === 'wave') {
    const r = await pd('/softpay/wave-senegal', { wave_senegal_fullName: fullName, wave_senegal_email: user.email, wave_senegal_phone: phone, wave_senegal_payment_token: token });
    if (r.data && r.data.success && /^https:\/\//.test(r.data.url || '')) out.redirect = r.data.url;
    else await logPay('fail', { p: 'paydunya', step: 'wave', http: r.status, msg: pdMsg(r) });
  } else if (method === 'orange_money') {
    const r = await pd('/softpay/new-orange-money-senegal', { customer_name: fullName, customer_email: user.email, phone_number: phone, invoice_token: token });
    const o = (r.data && r.data.other_url) || {};
    if (r.data && r.data.success) {
      if (/^https?:\/\//.test(r.data.url || '')) out.qr = r.data.url;
      out.redirect = o.maxit_url || o.om_url || out.qr || '';
      if (o.om_url && o.om_url !== out.redirect) out.alt = o.om_url;
    } else await logPay('fail', { p: 'paydunya', step: 'orange_money', http: r.status, msg: pdMsg(r) });
  } else if (method === 'free_money') {
    const r = await pd('/softpay/free-money-senegal', { customer_name: fullName, customer_email: user.email, phone_number: phone, payment_token: token });
    if (r.data && r.data.success) out.ussd = '#150#';
    else await logPay('fail', { p: 'paydunya', step: 'free_money', http: r.status, msg: pdMsg(r) });
  }
  /* Carte, ou si le paiement direct n'a pas répondu : page de paiement sécurisée PayDunya */
  if (!out.redirect && !out.ussd) out.redirect = checkout;
  if (!out.redirect && !out.ussd) { await logPay('fail', { p: 'paydunya', step: 'no_redirect', method }); return fail(502, 'provider_error', user.admin ? { detail: 'PayDunya : facture créée mais aucun lien de paiement renvoyé' } : undefined); }
  return json(out);
}

export function GET() { return fail(405, 'method_not_allowed'); }
