// Fase 43 — il significato della frase, non la parola chiave.
// Soggetto, scopo e negazione decidono. «Revisione prima della vendita» descrive una
// lavorazione sui propri usati; «Non effettuiamo riparazioni» è una negazione esplicita.
export type ContestoEvidenza =
  | 'offerto'      // servizio offerto ai clienti
  | 'interno'      // lavorazione sui prodotti propri, prima della vendita
  | 'terzi'        // servizio ricevuto e affidato a un laboratorio esterno
  | 'ufficiale'    // centro di assistenza autorizzato dal produttore
  | 'raccolta'     // punto di raccolta, non laboratorio
  | 'negato'       // la fonte dichiara di non svolgere il servizio
  | 'storico'      // competenza storica o tradizione, senza servizio attuale
  | 'commerciale'  // semplice menzione commerciale o vendita
  | 'insufficiente';

const NEGATO = [
  /\bnon (?:effettuiamo|eseguiamo|facciamo|ci occupiamo|ripar(?:iamo|iamo)|trattiamo|svolgiamo)\b/,
  /\bnon (?:è|e) (?:possibile|previsto) (?:il|la|un)\b/,
  /\bnon (?:eseguiamo|accettiamo) (?:riparazioni|revisioni|interventi)\b/,
];
const INTERNO = [
  /\bprima (?:di essere vendut|di vendere|della vendita|di metter[el]i in vendita|di proporl)/,
  /\busato garantito\b|\busati garantit/,
  /\bi nostri (?:orologi|usati)\b|\bnostri orologi\b/,
  /\bpreparazione alla vendita\b|\bripristino (?:degli|dei) (?:orologi )?usati/,
  /\borologi (?:usati|d.?occasione) (?:vengono|sono) (?:sottopost|revisionat)/,
  // Ascione: «Ogni orologio di secondo polso che proponiamo viene sottoposto a … revisione».
  /\b(?:di )?secondo polso\b[^.]{0,80}\b(?:viene|vengono|sono) (?:sottopost|revisionat|controllat)/,
  /\b(?:di )?secondo polso che (?:proponiamo|vendiamo|trattiamo)\b/,
  /\b(?:prima|al momento) (?:della|di) (?:vendita|consegna)\b[^.]{0,60}\b(?:revision|controll|ripristin)/,
];
const TERZI = [
  /\bci affidiamo a\b|\blaboratori esterni\b|\bterzista\b|\bpresso un laboratorio esterno\b/,
  /\bin collaborazione con (?:un|il) laboratorio\b/,
  /\bservizio (?:esterno|affidato a terzi)\b/,
];
const UFFICIALE = [
  /\bcentro (?:di )?assistenza (?:autorizzato|ufficiale)\b|\bassistenza (?:tecnica )?autorizzata\b/,
  /\bconcessionario (?:ufficiale|autorizzato)\b|\brivenditore autorizzato\b[^.]{0,60}\bservice\b/,
  /\bservice (?:center|point) (?:autorizzato|ufficiale)\b/,
];
const RACCOLTA = [/\bpunto (?:di )?raccolta\b|\britiro e consegna\b/];
const OFFERTO = [
  /\boffriamo\b|\beseguiamo\b|\beffettuiamo\b|\bsiamo in grado di\b|\bci occupiamo di\b|\bservizio di\b/,
  /\briparazioni? (?:su|di|per) orologi (?:dei|per i) clienti\b|\borologi dei clienti\b/,
  /\briceviamo\b|\bsu appuntamento\b|\bpreventivo\b|\bi clienti ci affidano\b/,
  /\bdisponiamo di un laboratorio\b|\blaboratorio attrezzato\b|\blaboratorio interno\b/,
];
const STORICO = [/\bstoric[oa]\b|\bfondat[oa] nel\b|\bdal (?:18|19)\d{2}\b|\btradizione\b|\bda generazioni\b/];
const COMMERCIALE = [
  /\bmarchi trattati\b|\btrattiamo (?:le )?marche\b|\bvetrina\b|\besposizione\b/,
  /\bvendita (?:di|al pubblico)\b|\bacquisto e vendita\b/,
];

export function contestoEvidenza(estratto: string): ContestoEvidenza {
  const t = estratto.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  if (t.length < 40) return 'insufficiente';
  // La negazione viene prima di tutto: «non effettuiamo riparazioni» non è una prova.
  if (NEGATO.some(r => r.test(t))) return 'negato';
  // La lavorazione sui propri prodotti non diventa servizio al cliente per una parola vicina.
  if (INTERNO.some(r => r.test(t))) return 'interno';
  if (TERZI.some(r => r.test(t))) return 'terzi';
  if (UFFICIALE.some(r => r.test(t))) return 'ufficiale';
  if (RACCOLTA.some(r => r.test(t))) return 'raccolta';
  if (OFFERTO.some(r => r.test(t))) return 'offerto';
  if (STORICO.some(r => r.test(t))) return 'storico';
  if (COMMERCIALE.some(r => r.test(t))) return 'commerciale';
  return 'insufficiente';
}

// Solo chi descrive un servizio svolto per il cliente dimostra la competenza.
// Il centro ufficiale dimostra l'assistenza, non ogni altro servizio.
export function provaDelServizio(contesto: ContestoEvidenza, servizio: string): boolean {
  if (contesto === 'offerto' || contesto === 'terzi') return true;
  return contesto === 'ufficiale' && servizio === 'assistenza';
}
