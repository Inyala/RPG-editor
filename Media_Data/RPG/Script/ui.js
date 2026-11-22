'use strict';
/* ===== ui.js — primitives de dessin, fenêtres, dialogues, listes (clavier, manette, tactile, souris) ===== */
const modals=[];
const modal=m=>new Promise(r=>{m.done=v=>{const i=modals.indexOf(m);if(i>=0)modals.splice(i,1);r(v)};modals.push(m)});
function rr(x,y,w,h,r){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)}
function win(x,y,w,h){
 if(CFG.classic){const s=img("System/Window");if(!ok(s))return;g.save();g.imageSmoothingEnabled=false;g.globalAlpha=.95;g.drawImage(s,0,0,64,64,x+2,y+2,w-4,h-4);g.globalAlpha=1;
  const d=(a,b,c,e,f,i,j,k)=>g.drawImage(s,a,b,c,e,f,i,j,k);
  d(80,0,32,16,x+16,y,w-32,16);d(80,48,32,16,x+16,y+h-16,w-32,16);d(64,16,16,32,x,y+16,16,h-32);d(112,16,16,32,x+w-16,y+16,16,h-32);
  d(64,0,16,16,x,y,16,16);d(112,0,16,16,x+w-16,y,16,16);d(64,48,16,16,x,y+h-16,16,16);d(112,48,16,16,x+w-16,y+h-16,16,16);g.restore();return}
 g.save();g.shadowColor="rgba(0,0,0,.55)";g.shadowBlur=16*K;g.shadowOffsetY=4*K;
 const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,"rgba(34,48,88,.95)");gr.addColorStop(1,"rgba(12,18,42,.95)");
 g.fillStyle=gr;rr(x,y,w,h,12);g.fill();g.restore();
 g.lineWidth=2;g.strokeStyle="rgba(150,180,255,.6)";rr(x+1,y+1,w-2,h-2,12);g.stroke();
 g.lineWidth=1;g.strokeStyle="rgba(255,255,255,.07)";rr(x+5,y+5,w-10,h-10,8);g.stroke()}
function tx(s,x,y,c="#fff",sz=20,al="left"){g.font=sz+"px VLG,sans-serif";g.textAlign=al;g.textBaseline="top";g.lineWidth=3;g.lineJoin="round";g.strokeStyle="rgba(0,0,0,.8)";g.strokeText(s,x,y);g.fillStyle=c;g.fillText(s,x,y)}
function wrap(s,w,sz=20){g.font=sz+"px VLG,sans-serif";const o=[];for(const p of String(s).split("\n")){let l="";for(const wd of p.split(" ")){const t=l?l+" "+wd:wd;if(g.measureText(t).width>w&&l){o.push(l);l=wd}else l=t}o.push(l)}return o}
const ico=(i,x,y)=>{const m=img("System/IconSet");if(ok(m)){g.save();g.imageSmoothingEnabled=false;g.drawImage(m,(i%16)*24,(i>>4)*24,24,24,x,y,24,24);g.restore()}};
function fc(f,x,y,s=96){const m=img("Faces/"+f[0]);g.fillStyle="rgba(0,0,0,.35)";rr(x,y,s,s,8);g.fill();
 if(ok(m)){g.save();rr(x,y,s,s,8);g.clip();g.drawImage(m,(f[1]%4)*96,(f[1]>>2)*96,96,96,x,y,s,s);g.restore()}
 g.strokeStyle="rgba(170,195,255,.7)";g.lineWidth=2;rr(x,y,s,s,8);g.stroke()}
function bar(x,y,w,v,m,c,h=7){g.fillStyle="rgba(0,0,0,.6)";rr(x,y,w,h,h/2);g.fill();const k=clamp(v/m,0,1)*(w-2);if(k>0){g.fillStyle=c;rr(x+1,y+1,Math.max(k,h-2),h-2,(h-2)/2);g.fill()}}
function btn(x,y,w,h,label,k,o={}){HB.push({x:x+OX,y:y+OY,w,h,k});g.save();g.globalAlpha=o.a||.88;rr(x,y,w,h,o.sq?12:Math.min(w,h)/2);g.fillStyle=held[k]?"rgba(120,170,255,.95)":"rgba(18,28,60,.8)";g.fill();g.lineWidth=2;g.strokeStyle="rgba(180,205,255,.85)";g.stroke();g.restore();tx(label,x+w/2,y+h/2-(o.sz||20)*.6,"#fff",o.sz||20,"center")}
const backBtn=()=>{if(touchMode&&!padMode)btn(W-60,8,50,40,"✕","cancel",{sq:1})};
const hit=(p,x,y,w,h)=>p&&p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
const accent=(x,y,w,h)=>{const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,"rgba(110,160,255,.5)");gr.addColorStop(1,"rgba(110,160,255,.08)");g.fillStyle=gr;rr(x,y,w,h,6);g.fill();g.fillStyle="#8fb8ff";g.fillRect(x,y+4,3,h-8)};

/* ---------- Dialogue ---------- */
function say(who,text,face){const lines=wrap(text,face?440:560),full=lines.join("").length;let n=0,t=0;
 return modal({update(){t++;if(n<full)n+=1.6;if(trg.ok||trg.cancel||TAP){if(n<full)n=full;else{se("Cursor1");this.done()}}},
  draw(){const y=H-150;win(20,y,600,140);if(face)fc(face,34,y+22);const x=face?144:40;let ly=y+14;
   if(who){tx(who,x,y+8,"#ffd966",20);ly=y+34}
   let k=0;for(const l of lines){tx(l.slice(0,Math.max(0,Math.floor(n)-k)),x,ly);k+=l.length;ly+=26}
   if(n>=full&&t%50<30)tx("▼",W-50,y+112,"#9cf",16,"center")}})}

/* ---------- Barre de défilement (large, glissable au doigt / à la souris) ---------- */
function scrollBar(x,y,h,total,vis,sc,hot){const th=Math.max(30,h*vis/total),ty=y+(h-th)*(total>vis?sc/(total-vis):0);
 g.fillStyle="rgba(0,0,0,.35)";rr(x,y,8,h,4);g.fill();g.fillStyle=hot?"#bcd8ff":"rgba(150,190,255,.85)";rr(x,ty,8,th,4);g.fill();
 g.fillStyle="#9cf";if(sc>0){g.beginPath();g.moveTo(x+4,y-9);g.lineTo(x-1,y-3);g.lineTo(x+9,y-3);g.fill()}
 if(sc<total-vis){g.beginPath();g.moveTo(x+4,y+h+9);g.lineTo(x-1,y+h+3);g.lineTo(x+9,y+h+3);g.fill()}
 return th}
/* Valeur (0..1) de défilement d'après la position du doigt le long de la barre */
const sbVal=(py,y,h,th)=>clamp((py-y-th/2)/Math.max(1,h-th),0,1);

/* ---------- Liste de choix (clavier / manette / tap / glisser / molette / barre de défilement) ---------- */
function pick(o){const it=o.items.map(x=>typeof x=="string"?{t:x}:x),n=it.length,cols=o.cols||1,rh=o.rh||30,rows=Math.ceil(n/cols),vis=Math.min(o.vis||rows,rows),w=o.w||220,fl=o.flat;
 let i=clamp(o.i||0,0,n-1),sc=0,acc=0,drag=false;const x=o.x==null?20:o.x,y=o.y==null?20:o.y,h=vis*rh+28,cw=(w-28)/cols-(rows>vis?10:0),m={cancelable:o.cancel!==false};
 const sbx=x+w-18,sby=y+14,sbh=vis*rh,sb=rows>vis,maxSc=rows-vis;sc=clamp((i/cols|0)-vis+1,0,Math.max(0,maxSc));
 const rowAt=p=>{for(let r=sc;r<sc+vis;r++)for(let c=0;c<cols;c++){const k=r*cols+c;if(k<n&&hit(p,x+10+c*cw,y+14+(r-sc)*rh,cw,rh))return k}return -1};
 const th=()=>Math.max(30,sbh*vis/rows);
 m.update=function(){let d=0;if(trg.up)d=-cols;if(trg.down)d=cols;if(cols>1&&trg.left)d=-1;if(cols>1&&trg.right)d=1;
  if(d){let j=i+d;if(cols==1)j=(j+n)%n;if(j>=0&&j<n){i=j;se("Cursor1");const r=i/cols|0;if(r<sc)sc=r;if(r>=sc+vis)sc=r-vis+1}}
  if((trg.pgl||trg.pgr)&&rows>vis){const j=clamp(i+(trg.pgr?1:-1)*vis*cols,0,n-1);if(j!=i){i=j;se("Cursor1");const r=i/cols|0;if(r<sc)sc=r;if(r>=sc+vis)sc=r-vis+1}}
  if(WHEEL)sc=clamp(sc+Math.sign(WHEEL),0,Math.max(0,maxSc));
  if(sb&&PD&&!drag&&hit(PD,sbx-14,sby-12,36,sbh+24))drag=true;
  if(drag){if(PM)sc=Math.round(sbVal(PM.y,sby,sbh,th())*maxSc);if(!PD)drag=false}
  else if(DRAGY&&sb){acc+=DRAGY;while(acc>rh){sc=Math.max(0,sc-1);acc-=rh}while(acc<-rh){sc=Math.min(maxSc,sc+1);acc+=rh}}
  let k=-1;if(TAP&&!(sb&&TAP.x>sbx-14)){k=rowAt(TAP);if(k>=0)i=k}
  if(k>=0||trg.ok){if(it[i].dis)se("Buzzer1");else{se("Decision1");this.done(i)}}
  if(trg.cancel&&m.cancelable){se("Cancel1");this.done(-1)}};
 m.draw=function(){if(o.bg)o.bg(i);if(!fl)win(x,y,w,h);
  for(let r=sc;r<sc+vis;r++)for(let c=0;c<cols;c++){const k=r*cols+c;if(k>=n)break;const px=x+14+c*cw,py=y+14+(r-sc)*rh,q=it[k];
   if(k==i)accent(px-4,py,cw,rh-2);let t0=px;if(q.ico!=null){ico(q.ico,px,py+2);t0+=28}
   const col=q.dis?"#778":(k==i?"#fff":"#dfe6ff");
   if(fl)tx(q.t,x+w/2,py+2,col,24,"center");else{tx(q.t,t0,py+3,col);if(q.r)tx(q.r,px+cw-12,py+3,q.dis?"#778":"#bde",20,"right")}}
  if(sb)scrollBar(sbx,sby,sbh,rows,vis,sc,drag);
  if(m.cancelable&&!o.noback)backBtn()};
 return modal(m)}
