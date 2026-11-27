import { z } from 'zod';
import anagrafica from '../../../data/anagrafica/comuni-italia.json';
import type { Business, Directory } from './schema.ts';
import { businessTypes, isUsableCoordinate, services, specializations, statuses } from './schema.ts';
import { REGIONI_ITALIA } from './geo.ts';
import { normalize, searchDirectory, type SearchFilters } from './search.ts';
import { evidenzaServizio, motiviPerRichiesta, servizioDocumentato, servizioSoloInterno, SERVIZI_TECNICI_DA_PROVARE } from './recommendations.ts';
import { fraseEvidenza } from './evidenze.ts';

// Limiti di input: il messaggio dell'utente è un dato non attendibile e viene sempre misurato.
export const MAX_MESSAGGIO = 500;
export const MAX_RISULTATI = 5;
export const PROVIDER_TIMEOUT_MS = 4000;
const GIORNI_VALIDITA_ORARI = 365;

const brandRoles = ['qualsiasi', 'venduti', 'riparati', 'esperienza', 'assistenzaUfficiale', 'rivenditaUfficiale', 'menzionati'] as const;
const serviceIds = Object.keys(services) as [keyof typeof services, ...(keyof typeof services)[]];

// Criteri di ricerca: ogni campo è facoltativo e assente quando non specificato.
export const criteriSchema = z.object({
  localita: z.string().regex(/^[a-z0-9-]+$/).max(80).optional(),
  provincia: z.string().regex(/^[a-z0-9-]+$/).max(80).optional(),
  regione: z.string().regex(/^[a-z0-9-]+$/).max(80).optional(),
  // Località scritta dall'utente ma non presente nel database: produce risultati vuoti esplicativi.
  localitaNonCensita: z.string().min(1).max(60).optional(),
  // Termini in maiuscolo non riconosciuti (nomi, marchi assenti): mai trasformati in criteri.
  terminiNonRiconosciuti: z.array(z.string().min(1).max(60)).max(3).optional(),
  // CAP digitato dall'utente: cercato solo se realmente presente nelle schede, mai dedotto per area.
  cap: z.string().regex(/^\d{5}$/).optional(),
  servizio: z.enum(serviceIds).optional(),
  marca: z.string().min(1).max(60).optional(),
  ruoloMarca: z.enum(brandRoles).optional(),
  tipo: z.enum(businessTypes).optional(),
  specializzazione: z.enum(specializations).optional(),
  distanzaMaxKm: z.number().positive().max(500).optional(),
  apertoOggi: z.literal(true).optional(),
  bisognoPosizione: z.literal(true).optional(),
  // Natura della richiesta: una domanda tecnica non genera filtri commerciali.
  intento: z.enum(['tecnica', 'ricerca', 'servizio', 'guasto', 'marca-storia', 'aggiornata']).optional(),
}).strict();
export type Criteri = z.infer<typeof criteriSchema>;

export type Interpretazione = { criteri: Criteri; chiarimenti: string[] };

// Stato degli orari: "aperto oggi" è dichiarato solo con orari verificati di recente.
export type StatoOrari =
  | 'indicato-oggi' | 'fuori-orario-oggi' | 'nessun-orario-oggi' | 'non-recente' | 'non-disponibile';

const DAY: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
export function oraRoma(now: Date): { giorno: number; minuti: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now).map(p => [p.type, p.value]),
  );
  return { giorno: DAY[parts.weekday ?? 'Mon'] ?? 1, minuti: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function statoOrari(b: Business, now: Date): StatoOrari {
  const verifica = b.orari.verificatiIl;
  if (!verifica || b.orari.giorni.length === 0) return 'non-disponibile';
  const etaGiorni = (now.getTime() - new Date(verifica).getTime()) / 86_400_000;
  if (etaGiorni > GIORNI_VALIDITA_ORARI) return 'non-recente';
  const { giorno, minuti } = oraRoma(now);
  const oggi = b.orari.giorni.find(g => g.giorno === giorno);
  if (!oggi || oggi.intervalli.length === 0) return 'nessun-orario-oggi';
  const dentro = oggi.intervalli.some(i => toMin(i.apertura) <= minuti && minuti < toMin(i.chiusura));
  return dentro ? 'indicato-oggi' : 'fuori-orario-oggi';
}
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Interpretazione deterministica: regole esplicite su vocaboli italiani e sui nomi presenti nel database.
const padded = (s: string) => ` ${normalize(s)} `;
const has = (t: string, re: RegExp) => re.test(t);

const SERVIZI_REGOLE: [RegExp, keyof typeof services][] = [
  [/ tagliand| revision/, 'revisione'],
  [/ cinturin| bracciale/, 'cinturini'],
  [/ batteri| pila | pile | cambio pila/, 'batterie'],
  [/ pendol| cucu | orologio a muro| cassa lunga/, 'pendoleria'],
  [/ lucida| lucidat| satinat/, 'lucidatura'],
  [/ vetr[oi]| cristall[oi]| esalite| zaffiro| coron[ae]| tige | albero di carica| pulsante| pulsanti| quadrante| lancett[ae]| sfere | ghiera| lunetta| molla | bariletto| bilanciere| spirale| ancora | asse /, 'ricambi'],
  [/ ricambi| fornitur/, 'ricambi'],
  [/ da tasca| tasca | cipolla /, 'orologi-tasca'],
  [/ restaur/, 'restauro-vintage'],
  [/ valut| stima| quotaz| perizi| quanto vale| far valutare| ereditat.*valut/, 'valutazioni'],
  [/ impermeabil| prova sub| tenuta| prende acqua| entra acqua| entrata acqua| infiltrazion| condensa| appannat| guarnizion/, 'manutenzione'],
  [/ si ferma| fermat| non funziona| non parte| non tiene il tempo| perde tempo| perde (?:dieci|cinque|molti|\d+)\s+(?:minuti|secondi)| guadagna (?:tempo|minuti|secondi)| non tiene l ora| corre troppo| ritarda| anticipa| va avanti| va indietro| bloccato| rotto| caduto| urto| cronografo.*ripar| ripar.*cronografo| ripar| guast| aggiust| sistemar/, 'riparazione'],
  [/ manutenz| controll/, 'manutenzione'],
];
const SPECIALIZZAZIONI_REGOLE: [RegExp, (typeof specializations)[number]][] = [
  [/ automatic| carica automatica| rotore/, 'automatici'], [/ antich| d epoca| ottocento| settecento/, 'antichi'], [/ vintage| secondo polso| epoca/, 'vintage'],
  [/ lusso| alta orologeria/, 'lusso'], [/ meccanic| carica manuale| cronograf/, 'meccanici'], [/ collezion/, 'collezione'],
];
const TIPI_REGOLE: [RegExp, (typeof businessTypes)[number]][] = [
  [/ laborator/, 'laboratorio'], [/ gioielleri/, 'gioielleria'], [/ professionist| indipendent| maestro orologiaio| artigian/, 'professionista'],
];

// Voci di servizio collegate da proporre come alternative quando la voce esatta manca in zona.
const SERVIZI_AFFINI: Partial<Record<keyof typeof services, (keyof typeof services)[]>> = {
  pendoleria: ['restauro-vintage', 'riparazione'],
  'orologi-tasca': ['restauro-vintage', 'riparazione'],
  ricambi: ['riparazione', 'manutenzione'],
  manutenzione: ['riparazione', 'revisione'],
  'riparazione-automatici': ['riparazione', 'revisione'],
  'riparazione-meccanici': ['riparazione', 'revisione'],
  'riparazione-quarzo': ['riparazione', 'batterie'],
};

const SERVIZI_TECNICI = new Set<keyof typeof services>([
  'riparazione', 'revisione', 'manutenzione', 'batterie', 'cinturini',
  'riparazione-meccanici', 'riparazione-automatici', 'riparazione-quarzo',
  'restauro-vintage', 'pendoleria', 'orologi-tasca', 'ricambi', 'lucidatura', 'assistenza',
]);

// Preposizioni che introducono una località; il nome può essere digitato anche in minuscolo.
// La preposizione "di" è esclusa: "numero di telefono", "prima di venderlo" non sono località.
const LOCALITA_RE = /\b(?:a|ad|in|vicino a|nei pressi di|nelle vicinanze di)\s+([\p{L}][\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)/iu;
// Componenti dell'orologio: «ancora», «ponte», «cassa», «ruota» non sono località italiane.
// Servono a non trasformare «scappamento ad ancora» in una ricerca ad Ancona o a una città inesistente.
const COMPONENTI_OROLOGERIA = new Set([
  'ancora', 'corona', 'ponte', 'ruota', 'cassa', 'movimento', 'bilanciere', 'bariletto', 'rotore', 'scappamento',
  'quadrante', 'lancetta', 'lancette', 'sfere', 'ghiera', 'lunetta', 'molla', 'spirale', 'vetro', 'cristallo',
  'platina', 'rubino', 'tige', 'pulsante', 'pulsanti', 'cinturino', 'bracciale', 'fibbia', 'carica', 'calibro',
  'meccanismo', 'ingranaggio', 'perno', 'asse', 'soneria', 'timone', 'pendolo', 'battito', 'datario', 'cronografo',
]);
const NON_LOCALITA = new Set([
  'me', 'qui', 'un', 'una', 'uno', 'il', 'lo', 'la', 'gli', 'le',
  'oro', 'acciaio', 'titanio', 'argento', 'platino', 'bronzo',
  'batteria', 'batterie', 'carica', 'polso', 'tasca', 'quarzo', 'automatico', 'meccanico', 'cronografo',
  'vintage', 'lusso', 'orologio', 'orologi', 'riparazione', 'revisione', 'tagliando', 'cinturino', 'cinturini',
  'notte', 'giorno', 'acqua', 'vetro', 'ereditato', 'casa', 'zona', 'provincia', 'regione',
]);

// Riconosce solo denominazioni ISTAT univoche: gli omonimi non ricevono un territorio arbitrario.
function comuneIstat(nome: string) {
  const trovati = anagrafica.comuni.filter(c => normalize(c[0]) === normalize(nome));
  return trovati.length === 1 ? trovati[0] : undefined;
}

export function interpretaRichiesta(messaggio: string, dir: Directory): Interpretazione {
  const original = messaggio.trim();
  const t = padded(original);
  const criteri: Criteri = {};
  const chiarimenti: string[] = [];
  // Il contesto della frase decide prima delle parole: una domanda su come funziona un componente
  // non è una richiesta di un orologiaio in una città chiamata come il componente.
  const richiestaOperativa = /\b(?:cerco|trova|trovare|dove|chi (?:pu[oò]|ripara)|riparare|riparazione|revisione|revisionare|assistenza|sostituzione|cambio|sostituire|preventivo|appuntamento)\b/i.test(t);
  const informativaTecnica = /\bcome funziona|\bcome funzionano|\bche cos e|\bche cos'?è|\bche cosa (?:fa|fanno)\b|\bcosa fa\b|\ba che (?:cosa )?serve|\ba cosa serve|\bcosa significa|\bdifferenza\b|\bcome si (?:regola|carica|mantiene|smonta)|\bperch[eé] (?:si|un|una)\b/i.test(t) && !richiestaOperativa;

  // Marchi: nomi presenti nel database, non elenco preimpostato.
  const marche = [...new Set(dir.attivita.flatMap(b => Object.values(b.marchi).flat().map(m => m.marca)))];
  const marca = marche
    .filter(m => has(t, new RegExp(` ${escapeRe(normalize(m))} `)))
    .sort((a, b) => b.length - a.length)[0];
  if (marca) {
    criteri.marca = marca;
    if (has(t, / anche se non| anche non| non serve.*(?:ufficial|autorizzat)| senza autorizzazione/)) criteri.ruoloMarca = 'qualsiasi';
    else if (has(t, / ufficial| autorizzat/) && has(t, / assistenz| centro /)) criteri.ruoloMarca = 'assistenzaUfficiale';
    else if (has(t, / ufficial| autorizzat/) && has(t, / rivendit| vendit| concessionari/)) criteri.ruoloMarca = 'rivenditaUfficiale';
    else if (has(t, / ripar| laborator| esperto| esperienz/)) criteri.ruoloMarca = 'qualsiasi';
  }

  // Località: comune, poi provincia, poi regione (incluse tutte le 20 regioni italiane).
  // I nomi territoriali composti (province, regioni e alias) vengono oscurati prima del confronto
  // con i comuni: «in Valle d'Aosta» non deve ridursi al solo capoluogo «Aosta».
  const nomiComposti = [
    ...dir.localita.map(p => p.provincia),
    ...Object.values(REGIONI_ITALIA).flatMap(r => [r.nome, ...r.alias]),
  ].map(normalize).filter(n => n.includes(' ')).sort((a, b) => b.length - a.length);
  let perComuni = t;
  for (const nome of nomiComposti) perComuni = perComuni.replace(new RegExp(` ${escapeRe(nome)} `, 'g'), ' ');
  const comuni = [...dir.localita].sort((a, b) => b.comune.length - a.comune.length);
  // Il nome amministrativo può contenere «di» («Reggio di Calabria»): se la forma senza «di» compare nel testo, il comune è riconosciuto.
  const comune = comuni.find(p => has(perComuni, new RegExp(` ${escapeRe(normalize(p.comune))} `)))
    ?? comuni.find(p => normalize(p.comune).includes(' di ') && has(t, new RegExp(` ${escapeRe(normalize(p.comune).replace(/ di /g, ' '))} `)))
    ?? comuni.find(p => {
      const primo = normalize(p.comune).split(' ')[0] ?? '';
      return primo.length >= 5 && !['colle', 'bagno', 'poggio', 'sesto', 'san', 'monte', 'castel'].includes(primo) && has(perComuni, new RegExp(` ${escapeRe(primo)} `));
    });
  // Una provincia richiesta esplicitamente non è il comune capoluogo omonimo.
  const provinciaEsplicita = dir.localita.find(p => has(t, new RegExp(` provincia (?:di |del |della )?${escapeRe(normalize(p.provincia))} `)));
  if (provinciaEsplicita) criteri.provincia = provinciaEsplicita.provinciaSlug;
  else if (comune) criteri.localita = comune.id;
  else {
    // «a <nome>» indica una città esplicita, salvo che il nome sia un territorio composto già
    // censito (es. «a Valle d'Aosta» è una regione, non una località sconosciuta).
    const cittaEsplicita = /\b(?:a|ad)\s+[\p{L}]/iu.test(original)
      && !nomiComposti.some(n => has(t, new RegExp(` ${escapeRe(n)} `)));
    const prov = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.provincia))} `)));
    const regDb = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.regione))} `)));
    const regItalia = Object.values(REGIONI_ITALIA).find(r =>
      r.alias.some(al => has(t, new RegExp(` ${escapeRe(normalize(al))} `))) ||
      has(t, new RegExp(` ${escapeRe(normalize(r.nome))} `)),
    );
    // La regione precede la provincia: «in Valle d'Aosta» è il territorio regionale,
    // non la provincia omonima che coincide con essa.
    if (!cittaEsplicita && regDb) criteri.regione = regDb.regioneSlug;
    else if (!cittaEsplicita && regItalia) criteri.regione = regItalia.slug;
    else if (!cittaEsplicita && prov) criteri.provincia = prov.provinciaSlug;
  }
  if (!informativaTecnica && !comune && !criteri.provincia && !criteri.regione) {
    const m = LOCALITA_RE.exec(original);
    const prima = m ? original.slice(0, m.index) : '';
    const descriveCompetenza = /(?:esperto|esperienza|specializzato|specialista)\s*$/iu.test(prima);
    const nome = m?.[1].split(/\s+(?:per|con|che|oppure|e|durante|quando|prima|dopo)\b/iu)[0].trim();
    if (nome && !descriveCompetenza && !has(t, / tutta italia | in italia | ovunque /) && !NON_LOCALITA.has(normalize(nome).split(' ')[0]) && !COMPONENTI_OROLOGERIA.has(normalize(nome).split(' ')[0]) && !(marca && normalize(nome).includes(normalize(marca)))) {
      // Non è una località già nota: segnalo che non risulta censita (non la ignoro).
      criteri.localitaNonCensita = nome;
    }
  }
  if (has(t, / vicino a me | vicino | vicinanz| nei dintorni | qui vicino | nelle vicinanze /) && !criteri.localita && !criteri.provincia && !criteri.regione && !criteri.localitaNonCensita) {
    criteri.bisognoPosizione = true;
  }

  const km = /\b(\d{1,3})\s*km\b/.exec(t);
  if (km) criteri.distanzaMaxKm = Math.min(500, Math.max(1, Number(km[1])));

  // CAP a 5 cifre isolato (es. “00186”): cercato fra i CAP realmente pubblicati, senza attribuzioni geografiche.
  const cap = /\b(\d{5})\b/.exec(t);
  if (cap) criteri.cap = cap[1];

  // Servizi: il primo termine trovato in ordine di priorità; "usati" distingue vendita e acquisto dal punto di vista del cliente.
  // Se compaiono insieme valutazione e vendita ("valutare prima di venderlo"), prevale la valutazione.
  if (has(t, / valut| stima| quotaz| perizi| quanto vale| far valutare/)) criteri.servizio = 'valutazioni';
  else if (has(t, / permut| vendo | (?:vorrei |voglio )?vendere (?:il |un |l )| (?:chi|che) acquist| (?:chi|che) compr| ritir.*usat/)) criteri.servizio = 'acquisto-permuta';
  else if (has(t, / usat/) && has(t, / acquist| compr| vend/)) criteri.servizio = 'vendita-usati';
  else {
    const s = SERVIZI_REGOLE.find(([re]) => has(t, re));
    if (s) criteri.servizio = s[1];
  }
  if (has(t, / pendol/) && has(t, / restaur| antich/)) criteri.specializzazione = 'antichi';
  const spec = SPECIALIZZAZIONI_REGOLE.find(([re]) => has(t, re));
  if (spec && !criteri.specializzazione) criteri.specializzazione = spec[1];
  const tipo = TIPI_REGOLE.find(([re]) => has(t, re));
  if (tipo) criteri.tipo = tipo[1];

  // Termini maiuscoli sconosciuti (es. un marchio non censito): segnalati, non ignorati in silenzio.
  if (!criteri.localitaNonCensita) {
    const conosciuti = new Set([
      ...dir.localita.flatMap(p => [p.comune, normalize(p.comune).split(' ')[0] ?? '', p.provincia, p.regione]),
      ...Object.values(REGIONI_ITALIA).flatMap(r => [r.nome, ...r.alias]),
      ...marche,
      'italia',
    ].map(normalize));
    // Anche le singole parole dei nomi composti sono note: «Valle» in «Valle d'Aosta»
    // non è un termine sconosciuto.
    const paroleNote = new Set([...conosciuti].flatMap(k => k.split(' ')));
    const termini = [...original.matchAll(/\s([A-ZÀ-Ö][\p{L}'’-]+(?:\s+[A-ZÀ-Ö][\p{L}'’-]+)*)/gu)]
      .map(m => m[1].trim())
      .filter(term => term !== term.toUpperCase() && !conosciuti.has(normalize(term)) && !conosciuti.has(normalize(term.split(/\s+/)[0] ?? '')) && !paroleNote.has(normalize(term)));
    const unici = [...new Set(termini)].slice(0, 3);
    if (unici.length) criteri.terminiNonRiconosciuti = unici;
  }

  if (has(t, / aperto oggi| aperta oggi| aperti oggi| aperte oggi| oggi aperto| oggi aperta/)) criteri.apertoOggi = true;

  if (criteri.terminiNonRiconosciuti) chiarimenti.push(`Non riconosco “${criteri.terminiNonRiconosciuti.join('”, “')}” tra le località, le marche o i servizi censiti.`);
  if (criteri.bisognoPosizione) chiarimenti.push('Indica una città o un indirizzo, oppure concedi la posizione per cercare vicino a te.');
  if (!haCriteri(criteri)) chiarimenti.push('Indica un servizio, una marca o una località, per esempio “revisione a Firenze”.');
  // Domanda informativa: «come funziona il rotore» non è una richiesta d'intervento.
  // Il testo può contenere parole tecniche (rotore, scappamento, ancora): non bastano ad attivare un filtro,
  // e nessuna di esse può diventare una località non censita.
  if (informativaTecnica) {
    delete criteri.servizio;
    delete criteri.tipo;
    delete criteri.specializzazione;
    delete criteri.distanzaMaxKm;
  }
  return { criteri: criteriSchema.parse(criteri), chiarimenti };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Criteri effettivi: località, servizi, marche, competenze, orari o distanza. Senza di essi non si cerca.
export const haCriteri = (c: Criteri) =>
  Object.keys(c).some(k => !['terminiNonRiconosciuti', 'bisognoPosizione'].includes(k));

// Stessa regola sul server e nel browser: un dettaglio aggiunto non azzera la ricerca.
// Comune, provincia, regione e località non censita sono invece alternative fra loro.
export function combinaCriteri(precedenti: Criteri, nuovi: Criteri, messaggio = ''): Criteri {
  const t = padded(messaggio);
  const criteri: Criteri = has(t, / ricomincia| ripartiamo| nuova ricerca| azzera/) ? {} : { ...precedenti };
  const territorio = ['localita', 'provincia', 'regione', 'localitaNonCensita', 'bisognoPosizione'] as const;
  // L'assenso deve indicare l'area da ampliare, o rispondere affermativamente all'offerta precedente.
  if (precedenti.localitaNonCensita && !territorio.some(k => nuovi[k] !== undefined)) {
    const c = comuneIstat(precedenti.localitaNonCensita);
    const esplicito = /\b(?:amplia|allarga|estendi|cerca)\w*\b/.test(t) || /^\s*(?:si|sì|certo|va bene|ok)\s*[.!]?\s*$/i.test(messaggio);
    if (c && esplicito) {
      if (/\bregione\b/.test(t)) {
        const regione = Object.values(REGIONI_ITALIA).find(r => normalize(r.nome) === normalize(c[3]));
        if (regione) nuovi = { ...nuovi, regione: regione.slug };
      } else if (/\bprovincia\b/.test(t) || /^\s*(?:si|sì|certo|va bene|ok)\s*[.!]?\s*$/i.test(messaggio)) {
        nuovi = { ...nuovi, provincia: normalize(c[1]).replace(/\s+/g, '-') };
      }
    }
  }
  if (territorio.some(k => nuovi[k] !== undefined) || has(t, / tutta italia | tutte le regioni | ovunque /)) {
    for (const k of territorio) delete criteri[k];
  }
  if (nuovi.marca) delete criteri.terminiNonRiconosciuti;
  Object.assign(criteri, nuovi);
  if (has(t, / qualsiasi marchio| qualsiasi marca| tutti i marchi| tutte le marche/)) {
    delete criteri.marca;
    delete criteri.ruoloMarca;
    delete criteri.terminiNonRiconosciuti;
  }
  if (has(t, / anche se non| anche non| non serve.*(?:ufficial|autorizzat)| senza autorizzazione/)) criteri.ruoloMarca = 'qualsiasi';
  if (has(t, / qualsiasi servizio| tutti i servizi/)) delete criteri.servizio;
  if (has(t, / senza specializzazione| qualsiasi specializzazione/)) delete criteri.specializzazione;
  return criteriSchema.parse(criteri);
}

export type RisultatoAttivita = {
  id: string;
  nome: string;
  href: string;
  comune: string;
  indirizzo: string | null;
  telefono: string | null;
  sito: string | null;
  distanzaKm: number | null;
  coordinate: { lat: number; lon: number } | null;
  stato: string;
  verificataIl: string | null;
  orari: StatoOrari;
  motivi: string[];
  attenzione: string[];
};

export type EsitoRicerca = {
  stato: 'ok' | 'localita-non-censita' | 'serve-posizione' | 'nessun-criterio' | 'nessun-risultato';
  totale: number;
  risultati: RisultatoAttivita[];
  alternative: RisultatoAttivita[];
  messaggi: string[];
};

const LABEL_RUOLO: Record<string, string> = {
  venduti: 'vendita documentata', riparati: 'riparazione documentata', esperienza: 'esperienza dichiarata',
  assistenzaUfficiale: 'assistenza ufficialmente autorizzata', rivenditaUfficiale: 'rivendita ufficialmente autorizzata',
  menzionati: 'menzione storica (non è una competenza documentata)',
};

export function cercaOrologiaio(
  dir: Directory,
  criteri: Criteri,
  opzioni: { origine?: { lat: number; lon: number }; now?: Date; limite?: number } = {},
): EsitoRicerca {
  const now = opzioni.now ?? new Date();
  // La chat usa MAX_RISULTATI; la pagina di ricerca può chiedere l'elenco completo dei risultati esatti.
  const limite = Math.max(1, Math.min(opzioni.limite ?? MAX_RISULTATI, 200));
  if (criteri.terminiNonRiconosciuti?.length) {
    return { stato: 'nessun-risultato', totale: 0, risultati: [], alternative: [], messaggi: [
      `Non ho dati sufficienti per “${criteri.terminiNonRiconosciuti.join('”, “')}”. Specifica il marchio o correggi il termine prima di cercare: la copertura è ancora incompleta.`,
    ] };
  }

  const filtri: SearchFilters = {
    localita: criteri.localita, provincia: criteri.provincia, regione: criteri.regione,
    servizio: criteri.servizio, marca: criteri.marca, ruoloMarca: criteri.ruoloMarca,
    tipo: criteri.tipo, specializzazione: criteri.specializzazione,
    q: criteri.cap,
    origine: opzioni.origine, ordine: opzioni.origine ? 'distanza' : 'nome',
  };
  const cerca = (f: SearchFilters) => searchDirectory(dir, f).filter(r =>
    (criteri.distanzaMaxKm === undefined || (r.distanzaKm !== null && r.distanzaKm <= criteri.distanzaMaxKm)) &&
    (!criteri.apertoOggi || statoOrari(r.business, now) === 'indicato-oggi'),
  );
  if (criteri.localitaNonCensita) {
    const comune = comuneIstat(criteri.localitaNonCensita);
    const invito = comune
      ? `Secondo ISTAT il comune è in provincia di ${comune[1]}, ${comune[3]}. Vuoi ampliare la ricerca alla provincia di ${comune[1]} o alla regione ${comune[3]}?`
      : 'Non posso determinare provincia o regione con certezza: indica tu l’area in cui ampliare la ricerca.';
    return { stato: 'localita-non-censita', totale: 0, risultati: [], alternative: [], messaggi: [
      `Non ho attività censite nel comune di “${criteri.localitaNonCensita}”: la copertura è ancora incompleta. ${invito}`,
    ] };
  }
  if (!haCriteri(criteri)) {
    // Nessun criterio riconosciuto: non elenco l'intero database come se fosse un risultato.
    return { stato: 'nessun-criterio', totale: 0, risultati: [], alternative: [], messaggi: [
      'Non ho riconosciuto un servizio, una marca o una località. Puoi scrivere, per esempio, “revisione a Firenze”.',
    ] };
  }
  if (criteri.bisognoPosizione && !opzioni.origine) {
    return { stato: 'serve-posizione', totale: 0, risultati: [], alternative: [], messaggi: [
      'Per cercare vicino a te serve una città, un indirizzo o la posizione concessa dal browser.',
    ] };
  }

  let trovate = cerca(filtri);
  const messaggi: string[] = [];
  if (criteri.apertoOggi && !trovate.length) {
    messaggi.push('Nessuna attività risulta aperta oggi con orari verificati. Gli orari mancanti non vengono considerati aperture.');
  }

  // Se l'utente chiede un intervento tecnico (es. revisione o riparazione) su una marca specifica
  // senza aver fissato un ruolo, distinguiamo chi ripara/ha esperienza documentata su quella marca
  // da chi la tratta solo per la vendita o per menzione storica.
  let alternativeVendita: { business: Business; distanzaKm: number | null }[] = [];
  const richiedeInterventoSuMarca = Boolean(
    criteri.marca &&
    (!criteri.ruoloMarca || criteri.ruoloMarca === 'qualsiasi') &&
    ((criteri.servizio && SERVIZI_TECNICI.has(criteri.servizio)) || criteri.tipo === 'laboratorio' || criteri.tipo === 'professionista'),
  );
  if (richiedeInterventoSuMarca && trovate.length > 0) {
    const normMarca = normalize(criteri.marca!);
    const haCompetenzaTecnica = (b: Business) =>
      [...b.marchi.riparati, ...b.marchi.esperienza, ...b.marchi.assistenzaUfficiale].some(m => normalize(m.marca) === normMarca);
    const esatte = trovate.filter(r => haCompetenzaTecnica(r.business));
    const soloVenditaOMenzione = trovate.filter(r => !haCompetenzaTecnica(r.business));
    if (soloVenditaOMenzione.length > 0) {
      trovate = esatte;
      alternativeVendita = soloVenditaOMenzione;
      if (esatte.length === 0) {
        messaggi.push(`Nessuna attività documenta specificamente l’intervento richiesto su ${criteri.marca}: le attività qui sotto offrono il servizio generale o trattano il marchio, ma non documentano riparazioni specifiche su ${criteri.marca}.`);
      }
    }
  }


  // Il servizio è un dato con fonti: chi lo elenca resta un risultato. Se il riepilogo non lo
  // descrive, il visitatore viene avvisato di verificare la fonte, senza esclusioni silenziose.
  if (criteri.servizio && SERVIZI_TECNICI_DA_PROVARE.includes(criteri.servizio)) {
    const senzaDescrizione = trovate.filter(r => !servizioDocumentato(dir, r.business, criteri.servizio as keyof typeof services));
    if (senzaDescrizione.length) {
      messaggi.push(`Per ${senzaDescrizione.length} ${senzaDescrizione.length === 1 ? 'attività' : 'attività'} «${services[criteri.servizio]}» è indicato nella scheda, ma il testo della fonte non è stato recuperato: il servizio resta da confermare con l’attività.`);
    }
  }

  const risultati = trovate.slice(0, limite).map(r => descrivi(dir, r.business, criteri, now, r.distanzaKm));

  // Autorizzazioni ufficiali o alternative pertinenti: sempre chiaramente distinte dai risultati esatti.
  let alternative: RisultatoAttivita[] = [];
  if ((criteri.ruoloMarca === 'assistenzaUfficiale' || criteri.ruoloMarca === 'rivenditaUfficiale') && criteri.marca) {
    if (trovate.length === 0) {
      messaggi.push(criteri.ruoloMarca === 'assistenzaUfficiale'
        ? `Non risulta nel database nessuna assistenza ufficialmente autorizzata per ${criteri.marca}. Le attività sotto non documentano un’autorizzazione ufficiale per ${criteri.marca} (l’autorizzazione richiesta non è documentata): sono alternative da verificare direttamente con il negozio o il marchio.`
        : `Non risulta nel database nessuna rivendita ufficialmente autorizzata per ${criteri.marca} (l’autorizzazione richiesta non è documentata).`);
      const generiche = cerca({ ...filtri, ruoloMarca: 'qualsiasi' })
        .filter(r => !risultati.some(x => x.id === r.business.id));
      alternative = generiche.slice(0, 3).map(r => descrivi(dir, r.business, { ...criteri, ruoloMarca: 'qualsiasi' }, now, r.distanzaKm));
    }
  } else if (alternativeVendita.length > 0 || (trovate.length === 0 && !criteri.apertoOggi)) {
    // Alternative pertinenti, mai risultati esatti: chi tratta il marchio senza competenza tecnica
    // documentata (vendita o menzione) e, quando non ci sono risultati esatti, chi rilassa un
    // vincolo secondario o allarga alla provincia, spiegando sempre la differenza.
    alternative = alternativeVendita.slice(0, 3).map(r => descrivi(dir, r.business, criteri, now, r.distanzaKm));
    if (trovate.length === 0 && !criteri.apertoOggi) {
    // Se una combinazione molto specifica (es. comune + servizio + specializzazione/tipo/marca) non dà
    // corrispondenze esatte, proponiamo fino a 3 alternative pertinenti che rilassano un vincolo secondario
    // o allargano alla provincia, spiegando la differenza.
    const candidatiAlt: { voce: { business: Business; distanzaKm: number | null }; nota: string }[] = [];
    const visti = new Set(alternative.map(x => x.id));
    const aggiungi = (lista: { business: Business; distanzaKm: number | null }[], nota: string) => {
      for (const item of lista) {
        if (!visti.has(item.business.id)) {
          visti.add(item.business.id);
          candidatiAlt.push({ voce: item, nota });
        }
      }
    };
    if (criteri.specializzazione && (criteri.servizio || criteri.marca || criteri.localita)) {
      aggiungi(cerca({ ...filtri, specializzazione: undefined }), `Non documenta la specializzazione “${criteri.specializzazione}”, ma risponde agli altri criteri.`);
    }
    if (criteri.tipo && (criteri.servizio || criteri.marca || criteri.localita)) {
      aggiungi(cerca({ ...filtri, tipo: undefined }), `Non ha tipologia “${criteri.tipo}”, ma offre il servizio richiesto.`);
    }
    if (criteri.servizio === 'revisione') {
      const PlaceFilter = { ...filtri, servizio: 'riparazione' as const, specializzazione: undefined, tipo: undefined };
      aggiungi(cerca(PlaceFilter), 'Documenta riparazione e manutenzione, ma non elenca separatamente la voce “Revisione”.');
    }
    // Servizi affini: se la voce richiesta (es. pendoleria) non è elencata in zona, proponiamo
    // chi documenta un intervento collegato, dichiarando esplicitamente la differenza.
    const servizioRichiesto = criteri.servizio;
    if (servizioRichiesto) {
      for (const affine of SERVIZI_AFFINI[servizioRichiesto] ?? []) {
        aggiungi(
          cerca({ ...filtri, servizio: affine, specializzazione: undefined, tipo: undefined }),
          `Non elenca la voce “${services[servizioRichiesto]}”, ma documenta “${services[affine]}” nella zona richiesta.`,
        );
      }
    }
    if (criteri.marca && (criteri.servizio || criteri.localita)) {
      aggiungi(
        cerca({ ...filtri, marca: undefined, ruoloMarca: undefined }),
        `Offre il servizio richiesto nella località indicata, ma non elenca specificamente il marchio ${criteri.marca} nelle fonti.`,
      );
    }
    for (const { voce, nota } of candidatiAlt) {
      if (alternative.length >= 3) break;
      const desc = descrivi(dir, voce.business, criteri, now, voce.distanzaKm);
      desc.attenzione.unshift(nota);
      alternative.push(desc);
    }
    }
  }

  if (trovate.length === 0) {
    messaggi.push(alternative.length > 0
      ? 'Nessuna attività soddisfa contemporaneamente tutti i criteri esatti; sotto trovi alternative per competenza da verificare.'
      : 'Nessuna attività soddisfa tutti i criteri. Prova a rimuovere un requisito o a cercare in un’area più ampia.');
  }
  if (trovate.length > limite) messaggi.push(`Mostro ${limite} risultati su ${trovate.length}. Aggiungi un criterio per restringere la ricerca.`);

  return { stato: trovate.length === 0 ? 'nessun-risultato' : 'ok', totale: trovate.length, risultati, alternative, messaggi };
}

// Conteggio delle fonti in italiano corretto: "1 fonte", "2 fonti", e mai "0 fonti" come prova.
export function etichettaFonti(n: number): string {
  if (n <= 0) return 'nessuna fonte registrata';
  return n === 1 ? '1 fonte' : `${n} fonti`;
}

function descrivi(dir: Directory, b: Business, criteri: Criteri, now: Date, distanzaKm: number | null = null): RisultatoAttivita {
  const motivi: string[] = [];
  const attenzione: string[] = [];
  const comune = dir.localita.find(p => p.id === b.localitaId)?.comune ?? b.localitaId;
  if (criteri.servizio) {
    const s = b.servizi.find(x => x.id === criteri.servizio);
    if (s) {
      // Se la fonte è stata consultata, il motivo è la sua frase; altrimenti il conteggio delle fonti.
      const evidenza = s.fonti.length > 0 ? evidenzaServizio(b, s.id) : undefined;
      // Fase 43: un servizio solo elencato non viene descritto come offerto o documentato.
      const soloInterno = servizioSoloInterno(b, s.id);
      // Fase 44: senza una citazione verificata non si scrive «Offre». Un URL registrato nella
      // scheda non è una prova: il servizio resta indicato e va confermato con l'attività.
      motivi.push(evidenza
        ? fraseEvidenza(evidenza, 140, s.id)
        : soloInterno
          ? `Elenca “${services[s.id]}”: la fonte descrive solo una lavorazione interna, non un servizio al cliente. Verifica direttamente.`
          : `Elenca “${services[s.id]}”: servizio indicato nella scheda, da confermare con l’attività.`);
    }
  }
  if (criteri.marca) {
    if (criteri.ruoloMarca && criteri.ruoloMarca !== 'qualsiasi') {
      motivi.push(`${criteri.marca}: ${LABEL_RUOLO[criteri.ruoloMarca]}.`);
    } else {
      const ruoli = Object.entries(b.marchi)
        .filter(([, list]) => list.some(m => m.marca === criteri.marca))
        .map(([ruolo]) => ruolo);
      for (const ruolo of ruoli) {
        const riga = `${criteri.marca}: ${LABEL_RUOLO[ruolo]}.`;
        if (ruolo === 'menzionati') attenzione.push(riga);
        else motivi.push(riga);
      }
    }
  }
  if (criteri.tipo && b.tipi.includes(criteri.tipo)) motivi.push(`Tipologia dichiarata: ${criteri.tipo}.`);
  if (criteri.specializzazione && b.specializzazioni.some(s => s.id === criteri.specializzazione)) {
    motivi.push(`Specializzazione documentata: ${criteri.specializzazione}.`);
  }
  if (criteri.apertoOggi) motivi.push('Orari di oggi indicati dalla fonte e verificati di recente.');
  if (criteri.ruoloMarca === 'assistenzaUfficiale' || criteri.ruoloMarca === 'rivenditaUfficiale') {
    attenzione.push('Verifica la fonte del marchio riportata nella scheda prima di affidare l’orologio.');
  }
  if (!b.posizione.coordinate && distanzaKm === null && (criteri.bisognoPosizione || criteri.distanzaMaxKm)) {
    attenzione.push('Posizione non disponibile per il calcolo della distanza.');
  }
  // Motivazioni specifiche con la fonte citata: nessun giudizio, nessun punteggio.
  for (const motivo of motiviPerRichiesta(dir, b, {
    servizio: criteri.servizio, marca: criteri.marca, tipo: criteri.tipo,
    specializzazione: criteri.specializzazione, localita: criteri.localita, cap: criteri.cap,
  })) {
    if (!motivi.includes(motivo.testo) && !attenzione.includes(motivo.testo)) motivi.push(motivo.testo);
  }

  return {
    id: b.id,
    nome: b.nome,
    href: `/orologeria/${b.slug}/`,
    comune,
    indirizzo: b.posizione.indirizzo,
    telefono: b.contatti.telefono,
    sito: b.contatti.sito,
    distanzaKm: distanzaKm === null ? null : Math.round(distanzaKm * 10) / 10,
    coordinate: isUsableCoordinate(b.posizione.coordinate) ? { lat: b.posizione.coordinate.lat, lon: b.posizione.coordinate.lon } : null,
    stato: statuses[b.attendibilita.stato],
    verificataIl: b.attendibilita.verificataIl,
    orari: statoOrari(b, now),
    motivi,
    attenzione,
  };
}

// Un contesto ereditato può svuotare i risultati anche quando la nuova richiesta da sola ne ha:
// in quel caso la chat riparte dai soli criteri nuovi, dichiarandolo, invece di rispondere “nessuna attività”.
export function cercaConContesto(
  dir: Directory,
  criteriUniti: Criteri,
  criteriNuovi: Criteri,
  opzioni: { origine?: { lat: number; lon: number }; now?: Date; limite?: number; precedenti?: Criteri } = {},
): { criteri: Criteri; esito: EsitoRicerca; daSoliNuoviCriteri: boolean; contestoPrecedente: boolean } {
  const esito = cercaOrologiaio(dir, criteriUniti, opzioni);
  // Il ripiego scatta anche al primo messaggio se l'interpretazione del modello è troppo stretta,
  // ma "contestoPrecedente" dice se esisteva davvero una richiesta precedente da cui ereditare:
  // solo in quel caso la chat può parlarne all'utente.
  const contestoPrecedente = haCriteri(opzioni.precedenti ?? {});
  if (esito.stato !== 'nessun-risultato' || !haCriteri(criteriNuovi)) return { criteri: criteriUniti, esito, daSoliNuoviCriteri: false, contestoPrecedente };
  // Non perdere mai un territorio ereditato quando il nuovo messaggio aggiunge solo un servizio.
  const territorio = ['localita', 'provincia', 'regione', 'localitaNonCensita', 'bisognoPosizione'] as const;
  if (territorio.some(k => criteriUniti[k] !== undefined) && !territorio.some(k => criteriNuovi[k] !== undefined)) {
    return { criteri: criteriUniti, esito, daSoliNuoviCriteri: false, contestoPrecedente };
  }
  const soloNuovi = cercaOrologiaio(dir, criteriNuovi, opzioni);
  if (soloNuovi.stato !== 'ok' || soloNuovi.risultati.length === 0) return { criteri: criteriUniti, esito, daSoliNuoviCriteri: false, contestoPrecedente };
  return { criteri: criteriNuovi, esito: soloNuovi, daSoliNuoviCriteri: true, contestoPrecedente };
}

// Interfaccia del provider AI. Il provider restituisce una breve risposta conversazionale
// e criteri JSON: non esegue query, non scrive dati. La risposta è solo testo, i fatti restano del database.
export interface AssistantProvider {
  interpreta(messaggio: string, signal: AbortSignal, contesto?: Criteri): Promise<unknown>;
}

export type OrigineInterpretazione = 'provider' | 'deterministica';
export type RisultatoInterpretazione = Interpretazione & {
  origine: OrigineInterpretazione; avviso: string | null; risposta: string | null;
  // Servizio suggerito dal modello per la richiesta, se pertinente.
  consiglio: keyof typeof services | null;
};

// Out del provider: la risposta è opzionale e con un tetto preciso; i criteri sono validati da criteriSchema.
const providerOutputSchema = z.looseObject({
  risposta: z.string().min(1).max(500).nullable().optional(),
  // Suggerimento di filtro: deve essere un servizio del catalogo o assente.
  consiglioServizio: z.enum(serviceIds).nullable().optional(),
  intento: z.enum(['tecnica', 'ricerca', 'servizio', 'guasto', 'marca-storia', 'aggiornata']).optional(),
});

// Criteri che il provider non può introdurre: valgono solo se letti dal messaggio o ereditati dal contesto.
const FILTRI_SOLO_ESPLICITI = [
  'servizio', 'tipo', 'specializzazione', 'cap', 'distanzaMaxKm', 'apertoOggi', 'ruoloMarca', 'bisognoPosizione',
] as const satisfies readonly (keyof Criteri)[];

// Il provider propone criteri; questa funzione li valida e li riduce ai valori esistenti nel database.
export async function interpretaConProvider(
  messaggio: string,
  dir: Directory,
  provider: AssistantProvider | null,
  timeoutMs = PROVIDER_TIMEOUT_MS,
  contesto?: Criteri,
): Promise<RisultatoInterpretazione> {
  if (messaggio.length > MAX_MESSAGGIO) throw new RangeError(`Messaggio oltre ${MAX_MESSAGGIO} caratteri`);
  const locale = interpretaRichiesta(messaggio, dir);
  const risolvi = (nuovi: Criteri) => {
    const criteri = combinaCriteri(contesto ?? {}, nuovi, messaggio);
    const chiarimenti = locale.chiarimenti.filter(c =>
      !(/Indica un servizio, una marca o una località/.test(c) && haCriteri(criteri)),
    );
    return { criteri, chiarimenti };
  };
  if (!provider) return { ...risolvi(locale.criteri), origine: 'deterministica', avviso: 'Assistente AI non configurato: uso la ricerca interpretata localmente.', risposta: null, consiglio: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const raw = await Promise.race([
      provider.interpreta(messaggio, controller.signal, contesto),
      new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('timeout')))),
    ]);
    const out = providerOutputSchema.safeParse(raw);
    if (!out.success) throw new Error('risposta malformata');
    const { risposta, consiglioServizio, intento, ...criteriOu } = out.data;
    const parsed = criteriSchema.safeParse(criteriOu);
    if (!parsed.success) throw new Error('risposta malformata');
    const c = parsed.data;
    const ammessi: Criteri = { ...c };
    // Il modello non aggiunge filtri restrittivi: restano solo quelli del parser o del contesto esplicito.
    for (const k of FILTRI_SOLO_ESPLICITI) delete ammessi[k];
    // Ancoraggio: il modello può indicare una città solo se è stata letta nel messaggio o nel contesto.
    const ancorata = c.localita === locale.criteri.localita || c.localita === contesto?.localita;
    const censita = dir.localita.some(p => p.id === c.localita);
    if (c.localita && censita && !ancorata) {
      delete ammessi.localita;
    } else if (c.localita && !censita) {
      delete ammessi.localita;
      ammessi.localitaNonCensita = c.localita;
    }
    // Il modello non può scegliere territori non richiesti: solo parser e contesto li ancorano.
    if (c.provincia !== locale.criteri.provincia && c.provincia !== contesto?.provincia) delete ammessi.provincia;
    if (c.regione !== locale.criteri.regione && c.regione !== contesto?.regione) delete ammessi.regione;
    if (locale.criteri.localitaNonCensita) {
      delete ammessi.localita;
      delete ammessi.provincia;
      delete ammessi.regione;
      ammessi.localitaNonCensita = locale.criteri.localitaNonCensita;
    }
    const sconosciuti = [...(c.terminiNonRiconosciuti ?? [])];
    if (c.provincia && !dir.localita.some(p => p.provinciaSlug === c.provincia)) {
      delete ammessi.provincia;
      sconosciuti.push(c.provincia);
    }
    if (c.regione && !dir.localita.some(p => p.regioneSlug === c.regione) && !(c.regione in REGIONI_ITALIA)) {
      delete ammessi.regione;
      sconosciuti.push(c.regione);
    }
    const marche = new Set(dir.attivita.flatMap(b => Object.values(b.marchi).flat().map(m => m.marca)));
    if (c.marca && marche.has(c.marca) && c.marca !== locale.criteri.marca && c.marca !== contesto?.marca) {
      delete ammessi.marca;
    } else if (c.marca && !marche.has(c.marca)) {
      delete ammessi.marca;
      sconosciuti.push(c.marca);
    }
    if (sconosciuti.length) ammessi.terminiNonRiconosciuti = [...new Set(sconosciuti)].slice(0, 3);
    const chiaviTerritorio = ['localita', 'provincia', 'regione', 'localitaNonCensita', 'bisognoPosizione'] as const;
    const territorioEsplicito = chiaviTerritorio.some(k => locale.criteri[k] !== undefined);
    const allargamento = contesto?.localitaNonCensita && (/\b(?:amplia|allarga|estendi|cerca)\w*\b/.test(padded(messaggio)) || /^\s*(?:si|sì|certo|va bene|ok)\s*[.!]?\s*$/i.test(messaggio));
    if (territorioEsplicito || allargamento) for (const k of chiaviTerritorio) delete ammessi[k];
    // Domanda tecnica o informativa: nessun filtro commerciale e nessun suggerimento di servizio,
    // salvo che l'utente abbia chiesto esplicitamente un intervento nelle proprie parole.
    const informativa = intento === 'tecnica' || intento === 'marca-storia' || intento === 'aggiornata';
    if (informativa && !locale.criteri.servizio) delete ammessi.servizio;
    const risolto = risolvi({ ...locale.criteri, ...ammessi });
    return {
      ...risolto, origine: 'provider', avviso: null,
      risposta: risolto.criteri.localitaNonCensita ? null : risposta ?? null,
      consiglio: informativa ? null : consiglioServizio ?? null,
    };
  } catch {
    return { ...risolvi(locale.criteri), origine: 'deterministica', avviso: 'Il servizio di interpretazione non ha risposto correttamente: uso la ricerca interpretata localmente.', risposta: null, consiglio: null };
  } finally {
    clearTimeout(timer);
  }
}
