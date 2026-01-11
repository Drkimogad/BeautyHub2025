// products.js - Products Display (CLEAN VERSION - NO FALLBACK)
const ProductsDisplay = (function() {
    // MODULE-LEVEL VARIABLE
    let fallbackCheck = null;  
    // ==================================================
    // INIT FUNCTION
    // ==================================================
    function init() {
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
    }
    
    // ==================================================
    // RENDER PRODUCTS FUNCTION
    // ==================================================
    function renderProducts() {
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
            console.log('[ProductsDisplay] Loaded from ProductsManager:', products.length, 'products');
        }
        
        // Show empty state if no products
        if (products.length === 0) {
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
            const displayId = product.id;
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
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">
                        ${product.description || 'Premium beauty product'}
                    </p>
                    
<div class="product-pricing">
    ${hasDiscount ? `
    <div class="pricing-with-discount">
        <span class="original-price">
            R${product.originalPrice.toFixed(2)}
        </span>
        <span class="current-price">
            R${product.price.toFixed(2)} 
            ${discountPercentage > 0 ? `<span class="discount-percentage">(-${discountPercentage}%)</span>` : ''}
        </span>
        ${isOnSale && hasDiscount ? `
        <div class="sale-badge">
            SALE
        </div>
        ` : ''}
    </div>
    ` : `
    <span class="price">
        R${product.price.toFixed(2)}
    </span>
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
                            data-product-price="${product.price}"
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
    }
    
    // ==================================================
    // SHOW EMPTY STATE FUNCTION
    // ==================================================
    function showEmptyState() {
        const container = document.getElementById('products-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="products-empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No Products Available</h3>
                <p>Add products in the admin panel to get started.</p>
            </div>
        `;
    }
    
    // ==================================================
    // GET PRODUCT BY ID FUNCTION
    // ==================================================
    function getProductById(productId) {
        if (typeof ProductsManager !== 'undefined' && 
        //    ProductsManager.getProductById &&
        //    ProductsManager.products && 
         //   ProductsManager.products.length > 0) {
          //  return ProductsManager.getProductById(productId);
         ProductsManager.getProductById) {
        // Don't check products.length, let ProductsManager handle it
        return ProductsManager.getProductById(productId);
        }
        console.warn('[ProductsDisplay] ProductsManager not available');
        return null;
    }
    
    // ==================================================
    // SETUP EVENT LISTENERS FUNCTION
    // ==================================================
    function setupEventListeners() {
        console.log('[ProductsDisplay] Setting up event listeners'); 
        
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
    
    // ==================================================
    // SHOW QUICK VIEW FUNCTION
    // ==================================================
    function showQuickView(productId) {
        const product = getProductById(productId);
        if (!product) return;
        
        const isOnSale = product.isOnSale || product.discountPercent > 0;
        const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.price;
        const discountAmount = hasDiscount ? product.originalPrice - product.price : 0;
        const discountPercentage = product.discountPercent || 
                                  (hasDiscount ? Math.round((discountAmount / product.originalPrice) * 100) : 0);
        
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
                                <span class="quick-view-original-price">
                                    R${product.originalPrice.toFixed(2)}
                                </span>
                                <span class="quick-view-current-price">
                                    R${product.price.toFixed(2)}
                                </span>
                            </div>
                            ` : `
                            <div class="regular-pricing">
                                <span class="quick-view-price">
                                    R${product.price.toFixed(2)}
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
                            <p><i class="fas fa-shipping-fast"></i> Free shipping on orders over R500</p>
                            <p><i class="fas fa-undo"></i> 30-day return policy</p>
                            <p><i class="fas fa-shield-alt"></i> Secure payment</p>
                        </div>
                        
                        <div class="quick-view-actions">
                            <button class="add-to-cart-quickview" 
                                    data-product-id="${product.id}"
                                    data-product-name="${product.name}"
                                    data-product-price="${product.price}"
                                    data-product-img="${product.imageUrl || 'gallery/placeholder.jpg'}"
                                    ${isOutOfStock ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i>
                                ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            
                            <button class="wishlist-btn">
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
        const galleryThumbs = modal.querySelectorAll('.gallery-thumb');
        
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
                
                // Show confirmation
                const originalText = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                addToCartBtn.classList.add('added-to-cart');
                
                setTimeout(() => {
                    addToCartBtn.innerHTML = originalText;
                    addToCartBtn.classList.remove('added-to-cart');
                }, 2000);
            });
        }
        
        // Gallery thumbnail click
        galleryThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const mainImg = modal.querySelector('.quick-view-main-img');
                mainImg.src = thumb.src;
            });
        });
    }
    
    // ==================================================
    // PUBLIC API
    // ==================================================
    return {
        init,
        getProductById,
        renderProducts,
        getAllProducts: () => {
            if (typeof ProductsManager !== 'undefined' && 
                ProductsManager.getProducts) {
                return ProductsManager.getProducts({ activeOnly: true });
            }
            return [];
        }
    };
})();
