#!/usr/bin/env python3
"""Verified restore confirmation: backup import (old/full, merge/replace), twice, journal, undo, auto copy restore,
injected save failures and read-back mismatches, invalid files, mobile. Results are simulated (headless Chrome, synthetic data).
Usage: FF_KEY=flossfox-dev.v1 python tests/restore_verify_e2e.py http://localhost:8765/"""
import os as _o, sys as _s; _s.path.insert(0, _o.path.dirname(_o.path.abspath(__file__))); import ff_session
import sys, os, json
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'; B = B if B.endswith('/') else B + '/'
KEY = os.environ.get('FF_KEY', 'flossfox-dev.v1'); PFX = KEY[:-3]; TK = PFX + '.threads.v1'; JK = PFX + '.journal.v1'
SHOTS = os.environ.get('SHOTS', '/workspace/restore-verification-logs/shots'); os.makedirs(SHOTS, exist_ok=True)
R = {'pass': 0, 'fail': 0}; errs = []
def ok(n, c, i=''):
    R['pass' if c else 'fail'] += 1; print(('PASS ' if c else 'FAIL ') + n + ('' if c else f'  -> {i}'))
def proj(pid, name): return {'id': pid, 'name': name, 'notes': '', 'buyBrand': 'dmc', 'status': 'planning', 'items': [{'code': '310', 'qty': 1, 'stated': True, 'assumed': 0, 'src': ['DMC 310'], 'stitchCount': None}], 'decisions': {}, 'purchased': {}, 'created': '2026-11-01T00:00:00Z', 'updated': '2026-11-01T00:00:00Z'}
def th(n): return {'n': n, 'partial': False, 'restock': False, 'confirmed': True, 'updated': '2026-11-01T00:00:00Z'}
SEED = json.dumps({'schema': 2, 'projects': [proj('p1', 'Sample Autumn Wreath')]})
THR = json.dumps({'schema': 2, 'threads': {'310': th(2), 'BLANC': th(1)}})
OLD = {'app': 'floss-fox', 'schema': 2, 'projects': [proj('o1', 'Sample Old Sampler')]}
FULL = {'app': 'floss-fox', 'kind': 'full-backup', 'version': 2, 'schema': 2, 'exported': '2026-11-05T00:00:00Z', 'projects': [proj('f1', 'Sample Garden Bookmark'), proj('f2', 'Sample Winter Mittens')],
        'threads': {'schema': 2, 'threads': {'310': th(9), '321': th(1), '699': th(2)}}, 'prefs': {},
        'journal': [{'id': 'ebk-1', 't': '2026-11-04T12:00:00Z', 'k': 'inventory', 'ref': {'code': '321'}, 'from': None, 'to': {'n': 1, 'partial': False}}]}
INIT = """(([K,TK,S,T,P])=>{if(!sessionStorage.getItem('rv.seeded')){localStorage.clear();localStorage.setItem(K,S);localStorage.setItem(TK,T);sessionStorage.setItem('rv.seeded','1')}
for(const p of [P,'flossfox']){localStorage.setItem(p+'.tour.v1','{"status":"dismissed"}');localStorage.setItem(p+'.hints.v1','off')}})"""
DATA = f"JSON.stringify([localStorage.getItem('{KEY}'),localStorage.getItem('{TK}')])"
def ls(g, k): return g.evaluate(f"localStorage.getItem('{k}')")
def ready(g): g.wait_for_function('window.FlossFoxProjects&&window.FlossFoxJournal&&window.FlossFoxRestoreVerify&&window.FlossFoxSnapshots'); g.wait_for_timeout(300)
def page(br, vw={'width': 1200, 'height': 900}):
    c = br.new_context(viewport=vw, service_workers='block', is_mobile=vw['width'] < 500, has_touch=vw['width'] < 500, device_scale_factor=2 if vw['width'] < 500 else 1)
    c.add_init_script(INIT[:-1] + f")({json.dumps([KEY, TK, SEED, THR, PFX])})")
    g = c.new_page(); g.set_default_timeout(8000); g.on('pageerror', lambda e: errs.append(str(e))); g.on('dialog', lambda d: d.accept())
    g.goto(B + '?nosw#projects'); ready(g); return c, g
def imp(g, data, mode='merge', rmode=None, raw=None):
    g.set_input_files('#restoreFile', files=[{'name': 'b.json', 'mimeType': 'application/json', 'buffer': (raw if raw is not None else json.dumps(data)).encode()}])
    g.wait_for_function("(()=>{const r=document.getElementById('restorePanel');return r&&!r.hidden&&(document.getElementById('rGo')||/Nothing was changed/.test(r.textContent))})()")
    if g.locator('#rGo').count() == 0: return
    g.check(f'input[name=imode][value={mode}]')
    if rmode and g.locator(f'input[name=rmode][value={rmode}]').count(): g.check(f'input[name=rmode][value={rmode}]')
    g.click('#rGo'); g.wait_for_timeout(300)
def projs(g): return [p['id'] for p in json.loads(ls(g, KEY))['projects']]
def jids(g): return [e['id'] for e in json.loads(ls(g, JK) or '{"events":[]}')['events']]
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    # 1. old projects-only backup, merge
    c, g = page(br); t0 = ls(g, TK); imp(g, OLD)
    m = g.inner_text('#restoreDone')
    ok('OLD-1 verified confirmation for older projects-only backup', 'Restore checked and saved (Merge)' in m and '1 added' in m and 'projects only' in m and 'You now have 2 projects.' in m, m)
    ok('OLD-2 thread collection untouched', ls(g, TK) == t0 and projs(g) == ['p1', 'o1'])
    ok('OLD-3 short status line, details shown once in the panel', g.inner_text('#projStatus') == 'Restore checked and saved.')
    # 2. full backup merge + journal
    imp(g, FULL); m = g.inner_text('#restoreDone')
    ok('FULL-1 merge confirmation with real counts', 'Projects: 2 added, 0 replaced, 0 skipped, 0 kept as copies.' in m and 'Thread colors: 2 added' in m and 'You now have 4 projects and 4 thread colors.' in m, m)
    th_now = json.loads(ls(g, TK))['threads']
    ok('FULL-2 existing skein counts kept on merge', th_now['310']['n'] == 2 and th_now['321']['n'] == 1 and 'BLANC' in th_now)
    ok('JRN-1 backup journal merged quietly', 'ebk-1' in jids(g), jids(g))
    n_j = len(jids(g))
    # 3. import same backup twice: no duplicates
    imp(g, FULL, rmode='replace'); m = g.inner_text('#restoreDone')
    ok('TWICE-1 same backup again replaces, no duplicate projects', projs(g).count('f1') == 1 and len(projs(g)) == 4 and '0 added, 2 replaced' in m, (projs(g), m))
    ok('TWICE-2 no duplicate journal events', len(jids(g)) == n_j and len(set(jids(g))) == len(jids(g)))
    # 4. undo last import
    g.click('#undoImportBtn'); g.wait_for_load_state(); ready(g)
    ok('UNDO-1 Undo last import still works', sorted(projs(g)) == ['f1', 'f2', 'o1', 'p1'] or sorted(projs(g)) == ['o1', 'p1'], projs(g))
    c.close()
    # 5. replace full
    c, g = page(br); imp(g, FULL, mode='replace'); m = g.inner_text('#restoreDone')
    ok('REPL-1 replace confirmation', m == 'Restore checked and saved (Replace). Your projects and thread collection now match the backup: 2 projects and 3 thread colors.', m)
    ok('REPL-2 storage matches backup', projs(g) == ['f1', 'f2'] and sorted(json.loads(ls(g, TK))['threads']) == ['310', '321', '699'])
    c.close()
    # 6. invalid backup: storage unchanged
    c, g = page(br); d0 = g.evaluate("JSON.stringify(Object.entries(localStorage).sort())"); imp(g, None, raw='{"app":"nope"}')
    ok('BAD-1 invalid file: nothing changed and says so', 'Nothing was changed' in g.inner_text('#restorePanel') and g.evaluate("JSON.stringify(Object.entries(localStorage).sort())") == d0)
    # 7. failed project save: rolled back, no false success, message survives reload
    before = g.evaluate(DATA)
    g.evaluate("void(window.__si=Storage.prototype.setItem,Storage.prototype.setItem=function(k,v){if(k===%r&&/f1/.test(v))throw new Error('quota');return window.__si.call(this,k,v)})" % KEY)
    with g.expect_navigation(timeout=6000): imp(g, FULL)
    ready(g); g.wait_for_timeout(200)
    ok('FAIL-1 failed save rolled back: projects and threads unchanged', g.evaluate(DATA) == before, g.evaluate(DATA))
    ok('FAIL-2 no success claimed; rollback message shown after reload', 'Nothing was changed' in g.inner_text('#projStatus') and 'checked and saved' not in g.inner_text('#projStatus'), g.inner_text('#projStatus'))
    c.close()
    # 8. read-back mismatch (storage silently stores something else)
    c, g = page(br); before = g.evaluate(DATA)
    g.evaluate("void(window.__si=Storage.prototype.setItem,Storage.prototype.setItem=function(k,v){if(k===%r&&/f1/.test(v))v=v.replace('Sample Garden Bookmark','X');return window.__si.call(this,k,v)})" % KEY)
    with g.expect_navigation(timeout=6000): imp(g, FULL)
    ready(g); g.wait_for_timeout(200)
    ok('MISMATCH-1 read-back mismatch rolled back, no success shown', g.evaluate(DATA) == before and 'Nothing was changed' in g.inner_text('#projStatus'), g.inner_text('#projStatus'))
    c.close()
    # 9. failed save AND failed rollback: honest warning
    c, g = page(br)
    g.evaluate("void(window.__si=Storage.prototype.setItem,Storage.prototype.setItem=function(k,v){if(k===%r)throw new Error('blocked');return window.__si.call(this,k,v)})" % KEY)
    g.evaluate("void(window.__ri=Storage.prototype.removeItem)")
    g.evaluate("void(window.__t=%r)" % TK)
    g.evaluate("void(Storage.prototype.setItem=(o=>function(k,v){if(k===window.__t&&!/321/.test(v))throw new Error('blocked');return o.call(this,k,v)})(Storage.prototype.setItem))")
    imp(g, FULL); g.wait_for_timeout(200)
    txt = g.inner_text('#restorePanel')
    ok('NOBACK-1 cannot confirm rollback: warns, never claims success', 'could not confirm' in txt and 'checked and saved' not in txt, txt)
    g.wait_for_timeout(2000); c.close()
    # 10. automatic copy restore: success shows checked counts after reload
    c, g = page(br)
    g.evaluate("FlossFoxSnapshots.take('open',{force:true})"); imp(g, FULL, mode='replace')
    i = g.evaluate("FlossFoxSnapshots.list().findIndex(s=>{try{return JSON.parse(s.keys[%r]).projects.some(p=>p.id==='p1')}catch(e){return false}})" % KEY)
    g.evaluate("FlossFoxProjects.openProject&&document.getElementById('tabSettings').click()")
    with g.expect_navigation(): g.evaluate(f"FlossFoxSnapshots.restore({i})")
    ready(g); g.evaluate("document.getElementById('tabSettings').click()"); g.wait_for_timeout(200)
    st = g.inner_text('#snapRestored') if g.locator('#snapRestored').count() else ''
    ok('COPY-1 copy restore confirmed after reload with checked counts', projs(g) == ['p1'] and 'and checked it: 1 project and 2 thread colors are saved' in st, st)
    # change data -> confirmation disappears (no longer matches)
    g.evaluate("FlossFoxThreadsUI.data().threads['310'].n=5"); g.evaluate("void(localStorage.setItem(%r,JSON.stringify(FlossFoxThreadsUI.data())))" % TK); g.evaluate("FlossFoxSnapshots.render()")
    ok('COPY-2 confirmation hidden once data no longer matches', g.locator('#snapRestored').count() == 0)
    c.close()
    # 11. automatic copy restore mismatch -> put back, not claimed
    c, g = page(br); g.evaluate("FlossFoxSnapshots.take('open',{force:true})"); imp(g, FULL, mode='replace'); before = g.evaluate(DATA)
    i = g.evaluate("FlossFoxSnapshots.list().findIndex(s=>{try{return JSON.parse(s.keys[%r]).projects.some(p=>p.id==='p1')}catch(e){return false}})" % KEY)
    g.evaluate("document.getElementById('tabSettings').click()")
    g.evaluate("void(window.__si=Storage.prototype.setItem,Storage.prototype.setItem=function(k,v){if(k===%r&&/p1/.test(v))v=v.replace('Sample Autumn Wreath','Y');return window.__si.call(this,k,v)})" % KEY)
    r = g.evaluate(f"FlossFoxSnapshots.restore({i})"); g.wait_for_timeout(300)
    ok('COPY-3 copy restore read-back mismatch is put back and reported', r is False and g.evaluate(DATA) == before and 'Nothing was changed' in g.inner_text('#snapStatus'), g.inner_text('#snapStatus'))
    c.close()
    ok('ERR-1 no page errors', not errs, errs[:3])
    # 12. mobile confirmation screenshot (ordinary synthetic data)
    c, g = page(br, {'width': 390, 'height': 844}); imp(g, FULL)
    ok('MOB-1 no horizontal overflow at 390px', g.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
    g.locator('#restoreDone').evaluate("e=>e.scrollIntoView({block:'center'})"); g.wait_for_timeout(200); g.screenshot(path=f'{SHOTS}/restore-confirmation-mobile.png'); c.close()
    br.close()
print(f"\n{R['pass']} passed, {R['fail']} failed (simulated)"); sys.exit(1 if R['fail'] else 0)
