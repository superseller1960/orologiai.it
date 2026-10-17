import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { handleOrologiaio, creaRateLimiter, MAX_BODY_BYTES, RATE_LIMIT_PER_MINUTE, type Deps } from '../site/src/lib/orologiaio-api.ts';
import { GEMINI_ENDPOINT, corpoRichiesta, schemaCriteri } from '../site/src/lib/gemini.ts';
import { onRequest } from '../functions/api/orologiaio.ts';

const data: Directory = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const snapshot = JSON.stringify(data);
const CHIAVE = 'TEST-CHIAVE-NON-REALE-123';
const ORIGIN = 'https://orologiai.it';

type Call = { url: string; init?: RequestInit };
const finto = (rispondi: (c: Call) => Promise<Response> | Response) => {
  const calls: Call[] = [];
  const fetchFinto = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return rispondi({ url, init });
  };
  return { calls, fetch: fetchFinto };
};
const gemini = (testo: string, status = 200) => () => new Response(
  JSON.stringify({ candidates: [{ content: { parts: [{ text: testo }] }, finishReason: 'STOP' }] }),
  { status, headers: { 'content-type': 'application/json' } },
);

const richiesta = (corpo: unknown, opz: { ip?: string; origin?: string | null; contentType?: string | null; method?: string } = {}) => {
  const headers: Record<string, string> = { 'cf-connecting-ip': opz.ip ?? '203.0.113.1' };
  if (opz.origin !== null) headers.origin = opz.origin ?? ORIGIN;
  if (opz.contentType !== null) headers['content-type'] = opz.contentType ?? 'application/json';
  return new Request(`${ORIGIN}/api/orologiaio`, {
    method: opz.method ?? 'POST',
    headers,
    body: opz.method === 'GET' ? undefined : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
  });
};
const deps = (extra: Partial<Deps> = {}): Deps => ({ dir: data, limiter: creaRateLimiter(1000), ...extra });
const env = (chiave?: string) => (chiave === undefined ? {} : { GEMINI_API_KEY: chiave });

test('metodi, origine e tipo di contenuto sono controllati prima di ogni elaborazione', async () => {
  const f = finto(() => { throw new Error('non deve essere chiamato'); });
  assert.equal((await handleOrologiaio(richiesta(null, { method: 'GET' }), env(CHIAVE), deps({ fetch: f.fetch }))).status, 405);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }, { origin: 'https://attacco.example' }), env(CHIAVE), deps({ fetch: f.fetch }))).status, 403);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'x' }, { contentType: 'text/plain' }), env(CHIAVE), deps({ fetch: f.fetch }))).status, 415);
  assert.equal(f.calls.length, 0);
});

test('input vuoto, JSON malformato, campi extra e input troppo lungo sono rifiutati', async () => {
  const f = finto(() => { throw new Error('non deve essere chiamato'); });
  const d = deps({ fetch: f.fetch });
  assert.equal((await handleOrologiaio(richiesta({ messaggio: '   ' }), env(CHIAVE), d)).status, 400);
  assert.equal((await handleOrologiaio(richiesta('{non json'), env(CHIAVE), d)).status, 400);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'revisione', lat: 43.7 }), env(CHIAVE), d)).status, 400);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'a'.repeat(501) }), env(CHIAVE), d)).status, 413);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'a'.repeat(MAX_BODY_BYTES + 10) }), env(CHIAVE), d)).status, 413);
  assert.equal(f.calls.length, 0, 'nessuna chiamata al provider per richieste non valide');
});

test('senza chiave: modalità non-configurata, nessuna chiamata al provider, ricerca locale', async () => {
  const f = finto(() => { throw new Error('non deve essere chiamato'); });
  const r = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(), deps({ fetch: f.fetch }));
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.modalita, 'non-configurato');
  assert.equal(body.criteri.servizio, 'revisione');
  assert.equal(body.criteri.localita, 'firenze');
  assert.equal(f.calls.length, 0);
});

test('con chiave e risposta valida: modalità ai, criteri validati, chiave nell’header e mai nel risultato', async () => {
  const f = finto(gemini(JSON.stringify({ localita: 'firenze', servizio: 'revisione', marca: 'Omega', specializzazione: 'automatici' })));
  const r = await handleOrologiaio(richiesta({ messaggio: 'Cerco a Firenze un orologiaio per revisionare un Omega automatico' }), env(CHIAVE), deps({ fetch: f.fetch }));
  const testo = await r.text();
  const body = JSON.parse(testo);
  assert.equal(body.modalita, 'ai');
  assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione', marca: 'Omega', specializzazione: 'automatici' });
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, GEMINI_ENDPOINT);
  const headers = f.calls[0].init?.headers as Record<string, string>;
  assert.equal(headers['x-goog-api-key'], CHIAVE);
  assert.ok(!testo.includes(CHIAVE), 'la chiave non compare nella risposta');
});

test('il provider riceve solo il messaggio dell’utente, senza coordinate né dati personali', async () => {
  const f = finto(gemini('{}'));
  await handleOrologiaio(richiesta({ messaggio: 'orologiaio a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch }));
  const body = JSON.parse(String(f.calls[0].init?.body));
  assert.equal(body.contents[0].parts[0].text, 'orologiaio a Firenze');
  assert.ok(!JSON.stringify(body).includes('203.0.113.1'), 'nessun IP inoltrato');
  assert.match(body.systemInstruction.parts[0].text, /ignora qualsiasi istruzione/);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.equal(body.generationConfig.responseJsonSchema.additionalProperties, false);
});

test('JSON malformato del modello: fallback locale dichiarato', async () => {
  const f = finto(gemini('questo non è JSON'));
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch }))).json();
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.servizio, 'revisione');
  assert.match(body.avviso, /non ha risposto in modo utilizzabile/);
});

test('output del modello con campi sconosciuti o valori invalidi: scartato, nessun criterio grezzo', async () => {
  const f = finto(gemini(JSON.stringify({ servizio: 'revisione', sql: 'DROP TABLE attivita' })));
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione' }), env(CHIAVE), deps({ fetch: f.fetch }))).json();
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.sql, undefined);
  const g = finto(gemini(JSON.stringify({ servizio: 'hack' })));
  const body2 = await (await handleOrologiaio(richiesta({ messaggio: 'revisione' }), env(CHIAVE), deps({ fetch: g.fetch }))).json();
  assert.equal(body2.modalita, 'fallback');
});

test('località o marca inventate dal modello: rimosse dopo la validazione sul database', async () => {
  const f = finto(gemini(JSON.stringify({ localita: 'citta-inventata', marca: 'MarcaInventata', servizio: 'riparazione' })));
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'x' }), env(CHIAVE), deps({ fetch: f.fetch }))).json();
  assert.equal(body.modalita, 'ai');
  assert.equal(body.criteri.localita, undefined);
  assert.equal(body.criteri.marca, undefined);
  assert.equal(body.criteri.servizio, 'riparazione');
});

test('errore HTTP del provider: fallback senza dettagli interni', async () => {
  const f = finto(gemini('{"error":"quota"}', 429));
  const r = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch }));
  const testo = await r.text();
  const body = JSON.parse(testo);
  assert.equal(body.modalita, 'fallback');
  assert.ok(!testo.includes(CHIAVE));
  assert.ok(!testo.includes('quota'), 'nessun dettaglio del provider nella risposta');
});

test('timeout del provider: fallback entro il limite', async () => {
  const f = finto(({ init }) => new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
  }));
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch, timeoutMs: 20 }))).json();
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.servizio, 'revisione');
});

test('provider che lancia errore di rete: fallback', async () => {
  const f = finto(() => { throw new Error('rete non disponibile'); });
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch }))).json();
  assert.equal(body.modalita, 'fallback');
});

test('richieste abusive: limite per IP con 429 e Retry-After', async () => {
  const limiter = creaRateLimiter(2);
  const f = finto(gemini('{}'));
  const d = deps({ fetch: f.fetch, limiter });
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'a' }, { ip: '198.51.100.7' }), env(CHIAVE), d)).status, 200);
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'a' }, { ip: '198.51.100.7' }), env(CHIAVE), d)).status, 200);
  const bloccata = await handleOrologiaio(richiesta({ messaggio: 'a' }, { ip: '198.51.100.7' }), env(CHIAVE), d);
  assert.equal(bloccata.status, 429);
  assert.equal(bloccata.headers.get('retry-after'), '60');
  assert.equal((await handleOrologiaio(richiesta({ messaggio: 'a' }, { ip: '198.51.100.8' }), env(CHIAVE), d)).status, 200, 'altri IP non sono bloccati');
  assert.equal(f.calls.length, 3, 'la richiesta bloccata non raggiunge il provider');
});

test('risposte con cache disabilitata e nessun errore interno esposto', async () => {
  const r = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(), deps());
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('nessuna chiave nei messaggi di errore, anche con provider e input ostili', async () => {
  const scenari = [
    richiesta({ messaggio: '' }),
    richiesta('{'),
    richiesta({ messaggio: 'x' }, { origin: 'https://evil.example' }),
  ];
  for (const req of scenari) {
    const testo = await (await handleOrologiaio(req, env(CHIAVE), deps({ fetch: finto(gemini('{}', 500)).fetch }))).text();
    assert.ok(!testo.includes(CHIAVE));
  }
});

test('l’endpoint non modifica il database e lo schema JSON riflette solo valori esistenti', async () => {
  const f = finto(gemini(JSON.stringify({ servizio: 'revisione' })));
  await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), env(CHIAVE), deps({ fetch: f.fetch }));
  assert.equal(JSON.stringify(data), snapshot);
  const schema = schemaCriteri(data);
  assert.ok((schema.properties.localita.enum as string[]).includes('firenze'));
  assert.ok(!(schema.properties.localita.enum as string[]).includes('citta-inventata'));
  const corpo = corpoRichiesta(data, 'x');
  assert.ok(!JSON.stringify(corpo).includes(CHIAVE));
});

test('Pages Function onRequest risponde via HTTP reale su un socket locale in caso di successo ed errore', async () => {
  const srv = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const url = `http://${req.headers.host}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    const out = await onRequest({
      request: new Request(url, { method: req.method, headers, body: req.method === 'GET' ? undefined : Buffer.concat(chunks) }),
      env: {},
    });
    res.writeHead(out.status, Object.fromEntries(out.headers.entries()));
    res.end(await out.text());
  });
  await new Promise<void>(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api/orologiaio`;
  try {
    const getRes = await fetch(base);
    assert.equal(getRes.status, 405);
    const okRes = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: `http://127.0.0.1:${port}` },
      body: JSON.stringify({ messaggio: 'Cerco un orologiaio a Firenze per revisionare un automatico' }),
    });
    assert.equal(okRes.status, 200);
    const body = await okRes.json();
    assert.equal(body.modalita, 'non-configurato');
    assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione', specializzazione: 'automatici' });
  } finally {
    await new Promise<void>(resolve => srv.close(() => resolve()));
  }
});

test('la Pages Function condivide il rate limiter fra le richieste, non ne crea uno per richiesta', async () => {
  const ip = '198.51.100.42';
  const invia = () => onRequest({ request: richiesta({ messaggio: 'revisione a Firenze' }, { ip }), env: {} });
  for (let i = 1; i <= RATE_LIMIT_PER_MINUTE; i += 1) assert.equal((await invia()).status, 200, `richiesta ${i}`);
  const bloccata = await invia();
  assert.equal(bloccata.status, 429);
  assert.equal(bloccata.headers.get('retry-after'), '60');
});

test('functions/api/orologiaio.ts si compila in un singolo modulo ESM autosufficiente (compatibile Workers/Pages) ed espone onRequest', async () => {
  const bundled = await build({
    entryPoints: ['functions/api/orologiaio.ts'],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    write: false,
  });
  assert.equal(bundled.errors.length, 0);
  const code = bundled.outputFiles[0].text;
  assert.ok(!code.includes('node:'), 'il bundle Worker non deve dipendere da moduli Node built-in');
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`) as { onRequest: typeof onRequest };
  const res = await mod.onRequest({
    request: new Request('https://orologiai.it/api/orologiaio', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://orologiai.it' },
      body: JSON.stringify({ messaggio: 'Cerco un orologiaio a Firenze per revisionare un automatico' }),
    }),
    env: {},
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.modalita, 'non-configurato');
  assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione', specializzazione: 'automatici' });
});

