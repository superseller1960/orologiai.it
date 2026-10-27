import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const load = async () => directorySchema.parse(JSON.parse(await readFile('site/data/directory.json', 'utf8')));

test('audit gruppo 7: Lotto 8 verificato, autorizzazioni corrette e claim non supportati rimossi', async () => {
  const d = await load();
  const get = (id: string) => {
    const b = d.attivita.find(x => x.id === id);
    assert.ok(b, `manca ${id}`);
    return b;
  };

  // Digiesi: Hamilton come centro assistenza ufficiale (scheda specifica del marchio), non rivenditore.
  const dig = get('gioielleria-digiesi-1959-matera');
  const ass = dig.marchi.assistenzaUfficiale.find(m => m.marca === 'Hamilton');
  assert.ok(ass, 'assistenza Hamilton mancante');
  assert.ok(ass.fonti.includes('l8-www-hamiltonwatch-com-matera-digiesi-1959-gioiellieri'));
  assert.ok(!dig.marchi.rivenditaUfficiale.some(m => m.marca === 'Hamilton'), 'rivendita Hamilton indebita');
  assert.equal(dig.contatti.email, 'digiesigioiellieri@gmail.com');
  assert.equal(dig.contatti.sito, 'https://gioielleriadigiesi.it/');
  assert.ok(dig.attendibilita.segnalazioni.some(s => /certificata Omega/.test(s.motivo)));

  // Fusco: assistenza ufficiale Breil dall'elenco centri di assistenza.
  const fus = get('fusco-snc-pescara');
  const fAss = fus.marchi.assistenzaUfficiale.find(m => m.marca === 'Breil');
  assert.ok(fAss, 'assistenza Breil mancante');
  assert.ok(fAss.fonti.includes('l8-www-breil-com-it-centri-di-assistenza'));

  // Cheope: email documentata dalla scheda Breil; rivendita Breil autorizzata invariata.
  const che = get('cheope-benevento');
  assert.equal(che.contatti.email, 'furnoigino@tin.it');
  assert.ok(che.marchi.rivenditaUfficiale.some(m => m.marca === 'Breil'));
  assert.ok(che.attendibilita.segnalazioni.some(s => /Civico variante/.test(s.motivo)));

  // Comentale: lucidatura rimossa, storia 1984/2001, denominazione non confermata rimossa.
  const com = get('gioielleria-comentale-angri');
  assert.ok(!com.servizi.some(s => s.id === 'lucidatura'), 'lucidatura ancora presente');
  assert.equal(com.storia.annoFondazione, 1984);
  assert.ok(com.storia.eventi.some(e => e.data === '2001'));
  assert.ok(!/Carmine Severino/.test(com.descrizione), 'denominazione non confermata ancora presente');
  assert.ok(com.attendibilita.segnalazioni.some(s => /Carmine Severino/.test(s.motivo)));

  // Tarlociaru: vendita rimossa.
  const tar = get('tarlociaru-lecce');
  assert.ok(!tar.servizi.some(s => s.id === 'vendita'), 'vendita ancora presente');
  assert.ok(!/vendita di segnatempo/.test(tar.descrizione));
  assert.ok(tar.attendibilita.segnalazioni.some(s => /Vendita di segnatempo/.test(s.motivo)));

  // L'Orologiaio: pendoleria, marchi riparati, storia 2001; «preventivo gratuito» rimosso.
  const oro = get('lorologiaio-taranto');
  assert.ok(oro.servizi.some(s => s.id === 'pendoleria'));
  assert.equal(oro.storia.annoFondazione, 2001);
  for (const m of ['Rolex', 'Patek Philippe', 'Omega', 'Girard-Perregaux']) {
    assert.ok(oro.marchi.riparati.some(x => x.marca === m), `mancante ${m}`);
  }
  assert.ok(!/preventivo gratuito/.test(oro.descrizione));
  assert.ok(oro.attendibilita.segnalazioni.some(s => /non ricontrollabili/.test(s.motivo)));

  // Laboratorio Orologiaio: servizi corretti (bigiotteria, non gioielli) e incertezze registrate.
  const lab = get('laboratorio-orologiaio-marcianise');
  assert.ok(/bigiotteria/.test(lab.descrizione));
  assert.ok(!/orologi e gioielli/.test(lab.descrizione));
  assert.ok(lab.attendibilita.segnalazioni.some(s => /TLS/.test(s.motivo)));
  assert.ok(lab.attendibilita.segnalazioni.some(s => /OPS/.test(s.motivo)));

  // Merola: Seiko riparato con la pagina specifica; recapiti non ricontrollabili segnalati.
  const mer = get('gioielleria-merola-santa-maria-capua-vetere');
  const seiko = mer.marchi.riparati.find(m => m.marca === 'Seiko');
  assert.ok(seiko?.fonti.includes('l8-gioielleriamerola-it-assistenza-seiko-italia'));
  assert.ok(mer.attendibilita.segnalazioni.some(s => /Piazza Agostino Di Monaco/.test(s.motivo)));

  // Vitrani: nessuna qualifica Hamilton ufficiale; fonti contatti/storia integrate.
  const vit = get('vitrani-gioiellieri-barletta');
  assert.equal(vit.marchi.rivenditaUfficiale.length, 0);
  assert.equal(vit.marchi.assistenzaUfficiale.length, 0);
  assert.ok(vit.contatti.fonti.includes('l8-vitranigioielliere-it-contatti'));

  // Raffa: marchi riparati integrati.
  const raf = get('raffa-maestro-orologiaio-siracusa');
  for (const m of ['Nautica', 'Sector', 'Breil']) {
    assert.ok(raf.marchi.riparati.some(x => x.marca === m), `mancante ${m}`);
  }

  // Approfondimenti residui fase 9 registrati.
  assert.ok(get('gioielleria-galdi-salerno').attendibilita.segnalazioni.some(s => /locator Rolex e IWC/.test(s.motivo)));
  assert.ok(get('fratelli-gallo-cosenza').attendibilita.segnalazioni.some(s => /Rolex e Tudor/.test(s.motivo)));

  // Gold Shine: nessuna correzione, verifica registrata.
  assert.match(get('gold-shine-portico-caserta').attendibilita.cronologia.at(-1)?.azione ?? '', /nessuna correzione/);
});
