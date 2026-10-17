// Pages Function: POST /api/orologiaio. Il codice vero è in site/src/lib/orologiaio-api.ts.
import { handleOrologiaio, creaRateLimiter, type Env } from '../../site/src/lib/orologiaio-api.ts';
import { directory } from '../../site/src/lib/directory.ts';

// Il limiter deve vivere quanto l'isolate: creandolo dentro la richiesta il conteggio
// ripartirebbe da zero ogni volta e il limite di 10/minuto non si applicherebbe mai.
const limiter = creaRateLimiter();

export const onRequest = (context: { request: Request; env: Env }) =>
  handleOrologiaio(context.request, context.env, { dir: directory, limiter });
