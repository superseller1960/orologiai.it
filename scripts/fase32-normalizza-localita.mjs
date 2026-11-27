// Fase 32 — riallinea le nuove località al canone del catalogo.
// L'ISTAT scrive "Bolzano/Bozen" e "Trentino-Alto Adige/Südtirol": il catalogo usa
// "Bolzano" e "Trentino-Alto Adige". Senza questo passaggio la stessa provincia
// otterrebbe due URL e comparirebbe una ventunesima regione.
// Il canone si ricava dalle località già pubblicate prima di questo lotto.
import { readFileSync, writeFileSync } from 'node:fs';

const CAT = 'site/data/directory.json';
const ANA = 'data/anagrafica/comuni-catalogo.json';
const LOT = 'data/import/fase32-01.json';

const catalogo = JSON.parse(readFileSync(CAT, 'utf8'));
const anagrafica = JSON.parse(readFileSync(ANA, 'utf8'));
const lotto = JSON.parse(readFileSync(LOT, 'utf8'));

const nuovi = new Set(lotto.localita.map((l) => l.id));
const canone = new Map();
for (const l of catalogo.localita) {
  if (nuovi.has(l.id)) continue;
  const voce = { provincia: l.provincia, provinciaSlug: l.provinciaSlug, regione: l.regione, regioneSlug: l.regioneSlug };
  const chiave = JSON.stringify(voce);
  const perSigla = canone.get(l.siglaProvincia) ?? new Set();
  perSigla.add(chiave);
  canone.set(l.siglaProvincia, perSigla);
}

const modifiche = [];
const normalizza = (voce, dove) => {
  const perSigla = canone.get(voce.siglaProvincia);
  if (!perSigla || perSigla.size !== 1) return;
  const atteso = JSON.parse([...perSigla][0]);
  for (const campo of ['provincia', 'provinciaSlug', 'regione', 'regioneSlug']) {
    if (voce[campo] !== atteso[campo]) {
      modifiche.push(`${dove}: ${campo} da "${voce[campo]}" a "${atteso[campo]}"`);
      voce[campo] = atteso[campo];
    }
  }
};

for (const l of catalogo.localita) if (nuovi.has(l.id)) normalizza(l, `località ${l.id}`);
for (const l of lotto.localita) normalizza(l, `lotto ${l.id}`);

const sigleNuove = new Set(lotto.localita.map((l) => l.siglaProvincia));
for (const c of anagrafica.comuni) {
  if (!sigleNuove.has(c.sigla)) continue;
  const riferimento = lotto.localita.find((l) => l.comune === c.nome);
  if (!riferimento) continue;
  if (c.provincia !== riferimento.provincia) {
    modifiche.push(`anagrafica ${c.nome}: provincia da "${c.provincia}" a "${riferimento.provincia}"`);
    c.provincia = riferimento.provincia;
  }
  if (c.regione !== riferimento.regione) {
    modifiche.push(`anagrafica ${c.nome}: regione da "${c.regione}" a "${riferimento.regione}"`);
    c.regione = riferimento.regione;
  }
}

if (modifiche.length) {
  writeFileSync(CAT, JSON.stringify(catalogo, null, 2) + '\n');
  writeFileSync(ANA, JSON.stringify(anagrafica, null, 1) + '\n');
  writeFileSync(LOT, JSON.stringify(lotto, null, 2) + '\n');
}
console.log(JSON.stringify({ modifiche: modifiche.length }));
for (const m of modifiche) console.log(' -', m);
