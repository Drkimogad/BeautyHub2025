// sw.js - Service Worker for BeautyHub2025 (FIXED)
const CACHE_NAME = 'beautyhub-v3.0';

// Determine environment
const isGitHub = self.location.pathname.includes('/BeautyHub2025/');
const ROOT_PATH = isGitHub ? '/BeautyHub2025/' : '/';

console.log('🌐 SW Environment:', { isGitHub, root: ROOT_PATH });

// Core assets with CORRECT ABSOLUTE PATHS for SW
const CORE_ASSETS = [
    // HTML - ABSOLUTE paths for SW
    ROOT_PATH + 'index.html',
    ROOT_PATH + 'offline.html',
    
    // Core CSS/JS - ABSOLUTE paths
    ROOT_PATH + 'styles.css',
    ROOT_PATH + 'js/main.js',
    ROOT_PATH + 'js/cart.js',
    ROOT_PATH + 'js/ordersManager.js',
    ROOT_PATH + 'js/productsManager.js',
    ROOT_PATH + 'js/inventoryManager.js',
    ROOT_PATH + 'js/products.js',
    ROOT_PATH + 'js/customerSearch.js',
    ROOT_PATH + 'js/customerorder.js',
    ROOT_PATH + 'js/admin.js',
    
    // Manifest
    ROOT_PATH + 'manifest.json',
    
    // Icons
    ROOT_PATH + 'icons/icon-192x192.png',
    ROOT_PATH + 'icons/icon-512x512.png',
    ROOT_PATH + 'favicon.ico',
    
    // Gallery images
    ROOT_PATH + 'gallery/lashes.jpg',
    ROOT_PATH + 'gallery/perfumes.jpg',    
    ROOT_PATH + 'gallery/wigs.jpg',
    ROOT_PATH + 'gallery/skincare.jpg',
    ROOT_PATH + 'gallery/herobanner.jpg'
];

// Install event - Cache core assets
self.addEventListener('install', event => {
    console.log('🚀 SW installing for:', ROOT_PATH);
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            // Cache each asset individually (as per your notes)
            for (const url of CORE_ASSETS) {
                try {
                    // Use same-origin requests for local assets
                    const request = new Request(url, {
                        mode: 'same-origin',
                        credentials: 'include'
                    });
                    
                    await cache.add(request);
                    console.log('✅ Cached:', url);
                } catch (err) {
                    console.warn('⚠️ Failed to cache:', url, err.message);
                    // Continue caching other files (graceful degradation)
                }
            }
            
            // Force activation
            self.skipWaiting();
            console.log('✅ SW installed successfully');
        })()
    );
});

// Fetch event - Simple and reliable
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Only handle HTML/JS/CSS requests
    if (!request.url.includes(self.location.origin)) return;
    
    // Don't handle offline.html - let browser fetch it normally
   // if (url.pathname.includes('offline.html')) return;
    // Skip when the REQUEST is for offline.html itself
    if (request.url.includes('offline.html')) return;

    
    // Don't handle admin/data requests
    if (request.url.includes('/admin.html') || 
        request.url.includes('/data/')) return;
    
    event.respondWith(
        (async () => {
            try {
                // Try network first
                const networkResponse = await fetch(request);
                
                // Cache successful responses
                if (networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, networkResponse.clone());
                }
                
                return networkResponse;
            } catch (error) {
                // Network failed - we're offline
                console.log('📵 Offline detected:', request.url);
                
                // Try cache first for everything
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    console.log('✅ Serving from cache:', request.url);
                    return cachedResponse;
                }
                
                // If it's an HTML request, serve offline.html
                if (request.headers.get('Accept')?.includes('text/html') ||
                    request.destination === 'document') {
                    console.log('📄 HTML request, serving offline.html');
                    const offlineUrl = ROOT_PATH + 'offline.html';
                    const offlineResponse = await caches.match(offlineUrl);
                    
                    if (offlineResponse) {
                        return offlineResponse;
                    }
                }
                
                // Last resort for other assets
                return new Response('Offline', { 
                    status: 408,
                    statusText: 'Network Error' 
                });
            }
        })()
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('🔄 SW activating...');
    
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
            
            // Take control of all clients
            await self.clients.claim();
            console.log('✅ SW activated and controlling clients');
        })()
    );
});
