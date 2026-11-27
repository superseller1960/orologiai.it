import { assertAbsentOrReviewedCoordinate } from './verified-coordinate.ts';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const baseline = directorySchema.parse(
  JSON.parse(execFileSync('git', ['show', '7233fcb:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()),
) as Directory;
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8'))) as Directory;
const report = JSON.parse(await readFile('data/reports/lotto-06-20261026-applied.json', 'utf8'));

test('Lotto 6: +32 nuove orologerie nel Centro, Adriatico e Sud, tutte le 189 attività precedenti preservate', () => {
  assert.equal(report.nuoveSchede.length, 32);
  assert.ok(data.attivita.length >= baseline.attivita.length + 32);
  assert.ok(data.localita.length >= baseline.localita.length + 20);
  for (const vecchio of baseline.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id);
    assert.ok(attuale, `record precedente perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug);
    assert.equal(attuale.localitaId, vecchio.localitaId);
  }
});

test('Lotto 6: 10 province del Centro-Sud prima a zero (PU, FM, TE, BN, AV, FG, BT, TA, BR, MT) ora coperte e ricercabili', () => {
  const locById = new Map(data.localita.map(l => [l.id, l]));
  for (const sigla of ['PU', 'FM', 'TE', 'BN', 'AV', 'FG', 'BT', 'TA', 'BR', 'MT']) {
    const inProv = data.attivita.filter(a => locById.get(a.localitaId)?.siglaProvincia === sigla);
    assert.ok(inProv.length >= 1, `provincia ${sigla} ancora scoperta`);
  }
  for (const comune of ['pesaro', 'fano', 'porto-san-giorgio', 'porto-sant-elpidio', 'macerata', 'benevento', 'avellino', 'foggia', 'barletta', 'andria', 'taranto', 'brindisi', 'matera', 'policoro']) {
    const res = searchDirectory(data, { localita: comune });
    assert.ok(res.length >= 1, `ricerca per comune ${comune} senza risultati`);
  }
});

test('Lotto 6: zero duplicati da revisionare, autorizzazioni solo con fonte del marchio, descrizioni originali', () => {
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
    assertAbsentOrReviewedCoordinate(b);
    for (const c of [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale]) {
      assert.ok(c.fonti.some(fid => fontiById.get(fid)?.tipo === 'marchio-ufficiale'), `${b.id}: ${c.marca} senza fonte marchio-ufficiale`);
    }
  }
});
