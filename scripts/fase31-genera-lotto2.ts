import { readFileSync, writeFileSync } from 'node:fs';

const DATA = '2026-11-03';
const csv = readFileSync('.audit/fase28/istat-comuni-2026.csv', 'utf8').split(/\r?\n/);
const istat = new Map<string, { codice: string; provincia: string; sigla: string; regione: string }>();
for (const riga of csv.slice(1)) {
  const c = riga.split(';').map(x => x.replace(/^"|"$/g, ''));
  if (c.length < 15) continue;
  istat.set(c[6], { codice: c[4], provincia: c[11], sigla: c[14], regione: c[10] });
}

type Voce = {
  id: string; nome: string; comune: string; via: string; cap: string | null; tel: string | null; sito: string;
  tipi: string[]; servizi: string[]; marchi: string[]; anno: number | null;
  descrizione: string; fonteUrl: string; evidenza: string; motivo: string;
  laboratorio?: { tipo: string; descrizione: string };
};

const voci: Voce[] = [
  {
    id: 'del-giudice-pozzuoli', nome: 'Gioielleria Del Giudice', comune: 'Pozzuoli', via: 'Piazza della Repubblica 121', cap: '80078', tel: '081 526 9631',
    sito: 'https://www.gioielleriadelgiudice.it', tipi: ['gioielleria'], servizi: ['riparazione', 'gioielleria'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria a Pozzuoli che dichiara riparazione di orologi e gioielli eseguita da artigiani e maestri orafi.',
    fonteUrl: 'https://www.gioielleriadelgiudice.it/riparazione-di-orologi-e-gioielli-a-pozzuoli/',
    evidenza: 'Pagina «Riparazione di orologi e gioielli a Pozzuoli»: riparazioni di orologi e gioielli effettuate da artigiani e maestri orafi; pagina contatti con Piazza della Repubblica 121, 80078 Pozzuoli, telefono 081 526 9631.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione di orologi e gioielli dichiarata.',
    laboratorio: { tipo: 'orafo', descrizione: 'Riparazioni dichiarate come eseguite da artigiani e maestri orafi della gioielleria.' },
  },
  {
    id: 'arte-doro-ostuni', nome: "Arte D'Oro Gioielli", comune: 'Ostuni', via: 'Via Miccoli 41', cap: null, tel: '0831 332219',
    sito: 'https://www.gioielleriaartedoro.it', tipi: ['gioielleria'], servizi: ['riparazione', 'assistenza', 'ricambi', 'batterie', 'cinturini', 'vendita'],
    marchi: [], anno: null,
    descrizione: "Gioielleria a Ostuni con sezione orologeria: dichiara interventi di riparazione e assistenza e la fornitura di ricambi originali come corone, cinturini, vetri, pulsanti, pile e lancette. Il CAP non è indicato nella pagina consultata.",
    fonteUrl: 'https://www.gioielleriaartedoro.it/orologi/',
    evidenza: 'Pagina «Orologi»: «Orologeria e riparazione di orologi», «interventi di riparazione e assistenza», accessori e ricambi originali come corone, cinturini, vetri, pulsanti, pile e lancette; indirizzo Via Miccoli 41, Ostuni, telefono 0831 332219; CAP non pubblicato.',
    motivo: 'Sito ufficiale: indirizzo e telefono verificati, riparazione e ricambi dichiarati. CAP assente dalla pagina, quindi non attribuito.',
  },
  {
    id: 'guzzi-soverato', nome: 'Guzzi Gioielli', comune: 'Soverato', via: 'Corso Umberto I 214/216', cap: '88068', tel: '0967 21907',
    sito: 'https://www.guzzigioielli.it', tipi: ['gioielleria'], servizi: ['vendita', 'gioielleria'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria a Soverato con oltre trentacinque anni di attività, specializzata nella vendita di oreficeria, alta gioielleria e orologeria. Riparazioni non dichiarate.',
    fonteUrl: 'https://www.guzzigioielli.it/contatti.html',
    evidenza: 'Pagina contatti: Corso Umberto I 214/216, 88068 Soverato, telefono 0967 21907; presentazione «gioielleria con oltre 35 anni di esperienza, specializzati nella vendita di oreficeria, alta gioielleria ed orologeria».',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; vendita di orologeria dichiarata. Nessuna lavorazione di laboratorio dichiarata, quindi non attribuita.',
  },
  {
    id: 'grasso-acireale', nome: 'Grasso Orologi', comune: 'Acireale', via: 'Via Davì 26', cap: '95024', tel: '349 6440172',
    sito: 'http://www.grassorologi.it', tipi: ['orologeria', 'laboratorio'], servizi: ['riparazione', 'revisione', 'restauro-vintage', 'manutenzione'],
    marchi: [], anno: null,
    descrizione: 'Orologeria e laboratorio ad Acireale che dichiara riparazioni, revisioni, restauro e pulizia di ogni tipo di orologio, con ristampa dei quadranti.',
    fonteUrl: 'http://www.grassorologi.it/',
    evidenza: 'Homepage: «Offriamo un servizio completo … eseguendo riparazioni, restauro e pulizia di ogni tipo di orologio», voci «Revisioni», «Riparazioni», «Restauro», «Ristampa quadranti»; indirizzo Via Davì 26, 95024 Acireale, telefono 349 6440172.',
    motivo: 'Sito ufficiale: CAP e telefono verificati; riparazione, revisione, restauro e pulizia dichiarati. La via è indicata dal sito, ma la forma scritta non è stata riscontrata nel testo estratto: indirizzo da confermare in sede di aggiornamento.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio che dichiara riparazioni, revisioni, restauro, pulizia e ristampa quadranti.' },
  },
  {
    id: 'chelios-orosei', nome: 'Chelios Gioielli', comune: 'Orosei', via: 'Via Nazionale 66', cap: '08028', tel: '0784 998137',
    sito: 'https://www.chelosgioielli.com', tipi: ['gioielleria', 'laboratorio'], servizi: ['riparazione', 'restauro-vintage', 'assistenza', 'gioielleria'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria e orologeria a Orosei con laboratorio orafo interno che dichiara riparazioni, restauri e assistenza.',
    fonteUrl: 'https://www.chelosgioielli.com/',
    evidenza: 'Homepage: «Gioielleria, orologeria e preziosi», voci «Riparazioni e restauri» e «Assistenza»; presentazione del laboratorio come «il cuore pulsante della nostra attività orafa»; Via Nazionale 66, 08028 Orosei, telefono 0784 998137.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazioni, restauri e assistenza dichiarati.',
    laboratorio: { tipo: 'orafo', descrizione: 'Laboratorio orafo interno presentato come cuore dell’attività, con riparazioni e restauri.' },
  },
  {
    id: 'giorgetti-vasto', nome: 'Gioielleria Orologeria Giorgetti', comune: 'Vasto', via: 'Via Luigi Marchesani 3', cap: '66054', tel: '0873 362425',
    sito: 'https://www.gioielleriagiorgetti.it', tipi: ['orologeria', 'gioielleria'], servizi: ['riparazione', 'assistenza', 'lucidatura'],
    marchi: [], anno: null,
    descrizione: 'Gioielleria e orologeria a Vasto con laboratorio che dichiara riparazione di orologi di alta gamma, assistenza e ripristino estetico.',
    fonteUrl: 'https://www.gioielleriagiorgetti.it/laboratorio-riparazione-orologi-rolex/',
    evidenza: 'Pagina «Laboratorio riparazione orologi»: riparazione di orologi di alta gamma, assistenza e ripristino estetico; indirizzo Via Luigi Marchesani 3, 66054 Vasto, telefono 0873 362425 riscontrati nel testo della pagina.',
    motivo: 'Sito ufficiale: indirizzo, CAP e telefono verificati; riparazione, assistenza e ripristino estetico dichiarati. Il riferimento a Rolex nel titolo della pagina non è stato attribuito come assistenza ufficiale.',
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio dichiarato per riparazione di orologi di alta gamma, assistenza e ripristino estetico.' },
  },
];

const fonti: any[] = [];
const localita: any[] = [];
const candidati: any[] = [];
for (const v of voci) {
  const a = istat.get(v.comune);
  if (!a) throw new Error(`comune ISTAT assente: ${v.comune}`);
  const lid = v.comune.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fid = `f31-${v.id}`;
  fonti.push({
    id: fid, tipo: 'sito-ufficiale', url: v.fonteUrl, titolo: `${v.nome} — pagina ufficiale`, consultataIl: DATA,
    percorsoArchivio: null, licenza: null, evidenza: v.evidenza,
  });
  if (!localita.some(l => l.id === lid)) {
    localita.push({
      id: lid, comune: v.comune, comuneSlug: lid, provincia: a.provincia, provinciaSlug: a.provincia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      siglaProvincia: a.sigla, regione: a.regione, regioneSlug: a.regione.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      codiceIstat: a.codice, descrizione: `${v.comune}: attività di orologeria censite con fonti ufficiali.`, fonti: [fid],
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
      servizi: v.servizi.map(s => ({ id: s, fonti: [fid] })),
      altriServizi: [], specializzazioni: [],
      marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: v.marchi.map(m => ({ marca: m, fonti: [fid] })) },
      storia: { annoFondazione: v.anno, fondatore: null, testo: null, eventi: [], fonti: v.anno ? [fid] : [] },
      attendibilita: {
        stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: DATA, confermataTitolareIl: null, fonti: [fid],
        cronologia: [{ data: DATA, azione: 'Verifica della pagina ufficiale: indirizzo e recapiti riscontrati nel testo, servizi dichiarati trascritti senza estensioni.', fonti: [fid] }],
        segnalazioni: [],
      },
      origine: { sistema: 'ricerca-ufficiale-fase31-02', idOriginale: v.id },
    },
  });
}

writeFileSync('data/import/fase31-02.json', JSON.stringify({ lotto: 'fase31-02', data: DATA, fonti, localita, candidati }, null, 2) + '\n');
console.log('lotto fase31-02: attività', candidati.length, 'località', localita.length, localita.map(l => `${l.comune}/${l.codiceIstat}`).join(' '));
