// main.js - Main application coordinator & core functionality
const AppManager = (function() {
    // ===== MAIN INITIALIZATION =====
    function init() {
        console.log('BeautyHub2025 PWA Initializing...');
        
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
        
        console.log('BeautyHub2025 PWA Initialized');
    }
    
    // Initialize all modules in correct order
    function initializeModules() {
        // Check module dependencies
        const modules = {
            ProductsManager: typeof ProductsManager !== 'undefined',
            BeautyHubCart: typeof BeautyHubCart !== 'undefined',
            OrdersManager: typeof OrdersManager !== 'undefined',
            CustomerOrderManager: typeof CustomerOrderManager !== 'undefined',
            AdminManager: typeof AdminManager !== 'undefined',
            CustomerSearchManager: typeof CustomerSearchManager !== 'undefined'
        };
        
        // Log missing modules
        Object.entries(modules).forEach(([name, loaded]) => {
            if (!loaded) console.error(`${name} not loaded`);
        });
        
        // Initialize in dependency order
        if (modules.ProductsManager) {
            ProductsManager.init();  // First: products need to render
        }
        
        if (modules.BeautyHubCart) {
            BeautyHubCart.init();    // Second: cart depends on products
        }
        
        if (modules.OrdersManager) {
            OrdersManager.init();    // Third: orders depends on cart
        }
        
        if (modules.CustomerOrderManager) {
            CustomerOrderManager.init(); // Fourth: checkout depends on orders
        }
        
        if (modules.AdminManager) {
            AdminManager.init();     // Fifth: admin depends on everything
        }
    }
    
    // ===== NAVIGATION HANDLERS =====
    function setupNavigationHandlers() {
        // Shipping link handler
        const shippingLink = document.getElementById('shipping-link');
        if (shippingLink) {
            shippingLink.addEventListener('click', function(e) {
                e.preventDefault();
                const shippingSection = document.getElementById('shipping');
                const privacySection = document.getElementById('privacy-content');
                
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
            });
        }
        
        // Privacy policy link handler
        const policyLink = document.getElementById('policy-link');
        if (policyLink) {
            policyLink.addEventListener('click', function(e) {
                e.preventDefault();
                const privacySection = document.getElementById('privacy-content');
                const shippingSection = document.getElementById('shipping');
                
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
            });
        }
    }
    
    // ===== SHIPPING SECTION =====
    function initializeShippingSection() {
        const shippingSection = document.getElementById('shipping');
        if (!shippingSection) return;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => {
            shippingSection.style.display = 'none';
        });
        
        const container = shippingSection.querySelector('.section-container');
        if (container) {
            container.prepend(closeBtn);
        }
    }
    
    // ===== PRIVACY SECTION =====
    function initializePrivacySection() {
        const privacySection = document.getElementById('privacy-content');
        if (!privacySection) return;
        
        const closeBtn = privacySection.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                privacySection.style.display = 'none';
            });
        }
        
        const textarea = privacySection.querySelector('.policy-textarea');
        if (textarea && !textarea.value.trim()) {
            textarea.value = `Last Updated: January 2025\n\n1. INFORMATION WE COLLECT\n- Account details (name, email, password)\n- Order history and payment information\n- Customer support communications\n\n2. HOW WE USE YOUR DATA\n- Process orders and transactions\n- Improve our products and services\n- Send important account notifications\n\n3. DATA PROTECTION\n- SSL encrypted transactions\n- Regular security audits\n- Strict access controls\n\n4. YOUR RIGHTS\n- Access your personal data\n- Request corrections\n- Delete your account`;
        }
    }
    
    // ===== SMOOTH SCROLLING =====
    function setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            if (anchor.id === 'shipping-link' || anchor.id === 'policy-link') return;
            
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#' || targetId === '#privacy-content') return;
                
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    document.getElementById('shipping').hidden = true;
                    document.getElementById('privacy-content').style.display = 'none';
                    
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
    
    // ===== PRODUCT QUICK VIEW & RATINGS Modal =====
    function initializeProductModals() {
        const quickViewButtons = document.querySelectorAll('.quick-view');
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        document.body.appendChild(modal);
        
        quickViewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const productCard = button.closest('.product-card');
                const productImg = productCard.querySelector('.product-img').src;
                const productTitle = productCard.querySelector('h3').textContent;
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <img src="${productImg}" alt="${productTitle}">
                        <h3>${productTitle}</h3>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                `;
                modal.style.display = 'flex';
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                modal.style.display = 'none';
            }
        });
        
        const ratings = document.querySelectorAll('.rating');
        ratings.forEach(rating => {
            rating.addEventListener('click', (e) => {
                const stars = rating.querySelectorAll('span');
                const clickedIndex = Array.from(stars).indexOf(e.target);
                
                stars.forEach((star, index) => {
                    star.textContent = index <= clickedIndex ? '★' : '☆';
                });
            });
        });
    }
    
    // ===== APP INTEGRATION FUNCTIONS =====
    function connectCheckoutButton() {
        document.addEventListener('DOMContentLoaded', function() {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (typeof CustomerOrderManager !== 'undefined') {
                        CustomerOrderManager.openCheckout();
                    } else {
                        console.error('CustomerOrderManager not available');
                    }
                });
            }
        });
    }
    
    function setupOrderListeners() {
        window.addEventListener('storage', function(e) {
            if (e.key === 'beautyhub_orders') {
                updateAdminBadge();
            }
        });
        
        document.addEventListener('orderCreated', function() {
            updateAdminBadge();
        });
    }
    
    function updateAdminBadge() {
        if (typeof AdminManager !== 'undefined') {
            AdminManager.updateAdminButtonVisibility();
        }
    }
    
    function setupPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
        
        let deferredPrompt;
        const addBtn = document.createElement('button');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
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
            `;
            addBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
            document.body.appendChild(addBtn);
            
            addBtn.addEventListener('click', () => {
                addBtn.style.display = 'none';
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                });
            });
        });
        
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running as PWA');
        }
    }
    
    function dispatchOrderCreated() {
        const event = new CustomEvent('orderCreated');
        document.dispatchEvent(event);
    }
    
    // Initialize product modals after products are loaded
    function initializeAfterProducts() {
        if (typeof ProductsManager !== 'undefined') {
            // Wait a bit for products to render
            setTimeout(() => {
                initializeProductModals();
            }, 100);
        }
    }
    
    // Public API
    return {
        init,
        updateAdminBadge,
        dispatchOrderCreated,
        initializeAfterProducts
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppManager.init());
} else {
    AppManager.init();
}

// Initialize product modals after everything is loaded
window.addEventListener('load', () => {
    AppManager.initializeAfterProducts();
});
