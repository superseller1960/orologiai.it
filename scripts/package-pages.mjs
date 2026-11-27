// Genera `.runtime/pages-build`: la build Astro completa più `_worker.js` (entrambe le API) e
// `_routes.json`, cioè l'artefatto autosufficiente da passare a `wrangler pages deploy` sul
// progetto Cloudflare Pages esistente. Produce anche il manifest SHA-256 (integrità del
// deployabile) e il manifest di upload Direct Upload di Pages (hash md5 per percorso).
// I bundle sono artefatti generati: non vanno committati, si rigenerano con `npm run package:pages`.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGINE = 'dist';
const USCITA = '.runtime/pages-build';
const MANIFEST = '.runtime/pages-build-sha256.json';
const MANIFEST_UPLOAD = '.runtime/pages-build-upload.json';

async function elenco(radice, dir = radice) {
  const out = [];
  for (const voce of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, voce.name);
    if (voce.isDirectory()) out.push(...await elenco(radice, abs));
    else out.push(path.relative(radice, abs).split(path.sep).join('/'));
  }
  return out;
}

const distInfo = await stat(ORIGINE).catch(() => null);
if (!distInfo?.isDirectory()) {
  console.error('dist/ non trovato: esegui prima `npm run build`.');
  process.exit(1);
}

await rm(USCITA, { recursive: true, force: true });
await mkdir(USCITA, { recursive: true });
await cp(ORIGINE, USCITA, { recursive: true });

await build({
  entryPoints: ['scripts/pages-worker.ts'],
  outfile: `${USCITA}/_worker.js`,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  minify: true,
  logLevel: 'info',
});

// Le due API e i vecchi percorsi territoriali invocano il worker; tutte le altre pagine
// restano statiche. I prefissi arrivano dallo stesso registro usato dal worker e dai test.
const redirect = JSON.parse(await readFile('data/anagrafica/redirect-territoriali.json', 'utf8'));
const redirectSchede = JSON.parse(await readFile('data/anagrafica/redirect-schede.json', 'utf8'));
const include = ['/api/orologiaio', '/api/posizione', '/api/fonte',
  ...new Set([...redirect.regole.map(({ da }) => `${da}*`), ...redirectSchede.regole.map(({ da }) => `${da}*`)])];
await writeFile(
  `${USCITA}/_routes.json`,
  `${JSON.stringify({ version: 1, include, exclude: [] }, null, 2)}\n`,
);

const files = (await elenco(USCITA)).sort();
const sha256 = {};
const upload = {};
let bytes = 0;
for (const rel of files) {
  const buf = await readFile(path.join(USCITA, rel));
  sha256[rel] = createHash('sha256').update(buf).digest('hex');
  upload[rel] = createHash('md5').update(buf).digest('hex');
  bytes += buf.length;
}

const dbRaw = await readFile('site/data/directory.json');
const db = JSON.parse(dbRaw);
const generatedAt = new Date().toISOString();
await writeFile(MANIFEST, `${JSON.stringify({
  generatedAt,
  artefatto: USCITA,
  file: files.length,
  bytes,
  database: {
    sha256: createHash('sha256').update(dbRaw).digest('hex'),
    attivita: db.attivita.length,
    localita: db.localita.length,
    fonti: db.fonti.length,
  },
  files: sha256,
}, null, 2)}\n`);
await writeFile(MANIFEST_UPLOAD, `${JSON.stringify({
  generatedAt,
  nota: 'Manifest Direct Upload Cloudflare Pages: percorso → hash md5 del contenuto',
  files: upload,
}, null, 2)}\n`);

console.log(`${USCITA} pronto: ${files.length} file, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Manifest integrità: ${MANIFEST}`);
console.log(`Manifest upload: ${MANIFEST_UPLOAD}`);
