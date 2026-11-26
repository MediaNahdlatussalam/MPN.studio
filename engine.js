/* ===== Engine v2: template, scene, animasi, SFX ===== */
const FS='"Bricolage Grotesque",system-ui,sans-serif',FSERIF='"Instrument Serif","Playfair Display",Georgia,serif',FPLAY='"Playfair Display",Georgia,serif',MONO="600 16px ui-monospace,Menlo,Consolas,monospace";
const TH={
 neon:{glow:true,fx:"grid",n:"Neon Biru",bg:["#050f24","#0a2548"],ac:"#37e1ff",tx:"#fff",mu:"#9db8d6",card:"rgba(20,55,100,.6)",line:"rgba(55,225,255,.5)",ink:"#04121c",hd:"serifit",cap:["n","#37e1ff"]},
 lime:{fx:"top",n:"Terminal Lime",bg:["#080b04","#131c07"],ac:"#c6f432",tx:"#fff",mu:"#a9b58c",card:"rgba(28,36,12,.85)",line:"rgba(198,244,50,.4)",ink:"#0a1002",hd:"plain",cap:["l","#c6f432"]},
 emas:{fx:"gold",n:"Emas Elegan",bg:["#050403","#0d0a04"],ac:"#f2c14e",tx:"#fff6e0",mu:"#b79a5a",card:"rgba(40,30,8,.6)",line:"rgba(242,193,78,.45)",ink:"#1a1204",hd:"gold",cap:["g","#f2c14e"]},
 oranye:{fx:"hud",n:"Editorial Oranye",bg:["#0b0a09","#141110"],ac:"#ff5a1f",tx:"#f4efe8",mu:"#8c857c",card:"rgba(255,255,255,.05)",line:"rgba(255,255,255,.14)",ink:"#140a05",hd:"serifit",cap:["n","#ff5a1f"]},
 hijau:{fx:"pixel",n:"Hijau Bersih",bg:["#0a1f16","#123325"],ac:"#3ddc84",tx:"#f2fbf5",mu:"#8fb8a2",card:"rgba(10,30,22,.85)",line:"rgba(61,220,132,.4)",ink:"#03150b",hd:"under",cap:["l","#3ddc84"]},
 navy:{fx:"arch",n:"Navy Metafora",bg:["#070d24","#101a44"],ac:"#f0c36a",tx:"#f6ecd6",mu:"#9aa6d0",card:"rgba(20,30,70,.7)",line:"rgba(240,195,106,.45)",ink:"#0b1030",hd:"serif",cap:["y","#f0c36a"]}
};
["italic 40px \"Instrument Serif\"","800 40px \"Bricolage Grotesque\"","800 40px \"Playfair Display\""].forEach(f=>document.fonts&&document.fonts.load(f).catch(()=>{}));
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.min(r||0,w/2,h/2);this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath()};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),eo=t=>1-Math.pow(1-clamp(t),3);
const OFFC=Object.assign(document.createElement("canvas"),{width:540,height:960}),FIR=new Set();let EV=[],AU=null;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem("ms_"+k)||"";localStorage.setItem("ms_"+k,v)}catch(e){return""}};
const EXT=m=>/mp4/.test(m||"")?".mp4":".webm",recMime=()=>window.MediaRecorder?["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"].find(m=>MediaRecorder.isTypeSupported(m)):"";
const tfmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=s%60;return(h?h+":"+String(m).padStart(2,"0"):m)+":"+String(c).padStart(2,"0")};
/* audio graph + sfx */
function aud(){if(AU)return AU;const c=new (window.AudioContext||window.webkitAudioContext)(),dest=c.createMediaStreamDestination(),m=c.createGain();m.connect(c.destination);m.connect(dest);AU={c,dest,m,src:new Map()};c.resume&&c.resume();return AU}
function route(el){const A=aud();if(!A.src.has(el)){const s=A.c.createMediaElementSource(el);s.connect(A.m);A.src.set(el,s)}A.c.resume&&A.c.resume()}
function sfx(k){
 if(!AU)return;const c=AU.c,t=c.currentTime,g=c.createGain();g.connect(AU.m);
 if(k==="pop"){const o=c.createOscillator();o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(260,t+.09);g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);o.start(t);o.stop(t+.13)}
 else if(k==="ding"){g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.4);[880,1320].forEach((f,i)=>{const o=c.createOscillator();o.frequency.value=f;o.connect(g);o.start(t+i*.07);o.stop(t+.4)})}
 else{const n=c.createBuffer(1,Math.floor(c.sampleRate*.4),c.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const s=c.createBufferSource(),f=c.createBiquadFilter();s.buffer=n;f.type="bandpass";f.Q.value=1.2;f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(3000,t+.3);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.35,t+.12);g.gain.exponentialRampToValueAtTime(.001,t+.38);s.connect(f);f.connect(g);s.start(t)}
}
const once=(key,k)=>{if(!FIR.has(key)){FIR.add(key);sfx(k)}};
const hexOK=v=>/^#[0-9a-fA-F]{6}$/.test(String(v||""));
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return"rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"};
const lum=h=>{const n=parseInt(h.slice(1),16),c=[n>>16&255,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const FXS=["grid","top","gold","hud","pixel","arch","aurora","stars"],HDS=["serifit","plain","gold","serif","under"];
function makeTheme(o){
  o=o||{};const D=TH.neon,b0=hexOK(o.bg&&o.bg[0])?o.bg[0]:D.bg[0],b1=hexOK(o.bg&&o.bg[1])?o.bg[1]:D.bg[1],bl=(lum(b0)+lum(b1))/2,light=bl>.45;
  let ac=hexOK(o.ac)?o.ac:D.ac;if(Math.abs(lum(ac)-bl)<.12)ac=light?"#0f766e":"#38e1ff";
  let tx=hexOK(o.tx)?o.tx:(light?"#10151a":"#ffffff");if(light&&lum(tx)>.4)tx="#10151a";if(!light&&lum(tx)<.4)tx="#ffffff";
  const mu=hexOK(o.mu)?o.mu:(light?"#4b5563":"#a7b4c4"),hd=HDS.includes(o.hd)?o.hd:"serifit",fx=FXS.includes(o.fx)?o.fx:"aurora";
  const cap=light?["l",ac]:hd==="plain"||hd==="under"?["l",ac]:hd==="gold"?["g",ac]:hd==="serif"?["y",ac]:["n",ac];
  return{fx,n:"AI",bg:[b0,b1],ac,tx,mu,card:light?"rgba(255,255,255,.75)":hexA(ac,.14),line:hexA(ac,.5),ink:lum(ac)>.4?"#06121a":"#ffffff",hd,cap,glow:true,light}}
/* ikon */
const IC={bulan:"\u263E",target:"\u25CE",mahkota:"\u265B",hati:"\u2665",centang:"\u2713",bintang:"\u2726",tanya:"?",api:"\u2668",timbangan:"\u2696",orang:"\u263A",panah:"\u279C",petir:"\u03DF",buku:"\u2761",jam:"\u25D4",uang:"$",mata:"\u25C9",cahaya:"\u263C",silang:"\u2715",rumah:"\u2302"};
const gl=n=>IC[n]?IC[n]+"\uFE0E":(n||"");
/* latar */
function star(x,cx,cy,r,c){x.save();x.translate(cx,cy);x.fillStyle=c;x.shadowColor=c;x.shadowBlur=24;x.beginPath();x.moveTo(0,-r);x.quadraticCurveTo(0,0,r,0);x.quadraticCurveTo(0,0,0,r);x.quadraticCurveTo(0,0,-r,0);x.quadraticCurveTo(0,0,0,-r);x.fill();x.restore()}
function dust(x,t,n,col,H=960){for(let i=0;i<n;i++){const u=Math.sin(i*91.7)*43758.5,v=Math.sin(i*12.9)*14758.5;x.fillStyle=col;x.globalAlpha=(.3+.7*Math.abs(Math.sin(t*.8+i)))*.7;x.fillRect((u-Math.floor(u))*540,(v-Math.floor(v))*H,1.8,1.8)}x.globalAlpha=1}
function bok(x,t,n,col){for(let i=0;i<n;i++){const u=Math.sin(i*78.2)*9301.7,v=Math.sin(i*33.1)*4217.3,sp=(v-Math.floor(v))*.5+.15;x.fillStyle=col;x.globalAlpha=.18+.2*Math.sin(t+i);x.beginPath();x.arc((u-Math.floor(u))*540,960-((t*40*sp+i*97)%1000),4+(i%5)*5,0,7);x.fill()}x.globalAlpha=1}
function hud(x,k,I){
  if(!I)return;const th=TH[k];x.save();x.textBaseline="middle";
  if(th.fx==="hud"){x.font="500 11px ui-monospace,Menlo,monospace";x.fillStyle=th.mu;x.textAlign="left";x.fillText((I.brand||"MPN.STUDIO").toUpperCase().slice(0,24),24,28);x.textAlign="right";x.fillText(I.idx+(I.tag?" \u00B7 "+I.tag:""),516,28);
    x.fillStyle="rgba(128,128,128,.25)";x.fillRect(24,44,492,2);x.fillStyle=th.ac;x.fillRect(24,44,492*I.p,2);x.fillStyle=th.mu;x.textAlign="left";x.fillText(I.title||"",24,932);x.textAlign="right";x.fillText(I.tc||"",516,932)}
  else if(I.brand&&th.fx!=="top"){x.font="600 12px "+FS;const w=x.measureText(I.brand).width+30;x.strokeStyle=th.line;x.fillStyle="rgba(0,0,0,.25)";x.lineWidth=1.2;x.beginPath();x.roundRect(270-w/2,20,w,28,14);x.fill();x.stroke();x.fillStyle=th.tx;x.textAlign="center";x.fillText(I.brand,270,35)}
  x.restore();
}
function bg(x,k,t,p,I){
  const th=TH[k],gr=x.createLinearGradient(0,0,0,960);gr.addColorStop(0,th.bg[0]);gr.addColorStop(1,th.bg[1]);x.fillStyle=gr;x.fillRect(0,0,540,960);
  const ac=th.ac,rad=(cx,cy,r,c)=>{const g=x.createRadialGradient(cx,cy,10,cx,cy,r);g.addColorStop(0,c);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,540,960)},fx=th.fx;
  if(fx==="grid"){x.strokeStyle=hexA(ac,.07);x.lineWidth=1;x.beginPath();for(let i=0;i<=540;i+=36){x.moveTo(i,0);x.lineTo(i,960)}for(let i=0;i<=960;i+=36){x.moveTo(0,i);x.lineTo(540,i)}x.stroke();star(x,40+Math.sin(t)*6,40,60+Math.sin(t*2)*5,ac);star(x,500,900+Math.cos(t)*6,70,ac)}
  else if(fx==="top"){rad(270,-40,520,hexA(ac,.28));x.fillStyle=hexA(ac,.2);x.fillRect(20,46,500,3);x.save();x.fillStyle=ac;x.shadowColor=ac;x.shadowBlur=12;x.fillRect(20,46,500*clamp(p),3);x.restore()}
  else if(fx==="gold"){rad(270,420,430,hexA(ac,.2));dust(x,t,80,ac);x.strokeStyle=hexA(ac,.14);x.lineWidth=1.2;[150,200].forEach(r=>{x.beginPath();x.arc(270,330,r+Math.sin(t)*4,0,7);x.stroke()})}
  else if(fx==="hud"){rad(60,930,520,hexA(ac,.2));x.strokeStyle="rgba(128,128,128,.06)";x.beginPath();for(let i=0;i<=540;i+=45){x.moveTo(i,0);x.lineTo(i,960)}x.stroke()}
  else if(fx==="pixel"){for(let i=0;i<14;i++)for(let j=0;j<24;j++)if((i*7+j*13)%5===0){x.fillStyle=hexA(ac,.05);x.fillRect(i*40,j*40,40,40)}rad(270,960,500,hexA(ac,.15))}
  else if(fx==="arch"){dust(x,t,60,"#cfd8ff");x.strokeStyle=th.line;x.lineWidth=2;[[110,820,160],[124,820,146]].forEach(([l,b,r],i)=>{x.globalAlpha=i?.4:1;x.beginPath();x.moveTo(l,b);x.lineTo(l,350);x.arc(270,350,r,Math.PI,0);x.lineTo(540-l,b);x.stroke()});x.globalAlpha=1}
  else if(fx==="aurora"){[[.0,.30,.55],[1.7,.62,.45],[3.1,.18,.65]].forEach(([ph,fy,al],i)=>{const cx=270+200*Math.sin(t*.35+ph),cy=960*fy+120*Math.cos(t*.28+ph*1.3);const g=x.createRadialGradient(cx,cy,10,cx,cy,330);g.addColorStop(0,hexA(i%2?th.tx:ac,al*.35));g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,540,960)})}
  else if(fx==="stars"){dust(x,t,110,th.tx);star(x,60+Math.sin(t*.7)*8,120,34,ac);star(x,470,820+Math.cos(t*.6)*8,44,ac)}
  if(I)hud(x,k,I);
}
/* teks kaya: *kata* = aksen */
function rich(x,s,cx,y,size,k,a=1){
 const th=TH[k],hd=th.hd,parts=s.split("*");
 const f=i=>{const ac=i%2;if(hd==="serifit"&&ac)return`italic 400 ${size*1.15}px ${FSERIF}`;if(hd==="gold")return ac?`800 ${size*1.15}px ${FPLAY}`:`700 ${size*.62}px ${FS}`;if(hd==="serif")return`700 ${size}px ${FPLAY}`;return`800 ${size}px ${FS}`};
 const tx=(p,i)=>hd==="gold"&&i%2?p.toUpperCase():p,ws=parts.map((p,i)=>{x.font=f(i);return x.measureText(tx(p,i)).width}),tot=ws.reduce((a,b)=>a+b,0),sc=Math.min(1,480/Math.max(1,tot));
 x.save();x.globalAlpha=a;x.textAlign="left";x.textBaseline="middle";x.translate(cx-tot*sc/2,y);x.scale(sc,sc);let o=0;
 parts.forEach((p,i)=>{x.font=f(i);const ac=i%2;
  if(ac&&hd==="gold"){const g=x.createLinearGradient(0,-size/2,0,size/2);g.addColorStop(0,"#fff3c4");g.addColorStop(1,th.ac);x.fillStyle=g}else x.fillStyle=ac?th.ac:th.tx;
  x.shadowColor=th.ac;x.shadowBlur=ac?22:0;x.fillText(tx(p,i),o,0);
  if(ac&&hd==="under"){x.shadowBlur=0;x.fillStyle=th.ac;x.fillRect(o,size*.55,ws[i],4)}o+=ws[i]});x.restore();
}
function card(x,k,px,py,w,h,icon,title,sub,a=1,chk=null){
 const th=TH[k],s=h-30;x.save();x.globalAlpha=a;x.fillStyle=th.card;x.strokeStyle=th.line;x.lineWidth=1.5;x.shadowColor=th.ac;x.shadowBlur=th.glow?18:6;x.beginPath();x.roundRect(px,py,w,h,16);x.fill();x.shadowBlur=0;x.stroke();
 x.fillStyle=th.ac;x.beginPath();x.roundRect(px+15,py+15,s,s,12);x.fill();
 x.fillStyle=th.ink;x.font=`700 ${s*.5}px ${FS}`;x.textAlign="center";x.textBaseline="middle";x.fillText(gl(icon)||"\u2605",px+15+s/2,py+15+s/2+1);
 x.textAlign="left";x.fillStyle=th.tx;x.font=`800 ${h*.25}px ${FS}`;x.fillText(title||"",px+30+s,py+h*(sub?.38:.5),w-s-100);
 if(sub){x.fillStyle=th.mu;x.font=`500 ${h*.17}px ${FS}`;x.fillText(sub,px+30+s,py+h*.68,w-s-100)}
 if(chk!==null){const cx=px+w-34,cy=py+h/2;x.strokeStyle=th.ac;x.lineWidth=2;x.beginPath();x.arc(cx,cy,13,0,7);x.stroke();
  if(chk>0){x.fillStyle=th.ac;x.beginPath();x.arc(cx,cy,13*eo(chk*3),0,7);x.fill();x.strokeStyle=th.ink;x.lineWidth=3;x.beginPath();x.moveTo(cx-6,cy);x.lineTo(cx-1.5,cy+5);x.lineTo(cx+7,cy-5);x.stroke()}}
 x.restore();
}
function chat(x,msgs,y0,t,id){
 let y=y0;x.save();x.font=`500 20px ${FS}`;
 (msgs||[]).forEach((m,i)=>{const t0=.5+i*.9,a=eo((t-t0)/.3),L=wrap(x,m.t,330),h=L.length*26+22,bw=Math.min(362,Math.max(...L.map(l=>x.measureText(l).width))+32);
  if(a>0){if(t-t0<.3)once(id+"b"+i,"pop");x.save();x.globalAlpha=a;const bx=m.me?500-bw:40;x.translate(0,(1-a)*16);x.fillStyle=m.me?"#0a84ff":"#2c2c2e";x.beginPath();x.roundRect(bx,y,bw,h,20);x.fill();x.fillStyle="#fff";x.textAlign="left";x.textBaseline="middle";L.forEach((l,j)=>x.fillText(l,bx+16,y+24+j*26));x.restore()}
  y+=h+12});x.restore();return y;
}
function toks(s){let on=0;return String(s||"").split(/\s+/).filter(Boolean).map(w=>{const st=w[0]==="*",en=w.endsWith("*")&&w.length>1;if(st)on=1;const o={w:w.replace(/\*/g,""),ac:!!on};if(en||(st&&w.length>1&&w.endsWith("*")))on=0;return o})}
function kin(x,k,s,t,id){
 const th=TH[k],tk=toks(s.head),sp=20;x.save();x.font=`800 84px ${FS}`;const mw=Math.max(1,...tk.map(o=>x.measureText(o.w).width)),sz=Math.min(84,84*450/mw);x.textAlign="left";x.textBaseline="middle";
 const f=ac=>ac&&th.hd==="serifit"?`italic 400 ${sz*1.12}px ${FSERIF}`:`800 ${sz}px ${FS}`,ms=tk.map(o=>{x.font=f(o.ac);return x.measureText(o.w).width});
 const lines=[];let cur=[],w=0;tk.forEach((o,i)=>{if(w+ms[i]>470&&cur.length){lines.push(cur);cur=[];w=0}cur.push(i);w+=ms[i]+sp});if(cur.length)lines.push(cur);
 const lh=sz*1.15,y0=470-lines.length*lh/2+lh/2;
 lines.forEach((L,li)=>{const tot=L.reduce((a,i)=>a+ms[i]+sp,-sp);let px=270-tot/2;
  L.forEach(i=>{const o=tk[i],u=eo((t-i*.32)/.25);if(u>0){if(t-i*.32<.25)once(id+"k"+i,"pop");x.save();x.globalAlpha=u;x.translate(px+ms[i]/2,y0+li*lh);x.scale(.6+.4*u+(1-u)*0,.6+.4*u);x.rotate((i%2?1:-1)*(1-u)*.12);x.translate(-ms[i]/2,0);
    x.font=f(o.ac);x.fillStyle=o.ac?th.ac:th.tx;x.shadowColor=th.ac;x.shadowBlur=o.ac?26:0;x.fillText(o.w,0,0);x.restore()}px+=ms[i]+sp})});
 x.restore();
}
function mascot(x,cx,cy,s,emo,t){
 x.save();x.translate(cx,cy+Math.sin(t*3)*s*.025);x.rotate(Math.sin(t*1.7)*.04);
 x.shadowColor="rgba(255,255,255,.7)";x.shadowBlur=s*.25;x.fillStyle="#fff";x.beginPath();x.roundRect(-s*.5,-s,s,s*.62,s*.26);x.fill();x.shadowBlur=0;
 x.fillStyle="#ececec";x.beginPath();x.roundRect(-s*.26,-s*.42,s*.52,s*.34,s*.12);x.fill();
 x.fillStyle="#2bb7b0";x.beginPath();x.roundRect(-s*.34,-s*.46,s*.68,s*.12,s*.06);x.fill();x.beginPath();x.moveTo(s*.2,-s*.36);x.quadraticCurveTo(s*.46+Math.sin(t*5)*s*.05,-s*.28,s*.38,-s*.06);x.lineTo(s*.26,-s*.12);x.fill();
 x.fillStyle="#d4d4d4";x.fillRect(-s*.2,-s*.08,s*.14,s*.08);x.fillRect(s*.06,-s*.08,s*.14,s*.08);
 const ey=-s*.7,ex=s*.17,op={kaget:1.5,sedih:.85}[emo]||1,A={sedih:-1,marah:1,senang:-.3,kaget:-.4}[emo]||0;
 x.fillStyle="#1d1d27";[-1,1].forEach(d=>{x.beginPath();x.ellipse(d*ex,ey,s*.05,s*.065*op,0,0,7);x.fill()});
 x.strokeStyle="#1d1d27";x.lineWidth=s*.03;x.lineCap="round";
 [-1,1].forEach(d=>{const inner=d*ex-d*s*.07,outer=d*ex+d*s*.07,by=ey-s*.13;x.beginPath();x.moveTo(inner,by+A*s*.05);x.lineTo(outer,by-A*s*.05);x.stroke()});
 x.beginPath();if(emo==="senang")x.arc(0,ey+s*.12,s*.08,.1*Math.PI,.9*Math.PI);else if(emo==="sedih"||emo==="marah")x.arc(0,ey+s*.27,s*.07,1.15*Math.PI,1.85*Math.PI);else if(emo==="kaget")x.ellipse(0,ey+s*.2,s*.035,s*.05,0,0,7);else{x.moveTo(-s*.05,ey+s*.2);x.lineTo(s*.05,ey+s*.2)}x.stroke();
 x.restore();
}
function bdrop(x,b,t){
 const g=(a,c)=>{const r=x.createLinearGradient(0,0,0,960);r.addColorStop(0,a);r.addColorStop(1,c);x.fillStyle=r;x.fillRect(0,0,540,960)};
 if(b==="malam"){g("#060b2a","#1b2a5c");dust(x,t,90,"#fff",600);x.fillStyle="#f4f0d0";x.beginPath();x.arc(410,170,38,0,7);x.fill();x.fillStyle="#0b1230";x.beginPath();x.moveTo(0,960);x.lineTo(0,760);x.quadraticCurveTo(160,680,300,760);x.quadraticCurveTo(420,700,540,740);x.lineTo(540,960);x.fill()}
 else if(b==="hutan"){g("#0f3d2a","#06170f");bok(x,t,22,"#d8ff7a");x.fillStyle="#04100a";for(let i=0;i<9;i++){const bx=i*70-10;x.beginPath();x.moveTo(bx,780);x.lineTo(bx+40,520+(i%3)*50);x.lineTo(bx+80,780);x.fill()}x.fillRect(0,780,540,180)}
 else if(b==="laut"){g("#0b3b5e","#031a2e");bok(x,t,14,"#9fe8ff");for(let L=0;L<3;L++){x.beginPath();x.moveTo(0,960);for(let i=0;i<=540;i+=6)x.lineTo(i,740+L*40+10*Math.sin(i*.03+t*2+L));x.lineTo(540,960);x.fillStyle=["rgba(30,120,170,.7)","rgba(20,90,140,.8)","rgba(8,50,90,.9)"][L];x.fill()}x.fillStyle="#0a0f14";x.fillRect(0,740,230,40)}
 else{g("#1a1140","#7a2a1a");bok(x,t,18,"#ffb36b");
  for(let L=0;L<3;L++){x.beginPath();x.moveTo(0,960);for(let i=0;i<=540;i+=6)x.lineTo(i,650+L*30-(22+L*6)*Math.sin(i*.045+t*3+L)-12*Math.sin(i*.11-t*4+L*2));x.lineTo(540,960);x.fillStyle=["#c2331a","#ff7a1a","#ffd34d"][L];x.fill()}
  x.fillStyle="#fffbe0";x.fillRect(0,830,540,130);x.fillStyle="#1a0d10";x.beginPath();x.moveTo(0,740);x.lineTo(250,740);x.lineTo(210,960);x.lineTo(0,960);x.fill()}
}
function char(x,s,t,I){
 bdrop(x,s.bg,t);const big=s.big,sz=big?330:140,cx=big?270:150+(s.walk?clamp(t/2.5)*130:0),cy=big?800:(s.bg==="api"?740:760);
 if(s.rays){x.save();x.globalCompositeOperation="lighter";for(let i=0;i<9;i++){const an=-Math.PI/2+(i-4)*.22+Math.sin(t+i)*.03,g=x.createRadialGradient(cx+60,cy-sz*.6,5,cx+60,cy-sz*.6,800);g.addColorStop(0,"rgba(255,230,160,.35)");g.addColorStop(1,"rgba(255,200,100,0)");x.fillStyle=g;x.beginPath();x.moveTo(cx+60,cy-sz*.6);x.lineTo(cx+60+Math.cos(an-.05)*900,cy-sz*.6+Math.sin(an-.05)*900);x.lineTo(cx+60+Math.cos(an+.05)*900,cy-sz*.6+Math.sin(an+.05)*900);x.fill()}x.restore()}
 mascot(x,cx,cy,sz*(.85+.15*eo(t/.6)),s.emo,t);
 if(I&&I.brand){x.save();x.font=`700 13px ${FS}`;const w=x.measureText(I.brand.toUpperCase()).width+34;x.fillStyle="rgba(20,12,20,.6)";x.strokeStyle="rgba(255,170,80,.7)";x.beginPath();x.roundRect(270-w/2,28,w,28,14);x.fill();x.stroke();x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(I.brand.toUpperCase(),270,43);x.restore()}
}
function scene(x,k,s,t,p,id,I){
 if(s.kind==="ep"){episodeScene(x,s,t,I||{d:6},id);return}
 if(s.kind==="serial"){serialScene(x,s,t,(I&&I.d)||11.5,id);return}
 const th=TH[k],kd=s.kind,a=eo(t/.5);
 if(kd==="char"){char(x,s,t,I);return}
 bg(x,k,t,p,I?Object.assign({p},I):null);x.textBaseline="middle";
 if(kd==="kin"){kin(x,k,s,t,id);return}
 if(s.tag){x.font=`800 13px ${FS}`;const w=x.measureText(s.tag).width+26;x.fillStyle=th.ac;x.beginPath();x.roundRect(30,88,w,28,6);x.fill();x.fillStyle=th.ink;x.textAlign="left";x.fillText(s.tag,43,102)}
 const hy=kd==="title"?(s.sub?430:470):(s.tag?190:150);
 if(s.icon&&kd==="title"){x.save();x.globalAlpha=a;x.font=`400 96px ${FPLAY}`;x.fillStyle=th.ac;x.shadowColor=th.ac;x.shadowBlur=28;x.textAlign="center";x.fillText(gl(s.icon),270,hy-150);x.restore()}
 if(s.small){x.save();x.globalAlpha=a;x.fillStyle=th.mu;x.font=`500 24px ${FS}`;x.textAlign="center";x.fillText(s.small,270,hy-62+(1-a)*14,480);x.restore()}
 rich(x,s.head||"",270,hy+(1-a)*18,kd==="title"?64:42,k,a);
 if(s.sub){x.save();x.globalAlpha=eo((t-.25)/.5);x.fillStyle=th.hd==="plain"||th.hd==="under"?th.ac:th.mu;x.font=`700 24px ${FS}`;x.textAlign="center";x.fillText(s.sub,270,kd==="stat"?600:hy+(kd==="title"?60:46),480);x.restore()}
 if(kd==="list")(s.items||[]).forEach((it,i)=>{const t0=.6+i*.55,aa=eo((t-t0)/.4);if(aa<=0)return;if(t-t0<.5)once(id+"i"+i,"pop");if(t-t0>.5&&t-t0<1)once(id+"c"+i,"ding");card(x,k,36,260+i*104+(1-aa)*24,468,88,it.i,it.t,it.s,aa,t-t0-.5)});
 if(kd==="terminal"){const wy=300;x.save();x.fillStyle="rgba(0,0,0,.45)";x.strokeStyle=th.line;x.lineWidth=1.5;x.beginPath();x.roundRect(40,wy,460,330,14);x.fill();x.stroke();
  ["#ff5f57","#febc2e","#28c840"].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(62+i*18,wy+22,5,0,7);x.fill()});
  x.fillStyle=th.mu;x.font=`600 12px ${FS}`;x.textAlign="center";x.fillText(s.win||"terminal",270,wy+23);
  x.font=MONO;x.textAlign="left";let n=Math.floor(Math.max(0,t-.6)*34),y=wy+66;
  for(const L of (s.lines||[])){if(n<=0)break;x.fillStyle=/^\s*[\u2713\u2714]/.test(L)?th.ac:th.tx;x.fillText(L.slice(0,n),62,y,420);n-=L.length+6;y+=32}x.restore()}
 if(kd==="stat"){const v=String(s.value||""),m=v.match(/^(\D*)([\d.,]+)(.*)$/);let sh=v;
  if(m){const raw=m[2],dec=raw.includes(",")?raw.split(",")[1].length:0,n=parseFloat(raw.replace(/\./g,"").replace(",","."));if(isFinite(n))sh=m[1]+(n*eo(t/1.4)).toLocaleString("id-ID",{minimumFractionDigits:dec,maximumFractionDigits:dec})+m[3]}
  x.save();x.globalAlpha=eo((t-.2)/.5);x.fillStyle=th.ac;x.shadowColor=th.ac;x.shadowBlur=th.fx==="hud"?0:22;x.font=`800 ${sh.length>7?96:130}px ${FS}`;x.textAlign="center";x.fillText(sh,270,400,480);x.restore();
  if(s.bar!=null){x.save();x.fillStyle="rgba(255,255,255,.1)";x.beginPath();x.roundRect(60,500,420,14,7);x.fill();x.fillStyle=th.ac;x.beginPath();x.roundRect(60,500,420*s.bar*eo((t-.3)/1.2),14,7);x.fill();x.restore()}}
 if(kd==="steps"){const it=s.items||[];let act=-1;it.forEach((e,i)=>{if(t>=.5+i*.6)act=i});
  it.forEach((e,i)=>{const t0=.5+i*.6,aa=eo((t-t0)/.4);if(aa<=0)return;if(t-t0<.4)once(id+"s"+i,"pop");const y=300+i*92+(1-aa)*20,on=i===act;x.save();x.globalAlpha=aa;
   if(i<it.length-1&&t>=.5+(i+1)*.6){x.strokeStyle=th.line;x.lineWidth=2;x.beginPath();x.moveTo(70,y+16);x.lineTo(70,y+92-16);x.stroke()}
   x.fillStyle=on?th.ac:"rgba(255,255,255,.18)";x.shadowColor=th.ac;x.shadowBlur=on?16:0;x.beginPath();x.arc(70,y,11,0,7);x.fill();x.shadowBlur=0;
   x.font=`${on?800:600} 32px ${FS}`;x.fillStyle=on?th.tx:th.mu;x.textAlign="left";x.fillText(e.t,110,y,380);x.restore()})}
 if(kd==="chart"){const pts=s.pts.length>1?s.pts:[10,30,60,85,60,30,10],bx=50,by=320,bw=440,bh=250,n=pts.length,mx=Math.max(...pts,1),pr=eo((t-.3)/1.6);
  x.save();x.strokeStyle=th.line;x.lineWidth=1;x.beginPath();x.moveTo(bx,by+bh);x.lineTo(bx+bw,by+bh);x.stroke();x.beginPath();let f=1;
  for(let u=0;u<=pr*(n-1)+1e-6;u+=.05){const i=Math.min(Math.floor(u),n-1),j=Math.min(i+1,n-1),q=u-i,sm=q*q*(3-2*q),X=bx+bw*(i+q)/(n-1),Y=by+bh-bh*.9*(pts[i]+(pts[j]-pts[i])*sm)/mx;f?x.moveTo(X,Y):x.lineTo(X,Y);f=0}
  x.strokeStyle=th.ac;x.lineWidth=4;x.shadowColor=th.ac;x.shadowBlur=14;x.stroke();x.restore();
  (s.labels||[]).forEach((l,i)=>{x.save();x.globalAlpha=eo((t-.8)/.5);x.fillStyle=i?th.mu:th.ac;x.font=`600 20px ${FS}`;x.textAlign="left";x.fillText(l,bx,by+bh+34+i*30);x.restore()})}
 if(kd==="chat")chat(x,s.msgs,s.head?260:200,t,id);
}
function pill(x,k,e,t){const a=eo(t/.35)*(1-eo((t-(e.d-.35))/.35));if(a>0)card(x,k,28-(1-a)*50,190,320,70,e.icon,e.title,e.sub,a)}
function vfx(t){let z=1,gw=0,ob=0;for(const e of EV){if(e.type!=="fx")continue;const lt=t-e.t;if(lt<0||lt>e.d)continue;const u=lt/e.d;
 if(e.fx==="zoom")z=Math.max(z,1+.16*Math.sin(Math.PI*u));else if(e.fx==="snap")z=Math.max(z,1+.2*Math.pow(Math.max(0,1-lt/.7),2));else if(e.fx==="glow")gw=Math.max(gw,Math.sin(Math.PI*u));else ob=Math.max(ob,Math.sin(Math.PI*u))}return{z,gw,ob}}
function ev(x,t,cs){
 const k=TH[cs]?cs:(cs==="l"?"lime":"neon"),th=TH[k];
 EV.forEach((e,i)=>{const lt=t-e.t;if(lt<0||lt>e.d)return;const id="e"+i;
  if(lt<.5&&e.type!=="fx"&&e.type!=="badge")once(id,e.type==="scene"?"whoosh":"pop");if(lt<.2&&e.fx==="snap")once(id,"whoosh");
  if(e.type==="scene"){const o=OFFC.getContext("2d");o.clearRect(0,0,540,960);o.save();scene(o,k,e.scene,lt,lt/e.d,id);o.restore();x.save();x.globalAlpha=clamp(Math.min(lt/.3,(e.d-lt)/.3));x.drawImage(OFFC,0,0);x.restore()}
  else if(e.type==="pill")pill(x,k,e,lt);
  else if(e.type==="text"){const a=eo(lt/.35)*(1-eo((lt-(e.d-.3))/.3));x.save();x.textBaseline="middle";rich(x,e.head,270,160,52,k,a);x.restore()}
  else if(e.type==="chat"){x.save();x.globalAlpha=clamp(Math.min(lt/.25,(e.d-lt)/.25));chat(x,e.msgs,150,lt,id);x.restore()}
  else if(e.type==="badge"){const a=clamp(Math.min(lt/.25,(e.d-lt)/.25));x.save();x.globalAlpha=a;x.textAlign="center";x.textBaseline="middle";x.font=`800 20px ${FS}`;x.fillStyle="#fff";x.fillText(e.title,252,64);x.fillStyle=th.mu;x.font=`500 16px ${FS}`;x.fillText(e.sub,296,64);
   if(e.label){x.font=`800 34px ${FS}`;x.lineWidth=8;x.lineJoin="round";x.strokeStyle="rgba(0,0,0,.55)";x.strokeText(e.label,270,790);x.fillStyle="#fff";x.fillText(e.label,270,790)}x.restore()}});
 const v=vfx(t);
 if(v.gw>.01){x.save();x.globalAlpha=v.gw;x.strokeStyle=th.ac;x.lineWidth=14;x.shadowColor=th.ac;x.shadowBlur=46;x.beginPath();x.roundRect(8,8,524,944,28);x.stroke();x.restore()}
 if(v.ob>.01){x.save();x.globalAlpha=v.ob;["\u2665","\u25B6","\u2713","\u2726","\u2709"].forEach((g,i)=>{const an=t*1.6+i*Math.PI*2/5,px=270+200*Math.cos(an),py=620+90*Math.sin(an);x.fillStyle=th.card;x.strokeStyle=th.line;x.beginPath();x.arc(px,py,24,0,7);x.fill();x.stroke();x.fillStyle=th.ac;x.font=`700 24px ${FS}`;x.textAlign="center";x.textBaseline="middle";x.fillText(g,px,py+1)});x.restore()}
}
function cleanScene(s){s=s||{};if(s.kind==="ep")return cleanEpScene(s);const S=(v,n=60)=>String(v==null?"":v).slice(0,n),A=v=>Array.isArray(v)?v:[];
 const CH=s.char||{},HX=(v,d)=>hexOK(v)?v:d,SR={part:Math.max(1,Math.min(99,Math.round(+s.part)||1)),day:Math.max(1,Math.min(9999,Math.round(+s.day)||1)),time:S(s.time,6)||"07.00",note:S(s.note,30),h1:S(s.h1,110),h2:S(s.h2,70),subs:A(s.subs).slice(0,2).map(v=>S(v,90)).filter(Boolean),choices:A(s.choices).slice(0,2).map(v=>S(v,44)).filter(Boolean),sky:["pagi","siang","sore","malam","hujan","mendung"].includes(s.sky)?s.sky:"siang",
  char:{skin:HX(CH.skin,"#f1c27d"),hair:HX(CH.hair,"#2b2118"),shirt:HX(CH.shirt,"#3b82f6"),pants:HX(CH.pants,"#374151"),hairStyle:["pendek","panjang","botak","jilbab","topi","keriting"].includes(CH.hairStyle)?CH.hairStyle:"pendek",extra:CH.extra==="kacamata"?"kacamata":"",expr:["netral","senang","sedih","kaget","marah","takut"].includes(CH.expr)?CH.expr:"netral"}};
 return{...SR,kind:["title","list","terminal","stat","steps","chart","chat","kin","char","serial"].includes(s.kind)?s.kind:"title",tag:S(s.tag,24),small:S(s.small),head:S(s.head,90),sub:S(s.sub),win:S(s.win),icon:S(s.icon,12),value:S(s.value,14),bar:s.bar==null||s.bar===""?null:clamp(+s.bar/100),
  items:A(s.items).slice(0,5).map(i=>({i:S(i&&i.i,2)||"\u2605",t:S(i&&i.t),s:S(i&&i.s)})),lines:A(s.lines).slice(0,6).map(l=>S(l)),pts:A(s.pts).slice(0,12).map(Number).filter(isFinite),labels:A(s.labels).slice(0,2).map(l=>S(l,24)),
  msgs:A(s.msgs).slice(0,6).map(m=>({me:!!(m&&m.me),t:S(m&&m.t,120)})).filter(m=>m.t),bg:["api","malam","hutan","laut","kota","desa","pantai","sekolah","masjid","kantor","rumah"].includes(s.bg)?s.bg:(s.kind==="serial"?"desa":"api"),emo:["netral","sedih","senang","kaget","marah"].includes(s.emo)?s.emo:"netral",big:!!s.big,walk:!!s.walk,rays:!!s.rays,say:S(s.say,160)}}
function cleanEv(e){if(!e||typeof e!=="object")return null;const S=(v,n=40)=>String(v==null?"":v).slice(0,n),tp=e.type,o={type:tp,t:+e.t,d:clamp(+e.d||3,1,9)};if(!isFinite(o.t))return null;
 if(tp==="pill"){o.icon=S(e.icon,2)||"\u2605";o.title=S(e.title,28);o.sub=S(e.sub,34);return o.title?o:null}
 if(tp==="scene"){o.scene=cleanScene(e.scene);return o}
 if(tp==="fx"){o.fx=["zoom","snap","glow","orbit"].includes(e.fx)?e.fx:"zoom";o.d=clamp(+e.d||2,.6,6);return o}
 if(tp==="badge"){o.title=S(e.title,6);o.sub=S(e.sub,8);o.label=S(e.label,30);return o}
 if(tp==="text"){o.head=S(e.head,50);return o.head?o:null}
 if(tp==="chat"){o.msgs=cleanScene({msgs:e.msgs}).msgs;return o.msgs.length?o:null}
 return null}

/* ===== Serial kartun interaktif (Part 1, KAMU PILIH, KOMEN 1 ATAU 2) ===== */
const OLC="#1b1b1b";
function olf(x,c,lw=5){x.fillStyle=c;x.fill();x.lineWidth=lw;x.strokeStyle=OLC;x.lineJoin="round";x.stroke()}
const SKY={pagi:["#ffd0a0","#fff1d0"],siang:["#5fb8ff","#d8f0ff"],sore:["#ff8f5a","#ffd9a0"],malam:["#0f1a47","#2d418c"],hujan:["#66778b","#a9b6c4"],mendung:["#8a96a3","#c8d0d8"]};
function cloud(x,cx,cy,s){x.beginPath();x.arc(cx,cy,26*s,0,7);x.arc(cx+30*s,cy-10*s,32*s,0,7);x.arc(cx+66*s,cy,26*s,0,7);olf(x,"rgba(255,255,255,.93)",4)}
function sky(x,k,t){
  const c=SKY[k]||SKY.siang,g=x.createLinearGradient(0,0,0,720);g.addColorStop(0,c[0]);g.addColorStop(1,c[1]);x.fillStyle=g;x.fillRect(0,0,540,960);
  if(k==="malam"){dust(x,t,70,"#fff",560);x.beginPath();x.arc(420,330,34,0,7);olf(x,"#fff6c8",4)}
  else if(k==="pagi"||k==="sore"){x.beginPath();x.arc(k==="pagi"?120:420,360,46,0,7);olf(x,k==="pagi"?"#ffe27a":"#ff7a3d",4);cloud(x,300+Math.sin(t*.3)*12,380,.9)}
  else if(k==="siang"){x.beginPath();x.arc(430,340,44,0,7);olf(x,"#ffe45e",4);cloud(x,100+Math.sin(t*.3)*12,380,1);cloud(x,300,430,.8)}
  else{cloud(x,90,360,1.2);cloud(x,330,420,1)}
}
function ground(x,c,y){x.beginPath();x.rect(-10,y,560,960-y+10);olf(x,c,5)}
function tree(x,cx,by,s){x.beginPath();x.rect(cx-9*s,by-70*s,18*s,70*s);olf(x,"#7a4a2a",4);x.beginPath();x.arc(cx,by-95*s,46*s,0,7);x.arc(cx-30*s,by-70*s,32*s,0,7);x.arc(cx+30*s,by-70*s,32*s,0,7);olf(x,"#3fa34d",4)}
function place(x,b,sk,t){
  const dk=sk==="malam";
  if(b==="kota"){ground(x,dk?"#323849":"#8e9aa8",730);const cs=dk?["#2a3150","#39446e","#232a45"]:["#c8d3e0","#e3b9a1","#a8c0d8"];
    for(let i=0;i<7;i++){const w=72+(i*37%28),h=230+(i*53%150),bx=i*82-24;x.beginPath();x.rect(bx,730-h,w,h);olf(x,cs[i%3],5);
      for(let r=0;r<Math.floor(h/50);r++)for(let c=0;c<2;c++){x.beginPath();x.rect(bx+12+c*30,730-h+16+r*50,18,28);olf(x,dk&&(r+c+i)%3?"#ffe27a":"#dff0ff",3)}}}
  else if(b==="hutan"){ground(x,"#4f9a4a",740);for(let i=0;i<7;i++)tree(x,20+i*85,740+(i%2)*14,1.15+(i%3)*.15)}
  else if(b==="pantai"){const g=x.createLinearGradient(0,560,0,760);g.addColorStop(0,"#2aa7d8");g.addColorStop(1,"#6fd3ee");x.fillStyle=g;x.fillRect(0,560,540,200);
    for(let L=0;L<3;L++){x.beginPath();x.moveTo(0,760);for(let i=0;i<=540;i+=10)x.lineTo(i,600+L*40+7*Math.sin(i*.04+t*1.6+L));x.lineTo(540,760);olf(x,["#3ab8e0","#58c9ea","#8adff3"][L],3)}
    ground(x,"#f0d9a0",760);x.beginPath();x.rect(440,600,16,160);olf(x,"#8a5a30",4);x.beginPath();x.ellipse(448,596,60,22,-.3,0,7);olf(x,"#3fa34d",4);x.beginPath();x.ellipse(448,596,60,22,.5,0,7);olf(x,"#4cbc5c",4)}
  else if(b==="sekolah"){ground(x,"#7bc96f",730);x.beginPath();x.rect(40,520,460,210);olf(x,"#f2dfb8",5);x.beginPath();x.rect(20,500,500,36);olf(x,"#c4573a",5);
    for(let i=0;i<4;i++){x.beginPath();x.rect(70+i*105,560,60,60);olf(x,dk?"#ffe27a":"#bfe6ff",4)}x.beginPath();x.rect(240,640,60,90);olf(x,"#7a4a2a",4);x.beginPath();x.rect(268,430,6,80);olf(x,"#555",3);x.beginPath();x.rect(274,432,46,28);olf(x,"#e63946",3)}
  else if(b==="masjid"){ground(x,dk?"#36405a":"#d8cfae",735);x.beginPath();x.rect(130,560,280,175);olf(x,"#f4ecd2",5);x.beginPath();x.arc(270,560,100,Math.PI,0);olf(x,"#2fa37a",5);x.beginPath();x.rect(266,420,8,40);olf(x,"#d4a017",3);x.beginPath();x.arc(270,414,9,0,7);olf(x,"#f2c14e",3);
    [60,480].forEach(mx=>{x.beginPath();x.rect(mx-22,470,44,265);olf(x,"#f4ecd2",5);x.beginPath();x.moveTo(mx-26,470);x.lineTo(mx,410);x.lineTo(mx+26,470);x.closePath();olf(x,"#2fa37a",5)});x.beginPath();x.arc(270,735,34,Math.PI,0);olf(x,dk?"#ffe27a":"#7a4a2a",4)}
  else if(b==="kantor"){x.fillStyle="#cfd6df";x.fillRect(0,0,540,960);x.beginPath();x.rect(60,380,420,240);olf(x,dk?"#1c2750":"#bfe6ff",6);x.beginPath();x.moveTo(270,380);x.lineTo(270,620);x.moveTo(60,500);x.lineTo(480,500);x.lineWidth=5;x.strokeStyle=OLC;x.stroke();ground(x,"#9a7b5a",730);x.beginPath();x.rect(300,650,200,24);olf(x,"#6b4b2e",5);x.beginPath();x.rect(330,560,110,90);olf(x,"#2b3340",5)}
  else{ground(x,"#7bc96f",720);x.beginPath();x.moveTo(40,720);x.lineTo(40,590);x.lineTo(150,510);x.lineTo(260,590);x.lineTo(260,720);x.closePath();olf(x,"#f3d9b1",5);x.beginPath();x.moveTo(18,595);x.lineTo(150,490);x.lineTo(282,595);x.closePath();olf(x,"#c4573a",5);
    x.beginPath();x.rect(125,640,50,80);olf(x,"#7a4a2a",4);x.beginPath();x.rect(62,620,40,36);olf(x,dk?"#ffe27a":"#bfe6ff",4);tree(x,420,730,1.1);tree(x,505,740,.85)}
}
function human(x,cx,fy,s,c,t,expr){
  x.save();x.translate(cx,fy);x.scale(s,s);x.lineJoin="round";x.lineCap="round";
  const br=1+.014*Math.sin(t*2.2),sk=c.skin,sw=Math.sin(t*1.6)*.05,jil=c.hairStyle==="jilbab";
  x.fillStyle="rgba(0,0,0,.18)";x.beginPath();x.ellipse(0,4,112,16,0,0,7);x.fill();
  [-34,34].forEach(dx=>{x.beginPath();x.roundRect(dx-24,-118,48,118,12);olf(x,c.pants,5);x.beginPath();x.roundRect(dx-30,-16,60,22,10);olf(x,"#2b2b2b",5)});
  [-1,1].forEach(d=>{x.save();x.translate(d*78,-236);x.rotate(d*(.12+sw*d));x.beginPath();x.roundRect(-20,0,40,118,18);olf(x,c.shirt,5);x.beginPath();x.arc(0,130,20,0,7);olf(x,sk,5);x.restore()});
  x.save();x.translate(0,-112);x.scale(1,br);x.beginPath();x.roundRect(-72,-150,144,150,26);olf(x,c.shirt,5);x.restore();
  x.beginPath();x.roundRect(-18,-276,36,36,8);olf(x,sk,5);
  if(c.hairStyle==="panjang"){x.beginPath();x.roundRect(-86,-412,172,230,54);olf(x,c.hair,5)}
  if(jil){x.beginPath();x.ellipse(0,-338,96,100,0,0,7);olf(x,c.hair,5);x.beginPath();x.roundRect(-104,-272,208,96,44);olf(x,c.hair,5)}
  x.beginPath();x.ellipse(0,jil?-334:-340,jil?60:74,jil?66:78,0,0,7);olf(x,sk,5);
  if(c.hairStyle==="pendek"||c.hairStyle==="panjang"){x.beginPath();x.ellipse(0,-378,78,48,0,Math.PI,0);x.closePath();olf(x,c.hair,5);x.beginPath();x.moveTo(-60,-372);x.quadraticCurveTo(-10,-352,40,-376);x.lineTo(40,-390);x.lineTo(-60,-390);x.closePath();olf(x,c.hair,4)}
  if(c.hairStyle==="keriting"){for(let i=0;i<7;i++){x.beginPath();x.arc(-66+i*22,-395+Math.abs(i-3)*7,24,0,7);olf(x,c.hair,5)}}
  if(c.hairStyle==="topi"){x.beginPath();x.roundRect(-72,-420,144,50,18);olf(x,c.hair,5)}
  const ey=jil?-334:-338,ex=26;
  const bl=(t%3.4)>3.27;
  [-1,1].forEach(d=>{if(bl){x.beginPath();x.moveTo(d*ex-12,ey);x.lineTo(d*ex+12,ey);x.lineWidth=5;x.strokeStyle=OLC;x.stroke()}else{x.beginPath();x.ellipse(d*ex,ey,13,expr==="kaget"?20:16,0,0,7);olf(x,"#fff",4);x.beginPath();x.arc(d*ex+(Math.sin(t*.8)*2),ey+1,7,0,7);x.fillStyle=OLC;x.fill()}});
  const A={sedih:-1,takut:-1,marah:1,senang:-.2,kaget:-.5}[expr]||0;x.lineWidth=6;x.strokeStyle=OLC;
  [-1,1].forEach(d=>{x.beginPath();x.moveTo(d*ex-d*16,ey-30+A*8);x.lineTo(d*ex+d*16,ey-30-A*8);x.stroke()});
  x.beginPath();const my=ey+52;
  if(expr==="senang"){x.arc(0,my-8,22,.15*Math.PI,.85*Math.PI);x.stroke();x.fillStyle="rgba(255,120,120,.35)";[-1,1].forEach(d=>{x.beginPath();x.arc(d*44,ey+28,11,0,7);x.fill()})}
  else if(expr==="sedih"||expr==="marah"){x.arc(0,my+14,20,1.15*Math.PI,1.85*Math.PI);x.stroke()}
  else if(expr==="kaget"){x.ellipse(0,my,9,14,0,0,7);olf(x,"#5a1d1d",4)}
  else if(expr==="takut"){x.moveTo(-20,my);for(let i=1;i<=4;i++)x.lineTo(-20+i*10,my+(i%2?6:-4));x.stroke()}
  else{x.moveTo(-16,my);x.lineTo(16,my);x.stroke()}
  if(c.extra==="kacamata"){x.lineWidth=5;[-1,1].forEach(d=>{x.beginPath();x.arc(d*ex,ey,22,0,7);x.stroke()});x.beginPath();x.moveTo(-ex+22,ey);x.lineTo(ex-22,ey);x.stroke()}
  x.restore();
}
function fitText(x,s,w,n,sz,min=22){let z=sz,L;for(;;){x.font="900 "+z+"px "+FS;L=wrap(x,s,w);if(L.length<=n||z<=min)break;z-=2}return{L:L.slice(0,n),z}}
function oText(x,s,px,py,font,fill,lw=8,al="center"){x.font=font;x.textAlign=al;x.textBaseline="middle";x.lineJoin="round";x.lineWidth=lw;x.strokeStyle="#000";x.strokeText(s,px,py,500);x.fillStyle=fill;x.fillText(s,px,py,500)}
function serialPct(ch){const sd=[...String(ch.join("|"))].reduce((a,c)=>a+c.charCodeAt(0),0);let p=36+sd%29;if(p===50)p=54;return[p,100-p]}
function serialTimes(d){const SL=Math.max(5.2,d-2.6-3.7);return{SL,tc:2.6+SL,tk:2.6+SL+2}}
function serialScene(x,s,t,d,id){
  const {SL,tc,tk}=serialTimes(d);
  x.save();const z=1+.06*clamp(t/d);x.translate(270,720);x.scale(z,z);x.translate(-270,-720);
  sky(x,s.sky,t);place(x,s.bg,s.sky,t);
  if(s.sky==="hujan"){x.strokeStyle="rgba(255,255,255,.55)";x.lineWidth=2;for(let i=0;i<70;i++){const u=Math.sin(i*91.7)*43758.5,px=(u-Math.floor(u))*560,py=((t*520+i*137)%1000)-40;x.beginPath();x.moveTo(px,py);x.lineTo(px-8,py+26);x.stroke()}}
  human(x,270,880,.92,s.char,t,s.char.expr);x.restore();
  x.save();x.textBaseline="middle";
  const a0=eo(t/.5);
  x.globalAlpha=a0;oText(x,"HARI "+s.day,20,38,"900 28px "+FS,"#fff",7,"left");oText(x,s.time,20,84,"900 58px "+FS,"#fff",9,"left");
  x.font="700 15px "+FS;oText(x,String(s.note||"").slice(0,26),22,128,"700 15px "+FS,"#ffe14d",5,"left");
  x.font="900 20px "+FS;const pw=x.measureText("PART "+s.part).width+30;x.fillStyle="#e63946";x.beginPath();x.roundRect(520-pw,22,pw,40,10);x.fill();x.lineWidth=4;x.strokeStyle=OLC;x.stroke();x.fillStyle="#fff";x.textAlign="center";x.fillText("PART "+s.part,520-pw/2,43);
  const ha=eo((t-.3)/.5);x.globalAlpha=ha;x.save();x.translate(0,(1-ha)*-20);
  let y=176;const F1=fitText(x,String(s.h1||"").toUpperCase(),480,2,36);F1.L.forEach(l=>{oText(x,l,270,y,"900 "+F1.z+"px "+FS,"#fff",9);y+=F1.z+6});
  const F2=fitText(x,String(s.h2||"").toUpperCase(),480,1,36);F2.L.forEach(l=>{oText(x,l,270,y,"900 "+F2.z+"px "+FS,"#ffe14d",9);y+=F2.z+6});x.restore();
  x.globalAlpha=1;
  const subs=(s.subs||[]).slice(0,2);
  if(t>=2.6&&t<tc&&subs.length){const w1=subs[0].length,w2=(subs[1]||"").length||0,r=subs.length>1?w1/(w1+w2):1,i=t<2.6+SL*r?0:1,st=i?2.6+SL*r:2.6;
    if(t-st<.3)once(id+"s"+i,"pop");const aa=eo((t-st)/.25);x.globalAlpha=aa;{const F=fitText(x,subs[i]||subs[0],460,2,34);F.L.forEach((l,j,A)=>oText(x,l,270,800+(j-(A.length-1)/2)*(F.z+8),"900 "+F.z+"px "+FS,"#fff",9))}}
  x.globalAlpha=1;
  if(t>=tc){const q=clamp((t-tc)/.35),ch=(s.choices||[]).slice(0,2),pc=serialPct(ch);if(t-tc<.4)once(id+"c","whoosh");
    x.save();x.globalAlpha=q;x.translate(0,(1-q)*30);x.fillStyle="rgba(10,12,20,.9)";x.beginPath();x.roundRect(36,318,468,172,20);x.fill();x.lineWidth=5;x.strokeStyle=OLC;x.stroke();
    oText(x,"KAMU PILIH",270,342,"900 24px "+FS,"#ffe14d",1);
    ch.forEach((c,i)=>{const yy=362+i*58,fill=eo((t-tc-.35)/1.4)*pc[i]/100,win=pc[i]>pc[1-i],col=win?"#22c55e":"#8a93a3";
      x.beginPath();x.arc(64,yy+12,15,0,7);x.fillStyle=col;x.fill();x.fillStyle="#fff";x.font="900 18px "+FS;x.textAlign="center";x.textBaseline="middle";x.fillText(String(i+1),64,yy+13);
      x.textAlign="left";x.font="800 20px "+FS;x.fillStyle="#fff";x.fillText(String(c).slice(0,40),90,yy+10,390);
      x.fillStyle="rgba(255,255,255,.15)";x.beginPath();x.roundRect(90,yy+30,344,12,6);x.fill();x.fillStyle=col;x.beginPath();x.roundRect(90,yy+30,Math.max(12,344*fill/(pc[i]/100)*(pc[i]/100)),12,6);x.fill();
      x.fillStyle="#fff";x.font="800 16px "+FS;x.textAlign="left";x.fillText(Math.round(fill*100)+"%",444,yy+36)});
    x.restore()}
  if(t>=tk){if(t-tk<.3)once(id+"k","ding");const q=eo((t-tk)/.3);x.globalAlpha=q;x.save();x.translate(270,830);x.scale(.8+.2*q,.8+.2*q);oText(x,"KOMEN 1 ATAU 2",0,0,"900 42px "+FS,"#ffe14d",10);x.restore()}
  x.restore();
}
