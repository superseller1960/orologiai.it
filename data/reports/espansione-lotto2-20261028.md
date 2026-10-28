# Espansione Lotto 2 — 15 nuove orologerie verificate

Data: 28 ottobre 2026 · Branch locale: `feature/schede-orologerie-ux` · Commit: `0ba549d`

## Controllo di coerenza preliminare (punto 2 del brief)

**A. Conteggio località — misurato sui commit, nessuna perdita di dati.**

| Snapshot | Attività | Località | Comuni unici |
|---|---|---|---|
| `f717525` (fine audit 27/10) | 265 | 160 | 160 |
| `3284e02` (fine Lotto 1) | 279 | 166 | 166 |
| `0ba549d` (questo lotto) | 294 | 173 | 173 |

- Il valore «160» dell'audit era corretto: il «155» scritto nel report del Lotto 1 era un **misconteggio** (baseline errata), non una perdita. Confronto per ID fra `f717525` e il database attuale: **nessuna località e nessuna attività preesistente è andata persa**.
- Il Lotto 1 aggiunse in realtà **6 nuovi comuni** (prato, carrara, mirano, rovereto, este, porto-torres): le altre `creaLocalita` riguardavano comuni già censiti (rimini, brescia, mantova, lecco, biella). Il «+11» del messaggio di commit conteggiava le chiamate, non i comuni nuovi.
- **Criterio stabile adottato**: località = comuni unici in `directory.localita` (id = comuneSlug); filiali e sedi multiple non generano località distinte. Il criterio coincide sempre con i comuni unici misurati.

**B. Province monoreddito (misurate sul database reale).**
- Prima del lotto: 16 province con una sola attività (RN, BI, OT, CZ, IS, AP, CR, MB, MN, TP, EN, AG, KR, CL, OR, SU).
- Dopo il lotto: restano **4 province monoreddito: AG, CL, EN, IS** — nelle quali i ricercatori non hanno trovato candidati con documentazione sufficiente (vedi esclusioni). Province a 2 attività: 58 (priorità del Lotto 3).

## Risultati del lotto

- Candidati esaminati: **20** (4 ricerche parallele su 16 province monoreddito, con metodo di verifica rafforzato).
- Candidati esclusi: **5** (motivazioni sotto).
- **Nuove attività inserite: 15** · schede esistenti arricchite: 0 · duplicati evitati: 0 collisioni nuove (11 collisioni dominio/telefono rilevate dal controllo automatico sono tutte gruppi preesistenti già gestiti come sedi-distinte: Astrua, Dobner, Errani, ecc.).
- Province coinvolte: 12 (TP, CZ, KR, AP, RN, CR, MB, MN, BI, OT, OR, SU).
- **Nuovi comuni: 7** (mazara-del-vallo, erice, riccione, castelleone, desio, villacidro, catanzaro); crotone e san-benedetto-del-tronto già censiti, arricchiti da nuove sedi distinte.
- Attività totali: **279 → 294** · Località/comuni: **166 → 173** (criterio stabile) · Fonti: **684 → 720** (36 nuove).
- Laboratori documentati: 10 nuovi fra laboratori propri e riparazioni documentate.
- Botteghe con storia documentata: Superti (1960), Cenciarini (1979 su Gobbi 1946), Boglietti (1886 autodichiarato), Nozzetti (1982 autodichiarato), Cellini (1989), Piccinini (1936 autodichiarato), Officina del Tempo (1946 autodichiarato), Bottega del Tempo (2021, padre dal 1970).
- **Autorizzazioni ufficiali documentate da fonti primarie: 5 qualifiche su 5 attività** (tutte verificate personalmente aprendo le pagine dei locator):
  - Centro assistenza ufficiale **OMEGA** — La Macchina del Tempo, SBT (Service Center OMEGA).
  - Centro assistenza ufficiale **Hamilton** — Officina del Tempo di Alessandro, Olbia.
  - Rivenditore ufficiale **Longines** — Gioielleria Amantia & Figli, Trapani.
  - Rivenditore ufficiale **Longines** — Boglietti Gioielliere, Biella.
  - **Seiko** Premium Retailer + rivenditore ufficiale **Tissot** — Aurum Gioielleria, Crotone.

## Esempi reali pubblicati (https://www.orologiai.it)

1. **Officina del Tempo di Alessandro** — Olbia (SS), Via Mameli 9 — *centro assistenza ufficiale Hamilton* (locator primario): https://www.orologiai.it/orologeria/officina-del-tempo-olbia/
2. **La Macchina del Tempo — San Benedetto del Tronto** (AP), Via F. Crispi 114/118 — *Service Center OMEGA* con diagnostica e prova impermeabilità: https://www.orologiai.it/orologeria/la-macchina-del-tempo-san-benedetto/
3. **Cenciarini Gioielleria** — Riccione (RN), Viale Ceccarini 16 — laboratorio interno, orologi da tasca, dal 1979: https://www.orologiai.it/orologeria/cenciarini-gioielleria-riccione/
4. **Oreficeria Superti** — Castelleone (CR), Via Roma 26 — bottega dal 1960, restauro orologi antichi: https://www.orologiai.it/orologeria/oreficeria-superti-castelleone/
5. **Cellini Gioielli** — Erice (TP), Via Cesarò 60/62 — riparazioni, restauri e costruzione orologi antichi e moderni, dal 1989: https://www.orologiai.it/orologeria/cellini-gioielli-erice/

Altre 10: Nozzetti (Mazara del Vallo), Amantia (Trapani), Aurum (Crotone), Del Borgo (Rimini), Centro Tecnico Orologeria (Desio), Piccinini Orologiai (Mantova), Marrocu (Villacidro), Boglietti (Biella), Maicol (Oristano), La Bottega del Tempo Orologeria (Catanzaro).

## Esclusioni motivate

| Candidata | Località | Motivo |
|---|---|---|
| Spallitta Venerino | Agrigento | Solo scheda directory (MisterImprese), nessuna conferma di attività attuale |
| Repoli Domenico | Piazza Armerina (EN) | Solo directory (Guida Sicilia), nessun servizio orologiaio documentato |
| Riparazioni Orologi Brighindi | San Benedetto del Tronto | Solo directory, nessun recapito né conferma di operatività |
| Atzori Virgilio | Cabras (OR) | Solo directory (Reteimprese/AziendeInRete), nessuna fonte primaria |
| Oro In (Ucciferri Maria) | Isernia | Attività e recapiti verificati, ma nessun servizio orologiaio documentato |

Segnalazione di ricerca: **Oreficeria Coda (Biella)** risulta **chiusa il 31/07/2025** (Il Biellese) — mai censita, non inserita. **Selvaroli (Carbonia)**: indirizzi discordanti fra fonti, candidato accantonato.

## Anomalie aperte e incertezze registrate nelle schede

- **2 schede con stato «da-verificare»** (pubblicate onestamente, con segnalazione esplicita): Laboratorio Orologeria Maicol (Oristano) — solo directory + rivista di settore La Clessidra, nessun sito consultabile; La Bottega del Tempo Orologeria (Catanzaro) — fonte giornalistica del 21/05/2021, apertura attuale non confermata.
- **CAP discordante** La Macchina del Tempo: 63039 (OMEGA, fonte primaria adottata) vs 63074 (directory) → registrato in segnalazione.
- **Indirizzo discordante** Boglietti: «Via Italia 12» (Longines, adottato) vs «Viale Italia 11D/12» (sito attività) → registrato.
- **CAP assenti** dove non documentati (Nozzetti, Piccinini, Bottega del Tempo): campi lasciati vuoti, mai inventati.
- **Autodichiarazioni non promosse a qualifiche** (registrate in segnalazioni): rivendita Rolex/Tudor «dal 1964» di Piccinini; concessionaria Nivada di Cenciarini; «centro assistenza certificato Omega» di Officina del Tempo (Omega solo *menzionato*); laboratorio «autorizzato dalle Maisons» di Boglietti; formazione C.A.P.A.C. di Desio; anni di fondazione autodichiarati (1886, 1946, 1982, 1936).
- Due omonimie risolte rinominando la scheda nuova (convenzione del progetto già usata per Dobner): «La Macchina del Tempo — San Benedetto del Tronto» (omonima della fiorentina lamacchinadeltempo.org) e «La Bottega del Tempo Orologeria» (omonima della romana labottegadeltempo.it).

## Verifiche e test

- `npm run verify` (check + build + test + test:ui DOM): **superato, 0 errori**.
- Test: **238/238** (230 preesistenti invariati + 8 nuovi di `tests/espansione-lotto2-20261028.test.ts`: integrazione, fonti consultate il 28/10, autorizzazioni solo da fonti marchio, autodichiarazioni non promosse, dati incerti marcati, ricerca per comune/marca, copertura provinciale).
- Nessuna asserzione indebolita: due test falliti per dati mutati sono stati risolti correggendo i dati (nomi omonimi) e ricostruendo il `dist` (fixture DOM della ricerca ferma a 279 schede).

## Deployment

- Preview: **2b4a41a6** — https://espansione-lotto2-20261028.orologiai-it.pages.dev (verificata: schede 200, homepage «294 attività», sitemap completa, API rispondente).
- Produzione precedente verificata prima della promozione: `e443b24e` (nessun intervento di altri agenti nel frattempo).
- **Produzione: 4bc36865-986d-4ae8-8376-b498f2de9702** (branch `pubblicazione-gratuita-scardi-20261022`) — verificata su https://www.orologiai.it: homepage 294 attività, nuove schede e nuove pagine comune raggiungibili, sitemap aggiornata.
- Pacchetto Pages: 625 file, 8.78 MB, `_worker.js` incluso; manifest SHA-256 del build salvato.

## Backup esportabili (directory `export/`)

| File | Contenuto |
|---|---|
| `orologiai-sorgente-lotto2-20261028.zip` | Sorgente completo (114 MB) |
| `orologiai-lotto2-directory-20261028.json` | Database autorevole |
| `orologiai-lotto2-20261028.bundle` | Bundle Git (HEAD `0ba549d`) |
| `orologiai-lotto2-build-sha256-20261028.json` | Manifest SHA-256 del pacchetto distribuito |
| `orologiai-lotto2-manifest-20261028.sha256` | Hash SHA-256 dei file di backup |

## Prossima partenza (Lotto 3)

58 province con due attività: prioritari i territori geograficamente diversi dal Lotto 1 (Nord-Ovest) e da questo (Sicilia, Calabria, Marche, Nord-Est, Sardegna, Piemonte). Poi riprovare AG/CL/EN/IS con ricerca sui comuni minori e specializzazioni rare (pendoleria, orologi da tasca, restauro).
