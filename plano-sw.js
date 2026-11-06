// Service worker do PLANO DE AÇÃO. Registrado com scope "./plano-de-acao.html":
// não interfere nos outros painéis do site.
const CACHE = "plano-de-acao-v1";
const SHELL = ["plano-de-acao.html", "logo-unifm.png", "fundo.jpg", "plano-app/manifest.webmanifest", "plano-app/icon-192.png", "plano-app/icon-512.png"];

const OFFLINE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PLANO DE AÇÃO</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#10296a;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#ffac03;color:#0a2a6b;font-weight:700;font-size:15px}</style></head>
<body><div><h1 style="margin:0 0 8px">PLANO DE AÇÃO</h1><p>Sem conexão com a internet.<br>O painel precisa de internet para mostrar as tarefas atualizadas.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("plano-de-acao-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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

// Avisos (notificações push) das etapas
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: "Plano de Ação", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Plano de Ação", {
    body: d.body || "", tag: d.tag, icon: "plano-app/icon-192.png", badge: "plano-app/icon-192.png",
    data: { url: d.url || "plano-de-acao.html?app=1" }, requireInteraction: true
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.url) || "plano-de-acao.html", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    for (const c of l) { if (c.url.indexOf("plano-de-acao.html") >= 0 && "focus" in c) return c.focus(); }
    return clients.openWindow(u);
  }));
});
