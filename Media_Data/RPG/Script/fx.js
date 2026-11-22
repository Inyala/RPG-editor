'use strict';
/* ===== fx.js — effets : météo (rain/snow/leaves), obscurité, secousse, flash (plein écran, quelle que soit la taille) ===== */
const FX={shake:0,flash:0},SC={x:W/2,y:H/2},CAM={x:0,y:0};let PT=[],WEA="";
const newP=r=>({x:Math.random()*VW,y:r?Math.random()*VH:-12,v:WEA=="rain"?9+Math.random()*4:WEA=="snow"?1+Math.random()*1.5:1+Math.random()*1.3,s:Math.random()*6.28});
function initWeather(){WEA=M.weather||"";PT=[];if(WEA)for(let i=0;i<(WEA=="rain"?110:45)*Math.max(1,VW*VH/(W*H)*.7);i++)PT.push(newP(true))}
function drawFX(){
 if(M&&scene=="map"&&CFG.fx){
  if(WEA){const want=Math.round((WEA=="rain"?110:45)*Math.max(1,VW*VH/(W*H)*.7));while(PT.length<want)PT.push(newP(true));
   for(const p of PT){p.y+=p.v;p.s+=.05;if(WEA=="leaves")p.x+=Math.sin(p.s)*1.2+.6;if(WEA=="rain")p.x-=1.5;
    if(p.y>VH||p.x>VW+10||p.x<-10){Object.assign(p,newP(false))}
    if(WEA=="rain"){g.strokeStyle="rgba(180,200,255,.5)";g.lineWidth=1;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+2,p.y-12);g.stroke()}
    else if(WEA=="snow"){g.fillStyle="rgba(255,255,255,.85)";g.beginPath();g.arc(p.x,p.y,2,0,7);g.fill()}
    else{g.fillStyle="rgba(120,170,70,.8)";g.fillRect(p.x,p.y,5,3)}}
   if(WEA=="rain"){g.fillStyle="rgba(20,30,60,.18)";g.fillRect(0,0,VW,VH)}}
  if(M.dark){const k=Math.max(VW/W,VH/H),gr=g.createRadialGradient(SC.x,SC.y,40*k,SC.x,SC.y,270*k);gr.addColorStop(0,"rgba(0,0,12,0)");gr.addColorStop(1,"rgba(0,0,15,.85)");g.fillStyle=gr;g.fillRect(0,0,VW,VH)}}
 if(FX.flash>0){g.fillStyle="rgba(255,255,255,"+FX.flash/20+")";g.fillRect(0,0,VW,VH);FX.flash--}}
