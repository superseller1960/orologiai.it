# Incremento 01 — fondamenta della directory nazionale

## Audit del 16 ottobre 2026

- Branch iniziale: `site-nuovo-orologiai-20261016`, HEAD `8dc29a52b592ffa60fc8bb2f51b1977e251267ac`.
- `main` remoto recuperato con fetch: `56e34a0db62259f5a83789dfc72263f481819a15`, merge della PR #1 del mirror. `8dc29a5` **non è antenato di main**: il nuovo sito non risulta integrato nella storia di main osservata. Stato aperto/chiuso della relativa PR non verificato: CLI GitHub non disponibile.
- Nuovo branch sicuro: `directory-foundation-20261016`, creato da `8dc29a5`. Nessuna modifica diretta a main.
- Non tracciati già presenti: `mirror-logs/`, `temp_public/`; lasciati intatti ed esclusi dal commit.
- `public/`: mirror storico con 13 pagine e risorse WordPress, non applicazione runtime; non modificato. Checksum dell’albero Git prima del lavoro: `0f848468ea1fedf20800faef9191e97914bc50a7561c389423d8f9d28859e175` (output di `git ls-tree -r 8dc29a5 public | sha256sum`).
- `site/`: nove file statici, otto attività, pagine home/Firenze/Milano/Rolex/Blog; dati caricati nel browser, nessuna build o suite di test. Conservati integralmente.
- Dataset legacy SHA-256: `931c7e1db41ed6a557ef9cd86669c5c0a5f7ee1f4245a6c791f7ff8f72eb4315`.
- Il solo workflow esistente importava il mirror cancellando `public/` e spingeva sul branch selezionato. Aggiunta protezione che interrompe l’importazione se il mirror è già tracciato; nessun nuovo workflow di pubblicazione. Il nuovo `directory-check.yml` esegue soltanto installazione e verifiche in PR/branch di sviluppo, con permessi di sola lettura.
- Nessun hosting attivo verificato. La menzione Vercel nel vecchio README non dimostra una configurazione di rilascio. Nessun deploy richiesto o eseguito.

## Criteri dell’incremento

1. Preservare tutte le otto identità, date e storie originali e il mirror.
2. Modello Zod versionato, relazioni controllate, dati mancanti consentiti e fonti tracciabili.
3. Template automatici per profili, località e ruoli dei marchi; niente comune senza attività.
4. Ricerca deterministica riusabile nel browser e in futuro lato server/AI.
5. Importatore offline che produce staging e rapporto, non pubblicazione.
6. Build, typecheck, test, controlli dell’output e anteprima; nessuna dichiarazione di verifica grafica basata su HTTP.

## Decisioni architetturali

Astro statico + TypeScript + Zod, con npm e lockfile. Non c’era un framework da preservare. La sorgente attiva è `site/src/`; `site/data/directory.json` è il dataset autorevole. `site/data/orologerie.json` e i vecchi HTML/JS/CSS rimangono leggibili come riferimento e punto di ripristino, non sono una seconda app avviata in parallelo. Gli articoli Rolex/Blog vengono inclusi dalla prima versione, senza cancellazioni, con avviso e `noindex` in attesa di revisione. Non si certifica come corretto un fatto solo perché presente nel mirror.

`publicDir` è `site/assets`, non il mirror root `public/`. Output dedicato: `dist/`. Nessun file di staging, mirror o script di raccolta viene copiato nell’output.

Modello: ogni record rappresenta una sede; `gruppoId` permette l’associazione futura di sedi. ID e slug non dipendono dal nome visualizzato. Le località hanno comune/provincia/regione e codice ISTAT facoltativo. Servizi, specializzazioni, contatti, storia e marchi hanno fonti. `menzionati` preserva i marchi legacy senza trasformarli in vendita documentata o autorizzazione. Gli stati del titolare e della verifica indipendente sono distinti. Non vengono raccolte partite IVA.

Il motore `search.ts` non contiene UI, accessi remoti o generazione di informazioni. Supporta nome, città, CAP e indirizzi effettivi, filtri territoriali, servizio, marchio/ruolo, tipo, specializzazione e stato. Haversine restituisce distanze solo con coordinate reali. Nessuna geolocalizzazione richiesta: scelta manuale delle località sempre disponibile. La UI non offre distanza/aperto oggi dove i dati mancano.

Costo aggiuntivo di servizi esterni in questo incremento: nessuno. Nessun provider AI, geocoding, tile o database è stato integrato. La sezione AI dice chiaramente che il collegamento non è attivo. La sua futura estrazione di criteri dovrà produrre input validato per `searchDirectory`; gli ID e le spiegazioni saranno ricavati esclusivamente dai risultati e dalle evidenze. In assenza di un criterio documentato: nessuna corrispondenza certa, non un’allucinazione. Ricerca e ranking non dipenderanno dal provider LLM.

## URL e SEO

- `/orologeria/[slug]/`: otto profili HTML completi anche senza JS.
- `/orologerie/[regione]/[provincia]/[comune]/`: due località con attività.
- `/orologerie/`: indice dei territori censiti.
- `/marchi/rolex/`: ruoli separati, nessuna autorizzazione attuale inventata.
- `/servizi/[servizio]/`: solo servizi con almeno due schede, testo editoriale specifico e collegamenti utili.
- `/cerca/`: filtri condivisibili via query, `noindex` per evitare combinazioni indicizzate.
- `/firenze/`, `/milano/`: conservati, canonical alle rispettive pagine territoriali; nessun redirect server inventato.
- `/rolex/`, `/blog/`: conservati con avviso editoriale e `noindex`.
- Sitemap delle sole URL canoniche indicizzabili, canonical assoluti, 404 reale.
- Schema.org `WebPage` per i profili: nessun `LocalBusiness` con indirizzi/orari inventati. Questo dato strutturato descrive ciò che è effettivamente pubblicato.

Non si preservano automaticamente login/carrello/feed del WordPress nella nuova app: restano nel mirror, nessun mapping falso. Il piano completo di migrazione delle vecchie URL richiede una revisione prima di qualsiasi rilascio.

## Importazione e crescita

Toscana come regione pilota, partendo da un solo bbox su Firenze e comuni limitrofi per verificare il processo; il bbox non è un confine regionale. `data/import/pilot.overpass` copre `shop=watches`, `craft=watchmaker`, `craft=clockmaker`. Non identifica tutte le attività: seguono siti ufficiali, reti dei marchi e segnalazioni.

La CLI legge JSON locale (max 50 MiB, 50.000 elementi), non effettua richieste. Registra data, URL, hash, timestamp OSM, ID originali, tag e licenza ODbL. Scarta record non pertinenti, senza nome, invalidi o fuori bbox; segnala coordinate mancanti, email/CAP invalidi e possibili duplicati. Una stessa identità OSM viene deduplicata; somiglianze fra sedi diverse vengono segnalate, non fuse. I candidati rimangono fuori dalla build. La revisione è dettagliata in `data/staging/README.md`.

Per l’Italia: estratti geografici regionali/nazionali e filtro locale tramite tooling dedicato (es. osmium), non una query nazionale su Overpass pubblico e non una sequenza di bbox. Niente geocodifica massiva su Nominatim pubblico. Prima della pubblicazione di dati OSM, riesaminare gli obblighi della banca dati derivata ODbL e mantenere attribuzione/provenienza.

Non è stata eseguita una raccolta reale in questo incremento: il test pilota usa dati **sintetici dichiarati**, mai pubblicati. La prossima consegna deve aggiungere un lotto reale piccolo, con fonti ufficiali e comuni minori, non schede riempite a caso.

## Evoluzione senza riscrittura

Il JSON è un archivio versionato, non un backend persistente. Quando servono aggiornamenti concorrenti, titolari e moderazione, introdurre un repository dati persistente con tabelle attività/sedi, località, fonti, dichiarazioni servizi/marchi, verifiche, revisioni e richieste di modifica. Gli identificativi e le firme dei criteri di ricerca restano riutilizzabili. Account, proprietà delle schede, upload e modelli di autorizzazione saranno progettati prima di attivarli. Nessun falso modulo che promette di registrare dati senza backend.

## Ripristino e rilascio

`8dc29a5` resta il riferimento recuperabile; tutti i vecchi file di `site/` sono ancora presenti. Per confrontare: `git diff 8dc29a5 -- site/`. Non occorre reset o cancellazione. Per rivedere la versione precedente usare un branch dedicato, senza toccare worktree altrui.

Nessun merge, deploy o modifica del dominio di produzione. Per un eventuale rilascio serviranno revisione della PR, scelta dell’hosting, prova delle route/canonical/404, mappatura delle vecchie URL e approvazione dell’utente. Il build statico non dimostra compatibilità di un futuro backend Workers.

## Riferimenti tecnici e condizioni

- Astro config: https://docs.astro.build/en/reference/configuration-reference/
- Generazione statica: https://docs.astro.build/en/guides/routing/
- TypeScript e check: https://docs.astro.build/en/guides/typescript/
- Overpass e limiti: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
- Estratti: https://www.geofabrik.de/data/download.html
- OSM/ODbL: https://www.openstreetmap.org/copyright
- Attribuzione: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- Nominatim pubblico: https://operations.osmfoundation.org/policies/nominatim/

## Verifiche e limiti di questo ambiente

`npm run verify`: typecheck Astro + strumenti TS, test dati/importazione, build e controlli link/canonical/sitemap, test degli eventi DOM sul bundle di produzione. Il test DOM usa jsdom: non è un browser grafico e non misura layout, contrasto percepito, console di un browser reale o viewport. CSS responsive e focus sono implementati; verifica visiva su desktop e smartphone **pendente**. L’anteprima viene esposta sulla porta 3000. Controlli HTTP con Host esatto, content type e contenuto delle route eseguiti separatamente.

Risultati locali finali: typecheck senza errori o warning; 14/14 test passati; 25 documenti HTML generati e controllati; test degli eventi sul bundle compilato superato; 27 route anteprima controllate con Host esatto (compreso 404), 29 file della build serviti via HTTP con JS/CSS corretti. `npm audit --omit=dev`: nessuna vulnerabilità segnalata. Workflow GitHub scritto ma non ancora eseguito da questo ambiente.

Restano da realizzare: verifica attuale dei contatti delle otto attività, raccolta reale pilota, mappa interattiva e fornitore tile, geolocalizzazione opzionale, parser degli orari, integrazione AI server con chiavi/costi verificati, moderazione persistente, nuovi articoli documentati ed espansione nazionale.
