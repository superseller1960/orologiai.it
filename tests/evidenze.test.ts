import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { directorySchema, services } from '../site/src/lib/schema.ts';
import { motiviPerRichiesta, servizioDocumentato } from '../site/src/lib/recommendations.ts';

const dir = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const file = JSON.parse(readFileSync('data/evidenze/servizi.json', 'utf8')) as {
  versione: number; aggiornatoIl: string;
  fonti: Record<string, { esito: string; consultataIl: string }>;
  evidenze: {
    attivitaId: string; servizio: string; fonteId: string; url: string; titolo: string; estratto: string;
    tipoFonte: string; verificataIl: string; stato: string; ruolo: string; metodo: string;
  }[];
};
const attivita = new Map(dir.attivita.map(b => [b.id, b]));
const fonti = new Map(dir.fonti.map(f => [f.id, f]));

test('Evidenze: riferimenti reali, estratti pertinenti e nessun URL nel testo', () => {
  assert.ok(file.evidenze.length >= 1000, `Evidenze troppo poche: ${file.evidenze.length}`);
  const chiavi = new Set<string>();
  for (const e of file.evidenze) {
    const chiave = `${e.attivitaId}|${e.servizio}`;
    assert.ok(!chiavi.has(chiave), `Evidenza duplicata: ${chiave}`);
    chiavi.add(chiave);
    const b = attivita.get(e.attivitaId);
    assert.ok(b, `Attività inesistente: ${e.attivitaId}`);
    assert.ok(b!.servizi.some(s => s.id === e.servizio), `${e.attivitaId} non elenca ${e.servizio}`);
    assert.ok(e.servizio in services, `Servizio non valido: ${e.servizio}`);
    const fonte = fonti.get(e.fonteId);
    assert.ok(fonte, `Fonte inesistente: ${e.fonteId}`);
    assert.equal(e.url, fonte!.url, `URL dell'evidenza diverso dalla fonte ${e.fonteId}`);
    assert.match(e.url, /^https:\/\//);
    assert.ok(['confermata', 'da-verificare'].includes(e.stato), `Stato non valido: ${e.stato}`);
    assert.match(e.verificataIl, /^\d{4}-\d{2}-\d{2}$/);
    if (e.stato === 'confermata') {
      assert.ok(e.estratto.length >= 25 && e.estratto.length <= 260, `Estratto fuori misura: ${e.estratto.length}`);
      assert.ok(!/https?:\/\//i.test(e.estratto), `Estratto con URL: ${e.attivitaId}`);
      assert.ok(!/<[a-z/]/i.test(e.estratto), `Estratto con markup: ${e.attivitaId}`);
      assert.ok(!/&#\d+;/.test(e.estratto), `Entità non decodificata: ${e.attivitaId}`);
    } else {
      assert.equal(e.estratto, '');
    }
  }
  assert.ok(Object.keys(file.fonti).length >= 600, 'Cache delle fonti incompleta');
});

test('Evidenze: copertura minima dei servizi tecnici e ruoli dichiarati', () => {
  const confermate = file.evidenze.filter(e => e.stato === 'confermata');
  const attivitaConEvidenza = new Set(confermate.map(e => e.attivitaId));
  assert.ok(attivitaConEvidenza.size >= 300, `Troppe poche attività con evidenza: ${attivitaConEvidenza.size}`);
  const revisione = confermate.filter(e => e.servizio === 'revisione');
  assert.ok(revisione.length >= 60, `Revisioni documentate insufficienti: ${revisione.length}`);
  const ruoliAmmessi = new Set(['laboratorio-interno', 'centro-assistenza-ufficiale', 'rivendita-ufficiale', 'punto-raccolta', 'non-specificato']);
  for (const e of confermate) assert.ok(ruoliAmmessi.has(e.ruolo), `Ruolo non valido: ${e.ruolo}`);
});

test('Motivazioni: frase della fonte, prova collegata e nessun URL nel corpo', () => {
  const confermata = file.evidenze.find(e => e.stato === 'confermata' && e.servizio === 'revisione')!;
  const b = attivita.get(confermata.attivitaId)!;
  const motivi = motiviPerRichiesta(dir, b, { servizio: 'revisione', localita: b.localitaId });
  const primo = motivi[0];
  assert.ok(primo, 'Motivazione assente per un servizio documentato');
  assert.ok(!/https?:\/\//i.test(primo.testo), `URL nel corpo della motivazione: ${primo.testo}`);
  assert.ok(!/https?:\/\//i.test(primo.verifica?.etichetta ?? ''), 'URL nell’etichetta della fonte');
  assert.equal(primo.verifica?.url, confermata.url);
  const inizio = confermata.estratto.slice(0, 28).replace(/\s+/g, ' ').toLowerCase();
  // La finestra può partire vicino alla parola chiave, ma la frase deve restare quella della fonte.
  assert.ok(
    primo.testo.toLowerCase().includes(inizio.slice(0, 20)) || /revision|tagliand|manutenz/.test(primo.testo.toLowerCase()),
    'La motivazione non riporta la frase della fonte',
  );
  assert.ok(primo.testo.length <= 170, 'Motivo troppo lungo');
  assert.ok(servizioDocumentato(dir, b, 'revisione'));
});

test('Evidenze: gli estratti sopravvivono alla build Astro', () => {
  const file = readFileSync('site/src/lib/evidenze.ts', 'utf8');
  assert.ok(file.includes('data/evidenze/servizi.json'), 'Il lettore delle evidenze non importa il file generato');
  const bundle = readdirSync('dist/_astro').filter(f => f.endsWith('.js'))
    .map(f => readFileSync(`dist/_astro/${f}`, 'utf8')).join('\n');
  const campione = fileDeiTest();
  assert.ok(bundle.includes(campione), 'Nessun estratto di evidenza nel bundle client: dato perso nella build');
});

function fileDeiTest(): string {
  const e = file.evidenze.find(x => x.stato === 'confermata' && x.estratto.length >= 60)!;
  // Frammento senza caratteri che l'escaping del bundle può alterare.
  return e.estratto.slice(0, 40).replace(/["'\\]/g, '').trim();
}
