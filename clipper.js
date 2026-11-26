/* ===== Clipper ===== */
const vid=$("#v");let vfile=null,clips=[],cur=null,url=null,busy=false;
const PC=new Prog("pg1"),PV=new Prog("pg3"),oc=$("#ovc").getContext("2d"),fmt=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
const ytId=u=>(String(u).match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/)||[])[1];
const setPos=()=>{vid.style.objectPosition=$("#pos").value+"% 50%"};$("#pos").addEventListener("input",setPos);setPos();
(function loop(){oc.clearRect(0,0,540,960);const t=vid.currentTime||0;vid.style.transform="scale("+vfx(t).z+")";ev(oc,t,$("#cs").value);ov(oc,(!cur||t-cur.s<3)?$("#hook").value:"",$("#cap").value,$("#sty").value);acv(oc,t,$("#cs").value);requestAnimationFrame(loop)})();
$("#len").oninput=e=>{$("#lv").textContent=e.target.value};
$("#vf").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  if(f.type&&!/^video\//.test(f.type)&&!/\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name)){toast("File itu bukan video.","bad");return}
  if(f.size>1.5e9)toast("File sangat besar ("+Math.round(f.size/1e6)+" MB). Di HP bisa gagal, coba potong dulu.","bad");
  if(url)URL.revokeObjectURL(url);vfile=f;url=URL.createObjectURL(f);vid.src=url;vid.muted=false;clips=[];cur=null;EV=[];$("#clips").textContent="";$("#em").style.display="none";$("#res1").textContent="";
  st1("Video siap. Klik \u201CBuat otomatis dari video atau link\u201D.")};
vid.onerror=()=>{if(vfile)toast("Browser tidak bisa memutar video ini. Ubah ke MP4 (H.264) lalu unggah lagi.","bad")};
vid.onclick=()=>{vid.paused?vid.play().catch(()=>{}):vid.pause()};
vid.ontimeupdate=()=>{if(cur&&!busy&&vid.currentTime>=cur.s+cur.l)vid.currentTime=cur.s};
vid.addEventListener("seeked",()=>FIR.clear());
function show(){
  const box=$("#clips");box.textContent="";
  clips.forEach((c,i)=>{const b=document.createElement("button");b.type="button";b.setAttribute("aria-pressed",cur===c);
    const s1=document.createElement("span"),b1=document.createElement("b");s1.textContent=(c.t||"Klip "+(i+1))+" \u00B7 "+fmt(c.s)+" sampai "+fmt(c.s+c.l)+(c.w?"\n"+c.w:"");s1.style.whiteSpace="pre-line";b1.textContent=c.sc==null?"\u2013":c.sc;b.append(s1,b1);
    b.onclick=()=>{cur=c;if(c.h)$("#hook").value=c.h;if(vfile){vid.currentTime=c.s;vid.play().catch(()=>{})}else{const id=ytId($("#yt").value);if(id)window.open("https://www.youtube.com/watch?v="+id+"&t="+Math.floor(c.s)+"s","_blank","noopener")}show()};box.appendChild(b)})}
async function audioMoments(P){
  if(!vfile)throw new Error("Pilih video dulu.");if(vfile.size>700e6)throw new Error("File terlalu besar untuk dianalisis di browser (maksimal sekitar 700 MB).");
  let L=+$("#len").value;const N=Math.max(1,Math.min(10,+$("#cnt").value||4)),dur=vid.duration||0;P.set("mo",.1,"membaca audio");
  try{
    const d=await pcm16k(vfile),sr=16000,secs=Math.floor(d.length/sr);if(secs<3)throw new Error("terlalu pendek");L=Math.min(L,secs);const e=[];
    for(let s=0;s<secs;s++){let a=0,n=0;for(let i=s*sr;i<(s+1)*sr;i+=4){a+=d[i]*d[i];n++}e.push(Math.sqrt(a/n))}
    const w=[];let run=0;for(let s=0;s<secs;s++){run+=e[s];if(s>=L)run-=e[s-L];if(s>=L-1)w.push([run/L,s-L+1])}
    w.sort((a,b)=>b[0]-a[0]);const out=[];for(const [v,s] of w){if(out.length>=N)break;if(out.every(o=>Math.abs(o.s-s)>=L))out.push({s,l:L,v})}
    const mx=out[0]?out[0].v||1:1;clips=out.map(o=>({s:o.s,l:o.l,sc:Math.round(50+49*o.v/mx)}));
  }catch(err){
    L=Math.min(L,Math.floor(dur)||L);clips=[];const gap=Math.max(L,(dur-L)/Math.max(1,N-1));
    for(let i=0;i<N&&i*gap+L<=dur+1;i++)clips.push({s:Math.floor(i*gap),l:L,sc:null});
    toast("Audio tidak bisa dianalisis, klip dibagi rata.")}
  if(!clips.length)throw new Error("Video terlalu pendek untuk dipotong.");
  cur=clips[0];vid.currentTime=cur.s;vid.play().catch(()=>{});show();P.fin("mo")}
async function exportClip(P){
  if(!cur)throw new Error("Pilih klip dulu.");if(!vfile)throw new Error("Unggah file videonya dulu untuk ekspor klip.");
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw new Error("Browser belum mendukung ekspor video. Pakai Chrome, Edge, Firefox, atau Safari terbaru.");
  const c=cur,cv=document.createElement("canvas");cv.width=540;cv.height=960;const x=cv.getContext("2d"),hook=$("#hook").value,cap=$("#cap").value,sty=$("#sty").value,cs=$("#cs").value,pos=$("#pos").value/100;
  P.set("prep",.2,"menyiapkan audio dan video");aud();route(vid);busy=true;vid.pause();
  try{
    if(Math.abs(vid.currentTime-c.s)>.05)await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("Video tidak merespons saat dicari ke detik awal klip.")),10000);vid.addEventListener("seeked",()=>{clearTimeout(t);res()},{once:true});vid.currentTime=c.s});
    if(!vid.videoWidth)throw new Error("Video belum siap diputar. Tunggu sebentar lalu coba lagi.");
    FIR.clear();P.fin("prep");
    const out=cv.captureStream(30),at=AU.dest.stream.getAudioTracks()[0];if(at)out.addTrack(at);
    const mt=recMime(),rec=new MediaRecorder(out,mt?{mimeType:mt}:undefined),ch=[];
    rec.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
    const stopped=new Promise((res,rej)=>{rec.onstop=res;rec.onerror=e=>rej((e&&e.error)||new Error("Perekam video berhenti tiba-tiba."))});
    const g=guardTab(rec,()=>vid.pause(),()=>vid.play().catch(()=>{}),P);let cancel=null;P.hooks.push(()=>{if(cancel)cancel(new Error("Dibatalkan."))});
    try{
      rec.start();await vid.play();
      await new Promise((res,rej)=>{cancel=rej;let lastT=vid.currentTime,lastM=performance.now(),lastF=lastM;
        const f=()=>{
          if(AB.signal.aborted)return rej(new Error("Dibatalkan."));
          const now=performance.now();if(now-lastF>2000)lastM=now;lastF=now;
          const t=vid.currentTime,p=(t-c.s)/c.l,vw=vid.videoWidth,vh=vid.videoHeight,k=Math.max(540/vw,960/vh),w=vw*k,h=vh*k,zz=vfx(t).z;
          x.fillStyle="#000";x.fillRect(0,0,540,960);x.save();x.translate(270,480);x.scale(zz,zz);x.translate(-270,-480);x.drawImage(vid,-(w-540)*pos,(960-h)/2,w,h);x.restore();
          ev(x,t,cs);ov(x,t-c.s<3?hook:"",cap,sty);acv(x,t,cs);
          P.set("rec",clamp(p),"detik "+Math.max(0,Math.round(t-c.s))+" dari "+Math.round(c.l));
          if(t>lastT+.01){lastT=t;lastM=now}else if(!GUARD.paused&&!vid.paused&&now-lastM>10000)return rej(new Error("Video macet: tidak bergerak selama 10 detik."));
          if(p>=1||vid.ended)return res();
          requestAnimationFrame(f)};
        f()});
      vid.pause();if(rec.state!=="inactive")rec.stop();await stopped;
    }finally{g();if(rec.state!=="inactive"){try{rec.stop()}catch(e){}}}
    P.fin("rec");P.set("save",.5,"menyiapkan file");
    const blob=new Blob(ch,{type:mt||"video/webm"});if(!blob.size)throw new Error("Hasil video kosong.");
    const name="mpn-klip"+EXT(mt),ok=await save(name,blob);showResult("#res1",blob,name,ok?"File sudah diunduh. Kalau tidak muncul, tekan tombol Unduh di atas.":"Tekan tombol Unduh di atas untuk menyimpan.");P.fin("save");
  }finally{busy=false;try{vid.pause();vid.currentTime=c.s}catch(e){}}
}
const needAI=()=>{if(!AIK()){toast(NOKEY,"bad");$("#set").open=true;return false}return true};
$("#find").onclick=()=>{const st=[{id:"mo",t:"Menganalisis suara video",w:100}],go=()=>run(PC,st,audioMoments,"Momen ditemukan. Pilih satu untuk pratinjau.",go);go()};
$("#ai").onclick=()=>{if(!needAI())return;const st=[{id:"mo",t:"Mencari momen terbaik",w:100}],go=()=>run(PC,st,findMoments,"Momen ditemukan. Pilih satu untuk pratinjau.",go);go()};
$("#ae").onclick=()=>{if(!needAI())return;const st=[{id:"ae",t:"Auto edit (kartu, efek, sound effect)",w:100}],go=()=>run(PC,st,autoEdit,"Auto edit siap. Putar untuk melihat, lalu ekspor.",go);go()};
$("#exp").onclick=()=>{const st=[{id:"prep",t:"Menyiapkan",w:5},{id:"rec",t:"Merender klip (real-time)",w:90},{id:"save",t:"Menyimpan file",w:5}],go=()=>run(PC,st,exportClip,"Klip selesai dan tersimpan.",go);go()};
$("#auto").onclick=()=>{
  if(!needAI())return;
  const go=()=>{
    const yt=$("#yt").value.trim(),hasTr=!!$("#tr").value.trim(),viaYT=!!yt&&!clips.length&&!(hasTr&&vfile),st=[];
    if(viaYT)st.push({id:"tr",t:"Gemini menonton video dari link",w:55});
    else if(!hasTr){if(!vfile){toast("Pilih file video atau tempel link YouTube dulu.","bad");return}st.push({id:"tr",t:"Membuat transkrip dari audio",w:40})}
    if(!viaYT&&!clips.length)st.push({id:"mo",t:"Mencari momen terbaik",w:20});
    if(vfile)st.push({id:"ae",t:"Auto edit (kartu, efek, sound effect)",w:viaYT?45:30});
    run(PC,st,async P=>{if(viaYT)await ytFlow(yt,P);else if(!hasTr)await transcribeFile(P);if(!viaYT&&!clips.length)await findMoments(P);if(vfile)await autoEdit(P)},
      ()=>vfile?"Siap! Putar untuk melihat hasilnya, lalu klik Ekspor klip.":"Momen dan transkrip siap dari link. Unggah file video yang sama untuk auto edit dan ekspor.",go)};
  go()};
$("#srt").onclick=async()=>{
  const segs=parseTr($("#tr").value);if(!segs.length)return toast("Belum ada transkrip.","bad");
  const f=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=Math.floor(s%60),ms=Math.round((s%1)*1000);return[h,m,c].map(v=>String(v).padStart(2,"0")).join(":")+","+String(ms).padStart(3,"0")};
  let o="";segs.forEach((g,i)=>{const e=i<segs.length-1?segs[i+1].t:g.t+4;o+=(i+1)+"\n"+f(g.t)+" --> "+f(Math.min(e,g.t+8))+"\n"+g.text+"\n\n"});
  toast(await save("subtitle.srt",new Blob([o],{type:"text/plain"}))?"Subtitle .srt diunduh.":"Gagal menyimpan .srt","ok")};
