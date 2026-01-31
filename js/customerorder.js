// ========================================================
// customerorder.js - Customer Order Form & Submission
// UPDATED: Fixed property name alignment and integration issues
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
        // DON'T check for the checkout form here - it hasn't been created yet
        // Just create the modal first
        createCheckoutModal();
        
        // Only setup event listeners if modal was created
        if (checkoutModal) {
            setupEventListeners();
            
            // Initialize customer search if available
            if (typeof CustomerSearchManager !== 'undefined') {
                console.log('[CustomerOrder] CustomerSearchManager available');
            }
            
            console.log('[CustomerOrder] Initialization complete');
            
            return {
                openCheckout,
                closeCheckout
            };
        }
        
    } catch (error) {
        console.error('[CustomerOrder] Initialization failed:', error);
        return null;
    }
}
    // ========================================================
    // MODAL CREATION
    // ========================================================
    function createCheckoutModal() {
        console.log('[CustomerOrder] Creating checkout modal...');
        
        try {
            // Check if modal already exists in DOM
        if (document.getElementById('checkout-modal')) {
            checkoutModal = document.getElementById('checkout-modal');
            checkoutForm = document.getElementById('checkout-form');
            console.log('[CustomerOrder] Using existing checkout modal');
            return; // Don't recreate if it exists
        }

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
            <!-- <button id="close-checkout" class="modal-close-btn">&times;</button> -->
           
            <button id="close-checkout" class="modal-close-btn" 
                style="position: absolute !important; top: 16px !important; 
                       right: 16px !important; background: white !important; 
                       border: gold !important; font-size: 28px !important; 
                       color: #666 !important; cursor: pointer !important; 
                       z-index: 1000 !important;">&times;</button>
                    
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
        WhatsApp Number <span style="color: red;">*</span>
    </label>
    <input type="tel" id="customer-whatsapp" required>
    <small style="color: #666; font-size: 0.9rem;">
        Required for payment instructions and order updates
    </small>
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
                         <!--       <option value="payfast">PayFast</option>  -->
                          <!--      <option value="credit_card">Credit Card</option>  -->
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
    <textarea 
        id="order-notes" 
        rows="2"
        placeholder="e.g., Deliver on weekends, leave at gate, Ask for Jennie, etc."
    ></textarea>
    <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
        Add delivery instructions or special requests for your order
    </div>
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
                createCheckoutModal();
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
            // Initialize CustomerSearch if available
if (typeof CustomerSearchManager !== 'undefined') {
    console.log('[CustomerOrder] Initializing CustomerSearchManager for checkout');
    CustomerSearchManager.init('#checkout-form');
}
            
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
                // Use item.price (from cart) which should already be the correct price
                const price = parseFloat(item.currentPrice) || parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 1;
                return total + (price * quantity);
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
            // Remove customer search UI if present
const searchContainer = document.getElementById('customer-search-container');
if (searchContainer) {
    searchContainer.remove();
    console.log('[CustomerOrder] Removed customer search UI');
}
            
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
        try {
            const numericSubtotal = parseFloat(subtotal) || 0;
            return numericSubtotal >= CONFIG.SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST;
        } catch (error) {
            console.error('[CustomerOrder] Failed to calculate shipping:', error);
            return CONFIG.SHIPPING_COST;
        }
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
        try {
            const price = parseFloat(item.currentPrice) || parseFloat(item.price) || 0;            
            const quantity = parseInt(item.quantity) || 1;
            const itemTotal = price * quantity;
            
            return `
                <div class="summary-item">
                    <div class="item-name">
                        ${item.productName} × ${quantity}
                        ${item.isDiscounted ? '<span class="discount-badge">(Discounted)</span>' : ''}
                    </div>
                    <div class="item-price">R${itemTotal.toFixed(2)}</div>
                </div>
            `;
        } catch (error) {
            console.error('[CustomerOrder] Failed to generate cart item HTML:', error);
            return '<div class="error-item">Error loading item</div>';
        }
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
            // Add this after phone validation
if (!formData.customerWhatsApp?.trim()) {
    errors.push('WhatsApp number is required for payment instructions');
}

// WhatsApp format validation
if (formData.customerWhatsApp && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.customerWhatsApp)) {
    errors.push('Please enter a valid WhatsApp number');
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
            if (typeof InventoryManager !== 'undefined' && typeof InventoryManager.checkStockBeforeAddToCart === 'function') {
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
            // Clear any previous errors
            clearError();
            
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
        // ========== CUSTOMER SEES THIS ==========
        showError('Failed to place order. Please try again.');
        
        // ========== ADMIN SEES THIS (if you add it) ==========
        // Optional: Alert admin in dashboard
        if (typeof window.isAdminDashboardOpen === 'function' && 
            window.isAdminDashboardOpen() && 
            typeof window.showDashboardNotification === 'function') {
            
            window.showDashboardNotification('⚠️ Customer checkout failed', 'error');
        }
     }
    }

    function getFormData() {
        try {
            return {
                firstName: document.getElementById('customer-firstname')?.value.trim() || '',
                surname: document.getElementById('customer-surname')?.value.trim() || '',
                customerPhone: document.getElementById('customer-phone')?.value.trim() || '',
                customerWhatsApp: document.getElementById('customer-whatsapp')?.value.trim() || '',
                customerEmail: document.getElementById('customer-email')?.value.trim() || '',
                customerType: document.getElementById('customer-type')?.value || 'personal',
                preferredPaymentMethod: document.getElementById('preferred-payment-method')?.value || 'manual',
                priority: document.getElementById('order-priority')?.value || 'normal',
                shippingAddress: document.getElementById('shipping-address')?.value.trim() || '',
                orderNotes: document.getElementById('order-notes')?.value.trim() || '',
                cartItems: BeautyHubCart.getCartItemsWithPrices(),  // CHANGED FEOM cartItems: BeautyHubCart.getCartItems(),
                discount: 0, // No discount applied initially
                adminNotes: '' // Empty by default
            };
        } catch (error) {
            console.error('[CustomerOrder] Failed to get form data:', error);
            return {
                firstName: '',
                surname: '',
                customerPhone: '',
                customerWhatsApp: '',
                customerEmail: '',
                customerType: 'personal',
                preferredPaymentMethod: 'manual',
                priority: 'normal',
                shippingAddress: '',
                orderNotes: '',
                cartItems: [],
                discount: 0,
                adminNotes: ''
            };
        }
    }

    async function handleExistingCustomerUpdate(formData) {
        try {
            const checkoutForm = document.getElementById('checkout-form');
            const isExistingCustomer = checkoutForm && checkoutForm.dataset.existingCustomer === 'true';
            const existingOrderId = checkoutForm ? checkoutForm.dataset.existingCustomerId : null;
            
            if (isExistingCustomer && existingOrderId) {
                console.log('[CustomerOrder] Updating existing customer details:', existingOrderId);
                
                // Update in localStorage
                const ordersJSON = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
                if (ordersJSON) {
                    const orders = JSON.parse(ordersJSON) || [];
                    const orderIndex = orders.findIndex(order => order.id === existingOrderId);
                    
                    if (orderIndex !== -1) {
                        orders[orderIndex] = {
                            ...orders[orderIndex],
                            firstName: formData.firstName,
                            surname: formData.surname,
                            customerPhone: formData.customerPhone,
                            customerWhatsApp: formData.customerWhatsApp,
                            customerEmail: formData.customerEmail,
                            shippingAddress: formData.shippingAddress,
                            customerType: formData.customerType,
                            preferredPaymentMethod: formData.preferredPaymentMethod,
                            updatedAt: new Date().toISOString()
                        };
                        localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
                        console.log('[CustomerOrder] Updated customer details in localStorage');
                    }
                }
            }
        } catch (error) {
            console.warn('[CustomerOrder] Failed to update existing customer:', error);
            // Non-critical error, continue with order
        }
    }

// ========================================================
// WHATSAPP ALERT TO ADMIN (YOU)  Added new congirm its placement
// ========================================================
async function sendAdminWhatsAppAlert(order, customerData) {
    try {
        console.log('[CustomerOrder] Sending WhatsApp alert to admin for order:', order.id);
        
        // REPLACE THIS WITH YOUR ACTUAL WHATSAPP NUMBER (with country code, no +)
        // South Africa: 27XXXXXXXXX
        // Example: 27821234567
        const adminWhatsAppNumber = "27720138750"; // ⚠️ CHANGE THIS TO YOUR NUMBER
        
        const message = encodeURIComponent(
            `📦 *NEW ORDER ALERT*\n\n` +
            `*Order #:* ${order.id}\n` +
            `*Customer:* ${customerData.firstName} ${customerData.surname}\n` +
            `*Phone:* ${customerData.customerPhone}\n` +
            `*WhatsApp:* ${customerData.customerWhatsApp || 'Not provided'}\n` +
            `*Type:* ${customerData.customerType.toUpperCase()}\n` +
            `*Amount:* R${order.totalAmount.toFixed(2)}\n` +
            `*Items:* ${order.items.length} product(s)\n` +
            `*Address:* ${customerData.shippingAddress.substring(0, 50)}...\n\n` +
            `📍 *Action Required:* Log into Admin Dashboard`
        );
        
        // Open WhatsApp in new tab
        const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        console.log('[CustomerOrder] WhatsApp alert sent to admin');
        
    } catch (error) {
        console.error('[CustomerOrder] Failed to send WhatsApp alert:', error);
        // Don't show error to customer - this is background notification
    }
}
    
    async function handleSuccessfulOrder(order, formData) {
        try {
            console.log('[CustomerOrder] Order created successfully:', order.id);
            // ⭐⭐⭐ ADD THIS LINE ⭐⭐⭐
        await sendAdminWhatsAppAlert(order, formData);
            
            // Clear cart
            if (typeof BeautyHubCart !== 'undefined' && typeof BeautyHubCart.clearCart === 'function') {
                BeautyHubCart.clearCart();
            }
            
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
            
            // Dispatch order created event for other modules
            window.dispatchEvent(new CustomEvent('orderCreated', { 
                detail: { orderId: order.id, order: order } 
            }));
            
            // Trigger inventory update via event
            window.dispatchEvent(new CustomEvent('orderPlaced', {
                detail: { orderId: order.id, items: formData.cartItems }
            }));
            
            // Update admin badge if available
            if (typeof AdminManager !== 'undefined' && typeof AdminManager.updateAdminButtonVisibility === 'function') {
                AdminManager.updateAdminButtonVisibility();
            }
            
            // Close modal after delay
            setTimeout(() => {
                closeCheckout();
            }, 3000);
            
        } catch (error) {
            console.error('[CustomerOrder] Error handling successful order:', error);
            // Still show success but log the error
            showSuccess(`Order #${order.id} placed successfully!`, order.id);
            setTimeout(() => {
                closeCheckout();
            }, 3000);
        }
    }

    // ========================================================
    // UI FEEDBACK
    // ========================================================
    function showSuccess(message, orderId) {
        console.log('[CustomerOrder] Showing success message:', message);
        // Remove customer search UI if present
const searchContainer = document.getElementById('customer-search-container');
if (searchContainer) {
    searchContainer.remove();
    console.log('[CustomerOrder] Removed customer search UI for success display');
}
        
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
                    <div class="success-actions">
                        <button type="button" class="continue-shopping-btn" onclick="CustomerOrderManager.closeCheckout()">
                            Continue Shopping
                        </button>
                    </div>
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
                
                // Reset order summary
                const summaryContainer = document.getElementById('checkout-items-summary');
                const totalElement = document.getElementById('checkout-total-summary');
                if (summaryContainer) summaryContainer.innerHTML = '';
                if (totalElement) totalElement.textContent = 'R0.00';
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
            const closeBtn = document.getElementById('close-checkout');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeCheckout);
            }
            
            // Click outside to close
            checkoutModal?.addEventListener('click', function(e) {
                if (e.target === checkoutModal) {
                    closeCheckout();
                }
            });
            
            // Escape key closes modal
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && checkoutModal?.style.display === 'flex') {
                    closeCheckout();
                }
            });
            
            // Form submission
            if (checkoutForm) {
                checkoutForm.addEventListener('submit', submitOrder);
            }
            
            console.log('[CustomerOrder] Event listeners setup complete');
            
        } catch (error) {
            console.error('[CustomerOrder] Failed to setup event listeners:', error);
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

