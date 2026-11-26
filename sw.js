/* Service worker MPN.studio: simpan berkas aplikasi agar cepat dan bisa dibuka offline.
   Naikkan VERSI setiap kali kamu mengubah berkas supaya pengguna mendapat versi terbaru. */
const VERSI = "mpn-v2";
const BERKAS = ["./", "index.html", "style.css", "core.js", "engine.js", "episode.js", "prog.js", "ai.js", "clipper.js", "t2v.js", "init.js", "manifest.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(BERKAS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSI).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; // API Google, CDN, dan font tidak disentuh
  if (r.mode === "navigate") { // halaman utama: ambil versi terbaru dulu, cache hanya saat offline
    e.respondWith(fetch(r).then((res) => { if (res && res.ok) caches.open(VERSI).then((c) => c.put("index.html", res.clone())); return res; }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.open(VERSI).then(async (c) => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then((res) => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
