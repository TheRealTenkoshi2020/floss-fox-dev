/* FlossFox V6 / Foxglass — a presentation-only workspace shell.
   No localStorage writes, no catalog or calculation replacements, no requests.
   Requires FlossFox V5 dev API; retains underlying legacy views and IDs.
   If unavailable, exits without hiding the existing interface. */
(function (root) {
  'use strict';
  if (root.FlossFoxV6 || typeof document === 'undefined') return;
  const d = document, $ = id => d.getElementById(id);
  const P = root.FlossFoxProjects;
  if (!P || typeof P.showView !== 'function' || typeof P._store !== 'function' || !$('threadsView') || !$('projectsView') || !$('shopView')) return;
  const LEGACY = ['workbasketView','convertView','threadsView','projectsView','shopView','helpView','settingsView','threadwoodView'];
  const MAP = {home:'home',workbasket:'home',convert:'threads:convert',threads:'threads:stash',projects:'projects',shop:'shopping',help:'help',settings:'settings',threadwood:'den',more:'more', 'threads/stash':'threads:stash','threads/convert':'threads:convert','shop/combined':'shopping:combined'};
  const state = {area:'',thread:'stash',project:'threads',transition:false};
  const el = (tag,cl,text)=>{const a=d.createElement(tag);if(cl)a.className=cl;if(text!==undefined)a.textContent=text;return a};
  const btn = (label, action, cls='')=>{const a=el('button','fg-action '+cls,label);a.type='button';a.addEventListener('click',action);return a};
  const link = (label,href,cls='')=>{const a=el('a','fg-link '+cls,label);a.href=href;return a};
  const readProjects = ()=>{try{const o=P._store();return Array.isArray(o.projects)?o.projects.filter(x=>x&&!x.demo):[]}catch(_){return []}};
  const readThreads = ()=>{try{const t=root.FlossFoxThreadsUI?.data();return t&&t.threads&&typeof t.threads==='object'?Object.keys(t.threads).length:0}catch(_){return null}};
  const scrollTop = ()=>{try{root.scrollTo({top:0,behavior:'instant'})}catch(_){}};
  let header=null, nav=null, home=null, more=null, threadStrip=null, projectStrip=null, shoppingIntro=null, thEntry=null;
  let startupHash=(root.location.hash||'').slice(1);
  let observer=null;

  function hideCustom(){home.hidden=true;more.hidden=true}
  function hideLegacy(){LEGACY.forEach(id=>{const n=$(id);if(n&&!n.hidden)n.hidden=true})}
  function activeLegacy(){for(const [id,route] of [['workbasketView','home'],['convertView','threads:convert'],['threadsView','threads:stash'],['projectsView','projects'],['shopView','shopping'],['helpView','more'],['settingsView','more'],['threadwoodView','more']]){const n=$(id);if(n&&!n.hidden)return route}return null}
  function routeHash(){let h=(root.location.hash||'').slice(1);try{h=decodeURIComponent(h)}catch(_){}if(h.startsWith('share='))return null;return MAP[h]||null}
  function setHash(h){if(!h)return;if(root.location.hash!=='#'+h){root.history.pushState(null,'','#'+h)}}
  function setNav(selected){for(const b of nav.querySelectorAll('[data-fg-area]')){const on=b.dataset.fgArea===selected;b.setAttribute('aria-current',on?'page':'false');b.classList.toggle('fg-active',on);if(!on)b.removeAttribute('aria-current')}nav.dataset.current=selected}
  function focusHeading(){const target=state.area==='home'?home:state.area==='more'?more:({threads:()=>$(state.thread==='convert'?'heroH':'thCard')?.querySelector('h1,h2')||$('heroH'),projects:()=>d.querySelector('#projEdit:not([hidden]) #pTitle')||d.querySelector('#projListCard h2'),shopping:()=>shoppingIntro.querySelector('h2')})[state.area]?.();const h=typeof target==='function'?target():target;if(h){h.tabIndex=-1;try{h.focus({preventScroll:true})}catch(_){}}}
  function navigate(to,{hash=true,focus=true,scroll=true}={}){
    const [area,sub]=to.split(':');if(state.transition)return;
    state.transition=true;
    try{
      hideCustom();
      if(area==='home'||area==='more'){
        hideLegacy();state.area=area;
        if(area==='home'){renderHome();home.hidden=false}else{more.hidden=false}
        if(hash)setHash(area);
      }else if(area==='threads'){
        state.area='threads';state.thread=sub==='convert'?'convert':'stash';
        P.showView(state.thread==='convert'?'convert':'threads',true);
        if(hash)setHash(state.thread==='convert'?'convert':'threads');
      }else if(area==='projects'){
        state.area='projects';P.showView('projects',true);if(hash)setHash('projects');
      }else if(area==='shopping'){
        state.area='shopping';P.showView('shop',true);if(hash)setHash('shop');
        if(sub==='combined')root.setTimeout(()=>{$('ffauShopStart')?.click()},0);
      }else if(area==='help'||area==='settings'){
        state.area='more';P.showView(area,true);if(hash)setHash(area);
      }else if(area==='den'){
        state.area='more';if(root.FlossFoxThreadwood?.show){root.FlossFoxThreadwood.show();if(hash)setHash('threadwood')}
        else{P.showView('help',true);if(hash)setHash('help')}
      }
      setNav(state.area);syncThreads();syncProject();syncShopping();
      root.dispatchEvent(new CustomEvent('ff:workspace-changed',{detail:{area:state.area}}));
      if(scroll)scrollTop();if(focus)root.setTimeout(focusHeading,0);
    }finally{state.transition=false}
  }

  function createShell(){
    const wrap=d.querySelector('.wrap'),h=wrap?.querySelector('header'),old=h?.nextElementSibling;
    if(!wrap||!h)return false;
    header=h;nav=el('nav','fg-nav');nav.id='fg-nav';nav.setAttribute('aria-label','Floss Fox workspaces');
    [['home','Home'],['threads','Threads'],['projects','Projects'],['shopping','Shopping'],['more','More']].forEach(([id,label])=>{
      const b=btn('',()=>navigate(id==='threads'?'threads:stash':id),'fg-nav-btn');b.dataset.fgArea=id;b.setAttribute('aria-label',label);const symbols={home:'⌂',threads:'🧵',projects:'▣',shopping:'🧺',more:'☰'};const mark=el('span','fg-nav-icon',symbols[id]);mark.setAttribute('aria-hidden','true');b.append(mark,el('span','fg-nav-label',label));nav.append(b);
    });
    h.insertAdjacentElement('afterend',nav);
    const holder=el('div','fg-workspace-stage');holder.id='fg-stage';nav.insertAdjacentElement('afterend',holder);
    home=el('section','fg-home');home.id='fg-home';home.hidden=true;home.setAttribute('aria-label','Home');
    more=el('section','fg-more');more.id='fg-more';more.hidden=true;more.setAttribute('aria-label','More tools');
    holder.append(home,more);
    threadStrip=el('div','fg-subbar');threadStrip.id='fg-thread-tabs';threadStrip.setAttribute('role','tablist');threadStrip.setAttribute('aria-label','Threads workspace');
    const modes=[['stash','My collection'],['convert','Find & convert']];for(const [id,label] of modes){const b=btn(label,()=>navigate('threads:'+id),'fg-segment');b.dataset.fgThread=id;b.setAttribute('role','tab');threadStrip.append(b)}
    const cv=$('convertView');cv.parentElement.insertBefore(threadStrip,cv);
    const heading=el('div','fg-shopping-intro');heading.id='fg-shopping-intro';heading.append(el('p','fg-eyebrow','SHOPPING'),el('h2',null,'Your shopping list'),el('p','fg-subtitle','All the colors you need, without the double-buying.'));
    shoppingIntro=heading;$('shopView').prepend(heading);
    const combo=btn('Combine projects',()=>{
      navigate('shopping',{hash:true,focus:false,scroll:false});const a=$('ffauShopStart')||$('shopSeveral');if(a)a.click();else showStatus('Open or create a project to make a shopping list.');
    },'fg-combine-btn');combo.id='fg-combine';heading.append(combo);
    createMore();createThreadEntry();
    d.documentElement.classList.add('fg-ready');d.documentElement.classList.remove('ff-landing');
    // V5's landing and tool nav remain in the DOM for compatibility but not on screen.
    return true;
  }
  function showStatus(message){const status=$('fg-status');if(status)status.textContent=message}
  function createMore(){
    const lead=el('div','fg-more-head');lead.append(el('p','fg-eyebrow','EVERYTHING ELSE'),el('h1',null,'A little more to explore'),el('p','fg-subtitle','Your everyday tools are always close. The extras have their own cozy corner.'));more.append(lead);
    const cards=el('div','fg-more-grid');more.append(cards);
    function panel(title,desc,entries){const c=el('section','fg-more-card');c.append(el('h2',null,title),el('p','fg-muted',desc));for(const [name,target,kind] of entries){let a;if(kind==='url'){a=link(name,target)}else{a=btn(name,()=>{navigate(target);if(name==='Take the tour')root.setTimeout(()=>{$('helpTour')?.click()},0)},'fg-more-link')}c.append(a)}cards.append(c)}
    panel('Learn & calculate','Helpful references for preparing your next piece.',[['Fabric calculator','fabric.html','url'],['All tools and guides','tools.html','url'],['Floss conversion guide','floss-conversion-guide.html','url'],['Thread inventory tips','thread-inventory-guide.html','url'],['Project planning guide','cross-stitch-project-planning.html','url']]);
    panel('Pip & inspiration','Advice, gentle company, and a little joy along the way.',[['Help & tutorials','help'],["Pip's Den",'den'],['Take the tour','help']]);
    panel('Your data & preferences','Your projects stay on your device. Keep a backup you control.',[['Backup & settings','settings'],['Privacy & data safety','privacy.html','url'],['About Floss Fox','about.html','url']]);
    const t=el('p','fg-muted fg-more-foot','Nothing here requires an account. Your collection and projects remain in your browser unless you choose to export or share them.');more.append(t);
  }
  function setAddMode(mode){
    const view=$('threadsView');if(!view)return;view.dataset.fgAddMode=mode;
    const close=$('fg-add-close');if(close)close.hidden=mode==='none';
    const desc=$('fg-add-mode-status');if(desc)desc.textContent=mode==='quick'?'Quick add is ready below. Enter a DMC number and its amount.':mode==='import'?'Choose a list, photo, barcode, or multiple DMC colors below.':'Add options are closed.';
  }
  function createThreadEntry(){
    const target=$('thCard');if(!target)return;
    thEntry=el('details','fg-entry');thEntry.id='fg-entry';const sum=el('summary',null,'Add threads');thEntry.append(sum);
    thEntry.append(el('p','fg-muted','Choose one way to add thread. Your existing collection will not change until you confirm the save.'));
    const actions=el('div','fg-entry-actions');
    const choose=(mode,callback)=>()=>{setAddMode(mode);thEntry.open=false;if(callback)root.requestAnimationFrame(callback)};
    actions.append(btn('Quick add',choose('quick',()=>{$('thAdd')?.focus()}),'fg-action-light'));
    actions.append(btn('Paste or import',choose('import',()=>{
      const opener=$('ffauImport')||[...d.querySelectorAll('#ffSmartStash button.ffss-choice')].find(b=>/import a list/i.test(b.textContent));
      if(opener)opener.click();else $('thBulkBtn')?.click();
    }),'fg-action-light'));
    actions.append(btn('Choose DMC colors',choose('import',()=>{
      const found=[...d.querySelectorAll('#ffSmartStash button.ffss-choice')].find(b=>/choose colors/i.test(b.textContent));
      if(found)found.click();else showStatus('The DMC color picker is unavailable here. Use Quick add instead.');
    }),'fg-action-light'));
    actions.append(btn('Review a pasted list',choose('quick',()=>{$('thBulkBtn')?.click()}),'fg-action-light'));
    actions.append(btn('Add from my projects',choose('quick',()=>{$('thImport')?.click()}),'fg-action-light'));
    thEntry.append(actions);target.insertAdjacentElement('beforebegin',thEntry);
    const notice=el('p','fg-add-mode-status');notice.id='fg-add-mode-status';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    const close=btn('Done adding',()=>{setAddMode('none');sum.focus()},'fg-add-close');close.id='fg-add-close';close.hidden=true;
    target.insertAdjacentElement('beforebegin',notice);target.insertAdjacentElement('beforebegin',close);
    setAddMode('none');
    // A legacy contextual importer may still open from elsewhere in the app.
    d.addEventListener('click',e=>{if(e.target.closest('#ffauImport'))setAddMode('import');if(e.target.closest('[data-search-add]'))setAddMode('quick')},true);
  }
  function renderHome(){
    home.replaceChildren();const projects=readProjects();const active=projects.filter(p=>p.status!=='done').sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')))[0]||null;
    const count=readThreads(),hero=el('div','fg-home-hero'),words=el('div','fg-home-words');
    words.append(el('p','fg-eyebrow','WELCOME TO FLOSS FOX'),el('h1',null,active?'Your next stitch is waiting.':'A quiet place to begin.'),el('p','fg-subtitle',active?'Your colors, plans, and little moments of progress are right where you left them.':'A little organizing now means more time doing what you love.'));
    hero.append(words);const pic=d.createElement('img');pic.src='assets/pip/pip-gardener-160.png';pic.alt='';pic.width=110;pic.height=136;pic.decoding='async';hero.append(pic);home.append(hero);
    if(active){const card=el('section','fg-continue');card.append(el('p','fg-eyebrow','PICK UP WHERE YOU LEFT OFF'),el('h2',null,String(active.name||'Your project')));
      if(active.leftOff){card.append(el('p','fg-last-note',String(active.leftOff).slice(0,250)))}
      const actions=el('div','fg-row');actions.append(btn('Continue project',()=>openProject(active.id),'fg-primary'));actions.append(btn('Shopping list',()=>{if(openProject(active.id)){const shop=$('pShop');if(shop)shop.click();else navigate('shopping')}}));card.append(actions);home.append(card)}
    const what=el('section','fg-home-choices');what.append(el('h2',null,active?'What would you like to do?':'What are we stitching up today?'));
    const grid=el('div','fg-card-grid');
    function tile(title,sub,target){const b=btn('',()=>{},'fg-choice');b.textContent='';b.append(el('strong',null,title),el('span','fg-muted',sub));b.onclick=()=>navigate(target);grid.append(b)}
    tile('Find a color','Check DMC shades and discover chart matches.','threads:convert');
    tile('My threads','See what you own or add to your collection.','threads:stash');
    tile(projects.length?'My projects':'Start a project',projects.length?'Keep your stitching organized.':'Give your next pattern a home.','projects');
    what.append(grid);home.append(what);
    if(projects.length){const o=el('p','fg-hint','Planning a trip to the craft store? ');o.append(link('Open Shopping','#shop'));home.append(o)}
    if(count!==null){const note=el('p','fg-stash-note',count?`${count} thread color${count===1?'':'s'} in your collection on this device.`:'Your collection is ready whenever you are.');home.append(note)}
    const safe=el('p','fg-data-hint','Your work stays in this browser. ');const b=btn('Backup & settings',()=>navigate('settings'),'fg-inline');safe.append(b);home.append(safe);
    home.querySelectorAll('a[href="#shop"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate('shopping')}));
  }
  function openProject(id){navigate('projects',{focus:false});if(!readProjects().some(p=>p.id===id)){showStatus('That project is no longer available. Choose another saved project.');return false}try{P.open(id)}catch(_){showStatus('Could not open that project. Your saved data was not changed.');return false}syncProject();return !P.openId||P.openId()===id;}

  function syncThreads(){if(!threadStrip)return;const on=state.area==='threads';threadStrip.hidden=!on;
    for(const b of threadStrip.querySelectorAll('[data-fg-thread]')){const yes=b.dataset.fgThread===state.thread;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;b.classList.toggle('fg-selected',yes)}
    if(on){const view=$(state.thread==='convert'?'convertView':'threadsView');if(view){view.setAttribute('role','tabpanel');view.setAttribute('aria-label',state.thread==='convert'?'Find and convert floss colors':'My thread collection')}}
    if(thEntry)thEntry.hidden=!(on&&state.thread==='stash');}
  function projectTabButton(label,key){const b=btn(label,()=>{state.project=key;syncProject(true)},'fg-segment');b.setAttribute('role','tab');b.dataset.fgProject=key;return b}
  function buildProjectTabs(){const ed=$('projEdit'),name=$('pTitle');if(!ed||ed.hidden||!name)return false;
    let strip=$('fg-project-tabs');if(!strip){strip=el('div','fg-subbar fg-project-tabs');strip.id='fg-project-tabs';strip.setAttribute('role','tablist');strip.setAttribute('aria-label','Project sections');
      [['Threads','threads'],['Progress','progress'],['Details & prep','details']].forEach(([name,key])=>strip.append(projectTabButton(name,key)));name.insertAdjacentElement('afterend',strip)}
    ed.dataset.fgProjectTab=state.project;return true;
  }
  function syncProject(focus=false){const ed=$('projEdit'),on=state.area==='projects'&&ed&&!ed.hidden&&$('pTitle');
    if(!on){if(ed)ed.removeAttribute('data-fg-project-tab');return}
    if(!buildProjectTabs())return;
    const key=state.project,strip=$('fg-project-tabs');
    for(const b of strip.querySelectorAll('button')){const selected=b.dataset.fgProject===key;b.classList.toggle('fg-selected',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1}
    const visible=(id,yes)=>{const n=$(id);if(n)n.hidden=!yes};
    visible('pSum',key==='threads');visible('pReady',key==='threads');visible('pTrust',key==='threads');visible('pThreads',key==='threads');visible('pCmp',key==='threads');visible('pKitGoRow',key==='threads');
    const moreBox=$('pMore');if(moreBox){moreBox.hidden=key==='threads';if(key!=='threads'){moreBox.open=true;for(const child of [...moreBox.children]){
        if(child.tagName==='SUMMARY')continue;
        const progress=child.id==='pProgress'||child.id==='pSession'||child.id==='ffauSessions'||child.classList.contains('pleftoff');
        child.hidden=(key==='progress')?!progress:progress;
      }}
    }
    if(key==='details')attachPrepShortcuts(moreBox);
    if(focus){const target=key==='threads'?$('pThreadsH'):key==='progress'?($('ffauSessions')||$('pProgress')):($('fg-prep-shortcuts')||$('pDetails'));if(target){target.scrollIntoView({block:'start'});target.tabIndex=-1;target.focus({preventScroll:true})}}
  }
  function attachPrepShortcuts(pMore){if(!pMore)return;let box=$('fg-prep-shortcuts');if(box)return;box=el('div','fg-prep-shortcuts');box.id='fg-prep-shortcuts';box.append(el('h3',null,'Prepare your next stitch'),el('p','fg-muted','Plan your fabric or bring in a pattern without losing your place.'));
    const row=el('div','fg-row');const fab=link('Measure fabric','fabric.html');fab.target='_blank';fab.rel='noopener';fab.setAttribute('aria-label','Measure fabric, opens in a new tab');row.append(fab);
    row.append(btn('Import a pattern PDF',()=>{if(typeof root.FFImportOpen==='function')root.FFImportOpen();else showStatus('Pattern import is unavailable in this build.')},'fg-action-light'));box.append(row);pMore.insertBefore(box,pMore.children[1]||null);
  }
  function syncShopping(){if(shoppingIntro)shoppingIntro.hidden=state.area!=='shopping'}
  function reconcile(){if(state.transition)return;const active=activeLegacy();if(!active)return;hideCustom();const [area,sub]=active.split(':');
    const desired=area==='help'||area==='settings'||area==='den'?'more':area;
    if(state.area!==desired||desired==='threads'&&state.thread!==sub){state.area=desired;if(desired==='threads')state.thread=sub==='convert'?'convert':'stash';setNav(state.area);syncThreads();syncProject();syncShopping()}
    if(desired==='projects')syncProject();}
  function installHooks(){
    observer=new MutationObserver(()=>reconcile());LEGACY.forEach(id=>{const x=$(id);if(x)observer.observe(x,{attributes:true,attributeFilter:['hidden']})});
    const ed=$('projEdit');if(ed){const mo=new MutationObserver(()=>{if(state.area==='projects')syncProject()});mo.observe(ed,{attributes:true,attributeFilter:['hidden']});mo.observe(ed,{childList:true,subtree:true})}
    root.addEventListener('popstate',()=>root.setTimeout(()=>routeFromLocation(),0));root.addEventListener('hashchange',()=>root.setTimeout(()=>routeFromLocation(),0));
    // Older start-up handlers can select a legacy tab on window load. Enforce aliases last.
    root.addEventListener('load',()=>root.setTimeout(()=>routeFromLocation(),0));
    // Existing HTML links and handlers continue using legacy routes. When leaving Home/More, the view observer syncs our nav.
    d.addEventListener('click',e=>{const link=e.target.closest('a.ffstart');if(link){e.preventDefault();e.stopImmediatePropagation();navigate('home')}} ,true);
    const logo=$('appname');if(logo)logo.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();navigate('home')},true);
    // The search panel and contextual Pip guidance should not compete for visibility.
    const ask=$('askPipBtn'),search=$('ffSearchBtn');if(ask&&search){ask.addEventListener('click',()=>{const panel=$('ffSearch');if(panel&&!panel.hidden)search.click()},true);search.addEventListener('click',()=>{const pip=$('askPip');if(pip&&!pip.hidden)ask.click()},true)}
    if(nav){nav.addEventListener('keydown',e=>{const arr=[...nav.querySelectorAll('button')],i=arr.indexOf(d.activeElement);if(i<0)return;let j=i;if(e.key==='ArrowRight')j=(i+1)%arr.length;else if(e.key==='ArrowLeft')j=(i+arr.length-1)%arr.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=arr.length-1;else return;e.preventDefault();arr[j].focus()})}
    d.addEventListener('keydown',e=>{if(!e.target.closest('#fg-thread-tabs,#fg-project-tabs'))return;const arr=[...e.target.closest('.fg-subbar').querySelectorAll('button')],i=arr.indexOf(d.activeElement);if(i<0)return;let j=i;if(e.key==='ArrowRight')j=(i+1)%arr.length;else if(e.key==='ArrowLeft')j=(i+arr.length-1)%arr.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=arr.length-1;else return;e.preventDefault();arr[j].click();arr[j].focus()});
    root.addEventListener('ff:data-saved',()=>{if(state.area==='home')renderHome()});
    root.addEventListener('storage',()=>{if(state.area==='home')renderHome()});
  }
  function routeFromLocation(){if(state.transition)return;const r=routeHash();if(r){navigate(r,{hash:false,focus:false,scroll:false})}else if((root.location.hash||'').startsWith('#share=')){// preserve existing share-reader route
      hideCustom();setNav('home');syncThreads();syncShopping();}
  }
  function boot(){if(!createShell())return;installHooks();
    const k=routeHash()||(startupHash.startsWith('share=')?null:'home');
    if(k)navigate(k,{hash:false,focus:false,scroll:false});else{hideCustom();setNav('home')}
    root.requestAnimationFrame(()=>{try{root.FlossFoxPipFollow?.pad();root.FlossFoxPipFollow?.place()}catch(_){}});
    const status=el('p','fg-sr');status.id='fg-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');nav.after(status);
    root.FlossFoxV6=Object.freeze({version:'v6-foxglass-built-1',navigate,home:()=>navigate('home'),readProjects,booted:true,state:()=>({...state}),renderHome,refresh:()=>{reconcile();syncProject()}});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof window!=='undefined'?window:this);
