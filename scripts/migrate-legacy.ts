import { readFile, writeFile } from 'node:fs/promises';
import { directorySchema } from '../site/src/lib/schema.ts';

const legacy = JSON.parse(await readFile('site/data/orologerie.json', 'utf8')) as {
  citta: { id: string; nome: string; descrizione: string; pagina: boolean }[];
  orologerie: { id: string; nome: string; citta: string; anno: number | null; servizi: string[]; marche: string[]; storia: string; indirizzo: string | null }[];
};
const date = '2026-10-16';
const source = (id: string) => `mirror-${id}`;
const result = directorySchema.parse({
  versione: 1,
  fonti: ['firenze', 'milano'].map(id => ({ id: source(id), tipo: 'mirror-storico', url: `https://orologiai.it/${id}/`, titolo: `Mirror storico Orologiai.it — ${id}`, consultataIl: date, percorsoArchivio: `public/${id}/index.html`, licenza: null })),
  localita: legacy.citta.filter(c => c.pagina).map(c => ({ id: c.id, comune: c.nome, comuneSlug: c.id, provincia: c.nome, provinciaSlug: c.id, siglaProvincia: c.id === 'firenze' ? 'FI' : 'MI', regione: c.id === 'firenze' ? 'Toscana' : 'Lombardia', regioneSlug: c.id === 'firenze' ? 'toscana' : 'lombardia', codiceIstat: null, descrizione: c.descrizione, fonti: [source(c.id)] })),
  attivita: legacy.orologerie.map(b => ({
    id: b.id, slug: b.id, nome: b.nome, tipi: ['orologeria'], descrizione: b.storia,
    nomiPrecedenti: [], gruppoId: null, localitaId: b.citta,
    posizione: { indirizzo: b.indirizzo, cap: null, coordinate: null, fonti: b.indirizzo ? [source(b.citta)] : [] },
    contatti: { telefono: null, email: null, sito: null, whatsapp: null, social: [], fonti: [] },
    orari: { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: b.servizi.map(id => ({ id, fonti: [source(b.citta)] })), altriServizi: [], specializzazioni: [],
    marchi: { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: b.marche.map(marca => ({ marca, fonti: [source(b.citta)] })) },
    storia: { annoFondazione: b.anno, fondatore: null, testo: b.storia, eventi: [], fonti: [source(b.citta)] },
    attendibilita: { stato: 'da-verificare', raccoltaIl: date, verificataIl: null, confermataTitolareIl: null, fonti: [source(b.citta)], cronologia: [{ data: date, azione: 'Migrazione conservativa dal dataset storico 8dc29a5. Dati operativi e autorizzazioni da riconfermare.', fonti: [source(b.citta)] }], segnalazioni: [] },
    origine: { sistema: 'legacy-8dc29a5', idOriginale: b.id },
  })),
});
await writeFile('site/data/directory.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(`Conservate ${result.attivita.length} attività. Il file legacy non è stato modificato.`);
