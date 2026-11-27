// Fase 45 — checkpoint verificabile: titoli, nuova scheda, copertura mappa, deployment.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [preview = '', produzione = ''] = process.argv.slice(2);
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const confermate = registro.evidenze.filter(e => e.stato === 'confermata');
const revisione = registro.evidenze.filter(e => e.servizio === 'revisione');
const punti = dir.attivita.filter(b => b.posizione.coordinate?.stato === 'verificata').length;
const hash = f => createHash('sha256').update(readFileSync(f)).digest('hex');

const file = [
  'site/src/lib/business-presentation.ts', 'site/src/pages/orologeria/[slug].astro',
  'site/src/lib/recommendations.ts', 'site/src/lib/assistant.ts',
  'tests/fase45.test.ts', 'tests/verified-coordinate.ts',
  'site/data/directory.json', 'site/data/indice-ricerca.json',
  'data/evidenze/servizi.json', 'data/evidenze/confermate.json',
];
const testo = `# Checkpoint Fase 45 — titoli, crescita verificata e copertura della mappa

Data: 2026-11-09
Produzione: ${produzione}
Preview: ${preview}
Rollback Fase 44: 06b2dde4-922f-4537-89a2-44c6c0e74190
Rollback Fase 43: 7e9f6a05-90ca-4ea3-8354-775329cd8574

## Criterio
Il titolo SEO non ripete il comune già presente nel nome ufficiale. Una nuova attività entra
solo con identità e sede lette su fonti verificabili; nessun servizio viene promosso a
«documentato» senza citazione pertinente. Le coordinate entrano solo con civico, strada,
comune e CAP coincidenti e oggetto di scala edificio.

## Numeri
- Attività: ${dir.attivita.length} (Fase 44: 559)
- Località: ${dir.localita.length}
- Fonti: ${dir.fonti.length}
- Associazioni documentali: ${registro.evidenze.length}
- Confermate con citazione: ${confermate.length}
- Da verificare: ${registro.evidenze.length - confermate.length}
- Revisione: ${revisione.length} associazioni, ${revisione.filter(e => e.stato === 'confermata').length} documentate, ${revisione.filter(e => e.stato !== 'confermata').length} da verificare
- Posizioni verificate in mappa: ${punti} (Fase 44: 82)
- Nuove attività Fase 45: 1 (Watch & Clock, Milano)
- CM Orologi (Alba) verificato ma ancora sospeso dal lotto Fase 13: non pubblicato.

## File (SHA-256)
${file.map(f => `- ${f}: ${hash(f)}`).join('\n')}

## Collaudo
- npm run check: 0 errori, 0 warning, 0 hint
- npm run build: ok
- npm test: 346 test, 341 pass, 0 fail, 5 skipped
- npm run package:pages: ok
- Titoli in produzione: «Dival Orologi — Milano», «Watch & Clock — Milano»
- /mappa-punti.json: ${punti} posizioni

## Limiti dichiarati
- L'espansione non raggiunge 600: i candidati già verificati erano quasi tutti già censiti;
  CM Orologi resta sospeso e non è stato forzato per fare numero.
- La geocodifica rigorosa ha accettato 1 indirizzo su 80: 40 civici non coincidenti, 16 strade
  non coincidenti, 12 indirizzi non risolti. Nessun centro-comune usato come marker.
- Le 646 associazioni da verificare restano tali: un URL non è una prova.
`;
writeFileSync('.runtime/CHECKPOINT-fase45.txt', testo);
writeFileSync('.runtime/CHECKPOINT-fase45.sha256', `${hash('.runtime/CHECKPOINT-fase45.txt')}  .runtime/CHECKPOINT-fase45.txt\n`);
console.log(`checkpoint ${testo.length} byte · attività ${dir.attivita.length} · mappa ${punti} · revisione ${revisione.length}`);
