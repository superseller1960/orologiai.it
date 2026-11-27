import { assertAbsentOrReviewedCoordinate } from './verified-coordinate.ts';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const baseline = directorySchema.parse(
  JSON.parse(execFileSync('git', ['show', '56573d4:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()),
) as Directory;
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8'))) as Directory;
const report = JSON.parse(await readFile('data/reports/lotto-07-20261026-applied.json', 'utf8'));

test('Lotto 7: +28 orologerie Sud, Isole e province residue, tutte le attività precedenti preservate', () => {
  assert.equal(report.nuoveSchede.length, 28);
  assert.ok(data.attivita.length >= baseline.attivita.length + 28);
  for (const vecchio of baseline.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id);
    assert.ok(attuale, `record perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug);
    assert.equal(attuale.localitaId, vecchio.localitaId);
  }
});

test('Lotto 7: ultime 7 province italiane a zero (KR, VV, CL, RG, NU, OR, SU) ora coperte', () => {
  const locById = new Map(data.localita.map(l => [l.id, l]));
  for (const sigla of ['KR', 'VV', 'CL', 'RG', 'NU', 'OR', 'SU']) {
    const inProv = data.attivita.filter(a => locById.get(a.localitaId)?.siglaProvincia === sigla);
    assert.ok(inProv.length >= 1, `provincia ${sigla} scoperta`);
  }
  for (const c of ['crotone', 'vibo-valentia', 'caltanissetta', 'ragusa', 'modica', 'nuoro', 'oristano', 'iglesias']) {
    assert.ok(searchDirectory(data, { localita: c }).length >= 1, `comune ${c}`);
  }
});

test('Lotto 7: zero duplicati, autorizzazioni solo fonte marchio, descrizioni originali', () => {
  const ids = new Set<string>(report.nuoveSchede.map((s: { id: string }) => s.id));
  assert.deepEqual(findDuplicates(data).filter(d => d.esito === 'da-revisionare' && (ids.has(d.primo) || ids.has(d.secondo))), []);
  const fontiById = new Map(data.fonti.map(f => [f.id, f]));
  for (const s of report.nuoveSchede) {
    const b = data.attivita.find(x => x.id === s.id)!;
    assert.ok(b.descrizione.length >= 80, `${b.id}: descrizione breve`);
    assertAbsentOrReviewedCoordinate(b);
    for (const c of [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale]) {
      assert.ok(c.fonti.some(fid => fontiById.get(fid)?.tipo === 'marchio-ufficiale'), `${b.id}: ${c.marca} senza fonte marchio`);
    }
  }
});
