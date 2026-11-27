// Motore di raccomandazione deterministico: nessun punteggio, nessuna reputazione inventata.
// Priorità alle evidenze documentali raccolte dalle fonti censite (data/evidenze/servizi.json):
// il motivo è la frase della fonte, breve e naturale. Se l'evidenza manca, si ricade sul testo
// della scheda e il servizio resta «da verificare»; nessun claim viene dedotto da un servizio affine.
import { services, type Business, type Directory } from './schema.ts';
import { evidenzaConfermata, fraseEvidenza, type Evidenza } from './evidenze.ts';
import { etichettaFonte } from './evidenza-regole.ts';
import contesto from '../../../data/reports/fase43-evidenze.json';

// Fase 42-43: associazioni la cui unica prova è una lavorazione interna sui propri orologi
// o una negazione esplicita. Non sono servizi offerti al cliente: il testo della scheda
// non può ribaltare questa decisione.
const SOLO_LAVORAZIONE_INTERNA = new Set(
  (contesto as { declassate: { attivitaId: string; servizio: string }[] }).declassate.map(d => `${d.attivitaId}::${d.servizio}`),
);

// Servizi che il visitatore usa per scegliere un laboratorio: se l'evidenza non li sostiene,
// non devono comparire come corrispondenza esatta di un filtro.
export const SERVIZI_TECNICI_DA_PROVARE: (keyof typeof services)[] = [
  'revisione', 'riparazione', 'riparazione-meccanici', 'riparazione-automatici', 'riparazione-quarzo',
  'restauro-vintage', 'pendoleria', 'orologi-tasca', 'batterie', 'cinturini', 'manutenzione', 'lucidatura', 'ricambi',
];

// Evidenza confermata (frase recuperata dalla fonte) oppure, in mancanza, testo della scheda.
export function evidenzaServizio(b: Business, id: keyof typeof services): Evidenza | undefined {
  return evidenzaConfermata(b.id, id);
}

// «documentato» = esiste una citazione verificata che descrive il servizio al cliente.
// Fase 44: il testo della scheda elenca il servizio, non lo dimostra; un URL nel database
// non è prova. Nessuna deduzione da servizi affini né da parole presenti nella descrizione.
export function servizioDocumentato(_dir: Directory, b: Business, id: keyof typeof services): boolean {
  if (!b.servizi.some(s => s.id === id)) return false;
  // Fase 42: l'indice compatto del client porta con sé l'esito calcolato sui dati completi.
  // Il server non ha questo campo e continua a calcolarlo: una sola verità, nessuna divergenza.
  if (SOLO_LAVORAZIONE_INTERNA.has(`${b.id}::${id}`)) return false;
  const precalcolati = (b as unknown as { documentati?: string[] }).documentati;
  if (Array.isArray(precalcolati)) return precalcolati.includes(id);
  return Boolean(evidenzaServizio(b, id));
}

// Il servizio è elencato nella scheda ma non ha una prova testuale verificata.
export function servizioIndicato(b: Business, id: keyof typeof services): boolean {
  return b.servizi.some(s => s.id === id) && !servizioSoloInterno(b, id);
}

// Fase 43: la decisione semantica è esplicita anche per chi la deve raccontare (assistente, card).
export function servizioSoloInterno(b: Business, id: keyof typeof services): boolean {
  return SOLO_LAVORAZIONE_INTERNA.has(`${b.id}::${id}`);
}

export function serviziDocumentati(dir: Directory, b: Business): (keyof typeof services)[] {
  return b.servizi.map(s => s.id).filter(id => servizioDocumentato(dir, b, id));
}

export function serviziDaVerificare(dir: Directory, b: Business): (keyof typeof services)[] {
  return b.servizi.map(s => s.id).filter(id => !servizioDocumentato(dir, b, id));
}

// Titoli delle fonti già ripuliti: un titolo che è in realtà un URL non entra mai nella motivazione.
const titoliFonti = (dir: Directory, ids: string[]): string[] => {
  const fonti = new Map(dir.fonti.map(f => [f.id, f]));
  return [...new Set(ids)]
    .map(id => { const f = fonti.get(id); return f ? etichettaFonte(f.titolo, f.url) : undefined; })
    .filter((t): t is string => Boolean(t));
};

export type Motivo = {
  testo: string;
  fonti: string[];
  // Collegamento discreto alla prova: l'URL vive nel link, mai nel testo della motivazione.
  verifica?: { url: string; etichetta: string };
};

export type CriteriMotivo = {
  servizio?: string; marca?: string; ruoloMarca?: string; tipo?: string;
  specializzazione?: string; localita?: string; regione?: string; provincia?: string; cap?: string;
};

const RUOLO_FRASE: Record<Evidenza['ruolo'], string | null> = {
  'laboratorio-interno': 'Laboratorio interno indicato dalla fonte.',
  'centro-assistenza-ufficiale': 'La fonte lo indica come centro di assistenza autorizzato.',
  'rivendita-ufficiale': 'La fonte lo indica come rivenditore autorizzato.',
  'punto-raccolta': 'La fonte lo descrive come punto di raccolta, non come laboratorio.',
  'non-specificato': null,
};

// Frasi editoriali: ogni voce descrive un fatto verificabile, mai un giudizio.
export function motiviPerRichiesta(dir: Directory, b: Business, c: CriteriMotivo): Motivo[] {
  const motivi: Motivo[] = [];
  const comune = dir.localita.find(p => p.id === b.localitaId)?.comune ?? b.localitaId;

  if (c.servizio) {
    const claim = b.servizi.find(s => s.id === c.servizio);
    if (claim) {
      const evidenza = evidenzaServizio(b, claim.id);
      // Fase 44: senza una citazione verificata non esiste motivazione positiva. La scheda
      // può solo dire che il servizio è indicato e va confermato con l'attività.
      if (evidenza) motivoEvidenza(motivi, evidenza, claim.id);
    }
  }

  if (c.marca) {
    const ruoli: ('assistenzaUfficiale' | 'rivenditaUfficiale' | 'riparati' | 'esperienza' | 'venduti' | 'menzionati')[] = [
      'assistenzaUfficiale', 'rivenditaUfficiale', 'riparati', 'esperienza', 'venduti', 'menzionati',
    ];
    for (const ruolo of ruoli) {
      const claim = b.marchi[ruolo].find(m => m.marca === c.marca);
      if (!claim) continue;
      const titolo = titoliFonti(dir, claim.fonti)[0];
      const frase = ruolo === 'assistenzaUfficiale' ? `Il marchio ${c.marca} la indica come centro di assistenza ufficiale`
        : ruolo === 'rivenditaUfficiale' ? `Il marchio ${c.marca} la indica come rivenditore ufficiale`
          : ruolo === 'riparati' ? `Dichiara riparazioni su ${c.marca}`
            : ruolo === 'esperienza' ? `Dichiara esperienza su ${c.marca}`
              : ruolo === 'venduti' ? `Documenta la vendita di ${c.marca}`
                : `Cita ${c.marca} solo come menzione storica`;
      if (ruolo !== 'menzionati') motivi.push({ testo: `${frase}${titolo ? ` (${titolo})` : ''}.`, fonti: claim.fonti });
    }
  }

  // Il laboratorio interno si cita solo se non c'è già una motivazione specifica sul servizio.
  if (motivi.length === 0 && b.laboratorio && b.laboratorio.tipo === 'interno' &&
    (!c.servizio || (SERVIZI_TECNICI_DA_PROVARE.includes(c.servizio as keyof typeof services) && servizioDocumentato(dir, b, c.servizio as keyof typeof services)))) {
    motivi.push({ testo: `Laboratorio interno dichiarato: ${b.laboratorio.descrizione.replace(/\s+/g, ' ').slice(0, 160).replace(/[,;]$/, '')}.`, fonti: b.laboratorio.fonti });
  }

  if (motivi.length === 0 && c.tipo && b.tipi.includes(c.tipo as Business['tipi'][number])) {
    motivi.push({ testo: `Tipologia dichiarata nella scheda: ${c.tipo}.`, fonti: b.posizione.fonti });
  }
  if (motivi.length === 0 && c.specializzazione && b.specializzazioni.some(s => s.id === c.specializzazione)) {
    const spec = b.specializzazioni.find(s => s.id === c.specializzazione)!;
    motivi.push({ testo: `Specializzazione documentata: ${c.specializzazione}.`, fonti: spec.fonti });
  }
  if (c.localita && b.localitaId === c.localita) {
    motivi.push({ testo: `Sede nel comune che hai scelto: ${comune} (${b.posizione.indirizzo ?? 'indirizzo in scheda'}).`, fonti: b.posizione.fonti });
  }
  if (c.cap && b.posizione.cap === c.cap) {
    motivi.push({ testo: `CAP ${c.cap} corrispondente a quello pubblicato dalla fonte.`, fonti: b.posizione.fonti });
  }
  // Nessun motivo inventato per riempire la scheda: se manca l'evidenza, resta solo la sede.
  return motivi.slice(0, 3);
}

function motivoEvidenza(motivi: Motivo[], evidenza: Evidenza, servizio: string): void {
  motivi.push({
    testo: fraseEvidenza(evidenza, 150, servizio),
    fonti: [evidenza.fonteId],
    verifica: { url: evidenza.url, etichetta: evidenza.titolo },
  });
  const ruolo = RUOLO_FRASE[evidenza.ruolo];
  if (ruolo && evidenza.ruolo !== 'rivendita-ufficiale' && evidenza.ruolo !== 'punto-raccolta') {
    motivi.push({ testo: ruolo, fonti: [evidenza.fonteId], verifica: { url: evidenza.url, etichetta: evidenza.titolo } });
  }
}

// Le motivazioni per la scheda completa: prima servizio documentato, poi la sede.
export function motiviScheda(dir: Directory, b: Business): Motivo[] {
  const documentati = serviziDocumentati(dir, b);
  const primo = documentati[0];
  if (!primo) {
    return [{ testo: `Sede a ${dir.localita.find(p => p.id === b.localitaId)?.comune ?? b.localitaId}: nessun servizio tecnico è descritto nel testo delle fonti.`, fonti: b.posizione.fonti }];
  }
  return motiviPerRichiesta(dir, b, { servizio: primo, localita: b.localitaId });
}

// «Da verificare»: il servizio è elencato nella scheda ma nessuna fonte lo sostiene.
export function avvisoDaVerificare(dir: Directory, b: Business): string | null {
  const daVerificare = serviziDaVerificare(dir, b);
  if (!daVerificare.length) return null;
  return `Elencati nella scheda ma non confermati dal testo delle fonti: ${daVerificare.map(id => services[id]).join(', ')}. Da confermare con l’attività.`;
}
