// ordersManager.js - Central Order Management System
const OrdersManager = (function() {
    // Storage keys
    const STORAGE_KEYS = {
        ORDERS: 'beautyhub_orders',
        ORDER_COUNTER: 'beautyhub_order_id_counter'
    };
    
    // ============================================
    // ORDER SCHEMA (For Firebase implementation later)
    // ============================================
    /*
    ORDER_SCHEMA:
{
  id: string,                     // Auto-generated order ID
  firstName: string,              // Required
  surname: string,                // Required
  customerPhone: string,          // Required
  customerWhatsApp: string,       // Optional
  customerEmail: string,          // Optional
      shippingAddress: string,        // Required
      items: [                        // Array of cart items
        {
          productId: string,
          productName: string,
          price: number,
          quantity: number,
          imageUrl: string
        }
      ],
      totalAmount: number,            // Calculated total
      status: 'pending',              // pending | paid | shipped | completed
      paymentMethod: 'manual',        // For future: cash, card, etc.
      shippingDate: string,           // ISO string when shipped
      createdAt: string,              // ISO string
      updatedAt: string,              // ISO string
      notes: string,                  // Customer notes
      adminNotes: string              // Admin internal notes
    }
    
    STATUS FLOW:
    1. Created → status: 'pending'
    2. Paid → status: 'paid' (stays in pending view)
    3. Shipped → status: 'shipped' (moves to completed)
    4. Optional: completed → status: 'completed' (archive)
    */
    
    // Initialize order system
    let orders = [];
    let orderIdCounter = 1000;
    
    // Initialize from localStorage
    function init() {
        loadOrders();
        setupEventListeners();
        return {
            orders,
            getPendingCount: getPendingCount
        };
    }
    
    // Load orders from localStorage
    function loadOrders() {
        // Load orders
        const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (savedOrders) {
            try {
                orders = JSON.parse(savedOrders) || [];
            } catch (e) {
                orders = [];
                console.error('Error loading orders:', e);
            }
        }
        
        // Load counter
        const savedCounter = localStorage.getItem(STORAGE_KEYS.ORDER_COUNTER);
        if (savedCounter) {
            orderIdCounter = parseInt(savedCounter) || 1000;
        }
    }
    
    // Save orders to localStorage
    function saveOrders() {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, orderIdCounter.toString());
    }
    
    // Generate order ID
    function generateOrderId() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const counter = (orderIdCounter++).toString().padStart(4, '0');
        
        return `ORD${year}${month}${day}${counter}`;
    }
    
    // Create new order
    function createOrder(customerData) {
        console.log('DEBUG Order Creation:', {
        firstName: customerData.firstName,
        surname: customerData.surname,
        fullData: customerData
    });
        
        if (!customerData || !customerData.cartItems || customerData.cartItems.length === 0) {
            console.error('Cannot create order: No cart items');
            return null;
        }
        
        const orderId = generateOrderId();
        const now = new Date().toISOString();
        const shippingThreshold = 1000;
    const shippingCost = customerData.totalAmount >= shippingThreshold ? 0 : 50;
    const isFreeShipping = customerData.totalAmount >= shippingThreshold;
        
        const newOrder = {
    id: orderId,
    firstName: customerData.firstName.trim(),
    surname: customerData.surname.trim(),
    customerPhone: customerData.customerPhone.trim(),
            customerWhatsApp: customerData.customerWhatsApp?.trim() || '',
            customerEmail: customerData.customerEmail?.trim() || '',
            shippingAddress: customerData.shippingAddress.trim(),
            items: customerData.cartItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl
            })),
            totalAmount: customerData.totalAmount,
            status: 'pending',
            paymentMethod: 'manual',
            shippingDate: '',
            createdAt: now,
            updatedAt: now,
            notes: customerData.orderNotes?.trim() || '',
            adminNotes: '',
            // FINANCIAL FIELDS - ADD THESE
        subtotal: customerData.totalAmount,
        shippingCost: shippingCost,
        shippingThreshold: shippingThreshold,
        isFreeShipping: isFreeShipping,
        discount: 0.00,
        tax: 0.00,
        totalAmount: customerData.totalAmount + shippingCost,
        
        // POLICY FIELD
        returnPolicy: "No returns on damaged products. 7-day return for unused items with original packaging.",
         // ANALYTICS FIELDS
        hasDiscount: false,
        usedFreeShipping: isFreeShipping
        };
        
        // Add to orders array
        orders.push(newOrder);
        saveOrders();
        
        // Update admin badge if exists
        updateAdminBadge();
        
        console.log(`Order created: ${orderId}`);
        return newOrder;
    }
    
    // Get all orders (filter by status if provided)
    function getOrders(status = null) {
        if (!status) return [...orders];
        return orders.filter(order => order.status === status);
    }
    
    // Get order by ID
    function getOrderById(orderId) {
        return orders.find(order => order.id === orderId);
    }
    
    // Get pending orders count
    function getPendingCount() {
        return orders.filter(order => order.status === 'pending').length;
    }
    
    // Update order status
    function updateOrderStatus(orderId, newStatus, shippingDate = '') {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.error(`Order ${orderId} not found`);
            return false;
        }
        
        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();
        
        if (newStatus === 'shipped' && shippingDate) {
            orders[orderIndex].shippingDate = shippingDate;
        }
        
        saveOrders();
        updateAdminBadge();
        return true;
    }
    
    // Mark order as paid
    function markAsPaid(orderId) {
        return updateOrderStatus(orderId, 'paid');
    }
    
// Mark order as shipped (with date input)  UPDATED
function markAsShipped(orderId, shippingDate = '') {
    if (!shippingDate) {
        // Default to today if no date provided
        shippingDate = new Date().toISOString().split('T')[0];
    }
    
    // Stock deduction - ADDED INTEGRATION
    const order = getOrderById(orderId);
    if (order && typeof ProductsManager !== 'undefined') {
        // Deduct stock for each item in the order
        let allStockDeducted = true;
        const failedItems = [];
        
        order.items.forEach(item => {
            const success = ProductsManager.updateStock(item.productId, -item.quantity);
            if (!success) {
                allStockDeducted = false;
                failedItems.push(item.productName);
            }
        });
        
        // If stock deduction failed, alert and cancel shipment
        if (!allStockDeducted) {
            alert(`Cannot ship order ${orderId}. Insufficient stock for: ${failedItems.join(', ')}`);
            return false;
        }
    }
    
    return updateOrderStatus(orderId, 'shipped', shippingDate);
}
    
    // Delete order
    function deleteOrder(orderId) {
        const initialLength = orders.length;
        orders = orders.filter(order => order.id !== orderId);
        
        if (orders.length < initialLength) {
            saveOrders();
            updateAdminBadge();
            return true;
        }
        return false;
    }
    
    // Get last order ID (for confirmation display)
    function getLastOrderId() {
        if (orders.length === 0) return null;
        return orders[orders.length - 1].id;
    }
    
    // Update admin badge count
    function updateAdminBadge() {
        const badge = document.getElementById('admin-badge');
        if (badge) {
            const count = getPendingCount();
            badge.textContent = count > 0 ? count.toString() : '';
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
// Render orders in admin panel UPDATED
function renderOrders(statusFilter = 'pending', containerId = 'pending-orders') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const filteredOrders = getOrders(statusFilter);
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<div class="no-orders">No orders found</div>';
        return;
    }
    
    let html = '';
    filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const orderTime = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Build items list with images
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
            <div class="detailed-item">
                <img src="${item.imageUrl || 'gallery/placeholder.jpg'}" 
                     alt="${item.productName}"
                     class="item-image-small">
                <div class="item-details">
                    <div class="item-name">${item.productName}</div>
                    <div class="item-meta">
                        <span class="item-quantity">×${item.quantity}</span>
                        <span class="item-price">R${item.price.toFixed(2)} each</span>
                    </div>
                </div>
                <div class="item-total">R${(item.price * item.quantity).toFixed(2)}</div>
            </div>`;
        });
        
        html += `
        <div class="order-card-detailed" data-order-id="${order.id}">
            <div class="order-header-detailed">
                <div class="order-id-date">
                    <h3>${order.id}</h3>
                    <div class="order-timestamp">${orderDate} ${orderTime}</div>
                </div>
                <div class="order-status-detailed">
                    <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="order-customer-detailed">
    <div class="customer-info">
        <div><strong>${order.firstName} ${order.surname}</strong></div>
        <div>${order.customerPhone}</div>
        ${order.customerEmail ? `<div>${order.customerEmail}</div>` : ''}
    </div>
                
                <div class="shipping-info">
                    <div><strong>Shipping Address:</strong></div>
                    <div class="address-text">${order.shippingAddress}</div>
                </div>
            </div>
            
            <div class="order-items-detailed">
                <h4>Order Items:</h4>
                ${itemsHtml}
                <div class="order-total-detailed">
                    <span>Total Amount:</span>
                    <span class="total-amount">R${order.totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            ${order.notes ? `
            <div class="order-notes">
                <strong>Customer Notes:</strong>
                <div class="notes-text">${order.notes}</div>
            </div>` : ''}
            
            <div class="order-actions-detailed">
                ${order.status === 'pending' ? `
                <button class="action-btn mark-paid" data-order-id="${order.id}">
                    Mark as Paid
                </button>` : ''}
                
                ${order.status !== 'shipped' ? `
                <button class="action-btn mark-shipped" data-order-id="${order.id}">
                    Mark as Shipped
                </button>` : ''}
                
                <button class="action-btn delete-order" data-order-id="${order.id}">
                    Delete
                </button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}
    
// Render completed orders UPDATED
function renderCompletedOrders(containerId = 'completed-orders-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const completedOrders = getOrders('shipped');
    
    if (completedOrders.length === 0) {
        container.innerHTML = '<div class="no-orders">No completed orders</div>';
        return;
    }
    
    let html = '';
    completedOrders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not set';
        
        // Build items list with images (same as above)
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
            <div class="detailed-item">
                <img src="${item.imageUrl || 'gallery/placeholder.jpg'}" 
                     alt="${item.productName}"
                     class="item-image-small">
                <div class="item-details">
                    <div class="item-name">${item.productName}</div>
                    <div class="item-meta">
                        <span class="item-quantity">×${item.quantity}</span>
                        <span class="item-price">R${item.price.toFixed(2)} each</span>
                    </div>
                </div>
                <div class="item-total">R${(item.price * item.quantity).toFixed(2)}</div>
            </div>`;
        });
        
        html += `
        <div class="order-card-detailed" data-order-id="${order.id}">
            <div class="order-header-detailed">
                <div class="order-id-date">
                    <h3>${order.id}</h3>
                    <div class="order-timestamp">
                        <span>Ordered: ${orderDate}</span>
                        <span class="shipped-date">Shipped: ${shippingDate}</span>
                    </div>
                </div>
                <div class="order-status-detailed">
                    <span class="status-badge status-shipped">SHIPPED</span>
                </div>
            </div>
            
            <div class="order-customer-detailed">
    <div class="customer-info">
        <div><strong>${order.firstName} ${order.surname}</strong></div>
        <div>${order.customerPhone}</div>
        ${order.customerEmail ? `<div>${order.customerEmail}</div>` : ''}
    </div>
                
                <div class="shipping-info">
                    <div><strong>Shipping Address:</strong></div>
                    <div class="address-text">${order.shippingAddress}</div>
                </div>
            </div>
            
            <div class="order-items-detailed">
                <h4>Order Items:</h4>
                ${itemsHtml}
                <div class="order-total-detailed">
                    <span>Total Amount:</span>
                    <span class="total-amount">R${order.totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            ${order.notes ? `
            <div class="order-notes">
                <strong>Customer Notes:</strong>
                <div class="notes-text">${order.notes}</div>
            </div>` : ''}
            
            <div class="order-actions-detailed">
                <button class="action-btn view-details" data-order-id="${order.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                
                <button class="action-btn delete-order" data-order-id="${order.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}
    
    // Show order details modal
    function showOrderDetails(orderId) {
        const order = getOrderById(orderId);
        if (!order) return;
        
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
                z-index: 9999;  /* HIGHEST Z-INDEX TO APPEAR ABOVE EVERYTHING*/
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(modal);
        }
        
        const orderDate = new Date(order.createdAt).toLocaleString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not shipped yet';
        
        // Build items list
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
            <div class="order-item">
                <div class="item-name">${item.productName} × ${item.quantity}</div>
                <div class="item-price">R${(item.price * item.quantity).toFixed(2)}</div>
            </div>`;
        });
        
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
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-top: 1rem;
                            padding-top: 1rem;
                            border-top: 1px solid #ddd;
                            font-weight: bold;
                        ">
                            <div>Total Amount:</div>
                            <div>R${order.totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                
                ${order.notes ? `<div style="margin-bottom: 2rem;">
                    <h3>Customer Notes</h3>
                    <div style="
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 4px;
                        white-space: pre-wrap;
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
        
        // Add event listeners for this modal
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
            printBtn.onclick = () => printOrderDetails(order);
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this order?')) {
                    deleteOrder(orderId);
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                    
                    // Refresh order lists if in admin view
                    if (document.getElementById('admin-dashboard')?.style.display !== 'none') {
                        renderOrders();
                        renderCompletedOrders();
                    }
                }
            };
        }
    }
    
    // Print order details
    function printOrderDetails(order) {
        const printWindow = window.open('', '_blank');
        const orderDate = new Date(order.createdAt).toLocaleString();
        const shippingDate = order.shippingDate 
            ? new Date(order.shippingDate).toLocaleDateString()
            : 'Not shipped yet';
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>R${item.price.toFixed(2)}</td>
                <td>R${(item.price * item.quantity).toFixed(2)}</td>
            </tr>`;
        });
        
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
    
    /* Responsive styles for tablets and phones */
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
        
        button {
            padding: 10px 20px;
            margin: 5px;
            display: block;
            width: 100%;
        }
        
        .print-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
    }
    
    @media (max-width: 480px) {
        body {
            padding: 10px;
        }
        
        .container {
            width: 100%;
        }
        
        table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }
        
        .order-info {
            padding: 10px;
            font-size: 14px;
        }
        
        th, td {
            padding: 8px 4px;
            font-size: 13px;
        }
    }
    
    /* Print-specific styles */
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
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Total Amount:</td>
                            <td>R${order.totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                
                ${order.notes ? `<div style="margin-top: 20px;">
                    <strong>Customer Notes:</strong>
                    <p>${order.notes}</p>
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
    }
    
    // Show shipping date input
    function showShippingDateInput(orderId) {
        const dateInput = prompt('Enter shipping date (YYYY-MM-DD) or leave empty for today:', 
                                new Date().toISOString().split('T')[0]);
        
        if (dateInput === null) return false; // User cancelled
        
        let shippingDate = dateInput.trim();
        
        // Validate date format
        if (shippingDate && !/^\d{4}-\d{2}-\d{2}$/.test(shippingDate)) {
            alert('Please enter date in YYYY-MM-DD format');
            return false;
        }
        
        return markAsShipped(orderId, shippingDate);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Event delegation for order actions
        document.addEventListener('click', function(e) {
            const orderId = e.target.dataset.orderId;
            if (!orderId) return;
            
            // Mark as paid
            if (e.target.classList.contains('mark-paid') && !e.target.disabled) {
                if (markAsPaid(orderId)) {
                    e.target.textContent = '✓ Paid';
                    e.target.disabled = true;
                    e.target.classList.add('disabled');
                    
                    // Refresh view
                    renderOrders();
                }
            }
            
            // Mark as shipped (with date input)
            if (e.target.classList.contains('mark-shipped') && !e.target.disabled) {
                if (showShippingDateInput(orderId)) {
                    e.target.textContent = '✓ Shipped';
                    e.target.disabled = true;
                    e.target.classList.add('disabled');
                    
                    // Refresh both views
                    renderOrders();
                    renderCompletedOrders();
                }
            }
            
            // Delete order
            if (e.target.classList.contains('delete-order')) {
                if (confirm('Are you sure you want to delete this order?')) {
                    if (deleteOrder(orderId)) {
                        // Remove from UI
                        const orderCard = e.target.closest('.order-card, .completed-order-card');
                        if (orderCard) {
                            orderCard.remove();
                        }
                    }
                }
            }
            
            // View details
            if (e.target.classList.contains('view-details')) {
                showOrderDetails(orderId);
            }
            
            // Print order
            if (e.target.classList.contains('print-order')) {
                const order = getOrderById(orderId);
                if (order) printOrderDetails(order);
            }
        });
    }
    
    // Public API
    return {
        init,
        createOrder,
        getOrders,
        getOrderById,
        getPendingCount,
        getLastOrderId,
        markAsPaid,
        markAsShipped,
        deleteOrder,
        renderOrders,
        renderCompletedOrders,
        showOrderDetails,
        updateAdminBadge
    };
})();

// Auto-initialize
//if (document.readyState === 'loading') {
//    document.addEventListener('DOMContentLoaded', () => OrdersManager.init());
//} else {
//    OrdersManager.init();
//}
