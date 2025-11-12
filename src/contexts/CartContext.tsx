'use client';

import type { CartItem, Product, Coupon } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// --- DEBUGGING --- 
const log = (message: string, data?: any) => {
  console.log(`[CartContext] ==> ${message}`, data !== undefined ? data : '');
}
// --- END DEBUGGING ---

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  totalPrice: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  discount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isCouponApplicable: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  const stableSetIsSidebarOpen = useCallback(setIsSidebarOpen, []);

  // Hydrate cart from localStorage on initial load
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) setCartItems(JSON.parse(savedCart));
      
      const savedCoupon = localStorage.getItem('appliedCoupon');
      if (savedCoupon) {
          const coupon = JSON.parse(savedCoupon) as Coupon;
          if (new Date(coupon.expiryDate ?? '9999-12-31') > new Date()) {
              setAppliedCoupon(coupon);
          } else {
              localStorage.removeItem('appliedCoupon');
          }
      }
    } catch (error) {
      log("Failed to parse cart/coupon from localStorage", error);
      localStorage.removeItem('cartItems');
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  }, []);

  const clearCart = useCallback(() => {
    log("Executing clearCart()..."); // --- DEBUG LOG
    setCartItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
  }, []);

  // Centralized logic to check and sync order status
  useEffect(() => {
    const checkPendingOrder = async () => {
      log("Effect triggered. Checking for pending order ID...");
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      
      if (pendingOrderId) {
        log(`Found pendingOrderId: ${pendingOrderId}. Fetching status...`);
        try {
          const response = await fetch('/api/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: pendingOrderId }),
          });

          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const data = await response.json();
          log("Received data from /api/order-status:", data);

          localStorage.removeItem('pendingOrderId');
          log("Successfully removed pendingOrderId from localStorage.");

          if (data.status === 'approved' || data.status === 'paid') {
            log(`Status is '${data.status}'. Calling clearCart().`);
            clearCart();
            toast({ title: "Compra completada", description: "Detectamos que tu pago anterior se procesó con éxito. ¡Gracias!" });
          } else if (['rejected', 'failed', 'pending'].includes(data.status)) {
            log(`Status is '${data.status}'. Restoring cart...`);
            if (data.restorableCartItems && data.restorableCartItems.length > 0) {
              // We need to use functional updates here because we are in a useEffect with an empty dependency array
              setCartItems([]); 
              for (const item of data.restorableCartItems) {
                if (item.product && typeof item.quantity === 'number') {
                  addToCart(item.product, item.quantity);
                }
              }
              
              if (data.status !== 'pending') {
                toast({ title: "Carrito restaurado", description: "El pago no se completó y hemos restaurado tu carrito." });
              }
              
              stableSetIsSidebarOpen(true);
            }
          }
        } catch (error) {
          log("Error checking order status. ID will be kept for next visit.", error);
        }
      } else {
        log("No pendingOrderId found.");
      }
    };
    
    checkPendingOrder();
  // **THE FIX**: Use an empty dependency array to FORCE this effect to run once on mount, no matter what.
  // This makes the check robust against navigation issues.
  }, []);

  const isCouponApplicable = useMemo(() => {
    if (!cartItems) return true;
    return !cartItems.some(item => item && item.product && item.product.salePrice && item.product.salePrice > 0);
  }, [cartItems]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    localStorage.removeItem('appliedCoupon');
    toast({ title: "Cupón eliminado" });
  }, [toast]);

  useEffect(() => {
    if (appliedCoupon) {
      if (!isCouponApplicable) {
        removeCoupon();
        toast({ title: "Cupón removido", description: "Los cupones no aplican a productos en oferta.", variant: 'destructive' });
      } else {
        localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
      }
    }
  }, [appliedCoupon, isCouponApplicable, removeCoupon, toast]);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({ title: "Eliminado", description: "El producto fue eliminado del carrito.", variant: 'destructive' });
  }, [toast]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const applyCoupon = useCallback((coupon: Coupon) => {
    if (!isCouponApplicable) {
      toast({ title: "No se puede aplicar", description: "Los cupones no son válidos para carritos con productos en oferta.", variant: "destructive" });
      return;
    }
    setAppliedCoupon(coupon);
  }, [isCouponApplicable, toast]);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
        if (!item || !item.product) return total;
        const price = item.product.salePrice ?? item.product.price;
        return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const discount = useMemo(() => {
      if (!appliedCoupon || !isCouponApplicable) return 0;
      if (appliedCoupon.discountType === 'percentage') {
          return subtotal * (appliedCoupon.discountValue / 100);
      }
      if (appliedCoupon.discountType === 'fixed') {
          return Math.min(appliedCoupon.discountValue, subtotal);
      }
      return 0;
  }, [appliedCoupon, subtotal, isCouponApplicable]);

  const totalPrice = useMemo(() => subtotal - discount, [subtotal, discount]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal, totalPrice, appliedCoupon, applyCoupon, removeCoupon, discount, isSidebarOpen, setIsSidebarOpen: stableSetIsSidebarOpen, isCouponApplicable }}>
      {children}
    </CartContext.Provider>
  );
};
