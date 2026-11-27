import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { cercaOrologiaio, interpretaRichiesta } from '../site/src/lib/assistant.ts';
import { motiviPerRichiesta, servizioDocumentato } from '../site/src/lib/recommendations.ts';
import { searchDirectory, searchDirectoryTiered } from '../site/src/lib/search.ts';

const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')) as {
  evidenze: { attivitaId: string; servizio: string; stato: string; estratto: string }[];
};
const prova = new Map(registro.evidenze
  .filter(e => e.stato === 'confermata' && e.estratto.trim().length >= 40)
  .map(e => [`${e.attivitaId}::${e.servizio}`, e]));

test('Fase 44: «documentata» significa citazione verificata, non servizio elencato', () => {
  const conRevisione = searchDirectory(directory, { servizio: 'revisione' });
  assert.ok(conRevisione.length > 100, 'Il campione revisione è troppo piccolo');
  for (const { business } of conRevisione) {
    const documentata = servizioDocumentato(directory, business, 'revisione');
    assert.equal(documentata, prova.has(`${business.id}::revisione`), `${business.id}: stato documentato senza prova o viceversa`);
    if (documentata) {
      const evidenza = prova.get(`${business.id}::revisione`)!;
      assert.ok(evidenza.estratto.length >= 40, `${business.id}: prova senza estratto`);
      const motivo = motiviPerRichiesta(directory, business, { servizio: 'revisione' })[0];
      assert.ok(motivo, `${business.id}: documentata senza motivazione`);
      assert.ok(!/non è stato recuperato|nessuna fonte|da confermare con l’attività/i.test(motivo.testo), `${business.id}: motivazione che ammette l’assenza della prova`);
      assert.ok(motivo.verifica?.url, `${business.id}: motivazione senza collegamento alla fonte`);
    }
  }
});

test('Fase 44: il filtro «solo documentate» non restituisce schede senza prova', () => {
  const { esatti, daVerificare } = searchDirectoryTiered(directory, { servizio: 'revisione' });
  const documentate = searchDirectory(directory, { servizio: 'revisione', soloDocumentate: true });
  assert.equal(documentate.length, esatti.length - daVerificare.length);
  assert.ok(daVerificare.length > 0, 'Le attività solo elencate restano visibili e segnalate');
  for (const { business } of documentate) {
    assert.ok(prova.has(`${business.id}::revisione`), `${business.id}: il filtro ha ammesso una scheda senza prova`);
    assert.ok(!daVerificare.some(r => r.business.id === business.id), `${business.id}: presente anche fra le da verificare`);
  }
});

test('Fase 44: il servizio elencato senza prova non produce una motivazione positiva', () => {
  const senzaProva = searchDirectory(directory, { servizio: 'revisione' })
    .find(r => !prova.has(`${r.business.id}::revisione`));
  assert.ok(senzaProva, 'Serve almeno un caso senza prova per il test');
  const motivi = motiviPerRichiesta(directory, senzaProva!.business, { servizio: 'revisione' });
  assert.ok(motivi.every(m => !/Revisione|revisione/.test(m.testo) || /verifica|conferma/i.test(m.testo)), 'Nessun «Elenca Revisione» positivo');
});

test('Fase 44 AI: documentate e solo dichiarate sono richieste distinte e coerenti col motore', () => {
  const documentate = interpretaRichiesta('Quali laboratori effettuano revisioni documentate?', directory).criteri;
  const dichiarate = interpretaRichiesta('Quali attività dichiarano la revisione senza prove sufficienti?', directory).criteri;
  assert.equal(documentate.servizio, 'revisione');
  assert.equal(dichiarate.servizio, 'revisione');

  const esito = cercaOrologiaio(directory, { servizio: 'revisione' }, { limite: directory.attivita.length });
  assert.ok(esito.messaggi.some(m => /indicato nella scheda|da confermare/i.test(m)), 'L’assenza di prova è dichiarata, non nascosta');
  for (const r of esito.risultati) {
    const b = directory.attivita.find(x => x.id === r.id)!;
    if (servizioDocumentato(directory, b, 'revisione')) continue;
    assert.ok(!r.motivi.some(m => /^Offre “Revisione”, documentato/.test(m)), `${r.id}: l’AI non può presentarla come confermata`);
  }
});
