import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

test('Jolly Gallery: scheda documentata, ricerca territoriale e assenza di duplicati evidenti', async () => {
  const d = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
  const id = 'gioielleria-jolly-gallery-asti';
  const b = d.attivita.find(x => x.id === id);
  assert.ok(b);
  assert.equal(b.posizione.indirizzo, 'Corso Vittorio Alfieri, 252');
  assert.equal(b.contatti.telefono, '+39 0141 353828');
  assert.deepEqual(b.marchi.assistenzaUfficiale, []);
  for (const servizio of ['riparazione', 'riparazione-meccanici', 'riparazione-quarzo']) {
    assert.ok(b.servizi.some(s => s.id === servizio));
  }
  assert.ok(searchDirectory(d, { localita: 'asti', servizio: 'riparazione-meccanici' }).some(r => r.business.id === id));
  assert.deepEqual(findDuplicates(d).filter(x => x.primo === id || x.secondo === id), []);
  const html = await readFile(`dist/orologeria/${id}/index.html`, 'utf8');
  assert.match(html, /Jolly Gallery/);
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  assert.ok(sitemap.includes(`/orologeria/${id}/`));
});
