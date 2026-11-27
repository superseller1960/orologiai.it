const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
for (const u of ['https://www.orologeriasatolli.it/assistenza/', 'https://www.orologeriasatolli.it/']) {
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; orologiai.it)' } });
    const t = strip(await r.text());
    const basso = t.toLowerCase();
    console.log('\n', u, r.status, 'len', t.length);
    for (const k of ['riparaz', 'revision', 'assistenza', 'pendol', 'vendita', 'restaur']) console.log(' ', k, basso.includes(k));
    const i = basso.indexOf('assistenza', 600);
    console.log('  ...', t.slice(Math.max(0, i - 150), i + 350));
  } catch (e) { console.log(u, 'errore', (e as Error).message); }
}

export {};
