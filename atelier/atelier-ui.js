/* Floss Fox 3.9 Atelier, Stage B: Workbasket, universal search, Resume where I was, Reset display settings.
   Progressive enhancement loaded after every existing script. If anything it needs is missing, it does nothing.
   Safety rules:
   - Reads projects and threads only through FlossFoxProjects / FlossFoxThreadsUI and never changes them.
   - Navigation only: tab buttons, showView(), open(id) after checking the id still exists.
   - Writes only its own preference key (<prefix>.atelier.v1), and only after the visitor turns on Resume where I was
     (or presses Reset). Every write is read back; a failed write is reported, never shown as saved.
   - Search runs in memory on this device. Queries are never stored, logged or sent anywhere (no GoatCounter path or title).
   - User text (project names, notes, storage spots) is only ever set with textContent.
   - Strings come from atelier-copy.js (Pixel's DRAFT copy, pending Myke). */
(function(){'use strict';
if(window.FlossFoxAtelier)return; // idempotent: loading twice adds nothing
const P=window.FlossFoxProjects,T=window.FlossFoxThreadsUI,PR=window.FlossFoxAtelierPreferences,SR=window.FlossFoxAtelierSearch,PA=window.FlossFoxAtelierPalette,CP=window.FlossFoxAtelierCopy;
if(!P||!P.KEY||!P.showView||!PR||!SR||!CP||typeof document==='undefined')return;
const $=id=>document.getElementById(id),t=(k,v,n)=>CP.t(k,v,n);
const CAT=(()=>{try{return typeof DMC==='object'&&DMC?DMC:null}catch(e){return null}})(); // index.html catalog (script-scoped const)
function el(tag,attrs,text){const e=document.createElement(tag);if(attrs)for(const k in attrs){const v=attrs[k];if(v===null||v===undefined||v===false)continue;if(k==='class')e.className=v;else if(k==='hidden')e.hidden=!!v;else e.setAttribute(k,v===true?'':String(v))}if(text!==undefined&&text!==null)e.textContent=String(text);return e}
const PKEY=PR.keyFor(P.KEY);
let LS=null;try{LS=window.localStorage}catch(e){}
// ---------- preferences (read-only until the visitor acts) ----------
let pref={ok:false,reason:'unavailable',data:null};
function loadPref(){pref=LS?PR.load(LS,PKEY):{ok:false,reason:'storage-unavailable',data:null};return pref}
loadPref();
const P0=()=>pref.ok?pref.data:PR.normalize(null).data;
function savePref(patch){if(!LS||!pref.ok)return{ok:false,reason:pref.reason||'unavailable'};const r=PR.save(LS,PKEY,{...pref.data,...patch});if(r.ok)pref={ok:true,data:r.data,stored:true};return r}
// ---------- live data (read only) ----------
function projects(){try{const s=P._store();return s&&Array.isArray(s.projects)?s.projects:null}catch(e){return null}}
const real=()=>(projects()||[]).filter(p=>p&&!p.demo);
function threads(){try{const d=T&&T.data&&T.data();return d&&d.threads&&typeof d.threads==='object'?d.threads:{}}catch(e){return{}}}
const hasSaved=()=>real().length>0||Object.keys(threads()).length>0;
const STATUS=SR.STATUS;
const cname=n=>String(n||'').replace(/\b(vy|dk|lt|md|ul)\b/gi,m=>({vy:'very',dk:'dark',lt:'light',md:'medium',ul:'ultra'}[m.toLowerCase()])); // same wording as My threads
const trim=(s,n)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1).trimEnd()+'\u2026':s};
function fmtDate(iso){const d=new Date(iso);if(isNaN(d))return'';try{return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return iso.slice(0,10)}}
function current(){for(const k of PR.TABS){const b=$(tabId(k));if(b&&b.getAttribute('aria-pressed')==='true')return k}return 'convert'}
function tabId(k){return 'tab'+k.charAt(0).toUpperCase()+k.slice(1)}
function go(view){const b=$(tabId(view));if(b&&!b.hidden){b.click();return true}try{P.showView(view);return true}catch(e){return false}}
function openProjectSafe(id,focusNote){const p=real().find(x=>x.id===id);if(!p)return false;P.open(id);if(focusNote)setTimeout(()=>{const n=$('pLeftOff');if(n){try{n.scrollIntoView({block:'center'})}catch(e){}n.focus({preventScroll:true})}},0);return true}

// ---------- Workbasket ----------
let wbTab=null,wbView=null;
function mountWorkbasket(){
 const nav=document.querySelector('nav.tabs'),conv=$('convertView');if(!nav||!conv)return;
 wbTab=el('button',{type:'button',id:'tabWorkbasket',class:'prim ffa-tab','aria-pressed':'false',hidden:true});
 wbTab.append(el('span',{'aria-hidden':'true'},'\uD83E\uDDFA'),' ',el('span',{class:'lg'},t('wb.nav')),el('span',{class:'sm'},t('wb.nav')));
 wbTab.addEventListener('click',()=>{P.showView('workbasket');renderWB()});
 nav.insertBefore(wbTab,nav.firstChild);
 wbView=el('div',{id:'workbasketView',class:'ffa-wbview',hidden:true});conv.parentNode.insertBefore(wbView,conv);
 syncTab();
}
function syncTab(){if(wbTab)wbTab.hidden=!hasSaved()&&current()!=='workbasket'}
function stat(n,k,cls){const d=el('div',{class:'ffa-stat'+(cls?' '+cls:'')});d.append(el('b',null,String(n)),el('span',null,t(k,{n},n).replace(/^\d+\s/,'')));d.setAttribute('aria-label',t(k,{n},n));return d}
function quick(){const q=el('nav',{class:'ffa-quick','aria-labelledby':'ffWbQ'});q.append(el('h3',{id:'ffWbQ'},t('wb.quick.title')));
 const g=el('div',{class:'ffa-quickgrid'});
 const b=(k,f)=>{const x=el('button',{type:'button',class:'ffa-qbtn'},t(k));x.addEventListener('click',f);return x};
 g.append(b('wb.quick.find',()=>{go('convert');const i=$('inp');if(i)i.focus()}),b('wb.quick.threads',()=>go('threads')),b('wb.quick.shop',()=>go('shop')));
 const f=el('a',{class:'ffa-qbtn',href:'fabric.html'},t('wb.quick.fabric'));g.append(f);q.append(g);return q}
function palette(p){if(!PA)return null;let v;try{v=PA.strip(p.items||[],CAT||{})}catch(e){return null}
 if(!v.total)return el('p',{class:'ffa-mut ffa-small'},t('palette.empty'));
 const ul=el('ul',{class:'ffa-strip','aria-label':t('palette.aria',{name:trim(p.name,28),list:v.swatches.map(s=>s.label).join(', ')})});
 v.swatches.forEach(s=>{const li=el('li',{class:'ffa-floss'+(s.rgb?'':' none')+(s.outline?' edge':''),role:'img','aria-label':t(s.rgb?'swatch.aria':'swatch.aria.none',{brand:s.brand,code:s.code}),title:s.label});if(s.rgb)li.style.setProperty('--c',s.rgb);ul.append(li)});
 if(v.remaining){ul.append(el('li',{class:'ffa-more','aria-label':t('palette.more.aria',{n:v.remaining},v.remaining)},t('palette.more',{n:v.remaining})))}
 return ul}
function renderWB(){if(!wbView)return;syncTab();if(wbView.hidden&&current()!=='workbasket')return;
 const box=el('section',{class:'card ffa-wb','aria-labelledby':'ffWbH'}),all=projects(),ps=real(),th=threads(),owned=Object.keys(th).length;
 const active=ps.filter(p=>p.status!=='done').sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')))[0]||null;
 box.append(el('p',{class:'ffa-eyebrow'},t('wb.nav')),el('h2',{id:'ffWbH',tabindex:'-1'},t('wb.title')),el('p',{class:'ffa-lead'},active?t('wb.sub.active'):t('wb.sub.general')));
 if(all===null||(P.canSave&&!P.canSave())){box.append(el('p',{class:'warn',role:'alert'},t('wb.unreadable')))}
 else if(active){const c=el('article',{class:'ffa-active','aria-labelledby':'ffWbP'});
  c.append(el('p',{class:'ffa-label'},t('wb.active.label')),el('h3',{id:'ffWbP'},trim(active.name,100)),el('p',{class:'ffa-meta'},t('wb.active.meta',{status:STATUS[active.status]||STATUS.planning,date:fmtDate(active.updated)})));
  const pal=palette(active);if(pal)c.append(pal);
  const note=el('div',{class:'ffa-note'});note.append(el('b',null,t('wb.leftOff.label')));
  const lo=typeof active.leftOff==='string'&&active.leftOff.trim()?active.leftOff:'';note.append(el('p',{class:lo?'':'ffa-mut'},lo?trim(lo,240):t('wb.leftOff.none')));c.append(note);
  let P2=null;try{P2=P.plan(active)}catch(e){P2=null}
  if(P2&&Array.isArray(P2.lines)){const s=el('div',{class:'ffa-stats'}),toBuy=P2.lines.filter(l=>!l.bought).length,aw=P2.lines.filter(l=>l.bought).length,cf=Array.isArray(P2.checkFirst)?P2.checkFirst.length:0;
   s.append(stat(toBuy,'wb.stat.toBuy'),stat(cf,'wb.stat.checkFirst'));if(aw){const a=el('div',{class:'ffa-stat'});a.append(el('b',null,String(aw)),el('span',null,t('wb.stat.awaiting',{n:aw}).replace(/^\d+\s/,'')));a.setAttribute('aria-label',t('wb.stat.awaiting',{n:aw}));s.append(a)}c.append(s)}
  else c.append(el('p',{class:'ffa-mut ffa-small'},t('wb.stat.unknown')));
  const row=el('div',{class:'ffa-row'});const cont=el('button',{type:'button',class:'pri',id:'ffWbContinue'},t('wb.btn.continue'));cont.addEventListener('click',()=>{if(!openProjectSafe(active.id,true))renderWB()});row.append(cont);
  if(!lo){const an=el('button',{type:'button',class:'sec',id:'ffWbAddNote'},t('wb.btn.addNote'));an.addEventListener('click',()=>{if(!openProjectSafe(active.id,true))renderWB()});row.append(an)}
  c.append(row);box.append(c)}
 else if(ps.length){const c=el('div',{class:'ffa-empty'});c.append(el('h3',null,t('wb.done.title')),el('p',null,t('wb.done.body')));const r=el('div',{class:'ffa-row'});
  const a=el('button',{type:'button',class:'pri'},t('wb.done.btn'));a.addEventListener('click',()=>{go('convert');const i=$('inp');if(i)i.focus()});
  const b=el('button',{type:'button',class:'sec'},t('wb.done.btn2'));b.addEventListener('click',()=>go('projects'));r.append(a,b);c.append(r);box.append(c)}
 else{const c=el('div',{class:'ffa-empty'});c.append(el('h3',null,t('wb.zero.title')),el('p',null,t('wb.zero.body')));const a=el('button',{type:'button',class:'pri'},t('wb.zero.btn'));a.addEventListener('click',()=>{go('convert');const i=$('inp');if(i)i.focus()});c.append(a);box.append(c)}
 const side=el('section',{class:'card ffa-side','aria-label':t('wb.quick.title')});
 const o=el('p',{class:'ffa-owned'});o.append(el('b',null,t('wb.stat.owned',{n:owned},owned)),' ',el('span',{class:'ffa-mut ffa-small'},t('wb.stat.owned.hint')));side.append(o,quick());
 wbView.replaceChildren(el('div',{class:'ffa-wbgrid'}));wbView.firstChild.append(box,side)}

// ---------- universal search ----------
let sBtn=null,sPanel=null,sIn=null,sList=null,sLive=null,sNote=null,sDetail=null,opener=null,index=null,dirty=true,active=-1,opts=[],timer=0;
function mountSearch(){
 const head=document.querySelector('header'),nav=document.querySelector('nav.tabs');if(!head||!nav)return;
 sBtn=el('button',{type:'button',id:'ffSearchBtn',class:'ffa-searchbtn noprint','aria-label':t('search.aria'),'aria-haspopup':'dialog','aria-expanded':'false','aria-controls':'ffSearch'});
 {const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg'),c=document.createElementNS(NS,'circle'),l=document.createElementNS(NS,'path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  [['cx','11'],['cy','11'],['r','7'],['fill','none'],['stroke-width','2.2']].forEach(a=>c.setAttribute(a[0],a[1]));
  [['d','M16.5 16.5L21 21'],['stroke-width','2.4'],['stroke-linecap','round']].forEach(a=>l.setAttribute(a[0],a[1]));svg.append(c,l);sBtn.append(svg)}
 sBtn.append(el('span',{class:'ffa-lbl'},t('search.nav')));
 const ask=$('askPipBtn');head.insertBefore(sBtn,ask||null);
 sPanel=el('section',{id:'ffSearch',class:'card ffa-search noprint',role:'dialog','aria-modal':'false','aria-labelledby':'ffSearchH',hidden:true});
 const top=el('div',{class:'ffa-shead'});top.append(el('h2',{id:'ffSearchH',class:'ffa-sh'},t('search.label')));
 const x=el('button',{type:'button',class:'ffa-x','aria-label':t('search.close')},'\u00d7');x.addEventListener('click',()=>closeSearch(true));top.append(x);
 const f=el('div',{class:'ffa-sfield'});
 sIn=el('input',{type:'search',id:'ffSearchIn',autocomplete:'off',spellcheck:'false',maxlength:'120',placeholder:t('search.placeholder'),role:'combobox','aria-expanded':'false','aria-controls':'ffSearchList','aria-autocomplete':'list','aria-labelledby':'ffSearchH','aria-describedby':'ffSearchHint'});
 f.append(sIn);
 const hint=el('p',{id:'ffSearchHint',class:'ffa-hint'});hint.append(el('span',null,t('search.hint')+' '),el('span',null,t('search.privacy')));
 sList=el('div',{id:'ffSearchList',role:'listbox','aria-label':t('search.label'),class:'ffa-results'});
 sNote=el('p',{class:'ffa-hint',id:'ffSearchNote'});sDetail=el('div',{class:'ffa-detail',id:'ffSearchDetail',role:'region','aria-live':'polite','aria-label':t('search.group.colors'),hidden:true});
 sLive=el('p',{class:'sr',role:'status','aria-live':'polite',id:'ffSearchLive'});
 sPanel.append(top,f,hint,el('p',{class:'ffa-keys'},t('search.keys')),sNote,sList,sDetail,sLive);
 nav.parentNode.insertBefore(sPanel,nav.nextSibling);
 sBtn.addEventListener('click',()=>sPanel.hidden?openSearch():closeSearch(true));
 sIn.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,120)});
 sIn.addEventListener('keydown',onKey);
 sPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSearch(true)}});
 document.addEventListener('keydown',e=>{if(!(e.key==='k'||e.key==='K')||!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey)return;const a=document.activeElement,tg=a&&a.tagName;
  if(a!==sIn&&(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||(a&&a.isContentEditable)))return; // never steal a shortcut while typing elsewhere
  if(document.documentElement.classList.contains('ff-landing'))return;const c=$('ffConfirm');if(c&&!c.hidden)return;e.preventDefault();openSearch()});
}
function openSearch(){if(!sPanel)return;opener=document.activeElement;sPanel.hidden=false;sBtn.setAttribute('aria-expanded','true');sIn.focus();run()}
function closeSearch(restore){if(!sPanel||sPanel.hidden)return;sPanel.hidden=true;sBtn.setAttribute('aria-expanded','false');sIn.setAttribute('aria-expanded','false');sIn.removeAttribute('aria-activedescendant');sDetail.hidden=true;
 if(restore){const o=opener&&document.contains(opener)?opener:sBtn;try{o.focus()}catch(e){}}opener=null}
function getIndex(){if(index&&!dirty)return index;const ps=projects();index=SR.build({projects:ps||[],threads:threads(),catalog:CAT});dirty=false;return index}
const WH=['DMC:BLANC','DMC:WHITE','DMC:B5200'];
function run(){if(!sPanel||sPanel.hidden)return;let ix;sNote.textContent='';sNote.className='ffa-hint';
 try{ix=getIndex()}catch(e){sNote.textContent=t('search.stale');sNote.className='warn';ix=index||[]}
 const q=sIn.value,r=SR.search(ix,q,{limit:8});sList.replaceChildren();opts=[];active=-1;sDetail.hidden=true;
 if(!r.query){sNote.textContent=t('search.empty');sIn.setAttribute('aria-expanded','false');sIn.removeAttribute('aria-activedescendant');sLive.textContent='';return}
 if(!r.total){const n=el('div',{class:'ffa-none'});n.append(el('p',{class:'ffa-nonet'},t('search.none.title',{query:trim(q,40)})),el('p',null,t('search.none.body')));sList.append(n);sIn.setAttribute('aria-expanded','false');announce(0);return}
 const th=threads();
 const group=(rows,k,make)=>{if(!rows.length)return;const gid='ffsg-'+k.split('.').pop(),g=el('div',{role:'group','aria-labelledby':gid,class:'ffa-sgroup'});g.append(el('h3',{id:gid,role:'presentation'},t(k)));rows.forEach(row=>{const o=make(row);o.id='ffsr-'+opts.length;o.setAttribute('role','option');o.setAttribute('aria-selected','false');o.addEventListener('click',()=>activate(row));o.addEventListener('mousemove',()=>setActive(opts.indexOf(o),false));opts.push(o);g.append(o)});sList.append(g)};
 const own=code=>{const e=th[code];if(!e)return t('search.res.notOwned');let s=t('search.res.owned',{n:e.n},e.n);if(e.partial)s+=' \u00b7 '+t('search.res.partial');return s};
 group(r.colors,'search.group.colors',row=>{const o=el('div',{class:'ffa-res'}),isD=row.brand.toUpperCase()==='DMC',hex=isD&&CAT&&CAT[row.exactCode]&&/^#[0-9a-f]{6}$/i.test(CAT[row.exactCode].hex)?CAT[row.exactCode].hex:null;
  const sw=el('span',{class:'ffa-floss'+(hex?'':' none')+(hex&&/^#f/i.test(hex)?' edge':''),'aria-hidden':'true'});if(hex)sw.style.setProperty('--c',hex);
  const m=el('span',{class:'ffa-rmeta'});m.append(el('b',null,isD?(row.subtitle?t('search.res.color',{brand:row.brand,code:row.exactCode,name:cname(row.subtitle)}):`${row.brand} ${row.exactCode}`):`${row.brand} ${row.exactCode}`),el('span',null,isD?own(row.exactCode):t('search.res.chart',{dmc:row.dmc.slice(0,3).join(', ')})));o.append(sw,m);return o});
 group(r.threads,'search.group.threads',row=>{const o=el('div',{class:'ffa-res'}),e=th[row.exactCode]||{};const m=el('span',{class:'ffa-rmeta'});m.append(el('b',null,row.label));let s=own(row.exactCode);if(row.location)s+=' \u00b7 '+t('search.res.location',{location:row.location});m.append(el('span',null,s));o.append(m);return o});
 group(r.projects,'search.group.projects',row=>{const o=el('div',{class:'ffa-res'}),m=el('span',{class:'ffa-rmeta'}),p=real().find(x=>x.id===row.key),qq=SR.canon(q).toUpperCase(),usesCode=p&&!SR.canon(p.name).includes(SR.canon(q))&&(p.items||[]).some(i=>String(i.code).toUpperCase()===qq);
  m.append(el('b',null,row.label),el('span',null,usesCode?t('search.res.project',{status:STATUS[p.status]||STATUS.planning,code:qq}):(STATUS[p&&p.status]||STATUS.planning)));o.append(m);return o});
 const notes=[];if(r.colors.filter(c=>WH.includes(c.key)).length>=2)notes.push(t('search.whites'));
 if(r.colors.length>=8||r.threads.length>=8||r.projects.length>=8){if(r.total>r.colors.length+r.threads.length+r.projects.length)notes.push(t('search.limit',{n:8}))}
 sNote.textContent=notes.join(' ');sIn.setAttribute('aria-expanded','true');announce(opts.length)}
function announce(n){clearTimeout(announce.t);announce.t=setTimeout(()=>{sLive.textContent=t('search.count',{n},n)},450)}
function setActive(i,scroll){if(!opts.length)return;if(active>=0&&opts[active])opts[active].setAttribute('aria-selected','false');active=(i+opts.length)%opts.length;const o=opts[active];o.setAttribute('aria-selected','true');sIn.setAttribute('aria-activedescendant',o.id);if(scroll!==false)try{o.scrollIntoView({block:'nearest'})}catch(e){}}
function onKey(e){if(e.key==='ArrowDown'){e.preventDefault();setActive(active+1)}else if(e.key==='ArrowUp'){e.preventDefault();setActive(active<0?opts.length-1:active-1)}
 else if(e.key==='Home'&&opts.length&&e.ctrlKey){e.preventDefault();setActive(0)}
 else if(e.key==='Enter'){if(!opts.length)return;e.preventDefault();const o=opts[active<0?0:active];o.click()}}
function activate(row){
 if(row.type==='project'){if(real().some(p=>p.id===row.key)){closeSearch(false);openProjectSafe(row.key,false)}else{dirty=true;run()}return}
 if(row.type==='thread'||(row.type==='color'&&row.brand.toUpperCase()==='DMC'&&threads()[row.exactCode])){closeSearch(false);go('threads');
  setTimeout(()=>{const li=[...document.querySelectorAll('#thList li[data-code]')].find(x=>x.dataset.code===row.exactCode&&!x.classList.contains('demo'));
   if(li){li.classList.add('ffa-found');try{li.scrollIntoView({block:'center'})}catch(e){}const f=li.querySelector('button,input');if(f)f.focus({preventScroll:true});setTimeout(()=>li.classList.remove('ffa-found'),2400)}},60);return}
 // A color you don't own: show what the catalog knows, right here. Nothing is added or changed.
 sDetail.replaceChildren();const d=sDetail,isD=row.brand.toUpperCase()==='DMC',e=isD&&CAT?CAT[row.exactCode]:null;
 d.append(el('h3',null,`${row.brand} ${row.exactCode}`));
 if(isD){if(e&&e.name)d.append(el('p',null,cname(e.name)));d.append(el('p',null,t('search.res.notOwned')));if(e&&Array.isArray(e.anchor)&&e.anchor.length)d.append(el('p',{class:'ffa-mut ffa-small'},'Anchor '+e.anchor.join(' / ')));}
 else d.append(el('p',null,t('search.res.chart',{dmc:row.dmc.join(', ')})));
 d.append(el('p',{class:'ffa-mut ffa-small'},t('swatch.tip')));d.hidden=false}
function markDirty(){dirty=true;if(sPanel&&!sPanel.hidden)run()}

// ---------- Resume where I was + Reset display settings (Settings) ----------
let resumeResult='not-run';
function mountSettings(){const sv=$('settingsView');if(!sv)return;const card=sv.querySelector('.card')||sv;
 const box=el('div',{class:'ffa-prefs',id:'ffAtelierPrefs'});
 const lab=el('label',{class:'ffa-check'});const cb=el('input',{type:'checkbox',id:'ffResume','aria-describedby':'ffResumeHint'});cb.checked=!!P0().rememberPlace;cb.disabled=!pref.ok;
 lab.append(cb,' ',t('pref.resume'));const hint=el('p',{class:'hint',id:'ffResumeHint'},t('pref.resume.hint'));
 const st=el('p',{class:'hint',role:'status','aria-live':'polite',id:'ffPrefStatus'});
 const rb=el('button',{type:'button',class:'sec',id:'ffPrefReset'},t('pref.reset'));
 box.append(lab,hint,rb,st);card.append(box);
 cb.addEventListener('change',()=>{const want=cb.checked;st.textContent=t('common.saving');const r=savePref({rememberPlace:want,lastTab:current()==='settings'?'settings':current(),lastProjectId:null});
  if(r.ok)st.textContent=t('common.saved');else{cb.checked=!want;st.textContent=t('common.notSaved')}});
 rb.addEventListener('click',async()=>{const C=window.FlossFoxConfirm;const yes=C&&C.ask?await C.ask({title:t('pref.reset.title'),body:t('pref.reset.body'),keep:t('pref.reset.no'),go:t('pref.reset.yes'),pose:'thinking'}):window.confirm(t('pref.reset.title'));if(!yes)return;
  const r=LS?PR.reset(LS,PKEY):{ok:false};if(r.ok){loadPref();cb.checked=false;cb.disabled=!pref.ok;st.textContent=t('pref.reset.done');document.dispatchEvent(new CustomEvent('ff:atelier-prefs-reset'))}else st.textContent=t('common.notSaved')});
}
// Records the last tab / open project ONLY while Resume where I was is on.
function record(){const d=P0();if(!pref.ok||!d.rememberPlace)return;const v=current();if(v==='workbasket'&&!hasSaved())return;let pid=null;
 if(v==='projects'){try{const id=P.openId&&P.openId(),pe=$('projEdit');if(id&&pe&&!pe.hidden&&real().some(p=>p.id===id))pid=id}catch(e){}}
 if(d.lastTab===v&&d.lastProjectId===pid)return;savePref({lastTab:v,lastProjectId:pid})}
// Precedence: safety/storage problem > URL hash > landing / Start here / tour > Resume where I was > default.
function resume(){const d=P0();
 if(!pref.ok||!d.rememberPlace)return'off';
 if(location.hash&&location.hash!=='#')return'hash';
 if((P.canSave&&!P.canSave())||(T&&T.canSave&&!T.canSave()))return'safety';
 const R=$('restoreResult');if(R&&!R.hidden)return'safety';
 if(document.documentElement.classList.contains('ff-landing'))return'onboarding'; // landing shown: Start here, Resume off, or nothing saved
 if(window.FlossFoxStartHere&&FlossFoxStartHere.fresh&&FlossFoxStartHere.fresh())return'onboarding';
 const tc=$('tourCard');if(tc&&!tc.hidden)return'onboarding';
 const v=d.lastTab;if(!v||v==='convert')return'default';
 if(v==='projects'&&d.lastProjectId){if(openProjectSafe(d.lastProjectId,false))return'project';go('projects');const lc=$('projListCard');if(lc){const n=el('p',{class:'hint ffa-missing',role:'status'},t('wb.missing'));lc.insertBefore(n,lc.firstChild);const rm=()=>{n.remove();document.removeEventListener('click',rm,true)};setTimeout(()=>document.addEventListener('click',rm,true),0)}return'missing'}
 if(v==='workbasket'&&!hasSaved())return'default';
 return go(v)?'tab':'default'}
// ---------- wiring ----------
function boot(){mountWorkbasket();mountSearch();mountSettings();
 const obs=new MutationObserver(()=>{syncTab();if(current()==='workbasket')renderWB();record()});
 PR.TABS.forEach(k=>{const b=$(tabId(k));if(b)obs.observe(b,{attributes:true,attributeFilter:['aria-pressed']})});const pe=$('projEdit');if(pe)obs.observe(pe,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('ff:data-saved',()=>{markDirty();syncTab();if(current()==='workbasket')renderWB()});
 window.addEventListener('storage',e=>{if(!e.key||/^flossfox/.test(e.key)){markDirty();if(e.key===PKEY)loadPref()}});
 if(location.hash==='#workbasket')renderWB();
 const run1=()=>{resumeResult=resume();if(current()==='workbasket')renderWB()};
 if(document.readyState==='complete')setTimeout(run1,0);else addEventListener('load',()=>setTimeout(run1,0));
}
window.FlossFoxAtelier=Object.freeze({version:'3.9-stageB',draftCopy:true,prefKey:PKEY,prefs:()=>pref.ok?{...pref.data}:null,resumeResult:()=>resumeResult,renderWorkbasket:()=>renderWB(),openSearch:()=>openSearch(),closeSearch:()=>closeSearch(true),_dirty:()=>dirty});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
