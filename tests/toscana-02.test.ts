import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { directorySchema } from '../site/src/lib/schema.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { importOsm } from '../site/src/lib/osm-import.ts';
import { duplicateSignals, findDuplicates } from '../site/src/lib/duplicates.ts';
import { execFileSync } from 'node:child_process';
// Regressioni della coorte pre-espansione nazionale (commit 27f927a): le nuove schede non cambiano
// i conteggi storici. I record sono letti dallo snapshot 3759dcb (stato immediatamente precedente
// alla fusione PR #6): le asserzioni esatte restano valide senza vietare incrementi documentati
// successivi, come già fatto per FB23 e N02; la conservazione del dataset corrente è coperta da
// tests/pr6-20261024.test.ts.
const coorte = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '27f927a:site/data/directory.json'], { encoding: 'utf8' })));
const publishedDirectory = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '3759dcb4fd7c4e200c6e00790e0f963326259779:site/data/directory.json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })));
const directory = {
 ...publishedDirectory,
 attivita: publishedDirectory.attivita.filter(b => coorte.attivita.some(x => x.id === b.id)),
 localita: publishedDirectory.localita.filter(p => coorte.localita.some(x => x.id === p.id)),
 fonti: publishedDirectory.fonti.filter(s => coorte.fonti.some(x => x.id === s.id)),
};
const reviewed=JSON.parse(await readFile('data/import/toscana-02-reviewed.json','utf8'));
const report=JSON.parse(await readFile('data/import/toscana-02-report.json','utf8'));
const raw=await readFile('data/staging/toscana-02-osm-source/extract.json','utf8');
const acquisition=JSON.parse(await readFile('data/staging/toscana-02-osm-source/acquisition.json','utf8'));
const area=JSON.parse(await readFile('data/import/pilot-toscana.json','utf8'));
const ids=new Set<string>(reviewed.attivita.map((b:{id:string})=>b.id));
const added=directory.attivita.filter(b=>ids.has(b.id));
test('mirror e otto record autorevoli invariati rispetto al commit iniziale',()=>{
 const base=JSON.parse(execFileSync('git',['show','6cb31fc:site/data/directory.json'],{encoding:'utf8'}));
 // Incremento 03: posizione e cronologia possono ricevere campi verificati; il resto resta identico.
 // Fase 3 (tutela legale): per ronchi-gioielli la descrizione e il testo storico sono stati qualificati
 // perché attribuivano una rivendita autorizzata Rolex senza una fonte del marchio. Il contenuto storico è
 // conservato integralmente e attribuito alla fonte: qui è fissato il testo corretto, così qualsiasi
 // ulteriore modifica fallisce il confronto come per tutti gli altri record.
 const testoCorrettoRonchi='Il vecchio sito la presentava come «primo rivenditore autorizzato Rolex in Italia dal 1929», con laboratorio di proprietà per manutenzioni e riparazioni straordinarie; l’autorizzazione non è riscontrata da fonti del marchio.';
 const norm=(x:any)=>({...x,posizione:undefined,attendibilita:{...x.attendibilita,cronologia:undefined}});
 for(const b of base.attivita){
  const attuale=directory.attivita.find(current=>current.id===b.id)!;
  if(b.id==='ronchi-gioielli'){
   assert.equal(attuale.descrizione,testoCorrettoRonchi,'la qualifica Fase 3 della descrizione è cambiata');
   assert.equal(attuale.storia.testo,testoCorrettoRonchi,'la qualifica Fase 3 della storia è cambiata');
   assert.deepEqual(norm({...attuale,descrizione:b.descrizione,storia:b.storia}),norm(b),'altri campi di ronchi alterati');
  }else{
   assert.deepEqual(norm(attuale),norm(b));
  }
 }
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
  // Confronto su ciò che la migrazione produce davvero: ogni record, fonte e località generati dallo
  // script devono esistere identici nel database corrente, fatta eccezione per posizione e cronologia
  // che l'incremento 03 e i lotti successivi arricchiscono con dati verificati. I record aggiunti da
  // incrementi successivi non fanno parte dell'output della migrazione e restano fuori dal confronto:
  // la riproducibilità dell'incremento 02 resta verificata per intero senza elenchi da aggiornare.
  const migrato=JSON.parse(await readFile(join(temp,'site/data/directory.json'),'utf8'));
  const keepAttivita=new Set<string>((migrato.attivita as any[]).map((b:any)=>b.id));
  const keepLocalita=new Set<string>((migrato.localita as any[]).map((p:any)=>p.id));
  const keepFonti=new Set<string>((migrato.fonti as any[]).map((f:any)=>f.id));
  // Fase 3 (tutela legale): la migrazione riproduce i testi originali dello specchio. Per ronchi-gioielli
  // descrizione e storia sono stati qualificati perché attribuivano una rivendita autorizzata Rolex senza fonte
  // del marchio: il testo corretto è fissato dal test "mirror e otto record autorevoli invariati". Qui quei due
  // campi sono esclusi dal confronto, come posizione e cronologia arricchite dall'incremento 03.
  const norm=(d:any)=>({...d,localita:d.localita.filter((p:any)=>keepLocalita.has(p.id)),fonti:d.fonti.filter((f:any)=>keepFonti.has(f.id)),attivita:d.attivita.filter((b:any)=>keepAttivita.has(b.id)).map((b:any)=>({...b,posizione:undefined,attendibilita:{...b.attendibilita,cronologia:undefined},...(b.id==='ronchi-gioielli'?{descrizione:undefined,storia:{...b.storia,testo:undefined}}:{})}))});
  assert.deepEqual(norm(migrato),norm(directory));
  assert.deepEqual(JSON.parse(await readFile(join(temp,'data/import/toscana-02-report.json'),'utf8')),report);
  assert.throws(()=>execFileSync(process.execPath,args,{cwd:temp,stdio:'pipe'}));
 } finally {await rm(temp,{recursive:true,force:true});}
});
test('bilancio A/B/C coerente e soli 25 nuovi record revisionati pubblicati nel lotto 02',()=>{
 const successivi = new Set(['lamberti-sesto','massari-campi','macchina-tempo-firenze','horamundi-firenze','horae-san-giovanni','fontana-bologna','orologica-torino','casa-cronometro-roma','soprana-vicenza']);
 assert.equal(added.length,25);assert.ok(directory.attivita.length >= 35);
 assert.equal(report.contatori.candidatiConNome,54);assert.equal(report.contatori.stagingB,28);assert.equal(report.contatori.esclusiC,3);
 assert.equal(report.decisioni.length,56);
 for(const d of report.decisioni){if(d.gruppo==='A')assert.ok(ids.has(d.id));else assert.ok(!directory.attivita.some(b=>b.id===d.id && !successivi.has(b.id)),`Decisione B/C ${d.id} non integrata nell'incremento 02`);}
 assert.equal(new Set(directory.attivita.map(b=>b.slug)).size,directory.attivita.length);
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
 assert.ok(searchDirectory(directory,{origine:{lat:43.77,lon:11.25},ordine:'distanza'}).filter(r=>!r.business.posizione.coordinate).every(r=>r.distanzaKm===null));
});
test('deduplicazione conserva sedi distinte e trova variazioni nome/indirizzo/telefono',()=>{
 const duplicates=findDuplicates(directory);
 assert.deepEqual(duplicates.map(d=>[d.primo,d.secondo].sort().join(' / ')).sort(),[
  'agnolucci-poggio / agnolucci-signa','astrua-genova / astrua-torino','monetti-napoli-brigida / monetti-napoli-mille','oreoro-colle / oreoro-poggibonsi','pisani-scandicci-maschera / pisani-scandicci-matteotti']);
 assert.ok(duplicates.every(d=>d.esito==='sedi-distinte'));
 for(const d of duplicates)assert.ok(directory.attivita.find(b=>b.id===d.primo)!.gruppoId,'Ogni coppia riconosciuta appartiene a un gruppo con più sedi');
 const a=structuredClone(added[0]),b=structuredClone(added[0]);b.id='record-test-separato';b.origine.idOriginale='diverso';b.nome='Pisani Gioielleria Piazza Matteotti';b.posizione.indirizzo='Piazza G. Matteotti 16';b.contatti.telefono='055250228';
 const signals=duplicateSignals(a,b);assert.ok(signals.some(s=>s.includes('Indirizzo')));assert.ok(signals.some(s=>s.includes('Telefono')));
 assert.equal(directory.attivita.filter(b=>b.id==='scardi').length,1);
});
test('storia assente consentita; storia presente richiede fonte e non testo inventato',()=>{
 const data=structuredClone(directory);const b=data.attivita.find(b=>b.id==='orogenesi-pontedera')!;
 assert.equal(b.storia.testo,null);assert.deepEqual(b.storia.fonti,[]);
 b.storia.testo='Test senza fonte';assert.equal(directorySchema.safeParse(data).success,false);
});
