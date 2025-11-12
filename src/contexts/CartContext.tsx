'use client';

import type { CartItem, Product, Coupon } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  
  const stableSetIsSidebarOpen = useCallback(setIsSidebarOpen, []);

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
      console.error("Failed to parse cart/coupon from localStorage", error);
      localStorage.removeItem('cartItems');
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

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
    toast({ title: "Agregado", description: "El producto fue agregado al carrito." });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
  }, []);

  useEffect(() => {
    const checkPendingOrder = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      
      if (pendingOrderId) {
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

          localStorage.removeItem('pendingOrderId');

          if (data.status === 'approved' || data.status === 'paid') {
            clearCart();
            // Only show toast if NOT on the success page
            if (pathname !== '/checkout/success') {
                toast({ title: "Compra completada", description: "Detectamos que tu pago anterior se procesó con éxito. ¡Gracias!" });
            }
          } else if (['rejected', 'failed', 'pending'].includes(data.status)) {
            if (data.restorableCartItems && data.restorableCartItems.length > 0) {
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
          console.error("Error checking pending order status, will retry on next visit:", error);
        }
      }
    };
    
    checkPendingOrder();
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
