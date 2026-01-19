// sw.js - UNIVERSAL SERVICE WORKER FOR ALL HOSTING
const CACHE_NAME = 'beautyhub-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            // Cache offline page
            await cache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
            console.log('[SW] Cached offline page');
            
            // Force activation
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    // Take control immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Only handle page navigation
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // Try network first
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    console.log('[SW] Network failed, serving offline page');
                    
                    // Get offline page from cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(OFFLINE_URL);
                    
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Last resort: basic offline page
                    return new Response(
                        '<h1>Offline</h1><p>Please check your internet connection.</p>',
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            })()
        );
    }
    // For other resources, use cache-first
    else if (event.request.url.includes('/BeautyHub2025/') || 
             event.request.destination === 'script' || 
             event.request.destination === 'style') {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    return cachedResponse || fetch(event.request);
                })
        );
    }
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
