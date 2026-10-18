/* GET /api/cron-daily — notification quotidienne (Vercel Cron, une fois par jour)
   - Seulement aux personnes qui ont accepté les notifications (OneSignal)
   - Seulement si elles ne sont pas venues depuis 18 h (et sont venues dans les 30 derniers jours)
   - Livrée à l'heure choisie dans les Paramètres (9 h, 12 h, 14 h, 18 h par défaut, ou 20 h), heure locale :
     jamais pendant les heures calmes, une seule par jour au maximum (ou moins, selon le réglage)
   - Chaque message a un type (mission, bourses, échéances, parcours) : il ne part qu'aux personnes
     qui n'ont pas coupé ce type dans les Paramètres (étiquettes OneSignal n_mission, n_bourses…)
   - Le cron tourne à 5 h UTC (vercel.json) pour que les heures choisies ne soient pas déjà passées
   - Messages encourageants, jamais culpabilisants (une partie du public est mineure) */
import { json, fail, env, sbFetch, supabaseReady } from './_lib.js';

/* Durées de conservation annoncées dans legal.html (Politique de confidentialité, art. 11) */
async function purge() {
  if (!supabaseReady()) return { skipped: true };
  const ago = (days) => encodeURIComponent(new Date(Date.now() - days * 864e5).toISOString());
  const day = (days) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const del = (path) => sbFetch(path, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).then((r) => r.ok).catch(() => false);
  return {
    events: await del('/rest/v1/events?at=lt.' + ago(395)),                                                   // mesure d'audience : 13 mois
    rate_limits: await del('/rest/v1/rate_limits?day=lt.' + day(30)),                                         // compteurs anti-abus : 30 jours
    paiements_abandonnes: await del('/rest/v1/paiements_momo?statut=in.(en_attente,refuse)&created_at=lt.' + ago(365)), // 12 mois
    messages: await del('/rest/v1/messages_contact?created_at=lt.' + ago(1096)),                              // 3 ans
    signalements: await del('/rest/v1/signalements?created_at=lt.' + ago(1096))                               // 3 ans
  };
}

const MESSAGES = [
  { type: 'mission', fr: ['Ta mission du jour est prête', "3 petites étapes pour avancer sur ton orientation aujourd'hui."], en: ["Today's mission is ready", '3 small steps to move your orientation forward today.'] },
  { type: 'bourses', fr: ['Une bourse à découvrir', 'Une nouvelle bourse t’attend dans LERNA. Elle pourrait changer ton parcours.'], en: ['A scholarship to discover', 'A new scholarship is waiting for you in LERNA. It could change your path.'] },
  { type: 'parcours', fr: ['Le mot du jour', 'Licence, master, crédits ECTS… un mot de plus pour bien choisir ton école.'], en: ['Word of the day', "Bachelor's, master's, ECTS credits… one more word to choose your school well."] },
  { type: 'parcours', fr: ['Quiz du jour', 'Une question, 10 secondes : teste ce que tu sais sur les études.'], en: ['Quiz of the day', 'One question, 10 seconds: test what you know about studying.'] },
  { type: 'parcours', fr: ['Ton parcours continue', 'Chaque jour compte. Viens voir ce que LERNA a préparé pour toi.'], en: ['Your journey continues', 'Every day counts. Come and see what LERNA has prepared for you.'] },
  { type: 'deadlines', fr: ['Des dates limites approchent', 'Certaines candidatures ferment bientôt. Jette un œil à tes échéances.'], en: ['Deadlines are coming up', 'Some applications close soon. Take a look at your deadlines.'] }
];

/* Alertes ciblées Premium : une offre ajoutée depuis /admin ces dernières 24 h → notification aux comptes Premium
   dont un des 3 domaines (étiquettes d1, d2, d3) correspond, à 18 h heure locale. 3 offres au maximum par jour. */
const TYPE_FR = { bourse: 'Nouvelle bourse pour toi', stage: 'Nouveau stage pour toi', emploi: 'Nouvel emploi pour toi', investisseur: 'Nouveau financement pour ton projet' };
const TYPE_EN = { bourse: 'A new scholarship for you', stage: 'A new internship for you', emploi: 'A new job for you', investisseur: 'New funding for your project' };
async function premiumAlerts(appId, key, base_url) {
  if (!supabaseReady()) return 0;
  const since = encodeURIComponent(new Date(Date.now() - 864e5).toISOString());
  const r = await sbFetch('/rest/v1/opportunites?active=eq.true&date_publication=gt.' + since + '&select=slug,type,titre,domaine,data&order=date_publication.desc&limit=3');
  if (!r.ok || !Array.isArray(r.data)) return 0;
  let sent = 0;
  for (const o of r.data) {
    const d = o.data || {};
    const doms = [...new Set([...(Array.isArray(d.domaines) ? d.domaines : []), o.domaine].filter((x) => typeof x === 'string' && /^[a-z_-]{1,20}$/.test(x)))].slice(0, 6);
    const titre = String(o.titre || d.titre || '').slice(0, 120);
    if (!titre) continue;
    const filters = [];
    if (doms.length) {
      doms.forEach((dom, i) => ['d1', 'd2', 'd3'].forEach((k, j) => {
        if (i || j) filters.push({ operator: 'OR' });
        filters.push({ field: 'tag', key: 'premium', relation: '=', value: '1' }, { field: 'tag', key: 'n_bourses', relation: '!=', value: '0' }, { field: 'tag', key: k, relation: '=', value: dom });
      }));
    } else filters.push({ field: 'tag', key: 'premium', relation: '=', value: '1' }, { field: 'tag', key: 'n_bourses', relation: '!=', value: '0' });
    const ok = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + key },
      body: JSON.stringify({ app_id: appId, target_channel: 'push', filters,
        headings: { fr: TYPE_FR[o.type] || 'Nouvelle offre pour toi', en: TYPE_EN[o.type] || 'A new offer for you' },
        contents: { fr: titre, en: titre },
        url: base_url + '/opportunites.html?src=alerte', chrome_web_icon: base_url + '/assets/icons/icon-192.png',
        delayed_option: 'timezone', delivery_time_of_day: '6:00PM', ttl: 20 * 3600 })
    }).then((x) => x.ok, () => false);
    if (ok) sent++;
  }
  return sent;
}

export async function GET(request) {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) return fail(401, 'unauthorized');
  const cleaned = await purge();
  const appId = env('ONESIGNAL_APP_ID'), key = env('ONESIGNAL_REST_API_KEY');
  if (!appId || !key) return json({ cleaned, skipped: 'onesignal_not_configured' });
  const base_url = env('APP_URL', 'https://lerna.world').replace(/\/$/, '');
  const day = Math.floor(Date.now() / 86400000);
  const m = MESSAGES[day % MESSAGES.length];
  /* Fréquence choisie : « 2 par semaine » reçoit les jours 0 et 3, « 1 par semaine » le jour 0 */
  const dow = day % 7;
  const base = [
    { field: 'tag', key: 'last_visit', relation: 'time_elapsed_gt', value: String(18 * 3600) },
    { field: 'tag', key: 'last_visit', relation: 'time_elapsed_lt', value: String(30 * 86400) },
    { field: 'tag', key: 'n_' + m.type, relation: '!=', value: '0' }
  ];
  if (dow !== 0 && dow !== 3) base.push({ field: 'tag', key: 'n_freq', relation: '!=', value: '2w' });
  if (dow !== 0) base.push({ field: 'tag', key: 'n_freq', relation: '!=', value: 'week' });
  const HOURS = { 9: '9:00AM', 12: '12:00PM', 14: '2:00PM', 18: '6:00PM', 20: '8:00PM' };
  const sends = Object.entries(HOURS).map(([h, at]) => {
    /* 18 h : aussi les personnes qui n'ont rien choisi (étiquette absente) */
    const filters = h === '18'
      ? [...base, { field: 'tag', key: 'n_hour', relation: '=', value: h }, { operator: 'OR' }, ...base, { field: 'tag', key: 'n_hour', relation: 'not_exists' }]
      : [...base, { field: 'tag', key: 'n_hour', relation: '=', value: h }];
    return {
      app_id: appId,
      target_channel: 'push',
      filters,
      headings: { fr: m.fr[0], en: m.en[0] },
      contents: { fr: m.fr[1], en: m.en[1] },
      url: base_url + '/aujourdhui.html?src=push',
      chrome_web_icon: base_url + '/assets/icons/icon-192.png',
      delayed_option: 'timezone',
      delivery_time_of_day: at,
      ttl: 6 * 3600
    };
  });
  const results = await Promise.all(sends.map((payload) => fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + key },
    body: JSON.stringify(payload)
  }).then((r) => r.ok, () => false)));
  const alerts = await premiumAlerts(appId, key, base_url).catch(() => 0);
  if (!results.some(Boolean) && !alerts) return fail(502, 'onesignal_failed');
  return json({ ok: true, cleaned, message: m.fr[0], type: m.type, sent: results.filter(Boolean).length, premium_alerts: alerts });
}
