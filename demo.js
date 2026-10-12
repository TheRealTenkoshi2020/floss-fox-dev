/* DEV PREVIEW ONLY (never merge into production): "Load demo data" button for Samira's review.
   Adds a sample thread collection (13 colors) and the "Demogorgon (demo)" project (19 colors: 13 owned, 6 missing).
   Never runs on its own; only on a tap, after a confirm. Adds to existing data, never replaces it. */
(function(){'use strict';
if(!/floss-fox-dev/.test(location.pathname))return;
const $=id=>document.getElementById(id);
const OWN=[['310',4],['321',2],['666',1],['815',2],['817',1],['3865',3],['B5200',1],['413',2],['414',1],['415',2],['762',1],['318',2],['317',1]];
const MISS=['498','304','3799','535','3371','ECRU'];
const STITCH=[1830,920,410,640,215,2210,120,760,330,505,290,610,240,380,450,980,175,1320,260];
function load(){if(!confirm('Load demo data? This adds 13 sample threads to My Thread Collection and a "Demogorgon (demo)" project. Nothing you already have is removed.'))return;
 const T=window.FlossFoxThreadsUI,P=window.FlossFoxProjects;if(!T||!P)return;
 T.addItems(OWN.map(([code,qty])=>({code,qty})));T.set('666',{partial:true,restock:true});T.set('817',{restock:true});
 const codes=OWN.map(x=>x[0]).concat(MISS),now=new Date().toISOString();
 const id=P.add({id:'demo-'+Date.now().toString(36),name:'Demogorgon (demo)',notes:'Sample project loaded from the preview demo button.',buyBrand:'dmc',status:'planning',
  items:codes.map((code,i)=>({code,qty:1,stated:true,assumed:0,src:[`${i+1} DMC ${code} ${STITCH[i]}`],stitchCount:STITCH[i]})),decisions:{},purchased:{},created:now,updated:now});
 const m=$('demoMsg');m.textContent=id?'Demo data loaded: 13 threads in your collection and the "Demogorgon (demo)" project.':'Demo data could not be loaded.';
 if(id){const b=document.createElement('button');b.type='button';b.className='sec small';b.textContent='Open the demo project';b.onclick=()=>P.open(id);m.append(' ',b)}}
const box=document.createElement('div');box.className='notes noprint demobox';
box.innerHTML='<b>Preview only:</b> <button type="button" class="sec small" id="demoBtn">Load demo data</button> <span class="hint">(sample collection + "Demogorgon (demo)" project; added only when you tap)</span><p id="demoMsg" class="hint" role="status" aria-live="polite"></p>';
const card=$('thCard');if(card)card.insertBefore(box,card.children[1]);$('demoBtn').onclick=load;
})();
