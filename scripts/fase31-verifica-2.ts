import { writeFileSync, mkdirSync } from 'node:fs';

const candidati = [
  { id: 'del-giudice-pozzuoli', nome: 'Gioielleria Del Giudice', via: 'Piazza della Repubblica 121', cap: '80078', comune: 'Pozzuoli', sigla: 'NA', tel: '081 526 9631', sito: 'https://www.gioielleriadelgiudice.it', pagine: ['https://www.gioielleriadelgiudice.it/contatti-gioielleria-del-giudice-pozzuoli-napoli-numero-di-telefono-e-indirizzo/', 'https://www.gioielleriadelgiudice.it/riparazione-di-orologi-e-gioielli-a-pozzuoli/'] },
  { id: 'arte-doro-ostuni', nome: "Arte D'Oro Gioielli", via: 'Via Miccoli 41', cap: '72017', comune: 'Ostuni', sigla: 'BR', tel: '0831 332219', sito: 'https://www.gioielleriaartedoro.it', pagine: ['https://www.gioielleriaartedoro.it/orologi/', 'https://www.gioielleriaartedoro.it/contatti/'] },
  { id: 'guzzi-soverato', nome: 'Guzzi Gioielli', via: 'Corso Umberto I 214/216', cap: '88068', comune: 'Soverato', sigla: 'CZ', tel: '0967 21907', sito: 'https://www.guzzigioielli.it', pagine: ['https://www.guzzigioielli.it/contatti.html'] },
  { id: 'grasso-acireale', nome: 'Grasso Orologi', via: 'Via Davì 26', cap: '95024', comune: 'Acireale', sigla: 'CT', tel: '349 6440172', sito: 'http://www.grassorologi.it', pagine: ['http://www.grassorologi.it/', 'http://www.grassorologi.it/contatti/'] },
  { id: 'chelios-orosei', nome: 'Chelios Gioielli', via: 'Via Nazionale 66', cap: '08028', comune: 'Orosei', sigla: 'NU', tel: '0784 998137', sito: 'https://www.chelosgioielli.com', pagine: ['https://www.chelosgioielli.com/', 'https://www.chelosgioielli.com/contatti'] },
  { id: 'giorgetti-vasto', nome: 'Gioielleria Orologeria Giorgetti', via: 'Via Luigi Marchesani 3', cap: '66054', comune: 'Vasto', sigla: 'CH', tel: '0873 362425', sito: 'https://www.gioielleriagiorgetti.it', pagine: ['https://www.gioielleriagiorgetti.it/home/', 'https://www.gioielleriagiorgetti.it/laboratorio-riparazione-orologi-rolex/'] },
];

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const digits = (s: string) => s.replace(/\D/g, '');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const STOP = new Set(['via', 'viale', 'piazza', 'corso', 'della', 'delle', 'dei', 'del', 'di', 'san', 'sant', 'a']);
const token = (via: string) => norm(via.split(/[\s./]+/).filter(Boolean).filter(x => !STOP.has(x.toLowerCase())).sort((a, b) => b.length - a.length)[0] ?? '');

const esiti: any[] = [];
for (const c of candidati) {
  const trovati: any[] = [];
  for (const url of c.pagine) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 25000);
      const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica fonti)' } });
      clearTimeout(t);
      const testo = norm(strip(await r.text()));
      const d = digits(testo);
      trovati.push({
        url, stato: r.status,
        cap: testo.includes(c.cap),
        via: testo.includes(token(c.via)),
        tel: d.includes(digits(c.tel).slice(-7)),
        comune: testo.includes(norm(c.comune)),
      });
    } catch (e) {
      trovati.push({ url, stato: 'errore', errore: String((e as Error).message).slice(0, 60) });
    }
  }
  const buono = trovati.find(t => t.stato === 200 && t.cap && t.via);
  esiti.push({ id: c.id, ok: !!buono, dati: trovati });
  console.log(`${buono ? 'OK ' : 'NO '} ${c.id} ` + trovati.map(t => `${t.stato}:${t.cap ? 'cap' : '-'}${t.via ? 'via' : '-'}${t.tel ? 'tel' : '-'}`).join(' '));
}
mkdirSync('data/fase31', { recursive: true });
writeFileSync('data/fase31/verifica-2.json', JSON.stringify(esiti, null, 2) + '\n');
