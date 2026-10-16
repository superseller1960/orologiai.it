// Pages Function: POST /api/orologiaio. Il codice vero è in site/src/lib/orologiaio-api.ts.
import { handleOrologiaio, type Env } from '../../site/src/lib/orologiaio-api.ts';
import { directory } from '../../site/src/lib/directory.ts';

export const onRequest = (context: { request: Request; env: Env }) =>
  handleOrologiaio(context.request, context.env, { dir: directory });
