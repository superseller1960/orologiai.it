import { z } from 'zod';
import type { Business, Directory } from './schema.ts';
import { businessTypes, isUsableCoordinate, services, specializations, statuses } from './schema.ts';
import { normalize, searchDirectory, type SearchFilters } from './search.ts';

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
  servizio: z.enum(serviceIds).optional(),
  marca: z.string().min(1).max(60).optional(),
  ruoloMarca: z.enum(brandRoles).optional(),
  tipo: z.enum(businessTypes).optional(),
  specializzazione: z.enum(specializations).optional(),
  distanzaMaxKm: z.number().positive().max(500).optional(),
  apertoOggi: z.literal(true).optional(),
  bisognoPosizione: z.literal(true).optional(),
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
  [/ batteri| pila | pile /, 'batterie'],
  [/ pendol/, 'pendoleria'],
  [/ lucida| lucidat/, 'lucidatura'],
  [/ ricambi/, 'ricambi'],
  [/ restaur/, 'restauro-vintage'],
  [/ da tasca| tasca /, 'orologi-tasca'],
  [/ ripar| fermat| non funziona| guast/, 'riparazione'],
  [/ valut| stima/, 'valutazioni'],
];
const SPECIALIZZAZIONI_REGOLE: [RegExp, (typeof specializations)[number]][] = [
  [/ automatic/, 'automatici'], [/ antich/, 'antichi'], [/ vintage/, 'vintage'],
  [/ lusso/, 'lusso'], [/ meccanic/, 'meccanici'], [/ collezion/, 'collezione'],
];
const TIPI_REGOLE: [RegExp, (typeof businessTypes)[number]][] = [
  [/ laborator/, 'laboratorio'], [/ gioielleri/, 'gioielleria'], [/ professionist| indipendent/, 'professionista'],
];

// Preposizioni che introducono una località; il nome può essere digitato anche in minuscolo.
const LOCALITA_RE = /\b(?:a|ad|in|vicino a|nei pressi di|nelle vicinanze di)\s+([\p{L}][\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)/iu;
const NON_LOCALITA = new Set(['me', 'qui', 'un', 'una', 'uno', 'il', 'lo', 'la', 'gli', 'le', 'oro', 'acciaio', 'titanio', 'argento', 'batteria', 'batterie', 'carica', 'polso', 'tasca', 'quarzo', 'automatico', 'meccanico', 'vintage', 'lusso', 'orologio', 'orologi', 'riparazione', 'revisione', 'tagliando', 'cinturino', 'cinturini']);

export function interpretaRichiesta(messaggio: string, dir: Directory): Interpretazione {
  const original = messaggio.trim();
  const t = padded(original);
  const criteri: Criteri = {};
  const chiarimenti: string[] = [];

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

  // Località: comune, poi provincia, poi regione, tutti presenti nel database.
  const comuni = [...dir.localita].sort((a, b) => b.comune.length - a.comune.length);
  const comune = comuni.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.comune))} `)));
  if (comune) criteri.localita = comune.id;
  else {
    const cittaEsplicita = /\b(?:a|ad)\s+[\p{L}]/iu.test(original);
    const prov = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.provincia))} `)));
    const reg = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.regione))} `)));
    if (!cittaEsplicita && prov) criteri.provincia = prov.provinciaSlug;
    else if (!cittaEsplicita && reg) criteri.regione = reg.regioneSlug;
  }
  if (!comune && !criteri.provincia && !criteri.regione) {
    const m = LOCALITA_RE.exec(original);
    const prima = m ? original.slice(0, m.index) : '';
    const descriveCompetenza = /(?:esperto|esperienza|specializzato|specialista)\s*$/iu.test(prima);
    const nome = m?.[1].split(/\s+(?:per|con|che|oppure|e)\b/iu)[0].trim();
    if (nome && !descriveCompetenza && !has(t, / tutta italia | in italia | ovunque /) && !NON_LOCALITA.has(normalize(nome).split(' ')[0]) && !(marca && normalize(nome).includes(normalize(marca)))) {
      // Non è una località già nota: segnalo che non risulta censita (non la ignoro).
      criteri.localitaNonCensita = nome;
    }
  }
  if (has(t, / vicino a me | vicino | vicinanz| nei dintorni | qui vicino | nelle vicinanze /) && !criteri.localita && !criteri.provincia && !criteri.regione && !criteri.localitaNonCensita) {
    criteri.bisognoPosizione = true;
  }

  const km = /\b(\d{1,3})\s*km\b/.exec(t);
  if (km) criteri.distanzaMaxKm = Math.min(500, Math.max(1, Number(km[1])));

  // Il servizio descrive l'attività: se il cliente vende, serve chi acquista;
  // se il cliente compra un usato, serve chi lo vende.
  if (has(t, / permut| vendo | (?:vorrei |voglio )?vendere (?:il |un |l )| (?:chi|che) acquist| (?:chi|che) compr| ritir.*usat/)) criteri.servizio = 'acquisto-permuta';
  else if (has(t, / usat/) && has(t, / acquist| compr| vend/)) criteri.servizio = 'vendita-usati';
  else {
    const s = SERVIZI_REGOLE.find(([re]) => has(t, re));
    if (s) criteri.servizio = s[1];
  }
  const spec = SPECIALIZZAZIONI_REGOLE.find(([re]) => has(t, re));
  if (spec) criteri.specializzazione = spec[1];
  const tipo = TIPI_REGOLE.find(([re]) => has(t, re));
  if (tipo) criteri.tipo = tipo[1];

  // Termini maiuscoli sconosciuti (es. un marchio non censito): segnalati, non ignorati in silenzio.
  if (!criteri.localitaNonCensita) {
    const conosciuti = new Set([...dir.localita.flatMap(p => [p.comune, p.provincia, p.regione]), ...marche].map(normalize));
    const termini = [...original.matchAll(/\s([A-ZÀ-Ö][\p{L}'’-]+(?:\s+[A-ZÀ-Ö][\p{L}'’-]+)*)/gu)]
      .map(m => m[1].trim())
      .filter(term => term !== term.toUpperCase() && !conosciuti.has(normalize(term)) && !conosciuti.has(normalize(term.split(/\s+/)[0] ?? '')));
    const unici = [...new Set(termini)].slice(0, 3);
    if (unici.length) criteri.terminiNonRiconosciuti = unici;
  }

  if (has(t, / aperto oggi| aperta oggi| aperti oggi| aperte oggi| oggi aperto| oggi aperta/)) criteri.apertoOggi = true;

  if (criteri.terminiNonRiconosciuti) chiarimenti.push(`Non riconosco “${criteri.terminiNonRiconosciuti.join('”, “')}” tra le località, le marche o i servizi censiti.`);
  if (criteri.bisognoPosizione) chiarimenti.push('Indica una città o un indirizzo, oppure concedi la posizione per cercare vicino a te.');
  if (!haCriteri(criteri)) chiarimenti.push('Indica un servizio, una marca o una località, per esempio “revisione a Firenze”.');
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
  opzioni: { origine?: { lat: number; lon: number }; now?: Date } = {},
): EsitoRicerca {
  const now = opzioni.now ?? new Date();
  if (criteri.terminiNonRiconosciuti?.length) {
    return { stato: 'nessun-risultato', totale: 0, risultati: [], alternative: [], messaggi: [
      `Non ho dati sufficienti per “${criteri.terminiNonRiconosciuti.join('”, “')}”. Specifica il marchio o correggi il termine prima di cercare: la copertura è ancora incompleta.`,
    ] };
  }

  const filtri: SearchFilters = {
    localita: criteri.localita, provincia: criteri.provincia, regione: criteri.regione,
    servizio: criteri.servizio, marca: criteri.marca, ruoloMarca: criteri.ruoloMarca,
    tipo: criteri.tipo, specializzazione: criteri.specializzazione,
    origine: opzioni.origine, ordine: opzioni.origine ? 'distanza' : 'nome',
  };
  const cerca = (f: SearchFilters) => searchDirectory(dir, f).filter(r =>
    (criteri.distanzaMaxKm === undefined || (r.distanzaKm !== null && r.distanzaKm <= criteri.distanzaMaxKm)) &&
    (!criteri.apertoOggi || statoOrari(r.business, now) === 'indicato-oggi'),
  );
  const descriviRisultati = (risultati: ReturnType<typeof searchDirectory>, c = criteri) =>
    risultati.map(r => descrivi(dir, r.business, c, now, r.distanzaKm));
  const { localita: _localita, provincia: _provincia, regione: _regione, ...senzaTerritorio } = filtri;
  const alternativeTerritoriali = () =>
    (criteri.servizio || criteri.marca || criteri.specializzazione || criteri.tipo)
      ? descriviRisultati(cerca(senzaTerritorio).slice(0, 3)) : [];

  if (criteri.localitaNonCensita) {
    const alternative = alternativeTerritoriali();
    return { stato: 'localita-non-censita', totale: 0, risultati: [], alternative, messaggi: [
      `Non ho attività censite per “${criteri.localitaNonCensita}”: la copertura è ancora incompleta. ${alternative.length ? 'Le alternative rispettano gli altri criteri ma sono in altri comuni e potrebbero essere lontane. Senza coordinate sufficienti non posso indicare la distanza.' : 'Puoi ampliare la ricerca o segnalare un’attività nella zona.'}`,
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

  const trovate = cerca(filtri);
  const messaggi: string[] = [];
  if (criteri.apertoOggi && !trovate.length) messaggi.push('Nessuna attività corrispondente risulta aperta oggi con orari verificati. Gli orari mancanti non vengono considerati aperture.');

  const risultati = trovate.slice(0, MAX_RISULTATI).map(r => descrivi(dir, r.business, criteri, now, r.distanzaKm));

  // Autorizzazioni ufficiali: se non documentate, offro alternative chiaramente distinte.
  let alternative: RisultatoAttivita[] = [];
  if (trovate.length === 0 && (criteri.ruoloMarca === 'assistenzaUfficiale' || criteri.ruoloMarca === 'rivenditaUfficiale') && criteri.marca) {
    messaggi.push(criteri.ruoloMarca === 'assistenzaUfficiale'
      ? `Non risulta nel database un centro assistenza ufficiale per ${criteri.marca} che soddisfi questi criteri. Per le eventuali alternative l’autorizzazione richiesta non è documentata; verifica con il marchio.`
      : `Non risulta nel database un rivenditore ufficiale per ${criteri.marca} che soddisfi questi criteri. Per le eventuali alternative l’autorizzazione richiesta non è documentata.`);
    const generiche = cerca({ ...filtri, ruoloMarca: 'qualsiasi' })
      .filter(r => !risultati.some(x => x.id === r.business.id));
    alternative = generiche.slice(0, 3).map(r => descrivi(dir, r.business, { ...criteri, ruoloMarca: 'qualsiasi' }, now, r.distanzaKm));
  }

  let altreLocalita = false;
  if (trovate.length === 0 && alternative.length === 0 && (criteri.localita || criteri.provincia || criteri.regione)) {
    alternative = alternativeTerritoriali();
    altreLocalita = alternative.length > 0;
  }
  if (trovate.length === 0) messaggi.push(altreLocalita
    ? 'Nessuna attività soddisfa tutti i criteri in questa località. Le opzioni sotto sono in altri comuni censiti e potrebbero essere lontane. La distanza è indicata solo quando calcolabile con coordinate verificate.'
    : 'Nessuna attività soddisfa tutti i criteri. Prova a rimuovere un requisito o a cercare in un’area più ampia.');
  if (trovate.length > MAX_RISULTATI) messaggi.push(`Mostro ${MAX_RISULTATI} risultati su ${trovate.length}. Aggiungi un criterio per restringere la ricerca.`);

  return { stato: trovate.length === 0 ? 'nessun-risultato' : 'ok', totale: trovate.length, risultati, alternative, messaggi };
}

function descrivi(dir: Directory, b: Business, criteri: Criteri, now: Date, distanzaKm: number | null = null): RisultatoAttivita {
  const motivi: string[] = [];
  const attenzione: string[] = [];
  const comune = dir.localita.find(p => p.id === b.localitaId)?.comune ?? b.localitaId;
  if (criteri.servizio) {
    const s = b.servizi.find(x => x.id === criteri.servizio);
    if (s) motivi.push(`Offre “${services[s.id]}”, documentato da ${s.fonti.length} fonte/i.`);
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
  if (criteri.tipo) motivi.push(`Tipologia dichiarata: ${criteri.tipo}.`);
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

// Interfaccia del provider AI. Il provider restituisce una breve risposta conversazionale
// e criteri JSON: non esegue query, non scrive dati. La risposta è solo testo, i fatti restano del database.
export interface AssistantProvider {
  interpreta(messaggio: string, signal: AbortSignal, contesto?: Criteri): Promise<unknown>;
}

export type OrigineInterpretazione = 'provider' | 'deterministica';
export type RisultatoInterpretazione = Interpretazione & { origine: OrigineInterpretazione; avviso: string | null; risposta: string | null };

// Out del provider: la risposta è opzionale e con un tetto preciso; i criteri sono validati da criteriSchema.
const providerOutputSchema = z.looseObject({ risposta: z.string().min(1).max(500).nullable().optional() });

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
  if (!provider) return { ...risolvi(locale.criteri), origine: 'deterministica', avviso: 'Assistente AI non configurato: uso la ricerca interpretata localmente.', risposta: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const raw = await Promise.race([
      provider.interpreta(messaggio, controller.signal, contesto),
      new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('timeout')))),
    ]);
    const out = providerOutputSchema.safeParse(raw);
    if (!out.success) throw new Error('risposta malformata');
    const { risposta, ...criteriOu } = out.data;
    const parsed = criteriSchema.safeParse(criteriOu);
    if (!parsed.success) throw new Error('risposta malformata');
    const c = parsed.data;
    const ammessi: Criteri = { ...c };
    if (c.localita && !dir.localita.some(p => p.id === c.localita)) {
      delete ammessi.localita;
      ammessi.localitaNonCensita = c.localita;
    }
    const sconosciuti = [...(c.terminiNonRiconosciuti ?? [])];
    if (c.provincia && !dir.localita.some(p => p.provinciaSlug === c.provincia)) {
      delete ammessi.provincia;
      sconosciuti.push(c.provincia);
    }
    if (c.regione && !dir.localita.some(p => p.regioneSlug === c.regione)) {
      delete ammessi.regione;
      sconosciuti.push(c.regione);
    }
    const marche = new Set(dir.attivita.flatMap(b => Object.values(b.marchi).flat().map(m => m.marca)));
    if (c.marca && !marche.has(c.marca)) {
      delete ammessi.marca;
      sconosciuti.push(c.marca);
    }
    if (sconosciuti.length) ammessi.terminiNonRiconosciuti = [...new Set(sconosciuti)].slice(0, 3);
    return { ...risolvi({ ...locale.criteri, ...ammessi }), origine: 'provider', avviso: null, risposta: risposta ?? null };
  } catch {
    return { ...risolvi(locale.criteri), origine: 'deterministica', avviso: 'Il servizio di interpretazione non ha risposto correttamente: uso la ricerca interpretata localmente.', risposta: null };
  } finally {
    clearTimeout(timer);
  }
}
