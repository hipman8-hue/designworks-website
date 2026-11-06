/* Deterministic scroll choreography: shared by hardware, typography and actual media. */
(()=>{
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=(a,b,p)=>{const u=clamp((p-a)/(b-a));return u*u*u*(10+u*(-15+6*u))};
function curve(frames,p){
 const keys=Object.keys(frames[0]).filter(k=>k!=='t');
 let i=0;while(i<frames.length-2&&p>frames[i+1].t)i++;
 const a=frames[i],b=frames[i+1],span=b.t-a.t,u=clamp((p-a.t)/span),u2=u*u,u3=u2*u,u4=u3*u,u5=u4*u;
 const slope=(index,k)=>{if(index===0||index===frames.length-1)return 0;const l=frames[index-1],c=frames[index],r=frames[index+1],d1=(c[k]-l[k])/(c.t-l.t),d2=(r[k]-c[k])/(r.t-c.t);return d1*d2>0?2*d1*d2/(d1+d2):0};
 const out={};for(const k of keys)out[k]=(1-10*u3+15*u4-6*u5)*a[k]+(u-6*u3+8*u4-3*u5)*span*slope(i,k)+(10*u3-15*u4+6*u5)*b[k]+(-4*u3+7*u4-3*u5)*span*slope(i+1,k);return out;
}
function quadMatrix(q,size=1000){
 const [a,b,c,d]=q,dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y,den=dx1*dy2-dx2*dy1;
 const g=Math.abs(den)>1e-8?(dx3*dy2-dx2*dy3)/den:0,h=Math.abs(den)>1e-8?(dx1*dy3-dx3*dy1)/den:0;
 return[(b.x-a.x+g*b.x)/size,(b.y-a.y+g*b.y)/size,0,g/size,(d.x-a.x+h*d.x)/size,(d.y-a.y+h*d.y)/size,0,h/size,0,0,1,0,a.x,a.y,0,1];
}
const CAPTURE=[{t:0,x:.72,y:.52,s:.90,rx:8,ry:-28,rz:7},{t:.18,x:.68,y:.50,s:1.01,rx:4,ry:-18,rz:3},{t:.33,x:.51,y:.53,s:1.10,rx:0,ry:0,rz:0},{t:.49,x:.28,y:.51,s:1.00,rx:-3,ry:22,rz:-4},{t:.67,x:.26,y:.51,s:1.06,rx:-4,ry:16,rz:-2},{t:.84,x:.28,y:.50,s:1.04,rx:2,ry:7,rz:1},{t:1,x:.30,y:.52,s:.98,rx:5,ry:-8,rz:3}];
const FILM=[{t:0,x:.28,y:.53,s:.92,rx:-6,ry:28,rz:-6},{t:.17,x:.29,y:.50,s:1.03,rx:0,ry:18,rz:-3},{t:.34,x:.51,y:.53,s:1.10,rx:0,ry:0,rz:0},{t:.50,x:.70,y:.51,s:1.04,rx:3,ry:-22,rz:4},{t:.70,x:.71,y:.51,s:1.06,rx:-2,ry:-12,rz:2},{t:.87,x:.68,y:.51,s:1.01,rx:4,ry:8,rz:-2},{t:1,x:.50,y:.50,s:.98,rx:1,ry:16,rz:-1}];
// Claude co-authored responsive paths load before this shared geometric fitter.
const authored=globalThis.PixiraAuthoredDeviceProfiles;
const desktop={capture:CAPTURE,film:FILM};
const PROFILES={desktop,tablet:authored?.tablet||desktop,mobile:authored?.mobile||desktop};
function pose(kind,p,g){
 const profile=g.motionMode||(g.stacked?'mobile':g.w<1200?'tablet':'desktop'),c=curve(PROFILES[profile][kind],p);
 if(g.stacked){
  const avail=g.h-g.copyH-44,base=Math.min(avail*.73,g.w*1.42,740,(g.h-g.copyH-56)/1.19),height=base*c.s;
  const rx=c.rx*.95,ry=c.ry*1.15,rz=c.rz*.8,rad=Math.PI/180;
  const projected=height*(.49*Math.abs(Math.cos(ry*rad))+.09*Math.sqrt(Math.sin(ry*rad)**2+.0004)+Math.sqrt(Math.sin(rz*rad)**2+.0004));
  const travel=Math.max(0,Math.min(.22,(g.w-projected*1.1-40)/(2*g.w)));
  // Keep a physical handset envelope below the measured localized copy.
  // Smooth bounded vertical travel preserves C2 motion even at the largest reading pose.
  const safeTop=g.copyH+36,safeBottom=g.h-20,room=Math.max(0,(safeBottom-safeTop-height*1.08)/2);
  return{profile,x:.5+travel*Math.tanh((c.x-.5)/.13),y:((safeTop+safeBottom)/2+room*Math.tanh((c.y-.515)*50))/g.h,height,rx,ry,rz};
 }
 if(profile==='mobile')return{profile,x:.72+(c.x-.5)*.8,y:.5+(c.y-.52)*.4,height:Math.min(g.h*.78,g.w*.45)*c.s,rx:c.rx*.7,ry:c.ry*.9,rz:c.rz*.6};
 if(g.portraitTablet){
  // Portrait tablet uses a complete editorial band above a large, independently orbiting device.
  const available=g.h-g.copyH-64,base=Math.min(available*.90,g.w*1.08,840),height=base*(.94+(c.s-.90)*.45),safeTop=g.copyH+48,safeBottom=g.h-20,room=Math.max(0,(safeBottom-safeTop-height*1.08)/2);
  return{profile,x:.5+(c.x-.5)*.8,y:((safeTop+safeBottom)/2+room*Math.tanh((c.y-.51)*20))/g.h,height,rx:c.rx*.85,ry:c.ry,rz:c.rz*.75};
 }
 const tablet=profile==='tablet',centre=ease(.20,.33,p)*(1-ease(.34,.49,p)),base=g.portraitTablet?Math.min(g.h*.84,g.w*1.26,940):Math.min(g.h*.76,g.w*.64,800);
 const out={...c,profile,x:g.portraitTablet?.5+(c.x-.5)*.82:c.x,y:c.y+(!tablet?.03*centre:0),height:base*c.s*(tablet?.98:1)*(g.h>=480?1-(tablet?0:.14)*centre:1)};
 if(tablet&&g.h>=480){const handover=ease(.235,.31,p);out.x=kind==='capture'?.73-.46*handover:.27+.46*handover;}
 // Predict the complete text block, so the device arcs below it before taking its side anchor.
 if(tablet&&p>.27&&p<.675&&g.avoidRect){
  const r=g.avoidRect,rad=Math.PI/180,half=out.height*(.49*Math.abs(Math.cos(out.ry*rad))+.11*Math.abs(Math.sin(out.ry*rad))+Math.abs(Math.sin(out.rz*rad)))*.55+12,cx=(g.rtl?1-out.x:out.x)*g.w;
  const overlap=Math.min(cx+half,r.right)-Math.max(cx-half,r.left),amount=ease(-48,-8,overlap)*ease(0,.7,r.alpha),cap=Math.max(160,(g.h-20-(r.bottom+24))/1.10);
  const safeHeight=(out.height+cap-Math.hypot(out.height-cap,8))/2,safeY=(r.bottom+24+g.h-20)/(2*g.h);
  out.height+=(safeHeight-out.height)*amount;out.y+=(safeY-out.y)*amount;
 }
 return out;
}
// Direct attention to the actual native action, rather than orbiting the whole handset.
// One owner of the complete responsive handset pose. App chapters change inside
// the same reading frame; they never reset to a small orbit between actions.
function responsivePose(kind,p,g){
 const vertical=g.stacked||g.portraitTablet,enter=ease(0,.10,p);
 const top=vertical?g.copyH+(g.stacked?56:80):36;
 const room=Math.max(160,g.h-top-24);
 const readingHeight=vertical?Math.min(g.w*(g.stacked?1.65:.98),room*.96,g.stacked?720:940):Math.min(g.h*.82,g.w*.72,820);
 const height=readingHeight*(.90+.10*enter),x=vertical?.5:.73;
 const y=vertical?(top+height*.5+20*(1-enter))/g.h:.50+.025*(1-enter);
 return{profile:g.motionMode,x,y,height,rx:4*(1-enter),ry:(kind==='capture'?-6:6)*(1-enter),rz:0,focusWeight:0,shadowInsideOnly:true,
  semantic:{key:kind==='capture'?(p<.27?'camera-choice':p<.675?'live-view':'optic-effect'):(p<.27?'redevelop-look':p<.675?'edit-controls':'original'),amount:0,closeup:false,clipTop:0}};
}
function semanticPose(kind,p,g,base){return g.motionMode==='desktop'?base:responsivePose(kind,p,g)}
// Preserve the established physical scroll length before the three result chapters.
function storyProgress(raw){const a=.86/.66,b=.14/.34;if(raw<=.64)return raw*a;if(raw>=.68)return .86+(raw-.66)*b;const t=(raw-.64)/.04,integral=2.5*t**4-3*t**5+t**6;return .64*a+.04*(a*t+(b-a)*integral)}
function margin(q,w,h){let minimum=Infinity;for(const p of[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}])for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],dx=b.x-a.x,dy=b.y-a.y;minimum=Math.min(minimum,(dx*(p.y-a.y)-dy*(p.x-a.x))/Math.hypot(dx,dy))}return minimum}
function dock(panel,g,p){
 const a=panel._flow;if(g.stacked||g.portraitTablet||g.h<480||!a){g.avoidRect=null;panel.style.setProperty('--copy-scale','1');panel.style.setProperty('--copy-body-opacity','1');return}
 if(g.motionMode==='tablet'){panel.style.setProperty('--story-copy-x','0px');panel.style.setProperty('--story-copy-y','0px');panel.style.setProperty('--copy-scale','1');panel.style.setProperty('--copy-body-opacity','1');const top=(g.h-a.height)/2;g.avoidRect={left:a.left,right:a.left+a.width,top,bottom:top+a.height,alpha:parseFloat(panel.style.getPropertyValue('--story-copy-opacity'))||0};return;}
 const tablet=g.motionMode==='tablet',u=ease(.36,.54,p),sx=tablet?1-(1-u)**4:ease(.33,.40,p),sy=tablet?u**3:ease(.40,.49,p),small=g.w<1200?.8:.68,scale=small+(1-small)*sy;
 const centreX=g.w/2-(a.headingCenter??a.width/2)*small,top=24+(((g.h-a.height)/2)-24)*sy;
 panel.style.setProperty('--story-copy-x',((centreX-a.left)*(1-sx)).toFixed(3)+'px');panel.style.setProperty('--story-copy-y',(top+a.height*scale/2-g.h/2).toFixed(3)+'px');panel.style.setProperty('--copy-scale',scale.toFixed(5));panel.style.setProperty('--copy-body-opacity',tablet?'1':ease(.35,.95,sy).toFixed(5));
 const left=a.left+(centreX-a.left)*(1-sx);g.avoidRect=tablet?{left,right:left+a.width*scale,top,bottom:top+a.height*scale,alpha:parseFloat(panel.style.getPropertyValue('--story-copy-opacity'))||0}:null;
}
globalThis.PixiraKinematics={curve,quadMatrix,ease,pose,margin,dock,storyProgress,CAPTURE,FILM,PROFILES,semanticPose,responsivePose};
})();
