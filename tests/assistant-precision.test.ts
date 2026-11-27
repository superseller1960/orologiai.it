import test from 'node:test';
import assert from 'node:assert/strict';
import {directory} from '../site/src/lib/directory.ts';
import {cercaOrologiaioPreciso, interpretaRichiesta, combinaCriteri, type Criteri} from '../site/src/lib/assistant.ts';
import {servizioDocumentato} from '../site/src/lib/recommendations.ts';
import {brandKey,isUsableCoordinate} from '../site/src/lib/schema.ts';
test('Assistant precision: clarify location rather than recommend random nationwide shops',()=>{
 const c=interpretaRichiesta('Devo revisionare un orologio automatico.',directory).criteri;
 assert.equal(c.servizio,'revisione');assert.equal(c.specializzazione,'automatici');
 const r=cercaOrologiaioPreciso(directory,c);assert.equal(r.risultati.length,0);assert.match(r.messaggi.join(' '),/città|provincia/);
 const f=combinaCriteri(c,interpretaRichiesta('Firenze',directory).criteri,'Firenze');
 assert.equal(f.servizio,'revisione');assert.equal(f.specializzazione,'automatici');assert.equal(f.localita,'firenze');
 const e=cercaOrologiaioPreciso(directory,f);assert.equal(e.alternative.length,0);
 for(const x of e.risultati)assert.equal(x.comune,'Firenze');
});
test('Assistant precision: 600 real catalog search cases, no unsupported result and at most three',()=>{
 const active=directory.attivita.filter(b=>b.attendibilita.stato!=='chiusa');
 const cities=directory.localita.slice(0,30);
 const svc=['riparazione','revisione','batterie','restauro-vintage','pendoleria','ricambi','cinturini','manutenzione','riparazione-automatici','lucidatura'] as const;
 let total=0,positive=0;
 for(const city of cities)for(const servizio of svc)for(const specializzazione of [undefined,'automatici'] as const){
  const c:Criteri={localita:city.id,servizio,specializzazione};const e=cercaOrologiaioPreciso(directory,c);total++;
  assert.ok(e.risultati.length<=3);assert.equal(e.alternative.length,0);assert.ok(e.messaggi.length>0);if(e.risultati.length)positive++;
  const expected=active.filter(b=>b.localitaId===city.id&&servizioDocumentato(directory,b,servizio)&&(!specializzazione||b.specializzazioni.some(s=>s.id===specializzazione))&&['fonti-verificate','confermata-titolare'].includes(b.attendibilita.stato)&&Boolean(b.contatti.telefono||b.contatti.sito||b.contatti.email));
  assert.equal(e.totale,expected.length);assert.equal(e.risultati.length,Math.min(3,expected.length));
  for(const r of e.risultati)assert.ok(expected.some(b=>b.id===r.id));
 }
 assert.equal(total,600);console.log('Assistant strict: '+total+' cases; '+positive+' with documented matches');
});
test('Assistant precision: authorized brand sources, no downgraded brand or geography, verified proximity',()=>{
 for(const marca of ['IWC','Rolex','Panerai','Jaeger-LeCoultre','Baume & Mercier','Marchio non censito fixture'])for(const ruoloMarca of ['assistenzaUfficiale','rivenditaUfficiale'] as const){
  const e=cercaOrologiaioPreciso(directory,{marca,ruoloMarca},{nazionale:true});assert.equal(e.alternative.length,0);assert.ok(e.risultati.length<=3);
  for(const r of e.risultati){const b=directory.attivita.find(b=>b.id===r.id)!;assert.ok(b.marchi[ruoloMarca].some(m=>brandKey(m.marca)===brandKey(marca)&&m.fonti.some(id=>directory.fonti.some(f=>f.id===id&&f.tipo==='marchio-ufficiale'))));}
 }
 const r=cercaOrologiaioPreciso(directory,{servizio:'riparazione',bisognoPosizione:true,distanzaMaxKm:20},{origine:{lat:43.77,lon:11.25}});
 for(const x of r.risultati){assert.ok(isUsableCoordinate(directory.attivita.find(b=>b.id===x.id)!.posizione.coordinate));assert.ok(x.distanzaKm!==null&&x.distanzaKm<=20);}
});
