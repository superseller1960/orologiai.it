// Sorgente della funzione Vercel per POST /api/orologiaio.
// Viene bundlata in un singolo api/orologiaio.js autosufficiente da scripts/bundle-vercel-api.mjs
// durante `npm run build`: la Lambda Vercel contiene solo la entry compilata, quindi nessun
// import può restare risolto a runtime. La logica rimane in site/src/lib/orologiaio-api.ts
// e viene condivisa con la Pages Function Cloudflare.
import { handleOrologiaio, creaRateLimiter, type Env } from '../lib/orologiaio-api.ts';
import { directory } from '../lib/directory.ts';

// Il limitatore vive quanto l'istanza: è un freno best-effort, non una protezione globale.
const limiter = creaRateLimiter();

export default {
  fetch(request: Request) {
    const env: Env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
    return handleOrologiaio(request, env, { dir: directory, limiter });
  },
};
