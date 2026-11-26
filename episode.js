
/* ===== Mesin Episode Kartun Dinamis: JSON dari Gemini -> renderer, dengan validasi dan fallback ===== */
const EP_PRESETS={
  "2d-flat-satire":{n:"Kartun 2D satire",pal:{bg:"#f2d58a",primary:"#2f80ed",secondary:"#e5533d",accent:"#ffd23f",ink:"#1b1b1b"},ol:5,face:"eyes",fx:"none"},
  "retro-blocky-surreal":{n:"Retro blocky surreal",pal:{bg:"#1d1a45",primary:"#3b5bdb",secondary:"#e8590c",accent:"#ffd43b",ink:"#0b0a1a"},ol:3,face:"block",fx:"crt"},
  "2d-flat-emotional":{n:"Kartun 2D emosional",pal:{bg:"#4a3328",primary:"#c2410c",secondary:"#8a5a3a",accent:"#fcd34d",ink:"#1f1410"},ol:6,face:"dots",fx:"warm"}
};
const EP_PLACES=["ruang_tamu","kamar","dapur","jalan","rumah_malam","terminal","bus","sekolah","kantor","pasar","masjid","taman","studio_tv","kota","hutan","pantai"];
const EP_TIMES=["pagi","siang","sore","malam"],EP_WEATHER=["cerah","hujan","mendung"],EP_CAMS=["cut","zoom_in","zoom_out","pan_left","pan_right","shake"],EP_SHOTS=["wide","medium","closeup","prop"];
const EP_EXPR=["idle","shocked","sad","focused","smirk","happy","angry","scared","transformed"],EP_ACT=["none","wave","point","hold"],EP_POS=["left","center","right"];
const EP_PROPS=["phone","clock","tv","letter","box","ticket","bag","book","key","photo","laptop","paper"],EP_OVK=["pill","banner","bubble","ui","none"];
const EP_HAIR=["pendek","panjang","botak","jilbab","topi","peci","keriting","kuncir"],EP_ACC=["none","kacamata","kumis","topi"],EP_BUILD=["normal","gemuk","kurus","anak"];
const rgbOf=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const toHex=(r,g,b)=>"#"+[r,g,b].map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,"0")).join("");
const mixc=(a,b,k)=>{const A=rgbOf(a),B=rgbOf(b);return toHex(A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k)};
const shade=(h,f)=>f>=0?mixc(h,"#ffffff",f):mixc(h,"#000000",-f);
let EPI={title:"",logline:"",part:1,channel:"",preset:"2d-flat-satire",palette:{...EP_PRESETS["2d-flat-satire"].pal},characters:[{id:"t1",name:"Tokoh",look:{skin:"#f1c27d",hair:"#2b2118",hairStyle:"pendek",shirt:"#3b82f6",pants:"#374151",acc:"none",build:"normal"}}]};
const EP_SYSTEM=`Kamu adalah penulis naskah dan sutradara serial pendek animasi vertikal 9:16 berbahasa Indonesia. Kamu mengisi data untuk mesin animasi, jadi KELUARANMU HANYA SATU OBJEK JSON yang valid sesuai skema, tanpa markdown dan tanpa teks lain.

PILIH VISUAL PRESET sesuai nada topik:
- "2d-flat-satire": kartun 2D flat ber-outline tebal, warna cerah kontras. Untuk komedi absurd, satire, kejadian aneh sehari-hari, aturan kota atau kampung yang unik.
- "retro-blocky-surreal": gaya balok low-poly retro dengan nuansa TV, layar, dan malam. Untuk misteri, fantasi, surealis, siaran aneh.
- "2d-flat-emotional": kartun 2D flat ber-outline tebal, warna hangat dan sendu. Untuk drama keluarga, perantauan, kerinduan, misteri emosional.

PALETTE: bg, primary, secondary, accent, ink dalam format "#RRGGBB". Pilih warna yang cocok dengan suasana, ink harus kontras dengan bg, accent dipakai untuk sorotan teks.

STRUKTUR CERITA: hook kuat di adegan pertama, konflik naik, satu kejutan atau pembalikan, lalu penutup yang menggantung (cliffhanger) atau menyentuh. Jumlah adegan MENGIKUTI ALUR (umumnya 8 sampai 14, boleh lebih untuk cerita panjang, maksimal 24). Tiap adegan 3 sampai 10 detik ("dur").

TOKOH: 2 sampai 4 tokoh dengan "id" pendek unik. Tampilan (look) harus konsisten sepanjang episode. Setiap actor di adegan memakai id tokoh itu.

PER ADEGAN: pilih "setting" (place, time, weather), "shot" (wide, medium, closeup, prop), "camera" (variasikan: cut, zoom_in, zoom_out, pan_left, pan_right, shake), "actors" dengan ekspresi yang cocok dengan emosi (idle, shocked, sad, focused, smirk, happy, angry, scared, transformed), "props" yang relevan HANYA dengan adegan itu (jangan membawa properti dari adegan lain), dan "overlay" singkat (pill, banner, bubble, ui) hanya jika menambah cerita.
BATAS PANJANG: overlay.text dan overlay.sub maksimal 24 karakter; props.text maksimal 20 karakter; "say" 1 sampai 2 kalimat pendek maksimal 22 kata, bahasa Indonesia santai dan natural, mudah dibacakan; "hl" satu kata kunci dari "say" untuk disorot kuning.
Jangan memakai emoji. Semua teks dalam bahasa Indonesia.`;
const EP_SCENE_SCHEMA={type:"OBJECT",properties:{dur:{type:"NUMBER"},camera:{type:"STRING",enum:EP_CAMS},shot:{type:"STRING",enum:EP_SHOTS},setting:{type:"OBJECT",properties:{place:{type:"STRING",enum:EP_PLACES},time:{type:"STRING",enum:EP_TIMES},weather:{type:"STRING",enum:EP_WEATHER}}},
  actors:{type:"ARRAY",items:{type:"OBJECT",properties:{id:{type:"STRING"},expr:{type:"STRING",enum:EP_EXPR},pos:{type:"STRING",enum:EP_POS},action:{type:"STRING",enum:EP_ACT}}}},
  props:{type:"ARRAY",items:{type:"OBJECT",properties:{type:{type:"STRING",enum:EP_PROPS},text:{type:"STRING"},pos:{type:"STRING",enum:["left","center","right","foreground"]}}}},
  overlay:{type:"OBJECT",properties:{kind:{type:"STRING",enum:EP_OVK},text:{type:"STRING"},sub:{type:"STRING"}}},say:{type:"STRING"},hl:{type:"STRING"}},required:["dur","setting","shot","camera","say"]};
const EP_SCHEMA={type:"OBJECT",properties:{episode:{type:"OBJECT",properties:{title:{type:"STRING"},logline:{type:"STRING"},part:{type:"INTEGER"},channel:{type:"STRING"},visual_preset:{type:"STRING",enum:Object.keys(EP_PRESETS)},
  palette:{type:"OBJECT",properties:{bg:{type:"STRING"},primary:{type:"STRING"},secondary:{type:"STRING"},accent:{type:"STRING"},ink:{type:"STRING"}}},
  characters:{type:"ARRAY",items:{type:"OBJECT",properties:{id:{type:"STRING"},name:{type:"STRING"},look:{type:"OBJECT",properties:{skin:{type:"STRING"},hair:{type:"STRING"},hairStyle:{type:"STRING",enum:EP_HAIR},shirt:{type:"STRING"},pants:{type:"STRING"},accessory:{type:"STRING",enum:EP_ACC},build:{type:"STRING",enum:EP_BUILD}}}}}}},required:["title","visual_preset","palette","characters"]},
  scenes:{type:"ARRAY",items:EP_SCENE_SCHEMA}},required:["episode","scenes"]};
/* ---- validasi dan normalisasi (semua nilai punya default aman) ---- */
function normLook(o){o=o&&typeof o==="object"?o:{};const H=(v,d)=>hexOK(v)?v:d,P=(v,a,d)=>a.includes(v)?v:d;return{skin:H(o.skin,"#f1c27d"),hair:H(o.hair,"#2b2118"),hairStyle:P(o.hairStyle,EP_HAIR,"pendek"),shirt:H(o.shirt,"#3b82f6"),pants:H(o.pants,"#374151"),acc:P(o.accessory||o.acc,EP_ACC,"none"),build:P(o.build,EP_BUILD,"normal")}}
function normEpScene(s,chars,preset){
  s=s&&typeof s==="object"?s:{};const S=(v,n)=>String(v==null?"":v).replace(/\s+/g," ").trim().slice(0,n),P=(v,a,d)=>a.includes(v)?v:d,g=s.setting&&typeof s.setting==="object"?s.setting:{},ov=s.overlay&&typeof s.overlay==="object"?s.overlay:{};
  const ids=(chars&&chars.length?chars:EPI.characters).map(c=>c.id);
  const actors=(Array.isArray(s.actors)?s.actors:[]).slice(0,3).map((a,k)=>({id:ids.includes(a&&a.id)?a.id:ids[k%ids.length],expr:P(a&&a.expr,EP_EXPR,"idle"),pos:P(a&&a.pos,EP_POS,["center","left","right"][k]||"center"),action:P(a&&a.action,EP_ACT,"none")}));
  const props=(Array.isArray(s.props)?s.props:[]).slice(0,2).map(p=>({type:P(p&&p.type,EP_PROPS,"none"),text:S(p&&p.text,20),pos:P(p&&p.pos,["left","center","right","foreground"],"center")})).filter(p=>p.type!=="none");
  const o={kind:P(ov.kind,EP_OVK,"none"),text:S(ov.text,24),sub:S(ov.sub,24)};if(!o.text)o.kind="none";
  const say=S(s.say||s.narasi||"",220)||o.text||"";
  return{kind:"ep",dur:clamp(+s.dur||6,3,14),camera:P(s.camera,EP_CAMS,"cut"),shot:P(s.shot,EP_SHOTS,actors.length?"medium":"wide"),place:P(g.place||s.place,EP_PLACES,preset==="retro-blocky-surreal"?"studio_tv":"ruang_tamu"),time:P(g.time||s.time,EP_TIMES,"siang"),weather:P(g.weather||s.weather,EP_WEATHER,"cerah"),actors,props,overlay:o,say,hl:S(s.hl||s.highlight,22)}}
function normEp(raw,opt){
  opt=opt||{};const R=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{scenes:Array.isArray(raw)?raw:[]},E=R.episode&&typeof R.episode==="object"?R.episode:{},S=(v,n)=>String(v==null?"":v).trim().slice(0,n),prev=opt.prev||null;
  const preset=prev?prev.preset:(EP_PRESETS[opt.preset]?opt.preset:(EP_PRESETS[E.visual_preset]?E.visual_preset:EP_PRESETS[E.preset]?E.preset:"2d-flat-satire")),base=EP_PRESETS[preset].pal,pin=prev?prev.palette:(E.palette&&typeof E.palette==="object"?E.palette:{}),palette={};
  ["bg","primary","secondary","accent","ink"].forEach(k=>{palette[k]=hexOK(pin[k])?pin[k]:base[k]});
  if(Math.abs(lum(palette.ink)-lum(palette.accent))<.3)palette.ink=lum(palette.accent)>.4?"#111111":"#ffffff";
  let chars=prev?prev.characters:(Array.isArray(E.characters)?E.characters.slice(0,4):[]);
  chars=chars.map((c,i)=>({id:S(c&&c.id||"t"+(i+1),16)||"t"+(i+1),name:S(c&&c.name,16),look:prev?c.look:normLook(c&&c.look)}));
  if(!chars.length)chars=[{id:"t1",name:"Tokoh",look:normLook({})}];
  const scenes=(Array.isArray(R.scenes)?R.scenes:[]).slice(0,24).map(s=>normEpScene(s,chars,preset));
  const meta={title:S(E.title||(prev&&prev.title),60)||"Episode MPN",logline:S(E.logline||(prev&&prev.logline),400),part:prev?(prev.part||1)+1:Math.max(1,Math.min(99,Math.round(+E.part)||1)),channel:S(opt.channel||E.channel||(prev&&prev.channel),24),preset,palette,characters:chars};
  return{meta,scenes}}
function localEpisode(text,opt){
  const sents=String(text).replace(/\s+/g," ").match(/[^.!?]+[.!?]*/g)||[String(text)],goal=Math.max(90,Math.ceil(String(text).length/9)),out=[];let cur="";
  sents.forEach(s=>{s=s.trim();if(!s)return;if(cur&&(cur+" "+s).length>goal&&out.length<13){out.push(cur);cur=s}else cur=cur?cur+" "+s:s});if(cur)out.push(cur);
  const pl=["ruang_tamu","jalan","kamar","dapur","kota","taman"],ex=["idle","shocked","focused","happy","smirk","sad"],cm=["zoom_in","pan_left","cut","pan_right","zoom_out"];
  const sc=out.slice(0,14).map((l,i)=>{const w=l.split(/\s+/).sort((a,b)=>b.length-a.length)[0]||"";return{dur:5,camera:cm[i%cm.length],shot:i%4===3?"closeup":"medium",setting:{place:pl[i%pl.length],time:i<2?"pagi":i>out.length-3?"malam":"siang",weather:"cerah"},actors:[{id:"t1",expr:ex[i%ex.length],pos:"center"}],props:[],overlay:{kind:i===0?"banner":"none",text:i===0?String(text).split(/\s+/).slice(0,3).join(" ").toUpperCase():""},say:l.slice(0,220),hl:w.replace(/[^\p{L}\p{N}]/gu,"")}});
  return normEp({episode:{title:String(text).slice(0,40),visual_preset:(opt&&opt.preset)||"2d-flat-satire"},scenes:sc},opt)}
/* ---- penggambaran ---- */
const EPC=Object.assign(document.createElement("canvas"),{width:180,height:320});
function rrx(x,pre,a,b,c,d,r){x.roundRect(a,b,c,d,pre.face==="block"?Math.min(r,4):r)}
function person(x,cx,fy,s,L,expr,t,pre,action,pal,idx){
  const bld=L.build,TW={normal:144,gemuk:196,kurus:112,anak:124}[bld]||144,LW={normal:48,gemuk:62,kurus:36,anak:40}[bld]||48,k=bld==="anak"?.8:1,ink=pal.ink,sk=expr==="transformed"?mixc(L.skin,pal.accent,.5):L.skin,ol=pre.ol;
  const OL=(c,lw)=>{x.fillStyle=c;x.fill();if(ol){x.lineWidth=lw||ol;x.strokeStyle=ink;x.lineJoin="round";x.stroke()}};
  x.save();x.translate(cx,fy);x.scale(s*k,s*k);x.lineCap="round";const br=1+.014*Math.sin(t*2.2+idx),sw=Math.sin(t*1.6+idx)*.05,blk=pre.face==="block";
  x.fillStyle="rgba(0,0,0,.2)";x.beginPath();x.ellipse(0,4,TW*.78,16,0,0,7);x.fill();
  [-1,1].forEach(d=>{x.beginPath();rrx(x,pre,d*TW*.24-LW/2,-118,LW,118,12);OL(L.pants);x.beginPath();rrx(x,pre,d*TW*.24-LW/2-6,-16,LW+12,22,10);OL("#2b2b2b")});
  [-1,1].forEach(d=>{x.save();x.translate(d*(TW/2+6),-236);let rot=d*(.12+sw*d);if(d===1&&action==="wave")rot=2.6+Math.sin(t*8)*.3;if(d===1&&action==="point")rot=-1.4;if(action==="hold")rot=d*.9;x.rotate(rot);x.beginPath();rrx(x,pre,-20,0,40,118,18);OL(L.shirt);x.beginPath();if(blk)x.rect(-18,112,36,36);else x.arc(0,130,20,0,7);OL(sk);x.restore()});
  x.save();x.translate(0,-112);x.scale(1,br);x.beginPath();rrx(x,pre,-TW/2,-150,TW,150,26);OL(L.shirt);if(bld==="gemuk"){x.beginPath();x.ellipse(0,-50,TW*.36,50,0,0,7);x.fillStyle="rgba(0,0,0,.08)";x.fill()}x.restore();
  x.beginPath();rrx(x,pre,-18,-276,36,36,8);OL(sk);
  const jil=L.hairStyle==="jilbab",HY=-338;
  if(L.hairStyle==="panjang"){x.beginPath();rrx(x,pre,-86,-412,172,230,54);OL(L.hair)}
  if(L.hairStyle==="kuncir"){x.beginPath();x.ellipse(70,-330,26,60,.3,0,7);OL(L.hair)}
  if(jil){x.beginPath();x.ellipse(0,HY,98,102,0,0,7);OL(L.hair);x.beginPath();rrx(x,pre,-106,-272,212,98,44);OL(L.hair)}
  x.beginPath();if(pre.face==="block")x.rect(-66,-410,132,142);else if(pre.face==="dots")x.arc(0,jil?HY+4:HY,jil?62:80,0,7);else x.ellipse(0,jil?HY+4:HY,jil?60:74,jil?66:78,0,0,7);OL(sk);
  if(L.hairStyle==="pendek"||L.hairStyle==="panjang"||L.hairStyle==="kuncir"){x.beginPath();if(blk){x.rect(-70,-422,140,48)}else{x.ellipse(0,-378,78,48,0,Math.PI,0);x.closePath()}OL(L.hair)}
  if(L.hairStyle==="keriting"){for(let i=0;i<7;i++){x.beginPath();x.arc(-66+i*22,-395+Math.abs(i-3)*7,24,0,7);OL(L.hair)}}
  if(L.hairStyle==="topi"){x.beginPath();rrx(x,pre,-72,-424,144,52,18);OL(L.hair);x.beginPath();rrx(x,pre,-80,-382,160,14,6);OL(shade(L.hair,-.2))}
  if(L.hairStyle==="peci"){x.beginPath();rrx(x,pre,-62,-430,124,56,10);OL("#161616")}
  const ey=HY+2,ex=blk?32:28,bl=(t+idx*1.3)%3.6>3.45&&expr!=="shocked";
  [-1,1].forEach(d=>{const X=d*ex;
    if(bl){x.beginPath();x.moveTo(X-12,ey);x.lineTo(X+12,ey);x.lineWidth=5;x.strokeStyle=ink;x.stroke();return}
    if(pre.face==="eyes"){const ry=expr==="shocked"?22:expr==="focused"?9:16;x.beginPath();x.ellipse(X,ey,13,ry,0,0,7);x.fillStyle="#fff";x.fill();x.lineWidth=4;x.strokeStyle=ink;x.stroke();x.beginPath();x.arc(X+Math.sin(t*.8)*2,ey+1,7,0,7);x.fillStyle=expr==="transformed"?pal.accent:ink;x.fill()}
    else if(pre.face==="dots"){x.beginPath();x.arc(X,ey,expr==="shocked"?11:expr==="focused"?5:7,0,7);x.fillStyle=expr==="transformed"?pal.accent:ink;x.fill()}
    else{x.fillStyle=expr==="transformed"?pal.accent:ink;x.fillRect(X-9,ey-(expr==="shocked"?13:expr==="focused"?3:9),18,expr==="shocked"?26:expr==="focused"?6:18)}});
  const A={sad:-1,scared:-1,shocked:-.7,angry:1,focused:.6,happy:-.2,smirk:0,idle:0,transformed:0}[expr]||0;x.lineWidth=6;x.strokeStyle=ink;
  [-1,1].forEach(d=>{x.beginPath();x.moveTo(d*ex-d*16,ey-30+A*8+(expr==="smirk"&&d===1?-6:0));x.lineTo(d*ex+d*16,ey-30-A*8);x.stroke()});
  const my=ey+52;x.beginPath();
  if(expr==="happy"){x.arc(0,my-8,22,.15*Math.PI,.85*Math.PI);x.stroke();x.fillStyle="rgba(255,110,110,.35)";[-1,1].forEach(d=>{x.beginPath();x.arc(d*46,ey+28,11,0,7);x.fill()})}
  else if(expr==="sad"||expr==="angry"){x.arc(0,my+14,20,1.15*Math.PI,1.85*Math.PI);x.stroke()}
  else if(expr==="shocked"){x.ellipse(0,my,10,15,0,0,7);x.fillStyle="#5a1d1d";x.fill();x.stroke()}
  else if(expr==="scared"){x.moveTo(-22,my);for(let i=1;i<=4;i++)x.lineTo(-22+i*11,my+(i%2?7:-5));x.stroke();x.beginPath();x.moveTo(62,ey-20);x.quadraticCurveTo(70,ey-4,62,ey+4);x.quadraticCurveTo(54,ey-4,62,ey-20);x.fillStyle="#7dd3fc";x.fill()}
  else if(expr==="smirk"){x.moveTo(-14,my+2);x.quadraticCurveTo(6,my+6,22,my-8);x.stroke()}
  else if(expr==="transformed"){x.arc(0,my-4,14,.1*Math.PI,.9*Math.PI);x.stroke();for(let i=0;i<5;i++){const an=t*2+i*1.26;x.fillStyle=pal.accent;x.fillRect(Math.cos(an)*110-4,-330+Math.sin(an)*120-4,8,8)}}
  else{x.moveTo(-16,my);x.lineTo(16,my);x.stroke()}
  if(L.acc==="kacamata"){x.lineWidth=5;x.strokeStyle=ink;[-1,1].forEach(d=>{x.beginPath();x.arc(d*ex,ey,22,0,7);x.stroke()});x.beginPath();x.moveTo(-ex+22,ey);x.lineTo(ex-22,ey);x.stroke()}
  if(L.acc==="kumis"){x.beginPath();x.moveTo(-26,my-14);x.quadraticCurveTo(0,my-30,26,my-14);x.quadraticCurveTo(0,my-20,-26,my-14);x.fillStyle=L.hair;x.fill()}
  x.restore()}
function epLab(x,s,y,w,sz,col,ink){x.save();let z=sz;x.textAlign="center";x.textBaseline="middle";x.font="900 "+z+"px "+FS;while(x.measureText(s).width>w&&z>10){z-=1;x.font="900 "+z+"px "+FS}x.fillStyle=col;x.fillText(s,0,y);x.restore()}
function drawProp(x,p,cx,cy,sc,t,pre,pal){
  x.save();x.translate(cx,cy);x.scale(sc,sc);const ink=pal.ink,O=(c,lw)=>{x.fillStyle=c;x.fill();x.lineWidth=lw||pre.ol||3;x.strokeStyle=ink;x.lineJoin="round";x.stroke()},tx=p.text||"";
  if(p.type==="phone"){x.beginPath();x.roundRect(-46,-84,92,168,14);O("#1d1f2b");x.beginPath();x.roundRect(-38,-72,76,140,8);O(mixc(pal.primary,"#ffffff",.2),2);x.fillStyle="rgba(255,255,255,.25)";x.fillRect(-30,-60+Math.sin(t*2)*4,60,10);epLab(x,tx,0,64,18,"#fff",ink)}
  else if(p.type==="clock"){x.beginPath();x.arc(0,0,74,0,7);O("#f7f3e8",6);for(let i=0;i<12;i++){const a=i*Math.PI/6;x.beginPath();x.moveTo(Math.sin(a)*62,-Math.cos(a)*62);x.lineTo(Math.sin(a)*70,-Math.cos(a)*70);x.lineWidth=4;x.strokeStyle=ink;x.stroke()}const a1=t*.6,a2=t*.05;x.lineCap="round";x.lineWidth=7;x.beginPath();x.moveTo(0,0);x.lineTo(Math.sin(a1)*56,-Math.cos(a1)*56);x.stroke();x.lineWidth=9;x.beginPath();x.moveTo(0,0);x.lineTo(Math.sin(a2)*36,-Math.cos(a2)*36);x.stroke();if(tx)epLab(x,tx,100,150,20,"#fff",ink)}
  else if(p.type==="tv"){x.beginPath();x.roundRect(-92,-70,184,140,16);O(shade(pal.secondary,-.15),6);x.beginPath();x.roundRect(-76,-56,124,112,10);O(mixc(pal.primary,"#9fd8ff",.55),4);x.fillStyle="rgba(255,255,255,.18)";for(let i=0;i<6;i++)x.fillRect(-76,-56+i*20+((t*20)%20),124,3);epLab(x,tx,-10,110,22,"#102040",ink);x.beginPath();x.moveTo(-30,-70);x.lineTo(-52,-118);x.moveTo(30,-70);x.lineTo(52,-118);x.lineWidth=5;x.strokeStyle=ink;x.stroke();x.beginPath();x.arc(66,-30,9,0,7);O(pal.accent,3)}
  else if(p.type==="letter"||p.type==="paper"){x.rotate(-.06);x.beginPath();x.rect(-70,-90,140,180);O("#fffdf3");x.strokeStyle="rgba(0,0,0,.25)";x.lineWidth=2;for(let i=0;i<7;i++){x.beginPath();x.moveTo(-54,-46+i*20);x.lineTo(54,-46+i*20);x.stroke()}epLab(x,tx,-66,120,22,ink,ink)}
  else if(p.type==="box"){x.beginPath();x.rect(-84,-56,168,112);O("#c9954f");x.beginPath();x.rect(-84,-56,168,26);O("#b3813f");x.beginPath();x.rect(-20,-56,40,112);x.fillStyle="rgba(255,255,255,.35)";x.fill();x.beginPath();x.rect(-60,-10,100,50);O("#fffdf3",3);epLab(x,tx,15,90,20,ink,ink)}
  else if(p.type==="ticket"){x.beginPath();x.roundRect(-96,-52,192,104,12);O("#f6efd9");x.setLineDash([6,6]);x.beginPath();x.moveTo(40,-52);x.lineTo(40,52);x.lineWidth=3;x.strokeStyle=ink;x.stroke();x.setLineDash([]);epLab(x,tx,-6,120,26,ink,ink)}
  else if(p.type==="bag"){x.beginPath();x.roundRect(-64,-50,128,110,20);O(pal.secondary);x.beginPath();x.arc(0,-50,34,Math.PI,0);x.lineWidth=8;x.strokeStyle=ink;x.stroke();epLab(x,tx,10,100,20,"#fff",ink)}
  else if(p.type==="book"){x.beginPath();x.roundRect(-64,-80,128,160,8);O(pal.primary);x.beginPath();x.rect(-64,-80,20,160);O(shade(pal.primary,-.25));epLab(x,tx,-10,90,22,"#fff",ink)}
  else if(p.type==="key"){x.beginPath();x.arc(-40,0,34,0,7);O(pal.accent,5);x.beginPath();x.arc(-40,0,12,0,7);x.fillStyle=ink;x.fill();x.beginPath();x.rect(-6,-9,92,18);O(pal.accent,5);x.beginPath();x.rect(60,0,12,28);O(pal.accent,4)}
  else if(p.type==="photo"){x.beginPath();x.rect(-72,-72,144,144);O("#7a4a2a",5);x.beginPath();x.rect(-58,-58,116,116);O(mixc(pal.bg,"#ffffff",.5),3);x.beginPath();x.arc(-16,-12,18,0,7);O(pal.secondary,3);x.beginPath();x.arc(24,-6,15,0,7);O(pal.primary,3);epLab(x,tx,44,100,16,ink,ink)}
  else if(p.type==="laptop"){x.beginPath();x.roundRect(-92,-70,184,116,10);O("#232632");x.beginPath();x.roundRect(-82,-60,164,96,4);O(mixc(pal.primary,"#0b1020",.4),2);epLab(x,tx,-12,140,24,"#fff",ink);x.beginPath();x.roundRect(-110,46,220,18,8);O("#3a3f50")}
  x.restore()}
function mkSet(x,s,t,pal,pre,time,wthr,pl){
  const dk=time==="malam",wall=mixc(pal.bg,pal.secondary,.3),sk=dk?"#1a2350":time==="sore"?"#ffb27a":time==="pagi"?"#ffd9a8":"#bfe6ff";
  const win=(a,b,w,h)=>{x.beginPath();x.rect(a,b,w,h);olf(x,sk,6);x.beginPath();x.moveTo(a+w/2,b);x.lineTo(a+w/2,b+h);x.moveTo(a,b+h/2);x.lineTo(a+w,b+h/2);x.lineWidth=5;x.strokeStyle=pal.ink;x.stroke()};
  const floor=(y)=>{x.beginPath();x.rect(-10,y,560,980-y);olf(x,shade(wall,-.3),5);for(let i=0;i<9;i++){x.beginPath();x.moveTo(i*80-20,y);x.lineTo(i*120-210,960);x.lineWidth=2;x.strokeStyle="rgba(0,0,0,.2)";x.stroke()}};
  if(pl==="ruang_tamu"||pl==="kamar"||pl==="dapur"){x.fillStyle=wall;x.fillRect(0,0,540,960);floor(650);win(70,250,170,200);
    if(pl==="ruang_tamu"){x.beginPath();x.roundRect(262,520,250,130,22);olf(x,pal.primary,5);x.beginPath();x.roundRect(252,470,270,80,26);olf(x,shade(pal.primary,-.15),5);x.beginPath();x.ellipse(270,780,230,50,0,0,7);olf(x,pal.accent,5);[[300,300],[360,330],[420,300]].forEach(([a,b],i)=>{x.beginPath();x.rect(a,b-30,52,62);olf(x,i%2?pal.secondary:mixc(pal.bg,"#ffffff",.5),4)})}
    else if(pl==="kamar"){x.beginPath();x.roundRect(250,560,260,100,14);olf(x,pal.primary,5);x.beginPath();x.roundRect(250,520,260,60,14);olf(x,mixc(pal.primary,"#ffffff",.5),5);x.beginPath();x.rect(390,330,90,120);olf(x,pal.secondary,5)}
    else{x.beginPath();x.rect(280,430,240,230);olf(x,"#d9dee6",5);x.beginPath();x.rect(280,430,240,70);olf(x,"#c3cad4",5);x.beginPath();x.rect(20,540,230,120);olf(x,pal.secondary,5);x.beginPath();x.rect(20,540,230,26);olf(x,mixc(pal.secondary,"#fff",.4),5);x.beginPath();x.rect(70,500,60,40);olf(x,pal.accent,4)}}
  else if(pl==="jalan"||pl==="rumah_malam"){sky(x,dk?"malam":time==="sore"?"sore":time==="pagi"?"pagi":"siang",t);
    for(let i=0;i<4;i++){const bx=i*150-30;x.beginPath();x.rect(bx,520,140,200);olf(x,i%2?mixc(pal.bg,pal.secondary,.5):mixc(pal.bg,"#ffffff",.4),5);x.beginPath();x.moveTo(bx-10,525);x.lineTo(bx+70,450);x.lineTo(bx+150,525);x.closePath();olf(x,i%2?pal.primary:pal.secondary,5);x.beginPath();x.rect(bx+20,580,40,50);olf(x,dk?"#ffe27a":"#bfe6ff",4);x.beginPath();x.rect(bx+84,610,40,110);olf(x,"#7a4a2a",4)}
    ground(x,dk?"#2e3445":"#8a929e",720);for(let i=0;i<6;i++){x.fillStyle="rgba(255,255,255,.5)";x.fillRect(i*100-20,800,60,10)}x.beginPath();x.rect(488,400,10,330);olf(x,"#555",3)}
  else if(pl==="terminal"||pl==="bus"){x.fillStyle=mixc(pal.bg,"#9aa4b4",.4);x.fillRect(0,0,540,960);
    if(pl==="terminal"){ground(x,"#767d88",700);x.beginPath();x.rect(20,260,500,70);olf(x,pal.secondary,5);x.fillStyle="#fff";x.font="900 40px "+FS;x.textAlign="center";x.textBaseline="middle";x.fillText("TERMINAL",270,296);x.beginPath();x.roundRect(60,430,420,230,24);olf(x,pal.primary,5);[0,1,2].forEach(i=>{x.beginPath();x.rect(90+i*130,460,100,80);olf(x,dk?"#ffe27a":"#bfe6ff",4)});x.beginPath();x.arc(140,672,30,0,7);olf(x,"#222",5);x.beginPath();x.arc(400,672,30,0,7);olf(x,"#222",5)}
    else{floor(700);x.beginPath();x.rect(0,300,540,230);olf(x,dk?"#12183a":"#a8d8ff",6);for(let i=0;i<6;i++){x.fillStyle=dk?"rgba(255,226,122,.7)":"rgba(255,255,255,.7)";x.fillRect(((i*120+t*90)%600)-40,380,22,22)}[0,1].forEach(i=>{x.beginPath();x.roundRect(40+i*250,540,220,120,16);olf(x,pal.primary,5);x.beginPath();x.roundRect(40+i*250,500,220,60,16);olf(x,shade(pal.primary,-.2),5)})}}
  else if(pl==="pasar"){x.fillStyle=wall;x.fillRect(0,0,540,960);ground(x,"#8c7b63",700);[0,1].forEach(i=>{x.beginPath();x.moveTo(30+i*270,330);x.lineTo(240+i*270,330);x.lineTo(260+i*270,420);x.lineTo(10+i*270,420);x.closePath();olf(x,i?pal.primary:pal.secondary,5);x.beginPath();x.rect(40+i*270,420,190,140);olf(x,"#c9954f",5);for(let k=0;k<4;k++){x.beginPath();x.arc(70+i*270+k*42,410,16,0,7);olf(x,[pal.accent,pal.secondary,pal.primary,"#7bc96f"][k],3)}})}
  else if(pl==="taman"){sky(x,dk?"malam":"siang",t);ground(x,"#6fbf62",690);tree(x,100,700,1.2);tree(x,430,710,1.4);x.beginPath();x.rect(200,640,150,16);olf(x,"#8a5a30",4);x.beginPath();x.rect(210,656,12,40);x.rect(328,656,12,40);olf(x,"#8a5a30",3)}
  else if(pl==="studio_tv"){const g=x.createLinearGradient(0,0,0,960);g.addColorStop(0,mixc(pal.primary,"#000",.5));g.addColorStop(1,mixc(pal.bg,"#000",.3));x.fillStyle=g;x.fillRect(0,0,540,960);x.beginPath();x.rect(60,260,420,260);olf(x,mixc(pal.primary,"#9fd8ff",.4),6);x.fillStyle=pal.accent;x.font="900 34px "+FS;x.textAlign="center";x.textBaseline="middle";x.fillText("SALURAN "+(7+Math.floor(t/4)%6),270,300);x.fillStyle="rgba(255,255,255,.1)";for(let i=0;i<8;i++)x.fillRect(60,260+i*34,420,4);ground(x,mixc(pal.bg,"#000",.2),720);x.beginPath();x.rect(150,560,240,40);olf(x,pal.secondary,5)}
  else{place(x,pl==="kota"||pl==="hutan"||pl==="pantai"||pl==="sekolah"||pl==="kantor"||pl==="masjid"?pl:"kota",dk?"malam":"siang",t)}
  if(wthr==="hujan"){x.strokeStyle="rgba(255,255,255,.5)";x.lineWidth=2;for(let i=0;i<60;i++){const u=Math.sin(i*91.7)*43758.5,px=(u-Math.floor(u))*560,py=((t*520+i*137)%1000)-40;x.beginPath();x.moveTo(px,py);x.lineTo(px-8,py+26);x.stroke()}x.fillStyle="rgba(40,50,70,.22)";x.fillRect(0,0,540,960)}else if(wthr==="mendung"){x.fillStyle="rgba(70,80,95,.2)";x.fillRect(0,0,540,960)}
  if(dk){x.fillStyle="rgba(8,12,50,.32)";x.fillRect(0,0,540,960)}else if(time==="sore"){x.fillStyle="rgba(255,120,40,.14)";x.fillRect(0,0,540,960)}
}
function epSubs(x,s,t,I,pre,pal){
  const say=s.say;if(!say)return;const span=Math.max(1,I.span||I.d-.5),f=clamp((t-.2)/span),words=say.split(/\s+/).filter(Boolean);if(!words.length)return;
  if(pre.fx==="crt"){const w=words.map(v=>v.length+2),sum=w.reduce((a,b)=>a+b,0);let c=0,k=words.length-1;for(let i=0;i<words.length;i++){c+=w[i]/sum;if(f<=c){k=i;break}}oText(x,words[k].replace(/[.,!?]/g,""),270,840,"900 36px "+FS,"#fff",9);return}
  const chunks=[];let cur=[];words.forEach(w=>{cur.push(w);if(cur.length>=4||/[.,!?;:]$/.test(w)){chunks.push(cur);cur=[]}});if(cur.length)chunks.push(cur);
  const lens=chunks.map(c=>c.join(" ").length+4),sum=lens.reduce((a,b)=>a+b,0);let c=0,k=chunks.length-1;for(let i=0;i<chunks.length;i++){c+=lens[i]/sum;if(f<=c){k=i;break}}
  const ch=chunks[k];x.save();x.textBaseline="middle";let z=30;x.font="800 "+z+"px "+FS;const ws=()=>ch.map(w=>x.measureText(w).width),sp=9;let W=ws(),tot=W.reduce((a,b)=>a+b,0)+sp*(ch.length-1);while(tot>480&&z>16){z-=2;x.font="800 "+z+"px "+FS;W=ws();tot=W.reduce((a,b)=>a+b,0)+sp*(ch.length-1)}
  const hl=String(s.hl||"").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");let px=270-tot/2;
  ch.forEach((w,i)=>{const isH=hl&&w.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"")===hl;if(isH){x.fillStyle=pal.accent;x.beginPath();x.roundRect(px-6,840-z*.72,W[i]+12,z*1.4,8);x.fill();x.fillStyle=pal.ink;x.textAlign="left";x.fillText(w,px,840)}else{x.lineJoin="round";x.lineWidth=7;x.strokeStyle="rgba(0,0,0,.85)";x.textAlign="left";x.strokeText(w,px,840);x.fillStyle="#fff";x.fillText(w,px,840)}px+=W[i]+sp});x.restore()}
function epOverlay(x,s,t,pal,pre,anchor){
  const o=s.overlay;if(!o||o.kind==="none"||!o.text)return;const a=eo((t-.4)/.35);if(a<=0)return;if(t<.8)once("eo"+o.text,"pop");x.save();x.globalAlpha=a;x.textBaseline="middle";
  if(o.kind==="pill"){x.font="800 22px "+FS;const w=Math.min(480,x.measureText(o.text).width+60),px=270-w/2,py=128+(1-a)*-16;x.fillStyle="rgba(14,14,20,.84)";x.beginPath();x.roundRect(px,py,w,46,23);x.fill();x.lineWidth=3;x.strokeStyle=pal.accent;x.stroke();x.fillStyle=pal.accent;x.beginPath();x.arc(px+24,py+23,8,0,7);x.fill();x.fillStyle="#fff";x.textAlign="left";x.fillText(o.text,px+42,py+24,w-56)}
  else if(o.kind==="banner"){const y=118+(1-a)*-20;x.fillStyle=pal.secondary;x.fillRect(0,y,540,70);x.fillStyle=pal.ink;x.fillRect(0,y,540,5);x.fillRect(0,y+65,540,5);oText(x,o.text.toUpperCase(),270,y+36,"900 40px "+FS,"#fff",8)}
  else if(o.kind==="bubble"){x.font="900 24px "+FS;const L=wrap(x,o.text.toUpperCase(),280).slice(0,2),h=L.length*30+28,w=Math.min(340,Math.max(...L.map(l=>x.measureText(l).width))+44),px=clamp(anchor-w/2,20,520-w),py=190;x.beginPath();x.roundRect(px,py,w,h,20);x.moveTo(anchor-12,py+h-2);x.lineTo(anchor,py+h+24);x.lineTo(anchor+12,py+h-2);x.fillStyle="#fff";x.fill();x.lineWidth=5;x.strokeStyle="#111";x.stroke();x.fillStyle="#111";x.textAlign="center";L.forEach((l,i)=>x.fillText(l,px+w/2,py+22+i*30))}
  else if(o.kind==="ui"){const y=130+(1-a)*-20;x.fillStyle="rgba(10,12,22,.9)";x.beginPath();x.roundRect(70,y,400,140,22);x.fill();x.lineWidth=3;x.strokeStyle=pal.accent;x.stroke();x.fillStyle=mixc(pal.accent,"#ffffff",.3);x.font="800 20px "+FS;x.textAlign="left";x.fillText(o.text,96,y+34,350);
    let sub=o.sub||"";const m=sub.match(/^(\D*)([\d.,]+)(.*)$/);if(m){const raw=m[2],dec=raw.includes(",")?raw.split(",")[1].length:0,n=parseFloat(raw.replace(/\./g,"").replace(",","."));if(isFinite(n))sub=m[1]+(n*eo((t-.5)/1.4)).toLocaleString("id-ID",{minimumFractionDigits:dec,maximumFractionDigits:dec})+m[3]}
    x.fillStyle="#fff";x.font="900 54px "+FS;x.fillText(sub,96,y+92,350)}
  x.restore()}
function epBadges(x,E,pre){
  x.save();x.textBaseline="middle";
  if(E.channel){x.font="800 15px "+FS;const w=x.measureText(E.channel).width+58;x.fillStyle="rgba(255,255,255,.9)";x.beginPath();x.roundRect(12,16,w,36,18);x.fill();x.fillStyle=E.palette.primary;x.beginPath();x.arc(32,34,13,0,7);x.fill();x.fillStyle="#fff";x.textAlign="center";x.fillText(E.channel.replace(/^@/,"").charAt(0).toUpperCase(),32,35);x.fillStyle="#222";x.textAlign="left";x.fillText(E.channel,52,35)}
  if(E.part){x.font="900 15px "+FS;const w=x.measureText("PART "+E.part).width+30;x.fillStyle=mixc(E.palette.primary,"#000000",.25);x.beginPath();x.roundRect(528-w,16,w,36,18);x.fill();x.fillStyle="#fff";x.textAlign="center";x.fillText("PART "+E.part,528-w/2,35)}
  x.restore()}
function epFx(x,pre,t){
  const vg=(a)=>{const g=x.createRadialGradient(270,480,240,270,480,620);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,"+a+")");x.fillStyle=g;x.fillRect(0,0,540,960)};
  if(pre.fx==="crt"){x.fillStyle="rgba(0,0,0,.18)";for(let y=0;y<960;y+=4)x.fillRect(0,y,540,1.6);x.fillStyle="rgba(120,90,255,.06)";x.fillRect(0,0,540,960);for(let i=0;i<70;i++){const u=Math.sin(i*12.9+Math.floor(t*12))*43758.5,v=Math.sin(i*78.2+Math.floor(t*12))*24634.6;x.fillStyle="rgba(255,255,255,.05)";x.fillRect((u-Math.floor(u))*540,(v-Math.floor(v))*960,3,3)}vg(.5)}
  else if(pre.fx==="warm"){x.fillStyle="rgba(255,150,70,.07)";x.fillRect(0,0,540,960);for(let i=0;i<50;i++){const u=Math.sin(i*12.9+Math.floor(t*10))*43758.5,v=Math.sin(i*78.2+Math.floor(t*10))*24634.6;x.fillStyle="rgba(255,255,255,.035)";x.fillRect((u-Math.floor(u))*540,(v-Math.floor(v))*960,2,2)}vg(.42)}
  else vg(.2)}
function episodeScene(x,s,t,I,id){
  const E=I.epi||EPI,pre=EP_PRESETS[E.preset]||EP_PRESETS["2d-flat-satire"],pal=E.palette,d=I.d,u=clamp(t/d),crt=pre.fx==="crt",g=crt?EPC.getContext("2d"):x,K=crt?1/3:1;
  g.save();if(crt){g.setTransform(K,0,0,K,0,0);g.clearRect(0,0,540,960)}
  let z=1,tx=0,ty=0;if(s.camera==="zoom_in")z=1+.12*u;else if(s.camera==="zoom_out")z=1.12-.12*u;else if(s.camera==="pan_left"){z=1.12;tx=34-68*u}else if(s.camera==="pan_right"){z=1.12;tx=-34+68*u}else if(s.camera==="shake"){z=1.06;tx=Math.sin(t*38)*6;ty=Math.cos(t*31)*6}
  g.translate(270+tx,480+ty);g.scale(z,z);g.translate(-270,-480);
  mkSet(g,s,t,pal,pre,s.time,s.weather,s.place);
  const chars=E.characters,byId=id=>chars.find(c=>c.id===id)||chars[0],n=s.actors.length;
  const fgp=s.props.filter(p=>p.pos==="foreground"),bgp=s.props.filter(p=>p.pos!=="foreground"),PX={left:120,center:270,right:420};
  if(s.shot==="prop"){g.fillStyle="rgba(0,0,0,.38)";g.fillRect(-20,-20,580,1000);const p=s.props[0];if(p)drawProp(g,p,270,480,2.1,t,pre,pal)}
  else{
    bgp.forEach(p=>drawProp(g,p,PX[p.pos]||270,600,.95,t,pre,pal));
    if(s.shot==="closeup"&&n){const a=s.actors[0];person(g,270,480+338*1.9,1.9,byId(a.id).look,a.expr,t,pre,a.action,pal,0)}
    else{const sc=s.shot==="wide"?(n>1?.5:.58):(n===1?.92:n===2?.78:.6),fy=s.shot==="wide"?830:880;
      const xs=n===1?[PX[s.actors[0].pos]===120?170:PX[s.actors[0].pos]===420?370:270]:n===2?[170,370]:[110,270,430];
      s.actors.forEach((a,i)=>person(g,xs[i],fy,sc,byId(a.id).look,a.expr,t,pre,a.action,pal,i))}
    fgp.forEach(p=>drawProp(g,p,270,780,1.5,t,pre,pal))}
  g.restore();
  if(crt){x.save();x.imageSmoothingEnabled=false;x.drawImage(EPC,0,0,540,960);x.restore()}
  const dim=1-eo(t/.01);epFx(x,pre,t);
  const anchor=s.actors.length?(s.actors.length===1?270:s.actors.length===2?170:110):270;
  epOverlay(x,s,t,pal,pre,anchor);epBadges(x,E,pre);epSubs(x,s,t,I,pre,pal);
  const f=1-clamp(t/.22);if(f>0){x.fillStyle="rgba(0,0,0,"+(f*.85)+")";x.fillRect(0,0,540,960)}
}
function cleanEpScene(s){return normEpScene(s,EPI.characters,EPI.preset)}
