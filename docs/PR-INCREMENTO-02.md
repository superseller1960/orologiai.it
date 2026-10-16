# Primo lotto reale toscano e base applicativa aggiornata

Base: `main`. Compare: `censimento-toscana-02-20261016`.

Questa revisione include la prima versione `8dc29a5`, le fondamenta `6cb31fc` e l’incremento 02. **Sostituisce come proposta funzionale la vecchia PR #2**, senza richiederne il merge separato. La PR #2 è stata verificata aperta/non unita e non è stata modificata. Dopo aver verificato il confronto completo, proporne la chiusura come sostituita, senza cancellare branch o perdere storia.

## Risultati reali

- Una richiesta OSM bbox: 27 elementi, 25 candidati nominativi, 2 senza nome scartati.
- Ricerca puntuale su siti ufficiali e reti dei marchi, non scraping Google Maps.
- 54 candidati con nome complessivi dopo collegamento Swatch OSM/sito.
- **25 nuove sedi integrate**, 28 candidati B in staging e 3 record C esclusi (2 senza nome + Scardi già presente).
- 33 attività finali, otto legacy inalterate; 16 comuni toscani e cinque province nel nuovo lotto.
- 4 segnalazioni duplicati revisionate: tre coppie di sedi distinte e un duplicato legacy escluso.
- Fonti e date registrate, autorizzazioni vendita separate da assistenza; nessun nuovo centro assistenza ufficiale dedotto.
- Nessuna coordinata OSM pubblicata come posizione verificata.

## Conservazione e modifiche circoscritte

Mirror e JSON legacy invariati. Modello esteso soltanto per storia facoltativa con obbligo di fonte se presente; template senza messaggi storici falsi sulle nuove schede; citazioni per servizio/marchio. Importatore riutilizzato. Aggiunti raccolta one-shot e migrazione controllata, rapporto A/B/C e segnali di duplicazione. Corretto il controllo HTML degli ID tramite parser anziché regex su `data-business-id`.

## Verifiche locali

- `npm run verify`: typecheck senza errori/warning, 22 test, validazione, 102 HTML, controllo link/canonical/sitemap, interazioni DOM della ricerca.
- 104 route anteprima e 106 file produzione via HTTP, con asset e MIME corretti.
- Conservazione dati originari e mirror testata contro `6cb31fc`.
- `npm audit --omit=dev`: nessuna vulnerabilità segnalata.
- Le raccolte versionate rendono i test ripetibili senza rete; le fixture sintetiche restano distinte.

## Revisione necessaria

- Verifica grafica desktop/mobile nel Browser e console reale: pendente; jsdom non è un browser grafico.
- Nessun censimento toscano completo; restano 28 candidati da revisionare.
- Coordinate, molte aperture e alcune informazioni sono mancanti, dichiarate tali.
- Nessun merge o deploy autorizzato da questa PR; produzione invariata.

Rapporto completo: `docs/INCREMENTO-02.md`. Fonti e decisioni: `data/import/toscana-02-reviewed.json`, `data/import/toscana-02-report.json` e lotti `data/staging/toscana-02-*`.

Link per aprire la PR (non equivale a PR creata):
https://github.com/superseller1960/orologiai.it/compare/main...censimento-toscana-02-20261016?expand=1
