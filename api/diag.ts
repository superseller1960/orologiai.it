// Diagnostica preview: elenco ricorsivo limitato del bundle Lambda.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function elenco(dir: string, profondita: number, out: string[]) {
  if (profondita < 0) return;
  let voci: string[];
  try {
    voci = readdirSync(dir);
  } catch (e) {
    out.push(`${dir}/ ERRORE ${(e as Error).message}`);
    return;
  }
  for (const voce of voci) {
    const p = join(dir, voce);
    out.push(p);
    if (profondita > 0) {
      try {
        elenco(p, profondita - 1, out);
      } catch {
        /* ignora */
      }
    }
  }
}

export default {
  fetch() {
    const out: string[] = [];
    elenco('/var/task', 4, out);
    return new Response(out.join('\n'), {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
