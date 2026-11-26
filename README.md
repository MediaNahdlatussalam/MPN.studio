# MPN.studio

Klip video, auto edit, teks ke video bersuara, serial kartun interaktif, dan episode kartun dinamis. Semua berjalan di browser (HP dan laptop).
Gratis dengan API key Gemini milikmu sendiri.

## Semua file ada di satu level (tanpa folder)

```
index.html            halaman utama (harus berada di paling atas/root repositori)
style.css             tampilan
core.js  engine.js  episode.js  prog.js  ai.js  clipper.js  t2v.js  init.js    kode aplikasi (dimuat berurutan)
sw.js                 service worker (cepat dan bisa offline)
manifest.webmanifest  agar bisa dipasang di layar utama
favicon.svg  icon-192.png  icon-512.png  icon-maskable-512.png    ikon
episode-schema.md     skema JSON episode kartun, system prompt, contoh payload, cara uji
server-worker.js      server bersama (opsional, untuk dipakai beberapa orang)
server-worker.test.mjs  uji server bersama (node server-worker.test.mjs)
wrangler.jsonc  .assetsignore    pengaturan Cloudflare Workers (lihat di bawah)
.nojekyll             agar GitHub Pages menyajikan semua file apa adanya
```

## 1. Pasang di internet

**GitHub Pages:** unggah SEMUA file di atas ke root repositori (index.html harus langsung terlihat di halaman utama repositori, bukan di dalam folder). Lalu Settings, Pages, Source: Deploy from a branch, pilih branch utama dan folder `/ (root)`, Save. Tunggu 1-2 menit.

**Cloudflare Workers (static assets):** hubungkan repositori ini, atau jalankan `npx wrangler deploy` di folder ini. `wrangler.jsonc` sudah mengatur agar yang disajikan adalah folder ini, dan `.assetsignore` menyembunyikan berkas yang tidak perlu (README, server-worker, dan lainnya). Kalau repositori kamu sudah punya berkas `wrangler.*` sendiri, jangan timpa; cukup pastikan `assets.directory` menunjuk ke folder yang berisi index.html.

**Netlify Drop / Cloudflare Pages:** seret folder ini (atau unggah isinya) ke app.netlify.com/drop atau Workers & Pages, Create, Pages, Upload assets.

Buka linknya di HP, lalu pilih "Tambahkan ke layar utama".

## 2. API key Gemini (gratis)

Buka aistudio.google.com/apikey, buat key, lalu di aplikasi buka **Pengaturan AI**, tempel key, klik **Simpan dan cek**, lalu **Cek kesiapan**. Semua baris harus berawalan ✓.

## 3. Episode kartun dinamis

Di tab **Teks ke video**, pilih jenis **Episode kartun**. Gemini memilih sendiri gaya visual (satire 2D, retro blocky, atau emosional 2D), palet warna, tokoh, jumlah adegan, kamera, ekspresi, properti, dan teks overlay sesuai topikmu, lalu animasi menggambarnya. Tulis arah cerita dan klik **Lanjut Part 2** untuk melanjutkan dengan tokoh yang sama. Detail skema, system prompt, dan cara uji ada di `episode-schema.md`.

## 4. Dipakai beberapa orang

- **Paling mudah:** bagikan link aplikasinya, dan tiap orang memasukkan key Gemini miliknya sendiri.
- **Tanpa key untuk temanmu:** pasang `server-worker.js` sebagai Worker terpisah di Cloudflare.
  1. dash.cloudflare.com, Workers & Pages, Create, Worker, Deploy, lalu Edit code: tempel isi `server-worker.js`, Deploy.
  2. Settings, Variables and Secrets: tambahkan `GEMINI_API_KEY` (secret, key-mu) dan `ACCESS_CODES` (secret, satu kode per orang dipisah koma, misalnya `budi-7391,sari-4420`).
  3. Salin alamat `https://....workers.dev`, tempel di Pengaturan AI bersama salah satu kode, klik Simpan dan cek, lalu **Salin link undangan** dan kirim ke temanmu.

  Kuota gratis Gemini dipakai bersama, dengan batas 12 permintaan AI per menit per orang.

## Kalau tampilan tidak muncul atau masih versi lama

1. Pastikan `index.html` ada di root (bukan di dalam folder) dan semua file `.js` serta `style.css` berada di tempat yang sama dengannya.
2. Muat ulang dua kali (versi lama bisa tersimpan sementara oleh service worker). Di HP: hapus data situs, atau buka Pengaturan situs lalu Hapus & Reset.
3. Setelah mengubah file, naikkan `VERSI` di `sw.js` (misalnya `mpn-v3`) supaya pengguna mendapat versi terbaru.

## Batas yang perlu diketahui

- Video YouTube tidak bisa diunduh browser. Link dipakai untuk transkrip dan momen, ekspor klip butuh file videonya.
- Ekspor berjalan real-time (30 detik video butuh 30 detik) dan hasilnya `.webm`. Untuk TikTok atau Instagram, ubah ke MP4 dengan converter gratis.
- Tidak ada musik latar, hanya sound effect.
- Paket gratis Gemini bisa dipakai Google untuk meningkatkan produknya. Jangan proses materi rahasia.
