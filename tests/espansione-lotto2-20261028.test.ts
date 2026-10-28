import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const sourceIds = new Set(data.fonti.map(s => s.id));
const newIds = [
  'orologeria-nozzetti-mazara-del-vallo', 'cellini-gioielli-erice', 'gioielleria-amantia-trapani',
  'aurum-gioielleria-crotone', 'la-macchina-del-tempo-san-benedetto', 'orologeria-del-borgo-rimini',
  'cenciarini-gioielleria-riccione', 'oreficeria-superti-castelleone', 'centro-tecnico-orologeria-desio',
  'piccinini-orologiai-mantova', 'officina-del-tempo-olbia', 'gioielleria-marrocu-villacidro',
  'boglietti-gioielliere-biella', 'laboratorio-orologeria-maicol-oristano', 'la-bottega-del-tempo-catanzaro',
];

test('Lotto 2: le 15 nuove schede sono integrate una sola volta con ID e slug stabili', () => {
  for (const id of newIds) assert.equal(data.attivita.filter(b => b.id === id).length, 1, `manca o duplicata ${id}`);
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
  assert.ok(data.attivita.length >= 294, 'il catalogo non perde attività');
});

test('Lotto 2: ogni claim è supportato da fonti esistenti e consultate', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    const refs = [
      ...b.posizione.fonti, ...b.contatti.fonti, ...b.orari.fonti, ...b.storia.fonti,
      ...b.attendibilita.fonti, ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
      ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
      ...b.storia.eventi.flatMap(e => e.fonti), ...b.attendibilita.cronologia.flatMap(c => c.fonti),
    ];
    for (const ref of refs) assert.ok(sourceIds.has(ref), `fonte mancante ${ref} in ${id}`);
    for (const s of data.fonti.filter(f => refs.includes(f.id))) assert.equal(s.consultataIl, '2026-10-28', `fonte non consultata il 28/10: ${s.id}`);
  }
});

test('Lotto 2: autorizzazioni ufficiali solo da fonti primarie dei marchi', () => {
  const attese: Record<string, { assistenza: string[]; rivendita: string[] }> = {
    'la-macchina-del-tempo-san-benedetto': { assistenza: ['Omega'], rivendita: [] },
    'officina-del-tempo-olbia': { assistenza: ['Hamilton'], rivendita: [] },
    'gioielleria-amantia-trapani': { assistenza: [], rivendita: ['Longines'] },
    'boglietti-gioielliere-biella': { assistenza: [], rivendita: ['Longines'] },
    'aurum-gioielleria-crotone': { assistenza: [], rivendita: ['Seiko', 'Tissot'] },
  };
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    const attesa = attese[id] ?? { assistenza: [], rivendita: [] };
    assert.deepEqual(b.marchi.assistenzaUfficiale.map(m => m.marca).sort(), [...attesa.assistenza].sort(), `assistenza inattesa in ${id}`);
    assert.deepEqual(b.marchi.rivenditaUfficiale.map(m => m.marca).sort(), [...attesa.rivendita].sort(), `rivendita inattesa in ${id}`);
    for (const m of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      assert.ok(m.fonti.some(f => data.fonti.find(s => s.id === f)?.tipo === 'marchio-ufficiale'), `${id}: ${m.marca} senza fonte del marchio`);
    }
    if (attesa.assistenza.length || attesa.rivendita.length) {
      assert.ok(b.attendibilita.verificataIl, `${id}: autorizzazione senza data di verifica`);
    }
  }
});

test('Lotto 2: autodichiarazioni non promosse a qualifiche ufficiali', () => {
  const off = data.attivita.find(b => b.id === 'officina-del-tempo-olbia')!;
  assert.deepEqual(off.marchi.menzionati.map(m => m.marca), ['Omega'], 'Omega solo menzionato, non assistenza');
  const pic = data.attivita.find(b => b.id === 'piccinini-orologiai-mantova')!;
  assert.equal(pic.marchi.rivenditaUfficiale.length, 0, 'Rolex/Tudor autodichiarati, nessuna rivendita ufficiale');
  const cen = data.attivita.find(b => b.id === 'cenciarini-gioielleria-riccione')!;
  assert.equal(cen.marchi.rivenditaUfficiale.length, 0, 'Nivada autodichiarata, nessuna rivendita ufficiale');
});

test('Lotto 2: dati incerti lasciati assenti o marcati, mai inventati', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.equal(b.posizione.coordinate, null, `${id}: nessuna coordinata inventata`);
  }
  const nozz = data.attivita.find(b => b.id === 'orologeria-nozzetti-mazara-del-vallo')!;
  assert.equal(nozz.posizione.cap, null, 'CAP assente quando non documentato');
  const pic = data.attivita.find(b => b.id === 'piccinini-orologiai-mantova')!;
  assert.equal(pic.posizione.cap, null, 'CAP della boutique non documentato');
  for (const id of ['laboratorio-orologeria-maicol-oristano', 'la-bottega-del-tempo-catanzaro']) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.equal(b.attendibilita.stato, 'da-verificare', `${id}: stato onesto «da verificare»`);
    assert.equal(b.attendibilita.verificataIl, null);
    assert.ok(b.attendibilita.segnalazioni.length > 0, `${id}: incertezza registrata`);
  }
});

test('Lotto 2: cronologia e segnalazioni documentano le correzioni', () => {
  for (const id of ['la-macchina-del-tempo-san-benedetto', 'boglietti-gioielliere-biella']) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.ok(b.attendibilita.segnalazioni.some(s => /discordant/i.test(s.motivo)), `${id}: conflitto fonti registrato`);
    assert.ok(b.attendibilita.cronologia.length >= 1);
    assert.equal(b.origine.sistema, 'espansione-lotto2-20261028');
  }
});

test('Lotto 2: le nuove località sono interrogabili dalla ricerca', () => {
  const ids = (f: Parameters<typeof searchDirectory>[1]) => searchDirectory(data, f).map(r => r.business.id);
  const casi: [string, string][] = [
    ['mazara-del-vallo', 'orologeria-nozzetti-mazara-del-vallo'], ['erice', 'cellini-gioielli-erice'],
    ['crotone', 'aurum-gioielleria-crotone'], ['san-benedetto-del-tronto', 'la-macchina-del-tempo-san-benedetto'],
    ['riccione', 'cenciarini-gioielleria-riccione'], ['castelleone', 'oreficeria-superti-castelleone'],
    ['desio', 'centro-tecnico-orologeria-desio'], ['villacidro', 'gioielleria-marrocu-villacidro'],
    ['catanzaro', 'la-bottega-del-tempo-catanzaro'],
  ];
  for (const [comune, atteso] of casi) {
    const risultati = ids({ localita: comune });
    assert.ok(risultati.includes(atteso), `${atteso} interrogabile a ${comune}`);
    for (const id of risultati) assert.equal(data.attivita.find(b => b.id === id)!.localitaId, comune);
  }
  assert.ok(ids({ q: 'Amantia' }).includes('gioielleria-amantia-trapani'));
  assert.ok(ids({ marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' }).includes('officina-del-tempo-olbia'));
  assert.ok(ids({ marca: 'Omega', ruoloMarca: 'assistenzaUfficiale' }).includes('la-macchina-del-tempo-san-benedetto'));
  assert.ok(!ids({ marca: 'Omega', ruoloMarca: 'assistenzaUfficiale' }).includes('officina-del-tempo-olbia'));
});

test('Lotto 2: nessuna regressione sulle province a bassa copertura', () => {
  const perProv = new Map<string, number>();
  for (const b of data.attivita) {
    const l = data.localita.find(x => x.id === b.localitaId)!;
    perProv.set(l.siglaProvincia, (perProv.get(l.siglaProvincia) ?? 0) + 1);
  }
  const monoreddito = [...perProv.entries()].filter(([, n]) => n === 1).map(([s]) => s);
  assert.deepEqual(monoreddito.sort(), ['AG', 'CL', 'EN', 'IS'], 'restano solo le province senza candidati verificabili');
  for (const sigla of ['TP', 'CZ', 'KR', 'AP', 'RN', 'CR', 'MB', 'MN', 'BI', 'OT', 'OR', 'SU']) {
    assert.ok((perProv.get(sigla) ?? 0) >= 2, `${sigla}: portata ad almeno due attività`);
  }
});
