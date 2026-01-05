# Orders Table Schema Documentation

## Orders Table Columns

Based on all migration files, the `orders` table should have the following columns:

### Core Columns (Base Schema)
- `id` (UUID, PRIMARY KEY) - Unique order identifier
- `user_id` (UUID, FOREIGN KEY to auth.users) - User who placed the order
- `total` (NUMERIC) - Total order amount
- `status` (VARCHAR) - Order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `payment_status` (VARCHAR) - Payment status: 'unpaid', 'paid', 'failed'
- `shipping_address` (JSONB) - Shipping address details
- `created_at` (TIMESTAMP WITH TIME ZONE) - Order creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

### Payment Method Columns
- `payment_method` (VARCHAR(50)) - Payment method: 'cod', 'benefit', 'card', etc.
- `paid_on` (TIMESTAMP WITH TIME ZONE) - When payment was completed
- `payment_raw_response` (JSONB) - Raw payment gateway response

### EazyPay Specific Columns
- `global_transactions_id` (VARCHAR(255)) - EazyPay transaction ID
- `user_token` (VARCHAR(255)) - EazyPay user token
- `dcc_uptake` (VARCHAR(50)) - Dynamic Currency Conversion status
- `dcc_receipt_text` (TEXT) - DCC receipt text

### BENEFIT Pay Specific Columns
- `benefit_payment_id` (TEXT) - BENEFIT Payment ID
- `benefit_track_id` (VARCHAR(50)) - BENEFIT Track ID
- `benefit_trans_id` (TEXT) - BENEFIT Transaction ID
- `benefit_ref` (TEXT) - BENEFIT Reference number
- `benefit_auth_resp_code` (TEXT) - BENEFIT Authorization response code

### Inventory Reservation Columns
- `inventory_status` (ENUM: 'reserved', 'sold', 'released') - Inventory state
- `inventory_reserved_at` (TIMESTAMP WITH TIME ZONE) - When inventory was reserved
- `inventory_released_at` (TIMESTAMP WITH TIME ZONE) - When inventory was released
- `inventory_restored_at` (TIMESTAMP WITH TIME ZONE) - When inventory was restored
- `reservation_expires_at` (TIMESTAMP WITH TIME ZONE) - Reservation expiry time

## Order Items Table Schema

### Core Columns
- `id` (UUID, PRIMARY KEY) - Unique order item identifier
- `order_id` (UUID, FOREIGN KEY to orders.id) - Parent order
- `product_id` (UUID, FOREIGN KEY to products.id) - Product reference
- `name` (VARCHAR/TEXT) - Product name at time of order
- `price` (NUMERIC) - Product price at time of order
- `quantity` (INTEGER) - Quantity ordered
- `image` (TEXT/VARCHAR) - Product image URL
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

## Relationships

- `orders.user_id` → `auth.users.id` (Foreign Key)
- `order_items.order_id` → `orders.id` (Foreign Key, ON DELETE CASCADE likely)
- `order_items.product_id` → `products.id` (Foreign Key)

## Potential Issues

1. **Orders without order_items**: If an order is created but order_items insertion fails, the order might exist without items
2. **RLS Policies**: Row Level Security policies might be blocking some orders
3. **Foreign Key Constraints**: If order_items have strict foreign key constraints, missing items might cause issues
4. **Query Join Behavior**: The `.select('*, order_items (*)')` should do a LEFT JOIN, but we need to verify

## Diagnostic Queries

Run these in Supabase SQL Editor to diagnose:

```sql
-- Check all orders for a specific user
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'YOUR_USER_ID_HERE'
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Check orders without order_items
SELECT o.*
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'YOUR_USER_ID_HERE'
  AND oi.id IS NULL;

-- Check order_items for a specific order
SELECT *
FROM order_items
WHERE order_id = 'ORDER_ID_HERE';
```

