import assert from 'node:assert/strict';
import { directory } from '../site/src/lib/directory.ts';
import { cercaOrologiaio } from '../site/src/lib/assistant.ts';
import { handleOrologiaio, type RispostaOrologiaio } from '../site/src/lib/orologiaio-api.ts';

// Prova reale contro Gemini: eseguibile solo quando GEMINI_API_KEY è configurata nell'ambiente.
// Non fa parte di npm test per non generare chiamate o costi non richiesti.
const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
if (!apiKey) {
  console.error('PROVA REALE BLOCCATA: GEMINI_API_KEY non è presente nell’ambiente.');
  console.error('Imposta la chiave nel tuo ambiente locale (es. GEMINI_API_KEY=... npm run test:gemini:live) e riesegui.');
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

assert.equal(body.modalita, 'ai', `Il provider non ha risposto come AI reale (modalita=${body.modalita}, avviso=${body.avviso})`);
assert.equal(body.criteri.localita, 'firenze');
assert.equal(body.criteri.servizio, 'revisione');
assert.equal(body.criteri.marca, 'Omega');
assert.notEqual(body.criteri.ruoloMarca, 'assistenzaUfficiale', 'Non era richiesta assistenza ufficiale');

const esito = cercaOrologiaio(directory, body.criteri);
assert.ok(esito.totale > 0, 'Il motore deve restituire attività reali di Firenze');
for (const r of esito.risultati) {
  assert.ok(directory.attivita.some(b => b.id === r.id), `Risultato non presente nel database: ${r.id}`);
}
console.log(`Prova reale Gemini superata: modalita=${body.modalita}, criteri=${JSON.stringify(body.criteri)}, risultati=${esito.risultati.map(r => r.id).join(', ')}`);
