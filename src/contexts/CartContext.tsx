
"use client";

import type { CartItem, Product, Coupon } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon) as Coupon;
        if (new Date(coupon.expiryDate ?? '9999-12-31') > new Date()) {
            setAppliedCoupon(coupon);
        } else {
            localStorage.removeItem('appliedCoupon');
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const isCouponApplicable = useMemo(() => {
    return !cartItems.some(item => item.product.salePrice && item.product.salePrice > 0);
  }, [cartItems]);

  useEffect(() => {
    if (appliedCoupon) {
      if (!isCouponApplicable) {
        removeCoupon();
        toast({
            title: "Cupón removido automáticamente",
            description: "No se pueden usar cupones con productos que ya están en oferta.",
            variant: 'destructive',
        });
      } else {
        localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
      }
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCoupon, isCouponApplicable]);


  const addToCart = (product: Product, quantity = 1) => {
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
    setIsSidebarOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({
      title: "Eliminado",
      description: "El producto fue eliminado del carrito.",
      variant: 'destructive',
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon) => {
    if (!isCouponApplicable) {
        toast({
            title: "No se puede aplicar el cupón",
            description: "No se pueden usar cupones si tu carrito contiene productos que ya están en oferta.",
            variant: "destructive",
        });
        return;
    }
    setAppliedCoupon(coupon);
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Cupón eliminado" });
  }

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
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
          return Math.min(appliedCoupon.discountValue, subtotal); // Cannot discount more than the subtotal
      }
      return 0;
  }, [appliedCoupon, subtotal, isCouponApplicable]);

  const totalPrice = useMemo(() => {
      return subtotal - discount;
  }, [subtotal, discount]);


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal, totalPrice, appliedCoupon, applyCoupon, removeCoupon, discount, isSidebarOpen, setIsSidebarOpen, isCouponApplicable }}>
      {children}
    </CartContext.Provider>
  );
};
