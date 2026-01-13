// admin.js - Admin Authentication & Dashboard
const AdminManager = (function() {
        // Configuration
    const CONFIG = {
        // FIREBASE AUTH STATUS CHECK
        FIREBASE_CONFIG_LOADED: () => {
            return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
        },
        
        // SESSION SETTINGS
        SESSION_KEY: 'beautyhub_admin_session',
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
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
        initFirebaseAuthListener(); // ADD THIS LINE
        // Listens for new orders from ANY tab
      window.addEventListener('storage', function(e) {
    if (e.key === 'beautyhub_orders') {
        console.log('New order detected, dashboard open?', 
                   dashboardModal && dashboardModal.style.display);
        
        // Always refresh if dashboard exists and is visible
        if (dashboardModal && dashboardModal.style.display === 'flex') {
            loadDashboardData();
        }
    }
});
    }
// Check for existing valid session
    function checkExistingSession() {
        console.log('[Auth] Checking existing session...');
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!session) {
            console.log('[Auth] No session found in localStorage');
            return false;
        }
        
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            if (sessionData.expiresAt > now) {
                isAuthenticated = true;
                console.log('[Auth] Valid session found for:', sessionData.email);
                return true;
            } else {
                // Session expired
                console.log('[Auth] Session expired, removing');
                localStorage.removeItem(CONFIG.SESSION_KEY);
                return false;
            }
        } catch (error) {
            console.error('[Auth] Session parse error:', error);
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
                        <i class="fas fa-shield-alt" style="margin-right: 0.5rem;"></i>
                        Secure Admin Authentication
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
                max-height: 100vh;   /*changed*/
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
    Products Management
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
                            <!-- Single Row Header with All Buttons -->
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 1.5rem;
                                flex-wrap: wrap;
                                gap: 1rem;
                            ">
                                <h2 style="margin: 0; color: #333; flex-shrink: 0;">Order Management</h2>
                                
                                <div style="
                                    display: flex;
                                    gap: 0.5rem;
                                    align-items: center;
                                    flex-wrap: wrap;
                                    justify-content: flex-end;
                                    flex: 1;
                                    min-width: 0;
                                ">
                                    <!-- Action Buttons -->
                                    <button id="refresh-orders" class="action-btn" style="
                                        background: white;
                                        color: #667eea;
                                        border: 2px solid #667eea;
                                        padding: 0.5rem 1rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        white-space: nowrap;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-sync-alt"></i>
                                        Refresh
                                    </button>
                                    
                                    <button id="export-orders" class="action-btn" style="
                                        background: white;
                                        color: #4caf50;
                                        border: 2px solid #4caf50;
                                        padding: 0.5rem 1rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        white-space: nowrap;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-download"></i>
                                        Export
                                    </button>
                                    
                                    <!-- Status Filters (now in same row) -->
                                    <button class="status-filter active" data-status="pending" style="
                                        background: #ff9800;
                                        color: white;
                                        border: none;
                                        padding: 0.5rem 1rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        white-space: nowrap;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-clock"></i>
                                        Pending <span class="filter-count">(0)</span>
                                    </button>
                                    
                                    <button class="status-filter" data-status="paid" style="
                                        background: #2196f3;
                                        color: white;
                                        border: none;
                                        padding: 0.5rem 1rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        white-space: nowrap;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-money-bill-wave"></i>
                                        Paid <span class="filter-count">(0)</span>
                                    </button>
                                    
                                    <button class="status-filter" data-status="shipped" style="
                                        background: #4caf50;
                                        color: white;
                                        border: none;
                                        padding: 0.5rem 1rem;
                                        border-radius: 8px;
                                        font-size: 0.9rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        white-space: nowrap;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-truck"></i>
                                        Shipped <span class="filter-count">(0)</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Orders Container (Now has more space) -->
                            <div id="dashboard-orders-container" style="
                                flex: 1;
                                overflow-y: auto;
                                background: white;
                                border-radius: 12px;
                                padding: 1rem;
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
                        
                     <!-- Products Tab -->
<div id="products-tab-content" class="tab-pane" style="
    flex: 1;
    overflow: hidden;
    display: none;  /* CHANGE FROM 'flex' TO 'none'*/
    flex-direction: column;
">
    <!-- Content will be loaded dynamically by ProductsManager -->
    <div style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
    ">
        <div style="text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Loading Products...</h3>
            <p>Please wait while we load your products.</p>
        </div>
    </div>
</div>
                        
                       <!-- Analytics Tab -->
<div id="analytics-tab-content" class="tab-pane" style="
    flex: 1;
    display: none;
    flex-direction: column;
    padding: 1rem;
    background: #f8f9fa;
">
    <div class="analytics-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    ">
        <h2 style="margin: 0; color: #333;">Analytics Dashboard</h2>
        
        <div class="analytics-toolbar" style="
            display: flex;
            gap: 0.75rem;
            align-items: center;
            flex-wrap: wrap;
        ">
            <!-- Add these 2 buttons -->
            <button id="track-inventory-btn" class="analytics-action-btn" style="
                background: #2196f3;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-boxes"></i>
                Track Inventory
            </button>
            
            <button id="inventory-report-btn" class="analytics-action-btn" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-chart-line"></i>
                Inventory Report
            </button>
            
            <!-- Add more buttons for future features -->
            <button id="sales-analytics-btn" class="analytics-action-btn" style="
                background: #9C27B0;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-chart-bar"></i>
                Sales Analytics
            </button>
            
            <button id="customer-insights-btn" class="analytics-action-btn" style="
                background: #FF9800;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-users"></i>
                Customer Insights
            </button>
        </div>
    </div>
    
    <!-- Analytics Content Area -->
    <div id="analytics-content" class="analytics-content" style="
        flex: 1;
        background: white;
        border-radius: 12px;
        padding: 2rem;
        border: 2px solid #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
    ">
        <div style="text-align: center;">
            <i class="fas fa-chart-pie" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.2;"></i>
            <h3 style="margin: 0 0 0.5rem 0;">Select an Analytics View</h3>
            <p>Choose one of the options above to view analytics data</p>
        </div>
    </div>
</div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="dashboard-footer" style="
                    background: #f8f9fa;
                    padding: 1rem 2rem;
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
    // Check session is still valid
    if (!checkExistingSession()) {
        destroySession();
        openAdminLogin(); // Force re-login
        return;
    }
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
        console.log('loadDashboardData called');
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
        console.log('[Auth] Login attempt initiated');
        
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        
        // Clear any previous errors
        clearLoginError();
        
        // Validate Firebase is loaded
        if (!CONFIG.FIREBASE_CONFIG_LOADED()) {
            console.error('[Auth] Firebase not loaded');
            showLoginError('Authentication system not ready. Please refresh the page.');
            return;
        }
        
        console.log('[Auth] Attempting Firebase sign in for:', email);
        
        // FIREBASE AUTH IMPLEMENTATION
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('[Auth] Firebase sign in successful:', userCredential.user.email);
                
                // Create local session
                createSession(userCredential.user.email);
                closeAdminLogin();
                openDashboard();
                updateAdminButtonVisibility();
                
                // Log successful login
                console.log('[Auth] Admin dashboard opened for:', userCredential.user.email);
            })
            .catch((error) => {
                console.error('[Auth] Firebase sign in error:', error.code, error.message);
                
                // User-friendly error messages
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
                
                // Clear password field for security
                document.getElementById('admin-password').value = '';
            });
    }
    // Handle logout
    function handleLogout() {
        console.log('[Auth] Logout initiated');
        if (confirm('Are you sure you want to logout?')) {
            
            // Firebase sign out
            if (CONFIG.FIREBASE_CONFIG_LOADED()) {
                firebase.auth().signOut()
                    .then(() => {
                        console.log('[Auth] Firebase sign out successful');
                        destroySession();
                        closeDashboard();
                        updateAdminButtonVisibility();
                        console.log('[Auth] Admin session destroyed');
                    })
                    .catch((error) => {
                        console.error('[Auth] Firebase sign out error:', error);
                        // Still destroy local session even if Firebase fails
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
            
            // Refresh button
           if (e.target.id === 'refresh-orders' || 
          (e.target.classList.contains('action-btn') && e.target.querySelector('i.fa-sync-alt'))) {
           console.log('Refresh button clicked via event delegation');
             loadDashboardData();
             updateDashboardTime();
           e.stopPropagation();
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
                
            // In the tab switching click handler, add this condition:
if (tabName === 'products' && typeof ProductsManager !== 'undefined') {
    // Clear any previous content
    const productsTab = document.getElementById('products-tab-content');
    if (productsTab) {
        // Show loading, then render products
        productsTab.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #666;">
                <div style="text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Loading Products...</h3>
                    <p>Please wait while we load your products.</p>
                </div>
            </div>
        `;
        
        // Small delay to ensure UI updates, then render products
        setTimeout(() => {
            ProductsManager.renderProductsAdmin('products-tab-content');
        }, 100);
    }
}
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
        // In setupEventListeners() function, add:

// Analytics tab buttons
document.addEventListener('click', function(e) {
    // Track Inventory button
    if (e.target.id === 'track-inventory-btn' || 
        e.target.closest('#track-inventory-btn')) {
        console.log('[Admin] Track Inventory button clicked');
        showInventoryTrackingModal();
    }
    
    // Inventory Report button
    if (e.target.id === 'inventory-report-btn' || 
        e.target.closest('#inventory-report-btn')) {
        console.log('[Admin] Inventory Report button clicked');
        showInventoryReportModal();
    }
    
    // Future buttons (optional - for debugging)
    if (e.target.id === 'sales-analytics-btn' || 
        e.target.closest('#sales-analytics-btn')) {
        console.log('[Admin] Sales Analytics button clicked');
        alert('Sales Analytics - Coming Soon');
    }
    
    if (e.target.id === 'customer-insights-btn' || 
        e.target.closest('#customer-insights-btn')) {
        console.log('[Admin] Customer Insights button clicked');
        alert('Customer Insights - Coming Soon');
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
        
// Initialize Firebase auth state listener
    function initFirebaseAuthListener() {
        if (!CONFIG.FIREBASE_CONFIG_LOADED()) {
            console.warn('[Auth] Firebase not loaded, skipping auth listener');
            return;
        }
        
        console.log('[Auth] Setting up Firebase auth state listener');
        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('[Auth] Firebase user authenticated:', user.email);
                
                // Check if we have a valid local session
                const session = localStorage.getItem(CONFIG.SESSION_KEY);
                if (!session) {
                    // User is authenticated with Firebase but no local session
                    console.log('[Auth] Firebase auth detected but no local session, creating one');
                    createSession(user.email);
                    updateAdminButtonVisibility();
                }
            } else {
                console.log('[Auth] Firebase user signed out');
                
                // Ensure local session is destroyed when Firebase auth ends
                if (isAuthenticated) {
                    console.log('[Auth] Destroying local session due to Firebase sign out');
                    destroySession();
                    closeDashboard();
                    updateAdminButtonVisibility();
                }
            }
        });
    }
// Show Inventory Tracking Modal
function showInventoryTrackingModal() {
    console.log('[Admin] Opening Inventory Tracking Modal');
    
    // Check if InventoryManager is available
    if (typeof InventoryManager === 'undefined') {
        console.error('[Admin] InventoryManager not loaded');
        alert('Inventory system not available');
        return;
    }
    
    // Create or get modal
    let modal = document.getElementById('inventory-tracking-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'inventory-tracking-modal';
        modal.className = 'inventory-modal';
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
    
    // Get inventory report
    const report = InventoryManager.getInventoryTransactionsReport();
    console.log('[Admin] Inventory report:', report);
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        ">
            <!-- Header -->
            <div style="
                background: #2196f3;
                color: white;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            ">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-boxes" style="font-size: 1.5rem;"></i>
                    <h2 style="margin: 0;">Inventory Tracking</h2>
                </div>
                <button id="close-inventory-tracking" style="
                    background: rgba(255,255,255,0.2);
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
                ">&times;</button>
            </div>
            
            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span><strong>Total Transactions:</strong> ${report?.summary?.totalTransactions || 0}</span>
                        <span><strong>Total Products Tracked:</strong> ${report?.summary?.totalProducts || 0}</span>
                        <span><strong>Stock Changes:</strong> ${report?.summary?.totalStockChanges || 0}</span>
                    </div>
                </div>
                
                <h3 style="margin: 0 0 1rem 0;">Recent Transactions</h3>
                <div style="background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    ${report?.recentTransactions?.length ? 
                        report.recentTransactions.map(t => `
                            <div style="padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">${t.id}</div>
                                    <div style="font-size: 0.85rem; color: #666;">${new Date(t.timestamp).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style="background: ${t.type === 'order_deduction' ? '#4CAF50' : '#2196f3'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                                        ${t.type}
                                    </span>
                                </div>
                            </div>
                        `).join('') : 
                        '<div style="padding: 2rem; text-align: center; color: #666;">No transactions yet</div>'
                    }
                </div>
            </div>
            
            <!-- Footer -->
            <div style="
                padding: 1rem 1.5rem;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                flex-shrink: 0;
            ">
                <button id="export-inventory-btn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-download" style="margin-right: 0.5rem;"></i>
                    Export Data
                </button>
                <button id="refresh-inventory-btn" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-sync-alt" style="margin-right: 0.5rem;"></i>
                    Refresh
                </button>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listeners for this modal
    document.getElementById('close-inventory-tracking').onclick = () => {
        modal.style.display = 'none';
    };
    
    document.getElementById('refresh-inventory-btn').onclick = () => {
        console.log('[Admin] Refreshing inventory data');
        showInventoryTrackingModal(); // Refresh
    };
    
    document.getElementById('export-inventory-btn').onclick = () => {
        console.log('[Admin] Export inventory data clicked');
        alert('Export feature coming soon');
    };
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Show Inventory Report Modal
function showInventoryReportModal() {
    console.log('[Admin] Opening Inventory Report Modal');
    
    // Check if ProductsManager is available
    if (typeof ProductsManager === 'undefined') {
        console.error('[Admin] ProductsManager not loaded');
        alert('Products data not available');
        return;
    }
    
    // Create or get modal
    let modal = document.getElementById('inventory-report-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'inventory-report-modal';
        modal.className = 'inventory-report-modal';
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
    
    // Get products data
    const products = ProductsManager.getProducts({ activeOnly: true });
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        ">
            <!-- Header -->
            <div style="
                background: #4CAF50;
                color: white;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            ">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-chart-line" style="font-size: 1.5rem;"></i>
                    <h2 style="margin: 0;">Inventory Report</h2>
                </div>
                <button id="close-inventory-report" style="
                    background: rgba(255,255,255,0.2);
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
                ">&times;</button>
            </div>
            
            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                <!-- Summary -->
                <div style="margin-bottom: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <h3 style="margin: 0 0 1rem 0;">Inventory Summary</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div style="background: white; padding: 1rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #2196f3;">${products.length}</div>
                            <div>Total Products</div>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #4CAF50;">${products.reduce((sum, p) => sum + p.stock, 0)}</div>
                            <div>Total Stock</div>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #FF9800;">${products.filter(p => p.stock <= 5 && p.stock > 0).length}</div>
                            <div>Low Stock</div>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 6px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #f44336;">${products.filter(p => p.stock === 0).length}</div>
                            <div>Out of Stock</div>
                        </div>
                    </div>
                </div>
                
                <!-- Products Table -->
                <h3 style="margin: 0 0 1rem 0;">Products Inventory</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Product ID</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Stock</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Sold</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #ddd;">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.length ? 
                                products.map(p => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 1rem;">${p.id}</td>
                                        <td style="padding: 1rem;">${p.name}</td>
                                        <td style="padding: 1rem; text-transform: capitalize;">${p.category}</td>
                                        <td style="padding: 1rem; font-weight: 600; color: ${p.stock === 0 ? '#f44336' : p.stock <= 5 ? '#FF9800' : '#4CAF50'}">${p.stock}</td>
                                        <td style="padding: 1rem;">${p.salesCount || 0}</td>
                                        <td style="padding: 1rem; font-size: 0.85rem; color: #666;">
                                            ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                `).join('') :
                                '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #666;">No products found</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="
                padding: 1rem 1.5rem;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                flex-shrink: 0;
            ">
                <button id="print-report-btn" style="
                    background: #FF9800;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-print" style="margin-right: 0.5rem;"></i>
                    Print Report
                </button>
                <button id="export-report-btn" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-file-export" style="margin-right: 0.5rem;"></i>
                    Export CSV
                </button>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add event listeners
    document.getElementById('close-inventory-report').onclick = () => {
        modal.style.display = 'none';
    };
    
    document.getElementById('print-report-btn').onclick = () => {
        console.log('[Admin] Print report clicked');
        window.print();
    };
    
    document.getElementById('export-report-btn').onclick = () => {
        console.log('[Admin] Export CSV clicked');
        alert('CSV export coming soon');
    };
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}
        // Test function - run in console
function testAnalyticsButtons() { // to be removed later
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
