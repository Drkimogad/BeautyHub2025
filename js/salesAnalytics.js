// ========================================================
// salesAnalytics.js - Financial Analytics Module
// Core Functionalities:
// 1. Financial summary modal with period filtering
// 2. Profit margin calculations across orders
// 3. Category and customer type breakdowns
// ========================================================
const SalesAnalytics = (function() {
    // ========================================================
    // CONFIGURATION
    // ========================================================
    const CONFIG = {
        VAT_PERCENTAGE: 15,
        STATUS_FILTER: 'shipped', // Default: only shipped orders
        CURRENCY: 'R'
    };

    // ========================================================
    // STATE MANAGEMENT
    // ========================================================
    let financialModal = null;
    let currentPeriod = getCurrentMonth();
    let financialData = null;

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        console.log('[SalesAnalytics] Initializing financial analytics module');
        createFinancialModal();
        setupPeriodSelector();
        return {
            showFinancialSummary,
            getFinancialData
        };
    }

    // ========================================================
    // MODAL CREATION
    // ========================================================
    function createFinancialModal() {
        console.log('[SalesAnalytics] Creating financial summary modal');
        
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
            
            financialModal.innerHTML = `
                <div class="financial-modal-content">
                    <!-- Header -->
                    <div class="financial-modal-header">
                        <div class="financial-header-title">
                            <i class="fas fa-chart-line"></i>
                            <h2>Financial Summary</h2>
                        </div>
                        <button id="close-financial-modal" class="financial-modal-close">&times;</button>
                    </div>
                    
                    <!-- Period Selector -->
                    <div class="financial-period-selector">
                        <select id="period-selector" class="period-select-dropdown">
                            <option value="current-month">Current Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="last-3-months">Last 3 Months</option>
                            <option value="current-year">Current Year</option>
                            <option value="all-time">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        
                        <div class="period-display">
                            <span id="period-text">December 2024</span>
                            <span class="order-count" id="order-count">(20 orders)</span>
                        </div>
                    </div>
                    
                    <!-- Status Filter -->
                    <div class="status-filter-row">
                        <div class="status-filter-label">
                            <i class="fas fa-filter"></i>
                            Showing: 
                            <span class="status-badge shipped">Shipped</span>
                        </div>
                    </div>
                    
                    <!-- Main Financial Metrics -->
                    <div class="financial-metrics-container">
                        <!-- Row 1: Revenue, Cost, Gross Profit -->
                        <div class="metrics-row">
                            <div class="metric-card primary">
                                <div class="metric-label">
                                    <i class="fas fa-money-bill-wave"></i>
                                    Total Sale Revenue
                                </div>
                                <div class="metric-value" id="total-revenue">R5,000</div>
                                <div class="metric-subtext">
                                    <i class="fas fa-shopping-cart"></i>
                                    From <span id="total-orders">20</span> orders
                                </div>
                            </div>
                            
                            <div class="metric-card secondary">
                                <div class="metric-label">
                                    <i class="fas fa-industry"></i>
                                    Wholesale Cost
                                </div>
                                <div class="metric-value" id="wholesale-cost">R2,000</div>
                                <div class="metric-subtext">
                                    <i class="fas fa-boxes"></i>
                                    Product cost only
                                </div>
                            </div>
                            
                            <div class="metric-card success">
                                <div class="metric-label">
                                    <i class="fas fa-chart-line"></i>
                                    Gross Profit
                                </div>
                                <div class="metric-value" id="gross-profit">R3,000</div>
                                <div class="metric-percentage" id="gross-margin">60%</div>
                            </div>
                        </div>
                        
                        <!-- Row 2: Tax, Shipping, Net Profit -->
                        <div class="metrics-row">
                            <div class="metric-card warning">
                                <div class="metric-label">
                                    <i class="fas fa-receipt"></i>
                                    Tax (15% VAT)
                                </div>
                                <div class="metric-value" id="total-tax">R750</div>
                                <div class="metric-subtext">
                                    <i class="fas fa-percentage"></i>
                                    15% of revenue
                                </div>
                            </div>
                            
                            <div class="metric-card info">
                                <div class="metric-label">
                                    <i class="fas fa-truck"></i>
                                    Shipping Fees
                                </div>
                                <div class="metric-value" id="shipping-fees">R400</div>
                                <div class="metric-subtext">
                                    <i class="fas fa-shipping-fast"></i>
                                    From all orders
                                </div>
                            </div>
                            
                            <div class="metric-card highlight">
                                <div class="metric-label">
                                    <i class="fas fa-coins"></i>
                                    Net Profit
                                </div>
                                <div class="metric-value" id="net-profit">R1,850</div>
                                <div class="metric-percentage" id="net-margin">37%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Breakdown Sections -->
                    <div class="breakdown-container">
                        <!-- Category Breakdown -->
                        <div class="breakdown-section">
                            <div class="breakdown-header">
                                <i class="fas fa-boxes"></i>
                                <h3>Order Breakdown by Category</h3>
                            </div>
                            <div class="breakdown-content" id="category-breakdown">
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Perfumes</span>
                                    <span class="breakdown-value">R2,500</span>
                                    <span class="breakdown-count">(12 orders)</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Lashes</span>
                                    <span class="breakdown-value">R1,800</span>
                                    <span class="breakdown-count">(5 orders)</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Wigs</span>
                                    <span class="breakdown-value">R700</span>
                                    <span class="breakdown-count">(3 orders)</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Customer Type Breakdown -->
                        <div class="breakdown-section">
                            <div class="breakdown-header">
                                <i class="fas fa-users"></i>
                                <h3>Customer Type Distribution</h3>
                            </div>
                            <div class="breakdown-content" id="customer-breakdown">
                                <div class="customer-type-row">
                                    <div class="customer-type-item">
                                        <span class="customer-label">Retailer</span>
                                        <div class="customer-stats">
                                            <span class="customer-percentage">65%</span>
                                            <span class="customer-count">13 customers</span>
                                        </div>
                                    </div>
                                    <div class="customer-type-item">
                                        <span class="customer-label">Wholesale</span>
                                        <div class="customer-stats">
                                            <span class="customer-percentage">20%</span>
                                            <span class="customer-count">4 customers</span>
                                        </div>
                                    </div>
                                    <div class="customer-type-item">
                                        <span class="customer-label">Personal</span>
                                        <div class="customer-stats">
                                            <span class="customer-percentage">10%</span>
                                            <span class="customer-count">2 customers</span>
                                        </div>
                                    </div>
                                    <div class="customer-type-item">
                                        <span class="customer-label">Corporate</span>
                                        <div class="customer-stats">
                                            <span class="customer-percentage">5%</span>
                                            <span class="customer-count">1 customer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="financial-actions">
                        <button id="detailed-profits-btn" class="action-btn primary-btn">
                            <i class="fas fa-chart-pie"></i>
                            Detailed Profits
                        </button>
                        <button id="shipping-analysis-btn" class="action-btn secondary-btn">
                            <i class="fas fa-shipping-fast"></i>
                            Shipping Analysis
                        </button>
                        <button id="refresh-financial-btn" class="action-btn refresh-btn">
                            <i class="fas fa-sync-alt"></i>
                            Refresh Data
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(financialModal);
            setupFinancialModalEvents();
            console.log('[SalesAnalytics] Financial summary modal created');
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to create financial modal:', error);
        }
    }

    // ========================================================
    // DATA CALCULATION FUNCTIONS
    // ========================================================
    function calculateFinancialData(period = 'current-month') {
        console.log('[SalesAnalytics] Calculating financial data for period:', period);
        
        try {
            if (typeof OrdersManager === 'undefined') {
                console.error('[SalesAnalytics] OrdersManager not available');
                return null;
            }
            
            if (typeof ProductsManager === 'undefined') {
                console.error('[SalesAnalytics] ProductsManager not available');
                return null;
            }
            
            // Get all shipped orders
            const allOrders = OrdersManager.getOrders(CONFIG.STATUS_FILTER);
            
            // Filter by period
            const filteredOrders = filterOrdersByPeriod(allOrders, period);
            
            if (filteredOrders.length === 0) {
                console.log('[SalesAnalytics] No orders found for period:', period);
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
            
            console.log('[SalesAnalytics] Financial data calculated:', financialData);
            return financialData;
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to calculate financial data:', error);
            return getEmptyFinancialData();
        }
    }

    function calculateOrderMetrics(orders) {
        let totalRevenue = 0;
        let wholesaleCost = 0;
        let totalTax = 0;
        let shippingFees = 0;
        
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
        
        return {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            wholesaleCost: parseFloat(wholesaleCost.toFixed(2)),
            totalTax: parseFloat(totalTax.toFixed(2)),
            shippingFees: parseFloat(shippingFees.toFixed(2)),
            grossProfit: parseFloat(grossProfit.toFixed(2)),
            grossMargin: parseFloat(grossMargin.toFixed(1)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            netMargin: parseFloat(netMargin.toFixed(1))
        };
    }

    function calculateCategoryBreakdown(orders) {
        const categories = {};
        
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
        return Object.entries(categories)
            .map(([category, data]) => ({
                category,
                revenue: parseFloat(data.revenue.toFixed(2)),
                orderCount: data.orderCount
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    function calculateCustomerBreakdown(orders) {
        const customerTypes = {
            retailer: { count: 0, orders: 0 },
            wholesaler: { count: 0, orders: 0 },
            personal: { count: 0, orders: 0 },
            corporate: { count: 0, orders: 0 }
        };
        
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

    // ========================================================
    // UI UPDATE FUNCTIONS
    // ========================================================
    function updateFinancialModal(data) {
        console.log('[SalesAnalytics] Updating modal with financial data');
        
        try {
            if (!data || !financialModal) return;
            
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
            
            console.log('[SalesAnalytics] Modal updated successfully');
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to update modal:', error);
        }
    }

    function updateCategoryBreakdown(categories) {
        const container = document.getElementById('category-breakdown');
        if (!container) return;
        
        if (categories.length === 0) {
            container.innerHTML = '<div class="no-data">No category data available</div>';
            return;
        }
        
        const html = categories.map(item => `
            <div class="breakdown-item">
                <span class="breakdown-label">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                <span class="breakdown-value">${formatCurrency(item.revenue)}</span>
                <span class="breakdown-count">(${item.orderCount} orders)</span>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    function updateCustomerBreakdown(customerData) {
        const container = document.getElementById('customer-breakdown');
        if (!container) return;
        
        const types = [
            { key: 'retailer', label: 'Retailer' },
            { key: 'wholesaler', label: 'Wholesale' },
            { key: 'personal', label: 'Personal' },
            { key: 'corporate', label: 'Corporate' }
        ];
        
        const html = types.map(type => {
            const data = customerData[type.key] || { percentage: 0, customerCount: 0, orderCount: 0 };
            return `
                <div class="customer-type-item">
                    <span class="customer-label">${type.label}</span>
                    <div class="customer-stats">
                        <span class="customer-percentage">${data.percentage}%</span>
                        <span class="customer-count">${data.customerCount} customers</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const wrapper = document.createElement('div');
        wrapper.className = 'customer-type-row';
        wrapper.innerHTML = html;
        
        container.innerHTML = '';
        container.appendChild(wrapper);
    }

    function formatCurrency(amount) {
        return `${CONFIG.CURRENCY}${parseFloat(amount).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // ========================================================
    // UTILITY FUNCTIONS
    // ========================================================
    function getCurrentMonth() {
        const now = new Date();
        return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
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
        console.log('[SalesAnalytics] Setting up modal event handlers');
        
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
                    loadFinancialData();
                });
            }
            
            // Action buttons
            const detailedProfitsBtn = document.getElementById('detailed-profits-btn');
            if (detailedProfitsBtn) {
                detailedProfitsBtn.onclick = function() {
                    console.log('[SalesAnalytics] Detailed profits button clicked');
                    alert('Detailed Profits modal will be implemented next');
                };
            }
            
            const shippingAnalysisBtn = document.getElementById('shipping-analysis-btn');
            if (shippingAnalysisBtn) {
                shippingAnalysisBtn.onclick = function() {
                    console.log('[SalesAnalytics] Shipping analysis button clicked');
                    alert('Shipping Analysis modal will be implemented next');
                };
            }
            
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.onclick = loadFinancialData;
            }
            
            // Close modal when clicking outside
            financialModal.addEventListener('click', function(e) {
                if (e.target === financialModal) {
                    closeFinancialModal();
                }
            });
            
            // Close with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && financialModal.style.display === 'flex') {
                    closeFinancialModal();
                }
            });
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to setup modal events:', error);
        }
    }

    function setupPeriodSelector() {
        // Set default value
        const selector = document.getElementById('period-selector');
        if (selector) {
            selector.value = 'current-month';
        }
    }

    // ========================================================
    // MODAL CONTROL FUNCTIONS
    // ========================================================
    function showFinancialSummary() {
        console.log('[SalesAnalytics] Showing financial summary modal');
        
        try {
            if (!financialModal) {
                createFinancialModal();
            }
            
            financialModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Load initial data
            loadFinancialData();
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to show financial modal:', error);
        }
    }

    function closeFinancialModal() {
        console.log('[SalesAnalytics] Closing financial modal');
        
        try {
            if (financialModal) {
                financialModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('[SalesAnalytics] Failed to close financial modal:', error);
        }
    }

    function loadFinancialData() {
        console.log('[SalesAnalytics] Loading financial data');
        
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                refreshBtn.disabled = true;
            }
            
            // Calculate data
            const data = calculateFinancialData(currentPeriod);
            
            // Update UI
            updateFinancialModal(data);
            
            // Reset button
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
                refreshBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('[SalesAnalytics] Failed to load financial data:', error);
            
            // Reset button on error
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
                refreshBtn.disabled = false;
            }
        }
    }

    function getFinancialData() {
        return financialData;
    }

    // ========================================================
    // PUBLIC API
    // ========================================================
    return {
        init,
        showFinancialSummary,
        getFinancialData,
        calculateFinancialData // Exported for testing
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SalesAnalytics.init();
    });
} else {
    SalesAnalytics.init();
}

console.log('[SalesAnalytics] Module definition complete');


// ========================================================
// MODAL 2: PROFIT MARGIN INTELLIGENCE
// ========================================================
function createProfitMarginModal() {
    console.log('[SalesAnalytics] Creating profit margin intelligence modal');
    
    try {
        // Remove existing modal if present
        const existingModal = document.getElementById('profit-margin-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal container (reusing same structure as Modal 1)
        const profitModal = document.createElement('div');
        profitModal.id = 'profit-margin-modal';
        profitModal.className = 'financial-summary-modal';
        
        profitModal.innerHTML = `
            <div class="financial-modal-content">
                <!-- Header -->
                <div class="financial-modal-header">
                    <div class="financial-header-title">
                        <i class="fas fa-chart-pie"></i>
                        <h2>Profit Margin Intelligence</h2>
                    </div>
                    <button id="close-profit-modal" class="financial-modal-close">&times;</button>
                </div>
                
                <!-- Period Display (sync with Modal 1) -->
                <div class="financial-period-selector">
                    <div class="period-display">
                        <span id="profit-period-text">December 2024</span>
                        <span class="order-count" id="profit-order-count">(20 orders)</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--border-medium); margin-top: 4px;">
                        <i class="fas fa-sync-alt"></i> Synced with Financial Summary
                    </div>
                </div>
                
                <!-- View Selector -->
                <div class="view-selector-row">
                    <div class="view-tabs">
                        <button class="view-tab active" data-view="margin-overview">
                            <i class="fas fa-chart-line"></i>
                            Margin Overview
                        </button>
                        <button class="view-tab" data-view="category-breakdown">
                            <i class="fas fa-boxes"></i>
                            Category Profitability
                        </button>
                        <button class="view-tab" data-view="top-products">
                            <i class="fas fa-star"></i>
                            Top Products
                        </button>
                        <button class="view-tab" data-view="insights">
                            <i class="fas fa-lightbulb"></i>
                            Insights
                        </button>
                    </div>
                    
                    <div class="customer-filter">
                        <select id="customer-type-filter" class="filter-dropdown">
                            <option value="all">All Customers</option>
                            <option value="wholesaler">Wholesale Only</option>
                            <option value="retailer">Retail Only</option>
                            <option value="personal">Personal Only</option>
                            <option value="corporate">Corporate Only</option>
                        </select>
                    </div>
                </div>
                
                <!-- Main Content Container -->
                <div class="profit-metrics-container">
                    <!-- Margin Overview (Default View) -->
                    <div id="margin-overview-view" class="profit-view active-view">
                        <div class="margin-overview-header">
                            <h3><i class="fas fa-balance-scale"></i> Margin Comparison</h3>
                            <div class="view-description">
                                Theoretical vs actual profit margins across price tiers
                            </div>
                        </div>
                        
                        <div class="margin-cards-grid">
                            <!-- Wholesale Margins -->
                            <div class="margin-card wholesale-card">
                                <div class="margin-card-header">
                                    <i class="fas fa-industry"></i>
                                    <h4>Wholesale Margins</h4>
                                </div>
                                <div class="margin-metrics">
                                    <div class="margin-metric">
                                        <span class="margin-label">Average Margin</span>
                                        <span class="margin-value" id="wholesale-avg-margin">65%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Highest Margin</span>
                                        <span class="margin-value" id="wholesale-high-margin">78%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Lowest Margin</span>
                                        <span class="margin-value" id="wholesale-low-margin">40%</span>
                                    </div>
                                </div>
                                <div class="margin-note">
                                    Based on wholesale price vs retail price
                                </div>
                            </div>
                            
                            <!-- Retail Margins -->
                            <div class="margin-card retail-card">
                                <div class="margin-card-header">
                                    <i class="fas fa-store"></i>
                                    <h4>Retail Margins</h4>
                                </div>
                                <div class="margin-metrics">
                                    <div class="margin-metric">
                                        <span class="margin-label">Average Margin</span>
                                        <span class="margin-value" id="retail-avg-margin">45%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Highest Margin</span>
                                        <span class="margin-value" id="retail-high-margin">60%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Lowest Margin</span>
                                        <span class="margin-value" id="retail-low-margin">30%</span>
                                    </div>
                                </div>
                                <div class="margin-note">
                                    Standard retail pricing margins
                                </div>
                            </div>
                            
                            <!-- Actual Margins -->
                            <div class="margin-card actual-card">
                                <div class="margin-card-header">
                                    <i class="fas fa-chart-line"></i>
                                    <h4>Actual Margins</h4>
                                </div>
                                <div class="margin-metrics">
                                    <div class="margin-metric">
                                        <span class="margin-label">Average Margin</span>
                                        <span class="margin-value" id="actual-avg-margin">52%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Highest Margin</span>
                                        <span class="margin-value" id="actual-high-margin">68%</span>
                                    </div>
                                    <div class="margin-metric">
                                        <span class="margin-label">Lowest Margin</span>
                                        <span class="margin-value" id="actual-low-margin">35%</span>
                                    </div>
                                </div>
                                <div class="margin-note">
                                    Actual achieved from mixed orders
                                </div>
                            </div>
                        </div>
                        
                        <div class="margin-summary">
                            <div class="summary-item">
                                <i class="fas fa-arrow-up success-icon"></i>
                                <span class="summary-label">Best Performing Tier:</span>
                                <span class="summary-value" id="best-tier">Wholesale (65%)</span>
                            </div>
                            <div class="summary-item">
                                <i class="fas fa-exclamation-triangle warning-icon"></i>
                                <span class="summary-label">Margin Opportunity:</span>
                                <span class="summary-value" id="margin-opportunity">+13% potential</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Category Profitability View -->
                    <div id="category-breakdown-view" class="profit-view">
                        <div class="profit-view-header">
                            <h3><i class="fas fa-boxes"></i> Category Profitability</h3>
                            <div class="view-description">
                                Profit analysis by product category
                            </div>
                        </div>
                        
                        <div class="category-profit-table-container">
                            <table class="profit-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Units Sold</th>
                                        <th>Revenue</th>
                                        <th>Cost</th>
                                        <th>Profit</th>
                                        <th>Margin</th>
                                    </tr>
                                </thead>
                                <tbody id="category-profit-table">
                                    <!-- Dynamic content will be inserted here -->
                                    <tr>
                                        <td colspan="6" class="loading-row">
                                            <i class="fas fa-spinner fa-spin"></i> Loading category data...
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot id="category-totals-row">
                                    <!-- Totals row will be inserted here -->
                                </tfoot>
                            </table>
                        </div>
                        
                        <div class="category-insights">
                            <div class="insight-card best-category">
                                <div class="insight-header">
                                    <i class="fas fa-trophy"></i>
                                    <h4>Best Category</h4>
                                </div>
                                <div class="insight-content">
                                    <div class="insight-category" id="best-category-name">Perfumes</div>
                                    <div class="insight-metric" id="best-category-metric">60% margin</div>
                                    <div class="insight-detail" id="best-cetail-detail">42 units sold</div>
                                </div>
                            </div>
                            
                            <div class="insight-card restock-alert">
                                <div class="insight-header">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <h4>Restock Priority</h4>
                                </div>
                                <div class="insight-content">
                                    <div class="insight-category" id="restock-category">Skincare</div>
                                    <div class="insight-metric" id="restock-metric">10 units left</div>
                                    <div class="insight-detail" id="restock-detail">High margin, low stock</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Top Products View -->
                    <div id="top-products-view" class="profit-view">
                        <div class="profit-view-header">
                            <h3><i class="fas fa-star"></i> Top Products by Profit</h3>
                            <div class="view-description">
                                Most profitable products based on actual sales
                            </div>
                        </div>
                        
                        <div class="top-products-controls">
                            <div class="sort-controls">
                                <span class="sort-label">Sort by:</span>
                                <button class="sort-btn active" data-sort="profit">Highest Profit</button>
                                <button class="sort-btn" data-sort="margin">Highest Margin</button>
                                <button class="sort-btn" data-sort="units">Most Units Sold</button>
                            </div>
                            <div class="limit-control">
                                <span class="limit-label">Show:</span>
                                <select id="products-limit" class="limit-select">
                                    <option value="5">Top 5</option>
                                    <option value="10" selected>Top 10</option>
                                    <option value="20">Top 20</option>
                                    <option value="all">All Products</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="top-products-table-container">
                            <table class="profit-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Units Sold</th>
                                        <th>Revenue</th>
                                        <th>Cost</th>
                                        <th>Profit</th>
                                        <th>Margin</th>
                                    </tr>
                                </thead>
                                <tbody id="top-products-table">
                                    <!-- Dynamic content will be inserted here -->
                                    <tr>
                                        <td colspan="6" class="loading-row">
                                            <i class="fas fa-spinner fa-spin"></i> Loading product data...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="profit-distribution">
                            <h4><i class="fas fa-chart-pie"></i> Profit Distribution</h4>
                            <div class="distribution-bars">
                                <div class="distribution-bar high-margin">
                                    <div class="bar-label">High Margin (>60%)</div>
                                    <div class="bar-container">
                                        <div class="bar-fill" style="width: 63%"></div>
                                        <span class="bar-value" id="high-margin-value">63%</span>
                                    </div>
                                </div>
                                <div class="distribution-bar medium-margin">
                                    <div class="bar-label">Medium (40-60%)</div>
                                    <div class="bar-container">
                                        <div class="bar-fill" style="width: 30%"></div>
                                        <span class="bar-value" id="medium-margin-value">30%</span>
                                    </div>
                                </div>
                                <div class="distribution-bar low-margin">
                                    <div class="bar-label">Low (<40%)</div>
                                    <div class="bar-container">
                                        <div class="bar-fill" style="width: 7%"></div>
                                        <span class="bar-value" id="low-margin-value">7%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Insights View -->
                    <div id="insights-view" class="profit-view">
                        <div class="profit-view-header">
                            <h3><i class="fas fa-lightbulb"></i> Actionable Insights</h3>
                            <div class="view-description">
                                Recommendations to improve profitability
                            </div>
                        </div>
                        
                        <div class="insights-grid">
                            <div class="insight-card-large">
                                <div class="insight-icon revenue-insight">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                                <div class="insight-content-large">
                                    <h4>Revenue Optimization</h4>
                                    <div class="insight-list">
                                        <div class="insight-item">
                                            <i class="fas fa-check-circle success-icon"></i>
                                            <span class="insight-text" id="revenue-opportunity-1">
                                                Increase prices on high-demand perfumes by 10%
                                            </span>
                                        </div>
                                        <div class="insight-item">
                                            <i class="fas fa-check-circle success-icon"></i>
                                            <span class="insight-text" id="revenue-opportunity-2">
                                                Bundle low-margin wigs with accessories
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="insight-card-large">
                                <div class="insight-icon cost-insight">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="insight-content-large">
                                    <h4>Cost Reduction</h4>
                                    <div class="insight-list">
                                        <div class="insight-item">
                                            <i class="fas fa-check-circle success-icon"></i>
                                            <span class="insight-text" id="cost-opportunity-1">
                                                Negotiate better wholesale prices for lashes
                                            </span>
                                        </div>
                                        <div class="insight-item">
                                            <i class="fas fa-check-circle success-icon"></i>
                                            <span class="insight-text" id="cost-opportunity-2">
                                                Reduce packaging costs by 5%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="insight-card-large">
                                <div class="insight-icon inventory-insight">
                                    <i class="fas fa-boxes"></i>
                                </div>
                                <div class="insight-content-large">
                                    <h4>Inventory Management</h4>
                                    <div class="insight-list">
                                        <div class="insight-item urgent">
                                            <i class="fas fa-exclamation-circle urgent-icon"></i>
                                            <span class="insight-text" id="inventory-alert-1">
                                                Restock skincare immediately (10 units left)
                                            </span>
                                        </div>
                                        <div class="insight-item">
                                            <i class="fas fa-clock warning-icon"></i>
                                            <span class="insight-text" id="inventory-alert-2">
                                                Reduce wigs inventory by 20%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="key-metrics-summary">
                            <h4>Key Performance Metrics</h4>
                            <div class="metrics-grid">
                                <div class="key-metric">
                                    <div class="metric-icon">
                                        <i class="fas fa-percentage"></i>
                                    </div>
                                    <div class="metric-content">
                                        <div class="metric-label">Overall Profit Margin</div>
                                        <div class="metric-value" id="overall-margin">52%</div>
                                        <div class="metric-change positive">+3% vs target</div>
                                    </div>
                                </div>
                                
                                <div class="key-metric">
                                    <div class="metric-icon">
                                        <i class="fas fa-box"></i>
                                    </div>
                                    <div class="metric-content">
                                        <div class="metric-label">Inventory Turnover</div>
                                        <div class="metric-value" id="inventory-turnover">2.4x</div>
                                        <div class="metric-change negative">-0.2x vs last period</div>
                                    </div>
                                </div>
                                
                                <div class="key-metric">
                                    <div class="metric-icon">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="metric-content">
                                        <div class="metric-label">Best Product</div>
                                        <div class="metric-value" id="best-product">Luxury Perfume</div>
                                        <div class="metric-detail">R3,125 profit</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="profit-actions">
                    <button id="export-profit-data" class="action-btn export-btn">
                        <i class="fas fa-file-export"></i>
                        Export to Excel
                    </button>
                    <button id="set-margin-alerts" class="action-btn alert-btn">
                        <i class="fas fa-bell"></i>
                        Set Margin Alerts
                    </button>
                    <button id="compare-periods-btn" class="action-btn compare-btn">
                        <i class="fas fa-chart-bar"></i>
                        Compare Periods
                    </button>
                    <button id="refresh-profit-data" class="action-btn refresh-btn">
                        <i class="fas fa-sync-alt"></i>
                        Refresh Data
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(profitModal);
        setupProfitModalEvents();
        console.log('[SalesAnalytics] Profit margin modal created');
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to create profit margin modal:', error);
    }
}

// ========================================================
// CALCULATION FUNCTIONS FOR MODAL 2
// ========================================================
function calculateProfitMarginData(period = currentPeriod, customerType = 'all') {
    console.log('[SalesAnalytics] Calculating profit margin data for period:', period);
    
    try {
        if (typeof OrdersManager === 'undefined' || typeof ProductsManager === 'undefined') {
            console.error('[SalesAnalytics] Required managers not available');
            return getEmptyProfitData();
        }
        
        // Get filtered orders (same as Modal 1)
        const allOrders = OrdersManager.getOrders('shipped');
        const filteredOrders = filterOrdersByPeriod(allOrders, period);
        
        // Filter by customer type if specified
        let customerFilteredOrders = filteredOrders;
        if (customerType !== 'all') {
            customerFilteredOrders = filteredOrders.filter(order => order.customerType === customerType);
        }
        
        // Get all products
        const allProducts = ProductsManager.getProducts();
        
        if (customerFilteredOrders.length === 0 || allProducts.length === 0) {
            console.log('[SalesAnalytics] No data for profit analysis');
            return getEmptyProfitData();
        }
        
        // Calculate metrics
        const marginData = calculateMarginMetrics(customerFilteredOrders, allProducts);
        const categoryData = calculateCategoryProfitability(customerFilteredOrders, allProducts);
        const productData = calculateProductProfitability(customerFilteredOrders, allProducts);
        const insights = generateProfitInsights(marginData, categoryData, productData);
        
        const profitData = {
            period: period,
            periodText: getPeriodText(period),
            totalOrders: customerFilteredOrders.length,
            customerType: customerType,
            marginData: marginData,
            categoryData: categoryData,
            productData: productData,
            insights: insights,
            calculatedAt: new Date().toISOString()
        };
        
        console.log('[SalesAnalytics] Profit margin data calculated:', profitData);
        return profitData;
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to calculate profit margin data:', error);
        return getEmptyProfitData();
    }
}

function calculateMarginMetrics(orders, products) {
    const marginData = {
        wholesale: { avg: 0, high: 0, low: 100, count: 0 },
        retail: { avg: 0, high: 0, low: 100, count: 0 },
        actual: { avg: 0, high: 0, low: 100, count: 0 }
    };
    
    // Calculate theoretical wholesale margins (product level)
    products.forEach(product => {
        if (product.retailPrice > 0 && product.wholesalePrice > 0) {
            const margin = ((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100;
            
            marginData.wholesale.avg += margin;
            marginData.wholesale.high = Math.max(marginData.wholesale.high, margin);
            marginData.wholesale.low = Math.min(marginData.wholesale.low, margin);
            marginData.wholesale.count++;
        }
    });
    
    if (marginData.wholesale.count > 0) {
        marginData.wholesale.avg /= marginData.wholesale.count;
    }
    
    // Calculate actual margins from orders
    let totalActualMargin = 0;
    let actualMarginCount = 0;
    let actualMarginHigh = 0;
    let actualMarginLow = 100;
    
    orders.forEach(order => {
        if (order.items && order.subtotal > 0) {
            // Calculate wholesale cost for this order
            let wholesaleCost = 0;
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const unitCost = product.wholesalePrice || 0;
                    wholesaleCost += unitCost * (item.quantity || 1);
                }
            });
            
            if (wholesaleCost > 0) {
                const margin = ((order.subtotal - wholesaleCost) / order.subtotal) * 100;
                totalActualMargin += margin;
                actualMarginCount++;
                actualMarginHigh = Math.max(actualMarginHigh, margin);
                actualMarginLow = Math.min(actualMarginLow, margin);
            }
        }
    });
    
    marginData.actual.avg = actualMarginCount > 0 ? totalActualMargin / actualMarginCount : 0;
    marginData.actual.high = actualMarginHigh;
    marginData.actual.low = actualMarginLow > 99 ? 0 : actualMarginLow; // Handle default
    
    // Retail margins are typically lower than wholesale
    marginData.retail.avg = marginData.wholesale.avg * 0.7; // Simplified
    marginData.retail.high = marginData.wholesale.high * 0.8;
    marginData.retail.low = marginData.wholesale.low * 0.6;
    
    // Round all values
    Object.keys(marginData).forEach(key => {
        marginData[key].avg = parseFloat(marginData[key].avg.toFixed(1));
        marginData[key].high = parseFloat(marginData[key].high.toFixed(1));
        marginData[key].low = parseFloat(marginData[key].low.toFixed(1));
    });
    
    return marginData;
}

function calculateCategoryProfitability(orders, products) {
    const categoryData = {};
    
    // Initialize categories from products
    products.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!categoryData[category]) {
            categoryData[category] = {
                unitsSold: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                margin: 0
            };
        }
    });
    
    // Process orders to calculate actual sales
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const category = product.category || 'Uncategorized';
                    const quantity = item.quantity || 1;
                    const revenue = (item.price || 0) * quantity;
                    const cost = (product.wholesalePrice || 0) * quantity;
                    const profit = revenue - cost;
                    
                    categoryData[category].unitsSold += quantity;
                    categoryData[category].revenue += revenue;
                    categoryData[category].cost += cost;
                    categoryData[category].profit += profit;
                }
            });
        }
    });
    
    // Calculate margins and round values
    Object.keys(categoryData).forEach(category => {
        const data = categoryData[category];
        if (data.revenue > 0) {
            data.margin = (data.profit / data.revenue) * 100;
        }
        
        // Round all values
        data.unitsSold = Math.round(data.unitsSold);
        data.revenue = parseFloat(data.revenue.toFixed(2));
        data.cost = parseFloat(data.cost.toFixed(2));
        data.profit = parseFloat(data.profit.toFixed(2));
        data.margin = parseFloat(data.margin.toFixed(1));
    });
    
    // Convert to array and sort by profit
    return Object.entries(categoryData)
        .map(([category, data]) => ({
            category,
            ...data
        }))
        .sort((a, b) => b.profit - a.profit);
}

function calculateProductProfitability(orders, products) {
    const productMap = {};
    
    // Initialize product data with current info
    products.forEach(product => {
        productMap[product.id] = {
            id: product.id,
            name: product.name,
            category: product.category,
            wholesalePrice: product.wholesalePrice || 0,
            currentPrice: product.currentPrice || 0,
            stock: product.stock || 0,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0
        };
    });
    
    // Process orders to calculate actual sales
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const productId = item.productId;
                if (productMap[productId]) {
                    const quantity = item.quantity || 1;
                    const revenue = (item.price || 0) * quantity;
                    const cost = (productMap[productId].wholesalePrice || 0) * quantity;
                    const profit = revenue - cost;
                    
                    productMap[productId].unitsSold += quantity;
                    productMap[productId].revenue += revenue;
                    productMap[productId].cost += cost;
                    productMap[productId].profit += profit;
                }
            });
        }
    });
    
    // Calculate margins and filter out products with no sales
    const productData = Object.values(productMap)
        .filter(product => product.unitsSold > 0)
        .map(product => {
            if (product.revenue > 0) {
                product.margin = (product.profit / product.revenue) * 100;
            }
            
            // Round values
            product.unitsSold = Math.round(product.unitsSold);
            product.revenue = parseFloat(product.revenue.toFixed(2));
            product.cost = parseFloat(product.cost.toFixed(2));
            product.profit = parseFloat(product.profit.toFixed(2));
            product.margin = parseFloat(product.margin.toFixed(1));
            
            return product;
        })
        .sort((a, b) => b.profit - a.profit);
    
    return productData;
}

function generateProfitInsights(marginData, categoryData, productData) {
    const insights = {
        bestCategory: null,
        restockPriority: null,
        bestProduct: null,
        marginDistribution: { high: 0, medium: 0, low: 0 },
        revenueOpportunities: [],
        costOpportunities: [],
        inventoryAlerts: []
    };
    
    // Find best category
    if (categoryData.length > 0) {
        insights.bestCategory = {
            name: categoryData[0].category,
            margin: categoryData[0].margin,
            units: categoryData[0].unitsSold
        };
    }
    
    // Find product with lowest stock and decent margin for restock
    const lowStockProducts = productData
        .filter(p => p.stock < 10 && p.margin > 40)
        .sort((a, b) => a.stock - b.stock);
    
    if (lowStockProducts.length > 0) {
        insights.restockPriority = {
            name: lowStockProducts[0].name,
            stock: lowStockProducts[0].stock,
            margin: lowStockProducts[0].margin
        };
    }
    
    // Find best product
    if (productData.length > 0) {
        insights.bestProduct = {
            name: productData[0].name,
            profit: productData[0].profit,
            margin: productData[0].margin
        };
    }
    
    // Calculate margin distribution
    productData.forEach(product => {
        if (product.margin > 60) insights.marginDistribution.high++;
        else if (product.margin >= 40) insights.marginDistribution.medium++;
        else insights.marginDistribution.low++;
    });
    
    const total = productData.length;
    if (total > 0) {
        insights.marginDistribution.high = Math.round((insights.marginDistribution.high / total) * 100);
        insights.marginDistribution.medium = Math.round((insights.marginDistribution.medium / total) * 100);
        insights.marginDistribution.low = Math.round((insights.marginDistribution.low / total) * 100);
    }
    
    // Generate recommendations
    if (marginData.wholesale.avg > marginData.actual.avg + 5) {
        insights.revenueOpportunities.push('Increase wholesale customer conversion by 15%');
    }
    
    if (categoryData.some(cat => cat.margin < 30)) {
        const lowMarginCat = categoryData.find(cat => cat.margin < 30);
        insights.costOpportunities.push(`Review ${lowMarginCat?.category} wholesale pricing`);
    }
    
    if (lowStockProducts.length > 0) {
        insights.inventoryAlerts.push(`Restock ${lowStockProducts[0].name} (${lowStockProducts[0].stock} units left)`);
    }
    
    return insights;
}

function getEmptyProfitData() {
    return {
        period: currentPeriod,
        periodText: getPeriodText(currentPeriod),
        totalOrders: 0,
        customerType: 'all',
        marginData: {
            wholesale: { avg: 0, high: 0, low: 0, count: 0 },
            retail: { avg: 0, high: 0, low: 0, count: 0 },
            actual: { avg: 0, high: 0, low: 0, count: 0 }
        },
        categoryData: [],
        productData: [],
        insights: {
            bestCategory: null,
            restockPriority: null,
            bestProduct: null,
            marginDistribution: { high: 0, medium: 0, low: 0 },
            revenueOpportunities: [],
            costOpportunities: [],
            inventoryAlerts: []
        }
    };
}

// ========================================================
// UI UPDATE FUNCTIONS FOR MODAL 2
// ========================================================
function updateProfitModal(data) {
    console.log('[SalesAnalytics] Updating profit modal with data');
    
    try {
        if (!data) return;
        
        // Update period display
        const periodText = document.getElementById('profit-period-text');
        const orderCount = document.getElementById('profit-order-count');
        
        if (periodText) periodText.textContent = data.periodText;
        if (orderCount) orderCount.textContent = `(${data.totalOrders} orders)`;
        
        // Update margin overview
        updateMarginOverview(data.marginData);
        
        // Update category profitability
        updateCategoryProfitability(data.categoryData);
        
        // Update top products
        updateTopProducts(data.productData);
        
        // Update insights
        updateProfitInsights(data.insights, data.categoryData, data.productData);
        
        console.log('[SalesAnalytics] Profit modal updated successfully');
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to update profit modal:', error);
    }
}

function updateMarginOverview(marginData) {
    // Wholesale margins
    document.getElementById('wholesale-avg-margin').textContent = `${marginData.wholesale.avg}%`;
    document.getElementById('wholesale-high-margin').textContent = `${marginData.wholesale.high}%`;
    document.getElementById('wholesale-low-margin').textContent = `${marginData.wholesale.low}%`;
    
    // Retail margins
    document.getElementById('retail-avg-margin').textContent = `${marginData.retail.avg}%`;
    document.getElementById('retail-high-margin').textContent = `${marginData.retail.high}%`;
    document.getElementById('retail-low-margin').textContent = `${marginData.retail.low}%`;
    
    // Actual margins
    document.getElementById('actual-avg-margin').textContent = `${marginData.actual.avg}%`;
    document.getElementById('actual-high-margin').textContent = `${marginData.actual.high}%`;
    document.getElementById('actual-low-margin').textContent = `${marginData.actual.low}%`;
    
    // Summary
    const bestTier = marginData.actual.avg > marginData.wholesale.avg ? 'Actual' : 'Wholesale';
    const bestValue = Math.max(marginData.actual.avg, marginData.wholesale.avg, marginData.retail.avg);
    const opportunity = marginData.wholesale.avg - marginData.actual.avg;
    
    document.getElementById('best-tier').textContent = 
        `${bestTier} (${bestValue}%)`;
    document.getElementById('margin-opportunity').textContent = 
        `+${Math.max(0, opportunity.toFixed(1))}% potential`;
}

function updateCategoryProfitability(categoryData) {
    const tableBody = document.getElementById('category-profit-table');
    const totalsRow = document.getElementById('category-totals-row');
    
    if (!tableBody) return;
    
    if (categoryData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-row">
                    <i class="fas fa-chart-bar"></i>
                    No category data available
                </td>
            </tr>
        `;
        totalsRow.innerHTML = '';
        return;
    }
    
    let html = '';
    let totalUnits = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    
    categoryData.forEach(item => {
        totalUnits += item.unitsSold;
        totalRevenue += item.revenue;
        totalCost += item.cost;
        totalProfit += item.profit;
        
        html += `
            <tr>
                <td><span class="category-name">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span></td>
                <td>${item.unitsSold}</td>
                <td>${formatCurrency(item.revenue)}</td>
                <td>${formatCurrency(item.cost)}</td>
                <td><span class="profit-value">${formatCurrency(item.profit)}</span></td>
                <td><span class="margin-badge margin-${getMarginTier(item.margin)}">${item.margin}%</span></td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Update totals row
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    totalsRow.innerHTML = `
        <tr class="totals-row">
            <td><strong>Totals</strong></td>
            <td><strong>${totalUnits}</strong></td>
            <td><strong>${formatCurrency(totalRevenue)}</strong></td>
            <td><strong>${formatCurrency(totalCost)}</strong></td>
            <td><strong class="total-profit">${formatCurrency(totalProfit)}</strong></td>
            <td><strong class="total-margin margin-${getMarginTier(avgMargin)}">${avgMargin.toFixed(1)}%</strong></td>
        </tr>
    `;
    
    // Update insights cards
    if (categoryData.length > 0) {
        const bestCat = categoryData[0];
        const lowStockCat = categoryData.find(cat => cat.unitsSold > 0 && cat.revenue > 0) || bestCat;
        
        document.getElementById('best-category-name').textContent = 
            bestCat.category.charAt(0).toUpperCase() + bestCat.category.slice(1);
        document.getElementById('best-category-metric').textContent = 
            `${bestCat.margin}% margin`;
        document.getElementById('best-cetail-detail').textContent = 
            `${bestCat.unitsSold} units sold`;
            
        document.getElementById('restock-category').textContent = 
            lowStockCat.category.charAt(0).toUpperCase() + lowStockCat.category.slice(1);
        document.getElementById('restock-metric').textContent = 
            `${lowStockCat.unitsSold} units sold`;
        document.getElementById('restock-detail').textContent = 
            `${lowStockCat.margin}% margin`;
    }
}

function updateTopProducts(productData) {
    const tableBody = document.getElementById('top-products-table');
    if (!tableBody) return;
    
    // Get current limit
    const limitSelect = document.getElementById('products-limit');
    const limit = limitSelect ? parseInt(limitSelect.value) : 10;
    
    // Get current sort
    const activeSortBtn = document.querySelector('.sort-btn.active');
    const sortBy = activeSortBtn ? activeSortBtn.dataset.sort : 'profit';
    
    // Sort data
    let sortedData = [...productData];
    switch(sortBy) {
        case 'margin':
            sortedData.sort((a, b) => b.margin - a.margin);
            break;
        case 'units':
            sortedData.sort((a, b) => b.unitsSold - a.unitsSold);
            break;
        case 'profit':
        default:
            sortedData.sort((a, b) => b.profit - a.profit);
            break;
    }
    
    // Apply limit
    if (limit !== 'all' && !isNaN(limit)) {
        sortedData = sortedData.slice(0, limit);
    }
    
    if (sortedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-row">
                    <i class="fas fa-box-open"></i>
                    No product sales data available
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    sortedData.forEach(product => {
        html += `
            <tr>
                <td>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category || 'Uncategorized'}</div>
                    </div>
                </td>
                <td>${product.unitsSold}</td>
                <td>${formatCurrency(product.revenue)}</td>
                <td>${formatCurrency(product.cost)}</td>
                <td><span class="profit-value">${formatCurrency(product.profit)}</span></td>
                <td><span class="margin-badge margin-${getMarginTier(product.margin)}">${product.margin}%</span></td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Update margin distribution
    updateMarginDistribution(productData);
}

function updateMarginDistribution(productData) {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    productData.forEach(product => {
        if (product.margin > 60) distribution.high++;
        else if (product.margin >= 40) distribution.medium++;
        else distribution.low++;
    });
    
    const total = productData.length;
    if (total > 0) {
        const highPercent = Math.round((distribution.high / total) * 100);
        const mediumPercent = Math.round((distribution.medium / total) * 100);
        const lowPercent = Math.round((distribution.low / total) * 100);
        
        document.getElementById('high-margin-value').textContent = `${highPercent}%`;
        document.getElementById('medium-margin-value').textContent = `${mediumPercent}%`;
        document.getElementById('low-margin-value').textContent = `${lowPercent}%`;
        
        // Update bar widths
        document.querySelector('.distribution-bar.high-margin .bar-fill').style.width = `${highPercent}%`;
        document.querySelector('.distribution-bar.medium-margin .bar-fill').style.width = `${mediumPercent}%`;
        document.querySelector('.distribution-bar.low-margin .bar-fill').style.width = `${lowPercent}%`;
    }
}

function updateProfitInsights(insights, categoryData, productData) {
    // Update overall margin
    const overallMargin = categoryData.reduce((sum, cat) => sum + cat.margin, 0) / (categoryData.length || 1);
    document.getElementById('overall-margin').textContent = `${overallMargin.toFixed(1)}%`;
    
    // Update inventory turnover (simplified calculation)
    const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.revenue, 0);
    const avgInventory = productData.reduce((sum, prod) => sum + (prod.stock * prod.wholesalePrice), 0) / (productData.length || 1);
    const turnover = avgInventory > 0 ? totalRevenue / avgInventory : 0;
    document.getElementById('inventory-turnover').textContent = `${turnover.toFixed(1)}x`;
    
    // Update best product
    if (insights.bestProduct) {
        document.getElementById('best-product').textContent = insights.bestProduct.name;
    }
    
    // Update insight texts
    if (insights.revenueOpportunities.length > 0) {
        document.getElementById('revenue-opportunity-1').textContent = insights.revenueOpportunities[0];
    }
    
    if (insights.costOpportunities.length > 0) {
        document.getElementById('cost-opportunity-1').textContent = insights.costOpportunities[0];
    }
    
    if (insights.inventoryAlerts.length > 0) {
        document.getElementById('inventory-alert-1').textContent = insights.inventoryAlerts[0];
    }
}

// Helper function to get margin tier for styling
function getMarginTier(margin) {
    if (margin > 60) return 'high';
    if (margin >= 40) return 'medium';
    return 'low';
}

// ========================================================
// MODAL 2 EVENT HANDLERS
// ========================================================
function setupProfitModalEvents() {
    console.log('[SalesAnalytics] Setting up profit modal event handlers');
    
    try {
        // Close button
        const closeBtn = document.getElementById('close-profit-modal');
        if (closeBtn) {
            closeBtn.onclick = closeProfitModal;
        }
        
        // View tabs
        const viewTabs = document.querySelectorAll('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const view = this.dataset.view;
                switchProfitView(view);
                
                // Update active tab
                viewTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Customer type filter
        const customerFilter = document.getElementById('customer-type-filter');
        if (customerFilter) {
            customerFilter.addEventListener('change', function() {
                loadProfitData();
            });
        }
        
        // Sort buttons in top products view
        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                sortButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateTopProductsDisplay();
            });
        });
        
        // Products limit selector
        const productsLimit = document.getElementById('products-limit');
        if (productsLimit) {
            productsLimit.addEventListener('change', updateTopProductsDisplay);
        }
        
        // Action buttons
        const exportBtn = document.getElementById('export-profit-data');
        if (exportBtn) {
            exportBtn.onclick = function() {
                console.log('[SalesAnalytics] Export profit data clicked');
                alert('Export functionality will be implemented in next phase');
            };
        }
        
        const alertsBtn = document.getElementById('set-margin-alerts');
        if (alertsBtn) {
            alertsBtn.onclick = function() {
                console.log('[SalesAnalytics] Set margin alerts clicked');
                alert('Margin alert functionality will be implemented in next phase');
            };
        }
        
        const compareBtn = document.getElementById('compare-periods-btn');
        if (compareBtn) {
            compareBtn.onclick = function() {
                console.log('[SalesAnalytics] Compare periods clicked');
                alert('Period comparison will be implemented in next phase');
            };
        }
        
        const refreshBtn = document.getElementById('refresh-profit-data');
        if (refreshBtn) {
            refreshBtn.onclick = loadProfitData;
        }
        
        // Close modal when clicking outside
        const profitModal = document.getElementById('profit-margin-modal');
        if (profitModal) {
            profitModal.addEventListener('click', function(e) {
                if (e.target === profitModal) {
                    closeProfitModal();
                }
            });
        }
        
        // Close with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && profitModal.style.display === 'flex') {
                closeProfitModal();
            }
        });
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to setup profit modal events:', error);
    }
}

function switchProfitView(view) {
    const views = document.querySelectorAll('.profit-view');
    views.forEach(v => v.classList.remove('active-view'));
    
    const activeView = document.getElementById(`${view}-view`);
    if (activeView) {
        activeView.classList.add('active-view');
    }
}

function updateTopProductsDisplay() {
    const profitData = calculateProfitMarginData(
        currentPeriod,
        document.getElementById('customer-type-filter')?.value || 'all'
    );
    updateTopProducts(profitData.productData);
}

// ========================================================
// MODAL 2 CONTROL FUNCTIONS
// ========================================================
function showProfitMarginAnalysis() {
    console.log('[SalesAnalytics] Showing profit margin analysis modal');
    
    try {
        // Create modal if it doesn't exist
        if (!document.getElementById('profit-margin-modal')) {
            createProfitMarginModal();
        }
        
        const profitModal = document.getElementById('profit-margin-modal');
        profitModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Load data
        loadProfitData();
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to show profit modal:', error);
    }
}

function closeProfitModal() {
    console.log('[SalesAnalytics] Closing profit margin modal');
    
    try {
        const profitModal = document.getElementById('profit-margin-modal');
        if (profitModal) {
            profitModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    } catch (error) {
        console.error('[SalesAnalytics] Failed to close profit modal:', error);
    }
}

function loadProfitData() {
    console.log('[SalesAnalytics] Loading profit margin data');
    
    try {
        const refreshBtn = document.getElementById('refresh-profit-data');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            refreshBtn.disabled = true;
        }
        
        // Get current filters
        const customerFilter = document.getElementById('customer-type-filter');
        const customerType = customerFilter ? customerFilter.value : 'all';
        
        // Calculate data
        const data = calculateProfitMarginData(currentPeriod, customerType);
        
        // Update UI
        updateProfitModal(data);
        
        // Reset button
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
            refreshBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('[SalesAnalytics] Failed to load profit data:', error);
        
        const refreshBtn = document.getElementById('refresh-profit-data');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
            refreshBtn.disabled = false;
        }
    }
}

// ========================================================
// UPDATE PUBLIC API
// ========================================================
// In your return statement, add:
return {
    init,
    showFinancialSummary,
    showProfitMarginAnalysis,  // Add this line
    getFinancialData,
    calculateFinancialData
};

