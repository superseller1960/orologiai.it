// Fase 39 — pulizia del lotto: niente duplicati, anagrafica ISTAT completa, estratti decodificati.
import { readFileSync, writeFileSync } from "node:fs";

const RIMUOVI = new Set(["watch-clock-milano", "breitling-roma", "mirolli-follonica"]);
const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const anagrafica = JSON.parse(readFileSync("data/anagrafica/comuni-catalogo.json", "utf8"));
const comuni = JSON.parse(readFileSync("/tmp/comuni.json", "utf8"));

// 1. Schede ritirate: erano scoperte via OSM e collidevano con nomi o attività sospese.
const rimosse = dir.attivita.filter((b) => RIMUOVI.has(b.id));
dir.attivita = dir.attivita.filter((b) => !RIMUOVI.has(b.id));

// 2. Anagrafica ISTAT: ogni località nuova deve avere il codice ufficiale e i nomi ufficiali.
const nomiUfficiali = new Map(comuni.map((c) => [c.nome.toLowerCase(), c]));
let aggiunteAnagrafica = 0;
const correzioni = [];
for (const l of dir.localita) {
  if (l.codiceIstat) continue;
  const ufficiale = nomiUfficiali.get(l.comune.toLowerCase());
  if (!ufficiale) { correzioni.push(`${l.id}: comune non trovato nell'anagrafica ISTAT`); continue; }
  l.codiceIstat = ufficiale.codice;
  l.provincia = ufficiale.provincia.nome;
  l.provinciaSlug = ufficiale.provincia.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  l.siglaProvincia = ufficiale.sigla;
  l.regione = ufficiale.regione.nome;
  l.regioneSlug = ufficiale.regione.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!anagrafica.comuni.some((c) => c.codiceIstat === ufficiale.codice)) {
    anagrafica.comuni.push({
      codiceIstat: ufficiale.codice, nome: ufficiale.nome,
      provinciaUfficiale: ufficiale.provincia.nome, provincia: ufficiale.provincia.nome,
      sigla: ufficiale.sigla, regioneUfficiale: ufficiale.regione.nome, regione: ufficiale.regione.nome,
      capoluogo: Boolean(ufficiale.capoluogo), catastale: ufficiale.catastale ?? "",
      fonte: "ISTAT — Elenco dei comuni (edizione in vigore)", localita: [],
    });
    aggiunteAnagrafica++;
  }
  const voce = anagrafica.comuni.find((c) => c.codiceIstat === ufficiale.codice);
  if (!voce.localita.includes(l.id)) voce.localita.push(l.id);
  correzioni.push(`${l.id} → ISTAT ${ufficiale.codice} (${ufficiale.provincia.nome})`);
}
anagrafica.generato = "2026-11-06";

// 3. Fonti orfane delle schede ritirate.
const usate = new Set([
  ...dir.attivita.flatMap((b) => [b.posizione.fonti, b.contatti.fonti, b.orari.fonti, b.storia.fonti, b.attendibilita.fonti].flat()),
  ...dir.attivita.flatMap((b) => [...b.servizi.flatMap((s) => s.fonti), ...b.altriServizi.flatMap((s) => s.fonti), ...b.specializzazioni.flatMap((s) => s.fonti)]),
  ...dir.attivita.flatMap((b) => Object.values(b.marchi).flat().flatMap((m) => m.fonti)),
  ...dir.attivita.flatMap((b) => (b.laboratorio ? b.laboratorio.fonti : [])),
  ...dir.localita.flatMap((l) => l.fonti),
]);
const primaFonti = dir.fonti.length;
dir.fonti = dir.fonti.filter((f) => usate.has(f.id) || !f.id.startsWith("f39-"));

// 4. Estratti decodificati: le entità HTML non devono arrivare all'utente.
const nomi = { agrave: "à", egrave: "è", eacute: "é", igrave: "ì", ograve: "ò", ugrave: "ù", Agrave: "À", Egrave: "È", times: "×", amp: "&", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", mdash: "—", ndash: "–", deg: "°", euro: "€", laquo: "«", raquo: "»", Ouml: "Ö", ouml: "ö", szlig: "ß", ccedil: "ç", Eacute: "É", Agrave2: "À" };
const decodifica = (s) => s
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => nomi[n] ?? m);

const registro = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const primaEvidenze = registro.evidenze.length;
registro.evidenze = registro.evidenze
  .filter((e) => !RIMUOVI.has(e.attivitaId))
  .map((e) => ({ ...e, estratto: decodifica(e.estratto) }));
registro.aggiornatoIl = "2026-11-06";

writeFileSync("site/data/directory.json", JSON.stringify(dir, null, 2) + "\n");
writeFileSync("data/anagrafica/comuni-catalogo.json", JSON.stringify(anagrafica, null, 2) + "\n");
writeFileSync("data/evidenze/servizi.json", JSON.stringify(registro));

console.log(`schede rimosse: ${rimosse.map((b) => b.id).join(", ") || "nessuna"} · attività ${dir.attivita.length}`);
console.log(`anagrafica +${aggiunteAnagrafica} comuni · fonti ${primaFonti} → ${dir.fonti.length}`);
console.log(correzioni.join("\n"));
console.log(`evidenze ${primaEvidenze} → ${registro.evidenze.length} · confermate ${registro.evidenze.filter((e) => e.stato === "confermata").length}`);
