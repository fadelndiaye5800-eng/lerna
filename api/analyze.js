/* POST /api/analyze — analyse IA des 25 réponses (document maître §14)
   5 recommandations : 2 visibles par tous, n°3-4 débloquées par 3 amis invités (ou Premium), n°5 Premium.
   Gratuit : 1 analyse complète par jour et par adresse IP (et par compte). Premium : illimité. */
import { json, fail, sameOrigin, readJson, clientIp, hashKey, getUser, usage, hit, claude, extractJson, str, cleanRaw, saveProfile } from './_lib.js';
import { buildCandidates, candidatesPrompt, bindRecos } from './_catalogue.js';

const LABELS = {
  q1: 'Âge', q2: 'Niveau scolaire actuel', q3: 'Bac ou diplôme équivalent', q4: 'Pays actuel', q5: 'Langues parlées (avec niveau)',
  q6: 'Matières aimées', q7: 'Matières difficiles', q8: 'Type de profil personnel', q9: 'Style de travail', q10: "À l'aise avec quoi",
  q12: 'Objectif professionnel principal', q13: 'Lieu de vie souhaité (2 choix max)', q14: 'Priorités de vie',
  q15: "Secteurs d'intérêt", q16: 'Sources de financement (plusieurs possibles)', q17: 'Budget annuel scolarité', q18: 'Mobilité internationale',
  q19: 'Besoin de travailler pendant les études', q20: 'Durée de formation souhaitée', q21: "Mode d'apprentissage préféré",
  q22: 'Théorique ou pratique', q23: 'Reconnaissance du diplôme souhaitée', q24: 'Organisation du travail', q25: 'Importance de la vie de campus',
  q11: 'Vision à 10 ans (texte libre)', note: 'Autre chose à savoir (texte libre)'
};
const RECO_COUNT = 5;

/* Établissements documentés dans LERNA : si l'un convient, l'IA reprend son nom exact (lien vers la fiche) */
const KNOWN = "Université Cheikh Anta Diop (UCAD) ; CESAG — Centre Africain d’Études Supérieures en Gestion ; ISM — Groupe Institut Supérieur de Management ; Université Félix Houphouët-Boigny ; Institut National Polytechnique Félix Houphouët-Boigny (INP-HB) ; University of Ghana ; University of Lagos (UNILAG) ; 2iE — Institut International d’Ingénierie de l’Eau et de l’Environnement ; Université Mohammed V de Rabat ; Université Mohammed VI Polytechnique (UM6P) ; University of Cape Town (UCT) ; Strathmore University ; Université de Bordeaux ; Sorbonne Université ; Sciences Po Paris ; HEC Paris ; UCLouvain ; Technische Universität München (TUM) ; RWTH Aachen University ; Université de Genève ; Université de Montréal ; Université Laval ; University of Toronto ; Massachusetts Institute of Technology (MIT) ; Université de Tokyo ; KAIST ; Université Tsinghua ; National University of Singapore (NUS) ; Khalifa University ; University of the People ; Université Numérique Cheikh Hamidou Kane (ex-UVS) ; OpenClassrooms ; Stanford University ; Harvard University ; California Institute of Technology (Caltech) ; Princeton University ; Yale University ; Columbia University ; University of Chicago ; University of Pennsylvania ; Cornell University ; Johns Hopkins University ; Duke University ; University of Michigan ; Northwestern University ; Georgetown University ; Georgia Institute of Technology (Georgia Tech) ; University of Texas at Austin ; Purdue University ; Howard University ; University of California, Los Angeles (UCLA) ; McGill University ; University of British Columbia ; University of Waterloo ; Western University ; Queen’s University ; University of Calgary ; Université d’Ottawa ; Dalhousie University ; Concordia University ; York University ; Université du Québec à Montréal (UQAM) ; Simon Fraser University ; University of Melbourne ; Australian National University (ANU) ; University of Sydney ; UNSW Sydney ; University of Oxford ; University of Cambridge ; Imperial College London ; University College London (UCL) ; King’s College London ; University of Manchester ; University of Edinburgh ; University of Bristol ; University of Glasgow ; University of Warwick ; University of Birmingham ; University of Leeds ; Université PSL (Paris Sciences & Lettres) ; Institut Polytechnique de Paris ; Université Paris-Saclay ; École Polytechnique ; ESSEC Business School ; EDHEC Business School ; Ludwig-Maximilians-Universität München (LMU Munich) ; Heidelberg University (Ruprecht-Karls-Universität Heidelberg) ; Freie Universität Berlin ; Humboldt-Universität zu Berlin ; KU Leuven ; Université libre de Bruxelles (ULB) ; Vrije Universiteit Brussel (VUB) ; ETH Zurich ; École polytechnique fédérale de Lausanne (EPFL) ; Université de Lausanne (UNIL) ; Delft University of Technology (TU Delft) ; Leiden University ; Utrecht University ; University of Amsterdam (UvA) ; University of Oslo (UiO) ; University of Copenhagen (Københavns Universitet) ; Lund University ; University of Helsinki ; Aalto University ; Universidad Autónoma de Madrid ; Universitat de Barcelona ; IESE Business School ; IE University ; Université de Bologne (Alma Mater Studiorum) ; Politecnico di Milano ; Sapienza Université de Rome ; Université Charles ; Université de Varsovie ; Université Eötvös Loránd (ELTE) ; Université de Vienne ; King Abdullah University of Science and Technology (KAUST) ; American University of Beirut (AUB) ; Universiti Malaya (UM) ; Universiti Teknologi PETRONAS (UTP) ; Universiti Teknologi Malaysia (UTM) ; Taylor’s University ; Indian Institute of Technology Delhi (IIT Delhi) ; Indian Institute of Technology Bombay (IIT Bombay) ; Indian Institute of Technology Madras (IIT Madras) ; University of Delhi ; Nanyang Technological University (NTU) ; Singapore Management University ; Peking University ; Fudan University ; Shanghai Jiao Tong University ; Zhejiang University ; Chinese University of Hong Kong ; Kyoto University ; Osaka University ; Keio University ; Waseda University ; Seoul National University ; Yonsei University ; Korea University ; University of the Witwatersrand (Wits) ; Stellenbosch University ; University of Pretoria ; Rhodes University ; University of South Africa (UNISA) ; Cairo University ; American University in Cairo (AUC) ; Université de Tunis El Manar ; ESCA École de Management ; Kwame Nkrumah University of Science and Technology (KNUST) ; University of Ibadan ; University of Nairobi ; Makerere University ; University of Rwanda ; Addis Ababa University ; University of Dar es Salaam";

const SYSTEM = `Tu es LERNA, le conseiller d'orientation le plus bienveillant et le plus précis au monde.
Tu parles directement à l'étudiant avec chaleur, honnêteté et précision.

TES RÈGLES ABSOLUES :
1. Tu ne donnes JAMAIS de réponses génériques — chaque recommandation est justifiée par les réponses spécifiques de cet étudiant précis.
2. Tu recommandes des établissements RÉELS avec leurs vrais noms et leurs vraies conditions d'admission. Les frais dépendent de la filière, de l'année et du statut (local / étranger) : n'écris jamais un prix unique présenté comme certain. LERNA affiche lui-même les frais vérifiés de ses fiches.
3. Tu expliques TOUJOURS pourquoi cette école correspond à CE profil précis — pas à n'importe quel étudiant.
4. Tu es HONNÊTE sur les points faibles des écoles. LERNA ne ment jamais pour plaire.
5. Tu prends en compte le BUDGET en priorité absolue — jamais de recommandation hors de portée financière.
6. Tu prends en compte la MOBILITÉ — si l'étudiant ne peut pas partir, tu ne recommandes que des options locales ou régionales.
7. Tu parles à l'étudiant comme à un ami intelligent, pas comme à un client.
8. Tu n'utilises jamais de formules creuses comme "excellent choix" ou "tu es sur la bonne voie" sans justification.
9. Tu penses MONDE ENTIER — pas seulement Afrique, pas seulement Europe.
10. Tu dois répondre UNIQUEMENT en JSON valide, sans aucun markdown, sans backticks, sans texte avant ou après le JSON.
11. Tous les montants sont en dollars américains (USD). Si un montant est approximatif, écris "≈".
12. Si l'étudiant est mineur ou au collège/lycée, recommande des parcours post-bac adaptés et explique simplement.
13. Les réponses « Autre : … » ont été écrites par l'étudiant lui-même : prends-les en compte comme les autres.
14. Chaque langue est donnée avec un niveau (à l'aise / intermédiaire / débutant). Si une école enseigne dans une langue où l'étudiant n'est qu'intermédiaire, dis-le dans point_attention et propose une solution concrète (programme bilingue, cours intensifs, test à préparer comme IELTS, TOEFL ou TCF).
15. Le financement peut combiner plusieurs sources (parents, bourse, travail, prêt…) : tiens compte de toutes.
16. Les 5 recommandations sont classées de la plus adaptée à la moins adaptée, avec des pays variés quand c'est cohérent.
17. Si l'étudiant est DÉBUTANT dans une langue, ne recommande AUCUNE formation enseignée dans cette langue, sauf si une vraie année de langue préparatoire existe avant la formation (par exemple l'année préparatoire de langue des universités turques, la faculté préparatoire en Russie, l'année de chinois prévue par certaines bourses du gouvernement chinois) : dans ce cas, dis-le clairement dans point_attention.
18. Le champ "frais_usd" est un NOMBRE : le tarif annuel le plus bas en dollars pour CET étudiant (local ou international selon son pays), seulement si tu en es sûr ; 0 si c'est gratuit, null si tu n'es pas sûr. Le champ "frais" dit « à partir de … selon la filière » ou « à confirmer sur le site officiel ». L'application remplace ces valeurs par les frais vérifiés de ses fiches quand elle les a.

Établissements déjà documentés dans LERNA (si l'un d'eux convient, reprends exactement son nom ; tu peux aussi en recommander d'autres) : ${KNOWN}.

FORMAT DE RÉPONSE OBLIGATOIRE :
{
  "resume": "2 à 3 phrases personnalisées qui résument le profil de cet étudiant spécifiquement",
  "recos": [
    {
      "nom": "Nom exact de l'établissement",
      "pays": "Pays",
      "ville": "Ville",
      "type": "Publique ou Privée",
      "frais": "À partir de ≈ 3100$/an selon la filière (étudiant hors UE) — ou « À confirmer sur le site officiel »",
      "frais_usd": 3100,
      "score": 92,
      "pourquoi": ["Raison 1 directement tirée d'une réponse spécifique de l'étudiant", "Raison 2 directement liée à ses objectifs ou contraintes", "Raison 3 qui montre que l'IA a vraiment compris son profil unique"],
      "points_forts": ["Point fort 1", "Point fort 2"],
      "point_attention": "Un point réaliste et honnête à considérer"
    }
  ],
  "conseil": "Un message final d'encouragement de 1 à 2 phrases, personnalisé, jamais générique"
}`;

/* Même règles, mais l'IA choisit dans la liste préparée par le moteur LERNA (plus d'établissement inventé) */
const LIST_RULE = `LISTE DU MOTEUR LERNA : avec les réponses, tu reçois une liste d'établissements RÉELS et reconnus officiellement, préparée pour CET étudiant (pays, langue, budget, domaine), chacun avec un code (C1, C2…).
- Tu choisis tes ${RECO_COUNT} recommandations UNIQUEMENT dans cette liste et tu recopies leur code dans le champ "code". N'invente aucun établissement et ne change pas leur nom.
- À adéquation égale, préfère une « FICHE VÉRIFIÉE PAR LERNA ».
- Si les frais d'un établissement ne sont pas « vérifiés » dans la liste, écris "frais": "À confirmer avec l'établissement" et "frais_usd": null.
- Les filières, conditions et dates qui ne sont pas dans la liste : appuie-toi sur ce que tu sais, avec prudence, et dis qu'elles sont à confirmer.
- Si l'étudiant vise une première année d'études supérieures, écarte les établissements qui ne forment qu'en master, MBA ou formation de cadres.`;
const SYSTEM_LIST = SYSTEM
  .replace(/Établissements déjà documentés dans LERNA[^\n]*\n/, LIST_RULE + '\n')
  .replace('"nom": "Nom exact de l\'établissement",', '"code": "C3",\n      "nom": "Nom exact de l\'établissement, recopié de la liste",');

function buildPrompt(answers, lang) {
  const lines = Object.entries(LABELS).map(([key, label]) => {
    const val = answers[key];
    const display = Array.isArray(val) ? val.join(', ') : (val || 'Non renseigné');
    return `${label} : ${display}`;
  }).join('\n');
  const langLine = lang === 'en'
    ? '\n\nIMPORTANT : rédige toutes les valeurs texte du JSON en ANGLAIS (les clés restent identiques).'
    : '';
  return `Voici les 25 réponses complètes de l'étudiant au questionnaire LERNA :\n\n${lines}\n\nGénère maintenant ${RECO_COUNT} recommandations d'établissements réels, précises et personnalisées pour CE profil spécifique.${langLine}`;
}

function cleanAnswers(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of Object.keys(LABELS)) {
    const v = raw[k];
    if (Array.isArray(v)) out[k] = v.slice(0, 12).map((x) => str(x, 300)).filter(Boolean);
    else if (typeof v === 'string') out[k] = str(v, k === 'q11' || k === 'note' ? 2000 : 600);
  }
  return out;
}

function cleanResult(r) {
  const recos = (Array.isArray(r.recos) ? r.recos : []).slice(0, RECO_COUNT + 3).map((x) => ({
    code: str(x.code, 8),
    nom: str(x.nom, 160),
    pays: str(x.pays, 80),
    ville: str(x.ville, 80),
    type: str(x.type, 40),
    frais: str(x.frais, 120),
    frais_usd: typeof x.frais_usd === 'number' && x.frais_usd >= 0 && x.frais_usd < 1e6 ? Math.round(x.frais_usd) : null,
    score: Math.max(0, Math.min(100, parseInt(x.score, 10) || 0)),
    pourquoi: (Array.isArray(x.pourquoi) ? x.pourquoi : []).slice(0, 3).map((p) => str(p, 400)).filter(Boolean),
    points_forts: (Array.isArray(x.points_forts) ? x.points_forts : []).slice(0, 3).map((p) => str(p, 200)).filter(Boolean),
    point_attention: str(x.point_attention, 400)
  })).filter((x) => x.nom);
  return { resume: str(r.resume, 900), recos, conseil: str(r.conseil, 500) };
}

export async function POST(request) {
  if (!sameOrigin(request)) return fail(403, 'forbidden_origin');
  let body;
  try { body = await readJson(request); } catch (e) { return fail(e.status || 400, e.message); }

  const answers = cleanAnswers(body.answers);
  if (Object.keys(answers).length < 15) return fail(400, 'incomplete_answers');
  const lang = body.lang === 'en' ? 'en' : 'fr';

  const user = await getUser(request);
  const ipKey = 'analyze:ip:' + hashKey(clientIp(request));
  const userKey = user ? 'analyze:user:' + user.id : null;
  const limit = user && user.premium ? 200 : 1; // "illimité" côté Premium, avec garde-fou anti-abus

  const used = Math.max(await usage(ipKey), userKey ? await usage(userKey) : 0);
  if (!(user && user.premium) && used >= limit) return fail(429, 'daily_limit', { limit });
  if (user && user.premium && userKey && (await usage(userKey)) >= limit) return fail(429, 'daily_limit', { limit });

  /* Moteur LERNA : liste d'établissements reconnus possibles pour CET élève (fiches LERNA + annuaire officiel + formations françaises).
     Si elle ne peut pas être construite, l'analyse se fait comme avant (l'IA connaît seulement les noms des fiches LERNA). */
  const raw = cleanRaw(body.raw);
  let cat = null;
  try {
    const lv = body.raw && body.raw.q5_lvl && typeof body.raw.q5_lvl === 'object' ? body.raw.q5_lvl : {};
    const q5_lvl = {};
    for (const k of Object.keys(lv).slice(0, 12)) if (/^[a-z]{2,6}$/.test(k) && /^(aise|inter|deb)$/.test(lv[k])) q5_lvl[k] = lv[k];
    cat = await Promise.race([
      buildCandidates({ ...raw, q5_lvl }, lang, new URL(request.url).origin),
      new Promise((_, no) => setTimeout(() => no(new Error('catalogue_timeout')), 12000))
    ]);
    if (!cat || cat.list.length < RECO_COUNT) cat = null;
  } catch (e) { cat = null; }

  let result;
  try {
    const prompt = buildPrompt(answers, lang) + (cat ? '\n\nLISTE DES ÉTABLISSEMENTS POSSIBLES (préparée par le moteur LERNA ; choisis uniquement dedans et recopie le code) :\n' + candidatesPrompt(cat) : '');
    const text = await claude({ mode: 'analyse', system: cat ? SYSTEM_LIST : SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens: 3600 });
    result = cleanResult(extractJson(text));
    result = cat ? bindRecos(result, cat, lang, RECO_COUNT) : { ...result, recos: result.recos.slice(0, RECO_COUNT).map(({ code, ...x }) => x) };
    if (!result.recos.length) throw new Error('empty');
  } catch (e) {
    return fail(e.status || 502, 'ai_unavailable');
  }

  await hit(ipKey);
  if (userKey) await hit(userKey);

  // Sauvegarde pour les comptes connectés (profil + recommandations) et validation du parrainage
  if (user) {
    const id = await saveProfile(user, raw, result, 'ai');
    if (id) result.id = id;
  }

  return json(result);
}

export function GET() { return fail(405, 'method_not_allowed'); }
