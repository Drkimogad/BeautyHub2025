// main.js - clean version
// Listen for going offline DURING SESSION
window.addEventListener('offline', () => {
    console.log('📶 Connection lost during session');
    // Just show banner, don't redirect
    if (typeof window.showOfflineAlert === 'function') {
        window.showOfflineAlert(); // show the banner 
    }
});

// Listen for coming back online
window.addEventListener('online', () => {
    console.log('📶 Connection restored');
    hideOfflineAlert(); // Add this line
});

// ===== OFFLINE ALERT BANNER FUNCTIONS =====
window.showOfflineAlert = function() {
    // Don't create multiple banners
    if (document.getElementById('offline-alert')) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.id = 'offline-alert';
    alertDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff4444;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 9999;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
        ">
            ⚠️ You are offline. Some features may not work.
            <button onclick="goToOfflinePage()" style="            
                margin-left: 15px;
                background: white;
                color: #ff4444;
                border: none;
                padding: 5px 15px;
                border-radius: 3px;
                cursor: pointer;
            ">
                View Offline Page
            </button>
        </div>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto-hide after 10 seconds if still offline
  //  setTimeout(() => {
 //       hideOfflineAlert();
  //  }
};

// NEW FUNCTION: Hide the offline alert
window.hideOfflineAlert = function() {
    const alertDiv = document.getElementById('offline-alert');
    if (alertDiv && alertDiv.parentNode) {
        // Fade out animation
        alertDiv.style.transition = 'opacity 0.5s';
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 500);
    }
};
// Add this function:
window.goToOfflinePage = function() {
    console.log('Going to offline page...');
    
    // ALWAYS use relative path - works for both GitHub and Firebase
    const offlinePath = 'offline.html';
    
    // Use replace() to prevent back button issues
    window.location.replace(offlinePath + '?from=banner&t=' + Date.now());
};

//===============================================
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
            // Add AFTER cart initialization but BEFORE "Checkout system ready" log:

// CustomerOrderManager (for checkout forms)
if (typeof CustomerOrderManager !== 'undefined' && CustomerOrderManager.init) {
    CustomerOrderManager.init();
    console.log('[AppManager] CustomerOrderManager initialized');
} else {
    console.warn('[AppManager] CustomerOrderManager not available for checkout');
}

// OrdersManager (for order processing)
if (typeof OrdersManager !== 'undefined' && OrdersManager.init) {
    OrdersManager.init();
    console.log('[AppManager] OrdersManager initialized');
}

// CustomerSearchManager (for customer lookup in checkout)
if (typeof CustomerSearchManager !== 'undefined' && CustomerSearchManager.init) {
    CustomerSearchManager.init();
    console.log('[AppManager] CustomerSearchManager initialized');
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


