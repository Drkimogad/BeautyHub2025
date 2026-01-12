// customerSearch.js - Customer Search & Auto-fill Manager.
const CustomerSearchManager = (function() {
    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_orders',  // Searching orders, not customers
        SEARCH_TIMEOUT: 1000, // Reduced from 3000ms
        FIREBASE: {
            enabled: false,
            collection: 'orders'
        }
    };
    
    // DOM Elements
    let searchContainer = null;
    let searchForm = null;
    
    // Initialize
function init(containerSelector = '#checkout-form') {
    // Don't create search UI unless checkout form exists
    if (!document.getElementById('checkout-form')) {
        console.log('[CustomerSearch] No checkout form found on this page');
        return {
            searchCustomer,
            autoFillForm,
            normalizePhone
        };
    }
    
    createSearchUI();
    setupEventListeners();
    return {
        searchCustomer,
        autoFillForm,
        normalizePhone
    };
}
    
    // ============================================
    // SEARCH UI COMPONENT
    // ============================================
    function createSearchUI() {
        // Remove existing search UI if present
        const existingSearch = document.getElementById('customer-search-container');
        if (existingSearch) existingSearch.remove();
        
        // Create search container
        searchContainer = document.createElement('div');
        searchContainer.id = 'customer-search-container';
        searchContainer.className = 'customer-search-container';
        searchContainer.style.cssText = `
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f0f8ff;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
        `;
        
        // Search UI HTML
        searchContainer.innerHTML = `
            <div class="search-header" style="margin-bottom: 0.75rem;">
                <h4 style="margin: 0 0 0.25rem 0; color: #2196f3;">
                    <i class="fas fa-search" style="margin-right: 8px;"></i>
                    Existing Customer?
                </h4>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">
                    Search by surname and phone number to auto-fill your details
                </p>
            </div>
            
            <form id="customer-search-form" class="search-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end;">
                    <div>
                        <label style="display: block; margin-bottom: 0.25rem; font-weight: 500; color: #555;">
                            Surname *
                        </label>
                        <input type="text" 
                               id="search-surname" 
                               class="search-input"
                               placeholder="e.g., Smith"
                               required
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid #ddd;
                                    border-radius: 4px;
                                    font-size: 0.95rem;
                               ">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.25rem; font-weight: 500; color: #555;">
                            Phone Number *
                        </label>
                        <input type="tel" 
                               id="search-phone" 
                               class="search-input"
                               placeholder="e.g., 072 123 4567"
                               required
                               style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid #ddd;
                                    border-radius: 4px;
                                    font-size: 0.95rem;
                               ">
                    </div>
                    
                    <div>
                        <button type="submit" 
                                id="search-btn" 
                                class="search-btn"
                                style="
                                    padding: 0.75rem 1.5rem;
                                    background: #2196f3;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-weight: 500;
                                    white-space: nowrap;
                                    transition: background 0.2s;
                                ">
                            <i class="fas fa-search" style="margin-right: 6px;"></i>
                            Search
                        </button>
                    </div>
                </div>
                
                <div id="search-result" class="search-result" style="
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 4px;
                    display: none;
                ">
                    <div id="result-content"></div>
                </div>
                
                <div id="search-error" class="search-error" style="
                    margin-top: 0.5rem;
                    padding: 0.75rem;
                    border-radius: 4px;
                    background: #ffebee;
                    color: #d32f2f;
                    display: none;
                "></div>
                
                <div id="search-loading" class="search-loading" style="
                    margin-top: 0.5rem;
                    padding: 0.75rem;
                    text-align: center;
                    display: none;
                ">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                    Searching customer database...
                </div>
            </form>
            
            <div class="search-footer" style="
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px dashed #ddd;
                font-size: 0.85rem;
                color: #777;
            ">
                <p style="margin: 0;">
                    <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                    First time shopping? Just fill in the form below. Your details will be saved for future orders.
                </p>
            </div>
        `;
        
        // Insert into checkout form (if exists)
        const checkoutForm = document.querySelector('#checkout-form');
        if (checkoutForm) {
            checkoutForm.parentNode.insertBefore(searchContainer, checkoutForm);
        } else {
            document.body.appendChild(searchContainer);
        }
        
        searchForm = document.getElementById('customer-search-form');
    }
    
    // ============================================
    // SEARCH LOGIC - FIXED
    // ============================================
    function searchCustomer(surname, phone) {
        console.log('Searching orders for:', { surname, phone });
        
        // Show loading
        showLoading(true);
        hideError();
        hideResult();
        
        // Simulate network delay
        setTimeout(() => {
            try {
                // Search in localStorage orders
                const searchResult = searchOrders(surname, phone);
                
                if (searchResult.found) {
                    showSearchResult(searchResult);
                    autoFillForm(searchResult.latestOrder);
                } else {
                    showError('No previous orders found. Please fill in your details as a new customer.');
                }
                
            } catch (error) {
                console.error('Search error:', error);
                showError('Search failed. Please try again or enter details manually.');
            } finally {
                showLoading(false);
            }
        }, CONFIG.SEARCH_TIMEOUT);
    }
    
    // Search orders by surname and phone
    function searchOrders(surname, phone) {
        try {
            // Get all orders from localStorage
            const ordersJSON = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!ordersJSON) return { found: false };
            
            const allOrders = JSON.parse(ordersJSON) || [];
            if (allOrders.length === 0) return { found: false };
            
            // Normalize search parameters
            const searchSurname = surname.toLowerCase().trim();
            const searchPhone = normalizePhone(phone);
            
            // Find all matching orders
            const matchingOrders = allOrders.filter(order => {
                if (!order.surname || !order.customerPhone) return false;
                
                const orderSurname = order.surname.toLowerCase().trim();
                const orderPhone = normalizePhone(order.customerPhone);
                
                return orderSurname === searchSurname && orderPhone === searchPhone;
            });
            
            if (matchingOrders.length === 0) {
                return { found: false };
            }
            
            // Get most recent order (by createdAt)
            const latestOrder = matchingOrders.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            
            return {
                found: true,
                latestOrder: latestOrder,
                matchingOrders: matchingOrders,
                orderCount: matchingOrders.length,
                totalSpent: matchingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
            };
            
        } catch (error) {
            console.error('Search orders error:', error);
            return { found: false };
        }
    }
    
    // ============================================
    // FORM AUTO-FILL - FIXED (uses order data directly)
    // ============================================
function autoFillForm(order) {
    console.log('Auto-filling from order:', order.id);
    
    // Map order data to form fields
    const fieldMapping = {
        'customer-firstname': order.firstName || '',
        'customer-surname': order.surname || '',
        'customer-phone': order.customerPhone || '',
        'customer-whatsapp': order.customerWhatsApp || '',
        'customer-email': customerEmail || '',
        'shipping-address': order.shippingAddress || ''
    };
    
    // Fill each form field
    Object.entries(fieldMapping).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
            
            // Trigger change event for any validation
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    // Store the original order ID for updating later
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.dataset.existingCustomerId = order.id;
        checkoutForm.dataset.existingCustomer = 'true';
        console.log('[CustomerSearch] Marked as existing customer:', order.id);
    }
    
    // Show message
    showMessage('Customer details loaded. You can edit any field if needed.', 'info');
    
    // Focus on special instructions field for convenience
    const notesField = document.getElementById('order-notes');
    if (notesField) {
        setTimeout(() => notesField.focus(), 100);
    }
}
//==========
// showMessage() helper function
//========
function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMsg = document.getElementById('customer-search-message');
    if (existingMsg) existingMsg.remove();
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'customer-search-message';
    messageDiv.className = `customer-search-message ${type}`;
    messageDiv.style.cssText = `
        margin: 0.75rem 0;
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    // Set colors based on type
    if (type === 'success') {
        messageDiv.style.background = '#e8f5e9';
        messageDiv.style.color = '#2e7d32';
        messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    } else if (type === 'error') {
        messageDiv.style.background = '#ffebee';
        messageDiv.style.color = '#d32f2f';
        messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    } else {
        messageDiv.style.background = '#e3f2fd';
        messageDiv.style.color = '#1565c0';
        messageDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    }
    
    // Insert after search result
    const searchResult = document.getElementById('search-result');
    if (searchResult && searchResult.parentNode) {
        searchResult.parentNode.insertBefore(messageDiv, searchResult.nextSibling);
    }
}
    // ============================================
    // UI FEEDBACK FUNCTIONS - UPDATED
    // ============================================
    function showSearchResult(searchResult) {
        const resultDiv = document.getElementById('search-result');
        const contentDiv = document.getElementById('result-content');
        
        if (!resultDiv || !contentDiv) return;
        
        const customer = searchResult.latestOrder;
        const orderCount = searchResult.orderCount;
        const totalSpent = searchResult.totalSpent;
        const lastOrderDate = new Date(customer.createdAt).toLocaleDateString();
        
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="color: #4CAF50; font-weight: 500; margin-bottom: 4px;">
                        <i class="fas fa-check-circle" style="margin-right: 6px;"></i>
                        Returning Customer Found!
                    </div>
                    <div style="font-size: 0.9rem; color: #555;">
                        ${customer.firstName} ${customer.surname} • 
                        ${orderCount} previous order${orderCount > 1 ? 's' : ''} • 
                        Last order: ${lastOrderDate}
                    </div>
                    ${orderCount > 1 ? `
                    <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">
                        Total spent: R${totalSpent.toFixed(2)}
                    </div>
                    ` : ''}
                </div>
                <button type="button" id="clear-search" style="
                    background: none;
                    border: 1px solid #ddd;
                    color: #666;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85rem;
                ">
                    Clear
                </button>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        resultDiv.style.background = '#e8f5e9';
        resultDiv.style.color = '#2e7d32';
        
        // Add clear search button event
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.onclick = clearSearchResult;
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS (KEEP EXISTING)
    // ============================================
    function normalizePhone(phone) {
        if (!phone) return '';
        let normalized = phone.replace(/\D/g, '');
        if (normalized.startsWith('27') && normalized.length === 11) {
            normalized = '0' + normalized.substring(2);
        } else if (normalized.startsWith('27') && normalized.length === 12) {
            normalized = '0' + normalized.substring(3);
        }
        return normalized;
    }
    
    function validateSearchInput(surname, phone) {
        const errors = [];
        if (!surname || surname.trim().length < 2) {
            errors.push('Surname must be at least 2 characters');
        }
        if (!phone || normalizePhone(phone).length < 10) {
            errors.push('Please enter a valid South African phone number');
        }
        return errors;
    }
    
    // Clear search result function
    function clearSearchResult() {
        hideResult();
        hideError();
        const surnameInput = document.getElementById('search-surname');
        const phoneInput = document.getElementById('search-phone');
        if (surnameInput) surnameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (surnameInput) surnameInput.focus();
    }
    
    // UI helper functions (keep existing)
    function showError(message) {
        const errorDiv = document.getElementById('search-error');
        if (errorDiv) {
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> ${message}`;
            errorDiv.style.display = 'block';
        }
    }
    
    function hideError() {
        const errorDiv = document.getElementById('search-error');
        if (errorDiv) errorDiv.style.display = 'none';
    }
    
    function hideResult() {
        const resultDiv = document.getElementById('search-result');
        if (resultDiv) resultDiv.style.display = 'none';
    }
    
    function showLoading(show) {
        const loadingDiv = document.getElementById('search-loading');
        if (loadingDiv) {
            loadingDiv.style.display = show ? 'block' : 'none';
        }
    }
    
    // ============================================
    // EVENT HANDLERS (KEEP EXISTING)
    // ============================================
    function handleSearchSubmit(event) {
        event.preventDefault();
        const surname = document.getElementById('search-surname')?.value || '';
        const phone = document.getElementById('search-phone')?.value || '';
        const errors = validateSearchInput(surname, phone);
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        searchCustomer(surname, phone);
    }
    
    function setupEventListeners() {
        if (searchForm) {
            searchForm.addEventListener('submit', handleSearchSubmit);
        }
        
        // Auto-format phone number (keep existing)
        const phoneInput = document.getElementById('search-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 2) {
                    value = value;
                } else if (value.length <= 5) {
                    value = value.replace(/(\d{3})(\d+)/, '$1 $2');
                } else if (value.length <= 8) {
                    value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
                } else {
                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
                }
                e.target.value = value;
            });
        }
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    return {
        init,
        searchCustomer,
        autoFillForm,
        normalizePhone
    };
})();
