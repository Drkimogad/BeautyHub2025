// ========================================================
// customersearch.js - Customer Search & Auto-fill Manager
// Core Functionalities:
// 1. Customer search interface in checkout form
// 2. Search by surname and phone number in order history
// 3. Auto-fill form for returning customers
// 4. Real-time input validation and formatting
// 5. Integration with localStorage and order system
// 6. User feedback with loading states and error messages
// ========================================================

const CustomerSearchManager = (function() {
    // ========================================================
    // CONFIGURATION & CONSTANTS
    // ========================================================
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_orders',
        SEARCH_TIMEOUT: 1000,
        MIN_SURNAME_LENGTH: 2,
        MIN_PHONE_LENGTH: 10
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let searchContainer = null;
    let searchForm = null;

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init(containerSelector = '#checkout-form') {
        console.log('[CustomerSearch] Initializing customer search system...');
        
        try {
            // Check if checkout form exists
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
            
            console.log('[CustomerSearch] Initialization complete');
            
        } catch (error) {
            console.error('[CustomerSearch] Initialization failed:', error);
        }
        
        return {
            searchCustomer,
            autoFillForm,
            normalizePhone
        };
    }

    // ========================================================
    // SEARCH UI COMPONENT
    // ========================================================
    function createSearchUI() {
        console.log('[CustomerSearch] Creating search UI...');
        
        try {
            // Remove existing search UI if present
            const existingSearch = document.getElementById('customer-search-container');
            if (existingSearch) {
                existingSearch.remove();
                console.log('[CustomerSearch] Removed existing search UI');
            }

            // Create search container
            searchContainer = document.createElement('div');
            searchContainer.id = 'customer-search-container';
            searchContainer.className = 'customer-search-container';
            
            searchContainer.innerHTML = `
                <div class="search-header">
                    <h4>
                        <i class="fas fa-search"></i>
                        Existing Customer?
                    </h4>
                    <p>
                        Search by surname and phone number to auto-fill your details
                    </p>
                </div>
                
                <form id="customer-search-form" class="search-form">
                    <div class="search-fields">
                        <div class="search-field-group">
                            <label for="search-surname">
                                Surname <span class="required">*</span>
                            </label>
                            <input type="text" 
                                   id="search-surname" 
                                   class="search-input"
                                   placeholder="e.g., Smith"
                                   required>
                        </div>
                        
                        <div class="search-field-group">
                            <label for="search-phone">
                                Phone Number <span class="required">*</span>
                            </label>
                            <input type="tel" 
                                   id="search-phone" 
                                   class="search-input"
                                   placeholder="e.g., 072 123 4567"
                                   required>
                        </div>
                        
                        <div class="search-button-group">
                            <button type="submit" id="search-btn" class="search-btn">
                                <i class="fas fa-search"></i>
                                Search
                            </button>
                        </div>
                    </div>
                    
                    <div id="search-result" class="search-result">
                        <div id="result-content"></div>
                    </div>
                    
                    <div id="search-error" class="search-error"></div>
                    
                    <div id="search-loading" class="search-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Searching customer database...
                    </div>
                </form>
                
                <div class="search-footer">
                    <p>
                        <i class="fas fa-info-circle"></i>
                        First time shopping? Just fill in the form below. Your details will be saved for future orders.
                    </p>
                </div>
            `;
            
            // Insert into checkout form
            const checkoutForm = document.querySelector('#checkout-form');
            if (checkoutForm) {
                checkoutForm.parentNode.insertBefore(searchContainer, checkoutForm);
            } else {
                document.body.appendChild(searchContainer);
            }
            
            searchForm = document.getElementById('customer-search-form');
            
            console.log('[CustomerSearch] Search UI created successfully');
            
        } catch (error) {
            console.error('[CustomerSearch] Failed to create search UI:', error);
            throw new Error('Search UI creation failed: ' + error.message);
        }
    }

    // ========================================================
    // SEARCH LOGIC
    // ========================================================
    function searchCustomer(surname, phone) {
        console.log('[CustomerSearch] Searching customer:', { surname, phone });
        
        try {
            showLoading(true);
            hideError();
            hideResult();
            
            setTimeout(() => {
                try {
                    const searchResult = searchOrders(surname, phone);
                    
                    if (searchResult.found) {
                        showSearchResult(searchResult);
                        autoFillForm(searchResult.latestOrder);
                    } else {
                        showError('No previous orders found. Please fill in your details as a new customer.');
                    }
                    
                } catch (error) {
                    console.error('[CustomerSearch] Search execution error:', error);
                    showError('Search failed. Please try again or enter details manually.');
                } finally {
                    showLoading(false);
                }
            }, CONFIG.SEARCH_TIMEOUT);
            
        } catch (error) {
            console.error('[CustomerSearch] Search initialization failed:', error);
            showError('Search failed. Please try again.');
            showLoading(false);
        }
    }

    function searchOrders(surname, phone) {
        console.log('[CustomerSearch] Searching orders database...');
        
        try {
            const ordersJSON = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!ordersJSON) {
                console.log('[CustomerSearch] No orders found in storage');
                return { found: false };
            }
            
            const allOrders = JSON.parse(ordersJSON) || [];
            if (allOrders.length === 0) {
                console.log('[CustomerSearch] Orders array is empty');
                return { found: false };
            }
            
            const searchSurname = surname.toLowerCase().trim();
            const searchPhone = normalizePhone(phone);
            
            console.log(`[CustomerSearch] Searching for: ${searchSurname}, ${searchPhone}`);
            console.log(`[CustomerSearch] Total orders to search: ${allOrders.length}`);
            
            const matchingOrders = allOrders.filter(order => {
                if (!order.surname || !order.customerPhone) {
                    return false;
                }
                
                const orderSurname = order.surname.toLowerCase().trim();
                const orderPhone = normalizePhone(order.customerPhone);
                
                const match = orderSurname === searchSurname && orderPhone === searchPhone;
                
                if (match) {
                    console.log('[CustomerSearch] Found matching order:', order.id);
                }
                
                return match;
            });
            
            if (matchingOrders.length === 0) {
                console.log('[CustomerSearch] No matching orders found');
                return { found: false };
            }
            
            // Sort by most recent
            const latestOrder = matchingOrders.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            
            const totalSpent = matchingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
            console.log(`[CustomerSearch] Found ${matchingOrders.length} orders for customer`);
            console.log(`[CustomerSearch] Latest order ID: ${latestOrder.id}`);
            
            return {
                found: true,
                latestOrder: latestOrder,
                matchingOrders: matchingOrders,
                orderCount: matchingOrders.length,
                totalSpent: totalSpent
            };
            
        } catch (error) {
            console.error('[CustomerSearch] Search orders error:', error);
            return { found: false };
        }
    }

    // ========================================================
    // FORM AUTO-FILL
    // ========================================================
    function autoFillForm(order) {
        console.log('[CustomerSearch] Auto-filling form from order:', order.id);
        
        try {
            const fieldMapping = {
                'customer-firstname': order.firstName || '',
                'customer-surname': order.surname || '',
                'customer-phone': order.customerPhone || '',
                'customer-whatsapp': order.customerWhatsApp || '',
                'customer-email': order.customerEmail || '',
                'shipping-address': order.shippingAddress || '',
                'customer-type': order.customerType || 'personal',
                'preferred-payment-method': order.preferredPaymentMethod || 'manual',
                'order-priority': order.priority || 'normal',
                'order-notes': order.orderNotes || ''
            };
            
            Object.entries(fieldMapping).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    
                    // Trigger events for validation
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log(`[CustomerSearch] Filled field ${fieldId}:`, value);
                }
            });
            
            // Store customer tracking data
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm) {
                checkoutForm.dataset.existingCustomerId = order.id;
                checkoutForm.dataset.existingCustomer = 'true';
                console.log('[CustomerSearch] Marked as existing customer:', order.id);
            }
            
            showMessage('Customer details loaded. You can edit any field if needed.', 'info');
            
            // Focus on special instructions field
            const notesField = document.getElementById('order-notes');
            if (notesField) {
                setTimeout(() => notesField.focus(), 100);
            }
            
        } catch (error) {
            console.error('[CustomerSearch] Auto-fill failed:', error);
            showError('Failed to auto-fill form. Please enter details manually.');
        }
    }

    // ========================================================
    // VALIDATION FUNCTIONS
    // ========================================================
    function validateSearchInput(surname, phone) {
        console.log('[CustomerSearch] Validating search input...');
        
        const errors = [];
        
        try {
            if (!surname || surname.trim().length < CONFIG.MIN_SURNAME_LENGTH) {
                errors.push('Surname must be at least 2 characters');
            }
            
            const normalizedPhone = normalizePhone(phone);
            if (!phone || normalizedPhone.length < CONFIG.MIN_PHONE_LENGTH) {
                errors.push('Please enter a valid South African phone number');
            }
            
        } catch (error) {
            console.error('[CustomerSearch] Validation error:', error);
            errors.push('Validation failed. Please check your inputs.');
        }
        
        return errors;
    }

    // ========================================================
    // UTILITY FUNCTIONS
    // ========================================================
    function normalizePhone(phone) {
        if (!phone) return '';
        
        try {
            // Remove all non-digit characters
            let normalized = phone.replace(/\D/g, '');
            
            // Handle South African country code
            if (normalized.startsWith('27') && normalized.length === 11) {
                normalized = '0' + normalized.substring(2);
            } else if (normalized.startsWith('27') && normalized.length === 12) {
                normalized = '0' + normalized.substring(3);
            }
            
            console.log('[CustomerSearch] Normalized phone:', phone, '->', normalized);
            return normalized;
            
        } catch (error) {
            console.error('[CustomerSearch] Phone normalization failed:', error);
            return '';
        }
    }

    function formatPhoneInput(value) {
        try {
            // Remove all non-digits
            let digits = value.replace(/\D/g, '');
            
            // Format based on length
            if (digits.length <= 3) {
                return digits;
            } else if (digits.length <= 6) {
                return digits.replace(/(\d{3})(\d+)/, '$1 $2');
            } else if (digits.length <= 9) {
                return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
            } else {
                return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
            }
        } catch (error) {
            console.error('[CustomerSearch] Phone formatting failed:', error);
            return value;
        }
    }

    // ========================================================
    // UI FEEDBACK FUNCTIONS
    // ========================================================
    function showSearchResult(searchResult) {
        console.log('[CustomerSearch] Showing search result...');
        
        try {
            const resultDiv = document.getElementById('search-result');
            const contentDiv = document.getElementById('result-content');
            
            if (!resultDiv || !contentDiv) {
                console.error('[CustomerSearch] Search result elements not found');
                return;
            }
            
            const customer = searchResult.latestOrder;
            const orderCount = searchResult.orderCount;
            const totalSpent = searchResult.totalSpent;
            const lastOrderDate = new Date(customer.createdAt).toLocaleDateString();
            
            contentDiv.innerHTML = `
                <div class="result-header">
                    <div class="result-success">
                        <i class="fas fa-check-circle"></i>
                        Returning Customer Found!
                    </div>
                    <div class="result-details">
                        ${customer.firstName} ${customer.surname} • 
                        ${orderCount} previous order${orderCount > 1 ? 's' : ''} • 
                        Last order: ${lastOrderDate}
                    </div>
                    ${orderCount > 1 ? `
                    <div class="result-stats">
                        Total spent: R${totalSpent.toFixed(2)}
                    </div>
                    ` : ''}
                </div>
                <button type="button" id="clear-search" class="clear-search-btn">
                    Clear
                </button>
            `;
            
            resultDiv.style.display = 'block';
            resultDiv.className = 'search-result success';
            
            // Add clear button event
            const clearBtn = document.getElementById('clear-search');
            if (clearBtn) {
                clearBtn.onclick = clearSearchResult;
            }
            
        } catch (error) {
            console.error('[CustomerSearch] Failed to show search result:', error);
        }
    }

    function showMessage(message, type = 'info') {
        console.log(`[CustomerSearch] Showing ${type} message:`, message);
        
        try {
            const existingMsg = document.getElementById('customer-search-message');
            if (existingMsg) existingMsg.remove();
            
            const messageDiv = document.createElement('div');
            messageDiv.id = 'customer-search-message';
            messageDiv.className = `customer-search-message ${type}`;
            
            // Set content based on type
            let icon = 'info-circle';
            let bgColor = '#e3f2fd';
            let textColor = '#1565c0';
            
            if (type === 'success') {
                icon = 'check-circle';
                bgColor = '#e8f5e9';
                textColor = '#2e7d32';
            } else if (type === 'error') {
                icon = 'exclamation-circle';
                bgColor = '#ffebee';
                textColor = '#d32f2f';
            }
            
            messageDiv.style.cssText = `
                margin: 0.75rem 0;
                padding: 0.75rem;
                border-radius: 4px;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
                background: ${bgColor};
                color: ${textColor};
            `;
            
            messageDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
            
            const searchResult = document.getElementById('search-result');
            if (searchResult && searchResult.parentNode) {
                searchResult.parentNode.insertBefore(messageDiv, searchResult.nextSibling);
            }
            
        } catch (error) {
            console.error('[CustomerSearch] Failed to show message:', error);
        }
    }

    function showError(message) {
        console.log('[CustomerSearch] Showing error:', message);
        
        try {
            const errorDiv = document.getElementById('search-error');
            if (errorDiv) {
                errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('[CustomerSearch] Failed to show error:', error);
        }
    }

    function hideError() {
        try {
            const errorDiv = document.getElementById('search-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.innerHTML = '';
            }
        } catch (error) {
            console.error('[CustomerSearch] Failed to hide error:', error);
        }
    }

    function hideResult() {
        try {
            const resultDiv = document.getElementById('search-result');
            if (resultDiv) {
                resultDiv.style.display = 'none';
                resultDiv.innerHTML = '';
                resultDiv.className = 'search-result';
            }
        } catch (error) {
            console.error('[CustomerSearch] Failed to hide result:', error);
        }
    }

    function showLoading(show) {
        try {
            const loadingDiv = document.getElementById('search-loading');
            if (loadingDiv) {
                loadingDiv.style.display = show ? 'block' : 'none';
            }
        } catch (error) {
            console.error('[CustomerSearch] Failed to toggle loading:', error);
        }
    }

    function clearSearchResult() {
        console.log('[CustomerSearch] Clearing search result...');
        
        try {
            hideResult();
            hideError();
            
            const surnameInput = document.getElementById('search-surname');
            const phoneInput = document.getElementById('search-phone');
            
            if (surnameInput) surnameInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (surnameInput) surnameInput.focus();
            
            // Clear customer tracking data
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm) {
                delete checkoutForm.dataset.existingCustomer;
                delete checkoutForm.dataset.existingCustomerId;
            }
            
        } catch (error) {
            console.error('[CustomerSearch] Failed to clear search result:', error);
        }
    }

    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    function handleSearchSubmit(event) {
        event.preventDefault();
        console.log('[CustomerSearch] Search form submitted');
        
        try {
            const surname = document.getElementById('search-surname')?.value || '';
            const phone = document.getElementById('search-phone')?.value || '';
            
            const errors = validateSearchInput(surname, phone);
            if (errors.length > 0) {
                showError(errors.join('<br>'));
                return;
            }
            
            searchCustomer(surname, phone);
            
        } catch (error) {
            console.error('[CustomerSearch] Search submit handler failed:', error);
            showError('Search failed. Please try again.');
        }
    }

    function setupPhoneFormatting() {
        const phoneInput = document.getElementById('search-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                const formatted = formatPhoneInput(e.target.value);
                if (formatted !== e.target.value) {
                    e.target.value = formatted;
                }
            });
        }
    }

    function setupEventListeners() {
        console.log('[CustomerSearch] Setting up event listeners...');
        
        try {
            if (searchForm) {
                searchForm.addEventListener('submit', handleSearchSubmit);
            }
            
            setupPhoneFormatting();
            
            console.log('[CustomerSearch] Event listeners setup complete');
            
        } catch (error) {
            console.error('[CustomerSearch] Failed to setup event listeners:', error);
        }
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init,
        searchCustomer,
        autoFillForm,
        normalizePhone,
        clearSearchResult,
        validateSearchInput
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    CustomerSearchManager.init();
});
