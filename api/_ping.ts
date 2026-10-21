// Diagnostica preview: funzione minimale senza import, per verificare forma handler e runtime Vercel.
export default {
  fetch() {
    return new Response(JSON.stringify({ ok: true, modulo: 'nessuno' }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  },
};
