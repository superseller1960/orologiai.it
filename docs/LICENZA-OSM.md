# Nota tecnica — Licenza ODbL e provenienza geografica

Data: **16 ottobre 2026**. Riferimento ufficiale: https://www.openstreetmap.org/copyright .
Questa nota descrive obblighi noti e precauzioni operative; **non è una valutazione legale definitiva**. Dove il rischio è rilevante per l’intero database nazionale il problema e le alternative sono indicati esplicitamente.

## 1. Quali campi provengono da OpenStreetMap

| Campo | Provenienza attuale |
|---|---|
| `posizione.coordinate` (lat/lon) quando `provenienza` è `osm-node` o `geocodifica-osm` | **OpenStreetMap** (estratto Overpass del lotto toscana-02 o lookup Nominatim del lotto toscana-03) |
| `origine.sistema = 'osm'` e `origine.idOriginale` (es. `node/11833445469`) | **OpenStreetMap** (identificativo originario conservato) |
| `tagOriginali`, `orariOriginali` dei candidati in staging | **OpenStreetMap** (solo in `data/staging/`, non pubblicati) |

## 2. Quali campi provengono da fonti indipendenti

Tutti gli altri campi pubblicati — nome, indirizzo, CAP, telefono, email, sito, orari, servizi, marchi, storia, stati di verifica — provengono da **siti ufficiali delle attività, reti ufficiali dei marchi, elenchi istituzionali e stampa di settore**, consultati e datati singolarmente. Anche per le attività individuate originariamente in OSM (es. Swatch Via dei Calzaiuoli) i campi pubblicati sono stati **riscontrati indipendentemente** sulle fonti ufficiali; l’ID OSM resta solo come provenienza dell’identificativo e della coordinata.

## 3. Come viene registrata la provenienza

- Ogni campo del dataset pubblico (`site/data/directory.json`) cita gli ID delle fonti in `data/fonti`, con URL e data di consultazione.
- Ogni coordinata pubblicata riporta: `fonti` (ID delle fonti), `provenienza` (`osm-node`, `geocodifica-osm`, `fonte-ufficiale`), `verificateIl`, `indirizzoConfrontato` (l’indirizzo ufficiale confrontato con il risultato geografico).
- Gli estratti grezzi e i lookup sono conservati in `data/staging/toscana-02-osm-source/` e `data/staging/toscana-03-geocode/` con hash SHA-256, timestamp, endpoint e testo della query.
- Nessun campo OSM viene copiato senza la propria attribuzione e senza distinguersi dai campi di fonte indipendente.

## 4. Obblighi di attribuzione pertinenti

Secondo la pagina copyright OSM e l’ODbL 1.0:

1. Ogni pubblicazione o uso pubblico di dati OSM richiede attribuzione **«© OpenStreetMap contributors»** con link a https://www.openstreetmap.org/copyright — applicata in mappa, in piè di pagina delle pagine geografiche e in questa nota.
2. L’attribuzione riguarda anche singoli campi copiati (indirizzi, coordinate, nomi), non solo le mappe.
3. Per un database distribuito come tale l’attribuzione va inclusa nella documentazione associata (questo file, i manifest dei lotti, le schede).

## 5. Precauzioni per pubblicare database e coordinate — problema e alternative

Il punto delicato è lo **share-alike** dell’ODbL: un database che incorpora o modifica una parte sostanziale di OSM è una *Derivative Database* e, se usato pubblicamente, va condiviso con licenza compatibile; la semplice separazione in file diversi **non elimina** gli obblighi se i dataset sono in sostanza integrati (fonte: linee guida OSMF sui database collettivi). D’altra parte l’ODbL esclude dallo share-alike il *Collective Database* di dataset indipendenti, e un *Produced Work* (la mappa visualizzata) richiede attribuzione ma non estende automaticamente l’ODbL all’opera.

**Alternative valutate:**

- **(a) Nessuna coordinata pubblicata.** Massima prudenza, ma la mappa geografica richiesta resterebbe vuota.
- **(b) Coordinate OSM pubblicate con provenienza campo per campo, attribuzione piena e offerta del dump del sottoinsieme derivato** (dataset separato e scaricabile `data/staging/toscana-03-geocode/` + estratto OSM versionato). Trattamento prudente come database collettivo con componente OSM identificabile, offerta gratuita della parte derivata in formato leggibile dalla macchina come previsto dall’ODbL §4.6 per i database derivati, e revisione legale segnalata prima dell’uso commerciale o della scala nazionale.
- **(c) Geocodificatore commerciale con diritti di ridistribuzione.** Costi e condizioni da documentare prima dell’introduzione; non introdotto in questo incremento.

**Scelta adottata: (b)**, limitata a un numero ridotto di posizioni verificate una a una, con:

- attribuzione OSM visibile in mappa e nella documentazione;
- provenienza esplicita per ogni coordinata (§3);
- estratto OSM e risultati di geocodifica conservati, versionati e offerti come download del sottoinsieme derivato;
- nessuna pretesa che la struttura attuale sia esente da obblighi: **prima di pubblicazione commerciale o estensione nazionale del database con campi OSM, far esaminare schema e flussi da un professionista qualificato**, valutando anche il rilascio dell’intero database sotto licenza compatibile.

Il resto del database (campi di fonte indipendente) mantiene la propria natura; i diritti delle fonti commerciali sono distinti da quelli OSM e non vengono rilicenziati come OSM.

## 6. Dati con licenze differenti nello stesso database

- I campi OSM sono marcati e ricaricabili separatamente (dataset derivato offerto).
- I campi dai siti ufficiali delle attività sono sintesi originali di fatti, con URL e data; non sono contenuti OSM e non vengono attribuiti a OSM.
- Nessun contenuto di terzi (foto, recensioni, testi integrali) è stato copiato.
- Se in futuro il database dovesse essere rilasciato come *Derivative Database* ODbL, verificare prima che i diritti sui dati di terzi lo consentano.

## 7. Tile provider per la mappa

Per questa prima versione si utilizzano i tile standard di OpenStreetMap (`tile.openstreetmap.org`) con attribuzione visibile, rispettando la Tile Usage Policy (uso modesto, nessun prefetch/scraping, HTTPS, cache lato client). La policy disciplina l’infrastruttura tile, non l’ODbL dei dati. Prima di un traffico rilevante valutare un provider dedicato (es. MapTiler: richiede attribuzione `© MapTiler © OpenStreetMap contributors`, condizioni e limiti per piano) o l’hosting proprio, documentando costi e requisiti.

## 8. Riferimenti

- https://www.openstreetmap.org/copyright
- https://opendatacommons.org/licenses/odbl/1-0/
- https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- https://operations.osmfoundation.org/policies/tiles/
