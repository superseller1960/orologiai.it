// Audit gruppo 6 — Lotto 5 Nord-Est ed Emilia (15 schede), 27 ottobre 2026.
// Correzioni e integrazioni verificate con fonti primarie (siti ufficiali, store locator dei marchi, Unioncamere).
// Uso: node scripts/audit-gruppo6-20261027.mjs
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
  const prima = b.servizi.length;
  b.servizi = b.servizi.filter((s) => s.id !== id);
  return prima - b.servizi.length;
};
const aggiungiServizio = (b, id, fonti) => {
  const s = b.servizi.find((x) => x.id === id);
  if (s) {
    for (const f of fonti) if (!s.fonti.includes(f)) s.fonti.push(f);
  } else {
    b.servizi.push({ id, fonti: [...fonti] });
  }
};

// 1. Astrua 1860 (Piacenza): Patek Philippe spostato sulla fonte corretta; Omega e Tudor riparati documentati;
//    passaggio di conduzione 1993; autodichiarazione Rolex segnalata.
const fAstAssist = nuovaFonte('l6-www-astrua-com-it-assistenza-ufficiale-astrua', 'https://www.astrua.com/it/assistenza-ufficiale-astrua', 'Sito Astrua — assistenza ufficiale');
const astrua = get('astrua-piacenza');
const patek = marca(astrua, 'riparati', 'Patek Philippe');
patek.fonti = [fAstAssist];
aggiungiMarca(astrua, 'riparati', 'Omega', ['l5-www-astrua-com-it-riparazione-orologi-piacenza']);
aggiungiMarca(astrua, 'riparati', 'Tudor', ['l5-www-astrua-com-it-riparazione-orologi-piacenza']);
astrua.storia.eventi.push({
  data: '1993',
  descrizione: 'Passaggio della conduzione dalla famiglia Astrua a Valter Franco Ricci, orologiaio formatosi in laboratori svizzeri.',
  fonti: ['l5-www-astrua-com-it-riparazione-orologi-piacenza'],
});
cronologia(astrua,
  'Audit gruppo 6: fondazione 1860 a Torino per opera di Vincenzo Astrua, servizi tecnici (valutazione, restauro, riparazione, revisione) confermati; Patek Philippe riattribuito alla pagina di assistenza ufficiale, aggiunti Omega e Tudor fra i marchi riparati e documentato il passaggio di conduzione del 1993.',
  ['l5-www-astrua-com-it-riparazione-orologi-piacenza', 'l5-www-astrua-com-it-sedi-astrua-boutiques-piacenza', fAstAssist]);
segnalazione(astrua, 'La boutique si presenta come concessionario ufficiale Rolex e la pagina di assistenza menziona Rolex e Patek Philippe: qualifiche autodichiarate, non inserite tra le autorizzazioni confermate in assenza di fonti primarie dei marchi.');

// 2. Orologeria Clementi (Bolzano): rimosso il claim «ricambi»; marchi degli esempi di lavorazione riclassificati.
const cle = get('orologeria-clementi-bolzano');
const rimossi = rimuoviServizio(cle, 'ricambi');
spostaMarca(cle, 'riparati', 'menzionati', 'Zenith', []);
spostaMarca(cle, 'riparati', 'menzionati', 'Rolex', []);
cle.storia.testo = 'Il sito documenta un’attività familiare di orologiai tramandata da tre generazioni, con oltre trentacinque anni di esperienza tecnica nella riparazione e nel restauro a Bolzano.';
cronologia(cle,
  `Audit gruppo 6: indirizzo, telefono, tre generazioni e oltre 35 anni di esperienza confermati; rimosso il claim «ricambi» (il sito dichiara l’uso di ricambi originali, non la loro vendita, ${rimossi} servizio/i rimosso/i) e riclassificati Zenith e Rolex fra i marchi menzionati (esempi di lavorazione, non un elenco di marchi riparati).`,
  ['l5-www-orologiaio-clementi-it', 'l5-www-orologiaio-clementi-it-chi-siamo-revisione-e-restaur', 'l5-www-orologiaio-clementi-it-chi-siamo-infoline']);
segnalazione(cle, 'Il nome «Christian Clementi» non è riscontrato nel testo delle pagine lette in relazione ai 35 anni di esperienza: attribuzione rimossa dalla storia fino a nuova evidenza.');

// 3. Gioielleria Ranzi (Bolzano): rivendita ufficiale Omega dalla scheda del marchio; incertezze registrate.
const fOmega = nuovaFonte('l6-www-omegawatches-com-store-storedetails-3962', 'https://www.omegawatches.com/store/storedetails/3962', 'Omega — scheda rivenditore Ranzi, Bolzano', 'marchio-ufficiale');
const ranzi = get('gioielleria-ranzi-bolzano');
aggiungiMarca(ranzi, 'venduti', 'Omega', [fOmega]);
aggiungiMarca(ranzi, 'rivenditaUfficiale', 'Omega', [fOmega]);
cronologia(ranzi,
  'Audit gruppo 6: indirizzo Via Museo 14/B, telefono e rivendita ufficiale Omega confermati dalla scheda ufficiale del marchio; aggiornata la fonte del marchio Omega.',
  [fOmega, 'l5-www-ranzi-com-it-home']);
segnalazione(ranzi, 'Il sito ranzi.com non è risultato raggiungibile in questa sessione (timeout su home, riparazioni e pagina storica «140»): fondazione 1884, Josef Ranzi, quinta generazione ed email info@ranzi.com non ricontrollabili, mantenuti con le fonti già registrate. L’irraggiungibilità non è prova di chiusura.');
segnalazione(ranzi, 'Il riferimento Mido registrato è il locator generico del marchio, non una scheda specifica della sede: rivendita Mido da approfondire con una fonte specifica.');
segnalazione(ranzi, 'Vendita di Breitling, IWC, Longines e Tissot non ricontrollabile in sessione per l’irraggiungibilità del sito: dati mantenuti con le fonti già registrate.');

// 4. V. Gasser (Brunico): Hamilton come Official Service Center documentato; 150º anniversario e quinta generazione.
const fHamGass = nuovaFonte('l6-www-hamiltonwatch-com-brunico-v-gasser', 'https://www.hamiltonwatch.com/en-us/store-locator/italy/no-region/brunico/v-gasser-kg-sas-des-gasser-h-co', 'Hamilton — scheda Official Service Center V. Gasser, Brunico', 'marchio-ufficiale');
const fCamcom = nuovaFonte('l6-www-camcom-bz-it-giornale-v-gasser', 'https://www.camcom.bz.it/it/novit%C3%A0/giornale/v-gasser', 'Camera di commercio di Bolzano — V. Gasser 150º anniversario', 'stampa');
const gass = get('v-gasser-brunico');
spostaMarca(gass, 'venduti', 'assistenzaUfficiale', 'Hamilton', [fHamGass]);
aggiungiMarca(gass, 'riparati', 'Hamilton', [fHamGass]);
gass.storia.eventi.push({
  data: '2023',
  descrizione: '150º anniversario dell’attività; conduzione passata alla quinta generazione, Caroline e Carmen Gasser.',
  fonti: [fCamcom],
});
cronologia(gass,
  'Audit gruppo 6: recapiti, tradizione dal 1873, laboratorio con tre maestri orologiai, servizi e rivendita ufficiale Longines confermati; la scheda Hamilton qualifica V. Gasser Official Service Center (autorizzazione documentata dal marchio), mentre la vendita Hamilton non è attestata: marchio spostato fra le assistenze ufficiali.',
  ['l5-it-vgasser-it-pages-kontakt', 'l5-it-vgasser-it-pages-werkstatt', 'l5-www-longines-com-it-store-id-vgasser-kgsas-des-gasser-h', fHamGass, fCamcom]);

// 5. Gioielleria Cernigoi (Monfalcone): valutazioni documentate; ambiguità sulle autorizzazioni segnalate.
const cer = get('gioielleria-cernigoi-monfalcone');
aggiungiServizio(cer, 'valutazioni', ['l5-www-gioielleriacernigoi-com-chisiamo']);
for (const m of ['TAG Heuer', 'Tudor', 'Omega', 'Cartier']) {
  aggiungiMarca(cer, 'menzionati', m, ['l5-www-gioielleriacernigoi-com-chisiamo']);
}
cronologia(cer,
  'Audit gruppo 6: fondazione 1937 per opera di Antonio Cernigoi da un precedente laboratorio orologiaio, indirizzo, email e servizi di revisione, riparazione e restauro confermati; aggiunte le valutazioni con analisi gemmologica e integrati i marchi menzionati (TAG Heuer, Tudor, Omega, Cartier per il secondo polso).',
  ['l5-www-gioielleriacernigoi-com-chisiamo', 'l5-www-gioielleriacernigoi-com-privacy-policy']);
segnalazione(cer, 'Il sito dichiara di essere «o di essere stato» rivenditore autorizzato di Rolex, Zenith, Longines, TAG Heuer e IWC: formulazione ambigua che non consente di qualificare autorizzazioni attuali; nessuna autorizzazione inserita nei campi ufficiali.');
segnalazione(cer, 'La pagina privacy-policy contiene testo estraneo (riferimenti a una società di make-up e cosmetica con sede in Polonia): incongruenza della pagina, non un dato dell’attività.');

// 6. S.T.S. Laboratorio (Conegliano): autodichiarazione «assistenza autorizzata» segnalata; storia integrata.
const sts = get('sts-laboratorio-orologeria-conegliano');
for (const m of ['Hamilton', 'Calvin Klein', 'TAG Heuer']) {
  aggiungiMarca(sts, 'menzionati', m, ['l5-stsorologeria-jimdoweb-com']);
}
sts.storia.testo = 'Il laboratorio dichiara attività a Conegliano dal 1985 e documenta nel febbraio 2017 l’unione tra l’attività dell’orologiaio Andrea Modenese e quella di Antonio Cremonese, con la nascita del nuovo laboratorio.';
const ev2017 = sts.storia.eventi.find((e) => e.data === '2017');
if (ev2017) ev2017.descrizione = 'Unione tra l’attività dell’orologiaio Andrea Modenese e quella di Antonio Cremonese, con la nascita del nuovo laboratorio.';
cronologia(sts,
  'Audit gruppo 6: indirizzo Viale Friuli 45, telefono, attività dal 1985 e unione del febbraio 2017 confermati dal sito; integrata la storia con il ruolo di Antonio Cremonese e aggiunti fra i marchi menzionati Hamilton, Calvin Klein e TAG Heuer.',
  ['l5-stsorologeria-jimdoweb-com', 'l5-stsorologeria-jimdoweb-com-il-nostro-laboratorio', 'l5-stsorologeria-jimdoweb-com-contatti']);
segnalazione(sts, 'Il sito si dichiara «assistenza autorizzata» per Omega, Longines, Tissot, Rado, Certina, Hamilton, Calvin Klein e TAG Heuer, ma le formulazioni fra homepage e descrizione non coincidono e mancano fonti primarie dei marchi: nessuna autorizzazione inserita nei campi ufficiali.');

// 7. Gioielleria Da Rios (Conegliano): conferme; pagine interne non esistenti.
cronologia(get('gioielleria-da-rios-conegliano'),
  'Audit gruppo 6: fondazione 1958, indirizzo, telefono, email e servizi di riparazione/revisione meccanici e quarzo, pile e cinturini confermati dalla homepage ufficiale; i percorsi /chi-siamo/ e /contatti/ restituiscono 404, la scheda cita correttamente la sola homepage.',
  ['l5-www-gioielleriadarios-it']);

// 8. Nitta Gioielli (Pordenone): rivendita ufficiale Hamilton documentata; discrepanze recapiti segnalate.
const nit = get('nitta-gioielli-pordenone');
aggiungiMarca(nit, 'rivenditaUfficiale', 'Hamilton', ['l5-www-hamiltonwatch-com-it-it-store-locator-italie-friuli']);
aggiungiServizio(nit, 'cinturini', ['l5-www-longines-com-it-store-id-nitta-gioielli-srl-pordenon']);
aggiungiServizio(nit, 'manutenzione', ['l5-www-longines-com-it-store-id-nitta-gioielli-srl-pordenon']);
cronologia(nit,
  'Audit gruppo 6: rivendita ufficiale Longines e Hamilton confermate dalle schede ufficiali dei marchi (Hamilton qualifica esplicitamente la sede «rivenditore ufficiale»); corner Montblanc con orologi confermato dalla pagina contatti.',
  ['l5-nittagioielli-com-contatti', 'l5-www-longines-com-it-store-id-nitta-gioielli-srl-pordenon', 'l5-www-hamiltonwatch-com-it-it-store-locator-italie-friuli']);
segnalazione(nit, 'Telefono discordante: il sito dell’attività riporta +39 0434 522554, i locator Longines e Hamilton riportano 0432/507504.');
segnalazione(nit, 'Email variante: info@nittagioielli.com (sito e Longines) contro pordenone@nittagioielli.com (Hamilton).');
segnalazione(nit, 'Civico variante: Corso Vittorio Emanuele II 15 (sito) contro 15/b (locator Longines e Hamilton).');
segnalazione(nit, 'Il corner Montblanc del punto vendita non è qualificato dal sito come rivendita ufficiale Montblanc.');

// 9. Gioielleria Zambon 1934 (Pordenone): servizi confermati; recapiti non ricontrollabili in sessione.
const zam = get('gioielleria-zambon-1934-pordenone');
cronologia(zam,
  'Audit gruppo 6: attività dal 1934 e servizi per gli orologi (cambio pila, cinturino, riparazioni, sostituzione movimento, revisioni) confermati dalla homepage ufficiale.',
  ['l5-www-gioielleriazambon-it']);
segnalazione(zam, 'Indirizzo, telefono ed email non ricontrollabili nel testo leggibile della homepage in questa sessione (estrazione limitata); le pagine interne /assistenza/ e /contatti/ restituiscono 404. Dati mantenuti con le fonti già registrate.');

// 10. Camparini Gioielli (Reggio nell’Emilia): fondatore documentato; Tudor riclassificato; autodichiarazione Rolex segnalata.
const cam = get('camparini-gioielli-reggio-emilia');
cam.storia.fondatore = 'Cherubino Camparini';
cam.storia.testo = 'La tradizione familiare dura da cinque generazioni: il fondatore Cherubino Camparini iniziò come artigiano di orologi e pendole e l’attività passò dalla riparazione al commercio nel 1910.';
spostaMarca(cam, 'venduti', 'menzionati', 'Tudor', []);
cronologia(cam,
  'Audit gruppo 6: indirizzo, recapiti e storia (cinque generazioni, fondatore Cherubino Camparini, passaggio dalla riparazione al commercio nel 1910) confermati dal sito; sezione Vintage e canale Rolex Certified Pre-Owned confermano il secondo polso; Tudor compare solo nel menu del sito, marchio spostato fra i menzionati.',
  ['l5-www-camparinigioielli-com-chi-siamo', 'l5-www-camparinigioielli-com-rolex-camparini-gioielli-136']);
segnalazione(cam, 'La scheda Rolex del sito dichiara Camparini rivenditore autorizzato Rolex, Rolex Certified Pre-Owned e Service Center: autodichiarazione su dominio proprio, non inserita tra le autorizzazioni confermate (pagine ufficiali Rolex non verificabili in sessione).');
segnalazione(cam, 'Secondo telefono 0522 442184 presente nella pagina chi-siamo oltre allo 0522 434693.');

// 11. Cadoppi (Reggio nell’Emilia): storia documentata da Unioncamere.
const fUn = nuovaFonte('l6-www-unioncamere-gov-it-imprese-storiche-cadoppi-snc', 'https://www.unioncamere.gov.it/imprese-storiche/cadoppi-snc', 'Unioncamere — scheda impresa storica Cadoppi Snc', 'directory');
const cad = get('cadoppi-reggio-emilia');
cad.storia = {
  annoFondazione: 1922,
  fondatore: null,
  testo: 'Unioncamere registra l’avvio dell’attività Cadoppi nel 1922, con sede storica a Castelnovo di Sotto; il negozio di Reggio nell’Emilia è attivo dal 2009.',
  eventi: [
    { data: '1922', descrizione: 'Avvio dell’attività Cadoppi, con sede storica a Castelnovo di Sotto.', fonti: [fUn] },
    { data: '2009', descrizione: 'Apertura del punto vendita di Reggio nell’Emilia.', fonti: [fUn] },
  ],
  fonti: [fUn],
};
cronologia(cad,
  'Audit gruppo 6: indirizzo, telefono ed email confermati dai locator ufficiali Mido e Tissot; rivendite ufficiali Mido e Tissot riconfermate dalle schede specifiche dei marchi; integrata la storia documentata da Unioncamere (avvio 1922, sede storica a Castelnovo di Sotto, Reggio nell’Emilia dal 2009).',
  ['l5-www-midowatches-com-it-store-locator-italy-reggio-emilia', 'l5-www-tissotwatches-com-it-it-store-cadoppi-snc-a1vnn00000', fUn]);
segnalazione(cad, 'Il sito proprio non ha restituito testo leggibile in sessione: laboratorio e servizi di riparazione non confermati per la sede di Reggio nell’Emilia. Unioncamere cita riparazioni di orologi e gioielli nella storia dell’attività originaria, dato non sufficiente a qualificare un laboratorio attuale.');

// 12. Giberti Preziosi (Ferrara): contenuto non leggibile meccanicamente; incertezza registrata.
const gib = get('giberti-preziosi-ferrara');
cronologia(gib,
  'Audit gruppo 6: pagine del sito raggiungibili (HTTP 200); il titolo della pagina contatti riporta «Restauro orologi e gioielli | Ferrara, FE | Giberti Preziosi», coerente con le specializzazioni pubblicate. Contenuto del corpo non leggibile meccanicamente (sito costruito con widget).',
  ['l5-www-gibertipreziosi-it', 'l5-www-gibertipreziosi-it-contatti', 'l5-www-gibertipreziosi-it-riparazioni']);
segnalazione(gib, 'Recapiti, anno di fondazione e servizi non ricontrollabili in questa sessione per l’impossibilità di estrarre il testo delle pagine: dati mantenuti con le fonti già registrate, da riesaminare con una verifica alternativa.');

// 13. Gioielleria Pretolani (Forlì): Omega riclassificato; certificazione del laboratorio segnalata.
const pre = get('gioielleria-pretolani-forli');
spostaMarca(pre, 'riparati', 'menzionati', 'Omega', []);
pre.storia.testo = 'Fondata nel 1945, l’attività apre il primo punto vendita forlivese nel 1967, si trasferisce in Via Tevere 77 nel 1985 e nel 2018 rinnova il negozio presentando il laboratorio orologiero interno.';
pre.storia.eventi.push({
  data: '1985',
  descrizione: 'Trasferimento del punto vendita nell’attuale sede di Via Tevere 77.',
  fonti: ['l5-www-gioielleriapretolani-it'],
});
cronologia(pre,
  'Audit gruppo 6: indirizzo, telefono, email e cronologia (fondazione 1945, primo punto vendita forlivese 1967, trasferimento in Via Tevere 77 nel 1985, laboratorio rinnovato nel 2018) confermati dal sito; per OMEGA il sito dichiara solo la sostituzione di bracciali e cinturini: marchio spostato fra i menzionati.',
  ['l5-www-gioielleriapretolani-it', 'l5-www-gioielleriapretolani-it-laboratorio-orologiero', 'l5-www-gioielleriapretolani-it-contatti']);
segnalazione(pre, 'Il sito dichiara il laboratorio certificato 1° e 2° livello per LONGINES, TISSOT e HAMILTON: autodichiarazione dell’attività, non inserita fra le assistenze ufficiali confermate in assenza di fonti primarie dei marchi.');

// 14. Orologeria Reggiani (Modena): cronologia integrata; recapiti confermati.
const reg = get('orologeria-reggiani-modena');
reg.storia.testo = 'Il sito aziendale documenta la nascita dell’Orologeria Reggiani a Modena nel 1962 in Via Ciro Menotti, con trasferimento nell’attuale sede di Via Bartolomeo de’ Polli nel 1989.';
reg.storia.eventi.push({
  data: '1989',
  descrizione: 'Trasferimento nell’attuale sede di Via Bartolomeo de’ Polli.',
  fonti: ['l5-www-orologeriareggiani-it-chi-siamo'],
});
cronologia(reg,
  'Audit gruppo 6: telefono 059 305184, email gymmireggiani@gmail.com (grafia confermata), fondazione 1962 e laboratorio interno per orologi da polso, da tavolo, sveglie e pendoli confermati dal sito; integrato il trasferimento del 1989 e documentati preventivi gratuiti e interventi a domicilio.',
  ['l5-www-orologeriareggiani-it', 'l5-www-orologeriareggiani-it-chi-siamo', 'l5-www-orologeriareggiani-it-contatti']);

// 15. Dobner (Gorizia): acquisizione De Savorgnani precisata; marchi della sede non confermati.
const dob = get('dobner-gorizia');
dob.storia.testo = 'La sede Dobner di Gorizia nasce nel 2007 dall’acquisizione della storica ditta De Savorgnani ed è presente in Corso Italia dal 2007.';
cronologia(dob,
  'Audit gruppo 6: indirizzo, telefono, email e attivazione dal 2007 confermati dalla pagina ufficiale della sede; precisata la formula di nascita della sede (acquisizione della storica ditta De Savorgnani); assistenza tramite laboratorio autorizzato confermata.',
  ['l5-dobner-it-it-negozi-dobner-gorizia']);
segnalazione(dob, 'L’elenco dei marchi specifico per la sede di Gorizia non è confermato: la sezione «Marchi prestigiosi» non espone un elenco leggibile per quella sede e i marchi della homepage di gruppo non sono automaticamente trattati a Gorizia.');

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| fonti totali:', d.fonti.length);
