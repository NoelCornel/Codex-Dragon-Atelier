"""Behavioral fixture checks. This file does not claim live Codex acceptance."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture='''<!doctype html><html style="color-scheme:dark"><head><style>
body{margin:0;font:14px system-ui;--color-text-danger:#fa423e}aside{position:absolute;width:240px;height:100vh}
main{position:absolute;left:240px;right:0;height:100vh}
.editor{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);width:640px;height:110px}
.bubble{position:absolute;left:50%;transform:translateX(-50%);width:640px;top:100px;height:200px}
</style></head><body><aside class="app-shell-left-panel"></aside><main data-app-shell-main-surface>
<div data-testid="home-icon" style="width:48px;height:48px"></div><div class="editor" data-composer-surface-variant="default" data-composer-radius-variant="default"><div data-codex-composer contenteditable="true">Draft</div></div>
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
  assert page.evaluate('window.__DRAGON_ATELIER__.status.edition')==edition
  assert page.locator('.da-left').evaluate('e=>getComputedStyle(e).backgroundImage')!=page.locator('.da-right').evaluate('e=>getComputedStyle(e).backgroundImage') if edition=='portrait' else page.locator('.da-left').evaluate('e=>getComputedStyle(e).backgroundPosition')!=page.locator('.da-right').evaluate('e=>getComputedStyle(e).backgroundPosition')
  idle=page.evaluate('window.__rafCount');page.wait_for_timeout(350)
  assert page.evaluate('window.__rafCount')-idle<=1,'Owned mutations caused a continuous repaint loop'
  assert page.evaluate('getComputedStyle(document.body).getPropertyValue("--color-text-danger")')==color
  page.evaluate("document.documentElement.style.colorScheme='light'")
  page.wait_for_function("window.__DRAGON_ATELIER__.status.mode==='light'",timeout=5000)
  assert page.evaluate('window.__DRAGON_ATELIER__.status.mode')=='light'
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
  page.evaluate('''()=>{const d=document.createElement('div');d.id='menu-fixture';d.setAttribute('role','menu');d.style.cssText='position:fixed;z-index:50;left:280px;bottom:45px;width:180px;height:100px';document.body.append(d)}''')
  page.wait_for_timeout(100)
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
  browser.close()
  print(json.dumps({'edition':edition,'fixtureChecks':['autoScheme','nativeStatusColor','narrowHide','chatBackgroundParent','nativeMenuTier','edgeControlClick','columnResize','staticDistinctPoses','idleObserver','cachedRouteVisibility','threadBackground','reducedMotion','inert','missingAnchorFallback','unsupportedHost','restore'],'passed':True}))
