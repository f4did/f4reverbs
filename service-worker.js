const CACHE_NAME = "f4-reverbs-v3.2.8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./site.webmanifest",
  "./f4-ui.css",
  "./scroll-fix.css",
  "./f4-mobile-controls.js",
  "./f4-icon.svg",
  "./favicon.ico",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const isNavigation = request.mode === "navigate";
  event.respondWith(
    isNavigation
      ? fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        }).catch(() => caches.match("./index.html"))
      : caches.match(request).then((cached) => cached || fetch(request).then((response) => {
          if (response.ok && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }))
  );
});
