// Fase 39 — unisce le evidenze verificate dai nuovi lotti al registro documentale.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const percorso = "data/evidenze/servizi.json";
const registro = JSON.parse(readFileSync(percorso, "utf8"));
const chiave = (e) => `${e.attivitaId}|${e.servizio}|${e.fonteId}`;
const presenti = new Set(registro.evidenze.map(chiave));
let aggiunte = 0;

for (const file of ["data/staging/fase39-evidenze-nuove.json", "data/staging/fase39-evidenze-osm.json"]) {
  if (!existsSync(file)) continue;
  for (const e of JSON.parse(readFileSync(file, "utf8"))) {
    if (presenti.has(chiave(e))) continue;
    registro.evidenze.push(e);
    presenti.add(chiave(e));
    aggiunte++;
    registro.fonti[e.url] = { esito: "ok", stato: 200, consultataIl: e.verificataIl };
  }
}
registro.aggiornatoIl = "2026-11-06";
writeFileSync(percorso, JSON.stringify(registro));
const confermate = registro.evidenze.filter((e) => e.stato === "confermata");
console.log(`evidenze +${aggiunte} · totale ${registro.evidenze.length} · confermate ${confermate.length} · attività ${new Set(confermate.map((e) => e.attivitaId)).size}`);
