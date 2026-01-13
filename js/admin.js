// ========================================================
// admin.js - Admin Authentication & Dashboard
// Core Functionalities:
// 1. Firebase Authentication for admin login
// 2. Session management with localStorage
// 3. Admin dashboard with order management
// 4. Products management interface
// 5. Analytics tools with inventory tracking
// 6. Real-time order updates across tabs
// 7. Responsive admin modals
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
        } catch (error) {
            console.error('[AdminManager] Initialization failed:', error);
            throw new Error('Admin system initialization failed: ' + error.message);
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
                return false;
            }
        } catch (error) {
            console.error('[Auth] Session check error:', error);
            localStorage.removeItem(CONFIG.SESSION_KEY);
            return false;
        }
    }

    function createSession(email) {
        try {
            const sessionData = {
                email: email,
                expiresAt: Date.now() + CONFIG.SESSION_DURATION
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
            throw new Error('Admin modal creation failed: ' + error.message);
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
                            <div id="admin-badge" class="admin-badge"></div>
                            
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
                        </div>
                        
                        <!-- Tab Content -->
                        <div class="tab-content">
                            <!-- Orders Tab -->
                            <div id="orders-tab-content" class="tab-pane active">
                                <!-- Order Management Header -->
                                <div class="dashboard-toolbar">
                                    <h2>Order Management</h2>
                                    
                                    <div class="dashboard-actions">
                                        <button id="refresh-orders" class="action-btn">
                                            <i class="fas fa-sync-alt"></i>
                                            Refresh
                                        </button>
                                        
                                        <button id="export-orders" class="action-btn">
                                            <i class="fas fa-download"></i>
                                            Export
                                        </button>
                                        
                                        <!-- Status Filters -->
                                        <button class="status-filter active" data-status="pending">
                                            <i class="fas fa-clock"></i>
                                            Pending <span class="filter-count">(0)</span>
                                        </button>
                                        
                                        <button class="status-filter" data-status="paid">
                                            <i class="fas fa-money-bill-wave"></i>
                                            Paid <span class="filter-count">(0)</span>
                                        </button>
                                        
                                        <button class="status-filter" data-status="shipped">
                                            <i class="fas fa-truck"></i>
                                            Shipped <span class="filter-count">(0)</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Orders Container -->
                                <div id="dashboard-orders-container" class="orders-container">
                                    <div class="no-orders">
                                        <i class="fas fa-inbox"></i>
                                        <h3>No orders yet</h3>
                                        <p>Orders will appear here when customers place them.</p>
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
            throw new Error('Dashboard modal creation failed: ' + error.message);
        }
    }

    // ========================================================
    // UI CONTROL FUNCTIONS
    // ========================================================
    function updateAdminButtonVisibility() {
        try {
            const adminBtn = document.getElementById('admin-btn');
            if (!adminBtn) {
                console.warn('[UI] Admin button not found in DOM');
                return;
            }
            
            const badge = document.getElementById('admin-badge');
            if (badge && typeof OrdersManager !== 'undefined') {
                const pendingCount = OrdersManager.getPendingCount();
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
                console.error('[UI] Admin modal not initialized');
                return;
            }
            
            adminModal.style.display = 'flex';
            document.getElementById('admin-email').focus();
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
                console.error('[UI] Dashboard modal not initialized');
                return;
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
            if (typeof OrdersManager === 'undefined') {
                console.error('[Dashboard] OrdersManager not loaded');
                return;
            }
            
            const pendingCount = OrdersManager.getOrders('pending').length;
            const paidCount = OrdersManager.getOrders('paid').length;
            const shippedCount = OrdersManager.getOrders('shipped').length;
            const totalOrders = OrdersManager.getOrders().length;
            
            console.log('[Dashboard] Order counts:', {
                total: totalOrders,
                pending: pendingCount,
                paid: paidCount,
                shipped: shippedCount
            });
            
            updateOrderCounts(totalOrders, pendingCount, paidCount, shippedCount);
            renderDashboardOrders('pending');
            
        } catch (error) {
            console.error('[Dashboard] Failed to load data:', error);
            showDashboardError('Failed to load dashboard data');
        }
    }

    function updateOrderCounts(total, pending, paid, shipped) {
        try {
            const ordersCount = document.getElementById('orders-count');
            if (ordersCount) ordersCount.textContent = `(${total})`;
            
            const counts = [pending, paid, shipped];
            document.querySelectorAll('.filter-count').forEach((el, index) => {
                if (counts[index] !== undefined) {
                    el.textContent = `(${counts[index]})`;
                }
            });
        } catch (error) {
            console.error('[Dashboard] Failed to update order counts:', error);
        }
    }

    function renderDashboardOrders(status = 'pending') {
        try {
            const container = document.getElementById('dashboard-orders-container');
            if (!container) {
                console.error('[Dashboard] Orders container not found');
                return;
            }
            
            if (typeof OrdersManager === 'undefined') {
                container.innerHTML = getNoOrdersHTML('Orders system not available');
                return;
            }
            
            const orders = OrdersManager.getOrders(status);
            console.log(`[Dashboard] Rendering ${orders.length} ${status} orders`);
            
            if (orders.length === 0) {
                container.innerHTML = getNoOrdersHTML(`No ${status} orders`, 
                    status === 'pending' ? 'All orders are processed!' : 'No orders in this category.');
                return;
            }
            
            container.innerHTML = getOrdersGridHTML(orders);
            
        } catch (error) {
            console.error('[Dashboard] Failed to render orders:', error);
            const container = document.getElementById('dashboard-orders-container');
            if (container) {
                container.innerHTML = getNoOrdersHTML('Error loading orders');
            }
        }
    }

    function getOrdersGridHTML(orders) {
        return `
            <div class="dashboard-orders-grid">
                ${orders.map(order => getOrderCardHTML(order)).join('')}
            </div>
        `;
    }

    function getOrderCardHTML(order) {
        const statusColors = {
            pending: '#ff9800',
            paid: '#2196f3',
            shipped: '#4caf50'
        };
        
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const orderTime = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="dashboard-order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div class="order-info">
                        <div class="order-status-badge" style="background: ${statusColors[order.status] || '#666'}">
                            ${order.status.toUpperCase()}
                        </div>
                        <span class="order-id">${order.id}</span>
                        <span class="order-time">${orderDate} ${orderTime}</span>
                    </div>
                    
                    <div class="order-summary">
                        <div class="order-total">R${order.totalAmount.toFixed(2)}</div>
                        <div class="order-items">${order.items.length} item${order.items.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="customer-info">
                        <div class="customer-name">${order.firstName} ${order.surname}</div>
                        <div class="customer-phone">
                            <i class="fas fa-phone"></i>
                            ${order.customerPhone}
                        </div>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="dashboard-action-btn view-order" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i>
                        Details
                    </button>
                    
                    ${order.status === 'pending' ? `
                    <button class="dashboard-action-btn mark-paid" data-order-id="${order.id}">
                        <i class="fas fa-money-bill-wave"></i>
                        Paid
                    </button>
                    ` : ''}
                    
                    ${order.status === 'paid' || order.status === 'pending' ? `
                    <button class="dashboard-action-btn mark-shipped" data-order-id="${order.id}">
                        <i class="fas fa-truck"></i>
                        Ship
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
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
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            
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
        document.getElementById('admin-password').value = '';
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
        if (e.target.id === 'refresh-orders' || 
            (e.target.classList.contains('action-btn') && e.target.querySelector('i.fa-sync-alt'))) {
            console.log('[Dashboard] Refresh button clicked');
            loadDashboardData();
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
        if (tabName === 'products' && typeof ProductsManager !== 'undefined') {
            loadProductsTab();
        }
    }

    function handleStatusFilter(e) {
        const filter = e.target.closest('.status-filter');
        const status = filter.dataset.status;
        
        document.querySelectorAll('.status-filter').forEach(f => {
            f.classList.toggle('active', f === filter);
        });
        
        renderDashboardOrders(status);
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
        
        if (e.target.classList.contains('view-order') || e.target.closest('.view-order')) {
            if (typeof OrdersManager !== 'undefined') {
                OrdersManager.showOrderDetails(orderId);
            }
        }
        
        if (e.target.classList.contains('mark-paid') || e.target.closest('.mark-paid')) {
            if (typeof OrdersManager !== 'undefined') {
                if (OrdersManager.markAsPaid(orderId)) {
                    loadDashboardData();
                    updateAdminButtonVisibility();
                }
            }
        }
        
        if (e.target.classList.contains('mark-shipped') || e.target.closest('.mark-shipped')) {
            if (typeof OrdersManager !== 'undefined') {
                if (OrdersManager.markAsShipped(orderId)) {
                    loadDashboardData();
                    updateAdminButtonVisibility();
                }
            }
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
                }
            }
        });
    }

    // ========================================================
    // ANALYTICS MODAL FUNCTIONS
    // ========================================================
    function showInventoryTrackingModal() {
        console.log('[Analytics] Opening Inventory Tracking Modal');
        
        try {
            if (typeof InventoryManager === 'undefined') {
                console.error('[Analytics] InventoryManager not loaded');
                alert('Inventory system not available');
                return;
            }
            
            const modal = createOrGetModal('inventory-tracking-modal');
            const report = InventoryManager.getInventoryTransactionsReport();
            
            modal.innerHTML = getInventoryTrackingModalHTML(report);
            modal.style.display = 'flex';
            
            setupInventoryTrackingModalEvents(modal);
            
        } catch (error) {
            console.error('[Analytics] Failed to show inventory tracking modal:', error);
            alert('Failed to open inventory tracking: ' + error.message);
        }
    }

    function showInventoryReportModal() {
        console.log('[Analytics] Opening Inventory Report Modal');
        
        try {
            if (typeof ProductsManager === 'undefined') {
                console.error('[Analytics] ProductsManager not loaded');
                alert('Products data not available');
                return;
            }
            
            const modal = createOrGetModal('inventory-report-modal');
            const products = ProductsManager.getProducts({ activeOnly: true });
            
            modal.innerHTML = getInventoryReportModalHTML(products);
            modal.style.display = 'flex';
            
            setupInventoryReportModalEvents(modal);
            
        } catch (error) {
            console.error('[Analytics] Failed to show inventory report modal:', error);
            alert('Failed to open inventory report: ' + error.message);
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
                z-index: 1006;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            `;
            document.body.appendChild(modal);
        }
        return modal;
    }

    function getInventoryTrackingModalHTML(report) {
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
                            <div class="summary-value">${report?.summary?.totalTransactions || 0}</div>
                            <div class="summary-label">Total Transactions</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${report?.summary?.totalProducts || 0}</div>
                            <div class="summary-label">Products Tracked</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value">${report?.summary?.totalStockChanges || 0}</div>
                            <div class="summary-label">Stock Changes</div>
                        </div>
                    </div>
                    
                    <h3>Recent Transactions</h3>
                    <div class="transactions-list">
                        ${report?.recentTransactions?.length ? 
                            report.recentTransactions.map(t => getTransactionHTML(t)).join('') : 
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

    function getTransactionHTML(transaction) {
        const typeColor = transaction.type === 'order_deduction' ? '#4CAF50' : '#2196f3';
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-id">${transaction.id}</div>
                    <div class="transaction-time">${new Date(transaction.timestamp).toLocaleString()}</div>
                </div>
                <div class="transaction-type" style="background: ${typeColor}">
                    ${transaction.type}
                </div>
            </div>
        `;
    }

    function getInventoryReportModalHTML(products) {
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
        const outOfStockCount = products.filter(p => p.stock === 0).length;
        
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

    function getProductRowHTML(product) {
        const stockColor = product.stock === 0 ? '#f44336' : product.stock <= 5 ? '#FF9800' : '#4CAF50';
        
        return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td class="category-cell">${product.category}</td>
                <td class="stock-cell" style="color: ${stockColor}">${product.stock}</td>
                <td>${product.salesCount || 0}</td>
                <td class="date-cell">
                    ${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                </td>
            </tr>
        `;
    }

    function setupInventoryTrackingModalEvents(modal) {
        document.getElementById('close-inventory-tracking').onclick = () => {
            modal.style.display = 'none';
        };
        
        document.getElementById('refresh-inventory-btn').onclick = () => {
            console.log('[Analytics] Refreshing inventory data');
            showInventoryTrackingModal();
        };
        
        document.getElementById('export-inventory-btn').onclick = () => {
            console.log('[Analytics] Export inventory data clicked');
            alert('Export feature coming soon');
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    function setupInventoryReportModalEvents(modal) {
        document.getElementById('close-inventory-report').onclick = () => {
            modal.style.display = 'none';
        };
        
        document.getElementById('print-report-btn').onclick = () => {
            console.log('[Analytics] Print report clicked');
            window.print();
        };
        
        document.getElementById('export-report-btn').onclick = () => {
            console.log('[Analytics] Export CSV clicked');
            alert('CSV export coming soon');
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

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
                if (typeof ProductsManager !== 'undefined') {
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
            }, 100);
            
        } catch (error) {
            console.error('[Products] Failed to load products tab:', error);
        }
    }

    // ========================================================
    // DEBUGGING FUNCTIONS
    // ========================================================
    function testAnalyticsButtons() {
        console.log('=== TESTING ANALYTICS BUTTONS ===');
        console.log('1. Track Inventory button exists:', !!document.getElementById('track-inventory-btn'));
        console.log('2. Inventory Report button exists:', !!document.getElementById('inventory-report-btn'));
        console.log('3. ProductsManager loaded:', typeof ProductsManager !== 'undefined');
        console.log('4. InventoryManager loaded:', typeof InventoryManager !== 'undefined');
        
        // Try clicking programmatically
        const trackBtn = document.getElementById('track-inventory-btn');
        const reportBtn = document.getElementById('inventory-report-btn');
        
        if (trackBtn) {
            console.log('5. Clicking Track Inventory...');
            trackBtn.click();
        }
        
        if (reportBtn) {
            console.log('6. Clicking Inventory Report...');
            reportBtn.click();
        }
    }

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

// Add to styles.css after document is loaded
document.addEventListener('DOMContentLoaded', function() {
    AdminManager.init();
});
