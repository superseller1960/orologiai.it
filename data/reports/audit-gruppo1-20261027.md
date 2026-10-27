# Audit retrospettivo — gruppo 1 (15 schede Lotto 7), 27 ottobre 2026

Produzione prima del rilascio: `37d5879f-7654-482b-91f7-42960177d20f`. Preview verificata: `110f2132`. Produzione dopo il rilascio: `9249b2ac` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata: homepage, scheda Jolly Gallery, correzioni Salerno/Errani, API, sitemap, redirect.

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Vincenzo Salerno, Ragusa | Via Archimede, 312-316 | Via Archimede, 316 | [contatti attività](https://www.orologiaiovincenzosalerno.it/it/contatti/) |
| Vincenzo Salerno | tel. 0932 251714 | +39 0932 25 10 40 | contatti attività (Longines riporta la variante 0932/251714: segnalazione aperta) |
| Errani, Ravenna | assistenzaUfficiale: Omega | rivenditaUfficiale: Omega; nessuna assistenza ufficiale | [scheda Omega](https://www.omegawatches.com/en-us/store/storedetails/O1826988): «Official OMEGA Retailer», servizi «drop-off for maintenance service», nessuna qualifica di centro assistenza |
| Franzè, Vibo Valentia | storia «fondazione nel 1988» | «attività dal 1988» (formula della fonte) | [chi siamo](https://www.gioielleriafranze.it/chi-siamo/) |
| Temporè, Modica | «laboratorio … in sede» | «laboratorio a Modica» (coincidenza con la sede non confermata) | [EKWATCH contatti](https://www.ekwatch.com/pages/contatti) |
| Rosas 1945, Nuoro | «richiamano la data di fondazione del 1945» | «attiva "dal 1945"; fondazione non esplicitamente attestata» | [home](https://www.rosas1945.it/it) |

## Integrazioni documentate

- Mercuri Orologi, Arezzo: aggiunti servizi vendita e vendita-usati e Rolex tra i marchi venduti ([negozio](https://www.mercuriorologi.it/negozio/), [contatti](https://www.mercuriorologi.it/contatti/)). Nessuna autorizzazione Rolex dichiarata: il sito non la conferma.

## Schede verificate senza correzioni (9)

Manica (Crotone), Patania (Vibo Valentia), Lacagnina (Caltanissetta), Gurrieri Mangiacarne (Ragusa), Pala (Iglesias), Olla (Oristano), Si Anelli (Ravenna), Errani (Faenza), L'Orologiaio Giuliano (Genova). Per Giuliano il sito ufficiale non è estraibile in testo: conferma solo indiretta (fonte secondaria), nessuna contraddizione; nessun dato cambiato.

## Anomalie rimaste aperte (registro nelle schede)

1. Salerno: variante civico/telefono Longines vs sito attività.
2. Salerno: pagina IWC non leggibile (HTTP 403) — autorizzazione da ricontrollare.
3. Franzè: telefono discordante Seiko (+39 0963 472597) vs sito (+39 0963 44097).
4. Omega scheda Ravenna mostra anche il telefono Faenza (dato misto del marchio).

## Conteggi

- Attività esaminate: 15. Completamente convalidate: 11 (9 senza mende + Franzè/Temporè/Rosas/Mercuri con mende precise; per Salerno resta il limite IWC e per Giuliano la fonte indiretta).
- Corrette: 6. Autorizzazioni riclassificate: 1 (Omega Errani). Fonti nuove: 6.
- Test: 224 superati (suite completa + test DOM). Totale attività: 265 (aggiunta Jolly Gallery ad Asti, verificata senza duplicati).
- Checkpoint: commit dedicato + ZIP/bundle/manifest in `export/` (da scaricare fuori Freebuff).
