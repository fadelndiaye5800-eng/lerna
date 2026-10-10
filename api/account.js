/* POST /api/account — { action: "delete" } supprime définitivement le compte connecté.
   Les données liées (profils, recommandations, favoris, avis) partent en cascade (voir schema.sql). */
import { json, fail, sameOrigin, readJson, getUser, sbFetch, supabaseReady } from './_lib.js';

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 2000); } catch (e) { return fail(e.status || 400, e.message); }
  if (body.action !== 'delete') return fail(400, 'unknown_action');
  const user = await getUser(request);
  if (!user) return fail(401, 'not_authenticated');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  /* Coffre-fort : supprime aussi les fichiers privés de la personne (Supabase Storage) */
  try {
    const list = await sbFetch('/storage/v1/object/list/coffre', { method: 'POST', body: { prefix: user.id, limit: 1000 } });
    const folders = Array.isArray(list.data) ? list.data.map((x) => x.name) : [];
    const files = [];
    for (const f of folders) {
      const inner = await sbFetch('/storage/v1/object/list/coffre', { method: 'POST', body: { prefix: user.id + '/' + f, limit: 1000 } });
      (Array.isArray(inner.data) ? inner.data : []).forEach((x) => files.push(user.id + '/' + f + '/' + x.name));
    }
    if (files.length) await sbFetch('/storage/v1/object/coffre', { method: 'DELETE', body: { prefixes: files } });
  } catch { /* le compte est supprimé quand même */ }
  const r = await sbFetch('/auth/v1/admin/users/' + encodeURIComponent(user.id), { method: 'DELETE' });
  if (!r.ok) return fail(500, 'delete_failed');
  return json({ ok: true });
}

export function GET() { return fail(405, 'method_not_allowed'); }
