// productsManager.js - Product CRUD & Management System

const ProductsManager = (function() {
    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_products',
        CATEGORIES: ['perfumes', 'lashes', 'skincare', 'wigs'],
        DEFAULT_IMAGE: 'gallery/placeholder.jpg',
        LOW_STOCK_THRESHOLD: 5
    };
    
    // Product Schema
    const PRODUCT_SCHEMA = {
        id: '',              // PROD-YYYYMMDD-XXXX
        name: '',            // Product name
        description: '',     // Product description
        category: '',        // From CONFIG.CATEGORIES
        price: 0,           // Current price
        originalPrice: 0,    // Original price (for discounts)
        stock: 0,           // Current stock quantity
        imageUrl: '',       // Main product image
        gallery: [],        // Additional images array
        tags: [],           // ['bestseller', 'new', 'featured']
        specifications: {},  // {key: value} pairs
        isActive: true,     // Active/inactive product
        createdAt: '',      // ISO string
        updatedAt: ''       // ISO string
    };
    
    // Initialize
    let products = [];
    
    function init() {
        loadProducts();
        return {
            products,
            getProducts,
            getProductById,
            addProduct,
            updateProduct,
            deleteProduct,
            getProductsByCategory,
            getLowStockProducts,
            updateStock,
            renderProductsAdmin
        };
    }
    
    // Load products from localStorage
    function loadProducts() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                products = JSON.parse(saved) || [];
            } catch (e) {
                products = [];
                console.error('Error loading products:', e);
            }
        }
        
        // Initialize sample products if empty
        if (products.length === 0) {
            initializeSampleProducts();
        }
    }
    
    // Save products to localStorage
    function saveProducts() {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(products));
    }
    
    // Initialize sample products
    function initializeSampleProducts() {
        const sampleProducts = [
            {
                id: generateProductId(),
                name: 'Signature Perfumes',
                description: 'Elegant scents that linger like a memory.',
                category: 'perfumes',
                price: 300.00,
                originalPrice: 300.00,
                stock: 15,
                imageUrl: 'gallery/perfume.jpg',
                gallery: [],
                tags: ['new', 'featured'],
                specifications: {
                    'Size': '50ml',
                    'Fragrance Type': 'Eau de Parfum',
                    'Longevity': '8-10 hours'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateProductId(),
                name: 'Glam Lashes',
                description: 'Dramatic or natural—find your perfect flutter.',
                category: 'lashes',
                price: 49.99,
                originalPrice: 49.99,
                stock: 25,
                imageUrl: 'gallery/lashes.jpg',
                gallery: [],
                tags: ['bestseller'],
                specifications: {
                    'Style': 'Dramatic',
                    'Material': 'Mink',
                    'Reusable': 'Yes (up to 25 uses)'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateProductId(),
                name: 'Radiant Skincare',
                description: 'Glow from within with our nourishing formulas.',
                category: 'skincare',
                price: 99.99,
                originalPrice: 99.99,
                stock: 8,
                imageUrl: 'gallery/skincare.jpg',
                gallery: [],
                tags: ['bestseller'],
                specifications: {
                    'Skin Type': 'All skin types',
                    'Volume': '30ml',
                    'Key Ingredients': 'Vitamin C, Hyaluronic Acid'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateProductId(),
                name: 'Luxury Wigs',
                description: 'Silky, voluminous hair for every mood.',
                category: 'wigs',
                price: 599.99,
                originalPrice: 599.99,
                stock: 3,
                imageUrl: 'gallery/wigs.jpg',
                gallery: [],
                tags: ['new'],
                specifications: {
                    'Length': '24 inches',
                    'Material': 'Human Hair',
                    'Cap Size': 'Average'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        products = sampleProducts;
        saveProducts();
    }
    
    // Generate product ID
    function generateProductId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PROD-${year}${month}${day}-${random}`;
    }
    
    // Get all products (with optional filter)
    function getProducts(filter = {}) {
        let filtered = [...products];
        
        // Filter by category
        if (filter.category && filter.category !== 'all') {
            filtered = filtered.filter(p => p.category === filter.category);
        }
        
        // Filter by stock status
        if (filter.stockStatus === 'low') {
            filtered = filtered.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
        } else if (filter.stockStatus === 'out') {
            filtered = filtered.filter(p => p.stock === 0);
        }
        
        // Filter by active status
        if (filter.activeOnly) {
            filtered = filtered.filter(p => p.isActive);
        }
        
        return filtered;
    }
    
    // Get product by ID
    function getProductById(productId) {
        return products.find(p => p.id === productId);
    }
    
    // Get products by category
    function getProductsByCategory(category) {
        return products.filter(p => p.category === category && p.isActive);
    }
    
    // Get low stock products
    function getLowStockProducts() {
        return products.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
    }
    
    // Add new product
    function addProduct(productData) {
        const newProduct = {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: productData.name.trim(),
            description: productData.description?.trim() || '',
            category: productData.category || CONFIG.CATEGORIES[0],
            price: parseFloat(productData.price) || 0,
            originalPrice: parseFloat(productData.originalPrice) || parseFloat(productData.price) || 0,
            stock: parseInt(productData.stock) || 0,
            imageUrl: productData.imageUrl?.trim() || CONFIG.DEFAULT_IMAGE,
            gallery: productData.gallery || [],
            tags: productData.tags || [],
            specifications: productData.specifications || {},
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        console.log('Product added:', newProduct.id);
        return newProduct;
    }
    
    // Update product
    function updateProduct(productId, updateData) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) return false;
        
        products[index] = {
            ...products[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        saveProducts();
        console.log('Product updated:', productId);
        return true;
    }
    
    // Delete product (soft delete - set inactive)
    function deleteProduct(productId) {
        return updateProduct(productId, { isActive: false });
    }
    
    // Update stock quantity
    function updateStock(productId, quantityChange) {
        const product = getProductById(productId);
        if (!product) return false;
        
        const newStock = product.stock + quantityChange;
        if (newStock < 0) return false;
        
        return updateProduct(productId, { stock: newStock });
    }
    
    // Render products in admin panel
    function renderProductsAdmin(containerId = 'products-tab-content', filter = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const filteredProducts = getProducts(filter);
        
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products" style="
                    text-align: center;
                    color: #666;
                    padding: 3rem 1rem;
                ">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3 style="margin: 0 0 0.5rem 0;">No products found</h3>
                    <p>${filter.category ? 'No products in this category.' : 'Add your first product to get started.'}</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
                gap: 1rem;
            ">
                <h2 style="margin: 0; color: #333;">Products Management</h2>
                
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button id="add-product-btn" class="action-btn" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    ">
                        <i class="fas fa-plus"></i>
                        Add Product
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div style="
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            ">
                <button class="product-filter active" data-filter='{"category":"all"}' style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    All Products <span class="filter-count">(${filteredProducts.length})</span>
                </button>
                
                ${CONFIG.CATEGORIES.map(cat => {
                    const count = products.filter(p => p.category === cat && p.isActive).length;
                    return `
                    <button class="product-filter" data-filter='{"category":"${cat}"}' style="
                        background: white;
                        color: #666;
                        border: 2px solid #e0e0e0;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;
                        text-transform: capitalize;
                    ">
                        ${cat} <span class="filter-count">(${count})</span>
                    </button>
                    `;
                }).join('')}
                
                <button class="product-filter" data-filter='{"stockStatus":"low"}' style="
                    background: white;
                    color: #ff9800;
                    border: 2px solid #ff9800;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                    Low Stock <span class="filter-count">(${getLowStockProducts().length})</span>
                </button>
                
                <button class="product-filter" data-filter='{"stockStatus":"out"}' style="
                    background: white;
                    color: #ff5252;
                    border: 2px solid #ff5252;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-times-circle"></i>
                    Out of Stock <span class="filter-count">(${products.filter(p => p.stock === 0).length})</span>
                </button>
            </div>
            
            <!-- Products Grid -->
            <div id="products-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
                overflow-y: auto;
                padding: 0.5rem;
            ">
        `;
        
        filteredProducts.forEach(product => {
            const isLowStock = product.stock <= CONFIG.LOW_STOCK_THRESHOLD;
            const isOutOfStock = product.stock === 0;
            
            html += `
                <div class="product-admin-card" data-product-id="${product.id}" style="
                    background: white;
                    border: 2px solid ${isOutOfStock ? '#ffebee' : isLowStock ? '#fff8e1' : '#f0f0f0'};
                    border-radius: 12px;
                    padding: 1rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                ">
                    ${!product.isActive ? `
                    <div style="
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        background: #ff5252;
                        color: white;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-size: 0.7rem;
                        font-weight: 600;
                    ">
                        Inactive
                    </div>
                    ` : ''}
                    
                    <div style="
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 1rem;
                    ">
                        <img src="${product.imageUrl}" alt="${product.name}" style="
                            width: 80px;
                            height: 80px;
                            object-fit: cover;
                            border-radius: 8px;
                            border: 1px solid #e0e0e0;
                        ">
                        
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1rem;">
                                ${product.name}
                                <span style="
                                    background: ${isOutOfStock ? '#ff5252' : isLowStock ? '#ff9800' : '#4CAF50'};
                                    color: white;
                                    padding: 0.2rem 0.5rem;
                                    border-radius: 12px;
                                    font-size: 0.7rem;
                                    margin-left: 0.5rem;
                                ">
                                    ${isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                            </h3>
                            
                            <div style="color: #666; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                <span style="text-transform: capitalize;">${product.category}</span>
                            </div>
                            
                            <div style="
                                font-size: 1.25rem;
                                font-weight: 700;
                                color: #e91e63;
                                margin-bottom: 0.5rem;
                            ">
                                R${product.price.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8f9fa;
                        padding: 0.75rem;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                    ">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <div>
                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">Current Stock</div>
                                <div style="font-weight: 600; font-size: 1.1rem; color: ${isOutOfStock ? '#ff5252' : isLowStock ? '#ff9800' : '#333'}">
                                    ${product.stock} units
                                </div>
                            </div>
                            
                            <div style="text-align: right;">
                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">Status</div>
                                <div style="font-weight: 600; color: ${product.isActive ? '#4CAF50' : '#ff5252'}">
                                    ${product.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="edit-product-btn" data-product-id="${product.id}" style="
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            font-size: 0.85rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            flex: 1;
                            justify-content: center;
                        ">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        
                        <button class="adjust-stock-btn" data-product-id="${product.id}" style="
                            background: ${isOutOfStock ? '#4CAF50' : '#ff9800'};
                            color: white;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            font-size: 0.85rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            flex: 1;
                            justify-content: center;
                        ">
                            <i class="fas fa-boxes"></i>
                            ${isOutOfStock ? 'Restock' : 'Adjust Stock'}
                        </button>
                        
                        <button class="toggle-product-btn" data-product-id="${product.id}" data-active="${product.isActive}" style="
                            background: ${product.isActive ? '#ff5252' : '#4CAF50'};
                            color: white;
                            border: none;
                            padding: 0.5rem;
                            border-radius: 6px;
                            font-size: 0.85rem;
                            cursor: pointer;
                            width: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fas ${product.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
        
        container.innerHTML = html;
        setupProductEventListeners();
    }
    
    // Setup event listeners for product actions
    function setupProductEventListeners() {
        // Product filters
        document.querySelectorAll('.product-filter').forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = JSON.parse(this.dataset.filter);
                renderProductsAdmin('products-tab-content', filter);
                
                // Update active state
                document.querySelectorAll('.product-filter').forEach(b => {
                    b.style.background = b === this ? '#667eea' : 'white';
                    b.style.color = b === this ? 'white' : '#666';
                    b.style.border = b === this ? 'none' : '2px solid #e0e0e0';
                });
            });
        });
        
        // Add product button
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showProductForm);
        }
        
        // Edit product buttons
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                showProductForm(productId);
            });
        });
        
        // Adjust stock buttons
        document.querySelectorAll('.adjust-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                showStockAdjustmentForm(productId);
            });
        });
        
        // Toggle active/inactive buttons
        document.querySelectorAll('.toggle-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                const isActive = this.dataset.active === 'true';
                
                if (updateProduct(productId, { isActive: !isActive })) {
                    renderProductsAdmin();
                }
            });
        });
    }
    
    // Show product form (add/edit)
    function showProductForm(productId = null) {
        const product = productId ? getProductById(productId) : null;
        const isEdit = !!product;
        
        // Create or get modal
        let modal = document.getElementById('product-form-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'product-form-modal';
            modal.className = 'product-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1006;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2rem;
                position: relative;
            ">
                <button id="close-product-form" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
                
                <h2 style="margin-top: 0; color: #333;">
                    ${isEdit ? 'Edit Product' : 'Add New Product'}
                </h2>
                
                <form id="product-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                Product Name *
                            </label>
                            <input type="text" 
                                   id="product-name" 
                                   required 
                                   value="${product?.name || ''}"
                                   style="
                                        width: 100%;
                                        padding: 0.75rem;
                                        border: 2px solid #e0e0e0;
                                        border-radius: 8px;
                                        font-size: 1rem;
                                   ">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                Category *
                            </label>
                            <select id="product-category" required style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                font-size: 1rem;
                                background: white;
                            ">
                                ${CONFIG.CATEGORIES.map(cat => `
                                    <option value="${cat}" ${product?.category === cat ? 'selected' : ''}>
                                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Description
                        </label>
                        <textarea id="product-description" rows="3" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 1rem;
                            resize: vertical;
                        ">${product?.description || ''}</textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                Price (R) *
                            </label>
                            <input type="number" 
                                   id="product-price" 
                                   required 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.price || ''}"
                                   style="
                                        width: 100%;
                                        padding: 0.75rem;
                                        border: 2px solid #e0e0e0;
                                        border-radius: 8px;
                                        font-size: 1rem;
                                   ">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                Original Price (R)
                            </label>
                            <input type="number" 
                                   id="product-original-price" 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.originalPrice || ''}"
                                   style="
                                        width: 100%;
                                        padding: 0.75rem;
                                        border: 2px solid #e0e0e0;
                                        border-radius: 8px;
                                        font-size: 1rem;
                                   ">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                Stock Quantity *
                            </label>
                            <input type="number" 
                                   id="product-stock" 
                                   required 
                                   min="0"
                                   value="${product?.stock || ''}"
                                   style="
                                        width: 100%;
                                        padding: 0.75rem;
                                        border: 2px solid #e0e0e0;
                                        border-radius: 8px;
                                        font-size: 1rem;
                                   ">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Image URL
                        </label>
                        <input type="text" 
                               id="product-image-url" 
                               value="${product?.imageUrl || ''}"
                               placeholder="e.g., gallery/product.jpg"
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                               ">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Tags (comma separated)
                        </label>
                        <input type="text" 
                               id="product-tags" 
                               value="${product?.tags?.join(', ') || ''}"
                               placeholder="e.g., bestseller, new, featured"
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                               ">
                    </div>
                    
                    <div id="product-form-error" style="
                        background: #ffebee;
                        color: #d32f2f;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1.5rem;
                        display: none;
                    "></div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancel-product-form" style="
                            background: white;
                            color: #666;
                            border: 2px solid #e0e0e0;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            Cancel
                        </button>
                        
                        <button type="submit" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            ${isEdit ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup form submission
        const form = document.getElementById('product-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProductFormSubmit(productId);
        });
        
        // Close buttons
        document.getElementById('close-product-form').onclick = closeProductForm;
        document.getElementById('cancel-product-form').onclick = closeProductForm;
    }
    
    // Handle product form submission
    function handleProductFormSubmit(productId = null) {
        const isEdit = !!productId;
        
        // Get form data
        const formData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value),
            originalPrice: parseFloat(document.getElementById('product-original-price').value) || 
                         parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            imageUrl: document.getElementById('product-image-url').value || CONFIG.DEFAULT_IMAGE,
            tags: document.getElementById('product-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
        };
        
        // Validate
        const errors = [];
        if (!formData.name.trim()) errors.push('Product name is required');
        if (isNaN(formData.price) || formData.price < 0) errors.push('Valid price is required');
        if (isNaN(formData.stock) || formData.stock < 0) errors.push('Valid stock quantity is required');
        
        if (errors.length > 0) {
            const errorDiv = document.getElementById('product-form-error');
            errorDiv.innerHTML = errors.join('<br>');
            errorDiv.style.display = 'block';
            return;
        }
        
        // Save product
        if (isEdit) {
            if (updateProduct(productId, formData)) {
                closeProductForm();
                renderProductsAdmin();
            }
        } else {
            if (addProduct(formData)) {
                closeProductForm();
                renderProductsAdmin();
            }
        }
    }
    
    // Show stock adjustment form
    function showStockAdjustmentForm(productId) {
        const product = getProductById(productId);
        if (!product) return;
        
        // Create or get modal
        let modal = document.getElementById('stock-adjustment-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'stock-adjustment-modal';
            modal.className = 'stock-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1006;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 400px;
                padding: 2rem;
                position: relative;
            ">
                <button id="close-stock-modal" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
                
                <h2 style="margin-top: 0; color: #333;">
                    Adjust Stock: ${product.name}
                </h2>
                
                <div style="
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    text-align: center;
                ">
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">
                        Current Stock
                    </div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #e91e63;">
                        ${product.stock}
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                        units available
                    </div>
                </div>
                
                <form id="stock-adjustment-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Adjustment Type
                        </label>
                        <div style="display: flex; gap: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="adjustment-type" value="add" checked>
                                Add Stock
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="adjustment-type" value="subtract">
                                Remove Stock
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="adjustment-type" value="set">
                                Set Exact Quantity
                            </label>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Quantity
                        </label>
                        <input type="number" 
                               id="adjustment-quantity" 
                               required 
                               min="1"
                               value="1"
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                               ">
                    </div>
                    
                    <div id="stock-form-error" style="
                        background: #ffebee;
                        color: #d32f2f;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1.5rem;
                        display: none;
                    "></div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancel-stock-adjustment" style="
                            background: white;
                            color: #666;
                            border: 2px solid #e0e0e0;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            Cancel
                        </button>
                        
                        <button type="submit" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            Update Stock
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup form submission
        const form = document.getElementById('stock-adjustment-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleStockAdjustment(productId);
        });
        
        // Close buttons
        document.getElementById('close-stock-modal').onclick = closeStockModal;
        document.getElementById('cancel-stock-adjustment').onclick = closeStockModal;
    }
    
    // Handle stock adjustment
    function handleStockAdjustment(productId) {
        const product = getProductById(productId);
        if (!product) return;
        
        const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
        const quantity = parseInt(document.getElementById('adjustment-quantity').value);
        
        // Validate
        const errors = [];
        if (isNaN(quantity) || quantity < 1) {
            errors.push('Valid quantity is required');
        }
        
        if (adjustmentType === 'subtract' && quantity > product.stock) {
            errors.push(`Cannot remove ${quantity} units. Only ${product.stock} available.`);
        }
        
        if (adjustmentType === 'set' && quantity < 0) {
            errors.push('Stock cannot be negative');
        }
        
        if (errors.length > 0) {
            const errorDiv = document.getElementById('stock-form-error');
            errorDiv.innerHTML = errors.join('<br>');
            errorDiv.style.display = 'block';
            return;
        }
        
        // Calculate new stock
        let newStock;
        switch (adjustmentType) {
            case 'add':
                newStock = product.stock + quantity;
                break;
            case 'subtract':
                newStock = product.stock - quantity;
                break;
            case 'set':
                newStock = quantity;
                break;
        }
        
        // Update product
        if (updateProduct(productId, { stock: newStock })) {
            closeStockModal();
            renderProductsAdmin();
        }
    }
    
    // Close product form modal
    function closeProductForm() {
        const modal = document.getElementById('product-form-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // Close stock modal
    function closeStockModal() {
        const modal = document.getElementById('stock-adjustment-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // Public API
    return {
        init,
        products,
        getProducts,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductsByCategory,
        getLowStockProducts,
        updateStock,
        renderProductsAdmin,
        showProductForm,
        showStockAdjustmentForm
    };
})();
