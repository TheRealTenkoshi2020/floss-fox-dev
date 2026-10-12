#!/usr/bin/env python3
"""DEV PREVIEW ONLY: demo-data button. Usage: FF_KEY=flossfox-dev.v1 python tests/demo_e2e.py https://therealtenkoshi2020.github.io/floss-fox-dev/"""
import sys, os, json
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8767/floss-fox-dev/'; B = B if B.endswith('/') else B + '/'
KEY = os.environ.get('FF_KEY', 'flossfox-dev.v1'); TK = KEY[:-3] + '.threads.v1'
R = {'pass': 0, 'fail': 0}; errs = []
def ok(n, c, i=''):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + n + ('' if c else f'  -> {i}'))
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for w in (360, 390, 1280):
        ctx = br.new_context(viewport={'width': w, 'height': 800}, is_mobile=w < 600, has_touch=w < 600)
        g = ctx.new_page(); g.on('pageerror', lambda e: errs.append(str(e))); g.on('dialog', lambda d: d.accept())
        g.goto(B); g.wait_for_load_state('networkidle')
        ok(f'{w}px nothing is auto-loaded', g.evaluate(f"localStorage.getItem('{TK}')") is None and json.loads(g.evaluate(f"localStorage.getItem('{KEY}')") or '{"projects":[]}')['projects'] == [])
        g.click('#tabThreads'); ok(f'{w}px demo button is labelled preview only', 'Preview only' in g.inner_text('.demobox') and g.locator('#demoBtn').is_visible())
        g.click('#demoBtn'); g.wait_for_timeout(150)
        ok(f'{w}px demo collection: 13 colors', g.locator('#thList .th').count() == 13)
        g.locator('#demoMsg button').click(); g.wait_for_timeout(150)
        ok(f'{w}px Demogorgon (demo): 13 owned, 0 short, 6 missing', g.inner_text('#cmpOwned').startswith('✓ 13') and g.inner_text('#cmpShort').startswith('◐ 0') and g.inner_text('#cmpMissing').startswith('✗ 6'), g.inner_text('#pCmp'))
        ok(f'{w}px demo project has 19 colors with stitch counts', g.evaluate("FlossFoxProjects._store().projects[0].items.length") == 19 and g.evaluate("FlossFoxProjects._store().projects[0].items.every(i=>i.stitchCount>0)"))
        if w in (390, 1280):
            os.makedirs('/workspace/floss-converter/feedback-shots/cf', exist_ok=True); g.screenshot(path=f'/workspace/floss-converter/feedback-shots/cf/demo-project-{w}.png')
        ok(f'{w}px no sideways scrolling', g.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        ctx.close()
    ok('no JS errors', not errs, errs); br.close()
print(f"\ndemo_e2e: {R['pass']} passed, {R['fail']} failed"); sys.exit(1 if R['fail'] else 0)
