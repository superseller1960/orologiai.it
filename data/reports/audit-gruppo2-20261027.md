# Audit retrospettivo — gruppo 2 (13 schede Lotto 7), 27 ottobre 2026

Preview verificata: `18d421d7` (branch `audit-gruppo2-20261027`). Produzione prima: `9249b2ac` (gruppo 1, nessun intervento esterno). Produzione dopo: `1c5dc745` (branch `pubblicazione-gratuita-scardi-20261022`). Verifica su https://www.orologiai.it superata: correzioni presenti, API attive, sitemap 543 URL, homepage 200.

## Errori reali trovati e corretti

| Scheda | Dato precedente | Dato corretto | Fonte |
|---|---|---|---|
| Passerini, Morbegno | «attiva dal 1956» | primo negozio 1954, sede attuale dal 1956 | [chi siamo](https://www.gioielleriapasserini.it/pages/chi-siamo) |
| Federici, Gallarate | origini 1968 (ambiguo) | azienda orafa dal 1968, negozio di Gallarate dal 2012 | [chi siamo](https://www.federicigioielleria.com/chi-siamo/) |
| Volta, Voghera | «sede in Via Emilia dal 2002» | in Via Emilia dal 1978, al civico 53 dal 2002 | [boutique](https://voltavoghera.it/it/boutique/) |

## Autorizzazioni e qualifiche: attribuzioni corrette

- **Volta (assUff Rolex)**, **Bonvicini («laboratorio certificato Rolex e Tudor»)**, **Zanaboni (rivUff Rolex/Tudor)**, **Clivio (rivUff Rolex, Quick Service)**: le pagine rolex.com/tudor.com rispondono **HTTP 403** in questa sessione. Le qualifiche restano nelle rispettive caselle documentate ma le descrizioni ora le attribuiscono alle dichiarazioni dell'attività, con **segnalazione aperta** su ogni scheda. Nessuna nuova autorizzazione attribuita; nessuna rimossa senza prova contraria.
- **Clivio**: aggiunta la fonte istituzionale [Unioncamere — Imprese Storiche](https://www.unioncamere.gov.it/imprese-storiche/gioielleria-clivio-sas-di-clivio-elisabetta-c) per fondazione 1879 e iscrizione al Registro.

## Schede verificate senza correzioni (7)

De Min (Santa Giustina), Panizza (Tirano), Barbazza (Vigevano), Rocca Lab (Cagliari), Verdastro (Roma), Puccinelli (Cecina), F.lli Bracci (Follonica). Hamilton/Tissot/Seiko confermati dalle fonti dei marchi (HTTP 200).

## Anomalie rimaste aperte

1. Volta/Bonvicini/Zanaboni/Clivio: pagine Rolex e Tudor non leggibili (403) — ruoli da ricontrollare con accesso diretto ai locator.
2. Bonvicini: «centro assistenza certificato Rolex» è autodichiarazione.

## Conteggi gruppo 2

- Esaminate: 13. Corrette: 3. Fonti nuove: 1 (Unioncamere). Segnalazioni aperte: 4.
- Test: 225 superati. Test dedicato: `tests/audit-gruppo2-20261027.test.ts`.
