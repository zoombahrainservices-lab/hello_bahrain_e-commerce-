# Order System Explanation

## 📊 Database Structure

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Points:**
- ✅ **`user_id`** is a foreign key that links each order to a user
- ✅ Uses UUID for both `id` and `user_id`
- ✅ Foreign key constraint ensures data integrity (CASCADE delete)
- ✅ Index on `user_id` for fast queries: `idx_orders_user_id`

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  image VARCHAR(500) NOT NULL,
  created_at TIMESTAMP
);
```

**Key Points:**
- ✅ Each order can have multiple items
- ✅ `order_id` links items to their parent order
- ✅ Product details are stored (name, price, image) for historical accuracy

---

## 🔍 How Orders are Fetched

### 1. User Orders (My Orders Page)
**Endpoint:** `GET /api/orders/my`

**How it works:**
```typescript
// Server: server/src/routes/orders.ts
router.get('/my', async (req: Request, res: Response) => {
  // Gets user ID from authenticated request
  const userId = req.user.id;
  
  // Queries orders WHERE user_id = userId
  const { data } = await getSupabase()
    .from('orders')
    .select('*, order_items (*)')
    .eq('user_id', userId)  // ← Filters by user_id
    .order('created_at', { ascending: false });
    
  // Returns all orders for that user
});
```

**Frontend:** `client/src/app/profile/orders/page.tsx`
- Calls `/api/orders/my`
- Displays all orders for the logged-in user
- Shows order status with color coding
- Shows payment status

### 2. Admin Orders (All Orders)
**Endpoint:** `GET /api/admin/orders`

**How it works:**
```typescript
// Server: server/src/routes/admin.ts
router.get('/orders', async (req: Request, res: Response) => {
  // No user_id filter - gets ALL orders
  const { data } = await getSupabase()
    .from('orders')
    .select('*, users!orders_user_id_fkey(id, name, email), order_items (*)')
    .order('created_at', { ascending: false });
    
  // Returns all orders from all users
});
```

---

## 📝 Order Status System

### Status Values
1. **`pending`** - Order just created, awaiting processing
2. **`processing`** - Order is being prepared
3. **`shipped`** - Order has been shipped
4. **`delivered`** - Order has been delivered
5. **`cancelled`** - Order was cancelled

### Payment Status
1. **`unpaid`** - Payment not yet received
2. **`paid`** - Payment received

### Status Display
- **Pending:** Yellow badge
- **Processing:** Blue badge
- **Shipped:** Purple badge
- **Delivered:** Green badge
- **Cancelled:** Red badge

---

## 🔄 Order Creation Flow

### 1. User Places Order
```typescript
// Frontend: client/src/app/checkout/page.tsx
POST /api/orders
{
  items: [{ productId, quantity }],
  shippingAddress: { ... }
}
```

### 2. Server Creates Order
```typescript
// Server: server/src/routes/orders.ts
1. Validates items and calculates total
2. Creates order record with user_id from authenticated user
3. Creates order_items records
4. Updates product stock quantities
5. Returns complete order
```

### 3. Order Stored in Database
- Order saved with `user_id` linking to user
- Order items saved with `order_id` linking to order
- Stock quantities updated

---

## ✅ Current Implementation Status

### Working Features:
- ✅ Orders are stored with `user_id` in database
- ✅ User orders endpoint filters by `user_id`
- ✅ All user orders display in "My Orders" page
- ✅ Order status is displayed with color coding
- ✅ Payment status is displayed
- ✅ Order items are included
- ✅ Shipping address is included

### Data Flow:
```
User Login → Auth Middleware → Extract user.id
    ↓
GET /api/orders/my
    ↓
Query: WHERE user_id = req.user.id
    ↓
Return all orders for that user
    ↓
Frontend displays all orders with status
```

---

## 🎯 Summary

1. **Orders ARE stored using `user_id`** - Each order has a `user_id` column that references the `users` table
2. **All orders for a user ARE shown** - The `/api/orders/my` endpoint returns all orders where `user_id` matches the logged-in user
3. **Order status IS displayed** - Status is shown with color-coded badges in the orders list
4. **Database relationship** - Foreign key ensures data integrity and enables efficient queries

The system is working correctly! Each user sees only their own orders, and all their orders are displayed with full details including status.




