// ========================================================
// ordersManager.js - Central Order Management System
// Core Functionalities:
// 1. Order lifecycle management (pending → paid → shipped → cancelled)
// 2. Financial breakdown with subtotal, shipping, discounts, and taxes
// 3. Integration with inventory system for stock management
// 4. Customer classification (personal/retailer/wholesaler)
// 5. Order prioritization and payment method tracking
// 6. Detailed order views with printing capabilities
// 7. Comprehensive cancellation system with refund handling
// ========================================================

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
        PAYMENT_METHODS: ['manual', 'payfast', 'credit_card', 'eft'],
        ORDER_PRIORITIES: ['low', 'normal', 'high', 'rush']
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
            
            const savedCounter = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDER_COUNTER);
            if (savedCounter) {
                orderIdCounter = parseInt(savedCounter) || 1000;
            }
            
        } catch (error) {
            console.error('[OrdersManager] Failed to load orders:', error);
            orders = [];
            orderIdCounter = 1000;
            saveOrders(); // Reset corrupted storage
        }
    }

    function saveOrders() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
            localStorage.setItem(CONFIG.STORAGE_KEYS.ORDER_COUNTER, orderIdCounter.toString());
            console.log('[OrdersManager] Orders saved to storage');
        } catch (error) {
            console.error('[OrdersManager] Failed to save orders:', error);
        }
    }

    // ========================================================
    // ORDER CREATION
    // ========================================================
    function createOrder(customerData) {
        console.log('[OrdersManager] Creating new order...', customerData);
        
        try {
            // Validate input
            if (!customerData || !customerData.cartItems || customerData.cartItems.length === 0) {
                console.error('[OrdersManager] Cannot create order: No cart items');
                throw new Error('No cart items provided');
            }

            // Generate order ID
            const orderId = generateOrderId();
            console.log(`[OrdersManager] Generated order ID: ${orderId}`);
            
            // Calculate financials
            const subtotal = customerData.totalAmount || calculateSubtotal(customerData.cartItems);
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
                customerType: validateCustomerType(customerData.customerType),
                preferredPaymentMethod: validatePaymentMethod(customerData.preferredPaymentMethod),
                priority: validatePriority(customerData.priority),
                
                // Order Items
                items: customerData.cartItems.map(item => ({
                    productId: item.productId || '',
                    productName: item.productName || '',
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    imageUrl: item.imageUrl || 'gallery/placeholder.jpg',
                    isDiscounted: item.isDiscounted || false,
                    finalPrice: item.finalPrice || item.price
                })),
                
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
                usedFreeShipping: isFreeShipping
            };

            // Add to orders array
            orders.push(newOrder);
            saveOrders();
            
            // Update admin badge
            updateAdminBadge();
            
            console.log(`[OrdersManager] Order created successfully: ${orderId}`);
            console.log(`[OrdersManager] Order summary: Subtotal R${subtotal.toFixed(2)}, Shipping R${shipping.toFixed(2)}, Total R${total.toFixed(2)}`);
            
            return newOrder;
            
        } catch (error) {
            console.error('[OrdersManager] Order creation failed:', error);
            return null;
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
    function calculateSubtotal(items) {
        try {
            return items.reduce((total, item) => {
                const price = item.finalPrice || item.price || 0;
                const quantity = item.quantity || 1;
                return total + (price * quantity);
            }, 0);
        } catch (error) {
            console.error('[OrdersManager] Subtotal calculation failed:', error);
            return 0;
        }
    }

    function calculateShipping(subtotal) {
        return subtotal >= CONFIG.SHIPPING.THRESHHOLD ? 0 : CONFIG.SHIPPING.COST;
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
            
            orders[orderIndex].status = newStatus;
            orders[orderIndex].updatedAt = new Date().toISOString();
            
            if (newStatus === 'shipped' && shippingDate) {
                orders[orderIndex].shippingDate = shippingDate;
            }
            
            saveOrders();
            updateAdminBadge();
            
            console.log(`[OrdersManager] Order ${orderId} status updated successfully`);
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
            
            // Update inventory stock if ProductsManager is available
            if (typeof ProductsManager !== 'undefined') {
                console.log(`[OrdersManager] Updating inventory for shipped order ${orderId}`);
                
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
    // ORDER CANCELLATION
    // ========================================================
    function cancelOrder(orderId, cancellationData) {
        console.log(`[OrdersManager] Cancelling order ${orderId}`, cancellationData);
        
        try {
            const orderIndex = orders.findIndex(order => order.id === orderId);
            
            if (orderIndex === -1) {
                console.error(`[OrdersManager] Order ${orderId} not found`);
                return false;
            }
            
            // Update order with cancellation data
            orders[orderIndex].status = 'cancelled';
            orders[orderIndex].cancellationReason = cancellationData.reason || '';
            orders[orderIndex].refundAmount = parseFloat(cancellationData.refundAmount) || 0;
            orders[orderIndex].cancelledAt = new Date().toISOString();
            orders[orderIndex].cancelledBy = cancellationData.cancelledBy || 'admin';
            orders[orderIndex].updatedAt = new Date().toISOString();
            
            // Add admin note about refund
            if (orders[orderIndex].refundAmount > 0) {
                const refundNote = `\n[Refund issued: R${orders[orderIndex].refundAmount.toFixed(2)} on ${new Date().toLocaleDateString()}]`;
                orders[orderIndex].adminNotes = (orders[orderIndex].adminNotes || '') + refundNote;
            }
            
            // Restore inventory stock if applicable
            if (typeof ProductsManager !== 'undefined') {
                console.log(`[OrdersManager] Restoring inventory for cancelled order ${orderId}`);
                orders[orderIndex].items.forEach(item => {
                    ProductsManager.updateStock(item.productId, item.quantity);
                });
            }
            
            saveOrders();
            updateAdminBadge();
            
            console.log(`[OrdersManager] Order ${orderId} cancelled successfully`);
            return true;
            
        } catch (error) {
            console.error(`[OrdersManager] Cancellation failed for order ${orderId}:`, error);
            return false;
        }
    }

    // ========================================================
    // ORDER DELETION
    // ========================================================
    function deleteOrder(orderId) {
        console.log(`[OrdersManager] Deleting order ${orderId}`);
        
        try {
            const initialLength = orders.length;
            orders = orders.filter(order => order.id !== orderId);
            
            if (orders.length < initialLength) {
                saveOrders();
                updateAdminBadge();
                console.log(`[OrdersManager] Order ${orderId} deleted successfully`);
                return true;
            }
            
            console.warn(`[OrdersManager] Order ${orderId} not found for deletion`);
            return false;
            
        } catch (error) {
            console.error(`[OrdersManager] Deletion failed for order ${orderId}:`, error);
            return false;
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
    // HTML GENERATION FUNCTIONS
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
            
            return `
                <div class="order-card-detailed" data-order-id="${order.id}">
                    <!-- Order Header -->
                    <div class="order-header-detailed">
                        <div class="order-id-date">
                            <h3>${order.id}</h3>
                            <div class="order-timestamp">${orderDate} ${orderTime}</div>
                            ${order.customerId ? `
                            <div class="customer-id">
                                <i class="fas fa-id-card"></i>
                                Customer ID: ${order.customerId}
                            </div>
                            ` : ''}
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
                            ${order.customerType && order.customerType !== 'personal' ? `
                            <div class="customer-type">
                                <i class="fas fa-tag"></i>
                                ${order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1)}
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
                    
                    <!-- Order Items -->
                    <div class="order-items-detailed">
                        <h4><i class="fas fa-shopping-basket"></i> Order Items:</h4>
                        ${generateOrderItemsHTML(order.items)}
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
                        ` : ''}
                        
                        ${order.status === 'pending' || order.status === 'paid' ? `
                        <button class="action-btn cancel-order" data-order-id="${order.id}">
                            <i class="fas fa-ban"></i>
                            Cancel Order
                        </button>
                        ` : ''}
                        
                        ${order.status !== 'shipped' ? `
                        <button class="action-btn mark-shipped" data-order-id="${order.id}">
                            <i class="fas fa-shipping-fast"></i>
                            Mark as Shipped
                        </button>
                        ` : ''}
                        
                        <button class="action-btn delete-order" data-order-id="${order.id}">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[OrdersManager] Failed to generate order card HTML:', error);
            return '<div class="order-error">Failed to load order details</div>';
        }
    }

    function generateOrderItemsHTML(items) {
        try {
            return items.map(item => `
                <div class="detailed-item">
                    <img src="${item.imageUrl}" alt="${item.productName}">
                    <div class="item-details">
                        <div class="item-name">
                            ${item.productName}
                            ${item.isDiscounted ? '<span class="discount-badge">(Discounted)</span>' : ''}
                        </div>
                        <div class="item-meta">
                            <span class="item-quantity">×${item.quantity}</span>
                            <span class="item-price">R${(item.finalPrice || item.price).toFixed(2)} each</span>
                        </div>
                    </div>
                    <div class="item-total">R${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('[OrdersManager] Failed to generate items HTML:', error);
            return '<div class="item-error">Failed to load items</div>';
        }
    }

    function generateFinancialBreakdownHTML(order) {
        try {
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

    function createOrderDetailsModal(order) {
        try {
            // Remove existing modal
            let modal = document.getElementById('order-details-modal');
            if (modal) modal.remove();
            
            // Create new modal
            modal = document.createElement('div');
            modal.id = 'order-details-modal';
            modal.className = 'order-details-modal';
            
            modal.innerHTML = generateOrderDetailsModalHTML(order);
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Add event listeners
            attachOrderDetailsModalEvents(modal, order.id);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to create order details modal:', error);
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

    function createCancellationModal(order) {
        try {
            // Remove existing modal
            let modal = document.getElementById('cancellation-modal');
            if (modal) modal.remove();
            
            // Create new modal
            modal = document.createElement('div');
            modal.id = 'cancellation-modal';
            modal.className = 'cancellation-modal';
            
            modal.innerHTML = generateCancellationModalHTML(order);
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
            // Add event listeners
            attachCancellationModalEvents(modal, order.id);
            
        } catch (error) {
            console.error('[OrdersManager] Failed to create cancellation modal:', error);
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
            
            // Mark as paid
            if (e.target.classList.contains('mark-paid') && !e.target.disabled) {
                console.log(`[OrdersManager] Marking order ${orderId} as paid`);
                if (markAsPaid(orderId)) {
                    e.target.textContent = '✓ Paid';
                    e.target.disabled = true;
                    e.target.classList.add('disabled');
                    renderOrders();
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
        showOrderDetails,
        updateAdminBadge,
        showCancellationModal
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    OrdersManager.init();
});
