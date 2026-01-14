// main.js - Main application coordinator & core functionality
// UPDATED: Added comprehensive error handling and module integration
const AppManager = (function() {
    // Module state tracking
    const moduleStatus = {
        initialized: false,
        modules: {}
    };
    
// ===== MAIN INITIALIZATION =====
    function init() {
        try {
            console.log('[AppManager] BeautyHub2025 PWA Initializing...');
            
            // Initialize core page functionality first
            setupSmoothScrolling();
            initializeShippingSection();
            initializePrivacySection();
            setupNavigationHandlers();
            
            // Initialize modules in correct dependency order
            initializeModules();
            
            // Connect cart checkout button
            connectCheckoutButton();
            
            // Update admin badge on order changes
            setupOrderListeners();
            
            // Setup PWA features
            setupPWA();
            
            // Mark as initialized
            moduleStatus.initialized = true;
            
            console.log('[AppManager] BeautyHub2025 PWA Initialized Successfully');
            
            return {
                getStatus: () => moduleStatus,
                getModule: (name) => moduleStatus.modules[name]
            };
            
        } catch (error) {
            console.error('[AppManager] Initialization failed:', error);
            throw new Error('Application initialization failed: ' + error.message);
        }
    }
// ===== MODULE INITIALIZATION =====
    function initializeModules() {
        try {
            console.log('[AppManager] Initializing modules in dependency order...');
            
            // Check module dependencies
            const modules = {
                ProductsManager: typeof ProductsManager !== 'undefined',
                ProductsDisplay: typeof ProductsDisplay !== 'undefined',
                BeautyHubCart: typeof BeautyHubCart !== 'undefined',
                OrdersManager: typeof OrdersManager !== 'undefined',
                CustomerOrderManager: typeof CustomerOrderManager !== 'undefined',
                AdminManager: typeof AdminManager !== 'undefined',
                CustomerSearchManager: typeof CustomerSearchManager !== 'undefined',
                InventoryManager: typeof InventoryManager !== 'undefined'
            };
            
            // Log module status
            console.log('[AppManager] Module availability check:');
            Object.entries(modules).forEach(([name, loaded]) => {
                if (!loaded) {
                    console.warn(`[AppManager] ${name} not loaded`);
                } else {
                    console.log(`[AppManager] ✓ ${name} available`);
                }
            });
            
            // Track initialized modules
            moduleStatus.modules = {};
            
            // 1. Products Manager (Core Data) - MUST BE FIRST
            let productsManager = null;
            if (modules.ProductsManager) {
                try {
                    console.log('[AppManager] Initializing ProductsManager...');
                    productsManager = ProductsManager.init();
                    moduleStatus.modules.ProductsManager = { status: 'initialized', instance: productsManager };
                    console.log('[AppManager] ProductsManager initialized');
                } catch (error) {
                    console.error('[AppManager] ProductsManager initialization failed:', error);
                    moduleStatus.modules.ProductsManager = { status: 'failed', error: error.message };
                }
            }
            
            // 2. Products Display (UI) - AFTER ProductsManager
            if (modules.ProductsDisplay) {
                try {
                    console.log('[AppManager] Initializing ProductsDisplay...');
                    const display = ProductsDisplay.init();
                    moduleStatus.modules.ProductsDisplay = { status: 'initialized', instance: display };
                    console.log('[AppManager] ProductsDisplay initialized');
                } catch (error) {
                    console.error('[AppManager] ProductsDisplay initialization failed:', error);
                    moduleStatus.modules.ProductsDisplay = { status: 'failed', error: error.message };
                }
            }
            
            // 3. Orders Manager (needs products for reference)
            let ordersManager = null;
            if (modules.OrdersManager) {
                try {
                    console.log('[AppManager] Initializing OrdersManager...');
                    ordersManager = OrdersManager.init();
                    moduleStatus.modules.OrdersManager = { status: 'initialized', instance: ordersManager };
                    console.log('[AppManager] OrdersManager initialized');
                } catch (error) {
                    console.error('[AppManager] OrdersManager initialization failed:', error);
                    moduleStatus.modules.OrdersManager = { status: 'failed', error: error.message };
                }
            }
            
            // 4. Inventory Manager (needs ProductsManager and OrdersManager)
            if (modules.InventoryManager) {
                try {
                    console.log('[AppManager] Initializing InventoryManager...');
                    const inventory = InventoryManager.init(productsManager, ordersManager);
                    moduleStatus.modules.InventoryManager = { status: 'initialized', instance: inventory };
                    console.log('[AppManager] InventoryManager initialized');
                } catch (error) {
                    console.error('[AppManager] InventoryManager initialization failed:', error);
                    moduleStatus.modules.InventoryManager = { status: 'failed', error: error.message };
                }
            }
            
            // 5. Cart System (needs ProductsManager and InventoryManager)
            if (modules.BeautyHubCart) {
                try {
                    console.log('[AppManager] Initializing BeautyHubCart...');
                    const cart = BeautyHubCart.init();
                    moduleStatus.modules.BeautyHubCart = { status: 'initialized', instance: cart };
                    console.log('[AppManager] BeautyHubCart initialized');
                } catch (error) {
                    console.error('[AppManager] BeautyHubCart initialization failed:', error);
                    moduleStatus.modules.BeautyHubCart = { status: 'failed', error: error.message };
                }
            }
            
            // 6. Customer Order Manager (needs OrdersManager)
            if (modules.CustomerOrderManager) {
                try {
                    console.log('[AppManager] Initializing CustomerOrderManager...');
                    const customerOrderMgr = CustomerOrderManager.init();
                    moduleStatus.modules.CustomerOrderManager = { status: 'initialized', instance: customerOrderMgr };
                    console.log('[AppManager] CustomerOrderManager initialized');
                } catch (error) {
                    console.error('[AppManager] CustomerOrderManager initialization failed:', error);
                    moduleStatus.modules.CustomerOrderManager = { status: 'failed', error: error.message };
                }
            }
            
            // 7. Customer Search Manager
            if (modules.CustomerSearchManager) {
                try {
                    console.log('[AppManager] Initializing CustomerSearchManager...');
                    const searchMgr = CustomerSearchManager.init();
                    moduleStatus.modules.CustomerSearchManager = { status: 'initialized', instance: searchMgr };
                    console.log('[AppManager] CustomerSearchManager initialized');
                } catch (error) {
                    console.error('[AppManager] CustomerSearchManager initialization failed:', error);
                    moduleStatus.modules.CustomerSearchManager = { status: 'failed', error: error.message };
                }
            }
            
            // 8. Admin Manager (needs everything)
            if (modules.AdminManager) {
                try {
                    console.log('[AppManager] Initializing AdminManager...');
                    const adminMgr = AdminManager.init();
                    moduleStatus.modules.AdminManager = { status: 'initialized', instance: adminMgr };
                    console.log('[AppManager] AdminManager initialized');
                } catch (error) {
                    console.error('[AppManager] AdminManager initialization failed:', error);
                    moduleStatus.modules.AdminManager = { status: 'failed', error: error.message };
                }
            }
            
            // Log final module status
            console.log('[AppManager] Module initialization complete:');
            Object.entries(moduleStatus.modules).forEach(([name, status]) => {
                console.log(`[AppManager] ${name}: ${status.status}`);
            });
            
        } catch (error) {
            console.error('[AppManager] Module initialization failed:', error);
            throw error;
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
                    try {
                        const shippingSection = document.getElementById('shipping');
                        const privacySection = document.getElementById('privacy-content');
                        
                        if (!shippingSection || !privacySection) return;
                        
                        // Toggle shipping section
                        const showShipping = shippingSection.style.display === 'none';
                        shippingSection.style.display = showShipping ? 'block' : 'none';
                        
                        // Always hide privacy when showing shipping
                        privacySection.style.display = 'none';
                        
                        // Only scroll if we're showing the section
                        if (showShipping) {
                            setTimeout(() => {
                                shippingSection.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }, 10);
                        }
                    } catch (error) {
                        console.error('[AppManager] Shipping link handler error:', error);
                    }
                });
            } else {
                console.warn('[AppManager] Shipping link not found');
            }
            
            // Privacy policy link handler
            const policyLink = document.getElementById('policy-link');
            if (policyLink) {
                policyLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    try {
                        const privacySection = document.getElementById('privacy-content');
                        const shippingSection = document.getElementById('shipping');
                        
                        if (!privacySection || !shippingSection) return;
                        
                        // Toggle privacy section
                        const showPrivacy = privacySection.style.display === 'none';
                        privacySection.style.display = showPrivacy ? 'block' : 'none';
                        
                        // Always hide shipping when showing privacy
                        shippingSection.style.display = 'none';
                        
                        if (showPrivacy) {
                            setTimeout(() => {
                                privacySection.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }, 10);
                        }
                    } catch (error) {
                        console.error('[AppManager] Privacy link handler error:', error);
                    }
                });
            } else {
                console.warn('[AppManager] Policy link not found');
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
            if (!shippingSection) {
                console.warn('[AppManager] Shipping section not found');
                return;
            }
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close shipping information');
            closeBtn.addEventListener('click', () => {
                try {
                    shippingSection.style.display = 'none';
                } catch (error) {
                    console.error('[AppManager] Close button handler error:', error);
                }
            });
            
            const container = shippingSection.querySelector('.section-container');
            if (container) {
                container.prepend(closeBtn);
            }
            
            console.log('[AppManager] Shipping section initialized');
            
        } catch (error) {
            console.error('[AppManager] Failed to initialize shipping section:', error);
        }
    }
    
    // ===== PRIVACY SECTION =====
    function initializePrivacySection() {
        try {
            const privacySection = document.getElementById('privacy-content');
            if (!privacySection) {
                console.warn('[AppManager] Privacy section not found');
                return;
            }
            
            // Check for existing close button or create one
            let closeBtn = privacySection.querySelector('.close-btn');
            if (!closeBtn) {
                closeBtn = document.createElement('button');
                closeBtn.className = 'close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', 'Close privacy policy');
                privacySection.prepend(closeBtn);
            }
            
            closeBtn.addEventListener('click', () => {
                try {
                    privacySection.style.display = 'none';
                } catch (error) {
                    console.error('[AppManager] Privacy close button handler error:', error);
                }
            });
            
            const textarea = privacySection.querySelector('.policy-textarea');
            if (textarea && !textarea.value.trim()) {
                textarea.value = `Last Updated: January 2025\n\n1. INFORMATION WE COLLECT\n- Account details (name, email, password)\n- Order history and payment information\n- Customer support communications\n\n2. HOW WE USE YOUR DATA\n- Process orders and transactions\n- Improve our products and services\n- Send important account notifications\n\n3. DATA PROTECTION\n- SSL encrypted transactions\n- Regular security audits\n- Strict access controls\n\n4. YOUR RIGHTS\n- Access your personal data\n- Request corrections\n- Delete your account`;
            }
            
            console.log('[AppManager] Privacy section initialized');
            
        } catch (error) {
            console.error('[AppManager] Failed to initialize privacy section:', error);
        }
    }
    
    // ===== SMOOTH SCROLLING =====
    function setupSmoothScrolling() {
        try {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                try {
                    if (anchor.id === 'shipping-link' || anchor.id === 'policy-link') return;
                    
                    anchor.addEventListener('click', function(e) {
                        try {
                            const targetId = this.getAttribute('href');
                            if (targetId === '#' || targetId === '#privacy-content') return;
                            
                            e.preventDefault();
                            const target = document.querySelector(targetId);
                            if (target) {
                                // Hide other sections
                                const shipping = document.getElementById('shipping');
                                const privacy = document.getElementById('privacy-content');
                                
                                if (shipping) shipping.hidden = true;
                                if (privacy) privacy.style.display = 'none';
                                
                                target.scrollIntoView({ behavior: 'smooth' });
                            }
                        } catch (error) {
                            console.error('[AppManager] Smooth scroll handler error:', error);
                        }
                    });
                } catch (error) {
                    console.error('[AppManager] Anchor setup error:', error);
                }
            });
            
            console.log('[AppManager] Smooth scrolling setup complete');
            
        } catch (error) {
            console.error('[AppManager] Failed to setup smooth scrolling:', error);
        }
    }
    
    // ===== PRODUCT QUICK VIEW & RATINGS Modal =====
    function initializeProductModals() {
        try {
            console.log('[AppManager] Initializing product modals...');
            
            const quickViewButtons = document.querySelectorAll('.quick-view');
            let modal = document.querySelector('.quick-view-modal');
            
            // Create modal if it doesn't exist
            if (!modal) {
                modal = document.createElement('div');
                modal.className = 'quick-view-modal';
                modal.style.display = 'none';
                document.body.appendChild(modal);
            }
            
            quickViewButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    try {
                        e.stopPropagation();
                        const productCard = button.closest('.product-card');
                        if (!productCard) return;
                        
                        const productImg = productCard.querySelector('.product-img')?.src || '';
                        const productTitle = productCard.querySelector('h3')?.textContent || 'Product';
                        
                        modal.innerHTML = `
                            <div class="modal-content">
                                <span class="close-modal" aria-label="Close">&times;</span>
                                <img src="${productImg}" alt="${productTitle}">
                                <h3>${productTitle}</h3>
                                <!-- Note: Add-to-cart handled by ProductsDisplay -->
                            </div>
                        `;
                        modal.style.display = 'flex';
                    } catch (error) {
                        console.error('[AppManager] Quick view button handler error:', error);
                    }
                });
            });
            
            modal.addEventListener('click', (e) => {
                try {
                    if (e.target === modal || e.target.classList.contains('close-modal')) {
                        modal.style.display = 'none';
                    }
                } catch (error) {
                    console.error('[AppManager] Modal click handler error:', error);
                }
            });
            
            const ratings = document.querySelectorAll('.rating');
            ratings.forEach(rating => {
                rating.addEventListener('click', (e) => {
                    try {
                        const stars = rating.querySelectorAll('span');
                        const clickedIndex = Array.from(stars).indexOf(e.target);
                        
                        stars.forEach((star, index) => {
                            star.textContent = index <= clickedIndex ? '★' : '☆';
                        });
                    } catch (error) {
                        console.error('[AppManager] Rating handler error:', error);
                    }
                });
            });
            
            console.log('[AppManager] Product modals initialized');
            
        } catch (error) {
            console.error('[AppManager] Failed to initialize product modals:', error);
        }
    }
    
    // ===== APP INTEGRATION FUNCTIONS =====
    function connectCheckoutButton() {
        try {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (!checkoutBtn) {
                console.warn('[AppManager] Checkout button not found');
                return;
            }
            
            checkoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                try {
                    if (typeof CustomerOrderManager !== 'undefined' && 
                        moduleStatus.modules.CustomerOrderManager?.status === 'initialized') {
                        CustomerOrderManager.openCheckout();
                    } else {
                        console.error('[AppManager] CustomerOrderManager not available or not initialized');
                        alert('Checkout system is not available. Please try again later.');
                    }
                } catch (error) {
                    console.error('[AppManager] Checkout button handler error:', error);
                    alert('Error opening checkout. Please try again.');
                }
            });
            
            console.log('[AppManager] Checkout button connected');
            
        } catch (error) {
            console.error('[AppManager] Failed to connect checkout button:', error);
        }
    }
    
    function setupOrderListeners() {
        try {
            // Listen for storage changes (orders)
            window.addEventListener('storage', function(e) {
                try {
                    if (e.key === 'beautyhub_orders') {
                        updateAdminBadge();
                    }
                } catch (error) {
                    console.error('[AppManager] Storage event handler error:', error);
                }
            });
            
            // Listen for order creation events
            document.addEventListener('orderCreated', function() {
                try {
                    updateAdminBadge();
                } catch (error) {
                    console.error('[AppManager] Order created event handler error:', error);
                }
            });
            
            console.log('[AppManager] Order listeners setup complete');
            
        } catch (error) {
            console.error('[AppManager] Failed to setup order listeners:', error);
        }
    }
    
    function updateAdminBadge() {
        try {
            if (typeof AdminManager !== 'undefined' && 
                moduleStatus.modules.AdminManager?.status === 'initialized') {
                AdminManager.updateAdminButtonVisibility();
            }
        } catch (error) {
            console.error('[AppManager] Failed to update admin badge:', error);
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
            } else {
                console.log('[AppManager] Service Worker not supported');
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
                
                // Show install button
                addBtn.style.display = 'flex';
                
                addBtn.addEventListener('click', () => {
                    try {
                        addBtn.style.display = 'none';
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'accepted') {
                                console.log('[AppManager] User accepted PWA install');
                            }
                            deferredPrompt = null;
                        });
                    } catch (error) {
                        console.error('[AppManager] PWA install button handler error:', error);
                    }
                });
            });
            
            // Detect PWA mode
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('[AppManager] Running as PWA');
            }
            
            console.log('[AppManager] PWA features setup complete');
            
        } catch (error) {
            console.error('[AppManager] Failed to setup PWA:', error);
        }
    }
    
    // ===== EVENT DISPATCHER =====
    function dispatchOrderCreated(orderDetails) {
        try {
            const event = new CustomEvent('orderCreated', { 
                detail: orderDetails || {} 
            });
            document.dispatchEvent(event);
            console.log('[AppManager] Dispatched orderCreated event');
        } catch (error) {
            console.error('[AppManager] Failed to dispatch orderCreated event:', error);
        }
    }
    
    // ===== DELAYED INITIALIZATION =====
    function initializeAfterProducts() {
        try {
            if (typeof ProductsManager !== 'undefined') {
                // Wait for products to render
                setTimeout(() => {
                    initializeProductModals();
                }, 500); // Increased delay for better reliability
            }
        } catch (error) {
            console.error('[AppManager] Failed to initialize after products:', error);
        }
    }
    
    // ===== HEALTH CHECK =====
    function checkSystemHealth() {
        try {
            const health = {
                status: 'ok',
                modules: {},
                timestamp: new Date().toISOString()
            };
            
            // Check each module
            Object.entries(moduleStatus.modules).forEach(([name, moduleInfo]) => {
                health.modules[name] = moduleInfo.status;
            });
            
            // Check critical modules
            if (!moduleStatus.modules.ProductsManager || 
                moduleStatus.modules.ProductsManager.status !== 'initialized') {
                health.status = 'critical';
                health.message = 'ProductsManager not initialized';
            }
            
            if (!moduleStatus.modules.BeautyHubCart || 
                moduleStatus.modules.BeautyHubCart.status !== 'initialized') {
                health.status = health.status === 'ok' ? 'warning' : health.status;
            }
            
            return health;
            
        } catch (error) {
            console.error('[AppManager] Health check failed:', error);
            return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
        }
    }
    
    // ===== PUBLIC API =====
    return {
        init,
        updateAdminBadge,
        dispatchOrderCreated,
        initializeAfterProducts,
        checkSystemHealth,
        debugPriceAlignment, // Add this
        getModuleStatus: () => moduleStatus
    };
})();

// ===== AUTO-INITIALIZATION =====
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                console.log('[Main] DOM Content Loaded - Initializing AppManager');
                AppManager.init();
            } catch (error) {
                console.error('[Main] Failed to initialize AppManager:', error);
            }
        });
    } else {
        console.log('[Main] DOM Already Loaded - Initializing AppManager');
        AppManager.init();
    }
} catch (error) {
    console.error('[Main] Auto-initialization failed:', error);
}

// ===== DELAYED INITIALIZATION =====
window.addEventListener('load', () => {
    try {
        console.log('[Main] Window Loaded - Initializing delayed components');
        AppManager.initializeAfterProducts();
        
        // Optional: Run health check
        setTimeout(() => {
            const health = AppManager.checkSystemHealth();
            console.log('[Main] System Health:', health);
            
            if (health.status === 'critical') {
                console.error('[Main] Critical system issues detected:', health.message);
            }
        }, 2000);
    } catch (error) {
        console.error('[Main] Failed to initialize delayed components:', error);
    }
});
