/* Pip Project Readiness - local-only optional UI & chat chooser.
 * Deliberately uses the PUBLIC computed project plan, not its own estimator.
 * Does not read localStorage, send fetch, or write to project/inventory data.
 */
(function(root){'use strict';
const CORE=root.FlossFoxPipReadiness;
if(!CORE)return;
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
function api(){return root.FlossFoxProjects}
function projects(){return (api()?._store()?.projects||[]).filter(p=>p&&p.demo!==true).map(p=>({id:p.id,name:p.name||'Untitled project'}))}
function inspect(id){const P=api();if(!P||typeof P.plan!=='function')throw new Error('Project planner unavailable');
 const p=P._store().projects.find(p=>p.id===id&&p.demo!==true);if(!p)throw new Error('Project not found');
 // No clones written back; all resulting objects are created by the existing plan function.
 const storage=root.FlossFoxThreadsUI?.data()?.threads||{};
 const snapshot=JSON.parse(JSON.stringify(p)); // prevents any future plan-side mutation of saved user objects
 return CORE.summarize(snapshot,P.plan(snapshot),storage);
}
function explain(id){return CORE.toText(inspect(id))}
function chooseForChat(host,respond){
 if(!host||typeof respond!=='function')return;
 const all=projects(),holder=create('div','piph-choices');
 if(!all.length){respond('There are no saved projects yet. Add some colors and save a project first.');return}
 respond('Choose a saved project to check. I’ll use your local project plan; nothing will be sent online.');
 for(const p of all){const b=create('button','sec piph-chip',p.name);b.type='button';b.addEventListener('click',()=>{
  holder.remove();try{respond(explain(p.id))}catch{respond('That project could not be checked right now. Open My Projects to review it directly.')}
 });holder.append(b)}host.append(holder);
}
function mount(){const view=document.getElementById('projectsView');if(!view||view.querySelector('#pipProjectReadiness'))return;
 const panel=create('section','card ff-readiness');panel.id='pipProjectReadiness';
 const heading=create('h2','', 'Pip’s Project Readiness Check');
 const note=create('p','hint','Read-only and offline. Uses the same project decisions and quantities as your shopping list. Does not reserve floss between projects.');
 const form=create('div','ff-readiness-controls');const lbl=create('label','', 'Project to check');const select=create('select');select.id='ffReadinessProject';lbl.htmlFor=select.id;
 const button=create('button','sec','Check this project');button.type='button';
 const details=create('div','ff-readiness-result');details.setAttribute('role','status');details.setAttribute('aria-live','polite');
 function choices(){const previously=select.value;select.replaceChildren();const all=projects();for(const p of all){const o=create('option','',p.name);o.value=p.id;select.append(o)}if(all.some(p=>p.id===previously))select.value=previously;button.disabled=!all.length;}
 function render(){choices();details.replaceChildren();if(!select.value){details.append(create('p','hint','Save a project to check its readiness.'));return}
  try{const r=inspect(select.value);details.append(create('p','ff-readiness-heading',r.ready?'Ready according to your project plan':'Still needs attention'));
    details.append(create('p','',`${r.counts.ready}/${r.total} accounted for · ${r.counts.toBuy} need buying · ${r.counts.awaiting} waiting to check in · ${r.counts.review} to review`));
    if(r.hasEstimates)details.append(create('p','hint','Includes provisional skein estimates. Actual thread use varies.'));
    const sections=[['review','Check first'],['buy','Need to buy'],['awaiting','Waiting for check-in'],['have','Have enough'],['received','Received']];
    for(const [key,label] of sections){if(!r.groups[key].length)continue;const h=create('h3','',label);const ul=create('ul','ff-readiness-list');for(const t of r.groups[key]){
      const text=`DMC ${t.code}${t.remaining!==null?` · ${t.remaining} still to buy`:''}${t.location?` · Stored: ${t.location}`:''}${t.reason?` · ${t.reason}`:''}`;
      ul.append(create('li','',text));
    }details.append(h,ul)}
    details.append(create('p','hint',r.notice));
  }catch{details.append(create('p','hint','Unable to calculate this project right now. Open the project to check its saved information.'))}
 }
 button.addEventListener('click',render);form.append(lbl,select,button);panel.append(heading,note,form,details);
 view.insertBefore(panel,view.querySelector('#projListCard')||view.firstChild);
 // Choices are refreshed at button press; never mutate user data or subscribe to private storage events.
 choices();
}
if(typeof document!=='undefined')mount();
root.FlossFoxPipReadinessUI=Object.freeze({projects,inspect,explain,chooseForChat,mount});
})(typeof window!=='undefined'?window:globalThis);
