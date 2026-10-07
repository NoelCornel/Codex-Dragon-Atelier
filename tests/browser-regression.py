"""Behavioral fixture checks. This file does not claim live Codex acceptance."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
payload=(root/'dist/dragon-atelier.js').read_text(encoding='utf-8')
fixture='''<!doctype html><html style="color-scheme:dark"><head><style>
body{margin:0;font:14px system-ui;--color-text-danger:#fa423e}aside{position:absolute;width:240px;height:100vh}
main{position:absolute;left:240px;right:0;height:100vh}
.editor{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);width:640px;height:110px}
.bubble{position:absolute;left:50%;transform:translateX(-50%);width:640px;top:100px;height:200px}
</style></head><body><aside class="app-shell-left-panel"></aside><main data-app-shell-main-surface>
<div data-testid="home-icon" style="width:48px;height:48px"></div><div class="editor" data-composer-surface-variant="default" data-composer-radius-variant="default"><div data-codex-composer contenteditable="true">Draft</div></div>
</main></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page(viewport={'width':1600,'height':1000})
 page.set_content(fixture)
 color=page.evaluate('getComputedStyle(document.body).getPropertyValue("--color-text-danger")')
 page.evaluate(payload);page.wait_for_timeout(150)
 assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==2
 assert page.evaluate('getComputedStyle(document.body).getPropertyValue("--color-text-danger")')==color
 page.evaluate("document.documentElement.style.colorScheme='light'")
 page.wait_for_function("window.__DRAGON_ATELIER__.status.mode==='light'",timeout=5000)
 assert page.evaluate('window.__DRAGON_ATELIER__.status.mode')=='light'
 page.set_viewport_size({'width':850,'height':900});page.wait_for_timeout(150)
 assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==0
 page.set_viewport_size({'width':1600,'height':1000});page.wait_for_timeout(150)
 page.evaluate('''() => {document.querySelector('[data-testid=home-icon]').style.display='none';
  const cached=document.querySelector('.editor').cloneNode(true);cached.style.display='none';document.querySelector('main').prepend(cached);
  const el=document.createElement('div');el.className='thread-scroll-container';el.innerHTML='<div class="bubble" data-local-conversation-final-assistant>Example task</div>';document.querySelector('main').append(el);}''')
 page.wait_for_timeout(150)
 assert page.evaluate('window.__DRAGON_ATELIER__.status.context')=='thread'
 assert page.evaluate('window.__DRAGON_ATELIER__.status.characters')==2
 page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100)
 assert page.locator('.da-dragon').first.evaluate("e=>getComputedStyle(e).backgroundSize")=='800% 1100%'
 assert page.locator('#dragon-atelier-scene').evaluate('e=>e.inert') is True
 page.evaluate("document.querySelectorAll('[data-composer-surface-variant]').forEach(e=>e.remove())");page.wait_for_timeout(100)
 assert page.evaluate('window.__DRAGON_ATELIER__.status.active') is False
 assert page.locator('html[data-dragon-atelier]').count()==0
 page.evaluate('window.__DRAGON_ATELIER__.dispose()')
 assert page.locator('[data-da-part]').count()==0
 assert page.locator('#dragon-atelier-scene').count()==0
 browser.close()
 print(json.dumps({'fixtureChecks':['autoScheme','nativeStatusColor','narrowHide','cachedRouteVisibility','threadMargins','reducedMotion','inert','missingAnchorFallback','restore'],'passed':True}))
