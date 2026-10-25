import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

// Lotto 2 di arricchimento (25/10/2026): 37 attività esaminate, 33 modificate con dati
// documentati. Confronto con lo snapshot pre-lotto (commit adfbdb0): ogni arricchimento
// è additivo, nessun dato storico sovrascritto o perso.
const prima = directorySchema.parse(JSON.parse(execFileSync('git', ['show', 'adfbdb0:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString())) as Directory;
const data = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8'))) as Directory;

test('L2: 159 attività conservate, posizioni e identità invariate, 37 fonti nuove datate', () => {
  assert.equal(data.attivita.length, 159);
  assert.equal(data.localita.length, prima.localita.length);
  assert.equal(data.fonti.length, prima.fonti.length + 37);
  for (const vecchio of prima.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id)!;
    assert.ok(attuale, `record perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug);
    assert.equal(attuale.localitaId, vecchio.localitaId);
    assert.deepEqual(attuale.posizione, vecchio.posizione, `posizione alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.origine, vecchio.origine);
  }
  for (const f of data.fonti.filter(f => !prima.fonti.some(x => x.id === f.id))) {
    assert.equal(f.consultataIl, '2026-10-25');
    assert.ok(['sito-ufficiale', 'marchio-ufficiale', 'directory'].includes(f.tipo), `fonte non qualificata: ${f.id}`);
  }
  for (const vecchio of prima.fonti) assert.deepEqual(data.fonti.find(f => f.id === vecchio.id), vecchio, `fonte alterata: ${vecchio.id}`);
});

test('L2: arricchimenti additivi: nessun recapito, servizio, marchio o storia storica persi', () => {
  for (const vecchio of prima.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id)!;
    for (const campo of ['telefono', 'email', 'sito', 'whatsapp'] as const) {
      if (vecchio.contatti[campo] !== null) assert.equal(attuale.contatti[campo], vecchio.contatti[campo], `${vecchio.id}: ${campo} sovrascritto`);
    }
    for (const s of vecchio.servizi) assert.ok(attuale.servizi.some(x => x.id === s.id), `${vecchio.id}: servizio perso ${s.id}`);
    for (const [ruolo, marche] of Object.entries(vecchio.marchi)) {
      for (const m of marche) assert.ok(attuale.marchi[ruolo as keyof typeof attuale.marchi].some(x => x.marca === m.marca), `${vecchio.id}: marchio perso ${m.marca}`);
    }
    if (vecchio.storia.testo !== null) assert.equal(attuale.storia.testo, vecchio.storia.testo, `${vecchio.id}: storia alterata`);
    if (JSON.stringify(attuale) !== JSON.stringify(vecchio)) {
      assert.ok(attuale.attendibilita.cronologia.length > vecchio.attendibilita.cronologia.length, `${vecchio.id}: cronologia non aggiornata`);
    }
  }
});

test('L2: orari e recapiti nuovi hanno fonti e verifiche', () => {
  for (const b of data.attivita) {
    const v = prima.attivita.find(x => x.id === b.id)!;
    if (b.orari.giorni.length > v.orari.giorni.length) {
      assert.equal(b.orari.verificatiIl, '2026-10-25', `${b.id}: orari senza data`);
      assert.ok(b.orari.fonti.length > 0, `${b.id}: orari senza fonti`);
    }
    if ((b.contatti.telefono !== v.contatti.telefono) || (b.contatti.email !== v.contatti.email) || (b.contatti.sito !== v.contatti.sito)) {
      assert.ok(b.contatti.fonti.length > 0, `${b.id}: recapito nuovo senza fonte`);
    }
    for (const s of b.servizi) for (const id of s.fonti) assert.ok(data.fonti.some(f => f.id === id), `${b.id}: fonte servizio inesistente ${id}`);
  }
});

test('L2: solo le autorizzazioni ufficiali documentate dai marchi sono state aggiunte', () => {
  const nuoveAssistenze = data.attivita.flatMap(b => b.marchi.assistenzaUfficiale
    .filter(c => !prima.attivita.find(x => x.id === b.id)!.marchi.assistenzaUfficiale.some(o => o.marca === c.marca))
    .map(c => `${b.id}:${c.marca}`)).sort();
  // I due centri Hamilton (Law & Watch, D’Ale) risultavano già documentati nel lotto precedente:
  // il lotto 2 non aggiunge nuove assistenze ufficiali, le sole già presenti restano con fonte del marchio.
  assert.deepEqual(nuoveAssistenze, []);
  for (const b of data.attivita) {
    for (const c of [...b.marchi.assistenzaUfficiale, ...b.marchi.rivenditaUfficiale]) {
      assert.ok(c.fonti.some(id => data.fonti.find(f => f.id === id)?.tipo === 'marchio-ufficiale'), `${b.id}: ${c.marca} senza fonte del marchio`);
    }
  }
});
