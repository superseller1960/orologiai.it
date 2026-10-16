# Orologiai.it — directory nazionale dei professionisti del tempo

Directory italiana di orologerie, laboratori e botteghe storiche. Incremento 01: dati validati, generazione statica delle pagine, ricerca e importazione offline in revisione. **Non è ancora un censimento nazionale completo.**

## Avvio

Node **22.22+** e npm. Le dipendenze sono fissate nel lockfile.

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 3000
```

Aprire http://localhost:3000. Per host di anteprima usare `--allowed-hosts HOST_ESATTO`, mai una wildcard. Il server di sviluppo non è un deploy.

```bash
npm run verify    # typecheck, test, validazione, build/link/SEO, interazioni DOM
npm run build     # output statico dedicato in dist/
npm run validate  # integrità del dataset e conservazione legacy
```

## Dove lavorare

- `site/src/`: applicazione attiva Astro/TypeScript, layout e pagine generate.
- `site/src/lib/schema.ts`: modello Zod e regole di attendibilità.
- `site/src/lib/search.ts`: motore di ricerca condiviso, senza dipendenze UI/AI.
- `site/data/directory.json`: dataset autorevole, con fonti e cronologia.
- `site/data/orologerie.json`: dataset originale delle otto attività, conservato senza modifiche.
- I vecchi HTML/CSS/JS in `site/` restano come riferimento recuperabile; il blog e Rolex sono riutilizzati con avviso editoriale.
- `public/`: mirror storico **da non sovrascrivere**. Non è l’output né il publicDir di Astro.
- `data/import/`: configurazione pilota e query documentata.
- `data/staging/`: lotti locali non pubblici e non versionati automaticamente.
- `scripts/`, `tests/`: migrazione, validazione, importazione e verifiche.

## Importazione pilota, senza pubblicazione automatica

La CLI non scarica dati e non geocodifica. Procurarsi un singolo estratto autorizzato compatibile Overpass JSON, conservando la fonte. Poi:

```bash
npm run import:osm -- --input /percorso/estratto.json \
  --area data/import/pilot-toscana.json \
  --out data/staging/pilota-001 \
  --source-url https://fonte.example/estratto.json
```

L’URL è un esempio, non una fonte reale. La cartella del lotto non deve esistere: non si sovrascrivono raccolte precedenti. Output: manifest, candidati validati, rapporto scarti/duplicati. Per provare senza rete usare `tests/fixtures/osm-pilot.json` con una fonte chiaramente sintetica. **Non pubblicare la fixture.**

Prima di trasferire dati nel dataset seguire `data/staging/README.md`, distinguere provenienza OSM dai successivi riscontri ufficiali e valutare gli obblighi ODbL. Un import non conferisce autorizzazioni ufficiali dei marchi.

## Stato e limiti

Otto attività storiche conservate, tutte da verificare; nessun indirizzo o orario inventato. Schede e località sono HTML statico. I filtri interattivi richiedono JavaScript; senza JS restano navigabili tutte le schede. Mappa, AI reale, titolari e moderazione persistente non sono ancora attivi. Il collegamento email apre il client di posta: non registra richieste e la ricezione non è stata verificata.

Nessuna pubblicazione automatica o configurazione di produzione verificata. Il vecchio workflow di import è ora protetto contro la sovrascrittura del mirror esistente. Non inserire credenziali o dump nel repository. Non eseguire il merge o il deploy prima della revisione.

Audit, scelte tecniche, fonti, URL, recupero del lavoro e prossimo incremento: **[docs/INCREMENTO-01.md](docs/INCREMENTO-01.md)**.
