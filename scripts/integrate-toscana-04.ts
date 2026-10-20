import { readFile, writeFile } from 'node:fs/promises';
import { businessSchema, directorySchema, localitySchema, type Business, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

// Incremento 04: integrazione di due attività con fonti ufficiali verificate.
// Lo script rifiuta di eseguirsi se i record esistono già, così non crea seconde schede.
const path = 'site/data/directory.json';
const today = '2026-10-16';
const data: Directory = directorySchema.parse(JSON.parse(await readFile(path, 'utf8')));
const before = structuredClone(data.attivita);

if (data.attivita.some(b => ['lamberti-sesto', 'massari-campi'].includes(b.id))) {
  throw new Error('Attività già integrate: nessuna seconda scheda.');
}
if (data.fonti.some(s => s.id.startsWith('t04-'))) throw new Error('Fonti incremento 04 già presenti.');

data.fonti.push(
  { id: 't04-lamberti-sito', tipo: 'sito-ufficiale', url: 'https://www.gioiellerialamberti.it/contatti', titolo: 'Gioielleria Lamberti — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't04-lamberti-orologeria', tipo: 'sito-ufficiale', url: 'https://www.gioiellerialamberti.it/orologi', titolo: 'Gioielleria Lamberti — sezione Orologeria', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't04-massari-sito', tipo: 'sito-ufficiale', url: 'https://massarigioielli.it/contatti/', titolo: 'Massari Shop — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't04-massari-hamilton', tipo: 'marchio-ufficiale', url: 'https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/campi-bisenzio/massari-gioielli', titolo: 'Hamilton — locator, Massari Gioielli', consultataIl: today, percorsoArchivio: null, licenza: null },
);

// Campi Bisenzio non è ancora una località: la creo con la stessa provincia di Sesto Fiorentino.
if (!data.localita.some(p => p.id === 'campi-bisenzio')) {
  const sesto = data.localita.find(p => p.id === 'sesto-fiorentino');
  if (!sesto) throw new Error('Località di riferimento mancante');
  data.localita.push(localitySchema.parse({
    id: 'campi-bisenzio', comune: 'Campi Bisenzio', comuneSlug: 'campi-bisenzio',
    provincia: sesto.provincia, provinciaSlug: sesto.provinciaSlug, siglaProvincia: sesto.siglaProvincia,
    regione: sesto.regione, regioneSlug: sesto.regioneSlug, codiceIstat: null,
    descrizione: 'Comune della provincia di Firenze con un’attività censita in questa directory.',
    fonti: ['t04-massari-hamilton'],
  }));
}

const lamberti = businessSchema.parse({
  id: 'lamberti-sesto', slug: 'lamberti-sesto', nome: 'Gioielleria Lamberti',
  tipi: ['orologeria', 'gioielleria'],
  descrizione: 'Gioielleria a Sesto Fiorentino con una sezione dedicata agli orologi, come riportato dal sito ufficiale.',
  nomiPrecedenti: [], gruppoId: null, localitaId: 'sesto-fiorentino',
  posizione: { indirizzo: 'Via Antonio Gramsci 298', cap: '50019', coordinate: null, fonti: ['t04-lamberti-sito'] },
  contatti: { telefono: '+39 055 4421133', email: null, sito: 'https://www.gioiellerialamberti.it/', whatsapp: null, social: [], fonti: ['t04-lamberti-sito'] },
  orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
  servizi: [{ id: 'vendita', fonti: ['t04-lamberti-orologeria'] }],
  altriServizi: [], specializzazioni: [],
  marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
  storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
  attendibilita: {
    stato: 'fonti-verificate', raccoltaIl: today, verificataIl: today, confermataTitolareIl: null,
    fonti: ['t04-lamberti-sito', 't04-lamberti-orologeria'],
    cronologia: [{ data: today, azione: 'Incremento 04: identità e indirizzo riscontrati sul sito ufficiale. Vendita di orologi dalla sezione Orologeria. Riparazioni e autorizzazioni di marchi non pubblicate: non attribuite. Nessun sopralluogo.', fonti: ['t04-lamberti-sito', 't04-lamberti-orologeria'] }],
    segnalazioni: [],
  },
  origine: { sistema: 'ricerca-ufficiale-toscana-04', idOriginale: 'lamberti-sesto' },
} satisfies Business);

const massari = businessSchema.parse({
  id: 'massari-campi', slug: 'massari-campi', nome: 'Massari Gioielli',
  tipi: ['orologeria', 'gioielleria'],
  descrizione: 'Gioielleria e orologeria a Campi Bisenzio, indicata come rivenditore ufficiale Hamilton dal locator del marchio.',
  nomiPrecedenti: [], gruppoId: null, localitaId: 'campi-bisenzio',
  posizione: { indirizzo: 'Via Santo Stefano 45/47', cap: '50013', coordinate: null, fonti: ['t04-massari-hamilton'] },
  contatti: { telefono: '055 8954352', email: 'massarigioielli@virgilio.it', sito: 'https://massarigioielli.it/', whatsapp: null, social: [], fonti: ['t04-massari-sito', 't04-massari-hamilton'] },
  orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
  servizi: [{ id: 'vendita', fonti: ['t04-massari-hamilton'] }],
  altriServizi: [], specializzazioni: [],
  marchi: {
    venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [],
    rivenditaUfficiale: [{ marca: 'Hamilton', fonti: ['t04-massari-hamilton'] }],
    menzionati: [],
  },
  storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
  attendibilita: {
    stato: 'fonti-verificate', raccoltaIl: today, verificataIl: today, confermataTitolareIl: null,
    fonti: ['t04-massari-hamilton', 't04-massari-sito'],
    cronologia: [{ data: today, azione: 'Incremento 04: indirizzo e telefono riscontrati sul locator Hamilton (fonte del marchio) e sul sito del negozio. Rivendita Hamilton documentata dal marchio. Assistenza e riparazioni Swatch non attribuite: autorizzazione non confermata da fonte del marchio.', fonti: ['t04-massari-hamilton', 't04-massari-sito'] }],
    segnalazioni: [],
  },
  origine: { sistema: 'ricerca-ufficiale-toscana-04', idOriginale: 'massari-campi' },
} satisfies Business);

data.attivita.push(lamberti, massari);
const checked = directorySchema.parse(data);

// I record preesistenti non devono cambiare.
for (const b of before) {
  const current = checked.attivita.find(x => x.id === b.id);
  if (JSON.stringify(b) !== JSON.stringify(current)) throw new Error(`Record preesistente alterato: ${b.id}`);
}

// Nessun duplicato con le schede esistenti: le segnalazioni devono essere sedi distinte o assenti.
const dupes = findDuplicates(checked).filter(d => [d.primo, d.secondo].some(id => ['lamberti-sesto', 'massari-campi'].includes(id)));
if (dupes.some(d => d.esito === 'da-revisionare')) throw new Error(`Possibili duplicati da revisionare: ${JSON.stringify(dupes)}`);

await writeFile(path, JSON.stringify(checked, null, 2) + '\n');
console.log(`Integrate: ${checked.attivita.length - before.length} attività; totale ${checked.attivita.length}.`);
