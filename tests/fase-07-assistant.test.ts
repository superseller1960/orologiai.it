import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { cercaConContesto, cercaOrologiaio, combinaCriteri, interpretaConProvider, interpretaRichiesta, type Criteri } from '../site/src/lib/assistant.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { handleOrologiaio, creaRateLimiter } from '../site/src/lib/orologiaio-api.ts';

const dir = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const turno = async (messaggio: string, contesto: Criteri = {}) =>
  (await interpretaConProvider(messaggio, dir, null, undefined, contesto)).criteri;

test('07A: acquisto e vendita si interpretano dal punto di vista del cliente', () => {
  for (const m of ['Vendo il mio Rolex usato', 'Vorrei vendere un orologio', 'Cerco chi acquista orologi usati', 'Vorrei una permuta']) {
    assert.equal(interpretaRichiesta(m, dir).criteri.servizio, 'acquisto-permuta', m);
  }
  for (const m of ['Vorrei comprare un Rolex usato', 'Cerco un negozio che vende orologi usati']) {
    assert.equal(interpretaRichiesta(m, dir).criteri.servizio, 'vendita-usati', m);
  }
});

test('07A: caratteristiche dell’orologio non sono interpretate come comuni', () => {
  for (const m of ['Un orologio a carica automatica', 'Riparazione in un laboratorio', 'Un orologio in oro', 'Revisione in Italia']) {
    assert.equal(interpretaRichiesta(m, dir).criteri.localitaNonCensita, undefined, m);
  }
});

test('07A: un rivenditore ufficiale presente non riceve un messaggio di assenza', () => {
  const r = cercaOrologiaio(dir, { marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale' }, { limite: dir.attivita.length });
  assert.ok(r.risultati.some(b => b.id === 'massari-campi'));
  assert.ok(!r.messaggi.some(m => /Non risulta|non autorizzat/i.test(m)));
  assert.deepEqual(r.alternative, []);
});

test('07A: un centro ufficiale presente non riceve alternative generiche (fixture di ruolo)', () => {
  const fixture = structuredClone(dir);
  const b = fixture.attivita.find(b => b.id === 'massari-campi')!;
  b.marchi.assistenzaUfficiale = structuredClone(b.marchi.rivenditaUfficiale);
  const r = cercaOrologiaio(fixture, { marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' }, { limite: fixture.attivita.length });
  assert.equal(r.stato, 'ok');
  assert.ok(r.risultati.some(x => x.id === b.id));
  assert.deepEqual(r.messaggi, []);
});

test('07A: assenza di documentazione non diventa una dichiarazione di non autorizzazione', () => {
  const r = cercaOrologiaio(dir, { localita: 'milano', marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale' });
  assert.equal(r.totale, 0);
  assert.ok(r.alternative.length > 0);
  assert.match(r.messaggi.join(' '), /autorizzazione richiesta non è documentata/);
  assert.doesNotMatch(r.messaggi.join(' '), /non sono autorizzate|non autorizzate/);
});

test('07A: rivendita e assistenza ufficiale restano ruoli distinti', () => {
  const r = cercaOrologiaio(dir, { localita: 'campi-bisenzio', marca: 'Hamilton', ruoloMarca: 'assistenzaUfficiale' });
  assert.ok(!r.risultati.some(b => b.id === 'massari-campi'));
  assert.ok(r.alternative.every(b => !b.motivi.some(m => m.includes('assistenza ufficialmente'))));
});

test('07A: aggiungere Rolex automatico conserva revisione e Firenze', async () => {
  const prima = await turno('Cerco una revisione a Firenze');
  const seconda = await turno('Per un Rolex automatico', prima);
  assert.deepEqual(seconda, { localita: 'firenze', servizio: 'revisione', marca: 'Rolex', specializzazione: 'automatici' });
});

test('07A: cambiare città conserva servizio, marchio e specializzazione', async () => {
  const prima = await turno('Per un Rolex automatico', await turno('Cerco una revisione a Firenze'));
  const seconda = await turno('Invece a Prato?', prima);
  assert.equal(seconda.servizio, 'revisione');
  assert.equal(seconda.marca, 'Rolex');
  assert.equal(seconda.specializzazione, 'automatici');
  assert.equal(seconda.localita, undefined);
  assert.equal(seconda.localitaNonCensita, 'Prato');
});

test('07A: una città censita sostituisce una città non censita', async () => {
  const c = await turno('Invece a Milano', { localitaNonCensita: 'Caltanissetta', servizio: 'revisione' });
  assert.equal(c.localita, 'milano');
  assert.equal(c.localitaNonCensita, undefined);
  assert.equal(c.servizio, 'revisione');
});

test('07A: provincia e regione sostituiscono il vecchio comune', () => {
  const c = combinaCriteri({ localita: 'firenze', servizio: 'riparazione' }, { provincia: 'prato' });
  assert.equal(c.localita, undefined);
  const r = combinaCriteri(c, { regione: 'toscana' });
  assert.equal(r.provincia, undefined);
  assert.equal(r.regione, 'toscana');
  assert.equal(r.servizio, 'riparazione');
});

test('07A: una correzione di servizio sostituisce solo il servizio', async () => {
  const c = await turno('Invece il cinturino', { localita: 'milano', servizio: 'revisione', marca: 'Rolex' });
  assert.equal(c.servizio, 'cinturini');
  assert.equal(c.localita, 'milano');
  assert.equal(c.marca, 'Rolex');
});

test('07A: qualsiasi marchio elimina marca, ruolo e precedente termine sconosciuto', () => {
  assert.deepEqual(combinaCriteri({ localita: 'milano', marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale', terminiNonRiconosciuti: ['X'] }, {}, 'qualsiasi marchio'), { localita: 'milano' });
});

test('07A: richiesta esplicita di ricerca nuova azzera il contesto', async () => {
  const c = await turno('Nuova ricerca: cambio batteria a Milano', { localita: 'firenze', marca: 'Rolex', specializzazione: 'automatici', servizio: 'revisione' });
  assert.deepEqual(c, { localita: 'milano', servizio: 'batterie' });
});

test('07A: richiesta senza autorizzazione toglie il requisito ufficiale', async () => {
  const c = await turno('Anche non ufficiale', { marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale', servizio: 'revisione' });
  assert.equal(c.ruoloMarca, 'qualsiasi');
  assert.equal(c.servizio, 'revisione');
});

test('07A: allargamento nazionale esplicito rimuove il territorio', () => {
  const c = combinaCriteri({ localitaNonCensita: 'Caltanissetta', servizio: 'pendoleria' }, {}, 'Cerca in tutta Italia');
  assert.deepEqual(c, { servizio: 'pendoleria' });
});

test('07A: comune non censito non elimina il marchio e il requisito ufficiale nelle alternative', () => {
  const r = cercaOrologiaio(dir, { localitaNonCensita: 'Caltanissetta', servizio: 'batterie', marca: 'Rolex', ruoloMarca: 'assistenzaUfficiale' });
  assert.equal(r.totale, 0);
  assert.deepEqual(r.alternative, []);
});

test('07A: termine commerciale sconosciuto con comune noto non allarga la ricerca', () => {
  const c = interpretaRichiesta('Cerco revisione di MarchioAssente a Firenze', dir).criteri;
  assert.ok(c.terminiNonRiconosciuti?.includes('MarchioAssente'));
  const r = cercaOrologiaio(dir, c);
  assert.equal(r.totale, 0);
  assert.deepEqual(r.alternative, []);
});

test('07A: marchio proposto dal provider ma non censito non viene ignorato', async () => {
  const r = await interpretaConProvider('revisione', dir, { interpreta: async () => ({ marca: 'MarchioAssente', servizio: 'revisione' }) });
  assert.deepEqual(r.criteri.terminiNonRiconosciuti, ['MarchioAssente']);
  assert.equal(cercaOrologiaio(dir, r.criteri).totale, 0);
});

test('07A: luogo proposto dal provider ma assente non restituisce tutte le città', async () => {
  const r = await interpretaConProvider('riparazione', dir, { interpreta: async () => ({ localita: 'luogo-assente', servizio: 'riparazione' }) });
  assert.equal(r.criteri.localitaNonCensita, 'luogo-assente');
  assert.equal(cercaOrologiaio(dir, r.criteri).totale, 0);
});

test('07A: provider non disponibile conserva i criteri dei turni precedenti', async () => {
  const r = await interpretaConProvider('Invece a Milano', dir, { interpreta: async () => { throw new Error('rete'); } }, 20, { localita: 'firenze', servizio: 'revisione', marca: 'Rolex' });
  assert.equal(r.origine, 'deterministica');
  assert.deepEqual(r.criteri, { localita: 'milano', servizio: 'revisione', marca: 'Rolex' });
});

test('07A: servizio assente non produce risultati con servizi diversi', () => {
  const r = cercaOrologiaio(dir, { marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale', servizio: 'pendoleria' });
  assert.equal(r.totale, 0);
  assert.ok(r.alternative.every(x => dir.attivita.find(b => b.id === x.id)!.servizi.some(s => s.id === 'pendoleria')));
});

test('07A: coordinate non verificate non entrano nel calcolo delle distanze', () => {
  const fixture = structuredClone(dir);
  fixture.attivita[0].posizione.coordinate = { lat: 43.77, lon: 11.25, fonti: ['mirror-firenze'], stato: 'da-verificare', provenienza: 'geocodifica-osm', verificataIl: '2026-10-20' };
  const r = searchDirectory(fixture, { origine: { lat: 43.77, lon: 11.25 }, ordine: 'distanza' });
  assert.equal(r.find(x => x.business.id === fixture.attivita[0].id)!.distanzaKm, null);
});

test('07A: il raggio massimo vale anche per le alternative territoriali', () => {
  const r = cercaOrologiaio(dir, { localitaNonCensita: 'Caltanissetta', servizio: 'riparazione', distanzaMaxKm: 1 }, { origine: { lat: 38.115, lon: 13.361 } });
  assert.deepEqual(r.alternative, []);
});

for (const regione of ['campania', 'veneto', 'piemonte', 'puglia', 'sicilia', 'sardegna']) {
  test(`07A: regione non coperta ${regione} non riceve risultati di altre regioni`, () => {
    const senzaRegione = {
      ...dir,
      localita: dir.localita.filter(p => p.regioneSlug !== regione),
      attivita: dir.attivita.filter(b => dir.localita.find(p => p.id === b.localitaId)?.regioneSlug !== regione),
    };
    const r = cercaOrologiaio(senzaRegione, { regione, servizio: 'riparazione' });
    assert.equal(r.totale, 0);
    if (r.alternative.length) assert.match(r.messaggi.join(' '), /altri comuni|lontane/);
  });
}

test('07A: endpoint senza chiave mantiene la conversazione e distingue il fallback', async () => {
  const res = await handleOrologiaio(new Request('https://example.test/api/orologiaio', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messaggio: 'Per un Rolex automatico', contesto: { localita: 'firenze', servizio: 'revisione' } }),
  }), {}, { dir, limiter: creaRateLimiter() });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.modalita, 'non-configurato');
  assert.deepEqual(body.criteri, { localita: 'firenze', servizio: 'revisione', marca: 'Rolex', specializzazione: 'automatici' });
});

test('07A: un contesto ereditato che svuota i risultati non nasconde le attività della nuova richiesta', async () => {
  // Conversazione reale: dopo una ricerca su Omega vintage, "Ci sono orologiai in Molise?" deve mostrare il Molise.
  const uniti = await turno('Ci sono orologiai in Molise?', { servizio: 'acquisto-permuta', marca: 'Omega', specializzazione: 'vintage' });
  assert.deepEqual(uniti, { servizio: 'acquisto-permuta', marca: 'Omega', specializzazione: 'vintage', regione: 'molise' });
  const nuovi = interpretaRichiesta('Ci sono orologiai in Molise?', dir).criteri;
  const ricerca = cercaConContesto(dir, uniti, nuovi);
  assert.equal(ricerca.daSoliNuoviCriteri, true);
  assert.deepEqual(ricerca.criteri, { regione: 'molise' });
  assert.deepEqual(ricerca.esito.risultati.map(r => r.id).sort(), cercaOrologiaio(dir, { regione: 'molise' }).risultati.map(r => r.id).sort());
});

test('07A: con risultati dal contesto unito il ripiego non scatta e i criteri restano quelli uniti', () => {
  const uniti: Criteri = { localita: 'milano', servizio: 'riparazione' };
  const ricerca = cercaConContesto(dir, uniti, { servizio: 'riparazione' });
  assert.equal(ricerca.daSoliNuoviCriteri, false);
  assert.deepEqual(ricerca.criteri, uniti);
  assert.equal(ricerca.esito.stato, 'ok');
});

test('07A: senza alternative reali il ripiego non inventa risultati', () => {
  const ricerca = cercaConContesto(dir, { marca: 'MarchioInesistente', servizio: 'revisione' }, { marca: 'MarchioInesistente' });
  assert.equal(ricerca.daSoliNuoviCriteri, false);
  assert.equal(ricerca.esito.risultati.length, 0);
});
