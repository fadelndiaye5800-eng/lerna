/* POST /api/webhook — webhook Lemon Squeezy → statut Premium dans Supabase (document maître §17)
   La signature HMAC est vérifiée avec LEMON_SQUEEZY_WEBHOOK_SECRET : sans signature valide, rien n'est modifié.
   Dans Lemon Squeezy : Settings → Webhooks → URL https://TON-DOMAINE/api/webhook,
   événements subscription_created, subscription_updated, subscription_cancelled, subscription_resumed,
   subscription_expired, subscription_paused, subscription_unpaused. */
import { json, fail, env, verifySignature, sbFetch, supabaseReady } from './_lib.js';

const ACTIVE = ['active', 'on_trial', 'past_due'];

export async function POST(request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get('x-signature'), env('LEMON_SQUEEZY_WEBHOOK_SECRET'))) return fail(401, 'bad_signature');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');

  let evt;
  try { evt = JSON.parse(raw); } catch { return fail(400, 'bad_json'); }
  const name = evt?.meta?.event_name || '';
  if (!name.startsWith('subscription_')) return json({ ok: true, ignored: name });

  const a = evt?.data?.attributes || {};
  let userId = evt?.meta?.custom_data?.user_id;
  if (!userId && a.user_email) {
    const found = await sbFetch('/rest/v1/users?email=eq.' + encodeURIComponent(String(a.user_email).toLowerCase()) + '&select=id');
    userId = Array.isArray(found.data) && found.data[0] ? found.data[0].id : null;
  }
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return json({ ok: true, ignored: 'no_user' });

  const status = String(a.status || '');
  const endsAt = a.ends_at ? new Date(a.ends_at) : null;
  const renewsAt = a.renews_at ? new Date(a.renews_at) : null;
  const stillPaid = status === 'cancelled' && endsAt && endsAt > new Date();
  const isPremium = ACTIVE.includes(status) || stillPaid;
  const expiry = status === 'cancelled' ? endsAt : renewsAt;

  const patch = {
    is_premium: isPremium,
    premium_expiry: expiry ? expiry.toISOString() : null,
    ls_customer_id: a.customer_id ? String(a.customer_id) : null,
    ls_subscription_id: evt?.data?.id ? String(evt.data.id) : null,
    ls_portal_url: a.urls?.customer_portal || null
  };
  const r = await sbFetch('/rest/v1/users?id=eq.' + userId, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: patch });
  if (!r.ok) return fail(500, 'update_failed');
  return json({ ok: true });
}

export function GET() { return fail(405, 'method_not_allowed'); }
