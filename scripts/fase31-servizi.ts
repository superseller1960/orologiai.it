import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

type C = { id: string; nome: string; via: string; cap: string; comune: string; sigla: string; tel: string | null; sito: string; pagina: string };
const ids = ['lorologiaio-biella', 'orsi-gioielleria-verbania', 'bruni-imperia', 'dalmasso-1913-imperia', 'dupanloup-savona', 'satolli-pescara', 'ranieri-laquila', 'quaranta-campobasso', 'pietro-roberto-cosenza', 'musci-catanzaro', 'liparota-lamezia', 'mosele-bolzano', 'mazzonetto-udine'];
const candidati: C[] = (JSON.parse(readFileSync('data/fase31/candidati-grezzi.json', 'utf8')) as C[]).filter(c => ids.includes(c.id));

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&egrave;/g, 'e').replace(/\s+/g, ' ').trim();
const chiavi = ['riparazion', 'revision', 'restaur', 'pendol', 'batteri', 'cinturin', 'assistenza', 'manutenzion', 'vendita', 'valutazion', 'incision', 'da tasca', 'svegli', 'carillon', 'orologi da tavolo', 'ricambi', 'lucidatura', 'impermeabil', 'subacque', 'cronograf'];

const esiti: any[] = [];
for (const c of candidati) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);
    const r = await fetch(c.pagina, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica fonti)' } });
    clearTimeout(t);
    const testo = strip(await r.text());
    const basso = testo.toLowerCase();
    const trovate = chiavi.filter(k => basso.includes(k));
    const estratti: string[] = [];
    for (const k of ['riparazion', 'revision', 'restaur', 'assistenza', 'vendita']) {
      const i = basso.indexOf(k);
      if (i >= 0) estratti.push(testo.slice(Math.max(0, i - 80), i + 160).replace(/\s+/g, ' '));
    }
    esiti.push({ id: c.id, stato: r.status, url: c.pagina, chiavi: trovate, estratti });
    console.log('\n##', c.id, 'http=' + r.status, 'chiavi:', trovate.join(','));
    for (const e of estratti) console.log('  ...', e);
  } catch (e) {
    esiti.push({ id: c.id, stato: 'errore', url: c.pagina, errore: String((e as Error).message) });
    console.log('\n##', c.id, 'ERRORE');
  }
}
mkdirSync('data/fase31', { recursive: true });
writeFileSync('data/fase31/servizi-documentati.json', JSON.stringify(esiti, null, 2) + '\n');
