import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 4: fonti puntano all\'attività giusta, locator generici eliminati', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };
  const fonti = new Map(d.fonti.map(f => [f.id, f]));
  const tutteLeFonti = (b: (typeof d.attivita)[number]) => [
    ...b.posizione.fonti, ...b.contatti.fonti, ...b.orari.fonti, ...b.storia.fonti,
    ...b.attendibilita.fonti, ...b.attendibilita.cronologia.flatMap(v => v.fonti),
    ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
    ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
  ];

  // Nazareno Bancone (Cerignola) e Pace (Brindisi) non devono più citare la scheda Hamilton di Stravola (San Severo).
  for (const id of ['nazareno-bancone-cerignola', 'pace-gioielli-brindisi']) {
    for (const fid of tutteLeFonti(get(id))) {
      assert.doesNotMatch(fonti.get(fid)?.url ?? '', /san-severo\/stravola/, `${id}: fonte di Stravola ancora presente`);
    }
  }
  assert.ok(tutteLeFonti(get('nazareno-bancone-cerignola')).some(f => /cerignola\/nazareno-bancone/.test(fonti.get(f)?.url ?? '')));
  assert.ok(tutteLeFonti(get('pace-gioielli-brindisi')).some(f => /brindisi\/pace-gioielli/.test(fonti.get(f)?.url ?? '')));

  // Isi Srl (Avellino) non deve più citare la scheda Hamilton di Benevento.
  for (const fid of tutteLeFonti(get('isi-orzelleca-avellino'))) {
    assert.doesNotMatch(fonti.get(fid)?.url ?? '', /campania\/benevento\/orzelleca/, 'isi: fonte di Benevento ancora presente');
  }
  assert.ok(tutteLeFonti(get('isi-orzelleca-avellino')).some(f => /campania\/avellino\/orzelleca/.test(fonti.get(f)?.url ?? '')));

  // Nessun locator Mido generico deve restare nelle schede del gruppo 4.
  for (const id of ['orzelleca-gioielli-benevento', 'gioielleria-pegy-avellino', 'pignataro-gioielli-andria', 'gioielleria-de-leonardis-castellaneta', 'naviglio-e-fiume-brindisi']) {
    for (const c of get(id).marchi.rivenditaUfficiale.filter(m => m.marca === 'Mido')) {
      assert.ok(c.fonti.some(f => /midowatches\.com\/.+\/.+\/.+/.test(fonti.get(f)?.url ?? '')), `${id}: fonte Mido specifica mancante`);
      assert.ok(!c.fonti.some(f => (fonti.get(f)?.url ?? '').endsWith('/store-locator')), `${id}: locator generico ancora in uso`);
    }
  }

  // Pace: cronologia rettificata (Ostuni 1970, Brindisi 2011, laboratorio 2019).
  const pace = get('pace-gioielli-brindisi');
  assert.match(pace.storia.testo ?? '', /Ostuni dal 1970/);
  assert.match(pace.storia.testo ?? '', /dal 2011/);
  assert.match(pace.descrizione, /Ostuni nel 1970/);

  // Qualifiche autodichiarate non nei campi ufficiali.
  const ciletti = get('gioielleria-ciletti-foggia');
  assert.equal(ciletti.marchi.rivenditaUfficiale.length, 0);
  assert.equal(ciletti.marchi.assistenzaUfficiale.length, 0);
  assert.ok(ciletti.attendibilita.segnalazioni.some(s => /rivenditore autorizzato Rolex/.test(s.motivo)));
  const cuomo = get('franco-cuomo-gioielli-andria');
  assert.equal(cuomo.marchi.assistenzaUfficiale.length, 0);
  assert.match(cuomo.descrizione, /dichiara/);

  // Feni: descrizione senza laboratorio interno non documentato; Patek ufficiale conservato.
  const feni = get('feni-gioielli-taranto');
  assert.doesNotMatch(feni.descrizione, /laboratorio interno/);
  assert.ok(feni.marchi.rivenditaUfficiale.some(m => m.marca === 'Patek Philippe'));
  assert.ok(feni.attendibilita.segnalazioni.some(s => /Due sedi/.test(s.motivo)));

  // Orzelleca Benevento: discrepanze registrate come segnalazione aperta.
  assert.ok(get('orzelleca-gioielli-benevento').attendibilita.segnalazioni.some(s => /discordanti/.test(s.motivo)));
});
