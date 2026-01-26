/* HELLOE , I AM TESTING A FRESH COPY*/
// ========================================================
// admin.js - Admin Authentication & Dashboard
// UPDATED: Fixed property name alignment and module integration issues
// Core Functionalities:
// 1. Firebase Authentication for admin login
// 2. Session management with localStorage
// 3. Admin dashboard with order management
// 4. Products management interface
// 5. Analytics tools with inventory tracking
// 6. Real-time order updates across tabs
// 7. Responsive admin modals
// 8. function showDashboardNotification(message, type = 'info') { for success and error handling ******************

// ========================================================

const AdminManager = (function() {
    // ========================================================
    // CONFIGURATION & CONSTANTS
    // ========================================================
    const CONFIG = {
        SESSION_KEY: 'beautyhub_admin_session',
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
        
        FIREBASE_CONFIG_LOADED: function() {
            try {
                return typeof firebase !== 'undefined' && 
                       firebase.apps && 
                       firebase.apps.length > 0;
            } catch (error) {
                console.error('[CONFIG] Firebase check failed:', error);
                return false;
            }
        }
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let isAuthenticated = false;
    let adminModal = null;
    let dashboardModal = null;
    let currentStatusFilter = 'pending';

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        console.log('[AdminManager] Initializing...');
        
        try {
            checkExistingSession();
            createAdminModal();
            createDashboardModal();
            setupEventListeners();
            updateAdminButtonVisibility();
            initFirebaseAuthListener();
            setupCrossTabOrderListener();
            
            console.log('[AdminManager] Initialization complete');
            
            return {
                openAdminLogin,
                closeAdminLogin,
                openDashboard,
                closeDashboard,
                updateAdminButtonVisibility,
                isAuthenticated: () => isAuthenticated,
                handleLogin
            };
            
        } catch (error) {
            console.error('[AdminManager] Initialization failed:', error);
            return null;
        }
    }

    // ========================================================
    // SESSION MANAGEMENT FUNCTIONS
    // ========================================================
    function checkExistingSession() {
        console.log('[Auth] Checking existing session...');
        try {
            const session = localStorage.getItem(CONFIG.SESSION_KEY);
            if (!session) {
                console.log('[Auth] No session found in localStorage');
                isAuthenticated = false;
                return false;
            }
            
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            if (sessionData.expiresAt > now) {
                isAuthenticated = true;
                console.log('[Auth] Valid session found for:', sessionData.email);
                return true;
            } else {
                console.log('[Auth] Session expired, removing');
                localStorage.removeItem(CONFIG.SESSION_KEY);
                isAuthenticated = false;
                return false;
            }
        } catch (error) {
            console.error('[Auth] Session check error:', error);
            localStorage.removeItem(CONFIG.SESSION_KEY);
            isAuthenticated = false;
            return false;
        }
    }

    function createSession(email) {
        try {
            const sessionData = {
                email: email,
                expiresAt: Date.now() + CONFIG.SESSION_DURATION,
                created: new Date().toISOString()
            };
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(sessionData));
            isAuthenticated = true;
            console.log('[Auth] Session created for:', email);
        } catch (error) {
            console.error('[Auth] Session creation failed:', error);
            throw new Error('Failed to create session: ' + error.message);
        }
    }

    function destroySession() {
        try {
            localStorage.removeItem(CONFIG.SESSION_KEY);
            isAuthenticated = false;
            console.log('[Auth] Session destroyed');
        } catch (error) {
            console.error('[Auth] Session destruction failed:', error);
        }
    }

    // ========================================================
    // MODAL CREATION FUNCTIONS
    // ========================================================
    function createAdminModal() {
        try {
            console.log('[UI] Creating admin login modal');
            
            adminModal = document.createElement('div');
            adminModal.id = 'admin-login-modal';
            adminModal.className = 'admin-modal';
            
            adminModal.innerHTML = `
                <div class="admin-login-content">
                    <button id="close-admin-modal" class="admin-modal-close">&times;</button>
                    
                    <div class="admin-modal-header">
                        <div class="admin-modal-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h2>Admin Access</h2>
                        <p>Enter your credentials to continue</p>
                    </div>
                    
                    <form id="admin-login-form">
                        <div class="form-group">
                            <label for="admin-email">Email Address</label>
                            <input type="email" id="admin-email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-password">Password</label>
                            <input type="password" id="admin-password" required>
                        </div>
                        
                        <div id="admin-login-error" class="login-error">
                            <i class="fas fa-exclamation-circle"></i>
                            <span id="error-text">Invalid credentials</span>
                        </div>
                        
                        <button type="submit" class="admin-login-btn">
                            <i class="fas fa-sign-in-alt"></i>
                            Sign In
                        </button>
                        
                        <div class="admin-security-note">
                            <i class="fas fa-shield-alt"></i>
                            Secure Admin Authentication
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(adminModal);
            console.log('[UI] Admin login modal created successfully');
        } catch (error) {
            console.error('[UI] Failed to create admin modal:', error);
        }
    }

    function createDashboardModal() {
        try {
            console.log('[UI] Creating dashboard modal');
            
            dashboardModal = document.createElement('div');
            dashboardModal.id = 'admin-dashboard-modal';
            dashboardModal.className = 'admin-dashboard-modal';
            
            dashboardModal.innerHTML = `
                <div class="dashboard-content">
                    <!-- Header -->
                    <div class="dashboard-header">
                        <div class="dashboard-header-left">
                            <div class="dashboard-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <h1>Admin Dashboard</h1>
                        </div>
                        
                        <div class="dashboard-header-right">
                            <div id="dashboard-badge" class="admin-badge"></div>
                            
                            <button id="logout-btn" class="dashboard-logout-btn">
                                <i class="fas fa-sign-out-alt"></i>
                                Logout
                            </button>
                            
                            <button id="close-dashboard" class="dashboard-close-btn">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Body -->
                    <div class="dashboard-body">
                        <!-- Tabs Navigation -->
                        <div class="dashboard-tabs">
                            <button class="dashboard-tab active" data-tab="orders">
                                <i class="fas fa-shopping-cart"></i>
                                Orders <span id="orders-count" class="tab-count">(0)</span>
                            </button>
                            
                            <button class="dashboard-tab" data-tab="products">
                                <i class="fas fa-boxes"></i>
                                Products Management
                            </button>
                            
                            <button class="dashboard-tab" data-tab="analytics">
                                <i class="fas fa-chart-bar"></i>
                                Analytics <span class="tab-count">(Soon)</span>
                            </button>
                                <!-- ADD THIS -->
                           <button id="dashboard-refresh" class="tab-refresh-btn">
                                <i class="fas fa-sync-alt"></i>
                                Refresh All
                           </button>
                           
                        </div>
                        
                        <!-- Tab Content -->
                        <div class="tab-content">
                            <!-- Orders Tab -->
                            <div id="orders-tab-content" class="tab-pane active">
                                <!-- Order Management Header -->
                                <div class="dashboard-toolbar">
                                    <h2>Order Management</h2>
                                    
                                    <div class="dashboard-actions">                            
                                        <!-- Status Filters -->
                                        <button class="status-filter active" data-status="pending">
                                            <i class="fas fa-clock"></i>
                                            Pending <span class="pending-count">(0)</span>
                                        </button>
                                        
                                        <button class="status-filter" data-status="paid">
                                            <i class="fas fa-money-bill-wave"></i>
                                            Paid <span class="paid-count">(0)</span>
                                        </button>
                                        
                                        <button class="status-filter" data-status="shipped">
                                            <i class="fas fa-truck"></i>
                                            Shipped <span class="shipped-count">(0)</span>
                                        </button>
                                     <!-- ADDED Cancelled Orders filter -->
                                        <button class="status-filter" data-status="cancelled">
                                          <i class="fas fa-ban"></i>
                                          Cancelled <span class="cancelled-count">(0)</span>
                                        </button>
                                        
                                    </div>
                                </div>
                                
                                <!-- Orders Container -->
                                <div id="dashboard-orders-container" class="orders-container">
                                    <div class="loading-content">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        <h3>Loading Orders...</h3>
                                        <p>Please wait while we load your orders.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Products Tab -->
                            <div id="products-tab-content" class="tab-pane">
                                <div class="loading-content">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    <h3>Loading Products...</h3>
                                    <p>Please wait while we load your products.</p>
                                </div>
                            </div>
                            
                            <!-- Analytics Tab -->
                            <div id="analytics-tab-content" class="tab-pane">
                                <div class="analytics-header">
                                    <h2>Analytics Dashboard</h2>
                                    
                                    <div class="analytics-toolbar">
                                        <button id="track-inventory-btn" class="analytics-action-btn">
                                            <i class="fas fa-boxes"></i>
                                            Track Inventory
                                        </button>
                                        
                                        <button id="inventory-report-btn" class="analytics-action-btn">
                                            <i class="fas fa-chart-line"></i>
                                            Inventory Report
                                        </button>
                                        
                                        <button id="sales-analytics-btn" class="analytics-action-btn">
                                            <i class="fas fa-chart-bar"></i>
                                            Sales Analytics
                                        </button>
                                        
                                        <button id="customer-insights-btn" class="analytics-action-btn">
                                            <i class="fas fa-users"></i>
                                            Customer Insights
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Analytics Content Area -->
                                <div id="analytics-content" class="analytics-content">
                                    <div class="analytics-placeholder">
                                        <i class="fas fa-chart-pie"></i>
                                        <h3>Select an Analytics View</h3>
                                        <p>Choose one of the options above to view analytics data</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="dashboard-footer">
                        <div class="dashboard-brand">
                            <i class="fas fa-star"></i>
                            BeautyHub2025
                        </div>
                        
                        <div class="dashboard-status">
                            <span id="dashboard-status" class="status-badge">
                                <i class="fas fa-circle"></i>
                                Connected
                            </span>
                            Last updated: <span id="last-updated">Just now</span>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dashboardModal);
            console.log('[UI] Dashboard modal created successfully');
        } catch (error) {
            console.error('[UI] Failed to create dashboard modal:', error);
        }
    }

    // ========================================================
    // UI CONTROL FUNCTIONS
    // ========================================================
    function updateAdminButtonVisibility() {
        try {
            const adminBtn = document.getElementById('admin-btn');
            const badge = document.getElementById('admin-badge');
            
            if (adminBtn) {
                adminBtn.style.display = isAuthenticated ? 'flex' : 'flex';
            }
            
            if (badge) {
                let pendingCount = 0;
                
                // Try to get pending count from OrdersManager
                if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.getPendingCount === 'function') {
                    pendingCount = OrdersManager.getPendingCount();
                } else {
                    // Fallback: Check localStorage directly
                    try {
                        const ordersJSON = localStorage.getItem('beautyhub_orders');
                        if (ordersJSON) {
                            const orders = JSON.parse(ordersJSON) || [];
                            pendingCount = orders.filter(order => order.status === 'pending').length;
                        }
                    } catch (error) {
                        console.error('[UI] Failed to get pending count:', error);
                    }
                }
                
                badge.textContent = pendingCount > 0 ? pendingCount.toString() : '';
                badge.style.display = pendingCount > 0 ? 'flex' : 'none';
                console.log('[UI] Admin badge updated:', pendingCount);
            }
        } catch (error) {
            console.error('[UI] Failed to update admin button:', error);
        }
    }

    function openAdminLogin() {
        try {
            if (!adminModal) {
                createAdminModal();
            }
            
            adminModal.style.display = 'flex';
            const emailField = document.getElementById('admin-email');
            if (emailField) emailField.focus();
            document.body.style.overflow = 'hidden';
            clearLoginError();
            console.log('[UI] Admin login modal opened');
        } catch (error) {
            console.error('[UI] Failed to open admin login:', error);
        }
    }

    function closeAdminLogin() {
        try {
            if (adminModal) {
                adminModal.style.display = 'none';
                document.body.style.overflow = '';
                clearLoginError();
                console.log('[UI] Admin login modal closed');
            }
        } catch (error) {
            console.error('[UI] Failed to close admin login:', error);
        }
    }

    function openDashboard() {
        try {
            if (!checkExistingSession()) {
                console.log('[Auth] Session invalid, forcing re-login');
                destroySession();
                openAdminLogin();
                return;
            }
            
            if (!dashboardModal) {
                createDashboardModal();
            }
            
            dashboardModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            loadDashboardData();
            updateDashboardTime();
            console.log('[UI] Admin dashboard opened');
        } catch (error) {
            console.error('[UI] Failed to open dashboard:', error);
        }
    }

    function closeDashboard() {
        try {
            if (dashboardModal) {
                dashboardModal.style.display = 'none';
                document.body.style.overflow = '';
                console.log('[UI] Admin dashboard closed');
            }
        } catch (error) {
            console.error('[UI] Failed to close dashboard:', error);
        }
    }

    // ========================================================
    // DASHBOARD DATA FUNCTIONS
    // ========================================================
    function loadDashboardData() {
        console.log('[Dashboard] Loading dashboard data...');
        
        try {
            // Update order counts
            updateOrderCounts();
            
            // Render orders for current filter
            renderDashboardOrders(currentStatusFilter);
            
            // Update dashboard badge
            updateDashboardBadge();
            
            console.log('[Dashboard] Dashboard data loaded');
            
        } catch (error) {
            console.error('[Dashboard] Failed to load data:', error);
            showDashboardError('Failed to load dashboard data');
        }
    }

  function updateOrderCounts() {
    try {
        let totalOrders = 0;
        let pendingCount = 0;
        let paidCount = 0;
        let shippedCount = 0;
        let cancelledCount = 0;
        
        // Try to get counts from OrdersManager
        if (typeof OrdersManager !== 'undefined') {
            if (typeof OrdersManager.getOrders === 'function') {
                const allOrders = OrdersManager.getOrders();
                totalOrders = allOrders.length;
                pendingCount = OrdersManager.getOrders('pending').length;
                paidCount = OrdersManager.getOrders('paid').length;
                shippedCount = OrdersManager.getOrders('shipped').length;
                cancelledCount = OrdersManager.getOrders('cancelled').length;
            }
        } else {
            // Fallback: Read from localStorage
            try {
                const ordersJSON = localStorage.getItem('beautyhub_orders');
                if (ordersJSON) {
                    const orders = JSON.parse(ordersJSON) || [];
                    totalOrders = orders.length;
                    pendingCount = orders.filter(o => o.status === 'pending').length;
                    paidCount = orders.filter(o => o.status === 'paid').length;
                    shippedCount = orders.filter(o => o.status === 'shipped').length;
                    cancelledCount = orders.filter(o => o.status === 'cancelled').length;
                }
            } catch (error) {
                console.error('[Dashboard] Failed to read orders from localStorage:', error);
            }
        }
        
        // Update UI
        const ordersCount = document.getElementById('orders-count');
        if (ordersCount) ordersCount.textContent = `(${totalOrders})`;
        
        const pendingEl = document.querySelector('.pending-count');
        const paidEl = document.querySelector('.paid-count');
        const shippedEl = document.querySelector('.shipped-count');
        const cancelledEl = document.querySelector('.cancelled-count');
        
        if (pendingEl) pendingEl.textContent = `(${pendingCount})`;
        if (paidEl) paidEl.textContent = `(${paidCount})`;
        if (shippedEl) shippedEl.textContent = `(${shippedCount})`;
        if (cancelledEl) cancelledEl.textContent = `(${cancelledCount})`;
        
        console.log('[Dashboard] Order counts updated:', {
            total: totalOrders,
            pending: pendingCount,
            paid: paidCount,
            shipped: shippedCount,
            cancelled: cancelledCount
        });
        
    } catch (error) {
        console.error('[Dashboard] Failed to update order counts:', error);
    }
}

    function updateDashboardBadge() {
        try {
            const badge = document.getElementById('dashboard-badge');
            if (!badge) return;
            
            let pendingCount = 0;
            
            if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.getPendingCount === 'function') {
                pendingCount = OrdersManager.getPendingCount();
            } else {
                try {
                    const ordersJSON = localStorage.getItem('beautyhub_orders');
                    if (ordersJSON) {
                        const orders = JSON.parse(ordersJSON) || [];
                        pendingCount = orders.filter(order => order.status === 'pending').length;
                    }
                } catch (error) {
                    console.error('[Dashboard] Failed to get pending count for badge:', error);
                }
            }
            
            badge.textContent = pendingCount > 0 ? pendingCount.toString() : '';
            badge.style.display = pendingCount > 0 ? 'flex' : 'none';
            
        } catch (error) {
            console.error('[Dashboard] Failed to update dashboard badge:', error);
        }
    }

function renderDashboardOrders(status = 'pending') {
    try {
        const container = document.getElementById('dashboard-orders-container');
        if (!container) {
            console.error('[Dashboard] Orders container not found');
            return;
        }
        
        // Handle cancelled status differently - use the check here
       if (status === 'cancelled') {
    // Use the same logic as other statuses but filter for cancelled
           renderCancelledOrdersDirectly();
          return;
         }
        
        // Show loading state
        container.innerHTML = `
            <div class="loading-content">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Loading ${status} orders...</h3>
            </div>
        `;
        
        setTimeout(() => {
            try {
                let orders = [];
                
                if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.getOrders === 'function') {
                    orders = OrdersManager.getOrders(status);
                } else {
                    // Fallback: Read from localStorage
                    const ordersJSON = localStorage.getItem('beautyhub_orders');
                    if (ordersJSON) {
                        const allOrders = JSON.parse(ordersJSON) || [];
                        orders = allOrders.filter(order => order.status === status);
                    }
                }
                
                console.log(`[Dashboard] Rendering ${orders.length} ${status} orders`);
                
                if (orders.length === 0) {
                    container.innerHTML = getNoOrdersHTML(`No ${status} orders`, 
                        status === 'pending' ? 'All orders are processed!' : 
                        status === 'paid' ? 'No paid orders yet.' :
                        status === 'shipped' ? 'No shipped orders yet.' : 'No orders in this category.');
                    return;
                }
                
                container.innerHTML = getOrdersGridHTML(orders);
                
            } catch (error) {
                console.error('[Dashboard] Failed to render orders:', error);
                container.innerHTML = getNoOrdersHTML('Error loading orders', 'Please try refreshing.');
            }
        }, 300);
        
    } catch (error) {
        console.error('[Dashboard] Failed to render orders:', error);
    }
}
    
// rendercancelleddashboardorder function has been removed from admin.js. we rely on the one in ordersManager.js now
// NEW FUNCTION FOR CANCELLED BUTTON, TO SOLVE UNDEFINED ISSUE
function renderCancelledOrdersDirectly() {
    try {
        const container = document.getElementById('dashboard-orders-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-content"><i class="fas fa-spinner fa-spin"></i><h3>Loading Cancelled Orders...</h3></div>';
        
        setTimeout(() => {
            try {
                let cancelledOrders = [];
                
                // Get cancelled orders using the same pattern as other statuses
                if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.getOrders === 'function') {
                    cancelledOrders = OrdersManager.getOrders('cancelled');
                } else {
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
                container.innerHTML = '<div class="no-orders"><i class="fas fa-ban"></i><h3>Error loading cancelled orders</h3><p>Please try again</p></div>';
            }
        }, 300);
    } catch (error) {
        console.error('[Dashboard] Failed to render cancelled orders:', error);
    }
}
    
    function getOrdersGridHTML(orders) {
        try {
            const orderCards = orders.map(order => getOrderCardHTML(order)).join('');
            return `
                <div class="dashboard-orders-grid">
                    ${orderCards}
                </div>
            `;
        } catch (error) {
            console.error('[Dashboard] Failed to generate orders grid:', error);
            return getNoOrdersHTML('Error displaying orders');
        }
    }

function getOrderCardHTML(order) {
    try {
        const statusColors = {
            pending: '#ff9800',
            paid: '#2196f3',
            shipped: '#4caf50',
            cancelled: '#9e9e9e'
        };
        
        // ✅ FIXED: Get the ACTUAL order status, not hardcoded
        const orderId = order.id || 'N/A';
        const status = order.status || 'pending'; // ✅ THIS IS THE FIX
        const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
        const orderDate = createdAt.toLocaleDateString();
        const orderTime = createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const totalAmount = parseFloat(order.totalAmount || order.total || 0);
        const itemCount = Array.isArray(order.items) ? order.items.length : 0;
        const firstName = order.firstName || order.firstName || '';
        const surname = order.surname || order.lastName || '';
        const customerPhone = order.customerPhone || order.phone || '';
        
        // ✅ FIXED: Use ACTUAL status for button visibility
        const isPending = status === 'pending';
        const isPaid = status === 'paid';
        const isShipped = status === 'shipped';
        const isCancelled = status === 'cancelled';
        
        return `
            <div class="dashboard-order-card" data-order-id="${orderId}">
                <div class="order-card-header">
                    <div class="order-info">
                        <div class="order-status-badge" style="background: ${statusColors[status] || '#666'}">
                            ${status.toUpperCase()}
                        </div>
                        <span class="order-id">${orderId}</span>
                        <span class="order-time">${orderDate} ${orderTime}</span>
                    </div>
                    
                    <div class="order-summary">
                        <div class="order-total">R${totalAmount.toFixed(2)}</div>
                        <div class="order-items">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="customer-info">
                        <div class="customer-name">${firstName} ${surname}</div>
                        <div class="customer-phone">
                            <i class="fas fa-phone"></i>
                            ${customerPhone}
                        </div>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="dashboard-action-btn view-order" data-order-id="${orderId}">
                        <i class="fas fa-eye"></i>
                        Details
                    </button>
                    
                    ${isPending ? `
                    <button class="dashboard-action-btn mark-paid" data-order-id="${orderId}">
                        <i class="fas fa-money-bill-wave"></i>
                        Paid
                    </button>
                    
                    <button class="dashboard-action-btn cancel-order" data-order-id="${orderId}">
                        <i class="fas fa-ban"></i>
                        Cancel
                    </button>
                    ` : ''}
                    
                    ${isPaid ? `
                    <button class="dashboard-action-btn mark-shipped" data-order-id="${orderId}">
                        <i class="fas fa-truck"></i>
                        Ship
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[Dashboard] Failed to generate order card:', error);
        return '<div class="error-order-card">Error loading order</div>';
    }
}

    function getNoOrdersHTML(title, message = '') {
        return `
            <div class="no-orders">
                <i class="fas fa-inbox"></i>
                <h3>${title}</h3>
                ${message ? `<p>${message}</p>` : ''}
            </div>
        `;
    }

    function updateDashboardTime() {
        try {
            const timeElement = document.getElementById('last-updated');
            if (timeElement) {
                const now = new Date();
                timeElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        } catch (error) {
            console.error('[Dashboard] Failed to update time:', error);
        }
    }

    // ========================================================
    // AUTHENTICATION FUNCTIONS
    // ========================================================
    function handleLogin(event) {
        event.preventDefault();
        console.log('[Auth] Login attempt initiated');
        
        try {
            const email = document.getElementById('admin-email')?.value.trim();
            const password = document.getElementById('admin-password')?.value;
            
            if (!email || !password) {
                showLoginError('Please enter both email and password');
                return;
            }
            
            clearLoginError();
            
            if (!CONFIG.FIREBASE_CONFIG_LOADED()) {
                console.error('[Auth] Firebase not loaded');
                showLoginError('Authentication system not ready. Please refresh the page.');
                return;
            }
            
            console.log('[Auth] Attempting Firebase sign in for:', email);
            
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('[Auth] Firebase sign in successful:', userCredential.user.email);
                    
                    createSession(userCredential.user.email);
                    closeAdminLogin();
                    openDashboard();
                    updateAdminButtonVisibility();
                    
                    console.log('[Auth] Admin dashboard opened for:', userCredential.user.email);
                })
                .catch((error) => {
                    handleFirebaseAuthError(error);
                });
                
        } catch (error) {
            console.error('[Auth] Login handler error:', error);
            showLoginError('An unexpected error occurred. Please try again.');
        }
    }

    function handleFirebaseAuthError(error) {
        console.error('[Auth] Firebase sign in error:', error.code, error.message);
        
        let errorMessage = 'Authentication failed. ';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage += 'Invalid email format.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many attempts. Try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage += 'Network error. Check your connection.';
                break;
            default:
                errorMessage += 'Please check your credentials.';
        }
        
        showLoginError(errorMessage);
        const passwordField = document.getElementById('admin-password');
        if (passwordField) passwordField.value = '';
    }

    function handleLogout() {
        console.log('[Auth] Logout initiated');
        
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        try {
            if (CONFIG.FIREBASE_CONFIG_LOADED()) {
                firebase.auth().signOut()
                    .then(() => {
                        console.log('[Auth] Firebase sign out successful');
                        destroySession();
                        closeDashboard();
                        updateAdminButtonVisibility();
                    })
                    .catch((error) => {
                        console.error('[Auth] Firebase sign out error:', error);
                        destroySession();
                        closeDashboard();
                        updateAdminButtonVisibility();
                    });
            } else {
                console.warn('[Auth] Firebase not loaded, destroying local session only');
                destroySession();
                closeDashboard();
                updateAdminButtonVisibility();
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
        }
    }

    // ========================================================
    // ERROR HANDLING FUNCTIONS
    // ========================================================
    function showLoginError(message) {
        try {
            const errorDiv = document.getElementById('admin-login-error');
            const errorText = document.getElementById('error-text');
            if (errorDiv && errorText) {
                errorText.textContent = message;
                errorDiv.style.display = 'flex';
            }
        } catch (error) {
            console.error('[UI] Failed to show login error:', error);
        }
    }

    function clearLoginError() {
        try {
            const errorDiv = document.getElementById('admin-login-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('[UI] Failed to clear login error:', error);
        }
    }

    function showDashboardError(message) {
        try {
            const container = document.getElementById('dashboard-orders-container');
            if (container) {
                container.innerHTML = `
                    <div class="dashboard-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error</h3>
                        <p>${message}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('[Dashboard] Failed to show error:', error);
        }
    }

//===================================
    // new function for refresh button
//=======================================
    function refreshAllDashboardData() {
    console.log('[Dashboard] Refreshing all data...');
        
    // Safety check: only refresh if dashboard is open
    if (!isDashboardOpen()) {
        console.log('[Dashboard] Dashboard not open, skipping refresh');
        return;
    }
    
    console.log('[Dashboard] Refreshing all data...');
    
    const refreshBtn = document.getElementById('dashboard-refresh');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
    }

    
    try {
    // 1. Refresh orders
    updateOrderCounts();
    if (currentStatusFilter === 'cancelled') {
        renderCancelledOrdersDirectly();
    } else {
        renderDashboardOrders(currentStatusFilter);
    }
    
    // 2. Refresh products tab if open
    const productsTab = document.getElementById('products-tab-content');
    if (productsTab && productsTab.style.display !== 'none') {
        console.log('[Dashboard] Refreshing products tab...');
        loadProductsTab(); // or ProductsManager.renderProductsAdmin()
    }
    
    // 3. Refresh badge
    updateDashboardBadge();
    
    // 4. Update timestamp
    updateDashboardTime();
    
    // 5. Force Firestore sync if needed
    if (typeof ProductsManager !== 'undefined' && 
        typeof ProductsManager.updateFromFirestoreInBackground === 'function') {
        ProductsManager.updateFromFirestoreInBackground();
    }
    
    if (typeof OrdersManager !== 'undefined' && 
        typeof OrdersManager.refreshFromFirestore === 'function') {
        OrdersManager.refreshFromFirestore();
    }
        } finally {
        // Remove spinning after refresh completes
        setTimeout(() => {
            if (refreshBtn) {
                refreshBtn.classList.remove('refreshing');
                refreshBtn.disabled = false;
            }
        }, 1000);
    }    
    console.log('[Dashboard] All data refreshed');
}
    
    // ========================================================
    // EVENT LISTENERS SETUP
    // ========================================================
    function setupEventListeners() {
        console.log('[Events] Setting up event listeners');
        
        try {
            // Admin button click
            document.addEventListener('click', handleAdminButtonClick);
            
            // Login form
            const loginForm = document.getElementById('admin-login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
            
            // Modal close buttons
            document.addEventListener('click', handleModalCloseButtons);
            
            // Dashboard controls
            document.addEventListener('click', handleDashboardControls);
            
            // Analytics buttons
            document.addEventListener('click', handleAnalyticsButtons);
            
            // Order actions
            document.addEventListener('click', handleOrderActions);
            
            console.log('[Events] Event listeners setup complete');
        } catch (error) {
            console.error('[Events] Failed to setup event listeners:', error);
        }
    }

    function handleAdminButtonClick(e) {
        if (e.target.id === 'admin-btn' || e.target.closest('#admin-btn')) {
            e.preventDefault();
            if (isAuthenticated) {
                openDashboard();
            } else {
                openAdminLogin();
            }
        }
    }

    function handleModalCloseButtons(e) {
        if (e.target.id === 'close-admin-modal' || e.target.closest('#close-admin-modal')) {
            closeAdminLogin();
        }
        
        if (e.target.id === 'close-dashboard' || e.target.closest('#close-dashboard')) {
            closeDashboard();
        }
        
        if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
            handleLogout();
        }
    }

    function handleDashboardControls(e) {
        // Refresh button
       if (e.target.id === 'dashboard-refresh' || 
    (e.target.closest && e.target.closest('#dashboard-refresh'))) {
    console.log('[Dashboard] Refresh All button clicked');
    refreshAllDashboardData();
    updateDashboardTime();
    e.stopPropagation();
}
   
        // Tab switching
        if (e.target.classList.contains('dashboard-tab') || 
            e.target.closest('.dashboard-tab')) {
            handleTabSwitch(e);
        }
        
        // Status filter switching
        if (e.target.classList.contains('status-filter') || 
            e.target.closest('.status-filter')) {
            handleStatusFilter(e);
        }
    }

    function handleTabSwitch(e) {
        try {
            const tab = e.target.closest('.dashboard-tab');
            const tabName = tab.dataset.tab;
            
            // Update active tab styles
            document.querySelectorAll('.dashboard-tab').forEach(t => {
                t.classList.toggle('active', t === tab);
            });
            
            // Show corresponding content
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.style.display = pane.id === `${tabName}-tab-content` ? 'flex' : 'none';
            });
            
            // Handle specific tab content loading
            if (tabName === 'products') {
                loadProductsTab();
            }
        } catch (error) {
            console.error('[Dashboard] Tab switch error:', error);
        }
    }

function handleStatusFilter(e) {
    try {
        const filter = e.target.closest('.status-filter');
        const status = filter.dataset.status;
        
        document.querySelectorAll('.status-filter').forEach(f => {
            f.classList.toggle('active', f === filter);
        });
        
        currentStatusFilter = status;
        
        // ALWAYS use renderDashboardOrders - it already handles cancelled status!
        renderDashboardOrders(status);
        
    } catch (error) {
        console.error('[Dashboard] Status filter error:', error);
    }
}

    function handleAnalyticsButtons(e) {
        // Track Inventory button
        if (e.target.id === 'track-inventory-btn' || e.target.closest('#track-inventory-btn')) {
            console.log('[Analytics] Track Inventory button clicked');
            showInventoryTrackingModal();
        }
        
        // Inventory Report button
        if (e.target.id === 'inventory-report-btn' || e.target.closest('#inventory-report-btn')) {
            console.log('[Analytics] Inventory Report button clicked');
            showInventoryReportModal();
        }
        
        // Future buttons
        if (e.target.id === 'sales-analytics-btn' || e.target.closest('#sales-analytics-btn')) {
            console.log('[Analytics] Sales Analytics button clicked');
            alert('Sales Analytics - Coming Soon');
        }
        
        if (e.target.id === 'customer-insights-btn' || e.target.closest('#customer-insights-btn')) {
            console.log('[Analytics] Customer Insights button clicked');
            alert('Customer Insights - Coming Soon');
        }
    }

function handleOrderActions(e) {
    const orderId = e.target.dataset.orderId;
    if (!orderId) return;
    
    console.log(`[Admin.js] Handling order button:`, {
        orderId: orderId,
        buttonType: e.target.classList.contains('mark-paid') ? 'mark-paid' : 
                   e.target.classList.contains('mark-shipped') ? 'mark-shipped' :
                   e.target.classList.contains('cancel-order') ? 'cancel-order' :
                   e.target.classList.contains('view-details') ? 'view-details' :
                   e.target.classList.contains('delete-order') ? 'delete-order' :
                   e.target.classList.contains('print-order') ? 'print-order' : 'other'
    });
    
    try {
        // 1. VIEW DETAILS
        if (e.target.classList.contains('view-order') || 
            e.target.classList.contains('view-details') || 
            e.target.closest('.view-order') || 
            e.target.closest('.view-details')) {
            if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.showOrderDetails === 'function') {
                OrdersManager.showOrderDetails(orderId);
            }
        }
        
        // MARK AS PAID
if (e.target.classList.contains('mark-paid') || e.target.closest('.mark-paid')) {
    if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.markAsPaid === 'function') {
        if (confirm(`Mark order ${orderId} as paid?`)) {
            if (OrdersManager.markAsPaid(orderId)) {
                // ✅ IMMEDIATE UI UPDATE - Remove from pending view
                const orderCard = e.target.closest('.dashboard-order-card');
                if (orderCard) {
                    orderCard.remove(); // Remove from pending list
                }
                
                // ✅ Refresh the WHOLE pending orders list
                if (currentStatusFilter === 'pending') {
                    renderDashboardOrders('pending');
                }
                
                // Update counts
                updateOrderCounts();
                updateDashboardBadge();
                updateAdminButtonVisibility();
                
                // Show success message
                alert(`✅ Order ${orderId} marked as paid!`);
            }
        }
    }
}
        
        // MARK AS SHIPPED
if (e.target.classList.contains('mark-shipped') || e.target.closest('.mark-shipped')) {
    if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.markAsShipped === 'function') {
        // Ask for shipping date
        const defaultDate = new Date().toISOString().split('T')[0];
        const dateInput = prompt('Enter shipping date (YYYY-MM-DD) or leave empty for today:', defaultDate);
        
        if (dateInput === null) {
            return; // User cancelled
        }
        
        let shippingDate = dateInput.trim();
        if (shippingDate && !/^\d{4}-\d{2}-\d{2}$/.test(shippingDate)) {
            alert('Please enter date in YYYY-MM-DD format');
            return;
        }
        
        if (confirm(`Mark order ${orderId} as shipped on ${shippingDate || defaultDate}?`)) {
            if (OrdersManager.markAsShipped(orderId, shippingDate || defaultDate)) {
                // ✅ Remove from current view if it's in paid view
                const orderCard = e.target.closest('.dashboard-order-card');
                if (orderCard && currentStatusFilter === 'paid') {
                    orderCard.remove();
                }
                
                // ✅ Refresh the current view
                renderDashboardOrders(currentStatusFilter);
                
                // Refresh counts
                updateOrderCounts();
                updateDashboardBadge();
                updateAdminButtonVisibility();
                
                alert(`✅ Order ${orderId} marked as shipped!`);
            }
        }
    }
}
        
        // 4. CANCEL ORDER
        if (e.target.classList.contains('cancel-order') || e.target.closest('.cancel-order')) {
            if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.showCancellationModal === 'function') {
                OrdersManager.showCancellationModal(orderId);
            }
        }
        
        // 5. DELETE ORDER
        if (e.target.classList.contains('delete-order') || e.target.closest('.delete-order')) {
            if (confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
                if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.deleteOrder === 'function') {
                    if (OrdersManager.deleteOrder(orderId)) {
                        // Remove from UI
                        const orderCard = e.target.closest('.dashboard-order-card');
                        if (orderCard) {
                            orderCard.remove();
                        }
                        
                        // Refresh counts
                        updateOrderCounts();
                        updateDashboardBadge();
                        updateAdminButtonVisibility();
                        
                        alert(`Order ${orderId} deleted successfully!`);
                    }
                }
            }
        }
        
        // 6. PRINT ORDER
        if (e.target.classList.contains('print-order') || e.target.closest('.print-order')) {
            if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.getOrderById === 'function') {
                const order = OrdersManager.getOrderById(orderId);
                if (order && typeof OrdersManager.generatePrintHTML === 'function') {
                    OrdersManager.generatePrintHTML(order);
                }
            }
        }
        
    } catch (error) {
        console.error('[Dashboard] Order action error:', error);
    }
}
        

// ========================================================
    // FIREBASE AUTH LISTENER
 // ========================================================
    function initFirebaseAuthListener() {
        if (!CONFIG.FIREBASE_CONFIG_LOADED()) {
            console.warn('[Auth] Firebase not loaded, skipping auth listener');
            return;
        }
        
        console.log('[Auth] Setting up Firebase auth state listener');
        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('[Auth] Firebase user authenticated:', user.email);
                
                const session = localStorage.getItem(CONFIG.SESSION_KEY);
                if (!session) {
                    console.log('[Auth] Firebase auth detected but no local session, creating one');
                    createSession(user.email);
                    updateAdminButtonVisibility();
                }
            } else {
                console.log('[Auth] Firebase user signed out');
                
                if (isAuthenticated) {
                    console.log('[Auth] Destroying local session due to Firebase sign out');
                    destroySession();
                    closeDashboard();
                    updateAdminButtonVisibility();
                }
            }
        }, (error) => {
            console.error('[Auth] Firebase auth state listener error:', error);
        });
    }

    // ========================================================
    // CROSS-TAB ORDER LISTENER
    // ========================================================
    function setupCrossTabOrderListener() {
        console.log('[CrossTab] Setting up storage event listener');
        
        window.addEventListener('storage', function(e) {
            if (e.key === 'beautyhub_orders') {
                console.log('[CrossTab] New order detected from another tab');
                
                if (dashboardModal && dashboardModal.style.display === 'flex') {
                    console.log('[CrossTab] Dashboard is open, refreshing data');
                    loadDashboardData();
                    updateAdminButtonVisibility();
                }
            }
        });
    }

    // ========================================================
    // ANALYTICS MODAL FUNCTIONS
    // ========================================================
    // 1. SHOWINVENTORYTRACKINGMODAL
async function showInventoryTrackingModal() {
    console.log('[Analytics] Opening Inventory Tracking Modal');
    
    try {
        if (typeof InventoryManager === 'undefined') {
            console.error('[Analytics] InventoryManager not loaded');
            alert('Inventory system not available');
            return;
        }
        
        const modal = createOrGetModal('inventory-tracking-modal');
        
        let report = { summary: {}, recentTransactions: [] };

        // Safely get report
        if (typeof InventoryManager.getInventoryTransactions === 'function') {
            const transactions = await InventoryManager.getInventoryTransactions() || [];
            
            // Convert array to report format
            report = {
                summary: {
                    totalTransactions: transactions.length,
                    totalProducts: new Set(transactions.flatMap(t => t.updates?.map(u => u.productId) || [])).size,
                    totalStockChanges: transactions.reduce((sum, t) => {
                        return sum + (t.updates?.reduce((s, u) => s + Math.abs(u.quantity || 0), 0) || 0);
                    }, 0)
                },
                recentTransactions: transactions.slice(-10).map(t => ({
                    id: t.id,
                    type: t.type,
                    timestamp: t.timestamp,
                    performedBy: t.performedBy,
                    // ADD THESE FIELDS:
                    orderId: t.orderId || t.referenceId || '',
                    customerName: t.customerName || '',
                    customerPhone: t.customerPhone || '',
                    orderTotal: t.orderTotal || 0,
                    customerType: t.customerType || '',
                    // Keep existing:
                    productCount: t.updates?.length || 0,
                    totalQuantity: t.updates?.reduce((sum, u) => sum + Math.abs(u.quantity || 0), 0) || 0,
                    // Include the full updates array for details
                    updates: t.updates || []
                }))
            };
            
            console.log('[Analytics] Fresh report loaded:', report.summary.totalTransactions);
        }
        
        modal.innerHTML = getInventoryTrackingModalHTML(report);
        modal.style.display = 'flex';
        
        setupInventoryTrackingModalEvents(modal);
        
    } catch (error) {
        console.error('[Analytics] Failed to show inventory tracking modal:', error);
        alert('Failed to open inventory tracking');
    }
}
    
//=============================================
     // 2. SHOW INVENTORY REPORT
//=====================================
function showInventoryReportModal() {
        console.log('[Analytics] Opening Inventory Report Modal');
        
        try {
            let products = [];
            
            // Try to get products from ProductsManager
            if (typeof ProductsManager !== 'undefined' && typeof ProductsManager.getProducts === 'function') {
                products = ProductsManager.getProducts({ activeOnly: true }) || [];
            } else {
                // Fallback: Try localStorage
                try {
                    const productsJSON = localStorage.getItem('beautyhub_products');
                    if (productsJSON) {
                        products = JSON.parse(productsJSON) || [];
                    }
                } catch (error) {
                    console.error('[Analytics] Failed to get products from localStorage:', error);
                }
            }
            
            const modal = createOrGetModal('inventory-report-modal');
            modal.innerHTML = getInventoryReportModalHTML(products);
            modal.style.display = 'flex';
            
            setupInventoryReportModalEvents(modal);
            
        } catch (error) {
            console.error('[Analytics] Failed to show inventory report modal:', error);
            alert('Failed to open inventory report');
        }
    }

    function createOrGetModal(id) {
        let modal = document.getElementById(id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = id;
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 1009;  /* CHANGED FROM 1006 SAME AS INVENTORY MODAL*/
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            `;
            document.body.appendChild(modal);
        }
        return modal;
    }
//=========================================================
    // 3. SHOW INVENTORY TRACKING HTML
//===========================================
function getInventoryTrackingModalHTML(report) {
        const summary = report.summary || {};
        const transactions = report.recentTransactions || [];
        
        return `
            <div class="inventory-modal-content">
                <div class="inventory-modal-header">
                    <i class="fas fa-boxes"></i>
                    <h2>Inventory Tracking</h2>
                    <button id="close-inventory-tracking" class="modal-close-btn">&times;</button>
                </div>
                
                <div class="inventory-modal-body">
                    <div class="inventory-summary">
                        <div class="summary-item">
                            <div class="summary-value">${summary.totalTransactions || 0}</div>
                            <div class="summary-label">Total Transactions</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${summary.totalProducts || 0}</div>
                            <div class="summary-label">Products Tracked</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${summary.totalStockChanges || 0}</div>
                            <div class="summary-label">Stock Changes</div>
                        </div>
                    </div>
                    
                    <h3>Recent Transactions</h3>
                    <div class="transactions-list">
                        ${transactions.length ? 
                            transactions.map(t => getTransactionHTML(t)).join('') : 
                            '<div class="no-data">No transactions yet</div>'
                        }
                    </div>
                </div>
                
                <div class="inventory-modal-footer">
                    <button id="export-inventory-btn" class="modal-btn secondary">
                        <i class="fas fa-download"></i>
                        Export Data
                    </button>
                    <button id="refresh-inventory-btn" class="modal-btn primary">
                        <i class="fas fa-sync-alt"></i>
                        Refresh
                    </button>
                </div>
            </div>
        `;
    }
//=========================================
    // 4. GET TRANSACTIONS HTML
//=======================================
function getTransactionHTML(transaction) {
    const typeColor = transaction.type === 'order_deduction' ? '#4CAF50' : '#2196f3';
    const transactionId = transaction.id || 'N/A';
    const timestamp = transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'Unknown';
    const transactionType = transaction.type || 'Unknown';
    
    // ADD ORDER INFO IF AVAILABLE
    const orderInfo = transaction.orderId ? 
        `<div class="order-info-small">
            Order: ${transaction.orderId} | Customer: ${transaction.customerName || 'N/A'}
        </div>` : '';
    
    return `
        <div class="transaction-item" 
             data-transaction-id="${transactionId}"
             ${transaction.orderId ? `data-order-id="${transaction.orderId}"` : ''}
             style="cursor: pointer; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 0.5rem; padding: 1rem; transition: all 0.2s;">
            
            <div class="transaction-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="transaction-info" style="flex: 1;">
                    <div class="transaction-id" style="font-weight: bold; font-size: 1.1rem; color: #333;">
                        ${transactionId}
                    </div>
                    <div class="transaction-time" style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                        ${timestamp}
                    </div>
                    ${orderInfo}
                </div>
                
                <div class="transaction-type" style="
                    background: ${typeColor};
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                ">
                    ${transactionType.replace('_', ' ').toUpperCase()}
                </div>
            </div>
            
            <!-- ADD HOVER EFFECT -->
            <div class="transaction-hover" style="
                display: none;
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px dashed #e0e0e0;
                font-size: 0.85rem;
                color: #666;
            ">
                <div style="margin-bottom: 0.25rem;">
                    <strong>Total Items:</strong> ${transaction.updates?.length || 0}
                </div>
                ${transaction.orderTotal ? `
                <div style="margin-bottom: 0.25rem;">
                    <strong>Order Total:</strong> R${parseFloat(transaction.orderTotal).toFixed(2)}
                </div>
                ` : ''}
                <div style="color: #2196f3; font-weight: 600;">
                    <i class="fas fa-info-circle"></i> Click to view full details
                </div>
            </div>
        </div>
    `;
}
//=========================NEW FUNCTION===========
function showTransactionDetails(transactionElement) {
    const transactionId = transactionElement.dataset.transactionId;
    const orderId = transactionElement.dataset.orderId;
    
    if (orderId && typeof OrdersManager !== 'undefined' && 
        typeof OrdersManager.showOrderDetails === 'function') {
        // Open the order details modal
        OrdersManager.showOrderDetails(orderId);
    } else {
        // Show transaction info
        alert(`Transaction: ${transactionId}\nOrder: ${orderId || 'N/A'}\n\nOpen the order in dashboard for details.`);
    }
}
    
//============================================
    // 5. GET INVENTORY REPORT MODAL HTML
//========================================
function getInventoryReportModalHTML(products) {
        const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
        const lowStockCount = products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            return stock <= 5 && stock > 0;
        }).length;
        const outOfStockCount = products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            return stock === 0;
        }).length;
        
        return `
            <div class="inventory-report-content">
                <div class="inventory-report-header">
                    <i class="fas fa-chart-line"></i>
                    <h2>Inventory Report</h2>
                    <button id="close-inventory-report" class="modal-close-btn">&times;</button>
                </div>
                
                <div class="inventory-report-body">
                    <div class="report-summary">
                        <h3>Inventory Summary</h3>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <div class="summary-value">${products.length}</div>
                                <div class="summary-label">Total Products</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">${totalStock}</div>
                                <div class="summary-label">Total Stock</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">${lowStockCount}</div>
                                <div class="summary-label">Low Stock</div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-value">${outOfStockCount}</div>
                                <div class="summary-label">Out of Stock</div>
                            </div>
                        </div>
                    </div>
                    
                    <h3>Products Inventory</h3>
                    <div class="products-table-container">
                        <table class="products-table">
                            <thead>
                                <tr>
                                    <th>Product ID</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Sold</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.length ? 
                                    products.map(p => getProductRowHTML(p)).join('') :
                                    '<tr><td colspan="6" class="no-data">No products found</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="inventory-report-footer">
                    <button id="print-report-btn" class="modal-btn secondary">
                        <i class="fas fa-print"></i>
                        Print Report
                    </button>
                    <button id="export-report-btn" class="modal-btn primary">
                        <i class="fas fa-file-export"></i>
                        Export CSV
                    </button>
                </div>
            </div>
        `;
    }
//================================================
    //6. GET PRODUCTS ROW HTML
//===========================================
function getProductRowHTML(product) {
        const stock = parseInt(product.stock) || 0;
        const stockColor = stock === 0 ? '#f44336' : stock <= 5 ? '#FF9800' : '#4CAF50';
        const productId = product.id || 'N/A';
        const productName = product.name || 'Unknown';
        const category = product.category || 'Uncategorized';
        const salesCount = product.salesCount || 0;
        const updatedAt = product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A';
        
        return `
            <tr>
                <td>${productId}</td>
                <td>${productName}</td>
                <td class="category-cell">${category}</td>
                <td class="stock-cell" style="color: ${stockColor}">${stock}</td>
                <td>${salesCount}</td>
                <td class="date-cell">
                    ${updatedAt}
                </td>
            </tr>
        `;
    }

//=============================================
    // 7. SETUP INVENTORY TRACKING MODAL EVENTS
//===============================================
function setupInventoryTrackingModalEvents(modal) {
        try {
            // ADD CLICK HANDLER FOR TRANSACTIONS
        const transactionsList = modal.querySelector('.transactions-list');
        if (transactionsList) {
            transactionsList.addEventListener('click', function(e) {
                const transactionItem = e.target.closest('.transaction-item');
                if (!transactionItem) return;
                
                const transactionId = transactionItem.dataset.transactionId;
                const orderId = transactionItem.dataset.orderId;
                
                console.log(`[Analytics] Transaction clicked: ${transactionId}, Order: ${orderId}`);
                
                // If transaction has an order ID, show order details
                if (orderId && typeof OrdersManager !== 'undefined' && 
                    typeof OrdersManager.showOrderDetails === 'function') {
                    OrdersManager.showOrderDetails(orderId);
                    
                    // Close inventory modal
                    modal.style.display = 'none';
                } else {
                    // Show transaction details
                    showTransactionDetails(transactionItem);
                }
            });
            
            // ADD HOVER EFFECTS
            transactionsList.addEventListener('mouseover', function(e) {
                const transactionItem = e.target.closest('.transaction-item');
                if (transactionItem) {
                    const hoverDiv = transactionItem.querySelector('.transaction-hover');
                    if (hoverDiv) {
                        hoverDiv.style.display = 'block';
                    }
                    transactionItem.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    transactionItem.style.transform = 'translateY(-2px)';
                }
            });
            
            transactionsList.addEventListener('mouseout', function(e) {
                const transactionItem = e.target.closest('.transaction-item');
                if (transactionItem) {
                    const hoverDiv = transactionItem.querySelector('.transaction-hover');
                    if (hoverDiv) {
                        hoverDiv.style.display = 'none';
                    }
                    transactionItem.style.boxShadow = 'none';
                    transactionItem.style.transform = 'translateY(0)';
                }
            });
        }

            const closeBtn = document.getElementById('close-inventory-tracking');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            const refreshBtn = document.getElementById('refresh-inventory-btn');
            if (refreshBtn) {
                refreshBtn.onclick = () => {
                    console.log('[Analytics] Refreshing inventory data');
                    showInventoryTrackingModal();
                };
            }
            
            const exportBtn = document.getElementById('export-inventory-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    console.log('[Analytics] Export inventory data clicked');
                    alert('Export feature coming soon');
                };
            }
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
        } catch (error) {
            console.error('[Analytics] Failed to setup modal events:', error);
        }
    }
//==============================================================
    // 8. SETUP INVENTORY REPORT MODAL EVENTS
//========================================================
    function setupInventoryReportModalEvents(modal) {
        try {
            const closeBtn = document.getElementById('close-inventory-report');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            const printBtn = document.getElementById('print-report-btn');
            if (printBtn) {
                printBtn.onclick = () => {
                    console.log('[Analytics] Print report clicked');
                    window.print();
                };
            }
            
            const exportBtn = document.getElementById('export-report-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    console.log('[Analytics] Export CSV clicked');
                    alert('CSV export coming soon');
                };
            }
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
        } catch (error) {
            console.error('[Analytics] Failed to setup report modal events:', error);
        }
    }

// ========================================================
// UTILITY: Check if dashboard is open
// ========================================================
function isDashboardOpen() {
    return dashboardModal && dashboardModal.style.display === 'flex';
}

// Make it globally available
window.isAdminDashboardOpen = isDashboardOpen;

// ========================================================
// DASHBOARD REFRESH FUNCTION - FOR EXTERNAL CALLS new.  I NEEED 5HIS TO REFRESH TH3 WEBSITE WHILE
// IS OPEN AND IT UPDATES WHATEVER WAS UPDATED. ⛔️⛔️⛔️
// ========================================================
function refreshDashboardOrders() {
    console.log('[Admin] Dashboard refresh requested externally');
    
    try {
        // Only refresh if dashboard is open
        if (dashboardModal && dashboardModal.style.display === 'flex') {
            console.log('[Admin] Dashboard is open, refreshing data...');
            
            // Update order countssuccessNotification
            updateOrderCounts();
            
            // Refresh the currently active view
            if (currentStatusFilter === 'cancelled') {
                renderCancelledDashboardOrders();
            } else {
                renderDashboardOrders(currentStatusFilter);
            }
            
            // Update badge
            updateDashboardBadge();
            
            console.log('[Admin] Dashboard refreshed successfully');
            return true;
        } else {
            console.log('[Admin] Dashboard not open, skipping refresh');
            return false;
        }
    } catch (error) {
        console.error('[Admin] Failed to refresh dashboard:', error);
        return false;
    }
}

// Make it globally available so ordersManager.js can call it
window.refreshDashboardOrders = refreshDashboardOrders;

    // ========================================================
    // PRODUCTS TAB LOADING
    // ========================================================
    function loadProductsTab() {
        try {
            const productsTab = document.getElementById('products-tab-content');
            if (!productsTab) {
                console.error('[Products] Products tab not found');
                return;
            }
            
            productsTab.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Loading Products...</h3>
                    <p>Please wait while we load your products.</p>
                </div>
            `;
            
            setTimeout(() => {
                try {
                    if (typeof ProductsManager !== 'undefined' && typeof ProductsManager.renderProductsAdmin === 'function') {
                        ProductsManager.renderProductsAdmin('products-tab-content');
                    } else {
                        productsTab.innerHTML = `
                            <div class="error-content">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>Products Manager Not Loaded</h3>
                                <p>Please refresh the page or check console for errors.</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('[Products] Failed to load products:', error);
                    productsTab.innerHTML = `
                        <div class="error-content">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Products</h3>
                            <p>${error.message || 'Unknown error occurred'}</p>
                        </div>
                    `;
                }
            }, 100);
            
        } catch (error) {
            console.error('[Products] Failed to load products tab:', error);
        }
    }
//===========================================
    // success notification
//=====================================
    function showDashboardNotification(message, type = 'info') {
    try {
        // Check if dashboard is open
        if (!isDashboardOpen()) return;
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `dashboard-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        // Style it
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
    } catch (error) {
        console.error('[Dashboard] Notification error:', error);
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Make it globally available
window.showDashboardNotification = showDashboardNotification;
    
    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init,
        openAdminLogin,
        closeAdminLogin,
        openDashboard,
        closeDashboard,
        updateAdminButtonVisibility,
        isAuthenticated: () => isAuthenticated,
        handleLogin
    };
})();

