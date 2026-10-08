"""Behavioral fixture checks. This file does not claim live Codex acceptance."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture='''<!doctype html><html style="color-scheme:dark"><head><style>
body{margin:0;font:14px system-ui;--color-text-danger:#fa423e}aside{position:absolute;width:240px;height:100vh}
aside nav{--color-text:color-mix(in oklab,#7d6993 85%,transparent);--color-text-primary-ghost:var(--color-text)}.text-default{color:var(--color-text)}
main{position:absolute;left:240px;right:0;height:100vh}
.editor{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);width:640px;height:110px}
.bubble{position:absolute;left:50%;transform:translateX(-50%);width:640px;top:100px;height:200px}
.placeholder::before{content:attr(data-placeholder);color:#aaa;opacity:.5}[data-composer-body]{height:100%;border-radius:22px}
</style></head><body><aside class="app-shell-left-panel"><nav><span class="text-default">Navigation</span></nav></aside><main data-app-shell-main-surface>
<div data-testid="home-icon" style="width:48px;height:48px"></div><div class="editor" data-composer-surface-variant="default" data-composer-radius-variant="default"><div data-composer-body><div data-codex-composer contenteditable="true"><p class="placeholder" data-placeholder="Type here"></p></div></div></div>
</main></body></html>'''
for edition in ['q','portrait']:
 payload=(root/f'dist/dragon-atelier-{edition}.js').read_text(encoding='utf-8')
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':1600,'height':1000})
  page.set_content(fixture)
  page.evaluate('''()=>{window.__rafCount=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{window.__rafCount++;return raf(cb)}}''')
  color=page.evaluate('getComputedStyle(document.body).getPropertyValue("--color-text-danger")')
  page.evaluate(payload);page.wait_for_timeout(150)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==2
  assert page.locator('#dragon-atelier-scene').evaluate("e=>e.parentElement.matches('main[data-app-shell-main-surface]')&&e.parentElement.firstElementChild===e")
  assert page.locator('#dragon-atelier-scene').evaluate("e=>getComputedStyle(e).position==='absolute'&&getComputedStyle(e).zIndex==='0'")
  assert page.evaluate('window.__DRAGON_ATELIER__.status.animated') is False
  assert page.locator('[data-composer-body]').evaluate("e=>getComputedStyle(e).borderRadius")=='22px'
  assert page.locator('[data-composer-surface-variant]').evaluate("e=>getComputedStyle(e).boxShadow")=='none'
  assert page.locator('p.placeholder').evaluate("e=>getComputedStyle(e,'::before').opacity")=='1'
  assert page.locator('nav .text-default').evaluate('e=>getComputedStyle(e).color')=='rgb(235, 232, 226)'
  assert page.evaluate('window.__DRAGON_ATELIER__.status.edition')==edition
  figures=page.locator('.da-dragon').evaluate_all('els=>els.map(e=>{const r=e.getBoundingClientRect();return {height:r.height,top:r.top,bottom:r.bottom}})')
  if edition=='q':assert abs(figures[0]['height']-figures[1]['height'])<1,'Q poses must have equal height'
  else:assert .90<figures[1]['height']/figures[0]['height']<.97,'Adult companions need a modest natural height difference'
  if edition=='q':
   composer_top=page.locator('[data-composer-surface-variant]:visible').first.bounding_box()['y']
   assert max(f['bottom'] for f in figures)<=composer_top-27,'Chibi artwork must clear the composer visually'
  assert page.locator('.da-left').evaluate('e=>getComputedStyle(e).backgroundImage')!=page.locator('.da-right').evaluate('e=>getComputedStyle(e).backgroundImage') if edition=='portrait' else page.locator('.da-left').evaluate('e=>getComputedStyle(e).backgroundPosition')!=page.locator('.da-right').evaluate('e=>getComputedStyle(e).backgroundPosition')
  idle=page.evaluate('window.__rafCount');page.wait_for_timeout(350)
  assert page.evaluate('window.__rafCount')-idle<=1,'Owned mutations caused a continuous repaint loop'
  assert page.evaluate('getComputedStyle(document.body).getPropertyValue("--color-text-danger")')==color
  page.evaluate("document.documentElement.style.colorScheme='light'")
  page.wait_for_function("window.__DRAGON_ATELIER__.status.mode==='light'",timeout=5000)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.mode')=='light'
  assert page.locator('nav .text-default').evaluate('e=>getComputedStyle(e).color')=='rgb(45, 42, 39)'
  page.set_viewport_size({'width':850,'height':900});page.wait_for_timeout(150)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==0
  page.set_viewport_size({'width':1600,'height':1000});page.wait_for_timeout(150)
  # Workbench/side panel changes the chat area while the viewport stays wide.
  page.evaluate("document.querySelector('main').style.right='700px'");page.wait_for_timeout(150)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==0
  assert page.locator('#dragon-atelier-scene').bounding_box()['width']<700
  page.evaluate("document.querySelector('main').style.right='0px'");page.wait_for_timeout(150)
  page.evaluate('''()=>{const b=document.createElement('button');b.id='edge-button';b.style.cssText='position:absolute;left:24px;bottom:30px;width:180px;height:64px';b.textContent='Native edge control';b.onclick=()=>{window.__edgeClicked=true};document.querySelector('main').append(b)}''')
  page.locator('#edge-button').click()
  assert page.evaluate('window.__edgeClicked') is True
  page.evaluate('''()=>{const d=document.createElement('div');d.id='menu-fixture';d.setAttribute('role','menu');d.style.cssText='position:fixed;z-index:50;opacity:0;left:280px;bottom:45px;width:180px;height:100px';document.body.append(d);d.animate([{opacity:0},{opacity:1}],{duration:50,fill:'forwards'})}''')
  page.wait_for_timeout(100)
  assert page.locator('#menu-fixture').get_attribute('data-da-part')=='overlay','Entering menus must receive their palette before their opacity animation completes'
  assert page.locator('#menu-fixture').evaluate('e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+10,r.y+10)===e}')
  page.evaluate("document.getElementById('menu-fixture').remove();document.getElementById('edge-button').remove()")
  page.evaluate('''() => {document.querySelector('[data-testid=home-icon]').style.display='none';
   const cached=document.querySelector('.editor').cloneNode(true);cached.style.display='none';document.querySelector('main').prepend(cached);
   const el=document.createElement('div');el.className='thread-scroll-container';el.innerHTML='<div class="bubble" data-local-conversation-final-assistant>Example task</div>';document.querySelector('main').append(el);}''')
  page.wait_for_timeout(150)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.context')=='thread'
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==2
  page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100)
  assert page.locator('.da-dragon').first.evaluate("e=>getComputedStyle(e).backgroundSize")==('100% 100%' if edition=='portrait' else '800% 1100%')
  assert page.locator('#dragon-atelier-scene').evaluate('e=>e.inert') is True
  # Settings keep color roles while artwork hides.
  page.evaluate("()=>{const s=document.createElement('section');s.setAttribute('data-settings-panel-slug','appearance');s.style.cssText='width:400px;height:200px';document.body.append(s)}")
  page.wait_for_timeout(100)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.reason')=='settings'
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==0
  assert page.locator('html[data-dragon-atelier]').count()==1
  page.evaluate("document.querySelector('[data-settings-panel-slug]').remove()")
  page.wait_for_timeout(100)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==2
  page.emulate_media(forced_colors='active');page.wait_for_timeout(100)
  assert page.locator('#dragon-atelier-scene').evaluate("e=>getComputedStyle(e).display")=='none'
  assert not page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--da-text').trim()")
  page.emulate_media(forced_colors='none');page.wait_for_timeout(100)
  page.evaluate("document.querySelectorAll('[data-composer-surface-variant]').forEach(e=>e.remove())");page.wait_for_timeout(100)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.active') is False
  assert page.locator('html[data-dragon-atelier]').count()==0
  page.evaluate('window.__DRAGON_ATELIER__.dispose()')
  assert page.locator('[data-da-part]').count()==0
  assert page.locator('#dragon-atelier-scene').count()==0
  # No geometry intervention on an unsupported future host.
  page.set_content(fixture);page.evaluate("document.querySelector('main').style.position='static'")
  page.evaluate(payload)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.reason')=='unpositioned-stage-host'
  page.evaluate('window.__DRAGON_ATELIER__.dispose()')
  for scale in [1,1.25,1.5,2]:
   context=browser.new_context(viewport={'width':1600,'height':1000},device_scale_factor=scale)
   scaled=context.new_page();scaled.set_content(fixture);scaled.evaluate(payload);scaled.wait_for_timeout(100)
   assert scaled.evaluate('window.__DRAGON_ATELIER__.status.devicePixelRatio')==scale
   boxes=scaled.locator('.da-dragon').evaluate_all('els=>els.map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))')
   for box in boxes:
    assert box['height']*scale<=1672+1 if edition=='portrait' else box['width']*scale<=192+1,'Artwork must not upscale beyond its native cell pixels'
   scaled.set_viewport_size({'width':850,'height':900});scaled.wait_for_timeout(100)
   assert scaled.evaluate('window.__DRAGON_ATELIER__.status.characters')==0
   scaled.evaluate('window.__DRAGON_ATELIER__.dispose()');context.close()
  browser.close()
  print(json.dumps({'edition':edition,'fixtureChecks':['autoScheme','nativeStatusColor','narrowHide','chatBackgroundParent','nativeMenuTier','edgeControlClick','columnResize','staticDistinctPoses','idleObserver','cachedRouteVisibility','threadBackground','reducedMotion','inert','adultProportionsOrEqualQ','nativeInnerFrame','visiblePseudoPlaceholder','chibiInputClearance','settingsPalette','forcedColorsFallback','missingAnchorFallback','unsupportedHost','restore','localNavigationTextAlias','nativePixelCaps'],'deviceScaleFactors':[1,1.25,1.5,2],'passed':True}))
