#!/usr/bin/env python3
"""Actual-app Gemini navigation feedback, fresh isolated profiles and synthetic drafts.
FF_CHROME=/usr/bin/chromium python3 tests/v5_navigation_feedback_e2e.py URL
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8776/').rstrip('/')+'/'
KEY='flossfox-dev.v1'; TK='flossfox-dev.threads.v1'
passed=0; failed=0; errors=[]
def ok(name,value,detail=''):
    global passed,failed
    if value:passed+=1
    else:failed+=1
    print(('PASS ' if value else 'FAIL ')+name+('' if value else ': '+str(detail)),flush=True)
def nav(g,name):
    if not g.locator('#tab'+name).is_visible():g.click('#ffuxNavSummary')
    g.click('#tab'+name);g.wait_for_timeout(180)
def snapshot(g):return g.evaluate('([k,t])=>[localStorage.getItem(k),localStorage.getItem(t)]',[KEY,TK])
def helpkey(g):return g.locator('#askPip .ffhelp').get_attribute('data-ffscreen') if g.locator('#askPip .ffhelp').count() else None
def search(g,q):
    if not g.is_visible('#ffSearch'):g.click('#ffSearchBtn')
    g.fill('#ffSearchIn',q)
    g.wait_for_function('q=>document.querySelector("#ffSearchList")?.textContent.includes(q)',arg=q)
def clearof(g):return g.evaluate('''()=>{const a=document.querySelector('#askPip').getBoundingClientRect(),b=document.querySelector('.pipc').getBoundingClientRect();return !b.width||!b.height||a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1}''')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('FF_CHROME','/usr/bin/chromium'),args=['--no-sandbox'])
    for width,theme in [(320,'morning'),(390,'moon'),(880,'morning'),(1280,'moon')]:
        tag=f'{width} {theme}'
        c=browser.new_context(viewport={'width':width,'height':600 if width>=880 else 900},is_mobile=width<500,has_touch=width<500,service_workers='block',reduced_motion='reduce')
        c.add_init_script("localStorage.setItem('flossfox-dev.tour.v1','{\"status\":\"dismissed\"}');localStorage.setItem('flossfox-dev.hints.v1','off');localStorage.setItem('flossfox-dev.atelier.v1',"+json.dumps(json.dumps({'v':1,'theme':theme,'rememberPlace':False}))+')')
        g=c.new_page();g.set_default_timeout(10000);g.on('pageerror',lambda e:errors.append(str(e)))
        g.goto(BASE+'?nosw');g.wait_for_function('!!window.FlossFoxAtelier&&!!window.FlossFoxGuidedUX&&!!window.FlossFoxTour')
        ok(tag+' welcome retains three primary choices',g.locator('#ffLanding .choices > a.ch').count()==3)
        g.locator('#ffLanding a[data-tab="tabConvert"]').click()
        g.wait_for_timeout(180);before=snapshot(g)
        nav(g,'Threads');summary=g.locator('#thMoreAdd > summary');summary.wait_for(state='visible')
        summary.focus();ok(tag+' focusing a folded heading does not open its own section',g.locator('#thMoreAdd').get_attribute('open') is None)
        g.keyboard.press('Space');ok(tag+' Space opens the focused section once',g.locator('#thMoreAdd').get_attribute('open') is not None and g.locator('#ffauImport').is_visible())
        g.keyboard.press('Space');g.locator('#thAdd').focus();summary.click()
        ok(tag+' one mouse tap opens a previously unfocused section',g.locator('#thMoreAdd').get_attribute('open') is not None and g.locator('#ffauImport').is_visible())
        ok(tag+' Workbasket available before first save',g.locator('#tabWorkbasket').is_visible())
        navBefore=g.evaluate('[...document.querySelectorAll("nav.tabs > button")].filter(e=>!e.hidden).map(e=>e.id)')
        nav(g,'Projects')
        imports=g.get_by_role('button',name='Import a pattern (PDF)',exact=True).all()
        ok(tag+' empty Projects has one visible PDF import',sum(x.is_visible() for x in imports)==1)
        visible=next(x for x in imports if x.is_visible());visible.click();g.wait_for_selector('#ffPatternDialog[open]');g.keyboard.press('Escape')
        ok(tag+' project import still opens and cancels without saving',snapshot(g)==before)
        nav(g,'Convert');g.fill('#inp','310 x2\n666');g.click('#go');g.wait_for_selector('#ffStudio .ffa-cmp')
        titles=g.locator('#ffStudio .ffa-cmp h3').all_text_contents()
        ok(tag+' same-brand headings omit redundant in DMC',titles and all('in DMC' not in t for t in titles),titles)
        nav(g,'Projects');g.click('#askPipBtn')
        ok(tag+' project help is contextual',helpkey(g)=='projects',helpkey(g))
        nav(g,'Settings')
        ok(tag+' open help follows Settings with existing results',helpkey(g)=='settings' and 'Backup and settings' in g.inner_text('#askPip'),g.inner_text('#askPip')[:200])
        ok(tag+' Settings help and companion do not overlap',clearof(g))
        ok(tag+' quick help explains chat entry','Quick help for this page' in g.inner_text('#askPip') and g.locator('#askPip [data-piph-open]').count()==1)
        # Programmatic navigation, used by Continue/deep-link actions, must refresh the same open card too.
        g.evaluate("FlossFoxProjects.showView('threads')");g.wait_for_timeout(180)
        ok(tag+' open help follows programmatic navigation',helpkey(g)=='threads',helpkey(g))
        if g.is_visible('#tabWorkbasket'):nav(g,'Workbasket')
        else:g.evaluate("FlossFoxProjects.showView('workbasket')");g.wait_for_timeout(180)
        ok(tag+' Workbasket has its own help',helpkey(g)=='workbasket',helpkey(g))
        g.keyboard.press('Escape');search(g,'666')
        ok(tag+' search lists results while typing without Enter','DMC 666' in g.inner_text('#ffSearchList'))
        # Rapid typing followed by Enter must select the current query, not a stale prior result.
        g.fill('#ffSearchIn','823');g.keyboard.press('Enter');g.wait_for_timeout(180)
        ok(tag+' immediate Enter uses current query','DMC 823' in g.inner_text('#ffSearchDetail'),g.inner_text('#ffSearchDetail')[:120])
        search(g,'Anchor 46');g.locator('#ffSearchList [role=option]').filter(has_text='Anchor 46').first.click()
        ok(tag+' missing Anchor swatch is explicitly explained','No screen color available' in g.inner_text('#ffSearchDetail'))
        ok(tag+' search and navigation never save requirements or stock',snapshot(g)==before)
        nav(g,'Threads')
        ok(tag+' changing tab closes search without stealing focus',g.is_hidden('#ffSearch') and g.evaluate("document.activeElement.id==='tabThreads'"))
        if g.is_visible('#ffSearch'):g.keyboard.press('Escape')
        # Existing unsaved inventory draft must survive the shortcut.
        g.fill('#thAdd','310 x2');search(g,'666');g.keyboard.press('Enter')
        add=g.locator('#ffSearchDetail [data-search-add]')
        ok(tag+' DMC preview offers Add to My threads',add.count()==1)
        if add.count():
            add.click();g.wait_for_timeout(180)
            draft=g.input_value('#thAdd')
            ok(tag+' shortcut preserves draft and focuses inventory input','310 x2' in draft and '666' in draft and g.evaluate("document.activeElement.id==='thAdd'"),draft)
            ok(tag+' shortcut waits for explicit inventory save',snapshot(g)==before)
            g.click('#thAddBtn');g.wait_for_timeout(180)
            stock=g.evaluate('k=>JSON.parse(localStorage.getItem(k)).threads',TK)
            ok(tag+' explicit add keeps stated and unknown counts separate',stock['310']['n']==2 and stock['310']['confirmed'] is True and stock['666']['n']==1 and not stock['666'].get('confirmed'))
            ok(tag+' Workbasket tab layout stays stable after first save',navBefore==g.evaluate('[...document.querySelectorAll("nav.tabs > button")].filter(e=>!e.hidden).map(e=>e.id)'))
        ok(tag+' no horizontal overflow',g.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        ok(tag+' primary navigation retains 44px touch targets',g.evaluate('[...document.querySelectorAll("nav.tabs > button, #ffuxNavSummary")].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})'))
        if g.is_visible('#ffSearch'):g.keyboard.press('Escape')
        nav(g,'Projects');g.click('#newEmpty');g.wait_for_selector('#projEdit:not([hidden])');g.click('#pClose')
        ok(tag+' populated Projects retains its single PDF import',g.locator('#patLaunchProjects').is_visible() and g.locator('#emptyImport').count()==0)
        # Real history changes must update open help without requiring a new Ask Pip click.
        g.click('#askPipBtn');nav(g,'Settings');g.go_back();g.wait_for_timeout(180)
        ok(tag+' open help follows browser Back',helpkey(g)=='projects',helpkey(g))
        g.keyboard.press('Escape')
        nav(g,'Settings');g.click('#askPipBtn');g.wait_for_timeout(150)
        ok(tag+' all quick-help buttons meet 44px touch targets',g.evaluate('[...document.querySelectorAll("#askPip button")].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})'))
        ok(tag+' help remains clear of Pip in short or narrow viewports',clearof(g))
        if os.environ.get('FF_QA_SHOTS'):
            os.makedirs(os.environ['FF_QA_SHOTS'],exist_ok=True)
            g.screenshot(path=os.path.join(os.environ['FF_QA_SHOTS'],f'help-{width}.png'))
        if g.locator('#askPip [data-piph-open]').count():
            g.locator('#askPip [data-piph-open]').click()
            ok(tag+' existing local chat remains reachable',g.locator('dialog[open] textarea').count()==1)
            g.keyboard.press('Escape')
        c.close()
    browser.close()
ok('no JavaScript errors',not errors,errors)
print(f'\n{passed} passed, {failed} failed (isolated Chromium emulation)',flush=True)
sys.exit(1 if failed else 0)
