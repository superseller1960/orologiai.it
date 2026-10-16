import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { directorySchema } from '../site/src/lib/schema.ts';
import { importOsm } from '../site/src/lib/osm-import.ts';
const { values } = parseArgs({ options: { input: { type: 'string' }, area: { type: 'string' }, out: { type: 'string' }, 'source-url': { type: 'string' }, 'imported-at': { type: 'string' } }, strict: true });
if (!values.input || !values.area || !values.out || !values['source-url']) throw new Error('Uso: npm run import:osm -- --input extract.json --area config.json --out data/staging/lotto --source-url https://fonte/estratto');
const output = resolve(values.out);
const allowed = resolve('data/staging') + '/';
if (!output.startsWith(allowed)) throw new Error('Output consentito soltanto sotto data/staging/; mai nel database pubblico.');
if ((await stat(values.input)).size > 50 * 1024 * 1024) throw new Error('Estratto oltre 50 MiB: suddividere offline, non usare questa CLI per PBF nazionali.');
const raw = await readFile(values.input, 'utf8');
const area = JSON.parse(await readFile(values.area, 'utf8'));
const published = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const result = importOsm(raw, area, published, values['imported-at'] ?? new Date().toISOString(), values['source-url']);
await mkdir(resolve('data/staging'), { recursive: true });
await mkdir(output); // An existing batch must never be overwritten.
for (const [name, content] of Object.entries({ manifest: result.manifest, candidates: result.candidates, report: result.report })) await writeFile(`${output}/${name}.json`, JSON.stringify(content, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result.report, null, 2));
