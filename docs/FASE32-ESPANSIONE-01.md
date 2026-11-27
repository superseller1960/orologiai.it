# Fase 32 — Espansione, lotto 01 (`fase32-01`)

Data del lotto: 3 novembre 2026
Produzione di partenza: `4b404744-79fe-4021-a24c-87050af56597` (511 attività, 225 località, 1.105 fonti, 82 coordinate)
Catalogo dopo l'archiviazione Chelos: 510 attività

## Metodo

1. Raccolta candidati su tutte le regioni e deduplica immediata contro l'intero catalogo (id, slug, dominio, telefono, indirizzo+CAP) e contro il registro persistente `data/fase31/registro-candidati.json`.
2. Gate geografico obbligatorio per ogni attività: codice ISTAT, denominazione del comune, provincia e sigla, regione, indirizzo e CAP, frazione distinta quando presente. Fonte canonica dell'anagrafica di progetto: `data/anagrafica/comuni-catalogo.json` (per la Sardegna valgono i codici dei nuovi assetti territoriali 2026).
3. Conferma dei recapiti sulla pagina ufficiale dell'attività (`scripts/fase32-conferma-recapiti.mjs`): un recapito non riscontrato non viene pubblicato.
4. Servizi attribuiti solo se dichiarati dalla pagina ufficiale, distinti tra riparazione, revisione, restauro, assistenza, laboratorio orafo, vendita. Nessuna assistenza ufficiale di marca senza pagina ufficiale del marchio, nessuna autocertificazione.
5. Generazione del lotto (`scripts/fase32-genera-lotto.mjs`) e integrazione con `scripts/integrate-reviewed-batch.ts` in modalità `--apply`, con vincoli di lotto verificati da `site/src/lib/reviewed-import.ts`.
6. Normalizzazione delle località (`scripts/fase32-normalizza-localita.mjs`), chiusura delle località rimaste vuote con redirect 301 (`scripts/fase32-chiudi-localita-vuote.mjs`), aggiornamento del registro (`scripts/fase32-registro.mjs`).

## Esito del gate

| Esito | Voci |
| --- | --- |
| Ammessi al lotto | 18 |
| Pubblicati | 17 |
| In revisione (non pubblicati) | 1 |
| Sospesi dal gate geografico | 8 |
| Duplicati scartati | 61 |

### Attività pubblicate (17)

| id | Nome | Comune | Tipi |
| --- | --- | --- | --- |
| `orologiaio-zaccaria-angelo-pulsano` | Orologiaio Zaccaria Angelo | Pulsano (TA) | orologeria, laboratorio |
| `officina4-watchmaking-merano` | Officina4 Watchmaking | Merano (BZ) | orologeria, laboratorio |
| `poli-maier-bressanone` | Poli Maier | Bressanone (BZ) | orologeria, laboratorio |
| `tarondo-orologiai-tavagnacco` | Tarondo Orologiai | Tavagnacco (UD) | orologeria, laboratorio |
| `tempo-prezioso-bologna` | Tempo Prezioso Bologna | Bologna (BO) | orologeria, laboratorio |
| `arte-orafa-traversi-cave` | Arte Orafa Traversi | Cave (RM) | gioielleria, orologeria, laboratorio |
| `cimafonte-orologi-napoli` | Cimafonte Orologi | Napoli (NA) | orologeria, laboratorio |
| `la-clinica-dell-orologio-bernareggio` | La Clinica dell'Orologio | Bernareggio (MB) | orologeria, laboratorio |
| `legnano-orologeria-paternostro-1972` | Legnano Orologeria Paternostro 1972 | Legnano (MI) | orologeria, laboratorio |
| `sandrone-gioielli-moncalieri` | Sandrone Gioielli | Moncalieri (TO) | gioielleria, orologeria |
| `parolin-1885-rosa` | Parolin 1885 | Rosà (VI) | orologeria, laboratorio |
| `orologeria-martini-bassano-del-grappa` | Orologeria Martini | Bassano del Grappa (VI) | orologeria |
| `otto-gioielli-montebelluna` | Otto Gioielli | Montebelluna (TV) | gioielleria, orologeria, laboratorio |
| `gioielleria-tomasi-trento` | Gioielleria Tomasi | Trento (TN) | gioielleria, orologeria, laboratorio |
| `bellucci-echi-e-luci-martina-franca` | Bellucci Echi e Luci | Martina Franca (TA) | orologeria, laboratorio |
| `capodagli-1937-senigallia` | Capodagli 1937 | Senigallia (AN) | orologeria, laboratorio |
| `r-rubini-arte-del-tempo-fidenza` | R. Rubini Arte del Tempo | Fidenza (PR) | orologeria |

### In revisione (1)

| id | Nome | Comune | Motivo |
| --- | --- | --- | --- |
| `l-orologiaio-sardegna-porto-torres` | L'Orologiaio Sardegna | Porto Torres (SS) | Stesso indirizzo (Via Libio 15, 07046) di `lorologiaio-ascione-porto-torres`, domini diversi (`lorologiaiosardegna.com` / `lorologiaio.net`). Titolarità non chiarita: nessuna seconda scheda pubblicata finché la relazione tra le due insegne non è documentata. |

### Sospesi dal gate geografico (8)

Nessuna pubblicazione: indirizzo, CAP o telefono non confermabili sulla pagina ufficiale, quindi collocazione ambigua.

| id | Motivo |
| --- | --- |
| `orologeria-magno-bari` | CAP, via e telefono non riscontrati nelle pagine ufficiali consultate |
| `gioielleria-bisciardi-avezzano` | CAP non pubblicato e non confermabile |
| `gioielleria-spinelli-cesano-maderno` | CAP non riscontrato nella pagina ufficiale |
| `lissi-gioielli-rho` | Indirizzo non pubblicato, CAP non confermato |
| `cm-orologi-alba` | CAP non riscontrato nelle pagine ufficiali consultate |
| `zanoni-preziosi-trento` | Indirizzo e CAP non pubblicati: collocazione ambigua |
| `formica-francesco-citta-di-castello` | CAP non riscontrato nella pagina ufficiale |
| `l-orologio-imola` | CAP del record (41026) errato per Imola e non confermato dal sito |

## Duplicati scartati

61 candidati già presenti in catalogo o nel registro scartati senza creare alcuna scheda. Il riepilogo del registro riporta 62 voci duplicate perché conta anche la scheda in revisione, che è già presente in catalogo e viene gestita a parte: 87 candidati = 17 pubblicati + 1 in revisione + 8 sospesi + 61 duplicati. Verifica di equivalenza del lotto: `data/reports/fase32-equiv-01b.json` → `{ nuove: 0, aggiornate: 0, giaPresenti: 17, inRevisione: 1 }`.

## Località

11 località del lotto: `pulsano`, `bressanone`, `tavagnacco`, `cave`, `bernareggio`, `legnano`, `rosa`, `bassano-del-grappa`, `montebelluna`, `senigallia`, `fidenza`. Le altre attività sono ricadute su località esistenti (Bologna, Merano, Napoli, Trento, Porto Torres, Martina Franca, Moncalieri).

Località rimosse perché rimaste senza attività: `orosei`, con redirect 301 a `/orologerie/sardegna/nuoro/` registrato in `data/anagrafica/redirect-territoriali.json`. Bressanone è stata allineata alla nomenclatura canonica (`Bolzano`, `Trentino-Alto Adige`) per evitare una 21ª regione fittizia e un secondo URL di provincia.

## Stato del catalogo

| Voce | Prima (post-Chelos) | Dopo |
| --- | --- | --- |
| Attività | 510 | **527** |
| Località | 225 | **235** |
| Fonti | 1.105 | **1.127** |
| Coordinate | 82 | 82 |

Regioni: 20 (nessuna denominazione duplicata). Report di integrazione: `data/reports/fase32-integrazione-01.json`.

## Validazioni

| Controllo | Esito |
| --- | --- |
| `npx tsx scripts/validate.ts` | Dati validi: 527 attività, 235 località; 8 record storici conservati |
| `npx tsx scripts/validate-geografia-fase30.ts` | `{"localita":235,"errori":0}` |
| `node scripts/fase31b-valida-servizi.mjs` | 527 attività, `problemi: []` |
| `npm run check` | 0 errori |
| `npm run build` | Completo |
| `npm test` | 291 test, 286 pass, 0 fail |

## Pubblicazione

| Ambiente | Riferimento |
| --- | --- |
| Preview | `https://0699e959.orologiai-it.pages.dev` (alias `https://fase32-integrale-preview-202.orologiai-it.pages.dev`) |
| Deployment preview | `0699e959-e2d1-4dce-82d6-ca2279471f4f` |
| Produzione | `https://www.orologiai.it` |
| Deployment produzione | `02006597-9987-4116-9f05-e80ebebea187` |
| Branch di produzione | `pubblicazione-gratuita-scardi-20261022` |
| Rollback | `4b404744-79fe-4021-a24c-87050af56597` |

Verifiche HTTP sulla produzione: `/` 200, nuova scheda Pulsano 200, `/orologerie/puglia/taranto/pulsano/` 200, `/orologerie/sardegna/nuoro/orosei/` → 301 verso `/orologerie/sardegna/nuoro/`, `/cerca/` 200, tutte le 17 schede pubblicate 200.

## Checkpoint

`data/checkpoint/FASE32-CHECKPOINT.txt` — impronta `3ba73d5f7f711464b7f9cf911aa4e43b624874bc65ae24731a06b203ed99831d`, 183 file (esclusi segreti, build e dipendenze). Il Git HEAD non è usato come versione di riferimento. Il checkpoint è stato rigenerato dopo l'aggiunta di `scripts/fase32-registro.mjs`; `docs/` non rientra nell'impronta.

## Note residue

- La provincia MB ha due slug preesistenti: `monza-e-della-brianza` (dominante) e `monza-e-brianza` (usato da Besana in Brianza). Difetto anteriore a questa fase, non introdotto dal lotto.
- `officina4-watchmaking-merano`: la via non è ripetuta nel testo della pagina ufficiale; resta quella del record di ricerca e va riconfermata al prossimo aggiornamento.
