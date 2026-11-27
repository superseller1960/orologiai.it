// Fase 39 — verifica dal vivo dei candidati del registro fase32.
// Non inventa nulla: ogni campo viene tenuto solo se il testo della pagina lo contiene.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = "data/staging/fase39-verifica.json";
const UA = "Orologiai.it/1.0 (+https://www.orologiai.it/metodo/)";
const OGGI = "2026-11-06";

const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const host = (u) => (u || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
const sitiEsistenti = new Set(dir.attivita.map((a) => host(a.contatti.sito)).filter(Boolean));
const nomiEsistenti = new Set(dir.attivita.map((a) => norm(a.nome)));
const chiaviEsistenti = new Set(
  dir.attivita.map((a) => norm(a.nome) + "|" + a.localitaId),
);

const righe = readFileSync("data/staging/fase32-candidati.txt", "utf8").trim().split("\n");
const candidati = righe
  .map((riga) => {
    const c = riga.split("|").map((x) => x.trim());
    return {
      nome: c[0], comune: c[1], sigla: c[2], indirizzo: c[3] || null, cap: c[4] || null,
      telefono: c[5] || null, sito: c[6] || null, fonte: c[7], evidenza: c[8] || "",
    };
  })
  .filter((c) => c.nome && c.comune && c.fonte);

const REGOLE = {
  revisione: /revision|tagliand|messa a punto/,
  riparazione: /riparazion|riparare|riparat|aggiust|sistemazion|ripristin|officina/,
  "riparazione-meccanici": /meccanic|carica manuale/,
  "riparazione-automatici": /automatic/,
  "riparazione-quarzo": /quarz/,
  "restauro-vintage": /restaur|vintage|antich|d epoca/,
  pendoleria: /pendol|cucu|orolog[oi] a muro|orologi da parete/,
  "orologi-tasca": /orolog[oi] da tasca|taschino|cipolla/,
  batterie: /batteri|sostituzione pila|cambio pila|\bpile\b/,
  cinturini: /cinturin|braccial/,
  manutenzione: /manutenz|impermeabil|guarnizion|prova di tenuta/,
  lucidatura: /lucid|satinat|politur/,
  ricambi: /ricamb|vetr[oi]|cristall|coron[ae]|quadrante/,
  valutazioni: /valutazion|perizi|stima/,
  assistenza: /assistenz|centro di servizio|centro service/,
  vendita: /vendita|vendiamo|acquist|boutique/,
  "vendita-usati": /usat|secondo polso|permut/,
  gioielleria: /gioiell|oreficer/,
};

async function scarica(url) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(buf.slice(0, 400_000));
    return { http: res.status, html, finale: res.url };
  } catch (e) {
    return { http: 0, html: "", errore: String(e).slice(0, 80) };
  }
}

const testo = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const precedenti = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { candidati: [] };
const fatti = new Map(precedenti.candidati.map((c) => [c.nome + "|" + c.comune, c]));

const daFare = candidati.filter((c) => {
  const chiave = c.nome + "|" + c.comune;
  return !fatti.has(chiave) || fatti.get(chiave).stato === "errore-rete";
});

console.log(`candidati ${candidati.length} · da verificare ${daFare.length}`);

async function elabora(c) {
  const chiave = c.nome + "|" + c.comune;
  if (sitiEsistenti.has(host(c.sito))) {
    return { ...c, stato: "gia-presente", motivo: "dominio già in catalogo" };
  }
  if (nomiEsistenti.has(norm(c.nome)) && chiaviEsistenti.has(norm(c.nome) + "|" + norm(c.comune).replace(/ /g, "-"))) {
    return { ...c, stato: "gia-presente", motivo: "nome e comune già in catalogo" };
  }
  const { http, html, finale, errore } = await scarica(c.fonte);
  if (http !== 200 || !html) return { ...c, stato: errore ? "errore-rete" : "http-" + http, motivo: errore ?? `HTTP ${http}` };
  const t = testo(html);
  const nt = norm(t);
  // La citazione deve esistere davvero: almeno 4 parole distintive della frase riportata.
  const citazione = (c.evidenza.match(/[«"“]([^»"”]{20,240})[»"”]/)?.[1] ?? c.evidenza).trim();
  const parole = norm(citazione).split(" ").filter((p) => p.length >= 5);
  const trovate = parole.filter((p) => nt.includes(p)).length;
  const copertura = parole.length ? trovate / parole.length : 0;
  if (copertura < 0.5) return { ...c, stato: "citazione-non-trovata", motivo: `copertura ${(copertura * 100).toFixed(0)}%`, http };
  const servizi = Object.entries(REGOLE)
    .filter(([, re]) => re.test(nt))
    .map(([id, re]) => {
      // Frase della pagina che contiene la parola chiave: diventa l'estratto dell'evidenza.
      const frasi = t.split(/(?<=[.!?])\s+/);
      const frase = frasi.find((f) => re.test(norm(f))) ?? frasi.find((f) => re.test(norm(f)));
      return { id, estratto: (frase ?? citazione).slice(0, 240) };
    })
    .filter((s) => s.estratto.length >= 30);
  const indirizzoOk = c.indirizzo ? norm(c.indirizzo).split(" ").filter((p) => p.length > 2).every((p) => nt.includes(p)) : false;
  const capOk = c.cap ? nt.includes(c.cap) : false;
  const telOk = c.telefono ? nt.replace(/\D/g, "").includes(c.telefono.replace(/\D/g, "").slice(-8)) : false;
  return {
    ...c, stato: "verificato", http, finale,
    copertura: Number(copertura.toFixed(2)),
    testoLunghezza: t.length,
    indirizzoVerificato: indirizzoOk, capVerificato: capOk, telefonoVerificato: telOk,
    laboratorioInterno: /laboratorio (interno|di orologeria|tecnico|nostro)|nostro laboratorio/.test(nt),
    servizi,
  };
}

let indice = 0;
async function operaio() {
  while (indice < daFare.length) {
    const c = daFare[indice++];
    const esito = await elabora(c);
    fatti.set(c.nome + "|" + c.comune, esito);
    process.stdout.write(esito.stato === "verificato" ? "✓" : "·");
    if (indice % 10 === 0) salva();
  }
}
function salva() {
  writeFileSync(OUT, JSON.stringify({ aggiornatoIl: OGGI, candidati: [...fatti.values()] }, null, 1));
}
await Promise.all([operaio(), operaio(), operaio(), operaio(), operaio(), operaio()]);
salva();

const tutti = [...fatti.values()];
const conto = {};
for (const c of tutti) conto[c.stato] = (conto[c.stato] ?? 0) + 1;
const verificati = tutti.filter((c) => c.stato === "verificato");
console.log("\n" + JSON.stringify(conto, null, 1));
console.log("verificati con servizi:", verificati.filter((c) => c.servizi.length >= 2).length);
console.log("verificati con indirizzo:", verificati.filter((c) => c.indirizzoVerificato).length);
console.log("verificati con telefono:", verificati.filter((c) => c.telefonoVerificato).length);
console.log("comuni nuovi:", new Set(verificati.map((c) => c.comune)).size);
