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
  if (a.posizione.coordinate && b.posizione.coordinate && distanceKm(a.posizione.coordinate,b.posizione.coordinate) < .075) reasons.push('Coordinate entro 75 metri');
  return reasons;
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
