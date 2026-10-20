import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { directorySchema } from '../site/src/lib/schema.ts';
import { coverageReport, integrateReviewedBatch, reviewedBatchSchema } from '../site/src/lib/reviewed-import.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

const base = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '089a56752cc0fe830290383a06145ffc88f581e1:site/data/directory.json'], { encoding: 'utf8' })));
const batch = reviewedBatchSchema.parse(JSON.parse(await readFile('data/import/lazio-07b-reviewed.json', 'utf8')));
const snapshot = JSON.stringify(base);
const prova = () => structuredClone(batch);

test('07B: dieci attività verificate integrate senza modificare i dati preesistenti', () => {
  const r = integrateReviewedBatch(base, batch);
  assert.equal(r.report.conteggi.nuove, 10);
  assert.equal(r.report.prima.attivita, 35);
  assert.equal(r.report.dopo.attivita, 45);
  assert.equal(r.report.dopo.regioni.length, 3);
  assert.equal(r.report.dopo.comuni.length, 22);
  for (const campo of ['attivita', 'localita', 'fonti'] as const) {
    for (const b of base[campo]) assert.deepEqual(r.directory[campo].find(x => x.id === b.id), b);
  }
  assert.equal(JSON.stringify(base), snapshot, 'la funzione non muta il parametro');
});

test('07B: candidati incompleti e fuori lotto non sono schede pubbliche', () => {
  const r = integrateReviewedBatch(base, batch);
  assert.equal(r.report.conteggi.inRevisione, 2);
  assert.equal(r.report.conteggi.scartate, 1);
  for (const c of batch.candidati.filter(c => c.decisione !== 'approvata')) {
    assert.ok(!r.directory.attivita.some(b => b.id === c.id));
  }
});

test('07B: riapplicare un lotto è idempotente', () => {
  const prima = integrateReviewedBatch(base, batch).directory;
  const seconda = integrateReviewedBatch(prima, batch);
  assert.equal(seconda.report.conteggi.nuove, 0);
  assert.equal(seconda.report.conteggi.giaPresenti, 10);
  assert.deepEqual(seconda.directory, prima);
});

test('07B: stesso ID con dati diversi va in revisione e conserva l’originale', () => {
  const prima = integrateReviewedBatch(base, batch).directory;
  const cambiato = prova();
  cambiato.candidati[0].attivita!.descrizione = 'Modifica sintetica da revisionare.';
  const r = integrateReviewedBatch(prima, cambiato);
  assert.equal(r.report.conteggi.aggiornate, 0);
  assert.equal(r.report.decisioni[0].esito, 'in-revisione');
  assert.deepEqual(r.directory, prima);
});

test('07B: una scheda con nuovo ID ma stessi recapiti non genera un duplicato', () => {
  const duplicato = prova();
  const originale = structuredClone(duplicato.candidati[0]);
  originale.id += '-secondo';
  originale.attivita!.id = originale.id;
  originale.attivita!.slug = originale.id;
  duplicato.candidati.push(originale);
  const r = integrateReviewedBatch(base, duplicato);
  assert.equal(r.report.conteggi.nuove, 10);
  assert.equal(r.report.conteggi.duplicatiRilevati, 1);
  assert.equal(r.report.decisioni.at(-1)!.esito, 'in-revisione');
});

test('07B: nessun trasferimento con fonte mancante', () => {
  const errato = prova();
  errato.candidati[0].attivita!.servizi[0].fonti = ['fonte-inesistente'];
  assert.throws(() => integrateReviewedBatch(base, errato), /fonte primaria|fonte assente/i);
  assert.equal(JSON.stringify(base), snapshot);
});

test('07B: un servizio basato solo su una directory di terzi non è ammesso', () => {
  const errato = prova();
  errato.candidati[0].attivita!.servizi[0].fonti = ['l07-horology-revisione'];
  assert.throws(() => integrateReviewedBatch(base, errato), /servizio senza fonte primaria/);
});

test('07B: autorizzazioni richiedono una fonte del marchio anche nei lotti nazionali', () => {
  const errato = prova();
  errato.candidati[0].attivita!.marchi.assistenzaUfficiale = [{ marca: 'Rolex', fonti: ['l07-salamena'] }];
  assert.throws(() => integrateReviewedBatch(base, errato), /autorizzazione ufficiale senza fonte del marchio/);
});

test('07B: una località o fonte esistente non viene sovrascritta', () => {
  const errato = prova();
  errato.localita.push({ ...base.localita[0], descrizione: 'Dato in conflitto' });
  assert.throws(() => integrateReviewedBatch(base, errato), /Località esistente in conflitto/);
  const fonte = prova();
  fonte.fonti.push({ ...base.fonti[0], titolo: 'Fonte cambiata', evidenza: 'Conflitto di test.' });
  assert.throws(() => integrateReviewedBatch(base, fonte), /Fonte esistente in conflitto/);
});

test('07B: la data della fonte non può essere successiva alla verifica', () => {
  const errato = prova();
  errato.fonti[0].consultataIl = '2027-01-01';
  assert.throws(() => integrateReviewedBatch(base, errato), /fonte assente o verificata nel futuro/);
});

test('07B: ricerca effettiva per Roma, provincia di Viterbo e Lazio', () => {
  const d = integrateReviewedBatch(base, batch).directory;
  assert.equal(searchDirectory(d, { regione: 'lazio' }).length, 10);
  assert.equal(searchDirectory(d, { provincia: 'viterbo' }).length, 4);
  const batterie = searchDirectory(d, { localita: 'roma', servizio: 'batterie' });
  assert.ok(batterie.some(b => b.business.id === 'salamena-roma'));
  assert.ok(batterie.some(b => b.business.id === 'casa-cronometro-roma'));
  assert.ok(!batterie.some(b => b.business.id === 'emporio-roma'), 'nessuna batteria dedotta dalla sola riparazione');
  assert.equal(searchDirectory(d, { marca: 'Rolex', ruoloMarca: 'rivenditaUfficiale', regione: 'lazio' })[0].business.id, 'brusaporci-latina');
});

test('07B: coordinate assenti restano assenti e il report mostra contatti e copertura reale', () => {
  const d = integrateReviewedBatch(base, batch).directory;
  assert.equal(coverageReport(d).coordinateValide, 4);
  assert.deepEqual(coverageReport(d).perRegione, { Lazio: 10, Lombardia: 3, Toscana: 32 });
  for (const b of d.attivita.filter(b => b.origine.sistema === 'ricerca-ufficiale-lazio-07b')) {
    assert.equal(b.posizione.coordinate, null);
    assert.ok(b.contatti.telefono && b.contatti.sito);
    assert.equal(b.orari.giorni.length, 0);
  }
});

test('07B: CLI anteprima senza scritture, applicazione e riapplicazione senza duplicati', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'orologiai-reviewed-'));
  const script = resolve('scripts/integrate-reviewed-batch.ts');
  const input = resolve('data/import/lazio-07b-reviewed.json');
  const path = join(cwd, 'site/data/directory.json');
  const run = (args: string[]) => JSON.parse(execFileSync(process.execPath, ['--import', import.meta.resolve('tsx'), script, '--input', input, ...args], { cwd, encoding: 'utf8', stdio: 'pipe' }));
  try {
    await mkdir(join(cwd, 'site/data'), { recursive: true });
    const original = JSON.stringify(base, null, 2) + '\n';
    await writeFile(path, original);
    assert.equal(run([]).applicato, false);
    assert.equal(await readFile(path, 'utf8'), original);
    assert.equal(run(['--apply', '--report', 'data/reports/primo.json']).conteggi.nuove, 10);
    const dopo = await readFile(path, 'utf8');
    assert.equal(JSON.parse(dopo).attivita.length, 45);
    assert.equal(run(['--apply']).conteggi.giaPresenti, 10);
    assert.equal(await readFile(path, 'utf8'), dopo);
    assert.throws(() => run(['--apply', '--report', 'data/reports/primo.json']));
    assert.equal(await readFile(path, 'utf8'), dopo);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
