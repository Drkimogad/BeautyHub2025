// customerorder.js - Customer Order Form & Submission.
const CustomerOrderManager = (function() {
    // DOM Elements
    let checkoutModal = null;
    let checkoutForm = null;
    
    // Initialize order system MODIFIED
function init() {
    // Check if checkout button exists (indicates we need checkout functionality)
    const checkoutButton = document.querySelector('[onclick*="openCheckout"], [onclick*="CustomerOrderManager"]');
    if (!checkoutButton && !document.getElementById('checkout-form')) {
        console.log('[CustomerOrder] No checkout UI found, skipping initialization');
        return;
    }
    
    createCheckoutModal();
    setupEventListeners();
    
    // Initialize customer search
    if (typeof CustomerSearchManager !== 'undefined') {
        CustomerSearchManager.init();
    }
}
// ===== MODAL CREATION =====
    function createCheckoutModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('checkout-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal container
        checkoutModal = document.createElement('div');
        checkoutModal.id = 'checkout-modal';
        checkoutModal.className = 'checkout-modal';
        checkoutModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1002;
            align-items: center;
            justify-content: center;
        `;
        
        // Modal content
        checkoutModal.innerHTML = `
            <div class="checkout-modal-content" style="
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2rem;
                position: relative;
            ">
                <button id="close-checkout" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                ">&times;</button>
                
                <h2 style="margin-top: 0; color: #333;">Place Your Order</h2>
                
                <form id="checkout-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
            First Name *
        </label>
        <input type="text" id="customer-firstname" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        ">
    </div>
    
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
            Surname *
        </label>
        <input type="text" id="customer-surname" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        ">
    </div>
</div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                            Phone Number *
                        </label>
                        <input type="tel" id="customer-phone" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">
                            WhatsApp (optional)
                        </label>
                        <input type="tel" id="customer-whatsapp" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">
                            Email Address (optional)
                        </label>
                        <input type="email" id="customer-email" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                        ">
                    </div>

<div style="margin-bottom: 1rem;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
        Customer Type
    </label>
    <select id="customer-type" style="
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        background: white;
    ">
        <option value="personal">Personal</option>
        <option value="retailer">Retailer</option>
        <option value="wholesaler">Wholesaler</option>
        <option value="corporate">Corporate</option>
    </select>
</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Preferred Payment Method
        </label>
        <select id="preferred-payment-method" style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            background: white;
        ">
            <option value="manual">Manual/Cash</option>
            <option value="payfast">PayFast</option>
            <option value="credit_card">Credit Card</option>
            <option value="eft">EFT</option>
        </select>
    </div>
    
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Order Priority
        </label>
        <select id="order-priority" style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            background: white;
        ">
            <option value="normal">Normal</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="rush">Rush</option>
        </select>
    </div>
</div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                            Shipping Address *
                        </label>
                        <textarea id="shipping-address" rows="3" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">
                            Special Instructions (optional)
                        </label>
                        <textarea id="order-notes" rows="2" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div style="
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 4px;
                        margin-bottom: 1.5rem;
                    ">
                        <h4 style="margin-top: 0;">Order Summary</h4>
                        <div id="checkout-items-summary"></div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-top: 1rem;
                            padding-top: 1rem;
                            border-top: 1px solid #ddd;
                        ">
                            <strong>Total:</strong>
                            <strong id="checkout-total-summary">R0.00</strong>
                        </div>
                    </div>
                    
                    <div id="checkout-error" style="
                        color: #d32f2f;
                        background: #ffebee;
                        padding: 0.75rem;
                        border-radius: 4px;
                        margin-bottom: 1rem;
                        display: none;
                    "></div>
                    
                    <button type="submit" style="
                        width: 100%;
                        padding: 1rem;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 1rem;
                        cursor: pointer;
                        font-weight: bold;
                        transition: background 0.2s;
                    ">
                        <i class="fas fa-paper-plane" style="margin-right: 0.5rem;"></i>
                        Place Order
                    </button>
                </form>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(checkoutModal);
        checkoutForm = document.getElementById('checkout-form');
    }
    
// ===== MODAL CONTROLS =====
function openCheckout() {
    if (!checkoutModal) return;
    
    if (typeof BeautyHubCart === 'undefined') {
        showError('Cart system not available');
        return;
    }
    
    const cartItems = BeautyHubCart.getCartItems();
    
    // Calculate SUBTOTAL (items only)
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    if (cartItems.length === 0) {
        showError('Your cart is empty');
        return;
    }
    
    // Update order summary with SUBTOTAL
    updateOrderSummary(cartItems, subtotal);
    
    // Show modal
    checkoutModal.style.display = 'flex';
    const firstNameField = document.getElementById('customer-firstname');
    if (firstNameField) {
        firstNameField.focus();
    }
    document.body.style.overflow = 'hidden';
}
    
function closeCheckout() {
    if (!checkoutModal) return;
    
    checkoutModal.style.display = 'none';
    document.body.style.overflow = '';
    clearError();
    resetForm();
    
    // Clear customer tracking data
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        delete checkoutForm.dataset.existingCustomer;
        delete checkoutForm.dataset.existingCustomerId;
    }
}
    
//==========================================
    // UPDATEORDERSUMMARY
//=================================
function updateOrderSummary(cartItems, subtotal) {
    const summaryContainer = document.getElementById('checkout-items-summary');
    const totalElement = document.getElementById('checkout-total-summary');
    
    if (!summaryContainer || !totalElement) return;
    
    const shippingThreshold = 1000;
    const shippingCost = subtotal >= shippingThreshold ? 0 : 100; // was 50
    const isFreeShipping = subtotal >= shippingThreshold;
    const total = subtotal + shippingCost;
    
    // Update HTML to show breakdown
    let html = `
    <div style="margin-bottom: 1rem;">
        <h4 style="margin-top: 0;">Order Summary</h4>
        
        <!-- Items -->
        ${cartItems.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
            <div>
                ${item.productName} × ${item.quantity}
                ${item.isDiscounted ? '<span style="color:#e91e63; font-size:0.9em;"> (Discounted)</span>' : ''}
            </div>
            <div>R${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</div>
        </div>
        `).join('')}
        
        <!-- Financial Breakdown -->
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Subtotal:</span>
                <span>R${subtotal.toFixed(2)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Shipping:</span>
                <span style="color: ${isFreeShipping ? '#4CAF50' : '#333'}; font-weight: ${isFreeShipping ? 'bold' : 'normal'}">
                    ${isFreeShipping ? 'FREE' : `R${shippingCost.toFixed(2)}`}
                </span>
            </div>
            
            ${!isFreeShipping ? `
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem; padding-left: 1rem;">
                <i class="fas fa-truck" style="margin-right: 5px;"></i>
                Free shipping on orders over R${shippingThreshold}
            </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee; font-weight: bold;">
                <span>Total:</span>
                <span>R${total.toFixed(2)}</span>
            </div>
            
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem; font-style: italic;">
                <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                Includes 15% VAT. No returns on damaged products.
            </div>
        </div>
    </div>
    `;
    
    summaryContainer.innerHTML = html;
    totalElement.textContent = `R${total.toFixed(2)}`;
}
    
// ===== FORM HANDLING =====
    function validateForm(formData) {
        const errors = [];
        
        if (!formData.firstName?.trim()) {
    errors.push('First name is required');
}

if (!formData.surname?.trim()) {
    errors.push('Surname is required');
}
        
        if (!formData.customerPhone?.trim()) {
            errors.push('Phone number is required');
        }
        
        if (!formData.shippingAddress?.trim()) {
            errors.push('Shipping address is required');
        }
        
        const cartItems = BeautyHubCart.getCartItems();
        if (cartItems.length === 0) {
            errors.push('Cart is empty');
        }
        
        return errors;
    }
    
//=====================================
    // SubmitOrder function
//======================================
async function submitOrder(event) {
    event.preventDefault();
    
    // DEBUG: Check form values
    console.log('DEBUG Form Values:', {
        firstName: document.getElementById('customer-firstname').value,
        surname: document.getElementById('customer-surname').value,
        phone: document.getElementById('customer-phone').value
    });
    
    // Get form data
    const formData = {
        firstName: document.getElementById('customer-firstname').value,
        surname: document.getElementById('customer-surname').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerWhatsApp: document.getElementById('customer-whatsapp').value,
        customerEmail: document.getElementById('customer-email').value,
        customerType: document.getElementById('customer-type').value,
        preferredPaymentMethod: document.getElementById('preferred-payment-method').value,
        priority: document.getElementById('order-priority').value,
        shippingAddress: document.getElementById('shipping-address').value,
        orderNotes: document.getElementById('order-notes').value,
        cartItems: BeautyHubCart.getCartItems(),
        totalAmount: BeautyHubCart.getCartTotal()
    };
    
    // Validate
    const errors = validateForm(formData);
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return;
    }
    
    // Check if OrdersManager exists
    if (typeof OrdersManager === 'undefined') {
        showError('Order system not available');
        return;
    }
    
    // ===== NEW CODE: Check if existing customer =====
    const checkoutForm = document.getElementById('checkout-form');
    const isExistingCustomer = checkoutForm && checkoutForm.dataset.existingCustomer === 'true';
    const existingOrderId = checkoutForm ? checkoutForm.dataset.existingCustomerId : null;
    
    if (isExistingCustomer && existingOrderId) {
        console.log('[CustomerOrder] Updating existing customer details:', existingOrderId);
        
        // Update the original order with new customer details
        await updateExistingCustomerDetails(existingOrderId, {
            firstName: formData.firstName,
            surname: formData.surname,
            customerPhone: formData.customerPhone,
            customerWhatsApp: formData.customerWhatsApp,
            customerEmail: formData.customerEmail,
            shippingAddress: formData.shippingAddress,
            customerType: formData.customerType,
            preferredPaymentMethod: formData.preferredPaymentMethod,
            updatedAt: new Date().toISOString()
        });
    }
    
    // Create NEW order (this happens whether new or existing customer)
    const order = OrdersManager.createOrder(formData);
    
    if (order) {
        // Success - show confirmation with appropriate message
        const successMessage = isExistingCustomer 
            ? `Order #${order.id} placed! Customer details updated.`
            : `Order #${order.id} placed successfully!`;
        
        showSuccess(successMessage, order.id);
        
        // Clear cart
        BeautyHubCart.clearCart();
        
        // Clear customer tracking data
        if (checkoutForm) {
            delete checkoutForm.dataset.existingCustomer;
            delete checkoutForm.dataset.existingCustomerId;
        }
        
        // Dispatch order created event
        if (typeof AppManager !== 'undefined') {
            AppManager.dispatchOrderCreated();
        }
        
        // Close modal after delay
        setTimeout(() => {
            closeCheckout();
        }, 3000);
    } else {
        showError('Failed to place order. Please try again.');
    }
}

// ===== UPDATE EXISTING CUSTOMER DETAILS =====
function updateExistingCustomerDetails(orderId, updatedDetails) {
    console.log('[CustomerOrder] Updating customer details for order:', orderId, updatedDetails);
    
    try {
        // Update in localStorage (orders collection)
        const ordersJSON = localStorage.getItem('beautyhub_orders');
        if (ordersJSON) {
            const orders = JSON.parse(ordersJSON) || [];
            const orderIndex = orders.findIndex(order => order.id === orderId);
            
            if (orderIndex !== -1) {
                // Merge old order with updated customer details
                orders[orderIndex] = {
                    ...orders[orderIndex],
                    ...updatedDetails
                };
                
                localStorage.setItem('beautyhub_orders', JSON.stringify(orders));
                console.log('[CustomerOrder] Updated customer details in localStorage');
            }
        }
        
        // Also update in Firestore if available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                await db.collection('orders').doc(orderId).update(updatedDetails);
                console.log('[CustomerOrder] Updated customer details in Firestore');
            } catch (firestoreError) {
                console.warn('[CustomerOrder] Could not update Firestore:', firestoreError);
            }
        }
        
        return true;
    } catch (error) {
        console.error('[CustomerOrder] Error updating customer details:', error);
        return false;
    }
}

// ===== UI FEEDBACK =====
    function showSuccess(message, orderId) {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="
                background: #4CAF50;
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                font-size: 2rem;
            ">
                ✓
            </div>
            <h3 style="color: #4CAF50;">${message || 'Order Placed Successfully!'}</h3>
            <p>Thank you for your order. We will contact you shortly.</p>
            ${orderId ? `
            <p style="font-size: 0.9rem; color: #666;">
                Order ID: <strong>${orderId}</strong>
            </p>
            ` : ''}
        </div>
    `;
}
    
    function showError(message) {
        const errorDiv = document.getElementById('checkout-error');
        if (errorDiv) {
            errorDiv.innerHTML = message;
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    function clearError() {
        const errorDiv = document.getElementById('checkout-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    function resetForm() {
        if (checkoutForm) {
            checkoutForm.reset();
        }
    }
    
// ===== EVENT HANDLERS =====
    function setupEventListeners() {
        // Close modal
        document.addEventListener('click', function(e) {
            if (e.target.id === 'close-checkout' || 
                (e.target.id === 'checkout-modal' && e.target.classList.contains('checkout-modal'))) {
                closeCheckout();
            }
        });
        
        // Escape key closes modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && checkoutModal.style.display === 'flex') {
                closeCheckout();
            }
        });
        
        // Form submission
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', submitOrder);
        }
    }    
// ===== PUBLIC API =====
    return {
        init,
        openCheckout,
        closeCheckout
    };
})();
