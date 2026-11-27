// Fase 43 — checkpoint: evidenze semantiche, distinzione documentato/da verificare, AI.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const preview = process.argv[2] ?? 'PREVIEW';
const produzione = process.argv[3] ?? 'PRODUZIONE';
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const indice = readFileSync('site/data/indice-ricerca.json', 'utf8');
const meta = JSON.parse(readFileSync('data/evidenze/meta.json', 'utf8'));
const report = JSON.parse(readFileSync('data/reports/fase43-evidenze.json', 'utf8'));
const html = readFileSync('dist/cerca/index.html', 'utf8');
let jsGzip = 0;
for (const m of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) {
  const file = 'dist' + m[1];
  if (existsSync(file)) jsGzip += gzipSync(readFileSync(file)).length;
}
const kb = (n) => Math.round(n / 1024);
const file = [
  'site/src/lib/evidenza-contesto.ts', 'scripts/fase43-evidenze.mjs', 'site/src/lib/recommendations.ts',
  'site/src/lib/search.ts', 'site/src/scripts/search-ui.ts', 'site/src/lib/assistant.ts',
  'tests/fase43.test.ts', 'tests/fase43-ai.test.ts', 'data/evidenze/servizi.json',
  'data/evidenze/confermate.json', 'data/evidenze/meta.json', 'data/reports/fase43-evidenze.json',
];
const hashes = file.filter(f => existsSync(f)).map(f => `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${f}`).join('\n');
const d = report.conteggi;
const righe = [
  'OROLOGIAI.IT — CHECKPOINT FASE 43 (raccomandazioni verificate, evidenze semantiche)',
  'Data: 2026-11-06 · modifiche non committate · produzione di partenza 91c2d06b (Fase 42)',
  '',
  'MILESTONE 1 — FALSE COMPETENZE',
  `- Citazioni classificate: ${d.analizzate}. Contesti: ${Object.entries(report.distribuzioneContesti).map(([k, v]) => `${k} ${v}`).join(' · ')}.`,
  '- Classificatore riscritto: negazioni, soggetto, scopo, centri ufficiali, punti di raccolta, menzioni commerciali.',
  '- Declassamento solo se per la coppia attività+servizio non esiste alcuna citazione di servizio al cliente.',
  `- Declassate in totale: ${report.declassate.length} (Fase 42: Zagli; Fase 43: Ascione). Declassate in questo lotto: ${d.declassateInQuestoLotto}.`,
  '- Ascione (Porto Torres), revisione: «Ogni orologio di secondo polso che proponiamo viene sottoposto a … revisione» = lavorazione sui propri usati. Revisione declassata; assistenza e riparazione meccanica restano confermate da una fonte distinta.',
  '- Falsi positivi intercettati e ripristinati: orologeria-salucci-roma::revisione, tempi-moderni-trento::riparazione (frase sulla garanzia, non sull’uso interno).',
  `- Registro: ${meta.associazioni} associazioni · ${meta.confermate} confermate · ${meta.daVerificare} da verificare.`,
  '',
  'MILESTONE 2 — AUDIT',
  '- Analizzate tutte le 1.818 associazioni; conteggi per servizio e per contesto in data/reports/fase43-evidenze.json.',
  '- Nessun declassamento in blocco: 2 associazioni in due fasi, entrambe con citazione conservata nel report.',
  '',
  'MILESTONE 3 — DOCUMENTATO / DA VERIFICARE',
  '- La ricerca ordina prima le attività con prova documentata e dichiara il conteggio: «N con prova documentata · M da verificare».',
  '- Le card senza prova mostrano «Nota sulla fonte» e non una motivazione di competenza.',
  '- Nuovo filtro facoltativo «Solo attività con prova documentata» (parametro soloDocumentate=1).',
  '',
  'MILESTONE 4 — PESO DELLE EVIDENZE',
  `- Misura: estratto pieno 554 KB (69 KB gzip); rappresentazione compatta 374 KB (62 KB gzip). Risparmio 11% (7 KB).`,
  '- Guadagno marginale: conservata l’architettura della Fase 42, come previsto dall’incarico.',
  `- JavaScript iniziale di /cerca/: ${kb(jsGzip)} KB compressi (Fase 42: 130 KB).`,
  '',
  'MILESTONE 5 — AI',
  '- L’assistente usa la stessa decisione semantica del catalogo: un servizio declassato non viene descritto come offerto.',
  '- Ruoli distinti: assistenza ufficiale, rivendita ufficiale, riparazione, punto di raccolta, menzione storica.',
  '- Domande tecniche (rotore, scappamento, bilanciere) non attivano filtri commerciali; /api/fonte invariato.',
  '',
  'MILESTONE 6 — CRESCITA',
  `- Nessuna nuova attività: ${dir.attivita.length} schede, ${dir.localita.length} località, ${dir.fonti.length} fonti. Capacità spesa su evidenze e collaudo, come dichiarato.`,
  '',
  'COLLAUDI',
  '- npm run check: 0 errori, 0 warning, 0 hint. Build ok. Test UI ok. Pacchetto Pages ok.',
  '- npm test: 339 test, 334 pass, 0 fail, 5 skipped (i 5 skip sono lotti storici senza fixture).',
  '- Cascata: 301 Porto Torres → 200; sitemap 556 schede.',
  '',
  'DEPLOY',
  `- Preview: ${preview} (branch fase43-evidenze-20261106).`,
  `- Produzione: ${produzione} (branch pubblicazione-gratuita-scardi-20261022).`,
  '- Rollback: 91c2d06b (Fase 42), 208717b3, 60d2917d (Fase 41).',
  '',
  'PROBLEMI APERTI',
  '- 934 citazioni confermate sono generiche («insufficiente»): la prova esiste ma non descrive il servizio. Prossimo passo: riclassificarle una per una, non in blocco.',
  '- L’espansione verso 600 attività non è stata avviata in questa sessione.',
  '- Larghezze 390/768 non ricollaudate qui: verificate da ChatGPT sulla Fase 41; il browser cloud non cambia viewport.',
  '',
  'SHA256 DEI FILE CHIAVE',
  hashes,
  '',
];
writeFileSync('.runtime/CHECKPOINT-fase43.txt', righe.join('\n'));
writeFileSync('.runtime/CHECKPOINT-fase43.sha256', hashes + '\n');
console.log(`checkpoint ${righe.join('\n').length} byte · declassate ${report.declassate.length} · JS iniziale ${kb(jsGzip)} KB gzip`);
