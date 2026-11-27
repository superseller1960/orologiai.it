import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import {directory,slugify,brandNames,businessUrl} from '../site/src/lib/directory.ts';
import {brandKey} from '../site/src/lib/schema.ts';
const active=directory.attivita.filter(b=>b.attendibilita.stato!=='chiusa');
const cities=directory.localita.map(p=>({...p,n:active.filter(b=>b.localitaId===p.id).length})).sort((a,b)=>b.n-a.n).slice(0,10);
const brands=['IWC','Jaeger-LeCoultre','Baume & Mercier','Vulcain','Panerai'];
const roles=['assistenzaUfficiale','rivenditaUfficiale','riparati','venduti','esperienza'] as const;
const cases:{label:string;params:Record<string,string>;expected:string[]}[]=[];
for(const p of cities)for(const s of ['riparazione','revisione','batterie','restauro-vintage'])cases.push({label:p.comune+' / '+s,params:{localita:p.id,servizio:s},expected:active.filter(b=>b.localitaId===p.id&&b.servizi.some(x=>x.id===s)).map(b=>b.id)});
for(const name of brands)for(const role of roles)cases.push({label:name+' / '+role,params:{marca:name,ruoloMarca:role},expected:active.filter(b=>b.marchi[role].some(c=>brandKey(c.marca)===brandKey(name))).map(b=>b.id)});
for(const p of cities)cases.push({label:p.comune+' / Rolex',params:{localita:p.id,marca:'Rolex'},expected:active.filter(b=>b.localitaId===p.id&&Object.values(b.marchi).flat().some(c=>brandKey(c.marca)==='rolex')).map(b=>b.id)});
for(let i=0;i<10;i++)cases.push({label:'Località sconosciuta '+i,params:{comune:'Località non censita fixture '+i,servizio:'riparazione'},expected:[]});
for(let i=0;i<5;i++)cases.push({label:'Marchio sconosciuto '+i,params:{marca:'Marchio non censito fixture '+i},expected:[]});
test('90 percorsi sintetici: filtri reali, risultati esatti e stato vuoto recuperabile',async()=>{
 assert.equal(cases.length,90);
 const out=await build({entryPoints:['site/src/scripts/search-ui.ts'],bundle:true,format:'iife',platform:'browser',write:false,logLevel:'silent'});
 const dom=new JSDOM(readFileSync('dist/cerca/index.html','utf8'),{url:'https://www.orologiai.it/cerca/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window,doc=w.document;let passed=0;const failures:string[]=[];
 try{w.eval(out.outputFiles[0].text);
 for(const item of cases){try{
  w.history.replaceState(null,'','/cerca/?'+new URLSearchParams(item.params));w.dispatchEvent(new w.PopStateEvent('popstate'));
  const actual=(w as unknown as {__directoryResults:string[]}).__directoryResults;
  assert.deepEqual([...actual].sort(),[...item.expected].sort(),'risultati esatti');
  const visible=Array.from(doc.querySelectorAll<HTMLElement>('#search-results [data-business-id]')).filter(n=>!n.hidden);
  assert.equal(visible.length,Math.min(item.expected.length,12),'card visibili');
  assert.ok(visible.every(n=>item.expected.includes(n.dataset.businessId??'')),'nessun risultato estraneo');
  assert.equal(doc.querySelector<HTMLElement>('#search-empty')!.hidden,item.expected.length>0,'stato vuoto coerente');
  if(!item.expected.length){assert.ok(doc.querySelector('#search-empty-message')?.textContent?.trim());assert.ok(doc.querySelector('#search-empty a[href="/orologerie/"]'));}
  if(item.params.marca)assert.equal(brandKey(doc.querySelector<HTMLSelectElement>('select[name="marca"]')!.value),brandKey(item.params.marca));
  passed++;
 }catch(e){failures.push(item.label+': '+String(e));}}
 // Alias e cambio di città non devono perdere il filtro marchio.
 w.history.replaceState(null,'','/cerca/?marca=IWC+Schaffhausen&ruoloMarca=assistenzaUfficiale');w.dispatchEvent(new w.PopStateEvent('popstate'));
 assert.equal(brandKey(doc.querySelector<HTMLSelectElement>('select[name="marca"]')!.value),brandKey('IWC'));
 console.log('Percorsi ricerca: '+passed+'/'+cases.length+' superati');
 assert.deepEqual(failures,[]);
 }finally{w.close();}
});
test('10 percorsi profilo → marchio e verifica di tutte le destinazioni dei marchi',()=>{
 const sample=active.filter(b=>Object.values(b.marchi).flat().length>0).slice(0,10);
 assert.equal(sample.length,10);let passed=0;
 for(const b of sample){
  const doc=new JSDOM(readFileSync('dist'+businessUrl(b)+'index.html','utf8')).window.document;
  const links=Array.from(doc.querySelectorAll<HTMLAnchorElement>('#marchi-scheda a')).filter(a=>a.textContent?.includes('Esplora il marchio'));
  assert.ok(links.length>0,b.id);
  for(const link of links){const href=link.getAttribute('href')!;assert.match(href,/^\/marchi\/[a-z0-9-]+\/$/);
   const brandDoc=new JSDOM(readFileSync('dist'+href+'index.html','utf8')).window.document;
   assert.ok(brandDoc.querySelector('#il-marchio h2'));assert.ok(brandDoc.querySelector('#professionisti'));
  }
  assert.ok(doc.querySelector('#marchi-scheda a[href^="/cerca/?marca="]'),'ricerca attività separata');passed++;
 }
 for(const name of brandNames){const html=readFileSync('dist/marchi/'+slugify(name)+'/index.html','utf8');assert.ok(html.includes('id="il-marchio"'),name);}
 console.log('Percorsi profilo-marchio: '+passed+'/10 superati');
});
