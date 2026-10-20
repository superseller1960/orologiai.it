import type { APIRoute } from 'astro';
import { directory, businessUrl, localityUrl, brandNames, slugify, servicePages } from '../lib/directory';
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/orologerie/', '/metodo/', '/partecipa/', ...directory.attivita.map(businessUrl), ...directory.localita.filter(p => directory.attivita.some(b => b.localitaId === p.id)).map(localityUrl), ...brandNames.map(b => `/marchi/${slugify(b)}/`), ...servicePages.map(s => `/servizi/${s}/`)];
  const escape = (v: string) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${escape(new URL(p, site).href)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
