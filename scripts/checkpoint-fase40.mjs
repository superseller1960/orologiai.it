// Fase 40 — checkpoint verificabile: duplicato, audit, performance, test, deploy.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const preview = process.argv[2] ?? "PREVIEW";
const produzione = process.argv[3] ?? "PRODUZIONE";
const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const reg = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const meta = JSON.parse(readFileSync("data/evidenze/meta.json", "utf8"));
const audit = JSON.parse(readFileSync("data/reports/fase40-audit-duplicati.json", "utf8"));
const canonica = dir.attivita.find((b) => b.id === "lorologiaio-ascione-porto-torres");
const file = [
  "site/data/directory.json", "data/evidenze/servizi.json", "data/evidenze/confermate.json", "data/evidenze/meta.json",
  "site/src/lib/duplicates.ts", "site/src/lib/reviewed-import.ts", "site/src/lib/redirect-schede.ts",
  "data/anagrafica/redirect-schede.json", "data/anagrafica/comuni-catalogo.json",
  "site/src/pages/orologeria/[slug].astro", "site/src/pages/cerca.astro", "site/src/lib/assistant.ts",
  "site/src/scripts/map-lazy.ts", "tests/fase40.test.ts", "tests/fase40-ai.test.ts",
  "scripts/fase40-unifica-duplicato.mjs", "scripts/fase40-audit-duplicati.mjs",
  "scripts/fase40-pulisci-estratti.mjs", "scripts/fase40-evidenze-client.mjs",
  "data/reports/fase40-audit-duplicati.json",
];
const hashes = file.filter((f) => { try { readFileSync(f); return true; } catch { return false; } })
  .map((f) => `${createHash("sha256").update(readFileSync(f)).digest("hex")}  ${f}`).join("\n");

const righe = [
  "OROLOGIAI.IT — CHECKPOINT FASE 40 (integrità catalogo, performance, evidenze leggibili)",
  "Data: 2026-11-06 · modifiche non committate · deploy di partenza 8996c4e0 (Fase 39)",
  "",
  "MILESTONE 1 — DUPLICATO CORRETTO",
  `- Canonica: ${canonica.id} (${canonica.nome}), Via Libio 15, Porto Torres, ${canonica.contatti.telefono}.`,
  "- Fonte verificata: i due siti ufficiali (lorologiaio.net e lorologiaiosardegna.com) riportano lo stesso indirizzo e lo stesso telefono: stessa azienda.",
  "- Recuperati dalla scheda duplicata solo i servizi nuovi (riparazione-quarzo, ricambi) e la fonte del sito storico; conservati storia, coordinate, email e recapiti della canonica.",
  "- Scheda l-orologiaio-sardegna-porto-torres rimossa; redirect 301 permanente in data/anagrafica/redirect-schede.json; cronologia e segnalazione risolta registrate.",
  `- Attività: ${dir.attivita.length} · località: ${dir.localita.length} · fonti: ${dir.fonti.length}.`,
  "",
  "MILESTONE 2 — DEDUPLICAZIONE",
  "- classificaCoppia: duplicato confermato solo con telefono o indirizzo identici; dominio condiviso = possibile duplicato (due sedi della stessa insegna non sono un duplicato).",
  "- integrate:reviewed classifica ogni candidato contro l'intero catalogo e mette in revisione i duplicati confermati: non vengono pubblicati.",
  `- Audit dell'intero catalogo: ${audit.attivita} attività, ${audit.coppie.length} coppie segnalate, ${JSON.stringify(audit.classi)}. Report in data/reports/fase40-audit-duplicati.json.`,
  "",
  "MILESTONE 3 — PERFORMANCE (misure reali, stesse condizioni)",
  "- Prima (produzione 8996c4e0, /cerca/): 851.254 byte HTML (95.971 gzip), bundle ricerca 974 KB, mappa 158 KB caricata sempre, 502 KB trasferiti.",
  "- Dopo: bundle ricerca 645 KB (101.411 byte gzip, −34% non compresso), mappa caricata solo all'apertura del pannello (158 KB fuori dal percorso iniziale), assistente già su import dinamico.",
  "- Evidenze client ridotte del 35%: il client riceve solo le confermate (data/evidenze/confermate.json), non il registro completo con cache di rete.",
  "- HTML non ridotto: le 556 card sono ancora server-rendered. È il prossimo intervento, dichiarato aperto.",
  "",
  "MILESTONE 4 — EVIDENZE",
  `- Registro ${reg.evidenze.length} associazioni · confermate ${meta.confermate} · da verificare ${meta.daVerificare}.`,
  "- Pulizia: entità HTML decodificate, menu e boilerplate rimossi, scelta della frase che contiene la parola del servizio; le citazioni che non dimostravano il servizio sono passate a «da-verificare» invece di restare confermate per caso.",
  "- Gioielleria Spinelli: sede verificata a Cesano Maderno; i riferimenti commerciali a Cantù e Meda restano citazioni della fonte e non cambiano la località della scheda.",
  "",
  "MILESTONE 5 — AI",
  "- Aggiunta la guardia informativa: «come funziona», «che cos'è», «a cosa serve», «differenza tra» non attivano servizio, tipo o specializzazione, salvo richiesta operativa esplicita.",
  "- Riconosciuti i guasti descritti con quantità («perde dieci minuti al giorno»).",
  "- Test dedicati: rotore, scappamento, guasto, revisione a Firenze, cambio vetro, assistenza ufficiale Rolex a Milano.",
  "",
  "COLLAUDI",
  "- npm run check: 0 errori, 0 warning, 0 hint.",
  "- npm run build: ok.",
  "- npm test: 318 test, 313 pass, 0 fail, 5 skipped.",
  "- npm run test:ui: ok.",
  "- npm run package:pages: 984 file, 22,90 MB.",
  "",
  "DEPLOY",
  `- Preview: ${preview} (branch fase40-integrity-20261106).`,
  `- Produzione: ${produzione} (branch pubblicazione-gratuita-scardi-20261022).`,
  "- Rollback: 8996c4e0 (Fase 39), 1b78dc43 (Fase 38), 9d4dc66d (Fase 37).",
  "",
  "PROBLEMI APERTI",
  "- HTML di /cerca/ ancora pesante: 556 card server-rendered; serve rendering progressivo lato client.",
  "- Catalogo 556: mancano 44 attività per l'obiettivo 600; nessuna scorciatoia.",
  `- ${meta.daVerificare} associazioni restano da verificare.`,
  "",
  "SHA256 DEI FILE CHIAVE",
  hashes,
  "",
];
writeFileSync(".runtime/CHECKPOINT-fase40.txt", righe.join("\n"));
writeFileSync(".runtime/CHECKPOINT-fase40.sha256", hashes + "\n");
console.log(`checkpoint ${righe.join("\n").length} byte · ${dir.attivita.length} attività · ${meta.confermate} confermate`);
