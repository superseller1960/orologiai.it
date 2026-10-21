# PR — Fonde la ricerca guidata di Codex con dati, privacy e semantica degli Incrementi 07-08

**Base:** `incremento-06-assistente-gemini-20261016` · **Head:** `integrazione-codex-20261021`
**Stato:** PR da aprire manualmente (nessun canale autenticato per la creazione automatica); **nessun merge è stato effettuato**.

## Descrizione

Unifica in un'unica versione completa i due rami di lavoro sviluppati in parallelo, senza perdere alcuna funzionalità:

- **Da `incremento-06-assistente-gemini-20261016` (16 commit, ricerca guidata):** ricerca a tre passaggi, servizi rapidi, città digitabili anche non censite, filtri avanzati per territorio/marca/competenze, pannello valutazioni, assistente incorporato in `/cerca/` con precompilazione per città non coperte, mappa con pannello risultati.
- **Dal branch di backup (Incrementi 07-08 + adeguamenti legali):** 62 attività verificate in 29 località e 10 regioni, interprete semantico del campo unico (servizio, marca, CAP, problemi reali dell'orologio), alternative distinte dai risultati esatti con motivi dichiarati, servizi affini, zona suggerita dalla connessione senza GPS (`/api/posizione`, `no-store`), geolocalizzazione opt-in locale, pagine `/privacy/`, `/cookie-policy/`, `/note-legali/` collegate in footer e sitemap.

## Risoluzione dei conflitti (5 file)

| File | Integrazione |
|---|---|
| `site/src/lib/assistant.ts` | Costanti nostre (servizi affini/tecnici, regole ampliate, CAP) + parsing città in minuscolo con filtro `NON_LOCALITA` e fallback di territorio "altri comuni censiti" di Codex |
| `site/src/scripts/search-ui.ts` | `update()` unificato: filtri e città digitabili + interprete semantico, alternative, zona suggerita; handler di entrambe le versioni |
| `site/src/pages/cerca.astro` | Struttura a tre passaggi con servizi rapidi doppiati come scorciatoie, badge zona nello step 02, testo stato vuoto unito |
| `site/src/scripts/assistant-ui.ts` | Etichette alternative: non autorizzate / altre località / pertinenti |
| `tests/assistant.test.ts` | Unione di tutti i test delle due versioni |

## Verifiche

- `npm run verify` superato per intero: typecheck 0 errori · **100/100 test** · build 168 pagine, 62 schede validate · test UI su ricerca (tre passaggi, filtri, reset, servizio rapido, città non censita, precompilazione assistente, mappa, input ostile) e chat.
- Suite UI della ricerca semplificata rieseguita sulla build fusa: campo unico, semantica, scorciatoie, zona suggerita, integrazione dei due flussi (nuovo test di regressione).

## Note

- Le pagine legali contengono dati da completare prima del lancio, marcati `[DA FORNIRE]`/`[DA COMPLETARE]` (titolare del trattamento, LIA, tempi di conservazione, documenti Google Gemini, trasferimenti extra-UE).
- `npm run test:gemini:live` non eseguibile senza `GEMINI_API_KEY`: il percorso AI reale non è dichiarato verificato.
