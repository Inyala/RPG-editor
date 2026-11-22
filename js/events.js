/* Éditeur d'événements : pages, conditions et commandes entièrement par menus (texte libre uniquement pour les dialogues). */
const trim=c=>{while(c.length>1&&c[c.length-1]===undefined)c.pop()};
const walk=(v,f)=>{f(v);if(v&&typeof v==='object')Object.values(v).forEach(x=>walk(x,f))};
P.extraSw=new Set();
function swList(){const s=new Set(P.extraSw);Object.values(P.maps).forEach(m=>walk(m,v=>{if(Array.isArray(v)){if(v[0]==='sw'&&typeof v[1]==='string')s.add(v[1])}else if(v&&typeof v==='object')for(const k of['sw','nsw'])if(typeof v[k]==='string')s.add(v[k])}));return[...s].sort()}
function swSel(val,fn){
 const box=h('span',{class:'row'}),draw=()=>{const l=swList();if(val&&!l.includes(val))l.push(val);
  fillBox(box,sel(l,val,v=>{val=v;fn(v)},'(choisir)'),
   h('button',{title:'Nouvel interrupteur',onclick:()=>{let n=1;while(l.includes('inter_'+n))n++;val='inter_'+n;P.extraSw.add(val);fn(val);draw()}},'＋'),
   val&&h('button',{title:'Renommer partout',onclick:()=>{const nn=(prompt('Nouveau nom de l’interrupteur',val)||'').trim();if(!nn||nn===val)return;Object.values(P.maps).forEach(m=>walk(m,v=>{if(Array.isArray(v)){if(v[0]==='sw'&&v[1]===val)v[1]=nn}else if(v&&typeof v==='object')for(const k of['sw','nsw'])if(v[k]===val)v[k]=nn}));P.extraSw.delete(val);val=nn;P.touch();draw()}},'✎'))};
 draw();return box;
}
const CND=[['sw','Interrupteur actif'],['nsw','Interrupteur inactif'],['item','Possède l’objet'],['gold','Or ≥'],['pm','Équipiers ≥'],['has','Perso dans l’équipe'],['lvl','Niveau max de l’équipe ≥'],['quest','Quête commencée'],['qdone','Quête terminée']];
const cdef=k=>k==='sw'||k==='nsw'?'':k==='item'?(dbOpts('items')[0]||[''])[0]:k==='has'?(dbOpts('actors')[0]||[''])[0]:k==='quest'||k==='qdone'?(dbOpts('quests')[0]||[''])[0]:k==='gold'?100:1;
function condEd(o,t){
 const box=h('div',{class:'list'}),draw=()=>{
  const ctl=k=>k==='sw'||k==='nsw'?swSel(o[k],v=>{o[k]=v;t()}):k==='item'?sel(dbOpts('items'),o[k],v=>{o[k]=v;t()}):k==='has'?sel(dbOpts('actors'),o[k],v=>{o[k]=v;t()}):k==='quest'||k==='qdone'?sel(dbOpts('quests'),o[k],v=>{o[k]=v;t()},'(choisir)'):num(o[k],v=>{o[k]=v;t()});
  const left=CND.filter(([k])=>!(k in o));
  fillBox(box,...Object.keys(o).map(k=>h('div',{class:'row'},sel(CND.filter(([x])=>x===k||!(x in o)),k,n=>{const es=Object.entries(o).map(([a,b])=>a===k?[n,cdef(n)]:[a,b]);Object.keys(o).forEach(x=>delete o[x]);es.forEach(([a,b])=>o[a]=b);t();draw()}),ctl(k),XB(()=>{delete o[k];t();draw()}))),
   left.length&&sel(left,'',k=>{if(k){o[k]=cdef(k);t();draw()}},'＋ Condition…'));
 };draw();return box;
}
const CMD={say:'💬 Message',ask:'❓ Choix',if:'🔀 Condition',sw:'🔘 Interrupteur',gold:'💰 Or',xp:'⭐ Gagner de l’XP',openmenu:'📋 Ouvrir le menu',savemenu:'💾 Ouvrir le menu Sauvegarder',menu:'🧭 Afficher/masquer une entrée du menu',item:'🎒 Objet',heal:'❤ Soigner l’équipe',join:'➕ Recruter',tp:'🚪 Téléporter',battle:'⚔ Combat',shop:'🛒 Boutique',bgm:'🎵 Musique',me:'🎺 Jingle (ME)',se:'🔊 Son (SE)',wait:'⏱ Attendre',fade:'🌑 Fondu',shake:'📳 Secousse',flash:'⚡ Flash',weather:'🌧 Météo',qstart:'📜 Quête : commencer',qstep:'📜 Quête : mettre à jour (étape)',qdone:'📜 Quête : terminer',qreset:'📜 Quête : retirer / réinitialiser',ending:'🏁 Fin du jeu'};
const QCMD=['qstart','qstep','qdone','qreset'];
const CMD_DEF={openmenu:['openmenu'],qstart:['qstart',''],qstep:['qstep','',0,1],qdone:['qdone',''],qreset:['qreset',''],say:['say','','Texte'],ask:['ask',['Oui','Non'],[[],[]]],if:['if',{},[],[]],sw:['sw',''],gold:['gold',10],xp:['xp',50],menu:['menu','quests',1],item:['item','',1],tp:['tp','',0,0,0],battle:['battle',''],shop:['shop',[]],wait:['wait',500],fade:['fade',1],shake:['shake',8],weather:['weather','rain']};
const lab=(t,...e)=>h('label',{},t,...e);
function names(){const s=new Set(Object.values(P.db.actors||{}).map(a=>a.n));Object.values(P.maps).forEach(m=>walk(m,v=>{if(Array.isArray(v)&&v[0]==='say'&&v[1])s.add(v[1])}));return[...s]}
const BODY={
 openmenu:(c,t)=>[lab('Menu à ouvrir',sel([['','Menu principal (liste complète)'],['quests','Quêtes'],['items','Objets'],['equip','Équipement'],['status','Statut'],['formation','Formation'],['save','Sauvegarder'],['settings','Réglages']],c[1]||'',v=>{if(v)c[1]=v;else c.length=1;t()})),h('small',{},'Ouvre le menu choisi, directement, même s’il est masqué dans le menu principal.')],
 qstart:(c,t)=>[lab('Quête',sel(dbOpts('quests'),c[1],v=>{c[1]=v;t()},'(choisir)')),h('small',{},'La quête apparaît dans le menu Quêtes (avec une notification).')],
 qdone:(c,t)=>[lab('Quête',sel(dbOpts('quests'),c[1],v=>{c[1]=v;t()},'(choisir)')),h('small',{},'La quête est marquée « terminée » (✔) dans le menu Quêtes.')],
 qreset:(c,t)=>[lab('Quête',sel(dbOpts('quests'),c[1],v=>{c[1]=v;t()},'(choisir)')),h('small',{},'Retire la quête du menu et décoche toutes ses étapes (hors interrupteurs).')],
 qstep:(c,t)=>{const box=h('div',{}),draw=()=>{const q=(P.db.quests||{})[c[1]],stp=((q&&q.steps)||[]).map((x,i)=>[i,(i+1)+'. '+((Array.isArray(x)?x[0]:x.text)||'')]);
   fillBox(box,lab('Quête',sel(dbOpts('quests'),c[1],v=>{c[1]=v;c[2]=0;t();draw()},'(choisir)')),h('div',{class:'row'},lab('Étape',sel(stp,c[2]??0,v=>{c[2]=+v;t()})),lab('Action',sel([[1,'Cochée (terminée)'],[0,'Décochée']],c[3]===0?0:1,v=>{c[3]=+v;t()}))))};draw();return[box]},
 savemenu:()=>[h('small',{},'Ouvre directement l’écran « Sauvegarder dans quel fichier ? » (idéal près d’un point de sauvegarde, d’un cristal, d’un lit…).')],
 menu:(c,t)=>[h('div',{class:'row'},lab('Entrée',sel([['items','Objets'],['equip','Équipement'],['status','Statut'],['quests','Quêtes'],['formation','Formation'],['save','Sauvegarder'],['settings','Réglages'],['title','Titre']],c[1],v=>{c[1]=v;t()})),lab('Action',sel([[1,'Afficher'],[0,'Masquer']],c[2]??1,v=>{c[2]=+v;t()})))],
 xp:(c,t)=>[h('div',{class:'row'},lab('XP',num(c[1],v=>{c[1]=Math.round(v);t()})),lab('Perso',sel(dbOpts('actors'),c[2]||'',v=>{c[2]=v;t()},'Toute l’équipe')))],
 say:(c,t)=>{
  const box=h('div',{}),draw=()=>{const nm=names();if(c[1]&&!nm.includes(c[1]))nm.push(c[1]);const f=c[3];
   fillBox(box,h('div',{class:'row'},lab('Qui parle ',h('span',{class:'row'},sel(nm,c[1]||'',v=>{c[1]=v;t()},'(narration)'),h('button',{title:'Autre nom',onclick:()=>{const n=(prompt('Nom du personnage')||'').trim();if(n){c[1]=n;t();draw()}}},'＋'))),
    lab('Visage ',h('span',{class:'row'},selI('Faces/',f?f[0]:'',v=>{c[3]=v?[v,0]:undefined;trim(c);t();draw()},'(aucun)'),f&&sel([0,1,2,3,4,5,6,7],f[1],v=>{f[1]=+v;t()})))),
    lab('Texte du dialogue',h('textarea',{rows:3,value:c[2]||'',oninput:e=>{c[2]=e.target.value;t()}})))};draw();return[box];},
 ask:(c,t)=>{const box=h('div',{}),draw=()=>{const ch=c[1],br=c[2]=c[2]||[];ch.forEach((_,i)=>br[i]=br[i]||[]);
   fillBox(box,...ch.map((x,i)=>h('div',{class:'sub'},h('div',{class:'row'},'Choix '+(i+1),h('input',{value:x,oninput:e=>{ch[i]=e.target.value;t()}}),ch.length>1&&XB(()=>{ch.splice(i,1);br.splice(i,1);t();draw()})),cmdList(br[i],t))),h('button',{onclick:()=>{ch.push('Choix');br.push([]);t();draw()}},'＋ Choix'))};draw();return[box];},
 if:(c,t)=>{const o=c[1]=c[1]||{};c[2]=c[2]||[];c[3]=c[3]||[];return[lab('Si…',condEd(o,t)),h('div',{class:'sub'},h('b',{},'Alors'),cmdList(c[2],t)),h('div',{class:'sub'},h('b',{},'Sinon'),cmdList(c[3],t))]},
 sw:(c,t)=>[lab('Interrupteur',swSel(c[1],v=>{c[1]=v;t()})),lab('Valeur',sel([[1,'Activer'],[0,'Désactiver']],c[2]===false?0:1,v=>{c[2]=+v?undefined:false;trim(c);t()}))],
 gold:(c,t)=>[lab('Montant (négatif = retirer)',num(c[1],v=>{c[1]=v;t()}))],
 item:(c,t)=>[lab('Objet',sel(dbOpts('items'),c[1],v=>{c[1]=v;t()},'(choisir)')),lab('Quantité',num(c[2]??1,v=>{c[2]=v;t()}))],
 join:(c,t)=>[lab('Héros',sel(dbOpts('actors'),c[1],v=>{c[1]=v;t()},'(choisir)'))],
 tp:(c,t)=>{const xi=num(c[2],v=>{c[2]=Math.round(v);t()}),yi=num(c[3],v=>{c[3]=Math.round(v);t()});return[lab('Carte',sel(P.sys.maps,c[1],v=>{c[1]=v;t()},'(choisir)')),h('div',{class:'row'},lab('x',xi),lab('y',yi),h('button',{title:'Choisir le point sur la carte',onclick:()=>c[1]&&pickPoint(c[1],c[2],c[3],(x,y)=>{c[2]=x;c[3]=y;xi.value=x;yi.value=y;t()})},'📍 Carte'),lab('Direction',sel(DIRS,c[4]??0,v=>{c[4]=+v;t()})))]},
 battle:(c,t)=>{const o=c[2]=c[2]||{},cl=()=>{if(!Object.keys(o).length)c[2]=undefined;trim(c);t()},bb=o.bb||['',''];
  return[lab('Groupe d’ennemis',sel(Object.entries(P.db.troops||{}).map(([k,v])=>[k,k+' — '+(v.e||[]).join(', ')]),c[1],v=>{c[1]=v;t()},'(choisir)')),
   h('div',{class:'row'},lab('',h('input',{type:'checkbox',checked:o.esc===false,onchange:e=>{if(e.target.checked)o.esc=false;else delete o.esc;cl()}}),' Fuite impossible'),lab('',h('input',{type:'checkbox',checked:!!o.boss,onchange:e=>{if(e.target.checked)o.boss=true;else delete o.boss;cl()}}),' Boss')),
   h('div',{class:'row'},lab('Décor 1',selI('Battlebacks1/',bb[0],v=>{bb[0]=v;o.bb=bb;if(!bb[0]&&!bb[1])delete o.bb;cl()},'(par défaut)')),lab('Décor 2',selI('Battlebacks2/',bb[1],v=>{bb[1]=v;o.bb=bb;if(!bb[0]&&!bb[1])delete o.bb;cl()},'(par défaut)')))]},
 shop:(c,t)=>{const a=c[1]=c[1]||[],box=h('div',{class:'list'}),draw=()=>fillBox(box,...a.map((x,i)=>h('div',{class:'row'},sel(dbOpts('items'),x,v=>{a[i]=v;t()}),XB(()=>{a.splice(i,1);t();draw()}))),h('button',{onclick:()=>{a.push(dbOpts('items')[0]?.[0]);t();draw()}},'＋ Objet en vente'));draw();return[box]},
 bgm:(c,t)=>[selA('Audio/BGM/',c[1],v=>{c[1]=v;t()},'(choisir)')],me:(c,t)=>[selA('Audio/ME/',c[1],v=>{c[1]=v;t()},'(choisir)')],se:(c,t)=>[selA('Audio/SE/',c[1],v=>{c[1]=v;t()},'(choisir)')],
 wait:(c,t)=>[lab('Millisecondes',num(c[1],v=>{c[1]=v;t()}))],fade:(c,t)=>[sel([[1,'Vers le noir'],[0,'Retour à l’image']],c[1],v=>{c[1]=+v;t()})],shake:(c,t)=>[lab('Force',num(c[1],v=>{c[1]=v;t()}))],
 weather:(c,t)=>[sel([['rain','Pluie'],['snow','Neige'],['leaves','Feuilles'],['','Aucune']],c[1]??'',v=>{c[1]=v;t()})]
};
function cmdList(list,t){
 const box=h('div',{}),R=()=>fillBox(box,...list.map((c,i)=>cmdRow(list,i,t,R)),sel(Object.entries(CMD),'',k=>{if(k){const n=structuredClone(CMD_DEF[k]||[k]);if(QCMD.includes(k))n[1]=Object.keys(P.db.quests||{})[0]||'';list.push(n);t();R()}},'＋ Ajouter une commande…'));
 R();return box;
}
function cmdRow(list,i,t,R){
 const c=list[i],mv=n=>{const j=i+n;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];t();R()};
 const tools=h('span',{class:'row'},h('button',{onclick:()=>mv(-1)},'↑'),h('button',{onclick:()=>mv(1)},'↓'),XB(()=>{list.splice(i,1);t();R()}));
 const body=BODY[c[0]]?BODY[c[0]](c,t):[h('textarea',{rows:2,value:JSON.stringify(c),oninput:e=>{try{list[i]=JSON.parse(e.target.value);e.target.classList.remove('bad');t()}catch{e.target.classList.add('bad')}}})];
 return h('div',{class:'cmd c-'+c[0]},h('div',{class:'row'},h('b',{},CMD[c[0]]||'? '+c[0]),tools),body);
}
/* Sprite d'une page d'événement : miniature + feuille + n° (même présentation que les personnages de la base de données) */
function spritePick(pg,t,again){
 const cv=h('canvas',{width:48,height:48,class:'pv'});let n=0;
 const dr=()=>{const g=cv.getContext('2d');g.clearRect(0,0,48,48);const a=pg.s;if(!a)return;const im=P.img('Graphics/Characters/'+a[0]);
  if(!im){if(n++<30)setTimeout(dr,300);return}
  const one=a[0].includes('$'),cw=im.naturalWidth/(one?3:12),ch=im.naturalHeight/(one?4:8),i=a[1]|0,ix=one?0:(i%4)*3,iy=one?0:(i>>2)*4,d=Math.max(0,DIRN.indexOf(pg.d||'down')),k=Math.min(1,48/ch,48/cw);
  g.imageSmoothingEnabled=false;g.drawImage(im,(ix+(pg.f??1))*cw,(iy+d)*ch,cw,ch,Math.round(24-cw*k/2),Math.round(48-ch*k),cw*k,ch*k)};
 const a=pg.s,w=h('span',{class:'row icob'},cv,sel(P.list('Graphics/Characters/'),a?a[0]:'',v=>{if(v)pg.s=[v,0];else delete pg.s;t();again()},'(aucun sprite : traversable)'),
  a&&!a[0].includes('$')&&sel([0,1,2,3,4,5,6,7].map(i=>[i,'Perso '+(i+1)]),a[1]|0,v=>{a[1]=+v;t();n=0;dr()}));
 w.redraw=()=>{n=0;dr()};dr();return w}
function openEvent(m,ev){
 const d=$('dlg');let pi=0;
 const R=()=>{
  const pg=ev.pages[pi],s=pg.s,t=()=>P.touch(),cf=pg.if||{};
  const pk=spritePick(pg,t,R);P.hook=pk.redraw;
  /* Position : « 15 » = une case ; « 15,17 » (ou 15.17 / 15;17) = PLAGE de 15 à 17 -> l'événement est copié sur chaque case de la plage */
 const pr=v=>{const n=String(v).split(/[,.;\s]+/).filter(Boolean).map(Number).filter(Number.isFinite).map(Math.round).slice(0,2);return n.length?[Math.min(...n),Math.max(...n)]:null};
 const ix=h('input',{class:'num',value:ev.x,title:'Une case, ou une plage : 15,17'}),iy=h('input',{class:'num',value:ev.y,title:'Une case, ou une plage : 3,7'});
 const apply=()=>{const X=pr(ix.value),Y=pr(iy.value);if(!X||!Y){ix.value=ev.x;iy.value=ev.y;return}
  const W=Array.from(m.ground[0]).length,Hh=m.ground.length,base=JSON.stringify(ev);let n=0,first=true;
  for(let x=X[0];x<=X[1];x++)for(let y=Y[0];y<=Y[1];y++){if(x<0||y<0||x>=W||y>=Hh)continue;
   if(first){ev.x=x;ev.y=y;first=false;continue}const c=JSON.parse(base);c.x=x;c.y=y;m.events.push(c);n++}
  ix.value=ev.x;iy.value=ev.y;t();if(n&&P.say)P.say(n+' copie(s) créée(s) sur la plage')};
 ix.onchange=iy.onchange=apply;
 d.replaceChildren(
   h('div',{class:'row top'},h('b',{},'Événement'),lab('x',ix),lab('y',iy),h('button',{onclick:()=>{m.events.splice(m.events.indexOf(ev),1);t();d.close()}},'🗑 Supprimer'),h('button',{class:'on',onclick:()=>d.close()},'✔ Fermer')),
   h('div',{class:'row'},ev.pages.map((_,i)=>h('button',{class:i===pi?'on':'',onclick:()=>{pi=i;R()}},'Page '+(i+1))),h('button',{onclick:()=>{ev.pages.push({c:[]});pi=ev.pages.length-1;t();R()}},'＋ Page'),ev.pages.length>1&&h('button',{onclick:()=>{ev.pages.splice(pi,1);pi=0;t();R()}},'− Page')),
   h('div',{class:'card'},h('div',{class:'row'},pk,
    s&&sel([[0,'Image fixe 1 (ex: coffre fermé)'],[1,'Image fixe 2'],[2,'Image fixe 3 (ex: coffre ouvert)']],pg.f??'',v=>{if(v==='')delete pg.f;else pg.f=+v;t();pk.redraw()},'Animation de marche normale'),
    sel([['action','Touche Interagir'],['touch','Contact'],['auto','Automatique']],pg.tr||'',v=>{if(v)pg.tr=v;else delete pg.tr;t()},'Déclencheur : défaut'),
    sel([['down','Bas'],['left','Gauche'],['right','Droite'],['up','Haut']],pg.d||'',v=>{if(v)pg.d=v;else delete pg.d;t();pk.redraw()},'Direction : défaut'),
    lab('',h('input',{type:'checkbox',checked:pg.wander,onchange:e=>{if(e.target.checked)pg.wander=1;else delete pg.wander;t()}}),' Se promène')),
    h('b',{},'Cette page est active si :'),condEd(cf,()=>{if(Object.keys(cf).length)pg.if=cf;else delete pg.if;t()})),
   h('h4',{},'Commandes'),cmdList(pg.c=pg.c||[],t));
  pk.redraw();
 };
 d.onclose=()=>{P.hook=null;draw()};R();d.showModal();
}

/* Fenêtre « choisir le point » : la carte de destination, un clic place le repère rouge */
function pickPoint(id,x,y,cb){const m=P.maps[id];if(!m)return;const w=Array.from(m.ground[0]).length,hh=m.ground.length;let px=Math.min(+x||0,w-1),py=Math.min(+y||0,hh-1);
 const cv=h('canvas',{width:w*TS,height:hh*TS}),g=cv.getContext('2d'),info=h('b',{});
 const rd=()=>{g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);for(const L of[m.ground,m.objects])L.forEach((r,j)=>[...r].forEach((c,i)=>tile(g,P.sys.legend[c],i*TS,j*TS)));
  (m.events||[]).forEach(ev=>{const p=ev.pages.find(p=>p.s);if(p)spr(g,p.s,p.f,ev.x*TS,ev.y*TS,ev.d)});
  g.strokeStyle='rgba(255,255,255,.15)';g.lineWidth=1;for(let i=0;i<=w;i++)g.strokeRect(i*TS+.5,0,0,hh*TS);for(let j=0;j<=hh;j++)g.strokeRect(0,j*TS+.5,w*TS,0);
  g.strokeStyle='#f33';g.lineWidth=3;g.strokeRect(px*TS+2,py*TS+2,TS-4,TS-4);info.textContent=m.name+' — x '+px+', y '+py};
 rd();setTimeout(rd,300);setTimeout(rd,1200);
 cv.onclick=e=>{const r=cv.getBoundingClientRect();px=Math.max(0,Math.min(w-1,Math.floor((e.clientX-r.left)*w/r.width)));py=Math.max(0,Math.min(hh-1,Math.floor((e.clientY-r.top)*hh/r.height)));rd()};
 const d=h('dialog',{class:'pp'},h('div',{class:'row'},info,h('button',{class:'on',onclick:()=>{cb(px,py);d.close();d.remove()}},'✔ Valider'),h('button',{onclick:()=>{d.close();d.remove()}},'✕ Annuler')),h('div',{style:'overflow:auto;max-width:92vw;max-height:78vh'},cv));
 document.body.append(d);d.showModal()}
