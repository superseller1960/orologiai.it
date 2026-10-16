import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import {
  MAX_MESSAGGIO, interpretaRichiesta, cercaOrologiaio, interpretaConProvider, statoOrari, criteriSchema,
  type AssistantProvider,
} from '../site/src/lib/assistant.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const data: Directory = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const snapshot = JSON.stringify(data);
// Venerdì 16 ottobre 2026, 10:00 a Roma (08:00 UTC).
const VENERDI = new Date('2026-10-16T08:00:00Z');
// Domenica 18 ottobre 2026, 03:00 a Roma: nessun orario indicato per oggi.
const DOMENICA_NOTTE = new Date('2026-10-17T01:00:00Z');
const ids = (r: { risultati: { id: string }[] }) => r.risultati.map(x => x.id).sort();
const cerca = (msg: string, opz = {}) => cercaOrologiaio(data, interpretaRichiesta(msg, data).criteri, { now: VENERDI, ...opz });

test('il modello della richiesta rifiuta campi sconosciuti e valori fuori schema', () => {
  assert.equal(criteriSchema.safeParse({ servizio: 'hack' }).success, false);
  assert.equal(criteriSchema.safeParse({ localita: 'firenze', sql: 'DROP' }).success, false);
  assert.equal(criteriSchema.safeParse({ distanzaMaxKm: 9999 }).success, false);
  assert.equal(criteriSchema.safeParse({ apertoOggi: false }).success, false);
  assert.equal(criteriSchema.safeParse({}).success, true);
});

test('interpreta le richieste di esempio in criteri espliciti, senza campi inventati', () => {
  const a = interpretaRichiesta('Cerco un orologiaio a Firenze che possa revisionare un orologio automatico', data).criteri;
  assert.deepEqual(a, { localita: 'firenze', servizio: 'revisione', specializzazione: 'automatici' });
  const b = interpretaRichiesta('Vorrei trovare un laboratorio esperto in Omega, anche se non è un centro ufficiale', data).criteri;
  assert.equal(b.marca, 'Omega'); assert.equal(b.tipo, 'laboratorio'); assert.equal(b.ruoloMarca, 'qualsiasi');
  assert.equal(b.apertoOggi, undefined); assert.equal(b.localita, undefined);
  const c = interpretaRichiesta('Cerco un centro assistenza ufficiale Rolex vicino a Milano', data).criteri;
  assert.deepEqual(c, { localita: 'milano', marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale' });
  const d = interpretaRichiesta('Vorrei sostituire il cinturino di un orologio', data).criteri;
  assert.deepEqual(d, { servizio: 'cinturini' });
  const e = interpretaRichiesta('Cerco un negozio che acquisti orologi usati', data).criteri;
  assert.equal(e.servizio, 'acquisto-permuta');
  const f = interpretaRichiesta('Vorrei trovare un’orologeria aperta oggi a Firenze', data).criteri;
  assert.deepEqual(f, { localita: 'firenze', apertoOggi: true });
});

test('nessun criterio riconosciuto: nessuna lista dell’intero database', () => {
  for (const msg of ['Dammi il numero di telefono personale del titolare', 'ciao', '   ']) {
    const r = cerca(msg);
    assert.equal(r.stato, 'nessun-criterio');
    assert.equal(r.totale, 0);
  }
});

test('località inesistente: nessun risultato e nessuna località sostituita', () => {
  const crit = interpretaRichiesta('Cerco un orologiaio a Roma', data).criteri;
  assert.equal(crit.localitaNonCensita, 'Roma');
  assert.equal(crit.localita, undefined);
  const r = cercaOrologiaio(data, crit, { now: VENERDI });
  assert.equal(r.stato, 'localita-non-censita');
  assert.equal(r.totale, 0);
});

test('termini maiuscoli non riconosciuti vengono segnalati, non ignorati', () => {
  const crit = interpretaRichiesta('Cerco un orologiaio Patek Philippe a Firenze', data);
  assert.deepEqual(crit.criteri.terminiNonRiconosciuti, ['Patek Philippe']);
  assert.equal(crit.criteri.marca, undefined);
  assert.match(crit.chiarimenti.join(' '), /Patek Philippe/);
});

test('marchio non presente: nessuna attività attribuita a quel marchio', () => {
  const r = cerca('Cerco un laboratorio esperto in Breguet');
  assert.equal(r.totale, 0);
});

test('filtri combinati restano coerenti con il motore di ricerca', () => {
  const r = cerca('Mi serve la revisione di un orologio automatico a Firenze');
  const attesi = searchDirectory(data, { localita: 'firenze', servizio: 'revisione', specializzazione: 'automatici' }).map(x => x.business.id).sort();
  assert.deepEqual(ids(r), attesi.slice(0, 5));
  assert.equal(r.totale, attesi.length);
});

test('autorizzazione ufficiale Rolex: nessuna rivendita o menzione spacciata per centro assistenza', () => {
  const r = cerca('Cerco un centro assistenza ufficiale Rolex vicino a Milano');
  assert.equal(r.stato, 'nessun-risultato');
  assert.equal(r.totale, 0);
  assert.match(r.messaggi.join(' '), /Non risulta nel database/);
  assert.ok(r.alternative.length > 0);
  for (const alt of r.alternative) {
    const b = data.attivita.find(x => x.id === alt.id)!;
    assert.equal(b.marchi.assistenzaUfficiale.some(m => m.marca === 'Rolex'), false);
  }
});

test('rivenditore ufficiale Rolex: nessun risultato se non documentato come ufficiale', () => {
  const r = cerca('Cerco un rivenditore ufficiale Rolex');
  assert.equal(r.totale, 0);
});

test('un laboratorio con esperienza Omega è proposto con la sua fonte, senza autorizzazione', () => {
  const r = cerca('Vorrei trovare un laboratorio esperto in Omega, anche se non è un centro ufficiale');
  assert.ok(r.totale > 0);
  for (const x of r.risultati) {
    assert.ok(x.motivi.some(m => m.includes('Omega')), 'motivo basato su dati');
    assert.ok(!x.motivi.some(m => m.includes('ufficialmente')), 'nessuna autorizzazione dichiarata');
  }
});

test('menzioni storiche non diventano competenze', () => {
  const r = cercaOrologiaio(data, { marca: 'Rolex' }, { now: VENERDI });
  for (const x of r.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    if (!b.marchi.riparati.some(m => m.marca === 'Rolex') && !b.marchi.venduti.some(m => m.marca === 'Rolex') && !b.marchi.esperienza.some(m => m.marca === 'Rolex')) {
      assert.ok(x.attenzione.some(a => a.includes('menzione storica')));
    }
  }
});

test('vendita e riparazione restano distinte', () => {
  const vendita = cerca('Cerco un negozio che acquisti orologi usati');
  for (const x of vendita.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    assert.ok(b.servizi.some(s => s.id === 'acquisto-permuta'));
  }
  const riparazione = cerca('Mi si è fermato l’orologio: vorrei un professionista a Milano');
  for (const x of riparazione.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    assert.ok(b.servizi.some(s => s.id === 'riparazione'), 'solo servizi di riparazione');
  }
});

test('orari mancanti non diventano "aperto oggi"', () => {
  const r = cerca('Vorrei trovare un’orologeria aperta oggi a Firenze');
  for (const x of r.risultati) assert.equal(x.orari, 'indicato-oggi');
  const senza = data.attivita.find(b => b.orari.giorni.length === 0)!;
  assert.equal(statoOrari(senza, VENERDI), 'non-disponibile');
  assert.equal(r.risultati.some(x => x.id === senza.id), false);
});

test('orari verificati: aperto, fuori orario e giorno senza orario sono distinti', () => {
  const rabiti = data.attivita.find(b => b.id === 'rabiti-firenze')!;
  assert.equal(statoOrari(rabiti, VENERDI), 'indicato-oggi');
  assert.equal(statoOrari(rabiti, DOMENICA_NOTTE), 'nessun-orario-oggi');
  const scaduto = structuredClone(rabiti);
  scaduto.orari.verificatiIl = '2024-01-01';
  assert.equal(statoOrari(scaduto, VENERDI), 'non-recente');
});

test('posizione assente: nessuna ricerca per vicinanza senza origine', () => {
  const r = cerca('Mi si è fermato l’orologio: vorrei trovare un professionista vicino a me');
  assert.equal(r.stato, 'serve-posizione');
  assert.equal(r.totale, 0);
});

test('distanze solo con coordinate utilizzabili e nessun centro città per gli altri', () => {
  const origine = { lat: 45.46, lon: 9.19 };
  const r = cerca('Mi si è fermato l’orologio: vorrei trovare un professionista vicino a me', { origine });
  for (const x of r.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    const usable = b.posizione.coordinate?.stato === 'verificata';
    if (usable) assert.equal(typeof x.distanzaKm, 'number');
    else assert.equal(x.distanzaKm, null);
  }
});

test('input troppo lungo viene rifiutato prima di ogni interpretazione', async () => {
  await assert.rejects(interpretaConProvider('a'.repeat(MAX_MESSAGGIO + 1), data, null), RangeError);
});

test('provider non configurato: ricerca locale con avviso esplicito', async () => {
  const r = await interpretaConProvider('revisione a Firenze', data, null);
  assert.equal(r.origine, 'deterministica');
  assert.match(r.avviso ?? '', /non configurato/);
  assert.equal(r.criteri.servizio, 'revisione');
});

const provider = (impl: AssistantProvider['interpreta']): AssistantProvider => ({ interpreta: impl });

test('provider simulato valido: criteri accettati solo se esistono nel database', async () => {
  const r = await interpretaConProvider('qualsiasi cosa', data, provider(async () => ({ localita: 'firenze', servizio: 'revisione', marca: 'MarcaInventata' })));
  assert.equal(r.origine, 'provider');
  assert.equal(r.criteri.localita, 'firenze');
  assert.equal(r.criteri.marca, undefined, 'marche non nel database scartate');
});

test('provider simulato con località inventata: scartata', async () => {
  const r = await interpretaConProvider('x', data, provider(async () => ({ localita: 'citta-inventata' })));
  assert.equal(r.criteri.localita, undefined);
});

test('risposte malformate del provider: fallback deterministico', async () => {
  for (const bad of [null, 'testo libero', { servizio: 'hack' }, { localita: 'firenze', sql: 'DROP TABLE' }, [1, 2]]) {
    const r = await interpretaConProvider('revisione a Firenze', data, provider(async () => bad));
    assert.equal(r.origine, 'deterministica');
    assert.match(r.avviso ?? '', /non ha risposto correttamente/);
    assert.equal(r.criteri.servizio, 'revisione');
  }
});

test('provider che lancia errore o va in timeout: fallback deterministico', async () => {
  const lancia = await interpretaConProvider('revisione a Firenze', data, provider(async () => { throw new Error('rete'); }));
  assert.equal(lancia.origine, 'deterministica');
  const lento = await interpretaConProvider('revisione a Firenze', data, provider(() => new Promise(() => {})), 20);
  assert.equal(lento.origine, 'deterministica');
});

test('il provider non modifica il database e riceve solo il messaggio', async () => {
  let ricevuto: string | null = null;
  await interpretaConProvider('revisione a Firenze', data, provider(async msg => { ricevuto = msg; return {}; }));
  assert.equal(ricevuto, 'revisione a Firenze');
  assert.equal(JSON.stringify(data), snapshot);
});

test('ogni risultato rimanda alla scheda corretta', () => {
  const r = cerca('revisione a Firenze');
  for (const x of r.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    assert.equal(x.href, `/orologeria/${b.slug}/`);
  }
});

test('risultati vuoti spiegati senza invenzioni', () => {
  const r = cerca('restauro di orologi da tasca antichi a Pontedera', {});
  if (r.totale === 0) assert.match(r.messaggi.join(' '), /Nessuna attività soddisfa/);
});
