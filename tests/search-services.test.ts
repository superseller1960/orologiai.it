import assert from 'node:assert/strict';
import test from 'node:test';
import { directory } from '../site/src/lib/directory.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

test('la ricerca libera include le attività che documentano il servizio cercato', () => {
  const cases = [
    ['tagliando', 'revisione'],
    ['cambio batteria', 'batterie'],
    ['cinturino', 'cinturini'],
  ] as const;

  for (const [query, serviceId] of cases) {
    const expected = directory.attivita.filter(b => b.servizi.some(s => s.id === serviceId));
    const results = new Set(searchDirectory(directory, { q: query }).map(r => r.business.id));
    assert.ok(expected.length > 0, `il dataset deve contenere attività con ${serviceId}`);
    for (const business of expected) {
      assert.ok(results.has(business.id), `${query} deve trovare ${business.nome}`);
    }
  }
});

test('la ricerca combina un sinonimo di servizio e la località', () => {
  const expected = directory.attivita.find(b =>
    b.servizi.some(s => s.id === 'revisione') &&
    directory.localita.find(p => p.id === b.localitaId)?.comune.toLowerCase() === 'scandicci'
  );
  assert.ok(expected, 'il dataset deve contenere almeno un orologiaio a Scandicci con revisione documentata');
  const results = searchDirectory(directory, { q: 'tagliando scandicci' });
  assert.ok(results.some(r => r.business.id === expected.id));
});
