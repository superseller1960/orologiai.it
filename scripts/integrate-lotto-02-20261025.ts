// Lotto 2 di arricchimento (2026-10-25): 37 attività senza telefono esaminate su fonti ufficiali.
// Solo dati documentati; nessuna autorizzazione di marchio attribuita senza fonte del marchio.
// Uso: npx tsx scripts/integrate-lotto-02-20261025.ts (si rifiuta se già applicato).
import { readFileSync, writeFileSync } from 'node:fs';
import { directorySchema, type Directory, type Business } from '../site/src/lib/schema.ts';

const FILE = 'site/data/directory.json';
const DATA = '2026-10-25';
const directory = directorySchema.parse(JSON.parse(readFileSync(FILE, 'utf8'))) as Directory;
if (directory.fonti.some(f => f.id === 'giorgi-sito-20261025')) {
  console.error('Lotto 2 già applicato: nessuna modifica.');
  process.exit(1);
}

type NuovaFonte = { id: string; tipo: 'sito-ufficiale' | 'marchio-ufficiale' | 'directory'; url: string; titolo: string };
const nuove: NuovaFonte[] = [];
// Riutilizza una fonte esistente con lo stesso URL; altrimenti registra la nuova.
const fonte = (id: string, tipo: NuovaFonte['tipo'], url: string, titolo: string): string => {
  const presente = directory.fonti.find(f => f.url === url);
  if (presente) return presente.id;
  if (!nuove.some(f => f.id === id)) nuove.push({ id, tipo, url, titolo });
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
const contatti = (id: string, spec: { tel?: string | null; mail?: string | null; sito?: string | null; whatsapp?: string | null }, src: string[]) => {
  const b = byId(id);
  if (spec.tel && !b.contatti.telefono) b.contatti.telefono = spec.tel;
  if (spec.mail && !b.contatti.email) b.contatti.email = spec.mail;
  if (spec.sito && !b.contatti.sito) b.contatti.sito = spec.sito;
  if (spec.whatsapp && !b.contatti.whatsapp) b.contatti.whatsapp = spec.whatsapp;
  for (const s of src) if (!b.contatti.fonti.includes(s)) b.contatti.fonti.push(s);
  toccato(id, 'contatti');
};
// giorni: 1=lunedì … 7=domenica; i giorni chiusi espliciti hanno intervalli vuoti.
const g = (giorno: number, ...fascie: string[]) => ({
  giorno,
  intervalli: fascie.map(f => { const [apertura, chiusura] = f.split('-'); return { apertura, chiusura }; }),
});
const orari = (id: string, giorni: ReturnType<typeof g>[], src: string) => {
  const b = byId(id);
  b.orari.giorni = giorni;
  b.orari.verificatiIl = DATA;
  if (!b.orari.fonti.includes(src)) b.orari.fonti.push(src);
  toccato(id, 'orari');
};
const servizio = (id: string, servizioId: Business['servizi'][number]['id'], src: string) => {
  const b = byId(id);
  if (b.servizi.some(s => s.id === servizioId)) return;
  b.servizi.push({ id: servizioId, fonti: [src] });
  toccato(id, `servizio:${servizioId}`);
};
const marchio = (id: string, ruolo: 'venduti' | 'riparati' | 'rivenditaUfficiale' | 'assistenzaUfficiale', marca: string, src: string) => {
  const b = byId(id);
  if (b.marchi[ruolo].some(m => m.marca === marca)) return;
  b.marchi[ruolo].push({ marca, fonti: [src] });
  toccato(id, `marchio:${ruolo}:${marca}`);
};

// --- Fonti ---
const F = {
  giorgiSito: fonte('giorgi-sito-20261025', 'sito-ufficiale', 'https://www.gioielleriagiorgi.com/', 'Gioielleria Giorgi — sito ufficiale'),
  giorgiHam: fonte('giorgi-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/en-sa/store-locator/italie/marche/ancona/gioielleria-giorgi-mario', 'Hamilton — scheda rivenditore Giorgi, Ancona'),
  fraschettiBreil: fonte('fraschetti-breil-20261025', 'marchio-ufficiale', 'https://www.breil.com/store/rivenditori-manta/gioielleria-fraschetti/', 'Breil — scheda rivenditore Fraschetti, Rieti'),
  iannicelliSito: fonte('iannicelli-sito-20261025', 'sito-ufficiale', 'https://iannicelli.com/', 'Gioielleria Iannicelli — sito ufficiale'),
  iannicelliRolex: fonte('iannicelli-rolex-20261025', 'sito-ufficiale', 'https://rolex.iannicelli.com/contatti/', 'Gioielleria Iannicelli — contatti e revisioni (sito dell’attività)'),
  demarchiHalles: fonte('demarchi-leshalles-20261025', 'directory', 'https://www.leshallesdaoste.com/index.php?option=com_content&view=article&id=145&catid=16&Itemid=148', 'Les Halles d’Aoste — scheda Gioielleria De Marchi Gianotti'),
  benettiSito: fonte('benetti-sito-20261025', 'sito-ufficiale', 'https://benetti.store/gioielleria-e-ottica-benetti', 'Gioielleria e Ottica Benetti — contatti e orari (sito ufficiale)'),
  deruiLongines: fonte('derui-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/oreficeria-de-rui-srl-treviso-27265', 'Longines — scheda rivenditore De Rui, Treviso'),
  deruiTissot: fonte('derui-tissot-20261025', 'marchio-ufficiale', 'https://www.tissotwatches.com/it-it/store/oreficeria-de-rui-srl/a1vNN0000020RvDYAU', 'Tissot — scheda rivenditore De Rui, Treviso'),
  eyesonHam: fonte('eyeson-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/veneto/venezia/eyes-on-time', 'Hamilton — scheda rivenditore Eyes On Time, Venezia'),
  tebaldiSito: fonte('tebaldi-sito-20261025', 'sito-ufficiale', 'https://gioielleriatebaldi.it/pages/services', 'Gioielleria Tebaldi — servizi dichiarati (sito ufficiale)'),
  cimattiSito: fonte('cimatti-sito-20261025', 'sito-ufficiale', 'https://cimattigioie.com/cimatti-gioielli/', 'F.lli Cimatti — storia e attività (sito ufficiale)'),
  cimattiHam: fonte('cimatti-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/emilia-romagna/ravenna/gioielleria-f-lli-cimatti', 'Hamilton — scheda rivenditore F.lli Cimatti, Ravenna'),
  ricciSito: fonte('ricci-sito-20261025', 'sito-ufficiale', 'https://www.riccicamillo.com/contatti/', 'Gioielleria Ricci Camillo — contatti (sito ufficiale)'),
  zaccarelliLongines: fonte('zaccarelli-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/zaccarelli-enzo-c-sas-modena-143463', 'Longines — scheda rivenditore Zaccarelli, Modena'),
  zaccarelliComune: fonte('zaccarelli-comune-20261025', 'directory', 'https://www.comune.modena.it/argomenti/commercio-al-minuto/albo-comunale-delle-botteghe-e-dei-mercati-storici/elenco-delle-botteghe-e-dei-mercati-storici/orologiaio-zaccarelli-enzo', 'Comune di Modena — albo botteghe e mercati storici'),
  boniSito: fonte('boni-sito-20261025', 'sito-ufficiale', 'https://www.gioielleriaboni.it/riparazione-orologi', 'Gioielleria Boni — riparazione orologi (sito ufficiale)'),
  pedonesiSito: fonte('pedonesi-sito-20261025', 'sito-ufficiale', 'https://gioielleriapedonesi.it/pages/i-nostri-negozi', 'Gioielleria Pedonesi — negozi, contatti e orari (sito ufficiale)'),
  fabianiSito: fonte('fabiani-sito-20261025', 'sito-ufficiale', 'https://www.fabianigioiellerie.com/pages/boutique-fabiani-toscana', 'Fabiani Gioiellerie — boutique (sito ufficiale)'),
  fabianiLongines: fonte('fabiani-longines-20261025', 'marchio-ufficiale', 'https://www.longines.com/it/store/id/fabiani-gioiellerie-pistoia-1686762', 'Longines — scheda rivenditore Fabiani, Pistoia'),
  lawwatchHam: fonte('lawwatch-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/toscana/lucca/law-watch-di-paolo-simi', 'Hamilton — centro assistenza ufficiale Law & Watch, Lucca'),
  mancusoContatti: fonte('mancuso-contatti-20261025', 'sito-ufficiale', 'https://www.orologeriamancuso.com/contatti', 'Orologeria Mancuso — contatti e orari (sito ufficiale)'),
  mancusoLab: fonte('mancuso-laboratorio-20261025', 'sito-ufficiale', 'https://www.orologeriamancuso.com/laboratorio', 'Orologeria Mancuso — laboratorio e servizi (sito ufficiale)'),
  mancusoPermuta: fonte('mancuso-permuta-20261025', 'sito-ufficiale', 'https://www.orologeriamancuso.com/secondo-polso/vendi-o-permuta', 'Orologeria Mancuso — vendita, permuta e valutazioni (sito ufficiale)'),
  cotifavaOrari: fonte('cotifava-orari-20261025', 'sito-ufficiale', 'https://www.orologeriacotifava.com/orarieinfo.html', 'Orologeria Cotifava — orari e contatti (sito ufficiale)'),
  cotifavaRip: fonte('cotifava-riparazioni-20261025', 'sito-ufficiale', 'https://www.orologeriacotifava.com/haiunorologiodariparare.html', 'Orologeria Cotifava — riparazioni (sito ufficiale)'),
  cotifavaTeam: fonte('cotifava-team-20261025', 'sito-ufficiale', 'https://www.orologeriacotifava.com/ilnostroteam.html', 'Orologeria Cotifava — team e servizi (sito ufficiale)'),
  vergariSito: fonte('vergari-sito-20261025', 'sito-ufficiale', 'https://www.vergarigioielli.it/', 'Vergari Gioielli — sito ufficiale'),
  benenatiSito: fonte('benenati-home-20261025', 'sito-ufficiale', 'https://benenati-msd4.webnode.it/', 'Benenati MSD — servizi (sito ufficiale)'),
  benenatiContatti: fonte('benenati-contatti-20261025', 'sito-ufficiale', 'https://benenati-msd4.webnode.it/contatti/', 'Benenati MSD — contatti e orari (sito ufficiale)'),
  clockContatti: fonte('clockservice-contatti-20261025', 'sito-ufficiale', 'https://www.clockservice.it/contatti/', 'Clock Service — contatti e orari (sito ufficiale)'),
  clockSito: fonte('clockservice-sito-20261025', 'sito-ufficiale', 'https://www.clockservice.it/', 'Clock Service — servizi (sito ufficiale)'),
  centrorologiServizi: fonte('centrorologi-servizi-20261025', 'sito-ufficiale', 'https://centrorologi.net/servizi/', 'Centrorologi — servizi (sito ufficiale)'),
  centrorologiChi: fonte('centrorologi-chisiamo-20261025', 'sito-ufficiale', 'https://centrorologi.net/chi-siamo/', 'Centrorologi — chi siamo (sito ufficiale)'),
  lamottaLab: fonte('lamotta-laboratorio-20261025', 'sito-ufficiale', 'https://www.lamottagioielli.it/laboratorio/', 'La Motta Gioielli — laboratorio (sito ufficiale)'),
  lamottaContatti: fonte('lamotta-contatti-20261025', 'sito-ufficiale', 'https://www.lamottagioielli.it/contact-us/', 'La Motta Gioielli — contatti e orari (sito ufficiale)'),
  daleHam: fonte('dale-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/sicilia/trapani/laboratorio-orologi-di-andrea-d-ale', 'Hamilton — centro assistenza ufficiale Laboratorio D’Ale, Trapani'),
  dimarcoChi: fonte('dimarco-chisiamo-20261025', 'sito-ufficiale', 'https://www.gioielleriadimarco.it/chisiamo.php', 'Gioielleria Di Marco — laboratorio (sito ufficiale)'),
  dimarcoContatti: fonte('dimarco-contatti-20261025', 'sito-ufficiale', 'https://www.gioielleriadimarco.it/contatti.php', 'Gioielleria Di Marco — contatti (sito ufficiale)'),
  denurraContatti: fonte('denurra-contatti-20261025', 'sito-ufficiale', 'https://www.denurra.it/contatti/', 'Gioielleria De Nurra — contatti e orari (sito ufficiale)'),
  denurraHome: fonte('denurra-home-20261025', 'sito-ufficiale', 'https://www.denurra.it/', 'Gioielleria De Nurra — servizi (sito ufficiale)'),
  chiocchettiLab: fonte('chiocchetti-laboratorio-20261025', 'sito-ufficiale', 'https://www.chiocchetti1896.com/laboratorio/', 'Gioielleria Chiocchetti — laboratorio (sito ufficiale)'),
  chiocchettiContatti: fonte('chiocchetti-contatti-20261025', 'sito-ufficiale', 'https://www.chiocchetti1896.com/contatti/', 'Gioielleria Chiocchetti — contatti e orari (sito ufficiale)'),
  demarcoContatti: fonte('demarco-contatti-20261025', 'sito-ufficiale', 'https://www.demarco-belluno.it/contatti/', 'De Marco — contatti (sito ufficiale)'),
  demarcoRip: fonte('demarco-riparazioni-20261025', 'sito-ufficiale', 'https://www.demarco-belluno.it/riparazioni-orologi-a-belluno/', 'De Marco — riparazioni orologi (sito ufficiale)'),
  grandeContatti: fonte('grande-contatti-20261025', 'sito-ufficiale', 'https://www.gioielleriagrande.it/contatti/', 'Gioielleria Grande — contatti e sedi (sito ufficiale)'),
  grandeAssistenza: fonte('grande-assistenza-20261025', 'sito-ufficiale', 'https://www.gioielleriagrande.it/centro-assistenza/', 'Gioielleria Grande — centro assistenza (sito ufficiale)'),
  grandeRolex: fonte('grande-rolex-20261025', 'sito-ufficiale', 'https://www.gioielleriagrande.it/rolex/contatti/frosinone/', 'Gioielleria Grande — sezione Rolex della sede (sito ufficiale)'),
  bottegaLab: fonte('bottega-laboratorio-20261025', 'sito-ufficiale', 'https://bottegawatches.com/laboratorio', 'Bottega Watches — laboratorio (sito ufficiale)'),
  bottegaContatti: fonte('bottega-spedizioni-20261025', 'sito-ufficiale', 'https://bottegawatches.com/norme-di-spedizione', 'Bottega Watches — sede e contatti (sito ufficiale)'),
  martinesContatti: fonte('martines-contatti-20261025', 'sito-ufficiale', 'https://www.gioielleriamartines.it/contatti-gioielleria-martines.html', 'Martines Gioielleria — contatti e orari (sito ufficiale)'),
  martinesAssistenza: fonte('martines-assistenza-20261025', 'sito-ufficiale', 'https://www.gioielleriamartines.it/assistenza-rolex-orologi-gioielleria-martines.html', 'Martines Gioielleria — assistenza orologi (sito ufficiale)'),
  mirolliRolex: fonte('mirolli-rolex-20261025', 'sito-ufficiale', 'https://mirolli.it/rolex/contatti/', 'Mirolli — contatti e servizi (sito ufficiale)'),
  mirolliGioielleria: fonte('mirolli-gioielleria-20261025', 'sito-ufficiale', 'https://mirolli.it/gioielleria-grosseto-mirolli/', 'Mirolli — gioielleria e orari (sito ufficiale)'),
};

// --- Contatti, orari, servizi, marchi ---
contatti('gioielleria-giorgi-mario-ancona', { tel: '071/56255', mail: 'info@gioielleriagiorgi.it', sito: 'https://www.gioielleriagiorgi.com/' }, [F.giorgiHam, F.giorgiSito]);
contatti('gioielleria-fraschetti-rieti', { tel: '0746482915', mail: 'fraschettisnc@gmail.com' }, [F.fraschettiBreil]);
marchio('gioielleria-fraschetti-rieti', 'rivenditaUfficiale', 'Breil', F.fraschettiBreil);
contatti('gioielleria-iannicelli-caserta', { tel: '+39 0823 210 378', mail: 'info@iannicelli.com', sito: 'https://iannicelli.com/' }, [F.iannicelliRolex, F.iannicelliSito]);
orari('gioielleria-iannicelli-caserta', [g(1, '16:15-20:00'), g(2, '09:15-13:00', '16:15-20:00'), g(3, '09:15-13:00', '16:15-20:00'), g(4, '09:15-13:00', '16:15-20:00'), g(5, '09:15-13:00', '16:15-20:00'), g(6, '09:15-13:00', '16:15-20:00'), g(7)], F.iannicelliRolex);
servizio('gioielleria-iannicelli-caserta', 'revisione', F.iannicelliRolex);
contatti('de-marchi-gianotti-aosta', { tel: '0165 44666', sito: 'https://www.demarchigianotti.com/' }, [F.demarchiHalles]);
servizio('de-marchi-gianotti-aosta', 'riparazione', F.demarchiHalles);
// Benetti: due punti vendita con recapiti diversi; si usa quello coerente con l'indirizzo del record.
{
  const b = byId('gioielleria-benetti-verona');
  const addr = b.posizione.indirizzo ?? '';
  if (/Mantovana/.test(addr)) {
    contatti('gioielleria-benetti-verona', { tel: '045 862 2214' }, [F.benettiSito]);
    orari('gioielleria-benetti-verona', [g(2, '09:00-12:30', '15:30-19:30'), g(3, '09:00-12:30', '15:30-19:30'), g(4, '09:00-12:30', '15:30-19:30'), g(5, '09:00-12:30', '15:30-19:30'), g(6, '09:00-12:30', '15:30-19:30'), g(1), g(7)], F.benettiSito);
  } else if (/Erbe/.test(addr)) {
    contatti('gioielleria-benetti-verona', { tel: '045 594559' }, [F.benettiSito]);
    orari('gioielleria-benetti-verona', [g(2, '10:00-19:30'), g(3, '10:00-19:30'), g(4, '10:00-19:30'), g(5, '10:00-19:30'), g(6, '10:00-19:30'), g(7, '15:00-19:30'), g(1)], F.benettiSito);
  } else {
    console.warn(`Benetti: indirizzo record «${addr}» non riconducibile ai due punti vendita: nessun recapito inserito.`);
  }
}
contatti('oreficeria-de-rui-treviso', { tel: '0422/548749', mail: 'gioielleriaderui@gmail.com' }, [F.deruiLongines]);
orari('oreficeria-de-rui-treviso', [g(2, '09:00-12:30', '15:30-19:30'), g(3, '09:00-12:30', '15:30-19:30'), g(4, '09:00-12:30', '15:30-19:30'), g(5, '09:00-12:30', '15:30-19:30'), g(6, '09:00-12:30', '15:30-19:30')], F.deruiLongines);
servizio('oreficeria-de-rui-treviso', 'manutenzione', F.deruiLongines);
servizio('oreficeria-de-rui-treviso', 'cinturini', F.deruiLongines);
marchio('oreficeria-de-rui-treviso', 'rivenditaUfficiale', 'Longines', F.deruiLongines);
marchio('oreficeria-de-rui-treviso', 'rivenditaUfficiale', 'Tissot', F.deruiTissot);
contatti('eyes-on-time-venezia', { tel: '+39 041 2603804' }, [F.eyesonHam]);
contatti('gioielleria-tebaldi-ferrara', { tel: '0532/200132', mail: 'gioielleria.tebaldi@libero.it', sito: 'https://gioielleriatebaldi.it/' }, [F.tebaldiSito]);
servizio('gioielleria-tebaldi-ferrara', 'riparazione', F.tebaldiSito);
servizio('gioielleria-tebaldi-ferrara', 'batterie', F.tebaldiSito);
servizio('gioielleria-tebaldi-ferrara', 'manutenzione', F.tebaldiSito);
contatti('gioielleria-f-lli-cimatti-ravenna', { tel: '0544/35750', mail: 'infocimattigioie@gmail.com', sito: 'https://cimattigioie.com/' }, [F.cimattiHam, F.cimattiSito]);
orari('gioielleria-f-lli-cimatti-ravenna', [g(1, '09:30-13:00'), g(2, '09:30-12:30', '16:00-19:30'), g(3, '09:30-12:30', '16:00-19:30'), g(4, '09:30-12:30', '16:00-19:30'), g(5, '09:30-12:30', '16:00-19:30'), g(6, '09:30-12:30', '16:00-19:30')], F.cimattiHam);
servizio('gioielleria-f-lli-cimatti-ravenna', 'vendita-usati', F.cimattiSito);
{
  const b = byId('gioielleria-f-lli-cimatti-ravenna');
  if (!b.storia.testo) {
    b.storia.testo = 'Il sito dell’attività racconta la «Clinica dell’Orologio» come laboratorio di riparazione attivo dal 1949.';
    b.storia.fonti.push(F.cimattiSito);
    toccato(b.id, 'storia');
  }
}
contatti('gioielleria-ricci-forli', { tel: '0543 24026', mail: 'info@riccicamillo.com', sito: 'https://www.riccicamillo.com/' }, [F.ricciSito]);
contatti('zaccarelli-orologeria-modena', { tel: '059/222011', mail: 'zacc8@libero.it' }, [F.zaccarelliLongines]);
orari('zaccarelli-orologeria-modena', [g(1, '09:00-13:00', '16:00-19:30'), g(2, '09:00-13:00', '16:00-19:30'), g(3, '09:00-13:00', '16:00-19:30'), g(4, '09:00-13:00'), g(5, '09:00-13:00', '16:00-19:30'), g(6, '09:00-13:00', '16:00-19:30')], F.zaccarelliLongines);
servizio('zaccarelli-orologeria-modena', 'manutenzione', F.zaccarelliLongines);
servizio('zaccarelli-orologeria-modena', 'cinturini', F.zaccarelliLongines);
marchio('zaccarelli-orologeria-modena', 'rivenditaUfficiale', 'Longines', F.zaccarelliLongines);
{
  const b = byId('zaccarelli-orologeria-modena');
  if (!b.storia.testo) {
    b.storia.testo = 'Iscritta all’albo comunale delle botteghe e dei mercati storici di Modena.';
    b.storia.fonti.push(F.zaccarelliComune);
    toccato(b.id, 'storia');
  }
}
contatti('gioielleria-boni-belluno', { tel: '+39 0437 942416', mail: 'gioielleriaboni@gmail.com', sito: 'https://www.gioielleriaboni.it/' }, [F.boniSito]);
servizio('gioielleria-boni-belluno', 'riparazione', F.boniSito);
contatti('b-b-gioielli-rovigo', { tel: '3282684045', mail: 'info@ballotempoepreziosi.com' }, [fonte('bb-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/it-it/store-locator/italia/veneto/rovigo/b-b-gioielli', 'Hamilton — scheda rivenditore B&B Gioielli, Rovigo')]);
contatti('gioielleria-pedonesi-lucca', { tel: '0583492068', mail: 'info@gioielleriapedonesi.it' }, [F.pedonesiSito]);
orari('gioielleria-pedonesi-lucca', [g(1, '15:30-19:30'), g(2, '09:00-13:00', '15:30-19:30'), g(3, '09:00-13:00', '15:30-19:30'), g(4, '09:00-13:00', '15:30-19:30'), g(5, '09:00-13:00', '15:30-19:30'), g(6, '09:00-13:00', '15:30-19:30')], F.pedonesiSito);
servizio('gioielleria-pedonesi-lucca', 'gioielleria', F.pedonesiSito);
contatti('casa-avelardi-livorno', { tel: '0586/898140', mail: 'swatchlivorno@hotmail.it' }, [fonte('avelardi-hamilton-20261025', 'marchio-ufficiale', 'https://www.hamiltonwatch.com/en-hk/store-locator/italia/toscana/livorno/casa-avelardi', 'Hamilton — scheda rivenditore Casa Avelardi, Livorno')]);
contatti('fabiani-gioiellerie-pistoia', { tel: '0573/367513', mail: 'amministrazione@oreficeriefabiani.it' }, [F.fabianiSito, F.fabianiLongines]);
orari('fabiani-gioiellerie-pistoia', [g(1, '15:30-19:30'), g(2, '09:30-13:00', '15:30-19:30'), g(3, '09:30-19:30'), g(4, '09:30-13:00', '15:30-19:30'), g(5, '09:30-13:00', '15:30-19:30'), g(6, '09:30-19:30')], F.fabianiLongines);
servizio('fabiani-gioiellerie-pistoia', 'cinturini', F.fabianiLongines);
marchio('fabiani-gioiellerie-pistoia', 'rivenditaUfficiale', 'Longines', F.fabianiLongines);
contatti('law-watch-di-paolo-simi-lucca', { tel: '0584/55025' }, [F.lawwatchHam]);
servizio('law-watch-di-paolo-simi-lucca', 'batterie', F.lawwatchHam);
servizio('law-watch-di-paolo-simi-lucca', 'cinturini', F.lawwatchHam);
marchio('law-watch-di-paolo-simi-lucca', 'assistenzaUfficiale', 'Hamilton', F.lawwatchHam);
contatti('orologeria-mancuso-como', { tel: '031 4973710', mail: 'info@orologeriamancuso.com', sito: 'https://www.orologeriamancuso.com/' }, [F.mancusoContatti, F.mancusoLab]);
orari('orologeria-mancuso-como', [g(2, '09:30-17:00'), g(3, '09:30-17:00'), g(4, '09:30-17:00'), g(5, '09:30-17:00'), g(6, '09:30-17:00')], F.mancusoContatti);
for (const s of ['riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita-usati', 'valutazioni'] as const) servizio('orologeria-mancuso-como', s, F.mancusoLab);
contatti('orologeria-cotifava-dal-1946-mantova', { tel: '+39 3456412556', whatsapp: '+393456412556' }, [F.cotifavaOrari]);
orari('orologeria-cotifava-dal-1946-mantova', [g(1), g(2, '08:30-12:30', '16:00-18:30'), g(3, '08:30-12:30'), g(4, '08:30-12:30', '16:00-18:30'), g(5, '08:30-12:30', '16:00-18:30'), g(6, '08:30-12:30'), g(7)], F.cotifavaOrari);
servizio('orologeria-cotifava-dal-1946-mantova', 'riparazione', F.cotifavaRip);
servizio('orologeria-cotifava-dal-1946-mantova', 'revisione', F.cotifavaTeam);
servizio('orologeria-cotifava-dal-1946-mantova', 'vendita-usati', F.cotifavaTeam);
contatti('vergari-gioielli-botrugno', { tel: '0836 997212', mail: 'info@vergarigioielli.it', sito: 'https://www.vergarigioielli.it/' }, [F.vergariSito]);
orari('vergari-gioielli-botrugno', [g(1, '09:00-12:30', '17:00-20:30'), g(2, '09:00-12:30', '17:00-20:30'), g(3, '09:00-12:30', '17:00-20:30'), g(4, '09:00-12:30'), g(5, '09:00-12:30', '17:00-20:30'), g(6, '09:00-12:30', '17:00-20:30')], F.vergariSito);
for (const s of ['riparazione', 'batterie', 'cinturini'] as const) servizio('vergari-gioielli-botrugno', s, F.vergariSito);
contatti('benenati-msd-catania', { tel: '095 445543', mail: 'benenati.msd@libero.it', sito: 'https://benenati-msd4.webnode.it/' }, [F.benenatiContatti, F.benenatiSito]);
orari('benenati-msd-catania', [g(1, '09:00-13:00', '16:00-20:00'), g(2, '09:00-13:00', '16:00-20:00'), g(3, '09:00-13:00', '16:00-20:00'), g(4, '09:00-13:00', '16:00-20:00'), g(5, '09:00-13:00', '16:00-20:00'), g(6, '09:00-13:00', '16:00-20:00'), g(7)], F.benenatiContatti);
for (const s of ['riparazione', 'riparazione-meccanici', 'riparazione-quarzo', 'restauro-vintage', 'batterie', 'pendoleria'] as const) servizio('benenati-msd-catania', s, F.benenatiSito);
contatti('clock-service-catania', { tel: '392 7198711', mail: 'clockservice@hotmail.it', sito: 'https://www.clockservice.it/' }, [F.clockContatti, F.clockSito]);
orari('clock-service-catania', [g(1, '09:00-13:00', '16:30-19:30'), g(2, '09:00-13:00', '16:30-19:30'), g(3, '09:00-13:00', '16:30-19:30'), g(4, '09:00-13:00', '16:30-19:30'), g(5, '09:00-13:00', '16:30-19:30'), g(6, '09:00-13:00')], F.clockContatti);
for (const s of ['riparazione', 'revisione', 'restauro-vintage', 'batterie', 'pendoleria', 'vendita'] as const) servizio('clock-service-catania', s, F.clockSito);
contatti('centrorologi-gravina-di-catania', { tel: '+39 095415199', mail: 'centrorologi@gmail.com', sito: 'https://centrorologi.net/' }, [F.centrorologiServizi, F.centrorologiChi]);
for (const s of ['riparazione', 'lucidatura', 'vendita', 'pendoleria', 'riparazione-meccanici', 'riparazione-quarzo'] as const) servizio('centrorologi-gravina-di-catania', s, F.centrorologiServizi);
contatti('la-motta-gioielli-messina', { tel: '+39 09 02931884', mail: 'lamottagioielli@gmail.com', sito: 'https://www.lamottagioielli.it/' }, [F.lamottaContatti, F.lamottaLab]);
orari('la-motta-gioielli-messina', [g(1, '16:00-20:00'), g(2, '09:00-13:00', '16:00-20:00'), g(3, '09:00-13:00', '16:00-20:00'), g(4, '09:00-13:00', '16:00-20:00'), g(5, '09:00-13:00', '16:00-20:00'), g(6, '09:00-13:00', '16:00-20:00'), g(7)], F.lamottaContatti);
servizio('la-motta-gioielli-messina', 'revisione', F.lamottaLab);
contatti('laboratorio-orologi-di-andrea-d-ale-trapani', { tel: '0923/23958' }, [F.daleHam]);
servizio('laboratorio-orologi-di-andrea-d-ale-trapani', 'batterie', F.daleHam);
servizio('laboratorio-orologi-di-andrea-d-ale-trapani', 'cinturini', F.daleHam);
marchio('laboratorio-orologi-di-andrea-d-ale-trapani', 'assistenzaUfficiale', 'Hamilton', F.daleHam);
contatti('gioielleria-di-marco-nicosia', { tel: '+39 0935 630838', mail: 'gioielleriagdm08@gmail.com', sito: 'https://www.gioielleriadimarco.it/' }, [F.dimarcoContatti, F.dimarcoChi]);
servizio('gioielleria-di-marco-nicosia', 'riparazione', F.dimarcoChi);
servizio('gioielleria-di-marco-nicosia', 'gioielleria', F.dimarcoChi);
contatti('gioielleria-de-nurra-sassari', { tel: '+39 079 275252', mail: 'info@denurra.it', sito: 'https://www.denurra.it/' }, [F.denurraContatti, F.denurraHome]);
orari('gioielleria-de-nurra-sassari', [g(1, '09:00-13:00', '16:45-19:45'), g(2, '09:00-13:00', '16:45-19:45'), g(3, '09:00-13:00', '16:45-19:45'), g(4, '09:00-13:00', '16:45-19:45'), g(5, '09:00-13:00', '16:45-19:45'), g(6, '09:00-13:00', '16:45-19:45'), g(7, '10:00-13:00', '17:00-19:45')], F.denurraContatti);
for (const s of ['riparazione', 'revisione', 'batterie', 'restauro-vintage', 'vendita'] as const) servizio('gioielleria-de-nurra-sassari', s, F.denurraHome);
contatti('gioielleria-chiocchetti-lucca', { tel: '+39 0583 493179', sito: 'https://www.chiocchetti1896.com/' }, [F.chiocchettiContatti, F.chiocchettiLab]);
orari('gioielleria-chiocchetti-lucca', [g(1, '15:30-19:30'), g(2, '10:00-13:00', '15:30-19:30'), g(3, '10:00-13:00', '15:30-19:30'), g(4, '10:00-13:00', '15:30-19:30'), g(5, '10:00-13:00', '15:30-19:30'), g(6, '10:00-13:00', '15:30-19:30'), g(7)], F.chiocchettiContatti);
for (const s of ['riparazione', 'revisione', 'lucidatura', 'manutenzione', 'vendita'] as const) servizio('gioielleria-chiocchetti-lucca', s, F.chiocchettiLab);
contatti('de-marco-belluno', { tel: '0437 950122', mail: 'info@demarco-belluno.it', sito: 'https://www.demarco-belluno.it/' }, [F.demarcoContatti, F.demarcoRip]);
for (const s of ['riparazione', 'revisione', 'restauro-vintage', 'batterie', 'cinturini', 'vendita', 'manutenzione'] as const) servizio('de-marco-belluno', s, F.demarcoRip);
contatti('gioielleria-grande-frosinone', { tel: '+39 0775 852 770', sito: 'https://www.gioielleriagrande.it/' }, [F.grandeContatti, F.grandeRolex]);
orari('gioielleria-grande-frosinone', [g(1), g(2, '09:00-13:00', '16:00-20:00'), g(3, '09:00-13:00', '16:00-20:00'), g(4, '09:00-13:00', '16:00-20:00'), g(5, '09:00-13:00', '16:00-20:00'), g(6, '09:00-13:00', '16:00-20:00'), g(7)], F.grandeContatti);
for (const s of ['riparazione', 'batterie', 'cinturini', 'lucidatura', 'manutenzione', 'valutazioni', 'vendita-usati', 'revisione'] as const) servizio('gioielleria-grande-frosinone', s, F.grandeAssistenza);
contatti('bottega-watches-pistoia', { tel: '+39 393 260 9234', mail: 'info@bottegawatches.com', sito: 'https://bottegawatches.com/' }, [F.bottegaContatti, F.bottegaLab]);
for (const s of ['riparazione', 'revisione', 'lucidatura', 'vendita', 'acquisto-permuta', 'valutazioni'] as const) servizio('bottega-watches-pistoia', s, F.bottegaLab);
contatti('martines-gioielleria-canicatti-canicatti', { tel: '+39 0922 851509', mail: 'martines@martinesgio.it', sito: 'https://www.gioielleriamartines.it/' }, [F.martinesContatti, F.martinesAssistenza]);
orari('martines-gioielleria-canicatti-canicatti', [g(1, '16:30-20:00'), g(2, '09:30-13:00', '16:30-20:00'), g(3, '09:30-13:00', '16:30-20:00'), g(4, '09:30-13:00', '16:30-20:00'), g(5, '09:30-13:00', '16:30-20:00'), g(6, '09:30-13:00', '16:30-20:00')], F.martinesContatti);
servizio('martines-gioielleria-canicatti-canicatti', 'manutenzione', F.martinesAssistenza);
contatti('mirolli-grosseto', { tel: '+39 0564 412422', mail: 'info@mirolli.it', sito: 'https://mirolli.it/' }, [F.mirolliRolex, F.mirolliGioielleria]);
orari('mirolli-grosseto', [g(1, '16:30-19:45'), g(2, '09:30-12:45', '16:30-19:45'), g(3, '09:30-12:45', '16:30-19:45'), g(4, '09:30-12:45', '16:30-19:45'), g(5, '09:30-12:45', '16:30-19:45'), g(6, '09:30-12:45', '16:30-19:45'), g(7)], F.mirolliRolex);
servizio('mirolli-grosseto', 'revisione', F.mirolliRolex);

// Cronologia per ogni record modificato.
for (const m of modificati) {
  const b = byId(m.id);
  b.attendibilita.cronologia.push({
    data: DATA,
    azione: `Lotto 2 di arricchimento: ${m.campi.join(', ')}`,
    fonti: [...new Set(b.contatti.fonti.concat(...b.orari.fonti, ...b.servizi.map(s => s.fonti), ...b.storia.fonti))].slice(0, 6),
  });
}

// Registra le nuove fonti e completa la verifica dove servono autorizzazioni documentate.
for (const f of nuove) {
  if (!directory.fonti.some(x => x.id === f.id)) directory.fonti.push({ ...f, consultataIl: DATA, percorsoArchivio: null, licenza: null });
}
for (const m of modificati) {
  const b = byId(m.id);
  const ufficiali = [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale];
  if (ufficiali.length && !b.attendibilita.verificataIl) {
    b.attendibilita.verificataIl = DATA;
    for (const c of ufficiali) for (const s of c.fonti) if (!b.attendibilita.fonti.includes(s)) b.attendibilita.fonti.push(s);
    if (b.attendibilita.stato === 'da-verificare') b.attendibilita.stato = 'fonti-verificate';
  }
}
const validato = directorySchema.parse(directory);
writeFileSync(FILE, `${JSON.stringify(validato, null, 2)}\n`);

const registro = {
  lotto: 'lotto-02-20261025',
  data: DATA,
  criterio: 'Solo dati documentati da fonti ufficiali o primarie consultate il 25/10/2026.',
  attivitaEsaminate: 37,
  attivitaModificate: modificati.map(m => ({ id: m.id, campi: m.campi })),
  fontiAggiunte: nuove.map(f => ({ id: f.id, tipo: f.tipo, url: f.url })),
  anomalie: [
    'de-marchi-gianotti-aosta: la fonte ufficiale (Les Halles d’Aoste) colloca il negozio a Pollein; il record resta alla località Aosta (nessuna modifica territoriale senza conferma).',
    'gioielleria-giorgi-mario-ancona: CAP discordante fra fonti (60121 vs 60122): non modificato.',
    'gioielleria-benetti-verona: due punti vendita con recapiti diversi; scelto quello coerente con l’indirizzo del record.',
    'eyes-on-time-venezia: telefono discordante fra fonti (Hamilton +39 041 2603804; Aeroporto +39 041 2603874): inserito quello della scheda Hamilton, il conflitto resta aperto.',
    'gioielleria-iannicelli-caserta: la fonte riporta due righe diverse per il venerdì; usata la riga coerente con il resto della settimana.',
    'orologeria-mancuso-como: orario 9:30-17:00 (corpo pagina) vs 9:30-18:00 (descrizione): usato il corpo pagina.',
    'gioielleria-pedonesi-lucca: recapiti discordanti fra sito attività (Via Fillungo 187/185, 0583492068) e scheda Hamilton: usato il sito dell’attività.',
    'fabiani-gioiellerie-pistoia: indirizzo discordante (2/D sito+Longines vs 13 scheda Hamilton): non modificato.',
    'gioielleria-grande-frosinone: seconda sede in Via Aldo Moro 153 documentata, non rappresentabile nello schema (nessun campo sedi multiple).',
    'de-marco-belluno: orari stagionali (invernale/estivo) non rappresentabili nello schema: nessun orario inserito.',
    'gioielleria-tebaldi-ferrara: il sito dichiara di escludere gli orologi a pendolo dai servizi di riparazione.',
    'amighini-verona, luccini-ivano-aulla, gioielleria-orafi-italiani-rovigo, birbio-gioielli-siracusa: pagine ufficiali non leggibili (403 o vuote): nessun dato inserito.',
    'ricci-forli: presente anche un numero cellulare (335 6562338): inserito il numero fisso, il cellulare resta da valutare.',
  ],
  dichiarazioniNonPromosse: [
    'La Motta (Messina), Chiocchetti (Lucca), Martines (Canicattì), Mirolli (Grosseto) dichiarano qualità Rolex/Tudor sui propri siti: non promosse ad autorizzazioni ufficiali (mancano fonti dei marchi).',
  ],
  autorizzazioniUfficialiAggiunte: [],
  notaAutorizzazioni: 'I centri assistenza ufficiale Hamilton di Law & Watch (Lucca) e Laboratorio D’Ale (Trapani) erano già documentati: il lotto 2 li ha riconfermati dalle schede ufficiali Hamilton senza aggiungerne di nuovi.',
};
writeFileSync('data/reports/lotto-02-20261025-applied.json', `${JSON.stringify(registro, null, 2)}\n`);
console.log(`Lotto 2 applicato: ${modificati.length} attività modificate, ${nuove.length} fonti aggiunte.`);
