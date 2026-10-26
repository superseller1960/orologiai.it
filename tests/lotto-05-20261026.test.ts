import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const baseline = directorySchema.parse(
  JSON.parse(execFileSync('git', ['show', 'fc730d0:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()),
) as Directory;
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8'))) as Directory;
const report = JSON.parse(await readFile('data/reports/lotto-05-20261026-applied.json', 'utf8'));

test('Lotto 5: +26 nuove orologerie nel Nord e Centro-Nord, tutte le 163 attività storiche preservate', () => {
  assert.equal(report.nuoveSchede.length, 26);
  assert.ok(data.attivita.length >= baseline.attivita.length + 26);
  assert.ok(data.localita.length >= baseline.localita.length + 14);
  for (const vecchio of baseline.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id);
    assert.ok(attuale, `record storico perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug);
    assert.equal(attuale.localitaId, vecchio.localitaId);
  }
  assert.equal(new Set(data.attivita.map(b => b.id)).size, data.attivita.length, 'ID unici');
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length, 'Slug unici');
});

test('Lotto 5: 8 province settentrionali prima a zero (CN, SV, SP, PC, BZ, GO, PN, RE) ora coperte e ricercabili', () => {
  const locById = new Map(data.localita.map(l => [l.id, l]));
  for (const sigla of ['CN', 'SV', 'SP', 'PC', 'BZ', 'GO', 'PN', 'RE']) {
    const inProv = data.attivita.filter(a => locById.get(a.localitaId)?.siglaProvincia === sigla);
    assert.ok(inProv.length >= 1, `provincia ${sigla} ancora scoperta`);
  }
  for (const comune of ['cuneo', 'bra', 'savona', 'la-spezia', 'sarzana', 'piacenza', 'bolzano', 'brunico', 'monfalcone', 'gorizia', 'pordenone', 'reggio-emilia', 'conegliano', 'casale-monferrato']) {
    const res = searchDirectory(data, { localita: comune });
    assert.ok(res.length >= 1, `ricerca per comune ${comune} senza risultati`);
  }
});

test('Lotto 5: zero duplicati da revisionare, autorizzazioni solo con fonte del marchio, descrizioni originali', () => {
  const nuoviIds = new Set<string>(report.nuoveSchede.map((s: { id: string }) => s.id));
  const dup = findDuplicates(data).filter(
    d => d.esito === 'da-revisionare' && (nuoviIds.has(d.primo) || nuoviIds.has(d.secondo)),
  );
  assert.deepEqual(dup, []);
  const fontiById = new Map(data.fonti.map(f => [f.id, f]));
  for (const s of report.nuoveSchede) {
    const b = data.attivita.find(x => x.id === s.id)!;
    assert.ok(b, `scheda mancante: ${s.id}`);
    assert.ok(b.descrizione.length >= 80, `${b.id}: descrizione troppo breve`);
    assert.equal(b.posizione.coordinate, null, `${b.id}: nessuna coordinata non verificata`);
    for (const c of [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale]) {
      assert.ok(c.fonti.some(fid => fontiById.get(fid)?.tipo === 'marchio-ufficiale'), `${b.id}: ${c.marca} senza fonte marchio-ufficiale`);
    }
  }
});
