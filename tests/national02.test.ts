import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { directorySchema } from '../site/src/lib/schema.ts';
import { integrateReviewedBatch } from '../site/src/lib/reviewed-import.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory, type SearchFilters } from '../site/src/lib/search.ts';

const base = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '2a207dfd006c2729c774743889888c5e736e3f25:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()));
// Il lotto N02 si verifica sul proprio snapshot (commit 3759dcb): le asserzioni esatte restano
// valide senza vietare incrementi successivi, come già fatto per FB23 sullo snapshot PR5.
const data = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '3759dcb4fd7c4e200c6e00790e0f963326259779:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString()));
const letters = ['a', 'b', 'c', 'd'].filter(k => existsSync(`data/reports/national02-${k}-applied.json`));
const batches = letters.map(k => JSON.parse(readFileSync(`data/import/national02-${k}-reviewed.json`, 'utf8')));
const fresh = data.attivita.filter(b => !base.attivita.some(x => x.id === b.id));
const found = (f: SearchFilters) => searchDirectory(data, f).map(r => r.business.id);

test('N02: lotti applicati riproducibili, conteggio esatto e originali immutati', () => {
  assert.ok(letters.length > 0);
  let reconstructed = base;
  let expected = 106;
  for (const batch of batches) {
    const imported = integrateReviewedBatch(reconstructed, batch);
    assert.equal(imported.report.conteggi.nuove, batch.candidati.filter((c: { decisione: string }) => c.decisione === 'approvata').length);
    assert.equal(imported.report.conteggi.duplicatiRilevati, 0);
    expected += imported.report.conteggi.nuove;
    reconstructed = imported.directory;
    assert.deepEqual(integrateReviewedBatch(reconstructed, batch).directory, reconstructed);
  }
  assert.equal(data.attivita.length, expected);
  assert.deepEqual(data, reconstructed);
  for (const field of ['attivita', 'localita', 'fonti'] as const) {
    for (const old of base[field]) assert.deepEqual(data[field].find(x => x.id === old.id), old);
  }
});

test('N02: zero nuovi duplicati, fonti primarie datate e nessun punto mappa aggiunto', () => {
  const ids = new Set(fresh.map(b => b.id));
  assert.deepEqual(findDuplicates(data).filter(d => ids.has(d.primo) || ids.has(d.secondo)), []);
  const sourceUrls = base.fonti.map(s => s.url);
  for (const s of data.fonti.filter(s => !base.fonti.some(old => old.id === s.id))) {
    assert.ok(!sourceUrls.includes(s.url)); sourceUrls.push(s.url);
    assert.equal(s.consultataIl, '2026-10-23');
    assert.ok(['sito-ufficiale', 'marchio-ufficiale'].includes(s.tipo));
  }
  for (const b of fresh) {
    assert.equal(b.posizione.coordinate, null);
    assert.ok(b.posizione.indirizzo);
    assert.equal(b.attendibilita.verificataIl, '2026-10-23');
    for (const claim of [...b.marchi.rivenditaUfficiale, ...b.marchi.assistenzaUfficiale]) assert.ok(claim.fonti.some(id => data.fonti.find(s => s.id === id)?.tipo === 'marchio-ufficiale'));
  }
});

test('N02: ogni nuova scheda è ricercabile solo nei territori, tipi, servizi e marchi documentati', () => {
  for (const b of fresh) {
    const p = data.localita.find(p => p.id === b.localitaId)!;
    for (const f of [{ q: b.nome }, { localita: p.id }, { provincia: p.provinciaSlug }, { regione: p.regioneSlug }]) assert.ok(found(f).includes(b.id));
    assert.deepEqual(found({ localita: p.id, regione: p.regioneSlug === 'lazio' ? 'toscana' : 'lazio' }), found({ localita: p.id }), 'Fase12: la città prevale sul vecchio vincolo regionale');
    for (const tipo of b.tipi) assert.ok(found({ localita: p.id, tipo }).includes(b.id));
    for (const s of b.servizi) assert.ok(found({ localita: p.id, servizio: s.id }).includes(b.id));
    if (b.servizi.length === 1 && b.servizi[0].id === 'vendita') {
      for (const servizio of ['riparazione', 'revisione', 'restauro-vintage', 'batterie', 'pendoleria']) assert.ok(!found({ localita: p.id, servizio }).includes(b.id));
    }
    for (const ruoloMarca of ['venduti', 'riparati', 'assistenzaUfficiale', 'rivenditaUfficiale'] as const) {
      for (const m of b.marchi[ruoloMarca]) assert.ok(found({ marca: m.marca, ruoloMarca }).includes(b.id));
    }
  }
  assert.deepEqual(found({ localita: 'localita-non-censita-national02' }), []);
});

test('N02: nuove schede e comuni hanno SEO, sitemap e navigazione coerenti', () => {
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  for (const b of fresh) {
    const p = data.localita.find(p => p.id === b.localitaId)!;
    const businessPath = `/orologeria/${b.slug}/`;
    const localityPath = `/orologerie/${p.regioneSlug}/${p.provinciaSlug}/${p.comuneSlug}/`;
    for (const path of [businessPath, localityPath]) {
      const doc = new JSDOM(readFileSync(`dist${path}index.html`, 'utf8')).window.document;
      assert.ok(doc.title); assert.ok(doc.querySelector('meta[name="description"]')?.getAttribute('content'));
      assert.equal(doc.querySelectorAll('h1').length, 1);
      assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), `https://www.orologiai.it${path}`);
      assert.ok(sitemap.includes(`https://www.orologiai.it${path}`));
      for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) JSON.parse(script.textContent!);
    }
    for (const path of [localityPath, `/orologerie/${p.regioneSlug}/`, ...b.servizi.map(s => `/servizi/${s.id}/`)]) {
      const doc = new JSDOM(readFileSync(`dist${path}index.html`, 'utf8')).window.document;
      assert.ok(Array.from(doc.querySelectorAll('a[href]')).some(a => a.getAttribute('href') === businessPath), `${b.id} assente da ${path}`);
    }
  }
});
