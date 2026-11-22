/* Point d'entrée : onglets, ouverture / export, glisser-déposer. */
function dl(blob,name){const a=h('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove()}
const FSA=!!window.showOpenFilePicker; // sélecteur qui MÉMORISE le fichier (Chrome/Edge) : réouverture auto, même en double-clic sur index.html
async function openFile(f){
 if(!f)return;
 try{Big.busy('Chargement du projet','Lecture de '+f.name+'…');P.say('Chargement de '+f.name+'…');
  await P.load(f,f.name);IDB.set('base',f.size<8e7?{blob:f,name:f.name}:null);await draftApply(true);refreshMaps();refreshData();
  const m=f.name+' chargé — '+P.sys.maps.length+' cartes';P.say(m);Big.done('Projet chargé',m)}
 catch(x){P.say('Erreur : '+x.message);Big.error('Impossible d’ouvrir le projet',x.message)}
}
async function pickProject(){
 if(FSA){try{const[hd]=await showOpenFilePicker({types:[{description:'Projet RPG',accept:{'application/zip':['.zip','.rpgproj']}}]});IDB.set('handle',hd);return openFile(await hd.getFile())}catch(x){if(x.name==='AbortError')return}}
 $('file').click();
}
async function pickDir(){
 try{const dh=await showDirectoryPicker({id:'rpgproj',mode:'readwrite'});IDB.set('handle',dh);IDB.set('base',null);return openFile(dh)}
 catch(x){if(x.name!=='AbortError')Big.error('Dossier impossible',x.message)}
}
async function saveProject(){
 if(!P.sys)return alert('Ouvrez d’abord un projet.');
 if(!P.dir)return save('zip');
 try{Big.busy('Enregistrement','Écriture dans le dossier…');const n=await saveDir();P.dirty=false;IDB.set('draft',null);
  const m=n+' fichiers écrits dans le dossier « '+P.dir.name+' »';P.say('Enregistré ✔ '+m);Big.done('Enregistré',m)}
 catch(x){P.say('Erreur : '+x.message);Big.error('Enregistrement impossible',x.message)}
}
async function save(kind){
 if(!P.sys)return alert('Ouvrez d’abord un projet.');
 try{Big.busy('Export en cours','Création du fichier…');P.say('Export en cours…');const b=await P.export(kind),n=P.name+(kind==='proj'?'.rpgproj':'.zip');dl(b,n);P.dirty=false;IDB.set('draft',null);
  const m=n+' ('+(b.size/1048576).toFixed(1)+' Mo)';P.say('Exporté ✔ '+m);Big.done('Export terminé',m,4000)}
 catch(x){P.say('Erreur : '+x.message);Big.error('Export impossible',x.message)}
}
/* Ouverture automatique : d'abord le DOSSIER Media_Data/RPG/ (fichiers lus directement), sinon projet.rpgproj / RPG.rpgproj / RPG.zip placé à côté de index.html (via serveur),
   sinon le dernier projet ouvert (copie ≤ 80 Mo, ou fichier mémorisé par le sélecteur) + brouillon */
async function draftApply(ask){const d=await IDB.get('draft');if(d&&d.key===P.key&&(!ask||await Big.ask('Brouillon trouvé','Restaurer vos modifications non exportées de ce projet ?','Restaurer','Ignorer'))){P.sys=d.sys;P.db=d.db;P.maps=d.maps;(d.sw||[]).forEach(s=>P.extraSw.add(s));P.dirty=true}await tilesFix()}
async function adopt(b,name){Big.busy('Ouverture automatique','Lecture de '+name+'…');await P.load(b,name);await draftApply(false);refreshMaps();refreshData();
 const m=name+' ouvert automatiquement'+(P.dirty?' (brouillon restauré)':'')+' — '+P.sys.maps.length+' cartes';P.say(m);Big.done('Projet ouvert',m)}
const openBtn=[...(FSD?[{t:'📁 Ouvrir un dossier',cls:'on',fn:pickDir}]:[]),{t:'📂 Ouvrir un fichier',cls:FSD?'':'on',fn:pickProject}];
async function boot(){
 Big.busy('Ouverture automatique','Recherche du projet…');
 try{
  let hint=0;
  if(location.protocol!=='file:'){ // projet par défaut : le dossier Media_Data/RPG/ lu tel quel (pas de projet compilé)
   P.say('Recherche du dossier Media_Data…');const src=await Zip.http('Media_Data/','RPG/');if(src)return adopt(src,'RPG')}
  if(location.protocol!=='file:')for(const n of['projet.rpgproj','RPG.rpgproj','RPG.zip']){ // fetch est interdit en file:// (double-clic)
   P.say('Recherche de '+n+'…');const rb=await Zip.remote(n);if(rb)return adopt(rb,n);if(rb===false)hint=n}
  if(hint){P.say(hint+' trouvé, mais sans lecture partielle (Range)');return Big.error('Serveur incompatible',hint+' est trouvé, mais votre serveur ne gère pas les lectures partielles (Range). Utilisez « Ouvrir un projet », ou un autre serveur local.',openBtn)}
  const b=await IDB.get('base');if(b&&b.blob)return adopt(b.blob,b.name);
  const hd=await IDB.get('handle');
  if(hd){try{const dir=hd.kind==='directory',md={mode:dir?'readwrite':'read'},get=async()=>dir?hd:hd.getFile();
   if(await hd.queryPermission(md)==='granted'){const f=await get();return adopt(f,f.name)}
   Big.show('Rouvrir le dernier projet','Le navigateur demande votre accord pour '+(dir?'rouvrir le dossier « ':'relire « ')+hd.name+' ».',{icon:dir?'📁':'📂',buttons:[{t:(dir?'📁 Rouvrir ':'📂 Rouvrir ')+hd.name,cls:'on',fn:async()=>{try{if(await hd.requestPermission(md)==='granted')return openFile(await get())}catch{}pickProject()}},{t:'Autre projet…',fn:pickProject}]});return}
   catch{}}
  P.say('Aucun projet ouvert');
  Big.show('Aucun projet ouvert',location.protocol==='file:'?'Cliquez sur « Ouvrir un dossier » et choisissez le dossier Media_Data (ou votre dossier de jeu) : '+(FSA?'l’éditeur s’en souviendra et le rouvrira tout seul.':'avec ce navigateur il faudra le rouvrir à chaque fois (Chrome ou Edge le mémorisent). Pour l’ouverture automatique, hébergez le dossier avec un serveur local.'):'Le dossier Media_Data/RPG/ est introuvable à côté de index.html : vérifiez qu’il est bien servi, ou ouvrez un projet à la main.',{icon:'📂',buttons:openBtn})
 }catch(x){P.say('Ouverture auto impossible : '+x.message);Big.error('Ouverture automatique impossible',x.message,openBtn)}
}
buildMaps();buildData();boot();$('play1').onclick=()=>playGame(0);$('play2').onclick=()=>playGame(1);
$('imp').onclick=pickProject;$('opd').onclick=pickDir;$('ext').onclick=extractTo;$('sav').onclick=saveProject;
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject()}});
$('file').onchange=e=>{openFile(e.target.files[0]);e.target.value=''};
$('expz').onclick=()=>save('zip');$('expp').onclick=()=>save('proj');
document.querySelectorAll('#top nav button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#top nav button').forEach(x=>x.classList.toggle('on',x===b));
 $('maps').hidden=b.dataset.t!=='maps';$('db').hidden=b.dataset.t!=='db';if(b.dataset.t==='maps'&&P.sys)draw();
});
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();const it=e.dataTransfer.items&&e.dataTransfer.items[0];if(it&&it.getAsFileSystemHandle)it.getAsFileSystemHandle().then(hd=>hd&&hd.kind==='file'&&IDB.set('handle',hd),()=>{});openFile(e.dataTransfer.files[0])});
addEventListener('beforeunload',e=>{if(P.dirty){e.preventDefault();e.returnValue=''}});

{const g=id=>document.getElementById(id);
 g('exp').onclick=()=>{const d=g('dlg'),go=id=>()=>{d.close();g(id).click()};d.replaceChildren(h('div',{class:'row'},h('b',{},'Exporter le projet')),h('div',{class:'row'},h('button',{onclick:go('expz')},'📦 Archive .zip'),h('button',{onclick:go('expp')},'📁 Projet .rpgproj'),h('button',{onclick:go('ext')},'📤 Extraire en dossier')),h('div',{class:'row'},h('button',{onclick:()=>d.close()},'Annuler')));d.showModal()};
 const ro=on=>{document.body.classList.toggle('ro',on);g('rob').textContent=on?'🔒 Cartes : lecture seule':'🔓 Cartes : modifiables';g('rob').classList.toggle('on',!on)};
 g('rob').onclick=()=>ro(!document.body.classList.contains('ro'));ro(true)}

/* Menus : se referment après un clic, ou en touchant ailleurs ; toujours gardés DANS l'écran */
{document.querySelectorAll('.mn .dd button').forEach(b=>b.addEventListener('click',()=>{b.closest('details').open=false}));
 const fit=d=>{const m=d.querySelector('.dd');if(!m)return;m.style.left='0';m.style.right='auto';const r=m.getBoundingClientRect();if(r.right>innerWidth-4)m.style.left=Math.min(0,innerWidth-4-r.right)+'px'};
 document.querySelectorAll('.mn').forEach(d=>d.addEventListener('toggle',()=>{if(d.open){document.querySelectorAll('.mn').forEach(o=>{if(o!==d)o.open=false});fit(d)}}));
 addEventListener('pointerdown',e=>{document.querySelectorAll('.mn[open]').forEach(d=>{if(!d.contains(e.target))d.open=false})},true)}

/* Panneau (cartes / propriétés / palette) : bouton ☰ ; réinitialiser l'affichage */
{const g=id=>document.getElementById(id),side=()=>document.body.classList.toggle('noside');
 g('tgl').onclick=()=>{side();if(P.sys)draw()};
 g('rst').onclick=()=>{document.body.classList.remove('noside');scrollTo(0,0);document.querySelectorAll('.mn').forEach(d=>d.open=false);P.say('Affichage réinitialisé');if(P.sys)draw()};
 if(innerWidth<=760)document.body.classList.add('noside')}
/* Enregistrement automatique : toutes les 30 s, dans le dossier ouvert (Chrome / Edge) ; sans dossier, le brouillon du navigateur est déjà sauvegardé en continu */
{const g=id=>document.getElementById(id);let on=false,busy=false;try{on=localStorage.getItem('rpged_auto')==='1'}catch{}
 const lab=()=>{g('auto').textContent='💾 Enregistrement auto : '+(on?'oui':'non');g('auto').classList.toggle('on',on)};lab();
 g('auto').onclick=()=>{on=!on;try{localStorage.setItem('rpged_auto',on?'1':'0')}catch{}lab();P.say(on?(P.dir?'Enregistrement automatique activé (dossier « '+P.dir.name+' »)':'Enregistrement automatique activé : sans dossier ouvert, seul le brouillon du navigateur est mis à jour'):'Enregistrement automatique désactivé')};
 setInterval(async()=>{if(!on||busy||!P.sys||!P.dirty||!P.dir)return;busy=true;
  try{if(await P.dir.queryPermission({mode:'readwrite'})!=='granted')return;await saveDir();P.dirty=false;IDB.set('draft',null);const d=new Date();P.say('Enregistré automatiquement à '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'))}
  catch(x){P.say('Enregistrement auto impossible : '+x.message)}finally{busy=false}},30000)}
