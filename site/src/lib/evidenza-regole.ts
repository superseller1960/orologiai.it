// Regole condivise fra il raccoglitore (scripts/raccogli-evidenze.ts), il sito e i test.
// Una regola descrive come riconoscere, nel testo pubblico di una fonte, l'affermazione di un
// servizio. Nessuna regola deduce un servizio da un altro: ogni voce ha la propria prova.
export type ServizioTecnico =
  | 'revisione' | 'riparazione' | 'riparazione-meccanici' | 'riparazione-automatici'
  | 'riparazione-quarzo' | 'restauro-vintage' | 'pendoleria' | 'orologi-tasca'
  | 'batterie' | 'cinturini' | 'manutenzione' | 'lucidatura' | 'ricambi'
  | 'assistenza' | 'vendita' | 'vendita-usati' | 'gioielleria';

export const REGOLE_SERVIZIO: Record<ServizioTecnico, RegExp> = {
  revisione: /revision|tagliand|messa a punto|smontaggio completo|revisione completa|service complet/,
  riparazione: /riparaz|riparat|aggiust|sistemazion|ripristin|intervent[oi] tecnici|officina|workshop|repair/,
  'riparazione-meccanici': /meccanic|carica manuale|movimento manuale|calibr[oi] meccanic/,
  'riparazione-automatici': /automatic|massa oscillante|rotore|ricarica automatica/,
  'riparazione-quarzo': /quarz|quartz/,
  'restauro-vintage': /restaur|conservativ|d'epoca|antich|vintage|restoration/,
  pendoleria: /pendol|orologi? a muro|cuc[uù]|cassa lunga|carrillon|orologi da parete|orologio da terra/,
  'orologi-tasca': /orologi? da tasca|orologio a cipolla|pocket watch/,
  batterie: /batteri|pila|pile|cambio pila/,
  cinturini: /cinturin|braccial|strap|cinghie/,
  manutenzione: /manutenz|controll|impermeab|guarnizion|tenuta|pulizia|revisione/,
  lucidatura: /lucid|satinat|politur|polishing/,
  ricambi: /ricamb|fornitur|vetr[oi]|cristall|coron[ae]|quadrante|lancett|sfere|passant|spare part/,
  assistenza: /assistenz|centro (?:di )?servizio|service cent|authorized service/,
  vendita: /vendit|acquist|boutique|concessionari|rivenditor|showroom/,
  'vendita-usati': /usat|secondo polso|pre-?owned|compro|permut/,
  gioielleria: /gioiell|oreficer|prezios|oreficeria|jewel/,
};

// Ruolo dichiarato dalla fonte: serve a non presentare un rivenditore come laboratorio.
export const RUOLI_FONTE: { ruolo: EvidenzaRuolo; re: RegExp }[] = [
  { ruolo: 'centro-assistenza-ufficiale', re: /centro (?:di )?assistenza (?:autorizzat|ufficial|authorized)|authorized service cent|service cent(?:er|re) ufficiale/ },
  { ruolo: 'rivendita-ufficiale', re: /rivenditor[ei] (?:autorizzat|ufficial)|concessionari[oa] ufficial|authorized dealer|official retailer/ },
  { ruolo: 'laboratorio-interno', re: /(?:nostro|interno|interno alla bottega|in bottega|all'interno)[^.]{0,40}laborator|laborator[oi] (?:interno|orologer|di orologeria|tecnico)|our (?:own )?workshop|in-?house (?:workshop|watchmaker)/ },
  { ruolo: 'punto-raccolta', re: /punto (?:di )?raccolta|centro (?:di )?raccolta|spedizion|pick-?up point/ },
];

export type EvidenzaRuolo =
  | 'laboratorio-interno' | 'centro-assistenza-ufficiale' | 'rivendita-ufficiale' | 'punto-raccolta' | 'non-specificato';

export const RUOLO_ETICHETTA: Record<EvidenzaRuolo, string> = {
  'laboratorio-interno': 'laboratorio interno',
  'centro-assistenza-ufficiale': 'centro di assistenza ufficiale',
  'rivendita-ufficiale': 'rivenditore ufficiale',
  'punto-raccolta': 'punto di raccolta',
  'non-specificato': 'ruolo non dichiarato',
};

// Titoli che sono in realtà URL: non devono mai finire nel corpo della motivazione.
export function etichettaFonte(titolo: string, url: string): string {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const sembraUrl = /https?:\/\//i.test(titolo) || /^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(titolo.trim());
  if (!sembraUrl) return titolo.replace(/\s+/g, ' ').trim();
  const nome = host.split('.')[0] ?? '';
  return host ? `pagina di ${nome.charAt(0).toUpperCase()}${nome.slice(1)}` : 'pagina dell’attività';
}

export const decodificaEntita = (s: string): string => s
  .replace(/&#(\d{2,5});/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]{2,4});/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
  .replace(/&apos;/gi, "'").replace(/&egrave;/gi, 'è').replace(/&agrave;/gi, 'à')
  .replace(/&ograve;/gi, 'ò').replace(/&igrave;/gi, 'ì').replace(/&ugrave;/gi, 'ù')
  .replace(/&[a-z]+;/gi, ' ');

// Pulizia di un estratto: una frase pertinente, senza URL, senza tag, con lunghezza leggibile.
export function normalizzaEstratto(testo: string, max = 200): string {
  const pulito = decodificaEntita(testo)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
  if (pulito.length <= max) return pulito;
  const tagliato = pulito.slice(0, max);
  const ultimoSpazio = tagliato.lastIndexOf(' ');
  return `${tagliato.slice(0, ultimoSpazio > 60 ? ultimoSpazio : max).replace(/[,;:]$/, '')}…`;
}
