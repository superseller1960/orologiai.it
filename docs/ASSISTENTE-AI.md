# Orologiaio: modello AI, endpoint e configurazione

## Stato
- **Implementato:** endpoint `POST /api/orologiaio` (Cloudflare Pages Function `functions/api/orologiaio.ts`), client Gemini server-side (`site/src/lib/gemini.ts`), handler (`site/src/lib/orologiaio-api.ts`), routing `_routes.json` (`site/assets/_routes.json` → `dist/_routes.json`), script di prova reale separato (`scripts/verify-gemini-live.ts`), fallback deterministico, interfaccia e test.
- **Verificato localmente:**
  - esecuzione della Pages Function `onRequest` tramite server HTTP locale reale (`node:http` + `fetch`);
  - compilazione e importazione ESM isolata di `functions/api/orologiaio.ts` tramite `esbuild` (`platform: 'neutral'`, zero dipendenze da moduli Node built-in, ~909 KB con dataset JSON incorporato);
  - presenza e contenuto esatto di `dist/_routes.json` (`include: ["/api/orologiaio"]`, verificato automaticamente in `scripts/check-build.ts`);
  - DOM test con geolocalizzazione negata e con risposta dell’endpoint, 74 test automatici.
- **Bloccato (richiede credenziali/account esterni):**
  - chiamata reale a Gemini (`GEMINI_API_KEY` non presente nell’ambiente);
  - esecuzione nel runtime `workerd` tramite `wrangler pages dev` (Wrangler non è installato nel progetto per non appesantire il lockfile con centinaia di MB di dipendenze non usate dal build statico);
  - distribuzione della Function su Cloudflare Pages e regola WAF di rate limiting sul dominio (nessun progetto Cloudflare configurato in questo ambiente).
- Finché `npm run test:gemini:live` non è stato eseguito con una chiave reale e il progetto Cloudflare Pages non è stato distribuito, **l’assistente AI reale e la Function in produzione non sono dichiarati attivi**.

## Architettura
- Il sito resta statico (`output: 'static'`). Solo `/api/orologiaio` invoca la Function grazie a `dist/_routes.json` (`include: ["/api/orologiaio"]`), così le richieste alle pagine statiche non consumano la quota giornaliera delle Pages Functions (100.000 richieste/giorno sul piano Free).
- Flusso a 3 livelli:
  1. **Livello A (Interpretazione):** il browser invia `POST /api/orologiaio` con `{ "messaggio": "..." }`. Il server chiama Gemini, valida l’output con `criteriSchema` (Zod strict) e scarta qualsiasi località o marca non presente nel database.
  2. **Livello B (Ricerca deterministica):** il browser applica i criteri a `searchDirectory` (`site/src/lib/search.ts`) sul dataset autorevole (`site/data/directory.json`).
  3. **Livello C (Presentazione):** l’interfaccia mostra le schede reali, i motivi fondati sui dati e i link alle schede. Una sola chiamata AI per richiesta, nessuna generazione discorsiva dei risultati.
- Le coordinate dell’utente non vengono mai inviate al server né al provider AI: la distanza è calcolata solo nel browser.

## Provider scelto: Google Gemini (`gemini-3.5-flash-lite`)
- Verificato sulla documentazione ufficiale (`ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite`, `ai.google.dev/gemini-api/docs/pricing`, `ai.google.dev/api/generate-content`) il 16/10/2026:
  - identificativo modello: `gemini-3.5-flash-lite`, stato **Stable**, input 1.048.576 token, output 65.536 token;
  - output strutturato supportato;
  - endpoint REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent` con header `x-goog-api-key`;
  - campi REST su `generationConfig` (secondo la reference `models.generateContent`): `responseMimeType: "application/json"` e `responseJsonSchema: schemaCriteri(dir)` con keyword supportate (`type`, `properties`, `enum`, `minimum`, `maximum`, `description`, `additionalProperties: false`). *Nota:* `responseFormat` appartiene alla diversa Interactions API e non è usato qui.
- Nessun grounding con Google Search o Google Maps (che comporterebbe $14 / 1.000 query oltre la franchigia e introdurrebbe dati esterni non verificati).

## Costi stimati (su ipotesi esplicite, non misurati in produzione)
- Tariffa ufficiale Standard Paid per `gemini-3.5-flash-lite`:
  - **Input:** $0,30 per 1.000.000 token.
  - **Output (inclusi thinking token):** $2,50 per 1.000.000 token.
- Misura del payload reale generato da `corpoRichiesta(directory, messaggio)` con i 18 comuni e i 27 marchi attuali: **4.554 caratteri JSON** (istruzioni di sistema + schema JSON + messaggio di 124 caratteri).
- Ipotesi esplicite:
  - **Token medi in ingresso:** ~1.150 token (4.554 caratteri ÷ 4 caratteri/token).
  - **Token medi in uscita:** ~60 token (JSON compatto con 2–4 campi, `maxOutputTokens: 300`).
- Calcolo:
  - Costo input per richiesta: `1.150 × $0,30 / 1.000.000 = $0,000345`.
  - Costo output per richiesta: `60 × $2,50 / 1.000.000 = $0,000150`.
  - **Costo stimato per singola richiesta:** **~$0,00050** (circa mezzo millesimo di dollaro).
  - **Costo stimato per 1.000 richieste:** **~$0,50 USD**.
- **Privacy e scelta del piano:**
  - Sul **Free tier** i contenuti inviati *sono utilizzati da Google per migliorare i prodotti* (`Used to improve our products: Yes`). Non è raccomandato per un sito pubblico in cui gli utenti possono scrivere testo libero.
  - Sul **Paid tier (Standard)** i contenuti *non sono utilizzati per migliorare i prodotti* (`Used to improve our products: No`). Il Contributor tier va evitato perché riattiva la condivisione dei dati.
  - Nessun piano a pagamento è stato attivato in questo incremento.

## Procedura di esecuzione locale con Wrangler (senza sporcare il lockfile)
Wrangler non è aggiunto a `package.json` per evitare di installare centinaia di MB di dipendenze nel repository statico. Per provare in locale l’intera applicazione (`dist/` + `functions/api/orologiaio.ts`) dentro il runtime Cloudflare Pages (`workerd`):

1. Compilare il sito statico (produce `dist/` con `dist/_routes.json`):
   ```bash
   npm run build
   ```
2. (Facoltativo) Per testare anche Gemini in locale con Wrangler, creare nella radice del progetto un file `.dev.vars` (già ignorato in `.gitignore`, **mai committare**):
   ```ini
   GEMINI_API_KEY=la_tua_chiave_privata
   ```
   Se `.dev.vars` non esiste, la Function risponde regolarmente con `modalita: "non-configurato"` e fallback deterministico.
3. Avviare Wrangler al volo con `npx` (senza modificare `package.json` né `package-lock.json`):
   ```bash
   npx --yes wrangler@latest pages dev dist --port 8788
   ```
4. Verificare dal terminale o nel browser su `http://localhost:8788/orologiaio/`:
   ```bash
   curl -i -X POST http://localhost:8788/api/orologiaio \
     -H 'Content-Type: application/json' \
     -H 'Origin: http://localhost:8788' \
     -d '{"messaggio":"Cerco un orologiaio a Firenze per revisionare un automatico"}'
   ```

## Configurazione sicura del secret e prova reale
> **Regola di sicurezza:** non incollare mai `GEMINI_API_KEY` in chat, nelle issue, nelle pull request o in file tracciati da Git.

1. **Creazione e restrizione della chiave (Google Cloud / Google AI Studio):**
   - Creare una chiave API su un progetto con **fatturazione Standard (Paid tier)** attiva (così che gli input degli utenti non siano usati per il training).
   - In *Google Cloud Console → APIs & Services → Credentials*, limitare la chiave (*API restrictions*) alla sola **Generative Language API**.
   - In *Billing → Budgets & alerts*, impostare un budget mensile (es. $5–$10/mese) con notifiche email al 50%, 90% e 100%.
2. **Prova reale in locale** (senza committare nulla):
   ```bash
   GEMINI_API_KEY="la_tua_chiave" npm run test:gemini:live
   ```
   Lo script invia la richiesta di prova tramite `handleOrologiaio`, verifica che `modalita === 'ai'`, che la chiave non compaia mai nell’output, che i criteri rispettino lo schema Zod, che non venga attribuita `assistenzaUfficiale` non richiesta e che `cercaOrologiaio` restituisca solo attività reali del database. Senza chiave esce con codice `2` (`PROVA REALE BLOCCATA`).
3. **Configurazione minima su Cloudflare Pages (da eseguire a cura del titolare dell’account):**
   - **Progetto Pages:** collegare il repository GitHub `superseller1960/orologiai.it` in *Workers & Pages → Create application → Pages*.
   - **Build settings:**
     - *Framework preset:* `Astro`
     - *Build command:* `npm run build`
     - *Build output directory:* `dist`
     - *Variabile ambiente di build:* `NODE_VERSION = 22.22.0` (o superiore).
   - **Secret lato server (`GEMINI_API_KEY`):**
     - Da Dashboard: *Workers & Pages → `<progetto>` → Settings → Variables and Secrets → Add* → tipo **Secret** (Encrypted), nome `GEMINI_API_KEY`, per entrambi gli ambienti *Production* e *Preview*.
     - Oppure da CLI:
       ```bash
       npx --yes wrangler@latest pages secret put GEMINI_API_KEY --project-name <nome-progetto>
       ```
   - Dopo l’inserimento di un nuovo Secret su Cloudflare Pages, avviare un nuovo deployment affinché le Pages Functions ricevano `env.GEMINI_API_KEY`.

## Rate limiting e protezione antiabuso
- **Nel codice applicativo (`site/src/lib/orologiaio-api.ts`):**
  - Solo `POST` (405 sugli altri metodi), controllo `Origin` same-origin (403), `Content-Type: application/json` (415), corpo massimo 1.024 byte (413), messaggio massimo 500 caratteri (413), schema stretto `{ messaggio }` (400), timeout di 8 s verso Gemini.
  - Rate limiter in memoria da 10 richieste/minuto per IP (`cf-connecting-ip`) con risposta `429` e `Retry-After: 60`.
- **Limite del rate limiter in memoria:** in un ambiente serverless distribuito ogni isolate ha la propria memoria; il contatore non è condiviso fra istanze o data center e si azzera al riciclo dell’isolate. **Non è sufficiente da solo in produzione.**
- **Procedura per la protezione di piattaforma (Cloudflare WAF Rate Limiting rule):**
  - *Requisiti e costi verificati sulla documentazione Cloudflare:*
    - Il piano **Free** di una zona Cloudflare (**$0/mese**) include **1 regola WAF di rate limiting** senza costi aggiuntivi, con conteggio per **IP**, finestra fissa di **10 secondi** e azione **Block** per **10 secondi** (contatore locale per data center Cloudflare).
    - Richiede che il sito sia servito su un **dominio personalizzato con record DNS proxied** (nuvola arancione) nella zona Cloudflare; non è applicabile direttamente all’hostname `*.pages.dev`.
    - Sul piano Free l’espressione della regola può filtrare per **URI Path** (`http.request.uri.path eq "/api/orologiaio"`) ma non per `Method` (disponibile dai piani a pagamento), cosa accettabile perché `/api/orologiaio` accetta solo `POST` e risponde `405` agli altri metodi senza invocare Gemini.
  - *Passi nella dashboard Cloudflare (zona del dominio, una volta collegato senza toccare prematuramente il DNS di produzione):*
    1. Aprire **Security → Security rules → Create rule → Rate limiting rules**.
    2. Nome regola: `Limite API Orologiaio`.
    3. **When incoming requests match:** Field `URI Path`, Operator `equals`, Value `/api/orologiaio` (espressione: `(http.request.uri.path eq "/api/orologiaio")`).
    4. **With the same characteristics:** `IP`.
    5. **When rate exceeds:** `Requests: 5`, `Period: 10 seconds`.
    6. **Then take action:** `Block` (con risposta predefinita `429 Too Many Requests`), `Duration: 10 seconds`.
    7. Selezionare **Deploy**.
