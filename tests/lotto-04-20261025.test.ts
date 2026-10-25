import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

// Lotto 4 di risoluzione anomalie (25/10/2026): confronto con lo snapshot pre-lotto (e9af003).
// Correzioni verificate, sedi autonome documentate, nessun dato storico perso.
const prima = directorySchema.parse(JSON.parse(execFileSync('git', ['show', 'e9af003:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString())) as Directory;
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8'))) as Directory;
const report = JSON.parse(await readFile('data/reports/lotto-04-20261025-applied.json', 'utf8'));
const byId = (id: string) => data.attivita.find(a => a.id === id)!;
const NUOVE = ['eredi-trossello-aosta', 'grande-aldomoro-frosinone', 'ronzoni-udine-cavour', 'valenti-parma-farini'];
const modificati = new Set<string>(report.attivitaModificate.map((m: { id: string }) => m.id));

test('L4: 163 attività, record storici conservati, sole modifiche documentate e tracciate', () => {
  assert.equal(data.attivita.length, prima.attivita.length + 4);
  assert.equal(report.nuoveSchede.length, 4);
  for (const vecchio of prima.attivita) {
    const attuale = byId(vecchio.id);
    assert.ok(attuale, `record perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug, `slug alterato: ${vecchio.id}`);
    assert.equal(attuale.localitaId, vecchio.localitaId, `località alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.origine, vecchio.origine, `origine alterata: ${vecchio.id}`);
    if (!modificati.has(vecchio.id)) {
      assert.deepEqual(attuale, vecchio, `record alterato senza registro: ${vecchio.id}`);
    } else {
      assert.ok(attuale.attendibilita.cronologia.some(c => c.azione.startsWith('Lotto 4')), `${vecchio.id}: cronologia non aggiornata`);
    }
  }
  for (const f of prima.fonti) assert.deepEqual(data.fonti.find(x => x.id === f.id), f, `fonte alterata: ${f.id}`);
  for (const f of report.fontiAggiunte) {
    const fonte = data.fonti.find(x => x.id === f.id);
    assert.ok(fonte, `fonte non registrata: ${f.id}`);
    assert.equal(fonte.consultataIl, '2026-10-25');
    assert.match(fonte.url, /^https:\/\//);
  }
});

test('L4: correzioni verificate con prima/dopo e fonti primarie', () => {
  assert.equal(report.correzioni.length, 2);
  for (const c of report.correzioni) {
    assert.ok(c.fonti.length >= 1, `${c.id}: correzione senza fonte`);
    assert.notEqual(c.prima, c.dopo);
    for (const f of c.fonti) assert.ok(data.fonti.some(x => x.id === f), `${c.id}: fonte della correzione assente`);
  }
  const fabiani = byId('fabiani-gioiellerie-pistoia');
  assert.equal(fabiani.posizione.indirizzo, 'Via Cino da Pistoia 2/D');
  const torelli = byId('gioiellerie-torelli-cremona');
  assert.equal(torelli.posizione.indirizzo, 'Corso Campi 21 A');
  // Correzione conservativa: i recapiti storici non cambiano
  assert.equal(fabiani.contatti.telefono, '0573/367513');
  assert.equal(torelli.contatti.telefono, '0372-410536');
});

test('L4: nuove sedi autonome documentate, con gruppoId e senza coordinate inventate', () => {
  for (const id of NUOVE) {
    const b = byId(id);
    assert.ok(b, `sede assente: ${id}`);
    assert.equal(b.posizione.coordinate, null, `${id}: coordinate non verificate`);
    assert.ok(b.gruppoId, `${id}: gruppo omoneo non collegato`);
    assert.ok(b.attendibilita.fonti.length >= 1, `${id}: fonti assenti`);
    for (const s of b.servizi) assert.ok(s.fonti.length >= 1, `${id}: servizio ${s.id} senza fonte`);
    for (const [ruolo, marche] of Object.entries(b.marchi)) {
      for (const m of marche) {
        assert.ok(m.fonti.length >= 1, `${id}: ${m.marca} senza fonte`);
        if (ruolo === 'rivenditaUfficiale' || ruolo === 'assistenzaUfficiale') {
          for (const f of m.fonti) {
            assert.equal(data.fonti.find(x => x.id === f)!.tipo, 'marchio-ufficiale', `${id}: ${m.marca} senza fonte del marchio`);
          }
        }
      }
    }
  }
  assert.equal(byId('trossello-courmayeur').gruppoId, 'trossello');
  assert.equal(byId('gioielleria-grande-frosinone').gruppoId, 'grande');
  assert.equal(byId('ronzoni-udine').gruppoId, 'ronzoni');
  assert.equal(byId('valenti-parma').gruppoId, 'valenti');
  // Nessuna email o orario dedotto dove la fonte non li pubblica
  assert.equal(byId('ronzoni-udine-cavour').contatti.email, null);
  assert.equal(byId('ronzoni-udine-cavour').orari.giorni.length, 0);
});

test('L4: autorizzazioni di marchio solo per i ruoli dichiarati', () => {
  // Wargas & Sisti: Longines dichiara «Service Center» oltre alla vendita
  const wargas = byId('wargas-sisti-ancona');
  assert.ok(wargas.marchi.assistenzaUfficiale.some(m => m.marca === 'Longines'));
  for (const m of wargas.marchi.assistenzaUfficiale) {
    for (const f of m.fonti) assert.equal(data.fonti.find(x => x.id === f)!.tipo, 'marchio-ufficiale');
  }
  // Valenti Nino Bixio: la scheda Longines dichiara solo vendita, nessuna assistenza attribuita
  const bixio = byId('valenti-parma');
  assert.equal(bixio.marchi.assistenzaUfficiale.length, 0);
  assert.ok(bixio.marchi.rivenditaUfficiale.some(m => m.marca === 'Longines'));
  // Valenti Via Farini: punto vendita + servizio clienti dichiarati
  const farini = byId('valenti-parma-farini');
  assert.ok(farini.marchi.rivenditaUfficiale.some(m => m.marca === 'Longines'));
  assert.ok(farini.marchi.assistenzaUfficiale.some(m => m.marca === 'Longines'));
});

test('L4: registro anomalie completo e onesto', () => {
  assert.ok(report.anomalieRisolte.length >= 14, 'anomalie risolte registrate');
  assert.ok(report.anomalieRimaste.length >= 18, 'anomalie rimaste tracciate');
  assert.ok(report.nuoveAnomalie.length >= 6, 'nuove anomalie registrate');
  assert.equal(report.coordinateVerificate, 0);
  assert.ok(report.anomalieRimaste.some((a: string) => a.includes('angelini')), 'conflitto telefono non nascosto');
  assert.ok(report.anomalieRimaste.some((a: string) => a.includes('scardi')), 'email non verificabile tracciata');
});
