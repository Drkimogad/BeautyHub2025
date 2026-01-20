// sw.js - Service Worker for BeautyHub2025
const CACHE_NAME = 'beautyhub-v2.6';
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
    'gallery/herobanner.jpg'
    
    // External dependencies (cached for offline use)
    //'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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

// Fetch event - SIMPLE FIXED VERSION
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Only handle navigation requests
    if (request.mode !== 'navigate') return;
    
    // Don't intercept offline.html
    if (url.pathname.includes('offline.html')) return;
    
    event.respondWith(
        (async () => {
            try {
                // Try to fetch from network
                const response = await fetch(request);
                
                // Cache successful responses
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, response.clone());
                }
                
                return response;
            } catch (error) {
                // Network failed - serve offline.html
                console.log('SW: Offline, serving offline.html');
                
                // Try to get offline.html from cache
                const offlinePage = await caches.match(OFFLINE_PAGE);
                if (offlinePage) {
                    return offlinePage;
                }
                
                // Last resort: create offline page
                return new Response(
                    '<h1>Offline</h1><p>Please check your internet connection.</p>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            }
        })()
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
