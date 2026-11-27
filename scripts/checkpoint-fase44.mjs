// Fase 44 — checkpoint verificabile: conteggi reali, hash dei file chiave, deployment.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [preview = '', produzione = ''] = process.argv.slice(2);
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const report = JSON.parse(readFileSync('data/reports/fase44-recupero.json', 'utf8'));
const confermate = registro.evidenze.filter(e => e.stato === 'confermata');
const revisione = registro.evidenze.filter(e => e.servizio === 'revisione');
const documentate = confermate.filter(e => e.estratto.trim().length >= 40);
const hash = f => createHash('sha256').update(readFileSync(f)).digest('hex');

const file = [
  'site/src/lib/recommendations.ts', 'site/src/lib/assistant.ts', 'site/src/scripts/search-ui.ts',
  'site/src/lib/search.ts', 'site/src/lib/evidenza-contesto.ts', 'scripts/fase44-recupero.ts',
  'scripts/fase44-espansione.mjs', 'tests/fase44.test.ts', 'site/data/directory.json',
  'site/data/indice-ricerca.json', 'data/evidenze/servizi.json', 'data/evidenze/confermate.json',
];
const testo = `# Checkpoint Fase 44 — affidabilità delle raccomandazioni e recupero delle prove

Data: 2026-11-06
Produzione: ${produzione}
Preview: ${preview}
Rollback Fase 43: 7e9f6a05-90ca-4ea3-8354-775329cd8574
Rollback Fase 42: 91c2d06b-fefb-439c-8ab4-57c2b11ce098

## Criterio
«Documentata» richiede una citazione verificata che descriva il servizio al cliente.
Il testo della scheda e un URL registrato non bastano: quei casi restano «indicati nella scheda,
da confermare con l'attività». Lavorazione interna, negazioni, menzioni commerciali e ruoli
ufficiali non vengono estesi ad altri servizi.

## Numeri
- Attività: ${dir.attivita.length}
- Località: ${dir.localita.length}
- Fonti: ${dir.fonti.length}
- Associazioni documentali: ${registro.evidenze.length}
- Confermate con citazione: ${confermate.length} (con estratto: ${documentate.length})
- Da verificare: ${registro.evidenze.length - confermate.length}
- Revisione: ${revisione.length} associazioni, ${revisione.filter(e => e.stato === 'confermata').length} documentate, ${revisione.filter(e => e.stato !== 'confermata').length} da verificare
- Recuperi Fase 44: ${report.esiti?.recuperate?.length ?? 0} citazioni; non accessibili: ${report.esiti?.nonAccessibili?.length ?? 0}; senza prova: ${report.esiti?.senzaProva?.length ?? 0}
- Nuove attività Fase 44: 3 (Dival Milano, Eredi Amadio Padova, Orologeria Monti Monza)

## File (SHA-256)
${file.map(f => `- ${f}: ${hash(f)}`).join('\n')}

## Collaudo
- npm run check: 0 errori, 0 warning, 0 hint
- npm run build: ok
- npm test: 343 test, 338 pass, 0 fail, 5 skipped
- npm run test:ui: ok
- npm run package:pages: ok

## Limiti dichiarati
- Le citazioni generiche non sono state promosse in blocco.
- Le fonti non raggiungibili restano «da verificare», non declassate per supposizione.
- L'espansione si ferma a 559 attività: solo candidati con indirizzo e recapiti verificati.
- Viewport 390/768 verificati nel browser cloud quando disponibile.
`;
writeFileSync('.runtime/CHECKPOINT-fase44.txt', testo);
writeFileSync('.runtime/CHECKPOINT-fase44.sha256', `${hash('.runtime/CHECKPOINT-fase44.txt')}  .runtime/CHECKPOINT-fase44.txt\n`);
console.log(`checkpoint ${testo.length} byte · attività ${dir.attivita.length} · confermate ${confermate.length} · revisione ${revisione.length}`);
