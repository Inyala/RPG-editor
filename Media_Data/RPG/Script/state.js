'use strict';
/* ===== state.js — état de la partie, statistiques, niveaux ===== */
/* ---------- État du jeu ---------- */
let SYS={},DB={},MAPS={},S=null,scene="loading",busy=false,M=null,P=null,evs=[],G0=[],G1=[],fadeA=0,popup=null,B=null,encSteps=0,endT=0,TOAST=null;
const toast=s=>TOAST={s,t:160};
const nm=c=>c.n,cum=l=>Math.floor(22*(l-1)**2),addItem=(id,n=1)=>{S.inv[id]=(S.inv[id]||0)+n;if(S.inv[id]<=0)delete S.inv[id]};
function st(c,k){if(!c.eq)return k=="hp"?c.mhp:c[k];const d=DB.actors[c.id];let v=d.b[k]+d.g[k]*(c.lv-1);for(const s in c.eq){const it=DB.items[c.eq[s]];if(it&&it.b&&it.b[k])v+=it.b[k]}return v}
function mkActor(id,lv=1){const d=DB.actors[id],a={id,n:d.n,lv,exp:cum(lv),eq:{...d.eq},psn:0};a.hp=st(a,"hp");a.mp=st(a,"mp");return a}
const skillsOf=a=>Object.entries(DB.actors[a.id].sk).filter(e=>e[0]<=a.lv).map(e=>e[1]);
function newState(){const s=SYS.start;S={sw:{},gold:SYS.gold,inv:{...SYS.items},party:SYS.party.map(i=>mkActor(i)),map:s.map,x:s.x,y:s.y,dir:s.dir,time:0}}
function fadeTo(a,ms=300){return new Promise(r=>{const s=fadeA,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms);fadeA=s+(a-s)*k;k<1?requestAnimationFrame(f):r()})(t0)})}
async function act(fn){busy=true;try{await fn()}catch(e){if(e!=="abort")console.error(e)}finally{busy=false}}

