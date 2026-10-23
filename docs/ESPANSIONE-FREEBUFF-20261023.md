# Espansione directory Freebuff — 23 ottobre 2026

## Repository e coordinamento

- Repository: `superseller1960/orologiai.it`.
- Base indicata dall'utente: `pubblicazione-gratuita-scardi-20261022`.
- Commit iniziale e ultimo FETCH_HEAD verificato: `71e47a536344cd337e68761dcf58cbfe6b4dcb8f`.
- Branch esclusivo: `feature/freebuff-directory-expansion-20261023`, creato dalla base indicata, non da main. Il branch dedicato non esisteva sul remoto alla verifica iniziale/finale prima del push.
- Controllati i branch remoti e le PR aperte tramite API GitHub. Esistono sviluppi separati, fra cui `ux-schede-assistente-20261022` a `78c68e9` (preceduto da `25189f7`), non incorporati né sovrascritti. Le PR storiche, fra cui #4, non sono state modificate.
- Il riferimento remoto indicato è immutato dopo un nuovo fetch. Le API GitHub dei deployment non hanno fornito evidenza della produzione effettiva; **la configurazione del branch effettivamente pubblicato non è confermata**. Non è stato consultato Cloudflare, come richiesto. La base rimane quindi il riferimento esplicito dell'utente, non una deduzione da main o da una preview.
- Patch Pescara/Potenza, Bolzano/Aosta, Matera/Gorizia, Campobasso/Oristano non disponibili in questa copia: nessuna ricostruzione automatica. Record già presenti a Potenza e Campobasso non dimostrano l'integrazione delle patch.

## Copertura e conservazione

| Dato | Prima | Dopo |
|---|---:|---:|
| Attività | 103 | 106 |
| Località | 58 | 61 |
| Fonti pubblicate | 168 | 174 |
| Regioni | 20 | 20 |
| Province rappresentate | 41 | 44 |
| Coordinate verificate | 4 | 4 |

Distribuzioni complete iniziali/finali per regione, provincia, comune, tipologia e servizio: `data/reports/freebuff-coverage-20261023.json`. Tipologie e servizi sono multivalore: i totali non corrispondono al numero di attività.

Le regioni inizialmente meno rappresentate erano Abruzzo, Basilicata, Marche, Trentino-Alto Adige e Valle d'Aosta (una attività ciascuna); Molise, Sardegna e Umbria ne avevano due. La Toscana ne aveva 35. Scelte tre province precedentemente prive di schede: Chieti, Isernia, Ascoli Piceno. I conteggi delle province assenti non costituiscono un elenco amministrativo nazionale completo.

Tutti i record precedenti di attività, località e fonti sono identici alla base. Nessuna collisione o duplicato introdotto secondo controlli schema, confronto ID/slug/fonti e segnali su nome/indirizzo/sito dell'importatore. Nessuna coordinata approssimativa.

## Nuove attività

Tutte le fonti seguenti sono state lette, non soltanto individuate tramite motore di ricerca. Data di verifica: **2026-10-23**.

### Magie In Oro — Chieti (CH), Abruzzo

- Indirizzo: **Viale Abruzzo 98, 66100 Chieti**.
- Tipologie: orologeria, gioielleria, laboratorio.
- Servizi: vendita, vendita usati, riparazione, manutenzione, revisione, lucidatura, riparazione meccanici e quarzo.
- Marchi in vendita documentati: Perseo, Fonderia, Bulova, Longines. Nessuna autorizzazione attribuita.
- Fonti: https://magieinoro.com/contatti/ e https://magieinoro.com/ .

### Gioielleria Lombardi Ercolino — Isernia (IS), Molise

- Indirizzo: **Corso Garibaldi 267/271, 86170 Isernia**.
- Tipologia: gioielleria.
- Servizio: vendita orologi Hamilton. Rivendita ufficiale documentata dal produttore; nessuna riparazione, revisione o assistenza ufficiale attribuita.
- Fonte primaria: https://www.hamiltonwatch.com/it-it/store-locator/italia/molise/isernia/gioielleria-lombardi-ercolino .
- Sito autonomo non individuato: campo sito lasciato nullo, senza inventarlo.

### Gioielleria Fenocchi — San Benedetto del Tronto (AP), Marche

- Indirizzo: **Via Ugo Bassi 25, 63074 San Benedetto del Tronto**.
- Tipologie: gioielleria, orologeria, laboratorio interno.
- Servizi: vendita, riparazione, revisione, manutenzione e lucidatura. Riparazione di orologi d'epoca dichiarata; non estesa automaticamente al filtro generale restauro-vintage.
- Venduti: Rolex, Tudor, Eberhard. Riparati dichiarati: Rolex, Tudor, Cartier, Panerai, Omega, Baume & Mercier, IWC, Eberhard.
- Fonti: https://www.gioielleriafenocchi.com/rolex/contatti , https://www.gioielleriafenocchi.com/il-laboratorio , https://www.gioielleriafenocchi.com/ .
- Autorizzazioni dichiarate dall'attività non registrate come ufficiali in assenza di riscontro del produttore. Orari discordanti non importati.

## Revisione e licenze

Otto candidati esaminati: tre integrati, cinque rinviati. Decisioni, evidenze e fonti conservate in `data/import/freebuff-national-20261023-reviewed.json`; report dry-run e applicato in `data/reports/`. È la pipeline esistente di lotti revisionati, non un database parallelo. I candidati in revisione non sono caricati dall'applicazione; le loro sei fonti non sono aggiunte alla directory pubblica.

- Orologi il Collezionista, Pordenone: sospeso per valutazione legale/permesso, a causa delle restrizioni sui contenuti commerciali e deep link nei termini ufficiali (https://www.orologilcollezionista.it/assistenza/termini-e-condizioni).
- Satolli (Pescara), Digiesi (Matera), Clementi (Bolzano), Dobner (Gorizia): rinviati per coordinamento con patch mancanti, senza presumere che siano già integrati.
- Nessun nuovo dato OSM, nessuna immagine, recensione o descrizione commerciale copiata. Solo dati pubblici pertinenti e descrizioni originali; email e dati personali non necessari omessi.
- La consultabilità pubblica non equivale a licenza libera. Nessuna garanzia legale sul riuso: resta opportuna la revisione GDPR/copyright/diritti sulle banche dati. Gli obblighi ODbL eventualmente applicabili ai dati storici non sono eliminati da questo lotto.

## Applicazione, UX e SEO

Nessuna modifica applicativa necessaria dimostrata dai controlli; nessun cambio al design, all'assistente, alle API o alla configurazione deployment. README aggiornato ai conteggi nuovi.

Aggiunti quattro test FB23: confronto integrale con la base, reimportazione idempotente, duplicati, provenienza, territori, filtri servizi/marchi/autorizzazioni. Aggiornata l'attesa esatta del test storico da 103 a 106: la conservazione non dipende dal solo conteggio.

Le sei nuove pagine attività/comune hanno title, description, H1 e canonical verificati nel DOM. Il controllo di build verifica link interni, frammenti, sitemap, JSON-LD e destinazioni delle pagine territoriali di tutto il sito. Le nuove pagine usano il generatore esistente; nessuna pagina territoriale vuota aggiunta. URL storici conservati.

## Verifiche

Ambiente: Node **24.21.0**, compatibile con requisito >=22.22.0.

- `npm ci`: riuscito, 321 pacchetti installati, audit senza vulnerabilità. Avviso npm sulla policy dello script postinstall esbuild; la build esbuild ha funzionato. Lockfile e dipendenze invariati.
- Importatore esistente in dry-run e poi `--apply`: 3 nuove, 5 in revisione, 0 aggiornate, 0 duplicati.
- Prima verifica: fallimenti per attesa storica 103 e per artefatti DOM della build precedente. Attesa corretta a 106, build rigenerata; nessuna asserzione saltata o indebolita.
- `npm run build` seguito da `npm run verify`: riusciti. **174 test superati, 0 falliti**, typecheck senza errori/warning, validazione di 106 attività e 61 località, **278 pagine** generate, controlli link/SEO e test DOM ricerca/chat riusciti.
- I test DOM coprono deep link, filtri, reset, località non censite, risultati e assenza di risultati, punti mappa verificati e input ostile. I test geografici aggiunti coprono Chieti, Isernia, Ascoli Piceno e regioni errate.
- Nessun test visuale/responsive tramite browser eseguito. Nessuna verifica live o interattiva su produzione. La navigazione verso comuni vicini resta quella esistente, non viene dichiarata una nuova funzione di prossimità senza coordinate.
- La build rigenera il bundle API con i dati del lotto: l'artefatto generato `api/orologiaio.js` è escluso dal commit e ripristinato alla base, per non intervenire sul codice dell'assistente. Il comando di build lo rigenera quando l'incremento sarà integrato deliberatamente.

## Consegna senza pubblicazione

Commit dedicato con prefisso `[CF-Pages-Skip]` per evitare l'autodeployment Pages senza cambiare la configurazione (https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/). Nessun merge, comando deploy, preview, pannello Cloudflare, DNS, Register.it, Scardi.it, variabile o segreto modificati.

L'autenticazione server consente fetch/push via strumento Git, ma `gh auth status` non trova un account autenticato e il catalogo integrazioni non offre creazione PR GitHub. **La PR non può essere creata automaticamente in questa esecuzione**. Non vengono richiesti token e non si usano credenziali di altri servizi. Dopo il push, aprire manualmente il confronto:

https://github.com/superseller1960/orologiai.it/compare/pubblicazione-gratuita-scardi-20261022...feature/freebuff-directory-expansion-20261023?expand=1

Titolo proposto: **Espande la directory in tre province con fonti primarie verificate**.

Corpo proposto: integra 3 attività (Chieti, Isernia, San Benedetto del Tronto), 3 località e 6 fonti; 103→106 attività, 58→61 località, 168→174 fonti. Conserva integralmente i record originali; 5 candidati restano in revisione. Node 24.21.0, npm ci e npm run verify riusciti: 174 test, 278 pagine, typecheck e DOM. Nessuna modifica applicativa, configurazione, merge o pubblicazione. Base remota 71e47a5; configurazione produzione non confermata. Richiesta sola revisione, senza merge o deployment automatico.
