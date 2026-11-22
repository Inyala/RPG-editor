/* Formulaires génériques : tout se règle par menus déroulants, nombres et boutons ＋ (texte libre seulement pour les noms/descriptions). */
const opt=a=>a.map(x=>Array.isArray(x)?x:[x,String(x)]);
const dbOpts=n=>Object.entries(P.db[n]||{}).map(([k,v])=>[k,k+(v.n?' — '+v.n:'')]);
function sel(opts,val,fn,none){
 opts=opt(opts);if(none)opts=[['',none],...opts];
 const i=opts.findIndex(o=>String(o[0])===String(val)),e=h('select',{onchange:ev=>{const o=opts[+ev.target.value];if(o)fn(o[0])}},opts.map((o,j)=>h('option',{value:j},o[1])));
 if(i<0){e.append(h('option',{value:-1},val+' (?)'));e.value=-1}else e.value=i;return e;
}
let AUD;const stopSnd=()=>{try{AUD&&AUD.pause()}catch(e){}};
function playSnd(dir,name){stopSnd();if(!name)return;const k=[...P.files.keys()].find(x=>x.startsWith(P.root+dir+name+'.'));if(!k)return P.say&&P.say('Son introuvable : '+name);
 Zip.read(P.files.get(k)).then(b=>{AUD=new Audio(URL.createObjectURL(b));AUD.play().catch(()=>{})})}
const selA=(dir,val,fn,none)=>{let cur=val;return h('span',{class:'snd'},sel(P.list(dir),val,v=>{cur=v;fn(v)},none),h('button',{title:'Écouter',onclick:()=>playSnd(dir,cur)},'▶'),h('button',{title:'Arrêter',onclick:stopSnd},'■'))};
/* miniature d'une image du projet (chemin SANS extension, ex. 'Graphics/Battlebacks1/Grassland') ; se redessine quand l'image est chargée */
function thumb(getPath,w=72,hh=54){
 const cv=h('canvas',{width:w,height:hh,class:'pv'});let n=0;
 const dr=()=>{const g=cv.getContext('2d'),p=getPath();g.clearRect(0,0,w,hh);if(!p)return;const im=P.img(p);
  if(!im){if(n++<40)setTimeout(dr,300);return}
  const k=Math.min(w/im.naturalWidth,hh/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;g.imageSmoothingEnabled=false;g.drawImage(im,(w-dw)/2,(hh-dh)/2,dw,dh)};
 cv.redraw=()=>{n=0;dr()};dr();return cv;
}
/* menu déroulant + miniature : dir = dossier d'images (ex. 'Battlebacks1/'), pref = true si la valeur contient déjà le dossier (ex. 'Titles1/Castle') */
function selI(dir,val,fn,none,opts,pref){
 let cur=val;const cv=thumb(()=>cur?'Graphics/'+(pref?cur:dir+cur):'');
 return h('span',{class:'row icob'},cv,sel(opts||P.list('Graphics/'+dir),val,v=>{cur=v;fn(v);cv.redraw()},none));
}
const num=(v,fn,ex={})=>h('input',{type:'number',step:'any',class:'num',value:v,...ex,oninput:e=>fn(+e.target.value)});
const XB=fn=>h('button',{class:'x',title:'Retirer',onclick:fn},'✕');
const DIRS=[[0,'Bas'],[1,'Gauche'],[2,'Droite'],[3,'Haut']],STATS=[['hp','PV'],['mp','PM'],['atk','Attaque'],['def','Défense'],['mat','Magie'],['spd','Vitesse']],ELEM=[['fire','Feu'],['ice','Glace'],['thunder','Foudre']];
const SRC=[
 [/(^|\.)face\.#$/,()=>P.list('Graphics/Faces/')],[/(^|\.)ch\.#$/,()=>P.list('Graphics/Characters/')],[/\.img$/,()=>P.list('Graphics/Battlers/')],
 [/\.ani$/,()=>P.list('Graphics/Animations/')],[/\.se$/,()=>P.list('Audio/SE/')],[/^system\.bgm\./,()=>P.list('Audio/BGM/')],
 [/^system\.titleBg$/,()=>P.list('Graphics/Titles1/').map(x=>['Titles1/'+x,x])],
 [/(^|\.)(sk|acts)\.#$/,()=>dbOpts('skills')],[/\.e\.#$/,()=>dbOpts('enemies')],[/^system\.party\.#$/,()=>dbOpts('actors')],
 [/\.drops\.#\.#$/,()=>dbOpts('items')],[/^actors\.\w+\.eq\.\w$/,()=>dbOpts('items')],
 [/^system\.end\.bg$/,()=>[['','(aucun)'],...P.list('Graphics/Titles1/').map(x=>['Titles1/'+x,x])]],[/^system\.start\.map$/,()=>P.sys.maps],[/^system\.start\.dir$/,()=>DIRS],
 [/^items\.\w+\.go\.map$/,()=>P.sys.maps],[/^items\.\w+\.go\.dir$/,()=>DIRS],
 [/^items\.\w+\.t$/,()=>[['c','Consommable'],['w','Arme'],['a','Armure'],['x','Accessoire'],['k','Objet clé'],['u','Consommable infini']]],
 [/^quests\.\w+\.(start|done)$/,()=>swList()],[/^quests\.\w+\.steps\.#\.sw$/,()=>swList()],[/^system\.menuHide\.#$/,()=>[['items','Objets'],['equip','Équipement'],['status','Statut'],['quests','Quêtes'],['formation','Formation'],['save','Sauvegarder'],['settings','Réglages'],['title','Titre']]],
 [/^skills\.\w+\.type$/,()=>[['phys','Physique'],['mag','Magie'],['heal','Soin']]],
 [/^skills\.\w+\.tgt$/,()=>[['one','1 ennemi'],['all','Tous les ennemis'],['ally','1 allié'],['allies','Tous les alliés']]],
 [/^skills\.\w+\.el$/,()=>ELEM],[/^skills\.\w+\.st$/,()=>[['psn','Poison']]]];
const KEY=[[/\.(b|g)$/,()=>STATS],[/\.el$/,()=>ELEM],[/\.eq$/,()=>[['w','Arme'],['a','Armure'],['x','Accessoire']]],[/^system\.items$/,()=>dbOpts('items')]];
const LB={n:'Nom',b:'Stats niveau 1',g:'Gain par niveau',sk:'Compétences apprises (niveau → compétence)',eq:'Équipement',w:'Arme',a:'Armure',x:'Accessoire',face:'Visage',ch:'Sprite',ico:'Icône n°',t:'Type',hp:'PV',mp:'PM',atk:'Attaque',def:'Défense',mat:'Magie',spd:'Vitesse',price:'Prix',d:'Description',pow:'Puissance',tgt:'Cible',el:'Éléments / résistances',hits:'Coups',st:'Statut',exp:'XP',gold:'Or',acts:'Actions',drops:'Butins (objet, % de chance)',e:'Ennemis',go:'Téléporte à l’utilisation',bt:'Utilisable en combat',ev:'Événement à l’utilisation / consommation',steps:'Étapes de la quête',text:'Texte',sw:'Interrupteur',start:'Visible quand l’interrupteur est actif',done:'Terminée quand l’interrupteur est actif',menuHide:'Entrées du menu masquées au départ',quests:'Quêtes',cure:'Soigne le poison',rev:'Réanime',ani:'Animation',se:'Son',img:'Image',title:'Titre',sub:'Sous-titre',start:'Départ',party:'Équipe',items:'Objets de départ',bgm:'Musiques',titleBg:'Fond du titre',map:'Carte',dir:'Direction',type:'Type',fire:'Feu',ice:'Glace',thunder:'Foudre',battle:'Combat',boss:'Boss',title_:'Titre',end:'Écran de fin',c1:'Couleur du titre',c2:'Couleur du sous-titre',s1:'Taille du titre',s2:'Taille du sous-titre',dur:'Durée affichée (ms)',bg:'Image de fond',me:'Jingle (ME)'};
const lbl=(k,np)=>np[0]==='quests'&&k==='start'?'Visible quand l’interrupteur est actif':np.includes('end')&&k==='y'?'Position verticale (px)':k==='ch'&&np[0]==='skills'?'Chance %':k==='x'&&(np[0]==='system'||np.includes('go'))?'Colonne x':k==='y'?'Ligne y':LB[k]||k;
const nrm=p=>p.map(x=>/^\d+$/.test(x)?'#':x).join('.'),pick=(T,p)=>(T.find(([r])=>r.test(p))||[])[1];
const HIDE=['legend','sheets','maps'],TUPLE=/(^|\.)(face|ch)$|\.drops\.#$/;
function addDef(a,np){const n=nrm([...np,0]),s=pick(SRC,n);if(s)return opt(s())[0]?.[0];if(/drops$/.test(nrm(np)))return[dbOpts('items')[0]?.[0],10];return a.length?structuredClone(a[a.length-1]):0}
function field(par,k,np,t){
 const v=par[k],p=[...np,String(k)],s=pick(SRC,nrm(p));
 const np_=nrm(p),AU=/\.se$/.test(np_)?'Audio/SE/':/^system\.bgm\./.test(np_)?'Audio/BGM/':/^system\.end\.me$/.test(np_)?'Audio/ME/':null;if(AU&&typeof v==='string')return selA(AU,v,x=>{par[k]=x;t()},/\.me$/.test(np_)?'(aucun)':'');
 if(/^system\.end\.c\d$/.test(np_)&&typeof v==='string')return h('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(v)?v:'#ffffff',class:'clr',oninput:e=>{par[k]=e.target.value;t()}});
 if(typeof v==='string'){const IMG=/\.img$/.test(np_)?['Battlers/']:/\.ani$/.test(np_)?['Animations/']:/^system\.(titleBg|end\.bg)$/.test(np_)?['Titles1/',1]:null;
  if(IMG)return selI(IMG[0],v,x=>{par[k]=x;t()},/end\.bg$/.test(np_)?'(aucun)':'',IMG[1]?[...P.list('Graphics/Titles1/').map(x=>['Titles1/'+x,x])]:null,!!IMG[1])}
 if(s&&!(typeof v==='number'&&/\.drops\.#\.#$/.test(nrm(p))))return sel(s(),v,x=>{par[k]=typeof v==='number'?+x:x;t()});
 if(typeof v==='number'&&k==='ico')return iconBtn(v,x=>{par[k]=x;t()});
 if(typeof v==='number')return num(v,x=>{par[k]=x;t()});
 if(typeof v==='boolean')return h('input',{type:'checkbox',checked:v,onchange:e=>{par[k]=e.target.checked;t()}});
 if(typeof v==='string')return h('input',{value:v,oninput:e=>{par[k]=e.target.value;t()}});
 if(k==='ev'&&np[0]==='items'&&Array.isArray(v))return cmdList(v,t);
 if(Array.isArray(v))return arr(v,p,t);
 return v&&typeof v==='object'?obj(v,p,t):h('span',{},String(v));
}
function iconBtn(v,fn){
 const cv=h('canvas',{width:24,height:24}),tx=h('span',{},' n° '+v);let n=0;
 const dr=()=>{const g=cv.getContext('2d'),im=P.img('Graphics/System/IconSet');g.clearRect(0,0,24,24);if(im)g.drawImage(im,(v%16)*24,(v/16|0)*24,24,24,0,0,24,24);else if(n++<30)setTimeout(dr,300)};dr();
 return h('button',{class:'icob',onclick:()=>{
  const d=$('dlg'),big=h('canvas',{class:'big'}),show=()=>{const im=P.img('Graphics/System/IconSet');if(!im)return;big.width=im.naturalWidth;big.height=im.naturalHeight;const g=big.getContext('2d');g.drawImage(im,0,0);g.strokeStyle='#fd3';g.lineWidth=2;g.strokeRect((v%16)*24+1,(v/16|0)*24+1,22,22)};
  big.onclick=e=>{const r=big.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*big.width/r.width/24),y=Math.floor((e.clientY-r.top)*big.height/r.height/24);v=y*16+x;fn(v);tx.textContent=' n° '+v;dr();d.close()};
  P.hook=show;d.onclose=()=>{P.hook=null};d.replaceChildren(h('div',{class:'row'},h('b',{},'Choisir une icône'),h('button',{onclick:()=>d.close()},'Fermer')),h('div',{class:'sheet'},big));show();d.showModal()}},cv,tx);
}
/* visage / sprite : feuille (menu) + n° (menu) + aperçu de l'image */
function facePicker(a,np,t){
 const face=np[np.length-1]==='face',cv=h('canvas',{width:48,height:48,class:'pv'});let n=0;
 const dr=()=>{const g=cv.getContext('2d'),im=P.img('Graphics/'+(face?'Faces/':'Characters/')+a[0]);g.clearRect(0,0,48,48);
  if(!im){if(n++<30)setTimeout(dr,300);return}
  const i=+a[1]||0,single=/^\$/.test(a[0]);
  if(face){const w=im.naturalWidth/4,hh=im.naturalHeight/2;g.drawImage(im,(i%4)*w,(i/4|0)*hh,w,hh,0,0,48,48)}
  else{const cw=im.naturalWidth/(single?3:12),ch=im.naturalHeight/(single?4:8),sx=single?cw:((i%4)*3+1)*cw,sy=single?0:(i/4|0)*4*ch,dw=Math.min(48,48*cw/ch);g.drawImage(im,sx,sy,cw,ch,(48-dw)/2,0,dw,48)}};
 dr();
 return h('div',{class:'row icob'},cv,sel(P.list('Graphics/'+(face?'Faces/':'Characters/')),a[0],x=>{a[0]=x;t();n=0;dr()}),
  sel([...Array(8)].map((_,i)=>[i,'n° '+(i+1)]),a[1],x=>{a[1]=+x;t();n=0;dr()}));
}
function arr(a,np,t){
 if(/(^|\.)(face|ch)\.#$/.test(nrm([...np,0]))&&a.length===2&&typeof a[0]==='string')return facePicker(a,np,t);
 const box=h('div',{class:'list'}),tup=TUPLE.test(nrm(np)),draw=()=>{
  fillBox(box,...a.map((_,i)=>h('div',{class:'row'},field(a,i,np,t),!tup&&XB(()=>{a.splice(i,1);t();draw()}))),!tup&&h('button',{onclick:()=>{a.push(addDef(a,np));t();draw()}},'＋ Ajouter'));
 };draw();return box;
}
function obj(v,np,t){
 const ns=nrm(np),ks=pick(KEY,ns),entry=np.length===2&&np[0]!=='system',lv=/\.sk$/.test(ns),box=h('div',{class:'obj'}),HK=entry&&np[0]==='items'?['t','bt','ev']:[];
 const draw=()=>{
  fillBox(box,);
  for(const k of Object.keys(v)){
   if(np.length===1&&HIDE.includes(k))continue;if(HK.includes(k))continue;
   const kl=ks?(opt(ks()).find(o=>o[0]===k)||[0,k])[1]:lbl(k,np),rm=ks||lv||(entry&&k!=='n');
   box.append(h('div',{class:'frow'},lv?num(k,n=>{const es=Object.entries(v).map(([a,b])=>[a===k?String(n):a,b]);Object.keys(v).forEach(x=>delete v[x]);es.forEach(([a,b])=>v[a]=b);t()},{step:1,min:1,class:'num lv',title:'Niveau'}):h('span',{class:'fl'},kl),field(v,k,np,t),rm&&XB(()=>{delete v[k];t();draw()})));
  }
  let miss=null;
  if(ks)miss=opt(ks()).filter(o=>!(o[0] in v));
  else if(entry){const all={};Object.values(P.db[np[0]]||{}).forEach(o=>Object.keys(o).forEach(k=>all[k]??=o[k]));miss=Object.keys(all).filter(k=>!(k in v)&&!HK.includes(k)).map(k=>[k,lbl(k,np)])}
  if(miss&&miss.length)box.append(sel(miss,'',k=>{if(!k)return;const s=pick(SRC,nrm([...np,k]));v[k]=entry?structuredClone((Object.values(P.db[np[0]]).find(o=>k in o)||{})[k]):s?opt(s())[0][0]:0;t();draw()},'＋ Ajouter un champ…'));
  if(lv)box.append(h('button',{onclick:()=>{v[Math.max(0,...Object.keys(v).map(Number))+1]=dbOpts('skills')[0]?.[0]||'';t();draw()}},'＋ Compétence'));
 };draw();return box;
}
