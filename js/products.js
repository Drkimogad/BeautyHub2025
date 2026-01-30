// products.js - Products Display (CLEAN VERSION - NO FALLBACK)
const ProductsDisplay = (function() {
    // MODULE-LEVEL VARIABLE
    let fallbackCheck = null;  
    
// ==================================================
    // INIT FUNCTION
// ==================================================
    function init() {
        try {
            console.log('[ProductsDisplay] Initializing...');
            
            // Listen for ProductsManager ready signal
            window.addEventListener('productsManagerReady', () => {
                console.log('[ProductsDisplay] Received productsManagerReady signal');
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
                   ProductsManager.products && 
                   ProductsManager.products.length > 0) {
                    console.log('[ProductsDisplay] ProductsManager ready, rendering products');
                    renderProducts();
                    setupEventListeners();
                    return true;
                }
                return false;
            };
            
            // Try immediately
            checkProductsManager();
            
            console.log('[ProductsDisplay] Waiting for ProductsManager...');
            
            // Fallback: Check every 100ms for 3 seconds
            let checks = 0;
            fallbackCheck = setInterval(() => {
                checks++;
                if (checkProductsManager()) {
                    clearInterval(fallbackCheck);
                    fallbackCheck = null;
                } else if (checks >= 30) {
                    clearInterval(fallbackCheck);
                    fallbackCheck = null;
                    console.log('[ProductsDisplay] Fallback: No products available');
                    showEmptyState();
                }
            }, 100);
        } catch (error) {
            console.error('[ProductsDisplay] Error in init:', error);
        }
    }
    
// ==================================================
    // RENDER PRODUCTS FUNCTION
// ==================================================
    function renderProducts() {   
        try {
            const container = document.getElementById('products-container');
            if (!container) {
                console.error('[ProductsDisplay] Products container not found');
                return;
            }
            
            console.log('[ProductsDisplay] Rendering products...');
            
            // Get products ONLY from ProductsManager
            let products = [];
            
            if (typeof ProductsManager !== 'undefined' && ProductsManager.getProducts) {
                products = ProductsManager.getProducts({ activeOnly: true });
                console.log('[ProductsDisplay] Loaded from ProductsManager:', products);
                console.log('[ProductsDisplay] Products type:', typeof products);
                console.log('[ProductsDisplay] Is array?', Array.isArray(products));
                console.log('[ProductsDisplay] Products count:', products.length);
            }

            // Show empty state if no products
            if (!Array.isArray(products)) {
                console.error('[ProductsDisplay] Products is not an array!', products);
                showEmptyState();
                return;
            }
            
            if (products.length === 0) {
                console.log('[ProductsDisplay] Products array is empty');
                showEmptyState();
                return;
            }
            
            // Render products
            let html = `
            <section id="products" class="products" aria-labelledby="products-heading">
                <h2 id="products-heading" class="section-title">Glam Collection</h2>
                <div class="product-grid">
            `;
            
            products.forEach(product => {
                // Debug section
                console.log('=== DEBUG FOR PRODUCT: ' + product.name + ' ===');
                console.log('1. Product tags:', product.tags);
                
                const displayId = product.id;
                
                // FIXED: Use updated property names
                const retailPrice = product.retailPrice || 0;
               const currentPrice = product.currentPrice || 0;
               const wholesalePrice = product.wholesalePrice || 0;
                
                const isOnSale = product.isOnSale || product.discountPercent > 0;
                const hasDiscount = product.discountPercent > 0 && retailPrice > currentPrice;
                const discountAmount = hasDiscount ? retailPrice - currentPrice : 0;
                const discountPercentage = product.discountPercent || 
                (hasDiscount ? Math.round((discountAmount / retailPrice) * 100) : 0);
                // Determine badges
                let badges = [];
                if (isOnSale && hasDiscount) badges.push(`-${discountPercentage}%`);
                if (product.tags && product.tags.includes('bestseller')) badges.push('BESTSELLER');
                if (product.tags && product.tags.includes('new')) badges.push('NEW');
                if (product.tags && product.tags.includes('featured')) badges.push('FEATURED');
                
                // Debug info
                console.log('2. Badges array created:', badges);
                console.log('3. Will badges display?', badges.length > 0);
                console.log('4. Price values:', {
                    retailPrice,
                    currentPrice,
                    wholesalePrice,
                    isOnSale,
                    hasDiscount,
                    discountAmount,
                    discountPercentage
                });
                console.log('=== END DEBUG ===');
                
                // HTML generation
html += `
<article class="product-card" data-product-id="${displayId}" ${hasDiscount ? 'data-has-discount="true"' : ''}>
    ${badges.length > 0 ? `
    <div class="product-badges">
        ${badges.map(badge => `
            <div class="product-badge ${badge.includes('%') ? 'badge-discount' : 
                                           badge === 'BESTSELLER' ? 'badge-bestseller' : 
                                           badge === 'NEW' ? 'badge-new' : 'badge-featured'}">
                ${badge}
            </div>
        `).join('')}
    </div>` : ''}
    
    <div class="product-image-container">
        <img src="${product.imageUrl || 'gallery/placeholder.jpg'}" 
             alt="${product.name}" 
             class="product-img"
             width="440" height="440"
             loading="lazy">
    </div>
    
    ${hasDiscount ? `
    <!-- PULSATING SALE BANNER - Add this section -->
    <div class="sale-pulse-banner">
        <span class="sale-text">
            ${discountPercentage > 0 ? `🔥 SALE -${discountPercentage}% OFF` : '🔥 SALE'}
            ${product.saleEndDate ? `
            <span class="countdown-timer" style="
                font-size: 0.85rem !important;
                background: rgba(0,0,0,0.2) !important;
                padding: 2px 6px !important;
                border-radius: 10px !important;
                margin-left: 8px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            ">
            </span>
            ` : ''}
        </span>
    </div>
    ` : ''}
    
    <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">
            ${product.description || 'Premium beauty product'}
        </p>
        
        <!-- SIMPLIFIED PRICING - Remove the inline styles and use clean CSS -->
        <div class="product-pricing">
            ${hasDiscount ? `
            <div class="price-comparison">
                <span class="original-price">R${retailPrice.toFixed(2)}</span>
                <span class="price-arrow">→</span>
                <span class="current-price">R${currentPrice.toFixed(2)}</span>
            </div>
            ` : `
            <span class="price">R${currentPrice.toFixed(2)}</span>
            `}
        </div>
                        
                        <div class="stock-indicator ${product.stock === 0 ? 'stock-out' : 
                                                   product.stock <= 5 ? 'stock-low' : 'stock-ok'}">
                            <i class="fas fa-box"></i> 
                            ${product.stock === 0 ? 'Out of Stock' : 
                              product.stock <= 5 ? `Low Stock: ${product.stock} units` : 
                              `${product.stock} in stock`}
                        </div>
                        
                        ${product.salesCount > 0 ? `
                        <div class="sales-count">
                            <i class="fas fa-chart-line"></i> ${product.salesCount} sold
                        </div>
                        ` : ''}
                        
                        <div class="rating" data-rating="4">
                            ★★★★☆
                        </div>
                    </div>
                    
                    <div class="product-actions">
                        <button class="add-to-cart" 
                                data-product-id="${displayId}"
                                data-product-name="${product.name}"
                                data-product-currentprice="${currentPrice}"
                                data-product-retailprice="${retailPrice}"
                                data-product-wholesaleprice="${wholesalePrice}"
                                data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        
                        <button class="quick-view" data-product-id="${displayId}">
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
            
        } catch (error) {
            console.error('[ProductsDisplay] Error rendering products:', error);
            console.error('[ProductsDisplay] Error stack:', error.stack);
            showEmptyState();
        }
    }

// ==================================================
    // SHOW EMPTY STATE FUNCTION
    // ==================================================
    function showEmptyState() {
        try {
            const container = document.getElementById('products-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="products-empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Available</h3>
                    <p>Add products in the admin panel to get started.</p>
                </div>
            `;
        } catch (error) {
            console.error('[ProductsDisplay] Error showing empty state:', error);
        }
    }
    
    // ==================================================
    // GET PRODUCT BY ID FUNCTION
    // ==================================================
    function getProductById(productId) {
        try {
            if (typeof ProductsManager !== 'undefined' && ProductsManager.getProductById) {
                return ProductsManager.getProductById(productId);
            }
            console.warn('[ProductsDisplay] ProductsManager not available');
            return null;
        } catch (error) {
            console.error('[ProductsDisplay] Error getting product by ID:', error);
            return null;
        }
    }   
    
    // ==================================================
    // SETUP EVENT LISTENERS FUNCTION
    // ==================================================
    function setupEventListeners() {
        try {
            console.log('[ProductsDisplay] Setting up event listeners'); 
            
            document.addEventListener('click', function(e) {
                try {
                    // Add to cart button
                    if (e.target.classList.contains('add-to-cart') || 
                        e.target.closest('.add-to-cart')) {
                        
                        const btn = e.target.classList.contains('add-to-cart') ? 
                                   e.target : e.target.closest('.add-to-cart');
                        
                        const productId = btn.dataset.productId;
                        const productName = btn.dataset.productName;
                        const productCurrentPrice = btn.dataset.productCurrentprice
                        // Create price data object
const priceData = {
    currentPrice: parseFloat(productCurrentPrice),
    retailPrice: parseFloat(btn.dataset.productRetailprice || 0),
    wholesalePrice: parseFloat(btn.dataset.productWholesaleprice || 0)
};

                        const productImg = btn.dataset.productImg;
                        
                        if (productId && typeof BeautyHubCart !== 'undefined') {
                            BeautyHubCart.addToCart(
    productId, 
    productName, 
    priceData, 
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
                } catch (error) {
                    console.error('[ProductsDisplay] Error in event listener:', error);
                }
            });
        } catch (error) {
            console.error('[ProductsDisplay] Error setting up event listeners:', error);
        }
    }
    
    // ==================================================
    // SHOW QUICK VIEW FUNCTION
    // ==================================================
    function showQuickView(productId) {
        try {
            const product = getProductById(productId);
            if (!product) return;
            
            // FIXED: Use updated property names
            const retailPrice = product.retailPrice || 0;
const currentPrice = product.currentPrice || 0;
const wholesalePrice = product.wholesalePrice || 0;
            
            const isOnSale = product.isOnSale || product.discountPercent > 0;
            const hasDiscount = product.discountPercent > 0 && retailPrice > currentPrice;
            const discountAmount = hasDiscount ? retailPrice - currentPrice : 0;
            const discountPercentage = product.discountPercent || 
                                      (hasDiscount ? Math.round((discountAmount / retailPrice) * 100) : 0);
            
            const tags = product.tags || [];
            const category = product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : '';
            const isLowStock = product.stock <= 5;
            const isOutOfStock = product.stock === 0;
            
            // Create or get modal
            let modal = document.getElementById('quick-view-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'quick-view-modal';
                modal.className = 'quick-view-modal';
                document.body.appendChild(modal);
            }
            
            modal.innerHTML = `
                <div class="quick-view-content">
                    <button class="close-quick-view">&times;</button>
                    
                    <div class="quick-view-grid">
                        <div class="quick-view-images">
                            <img src="${product.imageUrl || 'gallery/placeholder.jpg'}" 
                                 alt="${product.name}" 
                                 class="quick-view-main-img">
                            
                            ${product.gallery && product.gallery.length > 0 ? `
                            <div class="quick-view-gallery">
                                ${product.gallery.map((img, index) => `
                                    <img src="${img}" 
                                         alt="${product.name} - View ${index + 1}"
                                         class="gallery-thumb"
                                         data-img-index="${index}">
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="quick-view-details">
                            <div class="quick-view-tags">
                                ${tags.map(tag => `
                                    <span class="product-tag tag-${tag}">
                                        ${tag.toUpperCase()}
                                    </span>
                                `).join('')}
                                
                                ${isOnSale && hasDiscount ? `
                                <span class="product-tag tag-sale">
                                    SALE -${discountPercentage}%
                                </span>
                                ` : ''}
                            </div>
                            
                            <h2 class="quick-view-title">${product.name}</h2>
                            <p class="quick-view-description">
                                ${product.description || 'Premium beauty product'}
                            </p>
                            
                            <div class="quick-view-pricing">
                                ${hasDiscount ? `
                                <div class="discounted-pricing">
                                    <span class="quick-view-retail-price">
                                        R${retailPrice.toFixed(2)}
                                    </span>
                                    <span class="quick-view-current-price">
                                        R${currentPrice.toFixed(2)}
                                    </span>
                                </div>
                                ` : `
                                <div class="regular-pricing">
                                    <span class="quick-view-currentprice">
                                        R${currentPrice.toFixed(2)}
                                    </span>
                                </div>
                                `}
                                
                                <div class="quick-view-stock ${isOutOfStock ? 'stock-out' : 
                                                             isLowStock ? 'stock-low' : 'stock-ok'}">
                                    <i class="fas fa-box"></i> 
                                    ${isOutOfStock ? 'Out of Stock' : 
                                      isLowStock ? `Low Stock: ${product.stock} units` : 
                                      `In Stock: ${product.stock} units`}
                                </div>
                                
                                ${product.salesCount > 0 ? `
                                <div class="quick-view-sales">
                                    <i class="fas fa-chart-line"></i> ${product.salesCount} units sold
                                </div>
                                ` : ''}
                                
                                ${category ? `
                                <div class="quick-view-category">
                                    <i class="fas fa-tag"></i> ${category}
                                </div>
                                ` : ''}
                                
                                ${isOnSale && product.saleEndDate ? `
                                <div class="sale-end-date">
                                    <i class="fas fa-clock"></i> Sale ends: ${new Date(product.saleEndDate).toLocaleDateString()}
                                </div>
                                ` : ''}
                            </div>
                            
                            ${Object.keys(product.specifications || {}).length > 0 ? `
                            <div class="quick-view-specifications">
                                <h3>Specifications</h3>
                                <div class="specifications-list">
                                    ${Object.entries(product.specifications).map(([key, value]) => `
                                        <div class="specification-item">
                                            <span class="spec-key">${key}:</span>
                                            <span class="spec-value">${value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="quick-view-features">
                                <p><i class="fas fa-shipping-fast"></i> Free shipping on orders over R1000</p>
                                <p><i class="fas fa-undo"></i> No return on damaged products</p>
                                <p><i class="fas fa-shield-alt"></i> flexible payment</p>
                            </div>
                            
                            <div class="quick-view-actions">
                                <button class="add-to-cart-quickview" 
                                        data-product-id="${product.id}"
                                        data-product-name="${product.name}"
                                        data-product-currentprice="${currentPrice}"
                                        data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}"
                                        ${isOutOfStock ? 'disabled' : ''}>
                                    <i class="fas fa-shopping-cart"></i>
                                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
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
            const galleryThumbs = modal.querySelectorAll('.gallery-thumb');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
            
if (addToCartBtn && !isOutOfStock && typeof BeautyHubCart !== 'undefined') {
    addToCartBtn.addEventListener('click', () => {
        try {
            // Create price data object with ALL price fields
            const priceData = {
                currentPrice: parseFloat(currentPrice),
                retailPrice: parseFloat(retailPrice || 0),
                wholesalePrice: parseFloat(wholesalePrice || 0)
            };
            
            BeautyHubCart.addToCart(
                product.id,
                product.name,
                priceData,  // Pass the OBJECT, not just currentPrice
                product.imageUrl || 'gallery/placeholder.jpg',
                1
            );
            
            // Show confirmation
            const originalText = addToCartBtn.innerHTML;
            addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
            addToCartBtn.classList.add('added-to-cart');
            
            setTimeout(() => {
                addToCartBtn.innerHTML = originalText;
                addToCartBtn.classList.remove('added-to-cart');
            }, 2000);
        } catch (error) {
            console.error('[ProductsDisplay] Error adding to cart from quick view:', error);
        }
    });
}
            
            // Gallery thumbnail click
            galleryThumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const mainImg = modal.querySelector('.quick-view-main-img');
                    mainImg.src = thumb.src;
                });
            });
        } catch (error) {
            console.error('[ProductsDisplay] Error showing quick view:', error);
        }
    }
    
    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        init,
        getProductById,
        renderProducts,
        getAllProducts: () => {
            try {
                if (typeof ProductsManager !== 'undefined' && 
                    ProductsManager.getProducts) {
                    return ProductsManager.getProducts({ activeOnly: true });
                }
                return [];
            } catch (error) {
                console.error('[ProductsDisplay] Error getting all products:', error);
                return [];
            }
        }
    };
})();
