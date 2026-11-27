import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

type C = { id: string; nome: string; via: string; cap: string; comune: string; sigla: string; tel: string | null; sito: string; pagina: string };
const ids = new Set(['orsi-gioielleria-verbania', 'officine-complicato-pescara', 'clementi-bolzano', 'fronza-trento', 'gasser-brunico', 'demarco-belluno', 'boni-belluno', 'fenocchi-san-benedetto', 'officina-del-tempo-olbia']);
const candidati: C[] = (JSON.parse(readFileSync('data/fase31/candidati-grezzi.json', 'utf8')) as C[]).filter(c => ids.has(c.id));

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const digits = (s: string) => s.replace(/\D/g, '');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const token = (via: string) => {
  const stop = new Set(['via', 'viale', 'piazza', 'corso', 'piazzetta', 'della', 'delle', 'dei', 'del', 'di', 'san', 'sant', 'a']);
  return norm(via.split(/[\s./]+/).filter(Boolean).filter(x => !stop.has(x.toLowerCase())).sort((a, b) => b.length - a.length)[0] ?? '');
};
const percorsi = ['', '/contatti', '/contatti/', '/it/contatti', '/pages/contatti', '/dove-siamo', '/dove-siamo/', '/chi-siamo', '/chi-siamo/', '/negozio', '/store'];

const esiti: Record<string, unknown>[] = [];
for (const c of candidati) {
  let trovato: Record<string, unknown> | null = null;
  for (const p of percorsi) {
    const url = c.sito.replace(/\/$/, '') + p;
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 20000);
      const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica fonti)' } });
      clearTimeout(t);
      if (!r.ok) continue;
      const testo = norm(strip(await r.text()));
      const capOk = testo.includes(c.cap);
      const viaOk = testo.includes(token(c.via));
      const telOk = c.tel ? digits(testo).includes(digits(c.tel).slice(-7)) : null;
      if (capOk || viaOk) {
        trovato = { id: c.id, url, capOk, viaOk, telOk };
        if (capOk && viaOk) break;
      }
    } catch { /* pagina non raggiungibile: si prova la successiva */ }
  }
  esiti.push(trovato ?? { id: c.id, url: null, capOk: false, viaOk: false, telOk: null });
  console.log(JSON.stringify(esiti.at(-1)));
}
mkdirSync('data/fase31', { recursive: true });
writeFileSync('data/fase31/verifica-recupero.json', JSON.stringify(esiti, null, 2) + '\n');
