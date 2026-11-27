# Orologiai.it — Handoff Fase 32

Documento di trasferimento del progetto al termine della Fase 32 (consolidamento catalogo + pubblicazione in produzione).
Generato il 3 novembre 2026. Nessun file del workspace originale è stato modificato: gli archivi sono copie.

## 1. Cosa contiene questa consegna

| File | Contenuto | Dimensione |
| --- | --- | --- |
| `OROLOGIAI_FASE32_SORGENTI_COMPLETI.zip` | Stato reale e completo del workspace: sorgenti Astro/TypeScript, Worker e API AI, catalogo (527 attività / 235 località / 1.127 fonti), anagrafica ISTAT, script di import e validazione, registri candidati, lotti e fonti, redirect e routing, configurazione Pages/Vercel, test, documentazione e checkpoint delle fasi recenti, `package.json` e `package-lock.json`. 998 file. | 8.024.607 byte |
| `OROLOGIAI_FASE32_PAGES_BUILD.zip` | Artefatto Pages effettivamente pubblicato nella Fase 32: `_worker.js`, `_routes.json`, `_redirects`, 404, HTML, CSS/JS, immagini, font, `coordinate-osm.json`. 940 file. | 6.168.742 byte |
| `OROLOGIAI_FASE32_HANDOFF.md` | Questo documento. | — |

Impronte SHA-256 aggiornate: `OROLOGIAI_FASE32_HANDOFF.sha256` (include anche l'impronta di questo stesso documento).

I due ZIP sono indipendenti: il primo ricostruisce il sito, il secondo permette di ripubblicare esattamente ciò che è online oggi senza ricompilare.

## 2. Struttura delle cartelle (archivio sorgenti)

```
OROLOGIAI_FASE32_SORGENTI_COMPLETI/
├── astro.config.mjs            # srcDir ./site/src, publicDir ./site/assets, outDir ./dist
├── package.json                # script npm, engines node >=22.22.0
├── package-lock.json           # lockfile npm (non aggiornare)
├── tsconfig.json               # configurazione Astro/TS
├── tsconfig.tools.json         # typecheck degli script (tsc --noEmit)
├── vercel.json                 # configurazione deploy alternativo Vercel
├── .env.example                # template vuoto (GEMINI_API_KEY), nessun valore
├── .dev.vars.example           # template vuoto per wrangler pages dev
├── README.md, README-FASE16C.md, QA-redesign.json
├── site/
│   ├── src/                    # pagine Astro, componenti, layout, lib, stili, api
│   │   ├── pages/              # rotte statiche (home, /cerca/, /orologerie/, /orologeria/, /marchi/…)
│   │   ├── lib/                # ricerca, geografia, import revisionato (reviewed-import.ts), AI
│   │   └── api/                # logica condivisa delle API
│   ├── data/directory.json     # CATALOGO: 527 attività, 235 località, 1.127 fonti, 82 coordinate
│   └── assets/                 # pubblico statico (publicDir), immagini, font, pagine legacy WP
├── api/                        # bundle Vercel delle due API (artefatto generato)
├── functions/api/              # Cloudflare Pages Functions: orologiaio.ts, posizione.ts
├── scripts/                    # build, validazione, import, packaging, checkpoint (≈67 file fase32/fase31)
├── tests/                      # suite node:test (45 file, 291 test)
├── data/
│   ├── anagrafica/             # comuni-catalogo.json (235 comuni ISTAT), redirect-territoriali.json
│   ├── checkpoint/             # FASE31B-CHECKPOINT.txt, FASE32-CHECKPOINT.txt (impronta 3ba73d5f…)
│   ├── import/                 # lotti revisionati, incl. fase32-01.json
│   ├── reports/                # audit servizi, integrazione, esclusi gate, equivalenze
│   ├── fase30/, fase31/        # registri candidati e verifiche fonti
│   └── staging/                # snapshot e cache geografiche revisionate
├── docs/                       # documentazione di progetto, incl. FASE32-AUDIT-SERVIZI.md e FASE32-ESPANSIONE-01.md
├── public/                     # pagine statiche legacy (WordPress migrato), robots.txt
├── .github/                    # configurazioni CI presenti nel workspace
└── documentazione-artifacts/   # rapporti e manifest delle fasi 21–28 recuperati da artifacts/ (solo .md/.json/.txt)
```

Contenuti esclusi di proposito: `node_modules/`, `.git/`, cache (`.astro/`, `.runtime/`, `.wrangler/`), build (`dist/`), `export/` (1,1 GB di backup storici di fasi già superate), gli ZIP e i PNG di `artifacts/`, `.env`, `.env.local`, `.dev.vars` e ogni credenziale. Nessun file necessario alla ricostruzione è stato escluso: `artifacts/` è conservato come `documentazione-artifacts/` per la parte testuale, e la build Pages è nel secondo archivio.

## 3. Comandi esatti

Requisiti: Node.js ≥ 22.22.0, npm. Nessuna dipendenza globale.

```bash
# 1. Installazione fedele dal lockfile
npm ci

# 2. Sviluppo locale (Astro su http://localhost:3000)
npm run dev

# 3. Controlli
npm run check        # astro check + tsc --noEmit -p tsconfig.tools.json
npm run validate     # validazione del catalogo (tsx scripts/validate.ts)
npm test             # suite node:test: 291 test

# 4. Build e pacchetto Pages
npm run build        # validate + astro build + check-build + bundle API Vercel  → ./dist
npm run package:pages  # dist + _worker.js (esbuild) + _routes.json → ./.runtime/pages-build
                       # e manifest .runtime/pages-build-sha256.json + pages-build-upload.json

# 5. Deploy Cloudflare Pages (progetto esistente)
npx --yes wrangler@4 pages deploy .runtime/pages-build \
  --project-name orologiai-it \
  --branch pubblicazione-gratuita-scardi-20261022 \
  --commit-dirty=true
```

Note operative:

- `npm test` richiede una `dist/` aggiornata: alcuni test leggono `dist/cerca/index.html`. Eseguire `npm run build` prima di `npm test`.
- `npm run package:pages` rigenera `_routes.json` dalle regole di `data/anagrafica/redirect-territoriali.json` e include solo `/api/orologiaio`, `/api/posizione` e i prefissi territoriali reindirizzati; tutto il resto è statico.
- Il deploy da questo archivio può essere fatto anche senza ricompilare, estraendo `OROLOGIAI_FASE32_PAGES_BUILD.zip` e pubblicando quella cartella.

## 4. Directory di output

- Build Astro: `./dist` (statico, `trailingSlash: 'always'`).
- Pacchetto pubblicabile: `./.runtime/pages-build` — 940 file, 21.086.490 byte, `_worker.js` + `_routes.json` + asset.
- Manifest di integrità: `./.runtime/pages-build-sha256.json` (per file, più SHA-256 del catalogo usato: `09a25e71cbad75c23f4c99c83860d2daebbccdc3d09c800d7f223137b5a98d19`, 527/235/1127).

## 5. Configurazione AI (nessun valore segreto)

- Provider primario: **Cloudflare Workers AI**, binding `AI` sul progetto Pages `orologiai-it`.
- Variabile non segreta: `AI_PROVIDER` (seleziona il provider nel worker).
- Segreto opzionale: `GEMINI_API_KEY` (fallback Gemini). Va impostato solo in *Settings → Environment variables → Secret* del progetto Pages o in locale in `.dev.vars` / `.env`, mai in chiaro nei file versionati.
- Codice: `functions/api/orologiaio.ts`, `functions/api/posizione.ts`, logica condivisa in `site/src/api/`, bundle in `api/*.js` (Vercel) e `_worker.js` (Pages).
- Il browser non vede mai le chiavi: le chiamate passano dal worker.

## 6. Ultimo rilascio

| Voce | Valore |
| --- | --- |
| Progetto Cloudflare Pages | `orologiai-it` |
| Dominio | https://www.orologiai.it |
| Deployment di produzione | `02006597-9987-4116-9f05-e80ebebea187` |
| Branch di produzione | `pubblicazione-gratuita-scardi-20261022` |
| Deployment di rollback | `4b404744-79fe-4021-a24c-87050af56597` |
| Preview della Fase 32 | `0699e959-e2d1-4dce-82d6-ca2279471f4f` (`https://0699e959.orologiai-it.pages.dev`) |
| Stato Git del workspace | branch `fase14d-assistente-ai`, HEAD `9afff819efc119e3d22bc003edc010d2732c41c7`; 176 voci in `git status` (43 modificate, 133 non tracciate), tutte incluse nell'archivio |

## 7. Verifiche eseguite su questa consegna

- `unzip -t` su entrambi gli archivi: nessun errore, exit code 0.
- Conteggio file: 998 nel pacchetto sorgenti, 940 nel pacchetto Pages (pari al manifest di upload del deploy).
- **Corrispondenza del pacchetto Pages con il rilascio**: MD5 di tutti i 940 file confrontato con `.runtime/pages-build-upload.json` → 0 differenze, 0 file estranei. Il pacchetto è quindi identico a ciò che è stato caricato per la Fase 32, non a una build precedente.
- **Coerenza catalogo/build**: SHA-256 di `site/data/directory.json` nell'archivio = `09a25e71cbad75c23f4c99c83860d2daebbccdc3d09c800d7f223137b5a98d19`, lo stesso registrato nel manifest della build; 527 schede attività presenti in `orologeria/` e 235 pagine comune in `orologerie/`.
- Ricerca di segreti su tutto il contenuto degli archivi (chiavi Google, `sk-`, `ghp_`, token Cloudflare, chiavi private PEM, token Slack): nessun risultato.
- Nessuna occorrenza di `node_modules`, `.git`, `.runtime`, `.astro`, `dist`, `export`, `.env`, `.dev.vars` all'interno degli archivi.

## 8. Anomalie residue

1. **`l-orologiaio-sardegna-porto-torres`** è in stato `in-revisione` e non pubblicata: stesso indirizzo di `lorologiaio-ascione-porto-torres` con domini diversi, titolarità non chiarita. La rotta restituisce 404 come previsto.
2. **8 candidati sospesi dal gate geografico** (CAP o indirizzo non confermabili): Magno Bari, Bisciardi Avezzano, Spinelli Cesano Maderno, Lissi Rho, CM Orologi Alba, Zanoni Trento, Formica Città di Castello, L'Orologio Imola. Elenco e motivi in `data/reports/fase32-esclusi-gate.json` e in `docs/FASE32-ESPANSIONE-01.md`.
3. **Località `orosei` rimossa** con redirect 301 a `/orologerie/sardegna/nuoro/` (`data/anagrafica/redirect-territoriali.json`).
4. **Provincia MB con due slug**: `monza-e-della-brianza` (dominante) e `monza-e-brianza` (usato da Besana in Brianza). Difetto preesistente, non introdotto dalla Fase 32.
5. **`officina4-watchmaking-merano`**: la via non è ripetuta nel testo della pagina ufficiale; il dato proviene dal record di ricerca e va riconfermato al prossimo aggiornamento.
6. **Redazione di sicurezza**: due snapshot HTML di terze parti in `data/staging/fase20/sources/` contenevano una chiave Google Maps incorporata nella pagina originale. Nell'archivio la chiave è sostituita con `AIzaCHIAVE_RIMOSSA_IN_HANDOFF`; i file restano presenti come evidenza documentale.
7. **`export/` non incluso** (1,1 GB di bundle e ZIP di fasi precedenti): contiene copie di stati superati, non sorgenti necessari.
8. **Nessun commit o push** è stato effettuato: lo stato del repository resta quello di lavoro, con tutte le modifiche delle fasi precedenti preservate.

## 9. Elenco file e impronte

| File | SHA-256 |
| --- | --- |
| `OROLOGIAI_FASE32_SORGENTI_COMPLETI.zip` | `48e2c3cc4c0c474200e83bea7d0c0ddd9abaf9276636bf6b14b2e81e60b33aef` |
| `OROLOGIAI_FASE32_PAGES_BUILD.zip` | `1309825c761adfe83df4120bb9ba145134fd5846ed45e4ea856e76ff9850b14a` |
| `OROLOGIAI_FASE32_HANDOFF.md` | riportata in `OROLOGIAI_FASE32_HANDOFF.sha256` (l'impronta di un file non può essere contenuta nel file stesso) |

Verifica lato destinatario:

```bash
sha256sum -c OROLOGIAI_FASE32_HANDOFF.sha256
```
