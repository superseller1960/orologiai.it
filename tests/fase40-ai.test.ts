import test from 'node:test';
import assert from 'node:assert/strict';
import { directory } from '../site/src/lib/directory.ts';
import { interpretaRichiesta } from '../site/src/lib/assistant.ts';

const leggi = (messaggio: string) => interpretaRichiesta(messaggio, directory).criteri;

test('Fase 40 AI: una domanda sul rotore non attiva filtri commerciali', () => {
  const c = leggi('Come funziona il rotore di un orologio automatico?');
  assert.equal(c.servizio, undefined, 'Nessun servizio deve essere attivato da una domanda tecnica');
  assert.equal(c.localita, undefined);
});

test('Fase 40 AI: una domanda sullo scappamento resta informativa', () => {
  const c = leggi('Come funziona uno scappamento ad ancora?');
  assert.equal(c.servizio, undefined);
  assert.equal(c.marca, undefined);
});

test('Fase 40 AI: un guasto descritto attiva la riparazione, senza diagnosi inventata', () => {
  const c = leggi('Il mio automatico perde dieci minuti al giorno.');
  assert.equal(c.servizio, 'riparazione');
});

test('Fase 40 AI: una richiesta esplicita di revisione conserva servizio e località', () => {
  const c = leggi('Cerco una revisione a Firenze.');
  assert.equal(c.servizio, 'revisione');
  assert.equal(c.localita, 'firenze');
});

test('Fase 40 AI: il cambio vetro è una richiesta di servizio, non una diagnosi', () => {
  const c = leggi('Dove posso cambiare il vetro di un orologio?');
  assert.equal(c.servizio, 'ricambi');
  assert.equal(c.localita, undefined);
});

test('Fase 40 AI: l’assistenza ufficiale richiesta resta ancorata a marca e città', () => {
  const c = leggi('Cerco assistenza ufficiale Rolex a Milano.');
  assert.equal(c.marca, 'Rolex');
  assert.equal(c.ruoloMarca, 'assistenzaUfficiale');
  assert.equal(c.localita, 'milano');
});
