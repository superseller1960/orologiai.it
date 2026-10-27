# Audit — gruppo 7 (Lotto 8: 11 schede verificate + 4 approfondimenti residui), 27 ottobre 2026

Produzione prima: `4880f90d`. Preview verificata: `4702b864` (branch `audit-gruppo7-20261027`). Produzione dopo: `7ac008ac` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata: correzioni live (Digiesi «centro assistenza ufficiale» ed email, Comentale 1984/2001, L'Orologiaio «pendoli e cucù», Laboratorio Orologiaio «bigiotteria»), homepage 200, sitemap 545 URL, API attive.

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Digiesi 1959, Matera | **rivenditore ufficiale** Hamilton (locator generico) | **centro assistenza ufficiale** Hamilton: la scheda specifica del marchio attesta solo il ruolo di assistenza (batteria, cinturino) | [Hamilton Matera](https://www.hamiltonwatch.com/it-it/store-locator/italy/no-region/matera/digiesi-1959-gioiellieri) |
| Digiesi 1959 | mancanti email e sito | aggiunti `digiesigioiellieri@gmail.com` e [gioielleriadigiesi.it](https://gioielleriadigiesi.it/contatti/) dal sito proprio | [contatti](https://gioielleriadigiesi.it/contatti/) |
| Comentale, Angri | servizio «lucidatura» pubblicato | **rimosso**: la fonte parla di restyling di casse e bracciali, non di lucidatura | [orologiaio](https://gioielleriacomentale.com/orologiaio/) |
| Comentale | descrizione «Gioielleria Comentale s.r.l. di Carmine Severino» | **rimossa l'attribuzione**: denominazione societaria non confermata dalle pagine lette | [chi siamo](https://gioielleriacomentale.com/chi-siamo/) |
| Comentale | storia assente | **integrata**: attività familiare dal **1984**, negozio di Corso Italia dal **2001** | [chi siamo](https://gioielleriacomentale.com/chi-siamo/) |
| Tarlociaru, Lecce | servizio «vendita» + «vendita di segnatempo» | **rimossi**: nessuna fonte attesta la vendita al pubblico (la categoria aggregatrice non basta) | [Reteimprese](https://www.reteimprese.it/orologi-produzione-commercio/lecce/azienda/2717970) |
| L'Orologiaio, Taranto | «preventivo gratuito» in descrizione | **rimosso**: non confermato dalla pagina riparazioni | [riparazioni](https://orologiaiostore.it/riparazioni-orologi-taranto/) |
| Laboratorio Orologiaio, Marcianise | «riparazione e manutenzione di orologi e gioielli» | corretto in «orologi di tutti i marchi, **bigiotteria** e articoli affini»: la fonte non attestava la riparazione di gioielli | [Tarì](https://tari.it/azienda/laboratorio-orologiaio-srl/) |
| Fusco snc, Pescara | nessuna autorizzazione | aggiunta **assistenza ufficiale Breil** (scheda «Assistenza e Ricambi» + elenco ufficiale centri di assistenza per l'Abruzzo) | [Breil centri di assistenza](https://www.breil.com/it/centri-di-assistenza/) |

## Informazioni integrate (confermate dalle fonti)

- **L'Orologiaio**: attività dal **2001**; pendoleria (pendoli e cucù), revisione, controllo impermeabilità, rifacimento quadranti, messa a nuovo casse/bracciali, restauro conservativo; marchi riparati documentati (Rolex, Audemars Piguet, Patek Philippe, Cartier, Panerai, Baume & Mercier, Girard-Perregaux, Omega).
- **Raffa, Siracusa**: integrati Nautica, Sector e Breil fra i marchi riparati (descrizione Facebook).
- **Merola, SMCV**: pagina specifica assistenza Seiko aggiunta (riparazioni Seiko, invio al centro post-vendita ufficiale, garanzia 1 anno).
- **Cheope, Benevento**: email `furnoigino@tin.it` dalla scheda Breil; rivenditore Breil «Rivenditori Autorizzati» riconfermato.
- **Vitrani, Barletta**: fonti contatti/storia integrate; attività dal 1969 tramandata di padre in figlio.
- **Gold Shine**: conferme complete, nessuna correzione.

## Autorizzazioni riclassificate

- Digiesi: Hamilton da **rivenditore ufficiale** a **centro assistenza ufficiale** (ruolo espressamente attestato dalla fonte primaria).
- Fusco: aggiunta assistenza ufficiale Breil (fonte primaria del marchio).
- Nessuna autorizzazione attribuita sulla sola autodichiarazione: Digiesi (IG «certificata Omega, Longines, Rado, Tissot, Hamilton») segnalata come dichiarazione non confermata.

## Discrepanze e incertezze registrate (segnalazioni aperte)

1. **Laboratorio Orologiaio**: sito proprio TLS-down; pagina OPS non leggibile (claim garanzia OPS da ricontrollare).
2. **Merola**: recapiti non ricontrollabili (/contatti/ 404, scheda Seiko 403); variante di sede Piazza Agostino Di Monaco.
3. **L'Orologiaio**: telefono e sedi non ricontrollabili nelle pagine lette.
4. **Digiesi**: PagineBianche 403; riparazioni gioielli non confermate.
5. **Cheope**: civico 239/245 vs 245; email solo su fonte Breil.
6. **Tarlociaru**: prefisso +39 non presente nella fonte (cifre coincidenti).

## Approfondimenti residui fase 9 (4 schede già parzialmente verificate)

Recontrollo del 27 ottobre 2026: i locator **Rolex, Tudor, IWC e Seiko** restituiscono **HTTP 403**; le pagine Longines/Seiko per le varianti di Salerno e Franzè non sono leggibili. Le anomalie restano aperte e registrate (Galdi, Fratelli Gallo) — nessun dato rimosso, nessun aggiramento delle protezioni.

## Test e controlli

- Test: **230 superati** + controlli DOM. Test dedicato: `tests/audit-gruppo7-20261027.test.ts`. Script: `scripts/audit-gruppo7-20261027.mjs`.
- Aggiornato `tests/lotto-08-20261026.test.ts`: l'asserzione su Digiesi riflette ora il ruolo documentato (centro assistenza, non rivendita) e il controllo sulle fonti dei marchi è stato esteso a ogni autorizzazione mantenendo la stringenza.
