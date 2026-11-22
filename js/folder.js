/* Mode dossier : on ouvre le DOSSIER du projet (au lieu d'un .zip). Les ressources sont lues à la demande,
   et « Enregistrer » écrit directement dans le dossier (Data/ et Map/), sans zip. Chrome / Edge. */
const FSD=!!window.showDirectoryPicker;
P.dir=null;
Zip.dir=async dh=>{
 const out=new Map();let n=0;
 const walk=async(d,pre)=>{for await(const[nm,e]of d.entries()){
  if(e.kind==='directory'){if(nm!=='.git'&&nm!=='node_modules')await walk(e,pre+nm+'/')}
  else{out.set(pre+nm,{name:pre+nm,m:0,fh:e});if(++n%100===0)P.say('Lecture du dossier… '+n+' fichiers')}}};
 await walk(dh,'');return out;
};
{const L0=P.load;P.load=async(b,n)=>{await L0(b,n);P.dir=b&&b.kind==='directory'?b:null;if(P.dir)P.key='dir:'+b.name;if(b&&b.kind==='http')P.key='http:'+b.base}}
/* Projet par défaut : le DOSSIER du jeu servi par HTTP (ex. Media_Data/RPG/), fichier par fichier : aucun zip, aucune lecture partielle (Range).
   Liste des fichiers : Media_Data/manifest.json (généré par make_manifest.py). */
Zip.http=async(mdir,sub)=>{
 const enc=p=>p.split('/').map(encodeURIComponent).join('/'),ok=async u=>{try{const r=await fetch(u,{cache:'no-cache'});return r.ok?r:null}catch{return null}};
 let base,names=null;
 const mr=await ok(mdir+'manifest.json');
 if(mr){try{const m=await mr.json();base=mdir+(m.base||sub);names=m.files}catch{}}
 if(!names||!names.includes('Data/system.json'))return null;
 const files=new Map();for(const n of names)files.set(n,{name:n,m:0,url:base+enc(n)});
 return{kind:'http',base,files};
};
async function dirWrite(path,text,root=P.dir){
 const ps=path.split('/');let d=root;for(const p of ps.slice(0,-1))d=await d.getDirectoryHandle(p,{create:true});
 const w=await(await d.getFileHandle(ps[ps.length-1],{create:true})).createWritable();await w.write(text);await w.close();
}
async function saveDir(){
 if(await P.dir.queryPermission({mode:'readwrite'})!=='granted'&&await P.dir.requestPermission({mode:'readwrite'})!=='granted')throw Error('Autorisation d’écriture refusée pour le dossier.');
 const T=P.texts(),ks=Object.keys(T);let i=0;
 for(const k of ks){P.say('Enregistrement… '+(++i)+'/'+ks.length);await dirWrite(k,T[k])}
 return ks.length;
}

/* Extraire : écrit TOUT le projet ouvert (Data, Map, Script, Style, index.html, Graphics, Audio, Fonts…) dans un dossier de votre choix,
   avec vos modifications. Ensuite on peut travailler directement dans ce dossier. */
async function extractTo(){
 if(!P.sys)return alert('Ouvrez d’abord un projet.');
 if(!FSD)return alert('L’extraction vers un dossier demande Chrome ou Edge sur ordinateur.');
 let dh;try{dh=await showDirectoryPicker({id:'rpgextract',mode:'readwrite'})}catch(x){if(x.name!=='AbortError')Big.error('Dossier impossible',x.message);return}
 const T=P.texts(),r=P.root,all=[...new Set([...P.files.keys(),...Object.keys(T)])].filter(k=>k!=='rpgproj.json'&&!(k.startsWith(r+'Map/')&&k.endsWith('.json')&&!(k in T)));
 try{
  Big.busy('Extraction en cours','0 / '+all.length+' fichiers');let i=0;
  for(const k of all){await dirWrite(k,k in T?T[k]:await Zip.read(P.files.get(k)),dh);if(++i%10===0||i===all.length)P.say('Extraction… '+i+' / '+all.length+' fichiers')}
  P.say('Extraction terminée ✔');
  Big.show('Extraction terminée',i+' fichiers écrits dans « '+dh.name+' ».\nVoulez-vous travailler directement dans ce dossier ?',{icon:'✅',cls:'good',buttons:[
   {t:'📁 Travailler dans ce dossier',cls:'on',fn:()=>{IDB.set('handle',dh);IDB.set('base',null);openFile(dh)}},{t:'Fermer'}]});
 }catch(x){P.say('Erreur : '+x.message);Big.error('Extraction impossible',x.message)}
}
