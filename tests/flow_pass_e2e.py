"""Flow pass (dev): short paths to the main action on every tab.
Usage: FF_KEY=flossfox-dev.v1 python3 tests/flow_pass_e2e.py URL
The real-pattern check uses a PRIVATE local PDF (not in the repo). Set FLOW_PDF to its path; it is skipped when missing."""
import sys, os, json
from playwright.sync_api import sync_playwright
B = sys.argv[1]; KEY = os.environ.get('FF_KEY', 'flossfox-dev.v1'); PFX = KEY.replace('.v1', '')
PDF = os.environ.get('FLOW_PDF', '/workspace/flow-pass/myke-example.pdf')
R = []
def ok(n, c, d=''):
    R.append(c); print(('PASS ' if c else 'FAIL ') + n + ('' if c else f'  -> {str(d)[:300]}'))
SEED = "if(!sessionStorage.getItem('seeded')){localStorage.setItem('%s.tour.v1','{\"status\":\"dismissed\"}');localStorage.setItem('%s.hints.v1','off');sessionStorage.setItem('seeded','1')}" % (PFX, PFX)
KEY15 = ['310', 'WHITE', '415', '01', '797', '762', '3799', '225', '434', '3862', '648', '433', '647', '948', '03']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    def page(w=390, h=844, init=''):
        c = b.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 600, has_touch=w < 600, device_scale_factor=1); c.add_init_script(SEED + ';' + init)
        g = c.new_page(); g.errs = []; g.on('pageerror', lambda e: g.errs.append(str(e))); g.on('dialog', lambda d: d.accept()); g.goto(B); g.wait_for_timeout(400); return g
    def store(g): return g.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))||{{projects:[]}}")
    def threads(g): return g.evaluate(f"JSON.parse(localStorage.getItem('{PFX}.threads.v1'))||{{}}")
    # ---- Item 2: real pattern PDF import
    if os.path.exists(PDF):
        g = page()
        g.evaluate("FFImportOpen()"); g.set_input_files('#patFile', PDF)
        g.wait_for_function("!/Reading selected file/.test(document.getElementById('patInfo').textContent)", timeout=60000); g.wait_for_timeout(300)
        codes = g.evaluate("[...document.querySelectorAll('#patRows .pat-row b')].map(b=>b.firstChild.textContent.replace('DMC ',''))")
        ok('F2a the real pattern imports exactly its 15 key colors', sorted(codes) == sorted(KEY15), codes)
        ok('F2b no chart row or column numbers became colors', not any(c in codes for c in ['48', '51', '52', '53', '57', '69']), codes)
        src01 = g.evaluate("(document.querySelector('#patRow-01 small')||{}).textContent||''")
        ok('F2c DMC 01 comes from the key line, not "108 x 59 Stitches"', 'White Tin' in src01 and 'Stitch' not in src01, src01)
        txt = g.inner_text('#patCheck') if g.locator('#patCheck').count() else ''
        ok('F2d no false "listed more than once" flags for a key printed on several pages', 'more than once' not in txt, txt)
        ok('F2e no "never show up in the chart" flag for colors not in the key', 'never show up' not in txt and 'DMC 06' not in txt and 'DMC 05' not in txt, txt)
        vis = g.evaluate("(()=>{const e=document.getElementById('patAll'),b=document.getElementById('patImport'),v=innerHeight;const r1=e.getBoundingClientRect(),r2=b.getBoundingClientRect();return r1.top>=0&&r1.bottom<=v&&r2.top>=0&&r2.bottom<=v})()")
        ok('F2f the confirm tick and Create project are on screen without scrolling', vis)
        h = g.evaluate("document.getElementById('patRows').scrollHeight")
        ok('F2g the review list is short (under 1700px for 15 colors on a phone)', h < 1700, h)
        ok('F2h "no amounts" is said once, not on every row', g.locator('.pat-noamt').count() == 1 and g.locator('#patRows .pat-warnings').count() == 0)
        g.check('#patAll'); g.fill('#patName', 'Scout'); g.click('#patImport'); g.wait_for_timeout(600)
        pr = store(g)['projects']
        ok('F2i Create project saves all 15 colors', len(pr) == 1 and len(pr[0].get('items', [])) == 15, json.dumps(pr)[:300])
        ok('F2j no page errors during import', not g.errs, g.errs)
        g.context.close()
    else:
        print('SKIP F2 real pattern PDF (set FLOW_PDF)')

    # ---- Item 3: quick add at the top of My threads
    g = page()
    g.click('#tabThreads'); g.wait_for_timeout(200)
    top = g.evaluate("document.getElementById('thAdd').getBoundingClientRect().bottom")
    ok('F3a the add box is on the first phone screen', top < 844 - 60, top)
    ok('F3b Add sits right beside the box', g.evaluate("(()=>{const a=document.getElementById('thAdd').getBoundingClientRect(),b=document.getElementById('thAddBtn').getBoundingClientRect();return Math.abs(a.top-b.top)<30})()"))
    g.fill('#thAdd', '310'); g.press('#thAdd', 'Enter'); g.wait_for_timeout(200)
    ok('F3c typing 310 and Enter adds it', '310' in threads(g).get('threads', {}), threads(g))
    g.fill('#thAdd', '321, 3865 x2'); g.click('#thAddBtn'); g.wait_for_timeout(200)
    th = threads(g).get('threads', {})
    ok('F3d several at once with the same rules (3865 x2 is 2 skeins)', '321' in th and th.get('3865', {}).get('n') == 2, th)
    ok('F3e the privacy note is folded, not in the way', g.locator('.thkept').count() == 1 and not g.evaluate("document.querySelector('.thkept').open"))
    g.context.close()
    # ---- Item 4: add owned colors from a project, with a count and an Undo
    g = page()
    g.evaluate("""FlossFoxThreadsUI.addItems([{code:'310',n:5}]);FlossFoxProjects.add({id:'p-autumn',name:'Autumn fox',items:[{code:'310',qty:1},{code:'321',qty:1},{code:'666',qty:2},{code:'797',qty:1}],
      decisions:{'310':{status:'have',owned:1},'321':{status:'have',owned:2},'666':{status:'have',owned:null},'797':{status:'buy',owned:0}}})""")
    g.click('#tabThreads'); g.wait_for_timeout(300)
    btn = g.locator('#thFromProj [data-from]')
    ok('F4a My threads offers the project with a clear count (2 new, 310 already owned)', btn.count() == 1 and 'Add 2 colors you have from Autumn fox' in btn.inner_text(), btn.all_inner_texts())
    before = threads(g)['threads']['310']
    btn.click(); g.wait_for_timeout(200); th = threads(g)['threads']
    ok('F4b it adds exactly the 2 new colors and leaves 310 alone', set(th) == {'310', '321', '666'} and th['310'] == before and th['321']['n'] == 2, th)
    ok('F4c an Undo is offered right there', g.locator('[data-ffundo]').is_visible())
    g.click('[data-ffundo]'); g.wait_for_timeout(200); th = threads(g)['threads']
    ok('F4d Undo takes back exactly what was added', set(th) == {'310'} and th['310'] == before, th)
    g.click('#tabProjects'); g.wait_for_timeout(200); g.evaluate("FlossFoxProjects.open('p-autumn')"); g.wait_for_timeout(400)
    pb = g.locator('#pToThreadsBtn')
    ok('F4e an open project offers "Put my 2 colors marked Have enough in My threads"', pb.count() == 1 and '2 colors' in pb.inner_text(), pb.all_inner_texts())
    pb.click(); g.wait_for_timeout(200); th = threads(g)['threads']
    ok('F4f the project button adds them and offers Undo', set(th) == {'310', '321', '666'} and g.locator('#projEdit [data-ffundo]').count() == 1, th)
    ok('F4g project choices were not changed', g.evaluate("FlossFoxProjects._store().projects.find(x=>x.id==='p-autumn').decisions['797'].status") == 'buy')
    ok('F4h no page errors', not g.errs, g.errs)
    g.context.close()
    b.close()
print(f'flow_pass: {sum(R)} passed, {len(R)-sum(R)} failed'); sys.exit(0 if all(R) else 1)
