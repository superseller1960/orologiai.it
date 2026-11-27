// Fase 41 — le associazioni che contano di più nella ricerca: quante sono documentate da una
// frase pertinente e quante restano da verificare. Nessun reintegro automatico: solo un report.
import { readFileSync, writeFileSync } from 'node:fs';
import { services } from '../site/src/lib/schema.ts';

const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')).evidenze;
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const prioritari = ['revisione', 'riparazione', 'riparazione-automatici', 'pendoleria', 'restauro-vintage', 'assistenza'];

// Una frase è pertinente se contiene la parola del servizio nella stessa frase, non in un menu.
const PAROLA = {
  revisione: /revision|tagliand/i,
  riparazione: /ripar|aggiust|sistemazion|officina/i,
  'riparazione-automatici': /automatic|rotore/i,
  pendoleria: /pendol|a muro|cucu|carrillon/i,
  'restauro-vintage': /restaur|d.?epoca|vintage|antich/i,
  assistenza: /assistenz|centro di servizio/i,
};

const perServizio = {};
for (const id of prioritari) {
  const associazioni = registro.filter(e => e.servizio === id);
  const confermate = associazioni.filter(e => e.stato === 'confermata' && e.estratto?.trim());
  const pertinenti = confermate.filter(e => PAROLA[id]?.test(e.estratto) ?? true);
  perServizio[id] = {
    etichetta: services[id],
    associazioni: associazioni.length,
    confermate: confermate.length,
    daVerificare: associazioni.filter(e => e.stato !== 'confermata').length,
    frasiSenzaParola: confermate.length - pertinenti.length,
    attivitaDistinte: new Set(associazioni.map(e => e.attivitaId)).size,
  };
}

// Associazioni confermate la cui frase non nomina il servizio: restano pubblicate solo se il
// testo della scheda lo sostiene, altrimenti il motivo non viene mostrato (comportamento Fase 40).
const daRivedere = registro
  .filter(e => prioritari.includes(e.servizio) && e.stato === 'confermata' && e.estratto?.trim() && !(PAROLA[e.servizio]?.test(e.estratto) ?? true))
  .slice(0, 200)
  .map(e => ({ attivitaId: e.attivitaId, servizio: e.servizio, estratto: e.estratto.slice(0, 160), fonte: e.fonteId, url: e.url }));

const report = {
  aggiornatoIl: '2026-11-06',
  catalogo: { attivita: dir.attivita.length, localita: dir.localita.length },
  registro: registro.length,
  prioritari: perServizio,
  frasiDaRivedere: daRivedere,
};
writeFileSync('data/reports/fase41-evidenze.json', JSON.stringify(report, null, 1) + '\n');
for (const [id, r] of Object.entries(perServizio)) {
  console.log(`${r.etichetta.padEnd(26)} associazioni ${String(r.associazioni).padStart(4)} · confermate ${String(r.confermate).padStart(4)} · senza parola ${String(r.frasiSenzaParola).padStart(3)} · attività ${r.attivitaDistinte}`);
}
console.log(`frasi da rivedere: ${daRivedere.length} · report in data/reports/fase41-evidenze.json`);
