import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { auditDuplicati, classificaCoppia } from '../site/src/lib/duplicates.ts';
import { redirectTerritoriale } from '../site/src/lib/redirect-territoriali.ts';
import { redirectScheda } from '../site/src/lib/redirect-schede.ts';
import type { Business } from '../site/src/lib/schema.ts';

const canonica = directory.attivita.find((b) => b.id === 'lorologiaio-ascione-porto-torres');

test('Fase 40: il duplicato di Porto Torres è unificato nella scheda canonica', () => {
  assert.ok(canonica, 'Scheda canonica assente');
  assert.ok(!directory.attivita.some((b) => b.id === 'l-orologiaio-sardegna-porto-torres'), 'La scheda duplicata è ancora in catalogo');
  // Le informazioni della scheda preesistente non sono state perse.
  assert.equal(canonica!.posizione.indirizzo, 'Via Libio, 15');
  assert.equal(canonica!.contatti.telefono, '+39 079 501900');
  assert.ok(canonica!.posizione.coordinate, 'Coordinate perse nell’unificazione');
  assert.ok(canonica!.storia.testo && canonica!.storia.testo.length > 80, 'Storia persa nell’unificazione');
  // I servizi nuovi della seconda scheda sono stati recuperati.
  for (const id of ['riparazione-quarzo', 'ricambi']) {
    assert.ok(canonica!.servizi.some((s) => s.id === id), `Servizio recuperato mancante: ${id}`);
  }
  assert.ok(canonica!.attendibilita.cronologia.some((c) => c.azione.startsWith('Fase 40')));
  assert.ok(canonica!.attendibilita.segnalazioni.some((s) => s.stato === 'risolta'));
});

test('Fase 40: il vecchio URL risponde con redirect permanente alla scheda canonica', () => {
  assert.equal(redirectScheda('/orologeria/l-orologiaio-sardegna-porto-torres/'), '/orologeria/lorologiaio-ascione-porto-torres/');
  assert.equal(redirectScheda('/orologeria/l-orologiaio-sardegna-porto-torres'), '/orologeria/lorologiaio-ascione-porto-torres/');
  assert.equal(redirectScheda('/orologeria/lorologiaio-ascione-porto-torres/'), null);
  // I redirect territoriali restano separati: nessuna regola attività nel loro registro.
  assert.equal(redirectTerritoriale('/orologeria/l-orologiaio-sardegna-porto-torres/'), null);
});

test('Fase 40: nessun duplicato confermato nel catalogo', () => {
  const confermati = auditDuplicati(directory).filter((e) => e.classe === 'duplicato-confermato');
  assert.deepEqual(confermati, [], `Duplicati confermati: ${confermati.map((e) => e.coppia.join('↔')).join(', ')}`);
});

test('Fase 40: due sedi della stessa insegna non sono un duplicato', () => {
  const a = directory.attivita.find((b) => b.id === 'pisani-scandicci-matteotti')!;
  const b = directory.attivita.find((b) => b.id === 'pisani-scandicci-maschera')!;
  assert.equal(classificaCoppia(a, b).classe, 'possibile-duplicato');
  // Telefono identico invece conferma il duplicato, anche con nomi commerciali diversi.
  const finta = { ...b, contatti: { ...b.contatti, telefono: a.contatti.telefono } } as Business;
  assert.equal(classificaCoppia(a, finta).classe, 'duplicato-confermato');
});

test('Fase 40: l’audit dell’intero catalogo è registrato con le decisioni', () => {
  const percorso = 'data/reports/fase40-audit-duplicati.json';
  assert.ok(existsSync(percorso), 'Report di audit assente');
  const report = JSON.parse(readFileSync(percorso, 'utf8')) as { attivita: number; coppie: { classe: string }[] };
  assert.equal(report.attivita, directory.attivita.length);
  assert.ok(report.coppie.every((c) => c.classe !== 'duplicato-confermato'));
});
