import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import {brandIndex,brandNames,brandOptions,slugify,directory} from '../site/src/lib/directory.ts';
import {brandKey} from '../site/src/lib/schema.ts';
import {cercaOrologiaioPreciso} from '../site/src/lib/assistant.ts';
const read=(path:string)=>readFileSync('dist'+path+'index.html','utf8');
const bundle=async(path:string)=>(await build({entryPoints:[path],bundle:true,format:'iife',platform:'browser',write:false,logLevel:'silent'})).outputFiles[0].text;
test('UX: complete brand atlas, unique options, original URLs and correct navigation',()=>{
 assert.equal(new Set(brandOptions.map(brandKey)).size,brandOptions.length);
 assert.equal(brandIndex.length,new Set(brandNames.map(brandKey)).size);
 const dom=new JSDOM(read('/marchi/'));
 try{const doc=dom.window.document;assert.equal(doc.querySelectorAll('[data-brand-key]').length,brandIndex.length);
 for(const brand of brandIndex){assert.ok(doc.querySelector('[data-brand-key="'+brand.key+'"]'));assert.ok(read(brand.href).includes('id="il-marchio"'));}
 for(const name of brandNames)assert.ok(read('/marchi/'+slugify(name)+'/').includes('id="il-marchio"'));
 assert.ok(read('/').includes('href="/marchi/"'));assert.ok(read('/').includes('class="atlas-ai-launch"'));assert.ok(!read('/').includes('class="atlas-favorites-launch"'));
 }finally{dom.window.close();}
});
test('UX: assistant first reply, document-only results, clarification and explicit nationwide expansion',async()=>{
 const errors:Error[]=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(read('/orologiaio/'),{url:'https://www.orologiai.it/orologiaio/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,doc=w.document;let calls=0;
 // Deliberately simulate an API that is unreachable. The strict local search must still work.
 w.fetch=(async()=>{calls++;throw Error('offline fixture');}) as typeof w.fetch;
 try{
 w.eval(await bundle('site/src/scripts/assistant-ui.ts'));
 const field=doc.querySelector<HTMLTextAreaElement>('#assistente-messaggio')!,form=doc.querySelector<HTMLFormElement>('#assistente-form')!;
 const chat=doc.querySelector('#assistente-chat')!;
 const last=()=>Array.from(chat.querySelectorAll('.msg-bot')).at(-1)!;
 const wait=async()=>{for(let i=0;i<100;i++){if(chat.getAttribute('aria-busy')==='false')return;await new Promise(r=>setTimeout(r,10));}throw Error('Chat did not complete');};
 const send=async(text:string)=>{field.value=text;field.dispatchEvent(new w.Event('input',{bubbles:true}));form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait();};
 await send('Devo revisionare un orologio automatico.');
 assert.match(last().textContent??'',/città|provincia/);assert.equal(last().querySelectorAll('.chat-result').length,0);
 await send('Firenze');
 const expected=cercaOrologiaioPreciso(directory,{localita:'firenze',servizio:'revisione',specializzazione:'automatici'}).risultati.map(r=>r.id);
 assert.ok(expected.length>0);assert.deepEqual(Array.from(last().querySelectorAll<HTMLElement>('.chat-result')).map(x=>x.dataset.businessId),expected);
 await send('Cerca in tutta Italia');
 const nationwide=cercaOrologiaioPreciso(directory,{servizio:'revisione',specializzazione:'automatici'},{nazionale:true}).risultati.map(r=>r.id);
 assert.deepEqual(Array.from(last().querySelectorAll<HTMLElement>('.chat-result')).map(x=>x.dataset.businessId),nationwide);
 assert.ok(calls===3);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('UX: embedded assistant replays first suggestion after lazy import',async()=>{
 const dom=new JSDOM(read('/cerca/'),{url:'https://www.orologiai.it/cerca/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window,doc=w.document;let calls=0;
 w.fetch=(async()=>{calls++;throw Error('offline fixture');}) as typeof w.fetch;
 try{w.eval(await bundle('site/src/scripts/assistant-lazy.ts'));const button=doc.querySelector<HTMLButtonElement>('#assistente [data-suggerimento]')!;button.click();
 for(let i=0;i<100;i++){if(calls===1&&doc.querySelector('#assistente-chat')?.getAttribute('aria-busy')==='false')break;await new Promise(r=>setTimeout(r,15));}
 assert.equal(calls,1);assert.ok(doc.querySelector('#assistente-chat .msg-utente'));assert.ok(doc.querySelectorAll('#assistente-chat .chat-result').length<=3);
 }finally{dom.window.close();}
});
