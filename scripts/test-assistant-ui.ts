import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { directory } from '../site/src/lib/directory.ts';
import { cercaOrologiaio } from '../site/src/lib/assistant.ts';

// La pagina compilata viene eseguita nel DOM simulato insieme ai suoi eventi reali:
// click sul pulsante, Invio nella textarea, stati di caricamento, errore e ripetizione.
const html = await readFile('dist/orologiaio/index.html', 'utf8');
const files = (await readdir('dist/_astro')).filter(f => f.endsWith('.js'));
const bundles = await Promise.all(files.map(async f => ({ f, code: await readFile(`dist/_astro/${f}`, 'utf8') })));
const trovati = bundles.filter(b => b.code.includes('assistente-chat'));
assert.equal(trovati.length, 1, 'Il bundle della chat deve essere unico');
const out = await build({ entryPoints: [`dist/_astro/${trovati[0].f}`], bundle: true, format: 'iife', platform: 'browser', write: false, logLevel: 'silent' });
const script = out.outputFiles[0].text;

const errors: Error[] = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error));
const dom = new JSDOM(html, { url: 'https://orologiai.it/orologiaio/', runScripts: 'outside-only', virtualConsole });
const w = dom.window;
const doc = w.document;

const risposta = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ai = (criteri: Record<string, unknown>, chiarimenti: string[] = []) => risposta({ modalita: 'ai', avviso: null, criteri, chiarimenti });

let chiamate = 0;
let sblocca: ((r: Response) => void) | null = null;
w.fetch = ((url: string) => {
  chiamate += 1;
  assert.ok(String(url).endsWith('/api/orologiaio'), 'la chat chiama solo l’endpoint interno');
  return new Promise<Response>(resolve => { sblocca = resolve; });
}) as unknown as typeof w.fetch;

w.eval(script);

const ta = doc.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
const invia = doc.querySelector<HTMLButtonElement>('#assistente-invia');
const chat = doc.querySelector<HTMLElement>('#assistente-chat');
const form = doc.querySelector<HTMLFormElement>('#assistente-form');
const modalita = doc.querySelector<HTMLElement>('#assistente-modalita');
const contatore = doc.querySelector<HTMLElement>('#assistente-contatore');
const campoErrore = doc.querySelector<HTMLElement>('#assistente-campo-errore');
assert.ok(ta && invia && chat && form && modalita && contatore && campoErrore, 'La chat espone gli elementi attesi');

const attesa = (ms = 40) => new Promise(resolve => w.setTimeout(resolve, ms));
const scrivi = async (testo: string) => {
  ta!.value = testo;
  ta!.dispatchEvent(new w.Event('input', { bubbles: true }));
  await attesa(5);
};
const premutoInvio = (shiftKey = false) => ta!.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true, cancelable: true }));
const testoChat = () => chat!.textContent ?? '';
// Solo le schede dell'ultima risposta: la conversazione conserva i messaggi precedenti.
const schede = () => {
  const risposte = Array.from(doc.querySelectorAll<HTMLElement>('.msg-bot')).reverse();
  const ultima = risposte.find(bolla => bolla.querySelector('.chat-result'));
  return ultima ? Array.from(ultima.querySelectorAll<HTMLElement>('.chat-result')).map(el => el.dataset.businessId) : [];
};

assert.equal(doc.querySelectorAll('h1').length, 1, 'La pagina mantiene un solo titolo principale');
assert.match(doc.querySelector('meta[name="viewport"]')!.getAttribute('content')!, /width=device-width/);

// A. Stato iniziale: presentazione, suggerimenti, pulsante non inviabile senza testo.
assert.match(testoChat(), /Ciao! Ti aiuto a trovare l’orologiaio giusto/);
assert.equal(doc.querySelectorAll('[data-suggerimento]').length, 5, 'I suggerimenti iniziali sono disponibili');
assert.equal(invia!.disabled, true, 'Il pulsante è disabilitato solo quando il campo è vuoto');
assert.equal(contatore!.textContent, '0 / 500 caratteri');

// B. Un suggerimento viene inviato, non solo copiato nel campo.
const primoSuggerimento = doc.querySelector<HTMLButtonElement>('[data-suggerimento]')!;
const testoPrimoSuggerimento = primoSuggerimento.dataset.suggerimento!;
primoSuggerimento.click();
await attesa(10);
assert.equal(chiamate, 1, 'Il suggerimento avvia subito una richiesta');
assert.match(testoChat(), new RegExp(testoPrimoSuggerimento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Il testo del suggerimento compare nella conversazione');
assert.equal(doc.querySelector<HTMLElement>('#assistente-suggerimenti')!.hidden, true, 'I suggerimenti spariscono dopo il primo messaggio');
sblocca!(ai({ localita: 'firenze' }));
await attesa(40);

// C. Click sul pulsante: messaggio, caricamento, blocco dei duplicati, risposta con schede.
await scrivi('revisione a Firenze');
assert.equal(invia!.disabled, false, 'Con testo valido il pulsante è disponibile');
invia!.click();
await attesa(10);
assert.equal(chiamate, 2, 'Il click invia una sola richiesta');
assert.equal(chat!.getAttribute('aria-busy'), 'true', 'La conversazione è occupata durante la richiesta');
assert.match(testoChat(), /Sto cercando nel database…/);
assert.equal(invia!.disabled, true, 'Il pulsante è disabilitato durante la richiesta');
invia!.click();
premutoInvio();
await attesa(10);
assert.equal(chiamate, 2, 'Il pulsante disabilitato e Invio non producono richieste duplicate');
sblocca!(ai({ localita: 'firenze', servizio: 'revisione' }));
await attesa(60);
assert.equal(chat!.getAttribute('aria-busy'), 'false');
assert.match(testoChat(), /Ho interpretato la richiesta come/);
assert.equal(modalita!.textContent, 'Risposte con AI Gemini');
const attesi = cercaOrologiaio(directory, { localita: 'firenze', servizio: 'revisione' }).risultati.map(r => r.id);
assert.ok(attesi.length > 0, 'Il motore reale restituisce attività per Firenze e revisione');
assert.deepEqual(schede(), attesi, 'Le schede mostrate coincidono con il motore di ricerca');
for (const a of Array.from(doc.querySelectorAll<HTMLAnchorElement>('.chat-result a[href^="/orologeria/"]'))) {
  await readFile(`dist${a.getAttribute('href')}index.html`, 'utf8');
}

// D. Invio da tastiera: Invio invia, Maiusc+Invio no.
w.fetch = (async () => { chiamate += 1; return ai({ localita: 'firenze' }); }) as unknown as typeof w.fetch;
await scrivi('cinturino a Firenze');
const primaDiInvio = chiamate;
premutoInvio(true);
await attesa(20);
assert.equal(chiamate, primaDiInvio, 'Maiusc + Invio non invia (va a capo)');
premutoInvio();
await attesa(60);
assert.equal(chiamate, primaDiInvio + 1, 'Invio da tastiera invia il messaggio');
assert.match(testoChat(), /cinturino a Firenze/);

// E. Messaggio vuoto: nessuna richiesta, errore spiegato accanto al campo.
await scrivi('   ');
assert.equal(invia!.disabled, true);
form!.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
await attesa(20);
assert.equal(campoErrore!.hidden, false);
assert.match(campoErrore!.textContent!, /Scrivi una richiesta/);

// F. Oltre il limite di 500 caratteri: nessuna richiesta, errore esplicito.
const primaDelLimite = chiamate;
ta!.value = 'a'.repeat(501);
form!.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
await attesa(20);
assert.match(campoErrore!.textContent!, /supera 500 caratteri/);
assert.equal(chiamate, primaDelLimite, 'Il messaggio troppo lungo non viene inviato');

// G. Servizio non raggiungibile: spiegazione, ripetizione e nessun blocco della pagina.
let tentativi = 0;
w.fetch = (async () => {
  tentativi += 1;
  if (tentativi === 1) throw new Error('rete non disponibile');
  return ai({ localita: 'firenze', servizio: 'revisione' });
}) as unknown as typeof w.fetch;
await scrivi('revisione a Firenze');
invia!.click();
await attesa(80);
assert.match(testoChat(), /non raggiungibile/, 'La chat spiega che il servizio non ha risposto');
const riprova = Array.from(doc.querySelectorAll<HTMLButtonElement>('.chip')).find(b => b.textContent === 'Riprova con il servizio AI');
assert.ok(riprova, 'Viene offerto un comando per riprovare');
riprova!.click();
await attesa(80);
assert.equal(tentativi, 2, 'Il comando Riprova richiama il servizio');
assert.equal(modalita!.textContent, 'Risposte con AI Gemini');
assert.ok(schede().length > 0);

// H. Testo ostile: resta testo, non diventa HTML.
await scrivi('<img src=x onerror=alert(1)> revisione a Firenze');
w.fetch = (async () => ai({ localita: 'firenze', servizio: 'revisione' })) as unknown as typeof w.fetch;
invia!.click();
await attesa(60);
assert.equal(doc.querySelector('img'), null, 'Il testo del cliente non viene interpretato come HTML');
assert.match(testoChat(), /onerror=alert\(1\)/);

// I. Regole CSS della chat presenti nel foglio di stile compilato (mobile-first, composer aderente).
const cssFiles = (await readdir('dist/_astro')).filter(f => f.endsWith('.css'));
const css = (await Promise.all(cssFiles.map(f => readFile(`dist/_astro/${f}`, 'utf8')))).join('\n');
assert.match(css, /\.chat-log\{/, 'Il foglio di stile della chat è incluso');
assert.match(css, /position:sticky/, 'Il composer resta aderente durante lo scroll');
// Il minificatore riscrive le media query nella sintassi a intervalli: accetto entrambe le forme.
assert.match(css, /(?:max-width\s*:\s*430px|width\s*<=\s*430px)/, 'Sono presenti regole per schermi piccoli');
assert.match(css, /safe-area-inset-bottom/, 'Il composer rispetta la safe area del telefono');

assert.deepEqual(errors, [], 'Nessun errore JavaScript nella chat');
w.close();
console.log(`Chat verificata nel DOM: invio da pulsante e tastiera, nessun duplicato, caricamento, errore con Riprova, limiti 500 caratteri, ${attesi.length} schede reali. Layout non verificato graficamente.`);
