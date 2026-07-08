const CACHE_NAME = "opera-formacao-v1";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/logo-opera.png",
  "/fonts/fonts.css",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core app shell...");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate and Clean Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and http/https schemes (avoids Chrome Extensions, WebSockets, etc.)
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") {
    return;
  }

  // Only handle same-origin or specific external resources (like remote backup postimg fallbacks)
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isImageOrFont = 
    event.request.destination === "image" || 
    event.request.destination === "font" || 
    requestUrl.pathname.includes("/bg/") || 
    requestUrl.pathname.includes("/fonts/");

  if (isSameOrigin || requestUrl.hostname.includes("postimg.cc") || requestUrl.hostname.includes("gstatic.com")) {
    if (isImageOrFont) {
      // CACHE-FIRST STRATEGY (Excellent for stable templates, logo and fonts)
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback for images
            return new Response("", { status: 404, statusText: "Offline" });
          });
        })
      );
    } else {
      // NETWORK-FIRST STRATEGY (For HTML, JS, CSS so updates are loaded when online)
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed / offline -> serve immediately from cache!
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If it's a page navigation, return root index.html as fallback
              if (event.request.mode === "navigate") {
                return caches.match("/");
              }
              return new Response("Desconectado da Internet", { status: 503, statusText: "Offline" });
            });
          })
      );
    }
  }
});
