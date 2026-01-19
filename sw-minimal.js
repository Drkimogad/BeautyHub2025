// Minimal SW that only handles offline redirection
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());

self.addEventListener('fetch', event => {
    // Only handle navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Show offline.html when offline
                return caches.match('/BeautyHub2025/offline.html') || 
                       caches.match('/offline.html') ||
                       new Response('Offline - check connection');
            })
        );
    } else {
        // Pass through all other requests
        event.respondWith(fetch(event.request));
    }
});
