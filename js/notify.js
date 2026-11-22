/* Grande fenêtre (mini fenêtre centrée) pour le chargement et tous les messages importants. */
const Big=(()=>{
 const d=h('dialog',{id:'big'}),I=h('div',{class:'bi'}),T=h('div',{class:'bt'}),M=h('div',{class:'bm'}),B=h('div',{class:'bb'});
 d.append(I,T,M,B);document.body.append(d);
 let busy=false,res=null,val=false,tm=0;
 d.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 d.addEventListener('close',()=>{clearTimeout(tm);busy=false;if(res){const r=res;res=null;r(val)}});
 function show(title,text,o={}){
  clearTimeout(tm);busy=!!o.busy;d.className=o.cls||'';
  I.className='bi'+(o.busy?' spin':'');I.textContent=o.busy?'':(o.icon||'ℹ️');
  T.textContent=title;M.textContent=text||'';
  B.replaceChildren(...(o.buttons||[]).map(b=>h('button',{class:b.cls||'',onclick:()=>{b.fn&&b.fn();d.close()}},b.t)));
  if(!d.open)d.showModal();
 }
 const ok=[{t:'OK',cls:'on'}];
 /* le texte de l'état (P.say) s'affiche aussi en grand pendant un chargement */
 const say0=P.say;P.say=t=>{say0(t);if(busy&&d.open)M.textContent=t};
 /* alert() du navigateur -> grande fenêtre */
 window.alert=m=>show('Information',String(m),{icon:'⚠️',cls:'warn',buttons:ok});
 return{
  show,
  busy:(t,m)=>show(t,m,{busy:true}),
  done:(t,m,ms=2500)=>{show(t,m,{icon:'✅',cls:'good',buttons:ok});tm=setTimeout(()=>d.open&&d.close(),ms)},
  error:(t,m,buttons)=>show(t,m,{icon:'❌',cls:'err',buttons:buttons||ok}),
  ask:(t,m,y,n)=>new Promise(r=>{res=r;val=false;show(t,m,{icon:'❓',buttons:[{t:y,cls:'on',fn:()=>{val=true}},{t:n}]})}),
  hide:()=>{busy=false;d.open&&d.close()}
 };
})();
