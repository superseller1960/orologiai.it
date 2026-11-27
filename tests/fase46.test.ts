import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { directorySchema } from '../site/src/lib/schema.ts';
import { titoloScheda } from '../site/src/lib/business-presentation.ts';

// Fase 46 — scheda premium di Ciardi, Firenze. Le autorizzazioni valgono solo
// per i ruoli pubblicati dalle directory ufficiali dei singoli marchi.
const dir = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const b = dir.attivita.find(x => x.id === 'ciardi-firenze');
const fonte = (id: string) => {
  const f = dir.fonti.find(x => x.id === id);
  assert.ok(f, `Fonte assente: ${id}`);
  return f;
};

test('Fase 46: Ciardi è una sola scheda a Firenze, con sede e contatti verificati', () => {
  assert.ok(b, 'Scheda Ciardi assente');
  assert.equal(dir.attivita.filter(x => x.slug === 'ciardi-firenze').length, 1);
  assert.equal(dir.attivita.length, 561);
  assert.equal(dir.attivita.filter(x => x.localitaId === 'firenze').length, 19);
  assert.equal(b!.nome, 'Ciardi — Laboratorio di alta orologeria');
  assert.equal(titoloScheda(b!, 'Firenze'), 'Ciardi — Laboratorio di alta orologeria — Firenze');
  assert.equal(b!.localitaId, 'firenze');
  assert.equal(b!.posizione.indirizzo, 'Via delle Belle Donne 3');
  assert.equal(b!.posizione.cap, '50123');
  assert.equal(b!.contatti.telefono, '+39 055 217900');
  assert.equal(b!.contatti.email, 'sav@ciardiorologi.it');
  assert.equal(b!.contatti.sito, null, 'Nessun sito è stato verificato: non va inventato');
  assert.ok(b!.posizione.fonti.length > 0 && b!.contatti.fonti.length > 0);
});

test('Fase 46: gli orari sono quelli pubblicati da IWC e Baume & Mercier', () => {
  assert.deepEqual(b!.orari.giorni.map(g => g.giorno), [1, 2, 3, 4, 5, 6, 7]);
  for (const giorno of [1, 2, 3, 4, 5]) {
    assert.deepEqual(b!.orari.giorni.find(g => g.giorno === giorno)!.intervalli, [{ apertura: '08:30', chiusura: '17:00' }]);
  }
  for (const giorno of [6, 7]) assert.deepEqual(b!.orari.giorni.find(g => g.giorno === giorno)!.intervalli, []);
  assert.equal(b!.orari.verificatiIl, '2026-11-27');
  assert.ok(b!.orari.fonti.includes('f46-ciardi-iwc') && b!.orari.fonti.includes('f46-ciardi-bm'));
});

test('Fase 46: quattro assistenze ufficiali e Panerai solo come rivendita', () => {
  const assistenza = new Map(b!.marchi.assistenzaUfficiale.map(m => [m.marca, m.fonti]));
  assert.deepEqual([...assistenza.keys()].sort(), ['Baume & Mercier', 'IWC', 'Jaeger-LeCoultre', 'Vulcain']);
  for (const [marca, fonti] of assistenza) {
    assert.ok(fonti.length > 0, `${marca}: fonte assente`);
    for (const id of fonti) assert.equal(fonte(id).tipo, 'marchio-ufficiale', `${marca}: fonte non ufficiale`);
  }
  assert.deepEqual(b!.marchi.rivenditaUfficiale.map(m => m.marca), ['Panerai']);
  assert.equal(fonte(b!.marchi.rivenditaUfficiale[0].fonti[0]).tipo, 'marchio-ufficiale');
  assert.ok(!b!.marchi.assistenzaUfficiale.some(m => m.marca === 'Panerai'), 'Panerai non è un centro assistenza nella fonte');
  assert.deepEqual(b!.marchi.venduti, []);
});

test('Fase 46: la coordinata è geocodificata e confrontata con l’indirizzo', () => {
  const c = b!.posizione.coordinate;
  assert.ok(c);
  assert.equal(c!.lat, 43.7722403);
  assert.equal(c!.lon, 11.2505794);
  assert.equal(c!.provenienza, 'geocodifica-osm');
  assert.equal(c!.stato, 'verificata');
  assert.equal(c!.verificataIl, '2026-11-27');
  assert.equal(c!.indirizzoConfrontato, 'Via delle Belle Donne 3, 50123 Firenze (FI)');
  assert.deepEqual(c!.fonti, ['f46-ciardi-geo']);
  assert.equal(fonte('f46-ciardi-geo').tipo, 'osm');
});

test('Fase 46: ogni servizio pubblicato ha una citazione confermata', () => {
  const registro = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')) as {
    evidenze: { attivitaId: string; servizio: string; fonteId: string; url: string; estratto: string; stato: string; tipoFonte: string }[];
  };
  const servizi = b!.servizi.map(s => s.id).sort();
  assert.deepEqual(servizi, ['assistenza', 'cinturini', 'manutenzione', 'riparazione']);
  for (const servizio of servizi) {
    const prova = registro.evidenze.find(e => e.attivitaId === 'ciardi-firenze' && e.servizio === servizio);
    assert.ok(prova, `${servizio}: evidenza assente`);
    assert.equal(prova!.stato, 'confermata', `${servizio}: prova non confermata`);
    assert.ok(prova!.estratto.length >= 40, `${servizio}: estratto troppo breve`);
    assert.equal(prova!.tipoFonte, 'marchio-ufficiale');
    assert.equal(prova!.url, fonte(prova!.fonteId).url);
  }
});

test('Fase 46: nessuna storia, certificazione o recensione inventata', () => {
  assert.equal(b!.storia.annoFondazione, null);
  assert.equal(b!.storia.fondatore, null);
  assert.equal(b!.storia.testo, null);
  assert.deepEqual(b!.storia.eventi, []);
  assert.deepEqual(b!.storia.fonti, []);
  assert.equal(b!.attendibilita.confermataTitolareIl, null);
  assert.deepEqual(b!.attendibilita.segnalazioni, []);
  assert.ok(!/certificat|recension|migliore|premiato/i.test(b!.descrizione));
});
