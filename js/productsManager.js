// productsManager.js - Product CRUD & Management System WITH FIRESTORE
const ProductsManager = (function() {
    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_products',
        CACHE_KEY: 'beautyhub_products_cache',
        CACHE_DURATION: 60 * 60 * 1000, // 1 hour
        CATEGORIES: ['perfumes', 'lashes', 'skincare', 'wigs'],
        DEFAULT_IMAGE: 'gallery/placeholder.jpg',
        LOW_STOCK_THRESHOLD: 5,
        // NEW: Firestore settings
        USE_FIRESTORE: true, // Set to false to disable Firestore
        FIRESTORE_COLLECTION: 'products',
        FIREBASE_READY: () => {
            return typeof firebase !== 'undefined' && 
                   firebase.apps && 
                   firebase.apps.length > 0 &&
                   firebase.firestore;
        }
    };
    
    // Product Schema (Enhanced)
    const PRODUCT_SCHEMA = {
        id: '',              // PROD-YYYYMMDD-XXXX
        name: '',            // Product name
        description: '',     // Product description
        category: '',        // From CONFIG.CATEGORIES
        originalPrice: 0,    // Original price (for discounts)
        discountPercent: 0,    // 0-100 percentage discount
        price: 0,           // Current price
        isOnSale: false,       // Flag for UI badges
        saleEndDate: "",       // When sale ends (ISO string)
        stock: 0,           // Current stock quantity
        imageUrl: '',       // Main product image
        gallery: [],        // Additional images array
        tags: [],           // ['bestseller', 'new', 'featured']
        specifications: {},  // {key: value} pairs
        isActive: true,     // Active/inactive product
        createdAt: '',      // ISO string
        updatedAt: '',      // ISO string
        salesCount: 0       // Total units sold - NEW
    };
    
    // Initialize
    let products = [];
    
    function init() {
        console.log('[ProductsManager] Initializing with Firestore:', CONFIG.USE_FIRESTORE);
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
            renderProductsAdmin,
            showProductForm,
            showStockAdjustmentForm,
            setupProductEventListeners,
            invalidateCache
        };
    }
    
    // ============================================
    // FIRESTORE FUNCTIONS
    // ============================================
    
    // Load products from Firestore
    async function loadProductsFromFirestore() {
        if (!CONFIG.FIREBASE_READY()) {
            console.log('[ProductsManager] Firebase not ready, skipping Firestore');
            return null;
        }
        
        try {
            console.log('[ProductsManager] Loading from Firestore...');
            const db = firebase.firestore();
            const snapshot = await db.collection(CONFIG.FIRESTORE_COLLECTION).get();
            
            const firestoreProducts = [];
            snapshot.forEach(doc => {
                firestoreProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`[ProductsManager] Firestore loaded: ${firestoreProducts.length} products`);
            // ADD THIS CRITICAL LINE:
            products = firestoreProducts; // <-- THIS IS MISSING
            return firestoreProducts;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore load error:', error);
            return null;
        }
    }
    
    // Save product to Firestore
    async function saveProductToFirestore(product) {
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(product.id);
            
            await productRef.set(product);
            console.log(`[ProductsManager] Saved to Firestore: ${product.id}`);
            return true;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore save error:', error);
            return false;
        }
    }
    
    // Update product in Firestore
    async function updateProductInFirestore(productId, updateData) {
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(productId);
            
            await productRef.update({
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`[ProductsManager] Updated in Firestore: ${productId}`);
            return true;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore update error:', error);
            return false;
        }
    }
    
    // Delete product from Firestore
    async function deleteProductFromFirestore(productId) {
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(productId);
            
            await productRef.update({
                isActive: false,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`[ProductsManager] Soft-deleted in Firestore: ${productId}`);
            return true;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore delete error:', error);
            return false;
        }
    }
    
    // ============================================
    // CORE PRODUCT FUNCTIONS (UPDATED)
    // ============================================
    
    // Load products with Firestore priority
    async function loadProducts() {
        console.log('[ProductsManager] Loading products...');
        
        // 1. Try Firestore first (if enabled)
        if (CONFIG.USE_FIRESTORE) {
            const firestoreProducts = await loadProductsFromFirestore();
            if (firestoreProducts && firestoreProducts.length > 0) {
                products = firestoreProducts; // <-- THIS MUST EXIST
                saveProductsToCache();
                saveProductsToLocalStorage(); // Keep local backup
                console.log('[ProductsManager] Primary: Loaded from Firestore');
                console.log('[ProductsManager] Dispatching productsManagerReady event');
             window.dispatchEvent(new CustomEvent('productsManagerReady'));
              return;
            }
        }
        
        // 2. Try cache (if Firestore failed or disabled)
        const cached = loadProductsFromCache();
        if (cached && cached.products && cached.products.length > 0) {
            products = cached.products;
            console.log('[ProductsManager] Fallback: Loaded from cache');
            return;
        }
        
        // 3. Fallback to localStorage
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                products = JSON.parse(saved) || [];
                console.log('[ProductsManager] Fallback: Loaded from localStorage');
            } catch (e) {
                products = [];
                console.error('[ProductsManager] Error loading products:', e);
            }
        }
        
        // 4. Initialize sample products if empty
        if (products.length === 0) {
            console.log('[ProductsManager] Initializing sample products');
            initializeSampleProducts();
        }
    }
    
    // Save products to localStorage (backup)
    function saveProductsToLocalStorage() {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(products));
    }
    
    // Cache management functions (keep existing)
    function loadProductsFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            // Check if cache is expired
            if (now - cacheData.timestamp > CONFIG.CACHE_DURATION) {
                console.log('[ProductsManager] Cache expired');
                localStorage.removeItem(CONFIG.CACHE_KEY);
                return null;
            }
            
            return cacheData;
        } catch (error) {
            console.error('[ProductsManager] Cache load error:', error);
            localStorage.removeItem(CONFIG.CACHE_KEY);
            return null;
        }
    }
    
    function saveProductsToCache() {
        try {
            const cacheData = {
                products: products,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
            console.log('[ProductsManager] Saved to cache');
        } catch (error) {
            console.error('[ProductsManager] Cache save error:', error);
        }
    }
    
    function saveProducts() {
        saveProductsToLocalStorage();
        saveProductsToCache();
        console.log('[ProductsManager] Products saved to local storage and cache');
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('productsUpdated'));
    }
    
    function invalidateCache() {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        console.log('[ProductsManager] Cache invalidated');
    }
    
    // Initialize sample products (keep existing, but add new fields)
function initializeSampleProducts() {
    const sampleProducts = [
        {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: 'Signature Perfumes',
            description: 'Elegant scents that linger like a memory.',
            category: 'perfumes',
            originalPrice: 350.00,  // Added original price
            discountPercent: 14,    // Added discount percent (~14% off)
            price: 300.00,
            isOnSale: true,          // Added sale flag
            saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            stock: 15,
            imageUrl: 'gallery/perfumes.jpg',
            gallery: [],
            tags: ['new', 'featured', 'bestseller'], // Added bestseller
            specifications: {
                'Size': '50ml',
                'Fragrance Type': 'Eau de Parfum',
                'Longevity': '8-10 hours'
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            salesCount: 25           // Added sales count
        },
        {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: 'Glam Lashes',
            description: 'Dramatic or natural—find your perfect flutter.',
            category: 'lashes',
            originalPrice: 59.99,    // Added original price
            discountPercent: 17,     // Added discount percent (~17% off)
            price: 49.99,
            isOnSale: true,          // Added sale flag
            saleEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
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
            updatedAt: new Date().toISOString(),
            salesCount: 42           // Added sales count
        },
        {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: 'Radiant Skincare',
            description: 'Glow from within with our nourishing formulas.',
            category: 'skincare',
            originalPrice: 99.99,    // No discount - same as price
            discountPercent: 0,      // No discount
            price: 99.99,
            isOnSale: false,         // Not on sale
            saleEndDate: "",         // Empty string
            stock: 8,
            imageUrl: 'gallery/skincare.jpg',
            gallery: [],
            tags: ['bestseller', 'featured'],
            specifications: {
                'Skin Type': 'All skin types',
                'Volume': '30ml',
                'Key Ingredients': 'Vitamin C, Hyaluronic Acid'
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            salesCount: 18           // Added sales count
        },
        {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: 'Luxury Wigs',
            description: 'Silky, voluminous hair for every mood.',
            category: 'wigs',
            originalPrice: 699.99,   // Added original price
            discountPercent: 14,     // Added discount percent (~14% off)
            price: 599.99,
            isOnSale: true,          // Added sale flag
            saleEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
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
            updatedAt: new Date().toISOString(),
            salesCount: 7            // Added sales count
        }
    ];
    
    products = sampleProducts;
    saveProducts();
    
    // Also save to Firestore if enabled
    if (CONFIG.USE_FIRESTORE) {
        sampleProducts.forEach(product => {
            saveProductToFirestore(product);
        });
    }
}
    
    // ============================================
    // CRUD OPERATIONS (UPDATED FOR FIRESTORE)
    // ============================================
    
    // Add new product (to both Firestore and local)
async function addProduct(productData) {
    // Calculate price if discount is provided
    const originalPrice = parseFloat(productData.originalPrice) || parseFloat(productData.price) || 0;
    const discountPercent = parseFloat(productData.discountPercent) || 0;
    const calculatedPrice = discountPercent > 0 
        ? calculateDiscountedPrice(originalPrice, discountPercent)
        : parseFloat(productData.price) || originalPrice;
    
    const newProduct = {
        ...PRODUCT_SCHEMA,
        id: generateProductId(),
        name: productData.name.trim(),
        description: productData.description?.trim() || '',
        category: productData.category || CONFIG.CATEGORIES[0],
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        price: calculatedPrice,
        isOnSale: Boolean(productData.isOnSale) || (discountPercent > 0),
        saleEndDate: productData.saleEndDate || "",
        stock: parseInt(productData.stock) || 0,
        imageUrl: productData.imageUrl?.trim() || CONFIG.DEFAULT_IMAGE,
        gallery: productData.gallery || [],
        tags: productData.tags || [],
        specifications: productData.specifications || {},
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        salesCount: parseInt(productData.salesCount) || 0
    };
    
    // 1. Save to Firestore (if enabled)
    let firestoreSuccess = true;
    if (CONFIG.USE_FIRESTORE) {
        firestoreSuccess = await saveProductToFirestore(newProduct);
    }
    
    // 2. Save to local (always)
    products.push(newProduct);
    saveProducts();
    
    console.log('[ProductsManager] Product added:', {
        id: newProduct.id,
        price: newProduct.price,
        discount: `${newProduct.discountPercent}%`,
        firestore: firestoreSuccess ? 'success' : 'failed',
        local: 'success'
    });
    
    return newProduct;
}
    
    // Update product (in both Firestore and local)
async function updateProduct(productId, updateData) {
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return false;
    
    // Calculate price if discount or original price is being updated
    let updatedPrice = updateData.price;
    const originalPrice = updateData.originalPrice !== undefined 
        ? parseFloat(updateData.originalPrice) 
        : products[index].originalPrice;
    const discountPercent = updateData.discountPercent !== undefined 
        ? parseFloat(updateData.discountPercent) 
        : products[index].discountPercent;
    
    // Recalculate price if discount or original price changed
    if (updateData.discountPercent !== undefined || updateData.originalPrice !== undefined) {
        updatedPrice = calculateDiscountedPrice(originalPrice, discountPercent);
    }
    
    const updatedProduct = {
        ...products[index],
        ...updateData,
        price: updatedPrice !== undefined ? updatedPrice : products[index].price,
        isOnSale: updateData.isOnSale !== undefined 
            ? updateData.isOnSale 
            : (discountPercent > 0) || products[index].isOnSale,
        updatedAt: new Date().toISOString()
    };
    
    // 1. Update Firestore (if enabled)
    let firestoreSuccess = true;
    if (CONFIG.USE_FIRESTORE) {
        firestoreSuccess = await updateProductInFirestore(productId, updateData);
    }
    
    // 2. Update local (always)
    products[index] = updatedProduct;
    saveProducts();
    
    console.log('[ProductsManager] Product updated:', {
        id: productId,
        price: updatedProduct.price,
        discount: `${updatedProduct.discountPercent}%`,
        firestore: firestoreSuccess ? 'success' : 'failed',
        local: 'success'
    });
    
    return true;
}
    
    // Delete product (soft delete in both)
    async function deleteProduct(productId) {
        const updateData = { 
            isActive: false,
            updatedAt: new Date().toISOString()
        };
        
        // 1. Firestore soft delete
        let firestoreSuccess = true;
        if (CONFIG.USE_FIRESTORE) {
            firestoreSuccess = await deleteProductFromFirestore(productId);
        }
        
        // 2. Local soft delete
        const localSuccess = updateProduct(productId, updateData);
        
        console.log('[ProductsManager] Product deleted:', {
            id: productId,
            firestore: firestoreSuccess ? 'success' : 'failed',
            local: localSuccess ? 'success' : 'failed'
        });
        
        return firestoreSuccess && localSuccess;
    }
    
    // Update stock (with Firestore sync)
    async function updateStock(productId, quantityChange) {
        const product = getProductById(productId);
        if (!product) return false;
        
        const newStock = product.stock + quantityChange;
        if (newStock < 0) return false;
        
        const updateData = { 
            stock: newStock,
            updatedAt: new Date().toISOString()
        };
        
        if (quantityChange > 0) {
            updateData.lastRestock = new Date().toISOString();
        }
        
        return await updateProduct(productId, updateData);
    }
    
    // ============================================
    // QUERY FUNCTIONS (UNCHANGED - use local cache)
    // ============================================
    
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
    
    // Generate product ID
    function generateProductId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PROD-${year}${month}${day}-${random}`;
    }

//====================================
   // ADD THIS HELPER FUNCTION
//========================================
// Calculate price with discount
function calculateDiscountedPrice(originalPrice, discountPercent) {
    if (!originalPrice || originalPrice <= 0) return 0;
    const discount = originalPrice * (discountPercent / 100);
    return Math.max(0, originalPrice - discount);
}
    
    // ============================================
    // UI FUNCTIONS FROM ORIGINAL CODE
    // ============================================
    
    // Render products in admin panel
    function renderProductsAdmin(containerId = 'products-tab-content', filter = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const filteredProducts = getProducts(filter); 
        
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
        <button class="product-filter ${filter.category === 'all' || (!filter.category && !filter.stockStatus) ? 'active' : ''}" data-filter='{"category":"all"}' style="
            background: ${filter.category === 'all' || (!filter.category && !filter.stockStatus) ? '#667eea' : 'white'};
            color: ${filter.category === 'all' || (!filter.category && !filter.stockStatus) ? 'white' : '#666'};
            border: ${filter.category === 'all' || (!filter.category && !filter.stockStatus) ? 'none' : '2px solid #e0e0e0'};
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
        ">
            All Products <span class="filter-count">(${getProducts({category: 'all'}).length})</span>
        </button>
        
        ${CONFIG.CATEGORIES.map(cat => {
            const count = products.filter(p => p.category === cat && p.isActive).length;
            const isActive = filter.category === cat;
            return `
            <button class="product-filter ${isActive ? 'active' : ''}" data-filter='{"category":"${cat}"}' style="
                background: ${isActive ? '#667eea' : 'white'};
                color: ${isActive ? 'white' : '#666'};
                border: ${isActive ? 'none' : '2px solid #e0e0e0'};
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
        
        <button class="product-filter ${filter.stockStatus === 'low' ? 'active' : ''}" data-filter='{"stockStatus":"low"}' style="
            background: ${filter.stockStatus === 'low' ? '#ff9800' : 'white'};
            color: ${filter.stockStatus === 'low' ? 'white' : '#ff9800'};
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
        
        <button class="product-filter ${filter.stockStatus === 'out' ? 'active' : ''}" data-filter='{"stockStatus":"out"}' style="
            background: ${filter.stockStatus === 'out' ? '#ff5252' : 'white'};
            color: ${filter.stockStatus === 'out' ? 'white' : '#ff5252'};
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
        min-height: 200px;
    ">
`;

if (filteredProducts.length === 0) {
    html += `
        <div style="
            grid-column: 1 / -1;
            text-align: center;
            color: #666;
            padding: 3rem 1rem;
        ">
            <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
            <h3 style="margin: 0 0 0.5rem 0;">No products found</h3>
            <p>${filter.category ? 'No products in this category.' : filter.stockStatus === 'low' ? 'No low stock products.' : filter.stockStatus === 'out' ? 'No out of stock products.' : 'Add your first product to get started.'}</p>
        </div>
    `;
} else {
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
}

html += `
    </div>
`;

container.innerHTML = html;
setupProductEventListeners();
    }
    
    // Setup event listeners for product actions
    function setupProductEventListeners() {
        console.log('[ProductsManager] Setting up product event listeners');
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
            addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showProductForm(null);
            });
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
                    FROM HERE***********************************************
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
               value="${product?.originalPrice || product?.price || ''}"
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

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Discount (%)
        </label>
        <input type="number" 
               id="product-discount" 
               min="0" 
               max="100" 
               step="0.01"
               value="${product?.discountPercent || 0}"
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
            Sale End Date
        </label>
        <input type="datetime-local" 
               id="product-sale-end"
               value="${product?.saleEndDate ? new Date(product.saleEndDate).toISOString().slice(0, 16) : ''}"
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
            Total Sales
        </label>
        <input type="number" 
               id="product-sales-count" 
               min="0"
               value="${product?.salesCount || 0}"
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
    <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
        <input type="checkbox" 
               id="product-is-on-sale" 
               ${product?.isOnSale ? 'checked' : ''}
               style="transform: scale(1.2);">
        Mark as On Sale
    </label>
</div>
                    UNTILL HERE*****************************************
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
        form.addEventListener('submit', (function(savedProductId) {
            return function(e) {
                e.preventDefault();
                handleProductFormSubmit(savedProductId);
                return false;
            };
        })(productId));
        
        // Close buttons
        document.getElementById('close-product-form').onclick = closeProductForm;
        document.getElementById('cancel-product-form').onclick = closeProductForm;
    }
    
    // Handle product form submission
function handleProductFormSubmit(productId = null) {
    console.log('[ProductsManager] Handling product form submit:', productId);
    
    // Get form data
    const originalPrice = parseFloat(document.getElementById('product-original-price').value) || 
                         parseFloat(document.getElementById('product-price').value);
    const discountPercent = parseFloat(document.getElementById('product-discount').value) || 0;
    const calculatedPrice = calculateDiscountedPrice(originalPrice, discountPercent);
    
    const formData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        price: calculatedPrice,
        isOnSale: document.getElementById('product-is-on-sale').checked || (discountPercent > 0),
        saleEndDate: document.getElementById('product-sale-end').value || "",
        stock: parseInt(document.getElementById('product-stock').value),
        imageUrl: document.getElementById('product-image-url').value || CONFIG.DEFAULT_IMAGE,
        tags: document.getElementById('product-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
        salesCount: parseInt(document.getElementById('product-sales-count').value) || 0,
        gallery: [],
        specifications: {},
        isActive: true
    };
    
    // Validate
    const errors = [];
    if (!formData.name.trim()) errors.push('Product name is required');
    if (isNaN(formData.price) || formData.price < 0) errors.push('Valid price is required');
    if (isNaN(formData.stock) || formData.stock < 0) errors.push('Valid stock quantity is required');
    if (formData.discountPercent < 0 || formData.discountPercent > 100) errors.push('Discount must be between 0-100%');
    if (formData.saleEndDate && !isValidDate(formData.saleEndDate)) errors.push('Invalid sale end date');
    
    if (errors.length > 0) {
        const errorDiv = document.getElementById('product-form-error');
        errorDiv.innerHTML = errors.join('<br>');
        errorDiv.style.display = 'block';
        return;
    }
    
    // Save product
    if (productId) {
        console.log('[ProductsManager] Updating product:', productId);
        if (updateProduct(productId, formData)) {
            console.log('[ProductsManager] Update successful');
            closeProductForm();
            renderProductsAdmin();
        } else {
            console.log('[ProductsManager] Update failed');
        }
    } else {
        console.log('[ProductsManager] Adding new product');
        if (addProduct(formData)) {
            console.log('[ProductsManager] Add successful');
            closeProductForm();
            renderProductsAdmin();
        } else {
            console.log('[ProductsManager] Add failed');
        }
    }
}

// Add this helper function for date validation
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
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
        showStockAdjustmentForm,
        setupProductEventListeners,
        invalidateCache
    };
})();
