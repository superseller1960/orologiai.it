// site/src/lib/geo.ts
var REGIONI_ITALIA = {
  abruzzo: { slug: "abruzzo", nome: "Abruzzo", codici: ["65", "abr"], alias: ["abruzzo"] },
  basilicata: { slug: "basilicata", nome: "Basilicata", codici: ["77", "bas"], alias: ["basilicata", "lucania"] },
  calabria: { slug: "calabria", nome: "Calabria", codici: ["78", "cal"], alias: ["calabria"] },
  campania: { slug: "campania", nome: "Campania", codici: ["72", "cam"], alias: ["campania"] },
  "emilia-romagna": { slug: "emilia-romagna", nome: "Emilia-Romagna", codici: ["45", "emr"], alias: ["emilia-romagna", "emilia romagna"] },
  "friuli-venezia-giulia": { slug: "friuli-venezia-giulia", nome: "Friuli-Venezia Giulia", codici: ["36", "fvg"], alias: ["friuli-venezia giulia", "friuli venezia giulia", "friuli"] },
  lazio: { slug: "lazio", nome: "Lazio", codici: ["62", "laz"], alias: ["lazio", "latium"] },
  liguria: { slug: "liguria", nome: "Liguria", codici: ["42", "lig"], alias: ["liguria"] },
  lombardia: { slug: "lombardia", nome: "Lombardia", codici: ["25", "lom"], alias: ["lombardia", "lombardy"] },
  marche: { slug: "marche", nome: "Marche", codici: ["57", "mar"], alias: ["marche", "marches"] },
  molise: { slug: "molise", nome: "Molise", codici: ["67", "mol"], alias: ["molise"] },
  piemonte: { slug: "piemonte", nome: "Piemonte", codici: ["21", "pmn"], alias: ["piemonte", "piedmont"] },
  puglia: { slug: "puglia", nome: "Puglia", codici: ["75", "pug"], alias: ["puglia", "apulia"] },
  sardegna: { slug: "sardegna", nome: "Sardegna", codici: ["88", "sar"], alias: ["sardegna", "sardinia"] },
  sicilia: { slug: "sicilia", nome: "Sicilia", codici: ["82", "sic"], alias: ["sicilia", "sicily"] },
  toscana: { slug: "toscana", nome: "Toscana", codici: ["52", "tos"], alias: ["toscana", "tuscany"] },
  "trentino-alto-adige": { slug: "trentino-alto-adige", nome: "Trentino-Alto Adige", codici: ["32", "taa"], alias: ["trentino-alto adige", "trentino alto adige", "trentino", "south tyrol"] },
  umbria: { slug: "umbria", nome: "Umbria", codici: ["55", "umb"], alias: ["umbria"] },
  "valle-daosta": { slug: "valle-daosta", nome: "Valle d'Aosta", codici: ["23", "vda"], alias: ["valle d'aosta", "valle daosta", "aosta valley", "val d'aoste"] },
  veneto: { slug: "veneto", nome: "Veneto", codici: ["34", "ven"], alias: ["veneto"] }
};
function normalizzaRegioneItaliana(valore) {
  if (!valore) return null;
  let pulito = valore.trim().toLowerCase();
  if (pulito.startsWith("it-")) pulito = pulito.slice(3);
  for (const info of Object.values(REGIONI_ITALIA)) {
    if (pulito === info.slug || info.codici.includes(pulito) || info.alias.includes(pulito)) {
      return info;
    }
  }
  return null;
}
function decodificaCitta(valore) {
  try {
    return decodeURIComponent(valore);
  } catch {
    return valore;
  }
}
function estraiPosizioneApprossimativa(req) {
  const h = req.headers;
  const viaVercel = h.has("x-vercel-id");
  const cf = req.cf ?? {};
  const nonVuoto = (v) => v && v.trim() ? v.trim() : null;
  const country = viaVercel ? nonVuoto(h.get("x-vercel-ip-country")) : typeof cf.country === "string" ? cf.country : nonVuoto(h.get("cf-ipcountry"));
  const regionRaw = viaVercel ? nonVuoto(h.get("x-vercel-ip-country-region")) : typeof cf.region === "string" ? cf.region : nonVuoto(h.get("cf-region")) ?? nonVuoto(h.get("cf-region-code"));
  const cityHeader = viaVercel ? nonVuoto(h.get("x-vercel-ip-city")) : typeof cf.city === "string" ? cf.city : nonVuoto(h.get("cf-ipcity"));
  const city = cityHeader ? decodificaCitta(cityHeader) : null;
  const regInfo = normalizzaRegioneItaliana(regionRaw);
  if (country && country.toUpperCase() !== "IT") {
    return {
      disponibile: false,
      regioneSlug: null,
      regioneNome: null,
      citta: null,
      paese: country,
      messaggio: "Connessione rilevata fuori dall\u2019Italia: ricerca estesa a tutto il territorio nazionale."
    };
  }
  if (regInfo) {
    return {
      disponibile: true,
      regioneSlug: regInfo.slug,
      regioneNome: regInfo.nome,
      citta: city,
      paese: "IT",
      messaggio: `Zona suggerita: ${regInfo.nome}. Stima approssimativa dalla connessione, senza GPS.`
    };
  }
  return {
    disponibile: false,
    regioneSlug: null,
    regioneNome: null,
    citta: null,
    paese: country,
    messaggio: "Localit\xE0 automatica non rilevabile: inserisci citt\xE0, provincia o CAP."
  };
}

// site/src/lib/posizione-api.ts
function handlePosizione(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ errore: "Metodo non consentito." }), {
      status: 405,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "private, no-store, max-age=0",
        allow: "GET, HEAD"
      }
    });
  }
  const info = estraiPosizioneApprossimativa(request);
  return new Response(JSON.stringify(info), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // No-store e private: la posizione stimata non deve essere memorizzata da una cache condivisa.
      "cache-control": "private, no-store, max-age=0"
    }
  });
}

// site/src/api/posizione.ts
var posizione_default = {
  fetch(request) {
    return handlePosizione(request);
  }
};
export {
  posizione_default as default
};
