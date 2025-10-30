
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, Ticket, XCircle, Loader2, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCouponByCode } from '@/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, cartCount, appliedCoupon, applyCoupon, removeCoupon, discount, totalPrice, isCouponApplicable } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setIsLoadingCoupon(true);
      try {
        const coupon = await getCouponByCode(couponCode);
        if (coupon) {
            applyCoupon(coupon);
            toast({ title: "Éxito", description: "Cupón aplicado correctamente." });
        } else {
            toast({ title: "Error", description: "El cupón no es válido o ha expirado.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      }
      setIsLoadingCoupon(false);
      setCouponCode("");
  }


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline font-bold mb-8">Tu Carrito de Compras</h1>
      {cartCount === 0 ? (
        <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center gap-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
                <p className="text-muted-foreground">Parece que todavía no has añadido nada.</p>
                <Button asChild className="mt-4">
                    <Link href="/tienda">Empezar a comprar</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map(({ product, quantity }) => (
              <Card key={product.id} className="flex items-center p-4">
                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                    <Image
                      src={product.images[0] ?? "https://placehold.co/100x100.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      data-ai-hint={product.aiHint}
                    />
                </div>
                <div className="flex-1 ml-4">
                  <Link href={`/products/${product.id}`} className="font-semibold hover:text-primary">{product.name}</Link>
                  <p className="text-sm text-muted-foreground">${(product.salePrice ?? product.price).toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value))}
                    className="w-16 h-9 text-center"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCouponApplicable && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            No puedes aplicar cupones cuando hay productos en oferta en tu carrito.
                        </AlertDescription>
                    </Alert>
                )}
                {!appliedCoupon && (
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Código de Cupón" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                            disabled={!isCouponApplicable}
                        />
                        <Button onClick={handleApplyCoupon} disabled={isLoadingCoupon || !couponCode || !isCouponApplicable}>
                            {isLoadingCoupon ? <Loader2 className="animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                 {appliedCoupon && (
                    <div className="flex justify-between items-center text-primary">
                        <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4"/>
                            <span>Cupón: {appliedCoupon.code}</span>
                            <button onClick={removeCoupon} className="text-destructive"><XCircle className="h-4 w-4"/></button>
                        </div>
                        <span>-${discount.toLocaleString('es-AR')}</span>
                    </div>
                 )}
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>A coordinar</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString('es-AR')}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild size="lg" className="w-full">
                  <Link href="/checkout">Proceder al Pago</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
