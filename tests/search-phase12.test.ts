import assert from 'node:assert/strict';
import test from 'node:test';
import { directory } from '../site/src/lib/directory.ts';
import { localityMatches, searchDirectory } from '../site/src/lib/search.ts';

test('Fase12: una città identificata prevale su regione e provincia incompatibili', () => {
  const expected = searchDirectory(directory, { localita: 'milano' }).map(r => r.business.id);
  assert.ok(expected.length > 0);
  assert.deepEqual(searchDirectory(directory, { localita: 'milano', regione: 'toscana', provincia: 'firenze' }).map(r => r.business.id), expected);
  assert.ok(searchDirectory(directory, { localita: 'milano', regione: 'toscana' }).every(r => r.business.localitaId === 'milano'));
});
test('Fase12: città e servizio facoltativo mantengono solo claim documentati', () => {
  assert.deepEqual(searchDirectory(directory, { localita: 'firenze' }).map(r => r.business.id).sort(), directory.attivita.filter(b => b.localitaId === 'firenze' && b.attendibilita.stato !== 'chiusa').map(b => b.id).sort());
  assert.ok(searchDirectory(directory, { localita: 'firenze', servizio: 'riparazione' }).every(r => r.business.servizi.some(s => s.id === 'riparazione')));
  assert.equal(searchDirectory(directory, { localita: 'firenze', q: 'zzzz-no-business-fixture-000' }).length, 0);
});
test('Fase12: autocomplete parziale, accenti, apostrofi e omonimi senza scelta implicita', () => {
  const first = directory.localita[0];
  const fixture = { localita: [
    { ...first, id: 'sant-agata-a', comune: 'Sant’Àgata', provincia: 'Provincia A' },
    { ...first, id: 'sant-agata-b', comune: "Sant'Agata", provincia: 'Provincia B' },
  ] };
  assert.equal(localityMatches(fixture, 'sant').length, 2);
  assert.equal(localityMatches(fixture, "SANT'AGATA", true).length, 2);
  assert.equal(localityMatches(fixture, 'non-censita').length, 0);
  assert.equal(localityMatches(fixture, '').length, 0);
});
