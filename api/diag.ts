// Diagnostica preview: controllo filesystem del bundle e import dinamici in try/catch.
import { existsSync, readdirSync } from 'node:fs';

export default {
  async fetch(request: Request) {
    const report: Record<string, string> = { node: process.version, cwd: process.cwd(), pathname: new URL(request.url).pathname };
    try {
      report['fs:/var/task'] = readdirSync('/var/task').join(',');
    } catch (e) {
      report['fs:/var/task'] = `ERRORE: ${(e as Error).message}`;
    }
    for (const p of ['/var/task/site', '/var/task/site/src', '/var/task/site/src/lib', '/var/task/site/src/lib/geo.ts', '/var/task/site/data/directory.json']) {
      report[`esiste:${p}`] = String(existsSync(p));
    }
    const prova = async (nome: string, caricamento: () => Promise<Record<string, unknown>>) => {
      try {
        const mod = await caricamento();
        report[nome] = `ok (${Object.keys(mod).slice(0, 5).join(',')})`;
      } catch (e) {
        report[nome] = `ERRORE: ${(e as Error).name}: ${(e as Error).message}`;
      }
    };
    await prova('import:geo', async () => await import('../site/src/lib/geo.ts'));
    await prova('import:posizione-api', async () => await import('../site/src/lib/posizione-api.ts'));
    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  },
};
