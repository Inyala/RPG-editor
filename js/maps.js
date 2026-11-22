/* Éditeur de cartes : dessin (crayon, remplissage, gomme), événements, départ, propriétés, palette. Souris + tactile. */
const TS=32,M={id:null,tool:'pen',layer:'objects',ch:'g',undo:[],z:1};
const cur=()=>P.maps[M.id];
/* découpe d'une feuille : 8 colonnes si largeur ≤ 384, sinon 16 (256→32 px, 384→48 px, 512→32 px, 768→48 px) ; dessinée en 32 px */
const sheetCols=w=>w<=384?8:16;
function tile(g,t,x,y){if(!t)return;const im=P.img('Graphics/Tilesets/'+P.sys.sheets[t[0]]);if(!im)return;const c=sheetCols(im.naturalWidth),s=im.naturalWidth/c;g.drawImage(im,(t[1]%c)*s,(t[1]/c|0)*s,s,s,x,y,TS,TS)}
/* sprite d'événement, exactement comme Script/map.js du jeu : ombre (sauf feuille « ! »), feuille « $ » = 1 personnage, direction de l'événement */
const DIRN=['down','left','right','up'];
function spr(g,s,f,x,y,dir){const im=P.img('Graphics/Characters/'+s[0]);if(!im)return;const one=s[0].includes('$'),cw=im.naturalWidth/(one?3:12),ch=im.naturalHeight/(one?4:8),ix=one?0:((s[1]|0)%4)*3,iy=one?0:((s[1]|0)>>2)*4,d=Math.max(0,DIRN.indexOf(dir||'down'));
 if(s[0][0]!=='!'){const rx=one?18:11;g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x+16,y+29,rx,rx*.36,0,0,7);g.fill()}
 g.drawImage(im,(ix+(f??1))*cw,(iy+d)*ch,cw,ch,Math.round(x+16-cw/2),Math.round(y+32-ch),cw,ch)}
function draw(){
 const m=cur(),cv=$('cv'),g=cv.getContext('2d');if(!m){cv.width=cv.height=1;return}
 const w=m.ground[0].length,hh=m.ground.length;cv.width=w*TS;cv.height=hh*TS;cv.style.width=w*TS*M.z+'px';cv.style.height=hh*TS*M.z+'px';
 g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);
 for(const L of[m.ground,m.objects])L.forEach((row,y)=>[...row].forEach((c,x)=>tile(g,P.sys.legend[c],x*TS,y*TS)));
 g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=1;g.beginPath();
 for(let x=0;x<=w;x++){g.moveTo(x*TS+.5,0);g.lineTo(x*TS+.5,hh*TS)}for(let y=0;y<=hh;y++){g.moveTo(0,y*TS+.5);g.lineTo(w*TS,y*TS+.5)}g.stroke();
 const evPage=ev=>{const base=ev.pages.filter(p=>!p.if||!Object.keys(p.if).length);return base.length?base[base.length-1]:null}; // page affichée au début de la partie (aucune condition remplie)
 (m.events||[]).forEach((ev,i)=>{const x=ev.x*TS,y=ev.y*TS,p=M.pv===false?ev.pages.find(p=>p.s):evPage(ev),vis=p&&p.s;
  if(vis)spr(g,p.s,p.f,x,y,ev.d);
  if(M.pv===false||!vis){g.fillStyle='rgba(60,140,255,.25)';g.fillRect(x+1,y+1,TS-2,TS-2);g.strokeStyle='#4af';g.lineWidth=2;g.strokeRect(x+1,y+1,TS-2,TS-2);g.fillStyle='#fff';g.font='10px sans-serif';g.fillText(i+1,x+3,y+11);}
  else{g.fillStyle='rgba(20,60,160,.85)';g.fillRect(x,y,12,10);g.fillStyle='#fff';g.font='9px sans-serif';g.fillText(i+1,x+2,y+8);}});
 const s=P.sys.start;if(s.map===M.id){g.fillStyle='#fd3';g.font='bold 20px sans-serif';g.fillText('★',s.x*TS+8,s.y*TS+24)}
 if(M.rs){const[a,b]=M.rs,[c,d]=M.re||M.rs;g.strokeStyle='#ff0';g.lineWidth=2;g.strokeRect(Math.min(a,c)*TS+1,Math.min(b,d)*TS+1,(Math.abs(a-c)+1)*TS-2,(Math.abs(b-d)+1)*TS-2)}
}
const RO=()=>{if(!document.body.classList.contains('ro'))return false;P.say&&P.say('🔒 Lecture seule : cliquez sur le cadenas pour modifier');return true};
/* ================= Palette : liste des RÉCENTS =================
   Chaque récent = {s:feuille, w, h, cells:[{x,y,n}], b:0/1 (bloquant), d:dégâts par pas}. Gardés dans le navigateur (localStorage), indépendants du projet.
   Trois sortes, avec une icône chacune : 🔹 simple (1 tuile), 🧩 groupe (2 à 6 tuiles), 🏰 grand (7 tuiles et plus). */
const REC_KEY='rpged_recent',REC_MAX=80;
const recKind=r=>r.cells.length<2?'s':r.cells.length<7?'g':'b';
const KIND={s:['🔹','Simple'],g:['🧩','Groupe'],b:['🏰','Grand']};
const recSig=r=>r.s+'|'+(r.b?1:0)+'|'+(r.d|0)+'|'+r.cells.map(c=>c.x+','+c.y+','+c.n).join(';');
function recSave(){try{localStorage.setItem(REC_KEY,JSON.stringify(M.rec))}catch{}}
function recLoad(){let a=null;try{a=JSON.parse(localStorage.getItem(REC_KEY)||'null')}catch{}return Array.isArray(a)?a.filter(r=>r&&r.s&&Array.isArray(r.cells)&&r.cells.length):null}
function recAdd(r){M.rec=M.rec||[];const sg=recSig(r),i=M.rec.findIndex(x=>recSig(x)===sg);if(i>=0)M.rec.splice(i,1);M.rec.unshift(r);if(M.rec.length>REC_MAX)M.rec.length=REC_MAX;recSave();return r}
/* tuiles déjà posées sur la carte courante (les plus utilisées d'abord) -> récents « simples » */
function recFromMap(max=40){const m=cur(),n={};if(!m)return 0;
 for(const L of[m.ground,m.objects])for(const row of L)for(const c of row)if(c!=='.'&&P.sys.legend[c])n[c]=(n[c]||0)+1;
 const ks=Object.keys(n).sort((a,b)=>n[b]-n[a]).slice(0,max).reverse();let k=0;
 for(const c of ks){const t=P.sys.legend[c],s=P.sys.sheets[t[0]];if(!s)continue;recAdd({s,w:1,h:1,cells:[{x:0,y:0,n:t[1]}],b:t[2]?1:0,d:t[3]|0});k++}return k}
function recInit(){M.rec=recLoad();if(!M.rec){M.rec=[];recFromMap(24)}M.rid=null}
/* clé de légende (caractère) d'une tuile avec le bon réglage bloquant / dégâts. Une entrée existante n'est JAMAIS modifiée (les cartes déjà dessinées gardent leur comportement). */
function legKey(sheet,n,b,d){
 const Lg=P.sys.legend;let si=P.sys.sheets.indexOf(sheet);if(si<0)si=P.sys.sheets.push(sheet)-1;d=d|0;
 let k=Object.keys(Lg).find(k=>Lg[k][0]===si&&Lg[k][1]===n&&!!Lg[k][2]===!!b&&(Lg[k][3]|0)===d);
 if(!k){let cp=0x3a0;while(Lg[String.fromCharCode(cp)])cp++;k=String.fromCharCode(cp);Lg[k]=d?[si,n,b?1:0,d]:b?[si,n,1]:[si,n]}
 return k}
/* dessine un récent dans un canvas carré (cases réduites pour tenir) ; badge = icône de la sorte */
function drawRec(cv,r,badge){const z=cv.width,g=cv.getContext('2d');g.clearRect(0,0,z,z);g.fillStyle='#000';g.fillRect(0,0,z,z);
 const im=P.img('Graphics/Tilesets/'+r.s);
 if(im){const cols=sheetCols(im.naturalWidth),sz=im.naturalWidth/cols,cs=Math.max(3,Math.floor((z-4)/Math.max(r.w,r.h))),ox=Math.floor((z-cs*r.w)/2),oy=Math.floor((z-cs*r.h)/2);g.imageSmoothingEnabled=false;
  for(const c of r.cells)g.drawImage(im,(c.n%cols)*sz,(c.n/cols|0)*sz,sz,sz,ox+c.x*cs,oy+c.y*cs,cs,cs)}
 if(r.b){g.strokeStyle='#f33';g.lineWidth=3;g.strokeRect(1.5,1.5,z-3,z-3)}
 if(badge){g.font=(z>60?'20px':'12px')+' sans-serif';g.textBaseline='bottom';g.fillStyle='rgba(0,0,0,.65)';g.fillRect(z-(z>60?26:15),z-(z>60?26:15),z>60?26:15,z>60?26:15);g.fillStyle='#fff';g.fillText(KIND[recKind(r)][0],z-(z>60?24:14),z-1);
  if(r.d){g.font='bold 11px sans-serif';g.textBaseline='top';g.fillStyle='#fa0';g.fillText('☠'+r.d,2,2)}}}
const recInfo=r=>KIND[recKind(r)][1]+' '+r.w+'×'+r.h+' — '+(r.b?'bloquant':'traversable')+(r.d?' — ☠ '+r.d+' dégâts/pas':'');
/* utiliser un récent comme pinceau (le remonte en tête de liste) */
function recUse(r){
 const n0=Object.keys(P.sys.legend).length+P.sys.sheets.length,keys=r.cells.map(c=>legKey(r.s,c.n,r.b,r.d));
 if(r.cells.length===1){M.stamp=null;M.ch=keys[0]}else{M.stamp={w:r.w,h:r.h,cells:r.cells.map((c,i)=>[c.x,c.y,keys[i]])};M.ch=keys[0]}
 M.rid=recSig(r);if(M.rec[0]!==r){M.rec=M.rec.filter(x=>x!==r);M.rec.unshift(r)}recSave();
 if(Object.keys(P.sys.legend).length+P.sys.sheets.length!==n0)P.touch()}
/* MENU de la sélection : solidité (traversable / bloquant), dégâts, puis ✔ Valider */
function recProps(r,ok,cancel){
 let b=r.b?1:0,dm=r.d|0;const d=h('dialog',{class:'pp free'}),close=()=>{d.close();d.remove()};
 const pv=h('canvas',{width:96,height:96,class:'pv'}),dr=()=>drawRec(pv,{...r,b,d:dm},true);
 const bP=h('button',{onclick:()=>{b=0;upd()}},'🟩 Traversable'),bB=h('button',{onclick:()=>{b=1;upd()}},'🟥 Bloquant');
 const amt=h('input',{type:'number',min:1,step:1,class:'num',value:dm||5,oninput:e=>{dm=Math.max(1,Math.round(+e.target.value)||1);upd()}});
 const chk=h('input',{type:'checkbox',checked:dm>0,onchange:e=>{dm=e.target.checked?Math.max(1,Math.round(+amt.value)||5):0;upd()}});
 const upd=()=>{bP.classList.toggle('on',!b);bB.classList.toggle('on',!!b);amt.disabled=!dm;dr()};
 d.append(h('div',{class:'row'},h('b',{},'Propriétés de la sélection')),
  h('div',{class:'row'},pv,h('div',{},h('div',{},KIND[recKind(r)][0]+' '+KIND[recKind(r)][1]+' — '+r.w+'×'+r.h+' ('+r.cells.length+' tuile'+(r.cells.length>1?'s':'')+')'),h('small',{},r.s))),
  h('div',{class:'row'},h('span',{},'Solidité'),bP,bB),
  h('div',{class:'row'},h('label',{},chk,' ☠ Fait des dégâts à chaque pas : '),amt,h('span',{},'PV')),
  h('div',{class:'row'},h('button',{class:'on',onclick:()=>{r.b=b;r.d=dm;close();ok(r)}},'✔ Valider'),h('button',{onclick:()=>{close();cancel&&cancel()}},'Annuler')));
 document.body.append(d);d.showModal();upd();setTimeout(dr,300)}
/* Choisir des tuiles : toucher une tuile, ou glisser un rectangle -> le menu de solidité s'ouvre */
function tilePicker(){
 const d=$('dlg'),sheets=P.list('Graphics/Tilesets/','.png');let sn=M.ps&&sheets.includes(M.ps)?M.ps:(P.sys.sheets[0]||sheets[0]),a=null,b=null,dn=false;
 const cv=h('canvas'),geo=()=>{const c=sheetCols(cv.width);return{c,s:cv.width/c}};
 const show=()=>{const im=P.img('Graphics/Tilesets/'+sn);if(!im){cv.width=cv.height=1;return}cv.width=im.naturalWidth;cv.height=im.naturalHeight;const g=cv.getContext('2d'),{c,s}=geo();g.drawImage(im,0,0);g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;g.beginPath();for(let k=1;k<c;k++){g.moveTo(k*s+.5,0);g.lineTo(k*s+.5,cv.height)}for(let k=1;k<cv.height/s;k++){g.moveTo(0,k*s+.5);g.lineTo(cv.width,k*s+.5)}g.stroke();
  if(a){const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);g.strokeStyle='#fd3';g.lineWidth=3;g.strokeRect(x0*s+1,y0*s+1,(x1-x0+1)*s-2,(y1-y0+1)*s-2)}};
 const cell=e=>{const r=cv.getBoundingClientRect(),{c,s}=geo();return[Math.max(0,Math.min(c-1,Math.floor((e.clientX-r.left)*cv.width/r.width/s))),Math.max(0,Math.min(Math.ceil(cv.height/s)-1,Math.floor((e.clientY-r.top)*cv.height/r.height/s)))]};
 /* tuiles entièrement transparentes ignorées (évite de poser des cases vides bloquantes) */
 const filled=(x,y)=>{const im=P.img('Graphics/Tilesets/'+sn);if(!im)return true;const{c,s}=geo(),t=document.createElement('canvas');t.width=t.height=Math.round(s);
  try{const g=t.getContext('2d');g.drawImage(im,x*s,y*s,s,s,0,0,t.width,t.height);const px=g.getImageData(0,0,t.width,t.height).data;for(let i=3;i<px.length;i+=4)if(px[i]>8)return true;return false}catch{return true}};
 const finish=()=>{if(!a)return;const{c}=geo(),x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);let cells=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if((x0===x1&&y0===y1)||filled(x,y))cells.push({x,y,n:y*c+x});
  a=b=null;show();if(!cells.length)return P.say('Sélection vide (tuiles transparentes)');
  const mx=Math.min(...cells.map(q=>q.x)),my=Math.min(...cells.map(q=>q.y));cells=cells.map(q=>({x:q.x-mx,y:q.y-my,n:q.n}));
  const r={s:sn,w:Math.max(...cells.map(q=>q.x))+1,h:Math.max(...cells.map(q=>q.y))+1,cells,b:M.lb?1:0,d:0};
  recProps(r,v=>{M.lb=v.b;recUse(recAdd(v));d.close();pal();draw()})};
 cv.style.touchAction='none';cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);dn=true;a=b=cell(e);show()};cv.onpointermove=e=>{if(dn){b=cell(e);show()}};cv.onpointerup=()=>{if(!dn)return;dn=false;finish()};
 d.onclose=()=>{P.hook=null};P.hook=show;
 d.replaceChildren(h('h3',{},'Choisir des tuiles'),h('div',{class:'row'},sel(sheets,sn,v=>{sn=v;M.ps=v;a=b=null;show()}),h('button',{onclick:()=>d.close()},'Fermer')),
  h('small',{},'Touchez une tuile (simple) ou glissez un rectangle (groupe / grand) : un menu s’ouvre pour régler la solidité et les dégâts, puis ✔ Valider.'),h('div',{class:'sheet'},cv));
 show();d.showModal()}
function pal(){
 const box=$('pal'),fl=M.rf||'all',L=(M.rec||[]).filter(r=>fl==='all'||recKind(r)===fl),cr=(M.rec||[]).find(r=>recSig(r)===M.rid);
 const grid=h('div',{class:'rcgrid'});
 const none=h('button',{class:M.ch==='.'&&!M.stamp?'on':'',title:'Vide : efface (calque objets)',onclick:()=>{M.ch='.';M.stamp=null;M.rid=null;pal()}},h('span',{class:'vd'},'vide'));grid.append(none);
 for(const r of L){const cv=h('canvas',{width:40,height:40});drawRec(cv,r,true);grid.append(h('button',{class:recSig(r)===M.rid?'on':'',title:recInfo(r),onclick:()=>{recUse(r);pal();draw()}},cv))}
 fillBox(box,h('div',{class:'row'},h('b',{},'🕘 Récents ('+(M.rec||[]).length+')'),h('button',{class:'on',title:'Choisir des tuiles dans une planche',onclick:tilePicker},'＋ Tuiles…'),h('button',{title:'Ajouter les tuiles déjà utilisées sur cette carte',onclick:()=>{const n=recFromMap();P.say(n+' tuile(s) de la carte ajoutée(s) aux récents');pal()}},'🗺 De la carte')),
  h('div',{class:'row'},...[['all','Tous'],['s','🔹 Simples'],['g','🧩 Groupes'],['b','🏰 Grands']].map(([k,l])=>h('button',{class:fl===k?'on':'',onclick:()=>{M.rf=k;pal()}},l))),
  cr&&h('div',{class:'row'},h('small',{},recInfo(cr)),h('button',{title:'Régler la solidité et les dégâts',onclick:()=>{if(RO())return;recProps({...cr,cells:cr.cells},v=>{const sg=recSig(cr),i=M.rec.findIndex(x=>recSig(x)===sg);if(i>=0)M.rec.splice(i,1);recUse(recAdd(v));pal();draw()})}},'⚙ Solidité / dégâts'),h('button',{class:'x',title:'Retirer des récents',onclick:()=>{M.rec=M.rec.filter(x=>x!==cr);M.rid=null;recSave();pal()}},'✕')),
  grid,!L.length&&h('small',{},'Aucun récent ici : cliquez sur « ＋ Tuiles… » pour choisir dans une planche.'))}
function evList(){const m=cur();if(!m)return;const d=$('dlg'),ev=m.events||[],ck=[];
 const lb=e=>{const r=/"say","([^"]*)","([^"]{0,40})/.exec(JSON.stringify(e.pages));return'('+e.x+','+e.y+') '+(r?(r[1]||'…')+' : '+r[2]:'(sans texte)')};
 const rows=ev.map((e,i)=>{const c=h('input',{type:'checkbox'});ck.push(c);return h('label',{class:'row'},c,(i+1)+'. '+lb(e))});
 const pick=()=>ev.filter((_,i)=>ck[i].checked);
 d.replaceChildren(h('div',{class:'row'},h('b',{},'Événements de la carte'),h('button',{onclick:()=>ck.forEach(c=>c.checked=true)},'Tout'),h('button',{onclick:()=>ck.forEach(c=>c.checked=false)},'Rien')),
  h('div',{style:'max-height:55vh;overflow:auto'},...rows),
  h('div',{class:'row'},h('button',{onclick:()=>{const s=pick();if(!s.length)return;P.evClip=JSON.parse(JSON.stringify(s));P.say&&P.say(s.length+' événement(s) copié(s)')}},'📋 Copier'),
   h('button',{onclick:()=>{if(RO())return;if(!P.evClip||!P.evClip.length)return P.say&&P.say('Rien à coller');const o=(prompt('Décalage x,y (0,0 = mêmes cases)','0,0')||'').split(/[,.;\s]+/).map(Number);snap();for(const e of P.evClip){const c=JSON.parse(JSON.stringify(e));c.x+=Math.round(o[0]||0);c.y+=Math.round(o[1]||0);(m.events=m.events||[]).push(c)}P.touch();draw();d.close()}},'📌 Coller'),
   h('button',{onclick:()=>{const s=pick();if(!s.length||RO())return;if(!confirm('Supprimer '+s.length+' événement(s) ?'))return;snap();m.events=ev.filter(e=>!s.includes(e));P.touch();draw();d.close()}},'🗑 Supprimer'),
   h('button',{onclick:()=>d.close()},'Fermer')));d.showModal()}
let raf=0;P.onimg=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{draw();pal()})};
const snap=()=>{M.redo=[];const m=cur();M.undo.push({g:[...m.ground],o:[...m.objects],e:JSON.stringify(m.events||[])});if(M.undo.length>60)M.undo.shift()};
const cap=m=>({g:[...m.ground],o:[...m.objects],e:JSON.stringify(m.events||[])});
const redo=()=>{const s=(M.redo||[]).pop(),m=cur();if(!s||!m)return;M.undo.push(cap(m));m.ground=s.g;m.objects=s.o;m.events=JSON.parse(s.e);P.touch();draw()};
const undo=()=>{const s=M.undo.pop(),m=cur();if(!s)return;(M.redo=M.redo||[]).push(cap(m));m.ground=s.g;m.objects=s.o;m.events=JSON.parse(s.e);P.touch();draw()};
function stamp(x,y){if(M.stamp){for(const[dx,dy,c]of M.stamp.cells)put(x+dx,y+dy,c);return}put(x,y,M.ch)}
function put(x,y,c,layer){const L=cur()[layer||M.layer];if(!L[y]||x<0||x>=L[y].length)return;L[y]=L[y].slice(0,x)+c+L[y].slice(x+1)}
function fill(x,y,c){const L=cur()[M.layer],w=L[0].length,t=L[y][x];if(t===c)return;const st=[[x,y]];while(st.length){const[a,b]=st.pop();if(a<0||b<0||a>=w||b>=L.length||L[b][a]!==t)continue;L[b]=L[b].slice(0,a)+c+L[b].slice(a+1);st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}}
function cellOf(e){const m=cur(),cv=$('cv'),r=cv.getBoundingClientRect(),cl=(v,n)=>Math.max(0,Math.min(n-1,v));M.cx=cl(Math.floor((e.clientX-r.left)*cv.width/r.width/TS),m.ground[0].length);M.cy=cl(Math.floor((e.clientY-r.top)*cv.height/r.height/TS),m.ground.length);return[M.cx,M.cy]}
function rect(){const[a,b]=M.rs,[c,d]=M.re,x0=Math.min(a,c),x1=Math.max(a,c),y0=Math.min(b,d),y1=Math.max(b,d);M.rs=M.re=null;if(!(M.layer==='ground'&&M.ch==='.'))for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(M.mode!=='edge'||x===x0||x===x1||y===y0||y===y1)put(x,y,M.ch);P.touch();draw()}
function border(){const m=cur();if(!m||(M.layer==='ground'&&M.ch==='.'))return;snap();const w=m.ground[0].length,hh=m.ground.length;for(let y=0;y<hh;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===hh-1)put(x,y,M.ch);P.touch();draw()}
function act(e,first){
 const m=cur();if(!m)return;const cv=$('cv'),r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*cv.width/r.width/TS),y=Math.floor((e.clientY-r.top)*cv.height/r.height/TS);
 if(x<0||y<0||y>=m.ground.length||x>=m.ground[0].length)return;const t=M.tool;
 if(t==='ev'){if(!first)return;m.events=m.events||[];let ev=m.events.find(v=>v.x===x&&v.y===y);if(!ev){snap();ev={x,y,pages:[{c:[]}]};m.events.push(ev);P.touch()}draw();openEvent(m,ev);return}
 if(t==='start'){if(first){P.sys.start={...P.sys.start,map:M.id,x,y};P.touch();draw()}return}
 if(first)snap();
 if(t==='fill'){if(first&&!(M.layer==='ground'&&M.ch==='.'))fill(x,y,M.ch)}
 else if(t==='erase')put(x,y,'.','objects');
 else if(t==='pen'&&!(M.layer==='ground'&&M.ch==='.'))stamp(x,y);
 P.touch();
}
function props(){
 const m=cur(),b=$('props');fillBox(b,);if(!m)return;
 const set=(k,v)=>{if(v===''||v==null||v===false)delete m[k];else m[k]=v;P.touch()},row=(l,el)=>h('label',{},l,el);
 const tr=Object.entries(P.db.troops||{}).map(([k,v])=>[k,k+' — '+(v.e||[]).join(', ')]),encBox=h('div',{});
 const encDraw=()=>{fillBox(encBox);if(!m.enc)return;const t=m.enc.t=m.enc.t||[];
  addKids(encBox,row('1 pas sur…',num(m.enc.r,v=>{m.enc.r=v;P.touch()})),t.map((g,i)=>h('div',{class:'row'},sel(tr,g,v=>{t[i]=v;P.touch()}),XB(()=>{t.splice(i,1);P.touch();encDraw()}))),h('button',{onclick:()=>{t.push(tr[0]?.[0]);P.touch();encDraw()}},'＋ Groupe ennemi'))};
 b.append(row('Nom',h('input',{value:m.name||'',onchange:e=>set('name',e.target.value)})),row('Musique',selA('Audio/BGM/',m.bgm||'',v=>set('bgm',v),'(aucune)')),row('Ambiance (BGS)',selA('Audio/BGS/',m.bgs||'',v=>set('bgs',v),'(aucune)')),
  row('Météo',sel([['rain','Pluie'],['snow','Neige'],['leaves','Feuilles']],m.weather||'',v=>set('weather',v),'(aucune)')),
  h('label',{},h('input',{type:'checkbox',style:'width:auto',checked:m.dark,onchange:e=>set('dark',e.target.checked?1:0)}),' Ambiance sombre'),
  h('label',{},h('input',{type:'checkbox',style:'width:auto',checked:!!m.enc,onchange:e=>{if(e.target.checked)m.enc={r:16,t:[]};else delete m.enc;P.touch();encDraw()}}),' Rencontres aléatoires'),encBox);encDraw();
}
function maplist(){
 const b=$('list');fillBox(b,h('div',{class:'row'},h('button',{onclick:newMap},'＋ Carte'),h('button',{onclick:()=>newMap(1)},'⧉ Dupliquer'),h('button',{onclick:delMap},'🗑')));
 for(const id of P.sys.maps)if(P.maps[id])b.append(h('button',{class:id===M.id?'on':'',onclick:()=>selMap(id)},(P.sys.start.map===id?'★ ':'')+id+' — '+(P.maps[id].name||'')));
}
function selMap(id){M.id=id;M.undo=[];if(!M.rec)recInit();maplist();props();draw();pal()}
function newMap(dup){
 const id=(prompt('Identifiant de la carte (lettres, chiffres, _)')||'').trim();if(!/^\w+$/.test(id)||P.maps[id])return id&&alert('Identifiant invalide ou déjà utilisé.');
 let m;if(dup===1&&cur())m=structuredClone(cur());else{
  const[w,hh]=(prompt('Taille largeur,hauteur','20,15')||'20,15').split(',').map(n=>Math.max(1,+n||15)),g=Object.keys(P.sys.legend)[0];
  m={name:id,bgm:'Town1',ground:Array(hh).fill(g.repeat(w)),objects:Array(hh).fill('.'.repeat(w)),events:[]}}
 P.maps[id]=m;P.sys.maps.push(id);P.touch();selMap(id);
}
function delMap(){if(!M.id||!confirm('Supprimer la carte '+M.id+' ?'))return;P.sys.maps=P.sys.maps.filter(i=>i!==M.id);delete P.maps[M.id];P.touch();selMap(P.sys.maps[0]);}
function resize(){
 const m=cur();if(!m)return;const[w,hh]=(prompt('Nouvelle taille largeur,hauteur',m.ground[0].length+','+m.ground.length)||'').split(',').map(n=>+n);if(!w||!hh)return;snap();
 const f=(L,pad)=>Array.from({length:hh},(_,y)=>(L[y]??pad.repeat(w)).slice(0,w).padEnd(w,pad));
 m.ground=f(m.ground,m.ground[0][0]);m.objects=f(m.objects,'.');m.events=(m.events||[]).filter(e=>e.x<w&&e.y<hh);P.touch();draw();
}
function buildMaps(){
 const bar=$('bar'),cv=$('cv'),tb=(t,l)=>h('button',{'data-tool':t,class:t===M.tool?'on':'',onclick:()=>{M.tool=t;cv.classList.toggle('nopan',t!=='pan');[...bar.querySelectorAll('[data-tool]')].forEach(b=>b.classList.toggle('on',b.dataset.tool===t))}},l);
 bar.append(tb('pen','✏️ Crayon'),tb('fill','🪣 Remplir'),tb('erase','🧽 Gomme'),tb('rect','▭ Rectangle'),h('select',{onchange:e=>{M.mode=e.target.value}},h('option',{value:'fill'},'Rectangle plein'),h('option',{value:'edge'},'Contour seul')),h('button',{onclick:border},'▢ Bordure de carte'),tb('ev','⭐ Événement'),tb('start','🚩 Départ'),tb('pan','✋ Déplacer'),
  h('select',{onchange:e=>{M.layer=e.target.value}},h('option',{value:'objects'},'Calque objets'),h('option',{value:'ground'},'Calque sol')),
  h('button',{onclick:evList,title:'Copier / coller / supprimer plusieurs événements'},'📋 Événements'),h('button',{onclick:()=>{M.z=Math.max(.25,M.z/1.5);draw()}},'−'),h('button',{onclick:()=>{M.z=Math.min(4,M.z*1.5);draw()}},'＋'),
  h('button',{class:'on',title:'Événements affichés comme dans le jeu (sans cadre)',onclick:e=>{M.pv=M.pv===false;e.target.classList.toggle('on',M.pv!==false);draw()}},'👁 Aperçu jeu'),h('button',{onclick:resize},'↔ Taille'));
 let down=false;
 cv.addEventListener('pointerdown',e=>{if(M.tool==='pan'||!cur())return;e.preventDefault();down=true;cv.setPointerCapture(e.pointerId);const c=cellOf(e);if(M.tool==='rect'){snap();M.rs=M.re=c;draw();return}act(e,true);draw()});
 cv.addEventListener('pointermove',e=>{if(!down)return;if(M.tool==='rect'&&M.rs){M.re=cellOf(e);draw()}else if(M.tool==='pen'||M.tool==='erase'){act(e,false);draw()}});
 cv.addEventListener('pointerup',()=>{down=false;if(M.rs)rect()});cv.addEventListener('pointercancel',()=>down=false);
 $('side').addEventListener('click',()=>{});
}
function refreshMaps(){M.ch=Object.keys(P.sys.legend)[0]||'.';M.stamp=null;maplist();selMap(P.maps[P.sys.start.map]?P.sys.start.map:P.sys.maps[0])}

{const u=document.getElementById('un'),r=document.getElementById('rd');if(u)u.onclick=undo;if(r)r.onclick=redo}
