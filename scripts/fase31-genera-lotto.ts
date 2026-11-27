import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const DATA = '2026-11-03';
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const comuni = JSON.parse(readFileSync('data/anagrafica/comuni-catalogo.json', 'utf8')).comuni as any[];

type Voce = {
  id: string; nome: string; comune: string; via: string; cap: string | null; tel: string | null; sito: string;
  tipi: string[]; servizi: string[]; marchi: string[]; anno: number | null;
  descrizione: string; fonteUrl: string; evidenza: string; motivo: string;
  laboratorio?: { tipo: string; descrizione: string };
};

const voci: Voce[] = [
  {
    id: 'lorologiaio-biella', nome: "L'Orologiaio di Liddo", comune: 'Biella', via: 'Via Bernardino Galliari 10/a', cap: '13900', tel: '+39 015 28401',
    sito: 'https://www.lorologiaiobiella.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'lucidatura', 'assistenza', 'vendita', 'valutazioni'],
    marchi: ['Omega', 'Cartier', 'Baume & Mercier', 'Tag Heuer', 'Longines', 'Tissot', 'Rado', 'Hamilton'], anno: null,
    descrizione: "Orologeria con laboratorio nel centro storico di Biella: riparazione dell'orologio e dei suoi componenti, lucidatura e restauro estetico, vendita di orologi e perizie. Il sito si dichiara centro di assistenza certificato per Omega, Cartier, Baume & Mercier, Tag Heuer, Longines, Tissot, Rado e Hamilton: l'abilitazione non è stata verificata su pagina dei marchi.",
    fonteUrl: 'https://www.lorologiaiobiella.it/laboratorio-orologeria',
    evidenza: 'Pagina «Laboratorio orologeria»: Via Bernardino Galliari 10/a, 13900 Biella, telefono 015 28401; sezione «I nostri servizi di laboratorio» con riparazione, lucidatura e restauro, garanzia; dichiarazione di centro assistenza certificato per otto marchi; collegamento alla pagina Perizie e Valutazioni.',
    motivo: 'Sito ufficiale con indirizzo, CAP e telefono verificati; riparazione, lucidatura e vendita dichiarate. Assistenza certificata solo autodichiarata, non attribuita come ufficiale.',
  },
  {
    id: 'orsi-gioielleria-verbania', nome: 'Orsi Gioielleria', comune: 'Verbania', via: 'Via San Fabiano 5', cap: null, tel: '+39 0323 404463',
    sito: 'https://www.orsigioielleria.com', tipi: ['gioielleria', 'laboratorio'], servizi: ['riparazione', 'pendoleria'],
    marchi: [], anno: null,
    descrizione: "Gioielleria a Verbania con laboratorio interno che dichiara riparazioni di orologi di tutte le principali marche, pendole e sveglie. Il CAP non è indicato nelle pagine consultate.",
    fonteUrl: 'https://www.orsigioielleria.com/chi-siamo/',
    evidenza: 'Pagina «Chi siamo»: «lavorazioni di tutti i generi, da oggetti nuovi a riparazioni d’orologi di tutte le migliori marche, fino a pendole e sveglie»; recapito Via S. Fabiano 5, Verbania, telefono 0323 404463; CAP non pubblicato.',
    motivo: 'Sito ufficiale: indirizzo e telefono verificati, riparazione e pendoleria dichiarate. CAP non pubblicato, quindi non attribuito.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio interno dichiarato nella pagina «Chi siamo», con riparazioni di orologi, pendole e sveglie.' },
  },
  {
    id: 'bruni-imperia', nome: 'Orologeria Oreficeria Giacomo Bruni', comune: 'Imperia', via: 'Via Felice Cascione 106', cap: '18100', tel: '0183 60655',
    sito: 'http://www.orologeriaoreficeriagiacomobruni.it', tipi: ['orologeria', 'laboratorio'], servizi: ['restauro-vintage', 'riparazione'],
    marchi: [], anno: null,
    descrizione: "Orologeria e oreficeria a Imperia con laboratorio di restauro e riparazione di orologi antichi e d'epoca, attività dichiarata da oltre novant'anni.",
    fonteUrl: 'http://www.orologeriaoreficeriagiacomobruni.it/page/restauro-orologi',
    evidenza: 'Pagina «Restauro Orologi»: «Laboratorio di Restauro e Riparazione Orologi antichi d’epoca», azienda nel settore della riparazione di orologi da più di 90 anni; recapiti Via Felice Cascione 106, 18100 Imperia, telefono 0183 60655.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; restauro di orologi antichi e riparazione dichiarati.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di restauro e riparazione di orologi antichi ed epoca dichiarato dal sito.' },
  },
  {
    id: 'dalmasso-1913-imperia', nome: 'Dalmasso 1913', comune: 'Imperia', via: 'Via Felice Cascione 122', cap: '18100', tel: '0183 667158',
    sito: 'https://dalmasso1913.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage', 'cinturini', 'lucidatura'],
    marchi: [], anno: 1913,
    descrizione: 'Orologeria di Imperia attiva dal 1913, con laboratorio interno per riparazioni e revisioni, restauro di casse e bracciali e sostituzione dei cinturini. Si dichiara rivenditore autorizzato dei marchi in catalogo.',
    fonteUrl: 'https://dalmasso1913.it/pages/riparazioni',
    evidenza: 'Pagina «Riparazioni e revisioni»: indicazione dell’intervento e dei tempi, restauro e cura di casse e bracciali, valutazione del recupero di movimento e componenti; «Dal 1913», quattro generazioni, orologiaio in sede, laboratorio per assistenza e riparazioni. Recapiti Via Felice Cascione 122, 18100 Imperia, telefono 0183 667158.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, revisione e restauro dichiarati. Rivenditoria autorizzata non attribuita per singolo marchio.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio interno per assistenza e riparazioni, con orologiaio in sede, dichiarato dal sito.' },
  },
  {
    id: 'dupanloup-savona', nome: 'Gioielleria A. Dupanloup', comune: 'Savona', via: 'Piazza Sandro Pertini 44', cap: '17100', tel: null,
    sito: 'https://www.dupanloup.it', tipi: ['gioielleria', 'orologeria'], servizi: ['revisione', 'assistenza', 'vendita'],
    marchi: ['Rolex', 'Tudor'], anno: null,
    descrizione: "Gioielleria e orologeria a Savona che dichiara un laboratorio autorizzato Rolex per l'assistenza tecnica completa, con revisioni coperte da due anni di garanzia, e la rivendita di marchi in catalogo. Il telefono non è pubblicato nelle pagine consultate.",
    fonteUrl: 'https://www.dupanloup.it/',
    evidenza: 'Homepage: «disponiamo di un laboratorio di orologeria Ufficialmente Autorizzato Rolex per un’assistenza tecnica completa» e revisioni complete con garanzia di due anni; «Rivenditori Autorizzati dei più prestigiosi marchi»; indirizzo Piazza Sandro Pertini 44, 17100 Savona; shop online Tudor. Telefono non indicato.',
    motivo: 'Sito ufficiale: indirizzo e CAP verificati, revisione, assistenza e vendita dichiarate. Autorizzazione Rolex autodichiarata, non confermata su pagina del marchio; telefono non pubblicato.',
    laboratorio: { tipo: 'rete', descrizione: "Laboratorio di orologeria dichiarato «Ufficialmente Autorizzato Rolex» per l'assistenza tecnica completa; l'autorizzazione non è stata verificata su fonte del marchio." },
  },
  {
    id: 'satolli-pescara', nome: 'Orologeria Satolli', comune: 'Pescara', via: 'Via Galileo Galilei 8/1', cap: '65122', tel: '085 4212934',
    sito: 'https://www.orologeriasatolli.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'assistenza', 'vendita'],
    marchi: ['Omega', 'Longines', 'Rado', 'Tissot', 'Hamilton', 'Calvin Klein', 'Eberhard', 'Paul Picot'], anno: 1908,
    descrizione: 'Orologeria di Pescara attiva dal 1908 e condotta da quattro generazioni, con servizio di revisione e riparazione anche di orologi di alta gamma. Si dichiara centro di assistenza certificato per Omega, Longines, Rado, Tissot, Hamilton e Calvin Klein.',
    fonteUrl: 'https://www.orologeriasatolli.it/assistenza/',
    evidenza: 'Pagina «Assistenza»: riferimento pluridecennale per Eberhard e Paul Picot, «Centro di Assistenza Certificato» per Omega, Longines, Rado, Tissot, Hamilton e Calvin Klein, revisione e riparazione della maggior parte degli orologi in commercio; pagina «Dove siamo» con Via Galileo Galilei 8/1, 65122 Pescara, telefono 085 4212934; «Orologiai dal 1908».',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, revisione e assistenza dichiarate. Certificazione dei marchi autodichiarata, non confermata su pagina dei marchi.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di revisione e riparazione dichiarato nella pagina «Assistenza», con interventi anche su orologi di alta gamma.' },
  },
  {
    id: 'ranieri-laquila', nome: 'Gioielleria R. Ranieri', comune: "L'Aquila", via: 'Via delle Grazie 26', cap: '67100', tel: '0862 293005',
    sito: 'https://www.gioielleriaranieri.com', tipi: ['gioielleria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'lucidatura', 'valutazioni', 'assistenza', 'vendita'],
    marchi: ['Rolex', 'Omega', 'Montblanc', 'Garmin', 'Frederique Constant'], anno: null,
    descrizione: "Gioielleria con laboratorio all'Aquila che dichiara preventivi e riparazioni di Rolex, Omega e delle principali marche, revisione del movimento, lucidatura e valutazioni di orologi nuovi, usati e d'epoca. Si presenta come laboratorio autorizzato Rolex.",
    fonteUrl: 'https://www.gioielleriaranieri.com/laboratorio/',
    evidenza: 'Pagina «Laboratorio»: «Laboratorio autorizzato ROLEX», preventivi e riparazioni di Rolex, Omega e delle primarie marche, valutazioni e stime di orologi nuovi, usati e d’epoca, fasi di lavorazione con revisione del movimento e lucidatura; recapiti Via delle Grazie 26, 67100 L’Aquila, telefono 0862 293005.',
    motivo: "Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, revisione, lucidatura e valutazioni dichiarate. Autorizzazione Rolex autodichiarata, non verificata sul sito del marchio.",
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria dichiarato, con revisione del movimento, lucidatura e preventivi su Rolex, Omega e altre marche.' },
  },
  {
    id: 'quaranta-campobasso', nome: 'Gioielleria Stefano Quaranta', comune: 'Campobasso', via: 'Via Isernia 52', cap: '86100', tel: '0874 311567',
    sito: 'https://www.gioielleriastefanoquaranta.com', tipi: ['gioielleria'], servizi: ['riparazione', 'assistenza', 'vendita', 'gioielleria'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria a Campobasso specializzata nella vendita di preziosi, con servizi di riparazione e assistenza post-vendita dichiarati.',
    fonteUrl: 'https://www.gioielleriastefanoquaranta.com/servizi',
    evidenza: 'Pagina «Servizi»: «Servizi di riparazione e assistenza post-vendita», gioielleria specializzata nella vendita di preziosi; recapiti Via Isernia 52, 86100 Campobasso, telefono 0874 311567.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, assistenza post-vendita e vendita dichiarate.',
  },
  {
    id: 'pietro-roberto-cosenza', nome: "Pietro Roberto L'Orologio", comune: 'Cosenza', via: 'Via F. Simonetta 27/A', cap: '87100', tel: '0984 32884',
    sito: 'https://www.pietroroberto.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'restauro-vintage', 'ricambi', 'assistenza'],
    marchi: [], anno: 1978,
    descrizione: "Laboratorio di orologeria a Cosenza aperto nel 1978, che dichiara riparazioni e restauro di orologi da polso e da arredamento, antichi e moderni, con utilizzo di ricambi originali. Si presenta come centro di assistenza certificato.",
    fonteUrl: 'https://www.pietroroberto.it/',
    evidenza: 'Homepage: apertura del laboratorio in Via F. Simonetta 27/A nel luglio 1978; «Effettua riparazioni e restauro di orologi da polso e di arredamento, antichi e moderni, delle migliori marche. Utilizzo ricambi originali»; indicazione «Centro Assistenza Certificato»; CAP 87100 e telefono 0984 32884.',
    motivo: "Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, restauro e ricambi originali dichiarati. Certificazione di assistenza autodichiarata, non attribuita come ufficiale.",
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio aperto nel 1978, con riparazione e restauro di orologi da polso e da arredamento e ricambi originali.' },
  },
  {
    id: 'musci-catanzaro', nome: 'Gioielleria Musci', comune: 'Catanzaro', via: 'Via Giovanni Vercillo 19', cap: '88100', tel: '0961 053273',
    sito: 'https://muscigioielli.it', tipi: ['gioielleria'], servizi: ['riparazione', 'revisione', 'manutenzione', 'cinturini'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria a Catanzaro che dichiara riparazioni di orologi con preventivo, revisione e manutenzione completa e sostituzione di cinturini e bracciali.',
    fonteUrl: 'https://muscigioielli.it/riparazione-orologi',
    evidenza: 'Pagina «Riparazione orologi»: modulo con preventivo gratuito online, voci «Cinturino o bracciale rotto», «Condensa o acqua all’interno», «Revisione / manutenzione completa», pulsanti danneggiati; recapiti Via Giovanni Vercillo 19, 88100 Catanzaro, telefono 0961 053273.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, revisione, manutenzione e cinturini dichiarati nel modulo di preventivo.',
  },
  {
    id: 'liparota-lamezia', nome: 'Gioielleria Liparota', comune: 'Lamezia Terme', via: 'Via P. Fiorentino 20', cap: '88046', tel: '0968 438073',
    sito: 'https://www.gioiellerialiparota.com', tipi: ['gioielleria'], servizi: ['riparazione', 'assistenza', 'vendita'],
    marchi: ['Lorenz'], anno: null,
    descrizione: 'Gioielleria a Lamezia Terme con laboratorio di creazione e riparazione di orologi, riparazioni e assistenza dichiarate e rivendita autorizzata Lorenz.',
    fonteUrl: 'https://www.gioiellerialiparota.com/orologi.php',
    evidenza: 'Pagina «Orologi»: «Creazione Riparazione Orologi», «Riparazioni e assistenza orologi», rivendita autorizzata del brand Lorenz; recapiti Via P. Fiorentino 20, 88046 Lamezia Terme, telefono 0968 438073.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, assistenza e vendita dichiarate; rivendita Lorenz dichiarata dal sito dell’attività.',
  },
  {
    id: 'mosele-bolzano', nome: 'Mosele Luxury Time', comune: 'Bolzano', via: 'Piazza Walther 19', cap: '39100', tel: null,
    sito: 'https://www.moseleluxurytime.it', tipi: ['orologeria', 'laboratorio'], servizi: ['revisione', 'restauro-vintage', 'lucidatura', 'ricambi'],
    marchi: [], anno: null,
    descrizione: 'Orologeria a Bolzano con laboratorio che dichiara revisione completa dei movimenti, pulizia a ultrasuoni, oliatura, calibrazione della marcia, restauro estetico, lucidatura e satinatura, sostituzione di vetri e componenti e test di impermeabilità. Il telefono non è pubblicato nella pagina consultata.',
    fonteUrl: 'https://www.moseleluxurytime.it/',
    evidenza: 'Homepage, sezione «Laboratorio di Orologeria»: revisione completa di movimenti, smontaggio e pulizia a ultrasuoni, oliatura, calibrazione della marcia, restauro estetico, lucidatura e satinatura, sostituzione di vetri e componenti, test di impermeabilità; indirizzo Piazza Walther 19, 39100 Bolzano.',
    motivo: 'Sito ufficiale: indirizzo e CAP verificati; revisione, restauro, lucidatura e sostituzione componenti dichiarati. Telefono non pubblicato.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria dichiarato con revisione completa dei movimenti, restauro estetico e test di impermeabilità.' },
  },
  {
    id: 'mazzonetto-udine', nome: 'Orologeria Mazzonetto Eredi', comune: 'Udine', via: 'Via Aquileia 70/D', cap: '33100', tel: '+39 0432 502122',
    sito: 'https://www.orologiaudine.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage', 'pendoleria', 'orologi-tasca', 'lucidatura', 'vendita'],
    marchi: [], anno: null,
    descrizione: "Orologeria a Udine che dichiara riparazione, vendita e restauro di orologi meccanici da tavolo, a pendolo, da polso e da tasca, revisione completa di pendole e carillon e interventi estetici su quadranti e casse.",
    fonteUrl: 'https://www.orologiaudine.it/',
    evidenza: 'Homepage: «riparazione, vendita e restauro di orologi meccanici, da tavolo, a pendolo, da polso e da tasca»; revisione completa di pendole e carillon, restauro di pendole e cucù, interventi estetici su quadranti e casse; laboratorio in Via Aquileia 70/D, 33100 Udine, telefono 0432 502122.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, revisione, restauro, pendoleria e orologi da tasca dichiarati.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di orologeria dichiarato, con revisione di pendole e carillon e interventi estetici su quadranti e casse.' },
  },
];

const fonti: any[] = [];
const localita: any[] = [];
const candidati: any[] = [];
const usate = new Set<string>();

for (const v of voci) {
  const a = comuni.find(c => c.nome === v.comune);
  if (!a) throw new Error(`comune ISTAT assente: ${v.comune}`);
  const loc = dir.localita.find((l: any) => l.comune === v.comune);
  if (!loc) throw new Error(`località assente in directory: ${v.comune}`);
  if (loc.codiceIstat && loc.codiceIstat !== a.codiceIstat) throw new Error(`codice ISTAT incoerente per ${v.comune}`);
  if (loc.siglaProvincia !== a.sigla) throw new Error(`sigla incoerente per ${v.comune}`);

  const fid = `f31-${v.id}`;
  if (usate.has(fid)) throw new Error(`fonte duplicata: ${fid}`);
  usate.add(fid);
  fonti.push({
    id: fid, tipo: 'sito-ufficiale', url: v.fonteUrl, titolo: `${v.nome} — pagina ufficiale`, consultataIl: DATA,
    percorsoArchivio: null, licenza: null, evidenza: v.evidenza,
  });

  const attivita: any = {
    id: v.id, slug: v.id, nome: v.nome, tipi: v.tipi, descrizione: v.descrizione,
    nomiPrecedenti: [], gruppoId: null, localitaId: loc.id,
    posizione: { indirizzo: v.via, cap: v.cap, coordinate: null, fonti: [fid] },
    contatti: { telefono: v.tel, email: null, sito: v.sito, whatsapp: null, social: [], fonti: [fid] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    ...(v.laboratorio ? { laboratorio: { tipo: v.laboratorio.tipo, descrizione: v.laboratorio.descrizione, fonti: [fid] } } : {}),
    servizi: v.servizi.map(s => ({ id: s, fonti: [fid] })),
    altriServizi: [], specializzazioni: [],
    marchi: {
      venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [],
      menzionati: v.marchi.map(m => ({ marca: m, fonti: [fid] })),
    },
    storia: { annoFondazione: v.anno, fondatore: null, testo: null, eventi: [], fonti: v.anno ? [fid] : [] },
    attendibilita: {
      stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null,
      fonti: [fid],
      cronologia: [{ data: DATA, azione: 'Verifica della pagina ufficiale: indirizzo e recapiti riscontrati nel testo, servizi dichiarati trascritti senza estensioni.', fonti: [fid] }],
      segnalazioni: [],
    },
    origine: { sistema: 'ricerca-ufficiale-fase31-01', idOriginale: v.id },
  };
  candidati.push({ id: v.id, nome: v.nome, decisione: 'approvata', motivo: v.motivo, fonti: [fid], attivita });
}

const lotto = { lotto: 'fase31-01', data: DATA, fonti, localita, candidati };
mkdirSync('data/import', { recursive: true });
writeFileSync('data/import/fase31-01.json', JSON.stringify(lotto, null, 2) + '\n');
console.log('lotto fase31-01: attività', candidati.length, 'fonti', fonti.length);
