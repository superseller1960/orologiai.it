import { readFileSync } from 'node:fs';

type C = { id: string; nome: string; via: string; cap: string; comune: string; sigla: string; tel: string | null; sito: string; pagina: string };
const candidati: C[] = JSON.parse(readFileSync('data/fase31/candidati-grezzi.json', 'utf8'));
const ok = new Set([
  'lorologiaio-biella', 'orsi-gioielleria-verbania', 'bruni-imperia', 'dalmasso-1913-imperia', 'dupanloup-savona',
  'satolli-pescara', 'ranieri-laquila', 'quaranta-campobasso', 'pietro-roberto-cosenza', 'musci-catanzaro',
  'liparota-lamezia', 'golden-business-potenza', 'antezza-matera', 'groppa-trento', 'fronza-trento', 'mosele-bolzano',
  'gasser-brunico', 'mazzonetto-udine', 'demarco-belluno', 'boni-belluno', 'soprana-vicenza', 'palladio-vicenza',
  'stefani-marano', 'laboratorio-del-tempo-perugia', 'la-meridiana-narni', 'paccara-terni', 'wargas-sisti-ancona',
  'fenocchi-san-benedetto', 'miconi-civitanova', 'murgia-cagliari',
]);
const scelti = candidati.filter(c => ok.has(c.id));
console.log('accettati', scelti.length);

const dir = JSON.parse(readFileSync('site/data/directory.json', 'utf8'));
const anag = JSON.parse(readFileSync('data/anagrafica/comuni-catalogo.json', 'utf8')).comuni as any[];
const comuniAnag = new Map(anag.map(c => [c.nome, c]));
const locEsistenti = new Map(dir.localita.map((p: any) => [p.comune, p]));
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const dom = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const tel = (t: string | null) => t ? t.replace(/\D/g, '').slice(-9) : '';

const nomi = new Map(dir.attivita.map((b: any) => [norm(b.nome), b.id]));
const domini = new Map(dir.attivita.filter((b: any) => b.contatti.sito).map((b: any) => [dom(b.contatti.sito), b.id]));
const telefoni = new Map(dir.attivita.filter((b: any) => b.contatti.telefono).map((b: any) => [tel(b.contatti.telefono), b.id]));

const problemi: string[] = [];
for (const c of scelti) {
  if (nomi.has(norm(c.nome))) problemi.push(`NOME ${c.id} ~ ${nomi.get(norm(c.nome))}`);
  if (domini.has(dom(c.sito))) problemi.push(`DOMINIO ${c.id} ~ ${domini.get(dom(c.sito))}`);
  if (tel(c.tel) && telefoni.has(tel(c.tel))) problemi.push(`TELEFONO ${c.id} ~ ${telefoni.get(tel(c.tel))}`);
  const a = comuniAnag.get(c.comune);
  if (!a) problemi.push(`ISTAT-MANCANTE ${c.id} ${c.comune}`);
  else if (a.sigla !== c.sigla) problemi.push(`SIGLA ${c.id} ${c.nome}: ${c.sigla} vs ${a.sigla}`);
  if (!locEsistenti.has(c.comune)) console.log('nuova-localita', c.comune, a?.codiceIstat, a?.provincia, a?.sigla, a?.regione);
}
console.log(problemi.length ? problemi.join('\n') : 'nessun duplicato o problema geografico');
console.log('attivita-esistenti', dir.attivita.length, 'localita-esistenti', dir.localita.length);
