# Orologiai.it — directory dei professionisti del tempo

Directory italiana di orologerie, laboratori e botteghe storiche, realizzata con Astro e TypeScript. Il dataset contiene 45 attività in 22 comuni e 9 province: Toscana (32), Lombardia (3), Lazio (10). **La copertura è ancora limitata a 3 regioni su 20**: una ricerca in un territorio non coperto non può mostrare attività locali verificate.

## Funzioni

- Ricerca per testo, territorio, servizi e marchi, con pagine statiche indicizzabili.
- Ricerca rapida dei servizi anche con espressioni comuni come “tagliando”, “cambio batteria” e “cinturino”. I risultati restano limitati ai servizi documentati per ogni attività.
- Mappa delle sole posizioni verificate.
- Assistente Orologiaio: interpretazione Gemini lato server e fallback locale dichiarato, con criteri conservati fra i turni e ruoli ufficiali distinti. Una chiamata reale sulla preview del commit `089a567` è stata verificata il 20/10/2026 (HTTP 200, modalità `ai`); questo non certifica la configurazione sul dominio di produzione. Il secret richiesto è `GEMINI_API_KEY`.

## Avvio e verifiche

Richiede Node **22.22+** e npm.

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 3000
npm run verify
```

`npm run verify` esegue typecheck, test, validazione del dataset, build e controlli HTML/SEO/interazione. L’output di build è `dist/`. Per configurazione e collaudo dell’assistente vedere [docs/ASSISTENTE-AI.md](docs/ASSISTENTE-AI.md).

## Dati e copertura

Il dataset autorevole è `site/data/directory.json`; le schede riportano fonti e stato di verifica. Le attività storiche e le informazioni operative non devono essere considerate confermate senza riscontro aggiornato. Le nuove voci vanno documentate e revisionate prima dell’inserimento; i candidati d’importazione non diventano automaticamente schede pubbliche. Non aggiungere indirizzi, orari o servizi non riscontrati.

Per estendere la copertura italiana: usare la procedura di raccolta e revisione in [data/staging/README.md](data/staging/README.md), procedere per lotti regionali e trasferire nel dataset solo le attività con fonti adeguate. La copertura attuale non va presentata come censimento nazionale completo.

## Lotti nazionali revisionati

La pipeline riutilizza schema e deduplicazione esistenti. Distingue candidati approvati, in revisione e scartati; controlla fonti, servizi, autorizzazioni e conflitti. L'anteprima non modifica il database. L'applicazione aggiunge solo schede ammesse, conserva i dati precedenti e riconosce i record già integrati. Un aggiornamento diverso su un ID esistente resta in revisione.

```bash
npm run integrate:reviewed -- --input data/import/lazio-07b-reviewed.json
npm run integrate:reviewed -- --input data/import/lazio-07b-reviewed.json --apply
```

Per salvare un nuovo report usare `--report data/reports/nome-univoco.json`: un report esistente non viene sovrascritto. Il primo lotto Lazio è già applicato; la seconda esecuzione non duplica le schede. Fonti e decisioni sono in `data/import/lazio-07b-reviewed.json`, il bilancio iniziale in `data/reports/lazio-07b-20261020.json`. Le 35 attività precedenti sono conservate integralmente. Le nuove schede non hanno coordinate finché manca una verifica specifica; i punti pubblicati restano 4.

## Struttura importante

- `site/src/`: applicazione Astro/TypeScript.
- `site/src/lib/search.ts`: motore di ricerca condiviso.
- `site/data/directory.json`: dati pubblicati dall’applicazione.
- `scripts/` e `tests/`: importazione controllata, validazione e verifiche.
- `public/`: mirror storico da conservare; non è l’output della nuova app.
- `data/staging/`: candidati e lotti di revisione, distinti dal dataset pubblico.

Non committare chiavi API, file `.env` reali o dump. Le modifiche della PR devono essere revisionate prima del merge; il merge può avviare la pubblicazione di produzione secondo la configurazione del repository.
