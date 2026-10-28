// Collaudo Chromium Fase 12. Tooling locale, non dipendenza del sito:
// npm install --prefix .runtime/browser --no-package-lock --no-save playwright
// BASE=https://preview... node scripts/test-search-browser.mjs
import { chromium } from '../.runtime/browser/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const base=process.env.BASE || 'http://127.0.0.1:3000';
const label=process.env.LABEL || 'local';
const folder=`artifacts/fase12/${label}`;
await mkdir(folder,{recursive:true});
const data=JSON.parse(await readFile('site/data/directory.json','utf8'));
const expected=(city,service)=>data.attivita.filter(b=>(!city||b.localitaId===city)&&b.attendibilita.stato!=='chiusa'&&(!service||b.servizi.some(s=>s.id===service))).map(b=>b.id).sort();
const browser=await chromium.launch({args:['--no-sandbox']});
const report={base,label,scenarios:[],errors:[],networkFailures:[],measurements:[]};
const page=await browser.newPage({viewport:{width:1440,height:900},locale:'it-IT'});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
page.on('requestfailed',r=>report.networkFailures.push({url:r.url(),error:r.failure()?.errorText}));
page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))report.networkFailures.push({url:r.url(),status:r.status()});});
const visit=async(path='/cerca/')=>{await page.goto(base+path,{waitUntil:'networkidle'});await page.waitForFunction(()=>Array.isArray(window.__directoryResults));};
const ids=async()=>await page.evaluate(()=>[...window.__directoryResults].sort());
const submit=async()=>{await page.locator('#directory-search button[type=submit]').click();await page.waitForTimeout(100);};
const fill=async(name,value)=>{const el=page.locator(`#directory-search [name="${name}"]`);if(await el.evaluate(e=>e.tagName==='SELECT'))await el.selectOption(value);else await el.fill(value);};
const visibleCards=()=>page.locator('#search-results [data-business-id]:visible');
const checkPosition=async()=>{
 const state=await page.evaluate(()=>({top:document.querySelector('#search-count').getBoundingClientRect().top,focus:document.activeElement.id,overflow:document.documentElement.scrollWidth-innerWidth,firstCardTop:document.querySelector('#search-results [data-business-id]:not([hidden])')?.getBoundingClientRect().top,scrollY}));
 assert.ok(state.top>=0&&state.top<80,JSON.stringify(state));assert.equal(state.focus,'search-count');assert.equal(state.overflow,0);return state;
};
const scenario=async(name,fn)=>{try{await fn();report.scenarios.push({name,passed:true});console.log('PASS',name);}catch(e){report.scenarios.push({name,passed:false,error:String(e)});throw e;}};
try{
 await scenario('A Firenze, senza regione; risultati visibili e focus',async()=>{await visit();await fill('comune','Firenze');await submit();assert.deepEqual(await ids(),expected('firenze'));await checkPosition();});
 await scenario('B Milano senza Lombardia',async()=>{await visit();await fill('comune','Milano');await submit();assert.deepEqual(await ids(),expected('milano'));await checkPosition();});
 await scenario('C Toscana → Milano, nessun risultato toscano',async()=>{await visit();await page.locator('.advanced-filters summary').click();await fill('regione','toscana');await fill('provincia','firenze');await fill('comune','Milano');await submit();assert.equal(await page.inputValue('[name=comune]'),'Milano');assert.equal(await page.inputValue('[name=regione]'),'');assert.equal(await page.inputValue('[name=provincia]'),'');assert.deepEqual(await ids(),expected('milano'));assert.equal(new URL(page.url()).searchParams.get('regione'),null);});
 await scenario('D Firenze + riparazione, solo claim documentati',async()=>{await visit();await fill('comune','Firenze');await fill('servizio','riparazione');await submit();assert.deepEqual(await ids(),expected('firenze','riparazione'));assert.match(await page.textContent('#search-context'),/Riparazione/);});
 await scenario('E Nessuna città; conteggio generale e paginazione',async()=>{await visit();await submit();assert.deepEqual(await ids(),expected());assert.equal(await visibleCards().count(),12);await page.locator('#search-more').click();assert.equal(await visibleCards().count(),24);assert.equal((await ids()).length,expected().length);await page.reload({waitUntil:'networkidle'});assert.equal(await visibleCards().count(),24);});
 await scenario('F Zero corrispondenze; città e servizio dichiarati',async()=>{await visit();await fill('comune','Firenze');await fill('servizio','riparazione');await page.locator('.advanced-filters summary').click();await fill('q','zzzz-no-business-fixture-000');await submit();assert.equal((await ids()).length,0);assert.ok(await page.isVisible('#search-empty'));assert.match(await page.textContent('#search-empty-message'),/Firenze.*Riparazione/);assert.equal(await visibleCards().count(),0);});
 await scenario('G Azzera cinque filtri e tutti i parametri',async()=>{await visit();await page.locator('.advanced-filters summary').click();for(const [k,v] of [['regione','toscana'],['provincia','firenze'],['marca','Rolex'],['ruoloMarca','venduti'],['tipo','laboratorio'],['servizio','revisione']])await fill(k,v);await submit();await page.locator('#directory-search button[type=reset]').click();await page.waitForTimeout(80);assert.equal(new URL(page.url()).search,'');assert.deepEqual(await ids(),expected());for(const k of ['regione','provincia','marca','tipo','servizio','q','comune'])assert.equal(await page.inputValue(`[name=${k}]`),'');assert.equal(await page.inputValue('[name=ruoloMarca]'),'qualsiasi');});
 await scenario('I Homepage, GET con città e servizio',async()=>{await page.goto(base+'/',{waitUntil:'networkidle'});await page.fill('#hero-city','Firenze');await page.selectOption('#hero-service','riparazione');await page.locator('#cerca button[type=submit]').click();await page.waitForURL('**/cerca/**');await page.waitForFunction(()=>Array.isArray(window.__directoryResults));assert.deepEqual(await ids(),expected('firenze','riparazione'));await checkPosition();});
 await scenario('J Scheda → Indietro; stato, URL e scroll',async()=>{const before=page.url();const beforeIds=await ids();await page.locator('#search-results [data-business-id]:visible h3 a').first().click();await page.waitForURL('**/orologeria/**');await page.goBack({waitUntil:'networkidle'});await page.waitForFunction(()=>Array.isArray(window.__directoryResults));assert.equal(page.url(),before);assert.deepEqual(await ids(),beforeIds);await checkPosition();});
 await scenario('J2 Cronologia fra due ricerche',async()=>{await visit();await fill('comune','Firenze');await submit();const firenze=page.url();await fill('comune','Milano');await submit();await page.goBack();await page.waitForTimeout(100);assert.equal(page.url(),firenze);assert.deepEqual(await ids(),expected('firenze'));});
 await scenario('K Filtri avanzati apri/chiudi e chip singolo',async()=>{await visit();const summary=page.locator('.advanced-filters summary');assert.equal(await page.locator('.advanced-filters').evaluate(e=>e.open),false);await summary.click();await fill('marca','Rolex');await summary.click();await summary.click();assert.equal(await page.inputValue('[name=marca]'),'Rolex');await page.getByRole('button',{name:'Rimuovi filtro Rolex'}).click();assert.equal(await page.inputValue('[name=marca]'),'');});
 await scenario('L Autocomplete frecce, Invio, Escape, località non censita',async()=>{await visit();const input=page.locator('[name=comune]');await input.fill('firen');await input.press('ArrowDown');assert.ok(await input.getAttribute('aria-activedescendant'));await input.press('Enter');assert.equal(await input.inputValue(),'Firenze');await input.fill('mila');await input.press('Escape');assert.equal(await input.getAttribute('aria-expanded'),'false');await input.fill('Comune non censito fixture 000');await input.press('Enter');await page.waitForTimeout(100);assert.equal((await ids()).length,0);assert.match(await page.textContent('#search-empty-message'),/non è ancora censita/);});
 await scenario('Marchi: assistenza ufficiale non equivale a vendita o menzione',async()=>{await visit('/cerca/?localita=milano&marca=Rolex&ruoloMarca=assistenzaUfficiale');const wanted=data.attivita.filter(b=>b.localitaId==='milano'&&b.marchi.assistenzaUfficiale.some(m=>m.marca==='Rolex')).map(b=>b.id).sort();assert.deepEqual(await ids(),wanted);});
 await scenario('Deep link conflittuale e località non censita',async()=>{await visit('/cerca/?localita=milano&regione=toscana&provincia=firenze');assert.deepEqual(await ids(),expected('milano'));assert.equal(new URL(page.url()).searchParams.get('regione'),null);await visit('/cerca/?localitaNonCensita=Comune%20fixture%20000');assert.equal((await ids()).length,0);});
 for(const width of [1440,390,360])await scenario(`H Responsive ${width}, submit reale e screenshot`,async()=>{
   await page.setViewportSize({width,height:width===1440?900:844});await visit();await page.screenshot({path:`${folder}/after-search-${width}.png`});
   const positions=await page.evaluate(()=>({formTop:document.querySelector('#directory-search').getBoundingClientRect().top,submitTop:document.querySelector('#directory-search button[type=submit]').getBoundingClientRect().top,resultsTop:document.querySelector('#search-results').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth-innerWidth}));assert.equal(positions.overflow,0);
   await fill('comune','Firenze');const start=performance.now();await submit();const elapsed=performance.now()-start;assert.deepEqual(await ids(),expected('firenze'));const position=await checkPosition();await page.screenshot({path:`${folder}/after-submit-${width}.png`});
   report.measurements.push({width,positions,submitRoundTripMs:elapsed,afterSubmit:position,interactions:'focus città + testo + click Mostra risultati; servizio facoltativo',manualScrollAfterSubmit:0});
   await page.goto(base+'/',{waitUntil:'networkidle'});await page.screenshot({path:`${folder}/after-home-${width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
 });
 await scenario('Mappa facoltativa, inizializzazione e marker filtrati',async()=>{await visit('/cerca/?localita=firenze');assert.equal(await page.locator('.leaflet-container').count(),0);await page.locator('#map-details summary').click();await page.waitForSelector('.leaflet-container');assert.ok(await page.isVisible('#directory-map'));});
 await page.waitForLoadState('networkidle');
 await scenario('L2 Omonimi: fixture browser isolata, nessuna scelta silenziosa',async()=>{
   await page.route('**/cerca/',async route=>{
     const response=await route.fetch();let html=await response.text();
     const fixture=[{id:'fixture-a',comune:'Sant’Àgata',provincia:'Provincia A',regione:'Regione A'},{id:'fixture-b',comune:"Sant'Agata",provincia:'Provincia B',regione:'Regione B'}];
     const value=JSON.stringify(fixture).replaceAll('&','&amp;').replaceAll('"','&quot;');
     html=html.replace(/data-places="[^"]*"/,`data-places="${value}"`);await route.fulfill({response,body:html});
   });
   await visit();const input=page.locator('[name=comune]');await input.fill("SANT'AGATA");
   assert.equal(await page.locator('[role=option]').count(),2);
   assert.match(await page.textContent('[role=listbox]'),/Provincia A.*Regione A.*Provincia B.*Regione B/);
   const before=page.url();await input.press('Enter');assert.equal(page.url(),before);assert.equal(await input.getAttribute('data-localita'),null);
   assert.match(await page.textContent('.locality-hint'),/Più comuni/);await input.press('Escape');assert.equal(await input.getAttribute('aria-expanded'),'false');
   await page.unroute('**/cerca/');await visit();
 });
 const bench=await page.evaluate(()=>{const f=document.querySelector('#directory-search');const input=f.querySelector('[name=comune]');const times=[];for(let i=0;i<20;i++){input.value=i%2?'Milano':'Firenze';const start=performance.now();input.dispatchEvent(new Event('input',{bubbles:true}));times.push(performance.now()-start);}return {min:Math.min(...times),max:Math.max(...times),mean:times.reduce((a,b)=>a+b,0)/times.length};});report.filterBenchmarkMs=bench;
}catch(error){report.failure=String(error);console.error(error);process.exitCode=1;await page.screenshot({path:`${folder}/failure.png`}).catch(()=>{});}
finally{await writeFile(`${folder}/browser-report.json`,JSON.stringify(report,null,2));await browser.close();}
if(report.errors.length||report.networkFailures.length)console.log('Diagnostics',JSON.stringify({errors:report.errors,networkFailures:report.networkFailures},null,2));
const unexpectedNetwork=report.networkFailures.filter(r=>!(r.error==='net::ERR_ABORTED' && r.url.includes('.tile.openstreetmap.org/')));
if(report.errors.length || unexpectedNetwork.length)process.exitCode=1;
