// Fase 31B hotfix: correzioni puntuali a tre schede verificate. Idempotente.
import { readFile, writeFile } from 'node:fs/promises';

const path = 'site/data/directory.json';
const dir = JSON.parse(await readFile(path, 'utf8'));
const byId = (id) => {
  const a = dir.attivita.find((x) => x.id === id);
  if (!a) throw new Error(`scheda mancante: ${id}`);
  return a;
};
const fonte = (id, tipo, url, titolo, evidenza) => ({
  id, tipo, url, titolo, consultataIl: '2026-11-03', percorsoArchivio: null, licenza: null,
});
const aggiungiFonte = (f) => {
  if (!dir.fonti.some((x) => x.id === f.id)) dir.fonti.push(f);
};

// 1. Chelos Gioielli: nome corretto, solo servizi documentati sui gioielli.
const chelos = byId('chelios-orosei');
chelos.nome = 'Chelos Gioielli';
chelos.nomiPrecedenti = ['Chelios Gioielli'];
chelos.tipi = ['gioielleria', 'laboratorio'];
chelos.descrizione = 'Gioielleria a Orosei con laboratorio orafo interno che dichiara riparazioni e restauri di gioielli. Nessun servizio di riparazione o restauro di orologi è documentato nella fonte.';
chelos.servizi = chelos.servizi.filter((s) => s.id === 'gioielleria');
chelos.laboratorio.tipo = 'orafo';
chelos.laboratorio.descrizione = 'Laboratorio orafo interno per riparazioni e restauri di gioielli.';

// 2. Mosele Luxury Time: telefono pubblicato sulla pagina servizi.
aggiungiFonte(fonte('f31-mosele-servizi', 'sito-ufficiale', 'https://www.moseleluxurytime.it/index.php/i-servizi', 'Mosele Luxury Time — pagina servizi'));
const mosele = byId('mosele-bolzano');
mosele.contatti.telefono = '+39 376 149 6075';
if (!mosele.contatti.fonti.includes('f31-mosele-servizi')) mosele.contatti.fonti.push('f31-mosele-servizi');
mosele.descrizione = mosele.descrizione.replace(' Il telefono non è pubblicato nella pagina consultata.', '');

// 3. Mazzonetto: civico della pagina contatti ufficiale (Via Aquileia 70).
aggiungiFonte(fonte('f31-mazzonetto-contatti', 'sito-ufficiale', 'https://www.orologiaudine.it/contatti', 'Orologeria Mazzonetto — pagina contatti'));
const mazz = byId('mazzonetto-udine');
mazz.posizione.indirizzo = 'Via Aquileia 70';
if (!mazz.posizione.fonti.includes('f31-mazzonetto-contatti')) mazz.posizione.fonti.push('f31-mazzonetto-contatti');

await writeFile(path, JSON.stringify(dir, null, 2) + '\n');
console.log('ok', { chelos: chelos.nome, mosele: mosele.contatti.telefono, mazzonetto: mazz.posizione.indirizzo });
