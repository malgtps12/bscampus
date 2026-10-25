const CACHE_NAME = 'bscampus-v2';

// Service worker versi lama menyimpan response GET (termasuk /api/*) secara
// cache-first. Cache itu tidak pernah terhapus karena nama cache-nya tetap,
// sehingga produk baru bisa "hilang" dari katalog. Versi ini:
// - mengganti nama cache agar cache lama dibersihkan saat activate
// - tidak pernah menyimpan /api/* maupun payload RSC
// - memakai network-first untuk navigasi halaman
// - langsung mengambil alih tab yang masih memakai worker lama
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Biarkan network menangani request non-GET, lintas origin, dan API.
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navigasi halaman: network-first supaya HTML selalu versi terbaru.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Hanya aset statis (chunk Next.js, gambar, font) yang boleh cache-first.
  // Payload RSC tidak di-cache agar data halaman tidak basi.
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
      )
    );
  }
});
