// Fase 41 — checkpoint ripristinabile: AI, bundle, HTML progressivo, evidenze, deploy.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const preview = process.argv[2] ?? 'PREVIEW';
const produzione = process.argv[3] ?? 'PRODUZIONE';
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const meta = JSON.parse(readFileSync('data/evidenze/meta.json', 'utf8'));
const audit = JSON.parse(readFileSync('data/reports/fase40-audit-duplicati.json', 'utf8'));
const evidenze41 = JSON.parse(readFileSync('data/reports/fase41-evidenze.json', 'utf8'));
const file = [
  'site/src/lib/assistant.ts', 'site/src/scripts/search-ui.ts', 'site/src/scripts/card-render.ts',
  'site/src/scripts/map-ui.ts', 'site/src/scripts/map-lazy.ts', 'site/src/scripts/assistant-lazy.ts',
  'site/src/pages/cerca.astro', 'site/src/pages/mappa-punti.json.ts',
  'site/data/directory.json', 'data/evidenze/servizi.json', 'data/evidenze/confermate.json', 'data/evidenze/meta.json',
  'tests/fase41.test.ts', 'scripts/fase41-ai-endpoint.mjs', 'scripts/fase41-evidenze.mjs',
  'data/reports/fase41-evidenze.json', 'data/reports/fase40-audit-duplicati.json',
];
const hashes = file.filter(f => { try { readFileSync(f); return true; } catch { return false; } })
  .map(f => `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${f}`).join('\n');

const righe = [
  'OROLOGIAI.IT — CHECKPOINT FASE 41 (ricerca ultraveloce, AI senza falsi filtri, evidenze)',
  'Data: 2026-11-06 · modifiche non committate · produzione di partenza 9a5dc084 (Fase 40)',
  '',
  'MILESTONE 1 — CLASSIFICAZIONE AI',
  '- Bug reale: «Come funziona uno scappamento ad ancora?» produceva localitaNonCensita "ancora".',
  '- Causa: la preposizione «ad» introduceva una località e «ancora» non era nell’elenco delle parole escluse.',
  '- Correzione: elenco dei componenti dell’orologeria (ancora, corona, ponte, ruota, cassa, movimento, bilanciere, bariletto, rotore, scappamento…),',
  '  riconoscimento del contesto informativo/tecnico («che cosa fa», «a cosa serve», «come si regola», «differenza tra») e blocco della località non censita in quel contesto.',
  '- Verifica sull’endpoint REALE di produzione (POST /api/orologiaio), sette casi:',
  '  1. scappamento ad ancora → nessun filtro · 2. rotore → nessun filtro · 3. bilanciere → nessun filtro',
  '  4. «perde dieci minuti al giorno» → servizio=riparazione (nessuna diagnosi) · 5. revisione a Firenze → servizio+località',
  '  6. assistenza ufficiale Rolex a Milano → marca+ruolo+località · 7. orologiaio ad Alassio → localitaNonCensita=Alassio',
  '',
  'MILESTONE 2 — ASSISTENTE FUORI DAL CARICAMENTO INIZIALE',
  '- search-ui non importa più il modulo dell’assistente: lo carica con import dinamico solo per una ricerca libera, dopo il primo render.',
  '- La ricerca letterale compare subito; l’interpretazione semantica la affina quando è pronta, con indicazione «Sto interpretando la richiesta…».',
  '- Se l’interpretazione non migliora i risultati o fallisce, restano quelli letterali: nessuna funzione persa.',
  '- Verifica in browser: su /cerca/ l’assistente non viene richiesto; dopo l’invio di una richiesta libera il modulo si carica e i risultati cambiano.',
  '',
  'MILESTONE 3 — HTML PROGRESSIVO',
  `- /cerca/: prime 60 card nell’HTML, le altre create nel browser con lo stesso markup (site/src/scripts/card-render.ts).`,
  '- I punti della mappa non sono più un attributo JSON dell’HTML: nuovo file statico /mappa-punti.json (58 KB) caricato all’apertura.',
  '- HTML: 851.254 byte → 142.612 byte (−83%); compresso: 95.971 → 20.641 byte (−78%).',
  '- Nodi DOM: 12.871 → circa 2.000 (misurati 2.047 con 69 card presenti).',
  '- Card nel DOM all’apertura: 60 + quelle visibili/create su richiesta (69 misurate), contro 556.',
  '- Invariati: filtri, conteggi, ricerca libera, servizi rapidi, motivazioni con fonte, mappa, paginazione, URL condivisibili, Indietro, schede e pagine territoriali statiche.',
  '',
  'MILESTONE 4 — EVIDENZE',
  `- Registro ${evidenze41.registro} associazioni · confermate ${meta.confermate} · da verificare ${meta.daVerificare}.`,
  '- Report sui servizi prioritari in data/reports/fase41-evidenze.json: per revisione, riparazione, automatici, pendoleria, restauro, assistenza sono contate',
  '  le frasi che nominano davvero il servizio e quelle solo elencate. Nessun reintegro automatico di citazioni declassate.',
  '- Duplicati: protezione invariata, audit 556 attività / 21 coppie / 0 confermate.',
  '',
  'COLLAUDI',
  '- npm run check: 0 errori, 0 warning, 0 hint.',
  '- npm run build: ok. npm run test:ui: ok (ricerca DOM + chat DOM).',
  '- npm test: 325 test, 320 pass, 0 fail, 5 skipped.',
  '- Endpoint AI di produzione: 7/7 corretti.',
  '- Catalogo: 556 attività, 249 località, 1.167 fonti, 82 coordinate verificate. Sitemap: 556 schede.',
  '- Redirect Porto Torres: 301 → 200 sulla canonica; pagine territoriali 200.',
  '',
  'DEPLOY',
  `- Preview: ${preview} (branch fase41-ricerca-20261106).`,
  `- Produzione: ${produzione} (branch pubblicazione-gratuita-scardi-20261022).`,
  '- Rollback: 9a5dc084 (Fase 40), e9568e5e, 8996c4e0 (Fase 39).',
  '',
  'PROBLEMI APERTI',
  '- Il bundle del catalogo (circa 232 KB compressi) resta necessario alla ricerca client: la prossima riduzione richiede un indice compatto.',
  '- Le larghezze 390 e 768 px non sono state collaudate con rendering reale: il browser cloud di questa sessione non espone il cambio viewport.',
  `- ${meta.daVerificare} associazioni restano da verificare.`,
  '- Nessuna nuova attività in questa fase: la capacità è stata spesa su AI, prestazioni e integrità.',
  '',
  'SHA256 DEI FILE CHIAVE',
  hashes,
  '',
];
writeFileSync('.runtime/CHECKPOINT-fase41.txt', righe.join('\n'));
writeFileSync('.runtime/CHECKPOINT-fase41.sha256', hashes + '\n');
console.log(`checkpoint ${righe.join('\n').length} byte · ${dir.attivita.length} attività · ${audit.coppie.length} coppie audit`);
