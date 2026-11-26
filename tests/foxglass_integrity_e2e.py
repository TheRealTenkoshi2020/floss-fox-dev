#!/usr/bin/env python3
"""V6 integration gates on the complete app, with no legacy navigation adapter.

Synthetic isolated profiles only. Hardware, Safari and screen-reader use are not
claimed by this Chromium test. The old-worker test serves the fixed V5 checkout
locally; it never contacts or changes production.
"""
import functools, http.server, io, json, os, pathlib, subprocess, sys, tarfile, tempfile, threading, traceback
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/'
OUT=pathlib.Path(os.environ.get('FF_QA_OUT','test-results/foxglass-integrity'));OUT.mkdir(parents=True,exist_ok=True)
V5='09f381ca8846754cb789d7b8554db966ca537c76'
KEY='flossfox-dev.v1';TK='flossfox-dev.threads.v1';JK='flossfox-dev.stitch-sessions.v1'
PROJECT={'id':'qa-note','name':'GEMINI-V6 notes and sections','notes':'Private details stay in backup','leftOff':'Continue the fox tail at row 37','buyBrand':'dmc','status':'progress','progressPct':37,'items':[{'code':'310','qty':2,'stated':True,'assumed':0,'src':['310 x2'],'stitchCount':None}],'decisions':{},'purchased':{},'created':'2026-11-01T00:00:00Z','updated':'2026-11-01T00:00:00Z'}
STOCK={'schema':2,'threads':{'310':{'n':1,'confirmed':True,'partial':False,'restock':False},'321':{'n':2,'confirmed':False,'partial':False,'restock':False}}}
SESSIONS={'schema':1,'sessions':[{'id':'qa-session','projectId':'qa-note','date':'2026-11-01','stitches':450,'minutes':45,'notes':'Preserve journal history','usage':[]}]}
SEED={KEY:json.dumps({'schema':2,'projects':[PROJECT]}),TK:json.dumps(STOCK),JK:json.dumps(SESSIONS),'flossfox-dev.tour.v1':'{"status":"dismissed"}','flossfox-dev.hints.v1':'off'}
ROWS=[];ERRORS=[]
def ok(label,condition,detail=None):
    condition=bool(condition);ROWS.append({'name':label,'passed':condition,'detail':None if condition else detail});print(('PASS ' if condition else 'FAIL ')+label+('' if condition else ': '+str(detail)),flush=True)
def raw(g):return g.evaluate('ks=>ks.map(k=>localStorage.getItem(k))',[KEY,TK,JK])
def fresh(browser,width=390,workers='block',seed=True,extra=None):
    c=browser.new_context(viewport={'width':width,'height':900},is_mobile=width<701,has_touch=width<701,service_workers=workers,accept_downloads=True,reduced_motion='reduce')
    if seed:c.add_init_script('(()=>{if(!sessionStorage.getItem("fg.integrity.seed")){for(const [k,v] of Object.entries('+json.dumps({**SEED,**(extra or {})})+'))localStorage.setItem(k,v);sessionStorage.setItem("fg.integrity.seed","1")}})()')
    g=c.new_page();g.set_default_timeout(15000);g.on('pageerror',lambda e:ERRORS.append(str(e)));g.on('dialog',lambda d:d.accept());return c,g
def boot(g,route='home'):
    g.goto(BASE+'?nosw#'+route);g.wait_for_function('!!window.FlossFoxV6');g.wait_for_timeout(150)
def nav(g,area):g.locator('#fg-nav [data-fg-area='+area+']').click()
def add(g,label):
    if g.locator('#fg-entry').get_attribute('open') is None:g.click('#fg-entry > summary')
    g.locator('#fg-entry').get_by_role('button',name=label,exact=True).click()
def segment(g,key):g.locator('#fg-project-tabs [data-fg-project='+key+']').click()
def case(name,fn):
    try:fn()
    except Exception as error:ok(name+' completed',False,str(error));traceback.print_exc()

def catalog(browser,width):
    c,g=fresh(browser,width)
    try:
        boot(g,'threads');before=raw(g);add(g,'Choose DMC colors');search=g.get_by_role('searchbox',name='Search the DMC catalog',exact=True)
        search.wait_for();ok(f'{width}: color shortcut reveals catalog and focuses its search',search.is_visible() and search.evaluate('e=>e===document.activeElement'))
        search.fill('B5200');g.locator('#ffSmartStash .ffss-color').filter(has_text='B5200').click();g.locator('#ffSmartStash').get_by_role('button',name='Review selected colors',exact=True).click()
        ok(f'{width}: catalog review changes no saved records',raw(g)==before)
        g.locator('#ffSmartStash').get_by_role('button',name='Cancel review',exact=True).click();ok(f'{width}: cancel catalog review leaves records intact',raw(g)==before)
        g.click('#fg-add-close');add(g,'Paste or import');g.wait_for_selector('#ffssPaste');g.fill('#ffssPaste','WHITE x2\n03 x1\nB5200 x1');g.locator('#ffSmartStash').get_by_role('button',name='Review pasted list',exact=True).click()
        ok(f'{width}: paste shortcut opens original review before saving',g.locator('#ffSmartStash h4').filter(has_text='review before saving').is_visible() and raw(g)==before)
        g.locator('#ffSmartStash button').filter(has_text='Save ').first.click();stored=g.evaluate('k=>JSON.parse(localStorage.getItem(k)).threads',TK)
        ok(f'{width}: reviewed paste preserves special codes and existing quantities',stored['WHITE']['n']==2 and stored['03']['n']==1 and stored['B5200']['n']==1 and stored['310']['n']==1 and not stored['321'].get('confirmed',False))
        g.locator('#ffSmartStash').get_by_role('button',name='Undo this import',exact=True).click();ok(f'{width}: undo import restores exact original records',raw(g)==before)
    finally:c.close()

def notes_and_history(browser,width):
    c,g=fresh(browser,width)
    try:
        boot(g);before=raw(g);g.get_by_role('button',name='Continue project',exact=True).click();g.wait_for_selector('#pTitle');
        for key in ['threads','progress','details','threads','progress']:
            segment(g,key);note=g.locator('.pleftoff');ok(f'{width}: saved left-off note belongs to Progress ({key})',note.is_visible()==(key=='progress'))
            if key=='progress':ok(f'{width}: saved left-off text preserved',g.input_value('#pLeftOff')==PROJECT['leftOff'])
        ok(f'{width}: project section changes never rewrite data',raw(g)==before)
        nav(g,'home');nav(g,'threads');nav(g,'more');g.go_back();g.wait_for_selector('#threadsView');ok(f'{width}: Back restores Threads',g.locator('#threadsView').is_visible());g.go_forward();g.wait_for_selector('#fg-more');ok(f'{width}: Forward restores More',g.locator('#fg-more').is_visible())
        g.locator('#fg-more').get_by_role('button',name='Backup & settings',exact=True).click();g.wait_for_timeout(150);ok(f'{width}: Settings receives keyboard heading focus',g.evaluate('document.activeElement.id')=='settingsTitle')
        nav(g,'home');g.wait_for_timeout(150);ok(f'{width}: Home receives its heading focus',g.locator('#fg-home h1').evaluate('e=>e===document.activeElement'))
        companion=g.locator('.pipc');ok(f'{width}: original live Pip remains reachable on Home',companion.is_visible())
        g.click('#pipMinBtn');ok(f'{width}: Pip still minimizes on Home',g.locator('#pipFaceBtn').is_visible());g.click('#pipFaceBtn')
        ok(f'{width}: Pip restores on Home',g.locator('#pipMinBtn').is_visible())
        if width>=880:
            overlap=g.evaluate('''()=>{const p=document.querySelector('.pipc'),h=document.querySelector('.fg-home-hero');if(!p||!p.getClientRects().length)return false;const a=p.getBoundingClientRect(),b=h.getBoundingClientRect();return a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom}''')
            ok(f'{width}: companion has its own column beside Home',not overlap);g.screenshot(path=str(OUT/f'home-column-{width}.png'),full_page=True)
        g.set_viewport_size({'width':768 if width<701 else 390,'height':900});ok(f'{width}: fold-size change has no horizontal overflow',g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    finally:c.close()

def fallback(browser,mode):
    c,g=fresh(browser)
    try:
        source=(ROOT/'v6/foxglass-v6.js').read_text()
        if mode=='blocked':c.route('**/v6/foxglass-v6.js',lambda r:r.abort())
        else:
            source=source.replace('function installHooks(){',"function installHooks(){throw Error('QA injected integration fault');",1)
            c.route('**/v6/foxglass-v6.js',lambda r:r.fulfill(body=source,content_type='application/javascript'))
        g.goto(BASE+'?nosw#convert');g.wait_for_function('!!window.FlossFoxProjects');g.wait_for_timeout(300);before=raw(g)
        ok(mode+': original app remains visible when V6 cannot activate',not g.locator('html.fg-ready').count() and g.locator('#convertView').is_visible() and g.locator('nav.tabs').is_visible())
        g.fill('#inp','310 x2');g.click('#go');g.wait_for_selector('#summary');ok(mode+': original converter still parses', '310' in g.inner_text('#results'))
        g.click('#tabProjects');ok(mode+': original project navigation still works',g.locator('#projectsView').is_visible());ok(mode+': fallback preserves saved data',raw(g)==before)
    finally:c.close()

def fabric(browser,width):
    c,g=fresh(browser,width)
    try:
        g.goto(BASE+'fabric.html?nosw');g.wait_for_function('!!window.FlossFoxV6Fabric');ok(f'{width}: Fabric has five working workspace links',g.locator('#fg-nav a').count()==5)
        ok(f'{width}: Fabric fits viewport',g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        g.fill('#fcW','140');g.fill('#fcH','100');g.locator('#fcH').blur();ok(f'{width}: original fabric calculation still returns a cut size',bool(g.inner_text('#fcCutNum').strip('– ')))
        g.locator('#fg-nav').get_by_role('link',name='Projects',exact=True).click();g.wait_for_selector('#projectsView');ok(f'{width}: Fabric link returns to actual project workspace',g.locator('#fg-nav [data-fg-area=projects]').get_attribute('aria-current')=='page')
    finally:c.close()

def resume(browser,last_tab):
    prefs={'v':1,'rememberPlace':True,'lastTab':last_tab,'lastProjectId':'qa-note' if last_tab=='projects' else None}
    c,g=fresh(browser,extra={'flossfox-dev.atelier.v1':json.dumps(prefs)})
    try:
        g.goto(BASE+'?nosw');g.wait_for_function('!!window.FlossFoxV6');g.wait_for_timeout(500)
        ok('opted-in resume retains '+last_tab,g.locator('#'+last_tab+'View').is_visible())
        if last_tab=='projects':ok('opted-in resume opens the saved project',g.evaluate('FlossFoxProjects.openId()')=='qa-note')
        g.goto(BASE+'?nosw#convert');g.wait_for_selector('#convertView');ok('explicit URL takes precedence over '+last_tab+' resume',g.locator('#convertView').is_visible())
    finally:c.close()

def large_project_and_photo(browser):
    text=(ROOT/'index.html').read_text();catalog=json.JSONDecoder().raw_decode(text[text.index('const DMC=')+len('const DMC='):])[0]
    large={**PROJECT,'name':'GEMINI-V6 '+('A long fox sampler name ' * 4)[:88],'items':[{**PROJECT['items'][0],'code':code,'src':[code+' x2']} for code in list(catalog)[:150]]}
    c,g=fresh(browser,390,extra={KEY:json.dumps({'schema':2,'projects':[large]})})
    try:
        boot(g);g.get_by_role('button',name='Continue project',exact=True).click();g.wait_for_selector('#fg-project-tabs')
        ok('150-color project opens without lost requirements',g.evaluate('FlossFoxProjects._store().projects[0].items.length')==150)
        for key in ['threads','progress','details']:
            segment(g,key);ok('150-color mobile '+key+' has no horizontal overflow',g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        from PIL import Image
        photo=io.BytesIO();Image.new('RGB',(1600,1200),(134,55,35)).save(photo,'JPEG',quality=90)
        before=g.evaluate('k=>localStorage.getItem(k)',TK);g.set_input_files('#ffaCoverFile',{'name':'synthetic-fox-cover.jpg','mimeType':'image/jpeg','buffer':photo.getvalue()})
        g.wait_for_function('!!FlossFoxProjects._store().projects[0].coverId');ok('real photo input preserves Details selection',g.locator('#fg-project-tabs [data-fg-project=details]').get_attribute('aria-selected')=='true')
        photo_backup=g.evaluate('FlossFoxProjects.fullBackupWithMedia()');ok('full backup includes re-encoded cover photo',photo_backup['media']['count']==1 and photo_backup['version']==2)
        ok('adding a cover never changes stock',g.evaluate('k=>localStorage.getItem(k)',TK)==before)
        record=g.evaluate('''async()=>{const p=FlossFoxProjects._store().projects[0],r=await FlossFoxAtelierMedia.getRecord(p.coverId),data=await r.blob.arrayBuffer();return{w:r.w,h:r.h,n:data.byteLength,mime:r.mime,exif:new TextDecoder('latin1').decode(data).includes('Exif')}}''')
        ok('cover stays within original privacy and size limits',record['w']<=1280 and record['h']<=1280 and record['n']<=200*1024 and record['mime']=='image/jpeg' and not record['exif'],record)
        g.screenshot(path=str(OUT/'large-project-photo-390.png'),full_page=True)
        for width in [640,320]:
            g.set_viewport_size({'width':width,'height':900});nav(g,'home');ok(f'CSS viewport {width} keeps all five navigation targets',g.locator('#fg-nav > button:visible').count()==5 and g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        # These viewport checks model reflow, not physical device/browser zoom.
    finally:c.close()

def tour(browser):
    c,g=fresh(browser,320,seed=False)
    try:
        boot(g);before=raw(g);nav(g,'more');g.locator('#fg-more').get_by_role('button',name='Take the tour',exact=True).click();g.wait_for_selector('#tourCard')
        g.click('#tourCard [data-t=next]');ok('tour step two highlights the actual Add threads entry',g.locator('#fg-entry.tour-target').is_visible())
        g.click('#tourCard [data-t=next]');g.click('#tourCard [data-t=next]');ok('tour empty-shopping target is visible',g.locator('#shopEmpty.tour-target').is_visible())
        ok('tour fits 320px without horizontal overflow',g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        g.click('#tourCard [data-t=close]');ok('tour closes without inventing inventory or projects',raw(g)==before)
    finally:c.close()

def upgrade(browser):
    with tempfile.TemporaryDirectory(prefix='fg-v5-baseline-') as temp:
        old=pathlib.Path(temp);archive=subprocess.check_output(['git','archive',V5],cwd=ROOT)
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:tar.extractall(old,filter='data')
        class Handler(http.server.SimpleHTTPRequestHandler):
            candidate=False
            def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT if type(self).candidate else old),**k)
            def log_message(self,*a):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();origin=f'http://127.0.0.1:{server.server_port}/'
        c,g=fresh(browser,390,'allow')
        try:
            g.goto(origin+'index.html#projects');g.evaluate('navigator.serviceWorker.ready');g.reload();g.wait_for_function('!!navigator.serviceWorker.controller');g.wait_for_function('!!window.FlossFoxProjects')
            # The old app remains in memory until a document reload, even after the worker is replaced.
            actualold=g.evaluate('caches.keys()');ok('real V5 app and worker installed before upgrade',not g.locator('#fg-nav').count() and any('v5' in key for key in actualold),actualold)
            before=raw(g);g.evaluate("caches.open('unrelated-qa-cache')");Handler.candidate=True;g.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())')
            expected='flossfox-dev-v6-foxglass-built-1'
            g.evaluate('''async expected=>{for(let n=0;n<1200;n++){const r=await navigator.serviceWorker.getRegistration(),ks=await caches.keys();if(r?.active?.state==='activated'&&navigator.serviceWorker.controller===r.active&&ks.includes(expected)&&!ks.some(k=>k.startsWith('flossfox-dev-')&&k!==expected))return;await new Promise(r=>setTimeout(r,50))}throw Error('V6 worker upgrade timed out')}''',expected)
            cache=g.evaluate('k=>caches.open(k).then(c=>c.keys()).then(rs=>rs.map(r=>new URL(r.url).pathname))',expected)
            ok('V6 worker precaches all four new presentation assets',all('/v6/'+name in cache for name in ['foxglass-v6.js','foxglass-v6.css','foxglass-fabric.js','foxglass-fabric.css']),len(cache))
            ok('worker update retains unrelated caches',g.evaluate("caches.has('unrelated-qa-cache')"))
            c.set_offline(True);g.goto(origin+'index.html#home');g.reload();g.wait_for_function('!!window.FlossFoxV6');ok('V5 to V6 upgrade preserves projects, stock and journal bytes',raw(g)==before)
            g.get_by_role('button',name='Continue project',exact=True).click();segment(g,'progress');g.click('#ffauSessions > summary');ok('cold offline V6 journal displays prior stitches and manual progress','450 stitches' in g.inner_text('#ffauRecent') and g.input_value('#ffauPercent')=='37')
            nav(g,'shopping');g.click('#fg-combine');g.wait_for_selector('#ffauTrip-310');ok('cold offline combined shopping subtracts confirmed stock once','1 skein' in g.inner_text('#ffauTrip-310 + span'))
            backup=g.evaluate('FlossFoxProjects.fullBackup()');ok('cold offline full backup retains journal and original collection',backup['threads']['threads']['310']['n']==1 and len(backup['stitchSessions']['sessions'])==1)
            for page in ['fabric.html','tools.html','floss-conversion-guide.html','thread-inventory-guide.html','cross-stitch-project-planning.html']:
                g.goto(origin+page);g.wait_for_load_state('domcontentloaded');ok('cold offline '+page,g.locator('h1').count()>=1)
            g.screenshot(path=str(OUT/'offline-guide-390.png'),full_page=True)
        finally:c.close();server.shutdown();server.server_close()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('FF_CHROME','/usr/bin/google-chrome'),args=['--no-sandbox'])
    for width in [320,390,880,1280]:
        case(f'{width} catalog',lambda w=width:catalog(browser,w));case(f'{width} saved notes',lambda w=width:notes_and_history(browser,w));case(f'{width} Fabric',lambda w=width:fabric(browser,w))
    for mode in ['blocked','partial']:case(mode+' fallback',lambda m=mode:fallback(browser,m))
    for tab in ['threads','projects']:case(tab+' resume',lambda t=tab:resume(browser,t))
    case('large project and photo',lambda:large_project_and_photo(browser));case('V6 guided tour',lambda:tour(browser))
    case('real V5 to V6 offline upgrade',lambda:upgrade(browser));browser.close()
ok('no application JavaScript exceptions',not ERRORS,ERRORS)
(OUT/'assertions.json').write_text(json.dumps(ROWS,indent=2)+'\n');failed=sum(not r['passed'] for r in ROWS);print(f'{len(ROWS)-failed} passed, {failed} failed',flush=True);sys.exit(int(bool(failed)))
