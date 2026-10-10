/* /api/review — avis sur LERNA (étoiles + commentaire)
   POST : enregistre un avis (publié seulement après validation par l'équipe, et seulement si la personne l'accepte)
   GET  : avis validés et publics, note moyenne et nombre d'avis (la section ne s'affiche qu'à partir de 3 vrais avis) */
import { json, fail, sameOrigin, readJson, getUser, sbFetch, supabaseReady, clientIp, hashKey, usage, hit, str } from './_lib.js';

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 4000); } catch (e) { return fail(e.status || 400, e.message); }
  const note = parseInt(body.note, 10);
  if (!(note >= 1 && note <= 5)) return fail(400, 'bad_note');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  const key = 'review:' + hashKey(clientIp(request));
  if ((await usage(key)) >= 3) return fail(429, 'daily_limit');
  await hit(key);
  const user = await getUser(request);
  let prenom = null, pays = null;
  if (user) {
    const row = await sbFetch('/rest/v1/users?id=eq.' + encodeURIComponent(user.id) + '&select=prenom,pays');
    const u = Array.isArray(row.data) ? row.data[0] : null;
    if (u) { prenom = str(u.prenom, 40) || null; pays = str(u.pays, 2) || null; }
  }
  const r = await sbFetch('/rest/v1/avis_app', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: {
      user_id: user ? user.id : null, prenom, pays, note,
      commentaire: str(body.commentaire, 600) || null,
      publier: body.publier === true && !!user,      // un avis public doit venir d'un compte (prénom vérifiable)
      lang: body.lang === 'en' ? 'en' : 'fr', source: str(body.trigger, 30) || null
    }
  });
  if (!r.ok) return fail(500, 'save_failed');
  return json({ ok: true });
}

export async function GET() {
  if (!supabaseReady()) return json({ count: 0, average: null, items: [] });
  const r = await sbFetch('/rest/v1/avis_app?valide=eq.true&publier=eq.true&select=prenom,pays,note,commentaire,lang,created_at&order=created_at.desc&limit=200');
  const rows = Array.isArray(r.data) ? r.data : [];
  const avg = rows.length ? Math.round((rows.reduce((a, x) => a + x.note, 0) / rows.length) * 10) / 10 : null;
  const items = rows.filter((x) => x.commentaire).slice(0, 12);
  return json({ count: rows.length, average: avg, items }, 200, { 'Cache-Control': 'public, max-age=600' });
}
