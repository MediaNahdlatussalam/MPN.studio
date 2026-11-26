# Mesin Episode Kartun Dinamis

Animasi episode **tidak ditulis ulang tiap ganti cerita**. Gemini mengisi data (JSON), dan renderer menggambarnya.

```
topik pengguna
   -> Gemini (system prompt + responseSchema + responseMimeType: application/json)
   -> JSON episode
   -> normEp()  validasi, default, batas panjang (animasi tidak pernah crash)
   -> episodeScene()  renderer  -> video
```

## Di mana kodenya

| Bagian | File | Isi |
|---|---|---|
| Kontrak dan renderer | `episode.js` | `EP_PRESETS`, `EP_SYSTEM`, `EP_SCHEMA`, `normEp`, `localEpisode`, `episodeScene` |
| Pemanggilan Gemini | `ai.js` | `geminiJson(prompt, parts, ms, {system, schema})`, coba ulang, fallback tanpa skema |
| Alur pembuatan | `t2v.js` | `makeEpisode`, tombol Lanjut Part, penyimpanan serial |
| Pembaca JSON ke adegan | `engine.js` | `scene()` meneruskan `kind:"ep"` ke `episodeScene`, `cleanScene()` memakai `normEpScene` |

## Tiga visual preset (dipilih Gemini sesuai nada topik)

| `visual_preset` | Tampilan | Cocok untuk |
|---|---|---|
| `2d-flat-satire` | Kartun 2D flat, outline tebal, warna cerah kontras, subtitle dengan kata kunci kuning | komedi absurd, satire, aturan kota unik |
| `retro-blocky-surreal` | Tokoh dan latar balok, dipikselkan, garis scan TV, subtitle satu kata per satu | misteri, fantasi, surealis, siaran aneh |
| `2d-flat-emotional` | Kartun 2D flat hangat dan sendu, bayangan film, lencana kanal dan PART | drama keluarga, perantauan, misteri emosional |

## Skema JSON episode

```
episode:
  title, logline (ringkasan, ikut diperbarui tiap Part), part (angka), channel ("@nama")
  visual_preset: 2d-flat-satire | retro-blocky-surreal | 2d-flat-emotional
  palette: bg, primary, secondary, accent, ink   (format #RRGGBB)
  characters[1..4]: id, name, look{skin, hair, hairStyle, shirt, pants, accessory, build}
    hairStyle: pendek | panjang | botak | jilbab | topi | peci | keriting | kuncir
    accessory: none | kacamata | kumis | topi        build: normal | gemuk | kurus | anak
scenes[1..24]  (jumlah mengikuti alur):
  dur (3-14 detik), camera: cut | zoom_in | zoom_out | pan_left | pan_right | shake
  shot: wide | medium | closeup | prop
  setting: place (ruang_tamu, kamar, dapur, jalan, rumah_malam, terminal, bus, sekolah, kantor,
                  pasar, masjid, taman, studio_tv, kota, hutan, pantai), time (pagi|siang|sore|malam),
           weather (cerah|hujan|mendung)
  actors[0..3]: id (id tokoh), expr (idle|shocked|sad|focused|smirk|happy|angry|scared|transformed),
                pos (left|center|right), action (none|wave|point|hold)
  props[0..2]: type (phone|clock|tv|letter|box|ticket|bag|book|key|photo|laptop|paper), text (maks 20), pos
  overlay: kind (pill|banner|bubble|ui|none), text (maks 24), sub (maks 24)
  say (narasi, maks 220 karakter), hl (kata kunci sorot kuning)
```

## Validasi dan fallback di sisi aplikasi

- Nilai di luar daftar diganti default (kamera `cut`, tempat `ruang_tamu`, ekspresi `idle`, dan seterusnya).
- Teks dipotong sesuai batas, warna yang bukan `#RRGGBB` diganti warna preset, id aktor yang tidak dikenal dipetakan ke tokoh yang ada, aktor dibatasi 3, properti 2.
- Palet dijaga agar warna tinta tetap kontras dengan warna sorotan.
- Kalau Gemini menolak `responseSchema`, permintaan diulang tanpa skema (aturan tetap ada di system prompt, hasilnya tetap divalidasi).
- Kalau JSON rusak atau terpotong, dicoba lagi sampai 3 kali (objek adegan yang utuh diselamatkan dari JSON terpotong). Kalau tetap gagal, `localEpisode()` membuat episode dari teks pengguna supaya animasi tetap jalan.
- Part berikutnya memakai preset, palet, dan tokoh Part sebelumnya, apa pun yang dikembalikan Gemini.

## System prompt siap pakai (`EP_SYSTEM`)

```
Kamu adalah penulis naskah dan sutradara serial pendek animasi vertikal 9:16 berbahasa Indonesia. Kamu mengisi data untuk mesin animasi, jadi KELUARANMU HANYA SATU OBJEK JSON yang valid sesuai skema, tanpa markdown dan tanpa teks lain.

PILIH VISUAL PRESET sesuai nada topik:
- "2d-flat-satire": kartun 2D flat ber-outline tebal, warna cerah kontras. Untuk komedi absurd, satire, kejadian aneh sehari-hari, aturan kota atau kampung yang unik.
- "retro-blocky-surreal": gaya balok low-poly retro dengan nuansa TV, layar, dan malam. Untuk misteri, fantasi, surealis, siaran aneh.
- "2d-flat-emotional": kartun 2D flat ber-outline tebal, warna hangat dan sendu. Untuk drama keluarga, perantauan, kerinduan, misteri emosional.

PALETTE: bg, primary, secondary, accent, ink dalam format "#RRGGBB". Pilih warna yang cocok dengan suasana, ink harus kontras dengan bg, accent dipakai untuk sorotan teks.

STRUKTUR CERITA: hook kuat di adegan pertama, konflik naik, satu kejutan atau pembalikan, lalu penutup yang menggantung (cliffhanger) atau menyentuh. Jumlah adegan MENGIKUTI ALUR (umumnya 8 sampai 14, boleh lebih untuk cerita panjang, maksimal 24). Tiap adegan 3 sampai 10 detik ("dur").

TOKOH: 2 sampai 4 tokoh dengan "id" pendek unik. Tampilan (look) harus konsisten sepanjang episode. Setiap actor di adegan memakai id tokoh itu.

PER ADEGAN: pilih "setting" (place, time, weather), "shot" (wide, medium, closeup, prop), "camera" (variasikan: cut, zoom_in, zoom_out, pan_left, pan_right, shake), "actors" dengan ekspresi yang cocok dengan emosi (idle, shocked, sad, focused, smirk, happy, angry, scared, transformed), "props" yang relevan HANYA dengan adegan itu (jangan membawa properti dari adegan lain), dan "overlay" singkat (pill, banner, bubble, ui) hanya jika menambah cerita.
BATAS PANJANG: overlay.text dan overlay.sub maksimal 24 karakter; props.text maksimal 20 karakter; "say" 1 sampai 2 kalimat pendek maksimal 22 kata, bahasa Indonesia santai dan natural, mudah dibacakan; "hl" satu kata kunci dari "say" untuk disorot kuning.
Jangan memakai emoji. Semua teks dalam bahasa Indonesia.
```

## Contoh payload: topik A (satire)

```json
{
  "episode": {
    "title": "Kota Terbalik",
    "logline": "Warga wajib bicara terbalik.",
    "part": 1,
    "channel": "@satirkota",
    "visual_preset": "2d-flat-satire",
    "palette": {
      "bg": "#f2d58a",
      "primary": "#2f80ed",
      "secondary": "#e5533d",
      "accent": "#ffd23f",
      "ink": "#1b1b1b"
    },
    "characters": [
      {
        "id": "damar",
        "name": "Damar",
        "look": {
          "skin": "#e0ac69",
          "hair": "#1b1b1b",
          "hairStyle": "pendek",
          "shirt": "#14b8a6",
          "pants": "#374151",
          "accessory": "none",
          "build": "anak"
        }
      }
    ]
  },
  "scenes": [
    {
      "dur": 6,
      "camera": "pan_left",
      "shot": "wide",
      "setting": {
        "place": "jalan",
        "time": "pagi",
        "weather": "cerah"
      },
      "actors": [
        {
          "id": "damar",
          "expr": "shocked",
          "pos": "center",
          "action": "none"
        }
      ],
      "props": [],
      "overlay": {
        "kind": "banner",
        "text": "ATURAN BARU"
      },
      "say": "Pagi ini aturan kota berubah total.",
      "hl": "berubah"
    },
    {
      "dur": 6,
      "camera": "zoom_in",
      "shot": "prop",
      "setting": {
        "place": "ruang_tamu",
        "time": "siang",
        "weather": "cerah"
      },
      "actors": [],
      "props": [
        {
          "type": "paper",
          "text": "WAJIB TERBALIK",
          "pos": "center"
        }
      ],
      "overlay": {
        "kind": "pill",
        "text": "pengumuman RT"
      },
      "say": "Semua warga wajib bicara terbalik.",
      "hl": "terbalik"
    }
  ]
}
```

## Contoh payload: topik B (emosional)

```json
{
  "episode": {
    "title": "Pulang",
    "logline": "Anak rantau pulang menemui ibu.",
    "part": 1,
    "channel": "@makisah",
    "visual_preset": "2d-flat-emotional",
    "palette": {
      "bg": "#4a3328",
      "primary": "#c2410c",
      "secondary": "#8a5a3a",
      "accent": "#fcd34d",
      "ink": "#1f1410"
    },
    "characters": [
      {
        "id": "dimas",
        "name": "Dimas",
        "look": {
          "skin": "#f1c27d",
          "hair": "#1b1b1b",
          "hairStyle": "pendek",
          "shirt": "#dc2626",
          "pants": "#374151",
          "accessory": "none",
          "build": "normal"
        }
      }
    ]
  },
  "scenes": [
    {
      "dur": 6,
      "camera": "zoom_in",
      "shot": "closeup",
      "setting": {
        "place": "bus",
        "time": "malam",
        "weather": "hujan"
      },
      "actors": [
        {
          "id": "dimas",
          "expr": "sad",
          "pos": "center",
          "action": "none"
        }
      ],
      "props": [],
      "overlay": {
        "kind": "none",
        "text": ""
      },
      "say": "Lima tahun aku merantau tanpa kabar.",
      "hl": "merantau"
    },
    {
      "dur": 6,
      "camera": "cut",
      "shot": "prop",
      "setting": {
        "place": "terminal",
        "time": "malam",
        "weather": "cerah"
      },
      "actors": [],
      "props": [
        {
          "type": "ticket",
          "text": "JKT > KLATEN",
          "pos": "center"
        }
      ],
      "overlay": {
        "kind": "pill",
        "text": "tiba 21.15"
      },
      "say": "Bus terakhir tiba pukul sembilan.",
      "hl": "terakhir"
    }
  ]
}
```

## Cara uji cepat dengan dua topik

1. Buka tab **Teks ke video**, pilih jenis video **Episode kartun**.
2. Topik 1: `Aturan kota aneh: semua warga wajib bicara terbalik.` Klik **Buat video lengkap**. Harapannya: gaya cerah satire, banyak overlay dan kata kunci kuning.
3. Topik 2: `Anak rantau pulang kampung setelah lima tahun menemui ibu.` Harapannya: warna hangat dan sendu, lencana kanal dan PART berubah.
4. Topik 3 (opsional, pilih gaya Retro blocky): `Pak RT menemukan saluran TV yang tidak pernah selesai tayang.` Harapannya: tampilan balok, garis scan, subtitle satu kata.
5. Di kolom **Edit scene (JSON)** kamu bisa melihat JSON episode yang sedang dipakai. Ubah `visual_preset` atau satu `palette`, klik **Putar**, dan tampilan ikut berubah tanpa mengubah kode.
6. Setelah selesai, tulis arah cerita lalu klik **Lanjut Part 2**. Tokoh dan gaya harus tetap sama.
