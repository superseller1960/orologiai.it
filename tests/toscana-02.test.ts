import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { directory } from '../site/src/lib/directory.ts';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { importOsm } from '../site/src/lib/osm-import.ts';
import { duplicateSignals, findDuplicates } from '../site/src/lib/duplicates.ts';
import { execFileSync } from 'node:child_process';
const reviewed=JSON.parse(await readFile('data/import/toscana-02-reviewed.json','utf8'));
const report=JSON.parse(await readFile('data/import/toscana-02-report.json','utf8'));
const raw=await readFile('data/staging/toscana-02-osm-source/extract.json','utf8');
const acquisition=JSON.parse(await readFile('data/staging/toscana-02-osm-source/acquisition.json','utf8'));
const area=JSON.parse(await readFile('data/import/pilot-toscana.json','utf8'));
const ids=new Set<string>(reviewed.attivita.map((b:{id:string})=>b.id));
const added=directory.attivita.filter(b=>ids.has(b.id));
test('mirror e otto record autorevoli invariati rispetto al commit iniziale',()=>{
 const base=JSON.parse(execFileSync('git',['show','6cb31fc:site/data/directory.json'],{encoding:'utf8'}));
 for(const b of base.attivita)assert.deepEqual(directory.attivita.find(current=>current.id===b.id),b);
 assert.equal(execFileSync('git',['diff','6cb31fc','--','public/','site/data/orologerie.json'],{encoding:'utf8'}),'');
});
test('estratto OSM reale: hash e 27 elementi riproducibili, non fixture sintetica',()=>{
 assert.equal(acquisition.stato,'scaricato');assert.equal(acquisition.elementi,27);
 assert.equal(createHash('sha256').update(raw).digest('hex'),report.osm.sha256);
 assert.equal(report.osm.sha256,acquisition.sha256);
 const source=JSON.parse(raw);assert.ok(source.osm3s.timestamp_osm_base);assert.ok(!raw.includes('SYNTHETIC TEST'));
 const baseline={...directory,attivita:directory.attivita.filter(b=>!ids.has(b.id))};
 const result=importOsm(raw,area,baseline,acquisition.completatoIl,acquisition.endpoint);
 assert.equal(result.candidates.length,25);assert.equal(result.report.scartati.length,2);assert.equal(result.report.pubblicati,0);
 assert.ok(result.candidates.some(b=>b.fonte.idOriginale==='node/11833445469'));
});
test('migrazione reale riproducibile dal commit iniziale e rifiuto doppia integrazione',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'orologiai-t02-'));
 try {
  for(const dir of ['site/data','data/import','data/staging/toscana-02-osm-source'])await mkdir(join(temp,dir),{recursive:true});
  await writeFile(join(temp,'site/data/directory.json'),execFileSync('git',['show','6cb31fc:site/data/directory.json']));
  for(const file of ['data/import/toscana-02-reviewed.json','data/import/pilot-toscana.json','data/staging/toscana-02-osm-source/extract.json','data/staging/toscana-02-osm-source/acquisition.json'])await writeFile(join(temp,file),await readFile(file));
  const args=[resolve('node_modules/tsx/dist/cli.mjs'),resolve('scripts/integrate-toscana-02.ts')];
  execFileSync(process.execPath,args,{cwd:temp,stdio:'pipe'});
  assert.deepEqual(JSON.parse(await readFile(join(temp,'site/data/directory.json'),'utf8')),directory);
  assert.deepEqual(JSON.parse(await readFile(join(temp,'data/import/toscana-02-report.json'),'utf8')),report);
  assert.throws(()=>execFileSync(process.execPath,args,{cwd:temp,stdio:'pipe'}));
 } finally {await rm(temp,{recursive:true,force:true});}
});
test('bilancio A/B/C coerente e soli 25 nuovi record revisionati pubblicati',()=>{
 assert.equal(added.length,25);assert.equal(directory.attivita.length,33);
 assert.equal(report.contatori.candidatiConNome,54);assert.equal(report.contatori.stagingB,28);assert.equal(report.contatori.esclusiC,3);
 assert.equal(report.decisioni.length,56);
 for(const d of report.decisioni){if(d.gruppo==='A')assert.ok(ids.has(d.id));else assert.ok(!directory.attivita.some(b=>b.id===d.id));}
 assert.equal(new Set(directory.attivita.map(b=>b.slug)).size,33);
 assert.equal(directory.attivita.filter(b=>b.origine.sistema==='legacy-8dc29a5').length,8);
});
test('ogni nuova attività ha fonti e verifica, senza inventare storia o coordinate',()=>{
 directorySchema.parse(directory);
 for(const b of added){assert.equal(b.attendibilita.stato,'fonti-verificate');assert.equal(b.attendibilita.verificataIl,'2026-10-16');assert.equal(b.slug,b.id);assert.equal(b.posizione.coordinate,null);
  for(const ref of b.attendibilita.fonti)assert.ok(directory.fonti.some(s=>s.id===ref));
  assert.equal(b.marchi.assistenzaUfficiale.length,0);
 }
 assert.equal(added.find(b=>b.id==='calistri-firenze')!.posizione.indirizzo,null);
 assert.equal(added.find(b=>b.id==='orogenesi-pontedera')!.storia.testo,null);
 const swatch=added.find(b=>b.id==='swatch-firenze-calzaiuoli')!;assert.equal(swatch.origine.idOriginale,'node/11833445469');assert.equal(swatch.origine.sistema,'osm');
});
test('ricerca reale per nome, comune, provincia, servizio, marchio e combinazioni',()=>{
 const search=(f:Parameters<typeof searchDirectory>[1])=>searchDirectory(directory,f).map(r=>r.business.id);
 assert.deepEqual(search({q:'Rutili Empoli'}),['rutili-empoli']);
 assert.equal(search({localita:'scandicci'}).length,3);
 assert.equal(search({provincia:'pisa'}).length,4);
 assert.ok(search({servizio:'batterie'}).includes('follie-oro-calenzano'));
 assert.deepEqual(search({provincia:'pisa',marca:'Tissot',ruoloMarca:'venduti'}),['gabbani-pontedera']);
 assert.deepEqual(search({localita:'figline-e-incisa-valdarno',marca:'Hamilton',ruoloMarca:'rivenditaUfficiale'}),['sottili-figline']);
 assert.deepEqual(search({marca:'Rolex',ruoloMarca:'assistenzaUfficiale'}),[]);
 assert.deepEqual(search({q:'nessuna-corrispondenza-1234567'}),[]);
 assert.ok(searchDirectory(directory,{origine:{lat:43.77,lon:11.25},ordine:'distanza'}).every(r=>r.distanzaKm===null));
});
test('deduplicazione conserva sedi distinte e trova variazioni nome/indirizzo/telefono',()=>{
 const duplicates=findDuplicates(directory);assert.equal(duplicates.length,3);assert.ok(duplicates.every(d=>d.esito==='sedi-distinte'));
 const a=structuredClone(added[0]),b=structuredClone(added[0]);b.id='record-test-separato';b.origine.idOriginale='diverso';b.nome='Pisani Gioielleria Piazza Matteotti';b.posizione.indirizzo='Piazza G. Matteotti 16';b.contatti.telefono='055250228';
 const signals=duplicateSignals(a,b);assert.ok(signals.some(s=>s.includes('Indirizzo')));assert.ok(signals.some(s=>s.includes('Telefono')));
 assert.equal(directory.attivita.filter(b=>b.id==='scardi').length,1);
});
test('storia assente consentita; storia presente richiede fonte e non testo inventato',()=>{
 const data=structuredClone(directory);const b=data.attivita.find(b=>b.id==='orogenesi-pontedera')!;
 assert.equal(b.storia.testo,null);assert.deepEqual(b.storia.fonti,[]);
 b.storia.testo='Test senza fonte';assert.equal(directorySchema.safeParse(data).success,false);
});
