// Pages Function: GET /api/fonte?url=… — recupero verificabile di una fonte esterna GIÀ CENSITA.
// Non esegue ricerche web generali: l'URL deve coincidere con quello registrato nel catalogo.
import { handleFonte } from '../../site/src/lib/fonte-api.ts';
import type { Directory } from '../../site/src/lib/schema.ts';
import raw from '../../site/data/directory.json';

const directory = raw as unknown as Directory;

export const onRequest = (context: { request: Request }) => handleFonte(context.request, { dir: directory });
