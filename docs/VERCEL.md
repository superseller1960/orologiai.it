# Compatibilità con Vercel

Stato: la piattaforma di distribuzione è **Vercel**. La preview della branch `collaudo-preview-20261021` è verificata (vedi sotto); le entry in `functions/api/` restano come percorso di compatibilità Cloudflare Pages, non usato dal deploy Vercel.

## Funzioni di compatibilità (Cloudflare Pages Functions)

| Percorso | File | Scopo |
| --- | --- | --- |
| `/api/orologiaio` | `functions/api/orologiaio.ts` | Assistente AI: interpreta la richiesta e cerca nel database |
| `/api/posizione` | `functions/api/posizione.ts` | Posizione approssimativa dalle intestazioni della richiesta |

Entrambe usano la firma `onRequest(context)` di Cloudflare, con `context.request`.

## Equivalenti Vercel

Su Vercel le stesse rotte sono Serverless Functions in `api/`, generate a ogni build:

- `site/src/api/orologiaio.ts` e `site/src/api/posizione.ts` sono le sorgenti entry (firma `export default { fetch }`, Web API standard, nessun adattatore); condividono la logica con le Pages Function Cloudflare.
- `scripts/bundle-vercel-api.mjs` (esbuild, step `npm run build:api`) le bundla in `api/orologiaio.js` e `api/posizione.js` **autosufficienti** (zod e `directory.json` incorporati) e i bundle sono versionati.

Motivo: verificato su preview che la Lambda di questo progetto contiene solo la entry compilata — né il file tracing né `functions.includeFiles` aggiungono file locali importati (`/var/task` contiene solo `api/*.js` e `package.json`), quindi qualsiasi import da `site/src/lib/` falliva con `FUNCTION_INVOCATION_FAILED`. Le entry pre-bundlate non hanno import da risolvere a runtime.

La logica condivisa resta in `site/src/lib/` (assistente, ricerca, geo): il bundling rigenera i wrapper senza toccarla.

## Cosa cambia

- Geolocalizzazione: `estraiPosizioneApprossimativa` in `site/src/lib/geo.ts` legge l'oggetto `request.cf` e gli header `cf-ipcountry`, `cf-region`/`cf-region-code`, `cf-ipcity`. Su Vercel (richieste con header `x-vercel-id`) la stessa funzione legge `x-vercel-ip-country`, `x-vercel-ip-country-region` e `x-vercel-ip-city` (documentazione Vercel, "Request headers"); la città è codificata RFC 3986. Fuori da Vercel resta il fallback Cloudflare. Senza header la stima risulta non disponibile, senza errori. Nessun GPS.
- Variabili d'ambiente: le chiavi del provider AI vanno impostate nel pannello Vercel (Project → Settings → Environment Variables), mai nel repository.
- Routing statico: `site/assets/_routes.json` è specifico di Cloudflare. Su Vercel la configurazione minima è `vercel.json` (build `npm run build`, output `dist`); le API sono in `api/` alla radice con `export default { fetch }`.
- IP per il rate limit su Vercel: solo `x-vercel-forwarded-for` o `x-real-ip`, e solo se è presente `x-vercel-id`. `x-forwarded-for` non viene usato.
- Il limitatore in memoria resta best-effort per istanza; la protezione globale va configurata a livello di piattaforma.

## Stato (preview verificata 2026-10-21)

La preview della branch `preparazione-vercel-20261021` è verificata: `/api/posizione` (200 + `private, no-store`, geo da header Vercel, 405 con `Allow` per POST), `/api/orologiaio` (fallback AI, rate limit 10/min, nessuna chiave esposta) e le 270 pagine statiche.

1. La preview è protetta da Vercel Authentication (SSO): per i controlli automatici è stato generato un automation bypass secret nel pannello del progetto (rotta `x-vercel-protection-bypass`).
2. Rimane da verificare una richiesta reale a Gemini impostando `GEMINI_API_KEY` nelle variabili d'ambiente Preview.
3. Solo dopo la verifica: decidere il dominio di produzione.
