"""Opt-in navigation adapter for older V5 workflow tests.

Use real V6 buttons and sections when a legacy test names an old navigation
control. Never alter visibility assertions, app storage, calculated results or
application implementations. New V6 UX tests run without this adapter.
"""
import re
from playwright.sync_api import Page, Locator
PC=Page.click
META='''s=>{let e;try{e=document.querySelector(s)}catch(_){return null}if(!document.documentElement.classList.contains('fg-ready'))return null;if(!e)return null;
const v=e.closest('#convertView,#threadsView,#projectsView,#shopView,#settingsView,#helpView,#threadwoodView');let section=null;const m=e.closest('#pMore');if(m){let c=e;while(c.parentElement&&c.parentElement!==m)c=c.parentElement;section=['pProgress','pSession','ffauSessions'].includes(c.id)||c.classList.contains('pleftoff')?'progress':'details'}else if(e.closest('#pThreads,#pCmp,#pReady,#pTrust'))section='threads';
return {id:e.id,view:v&&v.id,section,quick:!!e.closest('.thquick'),smart:!!e.closest('#ffSmartStash'),visible:!!e.getClientRects().length}}'''
TABS={'tabWorkbasket':'home','tabConvert':'convert','tabThreads':'stash','tabProjects':'projects','tabShop':'shopping','tabSettings':'settings','tabHelp':'help','tabThreadwood':'den'}
def click(g,s):return PC(g,s)
def area(g,name):
 if name in ['convert','stash']:
  if not g.locator('#fg-thread-tabs').is_visible():click(g,'#fg-nav [data-fg-area=threads]')
  click(g,'#fg-thread-tabs [data-fg-thread="'+name+'"]');return
 if name in ['settings','help','den']:
  click(g,'#fg-nav [data-fg-area=more]')
  labels={'settings':'Backup & settings','help':'Help & tutorials','den':"Pip's Den"};g.locator('#fg-more').get_by_role('button',name=labels[name],exact=True).click();return
 click(g,'#fg-nav [data-fg-area="'+name+'"]')
def section(g,key):
 b=g.locator('#fg-project-tabs [data-fg-project="'+key+'"]')
 if b.count() and b.get_attribute('aria-selected')!='true':click(g,'#fg-project-tabs [data-fg-project="'+key+'"]')
def add_mode(g,kind):
 if g.locator('#threadsView').get_attribute('data-fg-add-mode')==kind:return
 if g.locator('#fg-entry').get_attribute('open') is None:click(g,'#fg-entry > summary')
 label='Quick add' if kind=='quick' else 'Paste or import'
 g.locator('#fg-entry').get_by_role('button',name=label,exact=True).click()
def route(g,sel,action):
 try:
  if not g.evaluate('document.documentElement.classList.contains("fg-ready")'):return False
  match=re.fullmatch(r'\s*(?:nav\.tabs\s+)?#(tab\w+)\s*',sel)
  if match and match[1] in TABS and action=='click':area(g,TABS[match[1]]);return True
  if sel in ['#pMore > summary','#pMore summary'] and action=='click':section(g,'details');return True
  if sel=='#ffauImport' and action=='click':
   if not g.locator('#threadsView').is_visible():area(g,'stash')
   add_mode(g,'import');return True
  meta=g.evaluate(META,sel)
  if not meta:return False
  view=meta['view'];names={'convertView':'convert','threadsView':'stash','projectsView':'projects','shopView':'shopping','settingsView':'settings','helpView':'help','threadwoodView':'den'}
  if view and not g.locator('#'+view).is_visible():area(g,names[view])
  if meta['section']:section(g,meta['section'])
  if view=='threadsView':
   if meta['quick']:add_mode(g,'quick')
   elif meta['smart']:add_mode(g,'import')
 except Exception:
  # A failure to prepare navigation never fabricates a successful action.
  # Playwright executes the original selector and reports its own real error.
  return False
 return False
for name in ['click','fill','check','uncheck','select_option','set_input_files','focus']:
 original=getattr(Page,name)
 def wrap_page(method,original):
  def wrapped(self,selector,*args,**kwargs):
   if isinstance(selector,str) and route(self,selector,method):return None
   return original(self,selector,*args,**kwargs)
  return wrapped
 setattr(Page,name,wrap_page(name,original))
 original_locator=getattr(Locator,name)
 def wrap_locator(method,original):
  def wrapped(self,*args,**kwargs):
   sel=self._impl_obj._selector
   if route(self.page,sel,method):return None
   return original(self,*args,**kwargs)
  return wrapped
 setattr(Locator,name,wrap_locator(name,original_locator))
