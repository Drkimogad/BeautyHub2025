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
