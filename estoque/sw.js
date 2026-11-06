// Service worker da Despensa de Eventos. Escopo: só a pasta estoque/.
// Não interfere na Agenda nem nos outros painéis do site.
const CACHE = "despensa-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

const OFFLINE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Despensa de Eventos</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#2c6a4d;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#f3d64a;color:#2a2306;font-weight:700;font-size:15px}</style></head>
<body><div><h1 style="margin:0 0 8px">Despensa de Eventos</h1><p>Sem conexão com a internet.<br>O estoque precisa de internet para mostrar os dados atualizados.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("despensa-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Supabase e fontes sempre direto da rede
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
