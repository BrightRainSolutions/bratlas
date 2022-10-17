const staticBratlas = "bratlas_app"
const assets = [
  "/",
  "/index.html",
  "/index.css",
  "/index.js",
  "/bratlas-pin.svg",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticBratlas).then(cache => {
      cache.addAll(assets)
    })
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticBratlas)
        .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})