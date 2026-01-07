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
