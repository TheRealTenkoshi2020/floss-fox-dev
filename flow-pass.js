/* Flow pass (dev): short paths. Quick add on My threads, add owned colors from a project (count first, one Undo).
   Local only: reads and writes this browser's storage through the existing Floss Fox APIs. No network. */
(function(){'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=()=>window.FlossFoxThreadsUI,P=()=>window.FlossFoxProjects;
const colors=n=>`${n} color${n===1?'':'s'}`;
function status(t){const s=$('thStatus');if(s)s.textContent=t}
// ---- Item 4: one Undo for the last "add from projects", shown right where you tapped.
function offerUndo(n,host){document.querySelectorAll('.ffundo').forEach(e=>e.remove());if(!n)return;const h=host||$('thFromProj')||$('thStatus');if(!h)return;
 const w=document.createElement('div');w.className='ffundo row';w.innerHTML=`<span class="hint">Added ${colors(n)} to My threads.</span><button type="button" class="sec small" data-ffundo>Undo</button>`;
 (h.id==='thFromProj'?h.parentElement.insertBefore(w,h.nextSibling):h.after(w));w.querySelector('button').onclick=()=>{const r=T().undoFromProjects();w.remove();const m=r?`Took back ${colors(r)}. Everything else is as it was.`:'Nothing to take back.';status(m);const ps=$('projStatus');if(ps&&host&&host.closest('#projEdit'))ps.textContent=m;drawFrom();drawProjAdd()}}
// My threads: one button per recent project that has new Have enough colors.
function drawFrom(){const box=$('thFromProj'),t=T(),p=P();if(!box||!t||!p||!t.fromProjectsCount)return;const S=p._store();
 const ps=S.projects.filter(x=>!x.demo).sort((a,b)=>String(b.updated).localeCompare(String(a.updated))).map(x=>({x,n:t.fromProjectsCount([x.id])})).filter(o=>o.n).slice(0,3);
 box.hidden=!ps.length;box.innerHTML=ps.map(o=>`<button type="button" class="sec small" data-from="${esc(o.x.id)}">+ Add ${colors(o.n)} you have from ${esc(o.x.name||'your project')}</button>`).join('');
 box.querySelectorAll('[data-from]').forEach(b=>b.onclick=()=>{const r=t.addFromProjects([b.dataset.from]),n=r.added.length;status(n?`Added ${colors(n)} from ${S.projects.find(x=>x.id===b.dataset.from).name}. Colors already in your collection were left alone.`:'Nothing new to add.');drawFrom();offerUndo(n)})}
// Open project: "Put my N Have enough colors in My threads" under the compare box.
function drawProjAdd(){const host=$('pCmp'),t=T(),p=P();if(!host||!t||!p||!t.fromProjectsCount)return;const id=p.openId&&p.openId();let el=$('pToThreads');
 const pr=id&&p._store().projects.find(x=>x.id===id),n=pr&&!pr.demo?t.fromProjectsCount([id]):0;
 if(!n){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='pToThreads';el.className='row ffto';host.after(el)}
 const txt=`Put my ${colors(n)} marked Have enough in My threads`;if(el.dataset.n===String(n))return;el.dataset.n=String(n);
 el.innerHTML=`<button type="button" class="sec small" id="pToThreadsBtn">${esc(txt)}</button><span class="hint">Adds only colors not in your collection yet.</span>`;
 $('pToThreadsBtn').onclick=()=>{const r=t.addFromProjects([id]),k=r.added.length;const ps=$('projStatus');if(ps)ps.textContent=k?`Added ${colors(k)} to My threads.`:'Nothing new to add.';el.remove();offerUndo(k,host)}}
// ---- Item 3: Enter adds (already), the box grows for a pasted list.
function grow(){const a=$('thAdd');if(!a)return;a.style.height='auto';a.style.height=Math.min(160,Math.max(44,a.scrollHeight+2))+'px'}
let q=0;function refresh(){if(q)return;q=requestAnimationFrame(()=>{q=0;drawFrom();drawProjAdd();FF.after.forEach(f=>{try{f()}catch(e){}})})}
const FF=window.FlossFoxFlow={offerUndo,refresh,after:[]};
function init(){const a=$('thAdd');if(a)a.addEventListener('input',grow);
 const mo=new MutationObserver(refresh);['thList','pCmp','projEdit','projList','shopBody'].forEach(i=>{const e=$(i);if(e)mo.observe(e,{childList:true})});
 ['threadsView','projectsView','shopView'].forEach(i=>{const e=$(i);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden']})});refresh()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
