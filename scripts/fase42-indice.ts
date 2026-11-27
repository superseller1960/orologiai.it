// Fase 42 — indice di ricerca compatto con l'esito «documentato» già calcolato sui dati completi.
// Il client riceve solo i campi che usa per filtrare, contare, ordinare e creare le card.
import { writeFileSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { servizioDocumentato } from '../site/src/lib/recommendations.ts';

const compatto = {
  localita: directory.localita.map(p => ({
    id: p.id, comune: p.comune, comuneSlug: p.comuneSlug, provincia: p.provincia,
    provinciaSlug: p.provinciaSlug, siglaProvincia: p.siglaProvincia, regione: p.regione, regioneSlug: p.regioneSlug,
  })),
  fonti: directory.fonti.map(f => ({ id: f.id, titolo: f.titolo, url: f.url })),
  attivita: directory.attivita.map(b => ({
    id: b.id, slug: b.slug, nome: b.nome, nomiPrecedenti: b.nomiPrecedenti,
    descrizione: b.descrizione, localitaId: b.localitaId,
    servizi: b.servizi.map(s => ({ id: s.id, fonti: [] })),
    // Competenze realmente documentate sulle fonti complete: il client non deve ricalcolarle.
    documentati: b.servizi.filter(s => servizioDocumentato(directory, b, s.id)).map(s => s.id),
    altriServizi: b.altriServizi,
    marchi: Object.fromEntries(Object.entries(b.marchi).map(([ruolo, list]) => [ruolo, list.map(m => ({ marca: m.marca }))])),
    tipi: b.tipi,
    specializzazioni: b.specializzazioni.map(s => ({ id: s.id })),
    attendibilita: { stato: b.attendibilita.stato, verificataIl: b.attendibilita.verificataIl, cronologia: [] },
    posizione: { indirizzo: b.posizione.indirizzo, cap: b.posizione.cap, coordinate: b.posizione.coordinate },
    contatti: { telefono: b.contatti.telefono, sito: b.contatti.sito },
    storia: { annoFondazione: b.storia.annoFondazione, testo: '' },
    orari: { giorni: [], verificatiIl: null },
  })),
};

const json = JSON.stringify(compatto);
writeFileSync('site/data/indice-ricerca.json', json);
const kb = (n: number) => Math.round(n / 1024);
const completo = JSON.stringify(directory).length;
console.log(`indice ${kb(json.length)} KB · catalogo completo ${kb(completo)} KB · riduzione ${Math.round((1 - json.length / completo) * 100)}% · ${compatto.attivita.length} attività`);
