# Orologiai.it — Fase 20: dati, mappe e consolidamento

Data: 1 novembre 2026. **Completato e collaudato localmente; NON distribuito su Pages.**

## Stato di produzione e sincronizzazione

Prima di modificare i sorgenti sono stati letti il progetto Pages, il deployment canonico, l'HTML della homepage/ricerca e l'handoff remoto. Cloudflare conferma come produzione **`44aad3df-54f7-4a78-98bd-8510b47f2d70`**, URL `https://44aad3df.orologiai-it.pages.dev`, dominio `https://www.orologiai.it`, progetto esistente `orologiai-it`, branch `pubblicazione-gratuita-scardi-20261022`.

Handoff: https://fase19-design-handoff.orologiai-it.pages.dev/OROLOGIAI_FASE19_DESIGN_HANDOFF.json

La patch allegata dall'utente descrive una precedente versione sorgente Fase19. Si è usato come riferimento finale il CSS dell'handoff: CSS e trasformazione DOM sono presenti **esattamente** nell'HTML della produzione letta. Non è stato fatto pull/reset da GitHub: il lavoro locale non committato Fase18 è stato riconciliato e conservato. Le copie e gli hash di acquisizione sono in `artifacts/fase20/sync/`; handoff e HTML ricerca necessari ai test anche in `data/staging/fase20/`.

Ricontrollo finale del progetto: canonico ancora **44aad3df-54f7-4a78-98bd-8510b47f2d70**. Nessuna scrittura Cloudflare effettuata.

## 1. Numeri prima e dopo

| Misura | Produzione Fase19 letta | Checkpoint locale Fase18 | Locale Fase20 |
|---|---:|---:|---:|
| Attività | 324 | 346 | **350** |
| Località | — | 200 | **201** |
| Fonti | — | 909 | **919** |
| Coordinate verificate | **4** (data-points HTML) | **82** | **82** |
| Nuove attività di questa fase | — | — | **4** |
| Schede esistenti arricchite in questa fase | — | — | **2** |

Le 22 attività e le 78 coordinate aggiunte localmente in Fase18 sono conservate, non ricontate come nuovi risultati Fase20. Rispetto alla produzione attuale il pacchetto riunisce 26 sedi aggiuntive (22 Fase18 + 4 Fase20). Nessuna delle 346 identità/slug/località del checkpoint eliminata; tutte le coordinate precedenti coincidono esattamente. Una terza scheda esistente, Martines Canicattì, ha soltanto ricevuto il `gruppoId` della rete: non conteggiata come arricchimento editoriale.

### Quattro nuove sedi

1. **Gioielli Giuliani — Prato**, Via Francesco Ferrucci 478, 59100, 0574 582491. Origine nel 1973 dalla riparazione di orologi, due laboratori interni (orafo e orologiero), acquisto/vendita nuovi e usati. Nessun movimento specialistico dedotto.
2. **Virole Watch — Prato**, Via Giacomo Matteotti 1, 59100, 0574 1662203. Nata nel 2018, riparazione, vendita nuovi/vintage e perizie/stime. Laboratorio proprio dichiarato, ma collocazione interna al negozio non specificata: registrato come tale.
3. **Gioielleria Orologeria Suligoj — Gorizia**, Via Carducci 49, 34170, 0481 535657. Laboratorio di riparazioni annesso al negozio, assistenza post-vendita su tutti gli articoli, compresa orologeria. Nessuna revisione/specializzazione attribuita per deduzione. Il sito è HTTP e non fornisce una conferma sul posto.
4. **Martines — Agrigento**, Via Atenea 133/135, 92100, +39 0922 23716. Boutique dal 2016 con vendita e servizi della rete. **Laboratorio a Canicattì**, non ad Agrigento: tipo `rete`, nessuna riparazione interna attribuita al comune. Nessuna nuova autorizzazione ufficiale Rolex senza fonte del produttore.

Copertura mirata: Prato 1→3, Gorizia 1→2, Agrigento 0→1. Non sono quattro laboratori specialistici interni: le classificazioni restano distinte.

Fonti primarie lette:
- https://www.gioielligiuliani.it/
- https://www.virolewatch.it/pages/chi-siamo
- https://www.virolewatch.it/policies/contact-information
- http://www.suligoj.com/pag_1.asp
- https://www.gioielleriamartines.it/gioielleria-martines-agrigento.html
- https://www.gioielleriamartines.it/assistenza-rolex-orologi-gioielleria-martines.html

Registro riproducibile: `scripts/integrate-fase20.mjs`, `data/import/fase20-reviewed-report.json`, baseline `data/staging/fase20/catalog-before.json`. Script idempotente: seconda esecuzione, SHA catalogo e rapporto identici. Nessuna raccolta di rete nello script.

## 2. Belluno: copertura reale, non gonfiata

**Quattro schede nel comune; due con riparazione documentata.** La Fase20 non ha trovato prove sufficienti per aggiungere un terzo riparatore.

- **Boni**: descrizione arricchita con famiglia, collaborazione di Giovanni dal 1995, revisione di alta gamma, pendoleria e usato. Riconfermati i marchi riparati, non qualificati come autorizzazioni. Corretta la classificazione Fase18 troppo netta del laboratorio: la fonte parla di bottega/lavorazioni, ma non colloca esplicitamente ciascun intervento all'interno. Ora `non-specificato`, senza eliminare servizi documentati. Anno di fondazione resta nullo.
- **De Marco**: descrizione e laboratorio arricchiti con lavaggio/lubrificazione, componenti usurati, guarnizioni e controlli di precisione; tre lavorazioni specifiche aggiunte. La pagina contatti colloca il laboratorio in Piazza Mazzini 3. Nessuna specializzazione meccanica o autorizzazione di marchio dedotta.
- **Vicentini**: pagina `/i-nostri-servizi/` restituisce 403. Uno snippet suggerisce riparazioni ma non è stato promosso a prova primaria letta. La vendita documentata in Fase18 resta; servizi da riconfermare.
- **GIOR**: rimane laboratorio **orafo** e vendita. Nessuna riparazione orologiera dedotta.
- **Piaz**: nessuna nuova fonte affidabile; non confusa con Pasa a Lentiai/Borgo Valbelluna.
- **Santarossa**: nessuna nuova prova primaria sufficiente; esclusa.
- De Min a Santa Giustina non è nel comune di Belluno ed era già distinta nel catalogo.

Fonti lette:
- https://www.gioielleriaboni.it/chi-siamo
- https://www.gioielleriaboni.it/riparazione-orologi
- https://www.demarco-belluno.it/riparazioni-orologi-a-belluno/
- https://www.demarco-belluno.it/contatti/

Nessun candidato forzato dagli altri capoluoghi cercati: Gallo Crotone solo directory; Cappellato Rovigo solo snippet social; Sotgiu Oristano senza recapiti verificabili; Horology Lab Rieti senza prova esplicita riparazione; Massimo Avella Prato con estrazione CSS anziché testo servizi. Non pubblicati.

## 3. Ricerca premium Fase19 consolidata in Astro

File riconciliati: `BusinessCard.astro`, `search.css`, `cerca.astro`. Il CSS live dell'handoff è mantenuto esattamente. Il markup premium viene compilato da Astro: **nessun dizionario di descrizioni o `innerHTML` di trasformazione ereditato dalla preview**. Le descrizioni provengono dal catalogo; le card fuori ricerca conservano il ramo Fase18, senza modifica homepage/schede.

Conservati: titolo “Trova il professionista giusto”, gerarchia editoriali, azione “Conosci la bottega”, Chiama, card nascoste rispettate, alternative distinte e fonti nelle schede. Massimo quattro servizi documentati, con il servizio richiesto in evidenza: questa logica dati Fase18 è conservata, anche se la vecchia preview ne troncava tre. Nessun nuovo restyling.

Confronto browser reale locale/produzione Torino+Manutenzione:

| Proprietà prima card | Desktop (entrambi) | Mobile (entrambi) |
|---|---|---|
| Larghezza | 1130 px | 358 px |
| Colonne contenuto | 714.531 / 333.453 px | 318 px |
| Font nome | Georgia, serif · 41.6 px | Georgia, serif · 33.15 px |
| Padding contenuto | 13px 26px 19px | 14px 19px 18px |
| Fondo/raggio | rgb(255,252,246) / 3px | identici |

Torino+manutenzione: **4 risultati**, come produzione/handoff. Screenshot produzione e locale archiviati.

Homepage Fase16C: sei SHA256 sorgenti/asset invariati (home, layout, CSS home, due copie home-upgrade, illustrazione). Non è una promessa di HTML byte-identico: conteggi e catalogo incluso negli script possono cambiare con i dati. Titolo, design, navigazione, asset, font e routing non riprogettati.

## 4. Mappa utile e coordinate persistenti

Conservate e verificate le correzioni Fase18: marker limitati a ID risultati/alternative dichiarate, popup DOM sicuro con link scheda, filtri sincronizzati, nessun ritorno ai pin nazionali quando manca una sede verificata. Centro territoriale separato dal pin negozio; messaggio senza coordinate. Su touch spostamento attivabile con pulsante; nessun overflow a 390 px.

| Ricerca | Risultati | Marker pertinenti |
|---|---:|---:|
| Belluno + Riparazione | 2 | **0**, messaggio esplicito e inquadratura Belluno |
| Torino + Manutenzione | 4 | **3** |
| Firenze + Riparazione | 7 | **3** |
| Milano + Riparazione | 4 | **2** |

Popup Firenze verificato: link `/orologeria/senzatempo-firenze/`, pagina HTTP200. Alternative Belluno per riparazione-meccanici: 2, non esatti; rimozione servizio porta a 4 schede comunali.

Quattro nuove richieste geocodifica da CLI esistente, singolo thread, cache, attesa 1250ms e User-Agent identificativo: **nessuna supera la revisione** (civico/strada discordanti o intervallo civici complesso). Nessuna coordinata pubblicata da queste richieste. I risultati restano in cache Fase18/proposte; non si eseguono query nel browser o nella build.

La mappa incorporata nel sito De Marco espone il centro della vista Google, non un punto sede verificato: non convertito arbitrariamente in marker. Coordinate finale **82**, uguali al checkpoint locale, contro **4** della produzione letta.

Screenshot autentici del browser sul build finale workerd, non mockup. **Tile OSM bloccate nell'automazione per policy:** lo sfondo vuoto è previsto; i test verificano UI/pin/popup, non il fondale live. Cartografia reale e dispositivi Android/iOS fisici restano da controllare interattivamente.

## 5. Build, Functions e verifiche

- `npm ci` da lockfile esistente; nessun upgrade/dependency aggiunta al progetto.
- `npm run check`: **0 errori, 0 warning, 0 hint**.
- `npm run build` finale: **692 HTML**, **350 schede**, link/frammenti/canonical/sitemap/routing validi, API generate.
- `npm run package:pages`: **725 file, 14.69 MiB**, `_worker.js` circa 1.6 MB, entrambe le API e `_routes.json`; manifest SHA256 tutti corrispondenti.
- Test mirati Fase18/Fase20/search-services: **14/14**, nessun sospeso. Il primo rilancio segnalava la rete Martines non ancora collegata: corretto `gruppoId` dei due indirizzi, non indebolito il controllo duplicati. Test Fase18 verifica ancora esattamente le 346 identità pre-Fase20.
- Test DOM ricerca/assistente passati. Nessuna suite completa generale ripetuta.
- Chromium desktop 1440px e touch viewport 390px: quattro ricerche, card/marker, alternative, popup, nessun errore JavaScript/overflow. Confronto geometrie Fase19 online/locale passato.
- workerd locale, compatibility **2026-10-17**: home/ricerca/schede/sitemap/font/coordinate/API posizione HTTP200 con tipi MIME corretti; assistente stessa origine 200, origine estranea 403.
- Assistente locale: **`modalita: non-configurato`**, non AI reale. Binding remoto esistente `AI`/`AI_PROVIDER=cloudflare` confermato, non modificato.
- Primo avvio Wrangler con `--no-bundle` fallito per modulo facade mancante; avvio normale con bundling riuscito, verifiche effettuate sul server sano.
- Dev server 3000 su `0.0.0.0`, hostname preview preciso consentito e HTTP200 con Host corrente; mostrato nel pannello Browser. Non è un deployment Pages.

Log e dati: `artifacts/fase20/{check.log,build-final.log,tests-final.log,ui.log,browser-checks.json,workerd-checks.json}`.

## 6. Deployment: blocco non risolto, nessuna pubblicazione parziale

Il connettore Pages richiede un allegato remoto `{name,mimetype,s3key}` per `worker_script`, `worker_bundle` e file di routing. La ricerca strumenti non offre un trasferimento workspace→allegato remoto. L'upload inline di asset statici non trasmette il Worker eseguibile. Anche l'upload versioni Worker richiede gli stessi allegati e non è un'alternativa Pages.

**Nessun nuovo deployment preview/production**, nessun proxy aggiuntivo, nessuna pubblicazione solo statica, nessun nuovo progetto, nessun GitHub/push, nessuna estrazione di credenziali o API token nei comandi. Il proxy temporaneo esistente rimane online con il design approvato; il pacchetto locale è invece autonomo.

AI reale con `modalita: ai` sul nuovo pacchetto **non verificata**: manca la preview autonoma. Non eseguite chiamate AI a consumo per simulare tale verifica. Nessun piano/billing/DNS/email o altro sito modificato.

### Rilascio da terminale utente già autenticato

Non richiede GitHub, nuovo progetto o chiavi in chat. Estrarre DEPLOY e caricare l'intera cartella (non soltanto `dist/` e non lo ZIP come asset):

```bash
npx --yes wrangler@4 pages deploy .runtime/pages-build --project-name=orologiai-it --branch=fase20-integrale-preview-20261101
```

Comando **non eseguito qui**. La preview è pubblica. Verificare: pagine/asset, quattro città, tile/popup/mobile, schede, sitemap/catalogo, 15 sospesi assenti, Functions e risposta assistente `modalita: ai`. Non rimuovere prima il proxy.

Solo dopo il collaudo completo ricontrollare il canonico: fermarsi se diverso da **44aad3df-54f7-4a78-98bd-8510b47f2d70**. Pubblicare lo stesso pacchetto sul branch Production già esistente e ricontrollare dominio/API. Finché manca anche una verifica, la produzione non va promossa.

## 7. Riproduzione

Dallo ZIP SORGENTI, Node >=22.22:

```bash
npm ci --no-audit --no-fund
npm run check
npm run build
npm run package:pages
npx tsx --test tests/fase18.test.ts tests/fase20.test.ts tests/search-services.test.ts
```

Catalogo finale già incluso: non occorre rieseguire la raccolta geografica. Per riprodurre soltanto il lotto Fase20 in una copia di lavoro: sostituire `site/data/directory.json` con `data/staging/fase20/catalog-before.json`, poi `node scripts/integrate-fase20.mjs`. Le coordinate precedenti sono conservate; nessuna chiamata di rete. Alcuni test storici generali dipendono dalla storia Git non inclusa negli ZIP.

Archivi di consegna: `artifacts/fase20/orologiai-fase20-DEPLOY.zip`, `orologiai-fase20-SORGENTI.zip`, `SHA256SUMS.txt`. Esclusi .env reali, credenziali, dipendenze, browser, Git e snapshot HTML esterni delle attività. Il sorgente include handoff/HTML ricerca pubblico, baseline e cache geografica necessari alle verifiche.
