import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { directory } from '../site/src/lib/directory.ts';
import { ipClient, RATE_LIMIT_PER_MINUTE } from '../site/src/lib/orologiaio-api.ts';
import { estraiPosizioneApprossimativa } from '../site/src/lib/geo.ts';
import { handlePosizione } from '../site/src/lib/posizione-api.ts';
import { GET as sitemapGet } from '../site/src/pages/sitemap.xml.ts';
import orologiaioApi from '../site/src/api/orologiaio.ts';
import posizioneApi from '../site/src/api/posizione.ts';

const ORIGIN = 'https://orologiai.it';
const CHIAVE = 'TEST-CHIAVE-NON-REALE-VERCEL';

const orologiaioReq = (headers: Record<string, string> = {}, corpo: unknown = { messaggio: 'revisione a Firenze' }, method = 'POST') =>
  new Request(`${ORIGIN}/api/orologiaio`, {
    method,
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: method === 'GET' ? undefined : JSON.stringify(corpo),
  });

// Le funzioni Vercel leggono la chiave da process.env: il test la imposta e poi la ripristina.
async function conChiave<T>(valore: string | undefined, fn: () => Promise<T>): Promise<T> {
  const precedente = process.env.GEMINI_API_KEY;
  if (valore === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = valore;
  try { return await fn(); } finally {
    if (precedente === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = precedente;
  }
}

test('api/orologiaio: solo POST; GET restituisce 405 in JSON senza cache condivisa', async () => {
  const r = await orologiaioApi.fetch(orologiaioReq({}, null, 'GET'));
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal((await r.json()).errore, 'Metodo non consentito.');
});

test('api/orologiaio: senza GEMINI_API_KEY risponde con interpretazione locale e JSON valido', async () => {
  const r = await conChiave(undefined, () => orologiaioApi.fetch(orologiaioReq()));
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.modalita, 'non-configurato');
  assert.equal(body.criteri.localita, 'firenze');
  assert.equal(body.criteri.servizio, 'revisione');
});

test('api/orologiaio: la chiave letta da process.env non compare mai nella risposta', async () => {
  const r = await conChiave(CHIAVE, () => orologiaioApi.fetch(orologiaioReq({}, { messaggio: 'x' }, 'POST')));
  const testo = await r.text();
  assert.ok(!testo.includes(CHIAVE));
  assert.ok([200, 400].includes(r.status));
});

test('api/orologiaio: rate limit condiviso fra richieste, 10 al minuto per IP Vercel', async () => {
  const headers = { 'x-vercel-id': 'iad1::test-1', 'x-vercel-forwarded-for': '198.51.100.90' };
  const invia = () => conChiave(undefined, () => orologiaioApi.fetch(orologiaioReq(headers)));
  for (let i = 1; i <= RATE_LIMIT_PER_MINUTE; i += 1) assert.equal((await invia()).status, 200, `richiesta ${i}`);
  const bloccata = await invia();
  assert.equal(bloccata.status, 429);
  assert.equal(bloccata.headers.get('retry-after'), '60');
});

test('ipClient: su Vercel usa x-vercel-forwarded-for e ignora X-Forwarded-For forgiato dal client', () => {
  const h = new Headers({
    'x-vercel-id': 'fra1::abc',
    'x-vercel-forwarded-for': '203.0.113.5',
    'x-forwarded-for': '10.0.0.1',
    'cf-connecting-ip': '10.0.0.2',
  });
  assert.equal(ipClient(h), '203.0.113.5');
});

test('ipClient: senza x-vercel-id non si fida degli header di inoltro e usa cf-connecting-ip', () => {
  const forgiato = new Headers({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '1.2.3.4' });
  assert.equal(ipClient(forgiato), 'sconosciuto');
  const cf = new Headers({ 'cf-connecting-ip': '192.0.2.44', 'x-forwarded-for': '1.2.3.4' });
  assert.equal(ipClient(cf), '192.0.2.44');
});

test('ipClient: con x-vercel-id senza header di provenienza non riusa un IP forgiabile', () => {
  const h = new Headers({ 'x-vercel-id': 'iad1::x', 'x-forwarded-for': '9.9.9.9', 'cf-connecting-ip': '9.9.9.8' });
  assert.equal(ipClient(h), 'vercel-sconosciuto');
});

test('geolocalizzazione Vercel: Toscana da x-vercel-ip-country-region con città decodificata', () => {
  const h = new Headers({
    'x-vercel-id': 'fra1::geo',
    'x-vercel-ip-country': 'IT',
    'x-vercel-ip-country-region': 'IT-52',
    'x-vercel-ip-city': 'Firenze',
  });
  const p = estraiPosizioneApprossimativa(new Request(ORIGIN, { headers: h }));
  assert.equal(p.disponibile, true);
  assert.equal(p.regioneSlug, 'toscana');
  assert.equal(p.citta, 'Firenze');
  assert.equal(p.paese, 'IT');
});

test('geolocalizzazione Vercel: città con caratteri non ASCII codificati RFC 3986 vengono decodificati', () => {
  const h = new Headers({
    'x-vercel-id': 'fra1::geo',
    'x-vercel-ip-country': 'IT',
    'x-vercel-ip-country-region': 'Lombardy',
    'x-vercel-ip-city': 'Reggio%20nell%27Emilia',
  });
  const p = estraiPosizioneApprossimativa(new Request(ORIGIN, { headers: h }));
  assert.equal(p.regioneSlug, 'lombardia');
  assert.equal(p.citta, "Reggio nell'Emilia");
});

test('geolocalizzazione Vercel: paese estero con regione italiana forgiata non produce una zona', () => {
  const h = new Headers({
    'x-vercel-id': 'fra1::geo',
    'x-vercel-ip-country': 'US',
    'x-vercel-ip-country-region': 'Tuscany',
  });
  const p = estraiPosizioneApprossimativa(new Request(ORIGIN, { headers: h }));
  assert.equal(p.disponibile, false);
  assert.equal(p.regioneSlug, null);
});

test('geolocalizzazione: header Cloudflare ignorati quando la richiesta passa da Vercel', () => {
  const h = new Headers({
    'x-vercel-id': 'fra1::geo',
    'cf-ipcountry': 'IT',
    'cf-region': 'Sardinia',
  });
  const p = estraiPosizioneApprossimativa(new Request(ORIGIN, { headers: h }));
  assert.equal(p.disponibile, false, 'senza header Vercel la stima non è disponibile');
});

test('api/posizione: GET e HEAD ammessi, POST rifiutato, risposta non memorizzabile', async () => {
  const get = await posizioneApi.fetch(new Request(`${ORIGIN}/api/posizione`, { headers: { 'x-vercel-id': 'x', 'x-vercel-ip-country': 'IT', 'x-vercel-ip-country-region': '52' } }));
  assert.equal(get.status, 200);
  assert.match(get.headers.get('cache-control') ?? '', /no-store/);
  assert.equal((await get.json()).regioneSlug, 'toscana');
  const head = await posizioneApi.fetch(new Request(`${ORIGIN}/api/posizione`, { method: 'HEAD' }));
  assert.equal(head.status, 200);
  const post = await posizioneApi.fetch(new Request(`${ORIGIN}/api/posizione`, { method: 'POST' }));
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('api/posizione: senza header geografici risponde disponibile:false senza errori', async () => {
  const r = await handlePosizione(new Request(`${ORIGIN}/api/posizione`));
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.equal(body.disponibile, false);
});

test('sitemap regionale: contiene le 20 regioni pubblicate, senza duplicati', async () => {
  const res = await sitemapGet({ site: new URL(ORIGIN) } as Parameters<typeof sitemapGet>[0]);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length, 'nessun URL duplicato');
  const regionali = locs.filter(u => /\/orologerie\/[a-z-]+\/$/.test(u.replace(ORIGIN, '')));
  assert.equal(regionali.length, 20, 'le 20 regioni censite sono in sitemap');
  for (const slug of ['lombardia', 'lazio', 'molise', 'valle-daosta', 'trentino-alto-adige']) {
    assert.ok(locs.includes(`${ORIGIN}/orologerie/${slug}/`), `manca ${slug}`);
  }
  assert.ok(locs.includes(`${ORIGIN}/orologerie/`), 'le altre URL restano presenti');
});

// La Lambda Vercel contiene solo la entry compilata: le entry devono quindi compilarsi in
// moduli ESM senza alcun import residuo (stesso schema del test per functions/api/ orologiaio).
test('le entry Vercel si compilano in ESM autosufficienti senza import relativi e invocano correttamente', async () => {
  for (const sorgente of ['site/src/api/orologiaio.ts', 'site/src/api/posizione.ts']) {
    const bundled = await build({ entryPoints: [sorgente], bundle: true, format: 'esm', platform: 'node', target: 'node22', mainFields: ['module', 'main'], write: false });
    assert.equal(bundled.errors.length, 0, sorgente);
    const code = bundled.outputFiles[0].text;
    assert.ok(!/(?:from|import|require\s*\()\s*["']\.{1,2}\//.test(code), `${sorgente}: nessun import relativo può restare nella Lambda`);
  }
  const posizioneMod = await (async () => {
    const bundled = await build({ entryPoints: ['site/src/api/posizione.ts'], bundle: true, format: 'esm', platform: 'node', target: 'node22', write: false });
    return await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`) as { default: typeof posizioneApi };
  })();
  const res = await posizioneMod.default.fetch(new Request(`${ORIGIN}/api/posizione`));
  assert.equal(res.status, 200);
  const orologiaioMod = await (async () => {
    const bundled = await build({ entryPoints: ['site/src/api/orologiaio.ts'], bundle: true, format: 'esm', platform: 'node', target: 'node22', write: false });
    return await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`) as { default: typeof orologiaioApi };
  })();
  const resOro = await orologiaioMod.default.fetch(orologiaioReq());
  assert.equal(resOro.status, 200);
  assert.equal((await resOro.json()).modalita, 'non-configurato');
});

test('dati: 159 attività dopo il lotto N02-D e PR #6 e tutte le regioni con località valide', () => {
  assert.equal(directory.attivita.length, 159);
  const regioni = new Set(directory.localita.filter(p => directory.attivita.some(b => b.localitaId === p.id)).map(p => p.regioneSlug));
  assert.equal(regioni.size, 20);
});
