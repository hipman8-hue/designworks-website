(() => {
  'use strict';
  const section=document.getElementById('capture');if(!section)return;
  const {Timeline,Scrubber,mix,smooth,set,text,dict,selectPanel,attachModel,mobilePose,measurePanel}=PixiraMotion;
  const stage=section.querySelector('.capture-sticky'),fallback=section.querySelector('.capture-layout'),button=section.querySelector('.screen-open'),caption=button.parentElement;
  fallback.classList.add('capture-fallback');
  const live=document.createElement('div');live.className='capture-scene';
  const poster='/assets/demos/pixira-camera-story-en-poster.webp?v=4d0b9a7d1a1c';
  live.innerHTML=`<div class="capture-copy-stack story-copy-stack">${[['captureTitle','captureText'],['capture1','capture1Text'],['capture2','capture2Text']].map((keys,i)=>`<article class="story-copy ${i===0?'copy-start':'copy-end'}">${text(i===0?'h2':'h3',keys[0])}${text('p',keys[1],'story-description')}</article>`).join('')}</div><div class="capture-iphone phone-model-host story-media"><figure class="official-phone"><img src="/assets/models/pixira-camera-iphone17.webp" class="device-still story-cover" alt="" aria-hidden="true"></figure><video class="model-video-source" muted playsinline preload="none" aria-hidden="true"></video></div><div class="capture-tools"></div><div class="story-trace" aria-hidden="true"><span></span><span></span><span></span></div>`;
  const focus=document.createElement('div');focus.className='flow-focus';focus.innerHTML=text('span','capture1');live.append(focus);stage.append(live);section.classList.add('capture-story');stage.classList.add('story-stage');
  button.dataset.aria='screenExpand';button.setAttribute('aria-label',dict().screenExpand);
  const story=new Timeline(section,stage,{
    distance:g=>g.stacked?3.2:3.6,className:'capture-reading',
    fit(s){
      s.panels=[...live.querySelectorAll('.story-copy')];s.panels.forEach(e=>e._flow=measurePanel(e));const copyH=Math.max(...s.panels.map(e=>e.scrollHeight));set(section,'--story-copy-h',copyH+'px');s.g.copyH=copyH;
      const mediaH=s.g.stacked?Math.min(s.g.h-copyH-56,s.g.h*.76,(s.g.w-48)*2760/1350):Math.min(s.g.h*.86,760,s.g.w*.42*2760/1350);
      if(mediaH<210||copyH>(s.g.stacked?s.g.h*.58:s.g.h*.88))s.enabled=false;
      set(section,'--capture-phone-h',mediaH+'px');(s.enabled?live.querySelector('.capture-tools'):caption).append(button);
    },
    render(s,p,g){
      selectPanel(s,p,g.motionMode==='tablet'&&!g.portraitTablet&&g.h>=480?[[0,.24],[.30,.675],[.675,1]]:[[0,.27],[.27,.675],[.675,1]]);PixiraKinematics.dock(s.panels[1],g,p);
      const pose=PixiraKinematics.semanticPose('capture',p,g,PixiraKinematics.pose('capture',p,g));set(live.querySelector('.phone-model-host'),'--native-focus-top',(pose.semantic?.clipTop||0)+'px');s.model?.setOpacity(1);s.model?.render(pose,g);
      set(focus,'--focus-opacity',(PixiraKinematics.ease(.24,.28,p)*(1-PixiraKinematics.ease(.38,.42,p))).toFixed(4));
      if(p<.24)return mix(1.2,1.9,smooth(.03,.22,p));
      if(p<.42)return mix(1.9,4.3,smooth(.24,.40,p));
      if(p<.68)return mix(4.3,6.1,smooth(.43,.65,p));
      return mix(6.201,11.7667,smooth(.70,g.motionMode==='desktop'?.96:.90,p));
    }
  });
  story.scrubber=new Scrubber(story,live.querySelector('video'),live.querySelector('.story-cover'),'/assets/demos/pixira-camera-story-en.mp4?v=721f57269385');attachModel(story,live.querySelector('.phone-model-host'),poster);story.fit();
  const note=document.createElement('div');note.className='capture-note wrap';note.innerHTML=text('h3','capture3')+text('p','capture3Text');section.after(note);
  button.addEventListener('click',()=>{
    const target=document.querySelector('#screen-dialog>img'),video=story.scrubber.video;if(!target||video.readyState<2)return;
    try{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);target.src=c.toDataURL('image/webp',.94);target.removeAttribute('srcset')}catch{}
  });
  if(new URLSearchParams(location.search).has('motion-qa')||new URLSearchParams(location.search).has('flow-record'))globalThis.PixiraCaptureQA={sample:()=>({...story.sample(),nativeFocus:story.model?.pose?.semantic?{point:story.model.projectScreenRect({left:story.model.pose.focusU,top:story.model.pose.focusV,right:story.model.pose.focusU,bottom:story.model.pose.focusV})?.[0],screen:story.model.projectScreenRect({left:0,top:0,right:1,bottom:1})}:null}),exportStill:()=>story.model.exportStill()};
})();
