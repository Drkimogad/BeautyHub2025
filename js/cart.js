// cart.js - Shopping Cart Functionality

const BeautyHubCart = (function() {
    // Cart state
    let cartItems = [];
    
    // Initialize cart system
    function init() {
        loadCart();
        createCartSidebar();
        //createCartButton();
        updateCartUI();
        setupEventListeners();
        setupCheckoutButton();
    }
    
    // ===== CART STORAGE FUNCTIONS =====
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
    
    function saveCart() {
        localStorage.setItem('beautyhub_cart', JSON.stringify(cartItems));
    }
    
    // ===== CART OPERATIONS =====
    function addToCart(productId, productName, price, imageUrl, quantity = 1) {
    // Check stock availability if InventoryManager is available
    if (typeof InventoryManager !== 'undefined') {
        const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, quantity);
        
        if (!stockCheck.available) {
            // Show error notification
            let errorNotification = document.getElementById('cart-error-notification');
            if (!errorNotification) {
                errorNotification = document.createElement('div');
                errorNotification.id = 'cart-error-notification';
                errorNotification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff5252;
                    color: white;
                    padding: 1rem;
                    border-radius: 4px;
                    z-index: 10000;
                    display: none;
                `;
                document.body.appendChild(errorNotification);
            }
            
            errorNotification.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                ${productName}: ${stockCheck.reason}
            `;
            errorNotification.style.display = 'block';
            
            setTimeout(() => {
                errorNotification.style.display = 'none';
            }, 3000);
            
            return; // Don't add to cart
        }
    }
    
    // If inventory check passed or InventoryManager not available, proceed
    const existing = cartItems.find(item => item.productId === productId);
    
    if (existing) {
        // Check if adding more exceeds stock
        if (typeof InventoryManager !== 'undefined') {
            const newTotalQuantity = existing.quantity + quantity;
            const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, newTotalQuantity);
            
            if (!stockCheck.available) {
                // Show error for existing item
                let errorNotification = document.getElementById('cart-error-notification');
                if (!errorNotification) {
                    errorNotification = document.createElement('div');
                    errorNotification.id = 'cart-error-notification';
                    errorNotification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #ff5252;
                        color: white;
                        padding: 1rem;
                        border-radius: 4px;
                        z-index: 10000;
                        display: none;
                    `;
                    document.body.appendChild(errorNotification);
                }
                
                errorNotification.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                    Cannot add more ${productName}. Available: ${stockCheck.availableStock}
                `;
                errorNotification.style.display = 'block';
                
                setTimeout(() => {
                    errorNotification.style.display = 'none';
                }, 3000);
                
                return;
            }
        }
        
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

    function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    // Check stock if increasing quantity
    const item = cartItems.find(item => item.productId === productId);
    if (item && newQuantity > item.quantity && typeof InventoryManager !== 'undefined') {
        const additionalQuantity = newQuantity - item.quantity;
        const stockCheck = InventoryManager.checkStockBeforeAddToCart(productId, additionalQuantity);
        
        if (!stockCheck.available) {
            // Show error
            let errorNotification = document.getElementById('cart-error-notification');
            if (!errorNotification) {
                errorNotification = document.createElement('div');
                errorNotification.id = 'cart-error-notification';
                errorNotification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff5252;
                    color: white;
                    padding: 1rem;
                    border-radius: 4px;
                    z-index: 10000;
                    display: none;
                `;
                document.body.appendChild(errorNotification);
            }
            
            errorNotification.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                Cannot increase quantity. Available: ${stockCheck.availableStock}
            `;
            errorNotification.style.display = 'block';
            
            setTimeout(() => {
                errorNotification.style.display = 'none';
            }, 3000);
            
            return;
        }
    }
    
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCartUI();
    }
}
    

    
    function clearCart() {
        cartItems = [];
        saveCart();
        updateCartUI();
    }
    
    function getCartItems() {
        return [...cartItems];
    }
    
    function getCartTotal() {
        return cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    function getCartCount() {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }
    
    // ===== UI CREATION =====
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
    
    function createCartButton() {
        // Remove existing cart button if present
        const existingBtn = document.getElementById('cart-toggle');
        if (existingBtn) existingBtn.remove();
        
        // Find or create header actions container
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

    // ===== UI UPDATES =====
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Update cart count
    if (cartCount) {
        cartCount.textContent = getCartCount();
    }
    
    // Calculate SUBTOTAL (items only)
    const subtotal = getCartTotal(); // This is actually subtotal
    const subtotalFixed = subtotal.toFixed(2);
    
    // Update cart total (this is actually subtotal)
    if (cartTotal) {
        cartTotal.textContent = `R${subtotalFixed}`;
    }
    
    // Update cart items list
    if (cartItemsContainer) {
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }
        
        let html = '';
        cartItems.forEach(item => {
            html += `
            <div class="cart-item" data-id="${item.productId}" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: 1px solid #f5f5f5;
            ">
                <img src="${item.imageUrl}" alt="${item.productName}" style="
                    width: 50px;
                    height: 50px;
                    object-fit: cover;
                    border-radius: 4px;
                ">
                <div class="cart-item-details" style="flex: 1; padding: 0 1rem;">
                    <h4 style="margin: 0 0 0.25rem 0;">${item.productName}</h4>
                    <p style="margin: 0; color: #666;">R${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
                <div class="cart-item-controls" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="qty-btn minus" data-id="${item.productId}" style="
                        width: 25px;
                        height: 25px;
                        border: 1px solid #ddd;
                        background: white;
                        cursor: pointer;
                        border-radius: 4px;
                    ">−</button>
                    <span class="qty-display" style="min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.productId}" style="
                        width: 25px;
                        height: 25px;
                        border: 1px solid #ddd;
                        background: white;
                        cursor: pointer;
                        border-radius: 4px;
                    ">+</button>
                    <button class="remove-btn" data-id="${item.productId}" style="
                        background: #ff5252;
                        color: white;
                        border: none;
                        width: 25px;
                        height: 25px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">×</button>
                </div>
            </div>`;
        });
        cartItemsContainer.innerHTML = html;
    }
    
    // Calculate shipping
    const shippingThreshold = 1000;
    const shippingCost = subtotal >= shippingThreshold ? 0 : 100;  // was 50
    const isFreeShipping = subtotal >= shippingThreshold;
    const finalTotal = subtotal + shippingCost;
    
    // Remove existing shipping info if present
    const existingShipping = document.querySelector('.cart-shipping-info');
    if (existingShipping) existingShipping.remove();
    
    // Create shipping HTML
    const shippingHtml = `
    <div class="cart-shipping-info" style="
        margin: 1rem 0;
        padding: 1rem;
        background: ${isFreeShipping ? '#e8f5e9' : '#fff8e1'};
        border-radius: 8px;
        border-left: 4px solid ${isFreeShipping ? '#4CAF50' : '#FF9800'};
    ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Shipping:</span>
            <span style="font-weight: bold; color: ${isFreeShipping ? '#4CAF50' : '#333'}">
                ${isFreeShipping ? 'FREE' : `R${shippingCost.toFixed(2)}`}
            </span>
        </div>
        
        ${!isFreeShipping ? `
        <div style="font-size: 0.9rem; color: #666;">
            <i class="fas fa-truck" style="margin-right: 5px;"></i>
            Spend R${(shippingThreshold - subtotal).toFixed(2)} more for free shipping!
        </div>
        ` : `
        <div style="font-size: 0.9rem; color: #4CAF50;">
            <i class="fas fa-check-circle" style="margin-right: 5px;"></i>
            Free shipping applied!
        </div>
        `}
        
        <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
            <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
            Prices include 15% VAT. No returns on damaged products.
        </div>
    </div>
    `;
    
    // Insert shipping info and update final total
    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
        // Create container for shipping
        const shippingContainer = document.createElement('div');
        shippingContainer.innerHTML = shippingHtml;
        
        // Insert shipping before the total section
        const totalDiv = cartFooter.querySelector('.cart-total');
        if (totalDiv) {
            cartFooter.insertBefore(shippingContainer, totalDiv.nextSibling);
        }
        
        // Update total display to show FINAL TOTAL (subtotal + shipping)
        const cartTotalElement = document.getElementById('cart-total');
        if (cartTotalElement) {
            cartTotalElement.textContent = `R${finalTotal.toFixed(2)}`;
        }
    }
    
    // Enable/disable checkout button
    if (checkoutBtn) {
        checkoutBtn.disabled = cartItems.length === 0;
    }
}

    
    function showAddedNotification(productName) {
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
    
    // ===== CART INTERACTION =====
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
    
    function closeCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar) {
            cartSidebar.style.right = '-400px';
            document.body.style.overflow = '';
        }
    }
    
    // ===== EVENT HANDLERS =====
    function setupCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (typeof CustomerOrderManager !== 'undefined') {
                    CustomerOrderManager.openCheckout();
                } else {
                    console.error('CustomerOrderManager not loaded');
                    alert('Checkout system is not available. Please refresh the page.');
                }
            });
        }
    }
    
function setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    document.removeEventListener('click', cartClickHandler);
    
    // Cart toggle
    document.addEventListener('click', cartClickHandler);
}

// Separate handler function to make removal possible
function cartClickHandler(e) {
    if (e.target.id === 'cart-toggle' || e.target.closest('#cart-toggle')) {
        toggleCart();
    }
    
    if (e.target.id === 'close-cart' || e.target.closest('#close-cart')) {
        closeCart();
    }
    
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
}

    function removeFromCart(productId) {
    const initialLength = cartItems.length;
    cartItems = cartItems.filter(item => item.productId !== productId);
    
    if (cartItems.length < initialLength) {
        saveCart();
        updateCartUI();
        return true;
    }
    return false;
}
    
    // ===== PUBLIC API =====
    return {
        init,
        addToCart,
        removeFromCart, // ADD THIS LINE
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

