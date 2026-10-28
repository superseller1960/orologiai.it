import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Leaflet deduce l'URL dei pin dal CSS. Nel bundle l'immagine resta inline e la deduzione
// può produrre richieste relative alla pagina (404 /cerca/marker-icon.png): usiamo gli asset emessi da Vite.
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';
const verifiedIcon = L.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow, iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });
type Point = { id: string; nome: string; comune: string; indirizzo: string | null; lat: number; lon: number; href: string };
const TILE_URL: string = (import.meta.env.PUBLIC_TILE_URL as string | undefined) || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const el = document.querySelector<HTMLElement>('#directory-map');
if (el) {
 const details = el.closest<HTMLDetailsElement>('details');
 let initialized = false;
 const initialize = () => {
  if (initialized) return;
  initialized = true;
  const points: Point[] = JSON.parse(el.dataset.points ?? '[]');
  const map = L.map(el, { scrollWheelZoom: false }).setView([42.5, 12.5], 5);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' }).addTo(map);
  const markers = new Map<string, L.Marker>();
  for (const p of points) {
    const popup = '<strong><a href="' + p.href + '">' + p.nome + '</a></strong><br>' + (p.indirizzo ?? '') + '<br><small>' + p.comune + '</small><br><small>Posizione confrontata con l’indirizzo disponibile.</small>';
    const marker = L.marker([p.lat, p.lon], { icon: verifiedIcon }).bindPopup(popup);
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
  details?.addEventListener('toggle', () => { if (details.open) requestAnimationFrame(() => map.invalidateSize()); });
 };
 if (details) details.addEventListener('toggle', () => { if (details.open) initialize(); });
 else initialize();
}
