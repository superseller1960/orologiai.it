// Fase 41 — i punti geografici non viaggiano più dentro l'HTML di /cerca/ (oltre 100 KB di attributo):
// diventano un file statico che map-ui preleva quando l'utente apre la mappa.
import type { APIRoute } from 'astro';
import { directory, businessUrl, placeOf } from '../lib/directory';
import { isUsableCoordinate } from '../lib/schema';
import mapCenters from '../../data/map-centers.json';

export const GET: APIRoute = () => {
  const points = directory.attivita
    .filter(b => isUsableCoordinate(b.posizione.coordinate))
    .map(b => ({
      id: b.id,
      nome: b.nome,
      comune: placeOf(b).comune,
      indirizzo: b.posizione.indirizzo,
      lat: b.posizione.coordinate!.lat,
      lon: b.posizione.coordinate!.lon,
      href: businessUrl(b),
    }));
  return new Response(JSON.stringify({ points, centers: mapCenters }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
