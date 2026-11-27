import { readFileSync } from 'node:fs';

const comuni = JSON.parse(readFileSync('data/anagrafica/comuni-italia.json', 'utf8')).comuni as [string, string, string, string][];
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const coperti = new Set(dir.localita.map((l: any) => l.comune));
const candidate = [
  'Alessandria', 'Asti', 'Cuneo', 'Novara', 'Vercelli', 'Casale Monferrato', 'Pinerolo', 'Saluzzo',
  'La Spezia', 'Chiavari', 'Sanremo', 'Albenga', 'Rapallo', 'Pietra Ligure',
  'Como', 'Varese', 'Lecco', 'Pavia', 'Cremona', 'Mantova', 'Monza', 'Sondrio', 'Lodi', 'Vigevano',
  'Padova', 'Treviso', 'Rovigo', 'Verona', 'Conegliano', 'Chioggia', 'Bassano del Grappa', 'Cittadella',
  'Pordenone', 'Gorizia', 'Trieste', 'Sacile', 'Tolmezzo',
  'Rovereto', 'Merano', 'Bressanone', 'Pergine Valsugana', 'Arco',
  'Modena', 'Parma', 'Reggio Emilia', 'Piacenza', 'Ferrara', 'Ravenna', 'Rimini', 'Forlì', 'Carpi', 'Imola',
  'Pisa', 'Lucca', 'Arezzo', 'Siena', 'Grosseto', 'Livorno', 'Prato', 'Pistoia', 'Viareggio', 'Cortona', 'San Gimignano',
  'Foligno', 'Assisi', 'Orvieto', 'Todi', 'Città di Castello', 'Spoleto',
  'Pesaro', 'Fano', 'Ascoli Piceno', 'Macerata', 'Jesi', 'Urbino', 'Senigallia', 'Recanati',
  'Viterbo', 'Rieti', 'Frosinone', 'Latina', 'Civitavecchia', 'Tivoli', 'Velletri', 'Cassino',
  'Teramo', 'Chieti', 'Avezzano', 'Vasto', 'Sulmona', 'Lanciano',
  'Isernia', 'Termoli', 'Campobasso', 'Agnone',
  'Salerno', 'Caserta', 'Benevento', 'Avellino', 'Sorrento', 'Amalfi', 'Pozzuoli', 'Torre del Greco', 'Castellammare di Stabia', 'Capri',
  'Lecce', 'Taranto', 'Brindisi', 'Trani', 'Barletta', 'Andria', 'Foggia', 'Gallipoli', 'Ostuni', 'Martina Franca', 'Molfetta',
  'Melfi', 'Policoro', 'Matera', 'Potenza',
  'Crotone', 'Vibo Valentia', 'Castrovillari', 'Corigliano-Rossano', 'Soverato', 'Tropea',
  'Catania', 'Messina', 'Siracusa', 'Ragusa', 'Trapani', 'Agrigento', 'Caltanissetta', 'Enna', 'Marsala', 'Acireale', 'Taormina', 'Noto', 'Cefalù',
  'Sassari', 'Nuoro', 'Oristano', 'Alghero', 'Arzachena', 'Tempio Pausania', 'Iglesias', 'Orosei',
];
const index = new Map(comuni.map(c => [c[0], c]));
const libere = candidate.filter(n => index.has(n) && !coperti.has(n));
const giaCoperte = candidate.filter(n => coperti.has(n));
console.log('libere', libere.length);
console.log(libere.map(n => { const c = index.get(n)!; return `${n} (${c[2]}) ${c[3]}`; }).join('\n'));
console.log('\ngia coperte', giaCoperte.join(', '));
