import { assertAbsentOrReviewedCoordinate } from './verified-coordinate.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory, normalize } from '../site/src/lib/search.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const sourceIds = new Set(data.fonti.map(s => s.id));
const newIds = [
  'macchina-tempo-firenze',
  'horamundi-firenze',
  'horae-san-giovanni',
  'fontana-bologna',
  'orologica-torino',
  'casa-cronometro-roma',
  'soprana-vicenza',
];

test('le sette attività dell’Incremento 07 sono integrate una sola volta con slug e ID stabili', () => {
  for (const id of newIds) {
    assert.equal(data.attivita.filter(b => b.id === id).length, 1, `manca o duplicata ${id}`);
  }
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
  const names = data.attivita.map(b => normalize(b.nome));
  assert.equal(new Set(names).size, names.length, 'nessun nome normalizzato duplicato');
});

test('ogni nuova scheda ha fonti ufficiali verificate e non inventa coordinate né autorizzazioni ufficiali', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.equal(b.attendibilita.stato, 'fonti-verificate');
    assert.equal(b.attendibilita.verificataIl, '2026-10-19');
    assertAbsentOrReviewedCoordinate(b);
    assert.equal(b.marchi.assistenzaUfficiale.length, 0);
    assert.equal(b.marchi.rivenditaUfficiale.length, 0);
    for (const ref of [
      ...b.posizione.fonti,
      ...b.contatti.fonti,
      ...b.orari.fonti,
      ...b.storia.fonti,
      ...b.attendibilita.fonti,
      ...b.servizi.flatMap(s => s.fonti),
      ...b.altriServizi.flatMap(s => s.fonti),
      ...b.specializzazioni.flatMap(s => s.fonti),
      ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
    ]) {
      assert.ok(sourceIds.has(ref), `fonte mancante ${ref} in ${b.id}`);
    }
  }
});

test('copertura multi-regionale: Bologna, Torino, Roma, Vicenza e San Giovanni Valdarno sono interrogabili', () => {
  const ids = (f: Parameters<typeof searchDirectory>[1]) => searchDirectory(data, f).map(r => r.business.id);
  // L'elenco di ogni comune cresce con i lotti successivi: si verifica che il record dell'incremento 07
  // resti interrogabile nel suo comune e che ogni risultato appartenga davvero a quel comune.
  const comuni: [string, string][] = [
    ['bologna', 'fontana-bologna'], ['torino', 'orologica-torino'], ['roma', 'casa-cronometro-roma'],
    ['vicenza', 'soprana-vicenza'], ['san-giovanni-valdarno', 'horae-san-giovanni'],
  ];
  for (const [comune, atteso] of comuni) {
    const risultati = ids({ localita: comune });
    assert.ok(risultati.includes(atteso), `${atteso} interrogabile a ${comune}`);
    for (const id of risultati) assert.equal(data.attivita.find(b => b.id === id)!.localitaId, comune);
  }
  assert.ok(ids({ regione: 'emilia-romagna' }).includes('fontana-bologna'));
  assert.ok(ids({ regione: 'piemonte' }).includes('orologica-torino'));
  assert.ok(ids({ regione: 'lazio' }).includes('casa-cronometro-roma'));
  assert.ok(ids({ regione: 'veneto' }).includes('soprana-vicenza'));
});

test('categorie specialistiche sottorappresentate hanno ora copertura multipla per la generazione delle pagine SEO', () => {
  const countService = (id: string) => data.attivita.filter(b => b.servizi.some(s => s.id === id)).length;
  assert.ok(countService('restauro-vintage') >= 4);
  assert.ok(countService('orologi-tasca') >= 3);
  assert.ok(countService('valutazioni') >= 2);
  assert.ok(countService('ricambi') >= 5);
  assert.ok(countService('riparazione-meccanici') >= 4);
  assert.ok(countService('riparazione-automatici') >= 4);
  assert.ok(countService('riparazione-quarzo') >= 3);
  assert.ok(countService('pendoleria') >= 5);
});

test('La Macchina del Tempo e Hora Mundi mantengono l’ID originale del nodo OSM', () => {
  const mdt = data.attivita.find(b => b.id === 'macchina-tempo-firenze')!;
  assert.equal(mdt.origine.sistema, 'osm');
  assert.equal(mdt.origine.idOriginale, 'node/10804755206');
  const hm = data.attivita.find(b => b.id === 'horamundi-firenze')!;
  assert.equal(hm.origine.sistema, 'osm');
  assert.equal(hm.origine.idOriginale, 'node/7485085150');
});
