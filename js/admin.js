// admin.js - Admin Authentication & Dashboard

const AdminManager = (function() {
    // Configuration
    const CONFIG = {
        // TEST CREDENTIALS (Remove when using Firebase Auth)
        TEST_CREDENTIALS: {
            email: 'admin@beautyhub.com',
            password: 'admin123'
        },
        
        // SESSION SETTINGS
        SESSION_KEY: 'beautyhub_admin_session',
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        
        // FIREBASE AUTH PLACEHOLDER (Comment structure)
        /*
        FIREBASE_CONFIG: {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            appId: "YOUR_APP_ID"
        }
        */
    };
    
    // State
    let isAuthenticated = false;
    let adminModal = null;
    let dashboardModal = null;
    
    // Initialize admin system
    function init() {
        checkExistingSession();
        createAdminModal();
        createDashboardModal();
        setupEventListeners();
        updateAdminButtonVisibility();
    }
    
    // Check for existing valid session
    function checkExistingSession() {
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            if (sessionData.expiresAt > now && sessionData.email === CONFIG.TEST_CREDENTIALS.email) {
                isAuthenticated = true;
                return true;
            } else {
                // Session expired
                localStorage.removeItem(CONFIG.SESSION_KEY);
                return false;
            }
        } catch (e) {
            localStorage.removeItem(CONFIG.SESSION_KEY);
            return false;
        }
    }
    
    // Create session
    function createSession(email) {
        const sessionData = {
            email: email,
            expiresAt: Date.now() + CONFIG.SESSION_DURATION
        };
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(sessionData));
        isAuthenticated = true;
    }
    
    // Destroy session
    function destroySession() {
        localStorage.removeItem(CONFIG.SESSION_KEY);
        isAuthenticated = false;
    }
    
    // Create admin login modal
    function createAdminModal() {
        adminModal = document.createElement('div');
        adminModal.id = 'admin-login-modal';
        adminModal.className = 'admin-modal';
        adminModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1004;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        adminModal.innerHTML = `
            <div class="admin-login-content" style="
                background: white;
                border-radius: 12px;
                width: 100%;
                max-width: 400px;
                padding: 2.5rem;
                position: relative;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <button id="close-admin-modal" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.8rem;
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
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                        font-size: 2.5rem;
                    ">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2 style="margin: 0 0 0.5rem 0; color: #333;">Admin Access</h2>
                    <p style="color: #666; margin: 0;">Enter your credentials to continue</p>
                </div>
                
                <form id="admin-login-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="
                            display: block;
                            margin-bottom: 0.5rem;
                            font-weight: 600;
                            color: #333;
                        ">Email Address</label>
                        <input type="email" 
                               id="admin-email" 
                               required
                               style="
                                    width: 100%;
                                    padding: 0.875rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                                    box-sizing: border-box;
                                    transition: border-color 0.2s;
                               "
                               onfocus="this.style.borderColor='#667eea'"
                               onblur="this.style.borderColor='#e0e0e0'">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="
                            display: block;
                            margin-bottom: 0.5rem;
                            font-weight: 600;
                            color: #333;
                        ">Password</label>
                        <input type="password" 
                               id="admin-password" 
                               required
                               style="
                                    width: 100%;
                                    padding: 0.875rem;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 1rem;
                                    box-sizing: border-box;
                                    transition: border-color 0.2s;
                               "
                               onfocus="this.style.borderColor='#667eea'"
                               onblur="this.style.borderColor='#e0e0e0'">
                    </div>
                    
                    <div id="admin-login-error" style="
                        background: #ffebee;
                        color: #d32f2f;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1.5rem;
                        display: none;
                        align-items: center;
                        gap: 0.75rem;
                    ">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="error-text">Invalid credentials</span>
                    </div>
                    
                    <button type="submit" style="
                        width: 100%;
                        padding: 1rem;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    ">
                        <i class="fas fa-sign-in-alt" style="margin-right: 0.5rem;"></i>
                        Sign In
                    </button>
                    
                    <div style="
                        margin-top: 1.5rem;
                        padding-top: 1.5rem;
                        border-top: 1px solid #eee;
                        text-align: center;
                        color: #666;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                        Using test credentials for development
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(adminModal);
    }
    
    // Create dashboard modal
    function createDashboardModal() {
        dashboardModal = document.createElement('div');
        dashboardModal.id = 'admin-dashboard-modal';
        dashboardModal.className = 'admin-dashboard-modal';
        dashboardModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1005;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        dashboardModal.innerHTML = `
            <div class="dashboard-content" style="
                background: white;
                border-radius: 16px;
                width: 100%;
                height: 100%;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            ">
                <!-- Header -->
                <div class="dashboard-header" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="
                            background: rgba(255,255,255,0.2);
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.2rem;
                        ">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Admin Dashboard</h1>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div id="admin-badge" class="admin-badge" style="
                            background: #ff4757;
                            color: white;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.8rem;
                            font-weight: bold;
                        "></div>
                        
                        <button id="logout-btn" style="
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.3);
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-size: 0.9rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            transition: background 0.2s;
                        ">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                        
                        <button id="close-dashboard" style="
                            background: rgba(255,255,255,0.1);
                            color: white;
                            border: none;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            font-size: 1.5rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background 0.2s;
                        ">&times;</button>
                    </div>
                </div>
                
                <!-- Body -->
                <div class="dashboard-body" style="
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    padding: 1rem;
                    background: #f8f9fa;
                ">
                    <!-- Tabs Navigation -->
                    <div class="dashboard-tabs" style="
                        display: flex;
                        gap: 0.5rem;
                        margin-bottom: 2rem;
                        flex-wrap: wrap;
                        border-bottom: 2px solid #e0e0e0;
                        padding-bottom: 1rem;
                    ">
                        <button class="dashboard-tab active" data-tab="orders" style="
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 0.875rem 1.75rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                        ">
                            <i class="fas fa-shopping-cart"></i>
                            Orders <span id="orders-count" class="tab-count">(0)</span>
                        </button>
                        
                        <button class="dashboard-tab" data-tab="products" style="
                            background: white;
                            color: #666;
                            border: 2px solid #e0e0e0;
                            padding: 0.875rem 1.75rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                        ">
                            <i class="fas fa-boxes"></i>
                            Products <span class="tab-count">(Soon)</span>
                        </button>
                        
                        <button class="dashboard-tab" data-tab="analytics" style="
                            background: white;
                            color: #666;
                            border: 2px solid #e0e0e0;
                            padding: 0.875rem 1.75rem;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                        ">
                            <i class="fas fa-chart-bar"></i>
                            Analytics <span class="tab-count">(Soon)</span>
                        </button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="tab-content" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
                        <!-- Orders Tab -->
                        <div id="orders-tab-content" class="tab-pane active" style="
                            flex: 1;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                        ">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 1.5rem;
                                flex-wrap: wrap;
                                gap: 1rem;
                            ">
                                <h2 style="margin: 0; color: #333;">Order Management</h2>
                                
                                <div style="display: flex; gap: 0.75rem;">
                                    <button id="refresh-orders" class="action-btn" style="
                                        background: white;
                                        color: #667eea;
                                        border: 2px solid #667eea;
                                        padding: 0.5rem 1rem;  /* changed*/
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                    ">
                                        <i class="fas fa-sync-alt"></i>
                                        Refresh
                                    </button>
                                    
                                    <button id="export-orders" class="action-btn" style="
                                        background: white;
                                        color: #4caf50;
                                        border: 2px solid #4caf50;
                                        padding: 0.75rem 1.5rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                    ">
                                        <i class="fas fa-download"></i>
                                        Export
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Status Filters -->
                            <div class="status-filters" style="
                                display: flex;
                                gap: 0.5rem;
                                margin-bottom: 1.5rem;
                                flex-wrap: wrap;
                            ">
                                <button class="status-filter active" data-status="pending" style="
                                    background: #ff9800;
                                    color: white;
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                ">
                                    <i class="fas fa-clock"></i>
                                    Pending <span class="filter-count">(0)</span>
                                </button>
                                
                                <button class="status-filter" data-status="paid" style="
                                    background: #2196f3;
                                    color: white;
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                ">
                                    <i class="fas fa-money-bill-wave"></i>
                                    Paid <span class="filter-count">(0)</span>
                                </button>
                                
                                <button class="status-filter" data-status="shipped" style="
                                    background: #4caf50;
                                    color: white;
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                ">
                                    <i class="fas fa-truck"></i>
                                    Shipped <span class="filter-count">(0)</span>
                                </button>
                            </div>
                            
                            <!-- Orders Container -->
                            <div id="dashboard-orders-container" style="
                                flex: 1;
                                overflow-y: auto;
                                background: white;
                                border-radius: 12px;
                                padding: 1.5rem;
                                border: 2px solid #f0f0f0;
                            ">
                                <div class="no-orders" style="
                                    text-align: center;
                                    color: #666;
                                    padding: 3rem 1rem;
                                ">
                                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                                    <h3 style="margin: 0 0 0.5rem 0;">No orders yet</h3>
                                    <p>Orders will appear here when customers place them.</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Products Tab (Placeholder) -->
                        <div id="products-tab-content" class="tab-pane" style="
                            flex: 1;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            color: #666;
                        ">
                            <div style="text-align: center;">
                                <i class="fas fa-boxes" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                                <h3>Products Management</h3>
                                <p>Coming soon in future update</p>
                            </div>
                        </div>
                        
                        <!-- Analytics Tab (Placeholder) -->
                        <div id="analytics-tab-content" class="tab-pane" style="
                            flex: 1;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            color: #666;
                        ">
                            <div style="text-align: center;">
                                <i class="fas fa-chart-bar" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                                <h3>Sales Analytics</h3>
                                <p>Coming soon in future update</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="dashboard-footer" style="
                    background: #f8f9fa;
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <div style="color: #667eea; font-weight: 600; font-size: 1.1rem;">
                        <i class="fas fa-star" style="margin-right: 0.5rem;"></i>
                        BeautyHub2025
                    </div>
                    
                    <div style="color: #666; font-size: 0.9rem;">
                        <span id="dashboard-status" style="
                            background: #4caf50;
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            margin-right: 1rem;
                        ">
                            <i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 0.5rem;"></i>
                            Connected
                        </span>
                        Last updated: <span id="last-updated">Just now</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dashboardModal);
    }
    
    // Update admin button visibility
    function updateAdminButtonVisibility() {
        const adminBtn = document.getElementById('admin-btn');
        if (!adminBtn) return;
        
        // Show badge if pending orders
        const badge = document.getElementById('admin-badge');
        if (badge && typeof OrdersManager !== 'undefined') {
            const pendingCount = OrdersManager.getPendingCount();
            badge.textContent = pendingCount > 0 ? pendingCount.toString() : '';
            badge.style.display = pendingCount > 0 ? 'flex' : 'none';
        }
    }
    
    // Open admin login
    function openAdminLogin() {
        if (adminModal) {
            adminModal.style.display = 'flex';
            document.getElementById('admin-email').focus();
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close admin login
    function closeAdminLogin() {
        if (adminModal) {
            adminModal.style.display = 'none';
            document.body.style.overflow = '';
            clearLoginError();
        }
    }
    
    // Open dashboard
    function openDashboard() {
        if (dashboardModal) {
            dashboardModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            loadDashboardData();
            updateDashboardTime();
        }
    }
    
    // Close dashboard
    function closeDashboard() {
        if (dashboardModal) {
            dashboardModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // Load dashboard data
    function loadDashboardData() {
        if (typeof OrdersManager === 'undefined') {
            console.error('OrdersManager not loaded');
            return;
        }
        
        // Update counts
        const pendingCount = OrdersManager.getOrders('pending').length;
        const paidCount = OrdersManager.getOrders('paid').length;
        const shippedCount = OrdersManager.getOrders('shipped').length;
        const totalOrders = OrdersManager.getOrders().length;
        
        // Update tab counts
        const ordersCount = document.getElementById('orders-count');
        if (ordersCount) ordersCount.textContent = `(${totalOrders})`;
        
        // Update filter counts
        document.querySelectorAll('.filter-count').forEach((el, index) => {
            const counts = [pendingCount, paidCount, shippedCount];
            if (counts[index] !== undefined) {
                el.textContent = `(${counts[index]})`;
            }
        });
        
        // Render orders
        renderDashboardOrders('pending');
    }
    
    // Render orders in dashboard
    function renderDashboardOrders(status = 'pending') {
        const container = document.getElementById('dashboard-orders-container');
        if (!container || typeof OrdersManager === 'undefined') return;
        
        const orders = OrdersManager.getOrders(status);
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders" style="
                    text-align: center;
                    color: #666;
                    padding: 3rem 1rem;
                ">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3 style="margin: 0 0 0.5rem 0;">No ${status} orders</h3>
                    <p>${status === 'pending' ? 'All orders are processed!' : 'No orders in this category.'}</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="dashboard-orders-grid" style="display: grid; gap: 1rem;">';
        
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            const orderTime = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const statusColors = {
                pending: '#ff9800',
                paid: '#2196f3',
                shipped: '#4caf50'
            };
            
            html += `
<div class="dashboard-order-card" data-order-id="${order.id}" style="
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    transition: transform 0.2s;
">
    <div style="
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
    ">
        <div style="flex: 1;">
            <div style="
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            ">
                <span style="
                    background: ${statusColors[order.status] || '#666'};
                    color: white;
                    padding: 0.2rem 0.6rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                ">${order.status.toUpperCase()}</span>
                
                <span style="
                    font-weight: 600;
                    color: #333;
                    font-size: 0.9rem;
                ">${order.id}</span>
                
                <span style="
                    color: #999;
                    font-size: 0.8rem;
                    margin-left: auto;
                ">
                    ${orderDate} ${orderTime}
                </span>
            </div>
            
            <div style="margin-bottom: 0.5rem;">
                <div style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">
                    ${order.firstName} ${order.surname}
                </div>
                <div style="color: #666; font-size: 0.85rem;">
                    <i class="fas fa-phone" style="margin-right: 0.25rem;"></i>
                    ${order.customerPhone}
                </div>
            </div>
        </div>
        
        <div style="text-align: right; margin-left: 1rem;">
            <div style="
                font-size: 1.25rem;
                font-weight: 700;
                color: #e91e63;
                margin-bottom: 0.25rem;
            ">R${order.totalAmount.toFixed(2)}</div>
            <div style="color: #666; font-size: 0.8rem;">
                ${order.items.length} item${order.items.length !== 1 ? 's' : ''}
            </div>
        </div>
    </div>
    
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="dashboard-action-btn view-order" data-order-id="${order.id}" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        ">
            <i class="fas fa-eye"></i>
            Details
        </button>
        
        ${order.status === 'pending' ? `
        <button class="dashboard-action-btn mark-paid" data-order-id="${order.id}" style="
            background: #2196f3;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        ">
            <i class="fas fa-money-bill-wave"></i>
            Paid
        </button>
        ` : ''}
        
        ${order.status === 'paid' || order.status === 'pending' ? `
        <button class="dashboard-action-btn mark-shipped" data-order-id="${order.id}" style="
            background: #4caf50;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        ">
            <i class="fas fa-truck"></i>
            Ship
        </button>
        ` : ''}
    </div>
</div>
`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Update dashboard time
    function updateDashboardTime() {
        const timeElement = document.getElementById('last-updated');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }
    
    // Show login error
    function showLoginError(message) {
        const errorDiv = document.getElementById('admin-login-error');
        const errorText = document.getElementById('error-text');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'flex';
        }
    }
    
    // Clear login error
    function clearLoginError() {
        const errorDiv = document.getElementById('admin-login-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    // Handle login
    function handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        
        // TEST AUTH (Replace with Firebase Auth later)
        if (email === CONFIG.TEST_CREDENTIALS.email && 
            password === CONFIG.TEST_CREDENTIALS.password) {
            
            createSession(email);
            closeAdminLogin();
            openDashboard();
            updateAdminButtonVisibility();
            
        } else {
            showLoginError('Invalid email or password');
        }
        
        // FIREBASE AUTH IMPLEMENTATION (Placeholder)
        /*
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                createSession(email);
                closeAdminLogin();
                openDashboard();
                updateAdminButtonVisibility();
            })
            .catch((error) => {
                showLoginError(error.message);
            });
        */
    }
    
    // Handle logout
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            destroySession();
            closeDashboard();
            updateAdminButtonVisibility();
            
            // FIREBASE AUTH IMPLEMENTATION (Placeholder)
            /*
            firebase.auth().signOut()
                .then(() => {
                    destroySession();
                    closeDashboard();
                    updateAdminButtonVisibility();
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                });
            */
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Admin button click
        document.addEventListener('click', function(e) {
            if (e.target.id === 'admin-btn' || e.target.closest('#admin-btn')) {
                if (isAuthenticated) {
                    openDashboard();
                } else {
                    openAdminLogin();
                }
            }
        });
        
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Close buttons
        document.addEventListener('click', function(e) {
            if (e.target.id === 'close-admin-modal' || e.target.closest('#close-admin-modal')) {
                closeAdminLogin();
            }
            
            if (e.target.id === 'close-dashboard' || e.target.closest('#close-dashboard')) {
                closeDashboard();
            }
            
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                handleLogout();
            }
            
            if (e.target.id === 'refresh-orders' || e.target.closest('#refresh-orders')) {
                loadDashboardData();
                updateDashboardTime();
            }
        });
        
        // Tab switching
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('dashboard-tab') || 
                e.target.closest('.dashboard-tab')) {
                
                const tab = e.target.closest('.dashboard-tab');
                const tabName = tab.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.dashboard-tab').forEach(t => {
                    t.style.background = t === tab ? '#667eea' : 'white';
                    t.style.color = t === tab ? 'white' : '#666';
                    t.style.border = t === tab ? 'none' : '2px solid #e0e0e0';
                });
                
                // Show corresponding content
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.style.display = pane.id === `${tabName}-tab-content` ? 'flex' : 'none';
                });
            }
            
            // Status filter switching
            if (e.target.classList.contains('status-filter') || 
                e.target.closest('.status-filter')) {
                
                const filter = e.target.closest('.status-filter');
                const status = filter.dataset.status;
                
                // Update active filter
                document.querySelectorAll('.status-filter').forEach(f => {
                    f.classList.remove('active');
                });
                filter.classList.add('active');
                
                // Render filtered orders
                renderDashboardOrders(status);
            }
        });
        
        // Dashboard order actions
        document.addEventListener('click', function(e) {
            const orderId = e.target.dataset.orderId;
            if (!orderId) return;
            
            if (e.target.classList.contains('view-order') || 
                e.target.closest('.view-order')) {
                
                if (typeof OrdersManager !== 'undefined') {
                    OrdersManager.showOrderDetails(orderId);
                }
            }
            
            if (e.target.classList.contains('mark-paid') || 
                e.target.closest('.mark-paid')) {
                
                if (typeof OrdersManager !== 'undefined') {
                    if (OrdersManager.markAsPaid(orderId)) {
                        loadDashboardData();
                        updateAdminButtonVisibility();
                    }
                }
            }
            
            if (e.target.classList.contains('mark-shipped') || 
                e.target.closest('.mark-shipped')) {
                
                if (typeof OrdersManager !== 'undefined') {
                    if (OrdersManager.markAsShipped(orderId)) {
                        loadDashboardData();
                        updateAdminButtonVisibility();
                    }
                }
            }
        });
    }
    
    // Public API
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

// Auto-initialize
//if (document.readyState === 'loading') {
//    document.addEventListener('DOMContentLoaded', () => AdminManager.init());
//} else {
//    AdminManager.init();
//}

// Media Queries CSS (Add to styles.css)
const adminMediaQueries = `
/* Admin Modal Responsive */
@media (max-width: 768px) {
    .admin-modal .admin-login-content,
    .admin-dashboard-modal .dashboard-content {
        width: 95% !important;
        max-height: 95vh !important;
        padding: 1.5rem !important;
    }
    
    .admin-dashboard-modal .dashboard-header {
        padding: 1rem !important;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .admin-dashboard-modal .dashboard-header h1 {
        font-size: 1.2rem !important;
    }
    
    .admin-dashboard-modal .dashboard-tabs {
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 0.5rem;
    }
    
    .admin-dashboard-modal .dashboard-tab {
        padding: 0.75rem 1rem !important;
        font-size: 0.9rem !important;
    }
    
    .admin-dashboard-modal .dashboard-body {
        padding: 1rem !important;
    }
    
    .admin-dashboard-modal .dashboard-order-card {
        padding: 1rem !important;
    }
    
    .admin-dashboard-modal .dashboard-footer {
        padding: 1rem !important;
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
    }
}

@media (max-width: 480px) {
    .admin-modal .admin-login-content {
        padding: 1.25rem !important;
    }
    
    .admin-dashboard-modal .dashboard-content {
        border-radius: 8px !important;
    }
    
    .admin-dashboard-modal .dashboard-header {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
    }
    
    .admin-dashboard-modal .dashboard-header > div {
        width: 100%;
        justify-content: center;
    }
    
    .admin-dashboard-modal .status-filters {
        justify-content: center;
    }
    
    .admin-dashboard-modal .dashboard-order-card > div:first-child {
        flex-direction: column;
        gap: 1rem;
    }
    
    .admin-dashboard-modal .dashboard-order-card .dashboard-action-btn {
        width: 100%;
        justify-content: center;
    }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
    .admin-dashboard-modal .dashboard-content {
        max-height: 90vh !important;
    }
    
    .admin-dashboard-modal .dashboard-orders-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
    }
}

/* Large Desktop */
@media (min-width: 1440px) {
    .admin-dashboard-modal .dashboard-content {
        max-width: 1400px !important;
        margin: 0 auto;
    }
}

/* Print styles for dashboard */
@media print {
    .admin-modal,
    .admin-dashboard-modal {
        display: none !important;
    }
}
`;

// Inject media queries into head
if (document.head) {
    const style = document.createElement('style');
    style.textContent = adminMediaQueries;
    document.head.appendChild(style);
}
