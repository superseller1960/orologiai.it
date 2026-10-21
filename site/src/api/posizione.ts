// Sorgente della funzione Vercel per GET/HEAD /api/posizione.
// Viene bundlata in un singolo api/posizione.js autosufficiente da scripts/bundle-vercel-api.mjs
// durante `npm run build` (vedi site/src/api/orologiaio.ts). La logica è in site/src/lib/posizione-api.ts
// e viene condivisa con la Pages Function Cloudflare.
import { handlePosizione } from '../lib/posizione-api.ts';

export default {
  fetch(request: Request) {
    return handlePosizione(request);
  },
};
