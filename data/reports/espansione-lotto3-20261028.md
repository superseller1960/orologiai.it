# Espansione Lotto 3 — 12 nuove orologerie verificate

Data: 28 ottobre 2026 · Commit: `3aa4e11` · Produzione: `42e926e3` (branch `pubblicazione-gratuita-scardi-20261022`)

## Risultati (294 → 306 attività)

- Candidati esaminati: **15** (3 ricerche parallele su province con 2 attività) · esclusi: **3** · inseriti: **12**.
- Province coinvolte: **11** (TE, LT, TR, BN, LE, TA, FG, NU, GR, CA, ME) · **nuovi comuni: 9** (atri, fondi, narni, telese-terme, gallipoli, martina-franca, siniscola, quartu-sant-elena, barcellona-pozzo-di-gotto).
- Conteggi: attività **294 → 306** · località/comuni (criterio stabile) **173 → 182** · fonti **720 → 752**.
- **Rivendite ufficiali documentate da locator primari, tutti verificati personalmente**: Hamilton × 4 (Luigi Freddo Gallipoli, Del Genio Martina Franca, Massimo Gioielli Foggia, Marco Danese Quartu S.E., Perdichizzi Barcellona), Mido (Del Genio), Tissot e Breil (Stoppa Grosseto). Nessuna assistenza ufficiale attribuita; Frederique Constant (Massimo) solo *menzionato* (scheda senza qualifica esplicita).
- Laboratori documentati: Paolini (Atri), DsLab e La Meridiana (Narni Scalo), Foschini (Telese Terme), L'Oncia d'Oro (Siniscola), Stoppa (Grosseto).

## Esempi pubblicati (https://www.orologiai.it)

1. **L'Oncia d’Oro** — Siniscola (NU), Via G.F. Conteddu 85 — laboratorio con riparazione, movimenti, vetri, prove impermeabilità: https://www.orologiai.it/orologeria/loncia-doro-siniscola/
2. **Gioielleria Stoppa** — Grosseto, Via Ecuador (Maremà) — laboratorio interno dal 1962, rivenditore ufficiale Tissot e Breil: https://www.orologiai.it/orologeria/gioielleria-stoppa-grosseto/
3. **Centro Clinico dell’Orologio La Meridiana** — Narni Scalo (TR), Via Tuderte 321 — automatici/quarzo/manuale, ricambi originali: https://www.orologiai.it/orologeria/centro-clinico-orologio-narni/
4. **Luigi Freddo Gioielli** — Gallipoli (LE), Corso Roma 82 — rivenditore ufficiale Hamilton, orologeria e assistenza tecnica: https://www.orologiai.it/orologeria/luigi-freddo-gioielli-gallipoli/
5. **Gioielleria Paolini** — Atri (TE), Corso Elio Adriano 73 — laboratorio interno di orologeria, storia dal primo Novecento: https://www.orologiai.it/orologeria/gioielleria-paolini-atri/

Altre 7: Magliozzi (Fondi), DsLab (Narni), Foschini (Telese Terme), Del Genio (Martina Franca), Massimo Gioielli (Foggia), Marco Danese (Quartu S.E.), Perdichizzi 1907 (Barcellona P.G.).

## Esclusioni motivate

- **Follie d'Oro (Avezzano, AQ)** — punto vendita documentato sul sito di rete, ma servizi orologeria dichiarati solo a livello di rete, non attribuibili alla sede.
- **Gold Center (Ariano Irpino, AV)** — vendita di orologi senza documentazione di marca né servizi orologiai.
- **Dorotea Gioielli (Augusta, SR)** — pagine ufficiali non leggibili, dati non verificabili direttamente.

## Anomalie aperte (registrate nelle schede)

- Del Genio: indirizzo discordante (Corso Messapia 41 da Hamilton+Mido vs Via Rossini 29 in seconda scheda Hamilton).
- Massimo Gioielli: civico 2/4 (sito) vs 2 (locator); laboratorio del 1953 storico, nessuna riparazione attuale attribuita.
- Marco Danese: email discordante (info@ vs gmail fra sito e Hamilton).
- Stoppa: civico Maremà non pubblicato; telefono alternativo Breil 056423522.
- Anni autodichiarati non verificati indipendentemente: 1876, 1907, 1962, 1965, 1953, 1950, 1994/1998, primi Novecento.
- Dati assenti mai inventati: telefono/CAP Foschini, CAP Magliozzi non citato nelle fonti lette? (CAP 04022 dalla pagina contatti), email La Meridiana.

## Verifiche e deployment

- `npm run verify`: **243/243 test** (238 + 5 nuovi del Lotto 3), check e test:ui DOM superati.
- Preview `3f1e3bed` verificata (schede 200, nuove pagine comune, sitemap, homepage «306 attività»).
- Produzione `42e926e3` verificata su https://www.orologiai.it (stesso risultato live).
- Backup in `export/`: ZIP sorgente, database, bundle Git (`3aa4e11`), manifest SHA-256 build e dei file.

## Prossima partenza (Lotto 4)

Rimanenti province a 2 attività non ancora esplorate: PO, SI, VI, AQ, CS, RC, PZ, TS, TN, BS, PD, CB, BG, LO, IM, VB, AT, VA, CO, LC, VR, VE, FE, FC, MO, RO, LI, PT, MS, MN, SS, FR, SV, SP, PC, GO, PN, RE, TE?, AV, SR. Priorità: specializzazioni rare (pendoleria, orologi da tasca, restauro) e comuni fuori capoluogo.
