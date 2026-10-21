// Vercel Function: GET /api/posizione. Stessa logica della funzione Cloudflare in functions/api/posizione.ts.
// Import senza estensione .ts: il tracer di Vercel non segue gli specifier con estensione.
import { handlePosizione } from '../site/src/lib/posizione-api';

export default {
  fetch(request: Request) {
    return handlePosizione(request);
  },
};
