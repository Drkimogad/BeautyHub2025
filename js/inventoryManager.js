/* inventoryManager.js - Stock Management & Order Integration
UPDATED: Aligned with wholesalePrice, retailPrice, currentPrice naming */

//==================================================
const InventoryManager = (function() {
    // Dependencies
    let ProductsManager = null;
    let OrdersManager = null;
    
    // Storage constants
    const STORAGE_KEYS = {
        INVENTORY_TRANSACTIONS: 'beautyhub_inventory_transactions',
        ORDERS: 'beautyhub_orders'
    };
    
//=====================================
    // Initialize with dependencies
//=========================================
    function init(productsMgr, ordersMgr) {
        try {
            console.log('[InventoryManager] Initializing...');
            
            if (!productsMgr || !ordersMgr) {
                console.error('[InventoryManager] Missing dependencies');
                return null;
            }
            
            ProductsManager = productsMgr;
            OrdersManager = ordersMgr;
            
            setupOrderListener();
            
            console.log('[InventoryManager] Initialization complete');
            
            return {
                deductStockFromOrder,
                getInventoryReport,
                getLowStockAlert,
                getStockHistory,
                updateStockManually,
                checkStockBeforeAddToCart,
                getInventoryTransactionsReport
            };
            
        } catch (error) {
            console.error('[InventoryManager] Initialization failed:', error);
            return null;
        }
    }
    
//============================================
    //Listen for new orders
//======================================
    function setupOrderListener() {
        try {
            if (!OrdersManager) {
                console.warn('[InventoryManager] OrdersManager not available');
                return;
            }
            
            // Listen for order creation
            window.addEventListener('orderCreated', function(e) {
                try {
                    if (e.detail && e.detail.orderId) {
                        const order = OrdersManager.getOrderById(e.detail.orderId);
                        if (order) {
                            console.log(`[InventoryManager] Processing orderCreated event for order ${order.id}`);
                            deductStockFromOrder(order);
                        }
                    }
                } catch (error) {
                    console.error('[InventoryManager] Error handling orderCreated event:', error);
                }
            });
            
            // Also check localStorage changes as backup
            window.addEventListener('storage', function(e) {
                try {
                    if (e.key === STORAGE_KEYS.ORDERS && ProductsManager) {
                        const ordersJSON = localStorage.getItem(STORAGE_KEYS.ORDERS);
                        if (ordersJSON) {
                            const orders = JSON.parse(ordersJSON);
                            if (orders.length > 0) {
                                const latestOrder = orders[orders.length - 1];
                                if (latestOrder.status === 'pending') {
                                    console.log(`[InventoryManager] Processing storage event for order ${latestOrder.id}`);
                                    deductStockFromOrder(latestOrder);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('[InventoryManager] Error processing storage event:', error);
                }
            });
            
            console.log('[InventoryManager] Order listeners setup complete');
            
        } catch (error) {
            console.error('[InventoryManager] Failed to setup order listeners:', error);
        }
    }
    
//=====================================================
    //Deduct stock when order is placed
//==============================================
function deductStockFromOrder(order) {
        try {
            if (!ProductsManager) {
                console.error('[InventoryManager] ProductsManager not available');
                return false;
            }
            
            if (!order || !order.items) {
                console.error('[InventoryManager] Invalid order data');
                return false;
            }
            
            console.log(`[InventoryManager] Deducting stock for order: ${order.id}`);
            
            let allSuccessful = true;
            const updates = [];
            
            order.items.forEach(item => {
                try {
                    const product = ProductsManager.getProductById(item.productId);
                    if (!product) {
                        console.error(`[InventoryManager] Product not found: ${item.productId}`);
                        allSuccessful = false;
                        return;
                    }
                    
                    const quantity = parseInt(item.quantity) || 1;
                    const currentStock = parseInt(product.stock) || 0;
                    const newStock = currentStock - quantity;
                    
                    if (newStock < 0) {
                        console.error(`[InventoryManager] Insufficient stock for ${product.name}. Need ${quantity}, have ${currentStock}`);
                        allSuccessful = false;
                        return;
                    }
                    
                    updates.push({
                        productId: product.id,
                        productName: product.name,
                        oldStock: currentStock,
                        newStock: newStock,
                        quantity: quantity,
                        category: product.category || ''
                    });
                    
                    // NEW:Update product stock using UPDATESTOCKONLY FUNCTION FROM PRODUCTSMANAGER.JS
                   const success = ProductsManager.updateStockOnly(product.id, newStock);
                    
                    if (!success) {
                        console.error(`[InventoryManager] Failed to update stock for ${product.name}`);
                        allSuccessful = false;
                        return;
                    }
                    
                    console.log(`[InventoryManager] Stock updated: ${product.name} ${currentStock} → ${newStock}`);
                    
                } catch (itemError) {
                    console.error(`[InventoryManager] Error processing item ${item.productId}:`, itemError);
                    allSuccessful = false;
                }
            });
            
            if (allSuccessful && updates.length > 0) {
                // Save inventory transaction log
                saveInventoryTransaction({
                    type: 'order_deduction',
                    orderId: order.id,
                    timestamp: new Date().toISOString(),
                    performedBy: order.customerEmail ? `customer:${order.customerEmail}` : 'customer:anonymous',
                    referenceId: order.id,
                    updates: updates,
                    notes: `Stock deducted for order ${order.id} - ${order.firstName || ''} ${order.surname || ''}`
                });
                
                console.log(`[InventoryManager] Stock successfully deducted for order: ${order.id}`);
                    // ========== ADD SUCCESS NOTIFICATION ==========
    if (typeof window.showDashboardNotification === 'function') {
        window.showDashboardNotification('Stock updated successfully!', 'success');
    }
    
    if (typeof window.refreshDashboardOrders === 'function') {
        window.refreshDashboardOrders();
    }

                return true;
            }
            
            console.warn(`[InventoryManager] Stock deduction incomplete for order: ${order.id}`);
            return false;
            
        } catch (error) {
            console.error(`[InventoryManager] Failed to deduct stock for order:`, error);
            return false;
        }
    }
    
// ========================================
    //Get inventory report
//=======================================
function getInventoryReport() {
        try {
            if (!ProductsManager) {
                console.error('[InventoryManager] ProductsManager not available');
                return null;
            }
            
            const products = ProductsManager.getProducts({ activeOnly: true });
            const totalProducts = products.length;
            
            // Use consistent property names for calculations
            const totalStock = products.reduce((sum, p) => {
                const stock = parseInt(p.stock) || 0;
                return sum + stock;
            }, 0);
            
            const totalValue = products.reduce((sum, p) => {
                const stock = parseInt(p.stock) || 0;
                const currentPrice = p.currentPrice || p.currentprice || 0;
                return sum + (parseFloat(currentPrice) * stock);
            }, 0);
            
            const lowStock = products.filter(p => {
                const stock = parseInt(p.stock) || 0;
                return stock <= 5 && stock > 0;
            });
            
            const outOfStock = products.filter(p => {
                const stock = parseInt(p.stock) || 0;
                return stock === 0;
            });
            
            const healthyStock = products.filter(p => {
                const stock = parseInt(p.stock) || 0;
                return stock > 5;
            });
            
            // Get categories from ProductsManager or use defaults
            const categories = ProductsManager.CATEGORIES || ['perfumes', 'lashes', 'skincare', 'wigs'];
            
            const categoryReport = categories.map(category => {
                const catProducts = products.filter(p => p.category === category);
                return {
                    category,
                    count: catProducts.length,
                    totalStock: catProducts.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0),
                    lowStock: catProducts.filter(p => {
                        const stock = parseInt(p.stock) || 0;
                        return stock <= 5 && stock > 0;
                    }).length,
                    outOfStock: catProducts.filter(p => {
                        const stock = parseInt(p.stock) || 0;
                        return stock === 0;
                    }).length
                };
            });
            
            return {
                summary: {
                    totalProducts,
                    totalStock,
                    totalValue: parseFloat(totalValue.toFixed(2)),
                    lowStockCount: lowStock.length,
                    outOfStockCount: outOfStock.length,
                    healthyStockCount: healthyStock.length,
                    avgStockPerProduct: totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0
                },
                categories: categoryReport,
                lowStockProducts: lowStock.map(p => ({
                    id: p.id,
                    name: p.name,
                    currentStock: parseInt(p.stock) || 0,
                    category: p.category || 'Uncategorized',
                    currentPrice: p.currentPrice || p.currentprice || 0,
                    retailPrice: p.retailPrice || p.retailprice || 0,
                    wholesalePrice: p.wholesalePrice || p.wholesaleprice || 0
                })),
                outOfStockProducts: outOfStock.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category || 'Uncategorized',
                    currentPrice: p.currentPrice || p.currentprice || 0,
                    retailPrice: p.retailPrice || p.retailprice || 0
                }))
            };
            
        } catch (error) {
            console.error('[InventoryManager] Failed to generate inventory report:', error);
            return null;
        }
    }
    
// =================================================
    //Get low stock alert
//===========================================
function getLowStockAlert() {
        try {
            if (!ProductsManager) {
                console.error('[InventoryManager] ProductsManager not available');
                return null;
            }
            
            const lowStockProducts = ProductsManager.getLowStockProducts();
            if (!lowStockProducts || lowStockProducts.length === 0) {
                return null;
            }
            
            return {
                count: lowStockProducts.length,
                timestamp: new Date().toISOString(),
                products: lowStockProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    stock: parseInt(p.stock) || 0,
                    category: p.category || 'Uncategorized',
                    needsRestock: (parseInt(p.stock) || 0) <= 2,
                    currentPrice: p.currentPrice || p.currentprice || 0,
                    reorderSuggestion: Math.max(10, Math.ceil((parseInt(p.stock) || 0) * 2))
                }))
            };
            
        } catch (error) {
            console.error('[InventoryManager] Failed to get low stock alert:', error);
            return null;
        }
    }
    
// =======================================
    //Get stock history
//===================================
function getStockHistory(productId, limit = 10) {
        try {
            const transactions = getInventoryTransactions();
            const productTransactions = transactions
                .filter(t => {
                    if (!t.updates) return false;
                    return t.updates.some(u => u.productId === productId);
                })
                .slice(0, limit)
                .map(t => {
                    const update = t.updates.find(u => u.productId === productId);
                    return {
                        transactionId: t.id || '',
                        type: t.type || '',
                        timestamp: t.timestamp || '',
                        orderId: t.orderId || '',
                        quantity: update?.quantity || 0,
                        previousStock: update?.previousStock || update?.oldStock || 0,
                        newStock: update?.newStock || 0,
                        performedBy: t.performedBy || '',
                        notes: t.notes || ''
                    };
                });
            
            return productTransactions;
            
        } catch (error) {
            console.error(`[InventoryManager] Failed to get stock history for ${productId}:`, error);
            return [];
        }
    }
    
//=====================================================
    // Update stock manually
//============================================
    function updateStockManually(productId, quantity, reason = 'manual_adjustment', performedBy = 'admin') {
        try {
            if (!ProductsManager) {
                console.error('[InventoryManager] ProductsManager not available');
                return false;
            }
            
            const product = ProductsManager.getProductById(productId);
            if (!product) {
                console.error(`[InventoryManager] Product not found: ${productId}`);
                return false;
            }
            
            const currentStock = parseInt(product.stock) || 0;
            const adjustment = parseInt(quantity) || 0;
            const newStock = currentStock + adjustment;
            
            if (newStock < 0) {
                console.error(`[InventoryManager] Invalid stock adjustment: ${currentStock} + ${adjustment} = ${newStock}`);
                return false;
            }
            
         // UPDATE VIA CALLING UPDATESTOCKONLY FUNCTION IN PRODUCTSMANAGER.JS      
             const success = ProductsManager.updateStockOnly(productId, newStock);
            
              if (!success) {
                console.error(`[InventoryManager] Failed to update product ${productId}`);
              if (typeof window.showDashboardNotification === 'function') {
               window.showDashboardNotification('Failed to update stock. Please try again.', 'error');
              }               
                return false;
            }
            
            // Save transaction
            saveInventoryTransaction({
                type: reason,
                timestamp: new Date().toISOString(),
                performedBy: performedBy,
                referenceId: '',
                updates: [{
                    productId: product.id,
                    productName: product.name,
                    oldStock: currentStock,
                    newStock: newStock,
                    quantity: adjustment,
                    category: product.category || ''
                }],
                notes: `Manual adjustment: ${reason} (${adjustment > 0 ? '+' : ''}${adjustment})`
            });
            
            console.log(`[InventoryManager] Manual stock update: ${product.name} ${adjustment > 0 ? '+' : ''}${adjustment} = ${newStock}`);
          if (typeof window.showDashboardNotification === 'function') {
          window.showDashboardNotification('Stock updated successfully!', 'success');
           }

        if (typeof window.refreshDashboardOrders === 'function') {
           window.refreshDashboardOrders();
              }
            
            return true;
            
        } catch (error) {
            console.error(`[InventoryManager] Failed to update stock for ${productId}:`, error);
            return false;
        }
    }
    
//=============================================================
    //Check stock before adding to cart
//=====================================================
    function checkStockBeforeAddToCart(productId, requestedQuantity) {
        try {
            if (!ProductsManager || typeof ProductsManager.getProductById !== 'function') {
    return { available: true, reason: 'Stock check system offline', availableStock: 999 };
}
const product = ProductsManager.getProductById(productId);
            if (!product) {
                return { 
                    available: false, 
                    reason: 'Product not found',
                    availableStock: 0 
                };
            }
            
            if (product.isActive === false) {
                return { 
                    available: false, 
                    reason: 'Product is not available',
                    availableStock: 0 
                };
            }
            
            const currentStock = parseInt(product.stock) || 0;
            const requested = parseInt(requestedQuantity) || 1;
            
            if (currentStock < requested) {
                return {
                    available: false,
                    reason: currentStock === 0 ? 'Out of stock' : `Only ${currentStock} unit${currentStock === 1 ? '' : 's'} available`,
                    availableStock: currentStock,
                    productName: product.name,
                    productPrice: product.currentPrice || product.currentprice || 0
                };
            }
            
            return { 
                available: true, 
                availableStock: currentStock,
                productName: product.name,
                productPrice: product.currentPrice || product.currentprice || 0,
                canOrderMore: currentStock > requested
            };
            
        } catch (error) {
            console.error(`[InventoryManager] Stock check failed for ${productId}:`, error);
            return { 
                available: false, 
                reason: 'System error checking stock',
                availableStock: 0 
            };
        }
    }
    
//================================================
    // Save inventory transaction
//============================================
    function saveInventoryTransaction(transactionData) {
        try {
            if (!transactionData || !transactionData.updates) {
                console.error('[InventoryManager] Invalid transaction data');
                return false;
            }
            
            const existing = localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS);
            const transactions = existing ? JSON.parse(existing) : [];
            
            // Get product details for updates
            const enhancedUpdates = transactionData.updates.map(update => {
                let product = null;
                if (ProductsManager) {
                    product = ProductsManager.getProductById(update.productId);
                }
                
                return {
                    productId: update.productId,
                    productName: update.productName || product?.name || 'Unknown',
                    previousStock: update.oldStock || update.previousStock || 0,
                    newStock: update.newStock || 0,
                    quantity: update.quantity || 0,
                    category: update.category || product?.category || 'Unknown',
                    price: product ? (product.currentPrice || product.currentprice || 0) : 0
                };
            });
            
            // Create enhanced transaction
            const enhancedTransaction = {
                id: `TX-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                type: transactionData.type || 'unknown',
                timestamp: transactionData.timestamp || new Date().toISOString(),
                performedBy: transactionData.performedBy || 'system',
                referenceId: transactionData.referenceId || '',
                notes: transactionData.notes || '',
                updates: enhancedUpdates
            };
            
            transactions.push(enhancedTransaction);
            
            // Keep only last 200 transactions to prevent localStorage overflow
            const trimmedTransactions = transactions.slice(-200);
            localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(trimmedTransactions));
            
            console.log(`[InventoryManager] Transaction saved: ${enhancedTransaction.id}`);
            return true;
            
        } catch (error) {
            console.error('[InventoryManager] Failed to save transaction:', error);
            return false;
        }
    }
    
//=================================================
    //Get inventory transactions
//==========================================
    function getInventoryTransactions() {
        try {
            const existing = localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS);
            return existing ? JSON.parse(existing) : [];
        } catch (error) {
            console.error('[InventoryManager] Failed to get transactions:', error);
            return [];
        }
    }
    
    // Get comprehensive inventory report for analytics
    function getInventoryTransactionsReport(filters = {}) {
        try {
            const transactions = getInventoryTransactions();
            let filtered = transactions;
            
            // Apply filters
            if (filters.productId) {
                filtered = filtered.filter(t => 
                    t.updates && t.updates.some(u => u.productId === filters.productId)
                );
            }
            
            if (filters.type) {
                filtered = filtered.filter(t => t.type === filters.type);
            }
            
            if (filters.startDate) {
                filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
            }
            
            if (filters.endDate) {
                filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(filters.endDate));
            }
            
            // Get unique products from transactions
            const productMap = new Map();
            
            filtered.forEach(transaction => {
                if (!transaction.updates) return;
                
                transaction.updates.forEach(update => {
                    if (!productMap.has(update.productId)) {
                        const product = ProductsManager ? ProductsManager.getProductById(update.productId) : null;
                        productMap.set(update.productId, {
                            id: update.productId,
                            name: update.productName || product?.name || 'Unknown',
                            category: update.category || product?.category || 'Unknown',
                            currentStock: product ? (parseInt(product.stock) || 0) : 0,
                            currentPrice: product ? (product.currentPrice || product.currentprice || 0) : 0,
                            retailPrice: product ? (product.retailPrice || product.retailprice || 0) : 0,
                            wholesalePrice: product ? (product.wholesalePrice || product.wholesaleprice || 0) : 0,
                            salesCount: product?.salesCount || 0,
                            lastUpdated: product?.updatedAt || transaction.timestamp,
                            transactions: []
                        });
                    }
                    
                    productMap.get(update.productId).transactions.push({
                        transactionId: transaction.id,
                        type: transaction.type,
                        timestamp: transaction.timestamp,
                        quantity: update.quantity || 0,
                        previousStock: update.previousStock || 0,
                        newStock: update.newStock || 0,
                        performedBy: transaction.performedBy,
                        referenceId: transaction.referenceId,
                        notes: transaction.notes
                    });
                });
            });
            
            // Calculate statistics
            const totalStockChanges = filtered.reduce((sum, t) => {
                if (!t.updates) return sum;
                return sum + t.updates.reduce((s, u) => s + Math.abs(u.quantity || 0), 0);
            }, 0);
            
            const totalValueChanges = filtered.reduce((sum, t) => {
                if (!t.updates) return sum;
                return sum + t.updates.reduce((s, u) => {
                    const product = ProductsManager ? ProductsManager.getProductById(u.productId) : null;
                    const price = product ? (product.currentPrice || product.currentprice || 0) : 0;
                    return s + (Math.abs(u.quantity || 0) * price);
                }, 0);
            }, 0);
            
            return {
                summary: {
                    totalTransactions: filtered.length,
                    totalProducts: productMap.size,
                    totalStockChanges: totalStockChanges,
                    totalValueChanges: parseFloat(totalValueChanges.toFixed(2)),
                    timeRange: {
                        start: filtered.length > 0 ? filtered[0].timestamp : null,
                        end: filtered.length > 0 ? filtered[filtered.length - 1].timestamp : null
                    }
                },
                products: Array.from(productMap.values()).map(product => ({
                    ...product,
                    transactionCount: product.transactions.length,
                    totalQuantityChanged: product.transactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0)
                })),
                recentTransactions: filtered.slice(-10).map(t => ({
                    id: t.id,
                    type: t.type,
                    timestamp: t.timestamp,
                    performedBy: t.performedBy,
                    productCount: t.updates ? t.updates.length : 0,
                    totalQuantity: t.updates ? t.updates.reduce((sum, u) => sum + Math.abs(u.quantity || 0), 0) : 0
                })),
                transactionTypes: filtered.reduce((acc, t) => {
                    acc[t.type] = (acc[t.type] || 0) + 1;
                    return acc;
                }, {})
            };
            
        } catch (error) {
            console.error('[InventoryManager] Failed to generate transactions report:', error);
            return {
                summary: { totalTransactions: 0, totalProducts: 0, totalStockChanges: 0 },
                products: [],
                recentTransactions: [],
                transactionTypes: {}
            };
        }
    }
    
// Public API
    return {
        init,
        deductStockFromOrder,
        getInventoryReport,
        getLowStockAlert,
        getStockHistory,
        updateStockManually,
        checkStockBeforeAddToCart,
        getInventoryTransactionsReport
    };
})();
