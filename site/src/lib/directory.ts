import raw from '../../data/directory.json';
import { directorySchema, type Business, type Locality } from './schema.ts';
export const directory = directorySchema.parse(raw);
export const businessUrl = (b: Pick<Business, 'slug'>) => `/orologeria/${b.slug}/`;
export const localityUrl = (p: Locality) => `/orologerie/${p.regioneSlug}/${p.provinciaSlug}/${p.comuneSlug}/`;
export const placeOf = (b: Business) => {
  const place = directory.localita.find(p => p.id === b.localitaId);
  if (!place) throw new Error(`Località mancante: ${b.localitaId}`);
  return place;
};
export const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const brandNames = [...new Set(directory.attivita.flatMap(b => Object.values(b.marchi).flat().map(m => m.marca)))];
export const servicePages = [...new Set(directory.attivita.flatMap(b => b.servizi.map(s => s.id)))].filter(id => directory.attivita.filter(b => b.servizi.some(s => s.id === id)).length >= 2);
