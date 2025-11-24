
"use client";

import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { QuantitySelector } from './QuantitySelector';

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const existingCartItem = cartItems.find(item => item.product.id === product.id);
    const currentQuantityInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (quantity + currentQuantityInCart > product.stock) {
        toast({
            title: "Stock insuficiente",
            description: "Lo sentimos, la cantidad ingresada supera el número de stock disponible",
            variant: "destructive",
        });
        return;
    }
    addToCart(product, quantity);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4">
      <QuantitySelector 
        quantity={quantity} 
        setQuantity={setQuantity} 
        maxQuantity={product.stock} 
      />
      <Button onClick={handleAddToCart} size="lg" className="flex-grow">
          <ShoppingCart className="mr-2 h-5 w-5" /> Añadir al carrito
      </Button>
    </div>
  );
}
