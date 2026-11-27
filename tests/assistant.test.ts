import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import {
  MAX_MESSAGGIO, interpretaRichiesta, cercaOrologiaio, interpretaConProvider, statoOrari, criteriSchema, combinaCriteri,
  type AssistantProvider, type Criteri,
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
  const fixture = structuredClone(data);
  fixture.localita = fixture.localita.filter(l => l.comuneSlug !== 'cesena');
  fixture.attivita = fixture.attivita.filter(b => fixture.localita.some(l => l.id === b.localitaId));
  const crit = interpretaRichiesta('Cerco un orologiaio a Cesena', fixture).criteri;
  assert.equal(crit.localitaNonCensita, 'Cesena');
  assert.equal(crit.localita, undefined);
  const r = cercaOrologiaio(fixture, crit, { now: VENERDI });
  assert.equal(r.stato, 'localita-non-censita');
  assert.equal(r.totale, 0);
});

test('termini maiuscoli non riconosciuti vengono segnalati, non ignorati', () => {
  const crit = interpretaRichiesta('Cerco un orologiaio Blancpain a Firenze', data);
  assert.deepEqual(crit.criteri.terminiNonRiconosciuti, ['Blancpain']);
  assert.equal(crit.criteri.marca, undefined);
  assert.match(crit.chiarimenti.join(' '), /Blancpain/);
});

test('marchio non presente: nessuna attività attribuita a quel marchio', () => {
  const r = cerca('Cerco un laboratorio esperto in MarchioAssente');
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
  const r = cerca('Cerco un rivenditore ufficiale Rolex a Milano');
  assert.equal(r.totale, 0);
});

test('un laboratorio con esperienza Omega è proposto con la sua fonte, senza autorizzazione inventata', () => {
  const r = cerca('Vorrei trovare un laboratorio esperto in Omega, anche se non è un centro ufficiale');
  assert.ok(r.totale > 0);
  for (const x of r.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    assert.ok(x.motivi.some(m => m.includes('Omega')), 'motivo basato su dati');
    // L'esperienza non diventa autorizzazione: «ufficialmente» può apparire solo
    // per ruoli documentati da una fonte del marchio (es. errani-ravenna: lo store
    // locator ufficiale Omega documenta la rivendita ufficiale).
    const ruoliUfficiali = [
      ...b.marchi.assistenzaUfficiale.filter(m => m.marca === 'Omega'),
      ...b.marchi.rivenditaUfficiale.filter(m => m.marca === 'Omega'),
    ];
    if (ruoliUfficiali.length === 0) {
      assert.ok(!x.motivi.some(m => m.includes('ufficialmente')), 'nessuna autorizzazione dichiarata');
    } else {
      for (const ruolo of ruoliUfficiali) assert.ok(ruolo.fonti.length > 0, 'autorizzazione dichiarata solo se documentata');
    }
  }
});

test('menzioni storiche non diventano competenze', () => {
  const r = cercaOrologiaio(data, { marca: 'Rolex' }, { now: VENERDI });
  for (const x of r.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    const ruoliDocumentati = [...b.marchi.riparati, ...b.marchi.venduti, ...b.marchi.esperienza, ...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]
      .filter(m => m.marca === 'Rolex');
    // Una menzione storica resta un avviso, mai una competenza.
    if (b.marchi.menzionati.some(m => m.marca === 'Rolex')) {
      assert.ok(x.attenzione.some(a => a.includes('menzione storica')));
    }
    // Senza alcun ruolo documentato il marchio non può comparire tra i motivi.
    if (ruoliDocumentati.length === 0) {
      assert.ok(!x.motivi.some(m => m.startsWith('Rolex:')), 'marchio citato senza ruolo documentato');
    } else {
      // Un'autorizzazione ufficiale è un ruolo documentato: va nei motivi, non tra le menzioni storiche.
      assert.ok(x.motivi.some(m => m.startsWith('Rolex:')), 'ruolo documentato non dichiarato');
      assert.ok(!x.attenzione.some(a => a.includes('menzione storica')), 'ruolo documentato trattato come menzione');
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
  const r = await interpretaConProvider('revisione a Firenze', data, provider(async () => ({ localita: 'firenze', servizio: 'revisione', marca: 'MarcaInventata' })));
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
test('città in minuscolo senza servizio locale non propone alternative fuori comune', () => {
  // Poggibonsi è riconosciuta, ma l'assenza del servizio non autorizza una ricerca nazionale.
  const criteri = interpretaRichiesta('Cerco cambio batteria a poggibonsi', data).criteri;
  assert.equal(criteri.localita, 'poggibonsi');
  assert.equal(criteri.servizio, 'batterie');
  const risultato = cercaOrologiaio(data, criteri, { now: VENERDI });
  assert.equal(risultato.stato, 'nessun-risultato');
  assert.deepEqual(risultato.alternative, []);
  assert.match(risultato.messaggi.join(' '), /area più ampia/);
});

test('richieste senza città non scambiano le preposizioni per località', () => {
  const telefono = interpretaRichiesta('Dammi il numero di telefono personale del titolare', data).criteri;
  assert.equal(telefono.localitaNonCensita, undefined);
  assert.equal(cerca('Dammi il numero di telefono personale del titolare').stato, 'nessun-criterio');
});

test('città non censita in minuscolo offre la provincia ISTAT senza alternative automatiche', () => {
  const fixture = structuredClone(data);
  fixture.localita = fixture.localita.filter(l => l.comuneSlug !== 'imola');
  fixture.attivita = fixture.attivita.filter(b => fixture.localita.some(l => l.id === b.localitaId));
  const criteri = interpretaRichiesta('Cerco cambio batteria a imola', fixture).criteri;
  assert.equal(criteri.localitaNonCensita, 'imola');
  assert.equal(criteri.servizio, 'batterie');
  const risultato = cercaOrologiaio(fixture, criteri, { now: VENERDI });
  assert.equal(risultato.stato, 'localita-non-censita');
  assert.deepEqual(risultato.alternative, []);
  assert.match(risultato.messaggi.join(' '), /provincia di Bologna.*Emilia/);
});

test('richiesta tecnica su marchio separa chi ripara la marca da chi la vende soltanto', () => {
  const r = cerca('Dove posso revisionare un Hamilton a Scandicci?');
  assert.equal(r.stato, 'nessun-risultato');
  assert.equal(r.totale, 0);
  assert.equal(r.risultati.length, 0);
  assert.ok(r.alternative.some(x => x.id === 'pisani-scandicci-matteotti'), 'chi vende il marchio ed effettua revisioni compare solo tra le alternative');
  assert.match(r.messaggi.join(' '), /non documentano riparazioni specifiche su Hamilton/);
});

test('esempi chiave del servizio: vetro, valutazione vintage, pendola antica, tasca vintage e movimento', () => {
  const vetro = cerca('Dove posso sostituire il vetro del mio orologio?');
  assert.equal(vetro.stato, 'ok');
  assert.ok(vetro.totale > 0);
  for (const x of vetro.risultati) {
    const b = data.attivita.find(y => y.id === x.id)!;
    assert.ok(b.servizi.some(s => s.id === 'ricambi'));
  }

  const valut = cerca('Vorrei far valutare un orologio vintage prima di venderlo');
  assert.equal(valut.stato, 'ok');
  assert.ok(valut.risultati.some(x => x.id === 'horamundi-firenze'));

  const pendola = cerca('Devo restaurare una pendola antica');
  assert.equal(pendola.stato, 'ok');
  assert.ok(pendola.totale >= 3);

  const tasca = cerca('Chi può riparare un orologio da tasca vintage?');
  assert.equal(tasca.stato, 'ok');
  assert.ok(tasca.totale >= 2);

  const torino = cerca('Dove riparo un orologio meccanico a Torino?');
  assert.equal(torino.stato, 'ok');
  assert.ok(torino.risultati.some(x => x.id === 'orologica-torino'));

  const bologna = cerca('Dove posso revisionare un Rolex automatico a Bologna?');
  assert.equal(bologna.stato, 'nessun-risultato');
  assert.ok(bologna.alternative.some(x => x.id === 'fontana-bologna'), 'Bologna propone laboratorio locale come alternativa pertinente');
});

test('ricerche geografiche di servizi per cinturini distinguono città coperte e non coperte', () => {
  for (const [msg, attesoId] of [
    ['Vorrei sostituire il cinturino a Firenze', 'macchina-tempo-firenze'],
    ['Vorrei sostituire il cinturino a Scandicci', 'pisani-scandicci-matteotti'],
    ['Vorrei sostituire il cinturino a Bologna', 'fontana-bologna'],
    ['Vorrei sostituire il cinturino a Roma', 'casa-cronometro-roma'],
  ] as const) {
    const r = cerca(msg);
    assert.equal(r.stato, 'ok', msg);
    assert.ok(r.risultati.some(x => x.id === attesoId), `${msg} -> ${attesoId}`);
  }
  // Torino è coperta: con dieci attività che documentano il servizio, il risultato utile è la copertura
  // della città e non una singola scheda, che può uscire dal limite dei risultati mostrati.
  const torino = cerca('Vorrei sostituire il cinturino a Torino');
  assert.equal(torino.stato, 'ok');
  const torinoIds = new Set(data.attivita.filter(b => b.localitaId === 'torino').map(b => b.id));
  assert.ok(torino.risultati.length > 0 && torino.risultati.every(x => torinoIds.has(x.id)));
  // Milano è coperta dal quick service di Ronchi (sito ufficiale, lotto 1 del 25/10/2026):
  // la città diventa «coperta» e il caso negativo si sposta su un comune privo del servizio.
  const milano = cerca('Vorrei sostituire il cinturino a Milano');
  assert.equal(milano.stato, 'ok');
  assert.ok(milano.risultati.some(x => x.id === 'ronchi-gioielli'));
  const empoli = cerca('Vorrei sostituire il cinturino a Empoli');
  assert.equal(empoli.stato, 'nessun-risultato');
  assert.equal(empoli.risultati.length, 0);
});

test('regioni composte e capoluoghi: «Valle d’Aosta» resta una regione, «Aosta» resta il comune', () => {
  for (const msg of ["Cerco un orologiaio in Valle d'Aosta", "Cerco un orologiaio a Valle d'Aosta"]) {
    const r = interpretaRichiesta(msg, data);
    assert.equal(r.criteri.regione, 'valle-daosta', msg);
    assert.equal(r.criteri.localita, undefined, msg);
    assert.equal(r.criteri.localitaNonCensita, undefined, msg);
    assert.equal(r.criteri.terminiNonRiconosciuti, undefined, msg);
  }
  assert.equal(interpretaRichiesta('Cerco un orologiaio ad Aosta', data).criteri.localita, 'aosta');
  assert.equal(interpretaRichiesta('Cerco un orologiaio a Courmayeur', data).criteri.localita, 'courmayeur');
  // Un capoluogo citato insieme alla propria regione resta un comune, non una regione.
  assert.equal(interpretaRichiesta('Cerco un orologiaio a Firenze in Toscana', data).criteri.localita, 'firenze');
});

// Fase 31B: il modello non aggiunge filtri non richiesti (servizio, tipo, ecc.).
const conModello = (msg: string, out: unknown, contesto?: Criteri) =>
  interpretaConProvider(msg, data, provider(async () => out), undefined, contesto);

test('sola città: il modello non aggiunge servizio o tipo', async () => {
  const r = await conModello('Cerco un orologiaio a Torino', { localita: 'torino', servizio: 'vendita', tipo: 'orologeria' });
  assert.equal(r.criteri.localita, 'torino');
  assert.equal(r.criteri.servizio, undefined);
  assert.equal(r.criteri.tipo, undefined);
});

test('città più riparazione esplicita: il servizio resta', async () => {
  const r = await conModello('riparazione a Torino', { localita: 'torino', servizio: 'riparazione' });
  assert.equal(r.criteri.servizio, 'riparazione');
  assert.equal(r.criteri.localita, 'torino');
});

test('città più revisione esplicita: il servizio resta', async () => {
  const r = await conModello('revisione a Torino', { localita: 'torino', servizio: 'revisione' });
  assert.equal(r.criteri.servizio, 'revisione');
});

test('laboratorio richiesto esplicitamente: il tipo resta', async () => {
  const r = await conModello('cerco un laboratorio a Torino', { localita: 'torino' });
  assert.equal(r.criteri.tipo, 'laboratorio');
});

test('vendita richiesta esplicitamente: il servizio resta', async () => {
  const r = await conModello('vendita di orologi usati a Torino', { localita: 'torino' });
  assert.equal(r.criteri.servizio, 'vendita-usati');
});

test('modifica dei criteri in conversazione: il nuovo servizio sostituisce il precedente', () => {
  const primo = interpretaRichiesta('riparazione a Torino', data).criteri;
  const secondo = interpretaRichiesta('ora revisione', data).criteri;
  const uniti = combinaCriteri(primo, secondo, 'ora revisione');
  assert.equal(uniti.servizio, 'revisione');
  assert.equal(uniti.localita, 'torino');
});

test('Alassio: nessun filtro aggiunto dal modello e la località resta quella letta', async () => {
  const r = await conModello('orologiaio ad Alassio', { localita: 'alassio', servizio: 'vendita' });
  assert.equal(r.criteri.servizio, undefined);
  assert.equal(r.criteri.tipo, undefined);
});

test('Reggio Calabria e Reggio di Calabria: stessa interpretazione territoriale', () => {
  const a = interpretaRichiesta('orologiaio a Reggio Calabria', data).criteri;
  const b = interpretaRichiesta('orologiaio a Reggio di Calabria', data).criteri;
  assert.equal(a.localita ?? a.localitaNonCensita, b.localita ?? b.localitaNonCensita);
});
