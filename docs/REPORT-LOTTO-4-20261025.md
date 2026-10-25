# Report lotto 4 — risoluzione anomalie, 25 ottobre 2026

Ambito: analisi sistematica dei 60 punti aperti nei registri anomalie dei lotti 1-3
(5 + 13 + 42), correzione di ciò che era verificabile su fonti ufficiali/primarie,
inserimento delle sedi autonome diventate documentabili. Nessun dato inventato:
le anomalie non risolvibili restano tracciate nei registri.

## Dati di misura (dal registro `data/reports/lotto-04-20261025-applied.json`)

| Voce | Valore |
|---|---|
| Punti anomali esaminati | 60 (più 14 riconferme incrociate su fonti ufficiali) |
| Attività aggiornate | 20 |
| Nuove attività inserite | 4 (sedi autonome documentate, con gruppoId) |
| Nuove fonti | 14 (10 sito-ufficiale, 4 marchio-ufficiale) |
| Nuovi recapiti | 10 campi recapito su 7 schede (3 email, 4 telefono, 1 WhatsApp, 2 siti) oltre ai recapiti completi delle 4 sedi nuove |
| Informazioni storiche aggiunte | 0 (le fonti di questo lotto non documentano storia: nessun testo dedotto; le 4 descrizioni nuove sono personalizzate sui dati verificati) |
| Coordinate verificate | 0 (nessuna fonte legittima di coordinate disponibile: nessuna posizione dedotta da città o CAP) |
| Anomalie corrette | 15 |
| Anomalie rimaste | 19 (elenco nel registro) |
| Nuove segnalazioni emerse | 7 (elenco nel registro) |
| Correzioni di campo | 2 (indirizzi, con prima/dopo e fonti) |
| Totale attività in catalogo | **163** (159 → 163) |
| Test superati | **210/210** (`npm run verify` completo: typecheck 0 errori, build, test, test DOM ricerca e chat) |

## Le 4 nuove sedi (tutte documentate, nessuna coordinata inventata)

| Scheda | Gruppo | Fonte del ruolo | Autorizzazioni |
|---|---|---|---|
| Eredi Trossello Snc — Aosta | trossello | Longines store 966842 + sito gruppo | rivendita Longines («Orologi»); NON assistenza |
| Gioielleria Grande Srl — Via Aldo Moro, Frosinone | grande | Longines store 27736 + sito attività | rivendita + assistenza Longines («Service Center» dichiarato) |
| Italico Ronzoni — Via Cavour, Udine | ronzoni | Seiko store 259820 | rivendita Seiko («Premium Retailer») |
| Valenti Srl — Via Farini, Parma | valenti | Longines store 143483 | rivendita + assistenza Longines («Servizio Clienti») |

Distinzione mantenuta: la sede Valenti di Nino Bixio resta **solo rivenditore**
(la scheda Longines 143474 non dichiara «Service Center»); analogamente Stema Termoli
solo rivendita. Wargas & Sisti Ancona ha invece ricevuto l'assistenza ufficiale Longines
che la scheda 143217 dichiara esplicitamente.

## Correzioni verificate (prima/dopo nel registro)

1. `gioiellerie-torelli-cremona`: indirizzo «Corso Campi 15» → «Corso Campi 21 A»
   (sito dell'attività + scheda IWC; le schede Longines/Omega riportano ancora il 15,
   discrepanza tracciata). Recapiti storici invariati.
2. `fabiani-gioiellerie-pistoia`: indirizzo «Via Cino da Pistoia 13» → «Via Cino da
   Pistoia 2/D» (sito dell'attività + scheda Longines; il civico 13 della scheda Hamilton
   era errato). Recapiti storici invariati.

## Anomalie corrette (15) — sintesi

Sedi secondarie diventate schede autonome (Trossello Aosta, Grande Via Aldo Moro,
Ronzoni Via Cavour, più Valenti Via Farini emersa dal confronto dei ruoli); recapiti e
orari recuperati su fonti leggibili per rocca, gibi-shop-ancona, amighini-verona,
orafi-italiani-rovigo, birbio-gioielli-siracusa, angelini (solo email/orari); orari
stagionali documentati per la stagione in corso (agnolucci Signa e Poggio a Caiano);
qualifiche di marchio verificate parola per parola (Bigalli e De Luca confermati);
orari già presenti riconfermati con nuove fonti di verifica (bigalli, rabiti, fani,
sangalli); sammartino (conflitto orari) chiuso perché la pagina discordante non è più
accessibile e la pagina contatti conferma i dati.

## Anomalie rimaste (19) — nessuna chiusura artificiale

Conflitti fra fonti ufficiali non risolvibili senza il titolare (telefono angelini Monza,
telefono eyes-on-time Venezia, CAP giorgi Ancona, indirizzo torelli ancora discordante
nelle schede dei marchi, località de-marchi Aosta/Pollein, email sangalli); dati non
rappresentabili nello schema (orari stagionali doppi, orari senza giorni, chiusure
mensili, seconde sedi già registrate come note, giorni non indicati dalle fonti);
politica recapito principale (numeri cellulari, secondi fissi); fonti non leggibili
(pirone, luccini, fenocchi, carrieri sabato, macchina-tempo-bari email solo da Facebook,
scardi email in forma dubbia); esclusioni corrette di servizi non di orologeria
(follie-oro, massari, tebaldi pendoli) conservate come avvertenza.

## Preservazione dei lavori esistenti (Codex/Work)

- Nessuna modifica a homepage, ricerca guidata, filtri, pagine attività, sezioni
  editoriali, mappe, assistente, API, redirect, SEO o template: il lotto interviene su
  `site/data/directory.json` (dati), test e report.
- Il collaudo della preview ha verificato che tutte le funzionalità rispondano:
  pagine scheda (200), sitemap (163 schede, 372 URL), API 405/200/415/403,
  `/api/posizione` 200, redirect 301 apex→www invariato.
- Nessun intervento sul progetto MOVIMENTO V3 (Patek Philippe): non toccato.
- GitHub non è stato usato in alcun modo (nessun push/fetch/pull/PR): Git locale solo
  per commit e confronti, come da istruzione definitiva.

## Rilascio

| Voce | Valore |
|---|---|
| Pipeline | `npm run package:pages` → `.runtime/pages-build` (395 file, 5,19 MB) → Wrangler 4.152.0 Direct Upload |
| URL preview | https://1d7e1a6b.orologiai-it.pages.dev (alias `preview-lotto4-20261025.orologiai-it.pages.dev`) — collaudata prima della promozione |
| Deployment ID produzione | `9167faec-3fb7-4c34-9ddd-407488747736` (creato 2026-10-25T18:47:23Z, branch `pubblicazione-gratuita-scardi-20261022`) |
| Produzione precedente | `a8ce48e2-dea4-44fa-830d-20474332a83a` (rollback disponibile) |
| Verifica su www.orologiai.it | home 200, apex 301, nuove schede servite, indirizzi corretti renderizzati, sitemap 163 schede, API 405/403/200 |

## Backup durevole (commit `6a87393`)

| File | Contenuto | SHA-256 |
|---|---|---|
| `export/orologiai-backup-repo-lotto4-20261025.bundle` | Git bundle completo del branch (storia verificata) | `9dc5fdf7ed6a1674963c87070084175c98e8ddc7bc438df2aafda98dcbaf4c81` |
| `export/orologiai-directory-lotto4-20261025.json` | Copia del database | `e51e74bcd3a611dbffc1e0c8f64e7717120bd7386bfc93fbbc1158dbcb04fa87` |
| `export/orologiai-checkpoint-lotto4-20261025.json` | Manifest: hash, commit locali, deployment ID, procedura di ripristino | `f8b9476a77cb24a22ab54c981041893c9b9f2718a4c561b0c8c2b98e1aa5b3a8` |
| `export/orologiai-checkpoint-lotto4-20261025-SHA256SUMS.txt` | Somme di controllo | — |
| `export/orologiai-sorgenti-lotto4-20261025.zip` | ZIP dei sorgenti (rigenerabile con `git archive`; fuori Git per la regola `*.zip`) | `eeed52b5662771f35cdc5ac1928bf6b9fb39779c896fcbb2ce116821789f8c1e` |

Procedura di ripristino: nel manifest checkpoint (8 passaggi, dal `git clone` del bundle
fino alla verifica del dominio, con rollback rapido al deployment `a8ce48e2`).

## Commit locali del lotto

- `fc730d0` Lotto 4: risolve 15 anomalie documentali, corregge 2 indirizzi e aggiunge 4 sedi autonome
- `966a7d7` Rigenera il bundle API Vercel con il database del lotto 4
- `6a87393` Checkpoint durevole del lotto 4

## Prossimo lotto (priorità 2 e 3)

Arricchimento delle 159+4 schede sui campi ancora incompleti (priorità 2) ed espansione
geografica verso province e città secondarie con 15-25 nuove attività documentate per
lotto (priorità 3), con lo stesso schema: ricerca fonti → aggiornamento → build e test →
preview → produzione → checkpoint → report.
