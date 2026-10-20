import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { directorySchema } from '../site/src/lib/schema.ts';
import { candidateSchema, importOsm } from '../site/src/lib/osm-import.ts';
const raw=await readFile('tests/fixtures/osm-pilot.json','utf8');
const area=JSON.parse(await readFile('data/import/pilot-toscana.json','utf8'));
const data=directorySchema.parse(JSON.parse(await readFile('site/data/directory.json','utf8')));
const args=[raw,area,data,'2026-10-16T00:00:00.000Z','https://example.org/synthetic-extract.json'] as const;
test('importa shop watches e craft watchmaker/clockmaker solo in staging',()=>{
 const before=JSON.stringify(data);const r=importOsm(...args);
 assert.equal(r.candidates.length,3);assert.equal(r.report.duplicatiIdIgnorati,1);assert.equal(r.report.scartati.length,4);assert.equal(r.report.pubblicati,0);
 assert.equal(JSON.stringify(data),before);r.candidates.forEach(c=>candidateSchema.parse(c));
 assert.equal(r.candidates[0].posizione.indirizzo,'Via Test 1');assert.equal(r.candidates[2].posizione.cap,null);assert.equal(r.candidates[2].contatti.email,null);
 assert.equal(r.candidates[1].serviziCandidati.length,0,'craft non prova specifici servizi');
});
test('conserva provenienza, hash, tag e attribuzione; nessuna autorizzazione dedotta',()=>{
 const r=importOsm(...args);assert.match(r.manifest.sha256,/^[0-9a-f]{64}$/);assert.equal(r.manifest.licenza,'ODbL-1.0');
 assert.equal(r.candidates[0].fonte.idOriginale,'node/1');assert.equal(r.candidates[0].fonte.timestampDati,'2026-10-16T00:00:00Z');
 assert.equal(r.candidates[0].tagOriginali.brand,'Marca Test');assert.equal(r.candidates[0].stato,'in-revisione');
});
test('deduplica ID e segnala candidati simili senza fonderli',()=>{
 const r=importOsm(...args);assert.ok(r.candidates[1].possibiliDuplicati.some(d => d.id === 'osm-node-1'));
 const d=structuredClone(data);d.attivita[0].nome='Attività Fittizia Test';
 const result=importOsm(raw,area,d,args[3],args[4]);assert.equal(result.candidates[0].possibiliDuplicati[0].id,'scardi');
});
test('estratti errati falliscono; coordinate mancanti richiedono revisione',()=>{
 assert.throws(()=>importOsm('{}',area,data,args[3],args[4]));
 const fixture=JSON.stringify({elements:[{type:'node',id:8,tags:{craft:'clockmaker',name:'Senza posizione test'}}]});
 const r=importOsm(fixture,area,data,args[3],args[4]);assert.equal(r.candidates[0].posizione.coordinate,null);assert.ok(r.candidates[0].avvisi.some(w=>w.includes('Coordinate mancanti')));
});
test('CLI crea rapporto separato, rifiuta sovrascrittura e database pubblico',async()=>{
 await mkdir('data/staging', { recursive: true });
 const out=await mkdtemp('data/staging/test-');await rm(out,{recursive:true});
 const published=await readFile('site/data/directory.json','utf8');
 const cli=['--import','tsx','scripts/import-osm.ts','--input','tests/fixtures/osm-pilot.json','--area','data/import/pilot-toscana.json','--out',out,'--source-url',args[4],'--imported-at',args[3]];
 try{execFileSync(process.execPath,cli,{encoding:'utf8'});const report=JSON.parse(await readFile(`${out}/report.json`,'utf8'));assert.equal(report.candidati,3);assert.equal(report.pubblicati,0);
 assert.throws(()=>execFileSync(process.execPath,cli,{stdio:'pipe'}));
 const invalid=[...cli];invalid[invalid.indexOf('--out')+1]='site/data';assert.throws(()=>execFileSync(process.execPath,invalid,{stdio:'pipe'}));
 assert.equal(await readFile('site/data/directory.json','utf8'),published);
 }finally{await rm(out,{recursive:true,force:true});}
});
