// productsManager.js - Product CRUD & Management System WITH FIRESTORE
const ProductsManager = (function() {
    console.log('[ProductsManager] Initializing Products Manager module');
    
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
    
    console.log('[ProductsManager] Configuration loaded:', {
        useFirestore: CONFIG.USE_FIRESTORE,
        categories: CONFIG.CATEGORIES,
        lowStockThreshold: CONFIG.LOW_STOCK_THRESHOLD
    });
    
    // Product Schema (Enhanced)
    const PRODUCT_SCHEMA = {
        id: '',              // PROD-YYYYMMDD-XXXX
        name: '',            // Product name
        description: '',     // Product description
        category: '',        // From CONFIG.CATEGORIES
        wholesalePrice: 0,       // Your cost (what you pay) - NEW
        retailPrice: 0,          // Standard selling price - RENAME from originalPrice
        currentPrice: 0,         // Actual selling price - RENAME from price
        discountedPercent: 0,    // 0-100 percentage discount (price in current setup)
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
    
    console.log('[ProductsManager] Product schema defined');
    
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
        console.log('[ProductsManager] Starting Firestore load process');
        
        if (!CONFIG.FIREBASE_READY()) {
            console.log('[ProductsManager] Firebase not ready, skipping Firestore');
            return null;
        }
        
        try {
            console.log('[ProductsManager] Loading from Firestore...');
            const db = firebase.firestore();
            console.log('[ProductsManager] Firestore database reference obtained');
            
            const snapshot = await db.collection(CONFIG.FIRESTORE_COLLECTION).get();
            console.log('[ProductsManager] Firestore query completed, documents:', snapshot.size);
            
            const firestoreProducts = [];
            snapshot.forEach(doc => {
                console.log('[ProductsManager] Processing document:', doc.id);
                firestoreProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`[ProductsManager] Firestore loaded: ${firestoreProducts.length} products`);
            // Ensure it's always an array before assigning
              if (Array.isArray(firestoreProducts)) {
             // DON'T update products array here - let the caller decide
             // products = firestoreProducts; // <-- REMOVE THIS LINE
                console.log('[ProductsManager] Products array updated from Firestore');
                  } else {
                   products = [];
                     console.warn('[ProductsManager] Firestore returned non-array, resetting products');
               }
        return firestoreProducts; // Just return the data
            
        } catch (error) {
            console.error('[ProductsManager] Firestore load error:', error);
            return null;
        }
    }
    
    // Save product to Firestore
    async function saveProductToFirestore(product) {
        console.log('[ProductsManager] Attempting to save product to Firestore:', product.id);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(product.id);
            
            console.log('[ProductsManager] Setting document in Firestore');
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
        console.log('[ProductsManager] Attempting to update product in Firestore:', productId);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(productId);
            
            const updatePayload = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            console.log('[ProductsManager] Updating Firestore document with:', updatePayload);
            await productRef.update(updatePayload);
            
            console.log(`[ProductsManager] Updated in Firestore: ${productId}`);
            return true;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore update error:', error);
            return false;
        }
    }
    

// Permanently delete product from Firestore
async function permanentlyDeleteFromFirestore(productId) {
    console.log('[ProductsManager] Attempting permanent delete from Firestore:', productId);
    
    if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
        console.log('[ProductsManager] Firestore disabled or not ready');
        return false;
    }
    
    try {
        const db = firebase.firestore();
        const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(productId);
        
        console.log('[ProductsManager] Permanently deleting from Firestore');
        await productRef.delete();
        
        console.log(`[ProductsManager] Permanently deleted from Firestore: ${productId}`);
        return true;
        
    } catch (error) {
        console.error('[ProductsManager] Firestore permanent delete error:', error);
        return false;
    }
}
    
    // ============================================
    // CORE PRODUCT FUNCTIONS (UPDATED)
    // ============================================
async function loadProducts() {
    console.log('[ProductsManager] Starting product loading process');
    
    // 1. Try cache FIRST (with 1-hour expiry)
    console.log('[ProductsManager] Checking cache first...');
    const cached = loadProductsFromCache();
    
    if (cached && cached.products && cached.products.length > 0) {
        products = cached.products;
        console.log('[ProductsManager] Loaded from cache, count:', products.length);
        
        // ALWAYS dispatch immediately with cached data
        console.log('[ProductsManager] Dispatching productsManagerReady event (cache)');
        window.dispatchEvent(new CustomEvent('productsManagerReady'));
        
        // Optional: Check if cache is getting old (> 30 min) and update in background
        const cacheAge = Date.now() - cached.timestamp;
        const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
        
        if (CONFIG.USE_FIRESTORE && cacheAge > REFRESH_THRESHOLD) {
            console.log('[ProductsManager] Cache is ' + Math.round(cacheAge/1000/60) + 
                       ' minutes old, refreshing from Firestore in background...');
            updateFromFirestoreInBackground();
        }
        return;
    }
    
    // 2. If cache empty, try localStorage
    console.log('[ProductsManager] Cache empty, checking localStorage...');
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            products = JSON.parse(saved) || [];
            console.log('[ProductsManager] Loaded from localStorage, count:', products.length);
            console.log('[ProductsManager] Dispatching productsManagerReady event (localStorage)');
            window.dispatchEvent(new CustomEvent('productsManagerReady'));
            
            // Update from Firestore in background
            if (CONFIG.USE_FIRESTORE) {
                updateFromFirestoreInBackground();
            }
            return;
        } catch (e) {
            products = [];
            console.error('[ProductsManager] Error loading from localStorage:', e);
        }
    }
    
    // 3. If no cache/localStorage, ONLY THEN try Firestore
    if (CONFIG.USE_FIRESTORE) {
        console.log('[ProductsManager] No cache found, loading from Firestore...');
        const firestoreProducts = await loadProductsFromFirestore();
        if (firestoreProducts !== null) {
            products = firestoreProducts; // Update array HERE
            console.log('[ProductsManager] Loaded from Firestore, count:', products.length);
            saveProductsToCache();
            saveProductsToLocalStorage();
        }
    }
    
    // Always dispatch event
    console.log('[ProductsManager] Dispatching productsManagerReady event (final)');
    window.dispatchEvent(new CustomEvent('productsManagerReady'));
}
//HELPER  Background Firestore update function
async function updateFromFirestoreInBackground() {
    try {
        const firestoreProducts = await loadProductsFromFirestore();
        if (firestoreProducts && firestoreProducts.length > 0) {
            // Update the products array HERE, in the background function
            products = firestoreProducts;
            saveProductsToCache();
            saveProductsToLocalStorage();
            console.log('[ProductsManager] Background Firestore update complete');
            
            // Notify UI to refresh if needed
            window.dispatchEvent(new CustomEvent('productsUpdated'));
        }
    } catch (error) {
        console.log('[ProductsManager] Background Firestore update failed:', error);
    }
}
    
    // Save products to localStorage (backup)
    function saveProductsToLocalStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(products));
            console.log('[ProductsManager] Saved to localStorage, count:', products.length);
        } catch (error) {
            console.error('[ProductsManager] Error saving to localStorage:', error);
        }
    }
    
    // Cache management functions (keep existing)
    function loadProductsFromCache() {
        console.log('[ProductsManager] Loading products from cache');
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) {
                console.log('[ProductsManager] No cache found');
                return null;
            }
            
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            // Check if cache is expired
            if (now - cacheData.timestamp > CONFIG.CACHE_DURATION) {
                console.log('[ProductsManager] Cache expired');
                localStorage.removeItem(CONFIG.CACHE_KEY);
                return null;
            }
            
            console.log('[ProductsManager] Cache loaded successfully');
            return cacheData;
        } catch (error) {
            console.error('[ProductsManager] Cache load error:', error);
            localStorage.removeItem(CONFIG.CACHE_KEY);
            return null;
        }
    }
    
    function saveProductsToCache() {
        console.log('[ProductsManager] Saving products to cache');
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
        console.log('[ProductsManager] Saving products to all storage locations');
        saveProductsToLocalStorage();
        saveProductsToCache();
        console.log('[ProductsManager] Products saved to local storage and cache');
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        console.log('[ProductsManager] Dispatched productsUpdated event');
    }
    
    function invalidateCache() {
        console.log('[ProductsManager] Invalidating cache');
        localStorage.removeItem(CONFIG.CACHE_KEY);
        console.log('[ProductsManager] Cache invalidated');
    }
      
    // ============================================
    // CRUD OPERATIONS (UPDATED FOR FIRESTORE)
    // ============================================
    
    // Add new product (to both Firestore and local)
    async function addProduct(productData) {
        console.log('[ProductsManager] Adding new product with data:', productData);
        
        // Calculate price if discount is provided
        const retailPrice = parseFloat(productData.retailPrice) || parseFloat(productData.currentprice) || 0;
        const discountPercent = parseFloat(productData.discountPercent) || 0;
        const calculatedPrice = discountPercent > 0 
            ? calculateDiscountedPrice(retailPrice, discountPercent)
            : parseFloat(productData.currentprice) || retailPrice;
        
        console.log('[ProductsManager] currentPrice calculation:', {
            retailPrice,
            discountPercent,
            calculatedPrice
        });
        
        const newProduct = {
            ...PRODUCT_SCHEMA,
            id: generateProductId(),
            name: productData.name.trim(),
            description: productData.description?.trim() || '',
            category: productData.category || CONFIG.CATEGORIES[0],
            retailPrice: retailPrice,
            discountPercent: discountPercent,
            currentprice: calculatedPrice,
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
        
        console.log('[ProductsManager] New product object created:', newProduct.id);
        
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
            name: newProduct.name,
            currentprice: newProduct.currentprice,
            discount: `${newProduct.discountPercent}%`,
            firestore: firestoreSuccess ? 'success' : 'failed',
            local: 'success'
        });
        
        return newProduct;
    }
    
    // Update product (in both Firestore and local)
    async function updateProduct(productId, updateData) {
        console.log('[ProductsManager] Updating product:', productId, updateData);
        
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
            console.log('[ProductsManager] Product not found:', productId);
            return false;
        }
        
        // Calculate price if discount or retail price is being updated
let updatedcurrentPrice = updateData.currentPrice;
const retailPrice = updateData.retailPrice !== undefined 
    ? parseFloat(updateData.retailPrice) 
    : products[index].retailPrice;
const discountPercent = updateData.discountPercent !== undefined 
    ? parseFloat(updateData.discountPercent) 
    : products[index].discountPercent;
        
        // Recalculate price if discount or original price changed
        if (updateData.discountPercent !== undefined || updateData.retailPrice !== undefined) {
            updatedcurrentPrice = calculateDiscountedPrice(retailPrice, discountPercent);
            console.log('[ProductsManager] Price recalculated:', {
                retaillPrice,
                discountPercent,
                updatedcurrentPrice
            });
        }
        
        const updatedProduct = {
            ...products[index],
            ...updateData,
            currentprice: updatedcurrentPrice !== undefined ? updatedcurrentPrice : products[index].currentprice,
            isOnSale: updateData.isOnSale !== undefined 
                ? updateData.isOnSale 
                : (discountPercent > 0) || products[index].isOnSale,
            updatedAt: new Date().toISOString()
        };
        
        console.log('[ProductsManager] Updated product object:', updatedProduct.id);
        
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
            name: updatedProduct.name,
            currentprice: updatedProduct.currentprice,
            discount: `${updatedProduct.discountPercent}%`,
            firestore: firestoreSuccess ? 'success' : 'failed',
            local: 'success'
        });
        
        return true;
    }
    
    // Delete product (soft delete in both)
    async function deleteProduct(productId) {
        console.log('[ProductsManager] Soft deleting product:', productId);
        
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
        console.log('[ProductsManager] Updating stock:', productId, 'change:', quantityChange);
        
        const product = getProductById(productId);
        if (!product) {
            console.log('[ProductsManager] Product not found for stock update:', productId);
            return false;
        }
        
        const newStock = product.stock + quantityChange;
        if (newStock < 0) {
            console.log('[ProductsManager] Stock update would result in negative stock:', newStock);
            return false;
        }
        
        const updateData = { 
            stock: newStock,
            updatedAt: new Date().toISOString()
        };
        
        if (quantityChange > 0) {
            updateData.lastRestock = new Date().toISOString();
            console.log('[ProductsManager] Restock recorded');
        }
        
        console.log('[ProductsManager] Stock update data:', updateData);
        return await updateProduct(productId, updateData);
    }
    
    // ============================================
    // QUERY FUNCTIONS (UNCHANGED - use local cache)
    // ============================================
    
    // Get all products (with optional filter)
    function getProducts(filter = {}) {
        console.log('[ProductsManager] Getting products with filter:', filter);
        
        let filtered = [...products];
        
        // Filter by category
        if (filter.category && filter.category !== 'all') {
            filtered = filtered.filter(p => p.category === filter.category);
            console.log('[ProductsManager] Filtered by category:', filter.category, 'count:', filtered.length);
        }
        
        // Filter by stock status
        if (filter.stockStatus === 'low') {
            filtered = filtered.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
            console.log('[ProductsManager] Filtered by low stock, count:', filtered.length);
        } else if (filter.stockStatus === 'out') {
            filtered = filtered.filter(p => p.stock === 0);
            console.log('[ProductsManager] Filtered by out of stock, count:', filtered.length);
        }
        
        // Filter by active status
        if (filter.activeOnly) {
            filtered = filtered.filter(p => p.isActive);
            console.log('[ProductsManager] Filtered by active only, count:', filtered.length);
        }
        
        console.log('[ProductsManager] Total filtered products:', filtered.length);
        return filtered;
    }
    
    // Get product by ID
    function getProductById(productId) {
        console.log('[ProductsManager] Getting product by ID:', productId);
        const product = products.find(p => p.id === productId);
        console.log('[ProductsManager] Product found:', product ? 'yes' : 'no');
        return product;
    }
    
    // Get products by category
    function getProductsByCategory(category) {
        console.log('[ProductsManager] Getting products by category:', category);
        const categoryProducts = products.filter(p => p.category === category && p.isActive);
        console.log('[ProductsManager] Category products count:', categoryProducts.length);
        return categoryProducts;
    }
    
    // Get low stock products
    function getLowStockProducts() {
        console.log('[ProductsManager] Getting low stock products');
        const lowStock = products.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
        console.log('[ProductsManager] Low stock products count:', lowStock.length);
        return lowStock;
    }
    
    // Generate product ID
    function generateProductId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const productId = `PROD-${year}${month}${day}-${random}`;
        console.log('[ProductsManager] Generated product ID:', productId);
        return productId;
    }

    // Calculate price with discount
    function calculateDiscountedPrice(retailPrice, discountPercent) {
    console.log('[ProductsManager] Calculating discounted price:', { retailPrice, discountPercent });
    
    if (!retailPrice || retailPrice <= 0) {
        console.log('[ProductsManager] Invalid retail price, returning 0');
        return 0;
    }

        
        const discount = retailPrice * (discountPercent / 100);
        const finalPrice = Math.max(0, retailPrice - discount);
        
        console.log('[ProductsManager] Discount calculation:', {
            retailPrice,
            discountPercent,
            discountAmount: discount,
            finalPrice
        });
        
        return finalPrice;
    }
    
    // ============================================
    // UI FUNCTIONS FROM ORIGINAL CODE (UPDATED WITH CSS CLASSES)
    // ============================================
    
    // Render products in admin panel
    function renderProductsAdmin(containerId = 'products-tab-content', filter = {}) {
        console.log('[ProductsManager] Rendering products admin, container:', containerId, 'filter:', filter);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[ProductsManager] Container not found:', containerId);
            return;
        }
        
        const filteredProducts = getProducts(filter); 
        console.log('[ProductsManager] Filtered products count:', filteredProducts.length);
        
        let html = `
            <div class="products-management-header">
                <h2>Products Management</h2>
                
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button id="add-product-btn" class="action-btn">
                        <i class="fas fa-plus"></i>
                        Add Product
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="product-filters-container">
                <button class="product-filter ${filter.category === 'all' || (!filter.category && !filter.stockStatus) ? 'active' : ''}" data-filter='{"category":"all"}'>
                    All Products <span class="filter-count">(${getProducts({category: 'all'}).length})</span>
                </button>
                
                ${CONFIG.CATEGORIES.map(cat => {
                    const count = products.filter(p => p.category === cat && p.isActive).length;
                    const isActive = filter.category === cat;
                    return `
                    <button class="product-filter ${isActive ? 'active' : ''}" data-filter='{"category":"${cat}"}' style="text-transform: capitalize;">
                        ${cat} <span class="filter-count">(${count})</span>
                    </button>
                    `;
                }).join('')}
                
                <button class="product-filter low-stock ${filter.stockStatus === 'low' ? 'active' : ''}" data-filter='{"stockStatus":"low"}'>
                    <i class="fas fa-exclamation-triangle"></i>
                    Low Stock <span class="filter-count">(${getLowStockProducts().length})</span>
                </button>
                
                <button class="product-filter out-stock ${filter.stockStatus === 'out' ? 'active' : ''}" data-filter='{"stockStatus":"out"}'>
                    <i class="fas fa-times-circle"></i>
                    Out of Stock <span class="filter-count">(${products.filter(p => p.stock === 0).length})</span>
                </button>
            </div>
            
            <!-- Products Grid -->
            <div id="products-grid" class="products-grid">
        `;

        if (filteredProducts.length === 0) {
            html += `
                <div class="products-empty-state">
                    <i class="fas fa-box-open products-empty-state-icon"></i>
                    <h3 style="margin: 0 0 0.5rem 0;">No products found</h3>
                    <p>${filter.category ? 'No products in this category.' : filter.stockStatus === 'low' ? 'No low stock products.' : filter.stockStatus === 'out' ? 'No out of stock products.' : 'Add your first product to get started.'}</p>
                </div>
            `;
        } else {
            filteredProducts.forEach(product => {
                const isLowStock = product.stock <= CONFIG.LOW_STOCK_THRESHOLD;
                const isOutOfStock = product.stock === 0;
                const cardClass = `product-admin-card ${isOutOfStock ? 'out-stock' : isLowStock ? 'low-stock' : ''}`;
                const stockBadgeClass = `stock-badge ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`;
                const stockValueClass = `stock-value ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`;
                const statusValueClass = `status-value ${product.isActive ? 'active' : 'inactive'}`;
                const toggleBtnClass = `toggle-product-btn ${product.isActive ? 'active' : 'inactive'}`;
                
                html += `
                    <div class="${cardClass}" data-product-id="${product.id}">
                        ${!product.isActive ? `
                        <div class="inactive-badge">
                            Inactive
                        </div>
                        ` : ''}
                        
                        <div class="product-card-content">
                            <img src="${product.imageUrl}" alt="${product.name}" class="product-card-image">
                            
                            <div class="product-card-details">
                                <h3 class="product-card-title">
                                    ${product.name}
                                    <span class="${stockBadgeClass}">
                                        ${isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </h3>
                                
                                <div class="product-category">
                                    <span>${product.category}</span>
                                </div>
                                
                                <div class="product-currentprice">
                                    R${product.currentprice.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="stock-info-box">
                            <div class="stock-info-content">
                                <div>
                                    <div class="stock-label">Current Stock</div>
                                    <div class="${stockValueClass}">
                                        ${product.stock} units
                                    </div>
                                </div>
                                
                                <div style="text-align: right;">
                                    <div class="stock-label">Status</div>
                                    <div class="${statusValueClass}">
                                        ${product.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="product-card-actions">
                            <button class="edit-product-btn" data-product-id="${product.id}">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            
                            <button class="adjust-stock-btn ${isOutOfStock ? 'restock' : ''}" data-product-id="${product.id}">
                                <i class="fas fa-boxes"></i>
                                ${isOutOfStock ? 'Restock' : 'Adjust Stock'}
                            </button>
                            
                            <button class="${toggleBtnClass}" data-product-id="${product.id}" data-active="${product.isActive}">
                                <i class="fas ${product.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <!-- NEW DELETE BUTTON GOES HERE -->
                            <button class="delete-product-btn" data-product-id="${product.id}" style="...">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
            </div>
        `;

        console.log('[ProductsManager] Setting container HTML, length:', html.length);
        container.innerHTML = html;
        setupProductEventListeners();
        console.log('[ProductsManager] Products admin rendering complete');
    }
    
    // ==========
    // Setup event listeners for product actions
    //===============
    function setupProductEventListeners() {
        console.log('[ProductsManager] Setting up product event listeners');
        
        // Product filters
        const filterButtons = document.querySelectorAll('.product-filter');
        console.log('[ProductsManager] Found filter buttons:', filterButtons.length);
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = JSON.parse(this.dataset.filter);
                console.log('[ProductsManager] Filter clicked:', filter);
                renderProductsAdmin('products-tab-content', filter);
                
                // Update active state
                document.querySelectorAll('.product-filter').forEach(b => {
                    if (b === this) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
            });
        });
        
        // Add product button
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            console.log('[ProductsManager] Add product button found');
            addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[ProductsManager] Add product button clicked');
                showProductForm(null);
            });
        } else {
            console.log('[ProductsManager] Add product button not found');
        }
        
        // Edit product buttons
        const editButtons = document.querySelectorAll('.edit-product-btn');
        console.log('[ProductsManager] Found edit buttons:', editButtons.length);
        
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                console.log('[ProductsManager] Edit product clicked:', productId);
                showProductForm(productId);
            });
        });
        
        // Adjust stock buttons
        const stockButtons = document.querySelectorAll('.adjust-stock-btn');
        console.log('[ProductsManager] Found stock buttons:', stockButtons.length);
        
        stockButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                console.log('[ProductsManager] Adjust stock clicked:', productId);
                showStockAdjustmentForm(productId);
            });
        });
        
        // Toggle active/inactive buttons
        const toggleButtons = document.querySelectorAll('.toggle-product-btn');
        console.log('[ProductsManager] Found toggle buttons:', toggleButtons.length);
        
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                const isActive = this.dataset.active === 'true';
                
                console.log('[ProductsManager] Toggle product clicked:', productId, 'current active:', isActive);
                
                if (updateProduct(productId, { isActive: !isActive })) {
                    renderProductsAdmin();
                }
            });
        });
        // Delete product buttons
document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const productId = this.dataset.productId;
        console.log('[ProductsManager] Delete product clicked:', productId);
        showDeleteConfirmation(productId);
    });
});
        
        console.log('[ProductsManager] Event listeners setup complete');
    }
    
    // Show product form (add/edit)
    function showProductForm(productId = null) {
        console.log('[ProductsManager] Showing product form for:', productId || 'new product');
        
        const product = productId ? getProductById(productId) : null;
        const isEdit = !!product;
        console.log('[ProductsManager] Is edit mode:', isEdit);
        
        // Create or get modal
        let modal = document.getElementById('product-form-modal');
        if (!modal) {
            console.log('[ProductsManager] Creating new product form modal');
            modal = document.createElement('div');
            modal.id = 'product-form-modal';
            modal.className = 'product-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <button id="close-product-form" class="modal-close-btn">&times;</button>
                
                <h2 class="modal-title">
                    ${isEdit ? 'Edit Product' : 'Add New Product'}
                </h2>
                
                <form id="product-form">
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">
                                Product Name *
                            </label>
                            <input type="text" 
                                   id="product-name" 
                                   required 
                                   value="${product?.name || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Category *
                            </label>
                            <select id="product-category" required class="form-select">
                                ${CONFIG.CATEGORIES.map(cat => `
                                    <option value="${cat}" ${product?.category === cat ? 'selected' : ''}>
                                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Description
                        </label>
                        <textarea id="product-description" rows="3" class="form-textarea">${product?.description || ''}</textarea>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label class="form-label">
                                currentPrice (R) *
                            </label>
                            <input type="number" 
                                   id="product-currentprice" 
                                   required 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.currentprice || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Retail Price (R)
                            </label>
                            <input type="number" 
                                   id="product-retail-price" 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.retailPrice || product?.currentprice || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Stock Quantity *
                            </label>
                            <input type="number" 
                                   id="product-stock" 
                                   required 
                                   min="0"
                                   value="${product?.stock || ''}"
                                   class="form-input">
                        </div>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label class="form-label">
                                Discount (%)
                            </label>
                            <input type="number" 
                                   id="product-discount" 
                                   min="0" 
                                   max="100" 
                                   step="0.01"
                                   value="${product?.discountPercent || 0}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Sale End Date
                            </label>
                            <input type="datetime-local" 
                                   id="product-sale-end"
                                   value="${product?.saleEndDate ? new Date(product.saleEndDate).toISOString().slice(0, 16) : ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Total Sales
                            </label>
                            <input type="number" 
                                   id="product-sales-count" 
                                   min="0"
                                   value="${product?.salesCount || 0}"
                                   class="form-input">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   id="product-is-on-sale" 
                                   ${product?.isOnSale ? 'checked' : ''}
                                   class="checkbox-input">
                            Mark as On Sale
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            Image URL
                        </label>
                        <input type="text" 
                               id="product-image-url" 
                               value="${product?.imageUrl || ''}"
                               placeholder="e.g., gallery/product.jpg"
                               class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Tags (comma separated)
                        </label>
                        <input type="text" 
                               id="product-tags" 
                               value="${product?.tags?.join(', ') || ''}"
                               placeholder="e.g., bestseller, new, featured"
                               class="form-input">
                    </div>
                    
                    <div id="product-form-error" class="form-error"></div>
                    
                    <div class="form-actions">
                        <button type="button" id="cancel-product-form" class="cancel-btn">
                            Cancel
                        </button>
                        
                        <button type="submit" class="submit-btn">
                            ${isEdit ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Show modal
        console.log('[ProductsManager] Showing modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup form submission
        const form = document.getElementById('product-form');
        form.addEventListener('submit', (function(savedProductId) {
            return function(e) {
                e.preventDefault();
                console.log('[ProductsManager] Product form submitted');
                handleProductFormSubmit(savedProductId);
                return false;
            };
        })(productId));
        
        // Close buttons
        document.getElementById('close-product-form').onclick = closeProductForm;
        document.getElementById('cancel-product-form').onclick = closeProductForm;
        
        console.log('[ProductsManager] Product form setup complete');
    }
    
    // Handle product form submission
    function handleProductFormSubmit(productId = null) {
        console.log('[ProductsManager] Handling product form submit:', productId);
        
        // Get form data
    const retailPrice = parseFloat(productData.retailPrice) || parseFloat(productData.currentPrice) || 0;
const discountPercent = parseFloat(productData.discountPercent) || 0;
const calculatedPrice = discountPercent > 0 
    ? calculateDiscountedPrice(retailPrice, discountPercent)
    : parseFloat(productData.currentPrice) || retailPrice;
        
        console.log('[ProductsManager] Form data processing:', {
            retailPrice,
            discountPercent,
            calculatedPrice
        });
        
        const formData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category').value,
            retailPrice: retailPrice,
            discountPercent: discountPercent,
            currentprice: calculatedPrice,
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
        
        console.log('[ProductsManager] Form data collected:', formData);
        
        // Validate
        const errors = [];
        if (!formData.name.trim()) errors.push('Product name is required');
        if (isNaN(formData.currentprice) || formData.currentprice < 0) errors.push('Valid currentprice is required');
        if (isNaN(formData.stock) || formData.stock < 0) errors.push('Valid stock quantity is required');
        if (formData.discountPercent < 0 || formData.discountPercent > 100) errors.push('Discount must be between 0-100%');
        if (formData.saleEndDate && !isValidDate(formData.saleEndDate)) errors.push('Invalid sale end date');
        
        console.log('[ProductsManager] Validation errors:', errors.length);
        
        if (errors.length > 0) {
            const errorDiv = document.getElementById('product-form-error');
            errorDiv.innerHTML = errors.join('<br>');
            errorDiv.style.display = 'block';
            console.log('[ProductsManager] Form validation failed');
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
        const isValid = date instanceof Date && !isNaN(date);
        console.log('[ProductsManager] Date validation:', dateString, 'is valid:', isValid);
        return isValid;
    }
    
    // Show stock adjustment form
    function showStockAdjustmentForm(productId) {
        console.log('[ProductsManager] Showing stock adjustment form for:', productId);
        
        const product = getProductById(productId);
        if (!product) {
            console.log('[ProductsManager] Product not found for stock adjustment:', productId);
            return;
        }
        
        // Create or get modal
        let modal = document.getElementById('stock-adjustment-modal');
        if (!modal) {
            console.log('[ProductsManager] Creating new stock adjustment modal');
            modal = document.createElement('div');
            modal.id = 'stock-adjustment-modal';
            modal.className = 'stock-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="stock-modal-content">
                <button id="close-stock-modal" class="modal-close-btn">&times;</button>
                
                <h2 class="modal-title">
                    Adjust Stock: ${product.name}
                </h2>
                
                <div class="stock-summary-box">
                    <div class="stock-current-label">
                        Current Stock
                    </div>
                    <div class="stock-current-value">
                        ${product.stock}
                    </div>
                    <div class="stock-units-label">
                        units available
                    </div>
                </div>
                
                <form id="stock-adjustment-form">
                    <div class="form-group">
                        <label class="form-label">
                            Adjustment Type
                        </label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="adjustment-type" value="add" checked>
                                Add Stock
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="adjustment-type" value="subtract">
                                Remove Stock
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="adjustment-type" value="set">
                                Set Exact Quantity
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Quantity
                        </label>
                        <input type="number" 
                               id="adjustment-quantity" 
                               required 
                               min="1"
                               value="1"
                               class="form-input">
                    </div>
                    
                    <div id="stock-form-error" class="form-error"></div>
                    
                    <div class="form-actions">
                        <button type="button" id="cancel-stock-adjustment" class="cancel-btn">
                            Cancel
                        </button>
                        
                        <button type="submit" class="submit-btn">
                            Update Stock
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Show modal
        console.log('[ProductsManager] Showing stock modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup form submission
        const form = document.getElementById('stock-adjustment-form');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[ProductsManager] Stock form submitted');
            handleStockAdjustment(productId);
        });
        
        // Close buttons
        document.getElementById('close-stock-modal').onclick = closeStockModal;
        document.getElementById('cancel-stock-adjustment').onclick = closeStockModal;
        
        console.log('[ProductsManager] Stock form setup complete');
    }
    
    // Handle stock adjustment
    function handleStockAdjustment(productId) {
        console.log('[ProductsManager] Handling stock adjustment for:', productId);
        
        const product = getProductById(productId);
        if (!product) {
            console.log('[ProductsManager] Product not found during stock adjustment');
            return;
        }
        
        const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
        const quantity = parseInt(document.getElementById('adjustment-quantity').value);
        
        console.log('[ProductsManager] Stock adjustment details:', { adjustmentType, quantity });
        
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
        
        console.log('[ProductsManager] Stock validation errors:', errors.length);
        
        if (errors.length > 0) {
            const errorDiv = document.getElementById('stock-form-error');
            errorDiv.innerHTML = errors.join('<br>');
            errorDiv.style.display = 'block';
            console.log('[ProductsManager] Stock validation failed');
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
        
        console.log('[ProductsManager] New stock calculated:', newStock);
        
        // Update product
        if (updateProduct(productId, { stock: newStock })) {
            console.log('[ProductsManager] Stock update successful');
            closeStockModal();
            renderProductsAdmin();
        } else {
            console.log('[ProductsManager] Stock update failed');
        }
    }
    
    // Close product form modal
    function closeProductForm() {
        console.log('[ProductsManager] Closing product form');
        const modal = document.getElementById('product-form-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('[ProductsManager] Product form closed');
        }
    }
    
    // Close stock modal
    function closeStockModal() {
        console.log('[ProductsManager] Closing stock modal');
        const modal = document.getElementById('stock-adjustment-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('[ProductsManager] Stock modal closed');
        }
    }
    //=======
    // delete confirmation modal
    //======
    // Show delete confirmation modal
function showDeleteConfirmation(productId) {
    console.log('[ProductsManager] Showing delete confirmation for:', productId);
    
    const product = getProductById(productId);
    if (!product) {
        console.log('[ProductsManager] Product not found for delete:', productId);
        return;
    }
    
    // Create or get modal
    let modal = document.getElementById('delete-confirmation-modal');
    if (!modal) {
        console.log('[ProductsManager] Creating delete confirmation modal');
        modal = document.createElement('div');
        modal.id = 'delete-confirmation-modal';
        modal.className = 'delete-modal';
        modal.className = 'delete-modal';
        document.body.appendChild(modal);
    }
    
modal.innerHTML = `
    <div class="delete-modal-content">
        <button id="close-delete-modal" class="modal-close-btn">&times;</button>
        
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div class="delete-warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            
            <h2 class="modal-title">Delete Product</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">
                Are you sure you want to delete this product permanently?
            </p>
        </div>
        
        <div class="delete-product-details">
            <div style="font-weight: 600; color: #333; margin-bottom: 0.5rem;">
                Product Details
            </div>
            <div style="color: #666; font-size: 0.9rem;">
                <div><strong>Name:</strong> ${product.name}</div>
                <div><strong>ID:</strong> ${product.id}</div>
                <div><strong>Category:</strong> ${product.category}</div>
                <div><strong>Current Stock:</strong> ${product.stock} units</div>
            </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <div style="font-weight: 600; color: #333; margin-bottom: 0.5rem;">
                Warning
            </div>
            <div class="delete-warning-box">
                <i class="fas fa-exclamation-circle"></i> 
                This action cannot be undone. The product will be permanently removed from Firestore and set to inactive locally.
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">
                Admin Password Required *
            </label>
            <input type="password" 
                   id="admin-password" 
                   placeholder="Enter admin password to confirm"
                   class="form-input">
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                Type "DELETE" to confirm permanent deletion
            </div>
        </div>
        
        <div id="delete-error" class="form-error"></div>
        
        <div class="form-actions">
            <button type="button" id="cancel-delete" class="delete-cancel-btn">
                Cancel
            </button>
            
            <button type="button" id="confirm-delete" class="delete-confirm-btn">
                <i class="fas fa-trash-alt"></i>
                Delete Permanently
            </button>
        </div>
    </div>
`;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Setup event listeners
    document.getElementById('close-delete-modal').onclick = closeDeleteModal;
    document.getElementById('cancel-delete').onclick = closeDeleteModal;
    
    document.getElementById('confirm-delete').onclick = async function() {
        await handlePermanentDelete(productId);
    };
    
    // Allow Enter key to trigger delete
    document.getElementById('admin-password').addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            await handlePermanentDelete(productId);
        }
    });
}

// Handle permanent delete with password confirmation
async function handlePermanentDelete(productId) {
    console.log('[ProductsManager] Handling permanent delete for:', productId);
    
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('delete-error');
    
    // Validate password
    if (password !== 'DELETE') {
        errorDiv.innerHTML = 'Incorrect password. Please type "DELETE" to confirm.';
        errorDiv.style.display = 'block';
        console.log('[ProductsManager] Delete password incorrect');
        return;
    }
    
    const product = getProductById(productId);
    if (!product) {
        errorDiv.innerHTML = 'Product not found.';
        errorDiv.style.display = 'block';
        return;
    }
    
    console.log('[ProductsManager] Password verified, proceeding with delete');
    
    // 1. Perform soft delete locally (set isActive: false)
    const softDeleteSuccess = await deleteProduct(productId);
    
    // 2. Perform permanent delete from Firestore
    let firestoreDeleteSuccess = true;
    if (CONFIG.USE_FIRESTORE) {
        firestoreDeleteSuccess = await permanentlyDeleteFromFirestore(productId);
    }
    
    if (softDeleteSuccess) {
        console.log('[ProductsManager] Delete successful:', {
            id: productId,
            firestore: firestoreDeleteSuccess ? 'permanently deleted' : 'failed',
            local: 'soft deleted'
        });
        
        // Show success message
        errorDiv.style.background = '#e8f5e9';
        errorDiv.style.color = '#4CAF50';
        errorDiv.innerHTML = '<i class="fas fa-check-circle"></i> Product deleted successfully!';
        errorDiv.style.display = 'block';
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
            closeDeleteModal();
            renderProductsAdmin();
        }, 1500);
        
    } else {
        console.log('[ProductsManager] Delete failed');
        errorDiv.innerHTML = 'Failed to delete product. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Close delete modal
function closeDeleteModal() {
    console.log('[ProductsManager] Closing delete modal');
    const modal = document.getElementById('delete-confirmation-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}


    
    // Public API
    console.log('[ProductsManager] Creating public API');
    return {
        init,
        products, // <-- This returns the CURRENT value of products array
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
        invalidateCache,
        loadProducts,  // Make it public
        getProductsArray: () => products  // Getter for current array
    };
})();

console.log('[ProductsManager] Module definition complete');
