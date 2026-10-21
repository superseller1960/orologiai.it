import { z } from 'zod';
import { businessSchema, directorySchema, isUsableCoordinate, localitySchema, slugSchema, sourceSchema, type Business, type Directory } from './schema.ts';
import { findDuplicates } from './duplicates.ts';

const testo = z.string().trim().min(1);
export const reviewedBatchSchema = z.object({
  lotto: slugSchema,
  data: z.iso.date(),
  fonti: z.array(sourceSchema.extend({ evidenza: testo })),
  localita: z.array(localitySchema),
  candidati: z.array(z.object({
    id: slugSchema, nome: testo,
    decisione: z.enum(['approvata', 'in-revisione', 'scartata']),
    motivo: testo, fonti: z.array(slugSchema).min(1),
    attivita: businessSchema.optional(),
  }).strict()),
}).strict().superRefine((b, ctx) => {
  for (const campo of ['fonti', 'localita', 'candidati'] as const) {
    if (new Set(b[campo].map(x => x.id)).size !== b[campo].length) ctx.addIssue({ code: 'custom', message: `ID duplicati nel lotto: ${campo}` });
  }
  for (const c of b.candidati) {
    if (c.decisione === 'approvata' && (!c.attivita || c.id !== c.attivita.id || c.nome !== c.attivita.nome)) {
      ctx.addIssue({ code: 'custom', message: `${c.id}: approvazione senza scheda corrispondente` });
    }
  }
});
export type ReviewedBatch = z.infer<typeof reviewedBatchSchema>;

export function coverageReport(dir: Directory) {
  const attive = dir.attivita.filter(b => b.attendibilita.stato !== 'chiusa');
  const localita = dir.localita.filter(p => attive.some(b => b.localitaId === p.id));
  const unici = (v: string[]) => [...new Set(v)].sort();
  return {
    attivita: dir.attivita.length,
    regioni: unici(localita.map(p => p.regione)),
    province: unici(localita.map(p => p.siglaProvincia)),
    comuni: unici(localita.map(p => `${p.comune} (${p.siglaProvincia})`)),
    servizi: unici(attive.flatMap(b => b.servizi.map(s => s.id))),
    coordinateValide: attive.filter(b => isUsableCoordinate(b.posizione.coordinate)).length,
    conContatti: attive.filter(b => b.contatti.telefono || b.contatti.email || b.contatti.sito || b.contatti.whatsapp).length,
    perRegione: Object.fromEntries(unici(localita.map(p => p.regione)).map(regione => [regione,
      attive.filter(b => localita.find(p => p.id === b.localitaId)?.regione === regione).length,
    ])),
  };
}

const riferimenti = (b: Business) => [...new Set([
  ...b.posizione.fonti, ...(b.posizione.coordinate?.fonti ?? []), ...b.contatti.fonti,
  ...b.orari.fonti, ...b.storia.fonti, ...b.attendibilita.fonti,
  ...b.servizi.flatMap(s => s.fonti), ...b.altriServizi.flatMap(s => s.fonti),
  ...b.specializzazioni.flatMap(s => s.fonti), ...Object.values(b.marchi).flatMap(v => v.flatMap(m => m.fonti)),
  ...b.storia.eventi.flatMap(e => e.fonti), ...b.attendibilita.cronologia.flatMap(e => e.fonti),
])];

// Funzione pura: l'anteprima e la CLI usano la stessa validazione, senza richieste di rete.
// Un lotto ammette nuove schede; gli aggiornamenti conflittuali vanno in revisione.
export function integrateReviewedBatch(esistente: Directory, input: unknown) {
  const prima = directorySchema.parse(esistente);
  const batch = reviewedBatchSchema.parse(input);
  let directory = structuredClone(prima);
  const fonti = new Map(prima.fonti.map(s => [s.id, s]));
  for (const { evidenza: _evidenza, ...fonte } of batch.fonti) {
    if (fonti.has(fonte.id) && JSON.stringify(fonti.get(fonte.id)) !== JSON.stringify(fonte)) throw new Error(`Fonte esistente in conflitto: ${fonte.id}`);
    fonti.set(fonte.id, fonte);
  }
  const luoghi = new Map(prima.localita.map(p => [p.id, p]));
  for (const p of batch.localita) {
    if (luoghi.has(p.id) && JSON.stringify(luoghi.get(p.id)) !== JSON.stringify(p)) throw new Error(`Località esistente in conflitto: ${p.id}`);
    luoghi.set(p.id, p);
  }
  const decisioni: { id: string; esito: 'nuova' | 'gia-presente' | 'in-revisione' | 'scartata'; motivo: string; duplicati: string[] }[] = [];
  for (const candidato of batch.candidati) {
    for (const ref of candidato.fonti) if (!fonti.has(ref)) throw new Error(`${candidato.id}: fonte del candidato assente: ${ref}`);
    if (candidato.decisione !== 'approvata') {
      decisioni.push({ id: candidato.id, esito: candidato.decisione, motivo: candidato.motivo, duplicati: [] });
      continue;
    }
    const b = candidato.attivita!;
    const precedente = directory.attivita.find(x => x.id === b.id);
    if (precedente) {
      const identico = JSON.stringify(precedente) === JSON.stringify(b);
      decisioni.push({ id: b.id, esito: identico ? 'gia-presente' : 'in-revisione', motivo: identico ? 'Scheda identica: nessun secondo inserimento.' : 'ID esistente con dati diversi: originale conservato, aggiornamento da revisionare.', duplicati: identico ? [] : [precedente.id] });
      continue;
    }
    if (b.attendibilita.stato !== 'fonti-verificate' || b.attendibilita.verificataIl !== batch.data) throw new Error(`${b.id}: verifica assente o non riferita al lotto`);
    for (const s of b.servizi) {
      if (!s.fonti.some(id => ['sito-ufficiale', 'marchio-ufficiale', 'titolare'].includes(fonti.get(id)?.tipo ?? ''))) throw new Error(`${b.id}: servizio senza fonte primaria: ${s.id}`);
    }
    const p = luoghi.get(b.localitaId);
    if (!p) throw new Error(`${b.id}: località senza revisione`);
    const prova = structuredClone(directory);
    if (!prova.localita.some(x => x.id === p.id)) prova.localita.push(p);
    for (const ref of new Set([...riferimenti(b), ...p.fonti])) {
      const s = fonti.get(ref);
      if (!s || s.consultataIl > batch.data) throw new Error(`${b.id}: fonte assente o verificata nel futuro: ${ref}`);
      if (!prova.fonti.some(x => x.id === ref)) prova.fonti.push(s);
    }
    prova.attivita.push(b);
    const validata = directorySchema.parse(prova);
    const duplicati = findDuplicates(validata).filter(d => d.esito === 'da-revisionare' && (d.primo === b.id || d.secondo === b.id));
    if (duplicati.length) {
      decisioni.push({ id: b.id, esito: 'in-revisione', motivo: 'Possibile duplicato: nessuna seconda scheda pubblicata.', duplicati: [...new Set(duplicati.map(d => d.primo === b.id ? d.secondo : d.primo))] });
      continue;
    }
    directory = validata;
    decisioni.push({ id: b.id, esito: 'nuova', motivo: candidato.motivo, duplicati: [] });
  }
  for (const campo of ['fonti', 'localita', 'attivita'] as const) {
    for (const originale of prima[campo]) {
      if (JSON.stringify(originale) !== JSON.stringify(directory[campo].find(x => x.id === originale.id))) throw new Error(`Dato preesistente alterato: ${originale.id}`);
    }
  }
  return {
    directory,
    report: {
      lotto: batch.lotto, data: batch.data,
      conteggi: {
        nuove: decisioni.filter(d => d.esito === 'nuova').length, aggiornate: 0,
        giaPresenti: decisioni.filter(d => d.esito === 'gia-presente').length,
        inRevisione: decisioni.filter(d => d.esito === 'in-revisione').length,
        scartate: decisioni.filter(d => d.esito === 'scartata').length,
        duplicatiRilevati: decisioni.filter(d => d.duplicati.length).length,
      },
      prima: coverageReport(prima), dopo: coverageReport(directory), decisioni,
      fonti: batch.fonti,
    },
  };
}
