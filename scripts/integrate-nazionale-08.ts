import { readFile, writeFile } from 'node:fs/promises';
import { businessSchema, directorySchema, localitySchema, type Business, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

// Incremento 08: primo lotto davvero nazionale (Campania, Puglia, Sicilia, Liguria e nuove
// attività in Lazio, Emilia-Romagna e Piemonte). Ogni scheda è verificata sul sito ufficiale
// dell'attività; nessuna autorizzazione di marca è attribuita senza fonte del marchio.
// Lo script è idempotente: rifiuta di eseguirsi se i record o le fonti esistono già.
const path = 'site/data/directory.json';
const today = '2026-10-19';
const data: Directory = directorySchema.parse(JSON.parse(await readFile(path, 'utf8')));
const before = structuredClone(data.attivita);

const newIds = [
  'monetti-napoli-mille', 'monetti-napoli-brigida', 'deluca-napoli', 'pirone-napoli', 'mazzone-salerno',
  'carrieri-bari', 'macchina-tempo-bari', 'chlw-bari',
  'bruno-emanuele-palermo', 'cagnina-palermo', 'di-caro-palermo', 'watch-center-palermo',
  'censi-genova', 'astrua-genova', 'astrua-torino', 'capo-torino', 'lab-alessandria',
  'bottega-del-tempo-roma', 'salamena-roma', 'portanova-bologna',
];

if (data.attivita.some(b => newIds.includes(b.id))) {
  throw new Error('Attività già integrate: nessuna seconda scheda.');
}
if (data.fonti.some(s => s.id.startsWith('t08-'))) throw new Error('Fonti incremento 08 già presenti.');

data.fonti.push(
  { id: 't08-monetti-sito', tipo: 'sito-ufficiale', url: 'https://monettiorologi.com/', titolo: 'Monetti Orologeria e Gioielleria — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-monetti-laboratorio', tipo: 'sito-ufficiale', url: 'https://monettiorologi.com/laboratorio/', titolo: 'Monetti — Laboratorio di assistenza', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-monetti-contatti', tipo: 'sito-ufficiale', url: 'https://monettiorologi.com/contatti/', titolo: 'Monetti — contatti e sedi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-deluca-sito', tipo: 'sito-ufficiale', url: 'https://www.assistenzaorologideluca.it/', titolo: 'Centro Assistenza Orologi De Luca — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-deluca-contatti', tipo: 'sito-ufficiale', url: 'https://www.assistenzaorologideluca.it/contatti', titolo: 'Centro Assistenza Orologi De Luca — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-deluca-restauri', tipo: 'sito-ufficiale', url: 'https://www.assistenzaorologideluca.it/restaurazioni-vintage', titolo: 'Centro Assistenza Orologi De Luca — restaurazioni vintage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-pirone-sito', tipo: 'sito-ufficiale', url: 'https://www.pironeorologi.it/', titolo: 'Orologeria Pirone — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-pirone-riparazione', tipo: 'sito-ufficiale', url: 'https://www.pironeorologi.it/riparazione-orologi-napoli', titolo: 'Orologeria Pirone — servizio di vendita e riparazione', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-mazzone-sito', tipo: 'sito-ufficiale', url: 'https://www.orologeriamazzonesalerno.it/', titolo: 'Orologeria Mazzone Salerno — servizi e contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-carrieri-sito', tipo: 'sito-ufficiale', url: 'https://www.orologeriacarrieri.com/', titolo: 'Carrieri Mastri Orologiai — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-carrieri-laboratorio', tipo: 'sito-ufficiale', url: 'https://www.orologeriacarrieri.com/laboratorio-di-orologeria', titolo: 'Carrieri Mastri Orologiai — laboratorio di orologeria', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-carrieri-contatti', tipo: 'sito-ufficiale', url: 'https://www.orologeriacarrieri.com/contatti', titolo: 'Carrieri Mastri Orologiai — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-macchtempo-bari', tipo: 'sito-ufficiale', url: 'https://www.orologerialamacchinadeltempo.it/', titolo: 'Orologeria La Macchina del Tempo Bari — homepage, servizi e marche', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-chlw-sito', tipo: 'sito-ufficiale', url: 'https://www.chlw.it/', titolo: 'CHLW Bari — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-chlw-servizi', tipo: 'sito-ufficiale', url: 'https://www.chlw.it/pages/i-nostri-servizi', titolo: 'CHLW Bari — i nostri servizi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-chlw-laboratorio', tipo: 'sito-ufficiale', url: 'https://www.chlw.it/pages/laboratorio', titolo: 'CHLW Bari — laboratorio', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-chlw-contatti', tipo: 'sito-ufficiale', url: 'https://www.chlw.it/pages/contact', titolo: 'CHLW Bari — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-bruno-sito', tipo: 'sito-ufficiale', url: 'https://brunoemanuele.com/', titolo: 'Bruno Emanuele Orologeria Palermo — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-bruno-riparazione', tipo: 'sito-ufficiale', url: 'https://brunoemanuele.com/riparazione-orologi/', titolo: 'Bruno Emanuele Orologeria — riparazione orologi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-cagnina-sito', tipo: 'sito-ufficiale', url: 'https://www.orologerialacagninadario.com/', titolo: 'La Cagnina Dario — Laboratorio di Orologeria Palermo', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-dicaro-sito', tipo: 'sito-ufficiale', url: 'https://www.orologeriadicaro.com/', titolo: 'Orologeria Di Caro Palermo — servizi e assistenza', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-dicaro-contatti', tipo: 'sito-ufficiale', url: 'https://www.orologeriadicaro.com/contatti/', titolo: 'Orologeria Di Caro — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-watchcenter-sito', tipo: 'sito-ufficiale', url: 'https://watch-center.eu/', titolo: 'Watch Center Palermo — servizi di assistenza', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-watchcenter-termini', tipo: 'sito-ufficiale', url: 'https://watch-center.eu/termini-condizioni', titolo: 'Watch Center — dati aziendali e contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-censi-sito', tipo: 'sito-ufficiale', url: 'https://www.alfiocensi.it/', titolo: 'Alfio Censi Genova — riparazione, restauro e perizie', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-astrua-sito', tipo: 'sito-ufficiale', url: 'https://www.astrua.com/', titolo: 'Astrua 1860 — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-astrua-genova', tipo: 'sito-ufficiale', url: 'https://www.astrua.com/it/sedi-astrua-boutiques-genova', titolo: 'Astrua 1860 — sede di Genova', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-astrua-riparazione-genova', tipo: 'sito-ufficiale', url: 'https://www.astrua.com/it/riparazione-orologi-genova', titolo: 'Astrua 1860 — riparazione orologi Genova', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-astrua-torino', tipo: 'sito-ufficiale', url: 'https://www.astrua.com/it/sedi-astrua-boutiques-torino', titolo: 'Astrua 1860 — sede di Torino', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-astrua-riparazione-torino', tipo: 'sito-ufficiale', url: 'https://www.astrua.com/it/riparazione-orologi-torino', titolo: 'Astrua 1860 — riparazione orologi Torino', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-capo-sito', tipo: 'sito-ufficiale', url: 'https://www.laboratoriocapo.com/', titolo: 'Laboratorio Capo Torino — servizi del laboratorio', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-lab-alessandria-sito', tipo: 'sito-ufficiale', url: 'https://laboratorio-di-orologeria.webnode.it/', titolo: 'Laboratorio di Orologeria Alessandria — servizi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-lab-alessandria-orari', tipo: 'sito-ufficiale', url: 'https://laboratorio-di-orologeria.webnode.it/orari/', titolo: 'Laboratorio di Orologeria Alessandria — orari e recapito', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-bottega-sito', tipo: 'sito-ufficiale', url: 'https://www.labottegadeltempo.it/', titolo: 'La Bottega del Tempo Roma — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-bottega-riparazione', tipo: 'sito-ufficiale', url: 'https://www.labottegadeltempo.it/riparazione-orologi-roma/', titolo: 'La Bottega del Tempo — riparazione orologi Roma', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-bottega-chisiamo', tipo: 'sito-ufficiale', url: 'https://www.labottegadeltempo.it/chi-siamo/', titolo: 'La Bottega del Tempo — chi siamo', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-salamena-sito', tipo: 'sito-ufficiale', url: 'https://www.riparazioniorologiroma.it/', titolo: 'Salamena Laboratorio di Orologeria Roma — homepage', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-salamena-pagine', tipo: 'sito-ufficiale', url: 'https://pagine.riparazioniorologiroma.it/', titolo: 'Salamena — servizi e contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-portanova-sito', tipo: 'sito-ufficiale', url: 'https://www.laboratorioportanova.eu/', titolo: 'Laboratorio PortaNova Bologna — interventi e restauri', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't08-portanova-contatti', tipo: 'sito-ufficiale', url: 'https://www.laboratorioportanova.eu/contatti/', titolo: 'Laboratorio PortaNova — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
);

const nuoveLocalita = [
  {
    id: 'napoli', comune: 'Napoli', comuneSlug: 'napoli', provincia: 'Napoli', provinciaSlug: 'napoli',
    siglaProvincia: 'NA', regione: 'Campania', regioneSlug: 'campania', codiceIstat: '063049',
    descrizione: 'Capoluogo campano, con laboratori di orologeria, assistenza e restauro censiti tramite siti ufficiali.',
    fonti: ['t08-monetti-contatti', 't08-deluca-contatti', 't08-pirone-riparazione'],
  },
  {
    id: 'salerno', comune: 'Salerno', comuneSlug: 'salerno', provincia: 'Salerno', provinciaSlug: 'salerno',
    siglaProvincia: 'SA', regione: 'Campania', regioneSlug: 'campania', codiceIstat: '065116',
    descrizione: 'Capoluogo campano con orologeria specializzata in riparazione meccanica, pendoli e sostituzione batterie.',
    fonti: ['t08-mazzone-sito'],
  },
  {
    id: 'bari', comune: 'Bari', comuneSlug: 'bari', provincia: 'Bari', provinciaSlug: 'bari',
    siglaProvincia: 'BA', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: '072006',
    descrizione: 'Capoluogo pugliese con laboratori di orologeria, restauro, revisione e valutazione censiti tramite siti ufficiali.',
    fonti: ['t08-carrieri-contatti', 't08-chlw-contatti', 't08-macchtempo-bari'],
  },
  {
    id: 'palermo', comune: 'Palermo', comuneSlug: 'palermo', provincia: 'Palermo', provinciaSlug: 'palermo',
    siglaProvincia: 'PA', regione: 'Sicilia', regioneSlug: 'sicilia', codiceIstat: '082053',
    descrizione: 'Capoluogo siciliano con laboratori di orologeria, riparazione, restauro e vendita di orologi usati.',
    fonti: ['t08-bruno-riparazione', 't08-dicaro-contatti', 't08-watchcenter-termini'],
  },
  {
    id: 'genova', comune: 'Genova', comuneSlug: 'genova', provincia: 'Genova', provinciaSlug: 'genova',
    siglaProvincia: 'GE', regione: 'Liguria', regioneSlug: 'liguria', codiceIstat: '010025',
    descrizione: 'Capoluogo ligure con laboratori di riparazione, restauro di orologi antichi e assistenza orologiaia.',
    fonti: ['t08-censi-sito', 't08-astrua-genova'],
  },
  {
    id: 'alessandria', comune: 'Alessandria', comuneSlug: 'alessandria', provincia: 'Alessandria', provinciaSlug: 'alessandria',
    siglaProvincia: 'AL', regione: 'Piemonte', regioneSlug: 'piemonte', codiceIstat: '006003',
    descrizione: 'Comune piemontese con laboratorio orologiaio per riparazioni di ogni genere, pile, cinturini e pendole.',
    fonti: ['t08-lab-alessandria-orari'],
  },
];

for (const loc of nuoveLocalita) {
  if (!data.localita.some(p => p.id === loc.id)) {
    data.localita.push(localitySchema.parse(loc));
  }
}

const vuoti = { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] };
const orariVuoti = { giorni: [], chiusure: [], verificatiIl: null, fonti: [] };
const storiaVuota = { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] };

const scheda = (b: {
  id: string; nome: string; tipi: Business['tipi']; descrizione: string; localitaId: string; gruppoId?: string | null;
  indirizzo: string | null; cap: string | null; fontiPosizione: string[];
  telefono?: string | null; email?: string | null; sito?: string | null; whatsapp?: string | null; fontiContatti: string[];
  servizi: [Business['servizi'][number]['id'], ...string[]][] | Business['servizi'][number]['id'][];
  altriServizi?: { nome: string; fonti: string[] }[];
  specializzazioni?: Business['specializzazioni'];
  marchi?: Partial<typeof vuoti>;
  fontiVerifica: string[]; azione: string;
}): Business => businessSchema.parse({
  id: b.id,
  slug: b.id,
  nome: b.nome,
  tipi: b.tipi,
  descrizione: b.descrizione,
  nomiPrecedenti: [],
  gruppoId: b.gruppoId ?? null,
  localitaId: b.localitaId,
  posizione: { indirizzo: b.indirizzo, cap: b.cap, coordinate: null, fonti: b.fontiPosizione },
  contatti: {
    telefono: b.telefono ?? null, email: b.email ?? null, sito: b.sito ?? null, whatsapp: b.whatsapp ?? null,
    social: [], fonti: b.fontiContatti,
  },
  orari: orariVuoti,
  servizi: (b.servizi as Business['servizi'][number]['id'][]).map(id => ({ id, fonti: b.fontiVerifica })),
  altriServizi: b.altriServizi ?? [],
  specializzazioni: b.specializzazioni ?? [],
  marchi: { ...vuoti, ...b.marchi },
  storia: storiaVuota,
  attendibilita: {
    stato: 'fonti-verificate',
    raccoltaIl: today,
    verificataIl: today,
    confermataTitolareIl: null,
    fonti: b.fontiVerifica,
    cronologia: [{ data: today, azione: b.azione, fonti: b.fontiVerifica }],
    segnalazioni: [],
  },
  origine: { sistema: 'ricerca-ufficiale-nazionale-08', idOriginale: b.id },
});

const marchi = (ruolo: 'venduti' | 'riparati' | 'menzionati', nomi: string[], fonti: string[]) =>
  Object.fromEntries([[ruolo, nomi.map(marca => ({ marca, fonti }))]]) as Partial<typeof vuoti>;

const nuoveAttivita: Business[] = [
  scheda({
    id: 'monetti-napoli-mille',
    nome: 'Monetti Orologeria e Gioielleria — Via dei Mille',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Sede di Via dei Mille dell’orologeria Monetti a Napoli, con laboratorio che il sito ufficiale dichiara di assistenza ufficiale Rolex/Tudor (autorizzazione non riscontrata su fonte del marchio: non attribuita come ufficiale) e riparazione di orologi di alta gamma.',
    localitaId: 'napoli', gruppoId: 'monetti-napoli',
    indirizzo: 'Via Dei Mille 27', cap: '80121', fontiPosizione: ['t08-monetti-contatti'],
    telefono: '+39 081 5518416', email: 'info27@monettiorologi.com', sito: 'https://monettiorologi.com/',
    fontiContatti: ['t08-monetti-contatti'],
    servizi: ['assistenza', 'revisione', 'manutenzione', 'riparazione'],
    marchi: marchi('riparati', ['Rolex', 'Tudor', 'Vacheron Constantin', 'Baume & Mercier', 'IWC', 'Panerai', 'Jaeger-LeCoultre', 'Chanel', 'Cartier'], ['t08-monetti-laboratorio']),
    fontiVerifica: ['t08-monetti-sito', 't08-monetti-laboratorio', 't08-monetti-contatti'],
    azione: 'Incremento 08: identità, sede e contatti riscontrati sul sito ufficiale (monettiorologi.com). Servizi di assistenza, revisione, manutenzione e riparazione dichiarati dalla pagina Laboratorio. La dichiarazione di laboratorio di assistenza ufficiale Rolex/Tudor proviene dal solo sito dell’attività: non attribuita come autorizzazione ufficiale perché non confermata da fonte del marchio.',
  }),
  scheda({
    id: 'monetti-napoli-brigida',
    nome: 'Monetti Orologeria e Gioielleria — Via Santa Brigida',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Seconda sede dell’orologeria Monetti a Napoli, in Via Santa Brigida, con servizi di assistenza, revisione e manutenzione orologiaia dichiarati dal sito ufficiale.',
    localitaId: 'napoli', gruppoId: 'monetti-napoli',
    indirizzo: 'Via Santa Brigida 60', cap: '80132', fontiPosizione: ['t08-monetti-contatti'],
    telefono: '+39 081 5523867', email: 'infobrigida@monettiorologi.com', sito: 'https://monettiorologi.com/',
    fontiContatti: ['t08-monetti-contatti'],
    servizi: ['assistenza', 'revisione', 'manutenzione', 'riparazione'],
    fontiVerifica: ['t08-monetti-sito', 't08-monetti-contatti'],
    azione: 'Incremento 08: seconda sede di Monetti riscontrata sul sito ufficiale (pagina contatti). Il sito non specifica quale sede ospiti il laboratorio: laboratorio e autorizzazioni non attribuiti a questa sede.',
  }),
  scheda({
    id: 'deluca-napoli',
    nome: 'Centro Assistenza Orologi De Luca',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio di orologeria a Napoli in Via Port’Alba che si dichiara laboratorio certificato per interventi su orologi da polso e a pendolo, con restauro di orologi d’epoca, da pendolo e da tavolo.',
    localitaId: 'napoli',
    indirizzo: 'Via Port’Alba 7', cap: '80134', fontiPosizione: ['t08-deluca-contatti'],
    telefono: '+39 081 5499720', email: 'assistenzaorologideluca@gmail.com', sito: 'https://www.assistenzaorologideluca.it/',
    fontiContatti: ['t08-deluca-contatti'],
    servizi: ['riparazione', 'revisione', 'manutenzione', 'restauro-vintage', 'pendoleria'],
    specializzazioni: [{ id: 'antichi', fonti: ['t08-deluca-restauri'] }, { id: 'vintage', fonti: ['t08-deluca-restauri'] }],
    fontiVerifica: ['t08-deluca-sito', 't08-deluca-contatti', 't08-deluca-restauri'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale. Restauro di orologi d’epoca, a pendolo o da tavolo documentato dalla pagina Restaurazioni vintage. CAP pubblicato dal sito ufficiale (80134); una fonte di terzi riportava un CAP diverso, non corretto per supposizione. Marchi e autorizzazioni non documentati: non attribuiti.',
  }),
  scheda({
    id: 'pirone-napoli',
    nome: 'Orologeria Pirone',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria a Napoli in Riviera di Chiaia che dichiara di riparare e restaurare ogni tipo di orologio a carica automatica o manuale, con ricambi originali, riparazione di orologi antichi e moderni e ricostruzione di parti meccaniche.',
    localitaId: 'napoli',
    indirizzo: 'Riviera di Chiaia 26', cap: null, fontiPosizione: ['t08-pirone-riparazione'],
    telefono: null, email: null, sito: 'https://www.pironeorologi.it/', fontiContatti: ['t08-pirone-sito'],
    servizi: ['riparazione', 'restauro-vintage', 'ricambi', 'riparazione-automatici', 'riparazione-meccanici'],
    specializzazioni: [{ id: 'antichi', fonti: ['t08-pirone-sito'] }, { id: 'automatici', fonti: ['t08-pirone-riparazione'] }, { id: 'meccanici', fonti: ['t08-pirone-riparazione'] }],
    fontiVerifica: ['t08-pirone-sito', 't08-pirone-riparazione'],
    azione: 'Incremento 08: identità e indirizzo riscontrati sul sito ufficiale (pagina riparazione orologi Napoli). CAP, telefono e-mail non pubblicati nelle pagine consultate: non dedotti. Restauro di orologi antichi e ricostruzione di parti meccaniche dichiarate dal sito.',
  }),
  scheda({
    id: 'mazzone-salerno',
    nome: 'Orologeria Mazzone',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria a Salerno con assistenza tecnica per orologi meccanici, sostituzione batterie, revisione periodica e riparazione di pendoli, come dichiarato dal sito ufficiale.',
    localitaId: 'salerno',
    indirizzo: 'Via Posidonia 277/B', cap: '84128', fontiPosizione: ['t08-mazzone-sito'],
    telefono: '+39 089 754297', email: null, sito: 'https://www.orologeriamazzonesalerno.it/', fontiContatti: ['t08-mazzone-sito'],
    servizi: ['riparazione', 'revisione', 'riparazione-meccanici', 'batterie', 'pendoleria'],
    fontiVerifica: ['t08-mazzone-sito'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (orologeriamazzonesalerno.it). Servizi dichiarati: riparazioni pendoli, assistenza tecnica e riparazioni meccaniche, sostituzione batterie, revisione periodica. Il sito dichiara interventi «di ogni modello e marca» senza elenco specifico: nessun marchio attribuito.',
  }),
  scheda({
    id: 'carrieri-bari',
    nome: 'Carrieri Mastri Orologiai',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria e laboratorio a Bari in Via Sparano, con assistenza e manutenzione di cronografi, orologi da polso e da tasca, riparazione e costruzione di ricambi come documentato dalle pagine ufficiali.',
    localitaId: 'bari',
    indirizzo: 'Via Sparano 50', cap: '70121', fontiPosizione: ['t08-carrieri-contatti'],
    telefono: '+39 080 5210194', email: 'carrieriorologeria@libero.it', sito: 'https://www.orologeriacarrieri.com/', fontiContatti: ['t08-carrieri-contatti'],
    servizi: ['assistenza', 'manutenzione', 'riparazione', 'orologi-tasca', 'ricambi'],
    specializzazioni: [{ id: 'meccanici', fonti: ['t08-carrieri-laboratorio'] }],
    fontiVerifica: ['t08-carrieri-sito', 't08-carrieri-laboratorio', 't08-carrieri-contatti'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (orologeriacarrieri.com). Servizi di laboratorio documentati: assistenza e manutenzione di cronografi, orologi da polso e da tasca, riparazione e costruzione di ricambi. Elenco marchi e autorizzazioni non pubblicati: non attribuiti.',
  }),
  scheda({
    id: 'macchina-tempo-bari',
    nome: 'Orologeria La Macchina del Tempo',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria a Bari specializzata, come dichiara il sito ufficiale, in manutenzione e riparazione di orologi prestigiosi, con ricambi dichiarati originali per i marchi elencati e certificati di garanzia sugli interventi.',
    localitaId: 'bari',
    indirizzo: 'Via Argiro 29', cap: '70122', fontiPosizione: ['t08-macchtempo-bari'],
    telefono: '+39 080 5218963', email: 'deltempo@libero.it', sito: 'https://www.orologerialamacchinadeltempo.it/', fontiContatti: ['t08-macchtempo-bari'],
    servizi: ['manutenzione', 'riparazione', 'ricambi'],
    marchi: marchi('riparati', ['Omega', 'Longines', 'Rado', 'Tissot', 'Baume & Mercier', 'Hamilton'], ['t08-macchtempo-bari']),
    fontiVerifica: ['t08-macchtempo-bari'],
    azione: 'Incremento 08: identità, indirizzo, recapiti e marche riscontrati sul sito ufficiale (orologerialamacchinadeltempo.it). Le marche Omega, Longines, Rado, Tissot, Baume & Mercier e Hamilton sono elencate dal sito per manutenzione e ricambi: registrate come riparati, non come assistenza autorizzata (non dichiarata).',
  }),
  scheda({
    id: 'chlw-bari',
    nome: 'CHLW Orologeria — Laboratorio',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio di orologeria a Bari che documenta test con crono-comparatore, simulatore del tempo e prove di impermeabilità, con revisione, riparazione, restauro, lucidatura e valutazione gratuita dichiarate nelle pagine ufficiali.',
    localitaId: 'bari',
    indirizzo: 'Via Nicolò Putignani 54', cap: '70124', fontiPosizione: ['t08-chlw-contatti'],
    telefono: '+39 080 6977150', email: 'orologi@chlw.it', sito: 'https://www.chlw.it/', whatsapp: '+393920917747', fontiContatti: ['t08-chlw-contatti'],
    servizi: ['revisione', 'riparazione', 'restauro-vintage', 'lucidatura', 'valutazioni', 'ricambi'],
    altriServizi: [
      { nome: 'Test di impermeabilità, prove al crono-comparatore e simulatore del tempo', fonti: ['t08-chlw-laboratorio'] },
      { nome: 'Garanzia di quattro anni dichiarata dopo la manutenzione', fonti: ['t08-chlw-laboratorio'] },
    ],
    marchi: marchi('menzionati', ['Rolex', 'Tudor'], ['t08-chlw-sito']),
    fontiVerifica: ['t08-chlw-sito', 't08-chlw-servizi', 't08-chlw-laboratorio', 't08-chlw-contatti'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (chlw.it). Servizi dichiarati dalla pagina I Nostri Servizi e dal Laboratorio. Rolex e Tudor sono citati dal sito nell’offerta di orologi di lusso: registrati come menzionati, non come riparati o autorizzati.',
  }),
  scheda({
    id: 'bruno-emanuele-palermo',
    nome: 'Bruno Emanuele Orologeria',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria a Palermo che dichiara riparazione di sveglie, cronometri, pendole ed orologi prestigiosi, sostituzione di cinturini, pile, quadranti, vetri e corone, manutenzione di orologi da polso, da tasca e da tavolo con rispetto dei meccanismi originali.',
    localitaId: 'palermo',
    indirizzo: 'Via Antonio Gagini 93', cap: '90133', fontiPosizione: ['t08-bruno-riparazione'],
    telefono: '+39 091 583467', email: 'brunoemanuele@live.it', sito: 'https://brunoemanuele.com/', whatsapp: '+39091583467', fontiContatti: ['t08-bruno-riparazione'],
    servizi: ['riparazione', 'manutenzione', 'orologi-tasca', 'pendoleria', 'batterie', 'cinturini'],
    altriServizi: [{ nome: 'Sostituzione quadranti, vetri e corone', fonti: ['t08-bruno-riparazione'] }],
    fontiVerifica: ['t08-bruno-sito', 't08-bruno-riparazione'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (brunoemanuele.com, pagina riparazione orologi). Elenco marchi e autorizzazioni non pubblicati: non attribuiti.',
  }),
  scheda({
    id: 'cagnina-palermo',
    nome: 'La Cagnina Dario — Laboratorio di Orologeria',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio di orologeria a Palermo che dichiara polissage (pulitura e lucidatura) e riparazione di orologi, oltre a vendita di orologi nuovi e occasioni di secondo polso vintage.',
    localitaId: 'palermo',
    indirizzo: 'Via Terrasanta 61', cap: '90141', fontiPosizione: ['t08-cagnina-sito'],
    telefono: '+39 091 7527734', email: 'dariolacagnina@hotmail.com', sito: 'https://www.orologerialacagninadario.com/', fontiContatti: ['t08-cagnina-sito'],
    servizi: ['riparazione', 'lucidatura', 'vendita-nuovi', 'vendita-usati'],
    specializzazioni: [{ id: 'vintage', fonti: ['t08-cagnina-sito'] }],
    marchi: {
      ...marchi('venduti', ['Orient', 'Seiko', 'Ferrari', 'Invicta'], ['t08-cagnina-sito']),
      ...marchi('menzionati', ['Cartier', 'Omega', 'Rolex', 'Zenith', 'Baume & Mercier'], ['t08-cagnina-sito']),
    },
    fontiVerifica: ['t08-cagnina-sito'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (orologerialacagninadario.com). Vendita di orologi nuovi (Orient, Seiko, Ferrari, Invicta) e occasioni vintage di secondo polso (Cartier, Omega, Rolex, Zenith, Baume & Mercier) dichiarate dal sito. Il sito cita un orologiaio «accreditato presso una delle maggiori case svizzere» senza nominarla: nessuna autorizzazione attribuita.',
  }),
  scheda({
    id: 'di-caro-palermo',
    nome: 'Orologeria Di Caro',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria a Palermo con riparazione e manutenzione di orologi e vendita di orologi da collezione, pezzi unici e vintage. Il sito si dichiara centro assistenza ufficiale per alcuni marchi: autorizzazione non riscontrata su fonte del marchio e non attribuita come ufficiale.',
    localitaId: 'palermo',
    indirizzo: 'Via Villareale 67', cap: '90141', fontiPosizione: ['t08-dicaro-contatti'],
    telefono: '+39 091 584512', email: null, sito: 'https://www.orologeriadicaro.com/', fontiContatti: ['t08-dicaro-contatti'],
    servizi: ['riparazione', 'manutenzione', 'vendita'],
    marchi: {
      ...marchi('venduti', ['Hamilton', 'Seiko', 'Omega', 'Citizen'], ['t08-dicaro-sito']),
      ...marchi('riparati', ['Cartier', 'Baume & Mercier'], ['t08-dicaro-sito']),
    },
    fontiVerifica: ['t08-dicaro-sito', 't08-dicaro-contatti'],
    azione: 'Incremento 08: identità, indirizzo e telefono riscontrati sul sito ufficiale (orologeriadicaro.com). Riparazione, manutenzione e vendita dichiarate dal sito. La dichiarazione «centro assistenza ufficiale e certificato» per Cartier, Baume & Mercier, Omega e Hamilton proviene dal solo sito dell’attività: non trascritta in assistenzaUfficiale perché priva di fonte del marchio.',
  }),
  scheda({
    id: 'watch-center-palermo',
    nome: 'Watch Center — Laboratorio di Assistenza',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio di assistenza a Palermo che dichiara interventi su ogni tipo di orologio: sostituzione batterie, vetri e cinturini, revisione di orologi meccanici, restauro di orologi antichi e a pendolo, controllo impermeabilità, rifacimento quadranti e lucidatura, oltre a orologi di secondo polso garantiti.',
    localitaId: 'palermo',
    indirizzo: 'Via Nunzio Morello 18/E', cap: null, fontiPosizione: ['t08-watchcenter-termini'],
    telefono: '+39 091 586773', email: 'info@watchcenterassistance.it', sito: 'https://watch-center.eu/', fontiContatti: ['t08-watchcenter-termini'],
    servizi: ['riparazione', 'revisione', 'batterie', 'cinturini', 'restauro-vintage', 'pendoleria', 'lucidatura', 'vendita-usati'],
    altriServizi: [{ nome: 'Controllo impermeabilità e rifacimento quadranti', fonti: ['t08-watchcenter-sito'] }],
    marchi: marchi('menzionati', ['Rolex', 'Omega', 'Baume & Mercier', 'Breitling', 'Zenith', 'TAG Heuer', 'Eberhard', 'Maurice Lacroix', 'Bulova'], ['t08-watchcenter-sito']),
    fontiVerifica: ['t08-watchcenter-sito', 't08-watchcenter-termini'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (watch-center.eu, pagina Termini e condizioni). CAP non pubblicato nelle pagine consultate: non dedotto. Le marche citate dal sito sono registrate come menzionati; la dicitura «Laboratorio Certificato» non è stata trascritta come autorizzazione di marca.',
  }),
  scheda({
    id: 'censi-genova',
    nome: 'Alfio Censi',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio orologiaio a Genova che dichiara riparazione di orologi di qualsiasi marca, restauro di orologi antichi (pendole, orologi, sveglie e ogni segnatempo), perizie e stime.',
    localitaId: 'genova',
    indirizzo: 'Via Canevari 264 R', cap: '16137', fontiPosizione: ['t08-censi-sito'],
    telefono: null, email: 'info@censi.it', sito: 'https://www.alfiocensi.it/', fontiContatti: ['t08-censi-sito'],
    servizi: ['riparazione', 'restauro-vintage', 'pendoleria', 'valutazioni'],
    specializzazioni: [{ id: 'antichi', fonti: ['t08-censi-sito'] }],
    marchi: marchi('menzionati', ['Rolex', 'Omega', 'Zenith'], ['t08-censi-sito']),
    fontiVerifica: ['t08-censi-sito'],
    azione: 'Incremento 08: identità, indirizzo ed e-mail riscontrati sul sito ufficiale (alfiocensi.it). Riparazione di qualsiasi marca, restauro di orologi antichi, pendole e sveglie, perizie e stime dichiarate dal sito. Nessuna autorizzazione di marchio dichiarata o attribuita.',
  }),
  scheda({
    id: 'astrua-genova',
    nome: 'Astrua 1860 — sede di Genova',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Sede di Genova di Astrua 1860, con valutazione, restauro, riparazione, manutenzione e revisione di orologi come documentato dalle pagine ufficiali della sede.',
    localitaId: 'genova', gruppoId: 'astrua-1860',
    indirizzo: 'Via Roma 68', cap: '16121', fontiPosizione: ['t08-astrua-genova'],
    telefono: '+39 010 5959737', email: null, sito: 'https://www.astrua.com/', fontiContatti: ['t08-astrua-genova'],
    servizi: ['valutazioni', 'manutenzione', 'revisione', 'riparazione', 'assistenza'],
    marchi: marchi('riparati', ['Cartier', 'Omega', 'Tudor', 'IWC Schaffhausen', 'Jaeger-LeCoultre'], ['t08-astrua-riparazione-genova']),
    fontiVerifica: ['t08-astrua-sito', 't08-astrua-genova', 't08-astrua-riparazione-genova'],
    azione: 'Incremento 08: sede, indirizzo e telefono riscontrati sul sito ufficiale (astrua.com). Servizi di valutazione, restauro, riparazione, manutenzione e revisione documentati dalle pagine della sede. Le marche indicate per l’assistenza sono registrate come riparati; la dicitura «Laboratorio di Assistenza Orologiera Ufficiale» non è trascritta come autorizzazione per singole marche, non confermate da fonti del marchio.',
  }),
  scheda({
    id: 'astrua-torino',
    nome: 'Astrua 1860 — sede di Torino',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Sede di Torino di Astrua 1860, in Piazza Carlo Alberto, con valutazione, restauro, riparazione, manutenzione e revisione di orologi come documentato dalle pagine ufficiali della sede.',
    localitaId: 'torino', gruppoId: 'astrua-1860',
    indirizzo: 'Via Cesare Battisti 15', cap: '10123', fontiPosizione: ['t08-astrua-torino'],
    telefono: '+39 011 5613873', email: null, sito: 'https://www.astrua.com/', fontiContatti: ['t08-astrua-torino'],
    servizi: ['valutazioni', 'manutenzione', 'revisione', 'riparazione', 'assistenza'],
    marchi: marchi('riparati', ['Rolex', 'Patek Philippe', 'Cartier', 'Omega', 'Tudor'], ['t08-astrua-riparazione-torino']),
    fontiVerifica: ['t08-astrua-sito', 't08-astrua-torino', 't08-astrua-riparazione-torino'],
    azione: 'Incremento 08: sede, indirizzo e telefono riscontrati sul sito ufficiale (astrua.com). Le marche indicate per l’assistenza sono registrate come riparati; dichiarazioni di ufficialità non trascritte senza fonte del marchio.',
  }),
  scheda({
    id: 'capo-torino',
    nome: 'Laboratorio Capo',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio orologiaio a Torino che dichiara revisioni complete, test di impermeabilità, smontaggi e lavaggi di ogni componente, lucidatura di cassa e bracciale e prove al cronocomparatore.',
    localitaId: 'torino',
    indirizzo: 'Corso Vittorio Emanuele II 78', cap: '10121', fontiPosizione: ['t08-capo-sito'],
    telefono: '+39 011 5621712', email: 'capo.roberto@libero.it', sito: 'https://www.laboratoriocapo.com/', fontiContatti: ['t08-capo-sito'],
    servizi: ['revisione', 'riparazione', 'manutenzione', 'lucidatura'],
    altriServizi: [{ nome: 'Test di impermeabilità e prove al cronocomparatore', fonti: ['t08-capo-sito'] }],
    marchi: marchi('riparati', ['Tissot', 'Longines', 'Omega', 'Baume & Mercier', 'Hamilton', 'Cartier', 'TAG Heuer'], ['t08-capo-sito']),
    fontiVerifica: ['t08-capo-sito'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (laboratoriocapo.com). Il sito si dichiara «Centro assistenza ufficiale» per sette marche: la dichiarazione resta dell’attività, le marche sono registrate come riparati e nessuna autorizzazione è attribuita senza fonte del marchio.',
  }),
  scheda({
    id: 'lab-alessandria',
    nome: 'Laboratorio di Orologeria — Alessandria',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio orologiaio a Alessandria che dichiara sostituzione immediata di pile e cinturini, riparazioni di ogni genere su orologi da polso, da parete, pendole e da tasca, lucidature, roditure e placcature in oro, con preventivi gratuiti.',
    localitaId: 'alessandria',
    indirizzo: 'Via Milano 22', cap: '15121', fontiPosizione: ['t08-lab-alessandria-orari'],
    telefono: '+39 348 7557349', email: null, sito: 'https://laboratorio-di-orologeria.webnode.it/', fontiContatti: ['t08-lab-alessandria-orari'],
    servizi: ['riparazione', 'batterie', 'cinturini', 'pendoleria', 'orologi-tasca', 'lucidatura'],
    altriServizi: [{ nome: 'Roditure e placcature in oro, preventivi gratuiti', fonti: ['t08-lab-alessandria-sito'] }],
    fontiVerifica: ['t08-lab-alessandria-sito', 't08-lab-alessandria-orari'],
    azione: 'Incremento 08: identità, indirizzo e cellulare riscontrati sul sito ufficiale dell’attività (laboratorio-di-orologeria.webnode.it, pagina orari e recapito). Marchi e autorizzazioni non pubblicati: non attribuiti.',
  }),
  scheda({
    id: 'bottega-del-tempo-roma',
    nome: 'La Bottega del Tempo',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio orologiaio a Roma in Via dell’Oca che dichiara riparazioni, restauri e collaudi di orologi storici, assistenza con parti originali, revisione, test di impermeabilità, sostituzione di batterie, cinturini e vetri, lucidatura e assistenza a orologi da tavolo e a pendolo.',
    localitaId: 'roma',
    indirizzo: 'Via dell’Oca 32', cap: '00186', fontiPosizione: ['t08-bottega-riparazione'],
    telefono: '+39 06 3224855', email: 'info@labottegadeltempo.it', sito: 'https://www.labottegadeltempo.it/', fontiContatti: ['t08-bottega-riparazione'],
    servizi: ['riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'lucidatura', 'pendoleria'],
    specializzazioni: [{ id: 'antichi', fonti: ['t08-bottega-riparazione'] }, { id: 'vintage', fonti: ['t08-bottega-riparazione'] }],
    altriServizi: [{ nome: 'Collaudi, test di impermeabilità e sostituzione vetri', fonti: ['t08-bottega-riparazione'] }],
    marchi: marchi('menzionati', ['Rolex', 'Vacheron Constantin', 'Valjoux'], ['t08-bottega-riparazione']),
    fontiVerifica: ['t08-bottega-sito', 't08-bottega-riparazione', 't08-bottega-chisiamo'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (labottegadeltempo.it). Servizi e restauro di orologi storici, da tavolo e a pendolo documentati dalle pagine ufficiali. Le marche citate per la disponibilità di ricambi sono registrate come menzionati; nessuna autorizzazione dichiarata o attribuita.',
  }),
  scheda({
    id: 'salamena-roma',
    nome: 'Salamena — Laboratorio di Orologeria',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio di orologeria a Roma che dichiara riparazioni di orologi da polso e a pendolo, revisioni, assistenza e sostituzioni, restauro di pendole antiche, lucidatura e rimozione graffi e consulenze.',
    localitaId: 'roma',
    indirizzo: 'Via Tommaso Campanella 33', cap: '00195', fontiPosizione: ['t08-salamena-pagine'],
    telefono: '+39 06 39735621', email: 'info@riparazioniorologiroma.it', sito: 'https://www.riparazioniorologiroma.it/', fontiContatti: ['t08-salamena-pagine'],
    servizi: ['riparazione', 'revisione', 'manutenzione', 'pendoleria', 'restauro-vintage', 'lucidatura'],
    specializzazioni: [{ id: 'antichi', fonti: ['t08-salamena-sito'] }],
    marchi: marchi('riparati', ['Rolex', 'Bulova', 'Cartier', 'Longines', 'Omega', 'Patek Philippe'], ['t08-salamena-sito']),
    fontiVerifica: ['t08-salamena-sito', 't08-salamena-pagine'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (riparazioniorologiroma.it). Riparazione e revisione di orologi dei marchi elencati dichiarate dal sito come «certificata»: marchi registrati come riparati, la certificazione non trascritta come autorizzazione ufficiale (priva di fonte del marchio).',
  }),
  scheda({
    id: 'portanova-bologna',
    nome: 'Laboratorio PortaNova',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio di orologeria a Bologna, a 300 metri da Piazza Maggiore, specializzato come dichiara il sito in orologi meccanici, automatici, al quarzo e cronografi, con interventi su movimenti (ripristino dell’usura, tornitura, lavaggio, lubrificazione) e restauro di casse.',
    localitaId: 'bologna',
    indirizzo: 'Via Portanova 10/A', cap: '40123', fontiPosizione: ['t08-portanova-contatti'],
    telefono: '+39 051 264988', email: 'laboratorioportanova@gmail.com', sito: 'https://www.laboratorioportanova.eu/', fontiContatti: ['t08-portanova-contatti'],
    servizi: ['riparazione', 'revisione', 'manutenzione', 'riparazione-meccanici', 'riparazione-automatici', 'riparazione-quarzo', 'restauro-vintage'],
    specializzazioni: [{ id: 'meccanici', fonti: ['t08-portanova-sito'] }, { id: 'automatici', fonti: ['t08-portanova-sito'] }, { id: 'vintage', fonti: ['t08-portanova-sito'] }],
    marchi: marchi('menzionati', ['Rolex', 'Universal'], ['t08-portanova-sito']),
    fontiVerifica: ['t08-portanova-sito', 't08-portanova-contatti'],
    azione: 'Incremento 08: identità, indirizzo e recapiti riscontrati sul sito ufficiale (laboratorioportanova.eu, pagine Contatti e Dove Siamo). Interventi su movimenti automatici e restauro di casse documentati dalle pagine del sito; interventi mostrati su movimento Rolex e Universal Tricompax registrati come menzionati. Nessuna autorizzazione di marchio dichiarata o attribuita.',
  }),
];

data.attivita.push(...nuoveAttivita);
const checked = directorySchema.parse(data);

// I record preesistenti non devono cambiare.
for (const b of before) {
  const current = checked.attivita.find(x => x.id === b.id);
  if (JSON.stringify(b) !== JSON.stringify(current)) throw new Error(`Record preesistente alterato: ${b.id}`);
}

const dupes = findDuplicates(checked).filter(d => [d.primo, d.secondo].some(id => newIds.includes(id)));
if (dupes.some(d => d.esito === 'da-revisionare')) throw new Error(`Possibili duplicati da revisionare: ${JSON.stringify(dupes)}`);

await writeFile(path, JSON.stringify(checked, null, 2) + '\n');
console.log(`Integrate: ${checked.attivita.length - before.length} attività; totale ${checked.attivita.length} in ${checked.localita.length} comuni.`);
console.log(`Sedi distinte riconosciute: ${dupes.filter(d => d.esito === 'sedi-distinte').map(d => `${d.primo}/${d.secondo}`).join(', ') || 'nessuna'}`);
