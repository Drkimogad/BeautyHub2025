// sw.js - FIXED SERVICE WORKER
const CACHE_NAME = 'beautyhub-cache-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    
    // Cache offline.html immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching offline page');
                return cache.addAll([OFFLINE_URL]);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    // Only handle HTML navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(async () => {
                    try {
                        // Try to get from cache
                        const cache = await caches.open(CACHE_NAME);
                        const cachedResponse = await cache.match(OFFLINE_URL);
                        
                        if (cachedResponse) {
                            console.log('[SW] Serving offline.html from cache');
                            return cachedResponse;
                        }
                        
                        // If not in cache, try to fetch it
                        return fetch(OFFLINE_URL);
                    } catch (error) {
                        // Last resort: create a simple response
                        console.log('[SW] Creating fallback offline page');
                        return new Response(
                            '<h1>You are offline</h1><p>Please check your internet connection.</p>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    }
                })
        );
    }
    
    // For other requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});
