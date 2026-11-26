/* ===== Inti: helper, tab, teks di atas video, subtitle ===== */
const $=s=>document.querySelector(s),st1=t=>$("#st1").textContent=t,st3=t=>$("#st3").textContent=t;
const FONT='"Bricolage Grotesque",system-ui,sans-serif';
const TB=[["t1","p1"],["t3","p3"]];
TB.forEach(([t,p])=>$("#"+t).onclick=()=>{TB.forEach(([a,b])=>{$("#"+a).setAttribute("aria-selected",a===t);$("#"+b).hidden=b!==p})});
function wrap(x,t,w){const o=[];let l="";for(const wd of String(t).split(" ")){const n=l?l+" "+wd:wd;if(x.measureText(n).width>w&&l){o.push(l);l=wd}else l=n}if(l)o.push(l);return o}
function ov(x,hook,cap,sty){
  x.save();x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";
  if(hook){
    x.font="800 34px "+FONT;const L=wrap(x,hook,430),lh=41,h=L.length*lh+26,y=76;
    if(sty!=="b"){x.fillStyle=sty==="n"?"#d90429":"#fff";x.beginPath();x.roundRect(40,y,460,h,sty==="n"?0:14);x.fill()}
    L.forEach((t,i)=>{const ty=y+13+lh*i+lh/2;
      if(sty==="b"){x.lineWidth=8;x.strokeStyle="#000";x.strokeText(t,270,ty);x.fillStyle="#fff"}else x.fillStyle=sty==="n"?"#fff":"#111";
      x.fillText(t,270,ty)});
  }
  if(cap){x.font="800 36px "+FONT;const L=wrap(x,cap,460);L.forEach((t,i)=>{const ty=820-(L.length-1-i)*44;x.lineWidth=8;x.strokeStyle="#000";x.strokeText(t,270,ty);x.fillStyle="#fff";x.fillText(t,270,ty)})}
  x.restore();
}
let W=[];
function parseTr(s){
  const segs=[],ts=v=>v.split(":").reduce((a,b)=>a*60+ +b,0);let p=null;
  for(const l of String(s).split(/\r?\n/).map(l=>l.trim()).filter(Boolean)){
    const m=l.match(/^(\d{1,2}(?::\d{2}){1,2})\s*(.*)$/);
    if(m){if(p&&p.text)segs.push(p);p={t:ts(m[1]),text:m[2]}}else if(p)p.text+=(p.text?" ":"")+l;
  }
  if(p&&p.text)segs.push(p);
  W=[];segs.forEach((g,i)=>{const nx=i<segs.length-1?segs[i+1].t:g.t+4,ws=g.text.split(/\s+/),dur=Math.max(.5,Math.min(nx-g.t,ws.length*.6+.6)),d=dur/ws.length;
    ws.forEach((w,j)=>W.push({w,s:g.t+j*d,e:g.t+(j+1)*d,g:i+"-"+Math.floor(j/3)}))});
  return segs;
}
function ac(x,t,sty,Ws=W,Y=770,col="#ffe14d"){
  let k=-1;for(let i=0;i<Ws.length;i++){if(Ws[i].s<=t)k=i;else break}
  if(k<0||t>Ws[k].e+.6)return;
  const ws=Ws.filter(w=>w.g===Ws[k].g);
  x.save();x.font=(sty==="g"?"800 50px "+FPLAY:"800 50px "+FS);x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";
  const sp=18,wd=ws.map(w=>x.measureText(w.w).width),tot=wd.reduce((a,b)=>a+b,0)+sp*(ws.length-1),sc=Math.min(1,480/tot);
  if(sty==="y"){x.fillStyle="rgba(18,12,20,.78)";x.beginPath();x.roundRect(270-tot*sc/2-22,Y-36,tot*sc+44,72,18);x.fill()}
  let off=0;
  ws.forEach((w,i)=>{
    const on=Ws[k]===w,a=on?Math.min(1,(t-w.s)/.18):0,pop=on?1.08+.24*Math.sin(a*Math.PI):1,cx=270-tot*sc/2+(off+wd[i]/2)*sc;off+=wd[i]+sp;
    x.save();x.translate(cx,Y);x.rotate(on?-.05*Math.sin(a*Math.PI):0);x.scale(pop*sc,pop*sc);
    if(sty==="l"){x.fillStyle="rgba(8,11,4,.85)";x.beginPath();x.roundRect(-wd[i]/2-12,-30,wd[i]+24,60,12);x.fill()}
    else if(sty==="n"||sty==="g"){x.shadowColor=col;x.shadowBlur=on?26:0}
    else if(sty==="k"){if(on){x.fillStyle="#e8336d";x.beginPath();x.roundRect(-wd[i]/2-14,-38,wd[i]+28,76,16);x.fill()}x.lineWidth=10;x.strokeStyle="#000";x.strokeText(w.w,0,0)}
    else if(sty==="p"){x.lineWidth=10;x.strokeStyle="#000";x.strokeText(w.w,0,0)}
    x.fillStyle=on?(sty==="p"?"#ffe14d":sty==="k"?"#fff":col):(sty==="g"?"#fff6e0":"#fff");
    x.fillText(w.w,0,0);x.restore()});
  x.restore();
}
function acv(x,t,cs){const th=TH[cs];th?ac(x,t,th.cap[0],W,770,th.cap[1]):ac(x,t,cs)}
