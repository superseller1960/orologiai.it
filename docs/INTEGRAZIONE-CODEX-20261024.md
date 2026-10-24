# Integrazione condivisa Codex + PR #6 — 24 ottobre 2026

Registro di consegna della pubblicazione condivisa: fusione fra il lavoro più recente di questo
repository (espansione nazionale, 155 attività) e la revisione UX/AI allegata (checkpoint
`6af3ae1`, database base 103 attività), più il recupero degli inserimenti PR #6. Ogni affermazione
qui dentro è o un dato misurato da un comando eseguito in questa sessione, o è dichiarata come
non verificata.

## Origini fuse e loro stato

| Tronco | Contenuto | Stato |
|---|---|---|
| Lavoro consolidato locale | 155 attività, branch `feature/freebuff-national-expansion-batch02-20261023` @ `3759dcb` | in questo repository |
| Revisione allegata (Codex) | UX ricerca guidata + adapter Workers AI + kill-switch Gemini, database base 103 attività | allegato come documento JSON (troncato a 1.000.000 di caratteri dallo strumento di lettura); il database base è stato recuperato integralmente dal repository (`e0e1331`, SHA-256 identico al checkpoint dichiarato) |
| PR #6 (4 inserimenti + 6 arricchimenti) | commit `50170df` "Enrich six listings and add four verified Ancona/Pescara businesses" | **non raggiungibile via GitHub** (canale autenticato negato con HTTP 403, commit assenti dal repository locale); recuperato dal deployment preview pubblico `9deeca12` |

## Confronto database base Codex ↔ repository (riga per riga)

- Il blob `e0e1331:site/data/directory.json` ha SHA-256 `28e3245590e8460e2f36b8fac6210a697303eda23b83790a5d4cde1958f14f60`,
  **identico** al checkpoint dichiarato dalla revisione allegata (103 attività, 58 comuni, 41 province, 20 regioni, 168 fonti).
- Tutti i 103 record del checkpoint esistono nel database consolidato con **ID, slug e località identici** (nessuno mancante o alterato).
- Tutte le 58 località base sono identiche campo per campo; nessuna delle 168 fonti base è stata persa.
- Le 52 attività oltre il base provengono dai lotti locali documentati (PR #5: 3; espansione nazionale: 49), come verificato dai delta di `git log` sul dataset.

## Verifica separata dei tre insiemi di inserimenti

| Insieme | Commits | Delta misurato | Esito |
|---|---|---|---|
| PR #5 — tre inserimenti | `500ca1c` "Amplia la copertura in tre province con fonti primarie verificate" (branch `feature/freebuff-directory-expansion-20261023`, base di PR #5 come da `docs/ESPANSIONE-NAZIONALE-BATCH02-20261023.md`) | +3 attività (103 → 106) | presenti e invariati nel database definitivo |
| PR #6 — quattro inserimenti | `50170df` (branch `arricchimento-20261024-50170df`, deployment preview `9deeca12`) | +4 attività (3 Ancona + 1 Pescara) | **recuperati e integrati** in questa sessione: `cerescioli-paolo-ancona`, `gibi-shop-ancona`, `wargas-sisti-ancona`, `satolli-pescara` |
| Ultima espansione nazionale | lotti A–D: `a44b44b` (+15), `3fb685d` (+16), `5331af1` (+15), `3759dcb` (+3) | +49 attività (106 → 155) | presenti e invariati nel database definitivo |

Nota di provenienza: le cronologie delle schede recuperate riportano testualmente «Recuperato il
lotto Ancona del 23 ottobre e ricontrollato sulla fonte ufficiale; integrazione conservativa,
senza attribuzione non provata alla PR #5 o #6». L'attribuzione a PR #6 qui documentata deriva
dal messaggio di commit del deployment (`add four verified Ancona/Pescara businesses`) e dalla
traccia «i quattro della PR #6» della consegna; nessuna altra attribuzione è inventata.

## Fusione eseguita (registro)

Database prima/dopo (conteggi misurati da `site/data/directory.json`):

| | Prima (`3759dcb`) | Dopo | Delta |
|---|---:|---:|---:|
| Attività | 155 | **159** | +4 |
| Località/comuni | 101 | **102** | +1 (Pescara) |
| Province (provinceSlug distinti) | 83 | **84** | +1 |
| Regioni | 20 | 20 | 0 |
| Fonti | 236 | **257** | +21 |

SHA-256 del database:
- prima: `c8b014c890565717ec4c54d0dcbfd4dcce0cff07ad25b61df7c6745ac97dc9ba`
- dopo: **vedi `data/reports/pr6-arricchimenti-20261024-applied.json` e il manifest di build
  `.runtime/pages-build-sha256.json`** (campo `database.sha256`), che è la fonte autorevole
  dell'hash della consegna.

### I 4 inserimenti nuovi
Passati dalla pipeline ufficiale `integrateReviewedBatch` (lotto `pr6-ancona-pescara-20261024`,
file `data/import/pr6-ancona-pescara-20261024-reviewed.json`, report
`data/reports/pr6-ancona-pescara-20261024-applied.json`): tutti e 4 esiti `nuova`, **zero
duplicati rilevati**, zero dati preesistente alterati (il controllo è della pipeline stessa).
Ogni scheda porta indirizzo, recapiti, servizi/marchi con attribuzione per-fonte, orari ove
pubblicati, storia con tappe datate, cronologia e fonti con URL e date di consultazione
(2026-10-23/2026-10-24). Nessuna coordinata, nessun orario e nessuna autorizzazione di marca
sono stati dedotti; il campo `origine` dichiara `recupero-arricchimento-20261024`.

### I 6 arricchimenti
`bigalli`, `fani-gioielli`, `marretti`, `sangalli`, `scardi`, `senzatempo-firenze` — esattamente
le sei schede del messaggio di commit PR #6. Applicati come delta conservativi campo-per-campo
(script `scripts/merge-pr6-20261024.ts`): si aggiunge e si sostituisce solo ciò che la fonte
pubblicata documenta (descrizioni, recapiti, orari verificati, servizi/marchi con fonti, data di
verifica 2026-10-24, eventi di cronologia); **nessun dato esistente è stato eliminato**. I
conflitti non risolvibili conservano il valore precedente e sono annotati nel registro
`data/reports/pr6-arricchimenti-20261024-applied.json` (75 delta complessivi, per singolo campo
con prima/dopo). Esempi: `scardi` +telefono/sito e 8 servizi di laboratorio documentati;
`fani-gioielli` +rivendita Rolex riscontrata sul locator ufficiale del marchio (fonte
`marchio-ufficiale`, come richiesto dallo schema per le autorizzazioni); `sangalli`
+telefono/email/sito/orari con variazioni stagionali esplicite.

### Cosa NON è stato fatto
- Nessuna deduplicazione: le sedi omomee (`pisani-scandicci-*`, `monetti-napoli-*`, `astrua-*`,
  `agnolucci-*`, `oreoro-*`) restano distinte come richiesto.
- Nessun dato storico rimosso né URL storico modificato: verificato confrontando i 155 record
  preesistenti prima/dopo (ID, slug, `localitaId`, `origine`, `posizione` identici per tutti;
  le sole 6 schede arricchite cambiano altri campi, in modo documentato).
- Codice ISTAT del comune di Pescara lasciato `null`: non ricavabile con certezza dai materiali
  disponibili senza inventarlo (lo schema lo consente esplicitamente).

## Adapter Workers AI (contenuto della revisione allegata)

- Nuovo `site/src/lib/cloudflare-ai.ts`: modello fisso `@cf/meta/llama-3.1-8b-instruct` con JSON
  Mode (`response_format: { type: 'json_schema', json_schema }`, forma confermata sulla
  documentazione Cloudflare aggiornata), una sola chiamata per messaggio, **max 400 token di
  output**, nessun IP/coordinate/dato personale inoltrato. Istruzioni di sistema, enum e
  validazione sono condivisi con il percorso Gemini (`gemini.ts`, invariato).
- `site/src/lib/orologiaio-api.ts`: `Env` esteso con `AI_PROVIDER`/`AI`; il provider si sceglie
  così: Workers AI solo con binding presente **e** `AI_PROVIDER=cloudflare` esplicito; altrimenti
  il percorso Gemini privato/legacy; altrimenti interpretazione locale (`non-configurato`).
  Risposte con JSON valido → `modalita: "ai"`; timeout/quota/errore/JSON non valido → `fallback`
  alla ricerca locale dichiarato; il modello non sceglie mai i risultati (restano del motore).
- `functions/api/orologiaio.ts`: testo della revisione allegata, con doppia protezione: il
  kill-switch Gemini resta (nessuna chiave Google passa alla entry pubblica, anche se presente
  nell'ambiente) e Workers AI si attiva solo con binding `AI` + variabile `AI_PROVIDER=cloudflare`.
- `scripts/pages-worker.ts` + `scripts/package-pages.mjs` (`npm run package:pages`): producono
  `.runtime/pages-build` con `_worker.js` (entrambe le API) + `_routes.json` (solo `/api/*` invoca
  il worker) + manifest SHA-256 e manifest di upload Direct Upload.

## Verifiche eseguite (dati misurati)

- `npm ci`: riuscito (Node 24.21.0; avviso policy postinstall di esbuild, benigno e già noto).
- `npm run verify`: typecheck Astro + TypeScript **0 errori**, **192 test, 191 pass, 1 fail** —
  l'unico fallimento è `tests/nazionale-08.test.ts` «telefono alterato: scardi», che confronta il
  dataset vivo con `git show HEAD`: passa senza modifiche dopo il commit della fusione (dopo il
  commit la verifica completa è stata rieseguita: **192/192 verdi**). Include i 10 test
  dell'adapter Workers AI (binding simulato: modalità `ai`, validazione criteri, privacy del
  prompt, fallback, timeout, kill-switch) e `tests/pr6-20261024.test.ts` (conservazione 155→159).
- Collaudo reale in **workerd locale** (Wrangler 4, `wrangler pages dev .runtime/pages-build`):
  `/`, `/cerca/`, `/orologiaio/`, pagina regione, 3 schede (incluse sedi omonime), servizi,
  marchi, sitemap → tutti 200 con i content-type corretti; `/api/posizione` → 200 JSON con
  `cache-control: private, no-store`; `/api/orologiaio`: GET 405 + `Allow: POST`, POST same-origin
  200 `non-configurato` con criteri interpretati localmente, POST origine estranea 403, content-type errato 415.
  La modalità `ai` reale non è eseguibile in locale (il binding richiede l'account Cloudflare):
  è coperta dai test con binding simulato, come anche nella revisione allegata.
- Dominio (stato al 2026-10-24, deployment corrente NON ancora sostituito): `https://www.orologiai.it/`
  → 200 HTML; `https://orologiai.it/` → **301** verso `https://www.orologiai.it/`; deep link con
  query → 200; `https://orologiai.it/<scheda>/` → 1 redirect → 200, nessun loop.

## Stato del deployment — BLOCCO APERTO

La build validata è pronta in `.runtime/pages-build` (384 file, 4,55 MB, `_worker.js` 825 kB,
manifest `.runtime/pages-build-sha256.json`), ma **il deployment non è stato eseguito** perché
questo ambiente non ha credenziali Cloudflare per Wrangler (`wrangler whoami`: «You are not
authenticated») e l'integrazione Cloudflare collegata espone solo API discrete: l'upload degli
asset richiederebbe di trasmettere ~4,6 MB di contenuto in base64 attraverso gli argomenti degli
strumenti, cosa impraticabile e non sicura. Lo stato del progetto `orologiai-it` (letto in sola
lettura dall'account `cloudflare_jog-outsum`, id `a1ebe34bebd25196d768a037ad3b5ebc`):
progetto GitHub-connesso (`superseller1960/orologiai.it`), `production_branch`
`pubblicazione-gratuita-scardi-20261022`, deployment di produzione canonical `143399e4`
(commit `24ceb4c` «Ricerca guidata, filtri rimovibili e contatti; Gemini spento», 07:17 UTC del
24/10) e ultimo deployment preview `9deeca12` (commit `50170df`, 07:48 UTC del 24/10) — cioè la
revisione allegata e la PR #6 sono già online in quelle forme, **non** la fusione di questa sessione.

Per completare il rilascio servono **due esecuzioni con credenziali** (le stesse identiche per
anteprima e produzione, come richiesto):

```bash
# 1) anteprima (branch preview del progetto esistente)
npx wrangler@4 pages deploy .runtime/pages-build --project-name orologiai-it --branch preview
# 2) dopo il collaudo dell'anteprima: stessa build validata su produzione
npx wrangler@4 pages deploy .runtime/pages-build --project-name orologiai-it --branch main
```

Modi sicuri per fornire l'accesso senza mettere token in chat: salvare `CLOUDFLARE_API_TOKEN`
(con permesso Account/Pages:Edit) e `CLOUDFLARE_ACCOUNT_ID`=`a1ebe34bebd25196d768a037ad3b5ebc`
fra i Segreti del progetto in Settings → Secrets, oppure eseguire i due comandi sopra da una
macchina già autenticata con Wrangler. Dopo il deployment vanno rieseguite sul dominio le verifiche
HTTP/HTTPS elencate sopra e ripetuto il collaudo API sull'origine reale.

## Consegnato

- Sorgenti, database e test di questa integrazione (branch `freebuff/88d5955c3580dd68dad1df0c`).
- `data/import/pr6-ancona-pescara-20261024-reviewed.json` + report applicati in `data/reports/`
  (`pr6-ancona-pescara-20261024-applied.json`, `pr6-arricchimenti-20261024-applied.json`).
- Estrazione documentata della PR #6: `data/staging/pr6-arricchimento-20261024/estrazioni.json`.
- Artefatto deployabile `.runtime/pages-build` + manifest SHA-256 + manifest upload Pages.
- Esportazione completa senza credenziali: `artifacts/orologiai-integrazione-20261024.zip`.

## Aggiornamento post-deploy — 24/10/2026

Con GitHub sospeso il rilascio è avvenuto in Direct Upload con Wrangler seguendo la procedura di
`docs/RILASCIO-UX-CLOUDFLARE.md`, stessa build verificata per anteprima e produzione:

- anteprima: https://merge-pr6-20261024.orologiai-it.pages.dev (deployment `b73ef69d`), collaudo superato;
- produzione: deployment `5a5d5b04` sul ramo `pubblicazione-gratuita-scardi-20261022`, servito su
  https://www.orologiai.it.

Collaudo sull'origine reale: home 200 (text/html), 301 apex → www, scheda
`/orologeria/b-b-gioielli-rovigo` 200 (404 sul deployment pre-fusione `9deeca12`), sitemap a 159
schede, API `/api/orologiaio` 405/200/415/403 e `/api/posizione` 200. La risposta API riporta
`modalita: "non-configurato"` con interpretazione locale: il kill-switch di Codex è invariato e la
sua revisione UX resta la base viva del sito, estesa dal PR #6 e dalla fusione documentata qui sopra.
