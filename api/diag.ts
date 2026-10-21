// Diagnostica preview: import dinamici con specifier letterali (stesso trattamento degli import statici)
// in try/catch, per esporre l'errore reale a runtime invece di far fallire l'invocazione.
export default {
  async fetch(request: Request) {
    const report: Record<string, string> = { node: process.version, pathname: new URL(request.url).pathname };
    const prova = async (nome: string, caricamento: () => Promise<Record<string, unknown>>) => {
      try {
        const mod = await caricamento();
        report[nome] = `ok (${Object.keys(mod).slice(0, 5).join(',')})`;
      } catch (e) {
        report[nome] = `ERRORE: ${(e as Error).name}: ${(e as Error).message}`;
      }
    };
    await prova('posizione-api', async () => await import('../site/src/lib/posizione-api.ts'));
    await prova('geo', async () => await import('../site/src/lib/geo.ts'));
    await prova('directory', async () => await import('../site/src/lib/directory.ts'));
    await prova('orologiaio-api', async () => await import('../site/src/lib/orologiaio-api.ts'));
    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  },
};
