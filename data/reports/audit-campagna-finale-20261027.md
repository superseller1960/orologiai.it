# Audit documentale nazionale — report finale di campagna, 27 ottobre 2026

Campagna Fase 9–10: audit retrospettivo delle 101 schede introdotte nei lotti 5–8, correzione dei dati errati e pubblicazione progressiva su Cloudflare.

## Stato finale del catalogo

| Indicatore | Valore |
|---|---|
| Attività totali | **265** (264 iniziali + Jolly Gallery, Asti) |
| Località (comuni) | 160 |
| Province coperte | 108 |
| Regioni coperte | 20 (tutte) |
| Fonti totali | **631** (597 iniziali → 631) |
| Coordinate verificate | 4 (nessuna inventata) |
| Attività con laboratorio (tipi) | 123 |
| Attività con anno di fondazione documentato | 64 |
| Attività con assistenza ufficiale | 14 (15 relazioni) |
| Attività con rivendita ufficiale | 93 (114 relazioni) |
| Sitemap | 545 URL |
| Segnalazioni aperte (registro interno) | 54 |

## Attività dei lotti 5–8 sottoposte ad audit

| Gruppo | Lotto | Schede | Esito |
|---|---|---|---|
| 1 | 7 (prima parte) | 15 | completato, pubblicato (`9249b2ac`) |
| 2 | 7 (seconda parte) | 13 | completato, pubblicato (`1c5dc745`) |
| 3 | 6 (prima parte) | 16 | completato, pubblicato (`406b0790`) |
| 4 | 6 (seconda parte) | 16 | completato, pubblicato (`2add3f55`) |
| 5 | 5 (Nord-Ovest) | 11 | completato, pubblicato (`ed663680`) |
| 6 | 5 (Nord-Est/Emilia) | 15 | completato, pubblicato (`4880f90d`) |
| 7 | 8 | 15 (11 verificate + 4 approfondimenti) | completato, pubblicato (`7ac008ac`) |
| **Totale** | | **101 esaminate** | **101 con esito registrato** |

Esito complessivo sulle 101: **~70 completamente convalidate**, **~31 con limiti documentati** (segnalazioni aperte per fonti non leggibili, locator dei marchi HTTP 403, varianti di recapito), **0 con contraddizioni irrisolte**.

## Errori reali corretti (principali)

- **Domini/fonti errate o attribuite ad altre sedi**: 57 ref fonti sostituite nel gruppo 4 (schede Hamilton/Mido duplicate), 1 nel gruppo 5, 2 nel gruppo 7.
- **Recapiti corretti**: Vincenzo Salerno (civico e telefono), Fratelli Gallo (email aggiunta), Digiesi (email e sito aggiunti), Cheope (email aggiunta), Errani/Galdi e altri nei rispettivi gruppi.
- **Servizi non supportati rimossi**: Orolab «vendita usati», Clementi «ricambi», Comentale «lucidatura», Tarlociaru «vendita», Feni «laboratorio interno», Burrascano «restauro vintage», L'Orologiaio «preventivo gratuito».
- **Cronologie corrette**: Pace Gioielli (Ostuni 1970 → Brindisi 2011), Fratelli Gallo (Siderno 1956 → Cosenza 2019), Passerini, Federici, Volta, Cadoppi (1922), Comentale (1984/2001), L'Orologiaio (2001), Reggiani (1989), Pretolani (1985), Astrua (1993).
- **Marchi riclassificati** (esempi di lavorazione o menzioni non più presentati come riparazioni/vendite): Zenith/Rolex (Clementi), Tudor (Camparini), Omega (Pretolani), Hamilton (Gasser), OPS ecc.

## Autorizzazioni ufficiali: riesame completo

- **Riclassificate su fonte primaria**: Errani Omega (assistenza → rivendita), Gasser Hamilton (vendita → assistenza ufficiale «Official Service Center»), Digiesi Hamilton (rivendita → centro assistenza ufficiale), Nitta Hamilton (+ rivendita ufficiale), Ranzi Omega (+ rivendita ufficiale), Fusco Breil (+ assistenza ufficiale), Henry Mido (riconfermata da scheda specifica).
- **Autodichiarazioni separate dai campi ufficiali** (regola gruppo 2 bis): Volta, Bonvicini, Zanaboni, Clivio, Ciletti, Pace, Franco Cuomo, Camparini, S.T.S., Pretolani, Cernigoi, Galdi, Fratelli Gallo, Digiesi (IG). Pagina ufficiale del marchio non leggibile (403) → qualifica conservata come dichiarazione dell'attività con segnalazione aperta, mai come certificazione indipendente.

## Anomalie ancora aperte

1. **Locator dei marchi HTTP 403** (Rolex, Tudor, IWC, Seiko): impediscono la verifica primaria di ~10 qualifiche autodichiarate. Non aggirabili legittimamente in questa sessione.
2. **Varianti di recapito**: Nitta (telefono/civico/email), Orzelleca (civico), Isi Avellino (telefono), Franzè (telefono), Vincenzo Salerno (Longines), Cheope (civico), Rizzuto/Delfino/Dupanloup (gruppo 5).
3. **Siti non leggibili in sessione**: Ranzi (timeout), Giberti (widget), Laboratorio Orologiaio (TLS), Merola parziale, Zambon parziale, Cadoppi parziale, Giuliano (estrazione). Dati mantenuti con le fonti registrate, mai cancellati per irraggiungibilità.
4. **Ruoli da approfondire**: Mido di Ranzi (locator generico), marchi Dobner Gorizia, OPS garanzia.

## Test e deployment

- Test: **230 superati** + test DOM di ricerca e assistente (suite `npm run verify`).
- Deployment di produzione pubblicati in campagna: `9249b2ac`, `1c5dc745`, `406b0790`, `2add3f55`, `ed663680`, `4880f90d`, `7ac008ac` — tutti sul branch `pubblicazione-gratuita-scardi-20261022`, ciascuno verificato su https://www.orologiai.it.
- Preview per gruppo: `110f2132`, `18d421d7`, `441866c1`, `6598df9a`, `eb569b5f`, `4702b864` e relative.

## Backup esportabili (in `export/`, da scaricare fuori Freebuff)

- Per ogni gruppo: `orologiai-audit-gruppoN-20261027.zip` (sorgente), `.bundle` (Git), `directory-audit-gruppoN-20261027.json` (database), `audit-gruppoN-20261027.sha256` (manifest).
- Copertura backup diretta: gruppi 1, 2, 6, 7. Per i gruppi 3–5 valgono i commit Git (`d4c87b4`, `227ddba`, `0f46e8f`) recuperabili dal bundle del gruppo 6/7, che include l'intera storia.
- Checkpoint finale: `export/orologiai-audit-finale-20261027.*` (sorgente, database, bundle, manifest SHA-256).

## Prossimi passi suggeriti

1. Verificare con accesso diretto (fuori dal blocco 403) le ~10 qualifiche Rolex/Tudor/IWC/Seiko autodichiarate.
2. Risolvere le ~10 varianti di recapito con una seconda fonte primaria.
3. Riprendere l'espansione nazionale (province con poche attività) con il metodo di acquisizione rafforzato.
4. Sottoprogetto georeferenziazione degli indirizzi confermati.
