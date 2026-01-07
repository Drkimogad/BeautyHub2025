// cart.js - Shopping Cart Functionality
const BeautyHubCart = (function() {
    // Cart state
    let cartItems = [];
    
    // Initialize cart from localStorage
    function init() {
        loadCart();
        updateCartUI();
        setupEventListeners();
    }
    
    // Load cart from localStorage
    function loadCart() {
        const saved = localStorage.getItem('beautyhub_cart');
        if (saved) {
            try {
                cartItems = JSON.parse(saved) || [];
            } catch (e) {
                cartItems = [];
            }
        }
    }
    
    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('beautyhub_cart', JSON.stringify(cartItems));
    }
    
    // Add product to cart
    function addToCart(productId, productName, price, imageUrl, quantity = 1) {
        const existing = cartItems.find(item => item.productId === productId);
        
        if (existing) {
            existing.quantity += quantity;
        } else {
            cartItems.push({
                productId,
                productName,
                price: parseFloat(price),
                imageUrl,
                quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        saveCart();
        updateCartUI();
        showAddedNotification(productName);
    }
    
    // Remove item from cart
    function removeFromCart(productId) {
        cartItems = cartItems.filter(item => item.productId !== productId);
        saveCart();
        updateCartUI();
    }
    
    // Update item quantity
    function updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        const item = cartItems.find(item => item.productId === productId);
        if (item) {
            item.quantity = newQuantity;
            saveCart();
            updateCartUI();
        }
    }
    
    // Get cart total
    function getCartTotal() {
        return cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    // Get cart count
    function getCartCount() {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }
    
    // Clear cart
    function clearCart() {
        cartItems = [];
        saveCart();
        updateCartUI();
    }
    
    // Get all cart items (for checkout)
    function getCartItems() {
        return [...cartItems];
    }
    
    // Update cart UI
    function updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const checkoutTotal = document.getElementById('checkout-total');
        const cartItemsContainer = document.getElementById('cart-items-container');
        const checkoutItems = document.getElementById('checkout-items');
        
        // Update cart count
        if (cartCount) {
            cartCount.textContent = getCartCount();
        }
        
        // Update cart total
        const total = getCartTotal().toFixed(2);
        if (cartTotal) {
            cartTotal.textContent = `R${total}`;
        }
        if (checkoutTotal) {
            checkoutTotal.textContent = `R${total}`;
        }
        
        // Update cart items list
        if (cartItemsContainer) {
            if (cartItems.length === 0) {
                cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                return;
            }
            
            let html = '';
            cartItems.forEach(item => {
                html += `
                <div class="cart-item" data-id="${item.productId}">
                    <img src="${item.imageUrl}" alt="${item.productName}" width="50" height="50">
                    <div class="cart-item-details">
                        <h4>${item.productName}</h4>
                        <p>R${item.price.toFixed(2)} × ${item.quantity}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" data-id="${item.productId}">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.productId}">+</button>
                        <button class="remove-btn" data-id="${item.productId}">×</button>
                    </div>
                </div>`;
            });
            cartItemsContainer.innerHTML = html;
        }
        
        // Update checkout items
        if (checkoutItems && cartItems.length > 0) {
            let html = '<div class="checkout-items-list">';
            cartItems.forEach(item => {
                html += `
                <div class="checkout-item">
                    <span>${item.productName} (${item.quantity})</span>
                    <span>R${(item.price * item.quantity).toFixed(2)}</span>
                </div>`;
            });
            html += '</div>';
            checkoutItems.innerHTML = html;
        }
        
        // Enable/disable checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = cartItems.length === 0;
        }
    }
    
    // Show added notification
    function showAddedNotification(productName) {
        // Create notification if doesn't exist
        let notification = document.getElementById('cart-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cart-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 1rem;
                border-radius: 4px;
                z-index: 10000;
                display: none;
            `;
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `✓ Added ${productName} to cart`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Delegate cart item events
        document.addEventListener('click', function(e) {
            const productId = e.target.dataset.id;
            
            if (!productId) return;
            
            if (e.target.classList.contains('minus')) {
                const item = cartItems.find(item => item.productId === productId);
                if (item) {
                    updateQuantity(productId, item.quantity - 1);
                }
            }
            
            if (e.target.classList.contains('plus')) {
                const item = cartItems.find(item => item.productId === productId);
                if (item) {
                    updateQuantity(productId, item.quantity + 1);
                }
            }
            
            if (e.target.classList.contains('remove-btn')) {
                removeFromCart(productId);
            }
        });
    }
    
    // Public API
    return {
        init,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItems,
        getCartTotal,
        getCartCount,
        updateCartUI
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BeautyHubCart.init());
} else {
    BeautyHubCart.init();
}


// THIS NEEDS PROPER PLACEMENT
// In cart.js, add this function and modify the checkout button event listener
function setupCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if CustomerOrderManager is available
            if (typeof CustomerOrderManager !== 'undefined') {
                CustomerOrderManager.openCheckout();
            } else {
                console.error('CustomerOrderManager not loaded');
                alert('Checkout system is not available. Please refresh the page.');
            }
        });
    }


    
   // THIS IS THE FINAL LAYOUT NEEDED  
    // cart.js - Shopping Cart Functionality (Updated with HTML)
const BeautyHubCart = (function() {
    // ... (keep all existing cart functions) ...
    
    // Create cart sidebar HTML
    function createCartSidebar() {
        // Remove existing cart if present
        const existingCart = document.getElementById('cart-sidebar');
        if (existingCart) existingCart.remove();
        
        // Create cart container
        const cartSidebar = document.createElement('div');
        cartSidebar.id = 'cart-sidebar';
        cartSidebar.className = 'cart-sidebar';
        cartSidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 350px;
            height: 100%;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            transition: right 0.3s;
            z-index: 1000;
            display: flex;
            flex-direction: column;
        `;
        
        cartSidebar.innerHTML = `
            <div class="cart-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #eee;
                flex-shrink: 0;
            ">
                <h3 style="margin: 0;">Your Cart</h3>
                <button id="close-cart" class="close-cart" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                ">&times;</button>
            </div>
            
            <div class="cart-items" id="cart-items-container" style="
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            ">
                <div class="empty-cart">Your cart is empty</div>
            </div>
            
            <div class="cart-footer" style="
                padding: 1rem;
                border-top: 1px solid #eee;
                flex-shrink: 0;
            ">
                <div class="cart-total" style="
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                ">
                    <strong>Total:</strong>
                    <strong id="cart-total">R0.00</strong>
                </div>
                <button id="checkout-btn" class="checkout-btn" disabled style="
                    width: 100%;
                    padding: 1rem;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: background 0.2s;
                ">
                    Proceed to Checkout
                </button>
            </div>
        `;
        
        document.body.appendChild(cartSidebar);
    }
    
    // Create cart button in header
    function createCartButton() {
        // Remove existing cart button if present
        const existingBtn = document.getElementById('cart-toggle');
        if (existingBtn) existingBtn.remove();
        
        // Find header actions container or create one
        let headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            headerActions = document.createElement('div');
            headerActions.className = 'header-actions';
            headerActions.style.cssText = `
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-left: auto;
            `;
            
            const header = document.querySelector('header .header-content');
            if (header) {
                header.appendChild(headerActions);
            } else {
                document.querySelector('header').appendChild(headerActions);
            }
        }
        
        // Create cart button
        const cartBtn = document.createElement('button');
        cartBtn.id = 'cart-toggle';
        cartBtn.className = 'cart-btn';
        cartBtn.style.cssText = `
            position: relative;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #333;
            padding: 0.5rem;
        `;
        cartBtn.innerHTML = `
            <i class="fas fa-shopping-cart"></i>
            <span id="cart-count" class="cart-count" style="
                position: absolute;
                top: 0;
                right: 0;
                background: #e91e63;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
            ">0</span>
        `;
        
        headerActions.appendChild(cartBtn);
    }
    
    // Initialize (updated)
    function init() {
        loadCart();
        createCartSidebar();
        createCartButton();
        updateCartUI();
        setupEventListeners();
    }
    
    // Toggle cart visibility
    function toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar) {
            if (parseInt(cartSidebar.style.right) < 0) {
                cartSidebar.style.right = '0';
                document.body.style.overflow = 'hidden';
            } else {
                cartSidebar.style.right = '-400px';
                document.body.style.overflow = '';
            }
        }
    }
    
    // Close cart
    function closeCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar) {
            cartSidebar.style.right = '-400px';
            document.body.style.overflow = '';
        }
    }
    
    // Setup event listeners (updated)
    function setupEventListeners() {
        // Cart toggle
        document.addEventListener('click', function(e) {
            if (e.target.id === 'cart-toggle' || 
                e.target.closest('#cart-toggle')) {
                toggleCart();
            }
            
            if (e.target.id === 'close-cart' || 
                e.target.closest('#close-cart')) {
                closeCart();
            }
        });
        
        // ... (rest of existing event listeners) ...
    }
    
    // ... (rest of existing cart functions) ...
    
    return {
        init,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItems,
        getCartTotal,
        getCartCount,
        updateCartUI,
        toggleCart,
        closeCart
    };
})();

// ... (auto-initialize code) ...
}

// Call this in init() function
function init() {
    loadCart();
    updateCartUI();
    setupEventListeners();
    setupCheckoutButton(); // Add this line
}
