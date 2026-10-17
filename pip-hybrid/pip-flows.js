/* Offline guided help: small curated state machine, no dynamic code, no storage.
 * Every link points to an existing route. Prompts are guidance, not mutations. */
(function(root){
 'use strict';
 const FLOWS={
  start:{title:'Start a first project',opening:'Do you already have a DMC thread list?',choices:[{label:'Yes, I have the color list',next:'start-list'},{label:'No, I’m brand new',next:'start-new'}]},
  'start-list':{title:'Add your thread list',answer:'Open Find My Floss, enter your DMC colors (one per line is easiest), then tap Add my colors. Review any highlighted entries before saving a project.',action:{label:'Open Find My Floss',href:'index.html#convert'}},
  'start-new':{title:'Begin with a small pattern',answer:'Pick a pattern with a clear symbol key. Find its fabric count, finished dimensions and thread list. You can import PDF text legends from the pattern-import tool after review. Full chart-grid interpretation is not guaranteed.',action:{label:'Open the guided tour',href:'index.html#help'}},
  knots:{title:'Fix tangles and knots',opening:'Where does the trouble happen most often?',choices:[{label:'Thread twists as I stitch',next:'knots-twist'},{label:'Knots appear underneath',next:'knots-back'},{label:'Thread frays or breaks',next:'knots-fray'}]},
  'knots-twist':{title:'Release thread twist',answer:'Pause and let the needle and thread hang freely to untwist. Try a shorter working length; avoid pulling each stitch too hard.'},
  'knots-back':{title:'Check the reverse side',answer:'Stop before pulling harder. Check whether the working thread caught a loop or earlier stitch on the back. Free the snag gently, then continue using consistent tension.'},
  'knots-fray':{title:'Reduce fraying',answer:'Try a fresh, shorter thread and a blunt tapestry needle suitable for the fabric. Check for a rough needle eye and avoid repeated dragging of the same thread through dense areas.'},
  coverage:{title:'Thread coverage',opening:'What looks wrong with the stitches?',choices:[{label:'I can see fabric between stitches',next:'coverage-thin'},{label:'My stitches look bulky',next:'coverage-thick'}]},
  'coverage-thin':{title:'Improve coverage',answer:'Check the pattern’s fabric count and strand guidance first. Keep each stitch’s tension even and lay the strands side by side. Test a small sample before changing strand counts; more strands will use more floss.'},
  'coverage-thick':{title:'Reduce bulk',answer:'Confirm strand count and needle size against your fabric and pattern. Avoid over-tightening. Work a small test swatch before changing the whole project.'},
  shopping:{title:'Plan your purchases',opening:'Which part is confusing?',choices:[{label:'What colors do I need?',next:'shopping-colors'},{label:'How much thread do I need?',next:'shopping-amounts'},{label:'What do I already own?',next:'shopping-stash'}]},
  'shopping-colors':{title:'Check missing colors',answer:'Save your color list as a project, mark each color Have enough, Need to buy or Not sure, then use Shop my list. Review uncertain items before spending.',action:{label:'Open My Projects',href:'index.html#projects'}},
  'shopping-amounts':{title:'Estimate skeins',answer:'Use Pip’s skein estimator with your stitch count, fabric count, strand count and allowance. The community average is provisional, so allow for personal technique and waste. Do not treat a single average as a guarantee.',action:{label:'Open Find My Floss',href:'index.html#convert'}},
  'shopping-stash':{title:'Review existing floss',answer:'Use My Thread Collection to track full and partial skeins. If your quantity is uncertain, confirm it physically before marking that you have enough.',action:{label:'Open My Thread Collection',href:'index.html#threads'}},
  backup:{title:'Protect your projects',opening:'What do you want to do?',choices:[{label:'Save a backup',next:'backup-save'},{label:'Move to another device',next:'backup-move'},{label:'Undo an import',next:'backup-undo'}]},
  'backup-save':{title:'Download a backup',answer:'Open My Projects and download a current backup before major edits. Store it somewhere you can find again. Browser data is not synced automatically.',action:{label:'Open My Projects',href:'index.html#projects'}},
  'backup-move':{title:'Move between devices',answer:'Download a backup from your original device, then import the file on the destination. Check the preview and merge/replace choice carefully before confirming.',action:{label:'Open My Projects',href:'index.html#projects'}},
  'backup-undo':{title:'Undo an import',answer:'Use the visible import Undo option where available. Some undo options expire after a reload or another import. Restore from an independently saved backup if needed; preview carefully.',action:{label:'Open My Projects',href:'index.html#projects'}}
 };
 const MENU=[{id:'start',label:'New project'},{id:'knots',label:'Thread tangles'},{id:'coverage',label:'Stitch coverage'},{id:'shopping',label:'Shopping help'},{id:'backup',label:'Backups'}];
 function step(id){const s=Object.prototype.hasOwnProperty.call(FLOWS,id)?FLOWS[id]:null;return s?{...s,choices:s.choices?.map(x=>({...x})),action:s.action?{...s.action}:null}:null}
 const api=Object.freeze({menu:MENU.map(x=>({...x})),step});root.FlossFoxPipFlows=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
