// Fase 32 — specchia nel lotto fase31-01 e nel registro candidati le decisioni
// dell'audit servizi, così una reintegrazione non ripristina tipologie o servizi errati.
// Uso: node scripts/fase32-specchia-audit.mjs [--apply]
import { readFile, writeFile } from 'node:fs/promises';

const LOTTI = ['data/import/fase31-01.json', 'data/import/fase31-02.json'];
const REGISTRO = 'data/fase31/registro-candidati.json';
// Ogni candidato del lotto con una scheda: il file di import resta uno specchio fedele del
// catalogo, così una reintegrazione non può riportare indietro nessuna correzione.
const IDS = null;
const DATA = '2026-11-03';

const NOTA = ' Fase 32: tipologia e laboratorio allineati alla pagina primaria; servizi non documentati rimossi.';
const SERVIZI = {
  'quaranta-campobasso': ['assistenza', 'vendita'],
  'musci-catanzaro': ['riparazione', 'revisione', 'manutenzione', 'cinturini'],
  'del-giudice-pozzuoli': ['gioielleria'],
  'arte-doro-ostuni': ['riparazione', 'assistenza', 'ricambi', 'batterie', 'cinturini', 'vendita'],
};

const apply = process.argv.includes('--apply');
const directory = JSON.parse(await readFile('site/data/directory.json', 'utf8'));
const catalogo = new Map(directory.attivita.map((a) => [a.id, a]));

const lotti = [];
const specchiati = [];
for (const percorso of LOTTI) {
  const lotto = JSON.parse(await readFile(percorso, 'utf8'));
  for (const cand of lotto.candidati) {
    if ((IDS && !IDS.includes(cand.id)) || !cand.attivita) continue;
    // I candidati mai integrati (duplicati, scartati) restano nel lotto come storia:
    // si specchiano solo le schede realmente pubblicate.
    const attuale = catalogo.get(cand.id);
    if (!attuale) continue;
    if (JSON.stringify(cand.attivita) !== JSON.stringify(attuale) || cand.nome !== attuale.nome) {
      cand.attivita = attuale;
      // Il validatore del lotto esige nome del candidato uguale a quello della scheda.
      cand.nome = attuale.nome;
      specchiati.push(cand.id);
    }
    if (!cand.motivo.includes('Fase 32:')) cand.motivo = `${cand.motivo}${NOTA}`;
  }
  lotti.push({ percorso, lotto });
}

const registro = JSON.parse(await readFile(REGISTRO, 'utf8'));
const registroAggiornati = [];
for (const voce of registro.candidati) {
  if (IDS && !IDS.includes(voce.id)) continue;
  if (!voce.motivo.includes('Fase 32:')) voce.motivo = `${voce.motivo}${NOTA}`;
  const servizi = SERVIZI[voce.id] ?? null;
  if (servizi && JSON.stringify(voce.serviziDocumentati) !== JSON.stringify(servizi)) {
    voce.serviziDocumentati = servizi;
    registroAggiornati.push(voce.id);
  }
}

console.log(JSON.stringify({ dryRun: !apply, lotti: lotti.map((l) => `${l.percorso}:${l.lotto.candidati.length}`), specchiati, registroAggiornati }, null, 1));
if (apply) {
  for (const { percorso, lotto } of lotti) await writeFile(percorso, `${JSON.stringify(lotto, null, 1)}\n`);
  await writeFile(REGISTRO, `${JSON.stringify(registro, null, 1)}\n`);
  // Controllo: le attività del lotto devono coincidere con il catalogo.
  const difformi = [];
  for (const { percorso } of lotti) {
    const dopo = JSON.parse(await readFile(percorso, 'utf8'));
    for (const c of dopo.candidati) {
      if (c.attivita && (!IDS || IDS.includes(c.id)) && JSON.stringify(c.attivita) !== JSON.stringify(catalogo.get(c.id))) difformi.push(c.id);
    }
  }
  console.log(JSON.stringify({ difformi }, null, 1));
}
