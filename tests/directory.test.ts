import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { searchDirectory, distanceKm, filtersFromParams } from '../site/src/lib/search.ts';
const raw = JSON.parse(await readFile('site/data/directory.json','utf8'));
const fullData = directorySchema.parse(raw);
const legacy = JSON.parse(await readFile('site/data/orologerie.json','utf8'));
const legacyIds = new Set(legacy.orologerie.map((b: { id: string }) => b.id));
// Search regression uses the original cohort: adding new businesses does not require editing expected counts.
const data = { ...fullData, attivita: fullData.attivita.filter(b => legacyIds.has(b.id)) };
const copy = (): Directory => structuredClone(data);
test('tutte le otto attività e informazioni originali sono conservate', async () => {
  const old = JSON.parse(await readFile('site/data/orologerie.json','utf8'));
  assert.ok(fullData.attivita.length >= old.orologerie.length);
  assert.equal(data.attivita.length, old.orologerie.length);
  for (const o of old.orologerie) {
    const b = data.attivita.find(b => b.id === o.id)!;
    assert.ok(b); assert.equal(b.nome,o.nome); assert.equal(b.storia.testo,o.storia); assert.equal(b.storia.annoFondazione,o.anno);
    assert.deepEqual(b.servizi.map(s => s.id),o.servizi);
    assert.deepEqual(b.marchi.menzionati.map(m => m.marca),o.marche);
    assert.equal(b.attendibilita.stato,'da-verificare');
    if (b.posizione.coordinate) assert.equal(b.posizione.coordinate.stato,'verificata');
  }
});
test('rifiuta ID, slug e percorsi territoriali duplicati', () => {
  for (const mutate of [(d: Directory) => { d.attivita.push(structuredClone(d.attivita[0])); }, (d: Directory) => { d.attivita[1].slug = d.attivita[0].slug; }, (d: Directory) => { d.localita.push({...d.localita[0],id:'altro'}); }]) { const d=copy(); mutate(d); assert.equal(directorySchema.safeParse(d).success,false); }
});
test('rifiuta riferimenti mancanti e dati geografici impossibili', () => {
  const d = copy(); d.attivita[0].localitaId='inesistente'; assert.equal(directorySchema.safeParse(d).success,false);
  const e = copy(); e.attivita[0].servizi[0].fonti=['assente']; assert.equal(directorySchema.safeParse(e).success,false);
  const f = copy(); f.attivita[0].posizione.coordinate={lat:100,lon:11,fonti:['mirror-firenze']}; assert.equal(directorySchema.safeParse(f).success,false);
});
test('non accetta URL eseguibili, orari errati o conferme senza evidenza', () => {
  const a=copy(); a.attivita[0].contatti.sito='javascript:alert(1)'; assert.equal(directorySchema.safeParse(a).success,false);
  const b=copy(); b.attivita[0].orari.giorni=[{giorno:1,intervalli:[{apertura:'20:00',chiusura:'09:00'}]}]; assert.equal(directorySchema.safeParse(b).success,false);
  const c=copy(); c.attivita[0].attendibilita.stato='confermata-titolare'; assert.equal(directorySchema.safeParse(c).success,false);
});
test('autorizzazioni ufficiali richiedono una fonte attuale del marchio', () => {
  const d=copy(); const b=d.attivita[0]; b.marchi.assistenzaUfficiale=[{marca:'Rolex',fonti:['mirror-firenze']}];
  assert.equal(directorySchema.safeParse(d).success,false);
  d.fonti.push({id:'marca-test',tipo:'marchio-ufficiale',url:'https://example.org/rete',titolo:'Fonte sintetica test',consultataIl:'2026-10-16',percorsoArchivio:null,licenza:null});
  b.marchi.assistenzaUfficiale[0].fonti=['marca-test']; b.attendibilita.verificataIl='2026-10-16';
  assert.equal(directorySchema.safeParse(d).success,true);
});
test('filtri reali per comune, regione, provincia, servizio, testo e ruolo marchio', () => {
  assert.equal(searchDirectory(data).length,8);
  assert.equal(searchDirectory(data,{localita:'firenze'}).length,5);
  assert.equal(searchDirectory(data,{regione:'lombardia',provincia:'milano'}).length,3);
  assert.equal(searchDirectory(data,{servizio:'riparazione'}).length,2);
  assert.equal(searchDirectory(data,{marca:'Rolex'}).length,2);
  assert.equal(searchDirectory(data,{marca:'Rolex',ruoloMarca:'venduti'}).length,0);
  assert.equal(searchDirectory(data,{marca:'Rolex',ruoloMarca:'assistenzaUfficiale'}).length,0);
  assert.equal(searchDirectory(data,{q:'SANGALLI Milano'}).length,1);
  assert.equal(searchDirectory(data,{q:'firenze',servizio:'ricambi'}).length,1);
  assert.equal(searchDirectory(data,{localita:'roma'}).length,0);
  assert.equal(searchDirectory(data,{specializzazione:'antichi'}).length,0);
});
test('ricerca CAP e indirizzo solo se realmente presenti; non deduce servizi', () => {
  const d=copy(); d.attivita[0].posizione.cap='50199'; d.attivita[0].posizione.indirizzo='Via Sintetica 5';
  assert.equal(searchDirectory(d,{q:'50199'}).length,1);
  assert.equal(searchDirectory(d,{q:'via sintetica'}).length,1);
  assert.deepEqual(searchDirectory(data,{q:'50122'}).map(r=>r.business.id),['marretti']);
  assert.equal(searchDirectory(data,{q:'50999'}).length,0);
  assert.equal(searchDirectory(data,{servizio:'batterie'}).length,0);
});
test('distanze corrette, mancanti in coda e nessuna precisione simulata', () => {
  assert.equal(distanceKm({lat:0,lon:0},{lat:0,lon:0}),0);
  assert.ok(Math.abs(distanceKm({lat:0,lon:0},{lat:1,lon:0})-111.195)<.01);
  const d=copy(); d.attivita[0].posizione.coordinate={lat:43.77,lon:11.25,fonti:['mirror-firenze']};
  const result=searchDirectory(d,{origine:{lat:43.77,lon:11.25},ordine:'distanza'});
  assert.equal(result[0].business.id,'scardi'); assert.equal(result[0].distanzaKm,0);
  const withoutCoords=result.filter(r=>!r.business.posizione.coordinate);
  assert.ok(withoutCoords.length>0); assert.ok(withoutCoords.every(r=>r.distanzaKm===null));
  assert.ok(searchDirectory(data).every(r=>r.distanzaKm===null));
});
test('chiusure e ruoli URL invalidi sono gestiti esplicitamente', () => {
  const d=copy();d.attivita[0].attendibilita.stato='chiusa';
  assert.equal(searchDirectory(d).length,7);assert.equal(searchDirectory(d,{stato:'chiusa'}).length,1);
  assert.equal(filtersFromParams(new URLSearchParams('ruoloMarca=__proto__')).ruoloMarca,'qualsiasi');
});
