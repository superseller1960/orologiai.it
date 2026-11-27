import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { directory } from '../site/src/lib/directory.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { isUsableCoordinate, type Directory } from '../site/src/lib/schema.ts';
import { selectMapState, type MapPoint } from '../site/src/lib/map-state.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import centers from '../site/data/map-centers.json';
import report from '../data/import/fase20-reviewed-report.json';
const baseline=JSON.parse(readFileSync('data/staging/fase20/catalog-before.json','utf8')) as Directory;
const get=(id:string)=>directory.attivita.find(b=>b.id===id)!;
test('Fase20: tutte le 346 identità preservate, quattro sedi nuove senza duplicati',()=>{
 // Fase20 fissava 350 schede: i lotti successivi possono solo aggiungerne.
 assert.ok(directory.attivita.length>=350);assert.equal(report.nuove.length,4);assert.equal(report.arricchite.length,2);
 for(const b of baseline.attivita){const cur=get(b.id);assert.equal(cur.slug,b.slug);assert.equal(cur.localitaId,b.localitaId);const c=cur.posizione.coordinate;const arricchita=!b.posizione.coordinate&&c?.stato==='verificata'&&c.provenienza==='geocodifica-osm'&&c.fonti.some(id=>id.startsWith('f45-geo-'));if(!arricchita)assert.deepEqual(c,b.posizione.coordinate);}
 const ids=new Set(report.nuove.map(b=>b.id));
 assert.deepEqual(findDuplicates(directory).filter(d=>d.esito==='da-revisionare'&&(ids.has(d.primo)||ids.has(d.secondo))),[]);
 assert.equal(get('martines-agrigento-atenea').laboratorio?.tipo,'rete');
 assert.ok(!get('martines-agrigento-atenea').servizi.some(s=>s.id==='riparazione'));
 assert.match(get('martines-agrigento-atenea').laboratorio!.descrizione,/Canicattì/);
 for(const b of report.nuove.map(x=>get(x.id)))assert.deepEqual(b.marchi.assistenzaUfficiale,[]);
});
test('Belluno: due riparatori documentati, laboratorio non dedotto e lavorazioni arricchite',()=>{
 assert.deepEqual(searchDirectory(directory,{localita:'belluno',servizio:'riparazione'}).map(r=>r.business.id).sort(),['de-marco-belluno','gioielleria-boni-belluno']);
 assert.equal(get('gioielleria-boni-belluno').laboratorio?.tipo,'non-specificato');
 assert.equal(get('de-marco-belluno').laboratorio?.tipo,'interno');
 assert.equal(get('de-marco-belluno').altriServizi.length,3);
 assert.equal(get('gior-gioielli-belluno').laboratorio?.tipo,'orafo');
 for(const id of ['vicentini-gioielli-belluno','gior-gioielli-belluno'])assert.ok(!get(id).servizi.some(s=>s.id==='riparazione'));
});
test('Torino manutenzione invariato; quattro città con soli marker pertinenti e coordinate esatte persistenti',()=>{
 // I lotti successivi possono aggiungere attività a Torino: le quattro storiche restano,
 // ma il totale non è più un numero fisso.
 assert.ok(searchDirectory(directory,{localita:'torino',servizio:'manutenzione'}).length>=4);
 assert.equal(directory.attivita.filter(b=>isUsableCoordinate(b.posizione.coordinate)).length,84);
 const points:MapPoint[]=directory.attivita.filter(b=>isUsableCoordinate(b.posizione.coordinate)).map(b=>({id:b.id,nome:b.nome,comune:b.localitaId,indirizzo:b.posizione.indirizzo,lat:b.posizione.coordinate!.lat,lon:b.posizione.coordinate!.lon,href:'/orologeria/'+b.slug+'/'}));
 for(const localita of ['belluno','torino','firenze','milano']){
  const ids=searchDirectory(directory,{localita,servizio:localita==='torino'?'manutenzione':'riparazione'}).map(r=>r.business.id);
  const state=selectMapState(points,{ids,localita,restricted:true},centers);
  assert.ok(state.center);assert.ok(state.points.every(p=>ids.includes(p.id)&&get(p.id).localitaId===localita));
  if(localita==='belluno'){assert.equal(state.points.length,0);assert.equal(state.center.nome,'Belluno');}
 }
 assert.equal(selectMapState(points,{ids:[],restricted:true,localita:'ignota'},centers).unavailable,true);
});
test('Fase19: CSS live esatto, DOM Astro e niente trasformatore JS della preview',()=>{
 const handoff=JSON.parse(readFileSync('data/staging/fase20/handoff.json','utf8')) as {css:string;referenceDOMTransformationJS:string};
 const live=readFileSync('data/staging/fase20/production-search.html','utf8');
 assert.ok(live.includes(handoff.css));assert.ok(live.includes(handoff.referenceDOMTransformationJS));
 assert.ok(readFileSync('site/src/styles/search.css','utf8').includes(handoff.css));
 const search=readFileSync('dist/cerca/index.html','utf8');
 for(const c of ['result-topline','result-main','result-identity','result-facts','result-reason','result-primary','Apri la scheda','Trova il professionista giusto'])assert.ok(search.includes(c),c);
 assert.ok(!search.includes('const cardList='));assert.ok(!search.includes('referenceDOMTransformationJS'));
 assert.ok(!/class="status"/.test(search));
});
test('Homepage 16C protetta e Lotto5 ancora sospeso',()=>{
 const hashes=JSON.parse(readFileSync('data/staging/fase18-geocode/homepage-sha256-before.json','utf8')) as Record<string,string>;
 for(const [file,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file);
 const suspended=JSON.parse(readFileSync('data/import/fase13-lotto5-20261028-reviewed.json','utf8')) as {candidati:{id:string}[]};
 assert.equal(suspended.candidati.length + (suspended as {promosse?:unknown[]}).promosse?.length!,15);for(const b of suspended.candidati)assert.ok(!directory.attivita.some(x=>x.id===b.id));
});
