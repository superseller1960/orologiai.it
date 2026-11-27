import type { Directory } from './schema.ts';
import { creaRateLimiter, ipClient, type RateLimiter } from './orologiaio-api.ts';

// Recupero verificabile delle fonti esterne GIÀ CENSITE nel catalogo.
// Non è una ricerca web generale: l'URL deve essere identico a quello registrato in una fonte
// della scheda, quindi il client non può far richiedere al Worker indirizzi arbitrari (nessun SSRF).
export const TIMEOUT_MS = 4000;
export const MAX_BYTES = 120_000;
export const MAX_SNIPPET = 600;
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const CACHE_MAX = 200;

export type FonteRecuperata = {
  url: string;
  titolo: string;
  tipo: string;
  consultataIl: string;
  snippet: string;
  troncato: boolean;
  recuperatoIl: string;
};

const entita: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };

// Testo leggibile senza parser HTML: si scartano script, stili e marcatori, poi si compattano gli spazi.
export function testoDaHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, m => entita[m] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Solo https, senza credenziali, e solo se l'URL coincide con una fonte registrata.
export function fonteAmmessa(dir: Directory, raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const fonte = dir.fonti.find(f => f.url === raw || f.url === url.href);
  return fonte ? { fonte, href: url.href } : null;
}

export type Deps = { dir: Directory; fetch?: (input: string, init?: RequestInit) => Promise<Response>; limiter?: RateLimiter; timeoutMs?: number; now?: () => number };

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=3600', ...extra },
  });

export async function handleFonte(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'GET') return json({ errore: 'Metodo non consentito.' }, 405, { allow: 'GET' });
  const limiter = deps.limiter ?? creaRateLimiter(20);
  if (!limiter.allow(ipClient(request.headers), (deps.now ?? Date.now)())) {
    return json({ errore: 'Troppe richieste in poco tempo.' }, 429, { 'retry-after': '60' });
  }
  const raw = new URL(request.url).searchParams.get('url') ?? '';
  const ammesso = fonteAmmessa(deps.dir, raw);
  if (!ammesso) return json({ errore: 'Fonte non censita nel catalogo.' }, 404);
  const { fonte, href } = ammesso;
  const doFetch = deps.fetch ?? ((input, init) => fetch(input, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? TIMEOUT_MS);
  try {
    // redirect: 'manual' — un rinvio verso un altro host non deve essere seguito dal Worker.
    const res = await doFetch(href, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { accept: 'text/html,text/plain;q=0.9', 'user-agent': 'Orologiai.it/1.0 (+https://www.orologiai.it/metodo/)' },
    });
    if (res.status >= 300 && res.status < 400) return json({ errore: 'La fonte reindirizza altrove: apri il collegamento originale.' }, 502);
    if (!res.ok) return json({ errore: `La fonte ha risposto ${res.status}.` }, 502);
    const tipo = res.headers.get('content-type') ?? '';
    if (!/text\/html|text\/plain/i.test(tipo)) return json({ errore: 'Formato della fonte non testuale.' }, 415);
    const testo = testoDaHtml((await res.text()).slice(0, MAX_BYTES));
    if (!testo) return json({ errore: 'La fonte non contiene testo leggibile.' }, 502);
    const recuperato: FonteRecuperata = {
      url: href, titolo: fonte.titolo, tipo: fonte.tipo, consultataIl: fonte.consultataIl,
      snippet: testo.slice(0, MAX_SNIPPET), troncato: testo.length > MAX_SNIPPET,
      recuperatoIl: new Date((deps.now ?? Date.now)()).toISOString().slice(0, 10),
    };
    return json(recuperato);
  } catch {
    return json({ errore: 'La fonte non è raggiungibile in questo momento.' }, 504);
  } finally {
    clearTimeout(timer);
  }
}

// Cache per isolate: evita di ripetere la stessa richiesta e limita il carico sulle fonti.
export function creaCacheFonte(max = CACHE_MAX, ttl = CACHE_TTL_MS) {
  const voci = new Map<string, { scade: number; valore: FonteRecuperata }>();
  return {
    get(url: string, now = Date.now()): FonteRecuperata | null {
      const voce = voci.get(url);
      if (!voce) return null;
      if (voce.scade <= now) { voci.delete(url); return null; }
      return voce.valore;
    },
    set(url: string, valore: FonteRecuperata, now = Date.now()) {
      if (voci.size >= max) voci.delete(voci.keys().next().value as string);
      voci.set(url, { scade: now + ttl, valore });
    },
  };
}
