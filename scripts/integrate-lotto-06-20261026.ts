// Lotto 6 di espansione nazionale (2026-10-26): Centro, Adriatico e Sud.
// Copre tutte le 10 province del Centro-Sud a 0 attività (PU, FM, TE, BN, AV, FG, BT, TA, BR, MT)
// e rafforza le province a 1 attività in Marche, Umbria, Lazio e Abruzzo (MC, CH, PG, TR, LT, VT).
// Uso: node --experimental-strip-types scripts/integrate-lotto-06-20261026.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory, type Business, type Locality } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-26';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;

if (directory.attivita.some(a => a.id === 'paolo-bartorelli-pesaro')) {
  console.error('Lotto 6 già applicato: nessuna modifica.');
  process.exit(1);
}

type Tipo = 'sito-ufficiale' | 'marchio-ufficiale' | 'directory' | 'stampa';
const nuoveFonti: { id: string; tipo: Tipo; url: string; titolo: string; consultataIl: string; percorsoArchivio: null; licenza: null }[] = [];
const u = (url: string, tipo: Tipo = 'sito-ufficiale', titoloCustom?: string): string => {
  const presente = directory.fonti.find(f => f.url === url);
  if (presente) return presente.id;
  const giaNuova = nuoveFonti.find(f => f.url === url);
  if (giaNuova) return giaNuova.id;
  const id = `l6-${url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 56).replace(/^-|-$/g, '')}`;
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  const path = url.replace(/^https?:\/\//, '').split('/').filter(Boolean).slice(1).join('/');
  nuoveFonti.push({
    id,
    tipo,
    url,
    titolo: titoloCustom ?? (path ? `Fonte ${host} — ${path}` : `Fonte ${host}`),
    consultataIl: DATA,
    percorsoArchivio: null,
    licenza: null,
  });
  return id;
};

const makeOrari = (giorniSpec: [number, ...string[]][], fonti: string[]): Business['orari'] => ({
  giorni: giorniSpec.map(([giorno, ...fasce]) => ({
    giorno,
    intervalli: fasce.map(f => {
      const [apertura, chiusura] = f.split('-');
      return { apertura, chiusura };
    }),
  })),
  chiusure: [],
  verificatiIl: giorniSpec.length ? DATA : null,
  fonti: giorniSpec.length ? fonti : [],
});

// --- Fonti verificate per il Lotto 6 ---
const BARTORELLI_LON = u('https://www.longines.com/it/store/id/paolo-bartorelli-gioielli-gioielli-dal-1882-pesaro-143081', 'marchio-ufficiale');
const CAPODAGLI_LON = u('https://www.longines.com/en-us/store/id/capodagli-pietro-snc-di-lauro-ivonne-c-fano-143193', 'marchio-ufficiale');
const CAPODAGLI_MIDO = u('https://www.midowatches.com/us/store-locator/italy/fano/', 'marchio-ufficiale');
const GRANARELLI_HAM = u('https://www.hamiltonwatch.com/en-my/store-locator/italien/marche/fano/gioielleria-granarelli', 'marchio-ufficiale');
const GRANARELLI_TIS = u('https://www.tissotwatches.com/it-it/store/gioielleria-granarelli-srl/a1vNN0000020LOQYA2', 'marchio-ufficiale');

const FELICI_LON = u('https://www.longines.com/it/store/id/felici-srl-porto-san-giorgio-488703', 'marchio-ufficiale');
const PANICHI_BREIL = u('https://www.breil.com/store/rivenditori-manta/gioielleria-panichi-dal-1954/', 'marchio-ufficiale');
const ROSATI_HOME = u('https://www.gioielleriarosati.com/pages/dove-siamo');
const ROSATI_ORIS = u('https://www.oris.ch/en-IT/storefinder/1092-perpetual-srl', 'marchio-ufficiale');

const IBIS_LON = u('https://www.longines.com/it/store/id/the-thomas-group-srl-ibis-civitanova-marche-1338787', 'marchio-ufficiale');
const IBIS_MIDO = u('https://www.midowatches.com/us/store-locator/italy/civitanova-marche/', 'marchio-ufficiale');
const COTOGNINI_SEIKO = u('https://www.seikowatches.com/it-it/stores/28648-1', 'marchio-ufficiale');

const ANGOLO_TE = u('https://www.langolodoroitalia.com/riparazioni-orologi-gioielli.php');
const MICHINI_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/abruzzo/roseto-degli-abruzzi/gioielleria-michini', 'marchio-ufficiale');
const MICHINI_HOME = u('https://gioielleriamichini.it/');
const FERRETTI_CH = u('https://www.ferrettigioielli.com/');

const SORBI_PG = u('https://www.oreficeriasorbi.com/servizi.php');
const MIDO_IT = u('https://www.midowatches.com/it/store-locator', 'marchio-ufficiale');
const TOMASINI_LON = u('https://www.longines.com/it/store/id/tomasini-francia-srl-terni-1676402', 'marchio-ufficiale');
const TOMASINI_TIS = u('https://www.tissotwatches.com/it-it/store/tomasini-francia-srl/a1vNN0000020cLvYAI', 'marchio-ufficiale');
const MASSARUCCI_TR = u('https://www.gioielleriamassarucci.com/riparazioni-assistenza/');

const GT_LATINA = u('https://gtorologerie.it/');
const GT_CONT = u('https://shop.gtorologerie.it/policies/contact-information');
const MENICHELLI_LON = u('https://www.longines.com/it/store/id/gioielli-di-menichelli-franco-c-srl-viterbo-1613375', 'marchio-ufficiale');

const ORZ_BN_LON = u('https://www.longines.com/en-ca/store/id/orzelleca-gioielli-benevento-1075440', 'marchio-ufficiale');
const ORZ_BN_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/benevento/orzelleca-gioielli', 'marchio-ufficiale');
const ORZ_STORIA = u('https://orzellecagioielli.it/azienda/');
const ORZ_HOME = u('https://orzellecagioielli.it/');

const ORZ_AV_LON = u('https://www.longines.com/it/store/id/isi-srl-orzelleca-avellino-1075445', 'marchio-ufficiale');
const ORZ_AV_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/avellino/orzelleca-gioielli', 'marchio-ufficiale');

const CILETTI_HOME = u('https://giuseppeciletti.it/');
const CILETTI_SERV = u('https://giuseppeciletti.it/servizi/');
const CILETTI_CONT = u('https://giuseppeciletti.it/contatti/');
const STRAVOLA_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/san-severo/stravola-gioiellieri', 'marchio-ufficiale');
const BANCONE_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/cerignola/nazareno-bancone-gioielli', 'marchio-ufficiale');

const LANDI_LON = u('https://www.longines.com/it/store/id/landi-gioiellieri-di-landriscina-domenico-barletta-143233', 'marchio-ufficiale');
const CUOMO_CONT = u('https://www.francocuomogioielli.it/contatti.html');
const CUOMO_ASS = u('https://www.francocuomogioielli.it/centro-assistenza-certificato.html');

const FENI_CONT = u('https://www.fenigioielli.com/contact/');
const FENI_STORIA = u('https://www.fenigioielli.com/storia/');
const FENI_PATEK = u('https://www.patek.com/en/points-of-sale/europe/italy/taranto/feni-gioielli', 'marchio-ufficiale');

const PACE_CONT = u('https://www.pacegioielli.com/contatti');
const PACE_SERV = u('https://www.pacegioielli.com/servizi');
const PACE_STORIA = u('https://www.pacegioielli.com/chi-siamo');
const PACE_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/brindisi/pace-gioielli', 'marchio-ufficiale');

const IACOVONE_LON = u('https://www.longines.com/it/store/id/iacovone-via-del-corso-srl-matera-1069472', 'marchio-ufficiale');
const IACOVONE_TIS = u('https://www.tissotwatches.com/it-it/store/iacovone-via-del-corso/a1vNN0000020A6NYAU', 'marchio-ufficiale');
const COMETA_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/basilicata/policoro/gioielleria-cometa', 'marchio-ufficiale');

// --- Nuove località ---
const nuoveLocalita: Locality[] = [
  {
    id: 'pesaro', comune: 'Pesaro', comuneSlug: 'pesaro', provincia: 'Pesaro e Urbino', provinciaSlug: 'pesaro-e-urbino',
    siglaProvincia: 'PU', regione: 'Marche', regioneSlug: 'marche', codiceIstat: null,
    descrizione: 'A Pesaro è censita la storica orologeria e gioielleria Paolo Bartorelli dal 1882 in Via Branca.',
    fonti: [BARTORELLI_LON],
  },
  {
    id: 'fano', comune: 'Fano', comuneSlug: 'fano', provincia: 'Pesaro e Urbino', provinciaSlug: 'pesaro-e-urbino',
    siglaProvincia: 'PU', regione: 'Marche', regioneSlug: 'marche', codiceIstat: null,
    descrizione: 'Fano conta orologerie e rivenditori autorizzati nel centro storico tra Corso Matteotti e Via Arco d’Augusto.',
    fonti: [CAPODAGLI_LON, GRANARELLI_HAM],
  },
  {
    id: 'porto-san-giorgio', comune: 'Porto San Giorgio', comuneSlug: 'porto-san-giorgio', provincia: 'Fermo', provinciaSlug: 'fermo',
    siglaProvincia: 'FM', regione: 'Marche', regioneSlug: 'marche', codiceIstat: null,
    descrizione: 'Porto San Giorgio raccoglie orologerie e rivenditori ufficiali lungo Viale Don Minzoni e Viale Cavallotti.',
    fonti: [FELICI_LON, PANICHI_BREIL],
  },
  {
    id: 'porto-sant-elpidio', comune: "Porto Sant'Elpidio", comuneSlug: 'porto-sant-elpidio', provincia: 'Fermo', provinciaSlug: 'fermo',
    siglaProvincia: 'FM', regione: 'Marche', regioneSlug: 'marche', codiceIstat: null,
    descrizione: "A Porto Sant'Elpidio opera la storica Gioielleria Rosati in Via Principe Umberto.",
    fonti: [ROSATI_HOME, ROSATI_ORIS],
  },
  {
    id: 'macerata', comune: 'Macerata', comuneSlug: 'macerata', provincia: 'Macerata', provinciaSlug: 'macerata',
    siglaProvincia: 'MC', regione: 'Marche', regioneSlug: 'marche', codiceIstat: null,
    descrizione: 'A Macerata è censita Gioielleria Cotognini in Via Garibaldi, rivenditore ufficiale Seiko.',
    fonti: [COTOGNINI_SEIKO],
  },
  {
    id: 'sant-egidio-alla-vibrata', comune: "Sant'Egidio alla Vibrata", comuneSlug: 'sant-egidio-alla-vibrata', provincia: 'Teramo', provinciaSlug: 'teramo',
    siglaProvincia: 'TE', regione: 'Abruzzo', regioneSlug: 'abruzzo', codiceIstat: null,
    descrizione: "A Sant'Egidio alla Vibrata opera L'Angolo d'Oro, con servizi di riparazione e restauro di orologi.",
    fonti: [ANGOLO_TE],
  },
  {
    id: 'roseto-degli-abruzzi', comune: 'Roseto degli Abruzzi', comuneSlug: 'roseto-degli-abruzzi', provincia: 'Teramo', provinciaSlug: 'teramo',
    siglaProvincia: 'TE', regione: 'Abruzzo', regioneSlug: 'abruzzo', codiceIstat: null,
    descrizione: 'A Roseto degli Abruzzi opera la storica Gioielleria Michini in Piazza della Libertà, attiva dal 1960.',
    fonti: [MICHINI_HAM, MICHINI_HOME],
  },
  {
    id: 'citta-di-castello', comune: 'Città di Castello', comuneSlug: 'citta-di-castello', provincia: 'Perugia', provinciaSlug: 'perugia',
    siglaProvincia: 'PG', regione: 'Umbria', regioneSlug: 'umbria', codiceIstat: null,
    descrizione: 'A Città di Castello è censita Gioielleria Chiatti in Via Scipione Lapi, rivenditore ufficiale Mido.',
    fonti: [MIDO_IT],
  },
  {
    id: 'benevento', comune: 'Benevento', comuneSlug: 'benevento', provincia: 'Benevento', provinciaSlug: 'benevento',
    siglaProvincia: 'BN', regione: 'Campania', regioneSlug: 'campania', codiceIstat: null,
    descrizione: 'A Benevento opera la storica maison Orzelleca Gioielli in Corso Garibaldi, nata nel 1940 come orologeria con laboratorio.',
    fonti: [ORZ_BN_LON, ORZ_STORIA],
  },
  {
    id: 'avellino', comune: 'Avellino', comuneSlug: 'avellino', provincia: 'Avellino', provinciaSlug: 'avellino',
    siglaProvincia: 'AV', regione: 'Campania', regioneSlug: 'campania', codiceIstat: null,
    descrizione: 'Avellino ospita orologerie e rivenditori ufficiali lungo Corso Vittorio Emanuele e Via Berardi.',
    fonti: [ORZ_AV_LON, MIDO_IT],
  },
  {
    id: 'foggia', comune: 'Foggia', comuneSlug: 'foggia', provincia: 'Foggia', provinciaSlug: 'foggia',
    siglaProvincia: 'FG', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A Foggia opera la storica Gioielleria Giuseppe Ciletti dal 1950, con laboratorio tecnico interno di orologeria.',
    fonti: [CILETTI_HOME, CILETTI_SERV],
  },
  {
    id: 'san-severo', comune: 'San Severo', comuneSlug: 'san-severo', provincia: 'Foggia', provinciaSlug: 'foggia',
    siglaProvincia: 'FG', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A San Severo è censita Stravola Gioiellieri, rivenditore ufficiale Hamilton.',
    fonti: [STRAVOLA_HAM],
  },
  {
    id: 'cerignola', comune: 'Cerignola', comuneSlug: 'cerignola', provincia: 'Foggia', provinciaSlug: 'foggia',
    siglaProvincia: 'FG', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A Cerignola opera Nazareno Bancone Gioielli in Piazza Duomo, rivenditore ufficiale Hamilton.',
    fonti: [BANCONE_HAM],
  },
  {
    id: 'barletta', comune: 'Barletta', comuneSlug: 'barletta', provincia: 'Barletta-Andria-Trani', provinciaSlug: 'barletta-andria-trani',
    siglaProvincia: 'BT', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A Barletta è censita Landi Gioiellieri in Corso Garibaldi, punto vendita e assistenza di primo livello Longines.',
    fonti: [LANDI_LON],
  },
  {
    id: 'andria', comune: 'Andria', comuneSlug: 'andria', provincia: 'Barletta-Andria-Trani', provinciaSlug: 'barletta-andria-trani',
    siglaProvincia: 'BT', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'Andria ospita laboratori di assistenza orologiera certificata e rivenditori ufficiali in centro città.',
    fonti: [CUOMO_ASS, MIDO_IT],
  },
  {
    id: 'taranto', comune: 'Taranto', comuneSlug: 'taranto', provincia: 'Taranto', provinciaSlug: 'taranto',
    siglaProvincia: 'TA', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A Taranto opera Feni Gioielli dal 1974, con laboratorio interno e rivendita ufficiale Patek Philippe.',
    fonti: [FENI_CONT, FENI_PATEK],
  },
  {
    id: 'castellaneta', comune: 'Castellaneta', comuneSlug: 'castellaneta', provincia: 'Taranto', provinciaSlug: 'taranto',
    siglaProvincia: 'TA', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'A Castellaneta è censita Gioielleria De Leonardis in Via San Francesco, rivenditore ufficiale Mido.',
    fonti: [MIDO_IT],
  },
  {
    id: 'brindisi', comune: 'Brindisi', comuneSlug: 'brindisi', provincia: 'Brindisi', provinciaSlug: 'brindisi',
    siglaProvincia: 'BR', regione: 'Puglia', regioneSlug: 'puglia', codiceIstat: null,
    descrizione: 'Brindisi ospita storiche orologerie e laboratori di assistenza tecnica lungo Corso Roma.',
    fonti: [PACE_CONT, MIDO_IT],
  },
  {
    id: 'matera', comune: 'Matera', comuneSlug: 'matera', provincia: 'Matera', provinciaSlug: 'matera',
    siglaProvincia: 'MT', regione: 'Basilicata', regioneSlug: 'basilicata', codiceIstat: null,
    descrizione: 'A Matera è censita Iacovone Via Del Corso Srl, rivenditore ufficiale Longines e Tissot.',
    fonti: [IACOVONE_LON, IACOVONE_TIS],
  },
  {
    id: 'policoro', comune: 'Policoro', comuneSlug: 'policoro', provincia: 'Matera', provinciaSlug: 'matera',
    siglaProvincia: 'MT', regione: 'Basilicata', regioneSlug: 'basilicata', codiceIstat: null,
    descrizione: 'A Policoro è censita Gioielleria Cometa in Via Siris, rivenditore ufficiale Hamilton.',
    fonti: [COMETA_HAM],
  },
];

for (const loc of nuoveLocalita) {
  if (!directory.localita.some(l => l.id === loc.id)) {
    directory.localita.push(loc);
  }
}

// --- 32 nuove schede verificate ---
const nuoveSchede: Business[] = [
  {
    id: 'paolo-bartorelli-pesaro', slug: 'paolo-bartorelli-pesaro', nome: 'Paolo Bartorelli Gioielli dal 1882',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Paolo Bartorelli Gioielli dal 1882 in Via Branca 15 a Pesaro è una storica maison marchigiana attestata dallo store locator ufficiale Longines quale rivenditore autorizzato con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'pesaro',
    posizione: { indirizzo: 'Via Branca, 15', cap: '61122', coordinate: null, fonti: [BARTORELLI_LON] },
    contatti: { telefono: '0721 31345', email: 'info@paolobartorelligioielli.it', sito: null, whatsapp: null, social: [], fonti: [BARTORELLI_LON] },
    orari: makeOrari([
      [2, '09:30-12:45', '16:15-20:00'], [3, '09:30-12:45', '16:15-20:00'],
      [4, '09:30-12:45', '16:15-20:00'], [5, '09:30-12:45', '16:15-20:00'], [6, '09:30-12:45', '16:15-20:00'],
    ], [BARTORELLI_LON]),
    servizi: [
      { id: 'vendita', fonti: [BARTORELLI_LON] }, { id: 'manutenzione', fonti: [BARTORELLI_LON] },
      { id: 'cinturini', fonti: [BARTORELLI_LON] }, { id: 'gioielleria', fonti: [BARTORELLI_LON] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [BARTORELLI_LON] }],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [BARTORELLI_LON] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [BARTORELLI_LON] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1882, fondatore: null,
      testo: 'La denominazione ufficiale attestata dal marchio richiama la tradizione storica Bartorelli dal 1882.',
      eventi: [], fonti: [BARTORELLI_LON],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [BARTORELLI_LON],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Longines.', fonti: [BARTORELLI_LON] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'paolo-bartorelli-pesaro' },
  },
  {
    id: 'gioielleria-capodagli-fano', slug: 'gioielleria-capodagli-fano', nome: 'Gioielleria Capodagli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Capodagli (Capodagli Pietro Snc) in Corso Matteotti 109 a Fano è rivenditore ufficiale Longines e Mido attestato dai rispettivi store locator dei marchi, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: ['Capodagli Pietro Snc di Lauro Ivonne & C.'], gruppoId: null, localitaId: 'fano',
    posizione: { indirizzo: 'Corso Matteotti, 109', cap: '61032', coordinate: null, fonti: [CAPODAGLI_LON, CAPODAGLI_MIDO] },
    contatti: { telefono: '0721 860636', email: 'info@capodagli.it', sito: null, whatsapp: null, social: [], fonti: [CAPODAGLI_LON, CAPODAGLI_MIDO] },
    orari: makeOrari([
      [2, '09:00-13:00', '16:00-20:00'], [3, '09:00-13:00', '16:00-20:00'],
      [4, '09:00-13:00', '16:00-20:00'], [5, '09:00-13:00', '16:00-20:00'], [6, '09:00-13:00', '16:00-20:00'],
    ], [CAPODAGLI_LON]),
    servizi: [
      { id: 'vendita', fonti: [CAPODAGLI_LON, CAPODAGLI_MIDO] }, { id: 'manutenzione', fonti: [CAPODAGLI_LON] },
      { id: 'cinturini', fonti: [CAPODAGLI_LON] }, { id: 'gioielleria', fonti: [CAPODAGLI_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [CAPODAGLI_LON] }, { marca: 'Mido', fonti: [CAPODAGLI_MIDO] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [CAPODAGLI_LON] }, { marca: 'Mido', fonti: [CAPODAGLI_MIDO] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CAPODAGLI_LON, CAPODAGLI_MIDO],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiali Longines e Mido.', fonti: [CAPODAGLI_LON, CAPODAGLI_MIDO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-capodagli-fano' },
  },
  {
    id: 'gioielleria-granarelli-fano', slug: 'gioielleria-granarelli-fano', nome: 'Gioielleria Granarelli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Granarelli Srl in Via Arco d’Augusto a Fano è punto vendita autorizzato Hamilton e Tissot documentato dagli store locator ufficiali dei due marchi.',
    nomiPrecedenti: ['Gioielleria Granarelli Srl'], gruppoId: null, localitaId: 'fano',
    posizione: { indirizzo: 'Via Arco d’Augusto, 60', cap: '61032', coordinate: null, fonti: [GRANARELLI_TIS, GRANARELLI_HAM] },
    contatti: { telefono: '0721 1701866', email: 'info@granarelli.it', sito: null, whatsapp: null, social: [], fonti: [GRANARELLI_HAM, GRANARELLI_TIS] },
    orari: makeOrari([
      [2, '09:15-12:15', '16:15-19:45'], [3, '09:15-12:15', '16:15-19:45'],
      [4, '09:15-12:15', '16:15-19:45'], [5, '09:15-12:15', '16:15-19:45'], [6, '09:15-12:15', '16:15-19:45'],
    ], [GRANARELLI_TIS]),
    servizi: [{ id: 'vendita', fonti: [GRANARELLI_HAM, GRANARELLI_TIS] }, { id: 'gioielleria', fonti: [GRANARELLI_TIS] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Hamilton', fonti: [GRANARELLI_HAM] }, { marca: 'Tissot', fonti: [GRANARELLI_TIS] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [GRANARELLI_HAM] }, { marca: 'Tissot', fonti: [GRANARELLI_TIS] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [GRANARELLI_HAM, GRANARELLI_TIS],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiali Hamilton e Tissot.', fonti: [GRANARELLI_HAM, GRANARELLI_TIS] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-granarelli-fano' },
  },
  {
    id: 'felici-srl-porto-san-giorgio', slug: 'felici-srl-porto-san-giorgio', nome: 'Felici Srl',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Felici Srl in Viale Don Minzoni 55/a a Porto San Giorgio è rivenditore ufficiale Longines attestato dallo store locator del marchio, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'porto-san-giorgio',
    posizione: { indirizzo: 'Viale Don Minzoni, 55/a', cap: '63822', coordinate: null, fonti: [FELICI_LON] },
    contatti: { telefono: '0734 968525', email: 'felicisrl@yahoo.it', sito: null, whatsapp: null, social: [], fonti: [FELICI_LON] },
    orari: makeOrari([
      [1, '16:00-20:00'], [2, '09:30-13:00', '16:00-20:00'], [3, '09:30-13:00', '16:00-20:00'],
      [4, '09:30-13:00', '16:00-20:00'], [5, '09:30-13:00', '16:00-20:00'], [6, '09:30-13:00', '16:00-20:00'],
    ], [FELICI_LON]),
    servizi: [
      { id: 'vendita', fonti: [FELICI_LON] }, { id: 'manutenzione', fonti: [FELICI_LON] },
      { id: 'cinturini', fonti: [FELICI_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [FELICI_LON] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [FELICI_LON] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [FELICI_LON],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Longines.', fonti: [FELICI_LON] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'felici-srl-porto-san-giorgio' },
  },
  {
    id: 'gioielleria-panichi-porto-san-giorgio', slug: 'gioielleria-panichi-porto-san-giorgio', nome: 'Gioielleria Panichi dal 1954',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Panichi dal 1954 in Viale Cavallotti 131 a Porto San Giorgio è un’attività storica del Fermano attestata dallo store locator ufficiale Breil quale rivenditore autorizzato.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'porto-san-giorgio',
    posizione: { indirizzo: 'Viale Cavallotti, 131', cap: '63822', coordinate: null, fonti: [PANICHI_BREIL] },
    contatti: { telefono: '0734 67543', email: 'panichipsg54@gmail.com', sito: null, whatsapp: null, social: [], fonti: [PANICHI_BREIL] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [PANICHI_BREIL] }, { id: 'gioielleria', fonti: [PANICHI_BREIL] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Breil', fonti: [PANICHI_BREIL] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Breil', fonti: [PANICHI_BREIL] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1954, fondatore: null,
      testo: 'La denominazione aziendale registrata nello store locator del marchio attesta l’avvio dell’attività nel 1954.',
      eventi: [], fonti: [PANICHI_BREIL],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [PANICHI_BREIL],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Breil.', fonti: [PANICHI_BREIL] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-panichi-porto-san-giorgio' },
  },
  {
    id: 'gioielleria-rosati-porto-sant-elpidio', slug: 'gioielleria-rosati-porto-sant-elpidio', nome: 'Gioielleria Rosati',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Rosati in Via Principe Umberto 2 a Porto Sant’Elpidio è un’attività familiare di tre generazioni attestata dallo store finder ufficiale Oris come rivenditore autorizzato del marchio svizzero.',
    nomiPrecedenti: ['Perpetual Srl'], gruppoId: null, localitaId: 'porto-sant-elpidio',
    posizione: { indirizzo: 'Via Principe Umberto, 2', cap: '63821', coordinate: null, fonti: [ROSATI_HOME, ROSATI_ORIS] },
    contatti: { telefono: '0734 253641', email: null, sito: 'https://www.gioielleriarosati.com/pages/dove-siamo', whatsapp: '+393314130989', social: [], fonti: [ROSATI_HOME, ROSATI_ORIS] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [ROSATI_ORIS, ROSATI_HOME] }, { id: 'gioielleria', fonti: [ROSATI_HOME] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Oris', fonti: [ROSATI_ORIS] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Oris', fonti: [ROSATI_ORIS] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: null, fondatore: null,
      testo: 'Il sito ufficiale documenta una tradizione familiare di tre generazioni a Porto Sant’Elpidio.',
      eventi: [], fonti: [ROSATI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ROSATI_HOME, ROSATI_ORIS],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da sito ufficiale e locator Oris.', fonti: [ROSATI_HOME, ROSATI_ORIS] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-rosati-porto-sant-elpidio' },
  },
  {
    id: 'ibis-gioielli-civitanova-marche', slug: 'ibis-gioielli-civitanova-marche', nome: 'Ibis Gioielli 1979',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Ibis Gioielli 1979 (The Thomas Group Srl) in Corso Umberto I 73 a Civitanova Marche è rivenditore ufficiale Longines e Mido attestato dai rispettivi store locator, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: ['The Thomas Group Srl'], gruppoId: null, localitaId: 'civitanova-marche',
    posizione: { indirizzo: 'Corso Umberto I, 73', cap: '62012', coordinate: null, fonti: [IBIS_LON, IBIS_MIDO] },
    contatti: { telefono: '0733 770185', email: 'info@ibisgioielli.it', sito: null, whatsapp: null, social: [], fonti: [IBIS_LON, IBIS_MIDO] },
    orari: makeOrari([
      [2, '09:30-13:00', '16:00-20:00'], [3, '09:30-13:00', '16:00-20:00'],
      [4, '09:30-13:00', '16:00-20:00'], [5, '09:30-13:00', '16:00-20:00'], [6, '09:30-13:00', '16:00-20:00'],
    ], [IBIS_LON]),
    servizi: [
      { id: 'vendita', fonti: [IBIS_LON, IBIS_MIDO] }, { id: 'manutenzione', fonti: [IBIS_LON] },
      { id: 'cinturini', fonti: [IBIS_LON] }, { id: 'gioielleria', fonti: [IBIS_MIDO] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [IBIS_LON] }, { marca: 'Mido', fonti: [IBIS_MIDO] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [IBIS_LON] }, { marca: 'Mido', fonti: [IBIS_MIDO] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1979, fondatore: null,
      testo: 'La denominazione Ibis Gioielli 1979 attestata dallo store locator Mido richiama l’avvio dell’attività nel 1979.',
      eventi: [], fonti: [IBIS_MIDO],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [IBIS_LON, IBIS_MIDO],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiali Longines e Mido.', fonti: [IBIS_LON, IBIS_MIDO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'ibis-gioielli-civitanova-marche' },
  },
  {
    id: 'gioielleria-cotognini-macerata', slug: 'gioielleria-cotognini-macerata', nome: 'Gioielleria Cotognini',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Cotognini in Via Giuseppe Garibaldi 60 a Macerata è un punto vendita di orologeria attestato dallo store locator ufficiale Seiko quale Global Brand Retailer per il capoluogo maceratese.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'macerata',
    posizione: { indirizzo: 'Via G. Garibaldi, 60', cap: '62100', coordinate: null, fonti: [COTOGNINI_SEIKO] },
    contatti: { telefono: '0733 232417', email: null, sito: null, whatsapp: null, social: [], fonti: [COTOGNINI_SEIKO] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [COTOGNINI_SEIKO] }, { id: 'gioielleria', fonti: [COTOGNINI_SEIKO] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Seiko', fonti: [COTOGNINI_SEIKO] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Seiko', fonti: [COTOGNINI_SEIKO] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [COTOGNINI_SEIKO],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Seiko.', fonti: [COTOGNINI_SEIKO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-cotognini-macerata' },
  },
  {
    id: 'angolo-d-oro-sant-egidio', slug: 'angolo-d-oro-sant-egidio', nome: 'L’Angolo d’Oro di D’Agostino Micheal',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'L’Angolo d’Oro di D’Agostino Micheal in Piazza Umberto I a Sant’Egidio alla Vibrata offre servizi artigianali di riparazione e restauro di orologi e gioielli.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'sant-egidio-alla-vibrata',
    posizione: { indirizzo: 'Piazza Umberto I', cap: '64016', coordinate: null, fonti: [ANGOLO_TE] },
    contatti: { telefono: '0861 842719', email: 'oropuro70@gmail.com', sito: 'https://www.langolodoroitalia.com/riparazioni-orologi-gioielli.php', whatsapp: null, social: [], fonti: [ANGOLO_TE] },
    orari: makeOrari([
      [2, '09:00-12:45', '16:00-19:30'], [3, '09:00-12:45', '16:00-19:30'],
      [4, '09:00-12:45', '16:00-19:30'], [5, '09:00-12:45', '16:00-19:30'], [6, '09:00-12:45', '16:00-19:30'],
    ], [ANGOLO_TE]),
    servizi: [
      { id: 'riparazione', fonti: [ANGOLO_TE] }, { id: 'restauro-vintage', fonti: [ANGOLO_TE] },
      { id: 'vendita', fonti: [ANGOLO_TE] }, { id: 'gioielleria', fonti: [ANGOLO_TE] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ANGOLO_TE],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [ANGOLO_TE] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'angolo-d-oro-sant-egidio' },
  },
  {
    id: 'gioielleria-michini-roseto', slug: 'gioielleria-michini-roseto', nome: 'Gioielleria Michini',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Michini in Piazza della Libertà a Roseto degli Abruzzi, fondata nel 1960 e a conduzione familiare, è rivenditore ufficiale Hamilton attestato dallo store locator del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'roseto-degli-abruzzi',
    posizione: { indirizzo: 'Piazza della Libertà', cap: '64026', coordinate: null, fonti: [MICHINI_HAM] },
    contatti: { telefono: '085 8992183', email: 'gioielleriamichini@gmail.com', sito: 'https://gioielleriamichini.it/', whatsapp: null, social: [], fonti: [MICHINI_HAM, MICHINI_HOME] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MICHINI_HAM, MICHINI_HOME] }, { id: 'gioielleria', fonti: [MICHINI_HOME] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Hamilton', fonti: [MICHINI_HAM] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [MICHINI_HAM] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1960, fondatore: null,
      testo: 'Il sito ufficiale documenta una tradizione familiare iniziata a Roseto degli Abruzzi nel 1960.',
      eventi: [{ data: '1960', descrizione: 'Fondazione della Gioielleria Michini a Roseto degli Abruzzi.', fonti: [MICHINI_HOME] }],
      fonti: [MICHINI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MICHINI_HAM, MICHINI_HOME],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da sito ufficiale e locator Hamilton.', fonti: [MICHINI_HAM, MICHINI_HOME] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-michini-roseto' },
  },
  {
    id: 'gioielleria-ferretti-chieti', slug: 'gioielleria-ferretti-chieti', nome: 'Gioielleria Ferretti 1956',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Ferretti 1956 in Viale Benedetto Croce 105 a Chieti Scalo è un’attività storica familiare dal 1956 con laboratorio interno dedicato alla revisione e riparazione di orologi e gioielli.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'chieti',
    posizione: { indirizzo: 'Viale Benedetto Croce, 105', cap: '66100', coordinate: null, fonti: [FERRETTI_CH] },
    contatti: { telefono: '0871 560101', email: 'info@ferrettigioielli.com', sito: 'https://www.ferrettigioielli.com/', whatsapp: null, social: [], fonti: [FERRETTI_CH] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [FERRETTI_CH] }, { id: 'revisione', fonti: [FERRETTI_CH] },
      { id: 'vendita', fonti: [FERRETTI_CH] }, { id: 'gioielleria', fonti: [FERRETTI_CH] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'meccanici', fonti: [FERRETTI_CH] }],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1956, fondatore: 'Domenico Ferretti',
      testo: 'Fondata nel 1956 col maestro orologiaio Domenico Ferretti, l’attività tramanda la tradizione orologiera e orafa di famiglia a Chieti.',
      eventi: [{ data: '1956', descrizione: 'Fondazione di Ferretti 1956 a Chieti.', fonti: [FERRETTI_CH] }],
      fonti: [FERRETTI_CH],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [FERRETTI_CH],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: bottega storica inserita da sito ufficiale.', fonti: [FERRETTI_CH] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-ferretti-chieti' },
  },
  {
    id: 'sorbi-gioielli-perugia', slug: 'sorbi-gioielli-perugia', nome: 'Sorbi Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Sorbi Gioielli in Via Leonida Mastrodicasa 99/E a Ponte Felcino (Perugia) dispone di un laboratorio interno di riparazione orologi e assistenza post-vendita accanto al laboratorio orafo.',
    nomiPrecedenti: ['Oreficeria Sorbi'], gruppoId: null, localitaId: 'perugia',
    posizione: { indirizzo: 'Via Leonida Mastrodicasa, 99/E', cap: '06134', coordinate: null, fonti: [SORBI_PG] },
    contatti: { telefono: '075 6910508', email: 'ema.sorbi@hotmail.it', sito: 'https://www.oreficeriasorbi.com/servizi.php', whatsapp: null, social: [], fonti: [SORBI_PG] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [SORBI_PG] }, { id: 'assistenza', fonti: [SORBI_PG] },
      { id: 'vendita', fonti: [SORBI_PG] }, { id: 'gioielleria', fonti: [SORBI_PG] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [SORBI_PG],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [SORBI_PG] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'sorbi-gioielli-perugia' },
  },
  {
    id: 'gioielleria-chiatti-citta-di-castello', slug: 'gioielleria-chiatti-citta-di-castello', nome: 'Gioielleria Chiatti',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Chiatti in Via Scipione Lapi 2/C a Città di Castello è punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Mido quale rivenditore autorizzato del marchio in Alta Valle del Tevere.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'citta-di-castello',
    posizione: { indirizzo: 'Via Scipione Lapi, 2/C', cap: '06012', coordinate: null, fonti: [MIDO_IT] },
    contatti: { telefono: '075 8556232', email: 'info@gioielleriachiatti.it', sito: null, whatsapp: null, social: [], fonti: [MIDO_IT] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MIDO_IT] }, { id: 'gioielleria', fonti: [MIDO_IT] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Mido.', fonti: [MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-chiatti-citta-di-castello' },
  },
  {
    id: 'tomasini-francia-terni', slug: 'tomasini-francia-terni', nome: 'Tomasini Francia Srl',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Tomasini Francia Srl in Largo Elia Passavanti 19 a Terni è rivenditore ufficiale Longines e Tissot documentato dai rispettivi store locator dei marchi, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'terni',
    posizione: { indirizzo: 'Largo Elia Passavanti, 19', cap: '05100', coordinate: null, fonti: [TOMASINI_LON, TOMASINI_TIS] },
    contatti: { telefono: '0744 408111', email: 'info@tomasinifrancia.it', sito: null, whatsapp: null, social: [], fonti: [TOMASINI_LON, TOMASINI_TIS] },
    orari: makeOrari([
      [2, '09:30-13:00', '16:00-20:00'], [3, '09:30-13:00', '16:00-20:00'],
      [4, '09:30-13:00', '16:00-20:00'], [5, '09:30-13:00', '16:00-20:00'], [6, '09:30-13:00', '16:00-20:00'],
    ], [TOMASINI_LON]),
    servizi: [
      { id: 'vendita', fonti: [TOMASINI_LON, TOMASINI_TIS] }, { id: 'manutenzione', fonti: [TOMASINI_LON] },
      { id: 'cinturini', fonti: [TOMASINI_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [TOMASINI_LON] }, { marca: 'Tissot', fonti: [TOMASINI_TIS] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [TOMASINI_LON] }, { marca: 'Tissot', fonti: [TOMASINI_TIS] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [TOMASINI_LON, TOMASINI_TIS],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiali Longines e Tissot.', fonti: [TOMASINI_LON, TOMASINI_TIS] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'tomasini-francia-terni' },
  },
  {
    id: 'gioielleria-massarucci-terni', slug: 'gioielleria-massarucci-terni', nome: 'Gioielleria Massarucci',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Massarucci in Via del Rivo 192 a Terni offre servizi di riparazione orologi di varie tipologie e assistenza tecnica multimarca.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'terni',
    posizione: { indirizzo: 'Via del Rivo, 192', cap: '05100', coordinate: null, fonti: [MASSARUCCI_TR] },
    contatti: { telefono: '0744 300517', email: 'gioielleriamassarucci@gmail.com', sito: 'https://www.gioielleriamassarucci.com/riparazioni-assistenza/', whatsapp: null, social: [], fonti: [MASSARUCCI_TR] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [MASSARUCCI_TR] }, { id: 'assistenza', fonti: [MASSARUCCI_TR] },
      { id: 'vendita', fonti: [MASSARUCCI_TR] }, { id: 'gioielleria', fonti: [MASSARUCCI_TR] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MASSARUCCI_TR],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [MASSARUCCI_TR] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-massarucci-terni' },
  },
  {
    id: 'gt-orologerie-latina', slug: 'gt-orologerie-latina', nome: 'GT Orologerie',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'GT Orologerie in Via Adige 8 a Latina, con oltre quarant’anni di esperienza dichiarata nel settore, si occupa di riparazione e assistenza orologiera e propone segnatempo di secondo polso, vintage e da collezione.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'latina',
    posizione: { indirizzo: 'Via Adige, 8', cap: '04100', coordinate: null, fonti: [GT_CONT] },
    contatti: { telefono: '0773 694925', email: 'info@gtorologerie.it', sito: 'https://gtorologerie.it/', whatsapp: '+393715956457', social: [], fonti: [GT_CONT, GT_LATINA] },
    orari: makeOrari([
      [1, '09:30-13:00', '16:30-19:00'], [2, '09:30-13:00', '16:30-19:00'],
      [3, '09:30-13:00', '16:30-19:00'], [4, '09:30-13:00', '16:30-19:00'], [5, '09:30-13:00', '16:30-19:00'],
    ], [GT_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [GT_LATINA] }, { id: 'assistenza', fonti: [GT_LATINA] },
      { id: 'vendita', fonti: [GT_LATINA] }, { id: 'vendita-usati', fonti: [GT_LATINA] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'vintage', fonti: [GT_LATINA] }, { id: 'collezione', fonti: [GT_LATINA] }],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [GT_LATINA, GT_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [GT_LATINA, GT_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gt-orologerie-latina' },
  },
  {
    id: 'menichelli-franco-viterbo', slug: 'menichelli-franco-viterbo', nome: 'Gioielli di Menichelli Franco & C. Srl',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielli di Menichelli Franco & C. Srl in Piazza Giuseppe Verdi 22 a Viterbo è punto vendita ufficiale Longines con servizi di sostituzione batteria, sostituzione bracciale e assistenza clienti attestati dallo store locator del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'viterbo',
    posizione: { indirizzo: 'Piazza Verdi, 22', cap: '01100', coordinate: null, fonti: [MENICHELLI_LON] },
    contatti: { telefono: '0761 345113', email: 'assistenza@menichelli1912.it', sito: null, whatsapp: null, social: [], fonti: [MENICHELLI_LON] },
    orari: makeOrari([
      [1, '16:00-20:00'], [2, '09:00-13:00', '16:00-20:00'], [3, '09:00-13:00', '16:00-20:00'],
      [4, '09:00-13:00', '16:00-20:00'], [5, '09:00-13:00', '16:00-20:00'],
    ], [MENICHELLI_LON]),
    servizi: [
      { id: 'vendita', fonti: [MENICHELLI_LON] }, { id: 'batterie', fonti: [MENICHELLI_LON] },
      { id: 'cinturini', fonti: [MENICHELLI_LON] }, { id: 'assistenza', fonti: [MENICHELLI_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [MENICHELLI_LON] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [MENICHELLI_LON] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MENICHELLI_LON],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Longines.', fonti: [MENICHELLI_LON] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'menichelli-franco-viterbo' },
  },
  {
    id: 'orzelleca-gioielli-benevento', slug: 'orzelleca-gioielli-benevento', nome: 'Orzelleca Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Orzelleca Gioielli in Corso Garibaldi 190 a Benevento nasce nel 1940 come orologeria con laboratorio di riparazioni ed è oggi rivenditore ufficiale Longines, Hamilton e Mido, con servizi di manutenzione, sostituzione batteria e cinturino.',
    nomiPrecedenti: [], gruppoId: 'orzelleca', localitaId: 'benevento',
    posizione: { indirizzo: 'Corso Garibaldi, 190', cap: '82100', coordinate: null, fonti: [ORZ_BN_LON, ORZ_BN_HAM] },
    contatti: { telefono: '0824 21155', email: 'benevento@orzellecagioielli.it', sito: 'https://orzellecagioielli.it/', whatsapp: null, social: [], fonti: [ORZ_BN_LON, ORZ_HOME] },
    orari: makeOrari([
      [1, '09:00-13:00', '16:30-20:00'], [2, '09:00-13:00', '16:30-20:00'],
      [3, '09:00-13:00', '16:30-20:00'], [4, '09:00-13:00', '16:30-20:00'],
      [5, '09:00-13:00', '16:30-20:00'], [6, '09:00-13:00', '16:30-20:00'],
    ], [ORZ_BN_LON]),
    servizi: [
      { id: 'vendita', fonti: [ORZ_BN_LON, ORZ_BN_HAM] }, { id: 'manutenzione', fonti: [ORZ_BN_LON] },
      { id: 'batterie', fonti: [ORZ_BN_HAM] }, { id: 'cinturini', fonti: [ORZ_BN_LON, ORZ_BN_HAM] },
      { id: 'gioielleria', fonti: [ORZ_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [ORZ_HOME] }],
    marchi: {
      venduti: [
        { marca: 'Longines', fonti: [ORZ_BN_LON] }, { marca: 'Hamilton', fonti: [ORZ_BN_HAM] },
        { marca: 'Mido', fonti: [MIDO_IT] }, { marca: 'Rolex', fonti: [ORZ_HOME] },
        { marca: 'Tudor', fonti: [ORZ_HOME] }, { marca: 'Tissot', fonti: [ORZ_HOME] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [
        { marca: 'Longines', fonti: [ORZ_BN_LON] }, { marca: 'Hamilton', fonti: [ORZ_BN_HAM] },
        { marca: 'Mido', fonti: [MIDO_IT] },
      ],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1940, fondatore: null,
      testo: 'La storia aziendale documenta le origini nel 1940 a Benevento come orologeria dotata di laboratorio di riparazioni.',
      eventi: [{ data: '1940', descrizione: 'Fondazione dell’attività a Benevento.', fonti: [ORZ_STORIA] }],
      fonti: [ORZ_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ORZ_BN_LON, ORZ_BN_HAM, ORZ_STORIA, ORZ_HOME, MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: bottega storica inserita da sito ufficiale e locator Longines/Hamilton/Mido.', fonti: [ORZ_BN_LON, ORZ_BN_HAM, ORZ_STORIA, ORZ_HOME, MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'orzelleca-gioielli-benevento' },
  },
  {
    id: 'isi-orzelleca-avellino', slug: 'isi-orzelleca-avellino', nome: 'Isi Srl — Orzelleca Avellino',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Sede avellinese del gruppo Orzelleca (Isi Srl) in Corso Vittorio Emanuele 197 ad Avellino, rivenditore ufficiale Longines e Hamilton con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: ['Isi Srl (Orzelleca)'], gruppoId: 'orzelleca', localitaId: 'avellino',
    posizione: { indirizzo: 'Corso Vittorio Emanuele, 197', cap: '83100', coordinate: null, fonti: [ORZ_AV_LON, ORZ_AV_HAM] },
    contatti: { telefono: '0825 35700', email: 'avellino@orzellecagioielli.it', sito: 'https://orzellecagioielli.it/', whatsapp: null, social: [], fonti: [ORZ_AV_LON, ORZ_HOME] },
    orari: makeOrari([
      [1, '09:00-13:15', '16:30-20:00'], [2, '09:00-13:15', '16:30-20:00'],
      [3, '09:00-13:15', '16:30-20:00'], [4, '09:00-13:15', '16:30-20:00'],
      [5, '09:00-13:15', '16:30-20:00'], [6, '09:00-13:15', '16:30-20:00'],
    ], [ORZ_AV_LON]),
    servizi: [
      { id: 'vendita', fonti: [ORZ_AV_LON, ORZ_AV_HAM] }, { id: 'manutenzione', fonti: [ORZ_AV_LON] },
      { id: 'cinturini', fonti: [ORZ_AV_LON] }, { id: 'gioielleria', fonti: [ORZ_HOME] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [ORZ_AV_LON] }, { marca: 'Hamilton', fonti: [ORZ_AV_HAM] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [ORZ_AV_LON] }, { marca: 'Hamilton', fonti: [ORZ_AV_HAM] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: null, fondatore: null,
      testo: 'Costituisce la boutique di Avellino della storica maison Orzelleca fondata nel 1940.',
      eventi: [], fonti: [ORZ_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ORZ_AV_LON, ORZ_AV_HAM, ORZ_STORIA, ORZ_HOME],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: sede di Avellino inserita da locator ufficiali Longines e Hamilton.', fonti: [ORZ_AV_LON, ORZ_AV_HAM, ORZ_STORIA, ORZ_HOME] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'isi-orzelleca-avellino' },
  },
  {
    id: 'gioielleria-pegy-avellino', slug: 'gioielleria-pegy-avellino', nome: 'Gioielleria Pegy',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Pegy in Via G. Berardi 1-2 ad Avellino è un punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Mido quale rivenditore autorizzato del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'avellino',
    posizione: { indirizzo: 'Via G. Berardi, 1-2', cap: '83100', coordinate: null, fonti: [MIDO_IT] },
    contatti: { telefono: '0825 780066', email: 'pegygioielli@virgilio.it', sito: null, whatsapp: null, social: [], fonti: [MIDO_IT] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MIDO_IT] }, { id: 'gioielleria', fonti: [MIDO_IT] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Mido.', fonti: [MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-pegy-avellino' },
  },
  {
    id: 'gioielleria-ciletti-foggia', slug: 'gioielleria-ciletti-foggia', nome: 'Gioielleria Giuseppe Ciletti',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Giuseppe Ciletti in Via V. Lanza 10/12 a Foggia, aperta nel 1950, dispone di un laboratorio tecnico interno per revisioni, riparazioni, sostituzione di vetri e quadranti e assistenza post-vendita su Rolex e Tudor.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'foggia',
    posizione: { indirizzo: 'Via V. Lanza, 10/12', cap: '71121', coordinate: null, fonti: [CILETTI_CONT] },
    contatti: { telefono: '+39 0881 771201', email: 'info@giuseppeciletti.it', sito: 'https://giuseppeciletti.it/', whatsapp: null, social: [], fonti: [CILETTI_CONT, CILETTI_HOME] },
    orari: makeOrari([
      [1, '17:00-20:00'], [2, '10:00-13:00', '17:00-20:00'], [3, '10:00-13:00', '17:00-20:00'],
      [4, '10:00-13:00', '17:00-20:00'], [5, '10:00-13:00', '17:00-20:00'], [6, '10:00-13:00', '17:00-20:00'],
    ], [CILETTI_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [CILETTI_SERV] }, { id: 'revisione', fonti: [CILETTI_SERV] },
      { id: 'manutenzione', fonti: [CILETTI_SERV] }, { id: 'ricambi', fonti: [CILETTI_SERV] },
      { id: 'assistenza', fonti: [CILETTI_SERV] }, { id: 'vendita', fonti: [CILETTI_HOME] },
      { id: 'gioielleria', fonti: [CILETTI_HOME] },
    ],
    altriServizi: [{ nome: 'Sostituzione vetro e quadrante', fonti: [CILETTI_SERV] }],
    specializzazioni: [{ id: 'lusso', fonti: [CILETTI_HOME] }],
    marchi: {
      venduti: [{ marca: 'Rolex', fonti: [CILETTI_HOME] }, { marca: 'Tudor', fonti: [CILETTI_HOME] }],
      riparati: [{ marca: 'Rolex', fonti: [CILETTI_SERV] }, { marca: 'Tudor', fonti: [CILETTI_SERV] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1950, fondatore: 'Giuseppe Ciletti',
      testo: 'Fondata a Foggia nel 1950, la Gioielleria Giuseppe Ciletti unisce la vendita di alta orologeria al laboratorio tecnico in sede.',
      eventi: [{ data: '1950', descrizione: 'Apertura della Gioielleria Ciletti a Foggia.', fonti: [CILETTI_HOME] }],
      fonti: [CILETTI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CILETTI_HOME, CILETTI_SERV, CILETTI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: bottega storica inserita da sito ufficiale.', fonti: [CILETTI_HOME, CILETTI_SERV, CILETTI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-ciletti-foggia' },
  },
  {
    id: 'stravola-gioiellieri-san-severo', slug: 'stravola-gioiellieri-san-severo', nome: 'Stravola Gioiellieri',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Stravola Gioiellieri in Via R. Recca 8 a San Severo è punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Hamilton quale rivenditore autorizzato.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'san-severo',
    posizione: { indirizzo: 'Via R. Recca, 8', cap: '71016', coordinate: null, fonti: [STRAVOLA_HAM] },
    contatti: { telefono: '0882 334131', email: 'stravolagioiellieri@libero.it', sito: null, whatsapp: null, social: [], fonti: [STRAVOLA_HAM] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [STRAVOLA_HAM] }, { id: 'gioielleria', fonti: [STRAVOLA_HAM] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Hamilton', fonti: [STRAVOLA_HAM] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [STRAVOLA_HAM] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [STRAVOLA_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Hamilton.', fonti: [STRAVOLA_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'stravola-gioiellieri-san-severo' },
  },
  {
    id: 'nazareno-bancone-cerignola', slug: 'nazareno-bancone-cerignola', nome: 'Nazareno Bancone Gioielli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Nazareno Bancone Gioielli in Piazza Duomo 14 a Cerignola è un’orologeria e gioielleria attestata dallo store locator ufficiale Hamilton come rivenditore autorizzato del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'cerignola',
    posizione: { indirizzo: 'Piazza Duomo, 14', cap: '71042', coordinate: null, fonti: [BANCONE_HAM] },
    contatti: { telefono: '0885 416325', email: 'nazarenobancone@gmail.com', sito: null, whatsapp: null, social: [], fonti: [BANCONE_HAM] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [BANCONE_HAM] }, { id: 'gioielleria', fonti: [BANCONE_HAM] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Hamilton', fonti: [BANCONE_HAM] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [BANCONE_HAM] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [BANCONE_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Hamilton.', fonti: [BANCONE_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'nazareno-bancone-cerignola' },
  },
  {
    id: 'landi-gioiellieri-barletta', slug: 'landi-gioiellieri-barletta', nome: 'Landi Gioiellieri di Landriscina Domenico',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Landi Gioiellieri di Landriscina Domenico in Corso Garibaldi 81 a Barletta è rivenditore ufficiale Longines attestato dallo store locator del marchio, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'barletta',
    posizione: { indirizzo: 'Corso Garibaldi, 81', cap: '76121', coordinate: null, fonti: [LANDI_LON] },
    contatti: { telefono: '0883 347264', email: 'landimariagioiellieri@yahoo.it', sito: null, whatsapp: null, social: [], fonti: [LANDI_LON] },
    orari: makeOrari([
      [1, '16:00-20:30'], [2, '09:00-13:00', '16:00-20:30'], [3, '09:00-13:00', '16:00-20:30'],
      [4, '09:00-13:00', '16:00-20:30'], [5, '09:00-13:00', '16:00-20:30'],
      [6, '09:00-13:00', '16:00-20:30'], [7, '09:00-13:00', '16:00-20:30'],
    ], [LANDI_LON]),
    servizi: [
      { id: 'vendita', fonti: [LANDI_LON] }, { id: 'manutenzione', fonti: [LANDI_LON] },
      { id: 'cinturini', fonti: [LANDI_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [LANDI_LON] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [LANDI_LON] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [LANDI_LON],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Longines.', fonti: [LANDI_LON] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'landi-gioiellieri-barletta' },
  },
  {
    id: 'franco-cuomo-gioielli-andria', slug: 'franco-cuomo-gioielli-andria', nome: 'Franco Cuomo Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Franco Cuomo Gioielli in Via Regina Margherita 87 ad Andria dispone di centro assistenza orologiero interno per revisioni complete, sostituzione batteria, test di impermeabilità e interventi di ripristino su marchi quali Omega, Cartier, TAG Heuer e Zenith.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'andria',
    posizione: { indirizzo: 'Via Regina Margherita, 87', cap: '76123', coordinate: null, fonti: [CUOMO_CONT] },
    contatti: { telefono: '+39 0883 590209', email: 'info@francocuomogioielli.it', sito: 'https://www.francocuomogioielli.it/centro-assistenza-certificato.html', whatsapp: null, social: [], fonti: [CUOMO_CONT, CUOMO_ASS] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'revisione', fonti: [CUOMO_ASS] }, { id: 'riparazione', fonti: [CUOMO_ASS] },
      { id: 'manutenzione', fonti: [CUOMO_ASS] }, { id: 'batterie', fonti: [CUOMO_ASS] },
      { id: 'assistenza', fonti: [CUOMO_ASS] }, { id: 'vendita', fonti: [CUOMO_CONT] },
      { id: 'gioielleria', fonti: [CUOMO_CONT] },
    ],
    altriServizi: [{ nome: 'Test di impermeabilità e ripristino estetico', fonti: [CUOMO_ASS] }],
    specializzazioni: [{ id: 'lusso', fonti: [CUOMO_ASS] }, { id: 'meccanici', fonti: [CUOMO_ASS] }],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Omega', fonti: [CUOMO_ASS] }, { marca: 'Cartier', fonti: [CUOMO_ASS] },
        { marca: 'TAG Heuer', fonti: [CUOMO_ASS] }, { marca: 'Zenith', fonti: [CUOMO_ASS] },
      ],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CUOMO_CONT, CUOMO_ASS],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [CUOMO_CONT, CUOMO_ASS] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'franco-cuomo-gioielli-andria' },
  },
  {
    id: 'pignataro-gioielli-andria', slug: 'pignataro-gioielli-andria', nome: 'Pignataro Gioielli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Pignataro Gioielli in Viale Crispi 43 ad Andria è punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Mido quale rivenditore autorizzato del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'andria',
    posizione: { indirizzo: 'Viale Crispi, 43', cap: '76123', coordinate: null, fonti: [MIDO_IT] },
    contatti: { telefono: '+39 0883 953677', email: 'info@pignatarogioielli.com', sito: null, whatsapp: null, social: [], fonti: [MIDO_IT] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MIDO_IT] }, { id: 'gioielleria', fonti: [MIDO_IT] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Mido.', fonti: [MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'pignataro-gioielli-andria' },
  },
  {
    id: 'feni-gioielli-taranto', slug: 'feni-gioielli-taranto', nome: 'Feni Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Feni Gioielli in Via Domenico Acclavio 38-38/B a Taranto, fondata nel 1974 da Angelo Raffaele Nigro e Maria Rosaria Marzano, dispone di laboratorio interno ed è punto vendita ufficiale Patek Philippe con servizi di sostituzione batteria, test di impermeabilità, controllo della marcia e cura del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'taranto',
    posizione: { indirizzo: 'Via Domenico Acclavio, 38-38/B', cap: '74123', coordinate: null, fonti: [FENI_CONT, FENI_PATEK] },
    contatti: { telefono: '+39 099 4526348', email: 'info@fenigioielli.it', sito: 'https://www.fenigioielli.com/storia/', whatsapp: null, social: [], fonti: [FENI_CONT, FENI_STORIA] },
    orari: makeOrari([
      [2, '09:30-13:00', '17:30-20:30'], [3, '09:30-13:00', '17:30-20:30'],
      [4, '09:30-13:00', '17:30-20:30'], [5, '09:30-13:00', '17:30-20:30'], [6, '09:30-13:00', '17:30-20:30'],
    ], [FENI_CONT]),
    servizi: [
      { id: 'vendita', fonti: [FENI_PATEK, FENI_STORIA] }, { id: 'manutenzione', fonti: [FENI_PATEK, FENI_STORIA] },
      { id: 'batterie', fonti: [FENI_PATEK] }, { id: 'cinturini', fonti: [FENI_PATEK] },
      { id: 'assistenza', fonti: [FENI_STORIA] }, { id: 'gioielleria', fonti: [FENI_STORIA] },
    ],
    altriServizi: [{ nome: 'Test di impermeabilità e controllo della marcia', fonti: [FENI_PATEK] }],
    specializzazioni: [{ id: 'lusso', fonti: [FENI_PATEK] }],
    marchi: {
      venduti: [
        { marca: 'Patek Philippe', fonti: [FENI_PATEK] }, { marca: 'Rolex', fonti: [FENI_STORIA] },
        { marca: 'Tudor', fonti: [FENI_STORIA] }, { marca: 'Omega', fonti: [FENI_STORIA] },
        { marca: 'IWC', fonti: [FENI_STORIA] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Patek Philippe', fonti: [FENI_PATEK] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1974, fondatore: 'Angelo Raffaele Nigro e Maria Rosaria Marzano',
      testo: 'Fondata a Taranto nel 1974 da Angelo Raffaele Nigro e Maria Rosaria Marzano, nel 1983 Feni Gioielli ha rilevato la storica gioielleria Calderoni.',
      eventi: [
        { data: '1974', descrizione: 'Fondazione di Feni Gioielli a Taranto.', fonti: [FENI_STORIA] },
        { data: '1983', descrizione: 'Acquisizione della gioielleria Calderoni.', fonti: [FENI_STORIA] },
      ],
      fonti: [FENI_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [FENI_CONT, FENI_STORIA, FENI_PATEK],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda storica inserita da sito ufficiale e pagina Patek Philippe.', fonti: [FENI_CONT, FENI_STORIA, FENI_PATEK] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'feni-gioielli-taranto' },
  },
  {
    id: 'gioielleria-de-leonardis-castellaneta', slug: 'gioielleria-de-leonardis-castellaneta', nome: 'Gioielleria De Leonardis',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria De Leonardis in Via San Francesco 21 a Castellaneta è punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Mido quale rivenditore autorizzato in provincia di Taranto.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'castellaneta',
    posizione: { indirizzo: 'Via S. Francesco, 21', cap: '74011', coordinate: null, fonti: [MIDO_IT] },
    contatti: { telefono: '099 8491442', email: 'deleosk@libero.it', sito: null, whatsapp: null, social: [], fonti: [MIDO_IT] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MIDO_IT] }, { id: 'gioielleria', fonti: [MIDO_IT] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Mido.', fonti: [MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-de-leonardis-castellaneta' },
  },
  {
    id: 'pace-gioielli-brindisi', slug: 'pace-gioielli-brindisi', nome: 'Pace Gioielli — sede di Brindisi',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Pace Gioielli in Corso Roma 13 a Brindisi, realtà attiva dal 1970, dispone dal 2019 di un laboratorio interno a Brindisi per l’assistenza tecnica post-vendita ed è rivenditore ufficiale Hamilton attestato dallo store locator del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'brindisi',
    posizione: { indirizzo: 'Corso Roma, 13', cap: '72100', coordinate: null, fonti: [PACE_CONT, PACE_HAM] },
    contatti: { telefono: '+39 0831 523824', email: 'info@pacegioielli.it', sito: 'https://www.pacegioielli.com/contatti', whatsapp: null, social: [], fonti: [PACE_CONT, PACE_HAM] },
    orari: makeOrari([
      [2, '10:00-13:00', '17:00-20:00'], [3, '10:00-13:00', '17:00-20:00'],
      [4, '10:00-13:00', '17:00-20:00'], [5, '10:00-13:00', '17:00-20:00'], [6, '10:00-13:00', '17:00-20:00'],
    ], [PACE_CONT]),
    servizi: [
      { id: 'vendita', fonti: [PACE_HAM, PACE_STORIA] }, { id: 'manutenzione', fonti: [PACE_SERV] },
      { id: 'revisione', fonti: [PACE_SERV] }, { id: 'assistenza', fonti: [PACE_SERV] },
      { id: 'gioielleria', fonti: [PACE_STORIA] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [PACE_STORIA] }],
    marchi: {
      venduti: [
        { marca: 'Hamilton', fonti: [PACE_HAM] }, { marca: 'Rolex', fonti: [PACE_STORIA] },
        { marca: 'Tudor', fonti: [PACE_STORIA] },
      ],
      riparati: [{ marca: 'Rolex', fonti: [PACE_SERV] }, { marca: 'Tudor', fonti: [PACE_SERV] }],
      esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [PACE_HAM] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1970, fondatore: null,
      testo: 'Attiva dal 1970, Pace Gioielli opera in Corso Roma a Brindisi con un laboratorio interno di assistenza orologiera attivo dal 2019.',
      eventi: [
        { data: '1970', descrizione: 'Avvio dell’attività di Pace Gioielli.', fonti: [PACE_STORIA] },
        { data: '2019', descrizione: 'Attivazione del laboratorio di assistenza post-vendita a Brindisi.', fonti: [PACE_SERV] },
      ],
      fonti: [PACE_STORIA, PACE_SERV],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [PACE_CONT, PACE_SERV, PACE_STORIA, PACE_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda storica inserita da sito ufficiale e locator Hamilton.', fonti: [PACE_CONT, PACE_SERV, PACE_STORIA, PACE_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'pace-gioielli-brindisi' },
  },
  {
    id: 'naviglio-e-fiume-brindisi', slug: 'naviglio-e-fiume-brindisi', nome: 'Naviglio e Fiume Gioielleria',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Naviglio e Fiume Gioielleria in Corso Roma 22 a Brindisi è un punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Mido quale rivenditore autorizzato.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'brindisi',
    posizione: { indirizzo: 'Corso Roma, 22', cap: '72100', coordinate: null, fonti: [MIDO_IT] },
    contatti: { telefono: '0831 523128', email: 'info@naviglioefiumegioielleria.it', sito: null, whatsapp: null, social: [], fonti: [MIDO_IT] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [MIDO_IT] }, { id: 'gioielleria', fonti: [MIDO_IT] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [MIDO_IT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [MIDO_IT],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Mido.', fonti: [MIDO_IT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'naviglio-e-fiume-brindisi' },
  },
  {
    id: 'iacovone-via-del-corso-matera', slug: 'iacovone-via-del-corso-matera', nome: 'Iacovone Via Del Corso Srl',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Iacovone Via Del Corso Srl in Via del Corso 50 a Matera è rivenditore ufficiale Longines e Tissot attestato dai rispettivi store locator dei marchi, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'matera',
    posizione: { indirizzo: 'Via del Corso, 50', cap: '75100', coordinate: null, fonti: [IACOVONE_LON, IACOVONE_TIS] },
    contatti: { telefono: '0835 256377', email: 'info@iacovoneviadelcorso.it', sito: null, whatsapp: null, social: [], fonti: [IACOVONE_LON, IACOVONE_TIS] },
    orari: makeOrari([
      [1, '16:30-20:30'], [2, '09:30-13:00', '16:30-20:30'], [3, '09:30-13:00', '16:30-20:30'],
      [4, '09:30-13:00', '16:30-20:30'], [5, '09:30-13:00', '16:30-20:30'], [6, '09:30-13:00', '16:30-20:30'],
    ], [IACOVONE_TIS]),
    servizi: [
      { id: 'vendita', fonti: [IACOVONE_LON, IACOVONE_TIS] }, { id: 'manutenzione', fonti: [IACOVONE_LON] },
      { id: 'cinturini', fonti: [IACOVONE_LON] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [IACOVONE_LON] }, { marca: 'Tissot', fonti: [IACOVONE_TIS] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [IACOVONE_LON] }, { marca: 'Tissot', fonti: [IACOVONE_TIS] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [IACOVONE_LON, IACOVONE_TIS],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiali Longines e Tissot.', fonti: [IACOVONE_LON, IACOVONE_TIS] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'iacovone-via-del-corso-matera' },
  },
  {
    id: 'gioielleria-cometa-policoro', slug: 'gioielleria-cometa-policoro', nome: 'Gioielleria Cometa',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Gioielleria Cometa in Via Siris 77 a Policoro è punto vendita di orologeria e gioielleria attestato dallo store locator ufficiale Hamilton quale rivenditore autorizzato del marchio in provincia di Matera.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'policoro',
    posizione: { indirizzo: 'Via Siris, 77', cap: '75025', coordinate: null, fonti: [COMETA_HAM] },
    contatti: { telefono: '0835 985822', email: null, sito: null, whatsapp: null, social: [], fonti: [COMETA_HAM] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [COMETA_HAM] }, { id: 'gioielleria', fonti: [COMETA_HAM] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Hamilton', fonti: [COMETA_HAM] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [COMETA_HAM] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [COMETA_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 6 espansione nazionale: scheda inserita da locator ufficiale Hamilton.', fonti: [COMETA_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto6-20261026', idOriginale: 'gioielleria-cometa-policoro' },
  },
];

for (const f of nuoveFonti) {
  if (!directory.fonti.some(x => x.id === f.id)) {
    directory.fonti.push(f);
  }
}

for (const b of nuoveSchede) {
  if (directory.attivita.some(x => x.id === b.id || x.slug === b.slug)) {
    throw new Error(`Attività duplicata: ${b.id}`);
  }
  directory.attivita.push(b);
}

const validato = directorySchema.parse(directory);
const dupDaRevisionare = findDuplicates(validato).filter(
  d => d.esito === 'da-revisionare' && (nuoveSchede.some(n => n.id === d.primo) || nuoveSchede.some(n => n.id === d.secondo)),
);
if (dupDaRevisionare.length > 0) {
  console.warn('Attenzione: possibili segnali di duplicazione da verificare:', dupDaRevisionare);
}

writeFileSync(FILE, `${JSON.stringify(validato, null, 2)}\n`);
writeFileSync('data/reports/lotto-06-20261026-applied.json', `${JSON.stringify({
  lotto: 'lotto-06-20261026',
  data: DATA,
  regioniCoinvolte: ['Marche', 'Umbria', 'Lazio', 'Abruzzo', 'Campania', 'Puglia', 'Basilicata'],
  provinceCoinvolte: ['PU', 'FM', 'MC', 'TE', 'CH', 'PG', 'TR', 'LT', 'VT', 'BN', 'AV', 'FG', 'BT', 'TA', 'BR', 'MT'],
  provincePrimaAZeroCoperte: ['PU', 'FM', 'TE', 'BN', 'AV', 'FG', 'BT', 'TA', 'BR', 'MT'],
  candidatiEsaminati: 41,
  candidatiScartati: 9,
  motiviScarto: [
    'Gioielleria Berloni Fano: documentata solo da portale commerciale locale, priva di sito ufficiale autonomo',
    'Gioielleria Mattetti Fermo e Gioielleria Cichetti Teramo: CAP nel locator incoerente col comune dichiarato',
    'Gioielleria LineaOro Porto Sant’Elpidio, Le Ore Orvieto, Gioielleria Merola S. Maria Capua Vetere: indirizzo/CAP non pubblicati sulla pagina letta',
    'Biagini 1863 Perugia, Tempoidea Viterbo, Orologeria Mazzone Salerno: già presenti in catalogo (duplicati evitati)',
  ],
  nuoveLocalita: nuoveLocalita.map(l => ({ id: l.id, comune: l.comune, siglaProvincia: l.siglaProvincia, regione: l.regione })),
  nuoveSchede: nuoveSchede.map(b => ({ id: b.id, nome: b.nome, localitaId: b.localitaId, tipi: b.tipi, annoFondazione: b.storia.annoFondazione })),
  fontiAggiunte: nuoveFonti.map(f => ({ id: f.id, tipo: f.tipo, url: f.url })),
  totaleAttivitaPrima: validato.attivita.length - nuoveSchede.length,
  totaleAttivitaDopo: validato.attivita.length,
  totaleComuniPrima: validato.localita.length - nuoveLocalita.length,
  totaleComuniDopo: validato.localita.length,
}, null, 2)}\n`);

console.log(`Lotto 6 applicato: +${nuoveSchede.length} attività (totale ${validato.attivita.length}), +${nuoveLocalita.length} comuni (totale ${validato.localita.length}), +${nuoveFonti.length} fonti.`);
