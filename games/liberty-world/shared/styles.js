// Also supports an already-running older preview server that serves .css as
// octet-stream. Read only our local styles; keep URL resolution at the CSS file.
export async function ensureStyles(names){
  if(location.protocol==='file:')return;
  for(const name of names){const url=new URL(name,import.meta.url);let loaded=false;
    for(const sheet of document.styleSheets)if(sheet.href===url.href){try{loaded=sheet.cssRules.length>0;}catch{}}
    if(loaded)continue;
    const response=await fetch(url);if(!response.ok)throw Error('Styles unavailable: '+name);
    const text=(await response.text()).replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/g,(_,quote,relative)=>'url("'+new URL(relative,url).href+'")');
    const style=document.createElement('style');style.dataset.localStyles=name;style.textContent=text;document.head.append(style);
  }
}
