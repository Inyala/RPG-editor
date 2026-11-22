/* État du projet : fichiers de l'archive, base de données, cartes. Import / export. */
const $=id=>document.getElementById(id);
const h=(t,a={},...k)=>{const e=document.createElement(t);let v0;for(const[n,v]of Object.entries(a)){if(n.startsWith('on'))e.addEventListener(n.slice(2),v);else if(n==='value')v0=v;else if(n==='checked')e.checked=!!v;else if(v!==false&&v!=null)e.setAttribute(n,v===true?'':v)}e.append(...k.flat(9).filter(c=>c!=null&&c!==false));if(v0!==undefined)e.value=v0;return e};
const P={name:'projet',root:'',files:new Map(),sys:null,maps:{},db:{},cache:{},dirty:false,hook:null,onimg:null};
P.say=t=>{$('st').textContent=t};
const fillBox=(b,...k)=>b.replaceChildren(...k.flat(9).filter(c=>c!=null&&c!==false&&c!==0));
const addKids=(b,...k)=>b.append(...k.flat(9).filter(c=>c!=null&&c!==false&&c!==0));
/* mémoire du navigateur : projet de base + brouillon des modifications (rouvert automatiquement) */
const IDB=(()=>{const o=()=>new Promise((ok,ko)=>{const q=indexedDB.open('rpged',1);q.onupgradeneeded=()=>q.result.createObjectStore('s');q.onsuccess=()=>ok(q.result);q.onerror=()=>ko(q.error)});
 return{get:async k=>{try{const d=await o();return await new Promise(r=>{const g=d.transaction('s').objectStore('s').get(k);g.onsuccess=()=>r(g.result);g.onerror=()=>r()})}catch{}},
 set:async(k,v)=>{try{const d=await o();await new Promise(r=>{const t=d.transaction('s','readwrite');t.objectStore('s').put(v,k);t.oncomplete=r;t.onerror=r})}catch{}}}})();
let dtm=0;
P.touch=()=>{P.dirty=true;P.say('Modifications non exportées (brouillon sauvegardé automatiquement)');clearTimeout(dtm);dtm=setTimeout(()=>IDB.set('draft',{key:P.key,sys:P.sys,db:P.db,maps:P.maps,sw:[...(P.extraSw||[])]}),1500)};
P.DB=['actors','items','skills','enemies','troops','quests'];
P.load=async(blob,fn)=>{
 const f=await Zip.open(blob),sk=[...f.keys()].find(k=>/(^|\/)Data\/system\.json$/.test(k));
 if(!sk)throw Error('Data/system.json introuvable : ce n’est pas un projet RPG-HTML.');
 P.root=sk.slice(0,-'Data/system.json'.length);f.delete('rpgproj.json');
 P.files=f;P.cache={};P.maps={};P.db={};P.dirty=false;
 const J=async k=>JSON.parse(await Zip.text(f.get(P.root+k)));
 P.sys=await J('Data/system.json');
 for(const n of P.DB)if(f.has(P.root+`Data/${n}.json`))P.db[n]=await J(`Data/${n}.json`);P.db.quests=P.db.quests||{};
 for(const id of P.sys.maps)if(f.has(P.root+`Map/${id}.json`))P.maps[id]=await J(`Map/${id}.json`);
 P.key=fn+':'+blob.size;P.name=fn.replace(/\.(zip|rpgproj)$/i,'');
};
/* liste des ressources d'un dossier, sans extension (ex: P.list('Audio/BGM/')) */
P.list=(pre,ext)=>{const p=P.root+pre;return[...new Set([...P.files.keys()].filter(k=>k.startsWith(p)&&!k.slice(p.length).includes('/')&&(!ext||k.endsWith(ext))).map(k=>k.slice(p.length).replace(/\.[^.]+$/,'')))].sort()};
/* image (null tant qu'elle n'est pas chargée ; P.onimg / P.hook sont appelés ensuite) */
P.img=p=>{
 let c=P.cache[p];if(c)return c.ok?c.im:null;
 const e=P.files.get(P.root+p+'.png'),im=new Image();c=P.cache[p]={im,ok:false};if(!e)return null;
 Zip.read(e).then(b=>{im.onload=()=>{c.ok=true;P.onimg&&P.onimg();P.hook&&P.hook()};im.src=URL.createObjectURL(b)});
 return null;
};
/* carte -> texte (une ligne par rangée, un événement par ligne : lisible et diff-able) */
P.ser=m=>{
 const o={...m},g=o.ground,ob=o.objects,ev=o.events||[];delete o.ground;delete o.objects;delete o.events;
 const L=a=>'[\n'+a.map(x=>'  '+JSON.stringify(x)).join(',\n')+'\n ]';
 return'{\n'+[...Object.entries(o).map(([k,v])=>' '+JSON.stringify(k)+':'+JSON.stringify(v)),' "ground":'+L(g),' "objects":'+L(ob),' "events":'+L(ev)].join(',\n')+'\n}\n';
};
/* kind : 'zip' (jeu jouable, même structure que l'original) ou 'proj' (idem + manifeste rpgproj.json) */
P.texts=()=>{
 const r=P.root,T={};
 T[r+'Data/system.json']=JSON.stringify(P.sys,null,1);
 for(const n in P.db)T[r+`Data/${n}.json`]=JSON.stringify(P.db[n],null,1);
 for(const id of P.sys.maps)if(P.maps[id])T[r+`Map/${id}.json`]=P.ser(P.maps[id]);
 if(P.files.has(r+'Script/data.js')){ // jeu jouable sans serveur : Data + Map embarqués dans un script
  const D={};for(const k in T)if(/^(Data|Map)\/\w+\.json$/.test(k.slice(r.length)))D[k.slice(r.length)]=JSON.parse(T[k]);
  T[r+'Script/data.js']='/* Généré automatiquement (éditeur / make_manifest.py) : données du jeu pour l\'ouverture sans serveur. Ne pas modifier. */\nwindow.RPG_DATA='+JSON.stringify(D)+';\n';
 }
 return T;
};
P.export=async kind=>{
 const r=P.root,T=P.texts(),out=[];
 for(const[k,e]of P.files){if(k.startsWith(r+'Map/')&&k.endsWith('.json')&&!(k in T))continue;out.push(k in T?{name:k,data:T[k]}:e)}
 for(const k in T)if(!P.files.has(k))out.push({name:k,data:T[k]});
 if(kind==='proj')out.unshift({name:'rpgproj.json',data:JSON.stringify({format:'RPGHTML-PROJECT',version:1,name:P.name,root:r,date:new Date().toISOString()})});
 return Zip.write(out);
};
