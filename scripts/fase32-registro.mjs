// Fase 32 — registra nel registro persistente l'esito di tutti gli 87 candidati
// raccolti nel lotto 01: pubblicati, in revisione, sospesi dal gate, duplicati.
import { readFileSync, writeFileSync } from 'node:fs';

const REG = 'data/fase31/registro-candidati.json';
const VER = 'data/reports/fase32-verifica-candidati.json';
const ESC = 'data/reports/fase32-esclusi-gate.json';
const INT = 'data/reports/fase32-integrazione-01.json';
const CAT = 'site/data/directory.json';

const registro = JSON.parse(readFileSync(REG, 'utf8'));
const verifica = JSON.parse(readFileSync(VER, 'utf8'));
const esclusi = JSON.parse(readFileSync(ESC, 'utf8')).esclusi;
const integrazione = JSON.parse(readFileSync(INT, 'utf8'));
const catalogo = JSON.parse(readFileSync(CAT, 'utf8'));

const decisioni = new Map(integrazione.decisioni.map((d) => [d.id, d]));
const motiviEsclusione = new Map(esclusi.map((e) => [e.id, e.motivo]));
const slug = (testo) => testo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Il rapporto di verifica accoda il comune all'id (es. tempo-prezioso-bologna-bologna).
const perCandidato = (c) => {
  const suffisso = `-${slug(c.comune)}`;
  const base = c.id.endsWith(suffisso) ? c.id.slice(0, -suffisso.length) : c.id;
  return decisioni.get(c.id) ?? decisioni.get(base);
};

// Il blocco fase32 è rigenerabile: lo si sostituisce invece di accodare doppioni.
registro.candidati = registro.candidati.filter((c) => c.fase !== 32);
const giaRegistrati = new Set(registro.candidati.map((c) => c.id));

const voci = [];
for (const c of verifica.candidati) {
  const decisione = perCandidato(c);
  let stato;
  let motivo;
  if (decisione?.esito === 'nuova') {
    stato = 'verificato';
    motivo = 'Pubblicata nel lotto fase32-01: indirizzo, CAP e recapiti riscontrati sulla pagina ufficiale; servizi trascritti solo se dichiarati.';
  } else if (decisione?.esito === 'in-revisione') {
    stato = 'duplicato';
    motivo = `Possibile doppione di ${(decisione.duplicati ?? []).join(', ')}: stesso indirizzo a Porto Torres, domini diversi. Nessuna seconda scheda pubblicata finché la titolarità non è chiarita.`;
  } else if (motiviEsclusione.has(c.id)) {
    stato = 'sospeso';
    motivo = `Gate geografico: ${motiviEsclusione.get(c.id)}. Non pubblicata.`;
  } else {
    stato = 'duplicato';
    motivo = `Fase 32: ${c.motivo}${c.duplicatoDi ? ` (${c.duplicatoDi})` : ''}`;
  }
  voci.push({
    id: c.id,
    nome: c.nome,
    comune: c.comune,
    fonte: c.url ?? c.sito,
    stato,
    motivo,
    serviziDocumentati: decisione?.esito === 'nuova' ? (c.evidenza ?? null) : null,
    fase: 32,
    lotto: 'fase32-01',
  });
}

const nuove = voci.filter((v) => !giaRegistrati.has(v.id));
registro.candidati.push(...nuove.sort((a, b) => a.id.localeCompare(b.id)));

const conta = (stato, fase) => registro.candidati.filter((c) => c.stato === stato && (fase === undefined || c.fase === fase)).length;
registro.riepilogo = {
  ...registro.riepilogo,
  candidati: registro.candidati.length,
  verificati: registro.candidati.filter((c) => c.stato === 'verificato').length,
  duplicati: registro.candidati.filter((c) => c.stato === 'duplicato').length,
  sospesi: registro.candidati.filter((c) => c.stato === 'sospeso').length,
  scartati: registro.candidati.filter((c) => c.stato === 'scartato').length,
  nuoveInCatalogo: registro.candidati.filter((c) => c.stato === 'verificato' && c.fase === 32).length,
  fase32: {
    lotto: 'fase32-01',
    candidati: voci.length,
    pubblicate: conta('verificato', 32),
    inRevisione: 1,
    sospese: conta('sospeso', 32),
    duplicate: conta('duplicato', 32),
    attivitaCatalogo: catalogo.attivita.length,
    localitaCatalogo: catalogo.localita.length,
  },
};

writeFileSync(REG, JSON.stringify(registro, null, 1) + '\n');
console.log(JSON.stringify({ aggiunte: nuove.length, totale: registro.candidati.length, fase32: registro.riepilogo.fase32 }));
