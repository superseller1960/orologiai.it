// Espansione Lotto 1 — 14 nuove schede verificate + 3 arricchimenti, 27 ottobre 2026.
// Metodo: ogni claim provato da fonte consultata; autorizzazioni solo da fonti primarie dei marchi;
// dati non confermati lasciati assenti; candidati duplicati arricchiti, non reinseriti.
// Uso: node scripts/espansione-lotto1-20261027.mjs
import fs from 'node:fs';

const file = new URL('../site/data/directory.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const oggi = '2026-10-27';

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
      stato: 'fonti-verificate',
      raccoltaIl: oggi,
      verificataIl: oggi,
      confermataTitolareIl: null,
      fonti,
      cronologia: [{ data: oggi, azione: spec.nota, fonti }],
      segnalazioni: spec.segnalazioni ?? [],
    },
    origine: { sistema: 'espansione-lotto1-20261027', idOriginale: spec.id },
  };
  delete b.nota;
  delete b.fonti;
  delete b.segnalazioni;
  d.attivita.push(b);
  return b;
};

// ---------- FONTI ----------
const F = {};
F.fiorCont = nuovaFonte('e11-www-oreficeriafioravanti-it-contattaci', 'https://www.oreficeriafioravanti.it/contattaci', 'Sito Oreficeria Fioravanti — contatti', 'sito-ufficiale');
F.fiorOro = nuovaFonte('e11-www-oreficeriafioravanti-it-orologeria-a-prato', 'https://www.oreficeriafioravanti.it/orologeria-a-prato', 'Sito Oreficeria Fioravanti — orologeria', 'sito-ufficiale');
F.fiorChi = nuovaFonte('e11-www-oreficeriafioravanti-it-chi-siamo', 'https://www.oreficeriafioravanti.it/chi-siamo', 'Sito Oreficeria Fioravanti — chi siamo', 'sito-ufficiale');
F.fiorNaz = nuovaFonte('e11-www-lanazione-it-prato-fioravanti', 'https://www.lanazione.it/prato/cronaca/la-gioielleria-fioravanti-compie-b8f5948a', 'La Nazione — La gioielleria Fioravanti compie 70 anni', 'stampa');
F.fiorTv = nuovaFonte('e11-www-tvprato-it-fioravanti-70-anni', 'https://www.tvprato.it/la-gioielleria-fioravanti-compie-70-anni/', 'Tv Prato — La gioielleria Fioravanti compie 70 anni', 'stampa');

F.lombRet = nuovaFonte('e11-www-reteimprese-it-carrara-lombardi', 'https://www.reteimprese.it/forniture-orologiai/carrara/azienda/3886494', 'Reteimprese — Lombardi Orologi, Carrara', 'directory');
F.lombIg = nuovaFonte('e11-www-instagram-com-lombardi-orologi', 'https://www.instagram.com/lombardi_orologi/', 'Instagram ufficiale Lombardi Orologi', 'sito-ufficiale');
F.lombNaz = nuovaFonte('e11-www-lanazione-it-massa-carrara-lombardi', 'https://www.lanazione.it/massa-carrara/cronaca/50-anni-in-via-genova-c8d2c0bf', 'La Nazione — 50 anni in Via Genova (Lombardi Orologi)', 'stampa');

F.ferrCont = nuovaFonte('e11-gioielliferrari-it-contatti', 'https://gioielliferrari.it/contatti/', 'Sito Gioielleria Ferrari — contatti', 'sito-ufficiale');
F.ferrRip = nuovaFonte('e11-gioielliferrari-it-riparazione-orologi', 'https://gioielliferrari.it/servizi/riparazione-orologi-2/', 'Sito Gioielleria Ferrari — riparazione orologi', 'sito-ufficiale');
F.ferrChi = nuovaFonte('e11-gioielliferrari-it-chi-siamo', 'https://gioielliferrari.it/chi-siamo/', 'Sito Gioielleria Ferrari — chi siamo', 'sito-ufficiale');
F.ferrHome = nuovaFonte('e11-gioielliferrari-it', 'https://gioielliferrari.it/', 'Sito Gioielleria Ferrari — home', 'sito-ufficiale');

F.dobNeg = nuovaFonte('e11-dobner-it-negozi-trieste-via-dante', 'https://dobner.it/it/negozi/dobner-trieste-via-dante-alighieri/', 'Sito Dobner — negozio Trieste Via Dante', 'sito-ufficiale');
F.dobLab = nuovaFonte('e11-dobner-it-laboratorio', 'https://dobner.it/it/laboratorio/', 'Sito Dobner — laboratorio', 'sito-ufficiale');

F.roncCon = nuovaFonte('e11-roncatogioielli-com-contatti', 'https://roncatogioielli.com/contatti/', 'Sito Roncato Gioielleria — contatti', 'sito-ufficiale');
F.roncSer = nuovaFonte('e11-roncatogioielli-com-servizi', 'https://roncatogioielli.com/servizi/', 'Sito Roncato Gioielleria — servizi', 'sito-ufficiale');
F.roncChi = nuovaFonte('e11-roncatogioielli-com-chi-siamo', 'https://roncatogioielli.com/chi-siamo/', 'Sito Roncato Gioielleria — chi siamo', 'sito-ufficiale');
F.roncHam = nuovaFonte('e11-www-hamiltonwatch-com-mirano-roncato', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/veneto/mirano/gioielleria-f-lli-roncato', 'Hamilton — scheda Gioielleria F.lli Roncato, Mirano', 'marchio-ufficiale');
F.roncTis = nuovaFonte('e11-www-tissotwatches-com-roncato', 'https://www.tissotwatches.com/it-it/store/gioielleria-f-lli-roncato-snc-di-michele-e-paolo-roncato/a1vNN0000020OVxYAM', 'Tissot — scheda Gioielleria F.lli Roncato, Mirano', 'marchio-ufficiale');
F.roncLon = nuovaFonte('e11-www-longines-com-mirano-roncato', 'https://www.longines.com/it/store/id/gioielleria-fratelli-roncato-snc-di-michele-e-paolo-roncato-mirano-1579613', 'Longines — scheda Gioielleria Fratelli Roncato, Mirano', 'marchio-ufficiale');

F.smSito = nuovaFonte('e11-www-gioielleriasanmarco-com', 'https://www.gioielleriasanmarco.com/', 'Sito Gioielleria San Marco — Rovereto', 'sito-ufficiale');
F.smLon = nuovaFonte('e11-www-longines-com-rovereto-san-marco', 'https://www.longines.com/it/store/id/gioielleria-san-marco-snc-di-tait-bruna-c-rovereto-143891', 'Longines — scheda Gioielleria San Marco, Rovereto', 'marchio-ufficiale');

F.wsSito = nuovaFonte('e11-thewatchspa-it', 'https://thewatchspa.it/', 'Sito The Watch Spa — laboratorio Brescia', 'sito-ufficiale');
F.wsChi = nuovaFonte('e11-thewatchspa-it-chi-siamo', 'https://thewatchspa.it/chi-siamo/', 'Sito The Watch Spa — chi siamo', 'sito-ufficiale');
F.wsShop = nuovaFonte('e11-thewatchspa-shop-com-termini', 'https://thewatchspa-shop.com/termini-e-condizioni/', 'Sito The Watch Spa Shop — termini', 'sito-ufficiale');

F.ferLab = nuovaFonte('e11-ferrogioielli-com-laboratorio', 'https://www.ferrogioielli.com/pages/laboratorio-orologeria', 'Sito Ferro Gioielli — laboratorio di orologeria', 'sito-ufficiale');
F.ferTer = nuovaFonte('e11-ferrogioielli-com-termini', 'https://www.ferrogioielli.com/policies/terms-of-service', 'Sito Ferro Gioielli — termini di servizio', 'sito-ufficiale');
F.ferCon = nuovaFonte('e11-ferrogioielli-com-contatti', 'https://www.ferrogioielli.com/pages/contatti', 'Sito Ferro Gioielli — contatti', 'sito-ufficiale');
F.ferSto = nuovaFonte('e11-ferrogioielli-com-este-1954', 'https://www.ferrogioielli.com/blogs/notizie/este-in-piazza-maggiore-apre-il-nuovo-negozio-ferro-orologi-e-gioielli', 'Sito Ferro Gioielli — Este in Piazza Maggiore', 'sito-ufficiale');
F.ferHome = nuovaFonte('e11-ferrogioielli-com', 'https://www.ferrogioielli.com/', 'Sito Ferro Gioielli — home', 'sito-ufficiale');

F.manCon = nuovaFonte('e11-www-mangiliorologi-it-contatti', 'https://www.mangiliorologi.it/contatti/', 'Sito Mangili Orologi — contatti', 'sito-ufficiale');
F.manChi = nuovaFonte('e11-www-mangiliorologi-it-chi-siamo', 'https://www.mangiliorologi.it/chi-siamo/', 'Sito Mangili Orologi — chi siamo', 'sito-ufficiale');

F.forBot = nuovaFonte('e11-www-botteghestoricherieti-it-formichetti', 'https://www.botteghestoricherieti.it/formichetti/', 'Botteghe Storiche Rieti — Orologeria Formichetti', 'stampa');
F.forRet = nuovaFonte('e11-www-reteimprese-it-rieti-formichetti', 'https://www.reteimprese.it/orologi-produzione-commercio/rieti/azienda/1280113', 'Reteimprese — Orologeria Formichetti Simone, Rieti', 'directory');
F.forIg = nuovaFonte('e11-www-instagram-com-orologeria-formichetti', 'https://www.instagram.com/orologeria_formichetti_rieti/', 'Instagram ufficiale Orologeria Formichetti', 'sito-ufficiale');

F.oroHam = nuovaFonte('e11-www-hamiltonwatch-com-l-aquila-orologiando', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/abruzzo/l-aquila/orologiando-srl', 'Hamilton — scheda centro assistenza Orologiando Srl, L’Aquila', 'marchio-ufficiale');
F.oroSito = nuovaFonte('e11-orologiando-srl-it', 'https://orologiandosrl.it/', 'Sito Orologiando Srl', 'sito-ufficiale');

F.galLon = nuovaFonte('e11-www-longines-com-potenza-gallery-gioielli', 'https://www.longines.com/it/store/id/gallery-gioielli-srl-potenza-1684114', 'Longines — scheda Gallery Gioielli Srl, Potenza', 'marchio-ufficiale');

F.ascSito = nuovaFonte('e11-www-lorologiaio-net', 'https://www.lorologiaio.net/', 'Sito L’Orologiaio Ascione — Porto Torres', 'sito-ufficiale');
F.ascTer = nuovaFonte('e11-www-lorologiaio-net-termini', 'https://www.lorologiaio.net/termini-e-condizioni/', 'Sito L’Orologiaio Ascione — termini e condizioni', 'sito-ufficiale');
F.ascSto = nuovaFonte('e11-www-lorologiaiosardegna-com', 'https://www.lorologiaiosardegna.com/', 'Sito storico L’Orologiaio Sardegna', 'sito-ufficiale');
F.ascSrv = nuovaFonte('e11-www-lorologiaiosardegna-com-orologi', 'https://www.lorologiaiosardegna.com/orologi.php', 'Sito storico L’Orologiaio Sardegna — servizi', 'sito-ufficiale');

F.pinIg = nuovaFonte('e11-www-instagram-com-orologeria-pinna', 'https://www.instagram.com/orologeria_pinna/', 'Instagram ufficiale Orologeria Pinna', 'sito-ufficiale');
F.pinIg2 = nuovaFonte('e11-www-instagram-com-orologeria-pinna-storia', 'https://www.instagram.com/p/ClJAmGXNZ1G/', 'Instagram Orologeria Pinna — post sulla storia', 'sito-ufficiale');
F.pinEss = nuovaFonte('e11-www-essentzia-it-punti-vendita', 'https://www.essentzia.it/pages/punti-vendita', 'Essentzia — elenco punti vendita', 'directory');
F.pinOve = nuovaFonte('e11-www-overplace-com-orologeria-pinna', 'https://www.overplace.com/orologeria-pinna', 'Overplace — scheda Orologeria Pinna', 'directory');

// Fonti per gli arricchimenti delle schede duplicate
F.casChi = nuovaFonte('e11-orologeriacasadei-it-chi-siamo', 'https://www.orologeriacasadei.it/chi-siamo/', 'Sito Orologeria Casadei — chi siamo', 'sito-ufficiale');
F.casRip = nuovaFonte('e11-orologeriacasadei-it-riparazione', 'https://www.orologeriacasadei.it/riparazione-orologi-a-rimini/', 'Sito Orologeria Casadei — riparazione orologi', 'sito-ufficiale');
F.casPer = nuovaFonte('e11-orologeriacasadei-it-perseo', 'https://www.orologeriacasadei.it/orologi-perseo-watches-assistenza-rimini-riccione/', 'Sito Orologeria Casadei — assistenza Perseo', 'sito-ufficiale');
F.perCda = nuovaFonte('e11-www-perseo-watches-it-centri-riparazione', 'https://www.perseo-watches.it/centri-riparazione-perseo-orologi/', 'Perseo Watches — centri di riparazione ufficiali', 'marchio-ufficiale');
F.cotSto = nuovaFonte('e11-orologeriacotifava-com-storia', 'https://www.orologeriacotifava.com/lastoria.html', 'Sito Orologeria Cotifava — la storia', 'sito-ufficiale');
F.cotLom = nuovaFonte('e11-www-lombardianotizie-online-cotifava', 'https://www.lombardianotizie.online/attivita-storiche-provincia-mantova/', 'Lombardia Notizie — attività storiche provincia di Mantova', 'stampa');
F.cotVdm = nuovaFonte('e11-vocedimantova-it-cotifava', 'https://vocedimantova.it/cronaca/cotifava-leccellenza-dellorologeria-mantovana-si-rinnova-in-via-fernelli/', 'Voce di Mantova — Cotifava si rinnova in Via Fernelli', 'stampa');
F.dilLab = nuovaFonte('e11-lorologiaiobiella-it-laboratorio', 'https://www.lorologiaiobiella.it/laboratorio-orologeria', 'Sito L’Orologiaio Di Liddo — laboratorio', 'sito-ufficiale');

// ---------- LOCALITÀ ----------
creaLocalita({ id: 'prato', comune: 'Prato', comuneSlug: 'prato', provincia: 'Prato', provinciaSlug: 'prato', siglaProvincia: 'PO', regione: 'Toscana', regioneSlug: 'toscana', descrizione: 'Prato: laboratorio di riparazione orologi censito con fonti ufficiali (Oreficeria Fioravanti).', fonti: [F.fiorOro] });
creaLocalita({ id: 'carrara', comune: 'Carrara', comuneSlug: 'carrara', provincia: 'Massa-Carrara', provinciaSlug: 'massa-carrara', siglaProvincia: 'MS', regione: 'Toscana', regioneSlug: 'toscana', descrizione: 'Carrara: laboratorio di orologeria censito con fonti ufficiali e stampa locale (Lombardi Orologi, a Marina di Carrara).', fonti: [F.lombNaz] });
creaLocalita({ id: 'rimini', comune: 'Rimini', comuneSlug: 'rimini', provincia: 'Rimini', provinciaSlug: 'rimini', siglaProvincia: 'RN', regione: 'Emilia-Romagna', regioneSlug: 'emilia-romagna', descrizione: 'Rimini: orologeria con laboratorio interno censita con fonti ufficiali (Orologeria Casadei).', fonti: [F.casRip] });
creaLocalita({ id: 'mirano', comune: 'Mirano', comuneSlug: 'mirano', provincia: 'Venezia', provinciaSlug: 'venezia', siglaProvincia: 'VE', regione: 'Veneto', regioneSlug: 'veneto', descrizione: 'Mirano: gioielleria e orologeria con laboratori interni censita con fonti ufficiali e dei marchi (Roncato Gioielleria).', fonti: [F.roncCon] });
creaLocalita({ id: 'rovereto', comune: 'Rovereto', comuneSlug: 'rovereto', provincia: 'Trento', provinciaSlug: 'trento', siglaProvincia: 'TN', regione: 'Trentino-Alto Adige', regioneSlug: 'trentino-alto-adige', descrizione: 'Rovereto: gioielleria con laboratorio e punto vendita Longines censita con fonti ufficiali (Gioielleria San Marco).', fonti: [F.smSito] });
creaLocalita({ id: 'brescia', comune: 'Brescia', comuneSlug: 'brescia', provincia: 'Brescia', provinciaSlug: 'brescia', siglaProvincia: 'BS', regione: 'Lombardia', regioneSlug: 'lombardia', descrizione: 'Brescia: laboratorio di riparazione e revisione orologi e pendole censito con fonti ufficiali (The Watch Spa).', fonti: [F.wsSito] });
creaLocalita({ id: 'este', comune: 'Este', comuneSlug: 'este', provincia: 'Padova', provinciaSlug: 'padova', siglaProvincia: 'PD', regione: 'Veneto', regioneSlug: 'veneto', descrizione: 'Este: laboratorio di orologeria dal 1954 censito con fonti ufficiali (Ferro Gioielli 1954).', fonti: [F.ferSto] });
creaLocalita({ id: 'mantova', comune: 'Mantova', comuneSlug: 'mantova', provincia: 'Mantova', provinciaSlug: 'mantova', siglaProvincia: 'MN', regione: 'Lombardia', regioneSlug: 'lombardia', descrizione: 'Mantova: laboratorio di orologeria con storia familiare documentata (Orologeria Cotifava).', fonti: [F.cotSto] });
creaLocalita({ id: 'biella', comune: 'Biella', comuneSlug: 'biella', provincia: 'Biella', provinciaSlug: 'biella', siglaProvincia: 'BI', regione: 'Piemonte', regioneSlug: 'piemonte', descrizione: 'Biella: orologeria con laboratorio interno censita con fonti ufficiali (L’Orologiaio Di Liddo).', fonti: [F.dilLab] });
creaLocalita({ id: 'lecco', comune: 'Lecco', comuneSlug: 'lecco', provincia: 'Lecco', provinciaSlug: 'lecco', siglaProvincia: 'LC', regione: 'Lombardia', regioneSlug: 'lombardia', descrizione: 'Lecco: orologeria con compravendita e riparazione censita con fonti ufficiali (Mangili Orologi).', fonti: [F.manChi] });
creaLocalita({ id: 'porto-torres', comune: 'Porto Torres', comuneSlug: 'porto-torres', provincia: 'Sassari', provinciaSlug: 'sassari', siglaProvincia: 'SS', regione: 'Sardegna', regioneSlug: 'sardegna', descrizione: 'Porto Torres: bottega orologiaia di quattro generazioni con laboratorio censita con fonti ufficiali (L’Orologiaio Ascione).', fonti: [F.ascSito] });

// ---------- NUOVE SCHEDE ----------
crea({
  id: 'oreficeria-fioravanti-prato', slug: 'oreficeria-fioravanti-prato', nome: 'Oreficeria Fioravanti',
  tipi: ['orologeria', 'laboratorio', 'gioielleria'], localitaId: 'prato',
  descrizione: 'Oreficeria Fioravanti in Via A. Spano 33/A a Prato è un laboratorio di riparazione orologi attivo dal 1955 e giunto alla terza generazione della famiglia: interviene su orologi antichi e moderni, sveglie e orologi a pendolo, con servizi di manutenzione, revisione e restauro.',
  posizione: { indirizzo: 'Via A. Spano, 33/A', cap: '59100', fonti: [F.fiorCont] },
  contatti: { telefono: '0574 465927', email: 'davidmilani@virgilio.it', sito: 'https://www.oreficeriafioravanti.it/', fonti: [F.fiorCont] },
  servizi: serv(['riparazione', 'revisione', 'manutenzione', 'restauro-vintage', 'pendoleria'], [F.fiorOro]),
  specializzazioni: [{ id: 'antichi', fonti: [F.fiorOro] }],
  storia: {
    annoFondazione: 1955, fondatore: 'Abramo Fioravanti',
    testo: 'L’attività fu avviata da Abramo Fioravanti nel 1955 ed è condotta dalla terza generazione della famiglia.',
    eventi: [{ data: '1955', descrizione: 'Avvio dell’attività per opera di Abramo Fioravanti.', fonti: [F.fiorNaz, F.fiorTv] }],
    fonti: [F.fiorNaz, F.fiorTv, F.fiorChi],
  },
  fonti: [F.fiorCont, F.fiorOro, F.fiorChi, F.fiorNaz, F.fiorTv],
  nota: 'Espansione lotto 1: identità, recapiti e laboratorio dal sito ufficiale; fondazione 1955, fondatore Abramo Fioravanti e terza generazione da La Nazione e Tv Prato.',
});

crea({
  id: 'lombardi-orologi-carrara', slug: 'lombardi-orologi-carrara', nome: 'Lombardi Orologi',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'carrara',
  descrizione: 'Lombardi Orologi in Via Genova 15 a Marina di Carrara è laboratorio di orologeria alla terza generazione: la famiglia ripara orologi dagli anni Sessanta e dal 1976 è nell’attuale sede, specializzata in riparazione, revisione e restauro di orologi di pregio e d’epoca.',
  posizione: { indirizzo: 'Via Genova, 15', cap: '54033', fonti: [F.lombRet] },
  contatti: { telefono: '0585 785936', sito: null, social: ['https://www.instagram.com/lombardi_orologi/'], fonti: [F.lombRet, F.lombIg] },
  servizi: serv(['riparazione', 'revisione', 'restauro-vintage'], [F.lombIg, F.lombNaz]),
  specializzazioni: [{ id: 'vintage', fonti: [F.lombNaz] }, { id: 'antichi', fonti: [F.lombIg] }],
  marchi: { riparati: brand(['Longines', 'Zenith', 'Omega', 'Vacheron Constantin'], [F.lombNaz]) },
  storia: {
    testo: 'La famiglia Lombardi ripara orologi dagli anni Sessanta, quando Franco lavorava con il padre; nel 1976 il negozio si trasferì in Via Genova, a Marina di Carrara. L’attività, condotta dalle figlie, si presenta come laboratorio alla terza generazione.',
    eventi: [{ data: '1976', descrizione: 'Trasferimento del negozio in Via Genova, a Marina di Carrara.', fonti: [F.lombNaz] }],
    fonti: [F.lombNaz, F.lombIg],
  },
  fonti: [F.lombRet, F.lombIg, F.lombNaz],
  segnalazioni: [segn('Sito web ed email assenti: il canale ufficiale consultato è il profilo Instagram; pagine PagineGialle e PagineBianche non leggibili in sessione (HTTP 403) e non usate come prova.')],
  nota: 'Espansione lotto 1: identità, indirizzo e telefono da Reteimprese; servizi e tre generazioni dal profilo Instagram; storia, sede dal 1976 e lavorazioni su Longines, Zenith, Omega e Vacheron da La Nazione.',
});

crea({
  id: 'gioielleria-ferrari-piacenza', slug: 'gioielleria-ferrari-piacenza', nome: 'Gioielleria Ferrari',
  nomiPrecedenti: ['Oreficeria Ferrari'],
  tipi: ['gioielleria', 'orologeria'], localitaId: 'piacenza',
  descrizione: 'Gioielleria Ferrari in Via Morigi 37 a Piacenza nasce dal laboratorio di riparazione e montaggio orologi avviato da Mauro Ferrari negli anni Settanta: il negozio apre nel 1981 e dal 2012 è guidato dalla figlia. Ripara orologi di ogni età e complessità e vende gioielli e orologi.',
  posizione: { indirizzo: 'Via Morigi, 37', fonti: [F.ferrCont] },
  contatti: { telefono: '0523 713119', email: 'ferraripiacenzagioielli@gmail.com', sito: 'https://gioielliferrari.it/', fonti: [F.ferrCont] },
  servizi: serv(['riparazione', 'vendita', 'gioielleria'], [F.ferrRip, F.ferrHome]),
  storia: {
    fondatore: 'Mauro Ferrari',
    testo: 'Le origini risalgono agli anni Settanta, con il laboratorio di riparazione e montaggio orologi di Mauro Ferrari; il negozio aprì nel 1981 e nel 2012 passò alla figlia.',
    eventi: [
      { data: '1981', descrizione: 'Apertura del negozio.', fonti: [F.ferrChi] },
      { data: '2012', descrizione: 'Passaggio generazionale alla figlia.', fonti: [F.ferrChi] },
    ],
    fonti: [F.ferrChi],
  },
  fonti: [F.ferrCont, F.ferrRip, F.ferrChi, F.ferrHome],
  segnalazioni: [segn('CAP non riportato dalle pagine ufficiali lette: campo lasciato assente.')],
  nota: 'Espansione lotto 1: identità, recapiti e laboratorio dal sito ufficiale; cronologia (anni Settanta, negozio 1981, passaggio generazionale 2012) dalla pagina chi siamo. Sede distinta da Astrua 1860, già censita a Piacenza.',
});

const dob = crea({
  id: 'dobner-trieste', slug: 'dobner-trieste', nome: 'Dobner — sede di Trieste',
  gruppoId: 'dobner',
  tipi: ['orologeria', 'gioielleria'], localitaId: 'trieste',
  descrizione: 'Sede triestina di Dobner in Via Dante Alighieri 7, nell’antica orologeria fondata da Oscar Giovanni Dobner, maestro orologiaio dal 1836: acquistata nel 1985 da Alberto Oppenheim, conserva gli arredi storici e dispone di laboratorio per revisioni e riparazioni dei marchi trattati.',
  posizione: { indirizzo: 'Via Dante Alighieri, 7', fonti: [F.dobNeg] },
  contatti: { telefono: '040 632951', email: 'dobner.vdante@dobner.it', sito: 'https://dobner.it/', fonti: [F.dobNeg] },
  servizi: serv(['vendita', 'riparazione', 'revisione', 'assistenza'], [F.dobNeg, F.dobLab]),
  marchi: { venduti: brand(['Gerald Charles', 'Oris', 'Chanel', 'Baume & Mercier', 'Bvlgari', 'Solari lineadesign'], [F.dobLab]) },
  storia: {
    fondatore: 'Oscar Giovanni Dobner',
    testo: 'La sede di Via Dante raccoglie l’antica orologeria Dobner: il fondatore Oscar Giovanni Dobner risulta maestro orologiaio dal 1836; nel 1985 Alberto Oppenheim acquistò l’attività, che nel 2013 ha conservato gli arredi storici originali.',
    eventi: [{ data: '1985', descrizione: 'Acquisizione dell’antica orologeria Dobner da parte di Alberto Oppenheim.', fonti: [F.dobNeg] }],
    fonti: [F.dobNeg],
  },
  fonti: [F.dobNeg, F.dobLab],
  segnalazioni: [segn('Il sito dichiara il laboratorio «ufficialmente autorizzato dalle maison» per i marchi di cui è concessionario: autodichiarazione, non inserita fra le assistenze ufficiali in assenza di fonti primarie dei marchi. CAP non riportato dalla pagina del negozio.')],
  nota: 'Espansione lotto 1: seconda sede del gruppo Dobner (cfr. dobner-gorizia), distinta e documentata dalla pagina ufficiale del negozio; storia della bottega e laboratorio dalle pagine Dobner.',
});
// Collega la sede di Gorizia allo stesso gruppo: il segnale di dominio condiviso risulta «sedi-distinte».
get('dobner-gorizia').gruppoId = 'dobner';

crea({
  id: 'roncato-gioielleria-mirano', slug: 'roncato-gioielleria-mirano', nome: 'Roncato Gioielleria',
  nomiPrecedenti: ['Gioielleria F.lli Roncato'],
  tipi: ['gioielleria', 'orologeria'], localitaId: 'mirano',
  descrizione: 'Roncato Gioielleria in Via Barche 10 a Mirano è attiva da oltre sessant’anni e giunta alla terza generazione, con laboratori interni per l’assistenza tecnica su segnatempo meccanici, automatici e al quarzo, sostituzione pile e cinturini; rivenditore ufficiale Hamilton, Tissot e Longines.',
  posizione: { indirizzo: 'Via Barche, 10', cap: '30035', fonti: [F.roncCon] },
  contatti: { telefono: '041 4355 297', whatsapp: '+393428020584', email: 'gioielleria.roncato@gmail.com', sito: 'https://roncatogioielli.com/', fonti: [F.roncCon] },
  servizi: serv(['riparazione-meccanici', 'riparazione-automatici', 'riparazione-quarzo', 'assistenza', 'batterie', 'cinturini', 'revisione', 'manutenzione'], [F.roncSer]),
  marchi: {
    venduti: brand(['Hamilton', 'Tissot', 'Longines'], [F.roncHam, F.roncTis, F.roncLon]),
    rivenditaUfficiale: brand(['Hamilton', 'Tissot', 'Longines'], [F.roncHam, F.roncTis, F.roncLon]),
  },
  storia: {
    annoFondazione: 1960, fondatore: 'Ottavio Roncato',
    testo: 'Avviata da Ottavio Roncato oltre sessant’anni fa — il sito la indica «dal 1960» — l’attività è alla terza generazione; la sede si è trasferita nell’attuale punto vendita nel 2017.',
    eventi: [{ data: '2017', descrizione: 'Trasferimento nell’attuale sede.', fonti: [F.roncChi] }],
    fonti: [F.roncChi],
  },
  fonti: [F.roncCon, F.roncSer, F.roncChi, F.roncHam, F.roncTis, F.roncLon],
  segnalazioni: [segn('Civico discordante: Via Barche 10 sul sito dell’attività, 10/A sui locator Hamilton, Tissot e Longines.')],
  nota: 'Espansione lotto 1: recapiti e laboratori dal sito ufficiale; rivendite ufficiali Hamilton, Tissot e Longines dalle schede specifiche dei tre marchi; storia dichiarata dal sito («dal 1960», tre generazioni, trasferimento 2017).',
});

crea({
  id: 'gioielleria-san-marco-rovereto', slug: 'gioielleria-san-marco-rovereto', nome: 'Gioielleria San Marco',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'rovereto',
  descrizione: 'Gioielleria San Marco in Via Rialto 8/9 a Rovereto, attiva dal 1966 per volontà di Bruna e Aldo, dispone di laboratorio per la riparazione di gioielli e orologi; è punto vendita Longines con servizi di manutenzione del marchio.',
  posizione: { indirizzo: 'Via Rialto, 8/9', cap: '38068', fonti: [F.smSito] },
  contatti: { telefono: '0464 430268', email: 'info@gioielleriasanmarco.com', sito: 'https://www.gioielleriasanmarco.com/', fonti: [F.smSito, F.smLon] },
  servizi: serv(['riparazione', 'manutenzione', 'gioielleria'], [F.smSito, F.smLon]),
  marchi: {
    venduti: brand(['Longines'], [F.smLon]),
    rivenditaUfficiale: brand(['Longines'], [F.smLon]),
  },
  storia: {
    annoFondazione: 1966,
    testo: 'Il sito dell’attività la presenta attiva «dal 1966» e ne attribuisce l’avvio a Bruna e Aldo.',
    eventi: [{ data: '1966', descrizione: 'Avvio dell’attività per volontà di Bruna e Aldo.', fonti: [F.smSito] }],
    fonti: [F.smSito],
  },
  fonti: [F.smSito, F.smLon],
  segnalazioni: [segn('Civico discordante: Via Rialto 8/9 sul sito dell’attività, Via Rialto 9 sulla scheda Longines.')],
  nota: 'Espansione lotto 1: identità, recapiti, laboratorio e storia dichiarata dal sito ufficiale; punto vendita Longines con manutenzione dalla scheda specifica del marchio.',
});

crea({
  id: 'the-watch-spa-brescia', slug: 'the-watch-spa-brescia', nome: 'The Watch Spa',
  tipi: ['laboratorio', 'orologeria'], localitaId: 'brescia',
  descrizione: 'The Watch Spa in Via Gerolamo Savoldo 3 a Brescia è laboratorio di riparazione e revisione di orologi e pendole — meccanici, automatici e al quarzo — con sostituzione vetri e restauri; il negozio collegato tratta orologi vintage e di secondo polso.',
  posizione: { indirizzo: 'Via Gerolamo Savoldo, 3', cap: '25124', fonti: [F.wsSito] },
  contatti: { telefono: '+39 327 9495364', email: 'info@thewatchspa.it', sito: 'https://thewatchspa.it/', fonti: [F.wsSito] },
  servizi: serv(['riparazione', 'revisione', 'riparazione-meccanici', 'riparazione-automatici', 'riparazione-quarzo', 'manutenzione', 'pendoleria', 'vendita', 'vendita-usati'], [F.wsSito, F.wsShop]),
  marchi: { riparati: brand(['Rolex', 'Omega', 'Cartier', 'IWC', 'TAG Heuer', 'Seiko', 'Zenith'], [F.wsSito]) },
  fonti: [F.wsSito, F.wsChi, F.wsShop],
  segnalazioni: [
    segn('Il sito si dichiara autorizzato Locman e per Longines, Tissot, Hamilton, Mido e Rado (Swatch Group): autodichiarazioni non inserite fra le autorizzazioni confermate in assenza di fonti primarie dei marchi.'),
    segn('Formulazioni cronologiche non univoche nella pagina «chi siamo» («costruito dal 1955» contro avvicinamento alla riparazione dal 1982 e oltre 36 anni di esperienza): nessun anno di fondazione attribuito.'),
  ],
  nota: 'Espansione lotto 1: identità, recapiti, laboratorio e servizi dal sito ufficiale; vendita vintage/secondo polso dal negozio collegato; marchi riparati dichiarati dal laboratorio. Autorizzazioni autodichiarate registrate come segnalazioni, non come qualifiche.',
});

crea({
  id: 'ferro-gioielli-1954-este', slug: 'ferro-gioielli-1954-este', nome: 'Ferro Gioielli 1954',
  tipi: ['gioielleria', 'orologeria', 'laboratorio'], localitaId: 'este',
  descrizione: 'Ferro Gioielli 1954 in Piazza Maggiore 23 a Este nasce dal laboratorio di riparazioni avviato da Nereo Ferro nel 1954 ed è giunto alla terza generazione: full overhaul, restauro vintage, lucidatura e prove di impermeabilità nel laboratorio di orologeria.',
  posizione: { indirizzo: 'Piazza Maggiore, 23', cap: '35042', fonti: [F.ferTer] },
  contatti: { telefono: '+39 0429 2822', email: 'info@ferrogioielli.com', sito: 'https://www.ferrogioielli.com/', fonti: [F.ferTer, F.ferCon] },
  servizi: serv(['riparazione', 'revisione', 'manutenzione', 'batterie', 'cinturini', 'restauro-vintage', 'lucidatura', 'vendita', 'gioielleria'], [F.ferLab, F.ferCon]),
  specializzazioni: [{ id: 'vintage', fonti: [F.ferLab] }],
  marchi: { venduti: brand(['Rolex', 'Cartier', 'Tudor', 'Omega'], [F.ferHome]) },
  storia: {
    annoFondazione: 1954, fondatore: 'Nereo Ferro',
    testo: 'Nereo Ferro avviò nel 1954 un laboratorio di riparazioni a Este; l’attività è arrivata alla terza generazione.',
    eventi: [{ data: '1954', descrizione: 'Avvio del laboratorio di riparazioni a Este.', fonti: [F.ferSto] }],
    fonti: [F.ferSto],
  },
  fonti: [F.ferLab, F.ferTer, F.ferCon, F.ferSto, F.ferHome],
  segnalazioni: [segn('Il sito indica anche il numero +39 331 1402059 in alcune pagine, non considerato contatto primario. Marchi esposti e commercializzati senza qualifica di rivenditore ufficiale.')],
  nota: 'Espansione lotto 1: identità, società e recapiti dai termini di servizio e dai contatti ufficiali; laboratorio con full overhaul, restauro vintage, lucidatura e prove di impermeabilità dalla pagina laboratorio; storia 1954 e terza generazione dalla pagina aziendale.',
});

crea({
  id: 'mangili-orologi-lecco', slug: 'mangili-orologi-lecco', nome: 'Mangili Orologi',
  tipi: ['orologeria', 'gioielleria'], localitaId: 'lecco',
  descrizione: 'Mangili Orologi a Lecco, attiva dal 1959 e alla terza generazione, è specializzata nella compravendita di orologi nuovi e usati e nella riparazione dei marchi più esclusivi; il sito indica due sedi in città, in Via F.lli Cairoli 40 e Via Carlo Cattaneo 55.',
  posizione: { indirizzo: 'Via F.lli Cairoli, 40', cap: '23900', fonti: [F.manCon] },
  contatti: { telefono: '+39 0341 593501', email: 'info@mangiliorologi.it', sito: 'https://mangiliorologi.it/', fonti: [F.manCon] },
  servizi: serv(['vendita', 'vendita-usati', 'riparazione'], [F.manChi]),
  storia: {
    annoFondazione: 1959,
    testo: 'Il sito documenta l’avvio dell’attività nel 1959 e una tradizione di tre generazioni.',
    eventi: [{ data: '1959', descrizione: 'Avvio dell’attività a Lecco.', fonti: [F.manChi] }],
    fonti: [F.manChi],
  },
  fonti: [F.manCon, F.manChi],
  segnalazioni: [segn('Seconda sede dichiarata in Via Carlo Cattaneo 55; il sito non specifica quale delle due sedi ospiti le riparazioni. Marchi specifici trattati non elencati.')],
  nota: 'Espansione lotto 1: società, recapiti e due sedi dalla pagina contatti; compravendita, riparazioni, fondazione 1959 e tre generazioni dalla pagina chi siamo. Nessun marchio specifico attribuito.',
});

crea({
  id: 'orologeria-formichetti-rieti', slug: 'orologeria-formichetti-rieti', nome: 'Orologeria Formichetti',
  tipi: ['orologeria'], localitaId: 'rieti',
  descrizione: 'Orologeria Formichetti in Via Pennina 37 a Rieti è bottega storica avviata nel 1965 da Enzo Formichetti, trasferitasi nell’attuale sede nel 1973 e oggi condotta dal figlio Simone: vendita e riparazione di orologi da oltre cinquant’anni.',
  posizione: { indirizzo: 'Via Pennina, 37', cap: '02100', fonti: [F.forRet] },
  contatti: { telefono: '349 332 7216', social: ['https://www.instagram.com/orologeria_formichetti_rieti/'], fonti: [F.forRet] },
  servizi: serv(['vendita', 'riparazione'], [F.forIg]),
  marchi: { menzionati: brand(['Lorenz'], [F.forIg]) },
  storia: {
    annoFondazione: 1965, fondatore: 'Enzo Formichetti',
    testo: 'Enzo Formichetti inaugurò la propria attività nel 1965; nel 1973 la bottega si trasferì in Via Pennina e oggi il testimone è passato al figlio Simone.',
    eventi: [
      { data: '1965', descrizione: 'Avvio dell’attività per opera di Enzo Formichetti.', fonti: [F.forBot] },
      { data: '1973', descrizione: 'Trasferimento della bottega in Via Pennina.', fonti: [F.forBot] },
    ],
    fonti: [F.forBot, F.forRet],
  },
  fonti: [F.forBot, F.forRet, F.forIg],
  segnalazioni: [segn('Email e sito web assenti: canali consultati la scheda Botteghe Storiche Rieti, Reteimprese e il profilo Instagram ufficiale.')],
  nota: 'Espansione lotto 1: bottega storica documentata dalla scheda di Botteghe Storiche Rieti (fondazione 1965, trasferimento 1973, passaggio al figlio Simone); identità, indirizzo e telefono da Reteimprese; vendita e riparazione dichiarate sul profilo ufficiale.',
});

crea({
  id: 'orologiando-l-aquila', slug: 'orologiando-l-aquila', nome: 'Orologiando Srl',
  tipi: ['orologeria', 'laboratorio'], localitaId: 'l-aquila',
  descrizione: 'Orologiando Srl in Via Campo di Pile a L’Aquila è qualificata dalla scheda ufficiale Hamilton come centro assistenza ufficiale del marchio, con servizi di sostituzione di batterie e cinturini presso la propria sede.',
  posizione: { indirizzo: 'Via Campo di Pile', cap: '67100', fonti: [F.oroHam] },
  contatti: { sito: 'https://orologiandosrl.it/', fonti: [F.oroSito] },
  servizi: serv(['assistenza', 'batterie', 'cinturini'], [F.oroHam]),
  marchi: { assistenzaUfficiale: brand(['Hamilton'], [F.oroHam]) },
  fonti: [F.oroHam, F.oroSito],
  segnalazioni: [segn('Telefono ed email non pubblicati nelle fonti consultate; il sito risulta in allestimento. Civico non indicato dalla scheda Hamilton.')],
  nota: 'Espansione lotto 1: identità, sede e qualifica di centro assistenza ufficiale Hamilton dalla scheda specifica del produttore (marchio-ufficiale); servizi limitati a quanto attestato dalla fonte (batteria, cinturino).',
});

crea({
  id: 'gallery-gioielli-potenza', slug: 'gallery-gioielli-potenza', nome: 'Gallery Gioielli Srl',
  tipi: ['gioielleria', 'orologeria'], localitaId: 'potenza',
  descrizione: 'Gallery Gioielli Srl in Via C. B. Cavour 56 a Potenza è boutique Longines documentata dal locator ufficiale del marchio: vendita di orologi e gioielli con servizi di manutenzione e sostituzione del cinturino secondo gli standard Longines.',
  posizione: { indirizzo: 'Via C. B. Cavour, 56', cap: '85100', fonti: [F.galLon] },
  contatti: { telefono: '0971 442832', email: 'gallerygioielli@gmail.com', fonti: [F.galLon] },
  servizi: serv(['vendita', 'manutenzione', 'cinturini', 'gioielleria'], [F.galLon]),
  marchi: {
    venduti: brand(['Longines'], [F.galLon]),
    rivenditaUfficiale: brand(['Longines'], [F.galLon]),
  },
  fonti: [F.galLon],
  segnalazioni: [segn('Sito web non presente nelle fonti consultate; nessun’altra qualifica di marchio attribuita oltre a Longines.')],
  nota: 'Espansione lotto 1: identità, indirizzo, recapiti, rivendita ufficiale Longines e servizi di manutenzione/cinturino dalla scheda specifica del marchio (marchio-ufficiale).',
});

crea({
  id: 'lorologiaio-ascione-porto-torres', slug: 'lorologiaio-ascione-porto-torres', nome: 'L’Orologiaio Ascione',
  nomiPrecedenti: ['L’Orologiaio S.r.l. (di L. Ascione & C.)'],
  tipi: ['orologeria', 'laboratorio'], localitaId: 'porto-torres',
  descrizione: 'L’Orologiaio Ascione in Via Libio 15 a Porto Torres è bottega di quattro generazioni con laboratorio attrezzato per l’assistenza e la riparazione di orologi da polso e da tasca, specializzata nei movimenti meccanici, con restauro, revisione e ricostruzione di componenti; vende orologi nuovi e d’epoca.',
  posizione: { indirizzo: 'Via Libio, 15', cap: '07046', fonti: [F.ascSito] },
  contatti: { telefono: '+39 079 501900', email: 'az.orologiaio@gmail.com', sito: 'https://www.lorologiaio.net/', fonti: [F.ascSito, F.ascTer] },
  servizi: serv(['riparazione', 'assistenza', 'orologi-tasca', 'riparazione-meccanici', 'revisione', 'restauro-vintage', 'pendoleria', 'vendita'], [F.ascSito, F.ascSrv]),
  specializzazioni: [{ id: 'antichi', fonti: [F.ascSrv] }, { id: 'meccanici', fonti: [F.ascSito] }],
  marchi: { venduti: brand(['Seiko', 'Philip Watch'], [F.ascSito]) },
  storia: {
    fondatore: 'Pasquale Ascione',
    testo: 'Le fonti aziendali non concordano sull’anno d’origine: il sito attuale riporta l’apertura del laboratorio di Pasquale Ascione nel 1920, il sito storico indica l’attività «sin dal 1915». Documentata la continuità familiare fino alla quarta generazione (figlia Luisa, nipote Paolo).',
    eventi: [],
    fonti: [F.ascSito, F.ascSto],
  },
  fonti: [F.ascSito, F.ascTer, F.ascSto, F.ascSrv],
  segnalazioni: [segn('Cronologia discordante tra le fonti aziendali: 1920 (sito attuale) contro 1915 (sito storico); nessun anno di fondazione unico attribuito.')],
  nota: 'Espansione lotto 1: identità, recapiti e laboratorio dai siti ufficiali; quattro generazioni e cronologia dalle pagine aziendali con la variante 1920/1915 registrata; pendoleria e restauro dalla pagina servizi del sito storico.',
});

crea({
  id: 'orologeria-pinna-nuoro', slug: 'orologeria-pinna-nuoro', nome: 'Orologeria Pinna',
  tipi: ['orologeria', 'gioielleria'], localitaId: 'nuoro',
  descrizione: 'Orologeria Pinna in Via XX Settembre 1 a Nuoro è negozio storico specializzato in riparazione e vendita di orologi, con oreficeria e laboratorio orafo; il profilo aziendale dichiara una tradizione orologiaia familiare di quattro generazioni.',
  posizione: { indirizzo: 'Via XX Settembre, 1', cap: '08100', fonti: [F.pinEss] },
  contatti: { telefono: '0784 37680', social: ['https://www.instagram.com/orologeria_pinna/'], fonti: [F.pinEss, F.pinIg] },
  servizi: serv(['riparazione', 'vendita', 'gioielleria'], [F.pinIg]),
  storia: {
    testo: 'Nel 2022 l’attività ha celebrato i 50 anni della forma attuale nella sede di Via XX Settembre 1, nell’ambito di una tradizione orologiaia familiare che il profilo dichiara di quattro generazioni.',
    eventi: [{ data: '2022', descrizione: 'Celebrazione dei 50 anni dell’attività nella sede di Via XX Settembre 1.', fonti: [F.pinIg2] }],
    fonti: [F.pinIg2, F.pinIg],
  },
  fonti: [F.pinIg, F.pinIg2, F.pinEss, F.pinOve],
  segnalazioni: [segn('Email e sito web assenti. I «50 anni» celebrati nel 2022 si riferiscono alla forma attuale dell’attività e non costituiscono un anno di fondazione: nessuna data d’avvio attribuita.')],
  nota: 'Espansione lotto 1: identità, sede e recapiti dal profilo ufficiale e dall’elenco Essentzia; riparazione e vendita dichiarate dal profilo; storia di quattro generazioni e 50 anni della forma attuale dal post aziendale, senza dedurre un anno di fondazione.',
});

// ---------- ARRICHIMENTI CANDIDATI DUPLICATI (schede già esistenti) ----------
const arricchisci = (id, azione, fonti, muta) => {
  const b = get(id);
  muta(b);
  b.attendibilita.cronologia.push({ data: oggi, azione, fonti });
  b.attendibilita.verificataIl = oggi;
  for (const f of fonti) if (!b.attendibilita.fonti.includes(f)) b.attendibilita.fonti.push(f);
};
const aggiungiServizio = (b, id, fonti) => {
  const s = b.servizi.find((x) => x.id === id);
  if (s) { for (const f of fonti) if (!s.fonti.includes(f)) s.fonti.push(f); }
  else b.servizi.push({ id, fonti: [...fonti] });
};
const aggiungiMarca = (b, lista, nome, fonti) => {
  const m = b.marchi[lista].find((x) => x.marca === nome);
  if (m) { for (const f of fonti) if (!m.fonti.includes(f)) m.fonti.push(f); }
  else b.marchi[lista].push({ marca: nome, fonti: [...fonti] });
};

// Casadei (Rimini): email, servizi, storia 1972 e assistenza Perseo dichiarata.
arricchisci('casadei-rimini',
  'Espansione lotto 1 (candidato duplicato, scheda arricchita): aggiunti email e cellulare, servizi di pendoleria, riparazione meccanici/automatici e vendita usati; storia 1972 (Marco Casadei) e continuità padre-figlio; assistenza Perseo dichiarata dall’attività, non presente nell’elenco ufficiale dei centri Perseo.',
  [F.casChi, F.casRip, F.casPer, F.perCda],
  (b) => {
    b.contatti.email = 'orologicasadei@gmail.com';
    for (const s of ['pendoleria', 'riparazione-meccanici', 'riparazione-automatici', 'vendita-usati']) aggiungiServizio(b, s, [F.casRip]);
    aggiungiMarca(b, 'riparati', 'Perseo', [F.casPer]);
    b.storia = {
      annoFondazione: null, fondatore: 'Marco Casadei',
      testo: 'Marco Casadei avviò il laboratorio nel 1972; il figlio Nicola continua il mestiere «da padre in figlio».',
      eventi: [{ data: '1972', descrizione: 'Avvio del laboratorio per opera di Marco Casadei.', fonti: [F.casChi] }],
      fonti: [F.casChi, F.casRip],
    };
    b.attendibilita.segnalazioni.push(segn('Cellulare 320 630 8462 pubblicato dal sito accanto al numero fisso. L’assistenza Perseo è dichiarata dall’attività: il produttore non la include nell’elenco ufficiale dei centri di riparazione, nessuna autorizzazione attribuita.'));
  });

// Cotifava (Mantova): pendoleria/orologi da tasca, storia 1946 con variante 1974, marchi.
arricchisci('orologeria-cotifava-dal-1946-mantova',
  'Espansione lotto 1 (candidato duplicato, scheda arricchita): aggiunti pendoleria e orologi da tasca; storia familiare dalle radici 1946 con la variante 1974 del registro lombardo delle attività storiche; marchi Perseo (concessionario dichiarato) e revisioni complete dichiarate su Rolex, Jaeger-LeCoultre, Cartier e IWC.',
  [F.cotSto, F.cotLom, F.cotVdm],
  (b) => {
    for (const s of ['pendoleria', 'orologi-tasca']) aggiungiServizio(b, s, [F.cotSto]);
    aggiungiMarca(b, 'venduti', 'Perseo', [F.cotSto]);
    for (const m of ['Rolex', 'Jaeger-LeCoultre', 'Cartier', 'IWC']) aggiungiMarca(b, 'riparati', m, [F.cotSto]);
    b.storia = {
      annoFondazione: null, fondatore: null,
      testo: 'La storia aziendale fa risalire le radici dell’attività familiare al 1946, con Wassili Cotifava e Angiolino, fino ad Alessandro; il registro delle attività storiche lombarde associa al laboratorio l’anno 1974.',
      eventi: [
        { data: '1946', descrizione: 'Radici dell’attività familiare narrate dal sito.', fonti: [F.cotSto] },
        { data: '1974', descrizione: 'Anno associato al laboratorio dal registro delle attività storiche lombarde.', fonti: [F.cotLom] },
      ],
      fonti: [F.cotSto, F.cotLom],
    };
    b.attendibilita.segnalazioni.push(segn('Variante cronologica: radici familiari 1946 (sito) contro anno 1974 associato al laboratorio dal registro lombardo delle attività storiche. Concessionario Perseo e revisioni complete su Rolex, Jaeger-LeCoultre, Cartier e IWC sono dichiarazioni dell’attività: nessuna autorizzazione dei marchi inserita nei campi ufficiali.'));
  });

// Di Liddo (Biella): compravendita usati, test impermeabilità, storia e dichiarazioni di certificazione.
arricchisci('orologiaio-di-liddo-biella',
  'Espansione lotto 1 (candidato duplicato, scheda arricchita): aggiunti vendita usati e test di impermeabilità; storia dichiarata (oltre 30 anni di laboratorio, tradizione padre-figlio); marchi riparati dichiarati dal sito con la qualifica autodichiarata di «centro assistenza certificato» non confermata dai produttori.',
  [F.dilLab],
  (b) => {
    aggiungiServizio(b, 'vendita-usati', [F.dilLab]);
    b.altriServizi.push({ nome: 'Test di impermeabilità', fonti: [F.dilLab] });
    for (const m of ['Omega', 'Cartier', 'Baume & Mercier', 'TAG Heuer', 'Longines', 'Tissot', 'Rado', 'Mido', 'Hamilton']) aggiungiMarca(b, 'riparati', m, [F.dilLab]);
    b.storia = {
      annoFondazione: null, fondatore: null,
      testo: 'Il sito dichiara oltre trent’anni di laboratorio e una tradizione familiare trasmessa da padre in figlio.',
      eventi: [],
      fonti: [F.dilLab],
    };
    b.attendibilita.segnalazioni.push(segn('Il sito si dichiara «Centro Assistenza Certificato» per Omega, Cartier, Baume & Mercier, TAG Heuer, Longines, Tissot, Rado, Mido e Hamilton: autodichiarazione non verificata con locator dei produttori, non inserita fra le autorizzazioni confermate.'));
  });

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| località:', d.localita.length, '| fonti totali:', d.fonti.length);
