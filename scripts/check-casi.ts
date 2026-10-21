import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';
import { interpretaRichiesta, cercaOrologiaio } from '../site/src/lib/assistant.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const data = directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));
const querys = [
  'Roma', 'Orologiaio Roma', 'Riparazione orologi a Roma', 'Revisione orologio automatico a Roma',
  'Cambio batteria Roma', 'Assistenza ufficiale Omega Roma', '00100', 'Riparazione orologi a Milano',
  'Restauro pendole a Bologna',
  'revisione di un Rolex', 'cambio batteria', 'assistenza ufficiale Omega', 'Sangalli Milano',
];
for (const msg of querys) {
  const inter = interpretaRichiesta(msg, data);
  const sem = cercaOrologiaio(data, inter.criteri);
  console.log('---', msg, JSON.stringify(inter.criteri));
  console.log('  stato:', sem.stato, 'totale:', sem.totale, 'risultati:', sem.risultati.map(r => r.id).join(','));
  if (sem.alternative.length) console.log('  alt:', sem.alternative.map(r => r.id).join(','));
}
console.log('revisione count:', searchDirectory(data, { servizio: 'revisione' }).length);
console.log('batterie count:', searchDirectory(data, { servizio: 'batterie' }).length);
console.log('q=00100 count:', searchDirectory(data, { q: '00100' }).length);

// CAP realmente presenti nelle schede (missione Fase 2: usare un CAP valido).
for (const cap of ['00186', '00192', '00195', '50122']) {
  const sem = cercaOrologiaio(data, interpretaRichiesta(cap, data).criteri);
  console.log('--- CAP', cap, 'stato:', sem.stato, 'totale:', sem.totale, 'risultati:', sem.risultati.map(r => r.id).join(','));
}
const pendole = cercaOrologiaio(data, interpretaRichiesta('Restauro pendole a Bologna', data).criteri);
console.log('messaggi Restauro pendole a Bologna:', JSON.stringify(pendole.messaggi));
