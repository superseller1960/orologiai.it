# Espansione nazionale 2.0 — Lotto 1 (province monoreddito), 27 ottobre 2026

## Conteggi
| Voce | Prima | Dopo |
|---|---|---|
| Attività | 265 | 279 |
| Località (comuni) | 155 | 166 |
| Fonti | 631 | 684 |

- Candidati esaminati: 18 (più 3 duplicati riconosciuti)
- Candidati esclusi: 1 (Antonio Gioielli, Ascoli Piceno — domini misti e sito a widget illeggibile, nessuna scheda)
- Nuove attività inserite: 14
- Schede preesistenti arricchite: 3 (Casadei Rimini, Cotifava Mantova, Di Liddo Biella)
- Duplicati evitati: 3 (inserite come arricchimenti, non come schede nuove)
- Nuovi comuni: 11 — Chiari (BS), Este (PD), Castiglione delle Stiviere (MN), Cossato (BI), Saluzzo (CN), Cecina (LI), Prato (PO), Rieti (RI), L'Aquila (AQ), Potenza (PZ), Porto Torres (SS), Nuoro (NU) — Dobner Trieste usa Trieste già censita.

## Nuove schede (14) con qualifiche documentarie
1. Oreficeria Fioravanti — Prato (PO): laboratorio proprio, bottega con 70 anni di storia (La Nazione, Tv Prato).
2. Lombardi Orologi — Carrara (MS): orologeria con laboratorio.
3. Gioielleria Ferrari — Piacenza (PC): vendita e riparazione.
4. Dobner — sede di Trieste (TS): seconda sede del gruppo Dobner (gruppoId condiviso con Gorizia, risolta come sede distinta, non duplicato).
5. Roncato Gioielleria — Mirano (VE).
6. Gioielleria San Marco — Rovereto (TN).
7. The Watch Spa — Brescia (BS).
8. Ferro Gioielli 1954 — Este (PD): laboratorio con full overhaul, restauro vintage, lucidatura e prove di impermeabilità; storia dal 1954 (fondatore Nereo Ferro, terza generazione).
9. Mangili Orologi — Lecco (LC): dal 1959, tre generazioni, due sedi dichiarate; compravendita e riparazione.
10. Orologeria Formichetti — Rieti (RI): bottega storica dal 1965 (Enzo Formichetti), sede attuale dal 1973, oggi con il figlio Simone.
11. Orologiando Srl — L'Aquila (AQ): **centro assistenza ufficiale Hamilton** (fonte primaria: locator Hamilton).
12. Gallery Gioielli Srl — Potenza (PZ): **rivenditore ufficiale Longines** (fonte primaria: locator Longines).
13. L'Orologiaio Ascione — Porto Torres (SS): quattro generazioni, laboratorio per orologi da polso e da tasca, meccanici, restauro e pendoleria. Cronologia discordante 1920/1915 registrata, nessun anno unico attribuito.
14. Orologeria Pinna — Nuoro (NU): riparazione e vendita, tradizione familiare dichiarata di quattro generazioni; 50 anni della forma attuale (2022) senza dedurre anno di fondazione.

## Arricchimenti con metodo di qualità applicato
- **Casadei (Rimini)**: +email, +pendoleria/riparazione meccanici/automatici/vendita usati, storia 1972 (Marco Casadei). Assistenza Perseo **dichiarata dall'attività ma assente dall'elenco ufficiale Perseo**: nessuna autorizzazione attribuita.
- **Cotifava (Mantova)**: +pendoleria e orologi da tasca, storia con variante 1946 (radici, sito) / 1974 (registro lombardo attività storiche) registrata; concessionario Perseo e revisioni Rolex/JLC/Cartier/IWC come **dichiarazioni**, non autorizzazioni.
- **Di Liddo (Biella)**: +vendita usati, test impermeabilità, storia «oltre 30 anni, padre-figlio»; il claim «Centro Assistenza Certificato» per 9 marchi è **autodichiarazione non confermata dai produttori**, esclusa dai campi di autorizzazione.

## Verifiche e test
- `npm run build` (validate + astro build + check-build + bundle API): OK
- `npm test`: **230/230 superati**
- `npm run test:ui` (DOM ricerca + assistente): OK
- Duplicati (findDuplicates): 13 segnali, tutti risolti `sedi-distinte` (12 baseline + Dobner Trieste/Gorizia), nessuno `da-revisionare`
- Fixture aggiornata: Prato ora censita → test assistente su città non censita usa Pisa (aggiornamento di un'assunzione di copertura, non di un'asserzione di logica)

## Deployment
- Preview: `dd3b6555` — https://espansione-lotto1-20261027.orologiai-it.pages.dev (verificata: schede, pagina Prato, sitemap 568 URL, API)
- Produzione precedente: `7ac008ac` (invariata al controllo pre-deploy, nessun intervento di altri agenti)
- **Produzione attuale: `e443b24e`** — https://www.orologiai.it (verificata: nuove schede 200, pagina Prato, sitemap 568, API, homepage «279 attività»)

## Backup esportabili (export/)
- `orologiai-sorgente-lotto1-20261027.zip`
- `orologiai-lotto1-directory-20261027.json`
- `orologiai-lotto1-20261027.bundle` (Git locale, commit `3284e02`)
- `orologiai-lotto1-build-sha256-20261027.txt` (hash della build distribuita)
- `orologiai-lotto1-manifest-20261027.sha256`

## Prossimi passi
- Lotto 2: province con 2 attività (42 candidate), con priorità alle regioni meno profonde.
- Completare le verifiche mancanti sulle 7 schede parziali dell'audit quando emergono fonti migliori.
