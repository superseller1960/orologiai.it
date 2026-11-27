// Checkpoint verificabile della Fase 32.
// Elenca con sha256 i file che compongono catalogo, import, registro, anagrafica,
// script, test, codice del Worker e configurazione Pages. Nessun segreto.
// Uso: node scripts/fase32-checkpoint.mjs [--out data/checkpoint/FASE32-CHECKPOINT.txt]
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const RADICE = process.cwd();
const ESCLUSI = /(^|\/)(node_modules|\.git|\.astro|\.runtime|dist|\.wrangler)(\/|$)|(^|\/)\.env|\.dev\.vars$|(^|\/)\.env\./;

function cammina(dir) {
  const out = [];
  let voci;
  try { voci = readdirSync(join(RADICE, dir), { withFileTypes: true }); } catch { return out; }
  for (const voce of voci) {
    const rel = join(dir, voce.name);
    if (ESCLUSI.test(rel)) continue;
    if (voce.isDirectory()) out.push(...cammina(rel));
    else out.push(rel);
  }
  return out;
}

const GRUPPI = [
  ['Catalogo', ['site/data/directory.json']],
  ['Import', cammina('data/import').sort()],
  ['Registro candidati', ['data/fase31/registro-candidati.json']],
  ['Anagrafica', cammina('data/anagrafica').sort()],
  ['Script', cammina('scripts').sort()],
  ['Test', cammina('tests').sort()],
  ['Worker e funzioni', [...cammina('functions').sort(), ...cammina('site/functions').sort()]],
  ['Configurazione Pages', [
    'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.tools.json', 'vercel.json',
    ...cammina('site').filter(f => /(^|\/)(wrangler\.(toml|jsonc?)|astro\.config\.|package\.json)$/.test(f)).sort(),
  ]],
  ['Libreria applicativa', cammina('site/src/lib').sort()],
];

const sha = (rel) => createHash('sha256').update(readFileSync(join(RADICE, rel))).digest('hex');
const righe = [
  'OROLOGIAI.IT — CHECKPOINT FASE 32',
  `Generato: ${new Date().toISOString()} (locale ${process.env.TZ ?? 'UTC'})`,
  'Metodo: sha256 di ogni file sotto elenco; nessun segreto incluso (esclusi .env, .dev.vars, node_modules, build).',
  'Nota: il Git HEAD non è usato come versione di riferimento.',
  '',
];
const totale = new Map();
for (const [nome, files] of GRUPPI) {
  const unici = [...new Set(files.filter(f => { try { return statSync(join(RADICE, f)).isFile(); } catch { return false; } }))];
  righe.push(`## ${nome} (${unici.length} file)`);
  for (const f of unici) {
    const h = sha(f);
    totale.set(f, h);
    righe.push(`${h}  ${statSync(join(RADICE, f)).size.toString().padStart(9)}  ${f}`);
  }
  righe.push('');
}
const impronta = createHash('sha256')
  .update([...totale.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, h]) => `${f}:${h}`).join('\n'))
  .digest('hex');
righe.push(`File registrati: ${totale.size}`);
righe.push(`Impronta checkpoint: ${impronta}`);
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'data/checkpoint/FASE32-CHECKPOINT.txt';
writeFileSync(out, righe.join('\n') + '\n');
console.log(JSON.stringify({ out, file: totale.size, impronta }));
