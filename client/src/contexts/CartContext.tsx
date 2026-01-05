'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hellobahrain_cart';
const CART_SYNC_DEBOUNCE_MS = 500; // Wait 500ms after last change before syncing to DB

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Load cart from database and localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      if (authLoading) {
        // Wait for auth to complete
        return;
      }

      // Load from localStorage first for immediate display
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      let localItems: CartItem[] = [];
      if (savedCart) {
        try {
          localItems = JSON.parse(savedCart);
          setItems(localItems);
        } catch (error) {
          console.error('[Cart] Error loading cart from localStorage:', error);
        }
      }

      // If user is logged in, load from database and merge
      if (user) {
        try {
          console.log('[Cart] Loading cart from database for user:', user.id);
          const response = await api.get('/api/cart');
          const dbItems = response.data.items || [];
          
          if (dbItems.length > 0) {
            console.log('[Cart] Loaded', dbItems.length, 'items from database');
            // Database cart takes precedence
            setItems(dbItems);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dbItems));
          } else if (localItems.length > 0) {
            // If DB is empty but localStorage has items, sync to DB
            console.log('[Cart] Syncing localStorage cart to database');
            await syncCartToDatabase(localItems);
          }
        } catch (error: any) {
          console.error('[Cart] Error loading cart from database:', error);
          // Continue with localStorage cart on error
        }
      }

      setIsInitialized(true);
    };

    loadCart();
  }, [user, authLoading]);

  // Save cart to localStorage whenever it changes (immediate)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Debounced sync to database
  useEffect(() => {
    if (!isInitialized || !user || isSyncingRef.current) {
      return;
    }

    // Clear existing timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    // Set new timer to sync after debounce period
    syncTimerRef.current = setTimeout(() => {
      syncCartToDatabase(items);
    }, CART_SYNC_DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [items, isInitialized, user]);

  // Sync cart to database function
  const syncCartToDatabase = async (cartItems: CartItem[]) => {
    if (!user) return;

    try {
      isSyncingRef.current = true;
      console.log('[Cart] Syncing', cartItems.length, 'items to database');
      await api.post('/api/cart', { items: cartItems });
      console.log('[Cart] Sync successful');
    } catch (error: any) {
      console.error('[Cart] Failed to sync cart to database:', error);
      // Don't show error to user - sync is background operation
    } finally {
      isSyncingRef.current = false;
    }
  };

  const addItem = (product: Product, quantity: number) => {
    setItems((prevItems) => {
      // Check stock availability FIRST
      const maxStock = product.inStock ? product.stockQuantity ?? 0 : 0;
      if (maxStock <= 0) {
        alert('This product is currently out of stock.');
        return prevItems;
      }

      const existingItem = prevItems.find((item) => item.productId === product._id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const desiredQty = currentQty + quantity;

      // Don't allow adding more than stock
      if (desiredQty > maxStock) {
        alert(`Only ${maxStock} units are available in stock.`);
        const newQty = maxStock;

        if (existingItem) {
          return prevItems.map((item) =>
            item.productId === product._id ? { ...item, quantity: newQty } : item
          );
        }

        return [
          ...prevItems,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: newQty,
            image: product.image,
            slug: product.slug,
            stockQuantity: maxStock,
          },
        ];
      }

      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: desiredQty }
            : item
        );
      }

      return [
        ...prevItems,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          slug: product.slug,
          stockQuantity: maxStock,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.productId === productId);
      if (!item) return prevItems;

      if (quantity <= 0) {
        return prevItems.filter((i) => i.productId !== productId);
      }

      const maxStock = item.stockQuantity ?? Infinity;
      let finalQuantity = quantity;

      if (maxStock !== Infinity && quantity > maxStock) {
        alert(`Only ${maxStock} units are available in stock.`);
        finalQuantity = maxStock;
      }

      return prevItems.map((i) =>
        i.productId === productId ? { ...i, quantity: finalQuantity } : i
      );
    });
  };

  const clearCart = async () => {
    setItems([]);
    
    // If user is logged in, also clear cart in database
    if (user) {
      try {
        console.log('[Cart] Clearing cart in database');
        await api.delete('/api/cart');
      } catch (error: any) {
        console.error('[Cart] Failed to clear cart in database:', error);
        // Don't block the UI operation on sync failure
      }
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};


