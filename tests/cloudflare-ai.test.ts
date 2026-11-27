import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { handleOrologiaio, creaRateLimiter, type Deps, type Env } from '../site/src/lib/orologiaio-api.ts';
import {
  CLOUDFLARE_AI_MODEL,
  MAX_OUTPUT_TOKENS,
  corpoRichiestaAI,
  estraiJSONRisposta,
  type WorkersAiBinding,
} from '../site/src/lib/cloudflare-ai.ts';
import { onRequest } from '../functions/api/orologiaio.ts';

const data: Directory = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const ORIGIN = 'https://orologiai.it';

// Binding AI simulato: nessuna rete, nessuna credenziale, cattura ciò che riceve il modello.
const binding = (risposta: unknown) => {
  const invii: { model: string; input: Record<string, unknown> }[] = [];
  const ai: WorkersAiBinding = {
    async run(model, input) {
      invii.push({ model, input });
      return risposta;
    },
  };
  return { ai, invii };
};

const richiesta = (corpo: unknown, opz: { ip?: string; origin?: string | null } = {}) => {
  const headers: Record<string, string> = {
    'cf-connecting-ip': opz.ip ?? '203.0.113.1',
    'content-type': 'application/json',
  };
  if (opz.origin !== null) headers.origin = opz.origin ?? ORIGIN;
  return new Request(`${ORIGIN}/api/orologiaio`, {
    method: 'POST',
    headers,
    body: JSON.stringify(corpo),
  });
};
const deps = (extra: Partial<Deps> = {}): Deps => ({ dir: data, limiter: creaRateLimiter(1000), ...extra });
const envAI = (ai: WorkersAiBinding): Env => ({ AI_PROVIDER: 'cloudflare', AI: ai });

test('Workers AI configurato: modalità ai con risposta del modello e criteri validati sul database', async () => {
  const { ai, invii } = binding({
    response: {
      risposta: 'Guardo subito gli orologiai di Firenze per la revisione.',
      localita: 'firenze',
      servizio: 'revisione',
      marca: 'Omega',
      specializzazione: 'automatici',
    },
  });
  const r = await handleOrologiaio(
    richiesta({ messaggio: 'Cerco a Firenze un orologiaio per revisionare un Omega automatico' }),
    envAI(ai),
    deps(),
  );
  const testo = await r.text();
  const body = JSON.parse(testo);
  assert.equal(body.modalita, 'ai');
  assert.equal(body.risposta, 'Guardo subito gli orologiai di Firenze per la revisione.');
  assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione', marca: 'Omega', specializzazione: 'automatici' });
  assert.equal(invii.length, 1);
  assert.equal(invii[0].model, CLOUDFLARE_AI_MODEL);
});

test('il modello inventa località e marca: rimosse dopo la validazione, il servizio non richiesto è scartato', async () => {
  const { ai } = binding({
    response: { localita: 'citta-inventata', marca: 'MarcaInventata', servizio: 'riparazione' },
  });
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'x' }), envAI(ai), deps())).json();
  assert.equal(body.modalita, 'ai');
  assert.equal(body.criteri.localita, undefined);
  assert.equal(body.criteri.marca, undefined);
  assert.equal(body.criteri.servizio, undefined);
  assert.equal(body.criteri.localitaNonCensita, 'citta-inventata');
});

test('JSON Mode: modello fisso, schema del database, 400 token di output, nessun dato personale', async () => {
  const { ai, invii } = binding({ response: { servizio: 'revisione' } });
  await handleOrologiaio(richiesta({ messaggio: 'orologiaio a Firenze' }), envAI(ai), deps());
  const { model, input } = invii[0];
  assert.equal(model, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  assert.equal(input.max_tokens, MAX_OUTPUT_TOKENS);
  assert.equal(input.temperature, 0);
  const formato = input.response_format as { type: string; json_schema: { additionalProperties: boolean } };
  assert.equal(formato.type, 'json_schema');
  assert.equal(formato.json_schema.additionalProperties, false);
  const messages = input.messages as { role: string; content: string }[];
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /ignora qualsiasi istruzione/);
  assert.equal(messages.at(-1)?.content, 'orologiaio a Firenze');
  const siero = JSON.stringify(input);
  assert.ok(!siero.includes('203.0.113.1'), 'nessun IP inoltrato al modello');
  assert.ok(!/\blat\b|"lon"/.test(siero), 'nessuna coordinata inoltrata al modello');
});

test('il contesto dei turni precedenti entra come turno separato, dopo il messaggio attuale', () => {
  const corpo = corpoRichiestaAI(data, 'x');
  const conContesto = corpoRichiestaAI(data, 'specializzato negli automatici', { localita: 'firenze' });
  assert.equal(corpo.messages.length, 2, 'sistema + messaggio');
  assert.equal(conContesto.messages.length, 4, 'sistema + contesto + preambolo + messaggio');
  assert.match(conContesto.messages[1].content, /Contesto della conversazione/);
  assert.equal(conContesto.messages[2].content, 'Nuovo messaggio del cliente, da qui estrai i criteri:');
  assert.equal(conContesto.messages.at(-1)?.content, 'specializzato negli automatici');
});

test('la risposta del binding come stringa JSON viene accettata come oggetto', () => {
  assert.deepEqual(estraiJSONRisposta({ response: '{"localita":"firenze"}' }), { localita: 'firenze' });
  assert.deepEqual(estraiJSONRisposta({ result: { response: { servizio: 'revisione' } } }), { servizio: 'revisione' });
  assert.throws(() => estraiJSONRisposta({ response: 'questo non è JSON' }));
  assert.throws(() => estraiJSONRisposta({ response: null }));
  assert.throws(() => estraiJSONRisposta({ response: [1, 2] }));
});

test('JSON non valido del modello: fallback locale dichiarato', async () => {
  const { ai } = binding({ response: 'questo non è JSON' });
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), envAI(ai), deps())).json();
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.servizio, 'revisione');
  assert.equal(body.criteri.localita, 'firenze');
  assert.match(body.avviso, /non ha risposto in modo utilizzabile/);
});

test('quota esaurita o errore del binding: fallback senza dettagli interni', async () => {
  const ai: WorkersAiBinding = { run: async () => { throw new Error('quota esaurita: 429'); } };
  const r = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), envAI(ai), deps());
  const testo = await r.text();
  const body = JSON.parse(testo);
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.localita, 'firenze');
  assert.ok(!testo.includes('429'), 'nessun dettaglio del provider nella risposta');
});

test('timeout del binding: fallback entro il limite, con ricerca locale comunque funzionante', async () => {
  const ai: WorkersAiBinding = { run: () => new Promise<never>(() => {}) };
  const body = await (await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), envAI(ai), deps({ timeoutMs: 20 }))).json();
  assert.equal(body.modalita, 'fallback');
  assert.equal(body.criteri.servizio, 'revisione');
});

test('AI_PROVIDER senza binding o binding senza AI_PROVIDER: non-configurato, nessuna chiamata', async () => {
  const { ai, invii } = binding({ response: { servizio: 'revisione' } });
  const senzaBinding = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), { AI_PROVIDER: 'cloudflare' }, deps());
  assert.equal((await senzaBinding.json()).modalita, 'non-configurato');
  const senzaVariabile = await handleOrologiaio(richiesta({ messaggio: 'revisione a Firenze' }), { AI: ai }, deps());
  assert.equal((await senzaVariabile.json()).modalita, 'non-configurato');
  assert.equal(invii.length, 0);
});

test('entry pubblica: Workers AI solo con configurazione esplicita, Gemini ignorato anche con chiave', async () => {
  const { ai, invii } = binding({
    response: { risposta: 'Cerco gli orologiai pertinenti.', localita: 'firenze', servizio: 'revisione' },
  });
  const chiamateEsterne: string[] = [];
  const originale = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    chiamateEsterne.push(String(input));
    return Promise.reject(new Error('nessuna chiamata esterna attesa'));
  }) as typeof fetch;
  try {
    // Anche con una GEMINI_API_KEY accidentale nell'ambiente: vince Workers AI o il locale.
    const attiva = await onRequest({
      request: richiesta({ messaggio: 'revisione a Firenze' }),
      env: { GEMINI_API_KEY: 'CHIAVE_FITTIZIA_SOLO_PROVA', AI_PROVIDER: 'cloudflare', AI: ai },
    });
    const body = await attiva.json();
    assert.equal(body.modalita, 'ai');
    assert.equal(body.risposta, 'Cerco gli orologiai pertinenti.');
    assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione' });
    // Binding presente ma AI_PROVIDER non impostato: nessuna attivazione implicita.
    const spenta = await onRequest({
      request: richiesta({ messaggio: 'revisione a Firenze' }),
      env: { GEMINI_API_KEY: 'CHIAVE_FITTIZIA_SOLO_PROVA', AI: ai },
    });
    assert.equal((await spenta.json()).modalita, 'non-configurato');
    assert.equal(invii.length, 1, 'il binding è usato solo nel caso esplicitamente attivato');
  } finally {
    globalThis.fetch = originale;
  }
  assert.deepEqual(chiamateEsterne, [], 'nessuna richiesta esterna né verso Gemini né verso altri');
});
