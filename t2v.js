/* ===== Teks ke video (AI menentukan tampilan, serial kartun interaktif) ===== */
const tv=$("#tv"),tx2=tv.getContext("2d");
let SC=[],TL=null,tvOn=false,tvAu=null,lastI=-1,tvSrc=[],tvClk={base:0,pausedAt:0,paused:0},SER=null;
TH.ai=makeTheme({});try{SER=JSON.parse(LS("series")||"null")}catch(e){SER=null}
const AS={auto:'pilih sendiri kombinasi jenis scene terbaik untuk topik ini (boleh campur "title", "list", "terminal", "stat", "steps", "chart", "chat", "kin", "char")',mg:'campuran kind "title", "list", "terminal", "stat", "steps", "chart" yang sesuai isi',char:'hanya kind "char" (karakter animasi bercerita)',kin:'hanya kind "kin" (kinetic typography: kata muncul satu per satu)',chat:'hanya kind "chat" (cerita lewat bubble chat)',info:'campuran kind "stat", "chart", "steps", "list", "title" (infografis data)'};
const THEME_SPEC='"theme":{"bg":["#hex gelap atau terang","#hex"],"ac":"#hex warna aksen","tx":"#hex teks","mu":"#hex teks redup","fx":"grid|top|gold|hud|pixel|arch|aurora|stars","hd":"serifit|plain|gold|serif|under"}';
const SCENE_SPEC=`{"kind":"title","small":"teks kecil","head":"judul pendek *aksen*","sub":"subjudul","icon":"bulan|target|mahkota|hati|centang|bintang|tanya|api|timbangan|orang|panah|petir|buku|jam|uang|mata|cahaya|silang|rumah","say":""}
{"kind":"list","head":"","items":[{"i":"satu emoji","t":"judul","s":"keterangan"}],"say":""} (2-4 item)
{"kind":"terminal","tag":"LANGKAH 1 DARI 3","head":"","sub":"","win":"nama.txt","lines":["baris"],"say":""} (2-5 baris, awali baris sukses dengan \u2713)
{"kind":"stat","head":"label","value":"-11%","sub":"keterangan","bar":60,"say":""}
{"kind":"steps","head":"","items":[{"t":"langkah"}],"say":""} (3-4 item)
{"kind":"chart","head":"","pts":[10,30,60,85,60],"labels":["garis 1","garis 2"],"say":""}
{"kind":"chat","head":"","msgs":[{"me":true,"t":"pertanyaan"},{"me":false,"t":"jawaban"}],"say":""} (2-5 pesan)
{"kind":"kin","head":"kalimat pendek dengan *aksen*","say":""}
{"kind":"char","bg":"api|malam|hutan|laut","emo":"netral|sedih|senang|kaget|marah","big":false,"walk":false,"rays":false,"say":""} (karakter maskot bercerita)`;
const SERIAL_SPEC='{"kind":"serial","part":1,"day":1,"time":"07.30","note":"keterangan kecil, maks 4 kata","h1":"KALIMAT BESAR DIAWALI KAMU, maks 8 kata","h2":"BARIS KEDUA PENDEK (tampil kuning)","subs":["narasi pendek 1, maks 12 kata","narasi pendek 2, maks 12 kata"],"choices":["pilihan 1, maks 6 kata","pilihan 2, maks 6 kata"],"bg":"kota|desa|hutan|pantai|sekolah|masjid|kantor|rumah","sky":"pagi|siang|sore|malam|hujan|mendung","char":{"skin":"#hex","hair":"#hex","shirt":"#hex","pants":"#hex","hairStyle":"pendek|panjang|botak|jilbab|topi|keriting","extra":"kacamata atau kosong","expr":"netral|senang|sedih|kaget|marah|takut"}}';
function build(){
  try{const j=JSON.parse($("#sj").value),sa=Array.isArray(j)?j:(j&&Array.isArray(j.scenes)?j.scenes:null);if(!sa)throw new Error("x");if(!Array.isArray(j)&&j.episode)EPI=normEp({episode:j.episode,scenes:[]}).meta;SC=sa.slice(0,24).map(cleanScene)}catch(e){st3("JSON scene tidak valid. Periksa tanda kutip dan koma.");return null}
  if(!SC.length){st3("Belum ada scene.");return null}
  let T=0;const tl=SC.map((s,i)=>{const b=VB.length===SC.length?VB[i]:null,ser=s.kind==="serial";
    let d=b?b.duration+.7:Math.max(3,sceneSay(s).split(/\s+/).length/2.6+.8),off=.2;
    if(ser){off=2.6;d=b?2.6+Math.max(5.2,b.duration+.4)+3.7:11.5}
    if(s.kind==="ep")d=b?Math.max(2.5,b.duration+.6):s.dur;
    const o={s,a:T,d,b,off};T+=d;return o});
  const vd=tvAu&&$("#vo").files[0]&&tvAu.duration;if(vd&&isFinite(vd)){const k=vd/T;tl.forEach(o=>{o.a*=k;o.d*=k;o.b=null});T=vd}
  const Ws=[];tl.forEach((o,i)=>{if(o.s.kind==="serial"||o.s.kind==="ep")return;const ws=(o.s.say||"").split(/\s+/).filter(Boolean);if(!ws.length)return;const L=ws.map(w=>w.length+2),sum=L.reduce((a,b)=>a+b,0),s0=o.a+.2,span=o.b?o.b.duration:o.d-.5;let c=0;ws.forEach((w,j)=>{Ws.push({w,s:s0+span*c/sum,e:s0+span*(c+L[j])/sum,g:i+"-"+Math.floor(j/3)});c+=L[j]})});
  return{tl,T,Ws}}
function tvDraw(t){
  if(!TL)return 0;let i=TL.tl.findIndex(o=>t>=o.a&&t<o.a+o.d);if(i<0)i=TL.tl.length-1;const o=TL.tl[i],lt=t-o.a,n=TL.tl.length,th=TH.ai;
  const I={d:o.d,epi:EPI,span:o.b?o.b.duration:o.d-.5,brand:$("#hd").value.trim()||"",idx:String(i+1).padStart(2,"0")+"/"+String(n).padStart(2,"0"),tag:(o.s.tag||o.s.small||"").toUpperCase().slice(0,18),title:(SC[0]&&SC[0].head||"").replace(/\*/g,"").toUpperCase().slice(0,26),tc:tfmt(t)};
  tx2.save();scene(tx2,"ai",o.s,lt,t/TL.T,"v"+i,I);tx2.restore();if(lt<.5&&o.s.kind!=="serial"&&o.s.kind!=="ep")once("v"+i,"whoosh");
  if(o.s.kind!=="serial"&&o.s.kind!=="ep"){const c=o.s.kind==="char"?["y","#ffd23f"]:th.cap;ac(tx2,t,c[0],TL.Ws,o.s.kind==="char"?850:855,c[1])}return i}
function drawPlaceholder(msg){const x=tx2,g=x.createLinearGradient(0,0,0,960);g.addColorStop(0,"#0b1d14");g.addColorStop(1,"#143524");x.fillStyle=g;x.fillRect(0,0,540,960);x.fillStyle="rgba(255,255,255,.85)";x.font="700 26px "+FS;x.textAlign="center";x.textBaseline="middle";wrap(x,msg,400).forEach((l,i,a)=>x.fillText(l,270,480+(i-(a.length-1)/2)*36))}
function clearScenes(msg){SC=[];TL=null;VB=[];$("#sj").value="";LS("draft","");TH.ai=makeTheme({});drawPlaceholder(msg||"Menyiapkan scene baru\u2026")}
function setSC(a,theme,meta){VB=[];if(theme)TH.ai=makeTheme(theme);if(meta)EPI=meta;const sc=a.slice(0,24).map(cleanScene);$("#sj").value=JSON.stringify(meta?{episode:meta,scenes:sc}:sc,null,1);LS("draft",$("#sj").value);LS("theme",JSON.stringify(theme||null));TL=build();if(TL)tvDraw(.9)}
function tvStop(){tvOn=false;if(tvAu)tvAu.pause();tvSrc.forEach(s=>{try{s.stop()}catch(e){}});tvSrc=[];if(window.speechSynthesis)speechSynthesis.cancel()}
function tvPause(){if(!tvClk.pausedAt){tvClk.pausedAt=performance.now();if(tvAu)tvAu.pause()}}
function tvResume(){if(tvClk.pausedAt){tvClk.paused+=performance.now()-tvClk.pausedAt;tvClk.pausedAt=0;if(tvAu&&$("#vo").files[0])tvAu.play().catch(()=>{})}}
function tvPlay(pre,cb){
  TL=pre||build();if(!TL)return;tvStop();FIR.clear();lastI=-1;const A=aud(),au=tvAu&&$("#vo").files[0]?tvAu:null,useVB=!au&&TL.tl.every(o=>o.b),sp=$("#sp").checked&&!cb&&!useVB&&!au&&window.speechSynthesis,lead=.25;
  if(A.c.state==="suspended")A.c.resume();
  tvClk={base:performance.now()+lead*1000,pausedAt:0,paused:0};
  if(useVB){const c0=A.c.currentTime+lead;TL.tl.forEach(o=>{const s=A.c.createBufferSource();s.buffer=o.b;s.connect(A.m);s.start(c0+o.a+o.off);tvSrc.push(s)})}
  if(au){route(au);au.currentTime=0;au.play().catch(()=>{})}
  tvOn=true;
  (function f(){if(!tvOn)return;
    const now=performance.now(),t=au?(au.ended?TL.T:au.currentTime):((tvClk.pausedAt||now)-tvClk.base-tvClk.paused)/1000;
    if(t>=TL.T-.02){tvOn=false;tvDraw(TL.T-.05);if(cb&&cb.end)cb.end();else st3("Selesai.");return}
    const i=tvDraw(Math.max(0,t));if(cb&&cb.frame)cb.frame(Math.max(0,t));
    if(sp&&i!==lastI){lastI=i;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(sceneSay(TL.tl[i].s));u.lang="id-ID";speechSynthesis.speak(u)}
    requestAnimationFrame(f)})()}
$("#sj").addEventListener("input",()=>{VB=[];LS("draft",$("#sj").value)});
$("#vo").onchange=e=>{const f=e.target.files[0];tvAu=null;if(!f)return;tvAu=new Audio(URL.createObjectURL(f));tvAu.preload="auto";tvAu.onloadedmetadata=()=>{TL=build();st3("Voice over dimuat ("+Math.round(tvAu.duration)+" detik). Durasi scene menyesuaikan.")};tvAu.onerror=()=>toast("File audio itu tidak bisa dibaca.","bad")};
$("#tl").onclick=()=>{
  const L=$("#sc").value.split(/\n+/).map(s=>s.trim()).filter(Boolean);if(!L.length)return toast("Tulis naskah dulu, satu baris per scene.","bad");
  setSC(L.slice(0,12).map(l=>{const w=l.split(/\s+/),n=Math.min(2,w.length);return{kind:"title",head:(w.length>n?w.slice(0,-n).join(" ")+" ":"")+"*"+w.slice(-n).join(" ")+"*",say:l}}),{fx:"aurora",hd:"serifit"});st3("Scene dibuat dari teksmu ("+Math.min(12,L.length)+"). Klik Putar.")};
/* ---- serial ---- */
function serUI(){const m=$("#as").value,on=m==="serial"||m==="episode",n=SER&&SER.parts?SER.parts.length:0;$("#srbox").hidden=!on;$("#pre").closest("label").hidden=m!=="episode";
  $("#winl").textContent=m==="episode"?"Arah cerita berikutnya (opsional)":"Pilihan yang menang (untuk Part berikutnya)";$("#nxt").textContent=n?"Lanjut Part "+(n+1):"Lanjut Part 2";$("#nxt").disabled=!n;
  $("#srs").textContent=n?(SER.title||"Serial")+": Part "+n+" sudah dibuat. "+(m==="episode"?"Tulis arah cerita berikutnya bila ada, lalu klik Lanjut.":"Tulis pilihan yang menang (1, 2, atau pilihan sendiri), lalu klik Lanjut."):"Klik Buat video lengkap untuk membuat Part 1 dulu."}
$("#as").addEventListener("change",serUI);serUI();
/* ---- pembuatan scene oleh AI ---- */
async function makeScenes(P,o){
  o=o||{};const idea=$("#sc").value.trim(),mode=$("#as").value,epMode=mode==="episode"&&!o.next||(o.next&&SER&&SER.type==="episode"),ser=!epMode&&(mode==="serial"||o.next);
  if(!o.next&&!idea)throw new Error("Ketik pertanyaan, topik, atau ide cerita dulu.");
  const sample=await getSample();if(!sample)throw new Error(NOKEY);
  clearScenes(ser||epMode?"AI sedang menulis cerita\u2026":"AI sedang menulis scene dan memilih tampilan\u2026");
  if(epMode)return makeEpisode(P,o,idea,sample);
  const stop=P.creep("scene",ser?18:14,"AI menulis (perkiraan)");let r,fallback=false;
  try{
    let prompt;
    if(o.next){const last=SER.parts[SER.parts.length-1],n=SER.parts.length+1,win=($("#win").value||"").trim()||"pilihan 1";
      prompt=`Kamu penulis dan sutradara serial kartun interaktif vertikal 9:16 untuk TikTok dan Reels. LANJUTKAN SERIAL ke PART ${n}. Judul serial: ${SER.title||"-"}. Ringkasan cerita sejauh ini: ${SER.summary||"-"}. PART ${n-1} berisi: ${last.h1} ${last.h2}. Pilihan penonton: 1) ${last.choices[0]||""} 2) ${last.choices[1]||""}. Penonton memilih: ${win}. Lanjutkan cerita dari pilihan itu. Pakai tokoh, gaya, dan format yang sama. Ganti hari dan jam, kalimat besar, subtitle, dan 2 pilihan baru yang menarik. Tokoh (pakai persis): ${JSON.stringify(last.char)}. Balas hanya JSON: {"series":{"title":"${(SER.title||"").replace(/"/g,"'")}","summary":"ringkasan baru 2-3 kalimat"},"scenes":[${SERIAL_SPEC}]} dengan part=${n}. Tulis semuanya dalam bahasa Indonesia.`}
    else if(ser){
      prompt=`Kamu penulis dan sutradara serial kartun interaktif vertikal 9:16 untuk TikTok dan Reels. Pengguna mengetik ide cerita. Buat PART 1 sebagai pembuka yang membuat penonton penasaran. Tokoh utama adalah penonton ("KAMU"), manusia kartun 2D. Format: kalimat besar di atas diawali KAMU, dua subtitle narasi pendek bergantian, lalu kotak KAMU PILIH berisi 2 pilihan bernomor yang sama-sama menarik, lalu ajakan KOMEN 1 ATAU 2. Pilih latar tempat, langit, ekspresi, dan warna tokoh yang cocok dengan cerita. Balas hanya JSON: {"series":{"title":"judul serial","summary":"ringkasan 2 kalimat"},"scenes":[${SERIAL_SPEC}]}. Tulis semuanya dalam bahasa Indonesia.\n\nIDE CERITA:\n${idea.slice(0,6000)}`}
    else{
      prompt=`Kamu motion designer dan penulis konten video vertikal 9:16 untuk TikTok dan Reels. Pengguna mengetik pertanyaan atau topik (bisa sangat panjang; kalau panjang, ringkas jadi inti terpentingnya, jangan menyalin semuanya). Jawab isinya dengan benar, singkat, dan menarik, lalu ubah jadi 6 sampai 10 scene berbahasa Indonesia. Gaya animasi: ${AS[mode]||AS.auto}. Kamu juga mendesain tampilannya sendiri: pilih warna, efek latar, dan gaya judul yang paling cocok dengan suasana topik (misalnya religi: emas dan navy; teknologi: biru neon; anak: cerah; bisnis: bersih; alam: hijau). Pastikan teks terbaca jelas di atas latar. Setiap scene wajib punya "say": satu kalimat narasi natural, maksimal 16 kata, yang menjelaskan isi scene. Scene pertama hook kuat, terakhir ajakan (CTA) seperti follow atau simpan. Jenis scene dan isinya:\n${SCENE_SPEC}\nhead maksimal 5 kata; tanda *kata* menandai aksen. Balas hanya JSON objek: {${THEME_SPEC},"scenes":[...]}.\n\nPERTANYAAN ATAU TOPIK:\n${idea.slice(0,30000)}`}
    try{
      r=await aiRetry(async()=>{const x=await sample.json(prompt),a=arr(x,"scenes","scene");if(!a||!a.length)throw new Error("AI tidak menghasilkan scene");return{x,a}},3,"AI");
    }catch(e){
      if(ser||/Dibatalkan|^401\b|API key|kode akses|^403\b/i.test(e.message))throw e;
      fallback=true;P.warn("AI gagal ("+errMsg(e).slice(0,70)+"). Video dibuat dari teksmu apa adanya supaya tetap selesai.");toast("AI gagal, video dibuat dari teksmu apa adanya.","bad")}
  }finally{stop()}
  if(fallback){setSC(localScenes(idea),{fx:"aurora",hd:"serifit"});SER=null;serUI();P.fin("scene");return}
  const a=r.a,x=r.x;
  if(ser){let sc=cleanScene(a[0]);const prev=o.next?SER.parts[SER.parts.length-1]:null;
    if(prev){sc.char=prev.char;sc.part=SER.parts.length+1}else sc.part=1;
    if(!sc.subs.length)sc.subs=[sc.h1.toLowerCase()];if(sc.choices.length<2)sc.choices=["Pilihan 1","Pilihan 2"];
    const meta=(x&&x.series)||{};SER=prev?{...SER,summary:String(meta.summary||SER.summary||"").slice(0,500),parts:[...SER.parts,sc]}:{type:"serial",title:String(meta.title||"Serial MPN").slice(0,60),summary:String(meta.summary||"").slice(0,500),parts:[sc]};
    LS("series",JSON.stringify(SER));setSC([sc],null);serUI();$("#win").value=""}
  else setSC(a,x&&!Array.isArray(x)?x.theme:null);
  P.fin("scene")}
async function ensureVoice(P,strict){
  if((LS("vp")||"gemini")==="none"||(tvAu&&$("#vo").files[0])){P.fin("voice");return}
  try{await makeVoice(P)}
  catch(e){if(strict||/Dibatalkan|^401\b|API key|kode akses|Isi API key/i.test(e.message))throw e;
    VB=[];TL=build();P.warn("Suara gagal dibuat ("+errMsg(e).slice(0,80)+"). Video dibuat tanpa suara. Klik Buat suara nanti lalu Ekspor untuk menambahkannya.");toast("Suara gagal, video dibuat tanpa suara.","bad");P.fin("voice")}}
async function renderT2V(P,base){
  if(!window.MediaRecorder||!tv.captureStream)throw new Error("Browser belum mendukung ekspor video. Pakai Chrome, Edge, Firefox, atau Safari terbaru.");
  const pre=build();if(!pre)throw new Error("Scene belum valid. Cek kolom Edit scene (JSON).");tvStop();aud();
  const out=tv.captureStream(30),at=AU.dest.stream.getAudioTracks()[0];if(at)out.addTrack(at);
  const mt=recMime(),rec=new MediaRecorder(out,mt?{mimeType:mt}:undefined),ch=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
  const stopped=new Promise((res,rej)=>{rec.onstop=res;rec.onerror=e=>rej((e&&e.error)||new Error("Perekam video berhenti tiba-tiba."))});
  let lastF=performance.now(),dog,cancel=null;const g=guardTab(rec,tvPause,tvResume,P);P.hooks.push(()=>{tvStop();if(cancel)cancel(new Error("Dibatalkan."))});
  try{
    rec.start();
    await new Promise((res,rej)=>{cancel=rej;dog=setInterval(()=>{if(!document.hidden&&!GUARD.paused&&performance.now()-lastF>10000)rej(new Error("Render macet: tidak ada frame selama 10 detik."))},2000);
      tvPlay(pre,{frame:t=>{lastF=performance.now();P.set("rec",t/pre.T,Math.round(t)+" dari "+Math.round(pre.T)+" detik")},end:res})});
    if(rec.state!=="inactive")rec.stop();await stopped;
  }finally{clearInterval(dog);g();tvStop();if(rec.state!=="inactive"){try{rec.stop()}catch(e){}}}
  P.fin("rec");P.set("save",.5,"menyiapkan file");
  const blob=new Blob(ch,{type:mt||"video/webm"});if(!blob.size)throw new Error("Hasil video kosong.");
  const name=(base||"mpn-video")+EXT(mt),ok=await save(name,blob);showResult("#res3",blob,name,ok?"File sudah diunduh. Kalau tidak muncul, tekan tombol Unduh di atas.":"Tekan tombol Unduh di atas untuk menyimpan.");P.fin("save")}
const ST3={scene:{id:"scene",t:"AI menulis scene dan memilih tampilan",w:10},voice:{id:"voice",t:"Membuat suara",w:35},rec:{id:"rec",t:"Merender video (real-time)",w:50},save:{id:"save",t:"Menyimpan file",w:5}};
const serBase=()=>SER&&SER.parts.length&&SER.type==="episode"&&$("#as").value==="episode"?"mpn-episode-part"+SER.parts.length:SER&&SER.parts.length&&$("#as").value==="serial"?"mpn-serial-part"+SER.parts.length:"mpn-video";
$("#tg").onclick=()=>{if(!needAI())return;if($("#as").value==="serial"||$("#as").value==="episode"){SER=null;LS("series","")}const go=()=>run(PV,[{...ST3.scene,w:100}],makeScenes,"Scene siap. Edit bila perlu, lalu Buat suara atau Putar.",go);go()};
$("#tvc").onclick=()=>{const go=()=>run(PV,[{...ST3.voice,w:100}],async P=>{if(!build())throw new Error("Belum ada scene. Klik Buat scene dulu.");await ensureVoice(P,true)},"Suara selesai. Klik Putar atau Ekspor.",go);go()};
$("#tv0").onclick=()=>{if(!needAI())return;if($("#as").value==="serial"||$("#as").value==="episode"){SER=null;LS("series","");serUI()}
  const go=()=>run(PV,[ST3.scene,ST3.voice,ST3.rec,ST3.save],async P=>{await makeScenes(P);await ensureVoice(P);await renderT2V(P,serBase())},()=>"Video selesai dan tersimpan.",go);go()};
$("#nxt").onclick=()=>{if(!needAI())return;if(!SER||!SER.parts.length)return toast("Buat Part 1 dulu.","bad");
  const go=()=>run(PV,[ST3.scene,ST3.voice,ST3.rec,ST3.save],async P=>{await makeScenes(P,{next:true});await ensureVoice(P);await renderT2V(P,serBase())},()=>"Part "+SER.parts.length+" selesai dan tersimpan.",go);go()};
$("#te").onclick=()=>{const go=()=>run(PV,[{...ST3.voice,w:35},{...ST3.rec,w:60},ST3.save],async P=>{if(!build())throw new Error("Belum ada scene. Klik Buat scene dulu.");await ensureVoice(P);await renderT2V(P,serBase())},"Video selesai dan tersimpan.",go);go()};
$("#tp").onclick=()=>{if(tvOn){tvStop();st3("Berhenti.")}else tvPlay()};

async function makeEpisode(P,o,idea,sample){
  const stop=P.creep("scene",24,"AI menulis episode (perkiraan)"),prev=o.next?SER.ep:null,userPre=$("#pre").value,ch=$("#hd").value.trim(),win=($("#win").value||"").trim();let ep,fallback=false;
  const msg=prev?`LANJUTKAN EPISODE ke PART ${prev.part+1}. Judul serial: ${prev.title}. Ringkasan sampai sekarang: ${prev.logline}. Arah cerita berikutnya dari pengguna: ${win||"bebas, lanjutkan secara menarik"}. Pakai visual_preset, palette, dan tokoh yang sama persis (salin ke episode.visual_preset, episode.palette, episode.characters). Perbarui episode.logline menjadi ringkasan terbaru dan isi episode.part=${prev.part+1}.`:`IDE ATAU TOPIK DARI PENGGUNA (bisa sangat panjang; ringkas inti ceritanya jadi episode):\n${idea.slice(0,30000)}\n\n${userPre?"Pakai visual_preset: "+userPre+".":"Pilih visual_preset yang paling cocok dengan nada topik."}`;
  try{
    try{ep=await aiRetry(async()=>{const x=await geminiJson(msg,[],300000,{system:EP_SYSTEM,schema:EP_SCHEMA}),r=normEp(x,{preset:userPre,channel:ch,prev});if(r.scenes.length<3)throw new Error("AI membuat episode terlalu pendek");return r},3,"AI")}
    catch(e){if(prev||/Dibatalkan|^401\b|API key|kode akses|^403\b/i.test(e.message))throw e;fallback=true;P.warn("AI gagal ("+errMsg(e).slice(0,70)+"). Episode dibuat dari teksmu apa adanya supaya tetap selesai.");toast("AI gagal, episode dibuat dari teksmu apa adanya.","bad");ep=localEpisode(idea,{preset:userPre,channel:ch})}
  }finally{stop()}
  EPI=ep.meta;SER={type:"episode",title:ep.meta.title,summary:ep.meta.logline,ep:ep.meta,parts:[...(prev&&SER?SER.parts:[]),{part:ep.meta.part}]};LS("series",JSON.stringify(SER));
  setSC(ep.scenes,null,ep.meta);serUI();$("#win").value="";P.fin("scene")}
