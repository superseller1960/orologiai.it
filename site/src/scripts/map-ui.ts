import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
type Point = { id: string; nome: string; comune: string; indirizzo: string | null; lat: number; lon: number; href: string };
const TILE_URL: string = (import.meta.env.PUBLIC_TILE_URL as string | undefined) || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const el = document.querySelector<HTMLElement>('#directory-map');
if (el) {
  const points: Point[] = JSON.parse(el.dataset.points ?? '[]');
  const map = L.map(el, { scrollWheelZoom: false }).setView([42.5, 12.5], 5);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' }).addTo(map);
  const markers = new Map<string, L.Marker>();
  for (const p of points) {
    const popup = '<strong><a href="' + p.href + '">' + p.nome + '</a></strong><br>' + (p.indirizzo ?? '') + '<br><small>' + p.comune + '</small><br><small>Posizione confrontata con l’indirizzo disponibile.</small>';
    const marker = L.marker([p.lat, p.lon]).bindPopup(popup);
    marker.addTo(map);
    markers.set(p.id, marker);
  }
  const apply = (ids: string[] | null) => {
    const visible = new Set(ids ?? points.map(p => p.id));
    const shown: L.LatLngExpression[] = [];
    for (const [id, marker] of markers) {
      if (visible.has(id)) { marker.addTo(map); shown.push(marker.getLatLng()); }
      else marker.remove();
    }
    if (shown.length > 1) map.fitBounds(L.latLngBounds(shown), { padding: [24, 24], maxZoom: 13 });
    else if (shown.length === 1) map.setView(shown[0], 13);
    else map.setView([42.5, 12.5], 5);
    requestAnimationFrame(() => map.invalidateSize());
  };
  const initial = (window as unknown as { __directoryResults?: string[] }).__directoryResults;
  apply(initial ?? null);
  document.addEventListener('directory:results', event => apply((event as CustomEvent<{ ids: string[] }>).detail.ids));
}
