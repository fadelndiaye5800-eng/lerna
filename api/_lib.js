/* ==========================================================================
   LERNA — utilitaires serveur (fonctions Vercel, runtime Node.js, signature Web)
   Toutes les clés viennent des variables d'environnement Vercel. Rien n'est en dur.
   Les fichiers préfixés par "_" ne sont pas exposés comme routes par Vercel.
   ========================================================================== */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/* Nom exact, sinon le même en minuscules (une traduction automatique peut changer la casse) */
export const env = (k, d = '') => (process.env[k] || process.env[k.toLowerCase()] || d).trim();

export const MODEL = 'claude-sonnet-4-6';

/* ---------- Réponses ---------- */
const SEC_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...SEC_HEADERS, ...extra } });
}
export const fail = (status, error, extra) => json({ error, ...(extra || {}) }, status);

/* Refuse les appels venant d'un autre site (protection CSRF / abus de quota) */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // requêtes same-origin sans en-tête Origin (certains navigateurs)
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return new URL(origin).host === host;
  } catch { return false; }
}

export async function readJson(request, maxBytes = 40000) {
  const text = await request.text();
  if (text.length > maxBytes) throw Object.assign(new Error('too_large'), { status: 413 });
  try { return JSON.parse(text || '{}'); } catch { throw Object.assign(new Error('bad_json'), { status: 400 }); }
}

/* ---------- Identité ---------- */
export function clientIp(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
}
export function hashKey(value) {
  const salt = env('RATE_LIMIT_SALT', env('SUPABASE_URL', 'lerna'));
  return createHash('sha256').update(salt + '|' + value).digest('hex').slice(0, 40);
}

/* ---------- Supabase (REST, sans dépendance) ---------- */
const SB_URL = () => env('SUPABASE_URL').replace(/\/$/, '');
const SERVICE = () => env('SUPABASE_SERVICE_ROLE_KEY');
export const supabaseReady = () => !!(SB_URL() && SERVICE());

export async function sbFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(SB_URL() + path, {
    method,
    headers: {
      apikey: SERVICE(),
      Authorization: 'Bearer ' + SERVICE(),
      'Content-Type': 'application/json',
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const txt = await res.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { ok: res.ok, status: res.status, data };
}

/* Vérifie le jeton de session Supabase envoyé par le navigateur */
export async function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !SB_URL()) return null;
  try {
    const res = await fetch(SB_URL() + '/auth/v1/user', {
      headers: { apikey: env('SUPABASE_ANON_KEY') || SERVICE(), Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return null;
    const u = await res.json();
    if (!u || !u.id) return null;
    let premium = false;
    if (supabaseReady()) {
      const row = await sbFetch('/rest/v1/users?id=eq.' + encodeURIComponent(u.id) + '&select=is_premium,premium_expiry');
      const r = Array.isArray(row.data) ? row.data[0] : null;
      premium = !!(r && r.is_premium && (!r.premium_expiry || new Date(r.premium_expiry) > new Date()));
    }
    const paid = premium;
    if (premiumOpen()) premium = true; // phase de lancement : tout est ouvert
    return { id: u.id, email: u.email, premium, paid, verified: !!u.email_confirmed_at, created: u.created_at };
  } catch { return null; }
}

/* Premium pas encore lancé : tout est ouvert (PREMIUM_ENABLED=false) */
export const premiumOpen = () => env('PREMIUM_ENABLED', 'true') === 'false';

/* ---------- Réponses au questionnaire ---------- */
export const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25'];
const LANG_CODES = ['fr', 'en', 'ar', 'es', 'pt', 'de', 'it', 'zh', 'ru', 'tr', 'ja', 'ko'];
const ID_RE = /^[a-z0-9-]{1,30}$/;
/* Nettoie les réponses brutes envoyées par le navigateur (identifiants, « Autre », niveaux de langue) */
export function cleanRaw(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of QUESTION_KEYS) {
    const v = raw[k];
    if (Array.isArray(v)) out[k] = v.slice(0, 12).filter((x) => typeof x === 'string' && ID_RE.test(x));
    else if (typeof v === 'string') out[k] = k === 'q11' ? str(v, 2000) : (k === 'q4' ? (/^[A-Z]{2}$/.test(v) ? v : '') : (ID_RE.test(v) ? v : ''));
    const o = raw[k + '_autre'];
    if (typeof o === 'string' && o.trim()) out[k + '_autre'] = str(o, 200);
  }
  if (raw.q5_lvl && typeof raw.q5_lvl === 'object') {
    const lv = {};
    for (const [code, level] of Object.entries(raw.q5_lvl)) if (LANG_CODES.includes(code) && (level === 'aise' || level === 'inter' || level === 'deb')) lv[code] = level;
    out.q5_lvl = lv;
  }
  if (typeof raw.note === 'string' && raw.note.trim()) out.note = str(raw.note, 1000);
  return out;
}
const asArr = (v) => (Array.isArray(v) ? v : v ? [v] : null);
/* Sauvegarde profil (+ recommandations) d'un compte connecté. Renvoie l'id des recommandations. */
export async function saveProfile(user, raw, result, source = 'ai') {
  if (!user || !supabaseReady()) return null;
  const s = (v) => (typeof v === 'string' && v ? v : null);
  const autres = {};
  for (const k of QUESTION_KEYS) if (raw[k + '_autre']) autres[k] = raw[k + '_autre'];
  await sbFetch('/rest/v1/profils', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: {
      user_id: user.id, age_range: s(raw.q1), niveau: s(raw.q2), bac: s(raw.q3), pays_actuel: s(raw.q4), langues: asArr(raw.q5),
      langues_niveaux: raw.q5_lvl || null, matieres_fortes: asArr(raw.q6), matieres_faibles: asArr(raw.q7), profil_type: s(raw.q8),
      style_travail: s(raw.q9), a_laise_avec: s(raw.q10), vision_10ans: s(raw.q11), objectif_pro: s(raw.q12), destination: asArr(raw.q13),
      priorites: asArr(raw.q14), secteurs: asArr(raw.q15), financement: asArr(raw.q16), budget: s(raw.q17), mobilite: s(raw.q18),
      travail_pendant: s(raw.q19), duree_formation: s(raw.q20), mode_apprentissage: s(raw.q21), theorique_pratique: s(raw.q22),
      reconnaissance: s(raw.q23), organisation: s(raw.q24), vie_campus: s(raw.q25), autres: Object.keys(autres).length ? autres : null,
      note_libre: s(raw.note), source
    }
  }).catch(() => null);
  let id = null;
  if (result && Array.isArray(result.recos) && result.recos.length) {
    const r = result.recos;
    const saved = await sbFetch('/rest/v1/recommandations', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: { user_id: user.id, resume: str(result.resume, 900), reco_1_json: r[0] || null, reco_2_json: r[1] || null, reco_3_json: r[2] || null, reco_4_json: r[3] || null, reco_5_json: r[4] || null, conseil: str(result.conseil, 500), source }
    }).catch(() => null);
    if (saved && saved.ok && Array.isArray(saved.data) && saved.data[0]) id = saved.data[0].id;
  }
  // Un ami parrainé compte dès que son email est confirmé et son questionnaire terminé
  await sbFetch('/rest/v1/rpc/lerna_confirm_referred', { method: 'POST', body: { p_user: user.id } }).catch(() => null);
  return id;
}

/* ---------- Limitation de débit ---------- */
const memory = new Map(); // secours si Supabase n'est pas configuré (par instance)
const today = () => new Date().toISOString().slice(0, 10);

export async function usage(key) {
  if (supabaseReady()) {
    const r = await sbFetch('/rest/v1/rpc/lerna_usage', { method: 'POST', body: { p_key: key } });
    if (r.ok && typeof r.data === 'number') return r.data;
  }
  return memory.get(today() + key) || 0;
}
export async function hit(key) {
  if (supabaseReady()) {
    const r = await sbFetch('/rest/v1/rpc/lerna_hit', { method: 'POST', body: { p_key: key } });
    if (r.ok) return;
  }
  const k = today() + key;
  memory.set(k, (memory.get(k) || 0) + 1);
}

/* ---------- Claude ---------- */
export async function claude({ system, messages, maxTokens = 2000 }) {
  const key = env('ANTHROPIC_API_KEY');
  if (!key) throw Object.assign(new Error('no_api_key'), { status: 503 });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const e = new Error('claude_' + res.status);
      e.status = res.status === 429 || res.status === 529 ? 503 : 502;
      throw e;
    }
    return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
  } finally { clearTimeout(timer); }
}

/* Extrait un objet JSON d'une réponse texte (tolère des ``` éventuels) */
export function extractJson(text) {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a === -1 || b <= a) throw new Error('no_json');
  return JSON.parse(clean.slice(a, b + 1));
}

export const str = (v, max = 400) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/* ---------- Lemon Squeezy ---------- */
export function verifySignature(raw, signature, secret) {
  if (!signature || !secret) return false;
  const digest = createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(digest, 'utf8'), b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
