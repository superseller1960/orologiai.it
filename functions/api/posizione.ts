// Pages Function: GET /api/posizione. La logica condivisa è in site/src/lib/posizione-api.ts.
import { handlePosizione } from '../../site/src/lib/posizione-api.ts';

export const onRequest = (context: { request: Request }) => handlePosizione(context.request);
