# Report finale — campagna di arricchimento documentale, 25 ottobre 2026

Data di riferimento: 25 ottobre 2026.
Repository: https://github.com/superseller1960/orologiai.it — branch `feature/schede-orologerie-ux`.
Ambito: completamento della campagna di verifica e arricchimento delle 159 schede della directory,
descrizioni personalizzate, collaudo completo e pubblicazione su https://www.orologiai.it.

## 1. Obiettivo e criteri

Arricchire tutte le schede del catalogo con dati documentati su fonti ufficiali o primarie,
senza inventare nulla:

1. recapiti (telefono, email, sito) e orari inseriti **solo se assenti**: nessun dato storico
   sovrascritto o perso;
2. servizi attribuiti solo quando dichiarati dalla fonte, con fonte per ciascun servizio;
3. **autorizzazioni dei marchi** (rivendita/assistenza ufficiale) solo con fonte ufficiale del
   marchio: le autodichiarazioni del titolare non costituiscono autorizzazione;
4. ogni intervento registrato nella cronologia della scheda, ogni fonte con URL e data di
   consultazione (2026-10-25);
5. dati ambigui, incompleti o in conflitto **non inseriti**: annotati come anomalie nel report
   del lotto.

## 2. Lotti applicati

| Lotto | Attività esaminate | Modificate | Fonti aggiunte | Anomalie | Report |
|---|---:|---:|---:|---:|---|
| Lotto 1 (laboratori e retailer principali) | 20 | 16 | 30 | 5 | `data/reports/lotto-01-20261025-applied.json` |
| Lotto 2 (Toscana, Lombardia, Veneto) | 37 | 33 | 37 | 13 | `data/reports/lotto-02-20261025-applied.json` |
| Lotto 3 (resto del catalogo) | 102 | 97 | 60 | 42 | `data/reports/lotto-03-20261025-applied.json` |
| Descrizioni personalizzate | 159 | 3 | — | — | `data/reports/descrizioni-20261025-applied.json` |

Le tre campagne coprono l'intero catalogo (20 + 37 + 102 = 159 attività esaminate, con
sovrapposizioni volute fra i lotti). Le descrizioni erano già presenti e uniche su tutte le 159
schede: sono state completate le sole tre troppo sintetiche (`fronza-trento`,
`gioielleria-di-marco-nicosia`, `de-marco-belluno`) con testo personalizzato sui dati documentati.

### Stato del database dopo la campagna

- 159 attività, 102 località, 20 regioni, **384 fonti** (da 257 a inizio giornata).
- 149 attività con telefono, 115 con email, 73 con orari puntuali verificati.
- Autorizzazioni dei marchi presenti solo con fonte `marchio-ufficiale`: fra le aggiunte,
  Longines (Bigalli Firenze, Valenti Parma, Stema Termoli, Wargas & Sisti Ancona) e
  Baume & Mercier (Centro Assistenza Orologi De Luca, Napoli, come centro assistenza).

### Anomalie e limiti tracciati (60 complessive nei report dei lotti)

Esempi tipici, tutti registrati e nessuno risolto per deduzione: orari stagionali o senza giorni
di riferimento non inseriti; numeri di cellulare pubblici non inseriti nei recapiti principali
(conservato il fisso); email pubblicate in forma incompleta non inserite; secondi recapiti e
seconde sedi non rappresentabili nello schema; pagine ufficiali inaccessibili durante la
consultazione; conflitti fra pagine dello stesso sito risolti usando la pagina più specifica.

## 3. Verifiche

- `npm run verify` completo: **typecheck Astro + TypeScript 0 errori**, build (validate → Astro →
  check-build → bundle API Vercel), **205 test tutti verdi**, test della UI nel DOM (ricerca e
  chat) superati.
- Test specifici della campagna: `tests/lotto-01-20261025.test.ts`, `tests/lotto-02-20261025.test.ts`,
  `tests/lotto-03-20261025.test.ts`, `tests/descrizioni-20261025.test.ts`. Invarianti verificati a
  ogni lotto: nessun record perso, nessun recapito/servizio/marchio storico sovrascritto, ogni
  novità con fonte e data, ogni autorizzazione con fonte ufficiale del marchio. I test dei lotti
  precedenti (`nazionale-08`, `lotto-02`) sono stati riallineati alle autorizzazioni documentate
  successive, mantenendo stretto il controllo «nessun claim senza fonte del marchio».
- Build deployabile: `npm run package:pages` → `.runtime/pages-build` (391 file, 5,08 MB) con
  manifest SHA-256 `.runtime/pages-build-sha256.json`.

## 4. Pubblicazione e collaudo sul dominio

Rilascio eseguito con Wrangler Direct Upload sul progetto Cloudflare Pages esistente
`orologiai-it`, stessa build validata per entrambi gli ambienti (procedura di
`docs/RILASCIO-UX-CLOUDFLARE.md`):

- anteprima: https://68b36d0f.orologiai-it.pages.dev (alias `preview.orologiai-it.pages.dev`),
  collaudo superato prima della promozione;
- produzione: deployment `a8ce48e2` sul ramo di produzione
  `pubblicazione-gratuita-scardi-20261022`, servito su https://www.orologiai.it.

Collaudo sull'origine reale (25/10/2026, dopo il deployment):

| Controllo | Esito |
|---|---|
| `https://www.orologiai.it/` | 200 `text/html` |
| `https://orologiai.it/` | 301 → `https://www.orologiai.it/`, nessun loop |
| Scheda del lotto 3 (`/orologeria/tardani-viterbo`) | 200, telefono e servizi aggiornati presenti |
| Descrizione aggiornata (`/orologeria/de-marco-belluno`) | presente nel rendering |
| Sitemap | 159 schede `/orologeria/*`, 368 URL complessivi |
| `GET /api/orologiaio` | 405 con `Allow: POST` |
| `POST /api/orologiaio` same-origin | 200, `modalita: "non-configurato"` con criteri interpretati localmente (es. «chi ripara Rolex a Roma?» → localita roma, servizio riparazione, marca Rolex) |
| `POST /api/orologiaio` origine estranea | 403 |
| `POST /api/orologiaio` content-type errato | 415 |
| `GET /api/posizione` | 200 |

La modalità AI resta disattivata per scelta: il kill-switch di Gemini è invariato, Workers AI si
attiverebbe solo con binding `AI` + `AI_PROVIDER=cloudflare` espliciti sulla piattaforma.

## 5. Cosa non è stato fatto

- Nessun dato dedotto o integrato da fonti anonime/non ufficiali; nessuna autorizzazione di
  marchio senza fonte del marchio; nessuna coordinata inventata.
- Nessuna modifica DNS, nessun acquisto, nessun servizio esterno a pagamento attivato.
- Commit effettuati sul branch `feature/schede-orologerie-ux` (`adfbdb0`, `760d837`, `da5624a`,
  `89deb7f`); il push sul remoto GitHub non è stato eseguito in questa sessione.

## 6. Prossimi passi possibili

- Attivazione Workers AI (`AI_PROVIDER=cloudflare`) con verifica del passaggio da `fallback` a `ai`
  e ritorno a quota esaurita.
- Reintegrazione dell'invio richieste di partecipazione (oggi solo `mailto:`).
- Aggiornamento periodico di orari e recapiti con le stesse regole documentali.
