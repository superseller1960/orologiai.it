// Applica esclusivamente la revisione registrata, dai risultati CLI salvati. Nessuna rete.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const date='2026-10-31',d=JSON.parse(readFileSync('site/data/directory.json'));
const existing=JSON.parse(readFileSync('data/staging/fase18-geocode/proposte-esistenti.json'));
const additional=JSON.parse(readFileSync('data/staging/fase18-geocode/proposte.json'));
const proposed=[...existing,...additional];
// Risultati che identificano un'altra insegna/POI o un museo: non promuovere neppure con civico uguale.
const rejected=new Set(['monetti-napoli-brigida','pasetto-torino','gioielleria-orafi-italiani-rovigo','gioielleria-rabino-cuneo','casciola-gioielli-cuneo','orologeria-clementi-bolzano','ferro-gioielli-1954-este','orologeria-nozzetti-mazara-del-vallo','laboratorio-orologeria-maicol-oristano']);
// Le nuove verifiche Fase18 restano distinte dai lotti storici.
const accepted=[];
for(const p of proposed){
 if(p.esito!=='corrispondenza'||rejected.has(p.id))continue;
 const b=d.attivita.find(b=>b.id===p.id);if(!b)throw Error('Scheda assente '+p.id);
 const r=p.risultato, id='f18-geo-'+b.id;
 if (b.posizione.indirizzo!==p.indirizzo) throw Error('Indirizzo cambiato: revisionare '+b.id);
 if(b.posizione.coordinate){
  if(b.posizione.coordinate.lat!==Number(r.lat)||b.posizione.coordinate.lon!==Number(r.lon)||!b.posizione.coordinate.fonti.includes(id))throw Error('Punto modificato dopo revisione: '+b.id);
  accepted.push({id:b.id,osm:`${r.osm_type}/${r.osm_id}`,indirizzo:p.indirizzo,riscontro:r.address,lat:Number(r.lat),lon:Number(r.lon)});
  continue;
 }
 const source={id,tipo:'osm',url:p.fonte,titolo:`OpenStreetMap: confronto civico ${b.posizione.indirizzo}, ${p.comune}`,consultataIl:date,percorsoArchivio:null,licenza:'ODbL-1.0 · © OpenStreetMap contributors'};
 if(!d.fonti.some(s=>s.id===id))d.fonti.push(source);
 b.posizione.coordinate={lat:Number(r.lat),lon:Number(r.lon),fonti:[...b.posizione.fonti,id],provenienza:'geocodifica-osm',verificataIl:date,indirizzoConfrontato:`${b.posizione.indirizzo}, ${p.comune}${b.posizione.cap?' '+b.posizione.cap:''} ↔ ${r.address.house_number}, ${r.address.road??r.address.pedestrian}, ${p.comune}; ${r.osm_type}/${r.osm_id}`,stato:'verificata'};
 b.attendibilita.cronologia.push({data:date,azione:'Fase18: coordinata di indirizzo confrontata per strada, civico, comune e CAP disponibile; non un sopralluogo.',fonti:[...b.posizione.fonti,id]});
 accepted.push({id:b.id,osm:`${r.osm_type}/${r.osm_id}`,indirizzo:p.indirizzo,riscontro:r.address,lat:Number(r.lat),lon:Number(r.lon)});
}
const centers=JSON.parse(readFileSync('site/data/map-centers.json'));
// Gli altri territori usano solo un riferimento con comune esplicitamente corrispondente,
// tratto dai risultati già raccolti. Serve a inquadrare l'area, MAI a creare un marker.
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
for(const p of proposed){
 const b=d.attivita.find(b=>b.id===p.id),r=p.risultato;if(!b||!r?.address||centers[b.localitaId])continue;
 if(r.address.country_code!=='it'||![r.address.city,r.address.town,r.address.village,r.address.municipality].some(v=>v&&norm(v)===norm(p.comune)))continue;
 centers[b.localitaId]={nome:p.comune,lat:Number(r.lat),lon:Number(r.lon),fonte:p.fonte,verificataIl:date};
}
writeFileSync('site/data/map-centers.json',JSON.stringify(centers,null,2)+'\n');
writeFileSync('site/data/directory.json',JSON.stringify(d,null,2)+'\n');
const before=JSON.parse(readFileSync('data/staging/fase18-geocode/catalog-before.json'));
const report={data:date,prima:before.attivita.filter(b=>b.posizione.coordinate?.stato==='verificata').length,dopo:d.attivita.filter(b=>b.posizione.coordinate?.stato==='verificata').length,nuove:accepted,esclusiPerIdentita:[...rejected],nonVerificateBelluno:['de-marco-belluno','gioielleria-boni-belluno','gior-gioielli-belluno','vicentini-gioielli-belluno'],motivoBelluno:'Geocodifica indirizzo senza civico o comune discordante; POI nominativi OSM privi di civico e/o in strada diversa non sufficienti. Nessun marker arbitrario.',centriTerritoriali:Object.keys(centers).length};
writeFileSync('data/import/fase18-geocode-review.json',JSON.stringify(report,null,2)+'\n');
// Offerta del sottoinsieme geografico derivato in formato machine-readable (ODbL §4.6).
const geographic={licenza:'ODbL-1.0',attribuzione:'© OpenStreetMap contributors',copyright:'https://www.openstreetmap.org/copyright',policy:'https://operations.osmfoundation.org/policies/nominatim/',data:date,nota:'Coordinate di indirizzo, non sopralluoghi. Centri territoriali non sono sedi di attività.',attivita:d.attivita.filter(b=>b.posizione.coordinate).map(b=>({id:b.id,indirizzo:b.posizione.indirizzo,coordinate:b.posizione.coordinate,fonti:d.fonti.filter(s=>b.posizione.coordinate.fonti.includes(s.id)).map(s=>({id:s.id,url:s.url,licenza:s.licenza}))})),centri:centers};
writeFileSync('site/assets/coordinate-osm.json',JSON.stringify(geographic,null,2)+'\n');
const manifest={licenza:'ODbL-1.0',attribuzione:'© OpenStreetMap contributors',files:{}};
for(const file of readdirSync('data/staging/fase18-geocode').filter(f=>f.endsWith('.json')&&f!=='manifest.json'))manifest.files[file]=createHash('sha256').update(readFileSync('data/staging/fase18-geocode/'+file)).digest('hex');
writeFileSync('data/staging/fase18-geocode/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Coordinate',report.prima,'→',report.dopo,'centri',report.centriTerritoriali);
