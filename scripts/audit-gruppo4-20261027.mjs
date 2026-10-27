// Audit gruppo 4 — Lotto 6 (Campania, Puglia, Basilicata + Viterbo), 27 ottobre 2026.
// Correzioni documentali verificate con fonti primarie (Hamilton, Mido, siti ufficiali).
// Uso: node scripts/audit-gruppo4-20261027.mjs
import fs from 'node:fs';

const file = new URL('../site/data/directory.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const byUrl = (u) => d.fonti.find((f) => f.url === u);
const oggi = '2026-10-27';

const nuovaFonte = (id, url, titolo, tipo = 'marchio-ufficiale') => {
  if (!d.fonti.some((f) => f.id === id)) {
    d.fonti.push({ id, tipo, url, titolo, consultataIl: oggi, percorsoArchivio: null, licenza: null });
  }
  return id;
};

// Fonti sostituite: la scheda citata apparteneva a un'altra attività o era il locator generico.
const FONTI_NUOVE = {
  nazareno: nuovaFonte('l6-hamilton-nazareno-bancone-cerignola', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/cerignola/nazareno-bancone-gioielli', 'Store locator Hamilton — Nazareno Bancone Gioielli, Cerignola'),
  pace: nuovaFonte('l6-hamilton-pace-gioielli-brindisi', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/brindisi/pace-gioielli', 'Store locator Hamilton — Pace Gioielli, Brindisi'),
  isi: nuovaFonte('l6-hamilton-orzelleca-avellino', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/avellino/orzelleca-gioielli', 'Store locator Hamilton — Orzelleca Gioielli, Avellino'),
  orzelleca: nuovaFonte('l6-mido-orzelleca-benevento', 'https://www.midowatches.com/it/store-locator/italy/benevento/orzelleca-gioielli-a1vnn000001zkfcyae', 'Store locator Mido — Orzelleca Gioielli, Benevento'),
  pegy: nuovaFonte('l6-mido-gioielleria-pegy-avellino', 'https://www.midowatches.com/it/store-locator/italy/avellino/gioielleria-pegy-a1vnn000001zmheyam', 'Store locator Mido — Gioielleria Pegy, Avellino'),
  pignataro: nuovaFonte('l6-mido-pignataro-gioielli-andria', 'https://www.midowatches.com/it/store-locator/italy/andria-(bt)/pignataro-gioielli-a1vnn000001zli6yae', 'Store locator Mido — Pignataro Gioielli, Andria'),
  deleonardis: nuovaFonte('l6-mido-de-leonardis-castellaneta', 'https://www.midowatches.com/it/store-locator/italy/castellaneta/gioielleria-de-leonardis-a1vnn000001zmfnyae', 'Store locator Mido — Gioielleria De Leonardis, Castellaneta'),
  naviglio: nuovaFonte('l6-mido-naviglio-fiume-brindisi', 'https://www.midowatches.com/it/store-locator/italy/brindisi/naviglio-e-fiume-gioielleria-a1vnn000001zwilyau', 'Store locator Mido — Naviglio e Fiume Gioielleria, Brindisi'),
};

const STRAVOLA = byUrl('https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/san-severo/stravola-gioiellieri')?.id;
const BENEVENTO = byUrl('https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/benevento/orzelleca-gioielli')?.id;
const MIDO_GENERICO = byUrl('https://www.midowatches.com/it/store-locator')?.id;
if (!STRAVOLA || !BENEVENTO || !MIDO_GENERICO) throw new Error('fonti da sostituire non trovate');

const get = (id) => {
  const b = d.attivita.find((x) => x.id === id);
  if (!b) throw new Error(`scheda mancante: ${id}`);
  return b;
};

// Sostituisce ogni ref del record da una fonte errata a quella corretta (in tutti i campi).
const sostituisciFonte = (b, vecchia, nuova) => {
  let n = 0;
  const swap = (arr) => {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) if (arr[i] === vecchia) { arr[i] = nuova; n++; }
  };
  swap(b.posizione.fonti); swap(b.contatti.fonti); swap(b.orari.fonti);
  swap(b.storia.fonti); swap(b.attendibilita.fonti);
  for (const ev of b.storia.eventi) swap(ev.fonti);
  for (const voce of b.attendibilita.cronologia) swap(voce.fonti);
  for (const s of b.servizi) swap(s.fonti);
  for (const s of b.altriServizi) swap(s.fonti);
  for (const s of b.specializzazioni) swap(s.fonti);
  for (const lista of Object.values(b.marchi)) for (const m of lista) swap(m.fonti);
  if (b.posizione.coordinate) swap(b.posizione.coordinate.fonti);
  // dedup
  const dedup = (arr) => { if (Array.isArray(arr)) { const s = new Set(arr); arr.length = 0; arr.push(...s); } };
  dedup(b.posizione.fonti); dedup(b.contatti.fonti); dedup(b.orari.fonti);
  dedup(b.storia.fonti); dedup(b.attendibilita.fonti);
  for (const ev of b.storia.eventi) dedup(ev.fonti);
  for (const voce of b.attendibilita.cronologia) dedup(voce.fonti);
  for (const s of b.servizi) dedup(s.fonti);
  for (const s of b.altriServizi) dedup(s.fonti);
  for (const s of b.specializzazioni) dedup(s.fonti);
  for (const lista of Object.values(b.marchi)) for (const m of lista) dedup(m.fonti);
  return n;
};

const cronologia = (b, azione, fonti) => {
  b.attendibilita.cronologia.push({ data: oggi, azione, fonti });
  b.attendibilita.verificataIl = oggi;
};
const segnalazione = (b, motivo) => {
  b.attendibilita.segnalazioni.push({ data: oggi, motivo, stato: 'aperta' });
};

// 1. Fonti errate: Hamilton di Stravola (San Severo) usata per Nazareno e Pace.
let tot = 0;
tot += sostituisciFonte(get('nazareno-bancone-cerignola'), STRAVOLA, FONTI_NUOVE.nazareno);
tot += sostituisciFonte(get('pace-gioielli-brindisi'), STRAVOLA, FONTI_NUOVE.pace);
// 2. Fonte errata: Hamilton di Benevento usata per la sede di Avellino (Isi Srl).
tot += sostituisciFonte(get('isi-orzelleca-avellino'), BENEVENTO, FONTI_NUOVE.isi);
// 3. Locator Mido generico sostituito con le schede specifiche verificate.
tot += sostituisciFonte(get('orzelleca-gioielli-benevento'), MIDO_GENERICO, FONTI_NUOVE.orzelleca);
tot += sostituisciFonte(get('gioielleria-pegy-avellino'), MIDO_GENERICO, FONTI_NUOVE.pegy);
tot += sostituisciFonte(get('pignataro-gioielli-andria'), MIDO_GENERICO, FONTI_NUOVE.pignataro);
tot += sostituisciFonte(get('gioielleria-de-leonardis-castellaneta'), MIDO_GENERICO, FONTI_NUOVE.deleonardis);
tot += sostituisciFonte(get('naviglio-e-fiume-brindisi'), MIDO_GENERICO, FONTI_NUOVE.naviglio);
console.log('ref fonti sostituite:', tot);

// Cronologie di audit.
cronologia(get('nazareno-bancone-cerignola'),
  'Audit gruppo 4: sostituita la fonte Hamilton, che puntava alla scheda di Stravola Gioiellieri (San Severo), con la scheda ufficiale dell’attività a Cerignola; contatti e civico confermati dalla nuova fonte.',
  [FONTI_NUOVE.nazareno]);
cronologia(get('pace-gioielli-brindisi'),
  'Audit gruppo 4: sostituita la fonte Hamilton (puntava alla scheda di Stravola Gioiellieri) con la scheda ufficiale di Brindisi; rettificata la cronologia: attività nata a Ostuni nel 1970, punto vendita di Brindisi dal 2011, laboratorio dal 2019.',
  [FONTI_NUOVE.pace, 'l6-www-pacegioielli-com-chi-siamo', 'l6-www-pacegioielli-com-servizi']);
cronologia(get('isi-orzelleca-avellino'),
  'Audit gruppo 4: sostituita la fonte Hamilton (puntava alla scheda di Benevento) con la scheda ufficiale della sede di Avellino.',
  [FONTI_NUOVE.isi, 'l6-www-longines-com-it-store-id-isi-srl-orzelleca-avellino']);
cronologia(get('orzelleca-gioielli-benevento'),
  'Audit gruppo 4: sostituito il locator Mido generico con la scheda ufficiale dell’attività; storia aziendale 1940 conservata come dichiarazione del sito proprio.',
  [FONTI_NUOVE.orzelleca, 'l6-orzellecagioielli-it-azienda']);
for (const [id, f] of [['gioielleria-pegy-avellino', FONTI_NUOVE.pegy], ['pignataro-gioielli-andria', FONTI_NUOVE.pignataro], ['gioielleria-de-leonardis-castellaneta', FONTI_NUOVE.deleonardis], ['naviglio-e-fiume-brindisi', FONTI_NUOVE.naviglio]]) {
  cronologia(get(id), 'Audit gruppo 4: sostituito il locator Mido generico con la scheda ufficiale dell’attività; indirizzo, telefono ed email confermati.', [f]);
}
cronologia(get('gioielleria-ciletti-foggia'),
  'Audit gruppo 4: dati confermati dal sito ufficiale (fondazione 1950, laboratorio tecnico interno, recapiti); qualifica Rolex/Tudor non inserita tra le autorizzazioni confermate: locator ufficiali non leggibili (HTTP 403).',
  ['l6-giuseppeciletti-it', 'l6-giuseppeciletti-it-contatti', 'l6-giuseppeciletti-it-servizi']);
cronologia(get('franco-cuomo-gioielli-andria'),
  'Audit gruppo 4: recapiti confermati dal sito ufficiale; qualifica di centro assistenza certificato per Omega, Cartier, TAG Heuer e Zenith conservata come dichiarazione dell’attività, non come autorizzazione confermata.',
  ['l6-www-francocuomogioielli-it-contatti-html', 'l6-www-francocuomogioielli-it-centro-assistenza-certificato']);
cronologia(get('feni-gioielli-taranto'),
  'Audit gruppo 4: fondazione 1974 e rilievo della gioielleria Calderoni (1983) confermati dal sito ufficiale; rivendita Patek Philippe confermata dal punto vendita ufficiale del marchio; documentata la doppia sede in città.',
  ['l6-www-fenigioielli-com-storia', 'l6-www-fenigioielli-com-contact', 'l6-www-patek-com-en-points-of-sale-europe-italy-taranto-fen']);
for (const [id, fonti] of [
  ['menichelli-franco-viterbo', ['l6-www-longines-com-it-store-id-gioielli-di-menichelli-fran']],
  ['stravola-gioiellieri-san-severo', ['l6-www-hamiltonwatch-com-it-it-store-locator-italia-puglia']],
  ['landi-gioiellieri-barletta', ['l6-www-longines-com-it-store-id-landi-gioiellieri-di-landri']],
  ['iacovone-via-del-corso-matera', ['l6-www-longines-com-it-store-id-iacovone-via-del-corso-srl', 'l6-www-tissotwatches-com-it-it-store-iacovone-via-del-corso']],
  ['gioielleria-cometa-policoro', ['l6-www-hamiltonwatch-com-it-it-store-locator-italia-basilic']],
]) {
  cronologia(get(id), 'Audit gruppo 4: dati confermati dalle fonti ufficiali già citate; nessuna correzione necessaria.', fonti);
}

// Descrizioni rettificate.
get('pace-gioielli-brindisi').descrizione = 'Pace Gioielli in Corso Roma 13 a Brindisi, attività nata a Ostuni nel 1970 e presente a Brindisi dal 2011, dispone dal 2019 di un laboratorio interno per l’assistenza tecnica degli orologi Rolex e Tudor ed è rivenditore ufficiale Hamilton attestato dallo store locator del marchio.';
get('pace-gioielli-brindisi').storia.testo = 'Attiva a Ostuni dal 1970, Pace Gioielli è presente a Brindisi in Corso Roma dal 2011, quando divenne rivenditore Rolex per la provincia; dal 2019 la sede di Brindisi dispone di un laboratorio per l’assistenza tecnica orologiera.';
get('franco-cuomo-gioielli-andria').descrizione = 'Franco Cuomo Gioielli in Via Regina Margherita 87 ad Andria dichiara un centro assistenza orologiero interno certificato per marchi quali Omega, Cartier, TAG Heuer e Zenith, con revisioni complete, sostituzione batteria, test di impermeabilità e ripristino estetico.';
get('feni-gioielli-taranto').descrizione = 'Feni Gioielli in Via Domenico Acclavio 38-38/B a Taranto, fondata nel 1974 da Angelo Raffaele Nigro e Maria Rosaria Marzano e dal 1983 titolare anche della storica gioielleria Calderoni, è punto vendita ufficiale Patek Philippe e opera in città su due sedi, con servizi di sostituzione batteria, test di impermeabilità, controllo della marcia e cura del cinturino.';
get('orzelleca-gioielli-benevento').descrizione = 'Orzelleca Gioielli in Corso Garibaldi 190 a Benevento, secondo la storia aziendale nata nel 1940 come orologeria con laboratorio di riparazioni, è rivenditore ufficiale Longines, Hamilton e Mido, con servizi di manutenzione, sostituzione batteria e cinturino.';

// Segnalazioni aperte: discrepanze tra fonti, non risolvibili senza una fonte migliore.
segnalazione(get('orzelleca-gioielli-benevento'), 'Civico e recapiti discordanti tra le fonti: Longines riporta Corso Garibaldi 190, telefono 0824/21155 e email benevento@orzellecagioielli.it; Hamilton 190/196, telefono 0824/21690-08 e email laboratorioorzelleca@yahoo.it; Mido civico 194.');
segnalazione(get('isi-orzelleca-avellino'), 'Telefono discordante: Longines riporta 0825/35700, Hamilton 0824/21690.');
segnalazione(get('franco-cuomo-gioielli-andria'), 'Il sito indica anche una seconda sede in Corso Cavour 120 e un secondo telefono 0883 593129.');
segnalazione(get('feni-gioielli-taranto'), 'Due sedi in Taranto: Via D’Aquino 95 (Rolex e Tudor) e Via Domenico Acclavio 38/38/B (Patek Philippe, Omega, IWC).');
segnalazione(get('gioielleria-ciletti-foggia'), 'Il sito si dichiara rivenditore autorizzato Rolex e Tudor; i locator ufficiali dei due marchi non sono leggibili in questa sessione (HTTP 403): qualifica non inserita tra le autorizzazioni confermate.');
segnalazione(get('pace-gioielli-brindisi'), 'Il sito si dichiara rivenditore Rolex e Tudor; i locator ufficiali dei due marchi non sono leggibili in questa sessione (HTTP 403): qualifica non inserita tra le autorizzazioni confermate.');

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| fonti totali:', d.fonti.length);
