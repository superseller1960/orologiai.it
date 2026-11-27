import type { Business, Directory } from './schema.ts';
import { distanceKm, normalize } from './search.ts';
export type DuplicateMatch = { primo: string; secondo: string; motivi: string[]; esito: 'da-revisionare' | 'sedi-distinte'; };
const phone = (v: string | null) => v?.replace(/[^\d]/g, '').replace(/^00/, '').replace(/^39(?=\d{9,11}$)/, '') ?? '';
const address = (v: string | null) => normalize(v ?? '').replace(/\b(via|viale|piazza|piazzale|corso|largo)\b/g, '').replace(/\s+/g, ' ').trim();
const name = (v: string) => normalize(v).replace(/\b(orologeria|gioielleria|oreficeria|srl|snc|sas)\b/g, '').replace(/\s+/g, ' ').trim();
export function duplicateSignals(a: Business, b: Business): string[] {
  const reasons: string[] = [];
  const samePlace = a.localitaId === b.localitaId;
  if (a.origine.sistema === b.origine.sistema && a.origine.idOriginale === b.origine.idOriginale) reasons.push('Identificativo originario coincidente');
  if (samePlace && name(a.nome) && name(a.nome) === name(b.nome)) reasons.push('Nome normalizzato e comune coincidenti');
  if (samePlace && address(a.posizione.indirizzo) && address(a.posizione.indirizzo) === address(b.posizione.indirizzo)) reasons.push('Indirizzo normalizzato e comune coincidenti');
  if (phone(a.contatti.telefono) && phone(a.contatti.telefono) === phone(b.contatti.telefono)) reasons.push('Telefono coincidente');
  if (a.contatti.sito && b.contatti.sito && new URL(a.contatti.sito).hostname.replace(/^www\./,'') === new URL(b.contatti.sito).hostname.replace(/^www\./,'')) reasons.push('Dominio ufficiale condiviso: possibile rete con più sedi');
  // Due botteghe vicine con nomi e civici distinti non sono duplicati: con la
  // geocodifica nazionale la sola distanza generava falsi positivi nei centri storici.
  const ambiguousIdentity = !a.posizione.indirizzo || !b.posizione.indirizzo || address(a.posizione.indirizzo) === address(b.posizione.indirizzo) || name(a.nome) === name(b.nome);
  if (ambiguousIdentity && a.posizione.coordinate && b.posizione.coordinate && distanceKm(a.posizione.coordinate,b.posizione.coordinate) < .075) reasons.push('Coordinate entro 75 metri con identità o indirizzo da distinguere');
  return reasons;
}
// Classificazione richiesta dalla Fase 40: un duplicato certo non deve mai entrare in catalogo.
// Si basa su identità verificabili (telefono, indirizzo nello stesso comune, dominio condiviso),
// mai sulla sola somiglianza del nome.
export type ClasseDuplicato = 'duplicato-confermato' | 'possibile-duplicato' | 'attivita-distinta';
export function classificaCoppia(a: Business, b: Business): { classe: ClasseDuplicato; motivi: string[] } {
  const motivi: string[] = [];
  const stessoComune = a.localitaId === b.localitaId;
  const telA = phone(a.contatti.telefono), telB = phone(b.contatti.telefono);
  if (telA && telA.length >= 8 && telA === telB) motivi.push('Telefono identico');
  const indA = address(a.posizione.indirizzo), indB = address(b.posizione.indirizzo);
  if (stessoComune && indA && indA === indB) motivi.push('Indirizzo identico nello stesso comune');
  const domA = a.contatti.sito ? new URL(a.contatti.sito).hostname.replace(/^www\./, '') : '';
  const domB = b.contatti.sito ? new URL(b.contatti.sito).hostname.replace(/^www\./, '') : '';
  // Un dominio condiviso non basta: la stessa insegna può avere due negozi nella stessa città.
  if (domA && domA === domB) motivi.push(stessoComune ? 'Dominio condiviso nello stesso comune: due sedi della stessa insegna' : 'Dominio condiviso in comuni diversi: possibile rete con più sedi');
  // Confermano il duplicato solo telefono o indirizzo identici: dati dell'attività, non del marchio.
  if (motivi.includes('Telefono identico') || motivi.includes('Indirizzo identico nello stesso comune')) return { classe: 'duplicato-confermato', motivi };
  if (motivi.length) return { classe: 'possibile-duplicato', motivi };
  if (stessoComune && name(a.nome) && name(a.nome) === name(b.nome)) return { classe: 'possibile-duplicato', motivi: ['Nome normalizzato coincidente nello stesso comune'] };
  return { classe: 'attivita-distinta', motivi };
}

export function auditDuplicati(data: Directory): { coppia: [string, string]; classe: ClasseDuplicato; motivi: string[] }[] {
  const esiti: { coppia: [string, string]; classe: ClasseDuplicato; motivi: string[] }[] = [];
  for (let i = 0; i < data.attivita.length; i++) for (let j = i + 1; j < data.attivita.length; j++) {
    const { classe, motivi } = classificaCoppia(data.attivita[i], data.attivita[j]);
    if (classe !== 'attivita-distinta') esiti.push({ coppia: [data.attivita[i].id, data.attivita[j].id], classe, motivi });
  }
  return esiti;
}

export function findDuplicates(data: Directory): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];
  for (let i=0;i<data.attivita.length;i++) for (let j=i+1;j<data.attivita.length;j++) {
    const a=data.attivita[i],b=data.attivita[j];const motivi=duplicateSignals(a,b);
    if (!motivi.length) continue;
    const distinct = !!a.gruppoId && a.gruppoId === b.gruppoId && (a.localitaId !== b.localitaId || (!!a.posizione.indirizzo && !!b.posizione.indirizzo && address(a.posizione.indirizzo)!==address(b.posizione.indirizzo)));
    results.push({primo:a.id,secondo:b.id,motivi,esito:distinct?'sedi-distinte':'da-revisionare'});
  }
  return results;
}
