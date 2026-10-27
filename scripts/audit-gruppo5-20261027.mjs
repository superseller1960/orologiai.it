// Audit gruppo 5 — Lotto 5 Nord-Ovest (Piemonte, Liguria), 27 ottobre 2026.
// Correzioni e integrazioni verificate con fonti primarie (siti ufficiali, store locator, Unioncamere).
// Uso: node scripts/audit-gruppo5-20261027.mjs
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
};
const segnalazione = (b, motivo) => {
  b.attendibilita.segnalazioni.push({ data: oggi, motivo, stato: 'aperta' });
};

// 1. Orolab (Bra): il servizio «vendita usati» non è attestato dalle pagine citate del sito.
const orolab = get('orolab-bra');
const primaServizi = orolab.servizi.length;
orolab.servizi = orolab.servizi.filter((s) => s.id !== 'vendita-usati');
console.log(`orolab: rimossi ${primaServizi - orolab.servizi.length} claim servizio non supportati`);
cronologia(orolab,
  'Audit gruppo 5: rimosso il servizio «vendita usati», non attestato nelle pagine del sito ufficiali consultate (home, contatti, laboratorio, servizi); confermati valutazione, riparazione, revisione, batterie, vetri e test di impermeabilità.',
  ['l5-www-orolab-it', 'l5-www-orolab-it-contatti', 'l5-www-orolab-it-laboratorio']);

// 2. Dupanloup (Savona): variante cronologica 1880/1883 e autodichiarazione Rolex/Tudor.
const dup = get('dupanloup-savona');
cronologia(dup,
  'Audit gruppo 5: contatti e laboratorio confermati; Unioncamere riporta avvio dichiarato 1880 ma colloca l’apertura della ditta «nel 1883 circa», come il sito dell’attività.',
  ['l5-www-unioncamere-gov-it-imprese-storiche-dupanloup-srl', 'l5-www-dupanloup-it']);
segnalazione(dup, 'Variante cronologica: avvio dichiarato 1880 (Unioncamere) contro «1883 circa» nella narrazione della stessa scheda e «dal 1883» sul sito dell’attività.');
segnalazione(dup, 'Il sito si dichiara rivenditore autorizzato Rolex e Tudor; le pagine ufficiali dei due marchi non sono leggibili in questa sessione (HTTP 403): qualifiche non inserite tra le autorizzazioni confermate.');

// 3. Delfino (Savona): storia confermata (compreso il padre Vincenzo); telefono discordante tra fonti.
const del = get('gioielleria-delfino-savona');
cronologia(del,
  'Audit gruppo 5: fondazione 28 ottobre 1928, Giovanni Delfino (1899-1988) e tradizione familiare del padre Vincenzo confermati dal sito ufficiale; marchi e laboratorio confermati.',
  ['l5-www-delfinogioielli-com-negozio-savona-html']);
segnalazione(del, 'Telefono discordante: il sito dell’attività riporta 019 824917, le schede ufficiali Omega e Longines 019 851798.');

// 4. Rizzuto (Sarzana): variante d’indirizzo tra sito e scheda Hamilton.
const riz = get('rizzuto-gioielleria-sarzana');
cronologia(riz,
  'Audit gruppo 5: attività dal 1960, recapiti e marchi confermati; rivendita ufficiale Hamilton confermata dalla scheda del marchio.',
  ['l5-www-rizzutogioielleria-com-sarzana', 'l5-www-hamiltonwatch-com-it-it-store-locator-italia-liguria']);
segnalazione(riz, 'Variante indirizzo: il sito riporta Via Landinelli 60/62, la scheda Hamilton Via Ippolito Landinelli 60.');

// 5. Henry (Alessandria): la scheda Mido conferma recapiti e qualifica; il sito proprio non è leggibile (JS).
const hen = get('henry-gioielli-alessandria');
cronologia(hen,
  'Audit gruppo 5: indirizzo, telefono, email e rivendita ufficiale Mido confermati dalla scheda ufficiale del marchio.',
  ['l5-www-midowatches-com-it-store-locator-italy-alessandria-h']);
segnalazione(hen, 'Il sito proprio non ha restituito testo leggibile in questa sessione (pagina renderizzata in JS): laboratorio e marchi oltre Mido (Tissot, Locman, Citizen) non sono stati ricontrollabili direttamente.');

// 6. Biondi (Vercelli): laboratorio confermato; autodichiarazione centro assistenza Rolex.
const bio = get('biondi-vercelli');
cronologia(bio,
  'Audit gruppo 5: fondazione 1949, laboratorio interno, recapiti e marchi trattati confermati dal sito ufficiale.',
  ['l5-www-biondivercelli-com', 'l5-www-biondivercelli-com-contatti']);
segnalazione(bio, 'Il sito dichiara che Rolex certifica il laboratorio come centro assistenza autorizzato; la pagina Rolex non è leggibile in questa sessione (HTTP 403): qualifica non inserita tra le autorizzazioni confermate.');

// 7. Era Ora (Vercelli): integrazione della storia documentata dal sito.
const eraFonte = nuovaFonte('l5-www-orologeriaeraora-it-lanostrastoria', 'https://www.orologeriaeraora.it/orologeria-era-ora-lanostrastoria', 'Sito Orologeria Era Ora — la nostra storia');
const era = get('orologeria-era-ora-vercelli');
era.storia.annoFondazione = 2019;
era.storia.testo = 'Attività avviata nel 2019 da Stefano e trasferita nel 2022 nell’attuale sede di Via Fratelli Laviny, dove sorge il laboratorio condotto da Matteo e Paolo, indicati sul sito ufficiale come terza generazione di orologiai a Vercelli.';
era.storia.fonti = [...new Set([...era.storia.fonti, eraFonte])];
era.descrizione = 'Orologeria Era Ora in Via Fratelli Laviny 17 a Vercelli è un laboratorio di terza generazione specializzato in riparazioni, revisioni, restauri, lucidatura di casse e bracciali e interventi su orologi moderni, vintage, da parete e da appoggio; per gli interventi più complessi si avvale di laboratori esterni qualificati.';
cronologia(era,
  'Audit gruppo 5: recapiti e servizi confermati; integrata la storia documentata (avvio 2019, trasferimento 2022) e precisato l’uso di laboratori esterni per gli interventi complessi.',
  [eraFonte, 'l5-www-orologeriaeraora-it', 'l5-www-orologeriaeraora-it-laboratorio']);

// 8. Rabino (Cuneo): email non ricontrollabile nella forma esatta.
const rab = get('gioielleria-rabino-cuneo');
cronologia(rab,
  'Audit gruppo 5: indirizzo, telefono, fondazione 1895, quattro generazioni e laboratorio orologeria dal 2004 confermati dal sito ufficiale.',
  ['l5-www-gioielleriarabino-com', 'l5-www-gioielleriarabino-com-la-nostra-storia', 'l5-www-gioielleriarabino-com-i-nostri-laboratori-2']);
segnalazione(rab, 'L’email non è stata ricontrollabile nella forma esatta: la pagina contatti mostra l’indirizzo mascherato e la richiesta diretta è bloccata (HTTP 403).');

// 9. Conferme senza correzioni.
cronologia(get('casciola-gioielli-cuneo'),
  'Audit gruppo 5: indirizzo, telefono, email e servizi tecnici confermati dal sito ufficiale; nessuna correzione necessaria.',
  ['l5-www-casciolagioielli-com', 'l5-www-casciolagioielli-com-contatti', 'l5-www-casciolagioielli-com-i-nostri-servizi']);
cronologia(get('antica-casa-traverso-la-spezia'),
  'Audit gruppo 5: fondazione 1920, quarta generazione, arredi storici originali, recapiti e assortimento confermati dal sito ufficiale; nessun laboratorio di riparazione orologiera dichiarato.',
  ['l5-anticacasatraverso-com', 'l5-anticacasatraverso-com-chi-siamo', 'l5-anticacasatraverso-com-contatti']);
cronologia(get('luigi-rosso-casale-monferrato'),
  'Audit gruppo 5: recapiti (indicato anche il secondo numero 0142 453328), attività dal 1992 con esperienze dal 1986 e interventi di riparazione, restauro e rimessa a nuovo confermati dal sito ufficiale.',
  ['l5-www-luigirossogioielli-com-it-contatti', 'l5-www-luigirossogioielli-com-it-assistenza', 'l5-www-luigirossogioielli-com-en-about-us']);

fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('attività totali:', d.attivita.length, '| fonti totali:', d.fonti.length);
