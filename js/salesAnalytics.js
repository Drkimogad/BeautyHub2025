// ========================================================
// salesAnalytics.js - Financial & Profit Analytics Module
// Core Functionalities:
// 1. Financial summary modal with period filtering
// 2. Profit margin intelligence system
// 3. Category and customer type breakdowns
// 4. Product profitability analysis
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
    let profitModal = null;
    let currentPeriod = CONFIG.DEFAULT_PERIOD;
    let financialData = null;
    let profitData = null;

    // ========================================================
    // INITIALIZATION
    // ========================================================
    function init() {
        debug.log('Initializing financial analytics module');
        
        try {
            createFinancialModal();
            createProfitMarginModal();
            setupPeriodSelector();
            
            debug.log('Module initialized successfully');
            
            return {
                showFinancialSummary,
                showProfitMarginAnalysis,
               // ⛔️ REMOVE getFinancialData and getProfitData from here
               // They're already in the main API return statement
               //  getFinancialData,
               // getProfitData,
                calculateFinancialData,
                calculateProfitMarginData
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
                        <button id="detailed-profits-btn" class="action-btn primary-btn" style="
                            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.3)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-chart-pie"></i>
                            Detailed Profits
                        </button>
                        <button id="shipping-analysis-btn" class="action-btn secondary-btn" style="
                            background: linear-gradient(135deg, #6366f1, #4f46e5);
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
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(99, 102, 241, 0.3)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-shipping-fast"></i>
                            Shipping Analysis
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

    // ========================================================
    // MODAL 2: PROFIT MARGIN INTELLIGENCE
    // ========================================================
    function createProfitMarginModal() {
        debug.log('Creating profit margin intelligence modal');
        
        try {
            // Remove existing modal if present
            const existingModal = document.getElementById('profit-margin-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal container
            profitModal = document.createElement('div');
            profitModal.id = 'profit-margin-modal';
            profitModal.className = 'financial-summary-modal';
            profitModal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: ${CONFIG.MODAL_ZINDEX + 1}; // Higher than financial modal
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;
            
            profitModal.innerHTML = `
                <div class="financial-modal-content" style="
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 1400px;
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
                        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                        color: white;
                        border-radius: 12px 12px 0 0;
                    ">
                        <div class="financial-header-title" style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chart-pie" style="font-size: 24px;"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Profit Margin Intelligence</h2>
                        </div>
                        <button id="close-profit-modal" class="financial-modal-close" style="
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
                    
                    <!-- Period Display -->
                    <div class="financial-period-selector" style="
                        padding: 16px 24px;
                        border-bottom: 1px solid #e5e7eb;
                        background: #f9fafb;
                    ">
                        <div class="period-display" style="display: flex; align-items: center; gap: 8px;">
                            <span id="profit-period-text" style="font-weight: 600; color: #374151;">December 2024</span>
                            <span class="order-count" id="profit-order-count" style="color: #6b7280; font-size: 0.9rem;">(20 orders)</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-sync-alt" style="color: #3b82f6;"></i>
                            <span>Synced with Financial Summary</span>
                        </div>
                    </div>
                    
                    <!-- View Selector -->
                    <div class="view-selector-row" style="
                        padding: 16px 24px;
                        border-bottom: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: #f3f4f6;
                    ">
                        <div class="view-tabs" style="display: flex; gap: 4px;">
                            <button class="view-tab active" data-view="margin-overview" style="
                                background: white;
                                border: 1px solid #3b82f6;
                                color: #3b82f6;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-chart-line"></i>
                                Margin Overview
                            </button>
                            <button class="view-tab" data-view="category-breakdown" style="
                                background: #f3f4f6;
                                border: 1px solid #d1d5db;
                                color: #374151;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-boxes"></i>
                                Category Profitability
                            </button>
                            <button class="view-tab" data-view="top-products" style="
                                background: #f3f4f6;
                                border: 1px solid #d1d5db;
                                color: #374151;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-star"></i>
                                Top Products
                            </button>
                            <button class="view-tab" data-view="insights" style="
                                background: #f3f4f6;
                                border: 1px solid #d1d5db;
                                color: #374151;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: all 0.2s;
                            ">
                                <i class="fas fa-lightbulb"></i>
                                Insights
                            </button>
                        </div>
                        
                        <div class="customer-filter">
                            <select id="customer-type-filter" class="filter-dropdown" style="
                                padding: 8px 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 6px;
                                background: white;
                                font-size: 14px;
                                min-width: 180px;
                            ">
                                <option value="all">All Customers</option>
                                <option value="wholesaler">Wholesale Only</option>
                                <option value="retailer">Retail Only</option>
                                <option value="personal">Personal Only</option>
                                <option value="corporate">Corporate Only</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Main Content Container -->
                    <div class="profit-metrics-container" style="padding: 24px;">
                        <!-- Margin Overview (Default View) -->
                        <div id="margin-overview-view" class="profit-view active-view" style="display: block;">
                            <div class="margin-overview-header" style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-balance-scale" style="color: #f59e0b;"></i>
                                    Margin Comparison
                                </h3>
                                <div class="view-description" style="color: #6b7280; font-size: 0.95rem;">
                                    Theoretical vs actual profit margins across price tiers
                                </div>
                            </div>
                            
                            <div class="margin-cards-grid" style="
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 20px;
                                margin-bottom: 24px;
                            ">
                                <!-- Wholesale Margins -->
                                <div class="margin-card wholesale-card" style="
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                                    border-top: 4px solid #3b82f6;
                                ">
                                    <div class="margin-card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                                        <i class="fas fa-industry" style="color: #3b82f6; font-size: 1.5rem;"></i>
                                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Wholesale Margins</h4>
                                    </div>
                                    <div class="margin-metrics" style="space-y: 12px;">
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Average Margin</div>
                                            <div class="margin-value" id="wholesale-avg-margin" style="
                                                font-size: 1.8rem;
                                                font-weight: 700;
                                                color: #374151;
                                            ">65%</div>
                                        </div>
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Highest Margin</div>
                                            <div class="margin-value" id="wholesale-high-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #059669;
                                            ">78%</div>
                                        </div>
                                        <div class="margin-metric">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Lowest Margin</div>
                                            <div class="margin-value" id="wholesale-low-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #dc2626;
                                            ">40%</div>
                                        </div>
                                    </div>
                                    <div class="margin-note" style="
                                        margin-top: 16px;
                                        padding-top: 16px;
                                        border-top: 1px solid #e5e7eb;
                                        color: #6b7280;
                                        font-size: 0.85rem;
                                        font-style: italic;
                                    ">
                                        Based on wholesale price vs retail price
                                    </div>
                                </div>
                                
                                <!-- Retail Margins -->
                                <div class="margin-card retail-card" style="
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                                    border-top: 4px solid #10b981;
                                ">
                                    <div class="margin-card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                                        <i class="fas fa-store" style="color: #10b981; font-size: 1.5rem;"></i>
                                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Retail Margins</h4>
                                    </div>
                                    <div class="margin-metrics" style="space-y: 12px;">
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Average Margin</div>
                                            <div class="margin-value" id="retail-avg-margin" style="
                                                font-size: 1.8rem;
                                                font-weight: 700;
                                                color: #374151;
                                            ">45%</div>
                                        </div>
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Highest Margin</div>
                                            <div class="margin-value" id="retail-high-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #059669;
                                            ">60%</div>
                                        </div>
                                        <div class="margin-metric">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Lowest Margin</div>
                                            <div class="margin-value" id="retail-low-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #dc2626;
                                            ">30%</div>
                                        </div>
                                    </div>
                                    <div class="margin-note" style="
                                        margin-top: 16px;
                                        padding-top: 16px;
                                        border-top: 1px solid #e5e7eb;
                                        color: #6b7280;
                                        font-size: 0.85rem;
                                        font-style: italic;
                                    ">
                                        Standard retail pricing margins
                                    </div>
                                </div>
                                
                                <!-- Actual Margins -->
                                <div class="margin-card actual-card" style="
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                                    border-top: 4px solid #8b5cf6;
                                ">
                                    <div class="margin-card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                                        <i class="fas fa-chart-line" style="color: #8b5cf6; font-size: 1.5rem;"></i>
                                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Actual Margins</h4>
                                    </div>
                                    <div class="margin-metrics" style="space-y: 12px;">
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Average Margin</div>
                                            <div class="margin-value" id="actual-avg-margin" style="
                                                font-size: 1.8rem;
                                                font-weight: 700;
                                                color: #374151;
                                            ">52%</div>
                                        </div>
                                        <div class="margin-metric" style="margin-bottom: 16px;">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Highest Margin</div>
                                            <div class="margin-value" id="actual-high-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #059669;
                                            ">68%</div>
                                        </div>
                                        <div class="margin-metric">
                                            <div class="margin-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Lowest Margin</div>
                                            <div class="margin-value" id="actual-low-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 600;
                                                color: #dc2626;
                                            ">35%</div>
                                        </div>
                                    </div>
                                    <div class="margin-note" style="
                                        margin-top: 16px;
                                        padding-top: 16px;
                                        border-top: 1px solid #e5e7eb;
                                        color: #6b7280;
                                        font-size: 0.85rem;
                                        font-style: italic;
                                    ">
                                        Actual achieved from mixed orders
                                    </div>
                                </div>
                            </div>
                            
                            <div class="margin-summary" style="
                                background: #f0f9ff;
                                border: 1px solid #dbeafe;
                                border-radius: 10px;
                                padding: 20px;
                                display: flex;
                                gap: 40px;
                            ">
                                <div class="summary-item" style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-arrow-up success-icon" style="color: #10b981; font-size: 1.5rem;"></i>
                                    <div>
                                        <div class="summary-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Best Performing Tier:</div>
                                        <div class="summary-value" id="best-tier" style="font-weight: 600; color: #374151; font-size: 1.1rem;">Wholesale (65%)</div>
                                    </div>
                                </div>
                                <div class="summary-item" style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-exclamation-triangle warning-icon" style="color: #f59e0b; font-size: 1.5rem;"></i>
                                    <div>
                                        <div class="summary-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Margin Opportunity:</div>
                                        <div class="summary-value" id="margin-opportunity" style="font-weight: 600; color: #374151; font-size: 1.1rem;">+13% potential</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Category Profitability View -->
                        <div id="category-breakdown-view" class="profit-view" style="display: none;">
                            <div class="profit-view-header" style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-boxes" style="color: #3b82f6;"></i>
                                    Category Profitability
                                </h3>
                                <div class="view-description" style="color: #6b7280; font-size: 0.95rem;">
                                    Profit analysis by product category
                                </div>
                            </div>
                            
                            <div class="category-profit-table-container" style="margin-bottom: 24px; overflow-x: auto;">
                                <table class="profit-table" style="
                                    width: 100%;
                                    border-collapse: collapse;
                                    background: white;
                                    border-radius: 10px;
                                    overflow: hidden;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                                ">
                                    <thead>
                                        <tr style="background: #f3f4f6;">
                                            <th style="
                                                padding: 16px;
                                                text-align: left;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Category</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Units Sold</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Revenue</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Cost</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Profit</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody id="category-profit-table">
                                        <tr>
                                            <td colspan="6" style="
                                                padding: 40px;
                                                text-align: center;
                                                color: #6b7280;
                                            ">
                                                <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading category data...
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot id="category-totals-row">
                                        <!-- Totals row will be inserted here -->
                                    </tfoot>
                                </table>
                            </div>
                            
                            <div class="category-insights" style="
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 20px;
                            ">
                                <div class="insight-card best-category" style="
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    border-left: 4px solid #10b981;
                                ">
                                    <div class="insight-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                        <i class="fas fa-trophy" style="color: #f59e0b; font-size: 1.2rem;"></i>
                                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Best Category</h4>
                                    </div>
                                    <div class="insight-content">
                                        <div class="insight-category" id="best-category-name" style="
                                            font-size: 1.4rem;
                                            font-weight: 700;
                                            color: #374151;
                                            margin-bottom: 4px;
                                        ">Perfumes</div>
                                        <div class="insight-metric" id="best-category-metric" style="
                                            font-size: 1.1rem;
                                            font-weight: 600;
                                            color: #059669;
                                            margin-bottom: 4px;
                                        ">60% margin</div>
                                        <div class="insight-detail" id="best-category-detail" style="
                                            color: #6b7280;
                                            font-size: 0.9rem;
                                        ">42 units sold</div>
                                    </div>
                                </div>
                                
                                <div class="insight-card restock-alert" style="
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    border-left: 4px solid #dc2626;
                                ">
                                    <div class="insight-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                        <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 1.2rem;"></i>
                                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Restock Priority</h4>
                                    </div>
                                    <div class="insight-content">
                                        <div class="insight-category" id="restock-category" style="
                                            font-size: 1.4rem;
                                            font-weight: 700;
                                            color: #374151;
                                            margin-bottom: 4px;
                                        ">Skincare</div>
                                        <div class="insight-metric" id="restock-metric" style="
                                            font-size: 1.1rem;
                                            font-weight: 600;
                                            color: #dc2626;
                                            margin-bottom: 4px;
                                        ">10 units left</div>
                                        <div class="insight-detail" id="restock-detail" style="
                                            color: #6b7280;
                                            font-size: 0.9rem;
                                        ">High margin, low stock</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Top Products View -->
                        <div id="top-products-view" class="profit-view" style="display: none;">
                            <div class="profit-view-header" style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-star" style="color: #f59e0b;"></i>
                                    Top Products by Profit
                                </h3>
                                <div class="view-description" style="color: #6b7280; font-size: 0.95rem;">
                                    Most profitable products based on actual sales
                                </div>
                            </div>
                            
                            <div class="top-products-controls" style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 20px;
                                flex-wrap: wrap;
                                gap: 12px;
                            ">
                                <div class="sort-controls" style="display: flex; align-items: center; gap: 12px;">
                                    <span class="sort-label" style="color: #374151; font-weight: 500;">Sort by:</span>
                                    <button class="sort-btn active" data-sort="profit" style="
                                        background: #3b82f6;
                                        color: white;
                                        border: none;
                                        padding: 6px 16px;
                                        border-radius: 20px;
                                        font-weight: 500;
                                        cursor: pointer;
                                        font-size: 0.9rem;
                                    ">Highest Profit</button>
                                    <button class="sort-btn" data-sort="margin" style="
                                        background: #f3f4f6;
                                        color: #374151;
                                        border: 1px solid #d1d5db;
                                        padding: 6px 16px;
                                        border-radius: 20px;
                                        font-weight: 500;
                                        cursor: pointer;
                                        font-size: 0.9rem;
                                    ">Highest Margin</button>
                                    <button class="sort-btn" data-sort="units" style="
                                        background: #f3f4f6;
                                        color: #374151;
                                        border: 1px solid #d1d5db;
                                        padding: 6px 16px;
                                        border-radius: 20px;
                                        font-weight: 500;
                                        cursor: pointer;
                                        font-size: 0.9rem;
                                    ">Most Units Sold</button>
                                </div>
                                <div class="limit-control" style="display: flex; align-items: center; gap: 8px;">
                                    <span class="limit-label" style="color: #374151; font-weight: 500;">Show:</span>
                                    <select id="products-limit" class="limit-select" style="
                                        padding: 6px 12px;
                                        border: 1px solid #d1d5db;
                                        border-radius: 6px;
                                        background: white;
                                        font-size: 0.9rem;
                                    ">
                                        <option value="5">Top 5</option>
                                        <option value="10" selected>Top 10</option>
                                        <option value="20">Top 20</option>
                                        <option value="all">All Products</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="top-products-table-container" style="margin-bottom: 24px; overflow-x: auto;">
                                <table class="profit-table" style="
                                    width: 100%;
                                    border-collapse: collapse;
                                    background: white;
                                    border-radius: 10px;
                                    overflow: hidden;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                                ">
                                    <thead>
                                        <tr style="background: #f3f4f6;">
                                            <th style="
                                                padding: 16px;
                                                text-align: left;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Product</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Units Sold</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Revenue</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Cost</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Profit</th>
                                            <th style="
                                                padding: 16px;
                                                text-align: right;
                                                font-weight: 600;
                                                color: #374151;
                                                border-bottom: 2px solid #e5e7eb;
                                            ">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody id="top-products-table">
                                        <tr>
                                            <td colspan="6" style="
                                                padding: 40px;
                                                text-align: center;
                                                color: #6b7280;
                                            ">
                                                <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading product data...
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="profit-distribution" style="
                                background: white;
                                border: 1px solid #e5e7eb;
                                border-radius: 10px;
                                padding: 20px;
                            ">
                                <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-chart-pie" style="color: #8b5cf6;"></i>
                                    Profit Distribution
                                </h4>
                                <div class="distribution-bars">
                                    <div class="distribution-bar high-margin" style="margin-bottom: 16px;">
                                        <div class="bar-label" style="
                                            display: flex;
                                            justify-content: space-between;
                                            margin-bottom: 8px;
                                            color: #374151;
                                            font-size: 0.9rem;
                                        ">
                                            <span>High Margin (>60%)</span>
                                            <span class="bar-value" id="high-margin-value" style="font-weight: 600;">63%</span>
                                        </div>
                                        <div class="bar-container" style="
                                            height: 24px;
                                            background: #e5e7eb;
                                            border-radius: 12px;
                                            overflow: hidden;
                                            position: relative;
                                        ">
                                            <div class="bar-fill" style="
                                                height: 100%;
                                                background: linear-gradient(90deg, #10b981, #059669);
                                                border-radius: 12px;
                                                width: 63%;
                                                transition: width 0.5s ease;
                                            "></div>
                                        </div>
                                    </div>
                                    <div class="distribution-bar medium-margin" style="margin-bottom: 16px;">
                                        <div class="bar-label" style="
                                            display: flex;
                                            justify-content: space-between;
                                            margin-bottom: 8px;
                                            color: #374151;
                                            font-size: 0.9rem;
                                        ">
                                            <span>Medium (40-60%)</span>
                                            <span class="bar-value" id="medium-margin-value" style="font-weight: 600;">30%</span>
                                        </div>
                                        <div class="bar-container" style="
                                            height: 24px;
                                            background: #e5e7eb;
                                            border-radius: 12px;
                                            overflow: hidden;
                                            position: relative;
                                        ">
                                            <div class="bar-fill" style="
                                                height: 100%;
                                                background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                                                border-radius: 12px;
                                                width: 30%;
                                                transition: width 0.5s ease;
                                            "></div>
                                        </div>
                                    </div>
                                    <div class="distribution-bar low-margin">
                                        <div class="bar-label" style="
                                            display: flex;
                                            justify-content: space-between;
                                            margin-bottom: 8px;
                                            color: #374151;
                                            font-size: 0.9rem;
                                        ">
                                            <span>Low (<40%)</span>
                                            <span class="bar-value" id="low-margin-value" style="font-weight: 600;">7%</span>
                                        </div>
                                        <div class="bar-container" style="
                                            height: 24px;
                                            background: #e5e7eb;
                                            border-radius: 12px;
                                            overflow: hidden;
                                            position: relative;
                                        ">
                                            <div class="bar-fill" style="
                                                height: 100%;
                                                background: linear-gradient(90deg, #ef4444, #dc2626);
                                                border-radius: 12px;
                                                width: 7%;
                                                transition: width 0.5s ease;
                                            "></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Insights View -->
                        <div id="insights-view" class="profit-view" style="display: none;">
                            <div class="profit-view-header" style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-lightbulb" style="color: #f59e0b;"></i>
                                    Actionable Insights
                                </h3>
                                <div class="view-description" style="color: #6b7280; font-size: 0.95rem;">
                                    Recommendations to improve profitability
                                </div>
                            </div>
                            
                            <div class="insights-grid" style="
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 20px;
                                margin-bottom: 24px;
                            ">
                                <div class="insight-card-large" style="
                                    grid-column: span 1;
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    display: flex;
                                    gap: 16px;
                                ">
                                    <div class="insight-icon revenue-insight" style="
                                        background: linear-gradient(135deg, #10b981, #059669);
                                        color: white;
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 12px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.5rem;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-money-bill-wave"></i>
                                    </div>
                                    <div class="insight-content-large" style="flex: 1;">
                                        <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Revenue Optimization</h4>
                                        <div class="insight-list" style="space-y: 12px;">
                                            <div class="insight-item" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
                                                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="revenue-opportunity-1" style="color: #374151; line-height: 1.4;">
                                                    Increase prices on high-demand perfumes by 10%
                                                </span>
                                            </div>
                                            <div class="insight-item" style="display: flex; align-items: flex-start; gap: 8px;">
                                                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="revenue-opportunity-2" style="color: #374151; line-height: 1.4;">
                                                    Bundle low-margin wigs with accessories
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="insight-card-large" style="
                                    grid-column: span 1;
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    display: flex;
                                    gap: 16px;
                                ">
                                    <div class="insight-icon cost-insight" style="
                                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                                        color: white;
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 12px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.5rem;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="insight-content-large" style="flex: 1;">
                                        <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Cost Reduction</h4>
                                        <div class="insight-list" style="space-y: 12px;">
                                            <div class="insight-item" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
                                                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="cost-opportunity-1" style="color: #374151; line-height: 1.4;">
                                                    Negotiate better wholesale prices for lashes
                                                </span>
                                            </div>
                                            <div class="insight-item" style="display: flex; align-items: flex-start; gap: 8px;">
                                                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="cost-opportunity-2" style="color: #374151; line-height: 1.4;">
                                                    Reduce packaging costs by 5%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="insight-card-large" style="
                                    grid-column: span 2;
                                    background: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;
                                    padding: 20px;
                                    display: flex;
                                    gap: 16px;
                                ">
                                    <div class="insight-icon inventory-insight" style="
                                        background: linear-gradient(135deg, #f59e0b, #d97706);
                                        color: white;
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 12px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.5rem;
                                        flex-shrink: 0;
                                    ">
                                        <i class="fas fa-boxes"></i>
                                    </div>
                                    <div class="insight-content-large" style="flex: 1;">
                                        <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Inventory Management</h4>
                                        <div class="insight-list" style="space-y: 12px;">
                                            <div class="insight-item urgent" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
                                                <i class="fas fa-exclamation-circle" style="color: #dc2626; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="inventory-alert-1" style="color: #374151; line-height: 1.4;">
                                                    Restock skincare immediately (10 units left)
                                                </span>
                                            </div>
                                            <div class="insight-item" style="display: flex; align-items: flex-start; gap: 8px;">
                                                <i class="fas fa-clock" style="color: #f59e0b; font-size: 1rem; margin-top: 2px;"></i>
                                                <span class="insight-text" id="inventory-alert-2" style="color: #374151; line-height: 1.4;">
                                                    Reduce wigs inventory by 20%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="key-metrics-summary" style="
                                background: #f9fafb;
                                border: 1px solid #e5e7eb;
                                border-radius: 10px;
                                padding: 20px;
                            ">
                                <h4 style="margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 600; color: #374151;">Key Performance Metrics</h4>
                                <div class="metrics-grid" style="
                                    display: grid;
                                    grid-template-columns: repeat(3, 1fr);
                                    gap: 20px;
                                ">
                                    <div class="key-metric" style="
                                        background: white;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 10px;
                                        padding: 16px;
                                        display: flex;
                                        gap: 12px;
                                        align-items: center;
                                    ">
                                        <div class="metric-icon" style="
                                            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                                            color: white;
                                            width: 48px;
                                            height: 48px;
                                            border-radius: 10px;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: 1.2rem;
                                        ">
                                            <i class="fas fa-percentage"></i>
                                        </div>
                                        <div class="metric-content" style="flex: 1;">
                                            <div class="metric-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Overall Profit Margin</div>
                                            <div class="metric-value" id="overall-margin" style="
                                                font-size: 1.5rem;
                                                font-weight: 700;
                                                color: #374151;
                                                margin-bottom: 4px;
                                            ">52%</div>
                                            <div class="metric-change positive" style="
                                                color: #10b981;
                                                font-size: 0.85rem;
                                                font-weight: 500;
                                            ">+3% vs target</div>
                                        </div>
                                    </div>
                                    
                                    <div class="key-metric" style="
                                        background: white;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 10px;
                                        padding: 16px;
                                        display: flex;
                                        gap: 12px;
                                        align-items: center;
                                    ">
                                        <div class="metric-icon" style="
                                            background: linear-gradient(135deg, #06b6d4, #0891b2);
                                            color: white;
                                            width: 48px;
                                            height: 48px;
                                            border-radius: 10px;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: 1.2rem;
                                        ">
                                            <i class="fas fa-box"></i>
                                        </div>
                                        <div class="metric-content" style="flex: 1;">
                                            <div class="metric-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Inventory Turnover</div>
                                            <div class="metric-value" id="inventory-turnover" style="
                                                font-size: 1.5rem;
                                                font-weight: 700;
                                                color: #374151;
                                                margin-bottom: 4px;
                                            ">2.4x</div>
                                            <div class="metric-change negative" style="
                                                color: #dc2626;
                                                font-size: 0.85rem;
                                                font-weight: 500;
                                            ">-0.2x vs last period</div>
                                        </div>
                                    </div>
                                    
                                    <div class="key-metric" style="
                                        background: white;
                                        border: 1px solid #e5e7eb;
                                        border-radius: 10px;
                                        padding: 16px;
                                        display: flex;
                                        gap: 12px;
                                        align-items: center;
                                    ">
                                        <div class="metric-icon" style="
                                            background: linear-gradient(135deg, #f59e0b, #d97706);
                                            color: white;
                                            width: 48px;
                                            height: 48px;
                                            border-radius: 10px;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: 1.2rem;
                                        ">
                                            <i class="fas fa-trophy"></i>
                                        </div>
                                        <div class="metric-content" style="flex: 1;">
                                            <div class="metric-label" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 4px;">Best Product</div>
                                            <div class="metric-value" id="best-product" style="
                                                font-size: 1.5rem;
                                                font-weight: 700;
                                                color: #374151;
                                                margin-bottom: 4px;
                                            ">Luxury Perfume</div>
                                            <div class="metric-detail" style="color: #6b7280; font-size: 0.85rem;">R3,125 profit</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="profit-actions" style="
                        padding: 20px 24px;
                        border-top: 1px solid #e5e7eb;
                        background: #f9fafb;
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        border-radius: 0 0 12px 12px;
                    ">
                        <button id="export-profit-data" class="action-btn export-btn" style="
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
                        ">
                            <i class="fas fa-file-export"></i>
                            Export to Excel
                        </button>
                        <button id="set-margin-alerts" class="action-btn alert-btn" style="
                            background: linear-gradient(135deg, #f59e0b, #d97706);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-bell"></i>
                            Set Margin Alerts
                        </button>
                        <button id="compare-periods-btn" class="action-btn compare-btn" style="
                            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-chart-bar"></i>
                            Compare Periods
                        </button>
                        <button id="refresh-profit-data" class="action-btn refresh-btn" style="
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
                        ">
                            <i class="fas fa-sync-alt"></i>
                            Refresh Data
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(profitModal);
            setupProfitModalEvents();
            debug.log('Profit margin modal created successfully');
            
        } catch (error) {
            debug.error('Failed to create profit margin modal', error);
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

    // ========================================================
    // PROFIT MARGIN CALCULATION FUNCTIONS
    // ========================================================
   async function calculateProfitMarginData(period = currentPeriod, customerType = 'all') {
        debug.log('Calculating profit margin data for period:', period, 'customer type:', customerType);
        
        try {
                    // TRY FIRESTORE FIRST FOR FRESH DATA
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            console.log('[SalesAnalytics] Fetching fresh data for profit analysis...');
            await refreshDataFromFirestore(); // IT WORKS FOR BOTH MODALS ✅️✅️✅️
        }
            
            if (typeof OrdersManager === 'undefined' || typeof ProductsManager === 'undefined') {
                debug.error('Required managers not available');
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
                debug.warn('No data for profit analysis', {
                    orders: customerFilteredOrders.length,
                    products: allProducts.length
                });
                return getEmptyProfitData();
            }
            
            // Calculate metrics
            const marginData = calculateMarginMetrics(customerFilteredOrders, allProducts);
            const categoryData = calculateCategoryProfitability(customerFilteredOrders, allProducts);
            const productData = calculateProductProfitability(customerFilteredOrders, allProducts);
            const insights = generateProfitInsights(marginData, categoryData, productData);
            
            profitData = {
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
            
            debug.log('Profit margin data calculated successfully', {
                totalOrders: profitData.totalOrders,
                categories: profitData.categoryData.length,
                products: profitData.productData.length
            });
            
            return profitData;
            
        } catch (error) {
            debug.error('Failed to calculate profit margin data', error);
            return getEmptyProfitData();
        }
    }

    function calculateMarginMetrics(orders, products) {
        const marginData = {
            wholesale: { avg: 0, high: 0, low: 100, count: 0 },
            retail: { avg: 0, high: 0, low: 100, count: 0 },
            actual: { avg: 0, high: 0, low: 100, count: 0 }
        };
        
        debug.log('Calculating margin metrics for', orders.length, 'orders and', products.length, 'products');
        
        // Calculate theoretical wholesale margins (product level)
        products.forEach(product => {
            const retailPrice = parseFloat(product.retailPrice) || 0;
            const wholesalePrice = parseFloat(product.wholesalePrice) || 0;
            
            if (retailPrice > 0 && wholesalePrice > 0) {
                const margin = ((retailPrice - wholesalePrice) / retailPrice) * 100;
                
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
            const subtotal = parseFloat(order.subtotal) || 0;
            if (order.items && subtotal > 0) {
                // Calculate wholesale cost for this order
                let wholesaleCost = 0;
                order.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        const unitCost = parseFloat(product.wholesalePrice) || 0;
                        wholesaleCost += unitCost * (parseInt(item.quantity) || 1);
                    }
                });
                
                if (wholesaleCost > 0) {
                    const margin = ((subtotal - wholesaleCost) / subtotal) * 100;
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
        
        debug.log('Margin metrics calculated', marginData);
        // At the END of calculateMarginMetrics(), before return:
debug.log('Final marginData structure:', {
    hasWholesale: !!marginData.wholesale,
    wholesaleType: typeof marginData.wholesale,
    marginData: marginData
});
        return marginData;
    }

    function calculateCategoryProfitability(orders, products) {
        const categoryData = {};
        
        debug.log('Calculating category profitability for', orders.length, 'orders');
        
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
                        const quantity = parseInt(item.quantity) || 1;
                        const revenue = (parseFloat(item.price) || 0) * quantity;
                        const cost = (parseFloat(product.wholesalePrice) || 0) * quantity;
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
        const result = Object.entries(categoryData)
            .map(([category, data]) => ({
                category,
                ...data
            }))
            .sort((a, b) => b.profit - a.profit);
        
        debug.log('Category profitability calculated', result);
        return result;
    }

    function calculateProductProfitability(orders, products) {
        const productMap = {};
        
        debug.log('Calculating product profitability for', orders.length, 'orders and', products.length, 'products');
        
        // Initialize product data with current info
        products.forEach(product => {
            productMap[product.id] = {
                id: product.id,
                name: product.name,
                category: product.category,
                wholesalePrice: parseFloat(product.wholesalePrice) || 0,
                currentPrice: parseFloat(product.currentPrice) || 0,
                stock: parseInt(product.stock) || 0,
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
                        const quantity = parseInt(item.quantity) || 1;
                        const revenue = (parseFloat(item.price) || 0) * quantity;
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
        
        debug.log('Product profitability calculated', { totalProducts: productData.length });
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
            if (lowMarginCat) {
                insights.costOpportunities.push(`Review ${lowMarginCat.category} wholesale pricing`);
            }
        }
        
        if (lowStockProducts.length > 0) {
            insights.inventoryAlerts.push(`Restock ${lowStockProducts[0].name} (${lowStockProducts[0].stock} units left)`);
        }
        
        // Add default insights if none generated
        if (insights.revenueOpportunities.length === 0) {
            insights.revenueOpportunities.push('Focus on upselling accessories with high-margin products');
        }
        
        if (insights.costOpportunities.length === 0) {
            insights.costOpportunities.push('Review shipping providers for better rates');
        }
        
        if (insights.inventoryAlerts.length === 0 && productData.length > 0) {
            const highProfitProduct = productData[0];
            insights.inventoryAlerts.push(`Monitor stock for ${highProfitProduct.name} (best seller)`);
        }
        
        debug.log('Profit insights generated', insights);
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
    // UI UPDATE FUNCTIONS
    // ========================================================
    function updateFinancialModal(data) {
        debug.log('Updating financial modal with data');
        
        try {
            if (!data) {
                debug.warn('No data provided for financial modal update');
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

    function updateProfitModal(data) {
        debug.log('Updating profit modal with data');
        
        try {
            if (!data) {
                debug.warn('No data provided for profit modal update');
                return;
            }
            
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
            
            debug.log('Profit modal updated successfully');
            
        } catch (error) {
            debug.error('Failed to update profit modal', error);
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
        
        if (!tableBody) {
            debug.warn('Category profitability table body not found');
            return;
        }
        
        if (categoryData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="
                        padding: 40px;
                        text-align: center;
                        color: #6b7280;
                        font-style: italic;
                    ">
                        <i class="fas fa-chart-bar" style="margin-right: 8px;"></i>
                        No category data available
                    </td>
                </tr>
            `;
            if (totalsRow) totalsRow.innerHTML = '';
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
            
            const marginTier = getMarginTier(item.margin);
            const marginColor = marginTier === 'high' ? '#059669' : marginTier === 'medium' ? '#3b82f6' : '#dc2626';
            const marginBg = marginTier === 'high' ? '#d1fae5' : marginTier === 'medium' ? '#dbeafe' : '#fee2e2';
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 16px;">
                        <span class="category-name" style="font-weight: 500; color: #374151;">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                    </td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${item.unitsSold}</td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${formatCurrency(item.revenue)}</td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${formatCurrency(item.cost)}</td>
                    <td style="padding: 16px; text-align: right;">
                        <span class="profit-value" style="font-weight: 600; color: #059669;">${formatCurrency(item.profit)}</span>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <span class="margin-badge" style="
                            background: ${marginBg};
                            color: ${marginColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-weight: 600;
                            font-size: 0.9rem;
                        ">${item.margin}%</span>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Update totals row
        if (totalsRow) {
            const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
            const marginTier = getMarginTier(avgMargin);
            const marginColor = marginTier === 'high' ? '#059669' : marginTier === 'medium' ? '#3b82f6' : '#dc2626';
            const marginBg = marginTier === 'high' ? '#d1fae5' : marginTier === 'medium' ? '#dbeafe' : '#fee2e2';
            
            totalsRow.innerHTML = `
                <tr style="background: #f9fafb; border-top: 2px solid #e5e7eb;">
                    <td style="padding: 16px;">
                        <strong style="color: #374151;">Totals</strong>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <strong style="color: #374151;">${totalUnits}</strong>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <strong style="color: #374151;">${formatCurrency(totalRevenue)}</strong>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <strong style="color: #374151;">${formatCurrency(totalCost)}</strong>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <strong class="total-profit" style="color: #059669;">${formatCurrency(totalProfit)}</strong>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <strong class="total-margin" style="
                            background: ${marginBg};
                            color: ${marginColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 0.9rem;
                        ">${avgMargin.toFixed(1)}%</strong>
                    </td>
                </tr>
            `;
        }
        
        // Update insights cards
        if (categoryData.length > 0) {
            const bestCat = categoryData[0];
            const lowStockCat = categoryData.find(cat => cat.unitsSold > 0 && cat.revenue > 0) || bestCat;
            
            document.getElementById('best-category-name').textContent = 
                bestCat.category.charAt(0).toUpperCase() + bestCat.category.slice(1);
            document.getElementById('best-category-metric').textContent = 
                `${bestCat.margin}% margin`;
            document.getElementById('best-category-detail').textContent = 
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
        if (!tableBody) {
            debug.warn('Top products table body not found');
            return;
        }
        
        // Get current limit
        const limitSelect = document.getElementById('products-limit');
        const limit = limitSelect ? limitSelect.value : '10';
        
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
        if (limit !== 'all' && !isNaN(parseInt(limit))) {
            sortedData = sortedData.slice(0, parseInt(limit));
        }
        
        if (sortedData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="
                        padding: 40px;
                        text-align: center;
                        color: #6b7280;
                        font-style: italic;
                    ">
                        <i class="fas fa-box-open" style="margin-right: 8px;"></i>
                        No product sales data available
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        sortedData.forEach(product => {
            const marginTier = getMarginTier(product.margin);
            const marginColor = marginTier === 'high' ? '#059669' : marginTier === 'medium' ? '#3b82f6' : '#dc2626';
            const marginBg = marginTier === 'high' ? '#d1fae5' : marginTier === 'medium' ? '#dbeafe' : '#fee2e2';
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 16px;">
                        <div class="product-info">
                            <div class="product-name" style="font-weight: 500; color: #374151; margin-bottom: 4px;">${product.name}</div>
                            <div class="product-category" style="color: #6b7280; font-size: 0.85rem;">${product.category || 'Uncategorized'}</div>
                        </div>
                    </td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${product.unitsSold}</td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${formatCurrency(product.revenue)}</td>
                    <td style="padding: 16px; text-align: right; color: #374151;">${formatCurrency(product.cost)}</td>
                    <td style="padding: 16px; text-align: right;">
                        <span class="profit-value" style="font-weight: 600; color: #059669;">${formatCurrency(product.profit)}</span>
                    </td>
                    <td style="padding: 16px; text-align: right;">
                        <span class="margin-badge" style="
                            background: ${marginBg};
                            color: ${marginColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-weight: 600;
                            font-size: 0.9rem;
                        ">${product.margin}%</span>
                    </td>
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
            const highBar = document.querySelector('.distribution-bar.high-margin .bar-fill');
            const mediumBar = document.querySelector('.distribution-bar.medium-margin .bar-fill');
            const lowBar = document.querySelector('.distribution-bar.low-margin .bar-fill');
            
            if (highBar) highBar.style.width = `${highPercent}%`;
            if (mediumBar) mediumBar.style.width = `${mediumPercent}%`;
            if (lowBar) lowBar.style.width = `${lowPercent}%`;
        }
    }

    function updateProfitInsights(insights, categoryData, productData) {
        // Update overall margin
        const overallMargin = categoryData.reduce((sum, cat) => sum + cat.margin, 0) / (categoryData.length || 1);
        const overallMarginElement = document.getElementById('overall-margin');
        if (overallMarginElement) {
            overallMarginElement.textContent = `${overallMargin.toFixed(1)}%`;
        }
        
        // Update inventory turnover (simplified calculation)
        const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.revenue, 0);
        const avgInventory = productData.reduce((sum, prod) => sum + (prod.stock * prod.wholesalePrice), 0) / (productData.length || 1);
        const turnover = avgInventory > 0 ? totalRevenue / avgInventory : 0;
        const inventoryTurnoverElement = document.getElementById('inventory-turnover');
        if (inventoryTurnoverElement) {
            inventoryTurnoverElement.textContent = `${turnover.toFixed(1)}x`;
        }
        
        // Update best product
        if (insights.bestProduct) {
            const bestProductElement = document.getElementById('best-product');
            if (bestProductElement) {
                bestProductElement.textContent = insights.bestProduct.name;
            }
        }
        
        // Update insight texts
        if (insights.revenueOpportunities.length > 0) {
            const revenueOpportunityElement = document.getElementById('revenue-opportunity-1');
            if (revenueOpportunityElement) {
                revenueOpportunityElement.textContent = insights.revenueOpportunities[0];
            }
        }
        
        if (insights.costOpportunities.length > 0) {
            const costOpportunityElement = document.getElementById('cost-opportunity-1');
            if (costOpportunityElement) {
                costOpportunityElement.textContent = insights.costOpportunities[0];
            }
        }
        
        if (insights.inventoryAlerts.length > 0) {
            const inventoryAlertElement = document.getElementById('inventory-alert-1');
            if (inventoryAlertElement) {
                inventoryAlertElement.textContent = insights.inventoryAlerts[0];
            }
        }
    }

    // Helper function to get margin tier for styling
    function getMarginTier(margin) {
        if (margin > 60) return 'high';
        if (margin >= 40) return 'medium';
        return 'low';
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
            
            // Action buttons
            const detailedProfitsBtn = document.getElementById('detailed-profits-btn');
            if (detailedProfitsBtn) {
                detailedProfitsBtn.onclick = function() {
                    debug.log('Detailed profits button clicked');
                    closeFinancialModal();
                    setTimeout(() => {
                        showProfitMarginAnalysis();
                    }, 100);
                };
            }
            
            const shippingAnalysisBtn = document.getElementById('shipping-analysis-btn');
            if (shippingAnalysisBtn) {
                shippingAnalysisBtn.onclick = function() {
                    debug.log('Shipping analysis button clicked');
                    alert('Shipping Analysis modal will be implemented in the next phase');
                };
            }
            
            const refreshBtn = document.getElementById('refresh-financial-btn');
            if (refreshBtn) {
                refreshBtn.onclick = loadFinancialData;
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

    function setupProfitModalEvents() {
        debug.log('Setting up profit modal event handlers');
        
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
                    debug.log('Switching to view:', view);
                    switchProfitView(view);
                    
                    // Update active tab
                    viewTabs.forEach(t => {
                        t.style.background = '#f3f4f6';
                        t.style.border = '1px solid #d1d5db';
                        t.style.color = '#374151';
                        t.classList.remove('active');
                    });
                    this.style.background = 'white';
                    this.style.border = '1px solid #3b82f6';
                    this.style.color = '#3b82f6';
                    this.classList.add('active');
                });
            });
            
            // Customer type filter
            const customerFilter = document.getElementById('customer-type-filter');
            if (customerFilter) {
                customerFilter.addEventListener('change', function() {
                    debug.log('Customer filter changed to:', this.value);
                    loadProfitData();
                });
            }
            
            // Sort buttons in top products view
            const sortButtons = document.querySelectorAll('.sort-btn');
            sortButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    debug.log('Sort by:', this.dataset.sort);
                    sortButtons.forEach(b => {
                        b.style.background = '#f3f4f6';
                        b.style.color = '#374151';
                        b.classList.remove('active');
                    });
                    this.style.background = '#3b82f6';
                    this.style.color = 'white';
                    this.classList.add('active');
                    updateTopProductsDisplay();
                });
            });
            
            // Products limit selector
            const productsLimit = document.getElementById('products-limit');
            if (productsLimit) {
                productsLimit.addEventListener('change', function() {
                    debug.log('Products limit changed to:', this.value);
                    updateTopProductsDisplay();
                });
            }
            
            // Action buttons
            const exportBtn = document.getElementById('export-profit-data');
            if (exportBtn) {
                exportBtn.onclick = function() {
                    debug.log('Export profit data clicked');
                    alert('Export functionality will be implemented in the next phase');
                };
            }
            
            const alertsBtn = document.getElementById('set-margin-alerts');
            if (alertsBtn) {
                alertsBtn.onclick = function() {
                    debug.log('Set margin alerts clicked');
                    alert('Margin alert functionality will be implemented in the next phase');
                };
            }
            
            const compareBtn = document.getElementById('compare-periods-btn');
            if (compareBtn) {
                compareBtn.onclick = function() {
                    debug.log('Compare periods clicked');
                    alert('Period comparison will be implemented in the next phase');
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
                const profitModal = document.getElementById('profit-margin-modal');
                if (e.key === 'Escape' && profitModal && profitModal.style.display === 'flex') {
                    closeProfitModal();
                }
            });
            
            debug.log('Profit modal event handlers setup complete');
            
        } catch (error) {
            debug.error('Failed to setup profit modal events', error);
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

    function switchProfitView(view) {
        const views = document.querySelectorAll('.profit-view');
        views.forEach(v => {
            v.style.display = 'none';
        });
        
        const activeView = document.getElementById(`${view}-view`);
        if (activeView) {
            activeView.style.display = 'block';
        }
    }

    function updateTopProductsDisplay() {
        const customerFilter = document.getElementById('customer-type-filter');
        const customerType = customerFilter ? customerFilter.value : 'all';
        
        const data = calculateProfitMarginData(currentPeriod, customerType);
        if (data && data.productData) {
            updateTopProducts(data.productData);
        }
    }

    // ========================================================
    // MODAL CONTROL FUNCTIONS
    // ========================================================
    function showFinancialSummary() {
        debug.log('Showing financial summary modal');
        
        try {
            if (!financialModal) {
                createFinancialModal();
            }
            
            // Ensure profit modal is closed
            closeProfitModal();
            
            // Show financial modal
            financialModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Load initial data
            loadFinancialData();
            
            debug.log('Financial modal shown successfully');
            
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
                }, 50);
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

    function showProfitMarginAnalysis() {
        debug.log('Showing profit margin analysis modal');
        
        try {
            // Create modal if it doesn't exist
            if (!document.getElementById('profit-margin-modal')) {
                createProfitMarginModal();
            }
            
            // Ensure financial modal is closed
            closeFinancialModal();
            
            const profitModal = document.getElementById('profit-margin-modal');
            if (profitModal) {
                profitModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Load data
                loadProfitData();
            }
            
            debug.log('Profit modal shown successfully');
            
        } catch (error) {
            debug.error('Failed to show profit modal', error);
        }
    }

    function closeProfitModal() {
        debug.log('Closing profit margin modal');
        
        try {
            const profitModal = document.getElementById('profit-margin-modal');
            if (profitModal) {
                profitModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        } catch (error) {
            debug.error('Failed to close profit modal', error);
        }
    }

    function loadProfitData() {
        debug.log('Loading profit margin data');
        
        try {
            const refreshBtn = document.getElementById('refresh-profit-data');
            if (refreshBtn) {
                const originalHtml = refreshBtn.innerHTML;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                refreshBtn.disabled = true;
                
                // Calculate data asynchronously to prevent UI freeze
                setTimeout(() => {
                    try {
                        // Get current filters
                        const customerFilter = document.getElementById('customer-type-filter');
                        const customerType = customerFilter ? customerFilter.value : 'all';
                        
                        // Calculate data
                        const data = calculateProfitMarginData(currentPeriod, customerType);
                        
                        // Update UI
                        updateProfitModal(data);
                        
                        // Reset button
                        refreshBtn.innerHTML = originalHtml;
                        refreshBtn.disabled = false;
                    } catch (error) {
                        debug.error('Error in profit data calculation', error);
                        refreshBtn.innerHTML = originalHtml;
                        refreshBtn.disabled = false;
                    }
                }, 50);
            } else {
                // If no button, just calculate and update
                const customerFilter = document.getElementById('customer-type-filter');
                const customerType = customerFilter ? customerFilter.value : 'all';
                const data = calculateProfitMarginData(currentPeriod, customerType);
                updateProfitModal(data);
            }
            
        } catch (error) {
            debug.error('Failed to load profit data', error);
            
            const refreshBtn = document.getElementById('refresh-profit-data');
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

function getProfitData() {
    try {
        debug.log('Getting profit data for current period:', currentPeriod);
        
        // Get current customer filter
        const customerFilter = document.getElementById('customer-type-filter');
        const customerType = customerFilter ? customerFilter.value : 'all';
        
        return calculateProfitMarginData(currentPeriod, customerType);
    } catch (error) {
        debug.error('Failed to get profit data', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to load profit data'
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
        showProfitMarginAnalysis,
        
        // Data Access
        getFinancialData: function() { return financialData; },
        getProfitData: function() { return profitData; },
        
        // Calculation Functions (for external use/testing)
        calculateFinancialData,
        calculateProfitMarginData,
        
        // Utility Functions (for external use)
        formatCurrency,
        
        // Debug Control
        setDebugMode: function(enabled) { CONFIG.DEBUG = enabled; },
        
        // Configuration
        getConfig: function() { return { ...CONFIG }; }
    };
})();

// Auto-initialize when DOM is ready
//(function() {
 //   if (document.readyState === 'loading') {
//        document.addEventListener('DOMContentLoaded', () => {
//            console.log('[salesAnalytics] DOM ready, initializing module');
 //           window.salesAnalytics = salesAnalytics.init();
 //       });
  //  } else {
 //       console.log('[salesAnalytics] DOM already ready, initializing module');
 //       window.salesAnalytics = salesAnalytics.init();
//    }
//})();

console.log('[salesAnalytics] Module definition complete - Ready for production');
