import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contestoEvidenza, provaDelServizio } from '../site/src/lib/evidenza-contesto.ts';
import { directory } from '../site/src/lib/directory.ts';
import { searchDirectory, searchDirectoryTiered } from '../site/src/lib/search.ts';
import { servizioDocumentato } from '../site/src/lib/recommendations.ts';

const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const report = JSON.parse(readFileSync('data/reports/fase43-evidenze.json', 'utf8'));
const ascione = directory.attivita.find(b => b.id === 'lorologiaio-ascione-porto-torres')!;

test('Fase 43: negazioni, soggetto e scopo contano più delle parole chiave', () => {
  assert.equal(contestoEvidenza('Non effettuiamo riparazioni su orologi di altre marche, ci occupiamo solo di vendita.'), 'negato');
  assert.equal(contestoEvidenza('Siamo centro di assistenza autorizzato Rolex e Omega, con laboratorio certificato dalla casa madre.'), 'ufficiale');
  assert.equal(contestoEvidenza('Punto di raccolta per conto del laboratorio: l’orologio viene ritirato e consegnato in sede.'), 'raccolta');
  assert.equal(contestoEvidenza('Ogni orologio di secondo polso che proponiamo viene sottoposto a un accurato processo di controllo, revisione e ripristino, per offrire ai nostri clienti un segnatempo affidabile.'), 'interno');
  assert.equal(contestoEvidenza('Disponiamo di un laboratorio attrezzato per l’assistenza e la riparazione di orologi da polso e da tasca.'), 'offerto');
  assert.equal(provaDelServizio('ufficiale', 'assistenza'), true);
  assert.equal(provaDelServizio('ufficiale', 'revisione'), false, 'Il centro ufficiale non dimostra ogni servizio');
});

test('Fase 43: Ascione perde solo la revisione, non la bottega né gli altri servizi', () => {
  const revisione = registro.evidenze.find((e: { attivitaId: string; servizio: string }) => e.attivitaId === ascione.id && e.servizio === 'revisione');
  assert.equal(revisione.stato, 'da-verificare');
  assert.equal(revisione.estratto, '');
  assert.equal(servizioDocumentato(directory, ascione, 'revisione'), false);
  for (const servizio of ['assistenza', 'riparazione-meccanici'] as const) {
    const voce = registro.evidenze.find((e: { attivitaId: string; servizio: string }) => e.attivitaId === ascione.id && e.servizio === servizio);
    assert.equal(voce.stato, 'confermata', `${servizio} resta documentato da una fonte distinta`);
    assert.ok(servizioDocumentato(directory, ascione, servizio));
  }
  assert.ok(ascione.servizi.length > 0);
  assert.ok(report.declassate.some((d: { attivitaId: string; servizio: string }) => d.attivitaId === ascione.id && d.servizio === 'revisione'));
});

test('Fase 43: i conteggi dell’audit sono coerenti con il registro', () => {
  assert.equal(report.conteggi.analizzate, registro.evidenze.length);
  assert.equal(report.conteggi.confermate, registro.evidenze.filter((e: { stato: string }) => e.stato === 'confermata').length);
  assert.equal(report.conteggi.confermate + report.conteggi.declassate, report.conteggi.analizzate);
  assert.ok(report.conteggi.declassateInQuestoLotto <= 3, 'Nessun declassamento in blocco');
  for (const d of report.declassate) assert.ok(d.estratto.length > 0, 'La decisione conserva la citazione che l’ha motivata');
});

test('Fase 43: le attività con prova documentata precedono quelle solo elencate', () => {
  const { esatti, daVerificare } = searchDirectoryTiered(directory, { servizio: 'revisione' });
  assert.ok(esatti.length > 0 && daVerificare.length > 0);
  const primoNonDoc = esatti.findIndex(r => !servizioDocumentato(directory, r.business, 'revisione'));
  if (primoNonDoc !== -1) {
    for (let i = primoNonDoc; i < esatti.length; i++) {
      assert.equal(servizioDocumentato(directory, esatti[i].business, 'revisione'), false, 'Nessuna attività documentata dopo una non documentata');
    }
  }
  const documentate = searchDirectory(directory, { servizio: 'revisione', soloDocumentate: true });
  assert.equal(documentate.length, esatti.length - daVerificare.length);
  assert.ok(documentate.every(r => servizioDocumentato(directory, r.business, 'revisione')));
});
