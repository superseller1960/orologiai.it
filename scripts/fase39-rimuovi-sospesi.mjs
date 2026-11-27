// Fase 39 — nessuna attività sospesa può rientrare dal lotto: si confrontano gli ID, non i nomi.
import { readFileSync, writeFileSync } from "node:fs";

const sospesi = JSON.parse(readFileSync("data/import/fase13-lotto5-20261028-reviewed.json", "utf8"));
const idsSospesi = new Set(sospesi.candidati.map((c) => c.id));
const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const intrusi = dir.attivita.filter((b) => idsSospesi.has(b.id)).map((b) => b.id);
dir.attivita = dir.attivita.filter((b) => !idsSospesi.has(b.id));

const registro = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const prima = registro.evidenze.length;
registro.evidenze = registro.evidenze.filter((e) => !idsSospesi.has(e.attivitaId));
if (registro.evidenze.length !== prima) registro.aggiornatoIl = "2026-11-06";

writeFileSync("site/data/directory.json", JSON.stringify(dir, null, 2) + "\n");
writeFileSync("data/evidenze/servizi.json", JSON.stringify(registro));
console.log(`sospesi rientrati rimossi: ${intrusi.join(", ") || "nessuno"} · attività ${dir.attivita.length} · evidenze ${registro.evidenze.length}`);
