#!/usr/bin/env python3
"""Execute a real Chromium browser against isolated V6 fixture. This is NOT full V5 regression certification."""
from pathlib import Path
import os
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
CHECKS=0

def main():
 global CHECKS
 try:
  with sync_playwright() as pl:
   br=pl.chromium.launch(executable_path=os.environ.get('FF_CHROME','/usr/bin/chromium'),args=['--no-sandbox'])
   for width in (320,360,390,430,600,768,880,1280):
    ctx=br.new_context(viewport={'width':width,'height':850},is_mobile=width<701,has_touch=width<701)
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    markup=(ROOT/'tests/fixtures/foxglass-app.html').read_text()
    markup=markup.replace('<link rel="stylesheet" href="../../v6/foxglass-v6.css">','<style>'+ (ROOT/'v6/foxglass-v6.css').read_text()+'</style>')
    markup=markup.replace('<script src="../../v6/foxglass-v6.js"></script>','<script>'+ (ROOT/'v6/foxglass-v6.js').read_text()+'</script>')
    page.set_content(markup);page.wait_for_function('!!window.FlossFoxV6')
    def check(cond,why):
     global CHECKS
     assert cond,f'{width}px: {why} | {errors}'
     CHECKS+=1
    check(page.locator('#fg-nav > button').count()==5,'5 main destinations')
    check(page.locator('#fg-home').is_visible(),'home shown on first visit')
    check(not page.locator('#ffLanding').is_visible(),'old welcome hidden')
    check('Forest Fox Sampler' in page.locator('#fg-home').inner_text(),'real active project displayed')
    page.get_by_role('button',name='My threads').first.click() if width>700 else page.locator('#fg-home button.fg-choice').nth(1).click()
    check(page.locator('#fg-thread-tabs').is_visible(),'threads subnav visible')
    check(page.locator('#threadsView').is_visible(),'existing collection reused')
    check(not page.locator('.thquick').is_visible(),'no competing quick-add UI before choosing a method')
    check(not page.locator('#ffSmartStash').is_visible(),'advanced importer initially out of sight')
    page.locator('#fg-entry > summary').click()
    page.get_by_role('button',name='Quick add').click()
    check(page.locator('.thquick').is_visible(),'quick-add mode available on demand')
    check(not page.locator('#ffSmartStash').is_visible(),'quick-add does not display scanner controls')
    page.locator('#fg-add-close').click()
    check(not page.locator('.thquick').is_visible(),'add controls collapse when finished')
    page.locator('#fg-entry > summary').click()
    page.get_by_role('button',name='Paste or import').click()
    check(page.locator('#ffSmartStash').is_visible(),'import choices opened on demand')
    page.get_by_role('tab',name='Find & convert').click()
    check(page.locator('#convertView').is_visible(),'existing converter reused')
    check(page.locator('#fg-thread-tabs [aria-selected="true"]').count()==1,'one selected threads tab')
    page.locator('#fg-nav [data-fg-area="projects"]').click()
    check(page.locator('#projectsView').is_visible(),'projects view reused')
    page.evaluate("FlossFoxProjects.open('p1')")
    page.wait_for_selector('#fg-project-tabs')
    check(page.locator('#pThreads').is_visible(),'project thread tab default')
    page.get_by_role('tab',name='Progress').click()
    check(page.locator('#ffauSessions').is_visible(),'journal available in progress')
    check(not page.locator('#pThreads').is_visible(),'thread list not duplicated under progress')
    check(not page.locator('#pCover').is_visible(),'photo hidden in progress')
    page.get_by_role('tab',name='Details & prep').click()
    check(page.locator('#pCover').is_visible(),'photo accessible in details')
    check(page.locator('#fg-prep-shortcuts').is_visible(),'fabric and PDF prep shortcuts')
    check(not page.locator('#ffauSessions').is_visible(),'journal hidden in details')
    page.locator('#fg-nav [data-fg-area="shopping"]').click()
    check(page.locator('#shopView').is_visible(),'shopping visible from top level')
    page.locator('#fg-combine').click()
    check(page.evaluate('window.__fixtureActions.combined')==1,'combined planner uses existing handler')
    page.locator('#fg-nav [data-fg-area="more"]').click()
    check(page.locator('#fg-more').is_visible(),'more tools hub')
    check(page.locator('#fg-more a[href="fabric.html"]').count()==1,'fabric calculator reachable')
    page.locator('#fg-more button').filter(has_text='Take the tour').click()
    page.wait_for_function('window.__fixtureActions.tour===1')
    check(page.evaluate('window.__fixtureActions.tour')==1,'tour entry actually opens tour')
    page.locator('#fg-nav [data-fg-area="home"]').click()
    check(page.locator('#fg-home').is_visible(),'home return')
    # Both Search and Ask Pip remain available but do not overlap.
    page.locator('#ffSearchBtn').click()
    check(page.locator('#ffSearch').is_visible(),'search opened')
    page.locator('#askPipBtn').click()
    check(page.locator('#askPip').is_visible() and not page.locator('#ffSearch').is_visible(),'opening Ask Pip closes Search')
    # Use body-level overflow as mobile baseline check.
    check(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),'no horizontal viewport overflow')
    page.evaluate("history.replaceState(null,'','#workbasket');window.dispatchEvent(new Event('hashchange'))")
    page.wait_for_function("document.getElementById('fg-home')?.hidden===false")
    check(page.locator('#fg-home').is_visible(),'legacy Workbasket URL opens new Home')
    page.evaluate("history.replaceState(null,'','#convert');window.dispatchEvent(new Event('hashchange'))")
    page.wait_for_function("document.getElementById('convertView')?.hidden===false")
    check(page.locator('#convertView').is_visible(),'legacy Find Floss URL still works')
    page.evaluate("history.replaceState(null,'','#home');window.dispatchEvent(new Event('hashchange'))")
    page.wait_for_function("document.getElementById('fg-home')?.hidden===false")
    check(page.locator('#fg-home').is_visible(),'new Home URL returns to Home')
    check(not errors,'no runtime exceptions')
    ctx.close()
   br.close()
  print(f'PASS — {CHECKS} checks across 320, 360, 390, 430, 600, 768, 880 and 1280px')
 finally:pass

if __name__=='__main__':main()
