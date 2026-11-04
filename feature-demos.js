(() => {
  'use strict';
  const section=document.querySelector('#redevelop'),legacy=section?.querySelector('.redevelop-proof');
  if(!section||!legacy)return;
  const dict=globalThis.PixiraLocaleData?.COPY?.[document.documentElement.lang]||{};
  const text=(key,fallback='')=>dict[key]||fallback;
  const set=(el,key,value)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value)};
  const chapters=[
    {id:'redevelop-photo',name:'REDEVELOP',key:'redevelop1',start:0,end:5.4333,beats:[[.16,0],[.34,1.4],[.46,2.8],[.60,4.45],[.78,5.4333]]},
    {id:'edit-room',name:'EDIT ROOM',key:'redevelop2',start:5.534,end:9.2,beats:[[.16,5.534],[.32,6.4],[.48,7.9],[.60,8.7],[.78,9.2]]},
    {id:'originals',name:'ORIGINALS',key:'redevelop3',start:9.301,end:10.6,beats:[[.16,9.301],[.34,9.9],[.54,10.6],[.78,10.6]]}
  ];
  const source='/assets/demos/pixira-story-v2-en.mp4?v=ba83cabb9a00';
  const poster='/assets/demos/pixira-story-v2-en-poster.webp?v=5b172684e8bc';
  const qa=new URLSearchParams(location.search).has('motion-qa');
  section.classList.remove('section-pad');section.classList.add('scroll-films');
  const journey=document.createElement('div');journey.className='film-journey film-flow';
  journey.innerHTML=`<span class="film-viewport-probe" aria-hidden="true"></span><div class="film-stage"><div class="film-layout"><p class="film-kicker-common" lang="en" aria-hidden="true"><span>01</span><span>REDEVELOP</span></p><div class="film-copy-stack">${chapters.map((c,i)=>`<article class="film-copy" id="${c.id}" data-film-index="${i}"><div class="film-copy-content"><p class="film-kicker" lang="en"><span>0${i+1}</span> ${c.name}</p><h3 data-i18n="${c.key}">${text(c.key,c.name)}</h3><p class="film-description" data-i18n="${c.key}Text">${text(c.key+'Text')}</p></div><figure class="film-static-proof"><div class="official-phone"><div class="phone-screen-clip"><img class="phone-screen-app" src="/assets/demos/${['redevelop','edit-room','originals'][i]}-proof-en.webp" width="640" height="1392" loading="lazy" alt="Pixira ${c.name} proof frame"></div><img class="phone-bezel" src="/assets/iphone-18-pro-silver-portrait.png" width="1350" height="2760" loading="lazy" alt="" aria-hidden="true"></div></figure></article>`).join('')}</div><figure class="film-echo" aria-hidden="true"><div class="official-phone"><div class="phone-screen-clip"><img class="phone-screen-app film-echo-screen" src="/assets/demos/redevelop-proof-en.webp" width="640" height="1392" loading="lazy" alt=""></div><img class="phone-bezel" src="/assets/iphone-18-pro-silver-portrait.png" width="1350" height="2760" loading="lazy" alt=""></div></figure><figure class="film-device"><div class="official-phone"><div class="phone-screen-clip"><video class="phone-screen-app" data-scroll-film muted playsinline preload="none" poster="${poster}" aria-label="Pixira — real English app walkthrough"></video><img class="phone-screen-app film-loading-frame" src="${poster}" width="640" height="1392" alt="" aria-hidden="true"></div><img class="phone-bezel" src="/assets/iphone-18-pro-silver-portrait.png" width="1350" height="2760" loading="lazy" decoding="async" alt="" aria-hidden="true"></div></figure></div><div class="film-route" lang="en" dir="ltr" aria-hidden="true">${chapters.map((c,i)=>`<span><i></i>0${i+1} ${c.name}</span>`).join('')}</div></div>`;
  legacy.replaceWith(journey);
  const wrapper=section.querySelector(':scope > .wrap');if(wrapper){[...wrapper.children].forEach(e=>section.append(e));wrapper.remove();}
  const note=document.createElement('p');note.className='film-note';note.lang='en';note.textContent='Pixira in action';section.querySelector('.redevelop-heading').append(note);
  const stage=journey.querySelector('.film-stage'),layout=journey.querySelector('.film-layout'),copies=[...journey.querySelectorAll('.film-copy')],device=journey.querySelector('.film-device'),echo=journey.querySelector('.film-echo'),echoScreen=journey.querySelector('.film-echo-screen'),video=device.querySelector('video'),route=[...journey.querySelectorAll('.film-route span')];
  const saveData=navigator.connection?.saveData===true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p)};
  let pinned=false,mobile=false,compact=false,active=false,loading=false,failed=false,blobURL=null;
  let rawT=0,shownT=0,targetTime=0,presentedTime=0,presentedFrames=0,clock=0,frame=0,layoutFrame=0,current=-1,lastRequestedFrame=-1,lastSeekAt=0,seekRequestCount=0;
  let firstFrameReady=false;const loadingFrame=device.querySelector('.film-loading-frame');
  let geometry={phoneWidth:300,watch:[1,1,1],copyHeight:180,baseCenter:0,copyCenter:0,copyShift:0,layoutWidth:0,watchScale:1};
  const abort=new AbortController();
  function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
  async function load(){
    if(loading||failed||reduced.matches)return;loading=true;stage.dataset.loading='true';
    try{
      const response=await fetch(source,{signal:abort.signal,cache:'force-cache'});if(!response.ok)throw new Error('HTTP '+response.status);
      const blob=await response.blob();blobURL=URL.createObjectURL(blob);video.src=blobURL;video.preload='auto';video.load();
    }catch(error){
      if(error.name==='AbortError')return;
      video.src=source;video.preload='auto';video.load();
    }
  }
  function movieTime(index,u){
    const c=chapters[index],beats=c.beats;if(u<=beats[0][0])return c.start;if(u>=beats.at(-1)[0])return c.end;
    for(let i=1;i<beats.length;i++)if(u<=beats[i][0])return beats[i-1][1]+(beats[i][1]-beats[i-1][1])*smooth(beats[i-1][0],beats[i][0],u);
    return c.end;
  }
  function interpolatePose(t){
    const anchors=[[0,1,1],[.18,1,1],[.50,0,geometry.watchScale],[.78,0,geometry.watchScale],[1.02,-1,1],[1.18,-1,1],[1.50,0,geometry.watchScale],[1.78,0,geometry.watchScale],[2.02,1,1],[2.18,1,1],[2.50,0,geometry.watchScale],[2.78,0,geometry.watchScale],[3.08,1,1]];
    for(let i=1;i<anchors.length;i++){const a=anchors[i-1],b=anchors[i];if(t<=b[0]){const p=smooth(a[0],b[0],t);return {side:a[1]+(b[1]-a[1])*p,scale:a[2]+(b[2]-a[2])*p};}}
    const last=anchors.at(-1);return {side:last[1],scale:last[2]};
  }
  function draw(now){
    frame=0;if(document.hidden)return;
    const dt=clock?Math.min(1000,now-clock):16;clock=now;
    if(!pinned||!active||reduced.matches){clock=0;return;}
    const difference=rawT-shownT;
    shownT=Math.abs(difference)<.0004?rawT:shownT+difference*(1-Math.exp(-dt/65));
    const index=clamp(Math.floor(shownT),0,2),u=shownT-index;
    if(current!==index){current=index;stage.dataset.chapter=String(index);const marker=layout.querySelector('.film-kicker-common');marker.children[0].textContent='0'+(index+1);marker.children[1].textContent=chapters[index].name;echoScreen.src=index===0?poster:'/assets/demos/'+['','redevelop','edit-room'][index]+'-proof-en.webp';echoScreen.loading='eager';if(!firstFrameReady)loadingFrame.src=index===0?poster:'/assets/demos/'+['redevelop','edit-room','originals'][index]+'-open-en.webp';copies.forEach((e,i)=>e.classList.toggle('is-current',i===index));}
    const pose=interpolatePose(shownT),watching=1-Math.min(1,Math.abs(pose.side)*1.7);
    const paper=smooth(1.96,2.04,shownT);
    set(stage,'--film-paper',paper.toFixed(4));
    set(stage,'--film-ink',paper>.5?'#17191d':'#f5f3ed');
    set(stage,'--film-muted',paper>.5?'#606873':'#b9b8b4');
    set(stage,'--film-accent',paper>.5?'#955c37':'#d5ab86');
    let activeCopyOpacity=0;copies.forEach((copy,i)=>{
      const local=shownT-i,returnRead=i===2?smooth(3.08,3.20,shownT):0;
      const opacity=i===index?Math.max((i===0?1:smooth(.03,.12,local))*(1-smooth(.16,.24,local)),returnRead):0;
      if(i===index)activeCopyOpacity=opacity;set(copy,'--copy-opacity',opacity.toFixed(4));
      set(copy,'--copy-y',((1-opacity)*12)+'px');
      set(copy,'--title-opacity','1');set(copy,'--body-opacity','1');
    });
    const availableSide=Math.max(0,(geometry.layoutWidth-geometry.phoneWidth*pose.scale)/2-18),centreShift=geometry.layoutWidth/2-geometry.baseCenter,subjectX=mobile?clamp(pose.side*Math.min(28,availableSide),-availableSide,availableSide):pose.side>=0?(1-pose.side)*centreShift:centreShift+(-pose.side)*(geometry.copyCenter-geometry.layoutWidth/2);
    const copyX=mobile?0:geometry.copyShift*clamp(-pose.side);
    set(device,'--subject-scale',pose.scale.toFixed(5));set(device,'--subject-x',subjectX.toFixed(2)+'px');set(device,'--subject-y',(mobile?geometry.readY*(1-watching):(pose.scale-1)*geometry.phoneWidth*2760/1350/2-6*Math.sin(Math.PI*clamp(u)))+'px');set(layout,'--copy-shift',copyX.toFixed(2)+'px');
    set(echo,'--echo-visible',!mobile&&!compact&&geometry.layoutWidth>640?'1':'0');const mainCentre=geometry.baseCenter+subjectX,echoTarget=geometry.layoutWidth/2-Math.min(320,geometry.layoutWidth*.30),echoProgress=smooth(0,1,watching);set(echo,'--echo-x',(mainCentre+(echoTarget-mainCentre)*echoProgress).toFixed(2)+'px');set(echo,'--echo-y',(geometry.baseCenterY-6*Math.sin(Math.PI*clamp(u))).toFixed(2)+'px');
    set(stage,'--film-watch',watching.toFixed(4));set(stage,'--film-label',(1-smooth(0,.15,activeCopyOpacity)).toFixed(4));route.forEach((item,i)=>{item.classList.toggle('is-current',i===index);set(item,'--route-fill',clamp(shownT-i).toFixed(4))});
    const filmU=.16+clamp((u-.20)/.52)*.62;
    targetTime=movieTime(index,filmU);
    const wipeTop=(1-paper)*stage.offsetHeight;const markerPaper=wipeTop<(mobile?80:document.querySelector('.header').offsetHeight+36);set(stage,'--kicker-accent',markerPaper?'#955c37':'#d5ab86');document.documentElement.dataset.filmTone=wipeTop>document.querySelector('.header').offsetHeight?'ink':'paper';const routePaper=wipeTop<journey.querySelector('.film-route').offsetTop;set(stage,'--route-muted',routePaper?'#606873':'#b9b8b4');set(stage,'--route-accent',routePaper?'#955c37':'#d5ab86');
    let pendingSeek=false;
    if(video.readyState>=1&&!video.seeking&&!failed){
      const wanted=Math.round(clamp(targetTime,0,Math.max(0,video.duration-1/30))*30);
      if(wanted!==lastRequestedFrame){if(now-lastSeekAt>=1000/30){try{video.currentTime=wanted/30;lastRequestedFrame=wanted;lastSeekAt=now;seekRequestCount++;}catch(error){failed=true;stage.dataset.seekError=error.name}}else pendingSeek=true;}
    }
    if(qa){journey.dataset.progress=(rawT/3.25).toFixed(6);journey.dataset.shownProgress=(shownT/3.25).toFixed(6);video.dataset.targetTime=targetTime.toFixed(5);journey.dataset.watch=watching.toFixed(4)}
    if(shownT!==rawT||pendingSeek)request();else clock=0;
  }
  function update(now){
    layoutFrame=0;
    const r=journey.getBoundingClientRect(),stageHeight=stage.offsetHeight;
    const wasActive=active;active=r.top<innerHeight&&r.bottom>0;
    document.documentElement.classList.toggle('film-reading',pinned&&r.top<=0&&r.bottom>=stageHeight);
    const progress=pinned?clamp(-r.top/Math.max(1,journey.offsetHeight-stageHeight)):clamp((innerHeight*.65-r.top)/Math.max(innerHeight,journey.offsetHeight-innerHeight*.25));
    rawT=progress*3.25;if(active&&!wasActive){shownT=rawT;clock=0;}
    if(!pinned){
      device.style.removeProperty('--subject-scale');device.style.removeProperty('--subject-x');device.style.removeProperty('--subject-y');layout.style.removeProperty('--copy-shift');
      copies.forEach(copy=>{copy.style.removeProperty('--copy-opacity');copy.style.removeProperty('--copy-y');copy.style.removeProperty('--body-opacity')});
    }
    if(pinned&&r.top<innerHeight*4&&r.bottom>0&&!reduced.matches)load();
    if(!pinned){shownT=rawT;set(stage,'--film-paper','0');set(stage,'--film-ink','#f5f3ed');set(stage,'--film-muted','#b9b8b4');set(stage,'--film-accent','#d5ab86');return;}
    if(frame){cancelAnimationFrame(frame);frame=0;}
    draw(Number.isFinite(now)?now:performance.now());
  }
  function measure(){
    layoutFrame=0;mobile=innerWidth<800;
    const h=journey.querySelector('.film-viewport-probe').getBoundingClientRect().height||innerHeight;
    compact=h<600||(mobile&&h<740);journey.classList.toggle('film-compact',compact);
    const copyHeight=Math.max(...copies.map(copy=>copy.querySelector('.film-copy-content').scrollHeight));
    const top=mobile?100:90,bottom=mobile?64:60;
    const readHeight=mobile?h-top-copyHeight-24-bottom:compact?h-document.querySelector('.header').offsetHeight-32:h-155;
    pinned=!saveData&&!failed&&!reduced.matches&&parseFloat(getComputedStyle(document.documentElement).fontSize)<22&&readHeight>=(compact?(mobile?96:180):280)&&copyHeight<h-(compact&&!mobile?110:160);
    journey.classList.toggle('film-pinned',pinned);journey.classList.toggle('film-flow',!pinned);
    geometry.copyHeight=copyHeight;
    const header=document.querySelector('.header').offsetHeight,basePhoneHeight=mobile?Math.min(readHeight,h*.56):Math.min(h*.62,compact?h-header-32:h-header-80);
    geometry.phoneWidth=mobile?Math.min(innerWidth*.72,basePhoneHeight*1350/2760,350):Math.min(420,basePhoneHeight*1350/2760);
    journey.style.setProperty('--film-copy-height',copyHeight+'px');journey.style.setProperty('--film-phone-width',Math.max(compact?44:130,geometry.phoneWidth)+'px');
    if(pinned&&mobile){
      const phoneHeight=geometry.phoneWidth*2760/1350;
      geometry.watch=copies.map(()=>clamp((h-bottom-100)/phoneHeight,1,compact?3.2:1.8));
      geometry.watchScale=geometry.watch[0];
    }else{
      const phoneHeight=geometry.phoneWidth*2760/1350,watchHeight=Math.max(phoneHeight,(compact?h-header-32:h-header-80));
      geometry.watch=[1,1,1];geometry.watchScale=clamp(watchHeight/phoneHeight,1,compact?1.5:1.38);
    }
    geometry.readY=mobile?Math.min(0,100+copyHeight+24-(h-64-geometry.phoneWidth*2760/1350)):0;geometry.layoutWidth=layout.clientWidth;geometry.baseCenter=device.offsetLeft+device.offsetWidth/2;geometry.baseCenterY=device.offsetTop+device.offsetHeight/2;geometry.copyCenter=copies[0].parentElement.offsetLeft+copies[0].parentElement.offsetWidth/2;geometry.copyShift=geometry.layoutWidth-2*copies[0].parentElement.offsetLeft-copies[0].parentElement.offsetWidth;
    update();
  }
  const queue=()=>{if(!layoutFrame)layoutFrame=requestAnimationFrame(update)};
  const reflow=()=>{if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(measure)};
  video.addEventListener('loadedmetadata',()=>{stage.dataset.loading='false';update();request()});
  video.addEventListener('seeked',()=>{request();if(!('requestVideoFrameCallback'in video)&&Math.abs(video.currentTime-targetTime)<.08){firstFrameReady=true;loadingFrame.hidden=true}});
  video.addEventListener('error',()=>{failed=true;stage.dataset.failed='true';reflow()});
  video.addEventListener('play',()=>video.pause());
  if('requestVideoFrameCallback'in video){const presented=(_,m)=>{presentedTime=m.mediaTime;presentedFrames=m.presentedFrames;if(!firstFrameReady&&Math.abs(presentedTime-targetTime)<.08){firstFrameReady=true;loadingFrame.hidden=true}if(qa){video.dataset.presentedTime=presentedTime.toFixed(5);video.dataset.presentedFrames=String(presentedFrames)}if(qa||!firstFrameReady)video.requestVideoFrameCallback(presented)};video.requestVideoFrameCallback(presented)}
  if(qa)globalThis.PixiraStoryQA={sample:()=>({rawT,shownT,compact,mobile,copyHeight:geometry.copyHeight,phoneWidth:geometry.phoneWidth,baseCenter:geometry.baseCenter,copyCenter:geometry.copyCenter,copyShift:geometry.copyShift,layoutWidth:geometry.layoutWidth,watchScale:geometry.watchScale,lastRequestedFrame,seekRequestCount,targetTime,presentedTime,presentedFrames,pinned,active,failed,paused:video.paused,seeking:video.seeking,currentTime:video.currentTime,watch:geometry.watch.slice(),phone:device.getBoundingClientRect().toJSON(),echo:echo.getBoundingClientRect().toJSON(),copy:copies[Math.max(0,current)].getBoundingClientRect().toJSON()})};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',reflow);document.fonts?.addEventListener('loadingdone',reflow);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;clock=0;}else queue()});
  reduced.addEventListener?.('change',()=>{if(frame)cancelAnimationFrame(frame);frame=0;clock=0;reflow()});
  const observer=new MutationObserver(reflow);copies.forEach(copy=>observer.observe(copy.querySelector('.film-copy-content'),{subtree:true,childList:true,characterData:true}));
  const anchor=()=>{const i=chapters.findIndex(c=>'#'+c.id===location.hash);if(i<0)return;scrollTo({top:journey.getBoundingClientRect().top+scrollY+(pinned?(i+.06)/3.25*(journey.offsetHeight-stage.offsetHeight):0),behavior:'instant'});queue()};
  addEventListener('hashchange',anchor);measure();document.fonts?.ready.then(()=>{measure();anchor()});
  addEventListener('pagehide',event=>{if(event.persisted)return;abort.abort();if(blobURL)URL.revokeObjectURL(blobURL)},{once:true});
})();
