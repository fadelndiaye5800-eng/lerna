/* POST /api/opps — détails des offres Premium (titre, organisation, lien, montant…)
   Ces détails ne sont JAMAIS dans le code du site : ils vivent dans Supabase (colonne "data")
   et ne sortent d'ici que pour un compte Premium, ou pour tous tant que le Premium n'est pas lancé. */
import { json, fail, sameOrigin, getUser, sbFetch, supabaseReady, premiumOpen } from './_lib.js';

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  const user = await getUser(request);
  if (!premiumOpen() && !(user && user.paid)) return fail(402, 'premium_required');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  const r = await sbFetch('/rest/v1/opportunites?is_premium=eq.true&active=eq.true&select=slug,data');
  if (!r.ok || !Array.isArray(r.data)) return fail(500, 'read_failed');
  const items = r.data.filter((x) => x.data && typeof x.data === 'object').map((x) => ({ ...x.data, id: x.slug, premium: true }));
  return json({ items }, 200, { 'Cache-Control': 'private, no-store' });
}

export function GET() { return fail(405, 'method_not_allowed'); }
