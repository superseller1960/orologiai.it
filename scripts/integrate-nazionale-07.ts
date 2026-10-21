import { readFile, writeFile } from 'node:fs/promises';
import { businessSchema, directorySchema, localitySchema, type Business, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

// Incremento 07: integrazione di 6 attività con fonti ufficiali verificate (Firenze, San Giovanni Valdarno,
// Bologna, Torino, Roma, Vicenza) per ampliare copertura geografica e categorie sottorappresentate.
// Lo script è idempotente e rifiuta di eseguirsi se i record esistono già.
const path = 'site/data/directory.json';
const today = '2026-10-19';
const data: Directory = directorySchema.parse(JSON.parse(await readFile(path, 'utf8')));
const before = structuredClone(data.attivita);

const newIds = [
  'macchina-tempo-firenze',
  'horamundi-firenze',
  'horae-san-giovanni',
  'fontana-bologna',
  'orologica-torino',
  'casa-cronometro-roma',
  'soprana-vicenza',
];

if (data.attivita.some(b => newIds.includes(b.id))) {
  throw new Error('Attività già integrate: nessuna seconda scheda.');
}
if (data.fonti.some(s => s.id.startsWith('t07-'))) throw new Error('Fonti incremento 07 già presenti.');

data.fonti.push(
  { id: 't07-macchina-tempo-sito', tipo: 'sito-ufficiale', url: 'https://www.lamacchinadeltempo.org/', titolo: 'La Macchina del Tempo — homepage e servizi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-macchina-tempo-contatti', tipo: 'sito-ufficiale', url: 'https://www.lamacchinadeltempo.org/contatti/', titolo: 'La Macchina del Tempo — contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-horamundi-sito', tipo: 'sito-ufficiale', url: 'https://www.horamundi.it/', titolo: 'Hora Mundi — Orologi da Collezione Firenze', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-horae-lab', tipo: 'sito-ufficiale', url: 'https://www.horaeorologeria.it/laboratorio/', titolo: 'Horae Orologeria — Laboratorio di Orologeria', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-horae-contatti', tipo: 'sito-ufficiale', url: 'https://www.horaeorologeria.it/contatti/', titolo: 'Horae Orologeria — Contatti', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-fontana-lab', tipo: 'sito-ufficiale', url: 'https://www.natalefontana.it/it/laboratorio-gioielleria-orologeria', titolo: 'Natale Fontana Lab Bologna — Laboratorio gioielleria e orologeria', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-orologica-sito', tipo: 'sito-ufficiale', url: 'https://www.orologicatorino.it/', titolo: 'Orologica Torino — Laboratorio Orologiaio e servizi', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-orologica-contatti', tipo: 'sito-ufficiale', url: 'https://www.orologicatorino.it/contatti-laboratorio-orologi-torino/', titolo: 'Orologica Torino — Contatti e sede', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-casa-cronometro-sito', tipo: 'sito-ufficiale', url: 'https://www.casadelcronometro.it/', titolo: 'La Casa del Cronometro di Marco Musto — Laboratorio Orologeria Roma', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-soprana-lab', tipo: 'sito-ufficiale', url: 'https://www.soprana.com/laboratorio-orologeria/', titolo: 'Soprana dal 1910 — Laboratorio di orologeria e restauro', consultataIl: today, percorsoArchivio: null, licenza: null },
  { id: 't07-soprana-contatti', tipo: 'sito-ufficiale', url: 'https://www.soprana.com/contatti/', titolo: 'Soprana dal 1910 — Boutique e contatti Vicenza', consultataIl: today, percorsoArchivio: null, licenza: null },
);

const nuoveLocalita = [
  {
    id: 'san-giovanni-valdarno', comune: 'San Giovanni Valdarno', comuneSlug: 'san-giovanni-valdarno',
    provincia: 'Arezzo', provinciaSlug: 'arezzo', siglaProvincia: 'AR',
    regione: 'Toscana', regioneSlug: 'toscana', codiceIstat: '051033',
    descrizione: 'Centro del Valdarno Superiore in provincia di Arezzo, con attività orologiaia e laboratorio censiti.',
    fonti: ['t07-horae-contatti'],
  },
  {
    id: 'bologna', comune: 'Bologna', comuneSlug: 'bologna',
    provincia: 'Bologna', provinciaSlug: 'bologna', siglaProvincia: 'BO',
    regione: 'Emilia-Romagna', regioneSlug: 'emilia-romagna', codiceIstat: '037006',
    descrizione: 'Capoluogo dell’Emilia-Romagna, con laboratori storici di riparazione, restauro e assistenza orologiaia.',
    fonti: ['t07-fontana-lab'],
  },
  {
    id: 'torino', comune: 'Torino', comuneSlug: 'torino',
    provincia: 'Torino', provinciaSlug: 'torino', siglaProvincia: 'TO',
    regione: 'Piemonte', regioneSlug: 'piemonte', codiceIstat: '001272',
    descrizione: 'Capoluogo piemontese con tradizione nella tecnica orologiaia, nella revisione e nella riparazione di segnatempo.',
    fonti: ['t07-orologica-contatti'],
  },
  {
    id: 'roma', comune: 'Roma', comuneSlug: 'roma',
    provincia: 'Roma', provinciaSlug: 'roma', siglaProvincia: 'RM',
    regione: 'Lazio', regioneSlug: 'lazio', codiceIstat: '058091',
    descrizione: 'Capitale d’Italia, con laboratori specializzati nella riparazione di cronografi, orologi da polso, da tasca e pendoleria.',
    fonti: ['t07-casa-cronometro-sito'],
  },
  {
    id: 'vicenza', comune: 'Vicenza', comuneSlug: 'vicenza',
    provincia: 'Vicenza', provinciaSlug: 'vicenza', siglaProvincia: 'VI',
    regione: 'Veneto', regioneSlug: 'veneto', codiceIstat: '024116',
    descrizione: 'Storico polo orafo e orologiaio veneto, con laboratori di manutenzione e restauro di segnatempo antichi e moderni.',
    fonti: ['t07-soprana-contatti'],
  },
];

for (const loc of nuoveLocalita) {
  if (!data.localita.some(p => p.id === loc.id)) {
    data.localita.push(localitySchema.parse(loc));
  }
}

const nuoveAttivita: Business[] = [
  businessSchema.parse({
    id: 'macchina-tempo-firenze',
    slug: 'macchina-tempo-firenze',
    nome: 'La Macchina del Tempo',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Officina del tempo a Firenze che offre revisioni e manutenzioni per orologi automatici, a carica manuale e al quarzo, restauro di orologi meccanici a pendolo e cucù e cinturini personalizzati.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'firenze',
    posizione: { indirizzo: 'Via Guelfa 1/G', cap: '50129', coordinate: null, fonti: ['t07-macchina-tempo-sito', 't07-macchina-tempo-contatti'] },
    contatti: {
      telefono: '+39 055 291994',
      email: 'leobiagi72@gmail.com',
      sito: 'https://www.lamacchinadeltempo.org/',
      whatsapp: null,
      social: [],
      fonti: ['t07-macchina-tempo-contatti'],
    },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: [
      { id: 'riparazione', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'revisione', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'manutenzione', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'riparazione-automatici', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'riparazione-meccanici', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'riparazione-quarzo', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'restauro-vintage', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'pendoleria', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'cinturini', fonti: ['t07-macchina-tempo-sito'] },
    ],
    altriServizi: [],
    specializzazioni: [
      { id: 'automatici', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'meccanici', fonti: ['t07-macchina-tempo-sito'] },
      { id: 'antichi', fonti: ['t07-macchina-tempo-sito'] },
    ],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-macchina-tempo-sito', 't07-macchina-tempo-contatti'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: candidato OSM node/10804755206 promosso dopo riscontro sul sito ufficiale (lamacchinadeltempo.org). Indirizzo, contatti e servizi di revisione, restauro pendoleria e cinturini documentati.',
        fonti: ['t07-macchina-tempo-sito', 't07-macchina-tempo-contatti'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'osm', idOriginale: 'node/10804755206' },
  }),

  businessSchema.parse({
    id: 'horamundi-firenze',
    slug: 'horamundi-firenze',
    nome: 'Hora Mundi — Orologi da Collezione',
    tipi: ['orologeria'],
    descrizione: 'Orologeria a Firenze dedicata a orologi antichi e moderni da collezione, vendita, acquisto, permute e valutazioni.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'firenze',
    posizione: { indirizzo: 'Via dei Fossi 21r', cap: '50123', coordinate: null, fonti: ['t07-horamundi-sito'] },
    contatti: {
      telefono: '+39 055 219020',
      email: 'info@horamundi.it',
      sito: 'https://www.horamundi.it/',
      whatsapp: null,
      social: [],
      fonti: ['t07-horamundi-sito'],
    },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: [
      { id: 'vendita', fonti: ['t07-horamundi-sito'] },
      { id: 'vendita-usati', fonti: ['t07-horamundi-sito'] },
      { id: 'acquisto-permuta', fonti: ['t07-horamundi-sito'] },
      { id: 'valutazioni', fonti: ['t07-horamundi-sito'] },
    ],
    altriServizi: [],
    specializzazioni: [
      { id: 'antichi', fonti: ['t07-horamundi-sito'] },
      { id: 'vintage', fonti: ['t07-horamundi-sito'] },
      { id: 'collezione', fonti: ['t07-horamundi-sito'] },
    ],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-horamundi-sito'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: candidato OSM node/7485085150 promosso dopo riscontro sul sito ufficiale (horamundi.it). Sede in Via dei Fossi 21r, contatti e servizi di vendita, acquisto, permuta e valutazioni di orologi da collezione documentati.',
        fonti: ['t07-horamundi-sito'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'osm', idOriginale: 'node/7485085150' },
  }),

  businessSchema.parse({
    id: 'horae-san-giovanni',
    slug: 'horae-san-giovanni',
    nome: 'Horae Orologeria e Gioielleria',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Orologeria e laboratorio interno a San Giovanni Valdarno (AR) attivo dal 1986, con servizi di revisione completa, riparazione, lucidatura e vendita di orologi di secondo polso.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'san-giovanni-valdarno',
    posizione: { indirizzo: 'Piazza Cavour 11', cap: '52027', coordinate: null, fonti: ['t07-horae-contatti'] },
    contatti: {
      telefono: '+39 055 941596',
      email: 'info@horaeorologeria.it',
      sito: 'https://www.horaeorologeria.it/',
      whatsapp: '+393394165545',
      social: [],
      fonti: ['t07-horae-contatti'],
    },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: [
      { id: 'vendita-usati', fonti: ['t07-horae-lab'] },
      { id: 'riparazione', fonti: ['t07-horae-lab'] },
      { id: 'revisione', fonti: ['t07-horae-lab'] },
      { id: 'manutenzione', fonti: ['t07-horae-lab'] },
      { id: 'lucidatura', fonti: ['t07-horae-lab'] },
      { id: 'ricambi', fonti: ['t07-horae-lab'] },
    ],
    altriServizi: [],
    specializzazioni: [
      { id: 'lusso', fonti: ['t07-horae-lab'] },
      { id: 'vintage', fonti: ['t07-horae-lab'] },
    ],
    marchi: {
      venduti: [
        { marca: 'Rolex', fonti: ['t07-horae-lab'] },
        { marca: 'Audemars Piguet', fonti: ['t07-horae-lab'] },
        { marca: 'Omega', fonti: ['t07-horae-lab'] },
        { marca: 'Cartier', fonti: ['t07-horae-lab'] },
      ],
      riparati: [
        { marca: 'Omega', fonti: ['t07-horae-lab'] },
        { marca: 'Longines', fonti: ['t07-horae-lab'] },
        { marca: 'Tissot', fonti: ['t07-horae-lab'] },
        { marca: 'Rado', fonti: ['t07-horae-lab'] },
        { marca: 'Hamilton', fonti: ['t07-horae-lab'] },
        { marca: 'TAG Heuer', fonti: ['t07-horae-lab'] },
        { marca: 'Zenith', fonti: ['t07-horae-lab'] },
        { marca: 'Seiko', fonti: ['t07-horae-lab'] },
      ],
      esperienza: [
        { marca: 'Rolex', fonti: ['t07-horae-lab'] },
        { marca: 'Audemars Piguet', fonti: ['t07-horae-lab'] },
        { marca: 'Cartier', fonti: ['t07-horae-lab'] },
      ],
      assistenzaUfficiale: [],
      rivenditaUfficiale: [],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1986,
      fondatore: null,
      testo: 'Attività fondata nel 1986 a San Giovanni Valdarno, dotata di laboratorio orologiaio interno per la revisione e la manutenzione di orologi di prestigio.',
      eventi: [],
      fonti: ['t07-horae-lab'],
    },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-horae-lab', 't07-horae-contatti'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: scheda verificata tramite sito ufficiale (horaeorologeria.it). Certificazioni dei tecnici riportate come marchi riparati/esperienza; nessuna assistenza ufficiale attribuita in assenza di locator diretto della casa madre.',
        fonti: ['t07-horae-lab', 't07-horae-contatti'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-nazionale-07', idOriginale: 'horae-san-giovanni' },
  }),

  businessSchema.parse({
    id: 'fontana-bologna',
    slug: 'fontana-bologna',
    nome: 'Natale Fontana Lab',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Storico laboratorio di riparazione, revisione e restauro orologi a Bologna, attivo dal 1909 per orologi meccanici, automatici, al quarzo e antichi, con servizio di ricambi, lucidatura, cinturini e test di impermeabilità.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'bologna',
    posizione: { indirizzo: 'Via Indipendenza 15', cap: '40121', coordinate: null, fonti: ['t07-fontana-lab'] },
    contatti: {
      telefono: '+39 051 239544',
      email: 'info@natalefontana.it',
      sito: 'https://www.natalefontana.it/it/laboratorio-gioielleria-orologeria',
      whatsapp: null,
      social: [],
      fonti: ['t07-fontana-lab'],
    },
    orari: {
      giorni: [
        { giorno: 1, intervalli: [{ apertura: '10:00', chiusura: '18:00' }] },
        { giorno: 2, intervalli: [{ apertura: '10:00', chiusura: '18:00' }] },
        { giorno: 3, intervalli: [{ apertura: '10:00', chiusura: '18:00' }] },
        { giorno: 4, intervalli: [] },
        { giorno: 5, intervalli: [{ apertura: '10:00', chiusura: '18:00' }] },
        { giorno: 6, intervalli: [{ apertura: '10:00', chiusura: '18:00' }] },
      ],
      chiusure: ['Giovedì chiuso', 'Domenica chiuso'],
      verificatiIl: today,
      fonti: ['t07-fontana-lab'],
    },
    servizi: [
      { id: 'riparazione', fonti: ['t07-fontana-lab'] },
      { id: 'revisione', fonti: ['t07-fontana-lab'] },
      { id: 'manutenzione', fonti: ['t07-fontana-lab'] },
      { id: 'restauro-vintage', fonti: ['t07-fontana-lab'] },
      { id: 'riparazione-meccanici', fonti: ['t07-fontana-lab'] },
      { id: 'riparazione-automatici', fonti: ['t07-fontana-lab'] },
      { id: 'riparazione-quarzo', fonti: ['t07-fontana-lab'] },
      { id: 'batterie', fonti: ['t07-fontana-lab'] },
      { id: 'cinturini', fonti: ['t07-fontana-lab'] },
      { id: 'ricambi', fonti: ['t07-fontana-lab'] },
      { id: 'lucidatura', fonti: ['t07-fontana-lab'] },
    ],
    altriServizi: [
      { nome: 'Test di impermeabilità fino a 8 ATM e violettatura viti del movimento', fonti: ['t07-fontana-lab'] },
    ],
    specializzazioni: [
      { id: 'antichi', fonti: ['t07-fontana-lab'] },
      { id: 'meccanici', fonti: ['t07-fontana-lab'] },
      { id: 'automatici', fonti: ['t07-fontana-lab'] },
    ],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1909,
      fondatore: 'Natale Fontana',
      testo: 'Dal 1909 la famiglia Fontana affianca alla vendita un laboratorio di riparazione e restauro di orologi nuovi e antichi sotto i portici di Via Indipendenza a Bologna.',
      eventi: [],
      fonti: ['t07-fontana-lab'],
    },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-fontana-lab'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: scheda verificata tramite pagina ufficiale del laboratorio (natalefontana.it). Indirizzo, contatti, orari e servizi tecnici documentati.',
        fonti: ['t07-fontana-lab'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-nazionale-07', idOriginale: 'fontana-bologna' },
  }),

  businessSchema.parse({
    id: 'orologica-torino',
    slug: 'orologica-torino',
    nome: 'Orologica — Laboratorio Orologiaio',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio di orologeria a Torino (quartiere Crocetta) specializzato in riparazione, revisione con garanzia, sostituzione vetri, pile e cinturini, restauro cassa e bracciale e ripristino impermeabilità.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'torino',
    posizione: { indirizzo: 'Corso Alcide De Gasperi 5/M', cap: '10129', coordinate: null, fonti: ['t07-orologica-sito', 't07-orologica-contatti'] },
    contatti: {
      telefono: '+39 011 364404',
      email: 'info@orologicatorino.it',
      sito: 'https://www.orologicatorino.it/',
      whatsapp: null,
      social: [],
      fonti: ['t07-orologica-contatti'],
    },
    orari: {
      giorni: [
        { giorno: 1, intervalli: [{ apertura: '09:00', chiusura: '13:00' }, { apertura: '14:00', chiusura: '19:00' }] },
        { giorno: 2, intervalli: [{ apertura: '09:00', chiusura: '13:00' }, { apertura: '14:00', chiusura: '19:00' }] },
        { giorno: 3, intervalli: [{ apertura: '09:00', chiusura: '13:00' }, { apertura: '14:00', chiusura: '19:00' }] },
        { giorno: 4, intervalli: [{ apertura: '09:00', chiusura: '13:00' }, { apertura: '14:00', chiusura: '19:00' }] },
        { giorno: 5, intervalli: [{ apertura: '09:00', chiusura: '13:00' }, { apertura: '14:00', chiusura: '19:00' }] },
        { giorno: 6, intervalli: [{ apertura: '09:00', chiusura: '13:00' }] },
      ],
      chiusure: ['Sabato pomeriggio chiuso', 'Domenica chiuso'],
      verificatiIl: today,
      fonti: ['t07-orologica-sito', 't07-orologica-contatti'],
    },
    servizi: [
      { id: 'riparazione', fonti: ['t07-orologica-sito'] },
      { id: 'revisione', fonti: ['t07-orologica-sito'] },
      { id: 'manutenzione', fonti: ['t07-orologica-sito'] },
      { id: 'assistenza', fonti: ['t07-orologica-sito'] },
      { id: 'riparazione-meccanici', fonti: ['t07-orologica-sito'] },
      { id: 'batterie', fonti: ['t07-orologica-sito'] },
      { id: 'cinturini', fonti: ['t07-orologica-sito'] },
      { id: 'ricambi', fonti: ['t07-orologica-sito'] },
      { id: 'lucidatura', fonti: ['t07-orologica-sito'] },
      { id: 'acquisto-permuta', fonti: ['t07-orologica-sito'] },
    ],
    altriServizi: [
      { nome: 'Sostituzione vetri e ripristino impermeabilità per orologi subacquei', fonti: ['t07-orologica-sito'] },
    ],
    specializzazioni: [
      { id: 'meccanici', fonti: ['t07-orologica-sito'] },
      { id: 'automatici', fonti: ['t07-orologica-sito'] },
    ],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Omega', fonti: ['t07-orologica-sito'] },
        { marca: 'Hamilton', fonti: ['t07-orologica-sito'] },
        { marca: 'Tissot', fonti: ['t07-orologica-sito'] },
        { marca: 'Rolex', fonti: ['t07-orologica-sito'] },
        { marca: 'Longines', fonti: ['t07-orologica-sito'] },
        { marca: 'Zenith', fonti: ['t07-orologica-sito'] },
        { marca: 'Rado', fonti: ['t07-orologica-sito'] },
      ],
      esperienza: [],
      assistenzaUfficiale: [],
      rivenditaUfficiale: [],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-orologica-sito', 't07-orologica-contatti'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: scheda verificata tramite sito ufficiale (orologicatorino.it). I marchi per cui il laboratorio dichiara assistenza sono registrati come marchi riparati (nessuna assistenzaUfficiale attribuita senza riscontro diretto sul locator della casa madre).',
        fonti: ['t07-orologica-sito', 't07-orologica-contatti'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-nazionale-07', idOriginale: 'orologica-torino' },
  }),

  businessSchema.parse({
    id: 'casa-cronometro-roma',
    slug: 'casa-cronometro-roma',
    nome: 'La Casa del Cronometro di Marco Musto',
    tipi: ['laboratorio', 'orologeria'],
    descrizione: 'Laboratorio di orologeria a Roma (zona Prati) attivo dal 1965, specializzato in riparazione, revisione e restauro di orologi da polso, orologi da tasca e pendoleria, sostituzione vetri anche su misura e cinturini artigianali.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'roma',
    posizione: { indirizzo: 'Via Silla 80', cap: '00192', coordinate: null, fonti: ['t07-casa-cronometro-sito'] },
    contatti: {
      telefono: '+39 06 3210971',
      email: 'marcomusto@virgilio.it',
      sito: 'https://www.casadelcronometro.it/',
      whatsapp: null,
      social: [],
      fonti: ['t07-casa-cronometro-sito'],
    },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: [
      { id: 'riparazione', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'revisione', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'manutenzione', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'restauro-vintage', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'riparazione-automatici', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'riparazione-meccanici', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'riparazione-quarzo', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'orologi-tasca', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'pendoleria', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'ricambi', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'batterie', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'cinturini', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'vendita-nuovi', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'vendita-usati', fonti: ['t07-casa-cronometro-sito'] },
    ],
    altriServizi: [
      { nome: 'Lucidatura vetri in esalite, sostituzione vetri su misura e prove di impermeabilità fino a 10 bar', fonti: ['t07-casa-cronometro-sito'] },
    ],
    specializzazioni: [
      { id: 'antichi', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'vintage', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'meccanici', fonti: ['t07-casa-cronometro-sito'] },
      { id: 'automatici', fonti: ['t07-casa-cronometro-sito'] },
    ],
    marchi: {
      venduti: [
        { marca: 'Citizen', fonti: ['t07-casa-cronometro-sito'] },
      ],
      riparati: [
        { marca: 'Rolex', fonti: ['t07-casa-cronometro-sito'] },
        { marca: 'Audemars Piguet', fonti: ['t07-casa-cronometro-sito'] },
      ],
      esperienza: [],
      assistenzaUfficiale: [],
      rivenditaUfficiale: [],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1965,
      fondatore: null,
      testo: 'Laboratorio di orologeria attivo dal 1965 a Roma nel quartiere Prati, alle spalle di Via Cola di Rienzo.',
      eventi: [],
      fonti: ['t07-casa-cronometro-sito'],
    },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-casa-cronometro-sito'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: scheda verificata tramite sito ufficiale (casadelcronometro.it). Indirizzo, contatti e servizi di riparazione orologi da polso, tasca, pendoleria, vetri e cinturini documentati.',
        fonti: ['t07-casa-cronometro-sito'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-nazionale-07', idOriginale: 'casa-cronometro-roma' },
  }),

  businessSchema.parse({
    id: 'soprana-vicenza',
    slug: 'soprana-vicenza',
    nome: 'Soprana dal 1910 — Laboratorio di Orologeria e Restauro',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Storica orologeria e gioielleria sotto la Basilica Palladiana a Vicenza, dotata di laboratorio di orologeria con tecnici diplomati WOSTEP e laboratorio di restauro per orologi da polso, da tasca e pendoleria antica.',
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: 'vicenza',
    posizione: { indirizzo: 'Piazzetta Palladio 2', cap: '36100', coordinate: null, fonti: ['t07-soprana-contatti'] },
    contatti: {
      telefono: '+39 0444 320788',
      email: 'soprana@soprana.com',
      sito: 'https://www.soprana.com/laboratorio-orologeria/',
      whatsapp: '+393383033363',
      social: [],
      fonti: ['t07-soprana-contatti'],
    },
    orari: {
      giorni: [
        { giorno: 2, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '19:30' }] },
        { giorno: 3, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '19:30' }] },
        { giorno: 4, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '19:30' }] },
        { giorno: 5, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '19:30' }] },
        { giorno: 6, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '19:30' }] },
      ],
      chiusure: ['Lunedì chiuso', 'Domenica chiuso'],
      verificatiIl: today,
      fonti: ['t07-soprana-contatti'],
    },
    servizi: [
      { id: 'vendita', fonti: ['t07-soprana-contatti'] },
      { id: 'riparazione', fonti: ['t07-soprana-lab'] },
      { id: 'revisione', fonti: ['t07-soprana-lab'] },
      { id: 'manutenzione', fonti: ['t07-soprana-lab'] },
      { id: 'restauro-vintage', fonti: ['t07-soprana-lab'] },
      { id: 'orologi-tasca', fonti: ['t07-soprana-lab'] },
      { id: 'pendoleria', fonti: ['t07-soprana-lab'] },
      { id: 'ricambi', fonti: ['t07-soprana-lab'] },
      { id: 'batterie', fonti: ['t07-soprana-lab'] },
      { id: 'lucidatura', fonti: ['t07-soprana-lab'] },
    ],
    altriServizi: [
      { nome: 'Sostituzione guarnizioni e vetri sintetici, smagnetizzazione e prove di impermeabilità', fonti: ['t07-soprana-lab'] },
    ],
    specializzazioni: [
      { id: 'antichi', fonti: ['t07-soprana-lab'] },
      { id: 'vintage', fonti: ['t07-soprana-lab'] },
      { id: 'meccanici', fonti: ['t07-soprana-lab'] },
      { id: 'lusso', fonti: ['t07-soprana-lab'] },
    ],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1910,
      fondatore: null,
      testo: 'Attiva dal 1910 sotto le logge della Basilica Palladiana a Vicenza, affianca alla boutique di orologeria un laboratorio tecnico e un laboratorio dedicato al restauro di orologi da polso, da tasca e da arredamento.',
      eventi: [],
      fonti: ['t07-soprana-lab', 't07-soprana-contatti'],
    },
    attendibilita: {
      stato: 'fonti-verificate',
      raccoltaIl: today,
      verificataIl: today,
      confermataTitolareIl: null,
      fonti: ['t07-soprana-lab', 't07-soprana-contatti'],
      cronologia: [{
        data: today,
        azione: 'Incremento 07: scheda verificata tramite sito ufficiale (soprana.com). Sede, contatti, orari e le 16 fasi di manutenzione e restauro su orologi da polso, da tasca e da arredamento documentate.',
        fonti: ['t07-soprana-lab', 't07-soprana-contatti'],
      }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-nazionale-07', idOriginale: 'soprana-vicenza' },
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
