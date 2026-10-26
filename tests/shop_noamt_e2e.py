#!/usr/bin/env python3
"""ci005-64 (simulated browser run): Myke's case. PDF-imported project, 15 colors, no amounts, all not checked.
Real taps on Shop tab Check first Have enough / Need to buy: status changes, row leaves Check first, scroll stays,
focus moves to the next row, and heading, row count, Pip bubble and summary counts all agree.
Usage: FF_KEY=flossfox-dev.v1 python tests/shop_noamt_e2e.py http://localhost:8812/floss-fox-dev/ [pdf] [shot_dir]"""
import sys, os, json, re
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8812/floss-fox-dev/'; B = B if B.endswith('/') else B + '/'
PDF = sys.argv[2] if len(sys.argv) > 2 else '/workspace/flow-pass/myke-example.pdf'
SHOT = sys.argv[3] if len(sys.argv) > 3 else None
KEY = os.environ.get('FF_KEY', 'flossfox-dev.v1'); R = {'pass': 0, 'fail': 0}; errs = []
def ok(n, c, i=''): R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + n + ('' if c else f'  -> {i}'))
if not os.path.exists(PDF): print('SKIP no PDF fixture'); sys.exit(0)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    g = c.new_page(); g.on('pageerror', lambda e: errs.append(str(e))); g.on('dialog', lambda d: d.accept())
    g.goto(B + '?nosw'); g.evaluate('localStorage.clear()'); g.reload(); g.wait_for_timeout(500)
    g.click('#tabConvert'); g.click('#convertView .pat-launch'); g.set_input_files('#patFile', PDF); g.wait_for_timeout(3000)
    g.check('#patAll'); g.click('#patImport'); g.wait_for_timeout(500)
    st = lambda: json.loads(g.evaluate(f"localStorage.getItem({json.dumps(KEY)})"))['projects'][-1]
    p0 = st(); ok('fixture: 15 colors, no amounts, none checked', len(p0['items']) == 15 and all(i['qty'] is None for i in p0['items']) and not any(d['status'] for d in p0['decisions'].values()))
    g.evaluate("FlossFoxProjects.open(FlossFoxProjects.lastProject().id)"); g.wait_for_timeout(300); g.click('#tabShop'); g.wait_for_timeout(500)
    def counts():
        g.evaluate("window.FFHelp&&FFHelp.tick()"); g.wait_for_timeout(100)
        h = int(re.search(r'\((\d+)\)', g.inner_text('#pCheckH')).group(1)) if g.locator('#pCheckH').count() else 0
        pip = g.evaluate("(document.getElementById('pipMsg')||{}).textContent||''"); m = re.search(r'(\d+) colors? still to check', pip)
        sc = g.evaluate("(document.getElementById('sCf')||{}).textContent||'0'")
        return h, g.locator('#pCheck > li').count(), int(m.group(1)) if m else None, int(sc)
    h, n, pip, sc = counts(); ok(f'start: heading, rows, summary agree on 15 (Pip {pip})', h == n == sc == 15 and pip in (15, None), (h, n, pip, sc))
    def tap(i, v):
        b = g.locator(f'#pCheck > li').nth(i).locator(f'[data-cfst][data-v={v}]'); code = b.get_attribute('data-cfst')
        b.scroll_into_view_if_needed(); g.wait_for_timeout(150); y0 = g.evaluate('scrollY'); top0 = b.bounding_box()['y']
        nxt = g.locator('#pCheck > li').nth(i + 1).locator('[data-cfst]').first.get_attribute('data-cfst')
        b.tap(); g.wait_for_timeout(500); return code, y0, top0, nxt
    if SHOT: g.locator('#pCheck > li').nth(3).scroll_into_view_if_needed(); g.screenshot(path=SHOT + '/after-1-shop.png')
    code, y0, top0, nxt = tap(3, 'have'); d = st()['decisions'][code]
    ok(f'Have enough tap on {code} (no amount) sets status have', d['status'] == 'have', d)
    ok('it leaves Check first', g.locator(f'#pCheck [data-cfst="{code}"]').count() == 0)
    ok('scroll stays put (within one row)', abs(g.evaluate('scrollY') - y0) < 120 and g.evaluate('scrollY') > 200, (y0, g.evaluate('scrollY')))
    ok('focus moves to the next row', g.evaluate("document.activeElement.dataset.cfst") == nxt, g.evaluate("document.activeElement.outerHTML.slice(0,120)"))
    ok('announced', 'Have enough' in g.inner_text('#pMsg'), g.inner_text('#pMsg'))
    h, n, pip, sc = counts(); ok(f'counts agree at 14 (Pip {pip})', h == n == sc == 14 and pip in (14, None), (h, n, pip, sc))
    code2, y0, _, _ = tap(3, 'buy'); d = st()['decisions'][code2]
    ok(f'Need to buy tap on {code2} sets status buy', d['status'] == 'buy', d)
    ok('it leaves Check first and shows under Need to buy as amount not entered', g.locator(f'#pCheck [data-cfst="{code2}"]').count() == 0 and re.search(r'DMC \S+ · amount not entered', g.inner_text('#pPlan')) is not None)
    ok('no invented skein number for it', not re.search(r'\d+ skeins?', [l for l in g.inner_text('#pPlan').split('\n') if 'amount not entered. Add' in l][0]))
    ok('scroll stays put', abs(g.evaluate('scrollY') - y0) < 120 and g.evaluate('scrollY') > 200)
    h, n, pip, sc = counts(); ok(f'counts agree at 13 (Pip {pip})', h == n == sc == 13 and pip in (13, None), (h, n, pip, sc))
    p1 = st(); ch = {k for k in p1['decisions'] if p1['decisions'][k] != p0['decisions'][k]}
    ok('only the two statuses changed; items untouched', ch == {code, code2} and p1['items'] == p0['items'] and all(set(k for k in p1['decisions'][x] if p1['decisions'][x][k] != p0['decisions'][x][k]) <= {'status', 'estimateChecked'} for x in ch), ch)
    if SHOT: g.screenshot(path=SHOT + '/after-2-tapped.png')
    ok('no page errors', not errs, errs); br.close()
print(f"\nshop_noamt (simulated): {R['pass']} passed, {R['fail']} failed"); sys.exit(1 if R['fail'] else 0)
