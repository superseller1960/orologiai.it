import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { directorySchema, type Directory, type Business } from '../site/src/lib/schema.ts';

const load = async (): Promise<Directory> =>
  directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

const NUOVE_SCHEDE = [
  'laboratorio-orologiaio-marcianise', 'gold-shine-portico-caserta',
  'gioielleria-merola-santa-maria-capua-vetere', 'gioielleria-galdi-salerno',
  'gioielleria-comentale-angri', 'tarlociaru-lecce', 'gioielleria-della-rocca-brindisi',
  'lorologiaio-taranto', 'vitrani-gioiellieri-barletta', 'gioielleria-burrascano-messina',
  'raffa-maestro-orologiaio-siracusa', 'fratelli-gallo-cosenza',
  'gioielleria-digiesi-1959-matera', 'fusco-snc-pescara', 'cheope-benevento',
];

test('lotto 8: 15 nuove schede presenti e documentate', async () => {
  const directory = await load();
  assert.ok(directory.attivita.length >= 264, `Catalogo sceso a ${directory.attivita.length} attività`);
  for (const id of NUOVE_SCHEDE) {
    const b = directory.attivita.find(x => x.id === id);
    assert.ok(b, `Manca la scheda ${id}`);
    assert.ok(b.descrizione.length > 80, `${id}: descrizione troppo generica`);
    assert.ok(b.posizione.indirizzo, `${id}: indirizzo mancante`);
    const recapiti = [b.contatti.telefono, b.contatti.email, b.contatti.sito, b.contatti.whatsapp, ...b.contatti.social];
    assert.ok(recapiti.some(Boolean), `${id}: nessun recapito`);
    assert.equal(b.attendibilita.stato, 'fonti-verificate', `${id}: stato attendibilità`);
    assert.ok(b.attendibilita.fonti.length > 0, `${id}: nessuna fonte`);
    assert.ok(b.attendibilita.cronologia.length > 0, `${id}: cronologia vuota`);
    assert.equal(b.origine.sistema, 'espansione-lotto8-20261026', `${id}: origine inattesa`);
  }
});

test('lotto 8: autorizzazioni e rivendite solo con fonti del marchio', async () => {
  const directory = await load();
  const fonti = new Map(directory.fonti.map(f => [f.id, f]));
  for (const id of NUOVE_SCHEDE) {
    const b = directory.attivita.find(x => x.id === id) as Business;
    for (const c of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      assert.ok(
        c.fonti.some(f => fonti.get(f)?.tipo === 'marchio-ufficiale'),
        `${id}: autorizzazione ${c.marca} senza fonte del marchio`,
      );
    }
  }
  const digiesi = directory.attivita.find(x => x.id === 'gioielleria-digiesi-1959-matera') as Business;
  assert.ok(digiesi.marchi.rivenditaUfficiale.some(m => m.marca === 'Hamilton'), 'Digiesi: rivendita Hamilton attesa');
  // Uniche autorizzazioni di assistenza del lotto: quelle documentate da pagine Rolex ufficiali.
  const conAssistenza = NUOVE_SCHEDE
    .map(id => directory.attivita.find(x => x.id === id) as Business)
    .filter(b => b.marchi.assistenzaUfficiale.length > 0);
  assert.deepEqual(conAssistenza.map(b => b.id).sort(), ['fratelli-gallo-cosenza', 'gioielleria-galdi-salerno']);
  for (const b of conAssistenza) {
    assert.ok(b.marchi.assistenzaUfficiale.every(c => c.marca === 'Rolex'), `${b.id}: solo assistenza Rolex documentata`);
    for (const c of b.marchi.assistenzaUfficiale) {
      assert.ok(c.fonti.some(f => fonti.get(f)?.url.includes('rolex.com')), `${b.id}: fonte Rolex attesa`);
    }
  }
});

test('lotto 8: località, descrizioni e fonti integre', async () => {
  const directory = await load();
  for (const comune of ['marcianise', 'portico-di-caserta', 'santa-maria-capua-vetere', 'angri', 'lecce']) {
    assert.ok(directory.localita.some(l => l.id === comune), `Manca la località ${comune}`);
  }
  const descrizioni = directory.attivita.map(b => b.descrizione);
  assert.equal(new Set(descrizioni).size, descrizioni.length, 'Descrizioni duplicate nel catalogo');
  const ids = directory.attivita.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length, 'ID attività duplicati');
  const slugs = directory.attivita.map(b => b.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'Slug duplicati');
  for (const f of directory.fonti) assert.match(f.url, /^https?:\/\//, `Fonte ${f.id}: URL non valido`);
  const burrascano = directory.attivita.find(x => x.id === 'gioielleria-burrascano-messina') as Business;
  assert.ok(burrascano.servizi.some(s => s.id === 'pendoleria'), 'Burrascano: pendoleria attesa');
  assert.doesNotMatch(burrascano.descrizione, /curano anche l’Orologio Astronomico/, 'Non presentare come attuale un incarico storico');
  assert.match(burrascano.storia.testo ?? '', /per 18 anni/, 'Burrascano: nota storica attribuita alla bottega');
  assert.ok(!burrascano.altriServizi.some(s => /Duomo/.test(s.nome)), 'Il Duomo non è un servizio corrente');
  const gallo = directory.attivita.find(x => x.id === 'fratelli-gallo-cosenza') as Business;
  assert.match(gallo.storia.testo ?? '', /1956 a Siderno/);
  assert.ok(gallo.storia.eventi.some(e => e.data === '2019' && /Cosenza/.test(e.descrizione)));
  assert.equal(gallo.contatti.email, 'info@fratelligallo.it');
  assert.equal(gallo.orari.giorni.length, 0, 'Non pubblicare orari discordanti o non datati');
});
