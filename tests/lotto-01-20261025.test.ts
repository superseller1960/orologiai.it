import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { directorySchema, type Directory } from '../site/src/lib/schema.ts';

// Lotto 1 di arricchimento (25/10/2026): 20 attività esaminate, 16 modificate con dati
// documentati da fonti ufficiali. Il confronto con lo snapshot pre-lotto (commit 56ded1c)
// garantisce che ogni arricchimento sia additivo: nessun dato storico sovrascritto o perso.
const prima = directorySchema.parse(JSON.parse(execFileSync('git', ['show', '56ded1c:site/data/directory.json'], { maxBuffer: 16 * 1024 * 1024 }).toString())) as Directory;
const data = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8'))) as Directory;
const MODIFICATI = ['renai-pontassieve', 'spaziotempo-sanminiato', 'ronchi-gioielli', 'murgia-cagliari', 'l-angolo-delle-ore-novara', 'gioielleria-gaddi-zucchi-novara', 'gioielleria-simonini-vercelli', 'orsi-gioielleria-verbania', 'gioielleria-bisio-asti', 'gioielleria-fontana-varese', 'fasola-gioielleria-como', 'de-pascalis-spa-lecco', 'florio-folini-srl-sondrio', 'gioielleria-la-marca-vittorio-pavia', 'gioiellerie-torelli-cremona', 'gioielleria-angelini-srl-monza'];

test('L1: 159 attività conservate, ID/slug/località/posizioni invariati, 30 fonti nuove datate', () => {
  assert.equal(data.attivita.length, 159);
  assert.equal(data.localita.length, prima.localita.length);
  assert.equal(data.fonti.length, prima.fonti.length + 30);
  for (const vecchio of prima.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id)!;
    assert.ok(attuale, `record perso: ${vecchio.id}`);
    assert.equal(attuale.slug, vecchio.slug, `slug alterato: ${vecchio.id}`);
    assert.equal(attuale.localitaId, vecchio.localitaId, `località alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.posizione, vecchio.posizione, `posizione alterata: ${vecchio.id}`);
    assert.deepEqual(attuale.origine, vecchio.origine, `origine alterata: ${vecchio.id}`);
  }
  const nuove = data.fonti.filter(f => !prima.fonti.some(x => x.id === f.id));
  assert.equal(nuove.length, 30);
  for (const f of nuove) {
    assert.equal(f.consultataIl, '2026-10-25');
    assert.ok(['sito-ufficiale', 'marchio-ufficiale'].includes(f.tipo), `fonte non primaria: ${f.id}`);
    assert.match(f.url, /^https?:\/\//);
  }
  for (const vecchio of prima.fonti) assert.deepEqual(data.fonti.find(f => f.id === vecchio.id), vecchio, `fonte alterata: ${vecchio.id}`);
});

test('L1: gli arricchimenti sono additivi, ogni dato storico resta intatto', () => {
  for (const vecchio of prima.attivita) {
    const attuale = data.attivita.find(b => b.id === vecchio.id)!;
    for (const campo of ['telefono', 'email', 'sito', 'whatsapp'] as const) {
      if (vecchio.contatti[campo] !== null) assert.equal(attuale.contatti[campo], vecchio.contatti[campo], `${vecchio.id}: ${campo} sovrascritto`);
    }
    if (vecchio.contatti.social.length) assert.deepEqual(attuale.contatti.social, vecchio.contatti.social, `${vecchio.id}: social sovrascritti`);
    for (const s of vecchio.servizi) assert.ok(attuale.servizi.some(x => x.id === s.id), `${vecchio.id}: servizio perso ${s.id}`);
    for (const [ruolo, marche] of Object.entries(vecchio.marchi)) {
      for (const m of marche) assert.ok(attuale.marchi[ruolo as keyof typeof attuale.marchi].some(x => x.marca === m.marca), `${vecchio.id}: marchio perso ${m.marca}`);
    }
    if (vecchio.storia.testo !== null) assert.equal(attuale.storia.testo, vecchio.storia.testo, `${vecchio.id}: storia alterata`);
    assert.ok(attuale.attendibilita.cronologia.length >= vecchio.attendibilita.cronologia.length, `${vecchio.id}: cronologia persa`);
  }
});

test('L1: solo le 16 attività del lotto risultano modificate', () => {
  const modificati = prima.attivita.filter(v => {
    const a = data.attivita.find(b => b.id === v.id)!;
    return JSON.stringify(a) !== JSON.stringify(v);
  }).map(b => b.id).sort();
  assert.deepEqual(modificati, [...MODIFICATI].sort());
});

test('L1: orari e nuovi recapiti hanno fonti e verifiche coerenti', () => {
  for (const id of MODIFICATI) {
    const b = data.attivita.find(x => x.id === id)!;
    const v = prima.attivita.find(x => x.id === id)!;
    if (b.orari.giorni.length > v.orari.giorni.length) {
      assert.equal(b.orari.verificatiIl, '2026-10-25', `${id}: orari senza data`);
      assert.ok(b.orari.fonti.length > 0, `${id}: orari senza fonti`);
    }
    if (b.contatti.telefono !== v.contatti.telefono || b.contatti.email !== v.contatti.email) {
      assert.ok(b.contatti.fonti.length > v.contatti.fonti.length, `${id}: recapito nuovo senza fonte`);
    }
  }
  const ronchi = data.attivita.find(b => b.id === 'ronchi-gioielli')!;
  assert.equal(ronchi.attendibilita.stato, 'fonti-verificate');
  assert.equal(ronchi.attendibilita.verificataIl, '2026-10-25');
  assert.equal(ronchi.contatti.telefono, '+39 02 877449');
});

test('L1: rivendite ufficiali solo con fonte del marchio; nessuna assistenza ufficiale inventata', () => {
  const fonte = (id: string) => data.fonti.find(f => f.id === id)!;
  for (const b of data.attivita) {
    for (const c of b.marchi.rivenditaUfficiale) {
      assert.ok(c.fonti.some(id => fonte(id).tipo === 'marchio-ufficiale'), `${b.id}: rivendita ${c.marca} senza fonte del marchio`);
    }
  }
  const nuoveRivendite = data.attivita.flatMap(b => b.marchi.rivenditaUfficiale.filter(c => !prima.attivita.find(x => x.id === b.id)!.marchi.rivenditaUfficiale.some(o => o.marca === c.marca)).map(c => `${b.id}:${c.marca}`)).sort();
  assert.deepEqual(nuoveRivendite, [
    'gioielleria-angelini-srl-monza:Hamilton', 'gioielleria-angelini-srl-monza:Longines', 'gioielleria-angelini-srl-monza:Omega',
    'gioielleria-bisio-asti:Longines', 'gioielleria-gaddi-zucchi-novara:Longines', 'gioiellerie-torelli-cremona:Omega',
  ]);
  // Nessuna nuova assistenza ufficiale: le dichiarazioni «riparatore ufficiale» dei siti delle
  // attività non sono fonti del marchio e non diventano autorizzazioni.
  for (const b of data.attivita) {
    const v = prima.attivita.find(x => x.id === b.id)!;
    assert.equal(b.marchi.assistenzaUfficiale.length, v.marchi.assistenzaUfficiale.length, `${b.id}: assistenza ufficiale aggiunta senza fonte del marchio`);
  }
});
