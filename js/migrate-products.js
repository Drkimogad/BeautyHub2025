// migrate-products.js - One-time migration to Firestore
const ProductMigrator = (function() {
    // Check if Firebase is loaded
    function isFirebaseReady() {
        return typeof firebase !== 'undefined' && 
               firebase.apps && 
               firebase.apps.length > 0 &&
               firebase.firestore;
    }
    
    // Get current products from localStorage
    function getLocalProducts() {
        try {
            const productsJSON = localStorage.getItem('beautyhub_products');
            return productsJSON ? JSON.parse(productsJSON) : [];
        } catch (error) {
            console.error('Error reading local products:', error);
            return [];
        }
    }
    
    // Enhance product with new schema fields
    function enhanceProductSchema(product) {
        return {
            // Keep all existing fields
            id: product.id,
            name: product.name,
            description: product.description || '',
            category: product.category || 'perfumes',
            price: product.price || 0,
            stock: product.stock || 0,
            imageUrl: product.imageUrl || 'gallery/placeholder.jpg',
            isActive: product.isActive !== undefined ? product.isActive : true,
            
            // Add new schema fields with defaults
            originalPrice: product.originalPrice || product.price || 0,
            gallery: product.gallery || [],
            tags: product.tags || [],
            specifications: product.specifications || {},
            lastRestock: product.lastRestock || new Date().toISOString(),
            salesCount: product.salesCount || 0,
            createdAt: product.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    
    // Migrate single product
    async function migrateProduct(product, firestore) {
        try {
            const enhancedProduct = enhanceProductSchema(product);
            
            await firestore.collection('products')
                .doc(product.id)
                .set(enhancedProduct);
            
            console.log(`✓ Migrated: ${product.name}`);
            return { success: true, productId: product.id };
        } catch (error) {
            console.error(`✗ Failed: ${product.name}`, error);
            return { success: false, productId: product.id, error };
        }
    }
    
    // Main migration function
    async function migrateAllProducts() {
        console.log('=== Product Migration Started ===');
        
        // Check requirements
        if (!isFirebaseReady()) {
            console.error('Firebase not loaded. Make sure you are logged into admin.');
            return { success: false, error: 'Firebase not loaded' };
        }
        
        const localProducts = getLocalProducts();
        
        if (localProducts.length === 0) {
            console.error('No local products found to migrate.');
            return { success: false, error: 'No local products' };
        }
        
        console.log(`Found ${localProducts.length} local products to migrate.`);
        
        // Create UI for migration
        createMigrationUI(localProducts.length);
        
        const firestore = firebase.firestore();
        const results = {
            total: localProducts.length,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        // Migrate in batches to avoid timeouts
        const batchSize = 5;
        for (let i = 0; i < localProducts.length; i += batchSize) {
            const batch = localProducts.slice(i, i + batchSize);
            
            const batchPromises = batch.map(product => 
                migrateProduct(product, firestore)
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result.success) {
                    results.successful++;
                    updateProgressUI(results.successful, localProducts.length);
                } else {
                    results.failed++;
                    results.errors.push(result);
                }
            });
            
            // Small delay between batches
            if (i + batchSize < localProducts.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Show completion
        showCompletionUI(results);
        
        console.log('=== Migration Complete ===');
        console.log(`Successful: ${results.successful}/${results.total}`);
        console.log(`Failed: ${results.failed}`);
        
        return results;
    }
    
    // UI for migration progress
    function createMigrationUI(totalProducts) {
        // Remove existing UI if any
        const existingUI = document.getElementById('migration-ui');
        if (existingUI) existingUI.remove();
        
        const ui = document.createElement('div');
        ui.id = 'migration-ui';
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 400px;
            text-align: center;
        `;
        
        ui.innerHTML = `
            <h2 style="color: #333; margin-top: 0;">Product Migration</h2>
            <div style="margin: 1.5rem 0;">
                <div id="migration-progress" style="
                    height: 20px;
                    background: #f0f0f0;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                ">
                    <div id="progress-bar" style="
                        height: 100%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        width: 0%;
                        transition: width 0.3s;
                    "></div>
                </div>
                <div id="progress-text" style="color: #666; font-size: 0.9rem;">
                    Preparing migration...
                </div>
            </div>
            <div id="migration-status" style="
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                font-size: 0.9rem;
                color: #666;
            ">
                <div>Status: <span id="status-text">Initializing...</span></div>
                <div>Products: <span id="count-text">0/${totalProducts}</span></div>
            </div>
            <div id="migration-actions" style="margin-top: 1.5rem;">
                <button id="start-migration" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 1rem;
                ">
                    Start Migration
                </button>
                <button id="cancel-migration" style="
                    background: #ff5252;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(ui);
        
        // Event listeners
        document.getElementById('start-migration').onclick = startMigration;
        document.getElementById('cancel-migration').onclick = cancelMigration;
        
        function startMigration() {
            document.getElementById('start-migration').disabled = true;
            document.getElementById('cancel-migration').textContent = 'Close';
            migrateAllProducts();
        }
        
        function cancelMigration() {
            ui.remove();
        }
    }
    
    function updateProgressUI(current, total) {
        const percentage = Math.round((current / total) * 100);
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const countText = document.getElementById('count-text');
        const statusText = document.getElementById('status-text');
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${percentage}% complete`;
        if (countText) countText.textContent = `${current}/${total}`;
        if (statusText) statusText.textContent = 'Migrating...';
    }
    
    function showCompletionUI(results) {
        const statusDiv = document.getElementById('migration-status');
        const actionsDiv = document.getElementById('migration-actions');
        
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="color: ${results.failed === 0 ? '#4CAF50' : '#ff9800'}; font-weight: 600;">
                    ${results.failed === 0 ? '✓ Migration Successful!' : '⚠ Migration Complete with Errors'}
                </div>
                <div style="margin-top: 0.5rem;">
                    <div>Total Products: ${results.total}</div>
                    <div style="color: #4CAF50;">Successful: ${results.successful}</div>
                    ${results.failed > 0 ? `<div style="color: #ff5252;">Failed: ${results.failed}</div>` : ''}
                </div>
            `;
        }
        
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button onclick="location.reload()" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Reload Page
                </button>
            `;
        }
    }
    
    // Public API
    return {
        startMigration: function() {
            if (!isFirebaseReady()) {
                alert('Please log into admin panel first to load Firebase.');
                return;
            }
            createMigrationUI(0);
            setTimeout(() => migrateAllProducts(), 100);
        },
        checkFirestoreProducts: async function() {
            if (!isFirebaseReady()) return 0;
            
            try {
                const snapshot = await firebase.firestore()
                    .collection('products')
                    .limit(1)
                    .get();
                return snapshot.size;
            } catch (error) {
                console.error('Check failed:', error);
                return 0;
            }
        }
    };
})();

// Add to window for easy access
window.ProductMigrator = ProductMigrator;
