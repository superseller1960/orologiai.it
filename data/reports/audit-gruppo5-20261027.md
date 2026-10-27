# Audit — gruppo 5 (11 schede Lotto 5 Nord-Ovest: Piemonte, Liguria), 27 ottobre 2026

Produzione prima: `2add3f55`. Preview verificata: `6598df9a` (branch `audit-gruppo5-20261027`). Produzione dopo: `ed663680` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata.

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Orolab, Bra | servizio «vendita usati» pubblicato | **rimosso**: non attestato in home, contatti, laboratorio, servizi | [orolab.it](https://www.orolab.it/) |
| Era Ora, Vercelli | storia incompleta (solo conduttori) | integrata: avvio **2019**, trasferimento **2022** in Via Fratelli Laviny; precisato l'uso di **laboratori esterni** per gli interventi complessi | [storia](https://www.orologeriaeraora.it/orologeria-era-ora-lanostrastoria) |
| Henry, Alessandria | — | rivendita Mido **confermata** dalla scheda specifica del marchio (non dal locator generico) | [Mido](https://www.midowatches.com/it/store-locator/italy/alessandria/henry-gioielli-a1vnn000001zie3yam) |

## Discrepanze registrate (segnalazioni aperte, nessun dato inventato)

1. **Delfino, Savona**: telefono sito `019 824917` vs schede Omega/Longines `019 851798`.
2. **Rizzuto, Sarzana**: indirizzo sito `Via Landinelli 60/62` vs Hamilton `Via Ippolito Landinelli 60`.
3. **Dupanloup, Savona**: avvio dichiarato 1880 (Unioncamere) vs «1883 circa» nella stessa scheda e «dal 1883» sul sito.
4. **Rabino, Cuneo**: email non ricontrollabile nella forma esatta (pagina con mascheramento, diretta 403).
5. **Henry**: sito proprio renderizzato in JS, non leggibile in sessione: laboratorio e marchi oltre Mido non ricontrollabili.
6. **Biondi, Vercelli** e **Dupanloup**: autodichiarazioni «rivenditore/centro assistenza Rolex» — pagine ufficiali 403 — **separate dai campi ufficiali** (regola gruppo 2 bis).

## Conferme senza correzioni (3)

Casciola (Cuneo), Antica Casa Traverso (La Spezia: 1920, quarta generazione, arredi storici originali confermati), Luigi Rosso (Casale Monferrato: 1992/1986, secondo telefono 0142 453328). Delfino: fondazione 28 ottobre 1928, Giovanni Delfino (1899-1988) e padre Vincenzo confermati dalla pagina ufficiale.

## Conteggi gruppo 5

- Esaminate: 11. Corrette: 3. Confermate invariate: 3. Fonte nuova: 1. Segnalazioni aperte: 6. Claim servizio rimossi: 1.
- Test: **228 superati** + controlli DOM. Test dedicato: `tests/audit-gruppo5-20261027.test.ts`. Script: `scripts/audit-gruppo5-20261027.mjs`.
