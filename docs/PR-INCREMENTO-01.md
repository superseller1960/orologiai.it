# Fondamenta verificabili per la directory nazionale

## Obiettivo

Passare dalla prima versione statica a un’applicazione data-driven, conservando integralmente mirror e otto schede originali. Nessun deploy e nessun merge automatico.

## Contenuto

- Astro statico, TypeScript, Zod e lockfile riproducibile.
- Modello versionato per sedi, località, servizi, marchi/ruoli, fonti, verifiche e cronologia.
- Migrazione conservativa: otto schede da verificare, nessun contatto o autorizzazione inventati.
- Homepage riprogettata, schede generate, località, servizi e marchi; vecchie URL Firenze/Milano/Blog/Rolex conservate.
- Ricerca deterministica con filtri condivisibili; coordinate mancanti non generano distanze.
- Importatore offline OSM con staging, rapporti, attribuzione, scarti e possibili duplicati; nessuna pubblicazione automatica.
- Controlli CI di sola lettura e protezione del vecchio workflow contro la sovrascrittura del mirror.

## Verifiche locali

`npm ci && npm run verify` superato: typecheck, 14 test, validazione e conservazione legacy, build, link/fragment/canonical/sitemap e test eventi del bundle compilato nel DOM. Controlli HTTP dell’anteprima e output statico superati. Nessuna vulnerabilità segnalata da `npm audit --omit=dev`.

## Da rivedere

- Controllo grafico desktop/mobile nel Browser: pendente, jsdom non verifica il rendering.
- Nessuna raccolta reale nuova: la fixture OSM è dichiaratamente sintetica e non entra nella build.
- Mappa interattiva, AI e account/moderazione persistente non ancora attivi.
- Il dominio di produzione e la pipeline di rilascio non vengono modificati.
- Il branch include `8dc29a5`, non presente nel main osservato durante l’audit; rivedere l’eventuale PR precedente per evitare doppie proposte.

Audit e piano del prossimo lotto: `docs/INCREMENTO-01.md`. La PR va creata sul branch `directory-foundation-20261016` verso `main`; questo file ne prepara soltanto il testo.
