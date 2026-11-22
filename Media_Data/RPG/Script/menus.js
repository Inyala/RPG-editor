'use strict';
/* ===== menus.js — boutique, menu de la carte, sauvegardes (8 fichiers), réglages, tutoriel ===== */
/* ---------- Boutique ---------- */
const goldBg=()=>{win(W-190,H-70,180,60);tx("Or : "+S.gold+" po",W-100,H-52,"#ffd966",20,"center")};
const descBg=id=>{goldBg();if(id){win(10,H-70,W-210,60);tx(DB.items[id].d||"",24,H-52,"#fff",18)}};
async function shop(ids){for(;;){const m=await pick({items:["Acheter","Vendre","Sortir"],x:20,y:20,w:170,bg:goldBg});if(m<0||m==2)break;
 if(m==0)for(;;){const j=await pick({items:ids.map(k=>({t:DB.items[k].n,ico:DB.items[k].ico,r:DB.items[k].price+" po",dis:S.gold<DB.items[k].price})),x:20,y:80,w:420,vis:8,bg:i=>descBg(ids[i])});
  if(j<0)break;S.gold-=DB.items[ids[j]].price;addItem(ids[j]);se("Shop")}
 else for(;;){const own=Object.keys(DB.items).filter(k=>S.inv[k]&&DB.items[k].t!="k");if(!own.length)break;
  const j=await pick({items:own.map(k=>({t:DB.items[k].n,ico:DB.items[k].ico,r:"×"+S.inv[k]+"  "+(DB.items[k].price>>1)+" po"})),x:20,y:80,w:420,vis:8,bg:i=>descBg(own[i])});
  if(j<0)break;S.gold+=DB.items[own[j]].price>>1;addItem(own[j],-1);se("Coin")}}}


/* ---------- Menu de la carte ---------- */
const RX=322,RW=306,STN={hp:"PV",mp:"PM",atk:"ATQ",def:"DÉF",mat:"MAG",spd:"VIT"},p2=n=>String(n).padStart(2,"0"),fmtT=t=>{t=Math.floor(t||0);return p2(Math.floor(t/3600))+":"+p2(Math.floor(t/60)%60)+":"+p2(t%60)};
function grab(){try{const c=document.createElement("canvas");c.width=160;c.height=120;c.getContext("2d").drawImage(cv,UX*K,UY*K,W*K,H*K,0,0,160,120);return c.toDataURL("image/jpeg",.6)}catch(e){return null}}
function panel(msg){S.party.forEach((a,i)=>{const x=14,y=14+i*100;win(x,y,300,92);fc(DB.actors[a.id].face,x+10,y+10,72);
  tx(nm(a),x+92,y+8,"#ffd966",20);tx("Nv "+a.lv,x+286,y+10,"#bde",16,"right");
  tx("PV",x+92,y+34,"#9d9",13);bar(x+116,y+38,168,a.hp,st(a,"hp"),"#5cd05c");tx(a.hp+"/"+st(a,"hp"),x+286,y+50,"#fff",12,"right");
  tx("PM",x+92,y+60,"#9bf",13);bar(x+116,y+64,168,a.mp,st(a,"mp"),"#4f8cff");if(a.psn)tx("☠",x+66,y+66,"#c8f",16)});
 win(14,H-62,300,48);if(msg)tx(msg,28,H-52,"#fff",14);else tx(M.name,28,H-50,"#cfe",16);
 win(RX,H-62,RW,48);tx(fmtT(S.time),RX+16,H-50,"#bde",16);tx(S.gold+" po",RX+RW-16,H-50,"#ffd966",18,"right")}
const pickMember=()=>pick({items:S.party.map(a=>({t:nm(a),r:"Nv "+a.lv})),x:RX,y:262,w:RW,bg:()=>panel()});
let fmI=0;
const MENU=[["items","Objets",212],["equip","Équipement",168],["status","Statut",122],["quests","Quêtes",232],["formation","Formation"],["save","Sauvegarder",117],["settings","Réglages"],["title","Titre"]];
const menuHid=k=>S.mh&&k in S.mh?S.mh[k]:(SYS.menuHide||[]).includes(k); /* entrées masquées : SYS.menuHide au départ, puis commande « menu » */
async function fieldMenu(only){const snap=grab();se("Decision1");if(only){await menuAct(only,snap);return} /* only : ouvre directement ce sous-menu (commande « Ouvrir le menu ») */
 for(;;){const E=MENU.filter(e=>!menuHid(e[0])&&(e[0]!="quests"||Object.keys(QS()).length)&&(e[0]!="formation"||S.party.length>1));if(!E.length)return;
  const i=await pick({i:CFG.remember?Math.min(fmI,E.length-1):0,items:E.map(e=>({t:e[1],ico:e[2]})),x:RX,y:14,w:RW,rh:38,bg:()=>panel()});
  if(i<0)return;fmI=i;if(await menuAct(E[i][0],snap))return}}
/* une entrée du menu ; renvoie 1 quand le menu doit se fermer (objet à événement / téléportation) */
async function menuAct(k,snap){if(k=="items"){const g=await itemMenu();if(g){if(g.go)await tp(g.go.map,g.go.x,g.go.y,g.go.dir||0);if(g.ev)await run(g.ev);return 1}}
  if(k=="equip")await equipMenu();
  if(k=="status"){const j=await pickMember();if(j>=0)await statusView(j)}
  if(k=="quests")await questMenu();if(k=="formation")await formationMenu();
  if(k=="save")await saveMenu(snap);if(k=="settings")await settings();
  if(k=="title"){const j=await pick({items:["Retourner au titre","Annuler"],x:RX,y:262,w:RW,bg:()=>panel()});if(j==0){await fadeTo(1,300);title();throw"abort"}}
 return 0}
const QS=()=>DB.quests&&Object.keys(DB.quests).length?DB.quests:(SYS.quests||{});
const qS=()=>S.qs||(S.qs={}),qD=()=>S.qd||(S.qd={});
const qOn=k=>{const q=QS()[k];return!!q&&(qS()[k]>=1||!!(q.start&&S.sw[q.start]))},qFin=k=>{const q=QS()[k];return!!q&&(qS()[k]==2||!!(q.done&&S.sw[q.done]))};
const qStep=(k,i,s)=>!!(qD()[k+":"+i]||S.sw[s.sw||s[1]]);
const qText=k=>{const q=QS()[k];return(q.d||"")+"\n"+(q.steps||[]).map((s,i)=>(qStep(k,i,s)?"✔ ":"▫ ")+(s.text||s[0])).join("\n")+(qFin(k)?"\nQuête terminée !":"")};
/* ---------- Menu Quêtes : grande fenêtre (liste à gauche, détail à droite : description, étapes, étape en cours) ---------- */
const qCut=(t,w,sz)=>{t=String(t||"");g.font=sz+"px VLG,sans-serif";if(g.measureText(t).width<=w)return t;while(t.length>1&&g.measureText(t+"…").width>w)t=t.slice(0,-1);return t+"…"};
function qDetail(k){const q=QS()[k],X=254,Y=14,DW=372,DH=452,IW=DW-36,LB=Y+DH-10,fin=qFin(k),stp=q.steps||[],dn=stp.map((e,i)=>qStep(k,i,e)),nd=dn.filter(Boolean).length,cur=fin?-1:dn.indexOf(false);
 win(X,Y,DW,DH);let y=Y+14;
 for(const l of wrap(q.n||"",DW-90,24).slice(0,2)){tx(l,X+18,y,"#ffd966",24);y+=30}
 tx(fin?"✔ Quête terminée":"En cours",X+18,y+2,fin?"#8e9":"#bde",16);
 if(stp.length){tx(nd+" / "+stp.length+" étapes",X+DW-18,y+2,"#bde",16,"right");y+=26;bar(X+18,y,IW,nd,stp.length,fin?"#5cd05c":"#4f8cff",10);y+=20}else y+=28;
 /* taille du texte : la plus grande qui tienne entièrement dans la fenêtre */
 const lay=sz=>{const lh=sz+6,d=q.d?wrap(q.d,IW,sz):[],sp=stp.map(e=>wrap(e.text||e[0]||"",IW-28,sz));
  let h=(d.length?24+d.length*lh+8:0)+(stp.length?24:0)+sp.reduce((n,l)=>n+l.length*lh+4,0)+(fin?lh+6:0);return{sz,lh,d,sp,h}};
 let L=lay(20);for(const sz of[20,18,16,14,12]){L=lay(sz);if(y+L.h<=LB)break}
 const sec=t=>{tx(t,X+18,y,"#8fb8ff",14);g.fillStyle="rgba(150,180,255,.35)";g.fillRect(X+18+g.measureText(t).width+8,y+9,IW-g.measureText(t).width-8,1);y+=24};
 if(L.d.length){sec("Description");for(const l of L.d){if(y+L.sz<=LB)tx(l,X+18,y,"#fff",L.sz);y+=L.lh}y+=8}
 if(stp.length){sec("Progression");L.sp.forEach((ls,i)=>{const c=dn[i]?"#8e9":i==cur?"#ffd966":"#aab";
   if(i==cur&&y+L.sz<=LB){g.fillStyle="rgba(255,217,102,.12)";rr(X+10,y-3,DW-20,ls.length*L.lh+4,6);g.fill()}
   if(y+L.sz<=LB)tx(dn[i]?"✔":i==cur?"▶":"▫",X+18,y,c,L.sz);
   for(const l of ls){if(y+L.sz<=LB)tx(l,X+18+28,y,c,L.sz);y+=L.lh}y+=4})}
 if(fin&&y+L.sz<=LB)tx("Quête terminée !",X+18,y+2,"#8e9",L.sz+2)}
async function questMenu(){const Q=QS(),ids=Object.keys(Q).filter(qOn);if(!ids.length){toast("Aucune quête en cours");return}
 let i0=0;for(;;){const j=await pick({items:ids.map(k=>({t:qCut(Q[k].n,qFin(k)?168:190,20),r:qFin(k)?"✔":""})),x:14,y:14,w:232,vis:Math.min(ids.length,14),i:i0,bg:i=>qDetail(ids[i])});if(j<0)return;i0=j}}
async function formationMenu(){for(;;){const j=await pick({items:S.party.map((m,i)=>({t:(i<4?"● ":"○ ")+nm(m),r:"Niv "+m.lv})),x:RX,y:14,w:RW,bg:()=>panel("Choisissez un membre, puis la place à échanger.")});if(j<0)return;
 const k=await pick({items:S.party.map((m,i)=>({t:nm(m)+(i==j?" (choisi)":"")})),x:RX+20,y:50,w:RW,bg:()=>panel("Échanger avec…")});if(k<0||k==j)continue;[S.party[j],S.party[k]]=[S.party[k],S.party[j]];se("Decision1")}}
const hasEv=it=>Array.isArray(it.ev)&&it.ev.length;
async function itemMenu(){for(;;){const ids=Object.keys(DB.items).filter(k=>S.inv[k]);if(!ids.length){toast("Le sac est vide");return}
 const j=await pick({items:ids.map(k=>({t:DB.items[k].n,ico:DB.items[k].ico,r:"×"+S.inv[k],dis:!["c","u"].includes(DB.items[k].t)&&!DB.items[k].go&&!hasEv(DB.items[k])})),x:RX,y:14,w:RW,vis:11,bg:i=>panel(DB.items[ids[i]].d)});
 if(j<0)return;const k=ids[j],it=DB.items[k];
 if(it.go||(hasEv(it)&&!(it.hp||it.mp||it.cure||it.rev))){if(it.go&&S.map==it.go.map){se("Buzzer1");toast("Vous y êtes déjà");continue}if(it.t=="c")addItem(k,-1);return{go:it.go,ev:it.ev}} /* go : téléportation, ev : événement ; t:"u" = réutilisable */ /* objet de téléportation : {map,x,y,dir} */
 const m=await pickMember();if(m<0)continue;const a=S.party[m];let used=false;
 if(it.rev&&a.hp<=0){a.hp=Math.round(st(a,"hp")/2);used=true}
 else if(a.hp>0){if(it.hp&&a.hp<st(a,"hp")){a.hp=Math.min(st(a,"hp"),a.hp+it.hp);used=true}if(it.mp&&a.mp<st(a,"mp")){a.mp=Math.min(st(a,"mp"),a.mp+it.mp);used=true}if(it.cure&&a.psn){a.psn=0;used=true}}
 if(used){se("Heal1");if(it.t!="u")addItem(k,-1);if(hasEv(it))return{ev:it.ev}}else se("Buzzer1")}}
const SLN={w:"Arme",a:"Armure",x:"Accessoire"};
async function equipMenu(){const m=await pickMember();if(m<0)return;const a=S.party[m];
 for(;;){const s=await pick({items:Object.keys(SLN).map(k=>({t:SLN[k],r:a.eq[k]?DB.items[a.eq[k]].n:"—"})),x:RX,y:14,w:RW,rh:38,bg:()=>panel()});if(s<0)return;
  const sl=Object.keys(SLN)[s],ids=Object.keys(DB.items).filter(k=>S.inv[k]&&DB.items[k].t==sl),list=ids.map(k=>({t:DB.items[k].n,ico:DB.items[k].ico,r:"×"+S.inv[k]}));if(a.eq[sl])list.push({t:"Retirer"});
  if(!list.length){toast("Rien à équiper");continue}
  const j=await pick({items:list,x:RX,y:14,w:RW,vis:9,bg:i=>{const id=i<ids.length?ids[i]:null,na={...a,eq:{...a.eq}};if(id)na.eq[sl]=id;else delete na.eq[sl];
   win(14,14,300,H-28);fc(DB.actors[a.id].face,28,28,72);tx(nm(a),112,36,"#ffd966",22);
   Object.keys(STN).forEach((k,n)=>{const y=130+n*50,o=st(a,k),v=st(na,k),d=v-o;tx(STN[k],34,y,"#9cf");tx(String(o),150,y,"#fff",20,"right");tx("→",168,y,"#889");tx(String(v),238,y,d>0?"#8f8":d<0?"#f88":"#fff",20,"right");if(d)tx((d>0?"▲ +":"▼ ")+d,296,y+4,d>0?"#8f8":"#f88",14,"right")})}});
  if(j<0)continue;if(a.eq[sl])addItem(a.eq[sl]);if(j<ids.length){addItem(ids[j],-1);a.eq[sl]=ids[j]}else delete a.eq[sl];
  a.hp=Math.min(a.hp,st(a,"hp"));a.mp=Math.min(a.mp,st(a,"mp"));se("Equip1")}}
function statusView(i){const n=S.party.length;return modal({cancelable:true,update(){if(trg.left||trg.pgl)i=(i+n-1)%n;if(trg.right||trg.pgr)i=(i+1)%n;
  if(TAP&&TAP.x<W/2&&TAP.y>H-80)i=(i+n-1)%n;else if(TAP&&TAP.x>=W/2&&TAP.y>H-80)i=(i+1)%n;else if(trg.cancel||trg.ok||TAP){se("Cancel1");this.done()}},
 draw(){const a=S.party[i],d=DB.actors[a.id];win(10,10,W-20,H-20);fc(d.face,30,30,96);tx(nm(a),146,30,"#ffd966",28);tx("Niveau "+a.lv,146,68,"#fff",18);
  bar(146,98,200,a.exp-cum(a.lv),cum(a.lv+1)-cum(a.lv),"#c9a227",8);tx("EXP "+a.exp+" / "+cum(a.lv+1),146,110,"#cfe",14);
  Object.keys(STN).forEach((k,j)=>{const x=40+(j%2)*190,y=160+(j>>1)*34;tx(STN[k],x,y,"#9cf");tx(k=="hp"?a.hp+"/"+st(a,"hp"):k=="mp"?a.mp+"/"+st(a,"mp"):String(st(a,k)),x+150,y,"#fff",20,"right")});
  tx("Équipement",430,30,"#ffd966");Object.keys(SLN).forEach((k,j)=>{tx(SLN[k],430,64+j*46,"#9cf",13);tx(a.eq[k]?DB.items[a.eq[k]].n:"—",430,80+j*46,"#fff",17)});
  tx("Compétences",40,278,"#ffd966");skillsOf(a).forEach((k,j)=>{const x=40+(j%2)*290,y=312+(j>>1)*30;ico(DB.skills[k].ico||0,x,y);tx(DB.skills[k].n,x+30,y+2,"#fff",17);tx(DB.skills[k].mp+" PM",x+250,y+4,"#9bf",13,"right")});
  if(n>1){tx("◀",30,H-50,"#9cf",24);tx("▶",W-50,H-50,"#9cf",24)}backBtn()}})}

/* ---------- Sauvegardes : 8 emplacements ---------- */
const readSlots=()=>[...Array(8)].map((_,n)=>{const r=ls.get("rpgslot"+n);if(!r)return null;try{const d=JSON.parse(r);if(d.thumb){d.im=new Image();d.im.src=d.thumb}return d}catch(e){return null}});
const anySlot=()=>[...Array(8)].some((_,n)=>ls.get("rpgslot"+n));
function slotScreen(mode){const sl=readSlots();let i=0;const card=k=>({x:12+(k%2)*(W/2-6),y:62+(k>>1)*104,w:W/2-18,h:96});
 return modal({cancelable:true,
  update(){const mv=d=>{const j=i+d;if(j>=0&&j<8){i=j;se("Cursor1")}};if(trg.up)mv(-2);if(trg.down)mv(2);if(trg.left&&i%2)mv(-1);if(trg.right&&!(i%2))mv(1);
   let t=-1;if(TAP)for(let k=0;k<8;k++){const c=card(k);if(hit(TAP,c.x,c.y,c.w,c.h))t=k}if(t>=0)i=t;
   if(t>=0||trg.ok){if(mode=="load"&&!sl[i])se("Buzzer1");else{se("Decision1");this.done({n:i,d:sl[i]})}}
   if(trg.cancel){se("Cancel1");this.done(-1)}},
  draw(){g.fillStyle="rgba(5,8,20,.9)";g.fillRect(-UX,-UY,VW,VH);tx(mode=="save"?"Sauvegarder dans quel fichier ?":"Charger quel fichier ?",24,14,"#fff",26);g.fillStyle="rgba(150,180,255,.5)";g.fillRect(24,52,W-48,2);
   sl.forEach((d,k)=>{const c=card(k),sel=k==i;g.save();g.shadowColor=sel?"rgba(120,170,255,.8)":"rgba(0,0,0,.5)";g.shadowBlur=(sel?18:8)*K;
    const gr=g.createLinearGradient(0,c.y,0,c.y+c.h);gr.addColorStop(0,sel?"rgba(54,78,138,.97)":"rgba(26,36,68,.95)");gr.addColorStop(1,sel?"rgba(30,44,92,.97)":"rgba(14,20,40,.95)");g.fillStyle=gr;rr(c.x,c.y,c.w,c.h,10);g.fill();g.restore();
    g.lineWidth=sel?2.5:1.5;g.strokeStyle=sel?"#8fb8ff":"rgba(130,160,230,.35)";rr(c.x,c.y,c.w,c.h,10);g.stroke();
    g.fillStyle="rgba(0,0,0,.4)";rr(c.x+8,c.y+8,112,80,6);g.fill();const x0=c.x+132;
    if(d){if(d.im&&ok(d.im)){g.save();rr(c.x+8,c.y+8,112,80,6);g.clip();g.drawImage(d.im,c.x+8,c.y+8,112,80);g.restore()}
     else d.S.party.slice(0,4).forEach((a,j)=>fc(DB.actors[a.id].face,c.x+12+(j%2)*52,c.y+10+(j>>1)*38,36));
     const L=d.S.party[0],fr=sel?[0,1,2,1][Math.floor(performance.now()/170)%4]:1;tx("Fichier "+(k+1),x0,c.y+8,"#8fb8ff",13);tx(nm(L)+"  Nv "+L.lv,x0,c.y+26,"#fff",20);
     tx(MAPS[d.S.map]?MAPS[d.S.map].name:"",x0,c.y+52,"#bcd",14);tx(fmtT(d.S.time)+"  •  "+d.S.gold+" po",x0,c.y+73,"#ffd966",14);
     if(d.date){const dt=new Date(d.date);tx(p2(dt.getDate())+"/"+p2(dt.getMonth()+1)+" "+p2(dt.getHours())+":"+p2(dt.getMinutes()),c.x+c.w-10,c.y+9,"#889",12,"right")}
     g.fillStyle="rgba(0,0,0,.5)";g.fillRect(c.x+8,c.y+58,112,30);d.S.party.slice(0,4).forEach((a,j)=>{const ch=DB.actors[a.id]&&DB.actors[a.id].ch;if(ch){g.save();g.imageSmoothingEnabled=false;spr(ch,0,fr,c.x+8+j*28-2,c.y+54,.62);g.restore()}})}
    else{tx("Fichier "+(k+1),x0,c.y+8,"#8fb8ff",13);tx("Vide",x0,c.y+36,"#778",22)}});
   backBtn()}})}
async function saveMenu(snap){const r=await slotScreen("save");if(r==-1)return;
 if(r.d){const c=await pick({items:["Écraser","Annuler"],x:W/2-90,y:H/2-40,w:180});if(c!=0)return}
 S.x=P.x;S.y=P.y;S.dir=P.dir;const done=ls.set("rpgslot"+r.n,JSON.stringify({S,thumb:snap,date:Date.now()}));se(done?"Save":"Buzzer1");toast(done?"Sauvegardé — fichier "+(r.n+1):"Échec de la sauvegarde")}

/* ---------- Réglages (liste défilable : barre glissable, molette, glisser au doigt, manette) ---------- */
const OO=["Non","Oui"];
const SET=[{h:"Audio"},{l:"Volume général",k:"master",t:"s"},{l:"Musique",k:"bgm",t:"s"},{l:"Ambiance",k:"bgs",t:"s"},{l:"Effets sonores",k:"se",t:"s"},{l:"Jingles",k:"me",t:"s"},
 {h:"Jeu"},{l:"Toujours courir",k:"always",t:"b",o:OO},{l:"Se rappeler la commande",k:"remember",t:"b",o:OO},{l:"Équipe à la suite",k:"follow",t:"b",o:OO},
 {h:"Affichage"},{l:"Plein écran",k:"full",t:"b",o:OO},{l:"Effets visuels",k:"fx",t:"b",o:OO},{l:"Style des fenêtres",k:"classic",t:"b",o:["Moderne","Classique"]},{l:"Taille des commandes tactiles",k:"tsize",t:"s",min:60,max:140},
 {h:"Commandes"},{l:"Commandes clavier",t:"a",r:"keys"},{l:"Commandes manette",t:"a",r:"pad"},{l:"Vibrations",k:"rumble",t:"b",o:OO},{l:"Tutoriel",t:"a",r:"tuto"}];
function settingsModal(){let i=1,sc=0,drag=0,dr=-1,acc=0;const y0=60,rh=32,vis=12,n=SET.length,bx=350,bw=190,sbx=W-46,sbh=vis*rh,maxSc=n-vis;
 const th=()=>Math.max(30,sbh*vis/n),show=()=>{const lo=SET[i-1]&&SET[i-1].h?i-1:i;if(lo<sc)sc=lo;if(i>=sc+vis)sc=i-vis+1};
 const adj=(r,d)=>{if(r.t=="s"){CFG[r.k]=clamp(CFG[r.k]+d*5,r.min||0,r.max||100);applyVol()}else{const v=CFG[r.k]?0:1;if(r.k=="full")setFull(v);else CFG[r.k]=v}};
 const setS=(q,px)=>{const mn=q.min||0,mx=q.max||100,v=clamp(Math.round((mn+(px-bx)/bw*(mx-mn))/5)*5,mn,mx);if(v!=CFG[q.k]){CFG[q.k]=v;applyVol();se("Cursor1")}};
 const rowOf=y=>sc+Math.floor((y-y0)/rh),nav=d=>{let j=i;do{j=(j+d+n)%n}while(SET[j].h);i=j;se("Cursor1");show()};
 return modal({cancelable:true,
  update(){if(trg.up)nav(-1);if(trg.down)nav(1);const r=SET[i];
   if(r.t!="a"){if(trg.left){adj(r,-1);se("Cursor1")}if(trg.right){adj(r,1);se("Cursor1")}}
   if(trg.ok){if(r.t=="a")this.done(r.r);else if(r.t=="b"){adj(r,0);se("Cursor1")}}
   if(WHEEL)sc=clamp(sc+Math.sign(WHEEL),0,maxSc);
   if(PD&&!drag){if(hit(PD,sbx-14,y0-12,36,sbh+24))drag=1;else{const k=rowOf(PD.y);if(k>=0&&k<n&&k<sc+vis&&SET[k].t=="s"&&PD.x>=bx-12&&PD.x<=bx+bw+12){drag=2;dr=k;i=k;setS(SET[k],PD.x)}}}
   if(drag==1&&PM)sc=Math.round(sbVal(PM.y,y0,sbh,th())*maxSc);
   if(drag==2&&PM)setS(SET[dr],PM.x);
   if(!PD)drag=0;else if(!drag&&DRAGY){acc+=DRAGY;while(acc>rh){sc=Math.max(0,sc-1);acc-=rh}while(acc<-rh){sc=Math.min(maxSc,sc+1);acc+=rh}}
   if(TAP&&TAP.x>20&&TAP.x<sbx-14){const k=rowOf(TAP.y);if(k>=0&&k<n&&k<sc+vis&&!SET[k].h){i=k;const q=SET[k];
     if(q.t=="a")this.done(q.r);else if(q.t=="b"){adj(q,0);se("Cursor1")}}}
   if(trg.cancel){se("Cancel1");this.done(null)}},
  draw(){win(20,10,W-40,H-20);tx("Réglages",40,18,"#fff",26);
   for(let k=sc;k<Math.min(n,sc+vis);k++){const r=SET[k],y=y0+(k-sc)*rh;
    if(r.h){tx(r.h,44,y+9,"#ffd966",15);g.fillStyle="rgba(150,180,255,.3)";g.fillRect(44+g.measureText(r.h).width+10,y+17,sbx-34-(44+g.measureText(r.h).width+10),1);continue}
    if(k==i)accent(32,y,sbx-44,rh-3);tx(r.l,56,y+5,k==i?"#fff":"#cfd8f5",19);
    if(r.t=="s"){const mn=r.min||0,mx=r.max||100,v=CFG[r.k];bar(bx,y+12,bw,v-mn,mx-mn,"#6aa0ff",10);const kx=bx+(v-mn)/(mx-mn)*bw;g.fillStyle="#fff";g.beginPath();g.arc(kx,y+17,7,0,7);g.fill();tx(v+(r.k=="tsize"?"%":""),sbx-14,y+5,"#fff",18,"right")}
    else if(r.t=="b"){const on=CFG[r.k];tx("‹  "+r.o[on?1:0]+"  ›",sbx-14,y+5,r.o==OO?(on?"#8f8":"#9aa"):"#9cf",18,"right")}else tx("▸",sbx-14,y+5,"#9cf",18,"right")}
   scrollBar(sbx,y0,sbh,n,vis,sc,drag==1);backBtn()}})}
async function settings(){for(;;){const r=await settingsModal();if(r=="keys")await keysMenu();else if(r=="pad")await padMenu();else if(r=="tuto")await tutorial();else break}saveCfg()}
const ACT={up:"Haut",down:"Bas",left:"Gauche",right:"Droite",ok:"Valider / Interagir",cancel:"Annuler / Menu",menu:"Menu",dash:"Courir",pgl:"Page précédente",pgr:"Page suivante"};
function captureKey(label){let mm;const p=modal(mm={update(){if(TAP){capture=null;this.done(null)}},draw(){win(80,170,W-160,130);tx("Appuyez sur une touche",W/2,196,"#fff",24,"center");tx(label,W/2,236,"#ffd966",20,"center");tx("Échap : annuler",W/2,270,"#889",14,"center")}});
 capture=k=>{capture=null;mm.done(k)};return p}
async function keysMenu(){const bg=()=>{win(20,10,W-40,H-20);tx("Commandes clavier",40,18,"#fff",26)};
 for(;;){const ks=Object.keys(ACT),j=await pick({items:[...ks.map(k=>({t:ACT[k],r:CFG.keys[k].map(keyName).join("  ·  ")})),{t:"Réinitialiser"}],x:40,y:58,w:W-80,rh:34,vis:11,bg});
  if(j<0){saveCfg();return}
  if(j==ks.length){CFG.keys=clone(DEF.keys);buildKM();continue}
  const k=await captureKey(ACT[ks[j]]);
  if(k&&k!="Escape"){const old=CFG.keys[ks[j]];for(const a of ks)CFG.keys[a]=CFG.keys[a].filter(x=>x!=k);CFG.keys[ks[j]]=[k];for(const a of ks)if(!CFG.keys[a].length)CFG.keys[a]=[...old];buildKM()}}}
/* Commandes manette : choisissez une action puis appuyez sur le bouton voulu */
const ACTP={ok:"Valider / Interagir",cancel:"Annuler",menu:"Menu",dash:"Courir",pgl:"Page précédente (LB)",pgr:"Page suivante (RB)"};
function capturePad(label){let armed=false,mm;const p=modal(mm={update(){if(TAP){capture=null;this.done(null)}
   if(!PADB.size)armed=true;else if(armed){capture=null;this.done([...PADB][0])}},
  draw(){win(80,170,W-160,130);tx("Appuyez sur un bouton de la manette",W/2,196,"#fff",22,"center");tx(label,W/2,236,"#ffd966",20,"center");tx(pads().length?"Touche clavier ou toucher : annuler":"Aucune manette détectée — appuyez sur un bouton",W/2,270,"#889",14,"center")}});
 capture=()=>{capture=null;mm.done(null)};return p}
async function padMenu(){const bg=()=>{win(20,10,W-40,H-20);tx("Commandes manette",40,18,"#fff",26);tx(pads().length?"Manette détectée":"Aucune manette détectée — appuyez sur un bouton",40,52,pads().length?"#8f8":"#fa6",14)};
 for(;;){const ks=Object.keys(ACTP),j=await pick({items:[...ks.map(k=>({t:ACTP[k],r:padList(k)})),{t:"Réinitialiser"}],x:40,y:76,w:W-80,rh:36,bg});
  if(j<0){saveCfg();return}
  if(j==ks.length){CFG.pad=clone(DEF.pad);continue}
  const b=await capturePad(ACTP[ks[j]]);
  if(b!=null){const old=CFG.pad[ks[j]];for(const a of ks)CFG.pad[a]=CFG.pad[a].filter(x=>x!=b);CFG.pad[ks[j]]=[b];for(const a of ks)if(!CFG.pad[a].length)CFG.pad[a]=[...old]}}}
function tutorial(){let pg=0;const kk=a=>CFG.keys[a].map(keyName).join(" / "),dirs=["up","left","down","right"].map(a=>keyName(CFG.keys[a][0])).join(" ");
 const P=[touchMode&&!padMode?{t:"Commandes tactiles",r:[["Se déplacer","Touchez et glissez"],["Courir","Poussez à fond"],["Interagir","Bouton « Interagir »"],["Menu","Bouton ☰"],["Listes","Glissez ou tirez la barre"]]}
  :{t:"Clavier",r:[["Se déplacer",dirs],["Valider / Interagir",kk("ok")],["Annuler",kk("cancel")],["Menu",kk("menu")],["Courir",kk("dash")]]},
  {t:"Manette",r:[["Se déplacer","Croix ou stick gauche"],["Valider / Interagir",padList("ok")],["Annuler",padList("cancel")],["Menu",padList("menu")],["Courir / Pages",padList("dash")+"  ·  "+padList("pgl")+" "+padList("pgr")]]},
  {t:"Conseils",r:[["Explorer","Parlez aux habitants, ouvrez les coffres."],["Sauvegarder","8 fichiers dans le menu."],["Combat","Testez feu, glace et foudre."],["Repos","L’auberge soigne toute l’équipe."],["Réglages","Toujours courir, vibrations, cortège…"]]}];
 if(padMode)P.unshift(P.splice(1,1)[0]);
 return modal({cancelable:true,update(){if(trg.left||trg.pgl)pg=Math.max(0,pg-1);if(trg.right||trg.pgr)pg=Math.min(P.length-1,pg+1);if(trg.ok||TAP){if(pg<P.length-1)pg++;else{se("Cancel1");this.done()}}if(trg.cancel){se("Cancel1");this.done()}},
  draw(){const p=P[pg];win(40,40,W-80,H-80);tx(p.t,60,56,"#ffd966",28);g.fillStyle="rgba(150,180,255,.4)";g.fillRect(60,96,W-120,2);
   p.r.forEach((r,k)=>{tx(r[0],64,120+k*50,"#9cf",16);tx(r[1],64,142+k*50,"#fff",20)});
   P.forEach((_,k)=>{g.fillStyle=k==pg?"#9cf":"rgba(255,255,255,.25)";g.beginPath();g.arc(W/2-8*(P.length-1)+k*16,H-64,4,0,7);g.fill()});backBtn()}})}
const tuto=tutorial;
