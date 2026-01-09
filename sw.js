// sw.js - Service Worker
const CACHE_NAME = 'beautyhub-v1.1';
const urlsToCache = [
    '.',  //root
    'index.html',
    'styles.css',
    
    //js files
    'js/cart.js',
    'js/ordersManager.js',
    'js/productsManager.js',
    'js/inventoryManager.js',
    'js/products.js',
    'js/customerSearch.js',
    'js/customerorder.js',
    'js/admin.js',
    'js/main.js',
    
    'manifest.json',
    
    //icons
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'favicon.ico',
    
    //gallery
    'gallery/lashes.jpg',
    'gallery/perfumes.jpg',    
    'gallery/wigs.jpg',
    'gallery/skincare.jpg',
    'gallery/herobanner.jpg',
    
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
