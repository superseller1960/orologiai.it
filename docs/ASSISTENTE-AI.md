# Orologiaio: modello AI, endpoint e configurazione

> Nota di metodo: i prezzi, le quote e la disponibilità del modello citati in questa pagina risalgono alla verifica del **16/10/2026** e **non sono considerati validi in automatico**. Prima di attivare la chiave, rileggere le pagine ufficiali Google AI (`ai.google.dev/gemini-api/docs/pricing`, `/billing`, `/rate-limits`, `/available-regions`) e confermare che il modello `GEMINI_MODEL` sia ancora disponibile sul Free Tier. Il modello e i parametri **effettivamente configurati** sono solo quelli in `site/src/lib/gemini.ts` (vedi sotto).

## Stato
- **Implementato e distribuito su Vercel:** endpoint `POST /api/orologiaio` (Serverless Function `api/orologiaio.js`, bundle autosufficiente generato da `scripts/bundle-vercel-api.mjs` a partire da `site/src/api/orologiaio.ts`), client Gemini server-side (`site/src/lib/gemini.ts`), handler (`site/src/lib/orologiaio-api.ts`), fallback deterministico, interfaccia e test. Le entry Cloudflare Pages in `functions/api/` restano come percorso di compatibilità, non usato dal deploy Vercel (vedi [VERCEL.md](VERCEL.md)).
- **Vincolo economico:** configurazione esclusivamente a **costo zero** con il Free Tier di Google Gemini API (nessun account di fatturazione collegato) e piani gratuiti della piattaforma.
- **Verificato sulla preview Vercel (2026-10-21):** `POST /api/orologiaio` risponde 200 con `modalita: "non-configurato"` e fallback locale dichiarato, `400/403/405/413/415/429` gestiti, nessuna chiave esposta; 169 test automatici, test DOM della chat, build di 270 pagine.
- **Bloccato (richiede credenziali/account esterni):**
  - chiamata reale a Gemini (`GEMINI_API_KEY` non presente nell'ambiente Vercel né in locale);
  - inserimento della variabile `GEMINI_API_KEY` nel progetto Vercel.
- Finché `npm run test:gemini:live` non è stato eseguito con una chiave Free Tier reale, **l'assistente AI reale non è dichiarato attivo**: la chat resta in interpretazione locale dichiarata.

## Modello e parametri effettivamente configurati (`site/src/lib/gemini.ts`)
- **Modello:** `GEMINI_MODEL = 'gemini-3.5-flash-lite'` — endpoint `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, autenticazione con header `x-goog-api-key`.
- **`generationConfig`:** `temperature: 0`, `maxOutputTokens: 500`, `responseMimeType: 'application/json'`, `responseJsonSchema: schemaCriteri(dir)` con `additionalProperties: false` e `enum` derivati dal database.
- **Nessuna funzionalità opzionale usata:** no Context Caching, no Batch API, no Grounding.
- Il modello è un singolo punto di modifica: cambiare `GEMINI_MODEL` aggiorna anche l'endpoint.

## Condizioni del servizio e privacy (verificate il 22/10/2026 sulle fonti ufficiali)
- Fonte: [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms) (versione "Effective March 23, 2026"), [pagina prezzi Gemini API](https://ai.google.dev/gemini-api/docs/pricing), [Google Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum).
- **Servizi gratuiti (Unpaid Services):** Google dichiara di usare input e output per migliorare e sviluppare i propri prodotti e le proprie tecnologie ML, e che revisori umani possono leggere, annotare e elaborare input e output (dati scollegati da account, chiave API e progetto Cloud prima della revisione). Le condizioni sconsigliano di inviare informazioni sensibili, riservate o personali.
- **Servizi a pagamento:** i prompt e le risposte non sono usati per migliorare i prodotti; restano log limitati per sicurezza e obblighi di legge, con DPA come data processor. Un progetto è "a pagamento" solo se associato a un account di fatturazione attivo.
- **Clausola EEA/Svizzera/Regno Unito:** le condizioni d'uso dei dati dei servizi a pagamento si applicano a tutti i servizi (inclusa la quota gratuita), e le condizioni prevedono che per client API messi a disposizione di utenti in EEA/Svizzera/UK si usino **solo** servizi a pagamento. Per un progetto con utenti pubblici italiani questa clausola va valutata con attenzione: potrebbe richiedere un piano diverso da quello gratuito (mai attivare piani a pagamento senza autorizzazione esplicita).
- **Stato attuale del progetto:** nessuna chiave configurata, nessun messaggio inviato a Google, interpretazione locale attiva. Le pagine `privacy` e `cookie-policy` descrivono questo stato; l'eventuale attivazione richiede prima l'aggiornamento della documentazione privacy e la verifica delle condizioni applicabili.

## Architettura
- Il sito è statico (`output: 'static'`); solo `/api/orologiaio` e `/api/posizione` invocano le funzioni (`api/*.js` su Vercel).
- Flusso a 3 livelli:
  1. **Livello A (Interpretazione):** il browser invia `POST /api/orologiaio` con `{ "messaggio": "..." }` e, se presenti, i criteri dei turni precedenti. Il server chiama Gemini, valida l'output con `criteriSchema` (Zod `.strict()`) e scarta qualsiasi località o marca non presente nel database.
  2. **Livello B (Ricerca deterministica):** il browser applica i criteri a `searchDirectory` (`site/src/lib/search.ts`) sul dataset autorevole (`site/data/directory.json`).
  3. **Livello C (Presentazione):** l'interfaccia mostra le schede reali, i motivi fondati sui dati e i link alle schede. Una sola chiamata AI per richiesta, nessuna generazione discorsiva dei risultati.
- Le coordinate dell'utente non vengono mai inviate al server né al provider AI: la distanza è calcolata solo nel browser.

## Comportamento senza chiave e al raggiungimento dei limiti
- **Senza `GEMINI_API_KEY`:** `handleOrologiaio` risponde `HTTP 200` con `modalita: "non-configurato"` e l'avviso «Il modello AI non è configurato su questo ambiente: interpretazione locale.»
- **Quando un limite gratuito (RPM/TPM/RPD) viene raggiunto** o il provider non risponde in modo utilizzabile entro il timeout (8 s):
  1. Gemini restituisce un errore (es. `HTTP 429`); `geminiProvider` solleva un errore interno (`provider HTTP …`) senza includere né la chiave né il corpo del provider.
  2. `interpretaConProvider` (`site/src/lib/assistant.ts`) esegue il parser deterministico locale (`interpretaRichiesta`).
  3. `handleOrologiaio` restituisce `HTTP 200` con `modalita: "fallback"`, l'avviso dichiarato e i criteri validati estratti dalle regole locali.
  4. La pagina `/orologiaio/` mostra comunque i risultati reali del database e dichiara la modalità.
- Le cifre delle quote del Free Tier (RPM/TPM/RPD) non sono riportate qui: consultare la pagina ufficiale al momento della configurazione.

## Procedura di collaudo locale
1. Compilare il sito: `npm run build` (produce `dist/` e i bundle `api/*.js`).
2. Per provare la Function come su Vercel, servire `dist/` con un server statico e le route `api/` (es. `npx --yes serve` o un qualunque server che instradi `/api/*` sui file `api/*.js`); in alternativa usare `npm run test:gemini:live` (vedi sotto).
3. Per il percorso di compatibilità Cloudflare Pages: `npx --yes wrangler@latest pages dev dist --port 8788` (Wrangler non è nel progetto per non appesantire il lockfile). La Function risponde `modalita: "non-configurato"` senza `.dev.vars` con `GEMINI_API_KEY`.
4. Verifica manuale:
   ```bash
   curl -i -X POST http://localhost:8788/api/orologiaio \
     -H 'Content-Type: application/json' \
     -H 'Origin: http://localhost:8788' \
     -d '{"messaggio":"Cerco un orologiaio a Firenze per revisionare un automatico"}'
   ```

## Configurazione della chiave (costo zero, senza attivare pagamenti)
> **Regola di sicurezza e costo zero:** non incollare mai `GEMINI_API_KEY` in chat, nelle issue, nelle pull request o in file tracciati da Git. **Non collegare alcuna carta di credito o Cloud Billing Account** al progetto Google AI Studio.

1. **Creazione della chiave su Google AI Studio (Free Tier):**
   - Accedere a [Google AI Studio — API Keys](https://aistudio.google.com/apikey).
   - Creare la chiave in un **nuovo progetto privo di fatturazione** (in AI Studio deve comparire il piano **Free**, non *Paid*/*Tier 1*).
   - **Non cliccare su "Set up billing"** e non associare alcun metodo di pagamento.
   - (Consigliato) In *Google Cloud Console → APIs & Services → Credentials*, limitare la chiave alla sola **Generative Language API**.
2. **Prova reale a costo zero** (senza committare nulla):
   ```bash
   GEMINI_API_KEY="la_tua_chiave_free_tier" npm run test:gemini:live
   ```
   Lo script invia 2 richieste (1 valida + 1 con chiave fittizia per testare il fallback), verifica che `modalita === 'ai'`, che la chiave non compaia mai nell'output, che i criteri rispettino lo schema Zod `.strict()` e che la ricerca restituisca solo attività reali del database. Senza chiave esce con codice 2 (`PROVA REALE BLOCCATA`).
3. **Configurazione su Vercel:**
   - Pannello Vercel → progetto → *Settings → Environment Variables*: aggiungere `GEMINI_API_KEY` come variabile **solo per l'ambiente Preview** (mai nel repository).
   - Rideployare la preview perché la funzione riceva la variabile.
   - Dopo la verifica reale sulla preview, replicare su Production **solo** al momento del lancio.
   - Il piano Vercel in uso va verificato nel pannello: questa documentazione non dà per valide quote o piani specifici.

## Rate limiting e protezione della quota
- **Nel codice applicativo (`site/src/lib/orologiaio-api.ts`):**
  - Solo `POST` (405 sugli altri metodi con header `Allow`), controllo `Origin` same-origin (403), `Content-Type: application/json` (415), corpo massimo **4.096 byte** (413), messaggio massimo 500 caratteri (413), schema stretto `{ messaggio, contesto? }` (400), timeout di 8 s verso Gemini.
  - Rate limiter in memoria da 10 richieste/minuto per IP con risposta `429` e `Retry-After: 60`. L'IP del client su Vercel è ricavato solo da `x-vercel-forwarded-for`/`x-real-ip` quando è presente `x-vercel-id`; fuori da Vercel da `cf-connecting-ip`. `x-forwarded-for` non è usato perché forgiabile.
- **Protezione di piattaforma:** il limitatore in memoria è best-effort per istanza. Una regola di rate limiting sul percorso `/api/orologiaio` va configurata a livello di piattaforma (Vercel Firewall/WAF o, sul percorso di compatibilità Cloudflare, una WAF Rate Limiting rule): la disponibilità e i parametri dipendono dal piano effettivamente attivo e vanno verificati nel pannello.
