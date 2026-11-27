// Fase 40 — audit dell'intero catalogo: nessuna coppia viene eliminata automaticamente.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { auditDuplicati } from "../site/src/lib/duplicates.ts";
import { directorySchema } from "../site/src/lib/schema.ts";

const dir = directorySchema.parse(JSON.parse(readFileSync("site/data/directory.json", "utf8")));
const esiti = auditDuplicati(dir);
const perClasse = esiti.reduce((m, e) => ({ ...m, [e.classe]: (m[e.classe] ?? 0) + 1 }), {});
mkdirSync("data/reports", { recursive: true });
writeFileSync("data/reports/fase40-audit-duplicati.json", JSON.stringify({
  data: "2026-11-06", attivita: dir.attivita.length, classi: perClasse, coppie: esiti,
}, null, 2) + "\n");
console.log(`attività ${dir.attivita.length} · coppie segnalate ${esiti.length} · ${JSON.stringify(perClasse)}`);
for (const e of esiti.filter((x) => x.classe === "duplicato-confermato")) console.log("CONFERMATO", e.coppia.join(" ↔ "), e.motivi.join("; "));
for (const e of esiti.filter((x) => x.classe === "possibile-duplicato").slice(0, 12)) console.log("possibile", e.coppia.join(" ↔ "), e.motivi.join("; "));
