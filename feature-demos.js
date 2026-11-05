/* Licensed 3D hardware, real native app content and deterministic scroll. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  const set=(el,key,value)=>{if(el.style.getPropertyValue(key)!==String(value))el.style.setProperty(key,String(value))};
  const dict=()=>PixiraLocaleData.COPY[document.documentElement.lang];
  const text=(tag,key,cls='')=>`<${tag} class="${cls}" data-i18n="${key}">${(dict()[key]||'').replace(/<br\s*\/?\s*>/g,'<br> ')}</${tag}>`;

  class Scrubber {
    constructor(story,video,cover,source){
      Object.assign(this,{story,video,cover,source,targetTime:0,presentedTime:0,lastFrame:-1,seekAt:0,firstFrame:false,loading:false,failed:false,seekCount:0});
      video.muted=true;video.playsInline=true;video.preload='none';video.poster=cover.src;
      this.abort=new AbortController();
      video.addEventListener('play',()=>video.pause());
      video.addEventListener('loadedmetadata',()=>story.request());
      video.addEventListener('seeked',()=>{
        if(!video.requestVideoFrameCallback){this.presentedTime=video.currentTime;this.firstFrame=true;if(!cover.closest('.phone-model-host'))cover.hidden=true}
        story.request();
      });
      video.addEventListener('error',()=>{this.failed=true;story.fail()});
      if(video.requestVideoFrameCallback){
        const presented=(_,m)=>{
          this.presentedTime=m.mediaTime;
          if(Math.abs(m.mediaTime-this.targetTime)<.09){this.firstFrame=true;if(!cover.closest('.phone-model-host'))cover.hidden=true}
          story.request();video.requestVideoFrameCallback(presented);
        };
        video.requestVideoFrameCallback(presented);
      }
      addEventListener('pagehide',e=>{if(!e.persisted){this.abort.abort();if(this.blob)URL.revokeObjectURL(this.blob)}},{once:true});
    }
    load(){
      if(this.loading||this.failed||!this.story.enabled)return;
      this.loading=true;this.video.src=this.source;this.video.preload='auto';this.video.load();
    }
    seek(seconds,now){
      this.targetTime=seconds;
      if(this.video.readyState<1||this.video.seeking)return false;
      const frame=Math.round(clamp(seconds,0,this.video.duration-1/30)*30);
      if(frame===this.lastFrame)return false;
      if(now-this.seekAt<1000/30){if(!this.seekTimer)this.seekTimer=setTimeout(()=>{this.seekTimer=0;this.story.request()},Math.ceil(1000/30-(now-this.seekAt)));return false}
      this.video.currentTime=frame/30;this.lastFrame=frame;this.seekAt=now;this.seekCount++;return false;
    }
  }

  class Timeline {
    constructor(section,stage,{distance,className,render,fit}){
      Object.assign(this,{section,stage,distance,className,render,onFit:fit,p:0,raw:0,velocity:0,frame:0,clock:0,failed:false});
      this.reduced=matchMedia('(prefers-reduced-motion:reduce)');
      this.probe=document.createElement('i');this.probe.className='story-viewport-probe';this.probe.ariaHidden='true';section.append(this.probe);
      this.resize=()=>{if(this.g?.active&&!this.refitAnchor&&(innerWidth!==this.g.w||Math.abs(this.probe.getBoundingClientRect().height-document.querySelector('.header').offsetHeight-this.g.h)>1))this.refitAnchor={p:this.p,input:this.lastInput};if(!this.fitFrame)this.fitFrame=requestAnimationFrame(()=>{this.fitFrame=0;this.fit()})};
      addEventListener('resize',this.resize,{passive:true});addEventListener('scroll',()=>this.request(),{passive:true});
      this.lastInput=0;for(const type of ['wheel','touchstart','pointerdown','keydown'])addEventListener(type,()=>{this.lastInput=performance.now();this.refitAnchor=null},{passive:true});
      this.reduced.addEventListener('change',this.resize);document.fonts.ready.then(this.resize);document.fonts.addEventListener('loadingdone',this.resize);
      this.observer=new MutationObserver(this.resize);this.observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
      stage.querySelectorAll('[data-i18n]').forEach(el=>this.observer.observe(el,{childList:true,characterData:true,subtree:true}));
      document.addEventListener('visibilitychange',()=>{this.clock=0;if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0}else this.request()});
    }
    fit(){
      const old=this.g,header=document.querySelector('.header').offsetHeight,h=this.probe.getBoundingClientRect().height-header,w=innerWidth;
      const coarse=matchMedia('(pointer:coarse)').matches,motionMode=w<600||(h<480&&w<1200)?'mobile':w<1200||coarse?'tablet':'desktop';
      this.g={w,h,header,motionMode,portraitTablet:w>=600&&w<900&&h>w*.8,stacked:w<600&&h>w*.8,rtl:document.documentElement.dir==='rtl'};
      this.section.classList.toggle('story-stacked',this.g.stacked);this.section.classList.toggle('story-portrait',this.g.portraitTablet);this.section.classList.toggle('story-mobile-compact',motionMode==='mobile'&&!this.g.stacked);this.section.classList.toggle('story-compact',h<480);
      set(this.section,'--story-h',h+'px');set(this.section,'--story-distance',typeof this.distance==='function'?this.distance(this.g):this.distance);
      this.section.classList.add('story-measuring');this.enabled=!this.failed&&!this.reduced.matches&&!navigator.connection?.saveData&&parseFloat(getComputedStyle(document.documentElement).fontSize)<22&&w>=300&&h>=280;
      this.onFit?.(this);if(!this.enabled){clearTimeout(this.releaseTimer);this.releaseTimer=0;this.model?.dispose();this.model=null}this.section.classList.remove('story-measuring');this.section.classList.toggle('story-live',this.enabled);
      if(old?.active&&this.enabled&&(old.w!==w||Math.abs(old.h-h)>1)){
        const anchor=this.refitAnchor||{p:this.p,input:this.lastInput};this.refitAnchor=anchor;
        const generation=this.refitGeneration=(this.refitGeneration||0)+1;
        const restore=()=>{if(!this.enabled||this.lastInput!==anchor.input)return;scrollTo({top:this.section.getBoundingClientRect().top+scrollY-this.g.header+anchor.p*(this.section.offsetHeight-this.g.h),behavior:'instant'});this.clock=0;this.velocity=0;this.request()};
        restore();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(generation!==this.refitGeneration)return;restore();this.refitAnchor=null}));
      }
      this.clock=0;this.velocity=0;this.request();
    }
    fail(){this.failed=true;queueMicrotask(()=>{this.model?.dispose();this.model=null});this.fit()}
    request(){if(!this.frame&&!document.hidden)this.frame=requestAnimationFrame(t=>this.draw(t))}
    draw(now){
      this.frame=0;if(document.hidden||this.fitFrame){this.clock=0;return;}
      const r=this.section.getBoundingClientRect(),g=this.g;
      g.active=this.enabled&&r.top<=g.header+1&&r.bottom>=g.header+g.h-1;
      document.documentElement.classList.toggle(this.className,g.active);
      if(!this.enabled)return;
      if(r.top<innerHeight*2&&r.bottom>0){clearTimeout(this.releaseTimer);this.releaseTimer=0;this.scrubber?.load();this.ensureModel?.()}
      if((r.top>innerHeight*2||r.bottom<-innerHeight)&&this.model&&!this.releaseTimer)this.releaseTimer=setTimeout(()=>{this.model?.dispose();this.model=null;this.releaseTimer=0},12000)
      if(r.top>innerHeight||r.bottom<0){this.clock=0;return}
      this.raw=clamp((g.header-r.top)/Math.max(1,this.section.offsetHeight-g.h));
      const dt=this.clock?Math.min(64,now-this.clock):16;this.clock=now;
      const x=this.p-this.raw,omega=25,v=this.velocity||0,seconds=dt/1000,decay=Math.exp(-omega*seconds),temp=v+omega*x;
      this.p=clamp(this.raw+(x+temp*seconds)*decay);this.velocity=(v-omega*temp*seconds)*decay;
      if(Math.abs(this.p-this.raw)<.000025&&Math.abs(this.velocity)<.0003){this.p=this.raw;this.velocity=0}
      const time=this.render(this,this.p,g);
      const pending=this.scrubber?.seek(time,now);
      if(this.raw!==this.p||Math.abs(this.velocity)>.0003||pending)this.request();else this.clock=0;
    }
    sample(){
      const s=this.scrubber,v=s?.video;
      return{phase:this.phase||'device',result:this.resultState,model:this.model?.sample(),pinned:this.enabled,progress:this.raw,shownProgress:this.p,measuredWidth:this.g.w,measuredHeight:innerHeight,stageHeight:this.g.h,headerHeight:this.g.header,mobile:this.g.stacked,motionMode:this.g.motionMode,active:this.active||0,paused:v?.paused??true,seeking:v?.seeking??false,currentTime:v?.currentTime??0,targetTime:s?.targetTime??0,presentedTime:s?.presentedTime??0,firstFrame:s?.firstFrame??true,failed:this.failed,seekRequestCount:s?.seekCount??0,stage:this.stage.getBoundingClientRect().toJSON(),media:this.stage.querySelector('.story-media')?.getBoundingClientRect().toJSON()};
    }
  }
  // Measure glyph geometry at its natural size, independent of the previous scroll pose.
  const measurePanel=el=>{
    const props=['--story-copy-x','--story-copy-y','--copy-scale'],saved=props.map(k=>el.style.getPropertyValue(k));
    el.style.setProperty('--story-copy-x','0px');el.style.setProperty('--story-copy-y','0px');el.style.setProperty('--copy-scale','1');
    const h=el.querySelector('h2,h3'),r=document.createRange();r.selectNodeContents(h);
    const boxes=[...r.getClientRects()].filter(b=>b.width>1&&b.height>1),box=el.getBoundingClientRect();
    const headingCenter=boxes.length?(Math.min(...boxes.map(b=>b.left))+Math.max(...boxes.map(b=>b.right)))/2-box.left:el.offsetWidth/2;
    const out={left:el.offsetLeft,width:el.offsetWidth,height:el.offsetHeight,headingH:h.offsetHeight,headingCenter};
    props.forEach((k,i)=>saved[i]?el.style.setProperty(k,saved[i]):el.style.removeProperty(k));return out;
  };
  const selectPanel=(story,p,ranges)=>{
    let active=0;
    story.panels.forEach((el,i)=>{
      const [a,b]=ranges[i];const opacity=(a===0?1:smooth(a,a+.035,p))*(b===1?1:1-smooth(b-.035,b,p));
      set(el,'--story-copy-opacity',opacity.toFixed(4));set(el,'--story-copy-y',((1-opacity)*10).toFixed(2)+'px');set(el,'--story-copy-x',((1-opacity)*(el.classList.contains('copy-end')?24:-24)).toFixed(2)+'px');
      if(opacity>.5)active=i;el.setAttribute('aria-hidden',opacity<.01?'true':'false');
    });story.active=active;
  };
  const attachModel=(story,host,poster)=>{
    story.ensureModel=()=>{
      if(story.model)return;
      if(!globalThis.PixiraPhoneModel){story.fail();return}
      story.model=new PixiraPhoneModel(host,story.scrubber.video,poster,()=>story.request(),()=>story.fail());
    };
  };
  // The entire native screen remains visible on narrow displays. Perspective comes from real geometry.
  const mobilePose=(g,p,reverse=false)=>{
    const available=g.h-g.copyH-44, height=Math.min(available*.96,g.w*1.58,740);
    return{x:.5+Math.sin(p*Math.PI)*.018*(reverse?-1:1),y:(g.copyH+24+available/2)/g.h,height:height*(.94+.04*Math.sin(p*Math.PI)),rx:mix(4,6,p),ry:(reverse?1:-1)*(5+2*Math.sin(p*Math.PI)),rz:0};
  };
  globalThis.PixiraMotion={Timeline,Scrubber,clamp,mix,smooth,set,text,dict,selectPanel,attachModel,mobilePose,measurePanel};
})();

/* One opaque device shot; dolly into the actual native original, then compare outputs. */
(()=>{
'use strict';
const section=document.getElementById('redevelop');if(!section)return;
const {Timeline,Scrubber,clamp,mix,set,text,dict,selectPanel,attachModel,measurePanel}=PixiraMotion;
const {ease,pose,quadMatrix,margin,dock,storyProgress}=PixiraKinematics;
const legacy=section.querySelector('.redevelop-proof');legacy.classList.add('edit-fallback');
const journey=document.createElement('div');journey.className='edit-story flow-story';
const poster='/assets/demos/pixira-story-v2-en-poster.webp?v=5b172684e8bc';
journey.innerHTML=`<div class="edit-stage story-stage"><div class="phone-model-host story-media"><figure class="model-poster"><img src="/assets/models/pixira-redevelop-iphone17.webp" alt="" class="device-still story-cover"></figure><video class="model-video-source" muted playsinline preload="none" aria-hidden="true"></video></div><div class="story-copy-stack">${[1,2,3].map((n,i)=>`<article class="story-copy ${i===0?'copy-end':'copy-start'}" id="${['redevelop-photo','edit-room','originals'][i]}">${text('h3','redevelop'+n)}${text('p','redevelop'+n+'Text','story-description')}${text('p','demoShortened','story-disclosure')}</article>`).join('')}</div><div class="macro-paper paper-material" aria-hidden="true"></div><div class="scene-bridge">${text('span','proofOriginal')}</div><div class="result-photo-plane" aria-hidden="true">${['original','redeveloped','edited'].map((name,i)=>`<div class="result-photo-layer result-layer-${i}"><div class="result-image-transform"><img src="/assets/demos/proof-${name}-photo.webp?v=1ef9fc42eae5" width="1448" height="1086" alt=""></div></div>`).join('')}<i class="result-divider"></i></div><div class="result-shade" aria-hidden="true"></div><div class="result-caption"><div class="result-heading">${text('h2','resultTitle')}</div><div class="result-labels">${text('span','proofOriginal','result-before')}${text('span','proofOriginal','result-after')}</div></div><nav class="result-steps" aria-label="${dict().resultTitle.replace(/<[^>]*>/g,' ')}">${['Original','Redeveloped','Edited'].map((n,i)=>`<button type="button" data-result-step="${i}"><span class="result-step-track" aria-hidden="true"><i></i></span><span class="result-step-number">0${i+1}</span>${text('span','proof'+n,'result-step-label')}</button>`).join('')}</nav><div class="film-tools"><button type="button" class="screen-open film-screen-open" data-aria="screenExpand" aria-label="${dict().screenExpand}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg></button></div></div>`;
section.append(journey);section.classList.add('edit-section');
const stage=journey.firstElementChild,matte=stage.querySelector('.macro-paper'),bridge=stage.querySelector('.scene-bridge'),host=stage.querySelector('.phone-model-host'),plane=stage.querySelector('.result-photo-plane'),caption=stage.querySelector('.result-caption'),labels=stage.querySelector('.result-labels'),before=stage.querySelector('.result-before'),after=stage.querySelector('.result-after'),tools=stage.querySelector('.film-tools'),open=tools.firstElementChild,layer1=stage.querySelector('.result-layer-1'),layer2=stage.querySelector('.result-layer-2'),divider=stage.querySelector('.result-divider'),shade=stage.querySelector('.result-shade'),steps=stage.querySelector('.result-steps'),stepButtons=[...steps.querySelectorAll('button')];
function label(el,key){if(el.dataset.i18n!==key){el.dataset.i18n=key;el.textContent=dict()[key]}}
const story=new Timeline(journey,stage,{
 distance:g=>g.stacked?8.5:9,className:'film-reading',
 fit(s){
  s.panels=[...stage.querySelectorAll('.story-copy')];s.panels.forEach(e=>e._flow=measurePanel(e));
  const copyH=Math.max(...s.panels.map(e=>e.scrollHeight));s.g.copyH=copyH;set(journey,'--story-copy-h',copyH+'px');
  if(copyH>(s.g.stacked?s.g.h*.52:s.g.h*.88)||s.g.stacked&&s.g.h-copyH-44<210)s.enabled=false;
  section.classList.toggle('edit-live',s.enabled);set(stage,'--result-steps-h',steps.offsetHeight+'px');s.g.bridgeWidth=bridge.offsetWidth;s.g.bridgeBottom=bridge.offsetTop+bridge.offsetHeight;
 },
 render(s,clock,g){
  const p=storyProgress(clock);
  const w=clamp(p/.59),d=ease(.59,.78,p),flatten=ease(.79,.87,p),base=pose('film',1,g);
  // Give the original label a clear reading band before the camera moves into the photo.
  if(!g.stacked&&!g.portraitTablet&&g.h>=480){base.height*=.86;base.y=.56;}
  const originalReady=s.scrubber.firstFrame&&Math.abs(s.scrubber.presentedTime-10.3)<.08;
  s.phase=p<.59?'workflow':p<.86?'dolly':'result';
  selectPanel(s,w,[[0,.27],[.27,.675],[.675,.91]]);dock(s.panels[1],g,w);
  let device=pose('film',w,g);
  const align=ease(.52,.585,p);for(const key of['x','y','height','rx','ry','rz'])device[key]=mix(device[key],base[key],align);
  if(p>=.59){
   const zoom=1.1*Math.max(g.w/(base.height*.44536*Math.cos(16*Math.PI/180)),g.h/(base.height/3));
   device={...base,height:1/((1-d)/base.height+d/(base.height*zoom)),rx:mix(base.rx,0,d),ry:mix(base.ry,0,d),rz:mix(base.rz,0,d),focusWeight:d,focusU:g.stacked?.48:.5,focusV:.5};
  }
  s.model?.setOpacity(1);s.model?.render(device,g);
  const toolsOpacity=1-ease(.57,.61,p);set(tools,'opacity',toolsOpacity.toFixed(4));tools.style.visibility=toolsOpacity<.01?'hidden':'visible';tools.style.pointerEvents=toolsOpacity>.99?'auto':'none';open.disabled=toolsOpacity<.99;
  const focusU=g.stacked?.48:.5,pw=Math.max(g.w,g.h*4/3),ph=pw*.75,left=g.w/2-focusU*pw,top=(g.h-ph)/2;
  const target=[{x:left,y:top},{x:left+pw,y:top},{x:left+pw,y:top+ph},{x:left,y:top+ph}];
  const native=s.model?.projectScreenRect({left:0,top:456/1392,right:1,bottom:936/1392});
  const cover=native?margin(native,g.w,g.h):-Infinity;document.documentElement.classList.toggle('proof-reading',g.active&&cover>=0);
  const screen=s.model?.projectScreenRect({left:0,top:0,right:1,bottom:1}),screenMargin=screen?margin(screen,g.w,g.h):-Infinity;
  const bridgeX=screen?screen.reduce((sum,v)=>sum+v.x,0)/4:g.w*.5;set(bridge,'--bridge-x',Math.max(24+g.bridgeWidth/2,Math.min(g.w-24-g.bridgeWidth/2,bridgeX)).toFixed(3)+'px');
  const paperAlpha=ease(.67,.73,p)*ease(6,36,screenMargin);set(matte,'opacity',paperAlpha.toFixed(4));
  const screenTop=screen?Math.min(...screen.map(v=>v.y))-device.height*.02:Infinity;
  const bridgeAlpha=(originalReady?1:0)*ease(.535,.555,p)*(1-ease(.65,.69,p))*ease(g.bridgeBottom+20,g.bridgeBottom+56,screenTop);set(bridge,'opacity',bridgeAlpha.toFixed(4));bridge.setAttribute('aria-hidden',bridgeAlpha<.01?'true':'false');
  const opacity=p>=.91?1:originalReady?ease(.565,.59,p):0;
  const corners=(native||target).map((v,i)=>({x:mix(v.x,target[i].x,flatten),y:mix(v.y,target[i].y,flatten)}));
  set(plane,'--photo-matrix','matrix3d('+quadMatrix(corners).map(v=>+v.toFixed(8)).join(',')+')');set(plane,'opacity',opacity.toFixed(4));
  host.style.visibility=opacity>=.999&&p>=.86?'hidden':'visible';
  const cp=clamp((p-.86)/.14),first=ease(.24,.38,cp),second=ease(.62,.76,cp);
  const clip=value=>g.rtl?`inset(0 ${(1-value)*100}% 0 0)`:`inset(0 0 0 ${(1-value)*100}%)`;
  layer1.style.clipPath=clip(first);layer2.style.clipPath=clip(second);
  const value=cp<.51?first:second,splitting=value>.001&&value<.999;
  set(divider,'opacity',splitting?'1':'0');set(divider,g.rtl?'right':'left',(100*(1-value)).toFixed(4)+'%');set(divider,g.rtl?'left':'right','auto');
  const chrome=ease(.82,.86,p)*ease(0,24,cover);set(caption,'opacity',chrome.toFixed(4));set(shade,'opacity',chrome.toFixed(4));set(steps,'opacity',chrome.toFixed(4));steps.style.visibility=chrome>.01?'visible':'hidden';
  const chapter=cp<.31?0:cp<.69?1:2;stepButtons.forEach((button,i)=>{button.setAttribute('aria-current',i===chapter?'step':'false');set(button,'--step-fill',clamp((cp-[0,.31,.69][i])/[.31,.38,.31][i]).toFixed(5))});labels.classList.toggle('is-settled',!splitting);
  label(before,cp<.51?'proofOriginal':'proofRedeveloped');label(after,splitting?(cp<.51?'proofRedeveloped':'proofEdited'):(second>=.999?'proofEdited':first>=.999?'proofRedeveloped':'proofOriginal'));
  s.resultState={progress:cp,authoredProgress:p,screenMargin,paperAlpha,chapter:chapter+1,originalReady,dolly:d,flatten,opacity,corners,nativeCovered:cover>=0,coverageMargin:cover,first,second,label:after.textContent,deviceAlpha:1,deviceVisible:host.style.visibility!=='hidden'};
  if(w<.26){const time=mix(.75,5.4333,ease(.01,.25,w));return time>2.83&&time<3.3?3.3:time}
  if(w<.70)return mix(5.534,9.2,ease(.40,.66,w));
  return mix(9.301,10.3,ease(.72,.90,w));
 }
});
story.scrubber=new Scrubber(story,stage.querySelector('video'),stage.querySelector('.story-cover'),'/assets/demos/pixira-flow-viewer-en.mp4?v=0d4a0b0d2e6c');attachModel(story,host,poster);story.fit();open.addEventListener('click',e=>PixiraScreen.open(story.scrubber.video,e.currentTarget));
stepButtons.forEach((button,i)=>button.addEventListener('click',()=>{const p=.66+.34*[.10,.50,.90][i];scrollTo({top:journey.getBoundingClientRect().top+scrollY-story.g.header+p*(journey.offsetHeight-story.g.h),behavior:story.reduced.matches?'instant':'smooth'});story.request()}));
const summary=document.createElement('div');summary.className='comparison-summary flow-summary';summary.innerHTML=['Original','Redeveloped','Edited'].map(n=>`<figure><img src="/assets/demos/proof-${n.toLowerCase()}-photo.webp?v=1ef9fc42eae5" width="1448" height="1086" loading="lazy" alt="">${text('figcaption','proof'+n)}</figure>`).join('');journey.after(summary);
const targets=['redevelop-photo','edit-room','originals'];function anchor(){const i=targets.indexOf(location.hash.slice(1));if(i<0)return;if(!story.enabled){const e=legacy.querySelectorAll('.feature-grid article')[i]||legacy;scrollTo({top:e.getBoundingClientRect().top+scrollY-story.g.header-24,behavior:'instant'});return}scrollTo({top:journey.getBoundingClientRect().top+scrollY-story.g.header+[.06,.33,.53][i]*(.66/.86)*(journey.offsetHeight-story.g.h),behavior:'instant'});story.request()}
addEventListener('hashchange',anchor);document.fonts.ready.then(anchor);
if(new URLSearchParams(location.search).has('motion-qa')||new URLSearchParams(location.search).has('flow-record')){
 globalThis.PixiraStoryQA={sample:()=>story.sample(),exportStill:()=>story.model.exportStill()};
 globalThis.PixiraComparisonQA={sample:()=>({...story.sample(),progress:clamp((storyProgress(story.raw)-.86)/.14),shownProgress:clamp((storyProgress(story.p)-.86)/.14)})};
}
})();
