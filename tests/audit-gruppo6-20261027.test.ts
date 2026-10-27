import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 6: autorizzazioni documentate, riclassificazioni e incertezze registrate', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };

  // Gasser: Hamilton come Official Service Center documentato dal marchio, non come vendita.
  const gas = get('v-gasser-brunico');
  assert.ok(gas.marchi.assistenzaUfficiale.some(m => m.marca === 'Hamilton'), 'assistenza Hamilton mancante');
  assert.ok(!gas.marchi.venduti.some(m => m.marca === 'Hamilton'), 'vendita Hamilton non documentata');
  assert.ok(gas.storia.eventi.some(e => e.data === '2023'), '150º anniversario non documentato');

  // Ranzi: rivendita ufficiale Omega dalla fonte del marchio; incertezze sul sito irraggiungibile.
  const ran = get('gioielleria-ranzi-bolzano');
  const om = ran.marchi.rivenditaUfficiale.find(m => m.marca === 'Omega');
  assert.ok(om, 'rivendita Omega mancante');
  assert.ok(om.fonti.some(f => f === 'l6-www-omegawatches-com-store-storedetails-3962'));
  assert.ok(ran.attendibilita.segnalazioni.some(s => /timeout/.test(s.motivo)), 'segnalazione timeout mancante');
  assert.ok(ran.attendibilita.segnalazioni.some(s => /locator generico/.test(s.motivo)), 'segnalazione Mido mancante');

  // Nitta: rivendita ufficiale Hamilton documentata dalla scheda del marchio.
  const nit = get('nitta-gioielli-pordenone');
  assert.ok(nit.marchi.rivenditaUfficiale.some(m => m.marca === 'Hamilton'));
  assert.ok(nit.marchi.rivenditaUfficiale.some(m => m.marca === 'Longines'));
  assert.ok(nit.attendibilita.segnalazioni.some(s => /Telefono discordante/.test(s.motivo)));

  // Clementi: claim «ricambi» rimosso; esempi di lavorazione non come marchi riparati.
  const cle = get('orologeria-clementi-bolzano');
  assert.ok(!cle.servizi.some(s => s.id === 'ricambi'), 'ricambi ancora presente');
  assert.ok(!cle.marchi.riparati.some(m => m.marca === 'Rolex' || m.marca === 'Zenith'), 'esempi ancora fra i riparati');
  assert.ok(cle.marchi.menzionati.some(m => m.marca === 'Rolex'));
  assert.ok(cle.marchi.menzionati.some(m => m.marca === 'Zenith'));
  assert.ok(cle.attendibilita.segnalazioni.some(s => /Christian Clementi/.test(s.motivo)));

  // Camparini: Tudor solo menzionato; autodichiarazione Rolex segnalata e non ufficiale.
  const cam = get('camparini-gioielli-reggio-emilia');
  assert.ok(!cam.marchi.venduti.some(m => m.marca === 'Tudor'), 'Tudor ancora fra i venduti');
  assert.ok(cam.marchi.menzionati.some(m => m.marca === 'Tudor'));
  assert.equal(cam.storia.fondatore, 'Cherubino Camparini');
  assert.equal(cam.marchi.assistenzaUfficiale.length, 0);
  assert.equal(cam.marchi.rivenditaUfficiale.length, 0);
  assert.ok(cam.attendibilita.segnalazioni.some(s => /Certified Pre-Owned/.test(s.motivo)));

  // Pretolani: Omega solo menzionato (bracciali/cinturini), certificazione autodichiarata segnalata.
  const pre = get('gioielleria-pretolani-forli');
  assert.ok(!pre.marchi.riparati.some(m => m.marca === 'Omega'), 'Omega ancora fra i riparati');
  assert.ok(pre.marchi.menzionati.some(m => m.marca === 'Omega'));
  assert.ok(pre.storia.eventi.some(e => e.data === '1985'));
  assert.ok(pre.attendibilita.segnalazioni.some(s => /1° e 2° livello/.test(s.motivo)));

  // Cadoppi: storia documentata da Unioncamere.
  const cad = get('cadoppi-reggio-emilia');
  assert.equal(cad.storia.annoFondazione, 1922);
  assert.ok(cad.storia.eventi.some(e => e.data === '2009'));
  assert.ok(cad.storia.fonti.includes('l6-www-unioncamere-gov-it-imprese-storiche-cadoppi-snc'));
  assert.ok(cad.attendibilita.segnalazioni.some(s => /non ha restituito testo leggibile/.test(s.motivo)));

  // S.T.S.: autodichiarazione «assistenza autorizzata» non nei campi ufficiali.
  const sts = get('sts-laboratorio-orologeria-conegliano');
  assert.equal(sts.marchi.assistenzaUfficiale.length, 0);
  for (const m of ['Hamilton', 'Calvin Klein', 'TAG Heuer']) {
    assert.ok(sts.marchi.menzionati.some(x => x.marca === m), `mancante ${m}`);
  }
  assert.ok(sts.attendibilita.segnalazioni.some(s => /assistenza autorizzata/.test(s.motivo)));

  // Cernigoi: valutazioni documentate; ambiguità autorizzazioni segnalata.
  const cer = get('gioielleria-cernigoi-monfalcone');
  assert.ok(cer.servizi.some(s => s.id === 'valutazioni'));
  assert.equal(cer.marchi.assistenzaUfficiale.length, 0);
  assert.equal(cer.marchi.rivenditaUfficiale.length, 0);
  assert.ok(cer.attendibilita.segnalazioni.some(s => /o di essere stato/.test(s.motivo)));

  // Astrua: Patek Philippe sulla fonte di assistenza; autodichiarazione Rolex segnalata.
  const ast = get('astrua-piacenza');
  const patek = ast.marchi.riparati.find(m => m.marca === 'Patek Philippe');
  assert.ok(patek?.fonti.includes('l6-www-astrua-com-it-assistenza-ufficiale-astrua'), 'fonte Patek errata');
  assert.ok(ast.marchi.riparati.some(m => m.marca === 'Omega'));
  assert.ok(ast.marchi.riparati.some(m => m.marca === 'Tudor'));
  assert.ok(ast.storia.eventi.some(e => e.data === '1993'));
  assert.equal(ast.marchi.rivenditaUfficiale.length, 0, 'rivendita Rolex autodichiarata indebita');

  // Incertezze registrate: Giberti, Zambon, Dobner.
  assert.ok(get('giberti-preziosi-ferrara').attendibilita.segnalazioni.some(s => /non ricontrollabili/.test(s.motivo)));
  assert.ok(get('gioielleria-zambon-1934-pordenone').attendibilita.segnalazioni.some(s => /404/.test(s.motivo)));
  assert.ok(get('dobner-gorizia').attendibilita.segnalazioni.some(s => /Marchi prestigiosi/.test(s.motivo)));

  // Reggiani: trasferimento 1989 documentato.
  assert.ok(get('orologeria-reggiani-modena').storia.eventi.some(e => e.data === '1989'));
});
