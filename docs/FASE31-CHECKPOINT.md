# Fase 31 — Espansione del catalogo (3 novembre 2026)

## Esito

Catalogo portato da **500 a 511 attività** e da **219 a 225 località**, con **11 fonti ufficiali** aggiunte (1.094 → 1.105). Coordinate verificate invariate (82): le nuove schede hanno `coordinate: null`.

| Lotto | Candidati | Nuove | In revisione | Report |
| --- | --- | --- | --- | --- |
| fase31-01 | 13 | 5 | 8 | `data/reports/fase31-01-applicato.json` |
| fase31-02 | 6 | 6 | 0 | `data/reports/fase31-02-applicato.json` |

Nuove schede: `dalmasso-1913-imperia`, `quaranta-campobasso`, `musci-catanzaro`, `mosele-bolzano`, `mazzonetto-udine`, `del-giudice-pozzuoli`, `arte-doro-ostuni`, `guzzi-soverato`, `grasso-acireale`, `chelios-orosei`, `giorgetti-vasto`.

Nuove località: Pozzuoli (NA), Ostuni (BR), Soverato (CZ), Acireale (CT), Orosei (NU), Vasto (CH), con codice ISTAT dal CSV ufficiale e anagrafica rigenerata.

## Metodo

1. Scouting su città prive di copertura, solo siti ufficiali dell'attività.
2. Verifica HTTP: CAP e via devono comparire nel testo della pagina (o nella pagina contatti); telefono e servizi trascritti dalla pagina, senza estensioni.
3. Deduplica contro il catalogo: 25 dei 39 candidati erano già censiti (17 per dominio/nome, 8 segnalati dal controllo interno come possibili duplicati). Nessuna seconda scheda pubblicata.
4. Controllo geografico ISTAT bloccante: 225 località, 0 errori.
5. Test 278 pass / 0 fail, `npm run check` 0 errori 0 warning, build e pacchetto Pages da 914 file.

## Rilascio

- Anteprima: deployment `834d5907` (`https://834d5907.orologiai-it.pages.dev`), 511 schede, sitemap 872 URL, API AI con criteri corretti.
- Produzione: deployment `30050018`, branch `pubblicazione-gratuita-scardi-20261022`, verificata su `https://www.orologiai.it` (schede nuove 200, sitemap 872 URL, 511 schede in `/cerca/`, redirect 308, API AI attiva).
- Rollback: deployment `70cd7c93` (500 attività), stesso branch.

Registro candidati e stato completo: `data/fase31/registro-candidati.json` (11 verificati, 25 duplicati, 3 sospesi).

## Sospesi

`officine-complicato-pescara`, `clementi-bolzano`, `officina-del-tempo-olbia`: nessun indirizzo con CAP e via sul sito ufficiale, quindi non inseriti.

## Prossimo passo verso 550

Servono 39 nuove attività autentiche. Il catalogo è denso nelle città medie: conviene lavorare su comuni minori non coperti (Abruzzo interno, Campania non costiera, Puglia interna, Calabria ionica, Sicilia sud-orientale, Sardegna interna) e su laboratori di restauro/ pendoleria raggiungibili solo tramite sito proprio, con la stessa verifica HTTP e la deduplica interna come gate.
