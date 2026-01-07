// products.js - Products management
const ProductsManager = (function() {
    // Products data
    const products = [
        {
            id: "p001",
            name: "Signature Perfumes",
            description: "Elegant scents that linger like a memory.",
            price: 300,
            category: "perfumes",
            stock: 15,
            imageUrl: "https://drkimogad.github.io/BeautyHub2025/gallery/perfumes.jpg",
            badge: "NEW"
        },
        {
            id: "p002",
            name: "Glam Lashes",
            description: "Dramatic or natural—find your perfect flutter.",
            price: 49.99,
            category: "lashes",
            stock: 42,
            imageUrl: "https://drkimogad.github.io/BeautyHub2025/gallery/lashes.jpg",
            badge: null
        },
        {
            id: "p003",
            name: "Radiant Skincare",
            description: "Glow from within with our nourishing formulas.",
            price: 99.99,
            category: "skincare",
            stock: 28,
            imageUrl: "https://drkimogad.github.io/BeautyHub2025/gallery/skincare.jpg",
            badge: "BESTSELLER"
        },
        {
            id: "p004",
            name: "Luxury Wigs",
            description: "Silky, voluminous hair for every mood.",
            price: 599.99,
            category: "wigs",
            stock: 12,
            imageUrl: "https://drkimogad.github.io/BeautyHub2025/gallery/wigs.jpg",
            badge: null
        }
    ];
    
    // Initialize products
    function init() {
        renderProducts();
        setupEventListeners();
    }
    
    // Render products to page
    function renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) {
            console.error('Products container not found');
            return;
        }
        
        let html = `
        <section id="products" class="products" aria-labelledby="products-heading">
            <h2 id="products-heading" class="section-title">Glam Collection</h2>
            <div class="product-grid">
        `;
        
        products.forEach(product => {
            html += `
            <article class="product-card" data-product-id="${product.id}">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <img src="${product.imageUrl}" 
                     alt="${product.name}" 
                     class="product-img"
                     width="440" height="440"
                     loading="lazy">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <span class="price">From R${product.price.toFixed(2)}</span>
                    <div class="rating" data-rating="4">★★★★☆</div>
                </div>
                <button class="add-to-cart" 
                        data-product-id="${product.id}"
                        data-product-name="${product.name}"
                        data-product-price="${product.price}"
                        data-product-img="${product.imageUrl}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="quick-view" 
                        data-product-id="${product.id}">
                    Quick View
                </button>
            </article>`;
        });
        
        html += `
            </div>
        </section>`;
        
        container.innerHTML = html;
    }
    
    // Get product by ID
    function getProductById(productId) {
        return products.find(p => p.id === productId);
    }
    
    // Setup event listeners
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
    
    // Show quick view modal
    function showQuickView(productId) {
        const product = getProductById(productId);
        if (!product) return;
        
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
                        <img src="${product.imageUrl}" 
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
                        <p style="color: #666; margin-bottom: 1.5rem;">${product.description}</p>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 2rem; font-weight: bold; color: #e91e63;">
                                R${product.price.toFixed(2)}
                            </div>
                            <div style="color: #4caf50; margin-top: 0.5rem;">
                                <i class="fas fa-check"></i> In stock: ${product.stock} units
                            </div>
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
        const addToCartBtn = modal.querySelector('.add-to-cart-quick');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }        
    }
    
    // Public API
    return {
        init,
        getProductById,
        getAllProducts: () => [...products]
    };
})();

// Auto-initialize
//if (document.readyState === 'loading') {
//    document.addEventListener('DOMContentLoaded', () => ProductsManager.init());
//} else {
//    ProductsManager.init();
// }
