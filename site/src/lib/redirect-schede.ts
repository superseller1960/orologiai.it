// Redirect permanenti delle schede unificate o rinominate (Fase 40).
// Registro separato dai redirect territoriali: le destinazioni sono pagine attività,
// non località, e i test di geografia non devono confondere i due casi.
import registro from '../../../data/anagrafica/redirect-schede.json';

export type RegolaScheda = { da: string; a: string; motivo: string };
export const REDIRECT_SCHEDE = (registro as { regole: RegolaScheda[] }).regole;

// Restituisce il nuovo percorso (query conservata) oppure null. La coda dei sottopercorsi
// viene conservata per non perdere eventuali frammenti già indicizzati.
export function redirectScheda(pathname: string, search = ''): string | null {
  for (const { da, a } of REDIRECT_SCHEDE) {
    const base = da.endsWith('/') ? da.slice(0, -1) : da;
    if (pathname === base || pathname === `${base}/`) return `${a}${search}`;
    if (pathname.startsWith(`${base}/`)) {
      const coda = pathname.slice(base.length);
      return `${a}${coda.startsWith('/') ? coda.slice(1) : coda}${search}`;
    }
  }
  return null;
}

export const PREFISSI_SCHEDE = [...new Set(REDIRECT_SCHEDE.map(({ da }) => `${da}*`))];
