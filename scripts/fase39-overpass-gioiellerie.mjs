// Fase 39 — seconda scoperta OSM: gioiellerie con sito dichiarato.
// Entrano nel catalogo solo se il sito documenta davvero servizi di orologeria (verifica separata).
import { readFileSync, writeFileSync } from "node:fs";

const UA = "Orologiai.it/1.0 (+https://www.orologiai.it/metodo/)";
const query = `[out:json][timeout:90];
area["ISO3166-1"="IT"][admin_level=2]->.it;
(
  node["shop"="jewelry"]["website"](area.it);
  way["shop"="jewelry"]["website"](area.it);
  node["shop"="jewelry"]["contact:website"](area.it);
);
out tags center 500;`;

const ENDPOINT = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
let elementi = [];
let ultimoErrore = null;
for (const endpoint of ENDPOINT) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) { ultimoErrore = `HTTP ${res.status} (${endpoint})`; continue; }
    elementi = (await res.json()).elements ?? [];
    if (elementi.length) { console.log("endpoint:", endpoint); break; }
  } catch (e) {
    ultimoErrore = String(e).slice(0, 90);
  }
}
if (!elementi.length) console.log("nessun elemento:", ultimoErrore);

const dir = JSON.parse(readFileSync("site/data/directory.json", "utf8"));
const host = (u) => (u || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const siti = new Set(dir.attivita.map((a) => host(a.contatti.sito)).filter(Boolean));
const nomi = new Set(dir.attivita.map((a) => norm(a.nome)));

const visti = new Set();
const candidati = [];
for (const e of elementi) {
  const t = e.tags ?? {};
  const sito = t.website || t["contact:website"] || "";
  const nome = t.name || t["name:it"] || "";
  const comune = t["addr:city"] || "";
  if (!sito || !nome || !comune) continue;
  if (siti.has(host(sito)) || nomi.has(norm(nome))) continue;
  if (visti.has(host(sito))) continue;
  visti.add(host(sito));
  candidati.push({
    osm: `${e.type}/${e.id}`, nome, comune,
    indirizzo: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null,
    cap: t["addr:postcode"] || null,
    telefono: t.phone || t["contact:phone"] || null,
    sito: sito.startsWith("http") ? sito : `https://${sito}`,
  });
}
// Ordine stabile: prima le città con più segnalazioni, così la verifica copre più territori.
const perComune = {};
for (const c of candidati) perComune[c.comune] = (perComune[c.comune] ?? 0) + 1;
writeFileSync("data/staging/fase39-osm-gioiellerie.json", JSON.stringify({ fonte: "OpenStreetMap · ODbL", elementi: elementi.length, candidati }, null, 1));
console.log(`overpass gioiellerie ${elementi.length} · ${candidati.length} candidati con sito (${Object.keys(perComune).length} comuni)`);
