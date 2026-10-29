import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const newIds = [
  'cm-orologi-alba', 'orologeria-romana-cuneo', 'center-watch-ancona',
  'gioielleria-malaspina-reggio-calabria', 'gioielleria-gigante-ortona', 'orologeria-corso-11-verona',
  'gioielleria-melone-vallo', 'grasso-orologi-acireale', 'immagini-preziose-molfetta',
  'carmine-costanza-battipaglia', 'orologeria-tic-tac-foligno', 'gioielleria-de-santis-fermo',
  'caffaro-gioielli-ivrea', 'sergio-capone-viareggio',
];

test('Lotto 5: le 14 nuove schede sono integrate una sola volta, senza perdita di attività', () => {
  for (const id of newIds) assert.equal(data.attivita.filter(b => b.id === id).length, 1, `manca o duplicata ${id}`);
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
  assert.ok(data.attivita.length >= 338);
  const names = data.attivita.map(b => b.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  assert.equal(new Set(names).size, names.length, 'nessun nome normalizzato duplicato');
});

test('Lotto 5: ogni claim ha fonti esistenti consultate il 28/10', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    const refs = [
      ...b.posizione.fonti, ...b.contatti.fonti, ...b.storia.fonti, ...b.attendibilita.fonti,
      ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
      ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
    ];
    assert.ok(refs.length > 0, `${id} senza fonti`);
    for (const ref of refs) {
      const f = data.fonti.find(s => s.id === ref);
      assert.ok(f, `fonte mancante ${ref} in ${id}`);
      assert.equal(f!.consultataIl, '2026-10-28', `fonte non consultata il 28/10: ${ref}`);
    }
    assert.ok(b.attendibilita.fonti.some(id2 => ['sito-ufficiale', 'marchio-ufficiale', 'stampa'].includes(data.fonti.find(s => s.id === id2)!.tipo)), `${id}: verifica senza fonte primaria`);
  }
});

test('Lotto 5: autorizzazioni ufficiali solo da fonti del marchio, mai da autodichiarazioni', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    for (const c of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      assert.ok(c.fonti.some(ref => data.fonti.find(s => s.id === ref)!.tipo === 'marchio-ufficiale'),
        `${id}: autorizzazione ${c.marca} senza fonte del marchio`);
    }
  }
  const capone = data.attivita.find(b => b.id === 'sergio-capone-viareggio')!;
  assert.deepEqual(capone.marchi.rivenditaUfficiale.map(c => c.marca).sort(), ['Rolex']);
  assert.deepEqual(capone.marchi.assistenzaUfficiale.map(c => c.marca).sort(), ['Jaeger-LeCoultre', 'Rolex']);
  assert.ok(capone.attendibilita.segnalazioni.some(s => s.motivo.includes('403')), 'limite di consultazione registrato');
});

test('Lotto 5: coerenza geografica delle nuove località e nessun duplicato residuo', () => {
  const attese: Record<string, [string, string, string]> = {
    'cm-orologi-alba': ['alba', 'cuneo', 'piemonte'],
    'gioielleria-gigante-ortona': ['ortona', 'chieti', 'abruzzo'],
    'gioielleria-melone-vallo': ['vallo-della-lucania', 'salerno', 'campania'],
    'grasso-orologi-acireale': ['acireale', 'catania', 'sicilia'],
    'immagini-preziose-molfetta': ['molfetta', 'bari', 'puglia'],
    'carmine-costanza-battipaglia': ['battipaglia', 'salerno', 'campania'],
    'orologeria-tic-tac-foligno': ['foligno', 'perugia', 'umbria'],
    'gioielleria-de-santis-fermo': ['fermo', 'fermo', 'marche'],
    'caffaro-gioielli-ivrea': ['ivrea', 'torino', 'piemonte'],
    'sergio-capone-viareggio': ['viareggio', 'lucca', 'toscana'],
  };
  for (const [id, [comune, provincia, regione]] of Object.entries(attese)) {
    const b = data.attivita.find(x => x.id === id)!;
    const l = data.localita.find(x => x.id === b.localitaId)!;
    assert.equal(l.comuneSlug, comune, `${id}: comune`);
    assert.equal(l.provinciaSlug, provincia, `${id}: provincia`);
    assert.equal(l.regioneSlug, regione, `${id}: regione`);
    assert.ok(l.fonti.length > 0, `${id}: località senza fonti`);
  }
  for (const l of data.localita) {
    assert.equal(data.localita.filter(x => `${x.regioneSlug}/${x.provinciaSlug}/${x.comuneSlug}` === `${l.regioneSlug}/${l.provinciaSlug}/${l.comuneSlug}`).length, 1);
  }
  const daRevisionare = findDuplicates(data).filter(d => d.esito === 'da-revisionare');
  assert.deepEqual(daRevisionare, [], `duplicati da revisionare: ${JSON.stringify(daRevisionare.map(d => [d.primo, d.secondo]))}`);
});

test('Lotto 5: le nuove schede si trovano per città e per città più servizio', () => {
  const attese: Record<string, string[]> = {
    'cm-orologi-alba': ['manutenzione'],
    'orologeria-romana-cuneo': ['riparazione', 'revisione'],
    'center-watch-ancona': ['riparazione'],
    'gioielleria-malaspina-reggio-calabria': ['riparazione'],
    'gioielleria-gigante-ortona': ['riparazione'],
    'orologeria-corso-11-verona': ['riparazione'],
    'gioielleria-melone-vallo': ['revisione'],
    'grasso-orologi-acireale': ['restauro-vintage'],
    'immagini-preziose-molfetta': ['batterie'],
    'carmine-costanza-battipaglia': ['riparazione'],
    'orologeria-tic-tac-foligno': ['pendoleria'],
    'gioielleria-de-santis-fermo': ['orologi-tasca'],
    'caffaro-gioielli-ivrea': ['revisione'],
    'sergio-capone-viareggio': ['assistenza'],
  };
  for (const [id, servizi] of Object.entries(attese)) {
    const b = data.attivita.find(x => x.id === id)!;
    const comune = data.localita.find(x => x.id === b.localitaId)!.comune;
    // Come nella UI: la città digitata viene risolta nella località e usata come filtro.
    const localitaId = data.localita.find(x => x.comune === comune)!.id;
    const perCitta = searchDirectory(data, { localita: localitaId });
    assert.ok(perCitta.some(r => r.business.id === id), `${id} non trovato cercando ${comune}`);
    for (const servizio of servizi) {
      const filtrati = searchDirectory(data, { localita: localitaId, servizio });
      assert.ok(filtrati.some(r => r.business.id === id), `${id} non trovato cercando ${comune} + ${servizio}`);
    }
  }
});
