import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const sourceIds = new Set(data.fonti.map(s => s.id));
const newIds = [
  'gioielleria-paolini-atri', 'magliozzi-orologi-fondi', 'dslab-orologeria-narni',
  'centro-clinico-orologio-narni', 'gioielleria-foschini-telese', 'luigi-freddo-gioielli-gallipoli',
  'gioielleria-del-genio-martina', 'massimo-gioielli-foggia', 'loncia-doro-siniscola',
  'gioielleria-stoppa-grosseto', 'gioielleria-marco-danese-quartu', 'perdichizzi-1907-barcellona',
];

test('Lotto 3: le 12 nuove schede sono integrate una sola volta, senza perdita di attività', () => {
  for (const id of newIds) assert.equal(data.attivita.filter(b => b.id === id).length, 1, `manca o duplicata ${id}`);
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
  assert.ok(data.attivita.length >= 306);
  const names = data.attivita.map(b => b.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  assert.equal(new Set(names).size, names.length, 'nessun nome normalizzato duplicato');
});

test('Lotto 3: ogni claim ha fonti esistenti consultate il 28/10', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    const refs = [
      ...b.posizione.fonti, ...b.contatti.fonti, ...b.storia.fonti, ...b.attendibilita.fonti,
      ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
      ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
    ];
    for (const ref of refs) {
      const f = data.fonti.find(s => s.id === ref);
      assert.ok(f, `fonte mancante ${ref} in ${id}`);
      assert.ok(['2026-10-28'].includes(f!.consultataIl), `fonte non consultata il 28/10: ${ref}`);
    }
  }
});

test('Lotto 3: rivendite ufficiali solo da locator primari verificati', () => {
  const attese: Record<string, string[]> = {
    'luigi-freddo-gioielli-gallipoli': ['Hamilton'],
    'gioielleria-del-genio-martina': ['Hamilton', 'Mido'],
    'massimo-gioielli-foggia': ['Hamilton'],
    'gioielleria-stoppa-grosseto': ['Breil', 'Tissot'],
    'gioielleria-marco-danese-quartu': ['Hamilton'],
    'perdichizzi-1907-barcellona': ['Hamilton'],
  };
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.deepEqual(b.marchi.rivenditaUfficiale.map(m => m.marca).sort(), (attese[id] ?? []).sort(), `rivendita inattesa in ${id}`);
    assert.equal(b.marchi.assistenzaUfficiale.length, 0, `${id}: nessuna assistenza attribuita`);
    for (const m of b.marchi.rivenditaUfficiale) {
      assert.ok(m.fonti.some(f => data.fonti.find(s => s.id === f)?.tipo === 'marchio-ufficiale'), `${id}: ${m.marca} senza fonte del marchio`);
      assert.ok(b.attendibilita.verificataIl, `${id}: autorizzazione senza data di verifica`);
    }
  }
  const mas = data.attivita.find(b => b.id === 'massimo-gioielli-foggia')!;
  assert.deepEqual(mas.marchi.menzionati.map(m => m.marca), ['Frederique Constant'], 'FC solo menzionato');
});

test('Lotto 3: dati incerti registrati, mai inventati', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.equal(b.posizione.coordinate, null, `${id}: nessuna coordinata inventata`);
    assert.ok(b.attendibilita.cronologia.length >= 1, `${id}: cronologia presente`);
    assert.equal(b.origine.sistema, 'espansione-lotto3-20261028');
  }
  const fos = data.attivita.find(b => b.id === 'gioielleria-foschini-telese')!;
  assert.equal(fos.contatti.telefono, null, 'telefono non documentato: lasciato assente');
  assert.equal(fos.posizione.cap, null, 'CAP non documentato: lasciato assente');
  const del = data.attivita.find(b => b.id === 'gioielleria-del-genio-martina')!;
  assert.ok(del.attendibilita.segnalazioni.some(s => /discordant/i.test(s.motivo)), 'conflitto indirizzo Del Genio registrato');
  const mas = data.attivita.find(b => b.id === 'massimo-gioielli-foggia')!;
  assert.equal(mas.servizi.filter(s => s.id === 'riparazione').length, 0, 'nessuna riparazione attribuita senza fonte');
});

test('Lotto 3: nuove località e province interrogabili dalla ricerca', () => {
  const ids = (f: Parameters<typeof searchDirectory>[1]) => searchDirectory(data, f).map(r => r.business.id);
  const casi: [string, string][] = [
    ['atri', 'gioielleria-paolini-atri'], ['fondi', 'magliozzi-orologi-fondi'],
    ['narni', 'dslab-orologeria-narni'], ['telese-terme', 'gioielleria-foschini-telese'],
    ['gallipoli', 'luigi-freddo-gioielli-gallipoli'], ['martina-franca', 'gioielleria-del-genio-martina'],
    ['siniscola', 'loncia-doro-siniscola'], ['quartu-sant-elena', 'gioielleria-marco-danese-quartu'],
    ['barcellona-pozzo-di-gotto', 'perdichizzi-1907-barcellona'],
  ];
  for (const [comune, atteso] of casi) {
    const risultati = ids({ localita: comune });
    assert.ok(risultati.includes(atteso), `${atteso} interrogabile a ${comune}`);
  }
  assert.ok(ids({ marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale' }).includes('luigi-freddo-gioielli-gallipoli'));
  assert.ok(ids({ marca: 'Mido', ruoloMarca: 'rivenditaUfficiale' }).includes('gioielleria-del-genio-martina'));
  assert.ok(!ids({ marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' }).includes('luigi-freddo-gioielli-gallipoli'));
});
