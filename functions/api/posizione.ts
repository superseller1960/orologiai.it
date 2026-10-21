import { estraiPosizioneApprossimativa } from '../../site/src/lib/geo.ts';

export const onRequest = (context: { request: Request }) => {
  const req = context.request;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(JSON.stringify({ errore: 'Metodo non consentito.' }), {
      status: 405,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, no-store, max-age=0',
        allow: 'GET, HEAD',
      },
    });
  }

  const info = estraiPosizioneApprossimativa(req);
  return new Response(JSON.stringify(info), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // No-store e private per evitare che Cloudflare CDN memorizzi la posizione di un utente per un altro.
      'cache-control': 'private, no-store, max-age=0',
    },
  });
};
