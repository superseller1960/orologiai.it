import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

const load = async (): Promise<Directory> =>
  directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('descrizioni personalizzate: ogni scheda ha una descrizione propria e sostanziosa', async () => {
  const directory = await load();
  assert.ok(directory.attivita.length >= 159);

  const viste = new Map<string, string>();
  for (const b of directory.attivita) {
    const d = b.descrizione.trim();
    assert.ok(d.length >= 70, `${b.id}: descrizione troppo sintetica (${d.length} caratteri)`);
    assert.ok(!viste.has(d), `${b.id}: descrizione duplicata di ${viste.get(d)}`);
    viste.set(d, b.id);
  }

  // Le tre schede completate dall'intervento citano la città e i servizi documentati
  const report = JSON.parse(await readFile('data/reports/descrizioni-20261025-applied.json', 'utf8'));
  assert.deepEqual(report.schedeAggiornate.sort(), [
    'de-marco-belluno', 'fronza-trento', 'gioielleria-di-marco-nicosia',
  ]);
  const byId = (id: string) => directory.attivita.find(a => a.id === id)!;
  assert.match(byId('fronza-trento').descrizione, /Trento/);
  assert.match(byId('fronza-trento').descrizione, /pendoleria/);
  assert.match(byId('gioielleria-di-marco-nicosia').descrizione, /Nicosia/);
  assert.match(byId('de-marco-belluno').descrizione, /Belluno/);
  assert.match(byId('de-marco-belluno').descrizione, /revisione/);
});
