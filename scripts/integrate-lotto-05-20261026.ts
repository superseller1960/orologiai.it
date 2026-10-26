// Lotto 5 di espansione nazionale (2026-10-26): Nord e Centro-Nord scoperto.
// Copre tutte le 8 province settentrionali a 0 attività (CN, SV, SP, PC, BZ, GO, PN, RE)
// e rafforza le province del Nord/Centro-Nord a 1 attività (TV, FE, FC, MO, AL, VC).
// Uso: npx tsx scripts/integrate-lotto-05-20261026.ts (idempotente: rifiuta se già applicato).
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory, type Business, type Locality } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-26';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;

if (directory.attivita.some(a => a.id === 'gioielleria-rabino-cuneo')) {
  console.error('Lotto 5 già applicato: nessuna modifica.');
  process.exit(1);
}

type Tipo = 'sito-ufficiale' | 'marchio-ufficiale' | 'directory' | 'stampa';
const nuoveFonti: { id: string; tipo: Tipo; url: string; titolo: string; consultataIl: string; percorsoArchivio: null; licenza: null }[] = [];
const u = (url: string, tipo: Tipo = 'sito-ufficiale', titoloCustom?: string): string => {
  const presente = directory.fonti.find(f => f.url === url);
  if (presente) return presente.id;
  const giaNuova = nuoveFonti.find(f => f.url === url);
  if (giaNuova) return giaNuova.id;
  const id = `l5-${url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 56).replace(/^-|-$/g, '')}`;
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

// --- Fonti verificate per il Lotto 5 ---
const RABINO_HOME = u('https://www.gioielleriarabino.com/');
const RABINO_LAB = u('https://www.gioielleriarabino.com/i-nostri-laboratori-2/');
const RABINO_STORIA = u('https://www.gioielleriarabino.com/la-nostra-storia/');
const RABINO_CONT = u('https://www.gioielleriarabino.com/contatti/');

const OROLAB_HOME = u('https://www.orolab.it/');
const OROLAB_LAB = u('https://www.orolab.it/laboratorio/');
const OROLAB_CONT = u('https://www.orolab.it/contatti/');

const CASCIOLA_HOME = u('https://www.casciolagioielli.com/');
const CASCIOLA_SERV = u('https://www.casciolagioielli.com/i-nostri-servizi/');
const CASCIOLA_CONT = u('https://www.casciolagioielli.com/contatti/');

const DUPANLOUP_HOME = u('https://www.dupanloup.it/');
const DUPANLOUP_CONT = u('https://www.dupanloup.it/contatti');
const DUPANLOUP_UNION = u('https://www.unioncamere.gov.it/imprese-storiche/dupanloup-srl', 'directory');

const DELFINO_SAV = u('https://www.delfinogioielli.com/negozio-savona.html');

const TRAVERSO_HOME = u('https://anticacasatraverso.com/');
const TRAVERSO_STORIA = u('https://anticacasatraverso.com/chi-siamo/');
const TRAVERSO_OROL = u('https://anticacasatraverso.com/orologeria/');
const TRAVERSO_CONT = u('https://anticacasatraverso.com/contatti/');

const RIZZUTO_SARZ = u('https://www.rizzutogioielleria.com/sarzana/');
const RIZZUTO_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italia/liguria/sarzana/rizzuto', 'marchio-ufficiale');

const ASTRUA_PC = u('https://www.astrua.com/it/sedi-astrua-boutiques-piacenza');
const ASTRUA_PC_RIP = u('https://www.astrua.com/it/riparazione-orologi-piacenza');
const ASTRUA_STORIA = u('https://www.astrua.com/it/chi-siamo');

const CLEMENTI_HOME = u('https://www.orologiaio-clementi.it/');
const CLEMENTI_RIP = u('https://www.orologiaio-clementi.it/chi-siamo/revisione-e-restauro/');
const CLEMENTI_CONT = u('https://www.orologiaio-clementi.it/chi-siamo/infoline/');

const RANZI_HOME = u('https://www.ranzi.com/it/home/');
const RANZI_RIP = u('https://www.ranzi.com/it/riparazioni-generali/');
const RANZI_STORIA = u('https://www.ranzi.com/it/juwelier-ranzi-wird-140-v2/');
const RANZI_MIDO = u('https://www.midowatches.com/it/store-locator', 'marchio-ufficiale');

const GASSER_CONT = u('https://it.vgasser.it/pages/kontakt');
const GASSER_LAB = u('https://it.vgasser.it/pages/werkstatt');
const GASSER_LON = u('https://www.longines.com/it/store/id/vgasser-kgsas-des-gasser-h-co-brunico-897244', 'marchio-ufficiale');

const CERNIGOI_STORIA = u('https://www.gioielleriacernigoi.com/chisiamo/');
const CERNIGOI_PRIV = u('https://www.gioielleriacernigoi.com/privacy-policy/');

const DOBNER_GO = u('https://dobner.it/it/negozi/dobner-gorizia/');

const NITTA_CONT = u('https://nittagioielli.com/contatti/');
const NITTA_LON = u('https://www.longines.com/it/store/id/nitta-gioielli-srl-pordenone-1063940', 'marchio-ufficiale');
const NITTA_HAM = u('https://www.hamiltonwatch.com/it-it/store-locator/italie/friuli-venezia-giulia/pordenone/nitta-gioielli', 'marchio-ufficiale');

const ZAMBON_HOME = u('https://www.gioielleriazambon.it/');

const CAMPARINI_STORIA = u('https://www.camparinigioielli.com/chi-siamo/');
const CAMPARINI_ROLEX = u('https://www.camparinigioielli.com/rolex/camparini-gioielli/136/');

const CADOPPI_MIDO = u('https://www.midowatches.com/it/store-locator/italy/reggio-emilia/', 'marchio-ufficiale');
const CADOPPI_TISSOT = u('https://www.tissotwatches.com/it-it/store/cadoppi-snc/a1vNN0000020KCYYA2', 'marchio-ufficiale');
const CADOPPI_HOME = u('https://www.cadoppi.it/');

const STS_HOME = u('https://stsorologeria.jimdoweb.com/');
const STS_LAB = u('https://stsorologeria.jimdoweb.com/il-nostro-laboratorio/');
const STS_CONT = u('https://stsorologeria.jimdoweb.com/contatti/');

const DARIOS_HOME = u('https://www.gioielleriadarios.it/');

const GIBERTI_HOME = u('https://www.gibertipreziosi.it/');
const GIBERTI_RIP = u('https://www.gibertipreziosi.it/Riparazioni');
const GIBERTI_CONT = u('https://www.gibertipreziosi.it/contatti');

const PRETOLANI_HOME = u('https://www.gioielleriapretolani.it/');
const PRETOLANI_LAB = u('https://www.gioielleriapretolani.it/laboratorio-orologiero');
const PRETOLANI_CONT = u('https://www.gioielleriapretolani.it/contatti');

const REGGIANI_HOME = u('https://www.orologeriareggiani.it/');
const REGGIANI_STORIA = u('https://www.orologeriareggiani.it/chi-siamo/');
const REGGIANI_CONT = u('https://www.orologeriareggiani.it/contatti/');

const HENRY_HOME = u('https://gioielleriahenry.com/');
const HENRY_LAB = u('https://gioielleriahenry.com/orologi-gallery/');
const HENRY_MIDO = u('https://www.midowatches.com/it/store-locator/italy/alessandria/henry-gioielli-a1vnn000001zie3yam', 'marchio-ufficiale');

const ROSSO_HOME = u('https://www.luigirossogioielli.com/it/assistenza');
const ROSSO_STORIA = u('https://www.luigirossogioielli.com/en/about-us');
const ROSSO_CONT = u('https://www.luigirossogioielli.com/it/contatti');

const BIONDI_HOME = u('https://www.biondivercelli.com/');
const BIONDI_CONT = u('https://www.biondivercelli.com/contatti');

const ERAORA_HOME = u('https://www.orologeriaeraora.it/');
const ERAORA_LAB = u('https://www.orologeriaeraora.it/laboratorio');

// --- Nuove località ---
const nuoveLocalita: Locality[] = [
  {
    id: 'cuneo', comune: 'Cuneo', comuneSlug: 'cuneo', provincia: 'Cuneo', provinciaSlug: 'cuneo',
    siglaProvincia: 'CN', regione: 'Piemonte', regioneSlug: 'piemonte', codiceIstat: null,
    descrizione: 'Cuneo raccoglie storiche orologerie e laboratori su Corso Nizza con servizi di riparazione, revisione e restauro.',
    fonti: [RABINO_HOME, CASCIOLA_CONT],
  },
  {
    id: 'bra', comune: 'Bra', comuneSlug: 'bra', provincia: 'Cuneo', provinciaSlug: 'cuneo',
    siglaProvincia: 'CN', regione: 'Piemonte', regioneSlug: 'piemonte', codiceIstat: null,
    descrizione: 'Il censimento a Bra documenta Orolab, laboratorio di riparazione, revisione e valutazione di orologi.',
    fonti: [OROLAB_CONT, OROLAB_LAB],
  },
  {
    id: 'savona', comune: 'Savona', comuneSlug: 'savona', provincia: 'Savona', provinciaSlug: 'savona',
    siglaProvincia: 'SV', regione: 'Liguria', regioneSlug: 'liguria', codiceIstat: null,
    descrizione: 'Savona ospita botteghe storiche di orologeria e gioielleria con laboratori interni di assistenza e riparazione.',
    fonti: [DUPANLOUP_HOME, DELFINO_SAV],
  },
  {
    id: 'la-spezia', comune: 'La Spezia', comuneSlug: 'la-spezia', provincia: 'La Spezia', provinciaSlug: 'la-spezia',
    siglaProvincia: 'SP', regione: 'Liguria', regioneSlug: 'liguria', codiceIstat: null,
    descrizione: 'Il censimento a La Spezia documenta Antica Casa Traverso, bottega storica attiva in Via del Prione dal 1920.',
    fonti: [TRAVERSO_STORIA, TRAVERSO_CONT],
  },
  {
    id: 'sarzana', comune: 'Sarzana', comuneSlug: 'sarzana', provincia: 'La Spezia', provinciaSlug: 'la-spezia',
    siglaProvincia: 'SP', regione: 'Liguria', regioneSlug: 'liguria', codiceIstat: null,
    descrizione: 'Il censimento a Sarzana documenta Rizzuto Gioielleria, attività storica e rivenditore ufficiale Hamilton.',
    fonti: [RIZZUTO_SARZ, RIZZUTO_HAM],
  },
  {
    id: 'piacenza', comune: 'Piacenza', comuneSlug: 'piacenza', provincia: 'Piacenza', provinciaSlug: 'piacenza',
    siglaProvincia: 'PC', regione: 'Emilia-Romagna', regioneSlug: 'emilia-romagna', codiceIstat: null,
    descrizione: 'A Piacenza è censita la sede di Corso Vittorio Emanuele II di Astrua 1860, con servizi di riparazione, revisione e assistenza tecnica.',
    fonti: [ASTRUA_PC, ASTRUA_PC_RIP],
  },
  {
    id: 'bolzano', comune: 'Bolzano', comuneSlug: 'bolzano', provincia: 'Bolzano/Bozen', provinciaSlug: 'bolzano',
    siglaProvincia: 'BZ', regione: 'Trentino-Alto Adige', regioneSlug: 'trentino-alto-adige', codiceIstat: null,
    descrizione: 'Bolzano conta laboratori di riparazione e restauro di tradizione familiare e storiche gioiellerie fondate nell’Ottocento.',
    fonti: [CLEMENTI_CONT, RANZI_HOME],
  },
  {
    id: 'brunico', comune: 'Brunico', comuneSlug: 'brunico', provincia: 'Bolzano/Bozen', provinciaSlug: 'bolzano',
    siglaProvincia: 'BZ', regione: 'Trentino-Alto Adige', regioneSlug: 'trentino-alto-adige', codiceIstat: null,
    descrizione: 'A Brunico opera la storica orologeria e laboratorio V. Gasser, attiva dal 1873 con maestri orologiai in sede.',
    fonti: [GASSER_CONT, GASSER_LAB],
  },
  {
    id: 'monfalcone', comune: 'Monfalcone', comuneSlug: 'monfalcone', provincia: 'Gorizia', provinciaSlug: 'gorizia',
    siglaProvincia: 'GO', regione: 'Friuli-Venezia Giulia', regioneSlug: 'friuli-venezia-giulia', codiceIstat: null,
    descrizione: 'A Monfalcone è censita Gioielleria Cernigoi, bottega familiare fondata nel 1937 con servizi di revisione e restauro.',
    fonti: [CERNIGOI_STORIA, CERNIGOI_PRIV],
  },
  {
    id: 'gorizia', comune: 'Gorizia', comuneSlug: 'gorizia', provincia: 'Gorizia', provinciaSlug: 'gorizia',
    siglaProvincia: 'GO', regione: 'Friuli-Venezia Giulia', regioneSlug: 'friuli-venezia-giulia', codiceIstat: null,
    descrizione: 'A Gorizia è presente la sede di Corso Italia di Dobner, attiva nella storica bottega cittadina.',
    fonti: [DOBNER_GO],
  },
  {
    id: 'pordenone', comune: 'Pordenone', comuneSlug: 'pordenone', provincia: 'Pordenone', provinciaSlug: 'pordenone',
    siglaProvincia: 'PN', regione: 'Friuli-Venezia Giulia', regioneSlug: 'friuli-venezia-giulia', codiceIstat: null,
    descrizione: 'Pordenone ospita orologerie storiche e rivenditori ufficiali con servizi di manutenzione, revisione e riparazione.',
    fonti: [NITTA_CONT, ZAMBON_HOME],
  },
  {
    id: 'reggio-emilia', comune: "Reggio nell'Emilia", comuneSlug: 'reggio-emilia', provincia: "Reggio nell'Emilia", provinciaSlug: 'reggio-emilia',
    siglaProvincia: 'RE', regione: 'Emilia-Romagna', regioneSlug: 'emilia-romagna', codiceIstat: null,
    descrizione: "A Reggio nell'Emilia operano storiche orologerie e rivenditori ufficiali lungo Via Emilia San Pietro.",
    fonti: [CAMPARINI_STORIA, CADOPPI_MIDO],
  },
  {
    id: 'conegliano', comune: 'Conegliano', comuneSlug: 'conegliano', provincia: 'Treviso', provinciaSlug: 'treviso',
    siglaProvincia: 'TV', regione: 'Veneto', regioneSlug: 'veneto', codiceIstat: null,
    descrizione: 'Conegliano conta laboratori specializzati nella riparazione e nel restauro conservativo di orologi e storiche attività cittadine.',
    fonti: [STS_HOME, DARIOS_HOME],
  },
  {
    id: 'casale-monferrato', comune: 'Casale Monferrato', comuneSlug: 'casale-monferrato', provincia: 'Alessandria', provinciaSlug: 'alessandria',
    siglaProvincia: 'AL', regione: 'Piemonte', regioneSlug: 'piemonte', codiceIstat: null,
    descrizione: 'A Casale Monferrato opera Luigi Rosso Orologi e Gioielli, con tecnici orologiai dedicati a riparazione, revisione e restauro.',
    fonti: [ROSSO_HOME, ROSSO_CONT],
  },
];

for (const loc of nuoveLocalita) {
  if (!directory.localita.some(l => l.id === loc.id)) {
    directory.localita.push(loc);
  }
}

// --- 26 nuove schede verificate ---
const nuoveSchede: Business[] = [
  {
    id: 'gioielleria-rabino-cuneo', slug: 'gioielleria-rabino-cuneo', nome: 'Gioielleria Rabino',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Rabino, attiva in Corso Nizza 10 a Cuneo con radici orafe documentate dal 1895 attraverso quattro generazioni familiari, dispone dal 2004 di un laboratorio interno dedicato ad assistenza, manutenzione e riparazione di orologi moderni e antichi, meccanici e al quarzo, oltre al restauro di casse, quadranti e bracciali e alla proposta di secondo polso.',
    nomiPrecedenti: ['Rabino Mario & C. S.r.l.'], gruppoId: null, localitaId: 'cuneo',
    posizione: { indirizzo: 'Corso Nizza, 10', cap: '12100', coordinate: null, fonti: [RABINO_CONT] },
    contatti: { telefono: '0171 692826', email: 'rabino@rabino1895.it', sito: 'https://www.gioielleriarabino.com/', whatsapp: null, social: [], fonti: [RABINO_CONT, RABINO_HOME] },
    orari: makeOrari([
      [2, '09:00-12:30', '15:15-19:30'], [3, '09:00-12:30', '15:15-19:30'],
      [4, '09:00-12:30', '15:15-19:30'], [5, '09:00-12:30', '15:15-19:30'], [6, '09:00-12:30', '15:15-19:30'],
    ], [RABINO_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [RABINO_LAB] }, { id: 'manutenzione', fonti: [RABINO_LAB] },
      { id: 'riparazione-meccanici', fonti: [RABINO_LAB] }, { id: 'riparazione-quarzo', fonti: [RABINO_LAB] },
      { id: 'restauro-vintage', fonti: [RABINO_LAB] }, { id: 'lucidatura', fonti: [RABINO_LAB] },
      { id: 'vendita', fonti: [RABINO_HOME] }, { id: 'vendita-usati', fonti: [RABINO_HOME] },
      { id: 'assistenza', fonti: [RABINO_LAB] }, { id: 'gioielleria', fonti: [RABINO_HOME] },
    ],
    altriServizi: [{ nome: 'Restauro di casse, quadranti e bracciali', fonti: [RABINO_LAB] }],
    specializzazioni: [{ id: 'meccanici', fonti: [RABINO_LAB] }, { id: 'antichi', fonti: [RABINO_LAB] }, { id: 'lusso', fonti: [RABINO_HOME] }],
    marchi: {
      venduti: [
        { marca: 'Rolex', fonti: [RABINO_HOME] }, { marca: 'Patek Philippe', fonti: [RABINO_HOME] },
        { marca: 'IWC', fonti: [RABINO_HOME] }, { marca: 'Tudor', fonti: [RABINO_HOME] },
        { marca: 'Baume & Mercier', fonti: [RABINO_HOME] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1895, fondatore: null,
      testo: 'Il sito aziendale documenta l’apertura del primo laboratorio orafo nel 1895 a Cuneo, la continuità familiare lungo quattro generazioni e l’avvio del laboratorio dedicato all’orologeria nel 2004.',
      eventi: [
        { data: '1895', descrizione: 'Fondazione del primo laboratorio a Cuneo.', fonti: [RABINO_STORIA] },
        { data: '2004', descrizione: 'Apertura del laboratorio interno per assistenza e riparazione orologi.', fonti: [RABINO_LAB] },
      ],
      fonti: [RABINO_STORIA, RABINO_LAB],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [RABINO_HOME, RABINO_LAB, RABINO_STORIA, RABINO_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale dell’attività.', fonti: [RABINO_HOME, RABINO_LAB, RABINO_STORIA, RABINO_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-rabino-cuneo' },
  },
  {
    id: 'orolab-bra', slug: 'orolab-bra', nome: 'Orolab',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orolab in Via Cuneo 84 a Bra è un laboratorio e punto vendita dedicato alla valutazione, riparazione e revisione parziale o completa di orologi, con servizi di sostituzione batterie, controllo carica, sostituzione vetri e cinturini e test di impermeabilità.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'bra',
    posizione: { indirizzo: 'Via Cuneo, 84', cap: '12042', coordinate: null, fonti: [OROLAB_CONT] },
    contatti: { telefono: '392 1728202', email: 'info@orolab.it', sito: 'https://www.orolab.it/', whatsapp: '+393921728202', social: [], fonti: [OROLAB_CONT, OROLAB_HOME] },
    orari: makeOrari([
      [2, '09:30-12:30', '15:30-19:00'], [3, '09:30-12:30', '15:30-19:00'],
      [4, '09:30-12:30', '15:30-19:00'], [5, '09:30-12:30', '15:30-19:00'], [6, '09:30-12:30'],
    ], [OROLAB_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [OROLAB_LAB] }, { id: 'revisione', fonti: [OROLAB_LAB] },
      { id: 'manutenzione', fonti: [OROLAB_LAB] }, { id: 'batterie', fonti: [OROLAB_LAB] },
      { id: 'cinturini', fonti: [OROLAB_LAB] }, { id: 'ricambi', fonti: [OROLAB_LAB] },
      { id: 'valutazioni', fonti: [OROLAB_LAB] }, { id: 'vendita', fonti: [OROLAB_HOME] },
      { id: 'vendita-usati', fonti: [OROLAB_HOME] },
    ],
    altriServizi: [{ nome: 'Sostituzione vetro e prova di impermeabilità', fonti: [OROLAB_LAB] }],
    specializzazioni: [{ id: 'lusso', fonti: [OROLAB_HOME] }, { id: 'vintage', fonti: [OROLAB_HOME] }],
    marchi: {
      venduti: [],
      riparati: [{ marca: 'Rolex', fonti: [OROLAB_LAB] }, { marca: 'Omega', fonti: [OROLAB_LAB] }, { marca: 'Longines', fonti: [OROLAB_LAB] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [OROLAB_HOME, OROLAB_LAB, OROLAB_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [OROLAB_HOME, OROLAB_LAB, OROLAB_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'orolab-bra' },
  },
  {
    id: 'casciola-gioielli-cuneo', slug: 'casciola-gioielli-cuneo', nome: 'Casciola Gioielli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Casciola Gioielli in Corso Nizza 11 a Cuneo affianca alla gioielleria e orologeria i servizi tecnici di riparazione, revisione dei movimenti, sostituzione di batterie, vetri e cinturini.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'cuneo',
    posizione: { indirizzo: 'Corso Nizza, 11', cap: '12100', coordinate: null, fonti: [CASCIOLA_CONT] },
    contatti: { telefono: '0171 1641602', email: 'info@casciolagioielli.com', sito: 'https://www.casciolagioielli.com/', whatsapp: null, social: [], fonti: [CASCIOLA_CONT, CASCIOLA_HOME] },
    orari: makeOrari([
      [2, '09:00-12:30', '15:00-19:30'], [3, '09:00-12:30', '15:00-19:30'],
      [4, '09:00-12:30', '15:00-19:30'], [5, '09:00-12:30', '15:00-19:30'], [6, '09:00-12:30', '15:00-19:30'],
    ], [CASCIOLA_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [CASCIOLA_SERV] }, { id: 'revisione', fonti: [CASCIOLA_SERV] },
      { id: 'batterie', fonti: [CASCIOLA_SERV] }, { id: 'cinturini', fonti: [CASCIOLA_SERV] },
      { id: 'ricambi', fonti: [CASCIOLA_SERV] }, { id: 'vendita', fonti: [CASCIOLA_HOME] },
      { id: 'gioielleria', fonti: [CASCIOLA_HOME] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CASCIOLA_HOME, CASCIOLA_SERV, CASCIOLA_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [CASCIOLA_HOME, CASCIOLA_SERV, CASCIOLA_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'casciola-gioielli-cuneo' },
  },
  {
    id: 'dupanloup-savona', slug: 'dupanloup-savona', nome: 'A. Dupanloup',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'A. Dupanloup in Piazza Sandro Pertini 44 a Savona è una storica maison orologiera ligure iscritta nel Registro delle Imprese Storiche Unioncamere con avvio dichiarato nel 1880; dispone di laboratorio interno dedicato all’assistenza post-vendita e alle revisioni.',
    nomiPrecedenti: ['A. Dupanloup S.r.l.'], gruppoId: null, localitaId: 'savona',
    posizione: { indirizzo: 'Piazza Sandro Pertini, 44', cap: '17100', coordinate: null, fonti: [DUPANLOUP_CONT] },
    contatti: { telefono: '019 850608', email: 'info@dupanloup.it', sito: 'https://www.dupanloup.it/', whatsapp: null, social: [], fonti: [DUPANLOUP_CONT, DUPANLOUP_HOME] },
    orari: makeOrari([
      [2, '09:30-12:30', '15:30-19:30'], [3, '09:30-12:30', '15:30-19:30'],
      [4, '09:30-12:30', '15:30-19:30'], [5, '09:30-12:30', '15:30-19:30'], [6, '09:30-12:30', '15:30-19:30'],
    ], [DUPANLOUP_CONT]),
    servizi: [
      { id: 'vendita', fonti: [DUPANLOUP_HOME] }, { id: 'revisione', fonti: [DUPANLOUP_HOME] },
      { id: 'manutenzione', fonti: [DUPANLOUP_HOME] }, { id: 'assistenza', fonti: [DUPANLOUP_HOME] },
      { id: 'gioielleria', fonti: [DUPANLOUP_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [DUPANLOUP_HOME] }],
    marchi: {
      venduti: [{ marca: 'Rolex', fonti: [DUPANLOUP_HOME] }, { marca: 'Tudor', fonti: [DUPANLOUP_HOME] }],
      riparati: [{ marca: 'Rolex', fonti: [DUPANLOUP_HOME] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1880, fondatore: null,
      testo: 'La scheda delle Imprese Storiche Unioncamere riporta l’avvio attività dichiarato nel 1880 e ricostruisce la tradizione familiare dell’orologeria a Savona fin dagli anni ottanta dell’Ottocento.',
      eventi: [{ data: '1880', descrizione: 'Avvio dell’attività storica a Savona attestato da Unioncamere.', fonti: [DUPANLOUP_UNION] }],
      fonti: [DUPANLOUP_HOME, DUPANLOUP_UNION],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [DUPANLOUP_HOME, DUPANLOUP_CONT, DUPANLOUP_UNION],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: bottega storica inserita da sito ufficiale e registro Unioncamere.', fonti: [DUPANLOUP_HOME, DUPANLOUP_CONT, DUPANLOUP_UNION] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'dupanloup-savona' },
  },
  {
    id: 'gioielleria-delfino-savona', slug: 'gioielleria-delfino-savona', nome: 'Gioielleria Delfino',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Delfino in Via Luigi Corsi 7/R a Savona nasce nel 1928 dall’attività di riparatore di orologi di Giovanni Delfino; dispone di laboratorio per riparazioni orologiere e propone maison svizzere quali Omega, Breitling, TAG Heuer, Longines, Oris, Hamilton e Tissot.',
    nomiPrecedenti: ['Delfino Giovanni e Ubaldo S.r.l.'], gruppoId: null, localitaId: 'savona',
    posizione: { indirizzo: 'Via Luigi Corsi, 7/R', cap: '17100', coordinate: null, fonti: [DELFINO_SAV] },
    contatti: { telefono: '019 824917', email: 'info@delfinogioielli.com', sito: 'https://www.delfinogioielli.com/', whatsapp: null, social: [], fonti: [DELFINO_SAV] },
    orari: makeOrari([
      [2, '09:15-13:00', '15:30-19:30'], [3, '09:15-13:00', '15:30-19:30'],
      [4, '09:15-13:00', '15:30-19:30'], [5, '09:15-13:00', '15:30-19:30'], [6, '09:15-13:00', '15:30-19:30'],
    ], [DELFINO_SAV]),
    servizi: [
      { id: 'riparazione', fonti: [DELFINO_SAV] }, { id: 'vendita', fonti: [DELFINO_SAV] },
      { id: 'assistenza', fonti: [DELFINO_SAV] }, { id: 'gioielleria', fonti: [DELFINO_SAV] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [DELFINO_SAV] }],
    marchi: {
      venduti: [
        { marca: 'Omega', fonti: [DELFINO_SAV] }, { marca: 'Breitling', fonti: [DELFINO_SAV] },
        { marca: 'TAG Heuer', fonti: [DELFINO_SAV] }, { marca: 'Longines', fonti: [DELFINO_SAV] },
        { marca: 'Oris', fonti: [DELFINO_SAV] }, { marca: 'Baume & Mercier', fonti: [DELFINO_SAV] },
        { marca: 'Hamilton', fonti: [DELFINO_SAV] }, { marca: 'Tissot', fonti: [DELFINO_SAV] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1928, fondatore: 'Giovanni Delfino',
      testo: 'Fondata a Savona nel 1928 da Giovanni Delfino, riparatore di orologi come il padre Vincenzo, l’attività conserva un laboratorio per interventi di riparazione orologiera.',
      eventi: [{ data: '1928', descrizione: 'Apertura dell’orologeria a Savona da parte di Giovanni Delfino.', fonti: [DELFINO_SAV] }],
      fonti: [DELFINO_SAV],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [DELFINO_SAV],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda storica inserita da sito ufficiale.', fonti: [DELFINO_SAV] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-delfino-savona' },
  },
  {
    id: 'antica-casa-traverso-la-spezia', slug: 'antica-casa-traverso-la-spezia', nome: 'Antica Casa Traverso',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Antica Casa Traverso in Via del Prione 119 a La Spezia è una bottega familiare avviata nel 1920 e giunta alla quarta generazione negli arredi storici originali; propone vendita di orologi, sveglie antiche e sostituzione o riparazione di cinturini.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'la-spezia',
    posizione: { indirizzo: 'Via del Prione, 119', cap: '19121', coordinate: null, fonti: [TRAVERSO_CONT] },
    contatti: { telefono: '0187 735156', email: 'anticacasatraverso@gmail.com', sito: 'https://anticacasatraverso.com/', whatsapp: null, social: [], fonti: [TRAVERSO_CONT, TRAVERSO_HOME] },
    orari: makeOrari([
      [1, '15:30-19:45'], [2, '09:30-12:45', '15:30-19:45'], [3, '09:30-12:45', '15:30-19:45'],
      [4, '09:30-12:45', '15:30-19:45'], [5, '09:30-12:45', '15:30-19:45'], [6, '09:30-12:45', '15:30-19:45'],
    ], [TRAVERSO_CONT]),
    servizi: [
      { id: 'vendita', fonti: [TRAVERSO_OROL] }, { id: 'cinturini', fonti: [TRAVERSO_OROL] },
      { id: 'gioielleria', fonti: [TRAVERSO_HOME] },
    ],
    altriServizi: [{ nome: 'Sveglie antiche e fornitura cinturini Morellato', fonti: [TRAVERSO_OROL] }],
    specializzazioni: [{ id: 'antichi', fonti: [TRAVERSO_OROL] }],
    marchi: {
      venduti: [{ marca: 'Mondia', fonti: [TRAVERSO_OROL] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1920, fondatore: null,
      testo: 'Avviata nel 1920 a La Spezia, l’attività è condotta dalla quarta generazione familiare conservando gli arredi storici in Via del Prione.',
      eventi: [{ data: '1920', descrizione: 'Avvio dell’attività familiare a La Spezia.', fonti: [TRAVERSO_STORIA] }],
      fonti: [TRAVERSO_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [TRAVERSO_HOME, TRAVERSO_STORIA, TRAVERSO_OROL, TRAVERSO_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: bottega storica inserita da sito ufficiale.', fonti: [TRAVERSO_HOME, TRAVERSO_STORIA, TRAVERSO_OROL, TRAVERSO_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'antica-casa-traverso-la-spezia' },
  },
  {
    id: 'rizzuto-gioielleria-sarzana', slug: 'rizzuto-gioielleria-sarzana', nome: 'Rizzuto Gioielleria',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Rizzuto Gioielleria in Via Landinelli 60/62 a Sarzana opera dal 1960 ed è attestata dallo store locator ufficiale Hamilton come rivenditore autorizzato del marchio, oltre a proporre segnatempo Baume & Mercier e U-Boat.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'sarzana',
    posizione: { indirizzo: 'Via Landinelli, 60/62', cap: '19038', coordinate: null, fonti: [RIZZUTO_SARZ, RIZZUTO_HAM] },
    contatti: { telefono: '0187 621545', email: 'brandalb@libero.it', sito: 'https://www.rizzutogioielleria.com/', whatsapp: null, social: [], fonti: [RIZZUTO_SARZ, RIZZUTO_HAM] },
    orari: makeOrari([
      [1, '15:30-19:30'], [2, '09:30-12:30', '15:30-19:30'], [3, '09:30-12:30', '15:30-19:30'],
      [4, '09:30-12:30', '15:30-19:30'], [5, '09:30-12:30', '15:30-19:30'],
    ], [RIZZUTO_SARZ]),
    servizi: [{ id: 'vendita', fonti: [RIZZUTO_HAM, RIZZUTO_SARZ] }, { id: 'gioielleria', fonti: [RIZZUTO_SARZ] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [
        { marca: 'Hamilton', fonti: [RIZZUTO_HAM] }, { marca: 'Baume & Mercier', fonti: [RIZZUTO_SARZ] },
        { marca: 'U-Boat', fonti: [RIZZUTO_SARZ] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Hamilton', fonti: [RIZZUTO_HAM] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1960, fondatore: null,
      testo: 'Il sito aziendale documenta l’attività della gioielleria e orologeria Rizzuto dal 1960.',
      eventi: [], fonti: [RIZZUTO_SARZ],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [RIZZUTO_SARZ, RIZZUTO_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale e locator Hamilton.', fonti: [RIZZUTO_SARZ, RIZZUTO_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'rizzuto-gioielleria-sarzana' },
  },
  {
    id: 'astrua-piacenza', slug: 'astrua-piacenza', nome: 'Astrua 1860 — sede di Piacenza',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Sede piacentina di Astrua 1860 in Corso Vittorio Emanuele II 21 a Piacenza: la storica casa orologiera fondata nel 1860 vi offre assistenza tecnica, revisione, riparazione, restauro e valutazione di orologi di alta gamma.',
    nomiPrecedenti: [], gruppoId: 'astrua-1860', localitaId: 'piacenza',
    posizione: { indirizzo: 'Corso Vittorio Emanuele II, 21', cap: '29121', coordinate: null, fonti: [ASTRUA_PC] },
    contatti: { telefono: '0523 315532', email: null, sito: 'https://www.astrua.com/it/sedi-astrua-boutiques-piacenza', whatsapp: null, social: [], fonti: [ASTRUA_PC] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [ASTRUA_PC_RIP] }, { id: 'revisione', fonti: [ASTRUA_PC_RIP] },
      { id: 'manutenzione', fonti: [ASTRUA_PC_RIP] }, { id: 'restauro-vintage', fonti: [ASTRUA_PC_RIP] },
      { id: 'valutazioni', fonti: [ASTRUA_PC_RIP] }, { id: 'vendita', fonti: [ASTRUA_PC] },
      { id: 'assistenza', fonti: [ASTRUA_PC_RIP] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [ASTRUA_PC] }],
    marchi: {
      venduti: [{ marca: 'Rolex', fonti: [ASTRUA_PC] }],
      riparati: [{ marca: 'Rolex', fonti: [ASTRUA_PC_RIP] }, { marca: 'Patek Philippe', fonti: [ASTRUA_PC_RIP] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1860, fondatore: 'Vincenzo Astrua',
      testo: 'La maison Astrua fa risalire la propria fondazione al 1860 a Torino; la boutique di Piacenza estende in Emilia i servizi di vendita e assistenza orologiera del gruppo.',
      eventi: [], fonti: [ASTRUA_STORIA, ASTRUA_PC],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ASTRUA_PC, ASTRUA_PC_RIP, ASTRUA_STORIA],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: sede di Piacenza inserita da pagine ufficiali Astrua.', fonti: [ASTRUA_PC, ASTRUA_PC_RIP, ASTRUA_STORIA] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'astrua-piacenza' },
  },
  {
    id: 'orologeria-clementi-bolzano', slug: 'orologeria-clementi-bolzano', nome: 'Orologeria Clementi',
    tipi: ['orologeria', 'laboratorio', 'professionista'],
    descrizione: 'Orologeria Clementi in Piazza delle Erbe 24/A a Bolzano è un laboratorio indipendente di tradizione familiare da tre generazioni, specializzato in riparazione, revisione e restauro di orologi da polso e da tasca con ricambi originali.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'bolzano',
    posizione: { indirizzo: 'Piazza delle Erbe, 24/A', cap: '39100', coordinate: null, fonti: [CLEMENTI_CONT] },
    contatti: { telefono: '+39 0471 974482', email: null, sito: 'https://www.orologiaio-clementi.it/', whatsapp: null, social: [], fonti: [CLEMENTI_CONT, CLEMENTI_HOME] },
    orari: makeOrari([
      [1, '09:00-12:00'], [2, '09:00-12:00'], [3, '09:00-12:00'], [4, '09:00-12:00'], [5, '09:00-12:00'],
    ], [CLEMENTI_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [CLEMENTI_RIP] }, { id: 'revisione', fonti: [CLEMENTI_RIP] },
      { id: 'restauro-vintage', fonti: [CLEMENTI_RIP] }, { id: 'orologi-tasca', fonti: [CLEMENTI_RIP] },
      { id: 'ricambi', fonti: [CLEMENTI_RIP] },
    ],
    altriServizi: [],
    specializzazioni: [{ id: 'meccanici', fonti: [CLEMENTI_RIP] }, { id: 'vintage', fonti: [CLEMENTI_RIP] }, { id: 'antichi', fonti: [CLEMENTI_RIP] }],
    marchi: {
      venduti: [],
      riparati: [{ marca: 'Zenith', fonti: [CLEMENTI_RIP] }, { marca: 'Rolex', fonti: [CLEMENTI_RIP] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: null, fondatore: null,
      testo: 'Il sito documenta un’attività familiare di orologiai tramandata da tre generazioni e oltre trentacinque anni di esperienza tecnica di Christian Clementi a Bolzano.',
      eventi: [], fonti: [CLEMENTI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CLEMENTI_HOME, CLEMENTI_RIP, CLEMENTI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [CLEMENTI_HOME, CLEMENTI_RIP, CLEMENTI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'orologeria-clementi-bolzano' },
  },
  {
    id: 'gioielleria-ranzi-bolzano', slug: 'gioielleria-ranzi-bolzano', nome: 'Gioielleria Ranzi',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Ranzi in Via Museo 14/B a Bolzano, fondata nel 1884 da Josef Ranzi e giunta alla quinta generazione familiare, esegue riparazioni di orologeria e tratta marchi svizzeri tra cui Omega, Breitling, IWC, Longines, Tissot e Mido (attestato dal locator ufficiale Mido).',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'bolzano',
    posizione: { indirizzo: 'Via Museo, 14/B', cap: '39100', coordinate: null, fonti: [RANZI_HOME, RANZI_MIDO] },
    contatti: { telefono: '+39 0471 970799', email: 'info@ranzi.com', sito: 'https://www.ranzi.com/it/home/', whatsapp: null, social: [], fonti: [RANZI_HOME, RANZI_MIDO] },
    orari: makeOrari([
      [1, '09:30-12:30', '15:00-18:30'], [2, '09:30-12:30', '15:00-18:30'],
      [3, '09:30-12:30', '15:00-18:30'], [4, '09:30-12:30', '15:00-18:30'],
      [5, '09:30-12:30', '15:00-18:30'], [6, '09:30-12:30'],
    ], [RANZI_HOME]),
    servizi: [
      { id: 'riparazione', fonti: [RANZI_RIP] }, { id: 'manutenzione', fonti: [RANZI_RIP] },
      { id: 'vendita', fonti: [RANZI_HOME] }, { id: 'assistenza', fonti: [RANZI_RIP] },
      { id: 'gioielleria', fonti: [RANZI_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [RANZI_HOME] }],
    marchi: {
      venduti: [
        { marca: 'Omega', fonti: [RANZI_HOME] }, { marca: 'Breitling', fonti: [RANZI_HOME] },
        { marca: 'IWC', fonti: [RANZI_HOME] }, { marca: 'Longines', fonti: [RANZI_HOME] },
        { marca: 'Tissot', fonti: [RANZI_HOME] }, { marca: 'Mido', fonti: [RANZI_MIDO] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [RANZI_MIDO] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1884, fondatore: 'Josef Ranzi',
      testo: 'Fondata nel 1884 da Josef Ranzi a Bolzano, l’attività è condotta dalla quinta generazione della famiglia.',
      eventi: [{ data: '1884', descrizione: 'Fondazione della gioielleria e orologeria Ranzi a Bolzano.', fonti: [RANZI_STORIA] }],
      fonti: [RANZI_STORIA, RANZI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [RANZI_HOME, RANZI_RIP, RANZI_STORIA, RANZI_MIDO],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: bottega storica inserita da sito ufficiale e locator Mido.', fonti: [RANZI_HOME, RANZI_RIP, RANZI_STORIA, RANZI_MIDO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-ranzi-bolzano' },
  },
  {
    id: 'v-gasser-brunico', slug: 'v-gasser-brunico', nome: 'V. Gasser',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'V. Gasser in Via Centrale 44 a Brunico vanta una tradizione dal 1873 e un laboratorio interno con tre maestri orologiai per riparazioni, revisioni, cambio batterie, lucidatura, ricambi e interventi su pendole e orologi da tavolo, oltre alla rivendita ufficiale Longines.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'brunico',
    posizione: { indirizzo: 'Via Centrale, 44', cap: '39031', coordinate: null, fonti: [GASSER_CONT, GASSER_LON] },
    contatti: { telefono: '+39 0474 555449', email: 'info@vgasser.it', sito: 'https://it.vgasser.it/', whatsapp: null, social: [], fonti: [GASSER_CONT, GASSER_LON] },
    orari: makeOrari([
      [1, '09:00-12:00', '14:30-18:30'], [2, '09:00-12:00', '14:30-18:30'],
      [3, '09:00-12:00', '14:30-18:30'], [4, '09:00-12:00', '14:30-18:30'],
      [5, '09:00-12:00', '14:30-18:30'], [6, '09:00-12:00'],
    ], [GASSER_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [GASSER_LAB] }, { id: 'revisione', fonti: [GASSER_LAB] },
      { id: 'manutenzione', fonti: [GASSER_LAB] }, { id: 'batterie', fonti: [GASSER_LAB] },
      { id: 'lucidatura', fonti: [GASSER_LAB] }, { id: 'ricambi', fonti: [GASSER_LAB] },
      { id: 'pendoleria', fonti: [GASSER_LAB] }, { id: 'vendita', fonti: [GASSER_LON] },
    ],
    altriServizi: [{ nome: 'Test di impermeabilità e riparazione orologi da tavolo', fonti: [GASSER_LAB] }],
    specializzazioni: [{ id: 'meccanici', fonti: [GASSER_LAB] }],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [GASSER_LON] }, { marca: 'Hamilton', fonti: [GASSER_LAB] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [GASSER_LON] }],
      menzionati: [],
    },
    storia: {
      annoFondazione: 1873, fondatore: null,
      testo: 'Il sito ufficiale documenta una tradizione orologiera a Brunico avviata nel 1873, con laboratorio interno presidiato da tre maestri orologiai.',
      eventi: [{ data: '1873', descrizione: 'Avvio della tradizione V. Gasser a Brunico.', fonti: [GASSER_LAB] }],
      fonti: [GASSER_LAB],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [GASSER_CONT, GASSER_LAB, GASSER_LON],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio storico inserito da sito ufficiale e locator Longines.', fonti: [GASSER_CONT, GASSER_LAB, GASSER_LON] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'v-gasser-brunico' },
  },
  {
    id: 'gioielleria-cernigoi-monfalcone', slug: 'gioielleria-cernigoi-monfalcone', nome: 'Gioielleria Cernigoi',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Cernigoi in Via Duca d’Aosta 80 a Monfalcone, fondata nel 1937 da Antonio Cernigoi a partire da un laboratorio di orologeria, offre servizi di revisione, riparazione e restauro di orologi.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'monfalcone',
    posizione: { indirizzo: 'Via Duca d’Aosta, 80', cap: '34074', coordinate: null, fonti: [CERNIGOI_PRIV] },
    contatti: { telefono: null, email: 'info@gioielleriacernigoi.com', sito: 'https://www.gioielleriacernigoi.com/chisiamo/', whatsapp: null, social: [], fonti: [CERNIGOI_PRIV, CERNIGOI_STORIA] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [CERNIGOI_STORIA] }, { id: 'revisione', fonti: [CERNIGOI_STORIA] },
      { id: 'restauro-vintage', fonti: [CERNIGOI_STORIA] }, { id: 'vendita', fonti: [CERNIGOI_STORIA] },
      { id: 'gioielleria', fonti: [CERNIGOI_STORIA] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'vintage', fonti: [CERNIGOI_STORIA] }],
    marchi: {
      venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [],
      menzionati: [
        { marca: 'Rolex', fonti: [CERNIGOI_STORIA] }, { marca: 'IWC', fonti: [CERNIGOI_STORIA] },
        { marca: 'Zenith', fonti: [CERNIGOI_STORIA] }, { marca: 'Longines', fonti: [CERNIGOI_STORIA] },
        { marca: 'TAG Heuer', fonti: [CERNIGOI_STORIA] },
      ],
    },
    storia: {
      annoFondazione: 1937, fondatore: 'Antonio Cernigoi',
      testo: 'Fondata nel 1937 a Monfalcone da Antonio Cernigoi come evoluzione di un precedente laboratorio orologiaio, l’attività è rimasta a conduzione familiare.',
      eventi: [{ data: '1937', descrizione: 'Fondazione della Gioielleria Cernigoi a Monfalcone.', fonti: [CERNIGOI_STORIA] }],
      fonti: [CERNIGOI_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CERNIGOI_STORIA, CERNIGOI_PRIV],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda storica inserita da sito ufficiale.', fonti: [CERNIGOI_STORIA, CERNIGOI_PRIV] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-cernigoi-monfalcone' },
  },
  {
    id: 'dobner-gorizia', slug: 'dobner-gorizia', nome: 'Dobner — sede di Gorizia',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Sede goriziana di Dobner in Corso Italia 34, aperta nel 2007 raccogliendo l’eredità della storica ditta De Savorgnani; offre vendita di orologeria e assistenza post-vendita tramite laboratorio.',
    nomiPrecedenti: ['De Savorgnani'], gruppoId: null, localitaId: 'gorizia',
    posizione: { indirizzo: 'Corso Italia, 34', cap: '34170', coordinate: null, fonti: [DOBNER_GO] },
    contatti: { telefono: '0481 532270', email: 'dobner.go@dobner.it', sito: 'https://dobner.it/it/negozi/dobner-gorizia/', whatsapp: null, social: [], fonti: [DOBNER_GO] },
    orari: makeOrari([
      [2, '09:00-12:30', '15:30-19:30'], [3, '09:00-12:30', '15:30-19:30'],
      [4, '09:00-12:30', '15:30-19:30'], [5, '09:00-12:30', '15:30-19:30'], [6, '09:00-12:30', '15:30-19:30'],
    ], [DOBNER_GO]),
    servizi: [
      { id: 'vendita', fonti: [DOBNER_GO] }, { id: 'assistenza', fonti: [DOBNER_GO] },
      { id: 'gioielleria', fonti: [DOBNER_GO] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 2007, fondatore: null,
      testo: 'La sede Dobner di Gorizia è attiva dal 2007 nei locali della storica gioielleria De Savorgnani in Corso Italia.',
      eventi: [], fonti: [DOBNER_GO],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [DOBNER_GO],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: sede di Gorizia inserita da pagina ufficiale Dobner.', fonti: [DOBNER_GO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'dobner-gorizia' },
  },
  {
    id: 'nitta-gioielli-pordenone', slug: 'nitta-gioielli-pordenone', nome: 'Nitta Gioielli',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Nitta Gioielli in Corso Vittorio Emanuele II 15/B a Pordenone è rivenditore ufficiale Longines e Hamilton attestato dai rispettivi store locator dei marchi, con servizi di manutenzione e sostituzione del cinturino.',
    nomiPrecedenti: ['Nitta Gioielli Srl'], gruppoId: null, localitaId: 'pordenone',
    posizione: { indirizzo: 'Corso Vittorio Emanuele II, 15/B', cap: '33170', coordinate: null, fonti: [NITTA_CONT, NITTA_LON] },
    contatti: { telefono: '+39 0434 522554', email: 'info@nittagioielli.com', sito: 'https://nittagioielli.com/contatti/', whatsapp: null, social: [], fonti: [NITTA_CONT, NITTA_LON] },
    orari: makeOrari([
      [2, '09:30-12:30', '15:30-19:30'], [3, '09:30-12:30', '15:30-19:30'],
      [4, '09:30-12:30', '15:30-19:30'], [5, '09:30-12:30', '15:30-19:30'], [6, '09:30-12:30', '15:30-19:30'],
    ], [NITTA_LON]),
    servizi: [
      { id: 'vendita', fonti: [NITTA_LON, NITTA_HAM] }, { id: 'manutenzione', fonti: [NITTA_LON] },
      { id: 'cinturini', fonti: [NITTA_LON] }, { id: 'gioielleria', fonti: [NITTA_CONT] },
    ],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Longines', fonti: [NITTA_LON] }, { marca: 'Hamilton', fonti: [NITTA_HAM] }, { marca: 'Montblanc', fonti: [NITTA_CONT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Longines', fonti: [NITTA_LON] }, { marca: 'Hamilton', fonti: [NITTA_HAM] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [NITTA_CONT, NITTA_LON, NITTA_HAM],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale e locator Longines/Hamilton.', fonti: [NITTA_CONT, NITTA_LON, NITTA_HAM] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'nitta-gioielli-pordenone' },
  },
  {
    id: 'gioielleria-zambon-1934-pordenone', slug: 'gioielleria-zambon-1934-pordenone', nome: 'Gioielleria Zambon 1934',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Zambon 1934 in Via Vallona 6 a Pordenone, attiva dal 1934, offre assistenza tecnica su orologi, riparazioni, revisioni, sostituzione del movimento e cambio di batterie e cinturini.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'pordenone',
    posizione: { indirizzo: 'Via Vallona, 6', cap: '33170', coordinate: null, fonti: [ZAMBON_HOME] },
    contatti: { telefono: '+39 0434 521559', email: null, sito: 'https://www.gioielleriazambon.it/', whatsapp: null, social: [], fonti: [ZAMBON_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [ZAMBON_HOME] }, { id: 'revisione', fonti: [ZAMBON_HOME] },
      { id: 'batterie', fonti: [ZAMBON_HOME] }, { id: 'cinturini', fonti: [ZAMBON_HOME] },
      { id: 'ricambi', fonti: [ZAMBON_HOME] }, { id: 'assistenza', fonti: [ZAMBON_HOME] },
      { id: 'vendita', fonti: [ZAMBON_HOME] }, { id: 'gioielleria', fonti: [ZAMBON_HOME] },
    ],
    altriServizi: [{ nome: 'Sostituzione movimento', fonti: [ZAMBON_HOME] }],
    specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1934, fondatore: null,
      testo: 'Il sito ufficiale presenta l’attività come storica gioielleria e orologeria attiva a Pordenone dal 1934.',
      eventi: [{ data: '1934', descrizione: 'Avvio dell’attività a Pordenone.', fonti: [ZAMBON_HOME] }],
      fonti: [ZAMBON_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ZAMBON_HOME],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda storica inserita da sito ufficiale.', fonti: [ZAMBON_HOME] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-zambon-1934-pordenone' },
  },
  {
    id: 'camparini-gioielli-reggio-emilia', slug: 'camparini-gioielli-reggio-emilia', nome: 'Camparini Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Camparini Gioielli in Via Emilia San Pietro 29/C a Reggio nell’Emilia affonda le proprie radici nella riparazione orologiera passando al commercio nel 1910 ed è oggi alla quinta generazione; offre vendita, secondo polso certificato e servizio di manutenzione e revisione.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'reggio-emilia',
    posizione: { indirizzo: 'Via Emilia San Pietro, 29/C', cap: '42121', coordinate: null, fonti: [CAMPARINI_STORIA, CAMPARINI_ROLEX] },
    contatti: { telefono: '0522 434693', email: 'info@camparinigioielli.com', sito: 'https://www.camparinigioielli.com/chi-siamo/', whatsapp: null, social: [], fonti: [CAMPARINI_STORIA] },
    orari: makeOrari([
      [1, '09:00-13:00', '15:30-19:30'], [2, '09:00-13:00', '15:30-19:30'],
      [3, '09:00-13:00', '15:30-19:30'], [5, '09:00-13:00', '15:30-19:30'], [6, '09:00-13:00', '15:30-19:30'],
    ], [CAMPARINI_ROLEX]),
    servizi: [
      { id: 'vendita', fonti: [CAMPARINI_ROLEX] }, { id: 'vendita-usati', fonti: [CAMPARINI_ROLEX] },
      { id: 'revisione', fonti: [CAMPARINI_ROLEX] }, { id: 'manutenzione', fonti: [CAMPARINI_ROLEX] },
      { id: 'assistenza', fonti: [CAMPARINI_STORIA] }, { id: 'gioielleria', fonti: [CAMPARINI_STORIA] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [CAMPARINI_ROLEX] }],
    marchi: {
      venduti: [{ marca: 'Rolex', fonti: [CAMPARINI_ROLEX] }, { marca: 'Tudor', fonti: [CAMPARINI_STORIA] }],
      riparati: [{ marca: 'Rolex', fonti: [CAMPARINI_ROLEX] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1910, fondatore: null,
      testo: 'La storia aziendale documenta la tradizione orologiaia della famiglia Camparini, passata dalla riparazione al commercio nel 1910 e giunta alla quinta generazione a Reggio nell’Emilia.',
      eventi: [{ data: '1910', descrizione: 'Passaggio dalla riparazione al commercio orologiero a Reggio nell’Emilia.', fonti: [CAMPARINI_STORIA] }],
      fonti: [CAMPARINI_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CAMPARINI_STORIA, CAMPARINI_ROLEX],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: bottega storica inserita da sito ufficiale.', fonti: [CAMPARINI_STORIA, CAMPARINI_ROLEX] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'camparini-gioielli-reggio-emilia' },
  },
  {
    id: 'cadoppi-reggio-emilia', slug: 'cadoppi-reggio-emilia', nome: 'Cadoppi',
    tipi: ['orologeria', 'gioielleria'],
    descrizione: 'Cadoppi in Via Emilia San Pietro 23/D a Reggio nell’Emilia è un’orologeria e gioielleria attestata dagli store locator ufficiali Mido e Tissot quale rivenditore autorizzato dei due marchi svizzeri.',
    nomiPrecedenti: ['Cadoppi Snc'], gruppoId: null, localitaId: 'reggio-emilia',
    posizione: { indirizzo: 'Via Emilia San Pietro, 23/D', cap: '42121', coordinate: null, fonti: [CADOPPI_MIDO, CADOPPI_TISSOT] },
    contatti: { telefono: '0522 431678', email: 'reggio@cadoppi.it', sito: 'https://www.cadoppi.it/', whatsapp: null, social: [], fonti: [CADOPPI_MIDO, CADOPPI_HOME] },
    orari: makeOrari([], []),
    servizi: [{ id: 'vendita', fonti: [CADOPPI_MIDO, CADOPPI_TISSOT] }, { id: 'gioielleria', fonti: [CADOPPI_HOME] }],
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [{ marca: 'Mido', fonti: [CADOPPI_MIDO] }, { marca: 'Tissot', fonti: [CADOPPI_TISSOT] }],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [CADOPPI_MIDO] }, { marca: 'Tissot', fonti: [CADOPPI_TISSOT] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [CADOPPI_MIDO, CADOPPI_TISSOT, CADOPPI_HOME],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da locator ufficiali Mido e Tissot.', fonti: [CADOPPI_MIDO, CADOPPI_TISSOT, CADOPPI_HOME] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'cadoppi-reggio-emilia' },
  },
  {
    id: 'sts-laboratorio-orologeria-conegliano', slug: 'sts-laboratorio-orologeria-conegliano', nome: 'S.T.S. Laboratorio di Orologeria',
    tipi: ['laboratorio', 'orologeria', 'professionista'],
    descrizione: 'S.T.S. snc in Viale Friuli 45 a Conegliano è un laboratorio tecnico di orologeria attivo dal 1985, specializzato nella manutenzione, riparazione e restauro conservativo di orologi meccanici moderni e antichi.',
    nomiPrecedenti: ['S.T.S. snc'], gruppoId: null, localitaId: 'conegliano',
    posizione: { indirizzo: 'Viale Friuli, 45', cap: '31015', coordinate: null, fonti: [STS_CONT] },
    contatti: { telefono: '0438 22845', email: null, sito: 'https://stsorologeria.jimdoweb.com/', whatsapp: null, social: [], fonti: [STS_CONT, STS_HOME] },
    orari: makeOrari([
      [1, '08:30-15:30'], [2, '08:30-15:30'], [3, '08:30-15:30'],
      [4, '08:30-15:30'], [5, '08:30-15:30'], [6, '09:00-12:30'],
    ], [STS_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [STS_LAB] }, { id: 'manutenzione', fonti: [STS_LAB] },
      { id: 'riparazione-meccanici', fonti: [STS_LAB] }, { id: 'restauro-vintage', fonti: [STS_LAB] },
      { id: 'assistenza', fonti: [STS_LAB] },
    ],
    altriServizi: [{ nome: 'Restauro conservativo di orologi meccanici moderni e antichi', fonti: [STS_LAB] }],
    specializzazioni: [{ id: 'meccanici', fonti: [STS_LAB] }, { id: 'antichi', fonti: [STS_LAB] }, { id: 'vintage', fonti: [STS_LAB] }],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Omega', fonti: [STS_LAB] }, { marca: 'Longines', fonti: [STS_LAB] },
        { marca: 'Tissot', fonti: [STS_LAB] }, { marca: 'Rado', fonti: [STS_LAB] },
        { marca: 'Certina', fonti: [STS_LAB] }, { marca: 'Hamilton', fonti: [STS_LAB] },
        { marca: 'TAG Heuer', fonti: [STS_LAB] },
      ],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1985, fondatore: null,
      testo: 'Il laboratorio dichiara attività a Conegliano dal 1985 e documenta nel 2017 l’unione con l’attività dell’orologiaio Andrea Modenese.',
      eventi: [
        { data: '1985', descrizione: 'Avvio del laboratorio S.T.S. a Conegliano.', fonti: [STS_HOME] },
        { data: '2017', descrizione: 'Unione con l’attività dell’orologiaio Andrea Modenese.', fonti: [STS_HOME] },
      ],
      fonti: [STS_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [STS_HOME, STS_LAB, STS_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [STS_HOME, STS_LAB, STS_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'sts-laboratorio-orologeria-conegliano' },
  },
  {
    id: 'gioielleria-da-rios-conegliano', slug: 'gioielleria-da-rios-conegliano', nome: 'Gioielleria Da Rios',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Da Rios in Viale Giosuè Carducci 31 a Conegliano, fondata nel 1958, esegue riparazione e revisione di orologi meccanici e al quarzo oltre a sostituzione di batterie e cinturini.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'conegliano',
    posizione: { indirizzo: 'Viale Giosuè Carducci, 31', cap: '31015', coordinate: null, fonti: [DARIOS_HOME] },
    contatti: { telefono: '0438 22696', email: 'info@gioielleriadarios.it', sito: 'https://www.gioielleriadarios.it/', whatsapp: null, social: [], fonti: [DARIOS_HOME] },
    orari: makeOrari([
      [2, '09:00-12:30', '15:30-19:00'], [3, '09:00-12:30', '15:30-19:00'],
      [4, '09:00-12:30', '15:30-19:00'], [5, '09:00-12:30', '15:30-19:00'], [6, '09:00-12:30', '15:30-19:00'],
    ], [DARIOS_HOME]),
    servizi: [
      { id: 'riparazione', fonti: [DARIOS_HOME] }, { id: 'revisione', fonti: [DARIOS_HOME] },
      { id: 'riparazione-meccanici', fonti: [DARIOS_HOME] }, { id: 'riparazione-quarzo', fonti: [DARIOS_HOME] },
      { id: 'batterie', fonti: [DARIOS_HOME] }, { id: 'cinturini', fonti: [DARIOS_HOME] },
      { id: 'vendita', fonti: [DARIOS_HOME] }, { id: 'gioielleria', fonti: [DARIOS_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'meccanici', fonti: [DARIOS_HOME] }],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1958, fondatore: null,
      testo: 'Il sito ufficiale documenta la nascita dell’attività a Conegliano nel 1958.',
      eventi: [{ data: '1958', descrizione: 'Apertura della Gioielleria Da Rios a Conegliano.', fonti: [DARIOS_HOME] }],
      fonti: [DARIOS_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [DARIOS_HOME],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda storica inserita da sito ufficiale.', fonti: [DARIOS_HOME] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-da-rios-conegliano' },
  },
  {
    id: 'giberti-preziosi-ferrara', slug: 'giberti-preziosi-ferrara', nome: 'Giberti Preziosi',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Giberti Preziosi in Piazza Trento e Trieste 13 a Ferrara, attiva dal 1974, dispone di laboratorio per la riparazione di orologi antichi e moderni e tratta orologi di secondo polso.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'ferrara',
    posizione: { indirizzo: 'Piazza Trento e Trieste, 13', cap: '44121', coordinate: null, fonti: [GIBERTI_CONT] },
    contatti: { telefono: '0532 206996', email: 'gibertipreziosi@live.it', sito: 'https://www.gibertipreziosi.it/', whatsapp: null, social: [], fonti: [GIBERTI_CONT, GIBERTI_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [GIBERTI_RIP] }, { id: 'vendita', fonti: [GIBERTI_HOME] },
      { id: 'vendita-usati', fonti: [GIBERTI_HOME] }, { id: 'gioielleria', fonti: [GIBERTI_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'antichi', fonti: [GIBERTI_RIP] }, { id: 'vintage', fonti: [GIBERTI_HOME] }],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1974, fondatore: null,
      testo: 'Il sito ufficiale attesta l’avvio dell’attività a Ferrara nel 1974.',
      eventi: [{ data: '1974', descrizione: 'Fondazione di Giberti Preziosi a Ferrara.', fonti: [GIBERTI_HOME] }],
      fonti: [GIBERTI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [GIBERTI_HOME, GIBERTI_RIP, GIBERTI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [GIBERTI_HOME, GIBERTI_RIP, GIBERTI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'giberti-preziosi-ferrara' },
  },
  {
    id: 'gioielleria-pretolani-forli', slug: 'gioielleria-pretolani-forli', nome: 'Gioielleria Pretolani',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Gioielleria Pretolani in Via Tevere 77 a Forlì, nata nel 1945 e presente in città dal 1967, dispone di un laboratorio orologiero inaugurato nel 2018 dedicato a riparazioni, manutenzione e restauro anche di orologi antichi, con competenze dichiarate su Longines, Tissot, Hamilton e Omega.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'forli',
    posizione: { indirizzo: 'Via Tevere, 77', cap: '47121', coordinate: null, fonti: [PRETOLANI_CONT] },
    contatti: { telefono: '0543 700232', email: 'gioielleriapretolani@alice.it', sito: 'https://www.gioielleriapretolani.it/', whatsapp: null, social: [], fonti: [PRETOLANI_CONT, PRETOLANI_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [PRETOLANI_LAB] }, { id: 'manutenzione', fonti: [PRETOLANI_LAB] },
      { id: 'restauro-vintage', fonti: [PRETOLANI_LAB] }, { id: 'cinturini', fonti: [PRETOLANI_LAB] },
      { id: 'vendita', fonti: [PRETOLANI_HOME] }, { id: 'gioielleria', fonti: [PRETOLANI_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'antichi', fonti: [PRETOLANI_LAB] }, { id: 'meccanici', fonti: [PRETOLANI_LAB] }],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Longines', fonti: [PRETOLANI_LAB] }, { marca: 'Tissot', fonti: [PRETOLANI_LAB] },
        { marca: 'Hamilton', fonti: [PRETOLANI_LAB] }, { marca: 'Omega', fonti: [PRETOLANI_LAB] },
      ],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1945, fondatore: null,
      testo: 'Fondata nel 1945, l’attività apre il primo punto vendita forlivese nel 1967 e inaugura nel 2018 il laboratorio orologiero interno.',
      eventi: [
        { data: '1945', descrizione: 'Fondazione dell’attività.', fonti: [PRETOLANI_HOME] },
        { data: '1967', descrizione: 'Apertura del punto vendita a Forlì.', fonti: [PRETOLANI_HOME] },
        { data: '2018', descrizione: 'Inaugurazione del laboratorio orologiero interno.', fonti: [PRETOLANI_LAB] },
      ],
      fonti: [PRETOLANI_HOME, PRETOLANI_LAB],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [PRETOLANI_HOME, PRETOLANI_LAB, PRETOLANI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [PRETOLANI_HOME, PRETOLANI_LAB, PRETOLANI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'gioielleria-pretolani-forli' },
  },
  {
    id: 'orologeria-reggiani-modena', slug: 'orologeria-reggiani-modena', nome: 'Orologeria Reggiani',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Orologeria Reggiani in Via Bartolomeo De’ Polli 1/A a Modena, attiva dal 1962, dispone di laboratorio interno per la riparazione di orologi da polso, da tavolo, sveglie e pendoli, oltre alla sostituzione di pile e cinturini.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'modena',
    posizione: { indirizzo: 'Via Bartolomeo De’ Polli, 1/A', cap: '41125', coordinate: null, fonti: [REGGIANI_CONT] },
    contatti: { telefono: '059 305184', email: 'gymmireggiani@gmail.com', sito: 'https://www.orologeriareggiani.it/', whatsapp: null, social: [], fonti: [REGGIANI_CONT, REGGIANI_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [REGGIANI_STORIA] }, { id: 'pendoleria', fonti: [REGGIANI_STORIA] },
      { id: 'batterie', fonti: [REGGIANI_STORIA] }, { id: 'cinturini', fonti: [REGGIANI_STORIA] },
      { id: 'vendita', fonti: [REGGIANI_HOME] },
    ],
    altriServizi: [{ nome: 'Riparazione sveglie e orologi da tavolo', fonti: [REGGIANI_STORIA] }],
    specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: {
      annoFondazione: 1962, fondatore: null,
      testo: 'Il sito aziendale documenta la nascita dell’Orologeria Reggiani a Modena nel 1962.',
      eventi: [{ data: '1962', descrizione: 'Apertura dell’Orologeria Reggiani a Modena.', fonti: [REGGIANI_STORIA] }],
      fonti: [REGGIANI_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [REGGIANI_HOME, REGGIANI_STORIA, REGGIANI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio storico inserito da sito ufficiale.', fonti: [REGGIANI_HOME, REGGIANI_STORIA, REGGIANI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'orologeria-reggiani-modena' },
  },
  {
    id: 'henry-gioielli-alessandria', slug: 'henry-gioielli-alessandria', nome: 'Henry Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Henry Gioielli in Via Dante 114 ad Alessandria unisce un laboratorio per riparazione e manutenzione di orologi meccanici, analogici e digitali alla rivendita ufficiale Mido attestata dallo store locator del marchio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'alessandria',
    posizione: { indirizzo: 'Via Dante, 114', cap: '15121', coordinate: null, fonti: [HENRY_MIDO, HENRY_HOME] },
    contatti: { telefono: '0131 40642', email: 'henry_gioielli@libero.it', sito: 'https://gioielleriahenry.com/', whatsapp: null, social: [], fonti: [HENRY_MIDO, HENRY_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [HENRY_LAB] }, { id: 'manutenzione', fonti: [HENRY_LAB] },
      { id: 'riparazione-meccanici', fonti: [HENRY_LAB] }, { id: 'riparazione-quarzo', fonti: [HENRY_LAB] },
      { id: 'vendita', fonti: [HENRY_MIDO] }, { id: 'gioielleria', fonti: [HENRY_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'meccanici', fonti: [HENRY_LAB] }],
    marchi: {
      venduti: [
        { marca: 'Mido', fonti: [HENRY_MIDO] }, { marca: 'Tissot', fonti: [HENRY_LAB] },
        { marca: 'Locman', fonti: [HENRY_LAB] }, { marca: 'Citizen', fonti: [HENRY_LAB] },
      ],
      riparati: [], esperienza: [], assistenzaUfficiale: [],
      rivenditaUfficiale: [{ marca: 'Mido', fonti: [HENRY_MIDO] }],
      menzionati: [],
    },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [HENRY_HOME, HENRY_LAB, HENRY_MIDO],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale e locator Mido.', fonti: [HENRY_HOME, HENRY_LAB, HENRY_MIDO] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'henry-gioielli-alessandria' },
  },
  {
    id: 'luigi-rosso-casale-monferrato', slug: 'luigi-rosso-casale-monferrato', nome: 'Luigi Rosso Orologi e Gioielli',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Luigi Rosso Orologi e Gioielli in Via Aurelio Saffi 3 a Casale Monferrato, attivo in proprio dal 1992 dopo le prime esperienze nel settore dal 1986, si avvale di tecnici orologiai per riparazione, restauro e rimessa a nuovo multimarca di orologi moderni e d’epoca.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'casale-monferrato',
    posizione: { indirizzo: 'Via Aurelio Saffi, 3', cap: '15033', coordinate: null, fonti: [ROSSO_CONT] },
    contatti: { telefono: '0142 455969', email: 'info@luigirossogioielli.com', sito: 'https://www.luigirossogioielli.com/it/assistenza', whatsapp: null, social: [], fonti: [ROSSO_CONT, ROSSO_HOME] },
    orari: makeOrari([
      [2, '09:00-12:30', '15:00-19:00'], [3, '09:00-12:30', '15:00-19:00'],
      [4, '09:00-12:30', '15:00-19:00'], [5, '09:00-12:30', '15:00-19:00'], [6, '09:00-12:30', '15:00-19:00'],
    ], [ROSSO_CONT]),
    servizi: [
      { id: 'riparazione', fonti: [ROSSO_HOME] }, { id: 'restauro-vintage', fonti: [ROSSO_HOME] },
      { id: 'manutenzione', fonti: [ROSSO_HOME] }, { id: 'assistenza', fonti: [ROSSO_HOME] },
      { id: 'vendita', fonti: [ROSSO_STORIA] }, { id: 'gioielleria', fonti: [ROSSO_STORIA] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [ROSSO_STORIA] }, { id: 'vintage', fonti: [ROSSO_HOME] }],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Rolex', fonti: [ROSSO_HOME] }, { marca: 'Audemars Piguet', fonti: [ROSSO_HOME] },
        { marca: 'TAG Heuer', fonti: [ROSSO_HOME] },
      ],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1992, fondatore: 'Luigi Rosso',
      testo: 'Dopo l’ingresso nel settore degli orologi di lusso nel 1986, Luigi Rosso avvia l’attività indipendente a Casale Monferrato nel 1992.',
      eventi: [{ data: '1992', descrizione: 'Avvio dell’attività indipendente di Luigi Rosso a Casale Monferrato.', fonti: [ROSSO_STORIA] }],
      fonti: [ROSSO_STORIA],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ROSSO_HOME, ROSSO_STORIA, ROSSO_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: scheda inserita da sito ufficiale.', fonti: [ROSSO_HOME, ROSSO_STORIA, ROSSO_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'luigi-rosso-casale-monferrato' },
  },
  {
    id: 'biondi-vercelli', slug: 'biondi-vercelli', nome: 'Biondi Gioielleria e Orologeria',
    tipi: ['orologeria', 'gioielleria', 'laboratorio'],
    descrizione: 'Biondi in Corso Libertà 41-42 a Vercelli, fondata nel 1949 da Agostino Biondi, dispone di laboratorio interno dedicato a revisione, riparazione e restauro di orologi e tratta maison svizzere quali Rolex, Longines, Tudor, Montblanc e Rado.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'vercelli',
    posizione: { indirizzo: 'Corso Libertà, 41-42', cap: '13100', coordinate: null, fonti: [BIONDI_CONT] },
    contatti: { telefono: '+39 0161 256353', email: 'info@biondivercelli.com', sito: 'https://www.biondivercelli.com/', whatsapp: null, social: [], fonti: [BIONDI_CONT, BIONDI_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [BIONDI_HOME] }, { id: 'revisione', fonti: [BIONDI_HOME] },
      { id: 'restauro-vintage', fonti: [BIONDI_HOME] }, { id: 'manutenzione', fonti: [BIONDI_HOME] },
      { id: 'vendita', fonti: [BIONDI_HOME] }, { id: 'gioielleria', fonti: [BIONDI_HOME] },
    ],
    altriServizi: [], specializzazioni: [{ id: 'lusso', fonti: [BIONDI_HOME] }],
    marchi: {
      venduti: [
        { marca: 'Rolex', fonti: [BIONDI_HOME] }, { marca: 'Longines', fonti: [BIONDI_HOME] },
        { marca: 'Tudor', fonti: [BIONDI_HOME] }, { marca: 'Montblanc', fonti: [BIONDI_HOME] },
        { marca: 'Rado', fonti: [BIONDI_HOME] },
      ],
      riparati: [{ marca: 'Rolex', fonti: [BIONDI_HOME] }],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: 1949, fondatore: 'Agostino Biondi',
      testo: 'Fondata a Vercelli nel 1949 da Agostino Biondi, l’attività affianca alla gioielleria il laboratorio di revisione e restauro orologiero.',
      eventi: [{ data: '1949', descrizione: 'Fondazione di Biondi a Vercelli da parte di Agostino Biondi.', fonti: [BIONDI_HOME] }],
      fonti: [BIONDI_HOME],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [BIONDI_HOME, BIONDI_CONT],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: bottega storica inserita da sito ufficiale.', fonti: [BIONDI_HOME, BIONDI_CONT] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'biondi-vercelli' },
  },
  {
    id: 'orologeria-era-ora-vercelli', slug: 'orologeria-era-ora-vercelli', nome: 'Orologeria Era Ora',
    tipi: ['orologeria', 'laboratorio', 'professionista'],
    descrizione: 'Orologeria Era Ora in Via Fratelli Laviny 17 a Vercelli è un laboratorio di terza generazione specializzato in riparazioni, revisioni, restauri, lucidatura di casse e bracciali e interventi su orologi moderni, vintage, da parete e da appoggio.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'vercelli',
    posizione: { indirizzo: 'Via Fratelli Laviny, 17', cap: '13100', coordinate: null, fonti: [ERAORA_HOME] },
    contatti: { telefono: '+39 328 9586434', email: 'info@orologeriaeraora.it', sito: 'https://www.orologeriaeraora.it/', whatsapp: null, social: [], fonti: [ERAORA_HOME] },
    orari: makeOrari([], []),
    servizi: [
      { id: 'riparazione', fonti: [ERAORA_LAB] }, { id: 'revisione', fonti: [ERAORA_LAB] },
      { id: 'restauro-vintage', fonti: [ERAORA_LAB] }, { id: 'lucidatura', fonti: [ERAORA_LAB] },
      { id: 'pendoleria', fonti: [ERAORA_LAB] },
    ],
    altriServizi: [{ nome: 'Interventi su orologi da parete e da appoggio', fonti: [ERAORA_LAB] }],
    specializzazioni: [{ id: 'meccanici', fonti: [ERAORA_LAB] }, { id: 'vintage', fonti: [ERAORA_LAB] }],
    marchi: {
      venduti: [],
      riparati: [
        { marca: 'Rolex', fonti: [ERAORA_LAB] }, { marca: 'Omega', fonti: [ERAORA_LAB] },
        { marca: 'Tudor', fonti: [ERAORA_LAB] }, { marca: 'Patek Philippe', fonti: [ERAORA_LAB] },
        { marca: 'Panerai', fonti: [ERAORA_LAB] }, { marca: 'Zenith', fonti: [ERAORA_LAB] },
        { marca: 'Eberhard & Co.', fonti: [ERAORA_LAB] },
      ],
      esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [],
    },
    storia: {
      annoFondazione: null, fondatore: null,
      testo: 'Il laboratorio a Vercelli è condotto da Matteo e Paolo, indicati sul sito ufficiale come terza generazione di orologiai.',
      eventi: [], fonti: [ERAORA_HOME, ERAORA_LAB],
    },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [ERAORA_HOME, ERAORA_LAB],
      cronologia: [{ data: DATA, azione: 'Lotto 5 espansione nazionale: laboratorio inserito da sito ufficiale.', fonti: [ERAORA_HOME, ERAORA_LAB] }],
      segnalazioni: [],
    },
    origine: { sistema: 'espansione-lotto5-20261026', idOriginale: 'orologeria-era-ora-vercelli' },
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
writeFileSync('data/reports/lotto-05-20261026-applied.json', `${JSON.stringify({
  lotto: 'lotto-05-20261026',
  data: DATA,
  regioniCoinvolte: ['Piemonte', 'Liguria', 'Trentino-Alto Adige', 'Friuli-Venezia Giulia', 'Veneto', 'Emilia-Romagna'],
  provinceCoinvolte: ['CN', 'SV', 'SP', 'PC', 'BZ', 'GO', 'PN', 'RE', 'TV', 'FE', 'FC', 'MO', 'AL', 'VC'],
  provincePrimaAZeroCoperte: ['CN', 'SV', 'SP', 'PC', 'BZ', 'GO', 'PN', 'RE'],
  candidatiEsaminati: 34,
  candidatiScartati: 8,
  motiviScarto: [
    'Follie d’Oro Piacenza: assenza di CAP, email e orari sulla pagina ufficiale consultata',
    'Oreficeria Ferrari Reggio Emilia: testo della pagina ufficiale estratto solo parzialmente',
    'Orologeria Fronza Trento, Rolli Poniz Trieste, CieSSe Padova, Laboratorio Curato Brescia, Orologeria Cotifava Mantova, Orologeria Casadei Rimini: già presenti in catalogo (duplicati evitati)',
  ],
  nuoveLocalita: nuoveLocalita.map(l => ({ id: l.id, comune: l.comune, siglaProvincia: l.siglaProvincia, regione: l.regione })),
  nuoveSchede: nuoveSchede.map(b => ({ id: b.id, nome: b.nome, localitaId: b.localitaId, tipi: b.tipi, annoFondazione: b.storia.annoFondazione })),
  fontiAggiunte: nuoveFonti.map(f => ({ id: f.id, tipo: f.tipo, url: f.url })),
  totaleAttivitaPrima: validato.attivita.length - nuoveSchede.length,
  totaleAttivitaDopo: validato.attivita.length,
  totaleComuniPrima: validato.localita.length - nuoveLocalita.length,
  totaleComuniDopo: validato.localita.length,
}, null, 2)}\n`);

console.log(`Lotto 5 applicato: +${nuoveSchede.length} attività (totale ${validato.attivita.length}), +${nuoveLocalita.length} comuni (totale ${validato.localita.length}), +${nuoveFonti.length} fonti.`);
