// Deduplica i candidati Fase 32 contro tutto il catalogo e verifica le fonti.
// - duplicato se: stesso sito (host) di una scheda, oppure stessa città + nome simile
// - per i nuovi: scarica la pagina di prova e cerca indizi orologieri, l'indirizzo e il CAP
// Uso: node scripts/fase32-verifica-candidati.mjs [--jobs 6]
import { readFileSync, writeFileSync } from 'node:fs';

const CAT = 'site/data/directory.json';
const IN = 'data/staging/fase32-candidati.txt';
const OUT = 'data/reports/fase32-verifica-candidati.json';

const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-');
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return null; } };
const tokens = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 2 && !['orologeria', 'orologiaio', 'gioielleria', 'laboratorio', 'della', 'delle', 'degli', 'dello', 'srl', 'snc', 'sas'].includes(t)));

const schema = JSON.parse(readFileSync(CAT, 'utf8'));
const locById = new Map(schema.localita.map((l) => [l.id, l]));
const perComune = new Map();
for (const a of schema.attivita) {
  const l = locById.get(a.localitaId);
  if (!l) continue;
  const k = l.comune;
  if (!perComune.has(k)) perComune.set(k, []);
  perComune.get(k).push(a);
}
const perHost = new Map();
for (const a of schema.attivita) {
  const h = host(a.contatti?.sito);
  if (h) perHost.set(h, a);
}

const righe = readFileSync(IN, 'utf8').split('\n').map((r) => r.trim()).filter((r) => r && !r.startsWith('#'));
const candidati = [];
const problemi = [];
for (const riga of righe) {
  const c = riga.split('|').map((x) => x.trim());
  if (c.length < 9) { problemi.push({ riga, motivo: 'campi insufficienti' }); continue; }
  const [nome, comune, sigla, indirizzo, cap, tel, sito, url, evidenza] = c;
  const id = slug(`${nome} ${comune}`);
  const voce = { id, nome, comune, sigla, indirizzo: indirizzo || null, cap: cap || null, telefono: tel || null, sito: sito || null, url, evidenza };
  // duplicato per sito
  const h = host(sito);
  if (h && perHost.has(h)) { voce.esito = 'duplicato'; voce.duplicatoDi = perHost.get(h).id; voce.motivo = 'stesso sito di una scheda esistente'; candidati.push(voce); continue; }
  // duplicato per nome nella stessa città
  const stessi = perComune.get(comune) ?? [];
  let migliore = null; let punteggio = 0;
  const t = tokens(nome);
  for (const a of stessi) {
    const u = tokens(a.nome);
    let inter = 0; for (const x of t) if (u.has(x)) inter++;
    const j = inter / Math.max(1, new Set([...t, ...u]).size);
    if (j > punteggio) { punteggio = j; migliore = a; }
  }
  if (migliore && punteggio >= 0.4) { voce.esito = 'duplicato'; voce.duplicatoDi = migliore.id; voce.motivo = `nome simile nella stessa città (${punteggio.toFixed(2)})`; candidati.push(voce); continue; }
  // città già presente ma nome diverso: candidato nuovo, da verificare
  voce.esito = 'da-verificare';
  voce.cittaGiaCoperta = stessi.length > 0;
  candidati.push(voce);
}

const nuovo = candidati.filter((c) => c.esito === 'da-verificare');
const jobs = Math.max(1, Number(process.argv[process.argv.indexOf('--jobs') + 1]) || 6);
let cursore = 0;
async function controlla(c) {
  try {
    const res = await fetch(c.url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica fonti)' }, signal: AbortSignal.timeout(20000) });
    const html = await res.text();
    const testo = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const basso = testo.toLowerCase();
    const chiavi = ['orolog', 'riparazion', 'revision', 'restaur', 'moviment', 'assistenz', 'laborator', 'pendol', 'quadrant'];
    const trovate = chiavi.filter((k) => basso.includes(k));
    const via = (c.indirizzo ?? '').split(/[ ,]/)[0];
    const capOk = c.cap ? testo.includes(c.cap) : null;
    const viaOk = via && via.length > 3 ? basso.includes(via.toLowerCase()) : null;
    const telOk = c.telefono ? testo.replace(/[^\d]/g, '').includes(c.telefono.replace(/[^\d]/g, '').slice(-7)) : null;
    c.verifica = {
      stato: res.status, urlFinale: res.url, caratteriTesto: testo.length,
      chiaviOrologiere: trovate, capPresente: capOk, viaPresente: viaOk, telefonoPresente: telOk,
      esito: res.ok && trovate.length >= 3 && (capOk !== false) && (viaOk !== false) ? 'confermata' : 'da-controllare',
    };
  } catch (e) {
    c.verifica = { esito: 'errore', errore: String(e?.message ?? e) };
  }
}
await Promise.all(Array.from({ length: jobs }, async () => { while (cursore < nuovo.length) { const c = nuovo[cursore++]; await controlla(c); } }));

// servizi e tipologie dalle parole della fonte (conservativo)
for (const c of nuovo) {
  if (c.verifica?.esito === 'errore') continue;
  const e = c.evidenza.toLowerCase();
  const s = new Set();
  if (e.includes('riparazion') || e.includes('ripara ')) s.add('riparazione');
  if (e.includes('revision')) s.add('revisione');
  if (e.includes('restaur')) s.add('restauro-vintage');
  if (e.includes('pendol') || e.includes('cucù') || e.includes('kukù') || e.includes('sveglie')) s.add('pendoleria');
  if (e.includes('tasca')) s.add('orologi-tasca');
  if (e.includes('assistenza')) s.add('assistenza');
  if (e.includes('lucidatur')) s.add('lucidatura');
  if (e.includes('ricambi')) s.add('ricambi');
  if (e.includes('pila') || e.includes('batteri')) s.add('batterie');
  if (e.includes('cinturin')) s.add('cinturini');
  c.serviziProposti = [...s];
  c.tipiProposti = ['orologeria', ...(/laborator|revision|restaur|orologiai|maestr/.test(e) ? ['laboratorio'] : [])];
}

writeFileSync(OUT, JSON.stringify({ data: new Date().toISOString().slice(0, 10), totale: candidati.length, nuovi: nuovo.length, duplicati: candidati.length - nuovo.length, problemi, candidati }, null, 2) + '\n');
const conf = nuovo.filter((c) => c.verifica?.esito === 'confermata').length;
const ctrl = nuovo.filter((c) => c.verifica?.esito === 'da-controllare').length;
const err = nuovo.filter((c) => c.verifica?.esito === 'errore').length;
console.log(JSON.stringify({ totale: candidati.length, nuovi: nuovo.length, duplicati: candidati.length - nuovo.length, confermate: conf, daControllare: ctrl, errori: err, out: OUT }));
for (const c of candidati.filter((x) => x.esito === 'duplicato')) console.log(`DUP  ${c.nome} (${c.comune}) -> ${c.duplicatoDi} [${c.motivo}]`);
for (const c of nuovo) console.log(`${c.verifica?.esito === 'confermata' ? 'OK  ' : c.verifica?.esito === 'errori' ? 'ERR ' : 'CTRL'} ${c.id} | ${c.verifica?.stato ?? c.verifica?.errore} | cap=${c.verifica?.capPresente} via=${c.verifica?.viaPresente} | ${c.serviziProposti.join(',')}`);
