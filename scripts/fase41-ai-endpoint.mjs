// Fase 41 — collaudo dell'endpoint reale (non solo della funzione locale).
// Le domande tecniche non devono restituire località, servizi o marchi.
const base = process.argv[2] ?? 'https://www.orologiai.it';
const casi = [
  { q: 'Come funziona uno scappamento ad ancora?', tecnica: true },
  { q: 'Come funziona il rotore di un automatico?', tecnica: true },
  { q: 'Che cosa fa il bilanciere?', tecnica: true },
  { q: 'Il mio automatico perde dieci minuti al giorno', tecnica: false },
  { q: 'Cerco revisione orologio automatico a Firenze', tecnica: false },
  { q: 'Cerco assistenza ufficiale Rolex a Milano', tecnica: false },
  { q: 'Cerco un orologiaio ad Alassio', tecnica: false },
];

async function chiedi(messaggio) {
  for (const campo of ['messaggio', 'message', 'q']) {
    const risposta = await fetch(`${base}/api/orologiaio`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: base },
      body: JSON.stringify({ [campo]: messaggio }),
    });
    if (risposta.status !== 400) return { stato: risposta.status, corpo: await risposta.json().catch(() => null) };
  }
  return { stato: 400, corpo: null };
}

let errori = 0;
for (const caso of casi) {
  const { stato, corpo } = await chiedi(caso.q);
  const criteri = corpo?.criteri ?? corpo?.interpretazione?.criteri ?? {};
  const chiavi = ['localita', 'localitaNonCensita', 'servizio', 'marca', 'ruoloMarca', 'regione', 'provincia'];
  const presenti = chiavi.filter(k => criteri[k] !== undefined && criteri[k] !== null);
  const tecnicaPulita = !caso.tecnica || presenti.length === 0;
  if (!tecnicaPulita) errori++;
  console.log(`${tecnicaPulita ? 'OK ' : 'KO '} ${stato} “${caso.q}” → ${presenti.map(k => `${k}=${criteri[k]}`).join(', ') || 'nessun filtro'}${corpo?.stato ? ` [${corpo.stato}]` : ''}`);
}
console.log(errori === 0 ? 'Endpoint: nessuna domanda tecnica produce filtri.' : `Endpoint: ${errori} casi con filtri impropri.`);
process.exit(errori === 0 ? 0 : 1);
