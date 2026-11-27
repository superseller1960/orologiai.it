import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { evidenzaConfermata } from '../site/src/lib/evidenze.ts';
import { cercaConContesto, cercaOrologiaio, combinaCriteri, etichettaFonti, interpretaConProvider, interpretaRichiesta, type Criteri } from '../site/src/lib/assistant.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { handleOrologiaio, creaRateLimiter } from '../site/src/lib/orologiaio-api.ts';

const dir = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const turno = async (messaggio: string, contesto: Criteri = {}) =>
  (await interpretaConProvider(messaggio, dir, null, undefined, contesto)).criteri;
// Fixture isolate: il test non dipende dall'assenza casuale di una città reale dal catalogo vivo.
const turnoIn = async (fixture: typeof dir, messaggio: string, contesto: Criteri = {}) =>
  (await interpretaConProvider(messaggio, fixture, null, undefined, contesto)).criteri;
const senzaComune = (comuneSlug: string) => {
  const f = structuredClone(dir);
  f.localita = f.localita.filter(l => l.comuneSlug !== comuneSlug);
  f.attivita = f.attivita.filter(b => f.localita.some(l => l.id === b.localitaId));
  return f;
};

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
  const fixture = senzaComune('pisa');
  const prima = await turnoIn(fixture, 'Per un Rolex automatico', await turnoIn(fixture, 'Cerco una revisione a Firenze'));
  const seconda = await turnoIn(fixture, 'Invece a Pisa?', prima);
  assert.equal(seconda.servizio, 'revisione');
  assert.equal(seconda.marca, 'Rolex');
  assert.equal(seconda.specializzazione, 'automatici');
  assert.equal(seconda.localita, undefined);
  assert.equal(seconda.localitaNonCensita, 'Pisa');
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
  // Nessun rivenditore ufficiale Hamilton documenta le valutazioni (i lotti di arricchimento
  // 1 e 2 del 25/10/2026 hanno aggiunto pendoleria e batterie a rivenditori Hamilton: la
  // fixture usa un servizio che resta realmente non documentato per quel ruolo).
  const r = cercaOrologiaio(dir, { marca: 'Hamilton', ruoloMarca: 'rivenditaUfficiale', servizio: 'valutazioni' });
  assert.equal(r.totale, 0);
  assert.ok(r.alternative.every(x => dir.attivita.find(b => b.id === x.id)!.servizi.some(s => s.id === 'valutazioni')));
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

test('28B: Alassio ISTAT non produce alternative nazionali e offre Savona e Liguria', async () => {
  const richiesta = 'Cerco un laboratorio di riparazione orologi ad Alassio.';
  const interp = await interpretaConProvider(richiesta, dir, { interpreta: async () => ({ localita: 'firenze', provincia: 'firenze', regione: 'toscana', risposta: 'Ecco le attività a Firenze.' }) });
  assert.equal(interp.origine, 'provider');
  assert.equal(interp.criteri.localitaNonCensita, 'Alassio');
  assert.equal(interp.criteri.localita, undefined);
  assert.equal(interp.criteri.provincia, undefined);
  assert.equal(interp.criteri.regione, undefined);
  assert.equal(interp.risposta, null);
  const esito = cercaOrologiaio(dir, interp.criteri);
  assert.equal(esito.stato, 'localita-non-censita');
  assert.deepEqual(esito.risultati, []);
  assert.deepEqual(esito.alternative, []);
  assert.match(esito.messaggi.join(' '), /provincia di Savona.*Liguria/);
});

test('28B: allargamento esplicito o accettato cerca solo nella provincia di Savona', async () => {
  const prima = await turno('Cerco riparazione ad Alassio');
  for (const msg of ['Sì', 'Amplia alla provincia', 'Cerca nella provincia di Savona']) {
    const criteri = await turno(msg, prima);
    assert.equal(criteri.provincia, 'savona', msg);
    assert.equal(criteri.localitaNonCensita, undefined, msg);
    const esito = cercaOrologiaio(dir, criteri);
    assert.ok(esito.risultati.length > 0, msg);
    for (const r of [...esito.risultati, ...esito.alternative]) {
      const b = dir.attivita.find(b => b.id === r.id)!;
      assert.equal(dir.localita.find(l => l.id === b.localitaId)?.provinciaSlug, 'savona', msg);
    }
  }
});

test('28B: assenso e allargamento mantengono il territorio anche se il provider restituisce il contesto precedente', async () => {
  const prima: Criteri = { localitaNonCensita: 'Alassio', servizio: 'riparazione', tipo: 'laboratorio' };
  for (const msg of ['Sì', 'Amplia alla provincia', 'Cerca nella provincia di Savona']) {
    const r = await interpretaConProvider(msg, dir, { interpreta: async () => ({ localitaNonCensita: 'Alassio', localita: 'firenze', regione: 'toscana' }) }, undefined, prima);
    assert.equal(r.origine, 'provider');
    assert.equal(r.criteri.provincia, 'savona', msg);
    assert.equal(r.criteri.localitaNonCensita, undefined, msg);
    assert.equal(r.criteri.localita, undefined, msg);
    assert.equal(r.criteri.regione, undefined, msg);
    assert.ok(cercaOrologiaio(dir, r.criteri).risultati.every(x => dir.localita.find(l => l.id === dir.attivita.find(b => b.id === x.id)?.localitaId)?.provinciaSlug === 'savona'));
  }
  const regione = await turno('Amplia alla regione', prima);
  assert.equal(regione.regione, 'liguria');
  assert.equal(regione.localitaNonCensita, undefined);
});

test('28B: città sconosciuta e vincoli di città non producono risultati fuori area', async () => {
  const criteri = (await interpretaConProvider('Riparazione a Cittainventata', dir, { interpreta: async () => ({ regione: 'toscana', provincia: 'firenze' }) })).criteri;
  assert.equal(criteri.localitaNonCensita, 'Cittainventata');
  assert.equal(criteri.regione, undefined);
  assert.equal(criteri.provincia, undefined);
  assert.deepEqual(cercaOrologiaio(dir, criteri).alternative, []);
  assert.match(cercaOrologiaio(dir, criteri).messaggi.join(' '), /Non posso determinare/);
  for (const comune of ['firenze', 'genova']) {
    const esito = cercaOrologiaio(dir, { localita: comune, servizio: 'pendoleria', tipo: 'laboratorio' }, { limite: 200 });
    for (const r of [...esito.risultati, ...esito.alternative]) assert.equal(dir.attivita.find(b => b.id === r.id)?.localitaId, comune);
  }
  const uniti: Criteri = { localita: 'poggibonsi', servizio: 'batterie' };
  const ric = cercaConContesto(dir, uniti, { servizio: 'batterie' }, { precedenti: { localita: 'poggibonsi' } });
  assert.equal(ric.criteri.localita, 'poggibonsi');
  assert.ok([...ric.esito.risultati, ...ric.esito.alternative].every(r => dir.attivita.find(b => b.id === r.id)?.localitaId === 'poggibonsi'));
});

test('07A: un contesto ereditato che svuota i risultati non nasconde le attività della nuova richiesta', async () => {
  // Conversazione reale: dopo una ricerca su Omega vintage, "Ci sono orologiai in Molise?" deve mostrare il Molise.
  const uniti = await turno('Ci sono orologiai in Molise?', { servizio: 'acquisto-permuta', marca: 'Omega', specializzazione: 'vintage' });
  assert.deepEqual(uniti, { servizio: 'acquisto-permuta', marca: 'Omega', specializzazione: 'vintage', regione: 'molise' });
  const nuovi = interpretaRichiesta('Ci sono orologiai in Molise?', dir).criteri;
  const ricerca = cercaConContesto(dir, uniti, nuovi, { precedenti: { servizio: 'acquisto-permuta', marca: 'Omega', specializzazione: 'vintage' } });
  assert.equal(ricerca.daSoliNuoviCriteri, true);
  assert.equal(ricerca.contestoPrecedente, true);
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

// Prima richiesta e richieste successive: il ripiego sui soli criteri nuovi è lo stesso,
// ma solo dal secondo messaggio esiste un contesto precedente di cui parlare all'utente.
test('07A: la prima richiesta non annuncia criteri di una richiesta precedente inesistente', () => {
  const uniti: Criteri = { localita: 'firenze', terminiNonRiconosciuti: ['MarchioInesistente'] };
  const nuovi: Criteri = { localita: 'firenze' };
  const ricerca = cercaConContesto(dir, uniti, nuovi, { precedenti: {} });
  assert.equal(ricerca.daSoliNuoviCriteri, true, 'Il ripiego sui soli criteri nuovi resta attivo');
  assert.equal(ricerca.contestoPrecedente, false, 'Al primo messaggio non c’è nulla di ereditato');
  assert.deepEqual(ricerca.criteri, nuovi);
  assert.ok(ricerca.esito.risultati.length > 0);
});

test('07A: dal secondo messaggio il ripiego dichiara il contesto ereditato', () => {
  const uniti: Criteri = { localita: 'firenze', terminiNonRiconosciuti: ['MarchioInesistente'] };
  const nuovi: Criteri = { localita: 'firenze' };
  const ricerca = cercaConContesto(dir, uniti, nuovi, { precedenti: { localita: 'milano' } });
  assert.equal(ricerca.daSoliNuoviCriteri, true);
  assert.equal(ricerca.contestoPrecedente, true);
  assert.deepEqual(ricerca.criteri, nuovi);
  assert.ok(ricerca.esito.risultati.length > 0);
});

test('07A: il numero di fonti è declinato e zero fonti non è presentato come documentazione', () => {
  assert.equal(etichettaFonti(0), 'nessuna fonte registrata');
  assert.equal(etichettaFonti(1), '1 fonte');
  assert.equal(etichettaFonti(2), '2 fonti');
  assert.equal(etichettaFonti(7), '7 fonti');
  for (const n of [1, 2]) {
    // Attività senza evidenza recuperata: qui si verifica il conteggio, non la frase della fonte.
    const b = dir.attivita.find(x => x.servizi.some(s => s.fonti.length === n && !evidenzaConfermata(x.id, s.id)))!;
    const s = b.servizi.find(s => s.fonti.length === n && !evidenzaConfermata(b.id, s.id))!;
    const trovato = cercaOrologiaio(dir, { localita: b.localitaId, servizio: s.id }, { limite: 200 }).risultati.find(r => r.id === b.id)!;
    assert.ok(trovato, `Attività ${b.id} presente nella ricerca del proprio comune`);
    // Fase 44: senza citazione verificata non si parla di documentazione né di numero di fonti.
    assert.ok(trovato.motivi.some(m => m.includes('servizio indicato nella scheda, da confermare con l’attività.')), `Formula sobria per ${n} fonti dichiarate`);
    assert.ok(!trovato.motivi.some(m => /documentat[oi] da|Offre “/.test(m)), 'Un URL registrato non è una prova del servizio');
    assert.ok(!trovato.motivi.some(m => m.includes('fonte/i')), 'Nessuna forma “fonte/i”');
  }
  // Zero fonti: sulla copia del catalogo non si afferma alcuna documentazione.
  const clone = structuredClone(dir);
  const target = clone.attivita[0];
  target.servizi = target.servizi.map((s, i) => i === 0 ? { ...s, fonti: [] } : s);
  const esito = cercaOrologiaio(clone, { localita: target.localitaId, servizio: target.servizi[0].id }, { limite: 200 });
  const senzaFonti = esito.risultati.find(r => r.id === target.id);
  assert.ok(senzaFonti, 'L’attività resta elencata anche senza fonti sul servizio');
  assert.ok(senzaFonti.motivi.some(m => m.includes('da confermare con l’attività.')), 'Zero fonti resta un servizio da confermare');
  assert.ok(!senzaFonti.motivi.some(m => /documentat[oi]|Offre “|fonte\/i/.test(m)), 'Nessuna documentazione inventata con zero fonti');
});

test('30B: Reggio Calabria e Reggio di Calabria risolvono allo stesso comune ISTAT', async () => {
  const dir = directorySchema.parse(JSON.parse(await readFile(new URL('../site/data/directory.json', import.meta.url), 'utf8')));
  assert.equal(interpretaRichiesta('orologiaio a Reggio Calabria', dir).criteri.localita, 'reggio-calabria');
  assert.equal(interpretaRichiesta('orologiaio a Reggio di Calabria', dir).criteri.localita, 'reggio-calabria');
});
