import { readFileSync, writeFileSync } from 'node:fs';

const percorso = 'data/anagrafica/comuni-catalogo.json';
const ana = JSON.parse(readFileSync(percorso, 'utf8'));
const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
// L'anagrafica ISTAT è in Latin-1: leggerla come UTF-8 corrompe i comuni accentati (es. Rosà).
const righe = readFileSync('.audit/fase28/istat-comuni-2026.csv', 'latin1').split(/\r?\n/);
const perNome = new Map<string, string[]>();
for (const riga of righe.slice(1)) {
  const c = riga.split(';').map(x => x.replace(/^"|"$/g, '').replace(/\n/g, ' '));
  if (c.length < 20) continue;
  perNome.set(c[6], c);
}

const esistenti = new Set(ana.comuni.map((c: any) => c.codiceIstat));
const localitaPerComune = new Map<string, string[]>();
for (const l of dir.localita) localitaPerComune.set(l.codiceIstat, [...(localitaPerComune.get(l.codiceIstat) ?? []), l.id]);

let aggiunti = 0;
for (const l of dir.localita) {
  if (esistenti.has(l.codiceIstat)) continue;
  const c = perNome.get(l.comune);
  if (!c) throw new Error(`comune ${l.comune} assente dal CSV ISTAT`);
  if (c[4] !== l.codiceIstat) throw new Error(`${l.comune}: codice ${l.codiceIstat} diverso da ISTAT ${c[4]}`);
  if (c[14] !== l.siglaProvincia) throw new Error(`${l.comune}: sigla ${l.siglaProvincia} diversa da ISTAT ${c[14]}`);
  ana.comuni.push({
    codiceIstat: c[4], nome: c[6], provinciaUfficiale: c[11], provincia: l.provincia,
    sigla: c[14], regioneUfficiale: c[10], regione: l.regione,
    capoluogo: c[13] === '1', catastale: c[19],
    fonte: 'ISTAT — Elenco dei comuni (edizione in vigore)',
    localita: localitaPerComune.get(c[4]) ?? [],
  });
  esistenti.add(c[4]);
  aggiunti += 1;
}
for (const c of ana.comuni) c.localita = localitaPerComune.get(c.codiceIstat) ?? [];
const presenti = new Set(dir.localita.map((l: any) => l.codiceIstat));
const orfani = ana.comuni.filter((c: any) => !presenti.has(c.codiceIstat)).map((c: any) => c.nome);
ana.comuni.sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'it'));
ana.generato = '2026-11-03';
writeFileSync(percorso, JSON.stringify(ana, null, 1) + '\n');
console.log(JSON.stringify({ comuni: ana.comuni.length, aggiunti, orfani: orfani.length }));
if (orfani.length) console.log('senza località:', orfani.slice(0, 10).join(', '));
