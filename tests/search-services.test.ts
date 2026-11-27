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

test('livelli di ricerca: esatti separati dai laboratori con servizio generico documentato', async () => {
  const { searchDirectoryTiered } = await import('../site/src/lib/search.ts');
  const cities = ['Torino', 'Firenze', 'Milano', 'Roma'];
  for (const comune of cities) {
    const place = directory.localita.find(p => p.comune === comune);
    assert.ok(place, `${comune} deve essere censita`);
    const { esatti, pertinenti } = searchDirectoryTiered(directory, { localita: place.id, servizio: 'riparazione-meccanici' });
    const esattiIds = new Set(esatti.map(r => r.business.id));
    for (const r of esatti) assert.ok(r.business.servizi.some(s => s.id === 'riparazione-meccanici'), `${r.business.nome} deve documentare il servizio esatto`);
    for (const r of pertinenti) {
      assert.ok(!esattiIds.has(r.business.id), `${r.business.nome} non deve comparire anche tra gli esatti`);
      assert.ok(r.business.servizi.some(s => s.id === 'riparazione'), `${r.business.nome} deve documentare la riparazione generica`);
      assert.ok(!r.business.servizi.some(s => s.id === 'riparazione-meccanici'), `${r.business.nome} non deve essere promosso a esatto`);
    }
  }
  const torino = directory.localita.find(p => p.comune === 'Torino')!;
  const { esatti, pertinenti } = searchDirectoryTiered(directory, { localita: torino.id, servizio: 'riparazione-meccanici' });
  assert.equal(esatti.length, 1, 'Torino deve avere una sola corrispondenza esatta per riparazione meccanici');
  // Almeno le tre attività storiche con riparazione generica: i nuovi lotti possono aggiungerne.
  assert.ok(pertinenti.length >= 3, 'Torino deve mostrare le attività con riparazione generica come pertinenti');
});
