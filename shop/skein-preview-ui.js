/* Untracked preview-only shopping row UI. Renders a link under EACH needed DMC color.
 * Takes read-only, already-aggregated requirements from existing Floss Fox planners.
 * Never changes project or inventory state. No affiliate pixels, requests or storage.
 */
(function(root){
 'use strict';
 const get=()=>root.FlossFoxSkeinPreview;
 const add=(parent,tag,klass,text)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(text!==undefined)e.textContent=text;parent.appendChild(e);return e};
 function render(container,needs){
  if(!container||root.FLOSS_FOX_ENV!=='preview'||!get())return 0;
  container.replaceChildren();
  const rows=get().rowsFor(needs,'preview');if(!rows.length)return 0;
  const section=add(container,'section','ff-skein-preview');
  section.setAttribute('aria-label','Test links for individual needed DMC skeins');
  add(section,'h3',null,'Shop the skeins you need');
  add(section,'p','ff-skein-note','Untracked test links only. Verify the color, thread type, quantity and availability on the retailer website before ordering.');
  if(typeof navigator!=='undefined'&&navigator.onLine===false){
   add(section,'p','ff-skein-note','You are offline. Open store links when reconnected.');return rows.length;
  }
  const list=add(section,'ul','ff-skein-list');
  for(const row of rows){
   const item=add(list,'li','ff-skein-item');item.dataset.dmc=row.code;
   const head=add(item,'div','ff-skein-head');
   add(head,'strong',null,'DMC '+row.code);
   add(head,'span',null,row.qty+' skein'+(row.qty===1?'':'s')+' to buy');
   const actions=add(item,'div','ff-skein-actions');
   for(const l of row.links){
    const a=add(actions,'a','ff-skein-link',l.exact?'View skein · '+l.storeName:'Find color · '+l.storeName);
    a.href=l.url;a.target='_blank';a.rel='noopener noreferrer';a.dataset.store=l.storeId;
    a.dataset.match=l.type;
    a.setAttribute('aria-label',l.label+' (opens in new tab)');
    a.title=l.hint;
    if(!l.exact)add(a,'small',null,'Catalog / quick order — enter '+row.code);
   }
  }
  return rows.length;
 }
 root.FlossFoxSkeinPreviewUI=Object.freeze({render});
})(typeof window!=='undefined'?window:null);
