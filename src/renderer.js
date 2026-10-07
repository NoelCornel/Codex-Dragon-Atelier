(() => {
  'use strict';
  const CONFIG = __ATELIER_CONFIG__;
  const KEY = '__DRAGON_ATELIER__';
  window[KEY]?.dispose();
  if(document.querySelector('[data-dream-skin="active"]')) {
    return {active:false,reason:'Restore the other injector before using Dragon Atelier'};
  }
  const root=document.documentElement;
  const tracked=new Map();
  const attrs=['data-dragon-atelier','data-da-mode'];
  const saved=new Map(attrs.map(x=>[x,root.getAttribute(x)]));
  let stopped=false,scheduled=false,frame=0,main=null,composer=null,ro=null;
  const style=document.createElement('style');style.id='dragon-atelier-style';style.textContent=CONFIG.css;
  const scene=document.createElement('div');scene.id='dragon-atelier-scene';scene.setAttribute('aria-hidden','true');scene.inert=true;
  const chars=['left','right'].map(side=> {
    const el=document.createElement('div');el.className=`da-dragon da-${side}`;
    // Both editions display static artwork. Portraits retain source attribution.
    el.style.backgroundImage=`url("${CONFIG.images?.[side]||CONFIG.reducedImage}")`;scene.append(el);return el;
  });
  scene.setAttribute('data-da-edition',CONFIG.edition||'q');
  const ornaments=chars.map(()=>{const el=document.createElement('div');el.className='da-ornament';scene.append(el);return el;});
  const isVisible=el=>{
    if(!el)return false;
    const r=el.getBoundingClientRect();
    return r.width>1&&r.height>1&&getComputedStyle(el).visibility!=='hidden'&&
      (!el.checkVisibility||el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
  };
  // 26.1002 keeps inactive routes mounted. Matching the first cached composer
  // misclassifies a live thread as home and produces zero-size art placement.
  const query=key=>[...document.querySelectorAll(CONFIG.adapter.selectors[key])].find(isVisible)||null;
  const mark=(el,part)=> {
    if(!el)return;
    if(!tracked.has(el))tracked.set(el,el.getAttribute('data-da-part'));
    if(el.getAttribute('data-da-part')!==part)el.setAttribute('data-da-part',part);
  };
  const unmark=()=> {for(const [el,old] of tracked){
    if(old===null)el.removeAttribute('data-da-part');else el.setAttribute('data-da-part',old);
  }tracked.clear();};
  const media=matchMedia('(prefers-color-scheme:dark)');
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  function mode() {
    // Read the native signal before the palette touches any slots. Never force color-scheme on html.
    const native=getComputedStyle(root).colorScheme.trim();
    if(native==='dark'||native==='light')return native;
    if(root.classList.contains('electron-dark'))return 'dark';
    if(root.classList.contains('electron-light'))return 'light';
    return media.matches?'dark':'light';
  }
  function setAttr(el,key,value){if(el.getAttribute(key)!==value)el.setAttribute(key,value);}
  function refresh() {
    scheduled=false;frame=0;if(stopped)return;
    const nextMain=query('main'),nextComposer=query('composer');
    const settings=query('settings');
    if(!nextMain||!nextComposer||settings||getComputedStyle(nextMain).position==='static') {
      setAttr(scene,'data-da-hidden','true');root.removeAttribute('data-dragon-atelier');unmark();
      api.status={active:false,reason:settings?'settings':!nextMain||!nextComposer?'missing-anchors':'unpositioned-stage-host'};return;
    }
    setAttr(root,'data-dragon-atelier','active');setAttr(root,'data-da-mode',mode());
    if(nextMain!==main||nextComposer!==composer){
      ro?.disconnect();main=nextMain;composer=nextComposer;
      ro=new ResizeObserver(schedule);ro.observe(main);ro.observe(composer);
    }
    mark(main,'main');mark(query('sidebar'),'sidebar');mark(composer,'composer');
    // Like Maid Atelier, the owned stage is the first child of the chat surface.
    // No new native stacking context: existing popups retain their own tiers.
    if(scene.parentElement!==main||main.firstElementChild!==scene)main.prepend(scene);
    for(const el of main.children){
      if(el!==scene&&getComputedStyle(el).position==='static')mark(el,'content');
    }
    for(const el of main.querySelectorAll('main:not([data-app-shell-main-surface]),.thread-scroll-container'))mark(el,'canvas');
    for(const el of document.querySelectorAll('[role="menu"],[role="dialog"],[data-radix-popper-content-wrapper]'))mark(el,'overlay');
    const box={width:main.clientWidth,height:main.clientHeight};
    const home=Boolean(query('home'));
    setAttr(scene,'data-da-context',home?'home':'thread');
    // Large, quiet background figures scale with the chat surface, not viewport.
    // Active conversations retreat; narrow surfaces keep the reading space clear.
    const portrait=CONFIG.edition==='portrait';
    const widths=portrait?[.94,.72].map((scale,i)=>Math.min(box.width*(i===0?.42:.26),box.height*(home?scale:scale*.66)*CONFIG.aspects[i])):
      // The source frame is 192x208: cap enlargement rather than inventing detail.
      [0,1].map(()=>Math.min(home?280:240,box.width*.34,box.height*(home?.60:.46)*192/208));
    const width=widths[0];
    const visible=box.width>=700&&box.height>420;
    setAttr(scene,'data-da-hidden',visible?'false':'true');
    chars.forEach((el,i)=>{
      const x=i===0?Math.max(8,box.width*.015):box.width-widths[i]-Math.max(8,box.width*.015);
      el.style.width=`${widths[i]}px`;el.style.left=`${x}px`;
      ornaments[i].style.left=`${x+(widths[i]-110)/2}px`;
    });
    api.status={active:true,mode:mode(),context:home?'home':'thread',characters:visible?2:0,
      reason:visible?'background-stage':'narrow-reading-surface',width,widths,edition:CONFIG.edition||'q',layer:'chat-background',animated:false};
  }
  function schedule(){if(!scheduled&&!stopped){scheduled=true;frame=requestAnimationFrame(refresh);}}
  const observer=new MutationObserver(records=>{
    if(records.some(r=>!scene.contains(r.target)&&r.target!==style))schedule();
  });
  const api={edition:CONFIG.edition||'q',version:CONFIG.version,status:{active:false},refresh:schedule,dispose(){
    stopped=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();ro?.disconnect();media.removeEventListener('change',schedule);motion.removeEventListener('change',schedule);
    window.removeEventListener('resize',schedule);unmark();style.remove();scene.remove();
    for(const [name,value] of saved){if(value===null)root.removeAttribute(name);else root.setAttribute(name,value);}
    delete window[KEY];
  }};
  window[KEY]=api;
  document.head.append(style);
  observer.observe(root,{subtree:true,childList:true,attributes:true,
    attributeFilter:['class','style','data-theme','data-color-mode','data-appearance','data-app-shell-main-surface']});
  media.addEventListener('change',schedule);motion.addEventListener('change',schedule);window.addEventListener('resize',schedule);refresh();
  return api.status;
})()
