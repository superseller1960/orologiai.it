import test from 'node:test';
import assert from 'node:assert/strict';
import { directory } from '../site/src/lib/directory.ts';
import { interpretaRichiesta } from '../site/src/lib/assistant.ts';

const criteri = (messaggio: string) => interpretaRichiesta(messaggio, directory).criteri;

// Fase 41: le parole dell'orologeria non sono città. «ad ancora» non deve diventare una località.
const COMPONENTI = ['ancora', 'corona', 'ponte', 'ruota', 'cassa', 'movimento', 'bilanciere', 'bariletto', 'rotore', 'scappamento'];

test('Fase 41: le domande tecniche non producono località non censite', () => {
  const domande = [
    'Come funziona uno scappamento ad ancora?',
    'Come funziona il rotore di un automatico?',
    'Che cosa fa il bilanciere?',
    'Che cos’è il bariletto?',
    'A cosa serve la corona di carica?',
    'Come si regola il ponte?',
    'Differenza tra movimento a ruota e a cassa?',
  ];
  for (const domanda of domande) {
    const c = criteri(domanda);
    assert.equal(c.localita, undefined, domanda);
    assert.equal(c.localitaNonCensita, undefined, domanda);
    assert.equal(c.servizio, undefined, domanda);
    assert.equal(c.regione, undefined, domanda);
    assert.equal(c.provincia, undefined, domanda);
  }
});

test('Fase 41: ogni componente dell’orologio resta fuori dalla geografia', () => {
  for (const componente of COMPONENTI) {
    const c = criteri(`Come funziona ${componente}?`);
    assert.equal(c.localitaNonCensita, undefined, componente);
    assert.equal(c.localita, undefined, componente);
  }
});

test('Fase 41: un guasto reale attiva l’intervento, senza diagnosi certa', () => {
  const c = criteri('Il mio automatico perde dieci minuti al giorno');
  assert.equal(c.servizio, 'riparazione');
  assert.equal(c.localitaNonCensita, undefined);
});

test('Fase 41: servizio e città restano corretti nella richiesta esplicita', () => {
  const c = criteri('Cerco revisione orologio automatico a Firenze');
  assert.equal(c.servizio, 'revisione');
  assert.equal(c.localita, 'firenze');
});

test('Fase 41: marca, ruolo e città restano ancorati alla richiesta', () => {
  const c = criteri('Cerco assistenza ufficiale Rolex a Milano');
  assert.equal(c.marca, 'Rolex');
  assert.equal(c.ruoloMarca, 'assistenzaUfficiale');
  assert.equal(c.localita, 'milano');
});

test('Fase 41: una città non censita resta dichiarata, senza sostituzioni', () => {
  const c = criteri('Cerco un orologiaio ad Alassio');
  assert.equal(c.localitaNonCensita, 'Alassio');
  assert.equal(c.localita, undefined);
  assert.equal(c.provincia, undefined);
});

test('Fase 41: «a cassa» in una richiesta operativa non diventa una città', () => {
  const c = criteri('Cerco riparazione orologio a cassa tonda');
  assert.equal(c.servizio, 'riparazione');
  assert.equal(c.localitaNonCensita, undefined);
});
