// Genera il lotto Fase 32-01 dalle voci confermate dalla verifica delle fonti.
// Gate geografico: comune, provincia, sigla, regione e codice ISTAT vengono presi
// dall'anagrafica ISTAT canonica; la sigla dichiarata deve coincidere con quella ISTAT.
// Uso: node scripts/fase32-genera-lotto.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = '2026-11-03';
const CAT = 'site/data/directory.json';
const OUT = 'data/import/fase32-01.json';

const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// L'anagrafica ISTAT è in Latin-1: leggerla come UTF-8 corrompe i comuni accentati (es. Rosà).
const csv = readFileSync('.audit/fase28/istat-comuni-2026.csv', 'latin1').split(/\r?\n/);
const istat = new Map();
for (const riga of csv.slice(1)) {
  const c = riga.split(';').map((x) => x.replace(/^"|"$/g, ''));
  if (c.length < 15) continue;
  istat.set(norm(c[6]), { comune: c[6], codice: c[4], provincia: c[11], sigla: c[14], regione: c[10] });
}

const voci = [
  {
    id: 'orologiaio-zaccaria-angelo-pulsano', nome: 'Orologiaio Zaccaria Angelo', comune: 'Pulsano', sigla: 'TA',
    via: 'Via Roma 46', cap: '74026', tel: '+39 347 4396566', sito: 'https://angelozaccariaza.wixsite.com/orologiaio-zaccaria',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'manutenzione'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria che dichiara revisione completa dei movimenti meccanici, regolazione di precisione e sostituzione dei componenti usurati.' },
    descrizione: 'Orologiaio a Pulsano con laboratorio che dichiara revisione completa di orologi meccanici con regolazione di precisione, riparazione di orologi vintage e manutenzione degli automatici.',
    fonteUrl: 'https://angelozaccariaza.wixsite.com/orologiaio-zaccaria',
    evidenza: 'Sito ufficiale: «Revisione completa di orologi meccanici con regolazione di precisione e sostituzione componenti usurati», riparazione di orologi vintage e manutenzione degli automatici; Via Roma 46, 74026 Pulsano, telefono +39 347 4396566.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati nel testo; riparazione, revisione e manutenzione dichiarate. Laboratorio interno dichiarato.',
  },
  {
    id: 'officina4-watchmaking-merano', nome: 'Officina4 Watchmaking', comune: 'Merano', sigla: 'BZ',
    via: 'Via Galilei 33', cap: '39012', tel: '+39 351 9616776', sito: 'https://www.officina4.com',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'lucidatura', 'cinturini'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio che dichiara la riparazione di orologi al quarzo, automatici e con complicazioni, con revisione, lucidatura e prova di impermeabilità.' },
    descrizione: 'Orologeria con laboratorio a Merano specializzata in assistenza e riparazione di ogni tipo di orologio: quarzo, automatici e complicazioni, con revisione, lucidatura e sostituzione di vetri e cinturini.',
    fonteUrl: 'https://www.officina4.com/IT---OFFICINA-4.html',
    evidenza: 'Pagina ufficiale: «Officina4 Watchmaking è il negozio specializzato in orologeria a Merano per l\'assistenza e la riparazione di ogni tipo di orologio»; «Ripariamo orologi al quarzo, automatici e con complicazioni», revisione, vetro, cinturino, lucidatura, prova di impermeabilità; CAP 39012 Merano e telefono +39 351 9616776.',
    motivo: 'Pagina ufficiale: comune, CAP e telefono riscontrati; riparazione, revisione, lucidatura e cinturini dichiarati. La via non è ripetuta nel testo della pagina e resta quella del record di ricerca, da riconfermare in sede di aggiornamento.',
  },
  {
    id: 'poli-maier-bressanone', nome: 'Poli Maier', comune: 'Bressanone', sigla: 'BZ',
    via: 'Portici Minori 8 F', cap: '39042', tel: '+39 0472 837079', sito: 'https://polimaier.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'batterie', 'cinturini'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria che dichiara pulizia e revisione dei movimenti meccanici.' },
    descrizione: 'Orologeria a Bressanone con laboratorio: Paolo Poli è orologiaio di formazione e il negozio dichiara riparazione di movimenti meccanici, pulizia e revisione, oltre a batterie e cinturini.',
    fonteUrl: 'https://polimaier.it/it/',
    evidenza: 'Sito ufficiale: «Paolo Poli è orologiaio di formazione», «Riparazione di movimenti meccanici», pulizia e revisione; indirizzo «Poli Maier di Poli Paolo S.a.s. Portici Minori 8 F Galleria Città · 39042 Bressanone (BZ)», telefono +39 0472 837079.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati nel testo; riparazione e revisione dei movimenti meccanici dichiarate. Laboratorio interno dichiarato.',
  },
  {
    id: 'tarondo-orologiai-tavagnacco', nome: 'Tarondo Orologiai', comune: 'Tavagnacco', sigla: 'UD',
    via: 'Via Udine 77', cap: '33010', tel: '0432 42897', sito: 'https://www.tarondo.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'assistenza'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio e centro di assistenza tecnica con apparecchiature specialistiche e un team di orologiai, tra cui soci diplomati WOSTEP.' },
    descrizione: 'Orologeria artigiana a Tavagnacco con laboratorio e centro di assistenza tecnica: squadra di orologiai, tra cui soci diplomati WOSTEP, attrezzature specialistiche e assistenza sui marchi.',
    fonteUrl: 'https://www.tarondo.it/',
    evidenza: 'Sito ufficiale: sezioni «Laboratorio», «Assistenza e Marchi», «Centro Assistenza Tecnica», «Struttura innovativa equipaggiata con apparecchiature specialistiche»; «Riparare un orologio è un\'operazione complessa»; team con «Marco Orologiaio diplomato Wostep»; Via Udine 77, 33010 Tavagnacco, telefono 0432 42897.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; riparazione e assistenza tecnica dichiarate, laboratorio interno con orologiai diplomati. Nessuna assistenza ufficiale di marca attribuita.',
  },
  {
    id: 'tempo-prezioso-bologna', nome: 'Tempo Prezioso Bologna', comune: 'Bologna', sigla: 'BO',
    via: 'Via G. Bentini 37/C', cap: '40128', tel: '051 9985671', sito: 'https://www.tempopreziosobologna.com',
    tipi: ['orologeria', 'laboratorio'], servizi: ['revisione', 'restauro-vintage', 'lucidatura'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio che dichiara revisione completa del movimento, lucidatura di cassa e bracciale, test di impermeabilità e restauro vintage.' },
    descrizione: 'Orologeria con laboratorio a Bologna che dichiara revisione completa del movimento, lucidatura di cassa e bracciale con test di impermeabilità, restauro di orologi vintage e verifica di autenticità.',
    fonteUrl: 'https://www.tempopreziosobologna.com/',
    evidenza: 'Sito ufficiale: «Revisione completa del movimento, lucidatura cassa e bracciale, test di impermeabilità»; restauro vintage e verifica di autenticità; Via G. Bentini 37/C, 40128 Bologna, telefono 051 9985671.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; revisione, lucidatura e restauro dichiarati. Laboratorio interno dichiarato.',
  },
  {
    id: 'arte-orafa-traversi-cave', nome: 'Arte Orafa Traversi', comune: 'Cave', sigla: 'RM',
    via: 'Viale Pio XII 97', cap: '00033', tel: '06 9507658', sito: 'https://www.arteorafatraversi.it',
    tipi: ['gioielleria', 'orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage', 'lucidatura'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio orologiero curato da Ugo Traversi, orologiaio specializzato dal 1963: manutenzione, revisione, restauri e lucidatura.' },
    descrizione: 'Oreficeria artigianale a Cave con sezione orologeria curata da Ugo Traversi, orologiaio specializzato dal 1963: vendita e riparazioni di orologi, manutenzione, revisione, restauri e lucidatura.',
    fonteUrl: 'https://www.arteorafatraversi.it/it/oreficeria-artigianale-italiana-roma/vendita-e-riparazioni-orologi-742',
    evidenza: 'Pagina «Vendita e riparazioni orologi»: «Il settore viene curato da nostro padre Ugo Traversi orologiaio specializzato dal 1963»; manutenzione, revisione, restauri, lucidatura; Viale Pio XII 97, 00033 Cave (RM), telefono 06 9507658.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; riparazione, revisione, restauro e lucidatura dichiarati con laboratorio interno.',
  },
  {
    id: 'cimafonte-orologi-napoli', nome: 'Cimafonte Orologi', comune: 'Napoli', sigla: 'NA',
    via: 'Via Mario Fiore 21', cap: '80129', tel: '081 5583888', sito: 'https://www.cimafonteorologi.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'restauro-vintage', 'lucidatura'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio specializzato nella riparazione, lucidatura, pulitura e restauro di orologi di lusso, vintage e moderni.' },
    descrizione: 'Orologeria con laboratorio a Napoli specializzata nella riparazione, lucidatura, pulitura e restauro di orologi di lusso, vintage e moderni.',
    fonteUrl: 'https://www.cimafonteorologi.it/servizi/',
    evidenza: 'Pagina «Servizi»: «specializzata nella riparazione Lucidatura Pulitura e Restauro di Orologi di Lusso», orologi vintage e moderni; Via Mario Fiore 21, 80129 Napoli, telefono 081 5583888.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; riparazione, lucidatura e restauro dichiarati. Laboratorio interno dichiarato.',
  },
  {
    id: 'la-clinica-dell-orologio-bernareggio', nome: "La Clinica dell'Orologio", comune: 'Bernareggio', sigla: 'MB',
    via: 'Via Franzolino Prinetti 52', cap: '20881', tel: '039 6900217', sito: 'https://www.clinicadellorologio.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['revisione', 'restauro-vintage', 'pendoleria', 'orologi-tasca'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio specializzato nella revisione e nel restauro di orologi meccanici antichi: pendoli, orologi da tasca e da parete.' },
    descrizione: "Laboratorio di orologeria a Bernareggio specializzato nella revisione e nel restauro di orologi meccanici antichi, pendoli, orologi da tasca e da parete.",
    fonteUrl: 'https://www.clinicadellorologio.it/benvenuti-nella-clinica-dellorologio/',
    evidenza: 'Pagina «Benvenuti nella clinica dell\'orologio»: «Siamo specializzati nella revisione e nel restauro di orologi meccanici antichi: pendoli… tasca»; Via Franzolino Prinetti 52, 20881 Bernareggio, telefono 039 6900217.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; revisione, restauro, pendoleria e orologi da tasca dichiarati. Laboratorio interno dichiarato.',
  },
  {
    id: 'legnano-orologeria-paternostro-1972', nome: 'Legnano Orologeria Paternostro 1972', comune: 'Legnano', sigla: 'MI',
    via: 'Corso Giuseppe Garibaldi 2/b', cap: '20025', tel: '+39 0331 452307', sito: 'https://www.andreapaternostro.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['revisione', 'assistenza'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio orologiero interno al punto vendita, specializzato in assistenza post-vendita e revisione di tutti i marchi.' },
    descrizione: 'Orologeria a Legnano attiva dal 1972 con laboratorio orologiero interno al punto vendita, specializzato in assistenza post-vendita e revisione di tutti i marchi.',
    fonteUrl: 'https://www.andreapaternostro.it/legnano-orologeria/',
    evidenza: 'Pagina ufficiale: «All\'interno del punto vendita è presente il laboratorio orologiero, specializzato nei servizi di assistenza post-vendita e revisione di tutti i marchi»; Corso Giuseppe Garibaldi 2/b, 20025 Legnano, telefono +39 0331 452307.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; revisione e assistenza post-vendita dichiarate con laboratorio interno. Nessuna assistenza ufficiale di marca attribuita.',
  },
  {
    id: 'sandrone-gioielli-moncalieri', nome: 'Sandrone Gioielli', comune: 'Moncalieri', sigla: 'TO',
    via: 'Via Montebello 1', cap: '10024', tel: null, sito: 'https://www.sandronegioielli.com',
    tipi: ['gioielleria', 'orologeria'], servizi: ['riparazione', 'assistenza'],
    laboratorio: null,
    descrizione: 'Gioielleria a Moncalieri che dichiara riparazione di orologi e preziosi e assistenza su gioielli. Nessun laboratorio orologiero interno documentato.',
    fonteUrl: 'https://www.sandronegioielli.com/',
    evidenza: 'Sito ufficiale: voce di servizio «Riparazione Orologi e Preziosi», «assistenza gioielli», «riparazione orologi»; indirizzo Via Montebello, 1, Moncalieri, 10024.',
    motivo: 'Sito ufficiale: indirizzo e CAP riscontrati; riparazione di orologi e assistenza dichiarate. Nessun laboratorio interno documentato, quindi non attribuito. Telefono non pubblicato nella pagina.',
  },
  {
    id: 'parolin-1885-rosa', nome: 'Parolin 1885', comune: 'Rosà', sigla: 'VI',
    via: 'Via Cap. Alessio 35', cap: '36027', tel: '+39 0424 580115', sito: 'https://www.parolinorologi.it',
    tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio interno all\'azienda che esegue riparazioni di orologeria, revisione completa dei movimenti e restauro di orologi d\'epoca.' },
    descrizione: "Orologeria storica (1885) a Rosà con laboratorio interno che esegue riparazioni di orologeria, revisione completa dei movimenti e restauro di orologi d'epoca.",
    fonteUrl: 'https://www.parolinorologi.it/contatti.php',
    evidenza: 'Sito ufficiale: «Riparazioni di orologeria vengono effettuate nel laboratorio interno all\'azienda … revisione completa dei movimenti compreso il restauro di orologi d\'epoca»; Via Cap. Alessio 35, 36027 Rosà (VI), telefono +39 0424 580115.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; riparazione, revisione e restauro dichiarati. Laboratorio interno dichiarato.',
  },
  {
    id: 'orologeria-martini-bassano-del-grappa', nome: 'Orologeria Martini', comune: 'Bassano del Grappa', sigla: 'VI',
    via: 'Via Beata Giovanna 26', cap: '36061', tel: '+39 0424 525376', sito: 'https://orologeria-martini.webnode.it',
    tipi: ['orologeria'], servizi: ['riparazione', 'vendita', 'pendoleria'],
    laboratorio: null,
    descrizione: 'Orologeria a Bassano del Grappa: il titolare Roberto Martini si presenta come riparatore di orologi e dichiara la riparazione e la vendita di ogni tipo di orologio, comprese le pendole antiche.',
    fonteUrl: 'https://orologeria-martini.webnode.it/',
    evidenza: 'Sito ufficiale: «Roberto Martini – Proprietario e riparatore di orologi. Riparo e vendo qualsiasi tipo di orologi … Riparo pendole antiche»; Via Beata Giovanna 26, 36061 Bassano del Grappa, telefono +39 0424 525376.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; riparazione, vendita e riparazione di pendole dichiarate. Nessun laboratorio interno documentato in modo esplicito.',
  },
  {
    id: 'otto-gioielli-montebelluna', nome: 'Otto Gioielli', comune: 'Montebelluna', sigla: 'TV',
    via: 'Via Feltrina Centro 137', cap: '31044', tel: '0423 609492', sito: 'https://ottogioielli.it',
    tipi: ['gioielleria', 'orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria interno al negozio con tecnici riparatori e meccanici restauratori che lavorano direttamente in sede.' },
    descrizione: 'Gioielleria con laboratorio di orologeria interno a Montebelluna: tecnici riparatori e meccanici restauratori lavorano in negozio, con riparazione e revisione di orologi automatici e meccanici e restauro.',
    fonteUrl: 'https://ottogioielli.it/riparazione-orologi-montebelluna/',
    evidenza: 'Pagina «Riparazione orologi Montebelluna»: «Laboratorio di orologeria interno … tecnici riparatori e meccanici restauratori lavorano direttamente in negozio … revisione di orologi automatici e meccanici»; Via Feltrina Centro 137, 31044 Montebelluna, telefono 0423 609492.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; riparazione, revisione e restauro dichiarati. Laboratorio interno dichiarato.',
  },
  {
    id: 'gioielleria-tomasi-trento', nome: 'Gioielleria Tomasi', comune: 'Trento', sigla: 'TN',
    via: 'Piazza Pasi 17', cap: '38122', tel: '+39 0461 986651', sito: 'https://www.gioielleriatomasi.it',
    tipi: ['gioielleria', 'orologeria', 'laboratorio'], servizi: ['revisione', 'restauro-vintage'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria che dichiara revisione del movimento e ripristino degli orologi, compresi i restauri dei vecchi orologi.' },
    descrizione: 'Gioielleria a Trento con laboratorio di orologeria che dichiara revisione del movimento e ripristino degli orologi, senza trascurare i restauri dei vecchi orologi.',
    fonteUrl: 'https://www.gioielleriatomasi.it/',
    evidenza: 'Sito ufficiale: «Laboratorio Orologeria … revisione del movimento … ripristino degli orologi … senza trascurare vecchi orologi che necessitano di restauri»; recapiti pubblicati: «Piazza Pasi, 17 38122 Trento», telefono +39 0461 986651.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; revisione e restauro dichiarati con laboratorio interno. Nessuna assistenza ufficiale di marca attribuita.',
  },
  {
    id: 'l-orologiaio-sardegna-porto-torres', nome: "L'Orologiaio Sardegna", comune: 'Porto Torres', sigla: 'SS',
    via: 'Via Libio 15', cap: '07046', tel: null, sito: 'https://www.lorologiaiosardegna.com',
    tipi: ['orologeria', 'laboratorio'], servizi: ['restauro-vintage', 'pendoleria', 'riparazione'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio attrezzato con lavoro di micromeccanica per ricostruire nei minimi particolari parti di orologi e pendoli.' },
    descrizione: "Orologeria con laboratorio a Porto Torres specializzata nel restauro di orologi e pendoli, con lavorazioni di micromeccanica per ricostruire le parti mancanti.",
    fonteUrl: 'https://www.lorologiaiosardegna.com/orologi.php',
    evidenza: 'Sito ufficiale: «laboratorio attrezzato... ricostruire nei minimi particolari... micromeccanica... Restauro orologi e pendoli»; Via Libio 15, 07046 Porto Torres; riparazione e assistenza citate nel testo.',
    motivo: 'Sito ufficiale: indirizzo e CAP riscontrati; restauro, pendoleria e riparazione dichiarati con laboratorio attrezzato. Telefono non pubblicato nella pagina consultata.',
  },
  {
    id: 'bellucci-echi-e-luci-martina-franca', nome: 'Bellucci Echi e Luci', comune: 'Martina Franca', sigla: 'TA',
    via: 'Via Carlo Pisacane 75', cap: '74015', tel: null, sito: 'https://www.bellucciechieluci.com',
    tipi: ['orologeria', 'laboratorio'], servizi: ['restauro-vintage'],
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio che smonta completamente gli orologi da torre in centinaia di parti, le controlla e le riassembla per il restauro.' },
    descrizione: 'Impresa artigiana a Martina Franca che esegue installazione e restauro di orologi da torre e campane: gli orologi vengono completamente scomposti in centinaia di parti, controllati e riassemblati.',
    fonteUrl: 'https://www.bellucciechieluci.com/servizi.php?id=95ead5',
    evidenza: 'Pagina «Restauro Orologi da torre»: «la Bellucci Echi e Luci srl esegue il restauro di campane e orologi da torre», «gli orologi da torre vengono completamente scomposti in centinaia di parti che, dopo una serie di accurati controlli, vengono riassemblate»; Via Carlo Pisacane 75, 74015 Martina Franca.',
    motivo: 'Pagina ufficiale: indirizzo e CAP riscontrati; restauro di orologi da torre dichiarato con lavorazione in laboratorio. Telefono non pubblicato nella pagina consultata.',
  },
  {
    id: 'capodagli-1937-senigallia', nome: 'Capodagli 1937', comune: 'Senigallia', sigla: 'AN',
    via: 'Corso 2 Giugno 45', cap: '60019', tel: '+39 071 60230', sito: 'https://capodagli.net',
    tipi: ['orologeria', 'laboratorio'], servizi: ['assistenza'],
    laboratorio: { tipo: 'rete', descrizione: 'Servizio di assistenza orologi con laboratorio interno dichiarato dalla pagina, senza indicazione dei marchi come assistenza ufficiale sul sito del marchio.' },
    descrizione: 'Negozio storico (1937) a Senigallia con servizio di assistenza orologi e penne e laboratorio interno; dichiara assistenza sui gruppi Swatch, Richemont e LVMH e su Montblanc.',
    fonteUrl: 'https://capodagli.net/pages/servizio-assistenza-orologi-e-penne',
    evidenza: 'Pagina «Servizio assistenza orologi e penne»: «Facciamo assistenza ufficiale su penne, pelletteria e orologi Montblanc», assistenza sui marchi dei gruppi Swatch, Richemont e LVMH; Corso 2 Giugno 45, 60019 Senigallia, telefono +39 071 60230.',
    motivo: 'Pagina ufficiale: indirizzo, CAP e telefono riscontrati; assistenza orologi dichiarata. L\'assistenza di marca non è attribuita come ufficiale perché la dichiarazione è del rivenditore e non del marchio.',
  },
  {
    id: 'r-rubini-arte-del-tempo-fidenza', nome: 'R. Rubini Arte del Tempo', comune: 'Fidenza', sigla: 'PR',
    via: 'Via Antonio Gramsci 25', cap: '43036', tel: '+39 0524 528157', sito: 'https://www.rrubini.com',
    tipi: ['orologeria'], servizi: ['riparazione', 'valutazioni'],
    laboratorio: null,
    descrizione: 'Boutique di orologeria a Fidenza specializzata in orologi da polso e da tasca: dichiara riparazione e valutazione di orologi dei più prestigiosi marchi.',
    fonteUrl: 'https://www.rrubini.com/',
    evidenza: 'Sito ufficiale (versione inglese): «We repair and appraise watches from all the most prestigious brands (wristwatches, pocket watches, and clocks)»; Via Antonio Gramsci 25, 43036 Fidenza, telefono +39 0524 528157.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono riscontrati; riparazione e valutazione di orologi dichiarate. Nessun laboratorio interno documentato, quindi non attribuito.',
  },
];

const catalogo = JSON.parse(readFileSync(CAT, 'utf8'));
// L'anagrafica del progetto è la fonte canonica per i comuni già in catalogo:
// per la Sardegna usa i nuovi assetti territoriali 2026, diversi dal CSV storico.
const anagrafica = JSON.parse(readFileSync('data/anagrafica/comuni-catalogo.json', 'utf8'));
const anaPerNome = new Map(anagrafica.comuni.map((c) => [norm(c.nome), c]));
const locEsistenti = new Map(catalogo.localita.map((l) => [norm(l.comune), l]));
const attivitaIds = new Set(catalogo.attivita.map((a) => a.id));

const fonti = [];
const localita = [];
const candidati = [];
const scartati = [];

for (const v of voci) {
  if (attivitaIds.has(v.id)) throw new Error(`attività già in catalogo: ${v.id}`);
  const esistente = locEsistenti.get(norm(v.comune));
  const a = istat.get(norm(v.comune));
  if (!esistente && !a) throw new Error(`comune ISTAT assente: ${v.comune}`);
  const sigla = esistente ? esistente.siglaProvincia : a.sigla;
  if (sigla !== v.sigla) throw new Error(`sigla incoerente per ${v.comune}: dichiarata ${v.sigla}, ISTAT ${sigla}`);
  const lid = esistente ? esistente.id : norm(a.comune);
  if (esistente) {
    const c = anaPerNome.get(norm(esistente.comune));
    if (!c) throw new Error(`località esistente senza anagrafica: ${esistente.id}`);
    if (c.codiceIstat !== esistente.codiceIstat) throw new Error(`codice ISTAT non canonico per ${v.comune}`);
    if (c.sigla !== v.sigla || c.regione !== esistente.regione) throw new Error(`provincia o regione incoerenti per ${v.comune}`);
  }
  const fid = `f32-${v.id}`;
  fonti.push({
    id: fid, tipo: 'sito-ufficiale', url: v.fonteUrl, titolo: `${v.nome} — pagina ufficiale`, consultataIl: DATA,
    percorsoArchivio: null, licenza: null, evidenza: v.evidenza,
  });
  if (!esistente && !localita.some((l) => l.id === lid)) {
    localita.push({
      id: lid, comune: a.comune, comuneSlug: norm(a.comune), provincia: a.provincia, provinciaSlug: norm(a.provincia),
      siglaProvincia: a.sigla, regione: a.regione, regioneSlug: norm(a.regione), codiceIstat: a.codice,
      descrizione: `${a.comune}: attività di orologeria censite con fonti ufficiali.`, fonti: [fid],
    });
  }
  candidati.push({
    id: v.id, nome: v.nome, decisione: 'approvata', motivo: v.motivo, fonti: [fid],
    attivita: {
      id: v.id, slug: v.id, nome: v.nome, tipi: v.tipi, descrizione: v.descrizione,
      nomiPrecedenti: [], gruppoId: null, localitaId: lid,
      posizione: { indirizzo: v.via, cap: v.cap, coordinate: null, fonti: [fid] },
      contatti: { telefono: v.tel, email: null, sito: v.sito, whatsapp: null, social: [], fonti: [fid] },
      orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
      ...(v.laboratorio ? { laboratorio: { tipo: v.laboratorio.tipo, descrizione: v.laboratorio.descrizione, fonti: [fid] } } : {}),
      servizi: v.servizi.map((s) => ({ id: s, fonti: [fid] })),
      altriServizi: [], specializzazioni: [],
      marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
      storia: v.id === 'parolin-1885-rosa'
        ? { annoFondazione: 1885, fondatore: null, testo: null, eventi: [], fonti: [fid] }
        : { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
      attendibilita: {
        stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null, fonti: [fid],
        cronologia: [{ data: DATA, azione: 'Verifica della pagina ufficiale: indirizzo e recapiti riscontrati nel testo, servizi dichiarati trascritti senza estensioni.', fonti: [fid] }],
        segnalazioni: [],
      },
      origine: { sistema: 'ricerca-ufficiale-fase32-01', idOriginale: v.id },
    },
  });
}

// Candidati verificati ma esclusi dal gate geografico: restano nel registro come storia.
const esclusi = [
  ['orologeria-magno-bari', 'Bari', 'CAP, via e telefono non riscontrati nelle pagine ufficiali consultate'],
  ['gioielleria-bisciardi-avezzano', 'Avezzano', 'CAP non pubblicato e non confermabile'],
  ['gioielleria-spinelli-cesano-maderno', 'Cesano Maderno', 'CAP non riscontrato nella pagina ufficiale'],
  ['lissi-gioielli-rho', 'Rho', 'indirizzo non pubblicato, CAP non confermato'],
  ['cm-orologi-alba', 'Alba', 'CAP non riscontrato nelle pagine ufficiali consultate'],
  ['zanoni-preziosi-trento', 'Trento', 'indirizzo e CAP non pubblicati: collocazione ambigua'],
  ['formica-francesco-citta-di-castello', 'Città di Castello', 'CAP non riscontrato nella pagina ufficiale'],
  ['l-orologio-imola-imola', 'Imola', 'CAP del record (41026) errato per Imola e non confermato dal sito'],
];
for (const [id, comune, motivo] of esclusi) {
  scartati.push({ id, comune, motivo });
}

const lotto = { lotto: 'fase32-01', data: DATA, fonti, localita, candidati };
writeFileSync(OUT, JSON.stringify(lotto, null, 2) + '\n');
writeFileSync('data/reports/fase32-esclusi-gate.json', JSON.stringify({ data: DATA, esclusi: scartati }, null, 2) + '\n');
console.log(`scritto ${OUT}: ${candidati.length} candidati, ${localita.length} nuove località, ${fonti.length} fonti`);
console.log('nuove località:', localita.map((l) => `${l.comune} (${l.siglaProvincia}, ${l.codiceIstat})`).join(', '));
console.log(`esclusi dal gate: ${scartati.length}`);
