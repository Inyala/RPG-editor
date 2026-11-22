/* Tester le jeu : le moteur tourne dans une iframe, ses fichiers viennent de l'archive en mémoire (avec vos modifications, sans rien exporter). */
const FSU={},MIME={png:'image/png',jpg:'image/jpeg',ogg:'audio/ogg',m4a:'audio/mp4',mp3:'audio/mpeg',wav:'audio/wav',ttf:'font/ttf',json:'application/json'};
window.__fs=async path=>{if(FSU[path])return FSU[path];const e=P.files.get(P.root+path);if(!e)return null;const b=await Zip.read(e);return FSU[path]=URL.createObjectURL(new Blob([b],{type:MIME[path.split('.').pop().toLowerCase()]||''}))};
window.__json=p=>{const m=p.match(/^(Data|Map)\/(\w+)\.json$/);if(!m)return null;const[,d,n]=m;
 if(d==='Map')return P.maps[n]?JSON.stringify(P.maps[n]):null;
 if(n==='system')return JSON.stringify({...P.sys,...(P.testStart?{start:{...P.sys.start,...P.testStart}}:{})});
 return P.db[n]?JSON.stringify(P.db[n]):null};
function prelude(){ // s'exécute DANS l'iframe, avant le moteur : redirige fetch / images / sons vers l'éditeur
 const T=parent,rel=u=>{u=String(u);if(/^(blob|data):/.test(u))return null;try{return decodeURIComponent(new URL(u,document.baseURI).pathname).replace(/^\/+/,'')}catch{return null}};
 for(const C of[HTMLImageElement,HTMLMediaElement]){const d=Object.getOwnPropertyDescriptor(C.prototype,'src');Object.defineProperty(C.prototype,'src',{get(){return d.get.call(this)},set(v){const p=rel(v);if(p===null)return d.set.call(this,v);T.__fs(p).then(u=>d.set.call(this,u||v),()=>d.set.call(this,v))}})}
 window.Audio=function(u){const a=document.createElement('audio');if(u)a.src=u;return a};
 const F=window.fetch.bind(window);window.fetch=async(u,o)=>{const p=rel(u&&u.url||u);if(p===null)return F(u,o);const j=T.__json(p);if(j!=null)return new Response(j,{headers:{'Content-Type':'application/json'}});const b=await T.__fs(p);return b?F(b):new Response('',{status:404})};
}
async function playGame(here){
 const f=k=>P.files.get(P.root+k);if(!P.sys||!f('index.html'))return alert('Ouvrez un projet contenant index.html.');
 if(here&&!(M.id&&M.cx!=null))return alert('Touchez d’abord une case de la carte (ex. avec le crayon) pour choisir l’endroit de départ.');
 P.testStart=here?{map:M.id,x:M.cx,y:M.cy}:null;P.say('Préparation du test…');
 let html=await Zip.text(f('index.html')),css=f('Style/style.css')?await Zip.text(f('Style/style.css')):'';
 for(const m of[...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]){const p=decodeURIComponent(new URL(m[1],'http://g/Style/').pathname).slice(1),u=await __fs(p);if(u)css=css.split(m[0]).join('url('+u+')')}
 html=html.replace(/<link[^>]*style\.css[^>]*>/,()=>'<style>'+css+'</style>');
 for(const m of[...html.matchAll(/<script src="([^"]+)"><\/script>/g)]){const e=f(m[1]);if(e){const code=(await Zip.text(e)).replace(/<\/script/gi,'<\\/script');html=html.replace(m[0],()=>'<script>'+code+'<\/script>')}}
 html=html.replace(/<head>/i,()=>'<head><base href="http://game.local/"><script>('+prelude+')()<\/script>');
 const d=$('play'),fr=h('iframe',{allow:'autoplay; gamepad; fullscreen'});fr.srcdoc=html;fr.onload=()=>fr.contentWindow.focus();
 d.onclose=()=>d.replaceChildren();d.replaceChildren(h('button',{class:'xplay',onclick:()=>d.close()},'✕ Fermer le test'),fr);d.showModal();P.say('Test en cours');
}
