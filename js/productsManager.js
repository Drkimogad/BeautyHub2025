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
            // ADD THIS CRITICAL LINE:
            products = firestoreProducts; // <-- THIS IS MISSING
            console.log('[ProductsManager] Products array updated from Firestore');
            return firestoreProducts;
            
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
    
    // Delete product from Firestore
    async function deleteProductFromFirestore(productId) {
        console.log('[ProductsManager] Attempting soft delete in Firestore:', productId);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Firestore disabled or not ready');
            return false;
        }
        
        try {
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(productId);
            
            const softDeleteData = {
                isActive: false,
                updatedAt: new Date().toISOString()
            };
            
            console.log('[ProductsManager] Soft deleting in Firestore:', softDeleteData);
            await productRef.update(softDeleteData);
            
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
        console.log('[ProductsManager] Starting product loading process');
        
        // 1. Try Firestore first (if enabled)
        if (CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Attempting to load from Firestore (primary source)');
            const firestoreProducts = await loadProductsFromFirestore();
            if (firestoreProducts && firestoreProducts.length > 0) {
                products = firestoreProducts; // <-- THIS MUST EXIST
                console.log('[ProductsManager] Products loaded from Firestore, count:', products.length);
                saveProductsToCache();
                saveProductsToLocalStorage(); // Keep local backup
                console.log('[ProductsManager] Primary: Loaded from Firestore');
                console.log('[ProductsManager] Dispatching productsManagerReady event');
                window.dispatchEvent(new CustomEvent('productsManagerReady'));
                return;
            } else {
                console.log('[ProductsManager] Firestore load returned no products or failed');
            }
        } else {
            console.log('[ProductsManager] Firestore is disabled in configuration');
        }
        
        // 2. Try cache (if Firestore failed or disabled)
        console.log('[ProductsManager] Falling back to cache...');
        const cached = loadProductsFromCache();
        if (cached && cached.products && cached.products.length > 0) {
            products = cached.products;
            console.log('[ProductsManager] Fallback: Loaded from cache, count:', products.length);
            return;
        }
        
        // 3. Fallback to localStorage
        console.log('[ProductsManager] Falling back to localStorage...');
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                products = JSON.parse(saved) || [];
                console.log('[ProductsManager] Fallback: Loaded from localStorage, count:', products.length);
            } catch (e) {
                products = [];
                console.error('[ProductsManager] Error loading products from localStorage:', e);
            }
        } else {
            console.log('[ProductsManager] No data found in localStorage');
        }
        
        // 4. Initialize sample products if empty
        if (products.length === 0) {
            console.log('[ProductsManager] Initializing sample products');
            initializeSampleProducts();
        }
        
        console.log('[ProductsManager] Final products count:', products.length);
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
    
    // Initialize sample products (keep existing, but add new fields)
    function initializeSampleProducts() {
        console.log('[ProductsManager] Creating sample products');
        
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
                name: 'Dubai Special Perfume',
                description: 'Our best seller perfume with exotic Middle Eastern scents.',
                category: 'perfumes',
                originalPrice: 500.00,
                discountPercent: 20,  // 20% discount
                price: 400.00,  // Auto-calculated: 500 - (500 * 0.20) = 400
                isOnSale: true,
                saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                stock: 10,
                imageUrl: 'gallery/perfumes.jpg', // You need to add this image
                gallery: [],
                tags: ['bestseller', 'featured', 'sale'],
                specifications: {
                    'Size': '100ml',
                    'Fragrance Type': 'Eau de Parfum',
                    'Longevity': '12+ hours',
                    'Origin': 'Dubai, UAE'
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 158
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
        
        console.log('[ProductsManager] Sample products created:', sampleProducts.length);
        
        products = sampleProducts;
        saveProducts();
        
        // Also save to Firestore if enabled
        if (CONFIG.USE_FIRESTORE) {
            console.log('[ProductsManager] Saving sample products to Firestore');
            sampleProducts.forEach(product => {
                saveProductToFirestore(product);
            });
        }
        
        console.log('[ProductsManager] Sample products initialization complete');
    }
    
    // ============================================
    // CRUD OPERATIONS (UPDATED FOR FIRESTORE)
    // ============================================
    
    // Add new product (to both Firestore and local)
    async function addProduct(productData) {
        console.log('[ProductsManager] Adding new product with data:', productData);
        
        // Calculate price if discount is provided
        const originalPrice = parseFloat(productData.originalPrice) || parseFloat(productData.price) || 0;
        const discountPercent = parseFloat(productData.discountPercent) || 0;
        const calculatedPrice = discountPercent > 0 
            ? calculateDiscountedPrice(originalPrice, discountPercent)
            : parseFloat(productData.price) || originalPrice;
        
        console.log('[ProductsManager] Price calculation:', {
            originalPrice,
            discountPercent,
            calculatedPrice
        });
        
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
            price: newProduct.price,
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
            console.log('[ProductsManager] Price recalculated:', {
                originalPrice,
                discountPercent,
                updatedPrice
            });
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
            price: updatedProduct.price,
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
    function calculateDiscountedPrice(originalPrice, discountPercent) {
        console.log('[ProductsManager] Calculating discounted price:', { originalPrice, discountPercent });
        
        if (!originalPrice || originalPrice <= 0) {
            console.log('[ProductsManager] Invalid original price, returning 0');
            return 0;
        }
        
        const discount = originalPrice * (discountPercent / 100);
        const finalPrice = Math.max(0, originalPrice - discount);
        
        console.log('[ProductsManager] Discount calculation:', {
            originalPrice,
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
                                
                                <div class="product-price">
                                    R${product.price.toFixed(2)}
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
    
    // Setup event listeners for product actions
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
                                Price (R) *
                            </label>
                            <input type="number" 
                                   id="product-price" 
                                   required 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.price || ''}"
                                   class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                Original Price (R)
                            </label>
                            <input type="number" 
                                   id="product-original-price" 
                                   min="0" 
                                   step="0.01"
                                   value="${product?.originalPrice || product?.price || ''}"
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
        const originalPrice = parseFloat(document.getElementById('product-original-price').value) || 
                             parseFloat(document.getElementById('product-price').value);
        const discountPercent = parseFloat(document.getElementById('product-discount').value) || 0;
        const calculatedPrice = calculateDiscountedPrice(originalPrice, discountPercent);
        
        console.log('[ProductsManager] Form data processing:', {
            originalPrice,
            discountPercent,
            calculatedPrice
        });
        
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
        
        console.log('[ProductsManager] Form data collected:', formData);
        
        // Validate
        const errors = [];
        if (!formData.name.trim()) errors.push('Product name is required');
        if (isNaN(formData.price) || formData.price < 0) errors.push('Valid price is required');
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
