// Pages Function: POST /api/orologiaio. Il codice vero è in site/src/lib/orologiaio-api.ts.
import { handleOrologiaio, creaRateLimiter, type Env } from '../../site/src/lib/orologiaio-api.ts';
import type { Directory } from '../../site/src/lib/schema.ts';
import raw from '../../site/data/directory.json' with { type: 'json' };

// Il dataset è già validato da scripts/validate.ts durante `npm run build`, prima del bundling.
// Il parse Zod completo a runtime (~38 ms di CPU misurati) supera il limite di 10 ms per
// invocazione delle Pages Function del piano gratuito: qui si usa quindi il JSON validato a build.
const directory = raw as unknown as Directory;

// Il limiter deve vivere quanto l'isolate: creandolo dentro la richiesta il conteggio
// ripartirebbe da zero ogni volta e il limite di 10/minuto non si applicherebbe mai.
const limiter = creaRateLimiter();

export const onRequest = (context: { request: Request; env: Env }) =>
  handleOrologiaio(context.request, context.env, { dir: directory, limiter });
