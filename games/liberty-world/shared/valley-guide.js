import {element,button} from './hud-kit.js';

// One next action per panel. The gold ring supplements text and keyboard focus.
export function markNext(panel,target,text='Choose the yellow-ringed button to continue.'){
 if(!panel||!target||panel.dataset.choiceMenu==='true')return;
 for(const node of panel.querySelectorAll('.v-guide-current')){node.classList.remove('v-guide-current');node.removeAttribute('data-guide-current');}
 target.classList.add('v-guide-current');target.dataset.guideCurrent='true';
 let note=panel.querySelector('.v-guide-note');if(!note){note=element('p','v-guide-note');note.setAttribute('role','status');note.setAttribute('aria-live','polite');panel.querySelector('.v-panel-head')?.after(note);}
 note.textContent='NEXT · '+text;target.setAttribute('aria-description',text);if(target.isConnected)target.scrollIntoView({block:'nearest'});
}
export function watchGuidance(layer){
 const observer=new MutationObserver(()=>{const panel=layer.querySelector('.v-panel');if(!panel||panel.dataset.choiceMenu==='true'||panel.querySelector('.v-guide-current:not([hidden])'))return;const next=panel.querySelector('button.pc-primary:not([disabled])')||panel.querySelector('.v-panel-head ~ button:not([disabled])');if(next)markNext(panel,next,'Select “'+next.textContent+'”.');});
 observer.observe(layer,{childList:true,subtree:true});return()=>observer.disconnect();
}
export function guideSelect(panel,select,answer,advance){
 const pick=button('Choose: '+answer,()=>{select.value=answer;select.dispatchEvent(new Event('change',{bubbles:true}));},'pc-button v-answer-pick');select.closest('label').after(pick);
 function update(){const correct=select.value===answer;pick.hidden=correct;markNext(panel,correct?advance:pick,correct?'That is the right choice. Select Continue.':'Choose “'+answer+'”. You can also use the dropdown.');}
 select.addEventListener('change',update);update();return update;
}
