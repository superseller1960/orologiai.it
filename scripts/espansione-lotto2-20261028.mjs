// Espansione Lotto 2 — 15 nuove schede verificate, 28 ottobre 2026.
// Metodo Fase 11B: ogni claim provato da fonte consultata direttamente;
// autorizzazioni ufficiali solo da locator primari dei marchi (OMEGA, Hamilton, Seiko, Tissot, Longines);
// autodichiarazioni registrate come segnalazioni, mai come qualifiche ufficiali;
// dati non confermati lasciati assenti; candidati insufficientemente documentati esclusi dal registro pubblico.
// Uso: node scripts/espansione-lotto2-20261028.mjs
import fs from 'node:fs';

const file = new URL('../site/data/directory.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const oggi = '2026-10-28';

const nuovaFonte = (id, url, titolo, tipo) => {
  const esistente = d.fonti.find((f) => f.id === id || f.url === url);
  if (esistente) return esistente.id;
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
    nomiPrecedenti: [],
    gruppoId: null,
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    altriServizi: [],
    specializzazioni: [],
    ...spec,
    posizione: { indirizzo: null, cap: null, coordinate: null, fonti: [], ...(spec.posizione ?? {}) },
    contatti: { telefono: null, email: null, sito: null, whatsapp: null, social: [], fonti: [], ...(spec.contatti ?? {}) },
    servizi: spec.servizi ?? [],
    marchi: { ...marchiDefault(), ...(spec.marchi ?? {}) },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [], ...(spec.storia ?? {}) },
    attendibilita: {
      stato: spec.stato ?? 'fonti-verificate',
      raccoltaIl: oggi,
      verificataIl: spec.stato === 'da-verificare' ? null : oggi,
      confermataTitolareIl: null,
      fonti,
      cronologia: [{ data: oggi, azione: spec.nota, fonti }],
      segnalazioni: spec.segnalazioni ?? [],
    },
    origine: { sistema: 'espansione-lotto2-20261028', idOriginale: spec.id },
  };
  delete b.nota;
  delete b.fonti;
  delete b.segnalazioni;
  delete b.stato;
  d.attivita.push(b);
  return b;
};

// ---------- FONTI ----------
const F = {};
// Orologeria Nozzetti — Mazara del Vallo (TP)
F.nozzSito = nuovaFonte('e12-orologerianozzetti-wordpress-com', 'https://orologerianozzetti.wordpress.com/', 'Sito Orologeria Nozzetti — Mazara del Vallo', 'sito-ufficiale');

// Cellini Gioielli — Erice (TP)
F.cellCont = nuovaFonte('e12-www-gioielleriacellini-com-contattaci', 'https://www.gioielleriacellini.com/contattaci.php', 'Sito Cellini Gioielli — contatti', 'sito-ufficiale');
F.cellHome = nuovaFonte('e12-www-gioielleriacellini-com', 'https://www.gioielleriacellini.com/', 'Sito Cellini Gioielli — home', 'sito-ufficiale');
F.cellGal = nuovaFonte('e12-www-gioielleriacellini-com-gallery', 'https://www.gioielleriacellini.com/gallery.php', 'Sito Cellini Gioielli — gallery (dati societari a piè di pagina)', 'sito-ufficiale');

// Gioielleria Amantia & Figli — Trapani (TP)
F.amaLon = nuovaFonte('e12-www-longines-com-trapani-amantia', 'https://www.longines.com/it/store/id/gioielleria-amantia-figli-srl-trapani-1719680', 'Longines — scheda Gioielleria Amantia & Figli Srl, Trapani', 'marchio-ufficiale');

// Aurum Gioielleria — Crotone (KR)
F.aurChi = nuovaFonte('e12-www-aurumgioielleria-com-chi-siamo', 'https://www.aurumgioielleria.com/chi-siamo/', 'Sito Aurum Gioielleria — chi siamo', 'sito-ufficiale');
F.aurCon = nuovaFonte('e12-www-aurumgioielleria-com-contatti', 'https://www.aurumgioielleria.com/contatti/', 'Sito Aurum Gioielleria — contatti', 'sito-ufficiale');
F.aurSei = nuovaFonte('e12-www-seikowatches-com-crotone-aurum', 'https://www.seikowatches.com/it-it/stores/28372-1', 'Seiko — scheda Seiko Premium Retailer Aurum Gioielleria, Crotone', 'marchio-ufficiale');
F.aurTis = nuovaFonte('e12-www-tissotwatches-com-crotone-aurum', 'https://www.tissotwatches.com/it-it/store/aurum-di-castelliti-marcello/a1vNN0000020MfSYAU', 'Tissot — scheda rivenditore Aurum di Castelliti Marcello, Crotone', 'marchio-ufficiale');

// La Macchina del Tempo — San Benedetto del Tronto (AP)
F.macOm = nuovaFonte('e12-www-omegawatches-com-store-1000813', 'https://www.omegawatches.com/store/storedetails/1000813', 'OMEGA — Service Center La Macchina del Tempo, San Benedetto del Tronto', 'marchio-ufficiale');

// Orologeria Del Borgo — Rimini (RN)
F.dbCon = nuovaFonte('e12-orologeriadelborgo-com-contatti', 'https://orologeriadelborgo.com/contatti/', 'Sito Orologeria Del Borgo — contatti', 'sito-ufficiale');
F.dbChi = nuovaFonte('e12-orologeriadelborgo-com-chi-siamo', 'https://orologeriadelborgo.com/chi-siamo/', 'Sito Orologeria Del Borgo — chi siamo', 'sito-ufficiale');
F.dbVen = nuovaFonte('e12-orologeriadelborgo-com-vendita', 'https://orologeriadelborgo.com/vendita-orologi/', 'Sito Orologeria Del Borgo — vendita orologi', 'sito-ufficiale');

// Cenciarini Gioielleria — Riccione (RN)
F.cenCon = nuovaFonte('e12-cenciarini-net-contatti', 'https://cenciarini.net/pages/contatti', 'Sito Cenciarini Gioielleria — contatti', 'sito-ufficiale');
F.cenChi = nuovaFonte('e12-cenciarini-net-chi-siamo', 'https://cenciarini.net/pages/chi-siamo', 'Sito Cenciarini Gioielleria — chi siamo', 'sito-ufficiale');
F.cenLab = nuovaFonte('e12-cenciarini-net-laboratorio', 'https://cenciarini.net/pages/laboratorio', 'Sito Cenciarini Gioielleria — laboratorio', 'sito-ufficiale');
F.cenRip = nuovaFonte('e12-cenciarini-net-riparazioni', 'https://cenciarini.net/pages/riparazioni-assistenza', 'Sito Cenciarini Gioielleria — riparazioni e assistenza', 'sito-ufficiale');

// Oreficeria Superti — Castelleone (CR)
F.supHome = nuovaFonte('e12-oreficeriasuperti-com', 'https://oreficeriasuperti.com/', 'Sito Oreficeria Superti — home', 'sito-ufficiale');
F.supSrv = nuovaFonte('e12-oreficeriasuperti-com-servizi', 'https://oreficeriasuperti.com/servizi/', 'Sito Oreficeria Superti — servizi', 'sito-ufficiale');

// Centro Tecnico Orologeria — Desio (MB)
F.ctdHome = nuovaFonte('e12-ctodesio-wordpress-com', 'https://ctodesio.wordpress.com/', 'Sito Centro Tecnico Orologeria — Desio', 'sito-ufficiale');
F.ctdChi = nuovaFonte('e12-ctodesio-wordpress-com-chi-siamo', 'https://ctodesio.wordpress.com/oreficeria/', 'Sito Centro Tecnico Orologeria — chi siamo', 'sito-ufficiale');

// Piccinini Orologiai — Mantova (MN)
F.picHome = nuovaFonte('e12-www-piccininiorologiai-it', 'https://www.piccininiorologiai.it/', 'Sito Piccinini Orologiai — home', 'sito-ufficiale');
F.picMar = nuovaFonte('e12-www-piccininiorologiai-it-marchi', 'https://www.piccininiorologiai.it/marchi/', 'Sito Piccinini Orologiai — marchi', 'sito-ufficiale');
F.picRlx = nuovaFonte('e12-www-piccininiorologiai-it-rolex', 'https://www.piccininiorologiai.it/scopri-rolex/', 'Sito Piccinini Orologiai — pagina Rolex', 'sito-ufficiale');
F.picPri = nuovaFonte('e12-www-piccininiorologiai-it-privacy', 'https://www.piccininiorologiai.it/privacy-policy/', 'Sito Piccinini Orologiai — privacy policy (dati societari)', 'sito-ufficiale');
F.picCon = nuovaFonte('e12-www-piccininiorologiai-it-contatti', 'https://www.piccininiorologiai.it/contatti/', 'Sito Piccinini Orologiai — contatti', 'sito-ufficiale');

// Officina del Tempo di Alessandro — Olbia (SS, ex OT)
F.offHam = nuovaFonte('e12-www-hamiltonwatch-com-olbia-officina-del-tempo', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/sardegna/olbia/officina-del-tempo-di-alessandro', 'Hamilton — scheda centro assistenza Officina del Tempo di Alessandro, Olbia', 'marchio-ufficiale');
F.offSito = nuovaFonte('e12-www-officinadeltempoolbia-com', 'https://www.officinadeltempoolbia.com/', 'Sito Officina del Tempo Olbia', 'sito-ufficiale');

// Gioielleria Marrocu — Villacidro (SU)
F.marSito = nuovaFonte('e12-www-gioielleriavillacidro-it', 'https://www.gioielleriavillacidro.it/', 'Sito Gioielleria Marrocu — Villacidro', 'sito-ufficiale');

// Boglietti Gioielliere — Biella (BI)
F.bogLon = nuovaFonte('e12-www-longines-com-biella-boglietti', 'https://www.longines.com/it/store/id/boglietti-gioielli-srl-biella-1592296', 'Longines — scheda Boglietti Gioielli Srl, Biella', 'marchio-ufficiale');
F.bogCon = nuovaFonte('e12-www-bogliettigioielliere-com-contatti', 'https://www.bogliettigioielliere.com/contatti/', 'Sito Boglietti Gioielliere — contatti', 'sito-ufficiale');
F.bogRip = nuovaFonte('e12-www-bogliettigioielliere-com-riparazioni', 'https://www.bogliettigioielliere.com/2021/10/15/boglietti-gioielleria-a-biella/', 'Sito Boglietti Gioielliere — laboratorio e riparazioni', 'sito-ufficiale');
F.bogSito = nuovaFonte('e12-www-bogliettigioielliere-com', 'https://www.bogliettigioielliere.com/', 'Sito Boglietti Gioielliere — home (marchi e storia)', 'sito-ufficiale');

// Laboratorio Orologeria Maicol — Oristano (OR)
F.maiRet = nuovaFonte('e12-www-reteimprese-it-oristano-maicol', 'https://www.reteimprese.it/orologerie/oristano', 'Reteimprese — Laboratorio Orologeria Maicol, Oristano', 'directory');
F.maiCle = nuovaFonte('e12-www-laclessidra1945-it-centri-assistenza', 'https://www.laclessidra1945.it/centri-assistenza/', 'La Clessidra — elenco laboratori di riparazione orologi (Pintus Maicol)', 'stampa');

// La Bottega del Tempo — Catanzaro (CZ)
F.botCat = nuovaFonte('e12-www-catanzarocentro-it-bottega-del-tempo', 'http://www.catanzarocentro.it/index.php?page=news&id=1466', 'Area Teatro / CatanzaroCentro — apertura del laboratorio La Bottega del Tempo', 'stampa');

// ---------- LOCALITÀ ----------
creaLocalita({ id: 'mazara-del-vallo', comune: 'Mazara del Vallo', comuneSlug: 'mazara-del-vallo', provincia: 'Trapani', provinciaSlug: 'trapani', siglaProvincia: 'TP', regione: 'Sicilia', regioneSlug: 'sicilia', descrizione: 'Mazara del Vallo: orologeria con laboratorio di riparazione e restauro censita con fonti ufficiali (Orologeria Nozzetti).', fonti: [F.nozzSito] });
creaLocalita({ id: 'erice', comune: 'Erice', comuneSlug: 'erice', provincia: 'Trapani', provinciaSlug: 'trapani', siglaProvincia: 'TP', regione: 'Sicilia', regioneSlug: 'sicilia', descrizione: 'Erice: gioielleria con orologeria e riparazione/restauro di orologi censita con fonti ufficiali (Cellini Gioielli, nella frazione Casa Santa).', fonti: [F.cellCont] });
creaLocalita({ id: 'crotone', comune: 'Crotone', comuneSlug: 'crotone', provincia: 'Crotone', provinciaSlug: 'crotone', siglaProvincia: 'KR', regione: 'Calabria', regioneSlug: 'calabria', descrizione: 'Crotone: gioielleria con laboratorio interno, Seiko Premium Retailer e rivenditore Tissot, censita con fonti ufficiali (Aurum Gioielleria).', fonti: [F.aurCon] });
creaLocalita({ id: 'san-benedetto-del-tronto', comune: 'San Benedetto del Tronto', comuneSlug: 'san-benedetto-del-tronto', provincia: 'Ascoli Piceno', provinciaSlug: 'ascoli-piceno', siglaProvincia: 'AP', regione: 'Marche', regioneSlug: 'marche', descrizione: 'San Benedetto del Tronto: Service Center OMEGA e orologeria censiti con fonti ufficiali dei marchi (La Macchina del Tempo).', fonti: [F.macOm] });
creaLocalita({ id: 'riccione', comune: 'Riccione', comuneSlug: 'riccione', provincia: 'Rimini', provinciaSlug: 'rimini', siglaProvincia: 'RN', regione: 'Emilia-Romagna', regioneSlug: 'emilia-romagna', descrizione: 'Riccione: gioielleria con laboratorio di riparazione e revisione orologi censita con fonti ufficiali (Cenciarini Gioielleria).', fonti: [F.cenLab] });
creaLocalita({ id: 'castelleone', comune: 'Castelleone', comuneSlug: 'castelleone', provincia: 'Cremona', provinciaSlug: 'cremona', siglaProvincia: 'CR', regione: 'Lombardia', regioneSlug: 'lombardia', descrizione: 'Castelleone: oreficeria storica con laboratorio di riparazione e restauro orologi censita con fonti ufficiali (Oreficeria Superti).', fonti: [F.supHome] });
creaLocalita({ id: 'desio', comune: 'Desio', comuneSlug: 'desio', provincia: 'Monza e della Brianza', provinciaSlug: 'monza-e-della-brianza', siglaProvincia: 'MB', regione: 'Lombardia', regioneSlug: 'lombardia', descrizione: 'Desio: laboratorio tecnico di riparazione, revisione e pendoleria censito con fonti ufficiali (Centro Tecnico Orologeria).', fonti: [F.ctdHome] });
creaLocalita({ id: 'villacidro', comune: 'Villacidro', comuneSlug: 'villacidro', provincia: 'Sud Sardegna', provinciaSlug: 'sud-sardegna', siglaProvincia: 'SU', regione: 'Sardegna', regioneSlug: 'sardegna', descrizione: 'Villacidro: gioielleria con laboratorio di assistenza e riparazione orologi censita con fonti ufficiali (Gioielleria Marrocu).', fonti: [F.marSito] });
creaLocalita({ id: 'catanzaro', comune: 'Catanzaro', comuneSlug: 'catanzaro', provincia: 'Catanzaro', provinciaSlug: 'catanzaro', siglaProvincia: 'CZ', regione: 'Calabria', regioneSlug: 'calabria', descrizione: 'Catanzaro: laboratorio di riparazione orologi censito con fonti giornalistiche locali (La Bottega del Tempo).', fonti: [F.botCat] });

// ---------- NUOVE SCHEDE ----------
crea({
  id: 'orologeria-nozzetti-mazara-del-vallo', slug: 'orologeria-nozzetti-mazara-del-vallo', nome: 'Orologeria Nozzetti',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'mazara-del-vallo',
  descrizione: 'Orologeria Nozzetti in Corso Vittorio Veneto 55 a Mazara del Vallo è attiva dal 1982 e condotta da due generazioni: riparazione e restauro di orologi antichi e moderni, vendita di segnatempo di vari marchi e lavorazioni di saldatura laser su oggetti.',
  posizione: { indirizzo: 'Corso Vittorio Veneto, 55', fonti: [F.nozzSito] },
  contatti: { telefono: '328 2521076', email: 'orologerianozzetti@hotmail.com', sito: 'https://orologerianozzetti.wordpress.com/', fonti: [F.nozzSito] },
  servizi: serv(['riparazione', 'vendita'], [F.nozzSito]),
  specializzazioni: [{ id: 'antichi', fonti: [F.nozzSito] }],
  altriServizi: [{ nome: 'Restauro di orologi antichi e moderni', fonti: [F.nozzSito] }, { nome: 'Saldatura laser su oggetti', fonti: [F.nozzSito] }],
  storia: {
    annoFondazione: 1982,
    testo: 'Il sito dell’attività dichiara una specializzazione «sin dal 1982» e la conduzione da parte di due generazioni.',
    eventi: [{ data: '1982', descrizione: 'Avvio dell’attività specializzata secondo il sito dell’orologeria.', fonti: [F.nozzSito] }],
    fonti: [F.nozzSito],
  },
  fonti: [F.nozzSito],
  segnalazioni: [
    segn('Anno di avvio 1982 e due generazioni autodichiarati sul sito dell’attività.'),
    segn('CAP non riportato dalla pagina consultata: campo lasciato assente.'),
  ],
  nota: 'Espansione lotto 2: identità, sede, recapiti, servizi e storia dichiarata dal sito ufficiale consultato direttamente.',
});

crea({
  id: 'cellini-gioielli-erice', slug: 'cellini-gioielli-erice', nome: 'Cellini Gioielli',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'erice',
  descrizione: 'Cellini Gioielli in Via Cesarò 60/62 a Erice (frazione Casa Santa) nasce nel 1989 come gioielleria, oreficeria e orologeria: riparazioni, restauri e costruzione di orologi antichi e moderni, con vendita di marchi quali Paul Picot, Philip Watch e Ti Sento Milano.',
  posizione: { indirizzo: 'Via Cesarò, 60/62', cap: '91016', fonti: [F.cellCont, F.cellGal] },
  contatti: { telefono: '0923 568651', email: 'cellini.gioielli@libero.it', sito: 'https://www.gioielleriacellini.com/', fonti: [F.cellCont] },
  servizi: serv(['riparazione', 'vendita', 'gioielleria'], [F.cellHome]),
  specializzazioni: [{ id: 'antichi', fonti: [F.cellHome] }],
  altriServizi: [{ nome: 'Restauro e costruzione di orologi antichi e moderni', fonti: [F.cellHome] }],
  marchi: { venduti: brand(['Donna Oro', 'Paul Picot', 'Philip Watch', 'Rubinia Gioielli', 'Ti Sento Milano', 'Comete', 'Ambrosia', 'Zancan'], [F.cellHome]) },
  storia: {
    annoFondazione: 1989,
    testo: 'Il sito ufficiale presenta l’attività nata nel 1989 come gioielleria, oreficeria e orologeria.',
    eventi: [{ data: '1989', descrizione: 'Nascita dell’attività a Erice.', fonti: [F.cellHome] }],
    fonti: [F.cellHome],
  },
  fonti: [F.cellCont, F.cellHome, F.cellGal],
  segnalazioni: [segn('Marchi riparati non specificati: le riparazioni sono dichiarate in generale, senza elenco per marca e senza autorizzazioni ufficiali.')],
  nota: 'Espansione lotto 2: indirizzo, CAP e recapiti dalle pagine ufficiali (contatti e piè di pagina); servizi orologiai, marchi venduti e fondazione 1989 dal sito. Nessuna autorizzazione di marchio attribuita.',
});

crea({
  id: 'gioielleria-amantia-trapani', slug: 'gioielleria-amantia-trapani', nome: 'Gioielleria Amantia & Figli Srl',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'trapani',
  descrizione: 'Gioielleria Amantia & Figli Srl in Via G.B. Fardella 86/88 a Trapani è boutique Longines documentata dal locator ufficiale del marchio: vendita di orologi con servizi di manutenzione e sostituzione del cinturino secondo gli standard Longines.',
  posizione: { indirizzo: 'Via G.B. Fardella, 86/88', cap: '91100', fonti: [F.amaLon] },
  contatti: { telefono: '0923 881783', email: 'info@amantia.it', fonti: [F.amaLon] },
  orari: {
    giorni: [
      { giorno: 1, intervalli: [{ apertura: '16:00', chiusura: '20:00' }] },
      { giorno: 2, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '20:00' }] },
      { giorno: 3, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '20:00' }] },
      { giorno: 4, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '20:00' }] },
      { giorno: 5, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '20:00' }] },
      { giorno: 6, intervalli: [{ apertura: '09:30', chiusura: '13:00' }, { apertura: '16:00', chiusura: '20:00' }] },
    ],
    chiusure: ['Domenica'], verificatiIl: oggi, fonti: [F.amaLon],
  },
  servizi: serv(['vendita', 'manutenzione', 'cinturini', 'gioielleria'], [F.amaLon]),
  marchi: { venduti: brand(['Longines'], [F.amaLon]), rivenditaUfficiale: brand(['Longines'], [F.amaLon]) },
  fonti: [F.amaLon],
  segnalazioni: [segn('La scheda Longines documenta vendita e manutenzione/cinturino del marchio: nessuna riparazione generica né assistenza tecnica autorizzata oltre a quanto espressamente indicato.')],
  nota: 'Espansione lotto 2: identità, sede, recapiti, orari, rivendita ufficiale Longines e servizi di manutenzione dalla scheda specifica del produttore (marchio-ufficiale).',
});

crea({
  id: 'aurum-gioielleria-crotone', slug: 'aurum-gioielleria-crotone', nome: 'Aurum Gioielleria',
  nomiPrecedenti: ['Aurum di Castelliti Marcello', 'Aurum Castelliti'],
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'crotone',
  descrizione: 'Aurum Gioielleria di Marcello Castelliti in Corso Mazzini 83 a Crotone dispone di laboratorio interno per l’assistenza e la riparazione di oreficeria e orologeria; i locator ufficiali la qualificano Seiko Premium Retailer e rivenditore autorizzato Tissot.',
  posizione: { indirizzo: 'Corso Giuseppe Mazzini, 83', cap: '88900', fonti: [F.aurCon, F.aurSei] },
  contatti: { telefono: '0962 29160', email: 'info@aurumgioielleria.com', sito: 'https://www.aurumgioielleria.com/', fonti: [F.aurCon] },
  servizi: serv(['riparazione', 'assistenza', 'manutenzione', 'vendita', 'gioielleria'], [F.aurChi]),
  marchi: {
    venduti: brand(['Seiko', 'Tissot'], [F.aurSei, F.aurTis]),
    rivenditaUfficiale: brand(['Seiko', 'Tissot'], [F.aurSei, F.aurTis]),
  },
  storia: {
    testo: 'Il sito dell’attività dichiara un’esperienza «da più di trent’anni», senza indicare l’anno di fondazione.',
    eventi: [],
    fonti: [F.aurChi],
  },
  fonti: [F.aurChi, F.aurCon, F.aurSei, F.aurTis],
  segnalazioni: [
    segn('I locator Seiko e Tissot documentano la rivendita ufficiale, non l’assistenza tecnica: nessuna autorizzazione di riparazione attribuita.'),
    segn('Anno di fondazione non indicato dalle fonti: il sito parla genericamente di «più di trent’anni».'),
  ],
  nota: 'Espansione lotto 2: laboratorio interno e storia dichiarata dal sito ufficiale; rivendite ufficiali Seiko (Premium Retailer) e Tissot dai locator specifici dei due produttori, consultati direttamente.',
});

crea({
  id: 'la-macchina-del-tempo-san-benedetto', slug: 'la-macchina-del-tempo-san-benedetto', nome: 'La Macchina del Tempo — San Benedetto del Tronto',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'san-benedetto-del-tronto',
  descrizione: 'La Macchina del Tempo in Via Francesco Crispi 114/118 a San Benedetto del Tronto è Service Center OMEGA documentato dal locator ufficiale del marchio: manutenzione, diagnostica completa, prova di impermeabilità, cambio batteria e regolazione della marcia degli orologi meccanici.',
  posizione: { indirizzo: 'Via Francesco Crispi, 114/118', cap: '63039', fonti: [F.macOm] },
  contatti: { telefono: '0735 587201', fonti: [F.macOm] },
  servizi: serv(['assistenza', 'manutenzione', 'batterie', 'cinturini'], [F.macOm]),
  altriServizi: [
    { nome: 'Diagnostica completa e prova di impermeabilità', fonti: [F.macOm] },
    { nome: 'Regolazione della marcia per orologi meccanici', fonti: [F.macOm] },
    { nome: 'Regolazione bracciali e sostituzione di bracciali e cinturini', fonti: [F.macOm] },
  ],
  marchi: {
    assistenzaUfficiale: brand(['Omega'], [F.macOm]),
    riparati: brand(['Omega'], [F.macOm]),
  },
  fonti: [F.macOm],
  segnalazioni: [
    segn('CAP discordante: 63039 dalla scheda OMEGA (fonte primaria adottata) contro 63074 in una directory generica.'),
    segn('La scheda OMEGA qualifica la sede come Service Center e non documenta la vendita di orologi: nessun servizio di vendita attribuito.'),
  ],
  nota: 'Espansione lotto 2: identità, sede, recapiti, qualifica di centro assistenza ufficiale OMEGA e servizi tecnici dalla scheda specifica del produttore (marchio-ufficiale).',
});

crea({
  id: 'orologeria-del-borgo-rimini', slug: 'orologeria-del-borgo-rimini', nome: 'Orologeria Del Borgo',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'rimini',
  descrizione: 'Orologeria Del Borgo in Piazzale Francesco Vannoni 4 a Rimini gestisce un laboratorio artigianale per riparazioni e revisioni di orologi da polso — inclusi vintage, da collezione e d’epoca — con sostituzione di pile, cinturini e componenti; il negozio si occupa anche di vendita.',
  posizione: { indirizzo: 'Piazzale Francesco Vannoni, 4', cap: '47921', fonti: [F.dbCon] },
  contatti: { telefono: '0541 52831', email: 'orologeriadelborgo@gmail.com', sito: 'https://orologeriadelborgo.com/', fonti: [F.dbCon] },
  servizi: serv(['riparazione', 'revisione', 'batterie', 'cinturini', 'vendita'], [F.dbChi, F.dbVen]),
  specializzazioni: [{ id: 'vintage', fonti: [F.dbChi] }],
  fonti: [F.dbCon, F.dbChi, F.dbVen],
  segnalazioni: [segn('Il sito si definisce rivenditore ufficiale di marchi di lusso senza nominarli nella pagina consultata: nessuna rivendita ufficiale attribuita. Anno di fondazione non indicato (solo «numerosi anni» di esperienza).')],
  nota: 'Espansione lotto 2: identità, sede e recapiti dalla pagina contatti; laboratorio artigianale, riparazioni/revisioni e specializzazione vintage dalla pagina chi siamo; vendita dalla pagina dedicata. Sede distinta da Orologeria Casadei, già censita a Rimini.',
});

crea({
  id: 'cenciarini-gioielleria-riccione', slug: 'cenciarini-gioielleria-riccione', nome: 'Cenciarini Gioielleria',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'riccione',
  descrizione: 'Cenciarini Gioielleria in Viale Ceccarini 16 a Riccione nasce nel 1979 rilevando la gioielleria Gobbi, attiva dal 1946: laboratorio interno di riparazione e revisione con interventi su orologi antichi, moderni e da tasca, ricostruzione di casse, prove di impermeabilità, lucidatura e cinturini su misura.',
  posizione: { indirizzo: 'Viale Ceccarini, 16', cap: '47838', fonti: [F.cenCon] },
  contatti: { telefono: '0541 692712', whatsapp: '+393486147645', email: 'info@cenciarini.net', sito: 'https://cenciarini.net/', fonti: [F.cenCon] },
  servizi: serv(['riparazione', 'revisione', 'orologi-tasca', 'batterie', 'cinturini', 'lucidatura', 'vendita', 'gioielleria'], [F.cenLab, F.cenRip]),
  specializzazioni: [{ id: 'antichi', fonti: [F.cenLab] }],
  altriServizi: [{ nome: 'Prova di impermeabilità', fonti: [F.cenRip] }, { nome: 'Ricostruzione di casse danneggiate', fonti: [F.cenLab] }, { nome: 'Cinturini su misura', fonti: [F.cenRip] }],
  marchi: {
    venduti: brand(['Rolex', 'Cartier', 'Patek Philippe', 'TAG Heuer', 'Jaeger-LeCoultre', 'Omega', 'IWC', 'Panerai', 'Tudor', 'Hublot', 'Audemars Piguet', 'Eberhard'], [F.cenChi]),
    riparati: brand(['Rolex', 'Cartier', 'Omega', 'IWC', 'Panerai', 'Breitling'], [F.cenRip]),
  },
  storia: {
    annoFondazione: 1979,
    testo: 'L’attività fu fondata nel 1979 con il rilevamento della gioielleria Gobbi, già attiva nella sede dal 1946.',
    eventi: [
      { data: '1946', descrizione: 'Attività della gioielleria Gobbi nella sede di Viale Ceccarini.', fonti: [F.cenChi] },
      { data: '1979', descrizione: 'Fondazione di Cenciarini Gioielleria con il rilevamento della gioielleria Gobbi.', fonti: [F.cenChi] },
    ],
    fonti: [F.cenChi],
  },
  fonti: [F.cenCon, F.cenChi, F.cenLab, F.cenRip],
  segnalazioni: [
    segn('Il sito si dichiara concessionaria Nivada Grenchen: autodichiarazione non verificata con locator del produttore, non inserita fra le rivendite ufficiali.'),
    segn('I marchi riparati sono dichiarazioni dell’attività, che si presenta non affiliata ai marchi commercializzati: nessuna assistenza ufficiale attribuita.'),
  ],
  nota: 'Espansione lotto 2: indirizzo e recapiti dalla pagina contatti; laboratorio e interventi tecnici dalle pagine laboratorio e riparazioni; storia 1979/1946, marchi e servizi dalle pagine ufficiali consultate direttamente.',
});

crea({
  id: 'oreficeria-superti-castelleone', slug: 'oreficeria-superti-castelleone', nome: 'Oreficeria Superti',
  nomiPrecedenti: ['Orologeria e Oreficeria Superti'],
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'castelleone',
  descrizione: 'Oreficeria Superti in Via Roma 26 a Castelleone è bottega fondata nel 1960 da Anna e Taddeo Superti e oggi condotta dalle figlie Elena e Giuliana: laboratorio interno per la riparazione e il restauro di orologi, anche antichi, con vendita di orologi e gioielli.',
  posizione: { indirizzo: 'Via Roma, 26', cap: '26012', fonti: [F.supHome] },
  contatti: { telefono: '0374 58358', email: 'supeelena3@gmail.com', sito: 'https://oreficeriasuperti.com/', fonti: [F.supHome] },
  servizi: serv(['riparazione', 'vendita', 'gioielleria'], [F.supSrv, F.supHome]),
  specializzazioni: [{ id: 'antichi', fonti: [F.supSrv] }],
  altriServizi: [{ nome: 'Restauro di orologi, anche antichi', fonti: [F.supSrv] }],
  marchi: { venduti: brand(['Bulova', 'Breil', 'Quaglia Gioielli', 'Silvia Kelly'], [F.supHome]) },
  storia: {
    annoFondazione: 1960, fondatore: 'Anna e Taddeo Superti',
    testo: 'Il negozio fu fondato nel 1960 da Anna e Taddeo Superti e passò poi alle figlie Elena e Giuliana.',
    eventi: [{ data: '1960', descrizione: 'Fondazione del negozio da parte di Anna e Taddeo Superti.', fonti: [F.supHome] }],
    fonti: [F.supHome],
  },
  fonti: [F.supHome, F.supSrv],
  segnalazioni: [segn('Marchi riparati non elencati: il sito dichiara riparazioni di orologi di qualsiasi tipo senza distinzioni per marca e senza autorizzazioni ufficiali.')],
  nota: 'Espansione lotto 2: identità, sede, recapiti, laboratorio e storia 1960 dalle pagine ufficiali; riparazione e restauro dalla pagina servizi; marchi in vendita dalla home.',
});

crea({
  id: 'centro-tecnico-orologeria-desio', slug: 'centro-tecnico-orologeria-desio', nome: 'Centro Tecnico Orologeria',
  tipi: ['laboratorio', 'orologeria'], localitaId: 'desio',
  descrizione: 'Centro Tecnico Orologeria in Via Garibaldi 183 a Desio è laboratorio di riparazione e revisione completa di orologi: cambio pile e cinturini, messa a misura bracciali, test di impermeabilità, revisione di orologi antichi, riparazione di pendoli, lucidatura e sostituzione vetri.',
  posizione: { indirizzo: 'Via Garibaldi, 183', cap: '20832', fonti: [F.ctdHome] },
  contatti: { telefono: '348 5537219', email: 'centrotecnicoorologeria@gmail.com', sito: 'https://ctodesio.wordpress.com/', fonti: [F.ctdHome] },
  servizi: serv(['riparazione', 'revisione', 'batterie', 'cinturini', 'pendoleria', 'lucidatura'], [F.ctdHome]),
  specializzazioni: [{ id: 'antichi', fonti: [F.ctdHome] }],
  altriServizi: [
    { nome: 'Messa a misura bracciali', fonti: [F.ctdHome] },
    { nome: 'Test di impermeabilità', fonti: [F.ctdHome] },
    { nome: 'Sostituzione vetri', fonti: [F.ctdHome] },
  ],
  marchi: { riparati: brand(['Rolex', 'Omega', 'Cartier', 'Breitling', 'Longines', 'Tissot', 'Citizen', 'Seiko'], [F.ctdChi]) },
  storia: {
    testo: 'I titolari hanno frequentato nel 2007 la scuola di orologeria C.A.P.A.C. e hanno poi aperto il laboratorio a Desio.',
    eventi: [{ data: '2007', descrizione: 'Formazione dei titolari presso la scuola di orologeria C.A.P.A.C.', fonti: [F.ctdChi] }],
    fonti: [F.ctdChi],
  },
  fonti: [F.ctdHome, F.ctdChi],
  segnalazioni: [segn('I marchi riparati sono citati dal sito come esempi di interventi su «tutte le marche»: nessuna assistenza ufficiale di marca documentata.')],
  nota: 'Espansione lotto 2: identità, sede, recapiti e servizi tecnici dal sito ufficiale; formazione C.A.P.A.C. 2007 ed esempi di marchi riparati dalla pagina chi siamo.',
});

crea({
  id: 'piccinini-orologiai-mantova', slug: 'piccinini-orologiai-mantova', nome: 'Piccinini Orologiai',
  tipi: ['orologeria', 'gioielleria'], localitaId: 'mantova',
  descrizione: 'Piccinini Orologiai S.r.l., boutique in Piazza Marconi a Mantova, propone orologi Rolex, Tudor, TAG Heuer, Zenith ed Eberhard e offre servizi di riparazione specializzati; il sito racconta una storia aziendale iniziata nel 1936.',
  posizione: { indirizzo: 'Piazza Marconi', fonti: [F.picHome] },
  contatti: { telefono: '+39 0376 222190', email: 'info@piccininiorologiai.it', sito: 'https://www.piccininiorologiai.it/', fonti: [F.picCon, F.picPri] },
  servizi: serv(['vendita', 'riparazione'], [F.picHome]),
  marchi: { venduti: brand(['Rolex', 'Tudor', 'TAG Heuer', 'Zenith', 'Eberhard'], [F.picMar]) },
  storia: {
    annoFondazione: 1936,
    testo: 'Il sito fa risalire la storia aziendale al 1936 e dichiara la rivendita autorizzata Rolex e Tudor dal 1964.',
    eventi: [{ data: '1964', descrizione: 'Inizio della rivendita autorizzata Rolex e Tudor secondo il sito dell’attività.', fonti: [F.picRlx] }],
    fonti: [F.picHome, F.picRlx],
  },
  fonti: [F.picHome, F.picMar, F.picRlx, F.picPri, F.picCon],
  segnalazioni: [
    segn('«Rivenditore autorizzato Rolex e Tudor dal 1964» è un’autodichiarazione del sito: i locator Rolex e Tudor non sono risultati consultabili, nessuna rivendita ufficiale attribuita.'),
    segn('Civico e CAP del punto vendita in Piazza Marconi non riportati dalle pagine ufficiali; la sede societaria (Porto Mantovano, Via Gramsci 1) non coincide con il negozio e non è stata usata come indirizzo della scheda.'),
    segn('Dettagli concreti delle riparazioni non pubblicati: la homepage menziona genericamente «servizi di riparazione specializzati».'),
  ],
  nota: 'Espansione lotto 2: identità, punto vendita e recapiti dalle pagine ufficiali (contatti, privacy policy); marchi commercializzati dalla pagina marchi; storia dichiarata 1936/1964 conservata come autodichiarazione.',
});

crea({
  id: 'officina-del-tempo-olbia', slug: 'officina-del-tempo-olbia', nome: 'Officina del Tempo di Alessandro',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'olbia',
  descrizione: 'Officina del Tempo di Alessandro in Via Mameli 9 a Olbia è centro assistenza ufficiale Hamilton documentato dal locator del marchio, con sostituzione di batterie e cinturini; il sito dell’attività dichiara riparazione di orologi, valutazione di oro e argento e un’attività dal 1946.',
  posizione: { indirizzo: 'Via Mameli, 9', cap: '07026', fonti: [F.offHam] },
  contatti: { telefono: '+39 0789 623806', sito: 'https://www.officinadeltempoolbia.com/', fonti: [F.offHam, F.offSito] },
  servizi: serv(['assistenza', 'batterie', 'cinturini', 'riparazione', 'valutazioni'], [F.offHam, F.offSito]),
  marchi: {
    assistenzaUfficiale: brand(['Hamilton'], [F.offHam]),
    menzionati: brand(['Omega'], [F.offSito]),
  },
  storia: {
    annoFondazione: 1946,
    testo: 'Il sito dell’attività la presenta come laboratorio di riparazione orologi «dal 1946».',
    eventi: [{ data: '1946', descrizione: 'Avvio dell’attività secondo il sito dell’officina.', fonti: [F.offSito] }],
    fonti: [F.offSito],
  },
  fonti: [F.offHam, F.offSito],
  segnalazioni: [
    segn('Il sito si dichiara «centro assistenza certificato Omega»: autodichiarazione non confermata dal locator OMEGA, Omega registrato solo fra i marchi menzionati e non fra le assistenze ufficiali.'),
    segn('Anno di avvio 1946 autodichiarato sul sito dell’attività.'),
  ],
  nota: 'Espansione lotto 2: identità, sede, recapiti e qualifica di centro assistenza ufficiale Hamilton dalla scheda specifica del produttore (marchio-ufficiale); riparazione e valutazioni dal sito ufficiale.',
});

crea({
  id: 'gioielleria-marrocu-villacidro', slug: 'gioielleria-marrocu-villacidro', nome: 'Gioielleria Marrocu',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'villacidro',
  descrizione: 'Gioielleria Marrocu in Piazza Zampillo 5 a Villacidro, con oltre ottant’anni di storia familiare, gestisce un laboratorio specializzato in assistenza e riparazione orologi, cambio batteria e sostituzione cinturini; una seconda sede è nel centro commerciale Sant’Ignazio. Vende orologi Sector, Citizen, Guess, Philip Watch, Tommy Hilfiger e Casio.',
  posizione: { indirizzo: 'Piazza Zampillo, 5', cap: '09039', fonti: [F.marSito] },
  contatti: { telefono: '070 932431', email: 'gioielleriamarrocu@gmail.com', sito: 'https://www.gioielleriavillacidro.it/', fonti: [F.marSito] },
  servizi: serv(['riparazione', 'manutenzione', 'batterie', 'cinturini', 'vendita', 'gioielleria'], [F.marSito]),
  marchi: { venduti: brand(['Sector', 'Citizen', 'Guess', 'Philip Watch', 'Tommy Hilfiger', 'Casio'], [F.marSito]) },
  storia: {
    testo: 'Il sito dichiara oltre ottant’anni di storia familiare, senza indicare l’anno di fondazione.',
    eventi: [],
    fonti: [F.marSito],
  },
  fonti: [F.marSito],
  segnalazioni: [
    segn('Seconda sede dichiarata nel Centro Commerciale Sant’Ignazio (telefono 070 9311129), senza civico: non censita separatamente per mancanza di dati sufficienti.'),
    segn('Anno di fondazione non indicato dalle fonti; revisione di movimenti meccanici e restauro non dichiarati.'),
  ],
  nota: 'Espansione lotto 2: identità, sede principale, recapiti, laboratorio, marchi e storia dichiarata dal sito ufficiale consultato direttamente.',
});

crea({
  id: 'boglietti-gioielliere-biella', slug: 'boglietti-gioielliere-biella', nome: 'Boglietti Gioielliere',
  nomiPrecedenti: ['Boglietti Gioielli Srl', 'Boglietti 1886'],
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'biella',
  descrizione: 'Boglietti Gioielliere, boutique Longines in Via Italia 12 a Biella, dichiara una tradizione dal 1886 e un laboratorio di orologeria per riparazioni e manutenzione; il locator Longines documenta vendita e servizi di manutenzione e sostituzione del cinturino secondo gli standard del marchio.',
  posizione: { indirizzo: 'Via Italia, 12', cap: '13900', fonti: [F.bogLon] },
  contatti: { telefono: '015 2522169', email: 'info@bogliettigioielliere.com', sito: 'https://www.bogliettigioielliere.com/', fonti: [F.bogLon, F.bogCon] },
  orari: {
    giorni: [
      { giorno: 2, intervalli: [{ apertura: '09:00', chiusura: '12:30' }, { apertura: '15:00', chiusura: '19:00' }] },
      { giorno: 3, intervalli: [{ apertura: '09:00', chiusura: '12:30' }, { apertura: '15:00', chiusura: '19:00' }] },
      { giorno: 4, intervalli: [{ apertura: '09:00', chiusura: '12:30' }, { apertura: '15:00', chiusura: '19:00' }] },
      { giorno: 5, intervalli: [{ apertura: '09:00', chiusura: '12:30' }, { apertura: '15:00', chiusura: '19:00' }] },
      { giorno: 6, intervalli: [{ apertura: '09:00', chiusura: '12:30' }, { apertura: '15:00', chiusura: '19:00' }] },
    ],
    chiusure: ['Domenica e lunedì'], verificatiIl: oggi, fonti: [F.bogLon],
  },
  servizi: serv(['vendita', 'riparazione', 'manutenzione', 'cinturini', 'gioielleria'], [F.bogLon, F.bogRip]),
  marchi: {
    venduti: brand(['Longines', 'Tudor', 'Breitling', 'Zenith', 'Breguet', 'TAG Heuer', 'Nomos', 'Garmin'], [F.bogLon, F.bogSito]),
    rivenditaUfficiale: brand(['Longines'], [F.bogLon]),
  },
  storia: {
    annoFondazione: 1886,
    testo: 'Il sito dell’attività si presenta con la data 1886 come origine della tradizione Boglietti.',
    eventi: [{ data: '1886', descrizione: 'Origine della tradizione Boglietti secondo il sito dell’attività.', fonti: [F.bogSito] }],
    fonti: [F.bogSito],
  },
  fonti: [F.bogLon, F.bogCon, F.bogRip, F.bogSito],
  segnalazioni: [
    segn('Indirizzo discordante: «Via Italia 12» dal locator Longines (fonte primaria adottata) contro «Viale Italia 11D/12» nelle pagine del sito dell’attività.'),
    segn('Il sito dichiara il laboratorio «ufficialmente autorizzato dalle Maisons» senza nominarle: autodichiarazione, nessuna assistenza oltre a Longines attribuita.'),
    segn('Data 1886 autodichiarata sul sito; il negozio usato per la scheda è in Biella e non va confuso con altre sedi o insegne Boglietti.'),
  ],
  nota: 'Espansione lotto 2: sede, recapiti, orari e rivendita ufficiale Longines dalla scheda specifica del produttore (marchio-ufficiale); laboratorio e riparazioni dalle pagine del sito; marchi e storia dichiarata dalle pagine ufficiali.',
});

crea({
  id: 'laboratorio-orologeria-maicol-oristano', slug: 'laboratorio-orologeria-maicol-oristano', nome: 'Laboratorio Orologeria Maicol',
  nomiPrecedenti: ['Pintus Maicol Laboratorio Riparazione Orologi'],
  tipi: ['laboratorio', 'orologeria'], localitaId: 'oristano',
  stato: 'da-verificare',
  descrizione: 'Laboratorio Orologeria Maicol di Pintus in Via Tirso 117 a Oristano è indicato dalle fonti di settore come laboratorio di riparazione orologi, con interventi su orologi da polso, da tasca e da muro e sostituzione di batterie. Non risulta consultabile un sito ufficiale dell’attività.',
  posizione: { indirizzo: 'Via Tirso, 117', cap: '09170', fonti: [F.maiRet] },
  contatti: { telefono: '0783 217043', fonti: [F.maiRet] },
  servizi: serv(['riparazione', 'batterie', 'orologi-tasca'], [F.maiCle]),
  altriServizi: [{ nome: 'Interventi su orologi da muro', fonti: [F.maiRet] }],
  fonti: [F.maiRet, F.maiCle],
  segnalazioni: [
    segn('Documentazione indiretta: schede di directory (Reteimprese) ed elenco dei laboratori di riparazione della rivista di settore La Clessidra; sito ufficiale non disponibile e apertura attuale non confermata da fonti primarie. Stato impostato a «da verificare».'),
    segn('Profilo Facebook segnalato ma non leggibile senza autenticazione: non usato come prova.'),
  ],
  nota: 'Espansione lotto 2: identità, sede e telefono da Reteimprese; servizi di riparazione e interventi da La Clessidra (fonte di settore) e dalla scheda directory. Nessun dato inventato; stato di attendibilità conservato come «da verificare».',
});

crea({
  id: 'la-bottega-del-tempo-catanzaro', slug: 'la-bottega-del-tempo-catanzaro', nome: 'La Bottega del Tempo Orologeria',
  tipi: ['laboratorio', 'orologeria'], localitaId: 'catanzaro',
  stato: 'da-verificare',
  descrizione: 'La Bottega del Tempo in Via Poerio 3 a Catanzaro è il laboratorio di Antonio Torchia, aperto nel 2021 proseguendo l’esperienza familiare del padre orologiaio dal 1970: riparazione di circuiti e rotelle, sostituzione di batterie e cinturini, interventi su orologi moderni e d’epoca, sveglie e orologi da muro.',
  posizione: { indirizzo: 'Via Poerio, 3', fonti: [F.botCat] },
  contatti: { telefono: '351 5785387', fonti: [F.botCat] },
  servizi: serv(['riparazione', 'batterie', 'cinturini'], [F.botCat]),
  specializzazioni: [{ id: 'vintage', fonti: [F.botCat] }],
  altriServizi: [{ nome: 'Interventi su sveglie e orologi da muro', fonti: [F.botCat] }],
  storia: {
    annoFondazione: 2021, fondatore: 'Antonio Torchia',
    testo: 'Il laboratorio aprì nel 2021 per opera di Antonio Torchia, proseguendo l’esperienza familiare del padre orologiaio dal 1970.',
    eventi: [
      { data: '1970', descrizione: 'Inizio dell’attività orologiaia del padre di Antonio Torchia.', fonti: [F.botCat] },
      { data: '2021', descrizione: 'Apertura del laboratorio La Bottega del Tempo in Via Poerio.', fonti: [F.botCat] },
    ],
    fonti: [F.botCat],
  },
  fonti: [F.botCat],
  segnalazioni: [
    segn('Fonte più recente consultata: articolo di stampa locale del 21 maggio 2021; apertura attuale non confermata da fonti successive. Stato impostato a «da verificare».'),
    segn('CAP non riportato dalla fonte consultata. La collaborazione commerciale con ITALICO Store & Lab era annunciata nel 2021 come prospettiva: nessun marchio in vendita attribuito.'),
  ],
  nota: 'Espansione lotto 2: identità, sede, telefono, servizi e cronologia dall’articolo di stampa locale consultato direttamente; nessun dato aggiunto oltre la fonte.',
});

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| località:', d.localita.length, '| fonti totali:', d.fonti.length);

// ---------- CONTROLLI DI COLLISIONE ----------
const perTelefono = new Map();
const perDominio = new Map();
for (const b of d.attivita) {
  if (b.contatti.telefono) {
    const t = b.contatti.telefono.replace(/\D/g, '');
    if (!perTelefono.has(t)) perTelefono.set(t, []);
    perTelefono.get(t).push(b.id);
  }
  if (b.contatti.sito) {
    try {
      const host = new URL(b.contatti.sito).hostname.replace(/^www\./, '');
      if (!perDominio.has(host)) perDominio.set(host, []);
      perDominio.get(host).push(b.id);
    } catch { /* URL validati dallo schema */ }
  }
}
const collisioni = [];
for (const [t, ids] of perTelefono) if (ids.length > 1) collisioni.push(`telefono ${t}: ${ids.join(', ')}`);
for (const [h, ids] of perDominio) if (ids.length > 1) collisioni.push(`dominio ${h}: ${ids.join(', ')}`);
console.log(collisioni.length ? `collisioni da esaminare:\n${collisioni.join('\n')}` : 'nessuna collisione telefono/dominio');
