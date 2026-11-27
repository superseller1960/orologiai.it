import type { Directory } from '../lib/schema';
const dialog=document.querySelector<HTMLDialogElement>('#atlas-favorites');
const launches=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-atlas-favorites]'));
const list=dialog?.querySelector<HTMLElement>('[data-atlas-list]');
const comparison=dialog?.querySelector<HTMLElement>('[data-atlas-comparison]');
const notice=dialog?.querySelector<HTMLElement>('[data-atlas-notice]');
const compare=dialog?.querySelector<HTMLButtonElement>('[data-atlas-compare]');
const key='orologiai-preferiti-v1';
let ids:string[]=[];
try { const value=JSON.parse(localStorage.getItem(key)??'[]'); if(Array.isArray(value)) ids=[...new Set<string>(value.filter((v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9-]{1,180}$/.test(v)))].slice(0,100); } catch {}
const selected=new Set<string>();
const load=()=>Promise.all([import('../../data/indice-ricerca.json'),import('../lib/schema')]).then(([raw,schema])=>({data:raw.default as unknown as Directory,labels:schema.services as Record<string,string>}));
const el=(tag:string,text?:string)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
function sync(){
  for(const launch of launches){launch.hidden=false;launch.textContent='♡ Preferiti ('+ids.length+')';}
  for(const b of document.querySelectorAll<HTMLButtonElement>('[data-save-id]')){const on=ids.includes(b.dataset.saveId??'');b.hidden=false;b.setAttribute('aria-pressed',String(on));b.textContent=on?'♥ Salvato':'♡ Salva';b.setAttribute('aria-label',on?'Rimuovi dai preferiti':'Salva nei preferiti');}
}
function decorate(){for(const card of document.querySelectorAll<HTMLElement>('[data-business-id]')){const actions=card.querySelector('.result-actions'),id=card.dataset.businessId;if(!actions||!id||actions.querySelector('[data-save-id]'))continue;const b=document.createElement('button');b.type='button';b.dataset.saveId=id;b.className='atlas-save';actions.append(b);}sync();}
function persist(){try{localStorage.setItem(key,JSON.stringify(ids));}catch{if(notice)notice.textContent='Il browser non conserva i preferiti tra le visite.';}sync();}
let renderVersion=0;
async function render(){
  if(!list||!comparison||!compare||!notice)return;
  const version=++renderVersion;comparison.replaceChildren();compare.hidden=true;
  if(!ids.length){list.replaceChildren(el('p','Non hai ancora salvato attività. Premi Salva nella ricerca o nelle schede.'));return;}
  list.replaceChildren(el('p','Caricamento…'));
  try{const {data}=await load();if(version!==renderVersion)return;list.replaceChildren();
    for(const id of ids){const b=data.attivita.find(x=>x.id===id);const row=el('div');row.className='atlas-saved-row';const label=el('label');const check=document.createElement('input');check.type='checkbox';check.checked=selected.has(id);check.disabled=!b;
    check.addEventListener('change',()=>{if(check.checked&&selected.size>=3){check.checked=false;notice.textContent='Puoi confrontare fino a tre attività.';return;}if(check.checked)selected.add(id);else selected.delete(id);notice.textContent='';compare.hidden=selected.size<2;comparison.replaceChildren();});
    label.append(check,el('span',b?.nome??'Scheda non disponibile'));row.append(label);
    if(b){const link=document.createElement('a');link.href='/orologeria/'+b.slug+'/';link.textContent='Apri';row.append(link);}
    const remove=document.createElement('button');remove.type='button';remove.dataset.removeSaved=id;remove.textContent='Rimuovi';row.append(remove);list.append(row);}
    compare.hidden=selected.size<2;
  }catch{if(version===renderVersion)list.replaceChildren(el('p','Non riesco a caricare le schede. Riapri il pannello.'));}
}
compare?.addEventListener('click',async()=>{if(!comparison)return;try{const {data,labels}=await load();const grid=el('div');grid.className='atlas-compare-grid';for(const id of selected){const b=data.attivita.find(x=>x.id===id);if(!b)continue;const card=el('article');card.className='atlas-compare-card';const dl=el('dl');const place=data.localita.find(x=>x.id===b.localitaId);for(const [k,v] of [['Località',place?.comune??b.localitaId],['Indirizzo',b.posizione.indirizzo??'Non pubblicato'],['Servizi indicati',b.servizi.map(s=>labels[s.id]??s.id).join(', ')||'Non documentati'],['Assistenza ufficiale',b.marchi.assistenzaUfficiale.map(m=>m.marca).join(', ')||'Non documentata'],['Rivendita ufficiale',b.marchi.rivenditaUfficiale.map(m=>m.marca).join(', ')||'Non documentata'],['Telefono',b.contatti.telefono??'Non pubblicato']])dl.append(el('dt',k),el('dd',v));const link=document.createElement('a');link.href='/orologeria/'+b.slug+'/';link.textContent='Scheda e fonti →';card.append(el('h3',b.nome),dl,link);grid.append(card);}comparison.replaceChildren(el('h3','Confronto delle attività'),grid);}catch{comparison.textContent='Confronto non disponibile. Riprova.';}});
document.addEventListener('click',event=>{const target=event.target;if(!(target instanceof Element))return;const b=target.closest<HTMLButtonElement>('[data-save-id],[data-remove-saved]');const id=b?.dataset.saveId??b?.dataset.removeSaved;if(!id||!/^[a-z0-9-]{1,180}$/.test(id))return;if(ids.includes(id)){ids=ids.filter(x=>x!==id);selected.delete(id);}else if(ids.length<100)ids.push(id);else return;persist();if(dialog?.open)void render();});
for(const launch of launches)launch.addEventListener('click',()=>{if(dialog&&!dialog.open){dialog.showModal();void render();}});
dialog?.querySelector('[data-atlas-close]')?.addEventListener('click',()=>dialog.close());
decorate();
for(const root of document.querySelectorAll('#search-results,#search-related-list'))new MutationObserver(decorate).observe(root,{childList:true});
document.addEventListener('directory:results',decorate);
