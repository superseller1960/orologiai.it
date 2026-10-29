import type { AssistantProvider, Criteri } from './assistant.ts';
import type { Directory } from './schema.ts';
import { istruzioniSistema, schemaCriteri } from './gemini.ts';

// Adapter per l'inferenza di Cloudflare (Workers AI). Il modello è fisso e usa la JSON Mode:
// una sola chiamata per messaggio e al massimo MAX_OUTPUT_TOKENS token di output.
// Istruzioni di sistema, enum, limiti di lunghezza e validazione del provider restano identici
// a quelli del percorso Gemini (condivisi da gemini.ts, che non viene modificato): il modello
// può solo interpretare la richiesta, i fatti restano del database locale e vengono scelti dal
// motore di ricerca, mai inventati dal modello. Documentazione: docs/ASSISTENTE-AI.md.
// Modello verificato con JSON Mode sul piano Workers Free (incluso, nessuna fatturazione richiesta).
// Il vecchio @cf/meta/llama-3.1-8b-instruct risulta ritirato da Cloudflare e fallisce con errore.
export const CLOUDFLARE_AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const MAX_OUTPUT_TOKENS = 400;

// Binding `AI` iniettato dal runtime di Cloudflare. Interfaccia minimale deliberata: il progetto
// non dipende da @cloudflare/workers-types e nei test il binding è simulato senza rete né credenziali.
export type WorkersAiBinding = { run(model: string, input: Record<string, unknown>): Promise<unknown> };

// Corpo della chiamata: solo messaggio del cliente, contesto già validato nei turni precedenti ed
// elenchi del database. Mai IP, header, coordinate, identificativi o dati personali del visitatore.
export function corpoRichiestaAI(dir: Directory, messaggio: string, contesto?: Criteri) {
  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: istruzioniSistema(dir) },
  ];
  // Come nel percorso Gemini: il contesto è un turno separato, non si mescola al messaggio attuale.
  if (contesto && Object.keys(contesto).length > 0) {
    messages.push({
      role: 'user',
      content: `Contesto della conversazione fino a qui (criteri già confermati): ${JSON.stringify(contesto)}`,
    });
    messages.push({ role: 'user', content: 'Nuovo messaggio del cliente, da qui estrai i criteri:' });
  }
  messages.push({ role: 'user', content: messaggio });
  return {
    messages,
    response_format: { type: 'json_schema', json_schema: schemaCriteri(dir) },
    temperature: 0,
    max_tokens: MAX_OUTPUT_TOKENS,
  };
}

// Estrae l'oggetto JSON dalla risposta del binding: con JSON Mode arriva come `response` già
// oggetto, in altri casi come stringa JSON. Qualsiasi altra forma è un errore del provider e
// viene trattata come fallback dal chiamante; qui non si recupera nulla inventando dati.
export function estraiJSONRisposta(out: unknown): unknown {
  const radice = out as { response?: unknown; result?: { response?: unknown } } | null;
  const contenuto = radice?.response ?? radice?.result?.response;
  if (contenuto === undefined || contenuto === null) throw new Error('risposta vuota');
  const oggetto = typeof contenuto === 'string' ? JSON.parse(contenuto) : contenuto;
  if (typeof oggetto !== 'object' || oggetto === null || Array.isArray(oggetto)) throw new Error('risposta malformata');
  return oggetto;
}

// Provider reale su Workers AI. Restituisce solo il JSON grezzo del modello: validazione,
// riduzione ai valori esistenti nel database e timeout restano in assistant.ts.
export function cloudflareAiProvider(ai: WorkersAiBinding, dir: Directory): AssistantProvider {
  return {
    async interpreta(messaggio, _signal, contesto?) {
      // Il binding non accetta segnali di annullamento: il timeout è gestito dal chiamante
      // (interpretaConProvider), che scarta comunque ogni risultato in arrivo dopo il limite.
      const out = await ai.run(CLOUDFLARE_AI_MODEL, corpoRichiestaAI(dir, messaggio, contesto));
      return estraiJSONRisposta(out);
    },
  };
}
