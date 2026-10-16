# OROLOGIAI.IT — Incremento 02: primo lotto reale toscano

Data raccolta e revisione: **16 ottobre 2026**. Questo è un campione, **non il censimento completo della Toscana**.

## 1. Stato iniziale, branch e PR

- Branch di partenza `directory-foundation-20261016`, commit `6cb31fc5a816c8e9a6a950754d83241035e0f65a`, riscontrato sul remoto senza differenze.
- Main remoto osservato: `56e34a0db62259f5a83789dfc72263f481819a15`; le fondamenta non risultano integrate.
- Branch di questo incremento: **`censimento-toscana-02-20261016`**, discendente di `6cb31fc` e di `8dc29a5`.
- PR #2 verificata tramite API pubblica GitHub: **open**, `merged_at: null`, head `site-nuovo-orologiai-20261016` a `8dc29a5`, base `main`. Fonte: https://api.github.com/repos/superseller1960/orologiai.it/pulls/2 . Non modificata né unita.
- Non tracciati iniziali: `docs/RESOCONTO-LAVORO.md`, `mirror-logs/`, `temp_public/`. Il report richiesto dall’utente viene incluso per conservarlo; gli altri materiali restano intatti e fuori dal commit.
- Suite iniziale `npm run verify` superata prima della modifica.

### Procedura PR sicura

Il contenuto della PR #2 è già antenato di questo branch: non va unito separatamente per pubblicare la nuova applicazione. Aprire una revisione **main ← censimento-toscana-02-20261016**, verificando che contenga prima versione, fondamenta e lotto reale. Solo dopo aver controllato tale confronto proporre all’utente la chiusura della vecchia PR #2 come sostituita; nessuna chiusura, cancellazione branch o merge è stata eseguita. Non è stato disponibile un canale autenticato per creare la PR: descrizione pronta in `docs/PR-INCREMENTO-02.md`.

## 2. Acquisizione OSM reale e riproducibilità

Una sola richiesta POST all’endpoint `https://overpass-api.de/api/interpreter`, con la query pilota preesistente, bbox Firenze/comuni limitrofi (non confine amministrativo regionale) e tag `shop=watches`, `craft=watchmaker`, `craft=clockmaker`.

- Inizio acquisizione: `2026-10-16T03:49:54.593Z`.
- Fine: `2026-10-16T03:50:30.960Z`.
- Timestamp dati OSM: `2026-10-16T03:49:25Z`.
- **27 elementi reali**, di cui **25 candidati con nome** e **2 scarti senza nome**.
- SHA-256 estratto: `fb94973bd59f47d281ead736cc04425d917b95e64b8b94174991d5e3449f4014`.
- Importatore esistente riutilizzato, non sostituito; nessun record sintetico trasferito nel sito.
- Estratto/query/ricevuta: `data/staging/toscana-02-osm-source/`.
- Manifest/candidati/rapporto importatore: `data/staging/toscana-02-osm/`.
- Revisione manuale: `data/staging/toscana-02-review/`.

Questi tre lotti sono esplicitamente versionati per audit e CI senza rete, ma esclusi dalla build del sito. Non sono segreti: il repository pubblico rende consultabili i candidati; “staging” indica esclusione dall’applicazione, non riservatezza. Attribuzione **© OpenStreetMap contributors**, licenza **ODbL-1.0**, condizioni: https://www.openstreetmap.org/copyright . Non sono state scaricate fotografie o recensioni. Le fonti commerciali sono state consultate puntualmente, senza scraping indiscriminato.

## 3. Risultati e bilancio A/B/C

| Voce | Quantità |
|---|---:|
| Candidati con nome, dopo collegamento Swatch OSM/sito ufficiale | **54** |
| Elementi senza nome, conteggiati separatamente | **2** |
| Gruppo A: nuove sedi integrate | **25** |
| Gruppo B: candidati ancora in staging | **28** |
| Gruppo C: esclusi dalla pubblicazione | **3** |
| Attività finali nel database | **33** |
| Attività legacy conservate integralmente | **8** |

Calcolo candidati nominativi: 25 OSM + 24 nuove sedi individuate indipendentemente su fonti ufficiali + 4 prospect in revisione + 1 candidato Scardi già presente = 54. Swatch è lo stesso candidato in OSM e nella rete ufficiale e viene contato una volta. Il volume supera l’obiettivo indicativo di 20–30 perché l’estratto ha prodotto molti prospect: **la revisione pubblicabile è limitata a 25 nuove sedi**, le altre non vengono promosse automaticamente.

B = 24 candidati OSM senza riscontro ufficiale completato + 4 prospect:
- Il Giglio d’Oro Campi: CAP incongruo e fonti storiche da riconfermare.
- Il Giglio d’Oro Sesto: Via Gramsci 409 e Via Cavallotti 35 discordanti.
- Lamberti Sesto: estrazione soprattutto CSS/JSON; controllo nel browser necessario.
- Massari Campi: identità, pertinenza e telefono documentati; indirizzo emerso soltanto nello snippet, non trasferito senza consolidamento della sede.

C = 2 elementi OSM senza nome + candidato Scardi riconosciuto come attività legacy `scardi`. Il riscontro attuale Scardi è conservato, ma non ha generato una seconda scheda e non modifica automaticamente la scheda storica.

## 4. Deduplicazione

Confronto del lotto con tutte le attività, usando origine, nome normalizzato, indirizzo normalizzato/comune, telefono, dominio e coordinate quando disponibili. Sono segnalazioni, non fusioni automatiche.

**4 segnalazioni revisionate**:
1. Pisani Matteotti / Pisani La Maschera: dominio comune, due indirizzi distinti, conservate entrambe con `gruppoId: pisani`.
2. Agnolucci Signa / Poggio a Caiano: dominio comune, comuni diversi, `gruppoId: agnolucci`.
3. Ore & Oro Poggibonsi / Colle: dominio comune, sedi diverse, `gruppoId: oreoro`.
4. Scardi: duplicato del record iniziale, escluso dal nuovo inserimento.

Nessuna fusione automatica. ID e slug iniziali immutati; nuovi slug assegnati nel manifest revisionato e non derivati nuovamente a ogni build.

## 5. Nuove schede e copertura territoriale

| Comune | Provincia | Nuove sedi |
|---|---|---|
| Firenze | Firenze | Rabiti; Zagli; Ruben Calistri; Swatch Via dei Calzaiuoli |
| Scandicci | Firenze | Pisani Piazza Matteotti; Pisani La Maschera; Metalli Preziosi |
| Sesto Fiorentino | Firenze | Maggini |
| Empoli | Firenze | Rutili; FiciOro |
| Signa | Firenze | Agnolucci |
| Poggio a Caiano | Prato | Agnolucci |
| Bagno a Ripoli | Firenze | L’Ora di Piazza di Rusconi Paolo |
| Calenzano | Firenze | Follie d’Oro |
| Pontassieve | Firenze | Renai |
| Figline e Incisa Valdarno | Firenze | RenzoPreziosi; Sottili Franco |
| Pontedera | Pisa | Gabbani; Cerri Marco; Orogenesi |
| Poggibonsi | Siena | Ore & Oro |
| Colle di Val d’Elsa | Siena | Ore & Oro |
| San Miniato | Pisa | Spazio Tempo |
| Montevarchi | Arezzo | Lombardi |
| Firenzuola | Firenze | Ugolini |

Lotto: **16 comuni**, **5 province toscane**. Directory complessiva: **17 comuni**, includendo Milano già esistente. Per Figline è utilizzato il comune amministrativo corrente Figline e Incisa Valdarno; la località Figline Valdarno resta indicata negli indirizzi. Campi Bisenzio ha candidati B, non una pagina vuota.

## 6. Campi disponibili e limiti

Sulle 25 nuove schede:
- 24 indirizzi; Calistri non pubblica un indirizzo visitabile leggibile, quindi resta assente.
- 17 CAP.
- 23 telefoni.
- 23 siti dell’attività; per L’Ora di Piazza e Sottili è citata la rete del marchio, senza inventare un sito proprio.
- 13 email pubbliche, 3 WhatsApp.
- 8 storie/anni di fondazione attribuiti alle fonti delle attività.
- 2 calendari settimanali espliciti trasferiti: Rabiti e Swatch. Nessuna indicazione “aperto oggi”.
- **0 coordinate pubblicate**: i punti OSM rimangono in staging, non considerati posizione verificata. Nessuna distanza simulata.

Tutte le nuove schede sono `fonti-verificate` per identità e pertinenza riscontrate online; non significa sopralluogo, certificazione commerciale o conferma del titolare. Ogni fonte ha URL e data 2026-10-16. Servizi e marchi riportano riferimenti specifici e link alla fonte nella pagina.

Autorizzazioni alla rivendita documentate da fonti del marchio: Calamai (L’Ora di Piazza/Ugolini), Hamilton (Sottili), Breil (Lombardi), negozio Swatch. **Nessuna nuova assistenzaUfficiale**: le dichiarazioni dei negozi non sono state convertite in qualifiche ufficiali senza riscontro del marchio. Marchi venduti/riparati/esperienza rimangono distinti.

Ulteriori cautele:
- Laboratorio della rete Pisani non localizzato arbitrariamente dentro una sede.
- Agnolucci Signa non eredita tutte le competenze del laboratorio della rete.
- Ore & Oro non eredita automaticamente tutti i marchi di rete in entrambe le sedi.
- Metalli Preziosi dichiara collaborazione con un orologiaio esterno, chiaramente indicata.
- FiciOro descrive modelli vintage: non viene dedotto che siano usati.
- La categoria acquisto/permuta è un raggruppamento: il testo precisa acquisto/contro vendita quando documentati, non promette permuta universale.
- RenzoPreziosi: indirizzo ripetuto a Figline Valdarno, ma meta description Reggello discordante annotata nella scheda.
- Nessun telefono chiamato o servizio acquistato: è verifica documentale online.

## 7. Modifiche circoscritte al codice

- `schema.ts`: storia facoltativa e obbligo di fonte se presenti fatti storici, invece di forzare un testo inventato per ogni nuova attività.
- `duplicates.ts`: segnali multipli e sedi di rete distinte.
- `fetch-osm-pilot.ts`: una richiesta delimitata, ricevuta/hash e fallimento esplicito, nessun retry massivo.
- `integrate-toscana-02.ts`: integrazione solo lista A, rifiuto sovrascrittura record, bilancio A/B/C e controllo conservazione.
- Schede: fonti per servizi/marchi, messaggio storia assente, avvisi coerenti con la fonte, verifica orari e ricerca testuale esterna dell’indirizzo dichiarata non equivalente a punto verificato.
- Pagine territoriali/ricerca/home/metodo: aggiornate le frasi che presumevano solo dati storici.
- Pagine servizi: contenuti specifici per i nuovi servizi, nessun redesign.
- Checker HTML: parser reale per gli attributi `id`, così `data-business-id` non è erroneamente trattato come ID duplicato.
- CI: pattern `censimento-*`, storia Git completa per test di conservazione. Nessun deploy.

## 8. Fonti consultate

Elenco completo con URL ed evidenze brevi: **`data/import/toscana-02-reviewed.json`** (44 riferimenti), copiato anche nel rapporto macchina `data/import/toscana-02-report.json`. Comprende siti delle attività, reti ufficiali Calamai/Hamilton/Breil/Swatch, comune di Figline e Incisa Valdarno, fonti di prospect B e controllo Scardi. Non sono state copiate descrizioni integrali, foto o recensioni; le descrizioni pubblicate sono sintesi originali di fatti.

Sorgente geografica: Overpass/OpenStreetMap con query originale, hash e ODbL. Le coordinate OSM non sono trasferite nella directory pubblica. Swatch conserva `origine.sistema: osm` e `idOriginale: node/11833445469`; indirizzo, telefono, servizi e orari sono riscontrati indipendentemente in https://www.swatch.com/it-it/storedetails?sid=R282371 . Non si presume che la separazione dei file elimini obblighi di licenza: una futura pubblicazione di dati OSM richiede ulteriore revisione ODbL.

## 9. Pagine e test

Build finale: **102 HTML**, rispetto ai 25 iniziali, comprendenti 33 schede, 17 località, indici, marchi e servizi, vecchie URL conservate e 404. Nessuna pagina Campi vuota.

`npm run verify` dopo le correzioni: typecheck senza errori/warning; **22/22 test**, validazione dataset, build produzione, link/fragment/canonical/sitemap e test interfaccia compilata in jsdom. Un test esegue la migrazione su una copia temporanea del dataset di `6cb31fc` e confronta l’intero risultato con i dati finali; verifica anche il rifiuto di una seconda integrazione. I nuovi test usano l’estratto reale e lo distinguono dalla fixture sintetica. Coprono bilancio A/B/C, hash/provenienza, unicità, conservazione legacy/mirror, dati mancanti, autorizzazioni e ricerca reale.

Interazioni DOM: nome, comune, provincia, servizio, marca, filtri combinati, nessun risultato, reset, URL condivisibile. Test di ricerca include Scandicci/revisione, Pisa/Tissot e Hamilton/Sottili senza confusione con assistenza ufficiale. Tutte le nuove schede hanno link alla propria località e stato coerente.

HTTP: **104 route dell’anteprima**, Host esatto e 404; **106 file della build** serviti da server statico temporaneo con MIME JS/CSS corretti. Il primo tentativo di controllare asset con hash sul dev server ha dato 404 (le build asset non sono endpoint dev): corretto il metodo di verifica e ripetuto sul server statico, non nascosto il fallimento.

`npm audit --omit=dev`: nessuna vulnerabilità segnalata al momento del controllo. Il workflow CI è predisposto; esito remoto da controllare dopo push.

## 10. Anteprima e verifica visiva

Server esistente riutilizzato sulla porta **3000**, bind `0.0.0.0`, hostname esatto consentito. Anteprima aperta nel pannello Browser. Percorsi da esaminare:
- `/cerca/?localita=scandicci&servizio=revisione`
- `/orologeria/rutili-empoli/`
- `/orologeria/ugolini-firenzuola/`
- `/orologerie/toscana/pisa/pontedera/`

**Verifica grafica desktop/mobile e console di un browser reale: pendenti.** L’ambiente offre anteprima, ma non automazione browser o lettura del suo rendering. jsdom verifica eventi, non dimensioni, leggibilità visiva o assenza di overflow. Chiedere all’utente di controllare nel Browser desktop e smartphone; non dichiarato superato sulla sola base di HTTP.

## 11. Problemi aperti e prossimo incremento

28 candidati restano da revisionare. Mancano coordinate pubbliche affidabili, molti orari, alcuni CAP e recapiti. Nessun nuovo account titolare, AI reale, mappa interattiva o moderazione persistente introdotto. La Toscana non è completa.

Prossimo incremento: risolvere i quattro prospect commerciali B e un sottoinsieme di OSM con siti ufficiali; aggiornare le cinque schede legacy fiorentine mantenendo cronologia; verificare coordinate e servizi per sede prima della mappa; controllare visualmente il lotto su smartphone. Estendere poi ad altri comuni/province senza duplicare dati o generare pagine vuote.

## 12. Comandi e riproduzione

`npm ci && npm run verify` non richiede rete per raccolta: usa l’estratto versionato. `npm run fetch:osm:pilot` è un’acquisizione esplicita one-shot che rifiuta di sovrascrivere il lotto già esistente. `npm run integrate:toscana-02` è una migrazione one-shot, deliberatamente rifiutata sul database già integrato; non va eseguita durante build o CI. Gli script sono disponibili per audit del passaggio, non per sostituire il dataset con import parziali.

Nessun merge, chiusura PR o deploy in produzione effettuato.
