# Orologiai.it — directory dei professionisti del tempo

Directory italiana di orologerie, laboratori e botteghe storiche, realizzata con Astro e TypeScript. Il dataset pubblicato copre tutte le **20 regioni italiane** con **103 attività in 58 località** e **168 fonti** (conteggi aggiornati ricavabili da `site/data/directory.json`). **La copertura di tutte le regioni non è un censimento completo dell'Italia**: una ricerca in una località non presente nel dataset non può mostrare attività verificate, e non vengono creati elenchi vuoti o attività inventate.

## Funzioni

- Ricerca per testo, territorio, servizi e marchi, con pagine statiche indicizzabili.
- Ricerca rapida dei servizi anche con espressioni comuni come “tagliando”, “cambio batteria” e “cinturino”. I risultati restano limitati ai servizi documentati per ogni attività.
- Pagine regionali, per provincia/comune e per servizio, con ingresso nazionale in `/orologerie/`.
- Mappa delle sole posizioni verificate.
- Assistente Orologiaio: interfaccia con interpretazione Gemini lato server e fallback deterministico. La chiamata AI richiede `GEMINI_API_KEY` configurata come variabile d'ambiente del progetto Vercel; senza la chiave resta disponibile il fallback, che dichiara la propria modalità. La chiamata reale e la configurazione sul dominio di produzione non sono ancora verificate.

## Avvio e verifiche

Richiede Node **22.22+** e npm.

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 3000
npm run verify
```

`npm run verify` esegue typecheck, test, validazione del dataset, build e controlli HTML/SEO/interazione. L'output di build è `dist/` (più le funzioni `api/*.js` per Vercel). Per configurazione e collaudo dell'assistente vedere [docs/ASSISTENTE-AI.md](docs/ASSISTENTE-AI.md); per la piattaforma di distribuzione vedere [docs/VERCEL.md](docs/VERCEL.md).

## Dati e copertura

Il dataset autorevole è `site/data/directory.json`; le schede riportano fonti e stato di verifica. Le attività storiche e le informazioni operative non devono essere considerate confermate senza riscontro aggiornato. Le nuove voci vanno documentate e revisionate prima dell'inserimento; i candidati d'importazione non diventano automaticamente schede pubbliche. Non aggiungere indirizzi, orari o servizi non riscontrati.

Per estendere la copertura italiana: usare la procedura di raccolta e revisione in [data/staging/README.md](data/staging/README.md), procedere per lotti regionali e trasferire nel dataset solo le attività con fonti adeguate. La copertura attuale non va presentata come censimento nazionale completo.

## Struttura importante

- `site/src/`: applicazione Astro/TypeScript.
- `site/src/lib/search.ts`: motore di ricerca condiviso.
- `site/data/directory.json`: dati pubblicati dall'applicazione.
- `scripts/` e `tests/`: importazione controllata, validazione e verifiche.
- `api/`: bundle autosufficienti delle funzioni Vercel, generati a build da `site/src/api/`.
- `functions/api/`: entry Cloudflare Pages mantenute come percorso di compatibilità.
- `public/`: mirror storico da conservare; non è l'output della nuova app.
- `data/staging/`: candidati e lotti di revisione, distinti dal dataset pubblico.

Non committare chiavi API, file `.env` reali o dump. Il sito storico WordPress resta sul dominio di produzione fino al passaggio pianificato: nessuna modifica a DNS, produzione o contenuti del vecchio sito avviene da questo repository.
