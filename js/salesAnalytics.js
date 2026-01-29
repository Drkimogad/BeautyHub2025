// ========================================================
// salesAnalytics.js - Financial Summary Mofal
// ========================================================

const salesAnalytics = (function() {
    'use strict';

    // ========================================================
    // CONFIGURATION
    // ========================================================
    const CONFIG = {
        VAT_PERCENTAGE: 15,
        STATUS_FILTER: 'shipped',
        CURRENCY: 'R',
        DEBUG: true,
        DEFAULT_PERIOD: 'current-month',
        MODAL_ZINDEX: 9999
    };

    // ========================================================
    // DEBUG UTILITY
    // ========================================================
    const debug = {
        log: function(message, data = null) {
            if (CONFIG.DEBUG) {
                console.log(`[salesAnalytics] ${message}`, data || '');
            }
        },
        error: function(message, error = null) {
            console.error(`[salesAnalytics] ERROR: ${message}`, error || '');
        },
        warn: function(message, data = null) {
            console.warn(`[salesAnalytics] WARNING: ${message}`, data || '');
        }
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let financialModal = null;
    let currentPeriod = CONFIG.DEFAULT_PERIOD;
    let financialData = null;

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        debug.log('Initializing financial analytics module');
        
        try {
            createFinancialModal();
            setupPeriodSelector();
            
            debug.log('Module initialized successfully');
            
            return {
                showFinancialSummary,
                calculateFinancialData
            };
            
        } catch (error) {
            debug.error('Failed to initialize module', error);
            return null;
        }
    }

    // ========================================================
    // MODAL 1: FINANCIAL SUMMARY
    // ========================================================
    function createFinancialModal() {
        debug.log('Creating financial summary modal');
        
        try {
            // Remove existing modal if present
            const existingModal = document.getElementById('financial-summary-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal container
            financialModal = document.createElement('div');
            financialModal.id = 'financial-summary-modal';
            financialModal.className = 'financial-summary-modal';
            financialModal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: ${CONFIG.MODAL_ZINDEX};
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;
            
            financialModal.innerHTML = `
                <div class="financial-modal-content" style="
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 1200px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                ">
                    <!-- Header -->
                    <div class="financial-modal-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid #e5e7eb;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 12px 12px 0 0;
                    ">
                        <div class="financial-header-title" style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chart-line" style="font-size: 24px;"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Financial Summary</h2>
                        </div>
                        <button id="close-financial-modal" class="financial-modal-close" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 28px;
                            cursor: pointer;
                            padding: 0;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            transition: background 0.2s;
                        ">&times;</button>
                    </div>
                    
                    <!-- Period Selector -->
                    <div class="financial-period-selector" style="
                        padding: 16px 24px;
                        border-bottom: 1px solid #e5e7eb;
                        background: #f9fafb;
                    ">
                        <select id="period-selector" class="period-select-dropdown" style="
                            padding: 8px 12px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            background: white;
                            font-size: 14px;
                            width: 200px;
                            margin-bottom: 12px;
                        ">
                            <option value="current-month">Current Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="last-3-months">Last 3 Months</option>
                            <option value="current-year">Current Year</option>
                            <option value="all-time">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        
                        <div class="period-display" style="display: flex; align-items: center; gap: 8px;">
                            <span id="period-text" style="font-weight: 600; color: #374151;">December 2024</span>
                            <span class="order-count" id="order-count" style="color: #6b7280; font-size: 0.9rem;">(20 orders)</span>
                        </div>
                    </div>
                    
                    <!-- Status Filter -->
                    <div class="status-filter-row" style="
                        padding: 12px 24px;
                        background: #fef3c7;
                        border-bottom: 1px solid #fde68a;
                    ">
                        <div class="status-filter-label" style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-filter" style="color: #d97706;"></i>
                            <span style="color: #92400e;">Showing: </span>
                            <span class="status-badge shipped" style="
                                background: #10b981;
                                color: white;
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 0.85rem;
                                font-weight: 500;
                            ">Shipped</span>
                        </div>
                    </div>
                    
                    <!-- Main Financial Metrics -->
                    <div class="financial-metrics-container" style="padding: 24px;">
                        <!-- Row 1: Revenue, Cost, Gross Profit -->
                        <div class="metrics-row" style="
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                            margin-bottom: 20px;
                        ">
                            <div class="metric-card primary" style="
                                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span style="font-weight: 500;">Total Sale Revenue</span>
                                </div>
                                <div class="metric-value" id="total-revenue" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R5,000</div>
                                <div class="metric-subtext" style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem; opacity: 0.9;">
                                    <i class="fas fa-shopping-cart"></i>
                                    From <span id="total-orders">20</span> orders
                                </div>
                            </div>
                            
                            <div class="metric-card secondary" style="
                                background: linear-gradient(135deg, #6366f1, #4f46e5);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-industry"></i>
                                    <span style="font-weight: 500;">Wholesale Cost</span>
                                </div>
                                <div class="metric-value" id="wholesale-cost" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R2,000</div>
                                <div class="metric-subtext" style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem; opacity: 0.9;">
                                    <i class="fas fa-boxes"></i>
                                    Product cost only
                                </div>
                            </div>
                            
                            <div class="metric-card success" style="
                                background: linear-gradient(135deg, #10b981, #059669);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-chart-line"></i>
                                    <span style="font-weight: 500;">Gross Profit</span>
                                </div>
                                <div class="metric-value" id="gross-profit" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R3,000</div>
                                <div class="metric-percentage" id="gross-margin" style="
                                    font-size: 1.5rem;
                                    font-weight: 600;
                                    background: rgba(255, 255, 255, 0.2);
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    display: inline-block;
                                ">60%</div>
                            </div>
                        </div>
                        
                        <!-- Row 2: Tax, Shipping, Net Profit -->
                        <div class="metrics-row" style="
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                        ">
                            <div class="metric-card warning" style="
                                background: linear-gradient(135deg, #f59e0b, #d97706);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-receipt"></i>
                                    <span style="font-weight: 500;">Tax (15% VAT)</span>
                                </div>
                                <div class="metric-value" id="total-tax" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R750</div>
                                <div class="metric-subtext" style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem; opacity: 0.9;">
                                    <i class="fas fa-percentage"></i>
                                    15% of revenue
                                </div>
                            </div>
                            
                            <div class="metric-card info" style="
                                background: linear-gradient(135deg, #06b6d4, #0891b2);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-truck"></i>
                                    <span style="font-weight: 500;">Shipping Fees</span>
                                </div>
                                <div class="metric-value" id="shipping-fees" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R400</div>
                                <div class="metric-subtext" style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem; opacity: 0.9;">
                                    <i class="fas fa-shipping-fast"></i>
                                    From all orders
                                </div>
                            </div>
                            
                            <div class="metric-card highlight" style="
                                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
                            ">
                                <div class="metric-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <i class="fas fa-coins"></i>
                                    <span style="font-weight: 500;">Net Profit</span>
                                </div>
                                <div class="metric-value" id="net-profit" style="
                                    font-size: 2rem;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                ">R1,850</div>
                                <div class="metric-percentage" id="net-margin" style="
                                    font-size: 1.5rem;
                                    font-weight: 600;
                                    background: rgba(255, 255, 255, 0.2);
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    display: inline-block;
                                ">37%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Breakdown Sections -->
                    <div class="breakdown-container" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 24px;
                        padding: 0 24px 24px;
                    ">
                        <!-- Category Breakdown -->
                        <div class="breakdown-section" style="
                            background: #f9fafb;
                            border-radius: 10px;
                            border: 1px solid #e5e7eb;
                            overflow: hidden;
                        ">
                            <div class="breakdown-header" style="
                                padding: 16px;
                                background: #f3f4f6;
                                border-bottom: 1px solid #e5e7eb;
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            ">
                                <i class="fas fa-boxes" style="color: #6366f1;"></i>
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Order Breakdown by Category</h3>
                            </div>
                            <div class="breakdown-content" id="category-breakdown" style="padding: 16px;">
                                <div class="breakdown-item" style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                    border-bottom: 1px solid #e5e7eb;
                                ">
                                    <span class="breakdown-label" style="font-weight: 500; color: #374151;">Perfumes</span>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span class="breakdown-value" style="font-weight: 600; color: #059669;">R2,500</span>
                                        <span class="breakdown-count" style="font-size: 0.9rem; color: #6b7280;">(12 orders)</span>
                                    </div>
                                </div>
                                <div class="breakdown-item" style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                    border-bottom: 1px solid #e5e7eb;
                                ">
                                    <span class="breakdown-label" style="font-weight: 500; color: #374151;">Lashes</span>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span class="breakdown-value" style="font-weight: 600; color: #059669;">R1,800</span>
                                        <span class="breakdown-count" style="font-size: 0.9rem; color: #6b7280;">(5 orders)</span>
                                    </div>
                                </div>
                                <div class="breakdown-item" style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                ">
                                    <span class="breakdown-label" style="font-weight: 500; color: #374151;">Wigs</span>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span class="breakdown-value" style="font-weight: 600; color: #059669;">R700</span>
                                        <span class="breakdown-count" style="font-size: 0.9rem; color: #6b7280;">(3 orders)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Customer Type Breakdown -->
                        <div class="breakdown-section" style="
                            background: #f9fafb;
                            border-radius: 10px;
                            border: 1px solid #e5e7eb;
                            overflow: hidden;
                        ">
                            <div class="breakdown-header" style="
                                padding: 16px;
                                background: #f3f4f6;
                                border-bottom: 1px solid #e5e7eb;
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            ">
                                <i class="fas fa-users" style="color: #6366f1;"></i>
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Customer Type Distribution</h3>
                            </div>
                            <div class="breakdown-content" id="customer-breakdown" style="padding: 16px;">
                                <div class="customer-type-row">
                                    <div class="customer-type-item" style="
                                        padding: 12px 0;
                                        border-bottom: 1px solid #e5e7eb;
                                    ">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span class="customer-label" style="font-weight: 500; color: #374151;">Retailer</span>
                                            <div class="customer-stats" style="display: flex; align-items: center; gap: 16px;">
                                                <span class="customer-percentage" style="
                                                    font-weight: 600;
                                                    color: #059669;
                                                    background: #d1fae5;
                                                    padding: 4px 12px;
                                                    border-radius: 20px;
                                                ">65%</span>
                                                <span class="customer-count" style="font-size: 0.9rem; color: #6b7280;">13 customers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="customer-type-item" style="
                                        padding: 12px 0;
                                        border-bottom: 1px solid #e5e7eb;
                                    ">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span class="customer-label" style="font-weight: 500; color: #374151;">Wholesale</span>
                                            <div class="customer-stats" style="display: flex; align-items: center; gap: 16px;">
                                                <span class="customer-percentage" style="
                                                    font-weight: 600;
                                                    color: #3b82f6;
                                                    background: #dbeafe;
                                                    padding: 4px 12px;
                                                    border-radius: 20px;
                                                ">20%</span>
                                                <span class="customer-count" style="font-size: 0.9rem; color: #6b7280;">4 customers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="customer-type-item" style="
                                        padding: 12px 0;
                                        border-bottom: 1px solid #e5e7eb;
                                    ">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span class="customer-label" style="font-weight: 500; color: #374151;">Personal</span>
                                            <div class="customer-stats" style="display: flex; align-items: center; gap: 16px;">
                                                <span class="customer-percentage" style="
                                                    font-weight: 600;
                                                    color: #f59e0b;
                                                    background: #fef3c7;
                                                    padding: 4px 12px;
                                                    border-radius: 20px;
                                                ">10%</span>
                                                <span class="customer-count" style="font-size: 0.9rem; color: #6b7280;">2 customers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="customer-type-item" style="padding: 12px 0;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span class="customer-label" style="font-weight: 500; color: #374151;">Corporate</span>
                                            <div class="customer-stats" style="display: flex; align-items: center; gap: 16px;">
                                                <span class="customer-percentage" style="
                                                    font-weight: 600;
                                                    color: #8b5cf6;
                                                    background: #ede9fe;
                                                    padding: 4px 12px;
                                                    border-radius: 20px;
                                                ">5%</span>
                                                <span class="customer-count" style="font-size: 0.9rem; color: #6b7280;">1 customer</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="financial-actions" style="
                        padding: 20px 24px;
                        border-top: 1px solid #e5e7eb;
                        background: #f9fafb;
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        border-radius: 0 0 12px 12px;
                    ">
                        
                        <button id="print-summary-btn" class="action-btn print-btn" style="
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.3)';" 
onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
    <i class="fas fa-print"></i>
    Print Summary
</button>
                        
                        <button id="refresh-financial-btn" class="action-btn refresh-btn" style="
                            background: #f3f4f6;
                            color: #374151;
                            border: 1px solid #d1d5db;
                            padding: 10px 20px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='translateY(-2px)';" 
                        onmouseout="this.style.transform='translateY(0)';">
                            <i class="fas fa-sync-alt"></i>
                            Refresh Data
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(financialModal);
            setupFinancialModalEvents();
            debug.log('Financial summary modal created successfully');
            
        } catch (error) {
            debug.error('Failed to create financial modal', error);
        }
    }

   
//====added new for data calculatiins from firestore ⬇️⬇️⬇️========
async function refreshDataFromFirestore() {
    try {
        const db = firebase.firestore();
        
        // Refresh orders from Firestore
        if (typeof OrdersManager !== 'undefined' && typeof OrdersManager.refreshFromFirestore === 'function') {
            await OrdersManager.refreshFromFirestore();
        }
        
        // Refresh products from Firestore
        if (typeof ProductsManager !== 'undefined' && typeof ProductsManager.updateFromFirestoreInBackground === 'function') {
            await ProductsManager.updateFromFirestoreInBackground();
        }
        
        console.log('[SalesAnalytics] Firestore data refreshed');
    } catch (error) {
        console.warn('[SalesAnalytics] Firestore refresh failed, using cached data:', error);
    }
}
    // ========================================================
    // DATA CALCULATION FUNCTIONS⬆️⬆️⬆️⬆️⬆️⬆️
    // ========================================================
    async function calculateFinancialData(period = CONFIG.DEFAULT_PERIOD) {
        debug.log('Calculating financial data for period:', period);
        
        try {
          // TRY FIRESTORE FIRST FOR FRESH DATA
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            console.log('[SalesAnalytics] Fetching fresh orders from Firestore...');
            await refreshDataFromFirestore();
        }
            if (typeof OrdersManager === 'undefined') {
                debug.error('OrdersManager not available');
                return getEmptyFinancialData();
            }
            
            if (typeof ProductsManager === 'undefined') {
                debug.error('ProductsManager not available');
                return getEmptyFinancialData();
            }
            
            // Get all shipped orders
            const allOrders = OrdersManager.getOrders(CONFIG.STATUS_FILTER);
            debug.log(`Retrieved ${allOrders.length} shipped orders`);
            
            // Filter by period
            const filteredOrders = filterOrdersByPeriod(allOrders, period);
            debug.log(`Filtered to ${filteredOrders.length} orders for period: ${period}`);
            
            if (filteredOrders.length === 0) {
                debug.warn('No orders found for period:', period);
                return getEmptyFinancialData();
            }
            
            // Calculate financial metrics
            const metrics = calculateOrderMetrics(filteredOrders);
            
            // Calculate category breakdown
            const categoryBreakdown = calculateCategoryBreakdown(filteredOrders);
            
            // Calculate customer type distribution
            const customerBreakdown = calculateCustomerBreakdown(filteredOrders);
            
            // Compile all data
            financialData = {
                period: period,
                periodText: getPeriodText(period),
                totalOrders: filteredOrders.length,
                metrics: metrics,
                categoryBreakdown: categoryBreakdown,
                customerBreakdown: customerBreakdown,
                filteredOrders: filteredOrders,
                calculatedAt: new Date().toISOString()
            };
            
            debug.log('Financial data calculated successfully', {
                totalOrders: financialData.totalOrders,
                revenue: financialData.metrics.totalRevenue,
                profit: financialData.metrics.netProfit
            });
            
            return financialData;
            
        } catch (error) {
            debug.error('Failed to calculate financial data', error);
            return getEmptyFinancialData();
        }
    }

    function calculateOrderMetrics(orders) {
        let totalRevenue = 0;
        let wholesaleCost = 0;
        let totalTax = 0;
        let shippingFees = 0;
        
        debug.log('Calculating order metrics for', orders.length, 'orders');
        
        // Calculate totals from orders
        orders.forEach(order => {
            totalRevenue += parseFloat(order.totalAmount) || 0;
            totalTax += parseFloat(order.tax) || 0;
            shippingFees += parseFloat(order.shippingCost) || 0;
            
            // Calculate wholesale cost per order
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const product = ProductsManager.getProductById(item.productId);
                    if (product) {
                        const wholesalePrice = parseFloat(product.wholesalePrice) || 0;
                        wholesaleCost += wholesalePrice * (parseInt(item.quantity) || 1);
                    }
                });
            }
        });
        
        // Calculate profits
        const grossProfit = totalRevenue - wholesaleCost;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        const netProfit = grossProfit - totalTax - shippingFees;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        const result = {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            wholesaleCost: parseFloat(wholesaleCost.toFixed(2)),
            totalTax: parseFloat(totalTax.toFixed(2)),
            shippingFees: parseFloat(shippingFees.toFixed(2)),
            grossProfit: parseFloat(grossProfit.toFixed(2)),
            grossMargin: parseFloat(grossMargin.toFixed(1)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            netMargin: parseFloat(netMargin.toFixed(1))
        };
        
        debug.log('Order metrics calculated', result);
        return result;
    }

    function calculateCategoryBreakdown(orders) {
        const categories = {};
        
        debug.log('Calculating category breakdown for', orders.length, 'orders');
        
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const product = ProductsManager.getProductById(item.productId);
                    if (product) {
                        const category = product.category || 'Uncategorized';
                        const orderCount = 1; // Count each order once for category
                        const revenue = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
                        
                        if (!categories[category]) {
                            categories[category] = {
                                revenue: 0,
                                orderCount: 0
                            };
                        }
                        
                        categories[category].revenue += revenue;
                        // Only count order once per category
                        if (!categories[category].ordersSeen) {
                            categories[category].ordersSeen = new Set();
                        }
                        if (!categories[category].ordersSeen.has(order.id)) {
                            categories[category].orderCount++;
                            categories[category].ordersSeen.add(order.id);
                        }
                    }
                });
            }
        });
        
        // Convert to array and sort by revenue
        const result = Object.entries(categories)
            .map(([category, data]) => ({
                category,
                revenue: parseFloat(data.revenue.toFixed(2)),
                orderCount: data.orderCount
            }))
            .sort((a, b) => b.revenue - a.revenue);
        
        debug.log('Category breakdown calculated', result);
        return result;
    }

    function calculateCustomerBreakdown(orders) {
        const customerTypes = {
            retailer: { count: 0, orders: 0 },
            wholesaler: { count: 0, orders: 0 },
            personal: { count: 0, orders: 0 },
            corporate: { count: 0, orders: 0 }
        };
        
        debug.log('Calculating customer breakdown for', orders.length, 'orders');
        
        // Count unique customers by phone number
        const uniqueCustomers = {};
        
        orders.forEach(order => {
            const customerType = order.customerType || 'personal';
            const customerPhone = order.customerPhone || 'unknown';
            
            // Count orders per type
            customerTypes[customerType].orders++;
            
            // Count unique customers
            if (!uniqueCustomers[customerType]) {
                uniqueCustomers[customerType] = new Set();
            }
            uniqueCustomers[customerType].add(customerPhone);
        });
        
        // Update counts with unique customers
        Object.keys(customerTypes).forEach(type => {
            customerTypes[type].count = uniqueCustomers[type] ? uniqueCustomers[type].size : 0;
        });
        
        // Calculate percentages
        const totalOrders = orders.length;
        const result = {};
        
        Object.entries(customerTypes).forEach(([type, data]) => {
            const orderPercentage = totalOrders > 0 ? (data.orders / totalOrders) * 100 : 0;
            result[type] = {
                percentage: parseFloat(orderPercentage.toFixed(1)),
                customerCount: data.count,
                orderCount: data.orders
            };
        });
        
        debug.log('Customer breakdown calculated', result);
        return result;
    }

    function filterOrdersByPeriod(orders, period) {
        const now = new Date();
        let startDate = new Date();
        
        switch(period) {
            case 'current-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case 'last-3-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'current-year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all-time':
                return orders; // No filtering
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        return orders.filter(order => {
            const orderDate = new Date(order.createdAt || order.shippingDate || order.updatedAt);
            return orderDate >= startDate && orderDate <= now;
        });
    }

    function getEmptyFinancialData() {
        return {
            period: currentPeriod,
            periodText: getPeriodText(currentPeriod),
            totalOrders: 0,
            metrics: {
                totalRevenue: 0,
                wholesaleCost: 0,
                totalTax: 0,
                shippingFees: 0,
                grossProfit: 0,
                grossMargin: 0,
                netProfit: 0,
                netMargin: 0
            },
            categoryBreakdown: [],
            customerBreakdown: {
                retailer: { percentage: 0, customerCount: 0, orderCount: 0 },
                wholesaler: { percentage: 0, customerCount: 0, orderCount: 0 },
                personal: { percentage: 0, customerCount: 0, orderCount: 0 },
                corporate: { percentage: 0, customerCount: 0, orderCount: 0 }
            },
            filteredOrders: []
        };
    }

    function getEmptyMetrics() {
    return {
        totalRevenue: 0,
        wholesaleCost: 0,
        totalTax: 0,
        shippingFees: 0,
        grossProfit: 0,
        grossMargin: 0,
        netProfit: 0,
        netMargin: 0
    };
}

    // ========================================================
    // UI UPDATE FUNCTIONS
    // ========================================================
    function updateFinancialModal(data) {
        debug.log('Updating financial modal with data');
        
        try {
            if (!data) {
                debug.warn('No data provided for financial modal update');
                return;
            }
            if (!data || !data.metrics) {
               debug.warn('No metrics in financial data - showing empty state'); // ⭐ CHANGE ERROR TO WARN
                data = data || getEmptyFinancialData(); // ✅ Use the existing function
             data.metrics = data.metrics || getEmptyMetrics(); // ✅ Now getEmptyMetrics exists
              return;
             }
            
            // Update period display
            const periodText = document.getElementById('period-text');
            const orderCount = document.getElementById('order-count');
            const totalOrders = document.getElementById('total-orders');
            
            if (periodText) periodText.textContent = data.periodText;
            if (orderCount) orderCount.textContent = `(${data.totalOrders} orders)`;
            if (totalOrders) totalOrders.textContent = data.totalOrders;
            
            // Update main metrics
            const metrics = data.metrics;
            
            document.getElementById('total-revenue').textContent = 
                formatCurrency(metrics.totalRevenue);
            document.getElementById('wholesale-cost').textContent = 
                formatCurrency(metrics.wholesaleCost);
            document.getElementById('gross-profit').textContent = 
                formatCurrency(metrics.grossProfit);
            document.getElementById('gross-margin').textContent = 
                `${metrics.grossMargin}%`;
            
            document.getElementById('total-tax').textContent = 
                formatCurrency(metrics.totalTax);
            document.getElementById('shipping-fees').textContent = 
                formatCurrency(metrics.shippingFees);
            document.getElementById('net-profit').textContent = 
                formatCurrency(metrics.netProfit);
            document.getElementById('net-margin').textContent = 
                `${metrics.netMargin}%`;
            
            // Update category breakdown
            updateCategoryBreakdown(data.categoryBreakdown);
            
            // Update customer breakdown
            updateCustomerBreakdown(data.customerBreakdown);
            
            debug.log('Financial modal updated successfully');
            
        } catch (error) {
            debug.error('Failed to update financial modal', error);
        }
    }

    function updateCategoryBreakdown(categories) {
        const container = document.getElementById('category-breakdown');
        if (!container) {
            debug.warn('Category breakdown container not found');
            return;
        }
        
        if (categories.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280; font-style: italic;">No category data available</div>';
            return;
        }
        
        const html = categories.map(item => `
            <div class="breakdown-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
            ">
                <span class="breakdown-label" style="font-weight: 500; color: #374151;">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="breakdown-value" style="font-weight: 600; color: #059669;">${formatCurrency(item.revenue)}</span>
                    <span class="breakdown-count" style="font-size: 0.9rem; color: #6b7280;">(${item.orderCount} orders)</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    function updateCustomerBreakdown(customerData) {
        const container = document.getElementById('customer-breakdown');
        if (!container) {
            debug.warn('Customer breakdown container not found');
            return;
        }
        
        const types = [
            { key: 'retailer', label: 'Retailer' },
            { key: 'wholesaler', label: 'Wholesale' },
            { key: 'personal', label: 'Personal' },
            { key: 'corporate', label: 'Corporate' }
        ];
        
        const html = types.map(type => {
            const data = customerData[type.key] || { percentage: 0, customerCount: 0, orderCount: 0 };
            return `
                <div class="customer-type-item" style="
                    padding: 12px 0;
                    border-bottom: 1px solid #e5e7eb;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="customer-label" style="font-weight: 500; color: #374151;">${type.label}</span>
                        <div class="customer-stats" style="display: flex; align-items: center; gap: 16px;">
                            <span class="customer-percentage" style="
                                font-weight: 600;
                                color: #059669;
                                background: #d1fae5;
                                padding: 4px 12px;
                                border-radius: 20px;
                            ">${data.percentage}%</span>
                            <span class="customer-count" style="font-size: 0.9rem; color: #6b7280;">${data.customerCount} customers</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const wrapper = document.createElement('div');
        wrapper.className = 'customer-type-row';
        wrapper.style.cssText = '';
        wrapper.innerHTML = html;
        
        container.innerHTML = '';
        container.appendChild(wrapper);
    }

    // ========================================================
    // UTILITY FUNCTIONS
    // ========================================================
    function formatCurrency(amount) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            return `${CONFIG.CURRENCY}0.00`;
        }
        return `${CONFIG.CURRENCY}${numAmount.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    function getPeriodText(period) {
        const now = new Date();
        switch(period) {
            case 'current-month':
                return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            case 'last-month':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return lastMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            case 'last-3-months':
                return 'Last 3 Months';
            case 'current-year':
                return `${now.getFullYear()} (Year to Date)`;
            case 'all-time':
                return 'All Time';
            case 'custom':
                return 'Custom Range';
            default:
                return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        }
    }

    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    function setupFinancialModalEvents() {
        debug.log('Setting up financial modal event handlers');
        
        try {
            // Close button
            const closeBtn = document.getElementById('close-financial-modal');
            if (closeBtn) {
                closeBtn.onclick = closeFinancialModal;
            }
            
            // Period selector
            const periodSelector = document.getElementById('period-selector');
            if (periodSelector) {
                periodSelector.addEventListener('change', function() {
                    currentPeriod = this.value;
                    debug.log('Period changed to:', currentPeriod);
                    loadFinancialData();
                });
            }
            
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.onclick = loadFinancialData;
            }

            const printBtn = document.getElementById('print-summary-btn');
if (printBtn) {
    printBtn.onclick = function() {
        debug.log('Print summary button clicked');
        
        // Get the modal content
        const modalContent = document.querySelector('.financial-modal-content');
        if (!modalContent) return;
        
        // Create a print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Financial Summary - ${new Date().toLocaleDateString()}</title>
                    <style>
                        @media print {
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                            .print-title { font-size: 24px; margin: 0; }
                            .print-date { color: #666; margin-top: 5px; }
                            .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
                            .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                            .metric-label { font-weight: bold; margin-bottom: 10px; }
                            .metric-value { font-size: 20px; color: #2c5282; }
                            .breakdown-section { margin-top: 30px; }
                            .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1 class="print-title">Financial Summary Report</h1>
                        <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
                        <div class="print-period">Period: ${document.getElementById('period-text')?.textContent || 'Current Month'}</div>
                    </div>
        `);
        
        // Clone and clean the content for printing
        const contentClone = modalContent.cloneNode(true);
        
        // Remove action buttons and non-essential elements
        const actionsDiv = contentClone.querySelector('.financial-actions');
        const closeBtn = contentClone.querySelector('.financial-modal-close');
        if (actionsDiv) actionsDiv.remove();
        if (closeBtn) closeBtn.remove();
        
        // Update styles for print
        contentClone.style.width = '100%';
        contentClone.style.maxWidth = 'none';
        contentClone.style.boxShadow = 'none';
        contentClone.style.border = '1px solid #ddd';
        
        // Get the HTML
        printWindow.document.write(contentClone.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Trigger print after content loads
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };
}
            
            // Close modal when clicking outside
            if (financialModal) {
                financialModal.addEventListener('click', function(e) {
                    if (e.target === financialModal) {
                        closeFinancialModal();
                    }
                });
            }
            
            // Close with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && financialModal && financialModal.style.display === 'flex') {
                    closeFinancialModal();
                }
            });
            
            debug.log('Financial modal event handlers setup complete');
            
        } catch (error) {
            debug.error('Failed to setup financial modal events', error);
        }
    }



    function setupPeriodSelector() {
        // Set default value
        const selector = document.getElementById('period-selector');
        if (selector) {
            selector.value = CONFIG.DEFAULT_PERIOD;
            currentPeriod = CONFIG.DEFAULT_PERIOD;
        }
    }

    // ========================================================
    // MODAL CONTROL FUNCTIONS
    // ========================================================
function showFinancialSummary() {
    debug.log('Showing financial summary modal');
    
    try {
        // Ensure module is initialized
        if (!financialModal) {
            createFinancialModal();
        }
        
        // Refresh from Firestore BEFORE showing modal
        const loadWithFreshData = async () => {
            try {
                console.log('[SalesAnalytics] Refreshing from Firestore before showing modal');
                await refreshDataFromFirestore();
            } catch (error) {
                console.warn('[SalesAnalytics] Firestore refresh failed, using cached data', error);
            }
            
            // Show modal and load data
            financialModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            loadFinancialData();
        };
        
        loadWithFreshData();
        
    } catch (error) {
        debug.error('Failed to show financial modal', error);
    }
}

    function closeFinancialModal() {
        debug.log('Closing financial modal');
        
        try {
            if (financialModal) {
                financialModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        } catch (error) {
            debug.error('Failed to close financial modal', error);
        }
    }

    function loadFinancialData() {
        debug.log('Loading financial data');
        
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                const originalHtml = refreshBtn.innerHTML;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                refreshBtn.disabled = true;
                
                // Calculate data asynchronously to prevent UI freeze
                setTimeout(() => {
                    try {
                        const data = calculateFinancialData(currentPeriod);
                        updateFinancialModal(data);
                        
                        // Reset button
                        refreshBtn.innerHTML = originalHtml;
                        refreshBtn.disabled = false;
                    } catch (error) {
                        debug.error('Error in financial data calculation', error);
                        refreshBtn.innerHTML = originalHtml;
                        refreshBtn.disabled = false;
                    }
                }, 500); // increased from 50 to 500
            } else {
                // If no button, just calculate and update
                const data = calculateFinancialData(currentPeriod);
                updateFinancialModal(data);
            }
            
        } catch (error) {
            debug.error('Failed to load financial data', error);
            
            // Reset button on error
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
                refreshBtn.disabled = false;
            }
        }
    }



// ========================================================
// MISSING DATA GETTER FUNCTIONS
// ========================================================
function getFinancialData() {
    try {
        debug.log('Getting financial data for current period:', currentPeriod);
        return calculateFinancialData(currentPeriod);
    } catch (error) {
        debug.error('Failed to get financial data', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to load financial data'
        };
    }
}


    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        // Initialization
        init,
        
        // Modal Control
        showFinancialSummary,
        
        // Data Access
        getFinancialData: function() { return financialData; },
        
        // Calculation Functions (for external use/testing)
        calculateFinancialData,
        
        // Utility Functions (for external use)
        formatCurrency,
        
        // Debug Control
        setDebugMode: function(enabled) { CONFIG.DEBUG = enabled; },
        
        // Configuration
        getConfig: function() { return { ...CONFIG }; }
    };
})();

console.log('[salesAnalytics] Module definition complete - Ready for production');
