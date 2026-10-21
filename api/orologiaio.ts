// Vercel Function: POST /api/orologiaio. Stessa logica della funzione Cloudflare in functions/api/orologiaio.ts.
// Import senza estensione .ts: il tracer di Vercel non segue gli specifier con estensione.
import { handleOrologiaio, creaRateLimiter, type Env } from '../site/src/lib/orologiaio-api';
import { directory } from '../site/src/lib/directory';

// Il limitatore vive quanto l'istanza: è un freno best-effort, non una protezione globale (vedi docs/ASSISTENTE-AI.md).
const limiter = creaRateLimiter();

export default {
  fetch(request: Request) {
    const env: Env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
    return handleOrologiaio(request, env, { dir: directory, limiter });
  },
};
