// Controllo fonti dei servizi tecnici: un servizio di riparazione/restauro/revisione
// su orologi richiede che la scheda sia orologeria o laboratorio orologiaio.
// Uso: node scripts/fase31b-valida-servizi.mjs  (exit 1 se trova incoerenze)
import { readFile } from 'node:fs/promises';

const TECNICI = ['riparazione', 'restauro-vintage', 'revisione', 'assistenza', 'pendoleria'];
const TIPI_OROLOGIAI = ['orologeria', 'laboratorio'];

export function servizioSenzaOrologi(attivita) {
  const tipi = attivita.tipi ?? [];
  const tecnici = (attivita.servizi ?? []).map((s) => s.id).filter((id) => TECNICI.includes(id));
  if (tecnici.length === 0) return [];
  if (tipi.some((t) => TIPI_OROLOGIAI.includes(t))) return [];
  return tecnici;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = JSON.parse(await readFile('site/data/directory.json', 'utf8'));
  const problemi = dir.attivita
    .map((a) => ({ id: a.id, servizi: servizioSenzaOrologi(a) }))
    .filter((p) => p.servizi.length > 0);
  console.log(JSON.stringify({ attivita: dir.attivita.length, problemi }, null, 2));
  process.exitCode = problemi.length ? 1 : 0;
}
