import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {directory,businessUrl} from '../site/src/lib/directory.ts';
import {isUsableCoordinate} from '../site/src/lib/schema.ts';
test('Official coordinate: Bigalli has a documented exact point and retains its original address',()=>{
 const b=directory.attivita.find(x=>x.id==='bigalli')!;
 assert.equal(b.posizione.indirizzo,'Via Maso Finiguerra 4/A–4/B');
 assert.ok(isUsableCoordinate(b.posizione.coordinate));
 assert.equal(b.posizione.coordinate.provenienza,'fonte-ufficiale');
 assert.ok(directory.fonti.some(s=>b.posizione.coordinate!.fonti.includes(s.id)&&s.url==='https://www.bigallifirenze.com/it/contattaci'));
 const html=readFileSync('dist'+businessUrl(b)+'index.html','utf8');
 assert.ok(html.includes('Coordinate pubblicate dalla fonte ufficiale'));
 assert.ok(html.includes('destination=43.774012595912%2C11.245216926754'));
});
test('Owner photos: voluntary submission, required authorization, no automatic upload',()=>{
 const dom=new JSDOM(readFileSync('dist/partecipa/index.html','utf8'));
 try{const d=dom.window.document;assert.ok(d.querySelector('#fotografie'));assert.ok(d.querySelector('#atlas-photo-form input[name="permission"][required]'));assert.equal(d.querySelector('#atlas-photo-form input[type="file"]'),null);assert.ok(readFileSync('dist/orologeria/ciardi-firenze/index.html','utf8').includes('/partecipa/?scheda=ciardi-firenze#fotografie'));}finally{dom.window.close();}
});
test('Brand editorial histories and archive image attribution',()=>{
 for(const slug of ['rolex','hamilton','longines','omega','tissot','seiko','cartier','breitling','tag-heuer','citizen','zenith','mido','rado','audemars-piguet']){
 const h=readFileSync('dist/marchi/'+slug+'/index.html','utf8');assert.ok(h.includes('Storia sul sito ufficiale'),slug);
 }
 const dom=new JSDOM(readFileSync('dist/marchi/panerai/index.html','utf8'));
 try{const d=dom.window.document;const img=d.querySelector('[data-archive-src]');assert.ok(img);assert.equal(img.getAttribute('src'),null);assert.ok(d.querySelector('.brand-archive-photo a[href="https://creativecommons.org/publicdomain/mark/1.0/"]'));}finally{dom.window.close();}
});
