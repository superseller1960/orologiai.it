import test from 'node:test';
import assert from 'node:assert/strict';
import { directory } from '../site/src/lib/directory.ts';
import { cercaOrologiaio, interpretaRichiesta } from '../site/src/lib/assistant.ts';

const criteri = (q: string) => interpretaRichiesta(q, directory).criteri;

test('Fase 43 AI: rotore, scappamento e bilanciere non attivano filtri commerciali', () => {
  for (const q of [
    'Come funziona il rotore di un orologio automatico?',
    'Che differenza c’è tra scappamento ad ancora e a cilindro?',
    'A cosa serve il bilanciere in un movimento meccanico?',
  ]) {
    const c = criteri(q);
    assert.equal(c.servizio, undefined, q);
    assert.equal(c.marca, undefined, q);
    assert.equal(c.ruoloMarca, undefined, q);
    assert.equal(c.localita, undefined, q);
  }
});

test('Fase 43 AI: richiesta di servizio, guasto e marca restano distinti', () => {
  assert.equal(criteri('Cerco una revisione a Firenze').servizio, 'revisione');
  assert.equal(criteri('Cerco una revisione a Firenze').localita, 'firenze');
  assert.equal(criteri('L’orologio da polso non parte da tre giorni').servizio, 'riparazione');
  const ufficiale = criteri('Cerco assistenza ufficiale Rolex a Milano');
  assert.equal(ufficiale.marca, 'Rolex');
  assert.equal(ufficiale.ruoloMarca, 'assistenzaUfficiale');
  assert.equal(criteri('Cerco un rivenditore ufficiale Rolex').ruoloMarca, 'rivenditaUfficiale');
  const acquisto = criteri('Vorrei comprare un Rolex');
  assert.notEqual(acquisto.ruoloMarca, 'assistenzaUfficiale');
});

test('Fase 43 AI: un rivenditore autorizzato non diventa centro di assistenza', () => {
  const esito = cercaOrologiaio(directory, { marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale' }, { limite: 20 });
  for (const r of esito.risultati) {
    const b = directory.attivita.find(x => x.id === r.id)!;
    assert.ok(b.marchi.assistenzaUfficiale.some(m => m.marca === 'Rolex'), `${r.id} non documenta l’assistenza ufficiale Rolex`);
  }
  if (!esito.risultati.length) {
    assert.ok(esito.messaggi.some((m: string) => /non documentano un’autorizzazione ufficiale|Non risulta nel database/.test(m)), 'L’assenza va dichiarata, non compensata');
    assert.ok(esito.alternative.every(a => a && a.id), 'Le alternative restano separate dai risultati esatti');
  }
});

test('Fase 43 AI: la lavorazione interna non viene descritta come servizio al pubblico', () => {
  const esito = cercaOrologiaio(directory, { servizio: 'revisione' }, { limite: directory.attivita.length });
  const ascione = esito.risultati.find(r => r.id === 'lorologiaio-ascione-porto-torres');
  const zagli = esito.risultati.find(r => r.id === 'zagli-firenze');
  for (const r of [ascione, zagli]) {
    if (!r) continue;
    assert.ok(!r.motivi.some((m: string) => /Offre “Revisione”, documentato/.test(m)), `${r.id} non deve offrire la revisione`);
    assert.ok(r.motivi.some((m: string) => /Elenca “Revisione”.*lavorazione interna/.test(m)), `${r.id} dichiara la lavorazione interna`);
  }
  assert.ok(esito.messaggi.some((m: string) => /indicato nella scheda|da confermare/.test(m)), 'Il conteggio delle attività da verificare è dichiarato');
});
