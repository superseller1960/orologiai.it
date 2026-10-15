# Orologiai.it — repository di importazione

Questa repository conterrà una copia statica del sito https://orologiai.it per permettere modifiche via Git (es. da Freebuff) e deployment su Vercel.

Cosa fa questo repository ora:
- aggiunge uno script/Workflow GitHub Actions che può scaricare (mirror) il sito pubblico e committarlo nella repo (workflow manuale - "Import site").
- contiene un .gitignore consigliato.

Istruzioni rapide:
1. Vai su Actions → Import site → Run workflow per avviare l'importazione statica (workflow_dispatch).
2. Il workflow creerà una cartella `public/` con i file statici e li committerà nel branch principale (main).
3. Controlla i file importati nella repo (cartella `public/`). Se vuoi pubblicare su Vercel, connetti questa repo a Vercel e imposta la directory di output su `public/` (o sposta i file in root se preferisci).

Avvertenze:
- Questa è una copia statica: tutte le parti dinamiche (login, carrelli, commenti, form che inviano dati al server, ricerca dinamica) non funzioneranno più a meno di sostituirle con soluzioni esterne.
- Non caricare mai credenziali o il dump del database in questa repo.

Se preferisci che importi io direttamente i file (caricando lo zip che hai), carica lo zip qui o condividi un link al backup e lo committerò io.
