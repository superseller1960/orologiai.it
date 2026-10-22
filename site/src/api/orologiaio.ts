// Sorgente della funzione Vercel per POST /api/orologiaio.
// Viene bundlata in un singolo api/orologiaio.js autosufficiente da scripts/bundle-vercel-api.mjs
// durante `npm run build`: la Lambda Vercel contiene solo la entry compilata, quindi nessun
// import può restare risolto a runtime. La logica rimane in site/src/lib/orologiaio-api.ts
// e viene condivisa con la entry di compatibilità Cloudflare Pages in functions/api/orologiaio.ts.
import { handleOrologiaio, creaRateLimiter, type Env } from '../lib/orologiaio-api.ts';
import type { Directory } from '../lib/schema.ts';
import raw from '../../data/directory.json';

// Come in functions/api/orologiaio.ts: il dataset è validato a build da scripts/validate.ts
// e il parse Zod a runtime (~38 ms di CPU) supererebbe il limite di 10 ms delle function gratuite.
const directory = raw as unknown as Directory;

// Il limitatore vive quanto l'istanza: è un freno best-effort, non una protezione globale.
const limiter = creaRateLimiter();

export default {
  fetch(request: Request) {
    const env: Env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
    return handleOrologiaio(request, env, { dir: directory, limiter });
  },
};
