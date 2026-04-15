import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const API_URL = "https://doan-urzg.onrender.com";

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/cart`, {
        withCredentials: true
      });
      setCart(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, variantIndex, quantity = 1) => {
    try {
      await axios.post(
        `${API_URL}/api/cart`,
        {
          product_id: productId,
          variant_index: variantIndex,
          quantity
        },
        {
          withCredentials: true
        }
      );
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }, [API_URL, fetchCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/${cartItemId}`, {
        withCredentials: true
      });
      await fetchCart();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error removing from cart:', error);
    }
  }, [API_URL, fetchCart]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    try {
      await axios.put(
        `${API_URL}/api/cart/${cartItemId}?quantity=${quantity}`,
        {},
        {
          withCredentials: true
        }
      );
      await fetchCart();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating quantity:', error);
    }
  }, [API_URL, fetchCart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const contextValue = useMemo(() => ({ 
    cart, 
    loading, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    fetchCart, 
    cartTotal, 
    cartCount 
  }), [cart, loading, addToCart, removeFromCart, updateQuantity, fetchCart, cartTotal, cartCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};