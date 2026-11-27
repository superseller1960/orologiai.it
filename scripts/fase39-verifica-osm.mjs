// Fase 39 — verifica dei candidati OSM sul sito ufficiale.
// OSM serve solo a scoprire: la scheda nasce solo se la pagina conferma nome, comune e servizi.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "Orologiai.it/1.0 (+https://www.orologiai.it/metodo/)";
const OGGI = "2026-11-06";
const SORGENTE = process.argv[2] ?? "data/staging/fase39-osm-candidati.json";
const MAX = Number(process.argv[3] ?? 60);
const OUT = process.argv[4] ?? "data/staging/fase39-verifica-osm.json";

const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const RE = {
  revisione: /revision|tagliand|messa a punto/,
  riparazione: /riparazion|riparare|riparat|aggiust|sistemazion|ripristin|officina/,
  "riparazione-meccanici": /meccanic|carica manuale/,
  "riparazione-automatici": /automatic/,
  "riparazione-quarzo": /quarz/,
  "restauro-vintage": /restaur|vintage|antich|d epoca/,
  pendoleria: /pendol|cucu|orolog[oi] a muro/,
  "orologi-tasca": /orolog[oi] da tasca|taschino/,
  batterie: /batteri|cambio pila|sostituzione pila/,
  cinturini: /cinturin|braccial/,
  manutenzione: /manutenz|impermeabil|prova di tenuta/,
  lucidatura: /lucid|satinat/,
  ricambi: /ricamb|vetr[oi]|cristall|coron[ae]/,
  valutazioni: /valutazion|perizi|stima/,
  assistenza: /assistenz|centro di servizio/,
  vendita: /vendita|vendiamo|boutique/,
  "vendita-usati": /usat|secondo polso|permut/,
  gioielleria: /gioiell|oreficer/,
};

const tutti = JSON.parse(readFileSync(SORGENTE, "utf8")).candidati;
const precedenti = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).candidati : [];
const fatti = new Map(precedenti.map((c) => [c.osm, c]));
const daFare = tutti.filter((c) => !fatti.has(c.osm)).slice(0, MAX);
console.log(`candidati OSM ${tutti.length} · da verificare ${daFare.length}`);

async function verifica(c) {
  let html = "", http = 0, finale = c.sito;
  try {
    const res = await fetch(c.sito, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(9000) });
    http = res.status; finale = res.url;
    html = new TextDecoder("utf-8").decode((await res.arrayBuffer()).slice(0, 350_000));
  } catch (e) {
    return { ...c, stato: "errore-rete", motivo: String(e).slice(0, 70) };
  }
  if (http !== 200 || !html) return { ...c, stato: "http-" + http };
  const testo = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const nt = norm(testo);
  const nomeParole = norm(c.nome).split(" ").filter((p) => p.length >= 4 && !["orologeria", "gioielleria", "laboratorio", "orologiaio"].includes(p));
  const nomeOk = nomeParole.length === 0 ? false : nomeParole.filter((p) => nt.includes(p)).length / nomeParole.length >= 0.6;
  const comuneOk = nt.includes(norm(c.comune));
  const servizi = Object.entries(RE).filter(([, re]) => re.test(nt)).map(([id, re]) => {
    const frasi = testo.split(/(?<=[.!?])\s+/);
    return { id, estratto: (frasi.find((f) => re.test(norm(f))) ?? testo).slice(0, 240) };
  }).filter((s) => s.estratto.length >= 30);
  if (!nomeOk) return { ...c, stato: "nome-non-confermato", http };
  if (!comuneOk) return { ...c, stato: "comune-non-confermato", http };
  if (servizi.length < 3) return { ...c, stato: "servizi-insufficienti", http, servizi };
  return {
    ...c, stato: "verificato", http, finale,
    indirizzoVerificato: c.indirizzo ? norm(c.indirizzo).split(" ").filter((p) => p.length > 2).every((p) => nt.includes(p)) : false,
    capVerificato: c.cap ? nt.includes(c.cap) : false,
    telefonoVerificato: c.telefono ? nt.replace(/\D/g, "").includes(c.telefono.replace(/\D/g, "").slice(-8)) : false,
    laboratorioInterno: /laboratorio (interno|di orologeria|tecnico|nostro)|nostro laboratorio/.test(nt),
    servizi,
  };
}

let i = 0;
async function operaio() {
  while (i < daFare.length) {
    const c = daFare[i++];
    const esito = await verifica(c);
    fatti.set(c.osm, esito);
    process.stdout.write(esito.stato === "verificato" ? "✓" : "·");
    if (i % 5 === 0) salva();
  }
}
const salva = () => writeFileSync(OUT, JSON.stringify({ aggiornatoIl: OGGI, candidati: [...fatti.values()] }, null, 1));
await Promise.all([operaio(), operaio(), operaio(), operaio(), operaio(), operaio()]);
salva();
const conto = {};
for (const c of fatti.values()) conto[c.stato] = (conto[c.stato] ?? 0) + 1;
console.log("\n" + JSON.stringify(conto));
