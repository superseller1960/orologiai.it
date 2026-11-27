import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { businessUrl, directory, localityUrl } from '../site/src/lib/directory.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { isUsableCoordinate } from '../site/src/lib/schema.ts';
import { REGIONI_ITALIA } from '../site/src/lib/geo.ts';
import { GET as sitemap } from '../site/src/pages/sitemap.xml.ts';
import { REDIRECT_TERRITORIALI, redirectTerritoriale } from '../site/src/lib/redirect-territoriali.ts';

const leggi = (percorso: string) => JSON.parse(fs.readFileSync(new URL(`../${percorso}`, import.meta.url), 'utf8'));
const anagrafica = leggi('data/anagrafica/comuni-catalogo.json') as {
  comuni: { codiceIstat: string; nome: string; provincia: string; sigla: string; regione: string; localita: string[] }[];
};
const canone = new Map(anagrafica.comuni.map((c) => [c.codiceIstat, c]));

// Forme ufficiali ISTAT bilingui: il catalogo usa la denominazione italiana corrente.
const ALIAS_COMUNE: Record<string, string> = { 'reggio calabria': 'reggio di calabria' };
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();

test('Fase28: tutte le località corrispondono al comune ISTAT, con provincia, sigla e regione corrette', () => {
  assert.ok(directory.localita.length >= 217, `località: ${directory.localita.length}`);
  for (const l of directory.localita) {
    const c = canone.get(String(l.codiceIstat));
    assert.ok(c, `${l.id}: codice ISTAT ${l.codiceIstat} assente dall'anagrafica`);
    const nomeAtteso = norm(ALIAS_COMUNE[norm(l.comune)] ?? l.comune);
    assert.equal(norm(c!.nome), nomeAtteso, `${l.id}: comune ${l.comune} diverso da ${c!.nome}`);
    assert.equal(l.provincia, c!.provincia, `${l.id}: provincia`);
    assert.equal(l.siglaProvincia, c!.sigla, `${l.id}: sigla`);
    assert.equal(l.regione, c!.regione, `${l.id}: regione`);
    assert.ok(c!.localita.includes(l.id), `${l.id}: anagrafica non collegata alla località`);
  }
});

test('Fase28: nessuna frazione è trattata come comune e ogni frazione conserva il comune amministrativo', () => {
  const frazioni = directory.localita.filter((l) => (l as { frazione?: string | null }).frazione);
  assert.ok(frazioni.length >= 1, 'la frazione di Porto Potenza Picena deve restare censita');
  for (const l of frazioni) {
    const frazione = (l as { frazione?: string | null }).frazione!;
    assert.notEqual(norm(frazione), norm(l.comune), `${l.id}: frazione uguale al comune`);
    const c = canone.get(String(l.codiceIstat));
    assert.equal(c?.nome, l.comune, `${l.id}: la frazione deve appartenere al comune ISTAT`);
    assert.equal(l.comuneSlug, norm(l.comune).replace(/\s+/g, '-'), `${l.id}: URL della frazione non è quello del comune`);
  }
  const porto = directory.localita.find((l) => l.id === 'porto-potenza-picena');
  assert.ok(porto, 'Porto Potenza Picena deve restare in catalogo');
  assert.equal(porto!.comune, 'Potenza Picena');
  assert.equal((porto as { frazione?: string | null }).frazione, 'Porto Potenza Picena');
  assert.equal(localityUrl(porto!), '/orologerie/marche/macerata/potenza-picena/');
  const attivita = directory.attivita.filter((b) => b.localitaId === 'porto-potenza-picena');
  assert.ok(attivita.length > 0 && attivita.every((b) => (b.posizione.indirizzo ?? '').includes('Porto Potenza Picena') || b.posizione.indirizzo === null));
});

test('Fase28: una provincia ha una sola denominazione, una sola sigla e una sola regione', () => {
  const perSlug = new Map<string, Set<string>>();
  for (const l of directory.localita) {
    const insieme = perSlug.get(l.provinciaSlug) ?? new Set<string>();
    insieme.add(`${l.provincia}|${l.siglaProvincia}|${l.regione}|${l.regioneSlug}`);
    perSlug.set(l.provinciaSlug, insieme);
    assert.match(l.siglaProvincia, /^[A-Z]{2}$/, `${l.id}: sigla non valida`);
    const regione = REGIONI_ITALIA[l.regioneSlug];
    assert.ok(regione, `${l.id}: regione ${l.regioneSlug} sconosciuta`);
    assert.equal(regione!.nome, l.regione, `${l.id}: nome regione incoerente con lo slug`);
  }
  for (const [slug, insieme] of perSlug) assert.equal(insieme.size, 1, `${slug}: ${[...insieme].join(' / ')}`);
});

test('Fase28: la ricerca esatta per comune restituisce solo le attività di quel comune', () => {
  let totale = 0;
  for (const l of directory.localita) {
    const risultati = searchDirectory(directory, { localita: l.id });
    assert.ok(risultati.length > 0, `${l.id}: nessun risultato`);
    for (const r of risultati) {
      assert.equal(r.business.localitaId, l.id, `${l.id}: risultato di ${r.business.localitaId}`);
      totale++;
    }
  }
  assert.equal(totale, directory.attivita.length, 'ogni attività appartiene esattamente alla sua località');
});

test('Fase28: Firenze non include attività di altre città e la ricerca libera non le mescola', () => {
  const firenze = directory.attivita.filter((b) => b.localitaId === 'firenze').map((b) => b.id).sort();
  assert.deepEqual(searchDirectory(directory, { localita: 'firenze' }).map((r) => r.business.id).sort(), firenze);
  assert.equal(searchDirectory(directory, { localita: 'firenze', q: 'Genova' }).length, 0);
  assert.equal(searchDirectory(directory, { localita: 'genova', q: 'Firenze' }).length, 0);
  const genova = new Set(directory.attivita.filter((b) => b.localitaId === 'genova').map((b) => b.id));
  assert.ok([...firenze].every((id) => !genova.has(id)));
});

test('Fase28: ogni pagina regionale contiene solo attività della propria regione', () => {
  for (const slug of Object.keys(REGIONI_ITALIA)) {
    const luoghi = directory.localita.filter((l) => l.regioneSlug === slug);
    const attivita = directory.attivita.filter((b) => luoghi.some((l) => l.id === b.localitaId));
    for (const b of attivita) {
      const l = directory.localita.find((x) => x.id === b.localitaId)!;
      assert.equal(l.regioneSlug, slug, `${b.id} compare in ${slug} ma è in ${l.regioneSlug}`);
    }
  }
});

test('Fase28: le correzioni geografiche non eliminano schede e gli ID della Fase 27 esistono ancora', () => {
  const attesi = fs.readFileSync(new URL('../data/anagrafica/attivita-fase27.txt', import.meta.url), 'utf8').trim().split('\n');
  assert.equal(attesi.length, 500);
  const presenti = new Set(directory.attivita.map((b) => b.id));
  for (const id of attesi) assert.ok(presenti.has(id), `scheda persa: ${id}`);
  assert.ok(directory.attivita.length >= 500, `schede: ${directory.attivita.length}`);
  assert.equal(new Set(directory.attivita.map((b) => b.slug)).size, directory.attivita.length);
});

test('Fase28: ogni marker pubblicato appartiene alla località dichiarata e cade in Italia', () => {
  const conCoordinate = directory.attivita.filter((b) => isUsableCoordinate(b.posizione.coordinate));
  assert.ok(conCoordinate.length >= 82, `coordinate pubblicate: ${conCoordinate.length}`);
  const visti = new Map<string, string>();
  for (const b of conCoordinate) {
    const l = directory.localita.find((x) => x.id === b.localitaId)!;
    const c = canone.get(String(l.codiceIstat))!;
    assert.equal(l.comune, c.nome, `${b.id}: marker su comune diverso da quello dichiarato`);
    const { lat, lon } = b.posizione.coordinate!;
    assert.ok(lat > 35 && lat < 47.5 && lon > 6 && lon < 19, `${b.id}: coordinate fuori dall'Italia`);
    const chiave = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const altro = visti.get(chiave);
    if (altro) {
      const altroLuogo = directory.attivita.find((x) => x.id === altro)!.localitaId;
      assert.equal(altroLuogo, b.localitaId, `${b.id} e ${altro}: stesso punto in comuni diversi`);
    }
    visti.set(chiave, b.id);
    assert.ok(b.posizione.coordinate!.indirizzoConfrontato, `${b.id}: marker senza indirizzo confrontato`);
  }
});

test('Fase28: sitemap e URL usano i percorsi territoriali corretti, senza duplicati', () => {
  const percorsi = directory.localita.map(localityUrl);
  assert.equal(new Set(percorsi).size, percorsi.length, 'URL di località duplicati');
  assert.ok(percorsi.includes('/orologerie/sardegna/gallura-nord-est-sardegna/olbia/'));
  assert.ok(percorsi.includes('/orologerie/sardegna/sulcis-iglesiente/iglesias/'));
  assert.ok(percorsi.includes('/orologerie/sardegna/medio-campidano/villacidro/'));
  assert.ok(!percorsi.some((p) => /olbia-tempio|sud-sardegna/.test(p)), 'URL con province soppresse');
  for (const b of directory.attivita) assert.match(businessUrl(b), /^\/orologeria\/[a-z0-9-]+\/$/);
});

test('Fase28: i vecchi URL territoriali hanno un redirect verso i nuovi percorsi', () => {
  const regole = fs.readFileSync(new URL('../site/public/_redirects', import.meta.url), 'utf8')
    .split('\n').filter((r) => r.trim() && !r.trim().startsWith('#'));
  const percorsi = new Set(directory.localita.map(localityUrl));
  const attese = [
    ['/orologerie/sardegna/olbia-tempio/*', '/orologerie/sardegna/gallura-nord-est-sardegna/:splat', '/orologerie/sardegna/gallura-nord-est-sardegna/olbia/'],
    ['/orologerie/sardegna/sud-sardegna/iglesias/*', '/orologerie/sardegna/sulcis-iglesiente/iglesias/:splat', '/orologerie/sardegna/sulcis-iglesiente/iglesias/'],
    ['/orologerie/sardegna/sud-sardegna/villacidro/*', '/orologerie/sardegna/medio-campidano/villacidro/:splat', '/orologerie/sardegna/medio-campidano/villacidro/'],
    ['/orologerie/marche/macerata/porto-potenza-picena/*', '/orologerie/marche/macerata/potenza-picena/:splat', '/orologerie/marche/macerata/potenza-picena/'],
  ];
  for (const [da, a, destinazione] of attese) {
    const regola = regole.find((r) => r.startsWith(`${da} `));
    assert.ok(regola, `redirect mancante per ${da}`);
    assert.match(regola!, / 301$/);
    assert.ok(regola!.includes(a), `destinazione errata per ${da}`);
    assert.ok(percorsi.has(destinazione), `destinazione inesistente: ${destinazione}`);
  }
  // Fase 34: il percorso nudo di Olbia-Tempio va alla regione e precede la regola a splat dei comuni.
  const esatta = regole.findIndex((r) => r.startsWith('/orologerie/sardegna/olbia-tempio/ '));
  const splat = regole.findIndex((r) => r.startsWith('/orologerie/sardegna/olbia-tempio/* '));
  assert.ok(esatta >= 0 && splat >= 0 && esatta < splat, 'regola esatta di Olbia-Tempio mancante o successiva allo splat');
  assert.match(regole[esatta], /^\/orologerie\/sardegna\/olbia-tempio\/ \/orologerie\/sardegna\/ 301$/);
});

test('Fase28: la sitemap pubblica tutte le schede e i nuovi percorsi territoriali', async () => {
  const risposta = await sitemap({ site: new URL('https://orologiai.it') } as never);
  const xml = await risposta.text();
  const url = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(url.filter((u) => u.includes('/orologeria/')).length, directory.attivita.length);
  for (const percorso of ['/orologerie/sardegna/gallura-nord-est-sardegna/olbia/', '/orologerie/sardegna/medio-campidano/villacidro/', '/orologerie/marche/macerata/potenza-picena/']) {
    assert.ok(url.some((u) => u.endsWith(percorso)), `sitemap senza ${percorso}`);
  }
  assert.ok(!url.some((u) => u.includes('olbia-tempio') || u.includes('sud-sardegna')));
});

test('Fase28: il worker Pages reindirizza i vecchi percorsi territoriali con 301', () => {
  const percorsi = new Set(directory.localita.map(localityUrl));
  const perPercorso = new Map<string, { a: string; soloEsatto: boolean }[]>();
  for (const { da, a, soloEsatto } of REDIRECT_TERRITORIALI) {
    perPercorso.set(da, [...(perPercorso.get(da) ?? []), { a, soloEsatto: !!soloEsatto }]);
  }
  for (const [da, regole] of perPercorso) {
    // Sul percorso esatto vince la prima regola; sui sottopercorsi l'ultima regola di prefisso.
    const esatta = regole[0];
    const prefisso = [...regole].reverse().find((r) => !r.soloEsatto)!;
    assert.equal(redirectTerritoriale(da), esatta.a, `redirect pieno per ${da}`);
    assert.equal(redirectTerritoriale(da.slice(0, -1)), esatta.a, `redirect senza slash per ${da}`);
    assert.equal(redirectTerritoriale(`${da}qualcosa/`), `${prefisso.a}qualcosa/`, `coda persa per ${da}`);
    assert.equal(redirectTerritoriale(da, '?x=1'), `${esatta.a}?x=1`, `query persa per ${da}`);
    for (const { a } of regole) assert.ok(percorsi.has(a) || [...percorsi].some((p) => p.startsWith(a)), `destinazione inesistente: ${a}`);
  }
  // Fase 34: la vecchia provincia soppressa non ha pagina propria; i comuni restano sotto Gallura.
  assert.equal(redirectTerritoriale('/orologerie/sardegna/olbia-tempio/'), '/orologerie/sardegna/');
  assert.equal(redirectTerritoriale('/orologerie/sardegna/olbia-tempio/olbia/'), '/orologerie/sardegna/gallura-nord-est-sardegna/olbia/');
  assert.ok(percorsi.has('/orologerie/sardegna/gallura-nord-est-sardegna/olbia/'));
  for (const percorso of ['/orologerie/sardegna/gallura-nord-est-sardegna/olbia/', '/orologerie/sardegna/', '/orologerie/', '/orologeria/scardi/']) {
    assert.equal(redirectTerritoriale(percorso), null, `redirect non dovuto per ${percorso}`);
  }
});
