import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { cercaOrologiaio, criteriSchema } from '../site/src/lib/assistant.ts';
import { handleOrologiaio, type RispostaOrologiaio } from '../site/src/lib/orologiaio-api.ts';

// Prova reale contro Gemini: eseguibile solo quando GEMINI_API_KEY è configurata nell'ambiente
// o in un file locale non tracciato da Git (.env o .dev.vars).
// Non fa parte di npm test per non generare chiamate o costi non richiesti.
if (!process.env.GEMINI_API_KEY) {
  for (const file of ['.env', '.dev.vars']) {
    if (existsSync(file)) {
      try { process.loadEnvFile(file); } catch { /* file non leggibile: ignorato */ }
      if (process.env.GEMINI_API_KEY) break;
    }
  }
}
const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
if (!apiKey) {
  console.error('PROVA REALE BLOCCATA: GEMINI_API_KEY non è presente nell’ambiente né in .env / .dev.vars.');
  console.error('Imposta la chiave in .env o .dev.vars (non tracciati da Git) oppure nell’ambiente e riesegui npm run test:gemini:live.');
  process.exit(2);
}

const ORIGIN = 'https://orologiai.it';
const messaggio = 'Cerco a Firenze un orologiaio per revisionare un orologio automatico Omega. Non è obbligatorio che sia un centro ufficiale.';

const res = await handleOrologiaio(
  new Request(`${ORIGIN}/api/orologiaio`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.10' },
    body: JSON.stringify({ messaggio }),
  }),
  { GEMINI_API_KEY: apiKey },
  { dir: directory },
);

assert.equal(res.status, 200, `HTTP inatteso: ${res.status}`);
const raw = await res.text();
assert.ok(!raw.includes(apiKey), 'La chiave compare nella risposta');
const body = JSON.parse(raw) as RispostaOrologiaio;

// 1. Chiamata reale e modalità
assert.equal(body.modalita, 'ai', `Il provider non ha risposto come AI reale (modalita=${body.modalita}, avviso=${body.avviso})`);

// 2. Validazione Zod esplicita dei criteri restituiti
const validati = criteriSchema.parse(body.criteri);

// 3. Interpretazione corretta dei criteri
assert.equal(validati.localita, 'firenze');
assert.equal(validati.servizio, 'revisione');
assert.equal(validati.marca, 'Omega');
assert.notEqual(validati.ruoloMarca, 'assistenzaUfficiale', 'Non era richiesta assistenza ufficiale');

// 4. Ricerca deterministica nel database reale
const esito = cercaOrologiaio(directory, validati);
assert.ok(esito.totale > 0, 'Il motore deve restituire attività reali di Firenze');
for (const r of esito.risultati) {
  assert.ok(directory.attivita.some(b => b.id === r.id), `Risultato non presente nel database: ${r.id}`);
}

// 5. Gestione degli errori del provider (chiave non valida / errore HTTP dal server Gemini -> fallback pulito senza esporre segreti)
const resErr = await handleOrologiaio(
  new Request(`${ORIGIN}/api/orologiaio`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.11' },
    body: JSON.stringify({ messaggio }),
  }),
  { GEMINI_API_KEY: 'CHIAVE_NON_VALIDA_PROVA_ERRORE' },
  { dir: directory },
);
assert.equal(resErr.status, 200);
const rawErr = await resErr.text();
assert.ok(!rawErr.includes('CHIAVE_NON_VALIDA_PROVA_ERRORE'), 'La chiave non deve mai comparire nemmeno in caso di errore');
const bodyErr = JSON.parse(rawErr) as RispostaOrologiaio;
assert.equal(bodyErr.modalita, 'fallback', 'Un errore reale del provider deve attivare il fallback deterministico dichiarato');
assert.equal(bodyErr.criteri.localita, 'firenze');
assert.equal(bodyErr.criteri.servizio, 'revisione');

console.log(`Prova reale Gemini superata: modalita=${body.modalita}, criteri=${JSON.stringify(validati)}, risultati=${esito.risultati.map(r => r.id).join(', ')}, fallbackErrore=${bodyErr.modalita}`);

