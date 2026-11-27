// Fase 39 — costruisce il lotto di integrazione dai candidati verificati dal vivo.
// Nessun campo viene dedotto: indirizzo, CAP e telefono entrano solo se la pagina li contiene.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OGGI = "2026-11-06";
const SORGENTE = process.argv[2] ?? "data/staging/fase39-verifica.json";
const NOME_LOTTO = process.argv[3] ?? "fase39-lotto1-20261106";
const EVIDENZE_OUT = process.argv[4] ?? "data/staging/fase39-evidenze-nuove.json";
const verifica = JSON.parse(readFileSync(SORGENTE, "utf8"));
const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const comuni = JSON.parse(readFileSync("data/anagrafica/comuni-italia.json", "utf8")).comuni;

const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const provinciaDi = (sigla) => {
  const trovato = comuni.find((c) => c[2] === sigla);
  return trovato ? { provincia: trovato[1], regione: trovato[3], sigla } : null;
};
// Se la fonte di scoperta non riporta la provincia, si ricava dal nome del comune.
const provinciaDelComune = (comune) => {
  const trovato = comuni.find((c) => norm(c[0]) === norm(comune));
  return trovato ? { provincia: trovato[1], regione: trovato[3], sigla: trovato[2] } : null;
};

const fonti = [];
const localita = [];
const candidati = [];
const evidenze = [];
const idUsati = new Set(dir.attivita.map((a) => a.id));
const slugUsati = new Set(dir.attivita.map((a) => a.slug));
const localitaNote = new Map(dir.localita.map((p) => [p.id, p]));
const host = (u) => (u || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
const sitiEsistenti = new Set(dir.attivita.map((a) => host(a.contatti.sito)).filter(Boolean));

const validi = verifica.candidati.filter((c) => c.stato === "verificato" && c.servizi.length >= 2);

for (const c of validi) {
  if (sitiEsistenti.has(host(c.sito))) { console.log("salto (dominio presente):", c.nome); continue; }
  const geo = (c.sigla ? provinciaDi(c.sigla) : null) ?? provinciaDelComune(c.comune);
  if (!geo) { console.log("salto (provincia sconosciuta):", c.comune, c.nome); continue; }
  const sigla = geo.sigla;
  const luogo = {
    id: slugify(c.comune), comune: c.comune, comuneSlug: slugify(c.comune),
    provincia: geo.provincia, provinciaSlug: slugify(geo.provincia), siglaProvincia: sigla,
    regione: geo.regione, regioneSlug: slugify(geo.regione), codiceIstat: null,
    descrizione: `${c.comune} (${sigla}), ${geo.regione}: attività di orologeria censita con la fonte ufficiale dell'esercizio.`,
    fonti: [],
  };
  const fonteId = `f39-${slugify(c.nome)}-${slugify(c.comune)}`.slice(0, 70);
  const urlFonte = (c.finale || c.fonte).replace(/#.*$/, "");
  const fonte = {
    id: fonteId, tipo: "sito-ufficiale", url: urlFonte,
    titolo: `${c.nome} — sito ufficiale`, consultataIl: OGGI, percorsoArchivio: null, licenza: null,
    evidenza: `Pagina ufficiale consultata il ${OGGI}: ${(c.evidenza ?? "sito ufficiale dell'attività").replace(/\s+/g, " ").slice(0, 220)}`,
  };
  fonti.push(fonte);
  if (!localitaNote.has(luogo.id)) {
    luogo.fonti = [fonteId];
    localita.push(luogo);
    localitaNote.set(luogo.id, luogo);
  }
  const idBase = `${slugify(c.nome)}-${slugify(c.comune)}`.slice(0, 60).replace(/-$/, "");
  let id = idBase;
  let n = 2;
  while (idUsati.has(id)) id = `${idBase}-${n++}`;
  idUsati.add(id);
  let slug = id;
  while (slugUsati.has(slug)) slug = `${slug}-b`;
  slugUsati.add(slug);

  const servizi = c.servizi.slice(0, 8).map((s) => ({ id: s.id, fonti: [fonteId] }));
  const specializzazioni = [];
  for (const [idSpec, re] of [["meccanici", /meccanic/], ["automatici", /automatic/], ["vintage", /vintage|epoca|antich/]]) {
    if (c.servizi.some((s) => re.test(norm(s.estratto)))) specializzazioni.push({ id: idSpec, fonti: [fonteId] });
  }
  const nomiServizi = c.servizi.slice(0, 4).map((s) => s.id);
  const etichette = {
    vendita: "vendita", "vendita-usati": "orologi usati", riparazione: "riparazione", revisione: "revisione",
    manutenzione: "manutenzione", batterie: "sostituzione batterie", cinturini: "cinturini",
    "riparazione-meccanici": "movimenti meccanici", "riparazione-automatici": "orologi automatici",
    "riparazione-quarzo": "orologi al quarzo", "restauro-vintage": "restauro", pendoleria: "pendoleria",
    "orologi-tasca": "orologi da tasca", ricambi: "ricambi", valutazioni: "valutazioni",
    lucidatura: "lucidatura", assistenza: "assistenza", gioielleria: "gioielleria",
  };
  const attivita = {
    id, slug, nome: c.nome,
    tipi: c.laboratorioInterno ? ["orologeria", "laboratorio"] : ["orologeria"],
    descrizione: `${c.nome} è un'attività di orologeria a ${c.comune} (${sigla}). La fonte ufficiale consultata documenta ${nomiServizi.map((s) => etichette[s] ?? s).join(", ")}.`.slice(0, 300),
    nomiPrecedenti: [], gruppoId: null, localitaId: luogo.id,
    posizione: { indirizzo: c.indirizzoVerificato ? c.indirizzo : null, cap: c.indirizzoVerificato && c.capVerificato ? c.cap : null, coordinate: null, fonti: [fonteId] },
    contatti: { telefono: c.telefonoVerificato ? c.telefono : null, email: null, sito: c.sito, whatsapp: null, social: [], fonti: [fonteId] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi, altriServizi: [], specializzazioni,
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] },
    storia: { annoFondazione: null, fondatore: null, testo: null, eventi: [], fonti: [] },
    attendibilita: {
      stato: "fonti-verificate", raccoltaIl: OGGI, verificataIl: OGGI, confermataTitolareIl: null,
      fonti: [fonteId], cronologia: [{ data: OGGI, azione: "Scheda creata dopo la consultazione dal vivo del sito ufficiale (Fase 39).", fonti: [fonteId] }], segnalazioni: [],
    },
    origine: { sistema: "fase39-verifica-fonte", idOriginale: c.nome },
  };
  if (c.laboratorioInterno) {
    attivita.laboratorio = { tipo: "interno", descrizione: "Laboratorio interno indicato dalla fonte ufficiale dell'attività.", fonti: [fonteId] };
  }
  candidati.push({ id, nome: c.nome, decisione: "approvata", motivo: `Fonte ufficiale verificata il ${OGGI} (HTTP ${c.http}, citazione presente nella pagina).`, fonti: [fonteId], attivita });
  for (const s of c.servizi.slice(0, 8)) {
    evidenze.push({
      attivitaId: id, servizio: s.id, fonteId, url: urlFonte, titolo: `${c.nome} — sito ufficiale`,
      estratto: s.estratto.replace(/\s+/g, " ").trim().slice(0, 220),
      tipoFonte: "sito-ufficiale", verificataIl: OGGI, stato: "confermata",
      ruolo: c.laboratorioInterno ? "laboratorio-interno" : "non-specificato", metodo: "testo-pagina",
    });
  }
}

const lotto = { lotto: NOME_LOTTO, data: OGGI, fonti, localita, candidati };
writeFileSync(`data/import/${NOME_LOTTO}.json`, JSON.stringify(lotto, null, 2) + "\n");
writeFileSync(EVIDENZE_OUT, JSON.stringify(evidenze, null, 1));
console.log(`lotto: ${candidati.length} schede · ${localita.length} località nuove · ${fonti.length} fonti · ${evidenze.length} evidenze`);
for (const c of candidati) console.log(" -", c.id, "|", c.attivita.localitaId, "|", c.attivita.servizi.map((s) => s.id).join(","));
