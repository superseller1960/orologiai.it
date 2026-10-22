# DNS di orologiai.it — rilievo e piano di passaggio

Rilievo eseguito in sola lettura (`dig`) il 22 ottobre 2026. **Nessun record è stato modificato.** Il dominio resta sul vecchio hosting WordPress; `scardi.it` non viene toccato.

## 1. Provider DNS autorevole

- **Register.it** — nameserver: `ns1.register.it`, `ns2.register.it`
- SOA: `ns1.register.it hostmaster.register.it 2022121512 10800 3600 604800 86400`

## 2. Record riscontrati

| Record | Valore | Note |
| --- | --- | --- |
| `orologiai.it` A | `81.88.53.48` | Hosting web attuale (vecchio WordPress) |
| `www.orologiai.it` CNAME | `orologiai.it` | |
| `orologiai.it` MX | `10 mail.register.it` | **Posta presso Register.it: preservare ad ogni costo** |
| `orologiai.it` TXT | nessuno | **Nessun SPF riscontrato** |
| `default._domainkey` TXT | assente | Nessun DKIM riscontrato |
| `_dmarc` TXT | assente | Nessun DMARC riscontrato |
| `google._domainkey` TXT | assente | |
| `orologiai.it` DS | nessuno | **DNSSEC non attivo**: il cambio nameserver non richiede rimozione di deleghe firmate (verificato il 22/10/2026) |
| `ftp.orologiai.it` CNAME | `orologiai.it` | Accesso FTP dell'hosting Register.it: oggi segue l'apex |
| `pop.orologiai.it` CNAME | `mail.register.it` | |
| `mail`, `webmail`, `cpanel`, `autodiscover`, `blog`, `shop`, `smtp`, `imap` | nessun record riscontrato | |

Nota: l'assenza di SPF/DKIM/DMARC al DNS non esclude configurazioni lato provider non visibili via DNS; verificare nel pannello Register.it. L'eventuale aggiunta di questi record (consigliata per la deliverability della posta) è una decisione del titolare, da fare separatamente.

## 3. Servizi da preservare in ogni modifica

1. **Email**: MX `10 mail.register.it` e tutto ciò che la posta richiede (eventuali record di autenticazione presenti nel pannello).
2. **FTP/hosting Register.it**: `ftp.orologiai.it` oggi punta all'apex; se l'apex viene spostato su Cloudflare Pages, questo record va reimpostato verso l'hosting Register.it (es. A `81.88.53.48`) per non perdere l'accesso FTP al vecchio spazio.
3. **Sito WordPress attuale**: resta online e intatto fino al passaggio; non disattivarlo.
4. **`scardi.it`**: dominio separato, non coinvolto.

## 4. Configurazione equivalente per Cloudflare Pages (non ancora eseguita)

Per servire `orologiai.it` su Cloudflare Pages il dominio deve diventare una zona Cloudflare: **il passaggio richiede il cambio dei nameserver nel pannello Register.it** (operazione del titolare, non eseguibile da questo ambiente).

Record da creare nella zona Cloudflare **prima** del cambio dei nameserver (pronti da importare):

| Record | Valore | Note |
| --- | --- | --- |
| `orologiai.it` | CNAME `<progetto>.pages.dev` | Cloudflare esegue il flattening sull'apex; oppure A/AAAA indicati dalla dashboard Pages al momento dell'aggiunta del dominio custom |
| `www` CNAME | `<progetto>.pages.dev` | Oppure CNAME `orologiai.it` |
| MX `@` | `10 mail.register.it` | **Invariato** |
| `ftp` A | `81.88.53.48` | Sostituisce l'attuale CNAME all'apex (vedi punto 3.2) |
| `pop` CNAME | `mail.register.it` | Invariato |

Procedura consigliata:
1. Creare il progetto Cloudflare Pages (piano Free) e pubblicare la build (`dist/` + `functions/`).
2. Aggiungere il dominio custom `orologiai.it` e `www.orologiai.it` dalla dashboard Pages.
3. Esportare/verificare la zona attuale nel pannello Register.it (confrontarla con questo documento).
4. Predisporre la zona Cloudflare con i record sopra (posta inclusa).
5. Solo allora cambiare i nameserver su Register.it verso quelli assegnati da Cloudflare.
6. Subito dopo: verificare sito, **posta in entrata/uscita**, FTP e redirect.
7. Monitorare la propagazione (fino a 24–48 ore).

## 5. Procedura di rollback

Se dopo il cambio qualcosa non funziona (sito o, soprattutto, posta):

1. Nel pannello Register.it ripristinare i nameserver originali: `ns1.register.it`, `ns2.register.it`.
2. Verificare che la zona Register.it contenga ancora i record originali (tabella punto 2): se il pannello li ha conservati, il ripristino è immediato alla propagazione.
3. La posta torna a risolvere via `mail.register.it`; testare invio e ricezione.
4. Attesa di propagazione: fino a 24–48 ore; durante la finestra i record potrebbero essere serviti da una delle due configurazioni.

Il rollback è reversibile e non distruttivo: nessun record originale va cancellato prima che il passaggio sia stabile e verificato.

## 6. Vincoli rispettati

- Nessuna modifica DNS eseguita in questa sessione (solo lettura).
- Nessun acquisto, nessun trasferimento di dominio, nessun account aggiuntivo creato.
- La documentazione sopra è la "configurazione DNS equivalente" richiesta prima di qualsiasi cambio.
