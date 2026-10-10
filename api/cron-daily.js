/* GET /api/cron-daily — notification quotidienne (Vercel Cron, une fois par jour)
   - Seulement aux personnes qui ont accepté les notifications (OneSignal)
   - Seulement si elles ne sont pas venues depuis 18 h (et sont venues dans les 30 derniers jours)
   - Livrée à l'heure choisie dans les Paramètres (9 h, 12 h, 14 h, 18 h par défaut, ou 20 h), heure locale :
     jamais pendant les heures calmes, une seule par jour au maximum (ou moins, selon le réglage)
   - Chaque message a un type (mission, bourses, échéances, parcours) : il ne part qu'aux personnes
     qui n'ont pas coupé ce type dans les Paramètres (étiquettes OneSignal n_mission, n_bourses…)
   - Le cron tourne à 5 h UTC (vercel.json) pour que les heures choisies ne soient pas déjà passées
   - Messages encourageants, jamais culpabilisants (une partie du public est mineure) */
import { json, fail, env } from './_lib.js';

const MESSAGES = [
  { type: 'mission', fr: ['Ta mission du jour est prête', "3 petites étapes pour avancer sur ton orientation aujourd'hui."], en: ["Today's mission is ready", '3 small steps to move your orientation forward today.'] },
  { type: 'bourses', fr: ['Une bourse à découvrir', 'Une nouvelle bourse t’attend dans LERNA. Elle pourrait changer ton parcours.'], en: ['A scholarship to discover', 'A new scholarship is waiting for you in LERNA. It could change your path.'] },
  { type: 'parcours', fr: ['Le mot du jour', 'Licence, master, crédits ECTS… un mot de plus pour bien choisir ton école.'], en: ['Word of the day', "Bachelor's, master's, ECTS credits… one more word to choose your school well."] },
  { type: 'parcours', fr: ['Quiz du jour', 'Une question, 10 secondes : teste ce que tu sais sur les études.'], en: ['Quiz of the day', 'One question, 10 seconds: test what you know about studying.'] },
  { type: 'parcours', fr: ['Ton parcours continue', 'Chaque jour compte. Viens voir ce que LERNA a préparé pour toi.'], en: ['Your journey continues', 'Every day counts. Come and see what LERNA has prepared for you.'] },
  { type: 'deadlines', fr: ['Des dates limites approchent', 'Certaines candidatures ferment bientôt. Jette un œil à tes échéances.'], en: ['Deadlines are coming up', 'Some applications close soon. Take a look at your deadlines.'] }
];

export async function GET(request) {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) return fail(401, 'unauthorized');
  const appId = env('ONESIGNAL_APP_ID'), key = env('ONESIGNAL_REST_API_KEY');
  if (!appId || !key) return json({ skipped: 'onesignal_not_configured' });
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
  if (!results.some(Boolean)) return fail(502, 'onesignal_failed');
  return json({ ok: true, message: m.fr[0], type: m.type, sent: results.filter(Boolean).length });
}
