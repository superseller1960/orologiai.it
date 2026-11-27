import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Gate Fase 30: ogni località del catalogo deve coincidere con l'anagrafica ISTAT canonica.
// Un solo errore geografico blocca il rilascio (exit code 1).

type Comune = {
  codiceIstat: string; nome: string; provincia: string; sigla: string; regione: string;
  localita: string[];
};
type Localita = {
  id: string; comune: string; provincia: string; siglaProvincia: string; regione: string; codiceIstat: string;
};

const anagrafica = JSON.parse(await readFile(resolve('data/anagrafica/comuni-catalogo.json'), 'utf8')) as { comuni: Comune[] };
const directory = JSON.parse(await readFile(resolve('site/data/directory.json'), 'utf8')) as { localita: Localita[] };

// Apostrofi tipografici e dritti equivalenti.
const norm = (s: string) => s.replace(/[’‘`]/g, "'").trim();
const perCodice = new Map(anagrafica.comuni.map(c => [c.codiceIstat, c]));
const errori: string[] = [];

for (const p of directory.localita) {
  const c = perCodice.get(p.codiceIstat);
  if (!c) { errori.push(`${p.id}: codice ISTAT ${p.codiceIstat} assente dall'anagrafica`); continue; }
  if (norm(c.nome) !== norm(p.comune)) errori.push(`${p.id}: comune "${p.comune}" diverso da ISTAT "${c.nome}"`);
  if (c.provincia !== p.provincia || c.sigla !== p.siglaProvincia) errori.push(`${p.id}: provincia ${p.provincia} (${p.siglaProvincia}) diversa da ISTAT ${c.provincia} (${c.sigla})`);
  if (c.regione !== p.regione) errori.push(`${p.id}: regione "${p.regione}" diversa da ISTAT "${c.regione}"`);
}

console.log(JSON.stringify({ localita: directory.localita.length, errori: errori.length }));
if (errori.length) {
  console.error(errori.join('\n'));
  process.exit(1);
}
