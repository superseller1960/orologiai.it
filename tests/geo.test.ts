import test from 'node:test';
import assert from 'node:assert/strict';
import { estraiPosizioneApprossimativa, normalizzaRegioneItaliana } from '../site/src/lib/geo.ts';
import { onRequest } from '../functions/api/posizione.ts';

test('normalizzazione codici e nomi regionali italiani', () => {
  assert.equal(normalizzaRegioneItaliana('52')?.slug, 'toscana');
  assert.equal(normalizzaRegioneItaliana('IT-52')?.slug, 'toscana');
  assert.equal(normalizzaRegioneItaliana('Tuscany')?.slug, 'toscana');
  assert.equal(normalizzaRegioneItaliana('toscana')?.slug, 'toscana');
  assert.equal(normalizzaRegioneItaliana('25')?.slug, 'lombardia');
  assert.equal(normalizzaRegioneItaliana('Lombardy')?.slug, 'lombardia');
  assert.equal(normalizzaRegioneItaliana('62')?.slug, 'lazio');
  assert.equal(normalizzaRegioneItaliana('Piedmont')?.slug, 'piemonte');
  assert.equal(normalizzaRegioneItaliana('45')?.slug, 'emilia-romagna');
  assert.equal(normalizzaRegioneItaliana('unknown'), null);
  assert.equal(normalizzaRegioneItaliana(null), null);
});

test('estraiPosizioneApprossimativa da header Cloudflare (senza GPS)', () => {
  const reqIt = new Request('https://orologiai.it/api/posizione', {
    headers: {
      'cf-ipcountry': 'IT',
      'cf-region-code': '52',
      'cf-ipcity': 'Firenze',
    },
  });
  const resIt = estraiPosizioneApprossimativa(reqIt);
  assert.equal(resIt.disponibile, true);
  assert.equal(resIt.regioneSlug, 'toscana');
  assert.equal(resIt.regioneNome, 'Toscana');
  assert.equal(resIt.citta, 'Firenze');
  assert.match(resIt.messaggio, /senza GPS/);

  const reqForeign = new Request('https://orologiai.it/api/posizione', {
    headers: { 'cf-ipcountry': 'FR' },
  });
  const resForeign = estraiPosizioneApprossimativa(reqForeign);
  assert.equal(resForeign.disponibile, false);
  assert.equal(resForeign.paese, 'FR');

  const reqEmpty = new Request('https://orologiai.it/api/posizione');
  const resEmpty = estraiPosizioneApprossimativa(reqEmpty);
  assert.equal(resEmpty.disponibile, false);
});

test('endpoint /api/posizione risponde con cache-control no-store per evitare leaking tra utenti', async () => {
  const req = new Request('https://orologiai.it/api/posizione', {
    method: 'GET',
    headers: { 'cf-ipcountry': 'IT', 'cf-region': 'Lazio' },
  });
  const resp = await onRequest({ request: req });
  assert.equal(resp.status, 200);
  assert.match(resp.headers.get('cache-control') ?? '', /no-store/);
  const data = await resp.json();
  assert.equal(data.regioneSlug, 'lazio');

  const postReq = new Request('https://orologiai.it/api/posizione', { method: 'POST' });
  const postResp = await onRequest({ request: postReq });
  assert.equal(postResp.status, 405);
});
