'use strict';
/* ===== main.js — chargement (barre de progression), écran titre, boucle de jeu ===== */
let ERR=null;
const LOAD={p:0,t:0,label:"Démarrage…",ready:false,go:null};   // p = progression affichée, t = progression réelle
const setLoad=(t,label)=>{LOAD.t=clamp(t,0,1);if(label)LOAD.label=label};
const TIPS=["Parlez aux habitants et ouvrez les coffres pour progresser.","Sauvegardez souvent : 8 fichiers sont disponibles dans le menu.","L’auberge soigne toute l’équipe.","Sur manette : A valide, B annule, Y ouvre le menu.","Les réglages permettent de courir en permanence.","Testez le feu, la glace et la foudre en combat."];
/* Un chargement d'image ne bloque jamais : une image absente ou en erreur compte comme terminée. */
const loadImg=s=>new Promise(res=>{const im=img(s);if(im.complete)return res();im.addEventListener("load",()=>res(),{once:true});im.addEventListener("error",()=>res(),{once:true})});
async function loadData(){
 let n=0,tot=12;const j=async p=>{let r=null,v;try{r=await fetch(p)}catch(e){}
  if(r&&r.ok){try{v=await r.json()}catch(e){throw new Error(p+" : JSON invalide")}}
  else{const D=window.RPG_DATA;if(!D||D[p]===undefined)throw new Error(p+" ("+(r?r.status:"inaccessible")+")");v=JSON.parse(JSON.stringify(D[p]))} // sans serveur : données embarquées (Script/data.js)
  setLoad(.03+.27*(++n/tot),"Chargement des données…");return v};
 SYS=await j("Data/system.json");DB={};tot=2+5+SYS.maps.length;
 for(const k of["actors","items","skills","enemies","troops"])DB[k]=await j("Data/"+k+".json");
 try{DB.quests=await j("Data/quests.json")}catch(e){DB.quests=SYS.quests||{}} /* facultatif */
 MAPS={};setLoad(.2,"Chargement des cartes…");await Promise.all(SYS.maps.map(async id=>{MAPS[id]=await j("Map/"+id+".json")}));
 for(const id in MAPS){const m=MAPS[id];m.w=Array.from(m.ground[0]).length;m.h=m.ground.length}}
function assetList(){const s=new Set(["System/Window","System/IconSet","System/GameOver",SYS.titleBg]);if(SYS.end&&SYS.end.bg)s.add(SYS.end.bg);
 SYS.sheets.forEach(x=>s.add("Tilesets/"+x));
 for(const a of Object.values(DB.actors)){s.add("Characters/"+a.ch[0]);s.add("Faces/"+a.face[0])}
 for(const e of Object.values(DB.enemies))s.add("Battlers/"+e.img);
 for(const m of Object.values(MAPS)){(m.bb||["Grassland","Grassland"]).forEach((b,i)=>s.add("Battlebacks"+(i+1)+"/"+b));for(const ev of m.events)for(const p of ev.pages||[])if(p.s)s.add("Characters/"+p.s[0])}
 for(const k of Object.values(DB.skills))if(k.ani)s.add("Animations/"+k.ani);
 return[...s]}
async function startGame(load){await fadeTo(1,300);if(!load)newState();scene="map";loadMap(S.map,S.x,S.y,S.dir);await fadeTo(0,500)}
async function title(){scene="title";M=null;B=null;bgm(SYS.bgm.title);bgs(null);await fadeTo(0,400);
 for(;;){const i=await pick({items:["Nouvelle partie",{t:"Continuer",dis:!anySlot()},"Réglages"],x:W/2-130,y:290,w:260,rh:40,flat:true,cancel:false,noback:true});
  if(i==0){await act(()=>startGame());return}
  if(i==1){const r=await slotScreen("load");if(r!=-1){S=r.d.S;await act(()=>startGame(true));return}}
  if(i==2)await settings()}}
async function gameOver(){bgm(null);me("Gameover1");await fadeTo(1,600);scene="over";B=null;await fadeTo(0,400);await sleep(3500);await fadeTo(1,500);title()}

/* Dessine une image en "cover" sur tout l'écran (aucune bande noire) */
function cover(m,zoom=1){const s=Math.max(VW/m.naturalWidth,VH/m.naturalHeight)*zoom;g.drawImage(m,(VW-m.naturalWidth*s)/2,(VH-m.naturalHeight*s)/2,m.naturalWidth*s,m.naturalHeight*s)}
function ui(f){g.save();g.translate(UX,UY);OX=UX;OY=UY;try{f()}finally{OX=OY=0;g.restore()}}

function drawTitle(){const m=img(SYS.titleBg),t=performance.now()/1000;
 if(ok(m))cover(m,1.05+.02*Math.sin(t/4));
 const gr=g.createLinearGradient(0,0,0,VH);gr.addColorStop(0,"rgba(0,0,10,.6)");gr.addColorStop(.5,"rgba(0,0,10,.1)");gr.addColorStop(1,"rgba(0,0,10,.85)");g.fillStyle=gr;g.fillRect(0,0,VW,VH);
 ui(()=>{g.font="48px VLG,sans-serif";g.textAlign="center";g.textBaseline="top";g.lineJoin="round";g.lineWidth=7;g.strokeStyle="rgba(0,0,0,.85)";g.strokeText(SYS.title,W/2,90);
  const tg=g.createLinearGradient(0,90,0,145);tg.addColorStop(0,"#fff");tg.addColorStop(1,"#ffd27a");g.fillStyle=tg;g.fillText(SYS.title,W/2,90);
  if(SYS.sub)tx(SYS.sub,W/2,150,"#cfe0ff",18,"center")})}
function drawLoading(){const t=performance.now()/1000,m=SYS.titleBg&&img(SYS.titleBg);
 if(m&&ok(m)){cover(m,1.05);g.fillStyle="rgba(0,0,12,.62)";g.fillRect(0,0,VW,VH)}
 else{const gr=g.createRadialGradient(VW/2,VH*.4,10,VW/2,VH*.4,Math.max(VW,VH)*.7);gr.addColorStop(0,"#1b2a55");gr.addColorStop(1,"#05060f");g.fillStyle=gr;g.fillRect(0,0,VW,VH)}
 LOAD.p+=(LOAD.t-LOAD.p)*.1;if(LOAD.t-LOAD.p<.002)LOAD.p=LOAD.t;
 ui(()=>{const cx=W/2,done=LOAD.ready;
  g.font="40px VLG,sans-serif";g.textAlign="center";g.textBaseline="top";g.lineJoin="round";g.lineWidth=6;g.strokeStyle="rgba(0,0,0,.85)";
  const T=SYS.title||"Chargement";g.strokeText(T,cx,96);g.fillStyle="#fff";g.fillText(T,cx,96);
  if(!done){const R=20,sy=200;g.save();g.translate(cx,sy);g.rotate(t*5);g.lineWidth=5;g.lineCap="round";g.strokeStyle="rgba(150,180,255,.25)";g.beginPath();g.arc(0,0,R,0,7);g.stroke();
   g.strokeStyle="#9cf";g.beginPath();g.arc(0,0,R,0,1.6);g.stroke();g.restore()}
  const bw=360,bx=cx-bw/2,by=300;g.fillStyle="rgba(0,0,0,.6)";rr(bx-3,by-3,bw+6,22,11);g.fill();g.strokeStyle="rgba(150,180,255,.6)";g.lineWidth=2;rr(bx-3,by-3,bw+6,22,11);g.stroke();
  const k=LOAD.p*bw;if(k>1){const gr=g.createLinearGradient(bx,0,bx+bw,0);gr.addColorStop(0,"#4f8cff");gr.addColorStop(1,"#9fd0ff");g.fillStyle=gr;rr(bx,by,Math.max(k,16),16,8);g.fill();
   g.save();rr(bx,by,Math.max(k,16),16,8);g.clip();g.fillStyle="rgba(255,255,255,.22)";g.fillRect(bx+((t*120)%(bw+60))-60,by,40,16);g.restore()}
  tx(Math.round(LOAD.p*100)+" %",cx,by+26,"#fff",20,"center");
  if(done){if(Math.floor(t*1.6)%2==0){const a=padMode?"Appuyez sur "+padName(CFG.pad.ok[0]):touchMode?"Touchez l’écran":"Appuyez sur "+keyName(CFG.keys.ok[0])+" ou cliquez";tx(a+" pour commencer",cx,by+58,"#ffd966",22,"center")}}
  else tx(LOAD.label,cx,by+58,"#bcd",18,"center");
  tx("Astuce : "+TIPS[Math.floor(t/4)%TIPS.length],cx,H-56,"#9fb0d8",15,"center")})}
function drawError(){tx("Impossible de charger les données du jeu.",W/2,150,"#f99",24,"center");
 const l=location.protocol=="file:"?["Les navigateurs bloquent les fichiers JSON ouverts en double-clic.","Lancez le jeu avec Lancer.bat (Windows) ou lancer.sh (Mac / Linux)."]:[String(ERR&&ERR.message)];
 l.forEach((s,k)=>tx(s,W/2,210+k*30,"#fff",18,"center"))}

function draw(){g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=true;g.globalAlpha=1;g.fillStyle="#000";g.fillRect(0,0,VW,VH);HB.length=0;OX=OY=0;
 g.save();if(FX.shake>0){g.translate((Math.random()-.5)*FX.shake*2,(Math.random()-.5)*FX.shake*2);FX.shake=Math.max(0,FX.shake-.5)}
 if(scene=="loading")drawLoading();
 else if(scene=="title")drawTitle();
 else if(scene=="error")ui(drawError);
 else if(scene=="over"){const m=img("System/GameOver");if(ok(m)){const s=Math.min(VW/m.naturalWidth,VH/m.naturalHeight);g.drawImage(m,(VW-m.naturalWidth*s)/2,(VH-m.naturalHeight*s)/2,m.naturalWidth*s,m.naturalHeight*s)}}
 else if(B&&scene=="battle")drawBattle();else if(M)drawMap();
 g.restore();drawFX();drawHUD();
 ui(()=>{if(scene=="map"&&popup&&popup.t>0){popup.t--;g.globalAlpha=Math.min(1,popup.t/40);win(W/2-150,10,300,40);tx(popup.s,W/2,19,"#fff",20,"center");g.globalAlpha=1}
  modals.forEach(m=>m.draw())});
 if(TOAST){const T=TOAST;T.t--;g.globalAlpha=Math.min(1,T.t/25);ui(()=>{win(W/2-170,H-216,340,40);tx(T.s,W/2,H-207,"#fff",18,"center")});g.globalAlpha=1;if(T.t<=0&&TOAST===T)TOAST=null}
 if(fadeA>0){g.fillStyle="rgba(0,0,0,"+fadeA+")";g.fillRect(0,0,VW,VH)}
 if(endT){const E=Object.assign({title:"FIN DE LA DÉMO",sub:"Merci d’avoir joué",c1:"#ffffff",c2:"#ffd966",s1:44,s2:24,y:190},SYS.end||{}),bm=E.bg&&img(E.bg);if(bm&&ok(bm))cover(bm,1);ui(()=>{tx(E.title||"",W/2,E.y,E.c1,E.s1,"center");tx(E.sub||"",W/2,E.y+Math.round(E.s1*1.6),E.c2,E.s2,"center")})}}

let last=performance.now(),bootGone=false;
function loop(t){const dt=(t-last)/1000;last=t;poll();if(S&&(scene=="map"||scene=="battle"))S.time=(S.time||0)+Math.min(dt,.1);
 if(scene=="loading"&&LOAD.ready&&LOAD.go&&(ANY||trg.ok||trg.cancel||trg.menu)){const f=LOAD.go;LOAD.go=null;f()}
 if(modals.length)modals[modals.length-1].update();else if(scene=="map"&&!busy&&M)updMap();
 draw();TAP=null;WHEEL=0;DRAGY=0;ANY=0;
 if(!bootGone){bootGone=true;const b=document.getElementById("boot");if(b){b.classList.add("off");setTimeout(()=>b.remove(),500)}}
 requestAnimationFrame(loop)}

(async function boot(){requestAnimationFrame(loop);
 setLoad(0,"Chargement de la police…");
 try{await document.fonts.load("20px VLG")}catch(e){}
 setLoad(.03);
 try{await loadData()}catch(e){ERR=e;scene="error";return}
 const list=assetList();let d=0;setLoad(.3,"Chargement des images…");
 await Promise.all(list.map(s=>loadImg(s).then(()=>{d++;setLoad(.3+.7*d/list.length)})));
 setLoad(1,"Prêt !");while(LOAD.p<.995)await sleep(30);await sleep(250);
 LOAD.ready=true;await new Promise(r=>LOAD.go=r);
 title()})();
