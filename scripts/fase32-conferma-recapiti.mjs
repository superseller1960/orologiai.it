// Conferma indirizzo e CAP dei candidati Fase 32 che la pagina di prova non riportava.
// Scarica la homepage e le pagine di contatto usuali e cerca CAP, via e telefono.
// Uso: node scripts/fase32-conferma-recapiti.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const VOCI = [
  { id: 'orologeria-magno-bari', sito: 'https://www.orologeriamagno.it', cap: '70124', via: 'Salandra', tel: '080 5566235' },
  { id: 'gioielleria-bisciardi-avezzano', sito: 'https://gioielleriabisciardi.wixsite.com/gioielleriaorologeri', cap: '67051', via: 'Corradini', tel: null },
  { id: 'gioielleria-spinelli-cesano-maderno', sito: 'https://www.gioielleriaspinelli.it', cap: '20811', via: 'Volta', tel: '0362 504268' },
  { id: 'lissi-gioielli-rho', sito: 'https://www.lissigioielli.it', cap: '20017', via: null, tel: '02 36729430' },
  { id: 'cm-orologi-alba', sito: 'https://www.cmorologialba.it', cap: '12051', via: 'Cavour', tel: '0173 364113' },
  { id: 'zanoni-preziosi-trento', sito: 'https://zanonipreziosi.it', cap: '38122', via: null, tel: null },
  { id: 'gioielleria-tomasi-trento', sito: 'https://www.gioielleriatomasi.it', cap: '38122', via: 'Pasi', tel: null },
  { id: 'l-orologiaio-sardegna-porto-torres', sito: 'https://www.lorologiaiosardegna.com', cap: '07046', via: 'Libio', tel: null },
  { id: 'formica-francesco-citta-di-castello', sito: 'https://formicafrancesco.myadj.it/v/formicafrancesco', cap: '06012', via: 'Cavour', tel: null },
  { id: 'l-orologio-imola-imola', sito: 'https://www.lorologioimola.it', cap: '40026', via: 'Emilia', tel: '0542 21154' },
  { id: 'r-rubini-arte-del-tempo-fidenza', sito: 'https://www.rrubini.com', cap: '43036', via: 'Gramsci', tel: '0524 528157' },
  { id: 'orologeria-martini-bassano-del-grappa', sito: 'https://orologeria-martini.webnode.it', cap: '36061', via: 'Giovanna', tel: '0424 525376' },
  { id: 'parolin-1885-rosa', sito: 'https://www.parolinorologi.it', cap: '36027', via: 'Alessio', tel: '0424 580115' },
  { id: 'tarondo-orologiai-tavagnacco', sito: 'https://www.tarondo.it', cap: '33010', via: 'Udine', tel: '0432 42897' },
  { id: 'officina4-watchmaking-merano', sito: 'https://www.officina4.com', cap: '39012', via: 'Galilei', tel: '351 9616776' },
  { id: 'bellucci-echi-e-luci-martina-franca', sito: 'https://www.bellucciechieluci.com', cap: '74015', via: 'Pisacane', tel: null },
  { id: 'sandrone-gioielli-moncalieri', sito: 'https://www.sandronegioielli.com', cap: '10024', via: 'Montebello', tel: null },
  { id: 'cimafonte-orologi-napoli', sito: 'https://www.cimafonteorologi.it', cap: '80129', via: 'Fiore', tel: '081 5583888' },
  { id: 'tempo-prezioso-bologna-bologna', sito: 'https://www.tempopreziosobologna.com', cap: '40128', via: 'Bentini', tel: '051 9985671' },
  { id: 'arte-orafa-traversi-cave', sito: 'https://www.arteorafatraversi.it', cap: '00033', via: 'Pio XII', tel: '06 9507658' },
  { id: 'otto-gioielli-montebelluna', sito: 'https://ottogioielli.it', cap: '31044', via: 'Feltrina', tel: '0423 609492' },
  { id: 'legnano-orologeria-paternostro-1972-legnano', sito: 'https://www.andreapaternostro.it', cap: '20025', via: 'Garibaldi', tel: '0331 452307' },
  { id: 'la-clinica-dell-orologio-bernareggio', sito: 'https://www.clinicadellorologio.it', cap: '20881', via: 'Prinetti', tel: '039 6900217' },
  { id: 'orologiaio-zaccaria-angelo-pulsano', sito: 'https://angelozaccariaza.wixsite.com/orologiaio-zaccaria', cap: '74026', via: 'Roma', tel: '347 4396566' },
  { id: 'poli-maier-bressanone', sito: 'https://polimaier.it', cap: '39042', via: 'Minori', tel: '0472 837079' },
  { id: 'capodagli-1937-senigallia', sito: 'https://capodagli.net', cap: '60019', via: 'Giugno', tel: '071 60230' },
];

const PERCORSI = ['', '/contatti', '/contatti/', '/contatti.php', '/contatti.html', '/it/contatti', '/contact', '/dove-siamo', '/it/dove-siamo', '/negozio', '/pagine/contatti', '/chi-siamo'];

const pulisci = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

async function scarica(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it verifica recapiti)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const tipo = res.headers.get('content-type') ?? '';
    if (!tipo.includes('html')) return null;
    return pulisci(await res.text());
  } catch {
    return null;
  }
}

const soloCifre = (s) => (s ?? '').replace(/[^0-9]/g, '');

const esiti = [];
for (const v of VOCI) {
  const trovato = { id: v.id, cap: null, via: null, telefono: null, pagine: [] };
  for (const p of PERCORSI) {
    const url = v.sito.replace(/\/+$/, '') + p;
    const testo = await scarica(url);
    if (!testo) continue;
    trovato.pagine.push({ url, caratteri: testo.length });
    if (!trovato.cap && testo.includes(v.cap)) trovato.cap = url;
    if (!trovato.via && v.via && testo.toLowerCase().includes(v.via.toLowerCase())) trovato.via = url;
    if (!trovato.telefono && v.tel && soloCifre(testo).includes(soloCifre(v.tel).slice(-7))) trovato.telefono = url;
    if (trovato.cap && (trovato.via || !v.via) && (trovato.telefono || !v.tel)) break;
  }
  esiti.push(trovato);
  const stato = [trovato.cap ? 'CAP' : 'CAP?', trovato.via ? 'via' : v.via ? 'via?' : 'via-', trovato.telefono ? 'tel' : v.tel ? 'tel?' : 'tel-'].join(' ');
  console.log(`${v.id}: ${stato}${trovato.cap ? ` (${trovato.cap})` : ''}`);
}

writeFileSync('data/reports/fase32-conferma-recapiti.json', JSON.stringify({ data: new Date().toISOString().slice(0, 10), esiti }, null, 2) + '\n');
console.log('scritto data/reports/fase32-conferma-recapiti.json');
