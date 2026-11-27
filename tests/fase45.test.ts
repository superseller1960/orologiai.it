import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { directorySchema } from '../site/src/lib/schema.ts';
import { titoloScheda } from '../site/src/lib/business-presentation.ts';

const dir = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));

test('Fase 45: il titolo della scheda non ripete il comune già contenuto nel nome', () => {
  const place = new Map(dir.localita.map(l => [l.id, l]));
  for (const b of dir.attivita) {
    const comune = place.get(b.localitaId)!.comune;
    const titolo = titoloScheda(b, comune);
    const occorrenze = titolo.toLowerCase().split(comune.toLowerCase()).length - 1;
    const nelNome = b.nome.toLowerCase().split(comune.toLowerCase()).length - 1;
    // I nomi ufficiali possono citare la città più volte (es. «Assistenza Orologi Torino»):
    // il generatore non deve aggiungerne un'occorrenza in più.
    assert.ok(occorrenze <= Math.max(1, nelNome), `${b.id}: comune ripetuto nel titolo «${titolo}»`);
    assert.ok(titolo.includes(b.nome.trim()), `${b.id}: il titolo non conserva il nome ufficiale`);
    assert.ok(!/—\s*$/.test(titolo), `${b.id}: titolo con separatore sospeso`);
  }
  const dival = dir.attivita.find(b => b.id === 'dival-orologi-milano')!;
  assert.equal(titoloScheda(dival, 'Milano'), 'Dival Orologi — Milano');
});

test('Fase 45: le nuove schede hanno sede e fonti verificabili, senza servizi promossi d’ufficio', () => {
  const place = new Map(dir.localita.map(l => [l.id, l]));
  for (const id of ['watch-clock-milano']) {
    const b = dir.attivita.find(x => x.id === id);
    assert.ok(b, `${id}: scheda assente`);
    assert.ok(b.posizione.indirizzo && b.posizione.cap, `${id}: sede incompleta`);
    assert.ok(b.posizione.fonti.length > 0 && b.attendibilita.fonti.length > 0, `${id}: fonti assenti`);
    assert.ok(place.has(b.localitaId), `${id}: località inesistente`);
    assert.equal(b.attendibilita.stato, 'da-verificare');
    const evidenze = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')).evidenze as { attivitaId: string; servizio: string; stato: string; estratto: string }[];
    for (const e of evidenze.filter(e => e.attivitaId === id && e.stato === 'confermata')) {
      assert.ok(e.estratto.trim().length >= 40, `${id}/${e.servizio}: prova senza estratto`);
    }
  }
  assert.equal(new Set(dir.attivita.map(b => b.id)).size, dir.attivita.length);
});

test('Fase 45: ogni coordinata pubblicata ha provenienza, data e indirizzo confrontato', () => {
  for (const b of dir.attivita) {
    const c = b.posizione.coordinate;
    if (!c) continue;
    assert.ok(c.provenienza, `${b.id}: provenienza assente`);
    assert.ok(c.verificataIl, `${b.id}: data assente`);
    if (c.stato === 'verificata') {
      assert.ok(c.indirizzoConfrontato, `${b.id}: indirizzo non confrontato`);
      assert.ok(c.fonti.length > 0, `${b.id}: fonte della coordinata assente`);
    }
  }
});
