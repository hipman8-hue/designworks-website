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
  journey.innerHTML=`<span class="film-viewport-probe" aria-hidden="true"></span><div class="film-stage"><div class="film-layout"><p class="film-kicker-common" lang="en" aria-hidden="true"><span>01</span><span>REDEVELOP</span></p><div class="film-copy-stack">${chapters.map((c,i)=>`<article class="film-copy" id="${c.id}" data-film-index="${i}"><div class="film-copy-content"><p class="film-kicker" lang="en"><span>0${i+1}</span> ${c.name}</p><h3 data-i18n="${c.key}">${text(c.key,c.name)}</h3><p class="film-description" data-i18n="${c.key}Text">${text(c.key+'Text')}</p></div><figure class="film-static-proof"><div class="official-phone"><div class="phone-screen-clip"><img class="phone-screen-app" src="/assets/demos/${['redevelop','edit-room','originals'][i]}-proof-en.webp" width="640" height="1392" loading="lazy" alt="Pixira ${c.name} proof frame"></div><img class="phone-bezel" src="/assets/iphone-18-pro-silver-portrait.png" width="1350" height="2760" loading="lazy" alt="" aria-hidden="true"></div></figure></article>`).join('')}</div><figure class="film-device"><div class="official-phone"><div class="phone-screen-clip"><video class="phone-screen-app" data-scroll-film muted playsinline preload="none" poster="${poster}" aria-label="Pixira — real English app walkthrough"></video><img class="phone-screen-app film-loading-frame" src="${poster}" width="640" height="1392" alt="" aria-hidden="true"></div><img class="phone-bezel" src="/assets/iphone-18-pro-silver-portrait.png" width="1350" height="2760" loading="lazy" decoding="async" alt="" aria-hidden="true"></div></figure></div><div class="film-route" lang="en" dir="ltr" aria-hidden="true">${chapters.map((c,i)=>`<span><i></i>0${i+1} ${c.name}</span>`).join('')}</div></div>`;
  legacy.replaceWith(journey);
  const wrapper=section.querySelector(':scope > .wrap');if(wrapper){[...wrapper.children].forEach(e=>section.append(e));wrapper.remove();}
  const note=document.createElement('p');note.className='film-note';note.lang='en';note.textContent='Pixira in action';section.querySelector('.redevelop-heading').append(note);
  const stage=journey.querySelector('.film-stage'),layout=journey.querySelector('.film-layout'),copies=[...journey.querySelectorAll('.film-copy')],device=journey.querySelector('.film-device'),video=device.querySelector('video'),route=[...journey.querySelectorAll('.film-route span')];
  const saveData=navigator.connection?.saveData===true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p)};
  let pinned=false,mobile=false,active=false,loading=false,failed=false,blobURL=null;
  let rawT=0,shownT=0,targetTime=0,presentedTime=0,presentedFrames=0,clock=0,frame=0,layoutFrame=0,current=-1,lastRequestedFrame=-1,lastSeekAt=0,seekRequestCount=0;
  let firstFrameReady=false;const loadingFrame=device.querySelector('.film-loading-frame');
  let geometry={phoneWidth:300,watch:[1,1,1],copyHeight:180};
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
  function draw(now){
    frame=0;if(document.hidden)return;
    const dt=clock?Math.min(1000,now-clock):16;clock=now;
    if(!pinned||!active||reduced.matches){clock=0;return;}
    const difference=rawT-shownT;
    shownT=Math.abs(difference)<.0004?rawT:shownT+difference*(1-Math.exp(-dt/65));
    const index=clamp(Math.floor(shownT),0,2),u=shownT-index;
    if(current!==index){current=index;stage.dataset.chapter=String(index);const marker=layout.querySelector('.film-kicker-common');marker.children[0].textContent='0'+(index+1);marker.children[1].textContent=chapters[index].name;if(!firstFrameReady)loadingFrame.src=index===0?poster:'/assets/demos/'+['redevelop','edit-room','originals'][index]+'-open-en.webp';copies.forEach((e,i)=>e.classList.toggle('is-current',i===index));}
    const pose=firstFrameReady?smooth(.22,.34,u)*(1-smooth(index===2?.86:.93,index===2?.93:1,u)):0;
    const paper=smooth(1.96,2.04,shownT);
    set(stage,'--film-paper',paper.toFixed(4));
    set(stage,'--film-ink',paper>.5?'#17191d':'#f5f3ed');
    set(stage,'--film-muted',paper>.5?'#606873':'#b9b8b4');
    set(stage,'--film-accent',paper>.5?'#955c37':'#d5ab86');
    copies.forEach((copy,i)=>{
      const local=shownT-i;
      const entry=i===0?1:smooth(0,.06,local),exit=i===2?1:1-smooth(.97,1,local);
      const opacity=entry*exit;
      set(copy,'--copy-opacity',opacity.toFixed(4));
      set(copy,'--copy-y',((1-entry)*16-(1-exit)*12+(mobile?0:-pose*7))+'px');
      const returnCopy=i===2?smooth(.90,.96,local):0;
      set(copy,'--title-opacity',(mobile?clamp(1-smooth(.22,.30,local)+returnCopy):1).toFixed(4));
      set(copy,'--body-opacity',(mobile?clamp(1-smooth(.20,.26,local)+returnCopy):1).toFixed(4));
    });
    const zoom=mobile?1+pose*(geometry.watch[index]-1):.97+.03*smooth(0,.18,shownT);
    set(device,'--subject-scale',zoom.toFixed(5));
    set(device,'--subject-y',(mobile?0:-8*Math.sin(Math.PI*clamp(u)))+'px');
    route.forEach((item,i)=>{item.classList.toggle('is-current',i===index);set(item,'--route-fill',clamp(shownT-i).toFixed(4))});
    const filmU=.16+clamp((u-.28)/.44)*.62;
    targetTime=movieTime(index,filmU);
    document.documentElement.dataset.filmTone=paper<.5?'ink':'paper';
    let pendingSeek=false;
    if(video.readyState>=1&&!video.seeking&&!failed){
      const wanted=Math.round(clamp(targetTime,0,Math.max(0,video.duration-1/30))*30);
      if(wanted!==lastRequestedFrame){if(now-lastSeekAt>=1000/30){try{video.currentTime=wanted/30;lastRequestedFrame=wanted;lastSeekAt=now;seekRequestCount++;}catch(error){failed=true;stage.dataset.seekError=error.name}}else pendingSeek=true;}
    }
    if(qa){journey.dataset.progress=(rawT/3.25).toFixed(6);journey.dataset.shownProgress=(shownT/3.25).toFixed(6);video.dataset.targetTime=targetTime.toFixed(5)}
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
      device.style.removeProperty('--subject-scale');device.style.removeProperty('--subject-y');
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
    const copyHeight=Math.max(...copies.map(copy=>copy.querySelector('.film-copy-content').scrollHeight));
    const top=mobile?100:90,bottom=mobile?64:60;
    const readHeight=mobile?h-top-copyHeight-24-bottom:h-155;
    pinned=!saveData&&!failed&&!reduced.matches&&parseFloat(getComputedStyle(document.documentElement).fontSize)<22&&readHeight>=280&&copyHeight<h-160;
    journey.classList.toggle('film-pinned',pinned);journey.classList.toggle('film-flow',!pinned);
    geometry.copyHeight=copyHeight;
    geometry.phoneWidth=mobile?Math.min(innerWidth*.72,readHeight*1350/2760,350):Math.min(420,readHeight*1350/2760);
    journey.style.setProperty('--film-copy-height',copyHeight+'px');journey.style.setProperty('--film-phone-width',Math.max(130,geometry.phoneWidth)+'px');
    if(pinned&&mobile){
      const phoneHeight=geometry.phoneWidth*2760/1350;
      geometry.watch=copies.map(()=>clamp((h-bottom-100)/phoneHeight,1,1.8));
    }else geometry.watch=[1,1,1];
    update();
  }
  const queue=()=>{if(!layoutFrame)layoutFrame=requestAnimationFrame(update)};
  const reflow=()=>{if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(measure)};
  video.addEventListener('loadedmetadata',()=>{stage.dataset.loading='false';update();request()});
  video.addEventListener('seeked',()=>{request();if(!('requestVideoFrameCallback'in video)&&Math.abs(video.currentTime-targetTime)<.08){firstFrameReady=true;loadingFrame.hidden=true}});
  video.addEventListener('error',()=>{failed=true;stage.dataset.failed='true';reflow()});
  video.addEventListener('play',()=>video.pause());
  if('requestVideoFrameCallback'in video){const presented=(_,m)=>{presentedTime=m.mediaTime;presentedFrames=m.presentedFrames;if(!firstFrameReady&&Math.abs(presentedTime-targetTime)<.08){firstFrameReady=true;loadingFrame.hidden=true}if(qa){video.dataset.presentedTime=presentedTime.toFixed(5);video.dataset.presentedFrames=String(presentedFrames)}if(qa||!firstFrameReady)video.requestVideoFrameCallback(presented)};video.requestVideoFrameCallback(presented)}
  if(qa)globalThis.PixiraStoryQA={sample:()=>({rawT,shownT,lastRequestedFrame,seekRequestCount,targetTime,presentedTime,presentedFrames,pinned,active,failed,paused:video.paused,seeking:video.seeking,currentTime:video.currentTime,watch:geometry.watch.slice()})};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',reflow);document.fonts?.addEventListener('loadingdone',reflow);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;clock=0;}else queue()});
  reduced.addEventListener?.('change',()=>{if(frame)cancelAnimationFrame(frame);frame=0;clock=0;reflow()});
  const observer=new MutationObserver(reflow);copies.forEach(copy=>observer.observe(copy.querySelector('.film-copy-content'),{subtree:true,childList:true,characterData:true}));
  const anchor=()=>{const i=chapters.findIndex(c=>'#'+c.id===location.hash);if(i<0)return;scrollTo({top:journey.getBoundingClientRect().top+scrollY+(pinned?(i+.06)/3.25*(journey.offsetHeight-stage.offsetHeight):0),behavior:'instant'});queue()};
  addEventListener('hashchange',anchor);measure();document.fonts?.ready.then(()=>{measure();anchor()});
  addEventListener('pagehide',event=>{if(event.persisted)return;abort.abort();if(blobURL)URL.revokeObjectURL(blobURL)},{once:true});
})();
