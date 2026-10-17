# Orologiaio: modello AI a costo zero, endpoint e configurazione

## Stato
- **Implementato:** endpoint `POST /api/orologiaio` (Cloudflare Pages Function `functions/api/orologiaio.ts`), client Gemini server-side (`site/src/lib/gemini.ts`), handler (`site/src/lib/orologiaio-api.ts`), routing `_routes.json` (`site/assets/_routes.json` → `dist/_routes.json`), script di prova reale separato (`scripts/verify-gemini-live.ts`), fallback deterministico, interfaccia e test.
- **Vincolo economico attivo:** configurazione esclusivamente a **costo zero ($0.00)** tramite il **Free Tier di Google Gemini API** per `gemini-3.5-flash-lite` (nessun account di fatturazione collegato) e il **piano Free di Cloudflare Pages/WAF**.
- **Verificato localmente:**
  - esecuzione della Pages Function `onRequest` tramite server HTTP locale reale (`node:http` + `fetch`);
  - compilazione e importazione ESM isolata di `functions/api/orologiaio.ts` tramite `esbuild` (`platform: 'neutral'`, zero dipendenze da moduli Node built-in, ~909 KB con dataset JSON incorporato);
  - presenza e contenuto esatto di `dist/_routes.json` (`include: ["/api/orologiaio"]`, verificato automaticamente in `scripts/check-build.ts`);
  - DOM test con geolocalizzazione negata e con risposta dell’endpoint, 74 test automatici.
- **Bloccato (richiede credenziali/account esterni):**
  - chiamata reale a Gemini (`GEMINI_API_KEY` non presente nell’ambiente);
  - esecuzione nel runtime `workerd` tramite `wrangler pages dev` (Wrangler non è installato nel progetto per non appesantire il lockfile con centinaia di MB di dipendenze non usate dal build statico);
  - distribuzione della Function su Cloudflare Pages e regola WAF di rate limiting sul dominio (nessun progetto Cloudflare configurato in questo ambiente).
- Finché `npm run test:gemini:live` non è stato eseguito con una chiave Free Tier reale e il progetto Cloudflare Pages non è stato distribuito, **l’assistente AI reale e la Function in produzione non sono dichiarati attivi**.

## Architettura
- Il sito resta statico (`output: 'static'`). Solo `/api/orologiaio` invoca la Function grazie a `dist/_routes.json` (`include: ["/api/orologiaio"]`), così le richieste alle pagine statiche non consumano la quota giornaliera delle Pages Functions (100.000 richieste/giorno sul piano Free di Cloudflare).
- Flusso a 3 livelli:
  1. **Livello A (Interpretazione):** il browser invia `POST /api/orologiaio` con `{ "messaggio": "..." }`. Il server chiama Gemini, valida l’output con `criteriSchema` (Zod `.strict()`) e scarta qualsiasi località o marca non presente nel database.
  2. **Livello B (Ricerca deterministica):** il browser applica i criteri a `searchDirectory` (`site/src/lib/search.ts`) sul dataset autorevole (`site/data/directory.json`).
  3. **Livello C (Presentazione):** l’interfaccia mostra le schede reali, i motivi fondati sui dati e i link alle schede. Una sola chiamata AI per richiesta, nessuna generazione discorsiva dei risultati.
- Le coordinate dell’utente non vengono mai inviate al server né al provider AI: la distanza è calcolata solo nel browser.

## Provider scelto: Google Gemini (`gemini-3.5-flash-lite`) su Free Tier ($0.00)
- Verificato sulla documentazione ufficiale Google AI (`ai.google.dev/gemini-api/docs/pricing`, `ai.google.dev/gemini-api/docs/billing`, `ai.google.dev/gemini-api/docs/rate-limits`, `ai.google.dev/gemini-api/docs/available-regions`, `ai.google.dev/api/generate-content`):
  - **Modello:** `gemini-3.5-flash-lite`, stato **Stable**, input 1.048.576 token, output 65.536 token.
  - **Costo sul Free Tier:** **Input: Free of charge ($0.00 / 1M token)**; **Output (inclusi thinking token): Free of charge ($0.00 / 1M token)**.
  - **Assenza di fatturazione:** il Free Tier **non richiede una carta di credito né un Cloud Billing Account collegato**. Finché al progetto Google Cloud / AI Studio non viene collegato un account di fatturazione, è tecnicamente impossibile generare addebiti: al raggiungimento dei limiti RPM/TPM/RPD del Free Tier, l’API risponde con `HTTP 429 RESOURCE_EXHAUSTED` e non effettua alcun upgrade automatico a pagamento.
  - **Disponibilità in Italia / SEE:** la documentazione ufficiale (`ai.google.dev/gemini-api/docs/billing` e `available-regions`) conferma che l’Italia è tra i paesi supportati e che il Free Tier di Gemini API è utilizzabile gratuitamente anche nello Spazio Economico Europeo (SEE/UE).
  - **Compatibilità tecnica con il Free Tier:**
    - Endpoint REST usato: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent` con header `x-goog-api-key`.
    - Campi REST su `generationConfig`: `responseMimeType: "application/json"` e `responseJsonSchema: schemaCriteri(dir)` con `additionalProperties: false` (supportati sul Free Tier).
    - **Nessuna funzionalità a pagamento usata:** il codice **non** usa Context Caching, **non** usa Batch API, **non** usa Grounding con Google Search o Google Maps.
  - **Nota sulla riservatezza dei dati nel Free Tier:** sul Free Tier Google dichiara `Used to improve our products: Yes`. Poiché `site/src/lib/orologiaio-api.ts` invia a Gemini **esclusivamente** il testo della ricerca (`messaggio`, max 500 caratteri) e le istruzioni di sistema pubbliche — senza mai inviare coordinate GPS, indirizzo IP (`cf-connecting-ip`) o dati personali — l’uso è limitato alle query testuali di ricerca.

## Confronto con l’alternativa Cloudflare Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`)
- È stata valutata l’alternativa Cloudflare Workers AI sul piano Workers Free (`developers.cloudflare.com/workers-ai/platform/pricing/`):
  - **Pro:** include **10.000 Neurons/giorno gratuiti** con blocco rigido a fine quota (nessun addebito sul piano Free).
  - **Contro decisivo per `@cf/qwen/qwen3-30b-a3b-fp8`:**
    1. Nella documentazione ufficiale di Cloudflare JSON Mode (`developers.cloudflare.com/workers-ai/features/json-mode/`), il modello `@cf/qwen/qwen3-30b-a3b-fp8` **non compare tra i modelli che supportano ufficialmente JSON Mode (`response_format: { type: "json_schema" }`)**, mentre `gemini-3.5-flash-lite` supporta nativamente `responseJsonSchema` con vincoli `enum` sul Free Tier.
    2. Al costo di `4.625 Neurons / 1M input token` e `30.475 Neurons / 1M output token`, ogni richiesta (~1.150 token di input + ~60 token di output, più eventuali token di ragionamento di Qwen3) consuma ~7–15 Neurons, limitando la franchigia gratuita di 10.000 Neurons/giorno e condividendola con l’intero account Cloudflare.
- **Decisione:** si mantiene **`gemini-3.5-flash-lite` sul Free Tier di Google AI Studio** senza modifiche al client, perché offre costo $0 garantito (senza billing collegato), supporto nativo verificato a `responseJsonSchema` e 0 modifiche distruttive al codice già testato.

## Comportamento al raggiungimento dei limiti della quota gratuita
- Le quote del Free Tier di Gemini (RPM = richieste/minuto, TPM = token/minuto, RPD = richieste/giorno, con reset a mezzanotte ora del Pacifico) sono applicate per progetto e consultabili nella pagina [AI Studio Rate Limits](https://aistudio.google.com/rate-limit).
- Quando un limite gratuito (RPM, TPM o RPD) viene raggiunto:
  1. Gemini restituisce `HTTP 429 RESOURCE_EXHAUSTED`.
  2. `geminiProvider` (`site/src/lib/gemini.ts`) solleva un errore interno (`provider HTTP 429`) senza includere né la chiave né il corpo del provider.
  3. `interpretaConProvider` (`site/src/lib/assistant.ts`) intercetta l’eccezione ed esegue immediatamente il parser deterministico locale (`interpretaRichiesta`).
  4. `handleOrologiaio` (`site/src/lib/orologiaio-api.ts`) restituisce `HTTP 200` con:
     - `modalita: "fallback"`,
     - `avviso: "Il modello AI non ha risposto in modo utilizzabile: interpretazione locale."`,
     - `criteri` validati estratti dalle regole locali.
  5. La pagina `/orologiaio/` mostra comunque i risultati reali del database e dichiara esplicitamente: *"Interpretazione locale (regole). I risultati arrivano dal database di Orologiai.it."* insieme all’avviso di fallback.

## Procedura di esecuzione locale con Wrangler (senza sporcare il lockfile)
Wrangler non è aggiunto a `package.json` per evitare di installare centinaia di MB di dipendenze nel repository statico. Per provare in locale l’intera applicazione (`dist/` + `functions/api/orologiaio.ts`) dentro il runtime Cloudflare Pages (`workerd`):

1. Compilare il sito statico (produce `dist/` con `dist/_routes.json`):
   ```bash
   npm run build
   ```
2. (Facoltativo) Per testare anche Gemini in locale con Wrangler, creare nella radice del progetto un file `.dev.vars` (già ignorato in `.gitignore`, **mai committare**):
   ```ini
   GEMINI_API_KEY=la_tua_chiave_free_tier
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

## Configurazione sicura a costo zero (senza attivare pagamenti)
> **Regola di sicurezza e costo zero:** non incollare mai `GEMINI_API_KEY` in chat, nelle issue, nelle pull request o in file tracciati da Git. **Non collegare alcuna carta di credito o Cloud Billing Account** al progetto Google AI Studio.

1. **Creazione della chiave su Google AI Studio (Free Tier, $0):**
   - Accedere a [Google AI Studio — API Keys](https://aistudio.google.com/apikey).
   - Creare la chiave in un **nuovo progetto privo di fatturazione** (nella colonna *Plan* / *Quota tier* di AI Studio deve comparire **Free** / *Set up billing*, e **non** *Paid* / *Tier 1*).
   - **Non cliccare su "Set up billing"** e non associare alcun metodo di pagamento in Google Cloud Console.
   - (Consigliato) In *Google Cloud Console → APIs & Services → Credentials*, aprire la chiave creata e in *API restrictions* limitarla alla sola **Generative Language API**.
2. **Prova reale in locale a costo zero** (senza committare nulla):
   ```bash
   GEMINI_API_KEY="la_tua_chiave_free_tier" npm run test:gemini:live
   ```
   Lo script invia 2 richieste (1 valida + 1 con chiave fittizia per testare il fallback) consumando meno di 1.500 token gratuiti, verifica che `modalita === 'ai'`, che la chiave non compaia mai nell’output, che i criteri rispettino lo schema Zod `.strict()` e che `cercaOrologiaio` restituisca solo attività reali del database. Senza chiave esce con codice `2` (`PROVA REALE BLOCCATA`).
3. **Configurazione su Cloudflare Pages (Piano Free, $0):**
   - **Progetto Pages (Free):** collegare il repository GitHub `superseller1960/orologiai.it` in *Workers & Pages → Create application → Pages* senza sottoscrivere piani a pagamento (il piano Free include build statici illimitati e fino a 100.000 invocazioni/giorno delle Pages Functions, usate qui solo per `/api/orologiaio`).
   - **Build settings:**
     - *Framework preset:* `Astro`
     - *Build command:* `npm run build`
     - *Build output directory:* `dist`
     - *Variabile ambiente di build:* `NODE_VERSION = 22.22.0` (o superiore).
   - **Secret lato server (`GEMINI_API_KEY`):**
     - Da Dashboard: *Workers & Pages → `<progetto>` → Settings → Variables and Secrets → Add* → tipo **Secret** (Encrypted), nome `GEMINI_API_KEY` (prima solo su *Preview* per il collaudo, poi su *Production*).
     - Oppure da CLI:
       ```bash
       npx --yes wrangler@latest pages secret put GEMINI_API_KEY --project-name <nome-progetto>
       ```
   - Dopo l’inserimento del Secret su Cloudflare Pages, avviare un nuovo deployment affinché la Pages Function riceva `env.GEMINI_API_KEY`.

## Rate limiting e protezione della quota gratuita
- **Nel codice applicativo (`site/src/lib/orologiaio-api.ts`):**
  - Solo `POST` (405 sugli altri metodi), controllo `Origin` same-origin (403), `Content-Type: application/json` (415), corpo massimo 1.024 byte (413), messaggio massimo 500 caratteri (413), schema stretto `{ messaggio }` (400), timeout di 8 s verso Gemini.
  - Rate limiter in memoria da 10 richieste/minuto per IP (`cf-connecting-ip`) con risposta `429` e `Retry-After: 60`.
- **Protezione di piattaforma gratuita (Cloudflare WAF Rate Limiting rule, piano Free $0/mese):**
  - Il piano **Free** di una zona Cloudflare (**$0/mese**) include **1 regola WAF di rate limiting** gratuita, con conteggio per **IP**, finestra fissa di **10 secondi** e azione **Block** per **10 secondi** (su dominio personalizzato con DNS proxied).
  - *Passi nella dashboard Cloudflare (zona del dominio, una volta collegato):*
    1. Aprire **Security → Security rules → Create rule → Rate limiting rules**.
    2. Nome regola: `Limite API Orologiaio`.
    3. **When incoming requests match:** Field `URI Path`, Operator `equals`, Value `/api/orologiaio` (`(http.request.uri.path eq "/api/orologiaio")`).
    4. **With the same characteristics:** `IP`.
    5. **When rate exceeds:** `Requests: 5`, `Period: 10 seconds`.
    6. **Then take action:** `Block` (`429 Too Many Requests`), `Duration: 10 seconds`.
    7. Selezionare **Deploy**.
