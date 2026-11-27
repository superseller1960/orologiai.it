// Fase 40 — il client riceve solo le evidenze confermate e i campi che mostra.
// Il registro completo (con cache di rete e stato da verificare) resta nel repository.
import { readFileSync, writeFileSync } from "node:fs";

const registro = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
// A shared quote cannot prove that a particular branch provides a service.
const candidate = registro.evidenze.filter(e => e.stato === "confermata" && e.estratto);
const ownerByQuote = new Map();
const quoteKey = e => e.url+"::"+e.estratto.trim().replace(/\s+/g," ");
for (const e of candidate) { const key=quoteKey(e); const ids=ownerByQuote.get(key)??new Set(); ids.add(e.attivitaId); ownerByQuote.set(key,ids); }
const ambiguous = candidate.filter(e=>e.tipoFonte==="mirror-storico" || ownerByQuote.get(quoteKey(e))?.size>1);
if(ambiguous.length) throw new Error("Evidenze non attribuite individualmente: "+ambiguous.map(e=>e.attivitaId+"/"+e.servizio).join(", "));
const confermate = registro.evidenze
  .filter((e) => e.stato === "confermata" && e.estratto)
  .map((e) => ({
    attivitaId: e.attivitaId, servizio: e.servizio, fonteId: e.fonteId, url: e.url, titolo: e.titolo,
    estratto: e.estratto, tipoFonte: e.tipoFonte, verificataIl: e.verificataIl, stato: "confermata",
    ruolo: e.ruolo, metodo: e.metodo,
  }));
writeFileSync("data/evidenze/confermate.json", JSON.stringify({ versione: 1, evidenze: confermate }));
writeFileSync("data/evidenze/meta.json", JSON.stringify({
  aggiornatoIl: registro.aggiornatoIl,
  confermate: confermate.length,
  daVerificare: registro.evidenze.filter((e) => e.stato === "da-verificare").length,
  associazioni: registro.evidenze.length,
}, null, 2) + "\n");
const pieno = JSON.stringify(registro).length, ridotto = JSON.stringify({ versione: 1, evidenze: confermate }).length;
console.log(`evidenze client ${confermate.length} · ${(ridotto / 1024).toFixed(0)} KB (registro ${(pieno / 1024).toFixed(0)} KB, −${(100 - ridotto / pieno * 100).toFixed(0)}%)`);
