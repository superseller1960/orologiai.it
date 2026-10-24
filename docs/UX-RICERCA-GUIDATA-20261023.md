# Orologiai.it — revisione concreta della ricerca

Documento della revisione UX (ricerca guidata) portata nell'integrazione condivisa del 24/10/2026.
I contenuti, le pagine storiche e i dati arricchiti restano coerenti: la revisione tocca solo il
modo in cui si cerca, non ciò che il database dice.

## La domanda guidata in `/cerca/`

La ricerca parte da una domanda in linguaggio naturale e la guida in tre passaggi, senza
sostituirsi all'utente:

1. **Il bisogno**: «revisione», «cambio batteria», «cinturino», «acquisto», «valutazione»… anche
   con espressioni comuni («tagliando», «orologio fermo»). L'interpretazione è semantica ma i
   risultati restano limitati ai servizi documentati per ogni attività.
2. **Il luogo**: la città (campo digitabile, facoltativa), oppure la regione (tutte e 20
   selezionabili subito), oppure «tutta Italia». Cambiare regione nasconde le province di altre
   regioni e azzera una città che non vi appartiene; ogni provincia porta con sé la propria
   regione.
3. **I risultati**: un unico elenco ordinato, con le corrispondenze esatte in testa e le
   alternative (attività vicine, servizi affini) **in blocchi distinti**, mai mischiate.

## Filtri e contesto

- I filtri attivi sono sempre visibili e **rimovibili uno per uno**; il messaggio originale resta
  nel campo di ricerca, così l'utente capisce cosa viene cercato.
- I criteri confermati nei turni precedenti restano nel contesto della conversazione: cambiare
  idea («anzi a Milano») sostituisce il criterio senza ricominciare da capo. Se un contesto ereditato
  svuota la ricerca mentre la nuova richiesta da sola ne ha, la chat riparte dai soli criteri nuovi
  dichiarandolo.
- La zona suggerita senza GPS usa solo segnali espliciti della richiesta: nessuna geolocalizzazione
  silenziosa, nessun indovinello sulla posizione.

## Contatti, mappa e pagine scheda

- **Contatti rapidi immediati** nei risultati: telefono se disponibile, sito ufficiale se
  disponibile, indicazioni se ci sono coordinate verificate. Mai recapiti dedotti.
- **Mappa facoltativa**: solo posizioni verificate e confrontate con l'indirizzo; le attività senza
  coordinate restano in elenco senza pin inventati, con l'invito a cercare l'indirizzo (ricerca
  testuale esterna, dichiarata come tale).
- **Paginazione** esplicita oltre i primi risultati: nessun «carica altro» infinito.
- La scheda attività distingue sempre **servizi documentati** (con la fonte per ciascuno),
  **marchi per ruolo** (venduti / riparati / esperienza / assistenza ufficiale / rivendita ufficiale
  / menzionati nelle fonti storiche) e la **memoria della bottega** (storia solo se documentata e
  attribuita). La citazione di un marchio non prova un'autorizzazione ufficiale, né alla vendita
  né all'assistenza: è scritto in pagina.

## Cosa non cambia

- Dati, fonti, ID, slug e URL storici: la revisione non li tocca. Le attività non documentate non
  compaiono e non vengono create elenchi vuoti.
- L'assistente Orologiaio resta separato dalla ricerca manuale: chi vuole può sempre cercare con
  i filtri senza passare dalla chat.
- Le preferenze (ad esempio le impostazioni cookie della mappa) restano separate dal rilascio di
  questa nuova build.
