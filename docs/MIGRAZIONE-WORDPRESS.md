# Migrazione dal vecchio WordPress — piano operativo

Stato: piano preparato per il futuro passaggio di `orologiai.it` su Vercel. **Nessun DNS è stato modificato, il vecchio WordPress resta online e non è stato toccato.**

## Perimetro verificato (sola lettura)

- Il mirror statico del vecchio sito è conservato in `public/` (106 file: 13 pagine HTML + asset `wp-content/`, `wp-includes/`). **Non viene pubblicato**: `astro.config.mjs` imposta `publicDir: './site/assets'`, quindi il build non lo copia in `dist/`.
- Nelle pagine legacy effettivamente pubblicate (`/blog/`, `/rolex/`, archivio `noindex`) l'unico contenuto incassato è il `<main>` dell'articolo storico; i `<link>` al foglio di stile del vecchio tema (`../css/style.css`) vengono rimossi al render perché la risorsa non esiste più.
- Nessun link esterno sospetto risulta nei contenuti legacy pubblicati: l'unico URL assoluto è `https://orologiai.it/blog/` più i recapiti `mailto:`.

## Mapping URL del vecchio sito

### 1. Pagine valide, preservate con lo stesso URL
| Vecchio URL | Nuova destinazione | Nota |
| --- | --- | --- |
| `/` | `/` | Homepage nuova |
| `/blog/` | `/blog/` | Archivio editoriale conservato, `noindex` in attesa di revisione |
| `/rolex/` | `/rolex/` | Archivio editoriale conservato, `noindex` |
| `/firenze/` | `/firenze/` | Alias: canonical punta a `/orologerie/toscana/firenze/firenze/` |
| `/milano/` | `/milano/` | Alias: canonical punta a `/orologerie/lombardia/milano/milano/` |

### 2. Redirect certi — implementati in `vercel.json`
| Vecchio URL | Nuova destinazione | Motivazione |
| --- | --- | --- |
| `/contact`, `/modulo-di-contatto` | `/partecipa/` | Unico canale di contatto del nuovo sito (email di segnalazione) |
| `/termini-e-condizioni` | `/note-legali/` | Condizioni d'uso → note legali |
| `/rivenditori-e-concessionari-rolex-milano` | `/marchi/rolex/` | Pagina dedicata al marchio Rolex nel database aggiornato |

Sono redirect 301 espliciti, uno per URL: nessun redirect generico verso la homepage.

### 3. Pagine obsolete — devono restituire 404 (pagina 404 esplicativa già presente)
| Vecchio URL | Motivo |
| --- | --- |
| `/negozio/`, `/carrello/`, `/mio-account/` | Pagine WooCommerce senza commercio nel nuovo sito |
| `/brand/` | Elenco marchi del vecchio sito: il nuovo sito non ha un indice equivalente, la destinazione non è certa |

### 4. URL spam e asset del vecchio CMS — mai trasferire né reindirizzare
| Pattern | Trattamento |
| --- | --- |
| `/wp-content/*`, `/wp-includes/*` | 404. Sono asset del vecchio CMS (tema OceanWP/WooCommerce), spesso indicizzati o abusati da inject spam: **non** vanno ripubblicati né reindirizzati |
| `/css/*` | 404: fogli del vecchio tema |
| Qualsiasi URL spam rilevato in Google (inject, pagine di spam) | 404/410: **mai** reindirizzare indiscriminatamente |

## Verifiche da fare in Google Search Console (al momento del passaggio)

Il passaggio **mantiene il dominio `orologiai.it`**: cambia solo la piattaforma che serve il sito (da WordPress a Vercel). Lo strumento "Cambio di indirizzo" di Search Console è riservato ai cambi di dominio e **non va usato** in questa migrazione. Questo ambiente non ha accesso al vecchio sito in scrittura né a Search Console: i seguenti passi sono per chi gestisce la proprietà.

1. **Conservare la proprietà Search Console esistente** su `orologiai.it`: non crearne una nuova, non rimuoverla. La storia dell'indicizzazione resta collegata allo stesso dominio.
2. **Verificare la nuova sitemap** (`https://orologiai.it/sitemap.xml`) nella proprietà esistente e controllarne l'elaborazione.
3. **Redirect permanenti (301) per gli URL effettivamente modificati**: sono quelli del mapping sopra, già implementati in `vercel.json`. Gli URL invariati (`/`, `/blog/`, `/rolex/`, `/firenze/`, `/milano/`) non ricevono redirect.
4. **Controllo dei canonical**: ogni pagina deve canonizzare a se stessa tranne gli alias `/firenze/` e `/milano/`, che puntano alle pagine comune; verificare sul dominio reale dopo il passaggio.
5. **Verifica dell'indicizzazione**: confrontare le URL indicizzate prima e dopo (Copertura / Pagine). Esportare l'elenco delle URL storiche e confrontarlo con il mapping: le URL non elencate qui **non** vanno reindirizzate d'ufficio.
6. **Monitoraggio dei 404**: segnalare i 404 importanti (pagine con link o traffico) e aggiungere redirect **caso per caso** solo con destinazione certa.
7. **Controllo degli URL spam precedentemente indicizzati**: individuarli nell'elenco storico e richiederne la rimozione (Rimozioni + pulizia), **senza creare redirect**: devono restituire 404/410.
8. **Verifica che il cambio DNS non comprometta i servizi email**: prima di modificare qualsiasi record, controllare i record MX, TXT (SPF/DKIM/DMARC) e CNAME di posta attuali e assicurarsi che restino invariati quando il DNS inizia a puntare a Vercel. Se la posta passa per un proxy o un servizio che dipende dall'hosting WordPress, va migrata separatamente e prima del cambio DNS.

## Sequenza operativa al momento del lancio

1. Completare le voci di `docs/PRONTO-AL-LANCIO.md`.
2. Verificare i record email (MX/SPF/DKIM) e decidere dove resterà la posta.
3. Configurare il dominio su Vercel (Production) e aggiornare i DNS **senza toccare i record di posta** — da fare nel pannello, non da questo repository.
4. Verificare redirect, sitemap, robots e canonical sul dominio reale.
5. Verificare la sitemap in Search Console (stessa proprietà), avviare il monitoraggio di indicizzazione, 404 e URL spam.

## Vincoli rispettati

- Nessuna modifica al vecchio WordPress, ai DNS o alla posta.
- Nessun contenuto spam importato o reindirizzato.
- Nessun redirect generico verso la homepage.
- I redirect implementati sono 8 voci esplicite con destinazione documentata.
