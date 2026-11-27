// Load only on intent. Replay the first click/submit when the module has initialized.
const pannello=document.getElementById('assistente');
let ready=false;
let loading:Promise<void>|undefined;
function carica(){if(!loading){loading=import('./assistant-ui.ts').then(()=>{ready=true;}).catch(()=>{loading=undefined;const stato=document.getElementById('assistente-stato');if(stato)stato.textContent='Assistente non disponibile. Apri la pagina dedicata o riprova.';throw Error('assistant unavailable');});}return loading;}
if(pannello){
 const start=()=>{void carica().catch(()=>{});};
 if(location.hash==='#assistente')start();
 pannello.closest('details')?.addEventListener('toggle',e=>{if((e.currentTarget as HTMLDetailsElement).open)start();});
 pannello.addEventListener('focusin',start,{once:true});pannello.addEventListener('pointerdown',start,{once:true});
 pannello.addEventListener('click',e=>{if(ready||!(e.target instanceof Element))return;const b=e.target.closest<HTMLButtonElement>('[data-suggerimento],#assistente-invia');if(!b)return;e.preventDefault();e.stopImmediatePropagation();void carica().then(()=>b.click()).catch(()=>{});},true);
 pannello.addEventListener('submit',e=>{if(ready)return;e.preventDefault();e.stopImmediatePropagation();const f=e.target as HTMLFormElement;void carica().then(()=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))).catch(()=>{});},true);
 pannello.addEventListener('keydown',e=>{if(ready||e.key!=='Enter'||e.shiftKey||e.isComposing||!(e.target instanceof HTMLTextAreaElement))return;e.preventDefault();e.stopImmediatePropagation();const f=e.target.form;void carica().then(()=>f?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))).catch(()=>{});},true);
}
export {};
