import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenze,evidenzeAttivita} from '../site/src/lib/evidenze.ts';
import {directory} from '../site/src/lib/directory.ts';
import {servizioDocumentato} from '../site/src/lib/recommendations.ts';
test('Proof belongs to exactly one business; shared historical text cannot support recommendations',()=>{
 const seen=new Map<string,string>();
 for(const e of evidenze){
  assert.notEqual(e.tipoFonte,'mirror-storico');
  const k=e.url+'::'+e.estratto.trim().replace(/\s+/g,' ');
  const prior=seen.get(k);assert.ok(!prior||prior===e.attivitaId,e.url+' / '+e.attivitaId);
  seen.set(k,e.attivitaId);
 }
 const b=directory.attivita.find(b=>b.id==='bigalli')!;
 for(const id of ['riparazione','revisione','manutenzione','riparazione-meccanici','riparazione-automatici','riparazione-quarzo','pendoleria'] as const){
  assert.ok(servizioDocumentato(directory,b,id),id);
  assert.ok(evidenzeAttivita('bigalli').some(e=>e.servizio===id&&e.url==='https://www.bigallifirenze.com/en/info/5-repairs'));
 }
 assert.ok(!evidenzeAttivita('bigalli').some(e=>e.estratto.includes('Tornabuoni')));
});
