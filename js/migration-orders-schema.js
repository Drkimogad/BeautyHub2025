// migration-orders-schema.js
const OrderSchemaMigration = (function() {
    
    async function migrateOrdersSchema() {
        console.log('🚀 Starting orders schema migration...');
        
        try {
            // 1. Get all existing orders from localStorage
            const ordersJSON = localStorage.getItem('beautyhub_orders');
            if (!ordersJSON) {
                console.log('📭 No orders found in localStorage');
                return { success: true, migrated: 0 };
            }
            
            const orders = JSON.parse(ordersJSON) || [];
            console.log(`📊 Found ${orders.length} orders to migrate`);
            
            // 2. Migrate each order
            const migratedOrders = orders.map((order, index) => {
                console.log(`🔄 Migrating order ${index + 1}/${orders.length}: ${order.id}`);
                
                const shippingThreshold = 1000;
                const shippingCost = order.totalAmount >= shippingThreshold ? 0 : 50;
                const isFreeShipping = order.totalAmount >= shippingThreshold;
                
                // Generate customerId from phone if not exists
                let customerId = order.customerId;
                if (!customerId && order.customerPhone) {
                    const phoneHash = btoa(order.customerPhone).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
                    const date = new Date(order.createdAt || new Date());
                    const dateStr = date.getFullYear().toString().slice(-2) + 
                                  (date.getMonth() + 1).toString().padStart(2, '0') + 
                                  date.getDate().toString().padStart(2, '0');
                    customerId = `CUST-${dateStr}-${phoneHash}`;
                }
                
                // Update items with new fields if missing
                const updatedItems = order.items ? order.items.map(item => ({
                    ...item,
                    originalPrice: item.originalPrice || item.price,
                    discountPercent: item.discountPercent || 0,
                    finalPrice: item.finalPrice || item.price,
                    isDiscounted: item.isDiscounted || false
                })) : [];
                
                // Return migrated order
                return {
                    ...order,
                    // NEW FIELDS
                    customerId: customerId || `CUST-LEGACY-${index.toString().padStart(4, '0')}`,
                    subtotal: order.subtotal || order.totalAmount,
                    shippingCost: order.shippingCost || shippingCost,
                    shippingThreshold: order.shippingThreshold || shippingThreshold,
                    isFreeShipping: order.isFreeShipping || isFreeShipping,
                    discount: order.discount || 0.00,
                    tax: order.tax || 0.00,
                    totalAmount: order.totalAmount || (order.subtotal || order.totalAmount) + shippingCost,
                    returnPolicy: order.returnPolicy || "No returns on damaged products. 7-day return for unused items with original packaging.",
                    hasDiscount: order.hasDiscount || false,
                    usedFreeShipping: order.usedFreeShipping || isFreeShipping,
                    items: updatedItems,
                    
                    // Ensure status consistency
                    status: order.status || 'pending',
                    updatedAt: new Date().toISOString()
                };
            });
            
            // 3. Save back to localStorage
            localStorage.setItem('beautyhub_orders', JSON.stringify(migratedOrders));
            console.log('✅ Orders migrated in localStorage');
            
            // 4. Migrate to Firestore if enabled
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                await migrateToFirestore(migratedOrders);
            }
            
            console.log(`🎉 Migration complete! ${migratedOrders.length} orders updated`);
            return { 
                success: true, 
                migrated: migratedOrders.length,
                orders: migratedOrders 
            };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async function migrateToFirestore(orders) {
        console.log('🔥 Migrating orders to Firestore...');
        
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            
            orders.forEach(order => {
                const orderRef = db.collection('orders').doc(order.id);
                batch.set(orderRef, order);
            });
            
            await batch.commit();
            console.log(`✅ ${orders.length} orders saved to Firestore`);
            
        } catch (error) {
            console.error('❌ Firestore migration failed:', error);
            throw error;
        }
    }
    
    // Migration for products (add discount fields)
    async function migrateProductsSchema() {
        console.log('🛍️ Starting products schema migration...');
        
        try {
            // Get products from ProductsManager or localStorage
            let products = [];
            
            if (typeof ProductsManager !== 'undefined') {
                products = ProductsManager.products || [];
            } else {
                const productsJSON = localStorage.getItem('beautyhub_products');
                if (productsJSON) {
                    products = JSON.parse(productsJSON) || [];
                }
            }
            
            console.log(`📊 Found ${products.length} products to migrate`);
            
            // Add discount fields to products
            const migratedProducts = products.map(product => ({
                ...product,
                originalPrice: product.originalPrice || product.price,
                discountPercent: product.discountPercent || 0,
                isOnSale: product.isOnSale || false,
                saleEndDate: product.saleEndDate || '',
                tags: product.tags || []
            }));
            
            // Save back
            if (typeof ProductsManager !== 'undefined') {
                // Update ProductsManager
                ProductsManager.products = migratedProducts;
                ProductsManager.saveProducts();
            } else {
                localStorage.setItem('beautyhub_products', JSON.stringify(migratedProducts));
            }
            
            console.log('✅ Products schema migrated');
            return { success: true, products: migratedProducts.length };
            
        } catch (error) {
            console.error('❌ Products migration failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Public API
    return {
        migrateOrdersSchema,
        migrateProductsSchema,
        migrateAll: async function() {
            console.log('🔄 Starting complete schema migration...');
            const ordersResult = await this.migrateOrdersSchema();
            const productsResult = await this.migrateProductsSchema();
            
            return {
                orders: ordersResult,
                products: productsResult,
                complete: ordersResult.success && productsResult.success
            };
        }
    };
})();

// Run migration (call this from console)
// OrderSchemaMigration.migrateAll();
