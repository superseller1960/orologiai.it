// Exhaustive offline regression matrix. Never imported by the application or deployed as an asset.
import test from 'node:test';
import assert from 'node:assert/strict';
import {directory} from '../site/src/lib/directory.ts';
import {cercaOrologiaioPreciso, type Criteri} from '../site/src/lib/assistant.ts';
import {servizioDocumentato} from '../site/src/lib/recommendations.ts';
import {services,specializations,brandKey,brandAliases,isUsableCoordinate,type Business} from '../site/src/lib/schema.ts';
const verified=directory.attivita.filter(b=>['fonti-verificate','confermata-titolare'].includes(b.attendibilita.stato)&&Boolean(b.contatti.telefono||b.contatti.sito||b.contatti.email));
const sourceById=new Map(directory.fonti.map(s=>[s.id,s]));
const placeById=new Map(directory.localita.map(p=>[p.id,p]));
const serviceIds=Object.keys(services) as (keyof typeof services)[];
const evidence=new Map(serviceIds.map(s=>[s,verified.filter(b=>servizioDocumentato(directory,b,s))]));
function compare(c:Criteri,expected:Business[],opts:{nazionale?:boolean;origine?:{lat:number;lon:number}}={}){
 const result=cercaOrologiaioPreciso(directory,c,opts);
 const label=JSON.stringify(c);
 assert.equal(result.totale,expected.length,label);
 assert.equal(result.risultati.length,Math.min(expected.length,3),label);
 assert.equal(result.alternative.length,0,label);
 assert.ok(result.messaggi.some(m=>m.trim().length>0),label);
 assert.equal(new Set(result.risultati.map(r=>r.id)).size,result.risultati.length,label);
 const valid=new Set(expected.map(b=>b.id));
 for(const r of result.risultati){assert.ok(valid.has(r.id),label+' unexpected '+r.id);assert.ok(r.href.startsWith('/orologeria/'),label);}
 assert.equal(result.stato,expected.length?'ok':'nessun-risultato',label);
 return result.risultati.length;
}
test('Exhaustive assistant matrix — all municipalities × services × specializations',()=>{
 let cases=0,positive=0,empty=0;
 for(const p of directory.localita)for(const servizio of serviceIds){
  const candidates=(evidence.get(servizio)??[]).filter(b=>b.localitaId===p.id);
  for(const specializzazione of [undefined,...specializations]){
   const expected=candidates.filter(b=>!specializzazione||b.specializzazioni.some(s=>s.id===specializzazione));
   const n=compare({localita:p.id,servizio,specializzazione},expected);cases++;if(n)positive++;else empty++;
  }
 }
 assert.equal(cases,directory.localita.length*serviceIds.length*(specializations.length+1));assert.ok(positive>0);assert.ok(empty>0);
 console.log('EXHAUSTIVE municipalities: '+JSON.stringify({cases,positive,empty}));
});
test('Exhaustive assistant matrix — provinces, regions and nationwide services',()=>{
 const provinces=[...new Set(directory.localita.map(p=>p.provinciaSlug))];
 const regions=[...new Set(directory.localita.map(p=>p.regioneSlug))];
 let cases=0,positive=0;
 for(const servizio of serviceIds){
  const candidates=evidence.get(servizio)??[];
  for(const provincia of provinces){if(compare({provincia,servizio},candidates.filter(b=>placeById.get(b.localitaId)?.provinciaSlug===provincia)))positive++;cases++;}
  for(const regione of regions){if(compare({regione,servizio},candidates.filter(b=>placeById.get(b.localitaId)?.regioneSlug===regione)))positive++;cases++;}
  if(compare({servizio},candidates,{nazionale:true}))positive++;cases++;
 }
 assert.equal(cases,(provinces.length+regions.length+1)*serviceIds.length);assert.ok(positive>0);
 console.log('EXHAUSTIVE territories: '+JSON.stringify({cases,positive}));
});
test('Exhaustive assistant matrix — official brands and alias variants',()=>{
 const labels=[...new Set(directory.attivita.flatMap(b=>Object.values(b.marchi).flat().map(c=>c.marca)).concat(Object.keys(brandAliases)))];
 let cases=0,positive=0;
 for(const name of labels)for(const ruoloMarca of ['assistenzaUfficiale','rivenditaUfficiale'] as const){
  const expected=verified.filter(b=>b.marchi[ruoloMarca].some(c=>brandKey(c.marca)===brandKey(name)&&c.fonti.some(id=>sourceById.get(id)?.tipo==='marchio-ufficiale')));
  for(const marca of [name,name.toLowerCase(),' '+name.toUpperCase()+' ']){
   if(compare({marca,ruoloMarca},expected,{nazionale:true}))positive++;cases++;
  }
 }
 assert.equal(cases,labels.length*6);assert.ok(positive>0);
 console.log('EXHAUSTIVE official brands: '+JSON.stringify({cases,positive}));
});
test('Exhaustive assistant matrix — proximity around every verified site, multiple radii',()=>{
 const sites=directory.attivita.filter(b=>isUsableCoordinate(b.posizione.coordinate));
 const rad=(x:number)=>x*Math.PI/180;
 const distance=(a:{lat:number;lon:number},b:{lat:number;lon:number})=>{const h=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));};
 let cases=0,positive=0;
 for(const site of sites){const p=site.posizione.coordinate!;const origine={lat:p.lat,lon:p.lon};
  for(const distanzaMaxKm of [5,20,50,100])for(const servizio of ['riparazione','revisione','batterie'] as const){
   const expected=(evidence.get(servizio)??[]).filter(b=>isUsableCoordinate(b.posizione.coordinate)&&distance(origine,b.posizione.coordinate)<=distanzaMaxKm);
   if(compare({servizio,bisognoPosizione:true,distanzaMaxKm},expected,{origine}))positive++;cases++;
  }
 }
 assert.equal(cases,sites.length*12);assert.ok(positive>0);
 console.log('EXHAUSTIVE proximity: '+JSON.stringify({cases,positive}));
});
test('Negative controls — unknown terms, missing geography and ungranted position never recommend a business',()=>{
 let cases=0;
 for(const servizio of serviceIds){
  for(const c of [{servizio},{servizio,localitaNonCensita:'Comune fixture non censito'},{servizio,bisognoPosizione:true as const},{servizio,terminiNonRiconosciuti:['Marchio fixture sconosciuto']}]) {
   const r=cercaOrologiaioPreciso(directory,c);assert.equal(r.risultati.length,0);assert.equal(r.alternative.length,0);assert.ok(r.messaggi.length>0);cases++;
  }
 }
 assert.equal(cases,serviceIds.length*4);console.log('EXHAUSTIVE negative controls: '+cases);
});
