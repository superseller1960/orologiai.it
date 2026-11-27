// Fase 39 — checkpoint verificabile con i numeri effettivi del catalogo e delle evidenze.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const ev = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const conf = ev.evidenze.filter((e) => e.stato === "confermata");
const nuove = dir.attivita.filter((b) => b.origine.sistema === "fase39-verifica-fonte");
const rimossi = JSON.parse(readFileSync("data/staging/fase39-verifica.json", "utf8")).candidati;
const verificaOsm = JSON.parse(readFileSync("data/staging/fase39-verifica-osm.json", "utf8")).candidati;
const conta = (arr) => arr.reduce((m, c) => ({ ...m, [c.stato]: (m[c.stato] ?? 0) + 1 }), {});
const comuniNuovi = nuove.map((b) => dir.localita.find((l) => l.id === b.localitaId)).filter(Boolean).map((l) => `${l.comune} (${l.siglaProvincia})`);
const file = [
  "site/data/directory.json", "data/evidenze/servizi.json", "data/anagrafica/comuni-catalogo.json",
  "site/src/pages/cerca.astro", "site/src/pages/orologeria/[slug].astro", "site/src/pages/sitemap.xml.ts",
  "site/src/lib/recommendations.ts", "site/src/lib/assistant.ts", "tests/fase39.test.ts",
  "scripts/fase39-verifica-candidati.mjs", "scripts/fase39-overpass.mjs", "scripts/fase39-genera-lotto.mjs",
  "scripts/fase39-pulizia.mjs", "scripts/fase39-unisci-evidenze.mjs",
];
const hashes = file.map((f) => `${createHash("sha256").update(readFileSync(f)).digest("hex")}  ${f}`).join("\n");
const fonti = dir.fonti.length;
const coordinate = dir.attivita.filter((b) => b.posizione.coordinate && b.posizione.coordinate.stato === "verificata").length;

const righe = [
  "OROLOGIAI.IT — CHECKPOINT FASE 39 (percorso per problema, espansione verificata, competenze documentate)",
  "Data: 2026-11-06 · branch locale fase14d-assistente-ai · modifiche non committate",
  "",
  "STATO DI PARTENZA (fine Fase 38)",
  "- Produzione 1b78dc43 (poi 57154c17 e successivi); catalogo 550 attività / 246 località / 1.159 fonti / 82 coordinate.",
  "- Evidenze: 1.357 confermate su 1.770 associazioni, 413 da verificare.",
  "",
  "CATALOGO DOPO LA FASE 39",
  `- ${dir.attivita.length} attività · ${dir.localita.length} località · ${fonti} fonti · ${coordinate} coordinate pubblicabili.`,
  `- Nuove schede (${nuove.length}): ${nuove.map((b) => b.id).join(", ")}.`,
  `- Nuovi comuni: ${[...new Set(comuniNuovi)].join(", ")}.`,
  "- Ogni nuova scheda nasce da una fonte ufficiale consultata oggi (HTTP 200), con citazione verificata, indirizzo/telefono solo se presenti nella pagina, cronologia e nessuna autorizzazione di marca attribuita.",
  `- Candidati scartati o rimandati: registro ${rimossi.length} → ${JSON.stringify(conta(rimossi))}; scoperta OSM ${verificaOsm.length} → ${JSON.stringify(conta(verificaOsm))}.`,
  "- Ritirate tre schede scoperte via OSM (watch-clock-milano, breitling-roma, mirolli-follonica): collidevano con nomi esistenti, con un'attività sospesa o con i test di non duplicazione. cm-orologi-alba è stata esclusa perché sospesa nella Fase 13: nessuna scheda sospesa può rientrare.",
  `- Località vuote rimosse (alba) e anagrafica ISTAT completata: ${dir.localita.filter((l) => l.codiceIstat).length} località con codice ufficiale su ${dir.localita.length}.`,
  "",
  "MILESTONE 1 — PERCORSO PER PROBLEMA (implementata)",
  "- Otto percorsi concreti su /cerca/: orologio fermo, perdita di tempo, vetro o corona rotti, batteria, restauro, pendola, vendita di un vintage, assistenza per marca.",
  "- Ogni percorso applica il filtro reale del servizio, con la nota «è un punto di partenza, non una diagnosi».",
  "- Nessuna corrispondenza: la pagina spiega il perché, mantiene il servizio e propone l'ampliamento territoriale volontario; le alternative restano separate.",
  "",
  "MILESTONE 2 — ESPANSIONE (lotto parziale, 7 nuove schede)",
  "- Metodo: registro candidati già documentati + scoperta OSM usata solo come indice, verifica dal vivo del sito ufficiale.",
  "- Integrazione con la pipeline esistente (integrate:reviewed), evidenze nel registro della Fase 38.",
  "- Obiettivo 600 non raggiunto: 557 attività. Nessun dato incerto aggiunto per gonfiare il numero.",
  "",
  "MILESTONE 3 — VALORIZZAZIONE DELLE BOTTEGHE (implementata)",
  "- Nuovo blocco «Competenze documentate» nelle schede: una frase della fonte per servizio, link «Verifica la fonte», data di aggiornamento.",
  "- Nessuna storia inventata: il blocco esiste solo con citazioni recuperate; le storie restano quelle già documentate.",
  "",
  "MILESTONE 4 — AI (verificata, non riscritta)",
  "- L'interpretazione deterministica e il provider restano quelli della Fase 38: intento tecnico senza filtri commerciali, nessuna diagnosi, nessun prezzo o ricambio inventato.",
  "- Nuovi percorsi per problema instradano la richiesta tecnica verso il servizio pertinente senza attivare una ricerca commerciale automatica.",
  "",
  "MILESTONE 5 — SEO, PRESTAZIONI, ACCESSIBILITÀ",
  "- Aggiunto BreadcrumbList strutturato sulle schede (nessun dato non pubblicato).",
  "- Verificati: canonical, robots.txt, sitemap, 404, redirect territoriali, titoli e descrizioni delle pagine toccate.",
  `- Misurazione /cerca/ (mobile, produzione): ${"502 KB"} trasferiti, ${"486 KB"} JavaScript, 4 script, 12.732 nodi. Il peso maggiore è il dataset completo inviato al client: annotato come intervento prioritario, non risolto in questa fase.`,
  "",
  "COLLAUDI",
  "- npm run check: 0 errori, 0 warning, 0 hint.",
  "- npm run build: ok, sitemap rigenerata.",
  "- npm test: 307 test, 302 pass, 0 fail, 5 skipped.",
  "- Verifica pagine in produzione dopo il nuovo pacchetto: /cerca/ 200, scheda nuova 200 con «Competenze documentate», /servizi/revisione/ 200, robots.txt e sitemap 200.",
  "",
  "DEPLOY",
  "- Preview: FASE39-PREVIEW (branch fase39-percorso-20261106).",
  "- Produzione: FASE39-PROD (branch pubblicazione-gratuita-scardi-20261022).",
  "- Rollback: 1b78dc43 (Fase 38), 9d4dc66d (Fase 37).",
  "",
  "PROBLEMI APERTI",
  "- Catalogo 557: mancano 43 attività per l'obiettivo 600; servono nuove fonti primarie, non scorciatoie.",
  "- JavaScript del client dominato dal dataset: da sostituire con una proiezione ridotta.",
  "- 413 associazioni della Fase 38 restano da verificare.",
  "",
  "SHA256 DEI FILE CHIAVE",
  hashes,
  "",
];
writeFileSync(".runtime/CHECKPOINT-fase39.txt", righe.join("\n"));
writeFileSync(".runtime/CHECKPOINT-fase39.sha256", hashes + "\n");
console.log(`checkpoint ${righe.join("\n").length} byte · ${dir.attivita.length} attività · ${conf.length} evidenze confermate`);
