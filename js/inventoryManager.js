// inventoryManager.js - Stock Management & Order Integration
const InventoryManager = (function() {
    // Dependencies
    let ProductsManager = null;
    let OrdersManager = null;
    
    // Initialize with dependencies
    function init(productsMgr, ordersMgr) {
        ProductsManager = productsMgr;
        OrdersManager = ordersMgr;
        
        // Listen for new orders to auto-deduct stock
        setupOrderListener();
        
        return {
            deductStockFromOrder,
            getInventoryReport,
            getLowStockAlert,
            getStockHistory,
            updateStockManually,
            checkStockBeforeAddToCart
        };
    }
    
    // Listen for new orders
    function setupOrderListener() {
        if (!OrdersManager) return;
        
        // Listen for order creation
        window.addEventListener('orderCreated', function(e) {
            if (e.detail && e.detail.orderId) {
                const order = OrdersManager.getOrderById(e.detail.orderId);
                if (order) {
                    deductStockFromOrder(order);
                }
            }
        });
        
        // Also check localStorage changes as backup
        window.addEventListener('storage', function(e) {
            if (e.key === 'beautyhub_orders' && ProductsManager) {
                // Get latest order and deduct stock
                const ordersJSON = localStorage.getItem('beautyhub_orders');
                if (ordersJSON) {
                    try {
                        const orders = JSON.parse(ordersJSON);
                        if (orders.length > 0) {
                            const latestOrder = orders[orders.length - 1];
                            if (latestOrder.status === 'pending') {
                                deductStockFromOrder(latestOrder);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing orders for inventory:', error);
                    }
                }
            }
        });
    }
    
    // Deduct stock when order is placed
    function deductStockFromOrder(order) {
        if (!ProductsManager || !order || !order.items) return false;
        
        console.log('Deducting stock for order:', order.id);
        
        let allSuccessful = true;
        const updates = [];
        
        order.items.forEach(item => {
            const product = ProductsManager.getProductById(item.productId);
            if (product) {
                const newStock = product.stock - item.quantity;
                
                if (newStock < 0) {
                    console.error(`Insufficient stock for ${product.name}. Need ${item.quantity}, have ${product.stock}`);
                    allSuccessful = false;
                    return;
                }
                
                updates.push({
                    productId: product.id,
                    productName: product.name,
                    oldStock: product.stock,
                    newStock: newStock,
                    quantity: item.quantity
                });
                
                // Update product stock
                ProductsManager.updateProduct(product.id, { 
                    stock: newStock,
                    updatedAt: new Date().toISOString()
                });
                
                console.log(`Stock updated: ${product.name} ${product.stock} → ${newStock}`);
            } else {
                console.error(`Product not found: ${item.productId}`);
                allSuccessful = false;
            }
        });
        
        if (allSuccessful && updates.length > 0) {
            // Save inventory transaction log
            // Update the transaction save call in deductStockFromOrder:
saveInventoryTransaction({
    type: 'order_deduction',
    orderId: order.id,
    timestamp: new Date().toISOString(),
    performedBy: order.customerEmail ? `customer:${order.customerEmail}` : 'customer:anonymous',
    referenceId: order.id,
    updates: updates,
    notes: `Stock deducted for order ${order.id} - ${order.firstName} ${order.surname}`
});
            
            console.log('Stock successfully deducted for order:', order.id);
        }
        
        return allSuccessful;
    }
    
    // Get inventory report
    function getInventoryReport() {
        if (!ProductsManager) return null;
        
        const products = ProductsManager.getProducts({ activeOnly: true });
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        
        const lowStock = products.filter(p => p.stock <= 5 && p.stock > 0);
        const outOfStock = products.filter(p => p.stock === 0);
        const healthyStock = products.filter(p => p.stock > 5);
        
        return {
            summary: {
                totalProducts,
                totalStock,
                totalValue: parseFloat(totalValue.toFixed(2)),
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                healthyStockCount: healthyStock.length
            },
            categories: ProductsManager.CATEGORIES.map(category => {
                const catProducts = products.filter(p => p.category === category);
                return {
                    category,
                    count: catProducts.length,
                    totalStock: catProducts.reduce((sum, p) => sum + p.stock, 0),
                    lowStock: catProducts.filter(p => p.stock <= 5 && p.stock > 0).length,
                    outOfStock: catProducts.filter(p => p.stock === 0).length
                };
            }),
            lowStockProducts: lowStock.map(p => ({
                id: p.id,
                name: p.name,
                currentStock: p.stock,
                category: p.category,
                price: p.price
            })),
            outOfStockProducts: outOfStock.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price
            }))
        };
    }
    
    // Get low stock alert
    function getLowStockAlert() {
        if (!ProductsManager) return null;
        
        const lowStock = ProductsManager.getLowStockProducts();
        if (lowStock.length === 0) return null;
        
        return {
            count: lowStock.length,
            products: lowStock.map(p => ({
                name: p.name,
                stock: p.stock,
                category: p.category,
                needsRestock: p.stock <= 2
            }))
        };
    }
    
    // Get stock history (placeholder - would need database)
    function getStockHistory(productId, limit = 10) {
        const transactions = getInventoryTransactions();
        return transactions
            .filter(t => t.updates.some(u => u.productId === productId))
            .slice(0, limit)
            .map(t => ({
                type: t.type,
                timestamp: t.timestamp,
                orderId: t.orderId,
                quantity: t.updates.find(u => u.productId === productId)?.quantity || 0,
                notes: t.notes
            }));
    }
    
    // Update stock manually
    function updateStockManually(productId, quantity, reason = 'manual_adjustment') {
        if (!ProductsManager) return false;
        
        const product = ProductsManager.getProductById(productId);
        if (!product) return false;
        
        const newStock = product.stock + quantity;
        if (newStock < 0) return false;
        
        const success = ProductsManager.updateProduct(productId, { 
            stock: newStock,
            updatedAt: new Date().toISOString()
        });
        
        if (success) {
            // Update the transaction save call in updateStockManually:
saveInventoryTransaction({
    type: reason,
    timestamp: new Date().toISOString(),
    performedBy: 'admin', // Will need to pass actual admin username
    referenceId: '', // Can add admin ID if available
    updates: [{
        productId: product.id,
        productName: product.name,
        oldStock: product.stock,
        newStock: newStock,
        quantity: quantity
    }],
    notes: `Manual adjustment: ${reason}`
});
            
            console.log(`Manual stock update: ${product.name} ${quantity > 0 ? '+' : ''}${quantity} = ${newStock}`);
        }
        
        return success;
    }
    
    // Check stock before adding to cart
    function checkStockBeforeAddToCart(productId, requestedQuantity) {
        if (!ProductsManager) return { available: false, reason: 'System error' };
        
        const product = ProductsManager.getProductById(productId);
        if (!product) return { available: false, reason: 'Product not found' };
        
        if (!product.isActive) return { available: false, reason: 'Product is not available' };
        
        if (product.stock < requestedQuantity) {
            return {
                available: false,
                reason: `Only ${product.stock} units available`,
                availableStock: product.stock
            };
        }
        
        return { available: true, availableStock: product.stock };
    }
    
    // Save inventory transaction (localStorage)
    // Save inventory transaction (enhanced with new schema)
function saveInventoryTransaction(transactionData) {
    const STORAGE_KEY = 'beautyhub_inventory_transactions';
    const existing = localStorage.getItem(STORAGE_KEY);
    const transactions = existing ? JSON.parse(existing) : [];
    
    // Create enhanced transaction with new schema
    const enhancedTransaction = {
        id: `TX-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        type: transactionData.type,
        timestamp: transactionData.timestamp,
        performedBy: transactionData.performedBy || 'system',
        referenceId: transactionData.referenceId || '',
        notes: transactionData.notes || '',
        updates: transactionData.updates.map(update => ({
            productId: update.productId,
            productName: update.productName,
            previousStock: update.oldStock,
            newStock: update.newStock,
            quantity: update.quantity,
            category: ProductsManager.getProductById(update.productId)?.category || ''
        }))
    };
    
    transactions.push(enhancedTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.slice(-100))); // Keep last 100
}
    
    // Get inventory transactions
    function getInventoryTransactions() {
        const STORAGE_KEY = 'beautyhub_inventory_transactions';
        const existing = localStorage.getItem(STORAGE_KEY);
        return existing ? JSON.parse(existing) : [];
    }

 //=============================================
    // getInventoryTransactionsReport()
//=============================================
// Get comprehensive inventory report for analytics
function getInventoryTransactionsReport(filters = {}) {
    const transactions = getInventoryTransactions();
    let filtered = transactions;
    
    // Apply filters
    if (filters.productId) {
        filtered = filtered.filter(t => 
            t.updates.some(u => u.productId === filters.productId)
        );
    }
    if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.category && ProductsManager) {
        filtered = filtered.filter(t => 
            t.updates.some(u => 
                ProductsManager.getProductById(u.productId)?.category === filters.category
            )
        );
    }
    
    // Get unique products from transactions
    const productMap = new Map();
    filtered.forEach(transaction => {
        transaction.updates.forEach(update => {
            if (!productMap.has(update.productId)) {
                const product = ProductsManager.getProductById(update.productId);
                productMap.set(update.productId, {
                    id: update.productId,
                    name: update.productName,
                    category: update.category || product?.category || 'Unknown',
                    currentStock: product?.stock || 0,
                    salesCount: product?.salesCount || 0,
                    lastUpdated: product?.updatedAt || transaction.timestamp,
                    transactions: []
                });
            }
            productMap.get(update.productId).transactions.push({
                type: transaction.type,
                timestamp: transaction.timestamp,
                quantity: update.quantity,
                previousStock: update.previousStock || update.oldStock,
                newStock: update.newStock,
                performedBy: transaction.performedBy,
                referenceId: transaction.referenceId,
                notes: transaction.notes
            });
        });
    });
    
    return {
        summary: {
            totalTransactions: filtered.length,
            totalProducts: productMap.size,
            totalStockChanges: filtered.reduce((sum, t) => 
                sum + t.updates.reduce((s, u) => s + Math.abs(u.quantity), 0), 0
            )
        },
        products: Array.from(productMap.values()).map(product => ({
            ...product,
            transactionCount: product.transactions.length
        })),
        recentTransactions: filtered.slice(-10).map(t => ({
            id: t.id,
            type: t.type,
            timestamp: t.timestamp,
            performedBy: t.performedBy,
            productCount: t.updates.length
        }))
    };
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
        getInventoryTransactionsReport // <-- ADD THIS LINE
    };
})();
