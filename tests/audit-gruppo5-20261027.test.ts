import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 5: servizi supportati, cronologie integrate e incertezze registrate', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };

  // Orolab: nessun claim «vendita usati» non supportato dalle fonti.
  const oro = get('orolab-bra');
  assert.ok(!oro.servizi.some(s => s.id === 'vendita-usati'), 'vendita-usati ancora presente');
  assert.ok(oro.servizi.some(s => s.id === 'valutazioni'));
  assert.ok(oro.attendibilita.cronologia.some(e=>/rimosso il servizio/.test(e.azione)), 'Evento di audit conservato anche dopo successivi arricchimenti');

  // Era Ora: storia documentata integrata (2019/2022) e fonte storia presente.
  const era = get('orologeria-era-ora-vercelli');
  assert.equal(era.storia.annoFondazione, 2019);
  assert.match(era.storia.testo ?? '', /2019/);
  assert.match(era.storia.testo ?? '', /2022/);
  assert.ok(era.storia.fonti.some(f => /lanostrastoria/.test(f)));
  assert.match(era.descrizione, /laboratori esterni/);

  // Autodichiarazioni Rolex non nei campi ufficiali (Biondi, Dupanloup).
  for (const id of ['biondi-vercelli', 'dupanloup-savona']) {
    const b = get(id);
    assert.equal(b.marchi.assistenzaUfficiale.length, 0, `${id}: assistenza ufficiale indebita`);
    assert.equal(b.marchi.rivenditaUfficiale.length, 0, `${id}: rivendita ufficiale indebita`);
    assert.ok(b.attendibilita.segnalazioni.some(s => /Rolex/.test(s.motivo)), `${id}: segnalazione Rolex mancante`);
  }

  // Discrepanze registrate come segnalazioni aperte.
  assert.ok(get('gioielleria-delfino-savona').attendibilita.segnalazioni.some(s => /Telefono discordante/.test(s.motivo)));
  assert.ok(get('rizzuto-gioielleria-sarzana').attendibilita.segnalazioni.some(s => /Variante indirizzo/.test(s.motivo)));
  assert.ok(get('dupanloup-savona').attendibilita.segnalazioni.some(s => /Variante cronologica/.test(s.motivo)));
  assert.ok(get('henry-gioielli-alessandria').attendibilita.segnalazioni.some(s => /JS/.test(s.motivo)));
  assert.ok(get('gioielleria-rabino-cuneo').attendibilita.segnalazioni.some(s => /mascherato/.test(s.motivo)));

  // Henry: la rivendita Mido resta confermata dalla fonte del marchio.
  const hen = get('henry-gioielli-alessandria');
  assert.ok(hen.marchi.rivenditaUfficiale.some(m => m.marca === 'Mido'));
});
