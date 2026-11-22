'use strict';
/* ===== battle.js — combats au tour par tour ===== */
/* ---------- Combat ---------- */
const POS=c=>c.eq?{x:30+S.party.indexOf(c)*((W-20)/S.party.length)+((W-20)/S.party.length)/2,y:H-60}:{x:c.px,y:c.py-(c.hh||80)/2};
function fx(o){B.fx.push(o)}
function anim(n,p){return new Promise(r=>{img("Animations/"+n);fx({k:"a",n,x:p.x,y:p.y,t:0,r})})}
function pop(c,txt,col="#fff"){const p=POS(c);fx({k:"n",txt,x:p.x,y:p.y-10,t:0,col})}
const blog=(t,ms=750)=>{B.log=t;return sleep(ms)},alive=l=>l.filter(c=>c.hp>0);
function calc(a,b,s){const ph=s.type=="phys",ak=ph?"atk":"mat";let v;
 if(s.type=="heal")return Math.round(st(a,"mat")*s.pow+rnd(0,8));
 v=(st(a,ak)*(ph?1.6:2)-st(b,"def")*(ph?.8:.4))*s.pow*rnd(90,110)/100;
 if(s.el&&b.el&&b.el[s.el]!=null)v*=b.el[s.el];if(b.guard)v*=.5;return Math.max(s.el&&b.el&&b.el[s.el]===0?0:1,Math.round(v))}
async function die(c){if(c.eq){c.hp=0;c.psn=0;await blog(nm(c)+" est K.O. !",600)}else{se("Collapse1");for(let i=0;i<10;i++){c.al-=.1;await sleep(40)}c.al=0}}
const NOBATTLE=["tp","battle","shop","openmenu","savemenu","ending","fade","join","menu"];
/* objet utilisable en combat : consommable (c) ou infini (u), « bt » choisi dans l’éditeur (défaut : oui pour c, non pour u) ; jamais un objet de téléportation */
const battleItem=it=>(it.t=="c"||it.t=="u")&&!it.go&&(it.bt==null?it.t=="c":!!it.bt);
async function doAct(x){const s=x.src;if(s.hp<=0)return;const A=!!s.eq;
 if(x.guard){s.guard=1;await blog(nm(s)+" se met en garde.");return}
 if(x.esc){if(!B.boss&&Math.random()<.5){se("Run");B.fled=1;await blog("Vous prenez la fuite !")}else await blog("Impossible de fuir !");return}
 let sk=x.item?null:DB.skills[x.sk],it=x.item&&DB.items[x.item],tg;
 if(it){if(it.t!="u"&&!S.inv[x.item]){await blog("Il n’y en a plus !");return}await blog(nm(s)+" utilise "+it.n+" !");se("Item1");tg=[x.t];if(it.t!="u")addItem(x.item,-1);
  const t=x.t;if(!t){}else if(it.rev&&t.hp<=0){t.hp=Math.round(st(t,"hp")/2);pop(t,t.hp,"#8f8")}else if(t.hp>0){if(it.hp){const h=Math.min(it.hp,st(t,"hp")-t.hp);t.hp+=h;pop(t,h,"#8f8")}if(it.mp){t.mp=Math.min(st(t,"mp"),t.mp+it.mp);pop(t,it.mp,"#8cf")}if(it.cure){t.psn=0}}
  if(hasEv(it))await run(it.ev.filter(c=>!NOBATTLE.includes(c[0]))); /* script de l’objet (sans téléportation, combat, boutique, menus, fin du jeu) */
  await sleep(500);return}
 if(!A){const k=s.acts[rnd(0,s.acts.length-1)];sk=DB.skills[k]}
 if(A&&x.sk!="attack"){if(s.mp<sk.mp){await blog("Pas assez de PM !");return}s.mp-=sk.mp}
 await blog(x.sk=="attack"||(!A&&sk===DB.skills.attack)?nm(s)+" attaque !":nm(s)+" utilise "+sk.n+" !",650);
 const foes=A?B.en:S.party,friends=A?S.party:B.en;
 if(sk.tgt=="all")tg=alive(foes);else if(sk.tgt=="allies")tg=alive(friends);
 else if(sk.tgt=="ally")tg=[x.t];else{tg=A?[x.t&&x.t.hp>0?x.t:alive(foes)[rnd(0,alive(foes).length-1)]]:[alive(foes)[rnd(0,alive(foes).length-1)]]}
 se(sk.se);if(sk.ani)await Promise.all(tg.map(t=>anim(sk.ani,POS(t))));
 for(let h=0;h<(sk.hits||1);h++)for(const t of tg){
  if(t.hp<=0&&sk.type!="heal")continue;
  if(sk.type=="heal"){const v=calc(s,t,sk);t.hp=Math.min(st(t,"hp"),t.hp+v);pop(t,v,"#8f8");continue}
  let v=calc(s,t,sk);if(sk.type=="phys"&&Math.random()<.08){v=Math.round(v*1.5);se("Damage4")}
  t.hp=Math.max(0,t.hp-v);t.fl=14;if(t.eq){FX.shake=8;rumble(160,.7,.4)}else if(v>60)FX.shake=5;pop(t,v,t.eq?"#f88":"#fff");se(t.eq?"Damage2":"Damage1");
  if(sk.st=="psn"&&t.hp>0&&rnd(1,100)<=(sk.ch||60)&&!t.psn){t.psn=4;pop(t,"Poison","#c8f")}
  if(t.hp<=0)await die(t)}
 await sleep(350)}
const over=()=>B.en.every(e=>e.hp<=0)?"win":S.party.every(a=>a.hp<=0)?"lose":null;
async function battle(tid,o={}){
 const T=DB.troops[tid],cnt={};T.e.forEach(k=>cnt[k]=(cnt[k]||0)+1);const seen={};
 B={en:T.e.map(k=>{const d=DB.enemies[k],e={...d,k,mhp:d.hp,hp:d.hp,mp:99,al:1,fl:0,psn:0,guard:0};if(cnt[k]>1){seen[k]=(seen[k]||0)+1;e.n+=" "+"ABCD"[seen[k]-1]}return e}),
  fx:[],log:"",bb:o.bb||M.bb||["Grassland","Grassland"],boss:o.boss||o.esc===false,cur:null};
 B.en.forEach((e,i)=>{e.px=(i+1)*W/(B.en.length+1);e.py=285;img("Battlers/"+e.img)});
 for(const s of S.party)for(const k of skillsOf(s))img("Animations/"+DB.skills[k].ani);
 bgm(o.boss?SYS.bgm.boss:SYS.bgm.battle);se("Battle1");
 await fadeTo(1,200);scene="battle";await fadeTo(0,300);
 await blog(B.en.length>1?"Des ennemis apparaissent !":B.en[0].n+" apparaît !",900);
 let res=null;
 for(;;){
  S.party.concat(B.en).forEach(c=>c.guard=0);const acts=[],al=alive(S.party);let i=0;
  while(i<al.length){const r=await cmdMenu(al[i],i>0);if(r==="back"){i--;acts.pop();continue}acts.push(r);i++}
  for(const e of alive(B.en))acts.push({src:e});
  for(const a of acts)a.sp=st(a.src,"spd")+rnd(0,6)+(a.guard?100:0)+(a.esc?50:0);
  acts.sort((p,q)=>q.sp-p.sp);
  for(const a of acts){if(over()||B.fled)break;await doAct(a)}
  if(B.fled){res="esc";break}if(res=over())break;
  for(const c of S.party.concat(B.en)){if(c.psn>0&&c.hp>0){const d=Math.max(1,Math.floor(st(c,"hp")*.08));c.hp=Math.max(0,c.hp-d);c.psn--;se("Poison");pop(c,d,"#c8f");B.log=nm(c)+" souffre du poison.";await sleep(600);if(c.hp<=0)await die(c)}}
  if(res=over())break}
 if(res=="lose"){await gameOver();throw"abort"}
 if(res=="win"){bgm(null);me("Victory1");await sleep(300);
  const ex=B.en.reduce((s,e)=>s+e.exp,0),gd=B.en.reduce((s,e)=>s+e.gold,0),dr=[];
  for(const e of B.en)for(const[id,p]of e.drops)if(rnd(1,100)<=p){addItem(id);dr.push(DB.items[id].n)}
  S.gold+=gd;let t="Victoire !\n"+ex+" EXP — "+gd+" po"+(dr.length?"\nButin : "+dr.join(", "):"");await say("",t);
  for(const a of alive(S.party)){const l0=a.lv,k0=skillsOf(a).length;a.exp+=ex;while(a.lv<30&&a.exp>=cum(a.lv+1)){a.lv++;a.hp=Math.min(st(a,"hp"),a.hp+DB.actors[a.id].g.hp);a.mp=Math.min(st(a,"mp"),a.mp+DB.actors[a.id].g.mp)}
   if(a.lv>l0){se("Up1");await say("",nm(a)+" passe au niveau "+a.lv+" !"+(skillsOf(a).length>k0?"\nNouvelle compétence : "+DB.skills[skillsOf(a).pop()].n:""))}}}
 S.party.forEach(a=>a.psn=0);
 await fadeTo(1,250);B=null;scene="map";bgm(M.bgm);await fadeTo(0,300);return res}
async function cmdMenu(a,back){for(;;){B.cur=a;
 const i=await pick({items:["Attaquer","Compétence","Objet","Défendre","Fuir"],x:12,y:H-130-5*30-34,w:170,cancel:back,i:CFG.remember?(a.lc||0):0});
 if(i<0)return"back";a.lc=i;
 if(i==0){const t=await pickEnemy();if(t)return{src:a,sk:"attack",t}}
 if(i==1){const ks=skillsOf(a),j=await pick({items:ks.map(k=>({t:DB.skills[k].n,ico:DB.skills[k].ico,r:DB.skills[k].mp+" PM",dis:a.mp<DB.skills[k].mp})),x:190,y:H-130-Math.min(ks.length,6)*30-34,w:330,vis:6});
  if(j>=0){const k=ks[j],s=DB.skills[k];let t=null;if(s.tgt=="one")t=await pickEnemy();else if(s.tgt=="ally")t=await pickAlly();if(s.tgt=="all"||s.tgt=="allies"||t)return{src:a,sk:k,t}}}
 if(i==2){const ids=Object.keys(DB.items).filter(k=>S.inv[k]&&battleItem(DB.items[k]));
  if(!ids.length){se("Buzzer1");continue}
  const j=await pick({items:ids.map(k=>({t:DB.items[k].n,ico:DB.items[k].ico,r:"×"+S.inv[k]})),x:190,y:H-130-Math.min(ids.length,6)*30-34,w:330,vis:6});
  if(j>=0){const it=DB.items[ids[j]],nt=!(it.hp||it.mp||it.cure||it.rev),t=nt?null:await pickAlly();if(nt||t)return{src:a,item:ids[j],t}}}
 if(i==3)return{src:a,guard:1};if(i==4)return{src:a,esc:1}}}
const pickAlly=async()=>{const i=await pick({items:S.party.map(a=>({t:nm(a),r:a.hp+"/"+st(a,"hp")})),x:190,y:H-130-S.party.length*30-34,w:300});return i<0?null:S.party[i]};
function pickEnemy(){const al=B.en.map((e,k)=>e.hp>0?k:-1).filter(k=>k>=0);let i=al[0];
 return modal({cancelable:true,update(){const p=al.indexOf(i);if(trg.left||trg.up){i=al[(p+al.length-1)%al.length];se("Cursor1")}if(trg.right||trg.down){i=al[(p+1)%al.length];se("Cursor1")}
  if(TAP){const k=al.find(k=>{const e=B.en[k];return hit(TAP,e.bx-8,e.by-8,e.bw+16,e.bh+16)});if(k!=null){se("Decision1");this.done(B.en[k]);return}}
  if(trg.ok){se("Decision1");this.done(B.en[i])}if(trg.cancel){se("Cancel1");this.done(null)}},
  draw(){const e=B.en[i];win(W/2-110,8,220,40);tx(e.n,W/2,16,"#fff",20,"center");tx("▼",e.px,e.py-(e.hh||80)-26,"#ff0",24,"center");backBtn()}})}
function drawBattle(){
 for(const[k,n]of[["Battlebacks1",B.bb[0]],["Battlebacks2",B.bb[1]]]){const m=img(k+"/"+n);if(ok(m))cover(m)}
 g.save();g.translate(UX,UY);OX=UX;OY=UY;
 for(const e of B.en){const m=img("Battlers/"+e.img);if(!ok(m)||e.al<=0)continue;
  const sc=Math.min(1.6,230/m.naturalHeight,(W/(B.en.length+.4))/m.naturalWidth*1.1),w=m.naturalWidth*sc,h=m.naturalHeight*sc;e.hh=h;e.bx=e.px-w/2;e.by=e.py-h;e.bw=w;e.bh=h;
  if(e.fl>0)e.fl--;g.globalAlpha=e.al*(e.fl%4>1?.35:1);g.drawImage(m,e.px-w/2,e.py-h,w,h);g.globalAlpha=1}
 const n=S.party.length,cw=(W-20)/n;win(-UX,H-130,VW,130);
 S.party.forEach((a,i)=>{const x=14+i*cw,y=H-122;if(B.cur===a){g.fillStyle="rgba(100,160,255,.3)";g.fillRect(x-4,y-2,cw-6,114)}
  if(a.fl>0){a.fl--;if(a.fl%4>1){g.fillStyle="rgba(255,60,60,.35)";g.fillRect(x-4,y-2,cw-6,114)}}
  g.globalAlpha=a.hp>0?1:.45;fc(DB.actors[a.id].face,x,y+6,72);g.globalAlpha=1;
  tx(nm(a)+(a.psn?" ☠":""),x+78,y,"#ffd966",18);tx("Nv "+a.lv,x+78,y+22,"#fff",14);
  tx("PV "+a.hp+"/"+st(a,"hp"),x,y+84,"#fff",14);bar(x,y+102,cw-20,a.hp,st(a,"hp"),"#6d6");
  tx("PM "+a.mp,x+78,y+44,"#9cf",14);bar(x+78,y+64,cw-98,a.mp,st(a,"mp"),"#59f")});
 if(B.log){win(W/2-270,8,540,42);tx(B.log,W/2,17,"#fff",20,"center")}
 for(let i=B.fx.length-1;i>=0;i--){const f=B.fx[i];f.t++;
  if(f.k=="a"){const m=img("Animations/"+f.n);if(!ok(m)){if(f.t>90){f.r();B.fx.splice(i,1)}continue}
   const c=Math.floor(m.naturalWidth/192),tot=Math.min(14,c*Math.floor(m.naturalHeight/192)),fr=Math.floor(f.t/3);
   if(fr>=tot){f.r();B.fx.splice(i,1)}else g.drawImage(m,(fr%c)*192,(fr/c|0)*192,192,192,f.x-96,f.y-96,192,192)}
  else{if(f.t>45){B.fx.splice(i,1);continue}tx(String(f.txt),f.x,f.y-f.t*.8,f.col,26,"center")}}
 g.restore();OX=OY=0}

