# Audit — gruppo 4 (16 schede Lotto 6: Campania, Puglia, Basilicata + 1 Lazio), 27 ottobre 2026

Produzione prima: `406b0790`. Preview verificata: `441866c1` (branch `audit-gruppo4-20261027`). Produzione dopo: `2add3f55` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata: fonti corrette live, API attive, homepage 200.

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Nazareno Bancone, Cerignola | fonte Hamilton = scheda **Stravola Gioiellieri (San Severo)** | scheda Hamilton specifica dell'attività | [Hamilton Cerignola](https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/cerignola/nazareno-bancone-gioielli) |
| Pace Gioielli, Brindisi | fonte Hamilton = scheda Stravola (San Severo) | scheda Hamilton specifica di Brindisi | [Hamilton Brindisi](https://www.hamiltonwatch.com/it-it/store-locator/italia/puglia/brindisi/pace-gioielli) |
| Pace Gioielli | «realtà attiva dal 1970» a Brindisi | nata a **Ostuni** nel 1970, punto vendita di Brindisi **dal 2011**, laboratorio dal 2019 | [chi-siamo](https://www.pacegioielli.com/chi-siamo), [servizi](https://www.pacegioielli.com/servizi) |
| Isi Srl Orzelleca, Avellino | fonte Hamilton = scheda **Benevento** | scheda Hamilton specifica di Avellino | [Hamilton Avellino](https://www.hamiltonwatch.com/it-it/store-locator/italia/campania/avellino/orzelleca-gioielli) |
| 5 schede (Orzelleca BN, Pegy, Pignataro, De Leonardis, Naviglio e Fiume) | fonte Mido = locator generico | schede Mido specifiche per attività | store locator Mido (schede verificate HTTP 200) |
| Feni, Taranto | «laboratorio interno» non documentato dalla fonte | rimosso; descritte le due sedi (Via D'Aquino 95 / Via Acclavio 38/B) | [storia](https://www.fenigioielli.com/storia/), [contatti](https://www.fenigioielli.com/contact/) |
| Franco Cuomo, Andria | qualifica «centro assistenza certificato» presentata come fatto | riformulata come **dichiarazione dell'attività** (Omega, Cartier, TAG Heuer, Zenith: nessuna conferma indipendente leggibile) | [centro-assistenza](https://www.francocuomogioielli.it/centro-assistenza-certificato.html) |
| Ciletti, Foggia | — | qualifica Rolex/Tudor **non** inserita tra le autorizzazioni: locator ufficiali 403 | [sito Ciletti](https://giuseppeciletti.it/) |

Totale ref fonti sostituite: 57. Fonti specifiche nuove: 8.

## Conferme senza correzioni (5)

Menichelli (Viterbo), Stravola (San Severo), Landi (Barletta), Iacovone (Matera), Cometa (Policoro). Ciletti: fondazione 1950 e laboratorio interno confermati dal sito.

## Anomalie aperte (segnalazioni)

1. Orzelleca Benevento: civico 190 (Longines) / 190-196 (Hamilton) / 194 (Mido); telefono e email discordanti tra fonti.
2. Isi Avellino: telefono 0825/35700 (Longines) vs 0824/21690 (Hamilton).
3. Franco Cuomo: seconda sede Corso Cavour 120 e secondo telefono.
4. Feni: due sedi con marchi distinti.
5. Ciletti, Pace: autodichiarazioni Rolex/Tudor (locator 403).

## Conteggi gruppo 4

- Esaminate: 16. Corrette: 7. Fonti nuove: 8. Segnalazioni aperte: 5.
- Test: **227 superati** + controlli DOM. Test dedicato: `tests/audit-gruppo4-20261027.test.ts`. Script: `scripts/audit-gruppo4-20261027.mjs`.
