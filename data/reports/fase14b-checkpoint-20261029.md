# Fase 14B — checkpoint operativo, 29 ottobre 2026

## Stato Cloudflare e separazione

Produzione confermata `80e4ce42-04fa-4e97-9199-3cf0cf21bc13`; la preview `896480d0-cb00-4544-aac9-648cb076c6ce` è del Lotto 5, non della Fase 14B. Non è stato creato alcun nuovo deployment.

- Snapshot A di rilascio, separato e recuperabile in `export/fase14b-snapshot-a/source.zip`: 324 attività, 196 località, 790 fonti, database SHA-256 `93d6a84c72fad803be674a7080af08452c2453a45f4a475d355e332e6ea13b06`. Contiene modifiche SEO e homepage locale, inclusa immagine editoriale.
- Snapshot B in `export/fase14b-snapshot-b/`: database completo a 338 attività, Lotto 5 import e report, test e patch preesistente. Hash verificati con `SHA256SUMS`. Il worktree principale conserva sia Lotto 5 sia le modifiche Fase 14; non va distribuito in blocco.
- Lo snapshot A per il solo rilascio SEO era stato costruito separatamente dal commit 9ce8908, con le sole modifiche `astro.config.mjs`, `scripts/check-build.ts`, `tests/national02.test.ts` e `site/src/pages/orologeria/[slug].astro`. I 679 percorsi compilati coincidevano con quelli del manifest di produzione precedente; DB, worker, routes e redirects avevano hash identici. Il pacchetto SEO è stato successivamente sostituito dal pacchetto della homepage nell'area temporanea: ricostruire lo snapshot A SEO separato prima di un eventuale rilascio autonomo.
- Il progetto usa Cloudflare Pages con Functions: nel contesto corrente l'integrazione richiede `s3key` di file uploadable per worker e routes, ma non è disponibile un ponte verificato dai file locali a quegli allegati. Non ricorrere a una distribuzione senza worker o a un Git source. È necessario un percorso di caricamento autorizzato che supporti il worker, oppure un ambiente Wrangler autenticato con le corrette credenziali gestite.

## SEO

Modifiche locali alla generazione di canonical, sitemap, robots e JSON-LD attraverso `Astro.site` su `https://www.orologiai.it`, e link di segnalazione. Build check più severo, con eccezione esplicita per alias canonizzati `/firenze/` e `/milano/`. `npm run verify`: 246 test e test UI DOM passati sul dataset 324. Worker locale Wrangler 4.154.0: homepage, ricerca, scheda, sitemap, robots, API posizione e assistente verificati; `non-configurato` è fallback locale. Suite Chromium: 19 scenari superati sul pacchetto SEO isolato. Nessun deployment.

La ricerca pubblica per percorsi WordPress/spam non ha dato risultati nelle query effettuate: non è prova di assenza di URL indicizzati o di compromissione. `/wp-json/`, `/wp-admin/`, `/wp-content/` hanno risposto 404; redirect storici `/contact/` e `/termini-e-condizioni/` hanno risposto 301. Search Console non è disponibile tra le integrazioni collegate.

## Homepage

Rimodulazione preesistente in quattro percorsi e regioni compatte, più una fotografia CC0 illustrativa del laboratorio di Derek Pratt in Svizzera, con autore e provenienza in didascalia. Due varianti WebP ottimizzate rappresentano una sola foto; dettagli e licenza in `data/reports/fase14b-immagini-20261029.md`. `npm run verify` dello snapshot A completo: 246 test e UI DOM superati, pacchetto 681 file. Chromium ha verificato il caricamento della foto, assenza di overflow orizzontale ed errori JS ai viewport 360, 390, 768 e 1440. Gli screenshot `artifacts/fase14b-home-*.png` sono sul server dev del worktree principale, che mostra 338 record non pubblicati, NON una preview Cloudflare di snapshot A.

## AI

Il secret `GEMINI_API_KEY` è presente solo come nome in produzione, non in preview; il kill-switch nel codice pubblico non lo passa al provider. Risposta pubblica osservata `non-configurato`. Piano, quote e progetto Google effettivi non sono identificabili dal nome del secret. I [termini Google Gemini API](https://ai.google.dev/gemini-api/terms), efficaci dal 23 marzo 2026, prevedono che gli API Client accessibili agli utenti SEE/Italia usino solo Paid Services; per Gemini richiedono progetto associato a un account di fatturazione attivo. Non è stata abilitata fatturazione né effettuata chiamata a pagamento, né è stata accertata conformità privacy: il provider non è attivo.

## Rimane da fare

- Creare preview Cloudflare autonoma con worker e routes, testarne dati, ricerca e API, ricontrollare produzione, quindi pubblicare solo se privo di conflitti. Non sostituire la produzione con una build a 338 schede.
- Completare immagini legalmente riutilizzabili per esigenze, articolo e botteghe; non attribuire fotografie illustrative a un esercizio specifico.
- Completare tassonomia e alias di marca, redesign e collaudo di 12 schede, arricchimento documentale, test di performance e rilascio finale. Non sono stati completati in questa sessione.
- Conservare i contenuti incerti del Lotto 5 per revisione successiva; non pubblicare automaticamente Sergio Capone o le altre schede sospese.
