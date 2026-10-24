# Rilascio della revisione UX sul progetto esistente

Procedura di rilascio della revisione UX + Workers AI sul progetto Cloudflare Pages esistente
`orologiai-it`. Il documento accompagna istruzioni riproducibili e una build pronta, non un
deployment eseguito.
Non incollare token in chat, codice, log o documenti. Nessun token è incluso qui.

> Nota di integrazione 24/10/2026: l'allegato originale (documento JSON del 24/10) è stato
> troncato a 1.000.000 di caratteri dallo strumento di lettura e la sezione centrale di questo
> file non è stata recuperata verbatim; il contenuto qui sotto ricostruisce la procedura dai
> fatti documentati della revisione allegata (deployment Wrangler da `.runtime/pages-build`,
> progetto `orologiai-it`, anteprima prima di produzione). Lo stato reale della consegna è in
> `docs/INTEGRAZIONE-CODEX-20261024.md`.

## Principi

1. Un solo progetto Cloudflare Pages: `orologiai-it`. Nessun secondo progetto, nessun fork di hosting.
2. Stessa build validata per anteprima e produzione: `.runtime/pages-build` (Astro + `_worker.js`
   con entrambe le API + `_routes.json`), generato da `npm run package:pages`, con manifest SHA-256.
3. L'anteprima precede sempre la produzione; il dominio si verifica solo dopo il deployment.
4. Nessun segreto nel repository: `GEMINI_API_KEY` non serve (Gemini disattivato); Workers AI usa
   il binding `AI` della piattaforma.

## Procedura

```bash
npm ci
npm run verify                    # typecheck, build, test, test DOM
npm run package:pages             # .runtime/pages-build + manifest
npx wrangler@4 pages dev .runtime/pages-build   # collaudo locale (API + pagine reali)

# anteprima sul progetto esistente
npx wrangler@4 pages deploy .runtime/pages-build --project-name orologiai-it --branch preview
# collaudo dell'anteprima: pagine, /api/posizione, /api/orologiaio (405/200/403/415), fallback
# produzione: stessa build, identica
npx wrangler@4 pages deploy .runtime/pages-build --project-name orologiai-it --branch main
```

Dopo il deployment: verificare `https://www.orologiai.it` (HTTPS, HTML), il redirect 301 da
`https://orologiai.it`, i deep link con query, l'assenza di loop di redirect e ripetere il
collaudo API sull'origine reale. Se si attiva Workers AI (binding `AI` + `AI_PROVIDER=cloudflare`),
verificare anche la modalità `ai` e il ritorno a `fallback` a quota esaurita.
