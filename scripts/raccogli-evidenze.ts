// Raccolta delle evidenze documentali dei servizi.
// Legge le fonti già censite nel catalogo, scarica una sola volta ogni URL pubblico, cerca le
// frasi che affermano un servizio e salva estratti brevi con la provenienza. Il file prodotto è
// incrementale: le fonti già consultate oggi non vengono riscaricate e le evidenze precedenti non
// vengono cancellate se un sito non risponde.
//
// Uso: npx tsx scripts/raccogli-evidenze.ts [--max=200] [--solo=revisione,riparazione] [--rifai]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  REGOLE_SERVIZIO, RUOLI_FONTE, etichettaFonte, normalizzaEstratto,
  type EvidenzaRuolo, type ServizioTecnico,
} from '../site/src/lib/evidenza-regole.ts';

type Directory = {
  attivita: { id: string; servizi: { id: string; fonti: string[] }[] }[];
  fonti: { id: string; tipo: string; url: string; titolo: string; consultataIl?: string }[];
};
type Evidenza = {
  attivitaId: string; servizio: ServizioTecnico; fonteId: string; url: string;
  titolo: string; estratto: string; tipoFonte: string; verificataIl: string;
  stato: 'confermata' | 'da-verificare'; ruolo: EvidenzaRuolo; metodo: 'testo-pagina';
};
type File = {
  versione: 1; aggiornatoIl: string;
  fonti: Record<string, { esito: 'ok' | 'http-errore' | 'rete-errore' | 'non-testuale'; stato?: number; consultataIl: string }>;
  evidenze: Evidenza[];
};

const FILE = 'data/evidenze/servizi.json';
const UA = 'Orologiai.it verifiche editoriali (+https://www.orologiai.it; contatto@orologiai.it)';
const MAX_BYTES = 400_000;
const TIMEOUT_MS = 10_000;

const arg = (nome: string) => process.argv.find(a => a.startsWith(`--${nome}=`))?.split('=')[1];
const MAX = Number(arg('max') ?? 0);
const SOLO = arg('solo')?.split(',').filter(Boolean) as ServizioTecnico[] | undefined;
const RIFAI = process.argv.includes('--rifai');

const priorita: ServizioTecnico[] = ['revisione', 'riparazione', 'riparazione-meccanici', 'riparazione-automatici', 'restauro-vintage', 'pendoleria', 'assistenza', 'batterie', 'cinturini', 'vendita', 'manutenzione', 'ricambi', 'lucidatura', 'orologi-tasca', 'riparazione-quarzo', 'vendita-usati', 'gioielleria'];

function decodifica(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|br|section|article|td)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d{2,5});/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]{2,4});/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'").replace(/&egrave;/gi, 'è').replace(/&agrave;/gi, 'à')
    .replace(/&ograve;/gi, 'ò').replace(/&igrave;/gi, 'ì').replace(/&ugrave;/gi, 'ù')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

// Frasi brevi e leggibili: si escludono menu, cookie banner e testi senza verbo.
function frasi(testo: string): string[] {
  return testo.split(/(?<=[.!?;])\s+/).map(f => f.trim()).filter(f => f.length >= 40 && f.length <= 320);
}

function trovaEstratto(testo: string, servizio: ServizioTecnico): { estratto: string; ruolo: EvidenzaRuolo } | null {
  const regola = REGOLE_SERVIZIO[servizio];
  const candidate = frasi(testo).filter(f => regola.test(f.toLowerCase()));
  if (candidate.length === 0) return null;
  // Preferisce la frase che nomina esplicitamente l'orologio o il laboratorio.
  const migliore = candidate.find(f => /orolog|laborator|riparaz|revision|restaur|pendol/i.test(f)) ?? candidate[0];
  const ruolo = RUOLI_FONTE.find(r => r.re.test(migliore.toLowerCase()))?.ruolo ?? 'non-specificato';
  const estratto = normalizzaEstratto(migliore);
  return estratto.length >= 25 ? { estratto, ruolo } : null;
}

async function scarica(url: string): Promise<{ esito: File['fonti'][string]['esito']; stato?: number; testo?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, redirect: 'follow', signal: controller.signal });
    if (!res.ok) return { esito: 'http-errore', stato: res.status };
    const tipo = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml|text\/plain/i.test(tipo)) return { esito: 'non-testuale', stato: res.status };
    const reader = res.body?.getReader();
    if (!reader) return { esito: 'non-testuale', stato: res.status };
    const pezzi: Uint8Array[] = [];
    let totale = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pezzi.push(value); totale += value.length;
      if (totale > MAX_BYTES) { await reader.cancel(); break; }
    }
    const html = new TextDecoder('utf-8').decode(Buffer.concat(pezzi.map(p => Buffer.from(p))));
    return { esito: 'ok', stato: res.status, testo: decodifica(html) };
  } catch {
    return { esito: 'rete-errore' };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const dir = JSON.parse(await readFile('site/data/directory.json', 'utf8')) as Directory;
  const oggi = new Date().toISOString().slice(0, 10);
  let precedente: File = { versione: 1, aggiornatoIl: oggi, fonti: {}, evidenze: [] };
  try { precedente = JSON.parse(await readFile(FILE, 'utf8')) as File; } catch { /* prima esecuzione */ }

  const fontiPerId = new Map(dir.fonti.map(f => [f.id, f]));
  const serviziOrdinati = SOLO ?? priorita;
  // Coppie (attività, servizio, fonte): una sola richiesta per URL, tutte le associazioni riempite.
  const richieste = new Map<string, { url: string; coppie: { attivitaId: string; servizio: ServizioTecnico; fonteId: string }[] }>();
  for (const servizio of serviziOrdinati) {
    for (const b of dir.attivita) {
      const voce = b.servizi.find(s => s.id === servizio);
      if (!voce) continue;
      for (const fonteId of voce.fonti) {
        const fonte = fontiPerId.get(fonteId);
        if (!fonte || !/^https:\/\//.test(fonte.url)) continue;
        const gruppo = richieste.get(fonte.url) ?? { url: fonte.url, coppie: [] };
        gruppo.coppie.push({ attivitaId: b.id, servizio, fonteId });
        richieste.set(fonte.url, gruppo);
      }
    }
  }

  const daFare = [...richieste.values()].filter(r => RIFAI || !precedente.fonti[r.url]);
  const limite = MAX > 0 ? daFare.slice(0, MAX) : daFare;
  console.log(`URL unici: ${richieste.size}; già consultati: ${richieste.size - daFare.length}; da scaricare ora: ${limite.length}`);

  const fonti = { ...precedente.fonti };
  const evidenze = new Map(precedente.evidenze.map(e => [`${e.attivitaId}|${e.servizio}`, e]));
  let confermate = 0;
  let errori = 0;
  const concorrenza = 6;
  for (let i = 0; i < limite.length; i += concorrenza) {
    const blocco = limite.slice(i, i + concorrenza);
    await Promise.all(blocco.map(async ({ url, coppie }) => {
      const esito = await scarica(url);
      fonti[url] = { esito: esito.esito, stato: esito.stato, consultataIl: oggi };
      if (esito.esito !== 'ok' || !esito.testo) { errori++; return; }
      const testo = esito.testo.toLowerCase();
      for (const coppia of coppie) {
        const fonte = fontiPerId.get(coppia.fonteId)!;
        const trovato = trovaEstratto(esito.testo, coppia.servizio);
        // La regola deve valere anche sul testo normalizzato completo, non solo sulla frase scelta.
        const regola = REGOLE_SERVIZIO[coppia.servizio];
        const esiste = trovato && regola.test(testo);
        const chiave = `${coppia.attivitaId}|${coppia.servizio}`;
        const precedenteVoce = evidenze.get(chiave);
        if (esiste) {
          confermate++;
          evidenze.set(chiave, {
            attivitaId: coppia.attivitaId, servizio: coppia.servizio, fonteId: fonte.id, url: fonte.url,
            titolo: etichettaFonte(fonte.titolo, fonte.url), estratto: trovato.estratto,
            tipoFonte: fonte.tipo, verificataIl: oggi, stato: 'confermata', ruolo: trovato.ruolo, metodo: 'testo-pagina',
          });
        } else if (!precedenteVoce) {
          evidenze.set(chiave, {
            attivitaId: coppia.attivitaId, servizio: coppia.servizio, fonteId: fonte.id, url: fonte.url,
            titolo: etichettaFonte(fonte.titolo, fonte.url), estratto: '', tipoFonte: fonte.tipo,
            verificataIl: oggi, stato: 'da-verificare', ruolo: 'non-specificato', metodo: 'testo-pagina',
          });
        }
        // Se esisteva già una conferma e oggi il sito non risponde, la conferma resta: si aggiunge solo la consultazione.
      }
    }));
    if (i % 60 === 0) console.log(`  ${Math.min(i + concorrenza, limite.length)}/${limite.length}`);
  }

  const elenco = [...evidenze.values()].sort((a, b) => a.attivitaId.localeCompare(b.attivitaId) || a.servizio.localeCompare(b.servizio));
  const file: File = { versione: 1, aggiornatoIl: oggi, fonti, evidenze: elenco };
  await mkdir('data/evidenze', { recursive: true });
  await writeFile(FILE, `${JSON.stringify(file)}\n`);
  const sha = createHash('sha256').update(JSON.stringify(file)).digest('hex');
  const perStato = (s: string) => elenco.filter(e => e.stato === s).length;
  console.log(`Evidenze scritte: ${elenco.length} (confermate ${perStato('confermata')}, da verificare ${perStato('da-verificare')}); fonti in cache ${Object.keys(fonti).length}; errori di rete/HTTP ${errori}; sha256 ${sha.slice(0, 16)}`);
}

await main();
