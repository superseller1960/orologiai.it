import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Directory } from './schema.ts';
import { distanceKm, normalize } from './search.ts';
const httpUrl = z.url().refine(v => /^https?:\/\//.test(v));
const lat = z.number().min(-90).max(90);
const lon = z.number().min(-180).max(180);
export const areaSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), nome: z.string().min(1),
  bbox: z.tuple([lat, lon, lat, lon]),
}).strict().refine(v => v.bbox[0] < v.bbox[2] && v.bbox[1] < v.bbox[3], 'Bounding box non valido');
const elementSchema = z.object({
  type: z.enum(['node', 'way', 'relation']), id: z.number().int().positive(),
  lat: lat.optional(), lon: lon.optional(), center: z.object({ lat, lon }).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
const envelopeSchema = z.object({
  elements: z.array(z.unknown()).max(50000),
  osm3s: z.object({ timestamp_osm_base: z.string().optional(), copyright: z.string().optional() }).optional(),
});
export const candidateSchema = z.object({
  id: z.string(), stato: z.literal('in-revisione'), nome: z.string().min(1),
  posizione: z.object({ indirizzo: z.string().nullable(), cap: z.string().regex(/^\d{5}$/).nullable(), comuneDichiarato: z.string().nullable(), coordinate: z.object({ lat, lon }).nullable() }),
  contatti: z.object({ telefono: z.string().nullable(), email: z.email().nullable(), sito: httpUrl.nullable() }),
  orariOriginali: z.string().nullable(), serviziCandidati: z.array(z.string()), marchiDichiarati: z.array(z.string()),
  fonte: z.object({ tipo: z.literal('osm'), idOriginale: z.string(), url: httpUrl, estrattoUrl: httpUrl, importatoIl: z.iso.datetime(), timestampDati: z.string().nullable(), licenza: z.literal('ODbL-1.0'), attribuzione: z.literal('© OpenStreetMap contributors') }),
  tagOriginali: z.record(z.string(), z.string()),
  possibiliDuplicati: z.array(z.object({ id: z.string(), motivo: z.string() })), avvisi: z.array(z.string()),
}).strict();
export type Candidate = z.infer<typeof candidateSchema>;
const normalizedPhone = (s: string) => s.replace(/[^0-9+]/g, '').replace(/^00/, '+');
function validUrl(s?: string): string | null {
  if (!s) return null;
  const parsed = httpUrl.safeParse(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  return parsed.success ? parsed.data : null;
}
export function importOsm(raw: string, areaInput: unknown, published: Directory, importedAt: string, extractUrl: string) {
  const area = areaSchema.parse(areaInput);
  z.iso.datetime().parse(importedAt);
  httpUrl.parse(extractUrl);
  const envelope = envelopeSchema.parse(JSON.parse(raw));
  const candidates: Candidate[] = [];
  const rejected: { indice: number; motivo: string }[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  const [south, west, north, east] = area.bbox;
  for (const [index, input] of envelope.elements.entries()) {
    const parsed = elementSchema.safeParse(input);
    if (!parsed.success) { rejected.push({ indice: index, motivo: parsed.error.message }); continue; }
    const e = parsed.data;
    const id = `${e.type}/${e.id}`;
    if (seen.has(id)) { duplicates++; continue; }
    seen.add(id);
    if (!(e.tags.shop === 'watches' || ['watchmaker','clockmaker'].includes(e.tags.craft ?? ''))) { rejected.push({ indice: index, motivo: 'Tag non pertinente' }); continue; }
    const name = e.tags.name?.trim();
    if (!name) { rejected.push({ indice: index, motivo: 'Nome mancante: richiede ricerca separata' }); continue; }
    const coords = e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : e.center ?? null;
    if (coords && (coords.lat < south || coords.lat > north || coords.lon < west || coords.lon > east)) { rejected.push({ indice: index, motivo: 'Coordinate fuori dall’area pilota' }); continue; }
    const warnings = ['Importazione geografica: servizi, marchi e operatività richiedono revisione.'];
    if (!coords) warnings.push('Coordinate mancanti: appartenenza all’area da confermare.');
    const postcode = e.tags['addr:postcode'] ?? '';
    if (postcode && !/^\d{5}$/.test(postcode)) warnings.push('CAP non valido, non trasferito.');
    const emailRaw = e.tags['contact:email'] ?? e.tags.email;
    const email = z.email().safeParse(emailRaw);
    if (emailRaw && !email.success) warnings.push('Email non valida, non trasferita.');
    const websiteRaw = e.tags['contact:website'] ?? e.tags.website;
    const website = validUrl(websiteRaw);
    if (websiteRaw && !website) warnings.push('URL non valido, non trasferito.');
    const c = candidateSchema.parse({
      id: `osm-${e.type}-${e.id}`, stato: 'in-revisione', nome: name,
      posizione: { indirizzo: e.tags['addr:street'] ? [e.tags['addr:street'],e.tags['addr:housenumber']].filter(Boolean).join(' ') : null, cap: /^\d{5}$/.test(postcode) ? postcode : null, comuneDichiarato: e.tags['addr:city'] ?? null, coordinate: coords },
      contatti: { telefono: e.tags['contact:phone'] ?? e.tags.phone ?? null, email: email.success ? email.data : null, sito: website },
      orariOriginali: e.tags.opening_hours ?? null,
      serviziCandidati: e.tags.shop === 'watches' ? ['vendita'] : [],
      marchiDichiarati: (e.tags.brand ?? '').split(';').map(v => v.trim()).filter(Boolean),
      fonte: { tipo: 'osm', idOriginale: id, url: `https://www.openstreetmap.org/${id}`, estrattoUrl: extractUrl, importatoIl: importedAt, timestampDati: envelope.osm3s?.timestamp_osm_base ?? null, licenza: 'ODbL-1.0', attribuzione: '© OpenStreetMap contributors' },
      tagOriginali: e.tags, possibiliDuplicati: [], avvisi: warnings,
    });
    for (const b of published.attivita) {
      const place = published.localita.find(p => p.id === b.localitaId);
      if (b.origine.sistema === 'osm' && b.origine.idOriginale === id) c.possibiliDuplicati.push({ id: b.id, motivo: 'Stesso identificativo OSM già pubblicato' });
      else if (normalize(b.nome) === normalize(name) && place && normalize(place.comune) === normalize(c.posizione.comuneDichiarato ?? '')) c.possibiliDuplicati.push({ id: b.id, motivo: 'Stesso nome normalizzato e comune' });
      else if (b.contatti.telefono && c.contatti.telefono && normalizedPhone(b.contatti.telefono) === normalizedPhone(c.contatti.telefono)) c.possibiliDuplicati.push({ id: b.id, motivo: 'Telefono coincidente: verificare eventuali sedi distinte' });
      else if (b.posizione.coordinate && coords && distanceKm(b.posizione.coordinate, coords) < .075 && normalize(b.nome) === normalize(name)) c.possibiliDuplicati.push({ id: b.id, motivo: 'Stesso nome entro 75 metri' });
    }
    for (const previous of candidates) {
      if ((normalize(previous.nome) === normalize(name) && normalize(previous.posizione.comuneDichiarato ?? '') === normalize(c.posizione.comuneDichiarato ?? '') && !!c.posizione.comuneDichiarato) || (coords && previous.posizione.coordinate && distanceKm(coords, previous.posizione.coordinate) < .075 && normalize(previous.nome) === normalize(name))) c.possibiliDuplicati.push({ id: previous.id, motivo: 'Possibile duplicato interno all’estratto: revisione manuale' });
    }
    candidates.push(candidateSchema.parse(c));
  }
  return {
    manifest: { versione: 1, area, sha256: createHash('sha256').update(raw).digest('hex'), estrattoUrl: extractUrl, importatoIl: importedAt, timestampDati: envelope.osm3s?.timestamp_osm_base ?? null, licenza: 'ODbL-1.0', attribuzione: '© OpenStreetMap contributors', copyrightOriginale: envelope.osm3s?.copyright ?? null },
    candidates,
    report: { letti: envelope.elements.length, candidati: candidates.length, duplicatiIdIgnorati: duplicates, possibiliDuplicati: candidates.filter(c => c.possibiliDuplicati.length).length, scartati: rejected, pubblicati: 0 },
  };
}
