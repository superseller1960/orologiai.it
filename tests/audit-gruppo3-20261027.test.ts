import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 3: fonti corrette, civici verificati e cronologie sobrie', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };
  const fonti = new Map(d.fonti.map(f => [f.id, f]));

  // Rosati: nessun riferimento a Perpetual Srl (azienda diversa) deve rimanere.
  const ros = get('gioielleria-rosati-porto-sant-elpidio');
  for (const fid of ros.attendibilita.fonti) {
    assert.doesNotMatch(fonti.get(fid)?.url ?? '', /perpetual/, 'fonte errata Perpetual ancora presente');
  }
  assert.ok(ros.marchi.rivenditaUfficiale.some(m => m.marca === 'Oris' && m.fonti.some(f => /6377-gioielleria-rosati/.test(fonti.get(f)?.url ?? ''))));

  // Panichi: il 1954 non è una fondazione documentata.
  const pan = get('gioielleria-panichi-porto-san-giorgio');
  assert.equal(pan.storia.annoFondazione, null);
  assert.match(pan.storia.testo ?? '', /denominazione commerciale/);

  // Granarelli: civico Hamilton verificato.
  const gra = get('gioielleria-granarelli-fano');
  assert.equal(gra.posizione.indirizzo, 'Via Arco d’Augusto, 61');
  assert.ok(gra.attendibilita.segnalazioni.some(s => /Variante civico/.test(s.motivo)));

  // Michini: civico 34 e email del sito proprio.
  const mic = get('gioielleria-michini-roseto');
  assert.equal(mic.posizione.indirizzo, 'Piazza della Libertà, 34');
  assert.equal(mic.contatti.email, 'info@gioielleriamichini.it');

  // Chiatti: fonte Mido specifica, non il locator generico.
  const chi = get('gioielleria-chiatti-citta-di-castello');
  for (const c of chi.marchi.rivenditaUfficiale) {
    assert.ok(c.fonti.some(f => /gioielleria-chiatti/.test(fonti.get(f)?.url ?? '')), 'fonte Mido specifica mancante');
    assert.ok(!c.fonti.some(f => (fonti.get(f)?.url ?? '').endsWith('/it/store-locator')), 'locator generico ancora in uso');
  }

  // Qualifiche allineate alle fonti.
  assert.match(get('gioielleria-cotognini-macerata').descrizione, /Global Brand Retailer/);
  assert.match(get('gioielleria-massarucci-terni').descrizione, /migliori marche di orologeria/);
});
