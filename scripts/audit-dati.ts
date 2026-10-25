// Audit di qualità del database attività: coerenza dei riferimenti (oltre lo schema), plausibilità
// geografica, formati dei contatti, duplicati e raggiungibilità dalla ricerca. Read-only: segnala
// e scrive il report, non modifica alcun dato. Con --live controlla anche la raggiungibilità degli
// URL di fonti e contatti (riprendibile: le URL già sondate non vengono ricontrollate).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
import {
  directorySchema, isUsableCoordinate, services,
  type Business, type Directory,
} from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { searchDirectory, distanceKm, normalize } from '../site/src/lib/search.ts';
import { interpretaRichiesta } from '../site/src/lib/assistant.ts';
import { REGIONI_ITALIA } from '../site/src/lib/geo.ts';

const REPORT = 'data/reports/audit-qualita-20261024.json';
const data = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const luoghi = new Map(data.localita.map(p => [p.id, p]));
const fonti = new Map(data.fonti.map(f => [f.id, f]));

type Voce = { gravita: 'errore' | 'da-controllare'; id: string; dettaglio: string };
const sezioni: Record<string, Voce[]> = {
  fontiServizio: [], geografia: [], cap: [], localita: [], contatti: [],
  orari: [], storia: [], duplicati: [], ricerca: [],
};
const add = (sez: string, gravita: Voce['gravita'], id: string, dettaglio: string) =>
  sezioni[sez].push({ gravita, id, dettaglio });

// --- Fonti dei servizi: ogni servizio dichiarato deve avere una fonte primaria (regola di import) ---
const fontiPrimarie = new Set(['sito-ufficiale', 'marchio-ufficiale', 'titolare']);
for (const b of data.attivita) {
  for (const s of b.servizi) {
    const ok = s.fonti.some(id => fontiPrimarie.has(fonti.get(id)?.tipo ?? ''));
    if (!ok) add('fontiServizio', 'da-controllare', b.id, `servizio “${services[s.id]}” (${s.id}) senza fonte primaria: ${s.fonti.join(', ') || 'nessuna'}`);
  }
}

// --- Geografia: box Italia, lat/lon invertiti, coerenza col comune ---
const box = { latMin: 35.5, latMax: 47.1, lonMin: 6.6, lonMax: 18.6 };
const coordPerLuogo = new Map<string, { lat: number; lon: number }[]>();
for (const b of data.attivita) {
  const c = b.posizione.coordinate;
  if (!isUsableCoordinate(c)) continue;
  const lista = coordPerLuogo.get(b.localitaId) ?? [];
  lista.push({ lat: c.lat, lon: c.lon });
  coordPerLuogo.set(b.localitaId, lista);
  const fuori = c.lat < box.latMin || c.lat > box.latMax || c.lon < box.lonMin || c.lon > box.lonMax;
  const invertite = c.lat >= box.lonMin && c.lat <= box.lonMax && c.lon >= box.latMin && c.lon <= box.latMax;
  if (fuori) add('geografia', 'errore', b.id, `coordinate fuori dall’Italia: ${c.lat}, ${c.lon}${invertite ? ' (lat/lon plausibilmente invertite)' : ''}`);
}
const centroidi = new Map<string, { lat: number; lon: number }>();
for (const [id, lista] of coordPerLuogo) {
  if (!lista.length) continue;
  centroidi.set(id, {
    lat: lista.reduce((s, c) => s + c.lat, 0) / lista.length,
    lon: lista.reduce((s, c) => s + c.lon, 0) / lista.length,
  });
}
for (const b of data.attivita) {
  const c = b.posizione.coordinate;
  if (!isUsableCoordinate(c)) continue;
  const mio = centroidi.get(b.localitaId);
  if (mio && coordPerLuogo.get(b.localitaId)!.length >= 2 && distanceKm(c, mio) > 25) {
    add('geografia', 'da-controllare', b.id, `coordinata a ${distanceKm(c, mio).toFixed(1)} km dal baricentro di ${luoghi.get(b.localitaId)?.comune}`);
  }
  for (const [altroId, centro] of centroidi) {
    if (altroId === b.localitaId) continue;
    const dMio = mio ? distanceKm(c, mio) : Infinity;
    const dAltro = distanceKm(c, centro);
    if (dAltro + 10 < dMio) {
      add('geografia', 'da-controllare', b.id, `coordinata più vicina a ${luoghi.get(altroId)?.comune} (${dAltro.toFixed(1)} km) che al proprio comune (${dMio === Infinity ? 'n/d' : dMio.toFixed(1) + ' km'})`);
      break;
    }
  }
}

// --- CAP: i CAP di un comune condividono le prime due cifre (area provinciale) ---
const capPerLuogo = new Map<string, string[]>();
for (const b of data.attivita) {
  if (!b.posizione.cap) continue;
  const lista = capPerLuogo.get(b.localitaId) ?? [];
  lista.push(b.posizione.cap);
  capPerLuogo.set(b.localitaId, lista);
}
for (const [id, lista] of capPerLuogo) {
  const prefissi = new Map<string, number>();
  for (const cap of lista) prefissi.set(cap.slice(0, 2), (prefissi.get(cap.slice(0, 2)) ?? 0) + 1);
  const modale = [...prefissi.entries()].sort((a, b) => b[1] - a[1])[0][0];
  for (const b of data.attivita.filter(x => x.localitaId === id && x.posizione.cap && x.posizione.cap.slice(0, 2) !== modale)) {
    add('cap', 'da-controllare', b.id, `CAP ${b.posizione.cap} incoerente con l’area ${modale}xx di ${luoghi.get(id)?.comune}`);
  }
}

// --- Località: regione censita, sigla/regione coerenti, comuni omonimi (ambiguità di ricerca) ---
const perSigla = new Map<string, Set<string>>();
const perComune = new Map<string, Set<string>>();
for (const p of data.localita) {
  if (!REGIONI_ITALIA[p.regioneSlug]) add('localita', 'errore', p.id, `regioneSlug non censito: ${p.regioneSlug}`);
  const chiaveSigla = p.siglaProvincia;
  const vociSigla = perSigla.get(chiaveSigla) ?? new Set();
  vociSigla.add(`${p.provincia} (${p.regione})`);
  perSigla.set(chiaveSigla, vociSigla);
  const chiaveComune = normalize(p.comune);
  const sigleComune = perComune.get(chiaveComune) ?? new Set();
  sigleComune.add(p.siglaProvincia);
  perComune.set(chiaveComune, sigleComune);
}
for (const [sigla, voci] of perSigla) {
  if (voci.size > 1) add('localita', 'errore', sigla, `sigla provinciale associata a più entità: ${[...voci].join(' / ')}`);
}
for (const [comune, sigle] of perComune) {
  if (sigle.size > 1) add('ricerca', 'da-controllare', comune, `omonimia di comune fra province ${[...sigle].join(', ')}: la ricerca per nome non può distinguere`);
}

// --- Contatti: plausibilità dei numeri telefonici e canali disponibili ---
const telefonoOk = (t: string) => {
  const d = t.replace(/[^\d]/g, '').replace(/^00/, '').replace(/^39(?=\d{9,11}$)/, '');
  return /^(0\d{6,10}|3\d{8,9})$/.test(d);
};
for (const b of data.attivita) {
  const c = b.contatti;
  if (c.telefono && !telefonoOk(c.telefono)) add('contatti', 'da-controllare', b.id, `telefono con formato inusuale: ${c.telefono}`);
  const canali = c.telefono || c.email || c.sito || c.whatsapp || c.social.length || b.posizione.indirizzo;
  if (!canali) add('contatti', 'da-controllare', b.id, 'scheda senza alcun canale di contatto né indirizzo');
}

// --- Orari: intervalli sovrapposti nello stesso giorno ---
for (const b of data.attivita) {
  for (const g of b.orari.giorni) {
    const ordinati = [...g.intervalli].sort((a, z) => a.apertura.localeCompare(z.apertura));
    for (let i = 1; i < ordinati.length; i++) {
      if (ordinati[i].apertura < ordinati[i - 1].chiusura) {
        add('orari', 'errore', b.id, `giorno ${g.giorno}: intervalli sovrapposti ${ordinati[i - 1].apertura}-${ordinati[i - 1].chiusura} e ${ordinati[i].apertura}-${ordinati[i].chiusura}`);
      }
    }
  }
}

// --- Storia: anno di fondazione plausibile ---
for (const b of data.attivita) {
  if (b.storia.annoFondazione !== null && b.storia.annoFondazione < 1700) {
    add('storia', 'da-controllare', b.id, `anno di fondazione ${b.storia.annoFondazione}: da verificare`);
  }
}

// --- Duplicati residui da revisionare ---
for (const d of findDuplicates(data)) {
  if (d.esito === 'da-revisionare') add('duplicati', 'da-controllare', `${d.primo} ↔ ${d.secondo}`, d.motivi.join('; '));
}

// --- Ricerca: ogni località deve risolversi e ogni scheda deve essere raggiungibile ---
for (const p of data.localita) {
  const q = `Cerco un orologiaio a ${p.comune}`;
  const { criteri } = interpretaRichiesta(q, data);
  if (criteri.localita !== p.id) {
    add('ricerca', 'errore', p.id, `“${q}” non risolve il comune (ottenuto: ${criteri.localita ?? criteri.localitaNonCensita ?? criteri.provincia ?? criteri.regione ?? 'nulla'})`);
  }
}
for (const b of data.attivita) {
  const p = luoghi.get(b.localitaId)!;
  const perLuogo = searchDirectory(data, { localita: b.localitaId });
  if (!perLuogo.some(r => r.business.id === b.id)) add('ricerca', 'errore', b.id, 'assente dai risultati per il proprio comune');
  for (const s of b.servizi) {
    const res = searchDirectory(data, { localita: b.localitaId, servizio: s.id });
    if (!res.some(r => r.business.id === b.id)) add('ricerca', 'errore', b.id, `assente dai risultati per il servizio ${s.id} a ${p.comune}`);
  }
  const perProvincia = searchDirectory(data, { provincia: p.provinciaSlug });
  if (!perProvincia.some(r => r.business.id === b.id)) add('ricerca', 'errore', b.id, 'assente dai risultati per la propria provincia');
}

// --- Fase live (--live): raggiungibilità degli URL di fonti e contatti, riprendibile ---
type EsitoUrl = { stato: 'ok' | 'protetto' | 'morto' | 'irraggiungibile'; http: number | null; riferimenti: string[]; archivio?: string };
async function faseLive() {
  const precedenti: Record<string, EsitoUrl> = existsSync(REPORT)
    ? (JSON.parse(readFileSync(REPORT, 'utf8')).url ?? {})
    : {};
  const coda = new Map<string, string[]>();
  const registra = (url: string, rif: string) => {
    if (!/^https?:\/\//.test(url) || precedenti[url]) return;
    coda.set(url, [...(coda.get(url) ?? []), rif]);
  };
  for (const f of data.fonti) registra(f.url, `fonte:${f.id}`);
  for (const b of data.attivita) {
    if (b.contatti.sito) registra(b.contatti.sito, `sito:${b.id}`);
    for (const s of b.contatti.social) registra(s, `social:${b.id}`);
    if (b.posizione.coordinate) for (const f of b.posizione.coordinate.fonti) void f;
  }
  console.log(`Fase live: ${coda.size} URL da sondare (${Object.keys(precedenti).length} già note).`);
  const voci = [...coda.entries()];
  let eseguite = 0;
  const esiti: Record<string, EsitoUrl> = { ...precedenti };
  const probe = async ([url, riferimenti]: [string, string[]]) => {
    let stato: EsitoUrl['stato'] = 'irraggiungibile';
    let http: number | null = null;
    // Sonda con curl (IPv4 + user-agent di browser): `fetch` di Node cade su host IPv6/HTTP2 che
    // un browser reale raggiunge senza problemi, producendo falsi «irraggiungibile».
    try {
      const { stdout: out } = await run('curl', ['-4', '-sL', '-o', '/dev/null', '-w', '%{http_code}',
        '--max-time', '12', '-A',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        url], { timeout: 20000 });
      http = Number(out.trim()) || null;
      stato = http && http < 400 ? 'ok'
        : http !== null && [401, 403, 429, 503].includes(http) ? 'protetto'
        : http !== null && [404, 410].includes(http) ? 'morto' : 'irraggiungibile';
    } catch { /* rete/timeout: irraggiungibile */ }
    const voce: EsitoUrl = { stato, http, riferimenti };
    if (stato === 'morto' || stato === 'irraggiungibile') {
      try {
        const r = await fetch(`https://archive.org/wayback/api?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
        const j = await r.json() as { archived_snapshots?: { closest?: { url?: string; status?: string } } };
        const snap = j.archived_snapshots?.closest;
        if (snap?.url && snap.status === '200') voce.archivio = snap.url;
      } catch { /* niente snapshot disponibile */ }
    }
    esiti[url] = voce;
    eseguite++;
    if (eseguite % 25 === 0) console.log(`  ... ${eseguite}/${voci.length}`);
  };
  const paralleli = 12;
  for (let i = 0; i < voci.length; i += paralleli) await Promise.all(voci.slice(i, i + paralleli).map(probe));
  return esiti;
}

// --- Report ---
const url = process.argv.includes('--live') ? await faseLive() : undefined;
const conta = (sez: string) => ({
  errori: sezioni[sez].filter(v => v.gravita === 'errore').length,
  daControllare: sezioni[sez].filter(v => v.gravita === 'da-controllare').length,
});
const riepilogo = Object.fromEntries(Object.keys(sezioni).map(s => [s, conta(s)]));
if (url) {
  const valori = Object.values(url);
  riepilogo.url = {
    errori: valori.filter(v => v.stato === 'morto').length,
    daControllare: valori.filter(v => v.stato === 'irraggiungibile' || v.stato === 'protetto').length,
    ok: valori.filter(v => v.stato === 'ok').length,
  } as never;
}
console.log('\n=== Riepilogo audit ===');
for (const [sez, c] of Object.entries(riepilogo)) console.log(`${sez}: ${JSON.stringify(c)}`);
for (const [sez, voci] of Object.entries(sezioni)) {
  for (const v of voci) console.log(`[${sez}][${v.gravita}] ${v.id}: ${v.dettaglio}`);
}
if (url) {
  for (const [u, v] of Object.entries(url)) {
    if (v.stato !== 'ok') console.log(`[url][${v.stato}] ${u} (HTTP ${v.http ?? '—'}) → ${v.archivio ?? 'nessuno snapshot'} | ${v.riferimenti.join(', ')}`);
  }
}
writeFileSync(REPORT, `${JSON.stringify({
  generatoIl: new Date().toISOString(),
  database: { attivita: data.attivita.length, localita: data.localita.length, fonti: data.fonti.length },
  riepilogo, sezioni, url,
}, null, 2)}\n`);
console.log(`\nReport scritto in ${REPORT}`);
