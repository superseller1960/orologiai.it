// Lotto 1 di arricchimento (2026-10-25): 20 attività senza telefono. Solo dati documentati
// da fonti ufficiali consultate il 2026-10-25; nessun dato inventato, nessun ID/URL alterato.
// Uso: npx tsx scripts/integrate-lotto-01-20261025.ts (idempotente: si rifiuta se già applicato).
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-25';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;
if (directory.fonti.some(f => f.id === 'ronchi-sito-20261025')) {
  console.error('Lotto 1 già applicato: nessuna modifica.');
  process.exit(1);
}
const fonte = (id: string, tipo: 'sito-ufficiale' | 'marchio-ufficiale', url: string, titolo: string) =>
  ({ id, tipo, url, titolo, consultataIl: DATA, percorsoArchivio: null, licenza: null });

const nuoveFonti = [
  fonte('renai-sito-20261025', 'sito-ufficiale', 'http://www.renai.it/contattaci', 'Renai — contatti (sito ufficiale)'),
  fonte('spaziotempo-sito-20261025', 'sito-ufficiale', 'https://www.spaziotempoboutique.com/vendere-orologio-di-lusso/', 'Spazio Tempo — vendita e valutazione orologi usati (sito ufficiale)'),
  fonte('ronchi-sito-20261025', 'sito-ufficiale', 'https://www.ronchigioielli.com/contatti', 'Ronchi Gioielli — contatti e orari (sito ufficiale)'),
  fonte('ronchi-servizi-20261025', 'sito-ufficiale', 'https://www.ronchigioielli.com/servizi', 'Ronchi Gioielli — servizi post vendita e quick service (sito ufficiale)'),
  fonte('ronchi-orologi-20261025', 'sito-ufficiale', 'https://www.ronchigioielli.com/orologi', 'Ronchi Gioielli — vendita orologi (sito ufficiale)'),
  fonte('ronchi-secondo-polso-20261025', 'sito-ufficiale', 'https://www.ronchigioielli.com/secondo-polso', 'Ronchi Gioielli — secondo polso e revisione (sito ufficiale)'),
  fonte('murgia-sito-20261025', 'sito-ufficiale', 'https://www.giampieromurgia.com/contatti.php', 'Giampiero Murgia — contatti e orari (sito ufficiale)'),
  fonte('murgia-home-20261025', 'sito-ufficiale', 'https://www.giampieromurgia.com/', 'Giampiero Murgia — attività e servizi (sito ufficiale)'),
  fonte('angolo-sito-20261025', 'sito-ufficiale', 'https://www.angolodelleore.it/contatti/', 'L’Angolo delle Ore — contatti e orari (sito ufficiale)'),
  fonte('angolo-home-20261025', 'sito-ufficiale', 'https://www.angolodelleore.it/', 'L’Angolo delle Ore — vendita e secondo polso (sito ufficiale)'),
  fonte('angolo-rolex-20261025', 'sito-ufficiale', 'https://www.angolodelleore.it/rolex/contatti/', 'L’Angolo delle Ore — laboratorio e servizi su orologi (sito ufficiale)'),
  fonte('gaddi-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/en-us/store/id/gioielleria-gaddi-zucchi-novara-1852354', 'Longines — scheda rivenditore Gaddi Zucchi, Novara'),
  fonte('simonini-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/en-us/store-locator/italia/piedmont/vercelli/gioielleria-simonini', 'Hamilton — scheda rivenditore Simonini, Vercelli'),
  fonte('orsi-sito-20261025', 'sito-ufficiale', 'https://www.orsigioielleria.com/contatti/', 'Orsi Gioielleria — contatti e orari (sito ufficiale)'),
  fonte('orsi-chisiamo-20261025', 'sito-ufficiale', 'https://www.orsigioielleria.com/chi-siamo/', 'Orsi Gioielleria — laboratorio e riparazioni (sito ufficiale)'),
  fonte('bisio-sito-20261025', 'sito-ufficiale', 'https://www.bisiogioielleria.it/contatti', 'Bisio Gioielleria — contatti e orari (sito ufficiale)'),
  fonte('bisio-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/bisio-srl-asti-864286', 'Longines — scheda rivenditore Bisio, Asti'),
  fonte('fontana-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/en-us/store-locator/italie/lombardy/varese/gioielleria-fontana', 'Hamilton — scheda rivenditore Fontana, Varese'),
  fonte('fasola-sito-20261025', 'sito-ufficiale', 'https://www.fasolagioielleria.it/', 'Fasola Gioielleria — sito ufficiale'),
  fonte('depascalis-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/de-pascalis-spa-lecco-143569', 'Longines — scheda rivenditore De Pascalis, Lecco'),
  fonte('floriofolini-dove-20261025', 'sito-ufficiale', 'https://www.floriofolini.it/it/dove-trovarci', 'Florio Folini — sedi e orari (sito ufficiale)'),
  fonte('floriofolini-servizi-20261025', 'sito-ufficiale', 'https://www.floriofolini.it/it/noi/cosa-facciamo-per-voi', 'Florio Folini — servizi e perizie (sito ufficiale)'),
  fonte('floriofolini-rolex-20261025', 'sito-ufficiale', 'https://www.floriofolini.it/it/rolex/manutenzione', 'Florio Folini — manutenzione orologi (sito ufficiale)'),
  fonte('lamarca-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/lombardia/pavia/gioielleria-la-marca-vittorio', 'Hamilton — scheda rivenditore La Marca, Pavia'),
  fonte('torelli-sito-20261025', 'sito-ufficiale', 'https://www.gioiellerietorelli.com/pages/about-us', 'Gioiellerie Torelli — sedi e servizi (sito ufficiale)'),
  fonte('torelli-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/gioiellerie-torelli-cremona-1799010', 'Longines — scheda rivenditore Torelli, Cremona'),
  fonte('torelli-omega-20261025', 'marchio-ufficiale', 'https://www.omegawatches.com/en-us/store/storedetails/O1799012', 'Omega — scheda rivenditore Torelli, Cremona'),
  fonte('angelini-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/en-us/store/id/gioielleria-angelini-srl-monza-1678291', 'Longines — scheda rivenditore Angelini, Monza'),
  fonte('angelini-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/en-hk/store-locator/italia/lombardia/monza/gioielleria-angelini', 'Hamilton — scheda rivenditore Angelini, Monza'),
  fonte('angelini-omega-20261025', 'marchio-ufficiale', 'https://www.omegawatches.com/en-us/store/storedetails/1002377', 'Omega — scheda rivenditore Angelini, Monza'),
];
directory.fonti.push(...nuoveFonti);

const byId = (id: string) => {
  const b = directory.attivita.find(x => x.id === id);
  if (!b) throw new Error(`Attività assente: ${id}`);
  return b;
};
const ore = (...fascie: string[]) => fascie.map(f => {
  const [apertura, chiusura] = f.split('-');
  return { apertura, chiusura };
});
// Giorni 1=lunedì … 7=domenica; i giorni chiusi compaiono con intervalli vuoti (convenzione fani-gioielli).
const settimana = (aperti: Record<number, string[]>) =>
  [1, 2, 3, 4, 5, 6, 7].map(giorno => ({ giorno, intervalli: ore(...(aperti[giorno] ?? [])) }));

const modificati: { id: string; campi: string[] }[] = [];
const toccato = (id: string, campo: string) => {
  const v = modificati.find(m => m.id === id);
  if (v) v.campi.push(campo); else modificati.push({ id, campi: [campo] });
};

const contatti = (id: string, tel: string | null, mail: string | null, src: string) => {
  const b = byId(id);
  if (tel) b.contatti.telefono = tel;
  if (mail) b.contatti.email = mail;
  b.contatti.fonti.push(src);
  toccato(id, 'contatti');
};
const orari = (id: string, aperti: Record<number, string[]>, src: string) => {
  const b = byId(id);
  b.orari.giorni = settimana(aperti);
  b.orari.verificatiIl = DATA;
  b.orari.fonti.push(src);
  toccato(id, 'orari');
};
const servizio = (id: string, servizioId: string, src: string) => {
  const b = byId(id);
  if (b.servizi.some(s => s.id === servizioId)) return;
  b.servizi.push({ id: servizioId as (typeof b.servizi)[number]['id'], fonti: [src] });
  toccato(id, `servizio:${servizioId}`);
};
const marchio = (id: string, ruolo: 'venduti' | 'riparati' | 'rivenditaUfficiale', marca: string, src: string) => {
  const b = byId(id);
  if (b.marchi[ruolo].some(m => m.marca === marca)) return;
  b.marchi[ruolo].push({ marca, fonti: [src] });
  toccato(id, `marchio:${ruolo}:${marca}`);
};

// 1) Renai — Pontassieve: recapiti dal sito ufficiale.
contatti('renai-pontassieve', '055.8368053', 'info@renai.it', 'renai-sito-20261025');
// 2) Spazio Tempo — San Miniato: valutazione documentata sul sito.
servizio('spaziotempo-sanminiato', 'valutazioni', 'spaziotempo-sito-20261025');
// 3) Ronchi Gioielli — Milano: recapiti, orari, quick service, secondo polso; verifica indipendente.
{
  const b = byId('ronchi-gioielli');
  contatti('ronchi-gioielli', '+39 02 877449', 'info@ronchigioielli.com', 'ronchi-sito-20261025');
  orari('ronchi-gioielli', { 2: ['10:00-13:30', '15:00-19:00'], 3: ['10:00-13:30', '15:00-19:00'], 4: ['10:00-13:30', '15:00-19:00'], 5: ['10:00-13:30', '15:00-19:00'], 6: ['10:00-13:30', '15:00-19:00'] }, 'ronchi-sito-20261025');
  servizio('ronchi-gioielli', 'riparazione', 'ronchi-secondo-polso-20261025');
  servizio('ronchi-gioielli', 'revisione', 'ronchi-secondo-polso-20261025');
  servizio('ronchi-gioielli', 'batterie', 'ronchi-servizi-20261025');
  servizio('ronchi-gioielli', 'cinturini', 'ronchi-servizi-20261025');
  servizio('ronchi-gioielli', 'vendita-usati', 'ronchi-orologi-20261025');
  b.attendibilita.stato = 'fonti-verificate';
  b.attendibilita.verificataIl = DATA;
  b.attendibilita.fonti.push('ronchi-sito-20261025');
}
// 4) Giampiero Murgia — Cagliari: recapiti, orari, assistenza e marchi riparati dichiarati dal sito.
contatti('murgia-cagliari', '070/663900', 'murgia.lab@alice.it', 'murgia-sito-20261025');
orari('murgia-cagliari', { 1: ['08:30-12:30', '15:30-19:30'], 2: ['08:30-12:30', '15:30-19:30'], 3: ['08:30-12:30', '15:30-19:30'], 4: ['08:30-12:30', '15:30-19:30'], 5: ['08:30-12:30', '15:30-19:30'] }, 'murgia-sito-20261025');
servizio('murgia-cagliari', 'assistenza', 'murgia-home-20261025');
for (const marca of ['Cartier', 'Baume & Mercier', 'Zenith', 'Eberhard']) marchio('murgia-cagliari', 'riparati', marca, 'murgia-home-20261025');
// 5) L’Angolo delle Ore — Novara: recapiti, orari, usato/permuta, laboratorio.
contatti('l-angolo-delle-ore-novara', '+39 0321 624313', 'info@angolodelleore.eu', 'angolo-sito-20261025');
orari('l-angolo-delle-ore-novara', { 2: ['09:30-12:30', '15:30-19:00'], 3: ['09:30-12:30', '15:30-19:00'], 4: ['09:30-12:30', '15:30-19:00'], 5: ['09:30-12:30', '15:30-19:00'], 6: ['09:30-12:30', '15:30-19:00'] }, 'angolo-sito-20261025');
servizio('l-angolo-delle-ore-novara', 'acquisto-permuta', 'angolo-home-20261025');
servizio('l-angolo-delle-ore-novara', 'vendita-usati', 'angolo-home-20261025');
marchio('l-angolo-delle-ore-novara', 'venduti', 'Rolex', 'angolo-home-20261025');
marchio('l-angolo-delle-ore-novara', 'riparati', 'Rolex', 'angolo-rolex-20261025');
marchio('l-angolo-delle-ore-novara', 'riparati', 'Tudor', 'angolo-rolex-20261025');
// 6-7) Recapiti da schede ufficiali dei marchi (Piemonte).
contatti('gioielleria-gaddi-zucchi-novara', '0321 1828238', null, 'gaddi-longines-20261025');
marchio('gioielleria-gaddi-zucchi-novara', 'rivenditaUfficiale', 'Longines', 'gaddi-longines-20261025');
contatti('gioielleria-simonini-vercelli', '0161/54435', 'carlo.simonini@gmail.com', 'simonini-hamilton-20261025');
// 8) Orsi Gioielleria — Verbania: recapiti, orari, laboratorio (orologi, pendole, sveglie).
contatti('orsi-gioielleria-verbania', '0323-404463', 'orsigioielleria@hotmail.com', 'orsi-sito-20261025');
orari('orsi-gioielleria-verbania', { 1: ['15:00-19:00'], 2: ['09:00-12:00', '15:00-19:00'], 3: ['09:00-12:00', '15:00-19:00'], 4: ['09:00-12:00', '15:00-19:00'], 5: ['09:00-12:00', '15:00-19:00'], 6: ['09:00-12:00', '15:00-19:00'] }, 'orsi-sito-20261025');
servizio('orsi-gioielleria-verbania', 'riparazione', 'orsi-chisiamo-20261025');
servizio('orsi-gioielleria-verbania', 'pendoleria', 'orsi-chisiamo-20261025');
// 9) Bisio — Asti: recapiti, orari, rivendita Longines da scheda ufficiale del marchio.
contatti('gioielleria-bisio-asti', '+39 0141 592654', 'bisioasti@bisioasti.it', 'bisio-sito-20261025');
orari('gioielleria-bisio-asti', { 2: ['09:30-12:30', '15:30-19:30'], 3: ['09:30-12:30', '15:30-19:30'], 4: ['09:30-12:30', '15:30-19:30'], 5: ['09:30-12:30', '15:30-19:30'], 6: ['09:30-12:30', '15:30-19:30'] }, 'bisio-sito-20261025');
marchio('gioielleria-bisio-asti', 'rivenditaUfficiale', 'Longines', 'bisio-longines-20261025');
// 10-12) Recapiti e servizi documentati (Lombardia).
contatti('gioielleria-fontana-varese', '0332/234044', 'info@fontanapaolosrl.it', 'fontana-hamilton-20261025');
contatti('fasola-gioielleria-como', '+39 031263471', 'info@fasolagioielleria.it', 'fasola-sito-20261025');
servizio('fasola-gioielleria-como', 'riparazione', 'fasola-sito-20261025');
servizio('fasola-gioielleria-como', 'manutenzione', 'fasola-sito-20261025');
contatti('de-pascalis-spa-lecco', '0341/365035', 'info@depascalisgioielli.it', 'depascalis-longines-20261025');
orari('de-pascalis-spa-lecco', { 1: ['15:00-19:00'], 2: ['09:30-12:30', '15:00-19:00'], 3: ['09:30-12:30', '15:00-19:00'], 4: ['09:30-12:30', '15:00-19:00'], 5: ['09:30-12:30', '15:00-19:00'], 6: ['09:30-12:30', '15:00-19:00'] }, 'depascalis-longines-20261025');
// 13) Florio Folini — Sondrio: recapiti, orari della sede, servizi e perizie.
contatti('florio-folini-srl-sondrio', '+39 0342 512314', null, 'floriofolini-dove-20261025');
orari('florio-folini-srl-sondrio', { 2: ['09:00-12:30', '16:00-19:30'], 3: ['09:00-12:30', '16:00-19:30'], 4: ['09:00-12:30', '16:00-19:30'], 5: ['09:00-12:30', '16:00-19:30'], 6: ['09:00-12:30', '16:00-19:30'] }, 'floriofolini-dove-20261025');
servizio('florio-folini-srl-sondrio', 'revisione', 'floriofolini-servizi-20261025');
servizio('florio-folini-srl-sondrio', 'restauro-vintage', 'floriofolini-servizi-20261025');
servizio('florio-folini-srl-sondrio', 'valutazioni', 'floriofolini-servizi-20261025');
marchio('florio-folini-srl-sondrio', 'riparati', 'Rolex', 'floriofolini-rolex-20261025');
// 14) La Marca — Pavia: recapiti da scheda ufficiale Hamilton.
contatti('gioielleria-la-marca-vittorio-pavia', '0382/25078', 'gioielleria.lamarca@libero.it', 'lamarca-hamilton-20261025');
// 15) Torelli — Cremona: recapiti, orari, rivendita Omega; indirizzo discordante lasciato invariato (registro).
contatti('gioiellerie-torelli-cremona', '0372-410536', 'cremona@gioiellerietorelli.com', 'torelli-sito-20261025');
orari('gioiellerie-torelli-cremona', { 1: ['15:30-19:00'], 2: ['09:30-12:30', '15:30-19:00'], 3: ['09:30-12:30', '15:30-19:00'], 4: ['09:30-12:30', '15:30-19:00'], 5: ['09:30-12:30', '15:30-19:00'], 6: ['09:30-12:30', '15:30-19:00'] }, 'torelli-sito-20261025');
marchio('gioiellerie-torelli-cremona', 'rivenditaUfficiale', 'Omega', 'torelli-omega-20261025');
// 16) Angelini — Monza: solo rivendite documentate da schede ufficiali; recapiti in conflitto non inseriti.
marchio('gioielleria-angelini-srl-monza', 'rivenditaUfficiale', 'Longines', 'angelini-longines-20261025');
marchio('gioielleria-angelini-srl-monza', 'rivenditaUfficiale', 'Hamilton', 'angelini-hamilton-20261025');
marchio('gioielleria-angelini-srl-monza', 'rivenditaUfficiale', 'Omega', 'angelini-omega-20261025');

// Cronologia: ogni record modificato registra l'aggiornamento con le fonti usate.
for (const m of modificati) {
  const b = byId(m.id);
  b.attendibilita.cronologia.push({
    data: DATA,
    azione: `Lotto 1 di arricchimento: ${m.campi.join(', ')}`,
    fonti: [...new Set(b.attendibilita.fonti.concat(...b.servizi.map(s => s.fonti), ...b.contatti.fonti, ...b.orari.fonti))].slice(0, 6),
  });
  if (b.attendibilita.stato === 'da-verificare' && b.attendibilita.fonti.some(id => directory.fonti.find(f => f.id === id)?.tipo === 'sito-ufficiale')) {
    b.attendibilita.stato = 'fonti-verificate';
    b.attendibilita.verificataIl ??= DATA;
  }
}

const validato = directorySchema.parse(directory);
writeFileSync(FILE, `${JSON.stringify(validato, null, 2)}\n`);

const registro = {
  lotto: 'lotto-01-20261025',
  data: DATA,
  criterio: 'Solo dati documentati da fonti ufficiali consultate il 2026-10-25; nessun dato inventato.',
  attivitaEsaminate: 20,
  attivitaModificate: modificati.map(m => ({ id: m.id, campi: m.campi })),
  attivitaSenzaNuoviDati: ['rocca', 'pirone-napoli', 'censi-genova', 'trossello-courmayeur'],
  fontiAggiunte: nuoveFonti.map(f => ({ id: f.id, tipo: f.tipo, url: f.url })),
  anomalie: [
    'gioielleria-angelini-srl-monza: telefono discordante fra schede ufficiali dei marchi (039-6362219 Hamilton/Omega; 02/9608228 Longines): nessun recapito inserito.',
    'gioiellerie-torelli-cremona: indirizzo discordante (Corso Campi 21 A sul sito dell’attività; Corso Campi 15 su schede Longines/Omega): indirizzo invariato.',
    'trossello-courmayeur: seconda sede ad Aosta documentata, ma lo schema non prevede sedi multiple: non rappresentata.',
    'rocca: pagine ufficiali del gruppo non leggibili durante la consultazione: nessun dato aggiuntivo inserito.',
    'pirone-napoli, censi-genova: nessun recapito pubblicato nelle pagine ufficiali consultate.',
  ],
  nonFatto: [
    'Nessuna autorizzazione ufficiale aggiunta: le dichiarazioni di «riparatore ufficiale» (murgia, florio-folini, angolo, trossello) provengono dai siti delle attività e non da fonti dei marchi.',
  ],
};
writeFileSync('data/reports/lotto-01-20261025-applied.json', `${JSON.stringify(registro, null, 2)}\n`);
console.log(`Applicato: ${modificati.length} attività modificate, ${nuoveFonti.length} fonti aggiunte.`);
