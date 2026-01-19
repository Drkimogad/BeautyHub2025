// sw.js - Service Worker for BeautyHub2025
const CACHE_NAME = 'beautyhub-v2.0';
const OFFLINE_PAGE = 'offline.html';

// Auto-detect environment based on current URL
function detectEnvironment() {
    const pathname = self.location.pathname;
    
    if (pathname.includes('/BeautyHub2025/')) {
        console.log('🌐 Detected GitHub Pages environment');
        return {
            root: '/BeautyHub2025/',
            isGitHub: true
        };
    } else {
        console.log('🔥 Detected Firebase Hosting environment');
        return {
            root: '/',
            isGitHub: false
        };
    }
}

const ENV = detectEnvironment();

// Helper to get correct path for current environment
function getEnvPath(url) {
    // For external URLs, use as-is
    if (url.startsWith('http')) return url;
    
    // For GitHub Pages, prepend the root path
    if (ENV.isGitHub && !url.startsWith(ENV.root)) {
        // Remove leading slash if present, then add environment root
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return ENV.root + cleanUrl;
    }
    
    // For Firebase or already correct paths
    return url;
}

// Core assets to cache
const CORE_ASSETS = [
    // HTML
    'index.html',
    'offline.html',
    
    // Core CSS/JS
    'styles.css',
    'js/main.js',
    'js/cart.js',
    'js/ordersManager.js',
    'js/productsManager.js',
    'js/inventoryManager.js',
    'js/products.js',
    'js/customerSearch.js',
    'js/customerorder.js',
    'js/admin.js',
    
    // Manifest
    'manifest.json',
    
    // Icons
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'favicon.ico',
    
    // Gallery images
    'gallery/lashes.jpg',
    'gallery/perfumes.jpg',    
    'gallery/wigs.jpg',
    'gallery/skincare.jpg',
    'gallery/herobanner.jpg',
    
    // External dependencies (cached for offline use)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - Cache core assets
self.addEventListener('install', event => {
    console.log('🚀 Service Worker installing for:', ENV.root);
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            // Cache core assets with error handling
            for (const url of CORE_ASSETS) {
                try {
                    const fullUrl = getEnvPath(url);
                    await cache.add(new Request(fullUrl, { mode: 'no-cors' }));
                    console.log('✅ Cached:', fullUrl);
                } catch (err) {
                    console.warn('⚠️ Failed to cache:', url, err);
                }
            }
            
            // Skip waiting to activate immediately
            self.skipWaiting();
            console.log('✅ Service Worker installed');
        })()
    );
});

// Fetch event - Show offline.html immediately when offline
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Handle navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // Try network first
                    const networkResponse = await fetch(request);
                    
                    // If online, cache and return the fresh page
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                    
                } catch (networkError) {
                    console.log('📵 OFFLINE - Serving offline page');
                    
                    // ALWAYS show offline.html when offline, even if index.html is cached
                    const offlinePage = await caches.match(getEnvPath(OFFLINE_PAGE));
                    if (offlinePage) {
                        return offlinePage;
                    }
                    
                    // Fallback if offline.html not cached
                    return new Response(
                        '<h1>Offline</h1><p>Please check your internet connection</p>',
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            })()
        );
        return; // Skip other handlers for navigation
    }
    
    // For other assets (JS, CSS, images) - use cache first
    event.respondWith(
        caches.match(request)
            .then(response => response || fetch(request))
    );
});

// Activate event - Cleanup
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker activating...');
    
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
            
            // Take control immediately
            await self.clients.claim();
            console.log('✅ Service Worker activated');
        })()
    );
});

// Handle messages from app
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
