const CACHE_NAME = "unlockpro-v1";
const ASSETS = ["/", "/auth/login", "/dashboard", "/dashboard/orders/new", "/dashboard/wallet"];

self.addEventListener("install", (e: any) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener("fetch", (e: any) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response("Offline", { status: 503 })))
  );
});
