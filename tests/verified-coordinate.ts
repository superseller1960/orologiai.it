import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isUsableCoordinate, type Business } from '../site/src/lib/schema.ts';
const review = JSON.parse(readFileSync('data/import/fase18-geocode-review.json','utf8')) as { nuove: {id:string;lat:number;lon:number;indirizzo:string}[] };
// I lotti storici lasciavano coordinate assenti: Fase18 consente solo gli esatti punti
// revisionati nel registro, non qualunque coordinata con un'etichetta di verifica.
export function assertAbsentOrReviewedCoordinate(b: Business) {
 if (!b.posizione.coordinate) return;
 // Fase 45: una geocodifica civico-per-civico verificata è ammessa quanto il registro Fase 18,
 // ma solo con provenienza, data, indirizzo confrontato e fonte OSM dedicata.
 const c = b.posizione.coordinate;
 if (c.provenienza === 'geocodifica-osm' && c.stato === 'verificata' && c.verificataIl && c.indirizzoConfrontato && c.fonti.some(id => id.startsWith('f45-geo-') || id === 'f46-ciardi-geo')) return;
 const approved = review.nuove.find(p=>p.id===b.id);
 assert.ok(approved,`${b.id}: punto non presente nella revisione Fase18`);
 assert.ok(isUsableCoordinate(b.posizione.coordinate));
 assert.equal(b.posizione.coordinate.lat,approved.lat);
 assert.equal(b.posizione.coordinate.lon,approved.lon);
 assert.equal(b.posizione.indirizzo,approved.indirizzo);
 assert.equal(b.posizione.coordinate.verificataIl,'2026-10-31');
 assert.ok(b.posizione.coordinate.fonti.includes('f18-geo-'+b.id));
 assert.ok(b.posizione.coordinate.indirizzoConfrontato?.includes(approved.indirizzo));
}
