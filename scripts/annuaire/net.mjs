/* Téléchargement prudent des listes officielles.
   Beaucoup de sites ministériels n'envoient pas leur certificat intermédiaire : les navigateurs le récupèrent
   eux-mêmes grâce à l'adresse « CA Issuers » du certificat (AIA). On fait pareil, sans jamais désactiver la vérification :
   le certificat intermédiaire est ajouté aux autorités reconnues et toute la chaîne est vérifiée normalement. */
import tls from 'node:tls';
import https from 'node:https';
import http from 'node:http';

export const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 LERNA-annuaire', 'Accept-Language': 'fr,en;q=0.8' };
const extra = new Map();   // hôte -> certificat intermédiaire (PEM)

function raw(url, { ca, timeout = 60000, redirects = 5, method = 'GET', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url); const mod = u.protocol === 'http:' ? http : https;
    const h = { ...UA, ...headers }; if (body) { h['Content-Type'] = h['Content-Type'] || 'application/x-www-form-urlencoded'; h['Content-Length'] = Buffer.byteLength(body); }
    const req = mod.request(u, { method, headers: h, ca, timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume(); return resolve(raw(new URL(res.headers.location, u).href, { ca: extraFor(new URL(res.headers.location, u).hostname) || ca, timeout, redirects: redirects - 1, headers: { Cookie: headers.Cookie || '' } }));
      }
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'] || '', url: u.href, buf: Buffer.concat(chunks), cookies: (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]) }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('délai dépassé')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
const extraFor = (host) => (extra.has(host) ? [...tls.rootCertificates, extra.get(host)] : undefined);

/* Lit le certificat du site (sans rien lui envoyer d'autre) pour connaître l'adresse de son émetteur */
function issuerUrl(host) {
  return new Promise((resolve) => {
    const s = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
      const c = s.getPeerCertificate(); s.end();
      const m = /CA Issuers - URI:(\S+)/.exec(c && c.infoAccess ? Object.entries(c.infoAccess).map(([k, v]) => k + ':' + v.join(',')).join('\n') : '');
      resolve(m ? m[1] : null);
    });
    s.on('error', () => resolve(null)); s.on('timeout', () => { s.destroy(); resolve(null); });
  });
}
const toPem = (der) => (/BEGIN CERTIFICATE/.test(der.toString('latin1')) ? der.toString('latin1') : '-----BEGIN CERTIFICATE-----\n' + der.toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END CERTIFICATE-----\n');

export async function get(url, opts = {}) {
  const host = new URL(url).hostname;
  try { return await raw(url, { ...opts, ca: extraFor(host) }); }
  catch (e) {
    if (!/UNABLE_TO_VERIFY_LEAF_SIGNATURE|unable to verify the first certificate|UNABLE_TO_GET_ISSUER_CERT_LOCALLY/i.test((e.code || '') + ' ' + e.message) || extra.has(host)) throw e;
    const iu = await issuerUrl(host); if (!iu) throw e;
    const r = await raw(iu, { timeout: 20000 }); if (r.status !== 200) throw e;
    extra.set(host, toPem(r.buf));
    return raw(url, { ...opts, ca: extraFor(host) });
  }
}

export async function fetchBuf(url) {
  const r = await get(url);
  if (r.status < 200 || r.status >= 300) throw new Error('HTTP ' + r.status);
  return r.buf;
}
