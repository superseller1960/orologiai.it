# Orologiai.it — directory dei professionisti del tempo

Directory italiana di orologerie, laboratori e botteghe storiche, realizzata con Astro e TypeScript. La versione proposta in questa PR contiene 35 attività in 18 località. **La copertura non è ancora nazionale completa**: una ricerca in una città non presente nel dataset non può mostrare attività verificate.

## Funzioni

- Ricerca per testo, territorio, servizi e marchi, con pagine statiche indicizzabili.
- Ricerca rapida dei servizi anche con espressioni comuni come “tagliando”, “cambio batteria” e “cinturino”. I risultati restano limitati ai servizi documentati per ogni attività.
- Mappa delle sole posizioni verificate.
- Assistente Orologiaio: interfaccia con interpretazione Gemini lato server e fallback deterministico. La chiamata AI richiede `GEMINI_API_KEY` configurata come secret sulla piattaforma; senza la chiave resta disponibile il fallback. La chiamata reale e la configurazione sul dominio di produzione non sono ancora verificate.

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

## Struttura importante

- `site/src/`: applicazione Astro/TypeScript.
- `site/src/lib/search.ts`: motore di ricerca condiviso.
- `site/data/directory.json`: dati pubblicati dall’applicazione.
- `scripts/` e `tests/`: importazione controllata, validazione e verifiche.
- `public/`: mirror storico da conservare; non è l’output della nuova app.
- `data/staging/`: candidati e lotti di revisione, distinti dal dataset pubblico.

Non committare chiavi API, file `.env` reali o dump. Le modifiche della PR devono essere revisionate prima del merge; il merge può avviare la pubblicazione di produzione secondo la configurazione del repository.
