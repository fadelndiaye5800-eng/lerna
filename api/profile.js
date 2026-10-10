/* POST /api/profile — sauvegarde le questionnaire fait AVANT la création du compte
   (le navigateur l'envoie juste après la connexion). Aucun appel à l'IA ici.
   Sert aussi à valider le parrainage : l'ami invité doit avoir terminé son questionnaire. */
import { json, fail, sameOrigin, readJson, getUser, supabaseReady, cleanRaw, saveProfile, usage, hit, str } from './_lib.js';

function cleanResults(r) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.recos)) return null;
  const recos = r.recos.slice(0, 5).map((x) => ({
    id: str(x && x.id, 40) || null, nom: str(x && x.nom, 160), pays: str(x && x.pays, 80), ville: str(x && x.ville, 80),
    type: str(x && x.type, 40), frais: str(x && x.frais, 120), score: Math.max(0, Math.min(100, parseInt(x && x.score, 10) || 0)),
    pourquoi: (Array.isArray(x && x.pourquoi) ? x.pourquoi : []).slice(0, 3).map((p) => str(p, 400)).filter(Boolean),
    points_forts: (Array.isArray(x && x.points_forts) ? x.points_forts : []).slice(0, 3).map((p) => str(p, 200)).filter(Boolean),
    point_attention: str(x && x.point_attention, 400)
  })).filter((x) => x.nom);
  return recos.length ? { resume: str(r.resume, 900), recos, conseil: str(r.conseil, 500) } : null;
}

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request, 40000); } catch (e) { return fail(e.status || 400, e.message); }
  const user = await getUser(request);
  if (!user) return fail(401, 'not_authenticated');
  if (!supabaseReady()) return fail(503, 'supabase_not_configured');
  const raw = cleanRaw(body.raw);
  const answered = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q8', 'q12', 'q13', 'q15', 'q16', 'q17', 'q18'].filter((k) => raw[k] && raw[k].length).length;
  if (answered < 10) return fail(400, 'incomplete_answers');
  const key = 'profile:user:' + user.id;
  if ((await usage(key)) >= 5) return fail(429, 'daily_limit');
  await hit(key);
  const id = await saveProfile(user, raw, cleanResults(body.results), 'sync');
  return json({ ok: true, id });
}

export function GET() { return fail(405, 'method_not_allowed'); }
