/* Mini ZIP sans dépendance : lecture paresseuse + écriture (les fichiers non modifiés sont recopiés tels quels). */
const Zip=(()=>{
const T=new Uint32Array(256).map((_,n)=>{for(let k=0;k<8;k++)n=n&1?0xEDB88320^n>>>1:n>>>1;return n>>>0});
const crc=u=>{let c=-1;for(let i=0;i<u.length;i++)c=T[(c^u[i])&255]^c>>>8;return(c^-1)>>>0};
/* Source distante lue par morceaux (requêtes Range) : le gros fichier n'est jamais chargé en entier en mémoire. */
const part=async(s,a,b)=>s.remote?new Blob([await s.get(a,b)]):s.slice(a,b);
async function remote(url){
 const ac=new AbortController();let r;
 try{r=await fetch(url,{headers:{Range:'bytes=0-0'},cache:'no-store',signal:ac.signal})}catch{return null}
 const cr=r.headers.get('Content-Range'),st=r.status;ac.abort();
 if(st===200&&!/html/.test(r.headers.get('Content-Type')||''))return false; // le fichier existe mais le serveur ignore Range
 if(st!==206||!cr)return null;const size=+cr.split('/')[1];if(!size)return null;
 return{remote:true,size,url,get:async(a,b)=>{const q=await fetch(url,{headers:{Range:'bytes='+a+'-'+(b-1)},cache:'no-store'});if(q.status!==206)throw Error('Le serveur ne gère pas les lectures partielles (Range).');return q.arrayBuffer()}};
}
async function open(blob){
 if(blob&&blob.kind==='directory')return Zip.dir(blob);
 if(blob&&blob.kind==='http')return blob.files;
 const n=blob.size,tl=Math.min(n,65557),tv=new DataView(await(await part(blob,n-tl,n)).arrayBuffer());
 let i=tl-22;while(i>=0&&tv.getUint32(i,true)!==0x06054b50)i--;
 if(i<0)throw Error('Archive ZIP invalide');
 const cnt=tv.getUint16(i+10,true),sz=tv.getUint32(i+12,true),off=tv.getUint32(i+16,true);
 const cb=await(await part(blob,off,off+sz)).arrayBuffer(),v=new DataView(cb),u=new Uint8Array(cb),dec=new TextDecoder(),out=new Map();
 let p=0;
 for(let k=0;k<cnt&&v.getUint32(p,true)===0x02014b50;k++){
  const nl=v.getUint16(p+28,true),el=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),name=dec.decode(u.subarray(p+46,p+46+nl));
  if(!name.endsWith('/'))out.set(name,{name,m:v.getUint16(p+10,true),crc:v.getUint32(p+16,true),cs:v.getUint32(p+20,true),us:v.getUint32(p+24,true),lho:v.getUint32(p+42,true),src:blob});
  p+=46+nl+el+cl;
 }
 return out;
}
async function raw(e){const h=new DataView(await(await part(e.src,e.lho,e.lho+30)).arrayBuffer()),s=e.lho+30+h.getUint16(26,true)+h.getUint16(28,true);return part(e.src,s,s+e.cs)}
async function read(e){
 if(e.fh)return e.fh.getFile();
 if(e.url){const r=await fetch(e.url,{cache:'no-cache'});if(!r.ok)throw Error(e.name+' : HTTP '+r.status);return r.blob()}
 if(e.data!==undefined)return e.data instanceof Blob?e.data:new Blob([e.data]);
 const r=await raw(e);if(e.m===0)return r;
 return new Response(r.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
}
const text=async e=>(await read(e)).text();
async function write(list){
 const enc=new TextEncoder(),parts=[],cd=[],d=new Date();let off=0;
 const dt=((d.getFullYear()-1980)<<9|(d.getMonth()+1)<<5|d.getDate())&0xffff,tm=(d.getHours()<<11|d.getMinutes()<<5|d.getSeconds()>>1)&0xffff;
 for(const e of list){
  let m,c,cs,us,body;
  const D=e.fh?await e.fh.getFile():e.url?await read(e):e.data;
  if(D!==undefined){const u=D instanceof Blob?new Uint8Array(await D.arrayBuffer()):typeof D==='string'?enc.encode(D):D;m=0;c=crc(u);cs=us=u.length;body=new Blob([u])}
  else{m=e.m;c=e.crc;cs=e.cs;us=e.us;body=await raw(e)}
  const nb=enc.encode(e.name),h=new DataView(new ArrayBuffer(30)),g=new DataView(new ArrayBuffer(46));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(8,m,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,cs,true);h.setUint32(22,us,true);h.setUint16(26,nb.length,true);
  g.setUint32(0,0x02014b50,true);g.setUint16(4,20,true);g.setUint16(6,20,true);g.setUint16(8,0x800,true);g.setUint16(10,m,true);g.setUint16(12,tm,true);g.setUint16(14,dt,true);g.setUint32(16,c,true);g.setUint32(20,cs,true);g.setUint32(24,us,true);g.setUint16(28,nb.length,true);g.setUint32(42,off,true);
  parts.push(h.buffer,nb,body);cd.push(g.buffer,nb);off+=30+nb.length+cs;
 }
 const size=cd.reduce((a,b)=>a+(b.byteLength??b.length),0),end=new DataView(new ArrayBuffer(22));
 end.setUint32(0,0x06054b50,true);end.setUint16(8,list.length,true);end.setUint16(10,list.length,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
 return new Blob([...parts,...cd,end.buffer],{type:'application/zip'});
}
return{open,read,text,write,remote};
})();
