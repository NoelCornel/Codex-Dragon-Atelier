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
  let stopped=false,scheduled=false,main=null,composer=null,ro=null;
  const style=document.createElement('style');style.id='dragon-atelier-style';style.textContent=CONFIG.css;
  const scene=document.createElement('div');scene.id='dragon-atelier-scene';scene.setAttribute('aria-hidden','true');scene.inert=true;
  const chars=['left','right'].map((side,i)=> {
    const el=document.createElement('div');el.className=`da-dragon da-${side}`;
    el.style.backgroundImage=`url("${CONFIG.images[i]}")`;scene.append(el);return el;
  });
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
    scheduled=false;if(stopped)return;
    const nextMain=query('main'),nextComposer=query('composer');
    const settings=query('settings');
    if(!nextMain||!nextComposer||settings) {
      scene.dataset.daHidden='true';root.removeAttribute('data-dragon-atelier');unmark();
      api.status={active:false,reason:settings?'settings':'missing-anchors'};return;
    }
    setAttr(root,'data-dragon-atelier','active');setAttr(root,'data-da-mode',mode());
    chars.forEach((el,i)=>{
      const image=motion.matches?CONFIG.reducedImage:CONFIG.images[i];
      const value=`url("${image}")`;
      if(el.style.backgroundImage!==value)el.style.backgroundImage=value;
    });
    if(nextMain!==main||nextComposer!==composer){
      ro?.disconnect();main=nextMain;composer=nextComposer;
      ro=new ResizeObserver(schedule);ro.observe(main);ro.observe(composer);
    }
    mark(main,'main');mark(query('sidebar'),'sidebar');mark(composer,'composer');
    for(const el of document.querySelectorAll('[role="menu"],[role="dialog"],[data-radix-popper-content-wrapper]'))mark(el,'overlay');
    const box=main.getBoundingClientRect(),input=composer.getBoundingClientRect();
    const home=Boolean(query('home'));
    setAttr(scene,'data-da-context',home?'home':'thread');
    // Home: flank the native composer. Thread: use only empty margins beside the actual content column.
    const column=[...main.querySelectorAll('.thread-scroll-container [data-local-conversation-final-assistant],.thread-scroll-container [data-message-author-role]')].find(isVisible);
    const content=column?.getBoundingClientRect()||input;
    const leftRoom=Math.max(0,(home?input.left:content.left)-box.left-16);
    const rightRoom=Math.max(0,box.right-(home?input.right:content.right)-16);
    const available=Math.min(leftRoom,rightRoom);
    const width=home?Math.min(190,box.width*.2,Math.max(0,(input.top-box.top-260)*192/208)):Math.min(130,available);
    const visible=width>=(home?120:92)&&box.height>420&&(!home||box.width>=720);
    setAttr(scene,'data-da-hidden',visible?'false':'true');
    const top=Math.max(box.top+65,(home?input.top-35:input.top-14)-width*208/192-18);
    chars.forEach((el,i)=>{
      const x=home?(i===0?box.left+24:box.right-width-24):
        (i===0?Math.max(box.left+8,input.left-width-16):Math.min(box.right-width-8,input.right+16));
      el.style.width=`${width}px`;el.style.left=`${x}px`;el.style.top=`${top}px`;
      ornaments[i].style.left=`${x+(width-110)/2}px`;ornaments[i].style.top=`${top+width*208/192+9}px`;
    });
    api.status={active:true,mode:mode(),context:home?'home':'thread',characters:visible?2:0,
      reason:visible?'verified-anchors':'insufficient-safe-margin',width};
  }
  function schedule(){if(!scheduled&&!stopped){scheduled=true;requestAnimationFrame(refresh);}}
  const observer=new MutationObserver(records=>{
    if(records.some(r=>!scene.contains(r.target)&&r.target!==style))schedule();
  });
  const api={status:{active:false},refresh:schedule,dispose(){
    stopped=true;observer.disconnect();ro?.disconnect();media.removeEventListener('change',schedule);motion.removeEventListener('change',schedule);
    window.removeEventListener('resize',schedule);unmark();style.remove();scene.remove();
    for(const [name,value] of saved){if(value===null)root.removeAttribute(name);else root.setAttribute(name,value);}
    delete window[KEY];
  }};
  window[KEY]=api;
  document.head.append(style);document.body.append(scene);
  observer.observe(root,{subtree:true,childList:true,attributes:true,
    attributeFilter:['class','style','data-theme','data-color-mode','data-appearance','data-app-shell-main-surface']});
  media.addEventListener('change',schedule);motion.addEventListener('change',schedule);window.addEventListener('resize',schedule);refresh();
  return api.status;
})()
