#!/usr/bin/env python3
"""Shop tab Check first rows (ci005-61, simulated browser run): Buy + store chooser (same verified links as Store Mode),
quick Have enough / Need to buy buttons using the existing status logic, Buy never changes status or marks bought,
short explainer line, Store Mode shows Buy for Check first colors when Need to buy is empty.
Usage: FF_KEY=flossfox-dev.v1 python tests/shop_buy_e2e.py http://localhost:8812/floss-fox-dev/ [shot_dir]"""
import sys, os, json
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8812/floss-fox-dev/'; B = B if B.endswith('/') else B + '/'
SHOT = sys.argv[2] if len(sys.argv) > 2 else None
KEY = os.environ.get('FF_KEY', 'flossfox-dev.v1')
R = {'pass': 0, 'fail': 0}; errs = []
def ok(n, c, i=''):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + n + ('' if c else f'  -> {i}'))
def mk(g, name, text):
    g.click('#tabConvert')
    if g.locator('#exitExample').is_visible(): g.click('#exitExample')
    g.fill('#inp', text); g.click('#go'); g.wait_for_selector('#saveProj:not([disabled])', state='visible'); g.wait_for_timeout(120)
    g.fill('#newProjName', name); g.evaluate("document.getElementById('saveProj').click()"); g.wait_for_timeout(200)
    return g.evaluate("FlossFoxProjects.lastProject().id")
NOTE = 'Not on your list or in the cost yet. Pick Have enough or Need to buy.'
BUYNOTE = "Not in your cost estimate yet. Buying here doesn't change this color."
TXT = '310\nBLANC\n321 x1\n498 x1\n666 x1\n700 x2\n725 x1\n796 x1\n820 x1\n898 x1\n3799 x2\n3865 x1\nB5200 x1\n415 x1\n762 x1'
def proj(g, pid): return [x for x in json.loads(g.evaluate(f"localStorage.getItem({json.dumps(KEY)})"))['projects'] if x['id'] == pid][0]
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for w in (390, 344):
        t = f'[{w}] '
        ctx = br.new_context(viewport={'width': w, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        g = ctx.new_page(); g.on('pageerror', lambda e: errs.append(str(e))); g.on('dialog', lambda d: d.accept())
        g.goto(B + '?nosw'); g.wait_for_load_state('networkidle'); g.evaluate("localStorage.clear()"); g.reload(); g.wait_for_load_state('networkidle')
        pid = mk(g, 'Germaphobic Scout', TXT)
        g.evaluate(f"FlossFoxProjects.open({json.dumps(pid)})"); g.wait_for_timeout(200)
        g.locator('#pSkein').evaluate('(el)=>el.open=true'); g.locator('#seFull').check(); g.locator('#seEnabled').check(); g.locator('#seSave').click(); g.wait_for_timeout(200)
        g.evaluate("FlossFoxProjects.showView('shop')"); g.wait_for_timeout(300)
        n = g.locator('#pCheck > li').count()
        ok(t + 'Need to buy empty, all 15 colors under Check first', n == 15 and g.inner_text('#pCheckH') == 'Check first (15)', n)
        ok(t + 'explainer is one short line', g.inner_text('#pCfNote').strip() == NOTE, g.inner_text('#pCfNote'))
        rows = g.evaluate("[...document.querySelectorAll('#pCheck > li')].map(li=>({t:li.textContent,buy:li.querySelectorAll('[data-cfbuy]').length,have:li.querySelectorAll('[data-cfst][data-v=have]').length,need:li.querySelectorAll('[data-cfst][data-v=buy]').length}))")
        ok(t + 'every Check first row has Have enough + Need to buy', all(r['have'] == 1 and r['need'] == 1 for r in rows), rows)
        ok(t + 'every Check first row has a Buy button (DMC destination)', all(r['buy'] == 1 for r in rows), rows)
        ok(t + 'row reason text kept (needs ... : why)', all(' · needs ' in r['t'] for r in rows), rows[:2])
        ok(t + 'chooser hidden until tapped', g.locator('#pCheck .ffcf-buy:visible').count() == 0)
        before = json.dumps(proj(g, pid), sort_keys=True)
        g.click('#pCheck li:has-text("DMC 321") [data-cfbuy]'); g.wait_for_timeout(120)
        ok(t + 'Buy opens the chooser (aria-expanded true)', g.get_attribute('#pCheck li:has-text("DMC 321") [data-cfbuy]', 'aria-expanded') == 'true')
        hrefs = g.eval_on_selector_all('#pCheck .ffcf-buy:visible a', 'els=>els.map(a=>[a.href,a.target,a.rel,a.dataset.store,a.dataset.match])')
        sm = g.evaluate("FlossFoxSkeinPreview.linksFor({brand:'dmc',code:'321',family:'six-strand-cotton',pack:'single-skein',qty:1},'preview').map(l=>l.url)")
        ok(t + 'store links are the same verified source as Store Mode', [h[0] for h in hrefs] == sm and len(sm) > 0, [hrefs, sm])
        ok(t + 'links open in a new tab, noopener', all(h[1] == '_blank' and 'noopener' in h[2] for h in hrefs), hrefs)
        ok(t + 'chooser says not in cost estimate yet', g.inner_text('#pCheck .ffcf-buy:visible .ffcf-buynote').strip() == BUYNOTE)
        if SHOT: g.evaluate("document.getElementById('pCheckH').scrollIntoView({block:'start'});window.scrollBy(0,-90)"); g.screenshot(path=f'{SHOT}/shop-{w}.png'); g.screenshot(path=f'{SHOT}/shop-{w}-full.png', full_page=True)
        ok(t + 'Buy changed no data (no status, nothing bought)', json.dumps(proj(g, pid), sort_keys=True) == before)
        g.click('#pCheck li:has-text("DMC 321") [data-cfbuy]'); g.wait_for_timeout(80)
        ok(t + 'Buy toggles the chooser closed', g.locator('#pCheck .ffcf-buy:visible').count() == 0)
        tot = g.inner_text('#pPlan .totals')
        ok(t + 'estimate still excludes Check first colors', 'Not included: 15 colors in Check first' in tot, tot)
        # quick status
        g.click('#pCheck li:has-text("DMC 321") [data-cfst][data-v=buy]'); g.wait_for_timeout(200)
        pr = proj(g, pid); d = pr['decisions']['321']
        ok(t + 'Need to buy sets status buy (existing logic)', d['status'] == 'buy', d)
        ok(t + 'never marks bought', not pr.get('purchased'), pr.get('purchased'))
        ok(t + 'color moved to Need to buy, 14 left to check', g.locator('#pCheck > li').count() == 14 and 'DMC 321' in g.inner_text('#pPlan > ul:first-of-type'))
        ok(t + 'status message', g.inner_text('#pMsg') == 'DMC 321: Need to buy.', g.inner_text('#pMsg'))
        g.click('#pCheck li:has-text("DMC 498") [data-cfst][data-v=have]'); g.wait_for_timeout(200)
        ok(t + 'Have enough sets status have', proj(g, pid)['decisions']['498']['status'] == 'have')
        ok(t + '13 left to check', g.locator('#pCheck > li').count() == 13)
        g.click('#pCheck li:has-text("DMC 310") [data-cfst][data-v=buy]'); g.wait_for_timeout(200)
        r310 = g.inner_text('#pCheck li:has-text("DMC 310")')
        ok(t + 'stitch-count note kept for a color that needs it (stays in Check first, still has Buy)', 'Enter the full-cross stitch count for this color.' in r310 and g.locator('#pCheck li:has-text("DMC 310") [data-cfbuy]').count() == 1, r310)
        g.click('#pCheck li:has-text("DMC 310") [data-cfst][data-v=buy]'); g.wait_for_timeout(100)
        # keyboard
        g.focus('#pCheck li:has-text("DMC 666") [data-cfbuy]'); g.keyboard.press('Enter'); g.wait_for_timeout(100)
        ok(t + 'Buy works with keyboard, focus moves to first store link', g.evaluate("document.activeElement.classList.contains('ff-skein-pill')"))
        # Store Mode with only Check first + one buy: reset 321 to show the empty Need to buy case
        g.evaluate(f"(()=>{{const k={json.dumps(KEY)},s=JSON.parse(localStorage.getItem(k));const p=s.projects.find(x=>x.id==={json.dumps(pid)});p.decisions['321'].status=null;p.decisions['498'].status=null;p.decisions['310'].status=null;localStorage.setItem(k,JSON.stringify(s))}})()")
        g.reload(); g.wait_for_load_state('networkidle'); g.evaluate(f"FlossFoxProjects.open({json.dumps(pid)})"); g.wait_for_timeout(200); g.evaluate("FlossFoxProjects.showView('shop')"); g.wait_for_timeout(300)
        g.click('#pStoreBtn'); g.wait_for_timeout(200)
        ok(t + 'Store Mode: Need to buy empty but Check first colors listed', g.locator('#smLeft').count() == 0 and g.locator('#smCheck > li').count() == 15)
        ok(t + 'Store Mode: Check first colors have Buy', g.locator('#smCheck [data-cfbuy]').count() == 15)
        ok(t + 'Store Mode: no Bought button on Check first colors', g.locator('#smCheck [data-smb]').count() == 0)
        ok(t + 'Store Mode: summary does not claim everything is bought', g.inner_text('#smSum') == '15 colors still need checking before this list is complete.', g.inner_text('#smSum'))
        ok(t + 'Store Mode: plain-links note shown', g.locator('#smBuyNote').count() == 1)
        b2 = json.dumps(proj(g, pid), sort_keys=True)
        g.click('#smCheck li:has-text("DMC 310") [data-cfbuy]'); g.wait_for_timeout(100)
        ok(t + 'Store Mode: chooser opens with links + estimate note', g.locator('#smCheck .ffcf-buy:visible a').count() > 0 and g.locator('#smCheck .ffcf-buy:visible .ffcf-buynote').count() == 1)
        if SHOT: g.evaluate("document.getElementById('smCheckH').scrollIntoView({block:'start'});window.scrollBy(0,-90)"); g.screenshot(path=f'{SHOT}/store-{w}.png')
        ok(t + 'Store Mode Buy changed no data', json.dumps(proj(g, pid), sort_keys=True) == b2)
        g.fill('#smFind', '310'); g.wait_for_timeout(150)
        ok(t + 'Store Mode search filters Check first too', g.locator('#smCheck > li').count() == 1)
        g.fill('#smFind', ''); g.wait_for_timeout(150)
        g.click('#smCheck li:has-text("DMC 415") [data-cfst][data-v=buy]'); g.wait_for_timeout(200)
        ok(t + 'Store Mode: Need to buy moves the color to Still to find', g.locator('#smLeft .ffsm-row').count() == 1 and proj(g, pid)['decisions']['415']['status'] == 'buy' and not proj(g, pid).get('purchased'))
        # non-DMC destination: no Buy (same as Store Mode), quick buttons still there
        g.click('#pStoreBtn'); g.wait_for_timeout(100)
        g.evaluate("FlossFoxProjects.showView('projects')"); g.wait_for_timeout(150)
        if not g.evaluate("document.getElementById('pDetails').open"): g.click('#pDetails > summary')
        g.select_option('#pDest', 'anchor'); g.wait_for_timeout(200)
        ok(t + 'non-DMC brand: no Buy links, status buttons stay', g.locator('#pCheck [data-cfbuy]').count() == 0 and g.locator('#pCheck [data-cfst]').count() > 0)
        ctx.close()
    br.close()
ok('no page errors', not errs, errs[:3])
print(f"{R['pass']} passed, {R['fail']} failed (simulated)"); sys.exit(1 if R['fail'] else 0)
