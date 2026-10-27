import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 2: cronologie corrette, ruoli attribuiti e fonti istituzionali', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };

  // Passerini: 1954 avvio, 1956 sede attuale — non più «attiva dal 1956».
  const pas = get('gioielleria-passerini-morbegno');
  assert.equal(pas.storia.annoFondazione, 1954);
  assert.match(pas.storia.testo ?? '', /1954.*1956/s);

  // Federici: azienda orafa 1968, negozio 2012.
  assert.match(get('gioielleria-federici-gallarate').storia.testo ?? '', /1968.*2012/s);

  // Volta: sede dal 1978, civico 53 dal 2002; qualifica assistenza attribuita all'attività.
  const vol = get('gioielleria-volta-voghera');
  assert.match(vol.descrizione, /dal 1978 e al civico 53 dal 2002/);
  assert.match(vol.descrizione, /dichiara di essere rivenditore autorizzato Rolex e centro assistenza/);
  assert.ok(vol.attendibilita.segnalazioni.some(s => /403/.test(s.motivo)));

  // Clivio: fondazione e Registro con fonte istituzionale Unioncamere.
  const cli = get('clivio-1879-verbania');
  const fonti = new Map(d.fonti.map(f => [f.id, f]));
  assert.ok(cli.storia.fonti.some(f => fonti.get(f)?.url.includes('unioncamere.gov.it')));
  assert.match(cli.descrizione, /dichiarata dalla bottega/);

  // Bonvicini, Zanaboni e Volta: autodichiarazioni Rolex separate dai campi ufficiali.
  for (const id of ['bonvicini-gioielli-lodi', 'zanaboni-gioielli-arona', 'gioielleria-volta-voghera']) {
    const b = get(id);
    assert.deepEqual(b.marchi.rivenditaUfficiale, [], `${id}: autodichiarazione non separata`);
    assert.deepEqual(b.marchi.assistenzaUfficiale, [], `${id}: autodichiarazione non separata`);
    assert.match(b.descrizione, /dichiar/, `${id}: qualifica non attribuita`);
    assert.ok(b.attendibilita.cronologia.some(c => /Autodichiarazione/.test(c.azione)), `${id}: dichiarazione non conservata nel registro`);
    assert.ok(b.attendibilita.fonti.length > 0, `${id}: fonte della dichiarazione non conservata`);
  }
  assert.match(get('bonvicini-gioielli-lodi').descrizione, /laboratorio certificato/);
  assert.match(get('zanaboni-gioielli-arona').descrizione, /rivenditore autorizzato Rolex e Tudor/);

  // Conferme invariate: Hamilton/Tissot/Seiko con fonti del marchio.
  for (const id of ['gioielleria-puccinelli-cecina', 'gioielleria-bracci-follonica', 'gioielleria-passerini-morbegno', 'ottica-panizza-tirano', 'gioielleria-federici-gallarate']) {
    const b = get(id);
    for (const c of b.marchi.rivenditaUfficiale) {
      assert.ok(c.fonti.some(f => fonti.get(f)?.tipo === 'marchio-ufficiale'), `${id}: ${c.marca} senza fonte marchio`);
    }
  }
});
