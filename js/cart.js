// ========================================================
// cart.js - Shopping Cart Functionality
// Core Functionalities:
// 1. Shopping cart management with localStorage
// 2. Real-time inventory validation via InventoryManager
// 3. Cart sidebar UI with quantity controls
// 4. Shipping calculation with free shipping threshold
// 5. Checkout integration with CustomerOrderManager
// 6. Responsive notifications for cart actions
// ========================================================
const BeautyHubCart = (function() {
    // ========================================================
    // CONFIGURATION & CONSTANTS
    // ========================================================
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_cart',
        SHIPPING_THRESHOLD: 1000,
        SHIPPING_COST: 100,
        VAT_PERCENTAGE: 15
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let cartItems = [];

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        console.log('[Cart] Initializing shopping cart...');
        
        try {
            loadCart();
            createCartSidebar();
            updateCartUI();
            setupEventListeners();
            setupCheckoutButton();
            
            console.log('[Cart] Initialization complete');
            console.log('[Cart] CustomerOrderManager available:', typeof CustomerOrderManager !== 'undefined');
            console.log('[Cart] Checkout button exists:', !!document.getElementById('checkout-btn'));
        } catch (error) {
            console.error('[Cart] Initialization failed:', error);
            throw new Error('Cart system initialization failed: ' + error.message);
        }
    }

    // ========================================================
    // STORAGE FUNCTIONS
    // ========================================================
    function loadCart() {
        try {
            console.log('[Cart] Loading cart from localStorage...');
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            
            if (saved) {
                cartItems = JSON.parse(saved) || [];
                console.log(`[Cart] Loaded ${cartItems.length} items from storage`);
            } else {
                cartItems = [];
                console.log('[Cart] No saved cart found');
            }
        } catch (error) {
            console.error('[Cart] Failed to load cart from storage:', error);
            cartItems = [];
            saveCart(); // Reset corrupted storage
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cartItems));
            console.log('[Cart] Cart saved to localStorage:', cartItems.length, 'items');
        } catch (error) {
            console.error('[Cart] Failed to save cart:', error);
        }
    }

    // ========================================================
    // CART OPERATIONS
    // ========================================================
    function addToCart(productId, productName, price, imageUrl, quantity = 1) {
        console.log('[Cart] Adding to cart:', { productId, productName, quantity });
        
        try {
            // Validate input parameters
            if (!productId || !productName || price === undefined || !imageUrl) {
                throw new Error('Invalid product data provided');
            }

            // Check stock availability
            if (typeof InventoryManager !== 'undefined') {
                const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, quantity);
                
                if (!stockCheck.available) {
                    console.warn('[Cart] Stock check failed:', stockCheck.reason);
                    showStockErrorNotification(productName, stockCheck.reason);
                    return false;
                }
            }

            // Check for existing item
            const existingItem = cartItems.find(item => item.productId === productId);
            
            if (existingItem) {
                // Validate additional quantity
                if (typeof InventoryManager !== 'undefined') {
                    const newTotalQuantity = existingItem.quantity + quantity;
                    const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, newTotalQuantity);
                    
                    if (!stockCheck.available) {
                        console.warn('[Cart] Cannot add more:', stockCheck.reason);
                        showStockErrorNotification(productName, `Available: ${stockCheck.availableStock}`);
                        return false;
                    }
                }
                
                existingItem.quantity += quantity;
                console.log(`[Cart] Updated quantity for ${productName}: ${existingItem.quantity}`);
            } else {
                cartItems.push({
                    productId,
                    productName,
                  //  price: parseFloat(price), NO BACKWARD COMPATABILITY NEEDED
                    currentPrice: parseFloat(price), // The actual price shown to customer
                    wholesalePrice: 0, // Will be populated if available
                    retailPrice: 0, // Will be populated if available
                    imageUrl,
                    quantity,
                    addedAt: new Date().toISOString()
                });
                console.log(`[Cart] Added new item: ${productName}`);
            }

            saveCart();
            updateCartUI();
            showAddedNotification(productName);
            return true;
            
        } catch (error) {
            console.error('[Cart] Failed to add to cart:', error);
            showErrorNotification('Failed to add item to cart');
            return false;
        }
    }

    function updateQuantity(productId, newQuantity) {
        console.log('[Cart] Updating quantity:', { productId, newQuantity });
        
        try {
            if (newQuantity < 1) {
                console.log('[Cart] Quantity < 1, removing item');
                removeFromCart(productId);
                return;
            }

            const item = cartItems.find(item => item.productId === productId);
            if (!item) {
                console.warn('[Cart] Item not found in cart:', productId);
                return;
            }

            // Check stock if increasing quantity
            if (newQuantity > item.quantity && typeof InventoryManager !== 'undefined') {
                const additionalQuantity = newQuantity - item.quantity;
                const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, additionalQuantity);
                
                if (!stockCheck.available) {
                    console.warn('[Cart] Cannot increase quantity:', stockCheck.reason);
                    showStockErrorNotification(item.productName, `Available: ${stockCheck.availableStock}`);
                    return;
                }
            }

            item.quantity = newQuantity;
            saveCart();
            updateCartUI();
            
        } catch (error) {
            console.error('[Cart] Failed to update quantity:', error);
        }
    }

    function removeFromCart(productId) {
        console.log('[Cart] Removing item:', productId);
        
        try {
            const initialLength = cartItems.length;
            cartItems = cartItems.filter(item => item.productId !== productId);
            
            if (cartItems.length < initialLength) {
                saveCart();
                updateCartUI();
                console.log('[Cart] Item removed successfully');
                return true;
            }
            
            console.warn('[Cart] Item not found for removal');
            return false;
            
        } catch (error) {
            console.error('[Cart] Failed to remove item:', error);
            return false;
        }
    }

    function clearCart() {
        console.log('[Cart] Clearing cart...');
        
        try {
            cartItems = [];
            saveCart();
            updateCartUI();
            console.log('[Cart] Cart cleared');
        } catch (error) {
            console.error('[Cart] Failed to clear cart:', error);
        }
    }

    // ========================================================
    // CART QUERY FUNCTIONS
    // ========================================================
    function getCartItems() {
        return [...cartItems];
    }

//Add this after the getCartItems() function:
function getCartItemsWithPrices() {
    return cartItems.map(item => ({
        ...item,
        // Ensure all price fields exist for ordersManager.js
        price: item.currentPrice,
        wholesalePrice: item.wholesalePrice,
        retailPrice: item.retailPrice
    }));
}

    function getCartTotal() {
        try {
            const total = cartItems.reduce((sum, item) => {
    return sum + (item.currentPrice * item.quantity);
}, 0);
            return parseFloat(total.toFixed(2));
        } catch (error) {
            console.error('[Cart] Failed to calculate total:', error);
            return 0;
        }
    }

    function getCartCount() {
        try {
            return cartItems.reduce((count, item) => count + item.quantity, 0);
        } catch (error) {
            console.error('[Cart] Failed to calculate count:', error);
            return 0;
        }
    }

    // ========================================================
    // UI CREATION FUNCTIONS
    // ========================================================
    function createCartSidebar() {
        console.log('[Cart] Creating cart sidebar...');
        
        try {
            // Remove existing cart if present
            const existingCart = document.getElementById('cart-sidebar');
            if (existingCart) {
                existingCart.remove();
                console.log('[Cart] Removed existing cart sidebar');
            }

            // Create cart container
            const cartSidebar = document.createElement('div');
            cartSidebar.id = 'cart-sidebar';
            cartSidebar.className = 'cart-sidebar';
            
            cartSidebar.innerHTML = `
                <div class="cart-header">
                    <h3>Your Cart</h3>
                    <button id="close-cart" class="cart-close-btn">&times;</button>
                </div>
                
                <div class="cart-items" id="cart-items-container">
                    <div class="empty-cart">Your cart is empty</div>
                </div>
                
                <div class="cart-footer">
                    <div class="cart-total">
                        <strong>Total:</strong>
                        <strong id="cart-total">R0.00</strong>
                    </div>
                    <button id="checkout-btn" class="checkout-btn" disabled>
                        Proceed to Checkout
                    </button>
                </div>
            `;
            
            document.body.appendChild(cartSidebar);
            console.log('[Cart] Cart sidebar created successfully');
            
        } catch (error) {
            console.error('[Cart] Failed to create cart sidebar:', error);
            throw new Error('Cart sidebar creation failed: ' + error.message);
        }
    }

    // ========================================================
    // UI UPDATE FUNCTIONS
    // ========================================================
    function updateCartUI() {
        console.log('[Cart] Updating cart UI...');
        
        try {
            updateCartCount();
            updateCartItems();
            updateCartTotals();
            updateCheckoutButton();
            
        } catch (error) {
            console.error('[Cart] Failed to update UI:', error);
        }
    }

    function updateCartCount() {
        try {
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                const count = getCartCount();
                cartCount.textContent = count;
                console.log('[Cart] Cart count updated:', count);
            }
        } catch (error) {
            console.error('[Cart] Failed to update cart count:', error);
        }
    }

    function updateCartItems() {
        try {
            const container = document.getElementById('cart-items-container');
            if (!container) {
                console.warn('[Cart] Cart items container not found');
                return;
            }

            if (cartItems.length === 0) {
                container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                console.log('[Cart] Cart is empty');
                return;
            }

            container.innerHTML = cartItems.map(item => getCartItemHTML(item)).join('');
            console.log('[Cart] Cart items rendered:', cartItems.length, 'items');
            
        } catch (error) {
            console.error('[Cart] Failed to update cart items:', error);
        }
    }

    function getCartItemHTML(item) {
        return `
            <div class="cart-item" data-id="${item.productId}">
                <img src="${item.imageUrl}" alt="${item.productName}">
                <div class="cart-item-details">
                    <h4>${item.productName}</h4>
<p>R${item.currentPrice.toFixed(2)} × ${item.quantity}</p>
</div>
                <div class="cart-item-controls">
                    <button class="qty-btn minus" data-id="${item.productId}">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.productId}">+</button>
                    <button class="remove-btn" data-id="${item.productId}">×</button>
                </div>
            </div>
        `;
    }

    function updateCartTotals() {
        try {
            const subtotal = getCartTotal();
            const shipping = calculateShipping(subtotal);
            const finalTotal = subtotal + shipping;
            const isFreeShipping = shipping === 0;

            // Update total display
            const cartTotalElement = document.getElementById('cart-total');
            if (cartTotalElement) {
                cartTotalElement.textContent = `R${finalTotal.toFixed(2)}`;
            }

            // Update shipping info
            updateShippingInfo(subtotal, shipping, isFreeShipping);
            
        } catch (error) {
            console.error('[Cart] Failed to update totals:', error);
        }
    }

    function calculateShipping(subtotal) {
        return subtotal >= CONFIG.SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST;
    }

    function updateShippingInfo(subtotal, shipping, isFreeShipping) {
        // Remove existing shipping info
        const existingShipping = document.querySelector('.cart-shipping-info');
        if (existingShipping) existingShipping.remove();

        if (cartItems.length === 0) return;

        const cartFooter = document.querySelector('.cart-footer');
        if (!cartFooter) return;

        const shippingHtml = `
            <div class="cart-shipping-info">
                <div class="shipping-row">
                    <span>Shipping:</span>
                    <span class="shipping-cost ${isFreeShipping ? 'free' : ''}">
                        ${isFreeShipping ? 'FREE' : `R${shipping.toFixed(2)}`}
                    </span>
                </div>
                
                ${!isFreeShipping ? `
                <div class="shipping-message">
                    <i class="fas fa-truck"></i>
                    Spend R${(CONFIG.SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping!
                </div>
                ` : `
                <div class="shipping-success">
                    <i class="fas fa-check-circle"></i>
                    Free shipping applied!
                </div>
                `}
                
                <div class="vat-notice">
                    <i class="fas fa-info-circle"></i>
                    Prices include ${CONFIG.VAT_PERCENTAGE}% VAT. No returns on damaged products.
                </div>
            </div>
        `;

        const shippingContainer = document.createElement('div');
        shippingContainer.innerHTML = shippingHtml;
        
        const totalDiv = cartFooter.querySelector('.cart-total');
        if (totalDiv) {
            cartFooter.insertBefore(shippingContainer, totalDiv.nextSibling);
        }
    }

    function updateCheckoutButton() {
        try {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.disabled = cartItems.length === 0;
            }
        } catch (error) {
            console.error('[Cart] Failed to update checkout button:', error);
        }
    }

    // ========================================================
    // NOTIFICATION FUNCTIONS
    // ========================================================
    function showAddedNotification(productName) {
        showNotification(`✓ Added ${productName} to cart`, 'success');
    }

    function showStockErrorNotification(productName, reason) {
        showNotification(`${productName}: ${reason}`, 'error');
    }

    function showErrorNotification(message) {
        showNotification(message, 'error');
    }

    function showNotification(message, type = 'info') {
        try {
            const notificationId = `cart-${type}-notification`;
            let notification = document.getElementById(notificationId);
            
            if (!notification) {
                notification = document.createElement('div');
                notification.id = notificationId;
                notification.className = `cart-notification ${type}`;
                document.body.appendChild(notification);
            }
            
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
            `;
            
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('[Cart] Failed to show notification:', error);
        }
    }

    // ========================================================
    // CART INTERACTION FUNCTIONS
    // ========================================================
    function toggleCart() {
        try {
            const cartSidebar = document.getElementById('cart-sidebar');
            if (!cartSidebar) {
                console.error('[Cart] Cart sidebar not found');
                return;
            }
            
            const isOpen = parseInt(cartSidebar.style.right) < 0;
            cartSidebar.style.right = isOpen ? '0' : '-400px';
            document.body.style.overflow = isOpen ? 'hidden' : '';
            
            console.log('[Cart] Cart toggled:', isOpen ? 'opened' : 'closed');
            
        } catch (error) {
            console.error('[Cart] Failed to toggle cart:', error);
        }
    }

    function closeCart() {
        try {
            const cartSidebar = document.getElementById('cart-sidebar');
            if (cartSidebar) {
                cartSidebar.style.right = '-400px';
                document.body.style.overflow = '';
                console.log('[Cart] Cart closed');
            }
        } catch (error) {
            console.error('[Cart] Failed to close cart:', error);
        }
    }

    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    function setupCheckoutButton() {
        try {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', handleCheckout);
                console.log('[Cart] Checkout button event listener added');
            } else {
                console.warn('[Cart] Checkout button not found');
            }
        } catch (error) {
            console.error('[Cart] Failed to setup checkout button:', error);
        }
    }

    function handleCheckout(e) {
        console.log('[Cart] Checkout button clicked');
        e.preventDefault();
        
        try {
            if (typeof CustomerOrderManager !== 'undefined') {
                closeCart();
                CustomerOrderManager.openCheckout();
            } else {
                console.error('[Cart] CustomerOrderManager not loaded');
                showErrorNotification('Checkout system not available. Please refresh.');
            }
        } catch (error) {
            console.error('[Cart] Checkout failed:', error);
            showErrorNotification('Checkout failed. Please try again.');
        }
    }

    function setupEventListeners() {
        console.log('[Cart] Setting up event listeners...');
        
        try {
            // Remove existing listeners to prevent duplicates
            document.removeEventListener('click', handleCartClicks);
            
            // Add new listener
            document.addEventListener('click', handleCartClicks);
            
            console.log('[Cart] Event listeners setup complete');
        } catch (error) {
            console.error('[Cart] Failed to setup event listeners:', error);
        }
    }

    function handleCartClicks(e) {
        try {
            // Cart toggle
            if (e.target.id === 'cart-toggle' || e.target.closest('#cart-toggle')) {
                toggleCart();
                return;
            }
            
            // Close cart
            if (e.target.id === 'close-cart' || e.target.closest('#close-cart')) {
                closeCart();
                return;
            }
            
            // Handle cart item actions
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
            
        } catch (error) {
            console.error('[Cart] Click handler error:', error);
        }
    }

// ========================================================
    // PUBLIC API
// ========================================================
    return {
        init,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItems,
        getCartItemsWithPrices, // NEW - for ordersManager.js
        getCartTotal,
        getCartCount,
        updateCartUI,
        toggleCart,
        closeCart
    };
})();

