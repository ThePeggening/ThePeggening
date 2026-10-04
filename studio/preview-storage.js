/* Only the explicit, same-origin Director preview uses an in-memory save store. */
(function isolate(){'use strict';try{
 if(window.top===window||!window.top.__PEG_STUDIO_HOST)return;
 const storage=()=>{const data=new Map();return {getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null,get length(){return data.size;}};};
 // Existing Atropa bridges replace these with their parent-owned temporary store.
 Object.defineProperty(window,'localStorage',{value:storage(),configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:storage(),configurable:true});
 window.__PEG_PREVIEW_ONLY=true;
 // Embedded Atropa games are created with srcdoc. Isolate them before any boot script runs.
 const descriptor=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');
 if(descriptor?.set)Object.defineProperty(HTMLIFrameElement.prototype,'srcdoc',{...descriptor,set(html){
  const boot='<script>('+isolate.toString()+')();<'+ '/script>';
  const text=String(html),patched=/<head\b[^>]*>/i.test(text)?text.replace(/<head\b[^>]*>/i,m=>m+boot):boot+text;
  return descriptor.set.call(this,patched);
 }});
}catch(error){throw new Error('Director could not isolate this preview: '+error.message);}})();
