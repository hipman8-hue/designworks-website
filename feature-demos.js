(() => {
  if(document.body.classList.contains('feature-page')) document.documentElement.classList.remove('no-js');
  const from = new URLSearchParams(location.search).get('from');
  const home = document.querySelector('[data-feature-home]');
  if(home && ['ko','en','ja','zh-CN','ar','cs','da','de','el','es-MX','fi','fr','he','hi','hu','id','it','ms','nb','nl','pl','pt-BR','ro','ru','sv','th','tr','uk','vi'].includes(from)) home.href='/'+from+'/';
  const section = document.querySelector('#redevelop');
  const legacyProof = section?.querySelector('.redevelop-proof');
  if (section && legacyProof) {
    const dictionary = globalThis.PixiraLocaleData?.COPY?.[document.documentElement.lang] || {};
    const text = (key, fallback) => dictionary[key] || fallback;
    section.classList.remove('section-pad');
    section.classList.add('demo-chapters');
    legacyProof.outerHTML = `
      <article class="demo-chapter demo-redevelop" data-feature-demo>
        <div class="demo-copy"><p class="demo-kicker" lang="en">REDEVELOP</p><h3 data-i18n="redevelop1">${text('redevelop1', '사진과 영상 다시현상')}</h3><p data-i18n="redevelop1Text">${text('redevelop1Text', '앨범에 있던 장면을 불러와 원하는 카메라의 분위기로 바꿉니다.')}</p><a class="demo-detail-link" data-feature-link href="/features/redevelop/" lang="en">See the full demo</a></div>
        <figure class="demo-device"><div class="official-phone"><div class="phone-screen-clip"><video aria-label="Actual Pixira app screen — English demo" class="phone-screen-app demo-video" data-demo-video data-src="/assets/demos/redevelop-en.mp4" loop muted playsinline poster="/assets/demos/redevelop-en-poster.webp" preload="none"></video></div><img alt="" aria-hidden="true" class="phone-bezel" decoding="async" height="2760" loading="lazy" src="/assets/iphone-18-pro-silver-portrait.png" width="1350"></div><figcaption><span data-i18n="redevelopScreenCaption">${text('redevelopScreenCaption', 'Pixira 실제 앱 화면')}</span><button aria-pressed="false" class="demo-play" data-demo-toggle type="button" lang="en">Play demo</button></figcaption></figure>
      </article>
      <article class="demo-chapter demo-edit" data-feature-demo>
        <div class="demo-copy"><p class="demo-kicker" lang="en">EDIT ROOM</p><h3 data-i18n="redevelop2">${text('redevelop2', '에디트룸에서 세밀하게')}</h3><p data-i18n="redevelop2Text">${text('redevelop2Text', '빛과 색을 조절하며, 사진을 원하는 분위기로 마무리하세요.')}</p><a class="demo-detail-link" data-feature-link href="/features/edit-room/" lang="en">See the full demo</a></div>
        <figure class="demo-device"><div class="official-phone"><div class="phone-screen-clip"><video aria-label="Actual Pixira app screen — English demo" class="phone-screen-app demo-video" data-demo-video data-src="/assets/demos/edit-room-en.mp4" loop muted playsinline poster="/assets/demos/edit-room-en-poster.webp" preload="none"></video></div><img alt="" aria-hidden="true" class="phone-bezel" decoding="async" height="2760" loading="lazy" src="/assets/iphone-18-pro-silver-portrait.png" width="1350"></div><figcaption><span data-i18n="redevelopScreenCaption">${text('redevelopScreenCaption', 'Pixira 실제 앱 화면')}</span><button aria-pressed="false" class="demo-play" data-demo-toggle type="button" lang="en">Play demo</button></figcaption></figure>
      </article>
      <article class="demo-chapter demo-originals" data-feature-demo>
        <div class="demo-copy"><p class="demo-kicker" lang="en">ORIGINALS</p><h3 data-i18n="redevelop3">${text('redevelop3', '원본은 그대로 보존')}</h3><p data-i18n="redevelop3Text">${text('redevelop3Text', '다시현상한 결과는 따로 저장해 처음의 기록도 남겨둡니다.')}</p><a class="demo-detail-link" data-feature-link href="/features/originals/" lang="en">See the full demo</a></div>
        <figure class="demo-device"><div class="official-phone"><div class="phone-screen-clip"><video aria-label="Actual Pixira app screen — English demo" class="phone-screen-app demo-video" data-demo-video data-src="/assets/demos/originals-en.mp4" loop muted playsinline poster="/assets/demos/originals-en-poster.webp" preload="none"></video></div><img alt="" aria-hidden="true" class="phone-bezel" decoding="async" height="2760" loading="lazy" src="/assets/iphone-18-pro-silver-portrait.png" width="1350"></div><figcaption><span data-i18n="redevelopScreenCaption">${text('redevelopScreenCaption', 'Pixira 실제 앱 화면')}</span><button aria-pressed="false" class="demo-play" data-demo-toggle type="button" lang="en">Play demo</button></figcaption></figure>
      </article>`;
  }

  const wrapper = section?.querySelector(':scope > .wrap');
  if (wrapper) { [...wrapper.children].forEach(child => section.append(child)); wrapper.remove(); }
  const chapters = [...document.querySelectorAll('[data-feature-demo]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  chapters.forEach(chapter => {
    if (chapter.classList.contains('demo-chapter')) {
      const stage = document.createElement('div'); stage.className = 'demo-stage';
      stage.append(...chapter.children); chapter.append(stage);
    }
  });
  const videos = chapters.map(c => c.querySelector('[data-demo-video]')).filter(Boolean);
  const buttonFor = video => video.closest('figure')?.querySelector('[data-demo-toggle]');
  const label = video => { const b=buttonFor(video); if(b){b.textContent=video.paused?'Play demo':'Pause demo'; b.setAttribute('aria-pressed',String(!video.paused));} };
  const load = video => { if (!video.src && video.dataset.src) {video.src=video.dataset.src;video.load();} };
  const pause = video => { video.pause(); label(video); };
  const play = video => {
    if (!video.paused || video.dataset.starting || video.dataset.failed) return;
    videos.forEach(other => {if(other!==video)pause(other)});
    load(video); video.dataset.starting='true';
    video.play().catch(()=>{}).finally(()=>{delete video.dataset.starting;label(video)});
  };
  videos.forEach(video => {
    ['play','pause','ended'].forEach(event => video.addEventListener(event,()=>label(video)));
    video.addEventListener('error',()=>{video.dataset.failed='true';pause(video);const b=buttonFor(video);if(b)b.hidden=true});
    buttonFor(video)?.addEventListener('click',()=>{
      if(video.paused){video.dataset.userPaused='false';play(video)}
      else {video.dataset.userPaused='true';pause(video)}
    });
  });
  let frame = 0;
  const update = () => {
    frame=0;
    const height=innerHeight;
    let active=null, nearest=Infinity;
    chapters.forEach(chapter=>{
      const rect=chapter.getBoundingClientRect();
      const progress=Math.min(1,Math.max(0,-rect.top/Math.max(1,rect.height-height)));
      chapter.style.setProperty('--demo-progress',progress.toFixed(4));
      const stage=chapter.querySelector('.demo-stage')||chapter;
      const r=stage.getBoundingClientRect(), visible=Math.min(height,r.bottom)-Math.max(0,r.top);
      const distance=Math.abs((r.top+r.bottom)/2-height/2);
      if(visible>Math.min(height*.38,300)&&distance<nearest){active=chapter;nearest=distance}
    });
    chapters.forEach(c=>c.classList.toggle('is-active',c===active));
    videos.forEach(video=>{
      const owns=active?.contains(video),r=video.getBoundingClientRect();
      if(!owns||document.hidden||r.bottom<80||r.top>height-80)pause(video);
      else if(!reduced.matches&&video.dataset.userPaused!=='true')play(video);
    });
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  const motionMode=()=>{
    document.documentElement.classList.toggle('has-demo-motion',!reduced.matches);
    if(reduced.matches)videos.forEach(pause);
    schedule();
  };
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(pause);else schedule()});
  reduced.addEventListener?.('change',motionMode);motionMode();
  document.querySelectorAll('[data-feature-link]').forEach(link=>{
    const language=document.documentElement.lang;
    if(language&&language!=='en')link.search=`?from=${encodeURIComponent(language)}`;
  });
})();
