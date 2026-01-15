// productsManager.js - Product CRUD & Management System WITH FIRESTORE
// Updated property names: wholesalePrice, retailPrice, currentPrice
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
        USE_FIRESTORE: true,
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
    
    // Product Schema (Updated)
    const PRODUCT_SCHEMA = {
        id: '',             
        name: '',           
        description: '',    
        category: '',       
        wholesalePrice: 0,  // Your cost
        retailPrice: 0,     // Standard selling price
        currentPrice: 0,    // Actual selling price
        discountPercent: 0, 
        isOnSale: false,    
        saleEndDate: "",    
        stock: 0,          
        imageUrl: '',      
        gallery: [],       
        tags: [],          
        specifications: {}, 
        isActive: true,    
        createdAt: '',     
        updatedAt: '',     
        salesCount: 0      
    };
    
    console.log('[ProductsManager] Product schema defined');
    
    // Initialize
    let products = [];
    
    function init() {
        try {
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
                invalidateCache,
                loadProducts
            };
        } catch (error) {
            console.error('[ProductsManager] Error in init:', error);
            return {};
        }
    }
    
// ============================================
    // FIRESTORE FUNCTIONS
// ============================================
    
    async function loadProductsFromFirestore() {
        try {
            console.log('[ProductsManager] Starting Firestore load process');
            
            if (!CONFIG.FIREBASE_READY()) {
                console.log('[ProductsManager] Firebase not ready, skipping Firestore');
                return null;
            }
            
            console.log('[ProductsManager] Loading from Firestore...');
            const db = firebase.firestore();
            console.log('[ProductsManager] Firestore database reference obtained');
            
            const snapshot = await db.collection(CONFIG.FIRESTORE_COLLECTION).get();
            console.log('[ProductsManager] Firestore query completed, documents:', snapshot.size);
            
            const firestoreProducts = [];
            snapshot.forEach(doc => {
                console.log('[ProductsManager] Processing document:', doc.id);
                const data = doc.data();
                
                // Ensure property names are consistent
                const normalizedProduct = {
                    id: doc.id,
                    ...data,
                    // Handle both naming conventions
                    wholesalePrice: data.wholesalePrice || data.wholesaleprice || 0,
                    retailPrice: data.retailPrice || data.retailprice || 0,
                    currentPrice: data.currentPrice || data.currentprice || 0,
                    discountPercent: data.discountPercent || data.discountedPercent || 0
                };
                
                firestoreProducts.push(normalizedProduct);
            });
            
            console.log(`[ProductsManager] Firestore loaded: ${firestoreProducts.length} products`);
            return firestoreProducts;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore load error:', error);
            return null;
        }
    }
    
    async function saveProductToFirestore(product) {
        try {
            console.log('[ProductsManager] Attempting to save product to Firestore:', product.id);
            
            if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
                console.log('[ProductsManager] Firestore disabled or not ready');
                return false;
            }
            
            const db = firebase.firestore();
            const productRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(product.id);
            
            // Ensure consistent property names for Firestore
            const firestoreProduct = {
                ...product,
                wholesalePrice: product.wholesalePrice || product.wholesaleprice || 0,
                retailPrice: product.retailPrice || product.retailprice || 0,
                currentPrice: product.currentPrice || product.currentprice || 0,
                discountPercent: product.discountPercent || product.discountedPercent || 0
            };
            
            console.log('[ProductsManager] Setting document in Firestore');
            await productRef.set(firestoreProduct);
            console.log(`[ProductsManager] Saved to Firestore: ${product.id}`);
            return true;
            
        } catch (error) {
            console.error('[ProductsManager] Firestore save error:', error);
            return false;
        }
    }
    
    async function updateProductInFirestore(productId, updateData) {
        try {
            console.log('[ProductsManager] Attempting to update product in Firestore:', productId);
            
            if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
                console.log('[ProductsManager] Firestore disabled or not ready');
                return false;
            }
            
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
    
    async function permanentlyDeleteFromFirestore(productId) {
        try {
            console.log('[ProductsManager] Attempting permanent delete from Firestore:', productId);
            
            if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
                console.log('[ProductsManager] Firestore disabled or not ready');
                return false;
            }
            
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
    // CORE PRODUCT FUNCTIONS
    // ============================================
async function loadProducts() {
    try {
        console.log('[ProductsManager] Starting product loading process');
        
        let loadedFrom = 'none';
        
        // 1. Try cache
        const cached = loadProductsFromCache();
        console.log('[DEBUG] After cache check, cached:', cached);
        
        if (cached && cached.products && cached.products.length > 0) {
            products = cached.products.map(p => normalizeProductProperties(p));
            loadedFrom = 'cache';
            console.log('[ProductsManager] Loaded from cache');
        } 
        // 2. Try localStorage
        else if (localStorage.getItem(CONFIG.STORAGE_KEY)) {
            console.log('[DEBUG] localStorage has data');
            const savedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
            products = savedProducts.map(p => normalizeProductProperties(p));
            loadedFrom = 'localStorage';
            console.log('[ProductsManager] Loaded from localStorage');
        }
        // 3. Try Firestore (if enabled)
        else if (CONFIG.USE_FIRESTORE) {
            console.log('[DEBUG] Trying Firestore...');
            const firestoreProducts = await loadProductsFromFirestore();
            console.log('[DEBUG] Firestore returned:', firestoreProducts?.length);
            
            if (firestoreProducts !== null) {
                products = firestoreProducts.map(p => normalizeProductProperties(p));
                console.log('[DEBUG] Products assigned, length:', products.length);
                saveProductsToCache();
                saveProductsToLocalStorage();
                loadedFrom = 'firestore';
                console.log('[ProductsManager] Loaded from Firestore');
            }
        }
        
        console.log(`[ProductsManager] Loaded ${products.length} products from ${loadedFrom}`);
        console.log('[DEBUG] About to dispatch event...');
        
        // ===== EVENT DISPATCH HERE - AFTER ALL LOADING ATTEMPTS =====
        window.dispatchEvent(new CustomEvent('productsManagerReady'));
        console.log('[DEBUG] Event dispatched!');
        // ============================================================
        
    } catch (error) {
        console.error('[ProductsManager] Error loading products:', error);
        products = [];
        
        console.log('[DEBUG] In catch block, about to dispatch error event');
        // ===== EVENT DISPATCH HERE TOO - EVEN ON ERROR =====
        window.dispatchEvent(new CustomEvent('productsManagerReady'));
        console.log('[DEBUG] Error event dispatched');
        // ===================================================
    }
}
    
    async function updateFromFirestoreInBackground() {
        try {
            const firestoreProducts = await loadProductsFromFirestore();
            if (firestoreProducts && firestoreProducts.length > 0) {
                products = firestoreProducts.map(p => normalizeProductProperties(p));
                saveProductsToCache();
                saveProductsToLocalStorage();
                console.log('[ProductsManager] Background Firestore update complete');
                window.dispatchEvent(new CustomEvent('productsUpdated'));
            }
        } catch (error) {
            console.log('[ProductsManager] Background Firestore update failed:', error);
        }
    }
    
    function normalizeProductProperties(product) {
        return {
            ...product,
            wholesalePrice: product.wholesalePrice || product.wholesaleprice || 0,
            retailPrice: product.retailPrice || product.retailprice || 0,
            currentPrice: product.currentPrice || product.currentprice || 0,
            discountPercent: product.discountPercent || product.discountedPercent || 0
        };
    }
    
    function saveProductsToLocalStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(products));
            console.log('[ProductsManager] Saved to localStorage, count:', products.length);
        } catch (error) {
            console.error('[ProductsManager] Error saving to localStorage:', error);
        }
    }
    
    function loadProductsFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) {
                console.log('[ProductsManager] No cache found');
                return null;
            }
            
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
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
        try {
            console.log('[ProductsManager] Saving products to all storage locations');
            saveProductsToLocalStorage();
            saveProductsToCache();
            console.log('[ProductsManager] Products saved to local storage and cache');
            window.dispatchEvent(new CustomEvent('productsUpdated'));
            console.log('[ProductsManager] Dispatched productsUpdated event');
        } catch (error) {
            console.error('[ProductsManager] Error saving products:', error);
        }
    }
    
    function invalidateCache() {
        try {
            console.log('[ProductsManager] Invalidating cache');
            localStorage.removeItem(CONFIG.CACHE_KEY);
            console.log('[ProductsManager] Cache invalidated');
        } catch (error) {
            console.error('[ProductsManager] Error invalidating cache:', error);
        }
    }
    
    // ============================================
    // CRUD OPERATIONS
    // ============================================
    
    async function addProduct(productData) {
        try {
            console.log('[ProductsManager] Adding new product with data:', productData);
            
            // Handle property naming variations
            const retailPrice = parseFloat(productData.retailPrice || productData.retailprice || 
                                         productData.currentPrice || productData.currentprice || 0);
            const discountPercent = parseFloat(productData.discountPercent || productData.discountedPercent || 0);
            const calculatedPrice = discountPercent > 0 
                ? calculateDiscountedPrice(retailPrice, discountPercent)
                : parseFloat(productData.currentPrice || productData.currentprice || retailPrice);
            
            console.log('[ProductsManager] Price calculation:', {
                retailPrice,
                discountPercent,
                calculatedPrice
            });
            
            const newProduct = {
                ...PRODUCT_SCHEMA,
                id: generateProductId(),
                name: productData.name?.trim() || '',
                description: productData.description?.trim() || '',
                category: productData.category || CONFIG.CATEGORIES[0],
                wholesalePrice: parseFloat(productData.wholesalePrice || productData.wholesaleprice || 0),
                retailPrice: retailPrice,
                discountPercent: discountPercent,
                currentPrice: calculatedPrice,
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
            
            // 1. Save to Firestore
            let firestoreSuccess = true;
            if (CONFIG.USE_FIRESTORE) {
                firestoreSuccess = await saveProductToFirestore(newProduct);
            }
            
            // 2. Save to local
            products.push(newProduct);
            saveProducts();
            
            console.log('[ProductsManager] Product added:', {
                id: newProduct.id,
                name: newProduct.name,
                currentPrice: newProduct.currentPrice,
                discount: `${newProduct.discountPercent}%`,
                firestore: firestoreSuccess ? 'success' : 'failed',
                local: 'success'
            });
            
            return newProduct;
        } catch (error) {
            console.error('[ProductsManager] Error adding product:', error);
            return null;
        }
    }
    
    async function updateProduct(productId, updateData) {
        try {
            console.log('[ProductsManager] Updating product:', productId, updateData);
            
            const index = products.findIndex(p => p.id === productId);
            if (index === -1) {
                console.log('[ProductsManager] Product not found:', productId);
                return false;
            }
            
            // Normalize incoming data
            const normalizedUpdate = normalizeProductProperties(updateData);
            
            let updatedCurrentPrice = normalizedUpdate.currentPrice || products[index].currentPrice;
            const retailPrice = normalizedUpdate.retailPrice !== undefined 
                ? parseFloat(normalizedUpdate.retailPrice) 
                : products[index].retailPrice;
            const discountPercent = normalizedUpdate.discountPercent !== undefined 
                ? parseFloat(normalizedUpdate.discountPercent) 
                : products[index].discountPercent;
            
            if (normalizedUpdate.discountPercent !== undefined || normalizedUpdate.retailPrice !== undefined) {
                updatedCurrentPrice = calculateDiscountedPrice(retailPrice, discountPercent);
                console.log('[ProductsManager] Price recalculated:', {
                    retailPrice,
                    discountPercent,
                    updatedCurrentPrice
                });
            }
            
            const updatedProduct = {
                ...products[index],
                ...normalizedUpdate,
                currentPrice: updatedCurrentPrice,
                isOnSale: normalizedUpdate.isOnSale !== undefined 
                    ? normalizedUpdate.isOnSale 
                    : (discountPercent > 0) || products[index].isOnSale,
                updatedAt: new Date().toISOString()
            };
            
            console.log('[ProductsManager] Updated product object:', updatedProduct.id);
            
            // 1. Update Firestore
            let firestoreSuccess = true;
            if (CONFIG.USE_FIRESTORE) {
                firestoreSuccess = await updateProductInFirestore(productId, normalizedUpdate);
            }
            
            // 2. Update local
            products[index] = updatedProduct;
            saveProducts();
            
            console.log('[ProductsManager] Product updated:', {
                id: productId,
                name: updatedProduct.name,
                currentPrice: updatedProduct.currentPrice,
                discount: `${updatedProduct.discountPercent}%`,
                firestore: firestoreSuccess ? 'success' : 'failed',
                local: 'success'
            });
            
            return true;
        } catch (error) {
            console.error('[ProductsManager] Error updating product:', error);
            return false;
        }
    }
    
    async function deleteProduct(productId) {
        try {
            console.log('[ProductsManager] Soft deleting product:', productId);
            
            const updateData = { 
                isActive: false,
                updatedAt: new Date().toISOString()
            };
            
            return await updateProduct(productId, updateData);
        } catch (error) {
            console.error('[ProductsManager] Error deleting product:', error);
            return false;
        }
    }
    
    async function updateStock(productId, quantityChange) {
        try {
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
        } catch (error) {
            console.error('[ProductsManager] Error updating stock:', error);
            return false;
        }
    }
    
    // ============================================
    // QUERY FUNCTIONS
    // ============================================
    
    function getProducts(filter = {}) {
        try {
            console.log('[ProductsManager] Getting products with filter:', filter);
            
            let filtered = [...products];
            
            if (filter.category && filter.category !== 'all') {
                filtered = filtered.filter(p => p.category === filter.category);
                console.log('[ProductsManager] Filtered by category:', filter.category, 'count:', filtered.length);
            }
            
            if (filter.stockStatus === 'low') {
                filtered = filtered.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
                console.log('[ProductsManager] Filtered by low stock, count:', filtered.length);
            } else if (filter.stockStatus === 'out') {
                filtered = filtered.filter(p => p.stock === 0);
                console.log('[ProductsManager] Filtered by out of stock, count:', filtered.length);
            }
            
            if (filter.activeOnly) {
                filtered = filtered.filter(p => p.isActive);
                console.log('[ProductsManager] Filtered by active only, count:', filtered.length);
            }
            
            console.log('[ProductsManager] Total filtered products:', filtered.length);
            return filtered;
        } catch (error) {
            console.error('[ProductsManager] Error getting products:', error);
            return [];
        }
    }
    
    function getProductById(productId) {
        try {
            console.log('[ProductsManager] Getting product by ID:', productId);
            const product = products.find(p => p.id === productId);
            console.log('[ProductsManager] Product found:', product ? 'yes' : 'no');
            return product ? normalizeProductProperties(product) : null;
        } catch (error) {
            console.error('[ProductsManager] Error getting product by ID:', error);
            return null;
        }
    }
    
    function getProductsByCategory(category) {
        try {
            console.log('[ProductsManager] Getting products by category:', category);
            const categoryProducts = products.filter(p => p.category === category && p.isActive);
            console.log('[ProductsManager] Category products count:', categoryProducts.length);
            return categoryProducts;
        } catch (error) {
            console.error('[ProductsManager] Error getting products by category:', error);
            return [];
        }
    }
    
    function getLowStockProducts() {
        try {
            console.log('[ProductsManager] Getting low stock products');
            const lowStock = products.filter(p => p.stock <= CONFIG.LOW_STOCK_THRESHOLD && p.stock > 0);
            console.log('[ProductsManager] Low stock products count:', lowStock.length);
            return lowStock;
        } catch (error) {
            console.error('[ProductsManager] Error getting low stock products:', error);
            return [];
        }
    }
    
    function generateProductId() {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const productId = `PROD-${year}${month}${day}-${random}`;
            console.log('[ProductsManager] Generated product ID:', productId);
            return productId;
        } catch (error) {
            console.error('[ProductsManager] Error generating product ID:', error);
            return `PROD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
    }
    
    function calculateDiscountedPrice(retailPrice, discountPercent) {
        try {
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
            
            return parseFloat(finalPrice.toFixed(2));
        } catch (error) {
            console.error('[ProductsManager] Error calculating discounted price:', error);
            return retailPrice || 0;
        }
    }
    
    // ============================================
    // UI FUNCTIONS
    // ============================================
    
    function renderProductsAdmin(containerId = 'products-tab-content', filter = {}) {
        try {
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
                    const normalizedProduct = normalizeProductProperties(product);
                    const isLowStock = normalizedProduct.stock <= CONFIG.LOW_STOCK_THRESHOLD;
                    const isOutOfStock = normalizedProduct.stock === 0;
                    const cardClass = `product-admin-card ${isOutOfStock ? 'out-stock' : isLowStock ? 'low-stock' : ''}`;
                    const stockBadgeClass = `stock-badge ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`;
                    const stockValueClass = `stock-value ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`;
                    const statusValueClass = `status-value ${normalizedProduct.isActive ? 'active' : 'inactive'}`;
                    const toggleBtnClass = `toggle-product-btn ${normalizedProduct.isActive ? 'active' : 'inactive'}`;
                    
                    html += `
                        <div class="${cardClass}" data-product-id="${normalizedProduct.id}">
                            ${!normalizedProduct.isActive ? `
                            <div class="inactive-badge">
                                Inactive
                            </div>
                            ` : ''}
                            
                            <div class="product-card-content">
                                <img src="${normalizedProduct.imageUrl}" alt="${normalizedProduct.name}" class="product-card-image">
                                
                                <div class="product-card-details">
                                    <h3 class="product-card-title">
                                        ${normalizedProduct.name}
                                        <span class="${stockBadgeClass}">
                                            ${isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </h3>
                                    
                                    <div class="product-category">
                                        <span>${normalizedProduct.category}</span>
                                    </div>
                                    
                                    <div class="product-price">
                                        R${normalizedProduct.currentPrice.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stock-info-box">
                                <div class="stock-info-content">
                                    <div>
                                        <div class="stock-label">Current Stock</div>
                                        <div class="${stockValueClass}">
                                            ${normalizedProduct.stock} units
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: right;">
                                        <div class="stock-label">Status</div>
                                        <div class="${statusValueClass}">
                                            ${normalizedProduct.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="product-card-actions">
                                <button class="edit-product-btn" data-product-id="${normalizedProduct.id}">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                                
                                <button class="adjust-stock-btn ${isOutOfStock ? 'restock' : ''}" data-product-id="${normalizedProduct.id}">
                                    <i class="fas fa-boxes"></i>
                                    ${isOutOfStock ? 'Restock' : 'Adjust Stock'}
                                </button>
                                
                                <button class="${toggleBtnClass}" data-product-id="${normalizedProduct.id}" data-active="${normalizedProduct.isActive}">
                                    <i class="fas ${normalizedProduct.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                </button>
                                
                                <button class="delete-product-btn" data-product-id="${normalizedProduct.id}" style="background: #f44336; color: white; padding: 0.5rem; border-radius: 4px; border: none; cursor: pointer;">
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
        } catch (error) {
            console.error('[ProductsManager] Error rendering products admin:', error);
        }
    }
    
    function setupProductEventListeners() {
        try {
            console.log('[ProductsManager] Setting up product event listeners');
            
            // Product filters
            const filterButtons = document.querySelectorAll('.product-filter');
            console.log('[ProductsManager] Found filter buttons:', filterButtons.length);
            
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    try {
                        const filter = JSON.parse(this.dataset.filter);
                        console.log('[ProductsManager] Filter clicked:', filter);
                        renderProductsAdmin('products-tab-content', filter);
                        
                        document.querySelectorAll('.product-filter').forEach(b => {
                            if (b === this) {
                                b.classList.add('active');
                            } else {
                                b.classList.remove('active');
                            }
                        });
                    } catch (error) {
                        console.error('[ProductsManager] Error handling filter click:', error);
                    }
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
                    try {
                        const productId = this.dataset.productId;
                        console.log('[ProductsManager] Edit product clicked:', productId);
                        showProductForm(productId);
                    } catch (error) {
                        console.error('[ProductsManager] Error handling edit click:', error);
                    }
                });
            });
            
            // Adjust stock buttons
            const stockButtons = document.querySelectorAll('.adjust-stock-btn');
            console.log('[ProductsManager] Found stock buttons:', stockButtons.length);
            
            stockButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    try {
                        const productId = this.dataset.productId;
                        console.log('[ProductsManager] Adjust stock clicked:', productId);
                        showStockAdjustmentForm(productId);
                    } catch (error) {
                        console.error('[ProductsManager] Error handling stock adjustment click:', error);
                    }
                });
            });
            
            // Toggle active/inactive buttons
            const toggleButtons = document.querySelectorAll('.toggle-product-btn');
            console.log('[ProductsManager] Found toggle buttons:', toggleButtons.length);
            
            toggleButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    try {
                        const productId = this.dataset.productId;
                        const isActive = this.dataset.active === 'true';
                        
                        console.log('[ProductsManager] Toggle product clicked:', productId, 'current active:', isActive);
                        
                        if (updateProduct(productId, { isActive: !isActive })) {
                            renderProductsAdmin();
                        }
                    } catch (error) {
                        console.error('[ProductsManager] Error handling toggle click:', error);
                    }
                });
            });
            
            // Delete product buttons
            document.querySelectorAll('.delete-product-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    try {
                        const productId = this.dataset.productId;
                        console.log('[ProductsManager] Delete product clicked:', productId);
                        showDeleteConfirmation(productId);
                    } catch (error) {
                        console.error('[ProductsManager] Error handling delete click:', error);
                    }
                });
            });
            
            console.log('[ProductsManager] Event listeners setup complete');
        } catch (error) {
            console.error('[ProductsManager] Error setting up event listeners:', error);
        }
    }
    
    function showProductForm(productId = null) {
        try {
            console.log('[ProductsManager] Showing product form for:', productId || 'new product');
            
            const product = productId ? getProductById(productId) : null;
            const isEdit = !!product;
            console.log('[ProductsManager] Is edit mode:', isEdit);
            
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
                                    Retail Price (R) *
                                </label>
                                <input type="number" 
                                       id="product-retail-price" 
                                       required 
                                       min="0" 
                                       step="0.01"
                                       value="${product?.retailPrice || product?.currentPrice || ''}"
                                       class="form-input">
                            </div>
                            
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
                                    Current Price (R) *
                                </label>
                                <input type="number" 
                                       id="product-current-price" 
                                       required 
                                       min="0" 
                                       step="0.01"
                                       value="${product?.currentPrice || ''}"
                                       class="form-input" readonly>
                            </div>
                        </div>

                        <div class="form-grid-3">
                            <div class="form-group">
                                <label class="form-label">
                                    Wholesale Price (R)
                                </label>
                                <input type="number" 
                                       id="product-wholesale-price" 
                                       min="0" 
                                       step="0.01"
                                       value="${product?.wholesalePrice || ''}"
                                       class="form-input"
                                       placeholder="Your cost price">
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

                        <div class="form-grid-2">
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
                                <label class="checkbox-label">
                                    <input type="checkbox" 
                                           id="product-is-on-sale" 
                                           ${product?.isOnSale ? 'checked' : ''}
                                           class="checkbox-input">
                                    Mark as On Sale
                                </label>
                            </div>
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
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const form = document.getElementById('product-form');
            form.addEventListener('submit', (function(savedProductId) {
                return function(e) {
                    e.preventDefault();
                    console.log('[ProductsManager] Product form submitted');
                    handleProductFormSubmit(savedProductId);
                    return false;
                };
            })(productId));
            
            document.getElementById('close-product-form').onclick = closeProductForm;
            document.getElementById('cancel-product-form').onclick = closeProductForm;
            
            console.log('[ProductsManager] Product form setup complete');
        } catch (error) {
            console.error('[ProductsManager] Error showing product form:', error);
        }
    }
    
    function handleProductFormSubmit(productId = null) {
        try {
            console.log('[ProductsManager] Handling product form submit:', productId);
            
            const retailPrice = parseFloat(document.getElementById('product-retail-price').value) || 0;
            const discountPercent = parseFloat(document.getElementById('product-discount').value) || 0;
            const calculatedPrice = calculateDiscountedPrice(retailPrice, discountPercent);
            
            document.getElementById('product-current-price').value = calculatedPrice.toFixed(2);
            
            const formData = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                category: document.getElementById('product-category').value,
                wholesalePrice: parseFloat(document.getElementById('product-wholesale-price').value) || 0,
                retailPrice: retailPrice,
                discountPercent: discountPercent,
                currentPrice: calculatedPrice,
                isOnSale: document.getElementById('product-is-on-sale').checked || (discountPercent > 0),
                saleEndDate: document.getElementById('product-sale-end').value || "",
                stock: parseInt(document.getElementById('product-stock').value) || 0,
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
            
            const errors = [];
            if (!formData.name.trim()) errors.push('Product name is required');
            if (isNaN(formData.currentPrice) || formData.currentPrice < 0) errors.push('Valid price is required');
            if (isNaN(formData.stock) || formData.stock < 0) errors.push('Valid stock quantity is required');
            if (formData.discountPercent < 0 || formData.discountPercent > 100) errors.push('Discount must be between 0-100%');
            
            console.log('[ProductsManager] Validation errors:', errors.length);
            
            if (errors.length > 0) {
                const errorDiv = document.getElementById('product-form-error');
                errorDiv.innerHTML = errors.join('<br>');
                errorDiv.style.display = 'block';
                console.log('[ProductsManager] Form validation failed');
                return;
            }
            
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
        } catch (error) {
            console.error('[ProductsManager] Error handling form submit:', error);
        }
    }
    
    function showStockAdjustmentForm(productId) {
        try {
            console.log('[ProductsManager] Showing stock adjustment form for:', productId);
            
            const product = getProductById(productId);
            if (!product) {
                console.log('[ProductsManager] Product not found for stock adjustment:', productId);
                return;
            }
            
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
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const form = document.getElementById('stock-adjustment-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('[ProductsManager] Stock form submitted');
                handleStockAdjustment(productId);
            });
            
            document.getElementById('close-stock-modal').onclick = closeStockModal;
            document.getElementById('cancel-stock-adjustment').onclick = closeStockModal;
            
            console.log('[ProductsManager] Stock form setup complete');
        } catch (error) {
            console.error('[ProductsManager] Error showing stock adjustment form:', error);
        }
    }
    
    function handleStockAdjustment(productId) {
        try {
            console.log('[ProductsManager] Handling stock adjustment for:', productId);
            
            const product = getProductById(productId);
            if (!product) {
                console.log('[ProductsManager] Product not found during stock adjustment');
                return;
            }
            
            const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
            const quantity = parseInt(document.getElementById('adjustment-quantity').value);
            
            console.log('[ProductsManager] Stock adjustment details:', { adjustmentType, quantity });
            
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
            
            if (updateProduct(productId, { stock: newStock })) {
                console.log('[ProductsManager] Stock update successful');
                closeStockModal();
                renderProductsAdmin();
            } else {
                console.log('[ProductsManager] Stock update failed');
            }
        } catch (error) {
            console.error('[ProductsManager] Error handling stock adjustment:', error);
        }
    }
    
    function showDeleteConfirmation(productId) {
        try {
            console.log('[ProductsManager] Showing delete confirmation for:', productId);
            
            const product = getProductById(productId);
            if (!product) {
                console.log('[ProductsManager] Product not found for delete:', productId);
                return;
            }
            
            let modal = document.getElementById('delete-confirmation-modal');
            if (!modal) {
                console.log('[ProductsManager] Creating delete confirmation modal');
                modal = document.createElement('div');
                modal.id = 'delete-confirmation-modal';
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
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            document.getElementById('close-delete-modal').onclick = closeDeleteModal;
            document.getElementById('cancel-delete').onclick = closeDeleteModal;
            
            document.getElementById('confirm-delete').onclick = async function() {
                await handlePermanentDelete(productId);
            };
            
            document.getElementById('admin-password').addEventListener('keypress', async function(e) {
                if (e.key === 'Enter') {
                    await handlePermanentDelete(productId);
                }
            });
        } catch (error) {
            console.error('[ProductsManager] Error showing delete confirmation:', error);
        }
    }
    
    async function handlePermanentDelete(productId) {
        try {
            console.log('[ProductsManager] Handling permanent delete for:', productId);
            
            const password = document.getElementById('admin-password').value;
            const errorDiv = document.getElementById('delete-error');
            
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
            
            const softDeleteSuccess = await deleteProduct(productId);
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
                
                errorDiv.style.background = '#e8f5e9';
                errorDiv.style.color = '#4CAF50';
                errorDiv.innerHTML = '<i class="fas fa-check-circle"></i> Product deleted successfully!';
                errorDiv.style.display = 'block';
                
                setTimeout(() => {
                    closeDeleteModal();
                    renderProductsAdmin();
                }, 1500);
            } else {
                console.log('[ProductsManager] Delete failed');
                errorDiv.innerHTML = 'Failed to delete product. Please try again.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('[ProductsManager] Error handling permanent delete:', error);
        }
    }
    
    function closeProductForm() {
        try {
            console.log('[ProductsManager] Closing product form');
            const modal = document.getElementById('product-form-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                console.log('[ProductsManager] Product form closed');
            }
        } catch (error) {
            console.error('[ProductsManager] Error closing product form:', error);
        }
    }
    
    function closeStockModal() {
        try {
            console.log('[ProductsManager] Closing stock modal');
            const modal = document.getElementById('stock-adjustment-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                console.log('[ProductsManager] Stock modal closed');
            }
        } catch (error) {
            console.error('[ProductsManager] Error closing stock modal:', error);
        }
    }
    
    function closeDeleteModal() {
        try {
            console.log('[ProductsManager] Closing delete modal');
            const modal = document.getElementById('delete-confirmation-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('[ProductsManager] Error closing delete modal:', error);
        }
    }
    
    console.log('[ProductsManager] Creating public API');
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
        invalidateCache,
        loadProducts
    };
})();

console.log('[ProductsManager] Module definition complete');
