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
            console.log('[InventoryManager] 🔍 DEDUCTING STOCK - START');
        console.log('[InventoryManager] Order details:', {
            id: order.id,
            status: order.status,
            itemsCount: order.items?.length || 0
        });
            
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
    
    // Get comprehensive inventory report for analytics ENHANCED FOR PRODUCTION ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
function saveInventoryTransaction(transactionData) {
    try {
        console.log('[InventoryManager] ⚡ SAVING TRANSACTION - START ⚡');
        console.log('[InventoryManager] Transaction data received:', {
            type: transactionData?.type,
            referenceId: transactionData?.referenceId,
            updatesCount: transactionData?.updates?.length || 0
        });
        
        // VALIDATION CHECKS
        if (!transactionData) {
            console.error('[InventoryManager] ❌ ERROR: No transaction data provided');
            return false;
        }
        
        if (!transactionData.updates || !Array.isArray(transactionData.updates)) {
            console.error('[InventoryManager] ❌ ERROR: Invalid updates array:', transactionData.updates);
            return false;
        }
        
        if (transactionData.updates.length === 0) {
            console.warn('[InventoryManager] ⚠️ WARNING: Empty updates array, but continuing...');
        }
        
        // CHECK LOCALSTORAGE AVAILABILITY
        if (typeof localStorage === 'undefined') {
            console.error('[InventoryManager] ❌ ERROR: localStorage not available');
            return false;
        }
        
        // LOAD EXISTING TRANSACTIONS
        let transactions = [];
        try {
            const existing = localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS);
            console.log('[InventoryManager] Existing transactions raw:', existing ? 'EXISTS' : 'EMPTY');
            
            if (existing) {
                transactions = JSON.parse(existing);
                console.log(`[InventoryManager] Loaded ${transactions.length} existing transactions`);
            }
        } catch (parseError) {
            console.error('[InventoryManager] ❌ ERROR parsing existing transactions:', parseError);
            // Start fresh if corrupted
            transactions = [];
            localStorage.removeItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS);
        }
        
        // ENHANCE TRANSACTION DATA
        const enhancedTransaction = {
            id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            type: transactionData.type || 'unknown',
            timestamp: transactionData.timestamp || new Date().toISOString(),
            performedBy: transactionData.performedBy || 'system',
            referenceId: transactionData.referenceId || '',
            notes: transactionData.notes || '',
            updates: transactionData.updates.map((update, index) => {
                // Get product details if ProductsManager is available
                let product = null;
                if (ProductsManager) {
                    product = ProductsManager.getProductById(update.productId);
                }
                
                return {
                    transactionIndex: index + 1,
                    productId: update.productId || '',
                    productName: update.productName || product?.name || 'Unknown',
                    previousStock: update.oldStock || update.previousStock || 0,
                    newStock: update.newStock || 0,
                    quantity: Math.abs(update.quantity || 0),
                    quantityType: (update.quantity || 0) < 0 ? 'deduction' : 'addition',
                    category: update.category || product?.category || 'Unknown',
                    price: update.price || product?.currentPrice || product?.currentprice || 0,
                    timestamp: new Date().toISOString()
                };
            })
        };
        
        console.log('[InventoryManager] Enhanced transaction created:', {
            id: enhancedTransaction.id,
            type: enhancedTransaction.type,
            updatesCount: enhancedTransaction.updates.length,
            firstUpdate: enhancedTransaction.updates[0] || 'none'
        });
        
        // ADD TO TRANSACTIONS
        transactions.push(enhancedTransaction);
        
        // LIMIT TO LAST 500 TRANSACTIONS (PREVENT LOCALSTORAGE OVERFLOW)
        const MAX_TRANSACTIONS = 500;
        const trimmedTransactions = transactions.slice(-MAX_TRANSACTIONS);
        
        // SAVE TO LOCALSTORAGE
        try {
            localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(trimmedTransactions));
            console.log(`[InventoryManager] ✅ SAVED: Transaction ${enhancedTransaction.id} to localStorage`);
            
            // VERIFY SAVE
            const verify = localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS);
            if (verify) {
                const savedData = JSON.parse(verify);
                const lastTransaction = savedData[savedData.length - 1];
                const saveVerified = lastTransaction && lastTransaction.id === enhancedTransaction.id;
                
                console.log('[InventoryManager] 📋 SAVE VERIFICATION:', {
                    verified: saveVerified ? '✅ SUCCESS' : '❌ FAILED',
                    expectedId: enhancedTransaction.id,
                    savedId: lastTransaction?.id || 'none',
                    totalTransactions: savedData.length
                });
                
                if (!saveVerified) {
                    console.error('[InventoryManager] ❌ SAVE VERIFICATION FAILED!');
                    return false;
                }
            }
            
        } catch (storageError) {
            console.error('[InventoryManager] ❌ ERROR saving to localStorage:', storageError);
            console.error('[InventoryManager] Storage error details:', {
                key: STORAGE_KEYS.INVENTORY_TRANSACTIONS,
                dataSize: JSON.stringify(trimmedTransactions).length,
                errorMessage: storageError.message
            });
            return false;
        }
        
        // DISPATCH EVENT FOR REAL-TIME UPDATES
        window.dispatchEvent(new CustomEvent('inventoryTransactionSaved', {
            detail: { transaction: enhancedTransaction }
        }));
        
        console.log('[InventoryManager] ⚡ TRANSACTION SAVE COMPLETE ⚡');
        return true;
        
    } catch (error) {
        console.error('[InventoryManager] ❌ UNEXPECTED ERROR in saveInventoryTransaction:', error);
        console.error('[InventoryManager] Stack trace:', error.stack);
        return false;
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
        getInventoryTransaction,
        saveInventoryTransaction
    };
})();
