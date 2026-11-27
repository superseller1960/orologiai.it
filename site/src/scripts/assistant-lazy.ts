// Fase 40 — l'assistente porta con sé l'interpretazione e i dati: si carica al primo uso.
// Il campo resta visibile e raggiungibile da tastiera; nessuna funzione viene tolta.
const pannello = document.getElementById('assistente') as HTMLElement | null;
let caricato = false;
const carica = () => {
  if (caricato) return;
  caricato = true;
  void import('./assistant-ui.ts');
};
if (pannello) {
  // Deep link dell'assistente (/orologiaio/?q=… oppure /cerca/#assistente): caricamento immediato.
  const daUrl = new URLSearchParams(location.search).has('q') || location.hash === '#assistente';
  if (daUrl) carica();
  pannello.addEventListener('focusin', carica, { once: true });
  pannello.addEventListener('pointerdown', carica, { once: true });
  const campo = document.getElementById('assistente-messaggio') as HTMLTextAreaElement | null;
  campo?.addEventListener('keydown', carica, { once: true });
  // Chi arriva con la ricerca già compilata deve poter inviare subito: il click carica il modulo.
  document.getElementById('assistente-invia')?.addEventListener('pointerdown', carica, { once: true });
}
export {};
