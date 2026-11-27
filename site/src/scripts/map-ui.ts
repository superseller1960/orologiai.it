import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';
import { selectMapState, type MapPoint, type MapSearchState, type TerritoryCenter } from '../lib/map-state';
const verifiedIcon = L.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow, iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });
const TILE_URL = (import.meta.env.PUBLIC_TILE_URL as string | undefined) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const el = document.querySelector<HTMLElement>('#directory-map');
if (el) void (async () => {
 // Fase 41: la ricerca non trasporta più i punti nell'HTML. Le schede territoriali possono
 // ancora fornirli inline; qui si preleva il file statico solo quando la mappa viene aperta.
 let points: MapPoint[] = [];
 let centers: Record<string,TerritoryCenter> = {};
 if (el.dataset.points) {
  points = JSON.parse(el.dataset.points);
  centers = JSON.parse(el.dataset.centers ?? '{}');
 } else {
  try {
   const risposta = await fetch('/mappa-punti.json');
   if (risposta.ok) { const dati = await risposta.json() as { points?: MapPoint[]; centers?: Record<string,TerritoryCenter> }; points = dati.points ?? []; centers = dati.centers ?? {}; }
  } catch { /* senza punti la mappa lo dichiara, l'elenco resta intatto */ }
 }
 const details = el.closest<HTMLDetailsElement>('details');
 const status = document.querySelector<HTMLElement>('#map-status');
 const summary = document.querySelector<HTMLElement>('#map-summary');
 let map: L.Map | undefined;
 const markers = L.layerGroup();
 let current: MapSearchState = (window as unknown as { __directoryMapState?: MapSearchState }).__directoryMapState ?? { ids: [] };
 const apply = () => {
  const selected = selectMapState(points,current,centers);
  const location = current.comune ? ` a ${current.comune}` : '';
  if (summary) summary.textContent = `Mappa${location} · ${selected.points.length} di ${selected.total} attività localizzate`;
  if (status) status.textContent = selected.points.length
   ? `${selected.points.length} posizioni dei risultati${location}. ${selected.total-selected.points.length} attività senza posizione verificata restano nell’elenco. I pin “Alternativa” indicano servizi generici, non corrispondenze esatte.`
   : selected.center ? `Territorio di ${selected.center.nome}. Nessun risultato ha coordinate verificate: non mostriamo punti di altre città.`
   : current.restricted ? 'Nessuna posizione verificata per questa ricerca. Consulta gli indirizzi nelle schede: non mostriamo punti nazionali estranei.'
   : 'Nessuna posizione verificata tra i risultati.';
  el.hidden = selected.unavailable;
  el.dataset.markerIds = JSON.stringify(selected.points.map(p=>p.id));
  if (!map) return;
  markers.clearLayers();
  for (const p of selected.points) {
   const popup = document.createElement('div');
   const link = document.createElement('a');link.href=p.href;link.textContent=p.nome;popup.append(link);
   for (const text of [p.indirizzo,p.comune,selected.related.has(p.id)?'Alternativa · servizio generico documentato':null]) if (text) { const line=document.createElement('div');line.textContent=text;popup.append(line); }
   const nav=document.createElement('a');nav.href=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.lat},${p.lon}`)}`;nav.textContent='Indicazioni ↗';nav.rel='noreferrer';nav.style.display='block';popup.append(nav);
   L.marker([p.lat,p.lon],{icon:verifiedIcon,alt:p.nome,title:p.nome}).bindPopup(popup).addTo(markers);
  }
  if (selected.points.length>1) map.fitBounds(L.latLngBounds(selected.points.map(p=>[p.lat,p.lon] as [number,number])),{padding:[35,35],maxZoom:15});
  else if (selected.points.length===1) map.setView([selected.points[0].lat,selected.points[0].lon],15);
  else if (selected.center) map.setView([selected.center.lat,selected.center.lon],13);
  else if (!current.restricted) map.setView([42.5,12.5],5);
  requestAnimationFrame(()=>map?.invalidateSize());
 };
 const initialize = () => {
  if (!map) {
   map=L.map(el,{scrollWheelZoom:false,dragging:!L.Browser.mobile,tapHold:false}).setView([42.5,12.5],5);
   L.tileLayer(TILE_URL,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
   markers.addTo(map);
   const move=document.querySelector<HTMLButtonElement>('#map-interact');
   if (move) {move.hidden=!L.Browser.mobile;move.addEventListener('click',()=>{const enabled=!map!.dragging.enabled();if(enabled)map!.dragging.enable();else map!.dragging.disable();move.setAttribute('aria-pressed',String(enabled));move.textContent=enabled?'Blocca spostamento mappa':'Sposta la mappa';});}
  }
  apply();
 };
 document.addEventListener('directory:results',event=>{current=(event as CustomEvent<MapSearchState>).detail;apply();});
 apply();
 if (details) {details.addEventListener('toggle',()=>{if(details.open)initialize();});if(details.open)initialize();}
 else initialize();
})();
