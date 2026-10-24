// Entry `_worker.js` per il deployment Cloudflare Pages in modalità avanzata: gestisce le due
// API (/api/orologiaio e /api/posizione) e lascia tutti gli altri percorsi ai file statici
// tramite il binding ASSETS. Con `_routes.json` solo le due API invocano il worker, quindi le
// pagine statiche non consumano quota di esecuzione. La logica condivisa resta in
// functions/api/orologiaio.ts (kill-switch Gemini + attivazione Workers AI esplicita) e in
// site/src/lib/*; questo file non duplica comportamenti. Generato in .runtime/pages-build da
// `npm run package:pages`, che è anche l'artefatto consegnato per il deployment Wrangler.
import { onRequest } from '../functions/api/orologiaio.ts';
import { handlePosizione } from '../site/src/lib/posizione-api.ts';
import type { Env } from '../site/src/lib/orologiaio-api.ts';

export type EnvPages = Env & { ASSETS: { fetch(request: Request): Promise<Response> } };

export default {
  fetch(request: Request, env: EnvPages): Promise<Response> | Response {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/orologiaio') return onRequest({ request, env });
    if (pathname === '/api/posizione') return handlePosizione(request);
    return env.ASSETS.fetch(request);
  },
};
