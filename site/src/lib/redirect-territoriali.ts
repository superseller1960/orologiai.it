// Redirect dei percorsi territoriali corretti nella Fase 28.
// Con un `_worker.js` Cloudflare Pages non applica il file `_redirects`: la regola vive qui,
// in un unico registro letto anche dalla pacchettizzazione e dai test.
import registro from '../../../data/anagrafica/redirect-territoriali.json';

// `soloEsatto`: la regola vale per il percorso nudo e non per i sottopercorsi (es. la vecchia
// provincia soppressa, che non ha pagina propria, mentre i suoi comuni ne hanno una).
export type RegolaRedirect = { da: string; a: string; motivo: string; soloEsatto?: boolean };
export const REDIRECT_TERRITORIALI = (registro as { regole: RegolaRedirect[] }).regole;

// Restituisce il nuovo percorso (con eventuale coda e query conservate) oppure null.
export function redirectTerritoriale(pathname: string, search = ''): string | null {
  for (const { da, a, soloEsatto } of REDIRECT_TERRITORIALI) {
    const base = da.endsWith('/') ? da.slice(0, -1) : da;
    if (pathname === base || pathname === `${base}/`) return `${a}${search}`;
    if (soloEsatto) continue;
    if (pathname.startsWith(`${base}/`)) {
      const coda = pathname.slice(base.length);
      return `${a}${coda.startsWith('/') ? coda.slice(1) : coda}${search}`;
    }
  }
  return null;
}

// Prefissi da includere in `_routes.json`: solo questi percorsi invocano il worker.
// Un percorso può avere più regole (esatta + prefisso): il prefisso va emesso una volta sola.
export const PREFISSI_REDIRECT = [...new Set(REDIRECT_TERRITORIALI.map(({ da }) => `${da}*`))];
