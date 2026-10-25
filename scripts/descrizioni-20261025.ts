// Descrizioni personalizzate (2026-10-25): completa le sole tre schede con descrizione
// troppo sintetica usando esclusivamente dati già documentati nelle fonti della scheda.
// Uso: npx tsx scripts/descrizioni-20261025.ts (si rifiuta se già applicato).
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-25';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;

const aggiornamenti: { id: string; descrizione: string }[] = [
  {
    id: 'fronza-trento',
    descrizione:
      'Orologeria Fronza Marco a Trento: riparazione di orologi di ogni tipo, cambio pile e lavori di pendoleria. Il sito ufficiale pubblica recapiti e orari della sede.',
  },
  {
    id: 'gioielleria-di-marco-nicosia',
    descrizione:
      'Gioielleria Di Marco a Nicosia, con laboratorio interno: la fonte ufficiale documenta il servizio di riparazione di orologi accanto all’attività orafa, con recapito telefonico e sito pubblicati.',
  },
  {
    id: 'de-marco-belluno',
    descrizione:
      'De Marco a Belluno: gioielleria con laboratorio di orologeria. La fonte ufficiale documenta riparazione, revisione, restauro di orologi vintage, cambio pile, cinturini, manutenzione e vendita.',
  },
];

const gia = directory.attivita.find(a => a.descrizione === aggiornamenti[0].descrizione);
if (gia) {
  console.error('Descrizioni già aggiornate: nessuna modifica.');
  process.exit(1);
}

for (const agg of aggiornamenti) {
  const b = directory.attivita.find(x => x.id === agg.id);
  if (!b) throw new Error(`Attività assente: ${agg.id}`);
  const prima = b.descrizione;
  b.descrizione = agg.descrizione;
  b.attendibilita.cronologia.push({
    data: DATA,
    azione: `Descrizione personalizzata completata sui dati documentati (prima: «${prima}»)`,
    fonti: b.attendibilita.fonti.slice(0, 4),
  });
}

const validato = directorySchema.parse(directory);
writeFileSync(FILE, `${JSON.stringify(validato, null, 2)}\n`);
writeFileSync('data/reports/descrizioni-20261025-applied.json', `${JSON.stringify({
  intervento: 'descrizioni-20261025',
  data: DATA,
  criterio: 'Solo descrizioni uniche e personalizzate, basate sui dati documentati in scheda.',
  schedeAggiornate: aggiornamenti.map(a => a.id),
}, null, 2)}\n`);
console.log(`Descrizioni completate: ${aggiornamenti.length} schede aggiornate, nessun dato operativo toccato.`);
