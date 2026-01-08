// customerSearch.js - Customer Search & Auto-fill Manager
const CustomerSearchManager = (function() {
    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'beautyhub_customers',
        SEARCH_TIMEOUT: 3000, // ms for simulating network delay
        FIREBASE: {
            enabled: false, // Set to true when Firebase is ready
            collection: 'customers'
        }
    };
    
    // DOM Elements
    let searchContainer = null;
    let searchForm = null;
    
    // Customer Schema
    const CUSTOMER_SCHEMA = {
        id: '',               // Auto-generated: CUST-YYYYMMDD-XXXX
        firstName: '',        // First name
        surname: '',          // Surname
        phone: '',            // Primary phone
        whatsApp: '',         // WhatsApp number
        email: '',            // Email address
        addresses: [],        // Array of shipping addresses (latest first)
        orderCount: 0,        // Total orders placed
        totalSpent: 0,        // Total amount spent
        firstOrder: '',       // Date of first order
        lastOrder: '',        // Date of last order
        createdAt: '',        // Customer record creation date
        updatedAt: ''         // Last update date
    };
    
    // Initialize
    function init(containerSelector = '#checkout-form') {
        createSearchUI();
        setupEventListeners();
        return {
            searchCustomer,
            saveCustomer,
            getCustomerByPhone
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
    // SEARCH LOGIC
    // ============================================
    function searchCustomer(surname, phone) {
        console.log('Searching customer:', { surname, phone });
        
        // Show loading
        showLoading(true);
        hideError();
        hideResult();
        
        // Simulate network delay
        setTimeout(() => {
            try {
                let customer = null;
                
                if (CONFIG.FIREBASE.enabled) {
                    // Firebase implementation (placeholder)
                    console.log('Firebase search would execute here');
                    // customer = await searchFirebaseCustomer(surname, phone);
                } else {
                    // LocalStorage implementation
                    customer = searchLocalStorageCustomer(surname, phone);
                }
                
                // Handle result
                if (customer) {
                    showSearchResult(customer);
                    autoFillForm(customer);
                } else {
                    showError('No customer found with these details. Please check and try again, or fill in the form below as a new customer.');
                }
                
            } catch (error) {
                console.error('Search error:', error);
                showError('Search failed. Please try again or enter details manually.');
            } finally {
                showLoading(false);
            }
        }, CONFIG.SEARCH_TIMEOUT);
    }
    
    // LocalStorage search implementation
    function searchLocalStorageCustomer(surname, phone) {
        try {
            // Get all orders from localStorage
            const ordersJSON = localStorage.getItem('beautyhub_orders');
            if (!ordersJSON) return null;
            
            const orders = JSON.parse(ordersJSON) || [];
            if (orders.length === 0) return null;
            
            // Normalize search parameters
            const searchSurname = surname.toLowerCase().trim();
            const searchPhone = normalizePhone(phone);
            
            // Find matching customer in orders
            for (const order of orders) {
                if (!order.customerName) continue;
                
                // Extract surname from full name
                const nameParts = order.customerName.trim().split(' ');
                const orderSurname = nameParts[nameParts.length - 1].toLowerCase();
                
                // Normalize order phone
                const orderPhone = normalizePhone(order.customerPhone);
                
                // Check match
                if (orderSurname === searchSurname && orderPhone === searchPhone) {
                    // Found matching customer - create customer record
                    return createCustomerFromOrder(order);
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('LocalStorage search error:', error);
            return null;
        }
    }
    
    // Firebase search (placeholder for future implementation)
    async function searchFirebaseCustomer(surname, phone) {
        // This will be implemented when Firebase is ready
        console.log('Firebase search called:', { surname, phone });
        
        try {
            // Example Firebase code (commented out for now):
            /*
            const db = firebase.firestore();
            const customersRef = db.collection(CONFIG.FIREBASE.collection);
            
            const querySnapshot = await customersRef
                .where('surname', '==', surname.toLowerCase())
                .where('phone', '==', normalizePhone(phone))
                .limit(1)
                .get();
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            */
            
            return null;
        } catch (error) {
            console.error('Firebase search error:', error);
            throw error;
        }
    }
    
    // ============================================
    // CUSTOMER DATA MANAGEMENT
    // ============================================
    function createCustomerFromOrder(order) {
        const nameParts = order.customerName.trim().split(' ');
        const firstName = nameParts.slice(0, -1).join(' ');
        const surname = nameParts[nameParts.length - 1];
        
        return {
            ...CUSTOMER_SCHEMA,
            id: generateCustomerId(),
            firstName: firstName || '',
            surname: surname || '',
            phone: order.customerPhone || '',
            whatsApp: order.customerWhatsApp || '',
            email: order.customerEmail || '',
            addresses: [order.shippingAddress || ''],
            orderCount: 1,
            totalSpent: order.totalAmount || 0,
            firstOrder: order.createdAt || new Date().toISOString(),
            lastOrder: order.createdAt || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    
    function saveCustomer(customerData) {
        try {
            if (CONFIG.FIREBASE.enabled) {
                // Save to Firebase (placeholder)
                console.log('Would save to Firebase:', customerData);
                // await saveCustomerToFirebase(customerData);
            } else {
                // Save to localStorage
                saveCustomerToLocalStorage(customerData);
            }
            
            console.log('Customer saved successfully');
            return true;
            
        } catch (error) {
            console.error('Save customer error:', error);
            return false;
        }
    }
    
    function saveCustomerToLocalStorage(customer) {
        try {
            // Get existing customers
            const existingJSON = localStorage.getItem(CONFIG.STORAGE_KEY);
            const customers = existingJSON ? JSON.parse(existingJSON) : {};
            
            // Use phone as key for easy lookup
            const phoneKey = normalizePhone(customer.phone);
            
            // Update or add customer
            if (customers[phoneKey]) {
                // Update existing customer
                customers[phoneKey] = {
                    ...customers[phoneKey],
                    ...customer,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new customer
                customers[phoneKey] = customer;
            }
            
            // Save back to localStorage
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(customers));
            console.log('Customer saved to localStorage:', phoneKey);
            
        } catch (error) {
            console.error('LocalStorage save error:', error);
            throw error;
        }
    }
    
    function getCustomerByPhone(phone) {
        try {
            const normalizedPhone = normalizePhone(phone);
            const customersJSON = localStorage.getItem(CONFIG.STORAGE_KEY);
            
            if (!customersJSON) return null;
            
            const customers = JSON.parse(customersJSON);
            return customers[normalizedPhone] || null;
            
        } catch (error) {
            console.error('Get customer error:', error);
            return null;
        }
    }
    
    // ============================================
    // FORM AUTO-FILL FUNCTIONALITY
    // ============================================
    function autoFillForm(customer) {
        console.log('Auto-filling form with customer:', customer);
        
        // Map customer data to form fields
        const fieldMapping = {
            'customer-name': customer.firstName ? `${customer.firstName} ${customer.surname}`.trim() : customer.surname,
            'customer-phone': customer.phone,
            'customer-whatsapp': customer.whatsApp || '',
            'customer-email': customer.email || '',
            'shipping-address': customer.addresses && customer.addresses.length > 0 
                ? customer.addresses[0] 
                : ''
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
        
        // Focus on special instructions field for convenience
        const notesField = document.getElementById('order-notes');
        if (notesField) {
            setTimeout(() => notesField.focus(), 100);
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function normalizePhone(phone) {
        if (!phone) return '';
        
        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, '');
        
        // Handle South African numbers
        if (normalized.startsWith('27') && normalized.length === 11) {
            normalized = '0' + normalized.substring(2);
        } else if (normalized.startsWith('27') && normalized.length === 12) {
            normalized = '0' + normalized.substring(3);
        }
        
        return normalized;
    }
    
    function generateCustomerId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `CUST-${year}${month}${day}-${random}`;
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
    
    // ============================================
    // UI FEEDBACK FUNCTIONS
    // ============================================
    function showSearchResult(customer) {
        const resultDiv = document.getElementById('search-result');
        const contentDiv = document.getElementById('result-content');
        
        if (!resultDiv || !contentDiv) return;
        
        // Format result message
        const orderCount = customer.orderCount || 1;
        const lastOrder = customer.lastOrder 
            ? new Date(customer.lastOrder).toLocaleDateString() 
            : 'No previous orders';
        
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="color: #4CAF50; font-weight: 500; margin-bottom: 4px;">
                        <i class="fas fa-check-circle" style="margin-right: 6px;"></i>
                        Customer Found!
                    </div>
                    <div style="font-size: 0.9rem; color: #555;">
                        ${customer.firstName ? customer.firstName + ' ' : ''}${customer.surname} • 
                        Previous orders: ${orderCount} • 
                        Last order: ${lastOrder}
                    </div>
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
    
    function clearSearchResult() {
        hideResult();
        hideError();
        
        // Clear search inputs
        const surnameInput = document.getElementById('search-surname');
        const phoneInput = document.getElementById('search-phone');
        
        if (surnameInput) surnameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        
        // Clear form fields (optional - depending on your preference)
        // const formFields = ['customer-name', 'customer-phone', 'customer-whatsapp', 'customer-email', 'shipping-address'];
        // formFields.forEach(fieldId => {
        //     const field = document.getElementById(fieldId);
        //     if (field) field.value = '';
        // });
        
        // Focus on surname field
        if (surnameInput) surnameInput.focus();
    }
    
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
    // EVENT HANDLERS
    // ============================================
    function handleSearchSubmit(event) {
        event.preventDefault();
        
        // Get search values
        const surname = document.getElementById('search-surname')?.value || '';
        const phone = document.getElementById('search-phone')?.value || '';
        
        // Validate
        const errors = validateSearchInput(surname, phone);
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        
        // Perform search
        searchCustomer(surname, phone);
    }
    
    function setupEventListeners() {
        if (searchForm) {
            searchForm.addEventListener('submit', handleSearchSubmit);
        }
        
        // Auto-format phone number
        const phoneInput = document.getElementById('search-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                // Format as South African phone number
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
        saveCustomer,
        getCustomerByPhone,
        normalizePhone,
        autoFillForm
    };
})();

// Auto-initialize when DOM is ready
// Note: Call this after checkout form is created
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => CustomerSearchManager.init());
// } else {
//     CustomerSearchManager.init();
// }
