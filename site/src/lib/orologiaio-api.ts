import { z } from 'zod';
import { interpretaConProvider, MAX_MESSAGGIO, type Criteri } from './assistant.ts';
import { geminiProvider, type FetchLike } from './gemini.ts';
import type { Directory } from './schema.ts';

export const MAX_BODY_BYTES = 1024;
export const RATE_LIMIT_PER_MINUTE = 10;
export const SERVER_TIMEOUT_MS = 8000;

export type ModalitaAssistente = 'ai' | 'non-configurato' | 'fallback';
export type RispostaOrologiaio = {
  modalita: ModalitaAssistente;
  avviso: string | null;
  criteri: Criteri;
  chiarimenti: string[];
};

export type Env = { GEMINI_API_KEY?: string };
export type Deps = {
  dir: Directory;
  fetch?: FetchLike;
  limiter?: RateLimiter;
  timeoutMs?: number;
};

const richiestaSchema = z.object({ messaggio: z.string() }).strict();

// Limite best-effort per istanza: non sostituisce una regola di rate limiting della piattaforma (vedi docs/ASSISTENTE-AI.md).
export type RateLimiter = { allow(chiave: string, now: number): boolean };
export function creaRateLimiter(maxPerMinute = RATE_LIMIT_PER_MINUTE): RateLimiter {
  const finestre = new Map<string, number[]>();
  return {
    allow(chiave, now) {
      if (finestre.size > 5000) finestre.clear();
      const recenti = (finestre.get(chiave) ?? []).filter(t => now - t < 60_000);
      if (recenti.length >= maxPerMinute) { finestre.set(chiave, recenti); return false; }
      recenti.push(now);
      finestre.set(chiave, recenti);
      return true;
    },
  };
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
const errore = (status: number, messaggio: string, extra: Record<string, string> = {}) =>
  json({ errore: messaggio }, status, extra);

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

// Gestisce una richiesta all'Orologiaio. Non restituisce mai chiavi, stack trace o dettagli del provider.
export async function handleOrologiaio(request: Request, env: Env, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return errore(405, 'Metodo non consentito.', { allow: 'POST' });

  // Richieste da altre origini non sono ammesse: il form è della stessa pagina.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return errore(403, 'Origine non consentita.');

  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return errore(415, 'Usa Content-Type application/json.');
  }

  const limiter = deps.limiter ?? creaRateLimiter();
  const chiave = request.headers.get('cf-connecting-ip') ?? 'sconosciuto';
  if (!limiter.allow(chiave, Date.now())) {
    return errore(429, 'Troppe richieste in poco tempo. Riprova tra un minuto.', { 'retry-after': '60' });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return errore(413, 'Richiesta troppo grande.');

  let corpo: unknown;
  try { corpo = JSON.parse(raw); } catch { return errore(400, 'JSON non valido.'); }
  const parsed = richiestaSchema.safeParse(corpo);
  if (!parsed.success) return errore(400, 'Richiesta non valida: serve solo il campo “messaggio”.');

  const messaggio = parsed.data.messaggio.trim();
  if (!messaggio) return errore(400, 'Scrivi una richiesta.');
  if (messaggio.length > MAX_MESSAGGIO) return errore(413, `Il messaggio supera ${MAX_MESSAGGIO} caratteri.`);

  const apiKey = (env.GEMINI_API_KEY ?? '').trim();
  const provider = apiKey ? geminiProvider(apiKey, deps.dir, deps.fetch ?? defaultFetch) : null;

  try {
    const esito = await interpretaConProvider(messaggio, deps.dir, provider, deps.timeoutMs ?? SERVER_TIMEOUT_MS);
    if (!apiKey) {
      return json({
        modalita: 'non-configurato', avviso: 'Il modello AI non è configurato su questo ambiente: interpretazione locale.',
        criteri: esito.criteri, chiarimenti: esito.chiarimenti,
      } satisfies RispostaOrologiaio);
    }
    if (esito.origine === 'provider') {
      return json({ modalita: 'ai', avviso: null, criteri: esito.criteri, chiarimenti: esito.chiarimenti } satisfies RispostaOrologiaio);
    }
    return json({
      modalita: 'fallback', avviso: 'Il modello AI non ha risposto in modo utilizzabile: interpretazione locale.',
      criteri: esito.criteri, chiarimenti: esito.chiarimenti,
    } satisfies RispostaOrologiaio);
  } catch {
    return errore(500, 'Errore interno: riprova o usa la ricerca con i filtri.');
  }
}
