import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

type Point = { id: string; nome: string; comune: string; indirizzo: string | null; lat: number; lon: number; href: string };

const el = document.querySelector<HTMLElement>('#directory-map');
if (el) {
  const points: Point[] = JSON.parse(el.dataset.points ?? '[]');
  const map = L.map(el, { scrollWheelZoom: false }).setView([43.77, 11.25], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  const markers = new Map<string, L.Marker>();
  for (const p of points) {
    const marker = L.marker([p.lat, p.lon]).bindPopup(
      `<strong><a href="${p.href}">${p.nome}</a></strong><br>${p.indirizzo ?? ''}<br><small>${p.comune}</small>`,
    );
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
  };

  // La ricerca pubblica i risultati correnti; lo stato iniziale è letto se già disponibile.
  const initial = (window as unknown as { __directoryResults?: string[] }).__directoryResults;
  apply(initial ?? null);
  document.addEventListener('directory:results', (event) => {
    apply((event as CustomEvent<{ ids: string[] }>).detail.ids);
  });
}
