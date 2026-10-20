import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { directorySchema } from '../site/src/lib/schema.ts';
import { integrateReviewedBatch } from '../site/src/lib/reviewed-import.ts';

const { values } = parseArgs({ options: {
  input: { type: 'string' }, apply: { type: 'boolean', default: false }, report: { type: 'string' },
}, strict: true });
if (!values.input) throw new Error('Uso: npm run integrate:reviewed -- --input data/import/lotto-reviewed.json [--apply] [--report data/reports/lotto.json]');
const reportPath = values.report ? resolve(values.report) : null;
if (reportPath && (!reportPath.startsWith(resolve('data/reports') + '/') || !reportPath.endsWith('.json'))) throw new Error('I report si salvano soltanto in data/reports/*.json');
const path = 'site/data/directory.json';
const originale = await readFile(path, 'utf8');
const input = await readFile(values.input, 'utf8');
const result = integrateReviewedBatch(directorySchema.parse(JSON.parse(originale)), JSON.parse(input));
const report = { ...result.report, applicato: values.apply, inputSha256: createHash('sha256').update(input).digest('hex') };
const contenuto = JSON.stringify(result.directory, null, 2) + '\n';
if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true });
  // Nessun report di un precedente passaggio viene sovrascritto.
  await writeFile(reportPath, JSON.stringify({ ...report, applicato: false }, null, 2) + '\n', { flag: 'wx' });
}
if (values.apply && contenuto !== originale) {
  if (await readFile(path, 'utf8') !== originale) throw new Error('Dataset cambiato durante la revisione: ripetere l’anteprima.');
  const temporaneo = `${path}.${process.pid}.tmp`;
  await writeFile(temporaneo, contenuto, { flag: 'wx' });
  await rename(temporaneo, path);
}
if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
