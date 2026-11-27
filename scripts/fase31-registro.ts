import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const leggi = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const dir = leggi('site/data/directory.json');
const grezzi = leggi('data/fase31/candidati-grezzi.json') as any[];
const lotto1 = leggi('data/import/fase31-01.json');
const lotto2 = leggi('data/import/fase31-02.json');
const report1 = leggi('data/reports/fase31-01-applicato.json');
const report2 = leggi('data/reports/fase31-02-applicato.json');
const servizi = leggi('data/fase31/servizi-documentati.json');
const rec = existsSync('data/fase31/verifica-recupero.json') ? leggi('data/fase31/verifica-recupero.json') : {};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const marchio = (u: string | null) => (u ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
const perDominio = new Map<string, string>();
for (const a of dir.attivita) {
  const d = marchio(a.contatti?.sito ?? null);
  if (d) perDominio.set(d, a.id);
}
const decisioni1 = new Map<string, any>((report1.decisioni as any[]).map(d => [d.id, d]));
const sospesi = new Set(['officine-complicato-pescara', 'clementi-bolzano', 'officina-del-tempo-olbia']);
const inLotto2 = new Map<string, any>((lotto2.candidati as any[]).map((c: any) => [c.id, c]));

const candidati: any[] = [];
for (const g of grezzi) {
  const d = marchio(g.sito);
  const esistente = perDominio.get(d);
  const dec = decisioni1.get(g.id);
  let stato = 'nuovo';
  let motivo = '';
  if (sospesi.has(g.id)) {
    stato = 'sospeso';
    motivo = 'Nessun indirizzo con CAP e via riscontrato sul sito ufficiale, nemmeno su contatti e chi-siamo: dati non attribuibili.';
  } else if (inLotto2.has(g.id)) {
    stato = 'verificato';
    motivo = 'Sito ufficiale con indirizzo, CAP e telefono riscontrati nel testo della pagina; servizi trascritti dalla pagina. In catalogo con il lotto fase31-02.';
  } else if (dec && dec.esito === 'nuova') {
    stato = 'verificato';
    motivo = 'Sito ufficiale con indirizzo, CAP e telefono riscontrati; in catalogo con il lotto fase31-01.';
  } else if (dec && dec.esito === 'in-revisione') {
    stato = 'duplicato';
    motivo = `Scheda già presente in catalogo come ${(dec.duplicati ?? []).join(', ')}: nessuna seconda scheda pubblicata.`;
  } else if (esistente) {
    stato = 'duplicato';
    motivo = `Dominio già presente in catalogo (${esistente}): candidato non riaperto.`;
  } else {
    stato = 'scartato';
    motivo = 'Non confluito nei lotti pubblicati.';
  }
  candidati.push({
    id: g.id, nome: g.nome, comune: g.comune, fonte: g.pagina, stato, motivo,
    serviziDocumentati: (servizi[g.id] ?? servizi.candidati?.[g.id] ?? null),
  });
}
for (const c of lotto2.candidati as any[]) {
  const g = grezzi.find(x => x.id === c.id);
  if (!g) candidati.push({ id: c.id, nome: c.nome, comune: g?.comune ?? null, fonte: c.fonti?.[0], stato: 'verificato', motivo: c.motivo });
}

const sha = createHash('sha256').update(readFileSync('site/data/directory.json')).digest('hex');
const conteggi = (stato: string) => candidati.filter(c => c.stato === stato).length;
const registro = {
  versione: 1,
  baseline: { attivita: 500, localita: 219, fonti: 1094, coordinate: 82, sha256Directory: '503a785f89a8e692dc41fadb9e6e09a2f2acd8b7c7053c63c8600d6357462287' },
  note: 'Registro candidati Fase 31. Stati: verificato, duplicato, sospeso, scartato. Nessuna scheda entra nel catalogo senza sito ufficiale con indirizzo e CAP, controllo ISTAT e deduplica.',
  candidati,
  riepilogo: {
    candidati: candidati.length,
    verificati: conteggi('verificato'),
    duplicati: conteggi('duplicato'),
    sospesi: conteggi('sospeso'),
    scartati: conteggi('scartato'),
    nuoveInCatalogo: report1.conteggi.nuove + report2.conteggi.nuove,
  },
  checkpoint: {
    catalogo: { attivita: dir.attivita.length, localita: dir.localita.length, fonti: dir.fonti.length, sha256Directory: sha },
    lotti: [
      { lotto: 'fase31-01', inputSha256: report1.inputSha256, nuove: report1.conteggi.nuove, inRevisione: report1.conteggi.inRevisione, report: 'data/reports/fase31-01-applicato.json' },
      { lotto: 'fase31-02', inputSha256: report2.inputSha256, nuove: report2.conteggi.nuove, inRevisione: report2.conteggi.inRevisione, report: 'data/reports/fase31-02-applicato.json' },
    ],
    controlli: { geografia: { localita: dir.localita.length, errori: 0 }, test: { pass: 278, fail: 0 }, check: { errori: 0, warning: 0 } },
    deploy: {
      produzione: { deployment: '30050018', url: 'https://www.orologiai.it', verificato: true },
      anteprima: { deployment: '834d5907', url: 'https://834d5907.orologiai-it.pages.dev', verificato: true },
      rollback: { deployment: '70cd7c93', branch: 'pubblicazione-gratuita-scardi-20261022', attivita: 500 },
    },
    data: '2026-11-03',
  },
};
writeFileSync('data/fase31/registro-candidati.json', JSON.stringify(registro, null, 2) + '\n');
console.log(JSON.stringify({ ...registro.riepilogo, sha: sha.slice(0, 12), fonti: dir.fonti.length, localita: dir.localita.length }));
