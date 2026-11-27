// Lettura delle evidenze documentali raccolte dalle fonti censite (data/evidenze/servizi.json).
// Il file è generato da scripts/raccogli-evidenze.ts ed è l'unica fonte delle motivazioni testuali:
// nessun estratto viene inventato qui. Se manca un'evidenza confermata, il motivo non esiste.
// Fase 40: il client importa solo le evidenze confermate (data/evidenze/confermate.json),
// generato da scripts/fase40-evidenze-client.mjs. Il registro completo resta nel repository.
import dati from '../../../data/evidenze/confermate.json';
import meta from '../../../data/evidenze/meta.json';
import { REGOLE_SERVIZIO, type EvidenzaRuolo, type ServizioTecnico } from './evidenza-regole.ts';

export type Evidenza = {
  attivitaId: string; servizio: string; fonteId: string; url: string; titolo: string;
  estratto: string; tipoFonte: string; verificataIl: string;
  stato: 'confermata' | 'da-verificare'; ruolo: EvidenzaRuolo; metodo: 'testo-pagina';
};

export const evidenze: Evidenza[] = (dati as { evidenze: Evidenza[] }).evidenze;
export const evidenzeAggiornateIl: string = (meta as { aggiornatoIl: string }).aggiornatoIl;

const perAttivita = new Map<string, Evidenza[]>();
for (const e of evidenze) {
  const gruppo = perAttivita.get(e.attivitaId) ?? [];
  gruppo.push(e);
  perAttivita.set(e.attivitaId, gruppo);
}

export const evidenzaConfermata = (attivitaId: string, servizio: string): Evidenza | undefined =>
  perAttivita.get(attivitaId)?.find(e => e.servizio === servizio && e.stato === 'confermata' && e.estratto.length > 0);

export const evidenzeAttivita = (attivitaId: string): Evidenza[] => perAttivita.get(attivitaId) ?? [];

// Conteggi per il resoconto e per le note delle pagine servizio.
export function bilancioEvidenze(): { confermate: number; daVerificare: number; associazioni: number; attivitaConEvidenza: number } {
  const attivita = new Set(evidenze.map(e => e.attivitaId));
  const conteggi = meta as { confermate: number; daVerificare: number; associazioni: number };
  return {
    confermate: conteggi.confermate,
    daVerificare: conteggi.daVerificare,
    associazioni: conteggi.associazioni,
    attivitaConEvidenza: attivita.size,
  };
}

// Motivo naturale: la frase della fonte, ripulita e centrata sulla parola che documenta il servizio.
// Se la citazione è più lunga del limite, la finestra parte vicino alla parola chiave: il motivo
// deve mostrare la prova, non un preambolo generico.
export function fraseEvidenza(e: Evidenza, max = 150, servizio?: string): string {
  const frase = e.estratto.replace(/\s+/g, ' ').trim();
  let tagliata = frase;
  if (frase.length > max) {
    const regola = servizio ? REGOLE_SERVIZIO[servizio as ServizioTecnico] : undefined;
    const trovato = regola?.exec(frase.toLowerCase());
    let inizio = 0;
    if (trovato && trovato.index > max - 50) inizio = Math.max(0, frase.lastIndexOf(' ', trovato.index - 60) + 1 || trovato.index - 60);
    tagliata = frase.slice(inizio, inizio + max);
    if (inizio > 0) tagliata = `…${tagliata.slice(tagliata.indexOf(' ') + 1)}`;
    tagliata = `${tagliata.replace(/[,;:.…]+$/, '').trim()}…`;
  }
  const conPunto = /[.!?…]$/.test(tagliata) ? tagliata : `${tagliata}.`;
  return `${conPunto.charAt(0).toUpperCase()}${conPunto.slice(1)}`;
}
