import { z } from 'zod';

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.iso.date();
const text = z.string().trim().min(1);
const url = z.url().refine(v => /^https?:\/\//.test(v), 'Solo URL HTTP(S)');
export const services = {
  vendita: 'Vendita di orologi', 'vendita-nuovi': 'Orologi nuovi', 'vendita-usati': 'Orologi usati',
  'acquisto-permuta': 'Acquisto / permuta (vedi dettagli)', riparazione: 'Riparazione', revisione: 'Revisione',
  manutenzione: 'Manutenzione', batterie: 'Sostituzione batterie', cinturini: 'Sostituzione cinturini',
  'riparazione-meccanici': 'Riparazione meccanici', 'riparazione-automatici': 'Riparazione automatici',
  'riparazione-quarzo': 'Riparazione al quarzo', 'restauro-vintage': 'Restauro vintage',
  pendoleria: 'Pendoleria', 'orologi-tasca': 'Orologi da tasca', ricambi: 'Ricambi',
  valutazioni: 'Valutazioni', lucidatura: 'Lucidatura', assistenza: 'Assistenza', gioielleria: 'Gioielleria',
} as const;
export const businessTypes = ['orologeria', 'laboratorio', 'gioielleria', 'professionista'] as const;
export const specializations = ['lusso', 'vintage', 'antichi', 'meccanici', 'automatici', 'collezione'] as const;
export const statuses = {
  'da-verificare': 'Da verificare', 'fonti-verificate': 'Verificata tramite fonti',
  'confermata-titolare': 'Confermata dal titolare', 'da-aggiornare': 'Da aggiornare', chiusa: 'Segnalata chiusa',
} as const;
const serviceId = z.enum(Object.keys(services) as [keyof typeof services, ...(keyof typeof services)[]]);
const refs = z.array(slugSchema).min(1);
export const sourceSchema = z.object({
  id: slugSchema, tipo: z.enum(['mirror-storico', 'sito-ufficiale', 'marchio-ufficiale', 'osm', 'stampa', 'directory', 'titolare']),
  url, titolo: text, consultataIl: date, percorsoArchivio: text.nullable(), licenza: text.nullable(),
}).strict();
export const localitySchema = z.object({
  id: slugSchema, comune: text, comuneSlug: slugSchema, provincia: text, provinciaSlug: slugSchema,
  siglaProvincia: z.string().regex(/^[A-Z]{2}$/), regione: text, regioneSlug: slugSchema,
  codiceIstat: z.string().regex(/^\d{6}$/).nullable(), descrizione: text, fonti: refs,
}).strict();
const claim = z.object({ id: serviceId, fonti: refs }).strict();
const brandClaim = z.object({ marca: text, fonti: refs }).strict();
export const coordinatesSchema = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), fonti: refs }).strict();
const interval = z.object({ apertura: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), chiusura: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/) }).strict().refine(v => v.apertura < v.chiusura, 'Intervallo non valido; spezzare a mezzanotte');
export const businessSchema = z.object({
  id: slugSchema, slug: slugSchema, nome: text, tipi: z.array(z.enum(businessTypes)).min(1),
  descrizione: text, nomiPrecedenti: z.array(text), gruppoId: slugSchema.nullable(),
  localitaId: slugSchema,
  posizione: z.object({ indirizzo: text.nullable(), cap: z.string().regex(/^\d{5}$/).nullable(), coordinate: coordinatesSchema.nullable(), fonti: z.array(slugSchema) }).strict(),
  contatti: z.object({ telefono: z.string().regex(/^\+?[\d ()/.-]{5,30}$/).nullable(), email: z.email().nullable(), sito: url.nullable(), whatsapp: z.string().regex(/^\+\d{7,15}$/).nullable(), social: z.array(url), fonti: z.array(slugSchema) }).strict(),
  orari: z.object({ giorni: z.array(z.object({ giorno: z.number().int().min(1).max(7), intervalli: z.array(interval) }).strict()), chiusure: z.array(text), verificatiIl: date.nullable(), fonti: z.array(slugSchema) }).strict(),
  servizi: z.array(claim), altriServizi: z.array(z.object({ nome: text, fonti: refs }).strict()),
  specializzazioni: z.array(z.object({ id: z.enum(specializations), fonti: refs }).strict()),
  marchi: z.object({ venduti: z.array(brandClaim), riparati: z.array(brandClaim), esperienza: z.array(brandClaim), assistenzaUfficiale: z.array(brandClaim), rivenditaUfficiale: z.array(brandClaim), menzionati: z.array(brandClaim) }).strict(),
  storia: z.object({ annoFondazione: z.number().int().min(1000).max(new Date().getUTCFullYear()).nullable(), fondatore: text.nullable(), testo: text.nullable(), eventi: z.array(z.object({ data: text, descrizione: text, fonti: refs }).strict()), fonti: z.array(slugSchema) }).strict(),
  attendibilita: z.object({ stato: z.enum(Object.keys(statuses) as [keyof typeof statuses, ...(keyof typeof statuses)[]]), raccoltaIl: date, verificataIl: date.nullable(), confermataTitolareIl: date.nullable(), fonti: refs, cronologia: z.array(z.object({ data: date, azione: text, fonti: refs }).strict()).min(1), segnalazioni: z.array(z.object({ data: date, motivo: text, stato: z.enum(['aperta', 'risolta']) }).strict()) }).strict(),
  origine: z.object({ sistema: text, idOriginale: text }).strict(),
}).strict();
export const directorySchema = z.object({
  versione: z.literal(1), fonti: z.array(sourceSchema), localita: z.array(localitySchema), attivita: z.array(businessSchema),
}).strict().superRefine((data, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const [name, values] of [['fonti', data.fonti], ['localita', data.localita], ['attivita', data.attivita]] as const) {
    if (new Set(values.map(x => x.id)).size !== values.length) issue(`ID duplicati in ${name}`);
  }
  if (new Set(data.attivita.map(x => x.slug)).size !== data.attivita.length) issue('Slug attività duplicati');
  const paths = data.localita.map(x => `${x.regioneSlug}/${x.provinciaSlug}/${x.comuneSlug}`);
  if (new Set(paths).size !== paths.length) issue('Percorsi località duplicati');
  const sources = new Map(data.fonti.map(x => [x.id, x]));
  const places = new Set(data.localita.map(x => x.id));
  const checkRefs = (ids: string[]) => { for (const id of ids) if (!sources.has(id)) issue(`Fonte inesistente: ${id}`); };
  for (const place of data.localita) checkRefs(place.fonti);
  for (const b of data.attivita) {
    if (!places.has(b.localitaId)) issue(`Località inesistente: ${b.localitaId}`);
    const sourceRefs = [b.posizione.fonti, b.contatti.fonti, b.orari.fonti, b.storia.fonti, b.attendibilita.fonti,
      ...b.servizi.map(x => x.fonti), ...b.altriServizi.map(x => x.fonti), ...b.specializzazioni.map(x => x.fonti),
      ...Object.values(b.marchi).flat().map(x => x.fonti), ...b.storia.eventi.map(x => x.fonti), ...b.attendibilita.cronologia.map(x => x.fonti)];
    if (b.posizione.coordinate) sourceRefs.push(b.posizione.coordinate.fonti);
    sourceRefs.forEach(checkRefs);
    for (const field of ['servizi', 'specializzazioni'] as const) if (new Set(b[field].map(x => x.id)).size !== b[field].length) issue(`${b.id}: ${field} duplicati`);
    if (new Set(b.orari.giorni.map(x => x.giorno)).size !== b.orari.giorni.length) issue(`${b.id}: giorni duplicati`);
    if ((b.storia.testo || b.storia.annoFondazione || b.storia.fondatore || b.storia.eventi.length) && !b.storia.fonti.length) issue(`${b.id}: storia senza fonti`);
    if (b.orari.giorni.length && (!b.orari.verificatiIl || !b.orari.fonti.length)) issue(`${b.id}: orari senza verifica/fonti`);
    if ((b.posizione.indirizzo || b.posizione.cap) && !b.posizione.fonti.length) issue(`${b.id}: posizione senza fonti`);
    if ((b.contatti.telefono || b.contatti.email || b.contatti.sito || b.contatti.whatsapp || b.contatti.social.length) && !b.contatti.fonti.length) issue(`${b.id}: contatti senza fonti`);
    if (b.attendibilita.stato === 'fonti-verificate' && (!b.attendibilita.verificataIl || !b.attendibilita.fonti.some(id => ['sito-ufficiale','marchio-ufficiale','stampa'].includes(sources.get(id)?.tipo ?? '')))) issue(`${b.id}: verifica indipendente insufficiente`);
    if (b.attendibilita.stato === 'confermata-titolare' && (!b.attendibilita.confermataTitolareIl || !b.attendibilita.fonti.some(id => sources.get(id)?.tipo === 'titolare'))) issue(`${b.id}: conferma titolare senza evidenza`);
    for (const c of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      if (!b.attendibilita.verificataIl || !c.fonti.some(id => sources.get(id)?.tipo === 'marchio-ufficiale')) issue(`${b.id}: autorizzazione ufficiale senza fonte del marchio e data verifica`);
    }
  }
});
export type Directory = z.infer<typeof directorySchema>;
export type Business = z.infer<typeof businessSchema>;
export type Locality = z.infer<typeof localitySchema>;
