/* POST /api/referral — parrainage
   { action: "status" }        → { code, confirmed, pending } (valide au passage les amis devenus éligibles)
   { action: "claim", code }   → rattache le compte qui vient d'être créé à l'ami qui l'a invité
   Un ami compte quand il a créé son compte, confirmé son email et terminé son questionnaire.
   Toute la logique sensible est en SQL (fonctions réservées au service_role, voir schema.sql). */
import { json, fail, sameOrigin, readJson, getUser, sbFetch, supabaseReady, clientIp, hashKey, usage, hit } from './_lib.js';

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 2000); } catch (e) { return fail(e.status || 400, e.message); }
  const user = await getUser(request);
  if (!user) return fail(401, 'not_authenticated');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');

  if (body.action === 'status') {
    const r = await sbFetch('/rest/v1/rpc/lerna_referral_status', { method: 'POST', body: { p_user: user.id } });
    if (!r.ok || !r.data) return fail(500, 'status_failed');
    return json({ code: r.data.code, confirmed: r.data.confirmed || 0, pending: r.data.pending || 0, needed: 3 });
  }

  if (body.action === 'claim') {
    const code = String(body.code || '').toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return fail(400, 'bad_code');
    const key = 'refclaim:' + hashKey(clientIp(request));
    if ((await usage(key)) >= 10) return fail(429, 'daily_limit');
    await hit(key);
    const r = await sbFetch('/rest/v1/rpc/lerna_claim_referral', { method: 'POST', body: { p_user: user.id, p_code: code } });
    if (!r.ok) return fail(500, 'claim_failed');
    const status = typeof r.data === 'string' ? r.data : 'ok';
    return status === 'ok' ? json({ ok: true }) : fail(409, status);
  }

  return fail(400, 'unknown_action');
}

export function GET() { return fail(405, 'method_not_allowed'); }
