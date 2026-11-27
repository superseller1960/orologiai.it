// Fase 32 — chiude le località rimaste senza attività.
// Chelos (Orosei) è stata archiviata come non pertinente: la sua località non ha più
// schede e pubblicherebbe una pagina vuota. Va rimossa dal catalogo e dall'anagrafica,
// e il vecchio URL porta con un 301 alla pagina della provincia.
import { readFileSync, writeFileSync } from 'node:fs';

const CAT = 'site/data/directory.json';
const ANA = 'data/anagrafica/comuni-catalogo.json';
const RED = 'data/anagrafica/redirect-territoriali.json';

const catalogo = JSON.parse(readFileSync(CAT, 'utf8'));
const anagrafica = JSON.parse(readFileSync(ANA, 'utf8'));
const redirect = JSON.parse(readFileSync(RED, 'utf8'));

const usate = new Set(catalogo.attivita.map((a) => a.localitaId));
const vuote = catalogo.localita.filter((l) => !usate.has(l.id));
if (!vuote.length) {
  console.log(JSON.stringify({ rimosse: 0, redirect: 0 }));
  process.exit(0);
}

const perId = new Map(catalogo.localita.map((l) => [l.id, l]));
const regoleAggiunte = [];
for (const l of vuote) {
  const da = `/orologerie/${l.regioneSlug}/${l.provinciaSlug}/${l.comuneSlug}/`;
  const a = `/orologerie/${l.regioneSlug}/${l.provinciaSlug}/`;
  if (!redirect.regole.some((r) => r.da === da)) {
    redirect.regole.push({
      da,
      a,
      motivo: `${l.comune} non ha più attività pubblicate: la scheda archiviata non era un'orologeria. Il vecchio URL porta alla pagina provinciale.`,
    });
    regoleAggiunte.push(da);
  }
}

const rimosse = vuote.map((l) => l.id);
catalogo.localita = catalogo.localita.filter((l) => usate.has(l.id));
for (const c of anagrafica.comuni) c.localita = c.localita.filter((id) => !rimosse.includes(id));
const comuniConLocalita = new Set(catalogo.localita.map((l) => l.codiceIstat));
anagrafica.comuni = anagrafica.comuni.filter((c) => comuniConLocalita.has(c.codiceIstat));

writeFileSync(CAT, JSON.stringify(catalogo, null, 2) + '\n');
writeFileSync(ANA, JSON.stringify(anagrafica, null, 1) + '\n');
writeFileSync(RED, JSON.stringify(redirect, null, 2) + '\n');

console.log(JSON.stringify({
  rimosse: rimosse.length,
  localita: rimosse.map((id) => `${id} (${perId.get(id).comune})`),
  comuni: anagrafica.comuni.length,
  redirect: regoleAggiunte.length,
}));
