import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { directory } from '../site/src/lib/directory.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { cercaOrologiaio, interpretaRichiesta } from '../site/src/lib/assistant.ts';
const html = await readFile('dist/cerca/index.html','utf8');
async function bundleArtifact(file: string): Promise<string> {
  const out = await build({ entryPoints: [`dist/_astro/${file}`], bundle: true, format: 'iife', platform: 'browser', write: false, logLevel: 'silent' });
  return out.outputFiles[0].text;
}
const jsFiles = (await readdir('dist/_astro')).filter(f => f.endsWith('.js'));
const bundles = await Promise.all(jsFiles.map(async f => ({ f, code: await readFile(`dist/_astro/${f}`,'utf8') })));
const searchBundles = bundles.filter(b => b.code.includes('directory-search'));
assert.equal(searchBundles.length,1,'La ricerca deve avere un bundle verificabile');
// Astro separa i moduli condivisi in chunk ES: il file dist viene bundlato in un unico script IIFE per il DOM simulato.
const script = await bundleArtifact(searchBundles[0].f);
const mapPoints = JSON.parse(new JSDOM(html).window.document.querySelector('#directory-map')!.getAttribute('data-points')!);
assert.equal(mapPoints.length, directory.attivita.filter(b => b.posizione.coordinate?.stato === 'verificata').length, 'La mappa mostra solo coordinate verificate');
const errors: Error[] = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error));
const dom = new JSDOM(html, { url: 'https://orologiai.it/cerca/?localita=firenze', runScripts: 'outside-only', virtualConsole });
const { window } = dom;
window.eval(script);
const doc = window.document;
const form = doc.querySelector<HTMLFormElement>('#directory-search')!;
const visible = () => Array.from(doc.querySelectorAll<HTMLElement>('[data-business-id]')).filter(el=>!el.hidden);
const select = (name: string, value: string) => { const el=form.querySelector<HTMLSelectElement>(`[name="${name}"]`)!;el.value=value;el.dispatchEvent(new window.Event('change',{bubbles:true})); };
assert.equal(visible().length,directory.attivita.filter(b=>b.localitaId==='firenze').length,'Il filtro nel deep link deve essere applicato');
select('localita','milano');assert.equal(visible().length,3);
select('marca','Rolex');assert.equal(visible().length,2);
select('ruoloMarca','assistenzaUfficiale');assert.equal(visible().length,0);
assert.equal(doc.querySelector<HTMLElement>('#search-empty')!.hidden,false);
assert.equal(new URL(window.location.href).searchParams.get('ruoloMarca'),'assistenzaUfficiale');
form.reset();await new Promise(resolve=>window.setTimeout(resolve,10));assert.equal(visible().length,directory.attivita.length);
select('localita','scandicci');
select('servizio','revisione');
assert.deepEqual(visible().map(el=>el.dataset.businessId).sort(),searchDirectory(directory,{localita:'scandicci',servizio:'revisione'}).map(r=>r.business.id).sort());
assert.ok(visible().length>=2,'Nuovi risultati reali di Scandicci');
assert.equal(new URL(window.location.href).searchParams.get('localita'),'scandicci');
form.reset();await new Promise(resolve=>window.setTimeout(resolve,10));
select('provincia','pisa');assert.ok(visible().some(el=>el.dataset.businessId==='gabbani-pontedera'));
select('marca','Tissot');select('ruoloMarca','venduti');assert.deepEqual(visible().map(el=>el.dataset.businessId),['gabbani-pontedera']);
form.reset();await new Promise(resolve=>window.setTimeout(resolve,10));
const query = form.querySelector<HTMLInputElement>('[name="q"]')!;
query.value='Sangalli Milano';form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(visible().length,1);assert.equal(visible()[0].dataset.businessId,'sangalli');
assert.match(doc.querySelector('#search-count')!.textContent!,/1 attività trovata/);
query.value='<img src=x onerror=alert(1)>';query.dispatchEvent(new window.Event('input',{bubbles:true}));
assert.equal(visible().length,0);assert.equal(doc.querySelector('img'),null);
assert.deepEqual(errors,[],'Nessun errore JavaScript nel DOM simulato');
// Orologiaio: stesso bundle statico della pagina, eseguito nel DOM simulato.
const assistantHtml = await readFile('dist/orologiaio/index.html', 'utf8');
const assistantBundles = bundles.filter(b => b.code.includes('assistente-form'));
assert.equal(assistantBundles.length, 1, 'Il bundle dell’Orologiaio deve essere unico');
const errors2: Error[] = [];
const vc2 = new VirtualConsole();
vc2.on('jsdomError', error => errors2.push(error));
const dom2 = new JSDOM(assistantHtml, { url: 'https://orologiai.it/orologiaio/', runScripts: 'outside-only', virtualConsole: vc2 });
const win2 = dom2.window;
win2.eval(await bundleArtifact(assistantBundles[0].f));
const doc2 = win2.document;
const form2 = doc2.querySelector<HTMLFormElement>('#assistente-form')!;
const ta = form2.querySelector<HTMLTextAreaElement>('textarea')!;
const wait = () => new Promise(resolve => win2.setTimeout(resolve, 30));
const send = async (text: string) => {
  ta.value = text;
  form2.dispatchEvent(new win2.Event('submit', { bubbles: true, cancelable: true }));
  await wait();
};
const cardIds = () => Array.from(doc2.querySelectorAll<HTMLElement>('#assistente-risultati [data-business-id]')).map(el => el.dataset.businessId);
const messaggiTesto = () => doc2.querySelector<HTMLElement>('#assistente-messaggi')!.textContent ?? '';

await send('Cerco un orologiaio a Firenze per la revisione');
const attesi = cercaOrologiaio(directory, interpretaRichiesta('Cerco un orologiaio a Firenze per la revisione', directory).criteri).risultati.map(r => r.id);
assert.ok(attesi.length > 0);
assert.deepEqual(cardIds(), attesi, 'Le schede visualizzate coincidono con il motore di ricerca');
for (const a of Array.from(doc2.querySelectorAll<HTMLAnchorElement>('#assistente-risultati a[href^="/orologeria/"]'))) {
  assert.match(a.getAttribute('href') ?? '', /^\/orologeria\/[a-z0-9-]+\/$/);
}

await send('Cerco un orologiaio a Roma');
assert.equal(cardIds().length, 0, 'Località non censita: nessun risultato');
assert.match(messaggiTesto(), /Roma/);

await send('Cerco un centro assistenza ufficiale Rolex vicino a Milano');
assert.equal(cardIds().length, 0, 'Assistenza Rolex non documentata: nessuna scheda come ufficiale');
assert.equal(doc2.querySelector<HTMLElement>('#assistente-alternative-titolo')!.hidden, false);

await send('');
assert.match(doc2.querySelector<HTMLElement>('#assistente-stato')!.textContent ?? '', /Scrivi una richiesta/);

await send('a'.repeat(501));
assert.match(doc2.querySelector<HTMLElement>('#assistente-stato')!.textContent ?? '', /supera 500 caratteri/);

await send('<img src=x onerror=alert(1)> revisione a Firenze');
assert.equal(doc2.querySelector('#assistente-risultati img'), null, 'Il testo utente non diventa HTML');
assert.equal(doc2.querySelector('img'), null);

const esempio = doc2.querySelector<HTMLButtonElement>('[data-esempio]')!;
esempio.click();
assert.equal(ta.value, esempio.dataset.esempio);
assert.deepEqual(errors2, [], 'Nessun errore JavaScript nella pagina dell’Orologiaio');
win2.close();

window.close();console.log('Interfaccia compilata verificata nel DOM: deep link, filtri, autorizzazioni, reset, submit, stato vuoto e input ostile. Rendering grafico non testato.');
