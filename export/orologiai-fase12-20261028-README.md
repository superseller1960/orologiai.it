# Ripristino Fase 12 — 28/10/2026

Produzione: https://www.orologiai.it/cerca/
Preview: https://e1d2d73e.orologiai-it.pages.dev/cerca/
Codice UX: 136ef9a6cc9233e52e056ce700e37d96c0bc5617
Checkpoint con report: 8fff918bd6ed3d0fd87c8ac5286dbc17722903ba

## Sorgenti
Lo ZIP source contiene la sorgente attuale completa dell'applicazione, mirror
public, dati, API/Functions, test, lockfile e documenti. Esclude soltanto segreti,
cache, dipendenze, .git e archivi export storici ridondanti. Include anche le due
modifiche preesistenti non committate, per riprodurre i file effettivi compilati.
Confrontare i file con source-sha256 prima di usarli.

## Git locale, senza GitHub
Il bundle contiene la storia completa del checkpoint HEAD. In una nuova cartella:
  git clone orologiai-fase12-20261028.bundle progetto
  cd progetto
  git switch -c recupero-fase12 8fff918bd6ed3d0fd87c8ac5286dbc17722903ba
La patch working-tree, applicata con git apply, ricostruisce API generata e test
preesistente che erano presenti nella build ma non appartengono al commit UX.
Non serve con lo ZIP source: i file sono già quelli della working tree.

## Build
Node >=22.22, npm ci, npm run verify, npm run package:pages.
Il pacchetto pages.zip è esattamente quello pubblicato, con Worker e _routes.json.
Il manifest build-sha256 elenca tutti i 647 file e gli hash. Non ricostruire se
occorre replicare byte per byte l'artefatto già distribuito: usare pages.zip.
Le credenziali non sono incluse: impostarle nel proprio secret store, non nei sorgenti.
Prima di qualsiasi altro deploy, controllare la produzione Cloudflare canonica:
non sovrascrivere pubblicazioni concorrenti. Nessun utilizzo GitHub necessario.

## Browser e limiti
Le evidenze includono screenshot prima/dopo 1440/390/360 e JSON dei 19 scenari
passati su preview e dominio ufficiale, senza errori console/rete.
Chromium è stato eseguito in VM con viewport simulati, non telefoni fisici/Safari.
Il test scripts/test-search-browser.mjs richiede Playwright locale in
.runtime/browser/node_modules; non è una dipendenza applicativa del progetto.
I processi dev e le librerie di sistema locali non sono inclusi e non sopravvivono
all'archiviazione. Consultare il report Fase12 per cause, metriche e limiti.
