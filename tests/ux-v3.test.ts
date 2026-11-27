import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {directory, placeOf} from '../site/src/lib/directory.ts';
import {directionsUrl} from '../site/src/lib/business-presentation.ts';
import {isUsableCoordinate} from '../site/src/lib/schema.ts';
test('UX: tutte le destinazioni usano coordinate verificate o indirizzo completo',()=>{
 for(const b of directory.attivita){
  const place=placeOf(b), href=directionsUrl(b,place.comune), c=b.posizione.coordinate;
  if(!isUsableCoordinate(c)&&!b.posizione.indirizzo){assert.equal(href,null,b.id);continue;}
  assert.ok(href,b.id);const url=new URL(href);
  assert.equal(url.origin,'https://www.google.com',b.id);assert.equal(url.searchParams.get('api'),'1',b.id);
  if(isUsableCoordinate(c)){assert.equal(url.pathname,'/maps/dir/',b.id);assert.equal(url.searchParams.get('destination'),`${c.lat},${c.lon}`,b.id);}
  else {assert.equal(url.pathname,'/maps/search/',b.id);assert.ok(url.searchParams.get('query')?.includes(b.posizione.indirizzo!),b.id);assert.ok(url.searchParams.get('query')?.includes(place.comune),b.id);if(b.posizione.cap)assert.ok(url.searchParams.get('query')?.includes(b.posizione.cap),b.id);}
 }
});
test('UX: scheda Ciardi conserva sezioni, fonti e link esatti',()=>{
 const html=readFileSync('dist/orologeria/ciardi-firenze/index.html','utf8');
 for(const id of ['panoramica','servizi-scheda','marchi-scheda','contatti-scheda','fonti'])assert.ok(html.includes(`id="${id}"`),id);
 const doc=new JSDOM(html).window.document;
 for(const name of ['IWC','Jaeger-LeCoultre','Baume & Mercier','Vulcain','Panerai','055 217900','Via delle Belle Donne'])assert.ok(doc.body.textContent?.includes(name),name);
 assert.ok(doc.querySelector('details[data-map-src]')?.getAttribute('data-map-src')?.includes('marker=43.7722403%2C11.2505794'));
 assert.ok(doc.querySelector('[data-share-button]'));
 assert.ok(doc.querySelector('#fonti'));
 assert.ok(html.includes('destination=43.7722403%2C11.2505794'));
 assert.ok(html.includes('application/ld+json'));
 const home=readFileSync('dist/index.html','utf8');for(const marker of ['hero-brand','hero-directory-stats','home-quick-start','id="botteghe"'])assert.ok(home.includes(marker),marker);
});
