/* ===== Pengaturan, cek kesiapan, undangan ===== */
document.querySelectorAll("[data-ls]").forEach(e=>{const v=LS(e.id);if(v)e.value=v;const sv=()=>LS(e.id,e.value);e.addEventListener("change",sv);e.addEventListener("input",sv)});
$("#gs").onclick=async()=>{freshAB();LS("gk",$("#gk").value.trim());LS("px",$("#px").value.trim());LS("pc",$("#pc").value.trim());const s=$("#gst");s.textContent="Mengecek\u2026";
  try{await loadModels();s.textContent=(LS("px")?"Server terhubung. ":"Key valid. ")+"Model teks: "+(LS("gt")||"-")+(MODELS.gv.length?", suara: "+(LS("gv")||"-"):". Model suara tidak ditemukan di akunmu.")}catch(e){s.textContent="Gagal: "+errMsg(e)}};
$("#inv").onclick=async()=>{
  if(!LS("px")||!LS("pc"))return toast("Isi Alamat server dan Kode akses dulu, lalu klik Simpan dan cek.","bad");
  const u=location.href.split("#")[0]+"#join="+btoa(unescape(encodeURIComponent(JSON.stringify({p:LS("px"),c:LS("pc")}))));
  try{await navigator.clipboard.writeText(u);toast("Link undangan disalin. Kirim hanya ke orang yang kamu percaya.")}catch(e){prompt("Salin link undangan ini:",u)}};
$("#dg").onclick=async()=>{
  freshAB();const out=$("#dgo");out.textContent="";const add=(ok,t)=>{const li=document.createElement("li");li.className=ok===null?"":ok?"ok":"bad";li.textContent=(ok===null?"\u2139 ":ok?"\u2713 ":"\u2715 ")+t;out.appendChild(li)};
  add(!!window.MediaRecorder&&!!HTMLCanvasElement.prototype.captureStream,"Perekam video di browser ("+(recMime()||"tidak ada format")+")");
  add(!!(window.AudioContext||window.webkitAudioContext),"Pemrosesan audio dan sound effect");
  add((()=>{try{localStorage.setItem("ms_t","1");localStorage.removeItem("ms_t");return true}catch(e){return false}})(),"Penyimpanan pengaturan di browser");
  add(null,"WebGPU untuk Whisper: "+(navigator.gpu?"tersedia":"tidak ada (Whisper tetap jalan, lebih lambat)"));
  if(!AIK()){add(false,"Belum ada API key atau server. Isi di atas lalu klik Simpan dan cek.");return}
  try{await loadModels();add(true,(LS("px")?"Server bersama terhubung":"API key valid")+". Model teks: "+(LS("gt")||"?"))}catch(e){add(false,"Koneksi AI gagal: "+errMsg(e));return}
  try{const r=await geminiJson('Balas JSON {"ok":true}');add(!!(r&&r.ok),"Tes AI teks")}catch(e){add(false,"Tes AI teks gagal: "+errMsg(e))}
  if((LS("vp")||"gemini")!=="none"){try{const b=await voiceFor("Halo, ini tes suara.");add(true,"Tes suara berhasil ("+b.duration.toFixed(1)+" detik)")}catch(e){add(false,"Tes suara gagal: "+errMsg(e))}}};
try{const d=LS("draft");if(d&&!$("#sj").value){try{const th=JSON.parse(LS("theme")||"null");if(th)TH.ai=makeTheme(th)}catch(e){}$("#sj").value=d;TL=build();if(TL){tvDraw(.9);st3("Draf scene terakhir dipulihkan.")}}}catch(e){}
if(AIK())loadModels().catch(()=>{});
/* ===== PWA: bisa dipasang di layar utama dan dibuka offline ===== */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register("sw.js").then(r=>{r.addEventListener("updatefound",()=>{const n=r.installing;if(n)n.addEventListener("statechange",()=>{if(n.state==="installed"&&navigator.serviceWorker.controller)toast("Versi baru siap. Muat ulang halaman untuk memakainya.")})})}).catch(()=>{});
}
