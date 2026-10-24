// Fusione PR #6 nel dataset: recupero dei 4 inserimenti Ancona/Pescara e dei 6 arricchimenti
// pubblicati nel deployment preview 9deeca12 (commit 50170df "Enrich six listings and add four
// verified Ancona/Pescara businesses") del progetto Cloudflare Pages orologiai-it.
//
// Perché questo script: la versione PR #6 non è raggiungibile via GitHub (canale autenticato
// negato, HTTP 403) e i suoi commit non esistono nel repository locale; il deployment preview
// pubblico è l'unica fonte in scope. Le 10 schede sono state estratte dai documenti HTML
// pubblicati (dati, fonti con URL e date di consultazione, cronologia, orari, storia) e salvate
// in data/staging/pr6-arricchimento-20261024/estrazioni.json.
//
// Cosa fa:
//  1. i 4 inserimenti NUOVI passano dalla pipeline ufficiale integrateReviewedBatch
//     (validazione schema, fonti primarie, duplicati, conservazione integrale del preesistente);
//  2. i 6 ARRICCHIMENTI su schede esistenti passano come delta campo-per-campo conservativi:
//     si aggiunge e si sostituisce solo ciò che la fonte pubblicata documenta, non si elimina
//     mai nulla; ogni conflitto non risolvibile conserva il dato esistente e viene registrato.
// Ogni modifica finisce nel registro: data/reports/pr6-arricchimenti-20261024-applied.json.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  businessSchema, directorySchema, services,
  type Business, type Directory,
} from '../site/src/lib/schema.ts';
import { integrateReviewedBatch } from '../site/src/lib/reviewed-import.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';

type Claim = { nome: string; fonti_url: string[] };
type Estrazione = {
  slug: string; nome: string; descrizione: string; tipi: string[];
  indirizzo: string | null; cap: string | null; citta: string | null; provincia_sigla: string | null; regione: string | null;
  telefono: string | null; email: string | null; sito: string | null;
  servizi_claims: Claim[]; altri_servizi: string[]; marchi: Record<string, Claim[]>;
  fonti: { url: string; titolo: string; consultataIl: string; percorsoArchivio: string | null }[];
  raccoltaIl: string; verificataIl: string | null; confermataTitolareIl: string | null; stato_label: string | null;
  cronologia: { data: string; azione: string }[];
  storia_testo: string | null; annoFondazione: number | null; fondatore: string | null;
  storia_eventi: { data: string; descrizione: string; fonte_url: string | null }[];
  orari_giorni: { giorno: number; intervalli: { apertura: string; chiusura: string }[] }[];
  orari_variazioni: string[]; orari_verificatiIl: string | null;
};

const PERCORSO = 'site/data/directory.json';
const STAGING = 'data/staging/pr6-arricchimento-20261024/estrazioni.json';
const LOTTO = 'pr6-ancona-pescara-20261024';
const DATA_LOTTO = '2026-10-24';
const NUOVI = ['cerescioli-paolo-ancona', 'gibi-shop-ancona', 'satolli-pescara', 'wargas-sisti-ancona'];
const ARRICCHITI = ['bigalli', 'fani-gioielli', 'marretti', 'sangalli', 'scardi', 'senzatempo-firenze'];

// Etichetta servizio → id: solo corrispondenze esatte con il catalogo, nessuna invenzione.
const SERVIZIO_ID = new Map<string, keyof typeof services>(
  Object.entries(services).map(([id, etichetta]) => [etichetta, id as keyof typeof services]),
);
const RUOLO_MARCHIO: Record<string, keyof Business['marchi']> = {
  'Marchi venduti': 'venduti',
  'Marchi riparati': 'riparati',
  'Esperienza dichiarata': 'esperienza',
  'Assistenza ufficialmente autorizzata': 'assistenzaUfficiale',
  'Rivendita ufficialmente autorizzata': 'rivenditaUfficiale',
  'Marchi citati nelle fonti storiche': 'menzionati',
  // L'estrazione conserva anche i codici interni: entrambe le forme sono accettate.
  venduti: 'venduti', riparati: 'riparati', esperienza: 'esperienza',
  assistenzaUfficiale: 'assistenzaUfficiale', rivenditaUfficiale: 'rivenditaUfficiale', menzionati: 'menzionati',
};
const TIPO_STATO: Record<string, Business['attendibilita']['stato']> = {
  'Verificata tramite fonti': 'fonti-verificate',
  'Confermata dal titolare': 'confermata-titolare',
  'Da verificare': 'da-verificare',
};

// Tipo delle fonti nuove: solo URL già pubblicati nelle schede estratte.
const tipoFonte = (url: string): 'sito-ufficiale' | 'marchio-ufficiale' | 'directory' | 'osm' | 'mirror-storico' => {
  if (/^https:\/\/orologiai\.it\//.test(url)) return 'mirror-storico';
  if (/(rolex|longines|salvini|hamiltonwatch)\.com\//.test(url)) return 'marchio-ufficiale';
  if (/unioncamere\.gov\.it\//.test(url)) return 'directory';
  if (/openstreetmap\.org\//.test(url)) return 'osm';
  return 'sito-ufficiale';
};

type FonteNuova = {
  id: string;
  tipo: 'mirror-storico' | 'sito-ufficiale' | 'marchio-ufficiale' | 'osm' | 'stampa' | 'directory' | 'titolare';
  url: string; titolo: string; consultataIl: string; percorsoArchivio: string | null; licenza: null; evidenza: string;
};

// ID deterministici per le fonti nuove: pr6-<slug>-<n>. Una fonte esistente con lo stesso URL
// e la stessa data di consultazione viene riusata; URL identici con date diverse restano fonti
// distinte, come nella versione PR #6 (es. "riconferma delle fonti" il giorno dopo).
function registroFonti(prima: Directory) {
  const esistenti = new Map(prima.fonti.map(f => [`${f.url}|${f.consultataIl}`, f.id]));
  const nuove: FonteNuova[] = [];
  const create = new Map<string, string>();
  return {
    id(url: string, titolo: string, consultataIl: string, percorsoArchivio: string | null, slug: string) {
      const chiave = `${url}|${consultataIl}`;
      const nota = esistenti.get(chiave) ?? create.get(chiave);
      if (nota) return nota;
      const id = `pr6-${slug}-${nuove.filter(f => f.id.startsWith(`pr6-${slug}-`)).length + 1}`;
      nuove.push({
        id, tipo: tipoFonte(url), url, titolo, consultataIl,
        percorsoArchivio: percorsoArchivio ?? null, licenza: null,
        evidenza: 'Fonte pubblica consultata nelle schede PR #6 recuperate dal deployment 9deeca12.',
      });
      create.set(chiave, id);
      return id;
    },
    nuove,
  };
}
type RegistroFonti = ReturnType<typeof registroFonti>;

const idServizio = (etichetta: string, contesto: string) => {
  const id = SERVIZIO_ID.get(etichetta);
  if (!id) throw new Error(`${contesto}: etichetta servizio fuori catalogo: ${etichetta}`);
  return id;
};

function costruisciAttivita(e: Estrazione, fonti: RegistroFonti) {
  const refDi = (urls: string[], titolo: string) => [...new Set(urls.map(u =>
    fonti.id(u, titolo, e.fonti.find(x => x.url === u)?.consultataIl ?? DATA_LOTTO, e.fonti.find(x => x.url === u)?.percorsoArchivio ?? null, e.slug)))];
  const principali = refDi(e.fonti.slice(0, 1).map(x => x.url), e.fonti[0].titolo);
  const fontiSito = e.fonti.map(x => fonti.id(x.url, x.titolo, x.consultataIl, x.percorsoArchivio, e.slug));
  const marchi = { venduti: [], riparati: [], esperienza: [], assistenzaUfficiale: [], rivenditaUfficiale: [], menzionati: [] } as Business['marchi'];
  for (const [ruolo, claims] of Object.entries(e.marchi)) {
    const chiave = RUOLO_MARCHIO[ruolo];
    if (!chiave) throw new Error(`${e.slug}: ruolo marchio sconosciuto: ${ruolo}`);
    marchi[chiave] = claims.map(c => ({ marca: c.nome, fonti: refDi(c.fonti_url, c.nome) }));
  }
  return businessSchema.parse({
    id: e.slug,
    slug: e.slug,
    nome: e.nome,
    tipi: e.tipi,
    descrizione: e.descrizione,
    nomiPrecedenti: [],
    gruppoId: null,
    localitaId: (e.citta ?? '').toLowerCase() === 'pescara' ? 'pescara' : 'ancona',
    posizione: { indirizzo: e.indirizzo, cap: e.cap, coordinate: null, fonti: e.indirizzo ? principali : [] },
    contatti: {
      telefono: e.telefono, email: e.email, sito: e.sito, whatsapp: null, social: [],
      fonti: (e.telefono || e.email || e.sito) ? principali : [],
    },
    orari: e.orari_giorni.length
      ? { giorni: e.orari_giorni, chiusure: e.orari_variazioni, verificatiIl: e.orari_verificatiIl, fonti: principali }
      : { giorni: [], chiusure: [], verificatiIl: null, fonti: [] },
    servizi: e.servizi_claims.map(c => ({ id: idServizio(c.nome, `${e.slug}: servizi`), fonti: refDi(c.fonti_url, c.nome) })),
    altriServizi: e.altri_servizi.map(nome => ({ nome, fonti: principali })),
    specializzazioni: [],
    marchi,
    storia: {
      annoFondazione: e.annoFondazione,
      fondatore: e.fondatore,
      testo: e.storia_testo,
      eventi: e.storia_eventi.map(ev => ({
        data: ev.data,
        descrizione: ev.descrizione,
        fonti: ev.fonte_url ? refDi([ev.fonte_url], ev.descrizione) : principali,
      })),
      fonti: (e.storia_testo || e.annoFondazione || e.fondatore || e.storia_eventi.length) ? fontiSito : [],
    },
    attendibilita: {
      stato: TIPO_STATO[e.stato_label ?? ''] ?? (() => { throw new Error(`${e.slug}: stato non riconosciuto: ${e.stato_label}`); })(),
      raccoltaIl: e.raccoltaIl,
      verificataIl: e.verificataIl,
      confermataTitolareIl: e.confermataTitolareIl,
      fonti: fontiSito,
      cronologia: e.cronologia.map(ev => ({ data: ev.data, azione: ev.azione, fonti: fontiSito })),
      segnalazioni: [],
    },
    origine: { sistema: 'recupero-arricchimento-20261024', idOriginale: e.slug },
  }) as Business;
}

type Delta = { campo: string; azione: 'aggiunto' | 'sostituito' | 'conservato-conflitto'; prima: unknown; dopo: unknown };

// Delta conservativi per le 6 schede arricchite: si aggiunge e si sostituisce solo ciò che la
// fonte pubblicata documenta; i valori già presenti non vengono mai eliminati e i conflitti
// restano come prima, annotati nel registro.
function arricchisci(b: Business, e: Estrazione, fonti: RegistroFonti): Delta[] {
  const delta: Delta[] = [];
  const nota = (campo: string, azione: Delta['azione'], prima: unknown, dopo: unknown) => delta.push({ campo, azione, prima, dopo });
  const refDi = (urls: string[]) => [...new Set(urls.map(u =>
    fonti.id(u, u, e.fonti.find(x => x.url === u)?.consultataIl ?? DATA_LOTTO, e.fonti.find(x => x.url === u)?.percorsoArchivio ?? null, b.slug)))];
  const fontiPubblicate = refDi(e.fonti.map(x => x.url));

  if (e.descrizione && e.descrizione !== b.descrizione) {
    nota('descrizione', 'sostituito', b.descrizione, e.descrizione);
    b.descrizione = e.descrizione;
  }
  for (const [campo, valore] of [['telefono', e.telefono], ['email', e.email], ['sito', e.sito]] as const) {
    const attuale = b.contatti[campo];
    if (!valore || valore === attuale) continue;
    if (attuale) { nota(`contatti.${campo}`, 'conservato-conflitto', attuale, valore); continue; }
    b.contatti[campo] = valore;
    nota(`contatti.${campo}`, 'aggiunto', attuale, valore);
    b.contatti.fonti = [...new Set([...b.contatti.fonti, ...fontiPubblicate])];
  }

  const servizi = new Map(b.servizi.map(s => [s.id, s]));
  for (const c of e.servizi_claims) {
    const id = idServizio(c.nome, `${b.slug}: servizi`);
    const refs = refDi(c.fonti_url);
    const esistente = servizi.get(id);
    if (!esistente) {
      servizi.set(id, { id, fonti: refs });
      nota(`servizi.${id}`, 'aggiunto', null, refs);
      continue;
    }
    const prima = [...esistente.fonti];
    esistente.fonti = [...new Set([...esistente.fonti, ...refs])];
    if (prima.length !== esistente.fonti.length) nota(`servizi.${id}.fonti`, 'aggiunto', prima, esistente.fonti);
  }
  b.servizi = [...servizi.values()];

  for (const nome of e.altri_servizi) {
    if (b.altriServizi.some(a => a.nome === nome)) continue;
    b.altriServizi.push({ nome, fonti: fontiPubblicate });
    nota('altriServizi', 'aggiunto', null, nome);
  }

  for (const [ruolo, claims] of Object.entries(e.marchi)) {
    const chiave = RUOLO_MARCHIO[ruolo];
    if (!chiave) throw new Error(`${b.slug}: ruolo marchio sconosciuto: ${ruolo}`);
    for (const c of claims) {
      const refs = refDi(c.fonti_url);
      const esistente = b.marchi[chiave].find(m => m.marca === c.nome);
      if (!esistente) {
        b.marchi[chiave].push({ marca: c.nome, fonti: refs });
        nota(`marchi.${chiave}.${c.nome}`, 'aggiunto', null, refs);
        continue;
      }
      const prima = [...esistente.fonti];
      esistente.fonti = [...new Set([...esistente.fonti, ...refs])];
      if (prima.length !== esistente.fonti.length) nota(`marchi.${chiave}.${c.nome}.fonti`, 'aggiunto', prima, esistente.fonti);
    }
  }

  if (e.storia_testo && e.storia_testo !== b.storia.testo) {
    if (b.storia.testo === null) {
      b.storia.testo = e.storia_testo;
      nota('storia.testo', 'aggiunto', null, e.storia_testo);
    } else {
      nota('storia.testo', 'conservato-conflitto', b.storia.testo, e.storia_testo);
    }
  }
  if (e.annoFondazione && e.annoFondazione !== b.storia.annoFondazione) {
    if (b.storia.annoFondazione === null) {
      b.storia.annoFondazione = e.annoFondazione;
      nota('storia.annoFondazione', 'aggiunto', null, e.annoFondazione);
    } else {
      nota('storia.annoFondazione', 'conservato-conflitto', b.storia.annoFondazione, e.annoFondazione);
    }
  }
  if (e.fondatore && e.fondatore !== b.storia.fondatore) {
    if (b.storia.fondatore === null) {
      b.storia.fondatore = e.fondatore;
      nota('storia.fondatore', 'aggiunto', null, e.fondatore);
    } else {
      nota('storia.fondatore', 'conservato-conflitto', b.storia.fondatore, e.fondatore);
    }
  }
  for (const ev of e.storia_eventi) {
    if (b.storia.eventi.some(x => x.data === ev.data && x.descrizione === ev.descrizione)) continue;
    b.storia.eventi.push({
      data: ev.data,
      descrizione: ev.descrizione,
      fonti: ev.fonte_url ? refDi([ev.fonte_url]) : fontiPubblicate.slice(0, 1),
    });
    nota('storia.eventi', 'aggiunto', null, `${ev.data} — ${ev.descrizione}`);
  }
  if (b.storia.testo || b.storia.annoFondazione || b.storia.fondatore || b.storia.eventi.length) {
    b.storia.fonti = [...new Set([...b.storia.fonti, ...fontiPubblicate])];
  }

  if (e.orari_giorni.length && b.orari.giorni.length === 0) {
    b.orari = {
      giorni: e.orari_giorni,
      chiusure: e.orari_variazioni,
      verificatiIl: e.orari_verificatiIl,
      fonti: fontiPubblicate,
    };
    nota('orari', 'aggiunto', null, `${e.orari_giorni.length} giorni, verificati il ${e.orari_verificatiIl}`);
  } else if (e.orari_giorni.length) {
    nota('orari', 'conservato-conflitto', `${b.orari.giorni.length} giorni esistenti`, `${e.orari_giorni.length} giorni pubblicati`);
  }

  const statoNuovo = TIPO_STATO[e.stato_label ?? ''] ?? null;
  if (statoNuovo && statoNuovo !== b.attendibilita.stato && b.attendibilita.stato === 'da-verificare') {
    b.attendibilita.stato = statoNuovo;
    nota('attendibilita.stato', 'sostituito', 'da-verificare', statoNuovo);
  }
  if (e.verificataIl && e.verificataIl !== b.attendibilita.verificataIl) {
    const era = b.attendibilita.verificataIl;
    if (era === null || e.verificataIl > era) {
      b.attendibilita.verificataIl = e.verificataIl;
      nota('attendibilita.verificataIl', era === null ? 'aggiunto' : 'sostituito', era, e.verificataIl);
    }
  }
  for (const ev of e.cronologia) {
    if (b.attendibilita.cronologia.some(x => x.data === ev.data && x.azione === ev.azione)) continue;
    b.attendibilita.cronologia.push({ data: ev.data, azione: ev.azione, fonti: fontiPubblicate });
    nota('attendibilita.cronologia', 'aggiunto', null, `${ev.data} — ${ev.azione}`);
  }
  b.attendibilita.fonti = [...new Set([...b.attendibilita.fonti, ...fontiPubblicate])];
  return delta;
}

// Codice ISTAT del comune dalla matrice ufficiale già scaricata (data/reports/national02-...):
// se non è ricavabile senza dubbi resta null, mai un codice inventato.
function codiceIstatComune(matrice: Record<string, unknown>, comune: string): string | null {
  const comuni = matrice.comuni as Record<string, unknown> | unknown[] | undefined;
  let voce: unknown = Array.isArray(comuni) ? undefined : comuni?.[comune];
  if (!voce && comuni) {
    voce = (Array.isArray(comuni) ? comuni : Object.values(comuni)).find((v) => {
      if (!v || typeof v !== 'object') return false;
      const c = v as Record<string, unknown>;
      return [c.comune, c.denominazione, c.denominazione_ita, c.nome]
        .some(x => typeof x === 'string' && x.toLowerCase() === comune.toLowerCase());
    });
  }
  if (!voce || typeof voce !== 'object') return null;
  for (const chiave of ['codiceIstat', 'codice', 'codice_istat', 'codiceCatastale']) {
    const valore = (voce as Record<string, unknown>)[chiave];
    if (typeof valore === 'string' && /^\d{6}$/.test(valore)) return valore;
  }
  return null;
}

async function main() {
  const originale = await readFile(PERCORSO, 'utf8');
  const prima = directorySchema.parse(JSON.parse(originale)) as Directory;
  const estrazioni = JSON.parse(await readFile(STAGING, 'utf8')) as Record<string, Estrazione>;
  const fonti = registroFonti(prima);

  // --- 1. I 4 inserimenti nuovi passano dalla pipeline ufficiale di revisione ---
  const attivitaNuove = NUOVI.map(slug => {
    const e = estrazioni[slug];
    if (!e) throw new Error(`Estrazione mancante: ${slug}`);
    return { e, attivita: costruisciAttivita(e, fonti) };
  });
  const matrice = JSON.parse(await readFile('data/reports/national02-province-matrix-20261023.json', 'utf8')) as Record<string, unknown>;
  const fonteSatolli = fonti.id(
    estrazioni['satolli-pescara'].fonti[0].url,
    estrazioni['satolli-pescara'].fonti[0].titolo,
    estrazioni['satolli-pescara'].fonti[0].consultataIl,
    estrazioni['satolli-pescara'].fonti[0].percorsoArchivio,
    'satolli-pescara',
  );
  const batch = {
    lotto: LOTTO,
    data: DATA_LOTTO,
    fonti: fonti.nuove,
    localita: [{
      id: 'pescara', comune: 'Pescara', comuneSlug: 'pescara',
      provincia: 'Pescara', provinciaSlug: 'pescara', siglaProvincia: 'PE',
      regione: 'Abruzzo', regioneSlug: 'abruzzo',
      codiceIstat: codiceIstatComune(matrice, 'Pescara'),
      descrizione: 'Pescara: attività censite con servizi documentati e fonti consultabili.',
      fonti: [fonteSatolli],
    }],
    candidati: attivitaNuove.map(({ e, attivita }) => ({
      id: e.slug,
      nome: e.nome,
      decisione: 'approvata' as const,
      motivo: `Inserimento PR #6 recuperato dal deployment preview 9deeca12 (commit 50170df) e ricontrollato sulle fonti pubbliche consultate il ${e.fonti[0].consultataIl}; nessun dato dedotto.`,
      fonti: attivita.attendibilita.fonti,
      attivita,
    })),
  };
  const percorsoBatch = `data/import/${LOTTO}-reviewed.json`;
  await mkdir('data/import', { recursive: true });
  await writeFile(percorsoBatch, `${JSON.stringify(batch, null, 2)}\n`);
  const risultato = integrateReviewedBatch(prima, batch);

  // --- 2. I 6 arricchimenti come delta conservativi sulle schede esistenti ---
  let directory = risultato.directory;
  const registro: { id: string; slug: string; delta: Delta[] }[] = [];
  for (const slug of ARRICCHITI) {
    const e = estrazioni[slug];
    if (!e) throw new Error(`Estrazione mancante: ${slug}`);
    const indice = directory.attivita.findIndex(x => x.slug === slug);
    if (indice < 0) throw new Error(`Scheda da arricchire assente: ${slug}`);
    const aggiornata = structuredClone(directory.attivita[indice]);
    const delta = arricchisci(aggiornata, e, fonti);
    directory.attivita[indice] = businessSchema.parse(aggiornata) as Business;
    registro.push({ id: directory.attivita[indice].id, slug, delta });
  }

  // Fonti nuove richieste anche dagli arricchimenti, dopo la pipeline: solo quelle non già
  // entrate con il lotto (la pipeline ha già inserito le fonti dei 4 inserimenti).
  const giaPresenti = new Set(directory.fonti.map(f => f.id));
  directory.fonti = [...directory.fonti, ...fonti.nuove
    .filter(f => !giaPresenti.has(f.id))
    .map(({ evidenza: _evidenza, ...f }) => f)];

  // --- 3. Validazione integrale, registro e scrittura atomica ---
  const finale = directorySchema.parse(directory) as Directory;
  const duplicati = findDuplicates(finale);
  const conteggi = {
    attivita: finale.attivita.length,
    localita: finale.localita.length,
    fonti: finale.fonti.length,
    province: new Set(finale.localita.map(l => l.provinciaSlug)).size,
    regioni: new Set(finale.localita.map(l => l.regioneSlug)).size,
    comuni: new Set(finale.localita.map(l => l.comuneSlug)).size,
  };
  const contenuto = `${JSON.stringify(finale, null, 2)}\n`;
  await mkdir('data/reports', { recursive: true });
  await writeFile(`data/reports/${LOTTO}-applied.json`, `${JSON.stringify({
    ...risultato.report,
    applicato: true,
    inputSha256: createHash('sha256').update(JSON.stringify(batch)).digest('hex'),
    origine: 'Deployment preview 9deeca12 (commit 50170df) del progetto Cloudflare Pages orologiai-it; estrazione documentata in data/staging/pr6-arricchimento-20261024/estrazioni.json.',
  }, null, 2)}\n`);
  await writeFile('data/reports/pr6-arricchimenti-20261024-applied.json', `${JSON.stringify({
    lotto: 'pr6-arricchimenti-20261024',
    data: DATA_LOTTO,
    origine: 'Deployment preview 9deeca12 (commit 50170df); schede estratte da data/staging/pr6-arricchimento-20261024/estrazioni.json.',
    criterio: 'Delta conservativi: si aggiunge e si sostituisce solo ciò che la fonte pubblicata documenta; nessun dato esistente eliminato; conflitti non risolti conservati e annotati.',
    registro,
    fontiNuove: fonti.nuove.map(({ evidenza: _evidenza, ...f }) => f),
    duplicatiSegnalati: duplicati.filter(d =>
      [...registro.map(r => r.id), ...risultato.report.decisioni.map((d2: { id: string }) => d2.id)]
        .some(id => id === d.primo || id === d.secondo)),
    conteggi,
  }, null, 2)}\n`);
  if (contenuto !== originale) {
    const temporaneo = `${PERCORSO}.${process.pid}.tmp`;
    await writeFile(temporaneo, contenuto, { flag: 'wx' });
    await rename(temporaneo, PERCORSO);
  }
  console.log(JSON.stringify({
    conteggi,
    inserimentiNuovi: risultato.report.decisioni,
    arricchimenti: registro.map(r => ({ id: r.id, modifiche: r.delta.length })),
    fontiNuove: fonti.nuove.length,
  }, null, 2));
}

await main();
