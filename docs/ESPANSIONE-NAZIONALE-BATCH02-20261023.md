# Espansione nazionale avanzata — 23 ottobre 2026

## Esito verificato locale

- Base: PR #5 aperta, branch `feature/freebuff-directory-expansion-20261023`, commit `2a207dfd006c2729c774743889888c5e736e3f25`. Correzione CI build-prima-test conservata.
- Branch isolato: `feature/freebuff-national-expansion-batch02-20261023`. Nessuna modifica al branch PR5 o produzione, nessun merge.
- Produzione di riferimento `pubblicazione-gratuita-scardi-20261022`: fetch iniziale a `71e47a5`; configurazione effettiva pubblicata NON confermata, accesso Cloudflare escluso.
- PR5 e check `verify` GitHub Actions: aperta e success sul commit base alla lettura iniziale. I branch UX e le PR preesistenti non sono incorporati né modificati.

- Attività: **106 → 155 (+49)**.
- Località: **61 → 101 (+40)**.
- Fonti: **174 → 236 (+62)**.
- Province/UTS rappresentate: **44 → 82 (+38)**; 28 UTS restano scoperte su 110. Tutte le 20 regioni restano presenti.
- Tutti i record iniziali di attività, località e fonti sono identici. Nessun duplicato introdotto dai controlli della pipeline, nomi normalizzati/indirizzi/siti, ID e slug. Coordinate verificate: 4 → 4.

## Matrice amministrativa

Fonte XLSX ISTAT effettivamente scaricata e analizzata: https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx . Pagina ufficiale letta: https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/ . Aggiornamento dichiarato 21 febbraio 2026, 7.894 righe di comuni e 110 UTS contate nel file. SHA-256 e conteggi prima/dopo in `data/reports/national02-province-matrix-20261023.json`.
Join per denominazione italiana normalizzata, alias esplicito Reggio Calabria → Reggio di Calabria. Vecchia località Olbia-Tempio associata alla Gallura Nord-Est Sardegna solo nel report, senza cambiare record o URL storici. Nuovo comune Sassari secondo assetto 2026.
La matrice contiene anche numero di laboratori per provincia, distingue zero/una/due-tre attività. Nessuna deduzione di copertura da una singola ricerca web.

## Lotti e controlli

| Lotto | Nuove | Totale | Test | Pagine build |
|---|---:|---:|---:|---:|
| A | 15 | 121 | 178/178 | 307 |
| B | 16 | 137 | 178/178 | 337 |
| C | 15 | 152 | 178/178 | 361 |
| D | 3 | 155 | 178/178 | 367 |

A: province scoperte. B: completamento territoriale e copertura minima (include Aosta già coperta dalla sede storica Courmayeur). C: laboratori e servizi tecnici. D: completamento Siracusa, Agrigento e Grosseto.
Ogni lotto ha file revisionato `data/import/national02-*-reviewed.json`, report dry-run e applicato, verifica completa prima del commit. Nessun candidato in sola revisione contato come integrato.

## Nuove schede

Tutte le verifiche: **2026-10-23**. Fonti primarie lette direttamente o dagli agenti di ricerca; nessun solo snippet usato per approvare. Descrizioni originali; nessuna fotografia, recensione o logo copiati.

### L’Angolo delle Ore — Novara (NO), Piemonte
- Indirizzo: Corso Cavour 1/E, 28100.
- Tipi: orologeria, laboratorio.
- Servizi: vendita, riparazione, assistenza.
- Fonte/i: https://www.angolodelleore.it/ ; https://www.angolodelleore.it/contatti/.
- Data verifica: 2026-10-23.

### Gioielleria Gaddi Zucchi — Novara (NO), Piemonte
- Indirizzo: Corso Cavour 15, 28100.
- Tipi: gioielleria.
- Servizi: vendita, manutenzione, cinturini.
- Fonte/i: https://www.longines.com/it/store/id/gioielleria-gaddi-zucchi-novara-1852354.
- Data verifica: 2026-10-23.

### Gioielleria Simonini — Vercelli (VC), Piemonte
- Indirizzo: Via F. Crispi 24, 13100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/piemonte/vercelli/gioielleria-simonini.
- Data verifica: 2026-10-23.

### Orsi Gioielleria — Verbania (VB), Piemonte
- Indirizzo: Via San Fabiano 5, 28921.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/piemonte/verbania/orsi-gioielleria.
- Data verifica: 2026-10-23.

### Gioielleria Bisio — Asti (AT), Piemonte
- Indirizzo: Corso Vittorio Alfieri 270, 14100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/piemonte/asti/gioielleria-bisio.
- Data verifica: 2026-10-23.

### Gioielleria Fontana — Varese (VA), Lombardia
- Indirizzo: Via C. Croce 9, 21100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italie/lombardy/varese/gioielleria-fontana.
- Data verifica: 2026-10-23.

### Fasola Gioielleria — Como (CO), Lombardia
- Indirizzo: Via Giuseppe Garibaldi 9, 22100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/lombardia/como/fasola-gioielleria.
- Data verifica: 2026-10-23.

### De Pascalis Spa — Lecco (LC), Lombardia
- Indirizzo: Via Cavour 30, 23900.
- Tipi: gioielleria.
- Servizi: vendita, manutenzione, cinturini.
- Fonte/i: https://www.longines.com/it/store/id/de-pascalis-spa-lecco-143569.
- Data verifica: 2026-10-23.

### Florio Folini Srl — Sondrio (SO), Lombardia
- Indirizzo: Galleria Venticinque Aprile 1, 23100.
- Tipi: gioielleria.
- Servizi: vendita, assistenza.
- Fonte/i: https://www.floriofolini.it/it/ ; https://www.floriofolini.it/it/dove-trovarci.
- Data verifica: 2026-10-23.

### Gioielleria La Marca Vittorio — Pavia (PV), Lombardia
- Indirizzo: Viale Sardegna 98/b, 27100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italia/lombardia/pavia/gioielleria-la-marca-vittorio.
- Data verifica: 2026-10-23.

### Gioiellerie Torelli — Cremona (CR), Lombardia
- Indirizzo: Corso Campi 15, 26100.
- Tipi: gioielleria.
- Servizi: vendita, manutenzione, cinturini.
- Fonte/i: https://www.longines.com/it/store/id/gioiellerie-torelli-cremona-1799010.
- Data verifica: 2026-10-23.

### Gioielleria Angelini Srl — Monza (MB), Lombardia
- Indirizzo: Via Carlo Alberto 32, 20900.
- Tipi: gioielleria.
- Servizi: vendita, manutenzione, cinturini.
- Fonte/i: https://www.longines.com/it/store/id/gioielleria-angelini-srl-monza-1678291.
- Data verifica: 2026-10-23.

### Gioielleria Giorgi Mario — Ancona (AN), Marche
- Indirizzo: Corso Giuseppe Mazzini 102, 60121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italien/marche/ancona/gioielleria-giorgi-mario.
- Data verifica: 2026-10-23.

### Gioielleria Fraschetti — Rieti (RI), Lazio
- Indirizzo: Via Roma 110/112, 02100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/lazio/rieti/gioielleria-fraschetti.
- Data verifica: 2026-10-23.

### Gioielleria Iannicelli — Caserta (CE), Campania
- Indirizzo: Via Mazzini 73/75, 81100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/caserta/gioielleria-iannicelli.
- Data verifica: 2026-10-23.

### De Marchi Gianotti — Aosta (AO), Valle d'Aosta
- Indirizzo: Piazza Chanoux 22, 11100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/valle-d-aosta/aosta/de-marchi-gianotti.
- Data verifica: 2026-10-23.

### Gioielleria Benetti — Verona (VR), Veneto
- Indirizzo: Piazza delle Erbe 37, 37121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-int/store-locator/italy/veneto/verona/gioielleria-benetti-1820494.
- Data verifica: 2026-10-23.

### Gioielleria Amighini — Verona (VR), Veneto
- Indirizzo: Piazzetta Monte 3, 37121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-hk/store-locator/italy/veneto/verona/gioielleria-amighini.
- Data verifica: 2026-10-23.

### Oreficeria De Rui — Treviso (TV), Veneto
- Indirizzo: Borgo Giuseppe Mazzini 33, 31100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italy/veneto/treviso/oreficeria-de-rui.
- Data verifica: 2026-10-23.

### Eyes On Time — Venezia (VE), Veneto
- Indirizzo: Aeroporto Marco Polo, Via L. Broglio 7, VC 15, 30173.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italy/veneto/venezia/eyes-on-time.
- Data verifica: 2026-10-23.

### Gioielleria Tebaldi — Ferrara (FE), Emilia-Romagna
- Indirizzo: Via Mazzini 7, 44100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-gb/store-locator/italy/emilia-romagna/ferrara/gioielleria-tebaldi.
- Data verifica: 2026-10-23.

### Gioielleria F.lli Cimatti — Ravenna (RA), Emilia-Romagna
- Indirizzo: Via Matteotti 20, 48121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italy/emilia-romagna/ravenna/gioielleria-f-lli-cimatti.
- Data verifica: 2026-10-23.

### Gioielleria Ricci — Forlì (FC), Emilia-Romagna
- Indirizzo: Piazza A. Saffi 49, 47121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-us/store-locator/italy/emilia-romagna/forli/gioielleria-ricci.
- Data verifica: 2026-10-23.

### Zaccarelli Orologeria — Modena (MO), Emilia-Romagna
- Indirizzo: Via Taglio 3, 41121.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/en-int/store-locator/italy/emilia-romagna/modena/zaccarelli-orologeria.
- Data verifica: 2026-10-23.

### Gioielleria Boni — Belluno (BL), Veneto
- Indirizzo: Viale Fantuzzi 22, 32100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.midowatches.com/it/store-locator/italy/belluno/gioielleria-boni-a1vnn000001zwc5yam.
- Data verifica: 2026-10-23.

### B&B Gioielli — Rovigo (RO), Veneto
- Indirizzo: Piazza Vittorio Emanuele 30, 45100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italy/veneto/rovigo/b-b-gioielli.
- Data verifica: 2026-10-23.

### Gioielleria Pedonesi — Lucca (LU), Toscana
- Indirizzo: Via Fillungo 187, 55100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/lucca/gioielleria-pedonesi.
- Data verifica: 2026-10-23.

### Casa Avelardi — Livorno (LI), Toscana
- Indirizzo: Via Ricasoli 119, 57126.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/livorno/casa-avelardi.
- Data verifica: 2026-10-23.

### Fabiani Gioiellerie — Pistoia (PT), Toscana
- Indirizzo: Via Cino da Pistoia 13, 51100.
- Tipi: gioielleria.
- Servizi: vendita.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/pistoia/fabiani-gioiellerie.
- Data verifica: 2026-10-23.

### Law & Watch di Paolo Simi — Lucca (LU), Toscana
- Indirizzo: Via di Tiglio 552, 55100.
- Tipi: laboratorio.
- Servizi: assistenza, batterie, cinturini.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/lucca/law-watch-di-paolo-simi.
- Data verifica: 2026-10-23.

### Luccini Ivano — Aulla (MS), Toscana
- Indirizzo: Via XX Settembre 26, 54011.
- Tipi: laboratorio.
- Servizi: assistenza, batterie, cinturini.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/aulla/luccini-ivano.
- Data verifica: 2026-10-23.

### Orologeria Mancuso — Como (CO), Lombardia
- Indirizzo: Via Maurizio Monti 34; CAP non importato.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, revisione, lucidatura, restauro-vintage, batterie, cinturini, vendita-usati, acquisto-permuta.
- Fonte/i: https://www.orologeriamancuso.com/.
- Data verifica: 2026-10-23.

### Orologeria Cotifava dal 1946 — Mantova (MN), Lombardia
- Indirizzo: Via Domenico Fernelli 8, 46100.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, assistenza, revisione, vendita, vendita-usati, acquisto-permuta.
- Fonte/i: https://www.orologeriacotifava.com/.
- Data verifica: 2026-10-23.

### Vergari Gioielli — Botrugno (LE), Puglia
- Indirizzo: Via Vittorio Emanuele 11, 73020.
- Tipi: gioielleria.
- Servizi: vendita, riparazione, batterie, cinturini.
- Fonte/i: https://www.vergarigioielli.it/.
- Data verifica: 2026-10-23.

### Benenati MSD — Catania (CT), Sicilia
- Indirizzo: Via G. D’Annunzio 126; CAP non importato.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, riparazione-quarzo, riparazione-meccanici, pendoleria, restauro-vintage.
- Fonte/i: https://benenati-msd4.webnode.it/.
- Data verifica: 2026-10-23.

### Clock Service — Catania (CT), Sicilia
- Indirizzo: Via Gabriele D’Annunzio 134, 95127.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, revisione, restauro-vintage, pendoleria.
- Fonte/i: https://www.clockservice.it/ ; https://www.clockservice.it/contatti/.
- Data verifica: 2026-10-23.

### Centrorologi — Gravina di Catania (CT), Sicilia
- Indirizzo: Via Carrubella 191, 95030.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, lucidatura, riparazione-quarzo, riparazione-meccanici, pendoleria.
- Fonte/i: https://centrorologi.net/servizi/ ; https://centrorologi.net/chi-siamo/.
- Data verifica: 2026-10-23.

### La Motta Gioielli — Messina (ME), Sicilia
- Indirizzo: Viale San Martino 188, 98123.
- Tipi: gioielleria, laboratorio.
- Servizi: revisione, lucidatura, manutenzione.
- Fonte/i: https://www.lamottagioielli.it/laboratorio/ ; https://www.lamottagioielli.it/rolex/contattaci/.
- Data verifica: 2026-10-23.

### Laboratorio Orologi di Andrea D’Ale — Trapani (TP), Sicilia
- Indirizzo: Via Giovanni Battista Fardella 214, 91100.
- Tipi: laboratorio.
- Servizi: assistenza, batterie, cinturini.
- Fonte/i: https://www.hamiltonwatch.com/it-it/store-locator/italie/sicilia/trapani/laboratorio-orologi-di-andrea-d-ale.
- Data verifica: 2026-10-23.

### Gioielleria Di Marco — Nicosia (EN), Sicilia
- Indirizzo: Via San Benedetto 26, 94014.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione.
- Fonte/i: https://www.gioielleriadimarco.it/chisiamo.php ; https://www.gioielleriadimarco.it/contatti.php.
- Data verifica: 2026-10-23.

### Gioielleria De Nurra — Sassari (SS), Sardegna
- Indirizzo: Via Maurizio Zanfarino 9; CAP non importato.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione, assistenza, revisione, batterie, restauro-vintage.
- Fonte/i: https://www.denurra.it/ ; https://www.denurra.it/contatti/.
- Data verifica: 2026-10-23.

### Gioielleria Chiocchetti — Lucca (LU), Toscana
- Indirizzo: Via Fillungo 20; CAP non importato.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione, revisione, manutenzione.
- Fonte/i: https://www.chiocchetti1896.com/laboratorio/ ; https://www.chiocchetti1896.com/contatti/.
- Data verifica: 2026-10-23.

### De Marco — Belluno (BL), Veneto
- Indirizzo: Piazza Mazzini 3; CAP non importato.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione.
- Fonte/i: https://www.demarco-belluno.it/contatti/ ; https://www.demarco-belluno.it/gioielleria-a-belluno/.
- Data verifica: 2026-10-23.

### Gioielleria Orafi Italiani — Rovigo (RO), Veneto
- Indirizzo: Viale Porta Adige 45G; CAP non importato.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione, revisione, manutenzione, batterie, cinturini, assistenza.
- Fonte/i: https://orafiitaliani.it/laboratorio-gioielleria-orologeria/ ; https://orafiitaliani.it/contatti/.
- Data verifica: 2026-10-23.

### Gioielleria Grande — Frosinone (FR), Lazio
- Indirizzo: Piazzale De Matthaeis 4; CAP non importato.
- Tipi: gioielleria, laboratorio.
- Servizi: riparazione, manutenzione, revisione, batterie, cinturini.
- Fonte/i: https://www.gioielleriagrande.it/centro-assistenza/ ; https://www.gioielleriagrande.it/chi-siamo/.
- Data verifica: 2026-10-23.

### Bottega Watches — Pistoia (PT), Toscana
- Indirizzo: Piazza San Francesco d’Assisi 50; CAP non importato.
- Tipi: orologeria, laboratorio.
- Servizi: riparazione, revisione, lucidatura, restauro-vintage.
- Fonte/i: https://bottegawatches.com/laboratorio ; https://bottegawatches.com/riparazione-orologi-pistoia.
- Data verifica: 2026-10-23.

### Birbio Gioielli — Siracusa (SR), Sicilia
- Indirizzo: Corso Umberto I 67, 96100.
- Tipi: gioielleria.
- Servizi: vendita, vendita-usati.
- Fonte/i: https://www.orobirbio.com/vendita-orologi-a-siracusa/.
- Data verifica: 2026-10-23.

### Martines Gioielleria — Canicattì — Canicattì (AG), Sicilia
- Indirizzo: Piazza IV Novembre 13, 92024.
- Tipi: gioielleria, laboratorio.
- Servizi: vendita, manutenzione, assistenza.
- Fonte/i: https://www.gioielleriamartines.it/assistenza-rolex-orologi-gioielleria-martines.html ; https://www.gioielleriamartines.it/privacy.html.
- Data verifica: 2026-10-23.

### Mirolli — Grosseto (GR), Toscana
- Indirizzo: Piazza Monte dei Paschi 6, 58100.
- Tipi: gioielleria, laboratorio.
- Servizi: vendita, vendita-usati, manutenzione, revisione.
- Fonte/i: https://mirolli.it/rolex/contatti/.
- Data verifica: 2026-10-23.

## Test, correzioni e limiti

- Node 24.21.0; `npm ci` riuscito (321 pacchetti, zero vulnerabilità rilevate). Avviso npm policy postinstall esbuild, build eseguita regolarmente; nessuna dipendenza aggiunta o lockfile aggiornato.
- `npm run verify` eseguito e passato separatamente per A/B/C/D: typecheck, validazione schema, build Astro, check link/canonical/sitemap/JSON-LD, 178 test e test DOM ricerca/chat.
- Quattro nuovi test N02 ricostruiscono esattamente tutti i lotti dalla base PR5, provano idempotenza, conservazione integrale, nessun nuovo duplicato/punto mappa, fonti/autorizzazioni, ricerca per nome/comune/provincia/regione/tipo/servizio/marchio, e pagine/sitemap/SEO per ciascuna nuova scheda.
- Test storico FB23 ora usa il proprio snapshot PR5: conserva le asserzioni esatte senza vietare futuri incrementi; la conservazione del dataset corrente è coperta dai nuovi test N02.
- Test assistente che pretendeva Massari nei primi risultati falliva dopo aumento rivenditori: richiesto al test elenco completo, nessuna modifica applicativa né asserzione eliminata.
- Test città non censita Venezia divenuto obsoleto: casi negativi spostati a Imola, ancora non censita, con le stesse asserzioni.
- Build B inizialmente fallita per etichetta ISTAT bilingue Valle d’Aosta: corretta solo nuova località Aosta allo slug regionale esistente `valle-daosta`, poi verifica completa rieseguita.
- Nessuna modifica funzionale necessaria: applicazione e assistente invariati. Solo dati, documentazione e test/fixture interessati. Bundle API rigenerato durante verify e ripristinato, non incluso nei commit; una futura build deliberata incorpora il nuovo dataset.
- Nessuna verifica visuale/responsive o browser interattivo eseguita; nessun dev server/preview/deploy avviato, rispettando l’isolamento richiesto. DOM non equivale a collaudo grafico.
- Mancanza dati non colmata con inferenze: CAP assenti nulli; autorizzazioni solo fonti produttore. Birbio descrive revisione dei propri vintage in vendita: non attribuita come servizio generale pubblico. Mirolli importato solo Piazza Monte dei Paschi, senza unire automaticamente indirizzo Hamilton differente.

## Candidati rinviati e questioni legali

Vedere `data/reports/national02-candidates-review-20261023.json`: patch 28–31 ancora mancanti, Satolli/Digiesi/Clementi/Dobner non ricreati; Collezionista resta escluso per termini riuso non chiariti. Cichetti, Rossetti e Artigiani Orafi: comune/CAP non coerenti da chiarire. Burrascano: servizi non associati a singola sede. Altri candidati senza indirizzo leggibile rinviati, risultati elettronica/bici scartati come non pertinenti.
Nessun nuovo dato OSM. Solo informazioni pubbliche pertinenti, niente dati privati dei titolari. La consultabilità non è licenza libera: nessuna garanzia legale sul riuso, resta revisione copyright/GDPR/diritti banche dati; obblighi ODbL dei dati storici non eliminati.

## Consegna GitHub e isolamento

Commit A `a44b44b`; B `3fb685d`; C `5331af1`; D identificabile da `git log` (questo report è incluso nel D). Tutti i commit iniziano con `[CF-Pages-Skip]`, accorgimento già documentato nel progetto per Pages.
Il prefisso non garantisce skip Vercel: documentazione ufficiale https://vercel.com/docs/git e https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel . Nessuna configurazione Vercel/Cloudflare è stata modificata. Non si dichiara isolamento di ogni pipeline automatica come verificato.
Al ricontrollo finale `cloud_git fetch` è stato negato con HTTP 403; le API GitHub pubbliche prima accessibili hanno restituito 404. Non è possibile determinare da ciò se siano cambiati visibilità, permessi o disponibilità: nessuna diagnosi inventata. Il push viene tentato solo tramite il canale autorizzato; eventuale rifiuto va riportato come mancato salvataggio remoto. Nessun token richiesto o cercato.
PR in bozza stacked da aprire solo se branch pubblicato e accesso disponibile:
https://github.com/superseller1960/orologiai.it/compare/feature/freebuff-directory-expansion-20261023...feature/freebuff-national-expansion-batch02-20261023?expand=1
Titolo proposto: **Espansione nazionale: 49 attività documentate in 38 nuove province**. Corpo: quattro lotti, 106→155 attività, 61→101 località, 174→236 fonti; 178 test per lotto, nessuna modifica assistente/infrastruttura e nessun merge/deploy. Base PR5 2a207df; rapporto e revisione candidati allegati. Impostare la PR come bozza.
