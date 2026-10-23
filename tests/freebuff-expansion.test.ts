import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { directorySchema, isUsableCoordinate } from '../site/src/lib/schema.ts';
import { integrateReviewedBatch } from '../site/src/lib/reviewed-import.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory, type SearchFilters } from '../site/src/lib/search.ts';

const base = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '71e47a536344cd337e68761dcf58cbfe6b4dcb8f:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()));
const data = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const batch = JSON.parse(readFileSync('data/import/freebuff-national-20261023-reviewed.json', 'utf8'));
const ids = ['magie-in-oro-chieti', 'lombardi-ercolino-isernia', 'fenocchi-san-benedetto-del-tronto'];
const found = (f: SearchFilters) => searchDirectory(data, f).map(r => r.business.id);

test('FB23: tre schede aggiunte, tutti i record originali immutati, nessun nuovo punto mappa', () => {
  assert.ok(data.attivita.length >= base.attivita.length + 3, 'Il primo lotto deve rimanere presente anche con incrementi successivi');
  assert.ok(data.localita.length >= base.localita.length + 3);
  assert.ok(data.fonti.length >= base.fonti.length + 6);
  for (const field of ['attivita', 'localita', 'fonti'] as const) {
    for (const original of base[field]) assert.deepEqual(data[field].find(x => x.id === original.id), original);
  }
  for (const id of ids) {
    const b = data.attivita.find(b => b.id === id)!;
    assert.ok(b);
    assert.equal(b.posizione.coordinate, null);
    assert.equal(b.attendibilita.verificataIl, '2026-10-23');
  }
  assert.equal(data.attivita.filter(b => isUsableCoordinate(b.posizione.coordinate)).length, base.attivita.filter(b => isUsableCoordinate(b.posizione.coordinate)).length);
});

test('FB23: pipeline riproducibile, idempotente e senza collisioni introdotte', () => {
  const result = integrateReviewedBatch(base, batch);
  for (const field of ['attivita', 'localita', 'fonti'] as const) {
    for (const expected of result.directory[field]) assert.deepEqual(data[field].find(x => x.id === expected.id), expected);
  }
  assert.equal(result.report.conteggi.nuove, 3);
  assert.equal(result.report.conteggi.inRevisione, 5);
  assert.equal(result.report.conteggi.duplicatiRilevati, 0);
  const repeated = integrateReviewedBatch(data, batch);
  assert.deepEqual(repeated.directory, data);
  assert.equal(repeated.report.conteggi.giaPresenti, 3);
  assert.equal(findDuplicates(data).filter(d => ids.includes(d.primo) || ids.includes(d.secondo)).length, 0);
  assert.ok(new Set(data.fonti.map(s => s.url)).size >= new Set(base.fonti.map(s => s.url)).size + 6);
});

test('FB23: regione, provincia e comune non includono attività di altri territori', () => {
  for (const [id, localita, provincia, regione] of [
    [ids[0], 'chieti', 'chieti', 'abruzzo'],
    [ids[1], 'isernia', 'isernia', 'molise'],
    [ids[2], 'san-benedetto-del-tronto', 'ascoli-piceno', 'marche'],
  ]) {
    assert.deepEqual(found({ localita }), [id]);
    assert.deepEqual(found({ provincia }), [id]);
    assert.ok(found({ regione }).includes(id));
    assert.deepEqual(found({ localita, regione: 'toscana' }), []);
  }
  assert.deepEqual(found({ localita: 'comune-non-censito' }), []);
});

test('FB23: vendita Hamilton non implica riparazione e autorizzazioni non documentate restano assenti', () => {
  const id = ids[1];
  assert.ok(found({ localita: 'isernia', servizio: 'vendita', marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale' }).includes(id));
  for (const servizio of ['riparazione', 'revisione', 'batterie', 'cinturini', 'restauro-vintage', 'valutazioni', 'acquisto-permuta']) {
    assert.deepEqual(found({ localita: 'isernia', servizio }), []);
  }
  assert.deepEqual(found({ localita: 'isernia', marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' }), []);
  assert.deepEqual(found({ localita: 'san-benedetto-del-tronto', marca: 'Rolex', ruoloMarca: 'rivenditaUfficiale' }), []);
  assert.ok(found({ localita: 'san-benedetto-del-tronto', marca: 'Rolex', ruoloMarca: 'riparati' }).includes(ids[2]));
  for (const b of data.attivita.filter(b => ids.includes(b.id))) {
    for (const s of b.servizi) assert.ok(s.fonti.every(id => ['sito-ufficiale', 'marchio-ufficiale'].includes(data.fonti.find(f => f.id === id)!.tipo)));
  }
});
