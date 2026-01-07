OrdersManager.js
├── ORDER_SCHEMA (as defined earlier)
│
├── ORDER STATUS FLOW:
│   pending → (paid) → shipped → completed
│
├── PENDING ORDERS VIEW:
│   Each order card shows:
│   ├── Order ID, Customer Name, Total, Date
│   ├── [PAID] button (changes color when clicked)
│   ├── [SHIPPED] button (moves to completed when clicked)
│   └── [DELETE] button (manual, removes from pending)
│
├── COMPLETED ORDERS VIEW:
│   Each order shows:
│   ├── Order ID, Customer Name, Phone, Shipping Date
│   ├── [VIEW DETAILS] button → Modal with:
│   │   ├── Full order details (items, address, notes)
│   │   ├── [PRINT] button
│   │   └── [DELETE] button (optional archive cleanup)
│   └── Shipped status badge
│
├── FUNCTIONS:
│   ├── createOrder(customerData) → saves with "pending" status
│   ├── getOrders(status) → returns filtered orders
│   ├── updateOrderStatus(orderId, newStatus) → updates order
│   ├── markAsPaid(orderId) → updates button color, stays in pending
│   ├── markAsShipped(orderId) → moves to completed
│   ├── deleteOrder(orderId) → removes order
│   ├── getOrderDetails(orderId) → returns full order
│   └── getPendingCount() → for admin badge
│
└── LOCALSTORAGE STRUCTURE:
    ├── beautyhub_orders: [all orders array]
    └── beautyhub_order_id_counter: last used ID
