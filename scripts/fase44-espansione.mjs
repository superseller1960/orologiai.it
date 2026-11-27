// Fase 44 — espansione verificata: solo attività con indirizzo e recapiti letti sul sito ufficiale.
// Nessun dato dedotto: CAP assente resta null, servizi assenti restano fuori, autorizzazioni di
// marchio non attribuite. Le fonti entrano nel registro e le evidenze si recuperano dopo.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'site/data/directory.json';
const DATA = '2026-11-06';
const dir = JSON.parse(readFileSync(FILE, 'utf8'));
const esistenti = new Set(dir.attivita.map(b => b.id));

const fonti = [
  {
    id: 'f44-dival-milano', tipo: 'sito-ufficiale', url: 'https://www.divalorologi.it/',
    titolo: 'Dival Orologi — laboratorio e restauro a Milano', consultataIl: DATA,
    percorsoArchivio: null, licenza: null,
  },
  {
    id: 'f44-amadio-padova', tipo: 'sito-ufficiale', url: 'https://www.amadiogioielli.com/',
    titolo: 'Eredi Amadio — riparazione di orologi a pendolo, Padova', consultataIl: DATA,
    percorsoArchivio: null, licenza: null,
  },
  {
    id: 'f44-monti-monza', tipo: 'sito-ufficiale', url: 'https://orologeriamonti1946.com/',
    titolo: 'Orologeria Monti 1946 — laboratorio, Monza', consultataIl: DATA,
    percorsoArchivio: null, licenza: null,
  },
];

const nuove = [
  {
    id: 'dival-orologi-milano', slug: 'dival-orologi-milano', nome: 'Dival Orologi — Milano',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio milanese attivo dal 1966 nella riparazione e nel restauro di orologi da polso, pendole e orologi d’arredo; il sito dichiara revisioni, restauri e assistenza a domicilio anche fuori Milano.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'milano',
    posizione: { indirizzo: 'Via Garegnano, 44', cap: '20156', coordinate: null, fonti: ['f44-dival-milano'] },
    contatti: { telefono: '02 3085050', email: null, sito: 'https://www.divalorologi.it/', whatsapp: null, social: [], fonti: ['f44-dival-milano'] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio attrezzato per riparazioni e restauri di orologi da polso, pendole e orologi a cucù.', fonti: ['f44-dival-milano'] },
    servizi: ['revisione', 'riparazione', 'restauro-vintage', 'pendoleria', 'batterie', 'cinturini', 'vendita'].map(id => ({ id, fonti: ['f44-dival-milano'] })),
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: 1966, fondatore: null, testo: 'Fondata a Milano nel 1966 da Ivaldi Domenico; oggi la guida il figlio Massimiliano, orologiaio professionista.', eventi: [], fonti: ['f44-dival-milano'] },
    attendibilita: { stato: 'da-verificare', raccoltaIl: DATA, verificataIl: null, confermataTitolareIl: null, fonti: ['f44-dival-milano'], cronologia: [{ data: DATA, azione: 'Fase 44: indirizzo, telefono e servizi letti sul sito ufficiale; nessuna autorizzazione di marchio attribuita.', fonti: ['f44-dival-milano'] }], segnalazioni: [] },
    origine: { sistema: 'fase44-espansione', idOriginale: 'dival-orologi-milano' },
  },
  {
    id: 'eredi-amadio-padova', slug: 'eredi-amadio-padova', nome: 'Eredi Amadio — Padova',
    tipi: ['gioielleria', 'orologeria', 'laboratorio'],
    descrizione: 'Gioielleria e orologeria a Ponte di Brenta (Padova) attiva dal 1946, con laboratorio specializzato nella riparazione e manutenzione di orologi a pendolo e nel restauro di orologi d’epoca.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'padova',
    posizione: { indirizzo: 'Strada San Marco, 270 — Ponte di Brenta', cap: '35129', coordinate: null, fonti: ['f44-amadio-padova'] },
    contatti: { telefono: '049 625500', email: 'orologeria@amadiogioielli.com', sito: 'https://www.amadiogioielli.com/', whatsapp: null, social: [], fonti: ['f44-amadio-padova'] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio di oreficeria e orologeria che esegue riparazioni di orologi a pendolo e restauri di orologi d’epoca.', fonti: ['f44-amadio-padova'] },
    servizi: ['riparazione', 'pendoleria', 'restauro-vintage', 'manutenzione', 'vendita'].map(id => ({ id, fonti: ['f44-amadio-padova'] })),
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: 1946, fondatore: null, testo: 'Attività familiare attiva dal 1946, specializzata nella riparazione di orologi a Padova e provincia.', eventi: [], fonti: ['f44-amadio-padova'] },
    attendibilita: { stato: 'da-verificare', raccoltaIl: DATA, verificataIl: null, confermataTitolareIl: null, fonti: ['f44-amadio-padova'], cronologia: [{ data: DATA, azione: 'Fase 44: indirizzo, telefono e servizi letti sul sito ufficiale; nessuna autorizzazione di marchio attribuita.', fonti: ['f44-amadio-padova'] }], segnalazioni: [] },
    origine: { sistema: 'fase44-espansione', idOriginale: 'eredi-amadio-padova' },
  },
  {
    id: 'orologeria-monti-monza', slug: 'orologeria-monti-monza', nome: 'Orologeria Monti 1946 — Monza',
    tipi: ['orologeria', 'laboratorio'],
    descrizione: 'Laboratorio di famiglia a Monza dedicato alla conservazione, al restauro e al recupero di orologi meccanici, con revisione completa e assistenza tecnica dichiarate dal sito ufficiale.',
    nomiPrecedenti: [], gruppoId: null, localitaId: 'monza',
    posizione: { indirizzo: 'Via Vittorio Emanuele II, 49', cap: null, coordinate: null, fonti: ['f44-monti-monza'] },
    contatti: { telefono: '039 5986627', email: null, sito: 'https://orologeriamonti1946.com/', whatsapp: null, social: [], fonti: ['f44-monti-monza'] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    laboratorio: { tipo: 'interno', descrizione: 'Laboratorio con macchinari specializzati per revisione, restauro e recupero di orologi meccanici.', fonti: ['f44-monti-monza'] },
    servizi: ['revisione', 'restauro-vintage', 'manutenzione', 'riparazione-meccanici'].map(id => ({ id, fonti: ['f44-monti-monza'] })),
    altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: 1946, fondatore: null, testo: 'Laboratorio della famiglia Monti a Monza, con esperienza tramandata nella conservazione e nel restauro dell’orologeria.', eventi: [], fonti: ['f44-monti-monza'] },
    attendibilita: { stato: 'da-verificare', raccoltaIl: DATA, verificataIl: null, confermataTitolareIl: null, fonti: ['f44-monti-monza'], cronologia: [{ data: DATA, azione: 'Fase 44: indirizzo, telefono e servizi letti sul sito ufficiale; CAP non pubblicato e lasciato assente.', fonti: ['f44-monti-monza'] }], segnalazioni: [] },
    origine: { sistema: 'fase44-espansione', idOriginale: 'orologeria-monti-monza' },
  },
];

let aggiunte = 0;
for (const fonte of fonti) if (!dir.fonti.some(f => f.id === fonte.id)) { dir.fonti.push(fonte); aggiunte++; }
for (const b of nuove) if (!esistenti.has(b.id)) { dir.attivita.push(b); esistenti.add(b.id); }
writeFileSync(FILE, JSON.stringify(dir, null, 1) + '\n');
console.log(`fonti aggiunte ${aggiunte} · attività aggiunte ${nuove.filter(b => esistenti.has(b.id)).length} · totale ${dir.attivita.length}`);
