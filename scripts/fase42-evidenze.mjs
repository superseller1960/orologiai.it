// Fase 42 — declassa solo le associazioni la cui unica prova è una lavorazione interna.
// Se per la stessa attività e servizio esiste una citazione che descrive un servizio offerto,
// la conferma resta: non si cancella una competenza documentata da un'altra fonte.
import { readFileSync, writeFileSync } from 'node:fs';
import { contestoEvidenza } from '../site/src/lib/evidenza-contesto.ts';

const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8'));
const prioritari = new Set(['revisione', 'riparazione', 'riparazione-meccanici', 'riparazione-automatici', 'restauro-vintage', 'pendoleria', 'assistenza', 'manutenzione']);
const chiave = e => `${e.attivitaId}::${e.servizio}`;
const contesti = new Map();
for (const e of registro.evidenze) {
  if (!e.estratto) continue;
  contesti.set(e, contestoEvidenza(e.estratto));
}
// Un servizio è documentato se almeno una citazione del gruppo descrive un servizio offerto.
const conOfferta = new Set();
for (const [e, c] of contesti) if (c === 'offerto' || c === 'terzi') conOfferta.add(chiave(e));

const declassate = [];
// Riparazione idempotente: un'evidenza già declassata non deve conservare l'estratto.
for (const e of registro.evidenze) {
  if (e.stato === 'da-verificare' && e.estratto) {
    declassate.push({ attivitaId: e.attivitaId, servizio: e.servizio, fonteId: e.fonteId, contesto: contesti.get(e) ?? 'insufficiente', estratto: e.estratto.slice(0, 220) });
    e.estratto = '';
  }
}
for (const e of registro.evidenze) {
  if (e.stato === 'da-verificare') continue;
  if (e.stato !== 'confermata' || !prioritari.has(e.servizio)) continue;
  const c = contesti.get(e) ?? 'insufficiente';
  if (c !== 'interno' || conOfferta.has(chiave(e))) continue;
  // L'estratto resta nel report, non nell'evidenza: «da verificare» significa nessuna prova pubblicata.
  declassate.push({ attivitaId: e.attivitaId, servizio: e.servizio, fonteId: e.fonteId, contesto: c, estratto: e.estratto.slice(0, 220) });
  e.stato = 'da-verificare';
  e.estratto = '';
}
writeFileSync('data/evidenze/servizi.json', JSON.stringify(registro, null, 1) + '\n');
const report = { aggiornatoIl: '2026-11-06', criterio: 'lavorazione interna senza prova di servizio offerto al cliente', declassate };
writeFileSync('data/reports/fase42-evidenze.json', JSON.stringify(report, null, 1) + '\n');
console.log(`declassate ${declassate.length} associazioni su ${registro.evidenze.length}`);
for (const d of declassate.slice(0, 12)) console.log(`- ${d.attivitaId} · ${d.servizio} · ${d.estratto.slice(0, 110)}…`);
if (declassate.length > 12) console.log(`… e altre ${declassate.length - 12}`);
