// Pages Function: POST /api/orologiaio. Il codice vero è in site/src/lib/orologiaio-api.ts.
import { handleOrologiaio, creaRateLimiter, type Env } from '../../site/src/lib/orologiaio-api.ts';
import type { Directory } from '../../site/src/lib/schema.ts';
import raw from '../../site/data/directory.json';

// Il dataset è già validato da scripts/validate.ts durante `npm run build`, prima del bundling.
// Il parse Zod completo a runtime (~38 ms di CPU misurati) supera il limite di 10 ms per
// invocazione delle Pages Function del piano gratuito: qui si usa quindi il JSON validato a build.
const directory = raw as unknown as Directory;

// Il limiter deve vivere quanto l'isolate: creandolo dentro la richiesta il conteggio
// ripartirebbe da zero ogni volta e il limite di 10/minuto non si applicherebbe mai.
const limiter = creaRateLimiter();

// Kill-switch deliberato per il deployment pubblico: il provider Gemini resta
// DISABILITATO anche se una chiave venisse accidentalmente configurata nell'ambiente
// Pages. Le Condizioni aggiuntive del Gemini API richiedono i Paid Services per i
// client offerti a utenti EEA/CH/UK e questo sito è gratuito: qui non viene passata
// alcuna chiave e l'assistente risponde solo con l'interpretazione locale
// ("modalita": "non-configurato"). L'integrazione Gemini per i test privati vive
// fuori da questa entry ed è isolata: scripts/verify-gemini-live.ts (chiamate dirette
// al provider) e le preview Vercel protette. Non rimuovere questo blocco.
const envPubblico: Env = {};
export const onRequest = (context: { request: Request; env: Env }) =>
  // context.env resta accettato per compatibilità con il runtime Pages, ma viene
  // ignorato: è il kill-switch descritto sopra.
  handleOrologiaio(context.request, envPubblico, { dir: directory, limiter });
