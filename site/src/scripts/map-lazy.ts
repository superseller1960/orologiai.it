// Fase 40 — la mappa (Leaflet) pesa più di tutto il resto della pagina: si carica all'apertura.
// Il pannello resta nel DOM, quindi apertura da URL (#map-details) e da tastiera funzionano.
const details = document.getElementById('map-details') as HTMLDetailsElement | null;
let caricata = false;
const carica = () => {
  if (caricata) return;
  caricata = true;
  // Import dinamico: il bundle della mappa non entra nel caricamento iniziale.
  void import('./map-ui.ts');
};
if (details) {
  if (details.open) carica();
  details.addEventListener('toggle', () => { if (details.open) carica(); });
  if (location.hash === '#map-details' || location.hash === '#directory-map') {
    details.open = true;
    carica();
  }
  // Il riepilogo è cliccabile anche con la tastiera: il toggle copre entrambi i casi.
  details.querySelector('summary')?.addEventListener('keydown', (event) => {
    const tasto = (event as KeyboardEvent).key;
    if (tasto === 'Enter' || tasto === ' ') carica();
  });
}
export {};
