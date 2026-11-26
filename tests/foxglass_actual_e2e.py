#!/usr/bin/env python3
"""Foxglass against the complete app, isolated profiles and synthetic records; no legacy UI shim."""
import json,os,pathlib,re,sys,traceback
from playwright.sync_api import sync_playwright
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/'
OUT=pathlib.Path(os.environ.get('FF_QA_OUT','test-results/foxglass-browser'));OUT.mkdir(parents=True,exist_ok=True)
KEY='flossfox-dev.v1';TK='flossfox-dev.threads.v1';results=[];errors=[]
def ok(name,value,detail=None):
 value=bool(value);results.append({'name':name,'passed':value,'detail':detail if not value else None});print(('PASS ' if value else 'FAIL ')+name+('' if value else ' '+str(detail)),flush=True);return value
def nav(g,area):
 g.locator('#fg-nav [data-fg-area="'+area+'"]').click();g.wait_for_timeout(100)
def segment(g,name):g.get_by_role('tab',name=name,exact=True).click();g.wait_for_timeout(100)
def raw(g):return g.evaluate('([p,t])=>[localStorage.getItem(p),localStorage.getItem(t)]',[KEY,TK])
def ready(g):g.wait_for_function('!!window.FlossFoxV6&&!!window.FlossFoxAtelier')
def project(pid,a,b,updated):return {'id':pid,'name':'GEMINI-V6-'+pid,'notes':'Synthetic notes','buyBrand':'dmc','status':'progress','items':[{'code':c,'qty':n,'stated':True,'assumed':0,'src':['DMC '+c+' x'+str(n)],'stitchCount':None} for c,n in [('310',a),('321',b)]],'decisions':{'310':{'status':'buy'},'321':{'status':'buy'}},'purchased':{},'created':updated,'updated':updated}
PROJECTS={'schema':2,'projects':[project('qa-a',2,1,'2026-11-01T00:00:00Z'),project('qa-b',3,2,'2026-11-02T00:00:00Z')]}
STOCK={'schema':2,'threads':{'310':{'n':1,'confirmed':True,'partial':False,'restock':False},'321':{'n':2,'confirmed':False,'partial':False,'restock':False}}}
def context(b,width,theme='morning',populated=False):
 c=b.new_context(viewport={'width':width,'height':900},is_mobile=width<701,has_touch=width<701,service_workers='block',reduced_motion='reduce')
 seed={'flossfox-dev.tour.v1':json.dumps({'status':'dismissed'}),'flossfox-dev.hints.v1':'off','flossfox-dev.atelier.v1':json.dumps({'v':1,'theme':theme,'rememberPlace':False})}
 if populated:seed.update({KEY:json.dumps(PROJECTS),TK:json.dumps(STOCK)})
 c.add_init_script('s=>{}' if False else '(()=>{if(!sessionStorage.getItem("fg.qa.seeded")){const s='+json.dumps(seed)+';for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem("fg.qa.seeded","1")}})()')
 return c

def contrast(g,selector):
 colors=g.locator(selector).evaluate('(e)=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor]}')
 def lum(v):
  a=[float(x)/255 for x in re.findall(r'[\d.]+',v)[:3]];a=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in a];return sum(x*y for x,y in zip(a,[.2126,.7152,.0722]))
 a,b=map(lum,colors);return (max(a,b)+.05)/(min(a,b)+.05)
def unobscured(g):return g.evaluate('''()=>{const p=document.querySelector('.pipc');if(!p||!p.getClientRects().length||getComputedStyle(p).visibility==='hidden')return true;const r=p.getBoundingClientRect();return [...document.querySelectorAll('#fg-home button,#fg-more button,#fg-more a')].filter(e=>e.getClientRects().length).every(e=>{const b=e.getBoundingClientRect();return b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom})}''')

def fresh(g,width,theme):
 tag=f'{width} {theme}';g.goto(BASE+'?nosw');ready(g);before=raw(g)
 ok(tag+' five visible workspaces',g.locator('#fg-nav > button:visible').count()==5)
 ok(tag+' Home visible without onboarding gate',g.locator('#fg-home').is_visible() and g.locator('#ffLanding').is_hidden())
 ok(tag+' exactly one selected workspace',g.locator('#fg-nav [aria-current="page"]').count()==1)
 ok(tag+' no fake Continue for empty data',g.get_by_role('button',name='Continue project',exact=True).count()==0)
 ok(tag+' Home actions clear of Pip',unobscured(g))
 ok(tag+' selected navigation text contrast >=4.5',contrast(g,'#fg-nav .fg-active')>=4.5)
 g.click('#askPipBtn');ok(tag+' Home contextual help',g.locator('#askPip .ffhelp').get_attribute('data-ffscreen')=='home')
 g.locator('#askPip [data-fftabnext]').click();ok(tag+' Home guidance reveals converter',g.locator('#convertView').is_visible())
 nav(g,'home');g.click('#ffSearchBtn');nav(g,'more');ok(tag+' Home to More dismisses Search',g.locator('#ffSearch').is_hidden())
 g.click('#askPipBtn');ok(tag+' More contextual help',g.locator('#askPip .ffhelp').get_attribute('data-ffscreen')=='more');g.locator('#askPip [data-a=close]').click()
 ok(tag+' More actions clear of Pip',unobscured(g))
 g.screenshot(path=str(OUT/f'more-{width}-{theme}.png'),full_page=True)
 nav(g,'threads');ok(tag+' one Add threads entry',g.locator('#fg-entry > summary:visible').count()==1 and g.locator('.thquick').is_hidden())
 g.locator('#fg-entry > summary').click();g.get_by_role('button',name='Quick add',exact=True).click();g.fill('#thAdd','310 x2');g.click('#fg-add-close')
 g.click('#ffSearchBtn');g.fill('#ffSearchIn','823');g.keyboard.press('Enter');g.locator('#ffSearchDetail [data-search-add]').click()
 visible=g.locator('#thAdd').is_visible();ok(tag+' search shortcut reveals quick-add mode and preserves draft',visible and '310 x2' in g.input_value('#thAdd') and '823' in g.input_value('#thAdd'))
 ok(tag+' navigation/search/draft never save inventory or projects',raw(g)==before)
 if not visible:g.locator('#fg-entry > summary').click();g.get_by_role('button',name='Quick add',exact=True).click()
 g.click('#thAddBtn');stock=g.evaluate('k=>JSON.parse(localStorage.getItem(k)).threads',TK)
 ok(tag+' explicit save preserves confirmed and uncertain quantities',stock['310']['n']==2 and stock['310']['confirmed'] and stock['823']['n']==1 and not stock['823'].get('confirmed'))
 segment(g,'Find & convert');g.fill('#inp','310 x2\n321 x1');g.click('#go');g.wait_for_selector('#ffStudio .ffa-cmp')
 ok(tag+' converter headings retain V5 fix','in DMC' not in g.locator('#ffStudio .ffa-cmp h3').first.inner_text())
 g.fill('#newProjName','GEMINI-V6-created-'+str(width));g.click('#saveProj');g.wait_for_selector('#fg-project-tabs');ok(tag+' real UI creates project with V6 sections',g.locator('#fg-project-tabs [role=tab]').count()==3 and g.locator('#pThreads').is_visible())
 segment(g,'Progress');ok(tag+' journal present in Progress',g.locator('#ffauSessions').is_visible())
 if g.locator('#ffauSessions').get_attribute('open') is None:g.locator('#ffauSessions > summary').click()
 g.fill('#ffauStitches','150');g.fill('#ffauMinutes','15');g.get_by_role('button',name='Save stitching session',exact=True).click()
 g.fill('#ffauPercent','37');g.get_by_role('button',name='Update percentage',exact=True).click()
 ok(tag+' Progress survives dynamic rerender',g.locator('#fg-project-tabs [data-fg-project=progress]').get_attribute('aria-selected')=='true' and g.locator('#ffauSessions').is_visible())
 ok(tag+' logging stitches and percent does not consume stock',g.evaluate('k=>JSON.parse(localStorage.getItem(k)).threads',TK)==stock)
 segment(g,'Details & prep');ok(tag+' prep shortcuts and original details reachable',g.locator('#fg-prep-shortcuts').is_visible() and g.locator('#pDetails').is_visible())
 g.get_by_role('button',name='Import a pattern PDF',exact=True).click();g.wait_for_selector('#ffPatternDialog[open]');g.keyboard.press('Escape')
 ok(tag+' PDF importer opens and cancels through original handler',g.locator('#ffPatternDialog[open]').count()==0)
 segment(g,'Threads');ok(tag+' original project threads remain reachable',g.locator('#pThreads').is_visible())
 nav(g,'home');ok(tag+' Home continues real created project',g.get_by_role('button',name='Continue project',exact=True).is_visible())
 g.screenshot(path=str(OUT/f'home-{width}-{theme}.png'),full_page=True)
 ok(tag+' no horizontal overflow',g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
 ok(tag+' workspace touch targets >=44px',g.locator('#fg-nav button').evaluate_all('(xs)=>xs.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})'))
 g.locator('#fg-nav button').first.focus();g.keyboard.press('End');ok(tag+' keyboard End reaches More',g.evaluate('document.activeElement.dataset.fgArea')=='more')
 g.keyboard.press('Home');ok(tag+' keyboard Home reaches Home',g.evaluate('document.activeElement.dataset.fgArea')=='home')


def populated(g,width):
 tag=f'{width} populated';g.goto(BASE+'?nosw');ready(g)
 ok(tag+' newest unfinished project on Home','GEMINI-V6-qa-b' in g.inner_text('#fg-home'))
 # Open A, then return Home showing B. Its shopping shortcut must use B, not stale A.
 nav(g,'projects');g.locator('[data-open="qa-a"]').click();nav(g,'home');g.locator('#fg-home').get_by_role('button',name='Shopping list',exact=True).click()
 ok(tag+' Home shopping opens its displayed project',g.evaluate('FlossFoxProjects.openId()')=='qa-b')
 nav(g,'shopping');g.click('#fg-combine');g.wait_for_selector('#ffauTrip-310');before=raw(g)
 txt=g.inner_text('#ffauTrip-310 + span');ok(tag+' combined 310 needs four', '4 skein' in txt,txt)
 ok(tag+' uncertain 321 remains check-first','321' in g.text_content('#ffauTrip details'))
 g.check('#ffauTrip-310');g.uncheck('#ffauPick-qa-b');ok(tag+' scope change recomputes immediately','1 skein' in g.inner_text('#ffauTrip-310 + span'))
 g.check('#ffauPick-qa-b');ok(tag+' restoring scope recomputes four','4 skein' in g.inner_text('#ffauTrip-310 + span'))
 ok(tag+' Found and scope selection never change projects or stock',raw(g)==before)
 nav(g,'more');g.locator('#fg-more').get_by_role('button',name='Backup & settings',exact=True).click();g.click('#askPipBtn')
 ok(tag+' Settings help survives new workspaces',g.locator('#askPip .ffhelp').get_attribute('data-ffscreen')=='settings');g.locator('#askPip [data-a=close]').click()
 g.click('#ffSearchBtn');g.click('#askPipBtn');ok(tag+' Ask Pip closes Search',g.locator('#ffSearch').is_hidden() and g.locator('#askPip').is_visible())
 g.click('#ffSearchBtn');ok(tag+' Search closes Ask Pip',g.locator('#askPip').is_hidden() and g.locator('#ffSearch').is_visible());g.keyboard.press('Escape')


def route_case(g,route,expected):
 g.goto(BASE+'?nosw#'+route);ready(g);g.wait_for_timeout(180)
 selector={'home':'#fg-home','threads':'#threadsView','convert':'#convertView','projects':'#projectsView','shopping':'#shopView','more':'#fg-more','help':'#helpView','settings':'#settingsView','den':'#threadwoodView'}[expected]
 ok('direct route '+route,g.locator(selector).is_visible(),g.url)

with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('FF_CHROME','/usr/bin/google-chrome'),args=['--no-sandbox'])
 for width,theme in [(320,'morning'),(360,'moon'),(390,'forest'),(430,'morning'),(600,'moon'),(768,'forest'),(880,'morning'),(1280,'moon')]:
  c=context(b,width,theme);g=c.new_page();g.set_default_timeout(12000);g.on('pageerror',lambda e:errors.append(str(e)))
  try:fresh(g,width,theme)
  except Exception as e:ok(f'{width} fresh flow completed',False,str(e));traceback.print_exc();g.screenshot(path=str(OUT/f'failure-{width}.png'),full_page=True)
  finally:c.close()
 for width in [320,1280]:
  c=context(b,width,'morning',True);g=c.new_page();g.set_default_timeout(12000);g.on('pageerror',lambda e:errors.append(str(e)))
  try:populated(g,width)
  except Exception as e:ok(f'{width} populated flow completed',False,str(e));traceback.print_exc();g.screenshot(path=str(OUT/f'populated-failure-{width}.png'),full_page=True)
  finally:c.close()
 for route,expected in [('home','home'),('workbasket','home'),('threads','threads'),('convert','convert'),('threads/stash','threads'),('threads/convert','convert'),('projects','projects'),('shop','shopping'),('shop/combined','shopping'),('more','more'),('help','help'),('settings','settings'),('threadwood','den')]:
  c=context(b,390);g=c.new_page();g.set_default_timeout(12000)
  try:route_case(g,route,expected)
  except Exception as e:ok('direct route '+route,False,str(e))
  finally:c.close()
 b.close()
ok('no application JavaScript errors',not errors,errors)
(OUT/'assertions.json').write_text(json.dumps(results,indent=2)+'\n')
passed=sum(r['passed'] for r in results);failed=len(results)-passed;print(f'{passed} passed, {failed} failed',flush=True);sys.exit(int(bool(failed)))
