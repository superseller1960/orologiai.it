// Fase 40 — unifica il duplicato Porto Torres nella scheda canonica preesistente.
// Regola: si conserva la scheda con storia, coordinate e recapiti verificati; dalla seconda
// si recuperano solo servizi, fonti ed evidenze autenticamente nuovi.
import { readFileSync, writeFileSync } from "node:fs";

const OGGI = "2026-11-06";
const CANONICA = "lorologiaio-ascione-porto-torres";
const DUPLICATA = "l-orologiaio-sardegna-porto-torres";
const FONTE_NUOVA = "f39-l-orologiaio-sardegna-porto-torres";

const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const canonica = dir.attivita.find((b) => b.id === CANONICA);
const duplicata = dir.attivita.find((b) => b.id === DUPLICATA);
if (!canonica || !duplicata) throw new Error("Schede attese non trovate: unificazione interrotta");

// 1. Servizi nuovi: solo quelli che la canonica non elencava.
const serviziNuovi = duplicata.servizi.filter((s) => !canonica.servizi.some((x) => x.id === s.id));
for (const s of serviziNuovi) canonica.servizi.push({ id: s.id, fonti: [FONTE_NUOVA] });

// 2. Fonti: il sito storico della stessa azienda entra come fonte consultata, non come sede diversa.
for (const f of [FONTE_NUOVA]) {
  if (!canonica.contatti.fonti.includes(f)) canonica.contatti.fonti.push(f);
  if (!canonica.attendibilita.fonti.includes(f)) canonica.attendibilita.fonti.push(f);
}

// 3. Cronologia e segnalazione: la correzione resta tracciata.
canonica.attendibilita.cronologia.push({
  data: OGGI,
  azione: `Fase 40: unificata la scheda duplicata ${DUPLICATA} (stessa azienda: Via Libio 15, Porto Torres, telefono 079 501900, verificato sui due siti ufficiali). Recuperati i servizi ${serviziNuovi.map((s) => s.id).join(", ") || "nessuno"} e la fonte del sito storico; conservati storia, coordinate e recapiti della scheda canonica.`,
  fonti: [FONTE_NUOVA],
});
canonica.attendibilita.segnalazioni.push({
  data: OGGI,
  motivo: `Scheda duplicata introdotta nella Fase 39 con nome commerciale diverso (${duplicata.nome}) ma stesso indirizzo e stesso telefono.`,
  stato: "risolta",
});
canonica.origine.idOriginale = canonica.origine.idOriginale ?? CANONICA;

// 4. Evidenze: si trasferiscono solo quelle dei servizi nuovi; le altre erano già documentate.
const registro = JSON.parse(readFileSync("data/evidenze/servizi.json", "utf8"));
const daTrasferire = registro.evidenze.filter((e) => e.attivitaId === DUPLICATA && serviziNuovi.some((s) => s.id === e.servizio));
registro.evidenze = registro.evidenze.filter((e) => e.attivitaId !== DUPLICATA);
for (const e of daTrasferire) {
  if (registro.evidenze.some((x) => x.attivitaId === CANONICA && x.servizio === e.servizio && x.url === e.url)) continue;
  registro.evidenze.push({ ...e, attivitaId: CANONICA });
}
registro.aggiornatoIl = OGGI;

// 5. La scheda duplicata esce dal catalogo.
dir.attivita = dir.attivita.filter((b) => b.id !== DUPLICATA);

// 6. Redirect permanente: il vecchio URL resta raggiungibile e porta alla scheda canonica.
const registroRedirect = JSON.parse(readFileSync("data/anagrafica/redirect-territoriali.json", "utf8"));
const da = `/orologeria/${DUPLICATA}/`;
const a = `/orologeria/${CANONICA}/`;
if (!registroRedirect.regole.some((r) => r.da === da)) {
  registroRedirect.regole.unshift({
    da, a,
    motivo: "Fase 40: scheda duplicata unificata nella scheda canonica della stessa azienda (Porto Torres).",
    soloEsatto: true,
  });
}

writeFileSync("site/data/directory.json", JSON.stringify(dir, null, 2) + "\n");
writeFileSync("data/evidenze/servizi.json", JSON.stringify(registro));
writeFileSync("data/anagrafica/redirect-territoriali.json", JSON.stringify(registroRedirect, null, 2) + "\n");

console.log(`attività ${dir.attivita.length} · servizi recuperati: ${serviziNuovi.map((s) => s.id).join(", ") || "nessuno"}`);
console.log(`evidenze trasferite: ${daTrasferire.map((e) => e.servizio).join(", ") || "nessuna"} · totale ${registro.evidenze.length}`);
console.log(`redirect: ${da} → ${a}`);
