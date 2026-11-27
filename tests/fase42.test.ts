import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { servizioDocumentato } from '../site/src/lib/recommendations.ts';
import { contestoEvidenza } from '../site/src/lib/evidenza-contesto.ts';
import { interpretaRichiesta } from '../site/src/lib/assistant.ts';
import type { Directory } from '../site/src/lib/schema.ts';

const indice = JSON.parse(readFileSync('site/data/indice-ricerca.json', 'utf8')) as unknown as Directory & {
  attivita: (Directory['attivita'][number] & { documentati: string[] })[];
};
const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const report = JSON.parse(readFileSync('data/reports/fase42-evidenze.json', 'utf8'));
const completo = JSON.stringify(directory).length;

test('Fase 42: l’indice contiene tutto il catalogo e pesa meno della metà', () => {
  assert.equal(indice.attivita.length, directory.attivita.length);
  assert.equal(indice.localita.length, directory.localita.length);
  assert.ok(JSON.stringify(indice).length < completo * 0.55, 'L’indice deve essere almeno il 45% più leggero');
  for (const b of indice.attivita) {
    assert.ok(b.id && b.slug && b.localitaId && Array.isArray(b.servizi) && Array.isArray(b.tipi), `Campi minimi mancanti: ${b.id}`);
  }
});

test('Fase 42: l’esito documentato nell’indice è identico a quello calcolato sui dati completi', () => {
  for (const b of indice.attivita) {
    const vero = directory.attivita.find(x => x.id === b.id)!;
    const atteso = vero.servizi.map(s => s.id).filter(id => servizioDocumentato(directory, vero, id));
    assert.deepEqual([...b.documentati].sort(), [...atteso].sort(), b.id);
  }
});

test('Fase 42: la frase dice se il servizio è offerto o è lavorazione interna', () => {
  assert.equal(contestoEvidenza('Il nostro laboratorio dà vita a un usato garantito che, prima di essere venduto, viene sottoposto a una completa revisione.'), 'interno');
  assert.equal(contestoEvidenza('Eseguiamo revisioni complete su orologi dei clienti, con preventivo gratuito e garanzia di dodici mesi.'), 'offerto');
  assert.equal(contestoEvidenza('Per i restauri più complessi ci affidiamo a un laboratorio esterno specializzato in movimenti antichi.'), 'terzi');
  assert.equal(contestoEvidenza('Breve.'), 'insufficiente');
});

test('Fase 42: Zagli non risulta più documentato per la revisione al pubblico', () => {
  const zagli = directory.attivita.find(b => b.id === 'zagli-firenze');
  assert.ok(zagli, 'La scheda Zagli esiste');
  const voce = registro.evidenze.find((e: { attivitaId: string; servizio: string }) => e.attivitaId === 'zagli-firenze' && e.servizio === 'revisione');
  assert.ok(voce, 'L’associazione resta registrata');
  assert.equal(voce.stato, 'da-verificare');
  assert.equal(voce.estratto, '');
  assert.equal(servizioDocumentato(directory, zagli!, 'revisione'), false, 'La lavorazione interna non è un servizio al cliente');
  assert.ok(report.declassate.some((d: { attivitaId: string }) => d.attivitaId === 'zagli-firenze'));
  // Nessuna cancellazione: la scheda e gli altri servizi restano.
  assert.ok(zagli!.servizi.length > 0);
});

test('Fase 42: il declassamento non tocca le associazioni con prova di servizio offerto', () => {
  const declassate = new Set(report.declassate.map((d: { attivitaId: string; servizio: string }) => `${d.attivitaId}::${d.servizio}`));
  const confermate = registro.evidenze.filter((e: { stato: string; estratto: string }) => e.stato === 'confermata');
  assert.ok(confermate.length >= 1100, `Confermate insufficienti: ${confermate.length}`);
  for (const e of confermate) assert.ok(e.estratto.length > 0, 'Una conferma senza estratto non è una prova');
  assert.ok(declassate.size <= 5, `Declassamenti troppo ampi: ${declassate.size}`);
});

test('Fase 42: conoscenza tecnica, servizio e guasto restano distinti', () => {
  const tecnica = interpretaRichiesta('Che differenza c’è tra scappamento ad ancora e scappamento a cilindro?', directory).criteri;
  assert.equal(tecnica.servizio, undefined);
  assert.equal(tecnica.localitaNonCensita, undefined);
  const servizio = interpretaRichiesta('Cerco un laboratorio per la revisione a Firenze', directory).criteri;
  assert.equal(servizio.servizio, 'revisione');
  assert.equal(servizio.localita, 'firenze');
  const guasto = interpretaRichiesta('Il mio orologio da polso non parte da tre giorni', directory).criteri;
  assert.equal(guasto.servizio, 'riparazione');
  const valore = interpretaRichiesta('Ho ereditato un orologio: quanto vale?', directory).criteri;
  assert.equal(valore.servizio, 'valutazioni');
});
