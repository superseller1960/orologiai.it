export type InfoRegione = {
  slug: string;
  nome: string;
  codici: string[];
  alias: string[];
};

export const REGIONI_ITALIA: Record<string, InfoRegione> = {
  abruzzo: { slug: 'abruzzo', nome: 'Abruzzo', codici: ['65', 'abr'], alias: ['abruzzo'] },
  basilicata: { slug: 'basilicata', nome: 'Basilicata', codici: ['77', 'bas'], alias: ['basilicata', 'lucania'] },
  calabria: { slug: 'calabria', nome: 'Calabria', codici: ['78', 'cal'], alias: ['calabria'] },
  campania: { slug: 'campania', nome: 'Campania', codici: ['72', 'cam'], alias: ['campania'] },
  'emilia-romagna': { slug: 'emilia-romagna', nome: 'Emilia-Romagna', codici: ['45', 'emr'], alias: ['emilia-romagna', 'emilia romagna'] },
  'friuli-venezia-giulia': { slug: 'friuli-venezia-giulia', nome: 'Friuli-Venezia Giulia', codici: ['36', 'fvg'], alias: ['friuli-venezia giulia', 'friuli venezia giulia', 'friuli'] },
  lazio: { slug: 'lazio', nome: 'Lazio', codici: ['62', 'laz'], alias: ['lazio', 'latium'] },
  liguria: { slug: 'liguria', nome: 'Liguria', codici: ['42', 'lig'], alias: ['liguria'] },
  lombardia: { slug: 'lombardia', nome: 'Lombardia', codici: ['25', 'lom'], alias: ['lombardia', 'lombardy'] },
  marche: { slug: 'marche', nome: 'Marche', codici: ['57', 'mar'], alias: ['marche', 'marches'] },
  molise: { slug: 'molise', nome: 'Molise', codici: ['67', 'mol'], alias: ['molise'] },
  piemonte: { slug: 'piemonte', nome: 'Piemonte', codici: ['21', 'pmn'], alias: ['piemonte', 'piedmont'] },
  puglia: { slug: 'puglia', nome: 'Puglia', codici: ['75', 'pug'], alias: ['puglia', 'apulia'] },
  sardegna: { slug: 'sardegna', nome: 'Sardegna', codici: ['88', 'sar'], alias: ['sardegna', 'sardinia'] },
  sicilia: { slug: 'sicilia', nome: 'Sicilia', codici: ['82', 'sic'], alias: ['sicilia', 'sicily'] },
  toscana: { slug: 'toscana', nome: 'Toscana', codici: ['52', 'tos'], alias: ['toscana', 'tuscany'] },
  'trentino-alto-adige': { slug: 'trentino-alto-adige', nome: 'Trentino-Alto Adige', codici: ['32', 'taa'], alias: ['trentino-alto adige', 'trentino alto adige', 'trentino', 'south tyrol'] },
  umbria: { slug: 'umbria', nome: 'Umbria', codici: ['55', 'umb'], alias: ['umbria'] },
  'valle-daosta': { slug: 'valle-daosta', nome: "Valle d'Aosta", codici: ['23', 'vda'], alias: ["valle d'aosta", 'valle daosta', 'aosta valley', "val d'aoste"] },
  veneto: { slug: 'veneto', nome: 'Veneto', codici: ['34', 'ven'], alias: ['veneto'] },
};

export type PosizioneApprossimativa = {
  disponibile: boolean;
  regioneSlug: string | null;
  regioneNome: string | null;
  citta: string | null;
  paese: string | null;
  messaggio: string;
};

// Riconosce la regione italiana da codici ISO 3166-2 (es. IT-52, 52, TOS) o nomi (es. Tuscany, Toscana).
export function normalizzaRegioneItaliana(valore?: string | null): InfoRegione | null {
  if (!valore) return null;
  let pulito = valore.trim().toLowerCase();
  if (pulito.startsWith('it-')) pulito = pulito.slice(3);
  for (const info of Object.values(REGIONI_ITALIA)) {
    if (pulito === info.slug || info.codici.includes(pulito) || info.alias.includes(pulito)) {
      return info;
    }
  }
  return null;
}

// Estrae la posizione stimata senza mai usare GPS, cookie o memorizzazione permanente.
export function estraiPosizioneApprossimativa(req: Request): PosizioneApprossimativa {
  const cf = (req as unknown as { cf?: Record<string, unknown> }).cf ?? {};
  const country = typeof cf.country === 'string' ? cf.country : (req.headers.get('cf-ipcountry') ?? null);
  const regionRaw = typeof cf.region === 'string' ? cf.region : (req.headers.get('cf-region') ?? req.headers.get('cf-region-code') ?? null);
  const city = typeof cf.city === 'string' ? cf.city : (req.headers.get('cf-ipcity') ?? null);

  const regInfo = normalizzaRegioneItaliana(regionRaw);

  if (country && country.toUpperCase() !== 'IT') {
    return {
      disponibile: false,
      regioneSlug: null,
      regioneNome: null,
      citta: null,
      paese: country,
      messaggio: 'Connessione rilevata fuori dall’Italia: ricerca estesa a tutto il territorio nazionale.',
    };
  }

  if (regInfo) {
    return {
      disponibile: true,
      regioneSlug: regInfo.slug,
      regioneNome: regInfo.nome,
      citta: city,
      paese: 'IT',
      messaggio: `Zona suggerita: ${regInfo.nome}. Stima approssimativa dalla connessione, senza GPS.`,
    };
  }

  return {
    disponibile: false,
    regioneSlug: null,
    regioneNome: null,
    citta: null,
    paese: country,
    messaggio: 'Località automatica non rilevabile: inserisci città, provincia o CAP.',
  };
}
