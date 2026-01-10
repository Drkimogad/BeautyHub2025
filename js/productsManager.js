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
        price: 0,           // Current price
        originalPrice: 0,    // Original price (for discounts)
        stock: 0,           // Current stock quantity
        imageUrl: '',       // Main product image
        gallery: [],        // Additional images array
        tags: [],           // ['bestseller', 'new', 'featured']
        specifications: {},  // {key: value} pairs
        isActive: true,     // Active/inactive product
        createdAt: '',      // ISO string
        updatedAt: '',      // ISO string
        lastRestock: '',    // ISO string - NEW
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
                products = firestoreProducts;
                saveProductsToCache();
                saveProductsToLocalStorage(); // Keep local backup
                console.log('[ProductsManager] Primary: Loaded from Firestore');
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
                price: 300.00,
                originalPrice: 300.00,
                stock: 15,
                imageUrl: 'gallery/perfumes.jpg',
                gallery: [],
                tags: ['new', 'featured'],
                specifications: {
                    'Size': '50ml',
                    'Fragrance Type': 'Eau de Parfum',
                    'Longevity': '8-10 hours'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastRestock: new Date().toISOString(),
                salesCount: 0
            },
            // ... other sample products with new fields
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
            updatedAt: new Date().toISOString(),
            lastRestock: new Date().toISOString(),
            salesCount: 0
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
            firestore: firestoreSuccess ? 'success' : 'failed',
            local: 'success'
        });
        
        return newProduct;
    }
    
    // Update product (in both Firestore and local)
    async function updateProduct(productId, updateData) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) return false;
        
        const updatedProduct = {
            ...products[index],
            ...updateData,
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
    
    // ============================================
    // UI FUNCTIONS (UNCHANGED - from your existing code)
    // ============================================
    // [KEEP ALL YOUR EXISTING UI CODE FROM LINE 300 TO END]
    // renderProductsAdmin(), showProductForm(), etc.
    // ============================================
    
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
