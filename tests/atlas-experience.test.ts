import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
async function bundle(path:string){const result=await build({entryPoints:[path],bundle:true,format:'iife',platform:'browser',write:false,logLevel:'silent'});return result.outputFiles[0].text;}
const html=()=>readFileSync('dist/cerca/index.html','utf8');
test('Atlas UX: geolocation only after click; verified points first; no location coordinates in URL',async()=>{
 const vc=new VirtualConsole();const dom=new JSDOM(html(),{url:'https://www.orologiai.it/cerca/?localita=firenze',runScripts:'outside-only',virtualConsole:vc});const w=dom.window;
 let calls=0;Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(success:(p:{coords:{latitude:number;longitude:number}})=>void){calls++;success({coords:{latitude:43.7722403,longitude:11.2505794}});}}});
 try{w.eval(await bundle('site/src/scripts/search-ui.ts'));assert.equal(calls,0);const button=w.document.querySelector<HTMLButtonElement>('#atlas-nearby')!;assert.ok(button&&!button.hidden);button.click();assert.equal(calls,1);assert.equal(button.getAttribute('aria-pressed'),'true');
 const cards=Array.from(w.document.querySelectorAll<HTMLElement>('#search-results [data-business-id]')).filter(n=>!n.hidden);
 assert.ok(cards.length>0);assert.equal(cards[0].dataset.businessId,'ciardi-firenze');assert.ok(cards[0].querySelector('.distance')?.textContent?.includes('in linea d’aria'));
 assert.ok(cards.every(n=>n.querySelector('.result-place')?.textContent?.includes('Firenze')));assert.ok(!w.location.href.includes('43.772'));assert.ok(!w.location.href.includes('11.250'));
 button.click();assert.equal(button.getAttribute('aria-pressed'),'false');assert.ok(cards.every(n=>(n.querySelector<HTMLElement>('.distance')?.hidden??true)));}finally{w.close();}
});
test('Atlas UX: local favorites, two-profile comparison and deletion',async()=>{
 const dom=new JSDOM(html(),{url:'https://www.orologiai.it/cerca/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});const w=dom.window,doc=w.document;
 const dlg=doc.querySelector<HTMLDialogElement>('#atlas-favorites')!;if(typeof dlg.showModal!=='function')Object.defineProperty(dlg,'showModal',{value(){dlg.setAttribute('open','');}});
 try{w.eval(await bundle('site/src/scripts/saved-activities.ts'));
 const buttons=Array.from(doc.querySelectorAll<HTMLButtonElement>('#search-results [data-save-id]'));assert.ok(buttons.length>=2);buttons[0].click();buttons[1].click();assert.equal(JSON.parse(w.localStorage.getItem('orologiai-preferiti-v1')??'[]').length,2);
 doc.querySelector<HTMLButtonElement>('[data-atlas-favorites]')!.click();
 const wait=async(selector:string)=>{for(let i=0;i<50;i++){if(doc.querySelector(selector))return;await new Promise(r=>setTimeout(r,10));}throw Error('Missing '+selector);};
 await wait('[data-atlas-list] input');const checks=Array.from(doc.querySelectorAll<HTMLInputElement>('[data-atlas-list] input'));assert.equal(checks.length,2);checks.forEach(x=>x.click());const compare=doc.querySelector<HTMLButtonElement>('[data-atlas-compare]')!;assert.equal(compare.hidden,false);compare.click();await wait('.atlas-compare-card');assert.equal(doc.querySelectorAll('.atlas-compare-card').length,2);
 doc.querySelector<HTMLButtonElement>('[data-remove-saved]')!.click();assert.equal(JSON.parse(w.localStorage.getItem('orologiai-preferiti-v1')??'[]').length,1);
 }finally{w.close();}
});
