// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupSmoothScrolling();
    initializeShippingSection();
    initializePrivacySection();
    setupNavigationHandlers(); // Add this new function
});

// ===== NAVIGATION HANDLERS =====
// to toggle bet shipping section and privacy policy section 
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
                }, 10); // Minimal delay
            }
        }); // closes the listener
   } // closes the if 
} // closes the handler 

//=====================================================
    // Privacy policy link handler lives inside the handler
//=====================================================
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
    
    // Append to section-container instead of section-content
    const container = shippingSection.querySelector('.section-container');
    if (container) {
        container.prepend(closeBtn); // Add as first child
    }
}

// ===== PRIVACY SECTION =====
function initializePrivacySection() {
    const privacySection = document.getElementById('privacy-content');
    if (!privacySection) return;
    
    // Ensure the close button works
    const closeBtn = privacySection.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            privacySection.style.display = 'none';
        });
    }
    
    // Initialize with default content if empty
    const textarea = privacySection.querySelector('.policy-textarea');
    if (textarea && !textarea.value.trim()) {
        textarea.value = `Last Updated: January 2025\n\n1. INFORMATION WE COLLECT\n- Account details (name, email, password)\n- Order history and payment information\n- Customer support communications\n\n2. HOW WE USE YOUR DATA\n- Process orders and transactions\n- Improve our products and services\n- Send important account notifications\n\n3. DATA PROTECTION\n- SSL encrypted transactions\n- Regular security audits\n- Strict access controls\n\n4. YOUR RIGHTS\n- Access your personal data\n- Request corrections\n- Delete your account`;
    }
}

// ===== SMOOTH SCROLLING =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip the shipping and policy links (handled separately)
        if (anchor.id === 'shipping-link' || anchor.id === 'policy-link') return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // Skip empty hash or privacy content (handled elsewhere)
            if (targetId === '#' || targetId === '#privacy-content') return;
            
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                // Hide any open expandable sections before scrolling
                document.getElementById('shipping').hidden = true;
                document.getElementById('privacy-content').style.display = 'none';
                
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// [Rest of your existing code...]

// ===== PRODUCT QUICK VIEW & RATINGS Modal =====
document.addEventListener('DOMContentLoaded', () => {
    // Quick View Modal
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    document.body.appendChild(modal);

    // Handle Quick View Clicks
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

    // Close Modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.style.display = 'none';
        }
    });

    // Star Rating Interaction
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
});


// new code
// main.js - Main application coordinator
const AppManager = (function() {
    // Initialize all modules
    function init() {
        console.log('BeautyHub2025 PWA Initializing...');
        
        // Check module dependencies
        if (typeof BeautyHubCart === 'undefined') {
            console.error('cart.js not loaded');
            return;
        }
        
        if (typeof OrdersManager === 'undefined') {
            console.error('ordersManager.js not loaded');
            return;
        }
        
        if (typeof CustomerOrderManager === 'undefined') {
            console.error('customerorder.js not loaded');
            return;
        }
        
        if (typeof AdminManager === 'undefined') {
            console.error('admin.js not loaded');
            return;
        }
        
        // Initialize modules that need it
        BeautyHubCart.init();
        OrdersManager.init();
        CustomerOrderManager.init();
        AdminManager.init();
        
        // Connect cart checkout button
        connectCheckoutButton();
        
        // Update admin badge on order changes
        setupOrderListeners();
        
        // Setup PWA features
        setupPWA();
        
        console.log('BeautyHub2025 PWA Initialized');
    }
    
    // Connect cart checkout button to customerorder.js
    function connectCheckoutButton() {
        document.addEventListener('DOMContentLoaded', function() {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    CustomerOrderManager.openCheckout();
                });
            }
        });
    }
    
    // Listen for order changes to update admin badge
    function setupOrderListeners() {
        // Monitor localStorage for order changes
        window.addEventListener('storage', function(e) {
            if (e.key === 'beautyhub_orders') {
                updateAdminBadge();
            }
        });
        
        // Custom event for order creation
        document.addEventListener('orderCreated', function() {
            updateAdminBadge();
        });
    }
    
    // Update admin badge
    function updateAdminBadge() {
        if (typeof AdminManager !== 'undefined') {
            AdminManager.updateAdminButtonVisibility();
        }
    }
    
    // PWA setup
    function setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
        
        // Add to homescreen prompt
        let deferredPrompt;
        const addBtn = document.createElement('button');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
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
        
        // Detect if app is running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running as PWA');
        }
    }
    
    // Dispatch order created event
    function dispatchOrderCreated() {
        const event = new CustomEvent('orderCreated');
        document.dispatchEvent(event);
    }
    
    // Public API
    return {
        init,
        updateAdminBadge,
        dispatchOrderCreated
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppManager.init());
} else {
    AppManager.init();
}



// In main.js, update initialization order:
function init() {
    console.log('BeautyHub2025 PWA Initializing...');
    
    // Initialize in correct dependency order
    if (typeof ProductsManager !== 'undefined') {
        ProductsManager.init();  // First: products need to render
    }
    
    if (typeof BeautyHubCart !== 'undefined') {
        BeautyHubCart.init();    // Second: cart depends on products
    }
    
    if (typeof OrdersManager !== 'undefined') {
        OrdersManager.init();    // Third: orders depends on cart
    }
    
    if (typeof CustomerOrderManager !== 'undefined') {
        CustomerOrderManager.init(); // Fourth: checkout depends on orders
    }
    
    if (typeof AdminManager !== 'undefined') {
        AdminManager.init();     // Fifth: admin depends on everything
    }
    
    // ... rest of init code ...
}
