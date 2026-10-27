import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 1: riclassificazioni e recapiti corretti sulle fonti', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };
  const fonti = new Map(d.fonti.map(f => [f.id, f]));

  // Omega Ravenna documenta retail + consegna per manutenzione, non centro assistenza.
  const errani = get('errani-ravenna');
  assert.deepEqual(errani.marchi.assistenzaUfficiale, [], 'Omega non qualifica Errani come centro assistenza');
  assert.ok(errani.marchi.rivenditaUfficiale.some(m => m.marca === 'Omega'));
  assert.ok(errani.marchi.rivenditaUfficiale.every(m => m.fonti.some(f => fonti.get(f)?.tipo === 'marchio-ufficiale')));

  // Salerno: recapiti dalla fonte primaria dell'attività, varianti Longines/IWC tracciate.
  const salerno = get('vincenzo-salerno-ragusa');
  assert.equal(salerno.posizione.indirizzo, 'Via Archimede, 316');
  assert.equal(salerno.contatti.telefono, '+39 0932 25 10 40');
  assert.ok(salerno.attendibilita.segnalazioni.some(s => /Longines riporta/.test(s.motivo)));
  assert.ok(salerno.attendibilita.segnalazioni.some(s => /IWC/.test(s.motivo)));

  // Franzè: storia sobria e conflitto Seiko non nascosto.
  const franze = get('gioielleria-franze-vibo');
  assert.match(franze.storia.testo ?? '', /dal 1988/);
  assert.ok(franze.attendibilita.segnalazioni.some(s => /Seiko/.test(s.motivo)));

  // Temporè e Rosas: nessuna affermazione più ampia della fonte.
  assert.doesNotMatch(get('tempore-maestri-del-tempo-modica').descrizione, /in sede/);
  assert.doesNotMatch(get('rosas-1945-nuoro').storia.testo ?? '', /fondazione nel 1945/);

  // Mercuri: vendita documentata, nessuna autorizzazione Rolex inventata.
  const mercuri = get('mercuri-orologi-arezzo');
  assert.ok(mercuri.servizi.some(s => s.id === 'vendita-usati'));
  assert.ok(mercuri.marchi.venduti.some(m => m.marca === 'Rolex'));
  assert.deepEqual(mercuri.marchi.rivenditaUfficiale, []);
  assert.deepEqual(mercuri.marchi.assistenzaUfficiale, []);
});
