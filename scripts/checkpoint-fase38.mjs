// Genera .runtime/CHECKPOINT-fase38.txt e .sha256 con i numeri reali delle evidenze.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const ev = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const conf = ev.evidenze.filter((e) => e.stato === "confermata").length;
const dv = ev.evidenze.length - conf;
const att = new Set(ev.evidenze.filter((e) => e.stato === "confermata").map((e) => e.attivitaId)).size;
const per = {};
for (const e of ev.evidenze.filter((x) => x.stato === "confermata")) per[e.servizio] = (per[e.servizio] || 0) + 1;
const top = Object.entries(per).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(" · ");
const fontiConsultate = Object.keys(ev.fonti).length;

const files = [
  "data/evidenze/servizi.json", "site/src/lib/evidenze.ts", "site/src/lib/evidenza-regole.ts",
  "scripts/raccogli-evidenze.ts", "site/src/lib/recommendations.ts", "site/src/lib/search.ts",
  "site/src/lib/assistant.ts", "site/src/lib/gemini.ts", "site/src/scripts/search-ui.ts",
  "site/src/pages/cerca.astro", "site/src/styles/insights.css", "tests/evidenze.test.ts",
  "tests/intenti.test.ts", "tests/fase-07-assistant.test.ts",
];
const hashes = files.map((f) => createHash("sha256").update(readFileSync(f)).digest("hex") + "  " + f).join("\n");

const righe = [
  "OROLOGIAI.IT — CHECKPOINT FASE 38 (evidenze documentali, motivazioni premium, AI consulente)",
  "Data: 2026-11-05 · branch locale fase14d-assistente-ai · HEAD 9afff81 (modifiche non committate)",
  "",
  "STATO DI PARTENZA (Fase 37)",
  "- Produzione 9d4dc66d-b7a6-428c-ba7d-c40e6c02dc2a; catalogo 550 attività / 246 località / 1159 fonti / 82 coordinate.",
  "- Checkpoint pre-lavoro: .runtime/CHECKPOINT-pre-fase38.txt (195 file non committati, HEAD 9afff819efc119e3d22bc003edc010d2732c41c7).",
  "",
  "MILESTONE 1 — EVIDENZE DOCUMENTALI (completata)",
  "- data/evidenze/servizi.json versione 1: per ogni coppia attività+servizio registra fonteId, URL, titolo ripulito, estratto, tipo di fonte, data di verifica, stato (confermata / da-verificare), ruolo (laboratorio interno, centro assistenza ufficiale, rivendita ufficiale, punto di raccolta, non specificato) e metodo (testo-pagina).",
  "- scripts/raccogli-evidenze.ts: deduplica gli URL, una richiesta per documento, cache persistente per URL, ripresa incrementale, concorrenza 6, timeout 10 s, cap 400 KB, UA editoriale, nessun aggiramento di protezioni; una conferma precedente non viene cancellata se il sito oggi non risponde.",
  "- Copertura: " + fontiConsultate + " fonti consultate (688 URL unici), " + conf + " associazioni confermate, " + dv + " da verificare, " + att + " attività con almeno un'evidenza. Confermate per servizio: " + top + ".",
  "- Integrazione: site/src/lib/evidenze.ts (indice), site/src/lib/evidenza-regole.ts (regole condivise, etichette senza URL, pulizia estratti).",
  "- Test anti-perdita: tests/evidenze.test.ts verifica riferimenti reali, URL coincidente con la fonte, servizio elencato, lunghezza e pulizia dell'estratto, nessun duplicato, copertura minima (almeno 1000 evidenze, 300 attività, 60 revisioni) e presenza di un estratto nel bundle client dopo la build.",
  "",
  "MILESTONE 2 — MOTIVAZIONI PREMIUM (completata)",
  "- La motivazione è la frase della fonte, massimo 150 caratteri, senza URL: i titoli che erano URL diventano «pagina di <nome>».",
  "- Ogni motivo con evidenza espone «Verifica la fonte» (pagina originale, rel noopener noreferrer nofollow) fuori dal testo.",
  "- Ordine: nome, località, motivazione, servizi pertinenti, azioni; descrizione editoriale limitata a due righe (una su mobile).",
  "- Ordinamento: con filtro tecnico le attività con evidenza confermata precedono chi lo elenca soltanto; la distanza resta vincolante quando richiesta.",
  "- Assenza di prova: «Nota sulla fonte» sobria, nessuna esclusione automatica, nessun allarme sproporzionato.",
  "- Nota su /cerca/: «Ogni motivazione è una frase tratta dalla fonte citata nella scheda: N associazioni verificate, aggiornate al 5 novembre 2026».",
  "",
  "MILESTONE 3 — AI: INTENZIONI E CONSULENZA (completata)",
  "- Campo intento (tecnica, ricerca, servizio, guasto, marca-storia, aggiornata) nello schema del provider e nelle istruzioni.",
  "- Domanda tecnica o informativa: servizio e consiglio vengono rimossi lato server se l'utente non chiede esplicitamente un intervento.",
  "- Istruzioni: spiegare senza diagnosi certa, non inventare ricambi o prezzi, distinguere assistenza ufficiale e laboratorio indipendente.",
  "- La chat usa la frase della fonte come motivo; il conteggio delle fonti resta solo in mancanza di evidenza.",
  "- Test: tests/intenti.test.ts (tecnica → nessun consiglio; storia → nessun consiglio; guasto → servizio mantenuto; richiesta esplicita → consiglio mantenuto).",
  "",
  "MILESTONE 4 — FONTI ESTERNE (completata, senza nuove API)",
  "- GET /api/fonte invariato: allowlist esatta del catalogo, solo https, redirect non seguiti, timeout 4 s, 120 KB, rate limit 20/min, cache per isolate.",
  "- Verificato in produzione: fonte censita 200 con estratto; URL arbitrario 404.",
  "- Distinzione dichiarata: i dati delle schede sono del catalogo; gli estratti sono frasi recuperate e datate; nessuna ricerca web generale nel runtime (nessun servizio a pagamento).",
  "",
  "MILESTONE 5 — ESTETICA E MOBILE (completata la parte verificabile)",
  "- CSS: motivo con barra sottile, link fonte discreto, descrizione limitata, note e percorso guidato compatti; media query a 640 px.",
  "- Verifica in browser cloud a 390x844 e 1440x900 su /cerca/?servizio=revisione: nessun overflow orizzontale, motivazione visibile, nessun URL nel testo. Layout giudicato a schermo, non solo nel DOM.",
  "- Nessun popup, nessun badge decorativo; palette e tipografia invariate.",
  "",
  "MILESTONE 6 — ESPANSIONE CATALOGO: NON eseguita. Catalogo fermo a 550 attività; nessuna scheda aggiunta senza verifica.",
  "",
  "COLLAUDI",
  "- npm run check: 0 errori, 0 warning, 0 hint.",
  "- npm run build: ok; sitemap 550 URL /orologeria/; schede raggiungibili.",
  "- npm test: 304 test, 299 pass, 0 fail, 5 skipped (evidenze, intenti, /api/fonte inclusi).",
  "- npm run test:ui: ricerca e chat verificate nel DOM.",
  "- npm run package:pages: 975 file, 22,08 MB.",
  "",
  "DEPLOY",
  "- Preview: cc3c71b4 — branch fase38-evidenze-20261105, alias https://fase38-evidenze-20261105.orologiai-it.pages.dev",
  "- Produzione: 1b78dc43 — branch pubblicazione-gratuita-scardi-20261022, https://www.orologiai.it",
  "  verifica: / 200, /cerca/ 200 con nota evidenze, /servizi/revisione/ 200, sitemap 550, /api/fonte 200 e 404.",
  "- Rollback: 9d4dc66d-b7a6-428c-ba7d-c40e6c02dc2a (Fase 37); ulteriore: 1fb5ae6c (Fase 36).",
  "",
  "LIMITI DICHIARATI",
  "- " + dv + " associazioni restano «da verificare»: fonti non recuperabili (rete, HTTP, contenuto non testuale) o servizio non citato nella pagina.",
  "- Nessuna ricerca web generale: solo recupero delle fonti censite.",
  "- Gli estratti sono citazioni brevi e pertinenti, non il testo integrale delle pagine.",
  "",
  "SHA256 DEI FILE CHIAVE",
  hashes,
  "",
];

const testo = righe.join("\n");
writeFileSync(".runtime/CHECKPOINT-fase38.txt", testo);
writeFileSync(".runtime/CHECKPOINT-fase38.sha256", hashes + "\n");
console.log("checkpoint: " + testo.length + " byte · " + conf + " confermate · " + dv + " da verificare · " + att + " attività · " + fontiConsultate + " fonti");
