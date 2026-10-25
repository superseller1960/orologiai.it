import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory } from '../site/src/lib/search.ts';

// La fusione PR #6 (4 inserimenti Ancona/Pescara + 6 arricchimenti) si verifica sul confronto
// fra lo snapshot precedente alla fusione (commit 3759dcb, 155 attività) e il dataset del lotto
// (snapshot 0c684f1, PR #6 + correzione provincia AO): le asserzioni esatte restano valide senza
// vietare incrementi documentati successivi, come già fatto per FB23, N02 e Toscana-02.
const prima = directorySchema.parse(JSON.parse(execFileSync(
  'git', ['show', '3759dcb4fd7c4e200c6e00790e0f963326259779:site/data/directory.json'],
  { maxBuffer: 16 * 1024 * 1024 },
).toString())) as Directory;
const data = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '0c684f1:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString())) as Directory;
const NUOVI = ['cerescioli-paolo-ancona', 'gibi-shop-ancona', 'satolli-pescara', 'wargas-sisti-ancona'];
const ARRICCHITI = ['bigalli', 'fani-gioielli', 'marretti', 'sangalli', 'scardi', 'senzatempo-firenze'];

test('PR6: 159 attività, tutti i record storici presenti con ID, slug e località invariati', () => {
  assert.equal(data.attivita.length, 159);
  assert.equal(data.localita.length, prima.localita.length + 1, 'solo la nuova località Pescara');
  assert.equal(data.fonti.length, prima.fonti.length + 21, '21 fonti nuove documentate');
  for (const vecchio of prima.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id)!;
    assert.ok(attuale, `record perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug, `slug alterato: ${vecchio.id}`);
    assert.equal(attuale.localitaId, vecchio.localitaId, `località alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.origine, vecchio.origine, `origine alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.posizione, vecchio.posizione, `posizione alterata: ${vecchio.id}`);
    // Le sei schede arricchite cambiano contenuto in modo documentato (registro PR #6);
    // tutte le altre devono restare identiche campo per campo.
    if (!ARRICCHITI.includes(vecchio.id)) assert.deepEqual(attuale, vecchio, `record alterato: ${vecchio.id}`);
  }
  for (const vecchio of prima.fonti) {
    assert.ok(data.fonti.some(f => f.id === vecchio.id), `fonte persa: ${vecchio.id}`);
    assert.deepEqual(data.fonti.find(f => f.id === vecchio.id), vecchio, `fonte alterata: ${vecchio.id}`);
  }
  for (const vecchio of prima.localita) {
    // Correzione documentata (audit di qualità 24/10): la provincia AO aveva due nomi diversi
    // («Aosta» per Courmayeur, «Valle d'Aosta/Vallée d'Aoste» per il capoluogo), spezzando la
    // ricerca per provincia in due filtri separati. La voce di Courmayeur è allineata al nome
    // ufficiale già in uso; ogni altra differenza fallisce come prima.
    const corretto = vecchio.id === 'courmayeur'
      ? { ...vecchio, provincia: "Valle d'Aosta/Vallée d'Aoste", provinciaSlug: 'valle-d-aosta-vallee-d-aoste' }
      : vecchio;
    assert.deepEqual(data.localita.find(l => l.id === vecchio.id), corretto, `località alterata: ${vecchio.id}`);
  }
});

test('PR6: i 4 inserimenti hanno fonti datate, stato verificato e nessun duplicato', () => {
  for (const id of NUOVI) {
    const b = data.attivita.find(x => x.id === id)!;
    assert.ok(b, `manca ${id}`);
    assert.ok(b.attendibilita.fonti.length >= 1, `${id}: senza fonti`);
    assert.ok(b.attendibilita.verificataIl, `${id}: senza data di verifica`);
    assert.ok(b.posizione.indirizzo, `${id}: senza indirizzo`);
    assert.equal(b.posizione.coordinate, null, `${id}: nessuna coordinata inventata`);
    assert.ok(b.contatti.telefono || b.contatti.sito, `${id}: senza recapiti documentati`);
    assert.ok(['ancona', 'pescara'].includes(b.localitaId));
    for (const f of b.attendibilita.fonti.map(fid => data.fonti.find(x => x.id === fid)!)) {
      assert.ok(f.consultataIl <= '2026-10-24', `${id}: fonte consultata nel futuro`);
      assert.ok(['sito-ufficiale', 'marchio-ufficiale'].includes(f.tipo), `${id}: fonte non primaria`);
    }
  }
  assert.equal(findDuplicates(data).filter(d => NUOVI.includes(d.primo) || NUOVI.includes(d.secondo)).length, 0);
});

test('PR6: i 6 arricchimenti aggiungono recapiti e verifiche senza eliminare dati storici', () => {
  for (const id of ARRICCHITI) {
    const vecchio = prima.attivita.find(b => b.id === id)!;
    const attuale = data.attivita.find(b => b.id === id)!;
    assert.ok(vecchio && attuale);
    // Nessun recapito preesistente eliminato o sostituito.
    for (const campo of ['telefono', 'email', 'sito'] as const) {
      if (vecchio.contatti[campo] !== null) assert.equal(attuale.contatti[campo], vecchio.contatti[campo], `${id}: ${campo} alterato`);
    }
    // Nessun servizio o marchio storico rimosso.
    for (const s of vecchio.servizi) assert.ok(attuale.servizi.some(x => x.id === s.id), `${id}: servizio perso ${s.id}`);
    for (const [ruolo, marche] of Object.entries(vecchio.marchi)) {
      for (const m of marche) {
        assert.ok(attuale.marchi[ruolo as keyof typeof attuale.marchi].some(x => x.marca === m.marca), `${id}: marchio perso ${m.marca}`);
      }
    }
    assert.ok((attuale.attendibilita.verificataIl ?? '') >= (vecchio.attendibilita.verificataIl ?? ''), `${id}: verifica arretrata`);
    assert.ok(attuale.attendibilita.cronologia.length > vecchio.attendibilita.cronologia.length, `${id}: cronologia non aggiornata`);
  }
});

test('PR6: ricerca e territori coerenti dopo la fusione', () => {
  const tutti = searchDirectory(data, {}).map(r => r.business.id);
  for (const id of NUOVI) assert.ok(tutti.includes(id), `${id}: assente dalla ricerca`);
  assert.equal(data.attivita.filter(b => b.localitaId === 'pescara').length, 1, 'una scheda a Pescara');
  assert.equal(data.attivita.filter(b => b.localitaId === 'ancona').length, 4, 'tre inserimenti nuovi più la scheda preesistente ad Ancona');
  assert.equal(new Set(data.localita.map(l => l.regioneSlug)).size, 20, 'tutte le 20 regioni');
});
