// ========================================================
// customerorder.js - Customer Order Form & Submission
// Core Functionalities:
// 1. Checkout modal with customer information form
// 2. Order validation and submission to OrdersManager
// 3. Customer type classification (personal/retailer/wholesaler)
// 4. Payment method and priority selection
// 5. Integration with CustomerSearchManager for existing customers
// 6. Order summary with shipping calculation
// 7. Success/error handling with user feedback
// ========================================================

const CustomerOrderManager = (function() {
    // ========================================================
    // CONFIGURATION & CONSTANTS
    // ========================================================
    const CONFIG = {
        SHIPPING_THRESHOLD: 1000,
        SHIPPING_COST: 100,
        VAT_PERCENTAGE: 15,
        STORAGE_KEYS: {
            ORDERS: 'beautyhub_orders',
            CUSTOMERS: 'beautyhub_customers'
        }
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let checkoutModal = null;
    let checkoutForm = null;

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        console.log('[CustomerOrder] Initializing customer order system...');
        
        try {
            // Check if checkout functionality is needed
            const checkoutButton = document.querySelector('[onclick*="openCheckout"], [onclick*="CustomerOrderManager"]');
            if (!checkoutButton && !document.getElementById('checkout-form')) {
                console.log('[CustomerOrder] No checkout UI found, skipping initialization');
                return;
            }
            
            createCheckoutModal();
            setupEventListeners();
            
            // Initialize customer search if available
            if (typeof CustomerSearchManager !== 'undefined') {
                console.log('[CustomerOrder] Initializing CustomerSearchManager');
                CustomerSearchManager.init();
            }
            
            console.log('[CustomerOrder] Initialization complete');
            
        } catch (error) {
            console.error('[CustomerOrder] Initialization failed:', error);
            throw new Error('Customer order system initialization failed: ' + error.message);
        }
    }

    // ========================================================
    // MODAL CREATION
    // ========================================================
    function createCheckoutModal() {
        console.log('[CustomerOrder] Creating checkout modal...');
        
        try {
            // Remove existing modal if present
            const existingModal = document.getElementById('checkout-modal');
            if (existingModal) {
                existingModal.remove();
                console.log('[CustomerOrder] Removed existing checkout modal');
            }

            // Create modal container
            checkoutModal = document.createElement('div');
            checkoutModal.id = 'checkout-modal';
            checkoutModal.className = 'checkout-modal';
            
            checkoutModal.innerHTML = `
                <div class="checkout-modal-content">
                    <button id="close-checkout" class="modal-close-btn">&times;</button>
                    
                    <h2>Place Your Order</h2>
                    
                    <form id="checkout-form">
                        <!-- Customer Information -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="customer-firstname">
                                    First Name <span class="required">*</span>
                                </label>
                                <input type="text" id="customer-firstname" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customer-surname">
                                    Surname <span class="required">*</span>
                                </label>
                                <input type="text" id="customer-surname" required>
                            </div>
                        </div>
                        
                        <!-- Contact Information -->
                        <div class="form-group">
                            <label for="customer-phone">
                                Phone Number <span class="required">*</span>
                            </label>
                            <input type="tel" id="customer-phone" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-whatsapp">
                                WhatsApp (optional)
                            </label>
                            <input type="tel" id="customer-whatsapp">
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-email">
                                Email Address (optional)
                            </label>
                            <input type="email" id="customer-email">
                        </div>
                        
                        <!-- Customer Classification -->
                        <div class="form-group">
                            <label for="customer-type">
                                Customer Type
                            </label>
                            <select id="customer-type">
                                <option value="personal">Personal</option>
                                <option value="retailer">Retailer</option>
                                <option value="wholesaler">Wholesaler</option>
                                <option value="corporate">Corporate</option>
                            </select>
                        </div>
                        
                        <!-- Order Settings -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="preferred-payment-method">
                                    Preferred Payment Method
                                </label>
                                <select id="preferred-payment-method">
                                    <option value="manual">Manual/Cash</option>
                                    <option value="payfast">PayFast</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="eft">EFT</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="order-priority">
                                    Order Priority
                                </label>
                                <select id="order-priority">
                                    <option value="normal">Normal</option>
                                    <option value="low">Low</option>
                                    <option value="high">High</option>
                                    <option value="rush">Rush</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Shipping Information -->
                        <div class="form-group">
                            <label for="shipping-address">
                                Shipping Address <span class="required">*</span>
                            </label>
                            <textarea id="shipping-address" rows="3" required></textarea>
                        </div>
                        
                        <!-- Additional Notes -->
                        <div class="form-group">
                            <label for="order-notes">
                                Special Instructions (optional)
                            </label>
                            <textarea id="order-notes" rows="2"></textarea>
                        </div>
                        
                        <!-- Order Summary -->
                        <div class="order-summary-section">
                            <h4>Order Summary</h4>
                            <div id="checkout-items-summary"></div>
                            <div class="order-total-row">
                                <strong>Total:</strong>
                                <strong id="checkout-total-summary">R0.00</strong>
                            </div>
                        </div>
                        
                        <!-- Error Display -->
                        <div id="checkout-error" class="error-message"></div>
                        
                        <!-- Submit Button -->
                        <button type="submit" class="submit-order-btn">
                            <i class="fas fa-paper-plane"></i>
                            Place Order
                        </button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(checkoutModal);
            checkoutForm = document.getElementById('checkout-form');
            
            console.log('[CustomerOrder] Checkout modal created successfully');
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to create checkout modal:', error);
            throw new Error('Checkout modal creation failed: ' + error.message);
        }
    }

    // ========================================================
    // MODAL CONTROLS
    // ========================================================
    function openCheckout() {
        console.log('[CustomerOrder] Opening checkout modal...');
        
        try {
            if (!checkoutModal) {
                console.error('[CustomerOrder] Checkout modal not initialized');
                return;
            }
            
            if (typeof BeautyHubCart === 'undefined') {
                showError('Cart system not available');
                console.error('[CustomerOrder] BeautyHubCart not available');
                return;
            }
            
            const cartItems = BeautyHubCart.getCartItems();
            
            if (cartItems.length === 0) {
                showError('Your cart is empty');
                console.warn('[CustomerOrder] Cart is empty, cannot open checkout');
                return;
            }
            
            // Calculate order summary
            const subtotal = calculateSubtotal(cartItems);
            updateOrderSummary(cartItems, subtotal);
            
            // Show modal
            checkoutModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus on first field
            const firstNameField = document.getElementById('customer-firstname');
            if (firstNameField) {
                firstNameField.focus();
            }
            
            console.log('[CustomerOrder] Checkout modal opened with', cartItems.length, 'items');
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to open checkout:', error);
            showError('Failed to open checkout. Please try again.');
        }
    }

    function calculateSubtotal(cartItems) {
        try {
            return cartItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        } catch (error) {
            console.error('[CustomerOrder] Failed to calculate subtotal:', error);
            return 0;
        }
    }

    function closeCheckout() {
        console.log('[CustomerOrder] Closing checkout modal...');
        
        try {
            if (!checkoutModal) return;
            
            checkoutModal.style.display = 'none';
            document.body.style.overflow = '';
            clearError();
            resetForm();
            
            // Clear customer tracking data
            if (checkoutForm) {
                delete checkoutForm.dataset.existingCustomer;
                delete checkoutForm.dataset.existingCustomerId;
            }
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to close checkout:', error);
        }
    }

    // ========================================================
    // ORDER SUMMARY
    // ========================================================
    function updateOrderSummary(cartItems, subtotal) {
        console.log('[CustomerOrder] Updating order summary...');
        
        try {
            const summaryContainer = document.getElementById('checkout-items-summary');
            const totalElement = document.getElementById('checkout-total-summary');
            
            if (!summaryContainer || !totalElement) {
                console.error('[CustomerOrder] Summary elements not found');
                return;
            }
            
            const shipping = calculateShipping(subtotal);
            const total = subtotal + shipping;
            const isFreeShipping = shipping === 0;
            
            const html = generateOrderSummaryHTML(cartItems, subtotal, shipping, total, isFreeShipping);
            summaryContainer.innerHTML = html;
            totalElement.textContent = `R${total.toFixed(2)}`;
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to update order summary:', error);
        }
    }

    function calculateShipping(subtotal) {
        return subtotal >= CONFIG.SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST;
    }

    function generateOrderSummaryHTML(cartItems, subtotal, shipping, total, isFreeShipping) {
        try {
            return `
                <div class="summary-items">
                    ${cartItems.map(item => generateCartItemHTML(item)).join('')}
                </div>
                
                <div class="summary-breakdown">
                    <div class="breakdown-row">
                        <span>Subtotal:</span>
                        <span>R${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div class="breakdown-row">
                        <span>Shipping:</span>
                        <span class="${isFreeShipping ? 'free-shipping' : ''}">
                            ${isFreeShipping ? 'FREE' : `R${shipping.toFixed(2)}`}
                        </span>
                    </div>
                    
                    ${!isFreeShipping ? `
                    <div class="shipping-note">
                        <i class="fas fa-truck"></i>
                        Free shipping on orders over R${CONFIG.SHIPPING_THRESHOLD}
                    </div>
                    ` : ''}
                    
                    <div class="breakdown-row total-row">
                        <span>Total:</span>
                        <span>R${total.toFixed(2)}</span>
                    </div>
                    
                    <div class="vat-note">
                        <i class="fas fa-info-circle"></i>
                        Includes ${CONFIG.VAT_PERCENTAGE}% VAT. No returns on damaged products.
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[CustomerOrder] Failed to generate summary HTML:', error);
            return '<div class="error">Failed to load order summary</div>';
        }
    }

    function generateCartItemHTML(item) {
        const itemTotal = item.price * item.quantity;
        
        return `
            <div class="summary-item">
                <div class="item-name">
                    ${item.productName} × ${item.quantity}
                    ${item.isDiscounted ? '<span class="discount-badge">(Discounted)</span>' : ''}
                </div>
                <div class="item-price">R${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }

    // ========================================================
    // FORM VALIDATION
    // ========================================================
    function validateForm(formData) {
        console.log('[CustomerOrder] Validating form data...');
        
        const errors = [];
        
        try {
            // Required fields
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
            
            // Phone number format validation (basic)
            if (formData.customerPhone && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.customerPhone)) {
                errors.push('Please enter a valid phone number');
            }
            
            // Email validation (if provided)
            if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
                errors.push('Please enter a valid email address');
            }
            
            // Cart validation
            const cartItems = BeautyHubCart.getCartItems();
            if (cartItems.length === 0) {
                errors.push('Your cart is empty');
            }
            
            // Inventory validation if available
            if (typeof InventoryManager !== 'undefined') {
                for (const item of cartItems) {
                    const stockCheck = InventoryManager.checkStockBeforeAddToCart(item.productId, item.quantity);
                    if (!stockCheck.available) {
                        errors.push(`${item.productName}: ${stockCheck.reason}`);
                    }
                }
            }
            
        } catch (error) {
            console.error('[CustomerOrder] Form validation error:', error);
            errors.push('Form validation failed. Please check your inputs.');
        }
        
        return errors;
    }

    // ========================================================
    // ORDER SUBMISSION
    // ========================================================
    async function submitOrder(event) {
        console.log('[CustomerOrder] Submitting order...');
        event.preventDefault();
        
        try {
            // Get form data
            const formData = getFormData();
            console.log('[CustomerOrder] Form data collected:', formData);
            
            // Validate form
            const validationErrors = validateForm(formData);
            if (validationErrors.length > 0) {
                console.warn('[CustomerOrder] Form validation failed:', validationErrors);
                showError(validationErrors.join('<br>'));
                return;
            }
            
            // Check if OrdersManager exists
            if (typeof OrdersManager === 'undefined') {
                const errorMsg = 'Order system not available';
                console.error('[CustomerOrder]', errorMsg);
                showError(errorMsg);
                return;
            }
            
            // Handle existing customer update
            await handleExistingCustomerUpdate(formData);
            
            // Create new order
            const order = OrdersManager.createOrder(formData);
            
            if (order) {
                await handleSuccessfulOrder(order, formData);
            } else {
                throw new Error('Order creation failed');
            }
            
        } catch (error) {
            console.error('[CustomerOrder] Order submission failed:', error);
            showError('Failed to place order. Please try again.');
        }
    }

    function getFormData() {
        return {
            firstName: document.getElementById('customer-firstname').value.trim(),
            surname: document.getElementById('customer-surname').value.trim(),
            customerPhone: document.getElementById('customer-phone').value.trim(),
            customerWhatsApp: document.getElementById('customer-whatsapp').value.trim(),
            customerEmail: document.getElementById('customer-email').value.trim(),
            customerType: document.getElementById('customer-type').value,
            preferredPaymentMethod: document.getElementById('preferred-payment-method').value,
            priority: document.getElementById('order-priority').value,
            shippingAddress: document.getElementById('shipping-address').value.trim(),
            orderNotes: document.getElementById('order-notes').value.trim(),
            cartItems: BeautyHubCart.getCartItems(),
            totalAmount: BeautyHubCart.getCartTotal()
        };
    }

    async function handleExistingCustomerUpdate(formData) {
        try {
            const checkoutForm = document.getElementById('checkout-form');
            const isExistingCustomer = checkoutForm && checkoutForm.dataset.existingCustomer === 'true';
            const existingOrderId = checkoutForm ? checkoutForm.dataset.existingCustomerId : null;
            
            if (isExistingCustomer && existingOrderId) {
                console.log('[CustomerOrder] Updating existing customer details:', existingOrderId);
                
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
        } catch (error) {
            console.warn('[CustomerOrder] Failed to update existing customer:', error);
        }
    }

    async function handleSuccessfulOrder(order, formData) {
        console.log('[CustomerOrder] Order created successfully:', order.id);
        
        // Clear cart
        BeautyHubCart.clearCart();
        
        // Clear customer tracking data
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            delete checkoutForm.dataset.existingCustomer;
            delete checkoutForm.dataset.existingCustomerId;
        }
        
        // Show success message
        const isExistingCustomer = checkoutForm && checkoutForm.dataset.existingCustomer === 'true';
        const successMessage = isExistingCustomer 
            ? `Order #${order.id} placed! Customer details updated.`
            : `Order #${order.id} placed successfully!`;
        
        showSuccess(successMessage, order.id);
        
        // Dispatch order created event
        if (typeof AppManager !== 'undefined') {
            AppManager.dispatchOrderCreated();
        }
        
        // Update inventory if available
        if (typeof InventoryManager !== 'undefined') {
            await updateInventory(formData.cartItems);
        }
        
        // Close modal after delay
        setTimeout(() => {
            closeCheckout();
        }, 3000);
    }

    async function updateInventory(cartItems) {
        try {
            for (const item of cartItems) {
                const success = await InventoryManager.updateStockAfterOrder(item.productId, item.quantity);
                if (success) {
                    console.log(`[CustomerOrder] Inventory updated for ${item.productName}`);
                } else {
                    console.warn(`[CustomerOrder] Failed to update inventory for ${item.productName}`);
                }
            }
        } catch (error) {
            console.error('[CustomerOrder] Inventory update failed:', error);
        }
    }

    // ========================================================
    // CUSTOMER MANAGEMENT
    // ========================================================
    async function updateExistingCustomerDetails(orderId, updatedDetails) {
        console.log('[CustomerOrder] Updating customer details for order:', orderId);
        
        try {
            // Update in localStorage
            const ordersJSON = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
            if (ordersJSON) {
                const orders = JSON.parse(ordersJSON) || [];
                const orderIndex = orders.findIndex(order => order.id === orderId);
                
                if (orderIndex !== -1) {
                    orders[orderIndex] = {
                        ...orders[orderIndex],
                        ...updatedDetails
                    };
                    localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
                    console.log('[CustomerOrder] Updated customer details in localStorage');
                }
            }
            
            // Update Firestore if available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('orders').doc(orderId).update(updatedDetails);
                console.log('[CustomerOrder] Updated customer details in Firestore');
            }
            
            return true;
            
        } catch (error) {
            console.error('[CustomerOrder] Error updating customer details:', error);
            return false;
        }
    }

    // ========================================================
    // UI FEEDBACK
    // ========================================================
    function showSuccess(message, orderId) {
        console.log('[CustomerOrder] Showing success message:', message);
        
        try {
            const form = document.getElementById('checkout-form');
            if (!form) return;
            
            form.innerHTML = `
                <div class="success-message">
                    <div class="success-icon">✓</div>
                    <h3>${message || 'Order Placed Successfully!'}</h3>
                    <p>Thank you for your order. We will contact you shortly.</p>
                    ${orderId ? `
                    <p class="order-id-display">
                        Order ID: <strong>${orderId}</strong>
                    </p>
                    ` : ''}
                </div>
            `;
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to show success message:', error);
        }
    }

    function showError(message) {
        console.log('[CustomerOrder] Showing error message:', message);
        
        try {
            const errorDiv = document.getElementById('checkout-error');
            if (errorDiv) {
                errorDiv.innerHTML = message;
                errorDiv.style.display = 'block';
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            console.error('[CustomerOrder] Failed to show error message:', error);
        }
    }

    function clearError() {
        try {
            const errorDiv = document.getElementById('checkout-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.innerHTML = '';
            }
        } catch (error) {
            console.error('[CustomerOrder] Failed to clear error:', error);
        }
    }

    function resetForm() {
        console.log('[CustomerOrder] Resetting form...');
        
        try {
            if (checkoutForm) {
                checkoutForm.reset();
                // Reset customer tracking data
                delete checkoutForm.dataset.existingCustomer;
                delete checkoutForm.dataset.existingCustomerId;
            }
        } catch (error) {
            console.error('[CustomerOrder] Failed to reset form:', error);
        }
    }

    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    function setupEventListeners() {
        console.log('[CustomerOrder] Setting up event listeners...');
        
        try {
            // Close modal button
            document.addEventListener('click', handleCloseCheckout);
            
            // Escape key closes modal
            document.addEventListener('keydown', handleEscapeKey);
            
            // Form submission
            if (checkoutForm) {
                checkoutForm.addEventListener('submit', submitOrder);
            }
            
            console.log('[CustomerOrder] Event listeners setup complete');
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to setup event listeners:', error);
        }
    }

    function handleCloseCheckout(e) {
        if (e.target.id === 'close-checkout' || 
            (e.target.id === 'checkout-modal' && e.target.classList.contains('checkout-modal'))) {
            closeCheckout();
        }
    }

    function handleEscapeKey(e) {
        if (e.key === 'Escape' && checkoutModal.style.display === 'flex') {
            closeCheckout();
        }
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init,
        openCheckout,
        closeCheckout,
        showSuccess,
        showError
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    CustomerOrderManager.init();
});
