'use strict';
/* ===== map.js — cartes (tuiles), événements, interpréteur de commandes ===== */
/* ---------- Cartes ---------- */
function loadMap(id,x,y,dir){M=MAPS[id];S.map=id;
 const mk=rows=>rows.map(r=>Array.from(r).map(c=>SYS.legend[c]||null));G0=mk(M.ground);G1=mk(M.objects);
 evs=M.events.map(e=>({...e,ox:0,oy:0,an:0,dr:Math.max(0,DIRN.indexOf(e.d||"down")),t:rnd(30,120)}));
 P={x,y,ox:0,oy:0,dir:dir||0,an:0};trailInit();bgm(M.bgm);bgs(M.bgs);initWeather();popup={t:200,s:M.name};encSteps=0}
const cond=c=>!c||(arr(c.sw).every(k=>S.sw[k])&&arr(c.nsw).every(k=>!S.sw[k])&&(!c.item||S.inv[c.item]>0)&&(c.gold==null||S.gold>=c.gold)&&(c.pm==null||S.party.length>=c.pm)&&(!c.has||S.party.some(m=>m.id==c.has))&&(c.lvl==null||Math.max(...S.party.map(m=>m.lv))>=c.lvl)&&(!c.quest||qOn(c.quest))&&(!c.qdone||qFin(c.qdone)));
function pg(e){let r=null;for(const p of e.pages)if(cond(p.if))r=p;return r?{...e,...r}:null}
function pass(x,y,self){if(x<0||y<0||x>=M.w||y>=M.h)return false;if((G0[y][x]&&G0[y][x][2])||(G1[y][x]&&G1[y][x][2]))return false;
 for(const e of evs){if(e===self)continue;const p=pg(e);if(p&&p.s&&!p.thr&&e.x==x&&e.y==y)return false}
 return self===P||!(P.x==x&&P.y==y)}
function tile(t,dx,dy){const im=img("Tilesets/"+SYS.sheets[t[0]]);if(!ok(im))return;const w=im.naturalWidth,c=w<=384?8:16,q=w/c;g.drawImage(im,(t[1]%c)*q,(t[1]/c|0)*q,q,q,dx,dy,32,32)} /* tuiles de 48 px (SF_*, World_C) : découpe par feuille, dessin en 32 px */
function spr(s,dir,fr,px,py,k=1){const im=img("Characters/"+s[0]);if(!ok(im))return;const one=s[0].includes("$"),cw=im.naturalWidth/(one?3:12),ch=im.naturalHeight/(one?4:8),ix=one?0:(s[1]%4)*3,iy=one?0:(s[1]>>2)*4;
 g.drawImage(im,(ix+fr)*cw,(iy+dir)*ch,cw,ch,Math.round(px+16-cw*k/2),Math.round(py+32-ch*k),cw*k,ch*k)}
const frm=o=>(o.ox||o.oy)?[0,1,2,1][(o.an|0)%4]:1;
/* Cortège : les autres membres de l'équipe suivent le héros case par case */
let TR=[],FD=[],DUST=[];
function trailInit(){TR=Array.from({length:6},()=>({x:P.x,y:P.y}));FD=[P.dir,P.dir,P.dir,P.dir,P.dir];DUST=[]}
const dirOf=(dx,dy)=>{for(let d=0;d<4;d++)if(DX[d]==Math.sign(dx)&&DY[d]==Math.sign(dy))return d;return -1};
function shadow(px,py,rx=11){g.fillStyle="rgba(0,0,0,.28)";g.beginPath();g.ellipse(px+16,py+29,rx,rx*.36,0,0,7);g.fill()}
function drawMap(){g.fillStyle="#000";g.fillRect(0,0,VW,VH);const mw=M.w*32,mh=M.h*32;
 const cx=mw<=VW?-(VW-mw)/2:clamp((P.x+P.ox)*32+16-VW/2,0,mw-VW),cy=mh<=VH?-(VH-mh)/2:clamp((P.y+P.oy)*32+16-VH/2,0,mh-VH);
 SC.x=(P.x+P.ox)*32+16-cx;SC.y=(P.y+P.oy)*32+16-cy;CAM.x=cx;CAM.y=cy;
 g.save();g.imageSmoothingEnabled=false;g.translate(-Math.round(cx),-Math.round(cy));
 const x0=Math.max(0,cx/32|0),x1=Math.min(M.w,x0+Math.ceil(VW/32)+2),y0=Math.max(0,cy/32|0),y1=Math.min(M.h,y0+Math.ceil(VH/32)+2);
 for(const L of[G0,G1])for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)if(L[j][i])tile(L[j][i],i*32,j*32);
 const o=[];for(const e of evs){const p=pg(e);if(p&&p.s)o.push([e.y+e.oy,()=>{const ch=p.s[0][0]!="!";if(ch)shadow((e.x+e.ox)*32,(e.y+e.oy)*32,p.s[0].includes("$")?18:11);spr(p.s,e.dr,p.f!=null?p.f:frm(e),(e.x+e.ox)*32,(e.y+e.oy)*32)}])}
 const t=(P.ox||P.oy)?1-(Math.abs(P.ox)+Math.abs(P.oy)):1;
 if(CFG.follow)for(let i=1;i<S.party.length&&i<TR.length-1;i++){const a=TR[i+1],b=TR[i],mv=a.x!=b.x||a.y!=b.y;
  const fx=a.x+(b.x-a.x)*t,fy=a.y+(b.y-a.y)*t,dd=dirOf(b.x-a.x,b.y-a.y);if(dd>=0&&t<1)FD[i]=dd;
  const mvg=(P.ox||P.oy)&&mv;o.push([fy+.01-.001*i,()=>{shadow(fx*32,fy*32);spr(DB.actors[S.party[i].id].ch,FD[i],mvg?[0,1,2,1][(P.an|0)%4]:1,fx*32,fy*32)}])}
 o.push([P.y+P.oy+.01,()=>{shadow((P.x+P.ox)*32,(P.y+P.oy)*32);spr(DB.actors[S.party[0].id].ch,P.dir,frm(P),(P.x+P.ox)*32,(P.y+P.oy)*32)}]);
 o.sort((a,b)=>a[0]-b[0]).forEach(a=>a[1]());
 for(let i=DUST.length-1;i>=0;i--){const d=DUST[i];d.x+=d.vx;d.y+=d.vy;d.l--;if(d.l<=0){DUST.splice(i,1);continue}g.fillStyle="rgba(225,212,185,"+(d.l/26*.55)+")";g.beginPath();g.arc(d.x,d.y,d.r*(1.4-d.l/26*.6),0,7);g.fill()}
 g.restore()}

/* ---------- Boucle carte ---------- */
/* Toujours courir : la touche Courir inverse alors le comportement (comme dans RPG Maker) */
const dashing=()=>CFG.always?!cur.dash:!!cur.dash;
function updMap(){
 for(const e of evs){const p=pg(e);if(e.ox||e.oy){e.ox=toward(e.ox,.08);e.oy=toward(e.oy,.08);e.an+=.12}
  else if(p&&p.wander&&--e.t<=0){e.t=rnd(50,160);const d=rnd(0,3),nx=e.x+DX[d],ny=e.y+DY[d];e.dr=d;if(pass(nx,ny,e)){e.x=nx;e.y=ny;e.ox=-DX[d];e.oy=-DY[d]}}}
 if(P.ox||P.oy){const sp=dashing()?.2:.125;P.ox=toward(P.ox,sp);P.oy=toward(P.oy,sp);P.an+=sp*1.6;if(!P.ox&&!P.oy)arrive();return}
 for(const e of evs){const p=pg(e);if(p&&p.tr=="auto"){runEv(p);return}}
 if(eat("menu")|eat("cancel")){act(fieldMenu);return}
 if(eat("ok")){const n=nearEv();if(n){P.dir=n.d;if(n.e.x!=P.x||n.e.y!=P.y)n.e.dr=OPP[n.d];runEv(n.p)}return}
 let d=-1;if(cur.down)d=0;if(cur.left)d=1;if(cur.right)d=2;if(cur.up)d=3;if(d<0)return;
 P.dir=d;const nx=P.x+DX[d],ny=P.y+DY[d];
 if(pass(nx,ny,P)){P.x=nx;P.y=ny;P.ox=-DX[d];P.oy=-DY[d];TR.unshift({x:nx,y:ny});TR.length=6;
  if(dashing()&&CFG.fx)for(let q=0;q<2;q++)DUST.push({x:(nx-DX[d])*32+16+rnd(-5,5),y:(ny-DY[d])*32+28,vx:-DX[d]*.25+(Math.random()-.5)*.5,vy:-.3-Math.random()*.4,r:2+Math.random()*2,l:26})}
 else for(const e of evs){const p=pg(e);if(p&&p.tr=="touch"&&e.x==nx&&e.y==ny){runEv(p);return}}}
function arrive(){const dm=[G0[P.y]&&G0[P.y][P.x],G1[P.y]&&G1[P.y][P.x]].reduce((a,t)=>a+((t&&t[3])|0),0);if(dm){for(const m of S.party)if(m.hp>0)m.hp=Math.max(1,m.hp-dm);se("Damage1")} /* tuile à dégâts : légende [feuille,n°,bloque,dégâts] */
 for(const e of evs){const p=pg(e);if(p&&p.tr=="touch"&&e.x==P.x&&e.y==P.y){runEv(p);return}}
 if(M.enc&&++encSteps>5&&rnd(1,M.enc.r)==1){encSteps=0;act(async()=>{await battle(M.enc.t[rnd(0,M.enc.t.length-1)])})}}
const runEv=p=>act(()=>run(p.c||[]));

/* ---------- Interpréteur d’événements ---------- */
async function run(cmds){for(const c of cmds)if(await exec(c)==="stop")return"stop"}
async function exec(c){const[op,a,b,d]=c;
 switch(op){
  case"say":await say(a,b,d);break;
  case"ask":{const i=await pick({items:a,x:W-250,y:H-150-a.length*30-36,w:230,cancel:false});await run(b[i]||[]);break}
  case"sw":S.sw[a]=b!==false;break;
  case"xp":{const up=[];for(const m of S.party){if(b&&m.id!=b)continue;const l0=m.lv;m.exp+=a;while(m.lv<30&&m.exp>=cum(m.lv+1)){m.lv++;m.hp=Math.min(st(m,"hp"),m.hp+DB.actors[m.id].g.hp);m.mp=Math.min(st(m,"mp"),m.mp+DB.actors[m.id].g.mp)}if(m.lv>l0)up.push(nm(m)+" passe au niveau "+m.lv+" !")}se("Up1");await say("","Gain d’expérience : "+a+" EXP."+(up.length?"\n"+up.join("\n"):""));break}
  case"openmenu":await fieldMenu(a);break;
  case"qstart":{const q=QS()[a];if(q&&!qOn(a)){qS()[a]=1;se("Item1");toast("Nouvelle quête : "+q.n)}break}
  case"qstep":{const q=QS()[a];if(q){const key=a+":"+b;if(d===0)delete qD()[key];else{qD()[key]=1;if(!qOn(a))qS()[a]=1}se("Item1");toast("Quête mise à jour : "+q.n)}break}
  case"qdone":{const q=QS()[a];if(q){qS()[a]=2;se("Up1");toast("Quête terminée : "+q.n)}break}
  case"qreset":{if(QS()[a]){delete qS()[a];for(const k in qD())if(k.startsWith(a+":"))delete qD()[k]}break}
  case"menu":S.mh=S.mh||{};S.mh[a]=!b;break;
  case"gold":S.gold+=a;se("Coin");await say("",(a>0?"Vous recevez ":"Vous perdez ")+Math.abs(a)+" po.");break;
  case"item":addItem(a,b||1);se("Item1");await say("","Vous obtenez : "+DB.items[a].n+(b>1?" ×"+b:"")+" !");break;
  case"heal":for(const m of S.party){m.hp=st(m,"hp");m.mp=st(m,"mp");m.psn=0}break;
  case"tp":await tp(a,b,d,c[4]);break;
  case"battle":await battle(a,b||{});break;
  case"shop":await shop(a);break;
  case"if":await run(cond(a)?b:(d||[]));break;
  case"join":if(S.party.length<4){const l=Math.max(...S.party.map(m=>m.lv));S.party.push(mkActor(a,l));me("Item");await say("",DB.actors[a].n+" rejoint l’équipe !")}break;
  case"bgm":bgm(a);break;case"me":me(a);break;case"se":se(a);break;case"wait":await sleep(a);break;case"fade":await fadeTo(a,500);break;
  case"shake":FX.shake=a||8;break;case"flash":FX.flash=20;break;case"weather":M.weather=a;initWeather();break;
  case"ending":{const E=SYS.end||{};await fadeTo(1,1200);if(E.me)me(E.me);endT=1;await sleep(E.dur||4500);endT=0;await fadeTo(0,800);break}
  case"savemenu":await saveMenu(grab());break}}
async function tp(m,x,y,d){se("Teleport");await fadeTo(1,250);loadMap(m,x,y,d);await sleep(60);await fadeTo(0,250)}


/* Événement interactif le plus proche (priorité à celui qu'on regarde) */
function nearEv(){for(const k of[0,1,2,3,4]){const d=k?k-1:P.dir,nx=P.x+DX[d],ny=P.y+DY[d];
 for(const e of evs){const p=pg(e);if(p&&p.tr=="action"&&((e.x==nx&&e.y==ny)||(p.thr&&e.x==P.x&&e.y==P.y)))return{e,p,d}}}return null}
/* Interface carte : bulle d'interaction, stick virtuel, boutons Interagir / Menu */
const hintKey=()=>padMode?padName(CFG.pad.ok[0]):touchMode?"!":keyName(CFG.keys.ok[0]);
function drawHUD(){if(scene!="map"||busy||modals.length||!M)return;const n=nearEv(),z=CFG.tsize/100,tc=touchMode&&!padMode;
 if(n){const bx=n.e.x*32+16-CAM.x,by=n.e.y*32-CAM.y-(n.p.s?26:6),t=hintKey(),w=Math.max(26,t.length*11+16);
  g.save();g.globalAlpha=.55+.25*Math.sin(performance.now()/180);rr(bx-w/2,by-14,w,24,12);g.fillStyle="rgba(20,30,60,.9)";g.fill();g.strokeStyle="#9cf";g.lineWidth=2;g.stroke();g.restore();tx(t,bx,by-11,"#fff",15,"center")}
 if(!tc)return;
 btn(VW-SAFE.r-62*z-10,SAFE.t+10,62*z,46*z,"☰","menu",{sq:1,sz:22});
 if(n)btn(VW-SAFE.r-150*z-14,VH-SAFE.b-76*z-16,150*z,56*z,"Interagir","ok",{sq:1});
 if(stick){const R=48*z,dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=Math.min(Math.hypot(dx,dy),R)||1,a=Math.atan2(dy,dx);
  g.save();g.globalAlpha=.35;g.fillStyle="#fff";g.beginPath();g.arc(stick.ox,stick.oy,R,0,7);g.fill();g.globalAlpha=.85;g.fillStyle="#9cf";g.beginPath();g.arc(stick.ox+Math.cos(a)*d,stick.oy+Math.sin(a)*d,R*.45,0,7);g.fill();g.restore()}}
