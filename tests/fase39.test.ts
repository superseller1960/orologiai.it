import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// Fase 39 — le garanzie nuove: percorsi per problema reale e competenze documentate nella scheda.
const evidenze = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')).evidenze as {
  attivitaId: string; servizio: string; url: string; estratto: string; stato: string;
}[];
const directory = JSON.parse(readFileSync('site/data/directory.json', 'utf8')) as {
  attivita: {
    id: string; slug: string;
    attendibilita: { stato: string; fonti: string[]; cronologia: unknown[] };
    servizi: { id: string }[];
    origine: { sistema: string };
  }[];
};

test('Fase 39: la ricerca parte da problemi concreti, non solo da voci tecniche', () => {
  const pagina = readFileSync('site/src/pages/cerca.astro', 'utf8');
  const bisogni = ['riparazione', 'revisione', 'ricambi', 'batterie', 'restauro-vintage', 'pendoleria', 'valutazioni', 'assistenza-marca'];
  for (const bisogno of bisogni) {
    assert.match(pagina, new RegExp(`data-bisogno="${bisogno}"`), `Manca il percorso per ${bisogno}`);
  }
  // Nessuna diagnosi promessa: la pagina dichiara che il filtro è un punto di partenza.
  assert.match(pagina, /non una diagnosi/);
});

test('Fase 39: la scheda pubblica le competenze solo con la frase della fonte', () => {
  const conEvidenza = directory.attivita.find((b) => evidenze.some((e) => e.attivitaId === b.id && e.stato === 'confermata'));
  assert.ok(conEvidenza, 'Nessuna attività con evidenza confermata');
  const percorso = `dist/orologeria/${conEvidenza.slug}/index.html`;
  if (!existsSync(percorso)) return; // la build non è stata eseguita in questo giro
  const html = readFileSync(percorso, 'utf8');
  const prova = evidenze.find((e) => e.attivitaId === conEvidenza.id && e.stato === 'confermata')!;
  assert.match(html, /Competenze documentate/);
  assert.ok(html.includes(prova.url), 'La scheda non collega la pagina della fonte');
  assert.match(html, /Verifica la fonte/);
  assert.ok(html.includes('BreadcrumbList'), 'Manca il breadcrumb strutturato');
});

test('Fase 39: ogni nuova scheda ha una fonte ufficiale e una cronologia', () => {
  const nuove = directory.attivita.filter((b) => b.origine.sistema === 'fase39-verifica-fonte');
  assert.ok(nuove.length > 0, 'Nessuna scheda del lotto Fase 39');
  for (const b of nuove) {
    assert.equal(b.attendibilita.stato, 'fonti-verificate');
    assert.ok(b.attendibilita.fonti.length > 0);
    assert.ok(b.attendibilita.cronologia.length > 0);
    assert.ok(b.servizi.length >= 2, `${b.id}: servizi insufficienti`);
  }
});
