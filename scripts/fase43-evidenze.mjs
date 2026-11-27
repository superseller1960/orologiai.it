// Fase 43 — declassamento semantico con conteggi esatti e storico.
// Regola: se per una coppia attività+servizio l'unica prova è una lavorazione interna
// (o una negazione esplicita), l'associazione passa a «da verificare».
// Non si declassa per parole isolate: serve il contesto della frase.
import { readFileSync, writeFileSync } from 'node:fs';
import { contestoEvidenza, provaDelServizio } from '../site/src/lib/evidenza-contesto.ts';

const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const prioritari = new Set(['revisione', 'riparazione', 'riparazione-meccanici', 'riparazione-automatici', 'restauro-vintage', 'pendoleria', 'assistenza', 'manutenzione']);
const chiave = e => `${e.attivitaId}::${e.servizio}`;

// 1. Classificazione di tutte le citazioni, non solo di quelle prioritarie.
const contesti = new Map();
for (const e of registro.evidenze) {
  if (!e.estratto) continue;
  contesti.set(e, contestoEvidenza(e.estratto));
}
const perChiave = new Map();
for (const [e, c] of contesti) {
  const gruppo = perChiave.get(chiave(e)) ?? [];
  gruppo.push({ e, c });
  perChiave.set(chiave(e), gruppo);
}
const conProva = new Set();
for (const [k, gruppo] of perChiave) {
  if (gruppo.some(({ c, e }) => provaDelServizio(c, e.servizio))) conProva.add(k);
}

// 2. Declassamento: solo gruppi senza alcuna prova di servizio al cliente.
const declassate = [];
for (const e of registro.evidenze) {
  if (e.stato === 'da-verificare') continue;
  if (e.stato !== 'confermata' || !prioritari.has(e.servizio)) continue;
  const c = contesti.get(e) ?? 'insufficiente';
  if (c !== 'interno' && c !== 'negato') continue;
  if (conProva.has(chiave(e))) continue;
  declassate.push({ attivitaId: e.attivitaId, servizio: e.servizio, fonteId: e.fonteId, contesto: c, estratto: e.estratto.slice(0, 220) });
  e.stato = 'da-verificare';
  e.estratto = '';
}
// 3. Riparazione idempotente: un'evidenza declassata non conserva l'estratto.
for (const e of registro.evidenze) {
  if (e.stato === 'da-verificare' && e.estratto) {
    if (!declassate.some(d => d.attivitaId === e.attivitaId && d.servizio === e.servizio)) {
      declassate.push({ attivitaId: e.attivitaId, servizio: e.servizio, fonteId: e.fonteId, contesto: contesti.get(e) ?? 'insufficiente', estratto: e.estratto.slice(0, 220) });
    }
    e.estratto = '';
  }
}

// 4. Conteggi esatti per l'audit, per servizio e per contesto.
const analizzate = registro.evidenze.length;
const confermate = registro.evidenze.filter(e => e.stato === 'confermata').length;
const incerte = registro.evidenze.filter(e => e.stato !== 'confermata').length;
const distribuzione = {};
for (const [e] of contesti) {
  if (e.stato !== 'confermata') continue;
  const c = contesti.get(e);
  distribuzione[c] = (distribuzione[c] ?? 0) + 1;
}
const perServizio = {};
for (const [e, c] of contesti) {
  if (!prioritari.has(e.servizio)) continue;
  perServizio[e.servizio] ??= { analizzate: 0, offerto: 0, interno: 0, negato: 0, insufficiente: 0 };
  const voce = perServizio[e.servizio];
  voce.analizzate++;
  if (c in voce) voce[c]++;
}

writeFileSync('data/evidenze/servizi.json', JSON.stringify(registro, null, 1) + '\n');
// Lo storico non si perde fra un'esecuzione e l'altra: le decisioni restano tracciate.
const precedente = JSON.parse(readFileSync('data/reports/fase42-evidenze.json', 'utf8'));
const complessive = new Map();
for (const d of precedente.declassate ?? []) complessive.set(`${d.attivitaId}::${d.servizio}`, d);
for (const d of declassate) complessive.set(`${d.attivitaId}::${d.servizio}`, d);
const tutte = [...complessive.values()];
const report = {
  aggiornatoIl: '2026-11-06',
  criterio: 'un servizio è documentato solo se una citazione descrive il servizio svolto per il cliente; lavorazione interna e negazioni non contano',
  conteggi: { analizzate, confermate, declassate: incerte, recuperate: 0, declassateInQuestoLotto: declassate.length },
  distribuzioneContesti: distribuzione,
  perServizio,
  declassate: tutte,
  storico: [{ fase: 42, declassate: (precedente.declassate ?? []).map(d => `${d.attivitaId}::${d.servizio}`) }],
};
writeFileSync('data/reports/fase43-evidenze.json', JSON.stringify(report, null, 1) + '\n');
writeFileSync('data/reports/fase42-evidenze.json', JSON.stringify({ aggiornatoIl: report.aggiornatoIl, criterio: report.criterio, declassate: tutte }, null, 1) + '\n');
console.log(`analizzate ${analizzate} · confermate ${confermate} · da verificare ${incerte} · declassate in questo lotto ${declassate.length}`);
console.log('contesti', JSON.stringify(distribuzione));
for (const d of declassate) console.log(`- ${d.attivitaId} · ${d.servizio} · ${d.contesto} · ${d.estratto.slice(0, 120)}…`);
