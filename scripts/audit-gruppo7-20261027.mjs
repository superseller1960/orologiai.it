// Audit gruppo 7 — Lotto 8 (11 schede da verificare + approfondimenti residui), 27 ottobre 2026.
// Correzioni e integrazioni verificate con fonti primarie (siti ufficiali, locator dei marchi, schede istituzionali).
// Uso: node scripts/audit-gruppo7-20261027.mjs
import fs from 'node:fs';

const file = new URL('../site/data/directory.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const oggi = '2026-10-27';

const nuovaFonte = (id, url, titolo, tipo = 'sito-ufficiale') => {
  if (!d.fonti.some((f) => f.id === id)) {
    d.fonti.push({ id, tipo, url, titolo, consultataIl: oggi, percorsoArchivio: null, licenza: null });
  }
  return id;
};

const get = (id) => {
  const b = d.attivita.find((x) => x.id === id);
  if (!b) throw new Error(`scheda mancante: ${id}`);
  return b;
};

const cronologia = (b, azione, fonti) => {
  b.attendibilita.cronologia.push({ data: oggi, azione, fonti });
  b.attendibilita.verificataIl = oggi;
  for (const f of fonti) if (!b.attendibilita.fonti.includes(f)) b.attendibilita.fonti.push(f);
};
const segnalazione = (b, motivo) => {
  b.attendibilita.segnalazioni.push({ data: oggi, motivo, stato: 'aperta' });
};
const marca = (b, lista, nome) => b.marchi[lista].find((x) => x.marca === nome);
const spostaMarca = (b, da, a, nome, fonti) => {
  const m = marca(b, da, nome);
  if (!m) throw new Error(`${b.id}: marca ${nome} non presente in ${da}`);
  b.marchi[da] = b.marchi[da].filter((x) => x.marca !== nome);
  const esistente = marca(b, a, nome);
  if (esistente) {
    for (const f of [...m.fonti, ...fonti]) if (!esistente.fonti.includes(f)) esistente.fonti.push(f);
  } else {
    b.marchi[a].push({ marca: nome, fonti: [...new Set([...m.fonti, ...fonti])] });
  }
};
const aggiungiMarca = (b, lista, nome, fonti) => {
  const esistente = marca(b, lista, nome);
  if (esistente) {
    for (const f of fonti) if (!esistente.fonti.includes(f)) esistente.fonti.push(f);
  } else {
    b.marchi[lista].push({ marca: nome, fonti: [...fonti] });
  }
};
const rimuoviServizio = (b, id) => {
  b.servizi = b.servizi.filter((s) => s.id !== id);
};
const aggiungiServizio = (b, id, fonti) => {
  const s = b.servizi.find((x) => x.id === id);
  if (s) {
    for (const f of fonti) if (!s.fonti.includes(f)) s.fonti.push(f);
  } else {
    b.servizi.push({ id, fonti: [...fonti] });
  }
};

// 1. Laboratorio Orologiaio Srl (Marcianise): servizi corretti (orologi e bigiotteria, non gioielli); sito TLS-down.
const lab = get('laboratorio-orologiaio-marcianise');
lab.descrizione = 'Laboratorio Orologiaio Srl opera al Centro Orafo Il Tarì di Marcianise (Zona ASI Sud) come laboratorio tecnico per l’assemblaggio, la trasformazione, la riparazione, l’assistenza e la manutenzione di orologi di tutti i marchi, bigiotteria e articoli affini: il gruppo Diffusione Orologi vi si avvale per l’assistenza post-vendita, e vi convergono gli orologi in garanzia del marchio OPS.';
cronologia(lab,
  'Audit gruppo 7: indirizzo (Zona ASI Sud, Centro Orafo Il Tarì, modulo 169/823), telefono ed email confermati dalla scheda ufficiale del Centro Orafo Il Tarì; esperienza «risalente a vari decenni» da Diffusione Orologi; precisata la natura dei servizi (orologi, bigiotteria e articoli affini: la fonte non attestava la riparazione di gioielli).',
  ['e8-tari-it-azienda-laboratorio-orologiaio-srl', 'e8-diffusioneorologi-com-struttura']);
segnalazione(lab, 'Il sito proprio laboratorioorologiaio.it non è raggiungibile in sessione per un errore di certificato TLS: recapiti confermati dalla scheda del Centro Orafo Il Tarì.');
segnalazione(lab, 'La pagina OPS Objects di garanzia non ha restituito testo leggibile: il claim sugli orologi in garanzia OPS resta con la fonte già registrata, da ricontrollare.');

// 2. Gold Shine Gioielli (Portico di Caserta): conferme complete.
cronologia(get('gold-shine-portico-caserta'),
  'Audit gruppo 7: indirizzo, telefono, email, fondazione agli inizi degli anni Duemila per volontà di Antonietta Nacca e del figlio Antonio e laboratorio con riparazione/restauro di orologi di tutte le marche, pile, cinturini, gioielli e argenti confermati dal sito ufficiale; nessuna correzione necessaria.',
  ['e8-www-gioielleriagoldshine-com', 'e8-www-gioielleriagoldshine-com-chi-siamo']);

// 3. Gioielleria Merola — Orola (Santa Maria Capua Vetere): Seiko documentato; recapiti non ricontrollabili.
const fMerSeiko = nuovaFonte('l8-gioielleriamerola-it-assistenza-seiko-italia', 'https://gioielleriamerola.it/assistenza-seiko-italia/', 'Sito Gioielleria Merola — assistenza Seiko Italia');
const mer = get('gioielleria-merola-santa-maria-capua-vetere');
aggiungiMarca(mer, 'riparati', 'Seiko', [fMerSeiko]);
cronologia(mer,
  'Audit gruppo 7: rivenditorato Seiko riconfermato dalle pagine dedicate del sito (/seiko/, /assistenza-seiko-italia/), con riparazioni Seiko, eventuale invio al centro post-vendita ufficiale e garanzia di un anno sulle riparazioni del laboratorio.',
  ['e8-gioielleriamerola-it', fMerSeiko]);
segnalazione(mer, 'Recapiti e civico 213 non ricontrollabili in sessione: la pagina /contatti/ restituisce 404 e la scheda negozi Seiko risponde 403. Dati mantenuti con le fonti già registrate.');
segnalazione(mer, 'La scheda locale reteimprese è intestata a Piazza Agostino Di Monaco (Agorà): possibile variante di sede rispetto a Corso Aldo Moro 213, da verificare.');

// 4. Gioielleria Comentale (Angri): lucidatura rimossa; storia 1984/2001; denominazione non confermata.
const fComChi = nuovaFonte('l8-gioielleriacomentale-com-chi-siamo', 'https://gioielleriacomentale.com/chi-siamo/', 'Sito Gioielleria Comentale — chi siamo');
const com = get('gioielleria-comentale-angri');
rimuoviServizio(com, 'lucidatura');
com.storia = {
  annoFondazione: 1984,
  fondatore: null,
  testo: 'L’attività familiare è avviata nel 1984; il negozio di Corso Italia ad Angri è aperto dal 2001.',
  eventi: [
    { data: '1984', descrizione: 'Avvio dell’attività familiare.', fonti: [fComChi] },
    { data: '2001', descrizione: 'Apertura del negozio di Corso Italia ad Angri.', fonti: [fComChi] },
  ],
  fonti: [fComChi],
};
com.descrizione = 'Gioielleria Comentale in Corso Italia 124 ad Angri dispone di laboratorio di orologeria e laboratorio orafo: riparazione di orologi meccanici di marca, restyling di casse e bracciali e restauro di orologi d’epoca, oltre a lavorazioni su misura.';
cronologia(com,
  'Audit gruppo 7: indirizzo, telefono, email, laboratorio di orologeria (riparazione meccanici, restyling di casse e bracciali, restauro di orologi d’epoca) e laboratorio orafo confermati dal sito; integrata la storia (avvio 1984, negozio di Corso Italia dal 2001); rimosso il servizio «lucidatura», non menzionato dalla fonte.',
  ['e8-gioielleriacomentale-com-orologiaio', 'e8-gioielleriacomentale-com-laboratorio-orafo', fComChi]);
segnalazione(com, 'La denominazione «Gioielleria Comentale s.r.l. di Carmine Severino» non è confermata dal testo delle pagine lette: rimossa l’attribuzione dalla descrizione.');

// 5. Tarlociaru (Lecce): vendita non confermata, claim rimosso.
const tar = get('tarlociaru-lecce');
rimuoviServizio(tar, 'vendita');
tar.descrizione = 'Tarlociaru — Assistenza e Riparazione Orologi in Via Roberto di Biccari 9 a Lecce è laboratorio specializzato in assistenza e riparazione di orologi, condotto da Chris Ferrari.';
cronologia(tar,
  'Audit gruppo 7: indirizzo e telefono confermati dalla scheda Reteimprese (numero riportato senza prefisso internazionale); bio Instagram «Assistenza e Riparazione Orologi Lecce» di Chris Ferrari; rimosso il claim di vendita di segnatempo, non attestato dalle fonti aperte.',
  ['e8-www-reteimprese-it-orologi-produzione-commercio-lecce-az', 'e8-www-instagram-com-tarlociaru']);
segnalazione(tar, 'Vendita di segnatempo non confermata dalle fonti consultate: la sola categoria merceologica della scheda aggregatrice non prova la vendita al pubblico.');

// 6. L'Orologiaio (Taranto): pendoleria e marchi riparati documentati; «preventivo gratuito» rimosso.
const oro = get('lorologiaio-taranto');
aggiungiServizio(oro, 'pendoleria', ['e8-orologiaiostore-it-riparazioni-orologi-taranto']);
for (const m of ['Rolex', 'Audemars Piguet', 'Patek Philippe', 'Cartier', 'Panerai', 'Baume & Mercier', 'Girard-Perregaux', 'Omega']) {
  aggiungiMarca(oro, 'riparati', m, ['e8-orologiaiostore-it-riparazioni-orologi-taranto']);
}
oro.storia = {
  annoFondazione: 2001,
  fondatore: null,
  testo: 'Il sito documenta l’attività dal 2001 come negozio di orologi e gioielli, con vendita e riparazione di orologi moderni e d’epoca.',
  eventi: [{ data: '2001', descrizione: 'Avvio dell’attività a Taranto.', fonti: ['e8-orologiaiostore-it'] }],
  fonti: ['e8-orologiaiostore-it'],
};
oro.descrizione = 'L’Orologiaio in Viale Liguria 84/B a Taranto, con seconda sede in Via Molise 10/c, è negozio e laboratorio per la riparazione di orologi di ogni marca e tipologia — meccanici, al quarzo, pendoli e cucù — con revisione, controllo dell’impermeabilità, rifacimento quadranti, messa a nuovo di casse e bracciali, restauro conservativo di orologi antichi e vendita di orologi e gioielli.';
cronologia(oro,
  'Audit gruppo 7: attività dal 2001, vendita e riparazione di orologi moderni e d’epoca confermati dal sito; integrati i servizi documentati (pendoli e cucù, revisione, controllo impermeabilità, rifacimento quadranti, messa a nuovo casse e bracciali, restauro conservativo) e i marchi citati dalla pagina riparazioni; rimosso «preventivo gratuito», non confermato.',
  ['e8-orologiaiostore-it', 'e8-orologiaiostore-it-riparazioni-orologi-taranto']);
segnalazione(oro, 'Telefono, indirizzo Viale Liguria 84/B e seconda sede Via Molise 10/c non ricontrollabili nel testo delle pagine aperte in sessione: dati mantenuti con le fonti già registrate.');

// 7. Vitrani Gioielliere (Barletta): conferme; nessuna qualifica Hamilton ufficiale.
const fVitCon = nuovaFonte('l8-vitranigioielliere-it-contatti', 'https://vitranigioielliere.it/contatti/', 'Sito Vitrani Gioielliere — contatti');
const fVitSto = nuovaFonte('l8-vitranigioielliere-it-la-nostra-storia', 'https://vitranigioielliere.it/la-nostra-storia/', 'Sito Vitrani Gioielliere — la nostra storia');
const vit = get('vitrani-gioiellieri-barletta');
vit.contatti.fonti = [...new Set([...vit.contatti.fonti, fVitCon])];
vit.posizione.fonti = [...new Set([...vit.posizione.fonti, fVitCon])];
vit.storia.testo = 'Il sito ufficiale documenta l’avvio dell’attività nel 1969, tramandata di padre in figlio, con oltre cinquant’anni nel settore gioielli e orologi.';
vit.storia.fonti = [...new Set([...vit.storia.fonti, fVitSto])];
cronologia(vit,
  'Audit gruppo 7: indirizzo, telefono ed email confermati dalla pagina contatti; attività dal 1969 tramandata di padre in figlio dalla pagina storia; marchi trattati confermati (Hamilton, Chantecler, Mano J e altri). Nessuna qualifica ufficiale Hamilton attribuita: il locator Hamilton per Barletta indica Landi Gioiellieri come Official Retailer.',
  [fVitCon, fVitSto, 'l8-www-vitranigioielliere-it']);

// 8. Raffa Maestro Orologiaio (Siracusa): marchi riparati integrati.
const raf = get('raffa-maestro-orologiaio-siracusa');
for (const m of ['Nautica', 'Sector', 'Breil']) {
  aggiungiMarca(raf, 'riparati', m, ['l8-www-facebook-com-raffamaestrorologiaio']);
}
cronologia(raf,
  'Audit gruppo 7: indirizzo Via Tevere 17 e telefono 0931 186829 confermati dalla scheda Guida Sicilia; integrati fra i marchi riparati Nautica, Sector e Breil dalla descrizione della pagina Facebook (Rolex, Omega, Zenith, Nautica, Sector, Breil, Breitling, Hamilton, Longines) con batterie e cinturini.',
  ['l8-siracusa-guidasicilia-it-azienda-siracusa-siracusa-orolo', 'l8-www-facebook-com-raffamaestrorologiaio']);

// 9. Digiesi 1959 Gioiellieri (Matera): Hamilton riclassificato centro assistenza ufficiale; email e sito integrati.
const fDigHam = nuovaFonte('l8-www-hamiltonwatch-com-matera-digiesi-1959-gioiellieri', 'https://www.hamiltonwatch.com/it-it/store-locator/italy/no-region/matera/digiesi-1959-gioiellieri', 'Hamilton — scheda centro assistenza Digiesi 1959 Gioiellieri, Matera', 'marchio-ufficiale');
const fDigCon = nuovaFonte('l8-gioielleriadigiesi-it-contatti', 'https://gioielleriadigiesi.it/contatti/', 'Sito Digiesi 1959 Gioiellieri — contatti');
const dig = get('gioielleria-digiesi-1959-matera');
dig.contatti.email = 'digiesigioiellieri@gmail.com';
dig.contatti.sito = 'https://gioielleriadigiesi.it/';
dig.contatti.fonti = [...new Set([...dig.contatti.fonti, fDigCon])];
// La scheda specifica Hamilton qualifica la sede «Centro Assistenza Ufficiale» (batteria e cinturino),
// non la definisce rivenditore: ruolo corretto secondo la fonte primaria del marchio.
dig.marchi.rivenditaUfficiale = dig.marchi.rivenditaUfficiale.filter((x) => x.marca !== 'Hamilton');
spostaMarca(dig, 'venduti', 'menzionati', 'Hamilton', []);
aggiungiMarca(dig, 'assistenzaUfficiale', 'Hamilton', [fDigHam]);
dig.descrizione = 'Digiesi 1959 Gioiellieri in Via Roma 6 a Matera è gioielleria fondata nel 1959 con assistenza tecnica per orologi: sostituzione batterie, cambio cinturini e riparazioni; la scheda ufficiale Hamilton la qualifica centro assistenza ufficiale del marchio.';
cronologia(dig,
  'Audit gruppo 7: recapiti confermati e integrati dal sito proprio (aggiunti email e sito web); la scheda specifica Hamilton qualifica la sede «Centro Assistenza Ufficiale» con sostituzione batteria e cinturino: qualifica corretta da rivenditore a centro assistenza ufficiale, con la fonte primaria del marchio.',
  [fDigHam, fDigCon, 'l8-www-hamiltonwatch-com-it-it-store-locator-italia-store-d']);
segnalazione(dig, 'L’Instagram dichiara «assistenza tecnica orologeria certificata Omega, Longines, Rado, Tissot, Hamilton»: solo Hamilton è documentato da fonte primaria del marchio; le altre qualifiche non sono inserite fra le autorizzazioni confermate.');
segnalazione(dig, 'La scheda PagineBianche non è leggibile in sessione (HTTP 403); riparazioni su gioielli non confermate dalle fonti lette.');

// 10. Fusco snc (Pescara): assistenza ufficiale Breil documentata dall'elenco centri di assistenza.
const fBreilCda = nuovaFonte('l8-www-breil-com-it-centri-di-assistenza', 'https://www.breil.com/it/centri-di-assistenza/', 'Breil — centri di assistenza ufficiali', 'marchio-ufficiale');
const fus = get('fusco-snc-pescara');
aggiungiMarca(fus, 'assistenzaUfficiale', 'Breil', [fBreilCda, 'l8-www-breil-com-store-assistenza-ricambi-fusco-snc']);
cronologia(fus,
  'Audit gruppo 7: indirizzo, telefono ed email confermati dalla scheda locator Breil «Assistenza e Ricambi»; inclusione nell’elenco ufficiale dei centri di assistenza Breil per l’Abruzzo (con fax 085 62879): aggiunta l’assistenza ufficiale Breil documentata dalla fonte del marchio.',
  ['l8-www-breil-com-store-assistenza-ricambi-fusco-snc', fBreilCda]);

// 11. Cheope (Benevento): email documentata; rivenditore Breil autorizzato riconfermato.
const che = get('cheope-benevento');
const cheBreil = che.marchi.rivenditaUfficiale.find((x) => x.marca === 'Breil')?.fonti[0] ?? 'e8-www-breil-com-store-rivenditori-reloaded-icons-gioieller';
che.contatti.email = 'furnoigino@tin.it';
che.contatti.fonti = [...new Set([...che.contatti.fonti, cheBreil])];
cronologia(che,
  'Audit gruppo 7: indirizzo e telefono/WhatsApp 0824 21479 confermati; laboratorio con sostituzione batterie, piccoli interventi in negozio, riparazioni di bracciali e collane, rinfilatura perle e saldatura laser confermati dall’articolo ufficiale; rivenditore Breil «Rivenditori Autorizzati» riconfermato dalla scheda del marchio; aggiunta l’email dalla scheda Breil.',
  ['e8-cheopebenevento-it-blogs-news-riparazioni-gioielli-orolo', cheBreil]);
segnalazione(che, 'Civico variante: Corso Garibaldi 239/245 (sito) contro 245 (scheda Breil); email presente solo sulla fonte Breil.');

// 12–13. Approfondimenti residui fase 9: locator dei marchi ancora bloccati.
segnalazione(get('gioielleria-galdi-salerno'),
  'Recontrollo del 27 ottobre 2026: i locator Rolex e IWC restituiscono ancora HTTP 403; le autorizzazioni dichiarate dall’attività restano da verificare con fonti primarie dei marchi.');
segnalazione(get('fratelli-gallo-cosenza'),
  'Recontrollo del 27 ottobre 2026: le pagine Rolex e Tudor restituiscono ancora HTTP 403; il ruolo dichiarato (rivenditore autorizzato e centro assistenza Rolex) resta in attesa di verifica primaria del produttore.');

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| fonti totali:', d.fonti.length);
