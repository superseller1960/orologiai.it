export type MapPoint = { id: string; nome: string; comune: string; indirizzo: string | null; lat: number; lon: number; href: string };
export type TerritoryCenter = { nome: string; lat: number; lon: number; fonte: string; verificataIl: string };
export type MapSearchState = { ids: string[]; relatedIds?: string[]; localita?: string; comune?: string; restricted?: boolean };
// Stato puro condiviso: nessun fallback ai punti nazionali quando i risultati sono vuoti.
export function selectMapState(points: MapPoint[], state: MapSearchState, centers: Record<string,TerritoryCenter>) {
 const exact = new Set(state.ids), related = new Set(state.relatedIds ?? []);
 const shown = points.filter(p => exact.has(p.id) || related.has(p.id));
 const center = state.localita ? centers[state.localita] : undefined;
 return { points: shown, related, center, unavailable: shown.length===0 && !center && Boolean(state.restricted), total: exact.size+related.size };
}
