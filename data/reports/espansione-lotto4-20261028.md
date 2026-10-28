# Espansione Lotto 4 (Fase 13) — 18 nuove orologerie verificate

Data: 28 ottobre 2026
Checkpoint: commit locale `espansione-lotto4` (base `8fff918`, ricerca Fase 12 invariata)
Metodo: revisione documentale pre-inserimento su fonti primarie ufficiali, deduplicazione
sull'intero catalogo prima dell'applicazione, import tramite pipeline `integrate:reviewed`.

## Risultati (306 → 324 attività)

- Attività: 306 → 324 (+18)
- Località/comuni: 182 → 196 (+14 nuovi comuni)
- Province coinvolte: 16 (VI, TN, BS, BG, GO, RO, TS, VB, VA, CO, MO ×2, FR ×2, FE, RE, LI)
- Fonti: 752 → 790 (+38 fonti, tutte con URL consultato)
- Duplicati: 0 nuovi inserimenti duplicati; 13 coppie con soli segnali di possibile
  rete/sede distinta, tutte classificate `sedi-distinte`, 0 `da-revisionare`

Tutte le 18 schede documentano servizi di riparazione; includono laboratori specialistici
(Laboratorio di Orologeria Frigerio — Urgnano, Time Lab — Fiuggi, Orologeria Muscetti — Erba)
e la bottega storica Orologeria Groppa — Trento (workshop storico documentato da VisitTrento).

## Attività pubblicate (https://www.orologiai.it/orologeria/<slug>/)

| Attività | Comune | Provincia | Sito ufficiale |
| --- | --- | --- | --- |
| Stefani Fratelli | Marano Vicentino | VI | stefanifratelli.it |
| Gioielleria Brotto | Thiene | VI | gioielleriabrotto.com |
| Orologeria Groppa | Trento | TN | orologeriagroppa.it |
| Gioielleria Rovari | San Zeno Naviglio | BS | gioielleriarovari.it |
| Laboratorio di Orologeria Frigerio | Urgnano | BG | laboratoriodiorologeria.com |
| Lo Scrigno Gioielli | Monfalcone | GO | gioiellerialoscrigno.com |
| Gioielleria Cavazzana | Lendinara | RO | gioielleriacavazzana.it |
| Villini La Gioielleria | Trieste | TS | villinigioielleria.it |
| L'Orologiaio | Domodossola | VB | orologiaiodomo.it |
| Temporo / Galanti | Saronno | VA | temporo.it |
| Orologeria Muscetti | Erba | CO | riparazioneorologimuscetti.it |
| Gioielleria Ronchetti | Soliera | MO | oreficeriaronchetti.it |
| L'Oro-Logio Orologeria Oreficeria | Carpi | MO | gioiellerialorologio.it |
| Oro e Ora | Sora | FR | oroeora.com |
| Gioielleria Govoni | Cento | FE | gioielleriagovoni.it |
| Time Lab | Fiuggi | FR | timelabfiuggi.it |
| Moschin Orologi Gioielli | Cavriago | RE | moschinorologigioielli.it |
| Gioielleria Regolini | Livorno | LI | gioielleriaregolini.it |

Ogni scheda riporta telefono e sito verificati direttamente sulle pagine ufficiali
(contatti e servizi), con fonti registrate nel database. Nessun dominio è stato dedotto
dal nome; nessuna autorizzazione commerciale è stata attribuita sulla base di
autodichiarazioni (marchi trattati classificati separatamente dalle autorizzazioni ufficiali).

## Candidati già presenti, non reinseriti

Il controllo antiduplicato sull'intero catalogo ha riconosciuto come già censiti e ha
escluso: Rabino, Paccara, De Marco, De Min. Le collisioni di nome/indirizzo/telefono
riscontrate corrispondono a sedi distinte documentate (gruppoId verificato).

## Anomalie aperte (dati discordanti lasciati assenti)

- Gioielleria Cavazzana: CAP incongruente nella fonte ufficiale → campo non compilato.
- Gioielleria Brotto: anno di fondazione discordante fra le fonti → campo non compilato,
  nessuna data scelta arbitrariamente.
- Ulteriori date storiche discordanti nelle fonti del lotto: registrate nel report di
  importazione (`fase13-lotto4-20261028-applied.json`) e non pubblicate come certe.

## Verifiche e deployment

- `npm run verify`: check + build + **246 test superati** + test UI (ricerca e assistente) superati.
- Deduplicazione: 0 coppie `da-revisionare` sull'intero catalogo (324 attività).
- Preview: `43428e3e-c75d-4bc4-8060-887bf7b4e339` (branch `fase13-lotto4-20261028`) —
  18/18 nuove schede HTTP 200, sitemap, `/cerca/`, `/api/posizione`, API 405 GET verificate.
- Produzione precedente confermata invariata: `ffeafc81-2e44-47aa-a094-3ce25e547c8a`
  (nessun intervento concorrente prima della promozione).
- Produzione: `80e4ce42` (branch `pubblicazione-gratuita-scardi-20261022`) —
  https://www.orologiai.it verificato: 18/18 nuove schede live e presenti in sitemap,
  ricerca Fase 12 ("Mostra risultati", "Altri filtri") invariata.
- Limite: il collaudo Chromium reale non è ripetibile in questa VM (librerie di sistema
  perse dopo l'archiviazione, senza privilegi di installazione); la verifica si basa sui
  test DOM jsdom della suite `test:ui` (scenari Fase 12) e sulle verifiche HTTP della
  preview e della produzione.

## Prossima partenza (Lotto 5)

Riprendere da 324 attività verso il target 350+: priorità province con una o due attività,
laboratori indipendenti, pendolerie e botteghe storiche. Test di regressione sulla ricerca
da mantenere verdi a ogni inserimento.
