# Orologiaio: modello AI, endpoint e configurazione

## Stato
- **Implementato:** endpoint `POST /api/orologiaio` (Pages Function), client Gemini server-side, validazione, fallback, interfaccia, test.
- **Non verificato:** una chiamata reale a Gemini. Non ho una chiave e non ho collegato un account. Finché la chiamata non è stata eseguita con `GEMINI_API_KEY` reale, l'AI reale non è dichiarata attiva.
- **Non verificato:** deploy su Cloudflare Pages, esecuzione locale con `wrangler pages dev`, regole di rate limiting della piattaforma.

## Architettura
- Il sito resta statico (`output: 'static'`). Solo `/api/orologiaio` esegue codice: è `functions/api/orologiaio.ts`, che chiama `site/src/lib/orologiaio-api.ts`.
- Flusso: il browser invia solo il testo (`{ "messaggio": "..." }`). Il server chiama Gemini, valida la risposta con Zod e restituisce solo criteri e modalità. Il browser esegue la ricerca con il motore esistente (`searchDirectory`).
- Le coordinate dell'utente non passano mai dal server: la distanza è calcolata nel browser.
- Se l'endpoint non è raggiungibile (per esempio con `npm run dev`, che non esegue Functions), l'interfaccia usa le regole locali e lo dichiara.

## Provider scelto: Google Gemini, modello `gemini-3.5-flash-lite`
- Verificato sulla documentazione ufficiale il 16/10/2026:
  - Model page: `gemini-3.5-flash-lite`, stato **Stable**, output strutturato supportato.
  - Pricing: Standard, free tier gratuito; paid **$0,30 per 1M token di input** e **$2,50 per 1M di output**.
  - Endpoint REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`, header `x-goog-api-key`.
- Scelta: il modello più economico tra quelli adatti a richieste brevi e JSON strutturato.
- Campo schema: la guida REST usa `generationConfig.responseFormat.text` con `mimeType` e `schema`. Altre pagine della documentazione indicano nomi diversi (`responseMimeType`, `responseJsonSchema`). Va confermato con una chiamata reale prima della messa in produzione.
- Nessun grounding, nessuna ricerca web: i dati vengono solo dal database.

## Configurazione
1. **Chiave:** crearne una in Google AI Studio. Non committarla e non incollarla in chat.
2. **Piattaforma (Cloudflare Pages):** Settings → Variables and Secrets → aggiungere `GEMINI_API_KEY` come valore cifrato (Encrypt). Non usare variabili in chiaro.
3. **Build:** comando `npm run build`, cartella di output `dist`. `functions/` viene rilevata automaticamente.
4. **Locale:** copiare `.dev.vars.example` in `.dev.vars` e inserire la chiave. Il file è ignorato da git.
5. **Google Cloud:** limitare la chiave alla sola Generative Language API e impostare un avviso di budget.

## Piano tariffario e dati
- **Free tier:** gratuito, ma Google indica che i contenuti possono essere usati per migliorare i suoi prodotti. Per un sito pubblico con messaggi di utenti, non è adatto.
- **Paid tier:** richiede un account di fatturazione (attivazione da fare a cura del titolare, non automatica). Google indica che i contenuti non vengono usati per migliorare i prodotti.
- **Contributor tier:** non va usato, perché prevede l'uso dei dati per il miglioramento dei modelli.

## Costi stimati (da verificare con i token reali)
- Per richiesta: circa 1.200 token di input (istruzioni, schema, elenco di comuni e marche, messaggio) e circa 50 di output.
- Costo stimato: circa 0,0004 $ input + 0,0001 $ output ≈ **0,0005 $ per richiesta** (circa 2.000 richieste per dollaro). Stima non misurata.
- Nessuna spesa attivata da questo incremento.

## Protezioni
- Solo `POST` (altri metodi: 405). Origine diversa dal sito: 403. Content-Type non JSON: 415.
- Corpo massimo 1 KB, messaggio massimo 500 caratteri. Campi extra: 400.
- Timeout di 8 secondi verso Gemini; in caso di errore, timeout o risposta non valida: fallback locale dichiarato.
- Limite best-effort di 10 richieste al minuto per IP (`cf-connecting-ip`), **in memoria, per istanza**. Non è una protezione affidabile: va aggiunta una regola di rate limiting della piattaforma (dashboard Cloudflare, verificare piano e disponibilità per Pages prima di attivarla).
- Output del modello validato con Zod (schema stretto); località e marche inventate vengono scartate; il modello non può eseguire query né scrivere dati.
- Errori restituiti senza dettagli del provider, senza chiavi, senza stack trace.
- Nessuna conversazione salvata; il messaggio viene inoltrato al solo provider.

## Modalità mostrate all'utente
- **Modello Gemini:** solo se la risposta è stata ricevuta e validata dal provider.
- **Interpretazione locale (non configurato):** la chiave manca su questo ambiente.
- **Interpretazione locale (fallback):** errore, timeout, risposta non valida o endpoint non raggiungibile.

## Test
- `tests/orologiaio-api.test.ts` (15 test): metodi, origine, tipo di contenuto, input vuoto e troppo lungo, JSON malformato, chiave mancante, risposta valida, provider riceve solo il messaggio, JSON malformato del modello, campi sconosciuti, località e marche inventate, HTTP 429/errore, timeout, errore di rete, rate limit, `no-store`, nessuna chiave negli errori, database invariato.
- Il provider reale **non** è testato: i test usano un `fetch` simulato. Non dichiarare il provider verificato su questa base.

## Passi che richiedono accesso esterno
- Creare la chiave Gemini e impostarla come secret su Cloudflare Pages.
- Attivare la fatturazione (paid tier) e impostare il budget.
- Collegare il repository a Pages e verificare che `functions/` venga deployata.
- Eseguire una chiamata reale e registrare il risultato nel rapporto.
- Configurare la regola di rate limiting della piattaforma.
