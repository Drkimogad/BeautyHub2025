// sw-simple.js - ONLY serves offline.html when offline
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle main page requests
    if (event.request.mode === 'navigate' && 
        !url.pathname.endsWith('offline.html')) {
        
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // When offline, redirect to offline.html
                    return Response.redirect('./offline.html?from=sw', 302);
                })
        );
    }
});
