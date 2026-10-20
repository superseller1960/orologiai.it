import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { directory, businessUrl, localityUrl } from '../site/src/lib/directory.ts';
import { statuses } from '../site/src/lib/schema.ts';
import { JSDOM } from 'jsdom';
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir,e.name)) : Promise.resolve([join(dir,e.name)])))).flat();
}
const output = await files('dist');
const htmlFiles = output.filter(f => f.endsWith('.html'));
assert.ok(!output.some(f => /(?:wp-content|staging|directory\.json|\.map$)/.test(f)), 'Dati privati/WordPress non devono essere copiati nella build');
const exists = async (url: URL) => {
  const path = decodeURIComponent(url.pathname);
  assert.ok(!path.includes('..'));
  const dest = join('dist', path.endsWith('/') ? path + 'index.html' : path);
  assert.ok((await stat(dest)).isFile(), `Destinazione mancante: ${path}`);
};
for (const file of htmlFiles) {
  const html = await readFile(file,'utf8');
  const path = file.replace(/^dist/,'').replace(/index\.html$/, '');
  const base = new URL(path, 'https://orologiai.it');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  assert.ok(canonical, `Canonical mancante: ${file}`);
  assert.ok(canonical[1].startsWith('https://orologiai.it/'));
  await exists(new URL(canonical[1]));
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `Titolo principale: ${file}`);
  const dom = new JSDOM(html);
  const ids = Array.from(dom.window.document.querySelectorAll('[id]')).map(el => el.id);
  dom.window.close();
  assert.equal(new Set(ids).size, ids.length, `ID HTML duplicati: ${file}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), base);
    if (url.origin !== base.origin || !['http:', 'https:'].includes(url.protocol)) continue;
    await exists(url);
    if (url.hash && (url.pathname.endsWith('/') || url.pathname.endsWith('.html'))) {
      const dest = join('dist', url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
      const target = await readFile(dest, 'utf8');
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Fragment inexistant: ${match[1]} in ${file}`);
    }
  }
  for (const json of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json[1]);
}
for (const b of directory.attivita) {
  const html = await readFile(join('dist', businessUrl(b),'index.html'), 'utf8');
  assert.ok(html.includes(b.nome));
  assert.ok(html.includes(statuses[b.attendibilita.stato]));
}
for (const place of directory.localita) {
  assert.ok(directory.attivita.some(b => b.localitaId === place.id));
  await exists(new URL(localityUrl(place),'https://orologiai.it'));
}
const sitemap = await readFile('dist/sitemap.xml','utf8');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) await exists(new URL(match[1]));
assert.ok(!sitemap.includes('/cerca/'));
const routes = JSON.parse(await readFile('dist/_routes.json', 'utf8'));
assert.deepEqual(routes, { version: 1, include: ['/api/orologiaio'], exclude: [] }, '_routes.json deve invocare la Function solo per /api/orologiaio');
console.log(`Build verificata: ${htmlFiles.length} documenti HTML; link, frammenti, canonical, sitemap, _routes.json e ${directory.attivita.length} schede validi.`);
