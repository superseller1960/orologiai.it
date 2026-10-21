import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { directorySchema } from '../site/src/lib/schema.ts';
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
// Lo schema usa un limite statico per l'anno di fondazione (workerd avvia l'isolate
// con l'orologio a epoch), quindi il controllo sul futuro resta qui, a orologio reale.
const annoCorrente = new Date().getUTCFullYear();
for (const b of data.attivita) {
  if (b.storia.annoFondazione !== null) {
    assert.ok(b.storia.annoFondazione <= annoCorrente, `Anno di fondazione nel futuro: ${b.id} (${b.storia.annoFondazione})`);
  }
}
const old = JSON.parse(await readFile('site/data/orologerie.json', 'utf8'));
// Fase 3 (tutela legale): la storia di ronchi-gioielli attribuiva una rivendita autorizzata Rolex senza
// fonte del marchio. Il contenuto storico dello specchio è conservato come citazione attribuita e
// qualificato: qui è fissato il testo corretto, così ogni ulteriore modifica fallisce come per gli altri record.
const testoCorrettoRonchi = 'Il vecchio sito la presentava come «primo rivenditore autorizzato Rolex in Italia dal 1929», con laboratorio di proprietà per manutenzioni e riparazioni straordinarie; l’autorizzazione non è riscontrata da fonti del marchio.';
for (const original of old.orologerie) {
  const current = data.attivita.find(b => b.id === original.id);
  assert.ok(current, `Attività storica persa: ${original.id}`);
  assert.equal(current.nome, original.nome);
  assert.equal(current.storia.testo, original.id === 'ronchi-gioielli' ? testoCorrettoRonchi : original.storia);
  assert.equal(current.storia.annoFondazione, original.anno);
  for (const service of original.servizi) assert.ok(current.servizi.some(s => s.id === service));
  for (const brand of original.marche) assert.ok(Object.values(current.marchi).flat().some(c => c.marca === brand));
}
console.log(`Dati validi: ${data.attivita.length} attività, ${data.localita.length} località; ${old.orologerie.length} record storici conservati.`);
