import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

const baseRef = '2a207dfd006c2729c774743889888c5e736e3f25';
const original = directorySchema.parse(JSON.parse(execFileSync('git', ['show', `${baseRef}:site/data/directory.json`], { maxBuffer: 20 * 1024 * 1024 }).toString()));
const current = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const cases = [
  ['satolli-pescara', 'pescara', 'pescara', 'abruzzo'],
  ['digiesi-matera', 'matera', 'matera', 'basilicata'],
  ['clementi-bolzano', 'bolzano', 'bolzano', 'trentino-alto-adige'],
  ['dobner-gorizia', 'gorizia', 'gorizia', 'friuli-venezia-giulia'],
] as const;

test('CG23: conserva senza modifiche tutti i 106 record di partenza', () => {
  assert.equal(current.attivita.length, original.attivita.length + 4);
  assert.equal(current.localita.length, original.localita.length + 4);
  assert.equal(current.fonti.length, original.fonti.length + 11);
  for (const field of ['attivita', 'localita', 'fonti'] as const) {
    for (const item of original[field]) assert.deepEqual(current[field].find(x => x.id === item.id), item);
  }
});

test('CG23: territori, fonti, servizi e nessuna autorizzazione inventata', () => {
  for (const [id, localita, provincia, regione] of cases) {
    const b = current.attivita.find(x => x.id === id);
    assert.ok(b, `Attività mancante: ${id}`);
    assert.equal(b.localitaId, localita);
    assert.equal(b.attendibilita.verificataIl, '2026-10-23');
    assert.equal(b.posizione.coordinate, null);
    assert.ok(b.posizione.indirizzo);
    assert.ok(b.servizi.length > 0);
    assert.deepEqual(b.marchi.assistenzaUfficiale, []);
    assert.deepEqual(b.marchi.rivenditaUfficiale, []);
    assert.deepEqual(searchDirectory(current, { localita }).map(x => x.business.id), [id]);
    assert.ok(searchDirectory(current, { provincia }).some(x => x.business.id === id));
    assert.ok(searchDirectory(current, { regione }).some(x => x.business.id === id));
    for (const claim of b.servizi) {
      assert.ok(claim.fonti.length > 0);
      for (const sid of claim.fonti) assert.equal(current.fonti.find(s => s.id === sid)?.tipo, 'sito-ufficiale');
    }
  }
  assert.equal(findDuplicates(current).filter(d => cases.some(([id]) => id === d.primo || id === d.secondo)).length, 0);
});
