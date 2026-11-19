/* « Les métiers faits pour toi » — appelé par POST /api/analyze avec { kind: 'metiers' }
   (le forfait gratuit de Vercel accepte au plus 12 fonctions : ce module n'en est pas une, il passe par analyze.js)
   Le moteur LERNA (dans l'appli) prépare ~50 métiers à partir de TOUTES les réponses du test, avec pour chacun
   un % de compatibilité calculé et les métiers que l'élève a nommés lui-même (⭐).
   L'IA vérifie : elle choisit et classe les 10 qui lui vont vraiment, explique pourquoi et ce qui peut coincer,
   et peut corriger le % du moteur de 5 points au plus (imposé ici). Elle ne peut rien inventer : elle recopie les codes. */
import { json, fail, clientIp, hashKey, getUser, usage, hit, claude, extractJson, str } from './_lib.js';

const LABELS = {
  q1: 'Âge', q2: 'Niveau scolaire actuel', q3: 'Bac ou diplôme équivalent', q4: 'Pays actuel', q5: 'Langues parlées (avec niveau)',
  q6: 'Matières aimées', q7: 'Matières difficiles', q8: 'Type de profil personnel', q9: 'Style de travail', q10: "À l'aise avec quoi",
  q12: 'Objectif professionnel principal', q13: 'Lieu de vie souhaité (2 choix max)', q14: 'Priorités de vie',
  q15: "Secteurs d'intérêt", q16: 'Sources de financement', q17: 'Budget annuel scolarité', q18: 'Mobilité internationale',
  q19: 'Besoin de travailler pendant les études', q20: 'Durée de formation souhaitée', q21: "Mode d'apprentissage préféré",
  q22: 'Théorique ou pratique', q23: 'Reconnaissance du diplôme souhaitée', q24: 'Organisation du travail', q25: 'Importance de la vie de campus',
  q11: 'Vision à 10 ans (texte libre)', note: 'Autre chose à savoir (texte libre)'
};
const PICK = 10;
const DOMS = ['business', 'sante', 'tech', 'droit', 'art', 'sciences', 'education', 'ingenierie', 'comm', 'agri'];

const SYSTEM = `Tu es LERNA, le conseiller d'orientation le plus précis et le plus honnête au monde. Tu parles directement à l'élève (tu), simplement.
Tu reçois ses réponses au test d'orientation et une LISTE DE MÉTIERS préparée par le moteur LERNA (codes M1, M2…).
Pour chaque métier, le moteur donne un % de compatibilité calculé avec toutes ses réponses (et le détail : ✓ colle, ~ moyen, ✗ coince).
⭐ = un métier qu'il a nommé lui-même dans ce qu'il a écrit (vision à 10 ans, autre chose à savoir) : c'est le signal le plus fort.
TA MISSION : vérifier ce calcul et garder les ${PICK} métiers qui lui correspondent VRAIMENT, du plus adapté au moins adapté.

RÈGLES ABSOLUES :
1. Tu choisis UNIQUEMENT dans la liste et tu recopies le code exact. N'invente aucun métier.
2. Tu relis TOUTES ses réponses : secteurs, matières aimées ET difficiles, profil, style de travail, objectif, priorités, durée d'études voulue, budget, mobilité, langues, et surtout ce qu'il a écrit lui-même.
3. "pct" = le % du moteur, corrigé de 5 points AU PLUS (vers le haut ou vers le bas), seulement pour une vraie raison tirée de ses réponses (exemple : pour créer son entreprise, il n'a pas besoin du bac + 5 indiqué). Sans raison, garde le % du moteur. Jamais 100.
4. Garde les métiers ⭐ en priorité. N'en écarte un que s'il y a une vraie incohérence, et dans ce cas choisis-en un autre proche.
5. "pourquoi" : une phrase (30 mots maximum) qui cite ses réponses précises. Jamais de phrase générique.
6. "attention" : une phrase honnête sur ce qui peut coincer pour LUI (durée, budget, matière difficile, langue, concurrence…). S'il y a une incohérence entre ses réponses et ce métier (il veut des études courtes mais le métier demande bac + 5…), dis-la ici.
7. Varie : pas plus de 3 métiers presque identiques (par exemple 3 sortes de développeurs au plus) ; si son profil le permet, au moins 2 directions différentes.
8. Le pays n'est pas un critère de choix : un métier est bon s'il lui correspond, où qu'il veuille vivre.
9. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour :
{"resume":"Une phrase : la direction générale qui lui va, avec ses mots à lui","metiers":[{"code":"M4","pct":91,"pourquoi":"…","attention":"…"}]}`;

function cleanAnswers(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of Object.keys(LABELS)) {
    const v = raw[k];
    if (Array.isArray(v)) out[k] = v.slice(0, 12).map((x) => str(x, 300)).filter(Boolean);
    else if (typeof v === 'string') out[k] = str(v, k === 'q11' || k === 'note' ? 1500 : 500);
  }
  return out;
}
/* Liste du moteur : code réel, intitulé, domaines LERNA, niveau, groupe de métiers */
function cleanCandidates(list) {
  const out = [], seen = new Set();
  for (const x of Array.isArray(list) ? list.slice(0, 55) : []) {
    const c = str(x && x.c, 24);
    if (!/^[A-Z][0-9A-Z.\-]{3,22}$/.test(c) || seen.has(c)) continue;
    seen.add(c);
    const p = parseInt(x.p, 10);
    out.push({
      c, t: str(x.t, 140), en: str(x.en, 140), l: str(x.l, 60), g: str(x.g, 120),
      d: (Array.isArray(x.d) ? x.d : []).filter((d) => DOMS.includes(d)).slice(0, 4),
      p: Number.isInteger(p) && p >= 0 && p <= 100 ? p : null, v: str(x.v, 60), w: str(x.w, 200)
    });
  }
  return out.filter((x) => x.t);
}

export async function metiers(request, body) {
  const answers = cleanAnswers(body.answers);
  if (Object.keys(answers).length < 12) return fail(400, 'incomplete_answers');
  const cands = cleanCandidates(body.candidates);
  if (cands.length < PICK) return fail(400, 'few_candidates');
  const lang = body.lang === 'en' ? 'en' : 'fr';

  /* Garde-fous : l'analyse se fait une fois par test ; quelques essais de plus par jour (réseau coupé, test refait) */
  const user = await getUser(request);
  const did = /^[a-f0-9]{32}$/.test(String(body.did || '')) ? String(body.did) : '';
  const ipKey = 'metiers:ip:' + hashKey(clientIp(request));
  const devKey = did ? 'metiers:dev:' + hashKey(did) : null;
  const userKey = user ? 'metiers:user:' + user.id : null;
  const limit = user && user.premium ? 30 : 4;
  const perPerson = Math.max(devKey ? await usage(devKey) : 0, userKey ? await usage(userKey) : 0);
  if (perPerson >= limit || (await usage(ipKey)) >= 300) return fail(429, 'daily_limit', { limit });

  const lines = Object.entries(LABELS).map(([k, label]) => {
    const v = answers[k];
    return label + ' : ' + (Array.isArray(v) ? v.join(', ') : (v || 'Non renseigné'));
  }).join('\n');
  const list = cands.map((x, i) => 'M' + (i + 1) + ' | ' + x.t + (x.en ? ' (' + x.en + ')' : '') + ' | domaines : ' + (x.d.join(', ') || '—') + ' | études : ' + (x.l || '—') + (x.g ? ' | groupe : ' + x.g : '') +
    (x.p !== null ? ' | moteur : ' + x.p + ' %' + (x.w ? ' (' + x.w + ')' : '') : '') + (x.v ? ' | ⭐ il a écrit : « ' + x.v + ' »' : '')).join('\n');
  const prompt = 'RÉPONSES DE L’ÉLÈVE AU TEST LERNA :\n\n' + lines + '\n\nLISTE DES MÉTIERS POSSIBLES (préparée par le moteur LERNA ; choisis uniquement dedans) :\n' + list +
    '\n\nChoisis maintenant ses ' + PICK + ' métiers.' + (lang === 'en' ? '\n\nIMPORTANT : write every text value of the JSON in ENGLISH (keys unchanged).' : '');

  let out;
  try {
    const text = await claude({ mode: 'metiers', system: SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens: 2200 });
    const r = extractJson(text);
    const used = new Set();
    let hundred = false;
    const picks = (Array.isArray(r.metiers) ? r.metiers : []).map((x, i) => {
      const n = parseInt(String((x && x.code) || '').replace(/^M/i, ''), 10);
      const cand = Number.isInteger(n) && n >= 1 && n <= cands.length ? cands[n - 1] : null;
      if (!cand || used.has(cand.c)) return null;
      used.add(cand.c);
      let pct = parseInt(x.pct, 10) || 0;
      if (cand.p !== null) pct = Math.max(cand.p - 5, Math.min(cand.p + 5, pct || cand.p, 97));   // le moteur fixe le %, l'IA corrige de 5 points au plus
      else { pct = Math.max(30, Math.min(100, pct)); if (pct === 100) { if (hundred) pct = 99; hundred = true; } }   // ancienne version de l'appli
      return { c: cand.c, pct, why: str(x.pourquoi, 260), watch: str(x.attention, 260), o: i };
    }).filter(Boolean).slice(0, PICK);
    if (picks.length < 3) throw new Error('empty');
    picks.sort((a, b) => b.pct - a.pct || a.o - b.o);
    picks.forEach((x) => { delete x.o; });
    out = { resume: str(r.resume, 300), metiers: picks, lang, at: new Date().toISOString() };
  } catch (e) {
    return fail(e.status || 502, 'ai_unavailable');
  }
  await hit(ipKey);
  if (devKey) await hit(devKey);
  if (userKey) await hit(userKey);
  return json(out);
}

