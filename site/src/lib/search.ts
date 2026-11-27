import type { Business, Directory } from './schema.ts';
import { brandKey, isUsableCoordinate, services } from './schema.ts';
import { SERVIZI_TECNICI_DA_PROVARE, servizioDocumentato } from './recommendations.ts';
export const brandRoles = ['qualsiasi', 'venduti', 'riparati', 'esperienza', 'assistenzaUfficiale', 'rivenditaUfficiale', 'menzionati'] as const;
export type SearchFilters = {
  q?: string; localita?: string; regione?: string; provincia?: string; servizio?: string;
  marca?: string; ruoloMarca?: typeof brandRoles[number]; tipo?: string; specializzazione?: string;
  stato?: string; origine?: { lat: number; lon: number }; ordine?: 'nome' | 'distanza';
  // Mostra solo le attività con una prova testuale del servizio richiesto.
  soloDocumentate?: boolean;
  // Elenco di servizi senza il filtro di evidenza: serve solo all'audit e alla sezione «da verificare».
  includiNonVerificati?: boolean;
};
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const serviceSearchTerms: Partial<Record<keyof typeof services, string[]>> = {
  revisione: ['tagliando'],
  riparazione: ['riparare', 'orologio fermo', 'orologio guasto'],
  batterie: ['batteria', 'cambio batteria', 'cambio pila', 'sostituzione batteria'],
  cinturini: ['cinturino', 'bracciale'],
};
export function localityMatches(data: Pick<Directory, 'localita'>, query: string, exact = false) {
  const needle = normalize(query);
  if (!needle) return [];
  // Nomi con preposizione (es. «Reggio di Calabria») si cercano anche senza «di» (es. «Reggio Calabria»).
  const senzaDi = (s: string) => normalize(s).replace(/ di /g, ' ');
  return data.localita.filter(p => exact ? normalize(p.comune) === needle || senzaDi(p.comune) === senzaDi(needle) : normalize(p.comune).includes(needle))
    .sort((a, b) => a.comune.localeCompare(b.comune, 'it') || a.provincia.localeCompare(b.provincia, 'it'));
}
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function searchDirectory(data: Directory, f: SearchFilters = {}): { business: Business; distanzaKm: number | null }[] {
  // Una località identificata prevale sui vincoli territoriali dei vecchi deep link.
  const selectedPlace = data.localita.find(p => p.id === f.localita);
  if (selectedPlace) f = { ...f, regione: selectedPlace.regioneSlug, provincia: selectedPlace.provinciaSlug };
  const placeMap = new Map(data.localita.map(p => [p.id, p]));
  const tokens = normalize(f.q ?? '').split(' ').filter(Boolean);
  return data.attivita.filter(b => {
    const place = placeMap.get(b.localitaId);
    if (!place || (b.attendibilita.stato === 'chiusa' && f.stato !== 'chiusa')) return false;
    if (f.localita && b.localitaId !== f.localita) return false;
    if (f.regione && place.regioneSlug !== f.regione) return false;
    if (f.provincia && place.provinciaSlug !== f.provincia) return false;
    // Il servizio è un dato con fonti registrate: non viene escluso perché il riepilogo editoriale
    // non lo ripete. La mancanza di descrizione è segnalata a parte (searchDirectoryTiered).
    if (f.servizio && !b.servizi.some(s => s.id === f.servizio)) return false;
    // Fase 43: su richiesta si escludono le attività che elencano il servizio senza prova.
    if (f.soloDocumentate && f.servizio && !servizioDocumentato(data, b, f.servizio as keyof typeof services)) return false;
    if (f.tipo && !b.tipi.some(t => t === f.tipo)) return false;
    if (f.specializzazione && !b.specializzazioni.some(s => s.id === f.specializzazione)) return false;
    if (f.stato && b.attendibilita.stato !== f.stato) return false;
    const role = f.ruoloMarca ?? 'qualsiasi';
    const claims = role === 'qualsiasi' ? Object.values(b.marchi).flat() : b.marchi[role];
    if (f.marca && !claims.some(m => brandKey(m.marca) === brandKey(f.marca!))) return false;
    if (role !== 'qualsiasi' && !claims.length) return false;
    const haystack = normalize([
      b.nome, ...b.nomiPrecedenti, b.descrizione, place.comune, place.provincia, place.siglaProvincia,
      place.regione, b.posizione.indirizzo, b.posizione.cap,
      ...Object.values(b.marchi).flat().map(m => m.marca),
      ...b.servizi.flatMap(s => [services[s.id], ...(serviceSearchTerms[s.id] ?? [])]),
      ...b.altriServizi.map(s => s.nome), ...b.tipi, ...b.specializzazioni.map(s => s.id),
    ].filter(Boolean).join(' '));
    return tokens.every(t => haystack.includes(t));
  }).map(b => ({ business: b, distanzaKm: f.origine && isUsableCoordinate(b.posizione.coordinate) ? distanceKm(f.origine, b.posizione.coordinate) : null }))
    .sort((a, b) => {
      if (f.ordine === 'distanza' && f.origine) {
        const delta = (a.distanzaKm ?? Infinity) - (b.distanzaKm ?? Infinity);
        if (!Number.isNaN(delta) && delta !== 0) return delta;
      }
      return a.business.nome.localeCompare(b.business.nome, 'it');
    });
}
// Livello 2: un servizio specifico è cercato anche come servizio generico documentato.
// Solo mappature esplicite: nessuna specializzazione viene attribuita senza una voce propria.
export const SERVIZI_GENERICI_PERTINENTI: Partial<Record<keyof typeof services, (keyof typeof services)[]>> = {
  'riparazione-meccanici': ['riparazione'],
  'riparazione-automatici': ['riparazione'],
  'riparazione-quarzo': ['riparazione'],
};
// Restituisce le corrispondenze esatte e, separatamente, le pertinenti con servizio generico documentato.
export function searchDirectoryTiered(data: Directory, f: SearchFilters = {}) {
  const esatti = searchDirectory(data, f);
  const idEsatti = new Set(esatti.map(r => r.business.id));
  // Corrispondenza documentata prima: chi ha una frase della fonte sul servizio richiesto
  // precede chi lo elenca soltanto. L'ordinamento per distanza resta vincolante quando richiesto.
  const servizioTecnico = f.servizio && SERVIZI_TECNICI_DA_PROVARE.includes(f.servizio as keyof typeof services)
    ? f.servizio as keyof typeof services : null;
  if (servizioTecnico && f.ordine !== 'distanza') {
    esatti.sort((a, b) => Number(servizioDocumentato(data, b.business, servizioTecnico)) - Number(servizioDocumentato(data, a.business, servizioTecnico)));
  }
  // Servizio tecnico elencato nella scheda ma non descritto nel riepilogo: non escluso,
  // solo segnalato perché il visitatore verifichi la fonte citata.
  const daVerificare = f.servizio && SERVIZI_TECNICI_DA_PROVARE.includes(f.servizio as keyof typeof services)
    ? esatti.filter(r => !servizioDocumentato(data, r.business, f.servizio as keyof typeof services))
    : ([] as typeof esatti);
  const generici = f.servizio ? SERVIZI_GENERICI_PERTINENTI[f.servizio as keyof typeof services] ?? [] : [];
  if (!generici.length) return { esatti, pertinenti: [] as typeof esatti, daVerificare };
  const pertinenti = generici.flatMap(servizio => searchDirectory(data, { ...f, servizio, ordine: f.ordine }))
    .filter((r, i, all) => !idEsatti.has(r.business.id) && all.findIndex(x => x.business.id === r.business.id) === i);
  return { esatti, pertinenti, daVerificare };
}
export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const role = params.get('ruoloMarca');
  return {
    q: params.get('q') ?? '', localita: params.get('localita') ?? '', regione: params.get('regione') ?? '',
    provincia: params.get('provincia') ?? '', servizio: params.get('servizio') ?? '', marca: params.get('marca') ?? '',
    ruoloMarca: brandRoles.find(r => r === role) ?? 'qualsiasi', tipo: params.get('tipo') ?? '',
    specializzazione: params.get('specializzazione') ?? '', stato: params.get('stato') ?? '',
    soloDocumentate: params.get('soloDocumentate') === '1',
  };
}
