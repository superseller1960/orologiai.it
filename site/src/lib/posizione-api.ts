import { estraiPosizioneApprossimativa } from './geo.ts';

// Gestisce GET/HEAD /api/posizione. Nessun GPS: solo stima dagli header geografici della piattaforma.
export function handlePosizione(request: Request): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ errore: 'Metodo non consentito.' }), {
      status: 405,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, no-store, max-age=0',
        allow: 'GET, HEAD',
      },
    });
  }

  const info = estraiPosizioneApprossimativa(request);
  return new Response(JSON.stringify(info), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // No-store e private: la posizione stimata non deve essere memorizzata da una cache condivisa.
      'cache-control': 'private, no-store, max-age=0',
    },
  });
}
