# Orologiai.it — Fase 16C, homepage editoriale

## Consegna

- SORGENTI contiene il progetto Astro completo della Fase 16B con modifiche applicate da ChatGPT.
- DEPLOY contiene il pacchetto Pages **completo**, incluse Functions e routing. Per il rilascio immediato usare i file inclusi, non eseguire una nuova build prima del controllo della preview.
- Il Lotto 5 (15 candidate sospese, di cui una in revisione) resta nel precedente archivio SOSPESI, separato dal catalogo.
- Nessuna modifica è stata pubblicata su Cloudflare in questa sessione.

## Modifiche 16C

- Nuova immagine editoriale del movimento meccanico, **generata digitalmente**, senza raffigurare una bottega o un orologio realmente identificato; indicata chiaramente come illustrazione.
- Primo schermo su mobile e desktop riprogettato (hero, città, servizio facoltativo, CTA primaria).
- Tre ritratti tipografici per le attività in evidenza, con anni già presenti nei dati: nessuna fotografia attribuita impropriamente.
- Quattro percorsi visivi distinti; cinque indirizzi secondari visualizzati con card compatte, scroll orizzontale limitato alla sezione su mobile.
- Footer con linguaggio editoriale, senza l'etichetta commerciale di progetto incompleto.
- Selezione editoriale e schema di posizioni sponsorizzate della 16B invariati; sponsorizzazioni disattive.
- Ricerca, business dataset, API, Worker e Pages routing **immutati**.

## File sorgente modificati

- `site/src/pages/index.astro`
- `site/src/layouts/Layout.astro`
- `site/public/home-upgrade.css` (nuovo)
- `site/public/images/editorial-movement-ai.webp` (nuovo)

L'override CSS è caricato soltanto per `/`.

## Pacchetto di produzione

- `.runtime/pages-build/` include tutti gli asset statici, `_worker.js`, `_routes.json` e gli URL canonici.
- `.runtime/pages-build-sha256.json` è stato rigenerato dopo le sole modifiche statiche della homepage.
- Il bundle del Worker e le regole di routing sono byte-identici al pacchetto 16B fornito dall'utente.
- La homepage statica è stata aggiornata a parità di contenuti dal progetto Astro; fino a quando non è possibile installare tutte le dipendenze Astro non possiamo certificare una ricompilazione completa da sorgenti.

## Verifiche eseguite

- Screenshot reali Chromium da HTML statico con risorse locali incorporabili a 360, 390, 768, 1024 e 1440 px.
- Nessun overflow orizzontale alle cinque larghezze.
- Menu mobile (`<details>`) apertura verificata.
- 3 botteghe in evidenza, 5 altre botteghe, 4 percorsi con link esistenti.
- Tutte le immagini visibili caricate correttamente; link alle 8 schede presenti nel pacchetto.
- Catalogo invariato: 324 attività, 196 località, 790 fonti.
- Worker + routing immutati (confronto byte per byte).

### Limiti dei test

- La rete npm del container è indisponibile e Node di sistema (22.16.0) non soddisfa il vincolo del progetto (>=22.22.0): **non è stato eseguito `npm run verify` né una nuova build Astro**. Le verifiche visive e strutturali sono state eseguite sul pacchetto aggiornato.
- Non è stata caricata una preview Cloudflare; le chiamate AI su dominio pubblico e il routing di Pages devono essere collaudati sulla preview prima di qualsiasi promozione.
- Non è stato eseguito un audit completo WCAG o Lighthouse.

## Preview sicura con Wrangler (Windows)

1. Estrarre lo ZIP DEPLOY preservando la cartella `.runtime/pages-build`.
2. Verificare il manifest e che Wrangler mostri l'account Cloudflare giusto.
3. Pubblicare solo una preview:

```powershell
npx.cmd --yes wrangler@4 whoami
npx.cmd --yes wrangler@4 pages deploy .runtime/pages-build --project-name=orologiai-it --branch=fase16c-preview-20261031
```

4. Aprire URL univoco della preview, controllare homepage a 390/1440 px, ricerca Torino, schede, `/api/posizione`, `/api/orologiaio` e risposta `modalita: ai`, sitemap e canonical.
5. Riconfermare il deployment di produzione prima di qualunque pubblicazione.
6. Solo se soddisfatti tutti i controlli, **riusare lo stesso pacchetto** con `--branch=pubblicazione-gratuita-scardi-20261022`.

Non attivare costi, non modificare altri progetti, DNS, email o GitHub, non pubblicare le 15 candidate sospese.
