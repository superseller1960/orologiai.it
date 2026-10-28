# Orologiai.it — Fase 12: ricerca compatta e risultati immediati

Data: 28 ottobre 2026. Stato: pubblicato e collaudato sul dominio ufficiale.

## Baseline e protezione dei dati

Il brief indicava 279 attività e produzione e443b24e, ma lo stato effettivo era successivo: **306 attività, 182 località, 752 fonti**, commit 3aa4e11 e produzione **42e926e3-93b8-4935-88a7-c57e3a10a7cf**. Conservati i lotti 2–3, senza tornare alla versione da 279 attività.

Database prima/dopo identico byte per byte: `e8a055694f46824a156fdd0423e1e640b5a1543dcf03ab7663c23b900dd88bc2`.

Nessuna modifica a catalogo, fonti, autorizzazioni, coordinate, animazioni Patek/Blender/GLB/Three.js/video/scrolltelling, DNS, email o altri progetti. Nessun accesso GitHub, fetch/pull/push o nuovo servizio a pagamento.

Il manifest del Lotto 3 è stato confrontato con la build: **630 file identici**, compresi tutte le schede attività, sitemap e redirect. Cambiano homepage e ricerca; altre 5 pagine cambiano solo riferimenti ai bundle condivisi rigenerati (Firenze/Milano, pagine territoriali e assistente). Hash live di homepage, ricerca, scheda Scardi e sitemap della baseline corrispondenti al manifest storico. Worker e file riservati Pages non sono scaricabili come asset pubblici: nessuna pretesa di confronto live integrale del Worker precedente; sono inclusi e collaudati nel nuovo pacchetto.

## Problemi riprodotti prima della modifica

Audit in Chromium headless reale, non solo JSDOM, a 1440×900, 390×844 e 360×844. Esaminate homepage e /cerca/, menu, form principale, filtri, pulsanti e mappa. L'header non contiene un secondo modulo: ha link di navigazione.

### 1. «Mostra risultati» aggiorna il DOM ma non porta ai risultati

Riproduzione: aprire /cerca/, compilare Firenze, cliccare Mostra risultati. Risultato effettivo: il submit funziona, trova 11 attività, aggiorna conteggio ed elenco; nessun errore JavaScript, nessun hidden residuo sulle 11 card. Tuttavia il focus rimane sul pulsante e i risultati sono molto sotto il viewport, dopo copertura, valutazioni, assistente e, su mobile, mappa.

Causa: handler submit in `site/src/scripts/search-ui.ts` chiamava solo update/prefill senza scroll o focus risultati; struttura di `site/src/pages/cerca.astro` collocava vari blocchi prima dell'elenco; CSS mobile metteva la mappa sopra le card (`grid-row:1`).

Correzione: elenco subito dopo form/filtri attivi, mappa e guida facoltative dopo i risultati. Dopo il DOM aggiornato, requestAnimationFrame → focus sul titolo con preventScroll → scroll calcolato con offset dell'eventuale header sticky/fixed.

### 2. Toscana → Milano cancella Milano e lascia risultati toscani

Riproduzione: selezionare Toscana, poi scrivere Milano e inviare. Prima: comune cancellato, URL rimasto `?regione=toscana`, 49 risultati toscani. Non è un problema del produttore di dati o di rete.

Causa: `syncRegione()` in search-ui.ts cancellava cityInput quando il comune apparteneva a un'altra regione; searchDirectory applicava cumulativamente comune/regione/provincia.

Correzione: il comune identificato prevale nel motore condiviso; controller elimina esplicitamente regione/provincia incompatibili senza cancellare Milano, e URL salva localita=milano. Provincia/regione sono già note dal record della località.

### 3. Pagina lunga e poco chiara

Causa aggiuntiva: `.search` globale definiva tre colonne, mentre `.search-flow` non sovrascriveva grid-template-columns: layout desktop dei tre passi dispersivo; su mobile grande introduzione, servizi rapidi, regione in primo piano, pannelli promozionali e assistente obbligatori prima dei risultati. Tutte le attività erano mostrate contemporaneamente.

Correzione: due soli campi principali condivisi fra homepage e ricerca, Altri filtri chiuso; 12 risultati con Mostra altri; card senza descrizione lunga, servizio scelto prioritario, tipologia, autorizzazioni già documentate, Chiama e scheda. Nessun nuovo badge inventato.

### 4. Cronologia e mappa

Prima: replaceState a ogni input, popstate con reload; mappa subito inizializzata. Ora: digitazione aggiorna risultati di anteprima senza distruggere l'URL dell'ultima ricerca inviata; submit e rimozione filtri salvano stato navigabile, ripristino con Indietro e reload, quantità mostrata persistita. Mappa inizializzata solo all'apertura. Durante il collaudo locale rilevato e corretto anche un 404 delle icone Leaflet causato da doppio prefisso del percorso: icona esplicita, senza soppressioni di errori.

## Nuova interfaccia

- Dove cerchi? città/comune con autocomplete di località reali; confronto normalizzato per maiuscole, accenti e apostrofi.
- Che servizio cerchi? facoltativo, tassonomia del catalogo, nessun servizio implicito.
- Mostra risultati, Invio e Azzera.
- Altri filtri chiuso: regione, provincia, marchio, ruolo, tipologia, specializzazione, attendibilità e richiesta libera.
- Chip rimovibili e indicatore filtri avanzati attivi.
- Suggerimenti accessibili: combobox/listbox, frecce, Invio, Escape, provincia/regione. Omonimi non risolti silenziosamente.
- Località non censita: messaggio trasparente e zero corrispondenze; non viene sostituita con un'altra città.
- Nessuna città: ricerca generale in tutta Italia o nel territorio avanzato esplicitamente selezionato.
- Nessun risultato: città/servizio dichiarati, rimozione servizio/chip, link ad altre località separato.
- Guida e assistente conservati in sezione secondaria richiudibile; linguaggio naturale nei deep link ancora supportato.
- Nessun GPS o rilevamento automatico della zona nella ricerca.
- Senza JS: avviso esplicito che l'elenco non è filtrato e link HTML a pagine territoriali/servizio. Non è stato introdotto un motore server nuovo.

## Misure reali prima/dopo

Riferimento: ricerca Firenze, stesse dimensioni viewport, coordinata Y dall'inizio del documento della prima card:

| Larghezza | Prima: prima card Y | Dopo: prima card Y, pagina iniziale | Prima dopo submit: titolo fuori viewport | Dopo submit: titolo / prima card nel viewport |
|---|---:|---:|---:|---:|
| 1440 | 2729 px | 559 px | 1775 px dall'alto del viewport | 16 / 69 px |
| 390 | 4139 px | 697 px | 2123 px dall'alto del viewport | 16 / 60 px |
| 360 | 4226 px | 765 px | 2142 px dall'alto del viewport | 16 / 86 px |

Prima, dopo click, servivano circa **1928 / 2821 / 2840 px** ulteriori di scroll per portare la prima card all'inizio del viewport (desktop/390/360). Ora **zero scroll manuale dopo submit**, salto automatico con titolo visibile e focus corretto.

Interazioni minime senza autocomplete: **2 azioni di puntamento** (campo città, submit) più digitazione. Con autocomplete: focus+digitazione, freccia/Invio per scegliere e submit/Invio per cercare. Servizio aggiunge una selezione facoltativa. Il numero di interazioni non è diminuito artificialmente: è stato eliminato il passaggio geografico inutile e soprattutto lo scroll successivo. Nel layout nuovo a 360/390×844 campo e pulsante sono nel primo viewport; prima il click del test doveva scorrere automaticamente fino al pulsante.

Benchmark produzione, 20 aggiornamenti alternando Firenze/Milano sul catalogo reale: media **1,445 ms**, min **0,8**, max **2,8 ms** per handler sincrono (non include layout/paint/rete). Nessun confronto di velocità assoluta con il codice precedente viene dichiarato. Misura click+attesa test: circa 147–164 ms, comprende attesa deliberata di 100 ms, non è una misura del tempo percepito dall'utente.

## Verifiche eseguite

`npm run verify`: **246/246 test**, nessuno saltato, check Astro/TypeScript, validazione database, build, link/canonical/SEO/sitemap e bundle API, test DOM ricerca e assistente. Conservati i test, aggiornate solo aspettative incompatibili con requisiti nuovi (priorità città e 12 card invece di intero elenco). I test negativi non dipendono dall'assenza casuale di una città reale.

`npm run package:pages`: **647 file**, **9.513.674 byte**, Worker avanzato e _routes.json presenti. Stessa build senza variazioni di hash tra preview e produzione.

Workerd/Wrangler locale: compatibilità **2026-10-17**, pagine/asset/API/redirect. Chromium anche su workerd; una richiesta tile OSM abortita al cambio filtro locale, nessun errore JS. Preview e produzione finali: **zero errori console/pageerror, zero richieste fallite** nei report.

**19 scenari browser sulla preview e 19 sul dominio ufficiale**, tutti passati:
- A Firenze sola: 11 attività.
- B Milano sola: 4 attività.
- C Toscana e provincia Firenze → Milano: 4 milanesi, vincoli incompatibili rimossi.
- D Firenze + riparazione: 7 attività con servizio documentato.
- E nessuna città: 306 totali, 12 iniziali, poi 24; reload conserva quantità.
- F combinazione vuota: nessuna card inventata, messaggio con città/servizio.
- G reset di sei filtri: nessun parametro residuo, 306 totali.
- H desktop 1440 e mobile simulato 390/360: focus, scroll, nessun overflow.
- I ricerca homepage con GET e trasferimento parametri.
- J apertura scheda e Indietro: stato conservato; due ricerche consecutive e back.
- K altri filtri apri/chiudi senza perdita, rimozione singola marca.
- L autocomplete frecce/Invio/Escape, comune non censito.
- L2 omonimi: fixture isolata nel DOM di risposta del browser, con due province/regioni distinte. Nessuna modifica al catalogo; il catalogo reale non contiene attualmente nomi esattamente duplicati. Invio senza scelta non naviga; Escape chiude.
- Marchi assistenza ufficiale vs vendita/menzione.
- Deep link con conflitto e località non censita.
- Mappa facoltativa inizializzata all'apertura.

API su workerd, preview e www: /api/posizione 200 JSON; /api/orologiaio GET 405, POST valido 200 con criteri Firenze/riparazione, origine estranea 403, formato errato 415. Worker/Functions attivi, AI non modificata o attivata. Sitemap e schede 200, redirect /firenze 308 verso /firenze/, dominio senza www 301 verso www. Integrità di 17 asset pubblici di preview confrontata con SHA-256 del pacchetto, nessuna differenza.

Limiti: Chromium headless con viewport desktop/mobile simulati, **non un telefono fisico**, non Safari/iOS; tastiera virtuale del sistema operativo e screen reader reali non collaudati. Flussi da tutte le singole pagine editoriali non cliccati uno per uno; collegamenti/deep link e destinazioni conservati e controllati dalla build. Non sono state dichiarate verifiche fisiche che l'ambiente non consente. npm ci ha segnalato una vulnerabilità moderata nelle dipendenze preesistenti; nessun aggiornamento automatico o dipendenza applicativa aggiunta.

## File modificati

- site/src/pages/cerca.astro: gerarchia e sezioni compatte.
- site/src/pages/index.astro: solo form principale, nessuna animazione.
- site/src/components/SearchFields.astro (nuovo): campi condivisi.
- site/src/scripts/locality-ui.ts (nuovo): autocomplete.
- site/src/scripts/search-ui.ts: stato, submit, focus/scroll, chips, paginazione.
- site/src/lib/search.ts: precedenza comune e matching normalizzato.
- site/src/components/BusinessCard.astro: variante compact soltanto per ricerca.
- site/src/scripts/map-ui.ts: apertura su richiesta e icone corrette.
- site/src/styles/search.css (nuovo): stile locale ricerca/home form.
- scripts/test-ui.ts, tests/search-simplified.test.ts, tests/freebuff-expansion.test.ts, tests/national02.test.ts: regressioni aggiornate ai requisiti.
- tests/search-phase12.test.ts (nuovo): regressioni motore/normalizzazione.
- scripts/test-search-browser.mjs (nuovo): collaudo riproducibile Chromium A–L.
- documentazione e manifest di consegna.

Modifiche preesistenti preservate senza includerle nel commit UX: api/orologiaio.js già rigenerato con catalogo 306 e tests/fase-07-assistant.test.ts con fixture isolate. Lo ZIP fotografa anche questi file effettivi; il bundle Git contiene il checkpoint commit, la patch preesistente è allegata separatamente per ricostruire la working tree esatta. Non confondere commit e snapshot.

## Deployment e consegna

- Commit UX locale: **136ef9a6cc9233e52e056ce700e37d96c0bc5617**.
- Preview: **e1d2d73e-d6b1-494a-ba55-c63509acd5d3**, https://e1d2d73e.orologiai-it.pages.dev/cerca/.
- Produzione: **ffeafc81-2e44-47aa-a094-3ce25e547c8a**, https://www.orologiai.it/cerca/.
- Branch Pages: pubblicazione-gratuita-scardi-20261022; Wrangler 4.154.0 Direct Upload, progetto esistente.
- Produzione canonica controllata alla partenza, dopo preview e immediatamente prima della promozione: sempre 42e926e3, nessun rilascio concorrente rilevato.
- commit_dirty:true mantenuto onestamente; manifest e ZIP sorgente registrano i contenuti reali.
- Backup: export/orologiai-fase12-20261028-source.zip, export/orologiai-fase12-20261028.bundle, export/orologiai-fase12-directory-20261028.json, export/orologiai-fase12-build-sha256-20261028.json, export/orologiai-fase12-source-sha256-20261028.json, export/orologiai-fase12-20261028.sha256, export/orologiai-fase12-20261028-pages.zip, export/orologiai-fase12-20261028-evidence.zip.

Screenshot prima/dopo desktop e mobile, JSON misure/scenari e API: artifacts/fase12/. Screenshot del dopo tratti dalla preview e dal dominio ufficiale, senza tool di sviluppo Astro. Tutti gli archivi escludono .env reali, credenziali, dipendenze e cache.
