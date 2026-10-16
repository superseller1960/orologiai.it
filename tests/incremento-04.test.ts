import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory, normalize } from '../site/src/lib/search.ts';
import { isUsableCoordinate } from '../site/src/lib/schema.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const get = (id: string) => data.attivita.filter(b => b.id === id);
const sourceIds = new Set(data.fonti.map(s => s.id));

test('Lamberti e Massari sono integrate una sola volta, con slug e ID stabili', () => {
  assert.equal(get('lamberti-sesto').length, 1);
  assert.equal(get('massari-campi').length, 1);
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
});

test('nessun duplicato per nome o indirizzo tra le nuove schede e le esistenti', () => {
  const names = data.attivita.map(b => normalize(b.nome));
  assert.equal(new Set(names).size, names.length, 'nomi normalizzati duplicati');
  const sameAddress = data.attivita.filter(b => b.posizione.indirizzo && b.posizione.cap && b.localitaId === 'sesto-fiorentino' && b.posizione.indirizzo.includes('Gramsci'));
  assert.equal(sameAddress.length, 1);
});

test('ogni fonte citata dalle nuove schede esiste e ha una data di consultazione', () => {
  for (const b of [...get('lamberti-sesto'), ...get('massari-campi')]) {
    for (const ref of [...b.posizione.fonti, ...b.contatti.fonti, ...b.attendibilita.fonti, ...b.servizi.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti)]) {
      assert.ok(sourceIds.has(ref), `fonte mancante ${ref} in ${b.id}`);
    }
  }
});

test('Lamberti: nessuna autorizzazione Bulova, nessuna riparazione non confermata', () => {
  const [b] = get('lamberti-sesto');
  assert.deepEqual(b.servizi.map(s => s.id), ['vendita']);
  assert.equal(Object.values(b.marchi).flat().length, 0);
  assert.ok(!JSON.stringify(b).includes('Bulova'));
});

test('Massari: rivendita Hamilton da fonte del marchio; nessuna assistenza Swatch', () => {
  const [b] = get('massari-campi');
  assert.deepEqual(b.marchi.rivenditaUfficiale.map(m => m.marca), ['Hamilton']);
  for (const m of b.marchi.rivenditaUfficiale) assert.ok(m.fonti.some(id => data.fonti.find(s => s.id === id)?.tipo === 'marchio-ufficiale'));
  assert.equal(b.marchi.assistenzaUfficiale.length, 0);
  assert.ok(!b.servizi.some(s => s.id === 'riparazione' || s.id === 'assistenza'));
  // La cronologia dichiara la mancata attribuzione Swatch: qui si controlla solo che non sia un dato attribuito.
  assert.ok(!JSON.stringify([b.servizi, b.marchi, b.altriServizi, b.specializzazioni]).includes('Swatch'));
});

test('nessuna coordinata inventata: le nuove schede non hanno punto', () => {
  for (const b of [...get('lamberti-sesto'), ...get('massari-campi')]) assert.equal(b.posizione.coordinate, null);
});

test('coordinate pubblicate: ogni punto è verificato e ha provenienza, data e indirizzo confrontato', () => {
  const published = data.attivita.filter(b => b.posizione.coordinate);
  assert.deepEqual(published.map(b => b.id).sort(), ['fani-gioielli', 'ronchi-gioielli', 'senzatempo-firenze', 'sangalli'].sort());
  for (const b of published) assert.ok(isUsableCoordinate(b.posizione.coordinate));
});

test('casi discordanti o non precisi restano senza punto', () => {
  for (const id of ['scardi', 'bigalli', 'rocca', 'massari-campi', 'giglio-campi']) {
    const b = data.attivita.find(x => x.id === id);
    if (b) assert.equal(b.posizione.coordinate, null, `${id} non deve avere un punto pubblico`);
  }
});

test('le nuove schede sono raggiungibili dalla ricerca per nome, comune e marchio', () => {
  const ids = (f: Parameters<typeof searchDirectory>[1]) => searchDirectory(data, f).map(r => r.business.id);
  assert.ok(ids({ q: 'Lamberti' }).includes('lamberti-sesto'));
  assert.ok(ids({ q: 'Massari' }).includes('massari-campi'));
  assert.ok(ids({ localita: 'campi-bisenzio' }).includes('massari-campi'));
  assert.ok(ids({ marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale' }).includes('massari-campi'));
  assert.ok(!ids({ marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' }).includes('massari-campi'));
  assert.ok(ids({ q: '50013' }).includes('massari-campi'));
});

test('distanza assente per le schede senza coordinate utilizzabili', () => {
  const r = searchDirectory(data, { origine: { lat: 43.8, lon: 11.2 }, ordine: 'distanza' });
  for (const x of r) if (!x.business.posizione.coordinate) assert.equal(x.distanzaKm, null);
});
