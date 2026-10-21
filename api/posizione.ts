// Vercel Function: GET /api/posizione. Stessa logica della funzione Cloudflare in functions/api/posizione.ts.
import { handlePosizione } from '../site/src/lib/posizione-api.ts';

export default {
  fetch(request: Request) {
    return handlePosizione(request);
  },
};
