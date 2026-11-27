# Orologiai.it — checkpoint Fase 18

Data: 31 ottobre 2026. **Implementato nel workspace; non pubblicato su Pages.**

## 1. Stato verificato

| Dato | Prima | Dopo |
|---|---:|---:|
| Attività pubbliche nel catalogo locale | 324 | **346** |
| Località | 196 | **200** |
| Fonti | 790 | **909** |
| Coordinate pubblicabili | 4 | **82** |
| Attività nel comune di Belluno | 2 | **4** |
| Belluno, servizio Riparazione | 2 | **2** |
| Riferimenti territoriali per inquadrare la mappa | — | **169** |

Le 324 identità esistenti sono conservate; nessuna eliminazione. Le 15 candidate sospese del Lotto 5 restano separate, compresa Cagnina San Cataldo. Le sei impronte protette di homepage 16C (home, layout, CSS e immagine) coincidono con il checkpoint iniziale: nessun redesign.

## 2. Belluno: verifica prima/dopo

### Nuove schede
- **Vicentini Gioielli**, Via Carrera 15/B: vendita orologi/gioielleria, **non** riparazione. Sede legale e operativa confermata dai termini del sito. Telefono lasciato assente perché il riscontro primario era insufficiente.
- **GIOR — Gior di Gabbin Isabella**, Piazza Mercato 9: vendita orologi e **laboratorio orafo**, non laboratorio di riparazione orologiera. Sede/telefono incrociati con STUDEX.

### Arricchimenti
- **Boni**: aggiunti revisione, pendoleria e vendita usato. Sei marchi esplicitamente riparati: Rolex, Cartier, Jaeger-LeCoultre, Omega, Patek Philippe, Baume & Mercier. Sono riparazioni dichiarate, **non** nuove autorizzazioni. Conservata rivendita Mido preesistente. Storia di Giordano e Giovanni, con collaborazione del figlio dal 1995; anno di fondazione sconosciuto lasciato nullo.
- **De Marco**: storia dal 1938, laboratorio e CAP verificati. I sette servizi già presenti sono stati riconfermati, non conteggiati come nuovi. Nessuna riparazione di meccanici aggiunta per deduzione.
- **Piaz**: riscontri di gioielleria/ottica, ma insufficienti prove primarie di orologeria attuale: non inserita.
- **Santarossa Preziosi**: solo directory, attualità e servizi insufficientemente verificati: non inserita.

Fonti principali:
- https://www.gioielleriaboni.it/chi-siamo
- https://www.gioielleriaboni.it/riparazione-orologi
- https://www.demarco-belluno.it/riparazioni-orologi-a-belluno/
- https://www.bellunocentro.it/portfolio/de-marco-gioielleria-orologeria/
- https://vicentinigioielli.it/termini-e-condizioni/
- https://www.gioielli-gior.it/en/?id=index-1117486329&ucat=88
- https://www.studex.it/store/gior-di-gabbin-isabella/

**Risultato onesto:** la ricerca Riparazione rimane a 2. Le due nuove attività non diventano riparatori per gonfiare i risultati. Per Riparazione meccanici: 0 esatti e 2 alternative con sola riparazione generica, in sezione distinta.

## 3. Mappa e geocodifica

Implementazione concreta:
- la ricerca trasmette ID esatti, ID pertinenti, località e territorio allo stato della mappa;
- i marker sono esclusivamente quelli dei risultati filtrati; le alternative sono etichettate nel popup;
- un pin apre la scheda corrispondente; contenuto popup creato con DOM/textContent, senza concatenazioni HTML di dati;
- cambio filtri/località aggiorna marker, conteggi e inquadratura;
- senza coordinate utili, focus sul territorio noto senza punti nazionali; senza riferimento territoriale affidabile la mappa viene nascosta e resta il messaggio;
- wheel zoom disattivato; su touchscreen trascinamento disattivato inizialmente e attivabile con pulsante, per non bloccare lo scorrimento;
- controlli e attribuzione Leaflet restano dentro la mappa, nessuna sovrapposizione riscontrata alle larghezze 1440 e 390 px.

### Copertura effettiva verificata nel browser locale workerd

Con filtro **Riparazione**:

| Città | Risultati | Marker pertinenti |
|---|---:|---:|
| Belluno | 2 | **0**, mappa inquadrata su Belluno |
| Firenze | 7 | **3** |
| Roma | 7 | **1** |
| Milano | 4 | **2** |

Senza filtro servizio: coordinate presenti per Firenze 7/11, Roma 1/7, Milano 2/5, Belluno 0/4.

### Procedura persistente

`scripts/geocode-directory.ts` è un CLI deliberatamente separato da build/CI/browser: singolo thread/macchina, attesa 1,25s, User-Agent identificativo, cache per URL SHA-256, stop su errore senza retry. Sono stati raccolti 341 indirizzi e quattro riferimenti città (345 query distinte); il riavvio non ha ripetuto le query già in cache. Il comparatore richiede strada/civico/comune/paese, CAP se disponibile e scala edificio. Le proposte sono state revisionate separatamente: 87 confrontabili, 9 scartate per identità/POI discordanti, **78 aggiunte** alle 4 coordinate storiche.

**Belluno resta un problema aperto per i marker:** gli indirizzi risolvono solo strada/piazza o comune errato. Esistono POI nominativi OSM per Boni/GIOR/Vicentini ma senza civico; Boni risulta su una strada diversa. Non sono stati promossi a coordinate verificate. Nessun centroide di strada pubblicato come sede.

Cache, proposte, manifest e baseline: `data/staging/fase18-geocode/`. Revisione: `data/import/fase18-geocode-review.json`. Offerta scaricabile del sottoinsieme geografico derivato: `site/assets/coordinate-osm.json`, pubblicato dalla build come `/coordinate-osm.json`, ODbL e attribuzione OSM. Gli obblighi ODbL e le cautele già descritte in `docs/LICENZA-OSM.md` rimangono pertinenti; nessuna nuova garanzia legale è implicita.

Policy consultate:
- https://operations.osmfoundation.org/policies/nominatim/
- https://operations.osmfoundation.org/policies/tiles/
- https://www.openstreetmap.org/copyright

## 4. Risultati e schede premium

- Risultati editoriali a righe su desktop, impilati su mobile; gerarchia nome/città/laboratorio/anno e descrizione, massimo quattro servizi selezionati per pertinenza.
- Servizi distintivi preservati anche dopo filtro: Boni mostra Pendoleria e Orologi usati, non solo le prime righe del database.
- Azioni Scheda, Indicazioni e Chiama ove documentate.
- Badge Fonti pubbliche rimosso dalle card. Nessuna foto di attività non autorizzata inserita. Nessuna attribuzione fotografica della homepage alterata.
- Native select con font 16px e opzioni a zero disabilitate, salvo il servizio già selezionato; possibilità esplicita di rimuovere località o servizio.
- Corretto il clone dei risultati pertinenti che poteva restare `hidden`.
- Schede: sezione laboratorio solo con fonte, storia/servizi/marchi distinti, fonti secondarie complete anche per coordinate e singoli claim, altre botteghe nello stesso comune ordinate per servizi comuni. Nessuna sezione di fotografie fittizie.
- Corretto un falso duplicato geografico: due negozi distinti entro 75 metri non sono duplicati per sola prossimità; nomi/indirizzi e altri segnali continuano a essere controllati.

## 5. Lotto nazionale — 20 nuove sedi, oltre alle 2 di Belluno

1. Franchin — Padova (riparazioni meccanici/automatici/quarzo e pendole).
2. Cronomania — Padova (laboratorio interno, revisione e restauro).
3. Brugnelli — Corso Campi, Cremona.
4. Brugnelli — Via Verdi, Cremona (sede distinta della stessa rete; laboratorio non localizzato arbitrariamente).
5. Curnis — Monte Grappa, Bergamo (concept store e assistenza).
6. Curnis — Via Zambonate, Bergamo (vendita; nessun laboratorio trasferito da altra sede).
7. Pernici — Arezzo (dal 1946, laboratorio interno).
8. Louis Shop — Pieve di Cento (riparazione/restauro meccanici).
9. Lazzini — Sarzana (non La Spezia; pendoleria e revisioni).
10. Luigi Verga — Corso Vercelli, Milano (interno + collaborazione con centri delle case).
11. Fecarotta — Palermo (riparazione e assistenza; interno non dichiarato).
12. Carlini — Isernia (vendita; riparazione non attribuita).
13. Le Musolesi — Bologna (laboratorio, vintage e vari movimenti).
14. I Gioielli Conti — Besana in Brianza (**non Monza città**).
15. Bartorelli — Via Dante, Riccione (rete Patek Philippe confermata dal produttore).
16. Salvadori — Boutique Rolex, Venezia (vendita; nessun interno dedotto).
17. Restivo — Catania.
18. Restivo — Siracusa.
19. Restivo — Enna, nuovo capoluogo nel catalogo.
20. Restivo — boutique Patek Philippe, Taormina (vendita, non assistenza dedotta).

Le sedi Restivo sono vendita documentata, non nuovi laboratori. Il lotto combina specialisti e sedi di vendita, non 20 riparatori. Pretolani Forlì era già presente: arricchito il laboratorio, senza creare un duplicato. Elenco e fonti in `data/import/fase18-reviewed-report.json`.

## 6. Verifiche realmente eseguite

- Check finale Astro/TypeScript: **0 errori, 0 warning**.
- Build finale: **687 HTML**, **346 schede**, link/frammenti/canonical/sitemap validi, due API nel routing.
- Suite iniziale: 252 test, 236 passati, 11 falliti, 5 già sospesi. I fallimenti erano attese storiche incompatibili con nuove coordinate/cronologie/copertura. Non sono stati saltati: aggiornati a verificare gli esatti punti registrati nella revisione, la presenza dell'evento storico e i nuovi conteggi.
- Rilanci mirati dei file coinvolti: `tests-affected.log` (49/50 prima della correzione deduplica), poi `tests-duplicates.log` (25 passati, 5 sospesi), `tests-historical-final.log` (36/36), `tests-delivery.log` (6/6). Tutti gli 11 fallimenti iniziali risultano coperti dai rilanci riusciti. **Non esiste un nuovo unico log dell'intera suite verde**: non sono stati ripetuti inutilmente i test non modificati già passati.
- Test DOM ricerca e assistente finali passati (`ui-final.log`).
- Browser Chromium locale sul **pacchetto finale in workerd**, desktop 1440px e viewport touch 390px: quattro città, ID marker, assenza overflow, alternative Belluno e reset servizio; nessun pageerror rilevato. Clic di un marker Firenze verificato: popup con link scheda raggiungibile HTTP 200; successivo cambio filtro con marker coerenti. Non è un test su dispositivi Android/iOS reali.
- Screenshot finali `artifacts/fase18/`: Belluno desktop/mobile, Firenze/Roma/Milano desktop, Boni desktop/mobile. Le tile OSM sono state **bloccate nell'automazione** per non effettuare richieste headless vietate dalla policy: sfondo vuoto previsto nelle immagini. **Caricamento del fondale cartografico reale ancora da verificare interattivamente dall'utente.** Non equivale a mappa funzionante end-to-end su dominio pubblico.
- workerd compatibility `2026-10-17`: home, ricerca, schede, font effettivo `DejaVuSerif.woff`, CSS, JSON geografico, posizione, sitemap HTTP 200/content type corretti. Un primo probe del nome inesistente `heritage-serif.woff2` ha dato 404; verificato poi il percorso reale con hash manifest.
- API locale assistente: POST stessa origine 200/modalità non-configurato, origine esterna 403. Nessuna chiamata AI remota eseguita.
- Manifest: **720 file**, 14,59 MiB non compressi, tutti SHA-256 corrispondenti. Homepage protetta: sei hash immutati.
- Script integrazione e applicazione geocodifica idempotenti: riesecuzione senza rete e senza cambiamenti a dataset, coordinate o asset geografici.

## 7. Deployment e assistente

Produzione ricontrollata: **5941ae69-2685-4b42-924a-bbd9d5359953**, branch `pubblicazione-gratuita-scardi-20261022`, progetto esistente `orologiai-it`, binding AI e `AI_PROVIDER=cloudflare` preservati. Nessun nuovo deployment preview o Production effettuato. Il proxy temporaneo quindi **rimane in produzione**.

**Blocco esatto:** `CLOUDFLARE_CREATE_PAGES_DEPLOYMENT` richiede per `worker_script`/`routes_file` un allegato remoto `{name,mimetype,s3key}`. Non è disponibile il caricamento dal workspace verso tale allegato. L'upload inline degli asset non risolve il trasferimento del codice eseguibile. Non inventati s3key, non distribuito solo `dist/`, non eseguito push/rebuild tramite vecchio GitHub, non estratte credenziali dalla shell.

AI: codice e binding esistenti preservati; test del provider con mock nella suite, fallback e sicurezza verificati localmente. **Nuovo pacchetto con AI reale non collaudato su Pages.** Nessun piano, billing, DNS, email o altro sito modificato. Nessun nuovo progetto o servizio a pagamento.

Anteprima locale: pannello Browser, porta 3000; il pacchetto completo workerd è sulla porta 8788. Non sono URL Pages e non sono pubblicazioni Production.

## 8. Riproduzione e rilascio da terminale autorizzato

Dallo ZIP SORGENTI estratto, con Node >=22.22:

```bash
npm ci --no-audit --no-fund
npm run check
npm run build
npm run package:pages
```

Il catalogo pronto è già nello ZIP: non occorre rilanciare la geocodifica. Per ricostruire i dati a partire dal checkpoint iniziale in una copia di lavoro:

```bash
cp data/staging/fase18-geocode/catalog-before.json site/data/directory.json
node scripts/integrate-fase18.mjs
node scripts/apply-fase18-geocodes.mjs
```

Cache persistente in staging, nessuna richiesta necessaria per applicare il lotto. I test storici che interrogano commit passati richiedono la storia Git esistente; lo ZIP non si collega né ricrea il vecchio repository sospeso.

Da un terminale **già autenticato sull'account corretto** dell'utente (nessun token in chat), il pacchetto DEPLOY completo è caricabile senza rebuild:

```bash
npx --yes wrangler@4 pages deploy .runtime/pages-build --project-name=orologiai-it --branch=fase18-integrale-preview-20261031
```

La preview è pubblica. Verificare prima di Production: tile e pin/popup su quattro città; ricerca esatta/pertinente; assistente con risposta `modalita: ai`; posizione; schede; console/network; canonical/sitemap/font. Ricontrollare il deployment canonico e fermarsi se non è più il riferimento atteso. Solo dopo i controlli riusare **lo stesso pacchetto** sul branch Production autorizzato, senza rimuovere prima il proxy. Nessuna promessa di gratuità assoluta dell'account: non sono stati attivati costi o nuovi piani.
