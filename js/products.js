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
// MODULE-LEVEL VARIABLE (accessible to all functions)
let fallbackCheck = null;
// Initialize products display
function init() {
    console.log('[ProductsDisplay] Initializing...');
    // SET UP ALL EVENT LISTENERS FIRST (BEFORE ANYTHING ELSE)
    // Listen for ProductsManager ready signal - SET UP ONCE
    window.addEventListener('productsManagerReady', () => {
        console.log('[ProductsDisplay] Received productsManagerReady signal');
    // STOP THE FALLBACK TIMER
    if (fallbackCheck) {
        clearInterval(fallbackCheck);
        console.log('[ProductsDisplay] Stopped fallback timer');
    }
        renderProducts();
        setupEventListeners();
    });
    
    // Listen for product updates
    window.addEventListener('productsUpdated', () => {
        console.log('[ProductsDisplay] Products updated, refreshing...');
        renderProducts();
    });
    
    // Check if ProductsManager is ready
    const checkProductsManager = () => {
        if (typeof ProductsManager !== 'undefined' && 
           ProductsManager.getProducts &&
           ProductsManager.products && // ADD THIS
           ProductsManager.products.length > 0) { // AND THIS
            // Just check if function exists, don't check length
            console.log('[ProductsDisplay] ProductsManager ready, rendering products');
            renderProducts();
            setupEventListeners();
            return true;
        }
        return false;
    };
    
    // Try immediately, but don't return early
        checkProductsManager();
// Try immediately
  //  if (checkProductsManager()) {
  //      return; // Success, exit function
 //   }
    
    console.log('[ProductsDisplay] Waiting for ProductsManager...');
    
// Fallback: Check every 100ms for 3 seconds
let checks = 0;
let fallbackCheck = setInterval(() => { // Remove const, use let
    checks++;
    if (checkProductsManager()) {
        clearInterval(fallbackCheck);
        fallbackCheck = null; // Clear reference
    } else if (checks >= 30) { // 30 checks * 100ms = 3 seconds
        clearInterval(fallbackCheck);
        fallbackCheck = null; // Clear reference
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
        products = ProductsManager.getProducts({ activeOnly: false });
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
    
    // Calculate if product is on sale
    const isOnSale = product.isOnSale || product.discountPercent > 0;
    const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.price;
    const discountAmount = hasDiscount ? product.originalPrice - product.price : 0;
    const discountPercentage = product.discountPercent || 
                              (hasDiscount ? Math.round((discountAmount / product.originalPrice) * 100) : 0);
    
    // Determine badges
    let badges = [];
    if (isOnSale && hasDiscount) badges.push(`-${discountPercentage}%`);
    if (product.tags && product.tags.includes('bestseller')) badges.push('BESTSELLER');
    if (product.tags && product.tags.includes('new')) badges.push('NEW');
    if (product.tags && product.tags.includes('featured')) badges.push('FEATURED');
    
    html += `
    <article class="product-card" data-product-id="${displayId}">
        ${badges.length > 0 ? `
        <div class="product-badges" style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 2;">
            ${badges.map(badge => `
                <div class="product-badge" style="
                    background: ${badge.includes('%') ? '#e91e63' : 
                                 badge === 'BESTSELLER' ? '#ff9800' : 
                                 badge === 'NEW' ? '#4CAF50' : '#667eea'};
                    color: white;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-align: center;
                ">${badge}</div>
            `).join('')}
        </div>` : ''}
        
        <div class="product-image-container" style="position: relative;">
            <img src="${product.imageUrl || 'gallery/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 width="440" height="440"
                 loading="lazy"
                 style="width: 100%; height: 250px; object-fit: cover;">
            
            ${isOnSale && hasDiscount ? `
            <div style="position: absolute; top: 10px; right: 10px; background: #e91e63; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                SALE
            </div>
            ` : ''}
        </div>
        
        <div class="product-info">
            <h3 style="margin: 0.5rem 0; font-size: 1.1rem;">${product.name}</h3>
            <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0; height: 40px; overflow: hidden;">
                ${product.description || 'Premium beauty product'}
            </p>
            
            <div class="product-pricing" style="margin: 0.5rem 0;">
                ${hasDiscount ? `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="original-price" style="
                        text-decoration: line-through;
                        color: #999;
                        font-size: 0.9rem;
                    ">
                        R${product.originalPrice.toFixed(2)}
                    </span>
                    <span class="current-price" style="
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #e91e63;
                    ">
                        R${product.price.toFixed(2)}
                    </span>
                </div>
                ` : `
                <span class="price" style="
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #e91e63;
                ">
                    R${product.price.toFixed(2)}
                </span>
                `}
            </div>
            
            <div class="stock-indicator" style="
                font-size: 0.85rem; 
                color: ${product.stock === 0 ? '#ff5252' : 
                         product.stock <= 5 ? '#ff9800' : '#4CAF50'}; 
                margin: 0.5rem 0;
            ">
                <i class="fas fa-box"></i> 
                ${product.stock === 0 ? 'Out of Stock' : 
                  product.stock <= 5 ? `Low Stock: ${product.stock} units` : 
                  `${product.stock} in stock`}
            </div>
            
            ${product.salesCount > 0 ? `
            <div class="sales-count" style="
                font-size: 0.8rem;
                color: #666;
                margin: 0.25rem 0;
            ">
                <i class="fas fa-chart-line"></i> ${product.salesCount} sold
            </div>
            ` : ''}
            
            <div class="rating" data-rating="4" style="margin: 0.5rem 0;">
                ★★★★☆
            </div>
        </div>
        
        <div class="product-actions" style="
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        ">
            <button class="add-to-cart" 
                    data-product-id="${displayId}"
                    data-product-name="${product.name}"
                    data-product-price="${product.price}"
                    data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}"
                    ${product.stock === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <i class="fas fa-shopping-cart"></i> 
                ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button class="quick-view" 
                    data-product-id="${displayId}"
                    style="
                        background: #f5f5f5;
                        color: #333;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        flex: 1;
                    ">
                Quick View
            </button>
        </div>
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
// Get fallback products (for when ProductsManager isn't available)
function getFallbackProducts() {
    return [
        {
            id: "p001",
            name: "Signature Perfumes",
            description: "Elegant scents that linger like a memory.",
            category: "perfumes",
            originalPrice: 350.00,
            discountPercent: 14,
            price: 300.00,
            isOnSale: true,
            saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            stock: 15,
            imageUrl: "gallery/perfumes.jpg",
            gallery: [],
            tags: ["new", "featured", "bestseller"],
            specifications: {
                'Size': '50ml',
                'Fragrance Type': 'Eau de Parfum',
                'Longevity': '8-10 hours'
            },
            isActive: true,
            salesCount: 25
        },
        {
            id: "p002",
            name: "Glam Lashes",
            description: "Dramatic or natural—find your perfect flutter.",
            category: "lashes",
            originalPrice: 59.99,
            discountPercent: 17,
            price: 49.99,
            isOnSale: true,
            saleEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            stock: 42,
            imageUrl: "gallery/lashes.jpg",
            gallery: [],
            tags: ["bestseller"],
            specifications: {
                'Style': 'Dramatic',
                'Material': 'Mink',
                'Reusable': 'Yes (up to 25 uses)'
            },
            isActive: true,
            salesCount: 42
        },
        {
            id: "p003",
            name: "Radiant Skincare",
            description: "Glow from within with our nourishing formulas.",
            category: "skincare",
            originalPrice: 99.99,
            discountPercent: 0,
            price: 99.99,
            isOnSale: false,
            saleEndDate: "",
            stock: 28,
            imageUrl: "gallery/skincare.jpg",
            gallery: [],
            tags: ["bestseller", "featured"],
            specifications: {
                'Skin Type': 'All skin types',
                'Volume': '30ml',
                'Key Ingredients': 'Vitamin C, Hyaluronic Acid'
            },
            isActive: true,
            salesCount: 18
        },
        {
            id: "p004",
            name: "Luxury Wigs",
            description: "Silky, voluminous hair for every mood.",
            category: "wigs",
            originalPrice: 699.99,
            discountPercent: 14,
            price: 599.99,
            isOnSale: true,
            saleEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            stock: 12,
            imageUrl: "gallery/wigs.jpg",
            gallery: [],
            tags: ["new"],
            specifications: {
                'Length': '24 inches',
                'Material': 'Human Hair',
                'Cap Size': 'Average'
            },
            isActive: true,
            salesCount: 7
        }
    ];
}

// ==================================================
// Setup event listeners (keep existing code, unchanged)
//===========================================================
    function setupEventListeners() {
      console.log('[ProductsDisplay] Setting up productsManagerReady listener'); 
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
    
    // Calculate sale info
    const isOnSale = product.isOnSale || product.discountPercent > 0;
    const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.price;
    const discountAmount = hasDiscount ? product.originalPrice - product.price : 0;
    const discountPercentage = product.discountPercent || 
                              (hasDiscount ? Math.round((discountAmount / product.originalPrice) * 100) : 0);
    
    // Get tags
    const tags = product.tags || [];
    const category = product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : '';
    
    // Create quick view modal
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
                         style="width: 100%; border-radius: 8px; object-fit: cover;">
                    
                    ${product.gallery && product.gallery.length > 0 ? `
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; overflow-x: auto; padding: 0.5rem 0;">
                        ${product.gallery.map((img, index) => `
                            <img src="${img}" 
                                 alt="${product.name} - View ${index + 1}"
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                                 onclick="this.closest('.quick-view-content').querySelector('img').src='${img}'">
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
                
                <div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                        ${tags.map(tag => `
                            <span style="
                                background: ${tag === 'bestseller' ? '#ff9800' : 
                                            tag === 'new' ? '#4CAF50' : 
                                            tag === 'featured' ? '#667eea' : '#e0e0e0'};
                                color: white;
                                padding: 0.25rem 0.75rem;
                                border-radius: 20px;
                                font-size: 0.8rem;
                                font-weight: 600;
                            ">${tag.toUpperCase()}</span>
                        `).join('')}
                        
                        ${isOnSale && hasDiscount ? `
                        <span style="
                            background: #e91e63;
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">SALE -${discountPercentage}%</span>
                        ` : ''}
                    </div>
                    
                    <h2 style="margin: 0 0 1rem 0;">${product.name}</h2>
                    <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">
                        ${product.description || 'Premium beauty product'}
                    </p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        ${hasDiscount ? `
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="
                                text-decoration: line-through;
                                color: #999;
                                font-size: 1.2rem;
                            ">
                                R${product.originalPrice.toFixed(2)}
                            </span>
                            <span style="
                                font-size: 2rem;
                                font-weight: bold;
                                color: #e91e63;
                            ">
                                R${product.price.toFixed(2)}
                            </span>
                        </div>
                        ` : `
                        <div style="font-size: 2rem; font-weight: bold; color: #e91e63;">
                            R${product.price.toFixed(2)}
                        </div>
                        `}
                        
                        <div style="color: ${isOutOfStock ? '#ff5252' : isLowStock ? '#ff9800' : '#4CAF50'}; margin-top: 0.5rem;">
                            <i class="fas fa-box"></i> 
                            ${isOutOfStock ? 'Out of Stock' : 
                              isLowStock ? `Low Stock: ${product.stock} units` : 
                              `In Stock: ${product.stock} units`}
                        </div>
                        
                        ${product.salesCount > 0 ? `
                        <div style="color: #666; margin-top: 0.5rem;">
                            <i class="fas fa-chart-line"></i> ${product.salesCount} units sold
                        </div>
                        ` : ''}
                        
                        ${category ? `
                        <div style="color: #666; margin-top: 0.5rem;">
                            <i class="fas fa-tag"></i> ${category}
                        </div>
                        ` : ''}
                        
                        ${isOnSale && product.saleEndDate ? `
                        <div style="color: #e91e63; margin-top: 0.5rem; font-size: 0.9rem;">
                            <i class="fas fa-clock"></i> Sale ends: ${new Date(product.saleEndDate).toLocaleDateString()}
                        </div>
                        ` : ''}
                    </div>
                    
                    ${Object.keys(product.specifications || {}).length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Specifications</h3>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                            ${Object.entries(product.specifications).map(([key, value]) => `
                                <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #e0e0e0;">
                                    <span style="font-weight: 600;">${key}:</span>
                                    <span>${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">
                        <p><i class="fas fa-shipping-fast"></i> Free shipping on orders over R500</p>
                        <p><i class="fas fa-undo"></i> 30-day return policy</p>
                        <p><i class="fas fa-shield-alt"></i> Secure payment</p>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button class="add-to-cart-quickview" 
                                data-product-id="${product.id}"
                                data-product-name="${product.name}"
                                data-product-price="${product.price}"
                                data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}"
                                style="
                                    background: ${isOutOfStock ? '#ccc' : '#e91e63'};
                                    color: white;
                                    border: none;
                                    padding: 1rem 2rem;
                                    border-radius: 8px;
                                    font-size: 1rem;
                                    font-weight: 600;
                                    cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'};
                                    flex: 1;
                                "
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        
                        <button style="
                            background: #f5f5f5;
                            color: #333;
                            border: none;
                            padding: 1rem 2rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            <i class="fas fa-heart"></i> Wishlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-quick-view');
    const addToCartBtn = modal.querySelector('.add-to-cart-quickview');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    if (addToCartBtn && !isOutOfStock && typeof BeautyHubCart !== 'undefined') {
        addToCartBtn.addEventListener('click', () => {
            BeautyHubCart.addToCart(
                product.id,
                product.name,
                product.price,
                product.imageUrl || 'gallery/placeholder.jpg',
                1
            );
            
            // Optional: Show confirmation
            const originalText = addToCartBtn.innerHTML;
            addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
            addToCartBtn.style.background = '#4CAF50';
            
            setTimeout(() => {
                addToCartBtn.innerHTML = originalText;
                addToCartBtn.style.background = '#e91e63';
            }, 2000);
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
    },
        renderProducts // <-- ADD THIS LINE
};
})();
