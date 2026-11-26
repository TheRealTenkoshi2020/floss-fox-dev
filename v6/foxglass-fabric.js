/* FlossFox V6 — unified Fabric page navigation. Existing calculator untouched. */
(function(root){'use strict';if(typeof document==='undefined'||root.FlossFoxV6Fabric)return;
const d=document;
function boot(){const w=d.querySelector('.wrap'),head=w?.querySelector('header'),old=d.querySelector('.fcnav');if(!w||!head||!old)return;
const nav=d.createElement('nav');nav.className='fg-nav';nav.id='fg-nav';nav.setAttribute('aria-label','Floss Fox workspaces');
const links=[['Home','index.html#home'],['Threads','index.html#threads'],['Projects','index.html#projects'],['Shopping','index.html#shop'],['More','index.html#more']];
for(const [name,url] of links){const a=d.createElement('a');a.className='fg-nav-btn fg-fabric-link';a.href=url;a.textContent=name;nav.appendChild(a)}
head.insertAdjacentElement('afterend',nav);d.documentElement.classList.add('fg-fabric-ready');
// Reposition the existing Pip rail below the complete header and the new nav.
root.requestAnimationFrame(()=>{try{root.FlossFoxPipFollow?.pad();root.FlossFoxPipFollow?.place()}catch(_){}});
root.FlossFoxV6Fabric=Object.freeze({version:'v6-foxglass-built-1',booted:true});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof window!=='undefined'?window:this);
