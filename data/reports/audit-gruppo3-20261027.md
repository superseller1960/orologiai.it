# Audit — gruppo 3 (16 schede Lotto 6) + separazione autodichiarazioni Rolex, 27 ottobre 2026

Produzione prima: `1c5dc745`. Preview verificata: `3df98f88` (branch `audit-gruppo3-20261027`). Produzione dopo: `406b0790` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata: nessun riferimento a Perpetual, civico Granarelli corretto, API attive, homepage 200.

## Separazione autodichiarazioni Rolex (gruppo 2 bis)

rolex.com continua a rispondere HTTP 403 (né prova positiva né negativa). Per **Volta, Bonvicini, Zanaboni** le qualifiche Rolex autodichiarate sono state **separate dai campi `rivenditaUfficiale`/`assistenzaUfficiale`** (che generano filtri ed etichette ufficiali) e conservate nel registro di cronologia con le fonti; le descrizioni ora presentano le qualifiche come dichiarazioni dell'attività. Per Volta risultava inoltre che la fonte citata per l'«assistenza» era la pagina *dealer* del marchio, non una pagina di servizio. Clivio era già conforme. Verifica database-wide: nessun'altra autodichiarazione mascherata (unico caso di fonte sul dominio proprio: store Swatch, dominio del marchio stesso).

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Rosati, Porto Sant'Elpidio | fonte Oris `storefinder/1092-perpetual-srl` | fonte Oris `storefinder/6377-gioielleria-rosati` — la scheda citata apparteneva a **Perpetual Srl di Follonica**, azienda diversa | [Oris Rosati](https://www.oris.ch/en-IT/storefinder/6377-gioielleria-rosati) |
| Granarelli, Fano | Via Arco d'Augusto, 60 | Via Arco d'Augusto, **61** (variante 60 non verificabile: segnalazione aperta) | [Hamilton](https://www.hamiltonwatch.com/it-it/store-locator/italia/marche/fano/gioielleria-granarelli) |
| Panichi, Porto San Giorgio | annoFondazione 1954, «attività storica» | 1954 solo nella denominazione commerciale; nessuna fonte storica indipendente | [Breil](https://www.breil.com/store/rivenditori-manta/gioielleria-panichi-dal-1954/) |
| Michini, Roseto | Piazza della Libertà (senza civico), email Gmail | Piazza della Libertà **34**, **info@gioielleriamichini.it** | [contatti](https://gioielleriamichini.it/contatti/) |
| Cotognini, Macerata | «Global Store» | «Seiko Global Brand Retailer» (formulazione esatta della fonte) | [Seiko](https://www.seikowatches.com/it-it/stores/28648-1) |
| Chiatti, Città di Castello | fonte = locator Mido generico | scheda Mido specifica dell'attività | [Mido](https://www.midowatches.com/it/store-locator/italy/xn--citt-di-castello-0lb/gioielleria-chiatti-a1vnn000001zsdkya2) |
| Sorbi, Perugia / Massarucci, Terni | «laboratorio interno» / «multimarca» | formulazioni allineate alle fonti | siti attività |

## Conferme senza correzioni (8)

Bartorelli (Pesaro), Capodagli (Fano), Felici (PSG), Rosati contatti, Ibis (Civitanova), Angolo d'Oro (Sant'Egidio), Ferretti (Chieti), Tomasini (Terni). Ibis 1979 e Bartorelli 1882 restano **dichiarati** (sito e stampa locale per Ibis; solo nome/sito per Bartorelli): nessuna pretesa di documentazione archivistica.

## Anomalie aperte

1. Granarelli: variante civico 60/61.
2. Capodagli: email discordanti (Longines fastnet.it vs Mido info@capodagli.it).
3. GT Orologerie: telefono 0773 694925 solo indicizzato (sito 403); shop riporta WhatsApp 371 5956457.
4. Panichi/Bartorelli: date storiche non documentate indipendentemente.

## Conteggi gruppo 3

- Esaminate: 16. Corrette: 7. Fonti nuove: 2. Segnalazioni aperte: 4.
- Test: **226 superati** + controlli DOM. Test dedicato: `tests/audit-gruppo3-20261027.test.ts`.
