import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

const load = async (): Promise<Directory> =>
  directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('lotto 3: arricchimento documentale del resto del catalogo', async () => {
  const directory = await load();
  const report = JSON.parse(await readFile('data/reports/lotto-03-20261025-applied.json', 'utf8'));
  const byId = (id: string) => directory.attivita.find(a => a.id === id)!;

  // Copertura: 102 attività esaminate, 97 modificate con sole fonti documentali
  assert.equal(report.attivitaEsaminate, 102);
  assert.equal(report.attivitaModificate.length, 97);
  assert.ok(report.fontiAggiunte.length >= 50, 'Fonti ufficiali registrate');
  for (const f of report.fontiAggiunte) {
    const fonte = directory.fonti.find(x => x.id === f.id);
    assert.ok(fonte, `Fonte registrata: ${f.id}`);
    assert.equal(fonte.consultataIl, '2026-10-25');
    assert.equal(fonte.tipo, f.tipo);
    assert.match(fonte.url, /^https:\/\//);
  }

  // Recapiti e orari storici mai sovrascritti: solo campi vuoti sono stati compilati
  assert.equal(byId('bigalli').contatti.telefono, '+39 055 212733');
  assert.notEqual(byId('bigalli').orari.verificatiIl, '2026-10-25');

  // Esempi di integrazione con fonte: orari, servizi e recapiti di centro, sud e isole
  const tardani = byId('tardani-viterbo');
  assert.ok(tardani.orari.giorni.some(g => g.giorno === 6), 'Orari con fonte');
  assert.ok(tardani.servizi.some(s => s.id === 'revisione' && s.fonti.length), 'Servizio con fonte');
  assert.equal(tardani.contatti.email, 'tardaniroberto@libero.it');
  const robbi = byId('robbi-orologiaio-lodi');
  assert.ok(robbi.servizi.some(s => s.id === 'pendoleria' && s.fonti.length), 'Servizi con fonte');
  assert.ok(robbi.orari.giorni.length >= 5, 'Orari con fonte');
  assert.equal(byId('casadei-rimini').contatti.telefono, '0541 53903');

  // Autorizzazioni solo con fonte del marchio (Longines, Baume & Mercier)
  for (const id of ['valenti-parma', 'stema-termoli', 'wargas-sisti-ancona']) {
    const riv = byId(id).marchi.rivenditaUfficiale;
    assert.ok(riv.some(m => m.marca === 'Longines' && m.fonti.length), `Rivendita Longines con fonte: ${id}`);
    for (const m of riv) for (const f of m.fonti) {
      assert.equal(directory.fonti.find(x => x.id === f)!.tipo, 'marchio-ufficiale', `Fonte del marchio per ${id}`);
    }
  }
  const deluca = byId('deluca-napoli');
  assert.ok(deluca.marchi.assistenzaUfficiale.some(m => m.marca === 'Baume & Mercier' && m.fonti.length));
  for (const m of deluca.marchi.assistenzaUfficiale) for (const f of m.fonti) {
    assert.equal(directory.fonti.find(x => x.id === f)!.tipo, 'marchio-ufficiale');
  }

  // Anomalie e limiti tracciati nel report
  assert.ok(report.anomalie.length >= 30, 'Anomalie registrate');
  assert.ok(report.anomalie.some((a: string) => a.includes('incompleta')));
  assert.ok(report.anomalie.some((a: string) => a.includes('cellulare')));
});

test('lotto 3: conservazione della verifica esistente', async () => {
  const directory = await load();
  const byId = (id: string) => directory.attivita.find(a => a.id === id)!;
  assert.equal(byId('bigalli').attendibilita.stato, 'fonti-verificate');
  assert.equal(byId('bigalli').attendibilita.verificataIl, '2026-10-24');
  assert.ok(byId('bigalli').marchi.assistenzaUfficiale.some(m => m.fonti.includes('t03-bigalli-sede')));
  // Le autorizzazioni aggiunte dal lotto restano documentate dalle sole fonti ufficiali dei marchi
  for (const id of ['bigalli', 'deluca-napoli', 'valenti-parma', 'stema-termoli', 'wargas-sisti-ancona']) {
    const b = byId(id);
    const claims = [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale];
    assert.ok(claims.length, `${id}: autorizzazione documentata presente`);
    for (const c of claims) {
      assert.ok(c.fonti.length, `${id}: ${c.marca} senza fonti`);
      assert.ok(c.fonti.some(f => directory.fonti.find(x => x.id === f)?.tipo === 'marchio-ufficiale'),
        `${id}: ${c.marca} senza fonte ufficiale del marchio`);
    }
    assert.equal(b.attendibilita.stato, 'fonti-verificate', `${id}: stato documentale conservato`);
    assert.ok(b.attendibilita.verificataIl, `${id}: data di verifica presente`);
  }
});
