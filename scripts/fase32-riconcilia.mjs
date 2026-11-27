// Fase 32: riconcilia i lotti Fase 31 con il catalogo corretto e archivia Chelos.
// Idempotente. Uso: node scripts/fase32-riconcilia.mjs [--apply]
import { readFile, writeFile } from 'node:fs/promises';

const apply = process.argv.includes('--apply');
const DIR = 'site/data/directory.json';
const LOTTI = ['data/import/fase31-01.json', 'data/import/fase31-02.json'];
const REGISTRO = 'data/fase31/registro-candidati.json';

const dir = JSON.parse(await readFile(DIR, 'utf8'));

// 1. Lotti: correzioni del hotfix replicate nei file di import.
const lotti = {};
for (const f of LOTTI) lotti[f] = JSON.parse(await readFile(f, 'utf8'));

const cand = (lotto, id) => lotto.candidati.find((c) => c.id === id);

const mosele = cand(lotti[LOTTI[0]], 'mosele-bolzano').attivita;
mosele.contatti.telefono = '+39 376 149 6075';
if (!mosele.contatti.fonti.includes('f31-mosele-servizi')) mosele.contatti.fonti.push('f31-mosele-servizi');
mosele.descrizione = mosele.descrizione.replace(' Il telefono non è pubblicato nella pagina consultata.', '');

const mazz = cand(lotti[LOTTI[0]], 'mazzonetto-udine').attivita;
mazz.posizione.indirizzo = 'Via Aquileia 70';
if (!mazz.posizione.fonti.includes('f31-mazzonetto-contatti')) mazz.posizione.fonti.push('f31-mazzonetto-contatti');

// Chelos: nessuna prova di attività orologiaia -> scartata, fuori dal catalogo pubblico.
const chelosCand = cand(lotti[LOTTI[1]], 'chelios-orosei');
chelosCand.decisione = 'scartata';
chelosCand.motivo = 'Fonte ufficiale (chelosgioielli.com): attività di gioielleria e laboratorio orafo; "orologeria" compare solo come categoria di catalogo di marche, senza servizi orologieri documentati. Scheda non pertinente per il catalogo orologiai.';
delete chelosCand.attivita;

// Fonti del lotto 2 usate solo da Chelos: restano come documentazione dell'esclusione.

// 2. Catalogo: rimuove Chelos.
const prima = dir.attivita.length;
dir.attivita = dir.attivita.filter((a) => a.id !== 'chelios-orosei');

// Mosele e Mazzonetto nel catalogo: stesse correzioni del hotfix (idempotenti).
const aMosele = dir.attivita.find((a) => a.id === 'mosele-bolzano');
aMosele.contatti.telefono = '+39 376 149 6075';
if (!aMosele.contatti.fonti.includes('f31-mosele-servizi')) aMosele.contatti.fonti.push('f31-mosele-servizi');
aMosele.descrizione = aMosele.descrizione.replace(' Il telefono non è pubblicato nella pagina consultata.', '');
const aMazz = dir.attivita.find((a) => a.id === 'mazzonetto-udine');
aMazz.posizione.indirizzo = 'Via Aquileia 70';
if (!aMazz.posizione.fonti.includes('f31-mazzonetto-contatti')) aMazz.posizione.fonti.push('f31-mazzonetto-contatti');

// 3. Registro.
const reg = JSON.parse(await readFile(REGISTRO, 'utf8'));
const rc = reg.candidati.find((c) => c.id === 'chelios-orosei');
if (rc) {
  rc.stato = 'scartato';
  rc.motivo = chelosCand.motivo;
}

console.log(JSON.stringify({ attivitaPrima: prima, attivitaDopo: dir.attivita.length, apply }, null, 2));
if (apply) {
  await writeFile(DIR, JSON.stringify(dir, null, 2) + '\n');
  for (const f of LOTTI) await writeFile(f, JSON.stringify(lotti[f], null, 2) + '\n');
  await writeFile(REGISTRO, JSON.stringify(reg, null, 2) + '\n');
}
