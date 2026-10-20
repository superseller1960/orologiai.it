import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { businessSchema, directorySchema, type Business, type Directory } from '../site/src/lib/schema.ts';
import { findDuplicates } from '../site/src/lib/duplicates.ts';
import { importOsm } from '../site/src/lib/osm-import.ts';
const input = JSON.parse(await readFile('data/import/toscana-02-reviewed.json', 'utf8')) as {
  lotto: string; data: string;
  fonti: {id:string;url:string;tipo?:'marchio-ufficiale'|'directory';evidenza:string}[];
  attivita: {id:string;nome:string;comune:string;provincia:string;sigla:string;indirizzo?:string;cap?:string;telefono?:string;email?:string;whatsapp?:string;sito?:string;gruppo?:string;fonti:string[];tipi?:Business['tipi'];servizi:Record<string,string>;venduti?:string[];riparati?:string[];esperienza?:string[];rivendita?:string[];fonteMarchi?:string;specializzazioni?:Business['specializzazioni'][number]['id'][];anno?:number;fondatore?:string;storia?:string;fonteStoria?:string;descrizione:string;osmId?:string}[];
  inRevisione: {id:string;nome:string;fonti?:string[];url?:string;motivo:string}[];
  esclusi: {id:string;nome:string;fonti:string[];duplicatoDi:string;motivo:string}[];
};
const path = 'site/data/directory.json';
const data = directorySchema.parse(JSON.parse(await readFile(path,'utf8')));
const before = structuredClone(data.attivita);
const sourceId = (id:string)=>`t02-${id}`;
const slug = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
if (input.attivita.some(b=>data.attivita.some(old=>old.id===b.id))) throw new Error('Lotto già integrato o ID esistente: non sovrascrivere.');
const allSourceIds=new Set(input.fonti.map(s=>s.id));
for(const c of input.attivita) for(const ref of c.fonti) if(!allSourceIds.has(ref)) throw new Error(`Fonte assente ${ref}`);
for(const s of input.fonti) {
  if(data.fonti.some(old=>old.id===sourceId(s.id))) throw new Error('Fonte già esistente');
  data.fonti.push({id:sourceId(s.id),tipo:s.tipo??'sito-ufficiale',url:s.url,titolo:`${new URL(s.url).hostname} — ${s.id}`,consultataIl:input.data,percorsoArchivio:null,licenza:null});
}
for(const c of input.attivita) {
  const localityId=slug(c.comune);
  if(!data.localita.some(p=>p.id===localityId)) data.localita.push({id:localityId,comune:c.comune,comuneSlug:localityId,provincia:c.provincia,provinciaSlug:slug(c.provincia),siglaProvincia:c.sigla,regione:'Toscana',regioneSlug:'toscana',codiceIstat:null,descrizione:`Il primo censimento a ${c.comune} documenta ${input.attivita.filter(b=>b.comune===c.comune).map(b=>b.nome).join(', ')}. Consulta le singole schede per recapiti e servizi supportati dalle fonti.`,fonti:[...new Set(input.attivita.filter(b=>b.comune===c.comune).flatMap(b=>b.fonti))].map(sourceId)});
  const brand = (names:string[] = [])=>names.map(marca=>({marca,fonti:[sourceId(c.fonteMarchi!)]}));
  const business=businessSchema.parse({
    id:c.id,slug:c.id,nome:c.nome,tipi:c.tipi??['orologeria','gioielleria'],descrizione:c.descrizione,nomiPrecedenti:[],gruppoId:c.gruppo??null,localitaId:localityId,
    posizione:{indirizzo:c.indirizzo??null,cap:c.cap??null,coordinate:null,fonti:c.indirizzo||c.cap?[sourceId(c.fonti[0])]:[]},
    contatti:{telefono:c.telefono??null,email:c.email??null,sito:c.sito??null,whatsapp:c.whatsapp??null,social:[],fonti:[sourceId(c.fonti[0])]},
    orari:{giorni:[],chiusure:[],verificatiIl:null,fonti:[]},
    servizi:Object.entries(c.servizi).map(([id,ref])=>({id,fonti:[sourceId(ref)]})),altriServizi:[],
    specializzazioni:(c.specializzazioni??[]).map(id=>({id,fonti:[sourceId(c.fonti.find(f=>f.includes('lab'))??c.fonteMarchi??c.fonti[0])]})),
    marchi:{venduti:brand(c.venduti),riparati:brand(c.riparati),esperienza:brand(c.esperienza),assistenzaUfficiale:[],rivenditaUfficiale:brand(c.rivendita),menzionati:[]},
    storia:{annoFondazione:c.anno??null,fondatore:c.fondatore??null,testo:c.storia??null,eventi:[],fonti:c.fonteStoria?[sourceId(c.fonteStoria)]:[]},
    attendibilita:{stato:'fonti-verificate',raccoltaIl:input.data,verificataIl:input.data,confermataTitolareIl:null,fonti:c.fonti.map(sourceId),cronologia:[{data:input.data,azione:`${input.lotto}: revisione manuale A. Identità e pertinenza riscontrate nelle fonti pubbliche; non sopralluogo né conferma del titolare. Campi assenti non dedotti.`,fonti:c.fonti.map(sourceId)}],segnalazioni:[]},
    origine:{sistema:c.osmId?'osm':'ricerca-ufficiale-toscana-02',idOriginale:c.osmId??c.id},
  });
  if(c.id==='rabiti-firenze')business.orari={giorni:Array.from({length:7},(_,i)=>({giorno:i+1,intervalli:i<5?[{apertura:'09:00',chiusura:'13:00'},{apertura:'15:00',chiusura:'18:30'}]:[]})),chiusure:[],verificatiIl:input.data,fonti:[sourceId('rabiti-home')]};
  if(c.id==='swatch-firenze-calzaiuoli')business.orari={giorni:Array.from({length:7},(_,i)=>({giorno:i+1,intervalli:[{apertura:'10:00',chiusura:'20:00'}]})),chiusure:[],verificatiIl:input.data,fonti:[sourceId('swatch-calzaiuoli')]};
  data.attivita.push(business);
}
const checked=directorySchema.parse(data);
for(const b of before) if(JSON.stringify(b)!==JSON.stringify(checked.attivita.find(x=>x.id===b.id))) throw new Error(`Record preesistente alterato: ${b.id}`);
const rawOsm=await readFile('data/staging/toscana-02-osm-source/extract.json','utf8');
const area=JSON.parse(await readFile('data/import/pilot-toscana.json','utf8'));
const acquisition=JSON.parse(await readFile('data/staging/toscana-02-osm-source/acquisition.json','utf8'));
const base:Directory={...checked,attivita:before};
const osm=importOsm(rawOsm,area,base,acquisition.completatoIl,'https://overpass-api.de/api/interpreter');
const fromOsm=input.attivita.filter(c=>c.osmId);
const decisions=[
 ...input.attivita.map(c=>({id:c.id,nome:c.nome,gruppo:'A',integrataCome:c.id,motivo:'Identità e pertinenza riscontrate con fonti ufficiali; solo campi documentati trasferiti.'})),
 ...osm.candidates.filter(c=>!fromOsm.some(b=>b.osmId===c.fonte.idOriginale)).map(c=>({id:c.id,nome:c.nome,gruppo:'B',motivo:'Individuazione OSM reale, ma non completato riscontro ufficiale e/o località/identità esatta. Nessuna promozione automatica.'})),
 ...input.inRevisione.map(c=>({...c,gruppo:'B'})),
 ...input.esclusi.map(c=>({...c,gruppo:'C'})),
 ...osm.report.scartati.map(c=>({id:`osm-scarto-${c.indice}`,nome:null,gruppo:'C',motivo:c.motivo})),
];
const duplicateReport=findDuplicates(checked);
const report={lotto:input.lotto,data:input.data,contatori:{osmElementi:osm.report.letti,osmCandidati:osm.candidates.length,candidatiConNome:osm.candidates.length+input.attivita.filter(c=>!c.osmId).length+input.inRevisione.length+input.esclusi.length,integrati:input.attivita.length,stagingB:decisions.filter(d=>d.gruppo==='B').length,esclusiC:decisions.filter(d=>d.gruppo==='C').length,possibiliDuplicati:duplicateReport.length+input.esclusi.length,totaleDatabase:checked.attivita.length},decisioni:decisions,duplicati:duplicateReport,confrontoLegacy:input.esclusi,comuni:[...new Set(input.attivita.map(c=>c.comune))],province:[...new Set(input.attivita.map(c=>c.provincia))],fonti:input.fonti,osm:{sha256:createHash('sha256').update(rawOsm).digest('hex'),licenza:'ODbL-1.0',attribuzione:'© OpenStreetMap contributors',nota:'I candidati e le coordinate OSM restano nella raccolta intermedia. Unica corrispondenza pubblicata: Swatch, riscontrata indipendentemente sul sito ufficiale; ID OSM conservato, nessun campo geografico OSM copiato nel dataset pubblico.'}};
const out='data/staging/toscana-02-review';await mkdir(out);
await writeFile(`${out}/candidates-reviewed.json`,JSON.stringify(input,null,2)+'\n');
await writeFile(`${out}/decisions.json`,JSON.stringify(decisions,null,2)+'\n');
await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
await writeFile('data/import/toscana-02-report.json',JSON.stringify(report,null,2)+'\n');
await writeFile(path,JSON.stringify(checked,null,2)+'\n');
console.log(JSON.stringify(report.contatori,null,2));
