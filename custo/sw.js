// Service worker do Calculador de CMV e CMO. Escopo: só a pasta custo/.
// Não interfere na Agenda, na Despensa nem nos outros painéis do site.
// Os cálculos funcionam sem internet: a página fica guardada no aparelho.
const CACHE = "custocerto-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("custocerto-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const fonts = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  // Rede primeiro (pega a versão nova); sem internet, usa o que está guardado.
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(async () => {
      const hit = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
      if (hit) return hit;
      if (req.mode === "navigate") { const home = await caches.match("index.html"); if (home) return home; }
      return Response.error();
    })
  );
});
