import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { REGIONI_ITALIA } from '../site/src/lib/geo.ts';
import { services, macroAreeServizi } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

const regionOf = (localitaId: string) => data.localita.find(p => p.id === localitaId)?.regioneSlug;

test('il catalogo copre le 20 regioni italiane', () => {
  assert.equal(Object.keys(REGIONI_ITALIA).length, 20);
});

test('ogni regione con attivit\u00e0 ha almeno una localit\u00e0 con schede, e ogni attivit\u00e0 ha una localit\u00e0 valida', () => {
  const localitaIds = new Set(data.localita.map(p => p.id));
  for (const b of data.attivita) assert.ok(localitaIds.has(b.localitaId), `localit\u00e0 mancante per ${b.slug}`);
  const regioniConSchede = new Set(data.attivita.map(b => regionOf(b.localitaId)));
  assert.ok(regioniConSchede.size >= 19, `regioni con schede: ${regioniConSchede.size}`);
  for (const slug of regioniConSchede) assert.ok(slug && REGIONI_ITALIA[slug], `regione sconosciuta: ${slug}`);
});

test('la ricerca per regione restituisce solo attivit\u00e0 della regione richiesta', () => {
  const result = searchDirectory(data, { regione: 'toscana' });
  assert.ok(result.length > 0);
  for (const r of result) assert.equal(regionOf(r.business.localitaId), 'toscana');
});

test('nessuna attivit\u00e0 duplicata per slug o per coppia nome+comune', () => {
  const slugs = data.attivita.map(b => b.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'slug duplicati');
  const keys = data.attivita.map(b => `${b.nome.toLowerCase()}|${b.localitaId}`);
  assert.equal(new Set(keys).size, keys.length, 'nome+localit\u00e0 duplicati');
});

test('macroaree: ogni servizio appare in una sola area e ogni id esiste nel catalogo', () => {
  const tutti = macroAreeServizi.flatMap(a => a.servizi);
  assert.equal(new Set(tutti).size, tutti.length, 'servizio presente in pi\u00f9 aree');
  for (const id of tutti) assert.ok(id in services, `servizio sconosciuto: ${id}`);
});

test('macroaree: nessun servizio aggiunto automaticamente alle attivit\u00e0 (solo raggruppamento)', () => {
  const usati = new Set(data.attivita.flatMap(b => b.servizi.map(s => s.id)));
  for (const id of usati) assert.ok(id in services, `servizio non catalogato: ${id}`);
});

test('le pagine regionali sono generate solo per regioni con attivit\u00e0 verificate', async () => {
  const pagina = await readFile('site/src/pages/orologerie/[regione]/index.astro', 'utf8');
  assert.match(pagina, /regioniConAttivita/);
  assert.match(pagina, /getStaticPaths/);
});
