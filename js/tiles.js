/* Réparation de la découpe des tuiles : feuilles SF_* et World_C (tuiles de 48 px) lues à tort en cases de 32 px.
   Les entrées de la légende créées avec l'ancienne découpe sont converties une fois (marqueur sys.tiles48). */
async function pngWidth(path){
 const e=P.files.get(P.root+path);if(!e)return 0;
 try{const b=await(await Zip.read(e)).slice(0,24).arrayBuffer();return new DataView(b).getUint32(16)}catch{return 0}
}
async function tilesFix(){
 if(!P.sys||P.sys.tiles48)return;
 const W={};for(const n of P.sys.sheets)W[n]=await pngWidth('Graphics/Tilesets/'+n+'.png');
 let n48=0;
 for(const t of Object.values(P.sys.legend)){
  const w=W[P.sys.sheets[t[0]]];if(!w)continue;
  const cols=sheetCols(w),ts=w/cols;if(ts===32)continue;
  const oc=w/32,cx=(t[1]%oc+.5)*32,cy=((t[1]/oc|0)+.5)*32; // centre de l'ancienne case de 32 px -> tuile de 48 px qui la contient
  t[1]=(cy/ts|0)*cols+(cx/ts|0);n48++;
 }
 P.sys.tiles48=1;if(n48)P.touch();
}
