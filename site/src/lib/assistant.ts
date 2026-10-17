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
  [/ revision/, 'revisione'],
  [/ cinturin| bracciale/, 'cinturini'],
  [/ batteri| pila | pile /, 'batterie'],
  [/ pendol/, 'pendoleria'],
  [/ lucida| lucidat/, 'lucidatura'],
  [/ ricambi/, 'ricambi'],
  [/ restaur/, 'restauro-vintage'],
  [/ da tasca| tasca /, 'orologi-tasca'],
  [/ ripar| fermat| non funziona| guast/, 'riparazione'],
  [/ valutaz| stima/, 'valutazioni'],
];
const SPECIALIZZAZIONI_REGOLE: [RegExp, (typeof specializations)[number]][] = [
  [/ automatic/, 'automatici'], [/ antich/, 'antichi'], [/ vintage/, 'vintage'],
  [/ lusso/, 'lusso'], [/ meccanic/, 'meccanici'], [/ collezion/, 'collezione'],
];
const TIPI_REGOLE: [RegExp, (typeof businessTypes)[number]][] = [
  [/ laborator/, 'laboratorio'], [/ gioielleri/, 'gioielleria'], [/ professionist| indipendent/, 'professionista'],
];

// Preposizioni che introducono una località; la parola successiva deve essere maiuscola nel testo originale.
const LOCALITA_RE = /\b(?:a|ad|in|di|vicino a|nei pressi di|nelle vicinanze di)\s+([A-ZÀ-Ö][\p{L}'’-]+(?:\s+[A-ZÀ-Ö][\p{L}'’-]+)?)/u;

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
    if (has(t, / ufficial/) && has(t, / assistenz/)) criteri.ruoloMarca = 'assistenzaUfficiale';
    else if (has(t, / ufficial/) && has(t, / rivendit| vendit/)) criteri.ruoloMarca = 'rivenditaUfficiale';
    else if (has(t, / ripar| laborator| esperto| esperienz/)) criteri.ruoloMarca = 'qualsiasi';
  }

  // Località: comune, poi provincia, poi regione, tutti presenti nel database.
  const comuni = [...dir.localita].sort((a, b) => b.comune.length - a.comune.length);
  const comune = comuni.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.comune))} `)));
  if (comune) criteri.localita = comune.id;
  else {
    const prov = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.provincia))} `)));
    const reg = dir.localita.find(p => has(t, new RegExp(` ${escapeRe(normalize(p.regione))} `)));
    if (prov) criteri.provincia = prov.provinciaSlug;
    else if (reg) criteri.regione = reg.regioneSlug;
  }
  if (!comune && !criteri.provincia && !criteri.regione) {
    const m = LOCALITA_RE.exec(original);
    if (m && !(marca && normalize(m[1]).includes(normalize(marca)))) {
      const nome = m[1].trim();
      // Non è una località già nota: segnalo che non risulta censita (non la ignoro).
      criteri.localitaNonCensita = nome;
    }
  }
  if (has(t, / vicino a me | vicino | vicinanz| nei dintorni | qui vicino | nelle vicinanze /) && !criteri.localita && !criteri.provincia && !criteri.regione && !criteri.localitaNonCensita) {
    criteri.bisognoPosizione = true;
  }

  const km = /\b(\d{1,3})\s*km\b/.exec(t);
  if (km) criteri.distanzaMaxKm = Math.min(500, Math.max(1, Number(km[1])));

  // Servizi: il primo termine trovato in ordine di priorità; "usati" distingue vendita e acquisto.
  if (has(t, / usat/) && has(t, / acquist| compr| permut/)) criteri.servizio = 'acquisto-permuta';
  else if (has(t, / usat/) && has(t, / vend/)) criteri.servizio = 'vendita-usati';
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
  if (criteri.localitaNonCensita) {
    return { stato: 'localita-non-censita', totale: 0, risultati: [], alternative: [], messaggi: [
      `“${criteri.localitaNonCensita}” non è tra i comuni censiti. Le località disponibili sono nella pagina dei territori.`,
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

  const filtri: SearchFilters = {
    localita: criteri.localita, provincia: criteri.provincia, regione: criteri.regione,
    servizio: criteri.servizio, marca: criteri.marca, ruoloMarca: criteri.ruoloMarca,
    tipo: criteri.tipo, specializzazione: criteri.specializzazione,
    origine: opzioni.origine, ordine: opzioni.origine ? 'distanza' : 'nome',
  };
  let trovate = searchDirectory(dir, filtri);

  if (criteri.distanzaMaxKm !== undefined) {
    trovate = trovate.filter(r => r.distanzaKm !== null && r.distanzaKm <= criteri.distanzaMaxKm!);
  }
  const messaggi: string[] = [];
  if (criteri.apertoOggi) {
    const aperte = trovate.filter(r => statoOrari(r.business, now) === 'indicato-oggi');
    if (aperte.length === 0) messaggi.push('Nessuna attività risulta aperta oggi con orari verificati. Gli orari mancanti non vengono considerati aperture.');
    trovate = aperte;
  }

  const risultati = trovate.slice(0, MAX_RISULTATI).map(r => descrivi(dir, r.business, criteri, now, r.distanzaKm));

  // Autorizzazioni ufficiali: se non documentate, offro alternative chiaramente distinte.
  let alternative: RisultatoAttivita[] = [];
  if ((criteri.ruoloMarca === 'assistenzaUfficiale' || criteri.ruoloMarca === 'rivenditaUfficiale') && criteri.marca) {
    messaggi.push(criteri.ruoloMarca === 'assistenzaUfficiale'
      ? `Non risulta nel database nessuna assistenza ufficialmente autorizzata per ${criteri.marca}. Le attività sotto non sono autorizzate: sono alternative da verificare direttamente con il negozio.`
      : `Non risulta nel database nessuna rivendita ufficialmente autorizzata per ${criteri.marca}.`);
    const generiche = searchDirectory(dir, { ...filtri, ruoloMarca: 'qualsiasi' })
      .filter(r => !risultati.some(x => x.id === r.business.id));
    alternative = generiche.slice(0, 3).map(r => descrivi(dir, r.business, { ...criteri, ruoloMarca: 'qualsiasi' }, now, r.distanzaKm));
  }

  if (trovate.length === 0) messaggi.push('Nessuna attività soddisfa tutti i criteri. Prova a rimuovere un requisito o a cercare in un’area più ampia.');
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
  if (!provider) return { ...locale, origine: 'deterministica', avviso: 'Assistente AI non configurato: uso la ricerca interpretata localmente.', risposta: null };

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
    if (c.localita && !dir.localita.some(p => p.id === c.localita)) delete ammessi.localita;
    if (c.provincia && !dir.localita.some(p => p.provinciaSlug === c.provincia)) delete ammessi.provincia;
    if (c.regione && !dir.localita.some(p => p.regioneSlug === c.regione)) delete ammessi.regione;
    const marche = new Set(dir.attivita.flatMap(b => Object.values(b.marchi).flat().map(m => m.marca)));
    if (c.marca && !marche.has(c.marca)) delete ammessi.marca;
    return { criteri: criteriSchema.parse(ammessi), chiarimenti: locale.chiarimenti, origine: 'provider', avviso: null, risposta: risposta ?? null };
  } catch {
    return { ...locale, origine: 'deterministica', avviso: 'Il servizio di interpretazione non ha risposto correttamente: uso la ricerca interpretata localmente.', risposta: null };
  } finally {
    clearTimeout(timer);
  }
}
