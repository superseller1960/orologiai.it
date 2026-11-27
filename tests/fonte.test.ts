import test from 'node:test';
import assert from 'node:assert/strict';
import { directory } from '../site/src/lib/directory.ts';
import { creaCacheFonte, fonteAmmessa, handleFonte, testoDaHtml } from '../site/src/lib/fonte-api.ts';

const fonte = directory.fonti.find(f => f.tipo === 'sito-ufficiale' && f.url.startsWith('https://'))!;

function richiesta(url: string, init: RequestInit = {}) {
  return new Request(`https://www.orologiai.it/api/fonte?url=${encodeURIComponent(url)}`, init);
}

test('fonte: solo URL censiti, https e senza credenziali', () => {
  assert.ok(fonteAmmessa(directory, fonte.url));
  assert.equal(fonteAmmessa(directory, 'https://evil.example.com/'), null);
  assert.equal(fonteAmmessa(directory, fonte.url.replace('https://', 'http://')), null);
  assert.equal(fonteAmmessa(directory, 'https://user:pass@www.orologiai.it/'), null);
});

test('fonte: testo leggibile senza script, stili e marcatori', () => {
  const testo = testoDaHtml('<html><head><style>a{color:red}</style><script>alert(1)</script></head><body><h1>Orologeria</h1><p>Revisione&nbsp;e riparazione</p></body></html>');
  assert.equal(testo, 'Orologeria Revisione e riparazione');
});

test('fonte: solo GET e solo fonti censite', async () => {
  const post = await handleFonte(richiesta(fonte.url, { method: 'POST' }), { dir: directory });
  assert.equal(post.status, 405);
  const ignota = await handleFonte(richiesta('https://evil.example.com/'), { dir: directory });
  assert.equal(ignota.status, 404);
});

test('fonte: limite di dimensione, redirect non seguiti e risposta con snippet', async () => {
  const redirect = await handleFonte(richiesta(fonte.url), {
    dir: directory, limiter: { allow: () => true },
    fetch: async () => new Response('', { status: 302, headers: { location: 'https://evil.example.com/' } }),
  });
  assert.equal(redirect.status, 502);

  const ok = await handleFonte(richiesta(fonte.url), {
    dir: directory, limiter: { allow: () => true },
    fetch: async () => new Response('<p>' + 'orologeria '.repeat(200) + '</p>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }),
  });
  assert.equal(ok.status, 200);
  const corpo = await ok.json() as { snippet: string; troncato: boolean; titolo: string; url: string };
  assert.equal(corpo.url, fonte.url);
  assert.equal(corpo.titolo, fonte.titolo);
  assert.equal(corpo.troncato, true);
  assert.ok(corpo.snippet.length <= 600);

  const rifiutata = await handleFonte(richiesta(fonte.url), {
    dir: directory, limiter: { allow: () => true },
    fetch: async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  });
  assert.equal(rifiutata.status, 415);
});

test('fonte: cache per isolate con scadenza', () => {
  const cache = creaCacheFonte(2, 1000);
  const valore = { url: fonte.url, titolo: 'x', tipo: 'sito-ufficiale', consultataIl: '2026-11-04', snippet: 'y', troncato: false, recuperatoIl: '2026-11-05' };
  cache.set(fonte.url, valore, 0);
  assert.equal(cache.get(fonte.url, 500)?.titolo, 'x');
  assert.equal(cache.get(fonte.url, 2000), null);
});
