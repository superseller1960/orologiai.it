# Orologiaio: modello AI, endpoint e configurazione

## Stato
- **Implementato:** endpoint `POST /api/orologiaio` (Cloudflare Pages Function `functions/api/orologiaio.ts`), client Gemini server-side (`site/src/lib/gemini.ts`), handler (`site/src/lib/orologiaio-api.ts`), routing `_routes.json` (`site/assets/_routes.json` → `dist/_routes.json`), script di prova reale separato (`scripts/verify-gemini-live.ts`), fallback deterministico, interfaccia e test.
- **Verificato localmente:** esecuzione della Pages Function `onRequest` tramite server HTTP locale reale (`node:http` + `fetch`), DOM test con geolocalizzazione negata e con risposta dell’endpoint, 73 test automatici.
- **Bloccato (richiede credenziali/account esterni):**
  - chiamata reale a Gemini (`GEMINI_API_KEY` non presente nell’ambiente);
  - test con `wrangler pages dev` (Wrangler non è installato nel progetto per non gonfiare il lockfile con centinaia di MB di dipendenze non usate dal build statico);
  - distribuzione della Function su Cloudflare Pages e regola WAF di rate limiting sul dominio.
- Finché `npm run test:gemini:live` non è stato eseguito con una chiave reale, **l’assistente AI reale non è dichiarato attivo**.

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

## Configurazione del secret e prova reale
1. In Google AI Studio / Google Cloud creare una chiave limitata alla sola *Generative Language API* e impostare un budget mensile con avviso (es. $5/mese).
2. **Prova reale in locale** (senza committare nulla):
   ```bash
   GEMINI_API_KEY="la_tua_chiave" npm run test:gemini:live
   ```
   Lo script invia la richiesta di prova tramite `handleOrologiaio`, verifica che `modalita === 'ai'`, che i criteri rispettino lo schema Zod e che `cercaOrologiaio` restituisca solo attività reali del database. Senza chiave esce con codice `2` (`PROVA REALE BLOCCATA`).
3. **Configurazione su Cloudflare Pages:**
   - Dashboard Cloudflare → Workers & Pages → progetto → **Settings → Variables and Secrets** → aggiungere `GEMINI_API_KEY` selezionando **Encrypt** (oppure `npx wrangler pages secret put GEMINI_API_KEY --project-name <nome>`).
   - Impostazioni build: comando `npm run build`, directory di output `dist`.

## Rate limiting e protezione antiabuso
- **Nel codice applicativo (`site/src/lib/orologiaio-api.ts`):**
  - Solo `POST` (405 sugli altri metodi), controllo `Origin` same-origin (403), `Content-Type: application/json` (415), corpo massimo 1.024 byte (413), messaggio massimo 500 caratteri (413), schema stretto `{ messaggio }` (400), timeout di 8 s verso Gemini.
  - Rate limiter in memoria da 10 richieste/minuto per IP (`cf-connecting-ip`) con risposta `429` e `Retry-After: 60`.
- **Limite del rate limiter in memoria:** in un ambiente serverless distribuito ogni isolate ha la propria memoria; il contatore non è condiviso fra istanze o data center e si azzera al riciclo dell’isolate. **Non è sufficiente da solo in produzione.**
- **Procedura per la protezione di piattaforma (Cloudflare WAF Rate Limiting rule):**
  - *Requisiti verificati sulla documentazione Cloudflare:* il piano **Free** di una zona Cloudflare include **1 regola WAF di rate limiting** con conteggio per **IP**, finestra fissa di **10 secondi** e azione **Block** per **10 secondi** (contatore locale per data center Cloudflare). Richiede che il sito sia servito su un **dominio personalizzato con record DNS proxied** (arancione) nella zona Cloudflare; non è applicabile direttamente all’hostname `*.pages.dev`. Inoltre sul piano Free l’espressione della regola può filtrare per **URI Path** ma non per `Method` (disponibile da Business/Enterprise), cosa accettabile perché `/api/orologiaio` accetta solo `POST`.
  - *Passi nella dashboard Cloudflare (zona del dominio `orologiai.it`):*
    1. Aprire **Security → Security rules → Create rule → Rate limiting rules**.
    2. Nome regola: `Limite API Orologiaio`.
    3. **When incoming requests match:** `URI Path` `equals` `/api/orologiaio`.
    4. **With the same characteristics:** `IP`.
    5. **When rate exceeds:** `Requests: 5`, `Period: 10 seconds`.
    6. **Then take action:** `Block`, `Duration: 10 seconds`.
    7. Selezionare **Deploy**.
