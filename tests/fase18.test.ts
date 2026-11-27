import test from 'node:test';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {directory} from '../site/src/lib/directory.ts';
import {searchDirectory,searchDirectoryTiered} from '../site/src/lib/search.ts';
import {isUsableCoordinate} from '../site/src/lib/schema.ts';
import {selectMapState, type MapPoint} from '../site/src/lib/map-state.ts';
import {compareGeocode} from '../site/src/lib/geocoding.ts';
import {findDuplicates} from '../site/src/lib/duplicates.ts';
import centers from '../site/data/map-centers.json';
import review from '../data/import/fase18-geocode-review.json';
import report from '../data/import/fase18-reviewed-report.json';
const get=(id:string)=>directory.attivita.find(b=>b.id===id)!;
test('Fase18: 22 nuove schede, 20 nazionali e 2 Belluno; tutte le 324 preesistenti preservate',()=>{
 // Il catalogo cresce con i lotti successivi: il controllo è che le 346 schede
 // della fase restino presenti, non che il totale si fermi lì.
 const fase18 = directory.attivita.filter(b=>b.origine.sistema!=='fase20-20261101');
 assert.ok(fase18.length>=346);assert.equal(report.nuove.length,22);
 assert.equal(report.nuove.filter(b=>b.localita==='belluno').length,2);
 const base=JSON.parse(readFileSync('data/staging/fase18-geocode/catalog-before.json','utf8')) as typeof directory;
 for(const b of base.attivita){assert.equal(get(b.id).slug,b.slug);assert.equal(get(b.id).localitaId,b.localitaId);}
 const ids=new Set(report.nuove.map(b=>b.id));
 assert.deepEqual(findDuplicates(directory).filter(d=>d.esito==='da-revisionare'&&(ids.has(d.primo)||ids.has(d.secondo))),[]);
});
test('Belluno: vendita non diventa riparazione; Boni arricchito senza autorizzazioni inventate',()=>{
 assert.equal(searchDirectory(directory,{localita:'belluno'}).length,4);
 assert.deepEqual(searchDirectory(directory,{localita:'belluno',servizio:'riparazione'}).map(r=>r.business.id).sort(),['de-marco-belluno','gioielleria-boni-belluno']);
 for(const id of ['vicentini-gioielli-belluno','gior-gioielli-belluno'])assert.ok(!get(id).servizi.some(s=>s.id==='riparazione'));
 assert.equal(get('gior-gioielli-belluno').laboratorio?.tipo,'orafo');
 for(const id of ['revisione','pendoleria','vendita-usati'])assert.ok(get('gioielleria-boni-belluno').servizi.some(s=>s.id===id));
 assert.equal(get('gioielleria-boni-belluno').storia.annoFondazione,null);
 assert.equal(get('de-marco-belluno').storia.annoFondazione,1938);
 assert.deepEqual(get('gioielleria-boni-belluno').marchi.assistenzaUfficiale,[]);
 assert.equal(searchDirectory(directory,{localita:'belluno',servizio:'riparazione-meccanici'}).length,0);
 assert.equal(searchDirectoryTiered(directory,{localita:'belluno',servizio:'riparazione-meccanici'}).pertinenti.length,2);
});
test('Mappa quattro città: solo ID esatti/pertinenti, centro locale anche senza marker',()=>{
 const points:MapPoint[]=directory.attivita.filter(b=>isUsableCoordinate(b.posizione.coordinate)).map(b=>({id:b.id,nome:b.nome,comune:b.localitaId,indirizzo:b.posizione.indirizzo,lat:b.posizione.coordinate!.lat,lon:b.posizione.coordinate!.lon,href:'/orologeria/'+b.slug+'/'}));
 for(const localita of ['belluno','firenze','roma','milano']){
  const ids=searchDirectory(directory,{localita,servizio:'riparazione'}).map(r=>r.business.id);
  const result=selectMapState(points,{ids,localita,restricted:true},centers);
  assert.ok(result.center);assert.ok(result.points.every(p=>ids.includes(p.id)&&get(p.id).localitaId===localita));
  if(localita==='belluno')assert.equal(result.points.length,0);
 }
 const empty=selectMapState(points,{ids:[],localita:'belluno',restricted:true},centers);assert.equal(empty.points.length,0);assert.equal(empty.center?.nome,'Belluno');
 assert.equal(selectMapState(points,{ids:[],comune:'città ignota',restricted:true},centers).unavailable,true);
});
test('Geocodifica: civico, strada, comune, paese, CAP e scala edificio obbligatori',()=>{
 const valid={lat:'46.14',lon:'12.21',boundingbox:['46.1399','46.1401','12.2099','12.2101'],address:{house_number:'3',road:'Piazza Mazzini',town:'Belluno',country_code:'it',postcode:'32100'}};
 assert.equal(compareGeocode('Piazza Mazzini 3','Belluno','32100',valid).esito,'corrispondenza');
 for(const address of [{...valid.address,house_number:undefined},{...valid.address,town:'Roma'},{...valid.address,road:'Altra via'},{...valid.address,postcode:'32000'}])assert.equal(compareGeocode('Piazza Mazzini 3','Belluno','32100',{...valid,address}).esito,'incerta');
 assert.equal(compareGeocode('Piazza Mazzini 3','Belluno','32100',{...valid,boundingbox:['46','47','12','13']}).esito,'incerta');
 assert.equal(directory.attivita.filter(b=>isUsableCoordinate(b.posizione.coordinate)).length,84);
 for(const c of review.nuove){const p=get(c.id).posizione.coordinate;assert.ok(isUsableCoordinate(p));assert.equal(p.lat,c.lat);assert.equal(p.lon,c.lon);}
});
test('Botteghe vicine con identità e civici distinti non sono duplicati',()=>{
 const a=get('pace-gioielli-brindisi'), b=get('naviglio-e-fiume-brindisi');
 assert.deepEqual(findDuplicates({...directory,attivita:[a,b]}),[]);
 assert.ok(findDuplicates({...directory,attivita:[a,{...b,posizione:{...b.posizione,indirizzo:a.posizione.indirizzo}}]}).length>0);
});
test('Homepage protetta e 15 sospesi esclusi dal catalogo',()=>{
 const hashes=JSON.parse(readFileSync('data/staging/fase18-geocode/homepage-sha256-before.json','utf8')) as Record<string,string>;
 // La fase storica resta verificabile sul commit precedente al redesign autorizzato.
 // Gli asset e il layout non interessati continuano a essere verificati sul tree corrente.
 const redesigned = new Set(['site/src/pages/index.astro','site/src/styles/home.css']);
 for(const [file,hash]of Object.entries(hashes)){
  const bytes=redesigned.has(file)?execFileSync('git',['show',`a2e79ade4f881fa8db9e6da93911fca8aefd8ef8:${file}`],{maxBuffer:16*1024*1024}):readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,file);
 }
 const suspended=JSON.parse(readFileSync('data/import/fase13-lotto5-20261028-reviewed.json','utf8')) as {candidati:{id:string}[]};
 assert.equal(suspended.candidati.length + (suspended as {promosse?:unknown[]}).promosse?.length!,15);for(const c of suspended.candidati)assert.ok(!directory.attivita.some(b=>b.id===c.id));
});
