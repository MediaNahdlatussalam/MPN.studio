/* ===== Lapisan AI: Gemini (key sendiri atau server bersama), Whisper, suara ===== */
const GB="https://generativelanguage.googleapis.com/v1beta/";let MODELS={gt:[],gv:[]},VC=new Map(),VB=[],ASR=null;
(function join(){try{const m=location.hash.match(/^#join=(.+)$/);if(!m)return;const o=JSON.parse(decodeURIComponent(escape(atob(m[1]))));if(o.p&&o.c){LS("px",o.p);LS("pc",o.c);history.replaceState(null,"",location.pathname+location.search);setTimeout(()=>toast("Terhubung ke server bersama. Siap dipakai!"),300)}}catch(e){}})();
const AIK=()=>!!(LS("gk")||LS("px")),gbase=()=>LS("px")?LS("px").trim().replace(/\/+$/,"")+"/v1beta/":GB,ghead=()=>LS("px")?{"x-access-code":LS("pc")}:{"x-goog-api-key":LS("gk")};
async function fetchT(u,o={},ms=120000){
  const c=new AbortController(),on=()=>c.abort(),sc=window.__tscale||1,tm=setTimeout(()=>{c.__to=1;c.abort()},ms*sc);AB.signal.addEventListener("abort",on);
  try{return await fetch(u,{...o,signal:c.signal})}
  catch(e){if(AB.signal.aborted)throw new Error("Dibatalkan.");if(c.__to)throw new Error("waktu habis ("+Math.round(ms/1000)+" dtk)");throw e}
  finally{clearTimeout(tm);AB.signal.removeEventListener("abort",on)}}
async function gem(model,body,ms){
  const r=await fetchT(gbase()+"models/"+model+":generateContent",{method:"POST",headers:{"Content-Type":"application/json",...ghead()},body:JSON.stringify(body)},ms||120000);
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(r.status+" "+((j.error&&j.error.message)||"permintaan gagal"));
  if(j.promptFeedback&&j.promptFeedback.blockReason)throw new Error("SAFETY "+j.promptFeedback.blockReason);return j}
async function gen(body,kind,ms){
  const list=[LS(kind),...(MODELS[kind]||[])].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,4);
  if(!list.length)list.push(kind==="gv"?"gemini-2.5-flash-preview-tts":"gemini-2.5-flash");
  let err;
  for(let round=0;round<3;round++){
    let quota=false;
    for(const m of list){
      for(let a=0;a<3;a++){
        try{return await gem(m,body,ms)}catch(e){err=e;const s=e.message;
          if(/Dibatalkan/.test(s))throw e;
          if(/^(500|502|503|504)\b|overloaded|unavailable/i.test(s)){if(a<2){NOTE("Server Google sibuk, mencoba lagi\u2026");await sleep(3000*(a+1));continue}break}
          if(/^(404|403)\b|not found|not supported/i.test(s))break;
          if(/^429\b|exhausted|quota/i.test(s)){if(/PerDay|per day|daily/i.test(s))throw e;quota=true;break}
          throw e}}}
    if(!quota)throw err;
    const w=Math.min(65,Math.max(8,+((err.message.match(/retry in ([\d.]+)s/i)||err.message.match(/"retryDelay":\s*"(\d+)/)||[])[1])||30));
    if(round<2)await waitSec(w,"Kuota gratis penuh, menunggu");
  }
  throw err}
const gtext=j=>{const c=j.candidates&&j.candidates[0];if(!c)throw new Error("AI tidak memberi jawaban.");const t=((c.content&&c.content.parts)||[]).map(p=>p.text||"").join("");if(!t&&/SAFETY|PROHIBITED|BLOCK/.test(c.finishReason||""))throw new Error("SAFETY "+c.finishReason);return t};
const NOTHINK=new Set();
function salvage(tx){
  const m=tx.search(/"scenes"\s*:\s*\[/),i=m>=0?tx.indexOf("[",m):tx.indexOf("[");if(i<0)return null;const out=[];let d=0,st=-1,ins=false,esc=false;
  for(let k=i+1;k<tx.length;k++){const c=tx[k];if(ins){if(esc)esc=false;else if(c==="\\")esc=true;else if(c==='"')ins=false;continue}
    if(c==='"'){ins=true;continue}if(c==="{"){if(d===0)st=k;d++}else if(c==="}"){d--;if(d===0&&st>=0){try{out.push(JSON.parse(tx.slice(st,k+1)))}catch(e){}st=-1}}}
  return out.length?out:null}
const NOSCHEMA=new Set();
async function geminiJson(p,parts=[],ms,opts){
  opts=opts||{};
  const body=()=>({...(opts.system?{systemInstruction:{parts:[{text:opts.system}]}}:{}),contents:[{parts:[...parts,{text:p}]}],generationConfig:{responseMimeType:"application/json",temperature:opts.temp||.7,maxOutputTokens:16384,...(opts.schema&&!NOSCHEMA.has("x")?{responseSchema:opts.schema}:{}),...(NOTHINK.has("x")?{}:{thinkingConfig:{thinkingBudget:0}})}});
  let j,err;
  for(let k=0;k<3&&!j;k++){
    try{j=await gen(body(),"gt",ms||180000)}
    catch(e){err=e;const m=e.message||"";
      if(/^400\b/.test(m)&&/think/i.test(m)&&!NOTHINK.has("x"))NOTHINK.add("x");
      else if(/^400\b/.test(m)&&/schema|unknown name|enum|propert|nesting|too complex/i.test(m)&&opts.schema&&!NOSCHEMA.has("x"))NOSCHEMA.add("x");
      else throw e}}
  if(!j)throw err;
  const tx=gtext(j).replace(/^\s*```(?:json)?/i,"").replace(/```\s*$/,"").trim();if(!tx)throw new Error("AI membalas kosong, coba lagi.");
  try{return JSON.parse(tx)}catch(e){const m=tx.match(/[\[{][\s\S]*[\]}]/);if(m){try{return JSON.parse(m[0])}catch(e2){}}const sv=salvage(tx);if(sv)return sv;throw new Error("Balasan AI terpotong atau rusak, coba lagi.")}}
async function aiRetry(fn,tries,label){
  let err;for(let a=1;a<=tries;a++){try{return await fn(a)}catch(e){err=e;if(a===tries||/Dibatalkan|^401\b|API key|PerDay|per day|kode akses|^403\b/i.test(e.message))throw e;NOTE((label||"AI")+" gagal ("+(e.message||"").slice(0,50)+"), mencoba lagi "+(a+1)+"/"+tries+"\u2026");await sleep(2500*a)}}throw err}
function localScenes(text){
  const sents=String(text).replace(/\s+/g," ").match(/[^.!?]+[.!?]*/g)||[String(text)],out=[],goal=Math.max(110,Math.ceil(String(text).length/10));let cur="";
  sents.forEach(s=>{s=s.trim();if(!s)return;if(cur&&(cur+" "+s).length>goal&&out.length<11){out.push(cur);cur=s}else cur=cur?cur+" "+s:s});if(cur)out.push(cur);
  return out.slice(0,12).map((l,i)=>{const w=l.split(/\s+/).slice(0,6),n=Math.min(2,w.length);return{kind:i%3===1?"kin":"title",head:w.slice(0,-n).join(" ")+(w.length>n?" ":"")+"*"+w.slice(-n).join(" ")+"*",say:l.slice(0,300)}})}
const arr=(r,...k)=>Array.isArray(r)?r:(r&&typeof r==='object'?(k.map(x=>r[x]).find(Array.isArray)||null):null);
async function getSample(){return AIK()?{json:p=>geminiJson(p)}:null}
async function loadModels(){
  if(LS("px")&&!/^https?:\/\//.test(LS("px")))throw new Error("Alamat server harus diawali https://");
  const r=await fetchT(gbase()+"models?pageSize=200",{headers:ghead()},30000),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(r.status+" "+((j.error&&j.error.message)||"key atau kode ditolak"));
  const ms=(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>m.name.replace("models/","")),ver=n=>{const m=n.match(/gemini-(\d+(?:\.\d+)?)/);return m?+m[1]:0};
  const stable=n=>/^gemini-\d+(\.\d+)?-flash$/.test(n)?1:0;
  MODELS.gt=ms.filter(n=>/flash/.test(n)&&!/tts|image|live|audio|embed|lite|thinking|exp|robotics|computer|native|omni|gemma/.test(n)).sort((a,b)=>stable(b)-stable(a)||ver(b)-ver(a)||a.length-b.length);
  MODELS.gv=ms.filter(n=>/tts/.test(n)).sort((a,b)=>ver(b)-ver(a));
  ["gt","gv"].forEach(id=>{const s=$("#"+id),c=LS(id);s.textContent="";MODELS[id].forEach(n=>s.add(new Option(n,n)));if(c&&MODELS[id].includes(c))s.value=c;else if(MODELS[id][0])LS(id,s.value=MODELS[id][0])});
  return MODELS}
/* ---- suara ---- */
async function ttsGemini(text){
  const j=await gen({contents:[{parts:[{text}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:LS("vv")||"Kore"}}}}},"gv",240000);
  const pt=((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[]).find(p=>p.inlineData||p.inline_data);if(!pt)throw new Error("Model suara tidak mengembalikan audio. Pilih model suara lain di Pengaturan AI.");
  const d=pt.inlineData||pt.inline_data,bin=atob(d.data),n=bin.length>>1,f=new Float32Array(n),rate=+((d.mimeType||d.mime_type||"").match(/rate=(\d+)/)||[0,24000])[1];
  if(n<1200)throw new Error("Audio suara kosong, coba lagi.");
  for(let i=0;i<n;i++){let v=bin.charCodeAt(2*i)|(bin.charCodeAt(2*i+1)<<8);if(v>32767)v-=65536;f[i]=v/32768}
  const b=aud().c.createBuffer(1,n,rate);b.copyToChannel(f,0);return b}
function splitAudio(buf,w){
  const f=buf.getChannelData(0),sr=buf.sampleRate,n=f.length,hop=Math.round(sr*.02),env=[];
  for(let i=0;i<n;i+=hop){let a=0,c=0;for(let j=i;j<Math.min(n,i+hop);j+=2){a+=f[j]*f[j];c++}env.push(Math.sqrt(a/Math.max(1,c)))}
  const tot=w.reduce((a,b)=>a+b,0),cuts=[0],R=Math.round(1.3/.02);let cum=0,prev=0;
  for(let i=0;i<w.length-1;i++){cum+=w[i];const exp=Math.round(env.length*cum/tot),lo=Math.max(prev+12,exp-R),hi=Math.min(env.length-12,exp+R);let best=Math.min(Math.max(exp,lo),hi),bv=Infinity;
    for(let k=lo;k<=hi;k++){const e=((env[k-2]||0)+(env[k-1]||0)+env[k]+(env[k+1]||0)+(env[k+2]||0))/5+Math.abs(k-exp)*.00012;if(e<bv){bv=e;best=k}}
    cuts.push(best);prev=best}
  cuts.push(env.length);const A=aud().c;
  return w.map((_,i)=>{const a=cuts[i]*hop,b=Math.min(n,cuts[i+1]*hop),len=Math.max(1200,b-a),o=A.createBuffer(1,len,sr),d=new Float32Array(len);d.set(f.subarray(a,Math.min(n,a+len)));o.copyToChannel(d,0);return o})}
const quotaErr=e=>/^429\b|exhausted|quota/i.test(e&&e.message||"");
async function ttsGroup(texts){
  if(texts.length===1)return[await ttsGemini(texts[0])];
  try{const whole=await ttsGemini(texts.join("\n\n"));if(whole.duration>=texts.length*.7)return splitAudio(whole,texts.map(t=>t.length+12))}
  catch(e){if(/Dibatalkan|^401\b|API key|PerDay|per day/i.test(e.message)||quotaErr(e))throw e}
  const out=[];for(const t of texts)out.push(await ttsGemini(t));return out}
async function ttsEleven(text){
  const r=await fetchT("https://api.elevenlabs.io/v1/text-to-speech/"+(LS("ei")||"21m00Tcm4TlvDq8ikWAM")+"?output_format=mp3_44100_128",{method:"POST",headers:{"xi-api-key":LS("ek"),"Content-Type":"application/json"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2"})},120000);
  if(!r.ok)throw new Error("ElevenLabs "+r.status+": cek key, voice ID, dan sisa kuota ElevenLabs.");
  return await aud().c.decodeAudioData(await r.arrayBuffer())}
async function voiceFor(text){
  const pv=LS("vp")||"gemini",key=pv+"|"+(pv==="eleven"?LS("ei"):LS("vv"))+"|"+text;if(VC.has(key))return VC.get(key);
  const b=pv==="eleven"?await ttsEleven(text):await ttsGemini(text);VC.set(key,b);return b}
const sceneSay=s=>{let t=s.say||(s.kind==="serial"?(s.subs||[]).join(" "):"")||String(s.head||"").replace(/\*/g,"");t=t.trim();return/[.!?\u2026]$/.test(t)?t:t+"."};
async function makeVoice(P){
  const pv=LS("vp")||"gemini";if(pv==="none"){P&&P.fin("voice");return true}
  if(pv==="gemini"&&!AIK())throw new Error(NOKEY+" Atau pilih Tanpa suara.");
  if(pv==="eleven"&&!LS("ek"))throw new Error("Isi API key ElevenLabs di Pengaturan AI.");
  if(!build())throw new Error("Belum ada scene yang valid.");aud();const n=SC.length,texts=SC.map(sceneSay),out=[];
  if(pv==="eleven"){for(let i=0;i<n;i++){P&&P.set("voice",i/n,"suara "+(i+1)+" dari "+n);out.push(await voiceFor(texts[i]))}}
  else{
    const groups=[];let cur=[],len=0;texts.forEach((t,i)=>{if(cur.length&&len+t.length>2600){groups.push(cur);cur=[];len=0}cur.push(i);len+=t.length+2});if(cur.length)groups.push(cur);
    for(let g=0;g<groups.length;g++){P&&P.set("voice",g/groups.length,"suara bagian "+(g+1)+" dari "+groups.length);
      const idx=groups[g],gt=idx.map(i=>texts[i]),key="g|"+(LS("vv")||"Kore")+"|"+gt.join("\n\n");let bufs=VC.get(key);
      if(!bufs){bufs=await aiRetry(()=>ttsGroup(gt),2,"Suara");VC.set(key,bufs)}idx.forEach((i,k)=>{out[i]=bufs[k]})}}
  VB=out;TL=build();P&&P.fin("voice");return true}
/* ---- transkrip ---- */
const ts=v=>typeof v==="number"?v:String(v).split(":").reduce((a,b)=>a*60+ +b,0);
const normSegs=a=>(Array.isArray(a)?a:[]).map(o=>({t:ts(o.t!=null?o.t:o.start),text:String(o.text||"").trim()})).filter(o=>isFinite(o.t)&&o.text);
async function pcm16k(f){
  try{const c=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,1,16000);return(await c.decodeAudioData(await f.arrayBuffer())).getChannelData(0)}
  catch(e){throw new Error("decode: audio video tidak bisa dibaca ("+(e&&e.message||e)+")")}}
function wavB64(f){const n=f.length,b=new Uint8Array(44+n*2),dv=new DataView(b.buffer),w=(o,s)=>[...s].forEach((c,i)=>dv.setUint8(o+i,c.charCodeAt(0)));
  w(0,"RIFF");dv.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,16000,true);dv.setUint32(28,32000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);w(36,"data");dv.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,f[i]));dv.setInt16(44+i*2,v<0?v*32768:v*32767,true)}
  let s="";for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(s)}
async function trGemini(f){return normSegs(await geminiJson('Transkripsi audio ini dalam bahasa aslinya. Balas hanya JSON array [{"t":detik_mulai_angka,"text":"kalimat"}], satu entri tiap kalimat atau tiap 3 sampai 6 detik ucapan, urut waktu.',[{inline_data:{mime_type:"audio/wav",data:wavB64(f)}}],300000))}
async function whisper(f,P,sec){
  const m=LS("wm")||"tiny";
  if(!ASR||ASR.m!==m){
    let lib;try{lib=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1")}catch(e){throw new Error("Gagal memuat Whisper dari internet. Cek koneksi, atau pakai Gemini sebagai mesin transkrip.")}
    lib.env.allowLocalModels=false;const gpu=!!(navigator.gpu&&await navigator.gpu.requestAdapter().catch(()=>null)),seen={};
    try{ASR={m,p:await lib.pipeline("automatic-speech-recognition","onnx-community/whisper-"+m,{device:gpu?"webgpu":"wasm",progress_callback:p=>{if(p.status==="progress"&&p.file){seen[p.file]=p.progress||0;const v=Object.values(seen),a=v.reduce((x,y)=>x+y,0)/v.length;P.set("tr",.1+.4*a/100,"mengunduh model Whisper "+Math.round(a)+"%")}}})}}
    catch(e){throw new Error("Whisper gagal dimuat: "+(e&&e.message||e)+". Coba ukuran tiny atau pakai Gemini.")}}
  const stop=P.creep("tr",Math.max(20,sec/4),"Whisper mentranskrip di perangkatmu");
  try{const o=await ASR.p(f,{language:"indonesian",task:"transcribe",return_timestamps:true,chunk_length_s:30,stride_length_s:5});
    return(o.chunks||[]).map(c=>({t:(c.timestamp&&c.timestamp[0])||0,text:String(c.text||"").trim()})).filter(c=>c.text)}finally{stop()}}
async function transcribeFile(P){
  P.set("tr",.02,"membaca audio dari video");const f=await pcm16k(vfile),eng=LS("tre")||"auto",ok=AIK()&&f.length*2*1.34<19e6;let segs;
  if(eng==="gemini"||(eng==="auto"&&ok)){
    if(!AIK())throw new Error(NOKEY);if(!ok)throw new Error("Audio terlalu panjang untuk Gemini (maksimal sekitar 7 menit). Pilih Whisper di Pengaturan AI.");
    const stop=P.creep("tr",30,"Gemini mentranskrip (perkiraan)");try{segs=await trGemini(f)}finally{stop()}}
  else segs=await whisper(f,P,f.length/16000);
  if(!segs.length)throw new Error("Tidak ada ucapan yang terdeteksi di video ini.");
  $("#tr").value=segs.map(g=>tfmt(g.t)+" "+g.text).join("\n");parseTr($("#tr").value);P.fin("tr");return segs}
async function ytFlow(url,P){
  const id=ytId(url);if(!id)throw new Error("Link YouTube tidak dikenali. Tempel link lengkap, misalnya https://youtu.be/xxxx.");if(!AIK())throw new Error(NOKEY);
  const L=+$("#len").value,N=Math.max(1,Math.min(10,+$("#cnt").value||4)),stop=P.creep("tr",70,"Gemini menonton video (perkiraan)");let r;
  try{r=await aiRetry(()=>geminiJson(`Tonton video ini. Balas JSON {"transcript":[{"t":detik,"text":"kalimat"}],"moments":[{"start":detik,"end":detik,"score":1-99,"title":"judul singkat","hook":"hook maksimal 8 kata","why":"alasan skor, satu kalimat"}]}. transcript: satu entri tiap kalimat atau tiap 3 sampai 6 detik ucapan, bahasa asli video, urut waktu, seluruh video. moments: pilih ${N} momen terbaik berdurasi sekitar ${L} detik (selisih maksimal 10 detik), tanpa tumpang tindih, mulai di awal kalimat dan berhenti di akhir kalimat. Skor menilai potensi viral dari hook 3 detik pertama, emosi, kejutan, nilai informasi, dan kelengkapan cerita. Semua waktu dalam detik (angka).`,[{file_data:{file_uri:"https://www.youtube.com/watch?v="+id}}],600000),2,"Video")}finally{stop()}
  if(!r||typeof r!=="object")throw new Error("Balasan AI tidak sesuai format, coba lagi.");
  const segs=normSegs(r.transcript);if(!segs.length)throw new Error("Gemini tidak bisa membaca ucapan di video ini (mungkin video privat, dibatasi umur, atau tanpa suara).");
  $("#tr").value=segs.map(g=>tfmt(g.t)+" "+g.text).join("\n");parseTr($("#tr").value);
  clips=(Array.isArray(r.moments)?r.moments:[]).filter(o=>o&&ts(o.end)>ts(o.start)).slice(0,N).map(o=>({s:Math.max(0,ts(o.start)),l:Math.min(90,ts(o.end)-ts(o.start)),sc:Math.round(+o.score)||null,t:String(o.title||"").slice(0,60),h:String(o.hook||"").slice(0,60),w:String(o.why||"").slice(0,160)})).sort((a,b)=>(b.sc||0)-(a.sc||0));
  cur=clips[0]||null;if(cur&&cur.h)$("#hook").value=cur.h;show();P.fin("tr");if(!clips.length)throw new Error("Transkrip didapat, tapi AI tidak menemukan momen. Klik Cari momen dari transkrip.")}
async function findMoments(P){
  const segs=parseTr($("#tr").value);if(!segs.length)throw new Error("Belum ada transkrip.");const sample=await getSample();if(!sample)throw new Error(NOKEY);
  const L=+$("#len").value,N=Math.max(1,Math.min(10,+$("#cnt").value||4)),end=Math.round(segs[segs.length-1].t+4),tx=segs.map(g=>Math.floor(g.t)+"s: "+g.text).join("\n").slice(0,200000),stop=P.creep("mo",15,"AI membaca transkrip (perkiraan)");let r;
  try{r=await aiRetry(()=>sample.json(`Kamu editor klip short-form (TikTok, Reels, Shorts). Dari transkrip berikut (format: detik lalu teks), pilih ${N} momen terbaik berdurasi sekitar ${L} detik (boleh selisih 10 detik), tanpa tumpang tindih, mulai di awal kalimat dan berhenti di akhir kalimat. Nilai potensi viral 1-99 dari kekuatan hook di 3 detik pertama, emosi, kejutan, nilai informasi, dan kelengkapan cerita. Balas hanya JSON array berisi objek {"start":detik,"end":detik,"score":angka,"title":"judul singkat","hook":"teks hook maksimal 8 kata","why":"alasan skor, satu kalimat"}. Durasi video sekitar ${end} detik.\n\nTRANSKRIP:\n${tx}`),3,"Momen")}finally{stop()}
  clips=(arr(r,"moments","clips")||[]).filter(o=>o&&ts(o.end)>ts(o.start)).slice(0,N).map(o=>({s:Math.max(0,ts(o.start)),l:Math.min(90,ts(o.end)-ts(o.start)),sc:Math.round(+o.score)||null,t:String(o.title||"").slice(0,60),h:String(o.hook||"").slice(0,60),w:String(o.why||"").slice(0,160)})).sort((a,b)=>(b.sc||0)-(a.sc||0));
  if(!clips.length)throw new Error("AI tidak menemukan momen. Coba lagi atau pakai tombol cari dari suara.");
  cur=clips[0];if(cur.h)$("#hook").value=cur.h;show();P.fin("mo")}
async function autoEdit(P){
  const segs=parseTr($("#tr").value);if(!segs.length)throw new Error("Belum ada transkrip.");if(!cur)throw new Error("Pilih klip dulu.");const sample=await getSample();if(!sample)throw new Error(NOKEY);
  aud();route(vid);const a=cur.s,b=cur.s+cur.l,k=TH[$("#cs").value]?$("#cs").value:"neon",tx=segs.filter(g=>g.t>=a-3&&g.t<b).map(g=>g.t.toFixed(1)+"s: "+g.text).join("\n"),stop=P.creep("ae",20,"AI mendesain efek (perkiraan)");let r;
  try{r=await aiRetry(()=>sample.json(`Kamu editor video vertikal (TikTok, Reels, Shorts) bergaya motion graphic. Video ini talking-head, potongan dari detik ${a.toFixed(1)} sampai ${b.toFixed(1)}. Template visual: ${TH[k].n}. Rancang efek dari transkrip (format: detik lalu teks). Semua waktu t dan d dalam detik video asli. Jenis efek:
{"type":"pill","t":0,"d":2.5,"icon":"emoji","title":"maks 3 kata","sub":"maks 4 kata"} kartu kecil kiri atas untuk istilah, nama tool, atau angka penting.
{"type":"text","t":0,"d":2.5,"head":"judul pendek dengan *aksen*"} teks besar di atas untuk hook atau poin utama.
{"type":"scene","t":0,"d":5,"scene":{...}} layar penuh, 1 sampai 3 kali saja. Isi scene salah satu dari: {"kind":"title","small":"","head":"judul *aksen*","sub":"","icon":"bulan|target|mahkota|hati|centang|bintang|tanya|api|timbangan|orang|panah|petir|buku|jam|uang|mata|cahaya|silang|rumah"}, {"kind":"list","head":"","items":[{"i":"emoji","t":"","s":""}]} (2-4 item), {"kind":"terminal","tag":"LANGKAH 1 DARI 3","head":"","sub":"","win":"nama.txt","lines":[""]} (2-5 baris), {"kind":"stat","head":"","value":"-11%","sub":"","bar":50}, {"kind":"steps","head":"","items":[{"t":""}]}, {"kind":"chart","head":"","pts":[10,40,80],"labels":["",""]}.
{"type":"fx","t":0,"d":2,"fx":"zoom|snap|glow|orbit"} efek pada video: zoom perlahan, snap zoom cepat pada kalimat penting, glow tepi, ikon mengorbit.
{"type":"chat","t":0,"d":5,"msgs":[{"me":true,"t":""},{"me":false,"t":""}]} pop-up chat.
{"type":"badge","t":0,"d":3,"title":"02","sub":"/ 10","label":"Zoom"} penghitung, hanya jika isinya daftar bernomor.
Pakai 8 sampai 16 efek yang bervariasi dan tersebar rata, scene tidak tumpang tindih dengan scene, teks pendek, bahasa sama dengan transkrip. Semua t harus antara ${a.toFixed(1)} dan ${b.toFixed(1)}. Balas hanya JSON array.\n\nTRANSKRIP:\n${tx}`),3,"Auto edit")}finally{stop()}
  EV=(arr(r,"events","effects","efek")||[]).map(cleanEv).filter(e=>e&&e.t>=a&&e.t<b).slice(0,20);FIR.clear();
  if(!EV.length)throw new Error("AI tidak menghasilkan efek yang valid. Coba lagi.");
  P.fin("ae");if(vfile){vid.currentTime=a;vid.play().catch(()=>{})}}
