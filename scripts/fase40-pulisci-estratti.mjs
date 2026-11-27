// Fase 40 — qualità delle evidenze: una citazione deve dimostrare il servizio, non citare il menu.
import { readFileSync, writeFileSync } from "node:fs";

const percorso = "data/evidenze/servizi.json";
const registro = JSON.parse(readFileSync(percorso, "utf8"));
const REGOLE = {
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
const BOILERPLATE = /(accedi|login|carrello|newsletter|cookie|privacy|menu|home|contatti|spedizione|resi|wishlist|×|©)/i;

const nomi = { agrave: "à", egrave: "è", eacute: "é", igrave: "ì", ograve: "ò", ugrave: "ù", times: "×", amp: "&", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", mdash: "—", ndash: "–", deg: "°", euro: "€", laquo: "«", raquo: "»" };
const decodifica = (s) => s
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => nomi[n] ?? m)
  .replace(/\s+/g, " ")
  .trim();

let ripulite = 0;
let scartate = 0;
for (const e of registro.evidenze) {
  e.estratto = decodifica(e.estratto);
  if (e.stato !== "confermata") continue;
  const regola = REGOLE[e.servizio];
  const frasi = e.estratto.split(/(?<=[.!?])\s+/).map((f) => f.trim()).filter((f) => f.length >= 25);
  const buone = frasi.filter((f) => !BOILERPLATE.test(f.slice(0, 90)));
  const conProva = buone.filter((f) => regola?.test(f.toLowerCase()));
  const scelta = (conProva.length ? conProva : buone).sort((a, b) => b.length - a.length)[0];
  const daRipulire = BOILERPLATE.test(e.estratto.slice(0, 90)) || e.estratto.length > 240 || /…$|\.\.\.$/.test(e.estratto) || !regola?.test(e.estratto.toLowerCase());
  if (!daRipulire) continue;
  if (!scelta || !regola?.test(scelta.toLowerCase())) {
    // Nessuna frase utile: la citazione non dimostra il servizio e non va spacciata per prova.
    e.stato = "da-verificare";
    e.estratto = "";
    scartate++;
    continue;
  }
  if (scelta !== e.estratto) { e.estratto = scelta.slice(0, 240); ripulite++; }
}
registro.aggiornatoIl = "2026-11-06";
writeFileSync(percorso, JSON.stringify(registro));
const confermate = registro.evidenze.filter((e) => e.stato === "confermata" && e.estratto);
console.log(`estratti riscritti ${ripulite} · passati a da-verificare ${scartate} · confermate ${confermate.length}`);
