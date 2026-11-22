/* Base de données : formulaires (menus déroulants + ＋) pour acteurs, objets, compétences, ennemis, groupes, quêtes, système. */
const DBS={f:'actors',k:null},PFX={actors:'hero',items:'objet',skills:'sort',enemies:'monstre',troops:'groupe',quests:'quete'};
const dbo=()=>DBS.f==='system'?null:P.db[DBS.f];
function dbList(){
 const L=$('dbl'),o=dbo();L.replaceChildren();
 if(!o){dbShow('*');return}
 for(const k of Object.keys(o))L.append(h('button',{class:k===DBS.k?'on':'',onclick:()=>dbShow(k)},k+(o[k].n?' — '+o[k].n:'')));
 if(!o[DBS.k])DBS.k=null;DBS.k?dbShow(DBS.k):$('dbt').replaceChildren(h('p',{},'Choisissez une entrée ou cliquez sur ＋ Nouveau.'));
}
function dbShow(k){
 DBS.k=k;const o=dbo(),t=()=>P.touch();
 [...$('dbl').children].forEach(b=>b.classList.toggle('on',b.textContent.split(' — ')[0]===k));
 const body=k==='*'?obj(P.sys,['system'],t):DBS.f==='quests'?questForm(o[k],t):DBS.f==='items'?h('div',{},itemForm(o[k],k,t),obj(o[k],[DBS.f,k],t)):obj(o[k],[DBS.f,k],t);
 $('dbt').replaceChildren(h('h3',{},k==='*'?'Système du jeu':k),body);
}

/* ===== Objets : type (consommable / infini / …), utilisable en combat, script (événement) ===== */
const ITYPES=[['c','Consommable (détruit à l’usage)'],['u','Consommable infini (jamais détruit)'],['w','Arme'],['a','Armure'],['x','Accessoire'],['k','Objet clé']];
function itemForm(e,k,t){
 const use=e.t==='c'||e.t==='u',bt=e.bt==null?e.t==='c':!!e.bt,evBox=h('div',{});
 if(use){if(!Array.isArray(e.ev))e.ev=[];fillBox(evBox,cmdList(e.ev,t))}
 return h('div',{class:'card'},
  h('div',{class:'frow'},h('span',{class:'fl'},'Type'),sel(ITYPES,e.t,v=>{e.t=v;t();dbShow(k)})),
  use&&h('div',{class:'frow'},h('span',{class:'fl'},'Combat'),h('label',{},h('input',{type:'checkbox',checked:bt,onchange:ev=>{e.bt=ev.target.checked;t()}}),' Utilisable en combat'),
   h('small',{},e.t==='u'?'Infini : n’est jamais consommé, ni au menu ni en combat.':'Consommable : détruit à chaque usage.')),
  use&&h('div',{class:'frow'},h('span',{class:'fl'},'Script à l’utilisation'),h('div',{class:'list'},
   h('small',{},'Commandes d’événement exécutées quand l’objet est utilisé (après l’effet PV / PM). En combat, les commandes de téléportation, combat, boutique, menus et fin du jeu sont ignorées.'),evBox)));
}

/* ===== Quêtes : nom, description, interrupteurs facultatifs, étapes ===== */
function questForm(e,t){
 e.steps=Array.isArray(e.steps)?e.steps:[];
 const root=h('div',{class:'obj'}),stBox=h('div',{class:'list'});
 const swPick=(key,none)=>sel(swList(),e[key]||'',v=>{if(v)e[key]=v;else delete e[key];t()},none);
 const drawSteps=()=>fillBox(stBox,...e.steps.map((s,i)=>{
  if(Array.isArray(s)){s={text:s[0],sw:s[1]};e.steps[i]=s}
  const mv=n=>{const j=i+n;if(j<0||j>=e.steps.length)return;[e.steps[i],e.steps[j]]=[e.steps[j],e.steps[i]];t();drawSteps()};
  return h('div',{class:'sub'},h('div',{class:'row'},h('b',{},(i+1)+'.'),h('input',{value:s.text||'',oninput:ev=>{s.text=ev.target.value;t()}}),h('button',{onclick:()=>mv(-1)},'↑'),h('button',{onclick:()=>mv(1)},'↓'),XB(()=>{e.steps.splice(i,1);t();drawSteps()})),
   h('div',{class:'row'},h('span',{},'Cochée quand l’interrupteur est actif'),sel(swList(),s.sw||'',v=>{if(v)s.sw=v;else delete s.sw;t()},'(aucun : cochée par la commande « Quête : mettre à jour »)')))}),
  h('button',{onclick:()=>{e.steps.push({text:'Nouvelle étape'});t();drawSteps()}},'＋ Étape'));
 root.append(
  h('div',{class:'frow'},h('span',{class:'fl'},'Nom'),h('input',{value:e.n||'',oninput:ev=>{e.n=ev.target.value;t()}})),
  h('div',{class:'frow'},h('span',{class:'fl'},'Description'),h('textarea',{rows:3,value:e.d||'',oninput:ev=>{e.d=ev.target.value;t()}})),
  h('div',{class:'frow'},h('span',{class:'fl'},'Visible quand l’interrupteur est actif'),swPick('start','(aucun : commence par la commande « Quête : commencer »)')),
  h('div',{class:'frow'},h('span',{class:'fl'},'Terminée quand l’interrupteur est actif'),swPick('done','(aucun : terminée par la commande « Quête : terminer »)')),
  h('div',{class:'frow'},h('span',{class:'fl'},'Étapes de la quête'),stBox),
  h('small',{},'Dans un événement (ou un objet) : commandes 📜 Quête : commencer / mettre à jour / terminer / retirer. Les interrupteurs restent facultatifs.'));
 drawSteps();return root;
}

function dbNew(dup){
 const o=dbo();if(!o)return;
 if(DBS.f==='quests'&&!dup){let n=1;while(o['quete'+n])n++;const id='quete'+n;o[id]={n:'Nouvelle quête',d:'',steps:[{text:'Première étape'}]};P.touch();DBS.k=id;dbList();return}
 const src=dup?o[DBS.k]:Object.values(o)[0];if(!src)return;
 let n=1;while(o[PFX[DBS.f]+n])n++;const id=PFX[DBS.f]+n,c=structuredClone(src);if('n' in c)c.n=dup?c.n+' (copie)':'Nouveau';
 if(!dup&&c.e)c.e=[dbOpts('enemies')[0]?.[0]];if(!dup&&DBS.f==='items'){delete c.ev;delete c.bt;delete c.go}
 o[id]=c;P.touch();DBS.k=id;dbList();
}
function buildData(){
 $('dbf').onchange=e=>{DBS.f=e.target.value;DBS.k=null;dbList()};
 $('dbb').append(h('button',{class:'on',onclick:()=>dbNew(0)},'＋ Nouveau'),h('button',{onclick:()=>DBS.k&&dbNew(1)},'⧉ Dupliquer'),
  h('button',{onclick:()=>{const o=dbo();if(o&&DBS.k&&confirm('Supprimer '+DBS.k+' ?')){delete o[DBS.k];P.touch();DBS.k=null;dbList()}}},'🗑 Supprimer'));
}
function refreshData(){
 const NM={system:'⚙ Système',actors:'🧑 Héros',items:'🎒 Objets',skills:'✨ Compétences',enemies:'👹 Ennemis',troops:'👥 Groupes d’ennemis',quests:'📜 Quêtes'};
 const s=$('dbf');s.replaceChildren(...['actors','items','skills','enemies','troops','quests','system'].filter(n=>n==='system'||n==='quests'||P.db[n]).map(n=>h('option',{value:n},NM[n])));if(!P.sys.end)P.sys.end={title:'FIN DE LA DÉMO',sub:'Merci d’avoir joué',c1:'#ffffff',c2:'#ffd966',s1:44,s2:24,y:190,dur:4500,bg:'',me:''};
 s.value=DBS.f='actors';DBS.k=null;dbList();
}
