/** Una tantum, mai in build/CI/browser. Cache ODbL persistente; revisione prima dell'applicazione.
 * npx tsx scripts/geocode-directory.ts --ids=de-marco-belluno,gioielleria-boni-belluno
 * npx tsx scripts/geocode-directory.ts --limit=400
 * Coordinate proposte NON applicate automaticamente. Non usare per enumerare indirizzi/POI.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { directorySchema } from '../site/src/lib/schema.ts';
import { compareGeocode, type GeocodeResult } from '../site/src/lib/geocoding.ts';
const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const ids = arg('ids')?.split(',');
const limit = Number(arg('limit') ?? 30);
if (!Number.isInteger(limit) || limit < 1 || limit > 400) throw new Error('limit deve essere 1–400');
const cacheDir = 'data/staging/fase18-geocode';
await mkdir(cacheDir, { recursive: true });
const headers = { 'User-Agent': 'Orologiai.it/18 (one-time address verification; https://www.orologiai.it; contact: acquistiscardi@gmail.com)', 'Accept': 'application/json', 'Accept-Language': 'it' };
async function cached(params: URLSearchParams) {
 const url = `https://nominatim.openstreetmap.org/search?${params}`;
 const key = createHash('sha256').update(url).digest('hex');
 const file = `${cacheDir}/${key}.json`;
 try { return JSON.parse(await readFile(file, 'utf8')) as { url: string; risultati: GeocodeResult[] }; }
 catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
 // Nessun parallelismo, 1 sola macchina; anche le richieste fallite non vengono ritentate.
 await new Promise(r => setTimeout(r, 1250));
 const response = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
 if (!response.ok) throw new Error(`Nominatim ${response.status}: interrompo il lotto, nessun retry automatico`);
 const record = { url, consultataIl: new Date().toISOString().slice(0,10), licenza: 'ODbL-1.0', attribuzione: '© OpenStreetMap contributors', risultati: await response.json() as GeocodeResult[] };
 await writeFile(file, JSON.stringify(record,null,2)+'\n', { flag: 'wx' });
 return record;
}
const params = () => new URLSearchParams({ format: 'jsonv2', addressdetails: '1', countrycodes: 'it', limit: '1' });
// Centri territoriali separati: mai trasformarli in marker di attività.
let centers: Record<string, unknown> = {};
try { centers = JSON.parse(await readFile(`${cacheDir}/centri.json`,'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
const centerIds = process.argv.includes('--all-centers') ? data.localita.map(p=>p.id) : ['belluno','firenze','roma','milano'];
for (const id of centerIds) {
 const city = data.localita.find(p => p.id === id)!;
 if (centers[id]) continue;
 const p = params(); p.set('city', city.comune); p.set('featureType','city');
 const record = await cached(p);const result = record.risultati[0];
 if (result && ['city','town','municipality','administrative'].includes(result.addresstype ?? result.type ?? '') && [result.address?.city,result.address?.town,result.address?.municipality].some(c => c?.toLowerCase()===city.comune.toLowerCase())) centers[id] = { nome: city.comune, lat: Number(result.lat), lon: Number(result.lon), fonte: record.url, verificataIl: new Date().toISOString().slice(0,10) };
}
await writeFile(`${cacheDir}/centri.json`, JSON.stringify(centers,null,2)+'\n');
if (process.argv.includes('--centers-only')) { console.log('Centri territoriali:',Object.keys(centers).length); process.exit(0); }
const targets = data.attivita.filter(b => b.posizione.indirizzo && !b.posizione.coordinate && (!ids || ids.includes(b.id))).slice(0,limit);
const proposals = [];
for (const b of targets) {
 const city = data.localita.find(p => p.id === b.localitaId)!;
 const p = params(); p.set('q', `${b.posizione.indirizzo}, ${city.comune}, Italia`);
 const record = await cached(p);
 const comparison = compareGeocode(b.posizione.indirizzo!,city.comune,b.posizione.cap,record.risultati[0]);
 const item = { id: b.id, indirizzo: b.posizione.indirizzo, comune: city.comune, ...comparison, fonte: record.url, risultato: record.risultati[0] ?? null };
 proposals.push(item);
 // Checkpoint progressivo: interrompere il processo non perde i risultati già scaricati.
 await writeFile(`${cacheDir}/proposte.json`,JSON.stringify(proposals,null,2)+'\n');
 console.log(b.id,comparison.esito,comparison.motivo);
}
console.log(`${proposals.length} proposte; ${proposals.filter(p=>p.esito==='corrispondenza').length} confrontabili. Nessuna coordinata applicata al catalogo.`);
