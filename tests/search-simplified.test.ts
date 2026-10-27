import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { directory } from '../site/src/lib/directory.ts';
import { searchDirectory } from '../site/src/lib/search.ts';
import { interpretaRichiesta, cercaOrologiaio } from '../site/src/lib/assistant.ts';

// Stessi criteri e stesso limite della pagina di ricerca: le attese non dipendono da numeri fissi.
const esitiSemantici = (msg: string) => {
  const { criteri } = interpretaRichiesta(msg, directory);
  return cercaOrologiaio(directory, criteri, { limite: 200 });
};

const html = await readFile('dist/cerca/index.html', 'utf8');

async function bundleArtifact(file: string): Promise<string> {
  const out = await build({
    entryPoints: [`dist/_astro/${file}`],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'silent',
  });
  return out.outputFiles[0].text;
}

const jsFiles = (await readdir('dist/_astro')).filter(f => f.endsWith('.js'));
const bundles = await Promise.all(jsFiles.map(async f => ({ f, code: await readFile(`dist/_astro/${f}`, 'utf8') })));
const searchBundles = bundles.filter(b => b.code.includes('directory-search'));
assert.equal(searchBundles.length, 1, 'La ricerca deve avere un bundle verificabile');

const script = await bundleArtifact(searchBundles[0].f);
const errors: Error[] = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { console.error('jsdomError:', error); errors.push(error); });
virtualConsole.on('error', error => console.error('console error:', error));

const dom = new JSDOM(html, {
  url: 'https://orologiai.it/cerca/',
  runScripts: 'outside-only',
  virtualConsole,
});
const { window } = dom;

// Simula fetch per endpoint /api/posizione nella finestra JSDOM
(window as unknown as { fetch: typeof fetch }).fetch = async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes('/api/posizione')) {
    return new Response(
      JSON.stringify({
        disponibile: true,
        regioneSlug: 'lombardia',
        regioneNome: 'Lombardia',
        citta: 'Milano',
        paese: 'IT',
        messaggio: 'Zona suggerita dalla connessione: Lombardia',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }
  return new Response(JSON.stringify({}), { status: 404 });
};

window.eval(script);
const doc = window.document;
const form = doc.querySelector<HTMLFormElement>('#directory-search')!;
const visible = () => Array.from(doc.querySelectorAll<HTMLElement>('[data-business-id]')).filter(el => !el.hidden);
const qInput = form.querySelector<HTMLInputElement>('[name="q"]')!;

// 1. Partenza: tutte le attività del database visibili
assert.equal(visible().length, directory.attivita.length, 'Tutte le attività visibili inizialmente');

// 2. Campo unico: "revisione di un Rolex" riconosce servizio e marca e mostra tutti i risultati esatti
qInput.value = 'revisione di un Rolex';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const rolex = esitiSemantici('revisione di un Rolex');
assert.equal(rolex.stato, 'ok');
assert.ok(rolex.totale >= 5, 'Riconosciuti Rolex + revisione');
assert.deepEqual(visible().map(el => el.dataset.businessId).sort(), rolex.risultati.map(r => r.id).sort(), 'Tutti e soli i risultati esatti del motore');
assert.ok(visible().some(el => el.dataset.businessId === 'casa-cronometro-roma'));
assert.ok(visible().some(el => el.dataset.businessId === 'orologica-torino'));
assert.match(doc.querySelector('#search-count')!.textContent!, /attività trovate/);
assert.doesNotMatch(doc.querySelector('#search-count')!.textContent!, /alternative pertinenti/, 'I risultati esatti non sono alternativi');

// 3. Campo unico: "cambio batteria"
qInput.value = 'cambio batteria';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const batterie = esitiSemantici('cambio batteria');
assert.equal(batterie.stato, 'ok');
assert.deepEqual(visible().map(el => el.dataset.businessId).sort(), batterie.risultati.map(r => r.id).sort(), 'Riconosciuto cambio batteria');
assert.ok(visible().some(el => el.dataset.businessId === 'fontana-bologna'));

// 4. Campo unico: "assistenza ufficiale Cartier" (nessun risultato esatto, alternative pertinenti)
//    Omega non è più un caso negativo: errani-ravenna ha rivendita Omega documentata
//    dallo store locator ufficiale (riclassificata all'audit del 27/10/2026). Cartier ha attività che
//    lo trattano ma nessuna assistenza ufficiale documentata.
qInput.value = 'assistenza ufficiale Cartier';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
assert.ok(visible().length > 0, 'Mostra alternative pertinenti per assistenza Cartier');
assert.match(doc.querySelector('#search-count')!.textContent!, /alternative pertinenti/);

// 5. Ricerca diretta per nome / indirizzo / CAP: "Sangalli Milano"
qInput.value = 'Sangalli Milano';
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
assert.equal(visible().length, 1);
assert.equal(visible()[0].dataset.businessId, 'sangalli');

// 6. Scorciatoia frequente: click su bottone revisione
form.reset();
await new Promise(r => window.setTimeout(r, 10));
const btnRev = doc.querySelector<HTMLButtonElement>('[data-shortcut-value="revisione"]')!;
btnRev.click();
assert.equal(visible().length, directory.attivita.filter(b => b.servizi.some(s => s.id === 'revisione')).length);

// 7. Zona suggerita caricata in background
await new Promise(r => window.setTimeout(r, 20));
const zoneBadge = doc.querySelector<HTMLElement>('#zone-badge')!;
assert.equal(zoneBadge.hidden, false, 'Badge zona suggerita visibile dopo il fetch');
assert.match(doc.querySelector('#zone-info')!.textContent!, /Lombardia/);

// 8. Integrazione delle due ricerche: servizi rapidi e scorciatoie condividono lo stesso pulsante,
//    e la ricerca guidata a tre passi resta struttura della pagina.
const dual = doc.querySelector<HTMLButtonElement>('[data-service="revisione"]');
assert.ok(dual?.classList.contains('search-shortcut'), 'Il pulsante Revisione unifica servizi rapidi e scorciatoie');
assert.ok(dual?.dataset.shortcutValue === 'revisione' && dual?.dataset.shortcutField === 'servizio');
assert.ok(doc.querySelector('#step-service') && doc.querySelector('#step-region') && doc.querySelector('#step-results'), 'I tre passi della ricerca guidata restano presenti');
assert.ok(doc.querySelector('#step-region')!.closest('.search-step')!.querySelector('select[name="regione"]'), 'La regione è nel passo 2, selezionabile subito');

console.log('UI di ricerca semplificata verificata: campo unico, semantica, scorciatoie, zona suggerita e compatibilità filtri.');
window.close();
