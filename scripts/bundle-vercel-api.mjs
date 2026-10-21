// Genera le funzioni Vercel in api/*.js come moduli ESM autosufficienti.
// Motivo: la build delle funzioni Vercel (runtime Node, "fluid") include solo la entry compilata
// e non traccia né include i file locali importati (verificato con diagnosi su preview):
// ogni import residuo fallisce a runtime con FUNCTION_INVOCATION_FAILED.
// I bundle sono versionati perché la discovery delle funzioni avviene PRIMA del build command;
// vengono comunque rigenerati a ogni `npm run build`, quindi il contenuto deployato è sempre fresco.
// Le sorgenti vivono in site/src/api/*.ts e condividono la logica con functions/api/*.ts (Cloudflare).
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

const voci = [
  { sorgente: 'site/src/api/orologiaio.ts', uscita: 'api/orologiaio.js' },
  { sorgente: 'site/src/api/posizione.ts', uscita: 'api/posizione.js' },
];

mkdirSync('api', { recursive: true });

for (const { sorgente, uscita } of voci) {
  await build({
    entryPoints: [sorgente],
    outfile: uscita,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    mainFields: ['module', 'main'],
    logLevel: 'info',
  });
}
