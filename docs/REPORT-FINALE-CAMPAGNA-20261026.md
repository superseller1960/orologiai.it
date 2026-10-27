# Report finale — Campagna di espansione nazionale (26 ottobre 2026)

Tutti i numeri di questo report sono calcolati su `site/data/directory.json` e sui report
di lotto in `data/reports/`, non stimati.

## Numeri di catalogo

| Voce | Inizio campagna | Fine campagna |
|---|---|---|
| Attività | 163 | **264** (+101 nette) |
| Comuni | ~130 | **160** |
| Province rappresentate | — | **108** (tutte le province italiane) |
| Regioni | — | **20** (tutte) |
| Fonti documentali | — | **574** |

Distribuzione delle nuove attività per macro-aree (lotti 5–8):
Nord e Centro-Nord (+26), Centro, Adriatico e Sud (+32), Sud e Isole (+28),
completamento province e centri minori (+15).

## Qualità delle schede (264 attività)

- Laboratori con tipologia `laboratorio`: **121**
- Botteghe con anno di fondazione documentato: **59**
- Assistenza ufficiale documentata da fonti primarie del marchio: **11 attività**
- Rivendita ufficiale documentata: **93 attività**
- Telefono pubblico: **257/264** — Sito web: **206/264**
- Coordinate geografiche verificate: **4** (vedi anomalie)

## Lotti della campagna

| Lotto | Contenuto | Attività prima → dopo | Deployment produzione |
|---|---|---|---|
| 5 | Nord e Centro-Nord | 163 → 189 | (verificato in sessione) |
| 6 | Centro, Adriatico e Sud | 189 → 221 | `713423e8` |
| 7 | Sud, Isole e province residue (7 province a zero coperte) | 221 → 249 | `d7336d7e` |
| 8 | Completamento province e centri minori | 249 → 264 | `8bcade37` |

## Lotto 8 — dettaglio

- Regioni: Campania, Puglia, Sicilia, Calabria, Basilicata, Abruzzo.
- Province: BN, CE, SA, LE, BR, TA, BT, ME, SR, CS, MT, PE.
- 15 schede inserite, 19 fonti nuove, 5 nuovi comuni censiti (Marcianise, Portico di
  Caserta, Santa Maria Capua Vetere, Angri, Lecce).
- Esempi verificati: Laboratorio Orologiaio Srl (Marcianise, laboratorio di riparazione),
  Gioielleria Galdi (Salerno, bottega dal 1949 con laboratorio tecnico interno),
  Burrascano (Messina, oltre 70 anni, cura dell'Orologio Astronomico del Duomo),
  Fratelli Gallo (Cosenza, dal 1956, laboratorio Rolex/Tudor), Digiesi 1959 (Matera,
  servizi batterie/cinturini dal locator Hamilton), Tarlociaru (Lecce, officina interna,
  terza generazione).
- Candidati scartati: già censiti (14: Mazzone, Ranieri, Pietro Roberto, Paolo Vale,
  Vergari, Birbio, Satolli, Orzelleca ×2, Ciletti, Feni, Franco Cuomo, Landi, D'Ale,
  Iacovone); Orafo e Orologiaio (Benevento) e F.lli Roberto (Cosenza) per fonti
  documentali non utilizzabili. Nessuna autorizzazione ufficiale attribuita senza fonte
  primaria del marchio (le auto-dichiarazioni dei siti sono registrate come riparazioni
  documentate, non come autorizzazioni).

## Test e collaudo

- Suite completa: **222 test, 0 falliti** (`npm run verify`), più i test DOM di ricerca e
  assistente (verde).
- Nuovi test `tests/lotto-08-20261026.test.ts`: presenza e completezza delle 15 schede,
  autorizzazioni solo con fonti del marchio, unicità di descrizioni/ID/slug, URL fonti validi.
- Aggiornamento coerente: `tests/nazionale-08.test.ts` usa Imola (ancora assente) come
  caso negativo, perché Lecce è ora realmente censita — stessa convenzione già applicata
  per Caltanissetta nel lotto 7. Nessuna asserzione indebolita.

## Deployment

- Preview lotto 8: `c7ecc8f3` (branch `lotto8-preview-20261026`) — verificata:
  homepage 264 attività, schede nuove 200, API POST con interpretazione locale,
  sitemap 539 URL.
- Produzione: `8bcade37` (branch `pubblicazione-gratuita-scardi-20261022`), deploy
  immediatamente precedente `d7336d7e` riconfermato invariato prima della promozione.
- Verifica dominio https://www.orologiai.it: homepage **264 attività**, schede nuove 200,
  sitemap 539 URL, API funzionante.

## Anomalie rimaste aperte (non risolvibili con le fonti disponibili)

1. **Coordinate verificate: solo 4 attività.** Il posizionamento richiede fonti
   geospaziali legittimamente utilizzabili; non vengono dedotte da CAP o città.
2. Recapiti non pubblici per 7 attività (solo contatto di persona).
3. Orari non documentati per circa la metà del catalogo: le schede non mostrano orari
   finti, il campo resta vuoto.
4. Auto-dichiarazioni di "centro assistenza ufficiale" su alcuni siti aziendali non
   confermate da fonti primarie del marchio: conservate come riparazioni documentate.
5. Siti temporaneamente non raggiungibili durante la verifica (es. dominio Burrascano
   non risolto, recuperato con dominio reale `gioielleriaburrascano.it`).

## Backup e ripristino

Checkpoint in `export/`:
- `orologiai-lotto8-20261026.bundle` — git bundle completo della cronologia locale.
- `directory-lotto8-20261026.json` — copia del database autorevole.
- `orologiai-sorgente-lotto8-20261026.zip` — archivio del sorgente (file tracciati).
- `orologiai-checkpoint-lotto8-20261026.sha256` — manifest con hash SHA-256.

Ripristino: `git clone orologiai-lotto8-20261026.bundle ripristino && cp
export/directory-lotto8-20261026.json ripristino/site/data/directory.json`, quindi
`npm ci && npm run verify && npm run package:pages` e deployment Wrangler sul progetto
`orologiai-it`, branch `pubblicazione-gratuita-scardi-20261022`.

Commit locali della campagna: `dee4d16` (lotto 7), `4dc666b` (lotto 8) e precedenti.
GitHub resta sospeso e non è parte della pipeline: il deploy usa Wrangler Direct Upload.
