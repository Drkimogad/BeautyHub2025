// ========================================================
// ordersManager.js - Central Order Management System
// UPDATED: Now supports wholesalePrice, currentPrice, retailPrice fields
// Core Functionalities:
// 1. Order lifecycle management with price-tier system
// 2. Customer type-based pricing (wholesale, retail, personal)
// 3. Financial breakdown with tier-specific pricing
// 4. Inventory integration with proper price tracking
// 5. Enhanced order analytics with price type tracking
// ========================================================
// ordersManager.js - UPDATED VERSION
const OrdersManager = (function() {
// ========================================================
    // CONFIGURATION & CONSTANTS
// ========================================================
const CONFIG = {
    STORAGE_KEYS: {
        ORDERS: 'beautyhub_orders',
        ORDER_COUNTER: 'beautyhub_order_id_counter'
    },
    SHIPPING: {
        THRESHOLD: 1000,
        COST: 100
    },
    VAT_PERCENTAGE: 15,
    ORDER_STATUSES: ['pending', 'paid', 'shipped', 'cancelled'],
    CUSTOMER_TYPES: ['personal', 'retailer', 'wholesaler', 'corporate'],
    PAYMENT_METHODS: ['cash on collection', 'eft'],  //['manual', 'payfast', 'credit_card', 'eft']
    ORDER_PRIORITIES: ['low', 'normal', 'high', 'rush'],
    // ADD FIRESTORE CONFIG
    USE_FIRESTORE: true,
    FIRESTORE_COLLECTION: 'orders',
    FIREBASE_READY: () => {
        return typeof firebase !== 'undefined' && 
               firebase.apps && 
               firebase.apps.length > 0 &&
               firebase.firestore;
    }
};
// ========================================================
    // STATE MANAGEMENT
// ========================================================
    let orders = [];
    let orderIdCounter = 1000;

// ========================================================
    // INITIALIZATION
// ========================================================
    function init() {
        console.log('[OrdersManager] Initializing order management system...');
        
        try {
            loadOrders();
            setupEventListeners();
            
            console.log(`[OrdersManager] Loaded ${orders.length} orders from storage`);
            console.log(`[OrdersManager] Pending orders: ${getPendingCount()}`);
            
        } catch (error) {
            console.error('[OrdersManager] Initialization failed:', error);
            throw new Error('Order system initialization failed: ' + error.message);
        }
        
        return {
            orders,
            getPendingCount: getPendingCount
        };
    }

// ========================================================
    // STORAGE FUNCTIONS
// ========================================================
    function loadOrders() {
        console.log('[OrdersManager] Loading orders from storage...');
        
        try {
            const savedOrders = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
            if (savedOrders) {
                orders = JSON.parse(savedOrders) || [];
                console.log(`[OrdersManager] Successfully loaded ${orders.length} orders`);
            } else {
                orders = [];
                console.log('[OrdersManager] No saved orders found');
            }
            
        // CRITICAL: Load orderIdCounter from localStorage
        const savedCounter = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDER_COUNTER);
        if (savedCounter) {
            orderIdCounter = parseInt(savedCounter);
            console.log(`[OrdersManager] Loaded orderIdCounter: ${orderIdCounter}`);
        } else {
            // If no counter saved, find the highest ID from existing orders
            if (orders.length > 0) {
                const highestId = orders.reduce((max, order) => {
                    const idNum = parseInt(order.id.replace(/\D/g, ''));
                    return idNum > max ? idNum : max;
                }, 0);
                orderIdCounter = highestId + 1;
                console.log(`[OrdersManager] Derived orderIdCounter from orders: ${orderIdCounter}`);
            } else {
                orderIdCounter = 1000;
            }
        }
        
    } catch (error) {
        console.error('[OrdersManager] Failed to load orders:', error);
        orderIdCounter = 1000;
        saveOrders();
    }
}


function saveOrders() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        // CRITICAL: Save the counter too!
        localStorage.setItem(CONFIG.STORAGE_KEYS.ORDER_COUNTER, orderIdCounter.toString());
        console.log('[OrdersManager] Orders and counter saved to storage');
    } catch (error) {
        console.error('[OrdersManager] Failed to save orders:', error);
    }
}

    // ========================================================
// FIRESTORE FUNCTIONS
// ========================================================

async function saveOrderToFirestore(order) {
    try {
        console.log('[OrdersManager] Attempting to save order to Firestore:', order.id);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[OrdersManager] Firestore disabled or not ready');
            return false;
        }
        
        const db = firebase.firestore();
        const orderRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(order.id);
        
        console.log('[OrdersManager] Setting order document in Firestore');
        await orderRef.set(order);
        console.log(`[OrdersManager] Saved to Firestore: ${order.id}`);
        return true;
        
    } catch (error) {
        console.error('[OrdersManager] Firestore save error:', error);
        return false;
    }
}

async function loadOrdersFromFirestore() {
    try {
        console.log('[OrdersManager] Loading orders from Firestore...');
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[OrdersManager] Firestore disabled or not ready');
            return [];
        }
        
        const db = firebase.firestore();
        const snapshot = await db.collection(CONFIG.FIRESTORE_COLLECTION).get();
        console.log('[OrdersManager] Firestore query completed, documents:', snapshot.size);
        
        const firestoreOrders = [];
        snapshot.forEach(doc => {
            firestoreOrders.push(doc.data());
        });
        
        console.log(`[OrdersManager] Firestore loaded: ${firestoreOrders.length} orders`);
        return firestoreOrders;
        
    } catch (error) {
        console.error('[OrdersManager] Firestore load error:', error);
        return [];
    }
}

async function updateOrderInFirestore(orderId, updateData) {
    try {
        console.log('[OrdersManager] Updating order in Firestore:', orderId);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[OrdersManager] Firestore disabled or not ready');
            return false;
        }
        
        const db = firebase.firestore();
        const orderRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(orderId);
        
        const updatePayload = {
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        console.log('[OrdersManager] Updating Firestore document');
        await orderRef.update(updatePayload);
        console.log(`[OrdersManager] Updated in Firestore: ${orderId}`);
        return true;
        
    } catch (error) {
        console.error('[OrdersManager] Firestore update error:', error);
        return false;
    }
}
    
// ==========================================================  
// HELPER FUNCTION TO DELETE FROM FIRESTORE   
// ==========================================================  
async function deleteOrderFromFirestore(orderId) {
    try {
        console.log('[OrdersManager] Deleting order from Firestore:', orderId);
        
        if (!CONFIG.FIREBASE_READY() || !CONFIG.USE_FIRESTORE) {
            console.log('[OrdersManager] Firestore disabled or not ready');
            return false;
        }
        
        const db = firebase.firestore();
        const orderRef = db.collection(CONFIG.FIRESTORE_COLLECTION).doc(orderId);
        
        console.log('[OrdersManager] Deleting from Firestore');
        await orderRef.delete();
        console.log(`[OrdersManager] Deleted from Firestore: ${orderId}`);
        return true;
        
    } catch (error) {
        console.error('[OrdersManager] Firestore delete error:', error);
        
        // ========== ADD ERROR NOTIFICATION ==========
        if (typeof window.showDashboardNotification === 'function') {
            window.showDashboardNotification('Failed to delete order from database.', 'error');
        }
        
        return false;
    }
}

// ========================================================
// ORDER DELETION , it deletes with status check.
// ========================================================
function deleteOrder(orderId) {
    console.log(`[OrdersManager] Deleting order ${orderId}`);
    
    try {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.warn(`[OrdersManager] Order ${orderId} not found for deletion`);
            
            // ========== ADD ERROR NOTIFICATION ==========
            if (typeof window.showDashboardNotification === 'function') {
                window.showDashboardNotification('Order not found.', 'error');
            }
            
            return false;
        }
        
        const order = orders[orderIndex];
        
        // Only allow deletion of shipped orders
        if (order.status !== 'shipped') {
            console.warn(`[OrdersManager] Only shipped orders can be deleted. Order status: ${order.status}`);
            console.log('Full order object:', order); // ADD THIS LINE
            
            // ========== ADD ERROR NOTIFICATION ==========
            if (typeof window.showDashboardNotification === 'function') {
                window.showDashboardNotification('Only shipped orders can be deleted.', 'error');
            }
            
            alert('Only shipped orders can be deleted.');
            return false;
        }
        
        // Remove from local storage
        orders = orders.filter(order => order.id !== orderId);
        saveOrders();
        
        // Delete from Firestore
        if (CONFIG.USE_FIRESTORE) {
            deleteOrderFromFirestore(orderId).then(success => {
                console.log(`[OrdersManager] Firestore delete ${success ? 'successful' : 'failed'} for order ${orderId}`);
                
                if (success) {
                    // ========== REFRESH DASHBOARD ==========
                    if (typeof window.refreshDashboardOrders === 'function') {
                        window.refreshDashboardOrders();
                    }
                    
                    // ========== ADD SUCCESS NOTIFICATION ==========
                    if (typeof window.showDashboardNotification === 'function') {
                        window.showDashboardNotification('Order deleted successfully!', 'success');
                    }
                } else {
                    // ========== ADD ERROR NOTIFICATION ==========
                    if (typeof window.showDashboardNotification === 'function') {
                        window.showDashboardNotification('Failed to delete order from database.', 'error');
                    }
                }
            });
        } else {
            // For local storage only (no Firestore)
            // ========== REFRESH DASHBOARD ==========
            if (typeof window.refreshDashboardOrders === 'function') {
                window.refreshDashboardOrders();
            }
            
            // ========== ADD SUCCESS NOTIFICATION ==========
            if (typeof window.showDashboardNotification === 'function') {
                window.showDashboardNotification('Order deleted successfully!', 'success');
            }
        }
        
        updateAdminBadge();
        
        console.log(`[OrdersManager] Order ${orderId} deleted successfully`);
        return true;
        
    } catch (error) {
        console.error(`[OrdersManager] Deletion failed for order ${orderId}:`, error);
        
        // ========== ADD ERROR NOTIFICATION ==========
        if (typeof window.showDashboardNotification === 'function') {
            window.showDashboardNotification('Error deleting order. Please try again.', 'error');
        }
        
        return false;
    }
}
// Update loadOrders to include Firestore
function loadOrders() {
    console.log('[OrdersManager] Loading orders from storage...');
    
    try {
        // Try localStorage first
        const savedOrders = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
        if (savedOrders) {
            orders = JSON.parse(savedOrders) || [];
            console.log(`[OrdersManager] Successfully loaded ${orders.length} orders from localStorage`);
        } else {
            orders = [];
            console.log('[OrdersManager] No saved orders found in localStorage');
        }
        
        const savedCounter = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDER_COUNTER);
        if (savedCounter) {
            orderIdCounter = parseInt(savedCounter) || 1000;
        }
        
        // Load from Firestore in background
        if (CONFIG.USE_FIRESTORE) {
            loadOrdersFromFirestore().then(firestoreOrders => {
                if (firestoreOrders.length > 0) {
                    console.log('[OrdersManager] Merging Firestore orders with localStorage');
                    // Merge strategy: Firestore overwrites localStorage
                    const firestoreIds = new Set(firestoreOrders.map(o => o.id));
                    const localOnly = orders.filter(o => !firestoreIds.has(o.id));
                    orders = [...firestoreOrders, ...localOnly];
                    saveOrders(); // Save merged data to localStorage
                }
            });
        }
        
    } catch (error) {
        console.error('[OrdersManager] Failed to load orders:', error);
        orders = [];
        orderIdCounter = 1000;
        saveOrders();
    }
}
    

    // ========================================================
    // ORDER CREATION WITH TIERED PRICING
    // ========================================================
    function createOrder(customerData) {
        console.log('[OrdersManager] Creating new order with tiered pricing...', customerData);
        
        try {
            // Validate input
            if (!customerData || !customerData.cartItems || customerData.cartItems.length === 0) {
                console.error('[OrdersManager] Cannot create order: No cart items');
                throw new Error('No cart items provided');
            }

            // Generate order ID
            const orderId = generateOrderId();
            console.log(`[OrdersManager] Generated order ID: ${orderId}`);
            
            // Determine customer type and price tier
            const customerType = validateCustomerType(customerData.customerType);
            const priceTier = getPriceTierForCustomer(customerType);
            
            // Calculate financials with tier-specific pricing
            const { subtotal, itemsWithPricing } = calculateOrderWithTieredPricing(customerData.cartItems, customerType);
            const shipping = calculateShipping(subtotal);
            const total = subtotal + shipping;
            const isFreeShipping = shipping === 0;
            
            // Build order object
            const newOrder = {
                id: orderId,
                // Customer Information
                firstName: customerData.firstName?.trim() || '',
                surname: customerData.surname?.trim() || '',
                customerPhone: customerData.customerPhone?.trim() || '',
                customerWhatsApp: customerData.customerWhatsApp?.trim() || '',
                customerEmail: customerData.customerEmail?.trim() || '',
                shippingAddress: customerData.shippingAddress?.trim() || '',
                
                // Customer Classification
                customerType: customerType,
                priceTier: priceTier,
                preferredPaymentMethod: validatePaymentMethod(customerData.preferredPaymentMethod),
                priority: validatePriority(customerData.priority),
                
                // Order Items with tier-specific pricing
                items: itemsWithPricing,
                
                // Financial Information
                subtotal: subtotal,
                shippingCost: shipping,
                shippingThreshold: CONFIG.SHIPPING.THRESHOLD,
                isFreeShipping: isFreeShipping,
                discount: parseFloat(customerData.discount) || 0,
                tax: calculateTax(subtotal),
                totalAmount: total,
                
                // Order Status
                status: 'pending',
                paymentMethod: customerData.paymentMethod || 'manual',
                shippingDate: '',
                
                // Timestamps
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                
                // Notes
                notes: customerData.orderNotes?.trim() || '',
                adminNotes: customerData.adminNotes?.trim() || '',
                
                // Cancellation Info
                cancellationReason: '',
                refundAmount: 0,
                cancelledAt: '',
                cancelledBy: '',
                
                // Policies
                returnPolicy: "No returns on damaged products. 7-day return for unused items with original packaging.",
                
                // Analytics
                hasDiscount: (customerData.discount || 0) > 0,
                usedFreeShipping: isFreeShipping,
                priceTierApplied: priceTier
            };

            // Add to orders array
            orders.push(newOrder);
            saveOrders();

                    // Save to Firestore
        if (CONFIG.USE_FIRESTORE) {
            saveOrderToFirestore(newOrder).then(success => {
                console.log(`[OrdersManager] Firestore save ${success ? 'successful' : 'failed'} for order ${orderId}`);
            });
        }
            
            // Update admin badge
            updateAdminBadge();
            
            console.log(`[OrdersManager] Order created successfully: ${orderId}`);
            console.log(`[OrdersManager] Price tier applied: ${priceTier}`);
            console.log(`[OrdersManager] Order summary: Subtotal R${subtotal.toFixed(2)}, Shipping R${shipping.toFixed(2)}, Total R${total.toFixed(2)}`);
            
            return newOrder;
            
        } catch (error) {
            console.error('[OrdersManager] Order creation failed:', error);
            return null;
        }
    }

    // ========================================================
    // TIERED PRICING FUNCTIONS
    // ========================================================
    function getPriceTierForCustomer(customerType) {
        switch(customerType) {
            case 'wholesaler':
                return 'wholesale';
            case 'retailer':
                return 'retail';
            case 'corporate':
                return 'wholesale'; // Corporate gets wholesale pricing
            default:
                return 'retail'; // Personal customers get retail pricing
        }
    }

    function getPriceForCustomer(item, customerType) {
        try {
            // Determine which price field to use
            switch(customerType) {
                case 'wholesaler':
                case 'corporate':
                    return parseFloat(item.wholesalePrice || item.price || 0);
                case 'retailer':
                    return parseFloat(item.currentPrice || item.price || 0);
                default: // personal
                    return parseFloat(item.currentPrice || item.price || 0);
            }
        } catch (error) {
            console.error('[OrdersManager] Price calculation failed:', error);
            return parseFloat(item.price || 0);
        }
    }

    function calculateOrderWithTieredPricing(cartItems, customerType) {
        try {
            let subtotal = 0;
            const itemsWithPricing = cartItems.map(item => {
                const unitPrice = getPriceForCustomer(item, customerType);
                const quantity = parseInt(item.quantity) || 1;
                const itemTotal = unitPrice * quantity;
                subtotal += itemTotal;
                
                // Determine price type for display
                let priceType = 'currentPrice';
                if (customerType === 'wholesaler' || customerType === 'corporate') {
                    priceType = 'wholesalePrice';
                }
                
                return {
                    productId: item.productId || '',
                    productName: item.productName || '',
                    price: unitPrice,
                    wholesalePrice: parseFloat(item.wholesalePrice) || unitPrice,
                    retailPrice: parseFloat(item.retailPrice) || unitPrice,
                    currentPrice: parseFloat(item.currentPrice) || unitPrice,
                    priceType: priceType,
                    quantity: quantity,
                    imageUrl: item.imageUrl || 'gallery/placeholder.jpg',
                    isDiscounted: item.isDiscounted || false,
                    finalPrice: unitPrice
                };
            });
            
            return {
                subtotal: parseFloat(subtotal.toFixed(2)),
                itemsWithPricing: itemsWithPricing
            };
            
        } catch (error) {
            console.error('[OrdersManager] Tiered pricing calculation failed:', error);
            return { subtotal: 0, itemsWithPricing: [] };
        }
    }

    // ========================================================
    // ORDER ID GENERATION
    // ========================================================
    function generateOrderId() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const counter = (orderIdCounter++).toString().padStart(4, '0');
        
        return `ORD${year}${month}${day}${counter}`;
    }

    // ========================================================
    // FINANCIAL CALCULATIONS
    // ========================================================
    function calculateShipping(subtotal) {
        return subtotal >= CONFIG.SHIPPING.THRESHOLD ? 0 : CONFIG.SHIPPING.COST;
    }

    function calculateTax(amount) {
        return parseFloat((amount * (CONFIG.VAT_PERCENTAGE / 100)).toFixed(2));
    }

    // ========================================================
    // VALIDATION FUNCTIONS
    // ========================================================
    function validateCustomerType(type) {
        return CONFIG.CUSTOMER_TYPES.includes(type) ? type : 'personal';
    }

    function validatePaymentMethod(method) {
        return CONFIG.PAYMENT_METHODS.includes(method) ? method : 'manual';
    }

    function validatePriority(priority) {
        return CONFIG.ORDER_PRIORITIES.includes(priority) ? priority : 'normal';
    }

    // ========================================================
    // ORDER QUERY FUNCTIONS
    // ========================================================
    function getOrders(status = null) {
        if (!status) return [...orders];
        return orders.filter(order => order.status === status);
    }

    function getOrderById(orderId) {
        return orders.find(order => order.id === orderId);
    }

    function getPendingCount() {
        return orders.filter(order => order.status === 'pending').length;
    }

    function getLastOrderId() {
        if (orders.length === 0) return null;
        return orders[orders.length - 1].id;
    }

    // ========================================================
    // ORDER STATUS MANAGEMENT
    // ========================================================
function updateOrderStatus(orderId, newStatus, shippingDate = '') {
    console.log(`[OrdersManager] Updating order ${orderId} status to ${newStatus}`);
    
    try {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.error(`[OrdersManager] Order ${orderId} not found`);
            return false;
        }
        
        if (!CONFIG.ORDER_STATUSES.includes(newStatus)) {
            console.error(`[OrdersManager] Invalid status: ${newStatus}`);
            return false;
        }
        
        // Update local order
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();
        
        if (newStatus === 'shipped' && shippingDate) {
            orders[orderIndex].shippingDate = shippingDate;
        }
        
        saveOrders();
        
        // Update Firestore
        const updateData = {
            status: newStatus,
            updatedAt: orders[orderIndex].updatedAt
        };
        
        if (newStatus === 'shipped' && shippingDate) {
            updateData.shippingDate = shippingDate;
        }
        
        if (CONFIG.USE_FIRESTORE) {
            updateOrderInFirestore(orderId, updateData).then(success => {
                console.log(`[OrdersManager] Firestore update ${success ? 'successful' : 'failed'} for order ${orderId}`);
            });
        }
        
        updateAdminBadge();
        
        console.log(`[OrdersManager] Order ${orderId} status updated successfully`);
            // ========== ADD THESE LINES ==========
    // Refresh dashboard if open
    if (typeof window.refreshDashboardOrders === 'function') {
        console.log('[OrdersManager] Calling dashboard refresh...');
        window.refreshDashboardOrders();
    }
    // ========== END ADDITION ==========
        return true;
    
    } catch (error) {
        console.error(`[OrdersManager] Failed to update order status:`, error);
        return false;
    }
}

    function markAsPaid(orderId) {
        return updateOrderStatus(orderId, 'paid');
    }

    function markAsShipped(orderId, shippingDate = '') {
        console.log(`[OrdersManager] Marking order ${orderId} as shipped`);
        
        try {
            // Validate order exists
            const order = getOrderById(orderId);
            if (!order) {
                console.error(`[OrdersManager] Order ${orderId} not found for shipping`);
                return false;
            }
            
            // Default shipping date to today
            if (!shippingDate) {
                shippingDate = new Date().toISOString().split('T')[0];
            }
            
            // Update inventory stock using InventoryManager if available
if (typeof InventoryManager !== 'undefined' && 
    typeof InventoryManager.deductStockFromOrder === 'function') {
    console.log(`[OrdersManager] Updating inventory via InventoryManager for shipped order ${orderId}`);
    
    const inventorySuccess = InventoryManager.deductStockFromOrder(order);
    if (!inventorySuccess) {
        console.error(`[OrdersManager] Inventory update failed for order ${orderId}`);
        alert(`Cannot ship order ${orderId}. Inventory update failed.`);
        return false;
    }
} 
// Fallback to ProductsManager if InventoryManager not available
else if (typeof ProductsManager !== 'undefined') {
    console.log(`[OrdersManager] Updating inventory via ProductsManager for shipped order ${orderId}`);
    
    let allStockDeducted = true;
    const failedItems = [];
    
    order.items.forEach(item => {
        const success = ProductsManager.updateStock(item.productId, -item.quantity);
        if (!success) {
            allStockDeducted = false;
            failedItems.push(item.productName);
        }
    });
    
    if (!allStockDeducted) {
        const errorMsg = `Cannot ship order ${orderId}. Insufficient stock for: ${failedItems.join(', ')}`;
        console.error(`[OrdersManager] ${errorMsg}`);
        alert(errorMsg);
        return false;
    }
}
            
            // Update order status
            const success = updateOrderStatus(orderId, 'shipped', shippingDate);
            
            if (success) {
                console.log(`[OrdersManager] Order ${orderId} marked as shipped on ${shippingDate}`);
            }
            
            return success;
            
        } catch (error) {
            console.error(`[OrdersManager] Shipping failed for order ${orderId}:`, error);
            return false;
        }
    }

    // ========================================================
    // ORDER CANCELLATION. Remove refund logic for pending-only cancellation:
    // ========================================================
function cancelOrder(orderId, cancellationData) {
    console.log(`[OrdersManager] Cancelling order ${orderId}`, cancellationData);
    
    try {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.error(`[OrdersManager] Order ${orderId} not found`);
            return false;
        }
        
        // Check if order is pending (only pending can be cancelled)
        if (orders[orderIndex].status !== 'pending') {
            console.error(`[OrdersManager] Only pending orders can be cancelled. Order status: ${orders[orderIndex].status}`);
            alert('Only pending orders can be cancelled.');
            return false;
        }
        
        // Update order with cancellation data
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].cancellationReason = cancellationData.reason || '';
        orders[orderIndex].cancelledAt = new Date().toISOString();
        orders[orderIndex].cancelledBy = cancellationData.cancelledBy || 'admin';
        orders[orderIndex].updatedAt = new Date().toISOString();
        
        // Restore inventory stock
        if (typeof ProductsManager !== 'undefined') {
            console.log(`[OrdersManager] Restoring inventory for cancelled order ${orderId}`);
            orders[orderIndex].items.forEach(item => {
                ProductsManager.updateStock(item.productId, item.quantity);
            });
        }
        
        saveOrders();
        
        // Update Firestore
        const updateData = {
            status: 'cancelled',
            cancellationReason: cancellationData.reason || '',
            cancelledAt: orders[orderIndex].cancelledAt,
            cancelledBy: cancellationData.cancelledBy || 'admin',
            updatedAt: orders[orderIndex].updatedAt
        };
        
        if (CONFIG.USE_FIRESTORE) {
            updateOrderInFirestore(orderId, updateData).then(success => {
                console.log(`[OrdersManager] Firestore cancellation ${success ? 'successful' : 'failed'} for order ${orderId}`);
            });
        }
        
        updateAdminBadge();
        
        console.log(`[OrdersManager] Order ${orderId} cancelled successfully`);
        return true;
        
    } catch (error) {
        console.error(`[OrdersManager] Cancellation failed for order ${orderId}:`, error);
        return false;
    }
}

//===========================================================
    //Add a function to generate cancelled orders:
//====================================================
function generateCancelledOrderCardHTML(order) {
    try {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        
        return `
            <div class="cancelled-order-card" data-order-id="${order.id}" style="
                background: #fff8e1;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                border: 1px solid #ffecb3;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; color: #5d4037;">${order.id}</h3>
                        <div style="color: #8d6e63; font-size: 0.9rem;">
                            ${orderDate} • ${order.customerType ? order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1) : 'Personal'} Customer
                        </div>
                        <div style="margin-top: 0.5rem; font-weight: 600; color: #5d4037;">
                            ${order.firstName} ${order.surname}
                        </div>
                        <div style="color: #8d6e63; font-size: 0.9rem;">
                            ${order.customerPhone}${order.customerEmail ? ` • ${order.customerEmail}` : ''}
                        </div>
                    </div>
                    <div>
                        <span style="
                            background: #ff9800;
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                            CANCELLED
                        </span>
                        <div style="text-align: right; margin-top: 0.5rem; font-weight: bold; font-size: 1.2rem; color: #5d4037;">
                            R${order.totalAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
                
                <div style="background: #ffecb3; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                    <div style="font-weight: 600; color: #5d4037; margin-bottom: 0.5rem;">
                        Cancellation Details
                    </div>
                    <div style="color: #8d6e63; font-size: 0.9rem;">
                        <div><strong>Reason:</strong> ${order.cancellationReason || 'Not specified'}</div>
                        <div><strong>Cancelled By:</strong> ${order.cancelledBy || 'Admin'}</div>
                        <div><strong>Cancelled On:</strong> ${new Date(order.cancelledAt).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn view-details" data-order-id="${order.id}" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #ff9800;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-eye" style="margin-right: 0.5rem;"></i>
                        View Details
                    </button>
                    
                    <button class="action-btn print-order" data-order-id="${order.id}" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #5d4037;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-print" style="margin-right: 0.5rem;"></i>
                        Print
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[OrdersManager] Failed to generate cancelled order card:', error);
        return '<div class="order-error">Failed to load cancelled order</div>';
    }
}
    // ========================================================
    // ADMIN UI FUNCTIONS
    // ========================================================
    function updateAdminBadge() {
        try {
            const badge = document.getElementById('admin-badge');
            if (badge) {
                const count = getPendingCount();
                badge.textContent = count > 0 ? count.toString() : '';
                badge.style.display = count > 0 ? 'flex' : 'none';
                console.log(`[OrdersManager] Admin badge updated: ${count} pending orders`);
            }
        } catch (error) {
            console.error('[OrdersManager] Failed to update admin badge:', error);
        }
    }

    // ========================================================
    // ORDER RENDERING FUNCTIONS
    // ========================================================
    function renderOrders(statusFilter = 'pending', containerId = 'pending-orders') {
        console.log(`[OrdersManager] Rendering ${statusFilter} orders in ${containerId}`);
        
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[OrdersManager] Container ${containerId} not found`);
                return;
            }
            
            const filteredOrders = getOrders(statusFilter);
            
            if (filteredOrders.length === 0) {
                container.innerHTML = '<div class="no-orders">No orders found</div>';
                console.log(`[OrdersManager] No ${statusFilter} orders to display`);
                return;
            }
            
            container.innerHTML = filteredOrders.map(order => generateOrderCardHTML(order)).join('');
            console.log(`[OrdersManager] Rendered ${filteredOrders.length} ${statusFilter} orders`);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to render orders:', error);
        }
    }

        function renderCancelledDashboardOrders() {
    try {
        console.log('[Dashboard] Rendering cancelled orders');
        
        const container = document.getElementById('dashboard-orders-container');
        if (!container) {
            console.error('[Dashboard] Orders container not found');
            return;
        }
        
        container.innerHTML = '<div class="loading-content"><i class="fas fa-spinner fa-spin"></i><h3>Loading Cancelled Orders...</h3></div>';
        
        // Get cancelled orders directly
        setTimeout(() => {
            try {
                let cancelledOrders = [];
                
                if (typeof OrdersManager !== 'undefined') {
                    if (typeof OrdersManager.getOrders === 'function') {
                        cancelledOrders = OrdersManager.getOrders('cancelled');
                    } else if (OrdersManager.orders) {
                        cancelledOrders = OrdersManager.orders.filter(order => order.status === 'cancelled');
                    }
                } else {
                    // Fallback: localStorage
                    const ordersJSON = localStorage.getItem('beautyhub_orders');
                    if (ordersJSON) {
                        const allOrders = JSON.parse(ordersJSON) || [];
                        cancelledOrders = allOrders.filter(order => order.status === 'cancelled');
                    }
                }
                
                if (cancelledOrders.length === 0) {
                    container.innerHTML = getNoOrdersHTML('No Cancelled Orders', 'All orders are active or completed.');
                    return;
                }
                
                container.innerHTML = getOrdersGridHTML(cancelledOrders);
                
            } catch (error) {
                console.error('[Dashboard] Failed to load cancelled orders:', error);
                container.innerHTML = '<div class="error-content"><i class="fas fa-exclamation-triangle"></i><h3>Error loading cancelled orders</h3><p>Please try again</p></div>';
            }
        }, 300);
    } catch (error) {
        console.error('[Dashboard] Failed to render cancelled orders:', error);
    }
}

    function renderCompletedOrders(containerId = 'completed-orders-list') {
        console.log(`[OrdersManager] Rendering completed orders in ${containerId}`);
        
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[OrdersManager] Container ${containerId} not found`);
                return;
            }
            
            const completedOrders = getOrders('shipped');
            
            if (completedOrders.length === 0) {
                container.innerHTML = '<div class="no-orders">No completed orders</div>';
                console.log('[OrdersManager] No completed orders to display');
                return;
            }
            
            container.innerHTML = completedOrders.map(order => generateCompletedOrderCardHTML(order)).join('');
            console.log(`[OrdersManager] Rendered ${completedOrders.length} completed orders`);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to render completed orders:', error);
        }
    }

    // ========================================================
    // HTML GENERATION FUNCTIONS WITH TIERED PRICING DISPLAY
    // ========================================================
    function generateOrderCardHTML(order) {
        try {
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            const orderTime = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const statusColors = {
                pending: '#ff9800',
                paid: '#2196f3',
                shipped: '#4caf50',
                cancelled: '#9e9e9e'
            };
            
            const priorityColors = {
                low: '#9e9e9e',
                normal: '#4CAF50',
                high: '#ff9800',
                rush: '#ff5252'
            };
            
            const priceTierBadges = {
                wholesale: { text: 'WHOLESALE', color: '#9c27b0', icon: 'fas fa-industry' },
                retail: { text: 'RETAIL', color: '#2196f3', icon: 'fas fa-store' },
                personal: { text: 'PERSONAL', color: '#4CAF50', icon: 'fas fa-user' }
            };
            
            const priceTier = order.priceTier || 'retail';
            const tierBadge = priceTierBadges[priceTier] || priceTierBadges.retail;
            
            return `
                <div class="order-card-detailed" data-order-id="${order.id}">
                    <!-- Order Header -->
                    <div class="order-header-detailed">
                        <div class="order-id-date">
                            <h3>${order.id}</h3>
                            <div class="order-timestamp">${orderDate} ${orderTime}</div>
                            <div class="customer-tier">
                                <span class="tier-badge" style="background: ${tierBadge.color}">
                                    <i class="${tierBadge.icon}"></i>
                                    ${tierBadge.text}
                                </span>
                            </div>
                        </div>
                        <div class="order-status-detailed">
                            <span class="status-badge" style="background: ${statusColors[order.status] || '#666'}">
                                ${order.status.toUpperCase()}
                            </span>
                            ${order.priority && order.priority !== 'normal' ? `
                            <span class="priority-badge" style="background: ${priorityColors[order.priority] || '#4CAF50'}">
                                ${order.priority.toUpperCase()}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Customer Information -->
                    <div class="order-customer-detailed">
                        <div class="customer-info">
                            <div class="customer-name">${order.firstName} ${order.surname}</div>
                            <div class="customer-type-display">
                                <i class="fas fa-tag"></i>
                                ${order.customerType.toUpperCase()} CUSTOMER
                            </div>
                            <div class="customer-contact">
                                <i class="fas fa-phone"></i>
                                ${order.customerPhone}
                            </div>
                            ${order.customerEmail ? `
                            <div class="customer-email">
                                <i class="fas fa-envelope"></i>
                                ${order.customerEmail}
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="shipping-info">
                            <div class="shipping-label">
                                <i class="fas fa-truck"></i>
                                Shipping Address:
                            </div>
                            <div class="address-text">${order.shippingAddress}</div>
                        </div>
                    </div>
                    
                    <!-- Order Items with Price Type Indicators -->
                    <div class="order-items-detailed">
                        <h4><i class="fas fa-shopping-basket"></i> Order Items:</h4>
                        ${generateOrderItemsHTML(order.items, order.priceTier)}
                    </div>
                    
                    <!-- Financial Breakdown -->
                    ${generateFinancialBreakdownHTML(order)}
                    
                    <!-- Customer Notes -->
                    ${order.notes ? `
                    <div class="order-notes">
                        <div class="notes-label">
                            <i class="fas fa-sticky-note"></i>
                            Customer Notes:
                        </div>
                        <div class="notes-text">${order.notes}</div>
                    </div>
                    ` : ''}
                    
                    <!-- Return Policy -->
                    ${order.returnPolicy ? `
                    <div class="return-policy">
                        <i class="fas fa-undo"></i>
                        <strong>Return Policy:</strong> ${order.returnPolicy}
                    </div>
                    ` : ''}
<!-- Order Actions -->
<div class="order-actions-detailed">
    ${order.status === 'pending' ? `
    <button class="action-btn mark-paid" data-order-id="${order.id}">
        <i class="fas fa-check-circle"></i>
        Mark as Paid
    </button>
    
    <button class="action-btn cancel-order" data-order-id="${order.id}">
        <i class="fas fa-ban"></i>
        Cancel Order
    </button>
    
    <button class="action-btn view-details" data-order-id="${order.id}">
        <i class="fas fa-eye"></i>
        Details
    </button>
    ` : ''}
    
    ${order.status === 'paid' ? `
    <button class="action-btn mark-shipped" data-order-id="${order.id}">
        <i class="fas fa-shipping-fast"></i>
        Mark as Shipped
    </button>
    
    <button class="action-btn view-details" data-order-id="${order.id}">
        <i class="fas fa-eye"></i>
        Details
    </button>
    ` : ''}
    
    ${order.status === 'shipped' || order.status === 'cancelled' ? `
    <button class="action-btn view-details" data-order-id="${order.id}">
        <i class="fas fa-eye"></i>
        Details
    </button>
    ` : ''}
</div>    
                </div>
            `;
        } catch (error) {
            console.error('[OrdersManager] Failed to generate order card HTML:', error);
            return '<div class="order-error">Failed to load order details</div>';
        }
    }

    function generateOrderItemsHTML(items, priceTier) {
        try {
            return items.map(item => {
                const itemTotal = (item.finalPrice || item.price || 0) * (item.quantity || 1);
                const priceType = item.priceType || 'currentPrice';
                
                // Price type indicators
                let priceTypeLabel = 'Standard';
                let priceTypeColor = '#2196f3';
                let priceTypeIcon = 'fas fa-tag';
                
                if (priceType === 'wholesalePrice') {
                    priceTypeLabel = 'Wholesale';
                    priceTypeColor = '#9c27b0';
                    priceTypeIcon = 'fas fa-industry';
                } else if (priceType === 'retailPrice') {
                    priceTypeLabel = 'Retail';
                    priceTypeColor = '#4CAF50';
                    priceTypeIcon = 'fas fa-store';
                }
                
                return `
                    <div class="detailed-item">
                        <img src="${item.imageUrl}" alt="${item.productName}">
                        <div class="item-details">
                            <div class="item-name">
                                ${item.productName}
                                <span class="price-type-badge" style="background: ${priceTypeColor}">
                                    <i class="${priceTypeIcon}"></i>
                                    ${priceTypeLabel}
                                </span>
                                ${item.isDiscounted ? '<span class="discount-badge">(Discounted)</span>' : ''}
                            </div>
                            <div class="item-pricing-details">
                                <div class="item-meta">
                                    <span class="item-quantity">×${item.quantity}</span>
                                    <span class="item-price">R${(item.finalPrice || item.price || 0).toFixed(2)} each</span>
                                </div>
                                ${priceTier === 'wholesale' && item.retailPrice ? `
                                <div class="price-comparison">
                                    <span class="retail-price">Retail: R${item.retailPrice.toFixed(2)}</span>
                                    <span class="savings">Save: R${(item.retailPrice - (item.finalPrice || item.price || 0)).toFixed(2)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="item-total">R${itemTotal.toFixed(2)}</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('[OrdersManager] Failed to generate items HTML:', error);
            return '<div class="item-error">Failed to load items</div>';
        }
    }

    function generateFinancialBreakdownHTML(order) {
        try {
            const savings = order.items.reduce((total, item) => {
                if (item.retailPrice && item.priceType === 'wholesalePrice') {
                    return total + ((item.retailPrice - (item.finalPrice || item.price || 0)) * item.quantity);
                }
                return total;
            }, 0);
            
            return `
                <div class="order-financial-breakdown">
                    <h4><i class="fas fa-chart-bar"></i> Order Summary</h4>
                    
                    <div class="breakdown-row">
                        <span>Subtotal:</span>
                        <span>R${order.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div class="breakdown-row">
                        <span>Shipping:</span>
                        <span class="${order.shippingCost === 0 ? 'free-shipping' : ''}">
                            ${order.shippingCost === 0 ? 'FREE' : `R${order.shippingCost.toFixed(2)}`}
                        </span>
                    </div>
                    
                    ${order.discount > 0 ? `
                    <div class="breakdown-row discount-row">
                        <span>Discount:</span>
                        <span>-R${order.discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${savings > 0 ? `
                    <div class="breakdown-row savings-row">
                        <span>Wholesale Savings:</span>
                        <span>-R${savings.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${order.tax > 0 ? `
                    <div class="breakdown-row">
                        <span>Tax (${CONFIG.VAT_PERCENTAGE}%):</span>
                        <span>R${order.tax.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="breakdown-row total-row">
                        <span>Total Amount:</span>
                        <span>R${order.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    ${order.isFreeShipping ? `
                    <div class="free-shipping-note">
                        <i class="fas fa-shipping-fast"></i>
                        Free shipping applied (over R${order.shippingThreshold})
                    </div>
                    ` : ''}
                    
                    ${savings > 0 ? `
                    <div class="savings-summary">
                        <i class="fas fa-piggy-bank"></i>
                        Total savings with ${order.priceTier || 'wholesale'} pricing: R${savings.toFixed(2)}
                    </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            console.error('[OrdersManager] Failed to generate financial breakdown HTML:', error);
            return '';
        }
    }

    // ========================================================
    // ORDER DETAILS MODAL
    // ========================================================
    function showOrderDetails(orderId) {
        console.log(`[OrdersManager] Showing details for order ${orderId}`);
        
        try {
            const order = getOrderById(orderId);
            if (!order) {
                console.error(`[OrdersManager] Order ${orderId} not found`);
                return;
            }
            
            createOrderDetailsModal(order);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to show order details:', error);
        }
    }

    // ========================================================
    // CANCELLATION MODAL
    // ========================================================
    function showCancellationModal(orderId) {
        console.log(`[OrdersManager] Showing cancellation modal for order ${orderId}`);
        
        try {
            const order = getOrderById(orderId);
            if (!order) {
                console.error(`[OrdersManager] Order ${orderId} not found`);
                return;
            }
            
            createCancellationModal(order);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to show cancellation modal:', error);
        }
    }

    // ========================================================
    // SHIPPING DATE INPUT
    // ========================================================
    function showShippingDateInput(orderId) {
        console.log(`[OrdersManager] Requesting shipping date for order ${orderId}`);
        
        try {
            const defaultDate = new Date().toISOString().split('T')[0];
            const dateInput = prompt('Enter shipping date (YYYY-MM-DD) or leave empty for today:', defaultDate);
            
            if (dateInput === null) {
                console.log('[OrdersManager] User cancelled shipping date input');
                return false;
            }
            
            let shippingDate = dateInput.trim();
            
            // Validate date format
            if (shippingDate && !/^\d{4}-\d{2}-\d{2}$/.test(shippingDate)) {
                alert('Please enter date in YYYY-MM-DD format');
                console.warn('[OrdersManager] Invalid date format entered');
                return false;
            }
            
            const success = markAsShipped(orderId, shippingDate || defaultDate);
            
            if (success) {
                console.log(`[OrdersManager] Order ${orderId} shipped successfully`);
                renderOrders();
                renderCompletedOrders();
            }
            
            return success;
            
        } catch (error) {
            console.error('[OrdersManager] Shipping date input failed:', error);
            return false;
        }
    }

    // ========================================================
    // PRINT ORDER DETAILS
    // ========================================================
    function printOrderDetails(order) {
        console.log(`[OrdersManager] Printing order ${order.id}`);
        
        try {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(generatePrintHTML(order));
            printWindow.document.close();
            
        } catch (error) {
            console.error('[OrdersManager] Failed to print order details:', error);
            alert('Failed to print order. Please try again.');
        }
    }

    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    function setupEventListeners() {
        console.log('[OrdersManager] Setting up event listeners...');
        
        try {
            document.addEventListener('click', handleOrderActions);
            console.log('[OrdersManager] Event listeners setup complete');
            
        } catch (error) {
            console.error('[OrdersManager] Failed to setup event listeners:', error);
        }
    }

    function handleOrderActions(e) {
        try {
            const orderId = e.target.dataset.orderId;
            if (!orderId) return;

              // Only handle if we're NOT in a dashboard card
        const inDashboardCard = e.target.closest('.dashboard-order-card');
        if (inDashboardCard) {
            return; // Let admin.js handle dashboard actions
        }
            
            // Mark as paid
            if (e.target.classList.contains('mark-paid') && !e.target.disabled) {
                console.log(`[OrdersManager] Marking order ${orderId} as paid`);

                if (markAsPaid(orderId)) {
                    e.target.textContent = '✓ Paid';
                    e.target.disabled = true;
                    e.target.classList.add('disabled');
                     renderOrders(); // IT IS HANDLED IN ADMIN.JD
                }
            }
            
            // Mark as shipped
            if (e.target.classList.contains('mark-shipped') && !e.target.disabled) {
                console.log(`[OrdersManager] Marking order ${orderId} as shipped`);
                if (showShippingDateInput(orderId)) {
                    e.target.textContent = '✓ Shipped';
                    e.target.disabled = true;
                    e.target.classList.add('disabled');
                }
            }
            
            // Cancel order
            if (e.target.classList.contains('cancel-order')) {
                console.log(`[OrdersManager] Cancelling order ${orderId}`);
                showCancellationModal(orderId);
            }
            
            // Delete order
            if (e.target.classList.contains('delete-order')) {
                console.log(`[OrdersManager] Deleting order ${orderId}`);
                if (confirm('Are you sure you want to delete this order?')) {
                    if (deleteOrder(orderId)) {
                        e.target.closest('.order-card-detailed')?.remove();
                    }
                }
            }
            
            // View details
            if (e.target.classList.contains('view-details')) {
                console.log(`[OrdersManager] Viewing details for order ${orderId}`);
                showOrderDetails(orderId);
            }
            
        } catch (error) {
            console.error('[OrdersManager] Order action handler failed:', error);
        }
    }

// ========================================================
// ORDER DETAILS MODAL - FULLY IMPLEMENTED
// ========================================================
function createOrderDetailsModal(order) {
    console.log(`[OrdersManager] Creating details modal for order ${order.id}`);
    
    try {
        // Create or update modal
        let modal = document.getElementById('order-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'order-details-modal';
            modal.className = 'order-details-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(modal);
        }
        
        const orderDate = new Date(order.createdAt).toLocaleString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not shipped yet';
        
        // Build items list with tiered pricing display
        let itemsHtml = '';
        order.items.forEach(item => {
            const itemTotal = (item.finalPrice || item.price || 0) * (item.quantity || 1);
            itemsHtml += `
            <div class="order-item" style="
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid #eee;
            ">
                <div class="item-name">
                    ${item.productName} × ${item.quantity}
                    ${item.isDiscounted ? '<span style="color:#e91e63; font-size:0.9em; margin-left:0.5rem;">(Discounted)</span>' : ''}
                    ${item.priceType === 'wholesalePrice' ? '<span style="color:#9c27b0; font-size:0.9em; margin-left:0.5rem;">(Wholesale)</span>' : ''}
                    ${item.priceType === 'retailPrice' ? '<span style="color:#4CAF50; font-size:0.9em; margin-left:0.5rem;">(Retail)</span>' : ''}
                </div>
                <div class="item-price">R${itemTotal.toFixed(2)}</div>
            </div>`;
        });
        
        // Financial breakdown with tiered pricing
        const financialBreakdown = `
        <div style="
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
        ">
            <h4 style="margin-top: 0; margin-bottom: 1rem;">Order Breakdown</h4>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Subtotal:</span>
                <span>R${order.subtotal.toFixed(2)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Shipping:</span>
                <span style="color: ${order.shippingCost === 0 ? '#4CAF50' : '#333'}; font-weight: ${order.shippingCost === 0 ? 'bold' : 'normal'}">
                    ${order.shippingCost === 0 ? 'FREE' : `R${order.shippingCost.toFixed(2)}`}
                    ${order.shippingCost === 0 ? ' (over R' + order.shippingThreshold + ')' : ''}
                </span>
            </div>
            
            ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #e91e63;">
                <span>Discount:</span>
                <span>-R${order.discount.toFixed(2)}</span>
            </div>
            ` : ''}
            
            ${order.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Tax (${CONFIG.VAT_PERCENTAGE}%):</span>
                <span>R${order.tax.toFixed(2)}</span>
            </div>
            ` : ''}
            
            <div style="
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 2px solid #ddd;
                font-weight: bold;
                font-size: 1.1rem;
            ">
                <span>Total Amount:</span>
                <span>R${order.totalAmount.toFixed(2)}</span>
            </div>
            
            ${order.priceTier === 'wholesale' ? `
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f3e5f5; border-radius: 4px; font-size: 0.9em;">
                <strong>Wholesale Pricing Applied</strong>
            </div>
            ` : ''}
            
            ${order.returnPolicy ? `
            <div style="
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px dashed #ddd;
                font-size: 0.85rem;
                color: #666;
            ">
                <strong>Return Policy:</strong> ${order.returnPolicy}
            </div>
            ` : ''}
        </div>
        `;
        
        modal.innerHTML = `
            <div class="order-modal-content" style="
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2rem;
                position: relative;
            ">
                <button id="close-details-modal" style="
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
                    Order Details: ${order.id}
                    <span class="status-badge" style="
                        background: ${order.status === 'pending' ? '#ff9800' : 
                                    order.status === 'paid' ? '#2196f3' : 
                                    order.status === 'shipped' ? '#4caf50' : '#9e9e9e'};
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        margin-left: 1rem;
                    ">${order.status.toUpperCase()}</span>
                </h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <h3 style="margin-top: 0;">Customer Information</h3>
                        <div style="margin-bottom: 0.5rem;">
                          <strong>Name:</strong> ${order.firstName} ${order.surname}
                          ${order.customerId ? `<br><span style="font-size: 0.85rem; color: #666;">ID: ${order.customerId}</span>` : ''}
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Phone:</strong> ${order.customerPhone}
                        </div>
                        ${order.customerWhatsApp ? `<div style="margin-bottom: 0.5rem;">
                            <strong>WhatsApp:</strong> ${order.customerWhatsApp}
                        </div>` : ''}
                        ${order.customerEmail ? `<div style="margin-bottom: 0.5rem;">
                            <strong>Email:</strong> ${order.customerEmail}
                        </div>` : ''}
                        ${order.customerType ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Customer Type:</strong> ${order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1)}
                        </div>
                        ` : ''}
                        
                        ${order.preferredPaymentMethod ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Preferred Payment:</strong> ${order.preferredPaymentMethod}
                        </div>
                        ` : ''}
                        
                        ${order.priority ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Priority:</strong> ${order.priority.toUpperCase()}
                        </div>
                        ` : ''}
                        
                        ${order.priceTier ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Price Tier:</strong> ${order.priceTier.toUpperCase()}
                        </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 0.5rem;">
                            <strong>Order Date:</strong> ${orderDate}
                        </div>
                        <div>
                            <strong>Shipping Date:</strong> ${shippingDate}
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="margin-top: 0;">Shipping Address</h3>
                        <div style="
                            background: #f8f9fa;
                            padding: 1rem;
                            border-radius: 4px;
                            white-space: pre-wrap;
                            font-size: 0.95rem;
                        ">${order.shippingAddress}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h3>Order Items</h3>
                    <div style="
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 4px;
                    ">
                        ${itemsHtml}
                    </div>
                    
                    ${financialBreakdown}
                </div>
                
                ${order.notes ? `<div style="margin-bottom: 2rem;">
                    <h3>Customer Notes</h3>
                    <div style="
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 4px;
                        white-space: pre-wrap;
                        font-size: 0.95rem;
                    ">${order.notes}</div>
                </div>` : ''}
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="print-order-details" class="print-btn" style="
                        padding: 0.75rem 1.5rem;
                        background: #2196f3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        <i class="fas fa-print" style="margin-right: 0.5rem;"></i>
                        Print Order
                    </button>
                    
                    <button id="delete-order-details" class="delete-btn" style="
                        padding: 0.75rem 1.5rem;
                        background: #ff5252;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        <i class="fas fa-trash" style="margin-right: 0.5rem;"></i>
                        Delete Order
                    </button>
                </div>
            </div>
        `;
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        const closeBtn = document.getElementById('close-details-modal');
        const printBtn = document.getElementById('print-order-details');
        const deleteBtn = document.getElementById('delete-order-details');
        
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            };
        }
        
        if (printBtn) {
            printBtn.onclick = () => generatePrintHTML(order);
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this order?')) {
                    deleteOrder(order.id);
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                    
                    if (document.getElementById('admin-dashboard')?.style.display !== 'none') {
                        renderOrders();
                        renderCompletedOrders();
                    }
                }
            };
        }
        
        console.log(`[OrdersManager] Details modal created for order ${order.id}`);
        
    } catch (error) {
        console.error('[OrdersManager] Failed to create details modal:', error);
    }
}

// ========================================================
// CANCELLATION MODAL - FULLY IMPLEMENTED
// ========================================================
function createCancellationModal(order) {
    console.log(`[OrdersManager] Creating cancellation modal for order ${order.id}`);
    
    try {
        // Remove any existing modal first
        const existingModal = document.getElementById('cancellation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'cancellation-modal';
        modal.className = 'cancellation-modal';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10010;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 500px;
                padding: 2rem;
                position: relative;
            ">
                <button id="close-cancel-modal" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
                
                <h2 style="margin-top: 0; color: #333;">Cancel Order: ${order.id}</h2>
                
                <div style="
                    background: #fff8e1;
                    border-left: 4px solid #ff9800;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1.5rem;
                ">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Customer:</div>
                    <div>${order.firstName} ${order.surname}</div>
                    <div>${order.customerPhone}</div>
                    <div style="margin-top: 0.5rem; font-weight: 600;">Total: R${order.totalAmount.toFixed(2)}</div>
                </div>
                
                <form id="cancellation-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Cancellation Reason *
                        </label>
                        <select id="cancellation-reason" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 1rem;
                            background: white;
                        ">
                            <option value="">Select a reason</option>
                            <option value="customer_requested">Customer Requested</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="payment_failed">Payment Failed</option>
                            <option value="fraudulent">Fraudulent Order</option>
                            <option value="delivery_issue">Delivery Issue</option>
                            <option value="price_dispute">Price Dispute</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Refund Amount (R)
                        </label>
                        <input type="number" 
                               id="refund-amount" 
                               min="0" 
                               max="${order.totalAmount}"
                               step="0.01"
                               value="${order.totalAmount}"
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                               ">
                        <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                            Enter 0 for no refund. Max: R${order.totalAmount.toFixed(2)}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            Additional Notes
                        </label>
                        <textarea id="cancel-notes" rows="3" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 1rem;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div id="cancel-error" style="
                        background: #ffebee;
                        color: #d32f2f;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1.5rem;
                        display: none;
                    "></div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancel-cancel" style="
                            background: white;
                            color: #666;
                            border: 2px solid #e0e0e0;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            Back
                        </button>
                        
                        <button type="submit" style="
                            background: #ff5252;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            <i class="fas fa-ban" style="margin-right: 0.5rem;"></i>
                            Confirm Cancellation
                        </button>
                    </div>
                </form>
            </div>
        `;
        
document.body.appendChild(modal);
        
// Form submission with improved event handling
const form = document.getElementById('cancellation-form');
form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 [OrdersManager] Cancellation form submitted for order:', order.id);
    
    const cancellationData = {
        reason: document.getElementById('cancellation-reason').value,
        refundAmount: document.getElementById('refund-amount').value,
        notes: document.getElementById('cancel-notes').value,
        cancelledBy: 'admin'
    };
    
    console.log('📋 Cancellation data:', cancellationData);

    // Validate
    if (!cancellationData.reason) {
        const errorDiv = document.getElementById('cancel-error');
        errorDiv.textContent = 'Please select a cancellation reason';
        errorDiv.style.display = 'block';
        return false;
    }

    console.log('🔄 Calling cancelOrder...');
    const success = cancelOrder(order.id, cancellationData);
    console.log('✅ cancelOrder returned:', success);
    
    if (success) {
        console.log('🗑️ Removing modal...');
        
        // Remove modal and clean up
        if (modal && modal.parentNode) {
            // Remove all event listeners first
            const form = document.getElementById('cancellation-form');
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
            }
            
            // Remove modal from DOM
            modal.parentNode.removeChild(modal);
        }
        
        // Restore body overflow
        document.body.style.overflow = '';
        
        // Refresh all order displays with a small delay
        setTimeout(() => {
    try {
        console.log('🔄 Refreshing order displays...');
        
        // Method 1: Check if admin dashboard is open and refresh it
        if (typeof window.isAdminDashboardOpen === 'function' && window.isAdminDashboardOpen()) {
            console.log('📊 Admin dashboard is open, refreshing...');
            
            // Call the refresh function we just added to admin.js
            if (typeof window.refreshDashboardOrders === 'function') {
                window.refreshDashboardOrders();
            } else {
                // Fallback: Try to refresh via existing admin functions
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
            }
        }
        
        // Method 2: Also refresh OrdersManager displays (for other parts of app)
        renderOrders();
        renderCompletedOrders();
        renderCancelledDashboardOrders();
        updateAdminBadge();
        
        console.log('✅ All displays refreshed');
    } catch (refreshError) {
        console.error('Failed to refresh displays:', refreshError);
    }
}, 100);
        
        
        // Show success message
        alert(`✅ Order ${order.id} cancelled successfully.${cancellationData.refundAmount > 0 ? ` Refund: R${parseFloat(cancellationData.refundAmount).toFixed(2)}` : ''}`);
        
        return true;
    } else {
        console.log('❌ Cancellation failed');
        const errorDiv = document.getElementById('cancel-error');
        errorDiv.textContent = 'Failed to cancel order. Please try again.';
        errorDiv.style.display = 'block';
        return false;
    }
});

// Close buttons with proper cleanup
document.getElementById('close-cancel-modal').addEventListener('click', function() {
    console.log('🚪 Closing cancellation modal via X button');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
    document.body.style.overflow = '';
});

document.getElementById('cancel-cancel').addEventListener('click', function() {
    console.log('🚪 Closing cancellation modal via Back button');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
    document.body.style.overflow = '';
});

// Also close modal when clicking outside
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        console.log('🚪 Closing cancellation modal via background click');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
    }
});

// Prevent clicks inside modal content from closing modal
const modalContent = modal.querySelector('div');
if (modalContent) {
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Focus on reason field when modal opens
setTimeout(() => {
    const reasonSelect = document.getElementById('cancellation-reason');
    if (reasonSelect) {
        reasonSelect.focus();
    }
}, 100);

// Add keyboard support (ESC to close)
// Add this function BEFORE the event listener
function handleEscKey(e) {
    if (e.key === 'Escape' && modal && modal.parentNode) {
        console.log('ESC key pressed, closing modal');
        modal.parentNode.removeChild(modal);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscKey);
    }
}
// Then modify the event listener to use handleEscKey:
document.addEventListener('keydown', handleEscKey);
// Store reference for cleanup
modal._escHandler = handleEscKey; // Change this line too

// Also add Enter key to submit form when in input fields
modal.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        e.preventDefault();
        if (!e.shiftKey) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});
        
} catch (error) {
    console.error('[OrdersManager] Failed to create cancellation modal:', error);
    // Clean up if there was an error
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
    document.body.style.overflow = '';
    alert('Failed to create cancellation modal. Please try again.');
}
} // CLOSES THE FUNCTION

// ========================================================
// COMPLETED ORDER CARD HTML - FULLY IMPLEMENTED
// ========================================================
function generateCompletedOrderCardHTML(order) {
    try {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not shipped';
        
        return `
            <div class="completed-order-card" data-order-id="${order.id}" style="
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                border: 1px solid #e0e0e0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; color: #333;">${order.id}</h3>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${orderDate} • ${order.customerType ? order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1) : 'Personal'} Customer
                        </div>
                        <div style="margin-top: 0.5rem; font-weight: 600;">
                            ${order.firstName} ${order.surname}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${order.customerPhone}${order.customerEmail ? ` • ${order.customerEmail}` : ''}
                        </div>
                    </div>
                    <div>
                        <span style="
                            background: ${order.status === 'shipped' ? '#4CAF50' : 
                                       order.status === 'paid' ? '#2196f3' : '#9e9e9e'};
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                            ${order.status.toUpperCase()}
                        </span>
                        <div style="text-align: right; margin-top: 0.5rem; font-weight: bold; font-size: 1.2rem;">
                            R${order.totalAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        <span>Shipped on:</span>
                        <span>${shippingDate}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        <span>Payment:</span>
                        <span>${order.preferredPaymentMethod || 'Manual'}</span>
                    </div>
                    ${order.priceTier ? `
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span>Price Tier:</span>
                        <span style="color: ${order.priceTier === 'wholesale' ? '#9c27b0' : '#2196f3'}; font-weight: 600;">
                            ${order.priceTier.toUpperCase()}
                        </span>
                    </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn view-details" data-order-id="${order.id}" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #2196f3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-eye" style="margin-right: 0.5rem;"></i>
                        Details
                    </button>
                    
                    <button class="action-btn print-order" data-order-id="${order.id}" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-print" style="margin-right: 0.5rem;"></i>
                        Print
                    </button>
                    
                    <button class="action-btn delete-order" data-order-id="${order.id}" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #ff5252;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-trash" style="margin-right: 0.5rem;"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[OrdersManager] Failed to generate completed order card:', error);
        return '<div class="order-error">Failed to load order</div>';
    }
}

// ========================================================
// PRINT HTML GENERATION - FULLY IMPLEMENTED WITH TIERED PRICING
// ========================================================
function generatePrintHTML(order) {
    console.log(`[OrdersManager] Printing order ${order.id}`);
    
    try {
        const printWindow = window.open('', '_blank');
        const orderDate = new Date(order.createdAt).toLocaleString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not shipped yet';
        
        // Build items table with tiered pricing
        let itemsHtml = '';
        order.items.forEach(item => {
            const itemTotal = (item.finalPrice || item.price || 0) * (item.quantity || 1);
            itemsHtml += `
            <tr>
                <td>${item.productName}${item.isDiscounted ? ' (Discounted)' : ''}</td>
                <td>${item.quantity}</td>
                <td>R${(item.finalPrice || item.price || 0).toFixed(2)}</td>
                <td>R${itemTotal.toFixed(2)}</td>
            </tr>`;
        });
        
        // Financial breakdown for print with tier info
        const financialBreakdown = `
        <div style="margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0;">Subtotal:</td>
                    <td style="text-align: right; padding: 8px 0;">R${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Shipping:</td>
                    <td style="text-align: right; padding: 8px 0; color: ${order.shippingCost === 0 ? '#4CAF50' : '#333'}">
                        ${order.shippingCost === 0 ? 'FREE' : `R${order.shippingCost.toFixed(2)}`}
                        ${order.shippingCost === 0 ? ' (over R' + order.shippingThreshold + ')' : ''}
                    </td>
                </tr>
                ${order.discount > 0 ? `
                <tr style="color: #e91e63;">
                    <td style="padding: 8px 0;">Discount:</td>
                    <td style="text-align: right; padding: 8px 0;">-R${order.discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${order.tax > 0 ? `
                <tr>
                    <td style="padding: 8px 0;">Tax (${CONFIG.VAT_PERCENTAGE}%):</td>
                    <td style="text-align: right; padding: 8px 0;">R${order.tax.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${order.priceTier === 'wholesale' ? `
                <tr style="color: #9c27b0; font-style: italic;">
                    <td style="padding: 8px 0;">Wholesale Pricing Applied:</td>
                    <td style="text-align: right; padding: 8px 0;"></td>
                </tr>
                ` : ''}
                <tr style="font-weight: bold; border-top: 2px solid #333;">
                    <td style="padding: 12px 0;">Total Amount:</td>
                    <td style="text-align: right; padding: 12px 0;">R${order.totalAmount.toFixed(2)}</td>
                </tr>
            </table>
        </div>
        `;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order ${order.id} - BeautyHub2025</title>
                <style>
                    * {
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0;
                        padding: 20px;
                        color: #333;
                        background: white;
                    }
                    
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e91e63;
                    }
                    
                    .header h1 {
                        color: #e91e63;
                        margin-bottom: 5px;
                    }
                    
                    .header h2 {
                        color: #555;
                        font-weight: normal;
                    }
                    
                    .order-info { 
                        margin-bottom: 30px; 
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                    }
                    
                    .order-info p {
                        margin: 8px 0;
                    }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 12px 8px; 
                        text-align: left; 
                    }
                    
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold;
                    }
                    
                    .total-row { 
                        font-weight: bold; 
                        background-color: #f9f9f9;
                    }
                    
                    .footer { 
                        margin-top: 40px; 
                        font-size: 14px; 
                        color: #666; 
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }
                    
                    .print-buttons {
                        margin-top: 30px;
                        text-align: center;
                    }
                    
                    button {
                        padding: 12px 24px;
                        margin: 0 10px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    }
                    
                    .print-btn {
                        background: #4CAF50;
                        color: white;
                    }
                    
                    .close-btn {
                        background: #ff9800;
                        color: white;
                    }
                    
                    @media (max-width: 768px) {
                        body {
                            padding: 15px;
                        }
                        
                        .header h1 {
                            font-size: 24px;
                        }
                        
                        .header h2 {
                            font-size: 18px;
                        }
                        
                        th, td {
                            padding: 10px 6px;
                            font-size: 14px;
                        }
                    }
                    
                    @media print {
                        button { 
                            display: none !important; 
                        }
                        
                        .print-buttons {
                            display: none !important;
                        }
                        
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        
                        .container {
                            max-width: 100%;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BeautyHub2025</h1>
                    <h2>Order Invoice: ${order.id}</h2>
                </div>
                
                <div class="order-info">
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Customer Name:</strong> ${order.firstName} ${order.surname}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    ${order.customerType ? `<p><strong>Customer Type:</strong> ${order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1)}</p>` : ''}
                    ${order.preferredPaymentMethod ? `<p><strong>Preferred Payment:</strong> ${order.preferredPaymentMethod}</p>` : ''}
                    ${order.priceTier ? `<p><strong>Price Tier:</strong> ${order.priceTier.toUpperCase()}</p>` : ''}
                    <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
                    <p><strong>Shipping Date:</strong> ${shippingDate}</p>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                ${financialBreakdown}
                
                ${order.notes ? `<div style="margin-top: 20px;">
                    <strong>Customer Notes:</strong>
                    <p>${order.notes}</p>
                </div>` : ''}
                
                ${order.returnPolicy ? `<div style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    <strong>Return Policy:</strong> ${order.returnPolicy}
                </div>` : ''}
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>BeautyHub2025 | Luxury Beauty Products</p>
                </div>
                
                <div class="print-buttons">
                    <button onclick="window.print()" class="print-btn">
                        Print Invoice
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        Close Window
                    </button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
    } catch (error) {
        console.error('[OrdersManager] Failed to print order details:', error);
        alert('Failed to print order. Please try again.');
    }
}

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init,
        createOrder,
        getOrders,
        getOrderById,
        getPendingCount,
        getLastOrderId,
        markAsPaid,
        markAsShipped,
        cancelOrder,
        deleteOrder,
        renderOrders,
        renderCompletedOrders,
        renderCancelledDashboardOrders, // Add this
        showOrderDetails,
        updateAdminBadge,
        showCancellationModal,
        getPriceForCustomer, // Export this for use in other modules
        getPriceTierForCustomer
    };
})();

// Make sure you have this line at the end:
console.log('[OrdersManager] Module definition complete');
