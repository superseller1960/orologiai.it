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

## B. Informazioni del proprietario indispensabili

Tutte da fornire dal titolare: **non vanno inventate né dedotte**.

| # | Informazione | File / sezione | Segnaposto |
| --- | --- | --- | --- |
| B1 | Denominazione o nome del titolare del trattamento, sede | `site/src/pages/privacy.astro` §1 | `[DA FORNIRE]` |
| B2 | Canale privacy ufficiale (PEC o indirizzo dedicato) da sostituire a `info@orologiai.it` | `site/src/pages/privacy.astro` §10 | `[DA FORNIRE]` |
| B3 | Tempi di conservazione dei log hosting e della corrispondenza email | `site/src/pages/privacy.astro` §7 | `[DA FORNIRE]` |
| B4 | Dati identificativi del gestore del progetto (denominazione, sede, contatto) | `site/src/pages/note-legali.astro` apertura | `[DA FORNIRE]` |
| B5 | Licenza dei testi e degli elementi originali (es. Creative Commons o riserva dei diritti) | `site/src/pages/note-legali.astro` §7 | `[DA FORNIRE]` |

## C. Verifiche legali da completare

| # | Verifica | File / sezione | Segnaposto |
| --- | --- | --- | --- |
| C1 | Documenti contrattuali Google Gemini (informativa e condizioni di trattamento) da leggere e collegare; base giuridica della trasmissione del testo al fornitore | `site/src/pages/privacy.astro` §3.6 | `[DA VERIFICARE]` |
| C2 | Test di bilanciamento del legittimo interesse (LIA) per la pubblicazione dei dati delle attività | `site/src/pages/privacy.astro` §5 | `[DA COMPLETARE]` |
| C3 | Base giuridica definitiva dell'assistente AI (consenso o misure precontrattuali) | `site/src/pages/privacy.astro` §5 | `[DA COMPLETARE]` |
| C4 | Valutare la notifica diretta ai titolari già censiti (art. 14 GDPR) all'apertura al pubblico | `site/src/pages/privacy.astro` §6 | `[DA COMPLETARE]` |
| C5 | Trasferimenti extra-UE (hosting, Gemini): individuare e citare le garanzie (artt. 44 ss. GDPR) | `site/src/pages/privacy.astro` §8 | `[DA VERIFICARE]` |
| C6 | Elenco effettivo dei cookie tecnici dell'hosting definitivo e relativa informativa del provider | `site/src/pages/cookie-policy.astro` §2 | `[DA VERIFICARE]` |
| C7 | Ricezione di `info@orologiai.it` non verificata (indirizzo ripreso dal sito storico) | `site/src/pages/partecipa.astro`, `privacy.astro`, `note-legali.astro` | Confermare la casella o sostituire l'indirizzo in tutti e tre i file |
| C8 | Conformità complessiva alla normativa: revisione di un professionista prima della pubblicazione | `site/src/pages/note-legali.astro` §9 | Da pianificare |

## D. Configurazioni necessarie al lancio

1. **Vercel:** impostare `GEMINI_API_KEY` (se si vuole l'AI reale) — vedi A1; decidere sui deploy automatici (A3).
2. **Dominio:** associare `orologiai.it` al progetto Vercel e aggiornare i DNS — operazione da pannello, **non** da questo repository; il vecchio WordPress resta online fino al passaggio.
3. **Email:** verificare la ricezione di `info@orologiai.it` o attivare l'indirizzo definitivo (C7).
4. **Google Search Console:** aggiungere la proprietà, inviare `/sitemap.xml`, avviare il "Cambio di indirizzo" dopo il passaggio. Mapping URL e regole per spam/404 in [docs/MIGRAZIONE-WORDPRESS.md](MIGRAZIONE-WORDPRESS.md).
5. **Assistente:** dopo A1, rieseguire il collaudo reale dei 5 esempi d'uso e verificare che la modalità sia dichiarata correttamente.

## E. Controlli già superati (2026-10-22)

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
