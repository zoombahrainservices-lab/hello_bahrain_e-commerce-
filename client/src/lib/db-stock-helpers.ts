import { getSupabase } from './db';

/**
 * Stock management helper functions for atomic inventory operations
 * These functions use PostgreSQL RPC functions to ensure atomicity and prevent race conditions
 */

/**
 * Atomically reserves stock for an order
 * Uses PostgreSQL function with row-level locking to prevent overselling
 * 
 * @param productId - UUID of the product
 * @param quantity - Quantity to reserve
 * @returns Promise<{ success: boolean; newStockLevel?: number; error?: string }>
 */
export async function reserveStock(
  productId: string,
  quantity: number
): Promise<{ success: boolean; newStockLevel?: number; error?: string }> {
  try {
    const { data, error } = await getSupabase().rpc('reserve_stock', {
      p_product_id: productId,
      p_quantity: quantity,
    });

    if (error) {
      // Check if it's an insufficient stock error or other error
      const errorMessage = error.message || 'Failed to reserve stock';
      return {
        success: false,
        error: errorMessage,
      };
    }

    // RPC function returns the new stock level
    return {
      success: true,
      newStockLevel: data as number,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to reserve stock',
    };
  }
}

/**
 * Atomically releases reserved stock back to inventory
 * Used when orders are cancelled or reservations expire
 * 
 * @param productId - UUID of the product
 * @param quantity - Quantity to release
 * @returns Promise<{ success: boolean; newStockLevel?: number; error?: string }>
 */
export async function releaseStock(
  productId: string,
  quantity: number
): Promise<{ success: boolean; newStockLevel?: number; error?: string }> {
  try {
    const { data, error } = await getSupabase().rpc('release_stock', {
      p_product_id: productId,
      p_quantity: quantity,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to release stock',
      };
    }

    // RPC function returns the new stock level
    return {
      success: true,
      newStockLevel: data as number,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to release stock',
    };
  }
}

/**
 * Converts reserved inventory to sold status
 * This is a no-op for stock quantity (already reserved), just updates order status
 * Called when payment is confirmed
 * 
 * @param orderId - UUID of the order
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function convertReservedToSold(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getSupabase()
      .from('orders')
      .update({
        inventory_status: 'sold',
        reservation_expires_at: null, // Clear expiry since it's now sold
      })
      .eq('id', orderId)
      .eq('inventory_status', 'reserved'); // Only update if still reserved

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to convert reservation to sold',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to convert reservation to sold',
    };
  }
}

/**
 * Batch reserve stock for multiple products (for order with multiple items)
 * Reserves stock for all items or fails if any reservation fails
 * 
 * @param items - Array of { productId, quantity } objects
 * @returns Promise<{ success: boolean; errors?: Array<{ productId: string; error: string }> }>
 */
export async function reserveStockBatch(
  items: Array<{ productId: string; quantity: number }>
): Promise<{
  success: boolean;
  errors?: Array<{ productId: string; error: string }>;
}> {
  const errors: Array<{ productId: string; error: string }> = [];

  // Try to reserve all items
  for (const item of items) {
    const result = await reserveStock(item.productId, item.quantity);
    if (!result.success) {
      errors.push({
        productId: item.productId,
        error: result.error || 'Failed to reserve stock',
      });
    }
  }

  // If any failed, release all that were successfully reserved (rollback)
  if (errors.length > 0) {
    // Release items that were successfully reserved (before the first failure)
    const failedIndex = items.findIndex(
      (item) =>
        errors.some((err) => err.productId === item.productId) === true
    );
    for (let i = 0; i < failedIndex; i++) {
      await releaseStock(items[i].productId, items[i].quantity);
    }

    return {
      success: false,
      errors,
    };
  }

  return { success: true };
}

/**
 * Batch release stock for multiple products (for order cancellation)
 * 
 * @param items - Array of { productId, quantity } objects
 * @returns Promise<{ success: boolean; errors?: Array<{ productId: string; error: string }> }>
 */
export async function releaseStockBatch(
  items: Array<{ productId: string; quantity: number }>
): Promise<{
  success: boolean;
  errors?: Array<{ productId: string; error: string }>;
}> {
  const errors: Array<{ productId: string; error: string }> = [];

  // Release all items (continue even if some fail, but collect errors)
  for (const item of items) {
    const result = await releaseStock(item.productId, item.quantity);
    if (!result.success) {
      errors.push({
        productId: item.productId,
        error: result.error || 'Failed to release stock',
      });
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return { success: true };
}


