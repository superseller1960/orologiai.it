import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory, normalize } from '../site/src/lib/search.ts';
import { interpretaRichiesta } from '../site/src/lib/assistant.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const sourceIds = new Set(data.fonti.map(s => s.id));
const newIds = [
  'monetti-napoli-mille', 'monetti-napoli-brigida', 'deluca-napoli', 'pirone-napoli', 'mazzone-salerno',
  'carrieri-bari', 'macchina-tempo-bari', 'chlw-bari',
  'bruno-emanuele-palermo', 'cagnina-palermo', 'di-caro-palermo', 'watch-center-palermo',
  'censi-genova', 'astrua-genova', 'astrua-torino', 'capo-torino', 'lab-alessandria',
  'bottega-del-tempo-roma', 'salamena-roma', 'portanova-bologna',
];

test('le venti attività dell’Incremento 08 sono integrate una sola volta con slug e ID stabili', () => {
  for (const id of newIds) {
    assert.equal(data.attivita.filter(b => b.id === id).length, 1, `manca o duplicata ${id}`);
  }
  assert.equal(new Set(data.attivita.map(b => b.slug)).size, data.attivita.length);
});

test('ogni nuova scheda ha fonti ufficiali verificate e non inventa coordinate né autorizzazioni ufficiali', () => {
  for (const id of newIds) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.equal(b.attendibilita.stato, 'fonti-verificate');
    assert.equal(b.attendibilita.verificataIl, '2026-10-19');
    assert.equal(b.posizione.coordinate, null);
    // Le sole autorizzazioni ammesse sono quelle documentate dalle fonti ufficiali dei marchi
    // (arricchimento del 25/10/2026): nessuna rivendita o assistenza senza fonte del marchio.
    for (const c of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      assert.ok(c.fonti.length > 0, `${id}: autorizzazione di ${c.marca} senza fonte`);
      for (const f of c.fonti) {
        assert.equal(data.fonti.find(s => s.id === f)?.tipo, 'marchio-ufficiale', `${id}: ${c.marca} senza fonte ufficiale del marchio`);
      }
    }
    const fonti = data.fonti.filter(s => b.attendibilita.fonti.includes(s.id));
    assert.ok(fonti.some(s => s.tipo === 'sito-ufficiale'), `${id}: manca un sito ufficiale fra le fonti`);
    for (const ref of [
      ...b.posizione.fonti, ...b.contatti.fonti, ...b.orari.fonti, ...b.storia.fonti, ...b.attendibilita.fonti,
      ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
      ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flat().flatMap(m => m.fonti),
    ]) {
      assert.ok(sourceIds.has(ref), `fonte mancante ${ref} in ${b.id}`);
    }
  }
});

test('copertura nazionale ampliata: Campania, Puglia, Sicilia e Liguria interrogabili', () => {
  const ids = (f: Parameters<typeof searchDirectory>[1]) => searchDirectory(data, f).map(r => r.business.id);
  for (const [regione, attesa] of [
    ['campania', ['monetti-napoli-mille', 'monetti-napoli-brigida', 'deluca-napoli', 'pirone-napoli', 'mazzone-salerno']],
    ['puglia', ['carrieri-bari', 'macchina-tempo-bari', 'chlw-bari']],
    ['sicilia', ['bruno-emanuele-palermo', 'cagnina-palermo', 'di-caro-palermo', 'watch-center-palermo']],
    ['liguria', ['censi-genova', 'astrua-genova']],
  ] as const) {
    const found = ids({ regione });
    for (const id of attesa) assert.ok(found.includes(id), `${id} non trovato in ${regione}`);
  }
  assert.ok(ids({ localita: 'napoli' }).length >= 4);
  assert.ok(ids({ localita: 'bari' }).length >= 3);
  assert.ok(ids({ localita: 'palermo' }).length >= 4);
  assert.ok(ids({ localita: 'genova' }).length >= 2);
  assert.ok(ids({ localita: 'salerno' }).includes('mazzone-salerno'));
  assert.ok(ids({ localita: 'alessandria' }).includes('lab-alessandria'));
});

test('Roma ha più alternative verificate per riparazione, revisione, batterie e pendoleria', () => {
  const roma = searchDirectory(data, { localita: 'roma' }).map(r => r.business.id);
  for (const id of ['bottega-del-tempo-roma', 'casa-cronometro-roma', 'salamena-roma']) {
    assert.ok(roma.includes(id), `manca a Roma: ${id}`);
  }
  assert.ok(searchDirectory(data, { localita: 'roma', servizio: 'batterie' }).length >= 1);
  assert.ok(searchDirectory(data, { localita: 'roma', servizio: 'pendoleria' }).length >= 2);
  assert.ok(searchDirectory(data, { localita: 'roma', servizio: 'revisione' }).length >= 2);
});

test('l’interpretazione riconosce nuove località e casi reali d’uso nazionali', () => {
  const casi: [string, string][] = [
    ['Cerco un orologiaio a Napoli', 'napoli'],
    ['Riparazione orologi a Palermo', 'palermo'],
    ['Restauro pendole a Bologna', 'bologna'],
    ['Revisione orologio a Bari', 'bari'],
    ['Un laboratorio a Salerno', 'salerno'],
  ];
  for (const [frase, atteso] of casi) {
    const i = interpretaRichiesta(frase, data);
    assert.equal(i.criteri.localita, atteso, `frase: ${frase}`);
  }
});

test('località non censite: segnalazione esplicita e nessun risultato fittizio', () => {
  const fixture = structuredClone(data);
  fixture.localita = fixture.localita.filter(l => l.comuneSlug !== 'imola');
  fixture.attivita = fixture.attivita.filter(b => fixture.localita.some(l => l.id === b.localitaId));
  const i = interpretaRichiesta('Cerco un orologiaio a Imola', fixture);
  assert.equal(i.criteri.localitaNonCensita, 'Imola');
  assert.equal(i.criteri.localita, undefined);
});

test('i dati OSM storici e le otto schede autorevoli restano invariati', async () => {
  const { execSync } = await import('node:child_process');
  // Snapshot fisso (commit 56ded1c, stato prima dei lotti di arricchimento documentati): il
  // confronto resta valido anche quando dati nuovi vengono aggiunti alle stesse schede.
  const out = execSync('git show 56ded1c:site/data/directory.json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const orig = directorySchema.parse(JSON.parse(out));
  // Le correzioni di indirizzo verificate dal lotto 4 sono registrate con prima/dopo e fonti:
  // per quelle schede il valore atteso è quello corretto sulla fonte primaria.
  const { readFileSync } = await import('node:fs');
  const correzioni = new Map<string, string>(
    (JSON.parse(readFileSync('data/reports/lotto-04-20261025-applied.json', 'utf8')).correzioni as { id: string; campo: string; dopo: string | null }[])
      .filter(c => c.campo === 'posizione.indirizzo' && c.dopo)
      .map(c => [c.id, c.dopo as string]),
  );
  const mirror = orig.attivita.filter(b => b.origine.sistema !== 'osm' && b.origine.sistema !== 'migrazione-legacy');
  for (const b of mirror) {
    const current = data.attivita.find(x => x.id === b.id);
    assert.ok(current, `scheda storica scomparsa: ${b.id}`);
    assert.equal(normalize(current!.nome), normalize(b.nome), `nome alterato: ${b.id}`);
    assert.equal(current!.posizione.indirizzo, correzioni.get(b.id) ?? b.posizione.indirizzo, `indirizzo alterato: ${b.id}`);
    // Conservazione: un recapito già documentato non può essere sovrascritto; se era assente,
    // può essere stato aggiunto da una fonte successiva (lotti di arricchimento).
    if (b.contatti.telefono !== null) assert.equal(current!.contatti.telefono, b.contatti.telefono, `telefono alterato: ${b.id}`);
  }
});
