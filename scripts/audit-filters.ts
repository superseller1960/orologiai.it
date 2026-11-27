// Audit dei filtri: conteggi reali, corrispondenze non sostenute dall'evidenza e combinazioni vuote.
// Uso: npx tsx scripts/audit-filters.ts [--verbose]
import { directory } from '../site/src/lib/directory.ts';
import { services } from '../site/src/lib/schema.ts';
import { SERVIZI_TECNICI_DA_PROVARE, servizioDocumentato } from '../site/src/lib/recommendations.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const verbose = process.argv.includes('--verbose');
const attive = directory.attivita.filter(b => b.attendibilita.stato !== 'chiusa');
console.log(`Attività attive: ${attive.length} · località: ${directory.localita.length} · fonti: ${directory.fonti.length}`);

console.log('\n== Servizi: schede elencate vs evidenza nel testo delle fonti ==');
const righe = Object.keys(services).map(id => {
  const elencate = attive.filter(b => b.servizi.some(s => s.id === id));
  const documentate = elencate.filter(b => servizioDocumentato(directory, b, id as keyof typeof services));
  return { id, elencate: elencate.length, documentate: documentate.length, tecnico: SERVIZI_TECNICI_DA_PROVARE.includes(id as keyof typeof services) };
}).filter(r => r.elencate > 0).sort((a, b) => b.elencate - a.elencate);
for (const r of righe) {
  const delta = r.elencate - r.documentate;
  console.log(`${r.id.padEnd(24)} elencate ${String(r.elencate).padStart(3)} · con evidenza ${String(r.documentate).padStart(3)}${delta ? ` · senza riscontro ${String(delta).padStart(3)}` : ''}${r.tecnico ? '' : ' (categoria)'}`);
}

console.log('\n== Servizi tecnici elencati senza riscontro nel testo delle fonti ==');
for (const id of SERVIZI_TECNICI_DA_PROVARE) {
  const senza = attive.filter(b => b.servizi.some(s => s.id === id) && !servizioDocumentato(directory, b, id));
  if (!senza.length) continue;
  console.log(`${id}: ${senza.length}${verbose ? ' → ' + senza.slice(0, 12).map(b => b.slug).join(', ') : ''}`);
}

console.log('\n== Ruoli marchio ==');
for (const ruolo of ['venduti', 'riparati', 'esperienza', 'assistenzaUfficiale', 'rivenditaUfficiale', 'menzionati'] as const) {
  const n = attive.filter(b => b.marchi[ruolo].length > 0).length;
  console.log(`${ruolo.padEnd(22)} ${n} attività`);
}
const marchiNonUfficiali = attive.filter(b => b.marchi.rivenditaUfficiale.some(m => !directory.fonti.find(f => m.fonti.includes(f.id))));
if (marchiNonUfficiali.length) console.log(`Rivendite senza fonte esistente: ${marchiNonUfficiali.length}`);

console.log('\n== Laboratorio ==');
for (const tipo of ['interno', 'esterno', 'rete', 'orafo', 'non-specificato', 'assente'] as const) {
  const n = tipo === 'assente' ? attive.filter(b => !b.laboratorio).length : attive.filter(b => b.laboratorio?.tipo === tipo).length;
  console.log(`${tipo.padEnd(16)} ${n}`);
}

console.log('\n== Tipologie e specializzazioni ==');
for (const t of ['orologeria', 'laboratorio', 'gioielleria', 'professionista']) console.log(`tipo ${t.padEnd(16)} ${attive.filter(b => b.tipi.includes(t as never)).length}`);
for (const s of ['lusso', 'vintage', 'antichi', 'meccanici', 'automatici', 'collezione']) console.log(`spec ${s.padEnd(16)} ${attive.filter(b => b.specializzazioni.some(x => x.id === (s as never))).length}`);

console.log('\n== Combinazioni (comune + servizio) senza risultati ==');
const comuni = [...new Set(directory.localita.map(p => p.id))];
let vuote = 0;
for (const id of ['revisione', 'pendoleria', 'restauro-vintage', 'riparazione-meccanici', 'batterie']) {
  const conServizio = comuni.filter(localita => searchDirectory(directory, { localita, servizio: id }).length > 0).length;
  console.log(`${id.padEnd(24)} comuni con almeno un risultato: ${conServizio}/${comuni.length}`);
  vuote += comuni.length - conServizio;
}
console.log(`Coppie comune+servizio vuote (sui servizi tecnici sopra): ${vuote}`);

console.log('\n== Filtri che non producono alcun risultato in Italia ==');
for (const id of Object.keys(services)) if (searchDirectory(directory, { servizio: id }).length === 0) console.log(`servizio senza risultati: ${id}`);
for (const role of ['assistenzaUfficiale', 'rivenditaUfficiale', 'riparati', 'esperienza', 'menzionati'] as const) {
  if (searchDirectory(directory, { ruoloMarca: role }).length === 0) console.log(`ruolo senza risultati: ${role}`);
}
