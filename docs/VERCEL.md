# Compatibilità con Vercel

Stato: documentazione di preparazione. Nessun deploy è stato eseguito e il progetto resta configurato per Cloudflare Pages.

## Funzioni attuali (Cloudflare Pages Functions)

| Percorso | File | Scopo |
| --- | --- | --- |
| `/api/orologiaio` | `functions/api/orologiaio.ts` | Assistente AI: interpreta la richiesta e cerca nel database |
| `/api/posizione` | `functions/api/posizione.ts` | Posizione approssimativa dalle intestazioni della richiesta |

Entrambe usano la firma `onRequest(context)` di Cloudflare, con `context.request`.

## Equivalenti Vercel

Su Vercel le stesse rotte diventano Route Handlers o Serverless Functions in `api/`:

- `api/orologiaio.ts` con `export async function POST(request: Request)` (Web API standard, nessun adattatore).
- `api/posizione.ts` con `export function GET(request: Request)`; la logica di `site/src/lib/geo.ts` (`estraiPosizioneApprossimativa`) usa solo `Request`, quindi è riutilizzabile senza modifiche.

La logica condivisa resta in `site/src/lib/` (assistente, ricerca, geo): il cambio riguarda solo il sottile wrapper di rotta.

## Cosa cambia

- Geolocalizzazione: `estraiPosizioneApprossimativa` in `site/src/lib/geo.ts` legge l'oggetto `request.cf` e gli header `cf-ipcountry`, `cf-region`/`cf-region-code`, `cf-ipcity`. Su Vercel (richieste con header `x-vercel-id`) la stessa funzione legge `x-vercel-ip-country`, `x-vercel-ip-country-region` e `x-vercel-ip-city` (documentazione Vercel, "Request headers"); la città è codificata RFC 3986. Fuori da Vercel resta il fallback Cloudflare. Senza header la stima risulta non disponibile, senza errori. Nessun GPS.
- Variabili d'ambiente: le chiavi del provider AI vanno impostate nel pannello Vercel (Project → Settings → Environment Variables), mai nel repository.
- Routing statico: `site/assets/_routes.json` è specifico di Cloudflare. Su Vercel la configurazione minima è `vercel.json` (build `npm run build`, output `dist`); le API sono in `api/` alla radice con `export default { fetch }`.
- IP per il rate limit su Vercel: solo `x-vercel-forwarded-for` o `x-real-ip`, e solo se è presente `x-vercel-id`. `x-forwarded-for` non viene usato.
- Il limitatore in memoria resta best-effort per istanza; la protezione globale va configurata a livello di piattaforma.

## Passi suggeriti (non eseguiti)

1. Creare `api/` con i due wrapper sopra, importando da `site/src/lib/`.
2. Aggiungere `vercel.json` con l'output statico di Astro (`site/dist` o la cartella indicata dal build).
3. Eseguire `npm run build` e una preview Vercel, poi verificare `/api/orologiaio` (risposta e timeout del provider) e `/api/posizione`.
4. Solo dopo la verifica: decidere il dominio di produzione.
