// Fase 44 — recupero mirato delle fonti per le associazioni «da verificare».
// Non promuove nulla per parole isolate: una citazione diventa prova solo se il classificatore
// la legge come servizio svolto per il cliente. Le pagine non raggiungibili restano da verificare.
// La cache su disco rende il lavoro ripartibile: una seconda esecuzione non rifà le richieste.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { directory } from '../site/src/lib/directory.ts';
import { contestoEvidenza } from '../site/src/lib/evidenza-contesto.ts';

const CACHE = '.runtime/fase44-fonti';
const REGISTRO = 'data/evidenze/servizi.json';
const REPORT = 'data/reports/fase44-recupero.json';
const DATA = '2026-11-06';
const PRIORITARI = new Set(['revisione', 'riparazione', 'riparazione-meccanici', 'riparazione-automatici', 'restauro-vintage', 'pendoleria', 'assistenza']);
const KEYWORD: Record<string, RegExp> = {
  revisione: /revision|tagliand|smontaggio completo|messa a punto del movimento/i,
  riparazione: /ripar|aggiust|sistemazion|ripristin|intervent[oi] tecnici/i,
  'riparazione-meccanici': /meccanic|carica manuale|moviment[oi] a carica manuale/i,
  'riparazione-automatici': /automatic|massa oscillante|rotore|ricarica automatica/i,
  'restauro-vintage': /restaur|conservativ|orologi d.epoca|vintage|antich/i,
  pendoleria: /pendol|cuc[uù]|orologi? a muro|orologio da parete|carrillon/i,
  assistenza: /assistenz|centro (?:di )?servizio|service/i,
};
mkdirSync(CACHE, { recursive: true });

type Evidenza = {
  attivitaId: string; servizio: string; fonteId: string; url: string; titolo: string;
  estratto: string; tipoFonte: string; verificataIl: string;
  stato: 'confermata' | 'da-verificare'; ruolo: string; metodo: string; nota?: string;
};
const registro = JSON.parse(readFileSync(REGISTRO, 'utf8')) as { evidenze: Evidenza[] };
// FASE44_RESET=1 riporta a «da verificare» i soli recuperi Fase 44: si rifanno dalla cache.
if (process.env.FASE44_RESET === '1') {
  let azzerate = 0;
  for (const e of registro.evidenze) {
    if (e.nota?.startsWith('Fase 44')) { e.stato = 'da-verificare'; e.estratto = ''; delete e.nota; azzerate++; }
  }
  console.log(`reset ${azzerate} recuperi Fase 44`);
}
const attivita = new Map(directory.attivita.map(b => [b.id, b]));
const fonti = new Map(directory.fonti.map(f => [f.id, f]));

const chiave = (attivitaId: string, servizio: string) => `${attivitaId}::${servizio}`;
const esistenti = new Map(registro.evidenze.map(e => [chiave(e.attivitaId, e.servizio), e]));

// Coda: tutte le coppie prioritarie senza prova verificata, con l'URL della fonte dichiarata.
type Lavoro = { attivitaId: string; servizio: string; url: string; fonteId: string; titolo: string; tipoFonte: string };
const coda: Lavoro[] = [];
for (const e of registro.evidenze) {
  if (e.stato === 'confermata' || !PRIORITARI.has(e.servizio)) continue;
  coda.push({ attivitaId: e.attivitaId, servizio: e.servizio, url: e.url, fonteId: e.fonteId, titolo: e.titolo, tipoFonte: e.tipoFonte });
}
// Attività che elencano un servizio prioritario senza alcuna evidenza registrata.
for (const b of directory.attivita) {
  for (const claim of b.servizi) {
    if (!PRIORITARI.has(claim.id) || esistenti.has(chiave(b.id, claim.id))) continue;
    const fonte = fonti.get(claim.fonti[0]);
    if (!fonte) continue;
    coda.push({ attivitaId: b.id, servizio: claim.id, url: fonte.url, fonteId: fonte.id, titolo: fonte.titolo, tipoFonte: fonte.tipo });
  }
}

const decodifica = (s: string) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&ograve;/g, 'ò').replace(/&igrave;/g, 'ì')
  .replace(/&ugrave;/g, 'ù').replace(/&eacute;/g, 'é').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-')
  .replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/gi, ' ');

export function testoPagina(html: string): string {
  return decodifica(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

// Frasi candidate: la prova deve stare in una frase, non in una pagina che contiene la parola.
function frasi(testo: string, servizio: string): string[] {
  const regola = KEYWORD[servizio];
  if (!regola) return [];
  return testo.split(/(?<=[.!?;])\s+/).map(f => f.trim()).filter(f => f.length >= 40 && f.length <= 700 && regola.test(f));
}

// La citazione si ritaglia intorno alla parola chiave: la card deve mostrare la prova, non un preambolo.
// Il contesto deve restare orologiero: «laboratorio orafo per riparazioni e gioielli» non prova
// un intervento su orologi. La classificazione semantica decide, non la parola trovata.
function finestra(frase: string, servizio: string): string | null {
  const regola = KEYWORD[servizio];
  const trovato = regola?.exec(frase);
  if (!trovato) return null;
  const inizioParola = frase.lastIndexOf(' ', Math.max(0, trovato.index - 110)) + 1;
  let fine = frase.indexOf(' ', Math.min(frase.length, trovato.index + 170));
  if (fine === -1) fine = frase.length;
  const w = frase.slice(Math.max(0, inizioParola), fine).replace(/\s+/g, ' ').trim();
  if (w.length < 50) return null;
  if (servizio !== 'assistenza' && !/orolog|moviment|segnatempo|pendol|cassa|quadrante/i.test(w)) return null;
  const contesto = contestoEvidenza(w);
  if (contesto !== 'offerto' && contesto !== 'terzi' && !(servizio === 'assistenza' && contesto === 'ufficiale')) return null;
  // La parola chiave deve appartenere alla frase che offre il servizio: un menù che elenca
  // «REVISIONI» prima di «Effettuiamo controlli» non è una dichiarazione di revisione.
  const dopoVerbo = /(?:offriamo|effettuiamo|eseguiamo|svolgiamo|ci occupiamo|disponiamo|siamo in grado di|laboratorio (?:interno|attrezzato|di))/i.exec(w);
  const chiaveDopoOfferta = dopoVerbo && trovato.index >= dopoVerbo.index && trovato.index - dopoVerbo.index <= 140;
  const esplicito = /servizio (?:di|per) (?:revisione|riparazione|restauro|assistenza|manutenzione)/i.test(w)
    || /(?:revisioni|riparazioni|restauri|assistenze) (?:orologi|di orologi|accurate|complete|periodiche)/i.test(w);
  return chiaveDopoOfferta || esplicito ? w : null;
}

async function scarica(url: string): Promise<{ stato: number; testo: string } | null> {
  const file = `${CACHE}/${createHash('sha1').update(url).digest('hex')}.json`;
  if (existsSync(file)) {
    const c = JSON.parse(readFileSync(file, 'utf8')) as { stato: number; testo: string };
    return c;
  }
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; OrologiaiBot/1.0; +https://www.orologiai.it/)', accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow', signal: AbortSignal.timeout(12_000),
    });
    const html = res.ok ? await res.text() : '';
    const cache = { stato: res.status, testo: html ? testoPagina(html) : '' };
    writeFileSync(file, JSON.stringify(cache));
    return cache;
  } catch {
    writeFileSync(file, JSON.stringify({ stato: 0, testo: '' }));
    return null;
  }
}

const esiti = { recuperate: [] as string[], senzaProva: [] as string[], nonAccessibili: [] as string[], giaConfermate: [] as string[] };
const inizio = Date.now();
let elaborati = 0;
const visti = new Set<string>();
for (const lavoro of coda) {
  if (Date.now() - inizio > 210_000) break;
  const k = chiave(lavoro.attivitaId, lavoro.servizio);
  if (visti.has(k)) continue;
  visti.add(k);
  elaborati++;
  // Il contratto delle evidenze ammette solo URL HTTPS: una fonte http resta da verificare.
  if (!lavoro.url.startsWith('https://')) { esiti.nonAccessibili.push(`${k} · http`); continue; }
  const pagina = await scarica(lavoro.url);
  if (!pagina || pagina.stato < 200 || pagina.stato >= 400 || !pagina.testo) {
    esiti.nonAccessibili.push(`${k} · ${pagina?.stato ?? 'rete'}`);
    continue;
  }
  const candidate = frasi(pagina.testo, lavoro.servizio);
  const scelta = candidate.map(f => finestra(f, lavoro.servizio)).find((w): w is string => Boolean(w));
  if (!scelta) {
    esiti.senzaProva.push(`${k} · frasi ${candidate.length} · ${candidate[0]?.slice(0, 90) ?? 'nessuna'}`);
    continue;
  }
  const esistente = esistenti.get(k);
  const ruolo = /\bcentro (?:di )?assistenza|service (?:center|point)|assistenza autorizzata/i.test(scelta) ? 'centro-assistenza-ufficiale'
    : /\blaboratorio (?:interno|attrezzato)|officina interna/i.test(scelta) ? 'laboratorio-interno' : 'non-specificato';
  const voce: Evidenza = {
    attivitaId: lavoro.attivitaId, servizio: lavoro.servizio, fonteId: lavoro.fonteId, url: lavoro.url,
    titolo: lavoro.titolo, estratto: scelta.slice(0, 250).trim(), tipoFonte: lavoro.tipoFonte,
    verificataIl: DATA, stato: 'confermata', ruolo, metodo: 'testo-pagina', nota: 'Fase 44: citazione recuperata e classificata sul testo della pagina.',
  };
  if (esistente) Object.assign(esistente, voce);
  else registro.evidenze.push(voce);
  esiti.recuperate.push(`${k} · ${scelta.slice(0, 120)}`);
}
writeFileSync(REGISTRO, JSON.stringify(registro, null, 1) + '\n');
const precedente = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};
const prima = precedente.esiti ?? precedente;
const unisci = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];
const report = {
  aggiornatoIl: DATA,
  criterio: 'Una pagina è prova solo se una sua frase descrive il servizio svolto per il cliente; il resto resta da verificare.',
  elaborati,
  esiti: {
    recuperate: unisci(prima.recuperate, esiti.recuperate),
    senzaProva: unisci(prima.senzaProva, esiti.senzaProva),
    nonAccessibili: unisci(prima.nonAccessibili, esiti.nonAccessibili),
  },
};
writeFileSync(REPORT, JSON.stringify(report, null, 1) + '\n');
console.log(`elaborati ${elaborati} · recuperate ${esiti.recuperate.length} · senza prova ${esiti.senzaProva.length} · non accessibili ${esiti.nonAccessibili.length}`);
for (const r of esiti.recuperate) console.log(`+ ${r}`);
