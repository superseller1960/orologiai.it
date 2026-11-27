import { services, isUsableCoordinate, type Business } from './schema';
const order: (keyof typeof services)[] = ['restauro-vintage','pendoleria','riparazione-meccanici','riparazione-automatici','revisione','orologi-tasca','riparazione-quarzo','riparazione','batterie','cinturini','manutenzione','vendita-usati','vendita','assistenza','valutazioni','lucidatura','gioielleria'];
export function featuredServices(b: Business) {
 return [...b.servizi].sort((a,c)=>(order.indexOf(a.id)<0?99:order.indexOf(a.id))-(order.indexOf(c.id)<0?99:order.indexOf(c.id))).slice(0,4);
}
// Fase 45: alcuni nomi contengono già la località (es. «Dival Orologi — Milano»).
// Il titolo SEO non deve ripeterla: si toglie il suffisso solo se coincide col comune.
export function titoloScheda(b: Business, comune: string) {
  const nome = b.nome.trim();
  const parola = new RegExp(`(^|[^a-zà-ù])${comune.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-zà-ù])`, 'i');
  // Se il comune è già nel nome, anche senza trattino, non si aggiunge di nuovo.
  return parola.test(nome) ? nome : `${nome} — ${comune}`;
}
export function editorialSummary(b: Business) {
 // Solo fatti già presenti: nessuna reputazione, storia o specializzazione dedotta.
 return b.descrizione.replace(/La fonte ufficiale documenta /g,'Servizi: ').replace(/Nessuna estensione ad altri marchi\.?/gi,'').trim();
}
export function directionsUrl(b: Business, comune: string) {
 const c=b.posizione.coordinate;
 return isUsableCoordinate(c)
  ? `https://www.openstreetmap.org/directions?to=${c.lat}%2C${c.lon}`
  : b.posizione.indirizzo ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${b.posizione.indirizzo}, ${comune}, Italia`)}` : null;
}
export const laboratoryLabel = (b: Business) => b.laboratorio ? ({interno:'Laboratorio interno',esterno:'Assistenza tramite laboratorio esterno',rete:'Laboratorio della rete',orafo:'Laboratorio orafo','non-specificato':'Laboratorio documentato · sede non specificata'}[b.laboratorio.tipo]) : null;
