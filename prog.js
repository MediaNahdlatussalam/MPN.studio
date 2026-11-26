/* ===== Progres, notifikasi, penanganan kesalahan ===== */
const PROGHTML='<div class="pt"><b class="pp">0%</b><span class="ps"></span></div><div class="pbar"><i></i></div><ol class="pl"></ol><div class="pw" hidden></div><div class="pe" hidden></div><div class="pa"><button class="btn alt pc" type="button">Batalkan</button><button class="btn px" type="button" hidden>Coba lagi</button></div>';
let NOTE=()=>{},AB=new AbortController(),KEEP=null,ACTIVE=false;const GUARD={paused:false};
const freshAB=()=>{AB=new AbortController()},sleep=ms=>new Promise(r=>setTimeout(r,ms*(window.__tscale||1)));
function toast(m,k){const t=$("#toast");t.textContent=m;t.className="toast "+(k||"");t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true},k==="bad"?14000:4500)}
$("#toast").onclick=()=>{$("#toast").hidden=true};
function explain(e){
  const m=String((e&&e.message)||e||"");
  if(/Dibatalkan/.test(m))return{msg:"Dibatalkan.",hint:""};
  if(/API key not valid|API_KEY_INVALID|key.*(invalid|expired)|^400.*key/i.test(m))return{msg:"API key Gemini tidak valid.",hint:"Buat key baru di aistudio.google.com/apikey lalu simpan di Pengaturan AI."};
  if(/^401\b|kode akses/i.test(m))return{msg:"Kode akses server salah.",hint:"Minta kode yang benar dari pemilik server."};
  if(/PerDay|per day|daily/i.test(m))return{msg:"Kuota harian gratis habis.",hint:"Coba lagi besok, atau pakai API key lain."};
  if(/^429\b|exhausted|quota|rate.?limit/i.test(m))return{msg:"Kuota gratis sedang penuh.",hint:"Tunggu sekitar 1 menit lalu klik Coba lagi."};
  if(/^(404)\b|not found|not supported/i.test(m))return{msg:"Model AI tidak tersedia untuk akunmu.",hint:"Buka Pengaturan AI, klik Simpan dan cek key, lalu pilih model lain."};
  if(/^403\b|permission|forbidden|location|not available in your/i.test(m))return{msg:"Akses ditolak oleh Google.",hint:"Key mungkin dibatasi atau wilayahmu belum didukung. Coba key lain."};
  if(/^(500|502|503|504)\b|overload|unavailable|internal/i.test(m))return{msg:"Server Google sedang sibuk.",hint:"Coba lagi beberapa menit lagi."};
  if(/SAFETY|blocked|PROHIBITED/i.test(m))return{msg:"Permintaan ditolak oleh filter keamanan AI.",hint:"Ubah topik atau kata-katanya."};
  if(/Failed to fetch|NetworkError|network|offline|load failed/i.test(m))return{msg:"Tidak bisa terhubung ke server AI.",hint:"Cek internet, matikan VPN atau pemblokir iklan, lalu coba lagi."};
  if(/waktu habis|timeout|abort/i.test(m))return{msg:"Permintaan terlalu lama dan dihentikan.",hint:"Coba lagi. Untuk video panjang, pakai klip yang lebih pendek."};
  if(/decode|EncodingError|unable to decode/i.test(m))return{msg:"Audio dari video tidak bisa dibaca browser.",hint:"Ubah video ke MP4 (H.264) lalu unggah lagi."};
  return{msg:m.slice(0,170)||"Terjadi kesalahan.",hint:"Coba lagi. Kalau berulang, buka Pengaturan AI dan klik Cek kesiapan."}}
const errMsg=e=>{const x=explain(e);return(x.msg+" "+x.hint).trim()};
async function keepAwake(on){try{if(on){if(navigator.wakeLock&&!KEEP)KEEP=await navigator.wakeLock.request("screen")}else if(KEEP){await KEEP.release();KEEP=null}}catch(e){KEEP=null}}
function askNotify(){try{if(window.Notification&&Notification.permission==="default")Notification.requestPermission()}catch(e){}}
function notify(t,b){try{if(window.Notification&&Notification.permission==="granted"&&document.hidden)new Notification(t,{body:b})}catch(e){}}
addEventListener("beforeunload",e=>{if(ACTIVE){e.preventDefault();e.returnValue=""}});
document.addEventListener("visibilitychange",()=>{if(ACTIVE&&!document.hidden&&!KEEP)keepAwake(true)});
addEventListener("error",e=>{if(e.message&&!/ResizeObserver|Script error/.test(e.message))toast("Terjadi kesalahan tak terduga: "+e.message,"bad")});
addEventListener("unhandledrejection",e=>{const x=explain(e.reason);if(x.msg!=="Dibatalkan.")toast((x.msg+" "+x.hint).trim(),"bad")});
class Prog{
  constructor(id){this.el=$("#"+id);this.el.className="prog";this.el.innerHTML=PROGHTML;this.el.hidden=true;const q=s=>this.el.querySelector(s);
    this.pp=q(".pp");this.ps=q(".ps");this.bar=q(".pbar i");this.pl=q(".pl");this.pw=q(".pw");this.pe=q(".pe");this.bc=q(".pc");this.bx=q(".px");this.hooks=[];this.S=[];
    this.bc.onclick=()=>this.cancel();this.bx.onclick=()=>{if(this.retry)this.retry()}}
  start(stages,retry){freshAB();this.cancelled=false;this.hooks=[];this.retry=retry;this.t0=Date.now();this.note="";
    this.S=stages.map(s=>({...s,f:0,st:"wait",d:""}));this.el.hidden=false;this.el.className="prog run";this.pe.hidden=true;this.pw.hidden=true;this.bx.hidden=true;this.bc.hidden=false;
    NOTE=t=>{this.note=t;this.upd()};keepAwake(true);askNotify();this.upd()}
  upd(){
    const tot=this.S.reduce((a,s)=>a+s.w,0)||1,sum=this.S.reduce((a,s)=>a+s.w*s.f,0),p=Math.min(100,Math.round(100*sum/tot)),run=this.el.className==="prog run";
    this.p=p;this.pp.textContent=p+"%";this.bar.style.width=p+"%";
    const c=this.S.find(s=>s.st==="run");let line=this.note||(c?c.t+(c.d?": "+c.d:""):"");
    if(run&&p>=8&&p<100){const el=(Date.now()-this.t0)/1000,left=Math.max(1,Math.round(el*(100-p)/p));line+=" \u00B7 sisa \u00B1"+(left>90?Math.round(left/60)+" mnt":left+" dtk")}
    if(run)this.ps.textContent=line;
    this.pl.textContent="";this.S.forEach(s=>{const li=document.createElement("li");li.className=s.st;li.textContent=(s.st==="ok"?"\u2713 ":s.st==="bad"?"\u2715 ":s.st==="run"?"\u25CF ":"\u25CB ")+s.t+(s.st==="run"&&s.f>0?" "+Math.round(s.f*100)+"%":"");this.pl.appendChild(li)});
    document.title=(run?p+"% \u00B7 ":"")+"MPN.studio"}
  set(id,f,d){const i=this.S.findIndex(s=>s.id===id);if(i<0)return;this.S.forEach((s,j)=>{if(j<i&&s.st!=="ok"){s.st="ok";s.f=1;s.d=""}});const s=this.S[i];s.st="run";s.f=Math.max(s.f,clamp(f));if(d!==undefined)s.d=d;this.upd()}
  fin(id){const s=this.S.find(s=>s.id===id);if(s){s.st="ok";s.f=1;s.d=""}this.upd()}
  creep(id,tau,d){const t0=Date.now(),iv=setInterval(()=>this.set(id,.92*(1-Math.exp(-(Date.now()-t0)/(tau*1000*(window.__tscale||1)))),d||"perkiraan"),300);this.set(id,0,d||"perkiraan");return()=>clearInterval(iv)}
  warn(t){this.pw.textContent=t||"";this.pw.hidden=!t}
  done(msg){this.S.forEach(s=>{s.st="ok";s.f=1});this.el.className="prog ok";this.pp.textContent="100%";this.bar.style.width="100%";this.ps.textContent=msg||"Selesai.";this.bc.hidden=true;this.bx.hidden=true;this.pw.hidden=true;this.upd();document.title="\u2713 MPN.studio";NOTE=()=>{};keepAwake(false);notify("Selesai",msg||"Prosesmu selesai.");toast(msg||"Selesai.","ok")}
  fail(e){const x=explain(e),cancelled=this.cancelled||x.msg==="Dibatalkan.";const c=this.S.find(s=>s.st==="run")||this.S.find(s=>s.st==="wait");if(c)c.st="bad";
    this.el.className="prog bad";this.upd();this.bc.hidden=true;this.pw.hidden=true;this.bx.hidden=!this.retry;this.pe.hidden=false;
    this.pe.textContent=cancelled?"Dibatalkan. Tidak ada yang disimpan.":"Gagal: "+x.msg+" "+x.hint;this.ps.textContent="";NOTE=()=>{};keepAwake(false);document.title="MPN.studio";
    if(!cancelled){notify("Proses gagal",x.msg);toast("Gagal: "+x.msg,"bad")}if(e&&e.message===NOKEY)$("#set").open=true}
  cancel(){this.cancelled=true;AB.abort();this.hooks.forEach(f=>{try{f()}catch(e){}})}
}
async function run(P,stages,fn,okMsg,again){
  if(ACTIVE){toast("Masih ada proses yang berjalan. Tunggu selesai atau klik Batalkan.","bad");return false}
  ACTIVE=true;document.body.classList.add("busy");try{aud()}catch(e){}P.start(stages,again);
  try{await fn(P);P.done(typeof okMsg==="function"?okMsg():okMsg);return true}catch(e){P.fail(e);return false}finally{ACTIVE=false;document.body.classList.remove("busy")}}
async function waitSec(s,label){for(let i=Math.ceil(s);i>0;i--){if(AB.signal.aborted)throw new Error("Dibatalkan.");NOTE((label||"Menunggu")+" "+i+" dtk\u2026");await sleep(1000)}NOTE("")}
function guardTab(rec,pf,rf,P){
  let paused=false;const h=()=>{
    if(document.hidden&&!paused){paused=true;GUARD.paused=true;try{if(rec.state==="recording")rec.pause()}catch(e){}pf();if(AU)AU.c.suspend();P&&P.warn("Tab tidak aktif, render dijeda. Kembali ke tab ini untuk melanjutkan.")}
    else if(!document.hidden&&paused){paused=false;GUARD.paused=false;if(AU)AU.c.resume();try{if(rec.state==="paused")rec.resume()}catch(e){}rf();P&&P.warn("")}};
  document.addEventListener("visibilitychange",h);return()=>{document.removeEventListener("visibilitychange",h);GUARD.paused=false}}
function showResult(box,blob,name,msg){
  const b=$(box);if(b._u)URL.revokeObjectURL(b._u);const u=b._u=URL.createObjectURL(blob);b.textContent="";
  const v=document.createElement("video");v.src=u;v.controls=true;v.playsInline=true;
  const a=document.createElement("a");a.className="btn";a.href=u;a.download=name;a.textContent="Unduh "+name+" ("+(blob.size/1048576).toFixed(1)+" MB)";
  const p=document.createElement("p");p.className="st";p.textContent=msg||"";b.append(v,a,p)}
const NOKEY="Isi API key Gemini (gratis) atau alamat server bersama di Pengaturan AI dulu.";
async function save(n,b){try{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),6e4);return true}catch(e){return false}}
