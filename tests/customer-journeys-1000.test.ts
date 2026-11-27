import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {directory, businessUrl, placeOf} from '../site/src/lib/directory.ts';
import {searchDirectory, type SearchFilters} from '../site/src/lib/search.ts';
import {directionsUrl} from '../site/src/lib/business-presentation.ts';
import {isUsableCoordinate, type Business} from '../site/src/lib/schema.ts';
import {JSDOM} from 'jsdom';
const active=directory.attivita.filter(b=>b.attendibilita.stato!=='chiusa');
const cities=directory.localita.filter(p=>active.some(b=>b.localitaId===p.id)).sort((a,b)=>a.comune.localeCompare(b.comune,'it'));
const names=[...new Set(active.flatMap(b=>Object.values(b.marchi).flat().map(c=>c.marca)))];
const services=[...new Set(active.flatMap(b=>b.servizi.map(s=>s.id)))];
const roles=['assistenzaUfficiale','rivenditaUfficiale','riparati','venduti','esperienza','menzionati'] as const;
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases:Record<string,string>={'iwc':'iwc schaffhausen','baume et mercier':'baume mercier','eberhard':'eberhard co'};
const key=(s:string)=>aliases[norm(s)]??norm(s);
type Scenario={group:string;filter:SearchFilters};
const scenarios:Scenario[]=[];
for(let i=0;i<400;i++)scenarios.push({group:'city-service',filter:{localita:cities[i%cities.length].id,servizio:services[(Math.floor(i/cities.length)*7+i%services.length)%services.length]}});
for(let i=0;i<250;i++)scenarios.push({group:'brand-role',filter:{marca:names[i%names.length],ruoloMarca:roles[Math.floor(i/names.length)%roles.length]}});
for(let i=0;i<200;i++)scenarios.push({group:'city-brand',filter:{localita:cities[i%cities.length].id,marca:names[(i*7)%names.length]}});
const variants=['iwc','IWC',' IWC ','iwc schaffhausen','Baume et Mercier','baume et mercier','BAUME & MERCIER','Eberhard','eberhard',' EBERHARD '];
for(let i=0;i<50;i++)scenarios.push({group:'alias',filter:{marca:variants[i%10],ruoloMarca:roles[Math.floor(i/10)]}});
function expected(b:Business,f:SearchFilters){return (!f.localita||b.localitaId===f.localita)&&(!f.servizio||b.servizi.some(s=>s.id===f.servizio))&&(!f.marca||(f.ruoloMarca&&f.ruoloMarca!=='qualsiasi'?b.marchi[f.ruoloMarca]:Object.values(b.marchi).flat()).some(c=>key(c.marca)===key(f.marca!)));}
test('900 scenari di ricerca indipendenti: corrispondenze precise, alias e risultati vuoti',()=>{
 assert.equal(scenarios.length,900);assert.equal(new Set(scenarios.map(s=>JSON.stringify(s))).size,900);
 const counts:Record<string,{pass:number;empty:number}>={};const errors:string[]=[];
 for(const s of scenarios){const want=active.filter(b=>expected(b,s.filter)).map(b=>b.id).sort();const got=searchDirectory(directory,s.filter).map(r=>r.business.id).sort();const c=counts[s.group]??={pass:0,empty:0};if(!want.length)c.empty++;try{assert.deepEqual(got,want);c.pass++;}catch(e){errors.push(JSON.stringify(s)+' '+String(e));}}
 console.log('900 scenari di ricerca:',JSON.stringify(counts));assert.deepEqual(errors,[]);
});
test('100 percorsi profilo: nome, servizi, contatti, mappa e destinazioni marchi',()=>{
 const sample=active.slice(0,100);assert.equal(sample.length,100);
 let passed=0,withoutVerifiedMap=0;
 for(const b of sample){const html=readFileSync('dist'+businessUrl(b)+'index.html','utf8');const dom=new JSDOM(html);const doc=dom.window.document;
 try{assert.equal(doc.querySelector('h1')?.textContent?.trim(),b.nome,b.id);assert.ok(doc.querySelector('#servizi-scheda'),b.id);assert.ok(doc.querySelector('#contatti-scheda'),b.id);assert.ok(doc.querySelector('#fonti'),b.id);
 const href=directionsUrl(b,placeOf(b).comune);if(href)assert.ok(Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]')).some(a=>a.getAttribute('href')===href),b.id);
 if(isUsableCoordinate(b.posizione.coordinate)){assert.ok(doc.querySelector('details[data-map-src]'),b.id);}else{withoutVerifiedMap++;assert.ok(!doc.querySelector('details[data-map-src]'),b.id);}
 for(const link of Array.from(doc.querySelectorAll<HTMLAnchorElement>('#marchi-scheda a')).filter(a=>a.textContent?.includes('Esplora il marchio'))){const h=link.getAttribute('href')!;assert.match(h,/^\/marchi\/[a-z0-9-]+\/$/);assert.ok(readFileSync('dist'+h+'index.html','utf8').includes('id="il-marchio"'));}
 passed++;
 }finally{dom.window.close();}
 }
 console.log('100 schede: '+passed+'/100; senza coordinate verificate: '+withoutVerifiedMap);
});
