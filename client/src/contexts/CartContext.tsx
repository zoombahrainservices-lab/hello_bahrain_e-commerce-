'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';

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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

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

  const clearCart = () => {
    setItems([]);
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


