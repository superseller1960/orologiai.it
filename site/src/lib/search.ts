import type { Business, Directory } from './schema.ts';
export const brandRoles = ['qualsiasi', 'venduti', 'riparati', 'esperienza', 'assistenzaUfficiale', 'rivenditaUfficiale', 'menzionati'] as const;
export type SearchFilters = {
  q?: string; localita?: string; regione?: string; provincia?: string; servizio?: string;
  marca?: string; ruoloMarca?: typeof brandRoles[number]; tipo?: string; specializzazione?: string;
  stato?: string; origine?: { lat: number; lon: number }; ordine?: 'nome' | 'distanza';
};
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function searchDirectory(data: Directory, f: SearchFilters = {}): { business: Business; distanzaKm: number | null }[] {
  const placeMap = new Map(data.localita.map(p => [p.id, p]));
  const tokens = normalize(f.q ?? '').split(' ').filter(Boolean);
  return data.attivita.filter(b => {
    const place = placeMap.get(b.localitaId);
    if (!place || (b.attendibilita.stato === 'chiusa' && f.stato !== 'chiusa')) return false;
    if (f.localita && b.localitaId !== f.localita) return false;
    if (f.regione && place.regioneSlug !== f.regione) return false;
    if (f.provincia && place.provinciaSlug !== f.provincia) return false;
    if (f.servizio && !b.servizi.some(s => s.id === f.servizio)) return false;
    if (f.tipo && !b.tipi.some(t => t === f.tipo)) return false;
    if (f.specializzazione && !b.specializzazioni.some(s => s.id === f.specializzazione)) return false;
    if (f.stato && b.attendibilita.stato !== f.stato) return false;
    const role = f.ruoloMarca ?? 'qualsiasi';
    const claims = role === 'qualsiasi' ? Object.values(b.marchi).flat() : b.marchi[role];
    if (f.marca && !claims.some(m => normalize(m.marca) === normalize(f.marca!))) return false;
    if (role !== 'qualsiasi' && !claims.length) return false;
    const haystack = normalize([b.nome, ...b.nomiPrecedenti, b.descrizione, place.comune, place.provincia, place.siglaProvincia, place.regione, b.posizione.indirizzo, b.posizione.cap, ...Object.values(b.marchi).flat().map(m => m.marca)].filter(Boolean).join(' '));
    return tokens.every(t => haystack.includes(t));
  }).map(b => ({ business: b, distanzaKm: f.origine && b.posizione.coordinate ? distanceKm(f.origine, b.posizione.coordinate) : null }))
    .sort((a, b) => {
      if (f.ordine === 'distanza' && f.origine) {
        const delta = (a.distanzaKm ?? Infinity) - (b.distanzaKm ?? Infinity);
        if (!Number.isNaN(delta) && delta !== 0) return delta;
      }
      return a.business.nome.localeCompare(b.business.nome, 'it');
    });
}
export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const role = params.get('ruoloMarca');
  return {
    q: params.get('q') ?? '', localita: params.get('localita') ?? '', regione: params.get('regione') ?? '',
    provincia: params.get('provincia') ?? '', servizio: params.get('servizio') ?? '', marca: params.get('marca') ?? '',
    ruoloMarca: brandRoles.find(r => r === role) ?? 'qualsiasi', tipo: params.get('tipo') ?? '',
    specializzazione: params.get('specializzazione') ?? '', stato: params.get('stato') ?? '',
  };
}
