import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

type C = { id: string; nome: string; via: string; cap: string; comune: string; sigla: string; tel: string | null; sito: string; pagina: string };
const candidati: C[] = JSON.parse(readFileSync('data/fase31/candidati-grezzi.json', 'utf8'));

const strip = (h: string) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ');
const digits = (s: string) => s.replace(/\D/g, '');
const token = (via: string) => {
  const stop = new Set(['via', 'viale', 'piazza', 'corso', 'piazzetta', 'della', 'delle', 'dei', 'del', 'di', 'san', 'sant', 'and', 'a']);
  const w = via.split(/[\s./]+/).filter(Boolean).filter(x => !stop.has(x.toLowerCase()));
  const lungo = w.sort((a, b) => b.length - a.length)[0] ?? '';
  return lungo;
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function verifica(c: C) {
  const esito: Record<string, unknown> = { id: c.id };
  for (const url of [c.pagina, c.sito]) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 25000);
      const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica fonti)', accept: 'text/html,application/xhtml+xml' } });
      clearTimeout(t);
      const html = await r.text();
      const testo = norm(strip(html));
      const d = digits(testo);
      const capOk = testo.includes(c.cap);
      const tok = norm(token(c.via));
      const viaOk = tok.length > 2 && testo.includes(tok);
      const telOk = c.tel ? d.includes(digits(c.tel).slice(-7)) : null;
      const comuneOk = testo.includes(norm(c.comune).replace(/'/g, ''));
      Object.assign(esito, { stato: r.status, url, capOk, viaOk, telOk, comuneOk });
      if (r.ok && capOk && viaOk) break;
    } catch (e) {
      Object.assign(esito, { stato: 'errore', url, errore: String((e as Error).message).slice(0, 60) });
    }
  }
  return esito;
}

const risultati: Record<string, unknown>[] = [];
const coda = [...candidati];
async function worker() {
  for (;;) {
    const c = coda.shift();
    if (!c) return;
    risultati.push(await verifica(c));
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const ordine = new Map(candidati.map((c, i) => [c.id, i]));
risultati.sort((a, b) => (ordine.get(a.id as string) ?? 0) - (ordine.get(b.id as string) ?? 0));
mkdirSync('data/fase31', { recursive: true });
writeFileSync('data/fase31/verifica-fonti.json', JSON.stringify(risultati, null, 2) + '\n');
for (const r of risultati) {
  const ok = r.stato === 200 && r.capOk && r.viaOk;
  console.log(`${ok ? 'OK ' : 'NO '} ${r.id} http=${r.stato} cap=${r.capOk} via=${r.viaOk} tel=${r.telOk} comune=${r.comuneOk}`);
}
console.log('verificati-ok', risultati.filter(r => r.stato === 200 && r.capOk && r.viaOk).length, 'su', risultati.length);
