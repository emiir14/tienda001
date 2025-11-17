
"use client";

import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

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
    <div className="flex items-center gap-4">
        <Input 
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={500} // Límite arbitrario para no revelar stock
            className="w-20 text-center"
        />
        <Button onClick={handleAddToCart} size="lg" className="flex-1">
            <ShoppingCart className="mr-2" /> Añadir al carrito
        </Button>
    </div>
  );
}
