// Espansione Lotto 3 — 12 nuove schede verificate, 28 ottobre 2026.
// Regole: claim solo da fonti consultate; rivendite ufficiali solo da locator primari verificati
// (Hamilton, Mido, Tissot, Breil); autodichiarazioni in segnalazioni; dati incerti assenti.
// Esclusi dal lotto: Follie d'Oro Avezzano (servizi non attribuibili alla sede), Gold Center
// Ariano Irpino (solo vendita senza documentazione di marca), Dorotea Augusta (pagine illeggibili).
// Uso: node scripts/espansione-lotto3-20261028.mjs
import fs from 'node:fs';

const file = new URL('../site/data/directory.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const oggi = '2026-10-28';

const nuovaFonte = (id, url, titolo, tipo) => {
  const e = d.fonti.find((f) => f.id === id || f.url === url);
  if (e) return e.id;
  d.fonti.push({ id, tipo, url, titolo, consultataIl: oggi, percorsoArchivio: null, licenza: null });
  return id;
};
const get = (id) => {
  const b = d.attivita.find((x) => x.id === id);
  if (!b) throw new Error(`scheda mancante: ${id}`);
  return b;
};
const creaLocalita = (spec) => {
  if (!d.localita.some((l) => l.id === spec.id)) d.localita.push({ codiceIstat: null, ...spec });
  return spec.id;
};
const marchiDefault = () => ({ venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] });
const serv = (ids, fonti) => ids.map((id) => ({ id, fonti: [...fonti] }));
const brand = (nomi, fonti) => nomi.map((marca) => ({ marca, fonti: [...fonti] }));
const segn = (motivo) => ({ data: oggi, motivo, stato: 'aperta' });

const crea = (spec) => {
  if (d.attivita.some((x) => x.id === spec.id)) throw new Error(`duplicato: ${spec.id}`);
  const fonti = [...new Set(spec.fonti)];
  const b = {
    nomiPrecedenti: [], gruppoId: null,
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    altriServizi: [], specializzazioni: [], ...spec,
    posizione: { indirizzo: null, cap: null, coordinate: null, fonti: [], ...(spec.posizione ?? {}) },
    contatti: { telefono: null, email: null, sito: null, whatsapp: null, social: [], fonti: [], ...(spec.contatti ?? {}) },
    servizi: spec.servizi ?? [],
    marchi: { ...marchiDefault(), ...(spec.marchi ?? {}) },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [], ...(spec.storia ?? {}) },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: oggi, verificataIl: oggi, confermataTitolareIl: null, fonti,
      cronologia: [{ data: oggi, azione: spec.nota, fonti }],
      segnalazioni: spec.segnalazioni ?? [],
    },
    origine: { sistema: 'espansione-lotto3-20261028', idOriginale: spec.id },
  };
  delete b.nota; delete b.fonti; delete b.segnalazioni;
  d.attivita.push(b);
  return b;
};

// ---------- FONTI ----------
const F = {};
F.paoSito = nuovaFonte('e13-www-gioielleriapaolini-com-chi-siamo', 'https://www.gioielleriapaolini.com/chi-siamo-.html', 'Sito Gioielleria Paolini — chi siamo', 'sito-ufficiale');
F.paoCon = nuovaFonte('e13-www-gioielleriapaolini-com-contatti', 'https://www.gioielleriapaolini.com/contatti.html', 'Sito Gioielleria Paolini — contatti', 'sito-ufficiale');

F.magCon = nuovaFonte('e13-magliozziorologi-it-contattaci', 'https://magliozziorologi.it/contattaci/', 'Sito Magliozzi Orologi — contatti', 'sito-ufficiale');
F.magAss = nuovaFonte('e13-magliozziorologi-it-assistenza', 'https://magliozziorologi.it/assistenza/', 'Sito Magliozzi Orologi — assistenza', 'sito-ufficiale');
F.magRlx = nuovaFonte('e13-magliozziorologi-it-rolex-submariner', 'https://magliozziorologi.it/rolex-submariner-126610ln/', 'Sito Magliozzi Orologi — scheda Rolex Submariner', 'sito-ufficiale');
F.magCar = nuovaFonte('e13-magliozziorologi-it-cartier-santos', 'https://magliozziorologi.it/cartier-santos-dumont-wssa0044/', 'Sito Magliozzi Orologi — scheda Cartier Santos Dumont', 'sito-ufficiale');

F.dslSito = nuovaFonte('e13-dslaborologeria-com', 'https://dslaborologeria.com/', 'Sito DsLab Orologeria — Narni Scalo', 'sito-ufficiale');
F.dslInfo = nuovaFonte('e13-dslaborologeria-com-info', 'https://dslaborologeria.com/pages/info', 'Sito DsLab Orologeria — contatti', 'sito-ufficiale');

F.merSito = nuovaFonte('e13-www-centroclinicodellorologio-com', 'https://www.centroclinicodellorologio.com/', 'Sito Centro Clinico dell’Orologio La Meridiana', 'sito-ufficiale');
F.merPag = nuovaFonte('e13-www-paginesi-it-narni-meridiana', 'https://www.paginesi.it/scheda/narni-centro-clinico-dellorologio-la-meridiana/2177986/', 'PagineSI — scheda Centro Clinico dell’Orologio La Meridiana, Narni', 'directory');

F.fosIg = nuovaFonte('e13-www-instagram-com-gioielleria-foschini', 'https://www.instagram.com/gioielleria_foschini_telese_/', 'Instagram ufficiale Gioielleria Foschini — Telese Terme', 'sito-ufficiale');
F.fosPost = nuovaFonte('e13-www-instagram-com-foschini-pila-cinturini', 'https://www.instagram.com/reel/DegOoFioiJH/', 'Instagram Gioielleria Foschini — post cambio pila e cinturini', 'sito-ufficiale');

F.freHam = nuovaFonte('e13-www-hamiltonwatch-com-gallipoli-freddo', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/gallipoli/luigi-freddo-gioielli', 'Hamilton — scheda Luigi Freddo Gioielli, Gallipoli', 'marchio-ufficiale');
F.freIg = nuovaFonte('e13-www-instagram-com-francofreddogioielli', 'https://www.instagram.com/francofreddogioielli/', 'Instagram ufficiale Luigi Freddo Gioielli', 'sito-ufficiale');

F.delHam = nuovaFonte('e13-www-hamiltonwatch-com-martina-franca-del-genio', 'https://www.hamiltonwatch.com/it-it/store-locator/italy/puglia/martina-franca/gioielleria-del-genio-1810766', 'Hamilton — scheda Gioielleria Del Genio, Martina Franca', 'marchio-ufficiale');
F.delMido = nuovaFonte('e13-www-midowatches-com-del-genio', 'https://www.midowatches.com/it/store-locator/italy/taranto/gioielleria-del-genio-a1vnn000003u31yyaq', 'Mido — scheda Gioielleria Del Genio, Martina Franca', 'marchio-ufficiale');

F.masHam = nuovaFonte('e13-www-hamiltonwatch-com-foggia-massimo', 'https://www.hamiltonwatch.com/it-it/store-locator/italy/puglia/foggia/massimo-gioielli', 'Hamilton — scheda Massimo Gioielli, Foggia', 'marchio-ufficiale');
F.masSito = nuovaFonte('e13-www-massimogioielli-it-gioielleria', 'https://www.massimogioielli.it/gioielleria/', 'Sito Massimo Gioielli — la nostra gioielleria', 'sito-ufficiale');
F.masFc = nuovaFonte('e13-frederiqueconstant-com-massimo-foggia', 'https://frederiqueconstant.com/locations/massimo-gioielliitalyfoggiavia-m-angiolillo271100it/', 'Frederique Constant — scheda Massimo Gioielli, Foggia', 'marchio-ufficiale');

F.oncSito = nuovaFonte('e13-onciadoro-com', 'https://onciadoro.com/', 'Sito L’Oncia d’Oro — Siniscola', 'sito-ufficiale');
F.oncSrv = nuovaFonte('e13-onciadoro-com-servizi', 'https://onciadoro.com/servizi/', 'Sito L’Oncia d’Oro — servizi', 'sito-ufficiale');
F.oncOro = nuovaFonte('e13-onciadoro-com-orologi', 'https://onciadoro.com/orologi/', 'Sito L’Oncia d’Oro — orologi', 'sito-ufficiale');

F.stoSito = nuovaFonte('e13-gioielleriastoppa-it-negozi', 'https://gioielleriastoppa.it/gioiellerie-grosseto/', 'Sito Gioielleria Stoppa — sedi e contatti', 'sito-ufficiale');
F.stoLab = nuovaFonte('e13-gioielleriastoppa-it-laboratorio', 'https://gioielleriastoppa.it/laboratorio-orafo/', 'Sito Gioielleria Stoppa — laboratorio', 'sito-ufficiale');
F.stoSto = nuovaFonte('e13-gioielleriastoppa-it-storia', 'https://gioielleriastoppa.it/la-gioielleria/', 'Sito Gioielleria Stoppa — la gioielleria', 'sito-ufficiale');
F.stoTis = nuovaFonte('e13-www-tissotwatches-com-stoppa', 'https://www.tissotwatches.com/it-it/store/gioielleria-stoppa-di-stoppa-m-and-c-snc/a1vNN0000020bkrYAA', 'Tissot — scheda Gioielleria Stoppa, Grosseto', 'marchio-ufficiale');
F.stoBre = nuovaFonte('e13-www-breil-com-stoppa', 'https://www.breil.com/store/rivenditori-reloaded-icons/gioielleria-stoppa/', 'Breil — scheda Gioielleria Stoppa, Grosseto', 'marchio-ufficiale');

F.danHam = nuovaFonte('e13-www-hamiltonwatch-com-quartu-danese', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/sardegna/quartu-sant-elena/gioielleria-marco-danese', 'Hamilton — scheda Gioielleria Marco Danese, Quartu Sant’Elena', 'marchio-ufficiale');
F.danSito = nuovaFonte('e13-www-gioielleriamarcodanese-com-contatti', 'https://www.gioielleriamarcodanese.com/contatti/', 'Sito Gioielleria Marco Danese — contatti', 'sito-ufficiale');
F.danProd = nuovaFonte('e13-www-gioielleriamarcodanese-com-prodotti', 'https://www.gioielleriamarcodanese.com/prodotti/', 'Sito Gioielleria Marco Danese — prodotti', 'sito-ufficiale');

F.perSito = nuovaFonte('e13-www-gioielleriaperdichizzi-it-negozi', 'https://www.gioielleriaperdichizzi.it/pages/negozi', 'Sito Gioielleria Perdichizzi 1907 — negozi', 'sito-ufficiale');
F.perHam = nuovaFonte('e13-www-hamiltonwatch-com-barcellona-perdichizzi', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/sicilia/barcellona-pozzo-di-gotto/gioielleria-perdichizzi-1907', 'Hamilton — scheda Gioielleria Perdichizzi 1907, Barcellona P.G.', 'marchio-ufficiale');

// ---------- LOCALITÀ ----------
creaLocalita({ id: 'atri', comune: 'Atri', comuneSlug: 'atri', provincia: 'Teramo', provinciaSlug: 'teramo', siglaProvincia: 'TE', regione: 'Abruzzo', regioneSlug: 'abruzzo', descrizione: 'Atri: gioielleria con laboratorio di orologeria censita con fonti ufficiali (Gioielleria Paolini).', fonti: [F.paoSito] });
creaLocalita({ id: 'fondi', comune: 'Fondi', comuneSlug: 'fondi', provincia: 'Latina', provinciaSlug: 'latina', siglaProvincia: 'LT', regione: 'Lazio', regioneSlug: 'lazio', descrizione: 'Fondi: orologeria con servizio di assistenza documentato (Magliozzi Orologi e Gioielleria).', fonti: [F.magCon] });
creaLocalita({ id: 'narni', comune: 'Narni', comuneSlug: 'narni', provincia: 'Terni', provinciaSlug: 'terni', siglaProvincia: 'TR', regione: 'Umbria', regioneSlug: 'umbria', descrizione: 'Narni (Scalo): laboratori di riparazione e restauro orologi censiti con fonti ufficiali (DsLab Orologeria, Centro Clinico dell’Orologio La Meridiana).', fonti: [F.dslSito, F.merSito] });
creaLocalita({ id: 'telese-terme', comune: 'Telese Terme', comuneSlug: 'telese-terme', provincia: 'Benevento', provinciaSlug: 'benevento', siglaProvincia: 'BN', regione: 'Campania', regioneSlug: 'campania', descrizione: 'Telese Terme: gioielleria con laboratorio di riparazione orologi censita con fonti ufficiali (Gioielleria Foschini).', fonti: [F.fosIg] });
creaLocalita({ id: 'gallipoli', comune: 'Gallipoli', comuneSlug: 'gallipoli', provincia: 'Lecce', provinciaSlug: 'lecce', siglaProvincia: 'LE', regione: 'Puglia', regioneSlug: 'puglia', descrizione: 'Gallipoli: gioielleria con orologeria e rivendita ufficiale Hamilton censita con fonti ufficiali dei marchi (Luigi Freddo Gioielli).', fonti: [F.freHam] });
creaLocalita({ id: 'martina-franca', comune: 'Martina Franca', comuneSlug: 'martina-franca', provincia: 'Taranto', provinciaSlug: 'taranto', siglaProvincia: 'TA', regione: 'Puglia', regioneSlug: 'puglia', descrizione: 'Martina Franca: gioielleria con rivendite ufficiali Hamilton e Mido censita con fonti ufficiali dei marchi (Gioielleria Del Genio).', fonti: [F.delHam] });
creaLocalita({ id: 'siniscola', comune: 'Siniscola', comuneSlug: 'siniscola', provincia: 'Nuoro', provinciaSlug: 'nuoro', siglaProvincia: 'NU', regione: 'Sardegna', regioneSlug: 'sardegna', descrizione: 'Siniscola: gioielleria con laboratorio di riparazione e manutenzione orologi censita con fonti ufficiali (L’Oncia d’Oro).', fonti: [F.oncSrv] });
creaLocalita({ id: 'quartu-sant-elena', comune: 'Quartu Sant’Elena', comuneSlug: 'quartu-sant-elena', provincia: 'Cagliari', provinciaSlug: 'cagliari', siglaProvincia: 'CA', regione: 'Sardegna', regioneSlug: 'sardegna', descrizione: 'Quartu Sant’Elena: gioielleria con rivendita ufficiale Hamilton censita con fonti ufficiali dei marchi (Gioielleria Marco Danese).', fonti: [F.danHam] });
creaLocalita({ id: 'barcellona-pozzo-di-gotto', comune: 'Barcellona Pozzo di Gotto', comuneSlug: 'barcellona-pozzo-di-gotto', provincia: 'Messina', provinciaSlug: 'messina', siglaProvincia: 'ME', regione: 'Sicilia', regioneSlug: 'sicilia', descrizione: 'Barcellona Pozzo di Gotto: gioielleria storica con rivendita ufficiale Hamilton censita con fonti ufficiali dei marchi (Perdichizzi 1907).', fonti: [F.perHam] });

// ---------- NUOVE SCHEDE ----------
crea({
  id: 'gioielleria-paolini-atri', slug: 'gioielleria-paolini-atri', nome: 'Gioielleria Paolini',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'atri',
  descrizione: 'Gioielleria Paolini in Corso Elio Adriano 73 ad Atri offre assistenza tecnica di orologeria e oreficeria con laboratorio interno; la storia dell’attività risale ai primi del Novecento, con trasferimento ad Atri intorno al 1935 e nell’attuale sede nei primi anni Sessanta.',
  posizione: { indirizzo: 'Corso Elio Adriano, 73', cap: '64032', fonti: [F.paoCon] },
  contatti: { telefono: '085 87604', email: 'info@gioielleriapaolini.com', sito: 'https://www.gioielleriapaolini.com/', fonti: [F.paoCon] },
  servizi: serv(['assistenza', 'gioielleria'], [F.paoSito]),
  storia: {
    testo: 'La pagina aziendale fa risalire la nascita dell’attività ai primi del Novecento: trasferimento ad Atri intorno al 1935, sede attuale dai primi anni Sessanta.',
    eventi: [
      { data: '1935', descrizione: 'Trasferimento dell’attività ad Atri.', fonti: [F.paoSito] },
      { data: 'primi anni Sessanta', descrizione: 'Trasferimento nell’attuale sede di Corso Elio Adriano.', fonti: [F.paoSito] },
    ],
    fonti: [F.paoSito],
  },
  fonti: [F.paoSito, F.paoCon],
  segnalazioni: [
    segn('Storia «primi del Novecento» autodichiarata dal sito, senza anno di fondazione preciso: nessun anno attribuito.'),
    segn('Il sito non specifica i singoli interventi di laboratorio (batterie, revisioni): nessun servizio aggiuntivo attribuito.'),
  ],
  nota: 'Espansione lotto 3: identità, sede, recapiti e laboratorio interno dal sito ufficiale; cronologia dichiarata registrata senza deduzioni.',
});

crea({
  id: 'magliozzi-orologi-fondi', slug: 'magliozzi-orologi-fondi', nome: 'Magliozzi Orologi e Gioielleria',
  tipi: ['orologeria', 'gioielleria'], localitaId: 'fondi',
  descrizione: 'Magliozzi Orologi e Gioielleria in Via Pietrangelo Leone 30 a Fondi offre un servizio di assistenza per orologi di alta gamma con controllo e preventivo in negozio e interventi affidati a centri specializzati: riparazione, revisione, lucidatura e restauro; il catalogo include orologi nuovi e di secondo polso.',
  posizione: { indirizzo: 'Via Pietrangelo Leone, 30', cap: '04022', fonti: [F.magCon] },
  contatti: { telefono: '0771 513031', email: 'info@magliozziorologi.it', sito: 'https://magliozziorologi.it/', fonti: [F.magCon] },
  servizi: serv(['riparazione', 'revisione', 'lucidatura', 'vendita', 'vendita-usati'], [F.magAss]),
  marchi: { venduti: brand(['Rolex', 'Cartier'], [F.magRlx, F.magCar]) },
  fonti: [F.magCon, F.magAss, F.magRlx, F.magCar],
  segnalazioni: [
    segn('Gli interventi di riparazione sono coordinati dal negozio ma affidati a centri specializzati esterni: nessun laboratorio interno attribuito.'),
    segn('Nessuna autorizzazione di marca: le schede prodotto con garanzia non dimostrano status di rivenditore o centro assistenza.'),
  ],
  nota: 'Espansione lotto 3: sede e recapiti dalla pagina contatti; servizi di assistenza (con centri esterni) dalla pagina assistenza; Rolex e Cartier dalle schede prodotto del sito.',
});

crea({
  id: 'dslab-orologeria-narni', slug: 'dslab-orologeria-narni', nome: 'DsLab Orologeria',
  tipi: ['laboratorio', 'orologeria'], localitaId: 'narni',
  descrizione: 'DsLab Orologeria di Santicchia Dario in Via della Libertà 9 a Narni Scalo è laboratorio specializzato nella riparazione e nel restauro di orologi vintage e moderni; il sito propone anche una selezione di orologi.',
  posizione: { indirizzo: 'Via della Libertà, 9', cap: '05035', fonti: [F.dslInfo] },
  contatti: { telefono: '338 4526228', email: 'info.dslaborologeria@gmail.com', sito: 'https://dslaborologeria.com/', fonti: [F.dslInfo] },
  servizi: serv(['riparazione', 'restauro-vintage', 'vendita'], [F.dslSito]),
  specializzazioni: [{ id: 'vintage', fonti: [F.dslSito] }],
  marchi: { menzionati: brand(['Seiko', 'Certina', 'Longines', 'Zenith'], [F.dslSito]) },
  fonti: [F.dslSito, F.dslInfo],
  segnalazioni: [segn('I marchi compaiono nel catalogo del sito come singoli pezzi esposti: nessuna rivendita ufficiale né marchi riparati attribuiti.')],
  nota: 'Espansione lotto 3: identità, sede e recapiti dalla pagina contatti; riparazione/restauro vintage e moderni dal sito ufficiale.',
});

crea({
  id: 'centro-clinico-orologio-narni', slug: 'centro-clinico-orologio-narni', nome: 'Centro Clinico dell’Orologio La Meridiana',
  nomiPrecedenti: ['La Meridiana di Tarchi Paolo'],
  tipi: ['laboratorio', 'orologeria'], localitaId: 'narni',
  descrizione: 'Il Centro Clinico dell’Orologio La Meridiana in Via Tuderte 321 a Narni Scalo ripara orologi automatici, al quarzo e a carica manuale con ricambi originali, test di impermeabilità e vendita; il sito dichiara una tradizione orologiera dal 1950 e tre generazioni di orologiai.',
  posizione: { indirizzo: 'Via Tuderte, 321', cap: '05035', fonti: [F.merPag] },
  contatti: { telefono: '0744 733214', sito: 'https://www.centroclinicodellorologio.com/', fonti: [F.merPag, F.merSito] },
  servizi: serv(['riparazione', 'riparazione-meccanici', 'riparazione-quarzo', 'manutenzione', 'vendita'], [F.merSito]),
  altriServizi: [{ nome: 'Ricambi originali', fonti: [F.merSito] }, { nome: 'Test di impermeabilità', fonti: [F.merSito] }],
  storia: {
    testo: 'Il sito dichiara una tradizione orologiera dal 1950 e tre generazioni di orologiai.',
    eventi: [{ data: '1950', descrizione: 'Inizio della tradizione orologiera dichiarata dal sito.', fonti: [F.merSito] }],
    fonti: [F.merSito],
  },
  fonti: [F.merSito, F.merPag],
  segnalazioni: [
    segn('Tradizione «dal 1950» e tre generazioni autodichiarate; nessun anno di fondazione verificato indipendentemente.'),
    segn('Telefono cellulare 339 2698412 e indirizzo da scheda directory (PagineSI); email non pubblicata nelle pagine ufficiali lette.'),
  ],
  nota: 'Espansione lotto 3: identità e servizi tecnici dal sito ufficiale; indirizzo e recapiti corroborati dalla scheda directory consultata.',
});

crea({
  id: 'gioielleria-foschini-telese', slug: 'gioielleria-foschini-telese', nome: 'Gioielleria Foschini',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'telese-terme',
  descrizione: 'Gioielleria Foschini in Via Roma 186 a Telese Terme gestisce un laboratorio di riparazione orologi attivo dal 1994, con cambio pila e sostituzione cinturini; la gioielleria è attiva dal 1998 e propone anche la vendita di orologi.',
  posizione: { indirizzo: 'Via Roma, 186', fonti: [F.fosIg] },
  contatti: { social: ['https://www.instagram.com/gioielleria_foschini_telese_/'], fonti: [F.fosIg] },
  servizi: serv(['riparazione', 'batterie', 'cinturini', 'vendita', 'gioielleria'], [F.fosIg, F.fosPost]),
  storia: {
    testo: 'Il profilo dichiara «Lab. Riparazioni Orologi dal 1994» e «Gioielleria dal 1998».',
    eventi: [{ data: '1994', descrizione: 'Avvio del laboratorio di riparazione orologi secondo il profilo ufficiale.', fonti: [F.fosIg] }],
    fonti: [F.fosIg],
  },
  fonti: [F.fosIg, F.fosPost],
  segnalazioni: [
    segn('Canale ufficiale consultato: profilo Instagram. Telefono, email e sito web non pubblicati; CAP non riportato.'),
    segn('Date 1994 e 1998 autodichiarate; interventi documentati solo cambio pila e sostituzione cinturini.'),
  ],
  nota: 'Espansione lotto 3: identità, sede, laboratorio e servizi base dal profilo ufficiale e dal post aziendale; nessun dato inventato oltre le fonti.',
});

crea({
  id: 'luigi-freddo-gioielli-gallipoli', slug: 'luigi-freddo-gioielli-gallipoli', nome: 'Luigi Freddo Gioielli',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'gallipoli',
  descrizione: 'Luigi Freddo Gioielli in Corso Roma 82 a Gallipoli è rivenditore ufficiale Hamilton documentato dal locator del marchio e dichiara orologeria e assistenza tecnica; il profilo aziendale indica una tradizione dal 1965.',
  posizione: { indirizzo: 'Corso Roma, 82', cap: '73014', fonti: [F.freHam] },
  contatti: { telefono: '0833 261197', email: 'luigifreddogioielli@libero.it', fonti: [F.freHam] },
  servizi: serv(['vendita', 'assistenza', 'gioielleria'], [F.freHam, F.freIg]),
  marchi: { venduti: brand(['Hamilton'], [F.freHam]), rivenditaUfficiale: brand(['Hamilton'], [F.freHam]) },
  storia: {
    testo: 'Il profilo aziendale si presenta come attività «Since 1965».',
    eventi: [{ data: '1965', descrizione: 'Inizio dell’attività secondo il profilo ufficiale.', fonti: [F.freIg] }],
    fonti: [F.freIg],
  },
  fonti: [F.freHam, F.freIg],
  segnalazioni: [
    segn('«Orologeria ed assistenza tecnica» è una dichiarazione del profilo ufficiale senza dettaglio degli interventi: nessun laboratorio attribuito.'),
    segn('Anno 1965 autodichiarato. La rivendita ufficiale Hamilton prova la vendita, non l’autorizzazione alla riparazione.'),
  ],
  nota: 'Espansione lotto 3: identità, sede, recapiti e rivendita ufficiale Hamilton dalla scheda specifica del produttore (marchio-ufficiale); assistenza dichiarata dal profilo ufficiale.',
});

crea({
  id: 'gioielleria-del-genio-martina', slug: 'gioielleria-del-genio-martina', nome: 'Gioielleria Del Genio',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'martina-franca',
  descrizione: 'Gioielleria Del Genio in Corso Messapia 41 a Martina Franca è rivenditore ufficiale Hamilton e Mido documentato dai locator ufficiali dei due marchi: vendita di orologi svizzeri con consulenza in negozio.',
  posizione: { indirizzo: 'Corso Messapia, 41', cap: '74015', fonti: [F.delHam, F.delMido] },
  contatti: { telefono: '080 4302541', fonti: [F.delHam, F.delMido] },
  servizi: serv(['vendita'], [F.delHam, F.delMido]),
  marchi: {
    venduti: brand(['Hamilton', 'Mido'], [F.delHam, F.delMido]),
    rivenditaUfficiale: brand(['Hamilton', 'Mido'], [F.delHam, F.delMido]),
  },
  fonti: [F.delHam, F.delMido],
  segnalazioni: [
    segn('Indirizzo discordante fra le schede Hamilton: Corso Messapia 41 (due fonti primarie: Hamilton e Mido) contro Via Gioacchino Rossini 29 in una seconda scheda Hamilton; possibile seconda sede o dato non aggiornato, non risolto.'),
    segn('Servizi di riparazione non documentati dalle fonti: nessun intervento tecnico attribuito.'),
  ],
  nota: 'Espansione lotto 3: identità, sede (Corso Messapia 41, confermata da due locator primari) e rivendite ufficiali Hamilton e Mido dalle schede specifiche dei produttori.',
});

crea({
  id: 'massimo-gioielli-foggia', slug: 'massimo-gioielli-foggia', nome: 'Massimo Gioielli',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'foggia',
  descrizione: 'Massimo Gioielli in Via Michele Angiolillo 2/4 a Foggia è rivenditore ufficiale Hamilton documentato dal locator del marchio; la storia aziendale ricorda il laboratorio da orologiaio aperto da Pietro Massimo nel 1953, oggi però non documentato come servizio corrente.',
  posizione: { indirizzo: 'Via Michele Angiolillo, 2/4', cap: '71121', fonti: [F.masSito, F.masHam] },
  contatti: { telefono: '0881 775322', email: 'gioielleriamassimo@yahoo.it', sito: 'https://www.massimogioielli.it/', fonti: [F.masHam] },
  servizi: serv(['vendita', 'gioielleria'], [F.masSito]),
  marchi: {
    venduti: brand(['Hamilton'], [F.masHam]),
    rivenditaUfficiale: brand(['Hamilton'], [F.masHam]),
    menzionati: brand(['Frederique Constant'], [F.masFc]),
  },
  storia: {
    fondatore: 'Pietro Massimo',
    testo: 'La pagina storica dell’attività ricorda l’apertura, nel 1953, di un laboratorio da orologiaio per opera di Pietro Massimo.',
    eventi: [{ data: '1953', descrizione: 'Apertura del laboratorio da orologiaio di Pietro Massimo secondo il sito.', fonti: [F.masSito] }],
    fonti: [F.masSito],
  },
  fonti: [F.masSito, F.masHam, F.masFc],
  segnalazioni: [
    segn('Il laboratorio del 1953 è storia dichiarata: non prova riparazioni attuali, nessun servizio di riparazione attribuito.'),
    segn('Civico discordante: 2/4 sul sito, 2 sui locator Hamilton e Frederique Constant.'),
    segn('La scheda Frederique Constant elenca il negozio senza qualifica esplicita di rivenditore: marchio solo menzionato.'),
  ],
  nota: 'Espansione lotto 3: identità, sede, recapiti e rivendita ufficiale Hamilton dalla scheda del produttore; storia 1953 dal sito, conservata come dichiarazione.',
});

crea({
  id: 'loncia-doro-siniscola', slug: 'loncia-doro-siniscola', nome: 'L’Oncia d’Oro',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'siniscola',
  descrizione: 'L’Oncia d’Oro in Via G.F. Conteddu 85 a Siniscola è laboratorio orafo e gioielleria con riparazione e manutenzione di orologi: cambio pila, sostituzione movimento e accumulatori, vetri, prove di impermeabilità, lucidatura e satinatura bracciali, incisione laser; vende orologi Citizen.',
  posizione: { indirizzo: 'Via G.F. Conteddu, 85', cap: '08029', fonti: [F.oncSito] },
  contatti: { telefono: '+39 0784 877843', email: 'info@onciadoro.it', sito: 'https://onciadoro.com/', fonti: [F.oncSito] },
  servizi: serv(['riparazione', 'manutenzione', 'batterie', 'lucidatura', 'vendita', 'gioielleria'], [F.oncSrv, F.oncOro]),
  altriServizi: [
    { nome: 'Sostituzione movimento e accumulatori', fonti: [F.oncSrv] },
    { nome: 'Sostituzione vetri', fonti: [F.oncSrv] },
    { nome: 'Prove di impermeabilità', fonti: [F.oncSrv] },
    { nome: 'Incisione laser', fonti: [F.oncSrv] },
  ],
  marchi: { venduti: brand(['Citizen'], [F.oncOro]) },
  fonti: [F.oncSito, F.oncSrv, F.oncOro],
  segnalazioni: [segn('Marchi riparati non specificati: il sito descrive i tipi di intervento senza elenchi per marca e senza autorizzazioni.')],
  nota: 'Espansione lotto 3: identità, sede, recapiti e vendita Citizen dal sito ufficiale; servizi tecnici dettagliati dalla pagina servizi.',
});

crea({
  id: 'gioielleria-stoppa-grosseto', slug: 'gioielleria-stoppa-grosseto', nome: 'Gioielleria Stoppa',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'grosseto',
  descrizione: 'Gioielleria Stoppa, fondata nel 1962 da Marcello Stoppa, gestisce a Grosseto un laboratorio interno orafo e di orologeria per manutenzione e riparazione di orologi di ogni marca con ricambi originali; è rivenditore ufficiale Tissot e Breil secondo i locator dei due marchi.',
  posizione: { indirizzo: 'Via Ecuador (Centro Commerciale Maremà)', cap: '58100', fonti: [F.stoSito, F.stoBre] },
  contatti: { telefono: '0564 454794', email: 'info@gioielleriastoppa.it', sito: 'https://gioielleriastoppa.it/', fonti: [F.stoSito] },
  servizi: serv(['riparazione', 'manutenzione', 'assistenza', 'vendita', 'gioielleria'], [F.stoLab, F.stoSito]),
  marchi: {
    venduti: brand(['Tissot', 'Breil'], [F.stoTis, F.stoBre]),
    rivenditaUfficiale: brand(['Tissot', 'Breil'], [F.stoTis, F.stoBre]),
  },
  storia: {
    annoFondazione: 1962, fondatore: 'Marcello Stoppa',
    testo: 'Il sito dell’attività dichiara la fondazione nel 1962 da parte di Marcello Stoppa.',
    eventi: [{ data: '1962', descrizione: 'Fondazione della gioielleria da parte di Marcello Stoppa.', fonti: [F.stoSto] }],
    fonti: [F.stoSto],
  },
  fonti: [F.stoSito, F.stoLab, F.stoSto, F.stoTis, F.stoBre],
  segnalazioni: [
    segn('Civico della sede Maremà non pubblicato dal sito («Via Ecuador, presso Centro Commerciale Maremà»); altre sedi in Corso Carducci 48a/48c. Recapito alternativo 056423522 dalla scheda Breil.'),
    segn('Riparazioni «di ogni marca» e fondazione 1962 autodichiarate; i locator Tissot e Breil documentano la rivendita, non l’assistenza tecnica autorizzata.'),
  ],
  nota: 'Espansione lotto 3: laboratorio interno e storia dal sito ufficiale; rivendite ufficiali Tissot e Breil dalle schede specifiche dei produttori (marchio-ufficiale).',
});

crea({
  id: 'gioielleria-marco-danese-quartu', slug: 'gioielleria-marco-danese-quartu', nome: 'Gioielleria Marco Danese',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'quartu-sant-elena',
  descrizione: 'Gioielleria Marco Danese in Via Cavour 68 a Quartu Sant’Elena è rivenditore ufficiale Hamilton documentato dal locator del marchio; il sito dichiara una tradizione dal 1876 e propone orologi, assistenza post-vendita e alta orologeria.',
  posizione: { indirizzo: 'Via Cavour, 68', cap: '09045', fonti: [F.danSito, F.danHam] },
  contatti: { telefono: '070 824138', email: 'info@gioielleriamarcodanese.com', sito: 'https://www.gioielleriamarcodanese.com/', fonti: [F.danSito] },
  servizi: serv(['vendita', 'assistenza', 'gioielleria'], [F.danProd]),
  marchi: { venduti: brand(['Hamilton'], [F.danHam]), rivenditaUfficiale: brand(['Hamilton'], [F.danHam]) },
  storia: {
    testo: 'Il sito attribuisce al negozio una tradizione dal 1876.',
    eventi: [{ data: '1876', descrizione: 'Origine della tradizione dichiarata dal sito.', fonti: [F.danProd] }],
    fonti: [F.danProd],
  },
  fonti: [F.danSito, F.danProd, F.danHam],
  segnalazioni: [
    segn('Email discordante: info@gioielleriamarcodanese.com sul sito, gioielleriamarcodanese@gmail.com sul locator Hamilton; entrambe registrate, nessuna scelta arbitraria.'),
    segn('Tradizione «dal 1876» autodichiarata; assistenza post-vendita e «Alta Orologeria» senza dettaglio di interventi: nessun laboratorio né riparazioni specifiche attribuite.'),
  ],
  nota: 'Espansione lotto 3: identità, sede e recapiti dal sito ufficiale; rivendita ufficiale Hamilton dalla scheda del produttore (marchio-ufficiale).',
});

crea({
  id: 'perdichizzi-1907-barcellona', slug: 'perdichizzi-1907-barcellona', nome: 'Gioielleria Perdichizzi 1907',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'barcellona-pozzo-di-gotto',
  descrizione: 'Gioielleria Perdichizzi 1907 in Via Roma 82 a Barcellona Pozzo di Gotto è gioielleria storica — la tradizione dichiarata risale al 1907 — con vendita di gioielli e orologi; il locator Hamilton documenta la sede come rivenditore ufficiale del marchio.',
  posizione: { indirizzo: 'Via Roma, 82', cap: '98051', fonti: [F.perSito, F.perHam] },
  contatti: { telefono: '090 9701578', email: 'info@perdichizzi1907.it', fonti: [F.perSito, F.perHam] },
  servizi: serv(['vendita', 'gioielleria'], [F.perSito]),
  marchi: { venduti: brand(['Hamilton'], [F.perHam]), rivenditaUfficiale: brand(['Hamilton'], [F.perHam]) },
  storia: {
    annoFondazione: 1907,
    testo: 'Il sito dell’attività dichiara vendite di gioielli dal 1907.',
    eventi: [{ data: '1907', descrizione: 'Inizio della tradizione dichiarata dal sito.', fonti: [F.perSito] }],
    fonti: [F.perSito],
  },
  fonti: [F.perSito, F.perHam],
  segnalazioni: [
    segn('Anno 1907 autodichiarato. Riparazioni locali non documentate: le condizioni di garanzia prevedono interventi per difetti ma escludono batteria e usura; nessun servizio di riparazione attribuito.'),
  ],
  nota: 'Espansione lotto 3: identità, sede, recapiti e storia dichiarata dal sito ufficiale; rivendita ufficiale Hamilton dalla scheda del produttore (marchio-ufficiale).',
});

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| località:', d.localita.length, '| fonti totali:', d.fonti.length);

const perTelefono = new Map();
const perDominio = new Map();
for (const b of d.attivita) {
  if (b.contatti.telefono) {
    const t = b.contatti.telefono.replace(/\D/g, '');
    if (!perTelefono.has(t)) perTelefono.set(t, []);
    perTelefono.get(t).push(b.id);
  }
  if (b.contatti.sito) {
    const host = new URL(b.contatti.sito).hostname.replace(/^www\./, '');
    if (!perDominio.has(host)) perDominio.set(host, []);
    perDominio.get(host).push(b.id);
  }
}
const collisioni = [];
for (const [t, ids] of perTelefono) if (ids.length > 1) collisioni.push(`telefono ${t}: ${ids.join(', ')}`);
for (const [h, ids] of perDominio) if (ids.length > 1) collisioni.push(`dominio ${h}: ${ids.join(', ')}`);
console.log(collisioni.length ? `collisioni da esaminare:\n${collisioni.join('\n')}` : 'nessuna collisione telefono/dominio');
