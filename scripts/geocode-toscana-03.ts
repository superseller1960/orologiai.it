/**
 * Geocodifica controllata per l'incremento 03 (Fase 5).
 *
 * Regole rispettate (vedi docs/LICENZA-OSM.md):
 * - nessuna interrogazione massiva: solo gli indirizzi documentati dell'incremento (14),
 *   una richiesta per attività, con attesa di 1,2 s tra una richiesta e l'altra;
 * - User-Agent identificativo, come richiesto dalla policy Nominatim;
 * - risultati grezzi conservati con hash in data/staging/toscana-03-geocode/ per la
 *   riproducibilità; nessun campo viene copiato ciecamente nel dataset pubblico:
 *   ogni coordinata pubblicata passa da un confronto manuale indirizzo ↔ risultato.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const targetsSchema = z.array(z.object({
  id: z.string().min(1), indirizzo: z.string().min(1), cap: z.string().nullable(), comune: z.string().min(1),
})).min(1).max(20);
const targets = targetsSchema.parse(JSON.parse(await readFile('data/import/toscana-03-geocode-targets.json', 'utf8')));
const outDir = 'data/staging/toscana-03-geocode';
await mkdir(outDir, { recursive: true });
const results: unknown[] = [];
for (const t of targets) {
  const q = [t.indirizzo, t.cap, t.comune, 'Italia'].filter(Boolean).join(', ');
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '1', countrycodes: 'it' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'orologiai-it/0.3 (geocodifica di verifica; https://orologiai.it/)' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} per ${t.id}`);
  const json = await res.json() as { display_name?: string; lat?: string; lon?: string }[];
  results.push({ target: t, query: q, risultati: json });
  console.log(t.id, '→', json[0] ? `${json[0].lat},${json[0].lon} — ${json[0].display_name}` : 'nessun risultato');
  await new Promise(r => setTimeout(r, 1200));
}
const payload = JSON.stringify({
  lotto: 'qualita-mappa-03-20261016', fornitore: 'Nominatim (OpenStreetMap Foundation)',
  policy: 'https://operations.osmfoundation.org/policies/nominatim/', raccoltaIl: '2026-10-16',
  nota: 'Geocodifica di sola verifica: le coordinate pubblicate derivano da un confronto manuale tra indirizzo ufficiale e risultato, mai da un accettazione automatica.',
  results,
}, null, 2) + '\n';
const dest = `${outDir}/results.json`;
await writeFile(dest, payload, { flag: 'wx' });
await writeFile(`${outDir}/manifest.json`, JSON.stringify({
  versione: 1, sha256: createHash('sha256').update(payload).digest('hex'),
  licenza: 'ODbL-1.0', attribuzione: '© OpenStreetMap contributors',
}, null, 2) + '\n', { flag: 'wx' });
console.log(`Risultati scritti in ${dest} (${targets.length} interrogazioni).`);
