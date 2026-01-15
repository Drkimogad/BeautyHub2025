// main.js - Simplified coordinator
const AppManager = (function() {
    
    // ===== MAIN INITIALIZATION =====
    function init() {
        try {
   
            // call this before productsManager.js
if (typeof ProductsDisplay !== 'undefined' && ProductsDisplay.init) {
    ProductsDisplay.init();
    console.log('[AppManager] ProductsDisplay initialized');
}
            // Initialize ProductsManager then
        if (typeof ProductsManager !== 'undefined' && ProductsManager.init) {
            ProductsManager.init();
            console.log('[AppManager] ProductsManager initialized');
        }
            
     // Initialize Cart FIRST (before any products can be added)
    if (typeof BeautyHubCart !== 'undefined' && BeautyHubCart.init) {
        BeautyHubCart.init();
        console.log('[AppManager] Cart initialized');
    }

                // Check if admin.js loaded properly
    if (typeof AdminManager === 'undefined') {
        console.error('[AppManager] CRITICAL: AdminManager not loaded!');
        console.log('[AppManager] Available modules:', {
            ProductsManager: typeof ProductsManager,
            BeautyHubCart: typeof BeautyHubCart,
            AdminManager: typeof AdminManager
        });
    }
            console.log('[AppManager] BeautyHub2025 PWA Initializing...');
            
            // Setup core UI functionality
            setupSmoothScrolling();
            initializeShippingSection();
            initializePrivacySection();
            setupNavigationHandlers();
            
            // Connect cart button
            connectCartButton();
            
            //  admin button
            connectAdminButton();
            
            // Connect checkout button
            connectCheckoutButton();
            
            // Setup PWA features
            setupPWA();
            
            console.log('[AppManager] BeautyHub2025 PWA Initialized Successfully');
            
        } catch (error) {
            console.error('[AppManager] Initialization failed:', error);
        }
    }
    
    // ===== NAVIGATION HANDLERS =====
    function setupNavigationHandlers() {
        try {
            // Shipping link handler
            const shippingLink = document.getElementById('shipping-link');
            if (shippingLink) {
                shippingLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const shippingSection = document.getElementById('shipping');
                    const privacySection = document.getElementById('privacy-content');
                    
                    if (!shippingSection || !privacySection) return;
                    
                    const showShipping = shippingSection.style.display === 'none';
                    shippingSection.style.display = showShipping ? 'block' : 'none';
                    privacySection.style.display = 'none';
                    
                    if (showShipping) {
                        setTimeout(() => {
                            shippingSection.scrollIntoView({ behavior: 'smooth' });
                        }, 10);
                    }
                });
            }
            
            // Privacy policy link handler
            const policyLink = document.getElementById('policy-link');
            if (policyLink) {
                policyLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const privacySection = document.getElementById('privacy-content');
                    const shippingSection = document.getElementById('shipping');
                    
                    if (!privacySection || !shippingSection) return;
                    
                    const showPrivacy = privacySection.style.display === 'none';
                    privacySection.style.display = showPrivacy ? 'block' : 'none';
                    shippingSection.style.display = 'none';
                    
                    if (showPrivacy) {
                        setTimeout(() => {
                            privacySection.scrollIntoView({ behavior: 'smooth' });
                        }, 10);
                    }
                });
            }
            
            // Cart toggle button
            const cartToggle = document.getElementById('cart-toggle');
            if (cartToggle) {
                cartToggle.addEventListener('click', function() {
                    if (typeof BeautyHubCart !== 'undefined' && BeautyHubCart.toggleCart) {
                        BeautyHubCart.toggleCart();
                    }
                });
            }
            
            console.log('[AppManager] Navigation handlers setup complete');
            
        } catch (error) {
            console.error('[AppManager] Failed to setup navigation handlers:', error);
        }
    }
    
    // ===== SHIPPING SECTION =====
    function initializeShippingSection() {
        try {
            const shippingSection = document.getElementById('shipping');
            if (!shippingSection) return;
            
            const closeBtn = shippingSection.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    shippingSection.style.display = 'none';
                });
            }
            
        } catch (error) {
            console.error('[AppManager] Failed to initialize shipping section:', error);
        }
    }
    
    // ===== PRIVACY SECTION =====
    function initializePrivacySection() {
        try {
            const privacySection = document.getElementById('privacy-content');
            if (!privacySection) return;
            
            const closeBtn = privacySection.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    privacySection.style.display = 'none';
                });
            }
            
        } catch (error) {
            console.error('[AppManager] Failed to initialize privacy section:', error);
        }
    }
    
    // ===== SMOOTH SCROLLING =====
    function setupSmoothScrolling() {
        try {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                if (anchor.id === 'shipping-link' || anchor.id === 'policy-link') return;
                
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#' || targetId === '#privacy-content') return;
                    
                    e.preventDefault();
                    const target = document.querySelector(targetId);
                    if (target) {
                        // Hide other sections
                        const shipping = document.getElementById('shipping');
                        const privacy = document.getElementById('privacy-content');
                        
                        if (shipping) shipping.style.display = 'none';
                        if (privacy) privacy.style.display = 'none';
                        
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
        } catch (error) {
            console.error('[AppManager] Failed to setup smooth scrolling:', error);
        }
    }
    
    // ===== CONNECTION FUNCTIONS =====
    function connectCartButton() {
        try {
            // Cart count updates handled by cart.js
            console.log('[AppManager] Cart button ready');
        } catch (error) {
            console.error('[AppManager] Failed to connect cart button:', error);
        }
    }
    
//AdminManager is an IIFE that returns an object
    function connectAdminButton() {
    try {
        const adminBtn = document.getElementById('admin-btn');
        
        if (adminBtn) {
            // Initialize AdminManager first
            if (typeof AdminManager !== 'undefined' && AdminManager.init) {
                AdminManager.init();
                console.log('[AppManager] AdminManager initialized');
            }
            
            adminBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[AppManager] Admin button clicked');
                
                // Check if AdminManager is initialized
                if (typeof AdminManager === 'undefined') {
                    console.error('[AppManager] AdminManager not loaded');
                    return;
                }
                
                // Check authentication status
                if (AdminManager.isAuthenticated && AdminManager.isAuthenticated()) {
                    console.log('[AppManager] Admin authenticated, opening dashboard');
                    AdminManager.openDashboard();
                } else {
                    console.log('[AppManager] Admin not authenticated, opening login');
                    AdminManager.openAdminLogin();
                }
            });
            
            console.log('[AppManager] Admin button connected');
        } else {
            console.warn('[AppManager] Admin button not found');
        }
        
    } catch (error) {
        console.error('[AppManager] Failed to connect admin button:', error);
    }
}
    
    function connectCheckoutButton() {
        try {
            // Checkout button might be in cart modal or elsewhere
            // Let customerorder.js handle its own initialization
            console.log('[AppManager] Checkout system ready via customerorder.js');
        } catch (error) {
            console.error('[AppManager] Failed to connect checkout button:', error);
        }
    }
    
    // ===== PWA SETUP =====
    function setupPWA() {
        try {
            // Service Worker Registration
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('./sw.js').then(function(registration) {
                        console.log('[AppManager] ServiceWorker registered:', registration.scope);
                    }, function(err) {
                        console.error('[AppManager] ServiceWorker registration failed:', err);
                    });
                });
            }
            
            // PWA Install Prompt
            let deferredPrompt;
            const addBtn = document.createElement('button');
            addBtn.id = 'install-pwa-btn';
            addBtn.setAttribute('aria-label', 'Install BeautyHub App');
            
            addBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: transform 0.2s, opacity 0.2s;
            `;
            addBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
            addBtn.style.display = 'none';
            
            document.body.appendChild(addBtn);
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                addBtn.style.display = 'flex';
                
                addBtn.addEventListener('click', () => {
                    addBtn.style.display = 'none';
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('[AppManager] User accepted PWA install');
                        }
                        deferredPrompt = null;
                    });
                });
            });
            
        } catch (error) {
            console.error('[AppManager] Failed to setup PWA:', error);
        }
    }
    
    // ===== PUBLIC API =====
    return {
        init,
        // Keep for compatibility if other modules call these
        updateAdminBadge: function() {
            // Let admin.js handle this
        },
        dispatchOrderCreated: function(orderDetails) {
            const event = new CustomEvent('orderCreated', { detail: orderDetails || {} });
            document.dispatchEvent(event);
        }
    };
})();

// ===== AUTO-INITIALIZATION =====
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[Main] DOM Content Loaded - Initializing AppManager');
            AppManager.init();
        });
    } else {
        console.log('[Main] DOM Already Loaded - Initializing AppManager');
        AppManager.init();
    }
} catch (error) {
    console.error('[Main] Auto-initialization failed:', error);
}

// ===== DELAYED SETUP =====
window.addEventListener('load', () => {
    console.log('[Main] Window Loaded - App fully loaded');
});
