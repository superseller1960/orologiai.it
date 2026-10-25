// Lotto 3 di arricchimento (2026-10-25): copertura del resto del catalogo (102 attività
// esaminate su fonti ufficiali). Solo dati documentati; nessuna autorizzazione di marchio
// senza fonte del marchio; nessun dato storico sovrascritto (recapiti e orari solo se assenti).
// Uso: npx tsx scripts/integrate-lotto-03-20261025.ts (si rifiuta se già applicato).
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory, type Business } from '../site/src/lib/schema.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-25';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;
if (directory.fonti.some(f => f.id === 'f-www-cmcwatches-com-rivenditori')) {
  console.error('Lotto 3 già applicato: nessuna modifica.');
  process.exit(1);
}

type Tipo = 'sito-ufficiale' | 'marchio-ufficiale' | 'directory';
const nuove: { id: string; tipo: Tipo; url: string; titolo: string; consultataIl: string; percorsoArchivio: null; licenza: null }[] = [];
const anomalie: string[] = [];
// Registra (o riutilizza) la fonte per URL; l'id deriva dall'URL, il titolo da host e percorso.
const u = (url: string, tipo: Tipo = 'sito-ufficiale'): string => {
  const presente = directory.fonti.find(f => f.url === url);
  if (presente) return presente.id;
  const id = `f-${url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60).replace(/^-|-$/g, '')}`;
  if (!directory.fonti.some(f => f.id === id) && !nuove.some(f => f.id === id)) {
    const host = url.replace(/^https?:\/\//, '').split('/')[0];
    const path = url.replace(/^https?:\/\//, '').split('/').filter(Boolean).slice(1).join('/');
    nuove.push({ id, tipo, url, titolo: path ? `Fonte ${host} — ${path}` : `Fonte ${host}`, consultataIl: DATA, percorsoArchivio: null, licenza: null });
  }
  return id;
};
const byId = (id: string) => {
  const b = directory.attivita.find(x => x.id === id);
  if (!b) throw new Error(`Attività assente: ${id}`);
  return b;
};
const modificati: { id: string; campi: string[] }[] = [];
const toccato = (id: string, campo: string) => {
  const v = modificati.find(m => m.id === id);
  if (v) v.campi.push(campo); else modificati.push({ id, campi: [campo] });
};
// Recapiti: solo se il campo è vuoto; i recapiti storici non vengono mai sovrascritti.
const cont = (id: string, tel: string | null, mail: string | null, sito: string | null, ...fonti: string[]) => {
  const b = byId(id);
  if (tel && !b.contatti.telefono) b.contatti.telefono = tel;
  if (mail && !b.contatti.email) b.contatti.email = mail;
  if (sito && !b.contatti.sito) b.contatti.sito = sito;
  for (const f of fonti) if (!b.contatti.fonti.includes(f)) b.contatti.fonti.push(f);
  toccato(id, 'contatti');
};
// Orari: solo se assenti; fonti e schema come da convenzione (giorno 1=lunedì … 7=domenica).
const ore = (id: string, src: string, ...giorni: [number, ...string[]][]) => {
  const b = byId(id);
  if (b.orari.giorni.length) { anomalie.push(`${id}: orari già presenti, non sovrascritti.`); return; }
  b.orari.giorni = giorni.map(([giorno, ...fascie]) => ({
    giorno,
    intervalli: fascie.map(f => { const [apertura, chiusura] = f.split('-'); return { apertura, chiusura }; }),
  }));
  b.orari.verificatiIl = DATA;
  if (!b.orari.fonti.includes(src)) b.orari.fonti.push(src);
  toccato(id, 'orari');
};
const serv = (id: string, src: string, ...servizi: Business['servizi'][number]['id'][]) => {
  const b = byId(id);
  for (const s of servizi) if (!b.servizi.some(x => x.id === s)) { b.servizi.push({ id: s, fonti: [src] }); toccato(id, `servizio:${s}`); }
};
const marc = (id: string, ruolo: 'venduti' | 'riparati' | 'rivenditaUfficiale' | 'assistenzaUfficiale', marca: string, src: string) => {
  const b = byId(id);
  if (!b.marchi[ruolo].some(m => m.marca === marca)) { b.marchi[ruolo].push({ marca, fonti: [src] }); toccato(id, `marchio:${ruolo}:${marca}`); }
};

// --- Toscana e centro-nord ---
cont('scardi', '055 67 66 15', null, 'https://scardi.it/', u('https://scardi.it/contatti/'), u('https://scardi.it/servizi/'));
serv('scardi', u('https://scardi.it/servizi/'), 'pendoleria');
anomalie.push('scardi: email pubblicata in forma dubbia («acuistiscardi@ex.comgmail.com»): non inserita.');
cont('marretti', '+39 055 215603', null, null, u('https://www.cmcwatches.com/rivenditori/', 'marchio-ufficiale'));
cont('fani-gioielli', '+39 055 212075', 'shops@fanigioielli.it', null, u('https://www.fanishops.it/boutiques/'), u('https://www.fanishops.it/rolex/contatti/firenze/'));
ore('fani-gioielli', u('https://www.fanishops.it/boutiques/'), [1, '10:00-19:00'], [2, '10:00-19:00'], [3, '10:00-19:00'], [4, '10:00-19:00'], [5, '10:00-19:00'], [6, '10:00-19:00'], [7]);
serv('fani-gioielli', u('https://www.fanishops.it/rolex/contatti/firenze/'), 'revisione');
cont('bigalli', '055/212733', 'info@bigallifirenze.com', null, u('https://www.longines.com/en-us/store/id/bigalli-di-bolgi-giuseppe-c-snc-firenze-143385', 'marchio-ufficiale'));
ore('bigalli', u('https://www.longines.com/en-us/store/id/bigalli-di-bolgi-giuseppe-c-snc-firenze-143385', 'marchio-ufficiale'), [1, '08:30-18:30'], [2, '08:30-18:30'], [3, '08:30-18:30'], [4, '08:30-18:30'], [5, '08:30-18:30'], [6, '08:30-12:30'], [7]);
serv('bigalli', u('https://www.longines.com/en-us/store/id/bigalli-di-bolgi-giuseppe-c-snc-firenze-143385', 'marchio-ufficiale'), 'batterie', 'cinturini');
marc('bigalli', 'assistenzaUfficiale', 'Longines', u('https://www.longines.com/en-us/store/id/bigalli-di-bolgi-giuseppe-c-snc-firenze-143385', 'marchio-ufficiale'));
anomalie.push('bigalli: la qualifica «centro assistenza Longines» deriva dalla scheda ufficiale Longines.');
cont('senzatempo-firenze', '055.238.226', 'info@senzatempofirenze.it', null, u('https://www.senzatempofirenze.it/contatti/'), u('https://www.senzatempofirenze.it/orologeria-e-ricambi/'));
serv('senzatempo-firenze', u('https://www.senzatempofirenze.it/orologeria-e-ricambi/'), 'valutazioni', 'ricambi');
anomalie.push('senzatempo-firenze: pagina con due recapiti (335.447.429 e 055.238.226): inserito il numero fisso.');
anomalie.push('sangalli: recapiti e orari disponibili solo come estratti indicizzati, non letti dalla pagina: non inseriti.');
cont('pisani-scandicci-matteotti', '055 250228', null, null, u('https://www.pisanigioielleria.com/pisani-gioielleria-piazza-giacomo-matteotti-scandicci'));
cont('pisani-scandicci-maschera', '055 252598', null, null, u('https://www.pisanigioielleria.com/pisani-gioielleria-galleria-la-maschera-scandicci'));
cont('maggini-sesto', '055 4489197', 'oreficeria.maggini@gmail.com', null, u('https://www.oreficeriamaggini.com/contatti'));
ore('maggini-sesto', u('https://www.oreficeriamaggini.com/contatti'), [2, '09:00-13:00', '16:00-19:30'], [3, '09:00-13:00', '16:00-19:30'], [4, '09:00-13:00', '16:00-19:30'], [5, '09:00-13:00', '16:00-19:30'], [6, '09:00-13:00', '16:00-19:30']);
cont('rutili-empoli', '+39 0571 74690', 'rutiligioielleria@virgilio.it', null, u('https://www.gioielleriaempoli.it/contatti/'));
anomalie.push('rutili-empoli: pagine ufficiali con errori di accesso durante la consultazione: servizi non inseriti.');
cont('ficioro-empoli', '+39 0571 72465', 'info@ficioro.it', 'https://www.ficioro.it/', u('https://www.ficioro.it/chi-siamo/'), u('https://www.ficioro.it/servizio-orologeria/'));
serv('ficioro-empoli', u('https://www.ficioro.it/servizio-orologeria/'), 'riparazione', 'revisione', 'vendita', 'batterie');
anomalie.push('ficioro-empoli: orari pubblicati senza giorni di riferimento: non inseriti.');
cont('agnolucci-signa', '055 8734483', null, 'https://www.agnoluccigioielleria.com/', u('https://www.agnoluccigioielleria.com/contatti/'));
serv('agnolucci-signa', u('https://www.agnoluccigioielleria.com/contatti/'), 'riparazione', 'vendita');
cont('agnolucci-poggio', '055 877485', null, 'https://www.agnoluccigioielleria.com/', u('https://www.agnoluccigioielleria.com/poggio-a-caiano/'));
serv('agnolucci-poggio', u('https://www.agnoluccigioielleria.com/poggio-a-caiano/'), 'riparazione', 'vendita');
anomalie.push('agnolucci (Signa e Poggio a Caiano): orari stagionali (invernale/estivo) non rappresentabili: non inseriti.');
cont('ora-di-piazza-bagno', '055 632549', null, null, u('https://orologicalamai.com/rivenditori/', 'marchio-ufficiale'));
cont('follie-oro-calenzano', '3429132156', null, 'https://www.folliedoro.it/', u('https://www.folliedoro.it/'));
serv('follie-oro-calenzano', u('https://www.folliedoro.it/'), 'riparazione', 'batterie', 'cinturini', 'vendita');
anomalie.push('follie-oro-calenzano: valutazioni dichiarate su oro usato e lucidatura su gioielli: non inserite fra i servizi di orologeria.');
cont('renzopreziosi-figline', '055 7098034', null, 'https://www.renzopreziosi.com/', u('https://www.renzopreziosi.com/'));
serv('renzopreziosi-figline', u('https://www.renzopreziosi.com/'), 'riparazione', 'vendita');
cont('sottili-figline', '055/9152013', 'info@sottili.com', null, u('https://www.hamiltonwatch.com/en-sa/store-locator/italie/tuscany/figline-valdarno/sottili-franco', 'marchio-ufficiale'));
cont('gabbani-pontedera', '0587 53826', 'graziano.gabbani@hotmail.it', 'https://www.gabbanigioielleria.it/', u('https://www.gabbanigioielleria.it/contatti/'));
serv('gabbani-pontedera', u('https://www.gabbanigioielleria.it/contatti/'), 'riparazione', 'vendita');
anomalie.push('gabbani-pontedera: presente un numero cellulare (3472978126): inserito il numero fisso.');
cont('cerri-pontedera', '+39 0587 54588', 'patrizia_cerri@virgilio.it', 'https://www.gioielleriacerrimarco.it/', u('https://www.gioielleriacerrimarco.it/contatti/'), u('https://www.gioielleriacerrimarco.it/assistenza/'));
ore('cerri-pontedera', u('https://www.gioielleriacerrimarco.it/contatti/'), [1, '16:00-20:00'], [2, '09:00-13:00', '16:00-20:00'], [3, '09:00-13:00', '16:00-20:00'], [4, '09:00-13:00', '16:00-20:00'], [5, '09:00-13:00', '16:00-20:00'], [6, '09:00-13:00', '16:00-20:00'], [7]);
serv('cerri-pontedera', u('https://www.gioielleriacerrimarco.it/assistenza/'), 'riparazione');
cont('orogenesi-pontedera', '0587-54676', null, 'https://www.orogenesi85.it/', u('https://www.orogenesi85.it/contatti/'), u('https://www.orogenesi85.it/laboratorio/'));
serv('orogenesi-pontedera', u('https://www.orogenesi85.it/laboratorio/'), 'riparazione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'valutazioni', 'lucidatura');
anomalie.push('orogenesi-pontedera: presente un numero cellulare (3286996492): inserito il numero fisso.');
cont('oreoro-poggibonsi', '0577 935118', 'colle@oreoro.it', 'https://www.oreoro.it/', u('https://www.oreoro.it/negozi.html'), u('https://www.oreoro.it/contatti.asp'));
serv('oreoro-poggibonsi', u('https://www.oreoro.it/'), 'riparazione', 'vendita');
cont('oreoro-colle', '0577 922980', 'colle@oreoro.it', 'https://www.oreoro.it/', u('https://www.oreoro.it/negozi.html'), u('https://www.oreoro.it/contatti.asp'));
serv('oreoro-colle', u('https://www.oreoro.it/'), 'riparazione', 'vendita');
cont('lombardi-montevarchi', '+39 055 98 09 48', 'info@gioiellerialombardi.com', 'https://www.gioiellerialombardi.com/', u('https://www.gioiellerialombardi.com/contact/'));
serv('lombardi-montevarchi', u('https://www.gioiellerialombardi.com/la-storia/'), 'riparazione', 'vendita');
cont('rabiti-firenze', '055 7131688', 'rabitimaurizio@libero.it', 'https://www.orologeriarabiti.com/', u('https://www.orologeriarabiti.com/'));
ore('rabiti-firenze', u('https://www.orologeriarabiti.com/'), [1, '09:00-13:00', '15:00-18:30'], [2, '09:00-13:00', '15:00-18:30'], [3, '09:00-13:00', '15:00-18:30'], [4, '09:00-13:00', '15:00-18:30'], [5, '09:00-13:00', '15:00-18:30'], [6], [7]);
serv('rabiti-firenze', u('https://www.orologeriarabiti.com/'), 'riparazione', 'revisione', 'lucidatura');
anomalie.push('rabiti-firenze: presente un numero cellulare (3392260342): inserito il numero fisso.');
cont('zagli-firenze', '+39 055 330872', 'info@zagli.it', 'https://zagli.it/', u('https://zagli.it/contatti/'), u('https://zagli.it/laboratorio-orologi/'));
ore('zagli-firenze', u('https://zagli.it/contatti/'), [1], [2, '09:30-13:00', '15:30-19:30'], [3, '09:30-13:00', '15:30-19:30'], [4, '09:30-13:00', '15:30-19:30'], [5, '09:30-13:00', '15:30-19:30'], [6, '09:30-13:00', '16:00-19:30']);
serv('zagli-firenze', u('https://zagli.it/laboratorio-orologi/'), 'riparazione', 'revisione', 'manutenzione', 'restauro-vintage', 'vendita');
cont('calistri-firenze', '353 4794203', 'info@riparazioneorologifirenze.it', 'https://www.riparazioneorologifirenze.it/', u('https://www.riparazioneorologifirenze.it/'));
serv('calistri-firenze', u('https://www.riparazioneorologifirenze.it/'), 'riparazione', 'restauro-vintage', 'ricambi', 'pendoleria', 'lucidatura');
cont('ugolini-firenzuola', '+39 055819275', 'info@orologeriaugolini.com', 'https://www.orologeriaugolini.com/', u('https://www.orologeriaugolini.com/contatti/'), u('https://www.orologeriaugolini.com/chi-siamo'));
serv('ugolini-firenzuola', u('https://www.orologeriaugolini.com/chi-siamo'), 'riparazione', 'restauro-vintage', 'vendita', 'ricambi');
anomalie.push('ugolini-firenzuola: presente un numero cellulare (+39 3394744119): inserito il numero fisso.');
cont('swatch-firenze-calzaiuoli', '+39 348/2303982', null, null, u('https://www.swatch.com/it-it/storedetails?sid=R282371', 'marchio-ufficiale'));
serv('swatch-firenze-calzaiuoli', u('https://www.swatch.com/it-it/storedetails?sid=R282371', 'marchio-ufficiale'), 'batterie', 'cinturini');
ore('swatch-firenze-calzaiuoli', u('https://www.swatch.com/it-it/storedetails?sid=R282371', 'marchio-ufficiale'), [1, '10:00-20:00'], [2, '10:00-20:00'], [3, '10:00-20:00'], [4, '10:00-20:00'], [5, '10:00-20:00'], [6, '10:00-20:00'], [7, '10:00-20:00']);
cont('metalli-scandicci', '055 7356742', 'info@metallipreziosi.it', 'https://www.metallipreziosi.it/', u('https://www.metallipreziosi.it/contatti/'));
ore('metalli-scandicci', u('https://www.metallipreziosi.it/contatti/'), [1, '16:00-19:00'], [2, '10:00-13:00', '16:00-19:00'], [3, '16:00-19:00'], [4, '10:00-13:00', '16:00-19:00'], [5, '10:00-13:00', '16:00-19:00'], [6, '10:00-13:00'], [7]);
serv('metalli-scandicci', u('https://www.metallipreziosi.it/'), 'vendita');
anomalie.push('metalli-scandicci: presente un numero cellulare (331 8657452): inserito il numero fisso.');
cont('lamberti-sesto', '+39 055 4421133', null, 'https://www.gioiellerialamberti.it/', u('https://www.gioiellerialamberti.it/contatti'));
cont('massari-campi', '055/8954352', 'massarigioielli@virgilio.it', 'https://massarigioielli.it/', u('https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/campi-bisenzio/massari-gioielli', 'marchio-ufficiale'), u('https://massarigioielli.it/gioielleria/assistenza-e-riparazioni/'));
anomalie.push('massari-campi: la riparazione dichiarata riguarda oggetti in metallo prezioso: non aggiunta come servizio di orologeria.');
cont('macchina-tempo-firenze', '+39 055 291994', 'leobiagi72@gmail.com', 'https://www.lamacchinadeltempo.org/', u('https://www.lamacchinadeltempo.org/contatti/'));
serv('macchina-tempo-firenze', u('https://www.lamacchinadeltempo.org/'), 'riparazione', 'revisione', 'restauro-vintage', 'cinturini', 'pendoleria');
anomalie.push('macchina-tempo-firenze: presente un numero cellulare (+39 339 619 5202): inserito il numero fisso.');
cont('horamundi-firenze', '+39 055219020', 'info@horamundi.it', 'https://www.horamundi.it/', u('https://www.horamundi.it/'));
serv('horamundi-firenze', u('https://www.horamundi.it/'), 'vendita', 'valutazioni');
cont('horae-san-giovanni', '+39 055 941596', 'info@horaeorologeria.it', 'https://www.horaeorologeria.it/', u('https://www.horaeorologeria.it/contatti/'), u('https://www.horaeorologeria.it/chi-siamo/'));
serv('horae-san-giovanni', u('https://www.horaeorologeria.it/chi-siamo/'), 'riparazione', 'revisione', 'restauro-vintage', 'vendita');
// --- Emilia, centro, sud e isole ---
const LON_BIGALLI = 'https://www.longines.com/en-us/store/id/bigalli-di-bolgi-giuseppe-c-snc-firenze-143385';
cont('fontana-bologna', '051 239544', 'info@natalefontana.it', 'https://www.natalefontana.it/', u('https://www.natalefontana.it/it/laboratorio-gioielleria-orologeria'));
serv('fontana-bologna', u('https://www.natalefontana.it/it/laboratorio-gioielleria-orologeria'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'ricambi', 'lucidatura');
anomalie.push('fontana-bologna: presente un numero cellulare (335 5455329): inserito il numero fisso.');
cont('orologica-torino', '+39 011.36.44.04', 'info@orologicatorino.it', 'https://www.orologicatorino.it/', u('https://www.orologicatorino.it/contatti-laboratorio-orologi-torino/'));
serv('orologica-torino', u('https://www.orologicatorino.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'lucidatura');
anomalie.push('orologica-torino: presente un numero cellulare (+39 348.72.11.955): inserito il numero fisso.');
cont('casa-cronometro-roma', '06 3210971', 'marcomusto@virgilio.it', 'https://www.casadelcronometro.it/', u('https://www.casadelcronometro.it/'));
serv('casa-cronometro-roma', u('https://www.casadelcronometro.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'pendoleria', 'lucidatura');
serv('soprana-vicenza', u('https://www.soprana.com/laboratorio-orologeria/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'ricambi', 'lucidatura');
cont('monetti-napoli-mille', '081 5518416', 'info27@monettiorologi.com', 'https://monettiorologi.com/', u('https://monettiorologi.com/via-dei-mille-2/'));
ore('monetti-napoli-mille', u('https://monettiorologi.com/via-dei-mille-2/'), [1, '16:30-20:00'], [2, '10:00-13:30', '16:30-20:00'], [3, '10:00-13:30', '16:30-20:00'], [4, '10:00-13:30', '16:30-20:00'], [5, '10:00-13:30', '16:30-20:00'], [6, '10:00-13:30', '16:30-20:00'], [7]);
cont('monetti-napoli-brigida', '081 5523867', 'infobrigida@monettiorologi.com', 'https://monettiorologi.com/', u('https://monettiorologi.com/via-santa-brigida/'));
ore('monetti-napoli-brigida', u('https://monettiorologi.com/via-santa-brigida/'), [1, '16:30-20:00'], [2, '10:00-13:30', '16:30-20:00'], [3, '10:00-13:30', '16:30-20:00'], [4, '10:00-13:30', '16:30-20:00'], [5, '10:00-13:30', '16:30-20:00'], [6, '10:00-13:30', '16:30-20:00'], [7]);
const BAUME = 'https://www.baume-et-mercier.com/it/it/rivenditores/details.002240.centro-assistenza-orologi-de-luca.html';
cont('deluca-napoli', '081 5499720', 'assistenzaorologideluca@gmail.com', 'https://www.assistenzaorologideluca.it/', u('https://www.assistenzaorologideluca.it/'), u(BAUME, 'marchio-ufficiale'));
ore('deluca-napoli', u('https://www.assistenzaorologideluca.it/'), [1, '09:30-17:30'], [2, '09:30-17:30'], [3, '09:30-17:30'], [4, '09:30-17:30'], [5, '09:30-17:30'], [6], [7]);
serv('deluca-napoli', u('https://www.assistenzaorologideluca.it/'), 'riparazione', 'restauro-vintage', 'pendoleria');
marc('deluca-napoli', 'assistenzaUfficiale', 'Baume & Mercier', u(BAUME, 'marchio-ufficiale'));
anomalie.push('deluca-napoli: la qualifica «centro assistenza» deriva dalla scheda ufficiale Baume & Mercier.');
cont('mazzone-salerno', '089 754297', null, 'https://www.orologeriamazzonesalerno.it/', u('https://www.orologeriamazzonesalerno.it/'));
ore('mazzone-salerno', u('https://www.orologeriamazzonesalerno.it/'), [1, '09:00-13:00', '16:30-20:30'], [2, '09:00-13:00', '16:30-20:30'], [3, '09:00-13:00', '16:30-20:30'], [4, '09:00-13:00', '16:30-20:30'], [5, '09:00-13:00', '16:30-20:30'], [6, '09:00-13:00', '16:30-20:30'], [7]);
serv('mazzone-salerno', u('https://www.orologeriamazzonesalerno.it/'), 'riparazione', 'revisione', 'batterie', 'cinturini', 'vendita', 'pendoleria');
cont('carrieri-bari', '+39 0805210194', 'carrieriorologeria@libero.it', 'https://www.orologeriacarrieri.com/', u('https://www.orologeriacarrieri.com/contatti'));
ore('carrieri-bari', u('https://www.orologeriacarrieri.com/contatti'), [1, '09:00-12:45', '16:30-19:45'], [2, '09:00-12:45', '16:30-19:45'], [3, '09:00-12:45', '16:30-19:45'], [4, '09:00-12:45', '16:30-19:45'], [5, '09:00-12:45', '16:30-19:45']);
serv('carrieri-bari', u('https://www.orologeriacarrieri.com/'), 'riparazione', 'revisione', 'ricambi');
anomalie.push('carrieri-bari: orario del sabato pubblicato incompleto: non inserito.');
cont('macchina-tempo-bari', '+39 080 5218963', null, 'https://www.orologerialamacchinadeltempo.it/', u('https://www.orologerialamacchinadeltempo.it/'));
serv('macchina-tempo-bari', u('https://www.orologerialamacchinadeltempo.it/'), 'riparazione');
anomalie.push('macchina-tempo-bari: email pubblicata incompleta nella fonte: non inserita.');
cont('chlw-bari', '080 69.77.150', 'orologi@chlw.it', 'https://www.chlw.it/', u('https://www.chlw.it/'), u('https://www.chlw.it/pages/q-a'));
serv('chlw-bari', u('https://www.chlw.it/pages/q-a'), 'revisione', 'vendita', 'valutazioni');
cont('bruno-emanuele-palermo', '+39 091 583467', 'brunoemanuele@live.it', 'https://brunoemanuele.com/', u('https://brunoemanuele.com/riparazione-orologi/'));
serv('bruno-emanuele-palermo', u('https://brunoemanuele.com/riparazione-orologi/'), 'riparazione', 'restauro-vintage', 'batterie', 'cinturini');
cont('cagnina-palermo', '+39 0917527734', 'dariolacagnina@hotmail.com', 'https://www.orologerialacagninadario.com/', u('https://www.orologerialacagninadario.com/'));
ore('cagnina-palermo', u('https://www.orologerialacagninadario.com/'), [1, '09:30-13:30', '16:00-19:30'], [2, '09:30-13:30', '16:00-19:30'], [3, '09:30-13:30', '16:00-19:30'], [4, '09:30-13:30', '16:00-19:30'], [5, '09:30-13:30', '16:00-19:30'], [6, '09:30-13:30'], [7]);
serv('cagnina-palermo', u('https://www.orologerialacagninadario.com/'), 'riparazione', 'cinturini', 'vendita', 'lucidatura');
anomalie.push('cagnina-palermo: presente un numero cellulare (+39 3277726665): inserito il numero fisso.');
cont('di-caro-palermo', '091 584512', null, 'https://www.orologeriadicaro.com/', u('https://www.orologeriadicaro.com/'));
serv('di-caro-palermo', u('https://www.orologeriadicaro.com/'), 'riparazione', 'vendita');
cont('watch-center-palermo', '+39 091 586773', 'info@watchcenterassistance.it', 'https://watch-center.eu/', u('https://watch-center.eu/contatti'), u('https://watch-center.eu/'));
ore('watch-center-palermo', u('https://watch-center.eu/contatti'), [1, '09:00-13:00', '15:00-19:00'], [2, '09:00-13:00', '15:00-19:00'], [3, '09:00-13:00', '15:00-19:00'], [4, '09:00-13:00', '15:00-19:00'], [5, '09:00-13:00', '15:00-19:00'], [6], [7]);
serv('watch-center-palermo', u('https://watch-center.eu/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'pendoleria', 'ricambi', 'lucidatura');
const AST = 'https://www.astrua.com/it/assistenza-ufficiale-astrua';
cont('astrua-genova', '+39 010 5959737', null, 'https://www.astrua.com/', u('https://www.astrua.com/it/sedi-astrua-boutiques-genova'));
serv('astrua-genova', u(AST), 'riparazione', 'restauro-vintage', 'vendita', 'valutazioni');
cont('astrua-torino', '+39 011 5613873', null, 'https://www.astrua.com/', u('https://www.astrua.com/it/sedi-astrua-boutiques-torino'));
serv('astrua-torino', u(AST), 'riparazione', 'restauro-vintage', 'vendita', 'valutazioni');
serv('capo-torino', u('https://www.laboratoriocapo.com/'), 'riparazione', 'revisione', 'lucidatura');
serv('lab-alessandria', u('https://laboratorio-di-orologeria.webnode.it/'), 'riparazione', 'batterie', 'cinturini', 'vendita', 'lucidatura');
cont('bottega-del-tempo-roma', '06/3224855', 'info@labottegadeltempo.it', 'https://www.labottegadeltempo.it/', u('https://www.labottegadeltempo.it/dove-siamo/'));
ore('bottega-del-tempo-roma', u('https://www.labottegadeltempo.it/dove-siamo/'), [1, '14:30-19:30'], [2, '10:00-19:30'], [3, '10:00-19:30'], [4, '10:00-19:30'], [5, '10:00-19:30'], [6, '10:00-19:30'], [7]);
serv('bottega-del-tempo-roma', u('https://www.labottegadeltempo.it/riparazione-orologi-roma/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'ricambi', 'lucidatura');
anomalie.push('bottega-del-tempo-roma: presente un numero cellulare (380/7659092): inserito il numero fisso.');
cont('salamena-roma', '06 39735621', 'info@riparazioniorologiroma.it', 'https://www.riparazioniorologiroma.it/', u('https://www.riparazioniorologiroma.it/contatti/'));
ore('salamena-roma', u('https://www.riparazioniorologiroma.it/contatti/'), [1, '10:00-13:00', '15:00-18:00'], [2, '10:00-13:00', '15:00-18:00'], [3, '10:00-13:00', '15:00-18:00'], [4, '10:00-13:00', '15:00-18:00'], [5, '10:00-13:00', '15:00-18:00'], [6, '10:00-13:00'], [7]);
serv('salamena-roma', u('https://www.riparazioniorologiroma.it/riparazione-orologi/'), 'riparazione', 'revisione', 'ricambi', 'lucidatura');
anomalie.push('salamena-roma: chiusura del sabato per il mese di luglio e numero cellulare (331 7575305) non inseriti.');
cont('portanova-bologna', '+39 051 264988', 'laboratorioportanova@gmail.com', 'https://www.laboratorioportanova.eu/', u('https://www.laboratorioportanova.eu/contatti/'));
serv('portanova-bologna', u('https://www.laboratorioportanova.eu/'), 'restauro-vintage');
cont('caldani-roma', '06 3217684', 'info@caldaniorologi.it', 'https://www.caldaniorologi.it/', u('https://www.caldaniorologi.it/contatti/'));
ore('caldani-roma', u('https://www.caldaniorologi.it/contatti/'), [1, '09:00-13:00', '14:00-19:00'], [2, '09:00-13:00', '14:00-19:00'], [3, '09:00-13:00', '14:00-19:00'], [4, '09:00-13:00', '14:00-19:00'], [5, '09:00-13:00', '14:00-19:00'], [6], [7]);
serv('caldani-roma', u('https://www.caldaniorologi.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'ricambi', 'lucidatura');
cont('gold-time-roma', '06.4872354', 'a.pantano@live.it', 'https://www.orologiantichi.eu/', u('https://www.orologiantichi.eu/'));
ore('gold-time-roma', u('https://www.orologiantichi.eu/'), [2, '08:30-16:30'], [3, '08:30-16:30'], [4, '08:30-16:30'], [5, '08:30-16:30'], [6, '08:30-16:30']);
serv('gold-time-roma', u('https://www.orologiantichi.eu/'), 'riparazione', 'revisione', 'restauro-vintage', 'cinturini', 'vendita', 'pendoleria', 'ricambi', 'lucidatura');
cont('emporio-roma', '+39 338 347 3691', 'info@orologeriaemporio.it', 'https://www.orologeriaemporio.it/', u('https://www.orologeriaemporio.it/'));
serv('emporio-roma', u('https://www.orologeriaemporio.it/'), 'riparazione', 'vendita');
serv('tempoidea-viterbo', u('https://www.tempoidea.it/'), 'riparazione', 'vendita');
serv('verardi-viterbo', u('https://www.tecnicasvizzera.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'vendita', 'valutazioni', 'pendoleria', 'ricambi');
cont('tardani-viterbo', '0761332005', 'tardaniroberto@libero.it', 'https://www.riparazioneorologi.eu/', u('https://www.riparazioneorologi.eu/'));
ore('tardani-viterbo', u('https://www.riparazioneorologi.eu/'), [1, '16:30-19:30'], [2, '09:00-16:30'], [3, '09:00-16:30'], [4, '09:00-16:30'], [5, '09:00-16:30'], [6, '09:00-13:00'], [7]);
serv('tardani-viterbo', u('https://www.riparazioneorologi.eu/'), 'riparazione', 'revisione', 'batterie', 'cinturini', 'pendoleria', 'ricambi', 'lucidatura');
anomalie.push('tardani-viterbo: presente un numero cellulare (3292419286): inserito il numero fisso.');
serv('brusaporci-latina', u('https://www.brusaporci.it/'), 'vendita');
cont('milioni-montefiascone', '+39 0761 959038', 'info@gioielleriamilioni.it', 'https://gioielleriamilioni.it/', u('https://gioielleriamilioni.it/'));
serv('milioni-montefiascone', u('https://gioielleriamilioni.it/'), 'riparazione', 'vendita');
cont('ranieri-laquila', '+39 0862 25 159', 'info@gioielleriaranieri.com', 'https://www.gioielleriaranieri.com/', u('https://www.gioielleriaranieri.com/contatti/'));
ore('ranieri-laquila', u('https://www.gioielleriaranieri.com/contatti/'), [2, '10:00-13:00', '16:00-19:30'], [3, '10:00-13:00', '16:00-19:30'], [4, '10:00-13:00', '16:00-19:30'], [5, '10:00-13:00', '16:00-19:30'], [6, '10:00-13:00', '16:00-19:30']);
serv('ranieri-laquila', u('https://www.gioielleriaranieri.com/'), 'riparazione', 'vendita', 'valutazioni');
cont('pietro-roberto-cosenza', '+39 0984/32884', 'info@pietroroberto.it', 'https://www.pietroroberto.it/', u('https://www.pietroroberto.it/'));
ore('pietro-roberto-cosenza', u('https://www.pietroroberto.it/'), [1, '09:00-18:00'], [2, '09:00-18:00'], [3, '09:00-18:00'], [4, '09:00-18:00'], [5, '09:00-18:00'], [6, '09:00-13:00'], [7]);
serv('pietro-roberto-cosenza', u('https://www.pietroroberto.it/'), 'riparazione', 'restauro-vintage', 'ricambi');
anomalie.push('pietro-roberto-cosenza: presente un numero cellulare (+39 339/2163392): inserito il numero fisso.');
cont('paolo-vale-reggio-calabria', '0965 51007', null, 'https://www.paolovalegioielleria.it/', u('https://www.paolovalegioielleria.it/contatti/'));
serv('paolo-vale-reggio-calabria', u('https://www.paolovalegioielleria.it/'), 'vendita');
anomalie.push('paolo-vale-reggio-calabria: orari stagionali (invernale/estivo) non rappresentabili: non inseriti.');
cont('fotia-reggio-calabria', '0965 25774', 'sebi1969@alice.it', 'https://www.fotiaorafo.it/', u('https://www.fotiaorafo.it/'));
ore('fotia-reggio-calabria', u('https://www.fotiaorafo.it/'), [1], [2, '09:30-18:00'], [3, '09:30-18:00'], [4, '09:30-18:00'], [5, '09:30-18:00'], [6, '09:30-16:30'], [7]);
serv('fotia-reggio-calabria', u('https://www.fotiaorafo.it/'), 'riparazione', 'restauro-vintage', 'batterie');
anomalie.push('fotia-reggio-calabria: presente un numero cellulare (338.7746317): inserito il numero fisso.');
cont('golden-business-potenza', '329 4176210', 'vstolfi@tiscali.it', 'https://www.gioielleriagoldenbusiness.it/', u('https://www.gioielleriagoldenbusiness.it/contatti/'));
serv('golden-business-potenza', u('https://www.gioielleriagoldenbusiness.it/servizi-e-prestazioni/'), 'riparazione', 'batterie', 'manutenzione');
anomalie.push('golden-business-potenza: orari pubblicati senza giorni di riferimento: non inseriti.');
cont('rolli-poniz-trieste', '040368901', 'rolli.poniz.social@gmail.com', 'https://rolliponiz.it/', u('https://rolliponiz.it/policies/contact-information'));
serv('rolli-poniz-trieste', u('https://rolliponiz.it/'), 'riparazione', 'revisione', 'batterie', 'cinturini', 'vendita', 'valutazioni');
cont('spangaro-udine', '+39 0432 150 75 35', 'orologeria@spangaroandco.com', 'https://spangaroandco.com/', u('https://spangaroandco.com/contatti/'));
serv('spangaro-udine', u('https://spangaroandco.com/'), 'riparazione', 'restauro-vintage', 'vendita', 'valutazioni', 'acquisto-permuta');
anomalie.push('spangaro-udine: presente un numero cellulare (+39 371 327 0300): inserito il numero fisso.');
cont('ronzoni-udine', '+39 0432 501526', null, 'https://italicoronzoni.it/', u('https://italicoronzoni.it/contatti/'));
ore('ronzoni-udine', u('https://italicoronzoni.it/contatti/'), [2, '09:15-12:30', '15:30-19:30'], [3, '09:15-12:30', '15:30-19:30'], [4, '09:15-12:30', '15:30-19:30'], [5, '09:15-12:30', '15:30-19:30'], [6, '09:15-12:30', '15:30-19:30']);
serv('ronzoni-udine', u('https://italicoronzoni.it/servizi/'), 'riparazione', 'revisione', 'restauro-vintage', 'ricambi', 'lucidatura');
anomalie.push('ronzoni-udine: seconda sede in Via Cavour con recapito proprio (0432 507746): non rappresentabile nello schema.');
cont('fronza-trento', '+39 0461 921 848', 'orologeriafronzamarco@gmail.com', 'https://www.orologeriafronzamarco.it/', u('https://www.orologeriafronzamarco.it/contatti'));
ore('fronza-trento', u('https://www.orologeriafronzamarco.it/contatti'), [1, '15:00-18:00'], [2, '09:00-12:00', '15:00-18:00'], [3, '09:00-12:00', '15:00-18:00'], [4, '09:00-12:00', '15:00-18:00'], [5, '09:00-12:00', '15:00-18:00'], [6, '09:00-12:00'], [7]);
serv('fronza-trento', u('https://www.orologeriafronzamarco.it/'), 'riparazione', 'batterie', 'pendoleria');
cont('miconi-civitanova', '+39 335 180 7768', 'info@orologeriamiconi.it', 'https://www.orologeriamiconi.it/', u('https://www.orologeriamiconi.it/contatti/'));
ore('miconi-civitanova', u('https://www.orologeriamiconi.it/contatti/'), [1], [2, '09:00-18:00'], [3, '09:00-18:00'], [4, '09:00-18:00'], [5, '09:00-18:00'], [6, '09:00-18:00'], [7]);
serv('miconi-civitanova', u('https://www.orologeriamiconi.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'ricambi', 'lucidatura');
cont('biagini-perugia', '+39 075 5736300', 'info@biagini1863.it', 'https://www.biagini1863.it/', u('https://www.biagini1863.it/servizio-clienti/'));
ore('biagini-perugia', u('https://www.biagini1863.it/servizio-clienti/'), [2, '09:30-13:00', '16:00-19:30'], [3, '09:30-13:00', '16:00-19:30'], [4, '09:30-13:00', '16:00-19:30'], [5, '09:30-13:00', '16:00-19:30'], [6, '09:30-13:00', '16:00-19:30']);
serv('biagini-perugia', u('https://www.biagini1863.it/servizio-clienti/'), 'riparazione', 'revisione', 'vendita', 'lucidatura');
cont('paccara-terni', '0744 406306', 'lucapaccara@virgilio.it', 'https://www.gioielleriapaccarafranco.it/orologeria.php', u('https://www.gioielleriapaccarafranco.it/orologeria.php'));
serv('paccara-terni', u('https://www.gioielleriapaccarafranco.it/orologeria.php'), 'riparazione', 'revisione', 'vendita', 'ricambi');
cont('mazzucchi-milano', '02 86460549', 'labmazzucchisnc@lamiapec.it', 'https://www.laboratoriomazzucchi.it/', u('https://www.laboratoriomazzucchi.it/'));
ore('mazzucchi-milano', u('https://www.laboratoriomazzucchi.it/'), [1, '08:00-17:00'], [2, '08:00-17:00'], [3, '08:00-17:00'], [4, '08:00-17:00'], [5, '08:00-17:00'], [6], [7]);
serv('mazzucchi-milano', u('https://www.laboratoriomazzucchi.it/'), 'riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'ricambi', 'lucidatura');
anomalie.push('mazzucchi-milano: presenza in un elenco Omega non interpretata come autorizzazione: nessun claim di marchio inserito.');
cont('curato-brescia', '+39 030 29 35 46', 'info@laboratoriocurato.it', 'https://www.laboratoriocurato.it/', u('https://www.laboratoriocurato.it/'));
ore('curato-brescia', u('https://www.laboratoriocurato.it/'), [1, '08:00-12:00', '14:00-18:00'], [2, '08:00-12:00', '14:00-18:00'], [3, '08:00-12:00', '14:00-18:00'], [4, '08:00-12:00', '14:00-18:00'], [5, '08:00-12:00', '14:00-18:00'], [6], [7]);
serv('curato-brescia', u('https://www.laboratoriocurato.it/'), 'riparazione', 'revisione');
cont('ciesse-padova', '0498042059', 'ciesseorologi@gmail.com', 'https://www.ciesse-orologi.it/', u('https://www.ciesse-orologi.it/'));
ore('ciesse-padova', u('https://www.ciesse-orologi.it/'), [1, '09:00-13:00', '14:30-18:30'], [2, '09:00-13:00', '14:30-18:30'], [3, '09:00-13:00', '14:30-18:30'], [4, '09:00-13:00', '14:30-18:30'], [5, '09:00-13:00', '14:30-18:00'], [6], [7]);
serv('ciesse-padova', u('https://www.ciesse-orologi.it/'), 'riparazione', 'revisione', 'batterie', 'cinturini', 'lucidatura');
anomalie.push('ciesse-padova: presente un numero cellulare (3669715002): inserito il numero fisso.');
cont('martini-parma', '0521/992861', null, 'https://martinigiancarlo.com/', u('https://martinigiancarlo.com/contatti/'));
serv('martini-parma', u('https://martinigiancarlo.com/laboratorio/'), 'riparazione', 'revisione', 'restauro-vintage', 'vendita', 'valutazioni', 'ricambi', 'lucidatura');
const LON_VALENTI = 'https://www.longines.com/it/store/id/valenti-srl-parma-143474';
cont('valenti-parma', '0521 283343', 'info@valentiparma.it', 'https://www.valentiparma.it/', u('https://www.valentiparma.it/punti-vendita/'), u(LON_VALENTI, 'marchio-ufficiale'));
ore('valenti-parma', u('https://www.valentiparma.it/punti-vendita/'), [1, '09:30-13:00', '15:30-19:30'], [2, '09:30-13:00', '15:30-19:30'], [3, '09:30-13:00', '15:30-19:30'], [4], [5, '09:30-13:00', '15:30-19:30'], [6, '09:30-13:00', '15:30-19:30'], [7]);
serv('valenti-parma', u('https://www.valentiparma.it/laboratorio/'), 'riparazione', 'revisione', 'vendita', 'ricambi', 'lucidatura');
marc('valenti-parma', 'rivenditaUfficiale', 'Longines', u(LON_VALENTI, 'marchio-ufficiale'));
const LON_STEMA = 'https://www.longines.com/en-us/store/id/stema-di-de-sanctis-saverio-e-c-sas-termoli-1643709';
cont('stema-termoli', '0875/704533', 'stemagioielli@gmail.com', 'https://www.stemagioielli.com/it/', u('https://www.stemagioielli.com/it/contatti.html'), u(LON_STEMA, 'marchio-ufficiale'));
ore('stema-termoli', u('https://www.stemagioielli.com/it/contatti.html'), [1, '09:00-13:00', '16:30-20:00'], [2, '09:00-13:00', '16:30-20:00'], [3, '09:00-13:00', '16:30-20:00'], [4, '09:00-13:00', '16:30-20:00'], [5, '09:00-13:00', '16:30-20:00'], [6, '09:00-13:00', '16:30-20:00'], [7]);
serv('stema-termoli', u(LON_STEMA, 'marchio-ufficiale'), 'vendita', 'cinturini', 'manutenzione');
marc('stema-termoli', 'rivenditaUfficiale', 'Longines', u(LON_STEMA, 'marchio-ufficiale'));
cont('gioielleria-sammartino-campobasso', '0874 412880', 'info@gioielleriasammartino.com', 'https://gioielleriasammartino.com/', u('https://gioielleriasammartino.com/contatti/'));
ore('gioielleria-sammartino-campobasso', u('https://gioielleriasammartino.com/contatti/'), [1, '16:30-20:00'], [2, '09:15-13:00', '16:30-20:00'], [3, '09:15-13:00', '16:30-20:00'], [4, '09:15-13:00', '16:30-20:00'], [5, '09:15-13:00', '16:30-20:00'], [6, '09:15-13:00', '16:30-19:30'], [7]);
serv('gioielleria-sammartino-campobasso', u('https://gioielleriasammartino.com/servizi/'), 'revisione', 'batterie', 'cinturini', 'vendita');
anomalie.push('sammartino-campobasso: orari discordanti fra pagina contatti e pagina servizi: usata la pagina contatti.');
cont('piazzoli-bagnatica', '035/683513', 'luca.piazzoli78@gmail.com', 'https://www.piazzoli.com/', u('https://www.piazzoli.com/contatti'));
serv('piazzoli-bagnatica', u('https://www.piazzoli.com/'), 'riparazione', 'revisione', 'batterie', 'cinturini');
cont('gamba-orologi-bergamo', '335 6138500', 'gambaorologibg66@virgilio.it', 'https://gamba-gioielli.it/', u('https://gamba-gioielli.it/contatti/'));
ore('gamba-orologi-bergamo', u('https://gamba-gioielli.it/contatti/'), [2, '09:30-12:30', '15:30-19:00'], [3, '09:30-12:30', '15:30-19:00'], [4, '09:30-12:30', '15:30-19:00'], [5, '09:30-12:30', '15:30-19:00'], [6, '09:30-12:30', '15:30-19:00']);
serv('gamba-orologi-bergamo', u('https://gamba-gioielli.it/'), 'revisione', 'valutazioni', 'vendita');
cont('robbi-orologiaio-lodi', '+39 0371564647', 'info@robbiorologiaio.it', 'https://www.robbiorologiaio.com/', u('https://www.robbiorologiaio.com/'), u('https://www.robbiorologiaio.com/chi-sono/'));
ore('robbi-orologiaio-lodi', u('https://www.robbiorologiaio.com/'), [1], [2, '09:00-12:00', '16:00-17:30'], [3, '09:00-12:00', '16:00-17:30'], [4, '09:00-12:00', '16:00-19:00'], [5, '09:00-12:00', '16:00-17:30'], [6, '09:00-12:00', '16:00-19:00'], [7]);
serv('robbi-orologiaio-lodi', u('https://www.robbiorologiaio.com/'), 'riparazione', 'restauro-vintage', 'revisione', 'valutazioni', 'pendoleria', 'vendita');
cont('orologerie-palladio-vicenza', '+39 0444 291111', 'malagnino.lor@artigiani.vi.it', 'https://www.orologeriepalladio.it/', u('https://www.orologeriepalladio.it/'));
serv('orologerie-palladio-vicenza', u('https://www.orologeriepalladio.it/'), 'riparazione', 'revisione', 'restauro-vintage');
cont('casadei-rimini', '0541 53903', null, 'https://www.orologeriacasadei.it/', u('https://www.orologeriacasadei.it/contatti/'));
ore('casadei-rimini', u('https://www.orologeriacasadei.it/contatti/'), [1], [2, '09:00-12:30', '15:30-19:00'], [3, '09:00-12:30', '15:30-19:00'], [4, '09:00-12:30', '15:30-19:00'], [5, '09:00-12:30', '15:30-19:00'], [6, '09:00-12:30', '15:30-19:00'], [7]);
serv('casadei-rimini', u('https://www.orologeriacasadei.it/'), 'riparazione', 'revisione', 'valutazioni', 'vendita');
anomalie.push('casadei-rimini: presente un numero cellulare (320 630 8462): inserito il numero fisso.');
cont('della-rocca-gioielli-bologna', '+39 051 24 66 88', 'drg@dellaroccagioielli.com', 'https://www.dellaroccagioielli.it/', u('https://www.dellaroccagioielli.it/contatti.php'));
ore('della-rocca-gioielli-bologna', u('https://www.dellaroccagioielli.it/contatti.php'), [1, '09:30-13:00', '15:30-19:30'], [2, '09:30-13:00', '15:30-19:30'], [3, '09:30-13:00', '15:30-19:30'], [4, '09:30-13:00', '15:30-19:30'], [5, '09:30-13:00', '15:30-19:30'], [6, '09:30-13:00', '15:30-19:30'], [7]);
serv('della-rocca-gioielli-bologna', u('https://www.dellaroccagioielli.it/esperto-orologi.php'), 'riparazione', 'valutazioni', 'vendita');
anomalie.push('della-rocca-gioielli-bologna: presente un numero cellulare (+39 051 50 65 512): inserito il numero fisso.');
cont('abate-1920-sanremo', '+39 0184 578169', 'abate@abate1920.com', 'https://abate1920.it/', u('https://abate1920.it/i-negozi/laboratorio/'));
serv('abate-1920-sanremo', u('https://abate1920.it/i-negozi/laboratorio/'), 'riparazione', 'vendita');
cont('giacomo-bruni-imperia', '0183 60655', null, 'https://www.orologeriaoreficeriagiacomobruni.it/', u('https://www.orologeriaoreficeriagiacomobruni.it/contact-us'));
serv('giacomo-bruni-imperia', u('https://www.orologeriaoreficeriagiacomobruni.it/page/restauro-orologi'), 'riparazione', 'restauro-vintage', 'pendoleria', 'ricambi', 'vendita');
cont('orologiaio-di-liddo-biella', '+39 015 28401', 'info@lorologiaiobiella.it', 'https://www.lorologiaiobiella.it/', u('https://www.lorologiaiobiella.it/contatti'));
serv('orologiaio-di-liddo-biella', u('https://www.lorologiaiobiella.it/laboratorio-orologeria'), 'riparazione', 'restauro-vintage', 'lucidatura');
cont('pasetto-torino', '+39 011 53 36 56', 'info@mauropasetto.it', 'https://mauropasetto.it/', u('https://mauropasetto.it/contatti/'));
serv('pasetto-torino', u('https://mauropasetto.it/'), 'riparazione', 'restauro-vintage', 'cinturini', 'vendita');
cont('gioielleria-rosas-olbia', '+39 0789 21652', null, 'https://rosasgioiellerie.com/', u('https://rosasgioiellerie.com/it/contatti'), u('https://rosasgioiellerie.com/it/servizi/assistenza-post-vendita'));
ore('gioielleria-rosas-olbia', u('https://rosasgioiellerie.com/it/contatti'), [1, '09:00-13:00', '16:00-20:00'], [2, '09:00-13:00', '16:00-20:00'], [3, '09:00-13:00', '16:00-20:00'], [4, '09:00-13:00', '16:00-20:00'], [5, '09:00-13:00', '16:00-20:00'], [6, '09:00-13:00', '16:00-20:00'], [7]);
serv('gioielleria-rosas-olbia', u('https://rosasgioiellerie.com/it/servizi/assistenza-post-vendita'), 'riparazione', 'revisione', 'ricambi', 'lucidatura', 'vendita');
cont('gioielleria-liparota-lamezia', '0968 438073', 'info@gioiellerialiparota.com', 'https://www.gioiellerialiparota.com/', u('https://www.gioiellerialiparota.com/contattaci.php'));
ore('gioielleria-liparota-lamezia', u('https://www.gioiellerialiparota.com/contattaci.php'), [1, '16:30-20:00'], [2, '08:30-13:00', '16:30-20:00'], [3, '08:30-13:00', '16:30-20:00'], [4, '08:30-13:00', '16:30-20:00'], [5, '08:30-13:00', '16:30-20:00'], [6, '08:30-13:00', '16:30-20:00'], [7]);
serv('gioielleria-liparota-lamezia', u('https://www.gioiellerialiparota.com/orologi.php'), 'riparazione', 'vendita');
cont('magie-in-oro-chieti', '0871 552723', null, 'https://magieinoro.com/', u('https://magieinoro.com/contatti/'));
serv('magie-in-oro-chieti', u('https://magieinoro.com/'), 'riparazione', 'revisione', 'lucidatura', 'vendita');
cont('lombardi-ercolino-isernia', '0865/414261', 'domlom@tiscali.it', null, u('https://www.hamiltonwatch.com/it-it/store-locator/italia/molise/isernia/gioielleria-lombardi-ercolino', 'marchio-ufficiale'));
cont('fenocchi-san-benedetto-del-tronto', '+39 (0735) 584115', null, 'https://www.gioielleriafenocchi.com/', u('https://www.buccellati.com/it_it/storelocator', 'marchio-ufficiale'));
anomalie.push('fenocchi-san-benedetto-del-tronto: orari pubblicati senza giorni e pagine ufficiali non accessibili: nessun orario inserito.');
cont('cerescioli-paolo-ancona', '071 202091', 'info@ceresciolipaolo.it', 'https://www.ceresciolipaolo.it/', u('https://www.ceresciolipaolo.it/'));
serv('cerescioli-paolo-ancona', u('https://www.ceresciolipaolo.it/'), 'ricambi', 'vendita');
anomalie.push('cerescioli-paolo-ancona: secondo numero fisso (071 7930816) non inserito: il campo pubblica un recapito principale.');
anomalie.push('gibi-shop-ancona: sito ufficiale non accessibile durante la consultazione: nessun dato aggiuntivo.');
cont('satolli-pescara', '085.4212934', 'info@orologeriasatolli.it', 'https://www.orologeriasatolli.it/', u('https://www.orologeriasatolli.it/dove-siamo/'), u('https://www.orologeriasatolli.it/assistenza/'));
serv('satolli-pescara', u('https://www.orologeriasatolli.it/assistenza/'), 'riparazione', 'revisione', 'ricambi');
const LON_WARGAS = 'https://www.longines.com/en-us/store/id/wargas-sisti-dei-flli-melani-srl-ancona-143217';
cont('wargas-sisti-ancona', '+39 071 201269', 'info@wargasisti.com', 'https://wargasisti.com/', u('https://wargasisti.com/contatti/'), u(LON_WARGAS, 'marchio-ufficiale'));
serv('wargas-sisti-ancona', u('https://wargasisti.com/contatti/'), 'batterie', 'cinturini', 'vendita');
marc('wargas-sisti-ancona', 'rivenditaUfficiale', 'Longines', u(LON_WARGAS, 'marchio-ufficiale'));
void LON_BIGALLI;

// --- Finalizzazione: registra fonti, cronologia e verifica delle autorizzazioni ---
for (const f of nuove) if (!directory.fonti.some(x => x.id === f.id)) directory.fonti.push(f);
for (const m of modificati) {
  const b = byId(m.id);
  b.attendibilita.cronologia.push({
    data: DATA,
    azione: `Lotto 3 di arricchimento: ${m.campi.slice(0, 8).join(', ')}${m.campi.length > 8 ? '…' : ''}`,
    fonti: [...new Set([
      ...b.contatti.fonti,
      ...b.orari.fonti,
      ...b.servizi.flatMap(s => s.fonti),
      ...Object.values(b.marchi).flatMap(el => el.flatMap(x => x.fonti)),
    ])].filter(id => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)).slice(0, 6),
  });
  const ufficiali = [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale];
  if (ufficiali.length && !b.attendibilita.verificataIl) {
    b.attendibilita.verificataIl = DATA;
    for (const c of ufficiali) for (const s of c.fonti) if (!b.attendibilita.fonti.includes(s)) b.attendibilita.fonti.push(s);
    if (b.attendibilita.stato === 'da-verificare') b.attendibilita.stato = 'fonti-verificate';
  }
}
const validato = directorySchema.parse(directory);
writeFileSync(FILE, `${JSON.stringify(validato, null, 2)}\n`);
writeFileSync('data/reports/lotto-03-20261025-applied.json', `${JSON.stringify({
  lotto: 'lotto-03-20261025',
  data: DATA,
  criterio: 'Solo dati documentati da fonti ufficiali o primarie consultate il 25/10/2026; recapiti e orari inseriti solo se assenti.',
  attivitaEsaminate: 102,
  attivitaModificate: modificati.map(m => ({ id: m.id, campi: m.campi })),
  fontiAggiunte: nuove.map(f => ({ id: f.id, tipo: f.tipo, url: f.url })),
  anomalie,
}, null, 2)}\n`);
console.log(`Lotto 3 applicato: ${modificati.length} attività modificate, ${nuove.length} fonti aggiunte, ${anomalie.length} anomalie registrate.`);
