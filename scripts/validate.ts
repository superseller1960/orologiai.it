import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { directorySchema } from '../site/src/lib/schema.ts';
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const old = JSON.parse(await readFile('site/data/orologerie.json', 'utf8'));
for (const original of old.orologerie) {
  const current = data.attivita.find(b => b.id === original.id);
  assert.ok(current, `Attività storica persa: ${original.id}`);
  assert.equal(current.nome, original.nome);
  assert.equal(current.storia.testo, original.storia);
  assert.equal(current.storia.annoFondazione, original.anno);
  for (const service of original.servizi) assert.ok(current.servizi.some(s => s.id === service));
  for (const brand of original.marche) assert.ok(Object.values(current.marchi).flat().some(c => c.marca === brand));
}
console.log(`Dati validi: ${data.attivita.length} attività, ${data.localita.length} località; ${old.orologerie.length} record storici conservati.`);
