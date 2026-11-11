// Service worker da AGENDA FM. Registrado com scope "./agenda.html":
// não interfere nos outros painéis do site.
const CACHE = "agenda-fm-v7";
const SHELL = ["agenda.html", "logo-unifm.png", "agenda-app/manifest.webmanifest", "agenda-app/icon-192.png", "agenda-app/icon-512.png"];

const OFFLINE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AGENDA FM</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b2257;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#f2a81d;color:#0b1a3d;font-weight:700;font-size:15px}</style></head>
<body><div><h1 style="margin:0 0 8px">AGENDA FM</h1><p>Sem conexão com a internet.<br>A agenda precisa de internet para mostrar as reuniões atualizadas.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("agenda-fm-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // dados do Supabase sempre direto da rede
  // rede primeiro (sempre a versão mais nova); cache só quando estiver sem internet
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(async () => {
      const hit = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
      if (hit) return hit;
      if (req.mode === "navigate") return new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      return Response.error();
    })
  );
});
