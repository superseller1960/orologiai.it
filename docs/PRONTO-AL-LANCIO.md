# Pronto al lancio — Orologiai.it

Aggiornato al 22 ottobre 2026, branch `prelancio-orologiai-20261022` (da `collaudo-preview-20261021` / `12d83f1`).
Documento operativo: per ogni voce sono indicati il file coinvolto e l'azione necessaria. Non sostituisce una revisione legale professionale.

## A. Problemi tecnici ancora aperti

| # | Problema | File / luogo | Azione necessaria |
| --- | --- | --- | --- |
| A1 | `GEMINI_API_KEY` non configurata: verificato sul progetto Vercel (0 variabili d'ambiente). L'assistente funziona in interpretazione locale dichiarata. | `site/src/lib/gemini.ts`, `site/src/lib/orologiaio-api.ts` | Creare una chiave Free Tier su Google AI Studio e impostarla in Vercel (Preview prima, Production al lancio), poi eseguire `npm run test:gemini:live` e un test reale sulla preview |
| A2 | Rate limit dell'API assistente solo in memoria per istanza (10 req/min/IP): non è una protezione globale. | `site/src/lib/orologiaio-api.ts` | Configurare una regola di rate limiting su `/api/orologiaio` a livello di piattaforma (Vercel Firewall/WAF) |
| A3 | Deployment automatici Git disattivati nel progetto Vercel (`createDeployments: disabled`): ogni preview va triggerata manualmente. | Pannello Vercel → progetto `orologiai.it` → Git | Decidere se riattivare i deploy automatici al momento del lancio |
| A4 | Sul progetto Vercel esiste un deployment di Production con il vecchio mirror statico (`main` = `56e34a0`). Non serve finché il dominio punta al WordPress. | Pannello Vercel → Production | Al lancio: promuovere il build nuovo (branch candidata), **mai** prima dell'approvazione |
| A5 | Verifica su dispositivo fisico non eseguita: le larghezze 320/375/390/768/1440 sono simulate in Chromium. | — | Ultimo passaggio su smartphone reale prima del lancio |

## B. Informazioni del proprietario

Fornite il 22/10/2026 e inserite nelle pagine: **Orologeria Oreficeria Scardi**, P. IVA 05904700480, REA FI-590494, indirizzo commerciale Via Gabriele D'Annunzio 8/A, 50135 Firenze, contatto `acquistiscardi@gmail.com` (fonte: scardi.it). Michele Scardi gestisce operativamente il portale (senza attribuzione del ruolo di rappresentante legale).

Restano da completare:

| # | Informazione | File / sezione | Stato |
| --- | --- | --- | --- |
| B1 | Denominazione giuridica esatta dell'impresa e sede legale da visura camerale (possono differire dal nome commerciale). Lead NON verificato da directory di terzi: “SCARDI DI BARTOLOZZI MARCO” — da confermare solo con visura | `site/src/pages/privacy.astro` §1, `note-legali.astro` §1 | `[DA VERIFICARE]` |
| B2 | Tempi di conservazione dei log hosting e della corrispondenza email | `site/src/pages/privacy.astro` §7 | `[DA FORNIRE]` |
| B3 | Licenza dei testi e degli elementi originali (es. Creative Commons o riserva dei diritti) | `site/src/pages/note-legali.astro` §7 | `[DA FORNIRE]` |

## C. Verifiche legali da completare

| # | Verifica | File / sezione | Segnaposto |
| --- | --- | --- | --- |
| C1 | Condizioni Gemini verificate il 22/10/2026 ([Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)): sui servizi gratuiti Google può usare input/output per migliorare i prodotti, anche con revisione umana; clausola EEA: per client API destinati a utenti dell'UE le condizioni richiedono servizi a pagamento. Da valutare con un professionista prima di abilitare Gemini al pubblico | `site/src/pages/privacy.astro` §3.6, `docs/ASSISTENTE-AI.md` | `[DA VERIFICARE]` |
| C2 | Test di bilanciamento del legittimo interesse (LIA) per la pubblicazione dei dati delle attività | `site/src/pages/privacy.astro` §5 | `[DA COMPLETARE]` |
| C3 | Base giuridica definitiva dell'assistente AI (consenso o misure precontrattuali) | `site/src/pages/privacy.astro` §5 | `[DA COMPLETARE]` |
| C4 | Valutare la notifica diretta ai titolari già censiti (art. 14 GDPR) all'apertura al pubblico | `site/src/pages/privacy.astro` §6 | `[DA COMPLETARE]` |
| C5 | Trasferimenti extra-UE (hosting, Gemini): individuare e citare le garanzie (artt. 44 ss. GDPR) | `site/src/pages/privacy.astro` §8 | `[DA VERIFICARE]` |
| C6 | Elenco effettivo dei cookie tecnici dell'hosting definitivo e relativa informativa del provider | `site/src/pages/cookie-policy.astro` §2 | `[DA VERIFICARE]` |
| C7 | Contatto email: sostituito `info@orologiai.it` (non verificato) con `acquistiscardi@gmail.com` in tutte le pagine istituzionali e nei link di segnalazione | `privacy.astro`, `note-legali.astro`, `partecipa.astro`, `orologeria/[slug].astro` | **Risolto** il 22/10/2026 |
| C8 | Conformità complessiva alla normativa: revisione di un professionista prima della pubblicazione | `site/src/pages/note-legali.astro` §9 | Da pianificare |

## D. Configurazioni necessarie al lancio

1. **Hosting di produzione:** **Cloudflare Pages Free** (scelta fatta il 22/10/2026: il piano Hobby di Vercel è riservato all'uso personale non commerciale, mentre il sito è gestito da un'impresa). Vercel resta come ambiente di preview. Tutto il necessario è pronto nella build: `functions/api/*` (Pages Functions), `_routes.json`, `_redirects` (8 redirect 301 equivalenti a `vercel.json`), collaudati in locale con `wrangler pages dev`. **Manca solo la creazione del progetto Cloudflare Pages e il deploy** (richiede l'account Cloudflare del titolare — vedi report). Nessun costo: piano Free.
2. **Dominio:** DNS attuali documentati in [docs/DNS-OROLOGIAI.md](DNS-OROLOGIAI.md) (Register.it, MX su `mail.register.it`, nessun SPF/DKIM/DMARC). Il passaggio richiede il cambio dei nameserver (serve il pannello Register.it) con la configurazione equivalente e la procedura di rollback già predisposte. **La posta non deve subire interruzioni**; `scardi.it` e l'hosting WordPress non vengono toccati.
3. **Email:** verificare la ricezione di `info@orologiai.it` o attivare l'indirizzo definitivo (C7).
4. **Google Search Console:** il dominio resta `orologiai.it`, quindi la proprietà esistente **si conserva** e lo strumento "Cambio di indirizzo" **non si usa**. Piano: verificare la nuova sitemap nella proprietà esistente, redirect 301 per gli URL modificati, controllo dei canonical, verifica dell'indicizzazione, monitoraggio dei 404, controllo degli URL spam precedentemente indicizzati. Mapping URL completo in [docs/MIGRAZIONE-WORDPRESS.md](MIGRAZIONE-WORDPRESS.md).
5. **Assistente:** dopo A1, rieseguire il collaudo reale dei 5 esempi d'uso e verificare che la modalità sia dichiarata correttamente.

## E. Scelte per l'assistente al lancio

Due opzioni mutualmente esclusive; la scelta va fatta esplicitamente prima del lancio.

### Opzione A — Lancio con assistente locale (senza Gemini)
- L'assistente interpreta le richieste in locale sul server con regole deterministiche; **nessun messaggio viene inviato a Google**.
- Già implementata e verificata: è lo stato attuale del sito, dichiarato all'utente nell'interfaccia.
- Nessuna chiave da configurare, nessun rapporto contrattuale con Google da verificare, nessun impatto sulla privacy oltre i log tecnici già descritti.
- Le pagine `privacy` e `cookie-policy` descrivono correttamente questo stato: **non richiedono modifiche per il lancio**.

### Opzione B — Lancio con Gemini (solo dopo verifiche e autorizzazione)
Prerequisiti, in ordine:
1. Verifica delle condizioni Gemini Developer API applicabili (C1), inclusa la clausola EEA che per client API destinati a utenti UE prevede servizi a pagamento: **potrebbe richiedere un piano diverso da quello gratuito**, da attivare solo con autorizzazione esplicita (mai automaticamente).
2. Valutazione con un professionista della base giuridica della trasmissione del testo a Google e delle conseguenze del trattamento descritto nelle condizioni (uso per miglioramento prodotti e revisione umana sui servizi gratuiti).
3. Aggiornamento di `privacy.astro` §3.6 e `cookie-policy.astro` §4.3 con le condizioni effettive e la base giuridica individuata.
4. Configurazione della chiave in Vercel e test reale (`npm run test:gemini:live` + collaudo sulla preview).
5. Verifica che il fallback locale resti disponibile e dichiarato in caso di errore o quota esaurita.
- Fino a quando tutti i punti non sono completati, resta valida l'**opzione A**.

## F. Controlli già superati (2026-10-22)

- `npm run verify`: **exit 0** — `astro check` + `tsc` puliti, **169/169 test**, build **270 pagine**, test DOM della ricerca e della chat.
- Dataset invariato: **103 attività, 58 località, 20 regioni, 168 fonti**.
- SEO on-page: 270 pagine con title, meta description e canonical unici (gli alias `/firenze/` e `/milano/` puntano con canonical alle pagine comune); `noindex` su `/blog/`, `/rolex/`, `/cerca/`, `/404`; sitemap **264 URL**, nessuna pagina noindex inclusa; `robots.txt` corretto.
- Navigazione nazionale: `/orologerie/` con 20 link regionali, 20 di servizio, 58 comuni; percorsi Homepage → Regione → Comune → Scheda, → Servizio → Risultati e → Assistente → Scheda verificati.
- Mobile: nessun overflow orizzontale a 320/375/390/768/1440 px; tutti i target di navigazione standalone ≥ 24 px (WCAG 2.5.8); restano sotto soglia solo link in linea dentro frasi, esenti secondo WCAG 2.5.8.
- Mappa: pin visibili (correzione del collaudo precedente confermata), attribuzione OSM presente.
- Assistente: senza chiave risponde `non-configurato` con interpretazione locale dichiarata; nessuna credenziale in codice o nel client.
- Cookie: nessun `Set-Cookie`, nessun `localStorage`/`sessionStorage` — coerente con la cookie policy.
- Migrazione: redirect certi implementati in `vercel.json` (8 voci), nessun redirect generico, mirror WordPress **non** pubblicato (`publicDir: ./site/assets`), nessun link esterno sospetto nei contenuti legacy pubblicati.
- Pagine legali: segnaposto **mantenuti visibili** e censiti qui sopra; nessun dato personale presunto inserito.
- Hosting gratuito: build collaudata sul runtime Cloudflare (`wrangler pages dev` / workerd) il 22/10/2026: pagine 200 (270 documenti), 8 redirect `_redirects` 301 veri, `_routes.json` con entrambe le API, `/api/posizione` e `/api/orologiaio` funzionanti (fallback locale, 405/403/415 corretti), mappa con pin (icone inlinate come data URI, nessun asset esterno), 0 errori console. Compatibilità CPU: rimosso il parse Zod a runtime dalle entry delle function (~38 ms misurati, oltre il limite di 10 ms/invocazione del piano gratuito): il dataset resta validato a build da `scripts/validate.ts`.
