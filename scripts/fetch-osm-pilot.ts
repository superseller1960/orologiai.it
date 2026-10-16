import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const output = 'data/staging/toscana-02-osm-source';
const endpoint = 'https://overpass-api.de/api/interpreter';
const query = await readFile('data/import/pilot.overpass', 'utf8');
await mkdir(output, { recursive: false });
await writeFile(`${output}/query.overpass`, query, { flag: 'wx' });
const started = new Date().toISOString();
try {
  const response = await fetch(endpoint, {
    method: 'POST', body: new URLSearchParams({ data: query }),
    headers: { 'User-Agent': 'OrologiaiDirectoryPilot/0.2 (https://github.com/superseller1960/orologiai.it)', Accept: 'application/json' },
    signal: AbortSignal.timeout(65000),
  });
  if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
  const raw = await response.text();
  const json = JSON.parse(raw);
  if (!Array.isArray(json.elements) || json.remark) throw new Error(`Estratto incompleto: ${json.remark ?? 'elements assente'}`);
  await writeFile(`${output}/extract.json`, raw, { flag: 'wx' });
  await writeFile(`${output}/acquisition.json`, JSON.stringify({ stato: 'scaricato', endpoint, iniziatoIl: started, completatoIl: new Date().toISOString(), sha256: createHash('sha256').update(raw).digest('hex'), query: 'query.overpass', estratto: 'extract.json', elementi: json.elements.length, licenza: 'ODbL-1.0', attribuzione: '© OpenStreetMap contributors', nota: 'Una richiesta bbox pilota; non confine amministrativo regionale. Dati grezzi, non pubblicati.' }, null, 2) + '\n');
  console.log(`Estratto reale salvato: ${json.elements.length} elementi in ${output}`);
} catch (error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  await writeFile(`${output}/acquisition.json`, JSON.stringify({ stato: 'fallito', endpoint, iniziatoIl: started, errore: message, tentativi: 1, nota: 'Nessuna importazione simulata. Nessun retry automatico.' }, null, 2) + '\n');
  throw error;
}
