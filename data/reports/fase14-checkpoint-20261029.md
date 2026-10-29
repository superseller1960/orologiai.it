# Fase 14 — checkpoint parziale, 29 ottobre 2026

## Stato effettivo

- Produzione canonica Cloudflare: `80e4ce42-04fa-4e97-9199-3cf0cf21bc13`; 324 card nel documento di ricerca pubblico.
- Preview esistente del Lotto 5: `896480d0-cb00-4544-aac9-648cb076c6ce`; 338 card. Non è una preview Fase 14.
- Worktree: commit di base `9ce8908`, database 338 attività, 206 località, 819 fonti. Presenti 14 schede e modifiche non committate del Lotto 5; preservate, non considerate pubblicate in produzione. Confronto ID con il commit: nessuna delle 324 attività, 196 località e 790 fonti precedenti è assente.
- L'istruzione attuale interrompe l'espansione; non è stato promosso il Lotto 5. In particolare, la scheda Sergio Capone contiene qualifiche Rolex e Jaeger-LeCoultre attribuite attraverso indicizzazione di pagine che restituivano 403, e segnala il limite: la sufficienza della prova e la classificazione del ruolo vanno rivalutate prima di qualsiasi pubblicazione. Non considerare 403 né prova positiva né negativa.

## Audit e interventi

| Priorità | Area | Evidenza e impatto | Stato |
|---|---|---|---|
| P0 | Assistente | POST in produzione: HTTP 200, `modalita: non-configurato`. `functions/api/orologiaio.ts` non inoltra `GEMINI_API_KEY`: il kill-switch è intenzionale; né binding né variabile AI_PROVIDER risultano nella configurazione Pages consultata. Il messaggio viene interpretato da regole locali, non dall'AI. | Diagnosi effettuata; provider non attivato. Il piano Google e la privacy non sono verificati, dunque non si possono presumere zero costi o attivare il provider. |
| P0 | SEO | HTTPS apex e HTTP apex/www rispondono 301 a `https://www.orologiai.it/`; `www` risponde 200. Pages segnala apex pending, www active. Canonical pubblico, sitemap e robots indicano l'apex che redirige. | In locale `astro.config.mjs` imposta www, anche sitemap, robots e JSON-LD; aggiornati link mailto e controlli build. Nessun DNS modificato. Non ancora distribuito. |
| P1 | Homepage | Homepage pubblica: lunghi elenchi di servizi e regioni; altezza misurata 6.896 px desktop e 11.782 px mobile 390 (viewport 900, Chromium locale). | Modifica locale: quattro percorsi per esigenze, selezione storica con stato di verifica, link compatto ai territori senza rimuovere le pagine. Altezza locale 3.721 / 5.835 px a pari viewport; il dato è una misura di lunghezza, non una misura di velocità. Nessuna fotografia nuova. |
| P1 | Ricerca | Documento pubblico /cerca/: 308.943 byte e 324 card nel DOM. Il catalogo completo è precaricato malgrado 12 card visibili; nessun benchmark mobile/500/1000 eseguito. | Nessuna riscrittura; mantenere i deep link, il reset e i controlli Fase 12. I risultati per servizio restano una corrispondenza esatta, non una tassonomia raggruppata. |
| P1 | Filtri | Analizzati 20 ID servizio; fonte primaria significa che almeno un riferimento del claim è classificato sito/marchio ufficiale o titolare, non che la pagina sia stata ricontrollata oggi. | Distribuzione per regione, provincia, città e fonte nel file `fase14-servizi-20261029.json`, relativo ai 338 record locali, non soltanto alla produzione. Nessuna inferenza o attribuzione aggiunta. |
| P1 | Privacy/contatti | L'informativa pubblica contiene ancora marcatori DA VERIFICARE/DA COMPLETARE e richiede revisione legale; la pagina delle segnalazioni usa mailto verso acquistiscardi@gmail.com. | Non è stata accertata l'effettiva ricezione né l'intenzione d'uso della casella. Non attivare Gemini senza valutare condizioni, trasferimenti e informativa. |
| P2 | Schede e immagini | Le schede mostrano molte sezioni; non è stato svolto un arricchimento documentale sistematico né verificata una licenza fotografica. | Nessuna scheda arricchita, nessuna immagine integrata; riprogettazione e verifica licenze ancora aperte. |

## Verifiche

- `npm run verify` finale: check, build, 251 test automatici e due test UI DOM superati. `npm run package:pages`: 703 file, worker e routes inclusi; manifest `.runtime/pages-build-sha256.json`. Non vi è stata pubblicazione Fase 14.
- Chromium su preview Lotto 5: 19 scenari superati, tra cui città senza regione, Toscana → Milano, servizio, reset, deep link, cronologia, autocomplete, mappa e viewport 360/390/1440. Nessun telefono fisico è stato provato. Il primo tentativo ha avuto timeout di rete; il secondo ha completato la suite.
- Chromium locale: percorso homepage → Firenze + riparazione → sette risultati e focus sul titolo, viewport 390; catture prima/dopo desktop/mobile. Le catture a pagina intera molto lunga possono presentare artefatti del renderer: per valutazioni visive usare screenshot a viewport e verifiche interattive.
- La suite DOM e le prove Chromium non dimostrano una risposta generata da un provider reale. L'API posizione pubblica ha risposto 200; gli altri flussi API vanno ripetuti sulla preview Fase 14 prima del rilascio.

## Prima di continuare

1. Rivalutare documentazione e classificazione delle 14 schede non pubblicate, in particolare i ruoli Capone, senza perdere informazioni o modificare il catalogo senza fonte adeguata.
2. Completare audit percorsi, tassonomia unidirezionale, schede, fotografie con diritti, accessibilità e metriche, includendo le prove ancora richieste. Non affermare che siano conclusi.
3. Per l'AI, verificare piano Google e conformità privacy prima di qualsiasi prova o attivazione capace di generare costi; eseguire poi test reali se consentito.
4. Preparare preview Cloudflare dell'intero pacchetto solo mediante l'integrazione Cloudflare autorizzata; verificare tutte le pagine e funzioni e riconfermare il deployment canonico prima di qualsiasi promozione. Non rilasciare la homepage senza un collaudo visivo affidabile.
