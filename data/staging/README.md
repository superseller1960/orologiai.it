# Raccolte intermedie — non pubbliche

Le sottocartelle sono normalmente ignorate da Git e non entrano in `dist/`. Eccezione esplicita: i tre lotti `toscana-02-osm-source`, `toscana-02-osm` e `toscana-02-review` sono versionati per consentire audit e test riproducibili, senza richieste di rete in CI. Contengono dati pubblici di attività e riferimenti alle fonti, mai segreti. Sono consultabili nel repository ma non pubblicati nell’applicazione. Ogni lotto contiene `manifest.json`, `candidates.json`, `report.json`. Il manifest conserva URL dell’estratto, hash SHA-256, data, area e licenza. Conservare anche il file sorgente originale in un archivio di raccolta esterno all'output pubblico.

I candidati non sono attività approvate: non vengono caricati dall’applicazione. Le procedure di raccolta e importazione OSM non modificano `site/data/directory.json`.

La raccolta OSM resta separata dalla promozione. Per i lotti nazionali revisionati, `data/import/*-reviewed.json` registra decisioni, schede ammesse, fonti ed evidenze sintetiche. `npm run integrate:reviewed -- --input ...` produce un'anteprima; soltanto `--apply` integra le schede approvate dopo validazione e controllo dei duplicati. Le schede in revisione non vengono pubblicate. I report salvati con `--report data/reports/nome-univoco.json` riportano nuove attività, record già presenti, conflitti, scarti, regioni, province, comuni, servizi, coordinate valide e contatti. Ogni fonte di servizio deve includere un riferimento primario. Le modifiche su ID esistenti non vengono applicate automaticamente.

## Revisione obbligatoria

1. Confermare pertinenza, operatività e comune amministrativo; un bounding box non identifica una provincia o regione.
2. Risolvere i possibili duplicati, distinguendo sedi diverse della stessa insegna.
3. Consultare il sito ufficiale e registrare fonte e data di ogni informazione trasferita.
4. Separare marchi menzionati/venduti/riparati e autorizzazioni; queste ultime richiedono fonte del marchio.
5. Creare/riusare una località e una fonte, assegnare ID e slug stabili, preservare `origine` OSM e attribuzione.
6. Conservare provenienza e licenze del contenuto importato. Prima della prima pubblicazione di dati OSM valutare gli obblighi ODbL della banca dati derivata: il semplice uso di file separati non elimina il copyleft.
7. Proporre la modifica del dataset con cronologia e fonti, eseguire `npm run verify`, rivedere la diff e l’anteprima in PR. Nessun merge automatico.

Gli orari OSM sono conservati come testo originale, non interpretati come disponibilità “aperto ora”. I centri di way/relation non sono automaticamente l’ingresso del negozio. Eventuali coordinate vanno riesaminate prima di pubblicarle.
