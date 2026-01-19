// sw.js - SIMPLIFIED SERVICE WORKER
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('[SW] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    // Only handle HTML requests
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    // When offline, serve offline.html
                    return caches.match('offline.html');
                })
        );
    }
});
