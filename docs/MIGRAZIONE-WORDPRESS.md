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

## Verifiche da fare in Google Search Console (al momento del cambio dominio)

Questo ambiente non ha accesso al vecchio sito in scrittura né a Search Console: i seguenti passi sono per chi gestisce la proprietà.

1. Esportare l'elenco delle URL indicizzate del vecchio sito (Copertura / Pagine) e confrontarlo con il mapping sopra: le URL non elencate qui **non** vanno reindirizzate d'ufficio.
2. Individuare gli URL spam risultanti dall'inject e richiederne la rimozione (Rimozioni + pulizia del CMS), senza creare redirect.
3. Aggiungere la proprietà del nuovo dominio e inviare la nuova sitemap (`/sitemap.xml`).
4. Usare "Cambio di indirizzo" solo dopo il passaggio effettivo del dominio.
5. Monitorare i 404 importanti (pagine con link o traffico) e aggiungere redirect **caso per caso** solo con destinazione certa.

## Sequenza operativa al momento del lancio

1. Completare le voci di `docs/PRONTO-AL-LANCIO.md`.
2. Configurare il dominio su Vercel (Production) — da fare nel pannello, non da questo repository.
3. Verificare redirect, sitemap, robots e canonical sul dominio reale.
4. Pubblicare la sitemap in Search Console e avviare il monitoraggio.

## Vincoli rispettati

- Nessuna modifica al vecchio WordPress, ai DNS o alla posta.
- Nessun contenuto spam importato o reindirizzato.
- Nessun redirect generico verso la homepage.
- I redirect implementati sono 8 voci esplicite con destinazione documentata.
