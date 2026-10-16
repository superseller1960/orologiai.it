# Pull Request: Incrementi 01–06 (architettura Astro, censimento Toscana, mappa, Orologiaio e backend Gemini)

> **Importante sul confronto con `main`:** il branch `main` (`56e34a0`) contiene soltanto l’import statico iniziale del sito storico. Questa pull request raccoglie quindi **tutti gli incrementi dallo 01 allo 06**, non il solo Incremento 06. La vecchia PR #2 (`8dc29a5`) riguarda il solo prototipo iniziale e non va unita.

## Riferimenti
- **Branch sorgente:** `incremento-06-assistente-gemini-20261016`
- **Branch di destinazione:** `main`
- **Link creazione PR:** https://github.com/superseller1960/orologiai.it/pull/new/incremento-06-assistente-gemini-20261016

## Cosa comprende la PR rispetto a `main`
1. **Incremento 01 — Fondazione directory:** applicazione Astro + TypeScript (`output: 'static'`), schema rigoroso Zod (`site/src/lib/schema.ts`), conservazione integrale del mirror storico in `public/` e delle 8 attività originali (`site/data/orologerie.json`), pagine generate per schede, comuni, servizi e marchi.
2. **Incremento 02 — Primo censimento reale Toscana:** pipeline OSM controllata (`site/src/lib/osm-import.ts`) e integrazione di 25 sedi toscane verificate su fonti ufficiali (33 attività in 17 comuni).
3. **Incremento 03 — Mappa Leaflet e geocodifica:** mappa in `/cerca/`, pubblicazione delle sole 4 coordinate verificate e confrontate con l’indirizzo, documentazione ODbL (`docs/LICENZA-OSM.md`).
4. **Incremento 04 — Lamberti e Massari + chiarezza posizioni:** integrazione di Gioielleria Lamberti (Sesto Fiorentino) e Massari Gioielli (Campi Bisenzio) con fonti ufficiali (35 attività in 18 comuni), registro decisioni per Il Giglio d’Oro in staging, URL tile configurabile via `PUBLIC_TILE_URL`.
5. **Incremento 05 — Orologiaio (ricerca in linguaggio naturale):** modello Zod `criteriSchema`, parser deterministico italiano, riuso di `searchDirectory`, pagina `/orologiaio/` con spiegazioni fondate sui dati, distinzione obbligatoria fra autorizzazioni ufficiali e menzioni/esperienza, gestione orari e distanze.
6. **Incremento 06 — Backend Gemini e completamento assistente:**
   - Pages Function `functions/api/orologiaio.ts` (`POST /api/orologiaio`) e routing `site/assets/_routes.json`;
   - client REST `site/src/lib/gemini.ts` per `gemini-3.5-flash-lite` con `responseMimeType: "application/json"` e `responseJsonSchema`;
   - handler `site/src/lib/orologiaio-api.ts` con validazione, controllo `Origin`, limiti di dimensione e frequenza, timeout e fallback deterministico dichiarato;
   - script di prova reale separato `npm run test:gemini:live` (`scripts/verify-gemini-live.ts`);
   - documentazione di costi, privacy, configurazione del secret `GEMINI_API_KEY` e regola WAF Cloudflare in `docs/ASSISTENTE-AI.md`.

## Verifiche eseguite
- `npm run verify`: typecheck Astro + TypeScript (0 errori), 73 test automatici tutti verdi, build statica (106 documenti HTML e 35 schede), test DOM compilato (`test:ui`).
- Prova reale Gemini (`npm run test:gemini:live`): **bloccata** in assenza di `GEMINI_API_KEY` nell’ambiente di sviluppo; da eseguire prima del rilascio in produzione.
- Verifica visiva nel browser reale (mappa di `/cerca/` e pagina `/orologiaio/` su desktop e smartphone): **pendente**.
