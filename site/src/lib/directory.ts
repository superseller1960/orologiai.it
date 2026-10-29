// Import JSON senza attributo `with { type: 'json' }`: il bundler esbuild di Cloudflare Pages
// (linea < 0.20) non supporta quella sintassi e fallisce in fase di build delle Functions.
// L'import semplice è risolto da tutte le toolchain del progetto: Vite/Astro, TypeScript
// (resolveJsonModule + moduleResolution bundler), esbuild (bundle Vercel), tsx e Wrangler.
// Node ESM nativo richiederebbe l'attributo, ma nessun file viene eseguito con node nativo:
// script e test passano da tsx, le funzioni Vercel e Pages sono sempre bundlate.
import raw from '../../data/directory.json';
import { brandLabel, directorySchema, type Business, type Locality } from './schema.ts';
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
// Opzioni del filtro marchio: una sola voce per denominazioni equivalenti (IWC / IWC Schaffhausen).
// L'elenco completo brandNames resta per le pagine /marchi/ e la sitemap: nessun URL viene rimosso.
export const brandOptions = [...new Set(brandNames.map(brandLabel))].sort((a, b) => a.localeCompare(b, 'it'));
// Regioni con almeno una località e un'attività: sono le sole pagine regionali generate e inserite in sitemap.
export const regioniConAttivita = [...new Set(directory.localita
  .filter(p => directory.attivita.some(b => b.localitaId === p.id))
  .map(p => p.regioneSlug))];
export const servicePages = [...new Set(directory.attivita.flatMap(b => b.servizi.map(s => s.id)))].filter(id => directory.attivita.filter(b => b.servizi.some(s => s.id === id)).length >= 2);
