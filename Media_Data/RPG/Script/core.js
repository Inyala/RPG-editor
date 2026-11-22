'use strict';
/* ===== core.js — constantes, réglages, audio, entrées (clavier / manette / tactile / souris) ===== */
/* W,H = zone d'interface de référence (640×480, toujours entièrement visible et centrée).
   VW,VH = taille logique réelle du canvas : il épouse l'écran (plus de bandes noires), K = finesse (haute résolution). */
const W=640,H=480,DX=[0,-1,1,0],DY=[1,0,0,-1],DIRN=["down","left","right","up"],OPP=[3,2,1,0];
const cv=document.getElementById("c"),g=cv.getContext("2d");
let VW=W,VH=H,UX=0,UY=0,K=1,OX=0,OY=0;const SAFE={l:0,r:0,t:0,b:0};
cv.width=W;cv.height=H;
const IM={},img=p=>IM[p]||(IM[p]=Object.assign(new Image(),{src:"Graphics/"+p+".png"})),ok=i=>i.complete&&i.naturalWidth>0;
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),sleep=ms=>new Promise(r=>setTimeout(r,ms)),arr=x=>[].concat(x==null?[]:x);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),toward=(v,s)=>v>0?Math.max(0,v-s):Math.min(0,v+s),clone=o=>JSON.parse(JSON.stringify(o));
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}}};

/* ---------- Adaptation à la taille de l'écran (téléphone, tablette, PC, ultra-large, portrait / paysage) ---------- */
const probe=document.createElement("div");
probe.style.cssText="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
document.body.appendChild(probe);
function fit(){
 const vv=window.visualViewport,ww=Math.max(1,Math.round(vv?vv.width:innerWidth)),wh=Math.max(1,Math.round(vv?vv.height:innerHeight));
 const asp=clamp(ww/wh,.5,2.4),cw=Math.min(ww,wh*asp),ch=Math.min(wh,ww/asp);
 if(asp>=W/H){VH=H;VW=Math.round(H*asp)}else{VW=W;VH=Math.round(W/asp)}
 const dpr=window.devicePixelRatio||1;K=clamp(Math.ceil(cw*dpr/VW),1,4);
 while(K>1&&VW*VH*K*K>3.6e6)K--;
 cv.width=VW*K;cv.height=VH*K;cv.style.width=cw+"px";cv.style.height=ch+"px";
 UX=Math.round((VW-W)/2);UY=Math.round((VH-H)/2);
 const cs=getComputedStyle(probe),f=VW/cw;SAFE.t=(parseFloat(cs.paddingTop)||0)*f;SAFE.r=(parseFloat(cs.paddingRight)||0)*f;SAFE.b=(parseFloat(cs.paddingBottom)||0)*f;SAFE.l=(parseFloat(cs.paddingLeft)||0)*f}
fit();
addEventListener("resize",fit);addEventListener("orientationchange",()=>setTimeout(fit,120));
if(window.visualViewport)visualViewport.addEventListener("resize",fit);

/* ---------- Réglages (sauvegardés dans le navigateur) ---------- */
const DEF={master:80,bgm:70,bgs:60,se:70,me:70,full:0,fx:1,classic:0,tsize:100,always:0,remember:0,follow:1,rumble:1,
 keys:{up:["ArrowUp","z","w"],down:["ArrowDown","s"],left:["ArrowLeft","q","a"],right:["ArrowRight","d"],ok:["Enter"," ","e"],cancel:["Escape","x"],menu:["m","Tab"],dash:["Shift"],pgl:["PageUp"],pgr:["PageDown"]},
 pad:{ok:[0],cancel:[1],menu:[3,9],dash:[2,7,6],pgl:[4],pgr:[5]}};
let CFG;try{CFG=Object.assign(clone(DEF),JSON.parse(ls.get("rpgcfg")||"{}"))}catch(e){CFG=clone(DEF)}
for(const s of["keys","pad"]){if(!CFG[s]||typeof CFG[s]!="object")CFG[s]={};for(const a in DEF[s])if(!Array.isArray(CFG[s][a])||!CFG[s][a].length)CFG[s][a]=[...DEF[s][a]]}
const saveCfg=()=>ls.set("rpgcfg",JSON.stringify(CFG));
let KM={};const buildKM=()=>{KM={};for(const a in CFG.keys)for(const k of CFG.keys[a])KM[k]=a};buildKM();
const keyName=k=>({" ":"Espace",ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",Escape:"Échap",Enter:"Entrée",Shift:"Maj",PageUp:"Page ↑",PageDown:"Page ↓"}[k]||(k.length==1?k.toUpperCase():k));
const PADN=["A","B","X","Y","LB","RB","LT","RT","Select","Start","L3","R3","↑","↓","←","→","Home"];
const padName=i=>PADN[i]||("Bouton "+i),padList=a=>CFG.pad[a].map(padName).join(" / ");

/* ---------- Audio (BGM / BGS / SE / ME + volume général) ---------- */
const vol=k=>CFG.master/100*CFG[k]/100;
let bgmA=null,bgmN="",bgsA=null,bgsN="",duck=0;
const loopA=(n,d)=>{const a=new Audio("Audio/"+d+"/"+n+".ogg");a.loop=true;a.play().catch(()=>{});return a};
function applyVol(){if(bgmA)bgmA.volume=vol("bgm")*(duck?.25:1);if(bgsA)bgsA.volume=vol("bgs")*.8}
function bgm(n){n=n||"";if(n===bgmN)return;bgmN=n;if(bgmA)bgmA.pause();bgmA=n?loopA(n,"BGM"):null;applyVol()}
function bgs(n){n=n||"";if(n===bgsN)return;bgsN=n;if(bgsA)bgsA.pause();bgsA=n?loopA(n,"BGS"):null;applyVol()}
function se(n){const a=new Audio("Audio/SE/"+n+".ogg");a.volume=vol("se");a.play().catch(()=>{})}
function me(n){duck=1;applyVol();const a=new Audio("Audio/ME/"+n+".ogg");a.volume=vol("me");a.play().catch(()=>{});a.onended=()=>{duck=0;applyVol()}}

/* ---------- Entrées ---------- */
let capture=null,TAP=null,WHEEL=0,DRAGY=0,PD=null,PM=null,ANY=0,padMode=false,PADB=new Set(),RSC=0,touchMode=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0;
const held={},lat={},buf={},gpS={},tS={},cur={},trg={},cnt={},DIRS=["up","down","left","right"],ALL=[...DIRS,"ok","cancel","menu","dash","pgl","pgr"],HB=[],ptrs={};let stick=null;
const goFull=()=>{const d=document.documentElement;d.requestFullscreen&&d.requestFullscreen().catch(()=>{})};
const setFull=on=>{CFG.full=on?1:0;if(on)goFull();else if(document.fullscreenElement)document.exitFullscreen()};
document.addEventListener("fullscreenchange",()=>{CFG.full=document.fullscreenElement?1:0;fit()});
const unlock=()=>{if(bgmA&&bgmA.paused)bgmA.play().catch(()=>{});if(bgsA&&bgsA.paused)bgsA.play().catch(()=>{});if(CFG.full&&!document.fullscreenElement)goFull()};
const norm=k=>k.length==1?k.toLowerCase():k;
addEventListener("keydown",e=>{padMode=false;ANY=1;if(capture){e.preventDefault();capture(norm(e.key));return}const k=KM[norm(e.key)];if(k){held[k]=1;lat[k]=1;e.preventDefault()}unlock()});
addEventListener("keyup",e=>{const k=KM[norm(e.key)];if(k)held[k]=0});
addEventListener("blur",()=>{for(const k in held)held[k]=0});
const cpos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*VW/r.width,y:(e.clientY-r.top)*VH/r.height}};
/* Les appuis sur une fenêtre sont mémorisés en coordonnées d'interface (zone 640×480) : TAP, PD (appui en cours), PM (position courante). */
cv.addEventListener("pointerdown",e=>{e.preventDefault();padMode=false;ANY=1;unlock();cv.setPointerCapture(e.pointerId);const p=cpos(e);if(e.pointerType!="mouse")touchMode=true;
 const hb=HB.find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);
 if(hb){held[hb.k]=1;lat[hb.k]=1;ptrs[e.pointerId]={k:hb.k};return}
 if(modals.length){const u={x:p.x-UX,y:p.y-UY};ptrs[e.pointerId]={tap:1,x:u.x,y:u.y,sx:p.x,sy:p.y,ly:p.y,moved:0};PD=u;PM=u}
 else if(e.pointerType!="mouse"&&scene=="map"&&!busy&&!stick)ptrs[e.pointerId]=stick={ox:p.x,oy:p.y,x:p.x,y:p.y}});
cv.addEventListener("pointermove",e=>{const t=ptrs[e.pointerId];if(!t)return;const p=cpos(e);
 if(t.tap){DRAGY+=p.y-t.ly;t.ly=p.y;PM={x:p.x-UX,y:p.y-UY};if(Math.hypot(p.x-t.sx,p.y-t.sy)>12)t.moved=1}
 if(t===stick){stick.x=p.x;stick.y=p.y}});
const pend=e=>{const t=ptrs[e.pointerId];if(!t)return;if(t.k)held[t.k]=0;if(t.tap){PD=PM=null;if(!t.moved&&e.type=="pointerup")TAP={x:t.x,y:t.y}}if(t===stick)stick=null;delete ptrs[e.pointerId]};
cv.addEventListener("pointerup",pend);cv.addEventListener("pointercancel",pend);
cv.addEventListener("wheel",e=>{WHEEL+=Math.sign(e.deltaY);e.preventDefault()},{passive:false});
cv.addEventListener("contextmenu",e=>{e.preventDefault();held.cancel=1;setTimeout(()=>held.cancel=0,70)});

/* ---------- Manette ---------- */
const pads=()=>{try{return[...(navigator.getGamepads?navigator.getGamepads():[])].filter(p=>p&&p.connected)}catch(e){return[]}};
addEventListener("gamepadconnected",()=>{padMode=true;toast("Manette connectée")});
addEventListener("gamepaddisconnected",()=>{toast("Manette déconnectée");if(!pads().length)padMode=false});
function rumble(ms=120,s=.6,w=.3){if(!CFG.rumble)return;let used=false;
 for(const p of pads()){const v=p.vibrationActuator;if(v&&v.playEffect){used=true;v.playEffect("dual-rumble",{duration:ms,strongMagnitude:s,weakMagnitude:w}).catch(()=>{})}}
 if(!used&&touchMode&&navigator.vibrate)try{navigator.vibrate(Math.min(ms,80))}catch(e){}}
function poll(){
 for(const k in gpS)delete gpS[k];for(const k in tS)delete tS[k];PADB=new Set();let act=false;
 for(const p of pads()){const a=p.axes,b=i=>!!(p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.6));
  p.buttons.forEach((_,i)=>{if(b(i)){PADB.add(i);act=true}});
  if(b(12))gpS.up=1;if(b(13))gpS.down=1;if(b(14))gpS.left=1;if(b(15))gpS.right=1;
  const lx=a[0]||0,ly=a[1]||0;if(Math.hypot(lx,ly)>.5){act=true;if(Math.abs(ly)>Math.abs(lx))gpS[ly<0?"up":"down"]=1;else gpS[lx<0?"left":"right"]=1}
  const ry=a[3]||0;if(Math.abs(ry)>.6){act=true;if(RSC++%7==0)WHEEL+=Math.sign(ry)}else RSC=0}
 for(const k in CFG.pad)if(CFG.pad[k].some(i=>PADB.has(i)))gpS[k]=1;
 if(act)padMode=true;
 if(stick&&(modals.length||busy))stick=null;
 if(stick){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.hypot(dx,dy),R=48*CFG.tsize/100;
  if(d>R*.3){if(Math.abs(dx)>Math.abs(dy))tS[dx<0?"left":"right"]=1;else tS[dy<0?"up":"down"]=1;if(d>R*1.1)tS.dash=1}
  if(d>R*1.6){stick.ox=stick.x-dx/d*R*1.6;stick.oy=stick.y-dy/d*R*1.6}}
 for(const k of ALL){const c=!!(held[k]||lat[k]||gpS[k]||tS[k]);trg[k]=c&&!cur[k];
  if(c&&cur[k]&&DIRS.includes(k)){cnt[k]=(cnt[k]||0)+1;if(cnt[k]>14&&(cnt[k]-14)%4==0)trg[k]=true}else if(!c)cnt[k]=0;cur[k]=c;lat[k]=0}
 /* Tampon d'entrée : une pression pendant un pas ou un fondu n'est pas perdue (mais jamais conservée à travers une fenêtre) */
 for(const k of["ok","menu","cancel"]){if(modals.length||busy)buf[k]=0;else if(trg[k])buf[k]=10;else if(buf[k]>0)buf[k]--}}
const eat=k=>{const v=trg[k]||buf[k]>0;buf[k]=0;return v};
