// products.js - Products Display (UPDATED)
/*
Summary of changes to products.js:
✅ Added proper fallback function
✅ Checks if ProductsManager is initialized
✅ Uses cache from productsManager.js
✅ Falls back gracefully if cache is empty
✅ Maintains exact same user experience
✅ Added logging for debugging
*/
const ProductsDisplay = (function() {
  // Initialize products display
function init() {
    console.log('[ProductsDisplay] Initializing...');
    
    // Check if ProductsManager is ready
    const checkProductsManager = () => {
        if (typeof ProductsManager !== 'undefined' && 
            ProductsManager.products && 
            ProductsManager.products.length > 0) {
            // ProductsManager has products loaded
            console.log('[ProductsDisplay] ProductsManager ready, rendering products');
            renderProducts();
            setupEventListeners();
            return true;
        }
        return false;
    };
    
    // Try immediately
    if (checkProductsManager()) {
        return; // Success, exit function
    }
    
    // If not ready, wait for signal
    console.log('[ProductsDisplay] Waiting for ProductsManager...');
    
    // Listen for ProductsManager ready signal
    window.addEventListener('productsManagerReady', () => {
        console.log('[ProductsDisplay] Received productsManagerReady signal');
        renderProducts();
        setupEventListeners();
    });
    
    // Also listen for product updates
    window.addEventListener('productsUpdated', () => {
        console.log('[ProductsDisplay] Products updated, refreshing...');
        renderProducts();
    });
    
    // Fallback: Check every 100ms for 3 seconds
    let checks = 0;
    const fallbackCheck = setInterval(() => {
        checks++;
        if (checkProductsManager()) {
            clearInterval(fallbackCheck);
        } else if (checks >= 30) { // 30 checks * 100ms = 3 seconds
            clearInterval(fallbackCheck);
            console.log('[ProductsDisplay] Fallback: Rendering with available data');
            renderProducts();
            setupEventListeners();
        }
    }, 100);
}
  
// Render products to page using ProductsManager data
function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) {
        console.error('[ProductsDisplay] Products container not found');
        return;
    }
    
    console.log('[ProductsDisplay] Rendering products...');
    
    // Get products - ALWAYS use ProductsManager if available
    let products = [];
    
    if (typeof ProductsManager !== 'undefined' && ProductsManager.getProducts) {
        products = ProductsManager.getProducts({ activeOnly: true });
        console.log('[ProductsDisplay] Loaded from ProductsManager:', products.length, 'products');
    }
    
    // If still no products, use fallback
    if (products.length === 0) {
        console.log('[ProductsDisplay] No products from manager, using fallback');
        products = getFallbackProducts();
    }
    
    // Show loading indicator if products are empty
    if (products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Loading products...</p>
            </div>
        `;
        return;
    }
    
    // Render products (keep your existing rendering logic from line 49 onward)
    let html = `
    <section id="products" class="products" aria-labelledby="products-heading">
        <h2 id="products-heading" class="section-title">Glam Collection</h2>
        <div class="product-grid">
    `;
    
    products.forEach(product => {
        // Get proper product ID (handle both old "p001" and new "PROD-..." formats)
        const displayId = product.id.startsWith('PROD-') ? product.id : product.id;
        
        html += `
        <article class="product-card" data-product-id="${displayId}">
            ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            <img src="${product.imageUrl || 'gallery/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 width="440" height="440"
                 loading="lazy">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || 'Premium beauty product'}</p>
                <span class="price">From R${product.price.toFixed(2)}</span>
                <div class="stock-indicator" style="font-size: 0.85rem; color: ${product.stock <= 5 ? '#ff9800' : '#4CAF50'}; margin-top: 0.5rem;">
                    <i class="fas fa-box"></i> ${product.stock} in stock
                </div>
                <div class="rating" data-rating="4">★★★★☆</div>
            </div>
            <button class="add-to-cart" 
                    data-product-id="${displayId}"
                    data-product-name="${product.name}"
                    data-product-price="${product.price}"
                    data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="quick-view" 
                    data-product-id="${displayId}">
                Quick View
            </button>
        </article>`;
    });
    
    html += `
        </div>
    </section>`;
    
    container.innerHTML = html;
    console.log('[ProductsDisplay] Products rendered successfully');
}
    
// Get product by ID (using ProductsManager if available)
function getProductById(productId) {
    if (typeof ProductsManager !== 'undefined') {
        // Check if ProductsManager is initialized
        if (ProductsManager.products && ProductsManager.products.length > 0) {
            return ProductsManager.getProductById(productId);
        } else {
            console.warn('[ProductsDisplay] ProductsManager not initialized yet, checking fallback');
        }
    }
    
    // Fallback to original logic
    const fallbackProducts = getFallbackProducts(); // We'll create this function
    return fallbackProducts.find(p => p.id === productId);
}
//Create a getFallbackProducts() function (after getProductById):
// Get fallback products (for when ProductsManager isn't available)
function getFallbackProducts() {
    return [
        {
            id: "p001",
            name: "Signature Perfumes",
            description: "Elegant scents that linger like a memory.",
            price: 300,
            category: "perfumes",
            stock: 15,
            imageUrl: "gallery/perfumes.jpg",
            badge: "NEW"
        },
        {
            id: "p002",
            name: "Glam Lashes",
            description: "Dramatic or natural—find your perfect flutter.",
            price: 49.99,
            category: "lashes",
            stock: 42,
            imageUrl: "gallery/lashes.jpg",
            badge: null
        },
        {
            id: "p003",
            name: "Radiant Skincare",
            description: "Glow from within with our nourishing formulas.",
            price: 99.99,
            category: "skincare",
            stock: 28,
            imageUrl: "gallery/skincare.jpg",
            badge: "BESTSELLER"
        },
        {
            id: "p004",
            name: "Luxury Wigs",
            description: "Silky, voluminous hair for every mood.",
            price: 599.99,
            category: "wigs",
            stock: 12,
            imageUrl: "gallery/wigs.jpg",
            badge: null
        }
    ];
}

    // Setup event listeners (keep existing code, unchanged)
    function setupEventListeners() {
        document.addEventListener('click', function(e) {
            // Add to cart button
            if (e.target.classList.contains('add-to-cart') || 
                e.target.closest('.add-to-cart')) {
                
                const btn = e.target.classList.contains('add-to-cart') ? 
                           e.target : e.target.closest('.add-to-cart');
                
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                const productPrice = btn.dataset.productPrice;
                const productImg = btn.dataset.productImg;
                
                if (productId && typeof BeautyHubCart !== 'undefined') {
                    BeautyHubCart.addToCart(
                        productId, 
                        productName, 
                        productPrice, 
                        productImg, 
                        1
                    );
                }
            }
            
            // Quick view button
            if (e.target.classList.contains('quick-view') || 
                e.target.closest('.quick-view')) {
                
                const btn = e.target.classList.contains('quick-view') ? 
                           e.target : e.target.closest('.quick-view');
                
                const productId = btn.dataset.productId;
                showQuickView(productId);
            }
        });
    }
    
    // Show quick view modal (updated to use ProductsManager)
    function showQuickView(productId) {
        const product = getProductById(productId);
        if (!product) return;
        
        // Create quick view modal (keep existing code, just update product data display)
        let modal = document.getElementById('quick-view-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quick-view-modal';
            modal.className = 'quick-view-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 1001;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            document.body.appendChild(modal);
        }
        
        const isLowStock = product.stock <= 5;
        const isOutOfStock = product.stock === 0;
        
        modal.innerHTML = `
            <div class="quick-view-content" style="
                background: white;
                border-radius: 12px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2rem;
                position: relative;
            ">
                <button class="close-quick-view" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <img src="${product.imageUrl || 'gallery/placeholder.jpg'}" 
                             alt="${product.name}" 
                             style="width: 100%; border-radius: 8px;">
                    </div>
                    <div>
                        ${product.badge ? `<span style="
                            background: #e91e63;
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            margin-bottom: 1rem;
                            display: inline-block;
                        ">${product.badge}</span>` : ''}
                        
                        <h2 style="margin: 0 0 1rem 0;">${product.name}</h2>
                        <p style="color: #666; margin-bottom: 1.5rem;">${product.description || 'Premium beauty product'}</p>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 2rem; font-weight: bold; color: #e91e63;">
                                R${product.price.toFixed(2)}
                            </div>
                            <div style="color: ${isOutOfStock ? '#ff5252' : isLowStock ? '#ff9800' : '#4CAF50'}; margin-top: 0.5rem;">
                                <i class="fas fa-box"></i> 
                                ${isOutOfStock ? 'Out of Stock' : 
                                  isLowStock ? `Low Stock: ${product.stock} units` : 
                                  `In Stock: ${product.stock} units`}
                            </div>
                            ${product.category ? `<div style="color: #666; margin-top: 0.5rem;">
                                <i class="fas fa-tag"></i> ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                            </div>` : ''}
                        </div>
                        
                        <div style="font-size: 0.9rem; color: #666;">
                            <p><i class="fas fa-shipping-fast"></i> Free shipping on orders over R500</p>
                            <p><i class="fas fa-undo"></i> 30-day return policy</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-quick-view');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }        
    }
    
    // Public API (keep same interface)
// Public API (keep same interface)
return {
    init,
    getProductById,
    getAllProducts: () => {
        if (typeof ProductsManager !== 'undefined' && 
            ProductsManager.products && 
            ProductsManager.products.length > 0) {
            return ProductsManager.getProducts({ activeOnly: true });
        }
        return getFallbackProducts();
    }
};
})();

// Auto-initialize
//if (document.readyState === 'loading') {
//    document.addEventListener('DOMContentLoaded', () => ProductsDisplay.init());
//} else {
//    ProductsDisplay.init();
//}
