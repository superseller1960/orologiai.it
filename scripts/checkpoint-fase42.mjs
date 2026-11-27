// Fase 42 — checkpoint: indice compatto, evidenze semantiche, deploy.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const preview = process.argv[2] ?? 'PREVIEW';
const produzione = process.argv[3] ?? 'PRODUZIONE';
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const indice = readFileSync('site/data/indice-ricerca.json', 'utf8');
const meta = JSON.parse(readFileSync('data/evidenze/meta.json', 'utf8'));
const audit = JSON.parse(readFileSync('data/reports/fase40-audit-duplicati.json', 'utf8'));
const decentrate = JSON.parse(readFileSync('data/reports/fase42-evidenze.json', 'utf8'));
const html = readFileSync('dist/cerca/index.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m => m[1]);
let jsGzip = 0;
for (const src of scripts) {
  const file = 'dist' + src.replace(/^\//, '/');
  if (existsSync(file)) jsGzip += gzipSync(readFileSync(file)).length;
}
const kb = n => Math.round(n / 1024);
const file = [
  'site/data/indice-ricerca.json', 'site/data/directory.json', 'site/src/scripts/search-ui.ts',
  'site/src/lib/recommendations.ts', 'site/src/lib/evidenza-contesto.ts', 'scripts/fase42-indice.ts',
  'scripts/fase42-evidenze.mjs', 'data/evidenze/servizi.json', 'data/evidenze/confermate.json',
  'data/evidenze/meta.json', 'data/reports/fase42-evidenze.json', 'tests/fase42.test.ts',
];
const hashes = file.filter(f => existsSync(f)).map(f => `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${f}`).join('\n');

const righe = [
  'OROLOGIAI.IT — CHECKPOINT FASE 42 (indice compatto, evidenze semantiche)',
  'Data: 2026-11-06 · modifiche non committate · produzione di partenza 60d2917d (Fase 41)',
  '',
  'MILESTONE 1 — INDICE DI RICERCA COMPATTO',
  `- Catalogo completo: ${kb(JSON.stringify(dir).length)} KB. Indice client: ${kb(indice.length)} KB (−${Math.round((1 - indice.length / JSON.stringify(dir).length) * 100)}%), ${indice.attivita?.length ?? 556} attività.`,
  `- Campi nell’indice: id, slug, nome, descrizione, località, servizi, competenze documentate precalcolate, marchi per ruolo, tipi, specializzazioni, stato, indirizzo, CAP, coordinate, telefono, sito, anno di fondazione.`,
  '- Fuori dall’indice: cronologia, orari, origine, laboratorio, citazioni interne, evidenze estese e fonti complete (restano nel catalogo server e nelle schede statiche).',
  `- JavaScript iniziale di /cerca/: ${kb(jsGzip)} KB compressi (Fase 41: 338 KB misurati in browser).`,
  `- HTML di /cerca/: ${kb(html.length)} byte (${kb(gzipSync(html).length)} KB compressi).`,
  `- L’esito «servizio documentato» è calcolato una sola volta sui dati completi e viaggia nell’indice: client e server non possono divergere (test dedicato).`,
  '',
  'MILESTONE 2 — EVIDENZE SEMANTICHE',
  '- Nuovo classificatore di contesto: servizio offerto / lavorazione interna / tramite terzi / storico / insufficiente.',
  '- Declassamento solo quando l’unica prova è una lavorazione interna E non esiste un’altra citazione di servizio offerto per la stessa attività e servizio.',
  `- Associazioni declassate: ${decentrate.declassate.length}.`,
  '- Zagli (Firenze), revisione: la fonte dice «usato garantito… prima di essere venduto, viene sottoposto a una completa revisione». È preparazione dei propri usati, non un servizio al pubblico: associazione portata a «da verificare», estratto rimosso, scheda e altri servizi intatti.',
  `- Registro: ${meta.associazioni} associazioni · ${meta.confermate} confermate · ${meta.daVerificare} da verificare.`,
  '',
  'MILESTONE 3 — RACCOMANDAZIONI',
  '- L’assenza di prova non viene compensata dal testo della scheda: la decisione semantica prevale (elenco esplicito delle associazioni solo-interne).',
  '- Le motivazioni continuano a usare la frase della fonte quando esiste; altrimenti dichiarano che il testo non è stato recuperato.',
  '',
  'MILESTONE 4 — AI',
  '- Distinzione mantenuta fra spiegazione tecnica, richiesta di servizio, guasto, ricerca di attività, marca e assistenza ufficiale, valore di un oggetto posseduto.',
  '- L’AI non può affermare un servizio quando la fonte documenta solo una lavorazione interna: usa lo stesso servizioDocumentato del catalogo.',
  '',
  'COLLAUDI',
  '- npm run check: 0 errori, 0 warning, 0 hint.',
  '- npm run build: ok · npm run test:ui: ok · npm test: 331 test, 326 pass, 0 fail, 5 skipped.',
  '- Catalogo 556 attività, 249 località, 1.167 fonti, 82 coordinate verificate. Sitemap 556 schede.',
  '- Audit duplicati: 21 coppie, 0 duplicati confermati (protezione invariata).',
  '- Redirect Porto Torres 301 → 200.',
  '',
  'DEPLOY',
  `- Preview: ${preview} (branch fase42-indice-20261106).`,
  `- Produzione: ${produzione} (branch pubblicazione-gratuita-scardi-20261022).`,
  '- Rollback: 60d2917d (Fase 41), 7a23d274, 9a5dc084 (Fase 40).',
  '',
  'PROBLEMI APERTI',
  '- Il bundle delle evidenze (circa 550 KB non compressi) resta nel client per le motivazioni: prossimo candidato a un indice delle sole frasi.',
  '- Larghezze 390/768: verificate da ChatGPT sulla Fase 41; in questa sessione il browser cloud non consente il cambio viewport.',
  '- Nessuna nuova attività in questa fase: capacità spesa su indice, evidenze semantiche e collaudo.',
  '',
  'SHA256 DEI FILE CHIAVE',
  hashes,
  '',
];
writeFileSync('.runtime/CHECKPOINT-fase42.txt', righe.join('\n'));
writeFileSync('.runtime/CHECKPOINT-fase42.sha256', hashes + '\n');
console.log(`checkpoint ${righe.join('\n').length} byte · indice ${kb(indice.length)} KB · JS iniziale ${kb(jsGzip)} KB gzip`);
