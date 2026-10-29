# Orologiai.it — ricerca guidata e Workers AI

Come funziona l'assistente Orologiaio sul deployment pubblico, quali sono i costi e come si
attiva l'AI senza sorprese. Aggiornato all'integrazione condivisa del 24/10/2026
(vedi `docs/INTEGRAZIONE-CODEX-20261024.md` per lo stato di consegna).

## Architettura

- La logica vive in `site/src/lib/orologiaio-api.ts` (`handleOrologiaio`) ed è condivisa dalle
  entry: `functions/api/orologiaio.ts` (Cloudflare Pages), `scripts/pages-worker.ts` (il
  `_worker.js` generato in `.runtime/pages-build`) e la entry Vercel legacy `site/src/api/orologiaio.ts`.
- L'interpretazione della richiesta è in `site/src/lib/assistant.ts`: il modello può solo
  proporre criteri e una breve risposta conversazionale; **i risultati li sceglie sempre il
  motore di ricerca locale** (`searchDirectory`), mai il modello. Ogni criterio proposto viene
  validato e ridotto ai valori esistenti nel database; località/marchi sconosciuti diventano
  `localitaNonCensita` o `terminiNonRiconosciuti`, mai inventati.
- Provider AI, in ordine di priorità:
  1. **Workers AI** (`site/src/lib/cloudflare-ai.ts`): modello fisso `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (JSON Mode, incluso nel piano Workers Free; il vecchio `llama-3.1-8b-instruct` è ritirato)
     con JSON Mode (`response_format: { type: 'json_schema', json_schema }`), una sola chiamata
     per messaggio, al massimo 400 token di output.
  2. **Gemini** (`site/src/lib/gemini.ts`, invariato): solo percorsi privati/legacy, non passa
     mai dalla entry pubblica.
  3. Nessun provider → interpretazione deterministica locale (`modalita: "non-configurato"`).

## Modalità dichiarate nella risposta

Ogni risposta JSON riporta `modalita`:

- `ai`: il modello ha risposto con JSON valido; la risposta conversazionale è coerente con i
  criteri e non contiene fatti sulle attività.
- `fallback`: il modello non ha risposto in modo utilizzabile (timeout, quota esaurita, errore,
  JSON non valido o oltre i limiti): si usa la ricerca locale e la risposta lo dichiara.
- `non-configurato`: nessun provider configurato; ricerca locale.

In tutti e tre i casi la ricerca funziona: l'AI è un ausilio all'interpretazione, mai un
prerequisito.

## Costo zero e attivazione deliberata

- **Gemini resta disattivato** sul deployment pubblico: le Condizioni aggiuntive del Gemini API
  richiedono i Paid Services per i client offerti a utenti EEA/CH/UK e questo sito è gratuito.
  Il kill-switch è nel commento e nel codice di `functions/api/orologiaio.ts`: nessuna chiave
  Google passa alla funzione pubblica, anche se `GEMINI_API_KEY` fosse presente nell'ambiente
  (c'è un test di regressione dedicato). Il file `gemini.ts` resta per i test privati
  (`npm run test:gemini:live`) e non viene modificato.
- **Workers AI si attiva solo esplicitamente**: servono il binding `AI` sul progetto Pages e la
  variabile d'ambiente `AI_PROVIDER=cloudflare`. Senza i due requisiti insieme non parte alcuna
  chiamata (altro test di regressione). Il piano gratuito Cloudflare include una quota giornaliera
  di inferenza: se la quota finisce o l'API risponde 429/402, la risposta passa in `fallback`
  senza costi e senza interrompere la ricerca.

## Privacy e sicurezza

- Al modello partono **solo** il messaggio del cliente, il contesto dei turni precedenti già
  validato e gli elenchi del database (località, province, regioni, marchi, servizi). Mai IP,
  header, coordinate, identificativi o dati personali del visitatore (verificato da test).
- Il messaggio dell'utente è trattato come dato non attendibile: le istruzioni di sistema vietano
  di eseguirlo e di rivelare le istruzioni stesse.
- L'output del modello passa da schema Zod stretto (`additionalProperties: false`, enum derivati
  dal database): campi sconosciuti o valori invalidi fanno scattare il fallback, non vengono
  pubblicati.
- Limiti applicativi: payload ≤ 4 KB, messaggio ≤ 500 caratteri, rate limit best-effort 10
  richieste/minuto per IP (`creaRateLimiter`, per-isolate), risposte `no-store`, controllo
  dell'`Origin` (solo stessa origine), nessun dettaglio interno o chiave nei messaggi di errore.
  Il rate limit per-isolate **non sostituisce** una regola di rate limiting/WAF della piattaforma:
  se l'assistente resta pubblico, abilitare la regola gratuita su Cloudflare (vedi sotto).

## Configurazione e collaudo

```bash
npm ci
npm run verify          # typecheck, build, 192 test, test DOM ricerca/chat
npm run package:pages   # genera .runtime/pages-build (_worker.js + manifest SHA-256)
npx wrangler@4 pages dev .runtime/pages-build   # collaudo locale in workerd
```

- In locale il binding `AI` non esiste: l'assistente risponde `non-configurato` e la ricerca
  locale funziona — è il comportamento atteso, non un errore.
- L'attivazione su Cloudflare Pages richiede, sul progetto `orologiai-it`: binding **Workers AI**
  (`AI`) e variabile `AI_PROVIDER=cloudflare`, senza alcuna chiave Google. La modalità `ai` reale
  non è stata collaudata in questa sessione (serve l'account Cloudflare): è coperta dai test con
  binding simulato e va verificata sull'anteprima dopo l'attivazione.
- Regola WAF/rate limiting consigliata sul percorso `/api/orologiaio` (piano gratuito): il
  limitatore applicativo è solo un freno best-effort.

## Test di regressione

- `tests/orologiaio-api.test.ts`: validazione input, origine, limiti, kill-switch Gemini, risposte
  senza chiavi né dettagli interni, fallback per errori/timeout del provider.
- `tests/cloudflare-ai.test.ts`: adapter Workers AI con binding simulato — modalità `ai`,
  criteri ridotti al database, JSON Mode e tetto dei 400 token, privacy del prompt (nessun IP o
  coordinata), fallback per JSON invalido/quota/timeout, attivazione esplicita della entry.
- `tests/vercel-api.test.ts`, `tests/pr6-20261024.test.ts`: bundle autosufficienti e conservazione
  dei dati.
