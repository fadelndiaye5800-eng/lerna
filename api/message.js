/* POST /api/message — messages envoyés à l'équipe LERNA
   kind = 'contact' : formulaire de la page Contact (problème, ajout, retrait, question, partenariat, données personnelles)
   kind = 'report'  : « Signaler une offre expirée » sur une bourse, un stage, un emploi ou un investisseur
   Tout est enregistré dans Supabase (visible dans /admin). Les messages de contact sont aussi transférés
   en privé par email (Resend) à l'adresse CONTACT_FORWARD_TO, qui n'est jamais affichée ni renvoyée au navigateur.
   (Une seule fonction pour les deux : le plan Vercel gratuit limite le nombre de fonctions à 12.) */
import { json, fail, sameOrigin, readJson, getUser, sbFetch, supabaseReady, clientIp, hashKey, usage, hit, str, env } from './_lib.js';

const SUJETS = ['probleme', 'ajout', 'retrait', 'question', 'partenariat', 'donnees'];
const RAISONS = ['expiree', 'lien_casse', 'info_fausse', 'autre'];
const SUJET_FR = { probleme: 'Un problème', ajout: 'Proposer un ajout', retrait: 'Proposer un retrait', question: 'Une question', partenariat: 'Partenariat', donnees: 'Mes données personnelles' };
/* Garde les retours à la ligne du message (str() les remplace par des espaces) */
const text = (v, max) => (typeof v === 'string' ? v.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

async function forward({ sujet, nom, email, message, page, user }) {
  const key = env('RESEND_API_KEY'), to = env('CONTACT_FORWARD_TO'), from = env('CONTACT_FROM');
  if (!key || !to || !from) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: email || undefined,
        subject: '[LERNA] ' + (SUJET_FR[sujet] || sujet) + (nom ? ' — ' + nom : ''),
        text: [
          'Sujet : ' + (SUJET_FR[sujet] || sujet),
          'Nom : ' + (nom || '—'),
          'Email : ' + (email || '—'),
          'Compte : ' + (user ? user.id : 'non connecté'),
          'Page : ' + (page || '—'),
          '',
          message
        ].join('\n')
      })
    });
    return res.ok;
  } catch { return false; }
}

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 8000); } catch (e) { return fail(e.status || 400, e.message); }
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  if (str(body.website, 50)) return json({ ok: true }); // champ piège invisible : un robot l'a rempli
  const user = await getUser(request);
  const ipKey = hashKey(clientIp(request));

  if (body.kind === 'report') {
    const opp = str(body.opp, 60);
    if (!/^[a-z0-9-]{2,60}$/.test(opp)) return fail(400, 'bad_opp');
    const raison = RAISONS.includes(body.raison) ? body.raison : 'expiree';
    const key = 'report:' + ipKey;
    if ((await usage(key)) >= 20) return fail(429, 'daily_limit');
    await hit(key);
    const r = await sbFetch('/rest/v1/signalements', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: { opp_id: opp, raison, message: text(body.message, 600) || null, user_id: user ? user.id : null }
    });
    if (!r.ok) return fail(500, 'save_failed');
    return json({ ok: true });
  }

  if (body.kind === 'contact') {
    const sujet = SUJETS.includes(body.sujet) ? body.sujet : null;
    const message = text(body.message, 3000);
    const email = str(body.email, 160) || (user && user.email) || '';
    const nom = str(body.nom, 80);
    if (!sujet) return fail(400, 'bad_subject');
    if (message.length < 10) return fail(400, 'message_too_short');
    if (!EMAIL_RE.test(email)) return fail(400, 'bad_email');
    const key = 'contact:' + ipKey;
    if ((await usage(key)) >= 5) return fail(429, 'daily_limit');
    await hit(key);
    const page = str(body.page, 200);
    const sent = await forward({ sujet, nom, email, message, page, user });
    const r = await sbFetch('/rest/v1/messages_contact', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: { sujet, nom: nom || null, email, message, page: page || null, user_id: user ? user.id : null, transfere: sent, lang: body.lang === 'en' ? 'en' : 'fr' }
    });
    if (!r.ok && !sent) return fail(500, 'save_failed');
    return json({ ok: true });
  }

  return fail(400, 'bad_kind');
}
