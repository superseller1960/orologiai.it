// Fase 32 — audit delle 19 schede segnalate da fase31b-valida-servizi.mjs.
// Ogni decisione deriva dalla lettura della pagina primaria indicata in `fonti`.
// Uso: node scripts/fase32-audit-servizi.mjs [--apply]
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const DATA = '2026-11-03';

// tipo: 'orologeria' quando la scheda documenta un'attività di orologeria (vendita,
// assistenza o laboratorio) e non solo gioielleria.
export const DECISIONI = [
  {
    id: 'ranieri-laquila', tipo: 'orologeria', lab: 'interno',
    labFonti: ['r26-ranieri-laquila'],
    labTesto: 'La pagina ufficiale dichiara un laboratorio di orologeria con preventivi, riparazioni di Rolex e Omega e valutazioni di orologi nuovi, usati e d’epoca. L’autorizzazione Rolex è dichiarata dall’azienda: nessuna pagina del marchio la conferma.',
    motivo: 'Laboratorio interno dichiarato dal sito: la tipologia orologeria è documentata, i servizi restano.',
  },
  {
    id: 'fotia-reggio-calabria', tipo: 'orologeria', lab: 'interno',
    labFonti: ['r26-fotia-reggio-calabria'],
    labTesto: 'Il laboratorio artigiano è presentato in prima persona dal sito e comprende riparazione di orologi meccanici e al quarzo, restauro di orologi antichi, micro saldature e sostituzione delle batterie.',
    motivo: 'Riparazione e restauro di orologi eseguiti nel laboratorio dell’azienda: tipologia corretta.',
  },
  {
    id: 'paccara-terni', tipo: 'orologeria', lab: 'interno',
    labFonti: ['r26-paccara-terni'],
    labTesto: 'La pagina di orologeria indica un laboratorio interno con il maestro orologiaio Franco Paccara: riparazioni su orologi meccanici e al quarzo, revisione periodica, assistenza e fornitura di ricambi originali.',
    motivo: 'Laboratorio di orologeria e maestro orologiaio nominati: tipologia corretta, servizi confermati.',
  },
  {
    id: 'trossello-courmayeur', tipo: 'orologeria', lab: 'interno',
    labFonti: ['r26-trossello-courmayeur'],
    labTesto: 'Il sito dichiara «I nostri laboratori»: revisioni di orologi e sveglie di ogni tipo e marca, ricostruzione dei ricambi non più disponibili e garanzia di un anno sull’intervento. I laboratori sono indicati a livello di gruppo.',
    motivo: 'Revisione e ricostruzione ricambi documentate su orologi: tipologia corretta.',
  },
  {
    id: 'gioielleria-sammartino-campobasso', tipo: 'orologeria', lab: 'non-specificato',
    labFonti: ['molise-sammartino-chisiamo'], rimuovi: ['revisione'],
    labTesto: 'La pagina «chi siamo» cita competenze nella riparazione anche di un orologio, senza indicare un laboratorio di orologeria né se la lavorazione sia interna o affidata a terzi. La pagina servizi non nomina la revisione.',
    descrizione: 'Gioielleria a Campobasso che dichiara riparazione, creazione e valutazione di gioielli, orologi e oggetti di pregio. La revisione non è dichiarata; batterie e cinturini compaiono nella pagina servizi.',
    motivo: 'Riparazione di orologi dichiarata in forma generica: resta il servizio, rimossa la revisione non documentata.',
  },
  {
    id: 'della-rocca-gioielli-bologna', tipo: 'orologeria', lab: 'interno',
    labFonti: ['r27-della-rocca', 'f-www-dellaroccagioielli-it-esperto-orologi-php'],
    labTesto: 'Le pagine di assistenza descrivono un laboratorio di orologeria con orologiai specializzati e un perito esperto iscritto alla Camera di Commercio: revisioni periodiche, riparazioni con componenti originali, assistenza e valutazioni.',
    motivo: 'Laboratorio di orologeria interno con orologiai nominati: tipologia corretta.',
  },
  {
    id: 'gioielleria-rosas-olbia', tipo: 'orologeria', lab: 'interno',
    labFonti: ['rosas-laboratorio-rolex-20261103'],
    labTesto: 'La pagina del laboratorio dichiara a Olbia un laboratorio per revisione, riparazione e assistenza degli orologi Rolex. La certificazione è dichiarata dall’azienda: nessuna pagina del marchio la conferma, quindi non è registrata come assistenza ufficiale.',
    motivo: 'Laboratorio di revisione e riparazione dichiarato: tipologia corretta; nessuna autorizzazione di marchio attribuita.',
  },
  {
    id: 'orsi-gioielleria-verbania', tipo: 'orologeria', lab: 'interno',
    labFonti: ['orsi-chisiamo-20261025'],
    labTesto: 'La pagina «chi siamo» descrive un laboratorio di gioielleria e orologeria attrezzato per riparazioni di orologi di tutte le migliori marche, pendole e sveglie.',
    motivo: 'Laboratorio di orologeria interno dichiarato: tipologia corretta, pendoleria confermata.',
  },
  {
    id: 'fasola-gioielleria-como', tipo: 'orologeria', lab: 'non-specificato',
    labFonti: ['fasola-sito-20261025'],
    labTesto: 'La sezione servizi dichiara assistenza, manutenzione e riparazione di gioielli e di orologi, senza indicare un laboratorio proprio né l’affidamento a terzi.',
    motivo: 'Riparazione di orologi dichiarata senza laboratorio documentato: tipologia corretta, interno non affermato.',
  },
  {
    id: 'florio-folini-srl-sondrio', tipo: 'orologeria', lab: 'interno',
    labFonti: ['floriofolini-rolex-20261025'],
    labTesto: 'La pagina di manutenzione descrive la revisione completa secondo la procedura della Casa e il passaggio in laboratorio. Il ruolo di centro assistenza è dichiarato dall’azienda, non da una pagina del marchio.',
    motivo: 'Revisione completa in laboratorio documentata: tipologia corretta; assistenza ufficiale non attribuita.',
  },
  {
    id: 'gioielleria-iannicelli-caserta', tipo: 'orologeria', lab: 'interno',
    labFonti: ['iannicelli-rolex-manutenzione-20261103'],
    labTesto: 'La pagina di manutenzione del sito Rolex del rivenditore dichiara un centro assistenza con orologiai formati che lavorano nei propri centri; la revisione è il servizio descritto nella pagina.',
    motivo: 'Manutenzione e revisione con orologiai propri documentate: tipologia corretta; autorizzazione di marchio non attribuita.',
  },
  {
    id: 'gioielleria-tebaldi-ferrara', tipo: 'orologeria', lab: 'interno',
    labFonti: ['tebaldi-sito-20261025'],
    labTesto: 'La pagina servizi dichiara un laboratorio interno gestito da orefici e orologiai esperti, per la riparazione di gioielli e di orologi danneggiati.',
    motivo: 'Laboratorio interno con orologiai documentato: tipologia corretta.',
  },
  {
    id: 'vergari-gioielli-botrugno', tipo: 'orologeria', lab: 'non-specificato',
    labFonti: ['n02-vergari-gioielli-botrugno-1'],
    labTesto: 'La sezione servizi elenca riparazione di orologi e cambio pile e cinturini su qualunque tipologia di orologio. Non è dichiarato un laboratorio interno; la produzione di gioielli è affidata a un laboratorio artigianale esterno.',
    motivo: 'Riparazione di orologi dichiarata senza laboratorio proprio: tipologia corretta, interno non affermato.',
  },
  {
    id: 'arte-doro-ostuni', tipo: 'orologeria', lab: 'orafo',
    labFonti: ['f31-arte-doro-ostuni'],
    labTesto: 'Il laboratorio nominato è quello orafo, che esegue incisioni e personalizzazioni anche sugli orologi. La sezione orologi dichiara interventi di riparazione e assistenza e la fornitura di ricambi originali, senza precisare dove avvenga la lavorazione tecnica.',
    motivo: 'Riparazione e assistenza di orologi dichiarate, laboratorio documentato è quello orafo: tipologia corretta.',
  },
  {
    id: 'quaranta-campobasso', tipo: 'orologeria', lab: 'rete', rimuovi: ['riparazione'],
    labFonti: ['f31-quaranta-campobasso'],
    labTesto: 'La pagina servizi dichiara assistenza post-vendita per i marchi di orologeria (Baume et Mercier, Omega, Longines, Eberhard, Hamilton, Tissot) e riparazione e pulitura dei gioielli. Il laboratorio nominato non è proprio: le lavorazioni tecniche seguono la rete dei marchi.',
    descrizione: 'Gioielleria a Campobasso con vendita di orologi e assistenza post-vendita per i marchi di orologeria, con lavorazioni inviate alla rete dei marchi. La riparazione documentata nel corpo della pagina riguarda i gioielli.',
    motivo: 'La riparazione nel corpo pagina è solo di gioielli: rimosso il servizio orologiero; l’assistenza resta come rete dei marchi.',
  },
  {
    id: 'musci-catanzaro', tipo: 'orologeria', lab: 'interno',
    labFonti: ['f31-musci-catanzaro'],
    labTesto: 'La pagina dichiara un laboratorio di orologeria a Catanzaro, con orologiaio che esamina gli orologi e servizi di riparazione con preventivo, revisione, manutenzione e sostituzione di cinturini.',
    motivo: 'Laboratorio di orologeria e orologiaio interni documentati: tipologia corretta.',
  },
  {
    id: 'golden-business-potenza', rimuovi: ['riparazione'], fontiAudit: ['golden-business-servizi-20261103'],
    riassegna: {
      manutenzione: ['golden-business-servizi-20261103'],
      batterie: ['golden-business-servizi-20261103'],
    },
    descrizione: 'Gioielleria con servizio orologiero al banco: pulizia e manutenzione, sostituzione della batteria e verifica dell’impermeabilità. La pagina servizi non dichiara riparazioni o revisioni del movimento.',
    motivo: 'La pagina documenta solo pulizia, batteria e impermeabilità: rimossa la riparazione non sostenuta.',
  },
  {
    id: 'del-giudice-pozzuoli', rimuovi: ['riparazione'], fontiAudit: ['f31-del-giudice-pozzuoli'],
    descrizione: 'Gioielleria a Pozzuoli con laboratorio orafo interno: la pagina servizi dichiara riparazione di gioielli e preziosi eseguita da artigiani e maestri orafi, anche per altre gioiellerie. Nessun orologiaio è nominato e la riparazione di orologi non è descritta nel corpo della pagina.',
    motivo: 'Il corpo della pagina documenta solo oreficeria: rimossa la riparazione di orologi non sostenuta.',
  },
  {
    id: 'de-marchi-gianotti-aosta', rimuovi: ['riparazione'], fontiAudit: ['n02-de-marchi-gianotti-aosta-1'],
    segnalazione: 'La riparazione di orologi era sostenuta solo da una pagina del centro commerciale che ospita l’outlet, non dal sito dell’azienda. Il sito ufficiale non è leggibile dai sistemi automatici: servizio sospeso in attesa di conferma diretta.',
    motivo: 'Nessuna fonte primaria leggibile per la riparazione: servizio rimosso e segnalato, vendita confermata dal marchio.',
  },
];

export const FONTI_NUOVE = [
  {
    id: 'golden-business-servizi-20261103', tipo: 'sito-ufficiale',
    url: 'https://www.gioielleriagoldenbusiness.it/servizi-e-prestazioni/',
    titolo: 'Gioielleria Golden Business — servizi e prestazioni', consultataIl: DATA,
  },
  {
    id: 'rosas-laboratorio-rolex-20261103', tipo: 'sito-ufficiale',
    url: 'https://rosasgioiellerie.com/it/laboratorio-revisione-rolex',
    titolo: 'Rosas Gioiellerie — laboratorio di revisione', consultataIl: DATA,
  },
  {
    id: 'iannicelli-rolex-manutenzione-20261103', tipo: 'sito-ufficiale',
    url: 'https://rolex.iannicelli.com/manutenzione/',
    titolo: 'Gioielleria Iannicelli — manutenzione e assistenza', consultataIl: DATA,
  },
];

const AZIONE = 'Fase 32: audit dei servizi tecnici con la fonte primaria. Tipologia e laboratorio allineati a quanto dichiarato; servizi non documentati rimossi o segnalati.';

function applicaDecisone(a, d, fonti) {
  const modifiche = [];
  for (const f of d.labFonti ?? []) {
    if (!fonti.has(f)) throw new Error(`fonte mancante ${f} per ${d.id}`);
  }
  if (d.tipo && !(a.tipi ?? []).includes(d.tipo)) {
    a.tipi = [d.tipo, ...(a.tipi ?? [])];
    modifiche.push(`tipi +${d.tipo}`);
  }
  if (d.rimuovi?.length) {
    const prima = (a.servizi ?? []).length;
    a.servizi = (a.servizi ?? []).filter((s) => !d.rimuovi.includes(s.id));
    if (a.servizi.length !== prima) modifiche.push(`rimossi ${d.rimuovi.join(', ')}`);
  }
  for (const [sid, nuove] of Object.entries(d.riassegna ?? {})) {
    const s = (a.servizi ?? []).find((x) => x.id === sid);
    if (!s) throw new Error(`servizio ${sid} assente in ${d.id}`);
    if (JSON.stringify(s.fonti) !== JSON.stringify(nuove)) {
      s.fonti = nuove;
      modifiche.push(`fonte ${sid} → ${nuove.join(',')}`);
    }
  }
  if (d.lab) {
    const lab = { tipo: d.lab, descrizione: d.labTesto, fonti: d.labFonti };
    if (JSON.stringify(a.laboratorio ?? null) !== JSON.stringify(lab)) {
      a.laboratorio = lab;
      modifiche.push(`laboratorio ${d.lab}`);
    }
  }
  if (d.descrizione && a.descrizione !== d.descrizione) {
    a.descrizione = d.descrizione;
    modifiche.push('descrizione');
  }
  if (d.segnalazione) {
    a.attendibilita ??= { stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: null, confermataTitolareIl: null, fonti: [], cronologia: [], segnalazioni: [] };
    // Lo schema vuole oggetti { data, motivo, stato }: normalizzo eventuali voci testuali.
    a.attendibilita.segnalazioni = (a.attendibilita.segnalazioni ?? []).map((v) =>
      typeof v === 'string' ? { data: DATA, motivo: v, stato: 'aperta' } : v);
    if (!a.attendibilita.segnalazioni.some((v) => v.motivo === d.segnalazione)) {
      a.attendibilita.segnalazioni.push({ data: DATA, motivo: d.segnalazione, stato: 'aperta' });
      modifiche.push('segnalazione');
    }
  }
  // Una voce di cronologia senza fonti non è ammessa dallo schema: la riparo anche
  // quando la scheda non ha altre modifiche da applicare.
  const voceFase32 = (a.attendibilita?.cronologia ?? []).find((c) => c.azione === AZIONE);
  const daRiparare = Boolean(voceFase32 && !voceFase32.fonti?.length);
  if (modifiche.length || daRiparare) {
    a.attendibilita ??= { stato: 'fonti-verificate', raccoltaIl: DATA, verificataIl: null, confermataTitolareIl: null, fonti: [], cronologia: [], segnalazioni: [] };
    const cronologia = a.attendibilita.cronologia ?? [];
    const fontiAudit = d.fontiAudit ?? d.labFonti;
    if (!fontiAudit?.length) throw new Error(`fonti di audit mancanti per ${d.id}`);
    const esistente = cronologia.findIndex((c) => c.azione === AZIONE);
    if (esistente === -1) cronologia.push({ data: DATA, azione: AZIONE, fonti: fontiAudit });
    else if (!cronologia[esistente].fonti?.length) cronologia[esistente].fonti = fontiAudit;
    a.attendibilita.cronologia = cronologia;
    a.attendibilita.verificataIl = DATA;
  }
  if (daRiparare) modifiche.push('cronologia: fonti ripristinate');
  return modifiche;
}

export function eseguiAudit(directory) {
  const fonti = new Map((directory.fonti ?? []).map((f) => [f.id, f]));
  const aggiunte = [];
  for (const f of FONTI_NUOVE) {
    if (!fonti.has(f.id)) {
      const voce = { ...f, percorsoArchivio: null, licenza: null };
      directory.fonti.push(voce);
      fonti.set(f.id, voce);
      aggiunte.push(f.id);
    }
  }
  const esiti = [];
  for (const d of DECISIONI) {
    const a = (directory.attivita ?? []).find((x) => x.id === d.id);
    if (!a) throw new Error(`attività assente: ${d.id}`);
    const modifiche = applicaDecisone(a, d, fonti);
    esiti.push({ id: d.id, nome: a.nome, tipo: d.tipo ?? null, laboratorio: d.lab ?? null, rimossi: d.rimuovi ?? [], modifiche, motivo: d.motivo, fonti: d.labFonti ?? [] });
  }
  return { aggiunte, esiti };
}

const sha = (t) => createHash('sha256').update(t).digest('hex');

if (import.meta.url === `file://${process.argv[1]}`) {
  const apply = process.argv.includes('--apply');
  const originale = await readFile('site/data/directory.json', 'utf8');
  const directory = JSON.parse(originale);
  const primaAttivita = directory.attivita.length;
  const { aggiunte, esiti } = eseguiAudit(directory);
  const modificate = esiti.filter((e) => e.modifiche.length);
  const riepilogo = {
    attivitaPrima: primaAttivita,
    attivitaDopo: directory.attivita.length,
    fontiPrima: JSON.parse(originale).fonti.length,
    fontiDopo: directory.fonti.length,
    fontiAggiunte: aggiunte,
    modificate: modificate.length,
    invariate: esiti.length - modificate.length,
    esiti,
  };
  if (apply) {
    const testo = `${JSON.stringify(directory, null, 1)}\n`;
    await writeFile('site/data/directory.json', testo);
    riepilogo.hashPrima = sha(originale);
    riepilogo.hashDopo = sha(testo);
    await writeFile('data/reports/fase32-audit-servizi.json', `${JSON.stringify(riepilogo, null, 1)}\n`);
    console.log(JSON.stringify({ attivita: riepilogo.attivitaDopo, fonti: riepilogo.fontiDopo, modificate: riepilogo.modificate, hashPrima: riepilogo.hashPrima.slice(0, 16), hashDopo: riepilogo.hashDopo.slice(0, 16) }, null, 1));
  } else {
    console.log(JSON.stringify({ dryRun: true, attivita: riepilogo.attivitaDopo, fontiDopo: riepilogo.fontiDopo, fontiAggiunte: aggiunte, modificate: riepilogo.modificate, invariate: riepilogo.invariate }, null, 1));
    for (const e of modificate) console.log(`- ${e.id}: ${e.modifiche.join('; ')}`);
  }
}
