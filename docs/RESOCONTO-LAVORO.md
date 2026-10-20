# OROLOGIAI.IT — RESOCONTO DEL LAVORO SVOLTO

Data di riferimento: 16 ottobre 2026.
Repository: https://github.com/superseller1960/orologiai.it

## 1. Obiettivo

Realizzare una directory nazionale italiana di orologerie, laboratori e professionisti dell’orologeria, includendo progressivamente anche i comuni minori. Il portale dovrà offrire schede documentate, ricerca per esigenze e territorio, mappe, contenuti storici e un assistente AI collegato ai dati reali.

È stato completato il primo incremento delle fondamenta tecniche. Il censimento nazionale non è ancora completato.

## 2. Recupero del sito originale

È stato recuperato un mirror storico nella cartella `public/`, utilizzando pagine archiviate e risorse reperibili del sito e dei temi/plugin WordPress.

Il precedente report di recupero registra 106 file, circa 5,1 MB, 13 pagine HTML e 898 riferimenti a risorse controllati via HTTP. Le pagine comprendono home, Firenze, Milano, Rolex, rivenditori Rolex Milano, blog, contatti e pagine del vecchio negozio.

Roma e pagamento non sono state recuperate. Le funzioni dinamiche WordPress non sono state ricostruite. Il mirror non costituisce una verifica attuale delle informazioni.

Riferimento storico: commit `b883627`, entrato in main con il merge della PR #1 riscontrato nell’audit. Il mirror non è stato modificato durante il nuovo incremento.

## 3. Prima versione di site/

È stata realizzata una prima versione con home, filtri, pagine Firenze/Milano/Rolex/Blog e otto attività:

- Firenze: Scardi, Marretti, Fani Gioielli, Bigalli, Senzatempo Firenze.
- Milano: Sangalli, Gioiellerie Rocca, Ronchi Gioielli.

Salvataggio storico: branch `site-nuovo-orologiai-20261016`, commit `8dc29a5`.

Nomi, storie, anni e servizi provenienti dal dataset originale sono stati conservati. Nessun indirizzo, telefono o coordinata mancante è stato inventato.

## 4. Audit e conservazione

L’audit ha controllato branch, commit, main remoto, modifiche locali, dati, pagine, script, documentazione, workflow e strumenti di test.

Main osservato durante l’audit: `56e34a0`, contenente il merge del mirror. Il commit `8dc29a5` non risultava antenato di main. Lo stato della PR della prima versione non è stato verificato tramite API GitHub.

Il nuovo lavoro è stato svolto sul branch dedicato `directory-foundation-20261016`, creato da `8dc29a5`.

Tutti i precedenti file di site/, il JSON originale e public/ sono rimasti invariati. Sono stati usati confronti Git e checksum. Le cartelle preesistenti `mirror-logs/` e `temp_public/` sono rimaste fuori dal commit. Nessun reset distruttivo, modifica diretta a main o deploy.

## 5. Architettura realizzata

- Astro 7.4.0 per generazione statica.
- TypeScript 6.0.3.
- Zod 4.6.7 per validazione.
- npm con package-lock.json; Node richiesto 22.22 o successivo.
- Applicazione attiva: `site/src/`.
- Dataset autorevole: `site/data/directory.json`.
- Dataset originale conservato: `site/data/orologerie.json`.
- Output dedicato: `dist/`.

Astro non copia il mirror public/ nell’output. Dati, importazione, ricerca e presentazione sono separati. Il JSON è un archivio versionato iniziale, non un backend persistente per futuri account e modifiche concorrenti.

## 6. Modello dei dati

Il modello prevede ID e slug stabili, tipologie, descrizione, nomi precedenti e gruppi di sedi; comune/provincia/regione, indirizzo/CAP/coordinate facoltativi; contatti e orari con fonti; servizi e specializzazioni; storia, date, verifiche, segnalazioni, cronologia e provenienza.

I marchi sono distinti tra venduti, riparati, esperienza dichiarata, assistenza ufficiale, rivendita ufficiale e semplici menzioni.

Sono controllati duplicati di ID/slug, riferimenti inesistenti, coordinate impossibili, URL non sicuri, intervalli orari invalidi e autorizzazioni prive delle evidenze richieste.

Le otto schede iniziali sono “Da verificare”. Una fonte storica non viene presentata come verifica attuale. La conferma del titolare resta distinta dalla verifica indipendente.

## 7. Directory, pagine e ricerca

Pagine generate dai dati:

- `/orologeria/[slug]/`
- `/orologerie/[regione]/[provincia]/[comune]/`
- `/orologerie/`
- `/marchi/[marca]/`
- `/servizi/[servizio]/`
- `/cerca/`, `/metodo/`, `/partecipa/`

Sono conservati gli indirizzi Firenze, Milano, Blog e Rolex. Blog e Rolex includono avviso editoriale e noindex in attesa di revisione. Non sono state create migliaia di pagine territoriali vuote.

La ricerca combina nome/testo, comune, CAP/indirizzo effettivi, regione, provincia, servizio, marchio/ruolo, tipologia, specializzazione e stato. Include conteggi, reset, assenza risultati e filtri condivisibili via URL.

Il motore dispone del calcolo della distanza, testato con coordinate controllate. La UI non propone distanze o “aperto oggi” per le otto schede: coordinate e orari verificati mancano. I filtri richiedono JavaScript; le schede HTML restano navigabili senza JavaScript.

## 8. Design e SEO

Homepage riprogettata con verde scuro, avorio e ottone; ricerca centrale, quadrante CSS, territori, servizi, botteghe storiche e presentazione trasparente del futuro AI. Layout responsive, focus da tastiera, etichette e collegamento per saltare al contenuto sono implementati.

SEO: titoli e descrizioni, canonical, sitemap XML, robots.txt, link interni, pagina 404 e dati strutturati WebPage. Nessun indirizzo o orario fittizio nei dati strutturati. Nessun redirect storico inventato.

Il rendering grafico desktop/mobile non è stato verificato in un browser automatico.

## 9. Importazione OSM

Importatore di file locali JSON per `shop=watches`, `craft=watchmaker` e `craft=clockmaker`.

Valida e normalizza, conserva ID/tag originali, registra URL/data/timestamp/hash/licenza/attribuzione, scarta record non pertinenti o invalidi, deduplica ID ripetuti e segnala somiglianze senza fondere automaticamente le sedi.

Produce manifest, candidati e rapporto in `data/staging/`, senza modificare il dataset pubblico. È predisposto un pilota Firenze e comuni limitrofi come primo passo per la Toscana. Il bounding box non viene considerato un confine amministrativo.

Non sono state effettuate raccolte massive né geocodifica pubblica. L’espansione nazionale è progettata intorno a estratti adeguati e revisione delle condizioni/licenze.

Nessun lotto reale nuovo è ancora stato importato: i test usano dati sintetici dichiarati, esclusi dalla pubblicazione.

## 10. Verifiche registrate nell’ultimo incremento

- Installazione riproducibile `npm ci`: superata.
- Typecheck: zero errori e warning.
- 14 test automatici: tutti superati.
- Validazione e conservazione del dataset: superate.
- Build: 25 documenti HTML.
- Link, frammenti, canonical, sitemap e JSON-LD: controllati.
- Bundle compilato della ricerca testato nel DOM simulato: filtri, invio, reset, deep link, stato vuoto e input ostile.
- HTTP: 27 percorsi dell’anteprima e 29 file della build controllati, inclusi i MIME di CSS/JS.
- `npm audit --omit=dev`: nessuna vulnerabilità segnalata al momento del controllo.

I difetti trovati durante lo sviluppo sono stati corretti e le verifiche interessate rieseguite. Nessun controllo automatico finale è rimasto fallito. Questi risultati sono quelli dell’incremento precedente, non nuove esecuzioni effettuate per scrivere questo report.

Il DOM simulato non verifica il layout o sostituisce un browser grafico. Esito del workflow GitHub e rendering desktop/mobile restano da verificare.

## 11. Documentazione e stato Git

Documenti: README.md, docs/INCREMENTO-01.md, docs/PR-INCREMENTO-01.md e data/staging/README.md.

Workflow aggiunto per verifiche senza deploy. Workflow storico protetto contro sovrascritture del mirror.

Branch: `directory-foundation-20261016`.
Commit applicativo: `6cb31fc5a816c8e9a6a950754d83241035e0f65a`.
48 file modificati/aggiunti nel commit, spinto e verificato sul remoto al termine dell’incremento.

La PR non è stata creata: il testo è pronto. Nessun merge su main o deploy in produzione. L’anteprima è stata aperta sulla porta 3000; è temporanea e la sua disponibilità non è stata ricontrollata per questo report.

Questo resoconto, `docs/RESOCONTO-LAVORO.md`, è un documento aggiunto successivamente e non fa parte del commit 6cb31fc.

## 12. Funzionalità ancora da completare

- Contatti e operatività attuale delle otto schede.
- Primo lotto reale e comuni minori.
- Espansione nazionale.
- Mappe interattive e geolocalizzazione facoltativa.
- Interpretazione degli orari e “aperto oggi”.
- AI reale lato server con provider/costi/credenziali verificati.
- Backend persistente, titolari, richieste e moderazione.
- Articoli originali documentati e revisione dei contenuti storici.
- Verifica visiva desktop/mobile.
- Procedura di rilascio e revisione delle URL storiche.

“Partecipa” apre il programma di posta: non memorizza richieste. Ricezione dell’email storica non verificata. Nessuna chiave API nel repository e nessun servizio esterno a pagamento integrato nell’incremento.

## 13. Prossimo incremento

Raccogliere un piccolo lotto reale in Toscana, includendo comuni minori; controllare siti ufficiali, contatti, servizi e ruoli dei marchi; registrare fonti e date, risolvere duplicati, revisionare prima della pubblicazione, rigenerare le pagine ed eseguire test e anteprima.

RISULTATO FINORA: fondamenta data-driven funzionanti e verificabili, non ancora un database nazionale completo. Il passo successivo è popolarle con informazioni reali, aggiornate e documentate.
