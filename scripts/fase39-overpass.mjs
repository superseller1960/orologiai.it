// Fase 39 — scoperta OSM (solo come strumento di scoperta, mai come prova unica).
// Estrae attività con sito web dichiarato, da verificare poi sul sito ufficiale.
import { readFileSync, writeFileSync } from "node:fs";

const UA = "Orologiai.it/1.0 (+https://www.orologiai.it/metodo/)";
const query = `[out:json][timeout:90];
area["ISO3166-1"="IT"][admin_level=2]->.it;
(
  node["shop"="watches"]["website"](area.it);
  way["shop"="watches"]["website"](area.it);
  node["craft"="watchmaker"]["website"](area.it);
  way["craft"="watchmaker"]["website"](area.it);
  node["shop"="watches"]["contact:website"](area.it);
  node["craft"="watchmaker"]["contact:website"](area.it);
);
out tags center 900;`;

const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ data: query }),
  signal: AbortSignal.timeout(120000),
});
if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
const json = await res.json();
const elementi = json.elements ?? [];

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
  if (siti.has(host(sito))) continue;
  if (nomi.has(norm(nome)) && norm(comune) === "") continue;
  const chiave = host(sito);
  if (visti.has(chiave)) continue;
  visti.add(chiave);
  const indirizzo = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null;
  candidati.push({
    osm: `${e.type}/${e.id}`, nome, comune,
    indirizzo, cap: t["addr:postcode"] || null,
    telefono: t.phone || t["contact:phone"] || null,
    sito: sito.startsWith("http") ? sito : `https://${sito}`,
    lat: e.lat ?? e.center?.lat ?? null, lon: e.lon ?? e.center?.lon ?? null,
  });
}
writeFileSync("data/staging/fase39-osm-candidati.json", JSON.stringify({ fonte: "OpenStreetMap · ODbL", elementi: elementi.length, candidati }, null, 1));
console.log(`overpass ${elementi.length} elementi · ${candidati.length} candidati con sito e comune`);
const perComune = {};
for (const c of candidati) perComune[c.comune] = (perComune[c.comune] ?? 0) + 1;
console.log(Object.entries(perComune).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${v}`).join(" · "));
